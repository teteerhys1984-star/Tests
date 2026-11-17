/**
 * Result reporting — the single source of truth for:
 *  · the on-screen breakdown (per question and per sub-part),
 *  · the downloadable UTF-8 TXT report,
 *  · the payload sent to Google Sheets (`lib/submit.ts` reads this report).
 *
 * Question text, answers, marks and rubric notes come verbatim from
 * `src/data/exam.ts` + `src/data/solutions.ts`; nothing is re-worded here.
 */
import { EXAM_TITLE } from "@/config";
import { QUESTIONS, TOTAL_MARKS } from "@/data/exam";
import { SOLUTIONS } from "@/data/solutions";
import type { Attempt, Question, SourceRef, SubItem, Subject } from "@/data/types";
import type { AttemptScore } from "@/lib/grade";
import { formatMarks } from "@/lib/grade";

export type StatusKey = "correct" | "partial" | "wrong" | "unanswered";

export const STATUS_AR: Record<StatusKey, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  wrong: "إجابة خاطئة",
  unanswered: "لم يُجب",
};

export const SUBJECT_AR: Record<Subject, string> = {
  physics: "فيزياء",
  chemistry: "كيمياء",
};

/* ------------------------------------------------------------------ */
/* Plain-text helpers (the TXT report / Sheets payload are text only)  */
/* ------------------------------------------------------------------ */

function texToPlain(tex: string): string {
  return tex
    .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\vec\{([^{}]*)\}/g, "$1")
    .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\^\{?\\circ\}?/g, "°")
    .replace(/_\{([^{}]*)\}/g, "$1")
    .replace(/_([A-Za-z0-9])/g, "$1")
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "")
    .replace(/~/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Converts a source string that may contain [[TeX]] islands to readable text. */
export function plain(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\[(.+?)\]\]/g, (_, tex: string) => texToPlain(tex))
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

/** Plain description of the student's answer for matrices, Lewis pads and drawings. */
export function describeAnswer(sub: SubItem, raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.trim()) return "— لم يُجب —";
  switch (sub.kind) {
    case "matrix": {
      let obj: Record<string, string> = {};
      try {
        obj = JSON.parse(value) as Record<string, string>;
      } catch {
        obj = {};
      }
      const rows = sub.rows ?? [];
      const heads = sub.rowHeader ?? [];
      const perRow = rows[0]?.cells.length ?? 1;
      return rows
        .map((r, ri) => {
          const cells = r.cells.map((_, ci) => {
            const id =
              sub.answer.kind === "matrix" ? (sub.answer.cells[ri * perRow + ci]?.id ?? "") : "";
            const head = plain(sub.headers?.[ci + 1] ?? "");
            return `${head}: ${obj[id] || "—"}`;
          });
          return `${plain(heads[ri] ?? "")} ← ${cells.join(" | ")}`;
        })
        .join("\n");
    }
    case "lewis": {
      try {
        const a = JSON.parse(value) as { shared: number; lone: [number, number] };
        if (sub.answer.kind === "lewis" && sub.answer.single) {
          return `عدد النقاط المرسومة: ${a.shared}`;
        }
        return `أزواج مشتركة: ${a.shared} — أزواج غير مشتركة: ${a.lone?.[0] ?? 0} / ${a.lone?.[1] ?? 0}`;
      } catch {
        return value.trim();
      }
    }
    case "draw": {
      try {
        const a = JSON.parse(value) as { strokes: number; labels: string[] };
        return `عناصر الرسم: ${a.strokes ?? 0} — التسميات: ${a.labels?.join("، ") || "لا توجد"}`;
      } catch {
        return value.trim();
      }
    }
    default:
      return value.trim();
  }
}

/* ------------------------------------------------------------------ */
/* Report model                                                        */
/* ------------------------------------------------------------------ */

export interface ReportCriterion {
  note: string;
  ok: boolean;
}

export interface ReportPart {
  index: number;
  promptText: string;
  student: string;
  correct: string;
  earned: number;
  max: number;
  status: StatusKey;
  criteria: ReportCriterion[];
}

export interface ReportSource {
  unit: string;
  lesson: string;
  page: string;
  source: string;
  skill: string;
  origin: SourceRef["origin"];
  itImage?: number;
  itProblem?: number;
}

export interface ReportQuestion {
  id: string;
  n: number;
  subject: Subject;
  topic: string;
  lesson: string;
  stem: string;
  earned: number;
  max: number;
  parts: ReportPart[];
  source: ReportSource;
}

export interface ReportLesson {
  title: string;
  earned: number;
  max: number;
}

export interface ReportStats {
  correctSubparts: number;
  partialSubparts: number;
  wrongSubparts: number;
  unansweredSubparts: number;
  totalSubparts: number;
}

export interface ExamReport {
  examId: "grade-8-science-test-model-a";
  examTitle: string;
  name: string;
  startedAt: number;
  submittedAt: number;
  elapsedSec: number;
  total: number;
  max: number;
  percentage: number;
  grade: string;
  physics: number;
  chemistry: number;
  fullQuestions: number;
  partialQuestions: number;
  wrongQuestions: number;
  stats: ReportStats;
  lessons: ReportLesson[];
  questions: ReportQuestion[];
}

/**
 * Canonical curriculum lesson label. The five original independent-test
 * problems carry an extra "(اختبار مستقل 1)" parenthetical in their source
 * metadata; it is kept in the per-question source line but folded away when
 * summing marks per lesson so the four curriculum lessons stay comparable.
 */
export function lessonTitle(src: SourceRef): string {
  const match = src.lesson.match(/^(الدرس (?:الأول|الثاني)):\s*([^(]+)/);
  return match ? `${match[1]}: ${match[2].trim()}` : src.lesson;
}

export function statusOf(earned: number, max: number, answered: boolean): StatusKey {
  if (!answered) return "unanswered";
  if (earned >= max - 1e-9) return "correct";
  if (earned > 0) return "partial";
  return "wrong";
}

function isAnsweredValue(sub: SubItem, raw: string): boolean {
  if (!raw.trim()) return false;
  if (sub.kind === "matrix" || sub.kind === "lewis" || sub.kind === "draw") {
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      if (sub.kind === "matrix") {
        const cells = sub.answer.kind === "matrix" ? sub.answer.cells : [];
        return cells.every((c) => String(obj[c.id] ?? "").trim().length > 0);
      }
      if (sub.kind === "lewis") {
        if (sub.answer.kind === "lewis" && sub.answer.single) return Number(obj.shared ?? 0) > 0;
        const lone = Array.isArray(obj.lone) ? obj.lone : [0, 0];
        return Number(obj.shared ?? 0) > 0 || Number(lone[0] ?? 0) > 0 || Number(lone[1] ?? 0) > 0;
      }
      return Number(obj.strokes ?? 0) > 0;
    } catch {
      return false;
    }
  }
  return true;
}

export function buildExamReport(attempt: Attempt, score: AttemptScore): ExamReport {
  const submittedAt = attempt.submittedAt ?? Date.now();
  const questions: ReportQuestion[] = score.perQuestion.map(({ question, awarded, subs }) => {
    const parts: ReportPart[] = question.subs.map((sub, i) => {
      const res = subs[i];
      const raw = typeof attempt.answers[sub.id] === "string" ? String(attempt.answers[sub.id]) : "";
      const answered = isAnsweredValue(sub, raw);
      return {
        index: i + 1,
        promptText: plain(sub.label),
        student: describeAnswer(sub, raw),
        correct: plain(res.expected) || "—",
        earned: res.awarded,
        max: sub.points,
        status: statusOf(res.awarded, sub.points, answered),
        criteria: res.detail.map((d) => ({
          note: plain(d.criterion ?? ""),
          ok: d.ok,
        })),
      };
    });
    return {
      id: question.id,
      n: question.n,
      subject: question.subject,
      topic: `${SUBJECT_AR[question.subject]} — ${lessonTitle(question.src)}`,
      lesson: lessonTitle(question.src),
      stem: plain(question.stem),
      earned: awarded,
      max: question.marks,
      parts,
      source: {
        unit: plain(question.src.unit),
        lesson: plain(question.src.lesson),
        page: plain(question.src.page),
        source: plain(question.src.source),
        skill: plain(question.src.skill),
        origin: question.src.origin,
        itImage: question.src.itImage,
        itProblem: question.src.itProblem,
      },
    };
  });

  const allParts = questions.flatMap((q) => q.parts);
  const stats: ReportStats = {
    correctSubparts: allParts.filter((p) => p.status === "correct").length,
    partialSubparts: allParts.filter((p) => p.status === "partial").length,
    wrongSubparts: allParts.filter((p) => p.status === "wrong").length,
    unansweredSubparts: allParts.filter((p) => p.status === "unanswered").length,
    totalSubparts: allParts.length,
  };

  const fullQuestions = questions.filter((q) => q.earned >= q.max - 1e-9).length;
  const wrongQuestions = questions.filter((q) => q.earned <= 0).length;

  const lessonMap = new Map<string, ReportLesson>();
  for (const q of questions) {
    const row = lessonMap.get(q.lesson) ?? { title: q.lesson, earned: 0, max: 0 };
    row.earned = round2(row.earned + q.earned);
    row.max += q.max;
    lessonMap.set(q.lesson, row);
  }

  return {
    examId: "grade-8-science-test-model-a",
    examTitle: EXAM_TITLE,
    name: attempt.name,
    startedAt: attempt.startedAt,
    submittedAt,
    elapsedSec: Math.max(0, Math.floor((submittedAt - attempt.startedAt) / 1000)),
    total: score.total,
    max: TOTAL_MARKS,
    percentage: Math.round((score.total / TOTAL_MARKS) * 1000) / 10,
    grade: gradeLabel(Math.round((score.total / TOTAL_MARKS) * 1000) / 10),
    physics: score.physics,
    chemistry: score.chemistry,
    fullQuestions,
    partialQuestions: questions.length - fullQuestions - wrongQuestions,
    wrongQuestions,
    stats,
    lessons: [...lessonMap.values()],
    questions,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function gradeLabel(p: number): string {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/* ------------------------------------------------------------------ */
/* TXT report                                                          */
/* ------------------------------------------------------------------ */

const LINE = "=".repeat(78);
const DASH = "-".repeat(78);
const PAD = (label: string) => (label + " ".repeat(24)).slice(0, 24);

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatLong(ms: number): string {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} — ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

export function reportToText(report: ExamReport): string {
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);
  const totalSubs = report.stats.totalSubparts;

  push(LINE);
  push("        تقرير نتيجة اختبار Grade 8 Science Test Model A — الصف الثامن");
  push(LINE);
  push(`${PAD("اسم الطالب/ة")}: ${report.name}`);
  push(`${PAD("عنوان الاختبار")}: ${report.examTitle}`);
  push(`${PAD("معرّف الاختبار")}: ${report.examId}`);
  push(`${PAD("الصف")}: الثامن`);
  push(`${PAD("الفصل الدراسي")}: الأول`);
  push(`${PAD("المادة في الفهرس")}: الفيزياء`);
  push(
    `${PAD("مكوّن المحتوى")}: فيزياء ${formatMarks(report.physics)}/${formatMarks(50)} — كيمياء ${formatMarks(report.chemistry)}/${formatMarks(50)} (كما في المصدر)`,
  );
  push(`${PAD("عدد الأسئلة الرئيسية")}: ${report.questions.length}`);
  push(`${PAD("عدد الفروع المقوّمة")}: ${totalSubs}`);
  push(`${PAD("مجموع العلامات")}: ${formatMarks(TOTAL_MARKS)} علامة`);
  push("");
  push(LINE);
  push("                                  الزمن");
  push(LINE);
  push(`${PAD("بداية الاختبار")}: ${formatLong(report.startedAt)}`);
  push(`${PAD("تسليم الاختبار")}: ${formatLong(report.submittedAt)}`);
  push(`${PAD("المدة المنقضية")}: ${formatClock(report.elapsedSec)}  (HH:MM:SS)`);
  push("");
  push(LINE);
  push("                                النتيجة");
  push(LINE);
  push(`${PAD("العلامة النهائية")}: ${formatMarks(report.total)} من ${formatMarks(report.max)}`);
  push(`${PAD("النسبة المئوية")}: ${report.percentage}%`);
  push(`${PAD("التقدير")}: ${report.grade}`);
  push("");
  push(`${PAD("أسئلة صحيحة بالكامل")}: ${report.fullQuestions}`);
  push(`${PAD("أسئلة صحيحة جزئياً")}: ${report.partialQuestions}`);
  push(`${PAD("أسئلة خاطئة")}: ${report.wrongQuestions}`);
  push("");
  push(`${PAD("فروع إجاباتها صحيحة")}: ${report.stats.correctSubparts}`);
  push(`${PAD("فروع إجاباتها جزئية")}: ${report.stats.partialSubparts}`);
  push(`${PAD("فروع إجاباتها خاطئة")}: ${report.stats.wrongSubparts}`);
  push(`${PAD("فروع لم يُجب عنها")}: ${report.stats.unansweredSubparts}`);
  push("");
  push("توزيع العلامات على الدروس (مجموعها 100):");
  for (const l of report.lessons) {
    push(`  ${l.title.padEnd(34, " ")} : ${formatMarks(l.earned)} / ${formatMarks(l.max)}`);
  }
  push("");
  push(LINE);
  push("                       المراجعة التفصيلية لكل سؤال وفرع");
  push(LINE);

  for (const q of report.questions) {
    push("");
    push(DASH);
    push(`السؤال ${q.n} — ${q.topic}`);
    push(`  العلامة: ${formatMarks(q.earned)} من ${formatMarks(q.max)}`);
    push(`  نص السؤال: ${q.stem}`);
    push(`  المرجع: ${q.source.unit} · ${q.source.lesson} · ${q.source.page} · ${q.source.source}`);
    push(`  المهارة: ${q.source.skill}`);
    push(DASH);

    for (const p of q.parts) {
      push(
        `  المطلب (${p.index}) — [${formatMarks(p.earned)} / ${formatMarks(p.max)}] — ${STATUS_AR[p.status]}`,
      );
      push(`    المطلوب        : ${p.promptText}`);
      push(`    إجابة الطالب   : ${p.student.replace(/\n/g, " | ")}`);
      push(`    الإجابة الصحيحة: ${p.correct}`);
      if (p.criteria.length > 0) {
        push("    معايير التصحيح :");
        for (const c of p.criteria) push(`      ${c.ok ? "[✓]" : "[✗]"} ${c.note}`);
      }
      if (p.status === "partial") {
        push("    ملاحظة        : تحقّق بعض معايير التصحيح فقط، فمُنحت علامة جزئية.");
      }
      push("");
    }

    const sol = SOLUTIONS[q.id];
    if (sol) {
      push("    الحل العلمي النموذجي:");
      sol.steps.forEach((s, i) => push(`      ${i + 1}) ${plain(s)}`));
      if (sol.note) push(`      * ${plain(sol.note)}`);
      push("");
    }
  }

  push(LINE);
  push("                              سلّم التقويم");
  push(LINE);
  push("  · لكل مطلب علامة محدّدة، ومجموع علامات مطالب السؤال يساوي علامة السؤال.");
  push("  · مجموع علامات الأسئلة الأربعة والعشرين يساوي 100 علامة بالضبط.");
  push("  · المسائل الرقمية: العلامة كاملة ضمن مجال السماحية، ونصفها عند خطأ حسابي لا يتجاوز 10%.");
  push("  · الإجابات المكتوبة: تُقوَّم بمجموعات كلمات مفتاحية علمية، ولا يُشترط تطابق الصياغة.");
  push("  · الجداول: العلامة جزئية بحسب عدد الخانات الصحيحة.");
  push("  · الرسوم وتمثيلات لويس: 60% للتسميات و40% لإتمام الإنشاء.");
  push("");
  push(LINE);
  push("                              معلومات التواصل");
  push(LINE);
  push("  المهندس سومر شاهين: 0930215022");
  push("  واتساب: https://wa.me/963930215022");
  push("");
  push(`  أُصدر هذا التقرير بتاريخ: ${formatLong(report.submittedAt)}`);
  push("  تم إنشاء التقرير محلياً داخل متصفّح الطالب، وتُرسَل النتيجة إلكترونياً إلى المعلّم عند التسليم.");
  push(LINE);

  return "\uFEFF" + out.join("\r\n");
}

export function sanitizeName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return cleaned || "Student";
}

export function reportFilename(studentName: string): string {
  return `Grade8_Science_ModelA_${sanitizeName(studentName)}_Results.txt`;
}

/** Triggers the browser download of the UTF-8 (BOM) TXT report. */
export function downloadReport(text: string, filename: string): boolean {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 12000);
    return true;
  } catch {
    return false;
  }
}

/** Sanity checks used by the test suite and before download. */
export function validateReport(text: string, report: ExamReport): string[] {
  const missing: string[] = [];
  const must = [
    report.name,
    report.examTitle,
    report.examId,
    formatLong(report.startedAt),
    formatLong(report.submittedAt),
    formatClock(report.elapsedSec),
    `${report.total}`,
  ];
  for (const m of must) if (m && !text.includes(m)) missing.push(m);
  for (const l of report.lessons) if (!text.includes(l.title)) missing.push(l.title);
  for (const q of report.questions) {
    if (!text.includes(`السؤال ${q.n} —`)) missing.push(`السؤال ${q.n}`);
    for (const p of q.parts) {
      if (!text.includes(`المطلب (${p.index})`)) missing.push(`مطلب ${q.n}-${p.index}`);
      if (!text.includes("الإجابة الصحيحة")) missing.push("الإجابة الصحيحة");
      if (!text.includes("إجابة الطالب")) missing.push("إجابة الطالب");
    }
  }
  return missing;
}

/** All questions in display order — exported for convenience/tests. */
export const ORDERED_QUESTIONS: Question[] = QUESTIONS;

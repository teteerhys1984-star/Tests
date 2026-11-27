import { QUESTIONS } from "../exam/questions";
import { gradeExam, stripMath } from "../exam/grading";
import type { Answers } from "../exam/types";
import { formatDuration } from "./session";

const LINE = "═".repeat(64);
const THIN = "─".repeat(64);

function ar(n: number) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function buildReport(opts: {
  name: string;
  answers: Answers;
  startedAt: number | null;
  submittedAt: number | null;
}): string {
  const { name, answers, startedAt, submittedAt } = opts;
  const grade = gradeExam(QUESTIONS, answers);
  const pct = grade.max ? Math.round((grade.earned / grade.max) * 1000) / 10 : 0;
  const elapsed = startedAt && submittedAt ? submittedAt - startedAt : 0;
  const when = submittedAt ? new Date(submittedAt) : new Date();
  const dateStr = when.toLocaleString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const out: string[] = [];
  out.push(LINE);
  out.push("اختبار الهندسة – الصف الثامن");
  out.push("الوحدة الأولى: متوازيات الأضلاع والانسحاب (الكتاب ص ٥ – ١٩)");
  out.push(LINE);
  out.push(`اسم الطالب        : ${name}`);
  out.push(`تاريخ التسليم     : ${dateStr}`);
  out.push(`الزمن المستغرق    : ${formatDuration(elapsed)}  (HH:MM:SS)`);
  out.push(`العلامة النهائية   : ${ar(grade.earned)} / ${grade.max}`);
  out.push(`النسبة المئوية    : ${pct}%`);
  out.push("");
  out.push("ملخّص العلامات حسب السؤال:");
  out.push(THIN);
  QUESTIONS.forEach((q) => {
    const g = grade.questions.find((x) => x.questionId === q.id)!;
    out.push(
      `  س${q.index} · ${q.title.padEnd(38, " ")} ${ar(g.earned)} / ${q.marks}`,
    );
  });
  out.push(THIN);
  out.push("");

  QUESTIONS.forEach((q) => {
    const g = grade.questions.find((x) => x.questionId === q.id)!;
    out.push(LINE);
    out.push(`السؤال ${q.index}: ${q.title}   [${ar(g.earned)} / ${q.marks}]`);
    out.push(`المرجع: ${q.reference}`);
    out.push(LINE);
    if (q.intro) {
      out.push(stripMath(q.intro));
      out.push("");
    }
    q.parts.forEach((p, i) => {
      const pg = g.parts.find((x) => x.partId === p.id)!;
      out.push(`${q.index}.${i + 1}) ${stripMath(p.prompt)}`);
      out.push(`     العلامة: ${ar(pg.earned)} / ${p.marks}`);
      out.push(`     إجابة الطالب : ${stripMath(pg.studentText)}`);
      out.push(`     الإجابة الصحيحة: ${stripMath(pg.correctText)}`);
      const wrong = pg.lines.filter((l) => l.max > 0 && l.earned < l.max);
      const offOptions = pg.lines.filter((l) => l.max === 0 && !l.ok);
      if (wrong.length || offOptions.length) {
        out.push("     تفصيل الرصد الجزئي:");
        wrong.forEach((l) => out.push(`       • ${l.label} → ${ar(l.earned)} / ${ar(l.max)}`));
        offOptions.forEach((l) => out.push(`       • ${l.label} → اختيار غير مطابق`));
      } else if (pg.earned === p.marks) {
        out.push("     ✓ جميع خطوات هذا الفرع صحيحة.");
      }
      if (pg.earned < p.marks) {
        out.push(`     الشرح: ${stripMath(p.explanation)}`);
      }
      out.push(THIN);
    });
    out.push("");
  });

  out.push(LINE);
  out.push("ملاحظة: أُنشئ هذا التقرير محلياً؛ قد تُرسل النتيجة إلى سجل المعلّم.");
  out.push("المهندس سومر شاهين · 0930215022");
  out.push(LINE);
  return "\uFEFF" + out.join("\r\n");
}

export function reportFilename(name: string, submittedAt: number | null) {
  const d = submittedAt ? new Date(submittedAt) : new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  const safe = (name || "طالب").replace(/[\\/:*?"<>|]/g, "-").trim();
  return `تقرير-${safe}-${stamp}.txt`;
}

export function downloadReport(opts: {
  name: string;
  answers: Answers;
  startedAt: number | null;
  submittedAt: number | null;
}) {
  const text = buildReport(opts);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFilename(opts.name, opts.submittedAt);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
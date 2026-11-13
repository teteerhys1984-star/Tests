/**
 * ما تحصل عليه ورقة إجابة واحدة، بصيغة صغيرة بما يكفي لحفظها وبادقة بما يكفي لكشف أي تغيير.
 *
 * تُستعمل لتسجيل المرجع (tests/make-golden.ts) وللمقارنة (tests/grading.test.ts). لا تستدعي
 * إلا دوالًّ موجودة في النسخة الأصلية من الاختبار، فيمكن تشغيلها على src/ الأصلية وعلى الحالية.
 */
// @ts-nocheck — exam-data.js و report.js ملفّا JavaScript أصليّان بلا أنواع
import path from "node:path";
import { QUESTIONS, GRAPHS, EXAM_META } from "../src/exam-data.js";
import * as R from "../src/report.js";
import { EXAM_DIR, sha256 } from "./harness";
import { PARTS, type Sheet } from "./sheets";

R.bindGraphs(GRAPHS);

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");

/** من أين سُجّل المرجع. */
export const ORIGINAL = {
  note: "الاختبار كما رُفع في المستودع (المجلد grade-7-physics-exam)، قبل إضافة الإرسال إلى المعلّم.",
  commit: "8427a6f1d84b3604998a68c00f06768ea5c1398e",
  path: "grade-7-physics-exam",
};

/** السطر الوحيد في تقرير TXT الذي أُعيدت صياغته عند إضافة الإرسال (لأنه لم يكن صحيحاً). */
export const ORIGINAL_REPORT_NOTE =
  "- هذا التقرير وُلّد محلياً في المتصفح عند التسليم، ولم يُرسل إلى أي جهة خارجية.";
export const CURRENT_REPORT_NOTE =
  "- وُلّد هذا التقرير محلياً في المتصفح عند التسليم، وتُرسَل النتيجة والإجابات إلى المعلّم إلكترونياً.";

/**
 * كل تعديل جرى على ملف أصلي، كما جرى بالضبط: from هو النص الأصلي، وto هو الحالي.
 * يُعيد tests/grading.test.ts تحويل كل to إلى from، ثم يشترط أن يكون الملف مطابقاً للأصل
 * حرفياً، فلا يمكن أن يتغيّر فيه شيء آخر بلا أن يُكتشف.
 */
export const FILE_EDITS: Record<string, { what: string; from: string; to: string }[]> = {
  "src/report.js": [
    {
      what: "تصدير جدول الحالات العربية كي تستعمله حمولة الإرسال (لا تغيير في قيمه)",
      from: "const STATUS_AR = {",
      to: "export const STATUS_AR = {",
    },
    {
      what: "سطر إغلاق التقرير، أُعيدت صياغته لأنّه كان ينفي الإرسال",
      from: ORIGINAL_REPORT_NOTE,
      to: CURRENT_REPORT_NOTE,
    },
  ],
};

/** الملفات التي أُعيدت كتابتها عن قصد لإضافة الإرسال وشريط حالته. */
export const DELIVERY_FILES = ["src/App.tsx", "src/index.css", "src/submit.ts", "src/config.ts"];

/** ساعة ثابتة: يُختم التقرير بالأوقات المذكورة هنا. */
export const STARTED_AT = Date.UTC(2026, 0, 15, 8, 0, 0);
export const SUBMITTED_AT = Date.UTC(2026, 0, 15, 8, 42, 7);
export const STUDENT_NAME = "سارة أحمد";

/** التشغيل مع تجميد Date.now()، فيكون تقرير المحاولة قابلاً لإعادة الإنتاج. */
export function withFixedClock<T>(run: () => T, now: number = SUBMITTED_AT): T {
  const original = Date.now;
  Date.now = () => now;
  try {
    return run();
  } finally {
    Date.now = original;
  }
}

/** جلسة كما يبنيها التطبيق الأصلي تماماً (App.tsx). */
export function sessionFor(attemptId: string) {
  return {
    attemptId,
    studentName: STUDENT_NAME,
    startTs: STARTED_AT,
    submitTs: SUBMITTED_AT,
  };
}

export function orderedQuestions(order: number[]): any[] {
  return order.map((index) => QUESTIONS[index]);
}

/** تصحيح الورقة بالترتيب المعروض، بالدالة الأصلية نفسها. */
export function gradeSheet(sheet: Sheet) {
  const questions = orderedQuestions(sheet.order);
  return R.gradeExam(questions, sheet.answers);
}

export function reportFor(sheet: Sheet, attemptId = "golden-" + sheet.name): string {
  return withFixedClock(() =>
    R.buildReport({
      meta: EXAM_META,
      questions: orderedQuestions(sheet.order),
      answers: sheet.answers,
      session: sessionFor(attemptId),
      results: gradeSheet(sheet),
    })
  );
}

export interface SheetRecord {
  name: string;
  /** sha256 للورقة (الترتيب + الإجابات): يُثبت أن الطرفين صحّحا المدخل نفسه. */
  sheet: string;
  score: number;
  percentage: number;
  /** صحيحة، جزئية، خاطئة، بدون إجابة */
  counts: number[];
  /** علامات كل سؤال بالترتيب المعروض. */
  questions: string;
  /** علامات كل جزء بترتيب بنك الأسئلة. */
  marks: string;
  /** حالة كل جزء بترتيب بنك الأسئلة: c(orrect) p(artial) i(ncorrect) u(nanswered). */
  status: string;
  /** sha256 للنتيجة الكاملة بكل نصوصها. */
  result: string;
  /** sha256 لتقرير TXT المبني للمحاولة. */
  report: string;
}

/** كل ما أنتجه التصحيح، بما فيه كل نص يُعرض على الطالب أو يُكتب في التقرير. */
export function fullResult(results: ReturnType<typeof R.gradeExam>) {
  return {
    score: results.score,
    total: results.total,
    percent: results.percent,
    counts: results.counts,
    details: results.details.map((detail: any) => ({
      qid: detail.qid,
      qNumber: detail.qNumber,
      qTitle: detail.qTitle,
      qMarks: detail.qMarks,
      partId: detail.part.id,
      awarded: detail.awarded,
      status: detail.status,
      studentText: detail.studentText,
      correctText: detail.correctText,
    })),
  };
}

export function describeSheet(sheet: Sheet, reportNote?: { from: string; to: string }): SheetRecord {
  const questions = orderedQuestions(sheet.order);
  const results = withFixedClock(() => R.gradeExam(questions, sheet.answers));
  const detailOf = new Map(results.details.map((detail: any) => [detail.part.id, detail]));
  let report = reportFor(sheet);
  if (reportNote) report = report.split(reportNote.from).join(reportNote.to);
  return {
    name: sheet.name,
    sheet: sha256(JSON.stringify({ order: sheet.order, answers: sheet.answers })),
    score: results.score,
    percentage: Math.round(results.percent * 10) / 10,
    counts: [results.counts.correct, results.counts.partial, results.counts.incorrect, results.counts.unanswered],
    questions: results.details
      .reduce((rows: any[], detail: any) => {
        const row = rows.find((r) => r.qid === detail.qid);
        if (row) row.awarded += detail.awarded;
        else rows.push({ qid: detail.qid, awarded: detail.awarded });
        return rows;
      }, [])
      .map((row: any) => Math.round(row.awarded * 100) / 100)
      .join(","),
    marks: PARTS.map((part: any) => (detailOf.get(part.id) as any)?.awarded ?? "?").join(","),
    status: PARTS.map((part: any) => String((detailOf.get(part.id) as any)?.status ?? "?")[0]).join(""),
    result: sha256(JSON.stringify(fullResult(results))),
    report: sha256(report),
  };
}

/** حجم الورقة كما سُجّل في المرجع. */
export function bankSummary() {
  return {
    questions: QUESTIONS.length,
    parts: PARTS.length,
    totalMarks: QUESTIONS.reduce((sum: number, q: any) => sum + q.marks, 0),
    partsPerQuestion: QUESTIONS.map((q: any) => q.parts.length),
    examId: "grade7-physics-exam",
    reportFile: R.makeFileName(STUDENT_NAME),
  };
}

/**
 * What one answer sheet scores, in a form small enough to commit and precise enough to catch any
 * change: used both to record the fixture (make-golden.ts) and to compare against it
 * (tests/grading.test.ts). Only functions that exist in the original copy of the exam are used
 * here, so the same code runs against the original src/ and against the current one.
 */
import path from "node:path";
import { EXAM_ID, EXAM_VERSION, TOTAL_MARKS, allSubparts, questions } from "../src/data/questions";
import { buildReport, gradeAttempt, reportFilename } from "../src/lib/exam";
import type { Attempt, ExamResult } from "../src/types";
import { EXAM_DIR, sha256 } from "./harness";
import type { Sheet } from "./sheets";

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");

/** Where the committed fixture was recorded from. */
export const ORIGINAL = {
  note: "The exam as uploaded (folder Mia_test), before the folder was renamed and result delivery was added.",
  commit: "6da490f2b62092d5aa6727bebae70e4c49b08176",
  path: "Mia_test",
};

/**
 * Files rewritten on purpose to add result delivery and its banner. They are covered by
 * tests/workflow.test.tsx (behaviour) instead of a byte comparison.
 */
export const DELIVERY_FILES = ["src/App.tsx", "src/screens/Results.tsx", "src/index.css"];

/** The one line of the TXT report that was reworded when result delivery was added. */
export const ORIGINAL_REPORT_NOTE =
  "ملاحظة: أُنشئ هذا التقرير محلياً في المتصفح، ولم يُرسل إلى أي خادم أو خدمة خارجية.";
export const CURRENT_REPORT_NOTE =
  "ملاحظة: أُنشئ هذا التقرير محلياً في متصفح الطالب، وتُرسَل النتيجة أيضاً إلكترونياً إلى المعلّم عند التسليم.";

/**
 * Every other edit made to an original file, exactly as it was made: `from` is the original text,
 * `to` the current one. tests/grading.test.ts turns each `to` back into its `from` and requires the
 * file to be byte-for-byte the original afterwards, so nothing else can have changed unnoticed.
 */
export const FILE_EDITS: Record<string, { what: string; from: string; to: string }[]> = {
  "src/lib/exam.ts": [
    {
      what: "the note line of the TXT report, reworded because the result is now sent to the teacher",
      from: `  lines.push("${ORIGINAL_REPORT_NOTE}");`,
      to: `  lines.push("${CURRENT_REPORT_NOTE}");`,
    },
    {
      what: "loadResult(): a result saved before delivery existed carries no delivery state",
      from: `    return { value: parsed, warning: null };`,
      to: `    // A result saved before delivery existed carries no delivery state.
    if (parsed.delivery !== "pending" && parsed.delivery !== "sent" && parsed.delivery !== "failed") {
      delete parsed.delivery;
    }
    return { value: parsed, warning: null };`,
    },
  ],
  "src/types.ts": [
    {
      what: "the DeliveryState type used by the saved result",
      from: `export type SubpartStatus = "correct" | "partial" | "incorrect" | "unanswered";
`,
      to: `export type SubpartStatus = "correct" | "partial" | "incorrect" | "unanswered";

/**
 * Delivery of the result to the teacher, remembered with the saved result so that reopening the
 * results page does not send an already confirmed result again. It has no effect on marking.
 */
export type DeliveryState = "pending" | "sent" | "failed";
`,
    },
    {
      what: "the optional delivery field of ExamResult",
      from: `  optionOrders: Record<string, string[]>;
}
`,
      to: `  optionOrders: Record<string, string[]>;
  /** State of the delivery of this result to the teacher (absent in results saved before it). */
  delivery?: DeliveryState;
}
`,
    },
  ],
  "src/components/Chrome.tsx": [
    {
      what: "the footer note, reworded because the result is now sent to the teacher",
      from: `          اختبار إلكتروني محلي: يُحفظ التقدم في متصفح هذا الجهاز فقط، ويُنشأ تقرير TXT محلياً. لا توجد
          خدمة إرسال أو قاعدة بيانات خارجية.`,
      to: `          اختبار إلكتروني محلي: يُحفظ التقدم في متصفح هذا الجهاز فقط، ويُنشأ تقرير TXT محلياً، وتُرسَل
          النتيجة إلى المعلّم عند التسليم.`,
    },
  ],
  "src/screens/Welcome.tsx": [
    {
      what: "the note about the TXT report, reworded because the result is now sent to the teacher",
      from: `              والمراجع الداخلية للمعلم. يُنشأ محلياً ولا يُرسل إلى أي جهة.`,
      to: `              والمراجع الداخلية للمعلم. يُنشأ محلياً في متصفحك، وتُرسَل نتيجتك إلى معلّمك عند التسليم.`,
    },
  ],
};

/**
 * The wording edits inside the files that were rewritten for delivery: they cannot be checked
 * byte-wise, so tests/grading.test.ts checks the old sentence is gone and the new one is there.
 */
export const REWORDED_IN_DELIVERY_FILES: Record<string, { what: string; from: string; to: string }[]> = {
  "src/App.tsx": [
    {
      what: "the small footer line, reworded because the result is now sent to the teacher",
      from: `        {questions.length} سؤالاً · بيانات محلية فقط`,
      to: `        {questions.length} سؤالاً · حفظ محلي على الجهاز وإرسال النتيجة إلى المعلّم`,
    },
  ],
  "src/screens/Results.tsx": [
    {
      what: "the closing note of the results page, reworded because the result is now sent",
      from: `        تم إنشاء النتيجة والتقرير محلياً في هذا المتصفح. لا تُرسل النتائج إلى واتساب أو البريد.`,
      to: `        تم إنشاء النتيجة والتقرير محلياً في هذا المتصفح، وتُرسَل النتيجة إلى معلّمك عند التسليم. لا
        تُرسل النتائج إلى واتساب أو البريد.`,
    },
  ],
};

/** Fixed clock: gradeAttempt() stamps submittedAt and durationMs with Date.now(). */
export const STARTED_AT = Date.UTC(2026, 0, 15, 8, 0, 0);
export const SUBMITTED_AT = Date.UTC(2026, 0, 15, 8, 42, 7);

/** Runs with Date.now() frozen, so a graded attempt and its report are reproducible. */
export function withFixedClock<T>(run: () => T, now: number = SUBMITTED_AT): T {
  const original = Date.now;
  Date.now = () => now;
  try {
    return run();
  } finally {
    Date.now = original;
  }
}

/** A submitted attempt holding the sheet's answers, with a fixed name, id and times. */
export function attemptFor(sheet: Sheet): Attempt {
  return {
    examId: EXAM_ID,
    version: EXAM_VERSION,
    attemptId: "golden-" + sheet.name,
    studentName: "ميا التجريبية",
    startedAt: STARTED_AT,
    savedAt: STARTED_AT,
    currentIndex: 0,
    visited: [],
    questionOrder: [...sheet.order],
    optionOrders: {},
    answers: sheet.answers,
    mode: "exam",
  };
}

/** Everything the marking produced, including every text shown to the student. */
export function fullResult(result: ExamResult) {
  return {
    examId: result.examId,
    version: result.version,
    attemptId: result.attemptId,
    studentName: result.studentName,
    startedAt: result.startedAt,
    submittedAt: result.submittedAt,
    durationMs: result.durationMs,
    score: result.score,
    maxScore: result.maxScore,
    percentage: result.percentage,
    counts: result.counts,
    questionOrder: result.questionOrder,
    subparts: result.subparts.map((part) => ({
      subpartId: part.subpartId,
      questionId: part.questionId,
      prompt: part.prompt,
      status: part.status,
      awarded: part.awarded,
      max: part.max,
      studentDisplay: part.studentDisplay,
      correctDisplay: part.correctDisplay,
      explanation: part.explanation,
      page: part.page,
    })),
  };
}

export interface SheetRecord {
  name: string;
  /** sha256 of the sheet (question order + answers): proves both sides marked the same input. */
  sheet: string;
  score: number;
  percentage: number;
  /** correct, partial, incorrect, unanswered */
  counts: number[];
  /** Marks awarded to each question, in bank order. */
  questions: string;
  /** Marks awarded to each part, in bank order. */
  marks: string;
  /** Status of each part, in bank order: c(orrect) p(artial) i(ncorrect) u(nanswered). */
  status: string;
  /** sha256 of fullResult(). */
  result: string;
  /** sha256 of the TXT report built for attemptFor(sheet). */
  report: string;
}

/** Name of the TXT file offered for the student of attemptFor(). */
export function goldenReportFile(): string {
  return reportFilename("ميا التجريبية");
}

export function describeSheet(sheet: Sheet, reportNote?: { from: string; to: string }): SheetRecord {
  const attempt = attemptFor(sheet);
  const result = withFixedClock(() => gradeAttempt(attempt));
  const partOf = new Map(result.subparts.map((part) => [part.subpartId, part]));
  const awardedByQuestion = new Map<number, number>();
  for (const question of questions) {
    awardedByQuestion.set(
      question.id,
      result.subparts.filter((part) => part.questionId === question.id).reduce((sum, part) => sum + part.awarded, 0)
    );
  }
  let report = withFixedClock(() => buildReport(result));
  if (reportNote) report = report.split(reportNote.from).join(reportNote.to);
  return {
    name: sheet.name,
    sheet: sha256(JSON.stringify({ order: sheet.order, answers: sheet.answers })),
    score: result.score,
    percentage: result.percentage,
    counts: [result.counts.correct, result.counts.partial, result.counts.incorrect, result.counts.unanswered],
    questions: questions.map((question) => awardedByQuestion.get(question.id) ?? "?").join(","),
    marks: allSubparts.map(({ subpart }) => partOf.get(subpart.id)?.awarded ?? "?").join(","),
    status: allSubparts.map(({ subpart }) => (partOf.get(subpart.id)?.status ?? "?")[0]).join(""),
    result: sha256(JSON.stringify(fullResult(result))),
    report: sha256(report),
  };
}

/** Size of the paper, as recorded in the fixture. */
export function bankSummary() {
  return {
    questions: questions.length,
    subparts: allSubparts.length,
    totalMarks: TOTAL_MARKS,
    topics: new Set(questions.map((question) => question.topic)).size,
    reportFile: goldenReportFile(),
  };
}

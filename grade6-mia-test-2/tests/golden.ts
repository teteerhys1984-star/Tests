/**
 * What one answer sheet scores, in a form small enough to commit and precise enough to catch any
 * change: used both to record the fixture (make-golden.ts) and to compare against it
 * (tests/grading.test.ts). Only functions that exist in the original copy of the exam are used
 * here, so the same code runs against the original src/ and against the current one.
 */
import path from "node:path";
import { EXAM_ID, EXAM_VERSION, QUESTIONS, TOTAL_MARKS, TOTAL_PARTS } from "../src/exam/data";
import type { Attempt } from "../src/exam/attempt";
import { gradeAttempt, type GradeResult } from "../src/exam/grade";
import { buildReport, reportFilename } from "../src/exam/report";
import { EXAM_DIR, sha256 } from "./harness";
import { PARTS, type Sheet } from "./sheets";

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");

/** Where the committed fixture was recorded from. */
export const ORIGINAL = {
  note: "The exam as uploaded (folder Mia_test2), before the folder was renamed and result delivery was added.",
  commit: "6da490f2b62092d5aa6727bebae70e4c49b08176",
  path: "Mia_test2",
};

/**
 * Files rewritten on purpose to add result delivery and its banner. They are covered by
 * tests/workflow.test.tsx (behaviour) instead of a byte comparison.
 */
export const DELIVERY_FILES = ["src/App.tsx", "src/components/Results.tsx", "src/index.css"];

/** The one line of the TXT report that was reworded when result delivery was added. */
export const ORIGINAL_REPORT_NOTE =
  "نهاية التقرير — تم إنشاؤه محلياً داخل المتصفح دون إرسال أي بيانات.";
export const CURRENT_REPORT_NOTE =
  "نهاية التقرير — أُنشئ هذا التقرير محلياً في متصفح الطالب، وتُرسَل النتيجة أيضاً إلكترونياً إلى المعلّم عند التسليم.";

/**
 * Every other edit made to an original file, exactly as it was made: `from` is the original text,
 * `to` the current one. tests/grading.test.ts turns each `to` back into its `from` and requires the
 * file to be byte-for-byte the original afterwards, so nothing else can have changed unnoticed.
 */
export const FILE_EDITS: Record<string, { what: string; from: string; to: string }[]> = {
  "src/exam/attempt.ts": [
    {
      what: "the DeliveryState type of a submitted attempt",
      from: `import type { Answers } from "./grade";

export interface Attempt {`,
      to: `import type { Answers } from "./grade";

/** Delivery state of a submitted attempt: whether its result reached the teacher's sheet. */
export type DeliveryState = "pending" | "sent" | "failed";

export interface Attempt {`,
    },
    {
      what: "the optional delivery field of Attempt",
      from: `  startSoundPlayed: boolean;
}
`,
      to: `  startSoundPlayed: boolean;
  /** Only set once the attempt is submitted; added with result delivery. */
  delivery?: DeliveryState;
}
`,
    },
    {
      what: "loadAttempt(): an attempt submitted before delivery existed counts as undelivered",
      from: `      startSoundPlayed: true,
    };

    return {`,
      to: `      startSoundPlayed: true,
    };
    // An attempt submitted before delivery existed carries no delivery state: it counts as
    // undelivered, so its result is sent again on load (the server ignores a repeated attemptId).
    if (status === "submitted") {
      attempt.delivery =
        parsed.delivery === "sent" || parsed.delivery === "failed" ? parsed.delivery : "pending";
    }

    return {`,
    },
  ],
  "src/exam/report.ts": [
    {
      what: "the closing line of the TXT report, reworded because the result is now sent to the teacher",
      from: `  out.push(line("${ORIGINAL_REPORT_NOTE}"));`,
      to: `  out.push(
    line(
      "${CURRENT_REPORT_NOTE}"
    )
  );`,
    },
  ],
  "src/components/Welcome.tsx": [
    {
      what: "the note about local saving, reworded because the result is now sent to the teacher",
      from: `                الحفظ التلقائي محلي على هذا المتصفح فقط، ولا تُرسل الإجابات إلى أي خدمة خارجية.`,
      to: `                الحفظ التلقائي محلي على هذا المتصفح، وتُرسَل نتيجتك إلى معلّمك عند التسليم.`,
    },
  ],
};

/**
 * The wording edits inside the files that were rewritten for delivery: they cannot be checked
 * byte-wise, so tests/grading.test.ts checks the old sentence is gone and the new one is there.
 */
export const REWORDED_IN_DELIVERY_FILES: Record<string, { what: string; from: string; to: string }[]> = {
  "src/components/Results.tsx": [
    {
      what: "the note under the report buttons, reworded because the result is now sent",
      from: `                أُعدّ التقرير محلياً داخل المتصفح، ولم تُرسل الإجابات إلى أي خدمة خارجية.`,
      to: `                أُعدّ التقرير محلياً داخل المتصفح، وتُرسَل نتيجتك إلى معلّمك عند التسليم.`,
    },
  ],
};

/** Fixed clock: the attempt and its report are stamped with the times given here. */
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
    answers: sheet.answers,
    questionOrder: [...sheet.order],
    optionOrders: {},
    currentIndex: 0,
    visited: [0],
    startTimestamp: STARTED_AT,
    submittedAt: SUBMITTED_AT,
    status: "submitted",
    lastSavedAt: SUBMITTED_AT,
    startSoundPlayed: true,
  };
}

/** Everything the marking produced, including every text shown to the student. */
export function fullResult(result: GradeResult) {
  return {
    score: result.score,
    totalMarks: result.totalMarks,
    percentage: result.percentage,
    correct: result.correct,
    partial: result.partial,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    answeredParts: result.answeredParts,
    totalParts: result.totalParts,
    questions: result.questions.map((question) => ({
      questionId: question.question.id,
      position: question.position,
      awarded: question.awarded,
      max: question.max,
      parts: question.parts.map((part) => ({
        partId: part.partId,
        questionId: part.questionId,
        partLabel: part.partLabel,
        status: part.status,
        answered: part.answered,
        awarded: part.awarded,
        max: part.max,
        givenText: part.givenText,
        correctText: part.correctText,
      })),
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
  const result = withFixedClock(() => gradeAttempt(attempt.answers, attempt.questionOrder));
  const partOf = new Map(result.questions.flatMap((question) => question.parts).map((part) => [part.partId, part]));
  const awardedByQuestion = new Map(result.questions.map((question) => [question.question.id, question.awarded]));
  let report = withFixedClock(() => buildReport(attempt, result));
  if (reportNote) report = report.split(reportNote.from).join(reportNote.to);
  return {
    name: sheet.name,
    sheet: sha256(JSON.stringify({ order: sheet.order, answers: sheet.answers })),
    score: result.score,
    percentage: result.percentage,
    counts: [result.correct, result.partial, result.incorrect, result.unanswered],
    questions: QUESTIONS.map((question) => awardedByQuestion.get(question.id) ?? "?").join(","),
    marks: PARTS.map((part) => partOf.get(part.id)?.awarded ?? "?").join(","),
    status: PARTS.map((part) => (partOf.get(part.id)?.status ?? "?")[0]).join(""),
    result: sha256(JSON.stringify(fullResult(result))),
    report: sha256(report),
  };
}

/** Size of the paper, as recorded in the fixture. */
export function bankSummary() {
  return {
    questions: QUESTIONS.length,
    parts: TOTAL_PARTS,
    totalMarks: TOTAL_MARKS,
    topics: new Set(QUESTIONS.map((question) => question.topic)).size,
    reportFile: goldenReportFile(),
  };
}

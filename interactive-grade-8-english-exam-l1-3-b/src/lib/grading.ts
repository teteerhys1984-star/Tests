import {
  LESSONS,
  QUESTIONS,
  questionMarks,
  type ChoicePart,
  type LessonId,
  type Part,
  type Question,
} from "@/data/exam";

/* ------------------------------------------------------------------ */
/* External answer-key override (preserves src/data/exam.ts verbatim)  */
/* ------------------------------------------------------------------ */

/**
 * In the original source `src/data/exam.ts`, Q4 (`q4p1`) reorders Student's Book
 * p. 8 · Reading B options to `["used less than", "used the same as", "never used as"]`
 * while keeping `answer: 1` ("used the same as"), contradicting both the passage and
 * Q4's own explanation ("so technology was used less than it is used today").
 * Fixing the index binding here keeps `src/data/exam.ts` byte-for-byte identical.
 */
export const CHOICE_ANSWER_OVERRIDES: Readonly<Record<string, number>> = {
  q4p1: 0,
};

export function effectiveChoiceAnswer(part: ChoicePart): number {
  const override = CHOICE_ANSWER_OVERRIDES[part.id];
  return override !== undefined ? override : part.answer;
}

export function correctAnswerText(part: Part): string {
  if (part.kind === "choice") {
    return part.options[effectiveChoiceAnswer(part)];
  }
  return part.answers[0];
}

/**
 * Splits a `kind: "text"` stem into static chunks surrounding each inline input.
 * Source items Q8, Q11, Q12, Q16–Q18, Q20 and Q29 use `[[blank]]` (and Q11/Q12/Q17
 * also contain single continuation ellipses `…`), whereas Q3 (`q3p1`, `q3p2`) and
 * Q23 (`q23p1`, `q23p2`) use repeated ellipsis runs (`……………`) without `[[blank]]`.
 */
export function splitTextStem(stem: string): string[] {
  if (stem.includes("[[blank]]")) {
    return stem.split("[[blank]]");
  }
  if (/…{2,}/.test(stem)) {
    return stem.split(/…{2,}/);
  }
  return [stem, ""];
}

export function partPromptText(part: Part): string {
  if (part.kind === "choice") return part.stem;
  const raw = part.prompt ?? part.stem ?? "";
  return raw.replace(/\[\[blank\]\]/g, "……………");
}

/* ------------------------------------------------------------------ */
/* Answer normalisation                                                */
/* ------------------------------------------------------------------ */

/**
 * Canonical form used for every typed comparison:
 * lower-case, curly quotes straightened, whitespace collapsed,
 * surrounding punctuation and apostrophes removed
 * ("didn't" and "didnt" therefore compare equal).
 */
export function canonical(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc\u0060]/g, "'")
    .replace(/[\u201c\u201d\u0022]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .replace(/'/g, "")
    .trim();
}

export function isPartAnswered(part: Part, value: string | undefined): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (part.kind === "choice") {
    const idx = Number(trimmed);
    return Number.isInteger(idx) && idx >= 0 && idx < part.options.length;
  }
  return true;
}

export function isQuestionAnswered(q: Question, answers: Record<string, string>): boolean {
  return q.parts.every((p) => isPartAnswered(p, answers[p.id]));
}

export function isQuestionPartial(q: Question, answers: Record<string, string>): boolean {
  const done = q.parts.filter((p) => isPartAnswered(p, answers[p.id])).length;
  return done > 0 && done < q.parts.length;
}

export function isExamComplete(answers: Record<string, string>): boolean {
  return QUESTIONS.every((q) => isQuestionAnswered(q, answers));
}

export function answeredCount(answers: Record<string, string>): number {
  return QUESTIONS.filter((q) => isQuestionAnswered(q, answers)).length;
}

export function answeredPartCount(answers: Record<string, string>): number {
  return QUESTIONS.reduce(
    (sum, q) => sum + q.parts.filter((p) => isPartAnswered(p, answers[p.id])).length,
    0,
  );
}

/* ------------------------------------------------------------------ */
/* Marking                                                             */
/* ------------------------------------------------------------------ */

export const STATUS_AR = {
  correct: "إجابة صحيحة",
  wrong: "إجابة خاطئة",
  unanswered: "لم يُجب",
} as const;

export type PartStatusKey = keyof typeof STATUS_AR;

export interface PartResult {
  partId: string;
  label: string;
  promptText: string;
  questionN: number;
  student: string;
  correct: string;
  earned: number;
  max: number;
  ok: boolean;
  answered: boolean;
  status: PartStatusKey;
}

export interface QuestionResult {
  n: number;
  lesson: LessonId;
  topic: string;
  source: string;
  instruction: string;
  questionText: string;
  earned: number;
  max: number;
  ok: boolean;
  partial: boolean;
  parts: PartResult[];
  explanation: string;
}

export interface ExamReport {
  name: string;
  startedAt: number;
  submittedAt: number;
  timeSpentSeconds: number;
  total: number;
  maxTotal: number;
  percentage: number;
  gradeLabel: string;
  correctCount: number;
  incorrectCount: number;
  wrongAnsweredCount: number;
  unansweredCount: number;
  fullQuestions: number;
  partialQuestions: number;
  wrongQuestions: number;
  lessons: { id: LessonId; title: string; earned: number; max: number }[];
  questions: QuestionResult[];
}

/** Exact grade band thresholds from `grade5-math-unit1/src/exam/report.ts`. */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

function displayAnswer(part: Part, value: string | undefined): string {
  if (!isPartAnswered(part, value)) return "(no answer)";
  if (part.kind === "choice") return part.options[Number((value as string).trim())];
  return (value ?? "").trim();
}

function partLabel(part: Part, total: number): string {
  if (total === 1) return "Answer";
  const idx = Number(part.id.split("p").pop() ?? "1");
  return `Part ${String.fromCharCode(96 + idx)}`;
}

function questionText(q: Question): string {
  return q.parts.map((p) => partPromptText(p)).join("  ||  ");
}

export function gradePart(part: Part, raw: string | undefined): boolean {
  if (!isPartAnswered(part, raw)) return false;
  const value = raw as string;
  if (part.kind === "choice") {
    return Number(value.trim()) === effectiveChoiceAnswer(part);
  }

  const student = canonical(value);
  if (student.length === 0) return false;

  if (part.mode === "includes") {
    return part.answers.some((a) => {
      const key = canonical(a);
      return key.length > 0 && student.includes(key);
    });
  }
  return part.answers.some((a) => canonical(a) === student);
}

export function gradeQuestion(q: Question, answers: Record<string, string>): QuestionResult {
  const parts: PartResult[] = q.parts.map((part) => {
    const raw = answers[part.id];
    const answered = isPartAnswered(part, raw);
    const ok = answered && gradePart(part, raw);
    const status: PartStatusKey = !answered ? "unanswered" : ok ? "correct" : "wrong";
    return {
      partId: part.id,
      label: partLabel(part, q.parts.length),
      promptText: partPromptText(part),
      questionN: q.n,
      student: displayAnswer(part, raw),
      correct: correctAnswerText(part),
      earned: ok ? part.marks : 0,
      max: part.marks,
      ok,
      answered,
      status,
    };
  });
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  const max = questionMarks(q);
  return {
    n: q.n,
    lesson: q.lesson,
    topic: q.topic,
    source: q.source,
    instruction: q.instruction,
    questionText: questionText(q),
    earned,
    max,
    ok: earned === max,
    partial: earned > 0 && earned < max,
    parts,
    explanation: q.explanation,
  };
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export function buildReport(
  name: string,
  answers: Record<string, string>,
  submittedAt: number,
  timeSpentSeconds: number,
  startedAt?: number,
): ExamReport {
  const safeElapsed = Math.max(0, Math.floor(timeSpentSeconds));
  const resolvedStart =
    typeof startedAt === "number" ? startedAt : submittedAt - safeElapsed * 1000;
  const questions = QUESTIONS.map((q) => gradeQuestion(q, answers));
  const total = questions.reduce((s, q) => s + q.earned, 0);
  const maxTotal = questions.reduce((s, q) => s + q.max, 0);
  const percentage = maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100);

  const lessons = LESSONS.map((l) => {
    const rows = questions.filter((q) => q.lesson === l.id);
    return {
      id: l.id,
      title: l.title,
      earned: rows.reduce((s, q) => s + q.earned, 0),
      max: rows.reduce((s, q) => s + q.max, 0),
    };
  });

  let correctCount = 0;
  let wrongAnsweredCount = 0;
  let unansweredCount = 0;
  for (const q of questions) {
    for (const p of q.parts) {
      if (p.status === "correct") correctCount++;
      else if (p.status === "unanswered") unansweredCount++;
      else wrongAnsweredCount++;
    }
  }

  const fullQuestions = questions.filter((q) => q.ok).length;
  const partialQuestions = questions.filter((q) => q.partial).length;
  const wrongQuestions = questions.filter((q) => q.earned === 0).length;

  return {
    name,
    startedAt: resolvedStart,
    submittedAt,
    timeSpentSeconds: safeElapsed,
    total,
    maxTotal,
    percentage,
    gradeLabel: gradeLabel(percentage),
    correctCount,
    incorrectCount: wrongAnsweredCount + unansweredCount,
    wrongAnsweredCount,
    unansweredCount,
    fullQuestions,
    partialQuestions,
    wrongQuestions,
    lessons,
    questions,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

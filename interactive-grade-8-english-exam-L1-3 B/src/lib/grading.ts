import {
  LESSONS,
  QUESTIONS,
  questionMarks,
  type LessonId,
  type Part,
  type Question,
} from "../data/exam";

/* ------------------------------------------------------------------ */
/* Answer normalisation                                                */
/* ------------------------------------------------------------------ */

/**
 * Canonical form used for every comparison:
 * lower-case, curly quotes straightened, whitespace collapsed,
 * surrounding punctuation and apostrophes removed
 * ("didn't" and "didnt" therefore compare equal).
 */
export function canonical(input: string): string {
  let s = String(input ?? "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc\u0060]/g, "'")
    .replace(/[\u201c\u201d\u0022]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .replace(/'/g, "")
    .trim();
  return s;
}

export function isPartAnswered(part: Part, value: string | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (part.kind === "choice") {
    const idx = Number(value);
    return value !== "" && Number.isInteger(idx) && idx >= 0 && idx < part.options.length;
  }
  return value.trim().length > 0;
}

export function isQuestionAnswered(q: Question, answers: Record<string, string>): boolean {
  return q.parts.every((p) => isPartAnswered(p, answers[p.id]));
}

export function answeredCount(answers: Record<string, string>): number {
  return QUESTIONS.filter((q) => isQuestionAnswered(q, answers)).length;
}

/* ------------------------------------------------------------------ */
/* Marking                                                             */
/* ------------------------------------------------------------------ */

export interface PartResult {
  partId: string;
  label: string;
  questionN: number;
  student: string;
  correct: string;
  earned: number;
  max: number;
  ok: boolean;
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
  parts: PartResult[];
  explanation: string;
}

export interface ExamReport {
  name: string;
  submittedAt: number;
  timeSpentSeconds: number;
  total: number;
  maxTotal: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  lessons: { id: LessonId; title: string; earned: number; max: number }[];
  questions: QuestionResult[];
}

function displayAnswer(part: Part, value: string | undefined): string {
  if (!isPartAnswered(part, value)) return "(no answer)";
  if (part.kind === "choice") return part.options[Number(value)];
  return (value ?? "").trim();
}

function correctAnswer(part: Part): string {
  if (part.kind === "choice") return part.options[part.answer];
  return part.answers[0];
}

function partLabel(part: Part, total: number): string {
  if (total === 1) return "Answer";
  const idx = Number(part.id.split("p").pop() ?? "1");
  return `Part ${String.fromCharCode(96 + idx)}`;
}

function questionText(q: Question): string {
  return q.parts
    .map((p) => (p.kind === "choice" ? p.stem : (p.prompt ?? p.stem ?? "")))
    .join("  ||  ");
}

export function gradeQuestion(q: Question, answers: Record<string, string>): QuestionResult {
  const parts: PartResult[] = q.parts.map((part) => {
    const raw = answers[part.id] ?? "";
    const ok = gradePart(part, raw);
    return {
      partId: part.id,
      label: partLabel(part, q.parts.length),
      questionN: q.n,
      student: displayAnswer(part, raw),
      correct: correctAnswer(part),
      earned: ok ? part.marks : 0,
      max: part.marks,
      ok,
    };
  });
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  return {
    n: q.n,
    lesson: q.lesson,
    topic: q.topic,
    source: q.source,
    instruction: q.instruction,
    questionText: questionText(q),
    earned,
    max: questionMarks(q),
    ok: earned === questionMarks(q),
    parts,
    explanation: q.explanation,
  };
}

export function gradePart(part: Part, raw: string | undefined): boolean {
  if (!isPartAnswered(part, raw)) return false;
  const value = raw as string;
  if (part.kind === "choice") return Number(value) === part.answer;

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

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export function buildReport(
  name: string,
  answers: Record<string, string>,
  submittedAt: number,
  timeSpentSeconds: number,
): ExamReport {
  const questions = QUESTIONS.map((q) => gradeQuestion(q, answers));
  const total = questions.reduce((s, q) => s + q.earned, 0);
  const maxTotal = questions.reduce((s, q) => s + q.max, 0);

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
  let incorrectCount = 0;
  questions.forEach((q) =>
    q.parts.forEach((p) => (p.ok ? correctCount++ : incorrectCount++)),
  );

  return {
    name,
    submittedAt,
    timeSpentSeconds,
    total,
    maxTotal,
    percentage: maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100),
    correctCount,
    incorrectCount,
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

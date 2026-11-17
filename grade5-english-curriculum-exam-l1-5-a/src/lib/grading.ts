import type { Part, Question } from "@/data/exam";

/** Normalise a pupil answer so that harmless differences do not lose marks. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'") // curly apostrophes
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?!.]+$/g, "") // trailing punctuation
    .trim();
}

/** Token-level normalisation used by the word-ordering widget. */
export function normalizeTokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter(Boolean)
    .map((t) => t.replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, ""))
    .filter(Boolean);
}

export function acceptedAnswers(part: Part): string[] {
  switch (part.type) {
    case "mcq":
    case "tf":
      return [part.answer];
    case "text":
      return [part.answer, ...(part.accepted ?? [])];
    case "order":
      return [part.answer];
    case "rubric":
      return [];
  }
}

/** The display form of the official answer. */
export function correctAnswerText(part: Part): string {
  if (part.type === "rubric") return "Answers will vary (teacher rubric)";
  if (part.type === "order") return part.answer;
  return part.answer;
}

export interface PartResult {
  partId: string;
  questionId: string;
  label: string;
  prompt: string;
  marks: number;
  earned: number;
  correct: boolean;
  answered: boolean;
  isRubric: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export function isAnswered(part: Part, value: string | undefined): boolean {
  const v = (value ?? "").trim();
  if (part.type === "order") {
    return normalizeTokens(v).length === part.words.length;
  }
  return v.length > 0;
}

export function gradePart(
  part: Part,
  value: string | undefined,
  questionId: string,
): PartResult {
  const answered = isAnswered(part, value);
  const raw = value ?? "";

  if (part.type === "rubric") {
    const words = raw.trim().split(/\s+/).filter(Boolean).length;
    const starterOk = part.starter
      ? normalize(raw).startsWith(normalize(part.starter))
      : true;
    const earned = answered && starterOk && words >= part.minWords ? part.marks : 0;
    return {
      partId: part.id,
      questionId,
      label: part.label,
      prompt: part.prompt,
      marks: part.marks,
      earned,
      correct: earned === part.marks,
      answered,
      isRubric: true,
      studentAnswer: raw.trim(),
      correctAnswer: "Answers will vary (teacher rubric)",
      explanation: part.rubric,
    };
  }

  const accepted = acceptedAnswers(part);
  let correct = false;
  if (answered) {
    if (part.type === "order") {
      const a = normalizeTokens(raw).join(" ");
      const b = normalizeTokens(part.answer).join(" ");
      correct = a === b;
    } else if (part.type === "text") {
      const n = normalize(raw);
      correct = accepted.some((acc) => normalize(acc) === n);
    } else {
      const n = normalize(raw);
      correct = accepted.some((acc) => normalize(acc) === n);
    }
  }

  return {
    partId: part.id,
    questionId,
    label: part.label,
    prompt: part.prompt,
    marks: part.marks,
    earned: correct ? part.marks : 0,
    correct,
    answered,
    isRubric: false,
    studentAnswer: raw.trim(),
    correctAnswer: correctAnswerText(part),
  };
}

export interface QuestionResult {
  questionId: string;
  lesson: Question["lesson"];
  ref: string;
  earned: number;
  marks: number;
  parts: PartResult[];
}

export interface ExamResult {
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  correctParts: number;
  totalParts: number;
  questions: QuestionResult[];
}

export function gradeExam(
  questions: Question[],
  answers: Record<string, string>,
): ExamResult {
  const results: QuestionResult[] = questions.map((q) => {
    const parts = q.parts.map((p) => gradePart(p, answers[p.id], q.id));
    return {
      questionId: q.id,
      lesson: q.lesson,
      ref: q.ref,
      earned: parts.reduce((s, p) => s + p.earned, 0),
      marks: parts.reduce((s, p) => s + p.marks, 0),
      parts,
    };
  });

  const allParts = results.flatMap((r) => r.parts);
  const score = results.reduce((s, r) => s + r.earned, 0);
  const maxScore = results.reduce((s, r) => s + r.marks, 0);
  const correctParts = allParts.filter((p) => p.correct).length;

  return {
    score,
    maxScore,
    correctCount: correctParts,
    incorrectCount: allParts.length - correctParts,
    correctParts,
    totalParts: allParts.length,
    questions: results,
  };
}

/** A question counts as complete only when every required subpart is answered. */
export function isQuestionAnswered(q: Question, answers: Record<string, string>): boolean {
  return q.parts.every((p) => isAnswered(p, answers[p.id]));
}

export function answeredCount(
  questions: Question[],
  answers: Record<string, string>,
): { answered: number; total: number } {
  const flat = questions.flatMap((q) => q.parts);
  const answered = flat.filter((p) => isAnswered(p, answers[p.id])).length;
  return { answered, total: flat.length };
}

export function allAnswered(questions: Question[], answers: Record<string, string>): boolean {
  return isQuestionAnsweredMany(questions, answers);
}

function isQuestionAnsweredMany(questions: Question[], answers: Record<string, string>): boolean {
  return questions.every((q) => isQuestionAnswered(q, answers));
}

/** Deterministic pseudo-shuffle so a word bank looks shuffled but is stable across refreshes. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Grading engine — deterministic, testable, transparent              */
/* ------------------------------------------------------------------ */

import type {
  AnswerMap,
  AnswerValue,
  CriterionResult,
  ExamResult,
  OrderPart,
  Part,
  PartResult,
  Question,
  QuestionResult,
  RubricCriterion,
} from "../types";
import { QUESTIONS } from "../data/questions";

/** Normalizes harmless student-input differences before comparison. */
export function normalize(raw: string): string {
  return raw
    .replace(/[’‘‛`´]/g, "'") // curly apostrophes → straight
    .replace(/[“”«»]/g, '"')
    .toLowerCase()
    .replace(/[.!?،,;:]+$/g, "") // trailing sentence punctuation
    .trim()
    .replace(/\s+/g, " ");
}

/** looser variant used only for word-order comparison of tokens */
function normalizeToken(t: string): string {
  return normalize(t).replace(/[.!?]+/g, "").trim();
}

export function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** Every part of every question must carry an answer to unlock Submit. */
export function missingPartIds(questions: Question[], answers: AnswerMap): string[] {
  const missing: string[] = [];
  for (const q of questions)
    for (const p of q.parts) if (!isAnswered(answers[p.id])) missing.push(p.id);
  return missing;
}

export function questionAnswered(q: Question, answers: AnswerMap): boolean {
  return q.parts.every((p) => isAnswered(answers[p.id]));
}

/* ---------------------------- rubric ------------------------------ */

export function testCriterion(criterion: RubricCriterion, text: string): boolean {
  const norm = ` ${normalize(text)} `; // guard edges for includesAny
  switch (criterion.kind) {
    case "minWords":
      return wordCount(text) >= (criterion.value as number);
    case "minLength":
      return text.trim().length >= (criterion.value as number);
    case "includesAny": {
      const tokens = (criterion.value as string[]).map((t) => normalize(t));
      return tokens.some((tok) => norm.includes(` ${tok} `) || norm.includes(`${tok} `) || norm.includes(` ${tok}`));
    }
  }
}

/* --------------------------- part graders ------------------------- */

function gradeOrder(part: OrderPart, value: AnswerValue | undefined): boolean {
  if (!Array.isArray(value) || value.length !== part.answer.length) return false;
  const target = part.answer.map(normalizeToken);
  const given = value.map(normalizeToken);
  if (target.join(" ") === given.join(" ")) return true;
  if (part.acceptAlt) {
    for (const alt of part.acceptAlt) {
      if (alt.map(normalizeToken).join(" ") === given.join(" ")) return true;
    }
  }
  return false;
}

function describeValue(part: Part, value: AnswerValue | undefined): string {
  if (!isAnswered(value)) return "— (no answer)";
  if (Array.isArray(value)) return value.join(" ");
  if (part.kind === "tf") return value === "true" ? "True" : "False";
  if (part.kind === "mcq") {
    const opt = part.options.find((o) => o.id === value);
    return opt ? opt.text : String(value);
  }
  if (part.kind === "match") return String(value); // resolved by caller with pool
  return String(value);
}

function correctDescription(part: Part, question: Question): string {
  switch (part.kind) {
    case "mcq": {
      const opt = part.options.find((o) => o.id === part.answer);
      return opt ? opt.text : part.answer;
    }
    case "tf":
      return part.answer ? "True" : "False";
    case "fill":
      return part.accept[0];
    case "match": {
      const opt = question.matchOptions?.find((o) => o.id === part.answer);
      return opt ? opt.text : part.answer;
    }
    case "order":
      return part.answer.join(" ") + ".";
    case "rubric":
      return "See the grading rubric criteria below.";
  }
}

export function gradePart(
  question: Question,
  part: Part,
  value: AnswerValue | undefined
): PartResult {
  let earned = 0;
  let criteria: CriterionResult[] | undefined;
  let rubricScored = false;

  switch (part.kind) {
    case "mcq":
    case "match":
      earned = value === part.answer ? part.marks : 0;
      break;
    case "tf":
      earned = value === String(part.answer) ? part.marks : 0;
      break;
    case "fill": {
      const given = normalize(typeof value === "string" ? value : "");
      const ok = part.accept.some((a) => normalize(a) === given);
      earned = ok ? part.marks : 0;
      break;
    }
    case "order":
      earned = gradeOrder(part, value) ? part.marks : 0;
      break;
    case "rubric": {
      rubricScored = true;
      const text = typeof value === "string" ? value : "";
      criteria = part.criteria.map((c) => {
        const met = testCriterion(c, text);
        return { description: c.description, earned: met ? c.marks : 0, max: c.marks, met };
      });
      earned = criteria.reduce((s, c) => s + c.earned, 0);
      break;
    }
  }

  let studentAnswer = describeValue(part, value);
  if (part.kind === "match" && isAnswered(value)) {
    const opt = question.matchOptions?.find((o) => o.id === value);
    if (opt) studentAnswer = opt.text;
  }

  return {
    partId: part.id,
    prompt: part.prompt,
    arabic: part.arabic,
    kind: part.kind,
    earned,
    max: part.marks,
    correct: earned === part.marks,
    studentAnswer,
    correctAnswer: correctDescription(part, question),
    explanation: part.explanation,
    criteria,
    rubricScored,
  };
}

export function gradeQuestion(q: Question, answers: AnswerMap): QuestionResult {
  const parts = q.parts.map((p) => gradePart(q, p, answers[p.id]));
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  return {
    n: q.n,
    id: q.id,
    title: q.title,
    skill: q.skill,
    lesson: q.lesson,
    earned,
    max: q.marks,
    correct: earned === q.marks,
    instruction: q.instruction,
    passage: q.passage,
    parts,
    ref: q.ref,
  };
}

export function gradeExam(
  answers: AnswerMap,
  studentName: string,
  startedAt: number,
  submittedAt: number
): ExamResult {
  const questions = QUESTIONS.map((q) => gradeQuestion(q, answers));
  const totalEarned = questions.reduce((s, q) => s + q.earned, 0);
  const totalMax = questions.reduce((s, q) => s + q.max, 0);
  return {
    studentName,
    submittedAt,
    startedAt,
    durationMs: Math.max(0, submittedAt - startedAt),
    totalEarned,
    totalMax,
    percentage: Math.round((totalEarned / totalMax) * 1000) / 10,
    correctQuestions: questions.filter((q) => q.earned === q.max).length,
    partiallyCorrect: questions.filter((q) => q.earned > 0 && q.earned < q.max).length,
    incorrectQuestions: questions.filter((q) => q.earned === 0).length,
    rubricReviewQuestions: questions.filter((q) =>
      q.parts.some((p) => p.rubricScored)
    ).length,
    questions,
  };
}

/* ----------------------- integrity utilities ----------------------- */

export function questionMarksValid(q: Question): boolean {
  return q.parts.reduce((s, p) => s + p.marks, 0) === q.marks;
}

import type {
  AnswerMap,
  ExamResult,
  Part,
  PartResult,
  Question,
  QuestionResult,
} from "./types";
import { QUESTIONS } from "./questions";

/**
 * Grading module — pure functions, no DOM access, fully unit-tested.
 *
 * Design rules:
 *  - Text answers are normalized (case / spacing / surrounding punctuation are
 *    harmless) and matched against a documented list of acceptable answers.
 *  - Objective parts (mcq / select / tf / order) are graded by exact key match.
 *  - No marks are ever awarded for empty or missing answers.
 */

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’‘`´]/g, "'") // unify apostrophes
    .replace(/[“”«»]/g, '"') // unify quotes
    .replace(/[,;]/g, " ") // commas/semicolons are harmless separators
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.?!'"\s]+/, "") // harmless leading punctuation
    .replace(/[.?!'"\s]+$/, ""); // harmless trailing punctuation
}

function optionText(part: Extract<Part, { type: "mcq" | "select" }>, id: string): string {
  const found = part.options.find((o) => o.id === id);
  return found ? found.text : "—";
}

/** Grade a single part. Returns student/correct answer display text + marks. */
export function gradePart(part: Part, raw: string | undefined): PartResult {
  const value = (raw ?? "").trim();

  switch (part.type) {
    case "mcq":
    case "select": {
      const correct = value !== "" && value === part.correctId;
      return {
        partId: part.id,
        prompt: part.prompt,
        studentAnswer: value ? optionText(part, value) : "— (no answer)",
        correctAnswer: optionText(part, part.correctId),
        earned: correct ? part.marks : 0,
        possible: part.marks,
        correct,
        explanation: part.explanation,
      };
    }
    case "tf": {
      const correct = value === (part.answer ? "T" : "F");
      return {
        partId: part.id,
        prompt: part.prompt,
        studentAnswer: value === "T" ? "True" : value === "F" ? "False" : "— (no answer)",
        correctAnswer: part.answer ? "True" : "False",
        earned: correct ? part.marks : 0,
        possible: part.marks,
        correct,
        explanation: part.explanation,
      };
    }
    case "order": {
      const chosen = value === "" ? NaN : Number(value);
      const correct = chosen === part.correctPos;
      const positions = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
      const label = (p: number) => positions[p - 1] ?? String(p);
      return {
        partId: part.id,
        prompt: part.prompt,
        studentAnswer: Number.isNaN(chosen)
          ? "— (no answer)"
          : `Position ${label(chosen)}`,
        correctAnswer: `Position ${label(part.correctPos)}`,
        earned: correct ? part.marks : 0,
        possible: part.marks,
        correct,
        explanation: part.explanation,
      };
    }
    case "text": {
      const normalized = normalizeText(value);
      const accepted = part.accepted.map(normalizeText);
      const correct = normalized !== "" && accepted.includes(normalized);
      return {
        partId: part.id,
        prompt: part.prompt,
        studentAnswer: value || "— (no answer)",
        correctAnswer: part.canonical,
        earned: correct ? part.marks : 0,
        possible: part.marks,
        correct,
        explanation: part.explanation,
      };
    }
  }
}

/** Grade one question (all its parts). */
export function gradeQuestion(question: Question, answers: AnswerMap): QuestionResult {
  const qAnswers = answers[question.n] ?? {};
  const parts = question.parts.map((p) => gradePart(p, qAnswers[p.id]));
  const earned = parts.reduce((sum, p) => sum + p.earned, 0);
  return {
    n: question.n,
    lesson: question.lesson,
    title: question.title,
    skill: question.skill,
    earned,
    possible: question.marks,
    parts,
    explanation: question.explanation,
  };
}

/** Grade the whole exam. */
export function gradeExam(answers: AnswerMap, questions: Question[] = QUESTIONS): ExamResult {
  const qResults = questions.map((q) => gradeQuestion(q, answers));
  const score = qResults.reduce((s, q) => s + q.earned, 0);
  const total = qResults.reduce((s, q) => s + q.possible, 0);
  const fullyCorrect = qResults.filter((q) => q.earned === q.possible).length;
  const incorrect = qResults.filter((q) => q.earned === 0).length;
  return {
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    fullyCorrect,
    partiallyCorrect: qResults.length - fullyCorrect - incorrect,
    incorrect,
    questions: qResults,
  };
}

/** Has a given raw part value been answered (any non-empty value)? */
export function isPartAnswered(raw: string | undefined): boolean {
  return (raw ?? "").trim() !== "";
}

/** A question is complete only when every part has an answer. */
export function isQuestionComplete(question: Question, answers: AnswerMap): boolean {
  const qAnswers = answers[question.n] ?? {};
  return question.parts.every((p) => isPartAnswered(qAnswers[p.id]));
}

/** Count of completed questions — drives the Submit gate (must be all 20). */
export function answeredCount(answers: AnswerMap, questions: Question[] = QUESTIONS): number {
  return questions.filter((q) => isQuestionComplete(q, answers)).length;
}

/** Integrity check used by tests: exactly 20 questions, 5 marks each, Qs 1–10 Lesson 3. */
export function examStructureOk(questions: Question[] = QUESTIONS): boolean {
  if (questions.length !== 20) return false;
  for (const q of questions) {
    if (q.marks !== 5) return false;
    const partSum = q.parts.reduce((s, p) => s + p.marks, 0);
    if (partSum !== 5) return false;
    if (q.n <= 10 && q.lesson !== 3) return false;
    if (q.n >= 11 && q.lesson !== 4) return false;
  }
  const numbers = questions.map((q) => q.n).sort((a, b) => a - b);
  return numbers.every((n, i) => n === i + 1);
}

/**
 * Deterministic, fully testable grading / scoring module.
 *
 * Rules:
 *  - MCQ / TF / select subparts are worth their marks all-or-nothing.
 *  - Text subparts are graded against a documented acceptable-answer set
 *    after normalization (case, spacing, punctuation insensitive).
 *  - Reorder subparts require the exact normalized token sequence.
 * Wrong answers can never accidentally earn marks; empty answers earn 0.
 */
import type {
  AnswerMap,
  AnswerValue,
  ExamResult,
  Question,
  QuestionResult,
  Subpart,
  SubpartResult,
} from "../types";
import { matchesAny, normalizeSequence } from "./normalize";

/** Format marks for display (5, 2.5, 1). */
export function formatMarks(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function isAnswered(sub: Subpart, val: AnswerValue | undefined): boolean {
  if (!val) return false;
  switch (sub.type) {
    case "mcq":
      return val.kind === "mcq" && val.index !== null;
    case "tf":
      return val.kind === "tf" && val.value !== null;
    case "select":
      return val.kind === "select" && val.value.trim().length > 0;
    case "text":
      return val.kind === "text" && val.value.trim().length > 0;
    case "reorder":
      return (
        val.kind === "reorder" &&
        val.value.length === sub.words.length &&
        val.value.length > 0
      );
  }
}

export function isQuestionAnswered(q: Question, answers: AnswerMap): boolean {
  return q.subparts.every((s) => isAnswered(s, answers[s.id]));
}

export function countAnswered(questions: Question[], answers: AnswerMap): number {
  return questions.filter((q) => isQuestionAnswered(q, answers)).length;
}

interface GradeOutcome {
  earned: number;
  correct: boolean;
  studentDisplay: string;
  correctDisplay: string;
}

function gradeSubpart(sub: Subpart, val: AnswerValue | undefined): GradeOutcome {
  switch (sub.type) {
    case "mcq": {
      const correctDisplay = sub.options[sub.correctIndex];
      const idx = val?.kind === "mcq" ? val.index : null;
      const studentDisplay =
        idx === null ? "Not answered" : `${String.fromCharCode(97 + idx)}) ${sub.options[idx]}`;
      const correct = idx === sub.correctIndex;
      return {
        earned: correct ? sub.marks : 0,
        correct,
        studentDisplay,
        correctDisplay: `${String.fromCharCode(97 + sub.correctIndex)}) ${correctDisplay}`,
      };
    }
    case "tf": {
      const v = val?.kind === "tf" ? val.value : null;
      const correct = v !== null && v === sub.correct;
      return {
        earned: correct ? sub.marks : 0,
        correct,
        studentDisplay: v === null ? "Not answered" : v ? "True" : "False",
        correctDisplay: sub.correct ? "True" : "False",
      };
    }
    case "select": {
      const v = val?.kind === "select" ? val.value : "";
      const correct = v !== "" && v === sub.correct;
      return {
        earned: correct ? sub.marks : 0,
        correct,
        studentDisplay: v === "" ? "Not answered" : v,
        correctDisplay: sub.correct,
      };
    }
    case "text": {
      const v = val?.kind === "text" ? val.value : "";
      const correct = v.trim() !== "" && matchesAny(v, sub.accept);
      return {
        earned: correct ? sub.marks : 0,
        correct,
        studentDisplay: v.trim() === "" ? "Not answered" : v.trim(),
        correctDisplay: sub.accept[0],
      };
    }
    case "reorder": {
      const v = val?.kind === "reorder" ? val.value : [];
      const complete = v.length === sub.words.length && v.length > 0;
      const correct =
        complete && normalizeSequence(v) === normalizeSequence(sub.target);
      const display = (ws: string[]) =>
        ws.length ? ws.join(" ") + "." : "Not answered";
      return {
        earned: correct ? sub.marks : 0,
        correct,
        studentDisplay: display(v),
        correctDisplay: display(sub.target),
      };
    }
  }
}

export function gradeQuestion(q: Question, answers: AnswerMap): QuestionResult {
  const subparts: SubpartResult[] = q.subparts.map((sub) => {
    const outcome = gradeSubpart(sub, answers[sub.id]);
    return {
      id: sub.id,
      prompt: sub.prompt,
      type: sub.type,
      earned: outcome.earned,
      max: sub.marks,
      studentDisplay: outcome.studentDisplay,
      correctDisplay: outcome.correctDisplay,
      isCorrect: outcome.correct,
    };
  });
  const earned = subparts.reduce((acc, s) => acc + s.earned, 0);
  return {
    number: q.number,
    id: q.id,
    lesson: q.lesson,
    typeLabel: q.typeLabel,
    instruction: q.instruction,
    passage: q.passage,
    earned,
    max: q.marks,
    explanation: q.explanation,
    curriculumRef: q.curriculumRef,
    subparts,
  };
}

export function gradeExam(questions: Question[], answers: AnswerMap): ExamResult {
  const questionResults = questions.map((q) => gradeQuestion(q, answers));
  const totalScore = questionResults.reduce((acc, r) => acc + r.earned, 0);
  const maxScore = questions.reduce((acc, q) => acc + q.marks, 0);
  const fullyCorrect = questionResults.filter((r) => r.earned === r.max).length;
  const incorrect = questionResults.filter((r) => r.earned === 0).length;
  const partiallyCorrect = questionResults.filter(
    (r) => r.earned > 0 && r.earned < r.max,
  ).length;
  return {
    totalScore,
    maxScore,
    percentage: maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 1000) / 10,
    fullyCorrect,
    partiallyCorrect,
    incorrect,
    questionResults,
  };
}

import { EXAM_TOTAL_MARKS, LESSONS } from "../data/lessons";
import {
  AnswerMap,
  ExamEvaluation,
  ExamQuestion,
  GradedQuestionResult,
  GradedSubPart,
  LessonScoreSummary,
  QuestionAnswer,
  ReorderQuestion,
  SourceReference,
} from "../types/exam";

/**
 * Normalizes student written input for fair, curriculum-faithful Grade 3 grading:
 * trims extra spaces, standardizes curly/straight apostrophes, lowercases,
 * and strips trailing sentence punctuation.
 */
export function normalizeText(value: string): string {
  return String(value ?? "")
    .replace(/[\u2018\u2019`´]/g, "'")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/[.!?]+$/, "")
    .trim();
}

export function formatMark(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatMarkLabel(marks: number): string {
  return `${formatMark(marks)} ${marks === 1 ? "mark" : "marks"}`;
}

export function formatSourceReference(source: SourceReference): string {
  return `Lesson ${source.lesson} (${source.lessonTitle}) · ${source.book} · ${source.page} · ${source.exercise}`;
}

export function buildReorderSentence(
  question: ReorderQuestion,
  chosenIndices: number[]
): string {
  if (!chosenIndices || chosenIndices.length === 0) {
    return "";
  }
  const words = chosenIndices
    .filter((i) => Number.isInteger(i) && i >= 0 && i < question.words.length)
    .map((i) => question.words[i]);
  if (words.length === 0) {
    return "";
  }
  return `${words.join(" ")}${question.endPunctuation}`;
}

/**
 * Returns true if and only if every required field or sub-part in the question
 * has a complete, non-empty answer.
 */
export function isQuestionComplete(
  question: ExamQuestion,
  answer: QuestionAnswer | undefined
): boolean {
  if (!answer) return false;

  switch (question.type) {
    case "single-choice":
      return (
        answer.type === "single-choice" &&
        typeof answer.value === "string" &&
        answer.value.trim().length > 0
      );

    case "choice-parts":
    case "text-parts":
    case "match": {
      if (answer.type !== "parts" || !answer.values) return false;
      return question.parts.every((part) => {
        const val = answer.values[part.id];
        return typeof val === "string" && val.trim().length > 0;
      });
    }

    case "reorder": {
      if (answer.type !== "reorder" || !Array.isArray(answer.chosenIndices)) {
        return false;
      }
      if (answer.chosenIndices.length !== question.words.length) {
        return false;
      }
      const unique = new Set(answer.chosenIndices);
      return (
        unique.size === question.words.length &&
        answer.chosenIndices.every(
          (idx) => Number.isInteger(idx) && idx >= 0 && idx < question.words.length
        )
      );
    }
  }
}

export function countCompletedQuestions(
  questions: ExamQuestion[],
  answers: AnswerMap
): number {
  return questions.reduce(
    (acc, q) => acc + (isQuestionComplete(q, answers[q.id]) ? 1 : 0),
    0
  );
}

export function areAllQuestionsComplete(
  questions: ExamQuestion[],
  answers: AnswerMap
): boolean {
  return (
    questions.length > 0 &&
    questions.every((q) => isQuestionComplete(q, answers[q.id]))
  );
}

export function gradeQuestion(
  question: ExamQuestion,
  examNumber: number,
  answer: QuestionAnswer | undefined
): GradedQuestionResult {
  let subParts: GradedSubPart[] = [];
  let earnedMarks = 0;
  let studentAnswerSummary = "(No answer)";
  let correctAnswerSummary = "";

  switch (question.type) {
    case "single-choice": {
      const raw =
        answer?.type === "single-choice" ? answer.value.trim() : "";
      const isAnswered = raw.length > 0;
      const selected = isAnswered ? raw : "(No answer)";
      const isCorrect = isAnswered && selected === question.correctAnswer;
      earnedMarks = isCorrect ? question.marks : 0;
      studentAnswerSummary = selected;
      correctAnswerSummary = question.correctAnswer;
      subParts = [
        {
          id: "main",
          label: question.prompt,
          studentAnswer: selected,
          correctAnswer: question.correctAnswer,
          earnedMarks,
          maxMarks: question.marks,
          isCorrect,
          isAnswered,
        },
      ];
      break;
    }

    case "choice-parts": {
      const vals = answer?.type === "parts" ? answer.values : {};
      subParts = question.parts.map((part) => {
        const raw = vals[part.id]?.trim() ?? "";
        const isAnswered = raw.length > 0;
        const chosen = isAnswered ? raw : "(No answer)";
        const isCorrect = isAnswered && chosen === part.correctAnswer;
        const partEarned = isCorrect ? part.marks : 0;
        return {
          id: part.id,
          label: part.prompt,
          studentAnswer: chosen,
          correctAnswer: part.correctAnswer,
          earnedMarks: partEarned,
          maxMarks: part.marks,
          isCorrect,
          isAnswered,
        };
      });
      earnedMarks = subParts.reduce((sum, p) => sum + p.earnedMarks, 0);
      studentAnswerSummary = subParts
        .map((p) => `${p.id}) ${p.studentAnswer}`)
        .join(" | ");
      correctAnswerSummary = subParts
        .map((p) => `${p.id}) ${p.correctAnswer}`)
        .join(" | ");
      break;
    }

    case "match": {
      const vals = answer?.type === "parts" ? answer.values : {};
      subParts = question.parts.map((part) => {
        const raw = vals[part.id]?.trim() ?? "";
        const isAnswered = raw.length > 0;
        const chosen = isAnswered ? raw : "(No answer)";
        const isCorrect = isAnswered && chosen === part.correctAnswer;
        const partEarned = isCorrect ? part.marks : 0;
        return {
          id: part.id,
          label: part.prompt,
          studentAnswer: chosen,
          correctAnswer: part.correctAnswer,
          earnedMarks: partEarned,
          maxMarks: part.marks,
          isCorrect,
          isAnswered,
        };
      });
      earnedMarks = subParts.reduce((sum, p) => sum + p.earnedMarks, 0);
      studentAnswerSummary = subParts
        .map((p) => `${p.label} → ${p.studentAnswer}`)
        .join(" | ");
      correctAnswerSummary = subParts
        .map((p) => `${p.label} → ${p.correctAnswer}`)
        .join(" | ");
      break;
    }

    case "text-parts": {
      const vals = answer?.type === "parts" ? answer.values : {};
      subParts = question.parts.map((part) => {
        const raw = vals[part.id]?.trim() || "";
        const isAnswered = raw.length > 0;
        const normalized = normalizeText(raw);
        const isCorrect =
          normalized.length > 0 &&
          part.acceptedAnswers.some((acc) => normalizeText(acc) === normalized);
        const partEarned = isCorrect ? part.marks : 0;
        const displayLabel = [
          part.label,
          part.beforeText,
          part.mistakeText ? `[${part.mistakeText}]` : "_____",
          part.afterText,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        return {
          id: part.id,
          label: displayLabel,
          studentAnswer: raw || "(No answer)",
          correctAnswer: part.correctDisplay,
          earnedMarks: partEarned,
          maxMarks: part.marks,
          isCorrect,
          isAnswered,
        };
      });
      earnedMarks = subParts.reduce((sum, p) => sum + p.earnedMarks, 0);
      studentAnswerSummary = subParts
        .map((p) => `${p.id}) ${p.studentAnswer}`)
        .join(" | ");
      correctAnswerSummary = subParts
        .map((p) => `${p.id}) ${p.correctAnswer}`)
        .join(" | ");
      break;
    }

    case "reorder": {
      const indices = answer?.type === "reorder" ? answer.chosenIndices : [];
      const built = buildReorderSentence(question, indices);
      const isAnswered = built.length > 0;
      const isComplete = indices.length === question.words.length;
      const isCorrect =
        isComplete &&
        question.acceptedSentences.some(
          (acc) => normalizeText(acc) === normalizeText(built)
        );
      earnedMarks = isCorrect ? question.marks : 0;
      studentAnswerSummary = built || "(No answer)";
      correctAnswerSummary = question.correctSentence;
      subParts = [
        {
          id: "main",
          label: `Words: ${question.words.join(" / ")}`,
          studentAnswer: studentAnswerSummary,
          correctAnswer: question.correctSentence,
          earnedMarks,
          maxMarks: question.marks,
          isCorrect,
          isAnswered,
        },
      ];
      break;
    }
  }

  // Exact IEEE-754 half-mark cleanup
  earnedMarks = Math.round(earnedMarks * 100) / 100;

  const status: "correct" | "partial" | "incorrect" =
    earnedMarks === question.marks
      ? "correct"
      : earnedMarks > 0
      ? "partial"
      : "incorrect";

  return {
    examNumber,
    question,
    earnedMarks,
    maxMarks: question.marks,
    status,
    studentAnswerSummary,
    correctAnswerSummary,
    subParts,
  };
}

export function evaluateExam(
  questions: ExamQuestion[],
  answers: AnswerMap
): ExamEvaluation {
  const questionResults = questions.map((question, idx) =>
    gradeQuestion(question, idx + 1, answers[question.id])
  );

  const totalEarned =
    Math.round(
      questionResults.reduce((sum, r) => sum + r.earnedMarks, 0) * 100
    ) / 100;

  const totalMax =
    questionResults.reduce((sum, r) => sum + r.maxMarks, 0) || EXAM_TOTAL_MARKS;

  const correctCount = questionResults.filter(
    (r) => r.status === "correct"
  ).length;
  const partialCount = questionResults.filter(
    (r) => r.status === "partial"
  ).length;
  const incorrectCount = questionResults.filter(
    (r) => r.status === "incorrect"
  ).length;

  const lessonScores: LessonScoreSummary[] = LESSONS.map((lesson) => {
    const items = questionResults.filter(
      (r) => r.question.lesson === lesson.number
    );
    const earned =
      Math.round(items.reduce((sum, r) => sum + r.earnedMarks, 0) * 100) / 100;
    const max = items.reduce((sum, r) => sum + r.maxMarks, 0);
    return {
      lesson: lesson.number,
      title: lesson.title,
      earnedMarks: earned,
      maxMarks: max,
      questionCount: items.length,
      fullCorrectCount: items.filter((r) => r.status === "correct").length,
      partialCount: items.filter((r) => r.status === "partial").length,
      incorrectCount: items.filter((r) => r.status === "incorrect").length,
    };
  });

  const percentage = Math.round((totalEarned / totalMax) * 1000) / 10;

  return {
    totalEarned,
    totalMax,
    percentage,
    correctCount,
    partialCount,
    incorrectCount,
    lessonScores,
    questionResults,
  };
}

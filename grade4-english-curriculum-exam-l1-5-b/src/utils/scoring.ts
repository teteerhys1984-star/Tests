import { EXAM_TITLE, LESSON_METADATA } from '../data/passages';
import { EXAM_QUESTIONS } from '../data/questions';
import {
  ExamEvaluation,
  ExamQuestion,
  GradedQuestion,
  GradedSubPart,
  LessonScoreSummary,
  QuestionSubPart,
  SourceReference,
  StudentAnswerMap,
} from '../types/exam';

export function makeSubPartKey(questionId: string, subPartId: string): string {
  return `${questionId}::${subPartId}`;
}

export function normalizeText(raw: string): string {
  return raw
    .trim()
    .replace(/[\u2018\u2019\u02BC`]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.?!,;:]+$/g, '')
    .trim()
    .toLowerCase();
}

export function buildReorderSentence(
  subPart: QuestionSubPart,
  selectedIndices: number[]
): string {
  const words = subPart.scrambledWords ?? [];
  if (selectedIndices.length === 0) return '';
  const validWords = selectedIndices
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < words.length)
    .map((idx) => words[idx]);
  if (validWords.length === 0) return '';
  const punct = subPart.endPunctuation ?? '.';
  return `${validWords.join(' ')}${punct}`;
}

export function isSubPartAnswered(
  question: ExamQuestion,
  subPart: QuestionSubPart,
  answers: StudentAnswerMap
): boolean {
  const key = makeSubPartKey(question.id, subPart.id);
  const val = answers[key];

  if (subPart.inputKind === 'reorder') {
    const totalWords = subPart.scrambledWords?.length ?? 0;
    if (!Array.isArray(val) || val.length !== totalWords) return false;
    const unique = new Set(val);
    return (
      unique.size === totalWords &&
      val.every((n) => Number.isInteger(n) && n >= 0 && n < totalWords)
    );
  }

  if (typeof val !== 'string') return false;
  return val.trim().length > 0;
}

export function isQuestionAnswered(
  question: ExamQuestion,
  answers: StudentAnswerMap
): boolean {
  return question.subParts.every((sp) => isSubPartAnswered(question, sp, answers));
}

export interface CompletionSummary {
  answeredQuestions: number;
  totalQuestions: number;
  answeredSubParts: number;
  totalSubParts: number;
  allComplete: boolean;
  unansweredIndices: number[];
}

export function getCompletionSummary(
  answers: StudentAnswerMap,
  questions: ExamQuestion[] = EXAM_QUESTIONS
): CompletionSummary {
  let answeredQuestions = 0;
  let answeredSubParts = 0;
  let totalSubParts = 0;
  const unansweredIndices: number[] = [];

  questions.forEach((q, idx) => {
    let qComplete = true;
    q.subParts.forEach((sp) => {
      totalSubParts += 1;
      if (isSubPartAnswered(q, sp, answers)) {
        answeredSubParts += 1;
      } else {
        qComplete = false;
      }
    });
    if (qComplete) {
      answeredQuestions += 1;
    } else {
      unansweredIndices.push(idx);
    }
  });

  return {
    answeredQuestions,
    totalQuestions: questions.length,
    answeredSubParts,
    totalSubParts,
    allComplete: answeredQuestions === questions.length && answeredSubParts === totalSubParts,
    unansweredIndices,
  };
}

export function gradeSubPart(
  question: ExamQuestion,
  subPart: QuestionSubPart,
  answers: StudentAnswerMap
): GradedSubPart {
  const key = makeSubPartKey(question.id, subPart.id);
  const raw = answers[key];

  if (subPart.inputKind === 'reorder') {
    const indices = Array.isArray(raw) ? raw : [];
    const built = buildReorderSentence(subPart, indices);
    const isCorrect =
      built.length > 0 && normalizeText(built) === normalizeText(subPart.correctAnswer);
    return {
      subPart,
      studentAnswerDisplay: built || '(No answer)',
      correctAnswerDisplay: subPart.correctAnswer,
      isCorrect,
      earnedMarks: isCorrect ? subPart.marks : 0,
      maxMarks: subPart.marks,
    };
  }

  const textVal = typeof raw === 'string' ? raw.trim() : '';

  if (subPart.inputKind === 'text') {
    const allowed = [subPart.correctAnswer, ...(subPart.acceptedAnswers ?? [])].map(normalizeText);
    const normalizedStudent = normalizeText(textVal);
    const isCorrect = normalizedStudent.length > 0 && allowed.includes(normalizedStudent);
    return {
      subPart,
      studentAnswerDisplay: textVal || '(No answer)',
      correctAnswerDisplay: subPart.correctAnswer,
      isCorrect,
      earnedMarks: isCorrect ? subPart.marks : 0,
      maxMarks: subPart.marks,
    };
  }

  // Choice / True-False / Select: exact canonical match
  const isCorrect = textVal === subPart.correctAnswer;
  return {
    subPart,
    studentAnswerDisplay: textVal || '(No answer)',
    correctAnswerDisplay: subPart.correctAnswer,
    isCorrect,
    earnedMarks: isCorrect ? subPart.marks : 0,
    maxMarks: subPart.marks,
  };
}

function roundToHalf(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMark(value: number): string {
  const rounded = roundToHalf(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatSourceReference(source: SourceReference): string {
  return `Lesson ${source.lesson} (${source.lessonTitle}) · ${source.book} · ${source.page} · ${source.exercise}`;
}

export function evaluateExam(params: {
  studentName: string;
  answers: StudentAnswerMap;
  elapsedMs: number;
  submittedAtIso: string;
  questions?: ExamQuestion[];
}): ExamEvaluation {
  const questions = params.questions ?? EXAM_QUESTIONS;

  const gradedQuestions: GradedQuestion[] = questions.map((question, idx) => {
    const subPartResults = question.subParts.map((sp) =>
      gradeSubPart(question, sp, params.answers)
    );
    const earnedMarks = roundToHalf(
      subPartResults.reduce((acc, item) => acc + item.earnedMarks, 0)
    );
    const isFullyCorrect = earnedMarks === question.marks;
    const isPartial = earnedMarks > 0 && earnedMarks < question.marks;

    return {
      examNumber: idx + 1,
      question,
      subPartResults,
      earnedMarks,
      maxMarks: question.marks,
      isFullyCorrect,
      isPartial,
    };
  });

  const totalEarnedMarks = roundToHalf(
    gradedQuestions.reduce((acc, q) => acc + q.earnedMarks, 0)
  );
  const correctQuestionCount = gradedQuestions.filter((q) => q.isFullyCorrect).length;
  const incorrectQuestionCount = gradedQuestions.length - correctQuestionCount;
  const partialQuestionCount = gradedQuestions.filter((q) => q.isPartial).length;

  const lessonScores: LessonScoreSummary[] = LESSON_METADATA.map((meta) => {
    const lessonItems = gradedQuestions.filter((gq) => gq.question.lesson === meta.number);
    const earned = roundToHalf(lessonItems.reduce((acc, gq) => acc + gq.earnedMarks, 0));
    const fullyCorrect = lessonItems.filter((gq) => gq.isFullyCorrect).length;
    return {
      lesson: meta.number,
      title: meta.title,
      earnedMarks: earned,
      maxMarks: meta.maxMarks,
      fullyCorrectCount: fullyCorrect,
      questionCount: meta.questionCount,
    };
  });

  return {
    examTitle: EXAM_TITLE,
    studentName: params.studentName.trim(),
    submittedAtIso: params.submittedAtIso,
    elapsedMs: Math.max(0, params.elapsedMs),
    totalEarnedMarks,
    totalMaxMarks: 100,
    correctQuestionCount,
    incorrectQuestionCount,
    partialQuestionCount,
    totalQuestions: 50,
    lessonScores,
    gradedQuestions,
  };
}

import {
  ALL_BRANCHES,
  EXAM_QUESTIONS,
  TOTAL_MARKS,
  type Answers,
  type AnswerValue,
  type Branch,
  type ExamQuestion,
  type LessonId,
} from "./examData";

export interface BranchResult {
  questionNumber: number;
  questionTitle: string;
  branchId: string;
  prompt: string;
  display?: string;
  earned: number;
  marks: number;
  isCorrect: boolean;
  submitted: string;
  correct: string;
  explanation: string;
  lesson: LessonId;
  skill: string;
}

export interface QuestionResult {
  number: number;
  title: string;
  icon: string;
  lessons: LessonId[];
  earned: number;
  totalMarks: number;
  branches: BranchResult[];
}

export interface ExamResult {
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  branchCount: number;
  questionResults: QuestionResult[];
  submittedAt: number;
  elapsedSeconds: number;
}

/** Normalises written English so capital letters and final punctuation do not affect grammar marks. */
export function normalizeAnswer(value: string): string {
  return value
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .trim();
}

function answerAsText(value: AnswerValue | undefined): string {
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value === "string") return value;
  return "";
}

function acceptedFor(branch: Branch): string[] {
  return [branch.correct, ...(branch.accepted ?? [])].map(normalizeAnswer);
}

export function isBranchCorrect(branch: Branch, answer: AnswerValue | undefined): boolean {
  if (answer === undefined) return false;
  const given = normalizeAnswer(answerAsText(answer));
  if (!given) return false;
  return acceptedFor(branch).includes(given);
}

export function isBranchAnswered(
  branch: Branch,
  answer: AnswerValue | undefined
): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0 && answer.length === (branch.orderTokens?.length ?? answer.length);
  }
  return typeof answer === "string" && answer.trim().length > 0;
}

export function isQuestionComplete(question: ExamQuestion, answers: Answers): boolean {
  return question.branches.every((branch) => isBranchAnswered(branch, answers[branch.id]));
}

export function answeredBranchCount(question: ExamQuestion, answers: Answers): number {
  return question.branches.filter((branch) => isBranchAnswered(branch, answers[branch.id])).length;
}

export function completedBranchCount(answers: Answers): number {
  return ALL_BRANCHES.filter(({ branch }) => isBranchAnswered(branch, answers[branch.id])).length;
}

export function isExamComplete(answers: Answers): boolean {
  return EXAM_QUESTIONS.every((question) => isQuestionComplete(question, answers));
}

export function questionEarned(question: ExamQuestion, answers: Answers): number {
  return question.branches.reduce(
    (sum, branch) =>
      sum + (isBranchCorrect(branch, answers[branch.id]) ? branch.marks : 0),
    0
  );
}

export function gradeExam(
  studentName: string,
  answers: Answers,
  submittedAt = Date.now(),
  elapsedSeconds = 0
): ExamResult {
  let correctCount = 0;
  const questionResults: QuestionResult[] = EXAM_QUESTIONS.map((question) => {
    let earned = 0;
    const branches = question.branches.map((branch) => {
      const isCorrect = isBranchCorrect(branch, answers[branch.id]);
      if (isCorrect) {
        correctCount += 1;
        earned += branch.marks;
      }
      return {
        questionNumber: question.number,
        questionTitle: question.title,
        branchId: branch.id,
        prompt: branch.prompt,
        display: branch.display,
        earned: isCorrect ? branch.marks : 0,
        marks: branch.marks,
        isCorrect,
        submitted: answerAsText(answers[branch.id]) || "No answer",
        correct: branch.displayCorrect,
        explanation: branch.explanation,
        lesson: branch.lesson,
        skill: branch.skill,
      };
    });
    return {
      number: question.number,
      title: question.title,
      icon: question.icon,
      lessons: question.lessons,
      earned,
      totalMarks: question.totalMarks,
      branches,
    };
  });

  const score = questionResults.reduce((sum, question) => sum + question.earned, 0);
  return {
    studentName: studentName.trim(),
    score,
    totalMarks: TOTAL_MARKS,
    percentage: TOTAL_MARKS === 0 ? 0 : Math.round((score / TOTAL_MARKS) * 100),
    correctCount,
    incorrectCount: ALL_BRANCHES.length - correctCount,
    branchCount: ALL_BRANCHES.length,
    questionResults,
    submittedAt,
    elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds)),
  };
}

export function getFeedback(score: number): { headline: string; message: string } {
  if (score >= 90) {
    return {
      headline: "Outstanding work!",
      message: "You know these six lessons very well. Look at any small fixes below.",
    };
  }
  if (score >= 75) {
    return {
      headline: "Great effort!",
      message: "You have a strong foundation. Review the missed skills and try again.",
    };
  }
  if (score >= 50) {
    return {
      headline: "Good progress!",
      message: "You are learning well. Use the explanations to practise your tricky areas.",
    };
  }
  return {
    headline: "Keep going!",
    message: "Every mistake is a chance to learn. Review the lessons and try a new attempt.",
  };
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function getElapsedSeconds(startedAt: number | null, submittedAt?: number | null): number {
  if (startedAt === null) return 0;
  const end = submittedAt ?? Date.now();
  return Math.max(0, Math.floor((end - startedAt) / 1000));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

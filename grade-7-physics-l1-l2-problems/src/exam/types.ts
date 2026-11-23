import type { LessonId, Level } from "../content/problems";

export type SubpartKind = "number" | "durationHours" | "clock" | "mcq";

export type McqOption = {
  id: string;
  label: string;
};

export type SubpartSpec = {
  id: string;
  problemId: string;
  lessonId: LessonId;
  prompt: string;
  unit?: string;
  placeholder?: string;
  kind: SubpartKind;
  marks: number;
  expectedNumber?: number;
  tolerance?: number;
  expectedClock?: string;
  options?: McqOption[];
  correctOptionId?: string;
  answerDisplay: string;
};

export type QuestionSpec = {
  problemId: string;
  lessonId: LessonId;
  number: number;
  title: string;
  level: Level;
  maxMarks: number;
  subparts: SubpartSpec[];
};

export type SubpartStatus = "correct" | "wrong" | "unanswered";
export type QuestionStatus = "correct" | "partial" | "wrong" | "unanswered";

export type GradedSubpart = {
  spec: SubpartSpec;
  rawAnswer: string;
  displayAnswer: string;
  status: SubpartStatus;
  awarded: number;
  max: number;
};

export type GradedQuestion = {
  problemId: string;
  lessonId: LessonId;
  number: number;
  title: string;
  level: Level;
  status: QuestionStatus;
  awarded: number;
  max: number;
  subparts: GradedSubpart[];
};

export type LessonBreakdown = {
  lessonId: LessonId;
  title: string;
  awarded: number;
  max: number;
  percentage: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  unansweredCount: number;
};

export type LevelBreakdown = {
  level: Level;
  awarded: number;
  max: number;
  count: number;
};

export type ExamResult = {
  total: number;
  max: number;
  percentage: number;
  gradeLabel: string;
  questions: GradedQuestion[];
  questionCounts: {
    correct: number;
    partial: number;
    wrong: number;
    unanswered: number;
    total: number;
  };
  subpartCounts: {
    correct: number;
    wrong: number;
    unanswered: number;
    total: number;
  };
  lessons: LessonBreakdown[];
  levels: LevelBreakdown[];
};

export type AttemptStatus = "in_progress" | "submitted";

export type ExamAttempt = {
  version: 1;
  examId: string;
  attemptId: string;
  status: AttemptStatus;
  studentName: string;
  responses: Record<string, string>;
  currentIndex: number;
  startedAt: string;
  submittedAt?: string;
  elapsedMs?: number;
};

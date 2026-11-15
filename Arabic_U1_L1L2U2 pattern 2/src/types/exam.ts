/** Core domain types for the Grade 5 Arabic grammar & spelling examination. */

export type LessonId = "lesson1" | "lesson2" | "lesson3" | "unit2-lesson1" | "unit2-lesson2";

export type SectionId = "grammar" | "spelling";

export type Difficulty = "basic" | "intermediate" | "advanced";

export type SubpartKind = "single" | "multi" | "text";

export interface LessonSource {
  id: LessonId;
  /** 1-based order inside the five-lesson examination scope. */
  order: number;
  unit: string;
  title: string;
  pages: string;
  grammarPage: number;
  spellingPage: number;
  grammarScope: string;
  spellingScope: string;
  /** Locked source note; kept out of the student's exam interface. */
  sourceLock: string;
}

export interface SourceRef {
  unit: string;
  lessonId: LessonId;
  lessonTitle: string;
  page: number;
  section: SectionId;
  skill: string;
}

export interface Subpart {
  id: string;
  /** Student-facing task. No answer, hint or feedback is ever rendered during the exam. */
  prompt: string;
  kind: SubpartKind;
  options?: string[];
  /** Accepted answers. For `text`, the first entry is the model answer. */
  correct: string[];
  marks: number;
  explanation: string;
  skill: string;
  misconception?: string;
}

export interface Question {
  id: string;
  /** Exam order, 1…30 (mixed: not textbook order). */
  number: number;
  lessonId: LessonId;
  section: SectionId;
  page: number;
  difficulty: Difficulty;
  /** General question stem shown above the subparts. */
  prompt: string;
  context?: string;
  typeLabel: string;
  subparts: Subpart[];
}

export interface Attempt {
  version: 1;
  id: string;
  studentName: string;
  startedAt: number;
  submittedAt: number | null;
  answers: Record<string, string[]>;
  current: number;
}

export interface SubpartResult {
  questionNumber: number;
  questionId: string;
  subpartId: string;
  subpartLabel: string;
  prompt: string;
  kind: SubpartKind;
  options?: string[];
  studentAnswer: string[];
  correctAnswer: string[];
  answered: boolean;
  isCorrect: boolean;
  marksEarned: number;
  marksMax: number;
  explanation: string;
  misconception?: string;
  source: SourceRef;
}

export interface QuestionResult {
  number: number;
  id: string;
  prompt: string;
  context?: string;
  lessonId: LessonId;
  lessonTitle: string;
  section: SectionId;
  sectionLabel: string;
  page: number;
  difficulty: Difficulty;
  marksEarned: number;
  marksMax: number;
  subparts: SubpartResult[];
}

export interface ScoreBand {
  earned: number;
  max: number;
  percentage: number;
}

export interface LessonBreakdown extends ScoreBand {
  lessonId: LessonId;
  title: string;
  order: number;
  grammar: ScoreBand;
  spelling: ScoreBand;
}

export interface ExamResult {
  attempt: Attempt;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  subpartCount: number;
  timeSeconds: number;
  grammar: ScoreBand;
  spelling: ScoreBand;
  lessons: LessonBreakdown[];
  questions: QuestionResult[];
  performance: {
    label: string;
    description: string;
    tone: "excellent" | "good" | "fair" | "support";
  };
  strengths: string[];
  improvements: string[];
}

/**
 * Exam domain types — Grade 8 · Unit 1 · Lessons 3 & 4
 * Question data lives in ./questions.ts and is fully separated from the UI.
 */

export type Lesson = 3 | 4;

export type Option = { id: string; text: string };

/** Every question is a set of parts; part marks always sum to exactly 5. */
export type Part =
  | {
      type: "mcq";
      id: string;
      prompt: string;
      options: Option[];
      correctId: string;
      marks: number;
      explanation: string;
    }
  | {
      /** Dropdown select — used for matching, word-bank cloze and pronunciation. */
      type: "select";
      id: string;
      prompt: string;
      options: Option[];
      correctId: string;
      marks: number;
      explanation: string;
    }
  | {
      /** Free text graded against a documented set of acceptable answers. */
      type: "text";
      id: string;
      prompt: string;
      placeholder?: string;
      accepted: string[];
      canonical: string;
      marks: number;
      explanation: string;
    }
  | {
      type: "tf";
      id: string;
      prompt: string;
      answer: boolean;
      marks: number;
      explanation: string;
    }
  | {
      /** Order item: student assigns a numeric position; correctPos is 1-based. */
      type: "order";
      id: string;
      prompt: string;
      correctPos: number;
      totalItems: number;
      marks: number;
      explanation: string;
    };

export type QuestionKind = "mcq" | "select" | "text" | "tf" | "order" | "mixed";

export interface Question {
  n: number;
  lesson: Lesson;
  sectionLabel: string;
  skill: string;
  kind: QuestionKind;
  title: string;
  instruction: string;
  /** Optional reading stimulus displayed above the parts. */
  passage?: { heading: string; text: string };
  parts: Part[];
  explanation: string;
  curriculumRef: string;
  marks: 5;
}

/** Student answers: per question number → per part id → raw value. */
export type AnswerMap = Record<number, Record<string, string>>;

export interface PartResult {
  partId: string;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  earned: number;
  possible: number;
  correct: boolean;
  explanation: string;
}

export interface QuestionResult {
  n: number;
  lesson: Lesson;
  title: string;
  skill: string;
  earned: number;
  possible: number;
  parts: PartResult[];
  explanation: string;
}

export interface ExamResult {
  score: number;
  total: number;
  percentage: number;
  fullyCorrect: number;
  partiallyCorrect: number;
  incorrect: number;
  questions: QuestionResult[];
}

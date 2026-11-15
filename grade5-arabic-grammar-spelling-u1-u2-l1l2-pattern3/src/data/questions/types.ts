export type Category = "grammar" | "spelling";
export type Difficulty = "basic" | "intermediate" | "advanced";
export type SubpartType = "mcq" | "select" | "fill" | "correct" | "free";

export interface Subpart {
  id: string;
  label: string;
  type: SubpartType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  maxMarks: number;
  skill: string;
  difficulty: Difficulty;
  explanation: string;
  rubric?: string;
  keywords?: string[];
  misconception?: string;
  strictHamza?: boolean;
}

export interface Question {
  id: string;
  number: number;
  lessonId: string;
  category: Category;
  instruction: string;
  prompt: string;
  subparts: Subpart[];
}

export interface ExamData {
  questions: Question[];
  totalMarks: number;
  totalSubparts: number;
}

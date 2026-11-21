export type SubQuestionType = "text" | "choice" | "order" | "match";

export interface BaseSub {
  id: string; // e.g. "1a"
  label: string; // "a", "b" ...
  prompt: string;
  marks: number;
  explanation: string;
}

export interface TextSub extends BaseSub {
  type: "text";
  /** All accepted answers (first is the canonical one shown in results). */
  accept: string[];
  placeholder?: string;
}

export interface ChoiceSub extends BaseSub {
  type: "choice";
  options: string[];
  answer: string;
}

export interface OrderSub extends BaseSub {
  type: "order";
  words: string[]; // scrambled
  answer: string; // the correct sentence
  accept?: string[];
}

export interface MatchSub extends BaseSub {
  type: "match";
  options: string[]; // shared pool of right-hand items
  answer: string;
}

export type SubQuestion = TextSub | ChoiceSub | OrderSub | MatchSub;

export interface Question {
  number: number;
  title: string; // task instruction shown to the student
  intro?: string; // optional passage / dialogue / context
  lesson: string; // teacher-only reference, e.g. "Lesson 3"
  skill: string; // teacher-only skill mapping
  subs: SubQuestion[];
}

export type AnswerValue = string;
export type AnswerMap = Record<string, AnswerValue>;

export interface SubResult {
  sub: SubQuestion;
  given: string;
  correct: boolean;
  earned: number;
}

export interface QuestionResult {
  question: Question;
  subs: SubResult[];
  earned: number;
  max: number;
}

export interface ExamResult {
  questions: QuestionResult[];
  total: number;
  max: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
}

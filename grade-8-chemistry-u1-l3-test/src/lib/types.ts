export type Difficulty = 'easy' | 'medium' | 'challenge';
export interface Option { id: string; label: string; formula?: string }
export interface Field {
  id: string;
  label: string;
  kind: 'number' | 'formula' | 'select';
  marks: number;
  answer: string | number;
  options?: Option[];
  formula?: string;
}
export type ResponseSpec =
  | { kind: 'choice'; options: Option[]; correct: string }
  | { kind: 'number'; answer: number; unit?: string }
  | { kind: 'matching'; rows: Option[]; options: Option[]; correct: Record<string, string> }
  | { kind: 'judgement'; rows: { id: string; statement: string; formula?: string; correct: boolean; correctionOptions?: Option[]; correction?: string; explanation: string }[] }
  | { kind: 'fields'; layout: 'numbers' | 'inventory' | 'balance' | 'construction'; fields: Field[]; correctFormula?: string; cation?: string; anion?: string }
  | { kind: 'order'; items: Option[]; correct: string[] };
export interface Reference { pages: number[]; item: string }
export interface Part {
  id: string;
  label: string;
  title: string;
  prompt: string;
  marks: number;
  difficulty: Difficulty;
  objectiveIds: string[];
  reference: Reference;
  response: ResponseSpec;
  explanation: string;
  rubric: string[];
  misconception: string;
}
export interface Question {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  marks: number;
  icon: 'read' | 'valency' | 'radical' | 'formula' | 'count' | 'name' | 'challenge';
  objectiveIds: string[];
  parts: Part[];
}
export type AnswerValue = string | Record<string, string> | string[];
export type Answers = Record<string, AnswerValue>;
export interface Attempt {
  version: 1;
  attemptId: string;
  studentName: string;
  answers: Answers;
  startedAt: number | null;
  submittedAt: number | null;
  currentQuestion: number;
  status: 'idle' | 'active' | 'submitted';
  elapsedMs: number;
}
export interface Criterion { label: string; earned: number; available: number; correct: boolean }
export interface PartResult {
  part: Part;
  earned: number;
  available: number;
  criteria: Criterion[];
  studentText: string;
  correctText: string;
  diagnosis: string[];
}
export interface QuestionResult { question: Question; earned: number; available: number; parts: PartResult[] }
export interface ExamResult { earned: number; available: number; percentage: number; questions: QuestionResult[] }

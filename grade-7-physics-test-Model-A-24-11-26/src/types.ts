export type DiagramId =
  | 'paths'
  | 'force'
  | 'dt-graph'
  | 'earth-moon'
  | 'force-opt-1'
  | 'force-opt-2'
  | 'force-opt-3'
  | 'force-opt-4';

/** معيار تصحيح لإجابة نصية مفتوحة: أي نمط في any يكفي، وكل أنماط all مطلوبة، ولا يظهر أي من none */
export interface Criterion {
  label: string;
  marks: number;
  any?: string[];
  all?: string[];
  none?: string[];
}

export interface UnitSpec {
  options: string[];
  answer: string;
  marks: number;
}

export interface StepsSpec {
  marks: number;
  all: string[];
  label: string;
  model: string;
}

interface BaseInput {
  id: string;
  prompt: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  diagram?: DiagramId;
}

export interface ChoiceInput extends BaseInput {
  kind: 'choice';
  options: ChoiceOption[];
  answer: string;
  marks: number;
}

export interface TrueFalseInput extends BaseInput {
  kind: 'tf';
  statement: string;
  answer: 'true' | 'false';
  verdictMarks: number;
  correction: { marks: number; criteria: Criterion[]; model: string } | null;
}

export interface TextInput extends BaseInput {
  kind: 'text';
  marks: number;
  criteria: Criterion[];
  model: string;
  placeholder?: string;
  rows?: number;
}

export interface NumberInput extends BaseInput {
  kind: 'number';
  marks: number;
  answer: number;
  tolerance?: number;
  unit: UnitSpec | null;
  steps: StepsSpec | null;
  placeholder?: string;
  model: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  answer: string;
}

export interface MatrixInput extends BaseInput {
  kind: 'matrix';
  columns: MatrixColumn[];
  rows: MatrixRow[];
  marksPerRow: number;
}

export type Input = ChoiceInput | TrueFalseInput | TextInput | NumberInput | MatrixInput;

export interface Part {
  id: string;
  prompt: string;
  diagram?: DiagramId;
  inputs: Input[];
}

export interface Question {
  id: number;
  title: string;
  lesson: 1 | 2 | 'both';
  pages: string;
  skill: string;
  scenario: string;
  diagram?: DiagramId;
  table?: { head: string[]; rows: string[][] };
  explanation: string;
  solutionSteps?: string[];
  parts: Part[];
}

export type Answers = Record<string, string>;

export interface Attempt {
  version: 1;
  status: 'in-progress' | 'submitted';
  studentName: string;
  answers: Answers;
  current: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface CriterionOutcome {
  label: string;
  marks: number;
  earned: number;
}

export type InputStatus = 'correct' | 'partial' | 'wrong' | 'empty';

export interface InputResult {
  inputId: string;
  kind: Input['kind'];
  marks: number;
  max: number;
  status: InputStatus;
  studentText: string;
  modelText: string;
  criteria: CriterionOutcome[];
  rows?: { label: string; student: string; model: string; earned: number; marks: number }[];
}

export interface PartResult {
  partId: string;
  marks: number;
  max: number;
  inputs: InputResult[];
}

export interface QuestionResult {
  questionId: number;
  marks: number;
  max: number;
  parts: PartResult[];
}

export interface ExamResult {
  total: number;
  max: number;
  percentage: number;
  questions: QuestionResult[];
  partsCorrect: number;
  partsPartial: number;
  partsWrong: number;
  partsTotal: number;
}

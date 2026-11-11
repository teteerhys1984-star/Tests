export type SubpartKind =
  | "mcq"
  | "tf"
  | "numeric"
  | "pair"
  | "multi"
  | "order"
  | "compare";

interface BaseSubpart {
  id: string;
  kind: SubpartKind;
  prompt: string;
  marks: number;
  explanation: string;
  page: string;
  accepted?: string[];
  partialRule?: string;
}

export interface McqSubpart extends BaseSubpart {
  kind: "mcq";
  options: string[];
  answer: number;
}

export interface TfSubpart extends BaseSubpart {
  kind: "tf";
  answer: boolean;
}

export interface NumericSubpart extends BaseSubpart {
  kind: "numeric";
  answer: string;
  placeholder?: string;
  unit?: string;
}

export interface PairSubpart extends BaseSubpart {
  kind: "pair";
  labels: [string, string];
  answer: [number, number];
}

export interface MultiSubpart extends BaseSubpart {
  kind: "multi";
  labels: string[];
  answer: string[];
}

export interface OrderSubpart extends BaseSubpart {
  kind: "order";
  items: string[];
  answer: string[];
}

export interface CompareSubpart extends BaseSubpart {
  kind: "compare";
  left: string;
  right: string;
  answer: ">" | "<" | "=";
}

export type Subpart =
  | McqSubpart
  | TfSubpart
  | NumericSubpart
  | PairSubpart
  | MultiSubpart
  | OrderSubpart
  | CompareSubpart;

export type Visual =
  | {
      kind: "barV";
      title: string;
      unit: string;
      max: number;
      step: number;
      data: { label: string; value: number }[];
    }
  | {
      kind: "barH";
      title: string;
      unit: string;
      max: number;
      step: number;
      data: { label: string; value: number }[];
    }
  | {
      kind: "grid";
      title: string;
      xMax: number;
      yMax: number;
      points: { label: string; x: number; y: number }[];
      legend?: string;
    }
  | {
      kind: "sequence";
      values: string[];
      trailing?: boolean;
    }
  | {
      kind: "addition";
      problems: { a: number; b: number }[];
    };

export interface Question {
  id: string;
  title: string;
  stem: string;
  page: string;
  visual?: Visual;
  subparts: Subpart[];
}

export type AnswerValue = number | boolean | string | string[] | { a: string; b: string } | null;
export type Answers = Record<string, AnswerValue>;

export interface OptionOrders {
  [questionId: string]: number[];
}

export interface Attempt {
  schema: 2;
  examId: string;
  examVersion: string;
  attemptId: string;
  studentName: string;
  phase: "exam" | "results";
  questionOrder: string[];
  optionOrders: OptionOrders;
  answers: Answers;
  currentIndex: number;
  visited: string[];
  reviewing?: boolean;
  startTime: number;
  submissionTime?: number;
  durationSeconds?: number;
  startSoundPlayed: boolean;
  submissionSoundPlayed: boolean;
  reportText?: string;
  reportFileName?: string;
  /** Delivery of the submitted result to the teacher (see exam/submit.ts). */
  delivery?: DeliveryState;
}

/** "sent" = the server confirmed receipt; anything else is sent again when the results are reopened. */
export type DeliveryState = "pending" | "sent" | "failed";

export type GradeStatus = "correct" | "partial" | "incorrect" | "unanswered";

export type FieldGrade = {
  label: string;
  student: string;
  correct: string;
  isCorrect: boolean;
};

export interface SubpartGrade {
  questionId: string;
  subpartId: string;
  prompt: string;
  kind: SubpartKind;
  marks: number;
  awarded: number;
  status: GradeStatus;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  page: string;
  accepted: string;
  partialRule: string;
  fields?: FieldGrade[];
}

export interface GradeResult {
  awarded: number;
  total: number;
  percentage: number;
  counts: Record<GradeStatus, number>;
  subparts: SubpartGrade[];
  questions: {
    question: Question;
    marks: number;
    awarded: number;
    subparts: SubpartGrade[];
  }[];
}

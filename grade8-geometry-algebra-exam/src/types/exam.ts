export type SubjectType = 'ALGEBRA' | 'GEOMETRY';

export type QuestionDifficulty = 'foundational' | 'intermediate' | 'advanced' | 'reasoning';

export type SubpartType =
  | 'mcq'
  | 'true_false'
  | 'numeric'
  | 'fraction'
  | 'text_reasoning'
  | 'coordinate'
  | 'multi_choice';

export interface SubpartOption {
  id: string;
  label: string; // Arabic text or KaTeX string
  isMath?: boolean;
}

export interface Subpart {
  id: string;
  subpartNumber: string; // e.g., 'أ', 'ب', 'ج'
  text: string;
  mathExpression?: string;
  type: SubpartType;
  marks: number;
  options?: SubpartOption[];
  correctAnswer: string | string[]; // Expected answer
  acceptableAnswers?: string[]; // Variations for numeric/fraction/coordinate
  placeholder?: string;
  unit?: string;
  teacherExplanation: string;
  partialCreditCriteria?: string;
}

export interface DiagramData {
  id: string;
  title: string;
  viewBox: string;
  type: 'translation' | 'midpoint_triangle' | 'parallelogram' | 'triangle_congruence' | 'parallel_midpoint' | 'special_quadrilateral' | 'medial_triangle' | 'combined_proof';
  coordinates: Record<string, { x: number; y: number; label: string; labelPos?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }>;
  segments: Array<{ from: string; to: string; style?: 'solid' | 'dashed' | 'vector'; color?: string; label?: string; tickCount?: number }>;
  vectors?: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; label: string; color?: string }>;
  angles?: Array<{ vertex: string; p1: string; p2: string; isRight?: boolean; label?: string; arcRadius?: number }>;
  grid?: boolean;
  notes?: string;
}

export interface Question {
  id: string;
  questionNumber: number;
  subject: SubjectType;
  title: string;
  curriculumRef: {
    unit: string;
    lesson: string;
    pages: string;
    code: string;
  };
  difficulty: QuestionDifficulty;
  totalMarks: number;
  stemText: string;
  stemMath?: string;
  diagram?: DiagramData;
  subparts: Subpart[];
}

export interface StudentSubpartAnswer {
  questionId: string;
  subpartId: string;
  studentAnswer: string;
  isAnswered: boolean;
}

export interface SubpartGradingResult {
  subpartId: string;
  subpartNumber: string;
  marksAllocated: number;
  marksEarned: number;
  status: 'correct' | 'partial' | 'incorrect' | 'unanswered';
  studentAnswer: string;
  correctAnswer: string;
  teacherExplanation: string;
}

export interface QuestionGradingResult {
  questionId: string;
  questionNumber: number;
  subject: SubjectType;
  title: string;
  totalMarks: number;
  earnedMarks: number;
  subpartResults: SubpartGradingResult[];
  curriculumRef: Question['curriculumRef'];
  diagramId?: string;
}

export interface ExamSessionState {
  examId: string;
  version: string;
  attemptId: string;
  studentName: string;
  isStarted: boolean;
  isSubmitted: boolean;
  currentQuestionIndex: number;
  visitedQuestions: number[];
  answers: Record<string, string>; // key: `${qId}_${subId}` => value
  startTime: number | null;
  submissionTime: number | null;
  elapsedSeconds: number;
  /** حالة آخر محاولة إرسال للنتيجة إلى المعلّم (تُستعاد عند فتح الصفحة مجدداً). */
  sendOutcome?: 'success' | 'failed';
}

export interface FinalGradingReport {
  studentName: string;
  attemptId: string;
  examTitle: string;
  grade: string;
  startTimeFormatted: string;
  submissionTimeFormatted: string;
  elapsedDurationFormatted: string;
  totalScore: number;
  percentage: number;
  counts: {
    correct: number;
    partial: number;
    incorrect: number;
    unanswered: number;
  };
  algebra: {
    score: number;
    totalPossible: number;
    percentage: number;
  };
  geometry: {
    score: number;
    totalPossible: number;
    percentage: number;
  };
  questionResults: QuestionGradingResult[];
}

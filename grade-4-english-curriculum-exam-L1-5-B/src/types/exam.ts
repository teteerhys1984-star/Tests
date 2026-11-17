export type LessonNumber = 1 | 2 | 3 | 4 | 5;

export interface LessonMeta {
  number: LessonNumber;
  title: string;
  pupilBookPages: string;
  workbookPages: string;
  questionCount: number;
  maxMarks: number;
}

export interface SourceReference {
  lesson: LessonNumber;
  lessonTitle: string;
  book: "Pupil's Book" | 'Workbook';
  page: string;
  exercise: string;
  note?: string;
}

export type PassageId =
  | 'ahmed-l1-pb4'
  | 'edward-l1-wb7'
  | 'sanaa-l2-pb7'
  | 'john-white-l2-wb8'
  | 'dan-l3-pb10'
  | 'dream-house-l4-pb13'
  | 'my-bedroom-l4-wb16'
  | 'ali-l5-pb16'
  | 'bill-l5-pb18'
  | 'luna-l5-wb19';

export interface CurriculumPassage {
  id: PassageId;
  heading: string;
  paragraphs: string[];
  source: SourceReference;
}

export interface ClockSpec {
  hour: number;
  minute: 0 | 15 | 30 | 45;
  label: string;
}

export type QuestionFormat =
  | 'multiple-choice'
  | 'true-false'
  | 'read-and-choose'
  | 'read-and-match'
  | 'match-qa'
  | 'complete-sentence'
  | 'choose-verb'
  | 'reorder'
  | 'correct-mistake'
  | 'reading-comprehension'
  | 'complete-table'
  | 'odd-one-out'
  | 'clock-time';

export type SubPartInputKind =
  | 'choice'
  | 'true-false'
  | 'select'
  | 'reorder'
  | 'text';

export interface QuestionSubPart {
  id: string;
  label?: string;
  prompt: string;
  /** Optional prefix/underlined/suffix split for grammar-correction items */
  underlinedSegment?: {
    before: string;
    underlined: string;
    after: string;
  };
  /** Optional analogue clock rendered beside this sub-part */
  clock?: ClockSpec;
  /** Optional table card metadata for table-completion exercises */
  tableContext?: {
    topLine: string;
    bottomLine: string;
    blankPosition: 'top' | 'bottom';
  };
  inputKind: SubPartInputKind;
  /** Options for choice or select inputs */
  options?: string[];
  /** Scrambled printed word tokens for reorder questions */
  scrambledWords?: string[];
  /** Terminal punctuation appended automatically for reorder sentences */
  endPunctuation?: '.' | '?';
  /** Canonical correct answer displayed in review, report, and teacher key */
  correctAnswer: string;
  /** Additional strictly verified equivalent forms accepted for typed answers */
  acceptedAnswers?: string[];
  /** Explicit marking rule documented in the Teacher Answer Key */
  markingRule: string;
  /** Marks allocated to this sub-part (sub-parts always sum to 2 marks per question) */
  marks: number;
  /** Brief curriculum-based explanation shown only after submission */
  explanation?: string;
}

export interface ExamQuestion {
  /** Internal stable curriculum ID, e.g. 'l1-q1' */
  id: string;
  lesson: LessonNumber;
  format: QuestionFormat;
  /** Friendly English badge shown during exam (never exposes source page or lesson key) */
  formatLabel: string;
  /** Instruction / main question wording preserved from curriculum */
  instruction: string;
  /** Optional printed word bank shown above sub-parts */
  wordBank?: string[];
  /** Optional printed example line from the textbook/workbook */
  printedExample?: string;
  /** Optional dialogue or context lines printed with the question */
  contextLines?: string[];
  /** Optional reference to a verbatim printed curriculum passage */
  passageId?: PassageId;
  /** Optional visual diagram identifier */
  visualAid?: 'lesson4-house-cutaway' | 'johns-family-header';
  /** Total marks for this main question — always strictly 2 */
  marks: 2;
  /** One or more sub-parts whose marks sum strictly to 2 */
  subParts: QuestionSubPart[];
  /** General explanation shown on Results and Teacher Answer Key pages */
  explanation: string;
  /** Internal curriculum source reference (strictly hidden during active exam) */
  source: SourceReference;
}

/**
 * Student answers keyed by `${question.id}::${subPart.id}`.
 * - For choice / true-false / select / text: string value
 * - For reorder: ordered array of word-token indices encoded as JSON or string[]
 */
export interface StudentAnswerMap {
  [subPartKey: string]: string | number[];
}

export interface GradedSubPart {
  subPart: QuestionSubPart;
  studentAnswerDisplay: string;
  correctAnswerDisplay: string;
  isCorrect: boolean;
  earnedMarks: number;
  maxMarks: number;
}

export interface GradedQuestion {
  examNumber: number;
  question: ExamQuestion;
  subPartResults: GradedSubPart[];
  earnedMarks: number;
  maxMarks: 2;
  isFullyCorrect: boolean;
  isPartial: boolean;
}

export interface LessonScoreSummary {
  lesson: LessonNumber;
  title: string;
  earnedMarks: number;
  maxMarks: number;
  fullyCorrectCount: number;
  questionCount: number;
}

export interface ExamEvaluation {
  examTitle: string;
  studentName: string;
  submittedAtIso: string;
  elapsedMs: number;
  totalEarnedMarks: number;
  totalMaxMarks: 100;
  correctQuestionCount: number;
  incorrectQuestionCount: number;
  partialQuestionCount: number;
  totalQuestions: 50;
  lessonScores: LessonScoreSummary[];
  gradedQuestions: GradedQuestion[];
}

export type ExamPhase = 'welcome' | 'active' | 'submitted';

export interface PersistedExamState {
  version: 1;
  phase: ExamPhase;
  studentName: string;
  currentQuestionIndex: number;
  answers: StudentAnswerMap;
  startedAtTimestamp: number | null;
  elapsedMs: number;
  submittedAtIso: string | null;
  muted: boolean;
}

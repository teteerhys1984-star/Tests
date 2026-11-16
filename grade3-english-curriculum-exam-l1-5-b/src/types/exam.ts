export type LessonNumber = 1 | 2 | 3 | 4 | 5;

export interface LessonMeta {
  number: LessonNumber;
  title: string;
  questionCount: number;
  maxMarks: number;
  pagesSummary: string;
}

export interface SourceReference {
  lesson: LessonNumber;
  lessonTitle: string;
  book: "Pupil's Book" | "Workbook" | "Pupil's Book & Workbook";
  page: string;
  exercise: string;
}

export interface ReadingLine {
  speaker?: string;
  label?: string;
  text: string;
}

export interface ReadingStimulus {
  kind: "reading";
  heading: string;
  lines: ReadingLine[];
  isSong?: boolean;
}

export interface TableCell {
  text?: string;
  iconSrc?: string;
  iconAlt?: string;
  blankLabel?: string;
  isExample?: boolean;
}

export interface TableStimulus {
  kind: "table";
  heading: string;
  headers: string[];
  rows: TableCell[][];
  caption?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface WordBankStimulus {
  kind: "word-bank";
  label?: string;
  words: string[];
}

export interface ImageItem {
  label?: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface ImagesStimulus {
  kind: "images";
  heading?: string;
  layout?: "single" | "row" | "cards" | "cues";
  items: ImageItem[];
}

export interface ExampleLineStimulus {
  kind: "example";
  label: string;
  text: string;
  iconPair?: {
    leftSrc: string;
    leftAlt: string;
    rightSrc: string;
    rightAlt: string;
  };
}

export type QuestionStimulus =
  | ReadingStimulus
  | TableStimulus
  | WordBankStimulus
  | ImagesStimulus
  | ExampleLineStimulus;

export type QuestionFormatLabel =
  | "Multiple Choice"
  | "True / False"
  | "Choose the Correct Word"
  | "Complete the Sentence"
  | "Match Items"
  | "Reorder Words"
  | "Read and Answer"
  | "Read and Choose"
  | "Complete the Timetable"
  | "Complete the Numbers"
  | "Correct the Sentence"
  | "Look and Write"
  | "Order the Dialogue"
  | "Sort into Groups"
  | "Odd One Out";

export interface ChoiceSubPart {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

export interface TextSubPart {
  id: string;
  label?: string;
  beforeText?: string;
  mistakeText?: string;
  afterText?: string;
  placeholder?: string;
  correctDisplay: string;
  acceptedAnswers: string[];
  marks: number;
  cueImages?: {
    src: string;
    alt: string;
  }[];
}

export interface MatchSubPart {
  id: string;
  prompt: string;
  correctAnswer: string;
  marks: number;
}

interface BaseQuestion {
  id: string;
  lesson: LessonNumber;
  marks: 2;
  formatLabel: QuestionFormatLabel;
  instruction: string;
  stimuli?: QuestionStimulus[];
  explanation: string;
  gradingRule: string;
  source: SourceReference;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single-choice";
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface MultiChoicePartsQuestion extends BaseQuestion {
  type: "choice-parts";
  variant: "mcq" | "true-false" | "inline-choice";
  parts: ChoiceSubPart[];
}

export interface TextPartsQuestion extends BaseQuestion {
  type: "text-parts";
  variant: "fill" | "correct" | "timetable" | "numbers" | "write";
  parts: TextSubPart[];
}

export interface MatchQuestion extends BaseQuestion {
  type: "match";
  optionPlaceholder?: string;
  options: string[];
  parts: MatchSubPart[];
}

export interface ReorderQuestion extends BaseQuestion {
  type: "reorder";
  words: string[];
  endPunctuation: "." | "?";
  correctSentence: string;
  acceptedSentences: string[];
}

export type ExamQuestion =
  | SingleChoiceQuestion
  | MultiChoicePartsQuestion
  | TextPartsQuestion
  | MatchQuestion
  | ReorderQuestion;

export type QuestionAnswer =
  | { type: "single-choice"; value: string }
  | { type: "parts"; values: Record<string, string> }
  | { type: "reorder"; chosenIndices: number[] };

export type AnswerMap = Record<string, QuestionAnswer>;

export interface GradedSubPart {
  id: string;
  label: string;
  studentAnswer: string;
  correctAnswer: string;
  earnedMarks: number;
  maxMarks: number;
  isCorrect: boolean;
  isAnswered?: boolean;
}

export interface GradedQuestionResult {
  examNumber: number;
  question: ExamQuestion;
  earnedMarks: number;
  maxMarks: 2;
  status: "correct" | "partial" | "incorrect";
  studentAnswerSummary: string;
  correctAnswerSummary: string;
  subParts: GradedSubPart[];
}

export interface LessonScoreSummary {
  lesson: LessonNumber;
  title: string;
  earnedMarks: number;
  maxMarks: number;
  questionCount: number;
  fullCorrectCount: number;
  partialCount: number;
  incorrectCount: number;
}

export interface ExamEvaluation {
  totalEarned: number;
  totalMax: number;
  percentage: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  lessonScores: LessonScoreSummary[];
  questionResults: GradedQuestionResult[];
}

export type ExamPhase = "welcome" | "in_progress" | "submitted";

export interface ExamSessionState {
  version: 1;
  attemptId: string;
  phase: ExamPhase;
  studentName: string;
  currentQuestionIndex: number;
  answers: AnswerMap;
  startTimestamp: number | null;
  elapsedSeconds: number;
  lastTickTimestamp: number | null;
  submittedAt: string | null;
  muted: boolean;
}

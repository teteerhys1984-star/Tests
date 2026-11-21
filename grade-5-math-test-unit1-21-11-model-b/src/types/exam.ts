export type LessonId =
  | 'coordinates'
  | 'line-graphs'
  | 'natural-numbers'
  | 'rounding-natural-numbers'
  | 'adding-subtracting-natural-numbers'
  | 'angle-measurement'
  | 'parallelogram'
  | 'rhombus'

export interface LessonMetaInfo {
  id: LessonId
  number: number
  title: string
  pages: string
  questionCount: number
  totalMarks: number
  description: string
}

export type QuestionPatternType =
  | 'multiple-choice'
  | 'true-false-correct'
  | 'fill-blank'
  | 'write-number'
  | 'show-steps'
  | 'spot-error'
  | 'order-numbers'
  | 'compare-symbols'
  | 'read-table'
  | 'read-line-graph'
  | 'drag-match'
  | 'plot-coordinate'
  | 'measure-angle'
  | 'construct-angle'
  | 'complete-shape'
  | 'multi-step-problem'
  | 'explain-why'

export interface CoordinatePointItem {
  label: string
  x: number
  y: number
  color?: string
  subtitle?: string
}

export interface CoordinateGridVisualConfig {
  kind: 'coordinate-grid'
  maxX: number
  maxY: number
  fixedPoints: CoordinatePointItem[]
  /** If interactive, the branchId whose answer stores the clicked/dragged point "x,y" */
  interactiveBranchId?: string
  interactivePointLabel?: string
  /** Optional polygon segments to connect fixedPoints + interactive point */
  connectPolygonLabels?: string[]
  /** Optional path arrows for multi-step movement */
  movementSteps?: Array<{ fromX: number; fromY: number; toX: number; toY: number; label?: string }>
  caption: string
}

export interface LineChartVisualConfig {
  kind: 'line-chart'
  title: string
  xAxisLabel: string
  yAxisLabel: string
  categories: string[]
  values: number[]
  yMin: number
  yMax: number
  yStep: number
  unitLabel: string
  table?: {
    caption: string
    headers: [string, string]
    rows: Array<{ label: string; valueDisplay: string; isMissing?: boolean }>
  }
}

export interface NumberLineVisualConfig {
  kind: 'number-line'
  min: number
  max: number
  majorStep: number
  minorStep: number
  midpoint: number
  targetValue: number
  targetLabel?: string
  /** If interactive, the branchId that receives the selected position on the number line */
  interactiveBranchId?: string
  caption: string
}

export interface ProtractorVisualConfig {
  kind: 'protractor'
  mode: 'read' | 'construct'
  vertexLabel: string
  baseRayLabel: string
  secondRayLabel: string
  /** Fixed angle in degrees when mode === 'read', or target angle when mode === 'construct' */
  targetDegree: number
  /** Branch ID storing the constructed angle in degrees when mode === 'construct' */
  interactiveBranchId?: string
  toleranceDegrees?: number
  caption: string
}

export interface GeometryFigureVisualConfig {
  kind: 'geometry-figure'
  figureId:
    | 'angle-parts-bac'
    | 'four-angles-classify'
    | 'three-quadrilaterals-p1'
    | 'parallelogram-wxyz'
    | 'composite-parallelograms'
    | 'three-shapes-rhombus-check'
    | 'rhombus-abcd-props'
    | 'composite-rhombus-parallelogram'
  caption: string
}

export type QuestionVisualConfig =
  | CoordinateGridVisualConfig
  | LineChartVisualConfig
  | NumberLineVisualConfig
  | ProtractorVisualConfig
  | GeometryFigureVisualConfig

export type BranchInputKind =
  | 'text'
  | 'number'
  | 'ordered-pair'
  | 'choice'
  | 'compare-symbol'
  | 'order-list'
  | 'interactive-point'
  | 'interactive-angle'

export interface BranchOption {
  id: string
  label: string
  math?: string
}

export interface SubQuestionBranch {
  id: string
  label: string // e.g. 'أ', 'ب', 'ج', 'د'
  prompt: string
  marks: number
  inputKind: BranchInputKind
  placeholder?: string
  unitSuffix?: string
  options?: BranchOption[]
  /** Initial items to reorder when inputKind === 'order-list' */
  initialOrderItems?: Array<{ id: string; display: string; numericValue: number }>
  modelAnswerDisplay: string
}

export interface ExamQuestion {
  id: string
  number: number
  lessonId: LessonId
  lessonTitle: string
  pages: string
  skill: string
  patternType: QuestionPatternType
  patternBadge: string
  totalMarks: number
  showMathKeypad: boolean
  prompt: string
  visual?: QuestionVisualConfig
  branches: SubQuestionBranch[]
  solutionSteps: string[]
  explanation: string
}

export type StudentAnswersMap = Record<string, string>

export interface BranchScoreResult {
  branchId: string
  label: string
  prompt: string
  earnedMarks: number
  maxMarks: number
  isCorrect: boolean
  isPartial: boolean
  studentAnswerDisplay: string
  modelAnswerDisplay: string
  errorFeedback?: string
}

export interface QuestionScoreResult {
  questionId: string
  questionNumber: number
  lessonId: LessonId
  lessonTitle: string
  pages: string
  skill: string
  earnedMarks: number
  maxMarks: number
  status: 'correct' | 'partial' | 'wrong'
  branchResults: BranchScoreResult[]
  solutionSteps: string[]
  explanation: string
}

export interface ExamScoreSummary {
  totalEarned: number
  totalMax: number
  correctQuestionCount: number
  partialQuestionCount: number
  wrongQuestionCount: number
  questionResults: QuestionScoreResult[]
}

export interface SavedAttemptState {
  version: number
  studentName: string
  hasStarted: boolean
  isSubmitted: boolean
  startedAtTimestamp: number | null
  submittedAtTimestamp: number | null
  currentQuestionIndex: number
  answers: StudentAnswersMap
  isMuted: boolean
}

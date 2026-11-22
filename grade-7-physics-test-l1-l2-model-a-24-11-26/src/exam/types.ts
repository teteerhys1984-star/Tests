/**
 * أنواع النموذج A: الوحدة الأولى من كتاب الفيزياء والكيمياء للصف السابع.
 *
 * · الدرس الأول: الحركة والسكون (ص 3–16).
 * · الدرس الثاني: القوة والحركة (ص 17–28).
 * · السؤال العاشر تركيبي بين الدرسين، ويُصنَّف بتسمية تحمل الدرسين معاً
 *   (لا درس ثالث) — وهذا هو التصنيف الوارد في المصدر نفسه.
 *
 * نص العرض (بلا إجابات) في `src/data/questions.ts`، والتصحيح في `src/data/answerKey.ts`.
 * الأسماء أدناه مشتركة بين الملفين، فالفصل بينهما هو ما يمنع تسرّب الإجابة إلى صفحة الاختبار.
 */

import { GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";

/** رسم بياني أو جدول أو صورة يظهر مع السؤال أو الفرع (رسوم SVG أصلية داخل التطبيق). */
export type FigureId =
  | "paths"
  | "force"
  | "dt-graph"
  | "earth-moon"
  | "force-opt-1"
  | "force-opt-2"
  | "force-opt-3"
  | "force-opt-4";

/** أسئلة الرسم تُعرض بمقارنة أربعة رسوم صغيرة جنباً إلى جنب. */
export const FIGURE_CHOICE_IDS = new Set<string>(["force-opt-1", "force-opt-2", "force-opt-3", "force-opt-4"]);

export type ChoiceOption = { id: string; label: string; diagram?: FigureId };

export type Table = { head: string[]; rows: string[][] };

interface InputBase {
  id: string;
  /** نصّ مختصر فوق الحقل (قد يكون فارغاً). */
  prompt: string;
}

/** اختيار من متعدد: خيار واحد صحيح، والعلامة كاملة أو صفر. */
export type ChoiceInput = InputBase & {
  kind: "choice";
  marks: number;
  options: ChoiceOption[];
};

/** إجابة قصيرة تصحَّح بمعايير دلالية مستقلة (علامات جزئية). */
export type TextInput = InputBase & {
  kind: "text";
  marks: number;
  rows?: number;
  placeholder?: string;
};

/** إجابة عددية: العدد + الوحدة من قائمة + خطوة التعويض، ولكلٍّ علامته. */
export type NumberInput = InputBase & {
  kind: "number";
  marks: number;
  /** خيارات الوحدة الظاهرة للطالب؛ null إذا كان الفرع بلا وحدة. */
  unitOptions: string[] | null;
  requiresSteps: boolean;
  placeholder?: string;
};

/** صح أو خطأ، مع خانة تصحيح تُطلب عندما تكون العبارة خاطئة في المفتاح. */
export type TrueFalseInput = InputBase & {
  kind: "tf";
  statement: string;
  allowsCorrection: boolean;
};

/** تصنيف صفوف على أعمدة (اختيار عمود لكل صف). */
export type MatrixInput = InputBase & {
  kind: "matrix";
  columns: { id: string; label: string }[];
  rows: { id: string; label: string }[];
  marksPerRow: number;
};

export type Input = ChoiceInput | TextInput | NumberInput | TrueFalseInput | MatrixInput;

export type Part = {
  id: string;
  label: string;
  figure?: FigureId;
  inputs: Input[];
};

export type Question = {
  id: string;
  title: string;
  /** اسم الدرس، أو تسمية الدرسين معاً للسؤال التركيبي. */
  lesson: string;
  /** الصفحات المرجعية كما وردت في المصدر. */
  pages: string;
  /** المهارة المقيسة (تظهر للمعلّم وفي التقرير). */
  skill: string;
  /** الموقف/السيناريو الذي تبدأ به الأسئلة. */
  intro: string;
  figure?: FigureId;
  table?: Table;
  parts: Part[];
};

/* ------------------------------------------------------------------ */
/* أسماء الدروس — مصدرها الوحيد هذا الملف                              */
/* ------------------------------------------------------------------ */

export const EXAM_LESSON_L1 = "الحركة والسكون";
export const EXAM_LESSON_L2 = "القوة والحركة";

/** الدروس الأصلية في الاختبار: اثنان فقط، ولا تُشتقّ من تصنيف الأسئلة. */
export const BASE_LESSONS = [EXAM_LESSON_L1, EXAM_LESSON_L2] as const;

/** فاصل التسمية المشتركة في `Question.lesson`. */
export const LESSON_JOINER = " + ";

/** هل السؤال مشترك بين الدرسين؟ (حصته تُحتسب في كليهما معاً) */
export function isSharedQuestion(question: Pick<Question, "lesson">): boolean {
  return question.lesson.includes(LESSON_JOINER);
}

/** هل ينتمي السؤال إلى درس أصلي معطى؟ (يطابق التصنيف في المصدر بدقة) */
export function belongsToLesson(question: Pick<Question, "lesson">, lesson: string): boolean {
  if (question.lesson === lesson) return true;
  return question.lesson.split(LESSON_JOINER).some((part) => part.trim() === lesson);
}

/* ------------------------------------------------------------------ */
/* بيانات المنصة والتصدير المرجعي                                      */
/* ------------------------------------------------------------------ */

export { GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS };

/** ورقة الاختبار كما تُعرض في المنصة: الصف ← الفصل ← المادة. */
export const EXAM_META = {
  grade: GRADE_LABEL,
  semester: SEMESTER_LABEL,
  subject: SUBJECT_LABEL,
  marks: TOTAL_MARKS,
} as const;

/** مساعدات بناء النصوص الغنية — تبقى قريبة من صياغة المصدر. */
export type RichPart = { text: string } | { math: string };
export type RichText = RichPart[];

export const t = (text: string): RichText => [{ text }];
export const m = (math: string): RichText => [{ math }];

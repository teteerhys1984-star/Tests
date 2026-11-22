/**
 * أنواع بيانات الاختبار ومنهجه.
 *
 * المصدر: مجلد `interactive-physics-Test-L1&2-model-B-24-11-26` (النموذج B)
 *   · الدرس الأول: الحركة والسكون — كتاب الفيزياء والكيمياء للصف السابع، ص 3–16.
 *   · الدرس الثاني: القوة والحركة — الصفحات 17–28.
 *   · لا يوجد أي سؤال من دروس أخرى، والمراجع والصفحات منقولة كما وردت في المصدر.
 */

import { EXAM_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";

export type RichPart = { text: string } | { math: string };
export type RichText = RichPart[];

export type Option = { id: string; label: string; latex?: string };

/** أنواع الفروع الأربعة كما في المصدر: اختيار، عددي، إجابة قصيرة، صيغة قانون. */
export type PartType = "choice" | "number" | "short" | "formula";

export type Part = {
  id: string;
  type: PartType;
  label: RichText;
  options?: Option[];
  /** وحدة مقترحة تُعرض بجوار حقل العدد (LaTeX). */
  suffix?: string;
  placeholder?: string;
};

export type FigureId = "force" | "motion" | "route" | "speedometer";

/** الدرسان ووحدة السؤال التركيبي، تماماً كما في المصدر. */
export type LessonName = "الحركة والسكون" | "القوة والحركة" | "الحركة والسكون + القوة والحركة";

export type Question = {
  id: string;
  title: string;
  lesson: LessonName;
  /** الصفحات المرجعية في الكتاب المدرسي كما وردت في المصدر. */
  pages: string;
  /** المهارة المقيسة (تظهر للمعلّم وفي التقرير). */
  skill: string;
  intro: RichText;
  figure?: FigureId;
  figureCaption?: RichText;
  figureSource?: string;
  parts: Part[];
};

export { EXAM_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS };

/** ورقة الاختبار كما تُعرض في المنصة: الصف ← الفصل ← المادة. */
export const EXAM_META = {
  grade: GRADE_LABEL,
  semester: SEMESTER_LABEL,
  subject: SUBJECT_LABEL,
  title: EXAM_TITLE,
  marks: TOTAL_MARKS,
} as const;

/** الدروس المشمولة بعلاماتها — يُبنى منها توزيع العلامات في النتيجة والتقرير والحمولة. */
export const LESSON_ORDER: readonly LessonName[] = [
  "الحركة والسكون",
  "القوة والحركة",
  "الحركة والسكون + القوة والحركة",
];

/** مساعدات بناء النصوص الغنية — تبقى قريبة من صياغة المصدر. */
export const t = (text: string): RichText => [{ text }];
export const m = (math: string): RichText => [{ math }];
export const choices = (labels: string[]): Option[] =>
  labels.map((label, index) => ({ id: String(index), label }));

/**
 * إحصاءات مشتقّة من بنك الأسئلة (لا محتوى تعليمي جديد هنا).
 * ملف منفصل حتى تبقى ملفات المصدر الأخرى مطابقة بايتاً ببايت.
 */
import { QUESTIONS, TOTAL_POINTS, questionPoints } from './index'

export { TOTAL_POINTS, questionPoints }

/** عدد الأسئلة الرئيسية. */
export const QUESTION_COUNT = QUESTIONS.length

/** عدد الفروع المقوّمة في الاختبار كله. */
export const PART_COUNT = QUESTIONS.reduce((s, q) => s + q.parts.length, 0)

/**
 * إعدادات هذا الاختبار المستقل.
 *
 * EXAM_ID يُستعمل لتسمية كل مفاتيح التخزين المحلي الخاصة بهذا الاختبار وحده:
 *   · المحاولة      : <EXAM_ID>-attempt-v1
 *   · كتم الصوت      : <EXAM_ID>-muted-v1
 *   · المحاولات المعلّقة: pending:<EXAM_ID>:<attemptId>
 * فلا يتشارك أي مفتاح مع اختبار آخر في المنصة.
 *
 * رابط Google Sheets والرمز هما نفس عقد الإرسال المعتمد في الاختبار المرجعي
 * grade5-math-unit1 (لم يُغيَّر الرابط ولا الرمز ولا Apps Script).
 */
export const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec'
export const SHEETS_TOKEN = '7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm'

export const EXAM_ID = 'grade-5-math-test-unit1-21-11'
export const EXAM_TITLE = 'Grade 5 Math Test Unit 1 (21-11)'

/** العنوان العربي الظاهر للطلاب. */
export const EXAM_TITLE_AR = 'مذاكرة بالوحدة الأولى'
export const EXAM_SUBTITLE_AR = 'الرياضيات — الصف الخامس الأساسي — الفصل الدراسي الأول'

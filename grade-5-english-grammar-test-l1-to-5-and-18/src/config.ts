/**
 * إعداد إرسال نتيجة الاختبار إلى جدول Google عبر تطبيق Google Apps Script.
 * العقد المرجعي نفسه المستخدم في اختبارات المنصة (راجع grade5-math-unit1/src/exam/submit.ts):
 *   · Content-Type: text/plain;charset=utf-8  (يتجنب طلب CORS التمهيدي مع Apps Script)
 *   · حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية لكل محاولة
 *   · attemptId فريد وثابت لمحاولة التسليم الواحدة
 *   · الحمولات المعلّقة تُحفظ في localStorage وتُعاد отправتها عند التحميل
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm"
export const EXAM_ID = "grade-5-english-grammar-test-l1-to-5-and-18"
export const EXAM_TITLE = "Grammar Test Lessons 1 to 5 and 18"

/**
 * إعدادات الاختبار (النموذج الثالث) والإرسال إلى Google Sheets.
 *
 * SHEETS_URL و SHEETS_TOKEN يطابقان عقد المنصة المعتمد في الاختبارات المرجعية
 * (grade5-math-unit1، والنموذجين الأول والثاني).
 *
 * EXAM_ID جديد وفريد لهذا النموذج ويطابق اسم مجلد النشر:
 *   grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern3
 * وهو مستقل تمامًا عن النموذج الأول (grade5-arabic-grammar-spelling-u1-u2-l1l2)
 * والنموذج الثاني (grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2) وجميع
 * الاختبارات الأخرى، فلا تتشارك النماذج مفاتيح التخزين أو المحاولات المعلّقة.
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const EXAM_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern3";
export const EXAM_TITLE =
  "قواعد اللغة والإملاء للوحدة الأولى وأول درسين من الوحدة الثانية — نموذج ثالث";
export const EXAM_MODEL_LABEL = "نموذج ثالث";

export const ATTEMPT_STORAGE_KEY = `exam:${EXAM_ID}:v1`;
export const SOUND_STORAGE_KEY = `exam:${EXAM_ID}:sound`;

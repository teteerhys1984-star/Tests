/**
 * إعدادات هذا الاختبار (النموذج الثاني) والإرسال إلى Google Sheets.
 * SHEETS_URL / SHEETS_TOKEN: نفس عقد المنصة المعتمد في الاختبار المرجعي
 * grade5-arabic-grammar-spelling-u1-u2-l1l2 (النموذج الأول) — لم يُغيَّرا.
 * EXAM_ID جديد وفريد لهذا النموذج ويطابق اسم مجلد النشر، ومختلف عن
 * EXAM_ID النموذج الأول (grade5-arabic-grammar-spelling-u1-u2-l1l2)
 * وعن أي اختبار آخر، فلا تُشارَك مفاتيح التخزين أو المحاولات المعلّقة.
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const EXAM_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2";
export const EXAM_TITLE =
  "قواعد اللغة والإملاء للوحدة الأولى وأول درسين من الوحدة الثانية — نموذج ثاني";
export const EXAM_MODEL_LABEL = "نموذج ثاني";
export const ATTEMPT_STORAGE_KEY = `exam:${EXAM_ID}:v1`;
export const SOUND_STORAGE_KEY = `exam:${EXAM_ID}:sound`;

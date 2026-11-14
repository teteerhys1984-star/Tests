/**
 * إعدادات الاختبار والإرسال إلى Google Sheets (عبر Google Apps Script).
 *
 * SHEETS_URL و SHEETS_TOKEN مأخوذان حرفياً من الاختبار المرجعي grade5-math-unit1
 * (وهما نفساهما في الاختبار العربي السابق grade5-arabic-u1-u2-l1l2)، ولم يُغيَّرا.
 *
 * EXAM_ID خاص بهذا النموذج (النموذج الثاني) ويطابق اسم مجلد النشر:
 *   grade5-arabic-u1-u2-l1l2-pattern2
 * وهو مختلف عن EXAM_ID النموذج الأول (grade5-arabic-u1-u2-l1l2) وعن EXAM_ID
 * الاختبار الرياضي المرجعي، فلا تتشارك النماذج مفتاح تخزين ولا سجلات محاولات.
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const EXAM_ID = "grade5-arabic-u1-u2-l1l2-pattern2";
export const EXAM_TITLE =
  "اختبار اللغة العربية — الصف الخامس — الوحدة الأولى والدرسان الأول والثاني من الوحدة الثانية (النموذج الثاني)";

/** عنوان قصير يظهر داخل واجهة الاختبار (شارة «النموذج الثاني»). */
export const EXAM_MODEL_LABEL = "النموذج الثاني";

/** مفتاح جلسة المحاولة لهذا الاختبار وحده: يُشتق من EXAM_ID فلا يتعارض مع أي اختبار آخر. */
export const ATTEMPT_STORAGE_KEY = `exam:${EXAM_ID}:v1`;
/** مفتاح تفضيل الصوت، مستقل بالنموذج أيضاً. */
export const SOUND_STORAGE_KEY = `exam:${EXAM_ID}:sound`;

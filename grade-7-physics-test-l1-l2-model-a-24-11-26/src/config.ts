/**
 * معرّفات التخزين المحلي وإعدادات الإرسال لهذا الاختبار.
 *
 * كل مفاتيح التخزين تُبنى من EXAM_ID، فلا تتقاطع بيانات هذا الاختبار مع
 * Model B أو أي اختبار آخر على المنصة (كل اختبار صفحة مستقلة، والعزل مُثبَّت صراحةً).
 */

/**
 * خادم Apps Script والرمز مأخوذان حرفياً من الاختبار المرجعي
 * `grade5-math-unit1/src/config.ts` عبر `grade-7-physics-test-l1-l2-model-b-24-11-26`
 * — لم يُغيّر أيٌّ منهما.
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";

/** معرّف الاختبار = اسم مجلد النشر في جذر المستودع (يتحقّق منه landing/scripts/verify-site.py). */
export const EXAM_ID = "grade-7-physics-test-l1-l2-model-a-24-11-26";

/** عنوان الاختبار الظاهر للطالب حرفياً كما طُلب — مطابق لوسم <title> في index.html. */
export const EXAM_TITLE = "اختبار فيزياء بدرسي (الحركة والسكون & القوة والحركة) 23-11-2026";

/** عنوان مختصر يُستعمل في الترويسة والنتيجة واسم ملف التقرير. */
export const EXAM_SHORT_TITLE = "اختبار الفيزياء — النموذج A";

export const GRADE_LABEL = "الصف السابع";
export const SEMESTER_LABEL = "الفصل الأول";
export const SUBJECT_LABEL = "الفيزياء";

/** مسار مجلد الاختبار المنشور على المنصة (يُستعمل في الترويسة والتقرير فقط). */
export const PLATFORM_PATH = "الصف السابع · الفصل الأول · الفيزياء";

/** كلمة مرور بوابة المعلّم لهذا الاختبار — لا تُغيّر بوابة المنصة العامة. */
export const TEACHER_PASSWORD = "somer173";

export const CONTACT = {
  name: "المهندس سومر شاهين",
  phone: "0930215022",
  whatsapp: "https://wa.me/963930215022",
};

/* ------------------------------------------------------------------ */
/* مفاتيح التخزين — معزولة بهذا الاختبار وحده                          */
/* ------------------------------------------------------------------ */

/** محاولة الطالب الجارية أو المسلَّمة (الإجابات، السؤال الحالي، وقت البدء). */
export const ATTEMPT_KEY = `${EXAM_ID}:attempt:v1`;
/** إعداد الصوت (كتم/تشغيل). */
export const SOUND_KEY = `${EXAM_ID}:sound:v1`;
/** بادئة الحمولات المعلّقة: pending:<EXAM_ID>:<attemptId> — نفس عقد المرجع. */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

/** مجموع العلامات: عشرة أسئلة × عشر علامات — مُتحقَّق منه آلياً من مفتاح الإجابة. */
export const TOTAL_MARKS = 100;

/** أسماء ملف التقرير: بادئة خاصة بالنموذج A تفصلها عن النموذج B. */
export const REPORT_FILE_PREFIX = "Grade7_Physics_L1L2_ModelA";

export const EXAM_ID = "grade-7-physics-l1-l2-problems";
export const EXAM_TITLE = "مسائل الدرسين الأول والثاني";
export const EXAM_SUBTITLE = "الصف السابع — الفصل الأول — الفيزياء";
export const GRADE_LABEL = "الصف السابع";
export const SEMESTER_LABEL = "الفصل الأول";
export const SUBJECT_LABEL = "الفيزياء";
export const ADDED_AT = "23-11-2026";
export const TOTAL_MARKS = 100;

// كلمة مرور ركن المعلّم (مطابقة للمصدر الأصلي)
export const TEACHER_PASSWORD = "somer173";

// مفاتيح التخزين المحلي المعزولة لهذا الاختبار فقط
export const ATTEMPT_STORAGE_KEY = `${EXAM_ID}:attempt:v1`;
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;
export const TEACHER_AUTH_KEY = `${EXAM_ID}:teacher-auth:v1`;

// عقد الإرسال إلى Google Sheets (مطابق للاختبار المرجعي grade5-math-unit1)
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";

export const RETRY_DELAYS_MS = [2000, 5000] as const;
export const MAX_ATTEMPTS = 3;
export const ATTEMPT_TIMEOUT_MS = 30000;

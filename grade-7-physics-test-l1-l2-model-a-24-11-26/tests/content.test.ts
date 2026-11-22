/**
 * اختبارات المحتوى والبنية والعلامات والحفظ المحلي — للنموذج A.
 *
 * يتحقّق من:
 *   · عدد الأسئلة (10) والفروع (37) وحقول الإدخال (45) كما استُخرجت من المصدر.
 *   · توزيع العلامات: كل سؤال = 10، والمجموع = 100، ومجموع QUESTION_MARKS مطابق.
 *   · توزيع الدرسين: درسان فقط، والسؤال التركيبي حصة مشتركة (10) لا درس ثالث.
 *   · مطابقة أنواع المفاتيح لأنواع الحقول، ووجود مفتاح لكل حقل بلا زيادة.
 *   · معرّفات التخزين المعزولة للنموذج A وحدها.
 *
 * التشغيل: npm test
 */

import { questions } from "../src/data/questions";
import { answerKey, QUESTION_MARKS } from "../src/data/answerKey";
import {
  ATTEMPT_KEY,
  EXAM_ID,
  EXAM_TITLE,
  PENDING_PREFIX,
  SHEETS_TOKEN,
  SHEETS_URL,
  SOUND_KEY,
  TEACHER_PASSWORD,
  TOTAL_MARKS,
} from "../src/config";
import { countParts, lessonOverlap, lessonTotals, rubricMax, totalMarksFromKey } from "../src/lib/grading";
import { BASE_LESSONS, EXAM_META, LESSON_JOINER, belongsToLesson, isSharedQuestion } from "../src/exam/types";
import { loadAttempt, saveAttempt, clearAttempt, loadMuted, saveMuted, type Attempt } from "../src/lib/persistence";

let failures = 0;
function check(name: string, condition: boolean, extra = ""): void {
  if (!condition) {
    failures += 1;
    console.log(`  ✗ ${name}${extra ? ` → ${extra}` : ""}`);
  } else {
    console.log(`  ✓ ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

/* ------------------------- تخزين وهمي ------------------------- */
class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}
const store = new MemoryStorage();
(globalThis as any).window = { localStorage: store };

/* ------------------------- البنية ------------------------- */
console.log("\n— البنية المستخرجة من المصدر —");
check("عدد الأسئلة 10", questions.length === 10, String(questions.length));
check("عدد الفروع 37", countParts(questions) === 37, String(countParts(questions)));
check(
  "عدد حقول الإدخال 45",
  questions.reduce((sum, question) => sum + question.parts.reduce((n, part) => n + part.inputs.length, 0), 0) === 45,
  String(questions.reduce((sum, question) => sum + question.parts.reduce((n, part) => n + part.inputs.length, 0), 0)),
);
check(
  "معرّفات الأسئلة q1..q10 بالترتيب",
  questions.map((question) => question.id).join(",") === "q1,q2,q3,q4,q5,q6,q7,q8,q9,q10",
  questions.map((question) => question.id).join(","),
);

const expectedParts: Record<string, number> = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 4, q6: 4, q7: 5, q8: 4, q9: 4, q10: 4 };
for (const [id, expected] of Object.entries(expectedParts)) {
  const question = questions.find((item) => item.id === id);
  check(`عدد فروع ${id} = ${expected}`, !!question && question.parts.length === expected, String(question?.parts.length));
}
check(
  "مجموع الفروع المعلن = مجموع فروع الأسئلة",
  Object.values(expectedParts).reduce((a, b) => a + b, 0) === countParts(questions),
);
check(
  "لا فرع بمعرّف مكرّر",
  new Set(questions.flatMap((question) => question.parts.map((part) => part.id))).size === countParts(questions),
);
check(
  "لا حقل إدخال بمعرّف مكرّر",
  new Set(questions.flatMap((question) => question.parts.flatMap((part) => part.inputs.map((input) => input.id)))).size === 45,
);
check(
  "كل حقل إدخال معرّفه يبدأ بمعرّف فرعه",
  questions.every((question) =>
    question.parts.every((part) => part.inputs.every((input) => input.id.startsWith(part.id))),
  ),
);
check("كل سؤال له عنوان", questions.every((question) => question.title.trim().length > 3));
check("كل سؤال له نصّ تمهيدي", questions.every((question) => question.intro.trim().length > 20));
check("كل سؤال له صفحات مرجعية", questions.every((question) => /^\d/.test(question.pages)));
check("كل سؤال له مهارة", questions.every((question) => question.skill.trim().length > 10));
check(
  "كل فرع له نصّ",
  questions.every((question) =>
    question.parts.every((part) => part.label.replace(/\$[^$]*\$/g, "").trim().length > 3),
  ),
);

/* ------------------------- الرسوم والجداول ------------------------- */
console.log("\n— الرسوم والجداول المصدرية —");
const questionFigures = questions.map((question) => question.figure).filter(Boolean);
const partFigures = questions.flatMap((question) => question.parts.map((part) => part.figure).filter(Boolean));
const allFigures = [...questionFigures, ...partFigures];
check("ثلاثة رسوم على مستوى السؤال (force, earth-moon, dt-graph)", questionFigures.length === 3, questionFigures.join(","));
check("رسم واحد على مستوى الفرع (paths في الفرع ج من السؤال الثالث)",
  partFigures.length === 1 && partFigures[0] === "paths", partFigures.join(","));
check("أربعة رسوم مختلفة في المجموع كما في المصدر",
  allFigures.length === 4 && new Set(allFigures).size === 4, allFigures.join(","));
check("الرسوم هي المتوقّعة", allFigures.join(",") === "force,earth-moon,dt-graph,paths", allFigures.join(","));
check("جدول واحد فقط (السؤال الخامس)", questions.filter((question) => question.table).length === 1);
const table = questions.find((question) => question.table)?.table;
check("الجدول: 6 أعمدة (عنوان الزمن + 5 أزمنة) وصفّان (جسم أ وجسم ب)",
  !!table && table.head.length === 6 && table.rows.length === 2, `${table?.head.length}/${table?.rows.length}`);
check("الجدول: كل صف 6 خلايا مطابقة للرأس",
  !!table && table.rows.every((row) => row.length === table.head.length));

/* ------------------------- الدروس ------------------------- */
console.log("\n— الدروس (درسان فقط + سؤال تركيبي) —");
const lessons = questions.map((question) => question.lesson);
check(
  "أسماء الدروس هي الحركة والسكون والقوة والحركة فقط",
  lessons.every(
    (lesson) =>
      lesson === BASE_LESSONS[0] ||
      lesson === BASE_LESSONS[1] ||
      lesson.split(LESSON_JOINER).every((piece) => BASE_LESSONS.includes(piece.trim() as never)),
  ),
  lessons.join(" | "),
);
const shared = questions.filter(isSharedQuestion);
check("سؤال تركيبي واحد فقط", shared.length === 1, String(shared.length));
check("السؤال التركيبي هو العاشر", shared[0]?.id === "q10", shared[0]?.id);
check("لا درس ثالث في أي تسمية", lessons.every((lesson) => !lesson.includes("ثالث")));
check("كل درس أصلي له أسئلة", BASE_LESSONS.every((lesson) => questions.some((question) => belongsToLesson(question, lesson))));
check("L1 = 5 أسئلة صريحة", questions.filter((question) => question.lesson === BASE_LESSONS[0]).length === 5);
check("L2 = 4 أسئلة صريحة", questions.filter((question) => question.lesson === BASE_LESSONS[1]).length === 4);
check(
  "السؤال Q10 مصنّف في الدرسين معاً",
  belongsToLesson(shared[0], BASE_LESSONS[0]) && belongsToLesson(shared[0], BASE_LESSONS[1]),
);
check("بيانات المنصة: الصف السابع/الفصل الأول/الفيزياء/100", 
  EXAM_META.grade === "الصف السابع" && EXAM_META.semester === "الفصل الأول" && EXAM_META.subject === "الفيزياء" && EXAM_META.marks === 100,
  `${EXAM_META.grade}/${EXAM_META.semester}/${EXAM_META.subject}/${EXAM_META.marks}`);

/* ------------------------- العلامات ------------------------- */
console.log("\n— توزيع العلامات —");
check("كل سؤال له مفتاح", Object.keys(answerKey).length === 10 && questions.every((question) => !!answerKey[question.id]));
check(
  "مفتاح لكل حقل داخل أسئلته",
  questions.every((question) => question.parts.every((part) => part.inputs.every((input) => !!answerKey[question.id].rubric[input.id]))),
);
check(
  "لا مفتاح لحقل غير موجود",
  Object.entries(answerKey).every(([questionId, entry]) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return false;
    const ids = question.parts.flatMap((part) => part.inputs.map((input) => input.id));
    return Object.keys(entry.rubric).every((inputId) => ids.includes(inputId));
  }),
);
check(
  "عدد الحقول في المفتاح = 45",
  Object.values(answerKey).reduce((sum, entry) => sum + Object.keys(entry.rubric).length, 0) === 45,
);

const perQuestion = questions.map((question) =>
  question.parts.reduce(
    (sum, part) => sum + part.inputs.reduce((n, input) => n + rubricMax(answerKey[question.id].rubric[input.id]), 0),
    0,
  ),
);
check("كل سؤال = 10 علامات", perQuestion.every((marks) => marks === 10), perQuestion.join(","));
check("مجموع الاختبار = 100", perQuestion.reduce((a, b) => a + b, 0) === TOTAL_MARKS, String(perQuestion.reduce((a, b) => a + b, 0)));
check("totalMarksFromKey = 100", totalMarksFromKey(questions, answerKey) === 100, String(totalMarksFromKey(questions, answerKey)));
check(
  "QUESTION_MARKS المشتق يطابق الحساب المباشر",
  questions.every((question, index) => QUESTION_MARKS[question.id] === perQuestion[index]),
  Object.keys(QUESTION_MARKS).map((id) => `${id}:${QUESTION_MARKS[id]}`).join(" "),
);
check(
  "لا علامة صفرية أو سالبة",
  Object.values(answerKey).every((entry) => Object.values(entry.rubric).every((rubric) => rubricMax(rubric) > 0)),
);
check(
  "كل العلامات أعداد صحيحة",
  Object.values(answerKey).every((entry) =>
    Object.values(entry.rubric).every((rubric) => Number.isInteger(rubricMax(rubric) * 2)),
  ),
);
check(
  "مجموع معايير الإجابة القصيرة = علامتها",
  Object.values(answerKey).every((entry) =>
    Object.values(entry.rubric).every((rubric) =>
      rubric.kind === "text" ? rubric.criteria.reduce((sum, criterion) => sum + criterion.marks, 0) === rubric.marks : true,
    ),
  ),
);
check(
  "مجموع معايير تصحيح صح/خطأ = علامة التصحيح",
  Object.values(answerKey).every((entry) =>
    Object.values(entry.rubric).every((rubric) =>
      rubric.kind === "tf" && rubric.correction
        ? rubric.correction.criteria.reduce((sum, criterion) => sum + criterion.marks, 0) === rubric.correction.marks
        : true,
    ),
  ),
);

/* ------------------------- توزيع الدرسين ------------------------- */
console.log("\n— توزيع الدرسين وحساب التداخل —");
{
  const blank = {
    total: 0,
    possible: TOTAL_MARKS,
    questions: questions.map((question) => ({
      questionId: question.id,
      earned: 0,
      possible: QUESTION_MARKS[question.id],
      parts: [],
      inputs: [],
    })),
    fullParts: 0,
    partialParts: 0,
    wrongParts: 0,
    emptyParts: 0,
  };
  const totals = lessonTotals(questions, blank);
  const overlap = lessonOverlap(questions, blank);
  check("درسان في التوزيع فقط", totals.length === 2, String(totals.length));
  check("أسماء الدرسين", totals.map((row) => row.lesson).join("|") === "الحركة والسكون|القوة والحركة", totals.map((row) => row.lesson).join("|"));
  check("L1 = 60 علامة (50 + 10 تركيبي)", totals[0].possible === 60, String(totals[0].possible));
  check("L2 = 50 علامة (40 + 10 تركيبي)", totals[1].possible === 50, String(totals[1].possible));
  check("L1 يشمل 6 أسئلة (5 + 1 تركيبي)", totals[0].questions === 6, String(totals[0].questions));
  check("L2 يشمل 5 أسئلة (4 + 1 تركيبي)", totals[1].questions === 5, String(totals[1].questions));
  check("الحصة المشتركة 10 في كل درس", totals.every((row) => row.sharedPossible === 10 && row.sharedQuestions === 1));
  check("مجموع الدرسين 110 (تكرار 10)", overlap.possible === 110, String(overlap.possible));
  check("التداخل 10 علامات", overlap.sharedPossible === 10, String(overlap.sharedPossible));
  check("بعد إزالة التكرار 100", overlap.uniquePossible === 100, String(overlap.uniquePossible));
  check("مرجع العلامة هو مجموع الاختبار", overlap.examPossible === 100 && overlap.examTotal === 0);
  check("مجموع الدروس ≠ مجموع الاختبار (لا يُستعمل مقاماً)", overlap.possible !== overlap.examPossible);
}

/* ------------------------- أنواع الحقول والمفاتيح ------------------------- */
console.log("\n— أنواع الحقول والمفاتيح —");
const kinds = questions.flatMap((question) => question.parts.flatMap((part) => part.inputs.map((input) => input.kind)));
check("الأنواع الخمسة مستعملة", new Set(kinds).size === 5, Array.from(new Set(kinds)).join(","));
check(
  "نوع المفتاح يطابق نوع الحقل",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) => answerKey[question.id].rubric[input.id].kind === input.kind),
    ),
  ),
);
check(
  "اختيار: خيار صحيح موجود بين الخيارات",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) => {
        const rubric = answerKey[question.id].rubric[input.id];
        return input.kind === "choice" && rubric.kind === "choice" ? input.options.some((option) => option.id === rubric.answer) : true;
      }),
    ),
  ),
);
check(
  "اختيار: كل حقل له 2 خيارات على الأقل ونصّ غير فارغ",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) =>
        input.kind === "choice" ? input.options.length >= 2 && input.options.every((option) => option.label.trim().length > 0) : true,
      ),
    ),
  ),
);
check(
  "عددي: القيمة في المفتاح والوحدة بين خيارات الحقل",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) => {
        const rubric = answerKey[question.id].rubric[input.id];
        if (input.kind !== "number" || rubric.kind !== "number") return true;
        if (rubric.unit && (!input.unitOptions || !input.unitOptions.includes(rubric.unit.answer))) return false;
        if (rubric.steps && !input.requiresSteps) return false;
        return Number.isFinite(rubric.value);
      }),
    ),
  ),
);
check(
  "تصنيف: كل صف له إجابة صحيحة داخل الأعمدة",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) => {
        const rubric = answerKey[question.id].rubric[input.id];
        if (input.kind !== "matrix" || rubric.kind !== "matrix") return true;
        const columns = input.columns.map((column) => column.id);
        return input.rows.length === rubric.rows.length && rubric.rows.every((row) => columns.includes(row.answer));
      }),
    ),
  ),
);
check(
  "صح/خطأ: الحكم قيمة صالحة، والتصحيح مرتبط بالحقل",
  questions.every((question) =>
    question.parts.every((part) =>
      part.inputs.every((input) => {
        const rubric = answerKey[question.id].rubric[input.id];
        if (input.kind !== "tf" || rubric.kind !== "tf") return true;
        return (rubric.verdict === "true" || rubric.verdict === "false") && Boolean(rubric.correction) === Boolean(input.allowsCorrection);
      }),
    ),
  ),
);
check(
  "كل سؤال له تفسير غير فارغ",
  Object.values(answerKey).every((entry) => entry.explanation.trim().length > 20),
);

/* ------------------------- الإعداد والمعرّفات ------------------------- */
console.log("\n— الإعداد ومعرّفات التخزين —");
check("EXAM_ID = اسم المجلد", EXAM_ID === "grade-7-physics-test-l1-l2-model-a-24-11-26", EXAM_ID);
check("EXAM_ID مستقل عن النموذج B", EXAM_ID !== "grade-7-physics-test-l1-l2-model-b-24-11-26");
check("مفتاح المحاولة معزول", ATTEMPT_KEY === `${EXAM_ID}:attempt:v1`, ATTEMPT_KEY);
check("مفتاح الصوت معزول", SOUND_KEY === `${EXAM_ID}:sound:v1`, SOUND_KEY);
check("بادئة الحمولات المعلّقة معزولة", PENDING_PREFIX === `pending:${EXAM_ID}:`, PENDING_PREFIX);
check("كلمة مرور المعلّم somer173", TEACHER_PASSWORD === "somer173");
check("العنوان الظاهر حرفياً كما طُلب", EXAM_TITLE === "اختبار فيزياء بدرسي (الحركة والسكون & القوة والحركة) 23-11-2026", EXAM_TITLE);
check("SHEETS_URL من Apps Script", SHEETS_URL.startsWith("https://script.google.com/macros/s/") && SHEETS_URL.endsWith("/exec"), SHEETS_URL.slice(0, 44) + "…");
check("SHEETS_TOKEN بطول 32", SHEETS_TOKEN.length === 32, String(SHEETS_TOKEN.length));

/* ------------------------- الحفظ والاستعادة ------------------------- */
console.log("\n— الحفظ والاستعادة والعزل —");
const base: Attempt = {
  version: 1,
  examId: EXAM_ID,
  status: "in_progress",
  studentName: "طالبة تجريبية",
  responses: { q1c: "لأن المرجع مختلف", "q2c:verdict": "false", "q5d:value": "4" },
  questionIndex: 2,
  startedAt: 1_700_000_000_000,
};
store.clear();
saveAttempt(base);
const restored = loadAttempt(EXAM_ID, questions.length);
check("استعادة محاولة صحيحة", !!restored && restored.studentName === "طالبة تجريبية", restored?.studentName);
check("استعادة الإجابات كما هي", restored?.responses.q1c === "لأن المرجع مختلف" && restored?.responses["q5d:value"] === "4");
check("استعادة موضع السؤال", restored?.questionIndex === 2);

store.clear();
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, examId: "grade-7-physics-test-l1-l2-model-b-24-11-26" }));
check("رفض محاولة النموذج B (عزل)", loadAttempt(EXAM_ID, questions.length) === null);

store.clear();
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, questionIndex: 99 }));
check("رفض موضع سؤال خارج النطاق", loadAttempt(EXAM_ID, questions.length) === null);

store.clear();
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, responses: { q1c: 7 } }));
check("رفض إجابة غير نصية", loadAttempt(EXAM_ID, questions.length) === null);

store.clear();
store.setItem(ATTEMPT_KEY, "{ليس JSON");
check("رفض JSON تالف دون كسر", loadAttempt(EXAM_ID, questions.length) === null);

store.clear();
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, status: "submitted", finishedAt: base.startedAt - 5 }));
check("رفض تسليم قبل البدء", loadAttempt(EXAM_ID, questions.length) === null);

store.clear();
saveAttempt({ ...base, status: "submitted", finishedAt: base.startedAt + 60_000 });
check("قبول محاولة مسلَّمة صحيحة", loadAttempt(EXAM_ID, questions.length)?.status === "submitted");

clearAttempt();
check("حذف المحاولة", loadAttempt(EXAM_ID, questions.length) === null);

check("الصوت غير مكتوم افتراضياً", loadMuted() === false);
saveMuted(true);
check("حفظ كتم الصوت", loadMuted() === true);
saveMuted(false);
check("إلغاء كتم الصوت", loadMuted() === false);

store.clear();
store.setItem("grade-7-physics-test-l1-l2-model-b-24-11-26:attempt:v1", JSON.stringify(base));
check("محاولة النموذج B لا تظهر في النموذج A", loadAttempt(EXAM_ID, questions.length) === null);
check("مفتاح النموذج B باقٍ كما هو", store.getItem("grade-7-physics-test-l1-l2-model-b-24-11-26:attempt:v1") !== null);

console.log(`\n${failures === 0 ? "✅" : "❌"} المحتوى: ${failures === 0 ? "كل الفحوص ناجحة" : `${failures} فحصاً فاشلاً`}`);
if (failures) process.exit(1);

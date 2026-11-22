/**
 * اختبارات الإرسال إلى Google Sheets بعقد `grade5-math-unit1` (كما في النموذج B) — بلا أي اتصال حقيقي.
 *
 * يتحقّق من:
 *   · شكل الحمولة: الحقول الأحد عشر بالترتيب نفسه، ودرسـان فقط، وحقول التداخل.
 *   · `summary.total`/`summary.max` = 100 (لا مجموع الدرسين 110).
 *   · النجاح بـ ok:true أو duplicate:true، وحذف أي حمولة معلّقة.
 *   · الفشل: 3 محاولات بفواصل 2 ثم 5 ثوانٍ، ثم حفظ تحت pending:<EXAM_ID>:<attemptId>.
 *   · المهلة، وإعادة إرسال المعلّق عند التحميل، وتجاهل معلّقات الاختبارات الأخرى.
 *   · نوع المحتوى text/plain (بلا preflight)، ولا كتابة في console.
 *
 * التشغيل: npm test
 */

import { questions } from "../src/data/questions";
import { answerKey } from "../src/data/answerKey";
import { gradeExam, type Responses } from "../src/lib/grading";
import { buildReport, type AttemptMeta } from "../src/lib/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX as SUBMIT_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  newAttemptId,
  pendingKey,
  retryPending,
  sendWithRetry,
  sharedQuestionCount,
  type FetchLike,
  type StorageLike,
  type SubmissionPayload,
} from "../src/exam/submit";
import { EXAM_ID, EXAM_TITLE, PENDING_PREFIX as CONFIG_PREFIX, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { buildResponses } from "./helpers";

let failures = 0;
function check(name: string, condition: boolean, extra = ""): void {
  if (!condition) {
    failures += 1;
    console.log(`  ✗ ${name}${extra ? ` → ${extra}` : ""}`);
  } else {
    console.log(`  ✓ ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

class MemoryStorage implements StorageLike {
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
  keys() {
    return Array.from(this.map.keys());
  }
}

const noSleep = async () => {};

const meta: AttemptMeta = {
  studentName: "طالبة اختبار",
  startAt: new Date("2026-11-23T08:00:00Z"),
  submitAt: new Date("2026-11-23T08:20:00Z"),
  elapsedMs: 20 * 60 * 1000,
};
const perfect: Responses = buildResponses("perfect");
const result = gradeExam(questions, perfect, answerKey);
const reportText = buildReport(questions, meta, result, perfect, answerKey);
const payload: SubmissionPayload = buildPayload({
  attemptId: "test-attempt-1",
  meta,
  order: questions,
  answers: perfect,
  result,
  reportText,
  key: answerKey,
});

/* ==================== الحمولة ==================== */
console.log("\n— الحمولة وعقد الإرسال —");
const expectedKeys = [
  "token",
  "attemptId",
  "examId",
  "examTitle",
  "studentName",
  "startAt",
  "submitAt",
  "elapsedSec",
  "summary",
  "lessons",
  "lessonTotals",
  "details",
  "reportText",
];
check("الحقول كلها بالترتيب نفسه", Object.keys(payload).join(",") === expectedKeys.join(","), Object.keys(payload).join(","));
check("token من الإعدادات", payload.token === SHEETS_TOKEN);
check("examId من الإعدادات", payload.examId === EXAM_ID);
check("examTitle من الإعدادات", payload.examTitle === EXAM_TITLE);
check("attemptId كما مُرِّر", payload.attemptId === "test-attempt-1");
check("اسم الطالب", payload.studentName === "طالبة اختبار");
check("startAt ISO", payload.startAt === "2026-11-23T08:00:00.000Z");
check("submitAt ISO", payload.submitAt === "2026-11-23T08:20:00.000Z");
check("elapsedSec ثوانٍ صحيحة", payload.elapsedSec === 1200, String(payload.elapsedSec));
check("summary.total = 100 و max = 100", payload.summary.total === 100 && payload.summary.max === 100);
check("summary.percentage = 100", payload.summary.percentage === 100);
check("summary.gradeLabel = ممتاز", payload.summary.gradeLabel === "ممتاز");
check(
  "summary يحوي حقول الفروع السبعة",
  ["fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"].every(
    (key) => key in payload.summary,
  ),
);
check("summary: 10 أسئلة كاملة", payload.summary.fullQuestions === 10, String(payload.summary.fullQuestions));
check("summary: 45 حقلاً صحيحاً", payload.summary.correctSubparts === 45, String(payload.summary.correctSubparts));

check("lessons: درسان فقط (لا فئة ثالثة)", payload.lessons.length === 2, payload.lessons.map((lesson) => `${lesson.title}:${lesson.max}`).join(" | "));
check(
  "lessons: الأسماء هي الدروس الأصلية",
  payload.lessons.map((lesson) => lesson.title).join("|") === "الحركة والسكون|القوة والحركة",
  payload.lessons.map((lesson) => lesson.title).join("|"),
);
check("lessons: لا بند للسؤال التركيبي", payload.lessons.every((lesson) => !lesson.title.includes("+") && !lesson.title.includes("تركيب")));
check("lessons: 60 و 50 علامة", payload.lessons.map((lesson) => lesson.max).join(",") === "60,50", payload.lessons.map((lesson) => lesson.max).join(","));
check("lessons: 6 و 5 أسئلة", payload.lessons.map((lesson) => lesson.questions).join(",") === "6,5", payload.lessons.map((lesson) => lesson.questions).join(","));
check(
  "lessons: الحصة المشتركة 10 داخل كل درس",
  payload.lessons.every((lesson) => lesson.sharedQuestions === 1 && lesson.sharedMax === 10 && lesson.sharedAwarded === 10),
);
check("sharedQuestionCount = 1", sharedQuestionCount(questions) === 1, String(sharedQuestionCount(questions)));
check("lessonTotals: الدرسان فقط", payload.lessonTotals.lessons === 2, String(payload.lessonTotals.lessons));
check("lessonTotals: 110 إجمالي التوزيع و10 تداخل", payload.lessonTotals.possible === 110 && payload.lessonTotals.sharedPossible === 10);
check("lessonTotals: بعد إزالة التكرار 100", payload.lessonTotals.uniquePossible === 100, String(payload.lessonTotals.uniquePossible));
check("lessonTotals: مرجع العلامة هو مجموع الاختبار", payload.lessonTotals.examTotal === 100 && payload.lessonTotals.examPossible === 100);
check("lessonTotals: ملاحظة توضّح عدم الجمع", payload.lessonTotals.note.includes("مرتين") && payload.lessonTotals.note.includes("لا تُجمع"));
check("details = 45 حقلاً", payload.details.length === 45, String(payload.details.length));
check(
  "كل تفصيل يحوي حقوله التسعة",
  payload.details.every((detail) =>
    ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"].every((key) => key in detail),
  ),
);
check("ترقيم الأسئلة 1..10", payload.details[0].q === 1 && payload.details[payload.details.length - 1].q === 10);
check("كل تفصيل ينتمي إلى درس أو الدرسين", payload.details.every((detail) => detail.lessons.length > 0));
check("حالة التفصيل عربية", payload.details.every((detail) => ["إجابة صحيحة", "إجابة صحيحة جزئياً", "إجابة خاطئة", "لم تُجب"].includes(detail.status)));
check("reportText مضمّن كما هو", payload.reportText === reportText);
check("الحمولة قابلة للتسلسل JSON", JSON.parse(JSON.stringify(payload)).details.length === 45);
check("newAttemptId فريد", newAttemptId() !== newAttemptId());
check("newAttemptId نصّ غير فارغ", newAttemptId().length >= 8, newAttemptId());
check("PENDING_PREFIX من config", SUBMIT_PREFIX === CONFIG_PREFIX && SUBMIT_PREFIX === `pending:${EXAM_ID}:`);
check("pendingKey", pendingKey("abc") === `pending:${EXAM_ID}:abc`);
check("MAX_ATTEMPTS = 3", MAX_ATTEMPTS === 3, String(MAX_ATTEMPTS));
check("فواصل إعادة المحاولة 2000 ثم 5000", RETRY_DELAYS_MS.join(",") === "2000,5000", RETRY_DELAYS_MS.join(","));
check("مهلة المحاولة 30 ثانية", ATTEMPT_TIMEOUT_MS === 30000, String(ATTEMPT_TIMEOUT_MS));

/* ==================== النجاح ==================== */
console.log("\n— النجاح —");
{
  const storage = new MemoryStorage();
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return { text: async () => '{"ok":true}' };
  };
  const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep });
  check("نجاح فوري", ok === true);
  check("طلب واحد فقط", calls.length === 1, String(calls.length));
  check("إلى SHEETS_URL نفسه", calls[0].url === SHEETS_URL);
  check("POST", calls[0].init.method === "POST");
  check("نوع المحتوى text/plain;charset=utf-8 (بلا preflight)", (calls[0].init.headers as Record<string, string>)["Content-Type"] === "text/plain;charset=utf-8");
  check("الجسم هو الحمولة نفسها", JSON.parse(String(calls[0].init.body)).attemptId === "test-attempt-1");
  check("لا حمولة معلّقة بعد النجاح", storage.keys().length === 0, storage.keys().join(","));
}

console.log("\n— duplicate:true يُعدّ نجاحاً —");
{
  const storage = new MemoryStorage();
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => '{"duplicate":true}' }), storage, sleep: noSleep });
  check("duplicate مقبول", ok === true);
  check("لا معلّق", storage.keys().length === 0);
}

console.log("\n— ردّ غير مؤكِّد يُعدّ فشلاً —");
for (const body of ['{"ok":false}', '{"error":"x"}', "not json", "{}", "[]", "null"]) {
  const storage = new MemoryStorage();
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => body }), storage, sleep: noSleep });
  check(`ردّ ${body} ← فشل مع حفظ معلّق`, ok === false && storage.keys().join() === pendingKey(payload.attemptId));
}

/* ==================== الفشل وإعادة المحاولة ==================== */
console.log("\n— الفشل مع إعادة المحاولة —");
{
  const storage = new MemoryStorage();
  let calls = 0;
  const sleeps: number[] = [];
  const fetchImpl: FetchLike = async () => {
    calls += 1;
    throw new Error("network down");
  };
  const ok = await sendWithRetry(payload, {
    fetchImpl,
    storage,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  check("فشل بعد 3 محاولات", ok === false, String(calls));
  check("3 محاولات بالضبط", calls === MAX_ATTEMPTS, String(calls));
  check("فواصل 2000 ثم 5000", sleeps.join(",") === RETRY_DELAYS_MS.join(","), sleeps.join(","));
  check("حُفظت الحمولة معلّقة", storage.keys().join() === pendingKey(payload.attemptId), storage.keys().join(","));
  check("المعلّق هو الحمولة كاملة", JSON.parse(storage.getItem(pendingKey(payload.attemptId))!).details.length === 45);
  check("المعلّق يحفظ المعرّف نفسه (منع التكرار)", JSON.parse(storage.getItem(pendingKey(payload.attemptId))!).attemptId === payload.attemptId);
}

console.log("\n— النجاح من المحاولة الثانية —");
{
  const storage = new MemoryStorage();
  let calls = 0;
  const fetchImpl: FetchLike = async () => {
    calls += 1;
    if (calls === 1) throw new Error("timeout once");
    return { text: async () => '{"ok":true}' };
  };
  const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep });
  check("نجح في المحاولة الثانية", ok === true && calls === 2, String(calls));
  check("لا معلّق بعد النجاح", storage.keys().length === 0);
}

console.log("\n— المهلة —");
{
  let calls = 0;
  const fetchImpl: FetchLike = async () => {
    calls += 1;
    return new Promise((resolve) => setTimeout(() => resolve({ text: async () => '{"ok":true}' }), 500));
  };
  const started = Date.now();
  const ok = await sendWithRetry(payload, { fetchImpl, storage: new MemoryStorage(), sleep: noSleep, timeoutMs: 30 });
  const took = Date.now() - started;
  check("اتصال معلّق يُعدّ فشلاً", ok === false);
  check("لا ينتظر أكثر من المهلة لكل محاولة", took < 1500, `${took}ms`);
  check("أعاد المحاولة بعد المهلة", calls === 3, String(calls));
}

/* ==================== إعادة إرسال المعلّق ==================== */
console.log("\n— إعادة إرسال المعلّق عند التحميل —");
{
  const storage = new MemoryStorage();
  storage.setItem(`pending:${EXAM_ID}:old-1`, JSON.stringify({ ...payload, attemptId: "old-1" }));
  storage.setItem(`pending:${EXAM_ID}:old-2`, JSON.stringify({ ...payload, attemptId: "old-2" }));
  storage.setItem("pending:grade-7-physics-test-l1-l2-model-b-24-11-26:keep", JSON.stringify({ ...payload, attemptId: "keep" }));
  storage.setItem("grade-7-physics-test-l1-l2-model-b-24-11-26:attempt:v1", '{"keep":true}');
  const sent: string[] = [];
  const count = await retryPending({
    fetchImpl: async (_url, init) => {
      sent.push(JSON.parse(String(init.body)).attemptId);
      return { text: async () => '{"ok":true}' };
    },
    storage,
    sleep: noSleep,
  });
  check("أُعيد إرسال حمولتين", count === 2, String(count));
  check("بحمولات هذا الاختبار فقط", sent.sort().join(",") === "old-1,old-2", sent.join(","));
  check("حُذف المعلّق الناجح", storage.getItem(`pending:${EXAM_ID}:old-1`) === null);
  check("لم يُمسّ معلّق النموذج B", storage.getItem("pending:grade-7-physics-test-l1-l2-model-b-24-11-26:keep") !== null);
  check("لم تُمسّ محاولة النموذج B", storage.getItem("grade-7-physics-test-l1-l2-model-b-24-11-26:attempt:v1") !== null);
}
{
  const storage = new MemoryStorage();
  storage.setItem(pendingKey("stay"), JSON.stringify(payload));
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":false}' }), storage, sleep: noSleep });
  check("فشل إعادة الإرسال يُبقي المعلّق", count === 0 && storage.getItem(pendingKey("stay")) !== null);
}
{
  const storage = new MemoryStorage();
  storage.setItem(pendingKey("broken"), "{ليس JSON");
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":true}' }), storage, sleep: noSleep });
  check("معلّق تالف لا يكسر الإرسال", count === 0);
  check("المعلّق التالف لا يُحذف (لا ادّعاء نجاح)", storage.getItem(pendingKey("broken")) !== null);
}
{
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":true}' }), storage: null });
  check("بلا تخزين: لا شيء يُرسل ولا خطأ", count === 0);
}

console.log("\n— منع التكرار —");
{
  /* إعادة إرسال الحمولة نفسها تستعمل attemptId نفسه، فيتعرّف الخادم عليها كتكرار. */
  const storage = new MemoryStorage();
  const ids: string[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    ids.push(JSON.parse(String(init.body)).attemptId);
    return { text: async () => '{"ok":true}' };
  };
  await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep });
  storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
  await retryPending({ fetchImpl, storage, sleep: noSleep });
  check("المعرّف نفسه في كل الإرسالات", new Set(ids).size === 1 && ids[0] === payload.attemptId, ids.join(","));
  check("حمولة واحدة متبقية فقط بعد النجاح", storage.keys().length === 0);
}
{
  /* نجاح واحد وحمولة معلّقة واحدة في أسوأ الحالات: لا تكرار في التخزين. */
  const storage = new MemoryStorage();
  const fetchImpl: FetchLike = async () => {
    throw new Error("down");
  };
  await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep });
  await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep });
  check("إرسالان فاشلان لا يُنتجان إلا مفتاحاً واحداً", storage.keys().length === 1, storage.keys().join(","));
}
{
  /* استدعاء retryPending مرتين متزامنتين لا يضاعف الإرسال. */
  const storage = new MemoryStorage();
  storage.setItem(pendingKey("once"), JSON.stringify({ ...payload, attemptId: "once" }));
  let calls = 0;
  const options = {
    fetchImpl: (async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { text: async () => '{"ok":true}' };
    }) as FetchLike,
    storage,
    sleep: noSleep,
  };
  const [first, second] = await Promise.all([retryPending(options), retryPending(options)]);
  check("جولتان متزامنتان = جولة واحدة", calls === 1 && first === second, `${calls} / ${first}/${second}`);
}

console.log("\n— بلا تخزين متاح —");
{
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => '{"ok":false}' }), storage: null, sleep: noSleep });
  check("الفشل لا يرمي استثناء بلا تخزين", ok === false);
}

console.log("\n— لا تسجيل لبيانات الطالب —");
{
  const originals = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  let logged = 0;
  console.log = console.warn = console.error = console.info = () => {
    logged += 1;
  };
  try {
    await sendWithRetry(payload, { fetchImpl: async () => { throw new Error("x"); }, storage: new MemoryStorage(), sleep: noSleep });
    await retryPending({ fetchImpl: async () => { throw new Error("x"); }, storage: new MemoryStorage(), sleep: noSleep });
  } finally {
    console.log = originals.log;
    console.warn = originals.warn;
    console.error = originals.error;
    console.info = originals.info;
  }
  check("لا كتابة في console أثناء الفشل", logged === 0, String(logged));
}

console.log(`\n${failures === 0 ? "✅" : "❌"} الإرسال: ${failures === 0 ? "كل الفحوص ناجحة" : `${failures} فحصاً فاشلاً`}`);
if (failures) process.exit(1);

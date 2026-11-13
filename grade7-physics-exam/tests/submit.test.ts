/**
 * إرسال النتيجة إلى المعلّم (src/submit.ts):
 *   أ) الحمولة: أسماء الحقول وترتيبها وأنواعها كما في العقد المرجعي grade5-math-unit1،
 *      ومدخل واحد لكل جزء، ومجاميعها مطابقة لـ gradeExam.
 *   ب) المُرسِل مع fetch مبرمج: نجاح، فشل ثم نجاح، فشل المحاولات الثلاث، مهلة 30 ثانية،
 *      الحفظ في localStorage، إعادة إرسال المعلّق عند التحميل، الزر، عدم إرسال attemptId مرّتين.
 *   ج) المُرسِل مقابل خادم بديل عبر HTTP حقيقي (127.0.0.1).
 *
 * لا يتصل أي اختبار بنقطة Google الحقيقية: fetch العام مُستبدل بحارس يرفض كل اتصال،
 * والانتظار بين المحاولات (2 ثم 5 ثوانٍ) محاكى.
 */
// @ts-nocheck — exam-data.js و report.js ملفّا JavaScript أصليّان بلا أنواع
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL, EXAM_TITLE } from "../src/config";
import { GRAPHS, QUESTIONS, PART_LABELS } from "../src/exam-data.js";
import * as R from "../src/report.js";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildAttemptReport,
  buildPayload,
  gradeLabel,
  lessonTotals,
  newAttemptId,
  pendingKey,
  pendingPayload,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../src/submit";
import { MemStorage, check, equal, finish, section } from "./harness";
import { MockSheetsServer, forwardTo } from "./mock-server";
import { makeSheets } from "./sheets";

R.bindGraphs(GRAPHS);

// إن توقّف التشغيل قبل نهايته (وعد لم يُحسم مثلاً) فذلك فشل، لا نجاح صامت.
let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n✗ لم يكتمل تشغيل الاختبار");
});

const realFetch = globalThis.fetch;
let guardedFetchCalls = 0;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const [sheet] = makeSheets();
const ORDER = sheet.order.map((index) => QUESTIONS[index]);
const ANSWERS = sheet.answers;
const START = Date.UTC(2026, 2, 3, 7, 15, 20, 500);
const SUBMIT = Date.UTC(2026, 2, 3, 8, 2, 58, 500);
const METRICS = { maxMarks: ORDER.reduce((sum: number, q: any) => sum + q.marks, 0) };
const RESULTS = R.gradeExam(ORDER, ANSWERS);
const ATTEMPT = "6c1f7b2a-9d34-4f58-8a1e-2b7d9c0e4f31";
const REPORT = buildAttemptReport({
  questions: ORDER,
  answers: ANSWERS,
  results: RESULTS,
  studentName: "سارة أحمد",
  startTs: START,
  submitTs: SUBMIT,
  attemptId: ATTEMPT,
});
const payload = buildPayload({
  attemptId: ATTEMPT,
  studentName: "سارة أحمد",
  startTs: START,
  submitTs: SUBMIT,
  questions: ORDER,
  results: RESULTS,
  maxMarks: METRICS.maxMarks,
  reportText: REPORT,
});
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload; // كما يصل إلى الخادم

// ---------------------------------------------------------------------------
// أ) الحمولة
// ---------------------------------------------------------------------------
section("== أ-1) الحمولة: أسماء الحقول وترتيبها ==");
const TOP = ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "elapsedSec", "summary", "lessons", "details", "reportText"];
const SUMMARY = ["total", "max", "percentage", "gradeLabel", "fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"];
const LESSON = ["title", "awarded", "max"];
const DETAIL = ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"];
equal("الحقول العليا (12) بالأسماء والترتيب المطلوبين", Object.keys(wire), TOP);
equal("حقول summary (11)", Object.keys(wire.summary), SUMMARY);
equal("حقول كل عنصر في lessons", [...new Set(wire.lessons.map((l) => Object.keys(l).join(",")))], [LESSON.join(",")]);
equal("حقول كل عنصر في details", [...new Set(wire.details.map((d) => Object.keys(d).join(",")))], [DETAIL.join(",")]);
equal("لا حقل يضيع أو يصير null في JSON", same(wire, payload) && !/:null[,}]/.test(JSON.stringify(payload)), true);
check(
  "أنواع الحقول العليا",
  typeof wire.token === "string" &&
    typeof wire.attemptId === "string" &&
    typeof wire.examId === "string" &&
    typeof wire.examTitle === "string" &&
    typeof wire.studentName === "string" &&
    typeof wire.startAt === "string" &&
    typeof wire.submitAt === "string" &&
    typeof wire.elapsedSec === "number" &&
    Array.isArray(wire.lessons) &&
    Array.isArray(wire.details) &&
    typeof wire.reportText === "string"
);
check(
  "أنواع حقول details",
  wire.details.every(
    (d) =>
      typeof d.q === "number" &&
      typeof d.qTitle === "string" &&
      typeof d.lessons === "string" &&
      typeof d.label === "string" &&
      typeof d.status === "string" &&
      typeof d.awarded === "number" &&
      typeof d.marks === "number" &&
      typeof d.studentAnswer === "string" &&
      typeof d.correctAnswer === "string"
  )
);
check(
  "أنواع حقول lessons",
  wire.lessons.every((l) => typeof l.title === "string" && typeof l.awarded === "number" && typeof l.max === "number")
);

section("== أ-2) الحمولة: بيانات المحاولة ==");
equal("token و examId من src/config.ts", [wire.token, wire.examId], [SHEETS_TOKEN, EXAM_ID]);
equal("examId = اسم المجلد", wire.examId, "grade7-physics-exam");
equal("examTitle", wire.examTitle, EXAM_TITLE);
equal("attemptId كما أُعطي", wire.attemptId, ATTEMPT);
equal("studentName", wire.studentName, "سارة أحمد");
equal("startAt و submitAt بصيغة ISO", [wire.startAt, wire.submitAt], [new Date(START).toISOString(), new Date(SUBMIT).toISOString()]);
equal("elapsedSec ثوانٍ صحيحة كالمدة المعروضة", [wire.elapsedSec, Number.isInteger(wire.elapsedSec)], [2858, true]);
equal("reportText هو التقرير الكامل نفسه", wire.reportText === REPORT && wire.reportText.length > 5000, true);
check("التقرير يذكر معرّف المحاولة المُرسَل واسم الطالبة", wire.reportText.includes(ATTEMPT) && wire.reportText.includes("سارة أحمد"));
equal("SHEETS_URL و SHEETS_TOKEN هما نفس ما في grade5-math-unit1", [SHEETS_URL, SHEETS_TOKEN], [
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
  "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm",
]);

section("== أ-3) الحمولة: summary يطابق نتيجة التصحيح ==");
equal("total = score", wire.summary.total, RESULTS.score);
equal("max = مجموع علامات الأسئلة", [wire.summary.max, METRICS.maxMarks], [100, 100]);
equal("percentage = نسبة gradeExam", wire.summary.percentage, Math.round(RESULTS.percent * 10) / 10);
equal("gradeLabel = سلّم المرجع نفسه", wire.summary.gradeLabel, gradeLabel(RESULTS.percent));
const questionAwarded = (q: any) =>
  Math.round(RESULTS.details.filter((d: any) => d.qid === q.id).reduce((sum: number, d: any) => sum + d.awarded, 0) * 100) / 100;
equal("fullQuestions = عدد الأسئلة كاملة العلامة", wire.summary.fullQuestions, ORDER.filter((q) => questionAwarded(q) >= q.marks).length);
equal("partialQuestions = عدد الأسئلة بعلامة جزئية", wire.summary.partialQuestions, ORDER.filter((q) => questionAwarded(q) > 0 && questionAwarded(q) < q.marks).length);
equal("wrongQuestions = عدد الأسئلة بلا علامة", wire.summary.wrongQuestions, ORDER.filter((q) => questionAwarded(q) === 0).length);
equal("مجموع عدّادات الأسئلة = عدد الأسئلة", wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions, QUESTIONS.length);
equal("correctSubparts / partialSubparts / wrongSubparts / unansweredSubparts", [
  wire.summary.correctSubparts,
  wire.summary.partialSubparts,
  wire.summary.wrongSubparts,
  wire.summary.unansweredSubparts,
], [RESULTS.counts.correct, RESULTS.counts.partial, RESULTS.counts.incorrect, RESULTS.counts.unanswered]);
equal("مجموع عدّادات الأجزاء = عدد الأجزاء", Object.values({ a: wire.summary.correctSubparts, b: wire.summary.partialSubparts, c: wire.summary.wrongSubparts, d: wire.summary.unansweredSubparts }).reduce((x, y) => x + y, 0), RESULTS.details.length);

section("== أ-4) الحمولة: details — مدخل واحد لكل جزء بالترتيب ==");
const flat = RESULTS.details.map((detail: any) => detail);
equal(`عدد المداخل = عدد الأجزاء (${flat.length})`, wire.details.length, flat.length);
equal("لا تكرار: كل (سؤال، جزء) يظهر مرة واحدة", new Set(wire.details.map((d) => `${d.q}/${d.label}`)).size, flat.length);
equal("q = رقم السؤال المعروض و qTitle = عنوانه بلا ⟦⟧", wire.details.every((d, i) => d.q === flat[i].qNumber && d.qTitle === String(flat[i].qTitle).replace(/⟦|⟧/g, "")), true);
equal("label = حرف الجزء العربي داخل السؤال", wire.details.map((d) => d.label).join(""), ORDER.map((q: any) => q.parts.map((_: any, i: number) => PART_LABELS[i]).join("")).join(""));
equal("status = التسمية العربية نفسها في التقرير", wire.details.every((d, i) => d.status === (R.STATUS_AR as any)[flat[i].status]), true);
equal("awarded و marks كما صُحّحت", wire.details.every((d, i) => d.awarded === flat[i].awarded && d.marks === flat[i].part.marks), true);
equal("studentAnswer و correctAnswer بلا ⟦⟧", wire.details.every((d, i) => d.studentAnswer === String(flat[i].studentText).replace(/⟦|⟧/g, "") && d.correctAnswer === String(flat[i].correctText).replace(/⟦|⟧/g, "")), true);
equal("مجموع awarded = total ومجموع marks = 100", [Math.round(wire.details.reduce((sum, d) => sum + d.awarded, 0) * 100) / 100, wire.details.reduce((sum, d) => sum + d.marks, 0)], [wire.summary.total, 100]);
const statusCount = (status: string) => wire.details.filter((d) => d.status === status).length;
equal("عدد كل حالة في details = عدّادها في summary", [
  statusCount((R.STATUS_AR as any).correct),
  statusCount((R.STATUS_AR as any).partial),
  statusCount((R.STATUS_AR as any).incorrect),
  statusCount((R.STATUS_AR as any).unanswered),
], [wire.summary.correctSubparts, wire.summary.partialSubparts, wire.summary.wrongSubparts, wire.summary.unansweredSubparts]);

section("== أ-5) الحمولة: lessons = أسئلة الاختبار الرئيسية وعلاماتها ==");
equal("عدد المداخل = عدد الأسئلة الرئيسية", wire.lessons.length, QUESTIONS.length);
equal("العناوين بترتيب الأسئلة", wire.lessons.map((l) => l.title), QUESTIONS.map((q: any) => q.title));
equal("العلامات = علامات الأسئلة", wire.lessons.map((l) => l.max), QUESTIONS.map((q: any) => q.marks));
equal("الممنوح لكل سؤال = مجموع علامات أجزائه", wire.lessons.map((l) => l.awarded), ORDER.map((q) => questionAwarded(q)));
equal("دالة lessonTotals تعطي النتيجة نفسها", lessonTotals(ORDER, RESULTS), wire.lessons);

section("== أ-6) التقدير للمعلّم فقط ==");
equal("سلّم التقدير هو سلّم grade5-math-unit1 حرفياً", [0, 49, 50, 64, 65, 74, 75, 84, 85, 94, 95, 100].map(gradeLabel), [
  "يحتاج إلى دعم", "يحتاج إلى دعم", "ضعيف", "ضعيف", "مقبول", "مقبول", "جيد", "جيد", "جيد جداً", "جيد جداً", "ممتاز", "ممتاز",
]);
check("gradeLabel في الحمولة وحدها ولا يظهر في reportText", typeof wire.summary.gradeLabel === "string" && !wire.reportText.includes("التقدير"));

// ---------------------------------------------------------------------------
// ب) المُرسِل مع fetch مبرمج
// ---------------------------------------------------------------------------
interface Call {
  url: string;
  init: RequestInit;
  body: any;
}
function fakeFetch(reply: (n: number, call: Call) => string | Promise<string>) {
  const calls: Call[] = [];
  const fn: FetchLike = async (url, init) => {
    const call: Call = { url, init, body: JSON.parse(String(init.body)) };
    calls.push(call);
    const text = await reply(calls.length, call);
    return { text: async () => text };
  };
  return { fn, calls };
}
function env(fetchImpl: FetchLike, storage: StorageLike | null = new MemStorage()) {
  const sleeps: number[] = [];
  const opts: SendOptions = { fetchImpl, storage, sleep: async (ms) => { sleeps.push(ms) } };
  return { opts, sleeps, storage };
}
const OK = JSON.stringify({ ok: true });
const netDown = (): never => { throw new TypeError("Failed to fetch"); };
const HTML_ERROR = "<!doctype html><html><body>Service error</body></html>";

async function senderTests() {
  section("== ب-1) نجاح من المحاولة الأولى ==");
  {
    const f = fakeFetch(() => OK);
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    const init = f.calls[0]?.init ?? {};
    equal("النتيجة true", ok, true);
    equal("طلب واحد إلى SHEETS_URL", [f.calls.length, f.calls[0].url], [1, SHEETS_URL]);
    equal("method: POST", init.method, "POST");
    equal("Content-Type: text/plain;charset=utf-8 فقط", init.headers, { "Content-Type": "text/plain;charset=utf-8" });
    equal("body = JSON.stringify(payload)", init.body, JSON.stringify(payload));
    equal("redirect: follow", init.redirect, "follow");
    equal("لا mode ولا خيارات أخرى سوى signal", Object.keys(init).sort(), ["body", "headers", "method", "redirect", "signal"]);
    equal("لا انتظار ولا تخزين", [e.sleeps.length, (e.storage as MemStorage).length], [0, 0]);
  }

  section("== ب-2) فشل ثم إعادة المحاولة ==");
  {
    const f = fakeFetch((n) => (n === 1 ? netDown() : OK));
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    equal("انقطاع الشبكة ثم نجاح ← true بمحاولتين", [ok, f.calls.length], [true, 2]);
    equal("انتظار 2 ثانية قبل المحاولة الثانية", e.sleeps, [2000]);
    equal("المحاولتان بالحمولة نفسها والمعرّف نفسه", [f.calls[0].init.body === f.calls[1].init.body, f.calls[1].body.attemptId], [true, ATTEMPT]);
    equal("لا شيء في التخزين بعد النجاح", (e.storage as MemStorage).length, 0);
  }
  {
    const f = fakeFetch((n) => (n === 1 ? JSON.stringify({ ok: false, error: "busy" }) : n === 2 ? HTML_ERROR : OK));
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    equal("ok:false ثم ردّ ليس JSON ثم نجاح ← true بثلاث محاولات", [ok, f.calls.length], [true, 3]);
    equal("الانتظار 2 ثم 5 ثوانٍ، و3 محاولات كحد أقصى", [e.sleeps, RETRY_DELAYS_MS, MAX_ATTEMPTS], [[2000, 5000], [2000, 5000], 3]);
  }
  {
    const calls: number[] = [];
    const fn: FetchLike = async () => {
      calls.push(1);
      return { text: async () => { if (calls.length === 1) throw new TypeError("opaque response"); return OK } };
    };
    const e = env(fn);
    const ok = await sendWithRetry(payload, e.opts);
    equal("ردّ تعذّرت قراءته (CORS) ← فشل ثم إعادة", [ok, calls.length, e.sleeps], [true, 2, [2000]]);
  }
  for (const [name, body] of [
    ["ردّ فارغ", ""], ["{}", "{}"], ["null", "null"], ['ok:"true" نصاً', '{"ok":"true"}'], ["ok:1", '{"ok":1}'],
    ["مصفوفة", "[true]"], ["ok:false", '{"ok":false}'], ['نص "ok"', '"ok"'],
  ] as const) {
    const f = fakeFetch(() => body);
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    equal(`ليس نجاحاً: ${name}`, [ok, f.calls.length, (e.storage as MemStorage).length], [false, 3, 1]);
  }

  section("== ب-3) إعادة آمنة: المحاولة نفسها لا تُرسَل مرتين ==");
  {
    const rows = new Map<string, SubmissionPayload>();
    let lost = 1;
    const f = fakeFetch((_n, call) => {
      const duplicate = rows.has(call.body.attemptId);
      if (!duplicate) rows.set(call.body.attemptId, call.body);
      if (lost-- > 0) return netDown() as never;
      return JSON.stringify(duplicate ? { ok: true, duplicate: true } : { ok: true });
    });
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    equal("ضاع الردّ الأول ← أُعيد الإرسال بالمعرّف نفسه", [f.calls.length, f.calls.every((c) => c.body.attemptId === ATTEMPT)], [2, true]);
    equal("duplicate:true يُعدّ نجاحاً", ok, true);
    equal("صف واحد فقط في الجدول البديل", [rows.size, same(rows.get(ATTEMPT), payload)], [1, true]);
    equal("لا شيء في التخزين", (e.storage as MemStorage).length, 0);
    const again = await sendWithRetry(payload, e.opts);
    equal("إعادة إرسال المحاولة نفسها لاحقاً: نجاح بلا صف جديد", [again, rows.size, f.calls.length], [true, 1, 3]);
  }
  {
    const f = fakeFetch(() => JSON.stringify({ duplicate: true }));
    equal("{duplicate:true} وحدها نجاح", await sendWithRetry(payload, env(f.fn).opts), true);
  }
  {
    // الحمولة نفسها تُطلب مرتين بالتوازي (صفحة النتيجة + الزر + جولة التحميل)
    let release: (text: string) => void = () => {};
    const f = fakeFetch(() => new Promise<string>((resolve) => { release = resolve }));
    const opts = env(f.fn).opts;
    const both = Promise.all([sendWithRetry(payload, opts), sendWithRetry(payload, opts), sendWithRetry(payload, opts)]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    release(OK);
    const results = await both;
    equal("ثلاثة طلبات متزامنة للمحاولة نفسها ← طلب واحد فقط بنتيجة واحدة", [f.calls.length, results], [1, [true, true, true]]);
  }

  section("== ب-4) فشل المحاولات الثلاث ← الحفظ في localStorage ==");
  const store = new MemStorage();
  {
    const sizesDuringAttempts: number[] = [];
    const f = fakeFetch(() => { sizesDuringAttempts.push(store.length); return netDown() as never; });
    const e = env(f.fn, store);
    const ok = await sendWithRetry(payload, e.opts);
    equal("النتيجة false بعد 3 محاولات بالضبط", [ok, f.calls.length], [false, 3]);
    equal("الانتظار 2 ثم 5 ثوانٍ", e.sleeps, [2000, 5000]);
    equal("لم يُحفظ شيء قبل فشل المحاولات كلها", sizesDuringAttempts, [0, 0, 0]);
    equal("حُفظت تحت pending:<EXAM_ID>:<attemptId>", store.keys(), [`pending:${EXAM_ID}:${ATTEMPT}`]);
    equal("بادئة المفتاح", PENDING_PREFIX, "pending:grade7-physics-exam:");
    equal("المحفوظ هو الحمولة كاملة", JSON.parse(store.getItem(pendingKey(ATTEMPT)) ?? "null"), payload);
    equal("pendingPayload يعيد الحمولة المحفوظة", pendingPayload(ATTEMPT, { storage: store }), payload);
  }
  {
    const f = fakeFetch(() => netDown() as never);
    const brokenStorage: StorageLike = {
      get length(): number { throw new Error("SecurityError"); },
      key() { throw new Error("SecurityError"); },
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("QuotaExceededError"); },
      removeItem() { throw new Error("SecurityError"); },
    };
    let threw = false;
    let r1 = true, r2 = true, r3 = true;
    try {
      r1 = await sendWithRetry(payload, env(f.fn, null).opts);
      r2 = await sendWithRetry(payload, env(f.fn, brokenStorage).opts);
      const { opts } = env(f.fn);
      delete opts.storage;
      r3 = await sendWithRetry(payload, opts);
    } catch {
      threw = true;
    }
    equal("التخزين غير متاح أو يرمي أخطاء: لا استثناء والنتيجة false", [!threw, r1, r2, r3, f.calls.length], [true, false, false, false, 9]);
    const g = fakeFetch(() => OK);
    let okWithBroken = false;
    try { okWithBroken = await sendWithRetry(payload, env(g.fn, brokenStorage).opts); } catch { threw = true; }
    equal("والإرسال الناجح لا يتأثر بتخزين معطّل", [!threw, okWithBroken], [true, true]);
  }
  {
    const full = new MemStorage();
    full.failWrites = true;
    const f = fakeFetch(() => netDown() as never);
    let threw = false;
    let ok = true;
    try { ok = await sendWithRetry(payload, env(f.fn, full).opts); } catch { threw = true; }
    equal("تخزين ممتلئ (QuotaExceededError) لا يرمي خطأً", [!threw, ok], [true, false]);
  }

  section("== ب-5) عند تحميل الاختبار: إعادة إرسال المعلّق ==");
  {
    const second: SubmissionPayload = { ...payload, attemptId: "older-attempt-0002", studentName: "ليان محمد" };
    store.setItem(pendingKey(second.attemptId), JSON.stringify(second));
    store.setItem("pending:another-exam:abc", '{"attemptId":"abc"}');
    store.setItem("theme", "dark");
    store.setItem(pendingKey("corrupt"), "{not json");
    const before = store.keys().slice().sort();

    const down = fakeFetch(() => netDown() as never);
    const sent0 = await retryPending(env(down.fn, store).opts);
    equal("الخادم ما زال معطّلاً: لم يُرسل شيء وبقي كل شيء محفوظاً", [sent0, store.keys().slice().sort()], [0, before]);
    equal("3 محاولات لكل حمولة معلّقة، ولا محاولة للتالف أو لاختبار آخر", [
      down.calls.length,
      [...new Set(down.calls.map((c) => c.body.attemptId))].sort(),
    ], [6, [ATTEMPT, second.attemptId].sort()]);

    const picky = fakeFetch((_n, call) => JSON.stringify({ ok: call.body.attemptId === second.attemptId }));
    const sent1 = await retryPending(env(picky.fn, store).opts);
    equal("تُحذف الحمولة التي نجحت فقط", [
      sent1,
      store.getItem(pendingKey(second.attemptId)),
      store.getItem(pendingKey(ATTEMPT)) !== null,
    ], [1, null, true]);

    const up = fakeFetch(() => OK);
    const e3 = env(up.fn, store);
    const sent2 = await retryPending(e3.opts);
    equal("الخادم يعمل: أُرسلت الحمولة الباقية كما حُفظت", [sent2, up.calls.length, up.calls[0].url], [1, 1, SHEETS_URL]);
    equal("بنفس الجسم والنوع نفسه", [same(up.calls[0].body, payload), up.calls[0].init.headers], [true, { "Content-Type": "text/plain;charset=utf-8" }]);
    equal("وحُذفت بعد النجاح", store.getItem(pendingKey(ATTEMPT)), null);
    equal("مفاتيح الاختبارات الأخرى وغيرها لم تُمسّ", [store.getItem("pending:another-exam:abc"), store.getItem("theme")], ['{"attemptId":"abc"}', "dark"]);
    equal("بصمت ودون انتظار عند النجاح (لا انتظار بين المحاولات الأولى)", e3.sleeps.length, 0);

    const idle = fakeFetch(() => OK);
    const sent3 = await retryPending(env(idle.fn, store).opts);
    equal("لا شيء معلّق: لا طلبات", [sent3, idle.calls.length], [0, 0]);
  }
  {
    const s = new MemStorage();
    s.setItem(pendingKey(ATTEMPT), JSON.stringify(payload));
    const f = fakeFetch(() => OK);
    const opts = env(f.fn, s).opts;
    const [a, b] = await Promise.all([retryPending(opts), retryPending(opts)]);
    equal("استدعاءان متتاليان عند التحميل ← إرسال واحد", [f.calls.length, a, b, s.length], [1, 1, 1, 0]);
  }
  {
    const s = new MemStorage();
    s.setItem(pendingKey(ATTEMPT), JSON.stringify({ ...payload, token: "old-token" }));
    const f = fakeFetch(() => OK);
    await retryPending(env(f.fn, s).opts);
    equal("المعلّق يُرسل بالرمز الحالي من config", [f.calls.length, f.calls[0].body.token], [1, SHEETS_TOKEN]);
  }
  {
    const f = fakeFetch(() => OK);
    let threw = false;
    let a = -1, b = -1;
    try {
      a = await retryPending(env(f.fn, null).opts);
      const broken: StorageLike = {
        get length(): number { throw new Error("x"); },
        key() { throw new Error("x"); },
        getItem() { throw new Error("x"); },
        setItem() { throw new Error("x"); },
        removeItem() { throw new Error("x"); },
      };
      b = await retryPending(env(f.fn, broken).opts);
    } catch {
      threw = true;
    }
    equal("التخزين غير متاح: لا استثناء ولا طلبات", [!threw, a, b, f.calls.length], [true, 0, 0, 0]);
  }

  section("== ب-6) مهلة المحاولة 30 ثانية ==");
  equal("المهلة الافتراضية 30000ms", ATTEMPT_TIMEOUT_MS, 30000);
  {
    const signals: AbortSignal[] = [];
    const fn: FetchLike = (_url, init) => { signals.push(init.signal as AbortSignal); return new Promise(() => {}) };
    const e = env(fn);
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 });
    equal("3 محاولات انتهت مهلتها ← false", [ok, signals.length], [false, 3]);
    equal("أُلغي كل طلب معلّق عند انتهاء مهلته", signals.every((s) => s.aborted), true);
    equal("ثم حُفظت الحمولة لتُعاد لاحقاً", (e.storage as MemStorage).getItem(pendingKey(ATTEMPT)) !== null, true);
  }
  {
    const f = fakeFetch(() => new Promise<string>((resolve) => setTimeout(() => resolve(OK), 20)));
    equal("ردّ بطيء ضمن المهلة ← نجاح بمحاولة واحدة", await sendWithRetry(payload, { ...env(f.fn).opts, timeoutMs: 2000 }), true);
  }

  section("== ب-7) إغلاق الصفحة أو إخفاؤها والإرسال جارٍ ==");
  {
    const g = globalThis as any;
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
    g.window = win;
    g.document = doc;
    try {
      const s = new MemStorage();
      let reply: (text: string) => void = () => {};
      const f = fakeFetch(() => new Promise<string>((resolve) => { reply = resolve }));
      const pending = sendWithRetry(payload, env(f.fn, s).opts);
      await new Promise((resolve) => setTimeout(resolve, 5));
      equal("الإرسال جارٍ ولا شيء محفوظ", [f.calls.length, s.length], [1, 0]);
      (doc as any).visibilityState = "hidden";
      doc.dispatchEvent(new Event("visibilitychange"));
      equal("أُخفيت الصفحة ← حُفظت الحمولة فوراً بالمفتاح نفسه", s.keys(), [pendingKey(ATTEMPT)]);
      s.removeItem(pendingKey(ATTEMPT));
      win.dispatchEvent(new Event("pagehide"));
      equal("أُغلقت الصفحة (pagehide) ← حُفظت كذلك", s.keys(), [pendingKey(ATTEMPT)]);
      reply(OK);
      equal("وصل تأكيد الخادم ← حُذفت النسخة المحفوظة", [await pending, s.length], [true, 0]);
      win.dispatchEvent(new Event("pagehide"));
      equal("بعد انتهاء الإرسال لا يُحفظ شيء", s.length, 0);
    } finally {
      delete g.window;
      delete g.document;
    }
  }

  section("== ب-8) معرّفات المحاولات ==");
  {
    const ids = new Set(Array.from({ length: 200 }, () => newAttemptId()));
    equal("200 معرّف جديد فريد", ids.size, 200);
    check("المعرّف نص غير فارغ", [...ids].every((id) => typeof id === "string" && id.length >= 8));
    equal("pendingKey يبني المفتاح من المعرّف", pendingKey("abc"), "pending:grade7-physics-exam:abc");
  }

  section("== ب-9) لا اتصال حقيقي ولا تسجيل لبيانات الطالب ==");
  equal("لم يُستدعَ fetch الحقيقي إطلاقاً", guardedFetchCalls, 0);
}

// ---------------------------------------------------------------------------
// ج) خادم بديل عبر HTTP حقيقي
// ---------------------------------------------------------------------------
async function serverTests() {
  section("== ج) الإرسال عبر HTTP حقيقي إلى خادم بديل ==");
  const server = new MockSheetsServer(SHEETS_TOKEN);
  await server.start();
  try {
    {
      server.reset();
      const { fetchImpl, calls } = forwardTo(server, realFetch);
      const ok = await sendWithRetry(payload, { fetchImpl, storage: new MemStorage(), sleep: async () => {} });
      equal("نجاح: ok:true عبر 302 كما يعيد Apps Script", [ok, calls.length, server.posts.length], [true, 1, 1]);
      equal("الخادم استقبل POST بنوع text/plain", [server.posts[0].method, server.posts[0].contentType], ["POST", "text/plain;charset=utf-8"]);
      equal("والجسم هو الحمولة نفسها", server.posts[0].json, payload);
      equal("وصف واحد مخزّن بالمعرّف", [server.rows.size, server.rows.has(ATTEMPT)], [1, true]);
    }
    {
      server.reset();
      server.queue = ["reset", "apps-script"];
      const store = new MemStorage();
      const { fetchImpl } = forwardTo(server, realFetch);
      const sleeps: number[] = [];
      const ok = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async (ms) => { sleeps.push(ms); } });
      equal("انقطاع الاتصال ثم نجاح ← true بطلبين وانتظار 2s", [ok, server.posts.length, sleeps], [true, 2, [2000]]);
      equal("لا شيء معلّق بعد النجاح", store.length, 0);
    }
    {
      server.reset();
      server.behaviour = "ok-false";
      const store = new MemStorage();
      const { fetchImpl } = forwardTo(server, realFetch);
      const ok = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async () => {} });
      equal("ردّ ok:false في كل المحاولات ← فشل وحفظ المعلّق", [ok, server.posts.length, store.keys()], [false, 3, [pendingKey(ATTEMPT)]]);
      // ثم يعود الخادم للعمل: الجولة التالية عند تحميل التطبيق ترسل المحفوظ وتنجح
      server.reset();
      const up = forwardTo(server, realFetch);
      const sent = await retryPending({ fetchImpl: up.fetchImpl, storage: store, sleep: async () => {} });
      equal("إعادة الإرسال عند فتح الاختبار لاحقاً ← نجاح وحذف المحفوظ", [sent, store.length, server.rows.size], [1, 0, 1]);
    }
    {
      server.reset();
      server.queue = ["http-500", "html-page", "empty"];
      const store = new MemStorage();
      const { fetchImpl } = forwardTo(server, realFetch);
      const ok = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async () => {} });
      equal("500 ثم صفحة HTML ثم جسم فارغ ← فشل بعد 3 محاولات وحفظ", [ok, server.posts.length, store.length], [false, 3, 1]);
    }
    {
      server.reset();
      server.behaviour = "hang";
      const store = new MemStorage();
      const { fetchImpl } = forwardTo(server, realFetch);
      const started = Date.now();
      const ok = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async () => {}, timeoutMs: 60 });
      const elapsed = Date.now() - started;
      equal("خادم لا يردّ أبداً ← فشل بعد 3 محاولات انتهت مهلتها", [ok, server.posts.length, store.length], [false, 3, 1]);
      check("وكل محاولة انتهت عند مهلتها (± هامش)", elapsed >= 180 && elapsed < 5000, elapsed + " ms");
      server.behaviour = "apps-script";
    }
    {
      // المعرّف نفسه مرّتين عبر HTTP: صف واحد فقط، والثانية تُعدّ نجاحاً
      server.reset();
      const store = new MemStorage();
      const { fetchImpl } = forwardTo(server, realFetch);
      const first = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async () => {} });
      const second = await sendWithRetry(payload, { fetchImpl, storage: store, sleep: async () => {} });
      equal("إرسال المحاولة نفسها مرّتين ← نجاح بنتيجة واحدة وصف واحد", [first, second, server.rows.size, server.posts.length], [true, true, 1, 2]);
      equal("ورسالة الخادم الثانية duplicate:true (لا تُخزَّن ثانية)", JSON.parse(String(await (await realFetch(server.url, { method: "POST", body: JSON.stringify(payload) })).text())), { ok: true, duplicate: true });
    }
  } finally {
    await server.stop();
  }
}

senderTests()
  .then(serverTests)
  .catch((error) => {
    console.log("  ✗ استثناء غير متوقع: " + String(error && (error as Error).stack ? (error as Error).stack : error));
    process.exitCode = 1;
  })
  .finally(() => {
    finished = true;
    finish("submit");
  });

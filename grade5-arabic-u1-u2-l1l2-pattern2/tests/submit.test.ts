/**
 * اختبارات عقد الإرسال إلى Google Sheets (خادم وهمي فقط — لا اتصال حقيقي):
 * أسماء الحقول الـ 12، حقول summary الـ 11، الدروس الخمسة (100 علامة)،
 * تفاصيل الفروع الـ 45، نوع المحتوى text/plain، المهلة 30 ثانية، 3 محاولات،
 * التأخيران 2 ثم 5 ثوانٍ، التخزين المحلي، إعادة إرسال المعلّق، ومنع التكرار،
 * وعدم استخدام مفتاح/سجلات النموذج الأول.
 */
import fs from "node:fs";
import path from "node:path";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { TOTAL_BRANCHES, TOTAL_MARKS, EXAM_QUESTIONS, type Branch } from "../src/data/exam";
import { buildTextReport, evaluateExam, type AnswerMap } from "../src/lib/grading";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  hasPending,
  newAttemptId,
  pendingKey,
  resendPending,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../src/lib/submit";

let failures = 0;
let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n❌ لم يكتمل تشغيل اختبار الإرسال");
});

function check(name: string, cond: boolean, extra = "") {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  } else {
    console.log("  ✓ " + name + (extra ? " → " + extra : ""));
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const rootDir = process.cwd();

let realFetchCalls = 0;
(globalThis as unknown as { fetch: unknown }).fetch = () => {
  realFetchCalls++;
  return Promise.reject(new Error("real fetch is disabled in tests"));
};

/* ------------------------------------------------------------------ */
/* إجابات اختبارية                                                     */
/* ------------------------------------------------------------------ */

function correctValue(branch: Branch): AnswerMap[string] {
  switch (branch.kind) {
    case "single_choice":
      return branch.correctChoiceId;
    case "true_false":
      return String(branch.correct);
    case "fill_blank":
      return branch.acceptedAnswers[0];
    case "multi_select":
      return [...branch.correctChoiceIds];
    case "classification":
      return Object.fromEntries(branch.items.map((item) => [item.id, item.categoryId]));
    case "matching":
      return Object.fromEntries(branch.pairs.map((pair) => [pair.id, pair.id]));
    case "ordering":
      return [...branch.correctOrderIds];
  }
}

function perfectAnswers(): AnswerMap {
  const answers: AnswerMap = {};
  for (const question of EXAM_QUESTIONS) {
    for (const branch of question.branches) answers[branch.id] = correctValue(branch);
  }
  return answers;
}

const mixedAnswers = perfectAnswers();
// فرع جزئي: تصنيف نصف صحيح (علامة جزئية)
const classification = EXAM_QUESTIONS.flatMap((q) => q.branches).find(
  (branch) => branch.kind === "classification",
) as Extract<Branch, { kind: "classification" }>;
mixedAnswers[classification.id] = Object.fromEntries(
  classification.items.map((item, index) => [
    item.id,
    index === 0 ? item.categoryId : "غير-ذلك",
  ]),
);
// فرع خاطئ: اختيار من متعدد بإجابة غير صحيحة
const singleChoice = EXAM_QUESTIONS.flatMap((q) => q.branches).find(
  (branch) => branch.kind === "single_choice",
) as Extract<Branch, { kind: "single_choice" }>;
mixedAnswers[singleChoice.id] = singleChoice.choices.find(
  (choice) => choice.id !== singleChoice.correctChoiceId,
)!.id;
// فرع غير مُجاب
const unanswered = EXAM_QUESTIONS[1].branches[0];
delete mixedAnswers[unanswered.id];

const startTime = Date.UTC(2026, 10, 14, 9, 0, 0);
const submitTime = startTime + 1_234_567;
const grades = evaluateExam(mixedAnswers);
const reportText = buildTextReport("سلمى خالد", grades, new Date(submitTime), 1234);
const ATTEMPT = "5a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
const payload = buildPayload({
  attemptId: ATTEMPT,
  meta: { studentName: "سلمى خالد", startTime, submitTime },
  answers: mixedAnswers,
  result: grades,
  reportText,
});
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload;

console.log("\n== 1) الإعدادات المعتمدة واستقلال المعرّف ==");
const referenceConfig = fs.readFileSync(
  path.join(rootDir, "..", "grade5-math-unit1", "src", "config.ts"),
  "utf8",
);
const refUrl = /SHEETS_URL\s*=\s*\n?\s*"([^"]+)"/.exec(referenceConfig)?.[1];
const refToken = /SHEETS_TOKEN\s*=\s*"([^"]+)"/.exec(referenceConfig)?.[1];
const previousConfig = fs.readFileSync(
  path.join(rootDir, "..", "grade5-arabic-u1-u2-l1l2", "src", "config.ts"),
  "utf8",
);
check("SHEETS_URL مطابق حرفياً للاختبار المرجعي grade5-math-unit1", SHEETS_URL === refUrl, SHEETS_URL.slice(0, 40) + "…");
check("SHEETS_TOKEN مطابق حرفياً للاختبار المرجعي grade5-math-unit1", SHEETS_TOKEN === refToken);
check(
  "عنوان الاختبار المعتمد هو نفسه المطلوب في المنصة",
  EXAM_TITLE ===
    "اختبار اللغة العربية — الصف الخامس — الوحدة الأولى والدرسان الأول والثاني من الوحدة الثانية (النموذج الثاني)",
);
check("EXAM_ID جديد ومطابق للمجلد النهائي", EXAM_ID === "grade5-arabic-u1-u2-l1l2-pattern2", EXAM_ID);
check(
  "EXAM_ID يختلف عن النموذج الأول وعن المرجع (لا تشارك سجلات)",
  EXAM_ID !== "grade5-arabic-u1-u2-l1l2" &&
    EXAM_ID !== "grade5-math-unit1" &&
    !previousConfig.includes(`EXAM_ID = "${EXAM_ID}"`),
);
check("PENDING_PREFIX = pending:<EXAM_ID>:", PENDING_PREFIX === `pending:${EXAM_ID}:`);
check(
  "بادئة المعلّق لا تلمس مفاتيح النموذج الأول",
  !PENDING_PREFIX.includes("pending:grade5-arabic-u1-u2-l1l2:") &&
    !PENDING_PREFIX.includes("pending:grade5-math-unit1:"),
  PENDING_PREFIX,
);
check("RETRY_DELAYS_MS = [2000, 5000]", same(RETRY_DELAYS_MS, [2000, 5000]));
check("MAX_ATTEMPTS = 3", MAX_ATTEMPTS === 3);
check("ATTEMPT_TIMEOUT_MS = 30000", ATTEMPT_TIMEOUT_MS === 30000);
check(
  "نص «جزئياً» بالتاء كما في الحمولة المعتمدة",
  STATUS_AR.partial === "إجابة صحيحة جزئياً",
  STATUS_AR.partial,
);

console.log("\n== 2) عقد الحمولة (Payload Contract) ==");
const TOP = [
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
  "details",
  "reportText",
];
const SUMMARY_KEYS = [
  "total",
  "max",
  "percentage",
  "gradeLabel",
  "fullQuestions",
  "partialQuestions",
  "wrongQuestions",
  "correctSubparts",
  "partialSubparts",
  "wrongSubparts",
  "unansweredSubparts",
];
const LESSON_KEYS = ["title", "awarded", "max"];
const DETAIL_KEYS = [
  "q",
  "qTitle",
  "lessons",
  "label",
  "status",
  "awarded",
  "marks",
  "studentAnswer",
  "correctAnswer",
];

check("الحقول العليا الـ 12 بالترتيب", same(Object.keys(wire), TOP), Object.keys(wire).join(","));
check("حقول summary الـ 11", same(Object.keys(wire.summary), SUMMARY_KEYS));
check("حقول كل درس", wire.lessons.every((lesson) => same(Object.keys(lesson), LESSON_KEYS)));
check("حقول كل تفصيل فرع", wire.details.every((detail) => same(Object.keys(detail), DETAIL_KEYS)));
check("لا قيم null/undefined/NaN", same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)));
check(
  "examId و examTitle و token في الحمولة",
  wire.examId === EXAM_ID && wire.examTitle === EXAM_TITLE && wire.token === SHEETS_TOKEN,
);
check("elapsedSec عدد صحيح بالثواني", wire.elapsedSec === 1234, String(wire.elapsedSec));
check("startAt/submitAt بصيغة ISO مطابقة للأوقات المعطاة", wire.startAt === new Date(startTime).toISOString() && wire.submitAt === new Date(submitTime).toISOString());
check("summary.max = 100", wire.summary.max === TOTAL_MARKS && wire.summary.max === 100);
check(
  "مجموع عدّادات الأسئلة = 15 وعدّادات الفروع = 45",
  wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === EXAM_QUESTIONS.length &&
    wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === TOTAL_BRANCHES,
  JSON.stringify(wire.summary),
);
// توزيع العلامات الحقيقي من خط الأساس: 19 (السمكة الذهبية) و20 (بالرأي والرأي الآخر)
// و20 (لغتي) و20 (مخترع من بلادي) و21 (الذكاء الاصطناعي) = 100.
const EXPECTED_LESSON_MAX = [20, 19, 21, 20, 20];
check(
  "الدروس الخمسة مجموع علاماتها العظمى = 100 وتوزيعها مطابق لخط الأساس",
  wire.lessons.length === 5 &&
    wire.lessons.reduce((sum, lesson) => sum + lesson.max, 0) === 100 &&
    same(wire.lessons.map((lesson) => lesson.max), EXPECTED_LESSON_MAX),
  JSON.stringify(wire.lessons.map((lesson) => [lesson.title, lesson.max])),
);
check(
  "مجموع علامات الدروس الممنوحة = مجموع العلامة النهائية",
  Math.round(wire.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0) * 100) / 100 === wire.summary.total,
);
check(
  "details تحتوي 45 مدخلاً وتغطي الحالات الأربع",
  wire.details.length === 45 &&
    same(
      [...new Set(wire.details.map((detail) => detail.status))].sort(),
      [...Object.values(STATUS_AR)].sort(),
    ),
  wire.details.length + " · " + [...new Set(wire.details.map((detail) => detail.status))].join("|"),
);
check(
  "تسميات الفروع أ ب ج لكل سؤال",
  wire.details.every((detail, index) => detail.label === ["أ", "ب", "ج"][index % 3]),
);
check("رقم السؤال في التفاصيل 1..15", wire.details.every((detail, index) => detail.q === Math.floor(index / 3) + 1));
check(
  "درجات التفاصيل تطابق مجموع الحمولة",
  Math.round(wire.details.reduce((sum, detail) => sum + detail.awarded, 0) * 100) / 100 === wire.summary.total &&
    wire.details.reduce((sum, detail) => sum + detail.marks, 0) === 100,
);
check("gradeLabel متوافق مع سلّم التقدير المعتمد", wire.summary.gradeLabel === gradeLabel(wire.summary.percentage));
check("reportText مضمّن بالكامل", wire.reportText === reportText && reportText.length > 2000, String(reportText.length));
check("reportText يذكر النموذج الثاني", wire.reportText.includes("(النموذج الثاني)"));

/* ------------------------------------------------------------------ */
/* أدوات إرسال اختبارية                                               */
/* ------------------------------------------------------------------ */

interface Call {
  url: string;
  init: RequestInit;
  body: SubmissionPayload;
}

function fakeFetch(handler: (n: number, call: Call) => string | Promise<string>) {
  const calls: Call[] = [];
  const fn: FetchLike = async (url, init) => {
    const call: Call = { url, init, body: JSON.parse(String(init.body)) };
    calls.push(call);
    const text = await handler(calls.length, call);
    return { text: async () => text };
  };
  return { fn, calls };
}

class MemStorage implements StorageLike {
  map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
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
    return [...this.map.keys()];
  }
}

function env(fetchImpl: FetchLike, storage: StorageLike | null = new MemStorage()) {
  const sleeps: number[] = [];
  const opts: SendOptions = {
    fetchImpl,
    storage,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  };
  return { opts, sleeps, storage };
}

const OK = JSON.stringify({ ok: true });
const netDown = (): never => {
  throw new TypeError("Failed to fetch");
};

async function runSenderTests() {
  console.log("\n== 3) الإرسال والمهلة وإعادة المحاولة والحفظ المحلي ==");
  {
    const f = fakeFetch(() => OK);
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    check("نجاح من المحاولة الأولى بلا انتظار", ok && f.calls.length === 1 && e.sleeps.length === 0);
    check(
      "POST إلى SHEETS_URL مع text/plain و redirect:follow و signal",
      f.calls[0].url === SHEETS_URL &&
        f.calls[0].init.method === "POST" &&
        same(f.calls[0].init.headers, { "Content-Type": "text/plain;charset=utf-8" }) &&
        f.calls[0].init.redirect === "follow" &&
        f.calls[0].init.signal instanceof AbortSignal,
    );
    check(
      "الحمولة المرسلة مطابقة للحمولة المبنية (بلا تعديل)",
      same(f.calls[0].body, wire),
    );
  }

  {
    const f = fakeFetch((n) => (n < 3 ? netDown() : OK));
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    check(
      "فشل مرتين ثم نجاح في الثالثة بتأخير 2000 ثم 5000",
      ok && f.calls.length === 3 && same(e.sleeps, [2000, 5000]) && e.storage!.length === 0,
    );
    check(
      "المحاولات الثلاث بالحمولة نفسها والمعرّف نفسه",
      new Set(f.calls.map((call) => call.body.attemptId)).size === 1 &&
        same(f.calls[1].body, f.calls[0].body) &&
        same(f.calls[2].body, f.calls[0].body),
    );
  }

  {
    const f = fakeFetch(netDown);
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    check("فشل كل المحاولات يعيد false بلا رمي استثناء", ok === false && f.calls.length === MAX_ATTEMPTS);
  }

  {
    const rows = new Map<string, SubmissionPayload>();
    let firstLost = true;
    const f = fakeFetch((_n, call) => {
      const duplicate = rows.has(call.body.attemptId);
      if (!duplicate) rows.set(call.body.attemptId, call.body);
      if (firstLost) {
        firstLost = false;
        return netDown();
      }
      return JSON.stringify(duplicate ? { ok: true, duplicate: true } : { ok: true });
    });
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    check(
      "إعادة الإرسال بالمعرّف نفسه ومنع التكرار عبر duplicate:true",
      ok && f.calls.length === 2 && rows.size === 1 && e.storage!.length === 0,
    );
  }

  {
    const store = new MemStorage();
    const f = fakeFetch(netDown);
    const e = env(f.fn, store);
    const ok = await sendWithRetry(payload, e.opts);
    check(
      "فشل كل المحاولات يحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId>",
      !ok && f.calls.length === 3 && hasPending(ATTEMPT, { storage: store }) && same(store.keys(), [pendingKey(ATTEMPT)]),
      store.keys().join(","),
    );

    store.setItem("pending:grade5-arabic-u1-u2-l1l2:old-attempt", '{"attemptId":"old-attempt"}');
    store.setItem("pending:grade5-math-unit1:math-attempt", '{"attemptId":"math-attempt"}');
    store.setItem(pendingKey("bad"), "{broken");
    const up = fakeFetch(() => OK);
    const sent = await retryPending({ fetchImpl: up.fn, storage: store, sleep: async () => {} });
    check(
      "retryPending يعيد إرسال المعلّق لهذا الاختبار ويحذفه",
      sent === 1 && !hasPending(ATTEMPT, { storage: store }),
      String(sent),
    );
    check(
      "مفاتيح النموذج الأول والاختبار المرجعي لم تُلمس ولم تُرسل",
      store.getItem("pending:grade5-arabic-u1-u2-l1l2:old-attempt") !== null &&
        store.getItem("pending:grade5-math-unit1:math-attempt") !== null &&
        up.calls.length === 1,
    );
  }

  {
    // الزر المستقل: إعادة إرسال المحاولة المعلّقة نفسها بالمعرّف نفسه
    const store = new MemStorage();
    const down = env(fakeFetch(netDown).fn, store);
    await sendWithRetry(payload, down.opts);
    const up = fakeFetch(() => OK);
    const ok = await resendPending(ATTEMPT, { fetchImpl: up.fn, storage: store, sleep: async () => {} });
    check(
      "resendPending يرسل المحاولة المعلّقة بالـ attemptId نفسه ثم يحذفها",
      ok && up.calls.length === 1 && up.calls[0].body.attemptId === ATTEMPT && !hasPending(ATTEMPT, { storage: store }),
    );
    const none = await resendPending("لا-يوجد", { fetchImpl: up.fn, storage: store, sleep: async () => {} });
    check("resendPending على محاولة غير معلّقة لا يرسل شيئاً", none === false && up.calls.length === 1);
  }

  {
    const signals: AbortSignal[] = [];
    const fn: FetchLike = (_url, init) => {
      signals.push(init.signal as AbortSignal);
      return new Promise(() => {});
    };
    const e = env(fn);
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 });
    check(
      "انتهاء المهلة يلغي الطلب المعلّق ويعيد المحاولة 3 مرات ثم يحفظ",
      !ok && signals.length === 3 && signals.every((signal) => signal.aborted) && hasPending(ATTEMPT, { storage: e.storage }),
    );
  }

  {
    const s = new MemStorage();
    const f = fakeFetch(() => new Promise<string>((resolve) => setTimeout(() => resolve(OK), 20)));
    const opts = env(f.fn, s).opts;
    const [a, b] = await Promise.all([sendWithRetry(payload, opts), sendWithRetry(payload, opts)]);
    check("حارس التكرار المتزامن: طلب واحد فقط للمحاولة نفسها", a && b && f.calls.length === 1);
  }

  {
    const s = new MemStorage();
    const f = fakeFetch(() => OK);
    const e = env(f.fn, s);
    await sendWithRetry(payload, e.opts);
    const again = fakeFetch(() => OK);
    const second = await resendPending(ATTEMPT, { fetchImpl: again.fn, storage: s, sleep: async () => {} });
    check("بعد نجاح الإرسال لا يبقى شيء معلّق لإعادة إرساله", second === false && again.calls.length === 0);
  }

  {
    const ids = new Set(Array.from({ length: 200 }, () => newAttemptId()));
    check("newAttemptId يولّد 200 معرّفاً فريداً", ids.size === 200);
  }

  check("لم يُستدعَ fetch الحقيقي إطلاقاً", realFetchCalls === 0, String(realFetchCalls));
}

runSenderTests()
  .catch((error) => {
    failures++;
    console.log("  ✗ استثناء غير متوقع: " + String(error));
  })
  .finally(() => {
    finished = true;
    console.log(failures ? `\n❌ ${failures} فشل` : "\n✅ كل فحوص عقد الإرسال ناجحة");
    process.exit(failures ? 1 : 0);
  });

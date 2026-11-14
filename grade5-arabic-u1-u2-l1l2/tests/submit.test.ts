/**
 * اختبارات عقد الإرسال إلى Google Sheets (Mock Server فقط — لا اتصال حقيقي):
 * بنية الحمولة وأسماء الحقول الـ 12، حقول summary الـ 11، الدروس الـ 5 (100 علامة)،
 * تفاصيل الفروع الـ 45، نوع المحتوى text/plain، المهلة 30 ثانية، 3 محاولات،
 * التأخيران 2 ثم 5 ثوانٍ، التخزين المحلي، إعادة إرسال المعلّق، ومنع التكرار.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import {
  SHEETS_URL as REF_SHEETS_URL,
  SHEETS_TOKEN as REF_SHEETS_TOKEN,
  EXAM_ID as REF_EXAM_ID,
} from "../../grade5-math-unit1/src/config";
import { QUESTIONS, totalBranches, totalPoints } from "../src/data/questions";
import { computeGrades, type AnswersMap } from "../src/lib/grading";
import { buildReportText } from "../src/lib/report";
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

let realFetchCalls = 0;
(globalThis as unknown as { fetch: unknown }).fetch = () => {
  realFetchCalls++;
  return Promise.reject(new Error("real fetch is disabled in tests"));
};

function perfectAnswers(): AnswersMap {
  const ans: AnswersMap = {};
  for (const q of QUESTIONS) {
    for (const b of q.branches) {
      if (b.type === "single_choice" || b.type === "true_false") {
        ans[b.id] = b.correctChoiceId!;
      } else if (b.type === "multi_choice") {
        ans[b.id] = [...b.correctChoiceIds!];
      } else if (b.type === "fill_blank") {
        ans[b.id] = b.acceptedAnswers![0];
      } else if (b.type === "classify") {
        ans[b.id] = Object.fromEntries(
          b.items!.map((it) => [it.id, it.correctCategoryId]),
        );
      } else if (b.type === "match") {
        ans[b.id] = Object.fromEntries(b.pairs!.map((p) => [p.id, p.right]));
      }
    }
  }
  return ans;
}

const mixedAnswers = perfectAnswers();
mixedAnswers["q6b"] = ["a"]; // partial
mixedAnswers["q1a"] = "a"; // wrong
delete mixedAnswers["q2a"]; // unanswered

const startTime = Date.UTC(2026, 10, 14, 9, 0, 0);
const submitTime = startTime + 1_234_567;
const grades = computeGrades(mixedAnswers);
const reportText = buildReportText(
  "سلمى خالد",
  "14/11/2026",
  "00:20:34",
  grades,
);
const ATTEMPT = "5a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
const payload = buildPayload({
  attemptId: ATTEMPT,
  meta: { studentName: "سلمى خالد", startTime, submitTime },
  answers: mixedAnswers,
  grades,
  reportText,
});
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload;

console.log("\n== 1) مطابقة الإعدادات للمرجع ==");
check("SHEETS_URL مطابق للمرجع", SHEETS_URL === REF_SHEETS_URL);
check("SHEETS_TOKEN مطابق للمرجع", SHEETS_TOKEN === REF_SHEETS_TOKEN);
check(
  "EXAM_ID مطابق لاسم المجلد",
  EXAM_ID === "grade5-arabic-u1-u2-l1l2" && REF_EXAM_ID === "grade5-math-unit1",
  EXAM_ID,
);
check("PENDING_PREFIX = pending:<EXAM_ID>:", PENDING_PREFIX === `pending:${EXAM_ID}:`);
check("RETRY_DELAYS_MS = [2000, 5000]", same(RETRY_DELAYS_MS, [2000, 5000]));
check("MAX_ATTEMPTS = 3", MAX_ATTEMPTS === 3);
check("ATTEMPT_TIMEOUT_MS = 30000", ATTEMPT_TIMEOUT_MS === 30000);

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
const SUMMARY = [
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
const LESSON = ["title", "awarded", "max"];
const DETAIL = [
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

check("الحقول العليا الـ 12 بالترتيب", same(Object.keys(wire), TOP));
check("حقول summary الـ 11", same(Object.keys(wire.summary), SUMMARY));
check("حقول كل lesson", wire.lessons.every((l) => same(Object.keys(l), LESSON)));
check("حقول كل detail", wire.details.every((d) => same(Object.keys(d), DETAIL)));
check("لا قيم null/undefined/NaN", same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)));
check("examTitle و examId و token", wire.examTitle === EXAM_TITLE && wire.examId === EXAM_ID && wire.token === SHEETS_TOKEN);
check("elapsedSec عدد صحيح بالثواني", wire.elapsedSec === 1234);
check("summary.max = 100", wire.summary.max === totalPoints() && wire.summary.max === 100);
check(
  "مجموع عدّادات الأسئلة = 15 وعدّادات الفروع = 45",
  wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === QUESTIONS.length &&
    wire.summary.correctSubparts +
      wire.summary.partialSubparts +
      wire.summary.wrongSubparts +
      wire.summary.unansweredSubparts ===
      totalBranches(),
);
check(
  "الدروس الـ 5 مجموع علاماتها العظمى = 100",
  wire.lessons.length === 5 &&
    wire.lessons.reduce((s, l) => s + l.max, 0) === 100 &&
    Math.round(wire.lessons.reduce((s, l) => s + l.awarded, 0) * 100) / 100 === wire.summary.total,
);
check(
  "details تحتوي 45 مدخلاً وتغطي الحالات الأربع",
  wire.details.length === 45 &&
    same([...new Set(wire.details.map((d) => d.status))].sort(), Object.values(STATUS_AR).sort()),
);
check("gradeLabel متوافق مع سلّم التقدير", wire.summary.gradeLabel === gradeLabel(wire.summary.percentage));
check("reportText مضمّن بالكامل", wire.reportText === reportText && reportText.length > 2000);

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
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
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
    check("نجاح من المحاولة الأولى", ok && f.calls.length === 1 && e.sleeps.length === 0);
    check(
      "POST إلى SHEETS_URL مع text/plain و redirect:follow و signal",
      f.calls[0].url === SHEETS_URL &&
        f.calls[0].init.method === "POST" &&
        same(f.calls[0].init.headers, { "Content-Type": "text/plain;charset=utf-8" }) &&
        f.calls[0].init.redirect === "follow" &&
        f.calls[0].init.signal instanceof AbortSignal,
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
  }

  {
    const rows = new Map<string, SubmissionPayload>();
    let firstLost = true;
    const f = fakeFetch((_n, call) => {
      const dup = rows.has(call.body.attemptId);
      if (!dup) rows.set(call.body.attemptId, call.body);
      if (firstLost) {
        firstLost = false;
        return netDown();
      }
      return JSON.stringify(dup ? { ok: true, duplicate: true } : { ok: true });
    });
    const e = env(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    check(
      "إعادة الإرسال بالمعرّف نفسه ومنع التكرار via duplicate:true",
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
      !ok &&
        f.calls.length === 3 &&
        hasPending(ATTEMPT, { storage: store }) &&
        same(store.keys(), [pendingKey(ATTEMPT)]),
    );

    store.setItem("pending:other-exam:1", '{"attemptId":"1"}');
    store.setItem(pendingKey("bad"), "{broken");
    const up = fakeFetch(() => OK);
    const sent = await retryPending({ fetchImpl: up.fn, storage: store, sleep: async () => {} });
    check(
      "retryPending يعيد إرسال المعلّق ويحذفه دون المساس بمفاتيح الاختبارات الأخرى",
      sent === 1 &&
        !hasPending(ATTEMPT, { storage: store }) &&
        store.getItem("pending:other-exam:1") !== null,
    );
  }

  {
    const signals: AbortSignal[] = [];
    const fn: FetchLike = (_u, init) => {
      signals.push(init.signal as AbortSignal);
      return new Promise(() => {});
    };
    const e = env(fn);
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 });
    check(
      "انتهاء المهلة يلغي الطلب المعلّق ويعيد المحاولة ثم يحفظ",
      !ok && signals.length === 3 && signals.every((s) => s.aborted) && hasPending(ATTEMPT, { storage: e.storage }),
    );
  }

  {
    // نداءان متزامنان لـ sendWithRetry بالمعرّف نفسه يجب ألا يرسلا طلبين متوازيين
    const s = new MemStorage();
    const f = fakeFetch(() => new Promise<string>((r) => setTimeout(() => r(OK), 20)));
    const opts = env(f.fn, s).opts;
    const [a, b] = await Promise.all([sendWithRetry(payload, opts), sendWithRetry(payload, opts)]);
    check("حارس التكرار المتزامن في sendWithRetry", a && b && f.calls.length === 1);
  }

  {
    const ids = new Set(Array.from({ length: 100 }, () => newAttemptId()));
    check("newAttemptId يولّد معرّفات فريدة", ids.size === 100);
  }

  check("لم يُستدعَ fetch الحقيقي إطلاقاً", realFetchCalls === 0, String(realFetchCalls));
}

runSenderTests()
  .catch((err) => {
    failures++;
    console.log("  ✗ استثناء غير متوقع: " + String(err));
  })
  .finally(() => {
    finished = true;
    console.log(failures ? `\n❌ ${failures} فشل` : "\n✅ كل فحوص عقد الإرسال ناجحة");
    process.exit(failures ? 1 : 0);
  });

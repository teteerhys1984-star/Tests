import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  SENT_PREFIX,
  buildPayload,
  hasPending,
  isSent,
  newAttemptId,
  pendingKey,
  retryPending,
  sendWithRetry,
  type StorageLike,
} from "../src/utils/submit";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { EXAM_DATA } from "../src/data/questions/examQuestions";

let failures = 0;
process.exitCode = 1;
const check = (name: string, cond: boolean, detail = "") => {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (detail ? " → " + detail : ""));
  } else {
    console.log("  ✓ " + name);
  }
};

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const fastSleep = async () => {};

const answers: Record<string, string> = {};
for (const q of EXAM_DATA.questions) {
  for (const sp of q.subparts) {
    answers[sp.id] = sp.correctAnswer;
  }
}
answers.q6b = "تُكتب همزة قطع لأنها تُنطق في أول الكلام وفي وصله.";
answers.q12b = "همزة قطع لأنها تُنطق في أول الكلام وفي وصله.";
answers.q15b = "رسمتْ سارةُ لوحةً جميلةً.";

async function main() {
  // 1) عقد الإرسال والثوابت المعتمدة في المنصة
  check(
    "ثوابت الاتصال مطابقة لعقد المنصة المعتمد (grade5-math-unit1 والنموذجين 1 و 2)",
    SHEETS_URL === "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec" &&
      SHEETS_TOKEN === "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm" &&
      MAX_ATTEMPTS === 3 &&
      JSON.stringify(RETRY_DELAYS_MS) === JSON.stringify([2000, 5000]) &&
      ATTEMPT_TIMEOUT_MS === 30000,
  );

  check("توليد attemptId فريد في كل مرة", newAttemptId() !== newAttemptId() && newAttemptId().length >= 12);

  const payload = buildPayload({
    attemptId: "attempt-p3-test-1",
    studentName: "سارة محمد أحمد",
    startTimestamp: 1700000000000,
    submittedAt: 1700000125000,
    durationMs: 125000,
    answers,
  });

  check(
    "بنية الحمولة مطابقة حرفيًا لعقد المنصة (12 حقلًا رئيسيًا)",
    JSON.stringify(Object.keys(payload)) ===
      JSON.stringify([
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
      ]),
  );

  check(
    "قيم الهوية والتوقيت والملخص والتفاصيل والدروس صحيحة",
    payload.examId === EXAM_ID &&
      payload.examTitle === EXAM_TITLE &&
      payload.attemptId === "attempt-p3-test-1" &&
      payload.elapsedSec === 125 &&
      payload.summary.total === 100 &&
      payload.summary.max === 100 &&
      payload.summary.percentage === 100 &&
      payload.summary.correctSubparts === 70 &&
      payload.lessons.length === 5 &&
      payload.details.length === 70 &&
      payload.reportText.includes("سارة محمد أحمد"),
  );

  // 2) نجاح الإرسال عبر Mock Fetch والتحقق من الطلب
  {
    const store = new MemoryStorage();
    const calls: { url: string; init: RequestInit }[] = [];
    const mockOk = async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return { text: async () => JSON.stringify({ ok: true }) };
    };
    const ok = await sendWithRetry(payload, { storage: store, fetchImpl: mockOk, sleep: fastSleep });
    check("نجاح الإرسال من المحاولة الأولى وحذف pending وتسجيل sent", ok === true && calls.length === 1 && !hasPending(payload.attemptId, { storage: store }) && isSent(payload.attemptId, { storage: store }));
    check(
      "الطلب مرسل بطريقة POST ونوع text/plain;charset=utf-8 إلى SHEETS_URL",
      calls[0].url === SHEETS_URL &&
        calls[0].init.method === "POST" &&
        (calls[0].init.headers as Record<string, string>)["Content-Type"] === "text/plain;charset=utf-8" &&
        calls[0].init.redirect === "follow",
    );

    // منع الإرسال المكرر بعد النجاح عبر علامة sent:<EXAM_ID>:<attemptId>
    let extraCalls = 0;
    const okDup = await sendWithRetry(payload, {
      storage: store,
      fetchImpl: async () => {
        extraCalls++;
        throw new Error("should not be called");
      },
      sleep: fastSleep,
    });
    check("منع الإرسال المكرر لمحاولة أُرسلت سابقًا (لا طلب شبكة جديد)", okDup === true && extraCalls === 0);
  }

  // 3) قبول رد duplicate: true من الخادم
  {
    const store = new MemoryStorage();
    const pDup = { ...payload, attemptId: "attempt-dup-reply" };
    const ok = await sendWithRetry(pDup, {
      storage: store,
      fetchImpl: async () => ({ text: async () => JSON.stringify({ duplicate: true }) }),
      sleep: fastSleep,
    });
    check("قبول رد الخادم duplicate:true باعتباره نجاحًا وحذف pending", ok === true && !hasPending(pDup.attemptId, { storage: store }) && isSent(pDup.attemptId, { storage: store }));
  }

  // 4) منع الإرسال المتزامن (in-flight deduplication)
  {
    const store = new MemoryStorage();
    const pConc = { ...payload, attemptId: "attempt-concurrent" };
    let netCalls = 0;
    let release!: () => void;
    const gate = new Promise<void>((res) => {
      release = res;
    });
    const slowFetch = async () => {
      netCalls++;
      await gate;
      return { text: async () => JSON.stringify({ ok: true }) };
    };
    const p1 = sendWithRetry(pConc, { storage: store, fetchImpl: slowFetch, sleep: fastSleep });
    const p2 = sendWithRetry(pConc, { storage: store, fetchImpl: slowFetch, sleep: fastSleep });
    check("استدعاءان متزامنان لنفس attemptId يشتركان في نفس الوعد ولا يرسلان مرتين", p1 === p2);
    release();
    const [r1, r2] = await Promise.all([p1, p2]);
    check("اكتمال الإرسال المتزامن بطلب شبكة واحد فقط", r1 === true && r2 === true && netCalls === 1);
  }

  // 5) إعادة المحاولة عند الفشل المؤقت والنجاح في المحاولة الثالثة
  {
    const store = new MemoryStorage();
    const pRetry = { ...payload, attemptId: "attempt-flaky" };
    const delays: number[] = [];
    let attemptNum = 0;
    const ok = await sendWithRetry(pRetry, {
      storage: store,
      sleep: async (ms) => {
        delays.push(ms);
      },
      fetchImpl: async () => {
        attemptNum++;
        if (attemptNum < 3) throw new Error("network down");
        return { text: async () => JSON.stringify({ ok: true }) };
      },
    });
    check(
      "إعادة المحاولة عند الفشل تنجح في المحاولة الثالثة مع الفواصل الزمنية 2000ms و 5000ms",
      ok === true && attemptNum === 3 && JSON.stringify(delays) === JSON.stringify([2000, 5000]) && !hasPending(pRetry.attemptId, { storage: store }),
    );
  }

  // 6) فشل جميع المحاولات الثلاث يحفظ المحاولة في pending ويعيد إرسالها لاحقًا عند الفتح (retryPending)
  {
    const store = new MemoryStorage();
    const pFail = { ...payload, attemptId: "attempt-offline" };
    let failCalls = 0;
    const ok = await sendWithRetry(pFail, {
      storage: store,
      sleep: fastSleep,
      fetchImpl: async () => {
        failCalls++;
        throw new Error("offline");
      },
    });
    check(
      "عند فشل 3 محاولات يعيد false ويحفظ المحاولة في pending:<EXAM_ID>:<attemptId>",
      ok === false && failCalls === 3 && hasPending(pFail.attemptId, { storage: store }) && store.getItem(pendingKey(pFail.attemptId)) !== null,
    );

    // وضع محاولات معلّقة لنموذجين آخرين في نفس localStorage للتحقق من عدم المساس بها
    store.setItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2:m1-att", JSON.stringify({ attemptId: "m1-att" }));
    store.setItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2:m2-att", JSON.stringify({ attemptId: "m2-att" }));

    let resentCalls = 0;
    const flushed = await retryPending({
      storage: store,
      sleep: fastSleep,
      fetchImpl: async () => {
        resentCalls++;
        return { text: async () => JSON.stringify({ ok: true }) };
      },
    });
    check(
      "retryPending يعيد إرسال محاولة النموذج الثالث المعلّقة فقط ويحذفها بعد النجاح دون لمس محاولات النماذج الأخرى",
      flushed === 1 &&
        resentCalls === 1 &&
        !hasPending(pFail.attemptId, { storage: store }) &&
        isSent(pFail.attemptId, { storage: store }) &&
        store.getItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2:m1-att") !== null &&
        store.getItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2:m2-att") !== null,
    );
  }

  // 7) مهلة الطلب (Timeout) وعمل النظام حتى عند غياب localStorage
  {
    const okTimeout = await sendWithRetry(
      { ...payload, attemptId: "attempt-timeout" },
      {
        storage: null,
        sleep: fastSleep,
        timeoutMs: 15,
        fetchImpl: async (_url, init) =>
          new Promise((_res, rej) => {
            init.signal?.addEventListener("abort", () => rej(new Error("aborted")));
          }),
      },
    );
    check("انتهاء المهلة أو غياب localStorage لا يرمي استثناءً ويعيد false بأمان", okTimeout === false);
  }

  check(
    "بوادئ التخزين معزولة بـ EXAM_ID",
    PENDING_PREFIX === `pending:${EXAM_ID}:` && SENT_PREFIX === `sent:${EXAM_ID}:`,
  );

  console.log(failures === 0 ? "submit suite OK" : `${failures} failure(s)`);
  if (failures === 0) process.exitCode = 0;
}

void main();

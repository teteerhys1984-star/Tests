/* ============================================================
   إرسال النتيجة — عقد grade5-math-unit1، دون تغيير تصحيح الاختبار
   ============================================================ */
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
const RETRY_DELAYS_MS = [2000, 5000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
const ATTEMPT_TIMEOUT_MS = 30000;
const PENDING_PREFIX = `pending:${EXAM_ID}:`;
const SENT_PREFIX = `sent:${EXAM_ID}:`;
const SHEETS_STATUS_AR = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
};
const LESSON_TITLES = ["القوى المتلاقية", "القوى المتوازية"];

// سلم المرجع: لا يُستخدم إلا عند بناء summary المرسلة للمعلم.
function gradeLabel(p) {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

// النتيجة والتقرير هنا هما الناتجان الأصليان للتصحيح، وليس تصحيحاً ثانياً.
function buildPayload(state) {
  const res = state.results;
  const questions = res.perQuestion;
  let fullQuestions = 0, partialQuestions = 0, wrongQuestions = 0;
  questions.forEach(({ q, earned }) => {
    const max = q.parts.reduce((sum, part) => sum + part.marks, 0);
    if (Math.abs(earned - max) < 1e-9) fullQuestions++;
    else if (earned > 0) partialQuestions++;
    else wrongQuestions++;
  });
  return {
    token: SHEETS_TOKEN,
    attemptId: state.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM.title,
    studentName: state.studentName,
    startAt: new Date(res.startedAt).toISOString(),
    submitAt: new Date(res.submittedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor(res.durationMs / 1000)),
    summary: {
      total: res.total,
      max: res.max,
      percentage: res.pct,
      gradeLabel: gradeLabel(res.pct),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts: res.counts.correct,
      partialSubparts: res.counts.partial,
      wrongSubparts: res.counts.incorrect,
      unansweredSubparts: res.counts.unanswered,
    },
    lessons: LESSON_TITLES.map((title, index) => {
      const lessonQuestions = questions.filter(({ q }) => q.lesson === index + 1);
      return {
        title,
        awarded: round2(lessonQuestions.reduce((sum, r) => sum + r.earned, 0)),
        max: lessonQuestions.reduce((sum, r) => sum + r.q.parts.reduce((n, part) => n + part.marks, 0), 0),
      };
    }),
    details: questions.flatMap(({ q, qi, parts }) => parts.map(({ part, score, status, studentText }) => ({
      q: qi + 1,
      qTitle: stripHtml(q.lead),
      lessons: LESSON_TITLES[q.lesson - 1],
      label: part.letter,
      status: SHEETS_STATUS_AR[status],
      awarded: score,
      marks: part.marks,
      studentAnswer: studentText,
      correctAnswer: stripHtml(part.answer),
    }))),
    reportText: state.report.text,
  };
}

const pendingKey = (attemptId) => PENDING_PREFIX + attemptId;
const sentKey = (attemptId) => SENT_PREFIX + attemptId;
const inFlight = new Map();
const sentThisPage = new Set();
let flushingPending = null;

function storageOf(opts = {}) {
  if (opts.storage !== undefined) return opts.storage;
  try { return window.localStorage || null; } catch (e) { return null; }
}
function savePending(payload, opts = {}) {
  try {
    const storage = storageOf(opts);
    if (!storage) return false;
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    return true;
  } catch (e) { return false; }
}
function dropPending(attemptId, opts = {}) {
  try { storageOf(opts)?.removeItem(pendingKey(attemptId)); } catch (e) { /* يحتفظ المتصفح بالنسخة المعلّقة */ }
}
function wasSent(attemptId, opts = {}) {
  if (sentThisPage.has(attemptId)) return true;
  try { return storageOf(opts)?.getItem(sentKey(attemptId)) === "1"; } catch (e) { return false; }
}
function rememberSent(attemptId, opts = {}) {
  sentThisPage.add(attemptId);
  try { storageOf(opts)?.setItem(sentKey(attemptId), "1"); } catch (e) { /* تبقى الحماية في الذاكرة */ }
}
function hasPending(attemptId) {
  try { return !!storageOf()?.getItem(pendingKey(attemptId)); } catch (e) { return false; }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function isAccepted(data) {
  return !!data && typeof data === "object" && (data.ok === true || data.duplicate === true);
}
async function postOnce(body, opts) {
  let timer;
  try {
    const doFetch = opts.fetchImpl || ((url, init) => fetch(url, init));
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const reply = Promise.resolve().then(() => doFetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
      ...(controller ? { signal: controller.signal } : {}),
    })).then((response) => response.text());
    reply.catch(() => {});
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        if (controller) controller.abort();
        reject(new Error("timeout"));
      }, opts.timeoutMs === undefined ? ATTEMPT_TIMEOUT_MS : opts.timeoutMs);
    });
    return isAccepted(JSON.parse(await Promise.race([reply, timeout])));
  } catch (e) { return false; }
  finally { if (timer !== undefined) clearTimeout(timer); }
}
async function deliver(payload, opts) {
  try {
    const body = JSON.stringify(payload);
    const sleep = opts.sleep || wait;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (await postOnce(body, opts)) return true;
    }
  } catch (e) { /* أي خطأ هو فشل، وتبقى النتيجة المعلّقة */ }
  return false;
}

// بديل ذري بين الألسنة للمتصفحات التي لا تدعم Web Locks. لا تُحفظ فيه
// بيانات الطالب: القفل وإيصال الاستلام يحويان معرّف المحاولة فقط.
function openLockDatabase(factory) {
  if (!factory || typeof factory.open !== "function") return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (db) => {
      if (settled) { if (db) db.close(); return; }
      settled = true; clearTimeout(timer); resolve(db);
    };
    const timer = setTimeout(() => finish(null), 1000);
    try {
      const request = factory.open("tests-exam-send-locks-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("attempts")) request.result.createObjectStore("attempts");
      };
      request.onsuccess = () => finish(request.result);
      request.onerror = request.onblocked = () => finish(null);
    } catch (e) { finish(null); }
  });
}
function lockTransaction(db, key, mutate) {
  return new Promise((resolve, reject) => {
    let result;
    try {
      const tx = db.transaction("attempts", "readwrite");
      const store = tx.objectStore("attempts");
      const request = store.get(key);
      request.onsuccess = () => {
        try { result = mutate(store, request.result); }
        catch (e) { try { tx.abort(); } catch (ignored) {} }
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(new Error("lock transaction failed"));
    } catch (e) { reject(e); }
  });
}
async function withIndexedDbLock(attemptId, opts, action) {
  const factory = opts.indexedDB !== undefined ? opts.indexedDB : (typeof indexedDB !== "undefined" ? indexedDB : null);
  const db = await openLockDatabase(factory);
  if (!db) return { used: false };
  const key = `send:${EXAM_ID}:${attemptId}`, owner = uuid(), leaseMs = 120000;
  let entered = false, acquired = false, heartbeat;
  try {
    while (!acquired) {
      if (wasSent(attemptId, opts)) { dropPending(attemptId, opts); return { used: true, result: true }; }
      const state = await lockTransaction(db, key, (store, record) => {
        if (record && record.delivered === true) return "sent";
        if (record && record.expires > Date.now()) return "busy";
        store.put({ owner, expires: Date.now() + leaseMs }, key);
        return "acquired";
      });
      if (state === "sent") {
        rememberSent(attemptId, opts); dropPending(attemptId, opts);
        return { used: true, result: true };
      }
      acquired = state === "acquired";
      if (!acquired) await wait(250);
    }
    heartbeat = setInterval(() => {
      void lockTransaction(db, key, (store, record) => {
        if (record && record.owner === owner) store.put({ owner, expires: Date.now() + leaseMs }, key);
      }).catch(() => {});
    }, 30000);
    entered = true;
    const result = await action();
    clearInterval(heartbeat); heartbeat = null;
    try {
      await lockTransaction(db, key, (store, record) => {
        if (record && record.owner === owner) {
          if (result) store.put({ delivered: true }, key);
          else store.delete(key);
        }
      });
      acquired = false;
    } catch (e) { /* لا يلغي فشل التخزين تأكيد الخادم أو النتيجة المعروضة */ }
    return { used: true, result };
  } catch (e) {
    // إن بدأت العملية فلا نكررها بسبب خطأ في القفل؛ تحفظها دالة الإرسال عند الفشل.
    if (entered) throw e;
    return { used: false };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    if (acquired) {
      try { await lockTransaction(db, key, (store, record) => { if (record && record.owner === owner) store.delete(key); }); } catch (e) {}
    }
    db.close();
  }
}

// Web Locks ينسّق بين الألسنة في المتصفحات الحديثة، وIndexedDB بديله الذري.
// يظل معرّف المحاولة ثابتاً ليتمكن الخادم من تمييز إعادة المحاولة الآمنة.
async function withAttemptLock(attemptId, opts, action) {
  const locks = opts.locks !== undefined ? opts.locks : (typeof navigator !== "undefined" ? navigator.locks : null);
  if (locks && typeof locks.request === "function") {
    let entered = false;
    try {
      return await locks.request(`send:${EXAM_ID}:${attemptId}`, { mode: "exclusive" }, () => {
        entered = true;
        return action();
      });
    } catch (e) {
      if (entered) throw e;
    }
  }
  const fallback = await withIndexedDbLock(attemptId, opts, action);
  return fallback.used ? fallback.result : action();
}

// حفظ مسبق قبل أول اتصال يحمي من إغلاق الصفحة أثناء الطلب؛ النجاح وحده يحذف المعلّق.
// تشترك المحاولة الواحدة في وعد واحد، وبعد التأكيد لا يُعاد إرسالها.
function sendWithRetry(payload, opts = {}) {
  if (!payload || typeof payload.attemptId !== "string" || !payload.attemptId || payload.examId !== EXAM_ID) {
    return Promise.resolve(false);
  }
  const id = payload.attemptId;
  if (wasSent(id, opts)) { dropPending(id, opts); return Promise.resolve(true); }
  if (inFlight.has(id)) return inFlight.get(id);
  const outgoing = { ...payload, token: SHEETS_TOKEN };
  savePending(outgoing, opts);
  const operation = Promise.resolve().then(() => withAttemptLock(id, opts, async () => {
    if (wasSent(id, opts)) { dropPending(id, opts); return true; }
    const ok = await deliver(outgoing, opts);
    if (ok) { rememberSent(id, opts); dropPending(id, opts); }
    else savePending(outgoing, opts);
    return ok;
  })).catch(() => { savePending(outgoing, opts); return false; }).finally(() => { inFlight.delete(id); });
  inFlight.set(id, operation);
  return operation;
}

function updateSendStatus(attemptId, status) {
  if (!S || S.status !== "submitted" || S.attemptId !== attemptId) return;
  S.sendStatus = status;
  saveState();
  if (S.screen === "results") renderApp();
}
function sendCurrentResult() {
  if (!S || S.status !== "submitted" || !S.results || !S.report) return;
  const attemptId = S.attemptId;
  try {
    const payload = buildPayload(S);
    updateSendStatus(attemptId, "sending");
    void sendWithRetry(payload).then((ok) => updateSendStatus(attemptId, ok ? "success" : "failed"));
  } catch (e) { updateSendStatus(attemptId, "failed"); }
}

// استدعاءات إعادة الإرسال المتزامنة تشترك في الجولة نفسها.
function retryPending(opts = {}) {
  if (!flushingPending) {
    flushingPending = flushPending(opts).finally(() => { flushingPending = null; });
  }
  return flushingPending;
}
async function flushPending(opts) {
  let sent = 0;
  try {
    const storage = storageOf(opts);
    if (!storage) return 0;
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(PENDING_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      let payload;
      try { payload = JSON.parse(storage.getItem(key)); } catch (e) { continue; }
      if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
          payload.examId !== EXAM_ID || typeof payload.attemptId !== "string" || key !== pendingKey(payload.attemptId)) continue;
      updateSendStatus(payload.attemptId, "sending");
      const ok = await sendWithRetry(payload, opts);
      updateSendStatus(payload.attemptId, ok ? "success" : "failed");
      if (ok) sent++;
    }
  } catch (e) { /* تبقى الحمولات لإعادة المحاولة عند الفتح التالي */ }
  return sent;
}

function initializeSheets() {
  try {
    if (S.status === "submitted" && S.results && S.report) {
      if (S.sendStatus === "success" || wasSent(S.attemptId)) {
        rememberSent(S.attemptId);
        dropPending(S.attemptId);
        updateSendStatus(S.attemptId, "success");
      } else {
        // استعادة النتيجة إذا أُغلقت الصفحة قبل اكتمال تسجيل الحمولة.
        savePending(buildPayload(S));
        updateSendStatus(S.attemptId, "sending");
      }
    }
    void retryPending();
  } catch (e) { if (S && S.status === "submitted") updateSendStatus(S.attemptId, "failed"); }
}

function sendStatusHtml() {
  const status = S.sendStatus || "idle";
  if (status === "idle") return "";
  const messages = {
    sending: "جارٍ إرسال النتيجة إلى المعلّم…",
    success: "تم إرسال النتيجة إلى المعلّم.",
    failed: "تعذّر إرسال النتيجة إلى المعلّم.",
  };
  const colors = {
    sending: "background:#eef4fb;border-color:#b9c9dd;color:#13315c",
    success: "background:#e3f2f1;border-color:#a6d7d1;color:#0b625d",
    failed: "background:#fff3ed;border-color:#efc4ac;color:#803b24",
  };
  if (!messages[status]) return "";
  const warning = status === "failed" && !hasPending(S.attemptId)
    ? `<p class="small">تعذّر حفظ النتيجة لإعادة الإرسال لاحقاً؛ احتفظ بالتقرير ولا تغلق الصفحة قبل إعادة المحاولة.</p>` : "";
  return `<section class="card panel mt-16 text-center" role="status" aria-live="polite" data-send-status="${status}" style="${colors[status]}">
    <p style="font-weight:700;margin:0">${messages[status]}</p>
    ${status === "failed" ? `<button type="button" class="btn btn-primary" id="btn-resend" style="margin-top:12px">${icon("retry")} إعادة إرسال النتيجة</button>` : ""}
    ${warning}
  </section>`;
}

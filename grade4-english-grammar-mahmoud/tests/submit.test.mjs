/**
 * Sending the result to the teacher: tries, time limit, storing a result that could not be
 * delivered, sending it again when the test is opened, the separate "Resend Result" button,
 * and protection against sending the same attempt twice.
 *
 * No real connection is made: the page's fetch is the harness FakeServer and time is virtual.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ATTEMPT_KEY, Clock, FakeServer, FakeStorage, PENDING_PREFIX, SHEETS_TOKEN, SHEETS_URL, SOURCE_HTML, openExam, sendStatus, settle,
  startInUi, submitExamInUi, takeExamInUi,
} from "./harness.mjs";

const COPY = {
  sending: "Sending your result to your teacher…",
  success: "Your result was sent to your teacher ✓",
  failed: "Your result could not be sent. Check your internet connection and press “Resend Result”, or download the TXT report and give it to your teacher.",
};
const TOTAL_FAILURE_MS = 7000; /* three quick failures: waits of 2 s and 5 s */

async function open(script = [], fallback = "ok", extra = {}) {
  const server = extra.server || new FakeServer(script, fallback);
  const storage = extra.storage || new FakeStorage();
  const page = await openExam({ file: SOURCE_HTML, server, storage, clock: extra.clock || new Clock(), crypto: extra.crypto });
  return { page, server, storage };
}
function storedAttempt(storage) {
  const raw = storage.map.get(ATTEMPT_KEY);
  return raw ? JSON.parse(raw) : null;
}
function quiet(page) {
  assert.equal(page.pageErrors.length, 0, "no page error");
  assert.deepEqual(page.consoleLines, [], "nothing is written to the console");
}
/** The results are on screen and usable, whatever happened to the delivery. */
async function resultsUsable(page, score = "100") {
  assert.equal(page.screen(), "results");
  assert.equal(page.text("#resultScore"), score);
  assert.equal(page.$$("#reviewList .review-card").length, 25);
  const before = page.downloads.length;
  page.click("#downloadBtn");
  assert.equal(page.downloads.length, before + 1, "the TXT report can still be downloaded");
  assert.ok((await page.downloadText()).includes("Total score: " + score + " / 100"));
}

test("nothing is sent before the test is submitted", async () => {
  const { page, server, storage } = await open();
  assert.equal(server.count, 0);
  assert.equal(sendStatus(page).visible, false);
  await takeExamInUi(page, {});
  assert.equal(server.count, 0, "starting and answering sends nothing");
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  page.click("#submitBtn");
  await settle();
  assert.equal(server.count, 1);
  quiet(page);
});

test("one POST with the reference's exact transport", async () => {
  const { page, server, storage } = await open();
  await submitExamInUi(page, {});
  assert.equal(server.count, 1);
  const { url, init } = server.requests[0];
  assert.equal(url, SHEETS_URL);
  assert.equal(init.method, "POST");
  assert.equal(JSON.stringify(init.headers), '{"Content-Type":"text/plain;charset=utf-8"}');
  assert.equal(init.redirect, "follow");
  assert.equal(typeof init.body, "string");
  assert.ok(init.signal && typeof init.signal.aborted === "boolean", "the request can be aborted by the time limit");
  assert.equal(init.signal.aborted, false);
  assert.deepEqual(Object.keys(init).sort(), ["body", "headers", "method", "redirect", "signal"]);
  assert.deepEqual(sendStatus(page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  assert.equal(storedAttempt(storage).delivery.status, "sent");
  assert.equal(storedAttempt(storage).delivery.attemptId, server.requests[0].payload.attemptId);
  /* Later timers change nothing: no further request. */
  await page.clock.advance(600000);
  assert.equal(server.count, 1);
  quiet(page);
});

test("the student sees the result at once; delivery runs in the background", async () => {
  const { page, server } = await open(["hang"]);
  await submitExamInUi(page, {});
  assert.deepEqual(sendStatus(page), { state: "sending", visible: true, text: COPY.sending, resendVisible: false });
  await resultsUsable(page);
  assert.equal(page.text("#send-status-text-ar"), "جارٍ إرسال نتيجتك إلى معلّمك…");
  assert.equal(server.count, 1);
  quiet(page);
});

test("retry: a second try after 2 s and a third after 5 s, with the same body and attemptId", async () => {
  const { page, server, storage } = await open(["network", "html", "ok"]);
  await submitExamInUi(page, {});
  assert.equal(server.count, 1);
  await page.clock.advance(1999);
  assert.equal(server.count, 1);
  await page.clock.advance(1);
  assert.equal(server.count, 2);
  assert.equal(sendStatus(page).state, "sending");
  await page.clock.advance(4999);
  assert.equal(server.count, 2);
  await page.clock.advance(1);
  assert.equal(server.count, 3);
  assert.deepEqual(server.offsets(), [0, 2000, 7000]);
  assert.equal(new Set(server.requests.map((request) => request.init.body)).size, 1, "identical body on every try");
  assert.equal(new Set(server.attemptIds()).size, 1);
  assert.deepEqual(sendStatus(page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  await page.clock.advance(600000);
  assert.equal(server.count, 3, "no fourth try");
  quiet(page);
});

for (const mode of ["network", "rejected", "html"]) {
  test(`three failed tries (${mode}): the result is stored, the button appears, the results stay`, async () => {
    const { page, server, storage } = await open([], mode);
    await submitExamInUi(page, {});
    await page.clock.advance(TOTAL_FAILURE_MS);
    assert.equal(server.count, 3);
    assert.deepEqual(sendStatus(page), { state: "failed", visible: true, text: COPY.failed, resendVisible: true });
    assert.ok(page.text("#resend-result-btn").includes("Resend Result"));
    assert.ok(page.text("#resend-result-btn").includes("إعادة إرسال النتيجة"));
    const id = server.attemptIds()[0];
    assert.deepEqual(storage.keys(PENDING_PREFIX), [PENDING_PREFIX + id]);
    assert.equal(storage.getItem(PENDING_PREFIX + id), server.requests[0].init.body, "the stored result is the payload that was sent");
    assert.equal(storedAttempt(storage).delivery.status, "failed");
    await resultsUsable(page);
    await page.clock.advance(600000);
    assert.equal(server.count, 3, "it stops after three tries");
    quiet(page);
  });
}

test("a reply of duplicate:true counts as delivered", async () => {
  const { page, server, storage } = await open(["duplicate"]);
  await submitExamInUi(page, {});
  assert.equal(server.count, 1);
  assert.equal(sendStatus(page).state, "success");
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  quiet(page);
});

test("a reply that is lost on the way: the retry is recognised by the server, one row only", async () => {
  const { page, server } = await open(["lost-reply", "ok"]);
  await submitExamInUi(page, {});
  await page.clock.advance(2000);
  assert.equal(server.count, 2);
  assert.equal(server.rows.size, 1, "the same attemptId is stored once");
  assert.equal(sendStatus(page).state, "success");
  quiet(page);
});

test("time limit: a try with no reply is abandoned after 30 s", async () => {
  const { page, server, storage } = await open([], "hang");
  await submitExamInUi(page, {});
  await page.clock.advance(29999);
  assert.equal(server.count, 1);
  assert.equal(server.requests[0].aborted, false);
  await page.clock.advance(1);
  assert.equal(server.requests[0].aborted, true, "the request is aborted at 30 s");
  assert.equal(sendStatus(page).state, "sending");
  await page.clock.advance(2000);
  assert.equal(server.count, 2);
  await page.clock.advance(30000 + 5000);
  assert.equal(server.count, 3);
  assert.deepEqual(server.offsets(), [0, 32000, 67000]);
  await page.clock.advance(29999);
  assert.equal(sendStatus(page).state, "sending");
  await page.clock.advance(1);
  assert.deepEqual(sendStatus(page), { state: "failed", visible: true, text: COPY.failed, resendVisible: true });
  assert.ok(server.requests.every((request) => request.aborted));
  assert.equal(storage.keys(PENDING_PREFIX).length, 1);
  await resultsUsable(page);
  quiet(page);
});

test("a slow reply inside the limit is accepted, and the limit's timer is cleared", async () => {
  const server = new FakeServer();
  const clock = new Clock();
  let release;
  server.fetch = (url, init) => {
    server.requests.push({ url, init, payload: JSON.parse(init.body), at: clock.now });
    return new Promise((resolve) => { release = () => resolve({ text: async () => '{"ok":true}' }); });
  };
  const { page } = await open([], "ok", { server, clock });
  await submitExamInUi(page, {});
  await page.clock.advance(25000);
  assert.equal(sendStatus(page).state, "sending");
  release();
  await settle();
  assert.equal(sendStatus(page).state, "success");
  await page.clock.advance(600000);
  assert.equal(server.requests.length, 1);
  assert.equal(server.requests[0].init.signal.aborted, false);
  quiet(page);
});

test("“Resend Result”: the same attemptId and body; success hides the button and clears the stored result", async () => {
  const { page, server, storage } = await open(["network", "network", "network", "ok"]);
  await submitExamInUi(page, {});
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(sendStatus(page).state, "failed");
  page.click("#resend-result-btn");
  assert.equal(sendStatus(page).state, "sending", "the button disappears while sending");
  assert.equal(sendStatus(page).resendVisible, false);
  await settle();
  assert.equal(server.count, 4);
  assert.equal(new Set(server.attemptIds()).size, 1);
  assert.equal(new Set(server.requests.map((request) => request.init.body)).size, 1);
  assert.deepEqual(sendStatus(page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  assert.equal(storedAttempt(storage).delivery.status, "sent");
  /* Once delivered, nothing sends it again. */
  page.click("#resend-result-btn");
  page.run("resendResult(); deliverSubmittedResult(); resumeResultDelivery();");
  await page.run("retryPending()");
  await page.clock.advance(600000);
  assert.equal(server.count, 4);
  assert.equal(server.rows.size, 1);
  quiet(page);
});

test("“Resend Result” can be pressed again after another failure", async () => {
  const { page, server, storage } = await open([], "network");
  await submitExamInUi(page, {});
  await page.clock.advance(TOTAL_FAILURE_MS);
  page.click("#resend-result-btn");
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(server.count, 6);
  assert.equal(sendStatus(page).state, "failed");
  assert.equal(storage.keys(PENDING_PREFIX).length, 1);
  server.fallback = "ok";
  page.click("#resend-result-btn");
  await settle();
  assert.equal(server.count, 7);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(new Set(server.attemptIds()).size, 1);
  quiet(page);
});

test("no parallel or repeated sending: double clicks and repeated calls share one delivery", async () => {
  const { page, server } = await open(["network", "network", "network", "hang"], "ok");
  await takeExamInUi(page, {});
  page.click("#submitBtn");
  page.click("#submitBtn");
  page.click("#submitBtn");
  await settle();
  assert.equal(server.count, 1, "submitting twice sends once");
  page.run("deliverSubmittedResult(); resumeResultDelivery(); resendResult();");
  page.run("retryPending(); retryPending();");
  await settle();
  assert.equal(server.count, 1, "nothing starts a second delivery while one is running");
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(server.count, 3);
  assert.equal(sendStatus(page).state, "failed");
  /* Two quick presses of the button: one delivery. */
  page.click("#resend-result-btn");
  page.run("resendResult(); resendResult(); document.querySelector('#resend-result-btn').click();");
  page.run("retryPending()");
  await settle();
  assert.equal(server.count, 4);
  await page.clock.advance(30000 + 2000);
  assert.equal(server.count, 5);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(new Set(server.attemptIds()).size, 1);
  assert.equal(server.rows.size, 1);
  quiet(page);
});

test("opening the test again sends a stored result automatically and removes it", async () => {
  const first = await open([], "network");
  await submitExamInUi(first.page, {});
  await first.page.clock.advance(TOTAL_FAILURE_MS);
  const id = first.server.attemptIds()[0];
  const body = first.server.requests[0].init.body;
  assert.deepEqual(first.storage.keys(PENDING_PREFIX), [PENDING_PREFIX + id]);

  const second = await open([], "ok", { storage: first.storage });
  await settle();
  assert.equal(second.page.screen(), "results", "the submitted attempt is restored, as in the original");
  assert.equal(second.server.count, 1, "one request, although both the restored screen and the pending store ask for it");
  assert.equal(second.server.requests[0].init.body, body, "the stored payload, unchanged");
  assert.deepEqual(sendStatus(second.page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.deepEqual(first.storage.keys(PENDING_PREFIX), []);
  assert.equal(storedAttempt(first.storage).delivery.status, "sent");
  await resultsUsable(second.page);
  quiet(second.page);

  /* Opening it a third time sends nothing. */
  const third = await open([], "ok", { storage: first.storage });
  await third.page.clock.advance(600000);
  assert.equal(third.server.count, 0);
  assert.equal(sendStatus(third.page).state, "success");
  quiet(third.page);
});

test("opening the test again while still offline: three tries, the result stays stored", async () => {
  const first = await open([], "network");
  await submitExamInUi(first.page, {});
  await first.page.clock.advance(TOTAL_FAILURE_MS);
  const second = await open([], "network", { storage: first.storage });
  assert.equal(sendStatus(second.page).state, "sending");
  await second.page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(second.server.count, 3);
  assert.deepEqual(sendStatus(second.page), { state: "failed", visible: true, text: COPY.failed, resendVisible: true });
  assert.equal(first.storage.keys(PENDING_PREFIX).length, 1);
  assert.equal(second.server.attemptIds()[0], first.server.attemptIds()[0]);
  await resultsUsable(second.page);
  quiet(second.page);
});

test("a stored result of an earlier attempt is sent quietly from the start screen", async () => {
  const first = await open([], "network");
  await submitExamInUi(first.page, { name: "First Attempt" });
  await first.page.clock.advance(TOTAL_FAILURE_MS);
  first.page.click("#retryBtn");
  assert.equal(first.page.screen(), "start");
  assert.equal(sendStatus(first.page).state, "idle");
  assert.equal(first.storage.keys(PENDING_PREFIX).length, 1, "“Try Again” does not throw the undelivered result away");

  const second = await open([], "ok", { storage: first.storage });
  await settle();
  assert.equal(second.page.screen(), "start");
  assert.equal(second.server.count, 1);
  assert.equal(second.server.requests[0].payload.studentName, "First Attempt");
  assert.equal(second.server.requests[0].payload.attemptId, first.server.attemptIds()[0]);
  assert.deepEqual(first.storage.keys(PENDING_PREFIX), []);
  assert.equal(sendStatus(second.page).state, "idle", "nothing is shown for an attempt that is not on screen");
  assert.equal(second.page.$("#send-status").hidden, true);
  quiet(second.page);
});

test("a result is restored mid-test too: stored results go out while the student continues", async () => {
  const first = await open([], "network");
  await submitExamInUi(first.page, { name: "First Attempt" });
  await first.page.clock.advance(TOTAL_FAILURE_MS);
  first.page.click("#retryBtn");
  startInUi(first.page, "Second Attempt");
  assert.equal(first.page.screen(), "test");

  const second = await open(["network", "ok"], "ok", { storage: first.storage });
  assert.equal(second.page.screen(), "test", "the unfinished attempt is resumed, as in the original");
  await second.page.clock.advance(2000);
  assert.equal(second.server.count, 2);
  assert.deepEqual(first.storage.keys(PENDING_PREFIX), []);
  assert.equal(second.page.screen(), "test");
  assert.equal(second.page.$("#send-status").hidden, true);
  quiet(second.page);
});

test("the pending store: only this examination's entries, the current token, broken entries skipped", async () => {
  const storage = new FakeStorage();
  const mine = (id, extra = {}) => JSON.stringify({ token: "old-token", attemptId: id, examId: "grade4-english-grammar-mahmoud", studentName: "Stored " + id, ...extra });
  storage.setItem(PENDING_PREFIX + "aaa", mine("aaa"));
  storage.setItem(PENDING_PREFIX + "bbb", mine("bbb"));
  storage.setItem(PENDING_PREFIX + "broken", "{not json");
  storage.setItem(PENDING_PREFIX + "array", "[1,2]");
  storage.setItem(PENDING_PREFIX + "mismatch", mine("someone-else"));
  storage.setItem("pending:grade5-arabic-exam:zzz", JSON.stringify({ token: "t", attemptId: "zzz", examId: "grade5-arabic-exam" }));
  storage.setItem("pending:grade4-english-grammar-mahmoud-2:yyy", JSON.stringify({ token: "t", attemptId: "yyy" }));
  storage.setItem("unrelated", "keep me");
  const before = new Map(storage.map);

  const { page, server } = await open(["ok", "network", "network", "network"], "ok", { storage });
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.deepEqual(server.attemptIds(), ["aaa", "bbb", "bbb", "bbb"]);
  for (const request of server.requests) {
    assert.equal(request.payload.token, SHEETS_TOKEN, "sent with the token of the current page");
    assert.equal(request.url, SHEETS_URL);
  }
  assert.equal(storage.getItem(PENDING_PREFIX + "aaa"), null, "delivered: removed");
  assert.ok(storage.getItem(PENDING_PREFIX + "bbb"), "not delivered: kept");
  for (const key of [PENDING_PREFIX + "broken", PENDING_PREFIX + "array", PENDING_PREFIX + "mismatch", "pending:grade5-arabic-exam:zzz", "pending:grade4-english-grammar-mahmoud-2:yyy", "unrelated"]) {
    assert.equal(storage.getItem(key), before.get(key), key + " is left untouched");
  }
  assert.equal(page.screen(), "start");
  assert.equal(page.$("#send-status").hidden, true);
  assert.equal(await page.run("retryPending()"), 1, "the next round delivers the one that was kept");
  assert.equal(storage.getItem(PENDING_PREFIX + "bbb"), null);
  quiet(page);
});

test("leaving the page while sending stores the result at once; success removes it", async () => {
  for (const leave of ["pagehide", "visibilitychange"]) {
    const { page, server, storage } = await open(["hang", "ok"]);
    await submitExamInUi(page, {});
    assert.deepEqual(storage.keys(PENDING_PREFIX), [], "nothing is stored while the first try is running");
    if (leave === "pagehide") page.window.dispatchEvent(new page.window.Event("pagehide"));
    else {
      Object.defineProperty(page.document, "visibilityState", { configurable: true, get: () => "hidden" });
      page.document.dispatchEvent(new page.window.Event("visibilitychange"));
    }
    const id = server.attemptIds()[0];
    assert.deepEqual(storage.keys(PENDING_PREFIX), [PENDING_PREFIX + id], leave);
    assert.equal(storage.getItem(PENDING_PREFIX + id), server.requests[0].init.body);
    /* The device comes back; the second try succeeds. */
    await page.clock.advance(32000);
    assert.equal(sendStatus(page).state, "success");
    assert.deepEqual(storage.keys(PENDING_PREFIX), []);
    /* After the delivery has finished, leaving the page stores nothing. */
    page.window.dispatchEvent(new page.window.Event("pagehide"));
    page.document.dispatchEvent(new page.window.Event("visibilitychange"));
    assert.deepEqual(storage.keys(PENDING_PREFIX), []);
    quiet(page);
  }
});

test("the page is closed mid-delivery and opened again: same attemptId, one row on the sheet", async () => {
  const first = await open(["lost-reply"], "hang");
  await submitExamInUi(first.page, {});
  first.page.window.dispatchEvent(new first.page.window.Event("pagehide"));
  const id = first.server.attemptIds()[0];
  assert.equal(first.server.rows.size, 1, "the server stored the row, but the page never heard");

  first.server.fallback = "ok";
  const second = await open([], "ok", { storage: first.storage, server: first.server });
  await settle();
  assert.equal(second.page.screen(), "results");
  assert.equal(first.server.requests.at(-1).payload.attemptId, id);
  assert.equal(first.server.rows.size, 1, "recognised as a duplicate");
  assert.equal(sendStatus(second.page).state, "success");
  assert.deepEqual(first.storage.keys(PENDING_PREFIX), []);
  quiet(second.page);
});

test("a submitted attempt restored without any delivery record is still sent", async () => {
  const first = await open([], "ok");
  await submitExamInUi(first.page, {});
  const saved = storedAttempt(first.storage);
  delete saved.delivery;
  const storage = new FakeStorage();
  storage.setItem(ATTEMPT_KEY, JSON.stringify(saved));
  const second = await open([], "ok", { storage });
  await settle();
  assert.equal(second.page.screen(), "results");
  assert.equal(second.server.count, 1);
  assert.equal(second.server.requests[0].payload.summary.total, 100);
  assert.equal(second.server.requests[0].payload.reportText, first.server.requests[0].payload.reportText, "the report is rebuilt identically");
  assert.equal(storedAttempt(storage).delivery.status, "sent");
  quiet(second.page);
});

test("a new attempt started while the old one is still being sent is not touched", async () => {
  /* The server never answers the first attempt and answers the second at once. */
  const slow = new FakeServer();
  const answer = slow.fetch;
  slow.fetch = (url, init) => {
    slow.script = [JSON.parse(init.body).studentName === "First Attempt" ? "hang" : "ok"];
    return answer(url, init);
  };
  const { page, server, storage } = await open([], "ok", { server: slow });
  await submitExamInUi(page, { name: "First Attempt" });
  assert.equal(sendStatus(page).state, "sending");
  page.click("#retryBtn");
  assert.equal(page.screen(), "start");
  assert.equal(sendStatus(page).state, "idle");
  assert.equal(page.$("#send-status").hidden, true);

  /* The second attempt is submitted while the first is still on its way. */
  await submitExamInUi(page, { name: "Second Attempt", elapsedMs: 20000 });
  assert.equal(server.count, 2);
  const [firstId, secondId] = server.attemptIds();
  assert.notEqual(firstId, secondId);
  assert.equal(server.requests[1].payload.studentName, "Second Attempt");
  assert.deepEqual(sendStatus(page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.equal(page.text("#resultName"), "Second Attempt");

  /* The first delivery fails later: the screen of the second attempt stays as it is. */
  await page.clock.advance(120000);
  assert.equal(server.requests.filter((request) => request.payload.attemptId === firstId).length, 3);
  assert.deepEqual(sendStatus(page), { state: "success", visible: true, text: COPY.success, resendVisible: false });
  assert.deepEqual(storage.keys(PENDING_PREFIX), [PENDING_PREFIX + firstId], "the first result is kept for the next opening");
  assert.equal(storedAttempt(storage).delivery.attemptId, secondId);
  assert.equal(storedAttempt(storage).delivery.status, "sent");

  const again = await open([], "ok", { storage });
  await settle();
  assert.equal(again.page.screen(), "results");
  assert.deepEqual(again.server.attemptIds(), [firstId], "only the undelivered one; the second attempt is not sent again");
  assert.equal(again.server.requests[0].payload.studentName, "First Attempt");
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  quiet(page);
  quiet(again.page);
});

test("a first attempt that fails while the student is in a new attempt leaves the test screen alone", async () => {
  const { page, server, storage } = await open([], "network");
  await submitExamInUi(page, { name: "First Attempt" });
  page.click("#retryBtn");
  startInUi(page, "Second Attempt");
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(server.count, 3);
  assert.equal(page.screen(), "test");
  assert.equal(page.$("#send-status").hidden, true);
  assert.equal(page.$("#send-status").getAttribute("data-send-status"), "idle");
  assert.equal(storage.keys(PENDING_PREFIX).length, 1);
  assert.equal(storedAttempt(storage).name, "Second Attempt");
  assert.equal(storedAttempt(storage).delivery, undefined);
  quiet(page);
});

test("storage that refuses writes: no error, no claim that anything was saved", async () => {
  const { page, server, storage } = await open([], "network");
  storage.failWrites = true;
  await submitExamInUi(page, {});
  await page.clock.advance(TOTAL_FAILURE_MS);
  assert.equal(server.count, 3);
  const status = sendStatus(page);
  assert.equal(status.state, "failed");
  assert.equal(status.resendVisible, true);
  assert.ok(!/\bsaved\b|\bstored\b|automatically/i.test(status.text), status.text);
  assert.ok(!/حُفظ|محفوظ|تلقائي/.test(page.text("#send-status-text-ar")));
  assert.deepEqual(storage.keys(PENDING_PREFIX), []);
  await resultsUsable(page);
  /* The button still works. */
  server.fallback = "ok";
  page.click("#resend-result-btn");
  await settle();
  assert.equal(sendStatus(page).state, "success");
  quiet(page);
});

test("storage switched off completely: the test, the result and the delivery still work", async () => {
  const storage = new FakeStorage();
  storage.broken = true;
  const { page, server } = await open(["network", "ok"], "ok", { storage });
  await submitExamInUi(page, {});
  await page.clock.advance(2000);
  assert.equal(server.count, 2);
  assert.equal(sendStatus(page).state, "success");
  await resultsUsable(page);
  quiet(page);
});

test("a fault while building the payload never hides the result", async () => {
  const { page, server } = await open();
  await takeExamInUi(page, {});
  page.run("window.__real = buildReportText; let n = 0; const original = buildReportText; buildReportText = function () { n += 1; if (n === 2) throw new Error('boom'); return original(); };");
  page.click("#submitBtn");
  await settle();
  assert.equal(server.count, 0);
  assert.deepEqual(sendStatus(page), { state: "failed", visible: true, text: COPY.failed, resendVisible: true });
  assert.equal(page.screen(), "results");
  assert.equal(page.text("#resultScore"), "100");
  assert.equal(page.downloads.length, 1, "the automatic download happened");
  page.click("#resend-result-btn");
  await settle();
  assert.equal(server.count, 1);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(page.pageErrors.length, 0);
});

test("the delivery code uses fetch once and nothing else, and logs nothing", async () => {
  const { page } = await open();
  const script = page.html.slice(page.html.indexOf("<script>"));
  assert.equal((script.match(/\bfetch\s*\(/g) || []).length, 1);
  assert.ok(!/XMLHttpRequest|sendBeacon|WebSocket|EventSource|\.postMessage\(/.test(page.html));
  assert.ok(!/console\s*\.\s*(log|info|warn|error|debug)/.test(page.html));
  assert.deepEqual(page.json("RETRY_DELAYS_MS"), [2000, 5000]);
  assert.equal(page.run("MAX_ATTEMPTS"), 3);
  assert.equal(page.run("ATTEMPT_TIMEOUT_MS"), 30000);
});

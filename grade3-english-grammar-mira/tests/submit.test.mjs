/**
 * Delivery of the result: success, failure, the 2 s / 5 s retries, the 30 s time limit, the local
 * pending payload, retry when the examination is reopened, the separate "Resend Result" button,
 * and protection against duplicate or parallel sends.
 *
 * Every request goes to the harness FakeServer; no test talks to the network.
 */
import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  FakeServer, FakeStorage, PENDING_PREFIX, SHEETS_URL, SOURCE_HTML, STORAGE_KEY, openExam, sendStatus, settle, submitExamInUi,
} from "./harness.mjs";

const pages = [];

async function open(options = {}) {
  const page = await openExam({ file: SOURCE_HTML, ...options });
  pages.push(page);
  return page;
}

after(() => {
  for (const page of pages) page.close();
});

/** One result sent, answered correctly so the score is known. */
async function submitted(options = {}) {
  const page = await open(options);
  await submitExamInUi(page, { name: "Mira Test" });
  return page;
}

/** Lets the two retry waits (2 s then 5 s) pass on the virtual clock. */
async function passRetries(page) {
  await settle();
  await page.clock.advance(2000);
  await settle();
  await page.clock.advance(5000);
  await settle();
}

function pending(page) {
  return page.storage.keys(PENDING_PREFIX).map((key) => ({ key, payload: JSON.parse(page.storage.getItem(key)) }));
}

test("success: one request, one attemptId, status success, nothing left pending", async () => {
  const server = new FakeServer();
  const page = await submitted({ server });
  assert.equal(server.count, 1);
  assert.equal(server.requests[0].url, SHEETS_URL);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(sendStatus(page).visible, true);
  assert.equal(sendStatus(page).resendVisible, false);
  assert.equal(pending(page).length, 0);
  assert.equal(server.rows.size, 1);
  const stored = JSON.parse(page.storage.getItem(STORAGE_KEY));
  assert.equal(stored.delivery.status, "sent");
  assert.equal(stored.delivery.attemptId, server.requests[0].payload.attemptId);
});

test("failure: 3 tries with the same payload after 2 s and 5 s, then the payload is kept locally", async () => {
  const server = new FakeServer(["network", "network", "network"], "network");
  const page = await submitted({ server });
  assert.equal(server.count, 1, "the first try happens at once");
  await page.clock.advance(1999);
  assert.equal(server.count, 1, "nothing before 2 s");
  await page.clock.advance(1);
  assert.equal(server.count, 2, "the second try after 2 s");
  await page.clock.advance(4999);
  assert.equal(server.count, 2, "nothing before 5 s more");
  await page.clock.advance(1);
  await settle();
  assert.equal(server.count, 3, "the third try after 5 s more");
  assert.deepEqual(server.offsets(), [0, 2000, 7000]);

  const ids = new Set(server.attemptIds());
  assert.equal(ids.size, 1, "all three tries carry the same attemptId");
  const bodies = new Set(server.requests.map((request) => request.init.body));
  assert.equal(bodies.size, 1, "all three tries carry the same body");

  const status = sendStatus(page);
  assert.equal(status.state, "failed");
  assert.ok(status.visible);
  assert.ok(status.resendVisible, "the separate resend button appears");
  assert.match(status.text, /could not be sent/);
  assert.match(status.arabic, /تعذّر إرسال النتيجة/);

  /* The result and the report are on screen and downloaded although sending failed. */
  assert.equal(page.screen(), "results");
  assert.equal(page.$("#res-score-marks").textContent.trim(), "100");
  assert.equal(page.$$("#detailed-review-list > div").length, 25);
  await page.clock.advance(700);
  assert.equal(page.downloads.length, 1);

  const stored = pending(page);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].key, PENDING_PREFIX + server.requests[0].payload.attemptId);
  assert.deepEqual(stored[0].payload, server.requests[0].payload);
  assert.equal(JSON.parse(page.storage.getItem(STORAGE_KEY)).delivery.status, "failed");
});

test("Resend Result: the same payload and attemptId, one request, success clears the pending copy", async () => {
  const server = new FakeServer(["network", "network", "network"], "network");
  const page = await submitted({ server });
  await passRetries(page);
  assert.equal(server.count, 3);
  assert.equal(sendStatus(page).state, "failed");
  const id = server.requests[0].payload.attemptId;
  const body = server.requests[0].init.body;

  server.fallback = "ok";
  page.click("#resend-result-btn");
  await settle();
  assert.equal(server.count, 4);
  assert.equal(server.requests[3].payload.attemptId, id);
  assert.equal(server.requests[3].init.body, body);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(sendStatus(page).resendVisible, false);
  assert.equal(pending(page).length, 0);
  assert.equal(server.rows.size, 1);
});

test("two resend clicks or a second submit never produce a second parallel request", async () => {
  const server = new FakeServer(["network", "network", "network"], "network");
  const page = await submitted({ server });
  await passRetries(page);
  assert.equal(server.count, 3);
  const id = server.requests[0].payload.attemptId;

  server.fallback = "ok";
  page.click("#resend-result-btn");
  page.click("#resend-result-btn");
  await settle();
  assert.equal(server.count, 4, "one resend, not two");

  /* A direct second submission is ignored too: same attempt, no new request and no new id. */
  page.run("submitAssessment()");
  await settle();
  assert.equal(server.count, 4);
  assert.equal(JSON.parse(page.storage.getItem(STORAGE_KEY)).delivery.attemptId, id);
});

test("a reply that says duplicate:true is accepted as already stored", async () => {
  const server = new FakeServer(["duplicate"], "duplicate");
  const page = await submitted({ server });
  assert.equal(server.count, 1);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(pending(page).length, 0);
});

test("a non-JSON or rejected reply counts as failure and is retried", async () => {
  for (const bad of ["html", "rejected"]) {
    const server = new FakeServer([bad, bad, bad], bad);
    const page = await submitted({ server });
    await passRetries(page);
    assert.equal(server.count, 3, bad);
    assert.equal(sendStatus(page).state, "failed", bad);
    assert.equal(pending(page).length, 1, bad);
  }
});

test("a connection that never answers is aborted at the 30 s limit, then retried", async () => {
  const server = new FakeServer(["hang"], "hang");
  const page = await submitted({ server });
  assert.equal(server.count, 1);
  await page.clock.advance(29999);
  assert.equal(server.requests[0].aborted, false);
  await page.clock.advance(1);
  await settle();
  assert.equal(server.requests[0].aborted, true, "the first try is aborted at 30 s");
  await page.clock.advance(2000);
  await settle();
  assert.equal(server.count, 2);
  await page.clock.advance(30000);
  await settle();
  assert.equal(server.requests[1].aborted, true);
  await page.clock.advance(5000);
  await settle();
  assert.equal(server.count, 3);
  await page.clock.advance(30000);
  await settle();
  assert.equal(server.requests[2].aborted, true);
  assert.deepEqual(page.clock.timers.filter((timer) => !timer.every), []);
  assert.equal(sendStatus(page).state, "failed");
  assert.equal(pending(page).length, 1);
});

test("a lost reply: the row is stored, the result is kept and a later resend is accepted as duplicate", async () => {
  const server = new FakeServer(["lost-reply", "lost-reply", "lost-reply"], "ok");
  const page = await submitted({ server });
  await passRetries(page);
  assert.equal(server.count, 3);
  assert.equal(server.rows.size, 1, "the teacher's sheet stored the row all three times");
  assert.equal(sendStatus(page).state, "failed");
  assert.equal(pending(page).length, 1);

  page.click("#resend-result-btn");
  await settle();
  assert.equal(server.count, 4);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(pending(page).length, 0);
  assert.equal(server.rows.size, 1);
});

test("reopening the examination resends the pending result once and then stops", async () => {
  const storage = new FakeStorage();
  const failing = new FakeServer(["network", "network", "network"], "network");
  const first = await submitted({ server: failing, storage });
  await passRetries(first);
  assert.equal(sendStatus(first).state, "failed");
  const id = failing.requests[0].payload.attemptId;
  assert.equal(pending(first).length, 1);
  first.close();

  /* Opening the same device again: the stored result is sent quietly and removed. */
  const server = new FakeServer();
  const reopened = await open({ storage, server });
  await settle();
  assert.equal(server.count, 1);
  assert.equal(server.requests[0].payload.attemptId, id);
  assert.equal(sendStatus(reopened).state, "success");
  assert.equal(reopened.screen(), "results");
  assert.equal(pending(reopened).length, 0);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).delivery.status, "sent");

  /* A further opening sends nothing. */
  const again = await open({ storage, server: new FakeServer() });
  await settle();
  assert.equal(again.server.count, 0);
  assert.equal(sendStatus(again).state, "success");
  assert.equal(pending(again).length, 0);
});

test("a pending result is retried even when the results screen is not the current attempt", async () => {
  /* An earlier attempt failed; the student pressed Try Again and started a new attempt on
     another device? Not possible on one device — but the stored copy must still be sent when
     the page opens, whatever the current attempt is. */
  const storage = new FakeStorage();
  const failing = new FakeServer(["network", "network", "network"], "network");
  const first = await submitted({ server: failing, storage });
  await passRetries(first);
  const id = failing.requests[0].payload.attemptId;
  first.close();
  storage.removeItem(STORAGE_KEY); /* the attempt record is gone; the pending payload is not */
  const server = new FakeServer();
  const reopened = await open({ storage, server });
  await settle();
  assert.equal(server.count, 1);
  assert.equal(server.requests[0].payload.attemptId, id);
  assert.equal(pending(reopened).length, 0);
});

test("storage full or disabled: the result and report still work, and the failure is still shown", async () => {
  const storage = new FakeStorage();
  storage.failWrites = true;
  const server = new FakeServer(["network", "network", "network"], "network");
  const page = await submitted({ server, storage });
  await passRetries(page);
  assert.equal(page.screen(), "results");
  assert.equal(page.$$("#detailed-review-list > div").length, 25);
  assert.equal(sendStatus(page).state, "failed");
  assert.equal(page.storage.keys(PENDING_PREFIX).length, 0, "storage refused the writes");
  assert.equal(page.pageErrors.length, 0);
});

test("a stored pending payload with a different examination id is left alone", async () => {
  const storage = new FakeStorage();
  storage.setItem("pending:grade1-other-exam:abc", JSON.stringify({ attemptId: "abc", examId: "grade1-other-exam" }));
  const server = new FakeServer();
  const page = await open({ storage, server });
  await settle();
  assert.equal(server.count, 0);
  assert.ok(page.storage.getItem("pending:grade1-other-exam:abc"), "another examination's result is not touched");
});

test("closing the page while a send is in flight stores the payload at once", async () => {
  const server = new FakeServer(["hang"], "hang");
  const page = await submitted({ server });
  assert.equal(server.count, 1);
  assert.equal(pending(page).length, 0);
  page.window.dispatchEvent(new page.window.Event("pagehide"));
  const stored = pending(page);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].payload.attemptId, server.requests[0].payload.attemptId);
  assert.deepEqual(stored[0].payload, server.requests[0].payload);
});

test("Resend Result does nothing unless the last send failed", async () => {
  const server = new FakeServer();
  const page = await submitted({ server });
  assert.equal(sendStatus(page).state, "success");
  page.run("resendResult()");
  await settle();
  assert.equal(server.count, 1);
  assert.equal(sendStatus(page).state, "success");
});

test("the result of a failed attempt is not sent twice after a refresh", async () => {
  const storage = new FakeStorage();
  const failing = new FakeServer(["network", "network", "network"], "network");
  const first = await submitted({ server: failing, storage });
  await passRetries(first);
  const server = new FakeServer();
  const reopened = await open({ storage, server });
  await settle();
  assert.equal(server.count, 1);
  await settle();
  const again = await open({ storage, server: new FakeServer() });
  await settle();
  assert.equal(again.server.count, 0);
});

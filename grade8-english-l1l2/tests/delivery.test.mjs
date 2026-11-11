/**
 * Delivery of the result to the teacher: one POST (text/plain), 30 s limit per try, 3 tries with
 * waits of 2 s and 5 s, the same attemptId on every re-send, failed results kept in localStorage
 * under pending:<EXAM_ID>:<attemptId> and sent again when the examination is opened — and none of
 * it ever stands between the student and the results.
 *
 * No real request is made and no real time passes: the server and the clock are test doubles.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { Clock, FakeServer, FakeStorage, loadExam, makeAnswerSheets, sendStatus, settle, takeExam } from "./harness.mjs";

const PREFIX = "pending:grade8-english-l1l2:";
const SESSION_KEY = "g8_english_u1_l1_l2_exam_v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A page with its own storage and clock, and a server following `plan`. */
function setup(plan = [], fallback = "ok", extra = {}) {
  const server = new FakeServer({ plan, fallback });
  const storage = extra.storage === undefined ? new FakeStorage() : extra.storage;
  const clock = extra.clock || new Clock();
  const page = loadExam({ fetch: server.fetch, storage, clock, crypto: extra.crypto });
  return { server, storage, clock, page };
}
/** Opens the examination again in the same browser (same storage, same clock). */
function reopen(previous, plan = [], fallback = "ok") {
  const server = new FakeServer({ plan, fallback });
  server.rows = previous.server.rows; // the teacher's sheet outlives the page
  const page = loadExam({ fetch: server.fetch, storage: previous.storage, clock: previous.clock });
  return { server, storage: previous.storage, clock: previous.clock, page };
}
const pendingKeys = storage => storage.keys().filter(key => key.startsWith("pending:"));
const resultsVisible = page => !page.el("results-screen").hidden && page.el("welcome-screen").hidden;

test("a confirmed result: one POST, text/plain, success message, nothing left pending", async () => {
  const run = setup();
  assert.equal(sendStatus(run.page).visible, false, "no delivery message before submission");
  await takeExam(run.page, { name: "Lina Saleh" });

  assert.equal(run.server.requests.length, 1);
  const { url, init, body } = run.server.requests[0];
  assert.equal(url, run.page.json("SHEETS_URL"));
  assert.match(url, /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
  assert.equal(init.method, "POST");
  assert.equal(JSON.stringify(init.headers), '{"Content-Type":"text/plain;charset=utf-8"}');
  assert.equal(init.redirect, "follow");
  assert.ok(init.signal, "the request can be aborted when the time limit passes");
  assert.equal(body.studentName, "Lina Saleh");

  assert.deepEqual(sendStatus(run.page), {
    status: "success", visible: true,
    text: "Your result was sent to your teacher ✓", arabic: "تم إرسال نتيجتك إلى معلّمك ✓",
    resendVisible: false,
  });
  assert.deepEqual(pendingKeys(run.storage), []);
  assert.deepEqual(run.page.state().delivery, { attemptId: body.attemptId, status: "sent" });
  assert.equal(run.server.rows.size, 1);
  // No timer is left behind: neither a retry nor the 30 s limit.
  assert.ok(!run.clock.pendingDelays().some(delay => delay >= 2000 && delay <= 30000 && [2000, 5000, 30000].includes(Math.round(delay))));
});

test("while the request is in flight the student already has the results and the TXT file", async () => {
  const run = setup(["held"]);
  await takeExam(run.page);
  assert.deepEqual(sendStatus(run.page), {
    status: "sending", visible: true,
    text: "Sending your result to your teacher…", arabic: "جارٍ إرسال النتيجة…",
    resendVisible: false,
  });
  assert.ok(resultsVisible(run.page));
  assert.equal(run.page.el("results-score").textContent, "100");
  assert.equal(run.page.host.downloads.length, 1);
  assert.equal(run.page.state().delivery.status, "pending");
  await run.server.release();
  assert.equal(sendStatus(run.page).status, "success");
});

test("a failed try is repeated after 2 s, then after 5 s — three tries, same body each time", async () => {
  const run = setup(["offline", "html", "ok"]);
  await takeExam(run.page);
  assert.equal(run.server.requests.length, 1);
  assert.equal(sendStatus(run.page).status, "sending");

  await run.clock.advance(1999);
  assert.equal(run.server.requests.length, 1, "the second try waits a full 2 s");
  await run.clock.advance(1);
  assert.equal(run.server.requests.length, 2);
  assert.equal(sendStatus(run.page).status, "sending");

  await run.clock.advance(4999);
  assert.equal(run.server.requests.length, 2, "the third try waits a full 5 s");
  await run.clock.advance(1);
  assert.equal(run.server.requests.length, 3);

  assert.equal(sendStatus(run.page).status, "success");
  const bodies = run.server.requests.map(request => request.init.body);
  assert.equal(bodies[1], bodies[0]);
  assert.equal(bodies[2], bodies[0]);
  assert.equal(new Set(run.server.ids()).size, 1);
  assert.equal(run.server.rows.size, 1);
  assert.deepEqual(pendingKeys(run.storage), []);
  assert.deepEqual(run.clock.requested.filter(delay => delay === 2000 || delay === 5000), [2000, 5000]);
});

test("each try is given 30 s; after three silent tries the result is kept and the student is told", async () => {
  const run = setup([], "hang");
  await takeExam(run.page);
  assert.equal(run.server.requests.length, 1);

  await run.clock.advance(29999);
  assert.equal(run.server.aborted, 0, "a try is not abandoned before 30 s");
  assert.equal(sendStatus(run.page).status, "sending");
  await run.clock.advance(1);
  assert.equal(run.server.aborted, 1, "the silent request is aborted at 30 s");
  assert.equal(run.server.requests.length, 1);

  await run.clock.advance(2000);
  assert.equal(run.server.requests.length, 2);
  await run.clock.advance(30000);
  assert.equal(run.server.aborted, 2);
  await run.clock.advance(5000);
  assert.equal(run.server.requests.length, 3);
  assert.equal(sendStatus(run.page).status, "sending");
  await run.clock.advance(30000);
  assert.equal(run.server.aborted, 3);

  // Three tries and no more, however long we wait.
  await run.clock.advance(600000);
  assert.equal(run.server.requests.length, 3);
  assert.equal(run.clock.requested.filter(delay => delay === 30000).length, 3);

  assert.deepEqual(sendStatus(run.page), {
    status: "failed", visible: true,
    text: "Your result could not be sent. Download the TXT report and send it to your teacher.",
    arabic: "تعذّر إرسال النتيجة. حمّل ملف التقرير وأرسله لمعلّمك.",
    resendVisible: true,
  });
  const attemptId = run.server.ids()[0];
  assert.match(attemptId, UUID);
  assert.deepEqual(pendingKeys(run.storage), [PREFIX + attemptId]);
  assert.equal(run.storage.getItem(PREFIX + attemptId), run.server.requests[0].init.body, "the stored payload is the one that was sent");
  assert.equal(run.page.state().delivery.status, "failed");

  // The failure cost the student nothing.
  assert.ok(resultsVisible(run.page));
  assert.equal(run.page.el("results-score").textContent, "100");
  assert.equal(run.page.host.downloads.length, 1);
  run.page.el("download-report-btn").click();
  assert.equal(run.page.host.downloads.length, 2, "the TXT report can still be downloaded by hand");
});

test("replies that are not a confirmation count as failures", async () => {
  const run = setup(["refused", "html", "refused"]);
  await takeExam(run.page);
  await run.clock.advance(2000);
  await run.clock.advance(5000);
  assert.equal(run.server.requests.length, 3);
  assert.equal(sendStatus(run.page).status, "failed");
  assert.equal(pendingKeys(run.storage).length, 1);
});

test("“Resend Result” sends the same payload again and is not “Try Again”", async () => {
  const run = setup(["offline", "offline", "offline", "offline", "offline", "offline"]);
  await takeExam(run.page, { answers: makeAnswerSheets(run.page.json("QUESTIONS"))[9].answers });
  await run.clock.advance(7000);
  assert.equal(sendStatus(run.page).status, "failed");
  const before = run.page.state();
  const firstBody = run.server.requests[0].init.body;

  const resend = run.page.el("resend-result-btn");
  const tryAgain = run.page.el("try-again-btn");
  assert.notEqual(resend, tryAgain);
  assert.equal(resend.listeners.get("click").length, 1);
  assert.equal(tryAgain.listeners.get("click").length, 1);
  assert.notEqual(resend.listeners.get("click")[0], tryAgain.listeners.get("click")[0]);

  // A second failed round: still the same attempt, still stored once.
  resend.click();
  await settle();
  assert.equal(sendStatus(run.page).status, "sending");
  assert.equal(sendStatus(run.page).resendVisible, false);
  await run.clock.advance(7000);
  assert.equal(run.server.requests.length, 6);
  assert.equal(sendStatus(run.page).status, "failed");
  assert.equal(pendingKeys(run.storage).length, 1);

  // Third round: the network is back.
  resend.click();
  await settle();
  assert.equal(run.server.requests.length, 7);
  assert.equal(sendStatus(run.page).status, "success");
  assert.equal(run.server.requests[6].init.body, firstBody, "same payload, byte for byte");
  assert.equal(new Set(run.server.ids()).size, 1, "one attemptId across all seven requests");
  assert.equal(run.server.rows.size, 1);
  assert.deepEqual(pendingKeys(run.storage), []);

  // The attempt itself was not touched: same student, same answers, same marks, still on the results screen.
  const after = run.page.state();
  assert.equal(after.attemptId, before.attemptId);
  assert.equal(after.status, "submitted");
  assert.deepEqual(after.answers, before.answers);
  assert.deepEqual(after.result, before.result);
  assert.ok(resultsVisible(run.page));
  assert.equal(run.page.host.downloads.length, 1, "re-sending does not download the report again");
});

test("a result is never sent twice in parallel", async () => {
  const run = setup(["offline", "offline", "offline", "held"]);
  await takeExam(run.page);
  await run.clock.advance(7000);
  assert.equal(sendStatus(run.page).status, "failed");
  // Impatient clicks, plus the functions called directly while a delivery is running.
  run.page.el("resend-result-btn").click();
  run.page.el("resend-result-btn").click();
  run.page.run("resendResult(); retryPending(); retryPending();");
  await settle();
  assert.equal(run.server.requests.length, 4, "only one new request");
  await run.server.release();
  assert.equal(run.server.requests.length, 4);
  assert.equal(sendStatus(run.page).status, "success");
  assert.equal(run.server.rows.size, 1);
  assert.deepEqual(pendingKeys(run.storage), []);
});

test("if the server stored the result but its reply was lost, the re-send is recognised as a duplicate", async () => {
  const run = setup(["lost-reply"]);
  await takeExam(run.page);
  assert.equal(run.server.rows.size, 1);
  assert.equal(sendStatus(run.page).status, "sending");
  await run.clock.advance(2000);
  assert.equal(run.server.requests.length, 2);
  assert.equal(run.server.ids()[0], run.server.ids()[1]);
  assert.equal(run.server.rows.size, 1, "still one row on the teacher's side");
  assert.equal(sendStatus(run.page).status, "success");
  assert.deepEqual(pendingKeys(run.storage), []);
});

test("a duplicate:true reply alone is accepted as delivered", async () => {
  const run = setup();
  run.server.fetch = () => Promise.resolve({ text: () => Promise.resolve('{"duplicate":true}') });
  const page = loadExam({ fetch: run.server.fetch, storage: run.storage, clock: run.clock });
  await takeExam(page);
  assert.equal(sendStatus(page).status, "success");
});

test("a stored result is sent when the examination is opened again — once, with the same attemptId", async () => {
  const first = setup([], "offline");
  await takeExam(first.page, { name: "Rami Khoury" });
  await first.clock.advance(7000);
  assert.equal(sendStatus(first.page).status, "failed");
  const attemptId = first.server.ids()[0];
  const sentBody = first.server.requests[0].init.body;
  assert.deepEqual(pendingKeys(first.storage), [PREFIX + attemptId]);

  const second = reopen(first);
  await settle();
  assert.ok(resultsVisible(second.page), "the submitted attempt is restored to the results screen");
  assert.equal(second.server.requests.length, 1, "exactly one request on reopening");
  assert.equal(second.server.requests[0].init.body, sentBody);
  assert.equal(second.server.ids()[0], attemptId);
  assert.equal(sendStatus(second.page).status, "success");
  assert.deepEqual(pendingKeys(second.storage), []);
  assert.equal(second.page.state().delivery.status, "sent");
  assert.equal(second.page.host.downloads.length, 0, "reopening does not download the report again");

  // Opening a third time sends nothing more.
  const third = reopen(second);
  await settle();
  assert.equal(third.server.requests.length, 0);
  assert.equal(sendStatus(third.page).status, "success");
  assert.equal(third.server.rows.size, 1);
});

test("reopening while still offline keeps the result stored and offers the resend button again", async () => {
  const first = setup([], "offline");
  await takeExam(first.page);
  await first.clock.advance(7000);
  const attemptId = first.server.ids()[0];

  const second = reopen(first, [], "offline");
  await settle();
  assert.equal(sendStatus(second.page).status, "sending");
  await second.clock.advance(7000);
  assert.equal(second.server.requests.length, 3);
  assert.equal(sendStatus(second.page).status, "failed");
  assert.deepEqual(pendingKeys(second.storage), [PREFIX + attemptId]);
  assert.deepEqual(new Set(second.server.ids()), new Set([attemptId]));
});

test("a result still being sent when the page is closed is stored, then delivered on the next visit", async () => {
  const first = setup([], "hang");
  await takeExam(first.page);
  assert.deepEqual(pendingKeys(first.storage), [], "nothing is stored while there is no reason to");
  await first.page.leavePage();
  const attemptId = first.server.ids()[0];
  assert.deepEqual(pendingKeys(first.storage), [PREFIX + attemptId]);

  const second = reopen(first);
  await settle();
  assert.equal(second.server.requests.length, 1);
  assert.equal(second.server.ids()[0], attemptId);
  assert.equal(sendStatus(second.page).status, "success");
  assert.deepEqual(pendingKeys(second.storage), []);
});

test("a result confirmed after the tab was hidden is removed from storage", async () => {
  const run = setup(["held"]);
  await takeExam(run.page);
  await run.page.leavePage();
  assert.equal(pendingKeys(run.storage).length, 1);
  await run.server.release();
  assert.deepEqual(pendingKeys(run.storage), []);
  assert.equal(sendStatus(run.page).status, "success");
});

test("“Try Again” after a failure: the old result stays stored and is delivered on the next visit", async () => {
  const first = setup([], "offline");
  await takeExam(first.page, { name: "First Attempt" });
  await first.clock.advance(7000);
  const firstId = first.server.ids()[0];

  first.page.el("try-again-btn").click();
  assert.equal(sendStatus(first.page).visible, false, "the new attempt starts with no delivery message");
  assert.ok(!first.page.el("welcome-screen").hidden);
  assert.equal(first.storage.getItem(SESSION_KEY), null);
  assert.deepEqual(pendingKeys(first.storage), [PREFIX + firstId], "Try Again does not discard the undelivered result");
  assert.equal(first.server.requests.length, 3, "Try Again sends nothing");

  const second = reopen(first);
  await settle();
  assert.ok(!second.page.el("welcome-screen").hidden);
  assert.equal(second.server.requests.length, 1);
  assert.equal(second.server.ids()[0], firstId);
  assert.equal(second.server.requests[0].body.studentName, "First Attempt");
  assert.deepEqual(pendingKeys(second.storage), []);
  assert.equal(sendStatus(second.page).visible, false, "the welcome screen shows no delivery message");

  // A second attempt is a different attempt.
  await takeExam(second.page, { name: "Second Attempt" });
  assert.equal(second.server.requests.length, 2);
  const secondId = second.server.ids()[1];
  assert.notEqual(secondId, firstId);
  assert.equal(second.server.rows.size, 2);
  assert.equal(sendStatus(second.page).status, "success");
});

test("“Try Again” while a result is being sent: the delivery finishes in the background", async () => {
  const run = setup(["held"]);
  await takeExam(run.page);
  run.page.el("try-again-btn").click();
  assert.equal(sendStatus(run.page).visible, false);
  await run.server.release();
  assert.equal(run.server.rows.size, 1);
  assert.equal(sendStatus(run.page).visible, false, "the finished delivery does not write on the new attempt's screen");
  assert.equal(run.page.state(), null);
  assert.deepEqual(pendingKeys(run.storage), []);
});

test("several stored results are all delivered; other examinations' entries and broken entries are left alone", async () => {
  const storage = new FakeStorage();
  const clock = new Clock();
  const ids = [];
  for (const name of ["One", "Two", "Three"]) {
    const server = new FakeServer({ fallback: "offline" });
    const page = loadExam({ fetch: server.fetch, storage, clock });
    await takeExam(page, { name });
    await clock.advance(7000);
    ids.push(page.state().delivery.attemptId);
    page.el("try-again-btn").click();
  }
  assert.equal(new Set(ids).size, 3);
  storage.setItem("pending:grade5-math-unit1:other-exam", JSON.stringify({ attemptId: "other-exam", token: "x" }));
  storage.setItem(PREFIX + "broken", "{not json");
  storage.setItem(PREFIX + "array", "[1,2]");
  const stale = JSON.parse(storage.getItem(PREFIX + ids[0]));
  storage.setItem(PREFIX + ids[0], JSON.stringify(Object.assign(stale, { token: "token-of-an-older-copy" })));

  const server = new FakeServer();
  const page = loadExam({ fetch: server.fetch, storage, clock });
  await settle();
  assert.deepEqual(server.ids().slice().sort(), ids.slice().sort());
  assert.deepEqual(server.requests.map(request => request.body.studentName).sort(), ["One", "Three", "Two"]);
  assert.ok(server.requests.every(request => request.body.token === page.json("SHEETS_TOKEN")), "stored results are sent with the current token");
  assert.deepEqual(pendingKeys(storage).sort(), ["pending:grade5-math-unit1:other-exam", PREFIX + "array", PREFIX + "broken"].sort());
  assert.equal(await page.run("retryPending()"), 0, "nothing deliverable is left");
});

test("without localStorage the result is still shown and still sent", async () => {
  const run = setup([], "ok", { storage: null });
  await takeExam(run.page);
  assert.ok(resultsVisible(run.page));
  assert.equal(run.server.requests.length, 1);
  assert.equal(sendStatus(run.page).status, "success");
});

test("with storage failing and the network down, the student still gets results, the TXT file and the resend button", async () => {
  const storage = new FakeStorage();
  storage.broken = true;
  const run = setup([], "offline", { storage });
  await takeExam(run.page);
  await run.clock.advance(7000);
  assert.ok(resultsVisible(run.page));
  assert.equal(run.page.el("results-score").textContent, "100");
  assert.equal(run.page.host.downloads.length, 1);
  assert.equal(sendStatus(run.page).status, "failed");
  assert.equal(sendStatus(run.page).resendVisible, true);
  run.server.fallback = "ok";
  run.page.el("resend-result-btn").click();
  await settle();
  assert.equal(sendStatus(run.page).status, "success");
  assert.equal(new Set(run.server.ids()).size, 1);
});

test("if fetch itself is missing or throws, the result page is unaffected and the result is stored", async () => {
  const storage = new FakeStorage();
  const clock = new Clock();
  const page = loadExam({ fetch: () => { throw new Error("blocked"); }, storage, clock });
  await takeExam(page);
  await clock.advance(7000);
  assert.ok(resultsVisible(page));
  assert.equal(sendStatus(page).status, "failed");
  assert.equal(pendingKeys(storage).length, 1);
});

test("attemptId: a UUID, new for every attempt, kept for every re-send of the same attempt", async () => {
  const run = setup();
  const many = run.page.json("Array.from({ length: 3000 }, () => newAttemptId())");
  assert.equal(new Set(many).size, 3000);
  for (const id of many.slice(0, 50)) assert.match(id, UUID);

  await takeExam(run.page, { name: "Ali Nasser" });
  const state = run.page.state();
  assert.equal(run.server.ids()[0], state.delivery.attemptId);
  assert.match(state.delivery.attemptId, UUID);
  // The short code shown on screen and in the report is a different thing and is left as it was.
  assert.match(state.attemptId, /^G8-U1-\d{8}-[0-9A-Z]{5}$/);
  assert.equal(run.page.el("results-attempt-id").textContent, state.attemptId);

  run.page.el("try-again-btn").click();
  await takeExam(run.page, { name: "Ali Nasser" });
  assert.equal(run.server.requests.length, 2);
  assert.notEqual(run.server.ids()[1], run.server.ids()[0], "same student, same answers, new attempt → new attemptId");
});

test("attemptId falls back to time + random text where crypto.randomUUID is unavailable", async () => {
  for (const crypto of [null, {}, { get randomUUID() { throw new Error("insecure context"); } }]) {
    const run = setup([], "ok", { crypto });
    const many = run.page.json("Array.from({ length: 2000 }, () => newAttemptId())");
    assert.equal(new Set(many).size, 2000);
    for (const id of many.slice(0, 50)) assert.match(id, /^\d{13}-[a-z0-9]{8,16}$/);
    await takeExam(run.page);
    assert.equal(sendStatus(run.page).status, "success");
    assert.equal(run.server.ids()[0], run.page.state().delivery.attemptId);
  }
});

test("nothing about the student is written to the console, and the default network is never touched", async () => {
  const run = setup(["offline", "html", "refused"]);
  await takeExam(run.page, { name: "Private Student Name" });
  await run.clock.advance(7000);
  const logged = run.page.host.consoleCalls.map(call => call.text).join("\n");
  assert.ok(!logged.includes("Private Student Name"));
  assert.ok(!logged.includes(run.page.json("SHEETS_TOKEN")));
  assert.ok(!logged.includes(run.server.ids()[0]));
  assert.equal(run.page.host.unexpectedFetches, 0);
});

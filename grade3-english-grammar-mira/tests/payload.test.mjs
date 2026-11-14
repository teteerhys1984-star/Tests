/**
 * The payload sent to the teacher's sheet: the same contract as the other examinations of the
 * site (reference: grade5-math-unit1/src/exam/submit.ts) — field names, their order and types —
 * with every number taken from the page's own marking result.
 *
 * Nothing here touches the network: the page's fetch is a stand-in (harness FakeServer).
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  EXAM_DIR_NAME, FIXED_META, FakeServer, SHEETS_TOKEN, SHEETS_URL, SOURCE_HTML, correctAnswer, gradeOne, makeSheets, openExam,
  partsOf, sendStatus, settle, sheetOf, submitExamInUi,
} from "./harness.mjs";

const TOP_KEYS = ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "elapsedSec", "summary", "lessons", "details", "reportText"];
const SUMMARY_KEYS = ["total", "max", "percentage", "gradeLabel", "fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"];
const LESSON_KEYS = ["title", "awarded", "max"];
const DETAIL_KEYS = ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"];
const STATUSES = ["Correct", "Incorrect", "Unanswered"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let page;
let sheets;

before(async () => {
  page = await openExam({ file: SOURCE_HTML });
  sheets = makeSheets(page.questions);
});

after(() => page.close());

/** Marks the sheet with the page's own engine, then asks the page for the payload of that attempt. */
function payloadOf(sheet, meta = {}) {
  const m = { ...FIXED_META, ...meta };
  return page.json(`(() => {
    state = {
      studentName: ${JSON.stringify(m.name)}, started: true, submitted: true,
      startTime: ${m.startedAt}, submissionTime: ${m.startedAt + m.elapsedMs},
      currentQ: 1, answers: ${JSON.stringify(sheet.answers)}, scrambleState: {}, delivery: null
    };
    return buildSubmissionPayload("attempt-test-1");
  })()`);
}

/** The result the page shows for the same sheet. */
function resultOf(sheet, meta = {}) {
  const m = { ...FIXED_META, ...meta };
  return page.json(`(() => {
    state = {
      studentName: ${JSON.stringify(m.name)}, started: true, submitted: true,
      startTime: ${m.startedAt}, submissionTime: ${m.startedAt + m.elapsedMs},
      currentQ: 1, answers: ${JSON.stringify(sheet.answers)}, scrambleState: {}, delivery: null
    };
    return evaluateStudent();
  })()`);
}

/** The value a sheet holds for part i of a question. */
function givenPart(q, value, i) {
  if (q.type === "mcq" || q.type === "scramble") return value;
  const key = q.type === "svo_tag" ? q.parts[i].key : q.subparts[i].key;
  return value && typeof value === "object" ? value[key] : undefined;
}

test("the payload has the contract's fields, in order, with the fixed token and examination identity", async () => {
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  await submitExamInUi(ui, { answers: sheets.find((sheet) => sheet.name === "complete-003").answers, name: "  Mira Ahmed  " });
  assert.equal(server.count, 1);
  const request = server.requests[0];
  const payload = request.payload;
  assert.deepEqual(Object.keys(payload), TOP_KEYS);
  assert.deepEqual(Object.keys(payload.summary), SUMMARY_KEYS);
  for (const row of payload.lessons) assert.deepEqual(Object.keys(row), LESSON_KEYS);
  for (const row of payload.details) assert.deepEqual(Object.keys(row), DETAIL_KEYS);
  assert.equal(payload.token, SHEETS_TOKEN);
  assert.equal(payload.examId, EXAM_DIR_NAME);
  assert.equal(payload.examTitle, "English Grammar Mira");
  assert.equal(payload.examTitle, ui.document.title);
  assert.equal(payload.studentName, "Mira Ahmed", "the name as typed (trimmed), as the page shows it");
  assert.equal(payload.studentName, ui.text("#res-student-name"));
  assert.equal(request.url, SHEETS_URL);
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers["Content-Type"], "text/plain;charset=utf-8");
  assert.equal(request.init.body, JSON.stringify(payload));
  assert.match(payload.attemptId, UUID);
  assert.match(payload.startAt, ISO);
  assert.match(payload.submitAt, ISO);
  ui.close();
});

test("types and values are well formed on 101 sheets; every number comes from the marking result", () => {
  const walk = (value, trail) => {
    assert.notEqual(value, null, trail);
    assert.notEqual(value, undefined, trail);
    if (typeof value === "string") assert.notEqual(value.trim(), "", trail + " is empty");
    if (typeof value === "number") assert.ok(Number.isFinite(value), trail);
    if (Array.isArray(value)) value.forEach((item, i) => walk(item, trail + "[" + i + "]"));
    else if (typeof value === "object") for (const [key, item] of Object.entries(value)) walk(item, trail + "." + key);
  };
  for (const sheet of sheets) {
    const payload = payloadOf(sheet);
    const result = resultOf(sheet);
    assert.deepEqual(Object.keys(payload), TOP_KEYS, sheet.name);
    assert.equal(payload.examId, EXAM_DIR_NAME);
    assert.equal(payload.summary.max, 100);
    assert.equal(payload.summary.total, result.score, sheet.name);
    assert.equal(payload.summary.percentage, result.percentage, sheet.name);
    assert.equal(payload.summary.fullQuestions, result.correctCount, sheet.name);
    assert.equal(payload.summary.fullQuestions + payload.summary.partialQuestions + payload.summary.wrongQuestions, 25, sheet.name);
    assert.equal(payload.summary.correctSubparts + payload.summary.partialSubparts + payload.summary.wrongSubparts + payload.summary.unansweredSubparts, 30, sheet.name);
    assert.equal(payload.summary.partialSubparts, 0, "every part of this paper is either right or wrong");
    assert.equal(typeof payload.summary.gradeLabel, "string");
    assert.ok(["Outstanding", "Great Job", "Good Effort", "Keep Practicing"].includes(payload.summary.gradeLabel));
    assert.deepEqual(payload.lessons.map((row) => row.title), [
      "Lesson 1 — Sentence Structure", "Lesson 2 — Pronouns & Verb to be", "Lesson 3 — Verb to be",
      "Lesson 4 — Nouns & Articles", "Lesson 5 — Adjectives", "Lesson 16 — Possessive Adjectives",
    ]);
    assert.equal(payload.lessons.reduce((sum, row) => sum + row.max, 0), 100);
    const lessonSum = payload.lessons.reduce((sum, row) => sum + row.awarded, 0);
    assert.ok(Math.abs(lessonSum - result.reviews.reduce((sum, review) => sum + review.earned, 0)) < 1e-9, sheet.name);
    assert.equal(Math.round(lessonSum), result.score, "the lesson totals add up to the score shown");
    for (const key of SUMMARY_KEYS) assert.equal(typeof payload.summary[key], key === "gradeLabel" ? "string" : "number", key);
    for (const row of payload.lessons) assert.ok(Number.isFinite(row.awarded) && Number.isFinite(row.max));
    for (const row of payload.details) {
      assert.ok(Number.isInteger(row.q) && row.q >= 1 && row.q <= 25);
      assert.match(row.label, /^[a-c]$/);
      assert.ok(STATUSES.includes(row.status), row.status);
      assert.ok(Number.isFinite(row.awarded) && Number.isFinite(row.marks));
      assert.match(row.lessons, /^Lesson \d+ — /);
      assert.ok(row.qTitle.length > 0);
    }
    walk(payload, sheet.name);
    assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload);
  }
});

test("one detail row per marked part, in the order of the paper, adding up to the question's marks", () => {
  for (const sheet of sheets.slice(0, 40)) {
    const payload = payloadOf(sheet);
    const result = resultOf(sheet);
    let at = 0;
    const counted = { Correct: 0, Incorrect: 0, Unanswered: 0 };
    page.questions.forEach((q, index) => {
      const review = result.reviews[index];
      const parts = partsOf(q);
      const rows = payload.details.slice(at, at + parts.length);
      at += parts.length;
      assert.equal(rows.length, parts.length, `Q${q.id}`);
      assert.equal(rows.reduce((sum, row) => sum + row.marks, 0), 4, `Q${q.id} marks`);
      const rowsAwarded = rows.reduce((sum, row) => sum + row.awarded, 0);
      assert.ok(Math.abs(rowsAwarded - review.earned) < 0.05, `${sheet.name} Q${q.id}: ${rowsAwarded} vs ${review.earned}`);
      rows.forEach((row, i) => {
        const given = givenPart(q, sheet.answers[q.id], i);
        const expected = given === undefined || given === null || given === "" ? "Unanswered" : row.status;
        assert.equal(row.q, q.id);
        assert.equal(row.label, "abc"[i]);
        assert.equal(row.qTitle, review.prompt);
        assert.equal(row.lessons, review.lessonTitle.replace(": ", " — "));
        assert.equal(row.studentAnswer === "No answer", expected === "Unanswered", `${sheet.name} Q${q.id}${row.label}`);
        if (expected === "Unanswered") assert.equal(row.awarded, 0);
        else {
          /* A part is right exactly when its student text is the correct text. */
          assert.equal(row.status, row.studentAnswer === row.correctAnswer ? "Correct" : "Incorrect", `${sheet.name} Q${q.id}${row.label}`);
          assert.equal(row.awarded, row.status === "Correct" ? row.marks : 0);
        }
        counted[expected] += 1;
      });
    });
    assert.equal(at, 30);
    const s = payload.summary;
    assert.equal(s.correctSubparts + s.wrongSubparts + s.unansweredSubparts, 30);
    assert.equal(s.correctSubparts, counted.Correct, sheet.name);
    assert.equal(s.wrongSubparts, counted.Incorrect, sheet.name);
    assert.equal(s.unansweredSubparts, counted.Unanswered, sheet.name);
  }
});

test("blank and perfect papers read as the page shows them", () => {
  const blank = payloadOf({ answers: {} });
  assert.equal(blank.summary.total, 0);
  assert.equal(blank.summary.percentage, 0);
  assert.equal(blank.summary.gradeLabel, "Keep Practicing");
  assert.equal(blank.summary.fullQuestions, 0);
  assert.equal(blank.summary.partialQuestions, 0);
  assert.equal(blank.summary.wrongQuestions, 25);
  assert.equal(blank.summary.unansweredSubparts, 30);
  assert.ok(blank.details.every((row) => row.status === "Unanswered" && row.studentAnswer === "No answer"));

  const perfect = payloadOf({ answers: sheetOf(page.questions, correctAnswer) });
  assert.equal(perfect.summary.total, 100);
  assert.equal(perfect.summary.percentage, 100);
  assert.equal(perfect.summary.gradeLabel, "Outstanding");
  assert.equal(perfect.summary.fullQuestions, 25);
  assert.equal(perfect.summary.correctSubparts, 30);
  assert.equal(perfect.summary.wrongSubparts, 0);
  assert.ok(perfect.details.every((row) => row.status === "Correct"));
  assert.equal(perfect.details.reduce((sum, row) => sum + row.awarded, 0), 100);
});

test("a partially correct multi-part answer is reported part by part, and the score is the page's rounded total", () => {
  const q1 = page.questions[0];
  const sheet = { answers: { 1: { p1: "Subject", p2: "Verb", p3: "Verb" } } };
  const payload = payloadOf(sheet);
  const result = resultOf(sheet);
  assert.equal(payload.details.length, 30);
  assert.deepEqual(payload.details.slice(0, 3).map((row) => row.status), ["Correct", "Correct", "Incorrect"]);
  assert.equal(payload.summary.total, result.score);
  assert.equal(payload.summary.total, 3, "one question is partly right, the rest are unanswered");
  assert.equal(payload.summary.partialQuestions, 1);
  assert.equal(payload.summary.fullQuestions, 0);
  assert.equal(payload.summary.wrongQuestions, 24);
  assert.equal(payload.details.slice(0, 3).reduce((sum, row) => sum + row.awarded, 0), 4 * (2 / 3));
  assert.equal(gradeOne(page, q1.id, sheet.answers[1]), 2.7);
});

test("elapsedSec is whole seconds, rounded down like the time shown on the results screen", () => {
  const sheet = sheets.find((item) => item.name === "all-correct");
  for (const [elapsedMs, seconds, shown] of [[59999, 59, "00:00:59"], [60000, 60, "00:01:00"], [999, 0, "00:00:00"], [3723500, 3723, "01:02:03"]]) {
    const payload = payloadOf(sheet, { elapsedMs });
    assert.equal(payload.elapsedSec, seconds);
    assert.equal(page.run(`formatDuration(${elapsedMs})`), shown);
    assert.equal(Date.parse(payload.submitAt) - Date.parse(payload.startAt), elapsedMs);
  }
});

test("through the interface: what is sent is the result on screen and the file that was downloaded", async () => {
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  const sheet = sheets.find((item) => item.name === "complete-003");
  await submitExamInUi(ui, { name: "Mira Test", answers: sheet.answers, elapsedMs: 754000 });
  await ui.clock.advance(700);
  assert.equal(server.count, 1);
  const payload = server.requests[0].payload;
  assert.equal(String(payload.summary.total), ui.text("#res-score-marks"));
  assert.equal(`${payload.summary.percentage}%`, ui.text("#res-score-pct"));
  assert.equal(ui.text("#res-performance-level"), "Performance Level: " + payload.summary.gradeLabel);
  assert.equal(payload.elapsedSec, 754);
  assert.equal(ui.text("#res-duration"), "00:12:34");
  assert.equal(payload.startAt, "2026-11-14T07:00:05.250Z");
  assert.equal(payload.submitAt, "2026-11-14T07:12:39.250Z");
  /* The report in the payload is, byte for byte, the downloaded file. */
  assert.equal(ui.downloads.length, 1);
  assert.equal(payload.reportText, await ui.downloadText());
  assert.ok(payload.reportText.startsWith("================================================================================"));
  assert.ok(payload.reportText.includes("Total Score      : " + payload.summary.total + " / 100 Marks (" + payload.summary.percentage + "%)"));
  assert.equal(sendStatus(ui).state, "success");
  ui.close();
});

test("the teacher password, the answer key and the storage keys are never sent", async () => {
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  await submitExamInUi(ui, {});
  const body = server.requests[0].init.body;
  assert.ok(!body.includes("somer173"));
  assert.ok(!/password/i.test(body), "the payload never mentions the teacher password");
  assert.ok(!body.includes("mira_lovely_challenge"));
  assert.ok(!/internal reference|course repository/.test(body));
  /* The correct answers are sent because they are on the results screen and in the report. */
  assert.ok(body.includes(page.questions[0].parts[0].correct));
  ui.close();
});

test("attemptId: unique per submitted attempt, with a fallback when crypto.randomUUID is missing", async () => {
  const ids = new Set();
  for (const crypto of [undefined, null]) {
    const server = new FakeServer();
    const ui = await openExam({ file: SOURCE_HTML, server, crypto });
    await submitExamInUi(ui, {});
    ui.click("button[onclick='tryAgain()']");
    await submitExamInUi(ui, { name: "Second Try" });
    await settle();
    assert.equal(server.count, 2);
    const [first, second] = server.attemptIds();
    assert.notEqual(first, second);
    for (const id of [first, second]) {
      assert.equal(typeof id, "string");
      assert.ok(id.length >= 20, id);
      if (crypto === undefined) assert.match(id, UUID);
      else assert.match(id, /^\d{13}-[0-9a-z]{8,16}$/);
      ids.add(id);
    }
    assert.equal(ui.pageErrors.length, 0);
    ui.close();
  }
  assert.equal(ids.size, 4);
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  await submitExamInUi(ui, { answers: sheetOf(ui.questions, correctAnswer) });
  assert.equal(server.requests[0].payload.summary.total, 100);
  assert.equal(server.requests[0].payload.summary.gradeLabel, "Outstanding");
  ui.close();
});

test("the payload never contains teacher-only or internal fields", () => {
  const payload = payloadOf({ answers: sheetOf(page.questions, correctAnswer) });
  const keys = [];
  const walk = (value) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) { keys.push(key); walk(item); }
  };
  walk(payload);
  for (const forbidden of ["password", "teacherPassword", "answerKey", "key", "internal", "rank", "storageKey", "correctIndex"]) {
    assert.ok(!keys.includes(forbidden), forbidden);
  }
  /* Only the contract's field names appear. */
  const allowed = new Set([...TOP_KEYS, ...SUMMARY_KEYS, ...LESSON_KEYS, ...DETAIL_KEYS]);
  for (const key of keys) assert.ok(allowed.has(key), "unexpected field: " + key);
});

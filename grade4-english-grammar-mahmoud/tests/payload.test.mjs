/**
 * The payload sent to the teacher's sheet: the same contract as the other examinations of the
 * site (reference: grade5-math-unit1/src/exam/submit.ts) — field names, their order and types —
 * with every number taken from the page's own marking result.
 *
 * Nothing here touches the network: the page's fetch is a stand-in (harness FakeServer).
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import {
  EXAM_DIR, EXAM_DIR_NAME, FIXED_META, FakeServer, SHEETS_TOKEN, SHEETS_URL, SOURCE_HTML, answerSpace, correctAnswer, gradeOne, gradeSheet,
  makeSheets, openExam, partsOf, sheetOf, submitExamInUi,
} from "./harness.mjs";

const TOP_KEYS = ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "elapsedSec", "summary", "lessons", "details", "reportText"];
const SUMMARY_KEYS = ["total", "max", "percentage", "gradeLabel", "fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"];
const LESSON_KEYS = ["title", "awarded", "max"];
const DETAIL_KEYS = ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"];
const STATUSES = ["Correct", "Partially correct", "Incorrect", "Unanswered"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let page;
let sheets;

/** Marks the sheet with the page's own engine, then asks the page for the payload of that attempt. */
function payloadOf(sheet, meta) {
  const result = gradeSheet(page, sheet, meta);
  return { result, payload: page.json('buildSubmissionPayload("attempt-under-test")') };
}
/** The value the student gave for part i of a question, or "" (as the page stores answers). */
function givenPart(q, value, i) {
  if (value === undefined || value === null) return "";
  if (q.type === "choice") return typeof value === "string" ? value : "";
  if (q.type === "order") return Array.isArray(value) && value.length === q.tokens.length ? value.join(" ") : "";
  return value[i] || "";
}
function walk(value, visit, trail = "payload") {
  visit(value, trail);
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, visit, `${trail}[${i}]`));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) walk(item, visit, `${trail}.${key}`);
}

before(async () => {
  page = await openExam({ file: SOURCE_HTML });
  sheets = makeSheets(page.questions);
});

test("same address and token as the reference examination; EXAM_ID is the folder name", () => {
  assert.equal(page.run("SHEETS_URL"), SHEETS_URL);
  assert.equal(page.run("SHEETS_TOKEN"), SHEETS_TOKEN);
  assert.equal(page.run("EXAM_ID"), EXAM_DIR_NAME);
  assert.equal(EXAM_DIR_NAME, "grade4-english-grammar-mahmoud");
  assert.equal(page.run("EXAM_TITLE"), page.document.title);
  assert.equal(page.document.title, "English Grammar Mahmoud");
  assert.equal(page.run("PENDING_PREFIX"), "pending:grade4-english-grammar-mahmoud:");
  /* Read from the reference examination itself, when the repository is present. */
  const reference = path.join(EXAM_DIR, "..", "grade5-math-unit1", "src", "config.ts");
  if (existsSync(reference)) {
    const config = readFileSync(reference, "utf8");
    assert.ok(config.includes(SHEETS_URL), "SHEETS_URL of grade5-math-unit1");
    assert.ok(config.includes(SHEETS_TOKEN), "SHEETS_TOKEN of grade5-math-unit1");
  }
  /* No other examination of the repository uses this EXAM_ID. */
  const root = path.join(EXAM_DIR, "..");
  const users = [];
  const scan = (dir, depth) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || ["node_modules", "dist", "_site", "tests"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (depth < 3) scan(full, depth + 1); }
      else if (/\.(html|ts|tsx|js|mjs)$/.test(entry.name) && readFileSync(full, "utf8").includes(EXAM_DIR_NAME)) users.push(path.relative(root, full));
    }
  };
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== EXAM_DIR_NAME && existsSync(path.join(root, entry.name, "package.json"))) scan(path.join(root, entry.name), 1);
  }
  assert.deepEqual(users, []);
});

test("field names and their order are exactly the contract's", () => {
  const { payload } = payloadOf(sheets.find((sheet) => sheet.name === "complete-007"));
  assert.deepEqual(Object.keys(payload), TOP_KEYS);
  assert.deepEqual(Object.keys(payload.summary), SUMMARY_KEYS);
  assert.equal(payload.lessons.length, 8);
  for (const row of payload.lessons) assert.deepEqual(Object.keys(row), LESSON_KEYS);
  assert.equal(payload.details.length, 37);
  for (const row of payload.details) assert.deepEqual(Object.keys(row), DETAIL_KEYS);
});

test("types: ISO dates, whole seconds, numbers for marks, no empty or missing value", () => {
  for (const name of ["all-correct", "all-wrong", "blank", "complete-007", "mixed-002"]) {
    const { payload } = payloadOf(sheets.find((sheet) => sheet.name === name));
    assert.equal(payload.token, SHEETS_TOKEN);
    assert.equal(payload.attemptId, "attempt-under-test");
    assert.equal(payload.examId, EXAM_DIR_NAME);
    assert.equal(payload.examTitle, "English Grammar Mahmoud");
    assert.equal(payload.studentName, FIXED_META.name);
    assert.match(payload.startAt, ISO);
    assert.match(payload.submitAt, ISO);
    assert.equal(payload.startAt, new Date(FIXED_META.startedAt).toISOString());
    assert.equal(payload.submitAt, new Date(FIXED_META.startedAt + FIXED_META.elapsedMs).toISOString());
    assert.equal(payload.elapsedSec, 1754, "1754321 ms, rounded down like the time on the results screen (00:29:14)");
    for (const key of SUMMARY_KEYS) assert.equal(typeof payload.summary[key], key === "gradeLabel" ? "string" : "number", key);
    for (const row of payload.lessons) {
      assert.equal(typeof row.title, "string");
      assert.ok(Number.isInteger(row.awarded) && Number.isInteger(row.max));
    }
    for (const row of payload.details) {
      assert.ok(Number.isInteger(row.q) && row.q >= 1 && row.q <= 25);
      assert.match(row.label, /^[a-d]$/);
      assert.ok(STATUSES.includes(row.status), row.status);
      assert.ok(Number.isInteger(row.awarded) && Number.isInteger(row.marks));
    }
    walk(payload, (value, trail) => {
      assert.notEqual(value, null, trail);
      assert.notEqual(value, undefined, trail);
      if (typeof value === "string") assert.notEqual(value.trim(), "", trail + " is empty");
      if (typeof value === "number") assert.ok(Number.isFinite(value), trail);
    });
    /* It survives the trip as JSON text unchanged. */
    assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload);
  }
});

test("elapsedSec is whole seconds, rounded down like the time shown on the results screen", () => {
  const sheet = sheets.find((item) => item.name === "all-correct");
  for (const [elapsedMs, seconds, shown] of [[59999, 59, "00:00:59"], [60000, 60, "00:01:00"], [999, 0, "00:00:00"], [3723500, 3723, "01:02:03"]]) {
    const { result, payload } = payloadOf(sheet, { elapsedMs });
    assert.equal(payload.elapsedSec, seconds);
    assert.equal(result.durationText, shown);
    assert.equal(Date.parse(payload.submitAt) - Date.parse(payload.startAt), elapsedMs);
  }
});

test("328 answer sheets: every number in the payload is the page's own marking result", () => {
  for (const sheet of sheets) {
    const { result, payload } = payloadOf(sheet);
    const s = payload.summary;
    assert.equal(s.total, result.score, sheet.name);
    assert.equal(s.max, 100);
    assert.equal(s.percentage, result.percentage);
    assert.equal(s.gradeLabel, result.rank.title, "the performance level shown on the results screen");
    assert.equal(s.fullQuestions, result.correct);
    assert.equal(s.partialQuestions, result.partial);
    assert.equal(s.wrongQuestions, result.graded.filter((q) => q.marks === 0).length);
    assert.equal(s.fullQuestions + s.partialQuestions + s.wrongQuestions, 25);
    assert.equal(s.correctSubparts + s.partialSubparts + s.wrongSubparts + s.unansweredSubparts, 37);
    assert.equal(s.partialSubparts, 0, "every part of this paper is either right or wrong");

    assert.deepEqual(payload.lessons, result.lessonRows.map((row) => ({ title: `Lesson ${row.lesson} — ${row.name}`, awarded: row.earned, max: row.possible })));
    assert.equal(payload.lessons.reduce((sum, row) => sum + row.awarded, 0), result.score);
    assert.equal(payload.lessons.reduce((sum, row) => sum + row.max, 0), 100);

    /* One row per marked part, in the order of the paper. */
    let at = 0;
    const counted = { Correct: 0, "Partially correct": 0, Incorrect: 0, Unanswered: 0 };
    page.questions.forEach((q, index) => {
      const graded = result.graded[index];
      const parts = partsOf(q);
      const rows = payload.details.slice(at, at + parts.length);
      at += parts.length;
      assert.equal(rows.reduce((sum, row) => sum + row.awarded, 0), graded.marks, `${sheet.name} Q${q.id}: the rows add up to the question's marks`);
      assert.equal(rows.reduce((sum, row) => sum + row.marks, 0), 4);
      rows.forEach((row, i) => {
        const given = givenPart(q, sheet.answers[q.id], i);
        /* Worked out here independently of the page: a part is right when it equals the key. */
        const expected = !given ? "Unanswered" : given === parts[i].answer ? "Correct" : "Incorrect";
        counted[expected] += 1;
        assert.equal(row.q, index + 1);
        assert.equal(row.label, "abcd"[i]);
        assert.equal(row.qTitle, graded.originalText);
        assert.equal(row.lessons, `Lesson ${q.lesson} — ${result.lessonRows.find((item) => item.lesson === q.lesson).name}`);
        assert.equal(row.status, expected, `${sheet.name} Q${q.id}${row.label}`);
        assert.equal(row.marks, parts[i].mark);
        assert.equal(row.awarded, expected === "Correct" ? parts[i].mark : 0);
        assert.ok(row.correctAnswer.includes(parts[i].answer));
        if (expected === "Unanswered") assert.equal(row.studentAnswer, "No answer");
        else assert.ok(row.studentAnswer.includes(given), row.studentAnswer);
        if (expected === "Correct") assert.equal(row.studentAnswer, row.correctAnswer);
        else assert.notEqual(row.studentAnswer, row.correctAnswer);
      });
      /* A fully answered question reads as on the results screen. */
      if (result.answered.includes(q.id) && parts.length > 1) assert.equal(rows.map((row) => row.studentAnswer).join(" · "), graded.givenText);
      if (parts.length > 1) assert.equal(rows.map((row) => row.correctAnswer).join(" · "), graded.correctText);
      else assert.equal(rows[0].correctAnswer, graded.correctText);
    });
    assert.equal(at, 37);
    assert.deepEqual([s.correctSubparts, s.partialSubparts, s.wrongSubparts, s.unansweredSubparts], [counted.Correct, 0, counted.Incorrect, counted.Unanswered], sheet.name);
    assert.equal(payload.reportText, "\uFEFF" + result.report, "the TXT report exactly as it is downloaded");
  }
});

test("4007 answers: the part rows always add up to what gradeQuestion() awards", () => {
  let cases = 0;
  for (const q of page.questions) {
    for (const answer of answerSpace(q)) {
      cases += 1;
      const literal = answer === undefined ? "undefined" : JSON.stringify(answer);
      const parts = page.json(`answerParts(QUESTIONS.find(q => q.id === ${q.id}), ${literal})`);
      assert.equal(parts.length, partsOf(q).length);
      assert.equal(parts.reduce((sum, part) => sum + part.awarded, 0), gradeOne(page, q.id, answer), `Q${q.id} ${literal}`);
      assert.deepEqual(parts.map((part) => part.marks), partsOf(q).map((part) => part.mark));
    }
  }
  assert.equal(cases, 4007);
});

test("through the interface: what is sent is the result on screen and the file that was downloaded", async () => {
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  const sheet = sheets.find((item) => item.name === "complete-007");
  await submitExamInUi(ui, { name: "  Mahmoud   Ahmed ", answers: sheet.answers, elapsedMs: 754000 });
  assert.equal(server.count, 1);
  const request = server.requests[0];
  const payload = request.payload;
  assert.deepEqual(Object.keys(payload), TOP_KEYS);
  assert.equal(payload.studentName, "Mahmoud Ahmed", "the name as the page shows it");
  assert.equal(payload.studentName, ui.text("#resultName"));
  assert.match(payload.attemptId, UUID);
  assert.equal(payload.examTitle, ui.document.title);
  assert.equal(payload.startAt, "2026-11-14T07:00:05.250Z");
  assert.equal(payload.submitAt, "2026-11-14T07:12:39.250Z");
  assert.equal(payload.elapsedSec, 754);
  assert.equal(ui.text("#statDuration"), "00:12:34");
  assert.equal(String(payload.summary.total), ui.text("#resultScore"));
  assert.equal(payload.summary.total, 66);
  assert.equal(`${payload.summary.percentage}% · Final score`, ui.text("#resultPercent"));
  assert.ok(ui.text("#summaryTitle").startsWith(payload.summary.gradeLabel + " · "));
  assert.equal(`${payload.summary.fullQuestions} / 25`, ui.text("#statCorrect"));
  assert.equal(`${payload.summary.partialQuestions + payload.summary.wrongQuestions} / 25`, ui.text("#statIncorrect"));
  /* The report in the payload is, byte for byte, the downloaded file. */
  assert.equal(ui.downloads.length, 1);
  assert.equal(payload.reportText, await ui.downloadText());
  assert.equal(payload.reportText.charCodeAt(0), 0xfeff);
  assert.ok(Buffer.from(payload.reportText, "utf8").equals(await ui.downloadBytes()));
  /* And it is what the page itself would build again. */
  assert.deepEqual(ui.json(`buildSubmissionPayload(${JSON.stringify(payload.attemptId)})`), payload);
  assert.equal(request.init.body, JSON.stringify(payload));
});

test("the teacher password and the storage keys of the page are never sent", async () => {
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  await submitExamInUi(ui, {});
  const body = server.requests[0].init.body;
  assert.ok(!body.includes("somer173"));
  assert.ok(!/password/i.test(body.replace(/teacher password\./g, "")), "only the report's own closing sentence mentions the password");
  assert.ok(!body.includes("mahmoud_minecraft_english"));
  assert.ok(!/internal reference|course repository/.test(body));
});

test("attemptId: unique per submitted attempt, with a fallback when crypto.randomUUID is missing", async () => {
  const ids = new Set();
  for (const crypto of [undefined, null]) {
    const server = new FakeServer();
    const ui = await openExam({ file: SOURCE_HTML, server, crypto });
    await submitExamInUi(ui, {});
    ui.click("#retryBtn");
    await submitExamInUi(ui, { name: "Second Try" });
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
  }
  assert.equal(ids.size, 4);
  /* A sheet of all correct answers reaches the teacher as 100/100. */
  const server = new FakeServer();
  const ui = await openExam({ file: SOURCE_HTML, server });
  await submitExamInUi(ui, { answers: sheetOf(ui.questions, correctAnswer) });
  assert.equal(server.requests[0].payload.summary.total, 100);
  assert.equal(server.requests[0].payload.summary.gradeLabel, "Legendary Redstone Engineer");
});

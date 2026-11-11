/**
 * The payload sent to the teacher keeps the contract of the reference examination
 * (grade5-math-unit1): same field names, same nesting, same data types — and every value is
 * taken from this examination's own marking result and TXT report.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { EXAM_DIR, EXAM_DIR_NAME, loadExam, makeAnswerSheets, takeExam, FakeServer, completeSheet } from "./harness.mjs";

const TOP = ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "elapsedSec", "summary", "lessons", "details", "reportText"];
const SUMMARY = ["total", "max", "percentage", "gradeLabel", "fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"];
const LESSON = ["title", "awarded", "max"];
const DETAIL = ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"];
const STUDENT = "سارة أحمد";
const ELAPSED_MS = 2853650; // 47 min 33.65 s → 2853 whole seconds

const server = new FakeServer();
const page = loadExam({ fetch: server.fetch });
const questions = page.json("QUESTIONS");
const sheet = completeSheet(questions, makeAnswerSheets(questions)[12].answers);
await takeExam(page, { name: STUDENT, answers: sheet, elapsedMs: ELAPSED_MS });
const request = server.requests[0];
const payload = request.body;
const state = page.state();
const result = state.result;

test("exactly one request was made, and it carries JSON", () => {
  assert.equal(server.requests.length, 1);
  assert.equal(typeof request.init.body, "string");
  assert.ok(payload && typeof payload === "object");
});

test("top-level, summary, lessons and details fields have the required names, in the reference order", () => {
  assert.deepEqual(Object.keys(payload), TOP);
  assert.deepEqual(Object.keys(payload.summary), SUMMARY);
  assert.ok(payload.lessons.length > 0 && payload.details.length > 0);
  for (const lesson of payload.lessons) assert.deepEqual(Object.keys(lesson), LESSON);
  for (const detail of payload.details) assert.deepEqual(Object.keys(detail), DETAIL);
});

test("field types match the reference payload", () => {
  for (const key of ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "reportText"]) assert.equal(typeof payload[key], "string", key);
  assert.equal(typeof payload.elapsedSec, "number");
  assert.ok(Number.isInteger(payload.elapsedSec));
  assert.ok(Array.isArray(payload.lessons) && Array.isArray(payload.details));
  for (const key of SUMMARY) assert.equal(typeof payload.summary[key], key === "gradeLabel" ? "string" : "number", "summary." + key);
  for (const lesson of payload.lessons) {
    assert.equal(typeof lesson.title, "string");
    assert.equal(typeof lesson.awarded, "number");
    assert.equal(typeof lesson.max, "number");
  }
  for (const detail of payload.details) {
    for (const key of ["q", "awarded", "marks"]) assert.equal(typeof detail[key], "number", key);
    for (const key of ["qTitle", "lessons", "label", "status", "studentAnswer", "correctAnswer"]) assert.equal(typeof detail[key], "string", key);
  }
});

test("nothing is lost in JSON: no null, undefined, NaN or empty required text", () => {
  assert.ok(!/:null[,}\]]/.test(request.init.body));
  for (const key of ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "reportText"]) assert.ok(payload[key].length > 0, key);
  for (const detail of payload.details) for (const key of ["qTitle", "lessons", "label", "status", "studentAnswer", "correctAnswer"]) assert.ok(detail[key].length > 0, key);
});

test("the reference examination declares the same fields, URL and token", { skip: !existsSync(path.join(EXAM_DIR, "..", "grade5-math-unit1", "src", "exam", "submit.ts")) }, () => {
  const reference = path.join(EXAM_DIR, "..", "grade5-math-unit1", "src");
  const submit = readFileSync(path.join(reference, "exam", "submit.ts"), "utf8");
  const config = readFileSync(path.join(reference, "config.ts"), "utf8");
  const fieldsOf = name => {
    const body = submit.match(new RegExp("export interface " + name + " \\{([\\s\\S]*?)\\n\\}"))[1];
    return [...body.matchAll(/^\s*(\w+)\??:/gm)].map(match => match[1]);
  };
  assert.deepEqual(fieldsOf("SubmissionPayload"), TOP);
  assert.deepEqual(fieldsOf("PayloadSummary"), SUMMARY);
  assert.deepEqual(fieldsOf("PayloadLesson"), LESSON);
  assert.deepEqual(fieldsOf("PayloadDetail"), DETAIL);
  const constant = name => config.match(new RegExp("export const " + name + " = \"([^\"]+)\""))[1];
  assert.equal(request.url, constant("SHEETS_URL"));
  assert.equal(payload.token, constant("SHEETS_TOKEN"));
  assert.equal(page.json("SHEETS_URL"), constant("SHEETS_URL"));
  assert.notEqual(payload.examId, constant("EXAM_ID"));
  // Same delivery constants as the reference.
  assert.match(submit, /RETRY_DELAYS_MS: readonly number\[\] = \[2000, 5000\]/);
  assert.match(submit, /ATTEMPT_TIMEOUT_MS = 30000/);
  assert.match(submit, /'Content-Type': 'text\/plain;charset=utf-8'/);
  assert.deepEqual(page.json("RETRY_DELAYS_MS"), [2000, 5000]);
  assert.equal(page.json("ATTEMPT_TIMEOUT_MS"), 30000);
  assert.equal(page.json("MAX_ATTEMPTS"), 3);
});

test("examId is the name of this folder, and examTitle is the page title", () => {
  assert.equal(payload.examId, "grade8-english-l1l2");
  assert.equal(payload.examId, EXAM_DIR_NAME);
  assert.equal(page.json("PENDING_PREFIX"), "pending:" + EXAM_DIR_NAME + ":");
  assert.equal(payload.examTitle, page.parsed.title);
});

test("student, times and duration are those of the attempt", () => {
  assert.equal(payload.studentName, STUDENT);
  assert.equal(payload.startAt, state.startISO);
  assert.equal(payload.submitAt, state.submittedISO);
  assert.equal(new Date(payload.startAt).toISOString(), payload.startAt);
  assert.equal(new Date(payload.submitAt).toISOString(), payload.submitAt);
  assert.equal(Date.parse(payload.submitAt) - Date.parse(payload.startAt), ELAPSED_MS);
  assert.equal(payload.elapsedSec, 2853);
  assert.equal(payload.elapsedSec, state.elapsedSeconds);
  assert.equal(page.el("results-duration-inline").textContent, "00:47:33");
});

test("summary equals the marking result and what the results screen shows", () => {
  const summary = payload.summary;
  assert.equal(summary.total, result.totalScore);
  assert.equal(summary.max, 100);
  assert.equal(summary.percentage, result.percentage);
  assert.equal(summary.percentage, Math.round((summary.total / summary.max) * 1000) / 10);
  assert.equal(summary.gradeLabel, page.el("results-performance").textContent);
  assert.equal(String(summary.total), page.el("results-score").textContent);
  assert.equal(String(summary.correctSubparts), page.el("stat-correct").textContent);
  assert.equal(String(summary.partialSubparts), page.el("stat-partial").textContent);
  assert.equal(String(summary.wrongSubparts), page.el("stat-incorrect").textContent);
  assert.equal(summary.correctSubparts, result.statusCounts.correct);
  assert.equal(summary.partialSubparts, result.statusCounts.partial);
  assert.equal(summary.wrongSubparts, result.statusCounts.incorrect);
  assert.equal(summary.unansweredSubparts, result.statusCounts.unanswered);
  assert.equal(summary.correctSubparts + summary.partialSubparts + summary.wrongSubparts + summary.unansweredSubparts, 60);
  assert.equal(summary.fullQuestions, result.fullyCorrectMain);
  assert.equal(summary.fullQuestions + summary.partialQuestions + summary.wrongQuestions, 30);
  assert.equal(summary.partialQuestions, result.questions.filter(question => question.awarded > 0 && question.awarded < question.marks).length);
  assert.equal(summary.wrongQuestions, result.questions.filter(question => question.awarded === 0).length);
  // The chosen sheet exercises every bucket.
  assert.ok(summary.fullQuestions > 0 && summary.partialQuestions > 0 && summary.wrongQuestions > 0);
  assert.ok(summary.correctSubparts > 0 && summary.wrongSubparts > 0);
});

test("lessons: the two lessons of the paper, adding up to the total", () => {
  assert.deepEqual(payload.lessons.map(lesson => lesson.title), ["Lesson 1 · Future Plans", "Lesson 2 · School Challenges"]);
  assert.equal(payload.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0), payload.summary.total);
  assert.equal(payload.lessons.reduce((sum, lesson) => sum + lesson.max, 0), 100);
  for (const [index, label] of ["Lesson 1", "Lesson 2"].entries()) {
    const own = result.questions.filter(question => question.lessonLabel === label);
    assert.equal(payload.lessons[index].awarded, own.reduce((sum, question) => sum + question.awarded, 0));
    assert.equal(payload.lessons[index].max, own.reduce((sum, question) => sum + question.marks, 0));
  }
});

test("details: one row per answerable part, in question order, matching the marking result", () => {
  assert.equal(payload.details.length, 60);
  const expected = result.questions.flatMap(question => question.parts.map((part, index) => ({ question, part, index })));
  payload.details.forEach((detail, row) => {
    const { question, part, index } = expected[row];
    const source = questions.find(item => item.n === question.n);
    assert.equal(detail.q, question.n);
    assert.equal(detail.qTitle, question.sectionLabel + " · " + page.call("stripHtml", source.stem));
    assert.equal(detail.lessons, question.lessonLabel === "Lesson 1" ? "Lesson 1 · Future Plans" : "Lesson 2 · School Challenges");
    assert.equal(detail.label, "abcdefgh"[index]);
    assert.equal(part.partId, detail.q + detail.label);
    assert.equal(detail.status, part.statusLabel);
    assert.equal(detail.awarded, part.awarded);
    assert.equal(detail.marks, part.marks);
    assert.equal(detail.studentAnswer, part.studentDisplay);
    assert.equal(detail.correctAnswer, part.correctDisplay);
  });
  assert.equal(payload.details.reduce((sum, detail) => sum + detail.awarded, 0), payload.summary.total);
  assert.equal(payload.details.reduce((sum, detail) => sum + detail.marks, 0), 100);
  for (const detail of payload.details) assert.ok(["Correct", "Partially correct", "Incorrect", "Unanswered"].includes(detail.status), detail.status);
});

test("multiple-choice answers are sent as the option text the student saw, not as an option letter", () => {
  const row = payload.details.find(detail => detail.q === 2 && detail.label === "a");
  const part = questions[1].parts[0];
  assert.ok(part.options.some(option => page.call("stripHtml", option.text) === row.studentAnswer));
  assert.equal(row.correctAnswer, page.call("stripHtml", part.options.find(option => option.id === part.correct).text));
});

test("reportText is exactly the TXT file the student downloaded", async () => {
  assert.equal(page.host.downloads.length, 1);
  assert.match(page.host.downloads[0].filename, /^Grade8_English_Unit1_Lessons1-2_Report_.+\.txt$/);
  const downloaded = await page.downloadedBytes();
  assert.ok(downloaded.equals(Buffer.from(payload.reportText, "utf8")));
  assert.equal(payload.reportText.charCodeAt(0), 0xfeff);
  assert.ok(payload.reportText.includes("Student full name: " + STUDENT));
  assert.ok(payload.reportText.includes("Student's score: " + payload.summary.total + " / 100"));
  assert.equal((payload.reportText.match(/^QUESTION \d+ ·/gm) || []).length, 30);
  // Every row of details agrees with the report text.
  for (const detail of payload.details) {
    assert.ok(payload.reportText.includes("Student's answer: " + detail.studentAnswer), "answer of " + detail.q + detail.label);
    assert.ok(payload.reportText.includes("Correct answer: " + detail.correctAnswer), "key of " + detail.q + detail.label);
  }
});

test("the teacher password and the answer-key panel are never sent", () => {
  assert.ok(!request.init.body.includes(page.json("TEACHER_PASSWORD")));
  assert.ok(!request.init.body.includes("TEACHER ANSWER KEY"));
});

test("unanswered parts are reported as unanswered, not guessed", () => {
  const blank = page.run(`JSON.stringify(buildSubmissionPayload({
    studentName: "A", startISO: "2026-11-11T07:00:00.000Z", submittedISO: "2026-11-11T07:10:00.000Z", elapsedSeconds: 600,
    questionOrder: QUESTIONS.map(q => q.n), result: gradeAttempt({})
  }, "attempt-x", "report"))`);
  const data = JSON.parse(blank);
  assert.deepEqual(Object.keys(data), TOP);
  assert.equal(data.summary.total, 0);
  assert.equal(data.summary.unansweredSubparts, 60);
  assert.equal(data.summary.wrongSubparts, 0);
  assert.equal(data.summary.wrongQuestions, 30);
  assert.equal(data.summary.gradeLabel, "Needs improvement");
  assert.ok(data.details.every(detail => detail.status === "Unanswered" && detail.studentAnswer === "No answer" && detail.awarded === 0));
  assert.equal(data.elapsedSec, 600);
});

test("a perfect paper is reported as 100 / 100, all questions full", async () => {
  const perfectServer = new FakeServer();
  const perfect = await takeExam(loadExam({ fetch: perfectServer.fetch }), { name: "Omar Haddad" });
  const body = perfectServer.requests[0].body;
  assert.deepEqual(body.summary, {
    total: 100, max: 100, percentage: 100, gradeLabel: "Distinction",
    fullQuestions: 30, partialQuestions: 0, wrongQuestions: 0,
    correctSubparts: 60, partialSubparts: 0, wrongSubparts: 0, unansweredSubparts: 0,
  });
  assert.deepEqual(body.lessons.map(lesson => lesson.awarded), body.lessons.map(lesson => lesson.max));
  assert.equal(perfect.state().result.totalScore, 100);
});

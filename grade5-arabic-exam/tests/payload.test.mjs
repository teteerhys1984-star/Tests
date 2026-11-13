/**
 * الحمولة المرسلة مقابل عقد الاختبار المرجعي grade5-math-unit1:
 * الحقول نفسها بالترتيب نفسه والأنواع نفسها، وقيمها مأخوذة من نتيجة التصحيح والتقرير أنفسهما.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  EXAM_DIR, EXAM_DIR_NAME, ORIGINAL_HTML, openExam, submitExamInUi, takeExamInUi, settle, correctAnswer, wrongAnswer, makeSheets, gradeSheet,
} from "./harness.mjs";

/* العقد كما هو في grade5-math-unit1/src/exam/submit.ts (الأسماء بالترتيب، مع النوع). */
const CONTRACT = {
  payload: [
    ["token", "string"], ["attemptId", "string"], ["examId", "string"], ["examTitle", "string"], ["studentName", "string"],
    ["startAt", "string"], ["submitAt", "string"], ["elapsedSec", "number"], ["summary", "object"], ["lessons", "array"],
    ["details", "array"], ["reportText", "string"],
  ],
  summary: [
    ["total", "number"], ["max", "number"], ["percentage", "number"], ["gradeLabel", "string"], ["fullQuestions", "number"],
    ["partialQuestions", "number"], ["wrongQuestions", "number"], ["correctSubparts", "number"], ["partialSubparts", "number"],
    ["wrongSubparts", "number"], ["unansweredSubparts", "number"],
  ],
  lesson: [["title", "string"], ["awarded", "number"], ["max", "number"]],
  detail: [
    ["q", "number"], ["qTitle", "string"], ["lessons", "string"], ["label", "string"], ["status", "string"], ["awarded", "number"],
    ["marks", "number"], ["studentAnswer", "string"], ["correctAnswer", "string"],
  ],
};
const REFERENCE_DIR = path.resolve(EXAM_DIR, "..", "grade5-math-unit1");
const REFERENCE_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
const REFERENCE_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
const referenceGradeLabel = (p) => (p >= 95 ? "ممتاز" : p >= 85 ? "جيد جداً" : p >= 75 ? "جيد" : p >= 65 ? "مقبول" : p >= 50 ? "ضعيف" : "يحتاج إلى دعم");

const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
function assertShape(obj, shape, where) {
  assert.deepEqual(Object.keys(obj), shape.map(([k]) => k), where + ": field names and order");
  for (const [k, t] of shape) {
    assert.equal(typeOf(obj[k]), t, where + "." + k);
    if (t === "number") assert.ok(Number.isFinite(obj[k]), where + "." + k + " is finite");
  }
}
function assertContract(payload) {
  assertShape(payload, CONTRACT.payload, "payload");
  assertShape(payload.summary, CONTRACT.summary, "summary");
  payload.lessons.forEach((l, i) => assertShape(l, CONTRACT.lesson, "lessons[" + i + "]"));
  payload.details.forEach((d, i) => assertShape(d, CONTRACT.detail, "details[" + i + "]"));
}

async function submitted(options = {}, serverPage = {}) {
  const page = openExam(serverPage);
  await submitExamInUi(page, options);
  return { page, payload: page.server.requests[0].payload, raw: page.server.requests[0].init.body };
}

test("العقد المكتوب هنا هو عقد الاختبار المرجعي فعلاً (يُقرأ من مصدر grade5-math-unit1)", { skip: !existsSync(REFERENCE_DIR) && "reference exam folder is not present" }, () => {
  const submitTs = readFileSync(path.join(REFERENCE_DIR, "src/exam/submit.ts"), "utf8");
  const fields = (name) => {
    const body = submitTs.match(new RegExp("export interface " + name + " \\{([\\s\\S]*?)\\n\\}"))[1];
    return [...body.matchAll(/^\s*(\w+): ([^\n]+)$/gm)].map((m) => [m[1], m[2].trim()]);
  };
  const norm = (t) => (/\[\]$/.test(t) ? "array" : /^Payload/.test(t) ? "object" : t);
  assert.deepEqual(fields("SubmissionPayload").map(([k, t]) => [k, norm(t)]), CONTRACT.payload);
  assert.deepEqual(fields("PayloadSummary"), CONTRACT.summary);
  assert.deepEqual(fields("PayloadLesson"), CONTRACT.lesson);
  assert.deepEqual(fields("PayloadDetail"), CONTRACT.detail);

  const config = readFileSync(path.join(REFERENCE_DIR, "src/config.ts"), "utf8");
  assert.equal(config.match(/SHEETS_URL = "([^"]+)"/)[1], REFERENCE_URL);
  assert.equal(config.match(/SHEETS_TOKEN = "([^"]+)"/)[1], REFERENCE_TOKEN);

  // آلية الإرسال المرجعية
  assert.match(submitTs, /RETRY_DELAYS_MS: readonly number\[\] = \[2000, 5000\]/);
  assert.match(submitTs, /ATTEMPT_TIMEOUT_MS = 30000/);
  assert.match(submitTs, /'Content-Type': 'text\/plain;charset=utf-8'/);
  assert.match(submitTs, /PENDING_PREFIX = `pending:\$\{EXAM_ID\}:`/);

  // سلّم التقدير المرجعي: تُنفَّذ الدالة المرجعية نفسها وتُقارن على كل النسب
  const reportTs = readFileSync(path.join(REFERENCE_DIR, "src/exam/report.ts"), "utf8");
  const src = reportTs.match(/export function gradeLabel\(p: number\): string \{([\s\S]*?)\n\}/)[1];
  const refFn = new Function("p", src);
  const page = openExam();
  for (let p = 0; p <= 100; p += 0.5) {
    assert.equal(referenceGradeLabel(p), refFn(p), "local copy of the scale at " + p);
    assert.equal(page.run("gradeLabel(" + p + ")"), refFn(p), "page scale at " + p);
  }
  page.close();
});

test("ثوابت الإرسال في الصفحة: الرابط والرمز المرجعيان، و EXAM_ID = اسم المجلد", () => {
  const page = openExam();
  assert.equal(page.run("SHEETS_URL"), REFERENCE_URL);
  assert.equal(page.run("SHEETS_TOKEN"), REFERENCE_TOKEN);
  assert.equal(page.run("EXAM_ID"), EXAM_DIR_NAME);
  assert.equal(page.run("EXAM_ID"), "grade5-arabic-exam");
  assert.equal(page.run("PENDING_PREFIX"), "pending:grade5-arabic-exam:");
  assert.deepEqual(page.json("RETRY_DELAYS_MS"), [2000, 5000]);
  assert.equal(page.run("MAX_ATTEMPTS"), 3);
  assert.equal(page.run("ATTEMPT_TIMEOUT_MS"), 30000);
  for (let p = 0; p <= 100; p += 0.5) assert.equal(page.run("gradeLabel(" + p + ")"), referenceGradeLabel(p));
  page.close();
});

test("حمولة محاولة كاملة الصحة تطابق العقد وقيمها صحيحة", async () => {
  const { page, payload, raw } = await submitted({ name: "سلمى أحمد العلي", elapsedMs: 754400 });
  assertContract(payload);
  const S = page.json("S");
  assert.equal(payload.token, REFERENCE_TOKEN);
  assert.equal(payload.attemptId, S.attemptId);
  assert.match(payload.attemptId, /^att-[a-z0-9]+-[a-z0-9]+$/);
  assert.equal(payload.examId, "grade5-arabic-exam");
  assert.equal(payload.examTitle, "اختبار اللغة العربية التفاعلي — الصف الخامس — الدرس الثاني: بالرأي والرأي الآخر");
  assert.equal(payload.examTitle, page.document.title);
  assert.equal(payload.studentName, "سلمى أحمد العلي");
  assert.equal(payload.startAt, new Date(S.startTs).toISOString());
  assert.equal(payload.submitAt, new Date(S.submitTs).toISOString());
  assert.match(payload.startAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  assert.equal(payload.elapsedSec, 754);
  assert.ok(Number.isInteger(payload.elapsedSec));
  assert.deepEqual(payload.summary, {
    total: 100, max: 100, percentage: 100, gradeLabel: "ممتاز", fullQuestions: 20, partialQuestions: 0, wrongQuestions: 0,
    correctSubparts: 46, partialSubparts: 0, wrongSubparts: 0, unansweredSubparts: 0,
  });
  // المراحل التسع بعناوينها؛ السؤال ذو المرحلتين يُحتسب في كلتيهما
  assert.deepEqual(payload.lessons.map((l) => l.title), Object.values(page.json("STAGE_NAME")));
  assert.equal(payload.lessons.length, 9);
  for (const l of payload.lessons) assert.equal(l.awarded, l.max);
  const twoStage = page.questions.filter((q) => q.stage2).reduce((n, q) => n + q.marks, 0);
  assert.equal(payload.lessons.reduce((n, l) => n + l.max, 0), 100 + twoStage);
  // مدخل لكل جزء قابل للتصحيح
  assert.equal(payload.details.length, 46);
  assert.equal(payload.details.reduce((n, d) => n + d.marks, 0), 100);
  assert.equal(payload.details.reduce((n, d) => n + d.awarded, 0), 100);
  assert.ok(payload.details.every((d) => d.status === "إجابة تامة"));
  assert.equal(payload.reportText, S.report);
  assert.equal(payload.reportText, await page.downloadText());
  // الجسم المرسل هو JSON للحمولة نفسها
  assert.equal(raw, JSON.stringify(payload));
  page.close();
});

test("details تطابق نتيجة التصحيح والتقرير جزءاً جزءاً (محاولة مختلطة)", async () => {
  const answerFor = (p, q) => ((q.id.charCodeAt(2) * 3 + p.id.charCodeAt(0)) % 3 === 0 ? wrongAnswer(p) : correctAnswer(p));
  const { page, payload } = await submitted({ answerFor });
  assertContract(payload);
  const S = page.json("S");
  const r = S.result;
  const letters = page.json("PART_LETTERS");
  const words = page.json("STATUS_WORD");
  const stage = page.json("STAGE_NAME");
  let i = 0;
  for (const row of r.rows) {
    row.q.parts.forEach((p, pi) => {
      const d = payload.details[i++];
      const pr = row.parts[pi];
      assert.equal(d.q, row.pos);
      assert.equal(d.qTitle, row.q.title);
      assert.equal(d.lessons, [row.q.stage, row.q.stage2].filter(Boolean).map((k) => stage[k]).join(" + "));
      assert.equal(d.label, letters[pi]);
      assert.equal(d.status, words[pr.status]);
      assert.equal(d.awarded, pr.earned);
      assert.equal(d.marks, p.marks);
      assert.equal(d.studentAnswer, pr.stu);
      assert.equal(d.correctAnswer, pr.corr);
      // والنص نفسه مكتوب في التقرير
      assert.ok(payload.reportText.includes("   إجابة الطالبة: " + d.studentAnswer));
      assert.ok(payload.reportText.includes("   الدرجة: " + d.awarded + " من " + d.marks + " — " + d.status));
    });
  }
  assert.equal(i, payload.details.length);
  // الأسئلة بترتيب عرضها على الطالبة 1..20
  assert.deepEqual([...new Set(payload.details.map((d) => d.q))], Array.from({ length: 20 }, (_, k) => k + 1));
  const s = payload.summary;
  assert.equal(s.total, r.total);
  assert.equal(s.percentage, r.pct);
  assert.deepEqual([s.correctSubparts, s.partialSubparts, s.wrongSubparts, s.unansweredSubparts], [r.full, r.part, r.wrong, r.empty]);
  assert.equal(s.correctSubparts + s.partialSubparts + s.wrongSubparts + s.unansweredSubparts, 46);
  assert.equal(s.fullQuestions + s.partialQuestions + s.wrongQuestions, 20);
  assert.equal(s.fullQuestions, r.rows.filter((row) => row.got === row.q.marks).length);
  assert.equal(s.wrongQuestions, r.rows.filter((row) => row.got === 0).length);
  assert.ok(s.total > 0 && s.total < 100 && s.partialQuestions > 0);
  assert.equal(s.gradeLabel, referenceGradeLabel(s.percentage));
  assert.ok(payload.reportText.includes("العلامة المستحقة: " + s.total + " من 100 (" + s.percentage + "%)"));
  for (const l of payload.lessons) assert.ok(l.awarded >= 0 && l.awarded <= l.max);
  page.close();
});

test("buildPayload على 304 ورقة (منها الفارغة والجزئية): العقد سليم والمجاميع متسقة", () => {
  const page = openExam();
  const sheets = makeSheets(page.questions, 300);
  const labels = new Set();
  for (const sheet of sheets) {
    const { result, report } = gradeSheet(page, sheet);
    const payload = page.json("buildPayload(S)");
    assertContract(payload);
    assert.equal(payload.details.length, 46, sheet.name);
    assert.equal(payload.summary.total, result.total, sheet.name);
    assert.equal(payload.details.reduce((n, d) => n + d.awarded, 0), result.total, sheet.name);
    assert.equal(payload.summary.unansweredSubparts, result.empty, sheet.name);
    assert.equal(payload.details.filter((d) => d.status === "غير مُجابة").length, result.empty, sheet.name);
    assert.equal(payload.summary.gradeLabel, referenceGradeLabel(result.pct), sheet.name);
    assert.equal(payload.reportText, report, sheet.name);
    for (const d of payload.details) assert.ok(d.studentAnswer.length > 0, sheet.name);
    labels.add(payload.summary.gradeLabel);
  }
  assert.ok(labels.size >= 4, "grade labels seen: " + [...labels].join("، "));
  // الورقة الفارغة: نص «لم تُجَب» نفسه المكتوب في التقرير
  gradeSheet(page, sheets[1]);
  const empty = page.json("buildPayload(S)");
  assert.ok(empty.details.every((d) => d.studentAnswer === "— (لم تُجَب)" && d.awarded === 0 && d.status === "غير مُجابة"));
  assert.deepEqual([empty.summary.total, empty.summary.wrongQuestions, empty.summary.gradeLabel], [0, 20, "يحتاج إلى دعم"]);
  page.close();
});

test("gradeLabel يُرسَل للمعلّم فقط: لا يظهر للطالبة ولا في تقرير TXT", async () => {
  const labels = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم", "التقدير"];
  const count = (text, word) => text.split(word).length - 1;
  for (const answerFor of [correctAnswer, wrongAnswer]) {
    const { page, payload } = await submitted({ answerFor });
    // النسخة الأصلية (بلا أي تقدير) للمحاولة نفسها: مرجع لما كان يظهر أصلاً
    const base = openExam({ file: ORIGINAL_HTML });
    await submitExamInUi(base, { answerFor });
    assert.ok(labels.includes(payload.summary.gradeLabel));
    const screen = page.text("#scr-results");
    const report = await page.downloadText();
    const baseReport = await base.downloadText();
    assert.equal(base.text("#scr-results").replace(/\s+/g, " "), screen.replace("تم إرسال نتيجتك إلى معلّمك ✓ إعادة إرسال النتيجة", "").replace(/\s+/g, " "));
    for (const label of labels) {
      assert.ok(!screen.includes(label), "results screen shows: " + label);
      // لا ورود جديداً لأي لفظ تقدير في التقرير (بعضها كلمات عادية في نص الأسئلة الأصلي مثل «مقبول»)
      assert.equal(count(report, label), count(baseReport, label), "TXT report gained: " + label);
    }
    assert.ok(!report.includes("التقدير"));
    assert.ok(!report.includes("gradeLabel"));
    page.close(); base.close();
  }
});

test("الحمولة بعد إعادة فتح الصفحة مطابقة لما بُني عند التسليم، ولكل محاولة attemptId فريد", async () => {
  const { FakeServer, FakeStorage } = await import("./harness.mjs");
  const storage = new FakeStorage();
  const first = openExam({ storage, server: new FakeServer([], "network") });
  await submitExamInUi(first);
  await first.clock.advance(7000);
  const original = first.server.requests[0].payload;
  first.close();
  const second = openExam({ storage, server: new FakeServer([], "network") });
  await settle();
  assert.deepEqual(second.json("buildPayload(S)"), original);
  assert.deepEqual(second.server.requests[0].payload, original);
  second.close();

  const ids = new Set();
  for (let seed = 1; seed <= 25; seed++) {
    const page = openExam({ seed });
    ids.add(page.json("S.attemptId"));
    page.$("#in-name").value = "سلمى";
    page.click("#btn-start");
    ids.add(page.json("S.attemptId"));
    page.close();
  }
  assert.equal(ids.size, 50);
});

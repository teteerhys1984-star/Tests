/**
 * مطابقة التصحيح مع النسخة الأصلية.
 *
 * النسخة الأصلية محفوظة كما هي في tests/fixtures/original-exam.html (الملف المرفوع نفسه، بلا أي تعديل)،
 * وتُشغَّل هنا جنباً إلى جنب مع الصفحة الجديدة: كل ورقة إجابة تُصحَّح بالمحرّكين ثم تُقارن
 * النتيجة والتقرير حرفياً.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  ORIGINAL_HTML, SOURCE_HTML, REPORT_LINE_NEW, REPORT_LINE_ORIGINAL,
  openExam, makeSheets, gradeSheet, sheetOf, correctAnswer, wrongAnswer, submitExamInUi, mulberry32, variantAnswer,
} from "./harness.mjs";

/* بصمة الملف الأصلي كما رُفع إلى المستودع (interactive-arabic-grade-5-exam/index.html عند 2f571d8). */
const ORIGINAL_SHA256 = "7c20d21f44c58a56f7521f6240b9af8cf949b580faaee0330039e7e590a68758";

const original = openExam({ file: ORIGINAL_HTML });
const current = openExam({ file: SOURCE_HTML });
const sheets = makeSheets(current.questions, 300);
const asOriginalReport = (report) => report.replace(REPORT_LINE_NEW, REPORT_LINE_ORIGINAL);

test("خط الأساس هو الملف الأصلي نفسه دون تعديل", () => {
  assert.equal(createHash("sha256").update(readFileSync(ORIGINAL_HTML)).digest("hex"), ORIGINAL_SHA256);
});

test("بنك الأسئلة والإجابات والعلامات مطابق للأصل حرفياً", () => {
  for (const name of ["EXAM", "QUESTIONS", "STAGE_NAME", "DIFF_NAME", "STATUS_WORD", "PART_LETTERS", "TOTAL_PARTS", "TEACHER_PASS", "KEY", "HKEY"]) {
    assert.deepEqual(current.json(name), original.json(name), name);
  }
});

test("دوالّ التصحيح والتقرير لم تُمسّ (نص الدالة مطابق للأصل)", () => {
  const untouched = [
    "norm", "has", "partAnswered", "missingCount", "gradeWrite", "gradePart", "gradeAll", "makeFileName", "praise",
    "fmtDur", "fmtDateTime", "uid", "shuffle", "optOrder", "submitExam", "performDownload", "beginExam", "renderKey",
    "qaSelfCheck", "archiveHistory", "updateSubmitState",
  ];
  for (const fn of untouched) {
    assert.equal(current.run(fn + ".toString()"), original.run(fn + ".toString()"), fn);
  }
  // buildReport: الفرق الوحيد هو سطر الخصوصية
  assert.equal(
    current.run("buildReport.toString()").replace(REPORT_LINE_NEW, REPORT_LINE_ORIGINAL),
    original.run("buildReport.toString()"),
  );
});

test("بنية الاختبار: 20 سؤالاً، 46 جزءاً، 100 علامة", () => {
  const qs = current.questions;
  assert.equal(qs.length, 20);
  assert.equal(qs.reduce((n, q) => n + q.parts.length, 0), 46);
  assert.equal(current.json("TOTAL_PARTS"), 46);
  assert.equal(qs.reduce((n, q) => n + q.marks, 0), 100);
  for (const q of qs) assert.equal(q.parts.reduce((n, p) => n + p.marks, 0), q.marks, q.id);
  const types = {};
  for (const q of qs) for (const p of q.parts) types[p.type] = (types[p.type] || 0) + 1;
  assert.deepEqual(types, { choice: 24, tf: 8, fill: 7, multi: 2, write: 2, match: 1, classify: 1, order: 1 });
  const diff = {};
  for (const q of qs) diff[q.diff] = (diff[q.diff] || 0) + q.marks;
  assert.deepEqual(diff, { basic: 24, medium: 35, advanced: 24, thinking: 17 });
  assert.ok(current.consoleLines.some((l) => /\[QA\].*questions=20 marks=100 parts=46.*status=passed/.test(l.text)));
});

test(`التصحيح والتقرير مطابقان للأصل على ${sheets.length} ورقة (صحيحة، فارغة، خاطئة، مختلطة، جزئية)`, () => {
  const seenStatus = new Set();
  const totals = new Set();
  for (const sheet of sheets) {
    const a = gradeSheet(original, sheet);
    const b = gradeSheet(current, sheet);
    assert.deepEqual(b.result, a.result, sheet.name + ": result");
    assert.equal(b.missing, a.missing, sheet.name + ": missing");
    assert.equal(b.file, a.file, sheet.name + ": file name");
    assert.ok(b.report.includes(REPORT_LINE_NEW), sheet.name);
    assert.ok(!b.report.includes(REPORT_LINE_ORIGINAL), sheet.name);
    assert.equal(asOriginalReport(b.report), a.report, sheet.name + ": report");
    for (const row of a.result.rows) for (const p of row.parts) seenStatus.add(p.status);
    totals.add(a.result.total);
  }
  // المجموعة متنوعة فعلاً: كل الحالات الأربع ظهرت، وعشرات المجاميع المختلفة
  assert.deepEqual([...seenStatus].sort(), ["empty", "full", "partial", "wrong"]);
  assert.ok(totals.size > 40, "distinct totals: " + totals.size);
});

test("كل تركيبة ممكنة لكل جزء موضوعي تُصحَّح كالأصل (استقصاء شامل لكل جزء)", () => {
  const qs = current.questions;
  const natural = qs.map((_, i) => i);
  const perms = (n) => (n <= 1 ? [[0].slice(0, n)] : perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)])));
  let cases = 0;
  for (const q of qs) {
    for (const p of q.parts) {
      let candidates = [];
      if (p.type === "choice") candidates = p.opts.map((_, i) => i);
      else if (p.type === "tf") candidates = [true, false];
      else if (p.type === "multi") {
        for (let mask = 0; mask < 1 << p.opts.length; mask++) candidates.push(p.opts.map((_, i) => i).filter((i) => mask & (1 << i)));
      } else if (p.type === "order") {
        candidates = perms(p.items.length);
        candidates.push([], [0]);
      } else if (p.type === "match") {
        candidates = perms(p.rights.length).map((perm) => Object.fromEntries(perm.map((ri, li) => [li, ri])));
        candidates.push({}, { 0: p.map[0] });
      } else if (p.type === "classify") {
        for (let mask = 0; mask < p.cats.length ** p.items.length; mask++) {
          let m = mask;
          candidates.push(Object.fromEntries(p.items.map((_, i) => { const c = m % p.cats.length; m = Math.floor(m / p.cats.length); return [i, c]; })));
        }
      } else continue;
      for (const answer of candidates) {
        const sheet = { order: natural, answers: { [q.id]: { [p.id]: answer } } };
        assert.deepEqual(gradeSheet(current, sheet).result, gradeSheet(original, sheet).result, q.id + p.id + " " + JSON.stringify(answer));
        cases++;
      }
    }
  }
  assert.ok(cases > 150, "cases: " + cases);
});

test("الإجابات النصية (ملء الفراغ والمقالي): مئات الصياغات تُصحَّح كالأصل", () => {
  const qs = current.questions;
  const natural = qs.map((_, i) => i);
  const random = mulberry32(99);
  const texts = ["", " ", "ذهاب", "الذهابُ", "ذَهَابٌ", "ذهاب.", "«حب»", "الحبّ", "أقبلَ", "اقبل", "إقبال", "وجد", "وَجَدَ", "سباحه", "السباحة", "جلوسٌ", "xyz", "١٢٣"];
  let cases = 0;
  for (const q of qs) {
    for (const p of q.parts) {
      if (p.type !== "fill" && p.type !== "write") continue;
      const candidates = p.type === "fill" ? [...texts, ...p.accept, p.ans, p.alts] : [];
      for (let i = 0; i < 40; i++) candidates.push(variantAnswer(p, random));
      if (p.type === "write") {
        for (let i = 0; i < 40; i++) {
          // نصوص مركّبة عشوائياً من مفردات سلّم التصحيح
          const words = ["أخ", "أخت", "أرى", "رأيي", "أظن", "لكن", "نزور", "الحديقة", "السلام", "شكراً", "من فضلك", "حلم", "طموح", "المستقبل", "مهنة", "تعمل", "؟", ":", "\n", "جميل", "اليوم"];
          let s = "";
          const n = 1 + Math.floor(random() * 14);
          for (let k = 0; k < n; k++) s += words[Math.floor(random() * words.length)] + " ";
          candidates.push(s);
        }
      }
      for (const answer of candidates) {
        const sheet = { order: natural, answers: { [q.id]: { [p.id]: answer } } };
        assert.deepEqual(gradeSheet(current, sheet).result, gradeSheet(original, sheet).result, q.id + p.id + " " + JSON.stringify(answer));
        cases++;
      }
    }
  }
  assert.ok(cases > 400, "cases: " + cases);
});

test("قيم مطلقة: كل الصحيح = 100، الفارغ = 0، كل الخاطئ = 0", () => {
  const qs = current.questions;
  const natural = qs.map((_, i) => i);
  const full = gradeSheet(current, { order: natural, answers: sheetOf(qs, correctAnswer) }).result;
  assert.deepEqual([full.total, full.pct, full.full, full.part, full.wrong, full.empty], [100, 100, 46, 0, 0, 0]);
  const empty = gradeSheet(current, { order: natural, answers: {} }).result;
  assert.deepEqual([empty.total, empty.pct, empty.full, empty.part, empty.wrong, empty.empty], [0, 0, 0, 0, 0, 46]);
  const wrong = gradeSheet(current, { order: natural, answers: sheetOf(qs, wrongAnswer) }).result;
  assert.deepEqual([wrong.total, wrong.pct, wrong.full, wrong.part, wrong.wrong, wrong.empty], [0, 0, 0, 0, 46, 0]);
});

test("قيم مطلقة: العلامات الجزئية (متعدد، مطابقة، تصنيف، ترتيب، مقالي)", () => {
  const qs = current.questions;
  const natural = qs.map((_, i) => i);
  const find = (type, n = 0) => qs.flatMap((q) => q.parts.filter((p) => p.type === type).map((p) => ({ q, p })))[n];
  const one = (q, p, answer) => {
    const r = gradeSheet(current, { order: natural, answers: { [q.id]: { [p.id]: answer } } }).result;
    return r.rows.find((row) => row.q.id === q.id).parts[q.parts.findIndex((x) => x.id === p.id)];
  };
  // متعدد: +per للصحيح و −neg للمضلل، بين 0 والعلامة الكاملة
  for (const n of [0, 1]) {
    const { q, p } = find("multi", n);
    const bad = p.opts.map((_, i) => i).find((i) => !p.ok.includes(i));
    assert.deepEqual(one(q, p, p.ok).earned, p.marks);
    assert.equal(one(q, p, p.ok.slice(0, 1)).earned, p.per);
    assert.equal(one(q, p, p.ok.slice(0, 1)).status, "partial");
    assert.equal(one(q, p, [...p.ok, bad]).earned, Math.max(0, Math.min(p.marks, p.ok.length * p.per - p.neg)));
    assert.equal(one(q, p, [p.ok[0], bad]).earned, Math.max(0, p.per - p.neg));
    assert.equal(one(q, p, [bad]).earned, 0);
    assert.equal(one(q, p, [bad]).status, "wrong");
  }
  {
    const { q, p } = find("match");
    const swapped = { 0: p.map[1], 1: p.map[0], 2: p.map[2] };
    assert.equal(one(q, p, swapped).earned, p.per);
    assert.equal(one(q, p, swapped).status, "partial");
  }
  {
    const { q, p } = find("classify");
    const three = Object.fromEntries(p.items.map((it, i) => [i, i < 3 ? it.cat : 1 - it.cat]));
    assert.equal(one(q, p, three).earned, 3 * p.per);
    assert.equal(one(q, p, three).status, "partial");
  }
  {
    const { q, p } = find("order");
    assert.deepEqual(p.wts, [2, 2, 1]);
    assert.equal(one(q, p, [0, 2, 1]).earned, 2);
    assert.equal(one(q, p, [2, 1, 0]).earned, 2);
    assert.equal(one(q, p, [1, 0, 2]).earned, 1);
    assert.equal(one(q, p, [0, 1, 2]).earned, 5);
  }
  {
    const { q, p } = find("write", 0); // حوار الأخ والأخت (6)
    assert.equal(q.id, "q19");
    assert.equal(one(q, p, correctAnswer(p)).earned, 6);
    assert.equal(one(q, p, "أحب الحديقة كثيراً وأريد الذهاب إليها مع أخي").earned, 2); // رأي فقط (كلمتان)
    assert.equal(one(q, p, "لا أعرف الإجابة عن هذا السؤال أبداً").earned, 0);
  }
  {
    const { q, p } = find("write", 1); // سؤالا المقابلة (4)
    assert.equal(q.id, "q20");
    assert.equal(one(q, p, correctAnswer(p)).earned, 4);
    assert.equal(one(q, p, "ما حلمك؟ وماذا بعد").earned, 2);
    assert.equal(one(q, p, "هل الجو جميل اليوم؟").earned, 1);
  }
});

test("محاولة كاملة عبر الواجهة الحقيقية: الصفحتان تنتجان الإجابات والنتيجة والتقرير المنزَّل نفسها", async () => {
  for (const [label, answerFor] of [
    ["all-correct", correctAnswer],
    ["all-wrong", wrongAnswer],
    ["mixed", (p, q) => ((q.id.charCodeAt(2) + p.id.charCodeAt(0)) % 3 === 0 ? wrongAnswer(p) : correctAnswer(p))],
  ]) {
    const a = openExam({ file: ORIGINAL_HTML, seed: 7 });
    const b = openExam({ file: SOURCE_HTML, seed: 7 });
    await submitExamInUi(a, { answerFor });
    await submitExamInUi(b, { answerFor });
    assert.deepEqual(b.json("S.order"), a.json("S.order"), label);
    assert.deepEqual(b.json("S.answers"), a.json("S.answers"), label);
    assert.deepEqual(b.json("S.result"), a.json("S.result"), label);
    assert.equal(b.json("S.attemptId"), a.json("S.attemptId"), label);
    // ما تراه الطالبة في صفحة النتيجة
    for (const sel of ["#res-name", "#res-praise", "#res-score", "#res-pct", "#st-full", "#st-part", "#st-wrong", "#st-empty", "#st-time", "#attempt-info", "#dl-note"]) {
      assert.equal(b.text(sel), a.text(sel), label + " " + sel);
    }
    // ملف التقرير المنزَّل تلقائياً
    assert.equal(a.downloads.length, 1);
    assert.equal(b.downloads.length, 1);
    assert.equal(b.downloads[0].name, a.downloads[0].name);
    assert.equal(asOriginalReport(await b.downloadText()), await a.downloadText(), label);
    // الأصل لا يرسل شيئاً؛ الجديد يرسل مرة واحدة
    assert.equal(a.server.count, 0);
    assert.equal(b.server.count, 1);
    assert.deepEqual(a.pageErrors, []);
    assert.deepEqual(b.pageErrors, []);
    if (label === "all-correct") assert.equal(b.text("#res-score"), "١٠٠");
    if (label === "all-wrong") assert.equal(b.text("#res-score"), "٠");
    a.close(); b.close();
  }
});

test("لا يُفعَّل زر التسليم قبل اكتمال كل الأجزاء (كما في الأصل)", async () => {
  const page = openExam();
  page.$("#in-name").value = "سلمى";
  page.click("#btn-start");
  assert.equal(page.$("#btn-submit").disabled, true);
  page.run("submitExam()");
  assert.equal(page.json("S.status"), "active");
  assert.equal(page.server.count, 0);
  page.close();
});

test.after(() => { original.close(); current.close(); });

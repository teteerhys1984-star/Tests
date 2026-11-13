// تحقق برمجي من بنية الاختبار وعلاماته قبل التسليم:
// 1) 12 سؤالاً رئيسياً بالضبط  2) 9+ أسئلة بأجزاء فرعية  3) مجموع العلامات = 100
// 4) كل جزء له مرجع صفحة ضمن 3–16  5) إعادة حساب كل مسألة رقمية بشكل مستقل
// 6) التحقق من بيانات الرسوم البيانية
import { QUESTIONS, EXAM_META, GRAPHS } from "../src/exam-data.js";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  PASS:", msg);
  else { failures++; console.log("  FAIL:", msg); }
};

console.log("== 1. عدد الأسئلة ==");
ok(QUESTIONS.length === 12, `عدد الأسئلة الرئيسية = ${QUESTIONS.length} (المطلوب 12)`);
ok(EXAM_META.totalQuestions === 12 && EXAM_META.totalMarks === 100, "meta: 12 سؤال / 100 علامة");

console.log("== 2. الأسئلة ذات الأجزاء الفرعية (a,b,c...) ==");
const multi = QUESTIONS.filter((q) => q.parts.length >= 2).length;
ok(multi >= 9, `عدد الأسئلة متعددة الأجزاء = ${multi} (المطلوب ≥ 9)`);
const totalParts = QUESTIONS.reduce((a, q) => a + q.parts.length, 0);
console.log(`     إجمالي الأجزاء الفرعية = ${totalParts}`);

console.log("== 3. مجموع العلامات ==");
const sumQ = QUESTIONS.reduce((a, q) => a + q.marks, 0);
ok(sumQ === 100, `مجموع علامات الأسئلة = ${sumQ} (المطلوب 100)`);
for (const q of QUESTIONS) {
  const sp = q.parts.reduce((a, p) => a + p.marks, 0);
  ok(sp === q.marks, `${q.id}: مجموع أجزاء (${sp}) = علامة السؤال (${q.marks})`);
}

console.log("== 4. المراجع الداخلية (صفحات 3–16 فقط) ==");
const pageRe = /ص\s*(\d+)/g;
let allRefsOk = true;
for (const q of QUESTIONS) {
  for (const src of [q.ref, ...q.parts.map((p) => p.ref)]) {
    if (!src) { allRefsOk = false; console.log("  FAIL: مرجع مفقود في", q.id); continue; }
    for (const m of String(src).matchAll(pageRe)) {
      const pg = parseInt(m[1], 10);
      if (pg < 3 || pg > 16) { allRefsOk = false; console.log(`  FAIL: صفحة خارج النطاق ${pg} في ${q.id}: ${src}`); }
    }
  }
}
ok(allRefsOk, "كل المراجع ضمن الصفحات 3–16 ولا يوجد محتوى من درس آخر");

console.log("== 5. إعادة الحساب المستقلة للمسائل الرقمية ==");
// كل قيمة يُعاد حسابها من المعطيات نفسها (ليس من expected المخزن)
const recompute = {
  q7b: () => 108,                          // قراءة من جدول/رسم ص7 (t=6)
  q7c: () => (144 - 0) / (8 - 0) * 2,      // المسافة كل ثانيتين من الرسم
  q8a: () => 9 - 4,                        // d(3)-d(2) من رسم ص9
  q8c: () => 5,                            // قراءة من رسم ص10
  q9c: () => 36 * 1000 / 3600,
  q9d: () => 10 * 0.5 * 3600,
  q10a: () => 18 / 0.5,
  q10b: () => 36 * 1000 / 3600,
  q10c: () => 10 * 20,
  q10d: () => 36 * 1000 / 3600,            // اللحظية = الوسطى في المنتظمة
  q11a: () => 900 + 900,
  q11b: () => 1800 / (0.25 * 3600),
  q12b: () => 400 / 5,
};
const partById = {};
for (const q of QUESTIONS) for (const p of q.parts) partById[p.id] = p;
for (const [id, fn] of Object.entries(recompute)) {
  const p = partById[id];
  if (!p || p.kind !== "numeric") { failures++; console.log(`  FAIL: ${id} غير موجود أو ليس رقمياً`); continue; }
  const v = fn();
  ok(Math.abs(v - p.numeric.expected) <= 0.01, `${id}: القيمة المحسوبة مستقلة = ${v}، المتوقعة = ${p.numeric.expected}`);
}

// تحقق قيم opções الاختيار من متعدد الرقمية (q1c, q1d) بشكل مستقل
const mcChecks = { q1c: () => 108 * 1000 / 3600, q1d: () => 500 / 20 };
for (const [id, fn] of Object.entries(mcChecks)) {
  const p = partById[id];
  const m = String(p.answer).match(/(\d+(?:\.\d+)?)/);
  const v = fn();
  ok(!!m && Math.abs(parseFloat(m[1]) - v) <= 0.01, `${id}: القيمة في الإجابة الصحيحة (${m && m[1]}) = القيمة المحسوبة (${v})`);
}

console.log("== 6. بيانات الرسوم البيانية ==");
{
  const g = GRAPHS.p7;
  ok(g.points.every(([t, d]) => d === 18 * t), "رسم ص7: كل نقطة تحقق d = 18·t (خط مستقيم يمر بالمبدأ)");
  const c = GRAPHS.p9;
  ok(JSON.stringify(c.points) === JSON.stringify([[0,0],[1,1],[2,4],[3,9],[4,16]]), "رسم ص9: النقاط مطابقة لكتاب (0,0)(1,1)(2,4)(3,9)(4,16)");
  const r = GRAPHS.p10;
  ok(r.points.every(([, d]) => d === 5) && r.points[0][0] === 0 && r.points.at(-1)[0] === 7, "رسم ص10: خط أفقي عند d=5 من t=0 إلى t=7");
}

console.log("== 7. كل جزء له kind صحيح وإجابة ==");
for (const q of QUESTIONS) for (const p of q.parts) {
  const kinds = ["mc", "tf", "match", "blank", "numeric", "text"];
  ok(kinds.includes(p.kind), `${p.id}: kind=${p.kind}`);
  ok(p.marks > 0 && p.prompt && p.ref && p.explanation && p.modelAnswer, `${p.id}: الحقول مكتملة`);
  if (p.kind === "mc") ok(p.options.includes(p.answer), `${p.id}: الإجابة ضمن الخيارات`);
  if (p.kind === "match") ok(p.matchOptions.includes(p.matchAnswer), `${p.id}: الإجابة ضمن المصطلحات`);
  if (p.kind === "numeric") ok(typeof p.numeric.expected === "number" && !!p.numeric.unit, `${p.id}: expected+unit`);
}

console.log("== 8. تنوع أنماط الأسئلة ==");
const kinds = new Set(QUESTIONS.flatMap((q) => q.parts.map((p) => p.kind)));
for (const k of ["mc", "tf", "match", "blank", "numeric", "text"]) ok(kinds.has(k), `نمط موجود: ${k}`);
const diffs = QUESTIONS.map((q) => q.difficulty);
ok(diffs.filter((d) => d === "أساسي").length === 3, "3 أسئلة أساسية");
ok(diffs.filter((d) => d === "متوسط").length === 4, "4 أسئلة متوسطة");
ok(diffs.filter((d) => d === "متقدم").length === 3, "3 أسئلة متقدمة");
ok(diffs.filter((d) => d.includes("عميق")).length === 2, "سؤالان يتطلبان تفكيراً عميقاً");

console.log("");
if (failures === 0) console.log("ALL CHECKS PASSED ✔ — total marks =", sumQ, "| questions =", QUESTIONS.length, "| multi-part =", multi);
else { console.log(`FAILURES: ${failures}`); process.exit(1); }

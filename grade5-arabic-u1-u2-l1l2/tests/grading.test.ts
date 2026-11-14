/**
 * اختبار الحفاظ على المحتوى والتصحيح مقارنة بخط الأساس الأصلي (tests/fixtures/baseline.json)
 * + التحقق من الإصلاحات اللغوية والواجهية الموثقة.
 */
import fs from "node:fs";
import path from "node:path";
import baseline from "./fixtures/baseline.json";
import { QUESTIONS, totalBranches, totalPoints } from "../src/data/questions";
import { computeGrades, type AnswersMap } from "../src/lib/grading";

const rootDir = process.cwd();

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  } else {
    console.log("  ✓ " + name + (extra ? " → " + extra : ""));
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("\n== 1) مطابقة البنية والأجوبة وتوزيع العلامات لخط الأساس الأصلي ==");
check(
  `عدد الأسئلة الرئيسية = ${baseline.questionCount}`,
  QUESTIONS.length === baseline.questionCount,
  String(QUESTIONS.length),
);
check(
  `عدد الفروع = ${baseline.branchCount}`,
  totalBranches() === baseline.branchCount,
  String(totalBranches()),
);
check(
  `العلامة الكلية = ${baseline.totalPoints}`,
  totalPoints() === baseline.totalPoints,
  String(totalPoints()),
);

for (let i = 0; i < QUESTIONS.length; i++) {
  const q = QUESTIONS[i];
  const bq = baseline.questionsMeta[i];
  const qPts = q.branches.reduce((s, b) => s + b.points, 0);
  check(
    `السؤال ${q.order}: الفروع والعلامات والمفاتيح مطابقة للأصل`,
    q.id === bq.id &&
      q.order === bq.order &&
      q.lesson === bq.lesson &&
      qPts === bq.points &&
      q.branches.length === bq.branches.length &&
      q.branches.every((b, bi) => {
        const bb = bq.branches[bi];
        return (
          b.id === bb.id &&
          b.type === bb.type &&
          b.points === bb.points &&
          b.correctChoiceId === bb.correctChoiceId &&
          same(b.correctChoiceIds, bb.correctChoiceIds) &&
          same(b.acceptedAnswers, bb.acceptedAnswers) &&
          same(b.items, bb.items) &&
          same(b.pairs, bb.pairs)
        );
      }),
  );
}

console.log("\n== 2) مطابقة نتائج التصحيح مع خط الأساس الأصلي ==");
const perfect: AnswersMap = {};
const wrong: AnswersMap = {};
for (const q of QUESTIONS) {
  for (const b of q.branches) {
    if (b.type === "single_choice" || b.type === "true_false") {
      perfect[b.id] = b.correctChoiceId!;
      wrong[b.id] = b.choices!.find((c) => c.id !== b.correctChoiceId)!.id;
    } else if (b.type === "multi_choice") {
      perfect[b.id] = [...b.correctChoiceIds!];
      wrong[b.id] = [b.choices!.find((c) => !b.correctChoiceIds!.includes(c.id))!.id];
    } else if (b.type === "fill_blank") {
      perfect[b.id] = b.acceptedAnswers![0];
      wrong[b.id] = "إجابة خاطئة تماما";
    } else if (b.type === "classify") {
      perfect[b.id] = Object.fromEntries(
        b.items!.map((it) => [it.id, it.correctCategoryId]),
      );
      wrong[b.id] = Object.fromEntries(
        b.items!.map((it) => [
          it.id,
          b.categories!.find((c) => c.id !== it.correctCategoryId)!.id,
        ]),
      );
    } else if (b.type === "match") {
      perfect[b.id] = Object.fromEntries(b.pairs!.map((p) => [p.id, p.right]));
      wrong[b.id] = Object.fromEntries(
        b.pairs!.map((p, i) => [p.id, b.pairs![(i + 1) % b.pairs!.length].right]),
      );
    }
  }
}

const partial: AnswersMap = { ...perfect };
partial["q6b"] = ["a"];
partial["q9a"] = ["a", "b"];
partial["q2a"] = { s1: "nom", s2: "nom", s3: "nom" };
partial["q4a"] = {
  p1: QUESTIONS[3].branches[0].pairs![0].right,
  p2: QUESTIONS[3].branches[0].pairs![0].right,
};
partial["q10b"] = {
  p1: QUESTIONS[9].branches[1].pairs![0].right,
  p2: QUESTIONS[9].branches[1].pairs![1].right,
  p3: QUESTIONS[9].branches[1].pairs![0].right,
};

const vectors: Record<string, AnswersMap> = {
  perfect,
  empty: {},
  wrong,
  partial,
};

for (const [name, ans] of Object.entries(vectors)) {
  const g = computeGrades(ans);
  const current = {
    finalScore: g.finalScore,
    correctBranches: g.correctBranches,
    wrongBranches: g.wrongBranches,
    partialBranches: g.partialBranches,
    unanswered: g.unanswered,
    perBranch: g.perQuestion.flatMap((pq) =>
      pq.perBranch.map((pb) => ({
        id: pb.branch.id,
        earnedPoints: pb.grade.earnedPoints,
        maxPoints: pb.grade.maxPoints,
        correct: pb.grade.correct,
        partial: pb.grade.partial,
      })),
    ),
  };
  const expected = baseline.gradingResults[name];
  check(
    `حالة «${name}» تطابق خط الأساس تماماً (${expected.finalScore}/100)`,
    same(current, expected),
  );
}

console.log("\n== 3) التحقق من الإصلاحات اللغوية والملفات المستقلة ==");
const q13 = QUESTIONS.find((q) => q.id === "q13")!;
const q13c = q13.branches.find((b) => b.id === "q13c")!;
check("إغلاق علامة التنصيص في عنوان السؤال 13", q13.title.endsWith("»"), q13.title);
check(
  "إزالة «في قوله تعالى» غير الصحيحة من q13c",
  !q13c.prompt.includes("قوله تعالى") && q13c.prompt.includes("«أَطْرَقَ الحاسِبُ حَزيناً»"),
  q13c.prompt,
);

const css = fs.readFileSync(path.join(rootDir, "src", "index.css"), "utf8");
check("عدم وجود طلب خطوط خارجي في index.css", !css.includes("fonts.googleapis.com"));

const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
check("dir=\"rtl\" و lang=\"ar\" في index.html", html.includes('dir="rtl"') && html.includes('lang="ar"'));

console.log("");
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في التطابق والتصحيح`);
  process.exit(1);
}
console.log("✅ كل فحوص التطابق والتصحيح ناجحة");

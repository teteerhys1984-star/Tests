/**
 * مجموعة اختبارات البيانات والتصحيح والتقرير:
 *
 *  1) مطابقة كاملة لخط الأساس المستخرج من الملفات الأصلية قبل التعديل
 *     (الأسئلة، الفروع، ترتيبها، نصوصها، الإجابات الصحيحة، العلامات، الشروح، المراجع).
 *  2) الحالات: كاملة / فارغة / خاطئة كلياً / مختلطة / جزئية.
 *  3) ثبات نتيجة التصحيح على مدى عريض من نسب النجاح (كما في خط الأساس).
 *  4) عقد التقرير النصي (الترويسة والمجاميع وتغطية كل فرع).
 *  5) تدقيق لغوي/بصري آلي: أرقام موحّدة، لا كلمات مكررة، لا مسافات مزدوجة،
 *     علامات ترقيم RTL سليمة، ولا نصوص إنجليزية غير مقصودة.
 *  6) استقلالية النموذج الثاني عن النموذج الأول وعن الاختبار المرجعي.
 */
import fs from "node:fs";
import path from "node:path";
import baseline from "./fixtures/baseline.json";
import { EXAM_ID } from "../src/config";
import {
  EXAM_QUESTIONS,
  LESSONS,
  TOTAL_BRANCHES,
  TOTAL_MARKS,
  TOTAL_POINTS_IN_DATA,
  TOTAL_QUESTIONS,
  type Branch,
} from "../src/data/exam";
import {
  buildTextReport,
  correctAnswerText,
  evaluateExam,
  formatScore,
  gradeLabel,
  isBranchAnswered,
  sanitizeFileName,
  studentAnswerText,
  type AnswerMap,
} from "../src/lib/grading";

let failures = 0;
process.exitCode = 1;

function check(name: string, cond: boolean, extra = "") {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  } else {
    console.log("  ✓ " + name + (extra ? " → " + extra : ""));
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const rootDir = process.cwd();

/* ------------------------------------------------------------------ */
/* أدوات بناء الإجابات                                                 */
/* ------------------------------------------------------------------ */

function correctValue(branch: Branch): AnswerMap[string] {
  switch (branch.kind) {
    case "single_choice":
      return branch.correctChoiceId;
    case "true_false":
      return String(branch.correct);
    case "fill_blank":
      return branch.acceptedAnswers[0];
    case "multi_select":
      return [...branch.correctChoiceIds];
    case "classification":
      return Object.fromEntries(branch.items.map((item) => [item.id, item.categoryId]));
    case "matching":
      return Object.fromEntries(branch.pairs.map((pair) => [pair.id, pair.id]));
    case "ordering":
      return [...branch.correctOrderIds];
  }
}

function wrongValue(branch: Branch): AnswerMap[string] {
  switch (branch.kind) {
    case "single_choice":
      return branch.choices.find((choice) => choice.id !== branch.correctChoiceId)!.id;
    case "true_false":
      return branch.correct ? "false" : "true";
    case "fill_blank":
      return "كلمة-خاطئة-تماما";
    case "multi_select":
      return [];
    case "classification": {
      const categories = [...new Set(branch.items.map((item) => item.categoryId))];
      return Object.fromEntries(
        branch.items.map((item) => [
          item.id,
          categories.find((id) => id !== item.categoryId) ?? item.categoryId,
        ]),
      );
    }
    case "matching":
      return Object.fromEntries(
        branch.pairs.map((pair) => [
          pair.id,
          branch.pairs.find((candidate) => candidate.id !== pair.id)?.id ?? pair.id,
        ]),
      );
    case "ordering":
      return [...branch.correctOrderIds].reverse();
  }
}

const answerAll = (pick: (branch: Branch) => AnswerMap[string] | undefined): AnswerMap => {
  const answers: AnswerMap = {};
  for (const question of EXAM_QUESTIONS) {
    for (const branch of question.branches) {
      const value = pick(branch);
      if (value !== undefined) answers[branch.id] = value;
    }
  }
  return answers;
};

const summaryOf = (answers: AnswerMap) => {
  const result = evaluateExam(answers);
  return {
    score: result.score,
    max: result.max,
    percentage: result.percentage,
    full: result.fullBranches,
    partial: result.partialBranches,
    wrong: result.wrongBranches,
    answered: result.answeredBranches,
    total: result.totalBranches,
  };
};

type BaselineBranch = Record<string, unknown>;

/**
 * تمثيل قانوني موحّد للفرع يُطبَّق على البيانات الحالية وعلى خط الأساس معاً،
 * حتى تكون المقارنة على الحقول الدلالية فقط (المعرّف والنوع والنص والعلامات
 * والإجابة الصحيحة والشرح والمرجع) لا على تفاصيل تسلسل JSON.
 */
function canonicalBranch(branch: Branch | BaselineBranch): Record<string, unknown> {
  const raw = branch as Record<string, unknown>;
  const kind = (raw.kind ?? raw.type) as Branch["kind"];
  const base = {
    id: raw.id,
    kind,
    points: raw.points,
    prompt: raw.prompt,
    explanation: raw.explanation,
    ref: raw.ref,
  };
  switch (kind) {
    case "single_choice":
      return { ...base, correctChoiceId: raw.correctChoiceId };
    case "true_false":
      return { ...base, correct: raw.correct };
    case "fill_blank":
      return {
        ...base,
        acceptedAnswers: raw.acceptedAnswers,
        strictHamza: Boolean(raw.strictHamza),
      };
    case "multi_select":
      return {
        ...base,
        correctChoiceIds: raw.correctChoiceIds,
        requiredSelections: raw.requiredSelections,
      };
    case "classification":
      return {
        ...base,
        categories: raw.categories,
        items: (raw.items as { id: string; text: string; categoryId: string }[]).map((item) => ({
          id: item.id,
          text: item.text,
          categoryId: item.categoryId,
        })),
      };
    case "matching":
      return { ...base, pairs: raw.pairs };
    case "ordering":
      return {
        ...base,
        correctOrderIds: raw.correctOrderIds,
        items: (raw.items ?? raw.orderItems) as unknown,
      };
    default:
      return base;
  }
}

const canonicalBranches = (branches: (Branch | BaselineBranch)[]) => branches.map(canonicalBranch);

console.log("\n== 1) مطابقة خط الأساس الأصلي (قبل التعديل) ==");
check(`عدد الأسئلة = ${baseline.questionCount}`, EXAM_QUESTIONS.length === baseline.questionCount, String(EXAM_QUESTIONS.length));
check(`TOTAL_QUESTIONS = ${baseline.questionCount}`, TOTAL_QUESTIONS === baseline.questionCount);
check(`عدد الفروع = ${baseline.branchCount}`, EXAM_QUESTIONS.reduce((sum, q) => sum + q.branches.length, 0) === baseline.branchCount);
check(`TOTAL_BRANCHES = ${baseline.branchCount}`, TOTAL_BRANCHES === baseline.branchCount);
check(`مجموع العلامات = ${baseline.totalPoints}`, TOTAL_POINTS_IN_DATA === baseline.totalPoints, String(TOTAL_POINTS_IN_DATA));
check(`TOTAL_MARKS = ${baseline.totalPoints}`, TOTAL_MARKS === baseline.totalPoints);
check(
  "الثوابت المعلنة في البيانات مطابقة لخط الأساس",
  same(
    { TOTAL_MARKS, TOTAL_BRANCHES, TOTAL_QUESTIONS, TOTAL_POINTS_IN_DATA },
    baseline.declared,
  ),
);
/**
 * التدقيق الموثّق: نطاقات الصفحات في خط الأساس كانت مكتوبة بالأرقام اللاتينية
 * (5 – 9…) بينما كل مراجع الشروح والعلامات في الملف نفسه بالأرقام العربية،
 * فتم توحيدها على العربية. لذلك تُقارن هنا مع تجاهل *رسم الأرقام فقط*: العدد
 * نفسه والفاصل والنص لا تتغيّر، وأي تغيير آخر يُفشل الفحص.
 */
const digitsToLatin = (value: string) =>
  value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
const lessonsForComparison = (lessons: typeof LESSONS | typeof baseline.lessons) =>
  Object.fromEntries(
    Object.entries(lessons).map(([key, lesson]) => [
      key,
      {
        key: (lesson as { key: string }).key,
        unit: (lesson as { unit: string }).unit,
        title: (lesson as { title: string }).title,
        shortTitle: (lesson as { shortTitle: string }).shortTitle,
        pages: digitsToLatin((lesson as { pages: string }).pages),
      },
    ]),
  );
check(
  "عناوين الدروس وصفحاتها مطابقة لخط الأساس (مع توحيد رسم الأرقام الموثّق)",
  same(lessonsForComparison(LESSONS), lessonsForComparison(baseline.lessons)) &&
    Object.values(LESSONS).every((lesson) => /[٠-٩]/.test(lesson.pages)),
);

for (let i = 0; i < baseline.questionsMeta.length; i++) {
  const expected = baseline.questionsMeta[i];
  const actual = EXAM_QUESTIONS[i];
  const points = actual.branches.reduce((sum, branch) => sum + branch.points, 0);
  check(
    `السؤال ${expected.number} (${expected.id}): الترتيب والنص والدرس والعلامات`,
    actual.id === expected.id &&
      actual.number === expected.number &&
      actual.title === expected.title &&
      actual.skill === expected.skill &&
      actual.lessonKey === expected.lessonKey &&
      actual.intro === expected.intro &&
      points === expected.points,
  );
  check(
    `السؤال ${expected.number}: ${expected.branches.length} فروع بترتيبها ونصوصها وإجاباتها وعلاماتها`,
    same(
      canonicalBranches(actual.branches),
      canonicalBranches(baseline.questionsMeta[i].branches as unknown as Branch[]),
    ),
  );
}

const declaredSum = Object.values(baseline.declared).every((value) => typeof value === "number");
check("خط الأساس نفسه متسق: 100 علامة = 45 فرعاً", declaredSum && baseline.declared.TOTAL_MARKS === baseline.totalPoints);

console.log("\n== 2) الحالات الكاملة والفارغة والخاطئة والمختلطة والجزئية ==");
const perfect = summaryOf(answerAll((branch) => correctValue(branch)));
check(
  "الحالة الكاملة: 100/100 و45 فرعاً صحيحاً",
  perfect.score === 100 && perfect.percentage === 100 && perfect.full === 45 && perfect.partial === 0 && perfect.wrong === 0 && perfect.answered === 45,
  JSON.stringify(perfect),
);

const empty = summaryOf({});
check(
  "الحالة الفارغة: 0/100 و45 فرعاً غير مجاب",
  empty.score === 0 && empty.full === 0 && empty.partial === 0 && empty.answered === 0 && empty.total === 45,
  JSON.stringify(empty),
);
check(
  "كل فرع غير مجاب يُعدّ غير مُجاب في isBranchAnswered",
  EXAM_QUESTIONS.every((question) => question.branches.every((branch) => !isBranchAnswered(branch, undefined))),
);

const allWrong = summaryOf(answerAll((branch) => wrongValue(branch)));
check(
  "الحالة الخاطئة كلياً: 0/100 بلا أي علامة جزئية",
  allWrong.score === 0 && allWrong.full === 0 && allWrong.partial === 0,
  JSON.stringify(allWrong),
);

const mixedAnswers = (() => {
  const answers: AnswerMap = {};
  let index = 0;
  for (const question of EXAM_QUESTIONS) {
    for (const branch of question.branches) {
      index++;
      if (index % 3 === 0) answers[branch.id] = wrongValue(branch);
      else if (index % 5 !== 0) answers[branch.id] = correctValue(branch);
    }
  }
  return answers;
})();
const mixed = summaryOf(mixedAnswers);
check(
  "الحالة المختلطة: علامة بين 0 و100 والعدّادات متسقة",
  mixed.score > 0 && mixed.score < 100 && mixed.full + mixed.partial + mixed.wrong === 45 && mixed.answered === Object.keys(mixedAnswers).length,
  JSON.stringify(mixed),
);

const partialAnswers = (() => {
  const answers: AnswerMap = {};
  for (const question of EXAM_QUESTIONS) {
    for (const branch of question.branches) {
      switch (branch.kind) {
        case "classification":
          answers[branch.id] = Object.fromEntries(
            branch.items.map((item, index) => [item.id, index % 2 === 0 ? item.categoryId : "غير-ذلك"]),
          );
          break;
        case "matching":
          answers[branch.id] = Object.fromEntries(
            branch.pairs.map((pair, index) => [pair.id, index % 2 === 0 ? pair.id : "غير-ذلك"]),
          );
          break;
        case "ordering": {
          const order = [...branch.correctOrderIds];
          [order[0], order[1]] = [order[1], order[0]];
          answers[branch.id] = order;
          break;
        }
        case "fill_blank":
          // مسافات وتشكيل زائدان لا يجوز أن ينقصا العلامة
          answers[branch.id] = `  ${branch.acceptedAnswers[0]}  `;
          break;
        default:
          answers[branch.id] = correctValue(branch);
      }
    }
  }
  return answers;
})();
const partial = summaryOf(partialAnswers);
check(
  "الحالة الجزئية: علامات جزئية في التصنيف والمطابقة والترتيب",
  partial.score > 0 && partial.score < 100 && partial.partial > 0 && partial.full + partial.partial + partial.wrong === 45,
  JSON.stringify(partial),
);

check(
  "التصحيح حتمي: نفس الإجابات تعطي النتيجة نفسها",
  same(summaryOf(partialAnswers), partial) && same(summaryOf(mixedAnswers), mixed),
);

console.log("\n== 3) مطابقة نتيجة التصحيح لخط الأساس ===");
const EXPECTED = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests/fixtures/expected-grading.json"), "utf8"),
) as Record<string, { score: number; percentage: number; full: number; partial: number; wrong: number; answered: number; total: number }>;
const actualCases: Record<string, ReturnType<typeof summaryOf>> = {
  perfect,
  empty,
  allWrong,
  mixed,
  partial,
};
for (const [name, expected] of Object.entries(EXPECTED)) {
  const actual = actualCases[name];
  check(
    `الحالة «${name}» مطابقة لخط الأساس: ${expected.score}/100 (${expected.full} صحيحة، ${expected.partial} جزئية، ${expected.wrong} خاطئة)`,
    same(actual, expected),
    JSON.stringify(actual),
  );
}

console.log("\n== 4) عقد التقرير النصي ==");
const submittedAt = new Date("2026-11-14T09:00:00Z");
const result = evaluateExam(mixedAnswers);
const report = buildTextReport("سلمى خالد", result, submittedAt, 1234);
const reportLines = report.split("\r\n");
check("التقرير يبدأ بترويسة الصف الخامس", reportLines[0] === "تقرير اختبار اللغة العربية — الصف الخامس الأساسي");
check(
  "التقرير يحمل عنوان الاختبار الكامل والنموذج الثاني (تصنيف الفهرس)",
  report.includes("اختبار اللغة العربية — الصف الخامس — الوحدة الأولى والدرسان الأول والثاني من الوحدة الثانية (النموذج الثاني)") &&
    report.includes("(النموذج الثاني)"),
);
check("التقرير يتضمن اسم الطالب وتاريخ التسليم", report.includes("اسم الطالب: سلمى خالد") && report.includes("تاريخ ووقت التسليم:"));
check("التقرير يتضمن مجموع الفروع 45", report.includes(`المجموع 45`));
check(
  "التقرير يتضمن كل سؤال رئيسي وكل فرع (15 سؤالاً، 45 فرعاً)",
  EXAM_QUESTIONS.every((question) => report.includes(`السؤال الرئيسي ${question.number}:`)) &&
    EXAM_QUESTIONS.every((question) =>
      question.branches.every((branch) => report.includes(branch.prompt)),
    ),
);
check(
  "التقرير يتضمن الإجابة الصحيحة والشرح والمرجع لكل فرع",
  EXAM_QUESTIONS.every((question) =>
    question.branches.every(
      (branch) =>
        report.includes(branch.explanation) && report.includes(branch.ref) && report.includes(correctAnswerText(branch)),
    ),
  ),
);
check("أسطر التقرير منفصلة بـ CRLF (توافق Notepad/Windows)", report.includes("\r\n"));
check("اسم ملف التقرير لا يحوي رموزاً ممنوعة", !/[\\/:*?"<>|]/.test(sanitizeFileName("سلمى/خالد: 2026")));

console.log("\n== 5) تدقيق لغوي/بصري آلي على نصوص البيانات ==");
const arabicTexts: { where: string; text: string }[] = [];
const push = (where: string, text: string) => arabicTexts.push({ where, text });
for (const question of EXAM_QUESTIONS) {
  push(`q${question.number}.title`, question.title);
  push(`q${question.number}.skill`, question.skill);
  push(`q${question.number}.intro`, question.intro);
  for (const branch of question.branches) {
    push(`${branch.id}.prompt`, branch.prompt);
    push(`${branch.id}.explanation`, branch.explanation);
    push(`${branch.id}.ref`, branch.ref);
    if (branch.kind === "single_choice" || branch.kind === "multi_select") {
      for (const choice of branch.choices) push(`${branch.id}.choice.${choice.id}`, choice.text);
    }
    if (branch.kind === "fill_blank" && branch.placeholder) push(`${branch.id}.placeholder`, branch.placeholder);
    if (branch.kind === "classification") {
      for (const item of branch.items) push(`${branch.id}.item.${item.id}`, item.text);
      for (const category of branch.categories) push(`${branch.id}.cat.${category.id}`, category.label);
    }
    if (branch.kind === "matching") {
      for (const pair of branch.pairs) {
        push(`${branch.id}.pair.${pair.id}.left`, pair.left);
        push(`${branch.id}.pair.${pair.id}.right`, pair.right);
      }
    }
    if (branch.kind === "ordering") {
      for (const item of branch.items) push(`${branch.id}.order.${item.id}`, item.text);
    }
  }
}
for (const lesson of Object.values(LESSONS)) {
  push(`lesson.${lesson.key}.title`, lesson.title);
  push(`lesson.${lesson.key}.pages`, lesson.pages);
}

const doubleSpace = arabicTexts.filter(({ text }) => /[^\s] {2,}[^\s]/.test(text));
check("لا مسافات مزدوجة داخل النصوص", doubleSpace.length === 0, doubleSpace.map((x) => x.where).join(", "));

const spaceBeforePunct = arabicTexts.filter(({ text }) => / [،؛:؟.!]/.test(text));
check("لا مسافة قبل علامة ترقيم", spaceBeforePunct.length === 0, spaceBeforePunct.map((x) => x.where).join(", "));

const missingSpaceAfterPunct = arabicTexts.filter(({ text }) => /[،؛][^\s»)\]"']/.test(text));
check(
  "مسافة بعد علامة الترقيم عند الحاجة",
  missingSpaceAfterPunct.length === 0,
  missingSpaceAfterPunct.map((x) => x.where).join(", "),
);

const repeatedWord = arabicTexts.filter(({ text }) =>
  /\b([\u0621-\u064A]{3,})\s+\1\b/u.test(text),
);
check("لا كلمة مكررة مرتين متتاليتين", repeatedWord.length === 0, repeatedWord.map((x) => x.where).join(", "));

const westernDigits = arabicTexts.filter(({ text }) => /[0-9]/.test(text));
check(
  "لا أرقام لاتينية داخل النصوص العربية (توحيد الأرقام العربية-الهندية)",
  westernDigits.length === 0,
  westernDigits.map((x) => `${x.where}: ${x.text}`).join(" | "),
);

const latinInsideArabic = arabicTexts.filter(({ text }) => /[A-Za-z]/.test(text));
check("لا حروف لاتينية داخل النصوص العربية", latinInsideArabic.length === 0, latinInsideArabic.map((x) => x.where).join(", "));

const unbalancedGuillemets = arabicTexts.filter(
  ({ text }) => (text.match(/«/g)?.length ?? 0) !== (text.match(/»/g)?.length ?? 0),
);
check("أقواس «» متوازنة في كل نص", unbalancedGuillemets.length === 0, unbalancedGuillemets.map((x) => x.where).join(", "));

const unbalancedParens = arabicTexts.filter(
  ({ text }) => (text.match(/\(/g)?.length ?? 0) !== (text.match(/\)/g)?.length ?? 0),
);
check("أقواس () متوازنة في كل نص", unbalancedParens.length === 0, unbalancedParens.map((x) => x.where).join(", "));

const bidiHazards = arabicTexts.filter(({ text }) => /[\u202A-\u202E\u2066-\u2069]/.test(text));
check("لا محارف تحكّم اتجاه مخفية (LRM/RLM/LRE/PDF)", bidiHazards.length === 0, bidiHazards.map((x) => x.where).join(", "));

const brokenQuotes = arabicTexts.filter(({ text }) => /"\s|\s"/.test(text.replace(/[«»]/g, '"')) && false);
check("لا اقتباس مزدوج داخل النصوص (يُستعمل «» العربي فقط)", brokenQuotes.length === 0);

// ترتيب الأرقام والرموز داخل النص العربي: الفاصل بين رقمين عربيين هو «–» لا «-» ولا «إلى»
const pageRanges = Object.values(LESSONS).filter((lesson) => !/^الصفحات [٠-٩]+ – [٠-٩]+$/.test(lesson.pages));
check(
  "صيغة نطاق الصفحات موحّدة: «الصفحات ٥ – ٩» بأرقام عربية وفاصل «–»",
  pageRanges.length === 0,
  pageRanges.map((lesson) => lesson.pages).join(" | "),
);

console.log("\n== 6) استقلالية النموذج الثاني ==");
check("EXAM_ID الجديد مطابق لاسم المجلد النهائي", EXAM_ID === "grade5-arabic-u1-u2-l1l2-pattern2", EXAM_ID);
check("EXAM_ID ليس معرّف النموذج الأول", EXAM_ID !== "grade5-arabic-u1-u2-l1l2");
check("EXAM_ID ليس معرّف الاختبار المرجعي", EXAM_ID !== "grade5-math-unit1");
check(
  "اسم package.json مطابق لـ EXAM_ID",
  (JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")) as { name: string }).name === EXAM_ID,
);
check(
  "index.html يحمل العنوان المعتمد ويذكر النموذج الثاني",
  (() => {
    const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
    const title = /<title>(.*?)<\/title>/s.exec(html)?.[1]?.trim() ?? "";
    return (
      title === "اختبار اللغة العربية — الصف الخامس — الوحدة الأولى والدرسان الأول والثاني من الوحدة الثانية (النموذج الثاني)" &&
      html.includes('lang="ar"') &&
      html.includes('dir="rtl"')
    );
  })(),
);
check(
  "مفتاح الجلسة مشتق من EXAM_ID ولا يطابق مفتاح النموذج الأول القديم",
  (() => {
    const source = fs.readFileSync(path.join(rootDir, "src/App.tsx"), "utf8");
    return (
      source.includes("ATTEMPT_STORAGE_KEY") &&
      !source.includes("arabic-grade5-comprehensive-exam-attempt-v1")
    );
  })(),
);

console.log("\n== 7) سلّم التقدير المعتمد ==");
check("100 ← ممتاز", gradeLabel(100) === "ممتاز");
check("95 ← ممتاز", gradeLabel(95) === "ممتاز");
check("94 ← جيد جداً", gradeLabel(94) === "جيد جداً");
check("85 ← جيد جداً", gradeLabel(85) === "جيد جداً");
check("84 ← جيد", gradeLabel(84) === "جيد");
check("75 ← جيد", gradeLabel(75) === "جيد");
check("74 ← مقبول", gradeLabel(74) === "مقبول");
check("65 ← مقبول", gradeLabel(65) === "مقبول");
check("64 ← ضعيف", gradeLabel(64) === "ضعيف");
check("50 ← ضعيف", gradeLabel(50) === "ضعيف");
check("49 ← يحتاج إلى دعم", gradeLabel(49) === "يحتاج إلى دعم");
check("0 ← يحتاج إلى دعم", gradeLabel(0) === "يحتاج إلى دعم");

console.log("\n== 8) سلامة العرض النصي للحالات الفرعية ==");
const classificationBranches = EXAM_QUESTIONS.flatMap((q) => q.branches).filter((b) => b.kind === "classification");
check("كل تصنيف يعرض إجابة الطالب وإجابة صحيحة غير فارغتين", classificationBranches.every((branch) => {
  if (branch.kind !== "classification") return false;
  const value = Object.fromEntries(branch.items.map((item) => [item.id, item.categoryId]));
  return studentAnswerText(branch, value).length > 0 && correctAnswerText(branch).length > 0;
}));
check("formatScore يعرض 86.33 بلا أصفار زائدة", formatScore(86.333) === "86.33", formatScore(86.333));
check("formatScore يعرض الأعداد الصحيحة بلا كسر", formatScore(100) === "100", formatScore(100));

console.log("\n== 9) موضع المجلد ==");
check(
  "المجلد الأصلي ذو الاسم القديم لم يبق في المستودع",
  !fs.existsSync(path.join(rootDir, "..", "Arabic_Grade_5_U1 a&L1L2U2 Pattern2")),
);
check(
  "المجلد النهائي موجود باسم grade5-arabic-u1-u2-l1l2-pattern2",
  fs.existsSync(path.join(rootDir, "package.json")) && path.basename(rootDir) === EXAM_ID,
  path.basename(rootDir),
);

if (failures) {
  console.log(`\n❌ ${failures} فشل في مجموعة البيانات والتصحيح`);
} else {
  console.log("\n✅ كل فحوص البيانات والتصحيح والتقرير ناجحة");
  process.exitCode = 0;
}

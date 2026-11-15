import baselineRaw from "./fixtures/baseline.json";
import { EXAM_DATA } from "../src/data/questions/examQuestions";
import { LESSONS } from "../src/data/curriculum/lessons";
import { normalizeArabic, performanceLevel, scoreSubpart, type SubpartResult } from "../src/utils/scoring";
import { buildTxtReport } from "../src/utils/report";

interface BaselineSubpart {
  studentAnswer: string;
  earned: number;
  maxMarks: number;
  correct: boolean;
  partial: boolean;
}

interface BaselineScenario {
  answers: Record<string, string>;
  expected: {
    totalEarned: number;
    totalMax: number;
    pct: number;
    level: string;
    grammarEarned: number;
    grammarMax: number;
    spellingEarned: number;
    spellingMax: number;
    correctCount: number;
    partialCount: number;
    wrongCount: number;
    unansweredCount: number;
    lessonStats: {
      lessonId: string;
      earned: number;
      max: number;
      grammarEarned: number;
      grammarMax: number;
      spellingEarned: number;
      spellingMax: number;
    }[];
    bySub: Record<string, BaselineSubpart>;
  };
}

interface BaselineFixture {
  totalQuestions: number;
  totalSubparts: number;
  totalMarks: number;
  lessons: typeof LESSONS;
  questions: typeof EXAM_DATA.questions;
  scenarios: Record<string, BaselineScenario>;
  sampleReport: string;
}

const baseline = baselineRaw as unknown as BaselineFixture;

let failures = 0;
process.exitCode = 1;
const check = (name: string, cond: boolean, detail = "") => {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (detail ? " → " + detail : ""));
  } else {
    console.log("  ✓ " + name);
  }
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// دالة التصحيح الأصلية حرفيًا من الالتزام 9e3b8af29c4 للتحقق من عدم تغيّر أي فرع آخر
function originalScoreSubpart(sp: (typeof EXAM_DATA.questions)[number]["subparts"][number], answer: string): SubpartResult {
  const ans = (answer ?? "").trim();
  if (!ans) return { subpart: sp, studentAnswer: ans, earned: 0, correct: false, partial: false };
  if (sp.type === "mcq" || sp.type === "select") {
    const ok = normalizeArabic(ans) === normalizeArabic(sp.correctAnswer);
    return { subpart: sp, studentAnswer: ans, earned: ok ? sp.maxMarks : 0, correct: ok, partial: false };
  }
  if (sp.type === "fill" || sp.type === "correct") {
    const strict = !!sp.strictHamza;
    const candidates = [sp.correctAnswer, ...(sp.acceptedAnswers ?? [])];
    const normAns = normalizeArabic(ans, strict);
    const hit = candidates.some((c) => {
      const n = normalizeArabic(c, strict);
      return n === normAns || normAns.includes(n) || n.includes(normAns);
    });
    return { subpart: sp, studentAnswer: ans, earned: hit ? sp.maxMarks : 0, correct: hit, partial: false };
  }
  const kws = sp.keywords ?? [];
  if (kws.length === 0) {
    const ok = normalizeArabic(ans, true).includes(normalizeArabic(sp.correctAnswer, true).slice(0, 8));
    return { subpart: sp, studentAnswer: ans, earned: ok ? sp.maxMarks : 0, correct: ok, partial: false };
  }
  const normAns = normalizeArabic(ans, true);
  const matched = kws.filter((k) => normAns.includes(normalizeArabic(k, true))).length;
  const ratio = matched / kws.length;
  let earned = Math.round(ratio * sp.maxMarks * 2) / 2;
  if (ans.length < 4) earned = 0;
  const correct = earned >= sp.maxMarks;
  const partial = earned > 0 && !correct;
  return { subpart: sp, studentAnswer: ans, earned, correct, partial };
}

function gradeAll(answers: Record<string, string>) {
  const resultsMap = new Map<string, SubpartResult>();
  const bySub: Record<string, BaselineSubpart> = {};
  let totalEarned = 0, totalMax = 0, grammarEarned = 0, grammarMax = 0, spellingEarned = 0, spellingMax = 0;
  const lessonMap = new Map<
    string,
    { lessonId: string; earned: number; max: number; grammarEarned: number; grammarMax: number; spellingEarned: number; spellingMax: number }
  >();
  for (const l of LESSONS) {
    lessonMap.set(l.id, { lessonId: l.id, earned: 0, max: 0, grammarEarned: 0, grammarMax: 0, spellingEarned: 0, spellingMax: 0 });
  }
  for (const q of EXAM_DATA.questions) {
    const ls = lessonMap.get(q.lessonId)!;
    for (const sp of q.subparts) {
      const r = scoreSubpart(sp, answers[sp.id] ?? "");
      resultsMap.set(sp.id, r);
      bySub[sp.id] = {
        studentAnswer: r.studentAnswer,
        earned: r.earned,
        maxMarks: sp.maxMarks,
        correct: r.correct,
        partial: r.partial,
      };
      totalEarned += r.earned;
      totalMax += sp.maxMarks;
      ls.earned += r.earned;
      ls.max += sp.maxMarks;
      if (q.category === "grammar") {
        grammarEarned += r.earned;
        grammarMax += sp.maxMarks;
        ls.grammarEarned += r.earned;
        ls.grammarMax += sp.maxMarks;
      } else {
        spellingEarned += r.earned;
        spellingMax += sp.maxMarks;
        ls.spellingEarned += r.earned;
        ls.spellingMax += sp.maxMarks;
      }
    }
  }
  const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;
  const correctCount = Object.values(bySub).filter((r) => r.correct).length;
  const partialCount = Object.values(bySub).filter((r) => r.partial).length;
  const wrongCount = Object.values(bySub).filter((r) => !r.correct && !r.partial).length;
  const unansweredCount = Object.values(bySub).filter((r) => !r.studentAnswer).length;
  const lessonStats = [...lessonMap.values()];
  return {
    totalEarned,
    totalMax,
    pct,
    level: performanceLevel(pct),
    grammarEarned,
    grammarMax,
    spellingEarned,
    spellingMax,
    correctCount,
    partialCount,
    wrongCount,
    unansweredCount,
    lessonStats,
    bySub,
    resultsMap,
  };
}

// 1) بنية الاختبار والأعداد وتوزيع الدرجات
check("عدد الأسئلة الرئيسية 30 والفروع 70 والدرجات 100", EXAM_DATA.questions.length === 30 && EXAM_DATA.totalSubparts === 70 && EXAM_DATA.totalMarks === 100);
check("الدروس الخمسة مطابقة للنسخة الأصلية", same(LESSONS, baseline.lessons));

// مقارنة الأسئلة حرفيًا بعد عكس العلم التقني الموثق strictHamza على q10b وحده (وليس q10a الذي أُعيد إلى الأصل)
const normalizedQuestions = EXAM_DATA.questions.map((q) => ({
  ...q,
  subparts: q.subparts.map((sp) => {
    if (sp.id === "q10b") {
      const copy = { ...sp };
      delete copy.strictHamza;
      return copy;
    }
    return sp;
  }),
}));
check(
  "جميع الأسئلة والترتيب والخيارات والإجابات الصحيحة والعلامات مطابقة للـBaseline حرفيًا (التغيير الوحيد في البيانات هو strictHamza: true على q10b)",
  same(normalizedQuestions, baseline.questions),
);

// التحقق من أن جميع العلامات والإجابات الصحيحة في كل فرع من الفروع الـ70 مطابقة حرفيًا للأصل
const allMarksAndCorrectUnchanged = EXAM_DATA.questions.every((q, qi) =>
  q.subparts.every((sp, si) => {
    const orig = baseline.questions[qi].subparts[si];
    return (
      sp.id === orig.id &&
      sp.maxMarks === orig.maxMarks &&
      sp.correctAnswer === orig.correctAnswer &&
      same(sp.options, orig.options) &&
      same(sp.acceptedAnswers, orig.acceptedAnswers)
    );
  }),
);
check("لم تتغير العلامة أو الإجابة الصحيحة أو الخيارات في أي فرع من الفروع الـ70", allMarksAndCorrectUnchanged);

// 2) اختبارات مباشرة لكل خيار في q10b و q10a وعزل أثر strictHamza
{
  const q10 = EXAM_DATA.questions.find((q) => q.id === "q10")!;
  const q10a = q10.subparts.find((s) => s.id === "q10a")!;
  const q10b = q10.subparts.find((s) => s.id === "q10b")!;

  // اختبار مباشر لكل خيار من الخيارات الأربعة في q10b (حيث الإصلاح مُثبَت بـ strictHamza: true)
  const bOpt0 = scoreSubpart(q10b, "أغلقَ – أغلقْ – إغلاق");
  const bOpt1 = scoreSubpart(q10b, "أغلقَ – أغلقْ – أغلاق");
  const bOpt2 = scoreSubpart(q10b, "أغلقَ – إغلقْ – إغلاق");
  const bOpt3 = scoreSubpart(q10b, "أغلقَ – أغلقْ – غلق");
  check("q10b — يقبل الخيار الصحيح «أغلقَ – أغلقْ – إغلاق» ويمنح 1 / 1", bOpt0.correct === true && bOpt0.earned === 1);
  check("q10b — يرفض المشتت الإملائي «أغلقَ – أغلقْ – أغلاق» (0 / 1)", bOpt1.correct === false && bOpt1.earned === 0);
  check("q10b — يرفض المشتت الإملائي «أغلقَ – إغلقْ – إغلاق» (0 / 1)", bOpt2.correct === false && bOpt2.earned === 0);
  check("q10b — يرفض المشتت «أغلقَ – أغلقْ – غلق» (0 / 1)", bOpt3.correct === false && bOpt3.earned === 0);

  // اختبار مباشر لسلوك q10a الأصلي المُعاد دون تعديل (لأن الخيار الثالث «أكلَ – أكلٌ» يطابق الإجابة بعد حذف التنوين في normalizeArabic حتى مع strictHamza: true)
  check("q10a — أُعيد إلى سلوكه الأصلي دون strictHamza", q10a.strictHamza === undefined);
  for (const opt of q10a.options ?? []) {
    const cur = scoreSubpart(q10a, opt);
    const orig = originalScoreSubpart(q10a, opt);
    check(`q10a — الخيار «${opt}» يطابق سلوك الدالة الأصلية حرفيًا (${cur.earned}/${q10a.maxMarks})`, same(cur, orig));
  }

  // إثبات أن جميع أسئلة mcq/select الـ46 الأخرى (غير q10b) لا تملك strictHamza وتطابق الدالة الأصلية على كل خياراتها والمدخلات الفارغة والخاطئة
  let allOther69Identical = true;
  for (const q of EXAM_DATA.questions) {
    for (const sp of q.subparts) {
      if (sp.id === "q10b") continue;
      if ((sp.type === "mcq" || sp.type === "select") && sp.strictHamza !== undefined) {
        allOther69Identical = false;
      }
      const probeInputs = [
        "",
        "   ",
        sp.correctAnswer,
        ...(sp.options ?? []),
        ...(sp.acceptedAnswers ?? []),
        "إجابة تجريبية خاطئة",
        "أإآىة",
      ];
      for (const inp of probeInputs) {
        const cur = scoreSubpart(sp, inp);
        const orig = originalScoreSubpart(sp, inp);
        if (!same(cur, orig)) {
          allOther69Identical = false;
          console.log(`    ! اختلاف غير متوقع في ${sp.id} عند الإدخال ${JSON.stringify(inp)}`);
        }
      }
    }
  }
  check(
    "إثبات العزل التام: جميع الفروع الـ69 الأخرى (select, mcq, fill, correct, free) تطابق تصحيح النسخة الأصلية حرفيًا على كافة المدخلات",
    allOther69Identical,
  );
}

// التحقق من فريدية الخيار الصحيح في جميع أسئلة mcq/select باستثناء الملاحظة الموثقة للمراجعة البشرية في q10a
let mcqUniqueExceptQ10a = true;
for (const q of EXAM_DATA.questions) {
  for (const sp of q.subparts) {
    if (sp.id === "q10a") continue;
    if (sp.type === "mcq" || sp.type === "select") {
      const opts = sp.options ?? [];
      const winners = opts.filter((o) => scoreSubpart(sp, o).correct);
      if (winners.length !== 1 || winners[0] !== sp.correctAnswer) {
        mcqUniqueExceptQ10a = false;
        console.log(`    ! خلل في خيارات ${sp.id}: الفائزون = ${JSON.stringify(winners)}`);
      }
    }
  }
}
check("جميع فروع الاختيار المفرد الـ46 (كلها عدا ملاحظة q10a الموثقة) تقبل الخيار الصحيح وحده وترفض كل مشتت", mcqUniqueExceptQ10a);

// 3) مقارنة التصحيح مع الـBaseline في الحالات الخمس: كاملة، فارغة، خاطئة، مختلطة، جزئية
for (const name of ["full", "empty", "partial"] as const) {
  const sc = baseline.scenarios[name];
  const { resultsMap: _m, ...actual } = gradeAll(sc.answers);
  check(`مطابقة التصحيح التفصيلي للـBaseline في حالة (${name})`, same(actual, sc.expected), `earned=${actual.totalEarned} vs baseline=${sc.expected.totalEarned}`);
}

// في حالة wrong: q10a أُعيد للأصل (+2 على «أكلَ – إكل»)، بينما q10b أُصلح بـ strictHamza (0 بدل +1)، فالمجموع 2 / 100 وتطابق كامل للـ69 فرعًا الأخرى
{
  const sc = baseline.scenarios.wrong;
  const { resultsMap: _m, ...actual } = gradeAll(sc.answers);
  check("في حالة (wrong): مجموع الدرجات يطابق الـBaseline باستثناء إصلاح الدرجة الواحدة في q10b (2 / 100 مقابل 3 / 100)", actual.totalEarned === 2 && sc.expected.totalEarned === 3);
  const other69Match = Object.keys(sc.expected.bySub)
    .filter((id) => id !== "q10b")
    .every((id) => same(actual.bySub[id], sc.expected.bySub[id]));
  check("في حالة (wrong): تطابق كامل للفروع الـ69 الأخرى (بما فيها q10a) مع الـBaseline", other69Match);
}

// في حالة mixed: q10b كانت ضمن الفروع المجابة بخطأ (34.5 بدل 35.5 بسبب إصلاح الدرجة الواحدة في q10b)، والـ69 فرعًا الأخرى متطابقة تمامًا
{
  const sc = baseline.scenarios.mixed;
  const { resultsMap: _m, ...actual } = gradeAll(sc.answers);
  check(
    "في حالة (mixed): تطابق كامل مع الـBaseline باستثناء فرق الدرجة الواحدة الموثق في q10b (34.5 مقابل 35.5)",
    actual.totalEarned === 34.5 && sc.expected.totalEarned === 35.5,
  );
  const other69Match = Object.keys(sc.expected.bySub)
    .filter((id) => id !== "q10b")
    .every((id) => same(actual.bySub[id], sc.expected.bySub[id]));
  check("في حالة (mixed): تطابق كامل للفروع الـ69 الأخرى مع الـBaseline", other69Match);
}

// حالة إجابات نموذجية تستوفي جميع الكلمات المفتاحية فتحقق 100 / 100
{
  const perfectAnswers: Record<string, string> = { ...baseline.scenarios.full.answers };
  perfectAnswers.q6b = "تُكتب همزة قطع لأنها تُنطق في أول الكلام وفي وصله.";
  perfectAnswers.q12b = "همزة قطع لأنها تُنطق في أول الكلام وفي وصله.";
  perfectAnswers.q15b = "رسمتْ سارةُ لوحةً جميلةً.";
  const perfect = gradeAll(perfectAnswers);
  check("حالة الإجابات النموذجية التامة تحقق 100 / 100 (70 فرعًا صحيحًا)", perfect.totalEarned === 100 && perfect.correctCount === 70 && perfect.partialCount === 0);
}

// 4) مقارنة التقرير النصي مع الـBaseline (باستثناء سطري العنوان/الوصف المحدثين وسطر إشعار الإرسال المضاف)
{
  const fullGraded = gradeAll(baseline.scenarios.full.answers);
  const report = buildTxtReport({
    studentName: "طالبة تجريبية",
    questions: EXAM_DATA.questions,
    results: fullGraded.resultsMap,
    totalEarned: fullGraded.totalEarned,
    totalMax: fullGraded.totalMax,
    grammarEarned: fullGraded.grammarEarned,
    grammarMax: fullGraded.grammarMax,
    spellingEarned: fullGraded.spellingEarned,
    spellingMax: fullGraded.spellingMax,
    durationMs: 754000,
    submittedAt: new Date("2026-11-15T10:00:00.000Z"),
    lessonStats: fullGraded.lessonStats,
  });

  const stripExpectedDiffs = (txt: string) =>
    txt
      .split("\n")
      .filter((line) => !line.startsWith("أُنشئ هذا التقرير في المتصفح"))
      .map((line, i) => {
        if (i === 1) return "HEADER_TITLE";
        if (i === 2) return "HEADER_SUBTITLE";
        if (line.startsWith("تاريخ ووقت التسليم:")) return "SUBMITTED_AT";
        return line;
      })
      .join("\n");

  check("محتوى التقرير النصي مطابق للـBaseline في جميع الدرجات والأسئلة والفروع والشروح", stripExpectedDiffs(report) === stripExpectedDiffs(baseline.sampleReport));
  check("التقرير النصي يتضمن عنوان النموذج الثالث وإشعار إرسال النتيجة", report.includes("نموذج ثالث") && report.includes("Google Sheets"));
}

console.log(failures === 0 ? "data & baseline suite OK" : `${failures} failure(s)`);
if (failures === 0) process.exitCode = 0;

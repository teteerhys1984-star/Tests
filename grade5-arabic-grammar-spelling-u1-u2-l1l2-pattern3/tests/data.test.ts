import baselineRaw from "./fixtures/baseline.json";
import { EXAM_DATA } from "../src/data/questions/examQuestions";
import { LESSONS } from "../src/data/curriculum/lessons";
import { performanceLevel, scoreSubpart, type SubpartResult } from "../src/utils/scoring";
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

// مقارنة الأسئلة حرفيًا بعد عكس العلم التقني الموثق strictHamza على q10a و q10b فقط
const normalizedQuestions = EXAM_DATA.questions.map((q) => ({
  ...q,
  subparts: q.subparts.map((sp) => {
    if (sp.id === "q10a" || sp.id === "q10b") {
      const copy = { ...sp };
      delete copy.strictHamza;
      return copy;
    }
    return sp;
  }),
}));
check("جميع الأسئلة والترتيب والخيارات والإجابات الصحيحة والعلامات مطابقة للـBaseline حرفيًا", same(normalizedQuestions, baseline.questions));

// التحقق من عدم قبول خيارات خاطئة في أسئلة الاختيار من متعدد (خصوصًا إصلاح q10a و q10b)
let mcqUniqueOk = true;
for (const q of EXAM_DATA.questions) {
  for (const sp of q.subparts) {
    if (sp.type === "mcq" || sp.type === "select") {
      const opts = sp.options ?? [];
      const winners = opts.filter((o) => scoreSubpart(sp, o).correct);
      if (winners.length !== 1 || winners[0] !== sp.correctAnswer) {
        mcqUniqueOk = false;
        console.log(`    ! خلل في خيارات ${sp.id}: الفائزون = ${JSON.stringify(winners)}`);
      }
    }
  }
}
check("كل سؤال اختيار مفرد يقبل الخيار الصحيح وحده ويرفض جميع المشتتات (بما فيها q10a و q10b)", mcqUniqueOk);

// 2) مقارنة التصحيح مع الـBaseline في الحالات الخمس: كاملة، فارغة، خاطئة، مختلطة، جزئية
for (const name of ["full", "empty", "partial"] as const) {
  const sc = baseline.scenarios[name];
  const { resultsMap: _m, ...actual } = gradeAll(sc.answers);
  check(`مطابقة التصحيح التفصيلي للـBaseline في حالة (${name})`, same(actual, sc.expected), `earned=${actual.totalEarned} vs baseline=${sc.expected.totalEarned}`);
}

// في حالة wrong: في الـBaseline الأصلي منحت q10a (+2) و q10b (+1) درجة خاطئة لخيارات همزة خاطئة بسبب غياب strictHamza؛ بعد الإصلاح تصبح جميع الخيارات الخاطئة = 0/100، بينما تتطابق سائر الفروع الـ68 حرفيًا
{
  const sc = baseline.scenarios.wrong;
  const { resultsMap: _m, ...actual } = gradeAll(sc.answers);
  check("في حالة (wrong): مجموع الدرجات بعد إصلاح ثغرة همزة q10a/q10b يساوي 0 / 100 بدل 3 / 100", actual.totalEarned === 0 && sc.expected.totalEarned === 3);
  const other68Match = Object.keys(sc.expected.bySub)
    .filter((id) => id !== "q10a" && id !== "q10b")
    .every((id) => same(actual.bySub[id], sc.expected.bySub[id]));
  check("في حالة (wrong): تطابق كامل للفروع الـ68 الأخرى مع الـBaseline", other68Match);
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

// 3) مقارنة التقرير النصي مع الـBaseline (باستثناء سطري العنوان/الوصف المحدثين وسطر إشعار الإرسال المضاف)
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

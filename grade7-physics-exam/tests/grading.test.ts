/**
 * التصحيح لم يتغيّر بإضافة الإرسال.
 *
 * tests/fixtures/grading-golden.json سُجّل من النسخة الأصلية المرفوعة للاختبار (انظر
 * tests/make-golden.ts). هذا الملف يصحّح أوراق الإجابة نفسها بالكود الحالي ويشترط تطابق
 * النتائج: كل علامة، وكل حالة، وكل نص في صفحة النتيجة، وتقرير TXT كاملاً (عدا السطر الواحد
 * الذي أُعيدت صياغته لأنّه كان ينفي الإرسال).
 *
 * ويشترط كذلك أن يكون بنك الأسئلة (exam-data.js) وتقرير TXT (report.js، عدا ذلك السطر) مطابقين
 * حرفياً للنسخة الأصلية، فلا يمكن أن يكون قد تغيّر سؤال أو إجابة أو قاعدة تصحيح من دون أن يُكتشف.
 */
// @ts-nocheck — exam-data.js و report.js ملفّا JavaScript أصليّان بلا أنواع
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { QUESTIONS, GRAPHS, EXAM_META, TEACHER_PASSWORD, PART_LABELS } from "../src/exam-data.js";
import * as R from "../src/report.js";
import {
  CURRENT_REPORT_NOTE,
  FILE_EDITS,
  GOLDEN_FILE,
  ORIGINAL_REPORT_NOTE,
  describeSheet,
  fullResult,
  reportFor,
  withFixedClock,
  type SheetRecord,
} from "./golden";
import { EXAM_DIR, check, equal, finish, section, sha256 } from "./harness";
import { PARTS, makeSheets } from "./sheets";

R.bindGraphs(GRAPHS);

const golden = JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) as {
  recordedFrom: { commit: string; path: string; files: Record<string, string> };
  bank: {
    questions: number;
    parts: number;
    totalMarks: number;
    partsPerQuestion: number[];
    examId: string;
    reportFile: string;
  };
  sheets: SheetRecord[];
};
const sheets = makeSheets();

section("== 1) الورقة: الحجم نفسه والملفات نفسها كالنسخة الأصلية ==");
equal("عدد الأسئلة الرئيسية", QUESTIONS.length, golden.bank.questions);
equal(`عدد الأجزاء المقوّمة (${PARTS.length})`, PARTS.length, golden.bank.parts);
equal("عدد الأسئلة في بيانات الاختبار", EXAM_META.totalQuestions, golden.bank.questions);
equal("مجموع العلامات", QUESTIONS.reduce((sum: number, q: any) => sum + q.marks, 0), golden.bank.totalMarks);
equal("مجموع العلامات في بيانات الاختبار", EXAM_META.totalMarks, golden.bank.totalMarks);
equal(
  "علامات أجزاء كل سؤال تساوي علامة السؤال",
  QUESTIONS.filter((q: any) => q.parts.reduce((sum: number, p: any) => sum + p.marks, 0) !== q.marks).map((q: any) => q.id),
  []
);
equal("عدد أجزاء كل سؤال كالأصل", QUESTIONS.map((q: any) => q.parts.length), golden.bank.partsPerQuestion);
equal(
  "كل معرّف جزء فريد ويظهر في سؤال واحد فقط",
  PARTS.filter((part: any) => QUESTIONS.filter((q: any) => q.parts.includes(part)).length !== 1).map((part: any) => part.id),
  []
);
equal("كل جزء له شرح ومرجع داخلي", PARTS.filter((part: any) => !part.explanation || !part.ref).map((part: any) => part.id), []);
equal(
  "كل اختيار من متعدد فيه إجابته الصحيحة بين الخيارات",
  PARTS.filter((part: any) => part.kind === "mc" && !part.options.includes(part.answer)).map((part: any) => part.id),
  []
);
equal(
  "كل وصل فيه إجابته الصحيحة بين المصطلحات",
  PARTS.filter((part: any) => part.kind === "match" && !part.matchOptions.includes(part.matchAnswer)).map((part: any) => part.id),
  []
);
equal(
  "كل فراغ له إجابات مقبولة",
  PARTS.filter((part: any) => part.kind === "blank" && !(part.accept ?? []).length).map((part: any) => part.id),
  []
);
equal(
  "كل مسألة رقمية لها قيمة متوقعة ووحدة",
  PARTS.filter((part: any) => part.kind === "numeric" && (typeof part.numeric?.expected !== "number" || !part.numeric?.unit)).map(
    (part: any) => part.id
  ),
  []
);
equal(
  "كل سؤال صح/خطأ له حكم صحيح وقواعد تصحيح",
  PARTS.filter(
    (part: any) =>
      part.kind === "tf" &&
      (typeof part.tfAnswer !== "boolean" ||
        (part.tfAnswer === false && (!part.correctionKeywords?.length || !part.correctionText)))
  ).map((part: any) => part.id),
  []
);
equal(
  "أوزان الكلمات المفتاحية في الأسئلة النصية لا تتجاوز 1",
  PARTS.filter(
    (part: any) => part.kind === "text" && (part.keywords ?? []).reduce((sum: number, kw: any) => sum + kw.w, 0) > 1 + 1e-9
  ).map((part: any) => part.id),
  []
);
check("ملف التقرير TXT بالاسم نفسه", R.makeFileName("سارة أحمد") === golden.bank.reportFile, golden.bank.reportFile);
check(
  "معرّف الاختبار الداخلي في التقرير لم يتغيّر (G7-PHYS-U1L1 v1)",
  EXAM_META.examId === "G7-PHYS-U1L1" && EXAM_META.version === 1 && reportFor(sheets[0]).includes("G7-PHYS-U1L1 v1"),
  EXAM_META.examId
);
equal("حروف الأجزاء العربية كما كانت", PART_LABELS, ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"]);

section("== 2) الملفات: بنك الأسئلة والتقرير مطابقان حرفياً للأصل ==");
{
  const hashOf = (relative: string) => sha256(readFileSync(path.join(EXAM_DIR, relative), "utf8"));
  const originalHashes = golden.recordedFrom.files;
  // كل ملف من النسخة الأصلية: إما مطابق حرفياً، أو أن اسمه في مجلد الإرسال الجديد (لم يكن في الأصل أصلاً)
  const currentFiles: string[] = [];
  for (const base of ["src"]) {
    for (const entry of readdirSync(path.join(EXAM_DIR, base), { recursive: true } as any) as string[]) {
      const relative = base + "/" + String(entry).split(path.sep).join("/");
      if (relative.endsWith(".ts") || relative.endsWith(".tsx") || relative.endsWith(".js")) currentFiles.push(relative);
    }
  }
  equal(
    "لا ملف مصدر جديد غير ملفات الإرسال (config.ts, submit.ts)",
    currentFiles.filter((relative) => !(relative in originalHashes)).sort(),
    ["src/config.ts", "src/submit.ts"]
  );
  equal("exam-data.js لم يتغيّر حرفياً (كل الأسئلة والإجابات وقواعد التصحيح)", hashOf("src/exam-data.js") === originalHashes["src/exam-data.js"], true);
  equal("index.html لم يتغيّر حرفياً", hashOf("index.html") === originalHashes["index.html"], true);
  equal("main.tsx لم يتغيّر حرفياً", hashOf("src/main.tsx") === originalHashes["src/main.tsx"], true);
  equal("utils/cn.ts لم يتغيّر حرفياً", hashOf("src/utils/cn.ts") === originalHashes["src/utils/cn.ts"], true);
  // report.js: كل ما فيه عدا التعديلين المسجّلين (تصدير الجدول + سطر الملاحظة) مطابق للأصل حرفياً.
  const current = readFileSync(path.join(EXAM_DIR, "src/report.js"), "utf8");
  let restored = current;
  for (const edit of FILE_EDITS["src/report.js"]) restored = restored.split(edit.to).join(edit.from);
  equal("report.js يطابق الأصل بعد إعادة تعديلَي التصدير والملاحظة", sha256(restored) === originalHashes["src/report.js"], true);
  equal(
    "كل تعديل مسجّل موجود فعلاً في الملف",
    FILE_EDITS["src/report.js"].filter((edit) => !current.includes(edit.to)).map((edit) => edit.what),
    []
  );
  check(
    "التغيير في report.js محصور في هذين التعديلين",
    current.includes(CURRENT_REPORT_NOTE) && !current.includes(ORIGINAL_REPORT_NOTE) && current.includes("export const STATUS_AR = {")
  );
}

section("== 3) التصحيح: النتيجة نفسها لكل أوراق الإجابة المسجّلة ==");
equal("عدد أوراق الإجابة المسجّلة", sheets.length, golden.sheets.length);
check("على الأقل 250 ورقة إجابة", golden.sheets.length >= 250, String(golden.sheets.length));
const now = sheets.map((sheet) => describeSheet(sheet, { from: CURRENT_REPORT_NOTE, to: ORIGINAL_REPORT_NOTE }));
const differing = now.filter((record, index) => JSON.stringify(record) !== JSON.stringify(golden.sheets[index]));
equal(
  "لا تختلف أي ورقة عن مرجعها",
  differing.map((record) => record.name),
  []
);
equal("علامات كل جزء مطابقة", now.every((r, i) => r.marks === golden.sheets[i].marks), true);
equal("علامات كل سؤال مطابقة", now.every((r, i) => r.questions === golden.sheets[i].questions), true);
equal("حالة كل جزء مطابقة", now.every((r, i) => r.status === golden.sheets[i].status), true);
equal("الدرجة والنسبة مطابقتان", now.every((r, i) => r.score === golden.sheets[i].score && r.percentage === golden.sheets[i].percentage), true);
equal("كل نص في صفحة النتيجة مطابق", now.every((r, i) => r.result === golden.sheets[i].result), true);
equal("تقرير TXT مطابق (عدا سطر الملاحظة)", now.every((r, i) => r.report === golden.sheets[i].report), true);

section("== 4) تغطية الحالات: صحيحة · فارغة · خاطئة · مختلطة · جزئية ==");
const byName = Object.fromEntries(golden.sheets.map((sheet) => [sheet.name, sheet]));
equal("ورقة كل الإجابات الصحيحة: 100/100 وكل الأجزاء صحيحة", [byName["all-correct"].score, byName["all-correct"].counts], [100, [PARTS.length, 0, 0, 0]]);
equal("ورقة فارغة تماماً: 0 وكل الأجزاء بلا إجابة", [byName["blank"].score, byName["blank"].counts], [0, [0, 0, 0, PARTS.length]]);
equal("ورقة كل الإجابات خاطئة: 0 وكل الأجزاء خاطئة", [byName["all-wrong"].score, byName["all-wrong"].counts], [0, [0, 0, PARTS.length, 0]]);
check(
  "على الأقل 40 ورقة فيها علامة جزئية",
  golden.sheets.filter((sheet) => sheet.counts[1] > 0).length >= 40,
  String(golden.sheets.filter((sheet) => sheet.counts[1] > 0).length)
);
check(
  "على الأقل 100 ورقة فيها أجزاء بلا إجابة",
  golden.sheets.filter((sheet) => sheet.counts[3] > 0).length >= 100,
  String(golden.sheets.filter((sheet) => sheet.counts[3] > 0).length)
);
check(
  "على الأقل 30 ورقة فيها الأجزاء الأربعة معاً",
  golden.sheets.filter((sheet) => sheet.counts.every((count) => count > 0)).length >= 30,
  String(golden.sheets.filter((sheet) => sheet.counts.every((count) => count > 0)).length)
);
check(
  "علامات جزئية في كل نوع يمكن أن يحصل فيه على جزء من العلامة (صح/خطأ + نص)",
  ["partial:q2a#0", "partial:q2c#0", "partial:q5e#0", "partial:q6d#0"].every((name) => byName[name]?.counts[1] === 1),
  ["q2a", "q2c", "q5e", "q6d"].map((id) => byName["partial:" + id + "#0"]?.score).join(", ")
);
check("ورقة كل العلامات الجزئية تعطي درجة بين 0 و100", byName["all-partials"].score > 0 && byName["all-partials"].score < 100, String(byName["all-partials"].score));

section("== 5) التقرير: النصوص الأصلية موجودة ولا تقدير فيه ==");
{
  const sheet = sheets.find((s) => s.name === "mixed:7")!;
  const report = reportFor(sheet);
  const results = withFixedClock(() => R.gradeExam(sheet.order.map((i) => QUESTIONS[i]), sheet.answers));
  check("التقرير يذكر الطالبة ومعرّف المحاولة", report.includes("سارة أحمد") && report.includes("golden-mixed:7"));
  check("التقرير يحوي الدرجة والنسبة نفسيهما", report.includes(`${results.score} من 100`) && report.includes(results.percent.toFixed(1) + "%"));
  check("التقرير يذكر عدد الأجزاء الأربع", ["عدد الأجزاء الصحيحة:", "عدد الأجزاء الصحيحة جزئياً:", "عدد الأجزاء غير الصحيحة:", "عدد الأجزاء بدون إجابة:"].every((line) => report.includes(line)));
  check("التقرير يحوي كل أسئلة الكتاب الاثني عشر", QUESTIONS.every((q: any) => report.includes(q.title)));
  check("التقرير يحوي المرجع الداخلي لكل جزء", PARTS.every((part: any) => report.includes(part.ref)));
  check("التقرير يذكر السطر المصحَّح عن الإرسال", report.includes(CURRENT_REPORT_NOTE));
  check("العبارة القديمة التي تنفي الإرسال لم تبق", !report.includes(ORIGINAL_REPORT_NOTE) && !report.includes("لم يُرسل إلى أي جهة خارجية"));
  // سلّم التقدير الخاص بالمرجع (grade5-math-unit1) لا يُكتب في تقرير الطالب.
  const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
  const labels = ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"];
  check("لا تقدير في تقرير الطالب", labels.every((word) => !wholeWord(word).test(report)), labels.filter((word) => wholeWord(word).test(report)).join("، "));
  check("كلمة مرور المعلم لا تُكتب في التقرير", !report.includes(TEACHER_PASSWORD));
  check("التقرير هو نص تقرير الاختبار نفسه المستخدم في الحمولة", report === reportFor(sheet));
}

section("== 6) التصحيح الكامل يساوي مجموع العلامات، والحالات متسقة ==");
{
  const all = withFixedClock(() => R.gradeExam(QUESTIONS, sheets[0].answers));
  equal("كل الإجابات الصحيحة = 100", fullResult(all).score, 100);
  equal("لا حالة جزئية ولا خاطئة ولا فارغة", [all.counts.correct, all.counts.partial, all.counts.incorrect, all.counts.unanswered], [PARTS.length, 0, 0, 0]);
  const empty = withFixedClock(() => R.gradeExam(QUESTIONS, {}));
  equal("لا إجابات = 0", empty.score, 0);
  equal("كل الأجزاء بلا إجابة", empty.counts.unanswered, PARTS.length);
  const blank = withFixedClock(() => R.gradeExam(QUESTIONS, {}));
  check("النسبة المئوية صفر", blank.percent === 0);
  check("عدد الأجزاء يساوي عدد أجزاء البنك", R.totalParts(QUESTIONS) === PARTS.length, String(R.totalParts(QUESTIONS)));
}

finish("grading");

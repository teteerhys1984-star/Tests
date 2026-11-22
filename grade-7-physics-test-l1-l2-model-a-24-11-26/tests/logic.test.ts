/**
 * اختبارات التصحيح والتقرير والملخّص — للنموذج A.
 *
 * يتحقّق من:
 *   · التصحيح الكامل: إجابات المفتاح النموذجية ← 100/100.
 *   · التصحيح الجزئي: كل حقل على حدة، وعلامة جزئية في الإجابات القصيرة والعددية وصح/خطأ.
 *   · الخطأ: صفر لكل حقل خاطئ، والصفر لا يُخلط بعدم الإجابة.
 *   · عدم الإجابة: صفر مع حالة «لم تُجب» وعدم اكتمال الاختبار.
 *   · النسبة والتقدير وسلّم التقدير عند الحدود.
 *   · صحة نصوص مفتاح الإجابة نفسها (النصّ النموذجي يستوفي معاييره).
 *   · التقرير TXT: اكتماله، توزيعه الدرسين، ومنع تنزيل تقرير ناقص.
 */

import { questions } from "../src/data/questions";
import { answerKey } from "../src/data/answerKey";
import { TOTAL_MARKS } from "../src/config";
import {
  gradeExam,
  isExamComplete,
  isInputComplete,
  isPartComplete,
  lessonOverlap,
  lessonTotals,
  rubricMax,
  totalMarksFromKey,
  type Rubric,
  type Responses,
} from "../src/lib/grading";
import { buildReport, gradeLabel, reportFilename, summarize, validateReport, type AttemptMeta } from "../src/lib/report";
import { normalizeArabic, parseNumber, parseQuantity } from "../src/lib/physics";
import { buildResponses, firstInputOfKind, responsesWithEmpty, responsesWithWrong, textSatisfying, textViolatingNone } from "./helpers";

let failures = 0;
function check(name: string, condition: boolean, extra = ""): void {
  if (!condition) {
    failures += 1;
    console.log(`  ✗ ${name}${extra ? ` → ${extra}` : ""}`);
  } else {
    console.log(`  ✓ ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

const meta: AttemptMeta = {
  studentName: "سارة العلي",
  startAt: new Date("2026-11-23T07:00:00Z"),
  submitAt: new Date("2026-11-23T07:24:30Z"),
  elapsedMs: 24 * 60 * 1000 + 30 * 1000,
};

/* ==================== 1) التصحيح الكامل ==================== */
console.log("\n— التصحيح الكامل —");
const perfect = buildResponses("perfect");
const perfectResult = gradeExam(questions, perfect, answerKey);
check("المجموع 100", perfectResult.total === 100 && perfectResult.possible === 100, `${perfectResult.total}/${perfectResult.possible}`);
check("لا فرع صفري", perfectResult.wrongParts === 0 && perfectResult.emptyParts === 0, `${perfectResult.wrongParts}/${perfectResult.emptyParts}`);
check("كل الحقول كاملة", perfectResult.fullParts === 45, String(perfectResult.fullParts));
check("لا فرع جزئي", perfectResult.partialParts === 0, String(perfectResult.partialParts));
check("كل سؤال 10/10", perfectResult.questions.every((question) => question.earned === 10 && question.possible === 10));
check("الاختبار مكتمل", isExamComplete(questions, perfect));

/* ==================== 2) صحة نصوص المفتاح ==================== */
console.log("\n— صحة النصّ النموذجي في المفتاح (يستوفي معاييره) —");
let modelFailures: string[] = [];
for (const question of questions) {
  for (const part of question.parts) {
    for (const input of part.inputs) {
      const rubric = answerKey[question.id].rubric[input.id];
      if (rubric.kind !== "text" && !(rubric.kind === "tf" && rubric.correction)) continue;
      const responses: Responses = { ...perfect };
      const fields = Object.keys(responses).filter((field) => field === input.id || field.startsWith(`${input.id}:`));
      for (const field of fields) delete responses[field];
      if (rubric.kind === "text") responses[input.id] = rubric.model;
      else {
        responses[`${input.id}:verdict`] = rubric.verdict;
        responses[`${input.id}:correction`] = rubric.correction!.model;
      }
      const graded = gradeExam(questions, responses, answerKey);
      const gradedInput = graded.questions.flatMap((q) => q.inputs).find((item) => item.inputId === input.id)!;
      if (gradedInput.earned < gradedInput.possible) modelFailures.push(`${input.id} (${gradedInput.earned}/${gradedInput.possible})`);
    }
  }
}
check("كل نصّ نموذجي يستوفي معايير التصحيح كاملة", modelFailures.length === 0, modelFailures.join(", "));

let stepFailures: string[] = [];
for (const question of questions) {
  for (const part of question.parts) {
    for (const input of part.inputs) {
      const rubric = answerKey[question.id].rubric[input.id];
      if (rubric.kind !== "number" || !rubric.steps) continue;
      const responses: Responses = { ...perfect, [`${input.id}:steps`]: rubric.steps.model };
      const graded = gradeExam(questions, responses, answerKey);
      const gradedInput = graded.questions.flatMap((q) => q.inputs).find((item) => item.inputId === input.id)!;
      if (gradedInput.earned < gradedInput.possible) stepFailures.push(`${input.id} (${gradedInput.earned}/${gradedInput.possible})`);
    }
  }
}
check("كل نموذج خطوة حل يستوفي أنماطه", stepFailures.length === 0, stepFailures.join(", "));

/* ==================== 3) الجزئية حقل بحقل ==================== */
console.log("\n— العلامات الجزئية لكل حقل —");
let partialIssues: string[] = [];
for (const question of questions) {
  for (const part of question.parts) {
    for (const input of part.inputs) {
      const max = rubricMax(answerKey[question.id].rubric[input.id]);
      const result = gradeExam(questions, responsesWithEmpty(input.id), answerKey);
      const graded = result.questions.flatMap((q) => q.inputs).find((item) => item.inputId === input.id)!;
      if (graded.earned !== 0) partialIssues.push(`${input.id}: حقل فارغ نال ${graded.earned}`);
      if (result.total !== 100 - max) partialIssues.push(`${input.id}: المجموع ${result.total} بدل ${100 - max}`);
      if (result.questions.find((item) => item.questionId === question.id)!.earned !== 10 - max) {
        partialIssues.push(`${input.id}: علامة السؤال خاطئة`);
      }
    }
  }
}
check("حقل فارغ واحد يُنقص علامته بالضبط (45 حالة)", partialIssues.length === 0, partialIssues.slice(0, 4).join(" | "));

let wrongIssues: string[] = [];
for (const question of questions) {
  for (const part of question.parts) {
    for (const input of part.inputs) {
      const result = gradeExam(questions, responsesWithWrong(input.id), answerKey);
      const graded = result.questions.flatMap((q) => q.inputs).find((item) => item.inputId === input.id)!;
      if (graded.earned !== 0) wrongIssues.push(`${input.id}: إجابة خاطئة نالت ${graded.earned}`);
    }
  }
}
check("إجابة خاطئة واحدة تُصفّر حقلها فقط (45 حالة)", wrongIssues.length === 0, wrongIssues.slice(0, 4).join(" | "));

/* ==================== 4) جزئيات النصوص والأعداد ==================== */
console.log("\n— الجزئيات داخل الحقل الواحد —");
{
  const rubric = answerKey.q1.rubric.q1c as Extract<Rubric, { kind: "text" }>;
  const marksOf = (responses: Responses, inputId: string) =>
    gradeExam(questions, responses, answerKey).questions.flatMap((question) => question.inputs).find((item) => item.inputId === inputId)!.earned;

  check("q1c أربعة معايير (4 علامات)", rubric.criteria.length === 4 && rubric.marks === 4);
  check("نصّ يستوفي معياراً واحداً = علامة واحدة", marksOf({ ...perfect, q1c: textSatisfying(rubric, [0]) }, "q1c") === 1);
  check("نصّ يستوفي معيارين = علامتان", marksOf({ ...perfect, q1c: textSatisfying(rubric, [0, 1]) }, "q1c") === 2);
  check("نصّ يستوفي ثلاثة معايير = 3", marksOf({ ...perfect, q1c: textSatisfying(rubric, [0, 1, 2]) }, "q1c") === 3);
  check("نصّ يستوفي كل المعايير = 4/4", marksOf({ ...perfect, q1c: textSatisfying(rubric, [0, 1, 2, 3]) }, "q1c") === 4);
  check("q1c لا يحتوي معيار none (لا إبطال للنصّ الصحيح)", rubric.criteria.every((criterion) => !criterion.none?.length));
  check("نصّ فارغ = 0/4", marksOf({ ...perfect, q1c: "   " }, "q1c") === 0);
  const emptyGraded = gradeExam(questions, { ...perfect, q1c: "   " }, answerKey)
    .questions.flatMap((question) => question.inputs).find((item) => item.inputId === "q1c")!;
  check("نصّ فارغ يُعدّ غير مجاب", emptyGraded.response.trim() === "");
  check("نصّ عربي مكتوب يدوياً يُقبل دلالياً",
    marksOf({ ...perfect, q1c: "الحقيبة ساكنة بالنسبة لهيفاء لأن موضعها ثابت، ومتحركة بالنسبة لماهر لأن موضعها يتغير مع الزمن، والمرجع هو الفيصل" }, "q1c") === 4);
}
{
  /* معيار none موجود في q5c-1: «المسافات متساوية» مع نفي «غير متساوية». */
  const q5c1 = answerKey.q5.rubric["q5c-1"] as Extract<Rubric, { kind: "text" }>;
  const noneIndex = q5c1.criteria.findIndex((criterion) => criterion.none?.length);
  const marksOf = (responses: Responses) =>
    gradeExam(questions, responses, answerKey).questions.flatMap((question) => question.inputs).find((item) => item.inputId === "q5c-1")!.earned;
  check("معيار none موجود في q5c-1 (المسافات المتساوية)", noneIndex >= 0, JSON.stringify(q5c1.criteria.map((criterion) => criterion.none ?? null)));
  if (noneIndex >= 0) {
    check("نصّ صحيح يفي بالمعيار", marksOf({ ...perfect, "q5c-1": textSatisfying(q5c1, [noneIndex]) }) === 1);
    check("نصّ مناقض يُبطل معيار none", marksOf({ ...perfect, "q5c-1": textViolatingNone(q5c1, noneIndex) }) === 0);
  }
}
{
  const number = firstInputOfKind("number");
  const rubric = number.rubric as Extract<Rubric, { kind: "number" }>;
  const valueField = `${number.inputId}:value`;
  const unitField = `${number.inputId}:unit`;
  const stepsField = `${number.inputId}:steps`;
  const correct = gradeExam(questions, perfect, answerKey).questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!;
  check(
    `عدد ${number.inputId}: علامة القيمة + الوحدة + الخطوة = ${correct.possible}`,
    correct.possible === rubric.marks + (rubric.unit?.marks ?? 0) + (rubric.steps?.marks ?? 0),
  );
  if (rubric.unit) {
    const wrongUnit = gradeExam(questions, { ...perfect, [unitField]: rubric.unit.options.find((o) => o !== rubric.unit!.answer) }, answerKey);
    const graded = wrongUnit.questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!;
    check("وحدة خاطئة تخسر علامة الوحدة فقط", graded.earned === correct.possible - rubric.unit.marks, `${graded.earned}/${correct.possible}`);
  }
  if (rubric.steps) {
    const wrongSteps = gradeExam(questions, { ...perfect, [stepsField]: "لا شيء" }, answerKey);
    const graded = wrongSteps.questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!;
    check("خطوة خاطئة تخسر علامة الخطوة فقط", graded.earned === correct.possible - rubric.steps.marks, `${graded.earned}/${correct.possible}`);
  }
  const arabicValue = String(rubric.value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
  const arabicDigits = gradeExam(questions, { ...perfect, [valueField]: arabicValue }, answerKey);
  check(`الأرقام العربية مقبولة في القيمة (${arabicValue} = ${rubric.value})`,
    arabicDigits.questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!.earned === correct.possible);
  const computed = gradeExam(questions, { ...perfect, [valueField]: `${rubric.value * 2} ÷ 2` }, answerKey);
  check("تعبير حسابي يُقرأ ويُقيَّم", computed.questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!.earned === correct.possible);
  const withUnitInside = gradeExam(questions, { ...perfect, [valueField]: `${rubric.value} ${rubric.unit?.answer ?? "m"}` }, answerKey);
  check("كتابة الوحدة داخل خانة القيمة لا تُخصم", withUnitInside.questions.flatMap((q) => q.inputs).find((item) => item.inputId === number.inputId)!.earned === correct.possible);
}
{
  const tf = firstInputOfKind("tf");
  const rubric = tf.rubric as Extract<Rubric, { kind: "tf" }>;
  const correct = gradeExam(questions, perfect, answerKey).questions.flatMap((q) => q.inputs).find((item) => item.inputId === tf.inputId)!;
  check(`صح/خطأ ${tf.inputId}: الحكم ${rubric.verdictMarks} + التصحيح ${rubric.correction?.marks ?? 0}`, correct.earned === correct.possible);
  if (rubric.correction) {
    const verdictOnly = gradeExam(questions, { ...perfect, [`${tf.inputId}:correction`]: "" }, answerKey);
    const graded = verdictOnly.questions.flatMap((q) => q.inputs).find((item) => item.inputId === tf.inputId)!;
    check("حكم صحيح بلا تصحيح = علامة الحكم فقط", graded.earned === rubric.verdictMarks, `${graded.earned}/${graded.possible}`);
    const wrongVerdict = gradeExam(questions, { ...perfect, [`${tf.inputId}:verdict`]: rubric.verdict === "false" ? "true" : "false" }, answerKey);
    check("حكم خاطئ = صفر حتى مع نصّ تصحيح سليم", wrongVerdict.questions.flatMap((q) => q.inputs).find((item) => item.inputId === tf.inputId)!.earned === 0);
  }
}
{
  const matrix = firstInputOfKind("matrix");
  const rubric = matrix.rubric as Extract<Rubric, { kind: "matrix" }>;
  const rows = rubric.rows;
  const responses = { ...perfect, [`${matrix.inputId}:${rows[0].id}`]: rows[0].answer === "motion" ? "shape" : "motion" };
  const graded = gradeExam(questions, responses, answerKey).questions.flatMap((q) => q.inputs).find((item) => item.inputId === matrix.inputId)!;
  check("تصنيف: صف واحد خاطئ يخسر علامة صف واحدة",
    graded.earned === (rows.length - 1) * rubric.marksPerRow,
    `${graded.earned}/${graded.possible}`);
  check("تصنيف: تفصيل الصفوف معروض", (graded.rows ?? []).length === rows.length);
}

/* ==================== 5) الخطأ الكامل وعدم الإجابة ==================== */
console.log("\n— إجابات خاطئة كاملة وغير مجابة —");
{
  const empty = gradeExam(questions, {}, answerKey);
  check("بلا إجابات: المجموع 0", empty.total === 0 && empty.possible === 100, `${empty.total}`);
  check("بلا إجابات: كل الحقول غير مجابة", empty.emptyParts === 45 && empty.wrongParts === 0, `${empty.emptyParts}/${empty.wrongParts}`);
  check("بلا إجابات: الاختبار غير مكتمل", !isExamComplete(questions, {}));
  const summary = summarize(questions, {}, empty);
  check("الملخّص: 45 فرعاً لم يُجب عنها", summary.unansweredSubparts === 45, String(summary.unansweredSubparts));
  check("الملخّص: صفر فروع خاطئة", summary.wrongSubparts === 0, String(summary.wrongSubparts));
  check("الملخّص: نسبة 0%", summary.percentage === 0);
  check("التقدير: يحتاج إلى دعم", gradeLabel(0) === "يحتاج إلى دعم");
}
{
  const wrong = gradeExam(questions, buildResponses("wrong"), answerKey);
  check("إجابات خاطئة كاملة: المجموع 0", wrong.total === 0, String(wrong.total));
  check("إجابات خاطئة: 45 فرعاً خاطئاً", wrong.wrongParts === 45 && wrong.emptyParts === 0, `${wrong.wrongParts}/${wrong.emptyParts}`);
  const summary = summarize(questions, buildResponses("wrong"), wrong);
  check("الملخّص: 45 فرعاً خاطئاً وصفر غير مجاب", summary.wrongSubparts === 45 && summary.unansweredSubparts === 0);
  check("الملخّص: 10 أسئلة خاطئة", summary.wrongQuestions === 10, String(summary.wrongQuestions));
}

/* ==================== 6) النسبة والتقدير ==================== */
console.log("\n— النسبة وسلّم التقدير —");
check("100% ← ممتاز", gradeLabel(100) === "ممتاز");
check("95% ← ممتاز", gradeLabel(95) === "ممتاز");
check("94.9% ← جيد جداً", gradeLabel(94.9) === "جيد جداً");
check("85% ← جيد جداً", gradeLabel(85) === "جيد جداً");
check("84.9% ← جيد", gradeLabel(84.9) === "جيد");
check("75% ← جيد", gradeLabel(75) === "جيد");
check("74.9% ← مقبول", gradeLabel(74.9) === "مقبول");
check("65% ← مقبول", gradeLabel(65) === "مقبول");
check("64.9% ← ضعيف", gradeLabel(64.9) === "ضعيف");
check("50% ← ضعيف", gradeLabel(50) === "ضعيف");
check("49.9% ← يحتاج إلى دعم", gradeLabel(49.9) === "يحتاج إلى دعم");
{
  const halfway = { ...perfect };
  delete halfway.q1a;
  delete halfway.q1b;
  const result = gradeExam(questions, halfway, answerKey);
  const summary = summarize(questions, halfway, result);
  check("حذف 6 علامات (سؤالان اختيار) ← 94", result.total === 94, String(result.total));
  check("النسبة 94%", summary.percentage === 94, String(summary.percentage));
  check("التقدير: جيد جداً", gradeLabel(summary.percentage) === "جيد جداً");
  check("المقام 100 دائماً", summary.max === 100 && summary.max === TOTAL_MARKS);
}

/* ==================== 7) توزيع الدرسين مع نتيجة فعلية ==================== */
console.log("\n— توزيع الدرسين بعد التصحيح —");
{
  const totals = lessonTotals(questions, perfectResult);
  const overlap = lessonOverlap(questions, perfectResult);
  check("L1: 60/60", totals[0].earned === 60 && totals[0].possible === 60, `${totals[0].earned}/${totals[0].possible}`);
  check("L2: 50/50", totals[1].earned === 50 && totals[1].possible === 50, `${totals[1].earned}/${totals[1].possible}`);
  check("حصّة السؤال التركيبي 10/10 في الدرسين", totals.every((row) => row.sharedEarned === 10 && row.sharedPossible === 10));
  check("مجموع الدرسين 110 والاختبار 100", overlap.possible === 110 && overlap.examPossible === 100);
  check("المحقَّق بعد إزالة التكرار = 100", overlap.uniqueEarned === 100 && overlap.uniquePossible === 100);
}
{
  /* إجابات الدرس الثاني فقط صحيحة — التوزيع يجب أن يعكس ذلك دون أن يمسّ المقام. */
  const responses: Responses = { ...buildResponses("wrong") };
  for (const question of questions) {
    if (question.lesson !== "القوة والحركة") continue;
    for (const part of question.parts) {
      for (const input of part.inputs) {
        const ok = buildResponses("perfect");
        for (const field of Object.keys(responses)) {
          if (field === input.id || field.startsWith(`${input.id}:`)) responses[field] = ok[field];
        }
      }
    }
  }
  const result = gradeExam(questions, responses, answerKey);
  const totals = lessonTotals(questions, result);
  check("إجابات L2 فقط: 40/50 لـ L2", totals[1].earned === 40 && totals[1].possible === 50, `${totals[1].earned}/${totals[1].possible}`);
  check("إجابات L2 فقط: 0/60 لـ L1", totals[0].earned === 0, `${totals[0].earned}`);
  check("إجابات L2 فقط: المجموع 40 من 100", result.total === 40 && result.possible === 100, `${result.total}/${result.possible}`);
}

/* ==================== 8) الفيزياء والأرقام ==================== */
console.log("\n— قراءة الأرقام والوحدات —");
check("أرقام عربية: ٤٥ ← 45", parseNumber("٤٥") === 45);
check("أرقام فارسية: ۴۵ ← 45", parseNumber("۴۵") === 45);
check("فاصلة عشرية عربية: ٩٫٦ ← 9.6", parseNumber("٩٫٦") === 9.6);
check("صيغة حسابية: 27 ÷ 0.5 ← 54", parseNumber("27 ÷ 0.5") === 54);
check("صيغة فيها =: النتيجة بعد آخر = ", parseNumber("v = 27 ÷ 0.5 = 54") === 54);
check("كسور: 3000/600 ← 5", parseNumber("3000/600") === 5);
check("نصّ غير رقمي ← null", parseNumber("لا أعرف") === null);
check("وحدة ملتصقة تُقرأ", parseQuantity("54m/s")?.value === 54 && parseQuantity("54m/s")?.unit === "m/s");
check("وحدة مفصولة تُقرأ", parseQuantity("54 m/s")?.value === 54);
check("تطبيع العربية يوحّد الهمزات والتاء المربوطة", normalizeArabic("إجابةٌ صحيحة") === normalizeArabic("اجابه صحيحه"), normalizeArabic("إجابةٌ صحيحة"));

/* ==================== 9) التقرير TXT ==================== */
console.log("\n— تقرير TXT —");
{
  const report = buildReport(questions, meta, perfectResult, perfect, answerKey);
  const missing = validateReport(report, questions, meta, perfectResult);
  check("التقرير مكتمل حسب validateReport", missing.length === 0, missing.slice(0, 3).join(" | "));
  check("التقرير يبدأ بعلامة BOM", report.charCodeAt(0) === 0xfeff);
  check("التقرير بأسطر CRLF", report.includes("\r\n"));
  check("التقرير يحوي اسم الطالب", report.includes("سارة العلي"));
  check("التقرير يحوي عنوان الاختبار", report.includes("اختبار فيزياء بدرسي"));
  check("التقرير يحوي معرّف الاختبار", report.includes("grade-7-physics-test-l1-l2-model-a-24-11-26"));
  check("التقرير يحوي العنوان النهائي 100 من 100", report.includes("العلامة النهائية          : 100 من 100"));
  check("التقرير يذكر النسبة 100%", /النسبة المئوية\s+:\s*100(\.0)?%/.test(report), (report.match(/النسبة المئوية[^\r\n]*/) ?? [""])[0]);
  check("التقرير يذكر التقدير ممتاز", report.includes("ممتاز"));
  check("التقرير يذكر 10 أسئلة و37 فرعاً", report.includes("عدد الأسئلة الرئيسية      : 10") && report.includes("عدد الفروع المقوّمة       : 37"));
  check(
    "التقرير يحوي عنوان كل سؤال",
    Array.from({ length: 10 }, (_, index) => report.includes(`السؤال ${index + 1} —`)).every(Boolean),
  );
  const partsFound = (report.match(/الفرع \(/g) ?? []).length;
  check("التقرير يحوي 37 فرعاً", partsFound === 37, String(partsFound));
  check("عنوان توزيع الدرسين صريح", report.includes("توزيع العلامات على الدرسين (درسان فقط، بلا فئة ثالثة):"));
  const lessonLines = report.split("\r\n").filter((line) => /^ {2}(الحركة والسكون|القوة والحركة) : /.test(line));
  check("سطران للدرسين فقط", lessonLines.length === 2, lessonLines.join(" | "));
  check("سطر الدرس الأول 60/60 مع حصة التركيبي", lessonLines[0]?.includes("60 / 60") && lessonLines[0]?.includes("للسؤال التركيبي"), lessonLines[0] ?? "");
  check("سطر الدرس الثاني 50/50 مع حصة التركيبي", lessonLines[1]?.includes("50 / 50") && lessonLines[1]?.includes("للسؤال التركيبي"), lessonLines[1] ?? "");
  check("التقرير ينصّ أن مجموع الدرسين 110 وليس 100", report.includes("110") && report.includes("وليس 100"));
  check("التقرير ينصّ على عدم جمع الدرسين كمقام", report.includes("المقام المستعمل في النسبة"));
  check("التقرير لا يعرض فئة درس ثالثة", !/^ {2}الحركة والسكون \+ القوة والحركة/m.test(report));
  check("التقرير يحوي سلّم التقويم", report.includes("سلّم التقويم المعتمد"));
  check("التقرير يحوي بيانات التواصل", report.includes("0930215022"));
  check(
    "كل حقل يظهر بسطر إجابة الطالب والإجابة الصحيحة",
    (report.match(/إجابة الطالب {3}: /g) ?? []).length === 45 && (report.match(/الإجابة الصحيحة: /g) ?? []).length === 45,
    `${(report.match(/إجابة الطالب {3}: /g) ?? []).length}/${(report.match(/الإجابة الصحيحة: /g) ?? []).length}`,
  );
  check("اسم الملف يحوي بادئة النموذج A", reportFilename("سارة العلي").startsWith("Grade7_Physics_L1L2_ModelA_"), reportFilename("سارة العلي"));
  check("اسم الملف ينتهي بـ .txt", reportFilename("سارة العلي").endsWith("_Results.txt"), reportFilename("سارة العلي"));
  check("اسم الملف لا يحوي محارف ممنوعة", !/[\\/:*?"<>|]/.test(reportFilename("سارة/العلي")));

  /* تقرير منقوص يجب أن يُرفض قبل التنزيل. */
  const tampered = report.replace("الفرع (أ) —", "");
  check("كشف التقرير المنقوص", validateReport(tampered, questions, meta, perfectResult).length > 0);
}

console.log(`\n${failures === 0 ? "✅" : "❌"} التصحيح والتقرير: ${failures === 0 ? "كل الفحوص ناجحة" : `${failures} فحصاً فاشلاً`}`);
if (failures) process.exit(1);

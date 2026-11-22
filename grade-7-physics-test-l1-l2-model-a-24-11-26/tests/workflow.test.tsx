/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom) — اختبار آلي للواجهة لا بديل عن المعاينة البصرية:
 * ترحيب ← اسم الطالب ← بدء ← الإجابة عن كل الحقول ← مراجعة ← تسليم ← تنزيل التقرير
 * ← صفحة النتيجة ← الإرسال (Mock Fetch) ← بوابة المعلّم ← محاولة جديدة.
 *
 * فحوص إضافية: الحفظ والاستعادة بعد إعادة التحميل، عزل التخزين عن النموذج B،
 * منع التسليم قبل إكمال كل الحقول، وعدم كشف أي إجابة قبل التسليم.
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 */
import "./setup-dom";
import { D, W, blobTexts, downloads, net } from "./setup-dom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";
import { questions } from "../src/data/questions";
import { answerKey } from "../src/data/answerKey";
import { ATTEMPT_KEY, EXAM_ID, TEACHER_PASSWORD } from "../src/config";
import { correctValue } from "./helpers";
import { isInputComplete } from "../src/lib/grading";

let failures = 0;
function check(name: string, condition: boolean, extra = ""): void {
  if (!condition) {
    failures += 1;
    console.log(`  ✗ ${name}${extra ? ` → ${extra}` : ""}`);
  } else {
    console.log(`  ✓ ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

const q = (selector: string) => D.querySelector(selector) as HTMLElement | null;
const qa = (selector: string) => Array.from(D.querySelectorAll(selector)) as HTMLElement[];
const norm = (value: string) => (value || "").replace(/\s+/g, " ").trim();
const bodyText = () => D.body.textContent || "";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const byText = (selector: string, text: string) =>
  qa(selector).find((element) => norm(element.textContent || "").includes(norm(text))) || null;

function fire(element: Element, type: string, Ctor: any = W.Event) {
  element.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }));
}
function click(element: Element) {
  fire(element, "click", W.MouseEvent);
}
function setInput(element: any, value: string) {
  const proto = element instanceof W.HTMLTextAreaElement ? W.HTMLTextAreaElement.prototype : W.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
  fire(element, "input");
  fire(element, "change");
}
function setSelect(element: any, value: string) {
  Object.getOwnPropertyDescriptor(W.HTMLSelectElement.prototype, "value")!.set!.call(element, value);
  fire(element, "change");
}

let root: ReturnType<typeof createRoot> | null = null;
const container = D.getElementById("root") as HTMLElement;
async function mount() {
  container.innerHTML = "";
  root = createRoot(container);
  await act(async () => {
    root!.render(<App />);
  });
  await act(async () => {
    await sleep(30);
  });
}
async function unmount() {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
}

const currentQuestionId = () => q("[data-question-id]")?.getAttribute("data-question-id") ?? null;
const sendStatus = () => q("[data-send-status]")?.getAttribute("data-send-status") ?? "";
async function settle(condition: () => boolean, ms = 5000) {
  await act(async () => {
    const started = Date.now();
    while (!condition() && Date.now() - started < ms) await sleep(20);
    await sleep(50);
  });
}

/**
 * يجيب عن كل حقول السؤال المعروض بإجابات صحيحة من المفتاح.
 * يتخطّى الحقول المكتملة مسبقاً لأن عناصر الاختيار تعمل كمفاتيح تبديل (نقرة ثانية تُلغي الإجابة).
 */
async function answerCurrentQuestion() {
  const id = currentQuestionId();
  if (!id) throw new Error("لا سؤال معروض");
  const question = questions.find((item) => item.id === id)!;
  const stored = JSON.parse(W.localStorage.getItem(ATTEMPT_KEY) ?? "{}");
  for (const part of question.parts) {
    for (const input of part.inputs) {
      if (isInputComplete(input, stored.responses ?? {})) continue;
      const rubric = answerKey[question.id].rubric[input.id];
      const values = correctValue(rubric);
      if (rubric.kind === "choice") {
        const chip = q(`[data-input-id="${input.id}"] [data-opt-id="${values[""]}"]`);
        if (!chip) throw new Error(`لا خيار للاختيار ${input.id}`);
        await act(async () => {
          click(chip);
        });
      } else if (rubric.kind === "text") {
        const field = q(`[data-input-id="${input.id}"] textarea`);
        if (!field) throw new Error(`لا خانة نصّ لـ ${input.id}`);
        await act(async () => {
          setInput(field, values[""]);
        });
      } else if (rubric.kind === "tf") {
        const chip = q(`[data-input-id="${input.id}"] [data-verdict="${values[":verdict"]}"]`);
        await act(async () => {
          click(chip!);
        });
        await act(async () => {
          await sleep(5);
        });
        if (values[":correction"]) {
          const correction = q(`[data-correction-field="${input.id}"]`);
          await act(async () => {
            setInput(correction, values[":correction"]);
          });
        }
      } else if (rubric.kind === "number") {
        if (values[":steps"]) {
          await act(async () => {
            setInput(q(`[data-step-field="${input.id}"]`), values[":steps"]);
          });
        }
        await act(async () => {
          setInput(q(`[data-value-field="${input.id}"]`), values[":value"]);
        });
        if (values[":unit"]) {
          await act(async () => {
            setSelect(q(`[data-unit-field="${input.id}"]`), values[":unit"]);
          });
        }
      } else {
        for (const [suffix, value] of Object.entries(values)) {
          const rowId = suffix.slice(1);
          const chip = q(`[data-input-id="${input.id}"] [data-matrix-row="${rowId}"] [data-col-id="${value}"]`);
          if (!chip) throw new Error(`لا خيار تصنيف ${input.id}/${rowId}`);
          await act(async () => {
            click(chip);
          });
        }
      }
      await act(async () => {
        await sleep(2);
      });
    }
  }
}

async function gotoNext(): Promise<boolean> {
  const button = byText("button", "السؤال التالي");
  if (!button) return false;
  await act(async () => {
    click(button);
    await sleep(10);
  });
  return true;
}

async function startExam(name = "طالبة نظامية") {
  const input = q("#student-name");
  await act(async () => {
    setInput(input, name);
    await sleep(5);
  });
  const startButton = byText("button", "بدء الاختبار");
  if (!startButton) throw new Error("زر البدء غير موجود");
  await act(async () => {
    click(startButton);
    await sleep(20);
  });
}

async function answerAllQuestions() {
  for (let index = 0; index < questions.length; index += 1) {
    await answerCurrentQuestion();
    if (index < questions.length - 1) await gotoNext();
  }
}

/* ==================== الترحيب ==================== */
console.log("\n— شاشة الترحيب —");
W.localStorage.clear();
net.calls.length = 0;
net.respond = () => JSON.stringify({ ok: true });
await mount();
check(
  "يعرض العنوان الحرفي المطلوب",
  bodyText().includes("اختبار فيزياء بدرسي (الحركة والسكون & القوة والحركة) 23-11-2026"),
);
check("يعرض الصف السابع والفصل الأول والفيزياء", ["الصف السابع", "الفصل الأول", "الفيزياء"].every((text) => bodyText().includes(text)));
check("يعرض عدد الأسئلة 10", bodyText().includes("10"));
check("يعرض عدد الفروع 37", bodyText().includes("37"), (bodyText().match(/\d+ فرعاً مُقوّماً/) ?? [""])[0]);
check("يعرض مجموع العلامات 100", bodyText().includes("100"));
check("يعرض الدرسين معاً", bodyText().includes("الحركة والسكون") && bodyText().includes("القوة والحركة"));
check("لا يعرض أي إجابة صحيحة قبل البدء", !bodyText().includes(answerKey.q1.rubric.q1c.model));

const startButton = byText("button", "بدء الاختبار") as HTMLButtonElement | null;
check("زر البدء موجود", !!startButton);
check("زر البدء مفعّل والنموذج يتحقّق من الاسم", !!startButton && !startButton.disabled);
await act(async () => {
  click(startButton!);
  await sleep(20);
});
check("اسم قصير لا يبدأ الاختبار", currentQuestionId() === null && !!q("#student-name"));

/* ==================== البدء ==================== */
console.log("\n— بدء الاختبار —");
await startExam("نور هدى");
check("بدأ الاختبار بعد إدخال الاسم", currentQuestionId() === "q1", String(currentQuestionId()));
check("يظهر رقم السؤال الأول", bodyText().includes("السؤال 1"));
check("الاسم محفوظ في التخزين", JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).studentName === "نور هدى");
check("الحالة in_progress", JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).status === "in_progress");
check("لا إجابات صحيحة ظاهرة في شاشة الأسئلة", !bodyText().includes(answerKey.q1.rubric.q1c.model));
check(
  "كل حقول السؤال الأول لها عنصر إدخال",
  questions[0].parts.every((part) => part.inputs.every((input) => !!q(`[data-input-id="${input.id}"]`))),
);

/* ==================== الحفظ والتقدّم ==================== */
console.log("\n— الحفظ والتقدّم والتنقّل —");
await answerCurrentQuestion();
check("حفظ إجابة فور الكتابة", !!JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).responses.q1a);
check("شريط التقدّم يعرض 37 فرعاً", /\d+ من 37 /.test(`${bodyText()} `), (bodyText().match(/\d+ من 37/g) ?? [""])[0]);
await gotoNext();
check("الانتقال إلى السؤال الثاني", currentQuestionId() === "q2", String(currentQuestionId()));
check("موضع السؤال محفوظ", JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).questionIndex === 1);
const back = byText("button", "السؤال السابق");
check("زر الرجوع موجود", !!back);
await act(async () => {
  click(back!);
  await sleep(10);
});
check("العودة إلى السؤال الأول", currentQuestionId() === "q1", String(currentQuestionId()));

/* ==================== منع التسليم المبكر ==================== */
console.log("\n— منع التسليم قبل الإكمال —");
{
  const earlyReview = byText("button", "مراجعة الإجابات")!;
  await act(async () => {
    click(earlyReview);
    await sleep(20);
  });
  const earlySubmit = q('[data-action="submit-exam"]') as HTMLButtonElement | null;
  check("زر التسليم معطّل قبل إكمال الحقول", !!earlySubmit && earlySubmit.disabled);
  check("رسالة تشرح الحقول المتبقية", /تبقّى \d+ فرعاً/.test(bodyText()), (bodyText().match(/تبقّى \d+ فرعاً/) ?? [""])[0]);
  check("يُعرض عدد الفروع المُجابة", /\d+ \/ 37/.test(bodyText()) || /\d+\/37/.test(bodyText()), (bodyText().match(/\d+ \/ 37/g) ?? [""])[0]);
  check("زر الرجوع إلى الأسئلة متاح", !!byText("button", "رجوع إلى الأسئلة"));
  await act(async () => {
    click(byText("button", "رجوع إلى الأسئلة")!);
    await sleep(20);
  });
  check("عاد إلى السؤال نفسه", currentQuestionId() === "q1", String(currentQuestionId()));
}
await answerAllQuestions();
{
  const reviewButton = byText("button", "مراجعة الإجابات");
  check("زر المراجعة موجود", !!reviewButton);
  await act(async () => {
    click(reviewButton!);
    await sleep(20);
  });
}
check("انتقل إلى مراجعة الإجابات", bodyText().includes("مراجعة الإجابات قبل التسليم"));
check("لا كشف للإجابة الصحيحة في المراجعة", !bodyText().includes("خطوات الحل والتفسير"));
check("كل الفروع مجابة", bodyText().includes("37 / 37") || bodyText().includes("37/37"), (bodyText().match(/\d+ \/ 37/g) ?? [""])[0]);
const submitButton = q('[data-action="submit-exam"]') as HTMLButtonElement | null;
check("زر التسليم مفعّل بعد الإكمال", !!submitButton && !submitButton.disabled);
check("لم يُرسل شيء بعد", net.calls.length === 0, String(net.calls.length));

/* ==================== الاستعادة ==================== */
console.log("\n— حفظ واستعادة بعد إعادة التحميل —");
await unmount();
await mount();
check("بطاقة الاستعادة ظاهرة", bodyText().includes("محاولة محفوظة"));
const resumeButton = byText("button", "متابعة الاختبار");
check("زر الاستئناف موجود", !!resumeButton);
await act(async () => {
  click(resumeButton!);
  await sleep(30);
});
check("استُعيدت الإجابات كلها", Object.keys(JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).responses).length > 40);
check("استُعيد الاختبار باسم الطالب", bodyText().includes("نور هدى"));
check("لم يُرسل شيء عند الاستعادة", net.calls.length === 0);

/* ==================== عزل التخزين ==================== */
console.log("\n— عزل التخزين عن النموذج B —");
{
  const foreignKey = "grade-7-physics-test-l1-l2-model-b-24-11-26:attempt:v1";
  const foreign = JSON.stringify({
    version: 1,
    examId: "grade-7-physics-test-l1-l2-model-b-24-11-26",
    status: "in_progress",
    studentName: "طالب النموذج ب",
    responses: { q1a: "1" },
    questionIndex: 0,
    startedAt: Date.now(),
  });
  W.localStorage.setItem(foreignKey, foreign);
  await unmount();
  await mount();
  const keys = Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index)!);
  check("مفتاح النموذج B باقٍ كما هو", W.localStorage.getItem(foreignKey) === foreign);
  check("مفتاح محاولة واحد لهذا الاختبار", keys.filter((key) => key === ATTEMPT_KEY).length === 1, keys.join(","));
  check("بطاقة استعادة محاولتنا لا محاولة النموذج B", bodyText().includes("نور هدى") && !bodyText().includes("طالب النموذج ب"));
  const resumeAgain = byText("button", "متابعة الاختبار");
  check("زر متابعة الاختبار بعد إعادة التحميل", !!resumeAgain);
  await act(async () => {
    click(resumeAgain!);
    await sleep(30);
  });
  check("استُعيد الاختبار في السؤال المحفوظ", !!currentQuestionId(), String(currentQuestionId()));
}

/* ==================== التسليم ==================== */
console.log("\n— التسليم والتقرير —");
{
  const reviewButton = byText("button", "مراجعة الإجابات");
  check("زر المراجعة متاح بعد الاستعادة", !!reviewButton);
  await act(async () => {
    click(reviewButton!);
    await sleep(20);
  });
}
const doSubmit = q('[data-action="submit-exam"]') as HTMLButtonElement;
check("زر التسليم جاهز", !!doSubmit && !doSubmit.disabled);
await act(async () => {
  click(doSubmit);
});
await settle(() => !!q("[data-result-question]"), 8000);
check("ظهرت صفحة النتيجة", !!q("[data-result-question]"));
check("العشرة أسئلة معروضة", qa("[data-result-question]").length === 10, String(qa("[data-result-question]").length));
check("37 فرعاً معروضاً في التصحيح", qa("[data-result-part]").length === 37, String(qa("[data-result-part]").length));
check("45 حقلاً معروضاً في التصحيح", qa("[data-result-input]").length === 45, String(qa("[data-result-input]").length));
check("العلامة النهائية 100 والتقدير ممتاز", bodyText().includes("100") && bodyText().includes("ممتاز"));
check(
  "كل فرع نال علامته الكاملة",
  qa("[data-result-part]").every((element) => element.getAttribute("data-part-earned") === element.getAttribute("data-part-possible")),
);
check("التقرير بدأ تنزيله تلقائياً", downloads.length === 1, String(downloads.length));
check("اسم ملف التقرير .txt", (downloads[0]?.download || "").endsWith(".txt"), downloads[0]?.download);
check("اسم الملف يحوي اسم الطالب", (downloads[0]?.download || "").includes("نور"), downloads[0]?.download);
check("اسم الملف يحوي بادئة النموذج A", (downloads[0]?.download || "").includes("ModelA"), downloads[0]?.download);

const reportText = blobTexts[blobTexts.length - 1] || "";
check("التقرير يبدأ بعلامة BOM", reportText.charCodeAt(0) === 0xfeff);
check(
  "التقرير يحوي عنوان كل سؤال",
  Array.from({ length: 10 }, (_, index) => reportText.includes(`السؤال ${index + 1} —`)).every(Boolean),
);
check("التقرير يحوي 45 سطر إجابة", (reportText.match(/إجابة الطالب {3}: /g) ?? []).length === 45, String((reportText.match(/إجابة الطالب {3}: /g) ?? []).length));
check("التقرير يحوي اسم الطالب والمجموع", reportText.includes("نور هدى") && reportText.includes("100 من 100"));
check("التقرير: توزيع درسين بعنوان صريح", reportText.includes("توزيع العلامات على الدرسين (درسان فقط، بلا فئة ثالثة):"));
check(
  "التقرير: سطران للدرسين فقط",
  reportText.split("\r\n").filter((line) => /^ {2}(الحركة والسكون|القوة والحركة) : /.test(line)).length === 2,
);
check("التقرير: لا بند لدرس ثالث", !/^ {2}الحركة والسكون \+ القوة والحركة/m.test(reportText));
check("التقرير: 110 لمجموع الدرسين و100 للاختبار", reportText.includes("110") && reportText.includes("100 / 100"));
check("التقرير: عبارة عدم الجمع صريحة", reportText.includes("المقام المستعمل في النسبة"));
check("الحالة submitted محفوظة", JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).status === "submitted");

/* ==================== توزيع الدرسين في الواجهة ==================== */
console.log("\n— توزيع الدرسين في صفحة النتيجة —");
{
  const rows = qa("[data-lesson-breakdown] [data-lesson]");
  check("درسان فقط في التوزيع", rows.length === 2, String(rows.length));
  check(
    "أسماء الدرسين الأصلية",
    rows.map((row) => row.getAttribute("data-lesson")).join("|") === "الحركة والسكون|القوة والحركة",
    rows.map((row) => row.getAttribute("data-lesson")).join("|"),
  );
  const text = norm(q("[data-lesson-breakdown]")?.textContent || "");
  check("يعرض 60/60 للدرس الأول و50/50 للثاني", text.includes("60/60") && text.includes("50/50"), text.slice(0, 140));
  check("يعرض حصة السؤال التركيبي في كل درس (10/10 مرتين)", (text.match(/منها تركيبي: 10\/10/g) ?? []).length === 2, text.slice(0, 160));
  check("ينصّ أن مجموع الدرسين 110 وليس 100", text.includes("110") && text.includes("وليس"));
  check("ينصّ أن مجموع الاختبار 100 وليس مجموع الدرسين", text.includes("100 / 100"));
  check("النسبة المعروضة 100%", /النسبة:\s*100(\.0)?%/.test(norm(bodyText())), (norm(bodyText()).match(/النسبة:\s*[\d.]+%/) ?? [""])[0]);
  check("التقدير المعروض ممتاز", norm(bodyText()).includes("ممتاز"));
  check("لا فئة درس ثالثة في التوزيع", !text.includes("الحركة والسكون + القوة والحركة"));
}

/* ==================== الإرسال ==================== */
console.log("\n— الإرسال إلى Google Sheets (Mock Fetch) —");
await settle(() => sendStatus() === "success", 6000);
check("حالة الإرسال: تم", sendStatus() === "success", sendStatus());
check("طلب واحد فقط", net.calls.length === 1, String(net.calls.length));
{
  const sent = JSON.parse(String(net.calls[0]?.init.body));
  check("الحمولة: examId صحيح", sent.examId === EXAM_ID);
  check("الحمولة: اسم الطالب", sent.studentName === "نور هدى");
  check("الحمولة: 45 تفصيلاً", sent.details.length === 45, String(sent.details.length));
  check("الحمولة: العلامة 100", sent.summary.total === 100 && sent.summary.max === 100);
  check("الحمولة: النسبة والتقدير", sent.summary.percentage === 100 && sent.summary.gradeLabel === "ممتاز");
  check("الحمولة: التقرير مضمّن", sent.reportText.length > 1000);
  check("الحمولة: token صحيح", typeof sent.token === "string" && sent.token.length === 32);
  check("الحمولة: attemptId موجود", typeof sent.attemptId === "string" && sent.attemptId.length > 5);
  check("الحمولة: lessons درسان فقط", Array.isArray(sent.lessons) && sent.lessons.length === 2, String(sent.lessons?.length));
  check("الحمولة: لا فئة تركيبية بين الدروس", sent.lessons.every((lesson: { title: string }) => !lesson.title.includes("+")));
  check("الحمولة: الحصة المشتركة 1 سؤال/10 علامات", sent.lessons.every((lesson: { sharedQuestions: number; sharedMax: number }) => lesson.sharedQuestions === 1 && lesson.sharedMax === 10));
  check("الحمولة: lessonTotals يوضّح التداخل", sent.lessonTotals?.possible === 110 && sent.lessonTotals?.uniquePossible === 100);
  check("الحمولة: مرجع العلامة هو مجموع الاختبار", sent.lessonTotals?.examPossible === 100 && sent.summary.max === 100);
  check("الحمولة: نوع المحتوى text/plain", net.calls[0].init.headers["Content-Type"] === "text/plain;charset=utf-8");
  check("الحمولة: إلى SHEETS_URL", String(net.calls[0].url).startsWith("https://script.google.com/macros/s/"));
}
check(
  "لا حمولة معلّقة بعد النجاح",
  Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index)!).filter((key) => key.startsWith(`pending:${EXAM_ID}:`)).length === 0,
);

/* ==================== التقرير الاحتياطي ==================== */
console.log("\n— التقرير الاحتياطي والتنزيل اليدوي —");
{
  const before = downloads.length;
  const downloadButton = q('[data-action="download-report"]');
  check("زر التنزيل الاحتياطي موجود", !!downloadButton);
  await act(async () => {
    click(downloadButton!);
    await sleep(20);
  });
  check("التنزيل اليدوي يعمل", downloads.length === before + 1, String(downloads.length));
}

/* ==================== بوابة المعلّم ==================== */
console.log("\n— بوابة المعلّم —");
{
  const teacherButton = byText("button", "دليل المعلّم");
  check("زر المعلّم موجود", !!teacherButton);
  await act(async () => {
    click(teacherButton!);
    await sleep(20);
  });
  check("طلب كلمة المرور", !!q("#teacher-password"));
  check("لا تكشف الإجابات قبل كلمة المرور", !bodyText().includes("جدول توزيع العلامات") && !bodyText().includes("سياسة التصحيح"));
  check("لا تعرض القيمة العددية الصحيحة قبل الفتح", !bodyText().includes("40 N"));
  const password = q("#teacher-password");
  await act(async () => {
    setInput(password, "كلمة-خاطئة");
    await sleep(5);
  });
  await act(async () => {
    click(byText("button", "فتح الدليل")!);
    await sleep(20);
  });
  check("كلمة مرور خاطئة تُرفض", !!q("#teacher-error") && !bodyText().includes("جدول توزيع العلامات"));
  await act(async () => {
    setInput(password, TEACHER_PASSWORD);
    await sleep(5);
  });
  await act(async () => {
    click(byText("button", "فتح الدليل")!);
    await sleep(30);
  });
  check("كلمة المرور الصحيحة تفتح الدليل", bodyText().includes("جدول توزيع العلامات"));
  check("يعرض 37 فرعاً و100 علامة", bodyText().includes("37") && bodyText().includes("100"));
  check("يعرض سياسة التصحيح", bodyText().includes("سياسة التصحيح"));
  const teacherLessons = q("[data-teacher-lessons]");
  check("دليل المعلّم يعرض توزيع الدرسين", !!teacherLessons);
  {
    const lessonText = norm(teacherLessons?.textContent || "");
    check("توزيع المعلّم: درسان فقط", qa("[data-teacher-lesson]").length === 2, String(qa("[data-teacher-lesson]").length));
    check("توزيع المعلّم: 60 و50", lessonText.includes("60") && lessonText.includes("50"), lessonText.slice(0, 140));
    check("توزيع المعلّم يوضّح التداخل ولا يُجمَع", lessonText.includes("110") && lessonText.includes("لا تُجمع"));
    check("توزيع المعلّم يشير للسؤال التركيبي كحصة مشتركة", lessonText.includes("تركيبي"));
  }
  check("لا يعرض كلمة المرور نصاً", !bodyText().includes(TEACHER_PASSWORD));
  await act(async () => {
    click(byText("button", "رجوع إلى الاختبار")!);
    await sleep(20);
  });
  check("العودة من بوابة المعلّم إلى النتيجة", !!q("[data-result-question]"));
}

/* ==================== إعادة الإرسال عند الفشل ==================== */
console.log("\n— إعادة إرسال النتيجة عند الفشل —");
await unmount();
W.localStorage.clear();
net.calls.length = 0;
net.respond = () => JSON.stringify({ ok: false });
await mount();
await startExam("سلمى");
await answerAllQuestions();
await act(async () => {
  click(byText("button", "مراجعة الإجابات")!);
  await sleep(20);
});
await act(async () => {
  click(q('[data-action="submit-exam"]') as HTMLElement);
});
await settle(() => sendStatus() === "failed", 25000);
check("حالة الإرسال: تعذّر", sendStatus() === "failed", sendStatus());
check("ثلاث محاولات ثم توقّف", net.calls.length === 3, String(net.calls.length));
const pendingKeys = Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index)!).filter((key) =>
  key.startsWith(`pending:${EXAM_ID}:`),
);
check("حُفظت الحمولة معلّقة", pendingKeys.length === 1, pendingKeys.join(","));
check("النتيجة والتقرير متاحان رغم فشل الإرسال", !!q("[data-result-question]") && downloads.length >= 1);
const resend = q('[data-action="resend-result"]');
check("زر إعادة الإرسال ظاهر", !!resend);
net.respond = () => JSON.stringify({ ok: true });
const callsBefore = net.calls.length;
await act(async () => {
  click(resend!);
  await sleep(50);
});
await settle(() => sendStatus() === "success", 8000);
check("إعادة الإرسال نجحت", sendStatus() === "success", sendStatus());
check("طلب إضافي واحد", net.calls.length === callsBefore + 1, String(net.calls.length - callsBefore));
check(
  "حُذفت الحمولة المعلّقة",
  Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index)!).filter((key) =>
    key.startsWith(`pending:${EXAM_ID}:`),
  ).length === 0,
);

/* ==================== إعادة الإرسال عند التحميل ==================== */
console.log("\n— إعادة الإرسال عند تحميل التطبيق —");
await unmount();
W.localStorage.clear();
const orphanKey = `pending:${EXAM_ID}:orphan`;
W.localStorage.setItem(
  orphanKey,
  JSON.stringify({
    token: "x",
    attemptId: "orphan",
    examId: EXAM_ID,
    examTitle: "t",
    studentName: "طالبة",
    startAt: new Date().toISOString(),
    submitAt: new Date().toISOString(),
    elapsedSec: 10,
    summary: {},
    lessons: [],
    details: [],
    reportText: "r",
  }),
);
net.calls.length = 0;
net.respond = () => JSON.stringify({ ok: true });
await mount();
await settle(() => W.localStorage.getItem(orphanKey) === null, 5000);
check("أُعيد إرسال المعلّق عند التحميل", W.localStorage.getItem(orphanKey) === null);
check("بلا أي إدخال من الطالب", net.calls.length === 1, String(net.calls.length));

/* ==================== محاولة جديدة ==================== */
console.log("\n— محاولة جديدة —");
await startExam("ريم");
await answerAllQuestions();
await act(async () => {
  click(byText("button", "مراجعة الإجابات")!);
  await sleep(20);
});
await act(async () => {
  click(q('[data-action="submit-exam"]') as HTMLElement);
});
await settle(() => !!q("[data-result-question]"), 8000);
{
  const retry = q('[data-action="retry-exam"]');
  check("زر محاولة جديدة موجود", !!retry);
  await act(async () => {
    click(retry!);
    await sleep(40);
  });
}
check("عاد إلى شاشة الترحيب", !!q("#student-name") && !q("[data-result-question]"));
check("حُذفت المحاولة السابقة", W.localStorage.getItem(ATTEMPT_KEY) === null);
check("لا بقايا تصحيح", !q("[data-result-part]") && !q("[data-result-question]"));
check("المؤقّت صُفّر", bodyText().includes("00:00:00"));

console.log(`\n${failures === 0 ? "✅" : "❌"} سير العمل: ${failures === 0 ? "كل الفحوص ناجحة" : `${failures} فحصاً فاشلاً`}`);
await unmount();

/*
 * ما يبقي حلقة node حيّة: مؤقّت الصفحة (كل ثانية) ومهلة إزالة رابط التنزيل.
 * لا يؤثر في أي فحص، لكنه يمنع إنهاء العملية، فيُنهى صراحةً بعد طباعة النتيجة.
 */
W.close();
setTimeout(() => process.exit(failures ? 1 : 0), 50).unref?.();

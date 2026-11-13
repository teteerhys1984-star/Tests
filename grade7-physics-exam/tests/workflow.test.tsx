/**
 * سير العمل كاملاً داخل DOM حقيقي (jsdom):
 * ترحيب ← اسم الطالبة ← بدء الاختبار ← الإجابة عن كل الأجزاء ← «مراجعة الإجابات» ← تسليم بنقرة واحدة
 * ← تنزيل تلقائي للتقرير ← صفحة النتيجة ← شريط حالة الإرسال (جارٍ/تم/تعذّر) ← «إعادة إرسال النتيجة»
 * ← إعادة الإرسال التلقائي عند فتح الاختبار لاحقاً ← «محاولة جديدة».
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 * فاصلان إعادة المحاولة (2s و5s) يُسرَّعان، ويُتحقق من قيمتهما.
 */
// @ts-nocheck — exam-data.js و report.js ملفّا JavaScript أصليّان بلا أنواع؛ ومنطق الاختبار نفسه يتحقق منه npm test
import "./setup-dom";
import { D, W, blobTexts, downloads, net, netDown, retryWaits, withFastRetryWaits } from "./setup-dom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";
import { EXAM_META, GRAPHS, QUESTIONS, TEACHER_PASSWORD } from "../src/exam-data.js";
import * as R from "../src/report.js";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL, EXAM_TITLE } from "../src/config";
import { pendingKey, type SubmissionPayload } from "../src/submit";

R.bindGraphs(GRAPHS);

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  } else console.log("  ✓ " + name + (extra ? " → " + extra : ""));
}
const equal = (name: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? "" : "got " + a + " — expected " + e);
};

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[];
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
/** النص كما يعرضه التطبيق: بلا علامتَي الترميز الرياضي ⟦⟧. */
const plain = (s: unknown) => String(s ?? "").replace(/⟦|⟧/g, "");
const bodyText = () => D.body.textContent || "";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const banner = () => q("[data-send-status]");
const bannerStatus = () => banner()?.getAttribute("data-send-status") ?? "";
const bannerText = () => norm(banner()?.textContent || "");
const resendButton = () => qa("button").find((b) => norm(b.textContent || "") === "إعادة إرسال النتيجة") ?? null;
const retryButton = () => qa("button").find((b) => norm(b.textContent || "").includes("محاولة جديدة")) ?? null;
const sendCalls = () => net.calls.filter((call) => call.url === SHEETS_URL);
const pendingKeys = () =>
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i) as string).filter((key) => key.startsWith("pending:"));
const lastSent = (): SubmissionPayload => JSON.parse(String(sendCalls()[sendCalls().length - 1].init.body));
const NO_SEND_CLAIM = /لم يُرسل إلى أي جهة خارجية|لا تُرسل الإجابات|دون إرسال أي بيانات/;

async function settle(cond: () => boolean, ms = 4000) {
  await act(async () => {
    const start = Date.now();
    while (!cond() && Date.now() - start < ms) await sleep(15);
    await sleep(50);
  });
}

function fire(el: any, type: string, Ctor: any = W.Event) {
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }));
}
const click = (el: any) => fire(el, "click", W.MouseEvent);
function setInput(el: any, value: string) {
  const proto =
    el instanceof W.HTMLTextAreaElement ? W.HTMLTextAreaElement.prototype
    : el instanceof W.HTMLSelectElement ? W.HTMLSelectElement.prototype
    : W.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
  fire(el, "input");
  fire(el, "change");
}

/* ------------------------------------------------------------------ */
/* إجابات كاملة عبر الواجهة نفسها                                       */
/* ------------------------------------------------------------------ */

/** الإجابة الصحيحة لكل نوع، بصورتها في البيانات الأصلية. */
function correctAnswer(part: any): any {
  switch (part.kind) {
    case "mc":
      return part.answer;
    case "match":
      return part.matchAnswer;
    case "tf":
      return part.tfAnswer ? { judge: "صح" } : { judge: "خطأ", correction: part.correctionText };
    case "blank":
      return part.accept[0];
    case "numeric":
      return String(part.numeric.expected);
    case "text":
      return (part.keywords ?? []).map((kw: any) => kw.alts[0]).join(" و ");
    default:
      return "";
  }
}

/** يجيب عن السؤال المعروض حالياً بجزئياته، عبر نفس أدوات الواجهة. */
async function answerCurrentQuestion(overrides: Record<string, any> = {}) {
  const state = JSON.parse(String(W.localStorage.getItem("g7physics_u1l1_exam_v1")));
  const question = QUESTIONS[state.current];
  const parts = qa(".qcard .part");
  if (parts.length !== question.parts.length) throw new Error("عدد أجزاء السؤال المعروض لا يطابق البيانات");
  for (let i = 0; i < parts.length; i++) {
    const part = question.parts[i];
    const answer = part.id in overrides ? overrides[part.id] : correctAnswer(part);
    const card = parts[i];
    // كل حدث في act منفصل، كما يفعل الطالب: نقرة ثم كتابة
    await act(async () => {
      if (part.kind === "mc" || part.kind === "tf") {
        // نصوص الخيارات تُعرض بلا علامتَي ⟦⟧ (Rich)، فتُقارن بالشكل المعروض نفسه
        const label = part.kind === "mc" ? plain(answer) : answer.judge === "صح" ? "صح ✓" : "خطأ ✗";
        const button = (Array.from(card.querySelectorAll(".opt-btn")) as HTMLElement[]).find((b) => norm(b.textContent || "") === norm(label));
        if (!button) throw new Error("لم يُوجد زر الإجابة في " + part.id);
        click(button);
      } else if (part.kind === "match") {
        const select = card.querySelector("select")!;
        const option = (Array.from(select.options) as HTMLOptionElement[]).find((o) => norm(o.textContent || "") === norm(plain(answer)));
        if (!option) throw new Error("لم يُوجد خيار الوصل في " + part.id);
        setInput(select, option.value);
      } else if (part.kind === "blank" || part.kind === "numeric" || part.kind === "text") {
        const field = (card.querySelector("textarea") || card.querySelector("input")) as HTMLElement;
        setInput(field, String(answer));
      }
    });
    if (part.kind === "tf" && answer.correction) {
      await act(async () => {
        setInput(card.querySelector("textarea") as HTMLElement, answer.correction);
      });
    }
  }
}

async function gotoQuestion(index: number) {
  await act(async () => {
    click(qa(".palette .pal-btn")[index]);
  });
}

async function startExam(name = "سارة أحمد") {
  await act(async () => {
    setInput(q("#student-name"), name);
  });
  await act(async () => {
    click(q(".btn-start"));
  });
}

/** يجيب عن كل الأسئلة الـ12 عبر الواجهة (12 لوحة تنقّل). */
async function answerEverything(overrides: Record<string, any> = {}) {
  for (let i = 0; i < QUESTIONS.length; i++) {
    await gotoQuestion(i);
    await answerCurrentQuestion(overrides);
  }
}

async function mountApp() {
  const root = createRoot(D.getElementById("root")!);
  await act(async () => {
    root.render(<App />);
  });
  return root;
}

async function unmount(root: any) {
  await act(async () => {
    root.unmount();
  });
  D.getElementById("root")!.innerHTML = "";
}

/* ------------------------------------------------------------------ */
/* الاختبارات                                                          */
/* ------------------------------------------------------------------ */
async function main() {
  console.log("\n== 1) الترحيب وبدء الاختبار ==");
  W.localStorage.clear();
  net.calls.length = 0;
  downloads.length = 0;
  blobTexts.length = 0;
  let root = await mountApp();
  check("شاشة البداية ظاهرة", !!q(".intro-card"));
  check("زر البدء معطّل قبل كتابة الاسم", (q(".btn-start") as HTMLButtonElement).disabled);
  check("عنوان الاختبار وبياناته", norm(q(".intro-title")?.textContent) === EXAM_META.title && bodyText().includes("12 سؤالاً") && bodyText().includes("100 علامة"));
  equal("عبارة الخصوصية صحيحة: تُرسَل النتيجة والإجابات إلى المعلّم", bodyText().includes("عند التسليم تُرسَل نتيجتك وإجاباتك إلى معلّمك"), true);
  check("لا عبارة تنفي الإرسال في أي نص", !NO_SEND_CLAIM.test(bodyText()));

  await startExam();
  check("بطاقة السؤال ظهرت", !!q(".qcard"));
  check("العداد التصاعدي ظاهر", /^\d{2}:\d{2}:\d{2}$/.test(norm(q(".timer-val")?.textContent)));
  equal("التسليم معطّل قبل الإجابة", (q(".btn-submit") as HTMLButtonElement).disabled, true);
  equal("عدد أجزاء الاختبار كما في البيانات", QUESTIONS.reduce((sum, question) => sum + question.parts.length, 0), 49);

  console.log("\n== 2) الإجابة عن كل الأسئلة عبر الواجهة ==");
  await answerEverything();
  await act(async () => {
    click(qa(".palette .pal-btn")[11]);
  });
  check("لا يتبقى جزء قبل التمكين", !(q(".btn-submit") as HTMLButtonElement).disabled);
  await act(async () => {
    click(qa("button").find((b) => norm(b.textContent || "") === "مراجعة الإجابات ✎")!);
  });
  check("شاشة مراجعة الإجابات", !!q(".review-list") && qa(".review-item").length === QUESTIONS.length);

  console.log("\n== 3) التسليم: تصحيح + تقرير + إرسال ==");
  net.respond = () => JSON.stringify({ ok: true });
  const submitted = await withFastRetryWaits(async () => {
    await act(async () => {
      click(q(".btn-submit"));
    });
    await settle(() => bannerStatus() === "success");
    return true;
  });
  check("صفحة النتيجة ظهرت", submitted && !!q(".results-card"), bannerStatus());
  equal("شريط الإرسال: نجاح", [bannerStatus(), bannerText().includes("تم إرسال نتيجتك إلى معلّمك ✓")], ["success", true]);
  equal("طلب إرسال واحد", sendCalls().length, 1);
  equal("نوع الطلب ومحتواه", [sendCalls()[0].init.method, sendCalls()[0].init.headers], ["POST", { "Content-Type": "text/plain;charset=utf-8" }]);
  const sent = lastSent();
  equal("معرّف الاختبار = اسم المجلد", sent.examId, EXAM_ID);
  equal("عنوان الاختبار", sent.examTitle, EXAM_TITLE);
  equal("الرمز هو رمز المرجع", sent.token, SHEETS_TOKEN);
  equal("اسم الطالبة", sent.studentName, "سارة أحمد");
  equal("النتيجة الكاملة 100/100", [sent.summary.total, sent.summary.max, sent.summary.percentage], [100, 100, 100]);
  equal("التقدير للمعلّم فقط", sent.summary.gradeLabel, "ممتاز");
  equal("كل الأجزاء صحيحة في الحمولة", [sent.summary.correctSubparts, sent.details.length], [49, 49]);
  equal("مدخل درس لكل سؤال", sent.lessons.length, QUESTIONS.length);
  equal("attemptId فريد مطبوع في التقرير", [typeof sent.attemptId, sent.reportText.includes(sent.attemptId)], ["string", true]);
  check("الحمولة هي تقرير TXT نفسه", sent.reportText.length > 5000 && sent.reportText.includes("سارة أحمد"));
  equal("بدأ التنزيل التلقائي للتقرير", downloads.length, 1);
  equal("اسم ملف التقرير الأصلي", downloads[0].download, R.makeFileName("سارة أحمد"));
  equal("محتوى الملف هو التقرير", blobTexts[0], sent.reportText);
  check("سطر التقرير عن الإرسال صحيح ولا ينفي الإرسال", sent.reportText.includes("تُرسَل النتيجة والإجابات إلى المعلّم") && !NO_SEND_CLAIM.test(sent.reportText));
  check("التقدير لا يظهر في صفحة النتيجة", !bodyText().includes("ممتاز") || bodyText().includes("ممتازة!"));
  equal("لا زر «إعادة إرسال» عند النجاح", resendButton(), null);
  equal("لا شيء معلّق بعد النجاح", pendingKeys(), []);

  await unmount(root);

  console.log("\n== 4) صفحة النتيجة تظهر حتى لو فشل الإرسال + زر مستقل ==");
  W.localStorage.clear();
  net.calls.length = 0;
  downloads.length = 0;
  root = await mountApp();
  await startExam("ليان محمد");
  await answerEverything();
  await act(async () => {
    click(qa(".palette .pal-btn")[11]);
  });
  net.respond = () => netDown() as never;
  await withFastRetryWaits(async () => {
    await act(async () => {
      click(q(".btn-submit"));
    });
    await settle(() => bannerStatus() === "failed");
  });
  equal("النتيجة معروضة رغم فشل الإرسال", [bannerStatus(), !!q(".results-card"), norm(q(".score-num")?.textContent).startsWith("100")], ["failed", true, true]);
  check("رسالة الفشل واضحة", bannerText().includes("تعذّر إرسال النتيجة إلى معلّمك"));
  equal("فواصل إعادة المحاولة 2 ثم 5 ثوانٍ", retryWaits, [2000, 5000]);
  equal("3 محاولات إرسال بالضبط", sendCalls().length, 3);
  equal("كل المحاولات بالمعرّف نفسه", [...new Set(sendCalls().map((call) => JSON.parse(String(call.init.body)).attemptId))].length, 1);
  const failedPayload = JSON.parse(String(sendCalls()[0].init.body)) as SubmissionPayload;
  equal("الحمولة محفوظة تحت pending:<EXAM_ID>:<attemptId>", pendingKeys(), [`pending:${EXAM_ID}:${failedPayload.attemptId}`]);
  equal("التقرير نُزّل رغم فشل الإرسال", downloads.length, 1);
  const resend = resendButton();
  check("زر «إعادة إرسال النتيجة» موجود ومستقل", !!resend && !!retryButton() && resend !== retryButton());
  equal("زر الإرسال ليس زر المحاولة الجديدة", norm(resend?.textContent), "إعادة إرسال النتيجة");

  console.log("\n== 5) زر «إعادة إرسال النتيجة»: فشل ثم نجاح ==");
  net.respond = () => JSON.stringify({ ok: true });
  await withFastRetryWaits(async () => {
    await act(async () => {
      click(resendButton());
    });
    await settle(() => bannerStatus() === "success");
  });
  equal("بعد الإرسال: نجاح", bannerStatus(), "success");
  equal("محاولة رابعة واحدة فقط بالمعرّف نفسه", [sendCalls().length, JSON.parse(String(sendCalls()[3].init.body)).attemptId], [4, failedPayload.attemptId]);
  equal("حُذف المعلّق بعد النجاح", pendingKeys(), []);
  equal("صفحة النتيجة لم تتغير", [!!q(".results-card"), !!retryButton()], [true, true]);

  console.log("\n== 6) إعادة الإرسال التلقائي عند فتح الاختبار لاحقاً ==");
  const earlier = { ...failedPayload, attemptId: "attempt-from-yesterday" };
  await unmount(root);
  // محاولة سابقة لم يصل تأكيدها، وجلسة محفوظة من محاولة أخرى: يُرسَل المعلّق عند فتح الاختبار.
  W.localStorage.clear();
  W.localStorage.setItem(pendingKey(earlier.attemptId), JSON.stringify(earlier));
  net.calls.length = 0;
  net.respond = () => JSON.stringify({ ok: true, duplicate: true });
  root = await mountApp();
  await settle(() => sendCalls().length > 0 && pendingKeys().length === 0);
  equal("عند التحميل: أُرسل المعلّق السابق وحُذف", [sendCalls().length, pendingKeys()], [1, []]);
  equal("بالمعرّف المحفوظ نفسه", JSON.parse(String(sendCalls()[0].init.body)).attemptId, earlier.attemptId);
  equal("على صفحة الترحيب (لا شيء يُعرض للطالب)", [!!q(".intro-card"), bannerStatus()], [true, ""]);

  console.log("\n== 7) إعادة الإرسال بعد إعادة فتح صفحة النتيجة المحفوظة ==");
  await unmount(root);
  W.localStorage.setItem("g7physics_u1l1_exam_v1", JSON.stringify({
    examId: EXAM_META.examId, version: EXAM_META.version, attemptId: failedPayload.attemptId,
    studentName: "ليان محمد", status: "submitted", answers: {}, current: 11, visited: [], order: QUESTIONS.map((_, i) => i),
    startTs: Date.parse(failedPayload.startAt), submitTs: Date.parse(failedPayload.submitAt),
    elapsedMs: Date.parse(failedPayload.submitAt) - Date.parse(failedPayload.startAt),
    sounds: { start: true, submit: true },
    results: {
      score: failedPayload.summary.total, total: failedPayload.summary.max, percent: failedPayload.summary.percentage,
      counts: { correct: 49, partial: 0, incorrect: 0, unanswered: 0 }, details: [],
      reportText: failedPayload.reportText, fileName: "Grade7_Physics_Unit1_Lesson1_Report_ليان_محمد.txt",
      attemptId: failedPayload.attemptId, startTs: Date.parse(failedPayload.startAt), submitTs: Date.parse(failedPayload.submitAt),
    },
    delivery: "failed",
  }));
  net.calls.length = 0;
  net.respond = () => JSON.stringify({ ok: true });
  root = await mountApp();
  check("صفحة النتيجة المحفوظة تُعرض وحالة الفشل واضحة", bannerStatus() === "failed" && !!q(".results-card"), bannerStatus());
  // الحمولة تُجدَّد من المحاولة المحفوظة، والحالة تعود إلى "جارٍ" ثم "تم"
  await unmount(root);
  W.localStorage.setItem("g7physics_u1l1_exam_v1", JSON.stringify({
    examId: EXAM_META.examId, version: EXAM_META.version, attemptId: earlier.attemptId,
    studentName: "ليان محمد", status: "submitted", answers: {}, current: 11, visited: [], order: [0],
    startTs: Date.parse(earlier.startAt), submitTs: Date.parse(earlier.submitAt),
    elapsedMs: 1000, sounds: { start: true, submit: true },
    results: {
      score: earlier.summary.total, total: earlier.summary.max, percent: earlier.summary.percentage,
      counts: { correct: earlier.summary.correctSubparts, partial: 0, incorrect: 0, unanswered: 0 }, details: [],
      reportText: earlier.reportText, fileName: "Grade7_Physics_Unit1_Lesson1_Report_ليان_محمد.txt",
      attemptId: earlier.attemptId, startTs: Date.parse(earlier.startAt), submitTs: Date.parse(earlier.submitAt),
    },
    delivery: "failed",
  }));
  root = await mountApp();
  net.calls.length = 0;
  net.respond = () => netDown() as never;
  await withFastRetryWaits(async () => {
    await act(async () => {
      click(resendButton());
    });
    await settle(() => sendCalls().length === 3);
  });
  equal("الزر يعيد بناء الحمولة بالمعرّف نفسه حتى بعد إعادة الفتح", JSON.parse(String(sendCalls()[0].init.body)).attemptId, earlier.attemptId);
  equal("وتُحفظ من جديد عند الفشل تحت المفتاح نفسه", [bannerStatus(), pendingKeys()], ["failed", [pendingKey(earlier.attemptId)]]);

  console.log("\n== 8) «محاولة جديدة» مستقلة عن الإرسال ==");
  net.respond = () => JSON.stringify({ ok: true });
  await act(async () => {
    click(retryButton());
  });
  check("عادت شاشة البداية مع حالة إرسال نظيفة", !!q(".intro-card") && bannerStatus() === "");
  await startExam("دانا علي");
  equal("اختبار جديد بلا حالة إرسال سابقة", [!!q(".qcard"), bannerStatus()], [true, ""]);
  await unmount(root);

  console.log("\n== 9) الخصوصية: لا عبارة تنفي الإرسال في الشاشات الثلاث ==");
  W.localStorage.clear();
  net.calls.length = 0;
  root = await mountApp();
  check("شاشة الترحيب", !NO_SEND_CLAIM.test(bodyText()));
  await startExam("هدى");
  check("شاشة الاختبار", !NO_SEND_CLAIM.test(bodyText()));
  await answerEverything();
  await act(async () => {
    click(qa(".palette .pal-btn")[11]);
  });
  net.respond = () => JSON.stringify({ ok: true });
  await withFastRetryWaits(async () => {
    await act(async () => {
      click(q(".btn-submit"));
    });
    await settle(() => bannerStatus() === "success");
  });
  check("صفحة النتيجة", !NO_SEND_CLAIM.test(bodyText()) && bodyText().includes("تم إرسال نتيجتك إلى معلّمك ✓"));

  console.log("\n== 10) منطقة المعلم (مفتاح الإجابات) كما كانت ==");
  await act(async () => {
    click(qa("button").find((b) => norm(b.textContent || "") === "منطقة المعلم")!);
  });
  check("بوابة كلمة المرور", !!q(".modal") && !!q('.modal input[type="password"]'));
  await act(async () => {
    setInput(q('.modal input[type="password"]'), TEACHER_PASSWORD);
    click(qa(".modal button").find((b) => norm(b.textContent || "") === "دخول")!);
  });
  check("المفتاح الكامل ظاهر للمعلم مع قواعد التصحيح", !!q(".key-rules") && qa(".key-q").length === QUESTIONS.length && bodyText().includes("نصف العلامة للحكم الصحيح"));
  await unmount(root);

  console.log("\n== 11) لا شبكة حقيقية ==");
  equal("كل الطلبات إلى SHEETS_URL وحدها", [...new Set(net.calls.map((call) => call.url))], [SHEETS_URL]);
  check("لا طلب خارج HTTPS أو إلى عنوان محلي", net.calls.every((call) => call.url.startsWith("https://")));
}

main()
  .catch((error) => {
    failures++;
    console.log("  ✗ استثناء غير متوقع: " + String(error && (error as Error).stack ? (error as Error).stack : error));
  })
  .finally(() => {
    console.log("\nworkflow: " + (failures ? failures + " failed" : "all checks passed"));
    setTimeout(() => process.exit(failures ? 1 : 0), 20);
  });

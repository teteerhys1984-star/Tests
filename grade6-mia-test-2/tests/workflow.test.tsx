/**
 * The whole exam in a real DOM (jsdom), driven through the interface the way a student uses it:
 * welcome → name → every part answered with the on-screen controls → review → submit →
 * automatic TXT download → results page → the result posted to the teacher's sheet →
 * page reloads → a delivery that fails and is sent again → results kept from an earlier session.
 *
 * The app's fetch is intercepted (setup-dom.ts) and carried to a mock server on 127.0.0.1.
 * The real Google endpoint is never contacted.
 */
import "./setup-dom";
import { D, W, audio, blobTexts, consoleErrors, downloads, net, pageErrors, realFetch } from "./setup-dom";
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../src/App";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { EXAM_TITLE, QUESTIONS, TOTAL_MARKS, TOTAL_PARTS, type Part } from "../src/exam/data";
import { STORAGE_KEY, type Attempt } from "../src/exam/attempt";
import { gradeAttempt, type AnswerValue, type GradeResult } from "../src/exam/grade";
import { buildReport, reportFilename } from "../src/exam/report";
import { buildPayload, gradeLabel, pendingKey, type SubmissionPayload } from "../src/exam/submit";
import { CURRENT_REPORT_NOTE, ORIGINAL_REPORT_NOTE } from "./golden";
import { check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer } from "./mock-server";
import { NUMBER_FORMATS, PARTS, correctValue, formatted, partialValues, wrongValue, type Answers } from "./sheets";

let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n✗ the test run did not finish");
});

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */
const norm = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
const q = (selector: string, root: any = D) => root.querySelector(selector) as HTMLElement | null;
const qa = (selector: string, root: any = D) => Array.from(root.querySelectorAll(selector)) as HTMLElement[];
const byText = (selector: string, text: string, root: any = D) =>
  qa(selector, root).find((el) => norm(el.textContent) === text) ?? null;
const bodyText = () => norm(D.body.textContent);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function click(el: any): void {
  if (!el) throw new Error("click: element not found");
  el.dispatchEvent(new W.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function typeInto(el: any, value: string): void {
  if (!el) throw new Error("typeInto: input not found");
  Object.getOwnPropertyDescriptor(W.HTMLInputElement.prototype, "value")!.set!.call(el, value);
  el.dispatchEvent(new W.Event("input", { bubbles: true, cancelable: true }));
}
/** Waits, inside act, until the condition holds (or the time is up), then lets promises settle. */
async function settle(condition: () => boolean, ms: number): Promise<void> {
  await act(async () => {
    const started = Date.now();
    while (!condition() && Date.now() - started < ms) await sleep(20);
    await sleep(40);
  });
}
const pause = (ms: number) => act(async () => sleep(ms));

// The exam clock ticks twice a second; its updates belong to an act scope like every other update.
const browserSetInterval = W.setInterval.bind(W);
(W as any).setInterval = (callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]) =>
  browserSetInterval(() => act(() => callback(...args)), ms, ...args);

/* ---- Saved state ---- */
const savedAttempt = (): Attempt | null => {
  const raw = W.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Attempt) : null;
};
const storageKeysList = (): string[] =>
  Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index) as string);
const pendingKeys = () => storageKeysList().filter((key) => key.startsWith("pending:"));
/** The outcome of the delivery as recorded in the saved attempt. */
const recorded = (state: string) => () => savedAttempt()?.delivery === state;

/* ---- Delivery banner ---- */
const banner = () => q("[data-send-status]");
const bannerStatus = () => banner()?.getAttribute("data-send-status") ?? "";
const bannerText = () => norm(banner()?.querySelector("p")?.textContent);
const sentBody = (index: number) => JSON.parse(String(net.calls[index].init.body)) as SubmissionPayload;

/* ---- The results on screen ---- */
const dial = () => q('[aria-label^="النسبة المئوية"]');
const reviewCards = () => qa("details.review-details");
const submitButtons = () =>
  qa("button").filter((el) => norm(el.textContent).includes("تسليم الاختبار")) as HTMLButtonElement[];

/* ---- Wording ---- */
/** Claims that the result stays on the device. A note that results are not sent by WhatsApp or
 *  e-mail is not one of them: it is still true, and it stayed as it was. */
const NOT_SENT_CLAIM =
  /لا تُرسل الإجابات إلى أي خدمة خارجية|لم تُرسل الإجابات|لم يُرسل إلى أي خادم|دون إرسال أي بيانات|لا توجد\s+خدمة إرسال|محلي على هذا المتصفح فقط/;
const GRADE_WORDS = ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"];
const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
const gradeWordsIn = (text: string) => GRADE_WORDS.filter((word) => wholeWord(word).test(text));
/** The page's text with one piece per line, so that words of neighbouring elements do not run together. */
function pieces(): string {
  const walker = D.createTreeWalker(D.body, 4 /* NodeFilter.SHOW_TEXT */);
  const out: string[] = [];
  while (walker.nextNode()) {
    const text = norm(walker.currentNode.nodeValue);
    if (text) out.push(text);
  }
  return out.join("\n");
}
const screens: Record<string, { text: string; pieces: string }> = {};
const remember = (name: string) => {
  screens[name] = { text: bodyText(), pieces: pieces() };
};

/* ------------------------------------------------------------------ */
/* Answering through the interface                                     */
/* ------------------------------------------------------------------ */
const questionCard = () => q("article.surface");
const partCard = (part: Part) =>
  qa("section.part-card", questionCard() ?? D).find((el) => el.getAttribute("aria-label") === "الجزء " + part.label) ?? null;

/** Enters `value` for one part with the controls of the question on screen. */
async function answerPart(part: Part, value: AnswerValue): Promise<void> {
  if (!partCard(part)) throw new Error("part not on screen: " + part.id);
  if (part.kind === "mcq") {
    // The options are shown in this attempt's own shuffled order.
    const order = savedAttempt()!.optionOrders[part.id] ?? (part.options ?? []).map((option) => option.id);
    const index = order.indexOf(String(value));
    const button = qa("button.choice-card", partCard(part)!)[index];
    if (!button) throw new Error("option not found: " + part.id + " = " + String(value));
    await act(async () => click(button));
    return;
  }
  if (part.kind === "boolean") {
    const wanted = value === "true" ? "صحيح" : "خطأ";
    const button = qa("button.choice-card", partCard(part)!).find((el) => norm(el.textContent) === wanted);
    if (!button) throw new Error("true/false option not found: " + part.id);
    await act(async () => click(button));
    return;
  }
  if (part.kind === "multi") {
    const record = value as Record<string, string>;
    const blanks = part.blanks ?? [];
    for (let index = 0; index < blanks.length; index += 1) {
      const input = qa("input.input-field", partCard(part)!)[index];
      await act(async () => typeInto(input, record[blanks[index].id] ?? ""));
    }
    return;
  }
  await act(async () => typeInto(q("input.input-field", partCard(part)!), String(value)));
}

/** Answers the whole paper in the order on screen. `skip` leaves one part for later. */
async function answerPaper(plan: Answers, skip?: string): Promise<void> {
  const attempt = savedAttempt()!;
  for (let index = 0; index < attempt.questionOrder.length; index += 1) {
    const question = QUESTIONS.find((item) => item.id === attempt.questionOrder[index])!;
    const chip = qa("span", questionCard() ?? D)
      .map((el) => norm(el.textContent))
      .find((text) => /^السؤال \d+ من 30$/.test(text));
    if (chip !== "السؤال " + (index + 1) + " من 30") throw new Error("not on question " + (index + 1) + " (" + chip + ")");
    const topic = norm(qa(".chip-lavender", questionCard() ?? D)[0]?.textContent);
    if (topic !== question.topic) throw new Error("unexpected question on screen at " + (index + 1) + ": " + topic);
    for (const part of question.parts) {
      if (part.id !== skip) await answerPart(part, plan[part.id]);
    }
    if (index < attempt.questionOrder.length - 1) {
      const next = byText("button", "التالي");
      if (!next) throw new Error("no next button on question " + (index + 1));
      await act(async () => click(next));
    }
  }
}

async function startAttempt(name: string): Promise<void> {
  await act(async () => typeInto(q("#student-name"), name));
  const start = byText("button", "ابدأ الاختبار") as HTMLButtonElement | null;
  if (!start || start.disabled) throw new Error("the start button is not ready");
  // jsdom does not run a form's implicit submission when its button is clicked, so the submit
  // event the button would raise in a browser is raised here.
  await act(async () => {
    q("form")!.dispatchEvent(new W.Event("submit", { bubbles: true, cancelable: true }));
  });
}

let root: Root;
async function load(): Promise<void> {
  root = createRoot(D.getElementById("root")!);
  await act(async () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await sleep(30);
  });
}
/** A page reload: the app is torn down and started again from what is in localStorage. */
async function reload(): Promise<void> {
  await act(async () => root.unmount());
  await load();
}

/* ------------------------------------------------------------------ */
/* Answer plans                                                        */
/* ------------------------------------------------------------------ */
/** Mostly right; a few wrong; one «multi» part half right; some numbers in Arabic digits. */
function mixedPlan(): Answers {
  const plan: Answers = {};
  let partialDone = false;
  PARTS.forEach((part, index) => {
    const partial = partialValues(part);
    if (partial.length && !partialDone) {
      partialDone = true;
      plan[part.id] = partial[0];
    } else if (index % 9 === 4) plan[part.id] = wrongValue(part);
    else if (index % 5 === 0) plan[part.id] = formatted(part, NUMBER_FORMATS["arabic-digits"]);
    else plan[part.id] = correctValue(part);
  });
  return plan;
}
const perfectPlan = (): Answers => Object.fromEntries(PARTS.map((part) => [part.id, correctValue(part)]));

async function main(): Promise<void> {
  const server = new MockSheetsServer(SHEETS_TOKEN);
  await server.start();
  // Every request the app makes is recorded with the URL it asked for, then carried to the mock.
  net.handler = (_url, init) => realFetch(server.url, init);

  try {
    /* ================================================================== */
    section("== 1) Welcome ==");
    await load();
    remember("welcome");
    check("the welcome screen is shown", !!q("#student-name") && !!byText("button", "ابدأ الاختبار"));
    check("the paper is announced: 30 questions, 71 parts, 100 marks",
      bodyText().includes("30") && bodyText().includes("سؤالاً رئيسياً") && bodyText().includes(TOTAL_PARTS + "") && bodyText().includes("جزءاً مستقلاً") && bodyText().includes(TOTAL_MARKS + "") && bodyText().includes("الدرجة الكلية"));
    check("it says the result is sent to the teacher", bodyText().includes("وتُرسَل نتيجتك إلى معلّمك عند التسليم"));
    check("no delivery banner and no request before an attempt exists", !banner() && net.calls.length === 0 && server.posts.length === 0);
    const startButton = byText("button", "ابدأ الاختبار") as HTMLButtonElement | null;
    check("the start button is disabled without a name", !!startButton && startButton.disabled);
    await act(async () => {
      q("form")!.dispatchEvent(new W.Event("submit", { bubbles: true, cancelable: true }));
    });
    check("no attempt is created without a name", savedAttempt() === null && !!q("#student-name"));
    check("the name is asked for", !!q("#name-error") && norm(q("#name-error")?.textContent) === "يرجى إدخال اسم الطالب قبل بدء الاختبار.");

    /* ================================================================== */
    section("== 2) The exam, answered through the interface ==");
    await startAttempt("سارة أحمد");
    const started = savedAttempt()!;
    check("the attempt started and is saved", !!questionCard() && started.studentName === "سارة أحمد" && started.attemptId.length >= 10 && started.status === "active", started.attemptId);
    await settle(() => audio.oscillators >= 4, 2000); // the start sound is played a moment after the click
    check("the start sound played once (four notes, one audio context)", audio.oscillators === 4 && audio.contexts === 1, audio.oscillators + " notes");
    check("the question order is the authored one (this paper does not shuffle its questions)",
      same(started.questionOrder, QUESTIONS.map((question) => question.id)));
    check("the options of every choice part are shuffled for this attempt",
      Object.keys(started.optionOrders).length === PARTS.filter((part) => part.kind === "mcq").length &&
        Object.keys(started.optionOrders).some((id) => !same(started.optionOrders[id], PARTS.find((part) => part.id === id)!.options!.map((option) => option.id))),
      Object.keys(started.optionOrders).length + " choice parts");
    remember("exam");

    /** One part of the last question on screen is left for the review step. */
    const lastQuestion = QUESTIONS[QUESTIONS.length - 1];
    const lastPart = lastQuestion.parts[lastQuestion.parts.length - 1];
    const plan = mixedPlan();
    await answerPaper(plan, lastPart.id);
    const saved = savedAttempt()!.answers;
    check("every answer is saved as it is entered, and the skipped part is not",
      same(Object.keys(saved).sort(), Object.keys(plan).filter((id) => id !== lastPart.id).sort()) &&
        Object.keys(plan).every((id) => id === lastPart.id || same(saved[id], plan[id])),
      Object.keys(saved).length + " of " + Object.keys(plan).length + " parts saved");
    check("submit stays disabled while a part is unanswered", submitButtons().length > 0 && submitButtons().every((el) => el.disabled));
    check("the exam says how many parts are left", bodyText().includes("متبقٍ 1 من " + TOTAL_PARTS + " جزءاً دون إجابة"));
    await act(async () => click(byText("button", "مراجعة الإجابات")));
    remember("review");
    check("the review screen counts the missing part and keeps submit disabled",
      bodyText().includes("متبقٍ 1 من " + TOTAL_PARTS + " جزءاً دون إجابة") && submitButtons().every((el) => el.disabled));
    await act(async () => click(byText("button", "متابعة الإجابة")));
    for (let index = 0; index < QUESTIONS.length - 1; index += 1) await act(async () => click(byText("button", "التالي")));
    await answerPart(lastPart, plan[lastPart.id]);
    check("the last part is answered too", savedAttempt()!.answers[lastPart.id] !== undefined && submitButtons().every((el) => !el.disabled));

    /* ================================================================== */
    section("== 3) Submit: report, results page, delivery to the teacher ==");
    let submittedAt = 0;
    await act(async () => {
      submittedAt = Date.now();
      click(submitButtons()[0]);
    });
    const attempt = savedAttempt()!;
    /** The same answers graded again, straight from the saved attempt: the marking of the app. */
    const graded: GradeResult = gradeAttempt(attempt.answers, attempt.questionOrder);
    check("the results page is shown", bodyText().includes("مراجعة تفصيلية للإجابات") && !!dial());
    check("the attempt is saved as submitted, with the delivery still pending",
      attempt.status === "submitted" && typeof attempt.submittedAt === "number" && attempt.delivery === "pending");
    check("the submit sound played (five more notes, the same audio context)", audio.oscillators === 9 && audio.contexts === 1, audio.oscillators + " notes");
    check("the TXT report was downloaded at once", downloads.length === 1 && downloads[0].download === reportFilename("سارة أحمد"), downloads.map((item) => item.download).join(", "));
    const txt = blobTexts[blobTexts.length - 1];
    check("the downloaded file is the report of this attempt",
      txt === "\uFEFF" + buildReport(attempt, graded) && txt.includes("اسم الطالب: سارة أحمد") && txt.startsWith("\uFEFF"));
    check("the report keeps the reworded note and no grade label",
      txt.includes(CURRENT_REPORT_NOTE) && !txt.includes(ORIGINAL_REPORT_NOTE) && gradeWordsIn(txt).length === 0, gradeWordsIn(txt).join("، "));
    check("the score and the percentage on the page are the marked ones",
      dial()?.getAttribute("aria-label") === "النسبة المئوية " + graded.percentage + "%" && norm(dial()?.querySelector("span.num")?.textContent) === String(graded.score),
      graded.score + " / " + TOTAL_MARKS);
    check("every question has its own review card", reviewCards().length === QUESTIONS.length);
    check("banner: «جارٍ إرسال…»", bannerStatus() === "sending", bannerStatus());
    remember("results-sending");

    await settle(recorded("sent"), 8000);
    const sent = sentBody(net.calls.length - 1);
    check("one request, to SHEETS_URL, answered by the mock", net.calls.length === 1 && net.calls[0].url === SHEETS_URL && server.posts.length === 1);
    check("the request arrived within a second of the click", Math.abs(net.calls[0].at - submittedAt) < 1000, net.calls[0].at - submittedAt + " ms");
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓»", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓", bannerText());
    check("no resend button after a success", !(banner()?.querySelector("button") ?? null));
    equal("the payload is the one buildPayload() makes from the saved attempt", sent, buildPayload(attempt, graded, txt));
    check("examId, token and attemptId on the wire", sent.examId === EXAM_ID && sent.examId === "grade6-mia-test-2" && sent.token === SHEETS_TOKEN && sent.attemptId === attempt.attemptId);
    check("the marks on the wire are the marks on the page",
      sent.summary.total === graded.score && sent.summary.max === TOTAL_MARKS && sent.summary.percentage === graded.percentage && sent.details.length === TOTAL_PARTS);
    check("the teacher's grade label is in the payload only",
      sent.summary.gradeLabel === gradeLabel(graded.percentage) && gradeWordsIn(pieces()).length === 0, sent.summary.gradeLabel);
    check("the report is in the payload exactly as downloaded", sent.reportText === txt);
    check("one row in the mock sheet, under the attemptId", server.rows.size === 1 && same(server.rows.get(attempt.attemptId), sent));
    check("the success is recorded in the saved attempt", savedAttempt()!.delivery === "sent");
    check("nothing is kept as pending", pendingKeys().length === 0);
    remember("results-sent");

    /* ================================================================== */
    section("== 4) A reload of the results page does not send again ==");
    const callsBefore = net.calls.length;
    await reload();
    await pause(300);
    check("the results are restored from the saved attempt",
      !!banner() && bodyText().includes("سارة أحمد") && norm(dial()?.querySelector("span.num")?.textContent) === String(graded.score));
    check("banner: already sent", bannerStatus() === "success");
    check("no new request", net.calls.length === callsBefore && server.posts.length === callsBefore);

    /* ================================================================== */
    section("== 5) A new attempt while the sheet cannot be reached ==");
    await act(async () => click(byText("button", "إعادة المحاولة")));
    check("a new attempt starts from the welcome screen", !!q("#student-name") && !banner() && savedAttempt() === null);
    await startAttempt("ليان محمد");
    await answerPaper(perfectPlan());
    check("all parts answered: submit is enabled", submitButtons().every((el) => !el.disabled));
    server.behaviour = "reset"; // every connection is dropped
    const before = net.calls.length;
    await act(async () => click(submitButtons()[0]));
    const second = savedAttempt()!;
    check("results and download are there although nothing can be sent",
      !!banner() && downloads.length === 2 && downloads[1].download === reportFilename("ليان محمد") && norm(dial()?.querySelector("span.num")?.textContent) === "100");
    check("banner: «جارٍ إرسال…»", bannerStatus() === "sending");
    await settle(() => net.calls.length >= before + 1, 4000);
    await pause(150);
    check("first try failed: no immediate second try, nothing stored yet", net.calls.length === before + 1 && bannerStatus() === "sending" && pendingKeys().length === 0);
    await act(async () => {
      W.dispatchEvent(new W.Event("pagehide"));
    });
    check("the page is closed while sending → the payload is stored at once", same(pendingKeys(), [pendingKey(second.attemptId)]));
    await settle(() => net.calls.length >= before + 2, 6000);
    const gap1 = net.calls.length >= before + 2 ? net.calls[before + 1].at - net.calls[before].at : -1;
    check("second try after 2 s", net.calls.length === before + 2 && gap1 >= 1900 && gap1 < 4500, gap1 + " ms");
    await settle(recorded("failed"), 12000);
    const gap2 = net.calls.length >= before + 3 ? net.calls[before + 2].at - net.calls[before + 1].at : -1;
    check("third try after 5 s more", net.calls.length === before + 3 && gap2 >= 4900 && gap2 < 9000, gap2 + " ms");
    check("the three tries carried the same body", [1, 2].every((index) => net.calls[before + index].init.body === net.calls[before].init.body));
    check("banner: «تعذّر إرسال النتيجة تلقائيًا…»", bannerStatus() === "failed" && bannerText() === "تعذّر إرسال النتيجة تلقائيًا. حمّل ملف التقرير وأرسله لمعلّمك.", bannerText());
    const resend = banner()?.querySelector("button") as HTMLButtonElement | null;
    check("with the button «إعادة إرسال النتيجة»", !!resend && norm(resend?.textContent) === "إعادة إرسال النتيجة");
    check("the payload is kept under pending:<EXAM_ID>:<attemptId>",
      same(pendingKeys(), [pendingKey(second.attemptId)]) && W.localStorage.getItem(pendingKey(second.attemptId)) === net.calls[before].init.body);
    check("the failure is recorded in the saved attempt", savedAttempt()!.delivery === "failed");
    check("the failed delivery left the results, the marks and the download untouched",
      !!banner() && reviewCards().length === QUESTIONS.length && norm(dial()?.querySelector("span.num")?.textContent) === "100" && downloads.length === 2);
    check("nothing reached the sheet", server.rows.size === 1 && !server.rows.has(second.attemptId));
    await pause(300);
    check("no fourth try on its own", net.calls.length === before + 3);
    remember("results-failed");
    const failedTxt = blobTexts[blobTexts.length - 1];

    /* ================================================================== */
    section("== 6) «إعادة إرسال النتيجة» once the server is back ==");
    server.behaviour = "apps-script";
    await act(async () => click(resend));
    check("the banner goes back to «جارٍ إرسال…»", bannerStatus() === "sending" || bannerStatus() === "success");
    await settle(recorded("sent"), 8000);
    const resent = sentBody(net.calls.length - 1);
    check("one more request, same attemptId, same body",
      net.calls.length === before + 4 && resent.attemptId === second.attemptId && net.calls[before + 3].init.body === net.calls[before].init.body);
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓»", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓");
    check("the sheet now holds both attempts, each once", server.rows.size === 2 && server.rows.get(second.attemptId).studentName === "ليان محمد");
    check("all correct: 100, 71 correct parts, «ممتاز» for the teacher",
      resent.summary.total === 100 && resent.summary.correctSubparts === TOTAL_PARTS && resent.summary.fullQuestions === QUESTIONS.length &&
        resent.summary.gradeLabel === "ممتاز" && resent.reportText === failedTxt);
    check("the pending copy is gone and the attempt is recorded as sent", pendingKeys().length === 0 && savedAttempt()!.delivery === "sent");
    check("the resend button did not restart the exam or download again", !!banner() && !q("#student-name") && downloads.length === 2);

    /* ================================================================== */
    section("== 7) On load: results kept from an earlier session are sent quietly ==");
    const stale = { ...resent, attemptId: "attempt-kept-from-an-earlier-session", studentName: "طالب سابق" };
    W.localStorage.setItem(pendingKey(stale.attemptId), JSON.stringify(stale));
    W.localStorage.setItem("pending:grade6-mia-test:xyz", '{"attemptId":"xyz","examId":"grade6-mia-test"}');
    W.localStorage.setItem("pending:grade5-math-unit1:abc", '{"attemptId":"abc"}');
    const callsBeforeLoad = net.calls.length;
    await reload();
    await settle(() => server.rows.has(stale.attemptId) && W.localStorage.getItem(pendingKey(stale.attemptId)) === null, 8000);
    check("the kept result was sent once",
      net.calls.length === callsBeforeLoad + 1 && sentBody(callsBeforeLoad).attemptId === stale.attemptId && server.rows.get(stale.attemptId).studentName === "طالب سابق");
    check("and removed after the server confirmed it", W.localStorage.getItem(pendingKey(stale.attemptId)) === null);
    check(
      "the pending results of the other exams were neither sent nor touched",
      W.localStorage.getItem("pending:grade6-mia-test:xyz") === '{"attemptId":"xyz","examId":"grade6-mia-test"}' &&
        W.localStorage.getItem("pending:grade5-math-unit1:abc") === '{"attemptId":"abc"}' && !server.rows.has("xyz") && !server.rows.has("abc")
    );
    check("quietly: the page shows the same results, already sent",
      !!banner() && bannerStatus() === "success" && norm(dial()?.querySelector("span.num")?.textContent) === "100");
    await pause(300);
    check("the attempt on screen was not sent again", net.calls.length === callsBeforeLoad + 1);

    /* ================================================================== */
    section("== 8) Wording, on every screen ==");
    check("the exam's title is on the page", bodyText().includes(EXAM_TITLE) || screens["results-sent"].text.includes(EXAM_TITLE));
    for (const [name, screen] of Object.entries(screens)) {
      check(name + ": nothing says the result is not sent", !NOT_SENT_CLAIM.test(screen.text) && !NOT_SENT_CLAIM.test(screen.pieces), (screen.pieces.match(NOT_SENT_CLAIM) ?? [""])[0]);
      check(name + ": no grade label is shown to the student", gradeWordsIn(screen.pieces).length === 0, gradeWordsIn(screen.pieces).join("، "));
    }
    for (const [name, text] of [["first report", txt], ["second report", failedTxt]] as const) {
      check(name + ": nothing says the result is not sent", !NOT_SENT_CLAIM.test(text));
      check(name + ": no grade label", gradeWordsIn(text).length === 0, gradeWordsIn(text).join("، "));
      check(name + ": the reworded note is there once", text.split(CURRENT_REPORT_NOTE).length - 1 === 1);
    }
    check("the label was sent for both attempts and is in neither page nor file",
      sent.summary.gradeLabel.length > 0 && resent.summary.gradeLabel === "ممتاز" && gradeWordsIn(pieces()).length === 0);

    section("== 9) Nothing left the test ==");
    check("every request asked for SHEETS_URL and was answered by the mock on 127.0.0.1",
      net.calls.length > 0 && net.calls.every((call) => call.url === SHEETS_URL) && server.url.startsWith("http://127.0.0.1:"), net.calls.length + " requests");
    check("every row in the mock sheet carries this exam's id",
      server.rows.size === 3 && [...server.rows.values()].every((row) => row.examId === EXAM_ID && row.examId === "grade6-mia-test-2"));
    check("no uncaught error in the page", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 400));
    check("nothing was written to console.error", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 400));
  } finally {
    await server.stop();
  }
}

main()
  .catch((error) => {
    check("unexpected exception: " + String(error && error.stack ? error.stack : error), false);
  })
  .finally(() => {
    finished = true;
    finish("workflow");
  });

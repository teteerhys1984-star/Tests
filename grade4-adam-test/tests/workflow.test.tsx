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
import { D, W, blobTexts, consoleErrors, downloads, net, pageErrors, realFetch, sounds } from "./setup-dom";
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../src/App";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { ALL_SUBPARTS, QUESTION_MAP, QUESTIONS, STORAGE_KEY } from "../src/exam/data";
import { formatDuration, gradeAttempt, statusLabel } from "../src/exam/grade";
import { buildReportFilename } from "../src/exam/report";
import { buildPayload, gradeLabel, pendingKey } from "../src/exam/submit";
import type { AnswerValue, Answers, Attempt, Subpart } from "../src/exam/types";
import { CURRENT_REPORT_NOTE, ORIGINAL_REPORT_NOTE } from "./golden";
import { check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer } from "./mock-server";
import { NUMBER_FORMATS, correctValue, formatted, partialValues, wrongValue } from "./sheets";

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
const byText = (selector: string, text: string, root: any = D) => qa(selector, root).find((el) => norm(el.textContent) === text) ?? null;
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
/**
 * Waits, inside act, until the condition holds (or the time is up), then lets promises settle.
 * The page is not re-rendered before act ends, so conditions look at storage, requests or the
 * mock server — never at the DOM.
 */
async function settle(condition: () => boolean, ms: number): Promise<void> {
  await act(async () => {
    const started = Date.now();
    while (!condition() && Date.now() - started < ms) await sleep(20);
    await sleep(40);
  });
}
const pause = (ms: number) => act(async () => sleep(ms));

// The exam clock ticks once a second; its updates belong to an act scope like every other update.
const browserSetInterval = W.setInterval.bind(W);
W.setInterval = (callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]) =>
  browserSetInterval(() => act(() => callback(...args)), ms);

/* ---- Saved state ---- */
const savedAttempt = (): Attempt | null => {
  const raw = W.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Attempt) : null;
};
const storageKeys = (): string[] => Array.from({ length: W.localStorage.length }, (_, index) => W.localStorage.key(index) as string);
const pendingKeys = () => storageKeys().filter((key) => key.startsWith("pending:"));
/** The outcome of the delivery as recorded in the saved attempt. */
const recorded = (state: string) => () => savedAttempt()?.delivery === state;

/* ---- Delivery banner ---- */
const banner = () => q("[data-send-status]");
const bannerStatus = () => banner()?.getAttribute("data-send-status") ?? "";
const bannerText = () => norm(banner()?.querySelector("p")?.textContent);
const sentBody = (index: number) => JSON.parse(String(net.calls[index].init.body));

/* ---- Wording ---- */
const NOT_SENT_CLAIM = /لا تُرسل|لا يُرسل|لا ترسل|لا يرسل|أي خدمة خارجية/;
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
/** Keeps the text of a screen, to check the wording of every screen at the end. */
const remember = (name: string) => {
  screens[name] = { text: bodyText(), pieces: pieces() };
};

/* ------------------------------------------------------------------ */
/* Answering through the interface                                     */
/* ------------------------------------------------------------------ */
const partOf = (sub: Subpart) => D.getElementById(sub.id + "-prompt")?.closest("section.subpart") as HTMLElement | null;

/** Enters `value` for one part with the controls of the question on screen. */
async function answerPart(sub: Subpart, value: AnswerValue, attempt: Attempt): Promise<void> {
  const part = partOf(sub);
  if (!part) throw new Error("part not on screen: " + sub.id);
  switch (sub.kind) {
    case "mcq": {
      const order = attempt.optionOrders[questionOf(sub)];
      const shown = order && order.length === sub.options.length ? order : sub.options.map((_, index) => index);
      const button = qa("button.choice", part)[shown.indexOf(value as number)];
      if (norm(q(".choice-text", button)?.textContent) !== norm(sub.options[value as number])) throw new Error("option not found: " + sub.id);
      await act(async () => click(button));
      break;
    }
    case "tf":
      await act(async () => click(byText("button.choice-tf .choice-text", value ? "صواب" : "خطأ", part)!.closest("button")));
      break;
    case "numeric":
      await act(async () => typeInto(q("input.numeric-input", part), value as string));
      break;
    case "pair": {
      const pair = value as { a: string; b: string };
      await act(async () => typeInto(qa(".field-pair input", part)[0], pair.a));
      await act(async () => typeInto(qa(".field-pair input", partOf(sub))[1], pair.b));
      break;
    }
    case "multi": {
      const values = value as string[];
      for (let index = 0; index < values.length; index += 1) {
        await act(async () => typeInto(qa(".field-pair input", partOf(sub))[index], values[index]));
      }
      break;
    }
    case "order":
      for (const item of value as string[]) {
        const chip = qa(".order-bank button.order-chip", partOf(sub)).find((el) => norm(el.querySelector("span")?.textContent) === item);
        if (!chip) throw new Error("order chip not found: " + item);
        await act(async () => click(chip));
      }
      break;
    case "compare":
      await act(async () => click(byText("button.symbol-button", value as string, part)));
      break;
  }
}

const questionOf = (sub: Subpart) => QUESTIONS.find((question) => question.subparts.some((part) => part.id === sub.id))!.id;

/** Answers the whole paper in the order on screen. `skip` leaves one part for later. */
async function answerPaper(plan: Answers, skip?: string): Promise<void> {
  const attempt = savedAttempt()!;
  for (let index = 0; index < attempt.questionOrder.length; index += 1) {
    const question = QUESTION_MAP[attempt.questionOrder[index]];
    if (norm(q(".question-number")?.textContent) !== "السؤال " + (index + 1) + " من 30") throw new Error("not on question " + (index + 1));
    if (norm(q(".question-title")?.textContent) !== norm(question.title)) throw new Error("unexpected question on screen at " + (index + 1));
    for (const sub of question.subparts) {
      if (sub.id !== skip) await answerPart(sub, plan[sub.id], attempt);
    }
    if (index < attempt.questionOrder.length - 1) await act(async () => click(qa(".exam-nav button").find((el) => norm(el.textContent).startsWith("التالي"))));
  }
}

async function startAttempt(name: string): Promise<void> {
  await act(async () => typeInto(q("#student-name"), name));
  await act(async () => click(byText("button", "بدء الاختبار")));
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
/** Mostly right; a few wrong; the first pair and the first multi part half right; some numbers in Arabic digits. */
function mixedPlan(): Answers {
  const plan: Answers = {};
  let pairDone = false;
  let multiDone = false;
  ALL_SUBPARTS.forEach((sub, index) => {
    if (sub.kind === "pair" && !pairDone) {
      pairDone = true;
      plan[sub.id] = partialValues(sub)[0];
    } else if (sub.kind === "multi" && !multiDone) {
      multiDone = true;
      plan[sub.id] = partialValues(sub)[0];
    } else if (index % 9 === 4) {
      plan[sub.id] = wrongValue(sub);
    } else if (index % 5 === 0) {
      plan[sub.id] = formatted(sub, NUMBER_FORMATS["arabic-digits"]);
    } else {
      plan[sub.id] = correctValue(sub);
    }
  });
  return plan;
}
const perfectPlan = (): Answers => Object.fromEntries(ALL_SUBPARTS.map((sub) => [sub.id, correctValue(sub)]));

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
    check("the welcome screen is shown", !!q("#student-name") && !!byText("button", "بدء الاختبار"));
    check("it says the result will be sent to the teacher", !!byText("p.fine-print", "سيتم إرسال نتيجتك إلى معلّمك عند التسليم."));
    check("the footer note is the reworded one", norm(q(".footer-note")?.textContent) === "تُحفظ الإجابات والتقارير محليّاً على جهازك، وتُرسَل نتيجتك إلى معلّمك عند التسليم.");
    check("no delivery banner and no request before an attempt exists", !banner() && net.calls.length === 0 && server.posts.length === 0);
    await act(async () => click(byText("button", "بدء الاختبار")));
    check("a name is still required", !!q("#name-error") && !!q("#student-name") && savedAttempt() === null);

    /* ================================================================== */
    section("== 2) The exam, answered through the interface ==");
    await startAttempt("سارة أحمد");
    const started = savedAttempt()!;
    check("the attempt started and is saved", !!q(".exam-page") && started.phase === "exam" && started.studentName === "سارة أحمد" && started.attemptId.length >= 16, started.attemptId);
    check("the start sound played once", sounds.length === 1);
    check("the questions are shuffled", !same(started.questionOrder, QUESTIONS.map((question) => question.id)) && started.questionOrder.length === 30);
    remember("exam");

    const plan = mixedPlan();
    const lastQuestion = QUESTION_MAP[started.questionOrder[29]];
    const skipped = lastQuestion.subparts[lastQuestion.subparts.length - 1];
    await answerPaper(plan, skipped.id);
    const partly = savedAttempt()!;
    check("70 of 71 parts answered and saved exactly as entered", ALL_SUBPARTS.every((sub) => (sub.id === skipped.id ? partly.answers[sub.id] === undefined : same(partly.answers[sub.id], plan[sub.id]))));
    check("the progress line counts 70 of 71", norm(q(".progress-topline")?.textContent).includes("70 من 71"));

    await act(async () => click(q(".nav-review")));
    const submitButton = () => q("button.button-submit") as HTMLButtonElement | null;
    check("review: one part is missing and the submit button is disabled", norm(q(".completion-count")?.textContent) === "1" && submitButton()!.disabled === true);
    await act(async () => click(submitButton()));
    check("clicking the disabled button submits nothing", savedAttempt()!.phase === "exam" && downloads.length === 0 && net.calls.length === 0);
    remember("review");
    check("review: the reworded rule is shown", !!byText(".mini-rules li", "يُحفظ التقرير على جهازك بصيغة TXT، وتُرسَل نتيجتك إلى معلّمك عند التسليم."));
    await act(async () => click(byText("button.button-mini", "أكمل الآن")));
    check("“أكمل الآن” opens the unfinished question", norm(q(".question-title")?.textContent) === norm(lastQuestion.title));
    await answerPart(skipped, plan[skipped.id], savedAttempt()!);
    await act(async () => click(q(".nav-review")));
    check("review: everything answered, the submit button is enabled", norm(q(".completion-count")?.textContent) === "0" && submitButton()!.disabled === false);
    const beforeSubmit = savedAttempt()!;
    check("all 71 parts are saved exactly as entered", ALL_SUBPARTS.every((sub) => same(beforeSubmit.answers[sub.id], plan[sub.id])));
    check("nothing was sent or downloaded before submission", net.calls.length === 0 && server.posts.length === 0 && downloads.length === 0 && pendingKeys().length === 0);

    /* ================================================================== */
    section("== 3) Submit: marks, TXT download and results page come first ==");
    server.delayMs = 600; // the teacher's server is slow to answer
    await act(async () => click(submitButton()));
    const done = savedAttempt()!;
    const expected = gradeAttempt({ ...done, answers: plan });
    const shownScore = norm(q(".score-number span")?.textContent);
    const shownPercent = norm(q(".score-percent")?.textContent);
    check("the results page is shown at once", !!q(".results-page") && done.phase === "results");
    check("the plan mixes right, half right and wrong parts", expected.counts.correct > 0 && expected.counts.partial === 2 && expected.counts.incorrect > 0 && expected.counts.unanswered === 0, Object.values(expected.counts).join("/"));
    check("the score on screen is the marking of the entered answers", shownScore === String(expected.awarded) && shownPercent === expected.percentage + "%", shownScore + " / 100 · " + shownPercent);
    check("the four counters on screen match", same(qa(".result-metrics .metric-value").map((el) => norm(el.textContent)), [expected.counts.correct, expected.counts.partial, expected.counts.incorrect, expected.counts.unanswered].map(String)));
    check("one card per question and one block per part", qa("article.review-result-card").length === 30 && qa(".review-part").length === 71);
    check("the TXT report was downloaded automatically, once", downloads.length === 1 && downloads[0].download === buildReportFilename("سارة أحمد") && !!byText(".download-note", "▣بدأ تنزيل التقرير تلقائياً. يمكنك تنزيل النسخة الاحتياطية نفسها من الزر أدناه."), downloads[0]?.download);
    check("the submit sound played", sounds.length === 2);
    check("delivery has started and the server has not answered yet", bannerStatus() === "sending" && server.rows.size <= 1 && done.delivery === "pending");
    check("banner: «جارٍ إرسال نتيجتك إلى معلّمك…», without a button", bannerText() === "جارٍ إرسال نتيجتك إلى معلّمك…" && !banner()!.querySelector("button"));
    check("the banner sits between the score and the download note", !!(q(".result-hero")!.compareDocumentPosition(banner()) & 4) && !!(banner()!.compareDocumentPosition(q(".download-note")) & 4));
    remember("results-sending");

    const txt = blobTexts[blobTexts.length - 1];
    const report = txt.slice(1);
    check("the file starts with the UTF-8 BOM and is the saved report", txt.charCodeAt(0) === 0xfeff && report === done.reportText && report.length > 20000, txt.length + " characters");
    check("the report names the student, the attempt and the score", report.includes("سارة أحمد") && report.includes("معرّف المحاولة: " + done.attemptId) && report.includes("الدرجة النهائية: " + expected.awarded + " / 100"));
    check("the report holds the reworded note once and no longer the old one", report.split(CURRENT_REPORT_NOTE).length === 2 && !report.includes(ORIGINAL_REPORT_NOTE));

    /* ================================================================== */
    section("== 4) The result reaches the teacher's sheet (mock server) ==");
    await settle(recorded("sent"), 8000);
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓», without a button", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓" && !banner()!.querySelector("button"), bannerText());
    check("exactly one request, addressed to SHEETS_URL", net.calls.length === 1 && net.calls[0].url === SHEETS_URL && server.posts.length === 1);
    const init = net.calls[0].init;
    check("POST · text/plain;charset=utf-8 · redirect: follow · no mode", init.method === "POST" && same(init.headers, { "Content-Type": "text/plain;charset=utf-8" }) && init.redirect === "follow" && init.mode === undefined);
    const sent = server.posts[0].json;
    check("the server stored one row for this attempt", server.rows.size === 1 && server.rows.has(done.attemptId) && server.posts[0].contentType === "text/plain;charset=utf-8");
    equal("examId on the wire", sent.examId, "grade4-adam-test");
    check("token, attempt id and student name", sent.token === SHEETS_TOKEN && sent.attemptId === done.attemptId && sent.studentName === "سارة أحمد");
    check("the payload is the one built from the saved attempt", same(sent, buildPayload(savedAttempt()!)));
    check("total and percentage are the ones on screen", String(sent.summary.total) === shownScore && sent.summary.percentage + "%" === shownPercent && sent.summary.max === 100);
    check("times and duration are the ones of the attempt", sent.startAt === new Date(done.startTime).toISOString() && sent.submitAt === new Date(done.submissionTime as number).toISOString() && sent.elapsedSec === done.durationSeconds && norm(q(".score-time bdi")?.textContent) === formatDuration(sent.elapsedSec));
    check("71 details, in the order of the results page", sent.details.length === 71 && same(sent.details.map((detail: any) => norm(detail.qTitle)), qa(".review-part").map((el) => norm(el.closest("article")!.querySelector("h3")!.textContent))));
    check(
      "every detail carries the status, marks and answers shown on the results page",
      qa(".review-part").every((el, index) => {
        const detail = sent.details[index];
        const answers = qa(".answer-value", el).map((node) => node.textContent);
        return norm(q(".part-index", el)?.textContent) === detail.label && norm(q(".status-chip", el)?.textContent) === detail.status &&
          norm(q(".part-score", el)?.textContent) === detail.awarded + " / " + detail.marks + " درجة" && answers[0] === detail.studentAnswer && answers[1] === detail.correctAnswer;
      })
    );
    check("statuses sent: right, half right and wrong", same([...new Set(sent.details.map((detail: any) => detail.status))].sort(), [statusLabel("correct"), statusLabel("partial"), statusLabel("incorrect")].sort()));
    check("reportText is the downloaded file, character for character", sent.reportText === txt);
    check("gradeLabel follows the reference scale", sent.summary.gradeLabel === gradeLabel(expected.percentage) && GRADE_WORDS.includes(sent.summary.gradeLabel), sent.summary.gradeLabel + " (" + expected.percentage + "%)");
    check("the delivery is recorded in the saved attempt; nothing is pending", savedAttempt()!.delivery === "sent" && pendingKeys().length === 0);
    check("delivery changed neither the results nor the downloads", norm(q(".score-number span")?.textContent) === shownScore && downloads.length === 1 && qa(".review-part").length === 71);
    remember("results-sent");
    server.delayMs = 0;

    section("== 5) The backup button downloads the same file and sends nothing ==");
    await act(async () => click(byText("button", "تنزيل التقرير TXT")));
    check("a second download with the same name and content", downloads.length === 2 && downloads[1].download === downloads[0].download && blobTexts[blobTexts.length - 1] === txt);
    check("no new request", net.calls.length === 1 && server.posts.length === 1);

    /* ================================================================== */
    section("== 6) Reloading the results page ==");
    await reload();
    await pause(300);
    check("confirmed delivery: the results come back with «تم إرسال…»", !!q(".results-page") && bannerStatus() === "success" && norm(q(".score-number span")?.textContent) === shownScore);
    check("and nothing is sent again", net.calls.length === 1 && server.posts.length === 1);
    check("no new download on reload", downloads.length === 2);

    // An attempt submitted with the earlier copy of this exam has no delivery record.
    const older = savedAttempt()!;
    delete older.delivery;
    W.localStorage.setItem(STORAGE_KEY, JSON.stringify(older));
    server.duplicateReply = { duplicate: true }; // a repeat is answered without "ok"
    await reload();
    check("no delivery record: the banner shows «جارٍ إرسال…» while it is sent", !!q(".results-page") && (bannerStatus() === "sending" || bannerStatus() === "success"));
    await settle(recorded("sent"), 8000);
    check("it is sent once (not twice, although effects run twice in StrictMode)", net.calls.length === 2 && server.posts.length === 2);
    check("with the same attemptId and the same payload", sentBody(1).attemptId === done.attemptId && same(sentBody(1), sent));
    check("the server answers {duplicate:true} → success, still one row", bannerStatus() === "success" && server.rows.size === 1 && savedAttempt()!.delivery === "sent");
    server.duplicateReply = { ok: true, duplicate: true };

    // The page was closed while the result was being sent: a payload is kept and the record says pending.
    const interrupted = savedAttempt()!;
    interrupted.delivery = "pending";
    W.localStorage.setItem(STORAGE_KEY, JSON.stringify(interrupted));
    W.localStorage.setItem(pendingKey(done.attemptId), JSON.stringify({ ...sent, token: "token-of-an-older-copy" }));
    await reload();
    await settle(recorded("sent"), 8000);
    check("interrupted delivery: sent once on reload, with the current token", net.calls.length === 3 && sentBody(2).token === SHEETS_TOKEN && same(sentBody(2), sent));
    check("then recorded as sent and removed from the pending store", savedAttempt()!.delivery === "sent" && pendingKeys().length === 0 && server.rows.size === 1);
    await pause(300);
    check("no further request", net.calls.length === 3);

    /* ================================================================== */
    section("== 7) A new attempt while the server is unreachable ==");
    await act(async () => click(byText("button", "المحاولة مرة أخرى")));
    check("back on the welcome screen, without a banner", !!q("#student-name") && !banner() && savedAttempt() === null);
    check("starting over sends nothing", net.calls.length === 3);
    await startAttempt("ليان محمد");
    const second = savedAttempt()!;
    check("a new attempt with its own id", second.attemptId !== done.attemptId && second.studentName === "ليان محمد" && !banner());
    await answerPaper(perfectPlan());
    await act(async () => click(q(".nav-review")));
    server.behaviour = "reset"; // every connection is dropped
    const callsBefore = net.calls.length;
    await act(async () => click(submitButton()));
    const submittedAt = Date.now();
    const secondDone = savedAttempt()!;
    check("results and download are there although nothing can be sent", !!q(".results-page") && norm(q(".score-number span")?.textContent) === "100" && downloads.length === 3 && downloads[2].download === buildReportFilename("ليان محمد"));
    check("banner: «جارٍ إرسال…»", bannerStatus() === "sending");
    await settle(() => net.calls.length >= callsBefore + 1, 3000);
    await pause(150);
    check("first try failed: no immediate second try, nothing stored yet", net.calls.length === callsBefore + 1 && bannerStatus() === "sending" && pendingKeys().length === 0);
    await act(async () => {
      W.dispatchEvent(new W.Event("pagehide"));
    });
    check("the page is closed while sending → the payload is stored at once", same(pendingKeys(), ["pending:grade4-adam-test:" + secondDone.attemptId]));
    await settle(() => net.calls.length >= callsBefore + 2, 6000);
    const gap1 = net.calls.length >= callsBefore + 2 ? net.calls[callsBefore + 1].at - submittedAt : -1;
    check("second try after 2 s", net.calls.length === callsBefore + 2 && gap1 >= 1900 && gap1 < 4500, gap1 + " ms");
    await settle(recorded("failed"), 12000);
    const gap2 = net.calls.length >= callsBefore + 3 ? net.calls[callsBefore + 2].at - net.calls[callsBefore + 1].at : -1;
    check("third try after 5 s more", net.calls.length === callsBefore + 3 && gap2 >= 4900 && gap2 < 9000, gap2 + " ms");
    check("the three tries carried the same body", [1, 2].every((index) => net.calls[callsBefore + index].init.body === net.calls[callsBefore].init.body));
    check("banner: «تعذّر إرسال النتيجة تلقائيًا…»", bannerStatus() === "failed" && bannerText() === "تعذّر إرسال النتيجة تلقائيًا. حمّل ملف التقرير وأرسله لمعلّمك.", bannerText());
    const resend = banner()?.querySelector("button") as HTMLButtonElement | null;
    check("with the button «إعادة إرسال النتيجة»", !!resend && norm(resend.textContent) === "إعادة إرسال النتيجة");
    check("the payload is kept under pending:<EXAM_ID>:<attemptId>", same(pendingKeys(), [pendingKey(secondDone.attemptId)]) && W.localStorage.getItem(pendingKey(secondDone.attemptId)) === net.calls[callsBefore].init.body);
    check("the failure is recorded in the saved attempt", savedAttempt()!.delivery === "failed");
    check("the failed delivery left the results, the marks and the download untouched", !!q(".results-page") && qa(".review-part").length === 71 && norm(q(".score-number span")?.textContent) === "100" && downloads.length === 3);
    check("nothing reached the sheet", server.rows.size === 1 && !server.rows.has(secondDone.attemptId));
    await pause(300);
    check("no fourth try on its own", net.calls.length === callsBefore + 3);
    remember("results-failed");
    const failedTxt = blobTexts[blobTexts.length - 1];

    section("== 8) «إعادة إرسال النتيجة» once the server is back ==");
    server.behaviour = "apps-script";
    await act(async () => click(resend));
    check("the banner goes back to «جارٍ إرسال…»", bannerStatus() === "sending" || bannerStatus() === "success");
    await settle(recorded("sent"), 8000);
    const resent = sentBody(net.calls.length - 1);
    check("one more request, same attemptId, same body", net.calls.length === callsBefore + 4 && resent.attemptId === secondDone.attemptId && net.calls[callsBefore + 3].init.body === net.calls[callsBefore].init.body);
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓»", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓");
    check("the sheet now holds both attempts, each once", server.rows.size === 2 && server.rows.get(secondDone.attemptId).studentName === "ليان محمد");
    check("all correct: 100, 71 correct parts, «ممتاز» for the teacher", resent.summary.total === 100 && resent.summary.correctSubparts === 71 && resent.summary.fullQuestions === 30 && resent.summary.gradeLabel === "ممتاز" && resent.reportText === failedTxt);
    check("the pending copy is gone and the attempt is recorded as sent", pendingKeys().length === 0 && savedAttempt()!.delivery === "sent");
    check("the resend button did not restart the exam or download again", !!q(".results-page") && !q("#student-name") && downloads.length === 3);

    /* ================================================================== */
    section("== 9) On load: results kept from an earlier session are sent quietly ==");
    const stale = { ...sent, attemptId: "attempt-kept-from-an-earlier-session", studentName: "طالب سابق" };
    W.localStorage.setItem(pendingKey(stale.attemptId), JSON.stringify(stale));
    W.localStorage.setItem("pending:grade4-adam-test-2:xyz", '{"attemptId":"xyz","examId":"grade4-adam-test-2"}');
    W.localStorage.setItem("pending:grade5-math-unit1:abc", '{"attemptId":"abc"}');
    const callsBeforeLoad = net.calls.length;
    await reload();
    await settle(() => server.rows.has(stale.attemptId) && W.localStorage.getItem(pendingKey(stale.attemptId)) === null, 8000);
    check("the kept result was sent once", net.calls.length === callsBeforeLoad + 1 && sentBody(callsBeforeLoad).attemptId === stale.attemptId && server.rows.get(stale.attemptId).studentName === "طالب سابق");
    check("and removed after the server confirmed it", W.localStorage.getItem(pendingKey(stale.attemptId)) === null);
    check(
      "the pending results of the other exams were neither sent nor touched",
      W.localStorage.getItem("pending:grade4-adam-test-2:xyz") === '{"attemptId":"xyz","examId":"grade4-adam-test-2"}' &&
        W.localStorage.getItem("pending:grade5-math-unit1:abc") === '{"attemptId":"abc"}' && !server.rows.has("xyz") && !server.rows.has("abc")
    );
    check("quietly: the page shows the same results, already sent", !!q(".results-page") && bannerStatus() === "success" && norm(q(".score-number span")?.textContent) === "100");
    await pause(300);
    check("the attempt on screen was not sent again", net.calls.length === callsBeforeLoad + 1);

    /* ================================================================== */
    section("== 10) Wording, on every screen ==");
    for (const [name, screen] of Object.entries(screens)) {
      check(name + ": nothing says the result is not sent", !NOT_SENT_CLAIM.test(screen.text) && !NOT_SENT_CLAIM.test(screen.pieces));
      check(name + ": no grade label", gradeWordsIn(screen.pieces).length === 0, gradeWordsIn(screen.pieces).join("، "));
    }
    for (const [name, text] of [["first report", txt], ["second report", failedTxt]] as const) {
      check(name + ": nothing says the result is not sent", !NOT_SENT_CLAIM.test(text));
      check(name + ": no grade label", gradeWordsIn(text).length === 0, gradeWordsIn(text).join("، "));
    }
    check("the label was sent for both attempts and is in neither page nor file", sent.summary.gradeLabel.length > 0 && resent.summary.gradeLabel === "ممتاز" && gradeWordsIn(pieces()).length === 0);

    section("== 11) Nothing left the test ==");
    check("every request asked for SHEETS_URL and was answered by the mock on 127.0.0.1", net.calls.length > 0 && net.calls.every((call) => call.url === SHEETS_URL) && server.url.startsWith("http://127.0.0.1:"), net.calls.length + " requests");
    check("every row in the mock sheet carries this exam's id", server.rows.size === 3 && [...server.rows.values()].every((row) => row.examId === EXAM_ID && row.examId === "grade4-adam-test"));
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

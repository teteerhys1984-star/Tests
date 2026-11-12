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
import { D, W, blobTexts, consoleErrors, downloads, net, pageErrors, realFetch, tones } from "./setup-dom";
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../src/App";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { ALL_SUBS, QUESTIONS, type Sub } from "../src/data/exam";
import { STATUS_AR, gradeAll, type Ans, type Answers } from "../src/lib/grade";
import { plain, reportFilename, validateReport } from "../src/lib/report";
import type { Attempt } from "../src/lib/store";
import { buildPayload, gradeLabel, pendingKey } from "../src/lib/submit";
import { fmtDuration, fmtNum, toAr } from "../src/lib/text";
import { check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer } from "./mock-server";
import { NUMBER_FORMATS, correctValue, formatted, partialValues, wrongValue } from "./sheets";

let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n✗ the test run did not finish");
});

/** Where the exam keeps its autosave (KEY in src/lib/store.ts). */
const STORAGE_KEY = "adam_g4_math_attempt_v1";

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

// The exam clock ticks twice a second; its updates belong to an act scope like every other update.
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

/* ---- Results page ---- */
const topCard = () => q("section.mc-card.text-center");
const scoreText = () => norm(q(".text-5xl bdi")?.textContent);
const questionCards = () => (topCard() ? qa("section.mc-card").slice(1) : []);
const partsOf = (card: HTMLElement) => (Array.from(card.children) as HTMLElement[]).filter((el) => el.matches("div.bg-white"));
const partBlocks = () => questionCards().flatMap((card) => partsOf(card));
const resultsShown = () => !!byText("h2", "مراجعة الإجابات كاملة") && !!topCard();
/** The line of encouragement of the results page — the exam's own, by percentage, kept as it was. */
const encouragement = () => q("section.mc-card.text-center > div.font-bold.text-lg");
const ENCOURAGEMENT = (percent: number) =>
  percent >= 90 ? "أداء رائع يا بطل! 💎" : percent >= 75 ? "عمل ممتاز! ⛏️" : percent >= 50 ? "جيد، واصل التدرّب! 🌱" : "لا بأس، حاول مرة أخرى وستتحسّن! 🧱";

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
/**
 * The page's text with one piece per line, so that words of neighbouring elements do not run
 * together. The exam's own line of encouragement is left out: it is checked on its own, and its
 * wording («عمل ممتاز!», «جيد، واصل التدرّب!») is not the grade label sent to the teacher.
 */
function pieces(): string {
  const skip = encouragement();
  const walker = D.createTreeWalker(D.body, 4 /* NodeFilter.SHOW_TEXT */);
  const out: string[] = [];
  while (walker.nextNode()) {
    if (skip && skip.contains(walker.currentNode)) continue;
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
const questionOf = (sub: Sub) => QUESTIONS.find((question) => question.subs.some((part) => part.id === sub.id))!;
const onQuestion = (number: number) => bodyText().includes("السؤال " + toAr(number) + " من " + toAr(30));

/** The card of one part of the question on screen (the parts are shown in the order of the bank). */
function partCard(sub: Sub): HTMLElement {
  const question = questionOf(sub);
  const cards = qa("div.mc-card.pop");
  const card = cards[question.subs.findIndex((part) => part.id === sub.id)];
  if (!card || cards.length !== question.subs.length) throw new Error("part not on screen: " + sub.id);
  if (norm(q(".flex-1", card)?.textContent) !== norm(toAr(plain(sub.prompt)))) throw new Error("another part is on screen instead of " + sub.id);
  return card;
}

/** Enters `value` for one part with the controls of the question on screen. */
async function answerPart(sub: Sub, value: Ans): Promise<void> {
  const order = savedAttempt()!.optionOrder[sub.id] ?? [];
  switch (sub.kind) {
    case "mcq":
      await act(async () => click(qa('button.mc-opt[role="radio"]', partCard(sub))[order.indexOf(value as string)]));
      break;
    case "multi":
      for (const key of value as string[]) {
        await act(async () => click(qa('button.mc-opt[role="checkbox"]', partCard(sub))[order.indexOf(key)]));
      }
      break;
    case "order":
      for (const key of value as string[]) {
        // The bank lists, in the shuffled order, the items that are not placed yet.
        const placed = (savedAttempt()!.answers[sub.id] as string[] | undefined) ?? [];
        const bank = order.filter((item) => !placed.includes(item));
        const chips = qa("button.chip", partCard(sub)).filter((chip) => !chip.closest(".slot"));
        if (chips.length !== bank.length || !bank.includes(key)) throw new Error("order item not in the bank: " + key);
        await act(async () => click(chips[bank.indexOf(key)]));
      }
      break;
    case "fields": {
      const values = value as string[];
      for (let index = 0; index < values.length; index += 1) {
        await act(async () => typeInto(qa("input.mc-input", partCard(sub))[index], values[index]));
      }
      break;
    }
    case "plot": {
      const [x, y] = (value as string).split(",").map(Number);
      const grid = sub.fig as { maxY: number };
      await act(async () => click(qa("circle.grid-hit", partCard(sub))[x * (grid.maxY + 1) + y]));
      break;
    }
    case "tfc": {
      const chosen = value as { c: "T" | "F"; corr: string };
      const word = chosen.c === "T" ? "صحيحة" : "خاطئة";
      await act(async () => click(qa('button.mc-opt[role="radio"]', partCard(sub)).find((button) => norm(button.textContent).endsWith(word))));
      // The correction is typed where the part has a correction box; q08a has none.
      if (chosen.c === "F" && sub.tf!.corrLabel) await act(async () => typeInto(q("input.mc-input", partCard(sub)), chosen.corr));
      break;
    }
  }
}

/** Answers the whole paper in the order on screen. `skip` leaves one part for later. */
async function answerPaper(plan: Answers, skip?: string): Promise<void> {
  const attempt = savedAttempt()!;
  for (let index = 0; index < attempt.order.length; index += 1) {
    const question = QUESTIONS.find((item) => item.id === attempt.order[index])!;
    if (!onQuestion(index + 1)) throw new Error("not on question " + (index + 1));
    for (const sub of question.subs) {
      if (sub.id !== skip) await answerPart(sub, plan[sub.id]);
    }
    if (index < attempt.order.length - 1) await act(async () => click(byText("button", "التالي →")));
  }
}

async function startAttempt(name: string): Promise<void> {
  await act(async () => typeInto(q("#stname"), name));
  await act(async () => click(byText("button", "ابدأ الاختبار")));
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
/**
 * A complete answer that earns nothing, as the interface stores it. The first statement of the
 * true/false question (q08a) is true and has no correction box: it is wrong with «خاطئة» alone,
 * while wrongValue() adds a correction text there that no control on the page can enter.
 */
const wrongOnScreen = (sub: Sub): Ans => (sub.kind === "tfc" && !sub.tf!.corrLabel ? { c: "F", corr: "" } : wrongValue(sub));
const shape = (sub: Sub) => sub.kind + (sub.kind === "fields" ? ":" + (sub.template ? "template" : sub.layout ?? "plain") : "");

/**
 * Mostly right; a few wrong, among them «خاطئة» on the true statement that has no correction box
 * (q08a); one part of every kind that gives partial credit is partly right (several choices,
 * ordering, each layout of number boxes, the point on the grid, true/false with a correction);
 * some numbers are typed in Arabic digits.
 */
function mixedPlan(): Answers {
  const plan: Answers = {};
  const partlyRight = new Set<string>();
  ALL_SUBS.forEach((sub, index) => {
    const partial = partialValues(sub);
    if (partial.length && !partlyRight.has(shape(sub))) {
      partlyRight.add(shape(sub));
      plan[sub.id] = partial[0];
    } else if (index % 9 === 4 || sub.id === "q08a") {
      // q08a is always answered «خاطئة»: the choice that used to make the paper impossible to submit.
      plan[sub.id] = wrongOnScreen(sub);
    } else if (index % 5 === 0) {
      plan[sub.id] = formatted(sub, NUMBER_FORMATS["arabic-digits"]);
    } else {
      plan[sub.id] = correctValue(sub);
    }
  });
  return plan;
}
const perfectPlan = (): Answers => Object.fromEntries(ALL_SUBS.map((sub) => [sub.id, correctValue(sub)]));

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
    check("the welcome screen is shown", !!q("#stname") && !!byText("button", "ابدأ الاختبار"));
    check("it says the result will be sent to the teacher", !!byText("p", "سيتم إرسال نتيجتك إلى معلّمك عند التسليم."));
    check("no delivery banner and no request before an attempt exists", !banner() && net.calls.length === 0 && server.posts.length === 0);
    await act(async () => click(byText("button", "ابدأ الاختبار")));
    check("a name is still required", bodyText().includes("الرجاء كتابة اسمك أولاً.") && !!q("#stname") && savedAttempt() === null);

    /* ================================================================== */
    section("== 2) The exam, answered through the interface ==");
    await startAttempt("سارة أحمد");
    const started = savedAttempt()!;
    check("the attempt started and is saved", onQuestion(1) && started.phase === "exam" && started.name === "سارة أحمد" && /^A[0-9A-Z]+-[0-9A-Z]+$/.test(started.attemptId), started.attemptId);
    check("the start sound played once (4 tones)", tones.length === 4);
    check(
      "the questions are shuffled",
      started.order.length === 30 && !same(started.order, QUESTIONS.map((question) => question.id)) && same([...started.order].sort(), QUESTIONS.map((question) => question.id).sort())
    );
    remember("exam");

    const plan = mixedPlan();
    const lastQuestion = QUESTIONS.find((question) => question.id === started.order[29])!;
    const skipped = lastQuestion.subs[lastQuestion.subs.length - 1];
    await answerPaper(plan, skipped.id);
    const partly = savedAttempt()!;
    check("66 of 67 parts answered and saved exactly as entered", ALL_SUBS.every((sub) => (sub.id === skipped.id ? partly.answers[sub.id] === undefined : same(partly.answers[sub.id], plan[sub.id]))));
    check("the progress line counts 66 of 67", bodyText().includes("تمت الإجابة عن " + toAr(66) + " من " + toAr(67) + " فرعاً"));
    check("q08a, a true statement without a correction box, was answered «خاطئة» on screen and is one of the 66", same(plan.q08a, { c: "F", corr: "" }) && same(partly.answers.q08a, plan.q08a));

    await reload();
    check(
      "a reload during the exam: same question, same answers, nothing sent, no sound again",
      onQuestion(30) && same(savedAttempt()!.answers, partly.answers) && savedAttempt()!.attemptId === started.attemptId && !banner() && net.calls.length === 0 && tones.length === 4
    );

    await act(async () => click(byText("button", "مراجعة وتسليم →")));
    const submitButton = () => byText("button", "تسليم الاختبار") as HTMLButtonElement | null;
    check("review: one part is missing and the submit button is disabled", bodyText().includes("عدد الفروع التي لم تُجب عنها بعد: " + toAr(1)) && submitButton()!.disabled === true);
    await act(async () => click(submitButton()));
    check("clicking the disabled button submits nothing", savedAttempt()!.phase === "exam" && downloads.length === 0 && net.calls.length === 0);
    remember("review");
    await act(async () => click(qa("button").filter((el) => norm(el.textContent) === "فتح / تعديل")[29]));
    check("«فتح / تعديل» opens the unfinished question", onQuestion(30) && qa("div.mc-card.pop").length === lastQuestion.subs.length);
    await answerPart(skipped, plan[skipped.id]);
    await act(async () => click(byText("button", "مراجعة وتسليم →")));
    check("review: everything answered, the submit button is enabled", bodyText().includes("تمت الإجابة عن جميع الفروع. يمكنك تسليم الاختبار الآن.") && submitButton()!.disabled === false);
    const beforeSubmit = savedAttempt()!;
    check("all 67 parts are saved exactly as entered", ALL_SUBS.every((sub) => same(beforeSubmit.answers[sub.id], plan[sub.id])));
    check("nothing was sent or downloaded before submission", net.calls.length === 0 && server.posts.length === 0 && downloads.length === 0 && pendingKeys().length === 0);

    /* ================================================================== */
    section("== 3) Submit: marks, TXT download and results page come first ==");
    server.delayMs = 600; // the teacher's server is slow to answer
    await act(async () => click(submitButton()));
    const done = savedAttempt()!;
    const expected = gradeAll(plan);
    const shownScore = scoreText();
    const percentLine = (percent: number) => !!byText("div", "النسبة المئوية: " + toAr(fmtNum(percent)) + "٪");
    check("the results page is shown at once", resultsShown() && done.phase === "done");
    check(
      "the plan mixes right, partly right and wrong parts, with marks that are not whole numbers",
      expected.correct > 0 && expected.partial >= 6 && expected.incorrect > 0 && expected.unanswered === 0 && !Number.isInteger(expected.total),
      [expected.correct, expected.partial, expected.incorrect, expected.unanswered].join("/") + " · " + expected.total + " / 100"
    );
    check("the marking stored with the attempt is the marking of the entered answers", same(done.result, expected));
    const q08aMarked = done.result!.items.find((item) => item.subId === "q08a")!;
    check("q08a, answered «خاطئة», is marked wrong with 0 of 1", q08aMarked.status === "incorrect" && q08aMarked.awarded === 0 && q08aMarked.marks === 1 && q08aMarked.studentText === "خاطئة");
    check("the score on screen is that marking", shownScore === toAr(fmtNum(expected.total)) + " / " + toAr(100) && percentLine(expected.percent), shownScore + " · " + fmtNum(expected.percent) + "%");
    check(
      "the counters on screen match",
      same(qa("span.badge", topCard()).map((el) => norm(el.textContent)), ["صحيحة: " + toAr(expected.correct), "جزئية: " + toAr(expected.partial), "خاطئة: " + toAr(expected.incorrect)])
    );
    check("the line of encouragement is the exam's own, unchanged", norm(encouragement()?.textContent) === ENCOURAGEMENT(expected.percent), norm(encouragement()?.textContent));
    check("one card per question and one block per part", questionCards().length === 30 && partBlocks().length === 67);
    check(
      "the TXT report was downloaded automatically, once",
      downloads.length === 1 && downloads[0].download === reportFilename("سارة أحمد") && bodyText().includes("بدأ تنزيل التقرير تلقائياً عند التسليم. إذا لم يظهر التنزيل فاستعمل الزر أعلاه."),
      downloads[0]?.download
    );
    check("the submit sound played once (7 more tones)", tones.length === 11);
    check("delivery has started and the server has not answered yet", bannerStatus() === "sending" && server.rows.size <= 1 && done.delivery === "pending");
    check("banner: «جارٍ إرسال نتيجتك إلى معلّمك…», without a button", bannerText() === "جارٍ إرسال نتيجتك إلى معلّمك…" && !banner()!.querySelector("button"));
    const downloadButton = () => byText("button", "تنزيل التقرير TXT");
    check(
      "the banner sits in the score card, between the score and the buttons",
      topCard()!.contains(banner()) && !!(q(".text-5xl")!.compareDocumentPosition(banner()) & 4) && !!(banner()!.compareDocumentPosition(downloadButton()) & 4)
    );
    remember("results-sending");

    const txt = blobTexts[blobTexts.length - 1];
    const report = txt.slice(1);
    check("the file starts with the UTF-8 BOM and is the saved report", txt.charCodeAt(0) === 0xfeff && report === done.reportText && report.length > 15000, txt.length + " characters");
    check(
      "the report names the student, the attempt and the score",
      report.includes("اسم الطالب: سارة أحمد") && report.includes("معرّف المحاولة: " + done.attemptId) && report.includes("الدرجة: " + fmtNum(expected.total) + " / 100")
    );
    check("the report passes the exam's own validation", validateReport(report, done, expected));

    /* ================================================================== */
    section("== 4) The result reaches the teacher's sheet (mock server) ==");
    await settle(recorded("sent"), 8000);
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓», without a button", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓" && !banner()!.querySelector("button"), bannerText());
    check("exactly one request, addressed to SHEETS_URL", net.calls.length === 1 && net.calls[0].url === SHEETS_URL && server.posts.length === 1);
    const init = net.calls[0].init;
    check("POST · text/plain;charset=utf-8 · redirect: follow · no mode", init.method === "POST" && same(init.headers, { "Content-Type": "text/plain;charset=utf-8" }) && init.redirect === "follow" && init.mode === undefined);
    const sent = server.posts[0].json;
    check("the server stored one row for this attempt", server.rows.size === 1 && server.rows.has(done.attemptId) && server.posts[0].contentType === "text/plain;charset=utf-8");
    equal("examId on the wire", sent.examId, "grade4-adam-test-2");
    check("token, attempt id and student name", sent.token === SHEETS_TOKEN && sent.attemptId === done.attemptId && sent.studentName === "سارة أحمد");
    check("the payload is the one built from the saved attempt", same(sent, buildPayload(savedAttempt()!)));
    check("total and percentage are the ones on screen", toAr(fmtNum(sent.summary.total)) + " / " + toAr(sent.summary.max) === shownScore && percentLine(sent.summary.percentage) && sent.summary.max === 100);
    check(
      "times and duration are the ones of the attempt",
      sent.startAt === new Date(done.startedAt).toISOString() && sent.submitAt === new Date(done.submittedAt as number).toISOString() &&
        sent.elapsedSec === Math.floor((done.durationMs as number) / 1000) && norm(q("bdi.font-extrabold")?.textContent) === fmtDuration(sent.elapsedSec * 1000)
    );
    check(
      "67 details, question by question in the order of the results page",
      sent.details.length === 67 &&
        questionCards().every((card, index) => {
          const mine = sent.details.filter((detail: any) => detail.q === index + 1);
          const topic = norm(q("span.font-extrabold", card)?.textContent);
          return (
            norm(q("span.badge", card)?.textContent) === "السؤال " + toAr(index + 1) && mine.length > 0 && mine.length === partsOf(card).length &&
            mine.every((detail: any) => detail.lessons === topic && detail.qTitle.startsWith(topic + " (" + done.order[index] + ")"))
          );
        })
    );
    check(
      "every detail carries the letter, status, marks and answers shown on the results page",
      partBlocks().every((el, index) => {
        const detail = sent.details[index];
        const badges = qa("span.badge", el).map((node) => norm(node.textContent));
        const lines = qa("div.text-sm", el).map((node) => norm(node.textContent));
        return (
          badges[0] === "(" + detail.label + ")" && badges[1] === detail.status && badges[2] === toAr(fmtNum(detail.awarded)) + " / " + toAr(detail.marks) &&
          lines.includes(norm("إجابتك: " + toAr(detail.studentAnswer))) && lines.includes(norm("الإجابة الصحيحة: " + toAr(detail.correctAnswer)))
        );
      })
    );
    check(
      "statuses sent: right, partly right and wrong",
      same([...new Set(sent.details.map((detail: any) => detail.status))].sort(), [STATUS_AR.correct, STATUS_AR.partial, STATUS_AR.incorrect].sort())
    );
    check("reportText is the downloaded file, character for character", sent.reportText === txt);
    check("gradeLabel follows the reference scale", sent.summary.gradeLabel === gradeLabel(expected.percent) && GRADE_WORDS.includes(sent.summary.gradeLabel), sent.summary.gradeLabel + " (" + expected.percent + "%)");
    check("the delivery is recorded in the saved attempt; nothing is pending", savedAttempt()!.delivery === "sent" && pendingKeys().length === 0);
    check(
      "delivery changed neither the results nor the report nor the downloads",
      scoreText() === shownScore && downloads.length === 1 && partBlocks().length === 67 && same(savedAttempt()!.result, expected) && savedAttempt()!.reportText === report
    );
    remember("results-sent");
    server.delayMs = 0;

    section("== 5) The backup button downloads the same file and sends nothing ==");
    await act(async () => click(downloadButton()));
    check("a second download with the same name and content", downloads.length === 2 && downloads[1].download === downloads[0].download && blobTexts[blobTexts.length - 1] === txt);
    check("no new request", net.calls.length === 1 && server.posts.length === 1);

    /* ================================================================== */
    section("== 6) Reloading the results page ==");
    await reload();
    await pause(300);
    check("confirmed delivery: the results come back with «تم إرسال…»", resultsShown() && bannerStatus() === "success" && scoreText() === shownScore);
    check("and nothing is sent again", net.calls.length === 1 && server.posts.length === 1);
    check("no new download and no sound on reload", downloads.length === 2 && tones.length === 11);

    // An attempt submitted with the earlier copy of this exam has no delivery record.
    const older = savedAttempt()!;
    delete older.delivery;
    W.localStorage.setItem(STORAGE_KEY, JSON.stringify(older));
    server.duplicateReply = { duplicate: true }; // a repeat is answered without "ok"
    await reload();
    check("no delivery record: the banner shows «جارٍ إرسال…» while it is sent", resultsShown() && (bannerStatus() === "sending" || bannerStatus() === "success"));
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
    await act(async () => click(byText("button", "Try Again — محاولة جديدة")));
    check("back on the welcome screen, without a banner", !!q("#stname") && !banner() && savedAttempt() === null);
    check("starting over sends nothing", net.calls.length === 3);
    await startAttempt("ليان محمد");
    const second = savedAttempt()!;
    check("a new attempt with its own id", second.attemptId !== done.attemptId && second.name === "ليان محمد" && !banner() && tones.length === 15);
    await answerPaper(perfectPlan());
    await act(async () => click(byText("button", "مراجعة وتسليم →")));
    server.behaviour = "reset"; // every connection is dropped
    const callsBefore = net.calls.length;
    await act(async () => click(submitButton()));
    const submittedAt = Date.now();
    const secondDone = savedAttempt()!;
    check(
      "results and download are there although nothing can be sent",
      resultsShown() && scoreText() === toAr(100) + " / " + toAr(100) && downloads.length === 3 && downloads[2].download === reportFilename("ليان محمد") && tones.length === 22
    );
    check("all correct: the exam's own line of encouragement", norm(encouragement()?.textContent) === ENCOURAGEMENT(100), norm(encouragement()?.textContent));
    check("banner: «جارٍ إرسال…»", bannerStatus() === "sending");
    await settle(() => net.calls.length >= callsBefore + 1, 3000);
    await pause(150);
    check("first try failed: no immediate second try, nothing stored yet", net.calls.length === callsBefore + 1 && bannerStatus() === "sending" && pendingKeys().length === 0);
    await act(async () => {
      W.dispatchEvent(new W.Event("pagehide"));
    });
    check("the page is closed while sending → the payload is stored at once", same(pendingKeys(), ["pending:grade4-adam-test-2:" + secondDone.attemptId]));
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
    check(
      "the payload is kept under pending:<EXAM_ID>:<attemptId>",
      same(pendingKeys(), [pendingKey(secondDone.attemptId)]) && W.localStorage.getItem(pendingKey(secondDone.attemptId)) === net.calls[callsBefore].init.body
    );
    check("the failure is recorded in the saved attempt", savedAttempt()!.delivery === "failed");
    check(
      "the failed delivery left the results, the marks and the download untouched",
      resultsShown() && partBlocks().length === 67 && scoreText() === toAr(100) + " / " + toAr(100) && downloads.length === 3 && savedAttempt()!.result!.total === 100
    );
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
    check(
      "one more request, same attemptId, same body",
      net.calls.length === callsBefore + 4 && resent.attemptId === secondDone.attemptId && net.calls[callsBefore + 3].init.body === net.calls[callsBefore].init.body
    );
    check("banner: «تم إرسال نتيجتك إلى معلّمك ✓»", bannerStatus() === "success" && bannerText() === "تم إرسال نتيجتك إلى معلّمك ✓");
    check("the sheet now holds both attempts, each once", server.rows.size === 2 && server.rows.get(secondDone.attemptId).studentName === "ليان محمد");
    check(
      "all correct: 100, 67 correct parts, «ممتاز» for the teacher",
      resent.summary.total === 100 && resent.summary.correctSubparts === 67 && resent.summary.fullQuestions === 30 && resent.summary.gradeLabel === "ممتاز" && resent.reportText === failedTxt
    );
    check("the pending copy is gone and the attempt is recorded as sent", pendingKeys().length === 0 && savedAttempt()!.delivery === "sent");
    check("the resend button did not restart the exam or download again", resultsShown() && !q("#stname") && downloads.length === 3);

    /* ================================================================== */
    section("== 9) On load: results kept from an earlier session are sent quietly ==");
    const stale = { ...sent, attemptId: "ATTEMPT-KEPT-FROM-AN-EARLIER-SESSION", studentName: "طالب سابق" };
    W.localStorage.setItem(pendingKey(stale.attemptId), JSON.stringify(stale));
    W.localStorage.setItem("pending:grade4-adam-test:xyz", '{"attemptId":"xyz","examId":"grade4-adam-test"}');
    W.localStorage.setItem("pending:grade5-math-unit1:abc", '{"attemptId":"abc"}');
    const callsBeforeLoad = net.calls.length;
    await reload();
    await settle(() => server.rows.has(stale.attemptId) && W.localStorage.getItem(pendingKey(stale.attemptId)) === null, 8000);
    check("the kept result was sent once", net.calls.length === callsBeforeLoad + 1 && sentBody(callsBeforeLoad).attemptId === stale.attemptId && server.rows.get(stale.attemptId).studentName === "طالب سابق");
    check("and removed after the server confirmed it", W.localStorage.getItem(pendingKey(stale.attemptId)) === null);
    check(
      "the pending results of the other exams were neither sent nor touched",
      W.localStorage.getItem("pending:grade4-adam-test:xyz") === '{"attemptId":"xyz","examId":"grade4-adam-test"}' &&
        W.localStorage.getItem("pending:grade5-math-unit1:abc") === '{"attemptId":"abc"}' && !server.rows.has("xyz") && !server.rows.has("abc")
    );
    check("quietly: the page shows the same results, already sent", resultsShown() && bannerStatus() === "success" && scoreText() === toAr(100) + " / " + toAr(100));
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
    check(
      "every request asked for SHEETS_URL and was answered by the mock on 127.0.0.1",
      net.calls.length > 0 && net.calls.every((call) => call.url === SHEETS_URL) && server.url.startsWith("http://127.0.0.1:"),
      net.calls.length + " requests"
    );
    check("every row in the mock sheet carries this exam's id", server.rows.size === 3 && [...server.rows.values()].every((row) => row.examId === EXAM_ID && row.examId === "grade4-adam-test-2"));
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

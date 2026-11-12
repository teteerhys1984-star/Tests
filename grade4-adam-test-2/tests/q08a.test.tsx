/**
 * Regression test: «خاطئة» on q08a.
 *
 * q08 is the true/false question: "choose «صحيحة» or «خاطئة» for each statement; if you choose
 * «خاطئة», write the correction". Its first statement (q08a) is true, so it has no correction
 * box. The exam used to count «خاطئة» as an answer only together with a written correction: a
 * student who chose «خاطئة» on q08a had nowhere to write one, the part stayed "unanswered", and
 * the submit button stayed disabled until the choice was changed to «صحيحة» — the right answer.
 *
 * The behaviour required now, shown here in the marking code, in the TXT report, in the payload
 * for the teacher's sheet, and through the interface in a real DOM (jsdom):
 *   - on q08a both «صحيحة» and «خاطئة» are complete answers;
 *   - «خاطئة» is marked wrong, 0 of 1, and the paper can be submitted;
 *   - the key («صحيحة»), the marks and every other part are as they were — q08b included, whose
 *     correction box must still be filled.
 *
 * The app's fetch is intercepted (setup-dom.ts) and carried to a mock server on 127.0.0.1.
 * The real Google endpoint is never contacted.
 */
import "./setup-dom";
import { D, W, blobTexts, consoleErrors, downloads, net, pageErrors, realFetch } from "./setup-dom";
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../src/App";
import { SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { ALL_SUBS, QUESTIONS, SUB_INDEX, type Sub } from "../src/data/exam";
import { describeStudent, fractionFor, gradeAll, isAnswered, type Ans, type Answers, type GradeResult } from "../src/lib/grade";
import { buildReport, plain, validateReport } from "../src/lib/report";
import type { Attempt } from "../src/lib/store";
import { buildPayload } from "../src/lib/submit";
import { toAr } from "../src/lib/text";
import { attemptFor } from "./golden";
import { check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer } from "./mock-server";
import { CANONICAL_ORDER, canonicalOptions, correctValue, partialValues, unansweredValues, wrongValue } from "./sheets";

let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n✗ the test run did not finish");
});

const q08 = QUESTIONS.find((question) => question.id === "q08")!;
const q08a = SUB_INDEX.q08a.s;
const q08b = SUB_INDEX.q08b.s;
/** What the interface stores for the two choices of q08a: it has no box, so `corr` stays empty. */
const FALSE_ONLY: Ans = { c: "F", corr: "" };
const TRUE_ONLY: Ans = { c: "T", corr: "" };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const perfect = (): Answers => Object.fromEntries(ALL_SUBS.map((sub) => [sub.id, correctValue(sub)]));
const partOf = (result: GradeResult, id: string) => result.items.find((item) => item.subId === id)!;
/** What the results page and the TXT report show for one part. */
const shown = (result: GradeResult, id: string) => {
  const { status, awarded, marks, studentText, correctText } = partOf(result, id);
  return { status, awarded, marks, studentText, correctText };
};
const counters = (result: GradeResult) => [result.total, result.max, result.percent, result.correct, result.partial, result.incorrect, result.unanswered];

/** The four lines of a part in the TXT report: the student's answer, the key, the marks, the status. */
const Q08A_IN_REPORT = ["    إجابة الطالب: خاطئة", "    الإجابة الصحيحة: صحيحة", "    العلامة الممنوحة: 0 من 1", "    الحالة: خاطئة"];
const COUNTERS_IN_REPORT = "\r\nصحيحة: 66   |   صحيحة جزئياً: 0   |   خاطئة: 1   |   بلا إجابة: 0\r\n";
function q08aInReport(report: string): string[] {
  const lines = report.split("\r\n");
  const at = lines.findIndex((line) => line.startsWith("  الفرع (") && line.includes("المعرّف: q08a "));
  return at < 0 ? [] : lines.slice(at + 2, at + 6);
}

/** The entry of q08a among the details sent to the teacher's sheet. */
const Q08A_ON_THE_WIRE = { label: "أ", status: "خاطئة", awarded: 0, marks: 1, studentAnswer: "خاطئة", correctAnswer: "صحيحة" };
function q08aDetail(details: any[]): unknown {
  const detail = (details ?? []).find((item) => String(item.qTitle).includes("(q08)") && item.label === "أ");
  return detail && { label: detail.label, status: detail.status, awarded: detail.awarded, marks: detail.marks, studentAnswer: detail.studentAnswer, correctAnswer: detail.correctAnswer };
}
const sentCounters = (summary: any) =>
  summary && [summary.total, summary.max, summary.percentage, summary.correctSubparts, summary.partialSubparts, summary.wrongSubparts, summary.unansweredSubparts];

/* ================================================================== */
section("== 1) The question is the uploaded one: key, marks, correction box ==");
equal("q08 has two true/false parts", q08.subs.map((sub) => sub.id + ":" + sub.kind), ["q08a:tfc", "q08b:tfc"]);
equal(
  "q08a: a true statement, key «صحيحة», 1 mark, no correction box",
  { tf: q08a.tf, answerText: q08a.answerText, marks: q08a.marks },
  { tf: { isTrue: true }, answerText: "صحيحة", marks: 1 }
);
equal(
  "q08b: a false statement, 2 marks, with a correction box whose key is 4",
  { isTrue: q08b.tf!.isTrue, box: !!q08b.tf!.corrLabel, corrAcc: q08b.tf!.corrAcc, marks: q08b.marks },
  { isTrue: false, box: true, corrAcc: ["4"], marks: 2 }
);
equal(
  "q08a is the only true/false part without a correction box",
  ALL_SUBS.filter((sub) => sub.kind === "tfc" && !sub.tf?.corrLabel).map((sub) => sub.id),
  ["q08a"]
);

/* ================================================================== */
section("== 2) Marking: both choices of q08a are complete answers ==");
check("«خاطئة» is a complete answer (it used to count as unanswered)", isAnswered(q08a, FALSE_ONLY) === true);
check("«صحيحة» is a complete answer", isAnswered(q08a, TRUE_ONLY) === true);
check("no choice at all is still unanswered", !isAnswered(q08a, undefined) && !isAnswered(q08a, { c: "", corr: "" }));
equal("«خاطئة» earns nothing, «صحيحة» earns the mark", [fractionFor(q08a, FALSE_ONLY), fractionFor(q08a, TRUE_ONLY)], [0, 1]);
equal("the two answers read «خاطئة» and «صحيحة»", [describeStudent(q08a, FALSE_ONLY), describeStudent(q08a, TRUE_ONLY)], ["خاطئة", "صحيحة"]);

const full = gradeAll(perfect());
const wrong = gradeAll({ ...perfect(), q08a: FALSE_ONLY });
equal("everything right: 100 of 100", counters(full), [100, 100, 100, 67, 0, 0, 0]);
equal("q08a answered «صحيحة»: correct, 1 of 1", shown(full, "q08a"), { status: "correct", awarded: 1, marks: 1, studentText: "صحيحة", correctText: "صحيحة" });
equal("q08a answered «خاطئة»: incorrect, 0 of 1, the key is still «صحيحة»", shown(wrong, "q08a"), { status: "incorrect", awarded: 0, marks: 1, studentText: "خاطئة", correctText: "صحيحة" });
equal("the paper then scores 99 of 100: 66 correct parts, 1 incorrect, none unanswered", counters(wrong), [99, 100, 99, 66, 0, 1, 0]);
check("no other part of that paper is marked differently", wrong.items.length === 67 && wrong.items.every((item, index) => item.subId === "q08a" || same(item, full.items[index])));
equal("«خاطئة» on q08a and nothing else: 0 marks, 1 incorrect part, 66 unanswered", counters(gradeAll({ q08a: FALSE_ONLY })), [0, 100, 0, 0, 0, 1, 66]);

/* ================================================================== */
section("== 3) Nothing else changed ==");
const keyOfB = partOf(full, "q08b").correctText;
const b = (answer: Ans) => shown(gradeAll({ ...perfect(), q08b: answer }), "q08b");
equal(
  "q08b: «خاطئة» with nothing in its correction box is still unanswered",
  [isAnswered(q08b, { c: "F", corr: "" }), isAnswered(q08b, { c: "F", corr: "   " }), b({ c: "F", corr: "" }).status, b({ c: "F", corr: "" }).studentText],
  [false, false, "unanswered", "(لم تتم الإجابة)"]
);
equal("q08b: «خاطئة» with the right correction: 2 of 2", b({ c: "F", corr: "4" }), { status: "correct", awarded: 2, marks: 2, studentText: "خاطئة — التصحيح: 4", correctText: keyOfB });
equal("q08b: «خاطئة» with another correction: 1 of 2", b({ c: "F", corr: "7" }), { status: "partial", awarded: 1, marks: 2, studentText: "خاطئة — التصحيح: 7", correctText: keyOfB });
equal("q08b: «صحيحة»: 0 of 2", b({ c: "T", corr: "" }), { status: "incorrect", awarded: 0, marks: 2, studentText: "صحيحة", correctText: keyOfB });
const otherParts = ALL_SUBS.filter((sub) => sub.id !== "q08a");
check(
  "every other part: each way of leaving it unanswered is still unanswered",
  otherParts.length === 66 && otherParts.every((sub) => unansweredValues(sub).every((value) => !isAnswered(sub, value))),
  otherParts.reduce((count, sub) => count + unansweredValues(sub).length, 0) + " stored forms"
);
check(
  "every part: its right, wrong and partly right answers are complete answers, as before",
  ALL_SUBS.every((sub) => [correctValue(sub), wrongValue(sub), ...partialValues(sub)].every((value) => isAnswered(sub, value)))
);

/* ================================================================== */
section("== 4) TXT report and the payload for the teacher's sheet ==");
{
  const attempt = attemptFor({ name: "q08a-false", order: CANONICAL_ORDER, optionOrder: canonicalOptions(), answers: { ...perfect(), q08a: FALSE_ONLY } });
  const report = buildReport(attempt, attempt.result!);
  equal("TXT: the answer, the key, the marks and the status of q08a", q08aInReport(report), Q08A_IN_REPORT);
  check("TXT: 99 / 100 and the counters", report.includes("\r\nالدرجة: 99 / 100\r\n") && report.includes(COUNTERS_IN_REPORT));
  check("TXT: passes the exam's own validation", validateReport(report, attempt, attempt.result!));
  const payload = buildPayload(attempt);
  equal("payload: the detail of q08a", q08aDetail(payload.details), Q08A_ON_THE_WIRE);
  equal("payload: total, percentage and part counters", sentCounters(payload.summary), [99, 100, 99, 66, 0, 1, 0]);
  check("payload: one detail per part, none of them unanswered", payload.details.length === 67 && payload.details.every((detail) => detail.status !== "بلا إجابة"));
}

/* ------------------------------------------------------------------ */
/* The interface                                                       */
/* ------------------------------------------------------------------ */
/** Where the exam keeps its autosave (KEY in src/lib/store.ts). */
const STORAGE_KEY = "adam_g4_math_attempt_v1";

const norm = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
const q = (selector: string, root: any = D) => root.querySelector(selector) as HTMLElement | null;
const qa = (selector: string, root: any = D) => Array.from(root.querySelectorAll(selector)) as HTMLElement[];
const byText = (selector: string, text: string, root: any = D) => qa(selector, root).find((el) => norm(el.textContent) === text) ?? null;
const bodyText = () => norm(D.body.textContent);

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
// The exam clock ticks twice a second; its updates belong to an act scope like every other update.
const browserSetInterval = W.setInterval.bind(W);
W.setInterval = (callback: (...args: unknown[]) => void, ms: number, ...args: unknown[]) =>
  browserSetInterval(() => act(() => callback(...args)), ms);

const savedAttempt = (): Attempt | null => {
  const raw = W.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Attempt) : null;
};

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
const unload = () => act(async () => root.unmount());

/* ---- Question page ---- */
const answeredLine = (count: number) => bodyText().includes("تمت الإجابة عن " + toAr(count) + " من " + toAr(67) + " فرعاً");
/** The card of one statement of q08 (the parts are shown in the order of the bank). */
function partCard(sub: Sub): HTMLElement {
  const cards = qa("div.mc-card.pop");
  const card = cards[q08.subs.indexOf(sub)];
  if (!card || cards.length !== q08.subs.length || norm(q(".flex-1", card)?.textContent) !== norm(toAr(plain(sub.prompt)))) throw new Error("q08 is not on screen");
  return card;
}
const choices = (sub: Sub) => qa('button.mc-opt[role="radio"]', partCard(sub));
const choice = (sub: Sub, word: "صحيحة" | "خاطئة") => choices(sub).find((button) => norm(button.textContent).endsWith(word));
/** The choice shown as selected, if any. */
const selected = (sub: Sub) =>
  choices(sub)
    .filter((button) => button.getAttribute("aria-checked") === "true")
    .map((button) => (norm(button.textContent).endsWith("خاطئة") ? "خاطئة" : "صحيحة"));
const correctionBox = (sub: Sub) => q("input", partCard(sub));

/* ---- Review page ---- */
const submitButton = () => byText("button", "تسليم الاختبار") as HTMLButtonElement | null;
const openButtons = () => qa("button").filter((el) => norm(el.textContent) === "فتح / تعديل");
/** What the review page lists for the parts of the question at `position`. */
function reviewLines(position: number): string[] {
  const card = openButtons()[position]?.closest("div.bg-white");
  return card ? qa("div.grid.gap-1 > div", card).map((line) => norm(line.querySelector("span")?.textContent)) : [];
}

/* ---- Results page ---- */
const topCard = () => q("section.mc-card.text-center");
const questionCards = () => (topCard() ? qa("section.mc-card").slice(1) : []);
const partsOf = (card: HTMLElement) => (Array.from(card.children) as HTMLElement[]).filter((el) => el.matches("div.bg-white"));

async function main(): Promise<void> {
  const server = new MockSheetsServer(SHEETS_TOKEN);
  await server.start();
  net.handler = (_url, init) => realFetch(server.url, init);

  try {
    /* ================================================================== */
    section("== 5) On screen: q08a is the last part without an answer ==");
    await load();
    await act(async () => typeInto(q("#stname"), "ريم خالد"));
    await act(async () => click(byText("button", "ابدأ الاختبار")));
    const begun = savedAttempt()!;
    const position = begun.order.indexOf("q08");
    // Every other part is answered right: the answers are written to the autosave and the page is
    // loaded again. (The on-screen controls of all 67 parts are driven in workflow.test.tsx.)
    await unload();
    const others = perfect();
    delete others.q08a;
    W.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...begun, answers: others }));
    await load();
    check("an attempt in progress: 66 of 67 parts answered, q08a is the missing one", savedAttempt()!.phase === "exam" && savedAttempt()!.answers.q08a === undefined && answeredLine(66));

    await act(async () => click(byText("button", "مراجعة الإجابات")));
    check("review: one part is missing and the submit button is disabled", bodyText().includes("عدد الفروع التي لم تُجب عنها بعد: " + toAr(1)) && submitButton()!.disabled === true);
    equal("review: q08 lists its first statement as not answered", reviewLines(position), ["لم تتم الإجابة", "خاطئة — التصحيح: " + toAr(4)]);
    await act(async () => click(openButtons()[position]));
    check(
      "«فتح / تعديل» opens q08: two statements, nothing chosen in the first",
      bodyText().includes("السؤال " + toAr(position + 1) + " من " + toAr(30)) && choices(q08a).length === 2 && selected(q08a).length === 0
    );

    /* ================================================================== */
    section("== 6) On screen: choosing «خاطئة» on q08a completes the paper ==");
    await act(async () => click(choice(q08a, "خاطئة")));
    equal("«خاطئة» is selected and saved as the answer", { selected: selected(q08a), saved: savedAttempt()!.answers.q08a }, { selected: ["خاطئة"], saved: FALSE_ONLY });
    check("q08a asks for no correction: there is no box to fill", correctionBox(q08a) === null);
    check("the part counts as answered: 67 of 67", answeredLine(67));

    check("q08b still has its correction box, holding the saved correction", !!correctionBox(q08b) && same(selected(q08b), ["خاطئة"]) && same(savedAttempt()!.answers.q08b, { c: "F", corr: "4" }));
    await act(async () => typeInto(correctionBox(q08b), ""));
    check("q08b with its box emptied is unanswered, as before: 66 of 67", same(savedAttempt()!.answers.q08b, { c: "F", corr: "" }) && answeredLine(66) && !!correctionBox(q08b));
    await act(async () => typeInto(correctionBox(q08b), "4"));
    check("q08b with the correction written again: 67 of 67", same(savedAttempt()!.answers.q08b, { c: "F", corr: "4" }) && answeredLine(67));

    await act(async () => click(choice(q08a, "صحيحة")));
    equal(
      "the choice on q08a can be changed to «صحيحة»: saved, still 67 of 67",
      { selected: selected(q08a), saved: savedAttempt()!.answers.q08a, complete: answeredLine(67) },
      { selected: ["صحيحة"], saved: TRUE_ONLY, complete: true }
    );
    await act(async () => click(choice(q08a, "خاطئة")));
    equal(
      "and back to «خاطئة»: saved, still 67 of 67, still no box",
      { selected: selected(q08a), saved: savedAttempt()!.answers.q08a, complete: answeredLine(67), box: correctionBox(q08a) !== null },
      { selected: ["خاطئة"], saved: FALSE_ONLY, complete: true, box: false }
    );

    await act(async () => click(byText("button", "مراجعة الإجابات")));
    check(
      "review: every part is answered and the submit button is enabled",
      bodyText().includes("تمت الإجابة عن جميع الفروع. يمكنك تسليم الاختبار الآن.") && !bodyText().includes("عدد الفروع التي لم تُجب عنها بعد") && submitButton()!.disabled === false
    );
    equal("review: q08 lists «خاطئة» for its first statement", reviewLines(position), ["خاطئة", "خاطئة — التصحيح: " + toAr(4)]);
    check("nothing was sent or downloaded before submission", net.calls.length === 0 && server.posts.length === 0 && downloads.length === 0);

    /* ================================================================== */
    section("== 7) On screen: the paper is submitted and q08a is marked wrong with 0 ==");
    await act(async () => click(submitButton()));
    const done = savedAttempt()!;
    check("submitted: the results page is shown", done.phase === "done" && !!byText("h2", "مراجعة الإجابات كاملة") && !!topCard());
    check("the saved answer of q08a is «خاطئة», and the saved marking is the marking of the saved answers", same(done.answers.q08a, FALSE_ONLY) && same(done.result, gradeAll(done.answers)));
    equal("saved marking: q08a incorrect, 0 of 1", shown(done.result!, "q08a"), { status: "incorrect", awarded: 0, marks: 1, studentText: "خاطئة", correctText: "صحيحة" });
    equal("saved marking: 99 of 100 — 66 correct parts, 1 incorrect, none unanswered", counters(done.result!), [99, 100, 99, 66, 0, 1, 0]);
    equal("results page: the score", norm(q(".text-5xl bdi")?.textContent), toAr(99) + " / " + toAr(100));
    equal(
      "results page: the counters, with no «بلا إجابة»",
      qa("span.badge", topCard()).map((el) => norm(el.textContent)),
      ["صحيحة: " + toAr(66), "جزئية: " + toAr(0), "خاطئة: " + toAr(1)]
    );
    const block = partsOf(questionCards()[position])[0];
    equal("results page, q08a: letter, status and marks", qa("span.badge", block).map((el) => norm(el.textContent)), ["(أ)", "خاطئة", toAr(0) + " / " + toAr(1)]);
    const blockLines = qa("div.text-sm", block).map((el) => norm(el.textContent));
    check("results page, q08a: «إجابتك: خاطئة» and «الإجابة الصحيحة: صحيحة»", blockLines.includes("إجابتك: خاطئة") && blockLines.includes("الإجابة الصحيحة: صحيحة"), blockLines.slice(0, 2).join(" | "));

    const txt = blobTexts[blobTexts.length - 1] ?? "";
    check("the TXT report was downloaded once and is the saved report", downloads.length === 1 && txt.charCodeAt(0) === 0xfeff && txt.slice(1) === done.reportText);
    equal("TXT: the answer, the key, the marks and the status of q08a", q08aInReport(txt), Q08A_IN_REPORT);
    check("TXT: 99 / 100 and the counters", txt.includes("\r\nالدرجة: 99 / 100\r\n") && txt.includes(COUNTERS_IN_REPORT));

    await settle(() => savedAttempt()?.delivery === "sent", 8000);
    check(
      "the result was sent once and stored by the mock sheet",
      net.calls.length === 1 && net.calls[0].url === SHEETS_URL && server.posts.length === 1 && server.rows.size === 1 && server.rows.has(done.attemptId)
    );
    const wire = server.posts[0]?.json;
    equal("on the wire: the detail of q08a", q08aDetail(wire?.details), Q08A_ON_THE_WIRE);
    equal("on the wire: total, percentage and part counters", sentCounters(wire?.summary), [99, 100, 99, 66, 0, 1, 0]);
    check("on the wire: the payload built from the saved attempt", same(wire, buildPayload(savedAttempt()!)));
    check("the banner says the result was sent", q("[data-send-status]")?.getAttribute("data-send-status") === "success");

    /* ================================================================== */
    section("== 8) Nothing left the test ==");
    check("every request asked for SHEETS_URL and was answered by the mock on 127.0.0.1", net.calls.every((call) => call.url === SHEETS_URL) && server.url.startsWith("http://127.0.0.1:"));
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
    finish("q08a");
  });

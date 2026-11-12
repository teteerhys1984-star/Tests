/**
 * Result delivery (src/exam/submit.ts):
 *   A) the payload: exact field names and types, one entry per part, totals equal to the marking;
 *   B) the sender with a scripted fetch: success, retry, duplicates, pending store, time limit;
 *   C) the sender against a mock server over real HTTP (127.0.0.1), the way the app posts.
 *
 * No test contacts the real Google endpoint: the global fetch is replaced by a guard that refuses
 * every call, and the waits between tries (2 s, then 5 s) are simulated.
 */
import path from "node:path";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import {
  EXAM_ID as INTERNAL_EXAM_ID,
  EXAM_TITLE,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_PARTS,
} from "../src/exam/data";
import type { Attempt } from "../src/exam/attempt";
import { formatDuration, gradeAttempt, statusArabic, texToText, type GradeResult } from "../src/exam/grade";
import { buildReport, validateReport } from "../src/exam/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeLabel,
  pendingKey,
  pendingPayload,
  retryPending,
  sendWithRetry,
  topicAreas,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../src/exam/submit";
import { attemptFor, withFixedClock } from "./golden";
import { EXAM_DIR, MemStorage, check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer, forwardTo } from "./mock-server";
import { PARTS, makeSheets, partialValues, type Sheet } from "./sheets";

// If the run stops before the end (an unsettled promise, for instance), that is a failure.
let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n✗ the test run did not finish");
});

/* ---- Guard: the app's default fetch is never allowed to reach the network in tests ---- */
const realFetch = globalThis.fetch;
let guardedFetchCalls = 0;
(globalThis as any).fetch = () => {
  guardedFetchCalls += 1;
  return Promise.reject(new Error("the default fetch is disabled in tests"));
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/* ------------------------------------------------------------------ */
/* A submitted attempt: shuffled order; correct, partial, wrong, blank  */
/* ------------------------------------------------------------------ */
const sheets = makeSheets();
/**
 * A mixed sheet in a shuffled question order, with one «multi» part answered so that one of its
 * two blanks is right: the payload test needs all four statuses and full / partial / zero
 * questions in one attempt (this paper splits marks only inside a multi part).
 */
const sheet: Sheet = (() => {
  const base = sheets.find((item) => item.name === "mixed:12")!;
  const multi = PARTS.find((part) => partialValues(part).length > 0)!;
  return { ...base, answers: { ...base.answers, [multi.id]: partialValues(multi)[0] } };
})();
const ATTEMPT_ID = "attempt-1762845605250-mia02";
const START = Date.parse("2026-11-11T07:00:05.250Z");
const SUBMIT = Date.parse("2026-11-11T07:47:38.900Z");

/** A submitted attempt and its marking for one answer sheet, with a fixed id, name and times. */
function submitted(base: Sheet, attemptId: string, studentName: string): { attempt: Attempt; result: GradeResult } {
  const attempt: Attempt = { ...attemptFor(base), attemptId, studentName, startTimestamp: START, submittedAt: SUBMIT };
  return { attempt, result: withFixedClock(() => gradeAttempt(attempt.answers, attempt.questionOrder), SUBMIT) };
}

const { attempt, result } = submitted(sheet, ATTEMPT_ID, "سارة أحمد");
/** The TXT file exactly as the student downloads it (downloadReport() puts the BOM first). */
const report = withFixedClock(() => "\uFEFF" + buildReport(attempt, result), SUBMIT);
const payload = buildPayload(attempt, result, report);
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload; // as it reaches the server
/** The parts in the order the student saw them, each with its question and its place in it. */
const flat = result.questions.flatMap((graded) => graded.parts.map((part) => ({ part, graded })));

function senderTests(): Promise<void> {
  return (async () => {
    /* ================================================================== */
    section("== A-1) Payload: exact field names ==");
    const TOP = ["token", "attemptId", "examId", "examTitle", "studentName", "startAt", "submitAt", "elapsedSec", "summary", "lessons", "details", "reportText"];
    const SUMMARY = ["total", "max", "percentage", "gradeLabel", "fullQuestions", "partialQuestions", "wrongQuestions", "correctSubparts", "partialSubparts", "wrongSubparts", "unansweredSubparts"];
    const LESSON = ["title", "awarded", "max"];
    const DETAIL = ["q", "qTitle", "lessons", "label", "status", "awarded", "marks", "studentAnswer", "correctAnswer"];
    equal("the 12 top-level fields, in the reference order", Object.keys(wire), TOP);
    equal("the 11 summary fields", Object.keys(wire.summary), SUMMARY);
    check("fields of every lessons entry", wire.lessons.every((lesson) => same(Object.keys(lesson), LESSON)), LESSON.join(", "));
    check("fields of every details entry", wire.details.every((detail) => same(Object.keys(detail), DETAIL)), DETAIL.join(", "));
    check("nothing is lost in JSON (no undefined, NaN or null)", same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)));
    check(
      "types of the top-level fields",
      typeof wire.token === "string" && typeof wire.attemptId === "string" && typeof wire.examId === "string" &&
        typeof wire.examTitle === "string" && typeof wire.studentName === "string" && typeof wire.startAt === "string" &&
        typeof wire.submitAt === "string" && typeof wire.elapsedSec === "number" && Array.isArray(wire.lessons) &&
        Array.isArray(wire.details) && typeof wire.reportText === "string"
    );
    check(
      "types of the summary fields",
      (Object.keys(wire.summary) as (keyof typeof wire.summary)[]).every((key) =>
        key === "gradeLabel" ? typeof wire.summary[key] === "string" : typeof wire.summary[key] === "number" && Number.isFinite(wire.summary[key])
      )
    );
    check("types of the lessons fields", wire.lessons.every((lesson) => typeof lesson.title === "string" && typeof lesson.awarded === "number" && typeof lesson.max === "number"));
    check(
      "types of the details fields",
      wire.details.every(
        (detail) =>
          typeof detail.q === "number" && typeof detail.qTitle === "string" && typeof detail.lessons === "string" &&
          typeof detail.label === "string" && typeof detail.status === "string" && typeof detail.awarded === "number" &&
          typeof detail.marks === "number" && typeof detail.studentAnswer === "string" && typeof detail.correctAnswer === "string"
      )
    );
    const strings: string[] = [
      wire.token, wire.attemptId, wire.examId, wire.examTitle, wire.studentName, wire.startAt, wire.submitAt, wire.summary.gradeLabel, wire.reportText,
      ...wire.lessons.map((lesson) => lesson.title),
      ...wire.details.flatMap((detail) => [detail.qTitle, detail.lessons, detail.label, detail.status, detail.studentAnswer, detail.correctAnswer]),
    ];
    check("no text field is empty (nothing is left to the server's handling of empty values)",
      strings.every((text) => text.trim().length > 0) && wire.lessons.length > 0 && wire.details.length > 0, strings.length + " text values");

    section("== A-2) Payload: identity of the exam and of the attempt ==");
    equal("EXAM_ID is the name of this exam's folder", EXAM_ID, path.basename(EXAM_DIR));
    equal("EXAM_ID", EXAM_ID, "grade6-mia-test-2");
    check("examId = EXAM_ID of src/config.ts (not the paper's internal id)", wire.examId === EXAM_ID && wire.examId !== INTERNAL_EXAM_ID, wire.examId);
    equal("the Apps Script URL is the one of the reference exam", SHEETS_URL, "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec");
    equal("the token is the one of the reference exam", SHEETS_TOKEN, "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
    equal("token from src/config.ts", wire.token, SHEETS_TOKEN);
    check("attemptId is the attempt's own id, as printed in the TXT report", wire.attemptId === ATTEMPT_ID && report.includes("معرّف المحاولة: " + ATTEMPT_ID));
    equal("examTitle = EXAM_TITLE", wire.examTitle, EXAM_TITLE);
    equal("studentName", wire.studentName, "سارة أحمد");
    check("startAt and submitAt in ISO form", wire.startAt === "2026-11-11T07:00:05.250Z" && wire.submitAt === "2026-11-11T07:47:38.900Z", wire.startAt + " → " + wire.submitAt);
    check("elapsedSec is the whole number of seconds shown as the duration",
      wire.elapsedSec === 2853 && Number.isInteger(wire.elapsedSec) && report.includes("المدة الزمنية: " + formatDuration(SUBMIT - START)), String(wire.elapsedSec));
    check("reportText = the TXT file exactly as downloaded (BOM first)", wire.reportText === report && report.startsWith("\uFEFF") && wire.reportText.length > 20000, wire.reportText.length + " characters");
    {
      let thrown: string | null = null;
      try {
        validateReport(wire.reportText.replace(/^\uFEFF/, ""), attempt, result);
      } catch (error) {
        thrown = error instanceof Error ? error.message : String(error);
      }
      equal("that report passes the exam's own validation", thrown, null);
    }
    check("the payload is the same when the report is rebuilt", same(buildPayload(attempt, result), payload));

    section("== A-3) Payload: summary equals the marking ==");
    let full = 0;
    let partial = 0;
    let wrong = 0;
    for (const graded of result.questions) {
      if (graded.awarded === graded.max) full += 1;
      else if (graded.awarded > 0) partial += 1;
      else wrong += 1;
    }
    check(
      "the attempt covers the four statuses and full / partial / zero questions",
      result.correct > 0 && result.partial > 0 && result.incorrect > 0 && result.unanswered > 0 && full > 0 && partial > 0 && wrong > 0,
      "questions " + full + "/" + partial + "/" + wrong + " · parts " + [result.correct, result.partial, result.incorrect, result.unanswered].join("/")
    );
    equal("total = marks awarded", wire.summary.total, result.score);
    check("max = 100", wire.summary.max === TOTAL_MARKS && wire.summary.max === 100);
    equal("percentage = the exam's own percentage", wire.summary.percentage, result.percentage);
    equal("gradeLabel = gradeLabel(percentage)", wire.summary.gradeLabel, gradeLabel(result.percentage));
    check("fullQuestions / partialQuestions / wrongQuestions", wire.summary.fullQuestions === full && wire.summary.partialQuestions === partial && wire.summary.wrongQuestions === wrong);
    check(
      "part counters = the exam's own counters",
      wire.summary.correctSubparts === result.correct && wire.summary.partialSubparts === result.partial &&
        wire.summary.wrongSubparts === result.incorrect && wire.summary.unansweredSubparts === result.unanswered
    );
    check(
      "question counters add up to 30 and part counters to 71",
      wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === QUESTIONS.length &&
        wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === TOTAL_PARTS
    );
    check("the same numbers are written in the report",
      report.includes("الدرجة النهائية: " + wire.summary.total + " من " + wire.summary.max) && report.includes("النسبة المئوية: " + wire.summary.percentage + "%"));

    section("== A-4) Payload: gradeLabel — the scale of the reference exam, sent to the teacher only ==");
    const scale: [number, string][] = [
      [100, "ممتاز"], [95, "ممتاز"], [94.99, "جيد جداً"], [94, "جيد جداً"], [85, "جيد جداً"], [84.99, "جيد"], [84, "جيد"], [75, "جيد"],
      [74.99, "مقبول"], [74, "مقبول"], [65, "مقبول"], [64.99, "ضعيف"], [64, "ضعيف"], [50, "ضعيف"], [49.99, "يحتاج إلى دعم"], [49, "يحتاج إلى دعم"], [0, "يحتاج إلى دعم"],
    ];
    for (const [percentage, label] of scale) equal("gradeLabel(" + percentage + ")", gradeLabel(percentage), label);
    const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
    check("the label is not written to the TXT report", !wholeWord(wire.summary.gradeLabel).test(report) && !wholeWord("التقدير").test(report), wire.summary.gradeLabel);
    {
      const best = submitted(sheets.find((item) => item.name === "all-correct")!, "best-attempt", "ميا");
      const top = buildPayload(best.attempt, best.result);
      check("all correct: 100, ممتاز, 30 full questions", top.summary.total === 100 && top.summary.percentage === 100 && top.summary.gradeLabel === "ممتاز" && top.summary.fullQuestions === 30 && top.summary.correctSubparts === TOTAL_PARTS);
      const worst = submitted(sheets.find((item) => item.name === "blank")!, "blank-attempt", "ميا");
      const bottom = buildPayload(worst.attempt, worst.result);
      check("blank: 0, يحتاج إلى دعم, 71 unanswered parts", bottom.summary.total === 0 && bottom.summary.gradeLabel === "يحتاج إلى دعم" && bottom.summary.wrongQuestions === 30 && bottom.summary.unansweredSubparts === TOTAL_PARTS);
      check("blank: every answer text is still filled in", bottom.details.every((detail) => detail.studentAnswer.trim().length > 0));
    }

    section("== A-5) Payload: details — one entry per part ==");
    check("as many entries as parts (71)", wire.details.length === TOTAL_PARTS && flat.length === PARTS.length, String(wire.details.length));
    check("no repeats: every (question, part) appears once", new Set(wire.details.map((detail) => detail.q + "/" + detail.label)).size === TOTAL_PARTS);
    check("every part of the paper is present", same(flat.map((item) => item.part.partId).sort(), PARTS.map((part) => part.id).sort()));
    check("in the order shown to the student", flat.every((item, index) =>
      wire.details[index].q === item.graded.position && wire.details[index].label === item.part.partLabel));
    check(
      "q is the number the student saw, not the number in the bank",
      wire.details[0].q === 1 && wire.details[0].qTitle === texToText(result.questions[0].question.title) &&
        result.questions[0].question.id !== QUESTIONS[0].id && wire.details[wire.details.length - 1].q === 30 &&
        same([...new Set(wire.details.map((detail) => detail.q))], Array.from({ length: 30 }, (_, index) => index + 1)),
      "first question on screen: " + result.questions[0].question.id
    );
    check("qTitle = the question's text, as in the report", flat.every((item, index) =>
      wire.details[index].qTitle === texToText(item.graded.question.title) && report.includes("نص السؤال: " + wire.details[index].qTitle)));
    check("status = the exam's own status wording", flat.every((item, index) => wire.details[index].status === statusArabic(item.part.status)) &&
      same([...new Set(wire.details.map((detail) => detail.status))].sort(), ["خاطئة", "دون إجابة", "صحيحة", "صحيحة جزئياً"].sort()));
    check("awarded and marks as marked", flat.every((item, index) => wire.details[index].awarded === item.part.awarded && wire.details[index].marks === item.part.max));
    check(
      "studentAnswer and correctAnswer are the texts of the results page and the report",
      flat.every((item, index) =>
        wire.details[index].studentAnswer === texToText(item.part.givenText) && wire.details[index].correctAnswer === texToText(item.part.correctText) &&
        report.includes("إجابة الطالب: " + wire.details[index].studentAnswer) && report.includes("الإجابة الصحيحة: " + wire.details[index].correctAnswer)
      )
    );
    check(
      "the report line of every part matches its entry",
      flat.every((item, index) => {
        const detail = wire.details[index];
        return report.includes("  الجزء (" + detail.label + ") — [" + detail.awarded + " / " + detail.marks + "]") &&
          report.includes("  العلامات: " + detail.awarded + " من " + detail.marks + " — الحالة: " + detail.status);
      })
    );
    const count = (status: string) => wire.details.filter((detail) => detail.status === status).length;
    check("statuses in details = the summary counters",
      count("صحيحة") === wire.summary.correctSubparts && count("صحيحة جزئياً") === wire.summary.partialSubparts &&
        count("خاطئة") === wire.summary.wrongSubparts && count("دون إجابة") === wire.summary.unansweredSubparts);
    check("awarded adds up to total and marks to 100",
      wire.details.reduce((sum, detail) => sum + detail.awarded, 0) === wire.summary.total &&
        wire.details.reduce((sum, detail) => sum + detail.marks, 0) === 100);

    section("== A-6) Payload: lessons — the topics (محاور) of the questions ==");
    equal("one entry per topic of the paper, in the order of the bank", wire.lessons.map((lesson) => lesson.title), topicAreas());
    equal("the topics are the exam's own words", topicAreas(), [...new Set(QUESTIONS.map((question) => question.topic))]);
    equal("this paper has 10 topics", topicAreas().length, 10);
    check("every question belongs to exactly one topic", QUESTIONS.every((question) => topicAreas().includes(question.topic)));
    {
      const expected = topicAreas().map((title) => {
        const ofTopic = QUESTIONS.filter((question) => question.topic === title);
        const graded = result.questions.filter((item) => ofTopic.includes(item.question));
        return {
          title,
          awarded: graded.reduce((sum, item) => sum + item.awarded, 0),
          max: graded.reduce((sum, item) => sum + item.max, 0),
        };
      });
      equal("awarded and max of every topic = the sum of its questions", wire.lessons, expected);
    }
    equal("the topics' max add up to 100", wire.lessons.reduce((sum, lesson) => sum + lesson.max, 0), 100);
    equal("the topics' awarded add up to total", wire.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0), wire.summary.total);
    check("every topic: 0 ≤ awarded ≤ max", wire.lessons.every((lesson) => lesson.awarded >= 0 && lesson.awarded <= lesson.max && lesson.max > 0),
      wire.lessons.map((lesson) => lesson.awarded + "/" + lesson.max).join(" · "));
    check("details.lessons = the topic of the question", flat.every((item, index) => wire.details[index].lessons === item.graded.question.topic));

    section("== A-7) Pending key ==");
    check("pending:<EXAM_ID>:<attemptId>", pendingKey(ATTEMPT_ID) === "pending:grade6-mia-test-2:" + ATTEMPT_ID && PENDING_PREFIX === "pending:" + EXAM_ID + ":", pendingKey(ATTEMPT_ID));
    check("the prefix does not match the keys of the first grade 6 exam",
      !("pending:grade6-mia-test:" + ATTEMPT_ID).startsWith(PENDING_PREFIX) && !pendingKey(ATTEMPT_ID).startsWith("pending:grade6-mia-test:"));
    check("the prefix does not match the keys of the other exams of the site",
      !("pending:grade5-math-unit1:" + ATTEMPT_ID).startsWith(PENDING_PREFIX) && !(("pending:grade4-adam-test:" + ATTEMPT_ID) as string).startsWith(PENDING_PREFIX));

    section("== A-8) Payload: size, over every recorded answer sheet ==");
    {
      // A Google Sheets cell holds at most 50,000 characters. Whether the server writes reportText
      // to a single cell is not known here; the figures are printed so that the margin is visible.
      const longName = "عبدالرحمن عبدالعزيز عبدالمجيد عبدالوهاب عبدالحميد الأنصاري ع";
      let longest = 0;
      let shortest = Number.MAX_SAFE_INTEGER;
      let largestBody = 0;
      let consistent = true;
      for (const item of sheets) {
        const one = submitted(item, ATTEMPT_ID, longName);
        const built = buildPayload(one.attempt, one.result);
        longest = Math.max(longest, built.reportText.length);
        shortest = Math.min(shortest, built.reportText.length);
        largestBody = Math.max(largestBody, Buffer.byteLength(JSON.stringify(built), "utf8"));
        consistent = consistent && built.summary.total === one.result.score && built.details.length === TOTAL_PARTS &&
          built.details.reduce((sum, detail) => sum + detail.awarded, 0) === one.result.score &&
          built.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0) === one.result.score &&
          built.summary.gradeLabel === gradeLabel(one.result.percentage);
      }
      check("the longest allowed name has 60 characters", longName.length === 60);
      check("all " + sheets.length + " sheets: total, details and lessons agree with the marking", consistent);
      check("reportText stays under 50,000 characters, even with a 60-character name", longest < 50000, shortest + "–" + longest + " characters");
      console.log("    (largest request body: " + largestBody + " bytes)");
    }

    /* ------------------------------------------------------------------ */
    /* Sender tools: scripted fetch, simulated waits, in-memory storage    */
    /* ------------------------------------------------------------------ */
    interface Call {
      url: string;
      init: RequestInit;
      body: SubmissionPayload;
    }
    /** Scripted fetch: the handler returns the server's reply text, or throws (network down). */
    function fakeFetch(handler: (n: number, call: Call) => string | Promise<string>) {
      const calls: Call[] = [];
      const fn: FetchLike = async (url, init) => {
        const call: Call = { url, init, body: JSON.parse(String(init.body)) };
        calls.push(call);
        const text = await handler(calls.length, call);
        return { text: async () => text };
      };
      return { fn, calls };
    }
    /** A browser that blocks storage: every call throws. */
    const brokenStorage: StorageLike = {
      get length(): number {
        throw new Error("SecurityError");
      },
      key() {
        throw new Error("SecurityError");
      },
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
      removeItem() {
        throw new Error("SecurityError");
      },
    };
    function env(fetchImpl: FetchLike, storage: StorageLike | null = new MemStorage()) {
      const sleeps: number[] = [];
      const opts: SendOptions = {
        fetchImpl,
        storage,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      };
      return { opts, sleeps, storage: storage as MemStorage };
    }
    const OK = JSON.stringify({ ok: true });
    const netDown = (): never => {
      throw new TypeError("Failed to fetch");
    };
    const HTML_ERROR = "<!DOCTYPE html><html><body>Service error</body></html>";

    section("== B-1) Sending: success at the first try ==");
    {
      const f = fakeFetch(() => OK);
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      const init = f.calls[0]?.init ?? {};
      check("resolves true", ok === true);
      check("one request, to SHEETS_URL", f.calls.length === 1 && f.calls[0].url === SHEETS_URL);
      equal("method: POST", init.method, "POST");
      equal("Content-Type: text/plain;charset=utf-8 only (no application/json)", init.headers, { "Content-Type": "text/plain;charset=utf-8" });
      check("body = JSON.stringify(payload)", init.body === JSON.stringify(payload) && same(f.calls[0].body, payload));
      equal("redirect: follow", init.redirect, "follow");
      check("nothing else but the signal of the time limit", same(Object.keys(init).sort(), ["body", "headers", "method", "redirect", "signal"]) && init.signal instanceof AbortSignal && !init.signal.aborted);
      check("no waiting and nothing stored", e.sleeps.length === 0 && e.storage.length === 0);
    }

    section("== B-2) Sending: failure, then another try ==");
    {
      const f = fakeFetch((n) => (n === 1 ? netDown() : OK));
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      check("network down, then success → true in two tries", ok === true && f.calls.length === 2);
      equal("2 s wait before the second try", e.sleeps, [2000]);
      check("both tries carry the same payload and the same attemptId", f.calls[0].init.body === f.calls[1].init.body && f.calls[1].body.attemptId === ATTEMPT_ID);
      check("nothing stored after success", e.storage.length === 0);
    }
    {
      const f = fakeFetch((n) => (n === 1 ? JSON.stringify({ ok: false, error: "busy" }) : n === 2 ? HTML_ERROR : OK));
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      check("ok:false, then a non-JSON reply, then success → true in three tries", ok === true && f.calls.length === 3);
      check("waits of 2 s then 5 s; 3 tries; 30 s limit per try", same(e.sleeps, [2000, 5000]) && same(RETRY_DELAYS_MS, [2000, 5000]) && MAX_ATTEMPTS === 3 && ATTEMPT_TIMEOUT_MS === 30000, e.sleeps.join(","));
    }
    {
      // A reply arrived but the browser blocks reading it (CORS): never a success.
      const calls: number[] = [];
      const fn: FetchLike = async () => {
        calls.push(1);
        return {
          text: async () => {
            if (calls.length === 1) throw new TypeError("opaque response");
            return OK;
          },
        };
      };
      const e = env(fn);
      check("an unreadable reply counts as a failure, the next try succeeds", (await sendWithRetry(payload, e.opts)) === true && calls.length === 2);
    }

    section("== B-3) Sending: every try fails ==");
    for (const [name, handler] of [
      ["the network is down", () => netDown()],
      ["the server answers ok:false", () => JSON.stringify({ ok: false })],
      ["the server answers an HTML page", () => HTML_ERROR],
      ["the server answers nothing", () => ""],
      ["the server answers text that is not JSON", () => "OK"],
    ] as [string, () => string][]) {
      const f = fakeFetch(handler);
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      check(name + " → false after 3 tries", ok === false && f.calls.length === 3);
      equal(name + ": waits of 2 s then 5 s", e.sleeps, [2000, 5000]);
      check(name + ": the payload is kept to be sent later", same(e.storage.keys(), [pendingKey(ATTEMPT_ID)]) && same(JSON.parse(e.storage.getItem(pendingKey(ATTEMPT_ID)) as string), payload));
      check(name + ": every try carried the same body", f.calls.every((call) => call.init.body === f.calls[0].init.body));
    }

    section("== B-4) The kept payload is sent again on the next load ==");
    {
      const storage = new MemStorage();
      const down = fakeFetch(() => netDown());
      check("outage → kept", (await sendWithRetry(payload, env(down.fn, storage).opts)) === false && storage.length === 1);
      const other = submitted(sheets.find((item) => item.name === "mixed:2")!, "attempt-b", "ليان محمد");
      const otherPayload = buildPayload(other.attempt, other.result);
      check("a second result is kept under its own key",
        (await sendWithRetry(otherPayload, env(down.fn, storage).opts)) === false && same(storage.keys().sort(), [pendingKey(ATTEMPT_ID), pendingKey("attempt-b")].sort()));
      equal("pendingPayload() reads it back", pendingPayload(ATTEMPT_ID, { storage }), payload);
      check("a payload of another exam is left alone", pendingPayload("attempt-b", { storage }) !== null && storage.getItem("pending:grade6-mia-test:other") === null);
      const picky = fakeFetch((_n, call) => JSON.stringify({ ok: call.body.attemptId === "attempt-b" }));
      const accepted = await retryPending({ fetchImpl: picky.fn, storage, sleep: async () => {} });
      check("the server accepts one and refuses the other → only the accepted one is removed",
        accepted === 1 && storage.getItem(pendingKey("attempt-b")) === null && storage.getItem(pendingKey(ATTEMPT_ID)) !== null);
      const back = fakeFetch(() => OK);
      const sent = await retryPending({ fetchImpl: back.fn, storage, sleep: async () => {} });
      equal("the remaining one is delivered on the next round", sent, 1);
      check("and removed once the server confirmed it", storage.length === 0 && back.calls.length === 1 && back.calls[0].body.attemptId === ATTEMPT_ID);
      check("each payload kept its own attemptId and student (the refused one was tried 3 times)",
        same([...new Set(picky.calls.map((call) => call.body.attemptId))].sort(), [ATTEMPT_ID, "attempt-b"].sort()) &&
          picky.calls.filter((call) => call.body.attemptId === ATTEMPT_ID).length === 3 &&
          picky.calls.find((call) => call.body.attemptId === "attempt-b")!.body.studentName === "ليان محمد");
      equal("a second round has nothing to send", await retryPending({ fetchImpl: back.fn, storage, sleep: async () => {} }), 0);
    }
    {
      const storage = new MemStorage();
      storage.setItem(pendingKey(ATTEMPT_ID), JSON.stringify({ ...payload, token: "an-old-token" }));
      const f = fakeFetch(() => OK);
      check("the stored token is replaced by the current one", (await retryPending({ fetchImpl: f.fn, storage, sleep: async () => {} })) === 1 && f.calls[0].body.token === SHEETS_TOKEN);
      storage.setItem(pendingKey("broken"), "{ not json");
      storage.setItem("pending:grade6-mia-test-2:", JSON.stringify(payload));
      storage.setItem("unrelated-key", "1");
      const g = fakeFetch(() => OK);
      check("a broken entry is skipped, the others are still sent, nothing else is touched",
        (await retryPending({ fetchImpl: g.fn, storage, sleep: async () => {} })) >= 1 && storage.getItem("unrelated-key") === "1");
    }
    {
      const storage = new MemStorage();
      storage.setItem(pendingKey(ATTEMPT_ID), JSON.stringify(payload));
      const first = retryPending({ fetchImpl: fakeFetch(() => OK).fn, storage, sleep: async () => {} });
      const second = retryPending({ fetchImpl: fakeFetch(() => OK).fn, storage, sleep: async () => {} });
      check("two rounds at once are one round", first === second && (await first) === 1 && (await second) === 1);
    }
    {
      const f = fakeFetch(() => OK);
      check("no storage at all → still sent, nothing kept", (await sendWithRetry(payload, env(f.fn, null).opts)) === true);
      const g = fakeFetch(() => netDown());
      check("a browser that blocks storage → the delivery does not throw", (await sendWithRetry(payload, env(g.fn, brokenStorage).opts)) === false && g.calls.length === 3);
      check("and the pending round survives it", (await retryPending({ fetchImpl: fakeFetch(() => OK).fn, storage: brokenStorage, sleep: async () => {} })) === 0);
    }

    section("== B-5) The same attempt is never sent twice in parallel ==");
    {
      let release: (text: string) => void = () => {};
      const f = fakeFetch(() => new Promise<string>((resolve) => (release = resolve)));
      const e = env(f.fn);
      const first = sendWithRetry(payload, e.opts);
      const second = sendWithRetry(payload, e.opts);
      await sleep(5);
      check("one request only, although two callers asked", f.calls.length === 1);
      release(OK);
      check("both callers receive the same outcome", (await first) === true && (await second) === true);
    }
    {
      let release: (text: string) => void = () => {};
      const f = fakeFetch(() => new Promise<string>((resolve) => (release = resolve)));
      const e = env(f.fn);
      const running = sendWithRetry(payload, e.opts);
      await sleep(5);
      const again = sendWithRetry({ ...payload }, e.opts); // another object, the same attemptId
      check("still one request", f.calls.length === 1);
      release(OK);
      check("the second caller waits for the delivery in progress", (await running) === true && (await again) === true);
    }
    {
      const other = submitted(sheets.find((item) => item.name === "mixed:3")!, "attempt-c", "ميا");
      const otherPayload = buildPayload(other.attempt, other.result);
      const releases: ((text: string) => void)[] = [];
      const f = fakeFetch(() => new Promise<string>((resolve) => void releases.push(resolve)));
      const e = env(f.fn);
      const first = sendWithRetry(payload, e.opts);
      const second = sendWithRetry(otherPayload, e.opts);
      await sleep(5);
      check("two different attempts are sent in parallel", f.calls.length === 2 && releases.length === 2);
      releases.forEach((resolve) => resolve(OK));
      check("both succeed and nothing is kept", (await first) === true && (await second) === true && e.storage.length === 0);
    }

    section("== B-6) The time limit of one try ==");
    {
      const signals: AbortSignal[] = [];
      const fn: FetchLike = (_url, init) => {
        signals.push(init.signal as AbortSignal);
        return new Promise(() => {}); // never answers
      };
      const e = env(fn);
      const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 });
      check("3 tries ran out of time → false", ok === false && signals.length === 3);
      check("every hanging request was aborted when its time ran out", signals.every((signal) => signal.aborted));
      check("then the payload was stored to be sent later", e.storage.length === 1 && e.storage.getItem(pendingKey(ATTEMPT_ID)) !== null);
    }
    {
      const f = fakeFetch(() => new Promise<string>((resolve) => setTimeout(() => resolve(OK), 20)));
      const ok = await sendWithRetry(payload, { ...env(f.fn).opts, timeoutMs: 2000 });
      check("a slow reply within the limit → success in one try", ok === true && f.calls.length === 1);
    }

    section("== B-7) The page is closed or hidden while a delivery is running ==");
    {
      const g = globalThis as any;
      const win = new EventTarget();
      const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
      g.window = win;
      g.document = doc;
      try {
        const s = new MemStorage();
        let reply: (text: string) => void = () => {};
        const f = fakeFetch(() => new Promise<string>((resolve) => (reply = resolve)));
        const pending = sendWithRetry(payload, env(f.fn, s).opts);
        await sleep(5);
        check("delivery running, nothing stored", f.calls.length === 1 && s.length === 0);
        doc.dispatchEvent(new Event("visibilitychange"));
        check("page still visible: nothing stored", s.length === 0);
        doc.visibilityState = "hidden";
        doc.dispatchEvent(new Event("visibilitychange"));
        check("page hidden while sending → the payload is stored at once, under the same key", same(s.keys(), [pendingKey(ATTEMPT_ID)]) && same(JSON.parse(s.getItem(pendingKey(ATTEMPT_ID)) as string), payload));
        s.removeItem(pendingKey(ATTEMPT_ID));
        win.dispatchEvent(new Event("pagehide"));
        check("page closed (pagehide) → stored as well", same(s.keys(), [pendingKey(ATTEMPT_ID)]));
        reply(OK);
        const ok = await pending;
        check("the server confirmed → the stored copy is removed", ok === true && s.length === 0);
        win.dispatchEvent(new Event("pagehide"));
        doc.dispatchEvent(new Event("visibilitychange"));
        check("after the delivery has ended, closing the page stores nothing", s.length === 0);
      } finally {
        delete g.window;
        delete g.document;
      }
    }

    /* ================================================================== */
    /* C) Against the mock server, over real HTTP                          */
    /* ================================================================== */
    const server = new MockSheetsServer(SHEETS_TOKEN);
    await server.start();
    const wireEnv = (storage: StorageLike | null = new MemStorage()) => {
      const forward = forwardTo(server, realFetch);
      const sleeps: number[] = [];
      const opts: SendOptions = {
        fetchImpl: forward.fetchImpl as FetchLike,
        storage,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      };
      return { opts, sleeps, storage: storage as MemStorage, calls: forward.calls };
    };
    try {
      section("== C-1) Mock server: the request as it arrives ==");
      {
        const e = wireEnv();
        const ok = await sendWithRetry(payload, e.opts);
        const post = server.posts[0];
        check("the server confirmed → true", ok === true);
        check("the app asked for SHEETS_URL (the test carried the call to 127.0.0.1)", e.calls.length === 1 && e.calls[0].url === SHEETS_URL && server.url.startsWith("http://127.0.0.1:"));
        check("one POST arrived", server.posts.length === 1 && post.method === "POST");
        equal("Content-Type header on the wire", post.contentType, "text/plain;charset=utf-8");
        check("the body is the payload, as JSON text", same(post.json, payload) && post.body === JSON.stringify(payload));
        check("examId on the wire is this exam's folder name", post.json.examId === "grade6-mia-test-2");
        check("Arabic text arrives intact (UTF-8)", post.json.studentName === "سارة أحمد" && post.json.reportText === report);
        check("one row stored under the attemptId", server.rows.size === 1 && same(server.rows.get(ATTEMPT_ID), payload));
        check("the reply came through a redirect, as with Apps Script, and was read", server.redirect === true);
        check("nothing kept locally", e.storage.length === 0 && e.sleeps.length === 0);
        console.log("    (request body: " + Buffer.byteLength(post.body, "utf8") + " bytes; reportText: " + payload.reportText.length + " characters)");
      }

      section("== C-2) Mock server: the same attempt sent again is not stored twice ==");
      {
        const e = wireEnv();
        const ok = await sendWithRetry(payload, e.opts);
        check("answered duplicate:true → success", ok === true && server.posts.length === 2);
        check("still one row", server.rows.size === 1);
        server.duplicateReply = { duplicate: true };
        check("{duplicate:true} without ok → success", (await sendWithRetry(payload, wireEnv().opts)) === true && server.rows.size === 1);
        server.duplicateReply = { ok: false, duplicate: true };
        check("{ok:false, duplicate:true} → success", (await sendWithRetry(payload, wireEnv().opts)) === true && server.rows.size === 1);
        server.redirect = false;
        check("a direct 200 reply (no redirect) → success", (await sendWithRetry(payload, wireEnv().opts)) === true);
      }

      section("== C-3) Mock server: failures on the wire ==");
      {
        server.reset();
        server.queue = ["http-500", "reset"];
        const e = wireEnv();
        const ok = await sendWithRetry(payload, e.opts);
        check("HTTP 500, then a dropped connection, then success → true in three tries", ok === true && server.posts.length === 3 && same(e.sleeps, [2000, 5000]));
        check("the three tries carried the same body", server.posts.every((post) => post.body === server.posts[0].body));
        check("one row; nothing kept locally", server.rows.size === 1 && e.storage.length === 0);
      }
      for (const behaviour of ["http-500", "html-page", "empty", "ok-false", "reset"] as const) {
        server.reset();
        server.behaviour = behaviour;
        const e = wireEnv();
        const ok = await sendWithRetry(payload, e.opts);
        check("server keeps answering “" + behaviour + "” → false after 3 tries, payload kept", ok === false && server.posts.length === 3 && server.rows.size === 0 && same(e.storage.keys(), [pendingKey(ATTEMPT_ID)]));
      }
      {
        server.reset();
        server.behaviour = "hang";
        const e = wireEnv();
        const started = Date.now();
        const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 150 });
        check("server never answers → each try ends at the time limit; false; payload kept", ok === false && server.posts.length === 3 && e.storage.length === 1, Date.now() - started + " ms with a 150 ms limit");
      }
      {
        server.reset();
        const e = wireEnv();
        const ok = await sendWithRetry({ ...payload, token: "wrong-token" }, e.opts);
        check("wrong token → the server refuses, nothing stored there, payload kept here", ok === false && server.rows.size === 0 && e.storage.length === 1);
        const sent = await retryPending(e.opts);
        check("on the next load it is sent with the current token and accepted", sent === 1 && server.rows.size === 1 && server.rows.get(ATTEMPT_ID).token === SHEETS_TOKEN && e.storage.length === 0);
      }

      section("== C-4) Mock server: outage, then the pending results arrive on the next load ==");
      {
        server.reset();
        server.behaviour = "reset";
        const storage = new MemStorage();
        const other = submitted(sheets.find((item) => item.name === "mixed:2")!, "attempt-b", "ليان محمد");
        const otherPayload = buildPayload(other.attempt, other.result);
        check("outage: both results fail", (await sendWithRetry(payload, wireEnv(storage).opts)) === false && (await sendWithRetry(otherPayload, wireEnv(storage).opts)) === false);
        equal("both are kept, each under its own attemptId", storage.keys().sort(), [pendingKey(ATTEMPT_ID), pendingKey("attempt-b")].sort());
        storage.setItem("pending:grade6-mia-test:zzz", JSON.stringify({ ...payload, attemptId: "zzz", examId: "grade6-mia-test" }));
        server.behaviour = "apps-script";
        const before = server.posts.length;
        const sent = await retryPending(wireEnv(storage).opts);
        check("server back: both are delivered, once each", sent === 2 && server.posts.length === before + 2 && server.rows.size === 2);
        check("each row holds its own student and its own marks", server.rows.get(ATTEMPT_ID).studentName === "سارة أحمد" && server.rows.get("attempt-b").studentName === "ليان محمد" && same(server.rows.get("attempt-b"), otherPayload));
        check("every row carries this exam's id", [...server.rows.values()].every((row) => row.examId === "grade6-mia-test-2"));
        check("the other exam's pending result was neither sent nor removed", !server.rows.has("zzz") && same(storage.keys(), ["pending:grade6-mia-test:zzz"]));
        check("a second round has nothing to send", (await retryPending(wireEnv(storage).opts)) === 0 && server.posts.length === before + 2);
      }
    } finally {
      await server.stop();
    }

    section("== D) No real connection ==");
    equal("the app's default fetch was never used", guardedFetchCalls, 0);
  })();
}

senderTests()
  .catch((error) => {
    check("unexpected exception: " + String(error && error.stack ? error.stack : error), false);
  })
  .finally(() => {
    finished = true;
    finish("submit");
  });

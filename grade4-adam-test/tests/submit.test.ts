/**
 * Result delivery (src/exam/submit.ts):
 *   A) the payload: exact field names and types, one entry per part, totals equal to the marking;
 *   B) the sender with a scripted fetch: success, retry, duplicates, pending store, time limit;
 *   C) the sender against a mock server over real HTTP (127.0.0.1), the way the app posts.
 *
 * No test contacts the real Google endpoint: the global fetch is replaced by a guard that refuses
 * every call, and the waits between tries (2 s, then 5 s) are simulated.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { ALL_SUBPARTS, EXAM_ID as INTERNAL_EXAM_ID, EXAM_TITLE, QUESTIONS, TOTAL_MARKS } from "../src/exam/data";
import { formatDuration, gradeAttempt, statusLabel } from "../src/exam/grade";
import { buildReport, buildReportFilename, validateReport } from "../src/exam/report";
import {
  ATTEMPT_TIMEOUT_MS,
  LESSON_AREAS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeLabel,
  pendingKey,
  pendingPayload,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../src/exam/submit";
import type { Attempt } from "../src/exam/types";
import { attemptFor } from "./golden";
import { EXAM_DIR, MemStorage, check, equal, finish, section, sleep } from "./harness";
import { MockSheetsServer, forwardTo } from "./mock-server";
import { makeSheets } from "./sheets";

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
const sheet = sheets.find((item) => item.name === "mixed:12")!;
const ATTEMPT_ID = "3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a";

function submitted(base: Attempt, attemptId: string, studentName: string): Attempt {
  const attempt: Attempt = { ...base, attemptId, studentName };
  const result = gradeAttempt(attempt);
  return {
    ...attempt,
    reportText: buildReport(attempt, result),
    reportFileName: buildReportFilename(studentName),
  };
}

const attempt = submitted(
  {
    ...attemptFor(sheet),
    startTime: Date.parse("2026-11-11T07:00:05.250Z"),
    submissionTime: Date.parse("2026-11-11T07:47:38.900Z"),
    durationSeconds: 2853,
  },
  ATTEMPT_ID,
  "سارة أحمد"
);
const result = gradeAttempt(attempt);
const report = attempt.reportText as string;
const payload = buildPayload(attempt, result);
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload; // as it reaches the server

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
    check("no text field is empty (nothing is left to the server's handling of empty values)", strings.every((text) => text.trim().length > 0) && wire.lessons.length > 0 && wire.details.length > 0, strings.length + " text values");

    section("== A-2) Payload: identity of the exam and of the attempt ==");
    equal("EXAM_ID is the name of this exam's folder", EXAM_ID, path.basename(EXAM_DIR));
    equal("EXAM_ID", EXAM_ID, "grade4-adam-test");
    check("examId = EXAM_ID of src/config.ts (not the internal version id)", wire.examId === EXAM_ID && wire.examId !== INTERNAL_EXAM_ID, wire.examId);
    equal("the Apps Script URL is the one of the reference exam", SHEETS_URL, "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec");
    equal("the token is the one of the reference exam", SHEETS_TOKEN, "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
    equal("token from src/config.ts", wire.token, SHEETS_TOKEN);
    check("attemptId is the attempt's own id, as printed in the TXT report", wire.attemptId === ATTEMPT_ID && report.includes("معرّف المحاولة: " + ATTEMPT_ID));
    equal("examTitle = EXAM_TITLE", wire.examTitle, EXAM_TITLE);
    equal("studentName", wire.studentName, "سارة أحمد");
    check("startAt and submitAt in ISO form", wire.startAt === "2026-11-11T07:00:05.250Z" && wire.submitAt === "2026-11-11T07:47:38.900Z", wire.startAt + " → " + wire.submitAt);
    check("elapsedSec is the whole number of seconds shown as the duration", wire.elapsedSec === 2853 && Number.isInteger(wire.elapsedSec) && report.includes("مدة الاختبار: " + formatDuration(wire.elapsedSec)), String(wire.elapsedSec));
    check("reportText = the TXT report exactly as downloaded (BOM first)", wire.reportText === "\uFEFF" + report && wire.reportText.length > 20000, wire.reportText.length + " characters");
    check("that report passes the exam's own validation", validateReport(report, attempt, result, attempt.reportFileName as string).ok);
    check("the payload is the same when the marking is recomputed", same(buildPayload(attempt), payload) && same(buildPayload({ ...attempt, reportText: undefined }), payload));

    section("== A-3) Payload: summary equals the marking ==");
    let full = 0;
    let partial = 0;
    let wrong = 0;
    for (const question of result.questions) {
      if (question.awarded === question.marks) full += 1;
      else if (question.awarded > 0) partial += 1;
      else wrong += 1;
    }
    check(
      "the attempt covers the four statuses and full / partial / zero questions",
      result.counts.correct > 0 && result.counts.partial > 0 && result.counts.incorrect > 0 && result.counts.unanswered > 0 && full > 0 && partial > 0 && wrong > 0,
      "questions " + full + "/" + partial + "/" + wrong + " · parts " + Object.values(result.counts).join("/")
    );
    equal("total = marks awarded", wire.summary.total, result.awarded);
    check("max = 100", wire.summary.max === TOTAL_MARKS && wire.summary.max === 100);
    equal("percentage = the exam's own percentage", wire.summary.percentage, result.percentage);
    equal("gradeLabel = gradeLabel(percentage)", wire.summary.gradeLabel, gradeLabel(result.percentage));
    check("fullQuestions / partialQuestions / wrongQuestions", wire.summary.fullQuestions === full && wire.summary.partialQuestions === partial && wire.summary.wrongQuestions === wrong);
    check(
      "part counters = the exam's own counters",
      wire.summary.correctSubparts === result.counts.correct && wire.summary.partialSubparts === result.counts.partial &&
        wire.summary.wrongSubparts === result.counts.incorrect && wire.summary.unansweredSubparts === result.counts.unanswered
    );
    check(
      "question counters add up to 30 and part counters to 71",
      wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === QUESTIONS.length &&
        wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === ALL_SUBPARTS.length
    );
    check("the same numbers are written in the report", report.includes("الدرجة النهائية: " + wire.summary.total + " / 100") && report.includes("النسبة المئوية: " + wire.summary.percentage + "%"));

    section("== A-4) Payload: gradeLabel — the scale of the reference exam, sent to the teacher only ==");
    const scale: [number, string][] = [
      [100, "ممتاز"], [95, "ممتاز"], [94.99, "جيد جداً"], [94, "جيد جداً"], [85, "جيد جداً"], [84.99, "جيد"], [84, "جيد"], [75, "جيد"],
      [74.99, "مقبول"], [74, "مقبول"], [65, "مقبول"], [64.99, "ضعيف"], [64, "ضعيف"], [50, "ضعيف"], [49.99, "يحتاج إلى دعم"], [49, "يحتاج إلى دعم"], [0, "يحتاج إلى دعم"],
    ];
    for (const [percentage, label] of scale) equal("gradeLabel(" + percentage + ")", gradeLabel(percentage), label);
    const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
    check("the label is not written to the TXT report", !wholeWord(wire.summary.gradeLabel).test(report) && !report.includes("التقدير"), wire.summary.gradeLabel);
    {
      const best = submitted(attemptFor(sheets.find((item) => item.name === "all-correct")!), "best-attempt", "آدم");
      const top = buildPayload(best);
      check("all correct: 100, ممتاز, 30 full questions", top.summary.total === 100 && top.summary.percentage === 100 && top.summary.gradeLabel === "ممتاز" && top.summary.fullQuestions === 30 && top.summary.correctSubparts === 71);
      const empty = submitted(attemptFor(sheets.find((item) => item.name === "blank")!), "blank-attempt", "آدم");
      const bottom = buildPayload(empty);
      check("blank: 0, يحتاج إلى دعم, 71 unanswered parts", bottom.summary.total === 0 && bottom.summary.gradeLabel === "يحتاج إلى دعم" && bottom.summary.wrongQuestions === 30 && bottom.summary.unansweredSubparts === 71);
      check("blank: every answer text is still filled in", bottom.details.every((detail) => detail.studentAnswer.trim().length > 0));
    }

    section("== A-5) Payload: details — one entry per part ==");
    const flat = result.questions.flatMap((question, questionIndex) => question.subparts.map((part, partIndex) => ({ question, questionIndex, part, partIndex })));
    check("as many entries as parts (71)", wire.details.length === ALL_SUBPARTS.length && flat.length === ALL_SUBPARTS.length, String(wire.details.length));
    check("no repeats: every (question, part) appears once", new Set(wire.details.map((detail) => detail.q + "/" + detail.label)).size === ALL_SUBPARTS.length);
    check("every part of the paper is present", same(flat.map((item) => item.part.subpartId).sort(), ALL_SUBPARTS.map((sub) => sub.id).sort()));
    check("in the order shown to the student", flat.every((item, index) => wire.details[index].q === item.questionIndex + 1 && wire.details[index].label === "الجزء " + (item.partIndex + 1)));
    check(
      "q is the number the student saw, not the number in the bank",
      wire.details[0].q === 1 && wire.details[0].qTitle === QUESTIONS.find((question) => question.id === sheet.order[0])!.title &&
        sheet.order[0] !== QUESTIONS[0].id && wire.details[wire.details.length - 1].q === 30 &&
        same([...new Set(wire.details.map((detail) => detail.q))], Array.from({ length: 30 }, (_, index) => index + 1))
    );
    check("qTitle = the question's title, as in the report", flat.every((item, index) => wire.details[index].qTitle === item.question.question.title && report.includes("العنوان: " + wire.details[index].qTitle)));
    check("status = the exam's own status wording", flat.every((item, index) => wire.details[index].status === statusLabel(item.part.status)) && same([...new Set(wire.details.map((detail) => detail.status))].sort(), ["جزئية", "خاطئة", "صحيحة", "غير مجابة"].sort()));
    check("awarded and marks as marked", flat.every((item, index) => wire.details[index].awarded === item.part.awarded && wire.details[index].marks === item.part.marks));
    check(
      "studentAnswer and correctAnswer are the texts of the results page and the report",
      flat.every((item, index) =>
        wire.details[index].studentAnswer === item.part.studentAnswer && wire.details[index].correctAnswer === item.part.correctAnswer &&
        report.includes("  إجابة الطالب: " + wire.details[index].studentAnswer) && report.includes("  الإجابة الصحيحة: " + wire.details[index].correctAnswer)
      )
    );
    check(
      "the report line of every part matches its entry",
      flat.every((item, index) => {
        const detail = wire.details[index];
        return report.includes("  " + detail.label + " [" + item.part.subpartId + "] — " + detail.marks + " درجة — الحالة: " + detail.status + " — الدرجة الممنوحة: " + detail.awarded + "/" + detail.marks);
      })
    );
    const count = (status: string) => wire.details.filter((detail) => detail.status === status).length;
    check("statuses in details = the summary counters", count("صحيحة") === wire.summary.correctSubparts && count("جزئية") === wire.summary.partialSubparts && count("خاطئة") === wire.summary.wrongSubparts && count("غير مجابة") === wire.summary.unansweredSubparts);
    check("awarded adds up to total and marks to 100", wire.details.reduce((sum, detail) => sum + detail.awarded, 0) === wire.summary.total && wire.details.reduce((sum, detail) => sum + detail.marks, 0) === 100);

    section("== A-6) Payload: lessons — the seven areas named on the welcome screen ==");
    const welcome = readFileSync(path.join(EXAM_DIR, "src", "components", "Welcome.tsx"), "utf8");
    equal("seven areas, in the order of the welcome screen", wire.lessons.map((lesson) => lesson.title), ["التمثيل البياني", "شبكة الإحداثيات", "الأنماط", "الأعداد", "المقارنة", "التقريب", "الجمع"]);
    check("the titles are the exam's own words", welcome.includes("الأسئلة موزعة على التمثيل البياني، وشبكة الإحداثيات، والأنماط، والأعداد، والمقارنة، والتقريب، والجمع."));
    const mapped = LESSON_AREAS.flatMap((area) => area.questionIds);
    check("every question belongs to exactly one area", mapped.length === 30 && new Set(mapped).size === 30 && same([...mapped].sort(), QUESTIONS.map((question) => question.id).sort()));
    check("areas follow the order of the bank", same(mapped, QUESTIONS.map((question) => question.id)));
    const expectedLessons = LESSON_AREAS.map((area) => {
      const questions = result.questions.filter((question) => area.questionIds.includes(question.question.id));
      return { title: area.title, awarded: questions.reduce((sum, question) => sum + question.awarded, 0), max: questions.reduce((sum, question) => sum + question.marks, 0) };
    });
    equal("awarded and max of every area = the sum of its questions", wire.lessons, expectedLessons);
    equal("the areas' max add up to 100", wire.lessons.reduce((sum, lesson) => sum + lesson.max, 0), 100);
    equal("the areas' awarded add up to total", wire.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0), wire.summary.total);
    check("every area: 0 ≤ awarded ≤ max", wire.lessons.every((lesson) => lesson.awarded >= 0 && lesson.awarded <= lesson.max && lesson.max > 0), wire.lessons.map((lesson) => lesson.awarded + "/" + lesson.max).join(" · "));
    check("details.lessons = the area of the question", flat.every((item, index) => wire.details[index].lessons === LESSON_AREAS.find((area) => area.questionIds.includes(item.question.question.id))!.title));

    section("== A-7) Pending key ==");
    check("pending:<EXAM_ID>:<attemptId>", pendingKey(ATTEMPT_ID) === "pending:grade4-adam-test:" + ATTEMPT_ID && PENDING_PREFIX === "pending:" + EXAM_ID + ":", pendingKey(ATTEMPT_ID));
    check("the prefix does not match the keys of the other grade 4 exam", !("pending:grade4-adam-test-2:" + ATTEMPT_ID).startsWith(PENDING_PREFIX));

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
        const one = submitted(attemptFor(item), ATTEMPT_ID, longName);
        const marked = gradeAttempt(one);
        const built = buildPayload(one, marked);
        longest = Math.max(longest, built.reportText.length);
        shortest = Math.min(shortest, built.reportText.length);
        largestBody = Math.max(largestBody, Buffer.byteLength(JSON.stringify(built), "utf8"));
        consistent = consistent && built.summary.total === marked.awarded && built.details.length === ALL_SUBPARTS.length &&
          built.details.reduce((sum, detail) => sum + detail.awarded, 0) === marked.awarded &&
          built.lessons.reduce((sum, lesson) => sum + lesson.awarded, 0) === marked.awarded &&
          built.summary.gradeLabel === gradeLabel(marked.percentage);
      }
      check("the longest allowed name has 60 characters", longName.length === 60);
      check("all " + sheets.length + " sheets: total, details and lessons agree with the marking", consistent && sheets.length === 411);
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
      check("no mode, nothing else but the signal of the time limit", same(Object.keys(init).sort(), ["body", "headers", "method", "redirect", "signal"]) && init.signal instanceof AbortSignal && !init.signal.aborted);
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
      const ok = await sendWithRetry(payload, e.opts);
      check("a reply that cannot be read (CORS) → failure, then another try", ok === true && calls.length === 2 && same(e.sleeps, [2000]));
    }
    for (const [name, body] of [
      ["empty reply", ""], ["{}", "{}"], ["null", "null"], ['ok:"true" as text', '{"ok":"true"}'], ["ok:1", '{"ok":1}'],
      ["an array", "[true]"], ["ok:false", '{"ok":false}'], ['the text "ok"', '"ok"'],
    ] as const) {
      const f = fakeFetch(() => body);
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      check("not a success: " + name, ok === false && f.calls.length === 3 && e.storage.length === 1);
    }

    section("== B-3) Sending: a repeat is safe (same attemptId) ==");
    {
      // A server that ignores a repeated id; its first reply is lost on the way, so the app sends again.
      const rows = new Map<string, SubmissionPayload>();
      let lost = 1;
      const f = fakeFetch((_n, call) => {
        const duplicate = rows.has(call.body.attemptId);
        if (!duplicate) rows.set(call.body.attemptId, call.body);
        if (lost-- > 0) return netDown();
        return JSON.stringify(duplicate ? { ok: true, duplicate: true } : { ok: true });
      });
      const e = env(f.fn);
      const ok = await sendWithRetry(payload, e.opts);
      check("first reply lost → sent again with the same attemptId", f.calls.length === 2 && f.calls.every((call) => call.body.attemptId === ATTEMPT_ID));
      check("duplicate:true counts as success", ok === true);
      check("one row only in the scripted sheet", rows.size === 1 && same(rows.get(ATTEMPT_ID), payload));
      check("nothing stored", e.storage.length === 0);
      const again = await sendWithRetry(payload, e.opts); // like the resend button after the result did arrive
      check("sending the same attempt again later: success, no new row", again === true && rows.size === 1 && f.calls.length === 3);
    }
    {
      const f = fakeFetch(() => JSON.stringify({ duplicate: true }));
      check("{duplicate:true} alone is a success", (await sendWithRetry(payload, env(f.fn).opts)) === true && f.calls.length === 1);
    }
    {
      // The results page, the resend button and the pending round may all ask for the same attempt at once.
      let release: (text: string) => void = () => {};
      const f = fakeFetch(() => new Promise<string>((resolve) => (release = resolve)));
      const e = env(f.fn);
      e.storage.setItem(pendingKey(ATTEMPT_ID), JSON.stringify(payload));
      const first = sendWithRetry(payload, e.opts);
      const second = sendWithRetry({ ...payload }, e.opts);
      const round = retryPending(e.opts);
      await sleep(10);
      check("three callers for one attemptId at the same time → one request", f.calls.length === 1, String(f.calls.length));
      release(OK);
      const outcome = await Promise.all([first, second, round]);
      check("every caller gets the outcome of that one delivery", same(outcome, [true, true, 1]) && f.calls.length === 1 && e.storage.length === 0);
      const later = fakeFetch(() => OK);
      check("once it has finished, a new delivery can start", (await sendWithRetry(payload, env(later.fn).opts)) === true && later.calls.length === 1);
    }

    section("== B-4) Sending: every try fails → kept in localStorage ==");
    const store = new MemStorage();
    {
      const sizesDuringTries: number[] = [];
      const f = fakeFetch(() => {
        sizesDuringTries.push(store.length);
        return netDown();
      });
      const e = env(f.fn, store);
      const ok = await sendWithRetry(payload, e.opts);
      check("false after exactly 3 tries", ok === false && f.calls.length === 3, String(f.calls.length));
      equal("waits of 2 s then 5 s", e.sleeps, [2000, 5000]);
      equal("nothing stored before every try has failed", sizesDuringTries, [0, 0, 0]);
      equal("stored under pending:<EXAM_ID>:<attemptId>", store.keys(), ["pending:" + EXAM_ID + ":" + ATTEMPT_ID]);
      check("what is stored is the whole payload", same(JSON.parse(store.getItem(pendingKey(ATTEMPT_ID)) ?? "null"), payload) && same(pendingPayload(ATTEMPT_ID, { storage: store }), payload));
      check("nothing is kept for an attempt that never failed", pendingPayload("another-attempt", { storage: store }) === null);
    }
    {
      const f = fakeFetch(netDown);
      let threw = false;
      let r1 = true;
      let r2 = true;
      let r3 = true;
      try {
        r1 = await sendWithRetry(payload, env(f.fn, null).opts); // no storage available
        r2 = await sendWithRetry(payload, env(f.fn, brokenStorage).opts); // every storage call throws
        const { opts } = env(f.fn);
        delete opts.storage; // the default path: there is no window and no localStorage here
        r3 = await sendWithRetry(payload, opts);
      } catch {
        threw = true;
      }
      check("storage unavailable or throwing: no exception, resolves false", !threw && r1 === false && r2 === false && r3 === false && f.calls.length === 9);
      const g = fakeFetch(() => OK);
      let okWithBroken = false;
      try {
        okWithBroken = await sendWithRetry(payload, env(g.fn, brokenStorage).opts);
      } catch {
        threw = true;
      }
      check("and a successful delivery is not affected by broken storage", !threw && okWithBroken === true && pendingPayload(ATTEMPT_ID, { storage: brokenStorage }) === null);
    }

    section("== B-5) On app load: the pending results are sent again ==");
    {
      const second: SubmissionPayload = { ...payload, attemptId: "older-attempt-0002", studentName: "ليان محمد" };
      store.setItem(pendingKey(second.attemptId), JSON.stringify(second));
      store.setItem("pending:grade4-adam-test-2:abc", '{"attemptId":"abc","examId":"grade4-adam-test-2"}'); // the other grade 4 exam, same site
      store.setItem("pending:grade5-math-unit1:def", '{"attemptId":"def"}'); // another exam on the same site
      store.setItem("adam_math_grade4_attempt_v1", '{"schema":2}'); // this exam's own autosave
      store.setItem(pendingKey("corrupt"), "{not json"); // a damaged entry
      const before = store.keys().slice().sort();

      const down = fakeFetch(netDown);
      const sent0 = await retryPending(env(down.fn, store).opts);
      check("server still down: nothing sent and everything kept", sent0 === 0 && same(store.keys().slice().sort(), before));
      check(
        "3 tries per pending payload; none for the damaged entry or for other exams",
        down.calls.length === 6 && same([...new Set(down.calls.map((call) => call.body.attemptId))].sort(), [ATTEMPT_ID, second.attemptId].sort())
      );

      // The server accepts one and rejects the other.
      const picky = fakeFetch((_n, call) => JSON.stringify({ ok: call.body.attemptId === second.attemptId }));
      const sent1 = await retryPending(env(picky.fn, store).opts);
      check("only the accepted payload is removed", sent1 === 1 && store.getItem(pendingKey(second.attemptId)) === null && store.getItem(pendingKey(ATTEMPT_ID)) !== null);

      const up = fakeFetch(() => OK);
      const e3 = env(up.fn, store);
      const sent2 = await retryPending(e3.opts);
      check(
        "server up: the remaining payload is sent as it was stored",
        sent2 === 1 && up.calls.length === 1 && up.calls[0].url === SHEETS_URL && same(up.calls[0].body, payload) &&
          same(up.calls[0].init.headers, { "Content-Type": "text/plain;charset=utf-8" })
      );
      check("and removed after success", store.getItem(pendingKey(ATTEMPT_ID)) === null);
      check(
        "the keys of the other exams and the autosave are untouched",
        store.getItem("pending:grade4-adam-test-2:abc") === '{"attemptId":"abc","examId":"grade4-adam-test-2"}' &&
          store.getItem("pending:grade5-math-unit1:def") === '{"attemptId":"def"}' && store.getItem("adam_math_grade4_attempt_v1") === '{"schema":2}'
      );
      check("quietly and without waiting on success", e3.sleeps.length === 0);

      const idle = fakeFetch(() => OK);
      const sent3 = await retryPending(env(idle.fn, store).opts);
      check("nothing pending afterwards: no requests", sent3 === 0 && idle.calls.length === 0);
    }
    {
      // StrictMode runs the load effect twice: the payload must not be sent twice.
      const s = new MemStorage();
      s.setItem(pendingKey(ATTEMPT_ID), JSON.stringify(payload));
      const f = fakeFetch(() => OK);
      const opts = env(f.fn, s).opts;
      const [a, b] = await Promise.all([retryPending(opts), retryPending(opts)]);
      check("two calls in a row on load → one delivery", f.calls.length === 1 && a === 1 && b === 1 && s.length === 0);
    }
    {
      // A payload stored with an old token is sent with the current one from src/config.ts.
      const s = new MemStorage();
      s.setItem(pendingKey(ATTEMPT_ID), JSON.stringify({ ...payload, token: "old-token" }));
      const f = fakeFetch(() => OK);
      await retryPending(env(f.fn, s).opts);
      check("pending payloads are sent with the current token", f.calls.length === 1 && f.calls[0].body.token === SHEETS_TOKEN && same({ ...f.calls[0].body }, payload));
    }
    {
      const f = fakeFetch(() => OK);
      let threw = false;
      let a = -1;
      let b = -1;
      let c = -1;
      try {
        a = await retryPending(env(f.fn, null).opts);
        b = await retryPending(env(f.fn, brokenStorage).opts);
        const { opts } = env(f.fn);
        delete opts.storage;
        c = await retryPending(opts);
      } catch {
        threw = true;
      }
      check("storage unavailable: no exception and no requests", !threw && a === 0 && b === 0 && c === 0 && f.calls.length === 0);
    }

    section("== B-6) Time limit: a connection with no reply counts as a failure ==");
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
        check("examId on the wire is this exam's folder name", post.json.examId === "grade4-adam-test");
        check("Arabic text arrives intact (UTF-8)", post.json.studentName === "سارة أحمد" && post.json.reportText === "\uFEFF" + report);
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
        const other = buildPayload(submitted(attemptFor(sheets.find((item) => item.name === "mixed:2")!), "attempt-b", "ليان محمد"));
        check("outage: both results fail", (await sendWithRetry(payload, wireEnv(storage).opts)) === false && (await sendWithRetry(other, wireEnv(storage).opts)) === false);
        equal("both are kept, each under its own attemptId", storage.keys().sort(), [pendingKey(ATTEMPT_ID), pendingKey("attempt-b")].sort());
        storage.setItem("pending:grade4-adam-test-2:zzz", JSON.stringify({ ...payload, attemptId: "zzz", examId: "grade4-adam-test-2" }));
        server.behaviour = "apps-script";
        const before = server.posts.length;
        const sent = await retryPending(wireEnv(storage).opts);
        check("server back: both are delivered, once each", sent === 2 && server.posts.length === before + 2 && server.rows.size === 2);
        check("each row holds its own student and its own marks", server.rows.get(ATTEMPT_ID).studentName === "سارة أحمد" && server.rows.get("attempt-b").studentName === "ليان محمد" && same(server.rows.get("attempt-b"), other));
        check("every row carries this exam's id", [...server.rows.values()].every((row) => row.examId === "grade4-adam-test"));
        check("the other exam's pending result was neither sent nor removed", !server.rows.has("zzz") && same(storage.keys(), ["pending:grade4-adam-test-2:zzz"]));
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

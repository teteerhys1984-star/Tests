/**
 * Test harness for the single-file examination.
 *
 * It opens an examination HTML file (the published page, or the untouched original kept in
 * tests/fixtures/original-exam.html) in jsdom and runs the page's own inline script unchanged.
 * Everything around the page is a controlled stand-in:
 *   · a virtual clock (setTimeout / setInterval / Date.now) — the 2 s and 5 s retry waits and the
 *     30 s time limit never really elapse;
 *   · a localStorage stand-in that can be handed to a later "opening" of the page;
 *   · a fetch stand-in (FakeServer) — no test ever talks to the network;
 *   · a seeded Math.random, and capture of the files the page asks the browser to download.
 *
 * External resources of the page (the Tailwind browser script and the Google Fonts stylesheet)
 * are never requested: jsdom does not load them.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

/* The TXT report prints local dates and times: tests always run in UTC. */
process.env.TZ = "UTC";

export const EXAM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EXAM_DIR_NAME = path.basename(EXAM_DIR);
export const SOURCE_HTML = path.join(EXAM_DIR, "index.html");
export const ORIGINAL_HTML = path.join(EXAM_DIR, "tests", "fixtures", "original-exam.html");
export const BASELINE_JSON = path.join(EXAM_DIR, "tests", "fixtures", "baseline.json");
export const DIST_HTML = path.join(EXAM_DIR, "dist", "index.html");

/** sha256 of the file as it was uploaded (minecraft-themed-english-assessment/index.html at 24550b9). */
export const ORIGINAL_SHA256 = "a57676e65e3d00f638109aec3e68464f1df32cd687bed9ca4c8abb9b510b0380";

export const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const PENDING_PREFIX = "pending:" + EXAM_DIR_NAME + ":";
/** The page's own attempt store (unchanged from the original). */
export const ATTEMPT_KEY = "mahmoud_minecraft_english_attempt_v1";

/** Lets pending promise callbacks (inside and outside the page) run. */
export async function settle(rounds = 10) {
  for (let i = 0; i < rounds; i++) await new Promise((resolve) => setImmediate(resolve));
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Virtual clock                                                       */
/* ------------------------------------------------------------------ */
export class Clock {
  constructor(startMs = Date.UTC(2026, 10, 14, 7, 0, 5, 250)) {
    this.now = startMs;
    this.timers = [];
    this.nextId = 1;
  }
  setTimeout(fn, ms) {
    const timer = { id: this.nextId++, at: this.now + Math.max(0, Number(ms) || 0), fn, every: null };
    this.timers.push(timer);
    return timer.id;
  }
  setInterval(fn, ms) {
    const every = Math.max(1, Number(ms) || 1);
    const timer = { id: this.nextId++, at: this.now + every, fn, every };
    this.timers.push(timer);
    return timer.id;
  }
  clear(id) {
    this.timers = this.timers.filter((timer) => timer.id !== id);
  }
  /** Moves time forward, firing due timers in order and letting promises settle after each. */
  async advance(ms) {
    const end = this.now + ms;
    await settle();
    for (;;) {
      const due = this.timers.filter((timer) => timer.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      this.now = Math.max(this.now, due.at);
      if (due.every) due.at += due.every;
      else this.clear(due.id);
      try { due.fn(); } catch { /* a page timer must not break the harness */ }
      /* The 1 s stopwatch tick does no asynchronous work; only one-shot timers need settling. */
      if (!due.every) await settle();
    }
    this.now = end;
    await settle();
  }
}

/* ------------------------------------------------------------------ */
/* localStorage stand-in                                               */
/* ------------------------------------------------------------------ */
export class FakeStorage {
  constructor() {
    this.map = new Map();
    /** When true, setItem throws (storage full or blocked). */
    this.failWrites = false;
    /** When true, every call throws (storage disabled). */
    this.broken = false;
  }
  guard(write) {
    if (this.broken || (write && this.failWrites)) throw new Error("QuotaExceededError");
  }
  get length() { this.guard(false); return this.map.size; }
  key(index) { this.guard(false); return [...this.map.keys()][index] ?? null; }
  getItem(key) { this.guard(false); return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.guard(true); this.map.set(String(key), String(value)); }
  removeItem(key) { this.guard(false); this.map.delete(String(key)); }
  clear() { this.map.clear(); }
  keys(prefix = "") { return [...this.map.keys()].filter((key) => key.startsWith(prefix)); }
}

/* ------------------------------------------------------------------ */
/* Stand-in for the teacher's Google Apps Script web app               */
/* ------------------------------------------------------------------ */
/**
 * Records every request and answers each one with the next mode of `script` (then `fallback`):
 *   ok          {"ok":true}; an attemptId it already stored is answered {"ok":true,"duplicate":true}
 *   duplicate   {"ok":false,"duplicate":true}   (the attempt is already on the sheet)
 *   rejected    {"ok":false,"error":"bad token"}
 *   html        a reply that is not JSON (sign-in page, error page)
 *   network     network error
 *   lost-reply  the row is stored, but the reply never reaches the page
 *   hang        never answers; rejects only when the page aborts the request
 */
export class FakeServer {
  constructor(script = [], fallback = "ok") {
    this.script = script.slice();
    this.fallback = fallback;
    this.requests = [];
    this.rows = new Map();
    this.clock = null;
  }
  store(payload) {
    const id = payload && payload.attemptId;
    if (this.rows.has(id)) return '{"ok":true,"duplicate":true}';
    this.rows.set(id, payload);
    return '{"ok":true}';
  }
  fetch = (url, init = {}) => {
    const mode = this.script.length ? this.script.shift() : this.fallback;
    const request = { url: String(url), init, mode, at: this.clock ? this.clock.now : 0, aborted: false };
    try { request.payload = JSON.parse(init.body); } catch { request.payload = null; }
    this.requests.push(request);
    const reply = (text) => Promise.resolve({ ok: true, status: 200, text: async () => text });
    switch (mode) {
      case "ok": return reply(this.store(request.payload));
      case "duplicate": return reply('{"ok":false,"duplicate":true}');
      case "rejected": return reply('{"ok":false,"error":"bad token"}');
      case "html": return reply("<!DOCTYPE html><html><body>Service error</body></html>");
      case "network": return Promise.reject(new TypeError("Failed to fetch"));
      case "lost-reply": this.store(request.payload); return Promise.reject(new TypeError("Failed to fetch"));
      case "hang":
        return new Promise((_, reject) => {
          if (init.signal) {
            init.signal.addEventListener("abort", () => {
              request.aborted = true;
              reject(new Error("AbortError"));
            });
          }
        });
      default: throw new Error("unknown mode " + mode);
    }
  };
  get count() { return this.requests.length; }
  attemptIds() { return this.requests.map((request) => request.payload && request.payload.attemptId); }
  /** Milliseconds between the first request and each request. */
  offsets() { return this.requests.map((request) => request.at - this.requests[0].at); }
}

/* ------------------------------------------------------------------ */
/* Page loader                                                         */
/* ------------------------------------------------------------------ */
/**
 * "Opens" the examination page and waits until the page has started itself. Passing the same `storage` to a later call simulates opening the
 * examination again on the same device.
 *   crypto: undefined = jsdom's own; null = no crypto.randomUUID (older browser)
 */
export async function openExam({ file = SOURCE_HTML, storage = new FakeStorage(), server = new FakeServer(), clock = new Clock(), seed = 20261114, crypto } = {}) {
  const html = readFileSync(file, "utf8");
  server.clock = clock;
  const downloads = [];
  const consoleLines = [];
  const pageErrors = [];
  const virtualConsole = new VirtualConsole();
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    virtualConsole.on(level, (...args) => consoleLines.push({ level, text: args.map(String).join(" ") }));
  }
  virtualConsole.on("jsdomError", (error) => {
    if (!/Not implemented/i.test(String(error && error.message))) pageErrors.push(error);
  });
  const dom = new JSDOM(html, {
    url: "https://example.test/" + EXAM_DIR_NAME + "/",
    runScripts: "dangerously",
    pretendToBeVisual: false,
    virtualConsole,
    beforeParse(window) {
      window.Math.random = mulberry32(seed);
      window.Date.now = () => clock.now;
      window.setTimeout = (fn, ms) => clock.setTimeout(fn, ms);
      window.clearTimeout = (id) => clock.clear(id);
      window.setInterval = (fn, ms) => clock.setInterval(fn, ms);
      window.clearInterval = (id) => clock.clear(id);
      window.requestAnimationFrame = (fn) => clock.setTimeout(() => fn(clock.now), 16);
      window.scrollTo = () => {};
      window.Element.prototype.scrollIntoView = function () {};
      window.fetch = server.fetch;
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
      if (crypto === null) Object.defineProperty(window, "crypto", { configurable: true, value: undefined });
      else if (crypto !== undefined) Object.defineProperty(window, "crypto", { configurable: true, value: crypto });
      window.URL.createObjectURL = (blob) => {
        downloads.push({ blob, name: null });
        return "blob:test/" + downloads.length;
      };
      window.URL.revokeObjectURL = () => {};
      /* Capture the file name when the page clicks its temporary download link. */
      const realClick = window.HTMLAnchorElement.prototype.click;
      window.HTMLAnchorElement.prototype.click = function () {
        if (this.download && downloads.length) downloads[downloads.length - 1].name = this.download;
        else realClick.call(this);
      };
    },
  });
  const { window } = dom;
  const document = window.document;
  const page = {
    file, html, dom, window, document, storage, server, clock, downloads, consoleLines, pageErrors,
    /** Runs code in the page's global scope (reaches QUESTIONS, attempt and the page's functions). */
    run: (code) => window.eval(code),
    /** Reads a page value as plain JSON data. */
    json: (expr) => {
      const text = window.eval("JSON.stringify(" + expr + ")");
      return text === undefined ? undefined : JSON.parse(text);
    },
    has: (name) => window.eval("typeof " + name + " !== 'undefined'"),
    $: (selector) => document.querySelector(selector),
    $$: (selector) => [...document.querySelectorAll(selector)],
    text: (selector) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error("no element: " + selector);
      return (el.textContent || "").replace(/\s+/g, " ").trim();
    },
    /** True when the element exists and neither it nor an ancestor is hidden or on an inactive screen. */
    visible: (selector) => {
      const target = document.querySelector(selector);
      if (!target) return false;
      for (let el = target; el; el = el.parentElement) {
        if (el.hidden) return false;
        if (el.classList.contains("screen") && !el.classList.contains("active")) return false;
      }
      return true;
    },
    screen: () => (document.querySelector(".screen.active") || { id: "" }).id.replace("screen-", ""),
    click: (selector) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error("no element: " + selector);
      el.click();
    },
    /** Exact bytes of a file the page asked the browser to download (default: the latest). */
    async downloadBytes(index = -1) {
      const item = downloads.at(index);
      return item ? Buffer.from(await item.blob.arrayBuffer()) : null;
    },
    /** The same file as text; the leading byte-order mark is kept. */
    async downloadText(index = -1) {
      const bytes = await page.downloadBytes(index);
      return bytes ? bytes.toString("utf8") : null;
    },
    close: () => window.close(),
  };
  /* The page starts itself on DOMContentLoaded, which jsdom fires after the constructor returns. */
  if (document.readyState === "loading") await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  await settle(2);
  page.questions = page.json("QUESTIONS");
  return page;
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */
/*
 * The page stores one value per question in attempt.answers[question.id]:
 *   choice  the option text                       "her"
 *   order   the tokens in the order chosen        ["Khalil","plays","football"]
 *   labels  { partIndex: option }                 {"0":"Subject","1":"Verb","2":"Object"}
 *   match   { pairIndex: option }                 {"0":"short", ...}
 *   blanks  [option per blank]                    ["are","plays","were"]
 */

/** The answer the examination's own key marks as fully correct. */
export function correctAnswer(q) {
  switch (q.type) {
    case "choice": return q.answer;
    case "order": return q.answer.slice();
    case "labels": return Object.fromEntries(q.parts.map((part, i) => [i, part.answer]));
    case "match": return Object.fromEntries(q.pairs.map((pair, i) => [i, pair.answer]));
    case "blanks": return q.parts.map((part) => part.answer);
  }
  throw new Error("unknown type " + q.type);
}

/** A complete answer that earns no mark. */
export function wrongAnswer(q) {
  switch (q.type) {
    case "choice": return q.options.find((option) => option !== q.answer);
    case "order": return q.answer.slice().reverse();
    case "labels": return Object.fromEntries(q.parts.map((part, i) => [i, q.options.find((option) => option !== part.answer)]));
    case "match": return Object.fromEntries(q.pairs.map((pair, i) => [i, q.options.find((option) => option !== pair.answer)]));
    case "blanks": return q.parts.map((part) => part.options.find((option) => option !== part.answer));
  }
  throw new Error("unknown type " + q.type);
}

function shuffled(values, random) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
const pick = (values, random) => values[Math.floor(random() * values.length)];

/** A random answer of valid shape: may be right, wrong, partly right or incomplete. */
export function variantAnswer(q, random, allowIncomplete = true) {
  const gap = () => allowIncomplete && random() < 0.12;
  switch (q.type) {
    case "choice": return pick(q.options, random);
    case "order": {
      const order = shuffled(q.tokens, random);
      return gap() ? order.slice(0, Math.floor(random() * order.length)) : order;
    }
    case "labels": {
      const out = {};
      q.parts.forEach((part, i) => { if (!gap()) out[i] = random() < 0.5 ? part.answer : pick(q.options, random); });
      return out;
    }
    case "match": {
      const out = {};
      q.pairs.forEach((pair, i) => { if (!gap()) out[i] = random() < 0.5 ? pair.answer : pick(q.options, random); });
      return out;
    }
    case "blanks": return q.parts.map((part) => (gap() ? "" : random() < 0.5 ? part.answer : pick(part.options, random)));
  }
  throw new Error("unknown type " + q.type);
}

/** Mirrors the page's isAnswered(): the page only lets a complete paper be submitted. */
export function isComplete(q, value) {
  if (value === undefined || value === null) return false;
  if (q.type === "choice") return typeof value === "string" && value.length > 0;
  if (q.type === "order") return Array.isArray(value) && value.length === q.tokens.length;
  if (q.type === "labels") return q.parts.every((_, i) => !!value[i]);
  if (q.type === "match") return q.pairs.every((_, i) => !!value[i]);
  if (q.type === "blanks") return Array.isArray(value) && q.parts.every((_, i) => !!value[i]);
  return false;
}

export function sheetOf(questions, answerFor) {
  const answers = {};
  for (const q of questions) {
    const value = answerFor(q);
    if (value !== undefined) answers[q.id] = value;
  }
  return answers;
}

/**
 * The fixed set of answer sheets used to compare marking with the original: all correct, all
 * wrong, blank, one sheet per question with only that question wrong, then seeded random mixes.
 * "complete-*" sheets answer every question (they can be submitted through the page);
 * "mixed-*" sheets also contain unanswered questions and incomplete answers.
 * The same input always produces the same sheets.
 */
export function makeSheets(questions, randomCount = 300) {
  const sheets = [
    { name: "all-correct", answers: sheetOf(questions, correctAnswer) },
    { name: "all-wrong", answers: sheetOf(questions, wrongAnswer) },
    { name: "blank", answers: {} },
  ];
  for (const q of questions) {
    sheets.push({ name: "only-q" + q.id + "-wrong", answers: sheetOf(questions, (item) => (item.id === q.id ? wrongAnswer(item) : correctAnswer(item))) });
  }
  const random = mulberry32(4025);
  for (let n = 0; n < randomCount; n++) {
    const complete = n % 2 === 0;
    const bias = random();
    sheets.push({
      name: (complete ? "complete-" : "mixed-") + String(n + 1).padStart(3, "0"),
      answers: sheetOf(questions, (q) => {
        const roll = random();
        if (!complete && roll < 0.1) return undefined;
        if (roll < 0.1 + 0.6 * bias) return correctAnswer(q);
        if (roll < 0.85) return variantAnswer(q, random, !complete);
        return wrongAnswer(q);
      }),
    });
  }
  return sheets;
}

/** Every answer a question's controls can produce (including incomplete ones), for exhaustive marking checks. */
export function answerSpace(q) {
  const product = (lists) => lists.reduce((acc, list) => acc.flatMap((head) => list.map((item) => head.concat([item]))), [[]]);
  switch (q.type) {
    case "choice": return [undefined, ...q.options, "something else", ""];
    case "order": {
      const out = [undefined, []];
      const walk = (prefix, rest) => {
        for (const token of rest) {
          const next = prefix.concat([token]);
          out.push(next);
          walk(next, rest.filter((item) => item !== token));
        }
      };
      walk([], q.tokens);
      return out;
    }
    case "labels":
    case "match": {
      const count = q.type === "labels" ? q.parts.length : q.pairs.length;
      const combos = product(Array.from({ length: count }, () => [null, ...q.options]));
      return [undefined, ...combos.map((combo) => Object.fromEntries(combo.map((value, i) => [i, value]).filter(([, value]) => value !== null)))];
    }
    case "blanks": return [undefined, ...product(q.parts.map((part) => ["", ...part.options]))];
  }
  throw new Error("unknown type " + q.type);
}

/* ------------------------------------------------------------------ */
/* Marking a sheet with the page's own engine                          */
/* ------------------------------------------------------------------ */
export const FIXED_META = Object.freeze({
  name: "Mahmoud Test",
  startedAt: Date.UTC(2026, 10, 14, 7, 0, 0),
  elapsedMs: 1754321,
  attemptNumber: 1,
});

/**
 * Marks a sheet with the page's own functions (buildResults + buildReportText + getReportFilename)
 * on a fixed attempt, and returns the result as plain data. Works on the published page and on
 * the original alike.
 */
export function gradeSheet(page, sheet, meta = {}) {
  const m = { ...FIXED_META, ...meta };
  return JSON.parse(page.run(`(() => {
    attempt = {
      version: 1, id: "fixed-attempt", name: ${JSON.stringify(m.name)},
      startedAt: ${m.startedAt}, submittedAt: ${m.startedAt + m.elapsedMs},
      answers: ${JSON.stringify(sheet.answers)}, lastQuestion: 0,
      attemptNumber: ${m.attemptNumber}, reportFilename: null
    };
    resultData = buildResults();
    const d = resultData;
    return JSON.stringify({
      score: d.score, percentage: d.percentage, correct: d.correct, incorrect: d.incorrect, partial: d.partial,
      duration: d.duration, durationText: d.durationText, rank: d.rank,
      best: d.best.lesson.number, weakest: d.weakest.lesson.number,
      lessonRows: d.lessonRows.map(row => ({ lesson: row.lesson.number, name: row.lesson.name, earned: row.earned, possible: row.possible, percent: row.percent, questions: row.items.map(q => q.id) })),
      graded: d.graded.map(q => ({ id: q.id, lesson: q.lesson, type: q.type, marks: q.marks, max: q.max, status: q.status, givenText: q.givenText, correctText: q.correctText, originalText: q.originalText, explanation: q.explanation, ref: q.ref })),
      answered: QUESTIONS.filter(isAnswered).map(q => q.id),
      report: buildReportText(),
      file: getReportFilename()
    });
  })()`));
}

/** Marks of one question for one answer, by the page's gradeQuestion(). */
export function gradeOne(page, questionId, answer) {
  return page.run(`gradeQuestion(QUESTIONS.find(q => q.id === ${questionId}), ${answer === undefined ? "undefined" : JSON.stringify(answer)})`);
}

/* ------------------------------------------------------------------ */
/* Driving the real interface (clicks and selections)                  */
/* ------------------------------------------------------------------ */
function change(page, select, value) {
  select.value = value;
  select.dispatchEvent(new page.window.Event("change", { bubbles: true }));
}

/** Answers the question now on screen through its own controls, as a student would. */
export function answerInUi(page, q, answer) {
  const stage = () => page.document.querySelector("#questionStage");
  switch (q.type) {
    case "choice": {
      const button = [...stage().querySelectorAll(".option-btn")].find((el) => el.getAttribute("data-opt") === answer);
      if (!button) throw new Error("Q" + q.id + ": no option " + answer);
      button.click();
      break;
    }
    case "order":
      if (stage().querySelector("[data-remove]")) stage().querySelector("#clearOrderBtn").click();
      for (const token of answer) {
        const button = [...stage().querySelectorAll("[data-add]")].find((el) => el.getAttribute("data-add") === token);
        if (!button) throw new Error("Q" + q.id + ": no word block " + token);
        button.click();
      }
      break;
    case "labels":
      for (const i of Object.keys(answer)) change(page, stage().querySelector(`select[data-part="${i}"]`), answer[i]);
      break;
    case "match":
      for (const i of Object.keys(answer)) change(page, stage().querySelector(`select[data-match="${i}"]`), answer[i]);
      break;
    case "blanks":
      answer.forEach((value, i) => { if (value) change(page, stage().querySelector(`select[data-blank="${i}"]`), value); });
      break;
    default: throw new Error("unknown type " + q.type);
  }
}

/** Types the name and presses "Start". */
export function startInUi(page, name = "Mahmoud Test") {
  page.$("#candidateName").value = name;
  page.$("#startForm").dispatchEvent(new page.window.Event("submit", { bubbles: true, cancelable: true }));
}

/** Starts the examination and answers every question through the interface. Does not submit. */
export async function takeExamInUi(page, { name = "Mahmoud Test", answers, elapsedMs = 754000 } = {}) {
  const sheet = answers || sheetOf(page.questions, correctAnswer);
  startInUi(page, name);
  page.questions.forEach((q, index) => {
    if (sheet[q.id] !== undefined) answerInUi(page, q, sheet[q.id]);
    if (index < page.questions.length - 1) page.click("#nextBtn");
  });
  await page.clock.advance(elapsedMs);
}

/** Takes the whole examination through the interface, then presses "SUBMIT TEST". */
export async function submitExamInUi(page, options = {}) {
  await takeExamInUi(page, options);
  if (page.$("#submitBtn").disabled) throw new Error("the submit button is disabled");
  page.click("#submitBtn");
  await settle();
}

/** What the results screen says about delivery (published page only). */
export function sendStatus(page) {
  const box = page.$("#send-status");
  return {
    state: box.getAttribute("data-send-status"),
    visible: page.visible("#send-status"),
    text: page.text("#send-status-text"),
    resendVisible: page.visible("#resend-result-btn"),
  };
}

/* ------------------------------------------------------------------ */
/* Structure of the paper                                              */
/* ------------------------------------------------------------------ */
/**
 * The separately marked parts of a question, with the marks the page's gradeQuestion() gives each:
 * choice and order questions are one part worth 4; labels and blanks carry their own part marks;
 * the pairs of a matching question share its 4 marks equally.
 */
export function partsOf(q) {
  switch (q.type) {
    case "choice": return [{ prompt: q.stem || q.prompt || q.task, answer: q.answer, mark: 4 }];
    case "order": return [{ prompt: q.tokens.join(" / "), answer: q.answer.join(" "), mark: 4 }];
    case "labels": return q.parts.map((part) => ({ prompt: part.word, answer: part.answer, mark: part.mark }));
    case "match": return q.pairs.map((pair) => ({ prompt: pair.left, answer: pair.answer, mark: 4 / q.pairs.length }));
    case "blanks": return q.parts.map((part) => ({ prompt: (part.before + " ___ " + part.after).trim(), answer: part.answer, mark: part.mark }));
  }
  throw new Error("unknown type " + q.type);
}

/** What the results screen shows after a submission, as plain data. */
export function resultsSnapshot(page) {
  return {
    screen: page.screen(),
    name: page.text("#resultName"),
    score: page.text("#resultScore"),
    percent: page.text("#resultPercent"),
    date: page.text("#resultDate"),
    duration: page.text("#statDuration"),
    correct: page.text("#statCorrect"),
    incorrect: page.text("#statIncorrect"),
    marks: page.text("#statMarks"),
    rank: page.text("#performanceRank"),
    summaryIcon: page.text("#summaryIcon"),
    summaryTitle: page.text("#summaryTitle"),
    summaryText: page.text("#summaryText"),
    lessons: page.$$("#lessonBreakdown .lesson-score").map((el) => el.textContent.replace(/\s+/g, " ").trim()),
    review: page.$$("#reviewList .review-card").map((card) => ({
      id: card.id,
      status: card.querySelector(".review-status").textContent.trim(),
      marks: card.querySelector(".review-marks b").textContent.trim(),
      question: card.querySelector(".review-question").textContent.trim(),
      given: card.querySelectorAll(".ab-value")[0].textContent.trim(),
      correct: card.querySelectorAll(".ab-value")[1].textContent.trim(),
      explanation: card.querySelector(".review-explanation").textContent.replace(/\s+/g, " ").trim(),
    })),
  };
}

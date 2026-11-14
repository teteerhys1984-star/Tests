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
import { createHash } from "node:crypto";
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

/** sha256 of the uploaded file (english-foundation-assessment-development/index.html). */
export const ORIGINAL_SHA256 = "2f4bf22ec0e692fd3098e871399e0dc2628435b9e9c63651cbbff508df654a2c";

export const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const PENDING_PREFIX = "pending:" + EXAM_DIR_NAME + ":";
/** The page's own attempt store (unchanged from the original). */
export const STORAGE_KEY = "mira_lovely_challenge_v1";
export const TEACHER_PASSWORD = "somer173";

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
 * "Opens" the examination page and waits until the page has started itself. Passing the same
 * `storage` to a later call simulates opening the examination again on the same device.
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
    /** Runs code in the page's global scope (reaches QUESTIONS_DATA, state and the page's functions). */
    run: (code) => window.eval(code),
    /** Reads a page value as plain JSON data. */
    json: (expr) => JSON.parse(window.eval("JSON.stringify(" + expr + ")")),
    has: (name) => window.eval("typeof " + name + " !== 'undefined'"),
    $: (selector) => document.querySelector(selector),
    $$: (selector) => [...document.querySelectorAll(selector)],
    text: (selector) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error("no element: " + selector);
      return (el.textContent || "").replace(/\s+/g, " ").trim();
    },
    /** True when the element exists and neither it nor an ancestor is hidden. */
    visible: (selector) => {
      const target = document.querySelector(selector);
      if (!target) return false;
      for (let el = target; el; el = el.parentElement) {
        if (el.hidden) return false;
        if (el.classList && el.classList.contains("hidden")) return false;
      }
      return true;
    },
    screen: () => {
      const results = document.getElementById("results-screen");
      const assessment = document.getElementById("assessment-screen");
      if (results && !results.classList.contains("hidden")) return "results";
      if (assessment && !assessment.classList.contains("hidden")) return "assessment";
      return "welcome";
    },
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
  page.questions = page.json("QUESTIONS_DATA");
  return page;
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */
/*
 * The page stores one value per question in state.answers[question.id]:
 *   mcq                                    the chosen option index   2
 *   svo_tag                                { p1: "Subject", ... }   {p1:"Verb",...}
 *   multi_choice_pair / match_*            { item1: "an", ... }      {opp1:"small",...}
 *   scramble                               the words in the chosen order ["They","eat","apples"]
 */

/** The answer the examination's own key marks as fully correct. */
export function correctAnswer(q) {
  if (q.type === "mcq") return q.correctIndex;
  if (q.type === "scramble") return q.correctOrder.slice();
  if (q.type === "svo_tag") return Object.fromEntries(q.parts.map((part) => [part.key, part.correct]));
  if (q.subparts) return Object.fromEntries(q.subparts.map((part) => [part.key, part.correct]));
  throw new Error("unknown type " + q.type);
}

/** A complete answer that earns no mark. */
export function wrongAnswer(q) {
  if (q.type === "mcq") return (q.correctIndex + 1) % q.options.length;
  if (q.type === "scramble") return q.correctOrder.slice().reverse();
  if (q.type === "svo_tag") {
    const roles = q.roles.filter((role) => role !== "Subject");
    return Object.fromEntries(q.parts.map((part, i) => [part.key, roles[i % roles.length]]));
  }
  if (q.subparts) return Object.fromEntries(q.subparts.map((part) => [part.key, part.options.find((option) => option !== part.correct)]));
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
  if (q.type === "mcq") return Math.floor(random() * q.options.length);
  if (q.type === "scramble") {
    const order = shuffled(q.correctOrder, random);
    return gap() ? order.slice(0, Math.floor(random() * order.length)) : order;
  }
  if (q.type === "svo_tag") {
    const out = {};
    q.parts.forEach((part) => { if (!gap()) out[part.key] = random() < 0.5 ? part.correct : pick(q.roles, random); });
    return out;
  }
  if (q.subparts) {
    const out = {};
    q.subparts.forEach((part) => { if (!gap()) out[part.key] = random() < 0.5 ? part.correct : pick(part.options, random); });
    return out;
  }
  throw new Error("unknown type " + q.type);
}

/** Mirrors the page's isQuestionAnswered(): the page only lets a complete paper be submitted. */
export function isComplete(q, value) {
  if (value === undefined || value === null) return false;
  if (q.type === "mcq") return typeof value === "number";
  if (q.type === "scramble") return Array.isArray(value) && value.length === q.correctOrder.length;
  if (q.type === "svo_tag") return q.parts.every((part) => !!value[part.key]);
  if (q.subparts) return q.subparts.every((part) => !!value[part.key]);
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
export function makeSheets(questions, randomCount = 48) {
  const sheets = [
    { name: "all-correct", answers: sheetOf(questions, correctAnswer) },
    { name: "all-wrong", answers: sheetOf(questions, wrongAnswer) },
    { name: "blank", answers: {} },
  ];
  for (const q of questions) {
    sheets.push({ name: "only-q" + q.id + "-wrong", answers: sheetOf(questions, (item) => (item.id === q.id ? wrongAnswer(item) : correctAnswer(item))) });
    sheets.push({ name: "only-q" + q.id + "-blank", answers: sheetOf(questions, (item) => (item.id === q.id ? undefined : correctAnswer(item))) });
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
  if (q.type === "mcq") return [undefined, ...q.options.map((_, i) => i), 99, "x"];
  if (q.type === "scramble") {
    const out = [undefined, []];
    const walk = (prefix, rest) => {
      for (const token of rest) {
        const next = prefix.concat([token]);
        out.push(next);
        walk(next, rest.filter((item) => item !== token));
      }
    };
    walk([], q.correctOrder);
    return out;
  }
  if (q.type === "svo_tag") {
    const combos = product(Array.from({ length: q.parts.length }, () => [null, ...q.roles]));
    return [undefined, ...combos.map((combo) => Object.fromEntries(combo.map((value, i) => [q.parts[i].key, value]).filter(([, value]) => value !== null)))];
  }
  if (q.subparts) {
    const combos = product(q.subparts.map((part) => [null, ...part.options]));
    return [undefined, ...combos.map((combo) => Object.fromEntries(combo.map((value, i) => [q.subparts[i].key, value]).filter(([, value]) => value !== null)))];
  }
  throw new Error("unknown type " + q.type);
}

/* ------------------------------------------------------------------ */
/* Marking a sheet with the page's own engine                          */
/* ------------------------------------------------------------------ */
export const FIXED_META = Object.freeze({
  name: "Mira Test",
  startedAt: Date.UTC(2026, 10, 14, 7, 0, 0),
  elapsedMs: 1754321,
});

/**
 * Marks a sheet with the page's own functions (evaluateStudent + downloadTxtReport) on a fixed
 * attempt, and returns the result as plain data. Works on the published page and on the
 * original alike.
 */
export async function gradeSheet(page, sheet, meta = {}) {
  const m = { ...FIXED_META, ...meta };
  const result = JSON.parse(page.run(`(() => {
    state = {
      studentName: ${JSON.stringify(m.name)}, started: true, submitted: true,
      startTime: ${m.startedAt}, submissionTime: ${m.startedAt + m.elapsedMs},
      currentQ: 1, answers: ${JSON.stringify(sheet.answers)}, scrambleState: {}, delivery: null
    };
    const d = evaluateStudent();
    return JSON.stringify({
      score: d.score, percentage: d.percentage, correct: d.correctCount, incorrect: d.incorrectCount,
      durationText: formatDuration(${m.elapsedMs}),
      lessonStats: d.lessonStats,
      reviews: d.reviews,
      answered: QUESTIONS_DATA.filter(q => isQuestionAnswered(q.id)).map(q => q.id)
    });
  })()`));
  page.downloads.length = 0;
  page.run("downloadTxtReport(true)");
  const report = await page.downloadText();
  result.reportSha256 = sha256(report);
  result.report = report;
  result.file = page.downloads[0] ? page.downloads[0].name : null;
  return result;
}

/** Marks of one question for one answer, by the page's evaluateStudent(). */
export function gradeOne(page, questionId, answer) {
  return page.run(`(() => {
    state = { studentName: "Test", started: true, submitted: true, startTime: 0, submissionTime: 1,
      currentQ: 1, answers: { ${questionId}: ${answer === undefined ? "undefined" : JSON.stringify(answer)} }, scrambleState: {}, delivery: null };
    const review = evaluateStudent().reviews.find(item => item.qId === ${questionId});
    return review ? review.earned : -1;
  })()`);
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/* ------------------------------------------------------------------ */
/* Driving the real interface (clicks and selections)                  */
/* ------------------------------------------------------------------ */
const squash = (value) => String(value).replace(/\s+/g, " ").trim();

function buttons(container) {
  return [...container.querySelectorAll("button")];
}

/** Answers the question now on screen through its own controls, as a student would. */
export function answerInUi(page, q, answer) {
  const stage = () => page.$("#q-interactive-body");
  if (q.type === "mcq") {
    const button = buttons(stage()).find((item) => [...item.querySelectorAll("span")].some((span) => squash(span.textContent) === String(q.options[answer])));
    if (!button) throw new Error("Q" + q.id + ": no option " + answer);
    button.click();
    return;
  }
  if (q.type === "scramble") {
    for (const word of answer) {
      const button = buttons(stage()).find((item) => squash(item.textContent) === word && /bg-white/.test(item.className));
      if (!button) throw new Error("Q" + q.id + ": no word block " + word);
      button.click();
    }
    return;
  }
  if (q.type === "svo_tag") {
    for (const part of q.parts) {
      const chosen = answer[part.key];
      if (!chosen) continue;
      const cards = [...stage().querySelectorAll(".grid > div")];
      const card = cards.find((item) => squash(item.textContent).includes(part.word));
      if (!card) throw new Error("Q" + q.id + ": no card " + part.word);
      const button = buttons(card).find((item) => squash(item.textContent).split(" ")[0] === chosen);
      if (!button) throw new Error("Q" + q.id + ": no role " + chosen);
      button.click();
    }
    return;
  }
  if (q.subparts) {
    for (const part of q.subparts) {
      const chosen = answer[part.key];
      if (!chosen) continue;
      const stem = part.stem || part.word || part.pronoun;
      const cards = [...stage().querySelectorAll(".grid > div")];
      const card = cards.find((item) => squash(item.textContent).includes(stem));
      if (!card) throw new Error("Q" + q.id + ": no card " + stem);
      const button = buttons(card).find((item) => squash(item.textContent).replace("✓", "").trim() === chosen);
      if (!button) throw new Error("Q" + q.id + ": no option " + chosen);
      button.click();
    }
    return;
  }
  throw new Error("unknown type " + q.type);
}

/** Types the name and presses "Start Challenge". */
export function startInUi(page, name = "Mira Test") {
  page.$("#student-name-input").value = name;
  page.click("#btn-start");
}

/** Starts the examination and answers every question through the interface. Does not submit. */
export async function takeExamInUi(page, { name = "Mira Test", answers, elapsedMs = 754000 } = {}) {
  const sheet = answers || sheetOf(page.questions, correctAnswer);
  startInUi(page, name);
  page.questions.forEach((q, index) => {
    if (sheet[q.id] !== undefined) answerInUi(page, q, sheet[q.id]);
    if (index < page.questions.length - 1) page.click("#btn-next-q");
  });
  await page.clock.advance(elapsedMs);
}

/** Takes the whole examination through the interface, then presses "تسليم الاختبار". */
export async function submitExamInUi(page, options = {}) {
  await takeExamInUi(page, options);
  if (page.$("#btn-submit-exam").disabled) throw new Error("the submit button is disabled");
  page.click("#btn-submit-exam");
  await settle();
}

/** What the results screen says about delivery. */
export function sendStatus(page) {
  const box = page.$("#send-status");
  return {
    state: box.getAttribute("data-send-status"),
    visible: page.visible("#send-status"),
    text: page.text("#send-status-text"),
    arabic: page.text("#send-status-text-ar"),
    resendVisible: page.visible("#resend-result-btn"),
  };
}

/* ------------------------------------------------------------------ */
/* Structure of the paper                                              */
/* ------------------------------------------------------------------ */
/**
 * The separately marked parts of a question, with the marks evaluateStudent() gives each:
 * mcq and scramble questions are one part worth 4; svo_tag has three parts (4/3 each);
 * the two subparts of the pair and matching questions carry 2 each.
 */
export function partsOf(q) {
  if (q.type === "mcq") return [{ prompt: q.prompt, answer: q.options[q.correctIndex], mark: 4 }];
  if (q.type === "scramble") return [{ prompt: q.prompt, answer: q.correctOrder.join(" "), mark: 4 }];
  if (q.type === "svo_tag") return q.parts.map((part) => ({ prompt: part.word, answer: part.correct, mark: 4 / q.parts.length }));
  if (q.subparts) return q.subparts.map((part) => ({ prompt: part.stem || part.word || part.pronoun, answer: part.correct, mark: 4 / q.subparts.length }));
  throw new Error("unknown type " + q.type);
}

/** What the results screen shows after a submission, as plain data. */
export function resultsSnapshot(page) {
  return {
    screen: page.screen(),
    name: page.text("#res-student-name"),
    score: page.text("#res-score-marks"),
    percent: page.text("#res-score-pct"),
    duration: page.text("#res-duration"),
    level: page.$("#res-performance-level") ? page.text("#res-performance-level") : null,
    encouragement: page.text("#res-encouragement-box"),
    headerStopwatch: page.text("#stopwatch-display"),
    lessons: page.$$("#lesson-breakdown-grid > div").map((el) => squash(el.textContent)),
    review: page.$$("#detailed-review-list > div").map((el) => squash(el.textContent)),
  };
}

/** The teacher's key screen, as plain data. */
export function teacherKeySnapshot(page) {
  page.click("button[onclick='openTeacherModal()']");
  page.$("#teacher-password-input").value = TEACHER_PASSWORD;
  page.click("button[onclick='verifyTeacherPassword()']");
  const cards = page.$$("#teacher-answers-list > div");
  return {
    count: cards.length,
    answers: cards.map((card) => squash(card.textContent)),
  };
}

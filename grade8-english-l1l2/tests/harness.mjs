/**
 * Test harness for the single-file examination (no dependencies, Node >= 20).
 *
 * It loads an examination HTML file, builds a small stand-in for the browser
 * (static elements, localStorage, fetch, timers, clock, downloads) and runs the
 * page's own inline <script> blocks unchanged inside a `vm` context. Tests then
 * drive the real page code: start an attempt, record answers, submit, reload.
 *
 * Nothing here talks to the network: `fetch` is always a test double, and time
 * is virtual (the 2 s / 5 s retry waits and the 30 s timeout never really elapse).
 */
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const EXAM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EXAM_DIR_NAME = path.basename(EXAM_DIR);
export const SOURCE_HTML = path.join(EXAM_DIR, "grade8-english-L1L2.html");
export const DIST_HTML = path.join(EXAM_DIR, "dist", "index.html");

/** Lets pending promise callbacks (inside and outside the vm context) run. */
export async function settle(rounds = 8) {
  for (let i = 0; i < rounds; i++) await new Promise(resolve => setImmediate(resolve));
}

/* ------------------------------------------------------------------ */
/* Virtual clock                                                       */
/* ------------------------------------------------------------------ */
export class Clock {
  constructor(startMs = Date.UTC(2026, 10, 11, 7, 0, 5, 250)) {
    this.now = startMs;
    this.timers = [];
    this.nextId = 1;
    /** Every delay requested through setTimeout, in order (used to assert 2000 / 5000 / 30000). */
    this.requested = [];
  }
  setTimeout(fn, ms) {
    const delay = Math.max(0, Number(ms) || 0);
    const timer = { id: this.nextId++, at: this.now + delay, fn, every: null };
    this.timers.push(timer);
    this.requested.push(delay);
    return timer.id;
  }
  setInterval(fn, ms) {
    const every = Math.max(1, Number(ms) || 1);
    const timer = { id: this.nextId++, at: this.now + every, fn, every };
    this.timers.push(timer);
    return timer.id;
  }
  clear(id) {
    this.timers = this.timers.filter(timer => timer.id !== id);
  }
  /** Moves time forward, firing due timers in order and letting promises settle after each. */
  async advance(ms) {
    const end = this.now + ms;
    await settle();
    for (;;) {
      const due = this.timers.filter(timer => timer.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      this.now = Math.max(this.now, due.at);
      if (due.every) due.at += due.every;
      else this.clear(due.id);
      try { due.fn(); } catch (error) { /* a page timer must not break the harness */ }
      await settle();
    }
    this.now = end;
    await settle();
  }
  /** Delays still waiting to fire (one-shot timers only). */
  pendingDelays() {
    return this.timers.filter(timer => !timer.every).map(timer => timer.at - this.now).sort((a, b) => a - b);
  }
}

/* ------------------------------------------------------------------ */
/* localStorage stand-in (shared across "page loads" by passing it in) */
/* ------------------------------------------------------------------ */
export class FakeStorage {
  constructor() {
    this.map = new Map();
    /** When true, every call throws (private mode / storage disabled). */
    this.broken = false;
    /** When true, only writes throw (quota exceeded). */
    this.readOnly = false;
  }
  guard(write) {
    if (this.broken || (write && this.readOnly)) throw new Error("storage unavailable");
  }
  get length() { this.guard(false); return this.map.size; }
  key(index) { this.guard(false); return Array.from(this.map.keys())[index] ?? null; }
  getItem(key) { this.guard(false); return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.guard(true); this.map.set(String(key), String(value)); }
  removeItem(key) { this.guard(true); this.map.delete(String(key)); }
  clear() { this.map.clear(); }
  keys() { return Array.from(this.map.keys()); }
}

/* ------------------------------------------------------------------ */
/* Minimal DOM                                                         */
/* ------------------------------------------------------------------ */
class FakeClassList {
  constructor(initial) { this.set = new Set(String(initial || "").split(/\s+/).filter(Boolean)); }
  add(...names) { names.forEach(name => this.set.add(name)); }
  remove(...names) { names.forEach(name => this.set.delete(name)); }
  contains(name) { return this.set.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.set.has(name) : Boolean(force);
    if (on) this.set.add(name); else this.set.delete(name);
    return on;
  }
}

class FakeEventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this.listeners.get(type);
    if (list) this.listeners.set(type, list.filter(item => item !== fn));
  }
  /** Fires the listeners registered by the page. Returns how many ran. */
  dispatch(type, props = {}) {
    const event = Object.assign({ type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }, props);
    const list = (this.listeners.get(type) || []).slice();
    list.forEach(fn => fn.call(this, event));
    return list.length;
  }
}

class FakeElement extends FakeEventTarget {
  constructor(tagName, attrs = {}, host = null) {
    super();
    this.tagName = String(tagName).toUpperCase();
    this.attrs = Object.assign({}, attrs);
    this.host = host;
    this.id = attrs.id || "";
    this.classList = new FakeClassList(attrs.class);
    this.hidden = Object.prototype.hasOwnProperty.call(attrs, "hidden");
    this.disabled = Object.prototype.hasOwnProperty.call(attrs, "disabled");
    this.value = attrs.value || "";
    this.style = {};
    this.children = [];
    this.offsetParent = {};
    this._text = "";
    this._html = "";
  }
  get textContent() { return this._text; }
  set textContent(value) { this._text = String(value == null ? "" : value); this._html = this._text; }
  get innerHTML() { return this._html; }
  set innerHTML(value) { this._html = String(value == null ? "" : value); this._text = this._html.replace(/<[^>]*>/g, ""); }
  setAttribute(name, value) { this.attrs[name] = String(value); if (name === "hidden") this.hidden = true; }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; }
  removeAttribute(name) { delete this.attrs[name]; if (name === "hidden") this.hidden = false; }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name); }
  appendChild(child) { this.children.push(child); return child; }
  remove() {}
  focus() { if (this.host) this.host.document.activeElement = this; }
  select() {}
  scrollIntoView() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
  closest() { return null; }
  click() {
    if (this.tagName === "A" && this.download !== undefined && this.host) {
      this.host.downloads.push({ filename: this.download, href: this.href, blob: this.host.blobs.get(this.href) || null });
    }
    return this.dispatch("click");
  }
}

function parseAttributes(source) {
  const attrs = {};
  const pattern = /([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(source))) attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  return attrs;
}

/** Splits an HTML document into its inline scripts and the static elements of its markup. */
export function parseExamHtml(html) {
  const scripts = [];
  const externalScripts = [];
  const markup = html
    .replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrSource, code) => {
      const attrs = parseAttributes(attrSource);
      if (attrs.src) externalScripts.push(attrs.src);
      else scripts.push(code);
      return "";
    })
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const elements = [];
  const tagPattern = /<([a-zA-Z][\w-]*)((?:\s+[^<>]*)?)\s*\/?>/g;
  let match;
  while ((match = tagPattern.exec(markup))) elements.push({ tag: match[1], attrs: parseAttributes(match[2] || "") });
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
  return { scripts, externalScripts, elements, markup, title: title.trim() };
}

/** Text a reader would see in the static markup (tags removed, entities for &amp; restored). */
export function visibleText(markup) {
  return markup.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/* Page loader                                                         */
/* ------------------------------------------------------------------ */
/**
 * Loads the examination page.
 * @param {object} options
 *   file      path of the HTML file (default: the source file)
 *   storage   FakeStorage to reuse (pass the same one to simulate a reload); null = no localStorage at all
 *   clock     Clock to reuse across reloads
 *   fetch     test double for window.fetch; omitted = a fetch that always rejects and counts calls
 *   crypto    object used as window.crypto (default: Node's Web Crypto); null = none
 */
export function loadExam(options = {}) {
  const file = options.file || SOURCE_HTML;
  const html = readFileSync(file, "utf8");
  const parsed = parseExamHtml(html);
  const clock = options.clock || new Clock();
  const storage = options.storage === undefined ? new FakeStorage() : options.storage;
  const host = { downloads: [], blobs: new Map(), consoleCalls: [], unexpectedFetches: 0, document: null };

  const byId = new Map();
  const all = [];
  for (const { tag, attrs } of parsed.elements) {
    const element = new FakeElement(tag, attrs, host);
    all.push(element);
    if (attrs.id && !byId.has(attrs.id)) byId.set(attrs.id, element);
  }

  const select = selector => {
    const simple = String(selector).trim();
    if (/^\.[\w-]+$/.test(simple)) return all.filter(element => element.classList.contains(simple.slice(1)));
    if (/^\[[\w-]+\]$/.test(simple)) return all.filter(element => element.hasAttribute(simple.slice(1, -1)));
    if (/^#[\w-]+$/.test(simple)) return byId.has(simple.slice(1)) ? [byId.get(simple.slice(1))] : [];
    return [];
  };

  const document = new FakeEventTarget();
  Object.assign(document, {
    readyState: "loading",
    visibilityState: "visible",
    title: parsed.title,
    body: new FakeElement("body", {}, host),
    activeElement: null,
    getElementById: id => byId.get(String(id)) || null,
    querySelectorAll: selector => select(selector),
    querySelector: selector => select(selector)[0] || null,
    createElement: tag => new FakeElement(tag, {}, host),
  });
  document.activeElement = document.body;
  host.document = document;

  const windowTarget = new FakeEventTarget();
  const record = level => (...args) => { host.consoleCalls.push({ level, text: args.map(arg => { try { return typeof arg === "string" ? arg : JSON.stringify(arg); } catch (error) { return String(arg); } }).join(" ") }); };
  const defaultFetch = () => { host.unexpectedFetches += 1; return Promise.reject(new Error("network is disabled in tests")); };

  const sandbox = {
    document,
    console: { log: record("log"), info: record("info"), warn: record("warn"), error: record("error"), debug: record("debug") },
    navigator: { userAgent: "exam-test-harness" },
    fetch: options.fetch || defaultFetch,
    AbortController,
    Blob,
    crypto: options.crypto === undefined ? webcrypto : options.crypto || undefined,
    URL: {
      createObjectURL(blob) { const url = "blob:test/" + (host.blobs.size + 1); host.blobs.set(url, blob); return url; },
      revokeObjectURL() {},
    },
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: id => clock.clear(id),
    setInterval: (fn, ms) => clock.setInterval(fn, ms),
    clearInterval: id => clock.clear(id),
    requestAnimationFrame: fn => clock.setTimeout(fn, 16),
    scrollTo() {},
    addEventListener: (type, fn) => windowTarget.addEventListener(type, fn),
    removeEventListener: (type, fn) => windowTarget.removeEventListener(type, fn),
    __clock: clock,
  };
  if (storage) sandbox.localStorage = storage;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  // `new Date()` and `Date.now()` follow the virtual clock inside the page.
  vm.runInContext(`(() => {
    const RealDate = Date;
    const clock = __clock;
    class PageDate extends RealDate {
      constructor(...args) { if (args.length === 0) super(clock.now); else super(...args); }
      static now() { return clock.now; }
    }
    globalThis.Date = PageDate;
  })();`, context);

  parsed.scripts.forEach((code, index) => {
    new vm.Script(code, { filename: path.basename(file) + "#inline-script-" + (index + 1) }).runInContext(context);
  });
  document.readyState = "complete";
  document.dispatch("DOMContentLoaded");

  const run = code => vm.runInContext(code, context);
  /** Reads a page value as plain JSON data (objects created in the page belong to another realm). */
  const json = code => { const text = run("JSON.stringify(" + code + ")"); return text === undefined ? undefined : JSON.parse(text); };
  const call = (fn, ...args) => json(fn + "(" + args.map(arg => JSON.stringify(arg)).join(",") + ")");

  return {
    file, html, parsed, clock, storage, host, document, context, run, json, call,
    window: windowTarget,
    el: id => byId.get(id) || null,
    /** Types a name into the admission form and submits it (the page's own handler starts the attempt). */
    start(name) {
      byId.get("candidate-name").value = name;
      byId.get("start-form").dispatch("submit");
    },
    /** Records answers through the same function the page's input handlers call. */
    answer(answers) {
      for (const [partId, value] of Object.entries(answers)) call("recordAnswer", partId, value);
    },
    /** Clicks a "Submit Exam" button (the page's own click handler performs the submission). */
    submit() {
      const button = select(".js-submit")[0];
      return button.click();
    },
    /** The page's persisted attempt state as plain data. */
    state() { return json("state"); },
    /** Simulates the tab being hidden or closed. */
    async leavePage() {
      document.visibilityState = "hidden";
      document.dispatch("visibilitychange");
      windowTarget.dispatch("pagehide");
      await settle();
    },
    /** Exact bytes of a file the page asked the browser to download (default: the latest). */
    async downloadedBytes(index = -1) {
      const item = host.downloads.at(index);
      return item && item.blob ? Buffer.from(await item.blob.arrayBuffer()) : null;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Deterministic answer sheets                                         */
/* ------------------------------------------------------------------ */
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

const SHORT_PARAGRAPH = "My school is good. I like it.";
const MEDIUM_PARAGRAPH = "My ideal school is modern and practical. The teachers help every student. We use technology and the Internet in the classroom. I like learning new subjects but I do not like noisy rooms.";
const UNPUNCTUATED_PARAGRAPH = "my ideal school has computers and a big library and students learn there every day with friends";

/** The answer the examination's own key marks as correct for a part. */
export function modelAnswer(part) {
  if (part.type === "mc" || part.type === "tf") return part.correct;
  if (part.validator === "joining") return part.requiredTokens.join(" " + part.requiredConjunction + " ");
  if (part.validator === "rubric") return part.model;
  return part.primary || part.accepted[0];
}

function wrongAnswer(part) {
  if (part.type === "mc" || part.type === "tf") return part.options.find(option => option.id !== part.correct).id;
  if (part.validator === "joining") return part.requiredTokens.join(" ");
  if (part.validator === "rubric") return SHORT_PARAGRAPH;
  return "zzz not the answer";
}

function variantAnswer(part, random) {
  if (part.type === "mc" || part.type === "tf") return part.options[Math.floor(random() * part.options.length)].id;
  if (part.validator === "joining") {
    const choices = [
      modelAnswer(part),
      part.requiredTokens.join(" " + part.requiredConjunction.toUpperCase() + " ") + ".",
      part.requiredTokens[0] + " " + part.requiredConjunction + " something else",
      part.requiredTokens.slice().reverse().join(", "),
    ];
    return choices[Math.floor(random() * choices.length)];
  }
  if (part.validator === "rubric") {
    const choices = [part.model, SHORT_PARAGRAPH, MEDIUM_PARAGRAPH, UNPUNCTUATED_PARAGRAPH, MEDIUM_PARAGRAPH + " " + MEDIUM_PARAGRAPH];
    return choices[Math.floor(random() * choices.length)];
  }
  const accepted = (part.accepted || []).concat(part.primary ? [part.primary] : []);
  const pick = accepted[Math.floor(random() * accepted.length)];
  const choices = [pick, "  " + pick.toUpperCase() + ".  ", pick.replace(/'/g, "’") + "!", pick + " extra", pick.slice(0, Math.max(1, pick.length - 1))];
  return choices[Math.floor(random() * choices.length)];
}

/**
 * Builds the fixed set of answer sheets used to compare marking before and after a change:
 * all-correct, all-wrong, blank, then a seeded random mix of correct answers, accepted
 * alternatives, case and punctuation variants, wrong answers and blanks for every part.
 * The same input always produces the same sheets.
 */
export function makeAnswerSheets(questions, randomSheets = 60) {
  const parts = questions.flatMap(question => question.parts);
  const sheets = [];
  sheets.push({ name: "all-correct", answers: Object.fromEntries(parts.map(part => [part.id, modelAnswer(part)])) });
  sheets.push({ name: "all-wrong", answers: Object.fromEntries(parts.map(part => [part.id, wrongAnswer(part)])) });
  sheets.push({ name: "blank", answers: {} });
  const random = mulberry32(20261111);
  for (let i = 0; i < randomSheets; i++) {
    const answers = {};
    for (const part of parts) {
      const roll = random();
      if (roll < 0.08) continue; // unanswered
      if (roll < 0.45) answers[part.id] = modelAnswer(part);
      else if (roll < 0.62) answers[part.id] = wrongAnswer(part);
      else answers[part.id] = variantAnswer(part, random);
    }
    sheets.push({ name: "random-" + String(i + 1).padStart(2, "0"), answers });
  }
  return sheets;
}

/** Compact, comparable form of the page's `gradeAttempt` result (everything except the grading timestamp). */
export function gradingFingerprint(result) {
  const copy = JSON.parse(JSON.stringify(result));
  delete copy.gradedAtISO;
  return copy;
}

/* ------------------------------------------------------------------ */
/* Helpers shared by the tests                                         */
/* ------------------------------------------------------------------ */

/** Fills every unanswered part with a wrong answer (the page only allows submission when all parts are answered). */
export function completeSheet(questions, answers) {
  const complete = Object.assign({}, answers);
  for (const part of questions.flatMap(question => question.parts)) {
    if (typeof complete[part.id] !== "string" || !complete[part.id].trim()) complete[part.id] = wrongAnswer(part);
  }
  return complete;
}

/** Takes the examination from the welcome screen to the results screen through the page's own handlers. */
export async function takeExam(page, { name = "Test Student", answers, elapsedMs = 754000 } = {}) {
  const questions = page.json("QUESTIONS");
  page.start(name);
  page.answer(completeSheet(questions, answers || makeAnswerSheets(questions)[0].answers));
  await page.clock.advance(elapsedMs);
  page.submit();
  await settle();
  return page;
}

/**
 * Stand-in for the teacher's Apps Script web app. Each request takes the next mode from `plan`
 * (then `fallback`):
 *   "ok"         stores the row; an attemptId it already has is answered with duplicate:true
 *   "offline"    network error
 *   "html"       a reply that is not JSON (sign-in page, error page)
 *   "refused"    {"ok":false,...}
 *   "lost-reply" stores the row, but the reply never reaches the page
 *   "hang"       never answers; rejects only when the page aborts the request
 *   "held"       answers when the test calls release()
 */
export class FakeServer {
  constructor({ plan = [], fallback = "ok" } = {}) {
    this.plan = plan.slice();
    this.fallback = fallback;
    this.requests = [];
    this.rows = new Map();
    this.aborted = 0;
    this.held = [];
    this.fetch = (url, init) => this.handle(url, init);
  }
  store(body) {
    const id = body && body.attemptId;
    if (this.rows.has(id)) return '{"ok":true,"duplicate":true}';
    this.rows.set(id, body);
    return '{"ok":true}';
  }
  handle(url, init) {
    const mode = this.plan.length ? this.plan.shift() : this.fallback;
    let body = null;
    try { body = JSON.parse(init.body); } catch (error) { body = null; }
    this.requests.push({ url, init, mode, body });
    const reply = text => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(text) });
    switch (mode) {
      case "ok": return reply(this.store(body));
      case "offline": return Promise.reject(new TypeError("Failed to fetch"));
      case "html": return reply("<!DOCTYPE html><html><body>Sign in</body></html>");
      case "refused": return reply('{"ok":false,"error":"refused"}');
      case "lost-reply": this.store(body); return Promise.reject(new TypeError("Failed to fetch"));
      case "hang":
        return new Promise((resolve, reject) => {
          if (init.signal) init.signal.addEventListener("abort", () => { this.aborted += 1; reject(new Error("aborted")); });
        });
      case "held":
        return new Promise(resolve => { this.held.push(() => resolve({ ok: true, status: 200, text: () => Promise.resolve(this.store(body)) })); });
      default: throw new Error("Unknown server mode: " + mode);
    }
  }
  async release() {
    this.held.splice(0).forEach(answer => answer());
    await settle();
  }
  /** attemptIds of every request, in order. */
  ids() { return this.requests.map(request => request.body && request.body.attemptId); }
}

/** What the results screen says about delivery. */
export function sendStatus(page) {
  const box = page.el("send-status");
  return {
    status: box.getAttribute("data-send-status"),
    visible: !box.hidden,
    text: page.el("send-status-text").textContent,
    arabic: page.el("send-status-text-ar").textContent,
    resendVisible: !box.hidden && !page.el("resend-result-btn").hidden,
  };
}

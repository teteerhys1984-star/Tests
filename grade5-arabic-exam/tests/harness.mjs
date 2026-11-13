/**
 * عدّة الاختبار: تحمّل صفحة الاختبار (الجديدة أو النسخة الأصلية المحفوظة) داخل jsdom
 * وتشغّل سكربت الصفحة نفسه دون تعديل، مع بدائل مضبوطة لما يحيط به:
 *   · ساعة افتراضية (setTimeout / setInterval / Date.now) — فلا تمرّ فعلياً فواصل 2 و5 ثوانٍ ولا مهلة 30 ثانية؛
 *   · localStorage بديل يمكن تمريره إلى «فتح» لاحق للصفحة؛
 *   · fetch بديل (خادم وهمي) — لا يتصل أي اختبار بالشبكة؛
 *   · Math.random ببذرة ثابتة، والتقاط ملفات التنزيل.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

export const EXAM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EXAM_DIR_NAME = path.basename(EXAM_DIR);
export const SOURCE_HTML = path.join(EXAM_DIR, "index.html");
export const ORIGINAL_HTML = path.join(EXAM_DIR, "tests", "fixtures", "original-exam.html");
export const DIST_HTML = path.join(EXAM_DIR, "dist", "index.html");

/** السطر الوحيد الذي تغيّر في تقرير TXT (نص الخصوصية). */
export const REPORT_LINE_ORIGINAL = "• أُنشئ هذا التقرير محلياً على جهاز الطالبة، ولم تُرسَل أي بيانات عبر الشبكة.";
export const REPORT_LINE_NEW = "• أُنشئ هذا التقرير محلياً على جهاز الطالبة، وتُرسَل النتيجة والإجابات أيضاً إلكترونياً إلى المعلّم عند التسليم.";

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
export class Clock {
  constructor(startMs = Date.UTC(2026, 10, 13, 7, 0, 5, 250)) {
    this.now = startMs;
    this.timers = [];
    this.nextId = 1;
  }
  setTimeout(fn, ms) {
    const t = { id: this.nextId++, at: this.now + Math.max(0, Number(ms) || 0), fn, every: null };
    this.timers.push(t);
    return t.id;
  }
  setInterval(fn, ms) {
    const every = Math.max(1, Number(ms) || 1);
    const t = { id: this.nextId++, at: this.now + every, fn, every };
    this.timers.push(t);
    return t.id;
  }
  clear(id) {
    this.timers = this.timers.filter((t) => t.id !== id);
  }
  /** يقدّم الزمن، ويشغّل المؤقتات المستحقة بالترتيب، ويترك الوعود تستقر بعد كل مؤقت. */
  async advance(ms) {
    const end = this.now + ms;
    await settle();
    for (;;) {
      const due = this.timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      this.now = Math.max(this.now, due.at);
      if (due.every) due.at += due.every;
      else this.clear(due.id);
      try { due.fn(); } catch { /* مؤقت في الصفحة لا يكسر العدّة */ }
      await settle();
    }
    this.now = end;
    await settle();
  }
}

/* ------------------------------------------------------------------ */
export class FakeStorage {
  constructor() {
    this.map = new Map();
    /** إن صارت true يرمي setItem خطأً (تخزين ممتلئ/محجوب). */
    this.failWrites = false;
  }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.has(String(k)) ? this.map.get(String(k)) : null; }
  setItem(k, v) {
    if (this.failWrites) throw new Error("QuotaExceededError");
    this.map.set(String(k), String(v));
  }
  removeItem(k) { this.map.delete(String(k)); }
  clear() { this.map.clear(); }
  keys(prefix = "") { return [...this.map.keys()].filter((k) => k.startsWith(prefix)); }
}

/* ------------------------------------------------------------------ */
/** خادم وهمي بديل عن Google Apps Script. يسجّل كل طلب ويردّ بحسب قائمة سلوكيات. */
export class FakeServer {
  /**
   * @param {string[]} script سلوك كل طلب بالترتيب: ok | duplicate | network | html | rejected | hang
   * @param {string} fallback السلوك بعد نفاد القائمة
   */
  constructor(script = [], fallback = "ok") {
    this.script = script.slice();
    this.fallback = fallback;
    this.requests = [];
    this.clock = null;
  }
  fetch = (url, init = {}) => {
    const mode = this.script.length ? this.script.shift() : this.fallback;
    const req = { url: String(url), init, mode, at: this.clock ? this.clock.now : 0, aborted: false };
    try { req.payload = JSON.parse(init.body); } catch { req.payload = null; }
    this.requests.push(req);
    const reply = (text) => Promise.resolve({ ok: true, status: 200, text: async () => text });
    switch (mode) {
      case "ok": return reply('{"ok":true}');
      case "duplicate": return reply('{"ok":false,"duplicate":true}');
      case "rejected": return reply('{"ok":false,"error":"bad token"}');
      case "html": return reply("<!DOCTYPE html><html><body>Service error</body></html>");
      case "network": return Promise.reject(new TypeError("Failed to fetch"));
      case "hang":
        return new Promise((_, reject) => {
          if (init.signal) {
            init.signal.addEventListener("abort", () => {
              req.aborted = true;
              reject(new Error("AbortError"));
            });
          }
        });
      default: throw new Error("unknown mode " + mode);
    }
  };
  get count() { return this.requests.length; }
  attemptIds() { return this.requests.map((r) => r.payload && r.payload.attemptId); }
}

/* ------------------------------------------------------------------ */
/**
 * «يفتح» صفحة الاختبار. تمرير storage نفسه إلى استدعاء لاحق يحاكي فتح الاختبار مرة أخرى على الجهاز نفسه.
 */
export function openExam({ file = SOURCE_HTML, storage = new FakeStorage(), server = new FakeServer(), clock = new Clock(), seed = 20261113, hash = "" } = {}) {
  const html = readFileSync(file, "utf8");
  server.clock = clock;
  const downloads = [];
  const consoleLines = [];
  const virtualConsole = new VirtualConsole();
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    virtualConsole.on(level, (...args) => consoleLines.push({ level, text: args.map(String).join(" ") }));
  }
  const pageErrors = [];
  virtualConsole.on("jsdomError", (e) => {
    if (!/Not implemented/i.test(String(e && e.message))) pageErrors.push(e);
  });
  const dom = new JSDOM(html, {
    url: "https://example.test/" + EXAM_DIR_NAME + "/" + hash,
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      const random = mulberry32(seed);
      window.Math.random = random;
      window.Date.now = () => clock.now;
      window.setTimeout = (fn, ms) => clock.setTimeout(fn, ms);
      window.clearTimeout = (id) => clock.clear(id);
      window.setInterval = (fn, ms) => clock.setInterval(fn, ms);
      window.clearInterval = (id) => clock.clear(id);
      window.requestAnimationFrame = (fn) => clock.setTimeout(() => fn(clock.now), 16);
      window.scrollTo = () => {};
      window.alert = () => {};
      window.fetch = server.fetch;
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
      window.URL.createObjectURL = (blob) => {
        downloads.push({ blob, name: null });
        return "blob:test/" + downloads.length;
      };
      window.URL.revokeObjectURL = () => {};
      // التقاط اسم الملف عند النقر على رابط التنزيل
      const realClick = window.HTMLAnchorElement.prototype.click;
      window.HTMLAnchorElement.prototype.click = function () {
        if (this.download && downloads.length) downloads[downloads.length - 1].name = this.download;
        else realClick.call(this);
      };
    },
  });
  const { window } = dom;
  const page = {
    dom, window, document: window.document, storage, server, clock, downloads, consoleLines, pageErrors,
    /** ينفّذ شيفرة في النطاق العام للصفحة (يصل إلى S و QUESTIONS وسائر تعريفاتها). */
    run: (code) => window.eval(code),
    json: (expr) => JSON.parse(window.eval("JSON.stringify(" + expr + ")")),
    $: (sel) => window.document.querySelector(sel),
    text: (sel) => (window.document.querySelector(sel).textContent || "").replace(/\s+/g, " ").trim(),
    visible: (sel) => {
      for (let el = window.document.querySelector(sel); el; el = el.parentElement) if (el.hidden) return false;
      return !!window.document.querySelector(sel);
    },
    click: (sel) => window.document.querySelector(sel).click(),
    async downloadText(i = -1) {
      const d = downloads.at(i);
      return d ? await d.blob.text() : null;
    },
    close: () => window.close(),
  };
  page.questions = page.json("QUESTIONS");
  return page;
}

/* ------------------------------------------------------------------ */
/* أوراق الإجابة                                                       */
/* ------------------------------------------------------------------ */
export const WRITE_TEXTS = [
  // q19: حوار كامل — q20: سؤالان مرتبطان بالموضوع
  "الأخ: السلام عليكم يا أختي، ما رأيك أن نزور حديقة المدينة غداً؟\nالأخت: أهلاً يا أخي، أرى أنها فكرة جميلة لكن أفضّل أن نذهب صباحاً.\nالأخ: أوافق، شكراً لك.",
  "ما المهنة التي تحلمين أن تعملي بها في المستقبل؟ كيف تستعدّين لتحقيق طموحك؟",
  "ما حلمك؟",
  "أحب الحديقة كثيراً وأريد الذهاب إليها مع أخي",
  "قال الأخ لأخته: هل نذهب؟ قالت: نعم",
  "لا أعرف الإجابة عن هذا السؤال أبداً",
  "هل تحبين مهنتك؟ وماذا عن المستقبل",
  "شكراً لو سمحت من فضلك مرحبا يا أخي ويا أختي: أظن أن رأيك جميل؟",
  "ااااااااااااااااااااااا",
];

export function correctAnswer(p) {
  switch (p.type) {
    case "choice": case "tf": return p.correct;
    case "multi": return p.ok.slice();
    case "fill": return p.accept[0];
    case "match": return Object.fromEntries(p.map.map((ri, li) => [li, ri]));
    case "classify": return Object.fromEntries(p.items.map((it, i) => [i, it.cat]));
    case "order": return p.items.map((_, i) => i);
    case "write": return p.marks === 6 ? WRITE_TEXTS[0] : WRITE_TEXTS[1];
  }
  throw new Error("unknown type " + p.type);
}

export function wrongAnswer(p) {
  switch (p.type) {
    case "choice": return (p.correct + 1) % p.opts.length;
    case "tf": return !p.correct;
    case "multi": return p.opts.map((_, i) => i).filter((i) => !p.ok.includes(i));
    case "fill": return "كلمة خاطئة";
    case "match": return Object.fromEntries(p.map.map((ri, li) => [li, p.map[(li + 1) % p.map.length]]));
    case "classify": return Object.fromEntries(p.items.map((it, i) => [i, (it.cat + 1) % p.cats.length]));
    case "order": return p.items.map((_, i) => (i + 1) % p.items.length);
    case "write": return "لا أعرف الإجابة عن هذا السؤال أبداً";
  }
  throw new Error("unknown type " + p.type);
}

function shuffled(arr, random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = (arr, random) => arr[Math.floor(random() * arr.length)];

/** إجابة عشوائية صالحة الشكل (قد تكون صحيحة أو خاطئة أو جزئية). */
export function variantAnswer(p, random) {
  switch (p.type) {
    case "choice": return Math.floor(random() * p.opts.length);
    case "tf": return random() < 0.5;
    case "multi": {
      const sel = p.opts.map((_, i) => i).filter(() => random() < 0.5);
      return shuffled(sel.length ? sel : [Math.floor(random() * p.opts.length)], random);
    }
    case "fill":
      return pick([
        ...p.accept, p.ans, p.alts, "ال" + p.accept[0], "  " + p.accept[0] + " . ", "«" + p.accept[0] + "»",
        p.accept[0].replace(/ا/g, "أ"), p.accept[0] + "ً", p.accept[0] + " " + p.accept[0], "خطأ", "   ", "؟",
      ], random);
    case "match": {
      const rights = shuffled(p.rights.map((_, i) => i), random);
      const out = {};
      p.lefts.forEach((_, li) => { if (random() < 0.85) out[li] = rights[li]; });
      return out;
    }
    case "classify": {
      const out = {};
      p.items.forEach((_, i) => { if (random() < 0.85) out[i] = Math.floor(random() * p.cats.length); });
      return out;
    }
    case "order": {
      const perm = shuffled(p.items.map((_, i) => i), random);
      return random() < 0.85 ? perm : perm.slice(0, Math.floor(random() * perm.length));
    }
    case "write": return pick(WRITE_TEXTS, random);
  }
  throw new Error("unknown type " + p.type);
}

export function sheetOf(questions, answerFor) {
  const answers = {};
  for (const q of questions) {
    for (const p of q.parts) {
      const a = answerFor(p, q);
      if (a !== undefined) (answers[q.id] ||= {})[p.id] = a;
    }
  }
  return answers;
}

/** مجموعة متنوعة: كل الصحيح، فارغ، كل الخاطئ، ثم أوراق مختلطة/جزئية عشوائية ببذرة ثابتة. */
export function makeSheets(questions, randomCount = 300) {
  const natural = questions.map((_, i) => i);
  const sheets = [
    { name: "all-correct", order: natural, answers: sheetOf(questions, correctAnswer) },
    { name: "all-empty", order: natural, answers: {} },
    { name: "all-wrong", order: natural, answers: sheetOf(questions, wrongAnswer) },
    { name: "all-correct-reversed-order", order: natural.slice().reverse(), answers: sheetOf(questions, correctAnswer) },
  ];
  const random = mulberry32(5150);
  for (let n = 0; n < randomCount; n++) {
    const bias = random();
    sheets.push({
      name: "mixed-" + (n + 1),
      order: shuffled(natural, random),
      answers: sheetOf(questions, (p) => {
        const r = random();
        if (r < 0.12) return undefined; // غير مُجاب
        if (r < 0.12 + 0.5 * bias) return correctAnswer(p);
        if (r < 0.75) return variantAnswer(p, random);
        return wrongAnswer(p);
      }),
    });
  }
  return sheets;
}

/**
 * يصحّح ورقة بمحرّك الصفحة نفسه (gradeAll + buildReport) بحالة مثبّتة، ويعيد النتيجة والتقرير.
 * يعمل على الصفحة الجديدة وعلى النسخة الأصلية سواءً.
 */
export function gradeSheet(page, sheet, meta = {}) {
  const m = { name: "سلمى أحمد العلي", startTs: Date.UTC(2026, 10, 13, 7, 0, 0), elapsed: 1754321, attemptId: "att-fixed-0001", ...meta };
  return JSON.parse(page.run(`(() => {
    S = freshState();
    S.attemptId = ${JSON.stringify(m.attemptId)};
    S.name = ${JSON.stringify(m.name)};
    S.order = ${JSON.stringify(sheet.order)};
    S.answers = ${JSON.stringify(sheet.answers)};
    S.startTs = ${m.startTs}; S.submitTs = ${m.startTs + m.elapsed}; S.elapsed = ${m.elapsed};
    S.status = "submitted";
    const result = gradeAll();
    S.result = result;
    S.report = buildReport(result);
    return JSON.stringify({ result, report: S.report, file: makeFileName(S.name), missing: missingCount() });
  })()`));
}

/* ------------------------------------------------------------------ */
/* قيادة الواجهة الحقيقية (نقرات وكتابة)                                */
/* ------------------------------------------------------------------ */
function fire(page, el, type) {
  el.dispatchEvent(new page.window.Event(type, { bubbles: true }));
}
const byText = (els, text) => {
  const hit = [...els].find((el) => el.textContent.trim() === text);
  if (!hit) throw new Error("no element with text: " + text);
  return hit;
};

/** يجيب عن جزء واحد معروض بالنقر/الكتابة كما تفعل الطالبة. */
export function answerPartInUi(page, partIndex, p, answer) {
  const sec = () => page.document.querySelectorAll("#q-parts > .part")[partIndex];
  switch (p.type) {
    case "choice": byText(sec().querySelectorAll(".opt"), p.opts[answer]).click(); break;
    case "tf": sec().querySelector(answer ? ".tf-btn.t" : ".tf-btn.f").click(); break;
    case "multi": for (const i of answer) byText(sec().querySelectorAll(".opt"), p.opts[i]).click(); break;
    case "fill": { const el = sec().querySelector("input.fill-in"); el.value = answer; fire(page, el, "input"); break; }
    case "write": { const el = sec().querySelector("textarea"); el.value = answer; fire(page, el, "input"); break; }
    case "match":
      for (const li of Object.keys(answer)) sec().querySelectorAll(".match-row")[+li].querySelectorAll(".chip")[answer[li]].click();
      break;
    case "classify":
      for (const i of Object.keys(answer)) {
        byText(sec().querySelectorAll(".pool .chip"), p.items[+i].t).click();
        sec().querySelectorAll(".cat-col")[answer[i]].click();
      }
      break;
    case "order": for (const ii of answer) byText(sec().querySelectorAll(".order-tray .chip"), p.items[ii]).click(); break;
    default: throw new Error("unknown type " + p.type);
  }
}

/** تبدأ الاختبار بالاسم ثم تجيب عن كل الأسئلة عبر الواجهة بحسب answerFor(p, q). لا تسلّم. */
export async function takeExamInUi(page, { name = "سلمى أحمد العلي", answerFor = correctAnswer, elapsedMs = 754000 } = {}) {
  const input = page.$("#in-name");
  input.value = name;
  page.click("#btn-start");
  const order = page.json("S.order");
  for (let pos = 0; pos < order.length; pos++) {
    const q = page.questions[order[pos]];
    q.parts.forEach((p, pi) => answerPartInUi(page, pi, p, answerFor(p, q)));
    if (pos < order.length - 1) page.click("#btn-next");
  }
  await page.clock.advance(elapsedMs);
}

/** تأخذ الاختبار كاملاً عبر الواجهة ثم تضغط «تسليم الاختبار». */
export async function submitExamInUi(page, options = {}) {
  await takeExamInUi(page, options);
  if (page.$("#btn-submit").disabled) throw new Error("submit button is disabled");
  page.click("#btn-submit");
  await settle();
}

export const sendText = (page) => page.text("#send-status-text");
export const PENDING_PREFIX = "pending:" + EXAM_DIR_NAME + ":";

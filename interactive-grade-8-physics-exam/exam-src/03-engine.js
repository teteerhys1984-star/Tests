/* ============================================================
   محرك الاختبار — الحالة، الحفظ، الشاشات، الأحداث
   ============================================================ */

/* ---------- الصوتيات المضمّنة (ملفّان WAV قصيران داخل الصفحة) ---------- */
const AUDIO_START = "data:audio/wav;base64,__AUDIO_START__";
const AUDIO_SUBMIT = "data:audio/wav;base64,__AUDIO_SUBMIT__";

function playSound(src) {
  try {
    if (typeof Audio === "undefined") return;
    const a = new Audio(src);
    a.volume = 0.6;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (e) { /* فشل الصوت لا يوقف الاختبار */ }
}

/* ---------- أيقونات SVG (نمط Lucide) ---------- */
const svgWrap = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICONS = {
  clock: svgWrap('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  play: svgWrap('<polygon points="6 3 20 12 6 21 6 3"/>'),
  download: svgWrap('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  lock: svgWrap('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  user: svgWrap('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  file: svgWrap('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
  retry: svgWrap('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
  prev: svgWrap('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),
  next: svgWrap('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
  alert: svgWrap('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  list: svgWrap('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  check: svgWrap('<polyline points="20 6 9 17 4 12"/>'),
  book: svgWrap('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  chat: svgWrap('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  target: svgWrap('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  shield: svgWrap('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  timer: svgWrap('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>'),
  pen: svgWrap('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
};
const icon = (name) => ICONS[name] || "";

/* ---------- أدوات مساعدة ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
};
const fmtDateTime = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};
const fmtMark = (n) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
};
function uuid() {
  try {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {}
  return "att-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
/* تطبيع الأرقام: يقبل الأرقام العربية والفارسية والفواصل والكسور والواحدات */
function parseNumericInput(raw, expectedUnit) {
  if (raw == null) return { ok: false, value: null };
  let s = String(raw).trim();
  if (!s) return { ok: false, value: null };
  const arDigits = "٠١٢٣٤٥٦٧٨٩", faDigits = "۰۱۲۳۴۵۶۷۸۹";
  s = s.replace(/[٠-٩]/g, (c) => String(arDigits.indexOf(c)))
       .replace(/[۰-۹]/g, (c) => String(faDigits.indexOf(c)));
  s = s.replace(/[٫،]/g, ".").replace(/,/g, ".");
  s = s.replace(/نيوتن|سنتيمتر|سم|سنتمتر|متر/g, " ").trim();
  let mult = 1;
  const lower = s.toLowerCase();
  if (expectedUnit === "cm") {
    if (/\bcm\b/.test(lower)) s = lower.replace(/\bcm\b/g, " ");
    else if (/\bmm\b/.test(lower)) { s = lower.replace(/\bmm\b/g, " "); mult = 0.1; }
    else if (/\bm\b/.test(lower)) { s = lower.replace(/\bm\b/g, " "); mult = 100; }
  } else if (expectedUnit === "N") {
    if (/\bn\b/.test(lower)) s = lower.replace(/\bn\b/g, " ");
  }
  s = s.trim();
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = parseFloat(frac[2]);
    if (den === 0) return { ok: false, value: null };
    return { ok: true, value: (parseFloat(frac[1]) / den) * mult };
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, value: null };
  return { ok: true, value: parseFloat(s) * mult };
}
const numericClose = (x, ans) => Math.abs(x - ans) <= Math.max(0.02, Math.abs(ans) * 1e-9);

/* ---------- الحالة والتخزين ---------- */
const STORE_KEY = "G8PHYS_U1L12_EXAM_ATTEMPT_V1";
const ARCHIVE_KEY = "G8PHYS_U1L12_EXAM_ARCHIVE_V1";
let storageFailed = false;
let S = null;

function freshState() {
  return {
    examId: EXAM.id, version: EXAM.version,
    attemptId: uuid(),
    studentName: "",
    status: "new",
    answers: {},
    current: 0,
    visited: Array(QUESTIONS.length).fill(false),
    questionOrder: QUESTIONS.map((q) => q.id),
    startedAt: null,
    submittedAt: null,
    results: null,
    report: null,
    startSoundPlayed: false,
    submitSoundPlayed: false,
    screen: "welcome",
  };
}
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
    storageFailed = false;
  } catch (e) {
    if (!storageFailed) { storageFailed = true; renderStorageWarning(); }
  }
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || obj.examId !== EXAM.id) return null;
    return obj;
  } catch (e) { storageFailed = true; return null; }
}
function renderStorageWarning() {
  if ($("#storage-warn")) return;
  const el = document.createElement("div");
  el.className = "storage-warn"; el.id = "storage-warn";
  el.innerHTML = `${icon("alert")}<span>تنبيه: تعذّر الحفظ التلقائي في هذا المتصفح؛ تابع الحل وأنجز الاختبار دون تحديث الصفحة أو إغلاقها.</span>`;
  document.body.prepend(el);
}
window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && S) saveState(); });
window.addEventListener("pagehide", () => { if (S) saveState(); });
window.addEventListener("beforeunload", () => { if (S) saveState(); });

/* ---------- تجميع معلومات الإجابة ---------- */
function allParts() {
  const list = [];
  QUESTIONS.forEach((q, qi) => q.parts.forEach((p, pi) => list.push({ q, qi, p, pi })));
  return list;
}
const TOTAL_PARTS = allParts().length;

function partAnswered(q, p) {
  const a = S.answers[p.id];
  if (a === undefined || a === null) return false;
  switch (p.type) {
    case "mcq": return typeof a === "number";
    case "tf": return a === true || a === false;
    case "multi": return Array.isArray(a) && a.length > 0;
    case "numeric": return typeof a === "string" && a.trim().length > 0;
    case "ordering": return typeof a === "object" && !Array.isArray(a) && p.items.every((it, i) => typeof a[i] === "number");
    case "matching": return typeof a === "object" && !Array.isArray(a) && p.fields.every((f, i) => typeof a[i] === "number");
  }
  return false;
}
function questionAnsweredCount(q) { return q.parts.filter((p) => partAnswered(q, p)).length; }
function answeredPartsCount() { return allParts().filter(({ q, p }) => partAnswered(q, p)).length; }
function allAnswered() { return answeredPartsCount() === TOTAL_PARTS; }

/* ---------- المؤقّت ---------- */
let swInterval = null;
function startStopwatch() {
  stopStopwatch();
  swInterval = setInterval(() => {
    const el = $("#sw-display");
    if (el && S && S.startedAt && S.status !== "submitted") {
      el.textContent = fmtDur(Date.now() - S.startedAt);
    }
  }, 250);
}
function stopStopwatch() { if (swInterval) { clearInterval(swInterval); swInterval = null; } }
const elapsedNow = () => (S && S.startedAt ? (S.submittedAt || Date.now()) - S.startedAt : 0);

/* ---------- مكوّنات مشتركة ---------- */
function contactStrip() {
  return `<div class="contact-strip">
    <span>${esc(EXAM.contact)}</span>
    <a href="${EXAM.whatsapp}" target="_blank" rel="noopener">${icon("chat")} تواصل واتساب</a>
  </div>`;
}
function pageFooter() {
  return `<footer class="page-footer">
    <div class="foot-brand">${esc(EXAM.title)}</div>
    <div class="foot-line">${esc(EXAM.subject)} — ${esc(EXAM.grade)} — يشمل: ${esc(EXAM.lesson1)} · ${esc(EXAM.lesson2)}</div>
    <div class="foot-line">${esc(EXAM.contact)} — <a href="${EXAM.whatsapp}" target="_blank" rel="noopener">واتساب</a></div>
    <div class="foot-line">يعمل هذا الاختبار دون اتصال بالإنترنت، ولا تُرسَل بيانات الطالب إلى أي جهة خارجية.</div>
  </footer>`;
}
function examTopBar() {
  const done = answeredPartsCount();
  const pct = Math.round((done / TOTAL_PARTS) * 100);
  return `<div class="exam-top"><div class="exam-top-inner">
    <span class="exam-title-chip">${esc(EXAM.shortTitle)}</span>
    <span class="stopwatch">${icon("clock")}<span class="sw-digits" id="sw-display" dir="ltr">${fmtDur(elapsedNow())}</span></span>
    <span class="name-tag">${icon("user")}<b>${esc(S.studentName)}</b></span>
    <div class="progress-wrap">
      <div class="progress-meta"><span>الأجزاء المُجابة</span><span><span dir="ltr">${done} / ${TOTAL_PARTS}</span> — ${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
  </div></div>`;
}

/* ---------- شاشة الترحيب ---------- */
function renderWelcome() {
  const resumed = S.studentName ? S.studentName : "";
  return `
  ${contactStrip()}
  <main class="wrap">
    <section class="hero">
      <svg class="hero-deco" viewBox="0 0 200 200" fill="none" stroke="#fff" stroke-width="1.4">
        <circle cx="100" cy="100" r="6" fill="#fff" opacity=".9"/>
        <line x1="100" y1="100" x2="178" y2="100" stroke-width="2.4"/><polygon points="178,100 166,94 166,106" fill="#fff" stroke="none"/>
        <line x1="100" y1="100" x2="100" y2="24" stroke-width="2.4"/><polygon points="100,24 94,36 106,36" fill="#fff" stroke="none"/>
        <line x1="100" y1="100" x2="155" y2="45" stroke-width="2.4"/><polygon points="155,45 143,47 149,57" fill="#fff" stroke="none"/>
        <line x1="30" y1="170" x2="170" y2="170" stroke-dasharray="5 6" opacity=".7"/>
        <line x1="40" y1="170" x2="40" y2="170" stroke-width="4"/>
        <circle cx="40" cy="170" r="4"/><circle cx="120" cy="170" r="4"/>
        <line x1="40" y1="132" x2="40" y2="170" stroke-width="2.2"/><polygon points="40,132 35,143 45,143" fill="#fff" stroke="none"/>
        <line x1="120" y1="132" x2="120" y2="170" stroke-width="2.2"/><polygon points="120,132 115,143 125,143" fill="#fff" stroke="none"/>
      </svg>
      <span class="hero-kicker">${esc(EXAM.subject)} · ${esc(EXAM.grade)}</span>
      <h1>${esc(EXAM.title)}</h1>
      <p class="hero-sub">تقييم شامل تفاعلي يغطي: <b>${esc(EXAM.lesson1)}</b> و<b>${esc(EXAM.lesson2)}</b> — وفق محتوى الكتاب المدرسي حصراً.</p>
      <div class="hero-meta">
        <span class="hero-chip">${icon("list")} <b>15</b> سؤالاً رئيسياً</span>
        <span class="hero-chip">${icon("pen")} <b>41</b> فرعاً مترابطاً</span>
        <span class="hero-chip">${icon("target")} الدرجة العظمى <b>100</b></span>
        <span class="hero-chip">${icon("timer")} مؤقّت تصاعدي <b dir="ltr">HH:MM:SS</b></span>
      </div>
    </section>

    <div class="welcome-grid">
      <section class="card panel">
        <h2>${icon("book")} تعليمات الاختبار</h2>
        <ul class="rules-list">
          <li><span class="num-chip">1</span><span>يتكوّن الاختبار من <b>15 سؤالاً رئيسياً</b> معظمها متفرّع إلى فروع مرتبطة، بمجموع <b>100 درجة</b>.</span></li>
          <li><span class="num-chip">2</span><span>يبدأ المؤقّت فور ظهور السؤال الأول، ويواصل العمل أثناء تنقّلك بين الأسئلة وحتى التسليم.</span></li>
          <li><span class="num-chip">3</span><span>يمكنك التنقل بحرّية بين الأسئلة، ومراجعة إجاباتك وتعديلها قبل التسليم؛ وتُحفَظ إجاباتك تلقائياً على هذا الجهاز عند أي انقطاع أو تحديث للصفحة.</span></li>
          <li><span class="num-chip">4</span><span>لا تظهر أي تلميحات أو نتائج أثناء الاختبار؛ وحالة الأسئلة في المراجعة تشير إلى المُجاب وغير المُجاب فقط.</span></li>
          <li><span class="num-chip">5</span><span>زرّ «تسليم الاختبار» لا يعمل إلا بعد إجابة جميع الفروع، والتسليم يتم بضغطة واحدة وتنزيل تقريرك فوراً.</span></li>
          <li><span class="num-chip">6</span><span>للأسئلة العددية: اكتب القيمة بالأرقام في الخانة المخصصة، والواحدة المطلوبة مبيّنة بجانبها.</span></li>
        </ul>
      </section>
      <section class="card panel">
        <h2>${icon("user")} بيانات الطالب</h2>
        <div class="name-row">
          <label for="student-name">الاسم الثلاثي الكامل <span style="color:#b3261e">*</span></label>
          <input id="student-name" class="name-input" type="text" autocomplete="name" placeholder="مثال: أحمد محمد الخالد" value="${esc(resumed)}" maxlength="80">
          <p class="name-error" id="name-error"></p>
          <button type="button" class="btn btn-primary btn-lg btn-block" id="btn-start">${icon("play")} ابدأ الاختبار</button>
          <p class="small text-center" style="margin:6px 0 0">عند الضغط على «ابدأ الاختبار» يُعرض السؤال الأول ويبدأ احتساب الزمن.</p>
        </div>
        <hr class="sep">
        <div class="teacher-link-row">
          <button type="button" class="teacher-link" id="btn-teacher-gate">${icon("lock")} منطقة المعلم — مفتاح الإجابات والتصحيح</button>
        </div>
      </section>
    </div>
  </main>
  ${pageFooter()}`;
}

/* ---------- شاشة الاختبار ---------- */
function optionRowMCQ(p, qi, pi, oi, text, checked) {
  return `<label class="opt-row ${checked ? "checked" : ""}" data-part="${p.id}" data-oi="${oi}">
    <input type="radio" name="opt-${p.id}" ${checked ? "checked" : ""} data-action="mcq" data-part="${p.id}" data-oi="${oi}">
    <span class="opt-code">${AR_LETTERS[oi]}</span>
    <span class="opt-text">${text}</span>
  </label>`;
}
function renderPart(q, qi, p, pi) {
  const a = S.answers[p.id];
  let body = "";
  if (p.type === "mcq") {
    body = p.options.map((t, oi) => optionRowMCQ(p, qi, pi, oi, t, a === oi)).join("");
  } else if (p.type === "tf") {
    body = `<div class="tf-row" role="radiogroup">
      <label class="tf-opt ${a === true ? "checked" : ""}"><input type="radio" name="tf-${p.id}" data-action="tf" data-part="${p.id}" data-val="true" ${a === true ? "checked" : ""}> صح</label>
      <label class="tf-opt ${a === false ? "checked" : ""}"><input type="radio" name="tf-${p.id}" data-action="tf" data-part="${p.id}" data-val="false" ${a === false ? "checked" : ""}> خطأ</label>
    </div>`;
  } else if (p.type === "multi") {
    const sel = Array.isArray(a) ? a : [];
    body = `<p class="small" style="margin:2px 0 4px">يمكن اختيار أكثر من إجابة.</p>` + p.options.map((t, oi) => `
      <label class="opt-row ${sel.includes(oi) ? "checked" : ""}" data-part="${p.id}" data-oi="${oi}">
        <input type="checkbox" data-action="multi" data-part="${p.id}" data-oi="${oi}" ${sel.includes(oi) ? "checked" : ""}>
        <span class="opt-code">${AR_LETTERS[oi]}</span>
        <span class="opt-text">${t}</span>
      </label>`).join("");
  } else if (p.type === "numeric") {
    body = `<div class="numeric-row">
      <input type="text" inputmode="decimal" class="numeric-input" id="num-${p.id}" data-action="numeric" data-part="${p.id}"
        value="${esc(typeof a === "string" ? a : "")}" placeholder="اكتب القيمة هنا" autocomplete="off">
      <span class="unit-badge">${p.unit}</span>
      <span class="num-format-note">اكتب القيمة العددية (تُقبل الأرقام العربية أو الإنجليزية، والكسر مثل 3/5).</span>
    </div>`;
  } else if (p.type === "ordering") {
    const n = p.items.length;
    const used = new Set();
    p.items.forEach((it, i) => { if (a && typeof a[i] === "number") used.add(a[i]); });
    body = `<p class="small" style="margin:2px 0 4px">عيّن لكل خطوة موضعها في الترتيب (1 الأولى … ${n} الأخيرة)؛ كل موضع يُستخدم مرة واحدة.</p>` +
      p.items.map((it, i) => {
        const cur = a && typeof a[i] === "number" ? a[i] : null;
        const opts = Array.from({ length: n }, (_, k) => k + 1).map((pos) => {
          const dis = used.has(pos) && cur !== pos ? "disabled" : "";
          return `<option value="${pos}" ${cur === pos ? "selected" : ""} ${dis}>${pos}</option>`;
        }).join("");
        return `<div class="ord-item"><span class="ord-text">${it.text}</span>
          <select class="ord-select" data-action="ordering" data-part="${p.id}" data-item="${i}" dir="ltr">
            <option value="">— الموضع —</option>${opts}
          </select></div>`;
      }).join("");
  } else if (p.type === "matching") {
    const used = new Set();
    p.fields.forEach((f, i) => { if (a && typeof a[i] === "number") used.add(a[i]); });
    body = `<p class="small" style="margin:2px 0 4px">اختر وصفاً لكل عنصر؛ كل وصف يُستخدم مرة واحدة.</p>` +
      p.fields.map((f, i) => {
        const cur = a && typeof a[i] === "number" ? a[i] : null;
        const opts = p.options.map((t, oi) => {
          const dis = used.has(oi) && cur !== oi ? "disabled" : "";
          return `<option value="${oi}" ${cur === oi ? "selected" : ""} ${dis}>${AR_LETTERS[oi]} — ${t}</option>`;
        }).join("");
        return `<div class="match-row"><span class="match-field">${f}</span>
          <span class="match-arrow">⟵</span>
          <select class="match-select" data-action="matching" data-part="${p.id}" data-field="${i}">
            <option value="">— اختر الوصف —</option>${opts}
          </select></div>`;
      }).join("");
  }
  const fig = p.diagramPart && q.diagram ? "" : "";
  return `<section class="part-card" id="part-${p.id}">
    <div class="part-head">
      <span class="part-label">${p.letter}</span>
      <span class="part-text">${p.text}</span>
      <span class="part-marks">${fmtMark(p.marks)} ${p.marks === 1 ? "درجة" : "درجات"}</span>
    </div>
    ${fig}${body}
  </section>`;
}
function renderQuestion() {
  const qi = S.current;
  const q = QUESTIONS[qi];
  const qMarks = q.parts.reduce((s, p) => s + p.marks, 0);
  const figBlock = q.diagram ? `
    <figure class="q-figure">
      ${DIAGRAMS[q.diagram]}
      <figcaption>${esc(FIG_CAPTIONS[q.diagram] || "")}</figcaption>
    </figure>` : "";
  const parts = q.parts.map((p, pi) => renderPart(q, qi, p, pi)).join("");
  return `
  ${contactStrip()}
  ${examTopBar()}
  <main class="wrap">
    <div class="exam-layout">
      <aside class="card palette">
        <h3>خريطة الأسئلة</h3>
        <div class="palette-grid">
          ${QUESTIONS.map((qq, i) => {
            const c = questionAnsweredCount(qq);
            const cls = c === qq.parts.length ? "done" : c > 0 ? "partial" : "";
            return `<button type="button" class="pal-btn ${cls} ${i === qi ? "current" : ""}" data-nav="q" data-qi="${i}" aria-label="السؤال ${i + 1}">${i + 1}</button>`;
          }).join("")}
        </div>
        <div class="palette-legend">
          <span class="legend-dot ld-done"></span>مُجاب كاملاً<br>
          <span class="legend-dot ld-part"></span>مُجاب جزئياً<br>
          <span class="legend-dot ld-empty"></span>غير مُجاب
        </div>
        <hr class="sep">
        <button type="button" class="btn btn-ghost btn-block" data-nav="review">${icon("list")} مراجعة الإجابات</button>
      </aside>
      <section class="card question-card">
        <div class="q-head">
          <span class="q-badge">السؤال ${qi + 1} <span style="opacity:.65">من 15</span></span>
          <span class="q-marks">${fmtMark(qMarks)} درجات</span>
        </div>
        <p class="q-lead">${q.lead}</p>
        ${figBlock}
        ${parts}
        <div class="nav-bar">
          <button type="button" class="btn btn-ghost" data-nav="prev" ${qi === 0 ? "disabled" : ""}>${icon("next")} السابق</button>
          <button type="button" class="btn btn-ghost" data-nav="next" ${qi === QUESTIONS.length - 1 ? "disabled" : ""}>التالي ${icon("prev")}</button>
          <span class="spacer"></span>
          <button type="button" class="btn btn-ghost" data-nav="review">${icon("list")} مراجعة الإجابات</button>
          ${submitButtonHtml()}
        </div>
        ${submitHintHtml()}
      </section>
    </div>
  </main>
  ${pageFooter()}`;
}
function submitButtonHtml(extraCls = "") {
  const complete = allAnswered();
  return `<button type="button" id="btn-submit" class="btn btn-teal btn-lg ${extraCls}" data-nav="submit" ${complete ? "" : "disabled"}>${icon("check")} تسليم الاختبار</button>`;
}
function submitHintHtml() {
  const missing = TOTAL_PARTS - answeredPartsCount();
  if (missing === 0) return `<p class="submit-hint">جميع الفروع مُجابة؛ يمكنك التسليم الآن أو مراجعة إجاباتك أولاً.</p>`;
  return `<p class="submit-hint"><b>${missing}</b> ${missing === 1 ? "فرع غير مُجاب" : missing === 2 ? "فرعان غير مُجابَين" : missing <= 10 ? "أفرع غير مُجابة" : "فرعاً غير مُجاب"} — أكمل جميع الأجزاء لتفعيل زر التسليم.</p>`;
}

/* ---------- شاشة المراجعة ---------- */
function renderReview() {
  const rows = QUESTIONS.map((q, i) => {
    const c = questionAnsweredCount(q);
    const total = q.parts.length;
    const chip = c === total
      ? `<span class="state-chip state-ok">مُجابة كاملة</span>`
      : c === 0
        ? `<span class="state-chip state-none">غير مُجابة</span>`
        : `<span class="state-chip state-part">ناقصة: ${total - c} ${total - c === 1 ? "فرع" : "أفرع"}</span>`;
    return `<div class="review-row">
      <span class="rv-num">${i + 1}</span>
      <span class="rv-state">${chip} <span style="opacity:.75">(${c} من ${total} أجزاء)</span></span>
      <button type="button" class="btn btn-ghost rv-jump" data-nav="q" data-qi="${i}">انتقال</button>
    </div>`;
  }).join("");
  return `
  ${contactStrip()}
  ${examTopBar()}
  <main class="wrap">
    <section class="card panel">
      <h2>${icon("list")} مراجعة الإجابات</h2>
      <p class="small" style="margin-top:-6px">تعرض هذه الصفحة حالة الإجابة فقط (مُجاب / غير مُجاب)، ولا تعرض الصحة أو الدرجات قبل التسليم.</p>
      ${rows}
      <div class="nav-bar" style="justify-content:center">
        <button type="button" class="btn btn-ghost" data-nav="q" data-qi="${S.current}">${icon("next")} عودة إلى السؤال الحالي</button>
        ${submitButtonHtml()}
      </div>
      ${submitHintHtml()}
    </section>
  </main>
  ${pageFooter()}`;
}

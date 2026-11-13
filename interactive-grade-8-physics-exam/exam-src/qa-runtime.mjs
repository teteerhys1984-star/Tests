/* Runtime QA harness for the standalone exam HTML (jsdom). */
import fs from "fs";
import { JSDOM } from "jsdom";

const HTML = fs.readFileSync(process.argv[2] || "/home/user/sandbox/Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html", "utf-8");
let pass = 0, fail = 0;
const results = [];
function check(name, cond, extra = "") {
  if (cond) { pass++; results.push(`PASS  ${name}`); }
  else { fail++; results.push(`FAIL  ${name} ${extra}`); }
}

function makeWindow(persistedStorage = null) {
  const downloads = [];
  const dom = new JSDOM(HTML, {
    url: "http://localhost/exam/Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.URL.createObjectURL = () => "blob:mock-" + downloads.length;
      window.URL.revokeObjectURL = () => {};
      const origClick = window.HTMLAnchorElement.prototype.click;
      window.HTMLAnchorElement.prototype.click = function () {
        if (this.download) downloads.push({ filename: this.download, href: this.href });
        else origClick.call(this);
      };
      if (persistedStorage) {
        for (const [k, v] of Object.entries(persistedStorage)) window.localStorage.setItem(k, v);
      }
    },
  });
  return { dom, downloads, window: dom.window };
}
function dumpStorage(window) {
  const out = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    out[k] = window.localStorage.getItem(k);
  }
  return out;
}
const q = (window, sel) => window.document.querySelector(sel);
const qa = (window, sel) => [...window.document.querySelectorAll(sel)];

/* Get exam internals from the window (script scope is closure, so replicate reads from localStorage state). */
function getState(window) {
  const raw = window.localStorage.getItem("G8PHYS_U1L12_EXAM_ATTEMPT_V1");
  return raw ? JSON.parse(raw) : null;
}
/* Answer maps reconstructed from the data: we expose them by evaluating textContent? No — replay logic:
   we re-derive correct answers by reading from the window's DOM-less scope is impossible; instead we
   embed a tiny accessor: use the report (teacher data) — simpler: perform clicks by option index given here. */

/* Scenario A: full run with ALL CORRECT answers. */
function answerAllCorrect(window) {
  // We cheat-proof: read correct answers through the welcome screen is impossible; use the embedded data via regex on HTML.
  const dataSrc = HTML.match(/const QUESTIONS = \[[\s\S]*?\n\];/)[0];
  const vm = require("vm");
  const ctx = vm.createContext({});
  vm.runInContext(dataSrc + ";globalThis.QS = QUESTIONS;", ctx);
  return ctx.QS;
}

(async () => {
  // Build answer plan from question data
  const vmMod = await import("vm");
  const dataM = HTML.match(/const QUESTIONS = \[[\s\S]*?\n\];/);
  const ctx = vmMod.createContext({});
  vmMod.runInContext(dataM[0] + ";globalThis.QS = QUESTIONS;", ctx);
  const QS = ctx.QS;
  const state0 = { KEY: "G8PHYS_U1L12_EXAM_ATTEMPT_V1" };

  const correctAns = (p) => {
    if (p.type === "mcq") return p.correct;
    if (p.type === "tf") return p.correct;
    if (p.type === "multi") return p.correct.slice();
    if (p.type === "numeric") return String(p.answerValue);
    if (p.type === "ordering") { const o = {}; p.items.forEach((it, i) => (o[i] = it.pos)); return o; }
    if (p.type === "matching") { const o = {}; p.fields.forEach((f, i) => (o[i] = p.key[i])); return o; }
  };
  const wrongAns = (p) => {
    if (p.type === "mcq") return (p.correct + 1) % p.options.length;
    if (p.type === "tf") return !p.correct;
    if (p.type === "multi") return p.options.map((_, i) => i).filter((i) => !p.correct.includes(i)).slice(0, 1); // select one wrong
    if (p.type === "numeric") return p.answerValue === 0 ? "999" : "0.001";
    if (p.type === "ordering") { const o = {}; p.items.forEach((it, i) => (o[i] = ((it.pos) % p.items.length) + 1)); return o; } // shifted
    if (p.type === "matching") { const o = {}; p.fields.forEach((f, i) => (o[i] = (p.key[i] + 1) % p.options.length)); return o; }
  };

  function fillAnswers(window, chooser) {
    // iterate all 15 questions by navigating & setting state programmatically through DOM interactions
    for (let qi = 0; qi < 15; qi++) {
      // navigate to question via palette
      const palBtns = qa(window, '.pal-btn[data-nav="q"]');
      palBtns[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
      const st = getState(window);
      const qId = st.questionOrder[qi];
      const qObj = QS.find((x) => x.id === qId);
      for (const p of qObj.parts) {
        const val = chooser(p);
        if (p.type === "mcq") {
          const input = q(window, `input[data-action="mcq"][data-part="${p.id}"][data-oi="${val}"]`);
          input.checked = true; input.dispatchEvent(new window.Event("change", { bubbles: true }));
        } else if (p.type === "tf") {
          const input = q(window, `input[data-action="tf"][data-part="${p.id}"][data-val="${val}"]`);
          input.checked = true; input.dispatchEvent(new window.Event("change", { bubbles: true }));
        } else if (p.type === "multi") {
          for (const oi of val) {
            const input = q(window, `input[data-action="multi"][data-part="${p.id}"][data-oi="${oi}"]`);
            input.checked = true; input.dispatchEvent(new window.Event("change", { bubbles: true }));
          }
        } else if (p.type === "numeric") {
          const input = q(window, `input[data-action="numeric"][data-part="${p.id}"]`);
          input.value = val;
          input.dispatchEvent(new window.Event("input", { bubbles: true }));
        } else if (p.type === "ordering") {
          for (const [i, pos] of Object.entries(val)) {
            const sel = q(window, `select[data-action="ordering"][data-part="${p.id}"][data-item="${i}"]`);
            sel.value = String(pos); sel.dispatchEvent(new window.Event("change", { bubbles: true }));
          }
        } else if (p.type === "matching") {
          for (const [i, oi] of Object.entries(val)) {
            const sel = q(window, `select[data-action="matching"][data-part="${p.id}"][data-field="${i}"]`);
            sel.value = String(oi); sel.dispatchEvent(new window.Event("change", { bubbles: true }));
          }
        }
        // re-navigate to same question because renderApp() re-renders after each change for radio types
        if (p.type === "mcq" || p.type === "tf" || p.type === "multi" || p.type === "ordering" || p.type === "matching") {
          const palBtns2 = qa(window, '.pal-btn[data-nav="q"]');
          palBtns2[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
        }
      }
    }
  }

  /* ============ A: perfect run ============ */
  {
    const { window, downloads } = makeWindow();
    const doc = window.document;
    check("A1 welcome screen visible", !!q(window, "#student-name"));
    check("A2 no stopwatch before start", !q(window, "#sw-display"));
    // empty name blocked
    q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
    check("A3 empty name blocked with error", q(window, "#name-error") && q(window, "#name-error").textContent.length > 3);
    const inp = q(window, "#student-name");
    inp.value = "أحمد محمد الخالد";
    q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
    let st = getState(window);
    check("A4 attempt created & active", st && st.status === "active" && !!st.startedAt);
    check("A5 stopwatch displayed after first question", !!q(window, "#sw-display"));
    check("A6 student name shown in top bar", q(window, "#app").textContent.includes("أحمد محمد الخالد"));
    check("A7 question 1 of 15 rendered", q(window, "#app").textContent.includes("السؤال 1"));
    check("A8 no correctness styling pre-submission", !q(window, "#app").textContent.includes("صحيحة كاملة"));
    const submitBtn = q(window, "#btn-submit");
    check("A9 submit disabled before completion", submitBtn && submitBtn.hasAttribute("disabled"));
    check("A10 submit label exact", submitBtn && submitBtn.textContent.includes("تسليم الاختبار"));
    fillAnswers(window, correctAns);
    st = getState(window);
    check("A11 all 41 parts stored", Object.keys(st.answers).length === 41, `got ${Object.keys(st.answers).length}`);
    const btn2 = q(window, "#btn-submit");
    check("A12 submit enabled after completion", btn2 && !btn2.hasAttribute("disabled"));
    const before = Date.now();
    btn2.dispatchEvent(new window.Event("click", { bubbles: true }));
    st = getState(window);
    check("A13 status submitted", st.status === "submitted");
    check("A14 submittedAt recorded", st.submittedAt >= before);
    check("A15 auto-download fired once", downloads.length === 1, `got ${downloads.length}`);
    check("A16 filename format", downloads[0] && downloads[0].filename === "Grade8_Physics_Unit1_Lessons1-2_Report_أحمد_محمد_الخالد.txt", downloads[0] && downloads[0].filename);
    check("A17 score 100/100 in state", st.results && st.results.total === 100, st.results && st.results.total);
    check("A18 results screen shows 100", q(window, "#app").textContent.includes("/ 100"));
    check("A19 results counts: 41 correct 0 wrong", st.results.counts.correct === 41 && st.results.counts.incorrect === 0);
    check("A20 backup download button exists", !!q(window, "#btn-report"));
    const report = st.report.text;
    check("A21 report contains name & unit & lessons", report.includes("أحمد محمد الخالد") && report.includes("القوى المتلاقية") && report.includes("القوى المتوازية"));
    check("A22 report has 15 questions", (report.match(/السؤال \d+ من 15/g) || []).length === 15);
    check("A23 report has page refs & hidden topics", report.includes("صفحات الكتاب المطبوعة") && report.includes("مرجع الكتاب"));
    check("A24 report timing format HH:MM:SS", /الزمن الكلي المستغرق : \d{2}:\d{2}:\d{2}/.test(report));
    check("A25 report shows score line", report.includes("العلامة النهائية          : 100 من 100"));
    check("A26 report has no Arabic-Indic digits", !/[٠-٩]/.test(report));
    check("A27 report has per-part evaluation", report.includes("التقييم: صحيحة كاملة"));
    // refresh (reload) into submitted state
    const persisted = dumpStorage(window);
    const again = makeWindow(persisted);
    check("A28 refresh restores results screen", !!q(again.window, "#btn-report") && q(again.window, "#btn-report").textContent.includes("تنزيل التقرير TXT"));
    check("A29 no new attempt created on refresh", getState(again.window).attemptId === st.attemptId);
    // backup download
    q(again.window, "#btn-report").dispatchEvent(new again.window.Event("click", { bubbles: true }));
    check("A30 backup download same filename", again.downloads.length === 1 && again.downloads[0].filename === downloads[0].filename);
    // Try again
    q(again.window, "#btn-retry").dispatchEvent(new again.window.Event("click", { bubbles: true }));
    const st2 = getState(again.window);
    check("A31 try-again -> welcome + fresh attempt", !!q(again.window, "#student-name") && st2.attemptId !== st.attemptId && st2.status === "new" && !st2.startedAt);
    return { QS };
  }
})().then(({ QS }) => {
  (async () => {
    const vmMod = await import("vm");

    /* ============ B: wrong answers & grading stats ============ */
    {
      const wrongAns = (p) => {
        if (p.type === "mcq") return (p.correct + 1) % p.options.length;
        if (p.type === "tf") return !p.correct;
        if (p.type === "multi") return p.options.map((_, i) => i).filter((i) => !p.correct.includes(i)).slice(0, 1);
        if (p.type === "numeric") return p.answerValue === 0 ? "999" : "0.001";
        if (p.type === "ordering") { const o = {}; p.items.forEach((it, i) => (o[i] = ((it.pos) % p.items.length) + 1)); return o; }
        if (p.type === "matching") { const o = {}; p.fields.forEach((f, i) => (o[i] = (p.key[i] + 1) % p.options.length)); return o; }
      };
      const correctAns = (p) => {
        if (p.type === "mcq") return p.correct;
        if (p.type === "tf") return p.correct;
        if (p.type === "multi") return p.correct.slice();
        if (p.type === "numeric") return String(p.answerValue);
        if (p.type === "ordering") { const o = {}; p.items.forEach((it, i) => (o[i] = it.pos)); return o; }
        if (p.type === "matching") { const o = {}; p.fields.forEach((f, i) => (o[i] = p.key[i])); return o; }
      };
      function fillAnswers(window, chooser) {
        for (let qi = 0; qi < 15; qi++) {
          qa(window, '.pal-btn[data-nav="q"]')[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
          const st = getState(window);
          const qObj = QS.find((x) => x.id === st.questionOrder[qi]);
          for (const p of qObj.parts) {
            const val = chooser(p);
            if (p.type === "mcq") { const i2 = q(window, `input[data-action="mcq"][data-part="${p.id}"][data-oi="${val}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); }
            else if (p.type === "tf") { const i2 = q(window, `input[data-action="tf"][data-part="${p.id}"][data-val="${val}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); }
            else if (p.type === "multi") { for (const oi of val) { const i2 = q(window, `input[data-action="multi"][data-part="${p.id}"][data-oi="${oi}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
            else if (p.type === "numeric") { const i2 = q(window, `input[data-action="numeric"][data-part="${p.id}"]`); i2.value = val; i2.dispatchEvent(new window.Event("input", { bubbles: true })); }
            else if (p.type === "ordering") { for (const [i, pos] of Object.entries(val)) { const s2 = q(window, `select[data-action="ordering"][data-part="${p.id}"][data-item="${i}"]`); s2.value = String(pos); s2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
            else if (p.type === "matching") { for (const [i, oi] of Object.entries(val)) { const s2 = q(window, `select[data-action="matching"][data-part="${p.id}"][data-field="${i}"]`); s2.value = String(oi); s2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
            if (p.type !== "numeric") qa(window, '.pal-btn[data-nav="q"]')[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
          }
        }
      }
      const { window } = makeWindow();
      q(window, "#student-name").value = "لينا خالد العلي";
      q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
      fillAnswers(window, wrongAns);
      q(window, "#btn-submit").dispatchEvent(new window.Event("click", { bubbles: true }));
      const st = getState(window);
      check("B1 all-wrong run scores only per-option credit 2.25", st.results.total === 2.25, String(st.results.total));
      check("B2 counts wrong >= 30", st.results.counts.incorrect >= 30, JSON.stringify(st.results.counts));
      check("B3 results screen percentage 2.25%", q(window, "#app").textContent.includes("2.25%"));
    }

    /* ============ C: mixed answers → partial credit ============ */
    {
      const correctAns = (p) => {
        if (p.type === "mcq") return p.correct;
        if (p.type === "tf") return p.correct;
        if (p.type === "multi") return p.correct.slice();
        if (p.type === "numeric") return String(p.answerValue);
        if (p.type === "ordering") { const o = {}; p.items.forEach((it, i) => (o[i] = it.pos)); return o; }
        if (p.type === "matching") { const o = {}; p.fields.forEach((f, i) => (o[i] = p.key[i])); return o; }
      };
      const { window } = makeWindow();
      q(window, "#student-name").value = "طالب تجريبي جدّي";
      q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
      // answer everything correct except q05a numeric wrong (14) and q01b multi with one wrong option selected additionally
      for (let qi = 0; qi < 15; qi++) {
        qa(window, '.pal-btn[data-nav="q"]')[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
        const st = getState(window);
        const qObj = QS.find((x) => x.id === st.questionOrder[qi]);
        for (const p of qObj.parts) {
          let val = correctAns(p);
          if (p.id === "q05a") val = "14";
          if (p.id === "q01b") val = [0, 2, 3]; // add one wrong option
          if (p.type === "mcq") { const i2 = q(window, `input[data-action="mcq"][data-part="${p.id}"][data-oi="${val}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); }
          else if (p.type === "tf") { const i2 = q(window, `input[data-action="tf"][data-part="${p.id}"][data-val="${val}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); }
          else if (p.type === "multi") { for (const oi of val) { const i2 = q(window, `input[data-action="multi"][data-part="${p.id}"][data-oi="${oi}"]`); i2.checked = true; i2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
          else if (p.type === "numeric") { const i2 = q(window, `input[data-action="numeric"][data-part="${p.id}"]`); i2.value = val; i2.dispatchEvent(new window.Event("input", { bubbles: true })); }
          else if (p.type === "ordering") { for (const [i, pos] of Object.entries(val)) { const s2 = q(window, `select[data-action="ordering"][data-part="${p.id}"][data-item="${i}"]`); s2.value = String(pos); s2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
          else if (p.type === "matching") { for (const [i, oi] of Object.entries(val)) { const s2 = q(window, `select[data-action="matching"][data-part="${p.id}"][data-field="${i}"]`); s2.value = String(oi); s2.dispatchEvent(new window.Event("change", { bubbles: true })); } }
          if (p.type !== "numeric") qa(window, '.pal-btn[data-nav="q"]')[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
        }
      }
      q(window, "#btn-submit").dispatchEvent(new window.Event("click", { bubbles: true }));
      const st = getState(window);
      // Expected: 100 - 3 (q05a) - 0.75 (q01b one option misclassified) = 96.25
      check("C1 partial credit numeric+multi", st.results.total === 96.25, String(st.results.total));
      check("C2 partial count = 1", st.results.counts.partial === 1, JSON.stringify(st.results.counts));
      check("C3 incorrect count = 1", st.results.counts.incorrect === 1);
      check("C4 correct count = 39", st.results.counts.correct === 39);
      check("C5 report shows partial status", st.report.text.includes("صحيحة جزئياً"));
      check("C6 report shows error detail for q05a", st.report.text.includes("14") || st.report.text.includes("المحرزة: 0"));
    }

    /* ============ D: persistence mid-exam (refresh) ============ */
    {
      const { window } = makeWindow();
      q(window, "#student-name").value = "سارة محمود";
      q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
      // answer q01a + q01b, then navigate to Q3
      const i1 = q(window, 'input[data-action="mcq"][data-part="q01a"][data-oi="1"]');
      i1.checked = true; i1.dispatchEvent(new window.Event("change", { bubbles: true }));
      for (const oi of [0, 2]) { const cb = q(window, `input[data-action="multi"][data-part="q01b"][data-oi="${oi}"]`); cb.checked = true; cb.dispatchEvent(new window.Event("change", { bubbles: true })); }
      qa(window, '.pal-btn[data-nav="q"]')[2].dispatchEvent(new window.Event("click", { bubbles: true }));
      const st = getState(window);
      const persisted = dumpStorage(window);
      const w2 = makeWindow(persisted);
      const st2 = getState(w2.window);
      check("D1 refresh keeps attempt id", st2.attemptId === st.attemptId);
      check("D2 refresh keeps name", st2.studentName === "سارة محمود");
      check("D3 refresh keeps answers", st2.answers.q01a === 1 && JSON.stringify(st2.answers.q01b) === JSON.stringify([0, 2]));
      check("D4 refresh restores current question (3)", q(w2.window, "#app").textContent.includes("السؤال 3"));
      check("D5 refresh keeps timer start", st2.startedAt === st.startedAt);
      check("D6 stopwatch ticking after refresh", !!q(w2.window, "#sw-display"));
      check("D7 q1 palette marked done after refresh", qa(w2.window, ".pal-btn")[0].classList.contains("done"));
      // elapsed accuracy: elapsed from timestamp despite JS pause
      const fakePast = st2.startedAt - 5000;
      st2.startedAt = fakePast;
      w2.window.localStorage.setItem("G8PHYS_U1L12_EXAM_ATTEMPT_V1", JSON.stringify(st2));
      const w3 = makeWindow(dumpStorage(w2.window));
      const swText = q(w3.window, "#sw-display").textContent;
      check("D8 elapsed computed from timestamps (>=5s)", /^\d{2}:\d{2}:(0[5-9]|1\d)/.test(swText), swText);
    }

    /* ============ E: teacher gate ============ */
    {
      const { window } = makeWindow();
      q(window, "#btn-teacher-gate").dispatchEvent(new window.Event("click", { bubbles: true }));
      check("E1 teacher gate renders", !!q(window, "#teacher-pass"));
      q(window, "#teacher-pass").value = "wrong-pass";
      q(window, "#btn-teacher-login").dispatchEvent(new window.Event("click", { bubbles: true }));
      check("E2 wrong password rejected", !q(window, "#app").textContent.includes("مفتاح الإجابات الكامل والحلول المفصّلة"));
      q(window, "#teacher-pass").value = "somer173";
      q(window, "#btn-teacher-login").dispatchEvent(new window.Event("click", { bubbles: true }));
      check("E3 correct password opens key", q(window, "#app").textContent.includes("مفتاح الإجابات الكامل"));
      check("E4 teacher area lists 15 questions", qa(window, ".tk-q").length === 15);
      check("E5 rubric shown", q(window, "#app").textContent.includes("منهجية التصحيح وقواعد الدرجات الجزئية"));
      check("E6 difficulty labels visible in teacher area", q(window, "#app").textContent.includes("تفكير ناقد"));
      check("E7 interface-level restriction note present", q(window, "#app").textContent.includes("الواجهة"));
    }

    /* ============ F: content-hygiene on student screens ============ */
    {
      const { window } = makeWindow();
      const bodyText = q(window, "#app").textContent;
      check("F1 welcome shows no correct answers", !bodyText.includes("الإجابة الصحيحة"));
      q(window, "#student-name").value = "فحص الجودة التلقائي";
      q(window, "#btn-start").dispatchEvent(new window.Event("click", { bubbles: true }));
      // walk through all questions: ensure no 'الإجابة الصحيحة' or difficulty labels leak
      let leak = false, diffLeak = false;
      for (let qi = 0; qi < 15; qi++) {
        qa(window, '.pal-btn[data-nav="q"]')[qi].dispatchEvent(new window.Event("click", { bubbles: true }));
        const t = q(window, "#app").textContent;
        if (/الإجابة الصحيحة|الحل المفصّل|التفسير العلمي/.test(t)) leak = true;
        if (/أساسي|متوسط|متقدم|تفكير ناقد/.test(t)) diffLeak = true;
      }
      check("F2 no answer/explanation leak during exam", !leak);
      check("F3 no difficulty labels during exam", !diffLeak);
      // review screen
      qa(window, '[data-nav="review"]')[0].dispatchEvent(new window.Event("click", { bubbles: true }));
      check("F4 review screen renders 15 rows", qa(window, ".review-row").length === 15);
      check("F5 review shows only answered state", !/الإجابة الصحيحة/.test(q(window, "#app").textContent));
      check("F6 review submit disabled until complete", q(window, "#btn-submit").hasAttribute("disabled"));
      check("F7 missing parts count shown (no hints)", /غير مُجاب/.test(window.document.body.textContent));
    }

    console.log(results.join("\n"));
    console.log(`\n==== ${pass} passed, ${fail} failed ====`);
    process.exit(fail ? 1 : 0);
  })();
}).catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });

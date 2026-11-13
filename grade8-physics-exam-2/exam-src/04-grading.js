/* ============================================================
   التصحيح، التقرير، النتائج، منطقة المعلم، الإقلاع
   ============================================================ */

const STATUS_LABELS = { correct: "صحيحة كاملة", partial: "صحيحة جزئياً", incorrect: "خاطئة", unanswered: "بلا إجابة" };

function round2(n) { return Math.round(n * 100) / 100; }

function gradePart(p) {
  const a = S.answers[p.id];
  if (!partAnswered(getQuestionOfPart(p.id), p)) return { score: 0, status: "unanswered", studentText: "— بلا إجابة —" };
  let score = 0, status = "incorrect", studentText = "";
  if (p.type === "mcq") {
    studentText = `${AR_LETTERS[a]} — ${stripHtml(p.options[a])}`;
    score = a === p.correct ? p.marks : 0;
  } else if (p.type === "tf") {
    studentText = a ? "صح" : "خطأ";
    score = a === p.correct ? p.marks : 0;
  } else if (p.type === "multi") {
    const sel = Array.isArray(a) ? a : [];
    studentText = sel.length ? sel.map((i) => `${AR_LETTERS[i]}`).join("، ") + " — " + sel.map((i) => stripHtml(p.options[i])).join(" | ") : "— لم يختر شيئاً —";
    const per = p.marks / p.options.length;
    p.options.forEach((_, oi) => {
      const shouldBe = p.correct.includes(oi);
      const chosen = sel.includes(oi);
      if (shouldBe === chosen) score += per;
    });
    score = round2(score);
  } else if (p.type === "numeric") {
    const parsed = parseNumericInput(a, p.unit);
    studentText = `${a.trim()} ${p.unit === "ratio" ? "" : `(بالمطلوب: ${p.unit})`}`.trim();
    if (parsed.ok && numericClose(parsed.value, p.answerValue)) score = p.marks;
  } else if (p.type === "ordering") {
    studentText = p.items.map((it, i) => `«${stripHtml(it.text)}» في الموضع ${a[i]}`).join(" | ");
    const per = p.marks / p.items.length;
    p.items.forEach((it, i) => { if (a[i] === it.pos) score += per; });
    score = round2(score);
  } else if (p.type === "matching") {
    studentText = p.fields.map((f, i) => `${stripHtml(f)} ⟵ ${typeof a[i] === "number" ? stripHtml(p.options[a[i]]) : "?"}`).join(" | ");
    const per = p.marks / p.fields.length;
    p.fields.forEach((_, i) => { if (a[i] === p.key[i]) score += per; });
    score = round2(score);
  }
  if (score >= p.marks) status = "correct";
  else if (score > 0) status = "partial";
  return { score: round2(score), status, studentText };
}
function getQuestionOfPart(partId) {
  return QUESTIONS.find((q) => q.parts.some((p) => p.id === partId));
}
function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}
function gradeAll() {
  let total = 0, cCorrect = 0, cPartial = 0, cIncorrect = 0, cUnanswered = 0;
  const perQuestion = QUESTIONS.map((q, qi) => {
    const parts = q.parts.map((p) => {
      const g = gradePart(p);
      total = round2(total + g.score);
      if (g.status === "correct") cCorrect++;
      else if (g.status === "partial") cPartial++;
      else if (g.status === "incorrect") cIncorrect++;
      else cUnanswered++;
      return { part: p, ...g };
    });
    return { q, qi, parts, earned: round2(parts.reduce((s, x) => s + x.score, 0)) };
  });
  return {
    total,
    max: EXAM.totalMarks,
    pct: round2((total / EXAM.totalMarks) * 100),
    counts: { correct: cCorrect, partial: cPartial, incorrect: cIncorrect, unanswered: cUnanswered },
    perQuestion,
    durationMs: elapsedNow(),
    startedAt: S.startedAt,
    submittedAt: S.submittedAt,
  };
}

/* ---------- تقرير TXT ---------- */
function buildReport(res) {
  const L = [];
  const sep = "=".repeat(64);
  const thin = "-".repeat(64);
  L.push(sep);
  L.push("تقرير الاختبار التفاعلي في الفيزياء");
  L.push(sep);
  L.push("");
  L.push("[1] معلومات الطالب والاختبار");
  L.push(thin);
  L.push(`اسم الطالب        : ${S.studentName}`);
  L.push(`المادة            : ${EXAM.subject}`);
  L.push(`الصف              : ${EXAM.grade}`);
  L.push(`الوحدة            : ${EXAM.unit}`);
  L.push(`الدرس الأول        : ${EXAM.lesson1}`);
  L.push(`الدرس الثاني       : ${EXAM.lesson2}`);
  L.push(`عنوان الاختبار     : ${EXAM.title}`);
  L.push(`معرّف المحاولة     : ${S.attemptId}`);
  L.push("");
  L.push("[2] التوقيت");
  L.push(thin);
  L.push(`تاريخ ووقت البدء     : ${fmtDateTime(S.startedAt)}`);
  L.push(`تاريخ ووقت التسليم   : ${fmtDateTime(S.submittedAt)}`);
  L.push(`الزمن الكلي المستغرق : ${fmtDur(res.durationMs)}`);
  L.push("");
  L.push("[3] النتيجة الإجمالية");
  L.push(thin);
  L.push(`العلامة النهائية          : ${fmtMark(res.total)} من 100`);
  L.push(`النسبة المئوية            : ${fmtMark(res.pct)}%`);
  L.push(`إجابات صحيحة كاملة        : ${res.counts.correct} من ${TOTAL_PARTS}`);
  L.push(`إجابات صحيحة جزئياً       : ${res.counts.partial} من ${TOTAL_PARTS}`);
  L.push(`إجابات خاطئة              : ${res.counts.incorrect} من ${TOTAL_PARTS}`);
  L.push(`أجزاء بلا إجابة           : ${res.counts.unanswered} من ${TOTAL_PARTS}`);
  L.push("");
  L.push("[4] التقييم التفصيلي (سؤالاً بسؤالاً وفرعاً بفرعاً)");
  L.push(sep);
  res.perQuestion.forEach(({ q, qi, parts, earned }) => {
    const qMarks = q.parts.reduce((s, p) => s + p.marks, 0);
    const lessonName = q.lesson === 1 ? EXAM.lesson1 : EXAM.lesson2;
    L.push("");
    L.push(`السؤال ${qi + 1} من 15  |  العلامة: ${fmtMark(earned)} / ${fmtMark(qMarks)}`);
    L.push(`المرجع: ${lessonName}  |  الموضوع: ${q.topic}  |  صفحات الكتاب المطبوعة: ${q.pages}`);
    L.push(`نص السؤال: ${stripHtml(q.lead)}`);
    parts.forEach(({ part: p, score, status, studentText }) => {
      L.push(thin);
      L.push(`  الفرع (${p.letter})  |  العلامة القصوى: ${fmtMark(p.marks)}  |  المحرزة: ${fmtMark(score)}  |  التقييم: ${STATUS_LABELS[status]}`);
      L.push(`  نص الفرع         : ${stripHtml(p.text)}`);
      L.push(`  إجابة الطالب     : ${studentText}`);
      L.push(`  الإجابة الصحيحة  : ${stripHtml(p.answer)}`);
      L.push(`  البدائل المقبولة : ${stripHtml(p.alts)}`);
      L.push(`  التفسير العلمي   : ${stripHtml(p.explain)}`);
      L.push(`  مرجع الكتاب      : ${(q.lesson === 1 ? "الدرس 1" : "الدرس 2")} — ${p.topic} — ص ${p.page}`);
    });
    L.push("");
    L.push(sep);
  });
  L.push("");
  L.push("[5] خاتمة");
  L.push(thin);
  L.push("أُنشئ هذا التقرير محلياً على جهاز الطالب لحظة التسليم، وتُرسَل النتيجة وإجابات الطالب وتقريره إلى المعلّم عبر الإنترنت عند التسليم، وقد تُعاد المحاولة لاحقاً عند تعذّر الاتصال.");
  L.push(`${EXAM.contact}`);
  L.push(sep);
  return L.join("\r\n");
}
function validateReport(reportText) {
  const must = [S.studentName, "العلامة النهائية", "السؤال 15 من 15", "السؤال 1 من 15", "تاريخ ووقت التسليم"];
  return must.every((m) => reportText.includes(m));
}
function sanitizeFilename(name) {
  let n = String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (!n) n = "STUDENT";
  if (n.length > 60) n = n.slice(0, 60);
  return n;
}
let lastObjectUrl = null;
function downloadReport(text, filename) {
  try {
    const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    if (lastObjectUrl) { try { URL.revokeObjectURL(lastObjectUrl); } catch (e) {} }
    lastObjectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = lastObjectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (e) { return false; }
}

/* ---------- التسليم ---------- */
function submitExam() {
  if (!allAnswered() || S.status === "submitted") return;
  Object.freeze(S.answers);
  S.submittedAt = Date.now();
  S.status = "submitted";
  stopStopwatch();
  const res = gradeAll();
  S.results = res;
  const filename = `Grade8_Physics_Unit1_Lessons1-2_Report_${sanitizeFilename(S.studentName)}.txt`;
  let report = buildReport(res);
  if (!validateReport(report)) { console.warn("report validation warning"); }
  S.report = { text: report, filename };
  saveState();
  downloadReport(report, filename);
  if (!S.submitSoundPlayed) { S.submitSoundPlayed = true; saveState(); playSound(AUDIO_SUBMIT); }
  S.screen = "results";
  S.sendStatus = "sending";
  saveState();
  renderApp();
  // الإرسال في الخلفية؛ لا يؤخر النتيجة أو تنزيل التقرير.
  sendCurrentResult();
}

/* ---------- شاشة النتائج ---------- */
function renderResults() {
  const res = S.results;
  if (!res) return renderWelcome();
  const deg = Math.max(0, Math.min(100, res.pct)) * 3.6;
  return `
  ${contactStrip()}
  <main class="wrap">
    <section class="results-hero">
      <span class="hero-kicker" style="position:relative">النتيجة النهائية</span>
      <h1 style="font-size:24px;margin:10px 0 0">أحسنتَ، ${esc(S.studentName)}</h1>
      <p style="color:#c9d8ec;margin:4px 0 0;font-size:14px">أُغلقت إجاباتك وسُجّلت نتيجتك، ووُلّد تقريرك النصي الكامل.</p>
      <div class="score-ring" style="background:conic-gradient(#2bb8ad 0deg ${deg}deg, rgba(255,255,255,.14) ${deg}deg 360deg)">
        <div class="score-inner">
          <div class="score-num"><span dir="ltr">${fmtMark(res.total)}</span><span> / 100</span></div>
          <div class="score-pct">${fmtMark(res.pct)}%</div>
        </div>
      </div>
    </section>
    <div class="stats-grid">
      <div class="stat-card ok"><div class="stat-num">${res.counts.correct}</div><div class="stat-label">أجزاء صحيحة كاملة</div></div>
      <div class="stat-card warn"><div class="stat-num">${res.counts.partial}</div><div class="stat-label">أجزاء صحيحة جزئياً</div></div>
      <div class="stat-card bad"><div class="stat-num">${res.counts.incorrect}</div><div class="stat-label">أجزاء خاطئة</div></div>
      <div class="stat-card"><div class="stat-num">${res.counts.unanswered}</div><div class="stat-label">أجزاء بلا إجابة</div></div>
      <div class="stat-card"><div class="stat-num" dir="ltr">${fmtDur(res.durationMs)}</div><div class="stat-label">الزمن الكلي</div></div>
      <div class="stat-card"><div class="stat-num" dir="ltr">${TOTAL_PARTS}</div><div class="stat-label">عدد أجزاء الاختبار</div></div>
    </div>
    ${sendStatusHtml()}
    <section class="card panel mt-16 text-center">
      <p style="font-size:14px;color:var(--slate);margin-top:0">بدأ تنزيل تقريرك النصي تلقائياً لحظة التسليم؛ إذا منع متصفحك التنزيل التلقائي فاستخدم الزر التالي للحصول على الملف نفسه:</p>
      <div class="results-actions" style="margin-top:10px">
        <button type="button" class="btn btn-primary btn-lg" id="btn-report">${icon("download")} تنزيل التقرير TXT</button>
        <button type="button" class="btn btn-ghost btn-lg" id="btn-retry">${icon("retry")} إعادة المحاولة</button>
      </div>
      <p class="report-note">اسم الملف: <bdi dir="ltr">${esc(S.report ? S.report.filename : "")}</bdi></p>
      <p class="report-note">تظهر النتيجة هنا مجمّعة فقط؛ مفاتيح الإجابة التفصيلية محفوظة في منطقة المعلم.</p>
    </section>
  </main>
  ${pageFooter()}`;
}

/* ---------- منطقة المعلم ---------- */
const TEACHER_PASS = "somer173";
let teacherAuthed = false;

function renderTeacherGate() {
  return `
  ${contactStrip()}
  <main class="wrap">
    <section class="card gate-box">
      <div class="lock-icon">${icon("lock")}</div>
      <h2>منطقة المعلم — مفتاح الإجابات ومنهجية التصحيح</h2>
      <p>هذه المنطقة مخصّصة للمعلم فقط وتحتوي مفاتيح الإجابات الكاملة. ${esc(EXAM.teacherNote)}</p>
      <div class="name-row">
        <label for="teacher-pass">كلمة المرور</label>
        <input id="teacher-pass" class="name-input" type="password" dir="ltr" autocomplete="off" placeholder="••••••••">
        <p class="name-error" id="teacher-error"></p>
        <button type="button" class="btn btn-primary btn-block" id="btn-teacher-login">${icon("lock")} دخول</button>
        <button type="button" class="btn btn-ghost btn-block" data-nav="welcome">عودة إلى صفحة البدء</button>
      </div>
    </section>
  </main>
  ${pageFooter()}`;
}
function renderTeacherArea() {
  const countByLesson = { 1: 0, 2: 0 };
  const marksByLesson = { 1: 0, 2: 0 };
  const diffCount = { basic: 0, inter: 0, adv: 0, crit: 0 };
  QUESTIONS.forEach((q) => {
    countByLesson[q.lesson]++;
    marksByLesson[q.lesson] += q.parts.reduce((s, p) => s + p.marks, 0);
    diffCount[q.diff]++;
  });
  const headerStats = `
    <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <div class="stat-card"><div class="stat-num">15</div><div class="stat-label">أسئلة رئيسية (41 فرعاً)</div></div>
      <div class="stat-card"><div class="stat-num">7</div><div class="stat-label">أسئلة الدرس الأول (${marksByLesson[1]} درجة)</div></div>
      <div class="stat-card"><div class="stat-num">8</div><div class="stat-label">أسئلة الدرس الثاني (${marksByLesson[2]} درجة)</div></div>
      <div class="stat-card"><div class="stat-num" style="font-size:14px;line-height:1.7">أساسي ${diffCount.basic} · متوسط ${diffCount.inter}<br>متقدم ${diffCount.adv} · ناقد ${diffCount.crit}</div><div class="stat-label">توزيع مستويات الصعوبة</div></div>
    </div>`;
  const rubric = `<section class="card rubric-card">
    <h3>${icon("shield")} منهجية التصحيح وقواعد الدرجات الجزئية</h3>
    <ul>${RUBRIC.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
  </section>`;
  const qs = QUESTIONS.map((q, qi) => {
    const qMarks = q.parts.reduce((s, p) => s + p.marks, 0);
    const lessonName = q.lesson === 1 ? EXAM.lesson1 : EXAM.lesson2;
    const partsHtml = q.parts.map((p) => `
      <div class="tk-part">
        <p class="tkp-text">الفرع (${p.letter}) — ${stripHtml(p.text)} <span class="tk-tag tk-marks">${fmtMark(p.marks)} ${p.marks === 1 ? "درجة" : "درجات"}</span></p>
        <p class="tk-kv"><b>الإجابة الصحيحة:</b> <span class="tk-answer">${stripHtml(p.answer)}</span></p>
        <p class="tk-kv"><b>البدائل المقبولة:</b> ${stripHtml(p.alts)}</p>
        <div class="tk-sol"><b>الحل المفصّل:</b> ${stripHtml(p.solution)}</div>
        <p class="tk-kv"><b>التفسير العلمي:</b> ${stripHtml(p.explain)}</p>
        <p class="tk-kv"><b>قاعدة الدرجات:</b> ${stripHtml(p.rubric)}</p>
        <p class="tk-kv"><b>المرجع:</b> ${q.lesson === 1 ? "الدرس الأول" : "الدرس الثاني"} — ${p.topic} — صفحة ${p.page} من الكتاب المطبوع.</p>
      </div>`).join("");
    return `<article class="tk-q">
      <div class="tk-q-head">
        <span class="tk-q-num">السؤال ${qi + 1}</span>
        <span class="tk-tag ${q.lesson === 1 ? "tk-lesson1" : "tk-lesson2"}">${q.lesson === 1 ? "الدرس 1" : "الدرس 2"}</span>
        <span class="tk-tag tk-diff">${DIFF_LABELS[q.diff]}</span>
        <span class="tk-tag tk-page">ص ${q.pages}</span>
        <span class="tk-tag tk-marks">${fmtMark(qMarks)} درجات</span>
      </div>
      <div class="tk-body">
        <p class="tk-kv"><b>نص السؤال:</b> ${stripHtml(q.lead)}</p>
        <p class="tk-kv"><b>الموضوع:</b> ${esc(q.topic)} — <b>المصدر:</b> ${esc(lessonName)}</p>
        ${q.diagram ? `<figure class="q-figure" style="margin:10px 0">${DIAGRAMS[q.diagram]}<figcaption>${esc(FIG_CAPTIONS[q.diagram] || "")}</figcaption></figure>` : ""}
        ${partsHtml}
      </div>
    </article>`;
  }).join("");
  return `
  ${contactStrip()}
  <main class="wrap">
    <section class="hero" style="padding:26px 28px">
      <span class="hero-kicker">${icon("shield")} منطقة المعلم — سرّية عن الطلاب</span>
      <h1 style="font-size:22px;margin:12px 0 4px">مفتاح الإجابات الكامل والحلول المفصّلة</h1>
      <p class="hero-sub">${esc(EXAM.title)} — ${esc(EXAM.lesson1)} · ${esc(EXAM.lesson2)}</p>
      <p class="hero-sub" style="font-size:12px;opacity:.8">${esc(EXAM.teacherNote)}</p>
    </header></section>
    <div class="mt-16">${headerStats}</div>
    ${rubric}
    <section class="mt-16">
      <h2 style="color:var(--navy);font-size:18px;margin:0 0 6px">${icon("file")} الأسئلة والإجابات النموذجية (15 سؤالاً)</h2>
      ${qs}
    </section>
    <div class="nav-bar" style="justify-content:center;margin:22px 0">
      <button type="button" class="btn btn-ghost" data-nav="welcome">عودة إلى صفحة البدء</button>
    </div>
  </main>
  ${pageFooter()}`;
}

/* ---------- التوجيه والإقلاع ---------- */
function renderApp() {
  const app = $("#app");
  let html = "";
  if (S.screen === "welcome") { stopStopwatch(); html = renderWelcome(); }
  else if (S.screen === "question") { html = renderQuestion(); startStopwatch(); }
  else if (S.screen === "review") { html = renderReview(); startStopwatch(); }
  else if (S.screen === "results") { stopStopwatch(); html = renderResults(); }
  else if (S.screen === "teacher") { stopStopwatch(); html = teacherAuthed ? renderTeacherArea() : renderTeacherGate(); }
  app.innerHTML = html;
  window.scrollTo({ top: 0 });
  bindScreenEvents();
}

function bindScreenEvents() {
  const app = $("#app");
  const nameInput = $("#student-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => { $("#name-error").textContent = ""; });
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryStart(); });
  }
  const startBtn = $("#btn-start");
  if (startBtn) startBtn.addEventListener("click", tryStart);
  const gateBtn = $("#btn-teacher-gate");
  if (gateBtn) gateBtn.addEventListener("click", () => { screen("teacher"); });
  const loginBtn = $("#btn-teacher-login");
  if (loginBtn) loginBtn.addEventListener("click", tryTeacherLogin);
  const passInput = $("#teacher-pass");
  if (passInput) passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryTeacherLogin(); });
  const reportBtn = $("#btn-report");
  if (reportBtn && S.report) reportBtn.addEventListener("click", () => downloadReport(S.report.text, S.report.filename));
  const retryBtn = $("#btn-retry");
  if (retryBtn) retryBtn.addEventListener("click", tryAgain);
  const resendBtn = $("#btn-resend");
  if (resendBtn) resendBtn.addEventListener("click", sendCurrentResult);

  /* أحداث التنقل */
  $$("[data-nav]", app).forEach((el) => {
    el.addEventListener("click", () => {
      const nav = el.getAttribute("data-nav");
      if (el.hasAttribute("disabled")) return;
      if (nav === "prev") goTo(Math.max(0, S.current - 1));
      else if (nav === "next") goTo(Math.min(QUESTIONS.length - 1, S.current + 1));
      else if (nav === "q") goTo(parseInt(el.getAttribute("data-qi"), 10));
      else if (nav === "review") screen("review");
      else if (nav === "submit") submitExam();
      else if (nav === "welcome") screen("welcome");
    });
  });

  /* أحداث الإجابات */
  $$('[data-action="mcq"]', app).forEach((el) => el.addEventListener("change", () => {
    S.answers[el.dataset.part] = parseInt(el.dataset.oi, 10);
    mutateAnswer();
  }));
  $$('[data-action="tf"]', app).forEach((el) => el.addEventListener("change", () => {
    S.answers[el.dataset.part] = el.dataset.val === "true";
    mutateAnswer();
  }));
  $$('[data-action="multi"]', app).forEach((el) => el.addEventListener("change", () => {
    const pid = el.dataset.part, oi = parseInt(el.dataset.oi, 10);
    const cur = new Set(Array.isArray(S.answers[pid]) ? S.answers[pid] : []);
    if (el.checked) cur.add(oi); else cur.delete(oi);
    S.answers[pid] = Array.from(cur).sort((x, y) => x - y);
    mutateAnswer();
  }));
  $$('[data-action="numeric"]', app).forEach((el) => el.addEventListener("input", () => {
    S.answers[el.dataset.part] = el.value;
    softUpdateProgress();
    saveState();
  }));
  $$('[data-action="ordering"]', app).forEach((el) => el.addEventListener("change", () => {
    const pid = el.dataset.part, i = parseInt(el.dataset.item, 10);
    const cur = Object.assign({}, S.answers[pid]);
    if (el.value === "") delete cur[i]; else cur[i] = parseInt(el.value, 10);
    S.answers[pid] = cur;
    mutateAnswer();
  }));
  $$('[data-action="matching"]', app).forEach((el) => el.addEventListener("change", () => {
    const pid = el.dataset.part, i = parseInt(el.dataset.field, 10);
    const cur = Object.assign({}, S.answers[pid]);
    if (el.value === "") delete cur[i]; else cur[i] = parseInt(el.value, 10);
    S.answers[pid] = cur;
    mutateAnswer();
  }));
}
function mutateAnswer() { saveState(); renderApp(); }
function softUpdateProgress() {
  const done = answeredPartsCount();
  const pct = Math.round((done / TOTAL_PARTS) * 100);
  const meta = $$(".progress-meta span")[1];
  if (meta) meta.innerHTML = `<span dir="ltr">${done} / ${TOTAL_PARTS}</span> — ${pct}%`;
  const fill = $(".progress-fill");
  if (fill) fill.style.width = pct + "%";
  const hint = $(".submit-hint");
  const hintNew = submitHintHtml();
  if (hint && hint.textContent.trim() !== "") { const div = document.createElement("div"); div.innerHTML = hintNew; hint.replaceWith(div.firstChild); }
  const btn = $("#btn-submit");
  if (btn) { if (allAnswered()) btn.removeAttribute("disabled"); else btn.setAttribute("disabled", ""); }
  saveState();
}
function goTo(qi) {
  S.current = qi; S.visited[qi] = true; S.screen = "question";
  saveState(); renderApp();
}
function screen(name) { S.screen = name; saveState(); renderApp(); }

function tryStart() {
  const name = ($("#student-name") ? $("#student-name").value : "").trim().replace(/\s+/g, " ");
  if (!name) {
    const err = $("#name-error");
    if (err) err.textContent = "الرجاء كتابة الاسم الثلاثي الكامل قبل البدء.";
    const inp = $("#student-name"); if (inp) inp.focus();
    return;
  }
  S.studentName = name;
  S.status = "active";
  S.startedAt = Date.now();
  S.current = 0; S.visited[0] = true;
  S.screen = "question";
  saveState();
  if (!S.startSoundPlayed) { S.startSoundPlayed = true; saveState(); playSound(AUDIO_START); }
  renderApp();
}
function tryTeacherLogin() {
  const val = $("#teacher-pass") ? $("#teacher-pass").value : "";
  if (val === TEACHER_PASS) { teacherAuthed = true; renderApp(); }
  else {
    const err = $("#teacher-error");
    if (err) err.textContent = "كلمة المرور غير صحيحة.";
  }
}
function tryAgain() {
  try {
    if (S.status === "submitted" && S.results) {
      const archive = { studentName: S.studentName, attemptId: S.attemptId, submittedAt: S.submittedAt, total: S.results.total };
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
    }
    localStorage.removeItem(STORE_KEY);
  } catch (e) {}
  teacherAuthed = false;
  S = freshState();
  saveState();
  renderApp();
}

/* ---------- الإقلاع ---------- */
(function boot() {
  const saved = loadState();
  if (saved && (saved.status === "active" || saved.status === "submitted")) {
    S = Object.assign(freshState(), saved);
    if (!Array.isArray(S.questionOrder) || S.questionOrder.length !== QUESTIONS.length) {
      S.questionOrder = QUESTIONS.map((q) => q.id);
    }
    if (S.status === "submitted") { S.screen = "results"; }
    else if (S.screen !== "question" && S.screen !== "review") { S.screen = "question"; }
  } else {
    S = freshState();
  }
  renderApp();
  initializeSheets();
})();

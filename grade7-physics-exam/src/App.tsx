// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_META, QUESTIONS, GRAPHS, TEACHER_PASSWORD, PART_LABELS } from "./exam-data.js";
import * as R from "./report.js";
import {
  buildAttemptReport,
  buildPayload,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./submit";

R.bindGraphs(GRAPHS);

// ============================================================================
// الحالة والتخزين (persistence)
// ============================================================================
const LS_KEY = "g7physics_u1l1_exam_v1";

type Session = {
  examId: string; version: number; attemptId: string;
  studentName: string;
  status: "intro" | "active" | "submitted";
  answers: Record<string, any>;
  current: number; visited: number[]; order: number[];
  startTs: number | null; submitTs: number | null; elapsedMs: number | null;
  sounds: { start: boolean; submit: boolean };
  results: null | {
    score: number; total: number; percent: number; counts: Record<string, number>;
    details: any[]; reportText: string; fileName: string;
    attemptId: string; startTs: number; submitTs: number;
  };
  /** حالة إرسال النتيجة إلى المعلّم (تُحفظ كي تبقى واضحة بعد إعادة فتح الصفحة). */
  delivery: SendStatus;
};

function freshSession(): Session {
  return {
    examId: EXAM_META.examId, version: EXAM_META.version,
    attemptId: "", studentName: "", status: "intro",
    answers: {}, current: 0, visited: [], order: QUESTIONS.map((_, i) => i),
    startTs: null, submitTs: null, elapsedMs: null,
    sounds: { start: false, submit: false },
    results: null,
    delivery: "idle",
  };
}

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return freshSession();
    const s = JSON.parse(raw);
    if (!s || s.examId !== EXAM_META.examId) return freshSession();
    return { ...freshSession(), ...s };
  } catch { return freshSession(); }
}

function persistSession(s: Session, onFail?: () => void) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); }
  catch { onFail?.(); }
}

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ============================================================================
// الأصوات المضمّنة (WebAudio — بدون ملفات خارجية)
// ============================================================================
let actx: AudioContext | null = null;
function tone(freq: number, t0: number, dur: number, vol = 0.12) {
  if (!actx) return;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function playStartSound() {
  try {
    actx = actx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = actx.currentTime;
    tone(659.25, t, 0.35, 0.10); tone(880.0, t + 0.16, 0.45, 0.10); // E5 -> A5
  } catch { /* تجاهل أي فشل — يستمر الاختبار */ }
}
function playSubmitSound() {
  try {
    actx = actx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = actx.currentTime;
    tone(523.25, t, 0.3, 0.11); tone(659.25, t + 0.14, 0.3, 0.11); tone(783.99, t + 0.28, 0.55, 0.11); // C5 E5 G5
  } catch { /* تجاهل */ }
}

// ============================================================================
///components مساعدة
// ============================================================================
function Rich({ text }: { text: string }) {
  const parts = String(text).split(/(⟦[^⟧]*⟧)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("⟦") && p.endsWith("⟧") ? (
          <span key={i} dir="ltr" className="math">{p.slice(1, -1)}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg className={`sparkle ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2c.7 5.2 4.8 9.3 10 10-5.2.7-9.3 4.8-10 10-.7-5.2-4.8-9.3-10-10 5.2-.7 9.3-4.8 10-10z" fill="currentColor" />
    </svg>
  );
}

function MotionGraph({ g }: { g: any }) {
  const W = 340, H = 250, M = 40;
  const px = (x: number) => M + (x / g.xMax) * (W - 2 * M);
  const py = (y: number) => H - M - (y / g.yMax) * (H - 2 * M);
  const xs: number[] = []; for (let x = 0; x <= g.xMax; x += g.xStep) xs.push(x);
  const ys: number[] = []; for (let y = 0; y <= g.yMax; y += g.yStep) ys.push(y);
  const pts = g.points.map(([x, y]: number[]) => [px(x), py(y)] as [number, number]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  if (g.kind === "curve") {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
    }
  } else {
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  }
  return (
    <figure className="graph-fig">
      <figcaption>{g.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={g.text} className="graph-svg">
        {ys.map((y) => (
          <g key={`y${y}`}>
            <line x1={M} x2={W - M + 6} y1={py(y)} y2={py(y)} className="grid" />
            <text x={M - 6} y={py(y) + 3.5} className="tick" textAnchor="end">{y}</text>
          </g>
        ))}
        {xs.map((x) => (
          <g key={`x${x}`}>
            <line x1={px(x)} x2={px(x)} y1={H - M} y2={M - 6} className="grid" />
            <text x={px(x)} y={H - M + 15} className="tick" textAnchor="middle">{x}</text>
          </g>
        ))}
        <line x1={M - 6} x2={W - M + 10} y1={H - M} y2={H - M} className="axis" markerEnd="url(#ah)" />
        <line x1={M} x2={M} y1={H - M + 6} y2={M - 10} className="axis" markerEnd="url(#av)" />
        <defs>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" className="arrow" /></marker>
          <marker id="av" markerWidth="8" markerHeight="8" refX="3" refY="6" orient="auto"><path d="M0,6 L3,0 L6,6 z" className="arrow" /></marker>
        </defs>
        <path d={d} className="line" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" className="dot" />)}
        <text x={(M + W - M) / 2 + 10} y={H - 8} className="axis-label">{g.xLabel}</text>
        <text transform={`rotate(-90 12 ${H / 2})`} x={12} y={H / 2} className="axis-label" textAnchor="middle">{g.yLabel}</text>
      </svg>
    </figure>
  );
}

// ============================================================================
// المكوّن الرئيسي
// ============================================================================
export default function App() {
  const [S, setS] = useState<Session>(loadSession);
  const SRef = useRef(S);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<"exam" | "review">("exam");
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [storageWarn, setStorageWarn] = useState(false);
  /** الحمولة المعروضة حالياً (يعيد زر «إعادة إرسال النتيجة» إرسالها)، والحمولة الجاري إرسالها الآن. */
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);

  useEffect(() => { SRef.current = S; persistSession(S, () => setStorageWarn(true)); }, [S]);

  /* ---------- إعادة إرسال النتائج المعلّقة من محاولات سابقة، بصمت، عند فتح الاختبار ---------- */
  useEffect(() => {
    void retryPending();
  }, []);

  /* ---------- إرسال النتيجة إلى المعلّم في الخلفية (لا ينتظره شيء في الواجهة) ---------- */
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setS((s) => (s.results?.attemptId === payload.attemptId ? { ...s, delivery: "sending" } : s));
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      // تُهمل النتيجة إن بدأ الطالب محاولة جديدة في هذه الأثناء
      if (outbox.current === payload) {
        setS((s) => (s.results?.attemptId === payload.attemptId ? { ...s, delivery: ok ? "success" : "failed" } : s));
      }
    });
  }, []);

  /* ---------- «إعادة إرسال النتيجة»: زر مستقل عن «محاولة جديدة» ---------- */
  const handleResend = useCallback(() => {
    if (outbox.current) sendResult(outbox.current);
    else if (SRef.current.results) {
      // بعد إعادة فتح الصفحة لا تكون الحمولة في الذاكرة: تُبنى من المحاولة المحفوظة نفسها،
      // بالمعرّف نفسه، فلا يُسجّل الخادم المحاولة مرّتين.
      const r = SRef.current;
      if (!r.results) return;
      const payload = buildPayload({
        attemptId: r.results.attemptId,
        studentName: r.studentName,
        startTs: r.results.startTs,
        submitTs: r.results.submitTs,
        questions: QUESTIONS,
        results: r.results,
        maxMarks: QUESTIONS.reduce((sum, q) => sum + q.marks, 0),
        reportText: r.results.reportText,
      });
      outbox.current = payload;
      sendResult(payload);
    }
  }, [sendResult]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const save = () => persistSession(SRef.current, () => setStorageWarn(true));
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", save);
    return () => {
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, []);

  const totalP = R.totalParts(QUESTIONS);
  const answered = R.answeredCount(QUESTIONS, S.answers);
  const remaining = totalP - answered;
  const elapsed = S.status === "active" && S.startTs ? Math.max(0, now - S.startTs) : S.elapsedMs || 0;
  const screen = S.status === "active" ? (view === "review" ? "review" : "exam") : S.status === "submitted" ? "results" : "intro";

  const startExam = (name: string) => {
    const ns: Session = {
      ...freshSession(),
      attemptId: "A" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      studentName: name.trim(), status: "active",
      startTs: Date.now(), current: 0, visited: [0],
      sounds: { start: true, submit: false },
    };
    setS(ns); persistSession(ns, () => setStorageWarn(true));
    setNow(Date.now());
    setView("exam");
    playStartSound();
  };

  const setAns = (id: string, val: any) =>
    setS((s) => (s.status === "active" ? { ...s, answers: { ...s.answers, [id]: val } } : s));

  const goto = (i: number) => {
    setView("exam");
    setS((s) => ({ ...s, current: i, visited: s.visited.includes(i) ? s.visited : [...s.visited, i] }));
  };

  const submitExam = () => {
    if (S.status !== "active" || remaining > 0) return;
    const res = R.gradeExam(QUESTIONS, S.answers);
    const submitTs = Date.now();
    const elapsedMs = S.startTs ? submitTs - S.startTs : 0;
    const fileName = R.makeFileName(S.studentName);
    // معرّف المحاولة التي بدأت عند الضغط على «ابدأ الاختبار»، ويُطبع في التقرير.
    const attemptId = S.attemptId || newAttemptId();
    const startTs = S.startTs ?? submitTs;
    const reportText = buildAttemptReport({
      questions: QUESTIONS, answers: S.answers, results: res,
      studentName: S.studentName, startTs, submitTs, attemptId,
    });
    const results = { ...res, reportText, fileName, attemptId, startTs, submitTs };
    const ns: Session = {
      ...S, status: "submitted", submitTs, elapsedMs, results, attemptId,
      delivery: "sending", sounds: { ...S.sounds, submit: true },
    };
    setS(ns); persistSession(ns, () => setStorageWarn(true));
    playSubmitSound();
    downloadText(fileName, reportText);

    // إرسال النتيجة إلى المعلّم: يبدأ بعد التنزيل وعرض النتيجة، ولا ينتظره أيٌّ منهما،
    // وأي خلل فيه لا يمسّ صفحة النتيجة ولا ملف التقرير.
    let payload: SubmissionPayload | null = null;
    try {
      payload = buildPayload({
        attemptId,
        studentName: S.studentName,
        startTs,
        submitTs,
        questions: QUESTIONS,
        results: res,
        maxMarks: QUESTIONS.reduce((sum, q) => sum + q.marks, 0),
        reportText,
      });
    } catch {
      payload = null;
    }
    outbox.current = payload;
    if (payload) sendResult(payload);
    else setS((s) => ({ ...s, delivery: "failed" }));
  };

  const tryAgain = () => {
    const ns = freshSession();
    outbox.current = null;
    sending.current = null;
    setS(ns); persistSession(ns, () => setStorageWarn(true));
    setView("exam");
  };

  const qAnswered = (q: any) => q.parts.every((p: any) => R.isAnswered(p, S.answers[p.id]));

  return (
    <div className="app">
      {storageWarn && <div className="storage-warn">تعذّر حفظ البيانات في هذا المتصفح؛ يستمر الاختبار لكن لا يمكن ضمان استرجاع العمل بعد التحديث.</div>}

      {screen === "intro" && <IntroScreen onStart={startExam} onTeacher={() => setTeacherOpen(true)} />}
      {screen === "exam" && (
        <ExamShell
          S={S} elapsed={elapsed} now={now}
          answered={answered} totalP={totalP} remaining={remaining}
          qAnswered={qAnswered}
          setAns={setAns} goto={goto} setView={setView}
          onSubmit={submitExam}
        />
      )}
      {screen === "review" && (
        <ReviewScreen S={S} elapsed={elapsed} answered={answered} totalP={totalP} remaining={remaining} qAnswered={qAnswered} goto={goto} setView={setView} onSubmit={submitExam} />
      )}
      {screen === "results" && S.results && (
        <ResultsScreen S={S} results={S.results} delivery={S.delivery} onResend={handleResend} onTryAgain={tryAgain} onTeacher={() => setTeacherOpen(true)} />
      )}

      {teacherOpen && <TeacherGate onClose={() => setTeacherOpen(false)} unlocked={teacherUnlocked} setUnlocked={setTeacherUnlocked} />}
    </div>
  );
}

// ============================================================================
// شاشة البداية
// ============================================================================
function IntroScreen({ onStart, onTeacher }: { onStart: (n: string) => void; onTeacher: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="screen intro-screen">
      <div className="intro-card">
        <Sparkle className="sp1" /><Sparkle className="sp2" /><Sparkle className="sp3" />
        <div className="intro-badge">✦ اختبار تفاعلي ✦</div>
        <h1 className="intro-title">{EXAM_META.title}</h1>
        <p className="intro-sub">{EXAM_META.subject} — {EXAM_META.grade}</p>
        <div className="meta-grid">
          <div><span>الوحدة</span><strong>{EXAM_META.unit}</strong></div>
          <div><span>الدرس</span><strong>{EXAM_META.lesson}</strong></div>
          <div><span>نطاق المحتوى</span><strong>{EXAM_META.pages}</strong></div>
          <div><span>عدد الأسئلة</span><strong>{EXAM_META.totalQuestions} سؤالاً</strong></div>
          <div><span>مجموع العلامات</span><strong>{EXAM_META.totalMarks} علامة</strong></div>
          <div><span>الزمن</span><strong>عداد تصاعدي HH:MM:SS</strong></div>
        </div>
        <label className="name-label" htmlFor="student-name">اسم الطالبة (مطلوب قبل البدء)</label>
        <input
          id="student-name" className="name-input" type="text" autoComplete="name"
          placeholder="اكتبي اسمك الكامل هنا…" value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onStart(name); }}
        />
        <button className="btn btn-primary btn-start" disabled={!name.trim()} onClick={() => onStart(name)}>
          ابدأ الاختبار ✦
        </button>
        <p className="intro-note">يبدأ العداد فقط بعد الضغط على «ابدأ الاختبار»، ويمكنكِ التنقل بين الأسئلة وتغيير إجاباتكِ قبل التسليم. وعند التسليم تُرسَل نتيجتك وإجاباتك إلى معلّمك.</p>
      </div>
      <button className="teacher-link" onClick={onTeacher}>منطقة المعلم</button>
    </div>
  );
}

// ============================================================================
// غلاف شاشة الاختبار (الهيدر + التنقل + لوحة الأسئلة)
// ============================================================================
function ExamShell(props: any) {
  const { S, elapsed, answered, totalP, remaining, qAnswered, setAns, goto, setView, onSubmit } = props;
  const qi = S.current;
  const q = QUESTIONS[qi];
  const pct = Math.round((answered / totalP) * 100);
  return (
    <div className="screen exam-screen">
      <header className="exam-header">
        <div className="header-row">
          <div className="header-title">
            <Sparkle className="sp-h" />
            <div>
              <strong>{EXAM_META.title}</strong>
              <span>{EXAM_META.grade} — {EXAM_META.unit}</span>
            </div>
          </div>
          <div className="timer-chip" title="الوقت المستغرق (عداد تصاعدي)">
            <span className="timer-icon">⏱</span>
            <span dir="ltr" className="timer-val">{R.fmtDuration(elapsed)}</span>
          </div>
        </div>
        <div className="progress-wrap">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <span className="progress-text">أُجيب عن {answered} من {totalP} جزءاً ({pct}٪)</span>
        </div>
        <nav className="palette" aria-label="لوحة التنقل بين الأسئلة">
          {QUESTIONS.map((qq: any, i: number) => (
            <button
              key={qq.id}
              className={`pal-btn ${i === qi ? "current" : ""} ${qAnswered(qq) ? "done" : ""}`}
              onClick={() => goto(i)}
              aria-label={`السؤال ${i + 1}${qAnswered(qq) ? " (مجاب عنه)" : ""}`}
            >
              {i + 1}{qAnswered(qq) ? <span className="pal-check">✓</span> : null}
            </button>
          ))}
        </nav>
      </header>

      <main className="exam-main">
        <QuestionCard q={q} index={qi} answers={S.answers} setAns={setAns} />
      </main>

      <footer className="exam-footer">
        <button className="btn btn-ghost" disabled={qi === 0} onClick={() => goto(qi - 1)}>← السؤال السابق</button>
        <button className="btn btn-ghost" onClick={() => setView("review")}>مراجعة الإجابات ✎</button>
        <button className="btn btn-ghost" disabled={qi === QUESTIONS.length - 1} onClick={() => goto(qi + 1)}>السؤال التالي →</button>
        <div className="submit-box">
          {remaining > 0 && <span className="remaining-note">يتبقّى {remaining} من {totalP} جزءاً للإجابة قبل التمكين</span>}
          <button className="btn btn-submit" disabled={remaining > 0} onClick={onSubmit}>تسليم الاختبار</button>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// بطاقة سؤال رئيسي مع أجزائه
// ============================================================================
function QuestionCard({ q, index, answers, setAns }: any) {
  return (
    <article className="qcard">
      <header className="qcard-head">
        <div className="qnum">السؤال {index + 1} من {QUESTIONS.length}</div>
        <div className="qmarks">{q.marks} علامة</div>
      </header>
      <h2 className="qtitle">{q.title}</h2>
      <p className="qinstruction"><Rich text={q.instruction} /></p>
      {q.intro && <p className="qintro"><Rich text={q.intro} /></p>}
      {q.graph && <MotionGraph g={GRAPHS[q.graph]} />}
      {q.graphs && (
        <div className="graphs-row">
          {q.graphs.map((gid: string, i: number) => (
            <div key={gid} className="graph-cell">
              <span className="graph-tag">{i === 0 ? "الرسم (أ)" : "الرسم (ب)"}</span>
              <MotionGraph g={GRAPHS[gid]} />
            </div>
          ))}
        </div>
      )}
      <div className="parts">
        {q.parts.map((p: any, i: number) => (
          <PartEditor key={p.id} part={p} label={PART_LABELS[i] || `${i + 1}`} value={answers[p.id]} setAns={setAns} />
        ))}
      </div>
    </article>
  );
}

function PartEditor({ part, label, value, setAns }: any) {
  return (
    <section className="part">
      <header className="part-head">
        <span className="part-label">({label})</span>
        <span className="part-prompt"><Rich text={part.prompt} /></span>
        <span className="part-marks">{part.marks} علامة</span>
      </header>
      <div className="part-body">
        {part.kind === "mc" && (
          <div className="options" role="radiogroup">
            {part.options.map((opt: string) => (
              <button
                key={opt} type="button"
                className={`opt-btn ${value === opt ? "selected" : ""}`}
                aria-pressed={value === opt}
                onClick={() => setAns(part.id, opt)}
              >
                <span className="opt-dot" />
                <Rich text={opt} />
              </button>
            ))}
          </div>
        )}
        {part.kind === "match" && (
          <select
            className="select-input"
            value={value || ""}
            onChange={(e) => setAns(part.id, e.target.value)}
            aria-label="اختر المصطلح المناسب"
          >
            <option value="">— اختر المصطلح —</option>
            {part.matchOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {part.kind === "tf" && (
          <div className="tf-wrap">
            <div className="tf-btns" role="radiogroup" aria-label="صح أم خطأ">
              <button type="button" className={`opt-btn small ${value?.judge === "صح" ? "selected" : ""}`} aria-pressed={value?.judge === "صح"} onClick={() => setAns(part.id, { ...(value || {}), judge: "صح" })}>صح ✓</button>
              <button type="button" className={`opt-btn small ${value?.judge === "خطأ" ? "selected" : ""}`} aria-pressed={value?.judge === "خطأ"} onClick={() => setAns(part.id, { ...(value || {}), judge: "خطأ" })}>خطأ ✗</button>
            </div>
            <textarea
              className="text-input"
              rows={2}
              placeholder="إذا كانت العبارة خاطئة، اكتب التصحيح هنا…"
              value={value?.correction || ""}
              onChange={(e) => setAns(part.id, { ...(value || {}), judge: value?.judge || "", correction: e.target.value })}
            />
          </div>
        )}
        {part.kind === "blank" && (
          <input
            type="text" className="text-input" autoComplete="off"
            placeholder="اكتب الكلمة أو العبارة الناقصة…"
            value={value || ""}
            onChange={(e) => setAns(part.id, e.target.value)}
          />
        )}
        {part.kind === "numeric" && (
          <div className="numeric-wrap">
            <input
              type="text" inputMode="decimal" className="text-input numeric-input" autoComplete="off"
              placeholder="القيمة العددية…"
              value={value || ""}
              onChange={(e) => setAns(part.id, e.target.value)}
            />
            <span dir="ltr" className="unit-chip">{part.numeric.unit}</span>
          </div>
        )}
        {part.kind === "text" && (
          <textarea
            className="text-input" rows={3} autoComplete="off"
            placeholder="اكتبي إجابتكِ باختصار ووضوح…"
            value={value || ""}
            onChange={(e) => setAns(part.id, e.target.value)}
          />
        )}
      </div>
    </section>
  );
}

// ============================================================================
// شاشة مراجعة الإجابات
// ============================================================================
function ReviewScreen(props: any) {
  const { S, elapsed, answered, totalP, remaining, qAnswered, goto, setView, onSubmit } = props;
  const pct = Math.round((answered / totalP) * 100);
  return (
    <div className="screen review-screen">
      <header className="exam-header">
        <div className="header-row">
          <div className="header-title"><Sparkle className="sp-h" /><div><strong>مراجعة الإجابات</strong><span>{EXAM_META.title}</span></div></div>
          <div className="timer-chip"><span className="timer-icon">⏱</span><span dir="ltr" className="timer-val">{R.fmtDuration(elapsed)}</span></div>
        </div>
        <div className="progress-wrap">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <span className="progress-text">أُجيب عن {answered} من {totalP} جزءاً ({pct}٪)</span>
        </div>
      </header>
      <main className="exam-main">
        <div className="review-list">
          {QUESTIONS.map((q: any, i: number) => {
            const done = q.parts.filter((p: any) => R.isAnswered(p, S.answers[p.id])).length;
            return (
              <div key={q.id} className={`review-item ${qAnswered(q) ? "done" : ""}`}>
                <button className="review-q-head" onClick={() => goto(i)}>
                  <span className="review-q-num">السؤال {i + 1}</span>
                  <span className="review-q-title">{q.title}</span>
                  <span className="review-q-state">{done}/{q.parts.length} — {q.marks} علامة</span>
                </button>
                <ul className="review-parts">
                  {q.parts.map((p: any, j: number) => (
                    <li key={p.id}>
                      <span className="rv-label">({PART_LABELS[j]})</span>
                      <span className="rv-answer">{R.partStudentText(p, S.answers[p.id])}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
      <footer className="exam-footer">
        <button className="btn btn-ghost" onClick={() => setView("exam")}>← العودة إلى الأسئلة</button>
        <div className="submit-box">
          {remaining > 0 && <span className="remaining-note">يتبقّى {remaining} من {totalP} جزءاً للإجابة قبل التمكين</span>}
          <button className="btn btn-submit" disabled={remaining > 0} onClick={onSubmit}>تسليم الاختبار</button>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// حالة إرسال النتيجة إلى المعلّم
// ============================================================================
const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال النتيجة إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed: "تعذّر إرسال النتيجة إلى معلّمك. نتيجتك محفوظة على هذا الجهاز، ويمكنك إعادة الإرسال.",
};

function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;
  return (
    <div className={`send-banner ${status}`} role="status" aria-live="polite" data-send-status={status}>
      <p className="send-text">{SEND_TEXT[status]}</p>
      {status === "failed" && (
        <button type="button" className="btn btn-ghost send-resend" onClick={onResend}>
          إعادة إرسال النتيجة
        </button>
      )}
    </div>
  );
}

// ============================================================================
// شاشة النتائج
// ============================================================================
function ResultsScreen({ S, results, delivery, onResend, onTryAgain, onTeacher }: any) {
  const c = results.counts;
  const qScores = QUESTIONS.map((q: any, i: number) => {
    const ds = results.details.filter((d: any) => d.qid === q.id);
    return { i, q, score: ds.reduce((a: number, d: any) => a + d.awarded, 0) };
  });
  const verdict =
    results.percent >= 85 ? "ممتازة!" : results.percent >= 70 ? "جيدة جداً" :
    results.percent >= 50 ? "مقبول — راجعي نقاط الضعف" : "تحتاجين إلى مراجعة الدرس جيداً";
  return (
    <div className="screen results-screen">
      <div className="results-card">
        <Sparkle className="sp1" /><Sparkle className="sp2" />
        <div className="intro-badge">✦ نتيجة الاختبار ✦</div>
        <h1 className="results-title">أحسنتِ يا {S.studentName} ✦</h1>
        <div className="score-hero">
          <div className="score-num">{results.score}<span className="score-total"> / {results.total}</span></div>
          <div className="score-pct">{results.percent.toFixed(1)}٪</div>
        </div>
        <p className="verdict">{verdict}</p>
        <div className="meta-grid">
          <div><span>المادة</span><strong>{EXAM_META.subject} — {EXAM_META.grade}</strong></div>
          <div><span>الدرس</span><strong>{EXAM_META.lesson}</strong></div>
          <div><span>الوقت المستغرق</span><strong dir="ltr">{R.fmtDuration(S.elapsedMs || 0)}</strong></div>
          <div><span>وقت التسليم</span><strong dir="ltr">{S.submitTs ? new Date(S.submitTs).toISOString() : "—"}</strong></div>
        </div>
        <div className="counts-row">
          <div className="count-chip ok"><b>{c.correct}</b><span>صحيحة</span></div>
          <div className="count-chip part"><b>{c.partial}</b><span>جزئية</span></div>
          <div className="count-chip bad"><b>{c.incorrect}</b><span>خاطئة</span></div>
          <div className="count-chip none"><b>{c.unanswered}</b><span>بدون إجابة</span></div>
        </div>
        <div className="q-bars">
          {qScores.map(({ i, q, score }: any) => (
            <div key={q.id} className="q-bar-row">
              <span className="q-bar-num">س{i + 1}</span>
              <div className="q-bar"><div className="q-bar-fill" style={{ width: `${(score / q.marks) * 100}%` }} /></div>
              <span className="q-bar-val">{score}/{q.marks}</span>
            </div>
          ))}
        </div>
        <SendBanner status={delivery} onResend={onResend} />
        <div className="results-actions">
          <button className="btn btn-primary" onClick={() => downloadText(results.fileName, results.reportText)}>تنزيل التقرير TXT ⬇</button>
          <button className="btn btn-ghost" onClick={onTryAgain}>محاولة جديدة (Try Again)</button>
        </div>
        <p className="intro-note">تم تنزيل تقرير TXT تلقائياً عند التسليم؛يمكنكِ تنزيله مرة أخرى من الزر أعلاه بنفس الاسم تماماً.</p>
      </div>
      <button className="teacher-link" onClick={onTeacher}>منطقة المعلم</button>
    </div>
  );
}

// ============================================================================
// منطقة المعلم (مفتاح الإجابات) — بوابة شكلية بكلمة المرور
// ============================================================================
function TeacherGate({ onClose, unlocked, setUnlocked }: any) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  if (!unlocked) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>منطقة المعلم — مفتاح الإجابات</h3>
          <p className="modal-note">هذه حماية شكلية فقط (صفحة static)، وليست مصادقة حقيقية أو تشفيراً.</p>
          <input type="password" className="text-input" placeholder="كلمة المرور…" value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (pw === TEACHER_PASSWORD) setUnlocked(true); else setErr(true); } }} />
          {err && <p className="err">كلمة المرور غير صحيحة</p>}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => { if (pw === TEACHER_PASSWORD) setUnlocked(true); else setErr(true); }}>دخول</button>
            <button className="btn btn-ghost" onClick={onClose}>إغلاق</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>مفتاح إجابات المعلم — {EXAM_META.title}</h3>
        <p className="modal-note">المحتوى من صفحات الكتاب 3–16 فقط. هذه القائمة لا تظهر للطالبة أثناء الاختبار، ولا تظهر في تقرير TXT.</p>
        <div className="key-rules">
          <strong>قواعد التصحيح:</strong>
          <ul>
            <li>اختيار من متعدد / وصل: العلامة كاملة عند المطابقة التامة، و0 عند عدم المطابقة.</li>
            <li>صح/خطأ: نصف العلامة للحكم الصحيح، والنصف الآخر للتصحيح الصحيح للعبارة الخاطئة.</li>
            <li>إكمال فراغ: مطابقة الكلمة بعد التطبيع (تشكيل، ألفات، أرقام).</li>
            <li>مسألة رقمية: ±0.01 عن القيمة الصحيحة بالوحدة المطلوبة في السؤال.</li>
            <li>إجابة نصية: مجموع أوزان الكلمات المفتاحية المطابقة (موضحة لكل جزء).</li>
          </ul>
        </div>
        {QUESTIONS.map((q: any, i: number) => (
          <div key={q.id} className="key-q">
            <h4>السؤال {i + 1} — {q.title} <span className="qmarks">({q.marks} علامة — {q.difficulty})</span></h4>
            <p className="key-ref">المصدر: {q.ref}</p>
            {q.graph && <p className="key-ref">الرسم: {GRAPHS[q.graph].text}</p>}
            {q.graphs && q.graphs.map((gid: string) => <p key={gid} className="key-ref">الرسم: {GRAPHS[gid].text}</p>)}
            <ol className="key-parts">
              {q.parts.map((p: any, j: number) => (
                <li key={p.id}>
                  <div className="key-prompt">({PART_LABELS[j]}) {p.prompt} <span className="qmarks">({p.marks})</span></div>
                  <div className="key-answer">الإجابة الصحيحة: <Rich text={R.partCorrectText(p)} /></div>
                  {p.kind === "blank" && <div className="key-alt">إجابات مقبولة بديلة: {p.accept.join(" ، ")}</div>}
                  {p.kind === "text" && <div className="key-alt">كلمات مفتاحية للتصحيح: {p.keywords.map((k: any) => `${k.alts.join("/")} (وزن ${k.w})`).join(" ، ")}</div>}
                  {p.kind === "tf" && !p.tfAnswer && <div className="key-alt">التصحيح مقبول إذا ذكر: {p.correctionKeywords.join(" ، ")}</div>}
                  <div className="key-exp">التفسير: {p.explanation}</div>
                  <div className="key-ref">المرجع: {p.ref}</div>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

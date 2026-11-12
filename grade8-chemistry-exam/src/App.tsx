import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_META, QUESTIONS, partMarksSum } from "./data/exam";
import type { Question } from "./data/exam";
import { QuestionView } from "./components/QuestionParts";
import { ContactStrip, ResultsPage, TeacherKeyModal } from "./components/Review";
import type { AnswerMap } from "./lib/grading";
import { countUnanswered, gradeExam, isPartAnswered } from "./lib/grading";
import type { AttemptState } from "./lib/storage";
import { clearAttempt, loadAttempt, saveAttempt } from "./lib/storage";
import { buildReport, downloadTextFile, formatDuration, reportFilename, validateReport } from "./lib/report";
import { buildPayload, newAttemptId, retryPending, sendWithRetry } from "./lib/submit";
import type { SendStatus, SubmissionPayload } from "./lib/submit";
import { playStartSound, playSubmissionSound } from "./lib/sound";

const TOTAL_SUBPARTS = QUESTIONS.reduce((s, q) => s + q.parts.length, 0);

/* ------------------------- deterministic shuffling ------------------------ */

const hash = (value: string): number => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const shuffled = <T,>(items: T[], rand: () => number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Interleaves the two lessons so no lesson is presented as a block. */
const makeQuestionOrder = (seed: string): string[] => {
  const rand = mulberry32(hash(`${seed}|order`));
  const groupOne = shuffled(["q1", "q2", "q3", "q4", "q5", "q6", "q15"], rand);
  const groupTwo = shuffled(["q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14"], rand);
  const out: string[] = [];
  let takeFirst = rand() < 0.5;
  while (groupOne.length || groupTwo.length) {
    if (takeFirst) {
      if (groupOne.length) out.push(groupOne.shift() as string);
      else if (groupTwo.length) out.push(groupTwo.shift() as string);
    } else if (groupTwo.length) out.push(groupTwo.shift() as string);
    else if (groupOne.length) out.push(groupOne.shift() as string);
    takeFirst = !takeFirst;
  }
  return out;
};

const makeShuffles = (seed: string): { optionOrder: Record<string, string[]>; itemOrder: Record<string, string[]> } => {
  const rand = mulberry32(hash(`${seed}|options`));
  const optionOrder: Record<string, string[]> = {};
  const itemOrder: Record<string, string[]> = {};
  QUESTIONS.forEach((q) => {
    q.parts.forEach((part) => {
      if ("options" in part) {
        optionOrder[part.id] = shuffled(part.options.map((o) => o.id), rand);
      }
      if (part.type === "match") {
        optionOrder[part.id] = shuffled(part.choices.map((o) => o.id), rand);
      }
      if (part.type === "order") {
        let ids = shuffled(part.items.map((i) => i.id), rand);
        if (ids.join("|") === part.correct.join("|")) ids = [...ids.slice(1), ids[0]];
        itemOrder[part.id] = ids;
      }
    });
  });
  return { optionOrder, itemOrder };
};

/* ------------------------------- helpers -------------------------------- */

const orderedQuestions = (attempt: AttemptState | null): Question[] => {
  if (!attempt) return QUESTIONS;
  const map = new Map(QUESTIONS.map((q) => [q.id, q]));
  const result = attempt.questionOrder.map((id) => map.get(id)).filter((q): q is Question => Boolean(q));
  return result.length === QUESTIONS.length ? result : QUESTIONS;
};

const getTimeParts = (seconds: number): string => formatDuration(seconds);

export default function App() {
  const initial = useMemo(
    () => loadAttempt(EXAM_META.examId, EXAM_META.version),
    [],
  );
  const [attempt, setAttempt] = useState<AttemptState | null>(initial.attempt);
  const attemptRef = useRef<AttemptState | null>(initial.attempt);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState<string | null>(
    initial.error
      ? "عُثر على بيانات محفوظة غير مكتملة، ولم يتم استرجاعها. يمكنك بدء محاولة جديدة بأمان."
      : null,
  );
  const [storageOk, setStorageOk] = useState(initial.available);
  const [navOpen, setNavOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  /** حمولة المحاولة المعروضة حالياً (يعيد زر «إعادة إرسال النتيجة» إرسالها)، والحمولة الجاري إرسالها الآن. */
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);

  const isExam = attempt?.status === "active";
  const isResults = attempt?.status === "submitted";
  const isWelcome = !attempt;
  const questions = useMemo(() => orderedQuestions(attempt), [attempt]);
  const safeIndex = attempt ? Math.min(Math.max(0, attempt.currentIndex), questions.length - 1) : 0;
  const currentQuestion = questions[safeIndex];
  const unanswered = useMemo(
    () => (attempt ? countUnanswered(attempt.answers, questions) : TOTAL_SUBPARTS),
    [attempt, questions],
  );
  const answeredCount = TOTAL_SUBPARTS - unanswered;
  const progress = Math.round((answeredCount / TOTAL_SUBPARTS) * 100);

  const elapsedSeconds = isResults
    ? attempt?.result?.elapsedSeconds ?? 0
    : isExam && attempt
      ? Math.max(0, Math.floor((now - attempt.startedAt) / 1000))
      : 0;

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    if (!isExam) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isExam, attempt?.attemptId]);

  useEffect(() => {
    const persist = () => {
      if (attemptRef.current) saveAttempt(attemptRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("beforeunload", persist);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", persist);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /* Restore a submitted result if an older/incomplete saved object lacks it. */
  useEffect(() => {
    if (!attempt || attempt.status !== "submitted" || attempt.result) return;
    const qs = orderedQuestions(attempt);
    const submittedAt = attempt.submittedAt ?? Date.now();
    const elapsed = Math.max(0, Math.floor((submittedAt - attempt.startedAt) / 1000));
    const summary = gradeExam(attempt.answers, qs);
    const text = buildReport({
      studentName: attempt.studentName,
      questions: qs,
      answers: attempt.answers,
      summary,
      startedAt: attempt.startedAt,
      submittedAt,
      elapsedSeconds: elapsed,
      attemptId: attempt.attemptId,
      optionOrder: attempt.optionOrder,
    });
    const next: AttemptState = {
      ...attempt,
      result: {
        summary,
        answers: attempt.answers,
        submittedAt,
        elapsedSeconds: elapsed,
        reportText: text,
        reportFilename: reportFilename(attempt.studentName),
      },
    };
    attemptRef.current = next;
    saveAttempt(next);
    setAttempt(next);
  }, [attempt]);

  /* ---------- عند تحميل التطبيق: إعادة إرسال النتائج المعلّقة من محاولات سابقة، بصمت ---------- */
  useEffect(() => {
    void retryPending();
  }, []);

  /* ---------- إرسال النتيجة إلى المعلّم في الخلفية (لا ينتظره شيء في الواجهة) ---------- */
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      // تُهمل النتيجة إن بدأ الطالب محاولة جديدة في هذه الأثناء
      if (outbox.current === payload) setSendStatus(ok ? "success" : "failed");
    });
  }, []);

  const handleResend = useCallback(() => {
    if (outbox.current) sendResult(outbox.current);
  }, [sendResult]);

  const commit = useCallback((next: AttemptState) => {
    attemptRef.current = next;
    setAttempt(next);
    const ok = saveAttempt(next);
    setStorageOk(ok);
  }, []);

  const mutate = useCallback((updater: (prev: AttemptState) => AttemptState) => {
    const base = attemptRef.current;
    if (!base) return;
    commit(updater(base));
  }, [commit]);

  const startExam = () => {
    if (attemptRef.current) return;
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 3) {
      setNameError("اسم الطالب إلزامي. اكتب الاسم الكامل قبل بدء الاختبار.");
      return;
    }
    const seed = `${Date.now()}-${Math.random()}`;
    const questionOrder = makeQuestionOrder(seed);
    const { optionOrder, itemOrder } = makeShuffles(seed);
    const next: AttemptState = {
      examId: EXAM_META.examId,
      version: EXAM_META.version,
      attemptId: newAttemptId(),
      studentName: trimmed,
      status: "active",
      startedAt: Date.now(),
      submittedAt: null,
      answers: {},
      currentIndex: 0,
      visited: [0],
      questionOrder,
      optionOrder,
      itemOrder,
      startSoundPlayed: true,
    };
    setNow(Date.now());
    setNameError("");
    setSubmitWarning("");
    setDownloadNote(null);
    commit(next);
    playStartSound();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gotoQuestion = (index: number) => {
    mutate((prev) => {
      const clamped = Math.min(Math.max(0, index), questions.length - 1);
      return {
        ...prev,
        currentIndex: clamped,
        visited: prev.visited.includes(clamped) ? prev.visited : [...prev.visited, clamped],
      };
    });
    setNavOpen(false);
    setReviewOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answerPart = (partId: string, value: unknown) => {
    mutate((prev) => ({ ...prev, answers: { ...prev.answers, [partId]: value } }));
    if (submitWarning) setSubmitWarning("");
  };

  const submitExam = () => {
    const state = attemptRef.current;
    if (!state || state.status === "submitted") return;
    const qs = orderedQuestions(state);
    const missing = countUnanswered(state.answers, qs);
    if (missing > 0) {
      setSubmitWarning(`لا يمكن التسليم: بقي ${missing} ${missing === 1 ? "جزء" : "أجزاء"} دون إجابة.`);
      return;
    }
    const submittedAt = Date.now();
    const elapsed = Math.max(0, Math.floor((submittedAt - state.startedAt) / 1000));
    const summary = gradeExam(state.answers, qs);
    const text = buildReport({
      studentName: state.studentName,
      questions: qs,
      answers: state.answers,
      summary,
      startedAt: state.startedAt,
      submittedAt,
      elapsedSeconds: elapsed,
      attemptId: state.attemptId,
      optionOrder: state.optionOrder,
    });
    const filename = reportFilename(state.studentName);
    const valid = validateReport(text, filename, qs);
    const frozenAnswers = JSON.parse(JSON.stringify(state.answers)) as AnswerMap;
    const next: AttemptState = {
      ...state,
      status: "submitted",
      submittedAt,
      answers: frozenAnswers,
      result: {
        summary,
        answers: frozenAnswers,
        submittedAt,
        elapsedSeconds: elapsed,
        reportText: text,
        reportFilename: filename,
      },
    };
    commit(next);
    playSubmissionSound();

    // إرسال النتيجة إلى المعلّم: يبدأ بعد عرض النتيجة ولا ينتظره أي شيء،
    // وأي خلل فيه لا يمسّ صفحة النتيجة ولا ملف التقرير الاحتياطي.
    try {
      const payload = buildPayload({
        attemptId: state.attemptId,
        studentName: state.studentName,
        startedAt: state.startedAt,
        submittedAt,
        elapsedSeconds: elapsed,
        questions: qs,
        answers: frozenAnswers,
        reportText: text,
      });
      outbox.current = payload;
      sendResult(payload);
    } catch {
      outbox.current = null;
      setSendStatus("failed");
    }

    let note: string;
    if (valid) {
      const triggered = downloadTextFile(text, filename);
      note = triggered
        ? "أُطلق طلب تنزيل التقرير تلقائيًا عند التسليم. إذا لم يظهر التنزيل (بسبب منع المتصفح أو إعداداته)، فاستخدم زر «تنزيل التقرير TXT» أدناه."
        : "لم نتمكّن من إطلاق التنزيل التلقائي في هذا المتصفح. استخدم زر «تنزيل التقرير TXT» أدناه للحصول على التقرير.";
    } else {
      note = "حُفظت النتيجة، لكن تعذّر التحقق الآلي من اكتمال التقرير التلقائي. استخدم زر «تنزيل التقرير TXT» للحصول عليه.";
    }
    setDownloadNote(note);
    setNavOpen(false);
    setReviewOpen(false);
    setSubmitWarning("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadBackup = () => {
    if (!attempt?.result) return;
    const triggered = downloadTextFile(attempt.result.reportText, attempt.result.reportFilename);
    setDownloadNote(
      triggered
        ? "أُطلق طلب تنزيل نسخة من التقرير. إن لم يظهر التنزيل، تحقّق من إعدادات التنزيل أو اسمح بها لهذه الصفحة."
        : "تعذّر بدء التنزيل في هذا المتصفح. جرّب متصفحًا آخر أو اسمح بالتنزيلات لهذه الصفحة.",
    );
  };

  const tryAgain = () => {
    clearAttempt();
    attemptRef.current = null;
    outbox.current = null;
    setSendStatus("idle");
    setAttempt(null);
    setName("");
    setNameError("");
    setNow(Date.now());
    setDownloadNote(null);
    setSubmitWarning("");
    setNavOpen(false);
    setReviewOpen(false);
    setNotice("بدأت محاولة جديدة. أدخل اسم الطالب للبدء من جديد.");
    setStorageOk(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="26" height="26">
                <circle cx="16" cy="16" r="4.2" fill="currentColor" />
                <ellipse cx="16" cy="16" rx="13" ry="5.4" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(30 16 16)" />
                <ellipse cx="16" cy="16" rx="13" ry="5.4" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-30 16 16)" />
                <circle cx="26" cy="10.5" r="1.8" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">
              <strong>الكيمياء البنيوية</strong>
              <small>الصف الثامن — الوحدة الأولى</small>
            </span>
          </div>
          <ContactStrip />
        </div>
      </header>

      <main className="main-area">
        {isWelcome && (
          <div className="welcome-page">
            <section className="welcome-hero">
              <div className="welcome-copy">
                <div className="hero-badges">
                  <span className="badge badge-solid">اختبار رسمي</span>
                  <span className="badge">الوحدة الأولى</span>
                  <span className="badge">الدرسان 1 و2</span>
                </div>
                <p className="eyebrow">اختبار شامل — 100 درجة</p>
                <h1>{EXAM_META.title}</h1>
                <p className="welcome-sub">
                  اختبار تحريري تفاعلي في بنية الذرّة، والعدد الذري والكتلي، والتوزيع الإلكتروني، والأيونات،
                  وتمثيل لويس، والنظائر، والروابط الأيونية والمشتركة.
                </p>
                <div className="hero-stats">
                  <div><strong dir="ltr">15</strong><span>سؤالًا رئيسيًا</span></div>
                  <div><strong dir="ltr">{TOTAL_SUBPARTS}</strong><span>جزءًا قابلًا للإجابة</span></div>
                  <div><strong dir="ltr">100</strong><span>درجة كاملة</span></div>
                  <div><strong>↑</strong><span>مؤقّت تصاعدي</span></div>
                </div>
                <div className="coverage-card">
                  <span className="coverage-label">تغطية الاختبار</span>
                  <p>{EXAM_META.unit}</p>
                  <p className="coverage-lessons">
                    الدرس الأول: الذرّة والعنصر (الصفحات 3–12) — الدرس الثاني: الروابط الكيميائية (الصفحات 13–17)
                  </p>
                  <p className="field-subject">المادة: {EXAM_META.subject} • الصف: {EXAM_META.grade}</p>
                </div>
              </div>

              <aside className="start-card">
                <div className="start-card-head">
                  <span className="start-icon" aria-hidden="true">✎</span>
                  <div>
                    <h2>بيانات الطالب</h2>
                    <p>يُطلب الاسم الكامل قبل ظهور السؤال الأول.</p>
                  </div>
                </div>
                <label className="name-label" htmlFor="student-name">الاسم الكامل للطالب <span className="required">*</span></label>
                <input
                  id="student-name"
                  className="text-input name-input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                  placeholder="اكتب اسمك الكامل هنا"
                  maxLength={80}
                  autoComplete="name"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "name-error" : undefined}
                  onKeyDown={(e) => { if (e.key === "Enter") startExam(); }}
                />
                {nameError && <p className="error-text" id="name-error" role="alert">{nameError}</p>}
                <button type="button" className="btn btn-primary btn-start" onClick={startExam}>
                  بدء الاختبار
                </button>
                <ul className="start-notes">
                  <li>لا يبدأ المؤقّت إلا بعد بدء الاختبار.</li>
                  <li>تُحفظ الإجابات تلقائيًا في هذا المتصفح.</li>
                  <li>لا توجد إجابة صحيحة أو تلميح قبل التسليم.</li>
                </ul>
                {!storageOk && (
                  <p className="storage-warning" role="status">
                    تعذّر الوصول إلى التخزين المحلي. قد لا تُستعاد الإجابات بعد تحديث الصفحة، ولن ندّعي أنها محفوظة.
                  </p>
                )}
              </aside>
            </section>

            {notice && <div className="notice-banner" role="status">{notice}</div>}

            <section className="guidelines-grid">
              <div className="info-card">
                <h3>قبل أن تبدأ</h3>
                <ul>
                  <li>اقرأ السؤال والأجزاء التابعة له بعناية قبل الإجابة.</li>
                  <li>جميع الأجزاء إلزامية، ويُعطّل زر التسليم حتى تكتمل.</li>
                  <li>الأسئلة موزّعة على الدرسين دون ترتيب الدروس.</li>
                  <li>يمكنك التنقل بين الأسئلة وتعديل أي إجابة قبل التسليم.</li>
                </ul>
              </div>
              <div className="info-card">
                <h3>الأدوات والخصوصية</h3>
                <ul>
                  <li>مؤقّت تصاعدي يحفظ زمن البدء الفعلي حتى بعد تحديث الصفحة.</li>
                  <li>تُنزَّل نسخة TXT من التقرير بدءًا من لحظة التسليم.</li>
                  <li>تُرسل نتيجتك وتقريرك إلى معلّمك عند التسليم، وتُحفظ نسخة محليًا في متصفحك.</li>
                  <li>تُستعاد المحاولة تلقائيًا إذا حدّثت الصفحة قبل التسليم.</li>
                </ul>
              </div>
              <div className="info-card teacher-entry-card">
                <h3>بوابة المعلم</h3>
                <p>مفتاح الإجابات ومعايير التصحيح متاح للمعلم بكلمة مرور، ومخفي عن الطالب.</p>
                <button type="button" className="btn btn-outline" onClick={() => setTeacherOpen(true)}>دخول بوابة المعلم</button>
                <p className="small-note">حماية واجهة بسيطة داخل ملف ثابت، وليست تشفيرًا أو مصادقة أمنية.</p>
              </div>
            </section>
          </div>
        )}

        {isExam && attempt && currentQuestion && (
          <div className="exam-page">
            <div className="exam-topline">
              <div className="exam-student">
                <span className="eyebrow">الطالب</span>
                <strong>{attempt.studentName}</strong>
              </div>
              <div className="exam-time">
                <span className="eyebrow">الزمن المستغرق</span>
                <strong className="mono ltr" dir="ltr">{getTimeParts(elapsedSeconds)}</strong>
              </div>
              <div className="exam-progress-copy">
                <span className="eyebrow">التقدّم</span>
                <strong dir="ltr">{answeredCount} / {TOTAL_SUBPARTS}</strong>
              </div>
            </div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="نسبة الأجزاء المجابة">
              <span style={{ width: `${progress}%` }} />
            </div>
            {!storageOk && (
              <p className="storage-warning" role="status">
                تعذّر حفظ الإجابات تلقائيًا في هذا المتصفح. تابع الاختبار، لكن لا نضمن استعادتها بعد تحديث الصفحة.
              </p>
            )}

            <div className="exam-layout">
              <aside className={`question-nav ${navOpen ? "open" : ""}`}>
                <div className="nav-head">
                  <h2>لائحة الأسئلة</h2>
                  <button type="button" className="icon-btn nav-close" onClick={() => setNavOpen(false)} aria-label="إغلاق لائحة الأسئلة">×</button>
                </div>
                <p className="nav-sub">{answeredCount} من {TOTAL_SUBPARTS} جزءًا تمت الإجابة عنه</p>
                <div className="nav-grid">
                  {questions.map((q, idx) => {
                    const done = q.parts.filter((p) => isPartAnswered(p, attempt.answers[p.id])).length;
                    const state = done === 0 ? "empty" : done === q.parts.length ? "done" : "partial";
                    return (
                      <button
                        key={q.id}
                        type="button"
                        className={`nav-cell ${state} ${idx === safeIndex ? "current" : ""}`}
                        onClick={() => gotoQuestion(idx)}
                        aria-current={idx === safeIndex ? "step" : undefined}
                        aria-label={`السؤال ${idx + 1}: ${q.title}${state === "done" ? " — مكتمل" : ""}`}
                      >
                        <span dir="ltr">{idx + 1}</span>
                        <small>{done}/{q.parts.length}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="nav-legend">
                  <span><i className="legend-dot done" /> مكتمل</span>
                  <span><i className="legend-dot partial" /> جزئي</span>
                  <span><i className="legend-dot empty" /> لم يبدأ</span>
                </div>
                <button type="button" className="btn btn-outline nav-review" onClick={() => setReviewOpen(true)}>
                  مراجعة الإجابات
                </button>
                <div className="nav-contact">
                  <span>للاستفسار</span>
                  <a href={EXAM_META.contact.whatsapp} target="_blank" rel="noopener noreferrer">واتساب المهندس سومر شاهين</a>
                </div>
              </aside>

              <div className="exam-main">
                <button type="button" className="mobile-nav-toggle" onClick={() => setNavOpen(true)}>
                  <span>لائحة الأسئلة</span>
                  <strong dir="ltr">السؤال {safeIndex + 1} / 15</strong>
                </button>

                <QuestionView
                  question={currentQuestion}
                  number={safeIndex + 1}
                  answers={attempt.answers}
                  onAnswer={answerPart}
                  optionOrder={attempt.optionOrder}
                  itemOrder={attempt.itemOrder}
                />

                <div className="exam-nav-buttons">
                  <button type="button" className="btn btn-outline" disabled={safeIndex === 0} onClick={() => gotoQuestion(safeIndex - 1)}>
                    السابق
                  </button>
                  <span className="nav-position">السؤال <b dir="ltr">{safeIndex + 1}</b> من <b dir="ltr">15</b></span>
                  <button type="button" className="btn btn-primary" disabled={safeIndex === questions.length - 1} onClick={() => gotoQuestion(safeIndex + 1)}>
                    التالي
                  </button>
                </div>

                <div className="submit-panel">
                  <div className="submit-copy">
                    <h3>إنهاء الاختبار</h3>
                    <p>تُجمَّد الإجابات عند التسليم، وتُظهر النتيجة والتقرير مباشرة.</p>
                    {unanswered > 0 ? (
                      <p className="submit-warning" role="status">
                        تنبيه: بقي {unanswered} {unanswered === 1 ? "جزء" : "أجزاء"} دون إجابة. أكملها لتفعيل زر التسليم.
                      </p>
                    ) : (
                      <p className="ready-line">اكتملت جميع الأجزاء. يمكنك تسليم الاختبار.</p>
                    )}
                    {submitWarning && <p className="submit-warning" role="alert">{submitWarning}</p>}
                  </div>
                  <div className="submit-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setReviewOpen(true)}>مراجعة الإجابات</button>
                    <button type="button" className="btn btn-submit" onClick={submitExam} disabled={unanswered > 0} aria-disabled={unanswered > 0}>
                      تسليم الاختبار
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isResults && attempt?.result && (
          <ResultsPage
            studentName={attempt.studentName}
            questions={questions}
            answers={attempt.result.answers}
            summary={attempt.result.summary}
            elapsedSeconds={attempt.result.elapsedSeconds}
            submittedAt={attempt.result.submittedAt}
            downloadNote={downloadNote}
            sendStatus={sendStatus}
            onResend={handleResend}
            onDownloadReport={downloadBackup}
            onTryAgain={tryAgain}
            onTeacher={() => setTeacherOpen(true)}
          />
        )}

        {isResults && !attempt?.result && (
          <div className="loading-results">جارٍ استعادة نتيجة المحاولة المحفوظة…</div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>{EXAM_META.title}</strong>
            <p>{EXAM_META.unit} • {EXAM_META.grade} • {EXAM_META.subject}</p>
          </div>
          <ContactStrip />
          {!isExam && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setTeacherOpen(true)}>
              بوابة المعلم
            </button>
          )}
        </div>
        <p className="footer-note">
          اختبار إلكتروني يعمل في المتصفح، وتُرسل النتيجة إلى معلّمك عند التسليم. مجموع الدرجات 100.
        </p>
      </footer>

      {reviewOpen && attempt && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setReviewOpen(false); }} onKeyDown={(e) => { if (e.key === "Escape") setReviewOpen(false); }}>
          <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <header className="modal-head">
              <div>
                <p className="eyebrow">قبل التسليم</p>
                <h2 id="review-title">مراجعة الإجابات</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setReviewOpen(false)} aria-label="إغلاق">×</button>
            </header>
            <p className="review-intro">
              تعرض هذه اللائحة حالة الأجزاء فقط، دون كشف صحة الإجابات. الأجزاء غير المكتملة: <b dir="ltr">{unanswered}</b>.
            </p>
            <div className="review-list">
              {questions.map((q, idx) => {
                const done = q.parts.filter((p) => isPartAnswered(p, attempt.answers[p.id])).length;
                const available = q.parts.reduce((s, p) => s + p.marks, 0);
                return (
                  <button key={q.id} type="button" className={`review-list-row ${idx === safeIndex ? "current" : ""}`} onClick={() => gotoQuestion(idx)}>
                    <span className="review-num" dir="ltr">{idx + 1}</span>
                    <span className="review-text">
                      <strong>{q.title}</strong>
                      <small>{done} من {q.parts.length} أجزاء مكتملة • {partMarksSum(q)} درجة</small>
                    </span>
                    <span className={`review-state ${done === 0 ? "empty" : done === q.parts.length ? "done" : "partial"}`}>
                      {done === 0 ? "لم يبدأ" : done === q.parts.length ? "مكتمل" : "جزئي"}
                    </span>
                    <span className="visually-hidden">{available} درجة متاحة</span>
                  </button>
                );
              })}
            </div>
            <div className="review-modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setReviewOpen(false)}>متابعة الاختبار</button>
            </div>
          </div>
        </div>
      )}

      {navOpen && isExam && <button type="button" className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="إغلاق القائمة" />}
      {teacherOpen && <TeacherKeyModal onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}

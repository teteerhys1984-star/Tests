/**
 * جذر التطبيق: يربط الشاشات (ترحيب · أسئلة · مراجعة · نتيجة) + بوابة المعلّم.
 *
 * مبادئ مقصودة:
 *  · لا يُعرَض أي نصّ إجابة أو معيار تصحيح قبل التسليم أو قبل دخول المعلّم بكلمة المرور:
 *    التصحيح يجري بعد التسليم فقط، ودليل المعلّم خلف البوابة. (تنبيه صريح: النشر هنا
 *    ملف HTML واحد مكتفٍ بذاته، فالكود يتضمّن المفتاح كما في الاختبارات المرجعية؛ الفصل
 *    حماية عرض وليست تشفيراً.)
 *  · المحاولة تُحفظ في localStorage بمفتاح معزول لهذا الاختبار، وتُستعاد عند العودة.
 *  · التسليم: تصحيح ← تقرير ← تنزيل TXT ← صفحة نتيجة ← إرسال في الخلفية (لا ينتظره شيء).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_ID, TOTAL_MARKS } from "./config";
import { questions } from "./data/questions";
import { countParts, gradeExam, isExamComplete, type AnswerKey, type ExamResult, type Responses } from "./lib/grading";
import {
  clearAttempt,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
  type Attempt,
} from "./lib/persistence";
import {
  buildPayload,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./exam/submit";
import {
  buildReport,
  reportFilename,
  summarize,
  triggerDownload,
  validateReport,
  type AttemptMeta,
} from "./lib/report";
import { playStartSound, playSubmitSound, primeAudio, resetSounds, setSoundEnabled } from "./lib/audio";
import { formatDuration } from "./lib/time";
import { Footer } from "./components/Chrome";
import { Welcome } from "./screens/Welcome";
import { Exam } from "./screens/Exam";
import { Review } from "./screens/Review";
import { Results } from "./screens/Results";
import { Teacher } from "./screens/Teacher";

type Phase = "welcome" | "exam" | "review" | "results";

const totalParts = countParts(questions);

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [restorable, setRestorable] = useState<Attempt | null>(null);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [meta, setMeta] = useState<AttemptMeta | null>(null);
  const [reportText, setReportText] = useState("");
  const [autoDownloaded, setAutoDownloaded] = useState<boolean | null>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attemptRef = useRef<Attempt | null>(null);
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);
  const startSoundDone = useRef(false);

  /* ---------- استعادة المحاولة المحفوظة (بلا بدء تلقائي) ---------- */
  useEffect(() => {
    const stored = loadAttempt(EXAM_ID, questions.length);
    const storedMuted = loadMuted();
    setMuted(storedMuted);
    setSoundEnabled(!storedMuted);
    if (stored) setRestorable(stored);
    // إعادة إرسال أي حمولة معلّقة لهذا الاختبار وحده (mock fetch في الاختبارات)
    void retryPending();
  }, []);

  const commit = useCallback((next: Attempt) => {
    attemptRef.current = next;
    saveAttempt(next);
    setAttempt(next);
  }, []);

  /* ---------- المؤقّت التصاعدي المعتمد على الطوابع الزمنية ---------- */
  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const tick = () => setElapsedMs(Date.now() - attempt.startedAt);
    tick();
    const interval = window.setInterval(tick, 1000);
    const onVisible = () => tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [attempt]);

  /* ---------- الإرسال في الخلفية ---------- */
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      if (outbox.current === payload) setSendStatus(ok ? "success" : "failed");
    });
  }, []);

  const handleResend = useCallback(() => {
    if (outbox.current) sendResult(outbox.current);
  }, [sendResult]);

  const resetResultState = useCallback(() => {
    setResult(null);
    setMeta(null);
    setReportText("");
    setAutoDownloaded(null);
    setSendStatus("idle");
    outbox.current = null;
    setSubmitting(false);
  }, []);

  /* ---------- بدء محاولة جديدة ---------- */
  const handleStart = useCallback(
    (studentName: string) => {
      primeAudio();
      resetSounds();
      startSoundDone.current = false;
      resetResultState();
      const startedAt = Date.now();
      const next: Attempt = {
        version: 1,
        examId: EXAM_ID,
        status: "in_progress",
        studentName,
        responses: {},
        questionIndex: 0,
        startedAt,
      };
      setRestorable(null);
      commit(next);
      setElapsedMs(0);
      setPhase("exam");
      window.scrollTo({ top: 0, behavior: "auto" });
      if (!startSoundDone.current) {
        startSoundDone.current = true;
        playStartSound();
      }
    },
    [commit, resetResultState],
  );

  /* ---------- استعادة محاولة محفوظة ---------- */
  const handleResume = useCallback(() => {
    const stored = restorable;
    if (!stored) return;
    commit(stored);
    setElapsedMs(Date.now() - stored.startedAt);
    setRestorable(null);
    if (stored.status === "in_progress") {
      setPhase("exam");
      return;
    }
    // محاولة مسلَّمة سابقاً: تصحيح فوري وعرض النتيجة بدون إرسال جديد
    void import("./data/answerKey").then(({ answerKey }) => {
      const key = answerKey as AnswerKey;
      const graded = gradeExam(questions, stored.responses, key);
      const attemptMeta: AttemptMeta = {
        studentName: stored.studentName,
        startAt: new Date(stored.startedAt),
        submitAt: new Date(stored.finishedAt ?? stored.startedAt),
        elapsedMs: Math.max(0, (stored.finishedAt ?? stored.startedAt) - stored.startedAt),
      };
      setResult(graded);
      setMeta(attemptMeta);
      setReportText(buildReport(questions, attemptMeta, graded, stored.responses, key));
      setAutoDownloaded(null);
      setSendStatus("idle");
      setPhase("results");
    });
  }, [commit, restorable]);

  const handleDiscard = useCallback(() => {
    clearAttempt();
    attemptRef.current = null;
    setRestorable(null);
    setAttempt(null);
    resetResultState();
    setPhase("welcome");
  }, [resetResultState]);

  /* ---------- حفظ الإجابات والتنقّل ---------- */
  const setAnswer = useCallback(
    (field: string, value: string) => {
      const current = attemptRef.current;
      if (!current || current.status !== "in_progress") return;
      commit({ ...current, responses: { ...current.responses, [field]: value } });
    },
    [commit],
  );

  const handleNavigate = useCallback(
    (index: number) => {
      const current = attemptRef.current;
      if (!current || current.status !== "in_progress") return;
      if (current.questionIndex === index) return;
      commit({ ...current, questionIndex: index });
    },
    [commit],
  );

  const handleReview = useCallback(() => {
    const current = attemptRef.current;
    if (!current || current.status !== "in_progress") return;
    setPhase("review");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const handleBackToQuestion = useCallback(
    (index: number) => {
      const current = attemptRef.current;
      if (!current) return;
      commit({ ...current, questionIndex: Math.max(0, Math.min(questions.length - 1, index)) });
      setPhase("exam");
    },
    [commit],
  );

  /* ---------- التسليم ---------- */
  const handleSubmit = useCallback(() => {
    const current = attemptRef.current;
    if (!current || current.status !== "in_progress" || submitting) return;
    if (!isExamComplete(questions, current.responses)) return;

    setSubmitting(true);
    const submitAt = new Date();
    const elapsed = Math.max(0, submitAt.getTime() - current.startedAt);
    const frozen: Responses = { ...current.responses };
    const submitted: Attempt = { ...current, status: "submitted", finishedAt: submitAt.getTime(), responses: frozen };
    commit(submitted);
    setElapsedMs(elapsed);

    void import("./data/answerKey").then(({ answerKey }) => {
      const key = answerKey as AnswerKey;
      const graded = gradeExam(questions, frozen, key);
      const attemptMeta: AttemptMeta = {
        studentName: current.studentName,
        startAt: new Date(current.startedAt),
        submitAt,
        elapsedMs: elapsed,
      };
      const report = buildReport(questions, attemptMeta, graded, frozen, key);
      const filename = reportFilename(current.studentName);
      const missing = validateReport(report, questions, attemptMeta, graded);
      const downloaded = missing.length === 0 ? triggerDownload(report, filename) : false;

      playSubmitSound();
      setResult(graded);
      setMeta(attemptMeta);
      setReportText(report);
      setAutoDownloaded(downloaded);
      setSendStatus("idle");
      setPhase("results");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "auto" });

      try {
        const payload = buildPayload({
          attemptId: newAttemptId(),
          meta: attemptMeta,
          order: questions,
          answers: frozen,
          result: graded,
          reportText: report,
          key,
        });
        outbox.current = payload;
        sendResult(payload);
      } catch {
        outbox.current = null;
        setSendStatus("failed");
      }
    });
  }, [commit, sendResult, submitting]);

  /* ---------- محاولة جديدة بعد التسليم ---------- */
  const handleRetry = useCallback(() => {
    resetSounds();
    startSoundDone.current = false;
    clearAttempt();
    attemptRef.current = null;
    setAttempt(null);
    resetResultState();
    setElapsedMs(0);
    setPhase("welcome");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [resetResultState]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      saveMuted(next);
      setSoundEnabled(!next);
      return next;
    });
  }, []);

  const summary = useMemo(
    () => (result ? summarize(questions, attempt?.responses ?? {}, result) : null),
    [result, attempt],
  );

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      {phase === "welcome" && (
        <Welcome
          storedAttempt={restorable}
          onStart={handleStart}
          onResume={handleResume}
          onDiscard={handleDiscard}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "exam" && attempt && attempt.status === "in_progress" && (
        <Exam
          studentName={attempt.studentName}
          questions={questions}
          answers={attempt.responses}
          setAnswer={setAnswer}
          elapsedMs={formatDuration(elapsedMs)}
          totalParts={totalParts}
          initialIndex={attempt.questionIndex}
          onNavigate={handleNavigate}
          onReview={handleReview}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "review" && attempt && attempt.status === "in_progress" && (
        <Review
          studentName={attempt.studentName}
          questions={questions}
          answers={attempt.responses}
          elapsedMs={elapsedMs}
          totalParts={totalParts}
          submitting={submitting}
          onBackToQuestion={handleBackToQuestion}
          onSubmit={handleSubmit}
          onExit={() => setPhase("exam")}
        />
      )}

      {phase === "results" && !teacherOpen && meta && result && summary && attempt && (
        <Results
          meta={meta}
          questions={questions}
          answers={attempt.responses}
          result={result}
          reportText={reportText}
          autoDownloaded={autoDownloaded}
          sendStatus={sendStatus}
          onResend={handleResend}
          onRetry={handleRetry}
          onTeacher={() => setTeacherOpen(true)}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {teacherOpen && <Teacher onClose={() => setTeacherOpen(false)} />}

      <Footer onTeacher={() => setTeacherOpen(true)} />

      <p className="sr-only" data-testid="exam-meta">
        {EXAM_ID} · {TOTAL_MARKS} علامة · {formatDuration(elapsedMs)}
      </p>
    </div>
  );
}

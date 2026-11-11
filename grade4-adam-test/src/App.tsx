import { useEffect, useRef, useState } from "react";
import { SHEETS_TOKEN } from "./config";
import {
  EXAM_ID,
  EXAM_VERSION,
  QUESTIONS,
  STORAGE_KEY,
} from "./exam/data";
import { gradeAttempt, unansweredSubparts } from "./exam/grade";
import { buildReport, buildReportFilename, downloadReport, validateReport } from "./exam/report";
import { clearAttempt, loadAttempt, makeAttemptId, saveAttempt } from "./exam/storage";
import { playStartSound, playSubmitSound } from "./exam/sounds";
import {
  buildPayload,
  pendingPayload,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./exam/submit";
import type { AnswerValue, Attempt, DeliveryState } from "./exam/types";
import { SiteFooter, SiteTop } from "./components/Chrome";
import { ExamView } from "./components/ExamView";
import { ReviewView } from "./components/ReviewView";
import { ResultsView } from "./components/ResultsView";
import { Welcome } from "./components/Welcome";
import { TeacherKey } from "./components/TeacherKey";

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildQuestionOrder(): string[] {
  const canonical = QUESTIONS.map((q) => q.id);
  let order = shuffle(canonical);
  if (order.every((id, index) => id === canonical[index])) {
    order = [...order.slice(1), order[0]];
  }
  return order;
}

function buildOptionOrders(): Record<string, number[]> {
  const orders: Record<string, number[]> = {};
  for (const question of QUESTIONS) {
    const mcq = question.subparts.find((sub) => sub.kind === "mcq");
    if (!mcq || mcq.kind !== "mcq") continue;
    const indices = mcq.options.map((_, index) => index);
    let shuffled = shuffle(indices);
    if (shuffled.length > 1 && shuffled.every((v, i) => v === indices[i])) {
      shuffled = [...shuffled.slice(1), shuffled[0]];
    }
    orders[question.id] = shuffled;
  }
  return orders;
}

export default function App() {
  const [initialLoad] = useState(() => loadAttempt());
  const [attempt, setAttempt] = useState<Attempt | null>(initialLoad.attempt);
  const attemptRef = useRef<Attempt | null>(initialLoad.attempt);
  const [warning, setWarning] = useState<string | null>(initialLoad.warning);
  const [autosaveHealthy, setAutosaveHealthy] = useState<boolean>(initialLoad.storageAvailable);
  const [reviewing, setReviewing] = useState(
    Boolean(initialLoad.attempt?.phase === "exam" && initialLoad.attempt.reviewing)
  );
  const [now, setNow] = useState(() => Date.now());
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"ok" | "failed" | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitGuard = useRef(false);
  const storageAvailable = initialLoad.storageAvailable;
  // Delivery of the result to the teacher. A submitted attempt restored after a refresh shows
  // "sent" when the server had confirmed it; otherwise it is sent again (see the effect below).
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    const restored = initialLoad.attempt;
    if (!restored || restored.phase !== "results") return "idle";
    return restored.delivery === "sent" ? "success" : "sending";
  });
  // Payload of the attempt on the results page (what "resend" sends), and the one being sent now.
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);

  function persist(next: Attempt): void {
    if (!storageAvailable) {
      setAutosaveHealthy(false);
      return;
    }
    const result = saveAttempt(next);
    setAutosaveHealthy(result.ok);
    if (!result.ok) {
      setWarning(result.error ?? "تعذّر الحفظ التلقائي في هذا المتصفح.");
    }
  }

  function commit(updater: (current: Attempt) => Attempt): void {
    const current = attemptRef.current;
    if (!current) return;
    const next = updater(current);
    attemptRef.current = next;
    setAttempt(next);
    persist(next);
  }

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // Remembers the outcome in the saved attempt, so a refresh of the results page does not send again.
  function recordDelivery(attemptId: string, delivery: DeliveryState): void {
    const current = attemptRef.current;
    if (!current || current.phase !== "results" || current.attemptId !== attemptId) return;
    if (current.delivery === delivery) return;
    const next: Attempt = { ...current, delivery };
    attemptRef.current = next;
    setAttempt(next);
    persist(next);
  }

  // Sends in the background; nothing in the interface waits for it.
  function sendResult(payload: SubmissionPayload): void {
    if (sending.current === payload) return;
    sending.current = payload;
    outbox.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      // Ignored if the student has started a new attempt in the meantime.
      if (outbox.current !== payload) return;
      recordDelivery(payload.attemptId, ok ? "sent" : "failed");
      setSendStatus(ok ? "success" : "failed");
    });
  }

  // Sends the result of the submitted attempt on screen: the payload kept from an earlier failed
  // or interrupted delivery if there is one, otherwise one rebuilt from the saved attempt.
  // Either way it carries the same attemptId.
  function deliverSubmittedAttempt(): void {
    try {
      const current = attemptRef.current;
      if (!current || current.phase !== "results") return;
      const stored = pendingPayload(current.attemptId);
      sendResult(stored ? { ...stored, token: SHEETS_TOKEN } : buildPayload(current));
    } catch {
      outbox.current = null;
      setSendStatus("failed");
    }
  }

  function handleResend(): void {
    if (outbox.current) sendResult(outbox.current);
    else deliverSubmittedAttempt();
  }

  useEffect(() => {
    // A submitted attempt restored after a refresh is sent again unless the server confirmed it.
    const restored = attemptRef.current;
    if (restored && restored.phase === "results" && restored.delivery !== "sent") deliverSubmittedAttempt();
    // Results of earlier attempts that could not be delivered are sent again, quietly.
    void retryPending();
    // Runs once, on load.
  }, []);

  useEffect(() => {
    if (!attempt || attempt.phase !== "exam") return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt?.phase, attempt?.startTime]);

  useEffect(() => {
    function saveNow() {
      const current = attemptRef.current;
      if (!current || !storageAvailable) return;
      try {
        saveAttempt(current);
      } catch {
        // no UI update possible during unload
      }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") saveNow();
    }
    window.addEventListener("pagehide", saveNow);
    window.addEventListener("beforeunload", saveNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", saveNow);
      window.removeEventListener("beforeunload", saveNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [storageAvailable]);

  function handleStart(name: string): void {
    const order = buildQuestionOrder();
    const firstQuestionId = order[0];
    const next: Attempt = {
      schema: 2,
      examId: EXAM_ID,
      examVersion: EXAM_VERSION,
      attemptId: makeAttemptId(),
      studentName: name.trim(),
      phase: "exam",
      questionOrder: order,
      optionOrders: buildOptionOrders(),
      answers: {},
      currentIndex: 0,
      visited: [firstQuestionId],
      reviewing: false,
      startTime: Date.now(),
      startSoundPlayed: true,
      submissionSoundPlayed: false,
    };
    attemptRef.current = next;
    setAttempt(next);
    setReviewing(false);
    setDownloadStatus(null);
    setDownloadError(null);
    setSubmitError(null);
    submitGuard.current = false;
    outbox.current = null;
    setSendStatus("idle");
    setWarning(null);
    persist(next);
    playStartSound();
    setNow(Date.now());
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleAnswer(subpartId: string, value: AnswerValue): void {
    commit((current) => ({
      ...current,
      answers: { ...current.answers, [subpartId]: value },
    }));
  }

  function handleNavigate(index: number): void {
    const current = attemptRef.current;
    if (!current) return;
    const clamped = Math.max(0, Math.min(current.questionOrder.length - 1, index));
    commit((a) => ({
      ...a,
      reviewing: false,
      currentIndex: clamped,
      visited: a.visited.includes(a.questionOrder[clamped])
        ? a.visited
        : [...a.visited, a.questionOrder[clamped]],
    }));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleReview(): void {
    commit((a) => ({ ...a, reviewing: true }));
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleBackToExam(): void {
    commit((a) => ({ ...a, reviewing: false }));
    setReviewing(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleJump(index: number): void {
    setReviewing(false);
    handleNavigate(index);
  }

  function handleSubmit(): void {
    const current = attemptRef.current;
    if (!current || current.phase !== "exam" || submitGuard.current) return;
    if (unansweredSubparts(current.answers).length > 0) return;
    submitGuard.current = true;
    setSubmitError(null);

    const submittedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((submittedAt - current.startTime) / 1000));
    const frozen: Attempt = {
      ...current,
      phase: "results",
      submissionTime: submittedAt,
      durationSeconds,
      reviewing: false,
      answers: JSON.parse(JSON.stringify(current.answers)) as Attempt["answers"],
    };
    const result = gradeAttempt(frozen);
    const filename = buildReportFilename(frozen.studentName);
    const report = buildReport(frozen, result);
    const validation = validateReport(report, frozen, result, filename);
    if (!validation.ok) {
      submitGuard.current = false;
      setSubmitError(
        `تعذّر التحقق من تقرير النتيجة، ولم يتم التسليم. التفاصيل: ${validation.errors.join("؛ ")}`
      );
      return;
    }

    let status: "ok" | "failed" = "ok";
    let errorMessage: string | null = null;
    try {
      downloadReport(report, filename);
    } catch {
      status = "failed";
      errorMessage = "تعذّر تنزيل التقرير تلقائياً في هذا المتصفح.";
    }

    playSubmitSound();

    const finalAttempt: Attempt = {
      ...frozen,
      reportText: report,
      reportFileName: filename,
      submissionSoundPlayed: true,
      delivery: "pending",
    };
    attemptRef.current = finalAttempt;
    setAttempt(finalAttempt);
    setReviewing(false);
    setDownloadStatus(status);
    setDownloadError(errorMessage);
    setNow(submittedAt);
    persist(finalAttempt);
    window.scrollTo({ top: 0, behavior: "auto" });

    // Delivery to the teacher starts after the download and the results page, and neither waits
    // for it: a fault here leaves the results and the TXT report untouched.
    try {
      sendResult(buildPayload(finalAttempt, result));
    } catch {
      outbox.current = null;
      setSendStatus("failed");
    }
  }

  function handleBackupDownload(): void {
    const current = attemptRef.current;
    if (!current?.reportText || !current.reportFileName) {
      setDownloadStatus("failed");
      setDownloadError("ملف التقرير غير متوفر في هذه المحاولة المحفوظة.");
      return;
    }
    try {
      downloadReport(current.reportText, current.reportFileName);
      setDownloadStatus("ok");
      setDownloadError(null);
    } catch {
      setDownloadStatus("failed");
      setDownloadError("تعذّر تنزيل التقرير. جرّب متصفحاً آخر.");
    }
  }

  function handleTryAgain(): void {
    clearAttempt();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // best effort
    }
    attemptRef.current = null;
    setAttempt(null);
    setReviewing(false);
    setDownloadStatus(null);
    setDownloadError(null);
    setSubmitError(null);
    submitGuard.current = false;
    outbox.current = null;
    setSendStatus("idle");
    setWarning(
      storageAvailable
        ? null
        : "تعذّر الحفظ التلقائي في هذا المتصفح؛ قد تُفقد الإجابات عند إعادة تحميل الصفحة."
    );
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const result = attempt?.phase === "results" ? gradeAttempt(attempt) : null;
  const displayWarning = autosaveHealthy
    ? warning
    : warning ??
      "تعذّر الحفظ التلقائي في هذا المتصفح؛ قد تُفقد الإجابات عند إعادة تحميل الصفحة. أكمل الاختبار ونزّل التقرير بعد التسليم.";

  return (
    <div className="app-shell">
      <SiteTop />
      <main className="app-main">
        {!attempt && (
          <Welcome
            onStart={handleStart}
            storageWarning={displayWarning}
          />
        )}

        {attempt && attempt.phase === "exam" && !reviewing && (
          <ExamView
            attempt={attempt}
            now={now}
            warning={displayWarning}
            autosaveOk={autosaveHealthy && storageAvailable}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onReview={handleReview}
          />
        )}

        {attempt && attempt.phase === "exam" && reviewing && (
          <ReviewView
            attempt={attempt}
            now={now}
            warning={displayWarning}
            submitError={submitError}
            onBack={handleBackToExam}
            onJump={handleJump}
            onSubmit={handleSubmit}
          />
        )}

        {attempt && attempt.phase === "results" && result && (
          <ResultsView
            attempt={attempt}
            result={result}
            onBackup={handleBackupDownload}
            onTryAgain={handleTryAgain}
            downloadStatus={downloadStatus}
            downloadError={downloadError}
            storageWarning={displayWarning}
            sendStatus={sendStatus}
            onResend={handleResend}
          />
        )}
      </main>
      <SiteFooter onTeacherKey={() => setTeacherOpen(true)} />
      <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
    </div>
  );
}

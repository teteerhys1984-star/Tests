import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SHEETS_TOKEN } from "./config";
import {
  clearAttempt,
  createAttempt,
  loadAttempt,
  saveAttempt,
  type Attempt,
  type DeliveryState,
} from "./exam/attempt";
import { TOTAL_PARTS, TOTAL_MARKS } from "./exam/data";
import {
  countUnanswered,
  formatDuration,
  gradeAttempt,
  type AnswerValue,
} from "./exam/grade";
import {
  buildReport,
  downloadReport,
  reportFilename,
  validateReport,
} from "./exam/report";
import { playStartSound, playSubmitSound } from "./exam/sound";
import {
  buildPayload,
  pendingPayload,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./exam/submit";
import { ContactBar, SiteFooter } from "./components/Layout";
import { Welcome } from "./components/Welcome";
import { ExamView } from "./components/ExamView";
import { ReviewView } from "./components/ReviewView";
import { Results } from "./components/Results";
import { TeacherKey } from "./components/TeacherKey";

type View = "welcome" | "exam" | "review" | "results";

const STORAGE_MESSAGE =
  "تعذّر حفظ المحاولة في التخزين المحلي. يمكنك متابعة الاختبار، لكن الحفظ التلقائي غير مضمون. استخدم زر التسليم قبل إغلاق الصفحة.";

function deepCloneAnswers(answers: Attempt["answers"]): Attempt["answers"] {
  try {
    return JSON.parse(JSON.stringify(answers)) as Attempt["answers"];
  } catch {
    return { ...answers };
  }
}

function scrollToTop(behavior: ScrollBehavior = "smooth") {
  try {
    window.scrollTo({ top: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }
}

export default function App() {
  const [initialLoad] = useState(() => loadAttempt());
  const [attempt, setAttempt] = useState<Attempt | null>(initialLoad.attempt);
  const [view, setView] = useState<View>(() => {
    if (!initialLoad.attempt) return "welcome";
    return initialLoad.attempt.status === "submitted" ? "results" : "exam";
  });
  const [studentName, setStudentName] = useState(initialLoad.attempt?.studentName ?? "");
  const [nameError, setNameError] = useState("");
  const [storageWarning, setStorageWarning] = useState<string | null>(
    initialLoad.warning
  );
  const [reportError, setReportError] = useState<string | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  /** Delivery state of the result on screen: idle until an attempt is submitted. */
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    const restored = initialLoad.attempt;
    if (!restored || restored.status !== "submitted") return "idle";
    // A result that was not confirmed is delivered again right away (see the effect below).
    return restored.delivery === "sent" ? "success" : "sending";
  });

  const attemptRef = useRef<Attempt | null>(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // The payload of a delivery the server has not confirmed: it is sent again after a refresh.
  const outboxRef = useRef<SubmissionPayload | null>(null);
  // Guards against delivering the same payload twice (button pressed twice, pending round …).
  const sendingRef = useRef<SubmissionPayload | null>(null);

  // Save on every answer change, navigation, start and submission.
  useEffect(() => {
    if (!attempt) return;
    const ok = saveAttempt(attempt);
    if (!ok) setStorageWarning(STORAGE_MESSAGE);
    else setStorageWarning((current) => (current === STORAGE_MESSAGE ? null : current));
  }, [attempt]);

  // Save again on lifecycle events so the attempt survives closing the tab.
  useEffect(() => {
    const saveNow = () => {
      const current = attemptRef.current;
      if (current && current.status === "active") {
        saveAttempt(current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    window.addEventListener("pagehide", saveNow);
    window.addEventListener("beforeunload", saveNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", saveNow);
      window.removeEventListener("beforeunload", saveNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Timestamp-based count-up stopwatch. It never runs on the welcome screen.
  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [attempt?.status]);

  const unanswered = useMemo(
    () => (attempt ? countUnanswered(attempt.answers, attempt.questionOrder) : TOTAL_PARTS),
    [attempt]
  );
  const answeredParts = TOTAL_PARTS - unanswered;

  const elapsedMs = useMemo(() => {
    if (!attempt) return 0;
    if (attempt.status === "submitted") {
      return Math.max(0, (attempt.submittedAt ?? now) - attempt.startTimestamp);
    }
    return Math.max(0, now - attempt.startTimestamp);
  }, [attempt, now]);
  const elapsed = formatDuration(elapsedMs);

  const startedAttempt = attempt && attempt.status === "submitted" ? attempt : null;
  const submittedResult = useMemo(
    () =>
      startedAttempt
        ? gradeAttempt(startedAttempt.answers, startedAttempt.questionOrder)
        : null,
    [startedAttempt]
  );

  /** Writes the delivery state of a submitted attempt into the attempt that is saved locally. */
  const recordDelivery = useCallback((attemptId: string, delivery: DeliveryState) => {
    const current = attemptRef.current;
    if (!current || current.attemptId !== attemptId || current.delivery === delivery) return;
    const next: Attempt = { ...current, delivery };
    attemptRef.current = next;
    setAttempt(next);
  }, []);

  /** Sends one payload in the background; the banner follows the outcome. Never throws. */
  const sendResult = useCallback(
    (payload: SubmissionPayload) => {
      if (sendingRef.current === payload) return;
      sendingRef.current = payload;
      outboxRef.current = payload;
      setSendStatus("sending");
      void sendWithRetry(payload).then((ok) => {
        if (sendingRef.current === payload) sendingRef.current = null;
        // A newer attempt may be on screen by now: its own delivery decides the banner.
        if (outboxRef.current !== payload) return;
        setSendStatus(ok ? "success" : "failed");
        recordDelivery(payload.attemptId, ok ? "sent" : "failed");
      });
    },
    [recordDelivery]
  );

  /**
   * Delivers the result of the submitted attempt on screen: the payload kept locally after an
   * interrupted delivery if there is one, otherwise one rebuilt from the saved attempt. Either
   * way it carries the attemptId of that attempt, so the server can recognise a repeat.
   */
  const deliverSubmittedAttempt = useCallback(() => {
    const current = attemptRef.current;
    if (!current || current.status !== "submitted") {
      outboxRef.current = null;
      return;
    }
    const stored = pendingPayload(current.attemptId);
    sendResult(
      stored
        ? { ...stored, token: SHEETS_TOKEN }
        : buildPayload(current, gradeAttempt(current.answers, current.questionOrder))
    );
  }, [sendResult]);

  /** «إعادة إرسال النتيجة» — tries the delivery of the attempt on screen once more. */
  const handleResend = useCallback(() => {
    if (outboxRef.current) sendResult(outboxRef.current);
    else deliverSubmittedAttempt();
  }, [deliverSubmittedAttempt, sendResult]);

  // On load: an unconfirmed result of the attempt on screen is sent again, and so are the results
  // kept from earlier attempts of this exam (quietly, without touching what is on screen).
  useEffect(() => {
    const restored = attemptRef.current;
    if (restored && restored.status === "submitted" && restored.delivery !== "sent") {
      deliverSubmittedAttempt();
    }
    void retryPending();
    // Runs once, after the attempt of this page load is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    const name = studentName.trim();
    if (!name) {
      setNameError("يرجى إدخال اسم الطالب قبل بدء الاختبار.");
      return;
    }
    const newAttempt = createAttempt(name);
    setNameError("");
    setReportError(null);
    setStorageWarning(null);
    outboxRef.current = null;
    sendingRef.current = null;
    setSendStatus("idle");
    setAttempt(newAttempt);
    setView("exam");
    setNow(Date.now());
    const saved = saveAttempt(newAttempt);
    if (!saved) setStorageWarning(STORAGE_MESSAGE);
    scrollToTop("auto");
    window.setTimeout(() => playStartSound(), 160);
  };

  const handleNameChange = (value: string) => {
    setStudentName(value);
    if (value.trim()) setNameError("");
  };

  const handleAnswer = (partId: string, value: AnswerValue) => {
    setAttempt((current) => {
      if (!current || current.status !== "active") return current;
      return {
        ...current,
        answers: { ...current.answers, [partId]: value },
      };
    });
  };

  const handleNavigate = (index: number) => {
    if (!attempt) return;
    const bounded = Math.min(
      Math.max(0, index),
      Math.max(0, attempt.questionOrder.length - 1)
    );
    setAttempt((current) => {
      if (!current) return current;
      return {
        ...current,
        currentIndex: bounded,
        visited: current.visited.includes(bounded)
          ? current.visited
          : [...current.visited, bounded],
      };
    });
    setView("exam");
    scrollToTop("smooth");
  };

  const handleOpenReview = () => {
    if (!attempt) return;
    setView("review");
    scrollToTop("smooth");
  };

  const handleBackToExam = () => {
    setView("exam");
    scrollToTop("smooth");
  };

  const handleSubmit = () => {
    if (!attempt || attempt.status !== "active") return;
    const missing = countUnanswered(attempt.answers, attempt.questionOrder);
    if (missing > 0) {
      // No hints and no answer details: report only the count of missing parts.
      setReportError(null);
      setView("review");
      scrollToTop("smooth");
      return;
    }

    const submittedAt = Date.now();
    const frozen: Attempt = {
      ...attempt,
      answers: deepCloneAnswers(attempt.answers),
      currentIndex: Math.min(
        attempt.currentIndex,
        Math.max(0, attempt.questionOrder.length - 1)
      ),
      status: "submitted",
      submittedAt,
      delivery: "pending",
    };
    const result = gradeAttempt(frozen.answers, frozen.questionOrder);
    let downloadFailure: string | null = null;
    let downloadedText: string | null = null;

    // Everything in this workflow is local and synchronous.
    try {
      const report = buildReport(frozen, result);
      validateReport(report, frozen, result);
      downloadReport(report, reportFilename(frozen.studentName));
      // Exactly the text of the file the student just received (downloadReport adds the BOM).
      downloadedText = "\uFEFF" + report;
    } catch (error) {
      downloadFailure =
        error instanceof Error ? error.message : "تعذّر إنشاء ملف التقرير.";
    }

    const saved = saveAttempt(frozen);
    if (!saved) setStorageWarning(STORAGE_MESSAGE);
    else setStorageWarning(null);
    setReportError(downloadFailure);
    setAttempt(frozen);
    attemptRef.current = frozen;
    setNow(submittedAt);
    setView("results");
    playSubmitSound();
    scrollToTop("auto");
    // The result is delivered in the background: the report above never waits for it, and a
    // delivery that fails leaves the result on screen and is tried again on the next visit.
    sendResult(buildPayload(frozen, result, downloadedText ?? undefined));
  };

  const handleDownloadReport = useCallback(() => {
    if (!attempt || attempt.status !== "submitted") return;
    try {
      const result = gradeAttempt(attempt.answers, attempt.questionOrder);
      const report = buildReport(attempt, result);
      validateReport(report, attempt, result);
      downloadReport(report, reportFilename(attempt.studentName));
      setReportError(null);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "تعذّر إنشاء ملف التقرير."
      );
    }
  }, [attempt]);

  const handleTryAgain = () => {
    const cleared = clearAttempt();
    setAttempt(null);
    attemptRef.current = null;
    outboxRef.current = null;
    sendingRef.current = null;
    setSendStatus("idle");
    setStudentName("");
    setNameError("");
    setReportError(null);
    setView("welcome");
    setNow(Date.now());
    setStorageWarning(
      cleared
        ? null
        : "تعذّر مسح المحاولة السابقة من مخزن المتصفح. حاول إغلاق التبويب وفتحه مجدداً بعد بدء المحاولة الجديدة."
    );
    scrollToTop("auto");
  };

  const footer = <SiteFooter onTeacherOpen={() => setTeacherOpen(true)} />;
  const topStrip = view !== "welcome" ? <ContactBar compact /> : null;

  return (
    <>
      {view === "welcome" ? (
        <div className="min-h-screen">
          <Welcome
            studentName={studentName}
            onStudentNameChange={handleNameChange}
            onStart={handleStart}
            nameError={nameError}
            storageWarning={storageWarning}
          />
          {footer}
        </div>
      ) : null}

      {view === "exam" && attempt ? (
        <div className="min-h-screen">
          {topStrip}
          <ExamView
            attempt={attempt}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onOpenReview={handleOpenReview}
            onSubmit={handleSubmit}
            unanswered={unanswered}
            answeredParts={answeredParts}
            elapsed={elapsed}
            storageWarning={storageWarning}
            reportError={reportError}
          />
          {footer}
        </div>
      ) : null}

      {view === "review" && attempt ? (
        <div className="min-h-screen">
          {topStrip}
          <ReviewView
            attempt={attempt}
            onNavigate={handleNavigate}
            onBack={handleBackToExam}
            onSubmit={handleSubmit}
            unanswered={unanswered}
            answeredParts={answeredParts}
            elapsed={elapsed}
            storageWarning={storageWarning}
          />
          {footer}
        </div>
      ) : null}

      {view === "results" && attempt && submittedResult ? (
        <div className="min-h-screen">
          {topStrip}
          <Results
            attempt={attempt}
            result={submittedResult}
            elapsed={elapsed}
            onDownloadReport={handleDownloadReport}
            onTryAgain={handleTryAgain}
            reportError={reportError}
            sendStatus={sendStatus}
            onResend={handleResend}
          />
          {footer}
        </div>
      ) : null}

      {!attempt && view !== "welcome" ? (
        <Welcome
          studentName={studentName}
          onStudentNameChange={handleNameChange}
          onStart={handleStart}
          nameError={nameError}
          storageWarning={storageWarning}
        />
      ) : null}

      {teacherOpen ? <TeacherKey onClose={() => setTeacherOpen(false)} /> : null}

      <span className="hidden">
        إجمالي الدرجات: {TOTAL_MARKS} — عدد الأجزاء: {TOTAL_PARTS}
      </span>
    </>
  );
}

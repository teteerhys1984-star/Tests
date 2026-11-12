import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearAttempt,
  createAttempt,
  loadAttempt,
  saveAttempt,
  type Attempt,
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

  const attemptRef = useRef<Attempt | null>(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

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
    };
    const result = gradeAttempt(frozen.answers, frozen.questionOrder);
    let downloadFailure: string | null = null;

    // Everything in this workflow is local and synchronous.
    try {
      const report = buildReport(frozen, result);
      validateReport(report, frozen, result);
      downloadReport(report, reportFilename(frozen.studentName));
    } catch (error) {
      downloadFailure =
        error instanceof Error ? error.message : "تعذّر إنشاء ملف التقرير.";
    }

    const saved = saveAttempt(frozen);
    if (!saved) setStorageWarning(STORAGE_MESSAGE);
    else setStorageWarning(null);
    setReportError(downloadFailure);
    setAttempt(frozen);
    setNow(submittedAt);
    setView("results");
    playSubmitSound();
    scrollToTop("auto");
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

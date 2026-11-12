import { useEffect, useRef, useState } from "react";
import type { AnswerValue, Attempt, ExamResult } from "./types";
import {
  EXAM_VERSION,
  TOTAL_MARKS,
  TOTAL_SUBPARTS,
  questions,
  validateExam,
} from "./data/questions";
import {
  buildReport,
  clearAttemptAndResult,
  countAnswered,
  createAttempt,
  gradeAttempt,
  isSubpartAnswered,
  loadAttempt,
  loadResult,
  probeStorage,
  questionsInOrder,
  reportFilename,
  saveAttempt,
  saveResult,
  triggerDownload,
  validateReport,
  formatDuration,
} from "./lib/exam";
import { playStartSound, playSubmitSound } from "./lib/audio";
import { SiteFooter, SiteHeader } from "./components/Chrome";
import { TeacherGate } from "./components/TeacherGate";
import { TeacherKey } from "./screens/TeacherKey";
import { Welcome } from "./screens/Welcome";
import { ExamScreen, ReviewScreen } from "./screens/Exam";
import { Results } from "./screens/Results";

type Phase = "welcome" | "exam" | "review" | "results";

interface BootState {
  attempt: Attempt | null;
  result: ExamResult | null;
  phase: Phase;
  warning: string | null;
  storageAvailable: boolean;
}

function bootState(): BootState {
  const storageAvailable = probeStorage();
  const attemptState = loadAttempt();
  const resultState = loadResult();
  const warnings: string[] = [];
  if (!storageAvailable) {
    warnings.push(
      "تعذّر الوصول إلى التخزين المحلي في هذا المتصفح. سيعمل الاختبار، لكن الحفظ التلقائي واستعادة المحاولة قد لا يتاحان.",
    );
  }
  if (attemptState.warning) warnings.push(attemptState.warning);
  if (resultState.warning) warnings.push(resultState.warning);

  // A submitted result always takes precedence; the exam never reopens as active.
  if (resultState.value) {
    return {
      attempt: attemptState.value,
      result: resultState.value,
      phase: "results",
      warning: warnings.length ? warnings.join(" ") : null,
      storageAvailable,
    };
  }
  if (attemptState.value) {
    return {
      attempt: attemptState.value,
      result: null,
      phase: attemptState.value.mode === "review" ? "review" : "exam",
      warning: warnings.length ? warnings.join(" ") : null,
      storageAvailable,
    };
  }
  return {
    attempt: null,
    result: null,
    phase: "welcome",
    warning: warnings.length ? warnings.join(" ") : null,
    storageAvailable,
  };
}

function useElapsedTimer(startedAt: number | undefined, running: boolean): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running, startedAt]);
  if (!startedAt) return "00:00:00";
  return formatDuration(Math.max(0, now - startedAt));
}

export default function App() {
  const [boot] = useState<BootState>(() => bootState());
  const [attempt, setAttempt] = useState<Attempt | null>(boot.attempt);
  const [result, setResult] = useState<ExamResult | null>(boot.result);
  const [phase, setPhase] = useState<Phase>(boot.phase);
  const [name, setName] = useState("");
  const [saveOk, setSaveOk] = useState<boolean | null>(boot.storageAvailable);
  const [storageWarning, setStorageWarning] = useState<string | null>(boot.warning);
  const [reportIssue, setReportIssue] = useState<string | null>(null);
  const [fileValidated, setFileValidated] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);

  const bootWarningRef = useRef(boot.warning);
  /** Once a submission or a fresh start begins, stale pagehide saves are forbidden. */
  const lifecycleSealedRef = useRef(false);
  const attemptRef = useRef<Attempt | null>(attempt);
  const resultRef = useRef<ExamResult | null>(result);
  attemptRef.current = attempt;
  resultRef.current = result;

  const timerRunning = Boolean(attempt) && !result && (phase === "exam" || phase === "review");
  const timer = useElapsedTimer(result ? result.startedAt : attempt?.startedAt, timerRunning);

  useEffect(() => {
    const errors = validateExam();
    if (errors.length) console.error("Exam integrity errors:", errors);
  }, []);

  // Save after starting, on every answer/navigation change, and on view changes.
  useEffect(() => {
    if (!attempt || result) return;
    const status = saveAttempt({ ...attempt, mode: phase === "review" ? "review" : "exam" });
    setSaveOk(status);
    if (!status) {
      setStorageWarning(
        "تعذّر حفظ تقدّمك تلقائياً في هذا المتصفح. لا تغلق الصفحة قبل إكمال الاختبار؛ يمكنك تنزيل التقرير بعد التسليم.",
      );
    } else {
      setStorageWarning(bootWarningRef.current);
    }
  }, [attempt, phase, result]);

  // Release the seal only when the app is torn down (unmount), so a later
  // navigation/reload can never resurrect a submitted or replaced attempt.
  useEffect(() => {
    return () => {
      lifecycleSealedRef.current = false;
    };
  }, []);

  // Best-effort save when the tab is hidden or the page is leaving.
  useEffect(() => {
    const persist = () => {
      if (lifecycleSealedRef.current) return;
      if (attemptRef.current && !resultRef.current) {
        saveAttempt({
          ...attemptRef.current,
          mode: "exam",
        });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("beforeunload", persist);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [phase]);

  const startExam = (studentName: string) => {
    lifecycleSealedRef.current = false;
    const created = createAttempt(studentName);
    const saved = saveAttempt(created);
    setAttempt(created);
    setResult(null);
    setPhase("exam");
    setSaveOk(saved);
    setReportIssue(null);
    setFileValidated(false);
    if (!saved) {
      setStorageWarning(
        "لم نتمكن من حفظ المحاولة في تخزين المتصفح. سيعمل الاختبار في هذه الصفحة، لكن الاستعادة بعد التحديث غير مضمونة.",
      );
    } else {
      setStorageWarning(bootWarningRef.current);
    }
    // Sound is intentionally played only for a newly started attempt,
    // shortly after the first question is rendered.
    window.setTimeout(() => playStartSound(), 120);
  };

  const answerSubpart = (subpartId: string, value: AnswerValue) => {
    setAttempt((prev) => {
      if (!prev || result) return prev;
      return {
        ...prev,
        mode: "exam",
        answers: { ...prev.answers, [subpartId]: value },
        visited: prev.visited.includes(prev.currentIndex)
          ? prev.visited
          : [...prev.visited, prev.currentIndex],
      };
    });
  };

  const navigate = (index: number) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const bank = questionsInOrder(prev);
      const bounded = Math.max(0, Math.min(index, bank.length - 1));
      return {
        ...prev,
        mode: "exam",
        currentIndex: bounded,
        visited: prev.visited.includes(bounded) ? prev.visited : [...prev.visited, bounded],
      };
    });
    setPhase("exam");
  };

  const openReview = () => {
    setPhase("review");
    setAttempt((prev) => (prev ? { ...prev, mode: "review" } : prev));
  };

  const backToExam = () => {
    setPhase("exam");
    setAttempt((prev) => (prev ? { ...prev, mode: "exam" } : prev));
  };

  const completeCheck = (current: Attempt | null): number => {
    if (!current) return TOTAL_SUBPARTS;
    return questionsInOrder(current).reduce(
      (sum, q) =>
        sum +
        q.subparts.filter((s) => !isSubpartAnswered(s, current.answers[s.id] ?? null)).length,
      0,
    );
  };

  const submitExam = () => {
    if (!attempt || result) return;
    if (completeCheck(attempt) > 0) return;

    // 1) Freeze answers + 2) record timestamp + 3) stop timer + 4) calculate.
    lifecycleSealedRef.current = true;
    const frozen = gradeAttempt(attempt);

    // 5) Build report locally. 6) Validate before any download starts.
    let reportText = "";
    let validationErrors: string[] = [];
    try {
      reportText = buildReport(frozen);
      validationErrors = validateReport(reportText, frozen);
    } catch {
      validationErrors = ["تعذّر إنشاء نص التقرير أو التحقق منه."];
    }

    // 7) Blob + URL + 8) immediate download. 9) Sound. 10) Results screen.
    let downloadStarted = false;
    if (validationErrors.length === 0) {
      downloadStarted = triggerDownload(reportText, reportFilename(frozen.studentName));
    }
    const saved = saveResult(frozen);
    playSubmitSound();

    setResult(frozen);
    setAttempt((prev) => (prev ? { ...prev, mode: "exam" } : prev));
    setPhase("results");
    setFileValidated(validationErrors.length === 0 && downloadStarted);
    if (validationErrors.length) {
      setReportIssue(
        `تم حساب النتيجة، لكن لم يُنزَّل التقرير لأن التحقق منه أخفق: ${validationErrors
          .slice(0, 2)
          .join(" ")}`,
      );
    } else if (!downloadStarted) {
      setReportIssue(
        "تعذّر بدء تنزيل التقرير تلقائياً (قد يكون المتصفح قد منع التنزيل). استخدم زر «تنزيل التقرير TXT».",
      );
    } else if (!saved) {
      setReportIssue(
        "تم حساب النتيجة وتنزيل التقرير، لكن تعذّر حفظ النتيجة في تخزين المتصفح. احتفظ بملف TXT.",
      );
    } else {
      setReportIssue(null);
    }
    if (!saved) {
      setStorageWarning(
        "تعذّر حفظ النتيجة في التخزين المحلي. التقرير الذي نُزّل هو نسختك الموثوقة.",
      );
    }
  };

  const downloadBackup = () => {
    if (!result) return;
    try {
      const reportText = buildReport(result);
      const errors = validateReport(reportText, result);
      if (errors.length) {
        setFileValidated(false);
        setReportIssue(`تعذّر التحقق من التقرير: ${errors.slice(0, 2).join(" ")}`);
        return;
      }
      const started = triggerDownload(reportText, reportFilename(result.studentName));
      setFileValidated(started);
      setReportIssue(
        started
          ? null
          : "تعذّر بدء التنزيل. تحقق من إعدادات التنزيل في المتصفح ثم أعد المحاولة.",
      );
    } catch {
      setFileValidated(false);
      setReportIssue("تعذّر إنشاء التقرير. لم يتغيّر سجل النتيجة المحفوظ.");
    }
  };

  const tryAgain = () => {
    lifecycleSealedRef.current = true;
    const cleared = clearAttemptAndResult();
    setAttempt(null);
    setResult(null);
    setPhase("welcome");
    setName("");
    setReportIssue(null);
    setFileValidated(false);
    setSaveOk(probeStorage());
    setStorageWarning(
      cleared
        ? bootWarningRef.current
        : "تعذّر مسح بيانات المحاولة السابقة من التخزين المحلي. قد تعود المحاولة القديمة إذا أعدت فتح الصفحة.",
    );
  };

  const openTeacherKey = () => {
    if (teacherUnlocked) {
      setTeacherUnlocked(true);
    } else {
      setTeacherGateOpen(true);
    }
  };

  const examProgressLabel =
    attempt && phase !== "results"
      ? `السؤال ${Math.min(attempt.currentIndex + 1, 30)} من 30`
      : undefined;

  return (
    <div className="min-h-screen" dir="rtl" lang="ar">
      <SiteHeader
        studentName={attempt?.studentName ?? result?.studentName}
        timer={timerRunning ? timer : undefined}
        progressLabel={examProgressLabel}
        saveOk={attempt && !result ? saveOk : undefined}
        onReview={openReview}
        showReview={phase === "exam" && Boolean(attempt) && !result}
        onTeacherKey={openTeacherKey}
      />

      {storageWarning && phase !== "welcome" ? (
        <div className="shell no-print pt-2">
          <p className="notice notice-danger m-0" role="status">
            {storageWarning}
          </p>
        </div>
      ) : null}

      {phase === "results" && result ? (
        <Results
          result={result}
          onDownload={downloadBackup}
          onTryAgain={tryAgain}
          reportIssue={reportIssue}
          fileValidated={fileValidated}
        />
      ) : phase === "welcome" || !attempt ? (
        <Welcome
          name={name}
          onNameChange={setName}
          onStart={startExam}
          storageWarning={storageWarning}
        />
      ) : phase === "review" && attempt ? (
        <ReviewScreen
          attempt={attempt}
          timer={timer}
          onNavigate={navigate}
          onBack={backToExam}
          onSubmit={submitExam}
        />
      ) : attempt ? (
        <ExamScreen
          attempt={attempt}
          saveOk={saveOk}
          timer={timer}
          onAnswer={answerSubpart}
          onNavigate={navigate}
          onReview={openReview}
          onSubmit={submitExam}
        />
      ) : null}

      <SiteFooter onTeacherKey={openTeacherKey} />

      <TeacherGate
        open={teacherGateOpen}
        onClose={() => setTeacherGateOpen(false)}
        onSuccess={() => {
          setTeacherGateOpen(false);
          setTeacherUnlocked(true);
        }}
      />
      {teacherUnlocked ? <TeacherKey onClose={() => setTeacherUnlocked(false)} /> : null}

      <div className="no-print pb-2 text-center text-[0.66rem]" style={{ color: "#a08a98" }}>
        إصدار الاختبار {EXAM_VERSION} · {TOTAL_MARKS} درجة · {TOTAL_SUBPARTS} جزءاً ·{" "}
        {questions.length} سؤالاً · بيانات محلية فقط
      </div>
      <span className="sr-only" aria-live="polite">
        {result
          ? `تم تسليم الاختبار. الدرجة ${result.score} من ${TOTAL_MARKS}.`
          : attempt
            ? `أُجيب عن ${countAnswered(attempt)} جزءاً من ${TOTAL_SUBPARTS}.`
            : "شاشة الترحيب بالاختبار."}
      </span>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useExamSession } from "./hooks/useExamSession";
import { countAnsweredSubparts, gradeAttempt } from "./utils/grading";
import { downloadTxtReport } from "./utils/report";
import { playStartSound, playSubmitSound } from "./utils/audio";
import { FloralBackdrop } from "./components/common/FloralBackdrop";
import { StartScreen } from "./components/exam/StartScreen";
import { ExamScreen } from "./components/exam/ExamScreen";
import { ResultsScreen } from "./components/results/ResultsScreen";
import { TeacherGate } from "./components/teacher/TeacherGate";
import { TeacherKey } from "./components/teacher/TeacherKey";

type View = "exam" | "teacher-gate" | "teacher-key";

import { SOUND_STORAGE_KEY } from "./config";
import { buildPayload, retryPending, sendWithRetry, type SendStatus } from "./utils/submit";

function readSoundPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export default function App() {
  const { attempt, startAttempt, setAnswer, goToQuestion, submitExam, clearAttempt } = useExamSession();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => readSoundPreference());
  const [view, setView] = useState<View>("exam");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  useEffect(() => { void retryPending(); }, []);
  const sendResult = useCallback((att: typeof attempt) => {
    if (!att?.submittedAt) return;
    setSendStatus("sending");
    void sendWithRetry(buildPayload(att)).then((ok) => setSendStatus(ok ? "success" : "failed"));
  }, []);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const autoReportedAttempt = useRef<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    } catch {
      /* preference is optional if storage is unavailable */
    }
  }, [soundEnabled]);

  const result = useMemo(() => {
    if (!attempt || !attempt.submittedAt) return null;
    return gradeAttempt(attempt);
  }, [attempt]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      if (next) playStartSound();
      return next;
    });
  }, []);

  const handleStart = useCallback(
    (name: string) => {
      autoReportedAttempt.current = null;
      setView("exam");
      startAttempt(name);
      if (soundEnabled) playStartSound();
    },
    [soundEnabled, startAttempt],
  );

  const handleSubmit = useCallback(() => {
    if (!attempt || attempt.submittedAt) return;
    const completion = countAnsweredSubparts(attempt.answers);
    if (completion.remaining > 0) return;

    const submitted = submitExam();
    if (!submitted) return;
    if (soundEnabled) playSubmitSound();

    // Generate the UTF-8 TXT report automatically after submission.
    sendResult(submitted);
    if (autoReportedAttempt.current !== submitted.id) {
      autoReportedAttempt.current = submitted.id;
      const graded = gradeAttempt(submitted);
      window.setTimeout(() => {
        try {
          downloadTxtReport(graded);
        } catch {
          // The visible backup button on the results page remains available.
        }
      }, 450);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [attempt, soundEnabled, submitExam, sendResult]);

  const handleRestart = useCallback(() => {
    autoReportedAttempt.current = null;
    clearAttempt();
    setView("exam");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [clearAttempt]);

  const handleOpenTeacher = useCallback(() => {
    setView(teacherUnlocked ? "teacher-key" : "teacher-gate");
  }, [teacherUnlocked]);

  const handleCloseTeacher = useCallback(() => {
    setView("exam");
  }, []);

  const handleLockTeacher = useCallback(() => {
    setTeacherUnlocked(false);
    setView("teacher-gate");
  }, []);

  let content: React.ReactNode;

  if (view === "teacher-key" && teacherUnlocked) {
    content = <TeacherKey onClose={handleCloseTeacher} onLock={handleLockTeacher} />;
  } else if (view === "teacher-gate" || (view === "teacher-key" && !teacherUnlocked)) {
    content = (
      <TeacherGate
        onUnlock={() => {
          setTeacherUnlocked(true);
          setView("teacher-key");
        }}
        onClose={handleCloseTeacher}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
  } else if (!attempt) {
    content = (
      <StartScreen
        onStart={handleStart}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenTeacher={handleOpenTeacher}
      />
    );
  } else if (attempt.submittedAt && result) {
    content = (
      <ResultsScreen
        result={result}
        sendStatus={sendStatus}
        onResend={() => sendResult(attempt)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={handleRestart}
        onOpenTeacher={handleOpenTeacher}
      />
    );
  } else {
    content = (
      <ExamScreen
        attempt={attempt}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onAnswer={setAnswer}
        onNavigate={goToQuestion}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="app-shell">
      <FloralBackdrop />
      {content}
    </div>
  );
}

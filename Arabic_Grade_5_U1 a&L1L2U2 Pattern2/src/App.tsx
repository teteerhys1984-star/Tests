import { useEffect, useMemo, useState } from "react";
import { EXAM_QUESTIONS, TOTAL_BRANCHES } from "@/data/exam";
import {
  AnswerMap,
  AnswerValue,
  countAnsweredBranches,
  evaluateExam,
} from "@/lib/grading";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import { StartScreen } from "@/components/StartScreen";
import { ExamScreen } from "@/components/ExamScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { TeacherKeyModal } from "@/components/TeacherKeyModal";

const STORAGE_KEY = "arabic-grade5-comprehensive-exam-attempt-v1";
const SOUND_KEY = "arabic-grade5-comprehensive-exam-sound";

type AttemptStatus = "not_started" | "in_progress" | "submitted";

type AttemptState = {
  version: 1;
  studentName: string;
  status: AttemptStatus;
  startedAt: number | null;
  submittedAt: number | null;
  elapsedSeconds: number;
  answers: AnswerMap;
  currentIndex: number;
};

const createFreshAttempt = (): AttemptState => ({
  version: 1,
  studentName: "",
  status: "not_started",
  startedAt: null,
  submittedAt: null,
  elapsedSeconds: 0,
  answers: {},
  currentIndex: 0,
});

const clampIndex = (value: number): number =>
  Number.isFinite(value) ? Math.min(EXAM_QUESTIONS.length - 1, Math.max(0, Math.trunc(value))) : 0;

const loadAttempt = (): AttemptState => {
  if (typeof window === "undefined") return createFreshAttempt();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createFreshAttempt();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return createFreshAttempt();

    const rawStatus = parsed.status;
    let status: AttemptStatus =
      rawStatus === "in_progress" || rawStatus === "submitted" ? rawStatus : "not_started";
    const studentName = typeof parsed.studentName === "string" ? parsed.studentName.slice(0, 80) : "";
    const startedAt =
      typeof parsed.startedAt === "number" && Number.isFinite(parsed.startedAt) ? parsed.startedAt : null;
    const submittedAt =
      typeof parsed.submittedAt === "number" && Number.isFinite(parsed.submittedAt)
        ? parsed.submittedAt
        : null;
    const elapsedSeconds =
      typeof parsed.elapsedSeconds === "number" && Number.isFinite(parsed.elapsedSeconds)
        ? Math.max(0, Math.floor(parsed.elapsedSeconds))
        : 0;
    const rawAnswers = parsed.answers;
    const answers: AnswerMap =
      rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers)
        ? (rawAnswers as AnswerMap)
        : {};
    const currentIndex = clampIndex(typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0);

    if (status === "in_progress" && startedAt === null) status = "not_started";
    if (status === "submitted" && submittedAt === null) {
      return {
        version: 1,
        studentName,
        status: "submitted",
        startedAt,
        elapsedSeconds,
        answers,
        currentIndex,
        submittedAt: startedAt ?? Date.now(),
      };
    }
    if (status === "not_started") {
      return {
        ...createFreshAttempt(),
        studentName,
      };
    }
    return {
      version: 1,
      studentName,
      status,
      startedAt,
      submittedAt,
      elapsedSeconds,
      answers,
      currentIndex,
    };
  } catch {
    return createFreshAttempt();
  }
};

const loadSoundPreference = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
};

export default function App() {
  const [attempt, setAttempt] = useState<AttemptState>(loadAttempt);
  const [now, setNow] = useState<number>(() => Date.now());
  const [teacherKeyOpen, setTeacherKeyOpen] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(loadSoundPreference);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    } catch {
      // Ignore storage failures (private mode / quota) and keep the in-memory session.
    }
  }, [attempt]);

  useEffect(() => {
    if (attempt.status !== "in_progress" || attempt.startedAt === null) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt.status, attempt.startedAt]);

  const elapsedSeconds = useMemo(() => {
    if (attempt.status === "submitted") return attempt.elapsedSeconds;
    if (attempt.status === "in_progress" && attempt.startedAt !== null) {
      return Math.max(0, Math.floor((now - attempt.startedAt) / 1000));
    }
    return 0;
  }, [attempt.elapsedSeconds, attempt.startedAt, attempt.status, now]);

  const result = useMemo(() => evaluateExam(attempt.answers), [attempt.answers]);

  const handleNameChange = (value: string) => {
    setAttempt((previous) => {
      if (previous.status !== "not_started") return previous;
      return { ...previous, studentName: value.slice(0, 80) };
    });
  };

  const handleStart = () => {
    const trimmedName = attempt.studentName.trim();
    if (trimmedName.length < 2 || attempt.status !== "not_started") return;
    const startedAt = Date.now();
    setNow(startedAt);
    setAttempt({
      version: 1,
      studentName: trimmedName,
      status: "in_progress",
      startedAt,
      submittedAt: null,
      elapsedSeconds: 0,
      answers: {},
      currentIndex: 0,
    });
    if (soundOn) playStartSound();
  };

  const handleSelectQuestion = (index: number) => {
    setAttempt((previous) => {
      if (previous.status !== "in_progress") return previous;
      return { ...previous, currentIndex: clampIndex(index) };
    });
  };

  const handleAnswer = (branchId: string, value: AnswerValue) => {
    setAttempt((previous) => {
      if (previous.status !== "in_progress") return previous;
      return {
        ...previous,
        answers: { ...previous.answers, [branchId]: value },
      };
    });
  };

  const handleSubmit = () => {
    if (attempt.status !== "in_progress") return;
    if (countAnsweredBranches(attempt.answers) < TOTAL_BRANCHES) return;
    const submittedAt = Date.now();
    const elapsed = attempt.startedAt
      ? Math.max(0, Math.floor((submittedAt - attempt.startedAt) / 1000))
      : attempt.elapsedSeconds;
    setAttempt((previous) => ({
      ...previous,
      status: "submitted",
      submittedAt,
      elapsedSeconds: elapsed,
    }));
    if (soundOn) playSubmitSound();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetake = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore; the in-memory reset below is sufficient for this session.
    }
    setAttempt(createFreshAttempt());
    setNow(Date.now());
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleToggleSound = () => {
    setSoundOn((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      } catch {
        // Preference persistence is best-effort only.
      }
      return next;
    });
  };

  const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : new Date();

  return (
    <div className="min-h-screen">
      {attempt.status === "not_started" && (
        <StartScreen
          studentName={attempt.studentName}
          onNameChange={handleNameChange}
          onStart={handleStart}
          onOpenTeacherKey={() => setTeacherKeyOpen(true)}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      {attempt.status === "in_progress" && (
        <ExamScreen
          studentName={attempt.studentName}
          answers={attempt.answers}
          elapsedSeconds={elapsedSeconds}
          currentIndex={clampIndex(attempt.currentIndex)}
          onSelectQuestion={handleSelectQuestion}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      {attempt.status === "submitted" && (
        <ResultsScreen
          studentName={attempt.studentName}
          result={result}
          submittedAt={submittedAt}
          elapsedSeconds={attempt.elapsedSeconds}
          onRetake={handleRetake}
          onOpenTeacherKey={() => setTeacherKeyOpen(true)}
        />
      )}

      <TeacherKeyModal open={teacherKeyOpen} onClose={() => setTeacherKeyOpen(false)} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { TEACHER_AUTH_KEY } from "@/config";
import type { LessonId } from "@/content/problems";
import { allProblems } from "@/content/problems";
import { gradeExam } from "@/exam/grading";
import {
  clearAttempt,
  createFreshAttempt,
  loadAttempt,
  saveAttempt,
} from "@/exam/persistence";
import { buildReportText } from "@/exam/report";
import { subpartsByProblem } from "@/exam/spec";
import {
  buildPayload,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/exam/submit";
import type { ExamAttempt } from "@/exam/types";
import type { AppTab } from "@/lib/site";
import { scrollToTop } from "@/lib/site";
import { ContactSection, FloatingWhatsApp, SiteFooter, SiteHeader } from "@/components/Chrome";
import { TeacherArea } from "@/components/TeacherArea";
import { TeacherGate } from "@/components/TeacherGate";
import { Exam } from "@/screens/Exam";
import { Results } from "@/screens/Results";
import { Review } from "@/screens/Review";
import { Welcome } from "@/screens/Welcome";

function loadTeacherAuth(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(TEACHER_AUTH_KEY) === "open";
  } catch {
    return false;
  }
}

export function App() {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(() => loadAttempt());
  const [tab, setTab] = useState<AppTab>(() => {
    const initial = loadAttempt();
    if (!initial) return "welcome";
    return initial.status === "submitted" ? "results" : "exam";
  });
  const [teacherUnlocked, setTeacherUnlocked] = useState<boolean>(() => loadTeacherAuth());
  const [teacherLesson, setTeacherLesson] = useState<LessonId>("motion");
  const [teacherIndex, setTeacherIndex] = useState<number>(0);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [lastPayload, setLastPayload] = useState<SubmissionPayload | null>(null);

  useEffect(() => {
    void retryPending();
  }, []);

  const persistAttempt = useCallback((next: ExamAttempt) => {
    setAttempt(next);
    saveAttempt(next);
  }, []);

  const handleNavigate = (nextTab: AppTab) => {
    if (nextTab === "exam" && (!attempt || attempt.status === "submitted")) {
      setTab("welcome");
      scrollToTop();
      return;
    }
    if (nextTab === "review" && (!attempt || attempt.status === "submitted")) {
      setTab("welcome");
      scrollToTop();
      return;
    }
    if (nextTab === "results" && (!attempt || attempt.status !== "submitted")) {
      setTab("welcome");
      scrollToTop();
      return;
    }
    setTab(nextTab);
    scrollToTop();
  };

  const handleStartNew = (studentName: string) => {
    const fresh = createFreshAttempt(studentName);
    setSendStatus("idle");
    setLastPayload(null);
    persistAttempt(fresh);
    setTab("exam");
    scrollToTop();
  };

  const handleResume = () => {
    if (attempt && attempt.status === "in_progress") {
      setTab("exam");
      scrollToTop();
    }
  };

  const handleAnswerChange = (subpartId: string, value: string) => {
    if (!attempt || attempt.status === "submitted") return;
    const next: ExamAttempt = {
      ...attempt,
      responses: {
        ...attempt.responses,
        [subpartId]: value,
      },
    };
    persistAttempt(next);
  };

  const handleExamIndexChange = (nextIndex: number) => {
    if (!attempt) return;
    const clamped = Math.min(Math.max(0, nextIndex), allProblems.length - 1);
    persistAttempt({ ...attempt, currentIndex: clamped });
    scrollToTop();
  };

  const deliverPayload = useCallback(async (payload: SubmissionPayload) => {
    setSendStatus("sending");
    const ok = await sendWithRetry(payload);
    setSendStatus(ok ? "success" : "failed");
  }, []);

  const handleSubmitExam = () => {
    if (!attempt || attempt.status === "submitted") return;
    const submitAt = new Date().toISOString();
    const elapsedMs = Math.max(0, new Date(submitAt).getTime() - new Date(attempt.startedAt).getTime());
    const submitted: ExamAttempt = {
      ...attempt,
      status: "submitted",
      submittedAt: submitAt,
      elapsedMs,
    };
    persistAttempt(submitted);

    const graded = gradeExam(submitted.responses);
    const reportText = buildReportText(submitted, graded);
    const payload = buildPayload({
      attempt: submitted,
      result: graded,
      reportText,
    });
    setLastPayload(payload);
    setTab("results");
    scrollToTop();

    void deliverPayload(payload);
  };

  const handleRetrySend = () => {
    if (lastPayload) {
      void deliverPayload(lastPayload);
      return;
    }
    if (attempt && attempt.status === "submitted") {
      const graded = gradeExam(attempt.responses);
      const reportText = buildReportText(attempt, graded);
      const payload = buildPayload({ attempt, result: graded, reportText });
      setLastPayload(payload);
      void deliverPayload(payload);
    }
  };

  const handleStartOver = () => {
    clearAttempt();
    setAttempt(null);
    setSendStatus("idle");
    setLastPayload(null);
    setTab("welcome");
    scrollToTop();
  };

  const unlockTeacher = () => {
    try {
      window.sessionStorage.setItem(TEACHER_AUTH_KEY, "open");
    } catch {
      /* ignore */
    }
    setTeacherUnlocked(true);
  };

  const lockTeacher = () => {
    try {
      window.sessionStorage.removeItem(TEACHER_AUTH_KEY);
    } catch {
      /* ignore */
    }
    setTeacherUnlocked(false);
    setTab("welcome");
    scrollToTop();
  };

  const answeredQuestionsCount = useMemo(() => {
    if (!attempt) return 0;
    return allProblems.filter((p) => {
      const subs = subpartsByProblem[p.id] ?? [];
      return subs.length > 0 && subs.every((sp) => (attempt.responses[sp.id] ?? "").trim().length > 0);
    }).length;
  }, [attempt]);

  const submittedResult = useMemo(() => {
    if (!attempt || attempt.status !== "submitted") return null;
    return gradeExam(attempt.responses);
  }, [attempt]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        active={tab}
        onChange={handleNavigate}
        hasStarted={Boolean(attempt)}
        isSubmitted={attempt?.status === "submitted"}
        answeredQuestionsCount={answeredQuestionsCount}
      />

      <main className="flex-1">
        {tab === "welcome" && (
          <Welcome
            attempt={attempt}
            onStartNew={handleStartNew}
            onResume={handleResume}
            onViewResults={() => handleNavigate("results")}
            onNavigate={handleNavigate}
          />
        )}

        {tab === "exam" && attempt && attempt.status === "in_progress" && (
          <Exam
            attempt={attempt}
            onAnswerChange={handleAnswerChange}
            onIndexChange={handleExamIndexChange}
            onGoReview={() => handleNavigate("review")}
            onNavigate={handleNavigate}
          />
        )}

        {tab === "review" && attempt && attempt.status === "in_progress" && (
          <Review
            attempt={attempt}
            onJumpToQuestion={(idx) => {
              handleExamIndexChange(idx);
              setTab("exam");
            }}
            onBackToExam={() => handleNavigate("exam")}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {tab === "results" && attempt && attempt.status === "submitted" && submittedResult && (
          <Results
            attempt={attempt}
            result={submittedResult}
            sendStatus={sendStatus}
            onRetrySend={handleRetrySend}
            onStartOver={handleStartOver}
            onNavigate={handleNavigate}
          />
        )}

        {tab === "teacher" &&
          (teacherUnlocked ? (
            <TeacherArea
              lessonId={teacherLesson}
              onLessonChange={(lesson) => {
                setTeacherLesson(lesson);
                setTeacherIndex(0);
              }}
              index={teacherIndex}
              onIndexChange={setTeacherIndex}
              onNavigate={handleNavigate}
              onLock={lockTeacher}
              attempt={attempt}
            />
          ) : (
            <TeacherGate onUnlock={unlockTeacher} onNavigate={handleNavigate} />
          ))}
      </main>

      <ContactSection />
      <SiteFooter onChange={handleNavigate} />
      <FloatingWhatsApp />
    </div>
  );
}

export default App;

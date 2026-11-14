import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATTEMPT_STORAGE_KEY, SOUND_STORAGE_KEY } from "@/config";
import { EXAM_QUESTIONS, TOTAL_BRANCHES } from "@/data/exam";
import {
  AnswerMap,
  AnswerValue,
  countAnsweredBranches,
  evaluateExam,
} from "@/lib/grading";
import { buildTextReport } from "@/lib/grading";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import {
  buildPayload,
  hasPending,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/lib/submit";
import { StartScreen } from "@/components/StartScreen";
import { ExamScreen } from "@/components/ExamScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { TeacherKeyModal } from "@/components/TeacherKeyModal";

/**
 * مفتاح الجلسة مشتق من EXAM_ID (انظر src/config.ts)، فمحاولات هذا النموذج
 * لا تختلط بمحاولات النموذج الأول `grade5-arabic-u1-u2-l1l2` ولا بأي اختبار آخر.
 */
const STORAGE_KEY = ATTEMPT_STORAGE_KEY;
const SOUND_KEY = SOUND_STORAGE_KEY;

type AttemptStatus = "not_started" | "in_progress" | "submitted";

type AttemptState = {
  version: 1;
  attemptId: string;
  studentName: string;
  status: AttemptStatus;
  startedAt: number | null;
  submittedAt: number | null;
  elapsedSeconds: number;
  answers: AnswerMap;
  currentIndex: number;
  /** true بعد تأكيد الخادم استلام المحاولة (لمنع الإرسال المكرر عبر إعادة التحميل). */
  sent: boolean;
};

const createFreshAttempt = (): AttemptState => ({
  version: 1,
  attemptId: newAttemptId(),
  studentName: "",
  status: "not_started",
  startedAt: null,
  submittedAt: null,
  elapsedSeconds: 0,
  answers: {},
  currentIndex: 0,
  sent: false,
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
    const attemptId =
      typeof parsed.attemptId === "string" && parsed.attemptId ? parsed.attemptId : newAttemptId();
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
    const sent = parsed.sent === true;

    if (status === "in_progress" && startedAt === null) status = "not_started";
    if (status === "submitted" && submittedAt === null) {
      return {
        version: 1,
        attemptId,
        studentName,
        status: "submitted",
        startedAt,
        elapsedSeconds,
        answers,
        currentIndex,
        submittedAt: startedAt ?? Date.now(),
        sent,
      };
    }
    if (status === "not_started") {
      return {
        ...createFreshAttempt(),
        attemptId,
        studentName,
      };
    }
    return {
      version: 1,
      attemptId,
      studentName,
      status,
      startedAt,
      submittedAt,
      elapsedSeconds,
      answers,
      currentIndex,
      sent,
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
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    const initial = loadAttempt();
    if (initial.status === "submitted" && !initial.sent && hasPending(initial.attemptId)) return "failed";
    return initial.status === "submitted" && initial.sent ? "success" : "idle";
  });

  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  /** الحمولة المعروضة حالياً: يعيد زر «إعادة إرسال النتيجة» إرسالها بالـ attemptId نفسه. */
  const outboxRef = useRef<SubmissionPayload | null>(null);
  const sendingAttemptRef = useRef<string | null>(null);

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

  /** يبني حمولة المحاولة من الإجابات المجمَّدة ونص التقرير نفسه المعروض للطالب. */
  const buildResultPayload = useCallback(
    (
      attemptId: string,
      studentName: string,
      startedAt: number,
      submittedAt: number,
      answers: AnswerMap,
    ): SubmissionPayload => {
      const frozen = evaluateExam(answers);
      const reportText = buildTextReport(studentName, frozen, new Date(submittedAt), Math.max(0, Math.floor((submittedAt - startedAt) / 1000)));
      return buildPayload({
        attemptId,
        meta: { studentName, startTime: startedAt, submitTime: submittedAt },
        answers,
        result: frozen,
        reportText,
      });
    },
    [],
  );

  /** إرسال في الخلفية: لا يحجب ظهور النتيجة ولا تنزيل التقرير. */
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sendingAttemptRef.current === payload.attemptId) return;
    sendingAttemptRef.current = payload.attemptId;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sendingAttemptRef.current === payload.attemptId) sendingAttemptRef.current = null;
      if (attemptRef.current.attemptId !== payload.attemptId) return;
      setSendStatus(ok ? "success" : "failed");
      if (ok) setAttempt((previous) => ({ ...previous, sent: true }));
    });
  }, []);

  /** عند فتح الاختبار: إعادة إرسال النتائج المعلّقة بصمت، ثم استكمال المحاولة المعروضة إن لم تُرسل. */
  useEffect(() => {
    let active = true;
    const initial = attemptRef.current;
    if (initial.status !== "submitted") {
      void retryPending();
      return () => {
        active = false;
      };
    }
    const hadPendingOnMount = hasPending(initial.attemptId);
    void retryPending().then(() => {
      if (!active) return;
      const current = attemptRef.current;
      if (current.status !== "submitted" || current.attemptId !== initial.attemptId) return;
      if (current.sent) {
        setSendStatus("success");
        return;
      }
      if (!hasPending(initial.attemptId) && hadPendingOnMount) {
        // أُرسلت المحاولة المعلّقة بنجاح في هذه الجولة.
        setAttempt((previous) => ({ ...previous, sent: true }));
        setSendStatus("success");
        return;
      }
      const startedAt = initial.startedAt ?? initial.submittedAt ?? Date.now();
      const submittedAt = initial.submittedAt ?? startedAt;
      const payload = buildResultPayload(
        initial.attemptId,
        initial.studentName,
        startedAt,
        submittedAt,
        initial.answers,
      );
      outboxRef.current = payload;
      if (hasPending(initial.attemptId)) {
        // ما زال معلّقاً بعد جولة الإعادة: نعرض الفشل ونبقي زر الإرسال اليدوي.
        setSendStatus("failed");
        return;
      }
      sendResult(payload);
    });
    return () => {
      active = false;
    };
  }, [buildResultPayload, sendResult]);

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
    // كل محاولة جديدة تحصل على attemptId جديد وفريد.
    setAttempt({
      version: 1,
      attemptId: newAttemptId(),
      studentName: trimmedName,
      status: "in_progress",
      startedAt,
      submittedAt: null,
      elapsedSeconds: 0,
      answers: {},
      currentIndex: 0,
      sent: false,
    });
    outboxRef.current = null;
    sendingAttemptRef.current = null;
    setSendStatus("idle");
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
    const current = attemptRef.current;
    if (current.status !== "in_progress") return;
    if (countAnsweredBranches(current.answers) < TOTAL_BRANCHES) return;
    const submittedAt = Date.now();
    const startedAt = current.startedAt ?? submittedAt;
    const elapsed = Math.max(0, Math.floor((submittedAt - startedAt) / 1000));
    const frozenAnswers: AnswerMap = { ...current.answers };

    setAttempt((previous) => ({
      ...previous,
      status: "submitted",
      submittedAt,
      elapsedSeconds: elapsed,
      sent: false,
    }));

    if (soundOn) playSubmitSound();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // الإرسال بعد تجميد الإجابات؛ أي فشل لا يمنع عرض النتيجة أو تنزيل التقرير.
    try {
      const payload = buildResultPayload(
        current.attemptId,
        current.studentName,
        startedAt,
        submittedAt,
        frozenAnswers,
      );
      outboxRef.current = payload;
      sendResult(payload);
    } catch {
      outboxRef.current = null;
      setSendStatus("failed");
    }
  };

  /** زر مستقل لإعادة إرسال النتيجة نفسها (بالـ attemptId نفسه: منع التكرار). */
  const handleResend = () => {
    if (sendStatus === "sending" || sendStatus === "success") return;
    if (outboxRef.current) {
      sendResult(outboxRef.current);
      return;
    }
    const current = attemptRef.current;
    if (current.status !== "submitted") return;
    const startedAt = current.startedAt ?? current.submittedAt ?? Date.now();
    const submittedAt = current.submittedAt ?? startedAt;
    const payload = buildResultPayload(
      current.attemptId,
      current.studentName,
      startedAt,
      submittedAt,
      current.answers,
    );
    outboxRef.current = payload;
    sendResult(payload);
  };

  const handleRetake = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore; the in-memory reset below is sufficient for this session.
    }
    outboxRef.current = null;
    sendingAttemptRef.current = null;
    setSendStatus("idle");
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
    <div className="min-h-screen" dir="rtl" lang="ar">
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
          attemptId={attempt.attemptId}
          result={result}
          submittedAt={submittedAt}
          elapsedSeconds={attempt.elapsedSeconds}
          sendStatus={sendStatus}
          onResend={handleResend}
          onRetake={handleRetake}
          onOpenTeacherKey={() => setTeacherKeyOpen(true)}
        />
      )}

      <TeacherKeyModal open={teacherKeyOpen} onClose={() => setTeacherKeyOpen(false)} />
    </div>
  );
}

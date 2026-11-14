import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EXAM_QUESTIONS } from './data/questions';
import { ExamSessionState, FinalGradingReport } from './types/exam';
import {
  loadSavedSession,
  saveSessionState,
  clearSessionState,
  createInitialSessionState
} from './utils/storage';
import { gradeExamSession } from './utils/grading';
import { downloadReportFile, generateReportText } from './utils/reportGenerator';
import { playExamStartSound, playExamSubmitSound } from './utils/audio';
import {
  buildPayload,
  hasPending,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload
} from './utils/submit';

import { ContactBanner } from './components/HeaderBanner';
import { ExamCover } from './components/ExamCover';
import { QuestionCard } from './components/QuestionCard';
import { ResultsDashboard } from './components/ResultsDashboard';
import { TeacherModal } from './components/TeacherModal';

export const App: React.FC = () => {
  const [session, setSession] = useState<ExamSessionState>(() => loadSavedSession());
  const [elapsed, setElapsed] = useState<number>(() => session.elapsedSeconds || 0);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<FinalGradingReport | null>(() => {
    if (session.isSubmitted) {
      return gradeExamSession(session);
    }
    return null;
  });

  /** حالة إرسال النتيجة إلى المعلّم — تُستعاد من آخر نتيجة محفوظة أو من القائمة المعلّقة. */
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    if (!session.isSubmitted) return 'idle';
    if (session.sendOutcome === 'success') return 'success';
    if (session.sendOutcome === 'failed' || hasPending(session.attemptId)) return 'failed';
    return 'idle';
  });
  /** الحمولة المعروضة حالياً (يعيد زر «إعادة إرسال النتيجة» إرسالها بالمعرّف نفسه). */
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const markSendOutcome = useCallback((outcome: 'success' | 'failed') => {
    setSession(prev => {
      if (!prev.isSubmitted || prev.sendOutcome === outcome) return prev;
      return { ...prev, sendOutcome: outcome };
    });
  }, []);

  const sendResult = useCallback(
    (payload: SubmissionPayload) => {
      if (sending.current === payload) return;
      sending.current = payload;
      setSendStatus('sending');
      void sendWithRetry(payload).then(ok => {
        if (sending.current === payload) sending.current = null;
        // تُهمل النتيجة إن بدأ الطالب محاولة جديدة في هذه الأثناء
        if (outbox.current !== payload) return;
        setSendStatus(ok ? 'success' : 'failed');
        markSendOutcome(ok ? 'success' : 'failed');
      });
    },
    [markSendOutcome]
  );

  /** إعادة إرسال النتيجة بالمعرّف نفسه — مستقلة تماماً عن زر إعادة الاختبار. */
  const handleResend = useCallback(() => {
    if (sending.current || sendStatus === 'sending') return;
    const current = sessionRef.current;
    if (!current.isSubmitted) return;
    try {
      const report = gradeExamSession(current);
      const payload = buildPayload({
        attemptId: current.attemptId,
        session: current,
        report,
        reportText: generateReportText(report)
      });
      outbox.current = payload;
      sendResult(payload);
    } catch {
      setSendStatus('failed');
    }
  }, [sendStatus, sendResult]);

  /** إعادة إرسال النتائج المعلّقة تلقائياً عند فتح الاختبار (بلا أي تدخل من الطالب). */
  useEffect(() => {
    let alive = true;
    const wasPending = sessionRef.current.isSubmitted && hasPending(sessionRef.current.attemptId);
    void retryPending().then(sent => {
      if (!alive || !wasPending || sent === 0) return;
      const current = sessionRef.current;
      if (current.isSubmitted && !hasPending(current.attemptId)) {
        setSendStatus('success');
        markSendOutcome('success');
      }
    });
    return () => {
      alive = false;
    };
  }, [markSendOutcome]);

  // Calculate total unanswered subparts across all 15 questions
  const unansweredCount = useMemo(() => {
    let count = 0;
    for (const q of EXAM_QUESTIONS) {
      for (const sub of q.subparts) {
        const val = session.answers[`${q.id}_${sub.id}`];
        if (!val || val.trim() === '') {
          count++;
        }
      }
    }
    return count;
  }, [session.answers]);

  // Save session to localStorage on any state change
  useEffect(() => {
    saveSessionState(session);
  }, [session]);

  // Window event listeners for robust session saving
  useEffect(() => {
    const handleSave = () => {
      saveSessionState(session);
    };

    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave);
    document.addEventListener('visibilitychange', handleSave);

    return () => {
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
      document.removeEventListener('visibilitychange', handleSave);
    };
  }, [session]);

  // Timestamp-based count-up stopwatch
  useEffect(() => {
    if (!session.isStarted || session.isSubmitted || !session.startTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const currentSeconds = Math.floor((now - session.startTime!) / 1000);
      setElapsed(currentSeconds);
      setSession(prev => ({ ...prev, elapsedSeconds: currentSeconds }));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isStarted, session.isSubmitted, session.startTime]);

  // Start exam handler
  const handleStartExam = useCallback((studentName: string) => {
    const startTime = Date.now();
    const updated: ExamSessionState = {
      ...session,
      studentName,
      isStarted: true,
      isSubmitted: false,
      startTime,
      elapsedSeconds: 0,
      currentQuestionIndex: 0
    };

    setSession(updated);
    saveSessionState(updated);
    setElapsed(0);
    playExamStartSound();
  }, [session]);

  // Answer change handler
  const handleAnswerChange = useCallback((questionId: string, subpartId: string, value: string) => {
    setSession(prev => {
      const newAnswers = {
        ...prev.answers,
        [`${questionId}_${subpartId}`]: value
      };
      return {
        ...prev,
        answers: newAnswers
      };
    });
  }, []);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setSession(prev => {
      const nextIdx = Math.min(prev.currentQuestionIndex + 1, EXAM_QUESTIONS.length - 1);
      const visited = prev.visitedQuestions.includes(nextIdx)
        ? prev.visitedQuestions
        : [...prev.visitedQuestions, nextIdx];
      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        visitedQuestions: visited
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePrev = useCallback(() => {
    setSession(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleJumpToQuestion = useCallback((index: number) => {
    setSession(prev => {
      const visited = prev.visitedQuestions.includes(index)
        ? prev.visitedQuestions
        : [...prev.visitedQuestions, index];
      return {
        ...prev,
        currentQuestionIndex: index,
        visitedQuestions: visited
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Single-action submission handler
  const handleSubmitExam = useCallback(() => {
    if (unansweredCount > 0) return;

    const submissionTime = Date.now();
    const finalElapsed = session.startTime
      ? Math.floor((submissionTime - session.startTime) / 1000)
      : elapsed;

    const submittedSession: ExamSessionState = {
      ...session,
      isSubmitted: true,
      submissionTime,
      elapsedSeconds: finalElapsed
    };

    setSession(submittedSession);
    saveSessionState(submittedSession);

    // Grade and generate report
    const report = gradeExamSession(submittedSession);
    setActiveReport(report);

    // Download TXT report immediately
    downloadReportFile(report);

    // Play triumphant submission sound
    playExamSubmitSound();

    // إرسال النتيجة إلى المعلّم في الخلفية: لا ينتظره التنزيل ولا صفحة النتيجة،
    // وأي خلل فيه لا يمسّ ظهور النتيجة ولا ملف التقرير المحمّل.
    try {
      const payload = buildPayload({
        attemptId: submittedSession.attemptId,
        session: submittedSession,
        report,
        reportText: generateReportText(report)
      });
      outbox.current = payload;
      sendResult(payload);
    } catch {
      outbox.current = null;
      setSendStatus('failed');
      markSendOutcome('failed');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [session, elapsed, unansweredCount, sendResult, markSendOutcome]);

  // Reset exam handler for "إعادة المحاولة"
  const handleRetryExam = useCallback(() => {
    clearSessionState();
    outbox.current = null;
    sending.current = null;
    const freshSession = createInitialSessionState();
    setSession(freshSession);
    setElapsed(0);
    setActiveReport(null);
    setSendStatus('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Format stopwatch timer HH:MM:SS in Western digits
  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = EXAM_QUESTIONS[session.currentQuestionIndex] || EXAM_QUESTIONS[0];

  return (
    <div className="relative min-h-screen bg-[#080c16] text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950" dir="rtl" lang="ar">
      {/* Top Fixed Contact Banner for Eng. Soumar Shaheen */}
      <ContactBanner position="top" />

      {/* Main Container */}
      <main className="pt-14 pb-16 sm:pt-16 sm:pb-20">
        {!session.isStarted ? (
          <ExamCover
            onStart={handleStartExam}
            onOpenTeacher={() => setIsTeacherOpen(true)}
            initialName={session.studentName}
          />
        ) : session.isSubmitted && activeReport ? (
          <ResultsDashboard
            report={activeReport}
            onRetry={handleRetryExam}
            onResend={handleResend}
            sendStatus={sendStatus}
            onOpenTeacher={() => setIsTeacherOpen(true)}
          />
        ) : (
          <div className="px-3 py-4 sm:px-6">
            {/* Active Exam Floating Header Bar */}
            <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                <span className="text-xs font-bold text-slate-200">
                  الطالب: <span className="text-cyan-300">{session.studentName}</span>
                </span>
              </div>

              {/* Stopwatch timer */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 px-3 py-1 border border-slate-800">
                <span className="text-xs text-slate-400">⏱️ المؤقت:</span>
                <span className="font-mono text-sm font-bold tracking-widest text-amber-300" dir="ltr">
                  {formatTimer(elapsed)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">
                  الإنجاز: <span className="font-mono font-bold text-cyan-300">{Math.round(((15 - Math.ceil(unansweredCount / 3)) / 15) * 100)}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTeacherOpen(true)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300"
                >
                  🔒 المعلم
                </button>
              </div>
            </div>

            {/* Question Card */}
            <QuestionCard
              question={currentQ}
              questionIndex={session.currentQuestionIndex}
              totalQuestions={EXAM_QUESTIONS.length}
              answers={session.answers}
              onAnswerChange={handleAnswerChange}
              onNext={handleNext}
              onPrev={handlePrev}
              onJumpToQuestion={handleJumpToQuestion}
              allQuestions={EXAM_QUESTIONS}
              onSubmit={handleSubmitExam}
              unansweredCount={unansweredCount}
            />
          </div>
        )}
      </main>

      {/* Bottom Fixed Contact Banner for Eng. Soumar Shaheen */}
      <ContactBanner position="bottom" />

      {/* Hidden Password-Protected Teacher Portal */}
      <TeacherModal
        isOpen={isTeacherOpen}
        onClose={() => setIsTeacherOpen(false)}
      />
    </div>
  );
};

export default App;

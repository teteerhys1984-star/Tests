import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerValue } from './lib/exam';
import {
  questions,
  EXAM_META,
  validation,
  buildOptionOrder,
  countUnanswered,
  gradeExam,
} from './lib/exam';
import type { StoredAttempt } from './lib/storage';
import { loadAttempt, saveAttempt, clearAttempt, newAttemptId } from './lib/storage';
import { buildReport, reportFilename, triggerReportDownload } from './lib/report';
import { playStartCue, playSubmitCue } from './lib/audio';
import { Cover } from './components/Cover';
import { ExamView } from './components/ExamView';
import { ReviewView } from './components/ReviewView';
import { ResultsView } from './components/ResultsView';
import { TeacherKey } from './components/TeacherKey';
import { ContactBar } from './components/ContactBar';
import { LogoMark, AlertIcon, CheckIcon, CloseIcon } from './components/Icons';

type View = 'cover' | 'exam' | 'review' | 'results';

export default function App() {
  const [boot] = useState(() => loadAttempt());
  const [attempt, setAttempt] = useState<StoredAttempt | null>(boot.attempt);
  const attemptRef = useRef<StoredAttempt | null>(boot.attempt);
  const [view, setView] = useState<View>(() => {
    if (boot.attempt?.status === 'submitted') return 'results';
    if (boot.attempt?.status === 'active') return boot.attempt.activeView === 'review' ? 'review' : 'exam';
    return 'cover';
  });
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState<'saved' | 'error' | 'idle'>(boot.attempt ? 'saved' : 'idle');
  const [storageWarning, setStorageWarning] = useState<string | null>(boot.error);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const openTeacher = useCallback(() => setTeacherOpen(true), []);
  const closeTeacher = useCallback(() => setTeacherOpen(false), []);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [downloadNote, setDownloadNote] = useState(
    boot.attempt?.status === 'submitted'
      ? 'هذه الجلسة مستعادة من محاولة مُسلّمة محفوظة. لم يُعد تنزيل تلقائي عند الاستعادة؛ استخدم زر التنزيل للحصول على التقرير نفسه.'
      : '',
  );
  const [restoredNotice, setRestoredNotice] = useState(boot.attempt?.status === 'active');

  const persist = useCallback((next: StoredAttempt) => {
    const ok = saveAttempt(next);
    setSaveState(ok ? 'saved' : 'error');
    if (!ok) {
      setStorageWarning('تعذر حفظ المحاولة في التخزين المحلي على هذا المتصفح. قد تضيع التغييرات عند إغلاق الصفحة.');
    }
    return ok;
  }, []);

  const commit = useCallback(
    (updater: (previous: StoredAttempt) => StoredAttempt) => {
      const current = attemptRef.current;
      if (!current) return null;
      const updated = updater(current);
      const next: StoredAttempt = {
        ...updated,
        elapsedMs: updated.status === 'active' ? Math.max(0, Date.now() - updated.startedAt) : updated.elapsedMs,
        lastSavedAt: Date.now(),
      };
      attemptRef.current = next;
      setAttempt(next);
      persist(next);
      return next;
    },
    [persist],
  );

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || view === 'cover') return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [attempt?.status, attempt?.startedAt, view]);

  useEffect(() => {
    if (!restoredNotice) return;
    const id = window.setTimeout(() => setRestoredNotice(false), 9000);
    return () => window.clearTimeout(id);
  }, [restoredNotice]);

  useEffect(() => {
    const persistCurrent = () => {
      const current = attemptRef.current;
      if (!current) return;
      const snapshot: StoredAttempt = {
        ...current,
        elapsedMs:
          current.status === 'active'
            ? Math.max(0, Date.now() - current.startedAt)
            : current.elapsedMs,
      };
      const ok = saveAttempt(snapshot);
      if (!ok) {
        setSaveState('error');
        setStorageWarning('تعذر حفظ المحاولة في التخزين المحلي. لا تعتمد على الاستعادة بعد إغلاق الصفحة.');
      }
    };
    const onVisibility = () => persistCurrent();
    const onPageHide = () => persistCurrent();
    const onBeforeUnload = () => persistCurrent();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const scrollTop = () => {
    try {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handleStart = (name: string) => {
    if (!validation.ok) return;
    const startedAt = Date.now();
    const started: StoredAttempt = {
      schemaVersion: 1,
      examId: EXAM_META.id,
      examVersion: EXAM_META.version,
      attemptId: newAttemptId(),
      studentName: name,
      status: 'active',
      answers: {},
      currentIndex: 0,
      visited: [0],
      optionOrder: buildOptionOrder(),
      questionOrder: questions.map((question) => question.id),
      activeView: 'exam',
      startedAt,
      submittedAt: null,
      elapsedMs: 0,
      startCuePlayed: false,
      submissionCuePlayed: false,
      reportFilename: null,
      lastSavedAt: startedAt,
    };
    // The cue is triggered from the click interaction; failure is non-blocking.
    playStartCue();
    const withCue: StoredAttempt = { ...started, startCuePlayed: true };
    attemptRef.current = withCue;
    setAttempt(withCue);
    persist(withCue);
    setNow(startedAt);
    setDownloadNote('');
    setTeacherOpen(false);
    setView('exam');
    scrollTop();
  };

  const handleAnswer = (subId: string, value: AnswerValue) => {
    commit((previous) => {
      if (previous.status !== 'active') return previous;
      return { ...previous, answers: { ...previous.answers, [subId]: value } };
    });
  };

  const handleNavigate = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), questions.length - 1);
    commit((previous) => {
      if (previous.status !== 'active') return previous;
      const visited = previous.visited.includes(clamped) ? previous.visited : [...previous.visited, clamped];
      return { ...previous, currentIndex: clamped, visited, activeView: 'exam' };
    });
    setView('exam');
    scrollTop();
  };

  const handleReview = () => {
    commit((previous) => ({ ...previous, activeView: 'review' }));
    setView('review');
    scrollTop();
  };

  const handleSubmit = () => {
    const current = attemptRef.current;
    if (!current || current.status !== 'active' || submittingRef.current) return;
    if (countUnanswered(current.answers) > 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    const submittedAt = Date.now();
    const filename = reportFilename(current.studentName);
    const result = gradeExam(current.answers);
    const finished: StoredAttempt = {
      ...current,
      status: 'submitted',
      submittedAt,
      elapsedMs: Math.max(0, submittedAt - current.startedAt),
      reportFilename: filename,
      submissionCuePlayed: true,
      resultSummary: {
        earned: result.earned,
        max: result.max,
        percentage: result.percentage,
        counts: result.counts,
      },
      lastSavedAt: submittedAt,
    };

    // Freeze in memory, grade, persist, then build and trigger the TXT download
    // synchronously inside the same submission interaction.
    attemptRef.current = finished;
    const saved = saveAttempt(finished);
    setSaveState(saved ? 'saved' : 'error');
    if (!saved) {
      setStorageWarning('تم التصحيح، لكن تعذر حفظ حالة التسليم في التخزين المحلي.');
    }
    setAttempt(finished);

    const report = buildReport(finished, result);
    const downloadStarted = triggerReportDownload(filename, report);
    setDownloadNote(
      downloadStarted
        ? 'طلب المتصفح تنزيل التقرير تلقائيًا في لحظة التسليم. إذا لم يبدأ التنزيل أو مُنع، استخدم الزر أدناه — الملف نفسه والاسم نفسه.'
        : 'تعذر طلب التنزيل التلقائي من المتصفح. استخدم الزر أدناه لإنشاء التقرير نفسه وتنزيله.',
    );

    if (!current.submissionCuePlayed) playSubmitCue();
    setView('results');
    setSubmitting(false);
    submittingRef.current = false;
    scrollTop();
  };

  const handleDownload = () => {
    const current = attemptRef.current;
    if (!current || current.status !== 'submitted') return;
    const filename = current.reportFilename ?? reportFilename(current.studentName);
    const report = buildReport(current, gradeExam(current.answers));
    const started = triggerReportDownload(filename, report);
    setDownloadNote(
      started
        ? 'أُعيد إنشاء التقرير نفسه وطُلب تنزيله. إذا لم يبدأ التنزيل أو مُنع، جرّب مرة أخرى من زر التنزيل.'
        : 'تعذر طلب التنزيل من المتصفح. يمكنك إعادة المحاولة من زر التنزيل دون فقدان النتيجة.',
    );
  };

  const handleRetry = () => {
    const cleared = clearAttempt();
    attemptRef.current = null;
    setAttempt(null);
    setView('cover');
    setDownloadNote('');
    setSaveState('idle');
    setStorageWarning(
      cleared
        ? null
        : 'تعذر حذف المحاولة السابقة من التخزين المحلي. قد تعود النتيجة السابقة عند إعادة فتح الصفحة.',
    );
    setRestoredNotice(false);
    submittingRef.current = false;
    setSubmitting(false);
    scrollTop();
  };

  const submittedResult = useMemo(
    () => (attempt?.status === 'submitted' ? gradeExam(attempt.answers) : null),
    [attempt],
  );

  if (!validation.ok) {
    return (
      <div className="fatal-screen">
        <div className="fatal-card glass-card">
          <LogoMark size={62} />
          <h1>تعذر تشغيل الاختبار</h1>
          <p>لم يجتز ملف الأسئلة التحقق البرمجي قبل التشغيل. لم يبدأ أي مؤقّت ولم تُسجّل محاولة.</p>
          <ul>
            {validation.errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContactBar position="top" />

      {view === 'cover' && (
        <Cover
          initialName=""
          onStart={handleStart}
          onTeacher={openTeacher}
          storageError={storageWarning}
        />
      )}

      {view === 'exam' && attempt && attempt.status === 'active' && (
        <ExamView
          attempt={attempt}
          now={now}
          onAnswer={handleAnswer}
          onNavigate={handleNavigate}
          onReview={handleReview}
          saveState={saveState}
        />
      )}

      {view === 'review' && attempt && attempt.status === 'active' && (
        <ReviewView
          attempt={attempt}
          now={now}
          onEdit={handleNavigate}
          onBackToExam={() => {
            commit((previous) => ({ ...previous, activeView: 'exam' }));
            setView('exam');
            scrollTop();
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {view === 'results' && attempt && attempt.status === 'submitted' && submittedResult && (
        <ResultsView
          attempt={attempt}
          result={submittedResult}
          downloadNote={downloadNote}
          reportFilename={attempt.reportFilename ?? reportFilename(attempt.studentName)}
          onDownload={handleDownload}
          onRetry={handleRetry}
          onTeacher={openTeacher}
        />
      )}

      {restoredNotice && view === 'exam' && (
        <div className="session-toast" role="status">
          <span className="session-toast-icon"><CheckIcon size={16} /></span>
          <div>
            <strong>تمت استعادة المحاولة المحفوظة</strong>
            <p>عادت إجاباتك وترتيب الأسئلة، والمؤقّت يواصل من وقت البدء الأصلي.</p>
          </div>
          <button type="button" className="icon-button small-icon" onClick={() => setRestoredNotice(false)} aria-label="إغلاق التنبيه">
            <CloseIcon size={15} />
          </button>
        </div>
      )}

      {view !== 'exam' && view !== 'review' && (
        <TeacherKey open={teacherOpen} onClose={closeTeacher} />
      )}

      {storageWarning && saveState === 'error' && (view === 'exam' || view === 'review' || view === 'results') && (
        <div className="storage-toast" role="alert">
          <AlertIcon size={16} />
          <span>{storageWarning}</span>
        </div>
      )}

      <ContactBar position="bottom" />
    </>
  );
}

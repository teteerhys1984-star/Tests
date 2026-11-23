import { useCallback, useEffect, useRef, useState } from 'react';
import { GraduationCap, KeyRound } from 'lucide-react';
import Welcome from './components/Welcome';
import ExamScreen from './components/ExamScreen';
import Results from './components/Results';
import ContactSection from './components/ContactSection';
import TeacherKey from './components/TeacherKey';
import { clearAttempt, loadAttempt, loadMuted, saveAttempt, saveMuted } from './lib/storage';
import { playStartSound, playSubmitSound } from './lib/sounds';
import type { AnswerMap, AnswerValue } from './types';

export default function App() {
  /** Restored once on mount — a refresh never creates a new attempt. */
  const [attempt, setAttempt] = useState(() => loadAttempt());
  const [answers, setAnswers] = useState<AnswerMap>(() => (attempt ? { ...attempt.answers } : {}));
  const [nameDraft, setNameDraft] = useState('');
  const [muted, setMuted] = useState(() => loadMuted());
  const [teacherOpen, setTeacherOpen] = useState(false);
  const restoredRef = useRef(!!attempt && !attempt.submitted && Object.keys(attempt.answers).length > 0);

  const view: 'welcome' | 'exam' | 'results' = !attempt ? 'welcome' : attempt.submitted ? 'results' : 'exam';

  /* Auto-save answers (debounced) — refresh restores progress and the timer. */
  useEffect(() => {
    if (!attempt || attempt.submitted) return;
    const id = window.setTimeout(() => {
      const fresh = loadAttempt();
      if (fresh && !fresh.submitted) saveAttempt({ ...fresh, answers });
    }, 150);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  /* Close the teacher dialog with Escape. */
  useEffect(() => {
    if (!teacherOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTeacherOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [teacherOpen]);

  const handleStart = useCallback(() => {
    const clean = nameDraft.trim();
    if (clean.length < 2) return;
    const fresh = { version: 1 as const, name: clean, startedAt: Date.now(), answers: {}, submitted: false };
    saveAttempt(fresh);
    restoredRef.current = false;
    setAnswers({});
    setAttempt(fresh);
    if (!muted) playStartSound();
    window.scrollTo(0, 0);
  }, [nameDraft, muted]);

  const handleAnswer = useCallback((partId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [partId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    setAttempt((prev) => {
      if (!prev || prev.submitted) return prev;
      const updated = { ...prev, answers, submitted: true, submittedAt: Date.now() };
      saveAttempt(updated);
      return updated;
    });
    if (!muted) playSubmitSound();
    window.scrollTo(0, 0);
  }, [answers, muted]);

  const handleRetake = useCallback(() => {
    clearAttempt();
    restoredRef.current = false;
    setAnswers({});
    setNameDraft('');
    setAttempt(null);
    setTeacherOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      saveMuted(next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {view === 'welcome' && (
        <Welcome name={nameDraft} onNameChange={setNameDraft} onStart={handleStart} muted={muted} onToggleMute={toggleMute} />
      )}

      {view === 'exam' && attempt && (
        <ExamScreen
          name={attempt.name}
          startedAt={attempt.startedAt}
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          muted={muted}
          onToggleMute={toggleMute}
          resumed={restoredRef.current}
        />
      )}

      {view === 'results' && attempt && attempt.submitted && attempt.submittedAt && (
        <Results
          name={attempt.name}
          answers={attempt.answers}
          startedAt={attempt.startedAt}
          submittedAt={attempt.submittedAt}
          onRetake={handleRetake}
        />
      )}

      {/* contact section — hidden while answering to keep focus */}
      {view !== 'exam' && <ContactSection />}

      {/* footer */}
      {view !== 'exam' && (
        <footer className="bg-pine-950 text-cream">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2.5 px-4 py-4 text-[11px] font-semibold text-cream/70 sm:flex-row sm:px-6 sm:text-xs">
            <p className="flex items-center gap-2 font-display font-bold text-cream">
              <GraduationCap className="h-4 w-4 text-gold-400" aria-hidden="true" /> English Exam — Grade 4
            </p>
            <p>Unit 1 · Lessons 1–6 · 12 questions · 100 marks</p>
            <button
              type="button"
              onClick={() => setTeacherOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-bold text-cream/70 transition-colors hover:border-gold-400/50 hover:text-gold-300"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" /> Teacher access
            </button>
          </div>
        </footer>
      )}

      {/* teacher answer key modal — hidden until the password is entered */}
      {teacherOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-pine-950/80 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Teacher answer key"
          onClick={() => setTeacherOpen(false)}
        >
          <div
            className="nice-scroll max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <TeacherKey onClose={() => setTeacherOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

import { Component, useState, type ErrorInfo, type ReactNode } from 'react';
import { QUESTIONS } from './data/questions';
import { useAttempt } from './hooks/useAttempt';
import { useElapsed } from './hooks/useElapsed';
import { loadMuted, saveMuted } from './lib/storage';
import { playStartSound, playSubmitSound } from './lib/audio';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { TeacherArea } from './components/TeacherArea';
import { Footer } from './components/Footer';
import { Button } from './components/ui';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md rounded-card bg-white p-8 text-center shadow-card">
            <h1 className="mb-2 text-xl font-bold">حدث خطأ غير متوقع</h1>
            <p className="mb-6 leading-7 text-ink-soft">يمكنك إعادة تحميل الصفحة؛ محاولتك محفوظة تلقائياً.</p>
            <Button onClick={() => window.location.reload()}>إعادة التحميل</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const { attempt, start, setAnswer, goTo, submit, reset } = useAttempt(QUESTIONS.length);
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [teacherOpen, setTeacherOpen] = useState(false);

  const elapsed = useElapsed(attempt?.startedAt, attempt?.status === 'submitted' ? attempt.finishedAt : null);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    saveMuted(next);
  };

  const handleStart = (name: string) => {
    start(name);
    if (!muted) playStartSound();
  };

  const handleSubmit = () => {
    if (!attempt || attempt.status !== 'in-progress') return;
    submit();
    if (!muted) playSubmitSound();
  };

  let screen: ReactNode;
  if (!attempt) {
    screen = <StartScreen onStart={handleStart} muted={muted} onToggleMute={toggleMute} />;
  } else if (attempt.status === 'in-progress') {
    screen = (
      <QuizScreen
        questions={QUESTIONS}
        attempt={attempt}
        onChange={setAnswer}
        onNavigate={goTo}
        onSubmit={handleSubmit}
        muted={muted}
        onToggleMute={toggleMute}
        elapsed={elapsed}
      />
    );
  } else {
    screen = <ResultScreen questions={QUESTIONS} attempt={attempt} elapsed={elapsed} onNewAttempt={reset} muted={muted} onToggleMute={toggleMute} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {screen}
      <Footer onTeacher={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherArea onClose={() => setTeacherOpen(false)} questions={QUESTIONS} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  );
}

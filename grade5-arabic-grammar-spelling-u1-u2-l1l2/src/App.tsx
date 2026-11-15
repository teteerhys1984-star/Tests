import { useEffect, useMemo, useRef, useState } from 'react';
import { GardenBackdrop } from './components/common/Decor';
import { ExamView } from './components/exam/ExamView';
import { StartScreen } from './components/exam/StartScreen';
import { ResultsView } from './components/results/ResultsView';
import { TeacherArea } from './components/teacher/TeacherArea';
import { useExamSession } from './hooks/useExamSession';
import { downloadReport, type ReportInput } from './utils/report';
import { buildPayload, retryPending, sendWithRetry } from './utils/submit';
import { scoreExam } from './utils/scoring';
import { playStartSound, playSubmitSound } from './utils/sound';

export default function App() {
  const { session, start, setAnswer, goTo, submit, reset, toggleSound } = useExamSession();
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [sendStatus, setSendStatus] = useState('idle');
  const justSubmitted = useRef(false);

  const result = useMemo(
    () => (session.status === 'submitted' ? scoreExam(session.answers) : null),
    [session.status, session.answers],
  );

  const reportInput: ReportInput | null =
    result && session.startedAt && session.submittedAt
      ? {
          studentName: session.studentName,
          attemptId: session.attemptId,
          submittedAt: session.submittedAt,
          elapsedMs: session.submittedAt - session.startedAt,
          answers: session.answers,
          result,
        }
      : null;

  useEffect(() => { void retryPending(); }, []);
  const send = (input: ReportInput) => {
    setSendStatus('sending');
    void sendWithRetry(buildPayload(input)).then(ok => setSendStatus(ok ? 'success' : 'failed'));
  };
  // Automatically download the TXT report once, right after submission.
  useEffect(() => {
    if (justSubmitted.current && reportInput) {
      justSubmitted.current = false;
      try { downloadReport(reportInput); } finally { send(reportInput); }
    }
  }, [reportInput]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [session.currentIndex, session.status]);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen">
      <GardenBackdrop />
      {session.status === 'idle' && (
        <StartScreen
          onTeacher={() => setTeacherOpen(true)}
          onStart={(name) => {
            if (session.soundOn) playStartSound();
            start(name);
          }}
        />
      )}
      {session.status === 'in_progress' && session.startedAt && (
        <ExamView
          name={session.studentName}
          startedAt={session.startedAt}
          answers={session.answers}
          current={session.currentIndex}
          soundOn={session.soundOn}
          onToggleSound={toggleSound}
          onAnswer={setAnswer}
          onGo={goTo}
          onSubmit={() => {
            if (session.soundOn) playSubmitSound();
            justSubmitted.current = true;
            submit();
          }}
        />
      )}
      {session.status === 'submitted' && result && reportInput && (
        <ResultsView
          name={session.studentName}
          submittedAt={reportInput.submittedAt}
          elapsedMs={reportInput.elapsedMs}
          answers={session.answers}
          result={result}
          onDownload={() => downloadReport(reportInput)}
          onSend={() => send(reportInput)}
          sendStatus={sendStatus}
          onRestart={reset}
          onTeacher={() => setTeacherOpen(true)}
        />
      )}
      {teacherOpen && session.status !== 'in_progress' && <TeacherArea onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}

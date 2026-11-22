import { buildPayload, retryPending, sendWithRetry, type SendStatus } from "./utils/submit";
import { EXAM_ID } from "./config";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactFooter } from "./components/ContactFooter";
import { ExamScreen } from "./components/ExamScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { TeacherArea } from "./components/TeacherArea";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QUESTIONS } from "./data/examData";
import { playStartSound, playSubmitSound } from "./utils/audio";
import { gradeExam } from "./utils/grading";
import { type AttemptState, clearAttempt, emptyAttempt, loadAttempt, loadMuted, saveAttempt, saveMuted } from "./utils/storage";

export default function App() {
  const [attempt, setAttempt] = useState<AttemptState>(() => loadAttempt());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [teacherOpen, setTeacherOpen] = useState(false);

  useEffect(() => { void retryPending(); }, []);

  const resend = useCallback(async () => {
    if (attempt.status !== "submitted") return;
    const key = `${EXAM_ID}:sent:${attempt.attemptId}`;
    try { if (localStorage.getItem(key)) { setSendStatus("success"); return; } } catch { /* unavailable */ }
    setSendStatus("sending");
    const ok = await sendWithRetry(buildPayload(attempt));
    setSendStatus(ok ? "success" : "failed");
    if (ok) { try { localStorage.setItem(key, "1"); } catch { /* unavailable */ } }
  }, [attempt]);

  useEffect(() => {
    if (attempt.status === "submitted") void resend();
  }, [attempt.status, resend]);

  // Persist every change (answers, navigation, timing, status).
  useEffect(() => {
    saveAttempt(attempt);
  }, [attempt]);

  // Keep a periodic elapsed-time snapshot as a fallback (timing itself is timestamp-based).
  useEffect(() => {
    if (attempt.status !== "in-progress" || !attempt.startedAt) return;
    const id = window.setInterval(() => {
      setAttempt((a) => (a.status === "in-progress" && a.startedAt ? { ...a, elapsedMs: Date.now() - a.startedAt } : a));
    }, 15000);
    return () => window.clearInterval(id);
  }, [attempt.status, attempt.startedAt]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  }, []);

  const startExam = (name: string) => {
    playStartSound(muted);
    const now = Date.now();
    setAttempt({ ...emptyAttempt(), studentName: name, startedAt: now, status: "in-progress" });
    window.scrollTo({ top: 0 });
  };

  const setAnswer = (id: string, value: string) => {
    setAttempt((a) => ({ ...a, answers: { ...a.answers, [id]: value } }));
  };

  const navigate = (index: number) => {
    setAttempt((a) => ({ ...a, currentQuestion: Math.min(Math.max(index, 0), QUESTIONS.length - 1) }));
  };

  const submitExam = () => {
    playSubmitSound(muted);
    const now = Date.now();
    setAttempt((a) => ({ ...a, submittedAt: now, elapsedMs: a.startedAt ? now - a.startedAt : a.elapsedMs, status: "submitted" }));
    window.scrollTo({ top: 0 });
  };

  const startAgain = () => {
    clearAttempt();
    setAttempt(emptyAttempt());
    window.scrollTo({ top: 0 });
  };

  const result = useMemo(() => (attempt.status === "submitted" ? gradeExam(QUESTIONS, attempt.answers) : null), [attempt.status, attempt.answers]);

  const showTeacherLink = attempt.status !== "in-progress";

  return (
    <div className="flex min-h-screen flex-col text-slate-900" lang="en" dir="ltr">
      <div className="bg-doodles" aria-hidden="true">
        <span style={{ left: "6%", top: "12%", width: 90, height: 90, background: "#fde047", animationDelay: "0s" }} />
        <span style={{ right: "8%", top: "22%", width: 60, height: 60, background: "#f9a8d4", animationDelay: "1.5s" }} />
        <span style={{ left: "12%", bottom: "18%", width: 70, height: 70, background: "#86efac", animationDelay: "3s" }} />
        <span style={{ right: "14%", bottom: "10%", width: 110, height: 110, background: "#a5b4fc", animationDelay: "2s" }} />
        <span style={{ left: "48%", top: "6%", width: 40, height: 40, background: "#67e8f9", animationDelay: "4s" }} />
      </div>
      <div className="relative z-10 flex-1">
        {teacherOpen ? (
          <TeacherArea onClose={() => setTeacherOpen(false)} result={result} studentName={attempt.studentName} />
        ) : attempt.status === "in-progress" && attempt.startedAt ? (
          <ExamScreen
            studentName={attempt.studentName}
            startedAt={attempt.startedAt}
            answers={attempt.answers}
            current={attempt.currentQuestion}
            muted={muted}
            onToggleMute={toggleMute}
            onAnswer={setAnswer}
            onNavigate={navigate}
            onSubmit={submitExam}
          />
        ) : attempt.status === "submitted" && result && attempt.startedAt && attempt.submittedAt ? (
          <><div className="card mx-auto max-w-3xl p-4"><p role="status">Result delivery: {sendStatus}</p><button disabled={sendStatus === "sending" || sendStatus === "success"} onClick={() => void resend()} className="min-h-12 underline">Resend result</button></div><ResultsScreen studentName={attempt.studentName} startedAt={attempt.startedAt} submittedAt={attempt.submittedAt} result={result} onStartAgain={startAgain} /></>
        ) : (
          <WelcomeScreen onStart={startExam} />
        )}
      </div>

      {showTeacherLink && !teacherOpen && (
        <div className="relative z-10 px-4 text-center">
          <button type="button" onClick={() => setTeacherOpen(true)} className="min-h-11 text-xs font-medium text-slate-400 underline-offset-2 active:text-slate-600">
            Teacher Area
          </button>
        </div>
      )}
      <ContactFooter />
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import ExamScreen from "@/components/ExamScreen";
import Results from "@/components/Results";
import TeacherArea from "@/components/TeacherArea";
import Welcome from "@/components/Welcome";
import { gradeExam, type ExamResult, type StudentPartAnswer } from "@/data/exam";
import { clearAttempt, loadAttempt, saveAttempt, saveReport, type Attempt } from "@/lib/storage";
import { playStart, playSubmit } from "@/lib/sound";

type Screen = "welcome" | "exam" | "results";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [report, setReport] = useState<ExamResult | null>(null);
  const [teacher, setTeacher] = useState(false);

  /* ---- restore the active attempt after a refresh ---- */
  useEffect(() => {
    const a = loadAttempt();
    if (!a) return;
    if (a.submittedAt) {
      const r = gradeExam(a.answers, a.name, a.submittedAt, a.submittedAt - a.startedAt);
      setAttempt(a);
      setReport(r);
      setScreen("results");
    } else {
      setAttempt(a);
      setScreen("exam");
    }
  }, []);

  const start = useCallback((name: string) => {
    const a: Attempt = { name, startedAt: Date.now(), answers: {}, muted: false };
    saveAttempt(a);
    setAttempt(a);
    setReport(null);
    setScreen("exam");
    playStart();
  }, []);

  const updateAnswers = useCallback(
    (answers: Record<number, StudentPartAnswer[]>) => {
      if (!attempt) return;
      const next: Attempt = { ...attempt, answers };
      saveAttempt(next);
      setAttempt(next);
    },
    [attempt],
  );

  const toggleMute = useCallback(() => {
    if (!attempt) return;
    const next: Attempt = { ...attempt, muted: !attempt.muted };
    saveAttempt(next);
    setAttempt(next);
  }, [attempt]);

  const submit = useCallback(() => {
    if (!attempt || attempt.submittedAt) return;
    const submittedAt = Date.now();
    const next: Attempt = { ...attempt, submittedAt };
    const result = gradeExam(attempt.answers, attempt.name, submittedAt, submittedAt - attempt.startedAt);
    saveAttempt(next);
    saveReport(result);
    setAttempt(next);
    setReport(result);
    setScreen("results");
    if (!attempt.muted) playSubmit();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [attempt]);

  const retake = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setReport(null);
    setScreen("welcome");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <>
      {screen === "welcome" && <Welcome onStart={start} />}
      {screen === "exam" && attempt && (
        <ExamScreen attempt={attempt} onAnswers={updateAnswers} onSubmit={submit} onToggleMute={toggleMute} />
      )}
      {screen === "results" && report && <Results result={report} onRetake={retake} />}
      {screen === "results" && !report && (
        <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
          <div>
            <p className="font-display text-[20px] font-black">Your report could not be loaded.</p>
            <button
              type="button"
              onClick={retake}
              className="mt-4 min-h-12 rounded-2xl bg-electric px-6 font-display font-extrabold text-white"
            >
              Return to start
            </button>
          </div>
        </div>
      )}
      {teacher && <TeacherArea onClose={() => setTeacher(false)} />}
      {!teacher && (
        <TeacherTrigger onOpen={() => setTeacher(true)} />
      )}
    </>
  );
}

/** Discreet footer trigger for the hidden Teacher Area (client-side convenience gate). */
function TeacherTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Teacher area"
      title="Teacher area"
      className="fixed bottom-24 right-2 z-20 grid h-9 w-9 place-items-center rounded-full text-ink/25 transition hover:text-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
        <circle cx="8" cy="14" r="4" />
        <path d="M11 11 20 2m-4 4 3 3" strokeLinecap="round" />
      </svg>
    </button>
  );
}

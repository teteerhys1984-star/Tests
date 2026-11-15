import { useEffect, useMemo, useState } from "react";
import { EXAM_DATA } from "./data/questions/examQuestions";
import { LESSONS } from "./data/curriculum/lessons";
import WelcomeScreen from "./components/exam/WelcomeScreen";
import ExamScreen from "./components/exam/ExamScreen";
import ResultsScreen from "./components/results/ResultsScreen";
import TeacherKey from "./components/teacher/TeacherKey";
import { FloralHeader } from "./components/common/Decor";
import { scoreSubpart, type SubpartResult } from "./utils/scoring";
import { buildTxtReport, downloadTxt } from "./utils/report";
import { playStartSound, playSubmitSound } from "./utils/sound";

const STORAGE_KEY = "arabic-grade5-exam-session-v1";
const SOUND_KEY = "arabic-grade5-exam-sound";

interface Session {
  studentName: string;
  attemptId: string;
  startTimestamp: number;
  answers: Record<string, string>;
  currentIndex: number;
  submitted: boolean;
  submittedAt: number | null;
  durationMs: number | null;
  soundOn: boolean;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type View = "welcome" | "exam" | "results" | "teacher";

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [view, setView] = useState<View>(() => {
    const s = loadSession();
    if (!s) return "welcome";
    return s.submitted ? "results" : "exam";
  });
  const [now, setNow] = useState(Date.now());
  const [teacherReturn, setTeacherReturn] = useState<View>("welcome");

  const [soundPref, setSoundPref] = useState<boolean>(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
  });
  const soundOn = session?.soundOn ?? soundPref;

  // مؤقت حي
  useEffect(() => {
    if (view !== "exam" || !session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [view, session]);

  const elapsedMs = useMemo(() => {
    if (!session) return 0;
    if (session.submitted && session.durationMs != null) return session.durationMs;
    return Math.max(0, now - session.startTimestamp);
  }, [session, now]);

  const updateSession = (patch: Partial<Session>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  };

  const handleStart = (name: string) => {
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const s: Session = {
      studentName: name,
      attemptId,
      startTimestamp: Date.now(),
      answers: {},
      currentIndex: 0,
      submitted: false,
      submittedAt: null,
      durationMs: null,
      soundOn,
    };
    saveSession(s);
    setSession(s);
    setView("exam");
    if (s.soundOn) playStartSound();
  };

  const handleAnswer = (id: string, v: string) => {
    if (!session) return;
    updateSession({ answers: { ...session.answers, [id]: v } });
  };

  const handleNavigate = (idx: number) => {
    const clamped = Math.max(0, Math.min(EXAM_DATA.questions.length - 1, idx));
    updateSession({ currentIndex: clamped });
  };

  const handleSubmit = () => {
    if (!session) return;
    const durationMs = Date.now() - session.startTimestamp;
    const next: Session = { ...session, submitted: true, submittedAt: Date.now(), durationMs };
    saveSession(next);
    setSession(next);
    setView("results");
    if (next.soundOn) playSubmitSound();
  };

  const handleRetake = () => {
    saveSession(null);
    setSession(null);
    setView("welcome");
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundPref(next);
    try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* ignore */ }
    if (session) updateSession({ soundOn: next });
  };

  const openTeacher = () => {
    setTeacherReturn(view === "teacher" ? "welcome" : view);
    setView("teacher");
  };

  const closeTeacher = () => setView(teacherReturn);

  // حساب النتائج
  const computed = useMemo(() => {
    const results = new Map<string, SubpartResult>();
    let totalEarned = 0, totalMax = 0, grammarEarned = 0, grammarMax = 0, spellingEarned = 0, spellingMax = 0;
    const lessonMap = new Map<string, { lessonId: string; earned: number; max: number; grammarEarned: number; grammarMax: number; spellingEarned: number; spellingMax: number }>();
    for (const l of LESSONS) lessonMap.set(l.id, { lessonId: l.id, earned: 0, max: 0, grammarEarned: 0, grammarMax: 0, spellingEarned: 0, spellingMax: 0 });
    for (const q of EXAM_DATA.questions) {
      const ls = lessonMap.get(q.lessonId)!;
      for (const sp of q.subparts) {
        const r = scoreSubpart(sp, session?.answers[sp.id] ?? "");
        results.set(sp.id, r);
        totalEarned += r.earned;
        totalMax += sp.maxMarks;
        ls.earned += r.earned;
        ls.max += sp.maxMarks;
        if (q.category === "grammar") {
          grammarEarned += r.earned; grammarMax += sp.maxMarks;
          ls.grammarEarned += r.earned; ls.grammarMax += sp.maxMarks;
        } else {
          spellingEarned += r.earned; spellingMax += sp.maxMarks;
          ls.spellingEarned += r.earned; ls.spellingMax += sp.maxMarks;
        }
      }
    }
    return { results, totalEarned, totalMax, grammarEarned, grammarMax, spellingEarned, spellingMax, lessonStats: [...lessonMap.values()] };
  }, [session]);

  const handleDownloadTxt = () => {
    if (!session) return;
    const content = buildTxtReport({
      studentName: session.studentName,
      questions: EXAM_DATA.questions,
      results: computed.results,
      totalEarned: computed.totalEarned,
      totalMax: computed.totalMax,
      grammarEarned: computed.grammarEarned,
      grammarMax: computed.grammarMax,
      spellingEarned: computed.spellingEarned,
      spellingMax: computed.spellingMax,
      durationMs: session.durationMs ?? elapsedMs,
      submittedAt: new Date(session.submittedAt ?? Date.now()),
      lessonStats: computed.lessonStats,
    });
    const safeName = session.studentName.replace(/[\\/:*?"<>|]/g, "_").trim() || "Student";
    downloadTxt(`Arabic_Grade5_Grammar_Spelling_${safeName}.txt`, content);
  };

  return (
    <div className="floral-bg relative min-h-screen">
      <FloralHeader />
      <div className="relative">
        {view === "welcome" && (
          <WelcomeScreen onStart={handleStart} soundOn={soundOn} onToggleSound={toggleSound} onOpenTeacher={openTeacher} />
        )}
        {view === "exam" && session && (
          <ExamScreen
            questions={EXAM_DATA.questions}
            currentIndex={session.currentIndex}
            answers={session.answers}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onSubmit={handleSubmit}
            elapsedMs={elapsedMs}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            studentName={session.studentName}
          />
        )}
        {view === "results" && session && (
          <ResultsScreen
            studentName={session.studentName}
            questions={EXAM_DATA.questions}
            results={computed.results}
            totalEarned={computed.totalEarned}
            totalMax={computed.totalMax}
            grammarEarned={computed.grammarEarned}
            grammarMax={computed.grammarMax}
            spellingEarned={computed.spellingEarned}
            spellingMax={computed.spellingMax}
            durationMs={session.durationMs ?? elapsedMs}
            lessonStats={computed.lessonStats}
            onDownloadTxt={handleDownloadTxt}
            onRetake={handleRetake}
            onOpenTeacher={openTeacher}
          />
        )}
        {view === "teacher" && <TeacherKey questions={EXAM_DATA.questions} onClose={closeTeacher} />}
      </div>
      <footer className="pb-6 text-center text-xs text-pink-500">
        حديقة المعرفة – اختبار اللغة العربية للصف الخامس الأساسي • قواعد اللغة والإملاء فقط
      </footer>
    </div>
  );
}

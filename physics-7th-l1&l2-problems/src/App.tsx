import { useCallback, useEffect, useState } from "react";
import type { LessonId } from "@/content/problems";
import type { AppTab } from "@/lib/site";
import { SiteHeader, SiteFooter, FloatingWhatsApp, ContactSection } from "@/components/Chrome";
import { Home } from "@/components/Home";
import { LessonView } from "@/components/LessonView";
import { TeacherArea } from "@/components/TeacherArea";
import { TeacherGate } from "@/components/TeacherGate";

const validTabs: AppTab[] = ["home", "motion", "force", "teacher"];
const AUTH_KEY = "hala-teacher-auth";

function readUnlocked() {
  try {
    return window.sessionStorage.getItem(AUTH_KEY) === "unlocked";
  } catch {
    return false;
  }
}

function readTab(): AppTab {
  const hash = window.location.hash.replace("#", "").trim();
  return validTabs.includes(hash as AppTab) ? (hash as AppTab) : "home";
}

export default function App() {
  const [tab, setTab] = useState<AppTab>(() => readTab());
  const [problemIndex, setProblemIndex] = useState<Record<LessonId, number>>({ motion: 0, force: 0 });
  const [teacherLesson, setTeacherLesson] = useState<LessonId>("motion");
  const [teacherIndex, setTeacherIndex] = useState(0);
  const [teacherUnlocked, setTeacherUnlocked] = useState(() => readUnlocked());

  useEffect(() => {
    const titles: Record<AppTab, string> = {
      home: "حلا والفيزياء 🌿 | مسائل الحركة والقوة",
      motion: "مسائل الدرس الأول: الحركة والسكون | حلا والفيزياء",
      force: "مسائل الدرس الثاني: القوة والحركة | حلا والفيزياء",
      teacher: "منطقة المعلم: الحلول الكاملة | حلا والفيزياء",
    };
    document.title = titles[tab];
  }, [tab]);

  useEffect(() => {
    const onHashChange = () => {
      setTab(readTab());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback(
    (next: AppTab) => {
      if (next === "teacher" && (tab === "motion" || tab === "force")) {
        setTeacherLesson(tab);
        setTeacherIndex(problemIndex[tab]);
      }
      if (window.location.hash !== `#${next}`) {
        window.history.replaceState(null, "", `#${next}`);
      }
      setTab(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [problemIndex, tab]
  );

  const unlockTeacher = useCallback(() => {
    try {
      window.sessionStorage.setItem(AUTH_KEY, "unlocked");
    } catch {
      /* private browsing: unlock for this view only */
    }
    setTeacherUnlocked(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const lockTeacher = useCallback(() => {
    try {
      window.sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setTeacherUnlocked(false);
    setTab("home");
    if (window.location.hash !== "#home") {
      window.history.replaceState(null, "", "#home");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setLessonProblem = useCallback((lesson: LessonId, index: number) => {
    setProblemIndex((previous) => ({ ...previous, [lesson]: index }));
  }, []);

  return (
    <div className="min-h-screen" dir="rtl">
      <a href="#main-content" className="skip-link">
        تخطَّ إلى المحتوى
      </a>
      <SiteHeader active={tab} onChange={navigate} />

      <main id="main-content">
        {tab === "home" ? (
          <Home onNavigate={navigate} />
        ) : tab === "teacher" && !teacherUnlocked ? (
          <TeacherGate onUnlock={unlockTeacher} onNavigate={navigate} />
        ) : tab === "teacher" ? (
          <TeacherArea
            onLock={lockTeacher}
            lessonId={teacherLesson}
            onLessonChange={(lesson) => {
              setTeacherLesson(lesson);
              setTeacherIndex(0);
            }}
            index={teacherIndex}
            onIndexChange={setTeacherIndex}
            onNavigate={navigate}
          />
        ) : (
          <LessonView
            lessonId={tab}
            index={problemIndex[tab]}
            onIndexChange={(index) => setLessonProblem(tab, index)}
            onNavigate={navigate}
          />
        )}
      </main>

      <ContactSection />
      <SiteFooter onChange={navigate} />
      <FloatingWhatsApp />
    </div>
  );
}

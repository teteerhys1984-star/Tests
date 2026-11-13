import { useEffect } from "react";

/**
 * The Grade 8 Physics exam is delivered as a standalone, offline-capable,
 * dependency-free HTML file (Arabic RTL, embedded CSS/JS/audio):
 *   public/Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html
 * The built index.html already IS the exam; this component only matters when
 * the app is launched through the Vite dev server React entry — it forwards
 * to the standalone file immediately.
 */
const EXAM_FILE = "/Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html";

export default function App() {
  useEffect(() => {
    window.location.replace(EXAM_FILE);
  }, []);

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b2545",
        color: "#eef4fb",
        fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>اختبار الفيزياء — الوحدة الأولى: الحركة والقوى</h1>
        <p style={{ color: "#b9c9dd", marginBottom: 16 }}>جارٍ تحميل الاختبار التفاعلي…</p>
        <a href={EXAM_FILE} style={{ color: "#9fd7d2", fontWeight: 700 }}>
          إذا لم يبدأ التحميل تلقائياً اضغط هنا لفتح الاختبار
        </a>
      </div>
    </div>
  );
}

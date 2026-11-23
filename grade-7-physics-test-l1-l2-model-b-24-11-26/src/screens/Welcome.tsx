/**
 * صفحة الترحيب — نفس تصميم شاشة البدء في المصدر (لوحة الهوية + نموذج البدء).
 * تُضاف بطاقة استعادة المحاولة المحفوظة بنفس الهوية (إضافة تفاعلية لا تغيّر الهوية).
 */

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EXAM_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";
import { questions, totalParts } from "../data/questions";
import { num } from "../lib/time";
import type { Attempt } from "../lib/persistence";

export function Welcome({
  storedAttempt,
  onStart,
  onResume,
  onDiscard,
  onTeacher,
}: {
  storedAttempt: Attempt | null;
  onStart: (name: string) => void;
  onResume: () => void;
  onDiscard: () => void;
  onTeacher: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const trimmed = name.trim();

  const go = () => {
    if (trimmed.length < 3) {
      setError("اكتبي اسمك الكامل (ثلاثة أحرف على الأقل) لبدء الاختبار.");
      return;
    }
    setError("");
    onStart(trimmed);
  };

  const isSubmitted = storedAttempt?.status === "submitted";

  return (
    <main className="start-page">
      <div className="start-ambient start-ambient--one" aria-hidden="true" />
      <div className="start-ambient start-ambient--two" aria-hidden="true" />
      <section className="start-layout page-container" aria-labelledby="start-title">
        <div className="start-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> الوحدة الأولى <span className="eyebrow-separator">/</span> النموذج B</div>
          <h1 id="start-title">اختبار الدرسين الأول والثاني <span>الصف السابع · 23-11-2026</span></h1>
          <p className="start-description">
            {EXAM_TITLE}. الحركة والسكون، والقوة والحركة — اختبار يساعدك على إظهار ما فهمتِه خطوة بخطوة.
          </p>
          <div className="start-illustration" aria-hidden="true">
            <svg viewBox="0 0 550 165" preserveAspectRatio="xMidYMid meet" fill="none">
              <path d="M2 125 C85 125 112 49 181 49 S291 130 362 109 S448 21 548 21" stroke="#d9c7e4" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
              <circle cx="181" cy="49" r="10" fill="#e8b1c9" />
              <circle cx="362" cy="109" r="10" fill="#a8d9d8" />
              <circle cx="548" cy="21" r="6" fill="#b69ad1" />
              <path d="M11 137v-26M0 124h24" stroke="#d9c7e4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="start-stats">
            <span>{num(questions.length)} أسئلة رئيسية</span>
            <span aria-hidden="true">·</span>
            <span>{num(totalParts)} فرعاً مُقوّماً</span>
            <span aria-hidden="true">·</span>
            <span>{num(TOTAL_MARKS)} علامة</span>
          </div>
        </div>

        <div className="start-form">
          <span className="form-topline" aria-hidden="true" />
          {storedAttempt ? (
            <div data-testid="resume-card">
              <p className="form-kicker">محاولة محفوظة</p>
              <h2>{isSubmitted ? "لديك نتيجة محفوظة" : "لديك محاولة لم تُسلَّم بعد"}</h2>
              <p className="resume-note">
                الاسم: <strong>{storedAttempt.studentName}</strong><br />
                {isSubmitted
                  ? "الاختبار مُسلَّم ومُصحَّح. يمكنك مراجعة النتيجة وتنزيل التقرير مرة أخرى."
                  : "إجاباتك ووقتك محفوظان على هذا الجهاز. يمكنك المتابعة من حيث توقفتِ."}
              </p>
              <button type="button" className="primary-button start-button" onClick={onResume}>
                {isSubmitted ? "عرض النتيجة المحفوظة" : "متابعة الاختبار"} <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <button type="button" className="outline-button" style={{ marginTop: 10, width: "100%", justifyContent: "center" }} onClick={onDiscard}>
                حذف المحاولة والبدء من جديد
              </button>
              <p className="resume-note" style={{ marginTop: 14, marginBottom: 0 }}>
                بيانات هذه المحاولة محفوظة لهذا الاختبار وحده ({GRADE_LABEL} — {SUBJECT_LABEL}) ولا تتقاطع مع أي اختبار آخر.
              </p>
            </div>
          ) : (
            <>
              <p className="form-kicker">قبل البداية</p>
              <h2>جاهزة لتبدئي؟</h2>
              <p className="form-intro">{GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL}. {num(questions.length)} أسئلة رئيسية، مجموعها {num(TOTAL_MARKS)} علامة. يبدأ عداد الوقت عندما تضغطين زر البدء.</p>
              <label className="field-label" htmlFor="student-name">اسم الطالب / الطالبة <span aria-hidden="true">*</span></label>
              <input
                id="student-name"
                className="student-input"
                type="text"
                required
                maxLength={70}
                autoComplete="name"
                value={name}
                placeholder="اكتبي اسمك هنا"
                aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby="name-error"
                onChange={(event) => { setName(event.target.value); setError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter") go(); }}
              />
              {error && <p className="name-error" id="name-error" role="alert">{error}</p>}
              <div className="start-instructions">
                <p>اقرئي كل موقف ورسم بعناية، واجيبي عن جميع الفروع.</p>
                <p>يُحفظ اسمك وإجاباتك ووقتك تلقائياً على هذا الجهاز.</p>
                <p>لا تظهر الإجابات والنتيجة إلا بعد تسليم الاختبار.</p>
              </div>
              <button type="button" className="primary-button start-button" onClick={go} disabled={trimmed.length < 3}>
                بدء الاختبار <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onTeacher}
                className="teacher-entry"
                style={{ width: "100%", marginTop: 10, justifyContent: "center", border: "1px dashed #d8c7e0", borderRadius: 11, padding: "10px", color: "#8a7490" }}
                data-action="open-teacher"
              >
                دليل المعلّم ونموذج الإجابات
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

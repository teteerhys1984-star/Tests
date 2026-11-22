/**
 * صفحة الترحيب: هوية الاختبار، نطاق الدرسين، إدخال اسم الطالب، وتعليمات البدء.
 * إن وُجدت محاولة محفوظة تُعرض بطاقة استعادة بدل نموذج البدء.
 */

import { useState } from "react";
import {
  EXAM_TITLE,
  GRADE_LABEL,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TOTAL_MARKS,
} from "../config";
import { questions } from "../data/questions";
import { countParts } from "../lib/grading";
import { EXAM_LESSON_L1, EXAM_LESSON_L2, belongsToLesson, isSharedQuestion } from "../exam/types";
import { num } from "../lib/time";
import type { Attempt } from "../lib/persistence";

export function Welcome({
  storedAttempt,
  onStart,
  onResume,
  onDiscard,
}: {
  storedAttempt: Attempt | null;
  onStart: (name: string) => void;
  onResume: () => void;
  onDiscard: () => void;
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

  const totalParts = countParts(questions);
  const shared = questions.filter((question) => isSharedQuestion(question));
  const lessons = [
    {
      id: 1,
      title: EXAM_LESSON_L1,
      pages: "ص 3 – 16",
      count: questions.filter((question) => belongsToLesson(question, EXAM_LESSON_L1)).length,
    },
    {
      id: 2,
      title: EXAM_LESSON_L2,
      pages: "ص 17 – 28",
      count: questions.filter((question) => belongsToLesson(question, EXAM_LESSON_L2)).length,
    },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-3 pb-6 pt-5 sm:px-4 sm:pt-8">
      {/* ===== لوحة الهوية ===== */}
      <section
        className="relative overflow-hidden rounded-[var(--r-lg)] shadow-[var(--sh-3)]"
        style={{ background: "linear-gradient(135deg,#10313c 0%,#174c5b 48%,#0f766e 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.13]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-10">
          <div className="text-[#f4ecd8]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#ffd97a" }}>
              {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · النموذج A
            </p>
            <h1 className="mt-2 text-[clamp(1.35rem,4.2vw,2.3rem)] font-extrabold leading-[1.35]" style={{ color: "#fff8e8" }}>
              {EXAM_TITLE}
            </h1>
            <p className="mt-3 max-w-xl text-[0.96rem] leading-relaxed opacity-90">
              اختبار إلكتروني في الدرس الأول (الحركة والسكون) والدرس الثاني (القوة والحركة) من الوحدة الأولى.
              الأسئلة مرتّبة كما في المصدر، وكل سؤال رئيسي يتفرّع إلى فروع مُقوّمة بعلامات جزئية عند استحقاقها.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { key: num(questions.length), label: "سؤالاً رئيسياً" },
                { key: num(totalParts), label: "فرعاً مُقوّماً" },
                { key: num(2), label: "درسان" },
                { key: num(TOTAL_MARKS), label: "علامة" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[var(--r-md)] border p-2.5 text-center"
                  style={{ borderColor: "rgba(255,248,232,0.24)", background: "rgba(255,248,232,0.07)" }}
                >
                  <div className="tnum text-[clamp(1.4rem,3.6vw,1.9rem)] font-extrabold leading-none" style={{ color: "#ffd97a" }}>
                    {stat.key}
                  </div>
                  <div className="mt-1 text-[0.76rem] opacity-85">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 330 240" className="h-auto w-full max-w-[380px]" role="img" aria-label="زخرفة: مخطط حركة وسهم قوة">
              <path
                d="M14 200 C70 200 96 92 150 92 S236 196 316 44"
                stroke="#ffd97a"
                strokeOpacity="0.8"
                strokeWidth="2.4"
                fill="none"
                strokeDasharray="7 9"
              />
              <line x1="14" y1="214" x2="316" y2="214" stroke="#fff8e8" strokeOpacity="0.45" strokeWidth="2" />
              <line x1="14" y1="30" x2="14" y2="214" stroke="#fff8e8" strokeOpacity="0.45" strokeWidth="2" />
              {[
                [14, 200],
                [150, 92],
                [232, 92],
                [316, 44],
              ].map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r="5" fill="#fff8e8" stroke="#b5851d" strokeWidth="2" />
              ))}
              <line x1="60" y1="232" x2="170" y2="232" stroke="#7fe0d3" strokeWidth="5" strokeLinecap="round" />
              <path d="M170 226 L186 232 L170 238 Z" fill="#7fe0d3" />
              <text x="196" y="238" fill="#ffd97a" fontSize="14" fontWeight="700" fontFamily="Cairo, sans-serif">
                2 cm = 20 N
              </text>
            </svg>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* ===== نطاق الاختبار ===== */}
        <section className="card p-4 sm:p-6">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--gold-deep)" }}>
            نطاق الاختبار
          </p>
          <h2 className="text-[1.5rem] font-extrabold" style={{ color: "var(--navy)" }}>
            الدرسان المشمولان
          </h2>
          <ul className="mt-3 grid gap-2">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-start gap-3 rounded-[var(--r-sm)] border p-2.5"
                style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
              >
                <span
                  className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] text-base font-bold"
                  style={{ background: "var(--navy)", color: "#ffd97a" }}
                >
                  {num(lesson.id)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-bold" style={{ color: "var(--ink-1)" }}>
                    {lesson.title}
                  </span>
                  <span className="block text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                    {lesson.pages} · {num(lesson.count)} أسئلة رئيسية (منها السؤال التركيبي)
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-3 rounded-[var(--r-sm)] p-2.5 text-[0.82rem] leading-relaxed"
            style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
          >
            السؤال {num(questions.indexOf(shared[0]) + 1)} تركيبي بين الدرسين ({num(shared.length)} سؤال)، ويُحتسب في
            توزيع الدرسين معاً دون إنشاء درس ثالث. توزيع العلامات: {num(questions.length)} أسئلة ×{" "}
            {num(10)} علامات = {num(TOTAL_MARKS)} علامة.
          </p>
          <ul className="mt-3 grid gap-1.5 text-[0.85rem]" style={{ color: "var(--ink-2)" }}>
            <li>· يُمنع تسليم الاختبار قبل إكمال جميع الفروع.</li>
            <li>· المؤقّت تصاعدي ويبدأ عند الضغط على «بدء الاختبار» فقط.</li>
            <li>· لا تظهر أي إجابة صحيحة ولا علامة قبل التسليم.</li>
            <li>· يمكن مراجعة الإجابات قبل التسليم والعودة لتعديلها.</li>
          </ul>
        </section>

        {/* ===== البدء أو الاستعادة ===== */}
        <section className="card p-4 sm:p-6" style={{ borderColor: "#cdbfa4" }}>
          {storedAttempt ? (
            <div data-testid="resume-card">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--gold-deep)" }}>
                محاولة محفوظة
              </p>
              <h2 className="mt-1 text-[1.35rem] font-extrabold leading-snug" style={{ color: "var(--navy)" }}>
                {storedAttempt.status === "in_progress" ? "لديك محاولة لم تُسلَّم بعد" : "لديك نتيجة محفوظة"}
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: "var(--ink-2)" }}>
                الاسم: <strong>{storedAttempt.studentName}</strong>
                <br />
                {storedAttempt.status === "in_progress"
                  ? "إجاباتك ووقتك محفوظان على هذا الجهاز. يمكنك المتابعة من حيث توقفتِ."
                  : "الاختبار مُسلَّم ومُصحَّح. يمكنك مراجعة النتيجة وتنزيل التقرير مرة أخرى."}
              </p>
              <button type="button" className="btn btn-gold mt-4 w-full text-[1.02rem]" onClick={onResume} data-action="resume-attempt">
                {storedAttempt.status === "in_progress" ? "متابعة الاختبار" : "عرض النتيجة المحفوظة"}
              </button>
              <button type="button" className="btn btn-ghost mt-2 w-full" onClick={onDiscard} data-action="discard-attempt">
                حذف المحاولة والبدء من جديد
              </button>
              <p className="mt-3 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                بيانات هذه المحاولة محفوظة لهذا الاختبار وحده ({GRADE_LABEL} — {SUBJECT_LABEL} — النموذج A) ولا تتقاطع
                مع النموذج B أو أي اختبار آخر.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--gold-deep)" }}>
                ابدأ الاختبار
              </p>
              <h2 className="mt-1 text-[1.4rem] font-extrabold leading-snug" style={{ color: "var(--navy)" }}>
                اكتبي اسمك ثم اضغطي «بدء الاختبار»
              </h2>
              <div className="mt-3">
                <label htmlFor="student-name" className="mb-1.5 block text-sm font-bold" style={{ color: "var(--ink-2)" }}>
                  اسم الطالب / الطالبة <span style={{ color: "var(--clay)" }}>*</span>
                </label>
                <input
                  id="student-name"
                  className="field"
                  value={name}
                  autoComplete="name"
                  maxLength={70}
                  placeholder="مثال: رنا أحمد"
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby="student-name-note"
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") go();
                  }}
                />
                <p id="student-name-note" className="mt-1 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                  يُستعمل الاسم في تقرير النتيجة المرفوع إلى معلّمك.
                </p>
                {error && (
                  <p role="alert" className="mt-1 text-[0.85rem] font-bold" style={{ color: "var(--clay)" }}>
                    {error}
                  </p>
                )}
              </div>
              <button type="button" className="btn btn-gold mt-4 w-full text-[1.02rem]" onClick={go} data-action="start-exam">
                بدء الاختبار
              </button>
              <p className="mt-3 text-[0.76rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
                بالتسليم تُصحَّح الإجابات تلقائياً وفق سلّم معايير معتمد، ويُنزَّل تقرير TXT تفصيلي، وتُرسَل النتيجة إلى
                معلّمك.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

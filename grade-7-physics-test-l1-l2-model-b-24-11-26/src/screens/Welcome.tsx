/**
 * صفحة الترحيب: هوية الاختبار، نطاق الدروس، إدخال اسم الطالب، وتعليمات البدء.
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
import { questions, totalParts } from "../data/questions";
import { num } from "../lib/time";
import type { Attempt } from "../lib/persistence";

export function Welcome({
  initialName = "",
  storedAttempt,
  onStart,
  onResume,
  onDiscard,
  onTeacher,
}: {
  initialName?: string;
  storedAttempt: Attempt | null;
  onStart: (name: string) => void;
  onResume: () => void;
  onDiscard: () => void;
  onTeacher: () => void;
}) {
  const [name, setName] = useState(initialName);
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

  const lessons = [
    { num: 1, title: "الحركة والسكون", pages: "ص 3 – 16", count: questions.filter((q) => q.lesson === "الحركة والسكون").length },
    { num: 2, title: "القوة والحركة", pages: "ص 17 – 28", count: questions.filter((q) => q.lesson === "القوة والحركة").length },
  ];
  const integrated = questions.filter((q) => q.lesson.includes("+")).length;

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
              {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL}
            </p>
            <h1 className="mt-2 text-[clamp(1.6rem,4.6vw,2.6rem)] font-extrabold leading-[1.3]" style={{ color: "#fff8e8" }}>
              {EXAM_TITLE}
            </h1>
            <p className="mt-3 max-w-xl text-[0.96rem] leading-relaxed opacity-90">
              اختبار إلكتروني في الدرس الأول (الحركة والسكون) والدرس الثاني (القوة والحركة) من الوحدة الأولى.
              الأسئلة مرتّبة كما في المصدر، وكل سؤال رئيسي يتفرّع إلى فروع مُقوّمة بعلامات جزئية عند استحقاقها.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { k: num(questions.length), v: "سؤالاً رئيسياً" },
                { k: num(totalParts), v: "فرعاً مُقوّماً" },
                { k: num(2), v: "درسان" },
                { k: num(TOTAL_MARKS), v: "علامة" },
              ].map((stat) => (
                <div
                  key={stat.v}
                  className="rounded-[var(--r-md)] border p-2.5 text-center"
                  style={{ borderColor: "rgba(255,248,232,0.24)", background: "rgba(255,248,232,0.07)" }}
                >
                  <div className="tnum text-[clamp(1.4rem,3.6vw,1.9rem)] font-extrabold leading-none" style={{ color: "#ffd97a" }}>
                    {stat.k}
                  </div>
                  <div className="mt-1 text-[0.76rem] opacity-85">{stat.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 330 240" className="h-auto w-full max-w-[380px]" role="img" aria-label="زخرفة: مخطط حركة وسهم قوة">
              <path d="M14 200 C70 200 96 92 150 92 S236 196 316 44" stroke="#ffd97a" strokeOpacity="0.8" strokeWidth="2.4" fill="none" strokeDasharray="7 9" />
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
              <text x="150" y="150" fill="#ffd97a" fontSize="15" fontWeight="700" fontFamily="Cairo, sans-serif">
                F = 15 N
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
                key={lesson.num}
                className="flex items-start gap-3 rounded-[var(--r-sm)] border p-2.5"
                style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
              >
                <span
                  className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] text-base font-bold"
                  style={{ background: "var(--navy)", color: "#ffd97a" }}
                >
                  {num(lesson.num)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-bold" style={{ color: "var(--ink-1)" }}>
                    {lesson.title}
                  </span>
                  <span className="block text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                    {lesson.pages} · {num(lesson.count)} أسئلة رئيسية
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-[var(--r-sm)] p-2.5 text-[0.82rem] leading-relaxed" style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}>
            السؤال الأخير تركيبي بين الدرسين ({num(integrated)} سؤال)، ويُحتسب في توزيع الدرسين معاً.
            توزيع العلامات: {num(questions.length)} أسئلة × {num(10)} علامات = {num(TOTAL_MARKS)} علامة.
          </p>
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
              <button type="button" className="btn btn-gold mt-4 w-full text-[1.02rem]" onClick={onResume}>
                {storedAttempt.status === "in_progress" ? "متابعة الاختبار" : "عرض النتيجة المحفوظة"}
              </button>
              <button type="button" className="btn btn-ghost mt-2 w-full" onClick={onDiscard}>
                حذف المحاولة والبدء من جديد
              </button>
              <p className="mt-3 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                بيانات هذه المحاولة محفوظة لهذا الاختبار وحده ({GRADE_LABEL} — {SUBJECT_LABEL}) ولا تتقاطع مع أي اختبار آخر.
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
                {error && (
                  <p role="alert" id="name-error" className="mt-2 text-sm font-semibold" style={{ color: "var(--err)" }}>
                    {error}
                  </p>
                )}
                <p id="student-name-note" className="mt-2 text-[0.82rem]" style={{ color: "var(--ink-2)" }}>
                  تُرسَل نتيجتك إلى معلّمك عند التسليم، ويُحفظ تقدّمك محلياً في هذا المتصفح.
                </p>
              </div>

              <button type="button" className="btn btn-gold mt-4 w-full text-[1.02rem]" onClick={go} disabled={trimmed.length < 3}>
                بدء الاختبار
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </button>

              <ul className="mt-4 grid gap-1.5 text-[0.83rem]" style={{ color: "var(--ink-2)" }}>
                {[
                  "لا يوجد عدّ تنازلي — المؤقّت يقيس زمن الحل فقط.",
                  "لا تظهر أي إجابة أو تلميح قبل التسليم.",
                  "يُقفل التسليم حتى تُجاب جميع الفروع (مراجعة الإجابات متاحة قبله).",
                  "عند التسليم يُنزَّل تقرير TXT تلقائياً ويُعرض التصحيح التفصيلي.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3" className="mt-1 shrink-0" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onTeacher}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--r-sm)] border border-dashed py-2.5 text-sm font-bold"
                style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                دليل المعلّم ونموذج الإجابات
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

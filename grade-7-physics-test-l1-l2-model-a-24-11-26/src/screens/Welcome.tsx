/**
 * شاشة الترحيب — نفس تركيبة شاشة البدء في المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/StartScreen.tsx):
 * بطاقة الهوية مع صورة البطل، تعليمات الاختبار، حقل الاسم، زر البدء، وزر الصوت.
 * أُضيف داخل البطاقة نفسها: بطاقة الاستعادة عند وجود محاولة محفوظة،
 * وبطاقة «الدرسان المشمولان» أسفل الشبكة بهوية المصدر.
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
import { EXAM_LESSON_L1, EXAM_LESSON_L2, belongsToLesson, isSharedQuestion } from "../exam/types";
import { num } from "../lib/time";
import type { Attempt } from "../lib/persistence";
import { Button, Card, inputCls, labelCls } from "../components/ui";
import heroUrl from "../assets/hero.jpg";

/** أيقونات تعليمات المصدر (ListChecks · ShieldCheck · Clock · Save · ChevronLeft) */
function Icon({ name }: { name: "list" | "shield" | "clock" | "save" | "chevron" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "list":
      return (
        <svg {...common}>
          <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17M11 6h10M11 12h10M11 18h10" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.7 9a.6.6 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .7-1c2.4-.6 4.9-1.4 7.3-2.6a1 1 0 0 1 1 0c2.4 1.2 4.9 2 7.3 2.6a1 1 0 0 1 .7 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "save":
      return (
        <svg {...common}>
          <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
  }
}

const INSTRUCTIONS: { icon: "list" | "shield" | "clock" | "save" | "chevron"; text: string }[] = [
  { icon: "list", text: "10 أسئلة رئيسية، لكل سؤال 10 علامات، والمجموع 100 علامة." },
  { icon: "shield", text: "أجيبي عن جميع الفروع؛ لا يمكن التسليم قبل إكمال جميع الفروع المطلوبة." },
  { icon: "clock", text: "يبدأ المؤقت عند الضغط على «بدء الاختبار» فقط، ويُحفظ تقدّمك تلقائياً عند التنقل أو التحديث." },
  { icon: "save", text: "لا تُعرض الإجابات الصحيحة ولا العلامات إلا في صفحة النتائج بعد التسليم." },
  { icon: "chevron", text: "راجعي إجاباتك قبل التسليم، ثم اضغطي «تسليم الاختبار» في صفحة المراجعة." },
];

export function Welcome({
  storedAttempt,
  onStart,
  onResume,
  onDiscard,
  muted,
  onToggleMute,
}: {
  storedAttempt: Attempt | null;
  onStart: (name: string) => void;
  onResume: () => void;
  onDiscard: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const trimmed = name.trim();

  const go = () => {
    if (trimmed.length < 3) {
      setError("اكتبي اسمك الثلاثي من فضلك (3 أحرف على الأقل).");
      return;
    }
    setError("");
    onStart(trimmed);
  };

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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="order-2">
          <img src={heroUrl} alt="" className="mx-auto aspect-[4/3] w-full max-w-md rounded-card object-cover shadow-card" />
        </div>
        <Card className="order-1 p-6 sm:p-8">
          <p className="mb-1 text-sm font-semibold text-blush-500">الوحدة الأولى — الدرس الأول والدرس الثاني</p>
          <h1 className="text-2xl font-bold leading-9 sm:text-3xl">اختبار الفيزياء — الصف السابع</h1>
          <p className="mt-1 text-ink-soft">النموذج A</p>
          <p className="sr-only">
            {EXAM_TITLE} · {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · 37 فرعاً مُقوّماً
          </p>

          {storedAttempt ? (
            <div className="mt-6" data-testid="resume-card">
              <div className="rounded-2xl bg-blush-50 p-4">
                <p className="mb-1 text-sm font-semibold text-plum-700">لديك محاولة محفوظة</p>
                <h2 className="text-lg font-bold leading-8">
                  {storedAttempt.status === "in_progress" ? "لم تُسلَّم محاولتك بعد" : "لديك نتيجة محفوظة"}
                </h2>
                <p className="mt-1 text-sm leading-7 text-ink-soft">
                  الاسم: <b className="text-ink">{storedAttempt.studentName}</b>
                  <br />
                  {storedAttempt.status === "in_progress"
                    ? "إجاباتك ووقتك محفوظان على هذا الجهاز. يمكنك المتابعة من حيث توقفتِ."
                    : "الاختبار مُسلَّم ومُصحَّح. يمكنك مراجعة النتيجة وتنزيل التقرير مرة أخرى."}
                </p>
              </div>
              <Button size="lg" className="mt-4 w-full" onClick={onResume} data-action="resume-attempt">
                {storedAttempt.status === "in_progress" ? "متابعة الاختبار" : "عرض النتيجة المحفوظة"}
              </Button>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onDiscard} data-action="discard-attempt">
                حذف المحاولة والبدء من جديد
              </Button>
              <p className="mt-3 text-xs leading-6 text-ink-faint">
                بيانات هذه المحاولة محفوظة لهذا الاختبار وحده ({GRADE_LABEL} — {SUBJECT_LABEL} — النموذج A).
              </p>
            </div>
          ) : (
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                go();
              }}
            >
              <label className="block">
                <span className={labelCls}>
                  اسم الطالبة <span className="text-coral-500">*</span>
                </span>
                <input
                  id="student-name"
                  value={name}
                  autoComplete="name"
                  autoFocus
                  maxLength={70}
                  placeholder="اكتبي اسمك الثلاثي"
                  aria-required="true"
                  aria-invalid={!!error}
                  className={inputCls}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                />
                {error && (
                  <p role="alert" className="mt-1 text-sm text-coral-500">
                    {error}
                  </p>
                )}
              </label>

              <div className="rounded-2xl bg-blush-50 p-4 text-sm leading-7">
                <p className="mb-2 font-semibold">تعليمات الاختبار</p>
                <ul className="space-y-2">
                  {INSTRUCTIONS.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 shrink-0 text-plum-500">
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button type="submit" size="lg" className="w-full" data-action="start-exam">
                بدء الاختبار
              </Button>
            </form>
          )}

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
              data-action="toggle-sound"
            >
              {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
              الصوت: {muted ? "مكتوم" : "مفعّل"}
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="text-lg font-bold">الدرسان المشمولان</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-start gap-3 rounded-2xl border border-blush-100 bg-blush-50/60 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-plum-600 text-sm font-bold text-white">
                {num(lesson.id)}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-7">{lesson.title}</span>
                <span className="block text-xs leading-6 text-ink-soft">
                  {lesson.pages} · {num(lesson.count)} أسئلة رئيسية (منها السؤال التركيبي)
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-2xl bg-sun-100/70 p-3 text-sm leading-7 text-sun-600">
          السؤال {num(questions.indexOf(shared[0]) + 1)} تركيبي بين الدرسين ({num(shared.length)} سؤال)، ويُحتسب في
          توزيع الدرسين معاً دون إنشاء درس ثالث. توزيع العلامات: {num(questions.length)} أسئلة × {num(10)} علامات ={" "}
          {num(TOTAL_MARKS)} علامة.
        </p>
      </Card>
    </main>
  );
}

/** أيقونتا الصوت — بديل محلي لأيقونات lucide في المصدر (بلا اعتمادية إضافية). */
function VolumeOnIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VolumeOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  );
}

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  KeyRound,
  Layers3,
  ListChecks,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EXAM_QUESTIONS, LESSONS, TOTAL_BRANCHES, TOTAL_MARKS, TOTAL_QUESTIONS } from "@/data/exam";
import { ArabicSeal, Brand, DecorativeCorner, GradeBadge } from "./Common";

type StartScreenProps = {
  studentName: string;
  onNameChange: (value: string) => void;
  onStart: () => void;
  onOpenTeacherKey: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
};

const INSTRUCTIONS = [
  {
    icon: UserRound,
    title: "اسمك أولًا",
    text: "إدخال الاسم إلزامي؛ سيظهر في صفحة النتيجة وفي تقرير TXT.",
  },
  {
    icon: ListChecks,
    title: "اقرأ بهدوء وأجب",
    text: `${TOTAL_QUESTIONS} أسئلة رئيسية و${TOTAL_BRANCHES} فرعًا إلزاميًا، ومجموع العلامات ${TOTAL_MARKS}.`,
  },
  {
    icon: Layers3,
    title: "تنقّل بحرية",
    text: "يمكنك الانتقال بين الأسئلة والعودة وتعديل أي إجابة قبل التسليم.",
  },
  {
    icon: Clock3,
    title: "مؤقّت تصاعدي",
    text: "لا وقت محدد للحل. يبدأ المؤقّت عند الضغط على زر البدء ويستمر عند تحديث الصفحة.",
  },
  {
    icon: ShieldCheck,
    title: "حفظ تلقائي",
    text: "تُحفظ إجاباتك ومحاولتك على هذا الجهاز، وتُستعاد المحاولة نفسها عند تحديث الصفحة.",
  },
  {
    icon: FileText,
    title: "تسليم ثم مراجعة",
    text: "لا تظهر الإجابات أو التلميحات قبل التسليم. بعده تحصل على مراجعة مفصلة وتقرير نصي.",
  },
];

const SCOPE_GROUPS = [
  {
    unit: "الوحدة الأولى",
    label: "أحلامي وطموحاتي",
    lessons: [LESSONS.L1, LESSONS.L2, LESSONS.L3],
  },
  {
    unit: "الوحدة الثانية",
    label: "الدرسان الأول والثاني فقط",
    lessons: [LESSONS.U2L1, LESSONS.U2L2],
  },
];

export function StartScreen({
  studentName,
  onNameChange,
  onStart,
  onOpenTeacherKey,
  soundOn,
  onToggleSound,
}: StartScreenProps) {
  const canStart = studentName.trim().length >= 2;
  const arabicNumber = (value: number): string => value.toLocaleString("ar-EG", { useGrouping: false });
  const questionsByLesson = EXAM_QUESTIONS.reduce<Record<string, number>>((acc, question) => {
    acc[question.lessonKey] = (acc[question.lessonKey] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className="hidden items-center gap-2 rounded-full border border-[#d8cdb9] bg-[#fffdf8]/75 px-3.5 py-2 text-xs font-semibold text-[#41544f] transition hover:border-[#1f7a6a]/40 hover:bg-white sm:inline-flex"
            aria-pressed={soundOn}
            aria-label={soundOn ? "إيقاف الصوت" : "تشغيل الصوت"}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            الصوت
          </button>
          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="inline-flex items-center gap-2 rounded-full border border-[#0d3b35]/15 bg-[#0d3b35] px-4 py-2 text-xs font-semibold text-[#f6efdf] shadow-sm transition hover:bg-[#124b44]"
          >
            <KeyRound className="h-4 w-4 text-[#d9b873]" />
            <span className="hidden sm:inline">Teacher Answer Key</span>
            <span className="sm:hidden">المعلم</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <section className="arabesque-bg relative isolate overflow-hidden rounded-[2rem] border border-[#c4a15a]/25 px-5 py-8 shadow-[0_35px_80px_-48px_rgba(8,41,36,0.75)] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <DecorativeCorner className="pointer-events-none absolute -left-8 -top-8 h-64 w-64 text-[#c4a15a]/25" />
          <DecorativeCorner className="pointer-events-none absolute -bottom-10 -right-8 h-64 w-64 rotate-180 text-[#c4a15a]/20" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <div className="animate-fade-up">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <GradeBadge />
                <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-semibold text-[#e9e1cf]">
                  منهاج موثّق · ٥ دروس
                </span>
              </div>

              <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#d9b873]">
                <Sparkles className="h-4 w-4" />
                اختبار شامل ومتدرّج
              </p>
              <h1 className="font-display text-[2rem] font-extrabold leading-[1.35] text-[#fffaf0] sm:text-4xl lg:text-[2.85rem]">
                اللغة العربية
                <span className="mt-1 block text-[1.35rem] font-bold text-[#e6d3a9] sm:text-2xl lg:text-[1.7rem]">
                  اختبار الفصل الشامل
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[#d6e2dc] sm:text-[15px]">
                رحلة تقيس الفهم القرائي، والمفردات، والقواعد، والإملاء، والاستنتاج، على ضوء
                خمسة دروس محدّدة من كتاب الصف الخامس الأساسي.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#c4a15a]/25 bg-[#c4a15a]/10 px-3 py-1.5 text-[11px] font-medium text-[#f2e3c3]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#d9b873]" />
                  الوحدة الأولى كاملة
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#c4a15a]/25 bg-[#c4a15a]/10 px-3 py-1.5 text-[11px] font-medium text-[#f2e3c3]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#d9b873]" />
                  الوحدة الثانية: الدرسان ١ و٢
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-[#e7e1d4]">
                  <LockKeyhole className="h-3.5 w-3.5 text-[#d9b873]" />
                  الإجابات مخفية حتى التسليم
                </span>
              </div>

              <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { value: arabicNumber(TOTAL_QUESTIONS), label: "سؤالًا رئيسيًا" },
                  { value: arabicNumber(TOTAL_BRANCHES), label: "فرعًا تقييميًا" },
                  { value: arabicNumber(TOTAL_MARKS), label: "العلامة النهائية" },
                  { value: arabicNumber(Object.keys(LESSONS).length), label: "دروس موثّقة" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-center sm:text-right"
                  >
                    <dt className="font-display text-xl font-bold text-[#fff7e7] sm:text-2xl">{stat.value}</dt>
                    <dd className="mt-0.5 text-[10px] font-medium text-[#c8d8d2] sm:text-[11px]">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative hidden lg:flex lg:justify-center">
              <div className="absolute inset-x-6 bottom-2 top-14 rounded-full bg-[#1f7a6a]/10 blur-2xl" />
              <div className="animate-soft-float relative">
                <ArabicSeal className="h-60 w-60 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]" />
                <div className="absolute -bottom-4 -right-5 rounded-xl border border-[#c4a15a]/40 bg-[#fffaf0] px-4 py-2.5 text-center shadow-xl">
                  <div className="font-display text-[11px] font-bold text-[#0d3b35]">محتوى الدروس الخمسة</div>
                  <div className="mt-0.5 text-[9px] font-semibold text-[#8f743c]">
                    بلا أقسام مستثناة
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative z-10 mt-6 grid items-start gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="soft-card animate-fade-up delay-1 rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#9b7938]">
                  <Target className="h-4 w-4" />
                  تعليمات الاختبار
                </p>
                <h2 className="font-display text-xl font-bold text-[#0d3b35]">قبل أن تبدأ</h2>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef4f0] text-[#1f7a6a]">
                <ScrollText className="h-5 w-5" />
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {INSTRUCTIONS.map((instruction, index) => {
                const Icon = instruction.icon;
                return (
                  <div
                    key={instruction.title}
                    className="rounded-xl border border-[#e9e0d0] bg-[#fffdf9]/80 p-3.5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f4ecdb] text-[#96732f]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-bold text-[#0d3b35]">
                        {index + 1}. {instruction.title}
                      </span>
                    </div>
                    <p className="text-[12px] leading-6 text-[#5e6c67]">{instruction.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#d8e7df] bg-[#eef7f2] p-3.5">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1f7a6a]" />
              <p className="text-[11.5px] leading-6 text-[#315a51]">
                جميع الإجابات مغلقة وقابلة للتصحيح آليًا. الأسئلة موزّعة على الدروس الخمسة،
                ومرتّبة بصورة متداخلة لا تتبع ترتيب صفحات الكتاب.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#d8cdb9] bg-[#fffdf8] shadow-[0_24px_70px_-48px_rgba(8,41,36,0.55)] lg:sticky lg:top-6">
            <div className="h-1.5 w-full bg-[linear-gradient(90deg,#0d3b35_0%,#1f7a6a_55%,#c4a15a_100%)]" />
            <div className="p-5 sm:p-6">
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ecdb] px-2.5 py-1 text-[10px] font-bold text-[#8b692a]">
                  <BookOpen className="h-3 w-3" />
                  بدء المحاولة
                </span>
                <h2 className="mt-3 font-display text-xl font-bold text-[#0d3b35]">سجّل اسمك وابدأ</h2>
                <p className="mt-1.5 text-[12px] leading-6 text-[#66736e]">
                  اسم الطالب إلزامي، ويُستخدم في النتيجة وتقرير TXT القابل للتنزيل.
                </p>
              </div>

              <label htmlFor="student-name" className="mb-2 flex items-center justify-between text-xs font-bold text-[#0d3b35]">
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4 text-[#1f7a6a]" />
                  اسم الطالب
                </span>
                <span className="text-[10px] font-medium text-[#a3483b]">مطلوب</span>
              </label>
              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canStart) onStart();
                }}
                placeholder="اكتب اسمك الكامل هنا…"
                autoComplete="name"
                maxLength={60}
                className="w-full rounded-xl border border-[#d8cdb9] bg-[#fbf8f0] px-4 py-3.5 text-sm font-medium text-[#0d3b35] shadow-inner placeholder:text-[#9eaa9f] focus:border-[#1f7a6a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f7a6a]/10"
                aria-describedby="name-help"
              />
              <p id="name-help" className="mt-1.5 flex items-center gap-1 text-[10px] text-[#7b8782]">
                <ShieldCheck className="h-3 w-3" />
                يُحفظ الاسم والإجابات على هذا الجهاز فقط.
              </p>

              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3b35] px-5 py-3.5 text-sm font-bold text-[#fff8e7] shadow-[0_14px_30px_-16px_rgba(13,59,53,0.85)] transition hover:bg-[#124c44] disabled:bg-[#c9d0ca] disabled:text-[#f6f6f4] disabled:shadow-none"
              >
                <span>ابدأ الاختبار</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </button>
              {!canStart && (
                <p className="mt-2 text-center text-[10px] font-medium text-[#7b8782]">
                  أدخل حرفين على الأقل لتفعيل زر البدء.
                </p>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-[#8f743c]">
                <Clock3 className="h-3 w-3" />
                لن يبدأ المؤقت قبل ضغط زر البدء
              </p>

              <div className="mt-5 border-t border-dashed border-[#e3d9c6] pt-3">
                <button
                  type="button"
                  onClick={onOpenTeacherKey}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-right transition hover:bg-[#f7f3e9]"
                >
                  <span className="flex items-center gap-2 text-[11px] font-semibold text-[#63706b]">
                    <KeyRound className="h-4 w-4 text-[#9b7938]" />
                    منطقة المعلم — مفتاح الإجابات
                  </span>
                  <span className="rounded-md border border-[#e0d4bf] bg-white px-2 py-1 text-[9px] font-bold tracking-wide text-[#9b7938]">
                    Teacher Answer Key
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 animate-fade-up delay-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#9b7938]">
                <BookOpen className="h-4 w-4" />
                نطاق الاختبار
              </p>
              <h2 className="font-display text-xl font-bold text-[#0d3b35] sm:text-2xl">خمسة دروس، اختيارٌ موثّق</h2>
            </div>
            <p className="text-[11px] font-medium text-[#7b8782]">
              {Object.values(questionsByLesson).reduce((sum, count) => sum + count, 0)} أسئلة رئيسية موزعة بواقع ٣ لكل درس
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {SCOPE_GROUPS.map((group) => (
              <div key={group.unit} className="soft-card rounded-2xl p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0d3b35]">{group.unit}</h3>
                    <p className="mt-0.5 text-[10px] font-medium text-[#8f743c]">{group.label}</p>
                  </div>
                  <span className="rounded-full border border-[#d8e7df] bg-[#eef7f2] px-2.5 py-1 text-[10px] font-bold text-[#1f7a6a]">
                    {group.lessons.length === 2 ? "درسان" : "٣ دروس"}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.lessons.map((lesson, index) => (
                    <div
                      key={lesson.key}
                      className="flex items-center gap-3 rounded-xl border border-[#ebe3d4] bg-[#fffdf9] px-3.5 py-3"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0d3b35] font-display text-xs font-bold text-[#efdcb0]">
                        {["١", "٢", "٣"][index] ?? "١"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[12px] font-bold text-[#123f39]">{lesson.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#7b8782]">{lesson.pages}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#f4ecdb] px-2 py-1 text-[9px] font-bold text-[#8b692a]">
                        {questionsByLesson[lesson.key] ?? 3} أسئلة
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e3d9c6] bg-[#faf6ec] px-3.5 py-3 text-[10.5px] leading-6 text-[#68756f]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9b7938]" />
            <p>
              صُممت الأسئلة اعتمادًا على نصوص الدروس والصفحات الموثّقة، مع استبعاد محتوى الأقسام
              المستثناة. لا يعرض الاختبار أي إجابة صحيحة أو تغذية راجعة قبل تسليمه.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e3d9c6]/75 bg-[#f2ecdf]/55 py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-right lg:px-8">
          <div className="flex items-center gap-2 text-[10.5px] text-[#78847e]">
            <BookOpen className="h-4 w-4 text-[#9b7938]" />
            اختبار اللغة العربية · الصف الخامس الأساسي
          </div>
          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-semibold text-[#6b7872] transition hover:text-[#0d3b35]"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Teacher Answer Key
          </button>
        </div>
      </footer>
    </div>
  );
}

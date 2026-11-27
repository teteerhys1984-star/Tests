import { useState } from "react";
import {
  Brand,
  Footer,
  Icon,
  MiniSparkle,
  OwlMascot,
  PencilBuddy,
  SectionEyebrow,
  SoundButton,
  StarBuddy,
} from "../components/ui";
import { EXAM_QUESTIONS, TOTAL_BRANCHES, TOTAL_MARKS } from "../exam/examData";
import { sanitizeStudentName } from "../exam/text";

const LESSON_CARDS = [
  {
    number: 1,
    title: "Sentence Structure",
    detail: "Subject, verb, object, and simple sentence order.",
    color: "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  {
    number: 2,
    title: "Pronouns and Verb to Be",
    detail: "I, you, he, she, it, we, they with am, is, and are.",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
  },
  {
    number: 3,
    title: "Verb to Be",
    detail: "Affirmative sentences, negative sentences, and questions.",
    color: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-400",
  },
  {
    number: 4,
    title: "Nouns and Articles",
    detail: "People, places, animals, things, and a / an / the.",
    color: "bg-orange-100 text-orange-900 border-orange-200",
    dot: "bg-orange-400",
  },
  {
    number: 5,
    title: "Adjectives",
    detail: "Descriptive words, opposites, and adjective placement.",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  {
    number: 18,
    title: "Singular and Plural",
    detail: "S, ES, Y, selected F / FE words, and irregular plurals.",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
];

const STEPS = [
  {
    label: "Write your name",
    detail: "Your name appears on your score and report.",
    icon: "user" as const,
  },
  {
    label: "Answer every part",
    detail: `There are ${TOTAL_BRANCHES} answer branches in 12 questions.`,
    icon: "list" as const,
  },
  {
    label: "Submit and review",
    detail: "Your score and clear explanations appear at the end.",
    icon: "chart" as const,
  },
];

export default function StartScreen({
  muted,
  onToggleMute,
  onStart,
  onTeacher,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onStart: (name: string) => void;
  onTeacher: () => void;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const cleanName = name.trim();
  const canStart = cleanName.length > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-teal-100/70 bg-white/70 backdrop-blur-md">
        <div className="page-shell flex min-h-[68px] items-center justify-between gap-3 py-3">
          <Brand />
          <div className="flex items-center gap-2">
            <SoundButton muted={muted} onToggle={onToggleMute} />
            <button
              type="button"
              onClick={onTeacher}
              className="pressable hidden min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800 sm:inline-flex"
            >
              <Icon name="lock" className="h-4 w-4" />
              Teacher Area
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell pb-4 pt-6 sm:pt-9">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-teal-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 shadow-[0_25px_65px_-40px_rgba(12,91,112,.55)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-200/45 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-200/40 blur-2xl" />
          <div className="pointer-events-none absolute right-8 top-8 hidden opacity-70 sm:block">
            <MiniSparkle className="star-twinkle" size={24} color="#f2bc3f" />
          </div>
          <div className="pointer-events-none absolute right-28 top-28 hidden opacity-60 sm:block">
            <MiniSparkle className="star-twinkle" size={14} color="#25a9b6" />
          </div>

          <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,.82fr)] lg:gap-10">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-teal-800 uppercase shadow-sm sm:text-[11px]">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Grammar test · Lessons 1 to 5 and 18
              </div>
                  <h1 className="display-font mt-4 max-w-[18ch] text-[2.25rem] leading-[0.98] text-slate-900 sm:max-w-none sm:text-5xl lg:text-[3.8rem]">
                    Grammar Test
                    <br />
                    Lessons 1 to 5 and 18
                  </h1>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
                A friendly check of what you know. Read carefully, take your time,
                and show your English skills one question at a time.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { icon: "list" as const, label: `${EXAM_QUESTIONS.length} questions` },
                  { icon: "star" as const, label: `${TOTAL_MARKS} marks` },
                  { icon: "book" as const, label: "6 lessons" },
                  { icon: "clock" as const, label: "Count-up timer" },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm sm:text-sm"
                  >
                    <Icon name={item.icon} className="h-4 w-4 text-teal-700" />
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-end gap-2 sm:gap-4">
                <OwlMascot className="owl-bob w-[140px] shrink-0 sm:w-[190px] lg:w-[225px]" />
                <div className="mb-3 min-w-0 max-w-[220px] rounded-2xl rounded-bl-sm border border-teal-100 bg-white/90 px-3.5 py-3 shadow-sm">
                  <p className="text-xs font-black text-teal-700">Your owl guide</p>
                  <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                    Every question is in English. You can do this step by step!
                  </p>
                </div>
                <StarBuddy className="mb-1 hidden w-16 shrink-0 sm:block" />
              </div>
            </div>

            <div className="relative rounded-[1.5rem] border border-white bg-white/95 p-4 shadow-[0_20px_55px_-25px_rgba(25,91,110,.35)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SectionEyebrow>Exam card</SectionEyebrow>
                  <h2 className="display-font mt-1 text-2xl leading-tight text-slate-900 sm:text-[1.7rem]">
                    Ready to begin?
                  </h2>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100">
                  <Icon name="pencil" className="h-5 w-5 text-amber-700" />
                </div>
              </div>

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  setTouched(true);
                  if (canStart) onStart(cleanName);
                }}
                noValidate
              >
                <label
                  htmlFor="student-name"
                  className="block text-sm font-extrabold text-slate-800"
                >
                  Student name <span className="text-rose-600">*</span>
                </label>
                <p id="name-help" className="mt-1 text-xs font-semibold text-slate-500">
                  Required. Use English letters.
                </p>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="user" className="h-5 w-5" />
                  </span>
                  <input
                    id="student-name"
                    name="studentName"
                    type="text"
                    value={name}
                    onChange={(event) => setName(sanitizeStudentName(event.target.value))}
                    onBlur={() => setTouched(true)}
                    maxLength={50}
                    autoComplete="name"
                    autoCapitalize="words"
                    aria-describedby="name-help name-error"
                    aria-invalid={touched && !canStart}
                    placeholder="Write your full name in English"
                    className="min-h-[52px] w-full rounded-xl border-2 border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-base font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 transition focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {touched && !canStart && (
                  <p id="name-error" className="mt-2 text-xs font-extrabold text-rose-700">
                    Please write your name before you start.
                  </p>
                )}

                <div className="mt-4 rounded-xl bg-sky-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-sky-900">Timer</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-sky-700">
                      00:00:00 until you start
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold leading-4 text-sky-800/80">
                    The stopwatch starts when you press Start Exam. You can move
                    between questions, and your answers save on this device.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!canStart}
                  className="pressable mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-base font-black text-white shadow-[0_10px_22px_-10px_rgba(15,118,110,.8)] hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  Start Exam
                  <Icon name="arrow-right" className="h-5 w-5" />
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-slate-400">
                  <Icon name="shield" className="h-3.5 w-3.5" />
                  Your unfinished answers come back after a refresh.
                </p>
              </form>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500">Exam sounds</p>
                <SoundButton muted={muted} onToggle={onToggleMute} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="before-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionEyebrow>Before you start</SectionEyebrow>
              <h2 id="before-heading" className="display-font mt-1 text-2xl text-slate-900 sm:text-3xl">
                Three simple steps
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {TOTAL_BRANCHES} answer branches in total
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.label} className="soft-card flex items-start gap-3 rounded-2xl p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-100 to-teal-100 text-teal-800">
                  <Icon name={step.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.12em] text-slate-400 uppercase">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-0.5 text-sm font-extrabold text-slate-800">{step.label}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-amber-700">
              <Icon name="info" className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold leading-5 text-amber-950 sm:text-sm">
              You will not see answers or marks while you work. Press Submit Exam
              only when every branch is complete. No confirmation pop-up will
              appear.
            </p>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="lessons-heading">
          <SectionEyebrow>Your exam covers</SectionEyebrow>
          <div className="flex items-end justify-between gap-3">
            <h2 id="lessons-heading" className="display-font mt-1 text-2xl text-slate-900 sm:text-3xl">
              Six lessons, one clear path
            </h2>
            <PencilBuddy className="w-12 shrink-0 sm:w-14" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LESSON_CARDS.map((lesson) => (
              <article
                key={lesson.number}
                className={`relative overflow-hidden rounded-2xl border p-4 ${lesson.color}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm">
                    Lesson {lesson.number}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${lesson.dot}`} />
                </div>
                <h3 className="display-font mt-2.5 text-lg leading-tight">{lesson.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{lesson.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-[11px] font-semibold leading-5 text-slate-500">
            <MiniSparkle size={14} color="#22a9b4" className="mt-0.5 shrink-0" />
            This exam only covers the six lessons above. Take your time and read
            each instruction.
          </div>
        </section>
      </main>

      <Footer onTeacher={onTeacher} />
    </div>
  );
}

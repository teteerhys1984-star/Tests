import { useMemo, useState } from "react";
import {
  Brand,
  Footer,
  Icon,
  SectionEyebrow,
  TeacherMark,
} from "../components/ui";
import {
  ALL_BRANCHES,
  EXAM_QUESTIONS,
  TOTAL_BRANCHES,
  TOTAL_MARKS,
  type LessonId,
} from "../exam/examData";

const TEACHER_PASSWORD = "somer173";
const LESSON_NAMES: Record<LessonId, string> = {
  1: "Sentence Structure",
  2: "Pronouns and Verb to Be",
  3: "Verb to Be: Affirmative, Negative and Questions",
  4: "Nouns and Articles",
  5: "Adjectives and Descriptive Sentences",
  18: "Singular and Plural",
};

function TeacherHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="page-shell flex min-h-[68px] flex-wrap items-center justify-between gap-3 py-3">
        <Brand />
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900 min-[420px]:inline-flex">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Teacher Access
          </span>
          <button
            type="button"
            onClick={onBack}
            className="pressable inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-extrabold text-slate-700 hover:border-teal-300 hover:text-teal-800"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    </header>
  );
}

export default function TeacherArea({
  onBack,
}: {
  onBack: () => void;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const skillMap = useMemo(() => {
    const map = new Map<LessonId, { skills: string[]; questions: number[] }>();
    ALL_BRANCHES.forEach(({ question, branch }) => {
      const current = map.get(branch.lesson) ?? { skills: [], questions: [] };
      if (!current.skills.includes(branch.skill)) current.skills.push(branch.skill);
      if (!current.questions.includes(question.number)) current.questions.push(question.number);
      map.set(branch.lesson, current);
    });
    return Array.from(map.entries()).sort(([lessonA], [lessonB]) => {
      if (lessonA === 18) return 1;
      if (lessonB === 18) return -1;
      return lessonA - lessonB;
    });
  }, []);

  if (!unlocked) {
    return (
      <div className="min-h-screen">
        <TeacherHeader onBack={onBack} />
        <main className="page-shell py-8 sm:py-12">
          <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_25px_65px_-38px_rgba(12,74,93,.55)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-6 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black tracking-[0.16em] text-teal-100 uppercase">
                    Protected classroom view
                  </p>
                  <h1 className="display-font mt-1 text-3xl leading-tight">Teacher Answer Key</h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-teal-100">
                    Enter the teacher password to view all questions, correct
                    answers, marking notes, and skill mapping.
                  </p>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10">
                  <Icon name="lock" className="h-7 w-7" />
                </div>
              </div>
            </div>

            <form
              className="p-5 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (password === TEACHER_PASSWORD) {
                  setUnlocked(true);
                  setPassword("");
                  setError("");
                } else {
                  setError("That password is not correct. Please try again.");
                }
              }}
            >
              <label htmlFor="teacher-password" className="text-sm font-extrabold text-slate-800">
                Teacher password
              </label>
              <input
                id="teacher-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                autoComplete="current-password"
                placeholder="Enter password"
                className="mt-2 min-h-[52px] w-full rounded-xl border-2 border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base font-bold text-slate-900 transition focus:border-teal-500 focus:bg-white focus:outline-none"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "teacher-error" : undefined}
              />
              {error && (
                <p id="teacher-error" role="alert" className="mt-2 text-xs font-extrabold text-rose-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="pressable mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-teal-800"
              >
                <Icon name="key" className="h-4 w-4" />
                Unlock Teacher Area
              </button>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-[11px] font-semibold leading-5 text-amber-950">
                  This password gate is a client-side classroom lock only. It is not
                  real authentication, account security, or encryption. Do not use it
                  to protect sensitive information.
                </p>
              </div>
            </form>
          </div>
        </main>
        <Footer showTeacher={false} onTeacher={onBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TeacherHeader onBack={onBack} />
      <main className="page-shell py-5 sm:py-8">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-teal-200 bg-gradient-to-br from-slate-900 via-teal-900 to-teal-800 p-5 text-white shadow-lg sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-amber-300/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TeacherMark className="h-10 w-10" />
                <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-teal-100 uppercase">
                  Unlocked teacher view
                </span>
              </div>
              <h1 className="display-font mt-3 text-3xl leading-tight sm:text-4xl">
                Teacher Answer Key
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-teal-100">
                English Foundation Exam · Lessons 1, 2, 3, 4, 5 and 18. Each
                sub-question below includes its answer, explanation, marks, lesson
                reference, and skill.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="pressable no-print inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/20"
            >
              <Icon name="print" className="h-4 w-4" />
              Print Answer Key
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Main questions", value: EXAM_QUESTIONS.length },
              { label: "Total marks", value: TOTAL_MARKS },
              { label: "Sub-questions", value: TOTAL_BRANCHES },
              { label: "Lessons", value: 6 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-xl font-black leading-tight">{item.value}</p>
                <p className="mt-0.5 text-[10px] font-bold text-teal-100">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-[11px] font-semibold leading-5 text-amber-950">
            This is a client-side password gate only. It does not provide real
            authentication or encryption.
          </p>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="soft-card rounded-2xl p-4 sm:p-5">
            <SectionEyebrow>Score and marking</SectionEyebrow>
            <h2 className="display-font mt-1 text-2xl text-slate-900">Marking criteria</h2>
            <div className="mt-3 grid gap-2">
              {EXAM_QUESTIONS.map((question) => (
                <div
                  key={question.number}
                  className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/80 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
                      {question.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-800">{question.title}</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">
                        {question.markingGuide}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-amber-800">
                        Partial credit: {question.partialCredit}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 self-start rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-900">
                    {question.totalMarks} marks
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700">
              Total: {TOTAL_MARKS} / {TOTAL_MARKS} marks across 12 main questions.
            </p>
          </div>

          <div className="soft-card rounded-2xl p-4 sm:p-5">
            <SectionEyebrow>Skill mapping</SectionEyebrow>
            <h2 className="display-font mt-1 text-2xl text-slate-900">Lessons and skills</h2>
            <div className="mt-3 grid gap-2.5">
              {skillMap.map(([lesson, data]) => (
                <div key={lesson} className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-sky-950">Lesson {lesson}</p>
                    <p className="text-[10px] font-bold text-sky-700">
                      Q{data.questions.join(", Q")}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] font-bold leading-4 text-sky-900">
                    {LESSON_NAMES[lesson]}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {data.skills.map((skill) => (
                      <li key={skill} className="flex items-start gap-1.5 text-[11px] font-semibold leading-4 text-slate-600">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <SectionEyebrow>Complete answer key</SectionEyebrow>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="display-font text-2xl text-slate-900 sm:text-3xl">
              All 12 questions and branches
            </h2>
            <p className="text-xs font-bold text-slate-500">
              {TOTAL_BRANCHES} independently graded branches
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            {EXAM_QUESTIONS.map((question) => (
              <article
                key={question.number}
                id={`teacher-question-${question.number}`}
                className="soft-card overflow-hidden rounded-2xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-800 text-base font-black text-white">
                      {question.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="display-font text-xl leading-tight text-slate-900">
                        {question.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">
                        {question.instructions}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {question.lessons.map((lesson) => (
                          <span
                            key={lesson}
                            className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-black text-sky-800"
                          >
                            Lesson {lesson}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-right">
                    <p className="text-sm font-black text-teal-900">{question.totalMarks} marks</p>
                    <p className="text-[9px] font-bold text-teal-700">
                      {question.branches.length} branches
                    </p>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="grid gap-2.5">
                    {question.branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black tracking-[0.08em] text-slate-400 uppercase">
                              {branch.id} · {branch.skill}
                            </p>
                            <p className="mt-0.5 text-sm font-extrabold leading-5 text-slate-800">
                              {branch.prompt}
                            </p>
                            {branch.display && (
                              <p className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm font-bold text-slate-900">
                                {branch.display}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">
                            {branch.marks} {branch.marks === 1 ? "mark" : "marks"}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                            <p className="text-[9px] font-black tracking-[0.08em] text-emerald-700 uppercase">
                              Correct answer
                            </p>
                            <p className="mt-0.5 break-words text-sm font-extrabold text-emerald-950">
                              {branch.displayCorrect}
                            </p>
                            {branch.accepted && branch.accepted.length > 0 && (
                              <p className="mt-1 text-[10px] font-semibold leading-4 text-emerald-800">
                                Also accept: {branch.accepted.join(" / ")}
                              </p>
                            )}
                          </div>
                          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-2.5">
                            <p className="text-[9px] font-black tracking-[0.08em] text-sky-700 uppercase">
                              Explanation
                            </p>
                            <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-700">
                              {branch.explanation}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800">
                            Lesson {branch.lesson}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Skill: {branch.skill}
                          </span>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Full {branch.marks} once only; no half marks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <SectionEyebrow>General rules</SectionEyebrow>
          <h2 className="display-font mt-1 text-2xl text-slate-900">Marking and partial-credit policy</h2>
          <ul className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-slate-600 sm:grid-cols-2">
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              Every branch is graded independently and earns its listed marks.
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              No half marks are used. There is no negative marking.
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              Written answers ignore capital letters and a final full stop or question mark only.
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              Word-order branches require every word in the correct order for the full mark.
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              Accepted alternatives are listed on each branch. No unseen alternatives are used.
            </li>
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              The exam is submitted only when all branches are complete; results appear immediately.
            </li>
          </ul>
        </section>
      </main>

      <Footer showTeacher={false} />
    </div>
  );
}

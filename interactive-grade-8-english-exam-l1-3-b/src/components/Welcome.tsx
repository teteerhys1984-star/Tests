import { useState } from "react";
import hero from "@/assets/hero.jpg";
import { EXAM_TITLE } from "@/config";
import {
  LESSONS,
  PASSAGES,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_PARTS,
  lessonQuestions,
  questionMarks,
} from "@/data/exam";
import type { ExamReport } from "@/lib/grading";
import { downloadReport } from "@/lib/report";
import ContactFooter from "./ContactFooter";
import { KeyIcon, Logo } from "./Icons";

interface Props {
  onStart: (name: string) => void;
  previousReport: ExamReport | null;
  onOpenTeacher: () => void;
}

export default function Welcome({ onStart, previousReport, onOpenTeacher }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) {
      setError("Please enter your full name before starting.");
      return;
    }
    setError("");
    onStart(clean);
  }

  return (
    <div className="min-h-dvh dot-paper">
      {/* ---------------- hero ---------------- */}
      <header className="relative">
        <div className="relative min-h-64 w-full overflow-hidden sm:min-h-80">
          <img
            src={hero}
            alt="Illustration of a school moving from the past into the future"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08204a]/94 via-[#08204a]/68 to-[#08204a]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08204a]/78 to-transparent" />

          <span className="absolute right-3 top-3 rotate-6 rounded-xl border-[3px] border-[#0b2a5b] bg-brand-yellow px-3 py-1.5 font-display text-xs font-black uppercase tracking-wide text-[#0b2a5b] sticker-strong sm:right-6 sm:top-6 sm:text-sm">
            Model B
          </span>

          <div className="relative mx-auto flex min-h-64 max-w-3xl flex-col justify-end px-4 pb-5 pt-14 sm:min-h-80 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Logo className="h-9 w-9 shrink-0 rounded-xl" />
              <span className="rounded-full border border-white/40 bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                Grade 8 · Semester 1
              </span>
              <span
                dir="rtl"
                lang="ar"
                className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white"
              >
                الصف الثامن · الفصل الأول · اللغة الإنجليزية
              </span>
            </div>
            <h1 className="font-display text-[1.65rem] font-black leading-[1.12] text-white sm:text-4xl">
              {EXAM_TITLE}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-bold leading-snug text-white/90 sm:text-base">
              <span className="rounded-md bg-brand-orange px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                Model B
              </span>{" "}
              · Unit 1 · Lessons 1, 2 and 3 — Future Plans · School Challenges · Let’s Discover
            </p>
          </div>
        </div>
        <div className="h-2.5 stripe-band" />
      </header>

      {/* ---------------- body ---------------- */}
      <main className="mx-auto max-w-3xl px-4 pb-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { k: `${QUESTIONS.length}`, v: "Questions" },
            { k: `${TOTAL_PARTS}`, v: "Answer parts" },
            { k: `${TOTAL_MARKS}`, v: "Marks" },
            { k: `${PASSAGES.length}`, v: "Passages" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl border-2 border-ink/10 bg-white px-2 py-3 text-center sticker"
            >
              <div className="font-display text-xl font-black tabular text-brand-blue sm:text-2xl">
                {s.k}
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink/65">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* lessons */}
        <section className="mt-5 rounded-3xl border-2 border-ink/10 bg-white p-4 sticker sm:p-5">
          <h2 className="font-display text-base font-black uppercase tracking-wide text-ink sm:text-lg">
            What this exam covers
          </h2>
          <ul className="mt-3 space-y-2.5">
            {LESSONS.map((l) => {
              const lQuestions = lessonQuestions(l.id);
              const lParts = lQuestions.reduce((s, q) => s + q.parts.length, 0);
              const lMarks = lQuestions.reduce((s, q) => s + questionMarks(q), 0);
              return (
                <li
                  key={l.id}
                  className="flex items-start gap-3 rounded-2xl border-2 border-ink/10 p-3"
                  style={{ backgroundColor: l.soft }}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-black text-white"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold leading-tight text-ink sm:text-base">
                      Lesson {l.id} — {l.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink/65">{l.focus}</span>
                    <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-wider tabular text-ink/60">
                      {lQuestions.length} questions · {lParts} parts · {lMarks} marks
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* start form */}
        <form
          onSubmit={handleStart}
          noValidate
          className="mt-5 rounded-3xl border-[3px] border-[#0b2a5b] bg-white p-4 sticker-strong sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-black uppercase tracking-wide text-ink sm:text-lg">
              Student details
            </h2>
            <span dir="rtl" lang="ar" className="text-xs font-bold text-ink/60">
              بيانات الطالب
            </span>
          </div>
          <label
            htmlFor="student-name"
            className="mt-4 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink/65"
          >
            Full name · <span dir="rtl" lang="ar">الاسم الكامل</span>
          </label>
          <input
            id="student-name"
            type="text"
            dir="auto"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Ahmad Al-Ali / أحمد العلي"
            autoComplete="name"
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : "name-help"}
            className="mt-1.5 min-h-13 w-full rounded-2xl border-2 border-ink/15 bg-paper px-4 py-3 text-base font-bold text-ink placeholder:font-medium placeholder:text-ink/45 focus:border-brand-blue focus:bg-white"
          />
          {error ? (
            <p
              id="name-error"
              role="alert"
              className="mt-2 text-sm font-bold text-[#d43a1f]"
            >
              {error}
            </p>
          ) : (
            <p id="name-help" className="mt-2 text-xs leading-relaxed text-ink/65">
              Your answers and current question are saved automatically on this device. When you
              submit, your score is sent to your teacher and you can download a full TXT report.
            </p>
          )}

          <button
            type="submit"
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 font-display text-base font-black uppercase tracking-wide text-white transition-transform hover:bg-brand-blue-deep active:translate-y-0.5 sm:text-lg"
          >
            Start Exam
          </button>
        </form>

        {previousReport && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/20 bg-white/75 px-4 py-3">
            <p className="text-xs leading-snug text-ink/65">
              A previous report ({previousReport.name} — {previousReport.total}/
              {previousReport.maxTotal}) is saved on this device.
            </p>
            <button
              type="button"
              onClick={() => downloadReport(previousReport)}
              className="min-h-11 rounded-xl border-2 border-ink/15 bg-white px-3 text-xs font-extrabold uppercase tracking-wide text-ink/75 hover:border-brand-blue hover:text-brand-blue"
            >
              Download previous report
            </button>
          </div>
        )}
      </main>

      <div className="mx-auto mt-2 max-w-3xl px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenTeacher}
          aria-label="Teacher Area"
          title="Teacher Area"
          className="mx-auto flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-ink/55 hover:text-ink"
        >
          <KeyIcon className="h-3.5 w-3.5" />
          Teacher Area
        </button>
      </div>

      <ContactFooter />
    </div>
  );
}

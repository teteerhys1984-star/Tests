import { useRef, useState, type FormEvent } from "react";
import { EXAM, LESSONS } from "../data/lessons";
import { Card, MuteButton, TopBar } from "./Common";
import { BookIllustration, CheckIcon, ClockIcon, KeyIcon, UserIcon } from "./Icons";

interface WelcomeProps {
  muted: boolean;
  onToggleMute: () => void;
  onStart: (name: string) => void;
  onOpenTeacher: () => void;
}

const RULES = [
  "Read each question carefully and answer every part.",
  "Use Next, Previous or the question numbers to move around. Your answers are kept.",
  "The timer starts when you press Start Exam.",
  "Your work is saved on this device, even if the page closes.",
  "The Submit Exam button unlocks when all 50 questions are answered.",
];

export function WelcomeScreen({ muted, onToggleMute, onStart, onOpenTeacher }: WelcomeProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please type your name to start the exam.");
      inputRef.current?.focus();
      return;
    }
    onStart(trimmed);
  };

  return (
    <>
      <TopBar>
        <button
          type="button"
          onClick={onOpenTeacher}
          aria-label="Teacher area"
          className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-green-800 transition hover:bg-white/70"
        >
          <KeyIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Teacher area</span>
        </button>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </TopBar>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        <Card className="overflow-hidden">
          <div className="grid items-center gap-6 md:grid-cols-[1.25fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-lime-200 px-3 py-1 text-sm font-extrabold text-green-950">
                {EXAM.grade} · {EXAM.unit} · Lessons 1–5
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-green-950 sm:text-5xl">{EXAM.title}</h1>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-green-900">
                All questions come from the exercises in your Pupil’s Book and Workbook for Unit 1.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["50", "questions"],
                  ["100", "marks"],
                  ["2", "marks each"],
                  ["5", "lessons"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-green-100 bg-gradient-to-b from-green-50 to-white px-3 py-3 text-center">
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-3xl font-black text-green-800">{value}</dd>
                    <dd className="text-sm font-bold text-green-700">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <BookIllustration className="mx-auto h-auto w-full max-w-sm" />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <h2 className="text-xl font-extrabold text-green-950">Lessons in this exam</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {LESSONS.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/50 px-3 py-3">
                  <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">
                    {l.icon}
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold uppercase tracking-widest text-green-600">Lesson {l.id}</span>
                    <span className="block text-base font-bold text-green-950">{l.title}</span>
                  </span>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-xl font-extrabold text-green-950">Before you start</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2 text-base leading-relaxed text-green-900">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="self-start">
            <form onSubmit={submit} noValidate>
              <h2 className="text-xl font-extrabold text-green-950">Ready? Write your name.</h2>
              <label htmlFor="student-name" className="mt-4 block text-base font-bold text-green-900">
                Your name <span className="text-green-600">(required)</span>
              </label>
              <div className="relative mt-2">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                <input
                  ref={inputRef}
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  maxLength={60}
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "name-error" : undefined}
                  placeholder="First name and last name"
                  className={`w-full rounded-2xl border-2 bg-white py-3.5 pl-12 pr-4 text-lg font-semibold text-green-950 outline-none transition placeholder:font-normal placeholder:text-green-400 focus-visible:ring-4 focus-visible:ring-lime-300 ${
                    error ? "border-rose-400" : "border-green-200 focus:border-lime-500"
                  }`}
                />
              </div>
              {error && (
                <p id="name-error" role="alert" className="mt-2 text-sm font-bold text-rose-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-6 py-4 text-lg font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(21,128,61,0.8)] transition hover:bg-green-800 focus-visible:ring-4 focus-visible:ring-lime-300"
              >
                Start Exam
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
                <ClockIcon className="h-4 w-4" /> The timer starts when you press Start Exam.
              </p>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}

import { useState, type FormEvent, type ReactNode } from "react";
import { EXAM_SUBTITLE, EXAM_TITLE, QUESTIONS } from "../data/exam";
import { SpeakerOff, SpeakerOn, SparkleIcon, ClockIcon, CheckIcon, Logo, ContactCard, ContactFooter } from "./ui";

interface Props {
  draftName: string;
  onDraftChange: (v: string) => void;
  onStart: (name: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function validateStudentName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Please type your full name (at least 2 letters).";
  if (name.length > 60) return "Please keep the name under 60 characters.";
  if (!/\p{L}/u.test(name)) return "Your name must contain letters.";
  return null;
}

export default function StartScreen({ draftName, onDraftChange, onStart, muted, onToggleMute }: Props) {
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateStudentName(draftName);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onStart(draftName.trim().replace(/\s+/g, " "));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4a3566]">
          <Logo />
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#7c3aed] shadow-sm ring-1 ring-violet-100 transition active:scale-95"
        >
          {muted ? <SpeakerOff size={18} /> : <SpeakerOn size={18} />}
          <span>{muted ? "Sound off" : "Sound on"}</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-5">
          <ContactCard variant="compact" />
        </div>
        <section className="overflow-hidden rounded-[28px] bg-white shadow-xl shadow-pink-100/70 ring-1 ring-pink-100">
          <div className="relative bg-gradient-to-br from-pink-400 via-fuchsia-400 to-violet-500 px-5 pb-8 pt-7 text-white sm:px-10 sm:pt-10">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" aria-hidden="true" />
            <div className="absolute bottom-3 right-16 h-3 w-3 rounded-full bg-yellow-300" aria-hidden="true" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <SparkleIcon size={14} /> Grade 5 English
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{EXAM_TITLE}</h1>
            <p className="mt-2 text-base font-medium text-pink-50 sm:text-lg">{EXAM_SUBTITLE}</p>
          </div>

          <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-10">
            <Tip icon={<CheckIcon size={18} />} color="bg-pink-100 text-pink-600" text={`${QUESTIONS.length} sections to complete`} />
            <Tip icon={<ClockIcon size={18} />} color="bg-sky-100 text-sky-700" text="The timer starts only after you press Start Exam" />
            <Tip icon={<SparkleIcon size={18} />} color="bg-amber-100 text-amber-700" text="Your answers are saved automatically" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-4 border-t border-pink-50 px-5 pb-7 pt-6 sm:px-10">
            <div>
              <label htmlFor="student-name" className="block text-base font-bold text-[#4a3566]">
                Student’s full name
              </label>
              <input
                id="student-name"
                type="text"
                value={draftName}
                onChange={(e) => {
                  onDraftChange(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="name"
                autoCapitalize="words"
                placeholder="Type your full name"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "name-error" : "name-help"}
                maxLength={60}
                className="mt-2 h-14 w-full rounded-2xl border-2 border-pink-200 bg-pink-50/40 px-4 text-lg text-[#3b2a4a] placeholder:text-[#a58fb8] focus:border-fuchsia-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-fuchsia-100"
              />
              <p id="name-help" className="mt-2 text-sm text-[#7b6790]">
                Use the name your teacher knows you by.
              </p>
              {error && (
                <p id="name-error" role="alert" className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-lg font-extrabold text-white shadow-lg shadow-fuchsia-200 transition hover:brightness-105 active:scale-[0.99]"
            >
              Start Exam
            </button>
          </form>
        </section>

        <ContactFooter />
      </main>
    </div>
  );
}

function Tip({ icon, color, text }: { icon: ReactNode; color: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#fdf9ff] p-3 ring-1 ring-violet-50">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</span>
      <p className="text-sm font-medium leading-snug text-[#4a3566]">{text}</p>
    </div>
  );
}

import { useState } from "react";
import { EXAM_LABEL, EXAM_SUBLABEL, QUESTIONS, TOTAL_MARKS } from "../data/examData";

interface Props {
  onStart: (name: string) => void;
}

const TOPICS = [
  { emoji: "🧱", label: "Sentences" },
  { emoji: "🙋", label: "Pronouns" },
  { emoji: "⭐", label: "am · is · are" },
  { emoji: "🍎", label: "a · an · the" },
  { emoji: "🎨", label: "Adjectives" },
  { emoji: "🎒", label: "my · your · his…" },
];

export function WelcomeScreen({ onStart }: Props) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const valid = trimmed.length >= 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) onStart(trimmed);
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <div className="card animate-pop overflow-hidden">
        <div className="relative bg-gradient-to-br from-sky-400 via-indigo-400 to-fuchsia-400 px-6 pb-8 pt-7 text-white sm:px-10">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-yellow-300/40" />
          <div className="absolute -bottom-8 left-10 h-20 w-20 rounded-full bg-white/20" />
          <div className="relative flex items-center gap-4">
            <div className="animate-wiggle flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/90 text-4xl shadow-lg sm:h-20 sm:w-20 sm:text-5xl" aria-hidden="true">
              🚀
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-yellow-200">{EXAM_SUBLABEL}</p>
              <h1 className="mt-1 text-3xl font-black leading-tight drop-shadow sm:text-4xl">{EXAM_LABEL}</h1>
            </div>
          </div>
          <p className="relative mt-4 max-w-prose text-[15px] font-semibold leading-relaxed text-white/95 sm:text-base">
            Hello! Ready to show what you know? In this exam you will build sentences, use am / is / are, choose a / an /
            the, describe things with adjectives, and use words like my, his and their. Take your time and do your best!
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2 text-sm font-extrabold">
            <span className="rounded-full bg-yellow-300 px-3 py-1.5 text-yellow-900 shadow">📝 {QUESTIONS.length} questions</span>
            <span className="rounded-full bg-emerald-300 px-3 py-1.5 text-emerald-900 shadow">🏆 {TOTAL_MARKS} marks</span>
            <span className="rounded-full bg-pink-200 px-3 py-1.5 text-pink-900 shadow">⏱️ No time limit</span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6 px-5 py-6 sm:px-10 sm:py-8" noValidate>
          <div>
            <label htmlFor="student-name" className="block text-base font-extrabold text-slate-800">
              What is your name? <span className="text-rose-500">*</span>
            </label>
            <input
              id="student-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Type your full name here"
              className="mt-2 min-h-14 w-full rounded-2xl border-[3px] border-sky-200 bg-sky-50 px-4 text-lg font-bold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              aria-invalid={touched && !valid}
              aria-describedby="name-help"
            />
            <p id="name-help" className={`mt-1.5 text-sm font-semibold ${touched && !valid ? "text-rose-600" : "text-slate-500"}`}>
              {touched && !valid ? "Please type your name first so we can start the exam." : "Your name will be written on your results report."}
            </p>
          </div>

          <section>
            <h2 className="text-sm font-black uppercase tracking-wide text-indigo-600">What is in the exam?</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TOPICS.map((t) => (
                <div key={t.label} className="flex items-center gap-2 rounded-2xl border-2 border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm font-extrabold text-indigo-800">
                  <span className="text-xl" aria-hidden="true">{t.emoji}</span>
                  <span className="truncate">{t.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border-[3px] border-yellow-200 bg-yellow-50 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-black text-yellow-900">
              <span aria-hidden="true">💡</span> How it works
            </h2>
            <ul className="mt-3 space-y-2.5 text-[15px] font-semibold leading-relaxed text-slate-700">
              <Li n="1">There are {QUESTIONS.length} questions. Each question has five small parts, and each part is worth one mark.</Li>
              <Li n="2">Answer every part. The big green Submit Exam button wakes up only when everything is answered.</Li>
              <Li n="3">When you type, spelling matters — but capital letters and full stops do not change your mark.</Li>
              <Li n="4">The stopwatch starts when you press Start Exam. It keeps going even if the page reloads.</Li>
              <Li n="5">You can jump between questions any time. Your answers are saved on this device automatically.</Li>
              <Li n="6">Your score and the correct answers appear only after you submit.</Li>
            </ul>
          </section>

          <button
            type="submit"
            disabled={!valid}
            className="btn-pop min-h-16 w-full rounded-3xl bg-gradient-to-r from-emerald-400 to-green-500 text-xl font-black text-white shadow-xl shadow-emerald-200 transition disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            Start Exam 🚀
          </button>
        </form>
      </div>
    </main>
  );
}

function Li({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-sm font-black text-yellow-900">{n}</span>
      <span>{children}</span>
    </li>
  );
}

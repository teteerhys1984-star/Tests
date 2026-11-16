import {
  BookOpenText,
  ClipboardCheck,
  Compass,
  Landmark,
  ListChecks,
  Route,
  ShieldCheck,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { useState } from "react";
import mapTexture from "@/assets/world-map-texture.jpg";
import { EXAM_SUBTITLE, EXAM_TITLE } from "@/exam/questions";

interface Props {
  onStart: (name: string) => void;
}

export function StartScreen({ onStart }: Props) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length >= 2;
  const error = touched && !valid;

  const start = () => {
    setTouched(true);
    if (valid) onStart(name.trim());
  };

  return (
    <main className="rise-in relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-10 pt-10 sm:px-6">
      {/* Hero band */}
      <div className="navy-panel relative w-full overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-12 sm:py-12">
        <img
          src={mapTexture}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d1d33]/60 via-transparent to-[#0d1d33]/70" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c99b3c]/70 to-transparent" />
        <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#c99b3c]/40 bg-[#0e2038]">
          <Compass className="h-8 w-8 text-[#c99b3c]" />
        </div>
        <p className="chip mx-auto mb-4 border border-[#c99b3c]/35 bg-[#c99b3c]/10 px-4 py-1.5 text-[#e6c877]">
          <ShieldCheck className="h-3.5 w-3.5" /> Official Interactive Assessment · English Curriculum Lessons 3&amp;4
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[#f4eedd] sm:text-5xl">
          {EXAM_TITLE}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#b9c6da]">
          {EXAM_SUBTITLE}
        </p>

        {/* Stat strip */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: <ListChecks className="h-4 w-4" />, label: "Questions", value: "20" },
            { icon: <Trophy className="h-4 w-4" />, label: "Total marks", value: "100" },
            { icon: <ClipboardCheck className="h-4 w-4" />, label: "Per question", value: "5 marks" },
            { icon: <Timer className="h-4 w-4" />, label: "Timer", value: "Stopwatch" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#e9e0c9]/12 bg-[#0e2038]/70 px-3 py-4"
            >
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#c99b3c]/15 text-[#c99b3c]">
                {s.icon}
              </div>
              <div className="text-lg font-semibold text-[#f4eedd]">{s.value}</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#8fa1bc]">{s.label}</div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Coverage cards */}
      <div className="mt-6 grid w-full gap-4 sm:grid-cols-2">
        <div className="paper-card rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f766e]/12 text-[#0f766e]">
              <Route className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#152a47]">
                Questions 1–10 · Lesson 3
              </h2>
              <p className="text-sm font-medium text-[#0f766e]">Let's Discover</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600">
            <li>· Journeys and means of transport vocabulary</li>
            <li>· Present Perfect — forms, questions and correct use</li>
            <li>· Reported Speech — tense and pronoun changes</li>
            <li>· Reading about journeys, and travel-email sequencing</li>
          </ul>
        </div>
        <div className="paper-card rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b45309]/12 text-[#b45a09]">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#152a47]">
                Questions 11–20 · Lesson 4
              </h2>
              <p className="text-sm font-medium text-[#b45309]">Interesting Destinations</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600">
            <li>· Destinations, landmarks, climate and travel vocabulary</li>
            <li>· Past Perfect — forms and the order of past events</li>
            <li>· Reported Speech — past simple into past perfect</li>
            <li>· Pronunciation /s/ and /k/, linking words, the Helen Keller story</li>
          </ul>
        </div>
      </div>

      {/* Instructions + name */}
      <div className="paper-card mt-6 w-full rounded-2xl p-6 sm:p-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-[#152a47]">
          <BookOpenText className="h-5 w-5 text-[#b3872e]" /> Instructions
        </h2>
        <ol className="mb-7 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-slate-700">
          <li>Enter your full name below, then press <strong>Start Exam</strong> — the stopwatch begins only then.</li>
          <li>Answer all <strong>20 questions</strong>. Every question is worth <strong>5 marks</strong>; the total is <strong>100 marks</strong>.</li>
          <li>Use the question map or the Previous/Next buttons to move freely — your answers are saved automatically.</li>
          <li>The <strong>Submit Exam</strong> button unlocks only when every question is answered. Submission is instant and final.</li>
          <li>Your attempt is saved in this browser, so a refresh will not lose your work or your time.</li>
        </ol>

        <label htmlFor="student-name" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#152a47]">
          <User className="h-4 w-4 text-[#b3872e]" /> Student Full Name <span className="text-[#b45309]">*</span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="student-name"
            className={`field flex-1 ${error ? "!border-red-400" : ""}`}
            placeholder="e.g. Yazan Khalil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            autoComplete="name"
            maxLength={60}
          />
          <button type="button" onClick={start} className="btn btn-brass px-8 py-3 text-lg">
            <Compass className="h-5 w-5" /> Start Exam
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">
            Please enter your full name (at least 2 characters) — it is required before the exam can start.
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The timer starts at 00:00:00 when you begin and keeps running until you submit. Good luck, explorer!
        </p>
      </div>
    </main>
  );
}

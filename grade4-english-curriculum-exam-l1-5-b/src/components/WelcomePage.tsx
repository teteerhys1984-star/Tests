import React, { useState } from 'react';
import {
  Award,
  BookOpenCheck,
  Clock,
  KeyRound,
  ListChecks,
  Play,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  EXAM_GRADE,
  EXAM_TITLE,
  LESSON_METADATA,
  MARKS_PER_QUESTION,
  TOTAL_EXAM_MARKS,
  TOTAL_MAIN_QUESTIONS,
} from '../data/passages';
import { ContactFooter } from './ContactFooter';
import { SoundToggle } from './SoundToggle';

interface WelcomePageProps {
  muted: boolean;
  onToggleMute: () => void;
  onStartExam: (studentName: string) => void;
  onOpenTeacherKey: () => void;
}

const LESSON_PILL_STYLES = [
  {
    bg: 'bg-cyan-50 border-cyan-200',
    badge: 'bg-cyan-500 text-white',
    text: 'text-cyan-950',
  },
  {
    bg: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-500 text-white',
    text: 'text-rose-950',
  },
  {
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-950',
  },
  {
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-950',
  },
  {
    bg: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-500 text-white',
    text: 'text-violet-950',
  },
];

export const WelcomePage: React.FC<WelcomePageProps> = ({
  muted,
  onToggleMute,
  onStartExam,
  onOpenTeacherKey,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmedName = nameInput.trim();
  const isValidName = trimmedName.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidName) return;
    onStartExam(trimmedName);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cheerful top bar */}
      <header className="border-b-2 border-cyan-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 text-white shadow-md">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600">
                {EXAM_GRADE} · Unit 1
              </p>
              <p className="font-display text-base font-bold text-slate-900">
                English Curriculum Exam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <SoundToggle muted={muted} onToggle={onToggleMute} />
            <button
              type="button"
              onClick={onOpenTeacherKey}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-extrabold text-violet-800 transition hover:border-violet-400 hover:bg-violet-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Teacher Key</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        {/* Hero welcome card */}
        <section className="exam-card relative overflow-hidden border-2 border-sky-100">
          {/* Rainbow accent bar */}
          <div className="h-2.5 w-full bg-gradient-to-r from-cyan-400 via-sky-400 via-amber-400 via-emerald-400 to-violet-400" />

          <div className="p-6 sm:p-9">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-cyan-800">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                  Welcome, Grade 4 Student!
                </span>

                <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                  {EXAM_TITLE}
                </h1>

                <p className="max-w-2xl text-base font-semibold text-slate-600 leading-relaxed">
                  Read each passage and question carefully, answer every item from Lessons 1 to 5,
                  and do your very best! Your answers are saved automatically as you work.
                </p>
              </div>

              {/* Tasteful cheerful Grade 4 book-and-star SVG illustration */}
              <div className="hidden md:flex shrink-0 items-center justify-center">
                <svg
                  width="128"
                  height="120"
                  viewBox="0 0 128 120"
                  aria-hidden="true"
                  className="drop-shadow-sm"
                >
                  <circle cx="64" cy="62" r="50" fill="#e0f2fe" />
                  <circle cx="102" cy="24" r="14" fill="#fde047" />
                  <path
                    d="M102 15l2.3 4.8 5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.7z"
                    fill="#f59e0b"
                  />
                  {/* Open colourful textbook */}
                  <path
                    d="M24 44c14-5 28-4 40 3v44c-12-7-26-8-40-3V44z"
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M104 44c-14-5-28-4-40 3v44c12-7 26-8 40-3V44z"
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <line x1="32" y1="56" x2="56" y2="58" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                  <line x1="32" y1="65" x2="54" y2="67" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                  <line x1="32" y1="74" x2="50" y2="76" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <line x1="72" y1="58" x2="96" y2="56" stroke="#fb7185" strokeWidth="3" strokeLinecap="round" />
                  <line x1="74" y1="67" x2="96" y2="65" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
                  <line x1="78" y1="76" x2="96" y2="74" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Key Exam Stat Cards */}
            <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200 bg-sky-50/80 p-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                    Total Questions
                  </p>
                  <p className="font-display text-2xl font-bold text-slate-900">
                    {TOTAL_MAIN_QUESTIONS} Questions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                    Total Marks
                  </p>
                  <p className="font-display text-2xl font-bold text-slate-900">
                    {TOTAL_EXAM_MARKS} Marks{' '}
                    <span className="text-xs font-bold text-amber-800">
                      ({MARKS_PER_QUESTION} each)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    Stopwatch Timer
                  </p>
                  <p className="font-display text-xl font-bold text-slate-900">
                    00:00:00{' '}
                    <span className="text-xs font-bold text-emerald-700">Starts on click</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Lessons Covered */}
            <div className="mt-7">
              <h2 className="font-display text-base font-bold text-slate-800 mb-3">
                Grade 4 · Unit 1 Lessons Covered (Mixed Question Order)
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {LESSON_METADATA.map((lesson, idx) => {
                  const style = LESSON_PILL_STYLES[idx];
                  return (
                    <div
                      key={lesson.number}
                      className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 ${style.bg}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold shadow-xs ${style.badge}`}
                        >
                          L{lesson.number}
                        </span>
                        <span className={`truncate text-sm font-extrabold ${style.text}`}>
                          {lesson.title}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
                        {lesson.questionCount} Qs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Helpful Exam Instructions */}
            <div className="mt-6 rounded-2xl border-2 border-violet-100 bg-violet-50/50 p-4 text-sm font-semibold text-slate-700">
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
                  Move freely between Questions 1 to 50 at any time.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  The timer begins only when you press Start Exam.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  Answer every question and part to unlock Submit Exam.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                  Download your full TXT score report after submitting.
                </li>
              </ul>
            </div>

            {/* Required Student Name & Start Exam Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-7 rounded-3xl border-2 border-cyan-200 bg-gradient-to-r from-cyan-50/80 via-sky-50/80 to-emerald-50/80 p-5 sm:p-6"
            >
              <label
                htmlFor="student-full-name"
                className="flex items-center gap-2 font-display text-base sm:text-lg font-bold text-slate-900"
              >
                <UserCheck className="h-5 w-5 text-cyan-600" />
                <span>
                  Student Name <span className="text-rose-500">*</span>
                </span>
              </label>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-600">
                Please enter your full name to begin the exam.
              </p>

              <div className="mt-3.5 flex flex-col gap-3 sm:flex-row">
                <input
                  id="student-full-name"
                  type="text"
                  required
                  maxLength={80}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Enter your name (e.g. Sara Ahmad)"
                  className={`flex-1 rounded-2xl border-2 bg-white px-4 py-3.5 text-base font-extrabold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    touched && !isValidName
                      ? 'border-rose-400'
                      : 'border-cyan-300 hover:border-cyan-400'
                  }`}
                />

                <button
                  type="submit"
                  disabled={!isValidName}
                  className={`inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5 font-display text-lg font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isValidName
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer focus:ring-emerald-400'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Start Exam</span>
                </button>
              </div>

              {touched && !isValidName && (
                <p role="alert" className="mt-2 text-xs font-extrabold text-rose-600">
                  Student name is required before starting the exam.
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <ContactFooter />
    </div>
  );
};

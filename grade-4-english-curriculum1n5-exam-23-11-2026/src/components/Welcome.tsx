import {
  Award, BookOpen, BookOpenCheck, ClipboardList, EyeOff, FileDown, GraduationCap, Home, MapPin,
  Play, PenLine, ShieldCheck, Smile, Sun, Timer, Users, Volume2, VolumeX,
} from 'lucide-react';
import { EXAM_SUBTITLE, EXAM_TITLE, TOTAL_MARKS } from '../data/exam';
import heroGrade4 from '../assets/hero-grade4.jpg';

interface WelcomeProps {
  name: string;
  onNameChange: (value: string) => void;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const LESSONS = [
  { icon: Smile, label: 'Nice to Meet You — greetings & introductions' },
  { icon: Users, label: 'My Family — family & appearance' },
  { icon: Sun, label: 'Daily Routine — time & he/she/it' },
  { icon: Home, label: 'My House — rooms & there is / are' },
  { icon: BookOpen, label: 'School Subjects — subjects & adjectives' },
  { icon: MapPin, label: 'Where I Live — in / on / by & places' },
];

const STEPS = [
  { icon: PenLine, text: 'Type your full name to unlock the exam — it is required before you can start.' },
  { icon: Timer, text: 'The stopwatch starts only when you press Start Exam, and it is saved if you refresh.' },
  { icon: EyeOff, text: 'No hints, answers or explanations are shown while you are answering.' },
  { icon: ClipboardList, text: 'Submit Exam unlocks when all 12 questions are complete — submission is immediate.' },
  { icon: FileDown, text: 'Right after submitting you get your score, explanations and a downloadable report.' },
];

export default function Welcome({ name, onNameChange, onStart, muted, onToggleMute }: WelcomeProps) {
  const canStart = name.trim().length >= 2;

  return (
    <div className="min-h-screen bg-cream">
      {/* top strip */}
      <header className="border-b border-pine-900/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pine-900 text-gold-400 shadow">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-tight text-pine-900 sm:text-base">{EXAM_TITLE}</p>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-ink-soft">{EXAM_SUBTITLE}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-pine-100 bg-paper text-pine-800 shadow-sm transition-colors hover:bg-pine-50"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* hero */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          {/* left — copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-pine-200 bg-pine-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-pine-800 sm:text-[11px]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Grade 4 · Unit 1 · Lessons 1–6
            </span>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] text-pine-950 sm:text-6xl">
              English Exam
              <span className="block text-coral-500">— Grade 4</span>
            </h1>
            <p className="mt-3 max-w-md text-base font-semibold leading-snug text-ink-soft sm:text-lg">
              A friendly interactive exam covering everything from <strong className="text-pine-900">Lesson 1 — Nice to Meet You</strong> to{' '}
              <strong className="text-pine-900">Lesson 6 — Where I Live</strong>.
            </p>

            {/* meta chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: ClipboardList, text: '12 questions' },
                { icon: Award, text: `${TOTAL_MARKS} marks` },
                { icon: BookOpenCheck, text: 'Unit 1 · Lessons 1–6' },
                { icon: Timer, text: 'Work at your own pace' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-pine-100 bg-paper px-3 py-1.5 text-xs font-extrabold text-pine-900 shadow-sm">
                  <Icon className="h-4 w-4 text-coral-500" aria-hidden="true" /> {text}
                </span>
              ))}
            </div>

            {/* what is covered */}
            <ul className="mt-4 grid max-w-lg grid-cols-1 gap-1.5 text-[13px] font-semibold text-ink-soft sm:text-sm">
              {LESSONS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold-100 text-gold-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* right — illustration */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="card texture-dots overflow-hidden rounded-[2rem] border-pine-100 p-2">
              <img
                src={heroGrade4}
                alt="Illustration of happy Grade 4 children studying English together around a picture book in a bright classroom"
                className="aspect-[4/3] w-full rounded-3xl object-cover"
                loading="eager"
              />
            </div>
            <div aria-hidden="true" className="animate-floaty absolute -left-2 top-4 rounded-2xl border border-pine-100 bg-paper/95 px-3 py-1.5 text-center shadow-lg backdrop-blur sm:-left-4">
              <span className="block font-display text-lg font-extrabold leading-none text-pine-900">6</span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-ink-soft">Lessons</span>
            </div>
            <div aria-hidden="true" className="animate-floaty-slow absolute -right-2 top-1/3 rounded-2xl border border-pine-100 bg-pine-900 px-3 py-1.5 text-center shadow-lg sm:-right-4">
              <span className="block font-display text-lg font-extrabold leading-none text-gold-400">100</span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-cream/80">Marks</span>
            </div>
            <div aria-hidden="true" className="animate-floaty absolute -bottom-3 left-6 rounded-2xl border border-gold-200 bg-gold-100 px-3 py-1.5 shadow-lg" style={{ animationDelay: '1.2s' }}>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gold-600">Unit 1</span>
            </div>
          </div>
        </div>

        {/* start card */}
        <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-6">
          {/* how it works */}
          <div className="card p-5 sm:p-6 lg:col-span-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-pine-900">
              <ClipboardList className="h-6 w-6 text-coral-500" aria-hidden="true" /> How this exam works
            </h2>
            <ol className="mt-3 space-y-2.5">
              {STEPS.map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] font-semibold leading-snug text-ink sm:text-sm">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-800">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span><span className="font-extrabold text-pine-900">Step {i + 1}. </span>{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* name + start */}
          <form
            className="card flex flex-col justify-between gap-4 border-gold-200 bg-gradient-to-br from-gold-100/70 via-paper to-paper p-5 sm:p-6 lg:col-span-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (canStart) onStart();
            }}
          >
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-pine-900">
                <PenLine className="h-6 w-6 text-coral-500" aria-hidden="true" /> Ready to begin?
              </h2>
              <p className="mt-1 text-xs font-semibold text-ink-soft sm:text-sm">
                Enter your full name exactly as you want it to appear on your report.
              </p>
              <label htmlFor="student-name" className="mt-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-pine-800">
                Student name <span className="rounded bg-coral-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">Required</span>
              </label>
              <input
                id="student-name"
                name="studentName"
                type="text"
                autoComplete="name"
                maxLength={60}
                required
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter your full name…"
                className="field mt-1.5 text-lg font-bold"
                aria-describedby="name-note"
              />
              <p id="name-note" className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                <ShieldCheck className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden="true" /> Your answers are saved on this device only.
              </p>
            </div>
            <div>
              <button type="submit" disabled={!canStart} className="btn btn-primary h-16 w-full gap-2 text-xl sm:h-[4.5rem] sm:text-2xl">
                <Play className="h-7 w-7 fill-current" aria-hidden="true" /> Start Exam
              </button>
              <p className="mt-2 text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft/80 sm:text-[11px]">
                The timer starts when you press Start Exam
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

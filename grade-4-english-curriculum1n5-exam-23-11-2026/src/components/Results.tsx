import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Award, BookMarked, CalendarDays, CheckCircle2, ChevronDown, Download, GraduationCap,
  KeyRound, MinusCircle, RotateCcw, Timer, User,
} from 'lucide-react';
import { gradeExam, formatHMS } from '../lib/grading';
import { downloadReport } from '../lib/report';
import type { AnswerMap } from '../types';
import TeacherKey from './TeacherKey';

interface ResultsProps {
  name: string;
  answers: AnswerMap;
  startedAt: number;
  submittedAt: number;
  onRetake: () => void;
}

const RING_RADIUS = 64;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function Results({ name, answers, startedAt, submittedAt, onRetake }: ResultsProps) {
  const result = useMemo(() => gradeExam(answers, startedAt, submittedAt), [answers, startedAt, submittedAt]);
  const [retakeArmed, setRetakeArmed] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [ringTarget, setRingTarget] = useState(RING_CIRC);

  useEffect(() => {
    const target = RING_CIRC * (1 - result.percentage / 100);
    const id = window.setTimeout(() => setRingTarget(target), 120);
    return () => window.clearTimeout(id);
  }, [result.percentage]);

  const submittedDate = new Date(submittedAt);
  const dateText = submittedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeText = submittedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const ringOffset = ringTarget;

  return (
    <div className="min-h-screen bg-cream pb-10">
      {/* header strip */}
      <header className="border-b border-pine-900/10 bg-pine-950 text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-pine-950"><GraduationCap className="h-5 w-5" aria-hidden="true" /></div>
            <p className="font-display text-sm font-bold sm:text-base">English Exam — Grade 4 <span className="text-gold-300">· Results</span></p>
          </div>
          <p className="hidden text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold-200 sm:block">Unit 1 · Lessons 1–6</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 pt-5 sm:px-5">
        {/* ============ score hero ============ */}
        <section aria-label="Your result" className="card texture-dots overflow-hidden">
          <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[auto_1fr] md:items-center md:gap-9">
            {/* score ring */}
            <div className="relative mx-auto">
              <svg viewBox="0 0 160 160" className="h-44 w-44 sm:h-52 sm:w-52" role="img" aria-label={`Score: ${result.totalEarned} out of ${result.totalPossible}`}>
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F2A541" />
                    <stop offset="55%" stopColor="#E8930C" />
                    <stop offset="100%" stopColor="#E4572E" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r={RING_RADIUS} stroke="#E0ECEA" strokeWidth="15" fill="none" />
                <circle
                  cx="80" cy="80" r={RING_RADIUS} stroke="url(#ringGradient)" strokeWidth="15" fill="none"
                  strokeLinecap="round" strokeDasharray={RING_CIRC} strokeDashoffset={ringOffset}
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.3, 0.9, 0.3, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-extrabold leading-none text-pine-900 sm:text-5xl">{result.totalEarned}</span>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-soft">out of {result.totalPossible}</span>
                <span className="tnum mt-1 rounded-full bg-pine-900 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-400 sm:text-[11px]">{result.percentage}%</span>
              </div>
            </div>

            {/* meta + actions */}
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-coral-600"><Award className="h-4 w-4" aria-hidden="true" /> Exam complete</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-pine-950 sm:text-4xl">Well done,<br className="hidden sm:block" /> {name.trim()}!</h1>
              <p className="mt-1.5 text-sm font-extrabold text-pine-800 sm:text-base">{result.gradeBand}</p>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-2xl border border-pine-100 bg-paper px-3 py-2">
                  <dt className="flex items-center gap-1 font-extrabold uppercase tracking-wide text-ink-soft"><User className="h-3.5 w-3.5" aria-hidden="true" />Student</dt>
                  <dd className="mt-0.5 truncate font-bold text-pine-900" title={name.trim()}>{name.trim()}</dd>
                </div>
                <div className="rounded-2xl border border-pine-100 bg-paper px-3 py-2">
                  <dt className="flex items-center gap-1 font-extrabold uppercase tracking-wide text-ink-soft"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Submitted</dt>
                  <dd className="mt-0.5 font-bold text-pine-900">{dateText} · {timeText}</dd>
                </div>
                <div className="col-span-2 rounded-2xl border border-pine-100 bg-paper px-3 py-2 sm:col-span-1">
                  <dt className="flex items-center gap-1 font-extrabold uppercase tracking-wide text-ink-soft"><Timer className="h-3.5 w-3.5" aria-hidden="true" />Time taken</dt>
                  <dd className="tnum mt-0.5 font-bold text-pine-900">{formatHMS(result.completionSeconds)}</dd>
                </div>
              </dl>

              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-ink-soft sm:text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-600" aria-hidden="true" />
                Questions at full marks: <span className="text-pine-900">{result.perfectQuestions} of 12</span>
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => downloadReport(name, result)} className="btn btn-gold h-12 gap-2 px-6 text-sm sm:text-base">
                  <Download className="h-5 w-5" aria-hidden="true" /> Download Report (.txt)
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (retakeArmed ? onRetake() : setRetakeArmed(true))}
                    className={`btn h-12 gap-2 px-6 text-sm sm:text-base ${retakeArmed ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    {retakeArmed ? 'Confirm retake' : 'Retake Exam'}
                  </button>
                  {retakeArmed && (
                    <button type="button" onClick={() => setRetakeArmed(false)} className="text-xs font-extrabold uppercase tracking-wide text-ink-soft underline underline-offset-2 hover:text-pine-900">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {retakeArmed && <p className="mt-1.5 text-[11px] font-bold text-coral-700">Retaking clears this result and asks for your name again.</p>}
            </div>
          </div>
        </section>

        {/* ============ question-by-question breakdown ============ */}
        <h2 className="mt-7 px-1 font-display text-2xl font-bold text-pine-950">Question breakdown</h2>
        <p className="px-1 text-xs font-semibold text-ink-soft sm:text-sm">Tap a question to expand it. Correct answers and explanations are shown here because your exam is submitted.</p>

        <div className="mt-3 space-y-2.5">
          {result.questions.map((qr) => {
            const full = qr.earned === qr.max;
            const zero = qr.earned === 0;
            const pill = full ? 'bg-leaf-600 text-white' : zero ? 'bg-coral-500 text-white' : 'bg-gold-400 text-[#4A2C04]';
            return (
              <details key={qr.question.id} className="group overflow-hidden rounded-2xl border border-pine-100 bg-paper shadow-sm" open={!full}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors [&::-webkit-details-marker]:hidden hover:bg-pine-50/60 sm:px-5">
                  {full ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-leaf-600" aria-hidden="true" />
                  ) : zero ? (
                    <AlertCircle className="h-6 w-6 shrink-0 text-coral-500" aria-hidden="true" />
                  ) : (
                    <MinusCircle className="h-6 w-6 shrink-0 text-gold-500" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-pine-900 sm:text-base">
                      <span className="text-coral-600">Q{qr.question.id}.</span> {qr.question.title}
                    </span>
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-soft sm:text-[10px]">{qr.question.lessons} · {qr.question.skill}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 font-display text-xs font-extrabold sm:text-sm ${pill}`}>
                    {qr.earned} / {qr.max}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>

                <div className="border-t border-pine-100 px-4 py-3 sm:px-5">
                  <ol className="space-y-2">
                    {qr.parts.map((part, i) => {
                      const ok = part.status === 'correct';
                      const partial = part.status === 'partial';
                      const empty = part.status === 'empty';
                      const partQ = qr.question;
                      return (
                        <li key={part.partId} className="grid gap-2 rounded-xl border border-pine-100 bg-white/70 p-2.5 text-xs sm:p-3 sm:text-sm md:grid-cols-[auto_1.15fr_1.35fr_auto] md:items-center">
                          {/* item */}
                          <div className="flex items-center gap-2 md:flex-col md:gap-1">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pine-900 font-display text-[11px] font-bold text-cream">{i + 1}</span>
                            {partQ.kind === 'vocab' ? (
                              <span lang="ar" dir="rtl" className="arabic-prompt rounded-md border border-gold-200 bg-gold-100/70 px-2 py-0.5 text-base font-bold">{partQ.parts[i].prompt}</span>
                            ) : (
                              <span className="truncate font-bold text-ink-soft md:max-w-[6.5rem]">{part.prompt}</span>
                            )}
                          </div>
                          {/* your answer */}
                          <div className={`rounded-lg px-2.5 py-1.5 ${ok ? 'bg-leaf-100/70' : partial ? 'bg-gold-100/80' : 'bg-coral-100/70'}`}>
                            <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-soft">Your answer</span>
                            <span className={`mt-0.5 block font-bold ${empty ? 'italic text-coral-700' : 'text-ink'}`}>{empty ? 'No answer' : part.submitted}</span>
                          </div>
                          {/* correct answer */}
                          <div className="rounded-lg bg-pine-50 px-2.5 py-1.5">
                            <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink-soft">Correct answer</span>
                            <span className="mt-0.5 block font-bold text-pine-900">{part.displayAnswer}</span>
                          </div>
                          {/* marks */}
                          <span className={`justify-self-start whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold sm:text-[11px] md:justify-self-end ${ok ? 'bg-leaf-600 text-white' : partial ? 'bg-gold-400 text-[#4A2C04]' : 'bg-coral-500 text-white'}`}>
                            {part.earned}/{part.marks} {ok ? '✓' : partial ? '½' : '✗'}
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  {!full && (
                    <div className="mt-2 rounded-xl border border-gold-200 bg-gold-100/60 px-3 py-2 text-xs font-semibold leading-snug text-ink sm:text-[13px]">
                      <span className="font-extrabold uppercase tracking-wide text-gold-600">Explanation — </span>
                      {qr.question.explanation}
                    </div>
                  )}
                  <p className="mt-2 flex items-start gap-1.5 text-[10px] font-bold leading-snug text-ink-soft sm:text-[11px]">
                    <BookMarked className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-700" aria-hidden="true" />
                    <span><span className="uppercase tracking-wide">Reference: </span>{qr.question.reference}</span>
                  </p>
                </div>
              </details>
            );
          })}
        </div>

        {/* ============ teacher answer key (password protected) ============ */}
        <section className="mt-7" aria-label="Teacher access">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-pine-100 bg-pine-950 px-5 py-6 text-center text-cream">
            <KeyRound className="h-7 w-7 text-gold-400" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold">Teacher access</h2>
              <p className="mt-0.5 text-xs font-semibold text-cream/70">The answer key is protected by the teacher password and is not shown to students.</p>
            </div>
            {!showTeacher ? (
              <button type="button" onClick={() => setShowTeacher(true)} className="btn btn-gold h-12 gap-2 px-7 text-sm sm:text-base">
                <KeyRound className="h-5 w-5" aria-hidden="true" /> Open Teacher Answer Key
              </button>
            ) : (
              <button type="button" onClick={() => setShowTeacher(false)} className="text-xs font-extrabold uppercase tracking-wider text-cream/70 underline underline-offset-2 hover:text-cream">
                Hide teacher area
              </button>
            )}
          </div>
          {showTeacher && (
            <div className="mt-3">
              <TeacherKey onClose={() => setShowTeacher(false)} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import {
  CURRICULUM_PASSAGES,
  EXAM_TITLE,
  LESSON_METADATA,
  TOTAL_EXAM_MARKS,
  TOTAL_MAIN_QUESTIONS,
} from '../data/passages';
import { EXAM_QUESTIONS } from '../data/questions';
import { LessonNumber } from '../types/exam';
import { formatMark, formatSourceReference } from '../utils/scoring';
import { ContactFooter } from './ContactFooter';

/** Basic client-side interface gate password (not cryptographic authentication). */
export const TEACHER_KEY_PASSWORD = 'somer173';

interface TeacherKeyPageProps {
  onClose: () => void;
  returnLabel: string;
}

type KeyFilter = 'exam-order' | LessonNumber;

export const TeacherKeyPage: React.FC<TeacherKeyPageProps> = ({
  onClose,
  returnLabel,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState<KeyFilter>('exam-order');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === TEACHER_KEY_PASSWORD) {
      setUnlocked(true);
      setPasswordInput('');
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect password. Please try again.');
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    setPasswordInput('');
    setErrorMsg('');
  };

  const indexedQuestions = useMemo(
    () => EXAM_QUESTIONS.map((question, idx) => ({ examNumber: idx + 1, question })),
    []
  );

  const visibleQuestions = useMemo(() => {
    if (filter === 'exam-order') return indexedQuestions;
    return indexedQuestions.filter((item) => item.question.lesson === filter);
  }, [indexedQuestions, filter]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-violet-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-violet-700">
                Teacher Reference Area
              </p>
              <p className="font-display text-base font-bold text-slate-900">
                Teacher Answer Key & Marking Scheme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unlocked && (
              <button
                type="button"
                onClick={handleLock}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-extrabold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lock Key</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-extrabold text-sky-900 hover:bg-sky-100 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{returnLabel}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {!unlocked ? (
          <section className="exam-card mx-auto max-w-md overflow-hidden border-2 border-violet-200">
            <div className="h-2 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-cyan-400" />
            <div className="p-6 sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Lock className="h-7 w-7" />
              </div>

              <h1 className="mt-4 text-center font-display text-2xl font-bold text-slate-900">
                Teacher Answer Key
              </h1>
              <p className="mt-1.5 text-center text-sm font-semibold text-slate-600">
                Enter the teacher password to view all 50 questions, verified answers, marking
                rules, mark allocations and source references.
              </p>

              <form onSubmit={handleUnlock} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="teacher-password"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
                  >
                    Teacher Password
                  </label>
                  <input
                    id="teacher-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter password"
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-2xl border-2 border-violet-200 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-violet-500 focus:outline-none"
                  />
                  {errorMsg && (
                    <p role="alert" className="mt-1.5 text-xs font-extrabold text-rose-600">
                      {errorMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 font-display text-base font-bold text-white shadow-md transition hover:from-violet-600 hover:to-purple-700 cursor-pointer"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Open Answer Key</span>
                </button>
              </form>

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Note: This password serves as a basic client-side interface gate for classroom
                  convenience only; it is hidden during active exam attempts and does not provide
                  server-side authentication or encryption.
                </span>
              </div>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {/* Overview & Filter Card */}
            <section className="exam-card border-2 border-violet-100 p-6">
              <h1 className="font-display text-2xl font-bold text-slate-900">
                {EXAM_TITLE} — Official Answer Key
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {TOTAL_MAIN_QUESTIONS} main questions · 10 questions per lesson · 2 marks per main
                question · Total: {TOTAL_EXAM_MARKS} marks. Unavailable during any active student
                exam attempt.
              </p>

              {/* Lesson Allocation Summary */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
                {LESSON_METADATA.map((m) => (
                  <div
                    key={m.number}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <p className="font-extrabold text-violet-700">Lesson {m.number}</p>
                    <p className="font-bold text-slate-900 truncate">{m.title}</p>
                    <p className="mt-0.5 font-semibold text-slate-500">
                      {m.questionCount} Qs · {m.maxMarks} marks
                    </p>
                  </div>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('exam-order')}
                  className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold cursor-pointer ${
                    filter === 'exam-order'
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                  }`}
                >
                  All 50 (Exam Order)
                </button>
                {LESSON_METADATA.map((m) => (
                  <button
                    key={m.number}
                    type="button"
                    onClick={() => setFilter(m.number)}
                    className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold cursor-pointer ${
                      filter === m.number
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                    }`}
                  >
                    Lesson {m.number} ({m.questionCount})
                  </button>
                ))}
              </div>
            </section>

            {/* Full Question Key List */}
            {visibleQuestions.map(({ examNumber, question: q }) => {
              const passage = q.passageId ? CURRICULUM_PASSAGES[q.passageId] : null;
              return (
                <article
                  key={q.id}
                  className="exam-card border-2 border-slate-100 p-5 sm:p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-violet-600 px-3 py-1 font-display text-sm font-bold text-white">
                        Q{examNumber}
                      </span>
                      <span className="rounded-full bg-cyan-100 px-3 py-0.5 text-xs font-extrabold text-cyan-900">
                        Lesson {q.lesson}: {q.source.lessonTitle}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-extrabold text-slate-700">
                        {q.formatLabel}
                      </span>
                    </div>
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-xs font-extrabold text-amber-900">
                      Total: {q.marks} marks
                    </span>
                  </div>

                  <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900">
                    {q.instruction}
                  </h2>

                  {passage && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs sm:text-sm font-semibold text-slate-800 space-y-1">
                      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-amber-800">
                        <BookOpen className="h-3.5 w-3.5" />
                        Printed Passage ({passage.source.book} {passage.source.page})
                      </p>
                      {passage.paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  )}

                  {q.wordBank && (
                    <p className="text-xs font-bold text-teal-800">
                      Word Box: {q.wordBank.join(' · ')}
                    </p>
                  )}

                  {q.contextLines && (
                    <div className="rounded-xl bg-violet-50/60 p-3 text-xs sm:text-sm font-bold text-slate-700 space-y-0.5">
                      {q.contextLines.map((cl, i) => (
                        <p key={i}>{cl}</p>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    {q.subParts.map((sp) => (
                      <div
                        key={sp.id}
                        className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs sm:text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-bold text-slate-900">
                            {sp.label && (
                              <span className="mr-1.5 font-extrabold text-violet-700">
                                {sp.label}
                              </span>
                            )}
                            {sp.underlinedSegment ? (
                              <>
                                <span>{sp.underlinedSegment.before}</span>
                                <span className="rounded bg-rose-100 px-1 py-0.5 text-rose-700 underline decoration-rose-500 decoration-2 underline-offset-2">
                                  {sp.underlinedSegment.underlined}
                                </span>
                                <span>{sp.underlinedSegment.after}</span>
                              </>
                            ) : (
                              <span>{sp.prompt}</span>
                            )}
                            {sp.clock && (
                              <span className="ml-2 text-xs font-bold text-sky-700">
                                [{sp.clock.label}]
                              </span>
                            )}
                          </p>
                          <span className="rounded-full bg-emerald-200/70 px-2.5 py-0.5 text-xs font-extrabold text-emerald-950">
                            {formatMark(sp.marks)} {sp.marks === 1 ? 'mark' : 'marks'}
                          </span>
                        </div>

                        <p className="mt-1.5 flex items-center gap-1.5 font-extrabold text-emerald-900">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>Correct Answer: {sp.correctAnswer}</span>
                        </p>

                        {sp.acceptedAnswers && sp.acceptedAnswers.length > 1 && (
                          <p className="mt-0.5 text-xs font-semibold text-slate-600">
                            Accepted equivalents: {sp.acceptedAnswers.join(' | ')}
                          </p>
                        )}

                        <p className="mt-0.5 text-xs font-semibold text-slate-600">
                          Marking rule: {sp.markingRule}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 space-y-1">
                    <p>
                      <span className="font-extrabold text-slate-900">Teaching Note: </span>
                      {q.explanation}
                    </p>
                    <p className="text-sky-900">
                      <span className="font-extrabold">Source Reference: </span>
                      {formatSourceReference(q.source)}
                      {q.source.note ? ` — ${q.source.note}` : ''}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <ContactFooter />
    </div>
  );
};

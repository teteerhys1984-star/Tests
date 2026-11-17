import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  KeyRound,
  RotateCcw,
  Trophy,
  User,
  XCircle,
} from 'lucide-react';
import { CURRICULUM_PASSAGES } from '../data/passages';
import { ExamEvaluation, LessonNumber } from '../types/exam';
import { downloadTxtReport, buildReportFilename } from '../utils/report';
import { formatMark, formatSourceReference } from '../utils/scoring';
import { formatStopwatch, formatSubmissionDateTime } from '../utils/storage';
import { AnalogueClock } from './AnalogueClock';
import { ContactFooter } from './ContactFooter';
import { SoundToggle } from './SoundToggle';

interface ResultsPageProps {
  evaluation: ExamEvaluation;
  muted: boolean;
  onToggleMute: () => void;
  onStartNewAttempt: () => void;
  onOpenTeacherKey: () => void;
}

type ReviewFilter = 'all' | 'correct' | 'incorrect' | LessonNumber;

const LESSON_CARD_STYLES: Record<
  LessonNumber,
  { border: string; bar: string; badge: string }
> = {
  1: { border: 'border-cyan-200 bg-cyan-50/50', bar: 'bg-cyan-500', badge: 'bg-cyan-500 text-white' },
  2: { border: 'border-rose-200 bg-rose-50/50', bar: 'bg-rose-500', badge: 'bg-rose-500 text-white' },
  3: { border: 'border-amber-200 bg-amber-50/50', bar: 'bg-amber-500', badge: 'bg-amber-500 text-white' },
  4: { border: 'border-emerald-200 bg-emerald-50/50', bar: 'bg-emerald-500', badge: 'bg-emerald-500 text-white' },
  5: { border: 'border-violet-200 bg-violet-50/50', bar: 'bg-violet-500', badge: 'bg-violet-500 text-white' },
};

export const ResultsPage: React.FC<ResultsPageProps> = ({
  evaluation,
  muted,
  onToggleMute,
  onStartNewAttempt,
  onOpenTeacherKey,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const filteredQuestions = useMemo(() => {
    return evaluation.gradedQuestions.filter((gq) => {
      if (filter === 'all') return true;
      if (filter === 'correct') return gq.isFullyCorrect;
      if (filter === 'incorrect') return !gq.isFullyCorrect;
      return gq.question.lesson === filter;
    });
  }, [evaluation.gradedQuestions, filter]);

  const encouragement =
    evaluation.totalEarnedMarks >= 90
      ? 'Outstanding work! Fantastic mastery of Grade 4 Lessons 1–5!'
      : evaluation.totalEarnedMarks >= 75
      ? 'Great job! Very strong understanding across Unit 1!'
      : evaluation.totalEarnedMarks >= 50
      ? 'Good effort! Review the highlighted answers below to keep improving.'
      : 'Nice try completing all 50 questions! Study the review below and try again.';

  const reportFilename = buildReportFilename(evaluation.studentName);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="border-b-2 border-emerald-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-md">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Exam Completed
              </p>
              <p className="font-display text-base font-bold text-slate-900">
                Official Results & Detailed Review
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SoundToggle muted={muted} onToggle={onToggleMute} />
            <button
              type="button"
              onClick={onOpenTeacherKey}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-extrabold text-violet-800 transition hover:bg-violet-100 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Teacher Key</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7 sm:py-9 space-y-7">
        {/* Main Score Summary Card */}
        <section className="exam-card overflow-hidden border-2 border-emerald-100">
          <div className="h-2.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 via-sky-400 via-amber-400 to-violet-400" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  <User className="h-3.5 w-3.5" />
                  Student: {evaluation.studentName}
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  {evaluation.examTitle}
                </h1>
                <p className="text-sm sm:text-base font-bold text-teal-800">{encouragement}</p>
                <p className="text-xs font-semibold text-slate-500">
                  Submitted: {formatSubmissionDateTime(evaluation.submittedAtIso)}
                </p>
              </div>

              {/* Big cheerful score badge */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-100/70 px-8 py-5 text-center shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  Total Score
                </p>
                <p className="mt-1 font-display text-4xl sm:text-5xl font-bold text-slate-900 tabular-nums">
                  {formatMark(evaluation.totalEarnedMarks)}
                  <span className="text-2xl font-semibold text-slate-500">
                    {' '}
                    / {evaluation.totalMaxMarks}
                  </span>
                </p>
                <p className="mt-1 text-xs font-extrabold text-amber-900">
                  {formatMark(evaluation.totalEarnedMarks)}% Overall
                </p>
              </div>
            </div>

            {/* 4 Stat Tiles */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Correct Answers</span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {evaluation.correctQuestionCount} / {evaluation.totalQuestions}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <span>Incorrect Answers</span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {evaluation.incorrectQuestionCount} / {evaluation.totalQuestions}
                </p>
                {evaluation.partialQuestionCount > 0 && (
                  <p className="text-[11px] font-bold text-amber-800">
                    ({evaluation.partialQuestionCount} with partial marks)
                  </p>
                )}
              </div>

              <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-800">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>Time Taken</span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {formatStopwatch(evaluation.elapsedMs)}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/70 p-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-violet-800">
                  <Award className="h-4 w-4 text-violet-600" />
                  <span>Marks Earned</span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {formatMark(evaluation.totalEarnedMarks)} / 100
                </p>
              </div>
            </div>

            {/* Report Download & Restart Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => downloadTxtReport(evaluation)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-6 py-3.5 font-display text-base font-bold text-white shadow-md shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <Download className="h-5 w-5" />
                <span>Download TXT Report</span>
              </button>

              <button
                type="button"
                onClick={onStartNewAttempt}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 font-display text-base font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Start New Exam</span>
              </button>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Report file: {reportFilename}
              </span>
            </div>
          </div>
        </section>

        {/* Lesson-by-Lesson Score Breakdown */}
        <section className="exam-card border-2 border-sky-100 p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Score by Lesson (20 Marks Each)
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {evaluation.lessonScores.map((ls) => {
              const style = LESSON_CARD_STYLES[ls.lesson];
              const pct = Math.round((ls.earnedMarks / ls.maxMarks) * 100);
              return (
                <div
                  key={ls.lesson}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-4 ${style.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${style.badge}`}
                      >
                        Lesson {ls.lesson}
                      </span>
                      <span className="text-xs font-extrabold text-slate-600">
                        {ls.fullyCorrectCount}/{ls.questionCount} Qs
                      </span>
                    </div>
                    <p className="mt-2 font-display text-sm font-bold text-slate-900 leading-snug">
                      {ls.title}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                      {formatMark(ls.earnedMarks)}{' '}
                      <span className="text-sm font-semibold text-slate-500">/ {ls.maxMarks}</span>
                    </p>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed 50-Question Review */}
        <section className="space-y-4">
          <div className="exam-card border-2 border-sky-100 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Detailed Review of All 50 Questions
              </h2>
              <span className="text-xs font-extrabold text-slate-500">
                Showing {filteredQuestions.length} of 50 questions
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: `All (50)` },
                  { id: 'correct', label: `Correct (${evaluation.correctQuestionCount})` },
                  { id: 'incorrect', label: `Incorrect / Partial (${evaluation.incorrectQuestionCount})` },
                  { id: 1, label: 'Lesson 1' },
                  { id: 2, label: 'Lesson 2' },
                  { id: 3, label: 'Lesson 3' },
                  { id: 4, label: 'Lesson 4' },
                  { id: 5, label: 'Lesson 5' },
                ] as { id: ReviewFilter; label: string }[]
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={String(tab.id)}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                      active
                        ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredQuestions.map((gq) => {
            const q = gq.question;
            const passage = q.passageId ? CURRICULUM_PASSAGES[q.passageId] : null;
            const statusStyle = gq.isFullyCorrect
              ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
              : gq.isPartial
              ? 'border-amber-200 bg-amber-100 text-amber-900'
              : 'border-rose-200 bg-rose-100 text-rose-900';

            return (
              <article
                key={q.id}
                className="exam-card overflow-hidden border-2 border-slate-100 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-slate-900 px-3 py-1 font-display text-sm font-bold text-white">
                      Question {gq.examNumber}
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-extrabold text-sky-800">
                      Lesson {q.lesson}
                    </span>
                    <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-extrabold text-violet-800">
                      {q.formatLabel}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold ${statusStyle}`}
                  >
                    {gq.isFullyCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {formatMark(gq.earnedMarks)} / {gq.maxMarks} marks
                    </span>
                  </span>
                </div>

                <h3 className="mt-3 font-display text-base sm:text-lg font-semibold text-slate-900">
                  {q.instruction}
                </h3>

                {passage && (
                  <details className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5">
                    <summary className="cursor-pointer text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                      <span>View Reading Passage</span>
                    </summary>
                    <div className="mt-2 space-y-1.5 text-sm font-semibold text-slate-800 leading-relaxed">
                      {passage.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </details>
                )}

                {q.contextLines && q.contextLines.length > 0 && (
                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 px-3.5 py-2 text-sm font-bold text-slate-700 space-y-1">
                    {q.contextLines.map((cl, i) => (
                      <p key={i}>{cl}</p>
                    ))}
                  </div>
                )}

                {/* Sub-part results */}
                <div className="mt-4 space-y-2.5">
                  {gq.subPartResults.map((spr) => (
                    <div
                      key={spr.subPart.id}
                      className={`rounded-2xl border p-3.5 ${
                        spr.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {spr.subPart.clock && (
                            <AnalogueClock clock={spr.subPart.clock} size={72} />
                          )}
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">
                              {spr.subPart.label && (
                                <span className="mr-1.5 text-sky-700">{spr.subPart.label}</span>
                              )}
                              {spr.subPart.underlinedSegment ? (
                                <>
                                  <span>{spr.subPart.underlinedSegment.before}</span>
                                  <span className="rounded bg-rose-100 px-1 py-0.5 text-rose-700 underline decoration-rose-500 decoration-2 underline-offset-2">
                                    {spr.subPart.underlinedSegment.underlined}
                                  </span>
                                  <span>{spr.subPart.underlinedSegment.after}</span>
                                </>
                              ) : (
                                <span>{spr.subPart.prompt}</span>
                              )}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm font-bold">
                              <span
                                className={
                                  spr.isCorrect ? 'text-emerald-800' : 'text-rose-700'
                                }
                              >
                                Your answer:{' '}
                                <strong className="font-extrabold">
                                  {spr.studentAnswerDisplay}
                                </strong>
                              </span>
                              <span className="text-teal-900">
                                Correct answer:{' '}
                                <strong className="font-extrabold">
                                  {spr.correctAnswerDisplay}
                                </strong>
                              </span>
                            </div>
                            {spr.subPart.explanation && (
                              <p className="mt-1 text-xs font-semibold text-slate-600">
                                {spr.subPart.explanation}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`self-start sm:self-center shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                            spr.isCorrect
                              ? 'bg-emerald-200/70 text-emerald-900'
                              : 'bg-rose-200/70 text-rose-900'
                          }`}
                        >
                          {formatMark(spr.earnedMarks)} / {formatMark(spr.maxMarks)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation + Verified Source Reference */}
                <div className="mt-4 space-y-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-xs sm:text-sm">
                  <p className="font-bold text-slate-700">
                    <span className="font-extrabold text-slate-900">Explanation: </span>
                    {q.explanation}
                  </p>
                  <p className="font-bold text-sky-800">
                    <span className="font-extrabold text-sky-950">Curriculum Source: </span>
                    {formatSourceReference(q.source)}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <ContactFooter />
    </div>
  );
};

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookMarked,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  RefreshCw,
  RotateCcw,
  Send,
  User,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { EXAM_SUBTITLE, EXAM_TITLE, LESSONS } from "../data/lessons";
import { AnswerMap, ExamQuestion, LessonNumber } from "../types/exam";
import {
  evaluateExam,
  formatMark,
  formatSourceReference,
} from "../utils/grading";
import {
  buildReportFilename,
  downloadTxtReport,
  formatSubmissionDateTime,
} from "../utils/report";
import { SendState } from "../utils/submit";
import { formatDurationHHMMSS } from "../utils/timer";
import { StimulusBlock } from "./StimulusBlock";

interface ResultsScreenProps {
  studentName: string;
  questions: ExamQuestion[];
  answers: AnswerMap;
  elapsedSeconds: number;
  submittedAt: string;
  muted: boolean;
  sendStatus?: SendState;
  canSend?: boolean;
  onResendResult?: () => void;
  onToggleMute: () => void;
  onStartNewExam: () => void;
  onOpenTeacherKey: () => void;
}

type ReviewFilter = "all" | "correct" | "review" | LessonNumber;

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  studentName,
  questions,
  answers,
  elapsedSeconds,
  submittedAt,
  muted,
  sendStatus = "idle",
  canSend = true,
  onResendResult,
  onToggleMute,
  onStartNewExam,
  onOpenTeacherKey,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const evaluation = useMemo(
    () => evaluateExam(questions, answers),
    [questions, answers]
  );

  const filteredResults = useMemo(() => {
    if (filter === "all") return evaluation.questionResults;
    if (filter === "correct") {
      return evaluation.questionResults.filter((r) => r.status === "correct");
    }
    if (filter === "review") {
      return evaluation.questionResults.filter((r) => r.status !== "correct");
    }
    return evaluation.questionResults.filter(
      (r) => r.question.lesson === filter
    );
  }, [evaluation.questionResults, filter]);

  const handleDownloadReport = () => {
    downloadTxtReport({
      studentName,
      submittedAtIso: submittedAt,
      elapsedSeconds,
      evaluation,
    });
  };

  const encouragement =
    evaluation.totalEarned >= 90
      ? "Outstanding work! You mastered Unit 1!"
      : evaluation.totalEarned >= 75
      ? "Great job! Well done on your Unit 1 exam!"
      : evaluation.totalEarned >= 50
      ? "Good effort! Review the answers below to grow even stronger."
      : "Keep practising! Read each explanation below carefully.";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-6 sm:px-6 sm:py-10">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bce8cc] bg-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
          Exam Completed
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ebd3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#166534] hover:bg-[#f0fcf4]"
          >
            {muted ? (
              <>
                <VolumeX className="h-4 w-4 text-[#4b755d]" aria-hidden="true" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
                <span>Sound On</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ebd3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#166534] hover:bg-[#f0fcf4]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#16a34a]" aria-hidden="true" />
            <span>Teacher Key</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <section className="exam-card-shadow overflow-hidden rounded-3xl border-2 border-[#b9e8c9] bg-white">
        <div className="border-b border-[#cdeed7] bg-gradient-to-r from-[#e2faeb] via-[#edfdf2] to-[#f1fce1] p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#16a34a]">
                {EXAM_TITLE} · {EXAM_SUBTITLE}
              </p>
              <h1 className="text-2xl font-extrabold text-[#0f3d24] sm:text-3xl">
                Final Exam Results
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-[#1e4b32]">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
                  Student: <strong className="text-[#0f3d24]">{studentName}</strong>
                </span>
                <span className="text-xs font-semibold text-[#3f6a52]">
                  Submitted: {formatSubmissionDateTime(submittedAt)}
                </span>
              </div>
              <p className="pt-1 text-sm font-bold text-[#15803d]">
                {encouragement}
              </p>
            </div>

            {/* Big circular/pill total score badge */}
            <div className="flex shrink-0 flex-col items-center justify-center rounded-3xl border-2 border-[#86efac] bg-white px-7 py-5 text-center shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                Total Score
              </span>
              <div
                className="mt-1 text-4xl font-extrabold text-[#0f3d24] sm:text-5xl"
                data-testid="total-score"
              >
                {formatMark(evaluation.totalEarned)}
                <span className="text-2xl font-bold text-[#4d7c61]">
                  {" "}
                  / {evaluation.totalMax}
                </span>
              </div>
              <span className="mt-1 rounded-full bg-[#ecfccb] px-3 py-0.5 text-xs font-extrabold text-[#365314]">
                {evaluation.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary stat tiles */}
        <div className="space-y-6 p-6 sm:p-8">
          <div
            className={`grid grid-cols-2 gap-3.5 ${
              evaluation.partialCount > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            <div className="rounded-2xl border border-[#b9e8c9] bg-[#f1fcf5] p-4 text-center">
              <CheckCircle2
                className="mx-auto mb-1 h-6 w-6 text-[#16a34a]"
                aria-hidden="true"
              />
              <div className="text-2xl font-extrabold text-[#0f3d24]">
                {evaluation.correctCount}
              </div>
              <div className="text-xs font-bold text-[#166534]">
                Correct Answers
              </div>
            </div>

            {evaluation.partialCount > 0 && (
              <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-center">
                <AlertCircle
                  className="mx-auto mb-1 h-6 w-6 text-[#d97706]"
                  aria-hidden="true"
                />
                <div className="text-2xl font-extrabold text-[#78350f]">
                  {evaluation.partialCount}
                </div>
                <div className="text-xs font-bold text-[#92400e]">
                  Partially Correct
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-center">
              <XCircle
                className="mx-auto mb-1 h-6 w-6 text-[#dc2626]"
                aria-hidden="true"
              />
              <div className="text-2xl font-extrabold text-[#7f1d1d]">
                {evaluation.incorrectCount}
              </div>
              <div className="text-xs font-bold text-[#991b1b]">
                Incorrect Answers
              </div>
            </div>

            <div className="rounded-2xl border border-[#c6ebd3] bg-[#f5fdf8] p-4 text-center">
              <Clock
                className="mx-auto mb-1 h-6 w-6 text-[#16a34a]"
                aria-hidden="true"
              />
              <div className="font-mono text-2xl font-extrabold text-[#0f3d24]">
                {formatDurationHHMMSS(elapsedSeconds)}
              </div>
              <div className="text-xs font-bold text-[#39634b]">Time Taken</div>
            </div>
          </div>

          {/* Teacher Google Sheet Delivery Status + Independent Resend Button */}
          {canSend && (
            <div
              role="status"
              aria-live="polite"
              data-testid="send-status"
              className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                sendStatus === "sent"
                  ? "border-[#b9e8c9] bg-[#eefbf2] text-[#14532d]"
                  : sendStatus === "failed"
                  ? "border-[#fde68a] bg-[#fffbeb] text-[#78350f]"
                  : "border-[#cdeed7] bg-[#f7fef9] text-[#166534]"
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm font-bold">
                {sendStatus === "sent" ? (
                  <>
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#16a34a]"
                      aria-hidden="true"
                    />
                    <span>Result sent to teacher</span>
                  </>
                ) : sendStatus === "sending" ? (
                  <>
                    <RefreshCw
                      className="h-4 w-4 shrink-0 animate-spin text-[#16a34a]"
                      aria-hidden="true"
                    />
                    <span>Sending result to teacher…</span>
                  </>
                ) : (
                  <>
                    <AlertCircle
                      className="h-4 w-4 shrink-0 text-[#d97706]"
                      aria-hidden="true"
                    />
                    <span>
                      Result not sent yet — saved on this device and will be
                      retried automatically.
                    </span>
                  </>
                )}
              </div>

              {sendStatus !== "sent" && sendStatus !== "sending" && onResendResult && (
                <button
                  type="button"
                  onClick={onResendResult}
                  data-testid="resend-result-btn"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-[#f59e0b] bg-white px-4 py-2 text-xs font-extrabold text-[#92400e] transition-colors hover:bg-[#fef3c7]"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Resend Result</span>
                </button>
              )}
            </div>
          )}

          {/* Primary Actions: Download TXT Report + Start New Exam */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#cdeed7] bg-[#f7fef9] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#0f3d24]">
                Download Full Exam Report (.txt)
              </p>
              <p className="text-xs font-semibold text-[#3f6a52]">
                File: <span className="font-mono">{buildReportFilename(studentName)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadReport}
                data-testid="download-txt-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-[#22c55e]/25 transition-colors hover:bg-[#16a34a]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Download TXT Report</span>
              </button>

              <button
                type="button"
                onClick={onStartNewExam}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#bce8cc] bg-white px-4 py-2.5 text-sm font-extrabold text-[#166534] transition-colors hover:border-[#6fd492] hover:bg-[#eefbf2]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Start New Exam</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Score per Lesson Breakdown */}
      <section className="exam-card-shadow rounded-3xl border-2 border-[#c2ebd0] bg-white p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#22c55e]" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-[#0f3d24]">
            Score by Lesson
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {evaluation.lessonScores.map((ls) => {
            const pct = Math.round((ls.earnedMarks / ls.maxMarks) * 100);
            return (
              <div
                key={ls.lesson}
                className="flex flex-col justify-between rounded-2xl border border-[#cdeed7] bg-[#f7fef9] p-4"
              >
                <div>
                  <span className="inline-block rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold text-[#15803d]">
                    Lesson {ls.lesson}
                  </span>
                  <h3 className="mt-2 text-sm font-extrabold text-[#0f3d24]">
                    {ls.title}
                  </h3>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-[#0f3d24]">
                      {formatMark(ls.earnedMarks)}
                      <span className="text-sm font-bold text-[#4d7c61]">
                        /{ls.maxMarks}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-[#15803d]">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2f5e9]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#84cc16]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#477359]">
                    {ls.questionCount} questions
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Review of All 50 Questions */}
      <section className="space-y-5">
        <div className="rounded-3xl border-2 border-[#c2ebd0] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#0f3d24]">
                Detailed Review of All 50 Questions
              </h2>
              <p className="text-xs font-semibold text-[#3f6a52]">
                Showing {filteredResults.length} of {evaluation.questionResults.length}{" "}
                questions with answers, marks, explanations, and curriculum source
                references.
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: `All (${evaluation.questionResults.length})` },
                { key: "correct", label: `Correct (${evaluation.correctCount})` },
                {
                  key: "review",
                  label: `Incorrect / Partial (${
                    evaluation.incorrectCount + evaluation.partialCount
                  })`,
                },
                ...LESSONS.map((l) => ({
                  key: l.number as ReviewFilter,
                  label: `Lesson ${l.number}: ${l.title}`,
                })),
              ] as { key: ReviewFilter; label: string }[]
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={String(tab.key)}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                    active
                      ? "bg-[#22c55e] text-white shadow-xs"
                      : "border border-[#cdeed7] bg-[#f5fdf8] text-[#166534] hover:bg-[#e5faed]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-[#cdeed7] bg-white p-8 text-center text-sm font-bold text-[#39634b]">
            No questions match this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((res) => {
              const badgeStyle =
                res.status === "correct"
                  ? "bg-[#dcfce7] text-[#166534] border-[#86efac]"
                  : res.status === "partial"
                  ? "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]"
                  : "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]";

              const statusLabel =
                res.status === "correct"
                  ? "Correct"
                  : res.status === "partial"
                  ? "Partially Correct"
                  : "Incorrect";

              return (
                <article
                  key={res.question.id}
                  className="rounded-3xl border-2 border-[#c8ecd5] bg-white p-5 shadow-xs sm:p-6"
                >
                  {/* Header */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f8ed] pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#0f3d24] px-3 py-1 text-xs font-extrabold text-white">
                        Question {res.examNumber}
                      </span>
                      <span className="rounded-full bg-[#eefbf2] px-3 py-1 text-xs font-extrabold text-[#15803d]">
                        {res.question.formatLabel}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-xs font-extrabold ${badgeStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <span className="rounded-full border border-[#bce8cc] bg-[#f4fdf7] px-3 py-1 text-xs font-extrabold text-[#0f3d24]">
                      Marks: {formatMark(res.earnedMarks)} / {formatMark(res.maxMarks)}
                    </span>
                  </div>

                  {/* Original question */}
                  <p className="mb-3 text-base font-extrabold text-[#0f3d24] sm:text-lg">
                    {res.question.instruction}
                  </p>

                  {res.question.stimuli && res.question.stimuli.length > 0 && (
                    <div className="mb-4">
                      <StimulusBlock stimuli={res.question.stimuli} compact />
                    </div>
                  )}

                  {/* Answers display */}
                  {res.subParts.length === 1 ? (
                    <div className="space-y-2 rounded-2xl border border-[#d9f3e2] bg-[#fafefb] p-4 text-sm">
                      {res.question.type === "single-choice" && (
                        <p className="font-extrabold text-[#0f3d24]">
                          {res.question.prompt}
                        </p>
                      )}
                      {res.question.type === "reorder" && (
                        <p className="font-bold text-[#39634b]">
                          Words: {res.question.words.join(" · ")}
                        </p>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div
                          className={`rounded-xl border p-3 ${
                            res.status === "correct"
                              ? "border-[#86efac] bg-[#eefcf3]"
                              : "border-[#fecaca] bg-[#fef2f2]"
                          }`}
                        >
                          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#39634b]">
                            Student Answer
                          </span>
                          <span className="mt-0.5 block font-extrabold text-[#0f3d24]">
                            {res.studentAnswerSummary}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#86efac] bg-[#eefcf3] p-3">
                          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#15803d]">
                            Correct Answer
                          </span>
                          <span className="mt-0.5 block font-extrabold text-[#0f3d24]">
                            {res.correctAnswerSummary}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {res.subParts.map((sp) => {
                        const cueImages =
                          res.question.type === "text-parts"
                            ? res.question.parts.find((p) => p.id === sp.id)?.cueImages
                            : undefined;

                        return (
                        <div
                          key={sp.id}
                          className={`rounded-2xl border p-3.5 text-sm ${
                            sp.isCorrect
                              ? "border-[#b9e8c9] bg-[#f4fdf7]"
                              : "border-[#fecaca] bg-[#fff7f7]"
                          }`}
                        >
                          {cueImages && cueImages.length > 0 && (
                            <div className="mb-2 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#d4f2df] bg-white px-2.5 py-1.5">
                              {cueImages.map((img, iIdx) => (
                                <img
                                  key={iIdx}
                                  src={img.src}
                                  alt={img.alt}
                                  loading="eager"
                                  className="h-11 w-auto rounded bg-white object-contain"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-extrabold text-[#0f3d24]">
                              {sp.label}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-[#166534] shadow-2xs">
                              {formatMark(sp.earnedMarks)} / {formatMark(sp.maxMarks)}{" "}
                              {sp.maxMarks === 1 ? "mark" : "marks"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs sm:text-sm">
                            <span>
                              <strong className="text-[#39634b]">
                                Student answer:
                              </strong>{" "}
                              <span
                                className={`font-extrabold ${
                                  sp.isCorrect
                                    ? "text-[#15803d]"
                                    : "text-[#b91c1c]"
                                }`}
                              >
                                {sp.studentAnswer}
                              </span>
                            </span>
                            <span>
                              <strong className="text-[#39634b]">
                                Correct answer:
                              </strong>{" "}
                              <span className="font-extrabold text-[#0f3d24]">
                                {sp.correctAnswer}
                              </span>
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation + Curriculum Source Reference */}
                  <div className="mt-4 space-y-2 rounded-2xl border border-[#d6f2e0] bg-[#f5fdf8] px-4 py-3 text-xs sm:text-sm">
                    <p className="font-semibold text-[#18432b]">
                      <strong className="font-extrabold text-[#15803d]">
                        Explanation:
                      </strong>{" "}
                      {res.question.explanation}
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5 border-t border-[#e1f5e8] pt-2 text-xs font-bold text-[#2f5f44]">
                      <BookMarked
                        className="h-3.5 w-3.5 shrink-0 text-[#22c55e]"
                        aria-hidden="true"
                      />
                      <span>
                        Source: {formatSourceReference(res.question.source)}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

import { useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudCheck,
  CloudUpload,
  Download,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { EXAM_TITLE, TOTAL_MARKS } from "@/config";
import { allProblems, lessons } from "@/content/problems";
import { formatMarks } from "@/exam/grading";
import {
  buildReportFilename,
  buildReportText,
  downloadTextReport,
  formatDurationArabic,
  formatTimestamp,
  QUESTION_STATUS_AR,
  SUBPART_STATUS_AR,
} from "@/exam/report";
import type { SendStatus } from "@/exam/submit";
import type { ExamAttempt, ExamResult } from "@/exam/types";
import type { AppTab } from "@/lib/site";
import { levelStyle, padAr } from "@/lib/format";
import { MathText, TeX } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { cn } from "@/utils/cn";

export function Results({
  attempt,
  result,
  sendStatus,
  onRetrySend,
  onStartOver,
  onNavigate,
}: {
  attempt: ExamAttempt;
  result: ExamResult;
  sendStatus: SendStatus;
  onRetrySend: () => void;
  onStartOver: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const problemById = new Map(allProblems.map((p) => [p.id, p]));

  const elapsedMs =
    attempt.elapsedMs ??
    (attempt.submittedAt
      ? Math.max(0, new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime())
      : 0);

  const handleDownloadTxt = () => {
    const text = buildReportText(attempt, result);
    downloadTextReport(text, buildReportFilename(attempt.studentName || "student"));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6">
      {/* Score Summary Hero */}
      <div className="teacher-hero">
        <div className="teacher-hero-grid" aria-hidden="true" />
        <div className="teacher-hero-orb teacher-hero-orb-a" aria-hidden="true" />
        <div className="teacher-hero-orb teacher-hero-orb-b" aria-hidden="true" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="teacher-badge">
              <Award className="size-3.5" aria-hidden="true" />
              النتيجة النهائية — {EXAM_TITLE}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-[#faf4ff] sm:text-4xl">
              {attempt.studentName}
            </h1>
            <p className="mt-1.5 text-xs text-[#e0b8c5]">
              وقت التسليم: {formatTimestamp(attempt.submittedAt ?? new Date().toISOString())} • المدة المستغرقة:{" "}
              <span dir="ltr">{formatDurationArabic(elapsedMs)}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleDownloadTxt} className="btn-primary">
                <Download className="size-4" aria-hidden="true" />
                تنزيل تقرير النتيجة (TXT)
              </button>
              <button type="button" onClick={onStartOver} className="teacher-lock-button">
                <RotateCcw className="size-3.5" aria-hidden="true" />
                محاولة جديدة
              </button>
              <button
                type="button"
                onClick={() => onNavigate("teacher")}
                className="teacher-lock-button"
              >
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                منطقة المعلم
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur lg:min-w-[240px]">
            <span className="block text-[11px] font-semibold text-[#f8c8db]">العلامة النهائية</span>
            <span className="mt-1 block text-4xl font-bold text-white" dir="ltr">
              {formatMarks(result.total)} / {TOTAL_MARKS}
            </span>
            <span className="mt-2 inline-block rounded-full bg-[#f1e6ff] px-3 py-1 text-xs font-bold text-[#301545]">
              {result.percentage}% — {result.gradeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Google Sheets Non-blocking Submission Status */}
      <div
        className={cn(
          "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-xs",
          sendStatus === "success"
            ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
            : sendStatus === "failed"
              ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
              : "border-[#e3cffb] bg-[#faf4ff] text-[#441b67]"
        )}
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          {sendStatus === "success" ? (
            <CloudCheck className="size-5 shrink-0" aria-hidden="true" />
          ) : sendStatus === "failed" ? (
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          ) : (
            <CloudUpload className="size-5 shrink-0 animate-pulse" aria-hidden="true" />
          )}
          <div>
            {sendStatus === "success" && (
              <p className="font-bold">تم إرسال نتيجتك إلى سجل المعلم بنجاح.</p>
            )}
            {sendStatus === "sending" && (
              <p className="font-bold">جاري إرسال النتيجة إلى المعلم في الخلفية...</p>
            )}
            {sendStatus === "idle" && (
              <p className="font-bold">تجهيز إرسال النتيجة إلى المعلم...</p>
            )}
            {sendStatus === "failed" && (
              <div>
                <p className="font-bold">تعذّر الإرسال التلقائي إلى سجل المعلم حاليًا.</p>
                <p className="mt-0.5 text-[11px]">
                  تم حفظ نتيجتك محليًا في هذا المتصفح لتُعاد محاولة إرسالها تلقائيًا عند توفر الاتصال، ويمكنك تنزيل ملف TXT فورًا.
                </p>
              </div>
            )}
          </div>
        </div>
        {sendStatus === "failed" && (
          <button
            type="button"
            onClick={onRetrySend}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f59e0b] bg-white px-3 py-1.5 text-xs font-bold text-[#92400e] transition hover:bg-[#fef3c7]"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            إعادة المحاولة الآن
          </button>
        )}
      </div>

      {/* 4 Question Status Counts */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="paper-card p-4">
          <span className="text-xs font-semibold text-[#1f7a4a]">مسائل صحيحة كاملة</span>
          <span className="mt-1 block text-2xl font-bold text-[#1f7a4a]">{result.questionCounts.correct}</span>
          <span className="text-[10px] text-[#743f76]">من أصل {result.questionCounts.total} مسألة</span>
        </div>
        <div className="paper-card p-4">
          <span className="text-xs font-semibold text-[#9a5700]">مسائل صحيحة جزئيًا</span>
          <span className="mt-1 block text-2xl font-bold text-[#9a5700]">{result.questionCounts.partial}</span>
          <span className="text-[10px] text-[#743f76]">حصلت على جزء من الدرجة</span>
        </div>
        <div className="paper-card p-4">
          <span className="text-xs font-semibold text-[#be123c]">مسائل خاطئة</span>
          <span className="mt-1 block text-2xl font-bold text-[#be123c]">{result.questionCounts.wrong}</span>
          <span className="text-[10px] text-[#743f76]">تحتاج إلى مراجعة</span>
        </div>
        <div className="paper-card p-4">
          <span className="text-xs font-semibold text-[#743f76]">مسائل غير مجابة</span>
          <span className="mt-1 block text-2xl font-bold text-[#743f76]">{result.questionCounts.unanswered}</span>
          <span className="text-[10px] text-[#743f76]">لم يُدخل فيها أي جواب</span>
        </div>
      </div>

      {/* Lesson Totals */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {result.lessons.map((l) => (
          <div key={l.lessonId} className="paper-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#301545]">{l.title}</h2>
              <span className="text-sm font-bold text-[#b81f68]" dir="ltr">
                {formatMarks(l.awarded)} / {l.max} ({l.percentage}%)
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#f9e3ec]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f472b6] to-[#9333ea]"
                style={{ width: `${Math.min(100, l.percentage)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#743f76]">
              صحيحة: {l.correctCount} • جزئية: {l.partialCount} • خاطئة: {l.wrongCount} • غير مجابة: {l.unansweredCount}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Problem-by-Problem Results */}
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-bold text-[#301545]">المراجعة التفصيلية للمسائل العشرين</h2>
        {result.questions.map((q, idx) => {
          const prob = problemById.get(q.problemId);
          const isOpen = expandedId === q.problemId;
          return (
            <article key={q.problemId} className="paper-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : q.problemId)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-right transition hover:bg-[#fff8fc]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#441b67] text-xs font-bold text-white" dir="ltr">
                    {padAr(idx + 1)}
                  </span>
                  <span className="text-sm font-bold text-[#301545]">{q.title}</span>
                  <span className="text-[11px] text-[#9c5469]">({lessons[q.lessonId].title})</span>
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1", levelStyle[q.level])}>
                    {q.level}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={cn("status-pill", `status-pill-${q.status}`)}>
                    {QUESTION_STATUS_AR[q.status]}
                  </span>
                  <span className="text-xs font-bold text-[#441b67]" dir="ltr">
                    {formatMarks(q.awarded)} / {q.max}
                  </span>
                  {isOpen ? <ChevronUp className="size-4 text-[#743f76]" /> : <ChevronDown className="size-4 text-[#743f76]" />}
                </div>
              </button>

              {isOpen && prob && (
                <div className="border-t border-[#f8c8db] bg-[#fff8fc] p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-3">
                      {prob.prompt.map((pText, pIdx) => (
                        <p key={pIdx} className="text-xs leading-7 text-[#441b67]">
                          <MathText text={pText} />
                        </p>
                      ))}

                      <div className="space-y-2">
                        {q.subparts.map((sp) => (
                          <div key={sp.spec.id} className="rounded-xl border border-[#f8c8db] bg-white p-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-[#301545]">{sp.spec.prompt}</span>
                              <span className={cn("status-pill", `status-pill-${sp.status}`)}>
                                {SUBPART_STATUS_AR[sp.status]} ({formatMarks(sp.awarded)}/{sp.max})
                              </span>
                            </div>
                            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              <div className="rounded-lg bg-[#fcf5f7] px-2.5 py-1.5">
                                <span className="text-[10px] text-[#9c5469]">إجابتك: </span>
                                <span className="font-bold text-[#301545]" dir="ltr">{sp.displayAnswer}</span>
                              </div>
                              <div className="rounded-lg bg-[#f0fdf4] px-2.5 py-1.5">
                                <span className="text-[10px] text-[#166534]">الإجابة الصحيحة: </span>
                                <span className="font-bold text-[#166534]" dir="ltr">{sp.spec.answerDisplay}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-[#e3cffb] bg-white p-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#612397]">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          خطوات الحل النموذجي
                        </span>
                        <ol className="mt-2 space-y-2">
                          {prob.solution.steps.map((st, sIdx) => (
                            <li key={st.title} className="text-[11.5px] leading-6 text-[#441b67]">
                              <strong>{sIdx + 1}. {st.title}:</strong> <MathText text={st.body} />
                            </li>
                          ))}
                        </ol>
                        <div className="mt-2 rounded-lg bg-[#faf4ff] p-2" dir="ltr">
                          <TeX tex={prob.solution.answer.tex} display />
                        </div>
                      </div>
                    </div>

                    <div>
                      <ProblemFigure spec={prob.figure} />
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

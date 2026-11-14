import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FinalGradingReport } from '../types/exam';
import { downloadReportFile } from '../utils/reportGenerator';
import { FormattedText } from './MathView';

interface ResultsDashboardProps {
  report: FinalGradingReport;
  onRetry: () => void;
  onOpenTeacher: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  report,
  onRetry,
  onOpenTeacher
}) => {
  useEffect(() => {
    // Launch celebratory confetti if score is high
    if (report.percentage >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [report.percentage]);

  const handleDownloadReport = () => {
    downloadReportFile(report);
  };

  const isExcellent = report.percentage >= 85;
  const isGood = report.percentage >= 60 && report.percentage < 85;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
      {/* Hero Score Card */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl sm:p-10">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-bold text-cyan-300">
            <span>🎓</span>
            تم الانتهاء من التقييم وتوليد التقرير بنجاح
          </div>

          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            لوحة نتائج التحدي الرياضي — MATHVERSE
          </h1>
          <p className="mt-1 text-base font-bold text-cyan-400">
            الطالب / الطالبة: {report.studentName}
          </p>

          {/* Big Score Display */}
          <div className="my-6 flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-[#070b14] px-8 py-6 shadow-inner sm:px-14 sm:py-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              الدرجة النهائية المكتسبة
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-black text-white sm:text-7xl" dir="ltr">
                {report.totalScore}
              </span>
              <span className="font-mono text-xl font-bold text-slate-500 sm:text-2xl" dir="ltr">
                / 100
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  isExcellent
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : isGood
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}
              >
                النسبة المئوية: {report.percentage}%
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-xs text-slate-300">
                الزمن: {report.elapsedDurationFormatted}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              <span>📄</span>
              « تنزيل التقرير TXT »
            </button>

            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <span>🔄</span>
              « إعادة المحاولة »
            </button>

            <button
              onClick={onOpenTeacher}
              className="flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-950/60 px-5 py-3 text-sm font-bold text-indigo-300 transition-colors hover:bg-indigo-900/60"
            >
              <span>🔒</span>
              بوابة المعلم والحلول النموذجية
            </button>
          </div>
        </div>
      </div>

      {/* Subject Breakdown & Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Algebra Subject Card */}
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-indigo-300">قسم الجبر</span>
            <span className="rounded bg-indigo-950 px-2 py-0.5 text-[11px] font-bold text-indigo-400">
              ALGEBRA
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-white" dir="ltr">
              {report.algebra.score} / {report.algebra.totalPossible}
            </span>
            <span className="font-mono text-sm font-bold text-indigo-400">
              {report.algebra.percentage}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              style={{ width: `${report.algebra.percentage}%` }}
            />
          </div>
        </div>

        {/* Geometry Subject Card */}
        <div className="rounded-2xl border border-teal-500/30 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-teal-300">قسم الهندسة</span>
            <span className="rounded bg-teal-950 px-2 py-0.5 text-[11px] font-bold text-teal-400">
              GEOMETRY
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-white" dir="ltr">
              {report.geometry.score} / {report.geometry.totalPossible}
            </span>
            <span className="font-mono text-sm font-bold text-teal-400">
              {report.geometry.percentage}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
              style={{ width: `${report.geometry.percentage}%` }}
            />
          </div>
        </div>

        {/* Correct Answers Count */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <span className="block text-xs font-bold text-slate-400">الإجابات الصحيحة</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-emerald-400">
              {report.counts.correct}
            </span>
            <span className="text-xs text-slate-400">فقرة صحيحة بالكامل</span>
          </div>
          <span className="mt-2 block text-xs text-slate-500">
            خاطئة: {report.counts.incorrect} | غير مجابة: {report.counts.unanswered}
          </span>
        </div>

        {/* Time Stamp Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <span className="block text-xs font-bold text-slate-400">توقيت التسليم المعتمد</span>
          <span className="mt-2 block font-mono text-xs font-bold text-slate-200" dir="ltr">
            {report.submissionTimeFormatted}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            المدة المستغرقة: {report.elapsedDurationFormatted}
          </span>
        </div>
      </div>

      {/* Question-By-Question Detailed Audit */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <h3 className="mb-4 text-base font-bold text-white sm:text-lg">
          سجل تدقيق الأداء سؤالاً بسؤال (15 سؤالاً)
        </h3>

        <div className="space-y-4">
          {report.questionResults.map(q => {
            const isFullyCorrect = q.earnedMarks === q.totalMarks;
            const isZero = q.earnedMarks === 0;

            return (
              <div
                key={q.questionId}
                className={`rounded-2xl border p-4 transition-all ${
                  isFullyCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : isZero
                    ? 'border-rose-500/30 bg-rose-950/20'
                    : 'border-amber-500/30 bg-amber-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                        isFullyCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : isZero
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {q.questionNumber}
                    </span>
                    <span className="text-sm font-bold text-white">{q.title}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400" dir="ltr">
                      {q.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {q.earnedMarks} / {q.totalMarks} علامة
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        isFullyCorrect
                          ? 'bg-emerald-950 text-emerald-300'
                          : isZero
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {isFullyCorrect ? 'مكتمل [كامل]' : isZero ? 'غير موفق' : 'جزئي'}
                    </span>
                  </div>
                </div>

                {/* Subparts details */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {q.subpartResults.map(sub => (
                    <div
                      key={sub.subpartId}
                      className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-2.5 text-xs"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-slate-300">فقرة ({sub.subpartNumber})</span>
                        <span
                          className={`font-mono font-bold ${
                            sub.status === 'correct'
                              ? 'text-emerald-400'
                              : sub.status === 'partial'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {sub.marksEarned} / {sub.marksAllocated}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <p className="truncate">
                          <span>إجابتك: </span>
                          <span className="font-mono text-slate-200">
                            <FormattedText text={sub.studentAnswer} />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

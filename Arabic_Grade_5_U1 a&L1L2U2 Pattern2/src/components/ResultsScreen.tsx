import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  KeyRound,
  ListChecks,
  Minus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { LESSONS } from "@/data/exam";
import {
  branchKindLabel,
  downloadTextReport,
  ExamResult,
  formatDateTime,
  formatDuration,
  formatScore,
  gradeLabel,
} from "@/lib/grading";
import { Brand } from "./Common";

type ResultsScreenProps = {
  studentName: string;
  result: ExamResult;
  submittedAt: Date;
  elapsedSeconds: number;
  onRetake: () => void;
  onOpenTeacherKey: () => void;
};

const statusStyles = {
  full: {
    label: "إجابة صحيحة",
    icon: Check,
    pill: "border-[#bcd9ce] bg-[#edf7f2] text-[#17664f]",
    border: "border-[#cfe4db]",
  },
  partial: {
    label: "علامة جزئية",
    icon: Minus,
    pill: "border-[#e7d3a1] bg-[#fcf4e2] text-[#8b692a]",
    border: "border-[#ead9b1]",
  },
  wrong: {
    label: "إجابة غير صحيحة",
    icon: X,
    pill: "border-[#eccfc8] bg-[#fbefec] text-[#984638]",
    border: "border-[#ead8d2]",
  },
};

const scoreMessage = (percentage: number): string => {
  if (percentage >= 90) return "أداء متميز يدل على إتقان جيد لمهارات الدروس الخمسة.";
  if (percentage >= 80) return "أداء جيد جدًا، وبقيت بعض المهارات تحتاج إلى تثبيت بسيط.";
  if (percentage >= 65) return "أداء جيد، وراجع الأخطاء والتعليلات لتقوية المهارات.";
  if (percentage >= 50) return "خطوات جيدة، ويحتاج بعض الدروس إلى مراجعة مركزة.";
  return "لا تيأس؛ راجع كل فرع وشرحه، ثم أعد المحاولة بعد المراجعة.";
};

export function ResultsScreen({
  studentName,
  result,
  submittedAt,
  elapsedSeconds,
  onRetake,
  onOpenTeacherKey,
}: ResultsScreenProps) {
  const [filter, setFilter] = useState<"all" | "review">("all");
  const circularRadius = 62;
  const circumference = 2 * Math.PI * circularRadius;
  const dashOffset = circumference - (Math.min(100, result.percentage) / 100) * circumference;

  const lessonStats = useMemo(
    () =>
      (Object.values(LESSONS) as (typeof LESSONS)[keyof typeof LESSONS][]).map((lesson) => {
        const questions = result.questions.filter((question) => question.question.lessonKey === lesson.key);
        const earned = Math.round(questions.reduce((sum, question) => sum + question.earned, 0) * 100) / 100;
        const max = questions.reduce((sum, question) => sum + question.max, 0);
        return {
          lesson,
          earned,
          max,
          questions: questions.length,
          percentage: max > 0 ? Math.round((earned / max) * 100) : 0,
        };
      }),
    [result.questions],
  );

  const reviewBranchesCount = result.wrongBranches + result.partialBranches;
  const visibleQuestions =
    filter === "all"
      ? result.questions
      : result.questions.filter((question) =>
          question.branchResults.some((branch) => !branch.full),
        );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#ded3c0]/80 bg-[#f9f5eb]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand compact />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#bcd9ce] bg-[#edf7f2] px-3 py-1.5 text-[10px] font-bold text-[#17664f] sm:flex">
              <CheckCircle2 className="h-3.5 w-3.5" />
              تم التسليم
            </span>
            <button
              type="button"
              onClick={onOpenTeacherKey}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0d3b35]/15 bg-[#0d3b35] px-3 py-1.5 text-[10px] font-bold text-[#f6efdf] transition hover:bg-[#124b44]"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#d9b873]" />
              <span className="hidden sm:inline">Teacher Answer Key</span>
              <span className="sm:hidden">المعلم</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-5 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-[#d9ceba] bg-[#fffdf8] shadow-[0_28px_80px_-56px_rgba(8,41,36,0.65)] animate-fade-up">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#0d3b35,#1f7a6a_55%,#c4a15a)]" />
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e9dcc1] bg-[#fbf5e8] px-3 py-1 text-[10px] font-bold text-[#8b692a]">
                  <Award className="h-3.5 w-3.5" />
                  النتيجة النهائية
                </span>
                <span className="rounded-full border border-[#d8e7df] bg-[#eef7f2] px-3 py-1 text-[10px] font-bold text-[#1f6f5e]">
                  {gradeLabel(result.percentage)}
                </span>
              </div>
              <h1 className="font-display text-2xl font-extrabold leading-9 text-[#0d3b35] sm:text-3xl">
                عمل رائع، {studentName}
              </h1>
              <p className="mt-2 max-w-xl text-[12px] leading-7 text-[#66736e]">
                {scoreMessage(result.percentage)} فيما يأتي مراجعة كاملة لكل سؤال وفرع، مع
                إجابتك والإجابة الصحيحة والعلامة والشرح والمرجع.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#e9e0d0] bg-[#fbf8f0] px-3 py-2.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#9b7938]" />
                  <div>
                    <p className="text-[8.5px] font-semibold text-[#8b948f]">وقت التسليم</p>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-[#3d5851]">
                      {formatDateTime(submittedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#e9e0d0] bg-[#fbf8f0] px-3 py-2.5">
                  <Clock3 className="h-4 w-4 shrink-0 text-[#9b7938]" />
                  <div>
                    <p className="text-[8.5px] font-semibold text-[#8b948f]">الوقت المستغرق</p>
                    <p className="number-tabular mt-0.5 text-[10.5px] font-semibold text-[#3d5851]">
                      {formatDuration(elapsedSeconds)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative grid place-items-center">
                <svg
                  className="score-ring h-44 w-44 -rotate-90"
                  viewBox="0 0 160 160"
                  role="img"
                  aria-label={`النتيجة ${formatScore(result.score)} من ${result.max}`}
                >
                  <defs>
                    <linearGradient id="score-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0d3b35" />
                      <stop offset="65%" stopColor="#1f7a6a" />
                      <stop offset="100%" stopColor="#c4a15a" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r={circularRadius} fill="none" stroke="#ece4d6" strokeWidth="10" />
                  <circle
                    cx="80"
                    cy="80"
                    r={circularRadius}
                    fill="none"
                    stroke="url(#score-gradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-4xl font-extrabold leading-none text-[#0d3b35]">
                    {formatScore(result.score)}
                  </span>
                  <span className="mt-1 text-[10px] font-medium text-[#8b948f]">من {result.max}</span>
                  <span className="mt-2 rounded-full bg-[#f4ecdb] px-2.5 py-0.5 text-[9px] font-bold text-[#8b692a]">
                    {formatScore(result.percentage)}%
                  </span>
                </div>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[9.5px] font-semibold text-[#7b8782]">
                <ShieldCheck className="h-3 w-3 text-[#1f7a6a]" />
                محاولة مكتملة ومحفوظة في السجل
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-[#eee6d8] bg-[#fbf8f0] sm:grid-cols-5">
            {[
              {
                label: "إجابات صحيحة",
                value: result.fullBranches,
                icon: CheckCircle2,
                color: "text-[#17664f]",
              },
              {
                label: "إجابات خاطئة",
                value: result.wrongBranches,
                icon: X,
                color: "text-[#984638]",
              },
              {
                label: "علامات جزئية",
                value: result.partialBranches,
                icon: Minus,
                color: "text-[#946c1c]",
              },
              {
                label: "النسبة المئوية",
                value: `${formatScore(result.percentage)}%`,
                icon: TrendingUp,
                color: "text-[#1f6f5e]",
              },
              {
                label: "الفروع الكلية",
                value: result.totalBranches,
                icon: ListChecks,
                color: "text-[#3d5851]",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="border-[#eee6d8] px-3 py-3.5 text-center sm:border-l sm:last:border-l-0">
                  <Icon className={`mx-auto h-4 w-4 ${stat.color}`} />
                  <p className={`number-tabular mt-1 font-display text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-[#7b8782]">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              downloadTextReport(studentName, result, submittedAt, elapsedSeconds)
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0d3b35] px-4 py-3 text-[12px] font-bold text-[#fff8e7] shadow-sm transition hover:bg-[#124c44]"
          >
            <Download className="h-4 w-4 text-[#d9b873]" />
            تنزيل تقرير TXT
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#d8cdb9] bg-[#fffdf8] px-4 py-3 text-[12px] font-bold text-[#41544f] transition hover:border-[#1f7a6a]/40 hover:bg-white"
          >
            <RotateCcw className="h-4 w-4 text-[#1f7a6a]" />
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#d8cdb9] bg-[#fffdf8] px-4 py-3 text-[12px] font-bold text-[#41544f] transition hover:border-[#c4a15a]/50 hover:bg-white"
          >
            <KeyRound className="h-4 w-4 text-[#9b7938]" />
            Teacher Answer Key
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9.5px] font-medium text-[#8a948f]">
          <FileText className="h-3 w-3" />
          التقرير النصي بترميز UTF-8 ويتضمن جميع الفروع والعلامات والتعليلات والمراجع.
        </p>

        <section className="mt-6 animate-fade-up delay-1">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#9b7938]">
                <Target className="h-3.5 w-3.5" />
                تحليل النتيجة
              </p>
              <h2 className="font-display text-xl font-bold text-[#0d3b35]">الأداء حسب الدرس</h2>
            </div>
            <p className="text-[9.5px] font-medium text-[#8a948f]">
              لكل درس ثلاثة أسئلة رئيسية ضمن النطاق الموثق
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {lessonStats.map((stat) => (
              <div key={stat.lesson.key} className="soft-card rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-display text-[10.5px] font-bold text-[#173f39]">
                    {stat.lesson.shortTitle}
                  </p>
                  <span className="number-tabular shrink-0 rounded-md bg-[#f4ecdb] px-1.5 py-0.5 text-[9px] font-bold text-[#8b692a]">
                    {stat.percentage}%
                  </span>
                </div>
                <p className="mt-0.5 text-[8.5px] text-[#8a948f]">
                  {stat.lesson.unit} · {stat.questions} أسئلة
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe4d7]">
                  <div
                    className={`h-full rounded-full ${
                      stat.percentage >= 75
                        ? "bg-[#1f7a6a]"
                        : stat.percentage >= 50
                          ? "bg-[#c4a15a]"
                          : "bg-[#b76a5d]"
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <p className="number-tabular mt-1.5 text-[9px] font-semibold text-[#68756f]">
                  {formatScore(stat.earned)} / {stat.max} علامة
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#9b7938]">
                <BookOpen className="h-3.5 w-3.5" />
                المراجعة التعليمية
              </p>
              <h2 className="font-display text-xl font-bold text-[#0d3b35]">مراجعة مفصلة لكل سؤال وفرع</h2>
              <p className="mt-1 text-[10.5px] leading-6 text-[#7b8782]">
                {result.totalBranches} فرعًا · {result.fullBranches} صحيحة · {result.wrongBranches} خاطئة ·{" "}
                {result.partialBranches} بعلامة جزئية
              </p>
            </div>
            <div className="flex rounded-lg border border-[#ded4c1] bg-[#f3eee3] p-0.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
                className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${
                  filter === "all"
                    ? "bg-[#fffdf8] text-[#0d3b35] shadow-sm"
                    : "text-[#75827c] hover:text-[#0d3b35]"
                }`}
              >
                جميع الفروع ({result.totalBranches})
              </button>
              <button
                type="button"
                onClick={() => setFilter("review")}
                aria-pressed={filter === "review"}
                className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${
                  filter === "review"
                    ? "bg-[#fffdf8] text-[#0d3b35] shadow-sm"
                    : "text-[#75827c] hover:text-[#0d3b35]"
                }`}
              >
                تحتاج مراجعة ({reviewBranchesCount})
              </button>
            </div>
          </div>

          {visibleQuestions.length === 0 ? (
            <div className="soft-card rounded-2xl px-6 py-12 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#eef7f2] text-[#1f7a6a]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-display text-base font-bold text-[#0d3b35]">لا توجد فروع تحتاج مراجعة</p>
              <p className="mt-1 text-[11px] text-[#7b8782]">أجبت عن جميع الفروع إجابة صحيحة كاملة.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleQuestions.map((questionResult) => {
                const { question, lesson } = questionResult;
                const reviewOnly = filter === "review";
                const branchResults = reviewOnly
                  ? questionResult.branchResults.filter((branch) => !branch.full)
                  : questionResult.branchResults;
                const allFull = questionResult.fullBranches === questionResult.branchResults.length;
                return (
                  <article
                    key={question.id}
                    className="overflow-hidden rounded-2xl border border-[#e0d6c5] bg-[#fffdf8] shadow-[0_18px_50px_-44px_rgba(8,41,36,0.6)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee6d8] bg-[#fbf8f0] px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0d3b35] font-display text-[11px] font-bold text-[#efdcb0]">
                          {question.number}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-[12.5px] font-bold text-[#123f39]">
                            {question.title}
                          </h3>
                          <p className="mt-0.5 truncate text-[9px] font-medium text-[#8a948f]">
                            {lesson.unit} — {lesson.title} ({lesson.pages})
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                            allFull
                              ? "border-[#bcd9ce] bg-[#edf7f2] text-[#17664f]"
                              : "border-[#e7d3a1] bg-[#fcf4e2] text-[#8b692a]"
                          }`}
                        >
                          {questionResult.fullBranches}/{questionResult.branchResults.length} صحيحة
                        </span>
                        <span className="number-tabular rounded-full border border-[#e5dccb] bg-white px-2 py-0.5 text-[9px] font-bold text-[#5e6c67]">
                          {formatScore(questionResult.earned)} / {questionResult.max}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 p-3.5 sm:p-4">
                      {branchResults.map((branchResult) => {
                        const status = branchResult.full
                          ? statusStyles.full
                          : branchResult.partial
                            ? statusStyles.partial
                            : statusStyles.wrong;
                        const StatusIcon = status.icon;
                        const originalIndex = questionResult.branchResults.findIndex(
                          (candidate) => candidate.branch.id === branchResult.branch.id,
                        );
                        return (
                          <div
                            key={branchResult.branch.id}
                            className={`rounded-xl border ${status.border} bg-white p-3.5 sm:p-4`}
                          >
                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-2">
                                <span className="mt-0.5 rounded bg-[#f4ecdb] px-1.5 py-0.5 text-[9px] font-bold text-[#8b692a]">
                                  {question.number}.{originalIndex + 1}
                                </span>
                                <div>
                                  <p className="text-[12px] font-semibold leading-6 text-[#23443d] sm:text-[12.5px]">
                                    {branchResult.branch.prompt}
                                  </p>
                                  <span className="mt-1 inline-block rounded bg-[#f6f2e9] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#7b8782]">
                                    {branchKindLabel(branchResult.branch)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8.5px] font-bold ${status.pill}`}>
                                  <StatusIcon className="h-2.5 w-2.5" strokeWidth={3} />
                                  {status.label}
                                </span>
                                <span className="number-tabular rounded-full border border-[#e5dccb] bg-[#fbf8f0] px-2 py-0.5 text-[8.5px] font-bold text-[#5e6c67]">
                                  {formatScore(branchResult.earned)} / {formatScore(branchResult.max)}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="rounded-lg border border-[#ece4d6] bg-[#fbf8f1] p-2.5">
                                <p className="mb-1 text-[8.5px] font-bold tracking-wide text-[#8a948f]">
                                  إجابتك
                                </p>
                                <p className="text-[11.5px] leading-6 text-[#3d5851]">{branchResult.studentText}</p>
                              </div>
                              <div className="rounded-lg border border-[#cfe4db] bg-[#f2f9f5] p-2.5">
                                <p className="mb-1 flex items-center gap-1 text-[8.5px] font-bold tracking-wide text-[#1f7a6a]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  الإجابة الصحيحة
                                </p>
                                <p className="text-[11.5px] leading-6 text-[#14533f]">{branchResult.correctText}</p>
                              </div>
                            </div>

                            {branchResult.details.length > 0 && (
                              <div className="mt-2 overflow-x-auto rounded-lg border border-[#eee6d8]">
                                <table className="w-full min-w-[420px] border-collapse text-right">
                                  <thead>
                                    <tr className="bg-[#f8f3e8] text-[8.5px] font-bold text-[#7a6a4e]">
                                      <th className="px-2 py-1.5 font-bold">العنصر</th>
                                      <th className="px-2 py-1.5 font-bold">إجابتك</th>
                                      <th className="px-2 py-1.5 font-bold">الصحيح</th>
                                      <th className="px-2 py-1.5 font-bold">النتيجة</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#f0ebe1]">
                                    {branchResult.details.map((detail, detailIndex) => (
                                      <tr key={`${branchResult.branch.id}-${detailIndex}`} className="text-[9.5px] text-[#52635d]">
                                        <td className="px-2 py-1.5 font-semibold">{detail.label}</td>
                                        <td className="px-2 py-1.5">{detail.actual}</td>
                                        <td className="px-2 py-1.5 text-[#1f6f5e]">{detail.expected}</td>
                                        <td className="px-2 py-1.5">
                                          <span className={`inline-flex items-center gap-0.5 font-bold ${detail.correct ? "text-[#1f7a6a]" : "text-[#984638]"}`}>
                                            {detail.correct ? (
                                              <Check className="h-3 w-3" strokeWidth={3} />
                                            ) : (
                                              <X className="h-3 w-3" strokeWidth={3} />
                                            )}
                                            {detail.correct ? "صحيح" : "خطأ"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="mt-2 rounded-lg border border-[#e9e0cf] bg-[#fbf8f0] px-2.5 py-2">
                              <p className="text-[10.5px] leading-6 text-[#5e6c67]">
                                <span className="font-bold text-[#8b692a]">التعليل: </span>
                                {branchResult.explanation}
                              </p>
                              <p className="mt-1 flex items-start gap-1 text-[8.5px] leading-5 text-[#8a948f]">
                                <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-[#9b7938]" />
                                {branchResult.ref}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cdb9] bg-[#0d3b35] p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#d9b873]">
                <Sparkles className="h-3.5 w-3.5" />
                خطوتك التالية
              </p>
              <h2 className="font-display text-lg font-bold text-[#fff8e8]">
                راجع ثم أعد المحاولة
              </h2>
              <p className="mt-1.5 max-w-xl text-[10.5px] leading-6 text-[#c9d9d2]">
                تقرير TXT يحفظ النتيجة كاملة للمعلم أو ولي الأمر. أما «إعادة المحاولة» فتبدأ
                محاولة جديدة باسم جديد، وتعيد ضبط المؤقت والإجابات.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => downloadTextReport(studentName, result, submittedAt, elapsedSeconds)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fff8e7] px-4 py-2.5 text-[11px] font-bold text-[#0d3b35] transition hover:bg-white"
              >
                <Download className="h-3.5 w-3.5" />
                تنزيل تقرير TXT
              </button>
              <button
                type="button"
                onClick={onRetake}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#fff8e7]/25 bg-white/[0.06] px-4 py-2.5 text-[11px] font-bold text-[#fff8e7] transition hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-[#8a948f]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1f7a6a]" />
            نطاق موثّق من الدروس الخمسة، مع استبعاد الأقسام المستثناة.
          </span>
          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="flex items-center gap-1.5 font-semibold text-[#8b692a] transition hover:text-[#0d3b35]"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Teacher Answer Key
          </button>
        </footer>
      </main>
    </div>
  );
}

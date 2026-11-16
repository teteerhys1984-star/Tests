import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Lightbulb,
  MinusCircle,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import type { AttemptState } from "@/lib/storage";
import { elapsedMs } from "@/lib/storage";
import { formatDateTime, formatHMS } from "@/lib/time";
import { buildReport, downloadReport } from "@/lib/report";
import { EXAM_SUBTITLE, EXAM_TITLE } from "@/exam/questions";

interface Props {
  attempt: AttemptState & { result: NonNullable<AttemptState["result"]>; finishedAt: number };
  onRetake: () => void;
}

function gradeWord(percentage: number): string {
  if (percentage >= 90) return "Outstanding Explorer";
  if (percentage >= 75) return "Great Navigator";
  if (percentage >= 60) return "Solid Traveller";
  if (percentage >= 50) return "Rising Explorer";
  return "Keep Discovering";
}

export function ResultsScreen({ attempt, onRetake }: Props) {
  const { result } = attempt;
  const timeTaken = formatHMS(elapsedMs(attempt));

  const scoreDeg = (result.percentage / 100) * 360;

  const handleDownload = () => {
    const text = buildReport({
      studentName: attempt.studentName,
      result,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
    });
    downloadReport(text, attempt.studentName);
  };

  return (
    <main className="rise-in relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-8 sm:px-6">
      {/* Hero score panel */}
      <div className="navy-panel overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            {/* score ring */}
            <div
              className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#c99b3c ${scoreDeg}deg, #233a63 ${scoreDeg}deg)`,
              }}
            >
              <div className="flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-[#101f38]">
                <span className="font-display text-4xl font-bold text-[#f4eedd]">{result.score}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fa1bc]">
                  / {result.total}
                </span>
              </div>
            </div>
            <div>
              <p className="chip mb-2 inline-flex border border-[#c99b3c]/35 bg-[#c99b3c]/10 px-3 py-1 text-[#e6c877]">
                <Award className="h-3.5 w-3.5" /> {gradeWord(result.percentage)}
              </p>
              <h1 className="font-display text-3xl font-semibold text-[#f4eedd]">Exam Complete</h1>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-[#9fb0c9]">
                {EXAM_TITLE} — {EXAM_SUBTITLE}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-2.5 text-sm">
            {[
              { icon: <User className="h-4 w-4" />, label: "Student", value: attempt.studentName },
              { icon: <CalendarDays className="h-4 w-4" />, label: "Submitted", value: formatDateTime(attempt.finishedAt) },
              { icon: <Clock3 className="h-4 w-4" />, label: "Time taken", value: timeTaken },
              { icon: <Award className="h-4 w-4" />, label: "Percentage", value: `${result.percentage}%` },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-[#e9e0c9]/12 bg-[#0e2038]/70 px-3.5 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8fa1bc]">
                  <span className="text-[#c99b3c]">{f.icon}</span> {f.label}
                </p>
                <p className="truncate font-semibold text-[#f4eedd]" title={f.value}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* correct / partial / incorrect strip */}
        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#34d399]/25 bg-[#0f766e]/15 px-4 py-3 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-[#34d399]" />
            <p className="text-2xl font-bold text-[#7fd6c9]">{result.fullyCorrect}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5fa999]">Fully correct</p>
          </div>
          <div className="rounded-xl border border-[#e6c877]/25 bg-[#c99b3c]/10 px-4 py-3 text-center">
            <MinusCircle className="mx-auto mb-1 h-5 w-5 text-[#e6c877]" />
            <p className="text-2xl font-bold text-[#e6c877]">{result.partiallyCorrect}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#b9a05e]">Partially correct</p>
          </div>
          <div className="rounded-xl border border-[#f87171]/25 bg-[#b45309]/15 px-4 py-3 text-center">
            <XCircle className="mx-auto mb-1 h-5 w-5 text-[#f87171]" />
            <p className="text-2xl font-bold text-[#fca5a5]">{result.incorrect}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#c98a8a]">Incorrect</p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleDownload} className="btn btn-brass flex-1 px-6 py-3.5 text-base">
            <Download className="h-5 w-5" /> Download Exam Report
          </button>
          <button onClick={onRetake} className="btn btn-navy px-6 py-3.5 text-base">
            <RotateCcw className="h-4 w-4" /> Retake Exam
          </button>
        </div>
      </div>

      {/* Detailed results */}
      <h2 className="mt-10 mb-4 font-display text-2xl font-semibold text-[#f4eedd]">
        Detailed Results — All 20 Questions
      </h2>
      <div className="space-y-4">
        {result.questions.map((q) => (
          <details key={q.n} className="paper-card group rounded-2xl" open={q.earned < q.possible}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white ${
                  q.earned === q.possible
                    ? "bg-[#0f766e]"
                    : q.earned === 0
                      ? "bg-[#b45309]"
                      : "bg-[#b3872e]"
                }`}
              >
                {q.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-[#152a47] sm:text-lg">
                  {q.title}
                </p>
                <p className="text-xs text-slate-500">
                  {q.lesson === 3 ? "Lesson 3 · Let's Discover" : "Lesson 4 · Interesting Destinations"} · {q.skill}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  q.earned === q.possible
                    ? "bg-[#0f766e]/12 text-[#0b5a54]"
                    : q.earned === 0
                      ? "bg-[#b45309]/12 text-[#93480a]"
                      : "bg-[#b3872e]/12 text-[#7c6117]"
                }`}
              >
                {q.earned} / {q.possible} marks
              </span>
            </summary>

            <div className="border-t border-[#e3d9c0] px-4 pb-5 pt-4 sm:px-5">
              <div className="space-y-3">
                {q.parts.map((p) => (
                  <div key={p.partId} className="rounded-xl border border-[#eee5cf] bg-white/70 p-4">
                    <p className="text-sm font-semibold leading-relaxed text-slate-800">{p.prompt}</p>
                    <div className="mt-2.5 grid gap-2 text-sm sm:grid-cols-2">
                      <div
                        className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
                          p.correct ? "bg-[#0f766e]/8 text-[#0b5a54]" : "bg-[#b45309]/8 text-[#93480a]"
                        }`}
                      >
                        {p.correct ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span>
                          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                            Your answer
                          </span>
                          {p.studentAnswer}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-[#b3872e]/8 px-3 py-2 text-[#6f5512]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                            Correct answer
                          </span>
                          {p.correctAnswer}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2.5 flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#b3872e]" />
                      {p.explanation}
                      <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {p.earned}/{p.possible}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-[#152a47]/5 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-600">
                <span className="font-semibold text-[#152a47]">Question note: </span>
                {q.explanation}
              </p>
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}

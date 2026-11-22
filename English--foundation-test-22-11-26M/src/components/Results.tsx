import { useEffect, useMemo, useState } from "react";
import mascotUrl from "@/assets/mascot.jpg";
import type { LessonId, MainQuestion } from "@/data/exam";
import { lessonLabel } from "@/data/lessons";
import { answerDisplay, correctDisplay, type ExamResult } from "@/lib/grading";
import { formatDateTime, formatDuration, subLetter } from "@/lib/format";
import { buildReport, downloadTextFile, reportFileName } from "@/lib/report";
import type { Attempt } from "@/lib/storage";
import { cn } from "@/utils/cn";
import { Footer } from "./Footer";
import { Button, Card, Icon, Pill, RichText, type IconName, type Tone } from "./ui";

type Props = {
  attempt: Attempt;
  questions: MainQuestion[];
  result: ExamResult;
  onRestart: () => void;
  onTeacher: () => void;
};

function messageFor(percentage: number): { headline: string; note: string } {
  if (percentage >= 90) return { headline: "Outstanding work!", note: "You know this material really well." };
  if (percentage >= 75) return { headline: "Great job!", note: "You are strong. Review the few parts you missed." };
  if (percentage >= 50) return { headline: "Good effort!", note: "Read the explanations below to see where you can improve." };
  return { headline: "Keep practising!", note: "Go through every explanation below and try again." };
}

function Stat({
  icon,
  label,
  value,
  className,
}: {
  icon: IconName;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border-2 border-line bg-white p-3", className)}>
      <p className="flex min-h-8 items-center gap-1.5 text-xs font-extrabold text-muted uppercase">
        <Icon name={icon} className="hidden h-4 w-4 sm:block" />
        {label}
      </p>
      <p className="num mt-1 break-words text-lg leading-snug font-black text-ink">{value}</p>
    </div>
  );
}

export function Results({ attempt, questions, result, onRestart, onTeacher }: Props) {
  const submittedAt = attempt.submittedAt ?? Date.now();
  const elapsed = Math.max(0, submittedAt - attempt.startedAt);
  const percentage = result.percentage;
  const { headline, note } = messageFor(percentage);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const byLesson = useMemo(() => {
    const map = new Map<LessonId, { earned: number; max: number; numbers: number[] }>();
    questions.forEach((question, i) => {
      const rq = result.questions[i];
      const entry = map.get(question.lesson) ?? { earned: 0, max: 0, numbers: [] };
      entry.earned += rq?.earned ?? 0;
      entry.max += rq?.max ?? 0;
      entry.numbers.push(question.id);
      map.set(question.lesson, entry);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [questions, result]);

  const handleDownload = () => {
    const text = buildReport({
      studentName: attempt.studentName,
      startedAt: attempt.startedAt,
      submittedAt,
      result,
      questions,
      answers: attempt.answers,
    });
    downloadTextFile(text, reportFileName(attempt.studentName));
  };

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const ringColor =
    percentage >= 75 ? "var(--color-ocean)" : percentage >= 50 ? "var(--color-sun)" : "var(--color-coral)";

  return (
    <div className="flex min-w-0 flex-col">
      <main className="wrap flex-1 py-6 sm:py-10">
        <header className="text-center">
          <img
            src={mascotUrl}
            alt=""
            width={96}
            height={96}
            className="pop-in mx-auto h-24 w-24 rounded-full border-4 border-sun bg-white"
          />
          <h1 className="mt-3 text-3xl leading-tight font-black text-ink sm:text-4xl">{headline}</h1>
          <p className="mx-auto mt-2 max-w-md text-base font-semibold text-muted">{note}</p>
        </header>

        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative shrink-0" role="img" aria-label={`Score ${result.total} out of ${result.max}`}>
              <svg viewBox="0 0 120 120" className="h-36 w-36 sm:h-40 sm:w-40">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={animate ? circumference * (1 - result.total / result.max) : circumference}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 900ms ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="num text-4xl leading-none font-black text-ink">{result.total}</span>
                <span className="num mt-1 text-sm font-extrabold text-muted">/ {result.max}</span>
              </div>
            </div>
            <div className="grid w-full min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon="user" label="Student" value={attempt.studentName} className="col-span-2" />
              <Stat icon="flag" label="Completed" value={formatDateTime(submittedAt)} className="col-span-2" />
              <Stat icon="clock" label="Time taken" value={formatDuration(elapsed)} />
              <Stat icon="target" label="Percentage" value={`${percentage}%`} />
              <Stat icon="check" label="Correct" value={String(result.correctCount)} />
              <Stat icon="x" label="Incorrect" value={String(result.incorrectCount)} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="lg" className="sm:flex-1" onClick={handleDownload}>
              <Icon name="download" />
              Download Report
            </Button>
            <Button variant="secondary" size="lg" className="sm:flex-1" onClick={onRestart}>
              <Icon name="refresh" />
              Start a New Exam
            </Button>
          </div>
        </Card>

        <section className="mt-8" aria-labelledby="by-topic-title">
          <h2 id="by-topic-title" className="text-2xl font-black text-ink">
            Score by topic
          </h2>
          <ul className="mt-3 space-y-2">
            {byLesson.map(([lesson, summary]) => {
              const ratio = summary.max > 0 ? summary.earned / summary.max : 0;
              const tone: Tone = ratio >= 0.75 ? "grass" : ratio >= 0.5 ? "sun" : "coral";
              return (
                <li key={lesson} className="rounded-2xl border-2 border-line bg-white p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 text-base font-extrabold text-ink">
                      {lessonLabel(lesson)}
                    </p>
                    <Pill tone={tone}>
                      <span className="num">
                        {summary.earned} / {summary.max}
                      </span>
                    </Pill>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-line bg-paper">
                    <div
                      className="h-full rounded-full bg-ocean"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                  <p className="num mt-2 text-sm font-semibold text-muted">
                    Questions {summary.numbers.join(", ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="breakdown-title">
          <h2 id="breakdown-title" className="text-2xl font-black text-ink">
            Question by question
          </h2>
          <p className="mt-1 text-base font-semibold text-muted">
            Your answer, the correct answer and the reason for every part.
          </p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Jump to a question">
            {questions.map((question, i) => {
              const rq = result.questions[i];
              const perfect = rq ? rq.earned === rq.max : false;
              return (
                <a
                  key={question.id}
                  href={`#question-${question.id}`}
                  className={cn(
                    "num inline-flex h-11 shrink-0 items-center gap-1 rounded-xl border-2 px-3 text-sm font-extrabold no-underline transition-colors",
                    perfect
                      ? "border-grass/60 bg-grass-soft text-grass-dark"
                      : "border-sun bg-sun-soft text-ink",
                    "hover:brightness-95",
                  )}
                >
                  Q{question.id}
                  <span className="text-muted">
                    {rq?.earned}/{rq?.max}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="mt-4 space-y-5">
            {questions.map((question, i) => {
              const rq = result.questions[i];
              if (!rq) return null;
              const tone: Tone = rq.earned === rq.max ? "grass" : rq.earned === 0 ? "coral" : "sun";
              return (
                <Card key={question.id} id={`question-${question.id}`} className="scroll-mt-4 p-4 sm:p-6">
                  <header className="flex flex-wrap items-center gap-3">
                    <div
                      className="order-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-sun-dark bg-sun text-xl font-black text-ink"
                      aria-hidden="true"
                    >
                      {question.id}
                    </div>
                    <div className="order-3 min-w-0 basis-full sm:order-2 sm:basis-0 sm:flex-1">
                      <h3 className="text-lg leading-tight font-black text-ink sm:text-xl">
                        Question {question.id}: {question.title}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-ocean-dark">{lessonLabel(question.lesson)}</p>
                      <p className="text-sm font-semibold text-muted">Skill: {question.skill}</p>
                    </div>
                    <Pill tone={tone} className="order-2 ml-auto sm:order-3 sm:ml-0">
                      <span className="num">
                        {rq.earned} / {rq.max} marks
                      </span>
                    </Pill>
                  </header>

                  <ol className="mt-4 space-y-3">
                    {question.subs.map((sub, subIndex) => {
                      const rs = rq.subs[subIndex];
                      const correct = rs?.correct ?? false;
                      return (
                        <li
                          key={sub.id}
                          className={cn(
                            "rounded-2xl border-2 p-3 sm:p-4",
                            correct ? "border-grass/50 bg-grass-soft/50" : "border-coral/50 bg-coral-soft/50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white",
                                correct ? "bg-grass-dark" : "bg-coral-dark",
                              )}
                            >
                              <Icon name={correct ? "check" : "x"} className="h-4 w-4" />
                            </span>
                            <p className="min-w-0 flex-1 text-base leading-snug font-bold text-ink">
                              <span className="text-muted">({subLetter(subIndex)})</span>{" "}
                              <RichText text={sub.prompt} />
                            </p>
                            <span className="num shrink-0 text-sm font-extrabold text-ink">
                              {rs?.earned ?? 0} / {rs?.max ?? 1}
                            </span>
                          </div>

                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border-2 border-line bg-white p-2">
                              <dt className="text-xs font-extrabold tracking-wide text-muted uppercase">
                                Your answer
                              </dt>
                              <dd className="break-words font-bold text-ink">
                                {answerDisplay(attempt.answers[sub.id])}
                              </dd>
                            </div>
                            <div className="rounded-xl border-2 border-line bg-white p-2">
                              <dt className="text-xs font-extrabold tracking-wide text-muted uppercase">
                                Correct answer
                              </dt>
                              <dd className="break-words font-bold text-ink">
                                {correctDisplay(sub)}
                              </dd>
                            </div>
                          </dl>

                          <p className="mt-3 text-sm leading-relaxed font-semibold text-ink sm:text-base">
                            <strong className="font-extrabold">Why: </strong>
                            {sub.explanation}
                          </p>
                          <p className="num mt-2 text-xs font-extrabold tracking-wide text-muted uppercase">
                            Marks earned: {rs?.earned ?? 0} · Maximum: {rs?.max ?? 1}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
      <Footer onTeacher={onTeacher} />
    </div>
  );
}

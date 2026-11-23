/**
 * شاشة الاختبار — نفس تركيبة شاشة الأسئلة في المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/QuizScreen.tsx):
 * ترويسة لاصقة بالعنوان والمؤقّت وزر الصوت، شريط تقدّم، بطاقة السؤال
 * بعنوانه وشارة علاماته، فروعه بحروفها، وشريط سفلي لاصق بأزرار التنقّل
 * وأزرار فهرس الأسئلة.
 *
 * الفرق الوظيفي الوحيد عن المصدر: زر «تسليم الاختبار» يفتح صفحة المراجعة
 * أولاً (وظيفة مطلوبة في هذه النسخة)، والتسليم الفعلي يتم من صفحة المراجعة.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../exam/types";
import { DataTable, Figure } from "../exam/figures";
import { PartView } from "../components/AnswerWidgets";
import { MixedText } from "../lib/mathx";
import {
  isInputComplete,
  isQuestionComplete,
  progressOf,
  type Responses,
} from "../lib/grading";
import { questionMaxMarks } from "../lib/marks";
import { num } from "../lib/time";
import { cn } from "../utils/cn";
import { Button, Card, MarkBadge } from "../components/ui";

function VolumeOnIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VolumeOffIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  );
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronRightIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function hasAnyAnswer(input: Question["parts"][number]["inputs"][number], answers: Responses): boolean {
  switch (input.kind) {
    case "choice":
    case "text":
      return !!(answers[input.id] && answers[input.id].trim());
    case "tf":
      return !!(answers[`${input.id}:verdict`] || answers[`${input.id}:correction`]);
    case "number":
      return !!(answers[`${input.id}:value`] || answers[`${input.id}:unit`] || answers[`${input.id}:steps`]);
    case "matrix":
      return input.rows.some((row) => !!answers[`${input.id}:${row.id}`]);
  }
}

export function Exam({
  studentName,
  questions,
  answers,
  setAnswer,
  elapsedMs,
  totalParts,
  initialIndex,
  onNavigate,
  onReview,
  muted,
  onToggleMute,
}: {
  studentName: string;
  questions: Question[];
  answers: Responses;
  setAnswer: (field: string, value: string) => void;
  elapsedMs: string;
  totalParts: number;
  initialIndex: number;
  onNavigate: (index: number) => void;
  onReview: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), questions.length - 1));
  const topRef = useRef<HTMLDivElement | null>(null);

  /* فتح السؤال المحفوظ في المحاولة المستعادة */
  useEffect(() => {
    setIndex((current) => (current === initialIndex ? current : Math.min(Math.max(0, initialIndex), questions.length - 1)));
  }, [initialIndex, questions.length]);

  const question = questions[index];
  const doneQuestions = useMemo(
    () => questions.filter((item) => isQuestionComplete(item, answers)).length,
    [questions, answers],
  );
  const doneParts = useMemo(
    () => questions.reduce((sum, item) => {
      const status = progressOf(item, answers);
      return sum + status.done;
    }, 0),
    [questions, answers],
  );
  const incomplete = totalParts - doneParts;
  const missingInCurrent = question.parts
    .flatMap((part) => part.inputs)
    .filter((input) => !isInputComplete(input, answers));

  const goto = (next: number) => {
    const clamped = Math.min(Math.max(0, next), questions.length - 1);
    setIndex(clamped);
    onNavigate(clamped);
    window.scrollTo({ top: 0, behavior: "auto" });
    topRef.current?.focus();
  };

  const value = (key: string) => answers[key] ?? "";

  return (
    <div ref={topRef} tabIndex={-1} className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-blush-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <h1 className="truncate text-sm font-semibold sm:text-base">اختبار الفيزياء — الصف السابع</h1>
          <div className="ms-auto flex items-center gap-2">
            <span
              className="tabular inline-flex items-center gap-1.5 rounded-full bg-lilac-100 px-3 py-1.5 text-sm font-semibold text-plum-700"
              dir="ltr"
              aria-label="الوقت المنقضي"
              role="timer"
            >
              <ClockIcon />
              {elapsedMs}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "تفعيل الصوت" : "كتم الصوت"}
              className="cursor-pointer rounded-full p-2 text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
              data-action="toggle-sound"
            >
              {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-3">
          <div className="mb-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span>
              السؤال <b className="text-ink">{num(index + 1)}</b> من {num(questions.length)}
            </span>
            <span>
              أُجيب عن <b className="text-ink">{num(doneQuestions)}</b> سؤالاً — المتبقي{" "}
              <b className="text-ink">{num(questions.length - doneQuestions)}</b>
            </span>
            <span>
              الفروع: <b className="text-ink">{num(doneParts)}</b> / {num(totalParts)}
              <span className="sr-only">
                {" "}
                أُجيب عن {num(doneParts)} من {num(totalParts)} فرعاً{" "}
              </span>
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-blush-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalParts}
            aria-valuenow={doneParts}
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-plum-500 to-blush-300 transition-all duration-500"
              style={{ width: `${totalParts ? (doneParts / totalParts) * 100 : 0}%` }}
            />
          </div>
          {incomplete > 0 && (
            <p className="mt-1.5 text-xs text-ink-soft">
              أكملي الفروع المتبقية لتفعيل زر التسليم (متبقٍ {num(incomplete)} فرع)
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-6 pt-6">
        <article data-question-id={question.id}>
          <header className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-plum-600 px-4 py-2 font-bold text-white">السؤال {num(index + 1)}</span>
            <h2 className="min-w-40 flex-1 text-lg font-semibold leading-8">{question.title}</h2>
            <MarkBadge marks={questionMaxMarks(question)} />
          </header>
          <Card className="p-4 sm:p-7">
            <p className="text-[17px] leading-8">
              <MixedText as="span" text={question.intro} />
            </p>
            {question.table && <DataTable head={question.table.head} rows={question.table.rows} />}
            {question.figure && (
              <div className="mt-4">
                <Figure type={question.figure} variant="question" />
              </div>
            )}
            <div className="mt-5 space-y-4">
              {question.parts.map((part, partIndex) => (
                <PartView key={part.id} part={part} index={partIndex} questionId={question.id} value={value} set={setAnswer} />
              ))}
            </div>
          </Card>
        </article>

        {missingInCurrent.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft" role="status">
            بقي في هذا السؤال {num(missingInCurrent.length)} حقلاً بلا إجابة.
          </p>
        )}
      </main>

      <div className="sticky bottom-0 z-20 border-t border-blush-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-3">
          <div className="order-2 mt-2 flex flex-wrap justify-center gap-1 sm:gap-2" role="navigation" aria-label="التنقل بين الأسئلة">
            {questions.map((item, itemIndex) => {
              const complete = isQuestionComplete(item, answers);
              const touched = item.parts.some((part) => part.inputs.some((input) => hasAnyAnswer(input, answers)));
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => goto(itemIndex)}
                  aria-label={`السؤال ${itemIndex + 1}${complete ? " (مكتمل)" : touched ? " (مكتمل جزئياً)" : ""}`}
                  aria-current={itemIndex === index ? "step" : undefined}
                  data-map-index={itemIndex}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-lg border-2 text-xs font-bold transition-colors sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm",
                    itemIndex === index
                      ? "border-plum-600 bg-plum-600 text-white"
                      : complete
                        ? "border-mint-500 bg-mint-100 text-mint-700"
                        : touched
                          ? "border-sun-600 bg-sun-100 text-sun-600"
                          : "border-blush-100 bg-white text-ink-soft hover:border-lilac-300",
                  )}
                >
                  {num(itemIndex + 1)}
                </button>
              );
            })}
          </div>
          <div className="order-1 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => goto(index - 1)}
              disabled={index === 0}
              className="flex-1 px-2 sm:flex-none sm:px-5"
            >
              <ChevronRightIcon />
              <span className="hidden sm:inline">السؤال السابق</span>
              <span className="sm:hidden">السابق</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => goto(index + 1)}
              disabled={index >= questions.length - 1}
              className="flex-1 px-2 sm:flex-none sm:px-5"
            >
              <span className="hidden sm:inline">السؤال التالي</span>
              <span className="sm:hidden">التالي</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              onClick={onReview}
              size="lg"
              className="min-w-0 flex-[1.6] px-3 sm:ms-auto sm:min-w-44 sm:flex-none"
              data-action="go-review"
            >
              مراجعة الإجابات
            </Button>
          </div>
        </div>
      </div>
      <p className="sr-only" data-testid="student-name-display">
        {studentName}
      </p>
    </div>
  );
}

import { QUESTION_BY_ID, TOTAL_PARTS } from "../exam/data";
import type { Attempt } from "../exam/attempt";
import { isPartAnswered, marksWord } from "../exam/grade";
import { BrandBar, CheckIcon, ArrowIcon } from "./Layout";
import { MathText } from "./MathText";
import { FloralDivider, TinySparkle } from "./Ornaments";

interface ReviewViewProps {
  attempt: Attempt;
  onNavigate: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  unanswered: number;
  answeredParts: number;
  elapsed: string;
  storageWarning: string | null;
}

export function ReviewView({
  attempt,
  onNavigate,
  onBack,
  onSubmit,
  unanswered,
  answeredParts,
  elapsed,
  storageWarning,
}: ReviewViewProps) {
  const progress = Math.round((answeredParts / TOTAL_PARTS) * 100);

  return (
    <>
      <BrandBar
        rightSlot={
          <div className="timer-box text-xs sm:text-sm" aria-label={`مدة الاختبار ${elapsed}`}>
            <ClockIcon className="h-3.5 w-3.5 text-[#9a7048]" />
            <span dir="ltr">{elapsed}</span>
          </div>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">قبل التسليم</p>
            <h1 className="display-title mt-1 text-3xl font-bold text-[#432637]">
              مراجعة الإجابات
            </h1>
            <p className="mt-1 text-sm text-[#7d6471]">
              تحقّقي من اكتمال الإجابة عن جميع الأجزاء. لا تظهر الإجابات الصحيحة في هذه الشاشة.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            <ArrowIcon direction="left" />
            العودة إلى الاختبار
          </button>
        </div>

        <FloralDivider className="my-4 opacity-80" />

        {storageWarning ? (
          <div className="warning-box mb-4" role="status">
            <strong>تنبيه بشأن الحفظ:</strong> {storageWarning}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-3">
            {attempt.questionOrder.map((questionId, index) => {
              const question = QUESTION_BY_ID.get(questionId);
              if (!question) return null;
              const answered = question.parts.filter((part) =>
                isPartAnswered(part, attempt.answers[part.id])
              ).length;
              const totalParts = question.parts.length;
              const complete = answered === totalParts;
              const marks = question.parts.reduce((sum, part) => sum + part.marks, 0);

              return (
                <div
                  key={questionId}
                  className="surface-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dfc9d3] bg-[#fbf2f6] text-sm font-extrabold text-[#81445a]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#4b3040]">
                        <MathText text={question.title} />
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem]">
                        <span className="text-[#8d7481]">{question.topic}</span>
                        <span className="text-[#c9b4be]">•</span>
                        <span className="text-[#8d7481]">{marksWord(marks)}</span>
                        <span className="text-[#c9b4be]">•</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-bold ${
                            complete
                              ? "border-[#d8d0e3] bg-[#f7f4fb] text-[#685e7c]"
                              : "border-[#e3d4dc] bg-white text-[#8a6c7a]"
                          }`}
                        >
                          {answered} من {totalParts} {answered === 1 ? "جزء مُجاب" : "أجزاء مُجابة"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.parts.map((part) => {
                          const done = isPartAnswered(part, attempt.answers[part.id]);
                          return (
                            <span
                              key={part.id}
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                                done
                                  ? "border-[#ddd2e5] bg-[#faf8fc] text-[#685874]"
                                  : "border-dashed border-[#d6c3cc] bg-[#fffdfb] text-[#9a808c]"
                              }`}
                            >
                              <span className="part-badge !h-4 !min-w-4 !rounded !border-0 !bg-transparent !p-0 !text-[0.65rem] !text-inherit">
                                {part.label}
                              </span>
                              {done ? "مُجاب" : "بانتظار الإجابة"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary shrink-0 self-end !min-h-9 !px-3 !py-1.5 text-xs sm:self-center"
                    onClick={() => onNavigate(index)}
                  >
                    {complete ? "مراجعة السؤال" : "أكمل الإجابة"}
                  </button>
                </div>
              );
            })}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-[88px]">
            <div className="surface p-5">
              <p className="eyebrow">ملخص الاكتمال</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="num text-3xl font-extrabold text-[#7c3f56]">{progress}%</p>
                <p className="text-xs font-semibold text-[#806a76]">
                  <span className="num">{answeredParts}</span> من{" "}
                  <span className="num">{TOTAL_PARTS}</span> جزءاً
                </p>
              </div>
              <div className="progress-track mt-2">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-[0.76rem] leading-6 text-[#7d6672]">
                {unanswered > 0
                  ? `متبقٍ ${unanswered} من ${TOTAL_PARTS} جزءاً دون إجابة. يجب إكمال جميع الأجزاء لتفعيل زر التسليم.`
                  : "جميع الأجزاء مُجابة. يمكنك تسليم الاختبار الآن."}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-4 w-full"
                onClick={onSubmit}
                disabled={unanswered > 0}
              >
                <CheckIcon className="h-4 w-4" />
                تسليم الاختبار
              </button>
              <button type="button" className="btn btn-secondary mt-2 w-full" onClick={onBack}>
                متابعة الإجابة
              </button>
            </div>

            <div className="info-box">
              <p className="flex items-center gap-1.5 font-extrabold">
                <TinySparkle className="h-3.5 w-3.5 text-[#9a7db5]" />
                قبل الضغط على التسليم
              </p>
              <p className="mt-1.5 text-[0.76rem] leading-6">
                تأكد من الإجابة عن كل الأجزاء المطلوبة. بعد التسليم تُثبّت الإجابات وتُعرض النتيجة
                والتقرير مباشرة، ولا يمكن تعديل المحاولة.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

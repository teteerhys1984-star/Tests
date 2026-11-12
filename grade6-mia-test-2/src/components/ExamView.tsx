import {
  QUESTION_BY_ID,
  TOTAL_PARTS,
  type Option,
  type Part,
  type Question,
} from "../exam/data";
import type { Attempt } from "../exam/attempt";
import type { AnswerValue } from "../exam/grade";
import { isPartAnswered, marksWord } from "../exam/grade";
import { BrandBar, CheckIcon, ArrowIcon, LockIcon } from "./Layout";
import { MathText } from "./MathText";
import { GeometryDiagram } from "./Diagrams";
import { FloralDivider, TinySparkle } from "./Ornaments";

interface ExamViewProps {
  attempt: Attempt;
  onAnswer: (partId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onOpenReview: () => void;
  onSubmit: () => void;
  unanswered: number;
  answeredParts: number;
  elapsed: string;
  storageWarning: string | null;
  reportError: string | null;
}

const letters = ["أ", "ب", "ج", "د", "هـ"];

function orderedOptions(part: Part, attempt: Attempt): Option[] {
  const original = part.options ?? [];
  const order = attempt.optionOrders[part.id];
  if (!order) return original;
  const options = order
    .map((id) => original.find((option) => option.id === id))
    .filter((option): option is Option => Boolean(option));
  return options.length === original.length ? options : original;
}

function QuestionDiagram({ question }: { question: Question }) {
  const diagramPart = question.parts.find((part) => part.diagram);
  if (!diagramPart?.diagram) return null;
  return (
    <div className="mt-4">
      <GeometryDiagram id={diagramPart.diagram} />
      <p className="mt-1.5 text-center text-[0.68rem] font-semibold text-[#9a7f8b]">
        الشكل التوضيحي للسؤال
      </p>
    </div>
  );
}

function AnswerControl({
  part,
  value,
  options,
  onChange,
}: {
  part: Part;
  value: AnswerValue | undefined;
  options: Option[];
  onChange: (value: AnswerValue) => void;
}) {
  if (part.kind === "mcq") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const selected = typeof value === "string" && value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className="choice-card"
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
            >
              <span className="choice-letter" aria-hidden="true">
                {letters[index] ?? index + 1}
              </span>
              <span className="min-w-0 flex-1 pt-1 text-[0.88rem] leading-7 text-[#503744]">
                <MathText text={option.label} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (part.kind === "boolean") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
        {[
          { label: "صحيح", val: "true" },
          { label: "خطأ", val: "false" },
        ].map((choice) => {
          const selected = value === choice.val;
          return (
            <button
              key={choice.val}
              type="button"
              className="choice-card justify-center"
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => onChange(choice.val)}
            >
              <span className="text-[0.9rem] font-bold">{choice.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (part.kind === "multi") {
    const multiValue =
      value && typeof value === "object" ? value : ({} as Record<string, string>);
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {(part.blanks ?? []).map((blank) => (
          <label key={blank.id} className="block rounded-xl border border-[#eadbe2] bg-white/70 p-3">
            <span className="mb-1.5 block text-[0.83rem] font-bold text-[#523844]">
              <MathText text={blank.label} />
            </span>
            <div className="flex items-center gap-2">
              <input
                className={`input-field ${blank.numeric ? "input-math" : ""}`}
                type="text"
                inputMode={blank.numeric ? "decimal" : "text"}
                autoComplete="off"
                spellCheck={false}
                value={multiValue[blank.id] ?? ""}
                onChange={(event) =>
                  onChange({ ...multiValue, [blank.id]: event.target.value })
                }
                placeholder={blank.placeholder ?? "اكتب الإجابة"}
                aria-label={blank.label.replace(/\$/g, "")}
              />
            </div>
          </label>
        ))}
      </div>
    );
  }

  const textValue = typeof value === "string" ? value : "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`input-field max-w-xl ${part.kind === "numeric" ? "input-math" : ""}`}
        type="text"
        inputMode={part.kind === "numeric" ? "decimal" : "text"}
        autoComplete="off"
        spellCheck={false}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={part.inputPlaceholder ?? "اكتب الإجابة"}
        aria-label={part.prompt.replace(/\$/g, "")}
      />
      {part.unit ? <span className="answer-unit">{part.unit}</span> : null}
    </div>
  );
}

function QuestionContent({
  question,
  position,
  attempt,
  onAnswer,
}: {
  question: Question;
  position: number;
  attempt: Attempt;
  onAnswer: (partId: string, value: AnswerValue) => void;
}) {
  const total = question.parts.reduce((sum, part) => sum + part.marks, 0);
  return (
    <article className="surface overflow-hidden">
      <div className="border-b border-[#eddfe5] bg-gradient-to-l from-[#fdf7f9] via-[#fffdfb] to-[#fbf9fd] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-[#dfbcc9] bg-[#fbf0f4] px-2 py-0.5 text-xs font-extrabold text-[#8b4059]">
              السؤال <span className="num">{position}</span> من <span className="num">30</span>
            </span>
            <span className="chip chip-lavender hidden sm:inline-flex">{question.topic}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mark-pill">مجموع العلامات: {marksWord(total)}</span>
          </div>
        </div>
        <h2 className="mt-3 text-lg font-extrabold leading-8 text-[#432738] sm:text-xl">
          <MathText text={question.title} />
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        <QuestionDiagram question={question} />
        <div className="mt-4 space-y-3.5">
          {question.parts.map((part) => (
            <section key={part.id} className="part-card" aria-label={`الجزء ${part.label}`}>
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="part-badge">{part.label}</span>
                  <div className="pt-0.5 text-[0.92rem] font-semibold leading-8 text-[#4b3340]">
                    <MathText text={part.prompt} />
                  </div>
                </div>
                <span className="mark-pill shrink-0">{marksWord(part.marks)}</span>
              </div>
              <div className="mt-3 ps-0 sm:ps-9">
                <AnswerControl
                  part={part}
                  value={attempt.answers[part.id]}
                  options={orderedOptions(part, attempt)}
                  onChange={(value) => onAnswer(part.id, value)}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function Navigator({
  attempt,
  onNavigate,
}: {
  attempt: Attempt;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="surface-soft p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-[#543444]">خريطة الأسئلة</h3>
        <span className="text-[0.7rem] font-semibold text-[#917986]">
          <span className="num">{attempt.questionOrder.length || 30}</span> سؤالاً
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {attempt.questionOrder.map((questionId, index) => {
          const question = QUESTION_BY_ID.get(questionId);
          if (!question) return null;
          const total = question.parts.length;
          const answered = question.parts.filter((part) =>
            isPartAnswered(part, attempt.answers[part.id])
          ).length;
          const state = answered === total ? "complete" : answered > 0 ? "partial" : "none";
          return (
            <button
              key={questionId}
              type="button"
              className="palette-btn"
              data-current={attempt.currentIndex === index}
              data-answer-state={state}
              aria-label={`السؤال ${index + 1}: ${answered === total ? "مكتمل" : `${answered} من ${total} أجزاء مُجابة`}`}
              aria-current={attempt.currentIndex === index ? "step" : undefined}
              onClick={() => onNavigate(index)}
            >
              <span className="num">{index + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.66rem] text-[#8a7380]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#b9cbb3] bg-[#eef4ec]" />
          مكتمل
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#ddc9a2] bg-[#fbf6eb]" />
          جزئي
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#e3d4dc] bg-white" />
          لم يبدأ
        </span>
      </div>
    </div>
  );
}

export function ExamView({
  attempt,
  onAnswer,
  onNavigate,
  onOpenReview,
  onSubmit,
  unanswered,
  answeredParts,
  elapsed,
  storageWarning,
  reportError,
}: ExamViewProps) {
  const order = attempt.questionOrder.length
    ? attempt.questionOrder
    : Array.from({ length: 30 }, (_, index) => index + 1);
  const safeIndex = Math.min(Math.max(0, attempt.currentIndex), order.length - 1);
  const questionId = order[safeIndex];
  const question = QUESTION_BY_ID.get(questionId);
  if (!question) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="surface p-6">تعذّر تحميل السؤال. أعد تحميل الصفحة للمحاولة مجدداً.</div>
      </div>
    );
  }

  const progress = Math.round((answeredParts / TOTAL_PARTS) * 100);
  const isLast = safeIndex >= order.length - 1;
  const isFirst = safeIndex === 0;

  return (
    <>
      <BrandBar
        rightSlot={
          <div className="flex items-center gap-2">
            <div className="timer-box text-xs sm:text-sm" aria-label={`مدة الاختبار ${elapsed}`}>
              <ClockIcon className="h-3.5 w-3.5 text-[#9a7048]" />
              <span dir="ltr">{elapsed}</span>
            </div>
            <span className="chip chip-rose hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a75570]" />
              قيد الأداء
            </span>
          </div>
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">الاختبار الجاري</p>
            <h1 className="display-title mt-0.5 text-2xl font-bold text-[#422637] sm:text-3xl">
              ميا والرياضيات
            </h1>
          </div>
          <div className="w-full max-w-md">
            <div className="mb-1 flex items-center justify-between text-[0.75rem] font-semibold text-[#755766]">
              <span>
                تمت الإجابة عن <span className="num font-extrabold text-[#8b4059]">{answeredParts}</span>{" "}
                من <span className="num">{TOTAL_PARTS}</span> جزءاً
              </span>
              <span className="num">{progress}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL_PARTS}
              aria-valuenow={answeredParts}
              aria-label="تقدم الإجابة عن أجزاء الاختبار"
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[0.68rem] text-[#967e8b]">
              <span>
                السؤال <span className="num font-bold">{safeIndex + 1}</span> من{" "}
                <span className="num">30</span>
              </span>
              <span>جميع الأجزاء مطلوبة</span>
            </div>
          </div>
        </div>

        {storageWarning ? (
          <div className="warning-box mb-4" role="status">
            <strong>تنبيه بشأن الحفظ:</strong> {storageWarning}
          </div>
        ) : null}
        {reportError ? (
          <div className="warning-box mb-4" role="alert">
            <strong>تعذّر إنشاء التقرير:</strong> {reportError}
          </div>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_292px]">
          <div className="min-w-0">
            <QuestionContent
              question={question}
              position={safeIndex + 1}
              attempt={attempt}
              onAnswer={onAnswer}
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate(safeIndex - 1)}
                  disabled={isFirst}
                >
                  <ArrowIcon direction="left" />
                  السابق
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate(safeIndex + 1)}
                  disabled={isLast}
                >
                  التالي
                  <ArrowIcon />
                </button>
              </div>
              <button type="button" className="btn btn-ghost" onClick={onOpenReview}>
                <ListIcon />
                مراجعة الإجابات
              </button>
            </div>

            <section className="surface mt-5 overflow-hidden">
              <div className="h-1 bg-gradient-to-l from-[#e8ccd8] via-[#c1a05e] to-[#d8d0e9]" />
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7edf1] text-[#8b4059]">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#4e3040]">
                        إنهاء الاختبار وتسليم الإجابات
                      </h2>
                      <p className="mt-0.5 text-[0.74rem] leading-6 text-[#846d79]">
                        {unanswered > 0
                          ? `متبقٍ ${unanswered} من ${TOTAL_PARTS} جزءاً دون إجابة. لا يمكن التسليم قبل الإجابة عن جميع الأجزاء.`
                          : "جميع الأجزاء مُجابة. سيؤدي الضغط على الزر إلى تسليم الاختبار فوراً وتنزيل تقرير النتيجة."}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <button
                      type="button"
                      className="btn btn-primary w-full sm:w-auto sm:min-w-[185px]"
                      onClick={onSubmit}
                      disabled={unanswered > 0}
                    >
                      <CheckIcon className="h-4 w-4" />
                      تسليم الاختبار
                    </button>
                    <button type="button" className="btn btn-ghost !min-h-0 !py-1 text-xs" onClick={onOpenReview}>
                      مراجعة الأجزاء قبل التسليم
                    </button>
                  </div>
                </div>
                <FloralDivider className="mt-4 opacity-60" />
                <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-[#8c7481]">
                  <TinySparkle className="h-3 w-3 text-[#b79562]" />
                  {storageWarning
                    ? "تعذّر تأكيد الحفظ التلقائي على هذا الجهاز."
                    : "يُحفظ تقدمك تلقائياً على هذا الجهاز عند كل تغيير أو تنقل."}
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[88px]">
            <Navigator attempt={attempt} onNavigate={onNavigate} />
            <div className="surface-soft p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#593a4a]">
                <TinySparkle className="h-3.5 w-3.5 text-[#b79562]" />
                ملاحظات الاختبار
              </p>
              <ul className="space-y-2 text-[0.72rem] leading-6 text-[#7c6572]">
                <li>جميع أجزاء السؤال مطلوبة قبل التسليم.</li>
                <li>يمكن تعديل أي إجابة والتنقل بحرية.</li>
                <li>لا تُعرض النتيجة قبل التسليم النهائي.</li>
              </ul>
              <div className="mt-3 rounded-xl border border-[#eadde4] bg-[#fffbf9] px-3 py-2">
                <div className="flex items-center justify-between text-[0.7rem]">
                  <span className="text-[#8a7480]">مدة المحاولة</span>
                  <span className="timer-box !border-0 !bg-transparent !p-0 !text-xs">
                    {elapsed}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[0.7rem]">
                  <span className="text-[#8a7480]">حالة الحفظ</span>
                  <span className={`font-bold ${storageWarning ? "text-[#9b6a2d]" : "text-[#587257]"}`}>
                    {storageWarning ? "غير مؤكد" : "محلي تلقائي"}
                  </span>
                </div>
              </div>
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

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

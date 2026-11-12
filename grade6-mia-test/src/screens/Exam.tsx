import type { AnswerValue, Attempt, Question } from "../types";
import { countAnswered, isSubpartAnswered, questionsInOrder, optionValuesFor } from "../lib/exam";
import { AnswerInput } from "../components/AnswerInput";
import { GeometryFigure } from "../components/Figures";
import { RichText } from "../components/RichText";
import { ContactBlock } from "../components/Chrome";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconList,
  IconLock,
  IconSave,
  IconSparkle,
} from "../components/Icons";

function remainingCount(attempt: Attempt, bank: Question[]): number {
  return bank.reduce(
    (sum, q) =>
      sum + q.subparts.filter((s) => !isSubpartAnswered(s, attempt.answers[s.id] ?? null)).length,
    0,
  );
}

function QuestionDots({
  attempt,
  bank,
  onNavigate,
}: {
  attempt: Attempt;
  bank: Question[];
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5" role="list" aria-label="خريطة الأسئلة">
      {bank.map((q, index) => {
        const done = q.subparts.every((s) => isSubpartAnswered(s, attempt.answers[s.id] ?? null));
        const current = index === attempt.currentIndex;
        const visited = attempt.visited.includes(index);
        return (
          <button
            key={q.id}
            type="button"
            role="listitem"
            onClick={() => onNavigate(index)}
            className={`qdot${done ? " is-answered" : " is-missing"}${current ? " is-current" : ""}`}
            aria-label={`السؤال ${index + 1}${current ? " — الحالي" : ""}${done ? " — مكتمل" : ""}`}
            aria-current={current ? "step" : undefined}
            style={visited && !current && !done ? { borderColor: "#d8bfcb" } : undefined}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

export function ExamScreen({
  attempt,
  saveOk,
  timer,
  onAnswer,
  onNavigate,
  onReview,
  onSubmit,
  onTeacherKey: _onTeacherKey,
}: {
  attempt: Attempt;
  saveOk: boolean | null;
  timer: string;
  onAnswer: (subpartId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onReview: () => void;
  onSubmit: () => void;
  onTeacherKey?: () => void;
}) {
  const bank = questionsInOrder(attempt);
  const index = Math.min(Math.max(attempt.currentIndex, 0), bank.length - 1);
  const question = bank[index];
  if (!question) return null;
  const answered = countAnswered(attempt, bank);
  const total = bank.reduce((sum, q) => sum + q.subparts.length, 0);
  const remaining = remainingCount(attempt, bank);
  const questionAnswered = question.subparts.filter((s) =>
    isSubpartAnswered(s, attempt.answers[s.id] ?? null),
  ).length;
  const progressPct = Math.round((answered / total) * 100);
  const questionPct = Math.round((questionAnswered / question.subparts.length) * 100);

  const goTo = (next: number) => {
    if (next < 0 || next >= bank.length) return;
    onNavigate(next);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* noop */
    }
  };

  return (
    <main className="shell screen-enter py-4">
      <div className="exam-bar no-print mb-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-gold">
              <IconList size={13} />
              السؤال {index + 1} من {bank.length}
            </span>
            <span className="chip chip-soft">
              <IconCheck size={12} />
              {answered} من {total} جزءاً مُجاب
            </span>
            <span className="chip chip-lav">
              <IconClock size={13} />
              <span className="timer">{timer}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onReview}>
              <IconList size={15} />
              مراجعة الإجابات
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onSubmit}
              disabled={remaining > 0}
              title={remaining > 0 ? `بقي ${remaining} جزءاً دون إجابة` : "تسليم الاختبار"}
            >
              تسليم الاختبار
            </button>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct} aria-label="مقدّم الإنجاز">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap justify-between gap-1 text-[0.7rem]" style={{ color: "#8a7181" }}>
            <span>مقدّم الإنجاز: {progressPct}%</span>
            <span>
              {remaining === 0
                ? "اكتملت جميع الأجزاء المطلوبة. راجع إجاباتك ثم سلّم."
                : `بقي ${remaining} جزءاً دون إجابة`}
            </span>
            <span>
              السؤال الحالي: {questionAnswered} / {question.subparts.length} مُجاب
            </span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card p-4 sm:p-5" aria-labelledby="question-title">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3" style={{ borderColor: "#f2e5eb" }}>
            <div className="flex items-start gap-2.5">
              <span className="q-medallion" aria-hidden>
                {index + 1}
              </span>
              <div>
                <p className="m-0 text-[0.7rem] font-bold" style={{ color: "#9a7185", letterSpacing: "0.02em" }}>
                  السؤال {index + 1} من {bank.length}
                </p>
                <h1 id="question-title" className="m-0 text-[1.02rem] font-bold" style={{ color: "#57304a" }}>
                  {question.topic}
                </h1>
                <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>
                  {question.subparts.length} من الأجزاء · الدرجة الكلية للسؤال: {question.marks}
                </p>
              </div>
            </div>
            <span className="chip chip-gold">{question.marks} درجات</span>
          </div>

          <div className="mt-3">
            <p className="m-0 text-[0.95rem]" style={{ color: "#4d384b" }}>
              <RichText>{question.stem}</RichText>
            </p>
            {question.figure ? (
              <GeometryFigure id={question.figure} caption={question.figureCaption} />
            ) : null}
          </div>

          <div className="mt-3.5 grid gap-3">
            {question.subparts.map((subpart, subIndex) => {
              const value = attempt.answers[subpart.id] ?? (subpart.type === "ordering" ? [] : null);
              return (
                <div className="subpart" key={subpart.id} id={`subpart-${subpart.id}`}>
                  <div className="subpart-head">
                    <div className="flex items-start gap-2">
                      <span className="subpart-index" aria-hidden>
                        {subIndex + 1}
                      </span>
                      <p className="m-0 text-[0.9rem] font-semibold" style={{ color: "#4b3750" }}>
                        <RichText>{subpart.prompt}</RichText>
                      </p>
                    </div>
                    <span className="marks-badge">{subpart.marks} درجات</span>
                  </div>
                  {subpart.calc ? (
                    <div className="calc-block mt-2" aria-label="عملية حسابية مرتبة">
                      {subpart.calc.lines.map((line, i) => (
                        <div className="calc-row" key={line}>
                          <span className="calc-op">{i === subpart.calc!.lines.length - 1 ? subpart.calc!.operator : ""}</span>
                          <span>{new Intl.NumberFormat("en-US").format(Number(line))}</span>
                        </div>
                      ))}
                      <div className="calc-total" aria-label="الناتج" />
                    </div>
                  ) : null}
                  <AnswerInput
                    subpart={subpart}
                    value={value}
                    optionOrder={optionValuesFor(attempt, subpart)}
                    onChange={(next) => onAnswer(subpart.id, next)}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "#f2e5eb" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              <IconArrowRight size={16} />
              السؤال السابق
            </button>
            <div className="flex items-center gap-1.5 text-[0.7rem]" style={{ color: "#9a8394" }}>
              <IconSparkle size={13} />
              إجاباتك تُحفظ تلقائياً
            </div>
            {index === bank.length - 1 ? (
              <button type="button" className="btn btn-gold" onClick={onReview}>
                <IconList size={16} />
                الانتقال إلى المراجعة
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => goTo(index + 1)}>
                السؤال التالي
                <IconArrowLeft size={16} />
              </button>
            )}
          </div>
        </section>

        <aside className="side-card grid gap-3" aria-label="لوحة التقدم">
          <div className="card p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="m-0 flex items-center gap-1.5 text-[0.88rem] font-bold" style={{ color: "#57304a" }}>
                <IconList size={15} />
                خريطة الأسئلة
              </h2>
              <span className="save-status">
                <span className={`save-dot${saveOk === false ? " warn" : ""}`} />
                {saveOk === false ? "لا حفظ تلقائي" : "محفوظ"}
              </span>
            </div>
            <QuestionDots attempt={attempt} bank={bank} onNavigate={goTo} />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.68rem]" style={{ color: "#8a7181" }}>
              <span>
                <span className="legend-dot" style={{ background: "#f6e7ee", borderColor: "#dfb4c6" }} />
                مكتمل
              </span>
              <span>
                <span className="legend-dot" style={{ background: "linear-gradient(135deg,#bb5b7c,#8c79b6)", borderColor: "#a85b7c" }} />
                الحالي
              </span>
              <span>
                <span className="legend-dot" style={{ background: "#fffdfb" }} />
                بانتظار الإجابة
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: "#f4e7ee" }}>
              <div className="h-full rounded-full" style={{ width: `${questionPct}%`, background: "linear-gradient(90deg,#d385a1,#8c79b6)" }} />
            </div>
            <p className="m-0 mt-1 text-[0.7rem]" style={{ color: "#8a7181" }}>
              إنجاز هذا السؤال: {questionPct}%
            </p>
          </div>

          <div className="card p-3.5">
            <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>
              الأجزاء المتبقية
            </p>
            <p className="m-0 text-[1.65rem] font-extrabold" style={{ color: remaining === 0 ? "#3f7657" : "#7b3d5c", fontVariantNumeric: "tabular-nums" }}>
              {remaining}
            </p>
            <p className="m-0 text-[0.7rem]" style={{ color: "#8a7181" }}>
              {remaining === 0
                ? "جميع الأجزاء المطلوبة مكتملة. يمكنك التسليم."
                : "يجب إكمال كل الأجزاء المطلوبة قبل التسليم."}
            </p>
            <button
              type="button"
              className="btn btn-primary mt-2 w-full"
              onClick={onSubmit}
              disabled={remaining > 0}
            >
              تسليم الاختبار
            </button>
            <button type="button" className="btn btn-secondary mt-2 w-full" onClick={onReview}>
              <IconList size={15} />
              مراجعة الإجابات
            </button>
            <p className="m-0 mt-2 flex items-start gap-1 text-[0.68rem]" style={{ color: "#9a8394" }}>
              <IconLock size={12} />
              لا تُعرض الإجابات الصحيحة أو الشرح قبل التسليم.
            </p>
          </div>

          <ContactBlock compact />
        </aside>
      </div>
    </main>
  );
}

export function ReviewScreen({
  attempt,
  timer,
  onNavigate,
  onBack,
  onSubmit,
}: {
  attempt: Attempt;
  timer: string;
  onNavigate: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const bank = questionsInOrder(attempt);
  const remaining = remainingCount(attempt, bank);
  const total = bank.reduce((sum, q) => sum + q.subparts.length, 0);
  const answered = countAnswered(attempt, bank);

  return (
    <main className="shell-narrow screen-enter py-4">
      <div className="exam-bar mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="chip chip-gold">
          <IconList size={13} />
          مراجعة الإجابات
        </span>
        <span className="chip chip-lav">
          <IconClock size={13} />
          <span className="timer">{timer}</span>
        </span>
        <span className="chip chip-soft">
          {answered} / {total} جزءاً مُجاب
        </span>
      </div>

      <section className="card ornate-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="font-display m-0 text-[1.45rem] font-bold" style={{ color: "#57304a" }}>
              مراجعة الإجابات
            </h1>
            <p className="m-0 text-[0.82rem]" style={{ color: "#8a7181" }}>
              راجع الأسئلة التي لم تُجب عن جميع أجزائها. لا تظهر أي تلميحات أو إجابات صحيحة هنا.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <IconArrowRight size={15} />
              العودة إلى الأسئلة
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="stat-box">
            <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>الأجزاء المكتملة</p>
            <p className="stat-num m-0" style={{ color: "#3f7657" }}>{answered}</p>
          </div>
          <div className="stat-box">
            <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>الأجزاء المتبقية</p>
            <p className="stat-num m-0" style={{ color: remaining > 0 ? "#8d6726" : "#3f7657" }}>{remaining}</p>
          </div>
          <div className="stat-box">
            <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>إجمالي الأجزاء</p>
            <p className="stat-num m-0">{total}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: remaining > 0 ? "#efd9b6" : "#d6e7da", background: remaining > 0 ? "#fdf8ec" : "#f3faf4" }}>
          {remaining > 0 ? (
            <>
              <p className="m-0 text-[0.86rem] font-bold" style={{ color: "#7b5c22" }}>
                {remaining} جزءاً مطلوباً لم يُجب بعد
              </p>
              <p className="m-0 text-[0.76rem]" style={{ color: "#8a7181" }}>
                يبقى زر التسليم معطّلاً حتى تُكمل جميع الأجزاء. انتقل إلى السؤال لإكمال ما ينقص.
              </p>
            </>
          ) : (
            <p className="m-0 flex items-center gap-1.5 text-[0.86rem] font-bold" style={{ color: "#3f6b52" }}>
              <IconCheck size={16} />
              جميع الأجزاء المطلوبة مكتملة. يمكنك تسليم الاختبار الآن.
            </p>
          )}
        </div>

        <div className="mt-3">
          <h2 className="m-0 mb-2 text-[0.9rem] font-bold" style={{ color: "#57304a" }}>
            خريطة الأسئلة
          </h2>
          <QuestionDots attempt={attempt} bank={bank} onNavigate={(i) => { onNavigate(i); onBack(); }} />
        </div>

        <div className="mt-4">
          <h2 className="m-0 mb-2 text-[0.9rem] font-bold" style={{ color: "#57304a" }}>
            الأسئلة الناقصة
          </h2>
          {remaining === 0 ? (
            <p className="m-0 text-[0.84rem]" style={{ color: "#5d6f60" }}>
              لا توجد أسئلة ناقصة. يمكنك تنزيل تقريرك بعد التسليم.
            </p>
          ) : (
            <div className="grid gap-2">
              {bank.map((q, index) => {
                const missing = q.subparts.filter(
                  (s) => !isSubpartAnswered(s, attempt.answers[s.id] ?? null),
                );
                if (!missing.length) return null;
                return (
                  <div
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                    style={{ borderColor: "#f0e3e9", background: "#fffdfc" }}
                  >
                    <div>
                      <p className="m-0 text-[0.84rem] font-bold" style={{ color: "#4b3750" }}>
                        السؤال {index + 1} — {q.topic}
                      </p>
                      <p className="m-0 text-[0.74rem]" style={{ color: "#8a7181" }}>
                        أجزاء دون إجابة: {missing.map((s) => q.subparts.indexOf(s) + 1).join("، ")}
                      </p>
                    </div>
                    <span className="chip chip-gold">{missing.length} جزءاً</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onNavigate(index);
                        onBack();
                      }}
                    >
                      الانتقال إلى السؤال
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "#f2e5eb" }}>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            <IconArrowRight size={15} />
            متابعة الحل
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={remaining > 0}>
            <IconSave size={16} />
            تسليم الاختبار
          </button>
        </div>
        {remaining > 0 ? (
          <p className="m-0 mt-1.5 text-end text-[0.74rem]" style={{ color: "#8d6726" }}>
            لا يمكن التسليم قبل الإجابة عن جميع الأجزاء المطلوبة ({remaining} متبقية).
          </p>
        ) : null}
      </section>
    </main>
  );
}

import { useEffect } from "react";
import type { Attempt } from "../../types/exam";
import { QUESTIONS, TOTAL_SUBPARTS } from "../../data/questions";
import { countAnsweredSubparts, isExamComplete } from "../../utils/grading";
import { toArabicDigits } from "../../utils/arabic";
import { useElapsedTime } from "../../hooks/useElapsedTime";
import { Icon } from "../common/Icon";
import { ExamHeader } from "./ExamHeader";
import { QuestionCard } from "./QuestionCard";
import { QuestionPalette } from "./QuestionPalette";

interface ExamScreenProps {
  attempt: Attempt;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAnswer: (subpartId: string, values: string[]) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}

export function ExamScreen({
  attempt,
  soundEnabled,
  onToggleSound,
  onAnswer,
  onNavigate,
  onSubmit,
}: ExamScreenProps) {
  const { display } = useElapsedTime(attempt.startedAt, attempt.submittedAt);
  const currentQuestion = QUESTIONS[attempt.current] ?? QUESTIONS[0];
  const answered = countAnsweredSubparts(attempt.answers);
  const complete = isExamComplete(attempt.answers);
  const isFirst = attempt.current === 0;
  const isLast = attempt.current === QUESTIONS.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [attempt.current]);

  return (
    <div className="app-shell relative z-10">
      <ExamHeader
        elapsedDisplay={display}
        answered={answered.answered}
        totalSubparts={TOTAL_SUBPARTS}
        studentName={attempt.studentName}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
      />

      <main id="exam-main" className="page-container py-5 pb-28 lg:pb-10">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0">
            <div className="card-soft mb-3 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7e7eb] text-[#a34e6d]">
                  <Icon name="flower" size={14} />
                </span>
                <p className="text-[12px] font-bold text-[#6f4b59]">
                  بالتوفيق يا {attempt.studentName.split(" ")[0]}، اقرئي كل سؤال بهدوء قبل الإجابة.
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#9e8990]">
                <Icon name="shield" size={12} />
                حفظ تلقائي مفعّل
              </span>
            </div>

            {/* Mobile palette */}
            <details className="card-soft mb-3 px-3 py-2 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[12px] font-bold text-[#6a4656]">
                <span className="flex items-center gap-1.5">
                  <Icon name="list" size={14} className="text-[#b45c7e]" />
                  خريطة الأسئلة والتنقل السريع
                </span>
                <span className="chip chip-rose text-[10px]">
                  {toArabicDigits(answered.answered)}/{toArabicDigits(answered.total)}
                </span>
              </summary>
              <div className="mt-2.5">
                <QuestionPalette
                  current={attempt.current}
                  answers={attempt.answers}
                  answeredSubparts={answered.answered}
                  totalSubparts={answered.total}
                  canSubmit={complete}
                  onNavigate={onNavigate}
                  onSubmit={onSubmit}
                  variant="inline"
                />
              </div>
            </details>

            <QuestionCard
              question={currentQuestion}
              answers={attempt.answers}
              onAnswer={onAnswer}
            />

            <nav className="mt-4 flex items-center justify-between gap-2" aria-label="التنقل بين الأسئلة">
              <button
                type="button"
                onClick={() => onNavigate(attempt.current - 1)}
                disabled={isFirst}
                className="btn btn-outline disabled:opacity-40"
              >
                <Icon name="arrow-right" size={16} />
                السابق
              </button>

              <div className="hidden items-center gap-1.5 sm:flex">
                {[attempt.current - 1, attempt.current, attempt.current + 1]
                  .filter((index) => index >= 0 && index < QUESTIONS.length)
                  .map((index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onNavigate(index)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-[11px] font-bold transition ${
                        index === attempt.current
                          ? "border-[#b45c7e] bg-[#b45c7e] text-white"
                          : "border-[#ecdedb] bg-white/70 text-[#8d7b81] hover:border-[#d9b4bf]"
                      }`}
                      aria-label={`الانتقال إلى السؤال ${QUESTIONS[index].number}`}
                      aria-current={index === attempt.current ? "step" : undefined}
                    >
                      {toArabicDigits(QUESTIONS[index].number)}
                    </button>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigate(attempt.current + 1)}
                disabled={isLast}
                className="btn btn-outline disabled:opacity-40"
              >
                التالي
                <Icon name="arrow-left" size={16} />
              </button>
            </nav>
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <QuestionPalette
              current={attempt.current}
              answers={attempt.answers}
              answeredSubparts={answered.answered}
              totalSubparts={answered.total}
              canSubmit={complete}
              onNavigate={onNavigate}
              onSubmit={onSubmit}
            />
            <div className="mt-3 rounded-2xl border border-[#eee2df] bg-white/55 p-3 text-[10.5px] leading-6 text-[#9c888e]">
              <p className="mb-1 flex items-center gap-1 font-bold text-[#80616d]">
                <Icon name="sparkle" size={12} /> تذكير تنظيمي
              </p>
              يمكنك الانتقال بين الأسئلة بحرية والعودة لتعديل إجاباتك. يُحفظ كل تعديل مباشرة، ولا تُعرض أي
              إجابة صحيحة قبل التسليم.
            </div>
          </aside>
        </div>
      </main>

      {/* Persistent mobile action bar */}
      <div className="glass-bar fixed inset-x-0 bottom-0 z-40 border-t px-3 pb-2.5 pt-2 lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate(attempt.current - 1)}
            disabled={isFirst}
            className="btn btn-outline px-3 py-2 text-[11px] disabled:opacity-40"
            aria-label="السؤال السابق"
          >
            <Icon name="arrow-right" size={14} />
            السابق
          </button>
          <button
            type="button"
            onClick={() => onNavigate(attempt.current + 1)}
            disabled={isLast}
            className="btn btn-outline px-3 py-2 text-[11px] disabled:opacity-40"
            aria-label="السؤال التالي"
          >
            التالي
            <Icon name="arrow-left" size={14} />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!complete}
            className="btn btn-primary flex-1 py-2 text-[11.5px]"
            title={complete ? "تسليم الاختبار الآن" : "أكملي جميع العناصر أولًا"}
          >
            {complete ? <Icon name="check" size={14} /> : <Icon name="lock" size={13} />}
            تسليم الاختبار
          </button>
        </div>
      </div>
    </div>
  );
}

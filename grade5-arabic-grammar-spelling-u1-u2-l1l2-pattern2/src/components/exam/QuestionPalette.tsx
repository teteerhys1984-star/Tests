import { QUESTIONS } from "../../data/questions";
import { toArabicDigits } from "../../utils/arabic";
import { Icon } from "../common/Icon";

interface QuestionPaletteProps {
  current: number;
  answers: Record<string, string[]>;
  answeredSubparts: number;
  totalSubparts: number;
  canSubmit: boolean;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  variant?: "sidebar" | "inline";
}

function stateFor(
  index: number,
  current: number,
  answers: Record<string, string[]>,
): "answered" | "partial" | "unanswered" {
  const question = QUESTIONS[index];
  const answeredParts = question.subparts.filter((part) =>
    (answers[part.id] ?? []).some((value) => value.trim().length > 0),
  ).length;
  const currentClass = index === current ? "current" : "";
  if (answeredParts === question.subparts.length) return "answered";
  if (answeredParts > 0) return "partial";
  return currentClass ? "unanswered" : "unanswered";
}

export function QuestionPalette({
  current,
  answers,
  answeredSubparts,
  totalSubparts,
  canSubmit,
  onNavigate,
  onSubmit,
  variant = "sidebar",
}: QuestionPaletteProps) {
  const remaining = totalSubparts - answeredSubparts;
  const fullyAnswered = QUESTIONS.filter((question) =>
    question.subparts.every((part) => (answers[part.id] ?? []).some((value) => value.trim().length > 0)),
  ).length;

  return (
    <div className={`${variant === "sidebar" ? "card p-4" : "card-soft p-4"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#674353]">
          <Icon name="list" size={15} className="text-[#b45c7e]" />
          خريطة الأسئلة
        </h2>
        <span className="chip chip-rose text-[10px]">
          {toArabicDigits(fullyAnswered)} / ٣٠ مكتمل
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-10 lg:grid-cols-6">
        {QUESTIONS.map((question, index) => {
          const state = stateFor(index, current, answers);
          const isCurrent = index === current;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onNavigate(index)}
              className="palette-btn"
              data-state={isCurrent ? "current" : state === "answered" ? "answered" : "partial"}
              data-answered={state === "answered"}
              aria-label={`السؤال ${question.number} - ${
                state === "answered" ? "مكتمل" : state === "partial" ? "جزئي" : "غير مجاب"
              }${isCurrent ? " - السؤال الحالي" : ""}`}
              aria-current={isCurrent ? "true" : undefined}
              title={`السؤال ${toArabicDigits(question.number)}`}
            >
              {toArabicDigits(question.number)}
              {state === "partial" ? (
                <span className="absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full bg-[#d9a441] ring-2 ring-white" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#f2e5e1] pt-2.5 text-[10px] font-semibold text-[#98838a]">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[4px] bg-gradient-to-br from-[#c9829c] to-[#ae5a7b]" /> مكتمل
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[4px] border border-[#dcc8cd] bg-[#fdf8f6]" /> غير مكتمل
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[#b45c7e] bg-white" /> الحالي
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-[#fbf4f1] px-3 py-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#7a5865]">
          <span className="flex items-center gap-1">
            <Icon name="check" size={12} /> تمت الإجابة
          </span>
          <span>{toArabicDigits(answeredSubparts)} / {toArabicDigits(totalSubparts)}</span>
        </div>
        <div className="progress-track mt-1.5 h-1.5">
          <div
            className="progress-fill"
            style={{ width: `${totalSubparts ? (answeredSubparts / totalSubparts) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-5 text-[#a18d93]">
          {remaining > 0
            ? `تبقّى ${toArabicDigits(remaining)} عنصرًا لإكمال الاختبار.`
            : "أكملتِ جميع العناصر. يمكنك التسليم الآن."}
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary mt-3 w-full py-3"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        title={canSubmit ? "تسليم الاختبار الآن" : "أجيبي عن جميع العناصر أولًا"}
      >
        {canSubmit ? <Icon name="check" size={16} /> : <Icon name="lock" size={15} />}
        تسليم الاختبار
      </button>
      <p className="mt-1.5 text-center text-[10px] text-[#a69298]">
        {canSubmit ? "التسليم مباشر ويظهر التصحيح فورًا." : "لا يمكن التسليم قبل الإجابة عن كل العناصر."}
      </p>
    </div>
  );
}

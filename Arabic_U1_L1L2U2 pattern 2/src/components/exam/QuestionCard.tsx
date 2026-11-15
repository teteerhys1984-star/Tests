import type { Question } from "../../types/exam";
import { toArabicDigits } from "../../utils/arabic";
import { Icon } from "../common/Icon";
import { SubpartInput } from "./SubpartInput";

interface QuestionCardProps {
  question: Question;
  answers: Record<string, string[]>;
  onAnswer: (subpartId: string, values: string[]) => void;
}

export function QuestionCard({ question, answers, onAnswer }: QuestionCardProps) {
  const questionMarks = question.subparts.reduce((sum, part) => sum + part.marks, 0);
  const answeredSubparts = question.subparts.filter((part) => {
    const values = answers[part.id] ?? [];
    return values.some((value) => value.trim().length > 0);
  }).length;

  return (
    <article className="card animate-rise overflow-hidden" key={question.id}>
      <header className="border-b border-[#f1e3df] bg-gradient-to-l from-[#fdf4f6] via-[#fffaf6] to-[#faf7f1] px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#a34e6d] shadow-sm ring-1 ring-[#f0d9df]">
              {toArabicDigits(question.number)}
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#a0838e]">السؤال {toArabicDigits(question.number)}</p>
              <p className="text-[13px] font-bold text-[#6d3e51]">من ٣٠ سؤالًا</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip chip-lavender">
              <Icon name="list" size={12} />
              {question.typeLabel}
            </span>
            <span className="chip chip-peach">
              <Icon name="award" size={12} />
              {toArabicDigits(questionMarks)} {questionMarks === 1 ? "درجة" : "درجات"}
            </span>
            <span className={`chip ${answeredSubparts === question.subparts.length ? "chip-mint" : "chip-muted"}`}>
              <span className="flex gap-0.5" aria-hidden="true">
                {question.subparts.map((part) => {
                  const done = (answers[part.id] ?? []).some((value) => value.trim().length > 0);
                  return (
                    <span
                      key={part.id}
                      className={`h-1.5 w-1.5 rounded-full ${done ? "bg-[#6f9c80]" : "bg-[#d9cbcd]"}`}
                    />
                  );
                })}
              </span>
              {toArabicDigits(answeredSubparts)}/{toArabicDigits(question.subparts.length)} فروع
            </span>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-7">
        <div className="mb-4 flex items-start gap-2">
          <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center text-[#c18b9e]">
            <Icon name="flower" size={18} />
          </span>
          <h2 className="font-display text-[1.25rem] font-bold leading-9 text-[#55333f] sm:text-[1.35rem]">
            {question.prompt}
          </h2>
        </div>

        <div className="space-y-2.5">
          {question.subparts.map((subpart, index) => (
            <SubpartInput
              key={subpart.id}
              subpart={subpart}
              index={index}
              values={answers[subpart.id] ?? []}
              onChange={(values) => onAnswer(subpart.id, values)}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fbf6f1] px-3 py-2 text-[11px] text-[#9e8a8f]">
          <Icon name="shield" size={13} className="text-[#b08395]" />
          تُحفظ إجابتك تلقائيًّا في هذا المتصفح. لا يظهر التصحيح إلا بعد تسليم الاختبار.
        </div>
      </div>
    </article>
  );
}

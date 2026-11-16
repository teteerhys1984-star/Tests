import { BookMarked, Ear, MessageCircleHeart, PenLine, Puzzle, SpellCheck2 } from "lucide-react";
import type { Question } from "../types";
import { questionMarks } from "../data/examData";
import { ArabicWord, GapText, PartRenderer } from "./parts";
import type { AnswerValue } from "../types";

const CATEGORY_STYLE: Record<string, { chip: string; Icon: typeof BookMarked }> = {
  Vocabulary: { chip: "bg-petal/60 text-rose-deep border-petal-deep/50", Icon: BookMarked },
  Grammar: { chip: "bg-lilac/60 text-violet-deep border-lilac-deep/50", Icon: Puzzle },
  "Reading Comprehension": { chip: "bg-peach/60 text-[#b45309] border-peach-deep/50", Icon: BookMarked },
  Phonics: { chip: "bg-sky/70 text-[#1d4ed8] border-sky/60", Icon: Ear },
  "Language Use": { chip: "bg-leaf/40 text-leaf-deep border-leaf/60", Icon: MessageCircleHeart },
  Writing: { chip: "bg-gold/30 text-[#a16207] border-gold/60", Icon: PenLine },
};

interface QuestionCardProps {
  question: Question;
  answers: Record<string, AnswerValue>;
  onAnswer: (partId: string, v: AnswerValue) => void;
}

export default function QuestionCard({ question, answers, onAnswer }: QuestionCardProps) {
  const cat = CATEGORY_STYLE[question.category] ?? CATEGORY_STYLE.Vocabulary;
  const marks = questionMarks(question);
  const multi = question.parts.length > 1;

  return (
    <article key={question.id} className="paper-card animate-rise rounded-[1.8rem] p-6 sm:p-8">
      {/* header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-violet font-display text-xl font-bold text-white shadow-soft">
            {question.id}
          </span>
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${cat.chip}`}>
              <cat.Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
              {question.category}
            </span>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">
              Lesson {question.lesson}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-gold/60 bg-gold/20 px-3.5 py-1.5 font-display text-[13px] font-bold text-[#a16207]">
          {marks} mark{marks !== 1 ? "s" : ""}
        </span>
      </div>

      {/* instruction */}
      <h2 className="mt-4 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
        {question.instruction}
      </h2>

      {/* stimulus */}
      {question.stimulus && (
        <figure className="mt-4 overflow-hidden rounded-2xl border-2 border-lilac/50 bg-gradient-to-br from-cream to-petal/20 p-5">
          {question.stimulusTitle && (
            <figcaption className="mb-2 flex items-center gap-2 font-serif text-base font-semibold italic text-violet">
              <SpellCheck2 className="h-4 w-4 not-italic" /> {question.stimulusTitle}
            </figcaption>
          )}
          <div className="space-y-2 text-[15px] leading-relaxed text-ink">
            {question.stimulus.split("\n\n").map((para, i) => (
              <p key={i}>{para.split("\n").map((line, j) => (
                <span key={j}>{line}{j < para.split("\n").length - 1 && <br />}</span>
              ))}</p>
            ))}
          </div>
        </figure>
      )}

      {/* parts */}
      <div className={multi ? "mt-5 space-y-6" : "mt-2"}>
        {question.parts.map((part) => (
          <section key={part.id} className={multi ? "rounded-2xl bg-white/40 p-4 ring-1 ring-lilac/40" : ""}>
            {part.kind !== "select" && (
              <p className="font-semibold leading-relaxed text-ink text-[15.5px] sm:text-lg">
                {multi && part.kind !== "order" && (
                  <span className="mr-2 inline-flex h-6 w-6 -translate-y-0.5 items-center justify-center rounded-full bg-lilac/60 font-display text-xs font-bold text-violet-deep">
                    {part.id}
                  </span>
                )}
                <GapText text={part.text} />
                {part.arabic && <ArabicWord word={part.arabic} />}
                {multi && (
                  <span className="ml-2 align-middle text-[11px] font-extrabold uppercase tracking-wide text-ink-soft/60">
                    {part.marks} mark{part.marks !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            )}
            {part.kind === "select" && multi && (
              <div className="mb-1 flex items-center gap-2 pl-1">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-lilac/60 font-display text-xs font-bold text-violet-deep">
                  {part.id}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft/60">
                  {part.marks} mark
                </span>
              </div>
            )}
            <PartRenderer
              part={part}
              value={answers[part.id]}
              onChange={(v) => onAnswer(part.id, v)}
              accent={cat.chip}
            />
          </section>
        ))}
      </div>
    </article>
  );
}

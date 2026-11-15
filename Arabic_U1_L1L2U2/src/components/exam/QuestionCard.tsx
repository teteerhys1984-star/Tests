import { SubpartInput as SubpartInputLazy } from './SubpartInput';
import { subKey } from '../../data/questions';
import type { AnswerValue, Answers, Question } from '../../data/types';
import { fmtMarks, toArabicDigits } from '../../utils/normalize';
import { isAnswered } from '../../utils/scoring';
import { Flower } from '../common/Decor';

interface Props {
  q: Question;
  index: number;
  answers: Answers;
  onAnswer: (key: string, v: AnswerValue | undefined) => void;
}

const SUB_LABELS = ['أ', 'ب', 'ج', 'د'];

/** Student-facing card: no source references, no hints, no feedback. */
export function QuestionCard({ q, index, answers, onAnswer }: Props) {
  const total = q.subparts.reduce((s, sp) => s + sp.marks, 0);
  return (
    <article key={q.id} className="card p-5 sm:p-8 fade-in relative overflow-hidden">
      <Flower className="absolute -bottom-6 -left-6 w-24 opacity-25" color="#e2d6fb" />
      <header className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">
          <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-blush-300 to-lav-400 text-white ml-3 align-middle">
            {toArabicDigits(index + 1)}
          </span>
          {q.instruction}
        </h2>
        <span className="shrink-0 rounded-full bg-lav-100 text-lav-600 px-3 py-1 text-sm font-bold">
          {fmtMarks(total)} درجة
        </span>
      </header>
      {q.stem && (
        <blockquote className="mb-5 rounded-2xl border-r-4 border-blush-300 bg-blush-50 px-4 py-3 text-xl leading-loose font-[family-name:var(--font-display)]">
          {q.stem}
        </blockquote>
      )}
      <div className="space-y-6">
        {q.subparts.map((sp, i) => {
          const key = subKey(q, sp.id);
          const done = isAnswered(sp, answers[key]);
          return (
            <section key={key} aria-label={`البند ${SUB_LABELS[i]}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-lg sm:text-xl leading-loose">
                  {q.subparts.length > 1 && <span className="font-bold text-blush-600 ml-2">({SUB_LABELS[i]})</span>}
                  {sp.prompt}
                </p>
                <span className={`shrink-0 text-xs rounded-full px-2 py-1 ${done ? 'bg-lav-100 text-lav-600' : 'bg-peach-100 text-blush-700'}`}>
                  {fmtMarks(sp.marks)} د · {done ? 'تمّت الإجابة' : 'لم تُجب'}
                </span>
              </div>
              <SubpartInputLazy sp={sp} value={answers[key]} onChange={(v) => onAnswer(key, v)} name={key} />
            </section>
          );
        })}
      </div>
    </article>
  );
}


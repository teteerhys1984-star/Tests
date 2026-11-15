import { useMemo } from 'react';
import { QUESTIONS } from '../../data/questions';
import type { AnswerValue, Answers } from '../../data/types';
import { useStopwatch } from '../../hooks/useStopwatch';
import { toArabicDigits } from '../../utils/normalize';
import { allSubparts, isAnswered, isQuestionComplete } from '../../utils/scoring';
import { formatHMS } from '../../utils/time';
import { IconClock, IconNext, IconPrev, IconSend } from '../common/Icons';
import { SoundToggle } from '../common/SoundToggle';
import { QuestionCard } from './QuestionCard';

interface Props {
  name: string;
  startedAt: number;
  answers: Answers;
  current: number;
  soundOn: boolean;
  onToggleSound: () => void;
  onAnswer: (key: string, v: AnswerValue | undefined) => void;
  onGo: (i: number) => void;
  onSubmit: () => void;
}

export function ExamView(p: Props) {
  const elapsed = useStopwatch(p.startedAt, null);
  const subs = useMemo(() => allSubparts(), []);
  const answeredCount = subs.filter(({ sp, key }) => isAnswered(sp, p.answers[key])).length;
  const allDone = answeredCount === subs.length;
  const pct = Math.round((answeredCount / subs.length) * 100);
  const idx = Math.min(Math.max(p.current, 0), QUESTIONS.length - 1);
  const q = QUESTIONS[idx];

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 pb-28">
      <div className="sticky top-0 z-20 pt-3 no-print">
        <div className="card px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-xs text-lav-600 font-bold">زهرة المعرفة · قواعد اللغة والإملاء</p>
            <p className="font-bold truncate">الطالبة: {p.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-lav-100 px-3 py-1.5 font-bold text-lav-600 tabular-nums" dir="ltr" aria-label="الوقت المنقضي">
              <IconClock /> {formatHMS(elapsed)}
            </span>
            <SoundToggle on={p.soundOn} onToggle={p.onToggleSound} />
          </div>
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>السؤال {toArabicDigits(idx + 1)} من {toArabicDigits(QUESTIONS.length)}</span>
              <span>أُجيب عن {toArabicDigits(answeredCount)} من {toArabicDigits(subs.length)} بندًا ({toArabicDigits(pct)}٪)</span>
            </div>
            <div className="h-2.5 rounded-full bg-blush-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-gradient-to-l from-blush-500 to-lav-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_250px] gap-4 mt-4">
        <QuestionCard key={q.id} q={q} index={idx} answers={p.answers} onAnswer={p.onAnswer} />

        <aside className="card p-4 h-fit lg:sticky lg:top-40 no-print">
          <h3 className="font-bold mb-3">التنقّل بين الأسئلة</h3>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
            {QUESTIONS.map((qq, i) => {
              const done = isQuestionComplete(qq, p.answers);
              const partial = !done && qq.subparts.some((sp) => isAnswered(sp, p.answers[`${qq.id}:${sp.id}`]));
              return (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => p.onGo(i)}
                  aria-current={i === idx ? 'step' : undefined}
                  aria-label={`السؤال ${i + 1}${done ? ' – مكتمل' : partial ? ' – مكتمل جزئيًّا' : ' – لم يُجب'}`}
                  className={`h-9 rounded-xl text-sm font-bold border-2 transition ${
                    done ? 'bg-lav-600 text-white border-lav-600'
                      : partial ? 'bg-peach-200 border-peach-200'
                      : 'bg-white border-blush-200'
                  } ${i === idx ? 'ring-2 ring-blush-500 ring-offset-2' : ''}`}
                >
                  {toArabicDigits(i + 1)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-xs">
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-lav-600" /> مكتمل</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-peach-200" /> مكتمل جزئيًّا</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-blush-200" /> لم يُجب</p>
          </div>
        </aside>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-blush-100 no-print">
        <div className="mx-auto max-w-5xl px-3 py-3 flex items-center justify-between gap-2">
          <button type="button" className="btn btn-soft" disabled={idx === 0} onClick={() => p.onGo(idx - 1)}>
            <IconPrev /> السابق
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allDone}
            onClick={p.onSubmit}
            title={allDone ? undefined : 'أجيبي عن جميع البنود لتفعيل التسليم'}
          >
            <IconSend /> تسليم الاختبار
          </button>
          <button type="button" className="btn btn-soft" disabled={idx === QUESTIONS.length - 1} onClick={() => p.onGo(idx + 1)}>
            التالي <IconNext />
          </button>
        </div>
        {!allDone && (
          <p className="text-center text-xs text-blush-700 pb-2">
            بقي {toArabicDigits(subs.length - answeredCount)} بندًا دون إجابة.
          </p>
        )}
      </nav>
    </div>
  );
}

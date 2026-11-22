import { ChevronRight, ChevronLeft, Volume2, VolumeX, Clock } from 'lucide-react';
import type { Answers, Input, Question } from '../types';
import { RichText } from './Tex';
import { Diagram, DataTable } from './diagrams';
import { PartView } from './inputs';
import { Button, Card, MarkBadge } from './ui';
import { cn } from '../utils/cn';
import { incompleteParts, isQuestionComplete, questionMaxMarks, totalParts } from '../lib/grading';
import { formatDuration } from '../lib/report';

function hasAnyAnswer(input: Input, answers: Answers): boolean {
  switch (input.kind) {
    case 'choice':
    case 'text':
      return !!(answers[input.id] && answers[input.id].trim());
    case 'tf':
      return !!(answers[`${input.id}:verdict`] || answers[`${input.id}:correction`]);
    case 'number':
      return !!(answers[`${input.id}:value`] || answers[`${input.id}:unit`] || answers[`${input.id}:steps`]);
    case 'matrix':
      return input.rows.some((r) => !!answers[`${input.id}:${r.id}`]);
  }
}

interface Props {
  questions: Question[];
  attempt: { current: number; answers: Answers };
  onChange: (key: string, value: string) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
  elapsed: number;
}

export function QuizScreen({ questions, attempt, onChange, onNavigate, onSubmit, muted, onToggleMute, elapsed }: Props) {
  const q = questions[attempt.current] ?? questions[0];
  const done = questions.filter((qq) => isQuestionComplete(qq, attempt.answers)).length;
  const remaining = questions.length - done;
  const incomplete = incompleteParts(questions, attempt.answers);
  const totalP = totalParts(questions);
  const doneP = totalP - incomplete;
  const canSubmit = incomplete === 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-blush-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <h1 className="truncate text-sm font-semibold sm:text-base">اختبار الفيزياء — الصف السابع</h1>
          <div className="ms-auto flex items-center gap-2">
            <span className="tabular inline-flex items-center gap-1.5 rounded-full bg-lilac-100 px-3 py-1.5 text-sm font-semibold text-plum-700" dir="ltr" aria-label="الوقت المنقضي">
              <Clock size={16} />
              {formatDuration(elapsed)}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'تفعيل الصوت' : 'كتم الصوت'}
              className="cursor-pointer rounded-full p-2 text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-3">
          <div className="mb-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span>
              السؤال <b className="text-ink">{q.id}</b> من {questions.length}
            </span>
            <span>
              أُجيب عن <b className="text-ink">{done}</b> سؤالاً — المتبقي <b className="text-ink">{remaining}</b>
            </span>
            <span>
              الفروع: <b className="text-ink">{doneP}</b> / {totalP}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-blush-100" role="progressbar" aria-valuemin={0} aria-valuemax={totalP} aria-valuenow={doneP}>
            <div className="h-full rounded-full bg-gradient-to-l from-plum-500 to-blush-300 transition-all duration-500" style={{ width: `${(doneP / totalP) * 100}%` }} />
          </div>
          {!canSubmit && (
            <p className="mt-1.5 text-xs text-ink-soft">أكملي الفروع المتبقية لتفعيل زر التسليم (متبقٍ {incomplete} فرع)</p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-6">
        <article>
          <header className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-plum-600 px-4 py-2 font-bold text-white">السؤال {q.id}</span>
            <h2 className="min-w-40 flex-1 text-lg font-semibold leading-8">{q.title}</h2>
            <MarkBadge marks={questionMaxMarks(q)} />
          </header>
          <Card className="p-4 sm:p-7">
            <p className="text-[17px] leading-8">
              <RichText text={q.scenario} />
            </p>
            {q.table && <DataTable table={q.table} />}
            {q.diagram && (
              <div className="mt-4 rounded-2xl bg-blush-50/50 p-2 sm:p-3">
                <Diagram id={q.diagram} />
              </div>
            )}
            <div className="mt-5 space-y-4">
              {q.parts.map((p, i) => (
                <PartView key={p.id} part={p} index={i} answers={attempt.answers} onChange={onChange} />
              ))}
            </div>
          </Card>
        </article>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-blush-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-3">
          <div className="order-2 mt-2 flex flex-wrap justify-center gap-1 sm:gap-2" role="navigation" aria-label="التنقل بين الأسئلة">
            {questions.map((qq, i) => {
              const complete = isQuestionComplete(qq, attempt.answers);
              const touched = qq.parts.some((p) => p.inputs.some((inp) => hasAnyAnswer(inp, attempt.answers)));
              return (
                <button
                  type="button"
                  key={qq.id}
                  onClick={() => onNavigate(i)}
                  aria-label={`السؤال ${qq.id}${complete ? ' (مكتمل)' : touched ? ' (مكتمل جزئياً)' : ''}`}
                  className={cn(
                    'h-8 w-8 cursor-pointer rounded-lg border-2 text-xs font-bold transition-colors sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm',
                    i === attempt.current
                      ? 'border-plum-600 bg-plum-600 text-white'
                      : complete
                        ? 'border-mint-500 bg-mint-100 text-mint-700'
                        : touched
                          ? 'border-sun-600 bg-sun-100 text-sun-600'
                          : 'border-blush-100 bg-white text-ink-soft hover:border-lilac-300',
                  )}
                >
                  {qq.id}
                </button>
              );
            })}
          </div>
          <div className="order-1 flex items-center gap-2">
            <Button variant="secondary" onClick={() => onNavigate(attempt.current - 1)} disabled={attempt.current === 0} className="flex-1 px-2 sm:flex-none sm:px-5">
              <ChevronRight size={18} />
              <span className="hidden sm:inline">السؤال السابق</span>
              <span className="sm:hidden">السابق</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate(attempt.current + 1)} disabled={attempt.current >= questions.length - 1} className="flex-1 px-2 sm:flex-none sm:px-5">
              <span className="hidden sm:inline">السؤال التالي</span>
              <span className="sm:hidden">التالي</span>
              <ChevronLeft size={18} />
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit} size="lg" className="min-w-0 flex-[1.6] px-3 sm:ms-auto sm:min-w-44 sm:flex-none">
              تسليم الاختبار
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

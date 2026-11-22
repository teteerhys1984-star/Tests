import { useMemo, useState } from 'react';
import { Download, RotateCcw, Clock, CircleCheck, CircleMinus, CircleX, ChevronDown, Volume2, VolumeX, Award } from 'lucide-react';
import type { Attempt, InputResult, Question } from '../types';
import { RichText } from './Tex';
import { Diagram } from './diagrams';
import { LETTERS } from './inputs';
import { Button, Card } from './ui';
import { cn } from '../utils/cn';
import { gradeExam } from '../lib/grading';
import { buildReport, downloadTextFile, formatDuration, reportFileName } from '../lib/report';
import { referenceLine } from '../data/teacher';

type Tone = 'correct' | 'partial' | 'wrong';

const toneText: Record<Tone, string> = { correct: 'text-mint-700', partial: 'text-sun-600', wrong: 'text-[#a9374b]' };
const toneDot: Record<Tone, string> = { correct: 'bg-mint-500', partial: 'bg-sun-600', wrong: 'bg-coral-500' };

function toneOf(ir: InputResult): Tone {
  if (ir.status === 'correct') return 'correct';
  if (ir.status === 'partial') return 'partial';
  return 'wrong';
}

function Stat({ icon: Icon, label, value, cls }: { icon: typeof Clock; label: string; value: string | number; cls?: string }) {
  return (
    <div className="bg-white px-4 py-4 text-center">
      <Icon className={cn('mx-auto mb-1', cls ?? 'text-plum-500')} size={22} />
      <p className="tabular text-xl font-bold" dir="auto">
        {value}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function Row({ label, text, tone, dir }: { label: string; text: string; tone: 'student' | 'model'; dir?: 'auto' }) {
  return (
    <div className="mt-2 flex items-start gap-2 text-sm leading-7">
      <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', tone === 'student' ? 'bg-lilac-100 text-plum-700' : 'bg-mint-100 text-mint-700')}>{label}</span>
      <span className={cn('min-w-0 flex-1 break-words', dir === 'auto' && 'whitespace-pre-wrap')} dir={dir}>
        {tone === 'model' ? <RichText text={text} /> : text || <span className="text-ink-faint">—</span>}
      </span>
    </div>
  );
}

interface Props {
  questions: Question[];
  attempt: Attempt;
  elapsed: number;
  onNewAttempt: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function ResultScreen({ questions, attempt, elapsed, onNewAttempt, muted, onToggleMute }: Props) {
  const result = useMemo(() => gradeExam(questions, attempt.answers), [questions, attempt.answers]);
  const [open, setOpen] = useState<Record<number, boolean>>(() => Object.fromEntries(questions.map((q) => [q.id, true])));
  const [confirmNew, setConfirmNew] = useState(false);

  const allOpen = questions.every((q) => open[q.id]);
  const toggleAll = () => setOpen(Object.fromEntries(questions.map((q) => [q.id, !allOpen])));
  const toggle = (id: number) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const download = () => downloadTextFile(reportFileName(attempt.studentName), buildReport(questions, attempt, result));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-l from-plum-700 via-plum-600 to-blush-500 p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm opacity-90">نتيجة الطالبة</p>
            <h1 className="text-2xl font-bold">{attempt.studentName}</h1>
            <p className="mt-1 text-sm opacity-90">اختبار الفيزياء — الصف السابع — النموذج A</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:text-end">
            <p className="tabular text-5xl font-bold" dir="ltr">
              {result.total}
              <span className="text-xl font-semibold opacity-80"> / {result.max}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 opacity-95 sm:justify-end">
              <Award size={16} />
              النسبة المئوية: <span className="tabular">{result.percentage}%</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-blush-100 sm:grid-cols-4">
          <Stat icon={Clock} label="الوقت المستغرق" value={formatDuration(elapsed)} />
          <Stat icon={CircleCheck} label="فروع صحيحة كلياً" value={result.partsCorrect} cls="text-mint-500" />
          <Stat icon={CircleMinus} label="فروع بعلامة جزئية" value={result.partsPartial} cls="text-sun-600" />
          <Stat icon={CircleX} label="فروع خاطئة" value={result.partsWrong} cls="text-coral-500" />
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={download}>
          <Download size={18} />
          تنزيل التقرير (TXT)
        </Button>
        {confirmNew ? (
          <div className="flex items-center gap-2">
            <Button variant="danger" onClick={onNewAttempt}>
              نعم، ابدأ محاولة جديدة
            </Button>
            <Button variant="ghost" onClick={() => setConfirmNew(false)}>
              إلغاء
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmNew(true)}>
            <RotateCcw size={18} />
            بدء محاولة جديدة
          </Button>
        )}
        <button type="button" onClick={onToggleMute} className="ms-auto flex cursor-pointer items-center gap-2 text-sm text-ink-soft hover:text-ink">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          الصوت: {muted ? 'مكتوم' : 'مفعّل'}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">تفاصيل الأسئلة</h2>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allOpen ? 'طي الكل' : 'عرض الكل'}
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        {questions.map((q) => {
          const qr = result.questions.find((r) => r.questionId === q.id);
          if (!qr) return null;
          const isOpen = !!open[q.id];
          const qtone: Tone = qr.marks >= qr.max ? 'correct' : qr.marks > 0 ? 'partial' : 'wrong';
          return (
            <Card key={q.id}>
              <button type="button" onClick={() => toggle(q.id)} className="flex w-full cursor-pointer items-center gap-3 p-4 text-start" aria-expanded={isOpen}>
                <span className="rounded-xl bg-lilac-100 px-3 py-1.5 text-sm font-bold text-plum-700">السؤال {q.id}</span>
                <span className="min-w-0 flex-1 font-semibold leading-6">{q.title}</span>
                <span className={cn('tabular text-sm font-bold', toneText[qtone])} dir="ltr">
                  {qr.marks} / {qr.max}
                </span>
                <ChevronDown size={20} className={cn('shrink-0 text-ink-soft transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-blush-100 p-4 sm:p-6">
                  <p className="text-sm leading-7 text-ink-soft">
                    <RichText text={q.scenario} />
                  </p>
                  {q.table && (
                    <div className="overflow-hidden rounded-2xl border border-blush-100">
                      <table className="w-full text-sm">
                        <thead className="bg-lilac-100/70">
                          <tr>
                            {q.table.head.map((h, i) => (
                              <th key={i} className="px-2 py-2 text-start">
                                <RichText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {q.table.rows.map((r, ri) => (
                            <tr key={ri}>
                              {r.map((c, ci) => (
                                <td key={ci} className="px-2 py-2">
                                  {ci === 0 ? <RichText text={c} /> : <span dir="ltr">{c}</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {q.diagram && (
                    <div className="rounded-2xl bg-blush-50/50 p-2">
                      <Diagram id={q.diagram} />
                    </div>
                  )}
                  {qr.parts.map((pr, pi) => {
                    const part = q.parts[pi];
                    if (!part) return null;
                    const ptone: Tone = pr.marks >= pr.max ? 'correct' : pr.marks > 0 ? 'partial' : 'wrong';
                    return (
                      <div key={pr.partId} className="rounded-2xl bg-blush-50/60 p-4">
                        <div className="mb-2 flex items-start gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lilac-100 text-sm font-bold text-plum-700">{LETTERS[pi] ?? ''}</span>
                          <p className="flex-1 leading-7">
                            <RichText text={part.prompt} />
                          </p>
                          <span className={cn('tabular shrink-0 text-sm font-bold', toneText[ptone])} dir="ltr">
                            {pr.marks} / {pr.max}
                          </span>
                        </div>
                        {part.diagram && (
                          <div className="mb-3 rounded-xl bg-white p-2">
                            <Diagram id={part.diagram} />
                          </div>
                        )}
                        {pr.inputs.map((ir) => {
                          const input = part.inputs.find((i) => i.id === ir.inputId);
                          if (!input) return null;
                          const itone = toneOf(ir);
                          return (
                            <div key={ir.inputId} className="mt-3 rounded-xl border border-blush-100 bg-white p-3">
                              {input.prompt && (
                                <p className="mb-1 text-sm font-medium">
                                  <RichText text={input.prompt} />
                                </p>
                              )}
                              {input.kind === 'tf' && (
                                <p className="mb-1 text-sm leading-7">
                                  <RichText text={input.statement} />
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={cn('h-2.5 w-2.5 rounded-full', toneDot[itone])} />
                                <span className={cn('text-xs font-semibold', toneText[itone])}>
                                  {ir.status === 'correct' ? 'صحيحة' : ir.status === 'partial' ? 'علامة جزئية' : ir.status === 'empty' ? 'دون إجابة' : 'خاطئة'}
                                </span>
                                <span className="tabular ms-auto text-sm font-bold" dir="ltr">
                                  {ir.marks} / {ir.max}
                                </span>
                              </div>
                              <Row label="إجابتك" text={ir.studentText} tone="student" dir="auto" />
                              <Row label="الإجابة النموذجية" text={ir.modelText} tone="model" />
                              {ir.criteria.length > 0 && (
                                <ul className="mt-2 space-y-1 rounded-xl bg-blush-50/60 p-2 text-xs leading-6">
                                  {ir.criteria.map((c, ci) => (
                                    <li key={ci} className={cn('flex items-start gap-1.5', c.earned > 0 ? 'text-mint-700' : 'text-ink-faint')}>
                                      <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', c.earned > 0 ? 'bg-mint-500' : 'bg-ink-faint')} />
                                      <span className="flex-1">{c.label}</span>
                                      <span className="tabular shrink-0" dir="ltr">
                                        {c.earned} / {c.marks}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {ir.rows && (
                                <ul className="mt-2 space-y-1 text-xs leading-6">
                                  {ir.rows.map((r, ri) => (
                                    <li key={ri} className="flex items-start gap-1.5">
                                      <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', r.earned > 0 ? 'bg-mint-500' : 'bg-coral-500')} />
                                      <span className="flex-1">
                                        {r.label}: <b>{r.student}</b>
                                        {r.earned === 0 && <span className="text-ink-soft"> — الصحيح: {r.model}</span>}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div className="rounded-2xl bg-lilac-100/60 p-4 text-sm leading-7">
                    <p className="font-semibold">تفسير الحل الصحيح:</p>
                    <p>
                      <RichText text={q.explanation} />
                    </p>
                    {q.solutionSteps && (
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-ink-soft">
                        {q.solutionSteps.map((s, i) => (
                          <li key={i}>
                            <RichText text={s} />
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <p className="text-xs leading-6 text-ink-soft">
                    <b>المرجع:</b> {referenceLine(q)}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}

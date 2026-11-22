import { useState, type FormEvent } from 'react';
import { X, Lock, Calculator, BookOpen, Image, ListChecks, KeyRound } from 'lucide-react';
import type { Question } from '../types';
import { RichText } from './Tex';
import { Button, Card, inputCls, labelCls, MarkBadge } from './ui';
import { DIAGRAM_SOURCES, GRADING_POLICY, referenceLine, TEACHER_PASSWORD } from '../data/teacher';
import { inputMaxMarks, partMaxMarks } from '../lib/grading';
import { LETTERS } from './inputs';

function Section({ icon: Icon, title, children }: { icon: typeof Lock; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac-100 text-plum-700">
          <Icon size={18} />
        </span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function TeacherArea({ onClose, questions }: { onClose: () => void; questions: Question[] }) {
  const [pw, setPw] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else setError(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="منطقة المعلم">
      <div className="mx-auto my-3 w-[calc(100%-1rem)] max-w-5xl rounded-card bg-white shadow-card sm:my-8" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-center gap-3 rounded-t-card border-b border-blush-100 bg-white/95 px-4 py-3 backdrop-blur">
          <h2 className="text-lg font-bold">منطقة المعلم</h2>
          <p className="hidden text-xs text-ink-soft sm:block">الحماية هنا client-side فقط — ليست نظام مصادقة ولا تشفيراً حقيقياً.</p>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="ms-auto cursor-pointer rounded-full p-2 text-ink-soft hover:bg-blush-50 hover:text-ink">
            <X size={20} />
          </button>
        </header>

        {!unlocked ? (
          <form onSubmit={submit} className="mx-auto max-w-sm p-8 text-center">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac-100 text-plum-700">
              <KeyRound size={26} />
            </span>
            <p className="mb-4 leading-7 text-ink-soft">أدخلي كلمة المرور للوصول إلى مفتاح الإجابات وسلم التصحيح والمراجع.</p>
            <label className="block text-start">
              <span className={labelCls}>كلمة المرور</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} autoComplete="off" autoFocus dir="ltr" />
            </label>
            {error && <p className="mt-2 text-sm text-coral-500">كلمة المرور غير صحيحة.</p>}
            <Button type="submit" className="mt-4 w-full">
              دخول
            </Button>
          </form>
        ) : (
          <div className="space-y-10 p-4 sm:p-6">
            <Section icon={ListChecks} title="سياسة التصحيح والعلامات الجزئية">
              <Card className="p-4 text-sm leading-7">
                <ul className="list-inside list-disc space-y-1.5">
                  {GRADING_POLICY.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </Card>
            </Section>

            <Section icon={KeyRound} title="مفتاح الإجابات وسلم التصحيح">
              {questions.map((q) => (
                <Card key={q.id} className="p-4 sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-plum-600 px-3 py-1 text-sm font-bold text-white">السؤال {q.id}</span>
                    <span className="font-semibold">{q.title}</span>
                    <MarkBadge marks={10} className="ms-auto" />
                  </div>
                  <p className="mb-3 text-sm leading-7 text-ink-soft">
                    <RichText text={q.scenario} />
                  </p>
                  {q.parts.map((p, pi) => (
                    <div key={p.id} className="mt-3 rounded-2xl border border-blush-100 bg-blush-50/50 p-3">
                      <div className="mb-2 flex items-start gap-2">
                        <span className="font-bold text-plum-700">{LETTERS[pi]}.</span>
                        <p className="flex-1 leading-7">
                          <RichText text={p.prompt} />
                        </p>
                        <MarkBadge marks={partMaxMarks(p)} />
                      </div>
                      <ul className="space-y-2 text-sm">
                        {p.inputs.map((input) => (
                          <li key={input.id} className="rounded-xl bg-white p-3 leading-7">
                            {input.prompt && (
                              <p className="font-medium">
                                <RichText text={input.prompt} />
                              </p>
                            )}
                            {input.kind === 'tf' && (
                              <p>
                                <RichText text={input.statement} />
                              </p>
                            )}
                            <p>
                              <b>الإجابة:</b>{' '}
                              <span dir="auto" className="whitespace-pre-wrap">
                                <RichText text={input.kind === 'matrix' ? input.rows.map((r) => `${r.label}: ${input.columns.find((c) => c.id === r.answer)?.label}`).join('؛ ') : input.kind === 'number' ? input.model : input.kind === 'text' ? input.model : input.kind === 'tf' ? (input.answer === 'true' ? 'صحيحة' : `خاطئة — التصحيح: ${input.correction?.model ?? ''}`) : input.options.find((o) => o.id === input.answer)?.label ?? ''} />
                              </span>
                              <span className="tabular ms-2 text-xs font-bold text-peach-500" dir="ltr">
                                ({inputMaxMarks(input)} ع)
                              </span>
                            </p>
                            {input.kind === 'text' && (
                              <ul className="mt-1 space-y-0.5 text-xs text-ink-soft">
                                {input.criteria.map((c, ci) => (
                                  <li key={ci} className="tabular">
                                    • {c.label} — {c.marks} ع
                                  </li>
                                ))}
                              </ul>
                            )}
                            {input.kind === 'tf' && input.correction && (
                              <ul className="mt-1 space-y-0.5 text-xs text-ink-soft">
                                <li className="tabular">• الحكم (صح/خطأ): {input.verdictMarks} ع</li>
                                {input.correction.criteria.map((c, ci) => (
                                  <li key={ci} className="tabular">
                                    • {c.label} — {c.marks} ع
                                  </li>
                                ))}
                              </ul>
                            )}
                            {input.kind === 'number' && (
                              <p className="tabular mt-1 text-xs text-ink-soft" dir="rtl">
                                العلامات: النتيجة العددية {input.marks} ع
                                {input.unit && ` + الوحدة (${input.unit.answer}) ${input.unit.marks} ع`}
                                {input.steps && ` + التعويض ${input.steps.marks} ع (يتطلب ذكر: ${input.steps.all.join('، ')})`}
                              </p>
                            )}
                            {input.kind === 'matrix' && <p className="tabular text-xs text-ink-soft">علامة لكل صف: {input.marksPerRow} ع</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="mt-3 text-sm leading-7">
                    <b>التفسير:</b> <RichText text={q.explanation} />
                  </p>
                </Card>
              ))}
            </Section>

            <Section icon={Calculator} title="خطوات الحل الحسابية">
              <Card className="space-y-3 p-4 text-sm leading-7">
                {questions
                  .filter((q) => q.solutionSteps?.length)
                  .map((q) => (
                    <div key={q.id}>
                      <p className="font-semibold">السؤال {q.id} — {q.title}</p>
                      <ol className="list-inside list-decimal text-ink-soft">
                        {q.solutionSteps?.map((s, i) => (
                          <li key={i}>
                            <RichText text={s} />
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
              </Card>
            </Section>

            <Section icon={BookOpen} title="مراجع الأسئلة (الدرس والصفحة والمهارة)">
              <Card className="divide-y divide-blush-100">
                {questions.map((q) => (
                  <p key={q.id} className="px-4 py-2 text-sm leading-7">
                    <b>السؤال {q.id}:</b> {referenceLine(q)}
                  </p>
                ))}
              </Card>
            </Section>

            <Section icon={Image} title="مصادر الرسوم">
              <Card className="divide-y divide-blush-100">
                {DIAGRAM_SOURCES.map((d) => (
                  <p key={d.id} className="px-4 py-2 text-sm leading-7">
                    <b>{d.title}</b> — {d.source}
                  </p>
                ))}
              </Card>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

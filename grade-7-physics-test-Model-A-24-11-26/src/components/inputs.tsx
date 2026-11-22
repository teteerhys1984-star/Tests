import type { Answers, Input, Part } from '../types';
import { RichText } from './Tex';
import { Diagram } from './diagrams';
import { cn } from '../utils/cn';
import { inputCls, labelCls, MarkBadge } from './ui';
import { partMaxMarks } from '../lib/grading';

export const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span className={cn('mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white', selected ? 'border-plum-600' : 'border-ink-faint')}>
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-plum-600" />}
    </span>
  );
}

function ChoiceField({ input, answers, onChange }: { input: Extract<Input, { kind: 'choice' }>; answers: Answers; onChange: (k: string, v: string) => void }) {
  const value = answers[input.id] ?? '';
  const withDiagrams = input.options.some((o) => o.diagram);
  return (
    <div>
      {input.prompt && (
        <p className="mb-2 font-medium leading-7">
          <RichText text={input.prompt} />
        </p>
      )}
      <div className={cn('grid gap-2', withDiagrams && 'grid-cols-2')}>
        {input.options.map((o) => {
          const selected = value === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 transition-colors',
                selected ? 'border-plum-500 bg-lilac-100' : 'border-blush-100 bg-white hover:border-lilac-300',
              )}
            >
              <input type="radio" name={input.id} className="sr-only" checked={selected} onChange={() => onChange(input.id, o.id)} />
              {o.diagram ? (
                <div className="w-full">
                  <div className="mb-1 flex items-center gap-2">
                    <RadioDot selected={selected} />
                    <span className="text-sm font-medium">{o.label}</span>
                  </div>
                  <div className="rounded-xl bg-white p-1">
                    <Diagram id={o.diagram} />
                  </div>
                </div>
              ) : (
                <>
                  <RadioDot selected={selected} />
                  <span className="leading-7">
                    <RichText text={o.label} />
                  </span>
                </>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseField({ input, answers, onChange }: { input: Extract<Input, { kind: 'tf' }>; answers: Answers; onChange: (k: string, v: string) => void }) {
  const verdict = answers[`${input.id}:verdict`] ?? '';
  const correction = answers[`${input.id}:correction`] ?? '';
  const options: { v: 'true' | 'false'; label: string }[] = [
    { v: 'true', label: 'صحيحة' },
    { v: 'false', label: 'خاطئة' },
  ];
  return (
    <div>
      <p className="mb-3 rounded-2xl bg-blush-50 px-4 py-3 font-medium leading-8">
        <RichText text={input.statement} />
      </p>
      <div className="flex gap-2">
        {options.map((o) => {
          const active = verdict === o.v;
          return (
            <button
              type="button"
              key={o.v}
              aria-pressed={active}
              onClick={() => onChange(`${input.id}:verdict`, o.v)}
              className={cn(
                'flex-1 cursor-pointer rounded-2xl border-2 px-4 py-3 font-semibold transition-colors',
                active
                  ? o.v === 'true'
                    ? 'border-mint-500 bg-mint-100 text-mint-700'
                    : 'border-coral-500 bg-coral-100 text-[#a9374b]'
                  : 'border-blush-100 bg-white hover:border-lilac-300',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {verdict === 'false' && input.correction && (
        <label className="mt-3 block">
          <span className={labelCls}>اكتبي التصحيح:</span>
          <textarea rows={2} value={correction} onChange={(e) => onChange(`${input.id}:correction`, e.target.value)} className={inputCls} placeholder="العبارة الصحيحة هي…" />
        </label>
      )}
    </div>
  );
}

function TextField({ input, answers, onChange }: { input: Extract<Input, { kind: 'text' }>; answers: Answers; onChange: (k: string, v: string) => void }) {
  return (
    <div>
      {input.prompt && (
        <p className="mb-1.5 font-medium leading-7">
          <RichText text={input.prompt} />
        </p>
      )}
      <textarea rows={input.rows ?? 2} value={answers[input.id] ?? ''} onChange={(e) => onChange(input.id, e.target.value)} className={inputCls} placeholder={input.placeholder} />
    </div>
  );
}

function NumberField({ input, answers, onChange }: { input: Extract<Input, { kind: 'number' }>; answers: Answers; onChange: (k: string, v: string) => void }) {
  const value = answers[`${input.id}:value`] ?? '';
  const unit = answers[`${input.id}:unit`] ?? '';
  const steps = answers[`${input.id}:steps`] ?? '';
  return (
    <div>
      {input.prompt && (
        <p className="mb-2 font-medium leading-7">
          <RichText text={input.prompt} />
        </p>
      )}
      <div className="space-y-3">
        {input.steps && (
          <label className="block">
            <span className={labelCls}>خطوة الحل (التعويض):</span>
            <textarea rows={2} value={steps} onChange={(e) => onChange(`${input.id}:steps`, e.target.value)} className={inputCls} placeholder="مثال: القانون ثم التعويض بالقيم" />
          </label>
        )}
        <div className="flex items-end gap-2">
          <label className="block flex-1">
            <span className={labelCls}>النتيجة العددية</span>
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={value}
              onChange={(e) => onChange(`${input.id}:value`, e.target.value)}
              className={cn(inputCls, 'tabular')}
              placeholder={input.placeholder}
              autoComplete="off"
            />
          </label>
          {input.unit && (
            <label className="block w-32 shrink-0">
              <span className={labelCls}>الوحدة</span>
              <select value={unit} onChange={(e) => onChange(`${input.id}:unit`, e.target.value)} className={inputCls}>
                <option value="">اختيار</option>
                {input.unit.options.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function MatrixField({ input, answers, onChange }: { input: Extract<Input, { kind: 'matrix' }>; answers: Answers; onChange: (k: string, v: string) => void }) {
  const cols = `minmax(0,1.3fr) repeat(${input.columns.length}, minmax(0,1fr))`;
  return (
    <div>
      {input.prompt && (
        <p className="mb-2 font-medium leading-7">
          <RichText text={input.prompt} />
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-blush-100">
        <div className="hidden bg-lilac-100/60 px-4 py-2 text-sm font-semibold sm:grid" style={{ gridTemplateColumns: cols }}>
          <span>الحالة</span>
          {input.columns.map((c) => (
            <span key={c.id} className="text-center">
              {c.label}
            </span>
          ))}
        </div>
        {input.rows.map((r, i) => {
          const current = answers[`${input.id}:${r.id}`] ?? '';
          return (
            <div key={r.id} className={cn('border-t border-blush-100 px-4 py-3', i % 2 ? 'bg-white' : 'bg-blush-50/40')}>
              <div className="sm:grid sm:items-center" style={{ gridTemplateColumns: cols }}>
                <p className="mb-2 leading-7 sm:mb-0">{r.label}</p>
                <div className="flex flex-wrap gap-2 sm:justify-center">
                  {input.columns.map((c) => {
                    const selected = current === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        aria-pressed={selected}
                        onClick={() => onChange(`${input.id}:${r.id}`, c.id)}
                        className={cn(
                          'cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors',
                          selected ? 'border-plum-600 bg-plum-600 text-white' : 'border-blush-100 bg-white hover:border-lilac-300',
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InputField({ input, answers, onChange }: { input: Input; answers: Answers; onChange: (k: string, v: string) => void }) {
  switch (input.kind) {
    case 'choice':
      return <ChoiceField input={input} answers={answers} onChange={onChange} />;
    case 'tf':
      return <TrueFalseField input={input} answers={answers} onChange={onChange} />;
    case 'text':
      return <TextField input={input} answers={answers} onChange={onChange} />;
    case 'number':
      return <NumberField input={input} answers={answers} onChange={onChange} />;
    case 'matrix':
      return <MatrixField input={input} answers={answers} onChange={onChange} />;
  }
}

export function PartView({ part, index, answers, onChange }: { part: Part; index: number; answers: Answers; onChange: (k: string, v: string) => void }) {
  return (
    <section className="rounded-2xl border border-blush-100 bg-white/80 p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-100 font-bold text-plum-700">{LETTERS[index] ?? ''}</span>
        <p className="flex-1 pt-0.5 text-[17px] leading-8">
          <RichText text={part.prompt} />
        </p>
        <MarkBadge marks={partMaxMarks(part)} />
      </div>
      {part.diagram && (
        <div className="mb-4 rounded-2xl bg-white p-2 sm:p-3">
          <Diagram id={part.diagram} />
        </div>
      )}
      <div className="space-y-5">
        {part.inputs.map((input) => (
          <InputField key={input.id} input={input} answers={answers} onChange={onChange} />
        ))}
      </div>
    </section>
  );
}

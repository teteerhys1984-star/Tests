import type { AnswerValue, Subpart } from '../../data/types';
import { toArabicDigits } from '../../utils/normalize';

interface Props {
  sp: Subpart;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue | undefined) => void;
  name: string;
}

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز'];

function Bullet({ selected, square }: { selected: boolean; square?: boolean }) {
  return (
    <span
      className={`grid place-items-center shrink-0 w-6 h-6 border-2 ${square ? 'rounded-md' : 'rounded-full'} ${
        selected ? 'border-lav-600 bg-lav-600' : 'border-blush-300 bg-white'
      }`}
      aria-hidden="true"
    >
      {selected && <span className={`bg-white ${square ? 'w-2.5 h-2.5 rounded-sm' : 'w-2.5 h-2.5 rounded-full'}`} />}
    </span>
  );
}

export function SubpartInput({ sp, value, onChange, name }: Props) {
  if (sp.kind === 'mcq') {
    return (
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
        {sp.options.map((o, i) => {
          const sel = value === i;
          return (
            <button key={i} type="button" role="radio" aria-checked={sel} data-selected={sel} className="option" onClick={() => onChange(i)}>
              <Bullet selected={sel} />
              <span className="text-blush-600 font-bold">{LETTERS[i]}.</span>
              <span className="text-lg">{o}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (sp.kind === 'multi') {
    const arr = Array.isArray(value) ? (value as number[]) : [];
    return (
      <div>
        <p className="text-sm text-lav-600 mb-2">(يمكن اختيار أكثر من إجابة)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sp.options.map((o, i) => {
            const sel = arr.includes(i);
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={sel}
                data-selected={sel}
                className="option"
                onClick={() => {
                  const next = sel ? arr.filter((x) => x !== i) : [...arr, i].sort((a, b) => a - b);
                  onChange(next.length ? next : undefined);
                }}
              >
                <Bullet selected={sel} square />
                <span className="text-lg">{o}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (sp.kind === 'text') {
    return (
      <input
        type="text"
        dir="rtl"
        lang="ar"
        aria-label={sp.prompt}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        placeholder={sp.placeholder ?? 'اكتبي إجابتكِ هنا'}
        className="w-full rounded-2xl border-2 border-blush-200 bg-white px-4 py-3 text-xl outline-none focus:border-lav-400"
        autoComplete="off"
        spellCheck={false}
      />
    );
  }

  // group
  const arr: (number | null)[] = Array.isArray(value) ? (value as (number | null)[]) : sp.items.map(() => null);
  return (
    <div className="grid gap-2">
      {sp.items.map((it, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl bg-peach-100/60 border border-peach-200 p-3">
          <span className="font-bold text-lg sm:w-56 shrink-0">
            <span className="text-blush-600 ml-1">{toArabicDigits(i + 1)}.</span> {it.label}
          </span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={it.label}>
            {sp.choices.map((c, ci) => {
              const sel = arr[i] === ci;
              return (
                <button
                  key={ci}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  name={`${name}-${i}`}
                  onClick={() => {
                    const next = [...arr];
                    while (next.length < sp.items.length) next.push(null);
                    next[i] = ci;
                    onChange(next);
                  }}
                  className={`rounded-full px-4 py-1.5 border-2 text-base transition ${
                    sel ? 'bg-lav-600 border-lav-600 text-white' : 'bg-white border-blush-200 hover:border-blush-300'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

import { Info } from 'lucide-react';
import type { AnswerValue, ExamPart, ExamQuestion, AnswerMap } from '../types';
import Clock from './Clock';

interface QuestionCardProps {
  question: ExamQuestion;
  answers: AnswerMap;
  onAnswer: (partId: string, value: AnswerValue) => void;
}

function str(answers: AnswerMap, id: string): string {
  const v = answers[id];
  return typeof v === 'string' ? v : Array.isArray(v) ? v.join(' ') : '';
}

function MarksChip({ marks }: { marks: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-gold-200 bg-gold-100 px-2.5 py-0.5 text-[11px] font-extrabold text-gold-600"
      title={`${marks} mark${marks === 1 ? '' : 's'}`}
    >
      {marks} {marks === 1 ? 'mark' : 'marks'}
    </span>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pine-900 font-display text-sm font-bold text-cream">
      {n}
    </span>
  );
}

/* ================= ordering (tap-to-build) sub-component ================= */

function OrderPart({ part, index, value, onChange }: { part: ExamPart; index: number; value: number[] | undefined; onChange: (v: number[]) => void }) {
  const tokens = part.tokens ?? [];
  const selected = Array.isArray(value) ? value : [];
  const placed = new Set(selected);
  const built = selected.map((i) => tokens[i]).filter(Boolean);

  const addToken = (idx: number) => {
    if (placed.has(idx)) return;
    onChange([...selected, idx]);
  };
  const removeToken = (idx: number) => onChange(selected.filter((i) => i !== idx));
  const clear = () => onChange([]);

  return (
    <div className="rounded-2xl border border-pine-100 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-extrabold text-pine-900">
          <NumberBadge n={index + 1} /> {part.prompt}
        </p>
        <MarksChip marks={part.marks} />
      </div>

      {/* built sentence strip */}
      <div aria-label={`Your sentence for ${part.prompt}`} className="mt-3 flex min-h-[3.25rem] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-pine-200 bg-pine-50/60 p-2">
        {built.length === 0 ? (
          <span className="px-2 text-sm font-semibold text-ink-soft/80">Tap the word chips below to build the sentence…</span>
        ) : (
          built.map((tok, pos) => {
            const originalIndex = selected[pos];
            return (
              <button
                key={`${originalIndex}-${pos}`}
                type="button"
                onClick={() => removeToken(originalIndex)}
                aria-label={`Remove ${tok}`}
                className="rounded-full bg-pine-900 px-3.5 py-1.5 text-base font-bold text-cream shadow-sm transition-transform hover:scale-105"
              >
                {tok}
              </button>
            );
          })
        )}
      </div>

      {/* word pool */}
      <div className="mt-2 flex flex-wrap gap-2 p-1">
        {tokens.map((tok, idx) =>
          placed.has(idx) ? null : (
            <button
              key={idx}
              type="button"
              onClick={() => addToken(idx)}
              className="rounded-full border-2 border-pine-200 bg-white px-3.5 py-1.5 text-base font-bold text-pine-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pine-500"
            >
              {tok}
            </button>
          ),
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink-soft" aria-live="polite">
          {built.length} of {tokens.length} words placed
        </span>
        {built.length > 0 && (
          <button type="button" onClick={clear} className="text-xs font-extrabold uppercase tracking-wide text-coral-600 underline underline-offset-2 hover:text-coral-700">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================ main component ============================ */

export default function QuestionCard({ question, answers, onAnswer }: QuestionCardProps) {
  const q = question;

  const renderParts = () => {
    switch (q.kind) {
      /* ------------------------------ vocabulary ------------------------------ */
      case 'vocab':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-2xl border border-pine-100 bg-white/70 p-3 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                  <NumberBadge n={i + 1} />
                  <span lang="ar" dir="rtl" className="arabic-prompt rounded-xl border border-gold-200 bg-gold-100/70 px-4 py-1.5 text-xl font-bold leading-snug text-ink">
                    {p.prompt}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <label className="sr-only" htmlFor={p.id}>English meaning of vocabulary item {i + 1}</label>
                  <input
                    id={p.id}
                    type="text"
                    className="field"
                    placeholder={p.placeholder ?? 'English word…'}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={str(answers, p.id)}
                    onChange={(e) => onAnswer(p.id, e.target.value)}
                  />
                  <MarksChip marks={p.marks} />
                </div>
              </li>
            ))}
          </ol>
        );

      /* ----------------------- cloze (fill in the blank) ---------------------- */
      case 'cloze':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => (
              <li key={p.id} className="flex items-start gap-2.5 rounded-2xl border border-pine-100 bg-white/70 p-3 shadow-sm sm:items-center sm:p-4">
                <NumberBadge n={i + 1} />
                <p className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 text-base font-semibold leading-relaxed text-ink sm:text-lg">
                  {p.before && <span>{p.before}</span>}
                  <label className="sr-only" htmlFor={p.id}>Answer for item {i + 1}</label>
                  <input
                    id={p.id}
                    type="text"
                    className="field-inline w-28"
                    placeholder={p.placeholder ?? '…'}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={str(answers, p.id)}
                    onChange={(e) => onAnswer(p.id, e.target.value)}
                  />
                  {p.after && <span>{p.after}</span>}
                  {p.hint && <span className="rounded-md bg-pine-50 px-1.5 py-0.5 text-xs font-extrabold text-pine-800">({p.hint})</span>}
                </p>
                <MarksChip marks={p.marks} />
              </li>
            ))}
          </ol>
        );

      /* -------------------------------- matching ------------------------------ */
      case 'match':
        return (
          <div className="overflow-hidden rounded-2xl border border-pine-100 shadow-sm">
            <div aria-hidden="true" className="hidden grid-cols-[1fr_1.15fr_auto] gap-3 border-b border-pine-100 bg-pine-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-pine-800 md:grid">
              <span>Find the prompt</span>
              <span>Choose the best answer</span>
              <span className="text-right">Marks</span>
            </div>
            <ol className="divide-y divide-pine-100">
              {q.parts.map((p, i) => {
                const value = str(answers, p.id);
                return (
                  <li key={p.id} className="grid gap-2 bg-white/70 p-3 sm:p-4 md:grid-cols-[1fr_1.15fr_auto] md:items-center md:gap-3">
                    <label htmlFor={p.id} className="flex items-center gap-2.5 font-bold text-pine-900">
                      <NumberBadge n={i + 1} />
                      <span>{p.prompt}</span>
                    </label>
                    <select id={p.id} className="field" value={value} onChange={(e) => onAnswer(p.id, e.target.value)}>
                      <option value="">Choose…</option>
                      {(p.options ?? []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <span className="justify-self-start md:justify-self-end">
                      <MarksChip marks={p.marks} />
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );

      /* ------------------- choice (two-option inline chips) ------------------- */
      case 'choice':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => {
              const current = str(answers, p.id);
              return (
                <li key={p.id} className="flex items-start gap-2.5 rounded-2xl border border-pine-100 bg-white/70 p-3 shadow-sm sm:items-center sm:p-4">
                  <NumberBadge n={i + 1} />
                  <p className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-2 text-base font-semibold leading-relaxed text-ink sm:text-lg">
                    {p.before && <span>{p.before}</span>}
                    <span role="radiogroup" aria-label={`Choose one option for item ${i + 1}`} className="inline-flex flex-wrap gap-1.5">
                      {(p.options ?? []).map((opt) => {
                        const active = current === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onAnswer(p.id, opt)}
                            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition-all sm:text-base ${
                              active
                                ? 'border-pine-900 bg-pine-900 text-cream shadow-md'
                                : 'border-pine-200 bg-white text-pine-800 hover:border-pine-500'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </span>
                    {p.after && <span>{p.after}</span>}
                  </p>
                  <MarksChip marks={p.marks} />
                </li>
              );
            })}
          </ol>
        );

      /* ------------------------------ multiple choice ------------------------- */
      case 'mcq':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => {
              const current = str(answers, p.id);
              return (
                <li key={p.id} className="rounded-2xl border border-pine-100 bg-white/70 p-3 shadow-sm sm:p-4">
                  <div className="flex items-center gap-2.5">
                    <NumberBadge n={i + 1} />
                    <p className="flex-1 text-base font-semibold leading-relaxed text-ink sm:text-lg">
                      {p.before && <span>{p.before} </span>}
                      <span className="inline-block min-w-[3rem] border-b-[3px] border-dotted border-pine-300 text-center font-extrabold text-pine-800">
                        {current || '?'}
                      </span>
                      {p.after && <span> {p.after}</span>}
                    </p>
                    <MarksChip marks={p.marks} />
                  </div>
                  <div role="radiogroup" aria-label={`Options for item ${i + 1}`} className="mt-2.5 grid grid-cols-2 gap-2 pl-9 sm:max-w-sm">
                    {(p.options ?? []).map((opt) => {
                      const active = current === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => onAnswer(p.id, opt)}
                          className={`flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 font-display text-lg font-bold transition-all ${
                            active
                              ? 'border-pine-900 bg-pine-900 text-cream shadow-md'
                              : 'border-pine-200 bg-white text-pine-800 hover:border-pine-500'
                          }`}
                        >
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-gold-400 bg-gold-400' : 'border-pine-200'}`} aria-hidden="true">
                            {active && <span className="h-2 w-2 rounded-full bg-pine-950" />}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
        );

      /* ------------------------------- tell the time ------------------------- */
      case 'clock':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-pine-100 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                <div className="flex items-center justify-center gap-3 sm:w-auto">
                  <NumberBadge n={i + 1} />
                  {p.clock && <Clock hour={p.clock.hour} minute={p.clock.minute} label={`Analog clock number ${i + 1}`} />}
                </div>
                <div className="w-full sm:flex-1">
                  <label htmlFor={p.id} className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-soft">
                    Write the time
                  </label>
                  <input
                    id={p.id}
                    type="text"
                    className="field mt-1 text-lg font-bold text-pine-900"
                    placeholder="It’s…"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={str(answers, p.id)}
                    onChange={(e) => onAnswer(p.id, e.target.value)}
                  />
                </div>
                <MarksChip marks={p.marks} />
              </li>
            ))}
          </ol>
        );

      /* ------------------------------ sentence ordering ----------------------- */
      case 'order':
        return (
          <div className="space-y-4">
            {q.parts.map((p, i) => (
              <OrderPart
                key={p.id}
                part={p}
                index={i}
                value={Array.isArray(answers[p.id]) ? (answers[p.id] as number[]) : undefined}
                onChange={(v) => onAnswer(p.id, v)}
              />
            ))}
          </div>
        );

      /* ----------------------------- fix the mistake -------------------------- */
      case 'fix':
        return (
          <ol className="space-y-3">
            {q.parts.map((p, i) => (
              <li key={p.id} className="rounded-2xl border border-pine-100 bg-white/70 p-3 shadow-sm sm:p-4">
                <div className="flex items-start gap-2.5">
                  <NumberBadge n={i + 1} />
                  <p className="flex-1 text-base font-semibold leading-loose text-ink sm:text-lg">
                    {p.before && <span>{p.before} </span>}
                    <u className="decoration-coral-500 decoration-[3px] underline-offset-[6px]">{p.wrongWord}</u>
                    {p.after && <span> {p.after}</span>}
                  </p>
                  <MarksChip marks={p.marks} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
                  <label htmlFor={p.id} className="text-xs font-extrabold uppercase tracking-[0.14em] text-pine-800">
                    Correct word:
                  </label>
                  <input
                    id={p.id}
                    type="text"
                    className="field-inline w-40 text-left"
                    placeholder={p.placeholder ?? 'correct word…'}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={str(answers, p.id)}
                    onChange={(e) => onAnswer(p.id, e.target.value)}
                  />
                </div>
              </li>
            ))}
          </ol>
        );
    }
  };

  return (
    <article aria-labelledby={`question-${q.id}-title`} className="card overflow-hidden">
      {/* question header */}
      <header className="border-b border-pine-100 bg-gradient-to-br from-pine-50 via-paper to-gold-100/40 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pine-900 font-display text-2xl font-extrabold text-gold-400 shadow-md sm:h-16 sm:w-16 sm:text-3xl"
          >
            {q.id}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={`question-${q.id}-title`} className="font-display text-lg font-bold leading-tight text-pine-900 sm:text-2xl">
              {q.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-gold-200 bg-gold-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gold-600 sm:text-[11px]">
                {q.lessons}
              </span>
              <span className="rounded-full border border-pine-100 bg-pine-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-pine-800 sm:text-[11px]">
                {q.skill}
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-pine-200 bg-white px-3 py-1.5 text-center shadow-sm">
            <span className="block font-display text-lg font-extrabold leading-none text-pine-900 sm:text-2xl">{q.marks}</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-ink-soft">marks</span>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-pine-100 bg-white/80 px-3 py-2 text-[13px] font-semibold leading-snug text-ink-soft sm:text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-pine-700" aria-hidden="true" />
          <span>{q.instructions}</span>
        </p>
      </header>

      {/* question body */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">{renderParts()}</div>
    </article>
  );
}

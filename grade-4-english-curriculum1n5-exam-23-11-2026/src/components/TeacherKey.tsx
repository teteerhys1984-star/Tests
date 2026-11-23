import { useMemo, useState } from 'react';
import { KeyRound, Lock, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { QUESTIONS, TOTAL_MARKS } from '../data/exam';

const TEACHER_PASSWORD = 'somer173';

interface TeacherKeyProps {
  /** inline = rendered inside a page panel; modal = overlay style with close */
  inline?: boolean;
  onClose?: () => void;
}

/**
 * Hidden teacher area. Protected by a basic client-side password barrier —
 * this is NOT real authentication or encryption; it only keeps the key away
 * from casual view during student use.
 */
export default function TeacherKey({ onClose }: TeacherKeyProps) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  const distribution = useMemo(() => QUESTIONS.map((q) => ({ id: q.id, title: q.title, marks: q.marks })), []);
  const vocabMarks = QUESTIONS.filter((q) => q.kind === 'vocab').reduce((s, q) => s + q.marks, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!unlocked) {
    return (
      <div className="card relative mx-auto w-full max-w-md p-6 sm:p-7">
        {onClose && (
          <button onClick={onClose} aria-label="Close teacher area" className="absolute right-3 top-3 rounded-full p-2 text-ink-soft transition-colors hover:bg-pine-50 hover:text-pine-900">
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-900 text-gold-400">
          <KeyRound className="h-7 w-7" />
        </div>
        <h3 className="text-center font-display text-2xl font-bold text-pine-900">Teacher Answer Key</h3>
        <p className="mt-1 text-center text-sm font-semibold text-ink-soft">
          Enter the teacher password to view all answers, mark distribution, accepted alternatives and lesson references.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label htmlFor="teacher-password" className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
            Teacher password
          </label>
          <input
            id="teacher-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="field text-center tracking-[0.3em]"
            placeholder="••••••••"
            autoFocus
          />
          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border-2 border-coral-200 bg-coral-100 px-3 py-2 text-sm font-bold text-coral-700">
              <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <button type="submit" className="btn btn-pine w-full px-6 py-3 text-base">
            <Lock className="h-5 w-5" /> Unlock answer key
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] leading-snug text-ink-soft">
          Basic client-side access barrier only — not real authentication or encryption. Keep the password away from students.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-pine-100 bg-pine-900 px-5 py-4 text-cream sm:px-7">
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-bold">
              <KeyRound className="h-5 w-5 text-gold-400" /> Teacher Answer Key
            </p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.16em] text-gold-200">
              English Exam — Grade 4 · Unit 1 · Lessons 1–6 · Total {TOTAL_MARKS} marks
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close teacher area" className="rounded-full p-2 text-cream/80 transition-colors hover:bg-white/10 hover:text-cream">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          {/* Mark distribution */}
          <section aria-labelledby="tkey-dist">
            <h4 id="tkey-dist" className="font-display text-lg font-bold text-pine-900">Mark distribution</h4>
            <div className="nice-scroll mt-2 overflow-x-auto rounded-xl border border-pine-100">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="bg-pine-50 text-left text-pine-900">
                    <th scope="col" className="px-3 py-2 font-extrabold">#</th>
                    <th scope="col" className="px-3 py-2 font-extrabold">Question</th>
                    <th scope="col" className="px-3 py-2 font-extrabold">Skill</th>
                    <th scope="col" className="px-3 py-2 text-right font-extrabold">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.map((d) => (
                    <tr key={d.id} className="border-t border-pine-100">
                      <td className="px-3 py-1.5 font-bold text-pine-800">Q{d.id}</td>
                      <td className="px-3 py-1.5 font-semibold">{d.title}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{QUESTIONS[d.id - 1].skill}</td>
                      <td className="px-3 py-1.5 text-right font-extrabold text-pine-900">{d.marks}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-pine-200 bg-gold-100/60 font-extrabold text-pine-900">
                    <td className="px-3 py-2" colSpan={3}>TOTAL (Vocabulary {vocabMarks} + other nine questions {TOTAL_MARKS - vocabMarks})</td>
                    <td className="px-3 py-2 text-right">{TOTAL_MARKS}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Per-question answers */}
          <section aria-labelledby="tkey-answers" className="space-y-4">
            <h4 id="tkey-answers" className="font-display text-lg font-bold text-pine-900">Correct answers & accepted alternatives</h4>
            {QUESTIONS.map((q) => (
              <details key={q.id} className="group rounded-2xl border border-pine-100 bg-paper">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pine-900 font-display text-sm font-bold text-cream">
                      {q.id}
                    </span>
                    <span>
                      <span className="block font-extrabold text-pine-900">{q.title}</span>
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-soft">{q.lessons} · {q.marks} marks</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-pine-50 px-2.5 py-1 text-xs font-extrabold text-pine-800">{q.marks} marks</span>
                </summary>
                <div className="border-t border-pine-100 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Source · {q.reference}</p>
                  <ol className="mt-2 space-y-1.5 text-sm">
                    {q.parts.map((p, i) => (
                      <li key={p.id} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 rounded-lg bg-pine-50/60 px-2 py-1.5">
                        <span className="font-extrabold text-pine-800">{i + 1}.</span>
                        <span>
                          <span className="font-semibold text-ink">{p.displayAnswer}</span>
                          {p.accepted.length > 1 && (
                            <span className="block text-xs font-semibold text-ink-soft">
                              Also accepts: {p.accepted.slice(1).join(' · ')}
                            </span>
                          )}
                          <span className="block text-[11px] text-ink-soft/90">{p.reference}</span>
                        </span>
                        <span className="whitespace-nowrap text-xs font-extrabold text-leaf-700">+{p.marks}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </section>

          {/* Marking rules */}
          <section aria-labelledby="tkey-rules" className="rounded-2xl border border-gold-200 bg-gold-100/50 px-5 py-4">
            <h4 id="tkey-rules" className="flex items-center gap-2 font-display text-lg font-bold text-pine-900">
              <CheckCircle2 className="h-5 w-5 text-gold-600" /> Marking rules (applied automatically)
            </h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-6 text-sm font-semibold text-ink">
              <li>Answers are compared without case sensitivity; extra spaces and a trailing full stop are ignored; curly apostrophes are treated as straight apostrophes.</li>
              <li>Vocabulary questions: a single-character typo is accepted only for English answers of six letters or more. Short answers such as <em>tall</em>, <em>farm</em>, <em>river</em>, <em>name</em> and <em>blond</em> must be spelled exactly.</li>
              <li>Fill-in and fix questions also accept the full corrected sentence when it contains the required key word (for example, writing “She is my friend.” earns the mark for <em>is</em>).</li>
              <li>Telling the time: full marks for the taught wording (half past six / quarter to six / three o’clock) or the exact digits (6:30 / 5:45 / 3:00). Half marks when the right hour is paired with “to” instead of “past” (or the reverse) on quarter-past/quarter-to items. No credit for “o’clock” items with wrong wording.</li>
              <li>Sentence ordering: full marks only for the exact word order. If every required word is present but in the wrong order, 2 of the 5 marks are awarded. Otherwise zero.</li>
              <li>Matching questions: the option must match the official answer exactly; blank answers score zero.</li>
              <li>Partial credit is awarded only where listed above; all other items are all-or-nothing. Unanswered items score zero.</li>
              <li>Recommended award bands: 90–100 Excellent · 75–89 Great · 60–74 Good · 40–59 Fair · below 40 — revisit Unit 1 before retaking.</li>
            </ul>
          </section>

          <p className="text-center text-[11px] leading-snug text-ink-soft">
            This area is a basic client-side access barrier, not real authentication or encryption. It is shown only after a submission or behind the teacher password — never to students during an active attempt.
          </p>
        </div>
      </div>
    </div>
  );
}

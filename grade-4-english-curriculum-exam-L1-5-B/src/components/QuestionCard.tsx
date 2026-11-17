import React from 'react';
import { BookOpen, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { CURRICULUM_PASSAGES } from '../data/passages';
import { ExamQuestion, QuestionSubPart, StudentAnswerMap } from '../types/exam';
import {
  buildReorderSentence,
  formatMark,
  isSubPartAnswered,
  makeSubPartKey,
} from '../utils/scoring';
import { AnalogueClock } from './AnalogueClock';
import { HouseIllustration } from './HouseIllustration';

interface QuestionCardProps {
  question: ExamQuestion;
  examNumber: number;
  answers: StudentAnswerMap;
  onChangeAnswer: (subPartKey: string, value: string | number[]) => void;
}

const ACCENT_PALETTES = [
  {
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    numBg: 'from-cyan-500 to-sky-500',
    topBar: 'from-cyan-400 via-sky-400 to-teal-400',
  },
  {
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    numBg: 'from-rose-500 to-orange-400',
    topBar: 'from-rose-400 via-orange-400 to-amber-400',
  },
  {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    numBg: 'from-emerald-500 to-teal-500',
    topBar: 'from-emerald-400 via-teal-400 to-cyan-400',
  },
  {
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    numBg: 'from-violet-500 to-purple-500',
    topBar: 'from-violet-400 via-purple-400 to-fuchsia-400',
  },
  {
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    numBg: 'from-amber-500 to-orange-500',
    topBar: 'from-yellow-400 via-amber-400 to-orange-400',
  },
];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  examNumber,
  answers,
  onChangeAnswer,
}) => {
  const palette = ACCENT_PALETTES[(examNumber - 1) % ACCENT_PALETTES.length];
  const passage = question.passageId ? CURRICULUM_PASSAGES[question.passageId] : null;
  const isClockGrid = question.subParts.every((sp) => Boolean(sp.clock));
  const isTableGrid = question.subParts.every((sp) => Boolean(sp.tableContext));

  const renderReorderControl = (sp: QuestionSubPart, key: string) => {
    const words = sp.scrambledWords ?? [];
    const selected: number[] = Array.isArray(answers[key]) ? (answers[key] as number[]) : [];
    const selectedSet = new Set(selected);
    const preview = buildReorderSentence(sp, selected);
    const complete = selected.length === words.length;

    const handleAddWord = (idx: number) => {
      if (selectedSet.has(idx)) return;
      onChangeAnswer(key, [...selected, idx]);
    };

    const handleRemoveAt = (position: number) => {
      const next = selected.slice();
      next.splice(position, 1);
      onChangeAnswer(key, next);
    };

    const handleReset = () => {
      onChangeAnswer(key, []);
    };

    return (
      <div className="mt-3 space-y-3">
        {/* Available word bank */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            Tap each word in order:
          </p>
          <div className="flex flex-wrap gap-2">
            {words.map((word, idx) => {
              const used = selectedSet.has(idx);
              return (
                <button
                  key={`${sp.id}-word-${idx}`}
                  type="button"
                  disabled={used}
                  onClick={() => handleAddWord(idx)}
                  className={`rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    used
                      ? 'border-dashed border-slate-200 bg-slate-50 text-slate-300 cursor-default'
                      : 'border-sky-300 bg-sky-50 text-sky-900 shadow-sm hover:-translate-y-0.5 hover:border-sky-500 hover:bg-sky-100'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        {/* Built sentence tray */}
        <div
          className={`min-h-[3.5rem] rounded-2xl border-2 p-3 transition ${
            complete
              ? 'border-cyan-400 bg-cyan-50/50'
              : 'border-dashed border-slate-300 bg-slate-50/70'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {selected.length === 0 ? (
                <span className="text-sm font-semibold text-slate-400">
                  Your sentence will appear here…
                </span>
              ) : (
                <>
                  {selected.map((wordIdx, pos) => (
                    <button
                      key={`${sp.id}-placed-${pos}-${wordIdx}`}
                      type="button"
                      onClick={() => handleRemoveAt(pos)}
                      title="Click to remove this word"
                      className="inline-flex items-center gap-1 rounded-xl border-2 border-violet-300 bg-white px-3 py-1.5 text-sm font-extrabold text-violet-900 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 cursor-pointer"
                    >
                      <span>{words[wordIdx]}</span>
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  ))}
                  <span className="text-lg font-extrabold text-slate-700">
                    {sp.endPunctuation ?? '.'}
                  </span>
                </>
              )}
            </div>

            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          {complete && (
            <p className="mt-2 text-xs font-bold text-cyan-800">
              Your answer: <span className="font-extrabold text-slate-900">{preview}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderSubPartInput = (sp: QuestionSubPart) => {
    const key = makeSubPartKey(question.id, sp.id);
    const strVal = typeof answers[key] === 'string' ? (answers[key] as string) : '';

    if (sp.inputKind === 'true-false') {
      return (
        <div className="mt-2.5 flex flex-wrap gap-3">
          {(['True', 'False'] as const).map((opt) => {
            const active = strVal === opt;
            const isTrueBtn = opt === 'True';
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeAnswer(key, opt)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  active
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                }`}
              >
                {isTrueBtn ? (
                  <Check className={`h-4 w-4 ${active ? 'text-white' : 'text-teal-600'}`} />
                ) : (
                  <X className={`h-4 w-4 ${active ? 'text-white' : 'text-rose-500'}`} />
                )}
                <span>{isTrueBtn ? 'True (✓)' : 'False (×)'}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (sp.inputKind === 'choice') {
      const options = sp.options ?? [];
      const isShortOptions = options.every((o) => o.length <= 22);
      return (
        <div
          className={`mt-2.5 ${
            isShortOptions ? 'flex flex-wrap gap-2.5' : 'grid grid-cols-1 gap-2.5'
          }`}
        >
          {options.map((opt, idx) => {
            const active = strVal === opt;
            const letter = String.fromCharCode(97 + idx);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeAnswer(key, opt)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 text-left text-sm font-bold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  active
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    active ? 'bg-white text-sky-700' : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {letter}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (sp.inputKind === 'select') {
      const options = sp.options ?? [];
      return (
        <div className="mt-2.5">
          <select
            aria-label={sp.prompt}
            value={strVal}
            onChange={(e) => onChangeAnswer(key, e.target.value)}
            className={`w-full sm:max-w-sm rounded-xl border-2 px-3.5 py-2.5 text-sm font-bold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              strVal
                ? 'border-sky-400 bg-sky-50 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
            }`}
          >
            <option value="">— Choose your answer —</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (sp.inputKind === 'reorder') {
      return renderReorderControl(sp, key);
    }

    // Text input (table completion or grammar correction)
    return (
      <div className="mt-2.5">
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChangeAnswer(key, e.target.value)}
          placeholder="Type your answer here…"
          autoComplete="off"
          spellCheck={false}
          className={`w-full sm:max-w-sm rounded-xl border-2 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
            strVal.trim().length > 0
              ? 'border-sky-400 bg-sky-50/50'
              : 'border-slate-200 bg-white hover:border-sky-300'
          }`}
        />
      </div>
    );
  };

  return (
    <article className="exam-card overflow-hidden border-2 border-sky-100">
      {/* Cheerful top colour stripe */}
      <div className={`h-2 w-full bg-gradient-to-r ${palette.topBar}`} />

      <div className="p-5 sm:p-7">
        {/* Card header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${palette.numBg} px-3.5 py-1.5 font-display text-base font-bold text-white shadow-sm`}
            >
              Question {examNumber}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${palette.badge}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {question.formatLabel}
            </span>
          </div>

          <span className="inline-flex items-center rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
            {question.marks} Marks
          </span>
        </div>

        {/* Main instruction */}
        <h2 className="mt-4 font-display text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
          {question.instruction}
        </h2>

        {/* Verbatim Curriculum Passage */}
        {passage && (
          <div className="passage-paper mt-4 p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-800">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <span>{passage.heading}</span>
            </div>
            <div className="space-y-2 text-[15.5px] sm:text-base font-semibold leading-relaxed text-slate-800">
              {passage.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Optional visual aid */}
        {question.visualAid === 'lesson4-house-cutaway' && <HouseIllustration />}
        {question.visualAid === 'johns-family-header' && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm font-extrabold text-cyan-900">
            John’s Family — Table
          </div>
        )}

        {/* Context dialogue lines */}
        {question.contextLines && question.contextLines.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-4 space-y-1.5">
            {question.contextLines.map((line, idx) => (
              <p key={idx} className="text-sm sm:text-base font-bold text-slate-800">
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Printed Word Bank */}
        {question.wordBank && question.wordBank.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-teal-200 bg-teal-50/60 px-4 py-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mr-1">
              Word Box:
            </span>
            {question.wordBank.map((word, idx) => (
              <span
                key={`${word}-${idx}`}
                className="rounded-xl border border-teal-300 bg-white px-3 py-1 text-sm font-extrabold text-teal-900 shadow-xs"
              >
                {word}
              </span>
            ))}
          </div>
        )}

        {/* Printed textbook example */}
        {question.printedExample && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-900">
            <span className="font-extrabold uppercase tracking-wide text-emerald-700 mr-1.5">
              Example:
            </span>
            {question.printedExample}
          </div>
        )}

        {/* Sub-parts */}
        {isClockGrid ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {question.subParts.map((sp) => {
              const answered = isSubPartAnswered(question, sp, answers);
              return (
                <div
                  key={sp.id}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition ${
                    answered
                      ? 'border-sky-200 bg-sky-50/35'
                      : 'border-slate-100 bg-slate-50/60'
                  }`}
                >
                  <div className="mb-2 flex w-full items-center justify-between">
                    <span className="rounded-lg bg-cyan-100 px-2.5 py-0.5 text-xs font-extrabold text-cyan-900">
                      {sp.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formatMark(sp.marks)} {sp.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                  {sp.clock && <AnalogueClock clock={sp.clock} size={126} />}
                  <div className="w-full mt-1">{renderSubPartInput(sp)}</div>
                </div>
              );
            })}
          </div>
        ) : isTableGrid ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {question.subParts.map((sp) => {
              const key = makeSubPartKey(question.id, sp.id);
              const strVal = typeof answers[key] === 'string' ? (answers[key] as string) : '';
              const tc = sp.tableContext!;
              return (
                <div
                  key={sp.id}
                  className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="font-extrabold text-sky-800">Box {sp.label}</span>
                    <span>{formatMark(sp.marks)} mark</span>
                  </div>
                  {tc.blankPosition === 'top' ? (
                    <>
                      <div className="flex items-center gap-2 rounded-xl bg-sky-200/70 px-3 py-2">
                        <span className="text-sm font-extrabold text-slate-800">His</span>
                        <input
                          type="text"
                          aria-label={sp.prompt}
                          value={strVal}
                          onChange={(e) => onChangeAnswer(key, e.target.value)}
                          placeholder="family word…"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-lg border-2 border-sky-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div className="rounded-xl bg-sky-100 px-3 py-2 text-center text-sm font-extrabold text-slate-900">
                        {tc.bottomLine}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl bg-sky-200/70 px-3 py-2 text-center text-sm font-extrabold text-slate-800">
                        {tc.topLine}
                      </div>
                      <div className="rounded-xl bg-sky-100 p-1.5">
                        <input
                          type="text"
                          aria-label={sp.prompt}
                          value={strVal}
                          onChange={(e) => onChangeAnswer(key, e.target.value)}
                          placeholder="Type name…"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-lg border-2 border-sky-300 bg-white px-3 py-1.5 text-center text-sm font-extrabold text-slate-900 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {question.subParts.map((sp) => {
              const answered = isSubPartAnswered(question, sp, answers);
              return (
                <div
                  key={sp.id}
                  className={`rounded-2xl border-2 p-4 transition ${
                    answered
                      ? 'border-sky-200 bg-sky-50/30'
                      : 'border-slate-100 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15.5px] sm:text-base font-bold text-slate-900 leading-relaxed">
                      {sp.label && (
                        <span className="mr-2 font-extrabold text-sky-700">{sp.label}</span>
                      )}
                      {sp.underlinedSegment ? (
                        <>
                          <span>{sp.underlinedSegment.before}</span>
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 font-extrabold text-rose-700 underline decoration-rose-500 decoration-2 underline-offset-4">
                            {sp.underlinedSegment.underlined}
                          </span>
                          <span>{sp.underlinedSegment.after}</span>
                        </>
                      ) : (
                        <span>{sp.prompt}</span>
                      )}
                    </p>

                    {question.subParts.length > 1 && (
                      <span className="shrink-0 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-extrabold text-slate-600">
                        {formatMark(sp.marks)} {sp.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    )}
                  </div>

                  {renderSubPartInput(sp)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};

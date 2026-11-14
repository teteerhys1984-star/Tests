import React from 'react';
import { Question, Subpart } from '../types/exam';
import { MathView, FormattedText, OptionText } from './MathView';
import { GeometryDiagram } from './GeometryDiagram';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, subpartId: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onJumpToQuestion: (index: number) => void;
  allQuestions: Question[];
  onSubmit: () => void;
  unansweredCount: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answers,
  onAnswerChange,
  onNext,
  onPrev,
  onJumpToQuestion,
  allQuestions,
  onSubmit,
  unansweredCount
}) => {
  const isAlgebra = question.subject === 'ALGEBRA';

  // Check how many subparts in this question are answered
  const answeredInThisQ = question.subparts.filter(
    sub => (answers[`${question.id}_${sub.id}`] || '').trim() !== ''
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Top Question Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl font-mono text-base font-black shadow-md ${
                isAlgebra
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'bg-teal-500 text-slate-950 shadow-teal-500/30'
              }`}
            >
              {question.questionNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-black tracking-widest ${
                    isAlgebra
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                      : 'bg-teal-950/80 text-teal-300 border border-teal-700/50'
                  }`}
                  dir="ltr"
                >
                  {question.subject}
                </span>
                <span className="text-xs text-slate-400">
                  السؤال {question.questionNumber} من {totalQuestions}
                </span>
              </div>
              <h2 className="mt-1 text-base font-bold text-white sm:text-lg">
                {question.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
              {question.totalMarks} علامات
            </span>
            <span className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
              أجبت: {answeredInThisQ} / {question.subparts.length}
            </span>
          </div>
        </div>

        {/* Stem Text & Stem Math */}
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200 sm:text-base">
          <FormattedText text={question.stemText} />

          {question.stemMath && (
            <div className="my-3 rounded-2xl border border-slate-800 bg-[#070b14] p-3 text-center shadow-inner">
              <MathView math={question.stemMath} block />
            </div>
          )}

          {/* SVG Geometry Diagram if present */}
          {question.diagram && (
            <div className="my-4">
              <GeometryDiagram diagram={question.diagram} />
            </div>
          )}
        </div>
      </div>

      {/* Subparts List */}
      <div className="space-y-4">
        {question.subparts.map((sub: Subpart) => {
          const answerKey = `${question.id}_${sub.id}`;
          const currentAnswer = answers[answerKey] || '';
          const isAnswered = currentAnswer.trim() !== '';

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border p-4 transition-all sm:p-5 ${
                isAnswered
                  ? 'border-cyan-500/30 bg-slate-900/80 shadow-md shadow-cyan-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Subpart Title */}
              <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800 font-bold text-cyan-300">
                    ({sub.subpartNumber})
                  </span>
                  <span className="text-xs font-semibold text-slate-400">فقرة فرعية</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-950/40 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-800/30">
                    [{sub.marks} علامة]
                  </span>
                  {isAnswered ? (
                    <span className="rounded-md bg-emerald-950/60 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800/40">
                      ✓ تمت الإجابة
                    </span>
                  ) : (
                    <span className="rounded-md bg-rose-950/40 px-2 py-0.5 text-xs text-rose-400 border border-rose-800/30">
                      مطلوبة
                    </span>
                  )}
                </div>
              </div>

              {/* Subpart Question Text */}
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-200">
                <FormattedText text={sub.text} />
              </p>

              {/* Input Controls */}
              {sub.type === 'mcq' && sub.options && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {sub.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer === opt.id;
                    const optionLetter = ['أ', 'ب', 'ج', 'د'][optIdx] || String(optIdx + 1);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onAnswerChange(question.id, sub.id, opt.id)}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-right transition-all ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/50 text-white shadow-md shadow-cyan-950/40'
                            : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                        dir="rtl"
                      >
                        <div className="flex items-center gap-3 flex-1 text-right" dir="rtl">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <div className="flex-1 text-right" dir="rtl">
                            <OptionText label={opt.label} isMath={opt.isMath} />
                          </div>
                        </div>

                        <div
                          className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {sub.type === 'numeric' && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={sub.placeholder || 'أدخل القيمة العددية...'}
                      value={currentAnswer}
                      onChange={e => onAnswerChange(question.id, sub.id, e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-cyan-200 placeholder-slate-500 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      dir="ltr"
                    />
                  </div>
                  {sub.unit && (
                    <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-center text-xs font-mono font-bold text-slate-300" dir="ltr">
                      {sub.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation & Submit Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={questionIndex === 0}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              questionIndex === 0
                ? 'cursor-not-allowed border border-slate-800 bg-slate-950/40 text-slate-600'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>→</span>
            السؤال السابق
          </button>

          {/* Question Palette Quick Grid */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {allQuestions.map((q, idx) => {
              const qAnswered = q.subparts.every(
                sub => (answers[`${q.id}_${sub.id}`] || '').trim() !== ''
              );
              const isCurrent = idx === questionIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onJumpToQuestion(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? 'border-2 border-cyan-400 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-400/40'
                      : qAnswered
                      ? 'border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/40'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                  title={`السؤال ${q.questionNumber}: ${q.title}`}
                >
                  {q.questionNumber}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={questionIndex === totalQuestions - 1}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              questionIndex === totalQuestions - 1
                ? 'cursor-not-allowed border border-slate-800 bg-slate-950/40 text-slate-600'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            السؤال التالي
            <span>←</span>
          </button>
        </div>

        {/* Final Submit Section */}
        <div className="mt-5 border-t border-slate-800 pt-4 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            {unansweredCount > 0 ? (
              <p className="text-xs font-semibold text-rose-400">
                بقي {unansweredCount} فقرة فرعية لم يتم حلها بعد لتتمكن من تسليم الاختبار.
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-400">
                ✓ تم حل جميع الفقرات الـ 15 كاملة! يمكنك الآن تسليم الاختبار فورياً.
              </p>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={unansweredCount > 0}
              className={`w-full max-w-sm rounded-2xl py-3.5 text-base font-black shadow-xl transition-all duration-300 ${
                unansweredCount > 0
                  ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-600 opacity-60'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/30 hover:scale-[1.02] hover:shadow-emerald-400/50 active:scale-[0.98]'
              }`}
            >
              «تسليم الاختبار»
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

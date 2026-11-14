import React, { useState } from 'react';
import { EXAM_QUESTIONS, VERIFY_EXAM_INTEGRITY } from '../data/questions';
import { MathView, FormattedText } from './MathView';
import { GeometryDiagram } from './GeometryDiagram';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ALGEBRA' | 'GEOMETRY'>('ALL');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'somer173') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('كلمة المرور غير صحيحة. يرجى التأكد من الرمز السري للأستاذ.');
    }
  };

  const integrity = VERIFY_EXAM_INTEGRITY();

  const filteredQuestions = EXAM_QUESTIONS.filter(q => {
    if (selectedFilter === 'ALL') return true;
    return q.subject === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30">
              <span className="font-mono text-lg font-black">👨‍🏫</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                بوابة المعلم والحلول النموذجية الشاملة
              </h2>
              <p className="text-xs text-slate-400">
                سلم التصحيح والتدقيق الرياضي المعتمد — MATHVERSE Grade 8
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-2xl text-cyan-400">
              🔒
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-200">
              منطقة مخصصة للمدرسين والمصححين فقط
            </h3>
            <p className="mb-6 max-w-md text-xs text-slate-400">
              يرجى إدخال الرمز السري المعتمد للاطلاع على مفاتيح الإجابة التفصيلية، والبراهين الهندسية، وإحداثيات المخططات.
            </p>

            <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-3">
              <input
                type="password"
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              {errorMsg && <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>}
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                تأكيد الدخول
              </button>
            </form>
            <p className="mt-4 text-[11px] text-slate-500">
              * بوابة الحماية هي حاجز تنظيمي للمعاينة النموذجية في البيئة التعليمية الرقمية.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Exam Integrity Banner */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/40 p-3 text-center">
                <span className="block text-xs text-slate-400">مجموع الأسئلة</span>
                <span className="font-mono text-xl font-bold text-cyan-300">
                  {integrity.totalQuestions} سؤال رئيسي
                </span>
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/40 p-3 text-center">
                <span className="block text-xs text-slate-400">قسم الجبر</span>
                <span className="font-mono text-xl font-bold text-indigo-300">
                  {integrity.algebraQuestions} أسئلة (46 علامة)
                </span>
              </div>
              <div className="rounded-xl border border-teal-500/20 bg-teal-950/40 p-3 text-center">
                <span className="block text-xs text-slate-400">قسم الهندسة</span>
                <span className="font-mono text-xl font-bold text-teal-300">
                  {integrity.geometryQuestions} أسئلة (54 علامة)
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3 text-center">
                <span className="block text-xs text-slate-400">المجموع الكلي</span>
                <span className="font-mono text-xl font-bold text-emerald-300">
                  {integrity.totalScore} علامة تماماً
                </span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6 flex gap-2 border-b border-slate-800 pb-4">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-colors ${
                  selectedFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                جميع الأسئلة (15)
              </button>
              <button
                onClick={() => setSelectedFilter('ALGEBRA')}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-colors ${
                  selectedFilter === 'ALGEBRA'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                أسئلة الجبر فقط (7)
              </button>
              <button
                onClick={() => setSelectedFilter('GEOMETRY')}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-colors ${
                  selectedFilter === 'GEOMETRY'
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                أسئلة الهندسة فقط (8)
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {filteredQuestions.map(q => (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 ${
                    q.subject === 'ALGEBRA'
                      ? 'border-indigo-500/30 bg-slate-950/70'
                      : 'border-teal-500/30 bg-slate-950/70'
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                          q.subject === 'ALGEBRA'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                            : 'bg-teal-950 text-teal-300 border border-teal-700/50'
                        }`}
                      >
                        سؤال {q.questionNumber}: {q.subject === 'ALGEBRA' ? 'جبر' : 'هندسة'}
                      </span>
                      <h4 className="text-sm font-bold text-white sm:text-base">{q.title}</h4>
                    </div>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      {q.totalMarks} علامات
                    </span>
                  </div>

                  <div className="mb-3 rounded-lg bg-slate-900/90 p-2.5 text-xs text-slate-300">
                    <span className="font-bold text-cyan-400">مرجع المنهاج الوزاري: </span>
                    {q.curriculumRef.unit} | {q.curriculumRef.lesson} ({q.curriculumRef.pages})
                  </div>

                  {q.stemMath && (
                    <div className="mb-3 rounded-xl bg-slate-900/60 p-2 text-center">
                      <MathView math={q.stemMath} block />
                    </div>
                  )}

                  {q.diagram && (
                    <div className="mb-4">
                      <GeometryDiagram diagram={q.diagram} />
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {q.subparts.map(sub => (
                      <div key={sub.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-bold text-amber-300">
                            الفقرة ({sub.subpartNumber}) — [{sub.marks} علامة]
                          </span>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                            النوع: {sub.type}
                          </span>
                        </div>
                        <p className="mb-2 text-slate-300">
                          <FormattedText text={sub.text} />
                        </p>

                        <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2.5 text-emerald-200">
                          <span className="font-bold text-emerald-400">الإجابة الصحيحة المعتمدة: </span>
                          <span className="font-mono" dir="ltr">
                            {Array.isArray(sub.correctAnswer) ? sub.correctAnswer.join(', ') : sub.correctAnswer}
                          </span>
                        </div>

                        <div className="mt-2 rounded-lg bg-slate-950/60 p-2.5 text-slate-300">
                          <span className="font-bold text-cyan-400">الشرح والبرهان الرياضي: </span>
                          <div className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-slate-300">
                            <FormattedText text={sub.teacherExplanation} />
                          </div>
                        </div>

                        {sub.partialCreditCriteria && (
                          <div className="mt-1.5 text-[11px] text-amber-400/90">
                            <span className="font-semibold">معايير التصحيح الجزئي: </span>
                            {sub.partialCreditCriteria}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

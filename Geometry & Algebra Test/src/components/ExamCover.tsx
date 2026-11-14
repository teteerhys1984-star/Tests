import React, { useState } from 'react';

interface ExamCoverProps {
  onStart: (studentName: string) => void;
  onOpenTeacher: () => void;
  initialName?: string;
}

export const ExamCover: React.FC<ExamCoverProps> = ({ onStart, onOpenTeacher, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('يرجى إدخال اسمك الكامل لبدء الاختبار وتوليد التقرير المعتمد.');
      return;
    }
    if (trimmed.length < 3) {
      setError('يرجى كتابة الاسم الثلاثي على الأقل.');
      return;
    }
    setError('');
    onStart(trimmed);
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] items-center justify-center p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl sm:p-10">
        {/* Glow Accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Top Badges */}
        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 font-black text-cyan-400">
                MV
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400" dir="ltr">
                MATHVERSE
              </span>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">
                التحدي الرياضي الشامل — الصف الثامن
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-500/40 bg-cyan-950/80 px-3 py-1 text-xs font-bold text-cyan-300">
              جبر + هندسة
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-300">
              100 علامة
            </span>
          </div>
        </div>

        {/* Hero Presentation */}
        <div className="relative z-10 mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Algebra Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-5 shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <span>قسم الجبر</span>
                <bdi dir="ltr" className="font-mono text-xs text-indigo-400">(ALGEBRA)</bdi>
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-400">7 أسئلة رئيسية (46 علامة)</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              الوحدة 1: الأعداد العادية والعمليات عليها (الجمع، الطرح، الضرب، القسمة، التبسيط).
              <br />
              الوحدة 2: قوى الأعداد العادية، قوى 10، الأسس الصحيحة، والكتابة العلمية.
            </p>
          </div>

          {/* Geometry Card */}
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/40 to-slate-950 p-5 shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-teal-300">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400" />
                <span>قسم الهندسة</span>
                <bdi dir="ltr" className="font-mono text-xs text-teal-400">(GEOMETRY)</bdi>
              </span>
              <span className="text-xs font-mono font-semibold text-teal-400">8 أسئلة رئيسية (54 علامة)</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              الوحدة 1: متوازيات الأضلاع والانسحاب وخواصه وصورة شكل وتطابق المثلثات.
              <br />
              الوحدة 2: منتصفا ضلعين في مثلث، والموازي لضلع من منتصف ضلع آخر.
            </p>
          </div>
        </div>

        {/* Exam Specifications */}
        <div className="relative z-10 mb-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            تعليمات وضوابط التحدي الامتحاني:
          </h3>
          <ul className="grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✔</span>
              يتضمن الاختبار بالضبط 15 سؤالاً رئيسياً بفقرات فرعية مستقلة.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✔</span>
              المؤقت الزمني يحسب بالثواني الحقيقية ويبقى متصلاً حتى التسليم.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✔</span>
              التخزين التلقائي يحفظ إجاباتك فورياً حتى لو أغلقت المتصفح.
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✔</span>
              زر «تسليم الاختبار» يتفعل بعد الإجابة على جميع الفقرات المطلوبة.
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleStart} className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <label className="mb-1.5 block text-center text-xs font-bold text-slate-200">
              الاسم الكامل للطالب / الطالبة <span className="text-rose-400">* (إلزامي للتقرير)</span>
            </label>
            <input
              type="text"
              placeholder="اكتب اسمك الثلاثي هنا..."
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3.5 text-center text-base font-bold text-white placeholder-slate-500 shadow-inner transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-center text-xs font-bold text-rose-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="group relative flex w-full max-w-md items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 px-8 py-4 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-400/50 active:scale-[0.98]"
          >
            <span className="relative z-10 text-lg">« ابدأ الاختبار »</span>
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform group-hover:-translate-x-1">
              ←
            </span>
          </button>

          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenTeacher}
              className="text-xs font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              🔒 بوابة المدرس وسلم التصحيح المعتمد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

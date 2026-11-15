import { useState } from 'react';
import { correctAnswerText, rubricText } from '../../data/answers/answerKey';
import { QUESTIONS } from '../../data/questions';
import { LESSONS, SECTION_LABEL } from '../../data/sources/lessons';
import { fmtMarks, toArabicDigits } from '../../utils/normalize';
import { IconLock, IconX } from '../common/Icons';

/**
 * NOTE: This password is a client-side educational access barrier only.
 * It is NOT real authentication or encryption – the data ships with the bundle.
 */
const TEACHER_PASSWORD = 'somer173';
const DIFF: Record<string, string> = { basic: 'أساسي', intermediate: 'متوسط', advanced: 'متقدم' };

export function TeacherArea({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);

  if (!ok) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-plum/30 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="دخول المعلمة">
        <form
          className="card w-full max-w-sm p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === TEACHER_PASSWORD) setOk(true);
            else setErr(true);
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><IconLock /> منطقة المعلمة</h2>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="text-blush-700"><IconX /></button>
          </div>
          <label htmlFor="tpw" className="block mb-2">كلمة المرور</label>
          <input
            id="tpw" type="password" value={pw} autoFocus
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            className="w-full rounded-2xl border-2 border-blush-200 px-4 py-2 outline-none focus:border-lav-400" dir="ltr"
          />
          {err && <p className="text-sm text-blush-700 mt-2">كلمة المرور غير صحيحة.</p>}
          <button className="btn btn-primary w-full mt-4" type="submit">دخول</button>
          <p className="text-xs text-gray-500 mt-3">تنبيه: هذا حاجز وصول تعليمي داخل المتصفح فقط، وليس نظام حماية أو تشفيرًا حقيقيًّا.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream" role="dialog" aria-modal="true" aria-label="مفتاح الإجابة">
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 no-print">
          <h1 className="text-2xl font-bold">مفتاح الإجابة وسُلَّم التصحيح (للمعلمة فقط)</h1>
          <div className="flex gap-2">
            <button className="btn btn-soft" onClick={() => window.print()}>طباعة</button>
            <button className="btn btn-primary" onClick={onClose}>إغلاق</button>
          </div>
        </div>
        <p className="mb-6 text-sm rounded-2xl bg-lav-100/60 p-3">
          مرجعية المحتوى: ملفات أقفال المصدر في مستودع Interactive-arabic-grade5 (docs/source-locks). المجموع {toArabicDigits(100)} درجة موزعة على {toArabicDigits(30)} سؤالًا (٦ لكل درس).
          نص الإملاء الذي يمليه المعلم في درس «مخترع من بلادي» (ص٤٦) غير مطبوع في المصدر فلم يُبنَ عليه أي سؤال.
        </p>
        <div className="space-y-4">
          {QUESTIONS.map((q, qi) => {
            const lm = LESSONS[q.lessonId];
            const pages = q.section === 'grammar' ? lm.grammarPages : lm.spellingPages;
            return (
              <article key={q.id} className="card p-5">
                <h2 className="font-bold text-lg">السؤال {toArabicDigits(qi + 1)} ({q.id}): {q.instruction}</h2>
                <p className="text-xs text-blush-700 mt-1">
                  {lm.unit} · {lm.title} · {SECTION_LABEL[q.section]} · ص{pages} · المستوى: {DIFF[q.difficulty]} · {lm.repoFile}
                </p>
                {q.stem && <p className="mt-2 rounded-xl bg-blush-50 px-3 py-2">{q.stem}</p>}
                <ol className="mt-3 space-y-3">
                  {q.subparts.map((sp) => (
                    <li key={sp.id} className="rounded-2xl border border-blush-100 bg-white p-3 text-sm">
                      <p className="font-bold text-base">{sp.prompt} <span className="text-lav-600">({fmtMarks(sp.marks)} درجة)</span></p>
                      <p className="mt-1"><strong className="text-emerald-700">الإجابة:</strong> {correctAnswerText(sp)}</p>
                      <p><strong>سُلَّم التصحيح:</strong> {rubricText(sp)}</p>
                      <p><strong>التوضيح:</strong> {sp.explanation}</p>
                      <p><strong>المهارة:</strong> {sp.skill}</p>
                      {sp.misconception && <p className="text-blush-700"><strong>خطأ شائع:</strong> {sp.misconception}</p>}
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Butterfly, FloralDivider, Flower } from '../common/Decor';
import { IconLock } from '../common/Icons';
import { toArabicDigits } from '../../utils/normalize';

interface Props {
  onStart: (name: string) => void;
  onTeacher: () => void;
}

export function StartScreen({ onStart, onTeacher }: Props) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = name.trim().split(/\s+/).filter(Boolean).length >= 2;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 fade-in">
      <div className="card relative overflow-hidden p-6 sm:p-10 text-center">
        <Flower className="absolute -top-5 -left-5 w-24 opacity-60" />
        <Butterfly className="absolute top-4 right-5 w-12 float-slow" />
        <p className="text-blush-600 font-bold tracking-wide">زهرة المعرفة</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold mt-2 leading-snug">
          اختبار اللغة العربية
        </h1>
        <p className="mt-2 text-lg text-lav-600 font-bold">الصف الخامس الأساسي – قواعد اللغة والإملاء</p>
        <FloralDivider />

        <ul className="text-right text-sm sm:text-base space-y-2 bg-blush-50 rounded-2xl p-4 border border-blush-100">
          <li>• عدد الأسئلة: {toArabicDigits(30)} سؤالًا رئيسًا، لكلٍّ منها بنود فرعية.</li>
          <li>• الدرجة الكلية: {toArabicDigits(100)} درجة.</li>
          <li>• يبدأ المؤقّت عند الضغط على زر «ابدئي الاختبار».</li>
          <li>• تُحفظ إجاباتكِ تلقائيًّا، ويمكنكِ التنقّل بين الأسئلة بحرية.</li>
          <li>• عند التسليم يُرسل اسمكِ ونتيجتكِ وإجاباتكِ وتقريركِ إلى المعلّمة عبر Google Sheets. تُحفظ المحاولات غير المرسلة على هذا الجهاز لإعادة إرسالها لاحقًا.</li>
          <li>• لا يظهر التصحيح إلا بعد تسليم الاختبار.</li>
          <li>• يُفعَّل زر التسليم بعد الإجابة عن جميع البنود.</li>
        </ul>

        <form
          className="mt-6 text-right"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (valid) onStart(name);
          }}
        >
          <label htmlFor="student-name" className="block font-bold mb-2">
            الاسم الكامل للطالبة <span className="text-blush-600">*</span>
          </label>
          <input
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            required
            autoComplete="name"
            placeholder="مثال: سلمى أحمد الخطيب"
            className="w-full rounded-2xl border-2 border-blush-200 bg-white px-4 py-3 text-lg outline-none focus:border-lav-400"
            aria-invalid={touched && !valid}
            aria-describedby={touched && !valid ? 'name-err' : undefined}
          />
          {touched && !valid && (
            <p id="name-err" className="mt-2 text-sm text-blush-700">
              يُرجى كتابة الاسم الكامل (الاسم الأول واسم العائلة على الأقل).
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full mt-5 text-lg py-3" disabled={!valid}>
            ابدئي الاختبار
          </button>
        </form>
      </div>
      <div className="text-center mt-6">
        <button type="button" onClick={onTeacher} className="btn btn-soft text-sm">
          <IconLock className="w-4 h-4" /> مفتاح الإجابة للمعلمة
        </button>
      </div>
    </div>
  );
}

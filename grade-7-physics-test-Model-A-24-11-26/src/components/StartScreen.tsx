import { useState, type FormEvent } from 'react';
import { Volume2, VolumeX, Clock, ListChecks, ShieldCheck, Save, ChevronLeft } from 'lucide-react';
import heroUrl from '../assets/hero.jpg';
import { Button, Card, inputCls, labelCls } from './ui';

const INSTRUCTIONS = [
  { icon: ListChecks, text: '10 أسئلة رئيسية، لكل سؤال 10 علامات، والمجموع 100 علامة.' },
  { icon: ShieldCheck, text: 'أجيبي عن جميع الفروع؛ لا يمكن التسليم قبل إكمال جميع الفروع المطلوبة.' },
  { icon: Clock, text: 'يبدأ المؤقت عند الضغط على «بدء الاختبار» فقط، ويُحفظ تقدّمك تلقائياً عند التنقل أو التحديث.' },
  { icon: Save, text: 'لا تُعرض الإجابات الصحيحة ولا العلامات إلا في صفحة النتائج بعد التسليم.' },
  { icon: ChevronLeft, text: 'زر «تسليم الاختبار» يسلّم الاختبار فوراً دون رسالة تأكيد، ويمكنك التنقل بين الأسئلة قبل التسليم.' },
];

export function StartScreen({ onStart, muted, onToggleMute }: { onStart: (name: string) => void; muted: boolean; onToggleMute: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 3) {
      setError('اكتبي اسمك الثلاثي من فضلك (3 أحرف على الأقل).');
      return;
    }
    onStart(n);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="order-2">
          <img src={heroUrl} alt="" className="mx-auto aspect-[4/3] w-full max-w-md rounded-card object-cover shadow-card" />
        </div>
        <Card className="order-1 p-6 sm:p-8">
          <p className="mb-1 text-sm font-semibold text-blush-500">الوحدة الأولى — الدرس الأول والدرس الثاني</p>
          <h1 className="text-2xl font-bold leading-9 sm:text-3xl">اختبار الفيزياء — الصف السابع</h1>
          <p className="mt-1 text-ink-soft">النموذج A</p>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block">
              <span className={labelCls}>
                اسم الطالبة <span className="text-coral-500">*</span>
              </span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={inputCls}
                placeholder="اكتبي اسمك الثلاثي"
                autoComplete="name"
                autoFocus
              />
              {error && <p className="mt-1 text-sm text-coral-500">{error}</p>}
            </label>
            <div className="rounded-2xl bg-blush-50 p-4 text-sm leading-7">
              <p className="mb-2 font-semibold">تعليمات الاختبار</p>
              <ul className="space-y-2">
                {INSTRUCTIONS.map((it, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <it.icon size={18} className="mt-1 shrink-0 text-plum-500" />
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button type="submit" size="lg" className="w-full">
              بدء الاختبار
            </Button>
            <button
              type="button"
              onClick={onToggleMute}
              className="mx-auto flex cursor-pointer items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              الصوت: {muted ? 'مكتوم' : 'مفعّل'}
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}

import { useState } from "react";
import heroUrl from "../assets/hero.jpg";
import { CHEMISTRY_MARKS, PHYSICS_MARKS, QUESTIONS, TOTAL_MARKS } from "../data/exam";
import { Katex } from "../lib/math";
import { SoundIcon } from "./Bits";

export function StartScreen({
  onStart,
  muted,
  onToggleMute,
  resumable,
  onResume,
}: {
  onStart: (name: string) => void;
  muted: boolean;
  onToggleMute: () => void;
  resumable: boolean;
  onResume: () => void;
}) {
  const [name, setName] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setErr(true);
      return;
    }
    onStart(name.trim());
  };

  return (
    <div className="settle">
      {/* ------------------------------------------------------ الترويسة */}
      <header className="relative overflow-hidden bg-ink text-white">
        <img
          src={heroUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/65 via-ink/88 to-ink" />
        <div className="dark-grid absolute inset-0 opacity-65" />

        <div className="relative mx-auto max-w-6xl px-4 pb-11 pt-9 sm:px-6 sm:pb-16 sm:pt-14">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan/60 bg-cyan/15 px-3.5 py-1 text-[12px] font-bold text-cyan">
              الوحدة الأولى · النموذج (أ)
            </span>
            <span className="rounded-full border border-white/25 bg-white/5 px-3.5 py-1 text-[12px] font-bold text-white/85">
              <Katex tex="24" className="text-yellow" /> سؤالاً متداخلاً
            </span>
          </div>

          <h1 className="font-display text-[34px] font-black leading-[1.14] tracking-tight sm:text-[54px] md:text-[62px]">
            اختبار الفيزياء والكيمياء
            <span className="block bg-gradient-to-l from-cyan via-yellow to-orange bg-clip-text text-transparent">
              للصف الثامن الأساسي
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/85 sm:text-[17px]">
            اثنا عشر سؤالاً في الفيزياء واثنا عشر في الكيمياء، متبادلة في سلسلة واحدة متكاملة. مسائل عددية، إنشاءات
            متجهية، جداول ذرّية، وتمثيلات لويس — بصياغة علمية دقيقة.
          </p>

          <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-2.5 sm:gap-4">
            <Stat v={PHYSICS_MARKS} out={50} label="علامة الفيزياء" color="#06B6D4" />
            <Stat v={CHEMISTRY_MARKS} out={50} label="علامة الكيمياء" color="#FF6B1A" />
            <Stat v={TOTAL_MARKS} out={100} label="العلامة الكلّية" color="#FFC53D" />
          </dl>
        </div>
      </header>

      {/* ------------------------------------------------------ البطاقة */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <form
          onSubmit={submit}
          className="rounded-3xl border-2 border-line bg-white p-5 shadow-[0_20px_48px_-28px_rgba(11,27,58,0.45)] sm:p-8"
        >
          <h2 className="font-display text-[22px] font-black text-ink sm:text-[26px]">تعليمات الاختبار</h2>

          <ol className="mt-4 grid gap-3 text-[15px] leading-8 text-ink-soft">
            <li className="flex gap-3">
              <Step n={1} />
              <span>
                يتألّف الاختبار من <Katex tex={String(QUESTIONS.length)} className="font-bold text-ink" /> سؤالاً رئيسياً
                مجموع علاماتها <Katex tex={String(TOTAL_MARKS)} className="font-bold text-ink" /> علامة (
                <Katex tex="50" /> للفيزياء و<Katex tex="50" /> للكيمياء).
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <span>
                تُحفظ إجاباتك تلقائياً في متصفّحك؛ وعند تحديث الصفحة تُستعاد المحاولة الجارية نفسها دون ضياع أي إجابة.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={3} />
              <span>
                لا يبدأ المؤقّت إلا عند الضغط على زرّ «بدء الاختبار»، ويعمل بعدّ تصاعدي{" "}
                <Katex tex={String.raw`\mathrm{HH:MM:SS}`} className="font-bold text-ink" />.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={4} />
              <span>
                في المسائل الحسابية التزم بتسلسل الخطوات العلمية: <b>المعطيات ← المطلوب ← القانون ← التعويض ← الحساب ← الناتج مع الواحدة</b>.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={5} />
              <span>يُفعَّل زرّ «تسليم الاختبار» بعد الإجابة عن جميع المطالب، ويعرض صفحة النتيجة والتقرير المفصّل فوراً.</span>
            </li>
          </ol>

          <div className="mt-7 border-t-2 border-line pt-6">
            <label htmlFor="fullname" className="mb-2 block text-[14px] font-bold text-ink">
              اسم الطالب الكامل <span className="text-orange">*</span>
            </label>
            <input
              id="fullname"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr(false);
              }}
              placeholder="اكتب اسمك الثلاثي الكامل"
              className={`w-full rounded-xl border-2 bg-white px-4 py-3.5 text-[16px] text-ink outline-none transition-colors placeholder:text-ink/30 ${
                err ? "border-orange" : "border-line focus:border-blue"
              }`}
              aria-invalid={err}
            />
            {err ? (
              <p className="mt-2 text-[13px] font-bold text-orange">يرجى إدخال الاسم الكامل (ثلاثة أحرف على الأقل) لبدء الاختبار.</p>
            ) : null}

            <button
              type="submit"
              className="mt-5 w-full rounded-xl border-2 border-blue-deep bg-gradient-to-l from-blue-deep via-blue to-cyan px-5 py-4 font-display text-[18px] font-black text-white shadow-lg transition-transform active:translate-y-0.5 sm:text-[20px]"
            >
              بدء الاختبار
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onToggleMute}
                className="flex items-center gap-2 rounded-lg border-2 border-line px-3 py-2 text-[13px] font-bold text-ink-soft hover:border-blue"
                aria-pressed={!muted}
              >
                <SoundIcon muted={muted} className="h-4 w-4" />
                {muted ? "الصوت مكتوم" : "الصوت مفعّل"}
              </button>

              {resumable ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="rounded-lg border-2 border-green bg-green/10 px-4 py-2 text-[13px] font-bold text-green"
                >
                  متابعة المحاولة الجارية
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Stat({ v, out, label, color }: { v: number; out: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-xs">
      <dt className="text-[11px] font-bold text-white/75 sm:text-[13px]">{label}</dt>
      <dd className="mt-1 text-[22px] font-bold leading-tight sm:text-[30px]" style={{ color }}>
        <Katex tex={`${v}/${out}`} />
      </dd>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-[12px] font-bold text-white">
      <Katex tex={String(n)} className="text-white" />
    </span>
  );
}

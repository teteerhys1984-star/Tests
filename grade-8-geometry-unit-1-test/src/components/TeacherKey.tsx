import { useState } from "react";
import type { SessionState } from "../lib/session";
import { buildReport } from "../lib/report";
import { QUESTIONS } from "../exam/questions";
import { correctAnswerText } from "../exam/grading";
import { Rich } from "../lib/mathx";
import { FigureFrame } from "./Chrome";

const PASSPHRASE = "somer173";

const RUBRIC_NOTES: Record<string, string> = {
  mcq: "رصد ثنائي: العلامة كاملة للاختيار الصحيح، ولا يوجد رصد جزئي.",
  multi:
    "رصد جزئي تناسبياً: (عدد الاختيارات الصحيحة − عدد الاختيارات الخاطئة) ÷ عدد الإجابات الصحيحة × علامة الفرع، ثمّ يُقرَّب إلى أقرب ربع علامة، ولا ينزل الرصد تحت الصفر.",
  tf: "لكلّ عبارة: نصف العلامة على الحكم الصحيح، والنصف الآخر على اختيار التصحيح المناسب (للعبارة الخاطئة فقط). العبارة الصحيحة تُرصد كاملةً من الحكم وحده.",
  match: "علامة مستقلّة لكلّ وصلة صحيحة؛ لا يؤثر خطأ وصلة على بقيّة الوصلات.",
  order: "رصد جزئي: عدد الخطوات الواقعة في موضعها الصحيح ÷ العدد الكلّي × علامة الفرع.",
  numeric: "علامة مستقلّة لكلّ حقل، بمقارنة عددية مع تفاوت مسموح 0.0001؛ تُقبل الأرقام العربية والفارسية والفاصلة العشرية.",
  cloze:
    "رصد خطوة بخطوة: كل فراغ يمثّل خطوة في البرهان وله علامته المستقلّة، فلا تُلغى علامة خطوة صحيحة بسبب خطوة خاطئة بعدها.",
  plot: "علامة لكلّ نقطة تُوضع في العقدة الشبكية الصحيحة تماماً؛ لا يوجد رصد جزئي داخل النقطة الواحدة.",
};

function Gate({ onPass }: { onPass: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rise rounded-2xl border border-violet-400/25 bg-gradient-to-b from-ink-800/90 to-ink-900/90 p-6">
        <div className="mb-4 grid size-12 place-items-center rounded-xl border border-violet-400/30 bg-violet-400/10">
          <svg viewBox="0 0 24 24" className="size-6 text-violet-300" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">منطقة المعلّم</h2>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-400">
          سلّم الإجابات والحلول الهندسية الكاملة ومعايير الرصد الجزئي. أدخل كلمة المرور للمتابعة.
        </p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim() === PASSPHRASE) onPass();
            else setError(true);
          }}
        >
          <input
            type="password"
            dir="ltr"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="كلمة المرور"
            className="w-full rounded-xl border border-violet-400/30 bg-ink-950/70 px-4 py-3 text-center text-[1rem] tracking-widest text-violet-100 outline-none focus:border-violet-300"
          />
          {error && (
            <p className="text-[0.82rem] font-semibold text-rose-300">كلمة المرور غير صحيحة.</p>
          )}
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gradient-to-l from-violet-400 to-indigo-500 font-bold text-ink-950"
          >
            دخول
          </button>
        </form>
        <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-3 text-[0.76rem] leading-relaxed text-amber-200/90">
          تنبيه: هذه الحماية من جهة المتصفّح فقط. التطبيق ثابت ويُنفَّذ بالكامل على جهاز المستخدم،
          فكلمة المرور موجودة داخل الشيفرة ويمكن لأيّ شخص قراءتها. هذه الحماية ليست مصادقة حقيقية
          ولا تشفيراً، ولا يجوز وضع بيانات سرّية خلفها.
        </p>
      </div>
    </div>
  );
}

export function TeacherKey({ onExit, session }: { onExit: () => void; session: SessionState }) {
  const [passed, setPassed] = useState(false);
  if (!passed) return <Gate onPass={() => setPassed(true)} />;

  return (
    <div className="mx-auto max-w-5xl px-3 pb-16 sm:px-5">
      {session.status === "submitted" && <details className="mt-4 rounded-2xl border border-violet-400/25 p-4"><summary>تفاصيل أداء الطالب في هذه المحاولة</summary><pre className="mt-3 whitespace-pre-wrap text-sm">{buildReport({name: session.name, answers: session.answers, startedAt: session.startedAt, submittedAt: session.submittedAt})}</pre></details>}
      <header className="rise mt-4 rounded-2xl border border-violet-400/22 bg-gradient-to-bl from-violet-500/[0.09] to-transparent p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.78rem] font-bold tracking-wide text-violet-300">منطقة المعلّم</p>
            <h1 className="mt-1 text-2xl font-bold text-white">سلّم الإجابات والحلول الكاملة</h1>
            <p className="mt-1 text-[0.85rem] text-slate-400">
              اختبار الهندسة – الصف الثامن · الوحدة الأولى: متوازيات الأضلاع والانسحاب · الكتاب ص ٥ – ١٩
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="min-h-11 rounded-xl border border-sky-400/30 bg-white/[0.03] px-4 text-[0.85rem] font-semibold text-sky-100 hover:bg-sky-400/10"
          >
            خروج
          </button>
        </div>
        <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-3 text-[0.78rem] leading-relaxed text-amber-200/90">
          الحماية هنا من جهة المتصفّح فقط ولا توفّر مصادقة حقيقية ولا تشفيراً؛ كلمة المرور مضمّنة في
          الشيفرة ويمكن قراءتها. لا تضع أيّ بيانات سرّية أو علامات طلاب خلف هذه البوابة.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { k: "عدد الأسئلة", v: "٧ أسئلة رئيسية" },
            { k: "المجموع", v: "100 علامة" },
            { k: "التوزيع", v: "6 × 15 + 1 × 10" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-sky-400/18 bg-white/[0.025] p-3">
              <p className="text-[0.72rem] text-slate-400">{x.k}</p>
              <p className="mt-0.5 text-[0.92rem] font-bold text-slate-100">{x.v}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="mt-5 space-y-4">
        {QUESTIONS.map((q) => (
          <section key={q.id} className="rounded-2xl border border-sky-400/16 bg-ink-900/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="grid size-9 place-items-center rounded-xl bg-violet-400/15 text-[0.85rem] font-bold text-violet-200">
                {q.index}
              </span>
              <h2 className="text-[1.05rem] font-bold text-white">{q.title}</h2>
              <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2.5 py-0.5 text-[0.74rem] font-bold text-amber-200">
                {q.marks} علامة
              </span>
              <span className="text-[0.76rem] text-slate-500">{q.reference}</span>
            </div>
            <p className="mt-1 text-[0.8rem] text-slate-400">{q.topic}</p>

            {q.figure && (
              <div className="mt-4">
                <FigureFrame caption={q.figure.caption} schematic={q.figure.schematic}>
                  {q.figure.node}
                </FigureFrame>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {q.parts.map((p, i) => (
                <article key={p.id} className="rounded-xl border border-sky-400/14 bg-white/[0.02] p-3.5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-ink-700 px-2 py-0.5 text-[0.75rem] font-bold text-sky-200">
                      {q.index}.{i + 1}
                    </span>
                    <span className="rounded-md bg-amber-300/15 px-2 py-0.5 text-[0.74rem] font-bold text-amber-200">
                      {p.marks} علامة
                    </span>
                    <span className="rounded-md border border-sky-400/20 px-2 py-0.5 text-[0.7rem] text-slate-400">
                      {p.reference}
                    </span>
                  </div>

                  <p className="text-[0.9rem] leading-relaxed text-slate-100">
                    <Rich text={p.prompt} />
                  </p>

                  {p.figure && (
                    <div className="my-3">
                      <FigureFrame caption={p.figure.caption} schematic={p.figure.schematic}>
                        {p.figure.node}
                      </FigureFrame>
                    </div>
                  )}

                  <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] p-3">
                    <p className="mb-1 text-[0.72rem] font-bold text-emerald-300">الإجابة الصحيحة</p>
                    <p className="text-[0.86rem] leading-relaxed text-emerald-50">
                      <Rich text={correctAnswerText(p)} />
                    </p>
                  </div>

                  <div className="mt-2.5 rounded-lg border border-sky-400/18 bg-sky-400/[0.045] p-3">
                    <p className="mb-1 text-[0.72rem] font-bold text-sky-300">الحلّ الهندسي الكامل</p>
                    <p className="text-[0.86rem] leading-relaxed text-slate-200">
                      <Rich text={p.explanation} />
                    </p>
                  </div>

                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-violet-400/22 bg-violet-400/[0.05] p-3">
                      <p className="mb-1 text-[0.72rem] font-bold text-violet-300">معيار الرصد الجزئي</p>
                      <p className="text-[0.8rem] leading-relaxed text-slate-300">
                        {RUBRIC_NOTES[p.type]}
                      </p>
                    </div>
                    <div className="rounded-lg border border-rose-400/22 bg-rose-400/[0.045] p-3">
                      <p className="mb-1 text-[0.72rem] font-bold text-rose-300">أخطاء شائعة</p>
                      <p className="text-[0.8rem] leading-relaxed text-slate-300">
                        {p.commonMistake ? (
                          <Rich text={p.commonMistake} />
                        ) : (
                          "لا يوجد خطأ شائع مرصود لهذا الفرع؛ راقب فقط دقّة الكتابة الرياضية وترتيب المقابلات."
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-5 rounded-2xl border border-sky-400/16 bg-ink-900/60 p-4 sm:p-5">
        <h2 className="text-[1.05rem] font-bold text-white">ملاحظات تدريسية</h2>
        <ul className="mt-3 space-y-2 text-[0.86rem] leading-relaxed text-slate-300">
          <li>
            • لا تُقبل نتيجة صحيحة غير مدعومة بالتعليل المطلوب في فروع البرهان (س2/4، س4/4، س6/5، س7/2 إلى س7/4): الرصد موزّع على خطوات الاستدلال لا على النتيجة النهائية وحدها.
          </li>
          <li>
            • تُقبل الكتابات المكافئة رياضياً: مثل <Rich text={"$\\triangle ABC \\cong \\triangle CDA$"} /> أو ذكر
            الحالة باسمها أو برقمها، ما دامت المقابلة بين الرؤوس صحيحة.
          </li>
          <li>
            • الأشكال المعلَّمة «غير مرسوم بالمقياس» لا يجوز استخراج قياسات منها؛ القياسات المعطاة واردة
            في نصّ السؤال وحده.
          </li>
          <li>
            • في المسائل الإحداثية: الإحداثي الأوّل أفقي <Rich text={"$(x)$"} /> والثاني شاقولي{" "}
            <Rich text={"$(y)$"} />، ولا يُقبل الترتيب المعاكس.
          </li>
          <li>
            • تمارين الدروس 5–7 (تمارين الوحدة) هي مصدر أسئلة التطبيق والدمج: س5/3 (تعيين الرأس الناقص)، وس6 (تطبيق انسحاب على أشكال متعدّدة)، وس7 (الدمج بين الانسحاب ومتوازي الأضلاع
            وتطابق المثلثات).
          </li>
        </ul>
      </section>
    </div>
  );
}
import { useMemo, useState } from 'react'
import { CONTACT, LESSONS, LESSON_BY_ID, TEACHER_PASSWORD, TOTAL_MARKS } from '../exam/types'
import { QUESTIONS, SUBPART_COUNT } from '../exam/questions'
import { MathText } from '../lib/mathx'
import { num } from '../lib/time'
import { FigureView } from '../exam/figureViews'
import { useReveal } from '../components/Chrome'

/** مواصفات الرسوم الهندسية كما بُنيت برمجياً (تُعرض للمعلّم للتدقيق). */
const FIGURE_SPECS: Record<string, string> = {
  'q1-grid': 'شبكة إحداثيات $0$–$8$ على المحورين. مقياس الرسم: وحدة واحدة $= 30$ نقطة. النقاط: $A(2,5)$ و$B(6,2)$ و$C(6,7)$ و$D(0,3)$ و$E(4,0)$. المحوران مميّزان بلون أدكن، ومبدأ الإحداثيات موسوم بـ $O$.',
  'q2-angles': 'شكلان بمروحة زوايا. الشكل (1): الرأس $A$، الأشعة $B$ عند $0^\\circ$ و$C$ عند $40^\\circ$ و$D$ عند $90^\\circ$، مع قوسين مطبوعين $40^\\circ$ و$50^\\circ$؛ الزاوية $\\angle BAD = 90^\\circ$ غير موسومة لأنها المطلوب. الشكل (2): الرأس $A$، الأشعة $X$ عند $0^\\circ$ و$Z$ عند $65^\\circ$ و$Y$ عند $180^\\circ$ مع قوس $65^\\circ$؛ الزاوية $\\angle ZAY = 115^\\circ$ غير موسومة.',
  'q3-placevalue': 'شريط منازل من تسع خانات موزّعة على ثلاث حلقات (الملايين | الألوف | الوحدات) للعدد $4{,}706{,}315$، مع تلوين خانة عشرات الألوف (الرقم $0$).',
  'q4-rhombus': 'معيّن $ABCD$ مبنِي حسابياً: $A(0,0)$ و$B(5,0)$ و$D = 5(\\cos 65^\\circ, \\sin 65^\\circ) = (2.113, 4.532)$ و$C = B + D = (7.113, 4.532)$. مقياس الرسم $1\\,\\text{cm} = 26$ نقطة. أسهم توازٍ مفردة على $AB,CD$ ومزدوجة على $BC,DA$، وعلامة تساوٍ واحدة على الأضلاع الأربعة، وقوسا $65^\\circ$ عند $A$ و$115^\\circ$ عند $B$، وطول $5\\,\\text{cm}$ على $AB$.',
  'q5-linechart': 'تمثيل بياني بالخطوط: المحور الأفقي أيام الأسبوع (السبت…الجمعة)، والمحور الشاقولي درجة الحرارة من $8$ إلى $22$ بتدريج $2$. القيم: $11, 14, 17, 19, 15, 16, 18$. كل نقطة موسومة بقيمتها، وقطعة هابطة واحدة فقط (الثلاثاء → الأربعاء).',
  'q6-columns': 'عمليتان عموديتان بمصفوفة KaTeX: $458{,}276 + 397{,}845$ و$1{,}000{,}000 - 268{,}437$، مع خط الناتج ومربّع فارغ يمثّل المطلوب.',
  'q7-placevalue': 'شريط منازل للعدد $2{,}847{,}563$ مع تلوين خانة المئات (رقم الحسم $5$ عند التقريب إلى أقرب ألف).',
  'q8-grid': 'شبكة إحداثيات $0$–$8$ مع النقاط $P(1,1)$ و$Q(6,1)$ و$R(6,4)$ و$S(1,4)$ ومضلّع $PQRS$ مملوء بلون شفاف. الأضلاع $PQ$ و$SR$ أفقية طول كل منهما $5$ وحدات، و$PS$ و$QR$ شاقولية طول كل منهما $3$ وحدات؛ المحيط $16$ وحدة.',
  'q9-parallelogram': 'متوازي أضلاع $ABCD$: $A(0,0)$ و$B(7,0)$ و$D = 4(\\cos 72^\\circ, \\sin 72^\\circ) = (1.236, 3.804)$ و$C = (8.236, 3.804)$. أسهم توازٍ، وعلامات تساوٍ: واحدة على $AB,CD$ ($7\\,\\text{cm}$) واثنتان على $BC,DA$ ($4\\,\\text{cm}$)، وقوس $72^\\circ$ عند $A$. الزوايا $\\angle B = \\angle D = 108^\\circ$ و$\\angle C = 72^\\circ$ (غير مطبوعة).',
  'q10-linechart': 'تمثيل بياني بالخطوط لزوّار المتحف: الأيام (السبت، الأحد، الإثنين، الثلاثاء) على المحور الأفقي، وعدد الزوّار من $0$ إلى $3{,}500$ بتدريج $500$. القيم: $1{,}245$ و$2{,}318$ و$1{,}876$ و$3{,}402$.',
  'q11-placevalue': 'شريط منازل للعدد $8{,}305{,}472$ مع تلوين خانة مئات الألوف (رقم الحسم للتقريب إلى أقرب مليون $=3$) وخانة آحاد الألوف (رقم الحسم للتقريب إلى أقرب عشرة آلاف $=5$).',
  'q12-table': 'جدول من صفّين: الشهر (الأول، الثاني، الثالث) وعدد النسخ ($125{,}480$، $98{,}735$، $143{,}260$).',
  'q13-protractor': 'زاوية $\\angle MNP$ مرسومة بمروحة زوايا: الرأس $N$، الشعاع $NP$ عند $0^\\circ$ بطول $138$، والشعاع $NM$ عند $125^\\circ$ بطول $128$، بلا أي وسم للقياس. تُقاس بالمنقلة التفاعلية في الفرع (أ) التي تُرسم بتدريج حقيقي درجة‑بدرجة من $0^\\circ$ إلى $180^\\circ$.',
  'q14-rhombus': 'معيّن $XYZW$: $X(0,0)$ و$Y(4,0)$ و$W = 4(\\cos 60^\\circ, \\sin 60^\\circ) = (2, 3.464)$ و$Z = (6, 3.464)$. أسهم توازٍ وعلامات تساوٍ على الأضلاع الأربعة وقوس $60^\\circ$ عند $X$ وطول $4\\,\\text{cm}$ على $XY$.',
  'q15-grid': 'شبكة إحداثيات $0$–$7$ مع النقاط $N(3,6)$ و$M(6,3)$ و$K(0,5)$ و$T(5,0)$. لاحظ أنّ $K$ على المحور الشاقولي و$T$ على المحور الأفقي، وأنّ $N$ و$M$ زوجان معكوسان.',
  'q16-shapes': 'خمسة أشكال بمقياس $1\\,\\text{cm} = 16$ نقطة: (1) متوازي أضلاع $4 \\times 2.4$ بزاوية $62^\\circ$ مع أسهم مفردة ومزدوجة؛ (2) شبه منحرف قاعدتاه $4.4$ و$2.2$ وارتفاعه $2.2$ مع أسهم مفردة على القاعدتين فقط؛ (3) مستطيل $4.2 \\times 2.5$ مع أسهم وعلامة زاوية قائمة؛ (4) مثلث رؤوسه $(0,0),(3.8,0),(1.5,2.6)$؛ (5) دالية رؤوسها $(0,0),(2.2,1.6),(0,3.6),(-2.2,1.6)$ مع علامات تساوٍ (واحدة على الضلعين السفليين واثنتان على العلويين) وبلا أي سهم توازٍ.',
  'q18-linechart': 'تمثيل بياني بالخطوط لطول النبتة: الأسابيع $0$–$5$ أفقياً، والطول من $0$ إلى $14\\,\\text{cm}$ بتدريج $2$. القيم: $3, 5, 5, 8, 12, 12$ (قطعتان أفقيتان: بين الأسبوعين $1$ و$2$، وبين $4$ و$5$).',
  'q20-rhombus': 'معيّن $ABCD$: $A(0,0)$ و$B(6,0)$ و$D = 6(\\cos 55^\\circ, \\sin 55^\\circ) = (3.441, 4.915)$ و$C = (9.441, 4.915)$. علامات تساوٍ على الأضلاع الأربعة وقوس $55^\\circ$ عند $A$ وطول $6\\,\\text{cm}$ على $AB$. الزوايا $\\angle B = \\angle D = 125^\\circ$ و$\\angle C = 55^\\circ$ (غير مطبوعة).',
}

const KIND_AR: Record<string, string> = {
  numeric: 'إجابة عددية', text: 'إجابة نصية قصيرة', explain: 'تعليل/حساب مفتوح',
  choice: 'اختيار من متعدد', multiselect: 'اختيار متعدّد العبارات', tf: 'صواب/خطأ',
  matching: 'مطابقة', ordering: 'ترتيب', grid: 'تعيين نقطة على الشبكة',
  protractor: 'قياس بالمنقلة التفاعلية', drawangle: 'رسم زاوية بالمنقلة',
}

function Gate({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)
  const submit = () => {
    if (pw === TEACHER_PASSWORD) { onOk() } else { setErr('كلمة المرور غير صحيحة. حاول مرة أخرى.') }
  }
  return (
    <div className="relative z-10 mx-auto max-w-md px-4 py-14">
      <div className="card p-6 text-center shadow-[var(--sh-2)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: 'var(--navy)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd97a" strokeWidth="2" aria-hidden>
            <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="display mt-4 text-2xl" style={{ color: 'var(--navy)' }}>دليل المعلّم ونموذج الإجابات</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--ink-3)' }}>
          هذه المنطقة مخصّصة للمعلّم فقط ولا تظهر للطالب أثناء الاختبار. أدخل كلمة المرور للمتابعة.
        </p>
        <div className="mt-5 text-start">
          <label htmlFor="pw" className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--ink-2)' }}>كلمة المرور</label>
          <div className="flex gap-2">
            <input id="pw" className="field flex-1" type={show ? 'text' : 'password'} value={pw} dir="ltr"
              autoComplete="off" onChange={(e) => { setPw(e.target.value); setErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
            <button type="button" className="btn btn-ghost !px-3" onClick={() => setShow((v) => !v)} aria-label={show ? 'إخفاء' : 'إظهار'}>
              {show ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
          {err && <p role="alert" className="mt-2 text-sm font-bold" style={{ color: 'var(--err)' }}>{err}</p>}
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!pw}>فتح الدليل</button>
        <p className="mt-4 rounded-[var(--r-sm)] p-2.5 text-[0.75rem] leading-relaxed" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
          ملاحظة أمنية صريحة: حماية كلمة المرور في ملف HTML ثابت هي حاجز وصول بسيط من جهة العميل (client-side) فقط،
          وليست مصادقة حقيقية ولا تشفيراً قوياً؛ فأي مستخدم يطّلع على مصدر الملف يمكنه تجاوزها. للحماية الفعلية يلزم طبقة هوية على الخادم.
        </p>
      </div>
    </div>
  )
}

export function Teacher({ onExit }: { onExit: () => void }) {
  const [ok, setOk] = useState(false)
  const [openQ, setOpenQ] = useState<Record<string, boolean>>({ q1: true })
  const [filter, setFilter] = useState<string>('all')
  const ref = useReveal<HTMLDivElement>()

  const grouped = useMemo(() => {
    const map = new Map<string, { q: (typeof QUESTIONS)[number]; marks: number }[]>()
    for (const q of QUESTIONS) {
      const marks = q.subparts.reduce((s, x) => s + x.marks, 0)
      for (const l of q.lessons) {
        const arr = map.get(l) ?? []
        arr.push({ q, marks })
        map.set(l, arr)
      }
    }
    return map
  }, [])

  if (!ok) return <Gate onOk={() => setOk(true)} />

  return (
    <div ref={ref} className="relative z-10 mx-auto max-w-6xl px-3 pb-10 pt-5 sm:px-4">
      <header className="relative overflow-hidden rounded-[var(--r-lg)] p-5 shadow-[var(--sh-3)] sm:p-7"
        style={{ background: 'linear-gradient(135deg,#123c49 0%,#0e2f3a 55%,#0f766e 100%)' }}>
        <div className="absolute inset-0 opacity-[0.1]" aria-hidden
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kicker" style={{ color: '#ffd97a' }}>منطقة المعلّم — محجوبة عن الطالب</p>
            <h1 className="display mt-1 text-[clamp(1.4rem,4vw,2.2rem)]" style={{ color: '#fff8e8' }}>
              نموذج الإجابات ودليل التصحيح
            </h1>
            <p className="mt-1.5 max-w-2xl text-[0.92rem] opacity-85" style={{ color: '#dcebee' }}>
              الوحدة الأولى كاملة — الدروس الثمانية (ص 3 – 39) · {num(QUESTIONS.length)} سؤالاً رئيسياً ·{' '}
              {num(SUBPART_COUNT)} فرعاً · {num(TOTAL_MARKS)} علامة · مع سلالم التقويم الجزئي والأخطاء الشائعة والأهداف ومراجع الصفحات ومواصفات الرسوم.
            </p>
          </div>
          <button type="button" className="btn" style={{ background: 'rgba(255,248,232,0.14)', color: '#fff8e8', border: '1px solid rgba(255,248,232,0.3)' }}
            onClick={onExit}>
            رجوع إلى صفحة الاختبار
          </button>
        </div>
      </header>

      {/* مصفوفة التغطية */}
      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="display mb-3 text-xl" style={{ color: 'var(--navy)' }}>مصفوفة تغطية الدروس</h2>
        <div className="overflow-x-auto">
          <table className="dtable" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'start' }}>الدرس</th><th>الصفحات</th><th>الأسئلة</th>
                <th>عدد الفروع</th><th>العلامات (مع احتساب التركيبية)</th>
              </tr>
            </thead>
            <tbody>
              {LESSONS.map((l) => {
                const items = grouped.get(l.id) ?? []
                const subs = items.reduce((s, x) => s + x.q.subparts.filter((sp) => sp.kind !== undefined).length, 0)
                const marks = items.reduce((s, x) => s + x.marks, 0)
                return (
                  <tr key={l.id}>
                    <td style={{ textAlign: 'start', fontWeight: 700 }}>{num(l.num)}. {l.title}</td>
                    <td className="tnum">{l.pages}</td>
                    <td className="tnum">{items.map((x) => num(QUESTIONS.indexOf(x.q) + 1)).join('، ')}</td>
                    <td className="tnum">{num(subs)}</td>
                    <td className="tnum">{num(marks)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
          الأسئلة التركيبية تُحتسب في كل درس تلامسه، لذلك يتجاوز مجموع العمود الأخير {num(TOTAL_MARKS)} علامة؛
          أمّا مجموع علامات الأسئلة العشرين نفسها فهو {num(TOTAL_MARKS)} بالضبط
          ({num(6)} أسئلة × {num(6)} + {num(8)} أسئلة × {num(5)} + {num(6)} أسئلة × {num(4)} = {num(36)} + {num(40)} + {num(24)}).
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button type="button" className={`btn !py-1 !px-3 !min-h-0 text-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}>كل الأسئلة</button>
          {LESSONS.map((l) => (
            <button key={l.id} type="button" className={`btn !py-1 !px-3 !min-h-0 text-sm ${filter === l.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(l.id)}>
              {l.short}
            </button>
          ))}
        </div>
      </section>

      {/* الأسئلة */}
      <section className="mt-4 grid gap-3">
        {QUESTIONS.map((q, qi) => {
          if (filter !== 'all' && !q.lessons.includes(filter as never)) return null
          const marks = q.subparts.reduce((s, x) => s + x.marks, 0)
          const isOpen = openQ[q.id] === true
          return (
            <article key={q.id} className="card reveal overflow-hidden">
              <button type="button" className="flex w-full items-start gap-3 p-3.5 text-start transition-colors duration-200 hover:bg-[var(--surface-2)]"
                onClick={() => setOpenQ((o) => ({ ...o, [q.id]: !isOpen }))} aria-expanded={isOpen}>
                <span className="display tnum grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)]"
                  style={{ background: 'var(--navy)', color: '#ffd97a' }}>{num(qi + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1rem] font-extrabold" style={{ color: 'var(--ink-1)' }}><MathText text={q.title} /></span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    <span className="badge badge-gold tnum">{num(marks)} علامات</span>
                    <span className="badge badge-mute tnum">{num(q.subparts.length)} فروع</span>
                    <span className="badge badge-mute">{q.difficulty}</span>
                    {q.lessons.map((id) => <span key={id} className="badge badge-teal">{LESSON_BY_ID[id].short}</span>)}
                    {q.integrated && <span className="badge badge-part">تركيبي بين درسين أو أكثر</span>}
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  className="mt-1 shrink-0 transition-transform duration-300" style={{ color: 'var(--ink-3)', transform: isOpen ? 'rotate(180deg)' : 'none' }} aria-hidden>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t p-3.5 sm:p-4" style={{ borderColor: 'var(--line-soft)' }}>
                  {q.intro && <p className="mb-2 text-[0.93rem]"><MathText text={q.intro} /></p>}
                  <p className="mb-2 text-[0.8rem]" style={{ color: 'var(--ink-3)' }}>
                    <strong>المرجع:</strong> {q.source}
                  </p>
                  {q.figure && (
                    <div className="mb-3">
                      <FigureView id={q.figure} />
                      {FIGURE_SPECS[q.figure] && (
                        <details className="mt-2 rounded-[var(--r-sm)] border p-2.5" style={{ borderColor: 'var(--line-soft)', background: 'var(--surface-2)' }}>
                          <summary className="cursor-pointer text-[0.85rem] font-bold" style={{ color: 'var(--navy)' }}>
                            مواصفات الرسم الهندسي
                          </summary>
                          <p className="mt-2 text-[0.84rem] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                            <MathText text={FIGURE_SPECS[q.figure]} />
                          </p>
                        </details>
                      )}
                    </div>
                  )}

                  <div className="grid gap-2.5">
                    {q.subparts.map((sp) => (
                      <div key={sp.id} className="rounded-[var(--r-sm)] border p-3"
                        style={{ borderColor: 'var(--line-soft)', borderInlineStartColor: 'var(--gold)', borderInlineStartWidth: 4, background: '#fff' }}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="display text-base font-bold" style={{ color: 'var(--navy)' }}>الفرع ({sp.label})</span>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="badge badge-gold tnum">{num(sp.marks)} {sp.marks === 1 ? 'علامة' : 'علامات'}</span>
                            <span className="badge badge-mute">{KIND_AR[sp.kind] ?? sp.kind}</span>
                          </span>
                        </div>
                        <p className="mb-2 text-[0.94rem]"><strong>المطلوب: </strong><MathText text={sp.prompt} /></p>
                        <dl className="grid gap-1.5 text-[0.88rem]">
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الإجابة الصحيحة</dt>
                            <dd style={{ color: 'var(--ok)' }}><MathText text={sp.answerText} /></dd>
                          </div>
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الحلّ الكامل</dt>
                            <dd style={{ color: 'var(--ink-2)' }}><MathText as="div" text={sp.solution} /></dd>
                          </div>
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>القاعدة/الخاصة</dt>
                            <dd style={{ color: 'var(--ink-2)' }}><MathText text={sp.rule} /></dd>
                          </div>
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الخطأ الشائع</dt>
                            <dd style={{ color: 'var(--clay)' }}><MathText text={sp.mistake} /></dd>
                          </div>
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الهدف التعليمي</dt>
                            <dd style={{ color: 'var(--ink-2)' }}><MathText text={sp.objective} /></dd>
                          </div>
                          {sp.partial && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>سلّم التقويم الجزئي</dt>
                              <dd className="tnum" style={{ color: 'var(--ink-2)' }}>
                                {sp.partial.map(([min, mk], i) => (
                                  <span key={i} className="badge badge-part me-1.5">
                                    {num(min)} إصابة ⟵ {num(mk)} علامة
                                  </span>
                                ))}
                              </dd>
                            </div>
                          )}
                          {sp.rubricAll && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>مجموعات الكلمات المفتاحية</dt>
                              <dd style={{ color: 'var(--ink-2)' }}>
                                {sp.rubricAll.map((g, i) => (
                                  <div key={i} className="text-[0.84rem]">
                                    <span className="tnum font-bold">{num(i + 1)})</span> {g.join(' / ')}
                                  </div>
                                ))}
                                <p className="mt-1 text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
                                  تُمنح العلامة بنسبة المجموعات المحقّقة (مقرّبة إلى أقرب نصف علامة)؛ لا يُشترط تطابق الصياغة بل المعنى الرياضي.
                                </p>
                              </dd>
                            </div>
                          )}
                          {sp.correction && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>تصويب العبارة الخاطئة</dt>
                              <dd style={{ color: 'var(--ink-2)' }}>
                                نصف العلامة لاختيار «خطأ» ونصفها لتصويب يحقّق المجموعات:{' '}
                                {sp.correction.map((g, i) => <span key={i}>[{g.join(' / ')}] </span>)}
                              </dd>
                            </div>
                          )}
                          {sp.tolerance !== undefined && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>هامش القبول</dt>
                              <dd className="tnum" style={{ color: 'var(--ink-2)' }}>± {num(sp.tolerance)}</dd>
                            </div>
                          )}
                          {sp.recovery && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>آلية التعافي</dt>
                              <dd style={{ color: 'var(--ink-3)' }}><MathText text={sp.recovery} /></dd>
                            </div>
                          )}
                          {sp.depends && (
                            <div className="grid grid-cols-[118px_1fr] gap-2">
                              <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الاعتمادية</dt>
                              <dd style={{ color: 'var(--ink-3)' }}><MathText text={sp.depends} /></dd>
                            </div>
                          )}
                          <div className="grid grid-cols-[118px_1fr] gap-2">
                            <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الدرس والمرجع</dt>
                            <dd style={{ color: 'var(--ink-3)' }}>
                              {q.lessons.map((id) => `${LESSON_BY_ID[id].title} — ${LESSON_BY_ID[id].pages}`).join(' + ')}
                              {' · '}{q.source}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-[var(--r-sm)] p-3" style={{ background: 'var(--teal-soft)' }}>
                    <p className="text-[0.85rem] font-bold" style={{ color: 'var(--teal)' }}>أهداف الدرس/الدروس المقيسة في هذا السؤال</p>
                    <ul className="mt-1.5 grid gap-1 text-[0.84rem]" style={{ color: 'var(--ink-2)' }}>
                      {q.lessons.flatMap((id) =>
                        LESSON_BY_ID[id].objectives.map((o, i) => <li key={`${id}-${i}`}>• <MathText text={o} /></li>),
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>

      <section className="card mt-4 p-4">
        <h2 className="display mb-2 text-lg" style={{ color: 'var(--navy)' }}>سياسة التصحيح العامّة</h2>
        <ol className="grid gap-1.5 text-[0.88rem]" style={{ color: 'var(--ink-2)' }}>
          {[
            'لكل فرع علامة محدّدة، ومجموع علامات فروع السؤال يساوي علامة السؤال، ومجموع علامات الأسئلة العشرين يساوي 100 بالضبط.',
            'في المسائل الحسابية: علامة للطريقة/القاعدة، وعلامة للناتج النهائي، وعلامة للوحدة أو الترميز حيث يلزم.',
            'لا تُمنح علامة لناتج نهائي بلا سند عندما يطلب السؤال صراحةً طريقة أو تعليلًا.',
            'يُميَّز بين الخطأ المفهومي والزلة الحسابية: الزلة الحسابية في فرع لا تُخصم مرة ثانية في الفروع المعتمدة عليه ما دام المنهج صحيحاً.',
            'كل فرع معتمد له مسار حلّ مستقل أو قيمة بديلة معطاة في نصّ السؤال (آلية التعافي) حتى لا يستحيل حلّه بعد خطأ سابق.',
            'في التعليل يُقوَّم المعنى الرياضي بمجموعات كلمات مفتاحية ولا يُشترط تطابق الصياغة.',
            'في القياس والرسم بالمنقلة يُقبل هامش ±2 درجة، ويُقيَّم الشكل الناتج وخواصّه لا الوصف النصي وحده.',
            'لا تُعرض أي تلميحات أو تصحيحات للطالب قبل التسليم النهائي.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="tnum font-bold" style={{ color: 'var(--gold-deep)' }}>{num(i + 1)}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
          {' · '}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4" style={{ color: 'var(--teal)' }}>
            واتساب
          </a>
        </p>
      </section>
    </div>
  )
}

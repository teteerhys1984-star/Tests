import { useEffect, useState } from 'react'
import { CONTACT, LESSONS, TOTAL_MARKS } from '../exam/types'
import { gradeLabel, summarize, triggerDownload, type AttemptMeta, type QuestionResult } from '../exam/report'
import { MathText } from '../lib/mathx'
import { formatDuration, formatDurationWords, formatLong, num, pct } from '../lib/time'
import { FigureView } from '../exam/figureViews'
import { useReveal } from '../components/Chrome'

const STATUS_META: Record<string, { label: string; cls: string; color: string }> = {
  correct: { label: 'إجابة صحيحة', cls: 'badge-ok', color: 'var(--ok)' },
  partial: { label: 'صحيحة جزئياً', cls: 'badge-part', color: 'var(--warn)' },
  wrong: { label: 'إجابة خاطئة', cls: 'badge-err', color: 'var(--err)' },
  unanswered: { label: 'لم يُجب', cls: 'badge-mute', color: 'var(--ink-3)' },
}

function ScoreRing({ value, max }: { value: number; max: number }) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const r = 68
  const circ = 2 * Math.PI * r
  const [dash, setDash] = useState(circ)
  useEffect(() => {
    const t = window.setTimeout(() => setDash(circ * (1 - ratio)), 90)
    return () => window.clearTimeout(t)
  }, [circ, ratio])
  const stroke = ratio >= 0.85 ? '#14713f' : ratio >= 0.65 ? '#0f766e' : ratio >= 0.5 ? '#b5851d' : '#a52a2a'
  return (
    <div className="score-ring relative grid place-items-center" style={{ ['--circ' as string]: circ, ['--dash' as string]: dash }}>
      <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden>
        <circle cx="85" cy="85" r={r} fill="none" stroke="#e3d9c5" strokeWidth="13" />
        <circle cx="85" cy="85" r={r} fill="none" stroke={stroke} strokeWidth="13" strokeLinecap="round"
          className="val" strokeDasharray={circ} strokeDashoffset={dash} transform="rotate(-90 85 85)" />
      </svg>
      <div className="absolute text-center">
        <div className="display tnum text-[2.6rem] leading-none" style={{ color: stroke }}>{num(value)}</div>
        <div className="tnum text-sm font-bold" style={{ color: 'var(--ink-3)' }}>من {num(max)}</div>
      </div>
    </div>
  )
}

function Stat({ k, v, tone }: { k: string; v: string | number; tone?: string }) {
  return (
    <div className="rounded-[var(--r-sm)] border p-3 text-center transition-transform duration-300 hover:-translate-y-0.5"
      style={{ borderColor: 'var(--line-soft)', background: 'var(--surface-2)' }}>
      <div className="display tnum text-[1.65rem] leading-none" style={{ color: tone ?? 'var(--navy)' }}>{num(v)}</div>
      <div className="mt-1 text-[0.76rem] leading-tight" style={{ color: 'var(--ink-3)' }}>{k}</div>
    </div>
  )
}

export function Results({
  meta, results, reportText, filename, autoDownloaded, onRetry, onTeacher,
}: {
  meta: AttemptMeta
  results: QuestionResult[]
  reportText: string
  filename: string
  autoDownloaded: boolean | null
  onRetry: () => void
  onTeacher: () => void
}) {
  const sum = summarize(results)
  const [expandAll, setExpandAll] = useState(true)
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(results.map((r) => [r.displayNumber, true])),
  )
  const ref = useReveal<HTMLDivElement>()

  useEffect(() => {
    setOpen(Object.fromEntries(results.map((r) => [r.displayNumber, expandAll])))
  }, [expandAll, results])

  const redownload = () => triggerDownload(reportText, filename)

  return (
    <div ref={ref} className="relative z-10 mx-auto max-w-6xl px-3 pb-10 pt-5 sm:px-4">
      {/* ======= بطاقة النتيجة ======= */}
      <section className="relative overflow-hidden rounded-[var(--r-lg)] shadow-[var(--sh-3)]"
        style={{ background: 'linear-gradient(135deg,#0e2f3a 0%,#164a59 52%,#0f766e 100%)' }}>
        <div className="absolute inset-0 opacity-[0.12]" aria-hidden
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
          <div className="mx-auto">
            <ScoreRing value={sum.total} max={TOTAL_MARKS} />
          </div>
          <div className="text-[#f4ecd8]">
            <p className="kicker" style={{ color: '#ffd97a' }}>تم تسليم الاختبار وتصحيحه</p>
            <h1 className="display mt-1 text-[clamp(1.5rem,4.4vw,2.4rem)] leading-tight" style={{ color: '#fff8e8' }}>
              {meta.studentName}
            </h1>
            <p className="mt-1 text-[0.95rem] opacity-85">
              اختبار الرياضيات — الصف الخامس — الوحدة الأولى كاملة (الدروس الثمانية)
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="badge tnum" style={{ background: 'rgba(255,217,122,0.2)', color: '#ffd97a', borderColor: 'rgba(255,217,122,0.45)', fontSize: '0.95rem' }}>
                النسبة: <strong>{pct(sum.percentage)}</strong>
              </span>
              <span className="badge" style={{ background: 'rgba(255,248,232,0.14)', color: '#dcebee', borderColor: 'rgba(255,248,232,0.24)', fontSize: '0.95rem' }}>
                التقدير: <strong>{gradeLabel(sum.percentage)}</strong>
              </span>
              <span className="badge tnum" style={{ background: 'rgba(15,118,110,0.35)', color: '#bff0e6', borderColor: 'rgba(15,118,110,0.6)', fontSize: '0.95rem' }}>
                المدة: <strong>{formatDuration(meta.elapsedMs)}</strong>
              </span>
            </div>

            {/* حالة التنزيل */}
            <div className="mt-4 rounded-[var(--r-sm)] p-3 text-[0.88rem] leading-relaxed"
              style={{
                background: autoDownloaded ? 'rgba(20,113,63,0.24)' : 'rgba(180,71,47,0.26)',
                border: `1px solid ${autoDownloaded ? 'rgba(160,230,180,0.45)' : 'rgba(255,200,180,0.5)'}`,
              }}
              role="status" aria-live="polite">
              {autoDownloaded ? (
                <p style={{ color: '#dcf0e2' }}>
                  <strong>✓ بدأ تنزيل التقرير تلقائياً</strong> باسم{' '}
                  <span dir="ltr" className="font-mono">{filename}</span>. إن لم يظهر الملف فراجع مجلد التنزيلات
                  أو استعمل زر «تنزيل التقرير TXT» الاحتياطي أدناه.
                </p>
              ) : (
                <p style={{ color: '#fde3da' }}>
                  <strong>! منع المتصفح التنزيل التلقائي</strong> — استعمل زر «تنزيل التقرير TXT» الاحتياطي أدناه
                  لتنزيل الملف نفسه. قد يلزم السماح بهذا الموقع من تنزيل الملفات في إعدادات المتصفح.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-gold" onClick={redownload}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
                  <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
                </svg>
                تنزيل التقرير TXT
              </button>
              <button type="button" className="btn" style={{ background: 'rgba(255,248,232,0.14)', color: '#fff8e8', border: '1px solid rgba(255,248,232,0.3)' }}
                onClick={onRetry}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
                </svg>
                إعادة المحاولة
              </button>
              <button type="button" className="btn" style={{ background: 'transparent', color: '#cfe3e6', border: '1px dashed rgba(255,248,232,0.35)' }}
                onClick={onTeacher}>
                دليل المعلّم
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======= الإحصاءات ======= */}
      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="display mb-3 text-xl" style={{ color: 'var(--navy)' }}>ملخّص النتيجة</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat k="أسئلة صحيحة بالكامل" v={sum.full} tone="var(--ok)" />
          <Stat k="أسئلة صحيحة جزئياً" v={sum.partial} tone="var(--warn)" />
          <Stat k="أسئلة خاطئة" v={sum.wrong} tone="var(--err)" />
          <Stat k="فروع لم يُجب عنها" v={sum.unansweredSubparts} tone="var(--ink-3)" />
          <Stat k="فروع صحيحة" v={sum.correctSubparts} tone="var(--teal)" />
          <Stat k="فروع بعلامة جزئية" v={sum.partialSubparts} tone="var(--gold-deep)" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { t: 'بداية الاختبار', v: formatLong(meta.startAt) },
            { t: 'تسليم الاختبار', v: formatLong(meta.submitAt) },
            { t: 'المدة المنقضية', v: `${formatDuration(meta.elapsedMs)} — ${formatDurationWords(meta.elapsedMs)}` },
          ].map((x) => (
            <div key={x.t} className="rounded-[var(--r-sm)] border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--surface-2)' }}>
              <p className="text-[0.74rem] font-bold" style={{ color: 'var(--ink-3)' }}>{x.t}</p>
              <p className="tnum mt-0.5 text-[0.9rem] font-bold" style={{ color: 'var(--ink-1)' }}>{x.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[0.8rem] font-bold" style={{ color: 'var(--ink-3)' }}>الدروس المشمولة في الاختبار</p>
          <div className="flex flex-wrap gap-1.5">
            {LESSONS.map((l) => {
              let aw = 0, mx = 0
              for (const r of results) if (r.q.lessons.includes(l.id)) { aw += r.awarded; mx += r.max }
              return (
                <span key={l.id} className="badge badge-teal tnum" title={`${l.pages}`}>
                  {l.title}: {num(Math.round(aw * 100) / 100)}/{num(mx)}
                </span>
              )
            })}
          </div>
          <p className="mt-1.5 text-[0.74rem]" style={{ color: 'var(--ink-3)' }}>
            الأسئلة التركيبية تُحتسب في أكثر من درس، ولذلك قد يتجاوز مجموع أعمدة الدروس المئة علامة.
          </p>
        </div>
      </section>

      {/* ======= المراجعة التفصيلية ======= */}
      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-2xl" style={{ color: 'var(--navy)' }}>المراجعة التفصيلية والحلول</h2>
          <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-sm" onClick={() => setExpandAll((v) => !v)}>
            {expandAll ? 'طيّ كل الأسئلة' : 'فتح كل الأسئلة'}
          </button>
        </div>

        <div className="grid gap-3">
          {results.map((r) => {
            const isOpen = open[r.displayNumber] !== false
            const ratio = r.max ? r.awarded / r.max : 0
            const tone = ratio >= 0.999 ? 'var(--ok)' : ratio > 0 ? 'var(--warn)' : 'var(--err)'
            return (
              <article key={r.q.id} className="card reveal overflow-hidden">
                <button type="button" className="flex w-full items-start gap-3 p-3.5 text-start transition-colors duration-200 hover:bg-[var(--surface-2)]"
                  onClick={() => setOpen((o) => ({ ...o, [r.displayNumber]: !isOpen }))} aria-expanded={isOpen}>
                  <span className="display tnum grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)]"
                    style={{ background: 'var(--navy)', color: '#ffd97a' }}>
                    {num(r.displayNumber)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1rem] font-extrabold" style={{ color: 'var(--ink-1)' }}>
                      <MathText text={r.q.title} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="badge tnum" style={{ background: `${tone}1a`, color: tone, borderColor: `${tone}55` }}>
                        {num(r.awarded)} / {num(r.max)} علامة
                      </span>
                      {r.q.lessons.map((id) => (
                        <span key={id} className="badge badge-mute">{LESSONS.find((l) => l.id === id)?.short ?? id}</span>
                      ))}
                      {r.q.integrated && <span className="badge badge-gold">تركيبي</span>}
                    </span>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                    className="mt-1 shrink-0 transition-transform duration-300" style={{ color: 'var(--ink-3)', transform: isOpen ? 'rotate(180deg)' : 'none' }} aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t p-3.5 sm:p-4" style={{ borderColor: 'var(--line-soft)' }}>
                    {r.q.intro && (
                      <p className="mb-3 rounded-[var(--r-sm)] border p-3 text-[0.93rem] leading-relaxed"
                        style={{ borderColor: '#e3d9c5', background: 'var(--surface-2)' }}>
                        <MathText text={r.q.intro} />
                      </p>
                    )}
                    {r.q.figure && <div className="mb-3"><FigureView id={r.q.figure} /></div>}
                    <p className="mb-3 text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
                      المرجع: {r.q.source} · مستوى الصعوبة: {r.q.difficulty}
                    </p>

                    <div className="grid gap-2.5">
                      {r.subparts.map((s) => {
                        const m = STATUS_META[s.res.status]
                        return (
                          <div key={s.sp.id} className="rounded-[var(--r-sm)] border p-3"
                            style={{ borderColor: 'var(--line-soft)', borderInlineStartColor: m.color, borderInlineStartWidth: 4, background: '#fff' }}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="display text-base font-bold" style={{ color: 'var(--navy)' }}>الفرع ({s.sp.label})</span>
                              <span className="flex items-center gap-1.5">
                                <span className={`badge ${m.cls}`}>{m.label}</span>
                                <span className="badge badge-mute tnum">{num(s.res.awarded)} / {num(s.sp.marks)}</span>
                              </span>
                            </div>
                            <p className="mb-2.5 text-[0.95rem] leading-relaxed"><MathText text={s.sp.prompt} /></p>

                            <dl className="grid gap-1.5 text-[0.9rem]">
                              <div className="grid grid-cols-[112px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>إجابتك</dt>
                                <dd style={{ color: s.res.status === 'correct' ? 'var(--ok)' : 'var(--clay)' }} dir="auto">
                                  <MathText text={s.studentText} />
                                </dd>
                              </div>
                              <div className="grid grid-cols-[112px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الإجابة الصحيحة</dt>
                                <dd style={{ color: 'var(--ok)' }}><MathText text={s.sp.answerText} /></dd>
                              </div>
                              <div className="grid grid-cols-[112px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الحلّ المفصّل</dt>
                                <dd style={{ color: 'var(--ink-2)' }}><MathText as="div" text={s.sp.solution} /></dd>
                              </div>
                              <div className="grid grid-cols-[112px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>القاعدة/الخاصة</dt>
                                <dd style={{ color: 'var(--ink-2)' }}><MathText text={s.sp.rule} /></dd>
                              </div>
                              {s.res.status !== 'correct' && (
                                <div className="grid grid-cols-[112px_1fr] gap-2">
                                  <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الخطأ الشائع</dt>
                                  <dd style={{ color: 'var(--clay)' }}><MathText text={s.sp.mistake} /></dd>
                                </div>
                              )}
                              {s.res.status === 'partial' && (
                                <div className="grid grid-cols-[112px_1fr] gap-2">
                                  <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>العلامة الجزئية</dt>
                                  <dd className="tnum" style={{ color: 'var(--warn)' }}>
                                    تحقّق {num(s.res.hits)} من {num(s.res.total)} عناصر سلّم التقويم، فمُنحت {num(s.res.awarded)} من {num(s.sp.marks)}.
                                  </dd>
                                </div>
                              )}
                              {s.sp.recovery && (
                                <div className="grid grid-cols-[112px_1fr] gap-2">
                                  <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>آلية التعافي</dt>
                                  <dd style={{ color: 'var(--ink-3)' }}><MathText text={s.sp.recovery} /></dd>
                                </div>
                              )}
                              <div className="grid grid-cols-[112px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: 'var(--ink-3)' }}>الهدف / الدرس</dt>
                                <dd style={{ color: 'var(--ink-3)' }}>
                                  <MathText text={s.sp.objective} /> —{' '}
                                  {r.q.lessons.map((id) => LESSONS.find((l) => l.id === id)?.title).join(' و')}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {/* ======= التذييل ======= */}
      <section className="card mt-5 p-4 text-center text-sm" style={{ background: 'var(--surface-2)' }}>
        <p className="font-bold" style={{ color: 'var(--ink-2)' }}>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
          {' · '}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4"
            style={{ color: 'var(--teal)' }}>واتساب</a>
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
          التقرير محفوظ محلياً على جهازك بصيغة TXT، ولم تُرسل أيّ بيانات إلى أي خادم. رابط واتساب للتواصل فقط.
        </p>
      </section>
    </div>
  )
}

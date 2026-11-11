import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from './exam/types'
import { CONTACT, TOTAL_MARKS } from './exam/types'
import { QUESTIONS } from './exam/questions'
import { SUBPART_COUNT } from './exam/questions'
import { playStartSound, playSubmitSound, primeAudio, resetSounds } from './lib/audio'
import { formatDuration, num } from './lib/time'
import type { Answers, AnswerValue } from './exam/grading'
import { gradeAll, summarize, buildReport, validateReport, reportFilename, triggerDownload, type AttemptMeta, type QuestionResult } from './exam/report'
import { ContactBar, Footer } from './components/Chrome'
import { Welcome } from './screens/Welcome'
import { Exam } from './screens/Exam'
import { Results } from './screens/Results'
import { Teacher } from './screens/Teacher'

type Phase = 'welcome' | 'exam' | 'results' | 'teacher'

/** الخيارات التي يجب ألّا تُخلط لأنها مرتبطة بترقيم الأشكال في الرسم. */
const NO_OPTION_SHUFFLE = new Set(['q16a'])

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}

/**
 * خلط الأسئلة الرئيسية كمجموعات كاملة (لا يُفصل فرع عن سؤاله)
 * وخلط خيارات الإجابة ومفردات المطابقة حيث يكون ذلك مناسباً،
 * مع الحفاظ على ربط الإجابات الصحيحة (المعرّفات لا تتغيّر).
 */
function buildOrder(): Question[] {
  return shuffle(QUESTIONS).map((q) => {
    const subparts = q.subparts.map((sp) => {
      if (NO_OPTION_SHUFFLE.has(sp.id)) return sp
      if ((sp.kind === 'choice' || sp.kind === 'multiselect') && sp.options) {
        return { ...sp, options: shuffle(sp.options) }
      }
      if (sp.kind === 'matching' && sp.rows) {
        return {
          ...sp,
          rows: shuffle(sp.rows).map((r) => ({ ...r, options: shuffle(r.options) })),
        }
      }
      return sp
    })
    return { ...q, subparts }
  })
}

const TOTAL_SUBPARTS = QUESTIONS.reduce((s, q) => s + q.subparts.length, 0)

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [studentName, setStudentName] = useState('')
  const [order, setOrder] = useState<Question[]>(() => QUESTIONS.slice())
  const [answers, setAnswers] = useState<Answers>({})
  const [startAt, setStartAt] = useState<Date | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [results, setResults] = useState<QuestionResult[] | null>(null)
  const [meta, setMeta] = useState<AttemptMeta | null>(null)
  const [reportText, setReportText] = useState('')
  const [filename, setFilename] = useState('')
  const [autoDownloaded, setAutoDownloaded] = useState<boolean | null>(null)
  const startSoundDone = useRef(false)

  /* ---------- المؤقّت التصاعدي (يعتمد الطوابع الزمنية فيبقى دقيقاً حتى مع خمول التبويب) ---------- */
  useEffect(() => {
    if (phase !== 'exam' || !startAt) return
    const tick = () => setElapsedMs(Date.now() - startAt.getTime())
    tick()
    const id = window.setInterval(tick, 1000)
    const onVis = () => tick()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [phase, startAt])

  const setAnswer = useCallback((id: string, v: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: v }))
  }, [])

  /* ---------- بدء الاختبار ---------- */
  const handleStart = useCallback((name: string) => {
    primeAudio()
    resetSounds()
    startSoundDone.current = false
    setStudentName(name)
    setAnswers({})
    setResults(null)
    setMeta(null)
    setReportText('')
    setFilename('')
    setAutoDownloaded(null)
    setElapsedMs(0)
    setOrder(buildOrder())
    setStartAt(new Date())
    setPhase('exam')
    // تُعزف نغمة البدء مرّة واحدة فقط، داخل حدث النقر نفسه (احتراماً لقيود التشغيل التلقائي)
    if (!startSoundDone.current) {
      startSoundDone.current = true
      playStartSound()
    }
  }, [])

  /* ---------- التسليم: تصحيح + تقرير + تنزيل تلقائي + صوت + صفحة النتيجة، بنقرة واحدة ---------- */
  const handleSubmit = useCallback(() => {
    if (!startAt) return
    const submit = new Date()
    const elapsed = submit.getTime() - startAt.getTime()

    // تجميد الإجابات (نسخة ثابتة لا تتغيّر بعد التسليم)
    const frozen: Answers = { ...answers }

    // التصحيح الفوري والمتزامن
    const graded = gradeAll(order, frozen)

    // توليد التقرير والتحقّق منه قبل التنزيل
    const attempt: AttemptMeta = { studentName, startAt: startAt, submitAt: submit, elapsedMs: elapsed }
    const report = buildReport(attempt, graded)
    const missing = validateReport(report, attempt, graded)
    const fname = reportFilename(studentName)

    // التنزيل داخل معالج حدث النقر نفسه (بلا أي انتظار غير متزامن)
    let ok = false
    if (missing.length === 0) ok = triggerDownload(report, fname)

    // نغمة التسليم مرّة واحدة فقط
    playSubmitSound()

    setElapsedMs(elapsed)
    setAnswers(frozen)
    setResults(graded)
    setMeta(attempt)
    setReportText(report)
    setFilename(fname)
    setAutoDownloaded(ok)
    setPhase('results')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [answers, order, startAt, studentName])

  /* ---------- إعادة المحاولة ---------- */
  const handleRetry = useCallback(() => {
    resetSounds()
    startSoundDone.current = false
    setPhase('welcome')
    setStudentName('')
    setAnswers({})
    setResults(null)
    setMeta(null)
    setReportText('')
    setFilename('')
    setAutoDownloaded(null)
    setStartAt(null)
    setElapsedMs(0)
    setOrder(buildOrder())
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const summary = useMemo(() => (results ? summarize(results) : null), [results])

  return (
    <div className="relative min-h-screen">
      <div className="ambient" aria-hidden />
      <ContactBar position="top" />

      {phase !== 'exam' && (
        <header className="relative z-10 border-b" style={{ borderColor: 'var(--line)', background: 'rgba(255,253,247,0.72)' }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <p className="display text-[0.98rem] sm:text-[1.05rem]" style={{ color: 'var(--navy)' }}>
              اختبار الرياضيات <span style={{ color: 'var(--gold-deep)' }}>·</span> الصف الخامس{' '}
              <span style={{ color: 'var(--gold-deep)' }}>·</span> الوحدة الأولى كاملة
            </p>
            <p className="text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
              {num(QUESTIONS.length)} سؤالاً · {num(SUBPART_COUNT)} فرعاً · {num(TOTAL_MARKS)} علامة
            </p>
          </div>
        </header>
      )}

      {phase === 'welcome' && (
        <Welcome onStart={handleStart} onTeacher={() => setPhase('teacher')} initialName="" />
      )}

      {phase === 'teacher' && <Teacher onExit={() => setPhase('welcome')} />}

      {phase === 'exam' && (
        <Exam
          studentName={studentName}
          order={order}
          answers={answers}
          setAnswer={setAnswer}
          elapsedMs={elapsedMs}
          onSubmit={handleSubmit}
          totalSubparts={TOTAL_SUBPARTS}
        />
      )}

      {phase === 'results' && meta && results && summary && (
        <Results
          meta={meta}
          results={results}
          reportText={reportText}
          filename={filename}
          autoDownloaded={autoDownloaded}
          onRetry={handleRetry}
          onTeacher={() => setPhase('teacher')}
        />
      )}

      {phase === 'exam' && (
        <div className="pointer-events-none fixed bottom-[76px] left-1/2 z-30 -translate-x-1/2 sm:hidden">
          <span className="badge tnum" style={{ background: 'var(--navy)', color: '#ffd97a', borderColor: 'transparent', boxShadow: 'var(--sh-2)' }}>
            الزمن المنقضي {formatDuration(elapsedMs)} · {CONTACT.phone}
          </span>
        </div>
      )}

      <Footer />
    </div>
  )
}

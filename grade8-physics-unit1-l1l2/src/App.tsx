import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from './exam/types'
import { CONTACT, TOTAL_MARKS } from './exam/types'
import { QUESTIONS, SUBPART_COUNT } from './exam/questions'
import { playStartSound, playSubmitSound, primeAudio, resetSounds } from './lib/audio'
import { formatDuration, num } from './lib/time'
import type { Answers, AnswerValue } from './exam/grading'
import {
  gradeAll, summarize, buildReport, validateReport, reportFilename, triggerDownload,
  type AttemptMeta, type QuestionResult,
} from './exam/report'
import {
  buildPayload, newAttemptId, retryPending, sendWithRetry,
  type SendStatus, type SubmissionPayload,
} from './exam/submit'
import { ContactBar, Footer } from './components/Chrome'
import { Welcome } from './screens/Welcome'
import { Exam } from './screens/Exam'
import { Review } from './screens/Review'
import { Results } from './screens/Results'

type Phase = 'welcome' | 'exam' | 'review' | 'results'

const TOTAL_SUBPARTS = QUESTIONS.reduce((s, q) => s + q.subparts.length, 0)

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [studentName, setStudentName] = useState('')
  const order = QUESTIONS as readonly Question[]
  const [answers, setAnswers] = useState<Answers>({})
  const [startAt, setStartAt] = useState<Date | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [results, setResults] = useState<QuestionResult[] | null>(null)
  const [meta, setMeta] = useState<AttemptMeta | null>(null)
  const [reportText, setReportText] = useState('')
  const [filename, setFilename] = useState('')
  const [autoDownloaded, setAutoDownloaded] = useState<boolean | null>(null)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const startSoundDone = useRef(false)
  /** حمولة المحاولة المعروضة حالياً (يعيد زر «إعادة إرسال النتيجة» إرسالها)، والحمولة الجاري إرسالها الآن. */
  const outbox = useRef<SubmissionPayload | null>(null)
  const sending = useRef<SubmissionPayload | null>(null)

  /* ---------- عند تحميل التطبيق: إعادة إرسال النتائج المعلّقة من محاولات سابقة، بصمت ---------- */
  useEffect(() => {
    void retryPending()
  }, [])

  /* ---------- إرسال النتيجة إلى المعلّم في الخلفية (لا ينتظره شيء في الواجهة) ---------- */
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return
    sending.current = payload
    setSendStatus('sending')
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null
      if (outbox.current === payload) setSendStatus(ok ? 'success' : 'failed')
    })
  }, [])

  const handleResend = useCallback(() => {
    if (outbox.current) sendResult(outbox.current)
  }, [sendResult])

  /* ---------- المؤقّت التصاعدي ---------- */
  useEffect(() => {
    if ((phase !== 'exam' && phase !== 'review') || !startAt) return
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

  const resetAttemptState = useCallback(() => {
    setAnswers({})
    setResults(null)
    setMeta(null)
    setReportText('')
    setFilename('')
    setAutoDownloaded(null)
    outbox.current = null
    setSendStatus('idle')
    setElapsedMs(0)
  }, [])

  /* ---------- بدء الاختبار ---------- */
  const handleStart = useCallback((name: string) => {
    primeAudio()
    resetSounds()
    startSoundDone.current = false
    setStudentName(name)
    resetAttemptState()
    setStartAt(new Date())
    setPhase('exam')
    window.scrollTo({ top: 0, behavior: 'auto' })
    if (!startSoundDone.current) {
      startSoundDone.current = true
      playStartSound()
    }
  }, [resetAttemptState])

  /* ---------- التسليم: تصحيح + تقرير + تنزيل تلقائي + صفحة النتيجة + إرسال بنقرة واحدة ---------- */
  const handleSubmit = useCallback(() => {
    if (!startAt) return
    const submit = new Date()
    const elapsed = submit.getTime() - startAt.getTime()

    // تجميد الإجابات
    const frozen: Answers = { ...answers }

    // التصحيح الفوري والمتزامن
    const graded = gradeAll(order.slice(), frozen)

    // توليد التقرير والتحقّق منه قبل التنزيل
    const attempt: AttemptMeta = { studentName, startAt, submitAt: submit, elapsedMs: elapsed }
    const report = buildReport(attempt, graded)
    const missing = validateReport(report, attempt, graded)
    const fname = reportFilename(studentName)

    // التنزيل داخل معالج حدث النقر نفسه (بلا انتظار غير متزامن)
    let ok = false
    if (missing.length === 0) ok = triggerDownload(report, fname)

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

    // إرسال النتيجة إلى المعلّم: يبدأ بعد التنزيل وعرض النتيجة ولا ينتظره أيٌّ منهما.
    try {
      const payload = buildPayload({ attemptId: newAttemptId(), meta: attempt, order: order.slice(), answers: frozen, reportText: report })
      outbox.current = payload
      sendResult(payload)
    } catch {
      outbox.current = null
      setSendStatus('failed')
    }
  }, [answers, order, sendResult, startAt, studentName])

  /* ---------- إعادة الاختبار (محاولة جديدة تماماً) ---------- */
  const handleRetry = useCallback(() => {
    resetSounds()
    startSoundDone.current = false
    setPhase('welcome')
    setStudentName('')
    setStartAt(null)
    resetAttemptState()
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [resetAttemptState])

  const summary = useMemo(() => (results ? summarize(results) : null), [results])
  const answeredCount = useMemo(
    () => order.reduce((s, q) => s + q.subparts.filter((sp) => {
      const v = answers[sp.id]
      if (v === null || v === undefined) return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'object' && 'value' in v) {
        const t = v as { value: string; correction?: string }
        return Boolean(t.value) && (!sp.requireCorrection || (t.correction ?? '').trim().length >= 3)
      }
      if (typeof v === 'object') return Object.values(v as Record<string, string>).every((x) => String(x ?? '').trim().length > 0)
      return String(v).trim().length > 0
    }).length, 0),
    [answers, order],
  )

  return (
    <div className="relative min-h-screen">
      <div className="ambient" aria-hidden />
      <ContactBar position="top" />

      {phase !== 'exam' && phase !== 'review' && (
        <header className="relative z-10 border-b" style={{ borderColor: 'var(--line)', background: 'rgba(255,253,247,0.72)' }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <p className="display text-[0.98rem] sm:text-[1.05rem]" style={{ color: 'var(--navy)' }}>
              اختبار الفيزياء <span style={{ color: 'var(--gold-deep)' }}>·</span> الصف الثامن{' '}
              <span style={{ color: 'var(--gold-deep)' }}>·</span> الوحدة الأولى — الدرسان 1 و 2
            </p>
            <p className="text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
              {num(QUESTIONS.length)} أسئلة · {num(SUBPART_COUNT)} فرعاً · {num(TOTAL_MARKS)} علامة
            </p>
          </div>
        </header>
      )}

      {phase === 'welcome' && <Welcome onStart={handleStart} />}

      {phase === 'exam' && (
        <Exam
          studentName={studentName}
          order={order.slice()}
          answers={answers}
          setAnswer={setAnswer}
          elapsedMs={elapsedMs}
          onFinish={() => { setPhase('review'); window.scrollTo({ top: 0, behavior: 'auto' }) }}
          totalSubparts={TOTAL_SUBPARTS}
        />
      )}

      {phase === 'review' && (
        <Review
          studentName={studentName}
          order={order.slice()}
          answers={answers}
          elapsedMs={elapsedMs}
          answeredCount={answeredCount}
          totalSubparts={TOTAL_SUBPARTS}
          onBackToQuestion={() => { setPhase('exam'); window.scrollTo({ top: 0, behavior: 'auto' }) }}
          onSubmit={handleSubmit}
          onExit={() => { setPhase('exam'); window.scrollTo({ top: 0, behavior: 'auto' }) }}
        />
      )}

      {phase === 'results' && meta && results && summary && (
        <Results
          meta={meta}
          results={results}
          reportText={reportText}
          filename={filename}
          autoDownloaded={autoDownloaded}
          sendStatus={sendStatus}
          onResend={handleResend}
          onRetry={handleRetry}
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

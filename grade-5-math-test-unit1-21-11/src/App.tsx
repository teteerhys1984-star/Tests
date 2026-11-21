import { useCallback, useEffect, useState } from 'react'
import { EXAM_ID, EXAM_TITLE, EXAM_TITLE_AR } from './config'
import {
  buildResults,
  clearAttempt,
  createAttempt,
  loadAttempt,
  saveAttempt,
  type Attempt,
} from './lib/attempt'
import { isMuted, playCue, setMuted as persistMuted } from './lib/audio'
import { buildPayload, newAttemptId, pendingCount, retryPending, sendWithRetry, type SendStatus } from './lib/submit'
import { buildReportText } from './lib/report'
import { QUESTIONS } from './data/index'
import type { AnswerValue } from './lib/types'
import { StartScreen } from './screens/StartScreen'
import { QuizScreen } from './screens/QuizScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { TeacherScreen } from './screens/TeacherScreen'

const isTeacherRoute = () => window.location.hash === '#teacher'

/** المحاولة محفوظة مع attemptId ثابت ومستقل لكل محاولة. */
export function attemptStorageKey(): string {
  return `${EXAM_ID}-attempt-v1`
}

/**
 * هيكل التطبيق. الحالات:
 *  - لا محاولة            → شاشة البداية (الاسم مطلوب، المؤقت لا يبدأ بعد)
 *  - محاولة قيد الحل       → شاشة الأسئلة (تحديث الصفحة يستعيد المحاولة نفسها)
 *  - شاشة المراجعة         → قبل التسليم، مع تأكيد صريح
 *  - محاولة مسلَّمة         → النتيجة والتفاصيل
 * لوحة المعلم خلف المسار #teacher ولا يوجد أي رابط لها في واجهة الطالب.
 */
export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt())
  const [teacher, setTeacher] = useState<boolean>(isTeacherRoute)
  const [muted, setMutedState] = useState<boolean>(isMuted)
  const [reviewing, setReviewing] = useState(false)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [pending, setPending] = useState<number>(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)

  useEffect(() => {
    const onHash = () => setTeacher(isTeacherRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /* عند فتح الاختبار: إعادة الإرسال التلقائي للمحاولات المعلّقة لهذا الاختبار وحده */
  useEffect(() => {
    let alive = true
    void retryPending().then(() => {
      if (alive) setPending(pendingCount())
    })
    setPending(pendingCount())
    return () => {
      alive = false
    }
  }, [])

  const update = useCallback((fn: (a: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      saveAttempt(next)
      return next
    })
  }, [])

  const toggleMute = () => {
    const next = !muted
    persistMuted(next)
    setMutedState(next)
  }

  const submit = useCallback(
    (current: Attempt) => {
      const submittedAt = Date.now()
      // معرّف المحاولة يُثبَّت مرة واحدة ويُحفظ معها، فلا يتغيّر عند إعادة الإرسال.
      const id = current.attemptId ?? newAttemptId()
      const done: Attempt = { ...current, submittedAt, confirmed: true, current: 0, attemptId: id }
      saveAttempt(done)
      setAttempt(done)
      setReviewing(false)
      playCue('submit')

      const summary = buildResults(QUESTIONS, done)
      const reportText = buildReportText(summary)
      setAttemptId(id)
      setSendStatus('sending')
      const payload = buildPayload({
        attemptId: id,
        studentName: done.studentName,
        startedAt: done.startedAt,
        submittedAt,
        elapsedMs: submittedAt - done.startedAt,
        order: QUESTIONS,
        answers: done.answers,
        reportText,
      })
      void sendWithRetry(payload).then((ok) => {
        setSendStatus(ok ? 'success' : 'failed')
        setPending(pendingCount())
      })
    },
    [],
  )

  const resend = useCallback(() => {
    if (!attempt || attempt.submittedAt === null) return
    const summary = buildResults(QUESTIONS, attempt)
    const reportText = buildReportText(summary)
    const id = attempt.attemptId ?? attemptId ?? newAttemptId()
    if (!attempt.attemptId) {
      const patched: Attempt = { ...attempt, attemptId: id }
      saveAttempt(patched)
      setAttempt(patched)
    }
    setAttemptId(id)
    setSendStatus('sending')
    const payload = buildPayload({
      attemptId: id,
      studentName: attempt.studentName,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      elapsedMs: attempt.submittedAt - attempt.startedAt,
      order: QUESTIONS,
      answers: attempt.answers,
      reportText,
    })
    void sendWithRetry(payload).then((ok) => {
      setSendStatus(ok ? 'success' : 'failed')
      setPending(pendingCount())
    })
  }, [attempt, attemptId])

  /* لوحة المعلم لا تظهر أبداً أثناء وجود محاولة نشطة (غير مسلَّمة) */
  const activeAttempt = attempt !== null && attempt.submittedAt === null
  if (teacher && !activeAttempt) return <TeacherScreen />

  if (!attempt) {
    return (
      <StartScreen
        titleAr={EXAM_TITLE_AR}
        titleEn={EXAM_TITLE}
        muted={muted}
        onToggleMute={toggleMute}
        pending={pending}
        onStart={(name) => {
          const fresh = createAttempt(name, Date.now())
          saveAttempt(fresh)
          setAttempt(fresh)
          setAttemptId(null)
          setSendStatus('idle')
          playCue('start')
        }}
      />
    )
  }

  if (attempt.submittedAt !== null) {
    return (
      <ResultsScreen
        attempt={attempt}
        muted={muted}
        onToggleMute={toggleMute}
        sendStatus={sendStatus}
        pending={pending}
        onResend={resend}
        onRestart={() => {
          clearAttempt()
          setAttempt(null)
          setAttemptId(null)
          setSendStatus('idle')
          setReviewing(false)
        }}
        onTeacher={() => {
          window.location.hash = '#teacher'
        }}
      />
    )
  }

  if (reviewing) {
    return (
      <ReviewScreen
        attempt={attempt}
        muted={muted}
        onToggleMute={toggleMute}
        onBack={() => setReviewing(false)}
        onConfirm={() => submit(attempt)}
      />
    )
  }

  return (
    <QuizScreen
      attempt={attempt}
      muted={muted}
      onToggleMute={toggleMute}
      onAnswer={(partId: string, value: AnswerValue) =>
        update((a) => ({ ...a, answers: { ...a.answers, [partId]: value } }))
      }
      onGo={(index: number) => update((a) => ({ ...a, current: index }))}
      onReview={() => setReviewing(true)}
    />
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS } from './exam/questions'
import { gradeExam } from './exam/grading'
import { clearState, initialState, loadState, saveState, type ExamState } from './exam/storage'
import { playSound } from './exam/sounds'
import { elapsedMs } from './exam/timer'
import { buildReport } from './exam/report'
import { buildPayload, newAttemptId, retryPending, sendWithRetry, type SendStatus } from './exam/submit'
import type { AnswerValue } from './exam/types'
import { StartScreen } from './components/StartScreen'
import { ExamScreen } from './components/ExamScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { TeacherArea } from './components/TeacherArea'
import { Footer } from './components/Footer'

export default function App() {
  const [state, setState] = useState<ExamState>(() => loadState())
  const [teacher, setTeacher] = useState(false)
  const [storageOk, setStorageOk] = useState(true)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [pendingFlushed, setPendingFlushed] = useState(false)
  const autoStarted = useRef(false)
  const currentAttempt = useRef(state.attemptId)
  currentAttempt.current = state.attemptId
  const mutedRef = useRef(state.muted)
  mutedRef.current = state.muted

  // Persist every change (auto-save + refresh restore)
  useEffect(() => {
    setStorageOk(saveState(state))
  }, [state])

  const start = useCallback((name: string) => {
    playSound('start', mutedRef.current)
    setState((s) => ({ ...initialState(), muted: s.muted, name, phase: 'exam', startedAt: Date.now(), attemptId: newAttemptId() }))
  }, [])

  const answer = useCallback((subId: string, v: AnswerValue) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [subId]: v } }))
  }, [])

  const navigate = useCallback((i: number) => {
    setState((s) => ({ ...s, current: Math.max(0, Math.min(QUESTIONS.length - 1, i)) }))
  }, [])

  const submit = useCallback(() => {
    playSound('submit', mutedRef.current)
    setState((s) => ({ ...s, phase: 'results', submittedAt: Date.now() }))
    window.scrollTo({ top: 0 })
  }, [])

  const restart = useCallback(() => {
    clearState()
    setSendStatus('idle')
    setState((s) => ({ ...initialState(), muted: s.muted }))
    window.scrollTo({ top: 0 })
  }, [])

  const toggleMute = useCallback(() => setState((s) => ({ ...s, muted: !s.muted })), [])

  const result = useMemo(() => (state.phase === 'results' ? gradeExam(QUESTIONS, state.answers) : null), [state.phase, state.answers])

  const sendCurrent = useCallback(async () => {
    if (state.phase !== 'results' || !state.startedAt || !state.submittedAt || !state.attemptId) return
    setSendStatus('sending')
    const result = gradeExam(QUESTIONS, state.answers)
    const report = buildReport({ name: state.name, result, questions: QUESTIONS, elapsedMs: elapsedMs(state.startedAt, state.submittedAt, state.submittedAt), submittedAt: state.submittedAt })
    const ok = await sendWithRetry(buildPayload(state, report))
    if (currentAttempt.current === state.attemptId) setSendStatus(ok ? 'success' : 'failed')
  }, [state])

  useEffect(() => {
    if (autoStarted.current) return
    autoStarted.current = true
    // Flush older attempts as well; same attempt IDs make repeated sends idempotent.
    void retryPending({ excludeAttemptId: state.phase === 'results' ? state.attemptId : undefined }).finally(() => setPendingFlushed(true))
  }, [])
  useEffect(() => {
    if (pendingFlushed && state.phase === 'results') void sendCurrent()
  }, [pendingFlushed, state.phase, state.attemptId]) // frozen answers do not change after submission

  return (
    <div dir="rtl" lang="ar" className="min-h-dvh">
      {!storageOk && <div role="alert" className="mx-auto max-w-3xl rounded-xl bg-sun-100 p-3 text-center text-sm font-bold text-peach-600">تعذر الحفظ المحلي. لا تغلق الصفحة، ونزّل تقريرك بعد التسليم؛ قد يتعذر حفظ الإرسال المعلّق أيضاً.</div>}
      <main>
        {teacher ? (
          <TeacherArea onClose={() => setTeacher(false)} state={state} />
        ) : state.phase === 'start' ? (
          <StartScreen onStart={start} muted={state.muted} onToggleMute={toggleMute} />
        ) : state.phase === 'exam' && state.startedAt ? (
          <ExamScreen
            questions={QUESTIONS}
            answers={state.answers}
            current={state.current}
            name={state.name}
            startedAt={state.startedAt}
            muted={state.muted}
            onToggleMute={toggleMute}
            onAnswer={answer}
            onNavigate={navigate}
            onSubmit={submit}
          />
        ) : result && state.submittedAt ? (
          <ResultsScreen
            name={state.name}
            questions={QUESTIONS}
            result={result}
            elapsedMs={elapsedMs(state.startedAt, state.submittedAt, state.submittedAt)}
            submittedAt={state.submittedAt}
            sendStatus={sendStatus}
            onRetry={() => void sendCurrent()}
            onRestart={restart}
          />
        ) : null}
      </main>
      {state.phase !== 'exam' && <Footer onTeacher={() => setTeacher(true)} />}
    </div>
  )
}

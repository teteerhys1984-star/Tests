import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS } from './exam/questions'
import { gradeExam } from './exam/grading'
import { clearState, initialState, loadState, saveState, type ExamState } from './exam/storage'
import { playSound } from './exam/sounds'
import { elapsedMs } from './exam/timer'
import type { AnswerValue } from './exam/types'
import { StartScreen } from './components/StartScreen'
import { ExamScreen } from './components/ExamScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { TeacherArea } from './components/TeacherArea'
import { Footer } from './components/Footer'

export default function App() {
  const [state, setState] = useState<ExamState>(() => loadState())
  const [teacher, setTeacher] = useState(false)
  const mutedRef = useRef(state.muted)
  mutedRef.current = state.muted

  // Persist every change (auto-save + refresh restore)
  useEffect(() => {
    saveState(state)
  }, [state])

  const start = useCallback((name: string) => {
    playSound('start', mutedRef.current)
    setState((s) => ({ ...initialState(), muted: s.muted, name, phase: 'exam', startedAt: Date.now() }))
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
    setState((s) => ({ ...initialState(), muted: s.muted }))
    window.scrollTo({ top: 0 })
  }, [])

  const toggleMute = useCallback(() => setState((s) => ({ ...s, muted: !s.muted })), [])

  const result = useMemo(() => (state.phase === 'results' ? gradeExam(QUESTIONS, state.answers) : null), [state.phase, state.answers])

  return (
    <div dir="rtl" lang="ar" className="min-h-dvh">
      <main>
        {teacher ? (
          <TeacherArea onClose={() => setTeacher(false)} />
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
            onRestart={restart}
          />
        ) : null}
      </main>
      {state.phase !== 'exam' && <Footer onTeacher={() => setTeacher(true)} />}
    </div>
  )
}

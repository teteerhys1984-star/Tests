import { useCallback, useEffect, useState } from 'react'
import { clearAttempt, createAttempt, loadAttempt, saveAttempt, type Attempt } from './lib/attempt'
import { isMuted, playCue, setMuted as persistMuted } from './lib/audio'
import type { AnswerValue } from './lib/types'
import { StartScreen } from './screens/StartScreen'
import { QuizScreen } from './screens/QuizScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { TeacherScreen } from './screens/TeacherScreen'

const isTeacherRoute = () => window.location.hash === '#teacher'

/**
 * Application shell. Three student states, driven by the persisted attempt:
 *  - no attempt        → start screen (name required; timer does not run yet)
 *  - attempt running   → quiz (a page refresh resumes exactly this attempt)
 *  - attempt submitted → results (a refresh keeps showing the results)
 * The teacher answer key lives behind the hash route #teacher and is never linked from the student UI.
 */
export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt())
  const [teacher, setTeacher] = useState<boolean>(isTeacherRoute)
  const [muted, setMutedState] = useState<boolean>(isMuted)

  useEffect(() => {
    const onHash = () => setTeacher(isTeacherRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
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

  if (teacher) return <TeacherScreen />

  if (!attempt) {
    return (
      <StartScreen
        muted={muted}
        onToggleMute={toggleMute}
        onStart={(name) => {
          const fresh = createAttempt(name, Date.now())
          saveAttempt(fresh)
          setAttempt(fresh)
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
        onRestart={() => {
          clearAttempt()
          setAttempt(null)
        }}
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
      onSubmit={() => {
        update((a) => (a.submittedAt === null ? { ...a, submittedAt: Date.now() } : a))
        playCue('submit')
      }}
    />
  )
}

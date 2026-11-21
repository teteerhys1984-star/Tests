// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { EXAM_ID } from '../src/config'
import {
  STORAGE_KEY,
  clearAttempt,
  createAttempt,
  elapsedMs,
  loadAttempt,
  saveAttempt,
  type Attempt,
} from '../src/lib/attempt'
import { isMuted, setMuted } from '../src/lib/audio'
import { PENDING_PREFIX, pendingCount, pendingKey } from '../src/lib/submit'
import { buildResults } from '../src/lib/attempt'
import { QUESTIONS, TOTAL_POINTS } from '../src/data/index'
import { perfectAnswers } from '../src/testing/answers'
import type { Answers } from '../src/lib/types'

beforeEach(() => {
  window.localStorage.clear()
})

const fullAnswers = (): Answers => {
  const answers: Answers = {}
  for (const q of QUESTIONS) Object.assign(answers, perfectAnswers(q))
  return answers
}

describe('Attempt persistence keys', () => {
  it('uses only keys namespaced by this exam id', () => {
    expect(EXAM_ID).toBe('grade-5-math-test-unit1-21-11')
    expect(STORAGE_KEY).toBe('grade-5-math-test-unit1-21-11-attempt-v1')
    expect(PENDING_PREFIX).toBe('pending:grade-5-math-test-unit1-21-11:')
    expect(pendingKey('abc')).toBe('pending:grade-5-math-test-unit1-21-11:abc')
  })

  it('does not share any key with the reference exam or other platform exams', () => {
    const foreign = ['grade5-math-unit1-attempt-v1', 'arena-math-unit1-attempt-v1', 'arena-math-muted-v1']
    for (const key of foreign) expect(STORAGE_KEY).not.toBe(key)
    expect(STORAGE_KEY.startsWith('grade5-math-unit1')).toBe(false)
  })

  it('writes the mute preference under its own key', () => {
    setMuted(true)
    expect(window.localStorage.getItem('grade-5-math-test-unit1-21-11-muted-v1')).toBe('1')
    expect(isMuted()).toBe(true)
    setMuted(false)
    expect(isMuted()).toBe(false)
  })
})

describe('Save and restore', () => {
  it('stores and reloads the attempt with its answers and position', () => {
    const attempt = createAttempt('  لين   أحمد  ', 1_700_000_000_000)
    expect(attempt.studentName).toBe('لين أحمد')
    const saved: Attempt = {
      ...attempt,
      answers: { 'A3-x': { t: 'math', doc: { boxes: { r: [{ k: 's', v: '4' }] }, counter: 0 } } },
      current: 12,
    }
    saveAttempt(saved)
    const loaded = loadAttempt()
    expect(loaded).not.toBeNull()
    expect(loaded!.studentName).toBe('لين أحمد')
    expect(loaded!.current).toBe(12)
    expect(loaded!.startedAt).toBe(1_700_000_000_000)
    expect(loaded!.submittedAt).toBeNull()
    expect(loaded!.confirmed).toBe(false)
    expect(JSON.stringify(loaded!.answers)).toBe(JSON.stringify(saved.answers))
  })

  it('keeps the timer based on the real start timestamp after a reload', () => {
    const attempt = createAttempt('طالب', 1_700_000_000_000)
    saveAttempt(attempt)
    const loaded = loadAttempt()!
    expect(elapsedMs(loaded, 1_700_000_090_000)).toBe(90_000)
  })

  it('ignores corrupted or foreign data instead of crashing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadAttempt()).toBeNull()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, id: 'x' }))
    expect(loadAttempt()).toBeNull()
  })

  it('does not resubmit a legacy attempt that has no confirmation flag', () => {
    const legacy = {
      version: 1 as const,
      id: 'x',
      studentName: 'طالب',
      startedAt: 1_700_000_000_000,
      submittedAt: 1_700_000_100_000,
      answers: {},
      current: 0,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
    const loaded = loadAttempt()!
    expect(loaded.confirmed).toBe(false)
  })

  it('clears only its own attempt key', () => {
    saveAttempt(createAttempt('طالب', 1))
    window.localStorage.setItem('other-exam-attempt-v1', 'keep')
    clearAttempt()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem('other-exam-attempt-v1')).toBe('keep')
  })
})

describe('Results aggregation on restore', () => {
  it('grades a stored perfect attempt at 100 out of 100', () => {
    const attempt: Attempt = {
      ...createAttempt('طالب', 1_700_000_000_000),
      submittedAt: 1_700_000_600_000,
      confirmed: true,
      answers: fullAnswers(),
    }
    saveAttempt(attempt)
    const restored = loadAttempt()!
    const summary = buildResults(QUESTIONS, restored)
    expect(summary.score).toBe(TOTAL_POINTS)
    expect(summary.max).toBe(100)
    expect(summary.correct).toBe(30)
  })

  it('counts pending payload keys of this exam only', () => {
    const storage = window.localStorage
    storage.setItem(pendingKey('a'), '{}')
    storage.setItem('pending:grade5-math-unit1:b', '{}')
    expect(pendingCount()).toBe(1)
    storage.removeItem(pendingKey('a'))
    expect(pendingCount()).toBe(0)
  })
})

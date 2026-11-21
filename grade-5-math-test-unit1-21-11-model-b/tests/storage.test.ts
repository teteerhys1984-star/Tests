// @vitest-environment jsdom
/**
 * حفظ الإجابات واستعادتها بعد إعادة التحميل، واستقلال مفاتيح التخزين
 * عن نموذج A (grade-5-math-test-unit1-21-11) وعن الاختبار المرجعي
 * (grade5-math-unit1) وعن مفتاح المصدر العام (grade5_math_unit1_arena_exam_v1).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { EXAM_ID } from '../src/config'
import { examQuestions } from '../src/data/questions'
import {
  DEFAULT_ATTEMPT,
  STORAGE_KEY,
  clearAttempt,
  elapsedSecondsOf,
  loadAttempt,
  sanitizeAttempt,
  saveAttempt,
  type PlatformAttemptState,
} from '../src/lib/attempt'
import { PENDING_PREFIX, pendingCount, pendingKey } from '../src/lib/submit'
import { perfectAnswers } from './answers'

const MODEL_A_KEY = 'grade-5-math-test-unit1-21-11-attempt-v1'
const MODEL_A_PENDING = 'pending:grade-5-math-test-unit1-21-11:some-attempt'
const REF_KEY = 'grade5-math-unit1-attempt-v1'
const SOURCE_GENERIC_KEY = 'grade5_math_unit1_arena_exam_v1'

beforeEach(() => {
  window.localStorage.clear()
})

describe('مفاتيح التخزين المستقلة', () => {
  it('كل المفاتيح مسمّاة بمعرّف نموذج B', () => {
    expect(EXAM_ID).toBe('grade-5-math-test-unit1-21-11-model-b')
    expect(STORAGE_KEY).toBe('grade-5-math-test-unit1-21-11-model-b-attempt-v1')
    expect(PENDING_PREFIX).toBe('pending:grade-5-math-test-unit1-21-11-model-b:')
    expect(pendingKey('abc')).toBe('pending:grade-5-math-test-unit1-21-11-model-b:abc')
  })

  it('لا يتشارك أي مفتاح مع نموذج A أو المرجع أو المصدر', () => {
    expect(STORAGE_KEY).not.toBe(MODEL_A_KEY)
    expect(STORAGE_KEY).not.toBe(REF_KEY)
    expect(STORAGE_KEY).not.toBe(SOURCE_GENERIC_KEY)
    expect(PENDING_PREFIX).not.toBe('pending:grade-5-math-test-unit1-21-11:')
    expect(STORAGE_KEY.startsWith('grade5')).toBe(false)
    expect(STORAGE_KEY.startsWith('grade-5-math-test-unit1-21-11-')).toBe(true)
    expect(STORAGE_KEY.startsWith('grade-5-math-test-unit1-21-11-model-b')).toBe(true)
  })

  it('الكتابة في مفاتيح هذا الاختبار لا تمس مفاتيح الاختبارات الأخرى', () => {
    window.localStorage.setItem(MODEL_A_KEY, JSON.stringify({ version: 1, id: 'a' }))
    window.localStorage.setItem(MODEL_A_PENDING, '{}')
    window.localStorage.setItem(REF_KEY, 'ref')
    window.localStorage.setItem(SOURCE_GENERIC_KEY, 'src')

    saveAttempt({ ...DEFAULT_ATTEMPT, studentName: 'لين', hasStarted: true })
    expect(window.localStorage.getItem(MODEL_A_KEY)).toBe(
      JSON.stringify({ version: 1, id: 'a' }),
    )
    expect(window.localStorage.getItem(REF_KEY)).toBe('ref')
    expect(window.localStorage.getItem(SOURCE_GENERIC_KEY)).toBe('src')

    clearAttempt()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(MODEL_A_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(MODEL_A_PENDING)).not.toBeNull()
  })

  it('pendingCount يعدّ معلّقات نموذج B وحدها', () => {
    window.localStorage.setItem(pendingKey('x'), '{}')
    window.localStorage.setItem(MODEL_A_PENDING, '{}')
    window.localStorage.setItem('pending:grade5-math-unit1:y', '{}')
    expect(pendingCount()).toBe(1)
    window.localStorage.removeItem(pendingKey('x'))
    expect(pendingCount()).toBe(0)
  })
})

describe('الحفظ والاستعادة بعد إعادة التحميل', () => {
  it('دورة كاملة: حفظ محاولة نشطة واستعادتها بكل حقولها', () => {
    const attempt: PlatformAttemptState = {
      ...DEFAULT_ATTEMPT,
      attemptId: 'fixed-attempt-id',
      studentName: 'لين أحمد',
      hasStarted: true,
      startedAtTimestamp: 1_700_000_000_000,
      currentQuestionIndex: 12,
      answers: { 'q01-a': '(6, 4)', 'q05-b': 'mon' },
      isMuted: true,
    }
    saveAttempt(attempt)

    // «إعادة تحميل» = قراءة الحالة من جديد من التخزين
    const loaded = loadAttempt()
    expect(loaded.studentName).toBe('لين أحمد')
    expect(loaded.hasStarted).toBe(true)
    expect(loaded.isSubmitted).toBe(false)
    expect(loaded.currentQuestionIndex).toBe(12)
    expect(loaded.answers).toEqual(attempt.answers)
    expect(loaded.isMuted).toBe(true)
    expect(loaded.startedAtTimestamp).toBe(1_700_000_000_000)
    expect(loaded.attemptId).toBe('fixed-attempt-id')
  })

  it('المؤقت يعتمد الطابع الزمني الحقيقي ويستمر بعد الاستعادة', () => {
    const attempt: PlatformAttemptState = {
      ...DEFAULT_ATTEMPT,
      hasStarted: true,
      startedAtTimestamp: 1_700_000_000_000,
    }
    saveAttempt(attempt)
    const loaded = loadAttempt()
    expect(elapsedSecondsOf(loaded, 1_700_000_090_000)).toBe(90)
    // يتوقف عند التسليم
    const submitted = { ...loaded, isSubmitted: true, submittedAtTimestamp: 1_700_000_120_000 }
    expect(elapsedSecondsOf(submitted, 1_700_000_999_000)).toBe(120)
  })

  it('محاولة مسلَّمة تُستعاد كما هي: attemptId ثابت عبر إعادة التحميل', () => {
    const attempt: PlatformAttemptState = {
      ...DEFAULT_ATTEMPT,
      attemptId: 'submitted-attempt-id',
      studentName: 'سارة',
      hasStarted: true,
      isSubmitted: true,
      submitConfirmed: true,
      submitDelivered: false,
      startedAtTimestamp: 1_700_000_000_000,
      submittedAtTimestamp: 1_700_000_600_000,
      answers: perfectAnswers,
    }
    saveAttempt(attempt)
    const loaded = loadAttempt()
    expect(loaded.isSubmitted).toBe(true)
    expect(loaded.attemptId).toBe('submitted-attempt-id')
    expect(loaded.submittedAtTimestamp).toBe(1_700_000_600_000)
    // إعادة الإرسال بعد التحميل تستعمل المعرّف نفسه (يُتحقق منه في submit/workflow)
    expect(loaded.attemptId).toBe(attempt.attemptId)
  })

  it('بيانات تالفة أو غريبة لا تسبب انهياراً بل حالة افتراضية نظيفة', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadAttempt()).toEqual(DEFAULT_ATTEMPT)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(null))
    expect(loadAttempt()).toEqual(DEFAULT_ATTEMPT)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]))
    expect(loadAttempt()).toEqual(DEFAULT_ATTEMPT)

    // حالة المصدر القديم (بلا attemptId) تُستكمل بأمان
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        studentName: 'قديمة',
        hasStarted: true,
        isSubmitted: false,
        startedAtTimestamp: 5,
        submittedAtTimestamp: null,
        currentQuestionIndex: 3,
        answers: { 'q01-a': '(6, 4)' },
        isMuted: false,
      }),
    )
    const legacy = loadAttempt()
    expect(legacy.studentName).toBe('قديمة')
    expect(legacy.attemptId).toBe('')
    expect(legacy.submitConfirmed).toBe(false)
    expect(legacy.submitDelivered).toBe(false)
  })

  it('sanitizeAttempt يرفض الحقول المشوّهة ويحمي حدود فهرس السؤال', () => {
    const s = sanitizeAttempt({
      studentName: 42,
      currentQuestionIndex: examQuestions.length + 5,
      answers: { 'q01-a': 7, 'q01-b': '(0, 5)' },
      hasStarted: 'yes',
    })
    expect(s.studentName).toBe('')
    expect(s.currentQuestionIndex).toBe(0)
    // القيم غير النصية في الإجابات تُهمل كلها (لا خريطة مختلطة)
    expect(s.answers).toEqual({})
    expect(s.hasStarted).toBe(true)
  })

  it('فهرس سؤال سالب أو خارج النطاق يعود إلى الصفر', () => {
    expect(sanitizeAttempt({ currentQuestionIndex: -3 }).currentQuestionIndex).toBe(0)
    expect(sanitizeAttempt({ currentQuestionIndex: 30 }).currentQuestionIndex).toBe(0)
    expect(sanitizeAttempt({ currentQuestionIndex: 29 }).currentQuestionIndex).toBe(29)
  })

  it('لا توجد مفاتيح تخزين أخرى يكتبها التطبيق غير مفتاح المحاولة والمعلّقات', () => {
    saveAttempt({ ...DEFAULT_ATTEMPT, studentName: 'فحص' })
    window.localStorage.setItem(pendingKey('p1'), '{}')
    const keys = Object.keys(window.localStorage).sort()
    expect(keys).toEqual([STORAGE_KEY, pendingKey('p1')].sort())
  })
})

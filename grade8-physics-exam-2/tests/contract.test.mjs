import test from 'node:test'
import assert from 'node:assert/strict'
import { contract, makeExam, plain, allAnswers, OLD_PRIVACY } from './helpers.mjs'

const typeOf = (value) => Array.isArray(value) ? 'array' : typeof value
const shape = (obj) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, typeOf(value)]))

test('actual grade5-math-unit1 contract: ordered fields, types, token, URL, status strings and scale', (t) => {
  const exam = makeExam(); t.after(() => exam.close())
  const { questions, sender } = exam.test
  const answers = allAnswers(questions)
  answers.q05a = '14'
  answers.q01b = [0, 2, 3]
  delete answers.q04a
  const payload = plain(exam.test.preparePayload(answers, 'contract-attempt-001'))
  assert.deepEqual(shape(payload), contract.payload)
  assert.deepEqual(shape(payload.summary), contract.summary)
  for (const lesson of payload.lessons) assert.deepEqual(shape(lesson), contract.lesson)
  for (const detail of payload.details) assert.deepEqual(shape(detail), contract.detail)
  assert.deepEqual(Object.keys(payload), Object.keys(contract.payload), 'order of top-level keys')
  assert.deepEqual(Object.keys(payload.summary), Object.keys(contract.summary), 'order of summary keys')
  assert.ok(payload.lessons.every((x) => JSON.stringify(Object.keys(x)) === JSON.stringify(Object.keys(contract.lesson))))
  assert.ok(payload.details.every((x) => JSON.stringify(Object.keys(x)) === JSON.stringify(Object.keys(contract.detail))))
  assert.equal(sender.constants.SHEETS_URL, contract.url)
  assert.equal(sender.constants.SHEETS_TOKEN, contract.token)
  assert.equal(payload.token, contract.token)
  assert.equal(payload.examId, 'grade8-physics-exam-2')
  assert.equal(payload.attemptId, 'contract-attempt-001')
  assert.equal(payload.examTitle, exam.test.exam.title)
  assert.equal(payload.studentName, 'طالبة اختبار')
  assert.equal(payload.startAt, new Date(1700000000123).toISOString())
  assert.equal(payload.submitAt, new Date(1700000723456).toISOString())
  assert.equal(payload.elapsedSec, 723)
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload, 'JSON preserves all data, with no undefined or NaN')
  assert.doesNotMatch(JSON.stringify(payload), /:null[,}\]]/)
  for (const [point, label] of Object.entries(contract.gradeLabels)) assert.equal(sender.gradeLabel(Number(point)), label, `reference grade at ${point}`)
  assert.equal(payload.summary.gradeLabel, sender.gradeLabel(payload.summary.percentage))
  assert.deepEqual(new Set(payload.details.map((d) => d.status)), new Set(Object.values(contract.statuses)))
  assert.equal(payload.details.length, 41)
  assert.equal(payload.lessons.length, 2)
  assert.deepEqual(payload.lessons.map((l) => l.title), ['القوى المتلاقية', 'القوى المتوازية'])
  assert.deepEqual(payload.lessons.map((l) => l.max), [45, 55])
  assert.equal(payload.summary.max, 100)
  const state = exam.test.getState(), result = state.results
  assert.equal(payload.summary.total, result.total)
  assert.equal(payload.summary.percentage, result.pct)
  assert.equal(payload.summary.correctSubparts, result.counts.correct)
  assert.equal(payload.summary.partialSubparts, result.counts.partial)
  assert.equal(payload.summary.wrongSubparts, result.counts.incorrect)
  assert.equal(payload.summary.unansweredSubparts, result.counts.unanswered)
  assert.equal(payload.summary.fullQuestions + payload.summary.partialQuestions + payload.summary.wrongQuestions, 15)
  assert.equal(payload.summary.correctSubparts + payload.summary.partialSubparts + payload.summary.wrongSubparts + payload.summary.unansweredSubparts, 41)
  assert.equal(payload.reportText, state.report.text)
  assert.ok(!payload.reportText.includes(OLD_PRIVACY))
  assert.ok(payload.reportText.includes('تُرسَل النتيجة وإجابات الطالب وتقريره إلى المعلّم'))
  assert.doesNotMatch(payload.reportText, /(?:gradeLabel|التقدير\s*:)/)
  const flat = result.perQuestion.flatMap(({ q, qi, parts }) => parts.map((p) => ({ q, qi, ...p })))
  assert.equal(new Set(payload.details.map((d) => `${d.q}/${d.label}`)).size, 41)
  for (let i = 0; i < flat.length; i++) {
    const { q, qi, part, score, status, studentText } = flat[i], d = payload.details[i]
    assert.equal(d.q, qi + 1)
    assert.equal(d.lessons, payload.lessons[q.lesson - 1].title)
    assert.equal(d.label, part.letter); assert.equal(d.awarded, score); assert.equal(d.marks, part.marks)
    assert.equal(d.status, contract.statuses[status === 'incorrect' ? 'wrong' : status])
    assert.equal(d.studentAnswer, studentText)
    assert.ok(payload.reportText.includes(`نص السؤال: ${d.qTitle}`))
    assert.ok(payload.reportText.includes(`إجابة الطالب     : ${d.studentAnswer}`))
    assert.ok(payload.reportText.includes(`الإجابة الصحيحة  : ${d.correctAnswer}`))
  }
  const round2 = (n) => Math.round(n * 100) / 100
  assert.equal(round2(payload.details.reduce((s, d) => s + d.awarded, 0)), payload.summary.total)
  assert.equal(payload.details.reduce((s, d) => s + d.marks, 0), 100)
  assert.equal(round2(payload.lessons.reduce((s, l) => s + l.awarded, 0)), payload.summary.total)
})

test('attempt IDs are unique, namespaced, and grade labels are not shown in student results or TXT', (t) => {
  const exam = makeExam(); t.after(() => exam.close())
  const ids = Array.from({ length: 1000 }, () => exam.test.uuid())
  assert.equal(new Set(ids).size, ids.length)
  Object.defineProperty(exam.window.crypto, 'randomUUID', { value: undefined, configurable: true })
  const fallback = Array.from({ length: 1000 }, () => exam.test.uuid())
  assert.equal(new Set(fallback).size, fallback.length)
  assert.ok(fallback.every((id) => /^\d{13}-[0-9a-z]{6,16}$/.test(id)))
  assert.equal(exam.test.sender.pendingKey('attempt-7'), 'pending:grade8-physics-exam-2:attempt-7')
  const answers = allAnswers(exam.test.questions)
  const payload = exam.test.preparePayload(answers)
  exam.test.showResults(answers)
  assert.equal(payload.summary.gradeLabel, 'ممتاز')
  assert.doesNotMatch(exam.window.document.querySelector('#app').textContent, /التقدير|ممتاز|جيد جداً|يحتاج إلى دعم/)
  assert.doesNotMatch(exam.test.getState().report.text, /(?:التقدير\s*:|gradeLabel)/)
  assert.match(exam.window.document.querySelector('.page-footer').textContent, /إجاباته وتقريره إلى المعلّم/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { makeExam, allAnswers, dumpStorage, response, deferred, waitFor } from './helpers.mjs'

function submitPerfect(exam, name = 'سارة أحمد الاختبار') {
  const { window, test: hooks } = exam
  window.document.querySelector('#student-name').value = name
  window.document.querySelector('#btn-start').click()
  hooks.setAnswers(allAnswers(hooks.questions))
  hooks.render()
  const submit = window.document.querySelector('#btn-submit')
  assert.equal(submit.disabled, false)
  submit.click()
  assert.equal(hooks.getState().status, 'submitted')
  assert.equal(hooks.getState().results.total, 100)
}
const status = (exam) => exam.window.document.querySelector('[data-send-status]')?.dataset.sendStatus

test('student sees original score and report during sending and failure, and a separate resend button succeeds', async (t) => {
  let mode = 'fail', calls = 0
  const gate = deferred()
  const exam = makeExam({ fastRetry: true, fetchImpl: async () => {
    calls++
    if (mode === 'fail') throw new Error('offline')
    return gate.promise
  } })
  t.after(() => exam.close())
  assert.match(exam.window.document.querySelector('.rules-list').textContent, /تُرسَل نتيجتك وإجاباتك وتقريرك إلى المعلّم/)
  submitPerfect(exam)
  const id = exam.test.getState().attemptId
  assert.equal(status(exam), 'sending')
  assert.match(exam.window.document.querySelector('[role=status]').textContent, /جارٍ إرسال النتيجة/)
  assert.match(exam.window.document.querySelector('.score-num').textContent, /100\s*\/ 100/)
  assert.equal(exam.downloads.length, 1, 'original automatic TXT download still occurs')
  assert.ok(exam.window.localStorage.getItem(`pending:grade8-physics-exam-2:${id}`), 'durable before network confirmation')
  await waitFor(() => status(exam) === 'failed')
  assert.equal(calls, 3)
  assert.match(exam.window.document.querySelector('[role=status]').textContent, /تعذّر إرسال النتيجة/)
  assert.ok(exam.window.document.querySelector('#btn-resend'))
  assert.ok(exam.window.document.querySelector('#btn-retry'), 'the exam retry button is separate')
  assert.equal(exam.test.getState().results.total, 100)
  assert.ok(exam.test.getState().report.text.includes('العلامة النهائية          : 100 من 100'))
  exam.window.document.querySelector('#btn-report').click()
  assert.equal(exam.downloads.length, 2)
  assert.doesNotMatch(exam.window.document.querySelector('#app').textContent, /التقدير|ممتاز/)
  mode = 'success'
  const resend = exam.window.document.querySelector('#btn-resend')
  resend.click()
  resend.click() // even a duplicate event on the detached button must not create a concurrent POST
  await waitFor(() => calls === 4)
  assert.equal(status(exam), 'sending')
  gate.resolve(response({ ok: true }))
  await waitFor(() => status(exam) === 'success')
  assert.equal(calls, 4)
  assert.match(exam.window.document.querySelector('[role=status]').textContent, /تم إرسال النتيجة إلى المعلّم/)
  assert.equal(exam.window.document.querySelector('#btn-resend'), null)
  assert.equal(exam.window.localStorage.getItem(`pending:grade8-physics-exam-2:${id}`), null)
  assert.equal(exam.test.getState().results.total, 100)
})

test('opening a failed submitted attempt automatically retries, updates its status and does not resend after confirmation', async (t) => {
  const first = makeExam({ fastRetry: true, fetchImpl: async () => { throw new Error('offline') } })
  t.after(() => first.close())
  submitPerfect(first, 'طالبة إعادة الفتح')
  await waitFor(() => status(first) === 'failed')
  const id = first.test.getState().attemptId
  const stored = dumpStorage(first.window)
  let delivered = []
  const reopened = makeExam({ stored, fetchImpl: async (url, init) => { delivered.push({ url, body: JSON.parse(init.body) }); return response({ ok: true }) } })
  t.after(() => reopened.close())
  assert.equal(status(reopened), 'sending')
  assert.match(reopened.window.document.querySelector('.score-num').textContent, /100/)
  await waitFor(() => status(reopened) === 'success')
  assert.equal(delivered.length, 1)
  assert.equal(delivered[0].body.attemptId, id)
  assert.equal(reopened.window.localStorage.getItem(`pending:grade8-physics-exam-2:${id}`), null)
  const afterSuccess = dumpStorage(reopened.window)
  let duplicatePosts = 0
  const again = makeExam({ stored: afterSuccess, fetchImpl: async () => { duplicatePosts++; return response({ ok: true }) } })
  t.after(() => again.close())
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(status(again), 'success')
  assert.equal(duplicatePosts, 0)
  assert.equal(again.test.getState().attemptId, id)
  assert.equal(again.test.getState().results.total, 100)
})

test('an older pending result survives starting a new attempt and is retried from the welcome screen', async (t) => {
  const first = makeExam({ fastRetry: true, fetchImpl: async () => { throw new Error('offline') } })
  t.after(() => first.close())
  submitPerfect(first, 'طالب المحاولة الأولى')
  await waitFor(() => status(first) === 'failed')
  const oldId = first.test.getState().attemptId
  first.window.document.querySelector('#btn-retry').click()
  assert.ok(first.window.document.querySelector('#student-name'))
  assert.notEqual(first.test.getState().attemptId, oldId)
  assert.ok(first.window.localStorage.getItem(`pending:grade8-physics-exam-2:${oldId}`))
  const stored = dumpStorage(first.window); let calls = 0, receivedId = ''
  const reopened = makeExam({ stored, fetchImpl: async (_url, init) => {
    calls++; receivedId = JSON.parse(init.body).attemptId; return response({ ok: true })
  } })
  t.after(() => reopened.close())
  assert.ok(reopened.window.document.querySelector('#student-name'), 'welcome remains visible')
  await waitFor(() => calls === 1 && reopened.window.localStorage.getItem(`pending:grade8-physics-exam-2:${oldId}`) === null)
  assert.equal(receivedId, oldId)
  assert.ok(reopened.window.document.querySelector('#student-name'))
})

test('disabled browser storage and network failure never hide the result, with an explicit warning', async (t) => {
  let calls = 0
  const exam = makeExam({ noStorage: true, fastRetry: true, fetchImpl: async () => { calls++; throw new Error('offline') } })
  t.after(() => exam.close())
  submitPerfect(exam)
  await waitFor(() => status(exam) === 'failed')
  assert.equal(calls, 3)
  assert.equal(exam.test.getState().results.total, 100)
  assert.match(exam.window.document.querySelector('[role=status]').textContent, /تعذّر حفظ النتيجة/)
  assert.ok(exam.window.document.querySelector('#btn-resend'))
  assert.ok(exam.window.document.querySelector('#btn-report'))
  assert.equal(exam.downloads.length, 1)
})

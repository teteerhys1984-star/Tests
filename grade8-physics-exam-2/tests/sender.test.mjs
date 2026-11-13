import test from 'node:test'
import assert from 'node:assert/strict'
import { IDBFactory } from 'fake-indexeddb'
import { makeExam, plain, allAnswers, contract, MemoryStorage, response, deferred, waitFor } from './helpers.mjs'

function setup(t, id) {
  const exam = makeExam(); t.after(() => exam.close())
  return { exam, sender: exam.test.sender, payload: plain(exam.test.preparePayload(allAnswers(exam.test.questions), id)), storage: new MemoryStorage() }
}
const opts = (storage, fetchImpl, delays = []) => ({ storage, fetchImpl, sleep: async (ms) => { delays.push(ms) }, locks: null })

test('successful POST uses the exact reference endpoint, body, content type and confirmation', async (t) => {
  const { sender, payload, storage } = setup(t, 'send-success')
  const calls = [], delays = []
  const ok = await sender.sendWithRetry(payload, opts(storage, async (url, init) => {
    calls.push({ url, init }); return response({ ok: true })
  }, delays))
  assert.equal(ok, true); assert.equal(calls.length, 1); assert.deepEqual(delays, [])
  assert.equal(calls[0].url, contract.url)
  assert.equal(calls[0].init.method, 'POST')
  assert.deepEqual(plain(calls[0].init.headers), { 'Content-Type': 'text/plain;charset=utf-8' })
  assert.equal(calls[0].init.redirect, 'follow')
  assert.deepEqual(JSON.parse(calls[0].init.body), payload)
  assert.equal(storage.getItem(sender.pendingKey(payload.attemptId)), null)
  assert.equal(storage.getItem(`sent:grade8-physics-exam-2:${payload.attemptId}`), '1')
  let duplicateCalls = 0
  assert.equal(await sender.sendWithRetry(payload, opts(storage, async () => { duplicateCalls++; return response({ ok: true }) })), true)
  assert.equal(duplicateCalls, 0, 'a confirmed attempt must not be sent again')
})

test('failure followed by success and success on third attempt use the same body and 2s/5s delays', async (t) => {
  const { sender, payload, storage } = setup(t, 'send-retry')
  let calls = []; let delays = []
  let ok = await sender.sendWithRetry(payload, opts(storage, async (url, init) => {
    calls.push({ url, body: init.body })
    if (calls.length === 1) throw new Error('network unavailable')
    return response({ ok: true })
  }, delays))
  assert.equal(ok, true); assert.equal(calls.length, 2); assert.deepEqual(delays, [2000])
  assert.equal(calls[0].body, calls[1].body)
  calls = []; delays = []
  const third = { ...payload, attemptId: 'send-third' }
  ok = await sender.sendWithRetry(third, opts(storage, async (_url, init) => {
    calls.push(init.body)
    return calls.length < 3 ? response({ ok: false }) : response({ duplicate: true })
  }, delays))
  assert.equal(ok, true); assert.equal(calls.length, 3); assert.deepEqual(delays, [2000, 5000])
  assert.ok(calls.every((body) => body === calls[0]))
  assert.equal(JSON.parse(calls[0]).attemptId, 'send-third')
  assert.equal(storage.getItem(sender.pendingKey('send-third')), null)
})

test('three failures retain the exact payload and never touch another exam', async (t) => {
  const { sender, payload, storage } = setup(t, 'send-failed')
  const calls = [], delays = []
  storage.setItem('pending:another-exam:xyz', 'unrelated')
  const ok = await sender.sendWithRetry(payload, opts(storage, async (_url, init) => {
    calls.push(init.body)
    if (calls.length === 1) throw new Error('offline')
    if (calls.length === 2) return { text: async () => 'not JSON' }
    return response({ ok: false })
  }, delays))
  assert.equal(ok, false); assert.equal(calls.length, 3); assert.deepEqual(delays, [2000, 5000])
  assert.ok(calls.every((body) => body === calls[0]))
  assert.deepEqual(JSON.parse(storage.getItem(sender.pendingKey(payload.attemptId))), payload)
  assert.equal(storage.getItem('pending:another-exam:xyz'), 'unrelated')
  assert.equal(storage.getItem(`sent:grade8-physics-exam-2:${payload.attemptId}`), null)
})

test('each hung request times out at the configured 30 seconds, aborts and is retried three times', async (t) => {
  const { exam, sender, payload, storage } = setup(t, 'timeout-attempt')
  const timers = [], delays = []; let aborts = 0, calls = 0
  const oldSet = exam.window.setTimeout, oldClear = exam.window.clearTimeout
  // Advance a fake clock immediately: the production timeout value itself remains 30000 ms.
  exam.window.setTimeout = (callback, ms) => { timers.push(ms); queueMicrotask(callback); return timers.length }
  exam.window.clearTimeout = () => {}
  const ok = await sender.sendWithRetry(payload, opts(storage, async (_url, init) => {
    calls++
    init.signal.addEventListener('abort', () => { aborts++ })
    return new Promise(() => {})
  }, delays))
  exam.window.setTimeout = oldSet; exam.window.clearTimeout = oldClear
  assert.equal(sender.constants.ATTEMPT_TIMEOUT_MS, 30000)
  assert.equal(sender.constants.MAX_ATTEMPTS, 3)
  assert.deepEqual(plain(sender.constants.RETRY_DELAYS_MS), [2000, 5000])
  assert.deepEqual(timers, [30000, 30000, 30000])
  assert.equal(calls, 3); assert.equal(aborts, 3); assert.deepEqual(delays, [2000, 5000]); assert.equal(ok, false)
  assert.deepEqual(JSON.parse(storage.getItem(sender.pendingKey(payload.attemptId))), payload)
})

test('pending attempts are retried with the current token, and only successful ones are removed', async (t) => {
  const { sender, payload, storage } = setup(t, 'pending-a')
  await sender.retryPending() // finish the initial, empty boot flush
  const other = { ...payload, attemptId: 'pending-b', token: 'outdated-token' }
  storage.setItem(sender.pendingKey(payload.attemptId), JSON.stringify(payload))
  storage.setItem(sender.pendingKey(other.attemptId), JSON.stringify(other))
  storage.setItem('pending:another-exam:abc', 'keep')
  storage.setItem('theme', 'dark')
  storage.setItem('pending:grade8-physics-exam-2:corrupt', '{broken')
  const calls = [], delays = []
  const options = opts(storage, async (_url, init) => {
    const body = JSON.parse(init.body); calls.push(body)
    return response({ ok: body.attemptId === 'pending-b' })
  }, delays)
  const first = sender.retryPending(options), second = sender.retryPending(options)
  assert.equal(first, second, 'simultaneous flushes share one job')
  assert.equal(await first, 1)
  assert.equal(calls.length, 4)
  assert.equal(calls.filter((x) => x.attemptId === 'pending-a').length, 3)
  assert.equal(calls.filter((x) => x.attemptId === 'pending-b').length, 1)
  assert.ok(calls.every((x) => x.token === contract.token))
  assert.deepEqual(delays, [2000, 5000])
  assert.notEqual(storage.getItem(sender.pendingKey('pending-a')), null)
  assert.equal(storage.getItem(sender.pendingKey('pending-b')), null)
  assert.equal(storage.getItem('pending:another-exam:abc'), 'keep')
  assert.equal(storage.getItem('theme'), 'dark')
  assert.equal(storage.getItem('pending:grade8-physics-exam-2:corrupt'), '{broken')
  let nextCalls = 0
  assert.equal(await sender.retryPending(opts(storage, async () => { nextCalls++; return response({ ok: true }) })), 1)
  assert.equal(nextCalls, 1)
  assert.equal(storage.getItem(sender.pendingKey('pending-a')), null)
})

test('manual send, automatic flush and repeated requests share one in-flight attempt and one receipt', async (t) => {
  const { sender, payload, storage } = setup(t, 'concurrent-attempt')
  await sender.retryPending() // finish the initial, empty boot flush
  const gate = deferred(); let calls = 0
  const options = opts(storage, async () => { calls++; return gate.promise })
  const a = sender.sendWithRetry(payload, options)
  const b = sender.sendWithRetry(payload, options)
  assert.equal(a, b)
  // The result is durable even if the tab closes while the request is pending.
  assert.deepEqual(JSON.parse(storage.getItem(sender.pendingKey(payload.attemptId))), payload)
  const flush = sender.retryPending(options)
  await waitFor(() => calls === 1)
  assert.equal(calls, 1)
  gate.resolve(response({ ok: true }))
  assert.equal(await a, true); assert.equal(await b, true); assert.equal(await flush, 1)
  assert.equal(calls, 1)
  assert.equal(storage.getItem(sender.pendingKey(payload.attemptId)), null)
  assert.equal(await sender.sendWithRetry(payload, options), true)
  assert.equal(calls, 1)
})

test('Web Locks coordinate two tabs and prevent a second POST after the first is confirmed', async (t) => {
  const first = makeExam(), second = makeExam(); t.after(() => { first.close(); second.close() })
  const payload = plain(first.test.preparePayload(allAnswers(first.test.questions), 'shared-tab-attempt'))
  const storage = new MemoryStorage(), queues = new Map(), gate = deferred()
  const locks = { request(name, options, action) {
    assert.equal(options.mode, 'exclusive')
    const previous = queues.get(name) || Promise.resolve()
    const next = previous.then(action)
    queues.set(name, next.catch(() => {}))
    return next
  } }
  let calls = 0
  const options = { storage, locks, sleep: async () => {}, fetchImpl: async () => { calls++; return gate.promise } }
  const a = first.test.sender.sendWithRetry(payload, options)
  const b = second.test.sender.sendWithRetry(payload, options)
  await waitFor(() => calls === 1)
  gate.resolve(response({ ok: true }))
  assert.equal(await a, true); assert.equal(await b, true)
  assert.equal(calls, 1)
  assert.equal(storage.getItem(first.test.sender.pendingKey(payload.attemptId)), null)
})

test('IndexedDB fallback coordinates tabs and retains a receipt without Web Locks or localStorage', async (t) => {
  const first = makeExam(), second = makeExam(), third = makeExam()
  t.after(() => { first.close(); second.close(); third.close() })
  const payload = plain(first.test.preparePayload(allAnswers(first.test.questions), 'idb-shared-attempt'))
  const indexedDB = new IDBFactory(), gate = deferred(); let calls = 0
  const options = { storage: null, locks: null, indexedDB, sleep: async () => {}, fetchImpl: async () => { calls++; return gate.promise } }
  const a = first.test.sender.sendWithRetry(payload, options)
  const b = second.test.sender.sendWithRetry(payload, options)
  await waitFor(() => calls === 1)
  gate.resolve(response({ ok: true }))
  assert.equal(await a, true); assert.equal(await b, true)
  assert.equal(await third.test.sender.sendWithRetry(payload, options), true)
  assert.equal(calls, 1, 'only one POST, even after both tabs finish')
})

test('IndexedDB releases a failed lock so a later retry can succeed', async (t) => {
  const first = makeExam(), second = makeExam(); t.after(() => { first.close(); second.close() })
  const payload = plain(first.test.preparePayload(allAnswers(first.test.questions), 'idb-retry-attempt'))
  const indexedDB = new IDBFactory(), storage = new MemoryStorage(); let failures = 0, successes = 0
  const failed = { storage, indexedDB, locks: null, sleep: async () => {}, fetchImpl: async () => { failures++; throw new Error('offline') } }
  assert.equal(await first.test.sender.sendWithRetry(payload, failed), false)
  assert.equal(failures, 3)
  assert.ok(storage.getItem(first.test.sender.pendingKey(payload.attemptId)))
  const retried = { ...failed, fetchImpl: async () => { successes++; return response({ ok: true }) } }
  assert.equal(await second.test.sender.sendWithRetry(payload, retried), true)
  assert.equal(successes, 1)
  assert.equal(storage.getItem(first.test.sender.pendingKey(payload.attemptId)), null)
})

test('a blocked or full localStorage cannot throw or hide a successful/failed result', async (t) => {
  const { sender, payload } = setup(t, 'broken-storage')
  const broken = { get length() { throw new Error('blocked') }, key() { throw new Error('blocked') }, getItem() { throw new Error('blocked') }, setItem() { throw new Error('full') }, removeItem() { throw new Error('blocked') } }
  assert.equal(await sender.sendWithRetry(payload, opts(broken, async () => response({ ok: true }))), true)
  const failed = { ...payload, attemptId: 'broken-storage-failure' }
  assert.equal(await sender.sendWithRetry(failed, opts(broken, async () => { throw new Error('offline') })), false)
  assert.equal(await sender.retryPending({ storage: broken, locks: null }), 0)
})

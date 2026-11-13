import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { JSDOM, VirtualConsole } from 'jsdom'

export const originalHtml = gunzipSync(readFileSync(new URL('./fixtures/original.html.gz', import.meta.url))).toString('utf8')
export const currentHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
export const contract = JSON.parse(readFileSync(new URL('./fixtures/grade5-contract.json', import.meta.url), 'utf8'))
export const plain = (value) => JSON.parse(JSON.stringify(value))
export const OLD_PRIVACY = 'أُنشئ هذا التقرير محلياً على جهاز الطالب لحظة التسليم، ولم تُرسَل أي بيانات عبر الشبكة.'
export const NEW_PRIVACY = 'أُنشئ هذا التقرير محلياً على جهاز الطالب لحظة التسليم، وتُرسَل النتيجة وإجابات الطالب وتقريره إلى المعلّم عبر الإنترنت عند التسليم، وقد تُعاد المحاولة لاحقاً عند تعذّر الاتصال.'

// Appended only by the test harness: no test hooks are shipped to students.
const hooks = `<script>
window.__examTest = {
  exam: EXAM, questions: QUESTIONS, diagrams: DIAGRAMS, captions: FIG_CAPTIONS, rubric: RUBRIC,
  getState: () => S,
  setAnswers: (answers) => { S.answers = answers; },
  gradeOne: (id, value) => {
    S.answers = {};
    if (value !== undefined) S.answers[id] = value;
    return gradePart(getQuestionOfPart(id).parts.find((p) => p.id === id));
  },
  parseNumber: (value, unit) => parseNumericInput(value, unit),
  calculate: (answers) => {
    S.answers = answers; S.studentName = 'طالب مرجعي'; S.attemptId = 'baseline-attempt';
    S.startedAt = 1700000000123; S.submittedAt = 1700000723456;
    const result = gradeAll();
    return {
      total: result.total, max: result.max, pct: result.pct, counts: result.counts, durationMs: result.durationMs,
      perQuestion: result.perQuestion.map(({q, earned, parts}) => ({
        id: q.id, earned, parts: parts.map(({part, score, status, studentText}) => ({id: part.id, score, status, studentText}))
      })),
      report: buildReport(result),
    };
  },
  preparePayload: (answers, id = 'payload-attempt') => {
    S.answers = answers; S.studentName = 'طالبة اختبار'; S.attemptId = id;
    S.startedAt = 1700000000123; S.submittedAt = 1700000723456;
    S.results = gradeAll(); S.report = {text: buildReport(S.results), filename: 'report.txt'};
    return typeof buildPayload === 'function' ? buildPayload(S) : null;
  },
  showQuestion: (qi, answers = {}) => {
    S.answers = answers; S.studentName = 'طالب مرجعي'; S.startedAt = 1700000000123;
    S.current = qi; S.status = 'active'; S.screen = 'question'; renderApp();
  },
  showResults: (answers) => {
    S.answers = answers; S.studentName = 'طالب مرجعي'; S.attemptId = 'baseline-attempt';
    S.startedAt = 1700000000123; S.submittedAt = 1700000723456;
    S.results = gradeAll(); S.report = {text: buildReport(S.results), filename: 'report.txt'};
    S.status = 'submitted'; S.screen = 'results'; S.sendStatus = 'idle'; renderApp();
  },
  showTeacher: () => { teacherAuthed = true; S.screen = 'teacher'; renderApp(); },
  render: () => renderApp(),
  uuid: () => uuid(),
  sender: typeof sendWithRetry === 'function' ? {
    buildPayload, gradeLabel, sendWithRetry, retryPending, pendingKey,
    constants: {EXAM_ID, SHEETS_URL, SHEETS_TOKEN, RETRY_DELAYS_MS, MAX_ATTEMPTS, ATTEMPT_TIMEOUT_MS, PENDING_PREFIX, SENT_PREFIX}
  } : null,
};
</script>`

export function makeExam({ original = false, html, stored = {}, fetchImpl, fastRetry = false, noStorage = false, locks } = {}) {
  const errors = []
  const downloads = []
  const requests = []
  const console = new VirtualConsole()
  console.on('jsdomError', (err) => errors.push(err))
  const page = (html ?? (original ? originalHtml : currentHtml)).replace('</body>', `${hooks}</body>`)
  const dom = new JSDOM(page, {
    url: 'https://example.test/grade8-physics-exam-2/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: console,
    beforeParse(window) {
      window.scrollTo = () => {}
      window.Audio = function () { this.play = () => Promise.resolve() }
      window.URL.createObjectURL = () => 'blob:test-report'
      window.URL.revokeObjectURL = () => {}
      window.HTMLAnchorElement.prototype.click = function () {
        if (this.download) downloads.push({ filename: this.download, href: this.href })
      }
      window.fetch = (...args) => {
        requests.push(args)
        if (!fetchImpl) return Promise.reject(new Error('Unexpected network access in a test'))
        return fetchImpl(...args)
      }
      if (locks !== undefined) Object.defineProperty(window.navigator, 'locks', { value: locks, configurable: true })
      if (noStorage) {
        Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('storage disabled') } })
      } else {
        for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value)
      }
      if (fastRetry) {
        const realTimeout = window.setTimeout.bind(window)
        window.setTimeout = (fn, ms, ...args) => realTimeout(fn, ms === 2000 || ms === 5000 ? 0 : ms, ...args)
      }
    },
  })
  if (!dom.window.__examTest) throw new Error(`Exam failed to boot: ${errors.map((e) => e.message).join('; ')}`)
  return { dom, window: dom.window, test: dom.window.__examTest, errors, downloads, requests, close: () => dom.window.close() }
}

export function dumpStorage(window) {
  const result = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    result[key] = window.localStorage.getItem(key)
  }
  return result
}

export class MemoryStorage {
  #data = new Map()
  get length() { return this.#data.size }
  key(index) { return [...this.#data.keys()][index] ?? null }
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null }
  setItem(key, value) { this.#data.set(String(key), String(value)) }
  removeItem(key) { this.#data.delete(key) }
  keys() { return [...this.#data.keys()] }
}

export function goodAnswer(p) {
  if (p.type === 'mcq' || p.type === 'tf') return p.correct
  if (p.type === 'multi') return [...p.correct]
  if (p.type === 'numeric') return String(p.answerValue)
  if (p.type === 'ordering') return Object.fromEntries(p.items.map((item, i) => [i, item.pos]))
  if (p.type === 'matching') return Object.fromEntries(p.key.map((value, i) => [i, value]))
  throw new Error(`Unknown type ${p.type}`)
}
export function wrongAnswer(p) {
  if (p.type === 'mcq') return (p.correct + 1) % p.options.length
  if (p.type === 'tf') return !p.correct
  if (p.type === 'multi') return p.options.map((_, i) => i).filter((i) => !p.correct.includes(i)).slice(0, 1)
  if (p.type === 'numeric') return p.answerValue === 0 ? '999' : '0.001'
  if (p.type === 'ordering') return Object.fromEntries(p.items.map((item, i) => [i, item.pos % p.items.length + 1]))
  if (p.type === 'matching') return Object.fromEntries(p.key.map((value, i) => [i, (value + 1) % p.options.length]))
  throw new Error(`Unknown type ${p.type}`)
}
export function allAnswers(questions, chooser = goodAnswer) {
  return Object.fromEntries(questions.flatMap((q) => q.parts.map((part) => [part.id, chooser(part)])))
}
export const response = (body) => ({ text: async () => JSON.stringify(body) })
export function deferred() {
  let resolve, reject
  const promise = new Promise((a, b) => { resolve = a; reject = b })
  return { promise, resolve, reject }
}
export async function waitFor(fn, timeout = 3000) {
  const until = Date.now() + timeout
  while (Date.now() < until) {
    if (fn()) return
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('Timed out waiting for test condition')
}

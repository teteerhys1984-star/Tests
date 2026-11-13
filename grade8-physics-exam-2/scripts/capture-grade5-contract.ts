// Optional verification against the actual sibling reference project. The
// normal test suite uses its captured fixture and is self-contained.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildPayload } from '../../grade5-math-unit1/src/exam/submit'
import { gradeLabel, STATUS_AR } from '../../grade5-math-unit1/src/exam/report'
import { SHEETS_URL, SHEETS_TOKEN } from '../../grade5-math-unit1/src/config'
import { QUESTIONS } from '../../grade5-math-unit1/src/exam/questions'

const startAt = new Date('2026-11-11T07:00:05.250Z')
const submitAt = new Date('2026-11-11T07:47:38.900Z')
const payload = buildPayload({
  attemptId: 'reference-id',
  meta: { studentName: 'طالبة', startAt, submitAt, elapsedMs: submitAt.getTime() - startAt.getTime() },
  order: QUESTIONS,
  answers: {},
  reportText: 'reference report',
})
const type = (x: unknown) => Array.isArray(x) ? 'array' : typeof x
const shape = (x: Record<string, unknown>) => Object.fromEntries(Object.entries(x).map(([key, value]) => [key, type(value)]))
const hash = (file: string) => createHash('sha256').update(readFileSync(resolve(process.cwd(), '../grade5-math-unit1', file))).digest('hex')
console.log(JSON.stringify({
  provenance: {
    project: 'grade5-math-unit1',
    submitSha256: hash('src/exam/submit.ts'),
    reportSha256: hash('src/exam/report.ts'),
    configSha256: hash('src/config.ts'),
  },
  url: SHEETS_URL,
  token: SHEETS_TOKEN,
  payload: shape(payload as unknown as Record<string, unknown>),
  summary: shape(payload.summary as unknown as Record<string, unknown>),
  lesson: shape(payload.lessons[0] as unknown as Record<string, unknown>),
  detail: shape(payload.details[0] as unknown as Record<string, unknown>),
  statuses: STATUS_AR,
  gradeLabels: Object.fromEntries([0, 49.99, 50, 64.99, 65, 74.99, 75, 84.99, 85, 94.99, 95, 100].map((n) => [String(n), gradeLabel(n)])),
}, null, 2))

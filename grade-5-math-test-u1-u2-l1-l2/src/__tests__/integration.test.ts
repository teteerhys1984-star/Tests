import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { QUESTIONS } from '../exam/questions'
import { gradeExam, gradeSub } from '../exam/grading'
import { lessonTotals } from '../exam/lessons'
import { buildReport } from '../exam/report'
import { buildPayload, sendWithRetry, retryPending, pendingKey, newAttemptId } from '../exam/submit'
import { initialState, loadState, saveState, STORAGE_KEY } from '../exam/storage'
import { compareNumbers } from '../exam/numbers'
import type { Answers, AnswerValue, SubQuestion } from '../exam/types'

const subs = QUESTIONS.flatMap(q => q.subs)
function correct(s: SubQuestion): AnswerValue {
  switch (s.type) {
    case 'mcq': return s.correct
    case 'numeric': return { value: String(s.expected) }
    case 'pair': case 'plot': return { x: String(s.expected.x), y: String(s.expected.y) }
    case 'tf': return {value: String(s.correct), fix: s.correction.correct}
    case 'match': return {...s.correct}
    case 'order': return [...s.items].sort((a,b) => s.direction === 'asc' ? a.value-b.value : b.value-a.value).map(i => i.id)
    case 'compare': return Object.fromEntries(s.pairs.map(p => [p.id, compareNumbers(p.a,p.b)]))
    case 'cells': return Object.fromEntries(s.cells.map(c => [c.id,String(c.expected)]))
  }
}
function wrong(s: SubQuestion): AnswerValue {
  switch (s.type) {
    case 'mcq': return s.options.find(o => o.id !== s.correct)!.id
    case 'numeric': return { value: String(s.expected + 123) }
    case 'pair': case 'plot': return { x: String(s.expected.x+1), y: String(s.expected.y+1) }
    case 'tf': return {value: String(!s.correct)}
    case 'match': return Object.fromEntries(s.left.map(l => [l.id, s.right.find(r => r.id !== s.correct[l.id])!.id]))
    case 'order': { const ids = [...s.items].sort((a,b) => s.direction === 'asc' ? a.value-b.value : b.value-a.value).map(i => i.id); [ids[1],ids[2]] = [ids[2],ids[1]]; return ids }
    case 'compare': return Object.fromEntries(s.pairs.map(p => [p.id, compareNumbers(p.a,p.b) === '<' ? '>' : '<']))
    case 'cells': return Object.fromEntries(s.cells.map(c => [c.id,String(c.expected+1)]))
  }
}
const perfect: Answers = Object.fromEntries(subs.map(s => [s.id, correct(s)]))
const state = {...initialState(), phase: 'results' as const, name: 'اختبار تجريبي', attemptId: 'mock-only', startedAt: 1000, submittedAt: 9000, answers: perfect}
const result = gradeExam(QUESTIONS, perfect)
const report = buildReport({ name: state.name, result, questions: QUESTIONS, elapsedMs: 8000, submittedAt: 9000 })
const payload = buildPayload(state, report)
function storage() {
  const m = new Map<string,string>()
  return {get length(){ return m.size }, key: (i:number) => [...m.keys()][i] ?? null, getItem: (k:string) => m.get(k) ?? null, setItem: (k:string,v:string) => {m.set(k,v)}, removeItem: (k:string) => {m.delete(k)}}
}

describe('source-preserving grading', () => {
  it('retains the complete original question data byte for byte', () => {
    expect(readFileSync(resolve('../grade-5-math-test-U1-U2L1&2/src/exam/questions.ts'), 'utf8')).toBe(readFileSync(resolve('src/exam/questions.ts'), 'utf8'))
  })
  it('tests every subquestion for full, wrong, and unanswered marks', () => {
    expect(subs).toHaveLength(42)
    for (const s of subs) {
      expect(gradeSub(s, {[s.id]: correct(s)}).earned, s.id).toBe(s.marks)
      expect(gradeSub(s, {[s.id]: wrong(s)}).earned, s.id).toBe(0)
      expect(gradeSub(s, {[s.id]: wrong(s)}).status, s.id).toBe('wrong')
      expect(gradeSub(s, {}).status, s.id).toBe('unanswered')
    }
  })
  it('awards partial marks across types according to source', () => {
    expect(gradeSub(subs.find(s=>s.id==='q2d')!, {q2d:{value:'5',working:'13'}}).earned).toBe(0)
    expect(gradeSub(subs.find(s=>s.id==='q2d')!, {q2d:{value:'5',working:'19 - 13'}}).earned).toBe(1)
    expect(gradeSub(subs.find(s=>s.id==='q5c')!, {q5c:{value:'5',working:'12,465 + 3,870 = 16,335'}}).earned).toBe(2)
    expect(gradeSub(subs.find(s=>s.id==='q6c')!, {q6c:{m90:'right'}}).earned).toBe(1)
    expect(gradeSub(subs.find(s=>s.id==='q1f')!, {q1f:{value:'false'}}).earned).toBe(1)
    expect(gradeSub(subs.find(s=>s.id==='q7b')!, {q7b:['n1','n3','n4','n2']}).earned).toBe(1)
  })
  it('checks partial credit for every source part with a partial rubric', () => {
    for (const s of subs) {
      let answer: AnswerValue | null = null
      if (s.type === 'numeric' && s.partialMarks && s.partialKeys?.length) answer = {value:String(s.expected+123), working:s.id === 'q2d' ? '19 - 13' : String(s.partialKeys[0])}
      if (s.type === 'tf' && !s.correct && s.correction.marks < s.marks) answer = {value:'false'}
      if (s.type === 'match' && s.left.length > 1) answer = {[s.left[0].id]:s.correct[s.left[0].id]}
      if (s.type === 'compare' && s.pairs.length > 1) answer = {[s.pairs[0].id]:compareNumbers(s.pairs[0].a,s.pairs[0].b)}
      if (s.type === 'cells' && s.cells.length > 1) answer = {[s.cells[0].id]:String(s.cells[0].expected)}
      if (s.type === 'order') answer = [...s.items].sort((a,b)=>s.direction === 'asc' ? b.value-a.value : a.value-b.value).map(i=>i.id)
      if (answer !== null) expect(gradeSub(s, {[s.id]:answer}).status, s.id).toBe('partial')
    }
  })
  it('sums unique source subparts and keeps mixed main questions separated', () => {
    const rows = lessonTotals(QUESTIONS, result)
    expect(rows.map(r=>r.max)).toEqual([15,15,15,10,15,7,4,4,7,8])
    expect(rows.reduce((x,r)=>x+r.max,0)).toBe(100)
    expect(rows.reduce((x,r)=>x+r.awarded,0)).toBe(100)
    expect(result.max).toBe(100)
    expect(QUESTIONS[5].subs.map(s=>s.ref.lesson).filter((x,i,a)=>a.indexOf(x)===i)).toHaveLength(3)
    expect(QUESTIONS[6].subs.map(s=>s.ref.lesson).filter((x,i,a)=>a.indexOf(x)===i)).toHaveLength(2)
  })
  it('the report and payload use the same results and lesson distribution', () => {
    expect(report).toContain('الدرجة النهائية: 100 / 100')
    expect(payload.summary.total).toBe(result.total)
    expect(payload.summary.max).toBe(result.max)
    expect(payload.lessons).toEqual(lessonTotals(QUESTIONS,result))
    for (const row of payload.lessons) expect(report).toContain(`${row.title}: ${row.awarded} / ${row.max}`)
    expect(payload.reportText).toBe(report)
    expect(payload.details).toHaveLength(42)
  })
  it('round trips an isolated attempt', () => {
    const store = storage(); saveState(state,store)
    expect(loadState(store)).toEqual(state)
    expect(STORAGE_KEY).toContain('grade-5-math-test-u1-u2-l1-l2')
    expect(newAttemptId()).not.toBe(newAttemptId())
  })
})

describe('Sheets uses mock fetch only', () => {
  it('posts text/plain and retries with stable payload then queues failure and flushes it', async () => {
    const store = storage(); const delays:number[] = []
    const fail = vi.fn(async () => { throw new Error('offline') })
    expect(await sendWithRetry(payload, {storage:store, fetchImpl:fail, sleep:async n=>{delays.push(n)}, timeoutMs:20})).toBe(false)
    expect(fail).toHaveBeenCalledTimes(3); expect(delays).toEqual([2000,5000])
    const inits = fail.mock.calls as unknown as [string, RequestInit][]
    expect(inits.map(c => JSON.parse(String(c[1].body)).attemptId)).toEqual(['mock-only','mock-only','mock-only'])
    expect(inits[0][1].headers).toEqual({'Content-Type':'text/plain;charset=utf-8'})
    expect(store.getItem(pendingKey('mock-only'))).not.toBeNull()
    const ok = vi.fn(async () => ({text:async () => '{"ok":true}'}))
    expect(await retryPending({storage:store,fetchImpl:ok,sleep:async()=>{}})).toBe(1)
    expect(store.getItem(pendingKey('mock-only'))).toBeNull()
  })
  it('does not flush the displayed attempt twice during startup', async () => {
    const store = storage()
    store.setItem(pendingKey('mock-only'), JSON.stringify(payload))
    const fetchImpl = vi.fn(async () => ({text:async () => '{"ok":true}'}))
    expect(await retryPending({storage:store,fetchImpl,excludeAttemptId:'mock-only'})).toBe(0)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(store.getItem(pendingKey('mock-only'))).not.toBeNull()
  })
  it('times out hung requests rather than hanging the exam', async () => {
    const store = storage()
    const hung = vi.fn(() => new Promise<{text:()=>Promise<string>}>(()=>{}))
    expect(await sendWithRetry(payload,{storage:store,fetchImpl:hung,timeoutMs:2,sleep:async()=>{}})).toBe(false)
    expect(hung).toHaveBeenCalledTimes(3)
    expect(store.getItem(pendingKey('mock-only'))).not.toBeNull()
  })
})

import { describe, it, expect, vi } from 'vitest';
import { buildPayload, sendWithRetry, retryPending, pendingKey, ATTEMPT_TIMEOUT_MS } from '../utils/submit';
import { emptyAttempt, saveAttempt, loadAttempt, saveMuted, loadMuted, clearAttempt } from '../utils/storage';
import { EXAM_ID } from '../config';
import { QUESTIONS } from '../data/examData';
import { gradeExam, isSubCorrect } from '../utils/grading';
import { buildReportText, downloadTextFile } from '../utils/report';
import { QUESTIONS as SOURCE } from '../../../english-foundation-test-22-11-26MI/src/data/examData';
const attempt = () => ({...emptyAttempt(), studentName:'Test pupil', startedAt:1000, submittedAt:11000, elapsedMs:10000, status:'submitted' as const});
const accepted = () => Promise.resolve({text:async () => '{"ok":true}'});
describe('source fidelity and marking', () => {
 it('preserves every source question, option, key, mark and explanation', () => {
  expect(QUESTIONS).toEqual(SOURCE);
  expect(QUESTIONS.flatMap(q=>q.subs)).toHaveLength(100);
 });
 it('accepts every listed alternative and rejects wrong answers across every part', () => {
  for (const s of QUESTIONS.flatMap(q=>q.subs)) {
   for (const answer of s.type==='text'?s.accept:[s.answer]) expect(isSubCorrect(s,answer)).toBe(true);
   expect(isSubCorrect(s,'wrong answer')).toBe(false);
  }
 });
 it('awards partial credit per main question, not speculative credit for a wrong one-mark part', () => {
  const r=gradeExam(QUESTIONS,{'1a':'his','1b':'my','1c':'wrong'});
  expect(r.total).toBe(2); expect(r.questions[0].earned).toBe(2);
  expect(buildPayload({...attempt(),answers:{'1a':'his'}}).summary.partialQuestions).toBe(1);
 });
 it('requires uppercase I for the capitalization objective and preserves its/it’s distinction', () => {
  expect(isSubCorrect(QUESTIONS[14].subs[0], 'i am a student')).toBe(false);
  expect(isSubCorrect(QUESTIONS[13].subs[0], "it's")).toBe(false);
 });
});
describe('persistence and TXT', () => {
 it('restores name answers position times status and id, with isolated keys', () => {
  const a={...attempt(),answers:{'1a':'his'},currentQuestion:8};
  localStorage.setItem('other:attempt','unchanged'); saveAttempt(a); saveMuted(true);
  expect(loadAttempt()).toEqual(a); expect(loadMuted()).toBe(true);
  expect(Object.keys(localStorage).filter(k=>k!=='other:attempt').every(k=>k.startsWith(EXAM_ID))).toBe(true);
  clearAttempt(); expect(localStorage.getItem('other:attempt')).toBe('unchanged');
  expect(emptyAttempt().attemptId).not.toBe(a.attemptId);
 });
 it('recovers corrupt storage', () => {localStorage.setItem(`${EXAM_ID}:attempt:v1`,'{');expect(loadAttempt().status).toBe('idle');});
 it('downloads UTF-8 TXT with the same full report as the payload', () => {
  const a=attempt(),p=buildPayload(a);
  expect(p.reportText).toBe(buildReportText(gradeExam(QUESTIONS,{}),{studentName:a.studentName,startedAt:1000,submittedAt:11000}));
  expect(p.reportText).toContain('QUESTION 20');
  const create=vi.fn((_blob: Blob)=> 'blob:test'); vi.stubGlobal('URL', {createObjectURL:create,revokeObjectURL:vi.fn()});
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  downloadTextFile('report.txt',p.reportText); expect(click).toHaveBeenCalledOnce();expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
 });
});
describe('mock-only Google Sheets contract', () => {
 it('matches all fields, 100 details, and exact content type', async () => {
  const p=buildPayload(attempt()),fetchImpl=vi.fn(accepted);
  expect(Object.keys(p).sort()).toEqual(['token','attemptId','examId','examTitle','studentName','startAt','submitAt','elapsedSec','summary','lessons','details','reportText'].sort());
  expect(p.details).toHaveLength(100); expect(p.lessons.reduce((n,l)=>n+l.max,0)).toBe(100);
  expect(await sendWithRetry(p,{fetchImpl})).toBe(true);
  expect(fetchImpl.mock.calls[0]).toBeDefined();
  const call=fetchImpl.mock.calls as unknown as [string,RequestInit][];
  expect(call[0][1].headers).toEqual({'Content-Type':'text/plain;charset=utf-8'});
  expect(JSON.parse(call[0][1].body as string).attemptId).toBe(p.attemptId);
 });
 it('retries three times with 2s/5s delays, queues failures, and flushes only this exam', async () => {
  const p=buildPayload(attempt()), fetchImpl=vi.fn(async()=>{throw Error('offline');}), sleep=vi.fn(async()=>{});
  expect(await sendWithRetry(p,{fetchImpl,sleep})).toBe(false);
  expect(fetchImpl).toHaveBeenCalledTimes(3);expect(sleep.mock.calls).toEqual([[2000],[5000]]);
  expect(localStorage.getItem(pendingKey(p.attemptId))).not.toBeNull();
  localStorage.setItem('pending:other:id','{}');
  expect(await retryPending({fetchImpl:vi.fn(accepted)})).toBe(1);
  expect(localStorage.getItem(pendingKey(p.attemptId))).toBeNull();expect(localStorage.getItem('pending:other:id')).toBe('{}');
 });
 it('deduplicates concurrent sends and accepts server duplicate acknowledgement', async () => {
  const p=buildPayload(attempt()), fetchImpl=vi.fn(async()=>({text:async()=>'{"duplicate":true}'}));
  expect(await Promise.all([sendWithRetry(p,{fetchImpl}),sendWithRetry(p,{fetchImpl})])).toEqual([true,true]);expect(fetchImpl).toHaveBeenCalledOnce();
 });
 it('enforces the reference timeout even when fetch ignores AbortSignal', async () => {
  expect(ATTEMPT_TIMEOUT_MS).toBe(30000); vi.useFakeTimers();
  const fetchImpl=vi.fn(()=>new Promise<{text():Promise<string>}>(()=>{}));
  const done=sendWithRetry(buildPayload(attempt()),{fetchImpl});
  await vi.runAllTimersAsync();expect(await done).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(3);vi.useRealTimers();
 });
});

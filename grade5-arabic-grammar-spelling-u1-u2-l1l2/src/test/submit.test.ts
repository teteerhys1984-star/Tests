import { describe, expect, it, vi } from 'vitest';
import { buildPayload, EXAM_ID, PENDING_PREFIX, pendingKey, retryPending, sendWithRetry, type StorageLike } from '../utils/submit';
import { scoreExam } from '../utils/scoring';
function storage(): StorageLike {
 const m=new Map<string,string>(); return {get length(){return m.size},key:i=>Array.from(m.keys())[i] ?? null,getItem:k=>m.get(k) ?? null,setItem:(k,v)=>{m.set(k,v)},removeItem:k=>{m.delete(k)}};
}
function payload(id:string) {const answers={}; return buildPayload({studentName:'اختبار',attemptId:id,submittedAt:1700000000000,elapsedMs:65000,answers,result:scoreExam(answers)});}
const ok=()=>Promise.resolve({text:async()=>'{"ok":true}'});
const fail=()=>Promise.reject(new Error('offline'));
const sleep=async()=>{};
describe('mocked submission only',()=>{
 it('builds the reference contract',()=>{const p=payload('contract'); expect(Object.keys(p)).toEqual(['token','attemptId','examId','examTitle','studentName','startAt','submitAt','elapsedSec','summary','lessons','details','reportText']); expect(p.examId).toBe(EXAM_ID);expect(p.details).toHaveLength(67); expect(p.summary.max).toBe(100);expect(p.lessons).toHaveLength(5);});
 it('posts and prevents concurrent and subsequent duplicates',async()=>{const s=storage(), fetchImpl=vi.fn(ok), p=payload('success'); const [a,b]=await Promise.all([sendWithRetry(p,{storage:s,fetchImpl,sleep}),sendWithRetry(p,{storage:s,fetchImpl,sleep})]);expect(a&&b).toBe(true);expect(await sendWithRetry(p,{storage:s,fetchImpl,sleep})).toBe(true);expect(fetchImpl).toHaveBeenCalledTimes(1);const [url,init]=fetchImpl.mock.calls[0] as unknown as [string,RequestInit];expect(url).toContain('script.google.com'); expect(init.method).toBe('POST');expect(init.headers).toEqual({'Content-Type':'text/plain;charset=utf-8'});expect(JSON.parse(init.body as string)).toEqual(p);});
 it('retries and saves failure; replays only its own pending records',async()=>{const s=storage(), fetchImpl=vi.fn(fail), p=payload('failure');s.setItem('pending:another:test','untouched');expect(await sendWithRetry(p,{storage:s,fetchImpl,sleep})).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(3);expect(s.getItem(pendingKey(p.attemptId))).not.toBeNull();expect(PENDING_PREFIX).toContain(EXAM_ID);expect(await retryPending({storage:s,fetchImpl:ok,sleep})).toBe(1);expect(s.getItem(pendingKey(p.attemptId))).toBeNull();expect(s.getItem('pending:another:test')).toBe('untouched');});
 it('accepts a later retry and server duplicate acknowledgement',async()=>{const s=storage(), fetchImpl=vi.fn().mockRejectedValueOnce(Error()).mockResolvedValueOnce({text:async()=>'{"duplicate":true}'}); expect(await sendWithRetry(payload('retry'),{storage:s,fetchImpl,sleep})).toBe(true);expect(fetchImpl).toHaveBeenCalledTimes(2);});
});

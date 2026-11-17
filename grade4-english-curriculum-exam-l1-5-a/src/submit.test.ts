// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPayload, gradeLabel, pendingKey, retryPending, sendWithRetry } from './submit';
import { createAttempt, scoreQuestion, partIsCorrect } from './examEngine';
import { questions, passages } from './examData';
import { readFileSync } from 'node:fs';
const complete = () => ({...createAttempt('Mock Student', 1000), state:'submitted' as const, submittedAt:61000, elapsedMs:60000, answers:Object.fromEntries(questions.map(q=>[q.id,q.parts.map(p=>p.answer)]))});
beforeEach(()=>localStorage.clear());
describe('source parity and every subpart',()=>{
 it('preserves source data verbatim except importing the restored image',()=>{
 const source = readFileSync('../grade-4-english-curriculum-exam-L1-5-A/src/examData.ts','utf8');
 const actual = readFileSync('src/examData.ts','utf8').replace("import clockImage from '../public/images/workbook-clock.png?inline';\n",'').replace('src: clockImage',"src: '/images/workbook-clock.png'");
 expect(actual).toBe(source); expect(Object.keys(passages)).toHaveLength(8);
 });
 it('tests each part independently, every distractor, accepted forms, and blank answers',()=>{
 for(const q of questions){
  for(const [index,p] of q.parts.entries()){
   const a=q.parts.map(()=> ''); a[index]=p.answer;
   expect(scoreQuestion(q,{[q.id]:a}),q.id).toBe(p.marks);
   expect(partIsCorrect(p,''),q.id).toBe(false);
   for(const option of p.options??[]) expect(partIsCorrect(p,option),q.id).toBe(option===p.answer);
   for(const accepted of p.accepted??[]) expect(partIsCorrect(p,accepted),q.id).toBe(true);
  }
 }
 });
});
describe('reference payload and mocked delivery only',()=>{
 it('sends the complete reference contract with lesson and part totals',async()=>{
 const payload=buildPayload(complete());
 expect(Object.keys(payload).sort()).toEqual(['token','attemptId','examId','examTitle','studentName','startAt','submitAt','elapsedSec','summary','lessons','details','reportText'].sort());
 expect(payload.examId).toBe('grade4-english-curriculum-exam-l1-5-a');
 expect(payload.summary).toEqual({total:100,max:100,percentage:100,gradeLabel:'ممتاز',fullQuestions:50,partialQuestions:0,wrongQuestions:0,correctSubparts:payload.details.length,partialSubparts:0,wrongSubparts:0,unansweredSubparts:0});
 expect(payload.lessons).toHaveLength(5);expect(payload.lessons.map(l=>l.awarded)).toEqual([20,20,20,20,20]);
 const fetchImpl=vi.fn().mockResolvedValue({text:async()=>'{"ok":true}'});
 expect(await sendWithRetry(payload,{fetchImpl})).toBe(true);
 expect(fetchImpl.mock.calls[0][1]).toMatchObject({method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow',body:JSON.stringify(payload)});
 });
 it('counts partial and unanswered parts without double penalizing',()=>{
 const a=complete();a.answers['l1-01']=['meet','wrong'];a.answers['l1-05']=[''];
 expect(buildPayload(a).summary).toMatchObject({total:97,fullQuestions:48,partialQuestions:1,wrongQuestions:1,wrongSubparts:1,unansweredSubparts:1});
 });
 it('queues before loss, retries three times at 2/5 seconds, restores and removes on success',async()=>{
 const p=buildPayload(complete()); const sleep=vi.fn().mockResolvedValue(undefined);
 const fetchImpl=vi.fn().mockRejectedValue(new Error('offline'));
 expect(await sendWithRetry(p,{fetchImpl,sleep})).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(3);expect(sleep.mock.calls).toEqual([[2000],[5000]]);
 expect(JSON.parse(localStorage.getItem(pendingKey(p.attemptId))!)).toEqual(p);
 const ok=vi.fn().mockResolvedValue({text:async()=>'{"duplicate":true}'});
 expect(await retryPending({fetchImpl:ok,sleep})).toBe(1);expect(localStorage.getItem(pendingKey(p.attemptId))).toBeNull();
 expect(JSON.parse(ok.mock.calls[0][1].body).attemptId).toBe(p.attemptId);
 });
 it('rejects malformed responses, tolerates unavailable storage, and retries timeout aborts',async()=>{
 const p=buildPayload(complete());const sleep=async()=>{};
 expect(await sendWithRetry(p,{storage:null,sleep,fetchImpl:async()=>({text:async()=>'<html>error</html>'})})).toBe(false);
 const fetchImpl=vi.fn((_url,init)=>new Promise<never>((_,reject)=>init.signal?.addEventListener('abort',()=>reject(new Error('abort')))));
 expect(await sendWithRetry(p,{fetchImpl,sleep,timeoutMs:1})).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(3);
 });
 it('uses the exact platform grade boundaries',()=>{
 expect([100,95,94,85,84,75,74,65,64,50,49,0].map(gradeLabel)).toEqual(['ممتاز','ممتاز','جيد جداً','جيد جداً','جيد','جيد','مقبول','مقبول','ضعيف','ضعيف','يحتاج إلى دعم','يحتاج إلى دعم']);
 });
});

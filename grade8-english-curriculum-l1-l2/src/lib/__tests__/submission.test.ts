import { describe, it, expect, vi } from "vitest";
import { QUESTIONS, TOTAL_MARKS } from "../../data/questions";
import { buildPayload, newAttemptId, pendingKey, retryPending, sendWithRetry, reportForSubmission } from "../submit";
import type { AnswerMap } from "../../types";

class MemoryStore { data=new Map<string,string>(); get length(){return this.data.size} key(i:number){return [...this.data.keys()][i]??null} getItem(k:string){return this.data.get(k)??null} setItem(k:string,v:string){this.data.set(k,v)} removeItem(k:string){this.data.delete(k)} }
const answers:AnswerMap={};
const reportText="sample report";
const input={attemptId:"fixed-attempt",studentName:"Mock Student",startTs:1000,endTs:61000,answers,reportText};

describe("Sheets delivery contract",()=>{
 it("serializes the exam's actual zero-answer grading as a conforming payload",()=>{
  const p=buildPayload(input);expect(p.examId).toBe("grade8-english-curriculum-l1-l2");expect(p.summary.max).toBe(TOTAL_MARKS);expect(p.summary.total).toBe(0);expect(p.summary.unansweredSubparts).toBe(QUESTIONS.flatMap(q=>q.subparts).length);expect(p.details).toHaveLength(QUESTIONS.flatMap(q=>q.subparts).length);expect(p.lessons.reduce((n,l)=>n+l.max,0)).toBe(TOTAL_MARKS);expect(p.attemptId).toBe(input.attemptId);expect(p.reportText).toBe(reportText);
 });
 it("sends text/plain, retries 3 times with the prescribed waits and stores under stable id",async()=>{
  const storage=new MemoryStore(),fetchImpl=vi.fn().mockRejectedValue(new Error("offline")),sleep=vi.fn(async(_ms:number)=>{});const p=buildPayload(input);expect(await sendWithRetry(p,{storage,fetchImpl,sleep})).toBe(false);expect(fetchImpl).toHaveBeenCalledTimes(3);expect(sleep.mock.calls.map(x=>x[0])).toEqual([2000,5000]);expect(fetchImpl.mock.calls[0][1]?.headers).toEqual({"Content-Type":"text/plain;charset=utf-8"});expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).attemptId).toBe("fixed-attempt");expect(storage.getItem(pendingKey("fixed-attempt"))).not.toBeNull();
 });
 it("retries saved submissions later and removes on acceptance",async()=>{
  const storage=new MemoryStore(),p=buildPayload(input);storage.setItem(pendingKey(p.attemptId),JSON.stringify(p));const fetchImpl=vi.fn(async()=>({json:async()=>({ok:true})} as Response));expect(await retryPending({storage,fetchImpl,sleep:async()=>{}})).toBe(1);expect(storage.getItem(pendingKey(p.attemptId))).toBeNull();expect(fetchImpl).toHaveBeenCalledTimes(1);
 });
 it("creates a TXT report with title, student, score and per-part answer details",()=>{const text=reportForSubmission({studentName:"Mock Student",startTs:1000,endTs:61000,answers});expect(text).toContain("Curriculum Lesson 1 & 2");expect(text).toContain("Mock Student");expect(text).toContain("0 / 100");expect(text).toContain("Correct answer");expect(text).toContain("Not answered");});
 it("creates attempt ids unique per exam",()=>expect(newAttemptId()).not.toBe(newAttemptId()));
});

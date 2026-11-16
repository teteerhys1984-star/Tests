import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { QUESTIONS, EXAM_TITLE, TOTAL_MARKS } from "../data/questions";
import { gradeExam } from "./grading";
import { buildReport } from "./report";
import type { AnswerMap } from "../types";

export const RETRY_DELAYS_MS = [2000, 5000] as const;
export const ATTEMPT_TIMEOUT_MS = 30000;
const PREFIX = `pending:${EXAM_ID}:`;
export const pendingKey = (attemptId: string) => PREFIX + attemptId;
export const newAttemptId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export type Submission = { token:string; attemptId:string; examId:string; examTitle:string; studentName:string; startAt:string; submitAt:string; elapsedSec:number; summary:Record<string,number|string>; lessons:{title:string;awarded:number;max:number}[]; details:{q:number;qTitle:string;lessons:string;label:string;status:string;awarded:number;marks:number;studentAnswer:string;correctAnswer:string}[]; reportText:string };
export function buildPayload(input:{attemptId:string;studentName:string;startTs:number;endTs:number;answers:AnswerMap;reportText:string}):Submission {
 const result=gradeExam(QUESTIONS,input.answers); const subparts=result.questionResults.flatMap(q=>q.subparts);
 const correct=subparts.filter(s=>s.isCorrect).length;
 return {token:SHEETS_TOKEN,attemptId:input.attemptId,examId:EXAM_ID,examTitle:EXAM_TITLE,studentName:input.studentName,startAt:new Date(input.startTs).toISOString(),submitAt:new Date(input.endTs).toISOString(),elapsedSec:Math.max(0,Math.floor((input.endTs-input.startTs)/1000)),summary:{total:result.totalScore,max:TOTAL_MARKS,percentage:result.percentage,gradeLabel:result.percentage>=95?"Excellent":result.percentage>=85?"Very good":result.percentage>=75?"Good":result.percentage>=65?"Satisfactory":result.percentage>=50?"Needs improvement":"Insufficient",fullQuestions:result.fullyCorrect,partialQuestions:result.partiallyCorrect,wrongQuestions:result.incorrect,correctSubparts:correct,partialSubparts:subparts.filter(s=>s.earned>0&&s.earned<s.max).length,wrongSubparts:subparts.filter(s=>s.earned===0&&s.studentDisplay!=="Not answered").length,unansweredSubparts:subparts.filter(s=>s.studentDisplay==="Not answered").length},lessons:["Lesson 1","Lesson 2"].map(title=>{const qs=result.questionResults.filter(q=>q.lesson===(title.endsWith("1")?"lesson1":"lesson2"));return {title,awarded:qs.reduce((a,q)=>a+q.earned,0),max:qs.reduce((a,q)=>a+q.max,0)}}),details:result.questionResults.flatMap(q=>q.subparts.map((s,i)=>({q:q.number,qTitle:q.typeLabel,lessons:q.lesson==="lesson1"?"Lesson 1":"Lesson 2",label:`${q.number}.${i+1} ${s.prompt}`,status:s.studentDisplay==="Not answered"?"Unanswered":s.isCorrect?"Correct":s.earned>0?"Partial":"Incorrect",awarded:s.earned,marks:s.max,studentAnswer:s.studentDisplay,correctAnswer:s.correctDisplay}))),reportText:input.reportText};
}
type Store=Pick<Storage,"length"|"key"|"getItem"|"setItem"|"removeItem">;
export async function sendWithRetry(payload:Submission,opts:{fetchImpl?:typeof fetch;storage?:Store|null;sleep?:(ms:number)=>Promise<void>;timeoutMs?:number}={}):Promise<boolean>{
 const storage=opts.storage===undefined?(()=>{try{return localStorage}catch{return null}})():opts.storage;
 const send=async()=>{for(let n=0;n<3;n++){if(n)await(opts.sleep??(ms=>new Promise(r=>setTimeout(r,ms))))(RETRY_DELAYS_MS[n-1]);let timer:ReturnType<typeof setTimeout>|undefined;try{const ctrl=new AbortController();const request=(async()=>{const response=await(opts.fetchImpl??fetch)(SHEETS_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow",signal:ctrl.signal});return response.json()})();const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{ctrl.abort();reject(Error("timeout"))},opts.timeoutMs??ATTEMPT_TIMEOUT_MS)});const data=await Promise.race([request,timeout]);if(data?.ok===true||data?.duplicate===true)return true}catch{if(timer)clearTimeout(timer)}finally{if(timer)clearTimeout(timer)}}return false};
 const ok=await send();try{if(ok)storage?.removeItem(pendingKey(payload.attemptId));else storage?.setItem(pendingKey(payload.attemptId),JSON.stringify(payload))}catch{}return ok;
}
export async function retryPending(opts:Parameters<typeof sendWithRetry>[1]={}):Promise<number>{let store:Store|null;try{store=opts.storage===undefined?localStorage:opts.storage}catch{return 0}if(!store)return 0;let count=0;const keys:string[]=[];for(let i=0;i<store.length;i++){const k=store.key(i);if(k?.startsWith(PREFIX))keys.push(k)}for(const key of keys){try{const payload=JSON.parse(store.getItem(key)||"null");if(payload&&await sendWithRetry(payload,opts))count++}catch{}}return count;
}
export function reportForSubmission(input:{studentName:string;startTs:number;endTs:number;answers:AnswerMap}):string{const result=gradeExam(QUESTIONS,input.answers);return buildReport({studentName:input.studentName,examTitle:EXAM_TITLE,coverage:"Semester 1 · Lessons 1 & 2",submittedAt:new Date(input.endTs).toISOString(),elapsedMs:input.endTs-input.startTs},result)}

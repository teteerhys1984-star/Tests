import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { QUESTIONS, LESSONS, isAnswered, type StudentPartAnswer } from "../src/data/exam";
import { gradeExam } from "../src/lib/grading";
import { buildReport } from "../src/lib/report";
import { clearAttempt, loadAttempt, saveAttempt, formatDuration, type Attempt } from "../src/lib/storage";
import { buildPayload, sendWithRetry, retryPending, pendingKey, ATTEMPT_TIMEOUT_MS, type StorageLike } from "../src/lib/submit";
import { EXAM_ID, EXAM_TITLE, SHEETS_URL, SHEETS_TOKEN } from "../src/config";

const source = resolve(process.cwd(), "../interactive-grade-8-english-exam-L1-3 A");
const answers = () => Object.fromEntries(QUESTIONS.map(q => [q.id, q.parts.map(p => p.kind === "mc" ? p.answer : p.kind === "tf" ? p.answer : p.answers[0])]));
class MemStorage implements StorageLike {
  map = new Map<string,string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}
afterEach(() => vi.unstubAllGlobals());
describe("Source parity and independence", () => {
  it("copies the educational bank and both images byte-for-byte", () => {
    for (const f of ["src/data/exam.ts", "src/assets/hero.jpg", "src/assets/banner.jpg"]) expect(readFileSync(f)).toEqual(readFileSync(join(source, f)));
  });
  it("has 30 questions, 100 parts and 100 marks, correctly split", () => {
    expect(QUESTIONS).toHaveLength(30);
    expect(QUESTIONS.map(q => q.id)).toEqual(Array.from({length:30}, (_,i)=>i+1));
    expect(QUESTIONS.reduce((n,q)=>n+q.parts.length,0)).toBe(100);
    expect(QUESTIONS.every(q=>q.parts.length===q.marks)).toBe(true);
    expect(LESSONS.map(l=>QUESTIONS.filter(q=>q.lesson===l.id).reduce((n,q)=>n+q.marks,0))).toEqual([33,34,33]);
    expect(["mc","tf","text"].map(k=>QUESTIONS.flatMap(q=>q.parts).filter(p=>p.kind===k).length)).toEqual([54,7,39]);
  });
  it("has the correct platform index override", () => {
    const index = JSON.parse(readFileSync("../landing/exams.json", "utf8"));
    expect(index.overrides[EXAM_ID]).toEqual({ grade: 8, subject: "english", semester: 1, title: EXAM_TITLE });
  });
  it("runtime imports stay inside this exam and old storage names are absent", () => {
    function walk(dir: string): string[] { return readdirSync(dir).flatMap(n => { const p = join(dir,n); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : []; }); }
    for (const f of walk("src")) {
      const text = readFileSync(f,"utf8");
      expect(text).not.toMatch(/g8u1m1\.|interactive-grade-8-english-exam-L1-3 A|grade5-math-unit1|grade8-english-curriculum/);
      for (const [, spec] of text.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)) {
        if (spec.startsWith(".")) expect(resolve(f, "..", spec).startsWith(resolve("src") + "/")).toBe(true);
        else expect(spec.startsWith("@/") || !spec.startsWith("/" )).toBe(true);
      }
    }
  });
});
describe("grading, completion and report", () => {
  it("grades every listed answer, incorrect, partial and blank with exact limits", () => {
    const all = answers();
    const r = gradeExam(all,"Student Test",2000,1000);
    expect(r.total).toBe(100); expect(r.lessons.map(l=>l.score)).toEqual([33,34,33]);
    expect(QUESTIONS.every(q=>isAnswered(q,all[q.id]))).toBe(true);
    const mixed: Record<number, StudentPartAnswer[]> = structuredClone(all);
    mixed[1][0] = null; mixed[1][1] = 999;
    expect(isAnswered(QUESTIONS[0],mixed[1])).toBe(false);
    const part = gradeExam(mixed,"Student Test",2000,1000);
    expect(part.total).toBe(98); expect(part.questions[0].earned).toBe(1);
    expect(gradeExam({},"Student Test",2000,1000).total).toBe(0);
    expect(buildReport(part)).toContain(EXAM_TITLE);
  });
  it("accepts canonical answers and optional that where the source alternatives omitted them", () => {
    const all=answers();
    for (const q of QUESTIONS) q.parts.forEach((p,i)=>{ if(p.kind === "text") all[q.id][i] = p.key; });
    expect(gradeExam(all,"Test Student",2000,1000).total).toBe(100);
    all[28][0] = "Sally said she always forgot her things.";
    expect(gradeExam(all,"Test Student",2000,1000).total).toBe(100);
  });
});
describe("storage", () => {
  it("saves/restores and clears only this exam on retake", () => {
    const store = new MemStorage(); vi.stubGlobal("localStorage",store); store.setItem("other-attempt","safe");
    const a: Attempt = {name:"Test Student", startedAt:123, answers:answers(), muted:false, attemptId:"id",current:14};
    saveAttempt(a); expect(loadAttempt()).toEqual(a); expect(store.getItem(`${EXAM_ID}-attempt-v1`)).not.toBeNull();
    clearAttempt(); expect(loadAttempt()).toBeNull(); expect(store.getItem("other-attempt")).toBe("safe");
    expect(formatDuration(3661000)).toBe("01:01:01");
  });
});
describe("Sheets payload and Mock Fetch", () => {
  const all=answers(); const result=gradeExam(all,"Test Student",12000,11000);
  const payload=buildPayload({attemptId:"test-id",startedAt:1000,result,answers:all,reportText:buildReport(result)});
  it("matches the reference fields, totals, details and timestamps", () => {
    expect(Object.keys(payload)).toEqual(["token","attemptId","examId","examTitle","studentName","startAt","submitAt","elapsedSec","summary","lessons","details","reportText"]);
    expect(payload.token).toBe(SHEETS_TOKEN); expect(payload.examId).toBe(EXAM_ID); expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.elapsedSec).toBe(11); expect(payload.details).toHaveLength(100);
    expect(payload.details.reduce((s,d)=>s+d.awarded,0)).toBe(100); expect(payload.summary.correctSubparts).toBe(100);
    expect(payload.lessons.map(l=>l.max)).toEqual([33,34,33]);
    expect(Object.keys(payload.summary)).toEqual(["total","max","percentage","gradeLabel","fullQuestions","partialQuestions","wrongQuestions","correctSubparts","partialSubparts","wrongSubparts","unansweredSubparts"]);
  });
  it("reports mixed correct, wrong and unanswered subparts without changing marks", () => {
    const mixed: Record<number, StudentPartAnswer[]> = structuredClone(all);
    mixed[1][0] = null; mixed[1][1] = 999;
    const r = gradeExam(mixed,"Test Student",12000,11000);
    const p = buildPayload({attemptId:"mixed", startedAt:1000, result:r, answers:mixed, reportText:"mock report"});
    expect(p.summary).toMatchObject({total:98, fullQuestions:29, partialQuestions:1, wrongQuestions:0, correctSubparts:98, partialSubparts:0, wrongSubparts:1, unansweredSubparts:1});
    expect(p.details.slice(0,3).map(d=>d.status)).toEqual(["لم يُجب","إجابة خاطئة","إجابة صحيحة"]);
    expect(p.details[0].marks).toBe(1);
    for (const [percent, label] of [[100,"ممتاز"],[95,"ممتاز"],[94,"جيد جداً"],[85,"جيد جداً"],[84,"جيد"],[75,"جيد"],[74,"مقبول"],[65,"مقبول"],[64,"ضعيف"],[50,"ضعيف"],[49,"يحتاج إلى دعم"],[0,"يحتاج إلى دعم"]] as const) {
      expect(buildPayload({attemptId:"boundary",startedAt:1000,result:{...r,percent},answers:mixed,reportText:""}).summary.gradeLabel).toBe(label);
    }
  });
  it("retries 3 times with correct intervals and stable ID, saves pending then flushes only its own keys", async () => {
    const storage=new MemStorage(), waits:number[]=[], calls:RequestInit[]=[];
    storage.setItem("pending:other:id","safe");
    const fetchImpl=vi.fn(async (url:string,init:RequestInit)=>{expect(url).toBe(SHEETS_URL);calls.push(init);return {text:async()=>'{"ok":false}'};});
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    expect(await sendWithRetry(payload,{storage,fetchImpl,sleep:async ms=>{waits.push(ms);}})).toBe(false);
    expect(waits).toEqual([2000,5000]); expect(calls).toHaveLength(3);
    expect(calls.every(c=>c.method==="POST" && (c.headers as Record<string,string>)["Content-Type"]==="text/plain;charset=utf-8" && JSON.parse(String(c.body)).attemptId==="test-id")).toBe(true);
    expect(storage.getItem(pendingKey("test-id"))).not.toBeNull();
    const success=vi.fn(async()=>({text:async()=>'{"duplicate":true}'}));
    expect(await retryPending({storage,fetchImpl:success,sleep:async()=>{}})).toBe(1);
    expect(storage.getItem(pendingKey("test-id"))).toBeNull(); expect(storage.getItem("pending:other:id")).toBe("safe");
  });
  it("times out hanging fetch and never calls the real network", async () => {
    const guard=vi.fn(()=>{throw new Error("real network forbidden")});vi.stubGlobal("fetch",guard);
    const storage=new MemStorage(); const fetchImpl=vi.fn(()=>new Promise<never>(()=>{}));
    expect(await sendWithRetry(payload,{storage,fetchImpl,timeoutMs:5,sleep:async()=>{}})).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(3); expect(guard).not.toHaveBeenCalled();
  });
});

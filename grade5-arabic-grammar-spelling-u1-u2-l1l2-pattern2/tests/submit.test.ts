import { buildPayload, sendWithRetry, retryPending, pendingKey, hasPending, EXAM_ID as _e } from "../src/utils/submit";
import { EXAM_ID, EXAM_TITLE } from "../src/config";
import { QUESTIONS } from "../src/data/questions";
let f = 0; process.exitCode = 1;
const check = (n: string, c: boolean) => { if (!c) { f++; console.log("  ✗ " + n); } else console.log("  ✓ " + n); };
class Store { m = new Map<string, string>(); get length() { return this.m.size; } key(i: number) { return [...this.m.keys()][i] ?? null; } getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, v); } removeItem(k: string) { this.m.delete(k); } }
const sleep = async () => {};
const okFetch = async () => ({ text: async () => JSON.stringify({ ok: true }) });
const failFetch = async () => { throw new Error("offline"); };
const answers = Object.fromEntries(QUESTIONS.flatMap(q => q.subparts.map(s => [s.id, [...s.correct]])));
const attempt: any = { version: 1, id: "attempt-test-1", studentName: "طالبة تجريبية", startedAt: 1700000000000, submittedAt: 1700000065000, answers, current: 0 };
async function main() {
  const p = buildPayload(attempt);
  check("payload keys contract", JSON.stringify(Object.keys(p)) === JSON.stringify(["token","attemptId","examId","examTitle","studentName","startAt","submitAt","elapsedSec","summary","lessons","details","reportText"]));
  check("payload examId/title/attempt", p.examId === EXAM_ID && p.examTitle === EXAM_TITLE && p.attemptId === "attempt-test-1" && EXAM_TITLE.includes("نموذج ثاني"));
  check("payload details=80, summary max=100, lessons=5", p.details.length === 80 && p.summary.max === 100 && p.summary.total === 100 && p.lessons.length === 5);
  const s1 = new Store(); check("success sends once & clears pending", (await sendWithRetry(p, { storage: s1, fetchImpl: okFetch as any, sleep })) === true && !hasPending(p.attemptId, { storage: s1 }));
  check("duplicate prevented via sent marker", (await sendWithRetry(p, { storage: s1, fetchImpl: failFetch as any, sleep })) === true);
  const s2 = new Store(); let calls = 0; const flaky = async () => { calls++; if (calls < 3) throw new Error("x"); return { text: async () => JSON.stringify({ ok: true }) }; };
  check("retry succeeds on 3rd attempt", (await sendWithRetry({ ...p, attemptId: "attempt-retry" }, { storage: s2, fetchImpl: flaky as any, sleep })) === true && calls === 3);
  const s3 = new Store(); check("failure stores pending", (await sendWithRetry({ ...p, attemptId: "attempt-fail" }, { storage: s3, fetchImpl: failFetch as any, sleep })) === false && hasPending("attempt-fail", { storage: s3 }));
  s3.setItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2:other", "untouched");
  check("retryPending resends only own pending", (await retryPending({ storage: s3, fetchImpl: okFetch as any, sleep })) === 1 && s3.getItem("pending:grade5-arabic-grammar-spelling-u1-u2-l1l2:other") === "untouched" && !hasPending("attempt-fail", { storage: s3 }));
  console.log(f === 0 ? "submit OK" : f + " failures"); if (f === 0) process.exitCode = 0;
}
void main();

import baseline from "./fixtures/baseline.json";
import { QUESTIONS, TOTAL_MARKS, TOTAL_SUBPARTS } from "../src/data/questions";
import { gradeAttempt } from "../src/utils/grading";
import { buildTxtReport } from "../src/utils/report";
let f = 0; process.exitCode = 1;
const check = (n: string, c: boolean, x = "") => { if (!c) { f++; console.log("  ✗ " + n + x); } else console.log("  ✓ " + n); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
check("questions identical to original baseline (order/answers/marks)", same(QUESTIONS, (baseline as any).questions));
check("30 questions / 80 subparts / 100 marks", QUESTIONS.length === 30 && TOTAL_SUBPARTS === 80 && TOTAL_MARKS === 100);
const base: any = { version: 1, id: "baseline-attempt", studentName: "طالبة تجريبية", startedAt: 1700000000000, submittedAt: 1700003725000, answers: {}, current: 0 };
for (const [name, sc] of Object.entries((baseline as any).scenarios)) {
  const r = gradeAttempt({ ...base, answers: (sc as any).answers });
  check(`grading matches baseline: ${name}`, same(r, (sc as any).result));
}
const full = gradeAttempt({ ...base, answers: (baseline as any).scenarios.full.answers });
check("full=100, empty=0", full.totalEarned === 100 && gradeAttempt({ ...base, answers: {} }).totalEarned === 0);
const report = buildTxtReport(full);
const norm = (s: string) => s.replace(/أُنشئ هذا التقرير[^\r]+/, "PRIVACY").replace(/تم إنشاء هذا التقرير[^\r]+/, "PRIVACY").replace(/تاريخ التسليم: [^\r]+/, "DATE");
const stripHead = (s: string) => norm(s).split("\r\n").map((l, i) => (i === 1 || i === 2 ? "TITLE" : l)).join("\r\n");
check("report identical to baseline except title/subtitle/privacy lines", stripHead(report) === stripHead((baseline as any).report));
console.log(f === 0 ? "data OK" : f + " failures"); if (f === 0) process.exitCode = 0;

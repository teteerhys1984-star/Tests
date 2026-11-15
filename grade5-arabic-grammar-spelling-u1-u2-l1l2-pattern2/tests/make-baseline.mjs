#!/usr/bin/env node
/** يولّد tests/fixtures/baseline.json من بيانات الاختبار الحالية (قبل أي تعديل محتوى). */
import { buildSync } from "esbuild";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, ".tmp-baseline-entry.ts");
fs.writeFileSync(entry, `
import { QUESTIONS, TOTAL_MARKS, TOTAL_SUBPARTS } from "./src/data/questions/index";
import { gradeAttempt } from "./src/utils/grading";
import { buildTxtReport } from "./src/utils/report";
const base={version:1,id:"baseline-attempt",studentName:"طالبة تجريبية",startedAt:1700000000000,submittedAt:1700003725000,answers:{},current:0};
const allCorrect=Object.fromEntries(QUESTIONS.flatMap(q=>q.subparts.map(s=>[s.id,[...s.correct]])));
const empty={};
const wrong={}; for(const q of QUESTIONS) for(const s of q.subparts){ if(s.kind==="text") wrong[s.id]=["إجابة خاطئة تماما"]; else if(s.kind==="multi") wrong[s.id]=[(s.options||[]).find(o=>!s.correct.includes(o)) ?? s.options[0]]; else wrong[s.id]=[(s.options||[]).find(o=>o!==s.correct[0]) ?? "x"]; }
const mixed={}; let i=0; for(const q of QUESTIONS) for(const s of q.subparts){ i++; if(i%3===0) mixed[s.id]=[...s.correct]; else if(i%3===1) mixed[s.id]=wrong[s.id]; }
const scenarios={}; for(const [n,a] of Object.entries({full:allCorrect,empty,wrong,mixed})){ scenarios[n]={answers:a,result:gradeAttempt({...base,answers:a})}; }
const report=buildTxtReport(gradeAttempt({...base,answers:allCorrect}));
console.log(JSON.stringify({questions:QUESTIONS,totalMarks:TOTAL_MARKS,totalSubparts:TOTAL_SUBPARTS,scenarios,report},null,2));
`);
try { buildSync({entryPoints:[entry],bundle:true,platform:"node",format:"cjs",outfile:path.join(root,".tmp-baseline.cjs"),logLevel:"warning"}); }
finally { fs.rmSync(entry,{force:true}); }

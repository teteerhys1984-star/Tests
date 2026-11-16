import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { QUESTIONS, TOTAL_MARKS } from "../../data/questions";

it("retains the original question bank byte-for-byte except the requested display title",()=>{
 const original=readFileSync(resolve(process.cwd(),"../English_L1L2 Test/src/data/questions.ts"),"utf8");
 const migrated=readFileSync(resolve(process.cwd(),"src/data/questions.ts"),"utf8");
 const title=/export const EXAM_TITLE =[\s\S]*?;\n/;
 expect(original.replace(title,"EXAM_TITLE_DISPLAY_PLACEHOLDER\n")).toBe(migrated.replace(title,"EXAM_TITLE_DISPLAY_PLACEHOLDER\n"));
});

it("preserves all twenty five-mark questions, every subpart and the 100-mark total",()=>{
 expect(QUESTIONS).toHaveLength(20);expect(TOTAL_MARKS).toBe(100);expect(QUESTIONS.every(q=>q.marks===5)).toBe(true);
 expect(QUESTIONS.every(q=>q.subparts.reduce((n,s)=>n+s.marks,0)===q.marks)).toBe(true);
 expect(QUESTIONS.flatMap(q=>q.subparts)).toHaveLength(91);
});

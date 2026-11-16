// Prints the 50-question map (exam order) as a Markdown table.
//   npx vite-node scripts/question-map.ts
import { lessonById } from "../src/data/lessons";
import { EXAM_QUESTIONS } from "../src/data/questions";

const rows = EXAM_QUESTIONS.map((q, i) => {
  const source = q.sources.map((s) => `${s.book} ${s.page} – ${s.exercise}`).join("; ");
  const marks = q.parts.map((p) => p.marks).join(" + ");
  return `| ${i + 1} | ${q.id} | L${q.lesson} ${lessonById(q.lesson).title} | ${q.format} | ${marks} | ${source} |`;
});

console.log(["| # | ID | Lesson | Format | Marks | Source (book, page – exercise) |", "|---:|---|---|---|---|---|", ...rows].join("\n"));

/* Emits /tmp/answers.json: a perfect answer map keyed by part id, plus integrity stats. */
import { writeFileSync } from "node:fs";
import { QUESTIONS, TOTAL_MARKS, VOCABULARY_COUNT } from "../src/data/questions";
import type { AnswerMap } from "../src/types";

const answers: AnswerMap = {};
let partCount = 0;
for (const q of QUESTIONS) {
  for (const p of q.parts) {
    partCount++;
    answers[p.id] =
      p.kind === "tf"
        ? String(p.answer)
        : p.kind === "order"
          ? [...p.answer]
          : p.kind === "rubric"
            ? q.id === "q35"
              ? "My favourite subject is Science because it is fun."
              : "My name is Laila Haddad. I am from Syria."
            : p.kind === "fill"
              ? p.accept[0]
              : p.answer;
  }
}

writeFileSync(
  "/tmp/answers.json",
  JSON.stringify({ answers, partCount, totalMarks: TOTAL_MARKS, vocab: VOCABULARY_COUNT })
);
console.log(`parts=${partCount} marks=${TOTAL_MARKS} vocab=${VOCABULARY_COUNT} questions=${QUESTIONS.length}`);

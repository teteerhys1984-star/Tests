import { ALL_SUBPARTS, QUESTIONS, TOTAL_MARKS, questionMarks } from "./data";
import { gradeAttempt, isSubpartAnswered } from "./grade";
import type { Answers, Attempt, Subpart } from "./types";

const errors: string[] = [];

function correctValue(sub: Subpart) {
  switch (sub.kind) {
    case "mcq":
      return sub.answer;
    case "tf":
      return sub.answer;
    case "numeric":
      return sub.answer;
    case "pair":
      return { a: String(sub.answer[0]), b: String(sub.answer[1]) };
    case "multi":
      return [...sub.answer];
    case "order":
      return [...sub.answer];
    case "compare":
      return sub.answer;
  }
}

if (QUESTIONS.length !== 30) errors.push(`question count ${QUESTIONS.length}`);
if (ALL_SUBPARTS.length < 60 || ALL_SUBPARTS.length > 75) errors.push(`subpart count ${ALL_SUBPARTS.length}`);
const sum = QUESTIONS.reduce((acc, q) => acc + questionMarks(q), 0);
if (sum !== TOTAL_MARKS) errors.push(`marks sum ${sum}`);

const ids = new Set<string>();
for (const q of QUESTIONS) {
  if (!q.page || !q.stem || !q.title) errors.push(`missing question metadata ${q.id}`);
  let qm = 0;
  for (const sub of q.subparts) {
    if (ids.has(sub.id)) errors.push(`duplicate subpart id ${sub.id}`);
    ids.add(sub.id);
    qm += sub.marks;
    if (!sub.page || !sub.explanation || !sub.prompt) errors.push(`missing subpart metadata ${sub.id}`);
    if (sub.kind === "mcq") {
      if (sub.answer < 0 || sub.answer >= sub.options.length) errors.push(`bad mcq answer ${sub.id}`);
      if (new Set(sub.options).size !== sub.options.length) errors.push(`duplicate options ${sub.id}`);
    }
    if (sub.kind === "pair" && sub.labels.length !== 2) errors.push(`bad pair labels ${sub.id}`);
    if (sub.kind === "multi" && sub.labels.length !== sub.answer.length) errors.push(`bad multi ${sub.id}`);
    if (sub.kind === "order") {
      if (sub.items.length !== sub.answer.length) errors.push(`bad order count ${sub.id}`);
      if (new Set(sub.items).size !== sub.items.length) errors.push(`duplicate order items ${sub.id}`);
      if (sub.items.some((i) => !sub.answer.includes(i))) errors.push(`order item mismatch ${sub.id}`);
    }
    if (sub.marks < 1) errors.push(`zero marks ${sub.id}`);
  }
  if (qm !== questionMarks(q)) errors.push(`question marks mismatch ${q.id}`);
}

const answers: Answers = {};
for (const sub of ALL_SUBPARTS) answers[sub.id] = correctValue(sub);

const submitted = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
if (submitted !== ALL_SUBPARTS.length) errors.push("not all correct answers populated");

const attempt: Attempt = {
  schema: 2,
  examId: "adam-math-grade4-minecraft",
  examVersion: "1.0.0",
  attemptId: "audit",
  studentName: "اختبار تدقيقي",
  phase: "exam",
  questionOrder: QUESTIONS.map((q) => q.id),
  optionOrders: {},
  answers,
  currentIndex: 0,
  visited: [],
  startTime: Date.now(),
  startSoundPlayed: true,
  submissionSoundPlayed: true,
};

const result = gradeAttempt(attempt);
if (result.awarded !== 100) errors.push(`perfect score gives ${result.awarded}`);
if (result.counts.correct !== ALL_SUBPARTS.length) errors.push(`perfect count ${result.counts.correct}`);
if (result.counts.partial || result.counts.incorrect || result.counts.unanswered) errors.push("perfect grading has non-correct");

const emptyResult = gradeAttempt({ ...attempt, answers: {} });
if (emptyResult.awarded !== 0) errors.push("empty grading not zero");
if (emptyResult.counts.unanswered !== ALL_SUBPARTS.length) errors.push("empty grading unanswered count wrong");
if (!ALL_SUBPARTS.every((s) => !isSubpartAnswered(s, undefined))) errors.push("empty completeness wrong");

const sampleWrong: Attempt = {
  ...attempt,
  answers: { ...answers, q1a: 0, q4a: { a: "3", b: "9" }, q19a: [...(correctValue(ALL_SUBPARTS.find((s) => s.id === "q19a")!) as string[])] },
};
const wrongResult = gradeAttempt(sampleWrong);
if (wrongResult.awarded !== 97) errors.push(`mixed grading gives ${wrongResult.awarded}, expected 97`);
if (wrongResult.counts.partial !== 1) errors.push(`pair partial count ${wrongResult.counts.partial}`);
if (wrongResult.counts.incorrect !== 1) errors.push(`incorrect count ${wrongResult.counts.incorrect}`);
if (wrongResult.counts.correct !== 69) errors.push(`correct count ${wrongResult.counts.correct}`);

const arithmetic: [number, number, number][] = [
  [36428, 24375, 60803],
  [47265, 18473, 65738],
  [27845, 15960, 43805],
];
for (const [a, b, expected] of arithmetic) {
  if (a + b !== expected) errors.push(`addition ${a}+${b}`);
}

const roundingTens: [number, number][] = [
  [486, 490],
  [8327, 8330],
  [3645, 3650],
  [1389, 1390],
  [6884, 6880],
  [55, 60],
  [2464, 2460],
];
for (const [n, expected] of roundingTens) {
  const actual = Math.round(n / 10) * 10;
  if (actual !== expected) errors.push(`round ten ${n} -> ${actual}, expected ${expected}`);
}
const roundingHundreds: [number, number][] = [
  [2358, 2400],
  [7821, 7800],
  [9986, 10000],
  [1389, 1400],
  [1849, 1800],
  [550, 600],
];
for (const [n, expected] of roundingHundreds) {
  const actual = Math.round(n / 100) * 100;
  if (actual !== expected) errors.push(`round hundred ${n} -> ${actual}, expected ${expected}`);
}

const totalQuestions = result.questions.map((q) => q.marks).reduce((a, b) => a + b, 0);
if (totalQuestions !== 100) errors.push(`result question marks ${totalQuestions}`);

console.log(`Questions: ${QUESTIONS.length}`);
console.log(`Subparts: ${ALL_SUBPARTS.length}`);
console.log(`Marks: ${sum}`);
console.log(`Grades: correct=${result.counts.correct}, partial=${result.counts.partial}, wrong=${result.counts.incorrect}, unanswered=${result.counts.unanswered}`);
console.log(`Perfect score: ${result.awarded}/${result.total}`);
console.log(errors.length ? `AUDIT ERRORS:\n- ${errors.join("\n- ")}` : "AUDIT PASSED");
if (errors.length) process.exitCode = 1;

import { ALL_ITEMS, QUESTIONS, TOTAL_MARKS, type ExamItem, type ExamQuestion } from "../data/exam";

export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export type ItemStatus = "correct" | "spelling" | "incorrect" | "unanswered";

export interface ItemResult {
  item: ExamItem;
  label: string;
  questionNumber: number;
  partTitle: string;
  submitted: Answer | null;
  status: ItemStatus;
  awarded: number;
}

export interface QuestionResult {
  question: ExamQuestion;
  awarded: number;
  max: number;
  items: ItemResult[];
}

export interface ExamResult {
  questions: QuestionResult[];
  items: ItemResult[];
  total: number;
  max: number;
  percent: number;
  answeredCount: number;
}

/** Normalises text for comparison: case, curly apostrophes, hyphens and extra spaces. */
export function normalizeText(s: string): string {
  return s
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * Vocabulary marking rules:
 *  - "correct": the typed word matches the target after normalisation
 *    (capitalisation, extra spaces, hyphens, and a leading "a/an/the" are ignored).
 *  - "spelling": the word is the target with a small spelling slip
 *    (missing/extra space, or 1 letter wrong for words of 5–9 letters,
 *    2 letters wrong for words of 10+ letters). Plurals are NOT accepted.
 *  - "incorrect": anything else, including a different English word.
 */
export function classifyVocab(input: string, expected: string): ItemStatus {
  const raw = normalizeText(input);
  if (!raw) return "unanswered";
  const target = normalizeText(expected);
  const candidate = raw.replace(/^(a|an|the)\s+/, "");
  if (candidate === target) return "correct";

  const compact = (s: string) => s.replace(/\s/g, "");
  const c = compact(candidate);
  const t = compact(target);
  if (c === t) return "spelling";
  if (c === t + "s" || t === c + "s") return "incorrect"; // plural or singular form is a different word
  const maxDistance = t.length >= 10 ? 2 : t.length >= 5 ? 1 : 0;
  if (maxDistance > 0 && levenshtein(c, t) <= maxDistance) return "spelling";
  return "incorrect";
}

function isBlank(v: Answer | null | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0 || v.some((x) => !x || !x.trim());
  return v.trim() === "";
}

export function isItemAnswered(v: Answer | null | undefined): boolean {
  return !isBlank(v);
}

export function displayAnswer(item: ExamItem, v: Answer | null | undefined): string {
  if (isBlank(v)) return "No answer";
  if (Array.isArray(v)) {
    return v.map((x, i) => `${item.slotLabels?.[i] ?? `Slot ${i + 1}`}: ${x}`).join(" · ");
  }
  return v as string;
}

export function displayCorrect(item: ExamItem): string {
  if (Array.isArray(item.answer)) {
    return item.answer.map((x, i) => `${item.slotLabels?.[i] ?? `Slot ${i + 1}`}: ${x}`).join(" · ");
  }
  return item.answer;
}

export function gradeItem(
  item: ExamItem,
  submitted: Answer | null | undefined,
): { status: ItemStatus; awarded: number } {
  if (isBlank(submitted)) return { status: "unanswered", awarded: 0 };

  if (item.kind === "vocab") {
    const status = classifyVocab(submitted as string, item.answer as string);
    if (status === "correct") return { status, awarded: item.marks };
    if (status === "spelling") return { status, awarded: Math.floor(item.marks / 2) };
    return { status: "incorrect", awarded: 0 };
  }

  if (Array.isArray(item.answer)) {
    const given = (submitted as string[]).map(normalizeText);
    const expected = item.answer.map(normalizeText);
    const ok = given.length === expected.length && expected.every((x, i) => x === given[i]);
    return ok ? { status: "correct", awarded: item.marks } : { status: "incorrect", awarded: 0 };
  }

  const ok = normalizeText(submitted as string) === normalizeText(item.answer);
  return ok ? { status: "correct", awarded: item.marks } : { status: "incorrect", awarded: 0 };
}

export function gradeExam(answers: Answers): ExamResult {
  const items: ItemResult[] = ALL_ITEMS.map(({ item, label, questionNumber, partTitle }) => {
    const submitted = answers[item.id] ?? null;
    const { status, awarded } = gradeItem(item, submitted);
    return { item, label, questionNumber, partTitle, submitted, status, awarded };
  });

  const questions: QuestionResult[] = QUESTIONS.map((question) => {
    const qItems = items.filter((i) => i.questionNumber === question.number);
    return {
      question,
      awarded: qItems.reduce((s, i) => s + i.awarded, 0),
      max: qItems.reduce((s, i) => s + i.item.marks, 0),
      items: qItems,
    };
  });

  const total = questions.reduce((s, q) => s + q.awarded, 0);
  return {
    questions,
    items,
    total,
    max: TOTAL_MARKS,
    percent: Math.round((total / TOTAL_MARKS) * 100),
    answeredCount: items.filter((i) => i.status !== "unanswered").length,
  };
}

/** Structural self-check used by the test suite and the teacher area. */
export function validateExamStructure(): string[] {
  const problems: string[] = [];
  if (QUESTIONS.length !== 8) problems.push(`Expected 8 questions, found ${QUESTIONS.length}`);
  const sum = QUESTIONS.reduce((s, q) => s + q.parts.reduce((ps, p) => ps + p.items.reduce((is, i) => is + i.marks, 0), 0), 0);
  if (sum !== TOTAL_MARKS) problems.push(`Total marks ${sum} ≠ ${TOTAL_MARKS}`);
  for (const q of QUESTIONS) {
    const qm = q.parts.reduce((ps, p) => ps + p.items.reduce((is, i) => is + i.marks, 0), 0);
    if (qm !== q.targetMarks) problems.push(`Q${q.number} has ${qm} marks, target ${q.targetMarks}`);
  }
  const vocab = ALL_ITEMS.filter((x) => x.item.kind === "vocab");
  if (vocab.length !== 8) problems.push(`Expected 8 vocab items, found ${vocab.length}`);
  const vocabQs = new Set(vocab.map((x) => x.questionNumber));
  if (vocabQs.size !== 3 || ![1, 2, 3].every((n) => vocabQs.has(n))) problems.push("Vocabulary must be in Q1–Q3");
  for (const v of vocab) {
    if (!v.item.arabic) problems.push(`${v.item.id} has no Arabic prompt`);
  }
  const words = vocab.map((x) => x.item.answer as string).sort();
  const required = ["canteen", "classroom", "computer lab", "corridor", "library", "playground", "school uniform", "science lab"].sort();
  if (JSON.stringify(words) !== JSON.stringify(required)) problems.push(`Vocabulary words mismatch: ${words.join(", ")}`);
  return problems;
}

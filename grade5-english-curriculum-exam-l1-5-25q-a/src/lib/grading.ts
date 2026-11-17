import type { Item, Question } from "@/data/exam";
import { QUESTIONS, TOTAL_MARKS } from "@/data/exam";

/** Normalise a typed answer so punctuation / case / spacing never costs a mark. */
export function norm(v: string): string {
  return v
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?;,]+$/g, "");
}

/**
 * Checks whether a single sub-item response is correct.
 *
 * Note on `mc`: MC options are chosen from fixed buttons, so we compare the
 * trimmed option text directly (case-insensitively) instead of stripping
 * trailing punctuation with `norm()`. In particular, `q16d` tests end marks
 * `[".", ",", "?"]` where `norm()` would collapse all three options to `""`.
 */
export function isCorrect(item: Item, raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === "") return false;
  switch (item.kind) {
    case "mc":
      return (
        raw.replace(/[\u2018\u2019]/g, "'").trim().toLowerCase() ===
        item.answer.replace(/[\u2018\u2019]/g, "'").trim().toLowerCase()
      );
    case "tf":
      return norm(raw) === norm(item.answer);
    case "text":
      return item.accept.map(norm).includes(norm(raw));
    case "order": {
      const student = raw
        .split("|")
        .map((w) => norm(w))
        .filter(Boolean)
        .join(" ");
      const key = item.answer
        .split("|")
        .map((w) => norm(w))
        .filter(Boolean)
        .join(" ");
      return student === key;
    }
  }
}

export function studentDisplay(item: Item, raw: string | undefined): string {
  if (raw === undefined || raw.trim() === "") return "";
  if (item.kind === "order") return raw.split("|").filter(Boolean).join(" ");
  if (item.kind === "tf") return raw;
  return raw.trim();
}

export function correctDisplay(item: Item): string {
  return item.kind === "order" ? item.answer.split("|").join(" ") : item.answer;
}

export function isAnswered(item: Item, raw: string | undefined): boolean {
  if (raw === undefined) return false;
  if (item.kind === "order") return raw.split("|").filter(Boolean).length === item.words.length;
  return raw.trim() !== "";
}

export interface ItemResult {
  itemId: string;
  prompt: string;
  kind: Item["kind"];
  marks: number;
  awarded: number;
  answered: boolean;
  student: string;
  correct: string;
  isCorrect: boolean;
  explain: string;
}

export interface QuestionResult {
  question: Question;
  awarded: number;
  marks: number;
  items: ItemResult[];
}

export interface ExamResult {
  name: string;
  score: number;
  total: number;
  correctItems: number;
  totalItems: number;
  questions: QuestionResult[];
}

export function gradeExam(answers: Record<string, string>, name: string): ExamResult {
  const questions: QuestionResult[] = QUESTIONS.map((q) => {
    const items = q.items.map((it) => {
      const raw = answers[`${q.id}/${it.id}`];
      const ok = isCorrect(it, raw);
      const answered = isAnswered(it, raw);
      return {
        itemId: it.id,
        prompt: it.prompt,
        kind: it.kind,
        marks: it.marks,
        awarded: ok ? it.marks : 0,
        answered,
        student: studentDisplay(it, raw),
        correct: correctDisplay(it),
        isCorrect: ok,
        explain: it.explain,
      };
    });
    return {
      question: q,
      awarded: items.reduce((s, i) => s + i.awarded, 0),
      marks: q.items.reduce((s, i) => s + i.marks, 0),
      items,
    };
  });

  const score = questions.reduce((s, q) => s + q.awarded, 0);
  const flat = questions.flatMap((q) => q.items);
  return {
    name,
    score,
    total: TOTAL_MARKS,
    correctItems: flat.filter((i) => i.isCorrect).length,
    totalItems: flat.length,
    questions,
  };
}

export function answeredCount(answers: Record<string, string>): number {
  let n = 0;
  for (const q of QUESTIONS)
    for (const it of q.items) if (isAnswered(it, answers[`${q.id}/${it.id}`])) n += 1;
  return n;
}

export function requiredItemCount(): number {
  return QUESTIONS.reduce((s, q) => s + q.items.length, 0);
}

export function allAnswered(answers: Record<string, string>): boolean {
  return answeredCount(answers) === requiredItemCount();
}

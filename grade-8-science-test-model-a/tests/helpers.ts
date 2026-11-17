import { QUESTIONS } from "@/data/exam";
import type { AnswerMap, Attempt } from "@/data/types";

/** Builds a fully correct answer map from the exam's own answer specs. */
export function fullAnswers(): AnswerMap {
  const answers: AnswerMap = {};
  for (const q of QUESTIONS) {
    for (const s of q.subs) {
      const spec = s.answer;
      if (spec.kind === "numeric") answers[s.id] = String(spec.value);
      else if (spec.kind === "text") answers[s.id] = spec.criteria.map((c) => c.any[0]).join(" ");
      else if (spec.kind === "matrix")
        answers[s.id] = JSON.stringify(Object.fromEntries(spec.cells.map((c) => [c.id, c.accept[0]])));
      else if (spec.kind === "lewis")
        answers[s.id] = JSON.stringify({ shared: spec.shared, lone: [spec.loneLeft, spec.loneRight] });
      else answers[s.id] = JSON.stringify({ strokes: Math.max(3, spec.minStrokes), labels: spec.labels });
    }
  }
  return answers;
}

export function emptyAnswers(): AnswerMap {
  const answers: AnswerMap = {};
  for (const q of QUESTIONS) for (const s of q.subs) answers[s.id] = "";
  return answers;
}

export function completeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    v: 1,
    attemptId: "test-attempt-0001",
    name: "طالب اختبار",
    startedAt: 1_700_000_000_000,
    answers: fullAnswers(),
    muted: true,
    idx: 0,
    ...overrides,
  };
}

export class FakeStorage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}

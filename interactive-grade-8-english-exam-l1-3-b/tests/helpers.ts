import { ALL_PARTS } from "../src/data/exam";
import { effectiveChoiceAnswer } from "../src/lib/grading";

export function makePerfectAnswers(): Record<string, string> {
  const ans: Record<string, string> = {};
  for (const p of ALL_PARTS) {
    ans[p.id] = p.kind === "choice" ? String(effectiveChoiceAnswer(p)) : p.answers[0];
  }
  return ans;
}

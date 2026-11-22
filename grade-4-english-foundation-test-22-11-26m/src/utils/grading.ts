import type { AnswerMap, ExamResult, Question, QuestionResult, SubQuestion, SubResult } from "../data/types";

/** Normalise free text so that spacing, case, punctuation and curly quotes do not matter. */
export function normalize(s: string): string {
  return s
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .toLowerCase()
    .replace(/[.,!?;:"()\u2192→✓✗]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSubCorrect(sub: SubQuestion, given: string | undefined): boolean {
  if (!given) return false;
  const g = normalize(given);
  if (!g) return false;
  switch (sub.type) {
    case "text":
      return sub.accept.some((a) => normalize(a) === g);
    case "choice":
    case "match":
      return normalize(sub.answer) === g;
    case "order": {
      const list = [sub.answer, ...(sub.accept ?? [])];
      return list.some((a) => normalize(a) === g);
    }
  }
}

export function correctAnswerText(sub: SubQuestion): string {
  switch (sub.type) {
    case "text":
      return sub.display ?? capitalizeFirst(sub.accept[0]);
    case "choice":
    case "match":
      return sub.answer;
    case "order":
      return sub.answer;
  }
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normToken(t: string): string {
  return t.toLowerCase().replace(/[.,!?;:"]/g, "");
}

/**
 * Splits a stored order answer (chips joined by single spaces) back into the
 * pool chips it was built from. Chips may themselves contain spaces
 * (e.g. "the cat"), so a plain split is not enough: tokens are matched
 * against the pool chips with a small backtracking search. Returns the chip
 * sequence in pool casing, [] for an empty value, or null when the value
 * cannot be segmented into pool chips.
 */
export function parseOrderValue(value: string, words: string[]): string[] | null {
  const tokens = value.trim().split(/\s+/).filter(Boolean).map(normToken);
  if (!tokens.length) return [];
  const chipTokens = words.map((w) => w.trim().split(/\s+/).filter(Boolean).map(normToken));
  const used = new Array<boolean>(words.length).fill(false);
  const result: string[] = [];
  const dfs = (i: number): boolean => {
    if (i === tokens.length) return true;
    for (let c = 0; c < words.length; c++) {
      if (used[c]) continue;
      const ct = chipTokens[c];
      if (i + ct.length > tokens.length) continue;
      let ok = true;
      for (let k = 0; k < ct.length; k++) {
        if (tokens[i + k] !== ct[k]) { ok = false; break; }
      }
      if (!ok) continue;
      used[c] = true;
      result.push(words[c]);
      if (dfs(i + ct.length)) return true;
      used[c] = false;
      result.pop();
    }
    return false;
  };
  return dfs(0) ? result : null;
}

export function isSubAnswered(sub: SubQuestion, given: string | undefined): boolean {
  if (given === undefined || given === null) return false;
  if (sub.type === "order") {
    // must have placed every pool chip exactly once (chips may contain spaces)
    const parsed = parseOrderValue(given, sub.words);
    return parsed !== null && parsed.length === sub.words.length;
  }
  return given.trim().length > 0;
}

export function isQuestionComplete(q: Question, answers: AnswerMap): boolean {
  return q.subs.every((s) => isSubAnswered(s, answers[s.id]));
}

export function gradeExam(questions: Question[], answers: AnswerMap): ExamResult {
  const results: QuestionResult[] = questions.map((q) => {
    const subs: SubResult[] = q.subs.map((sub) => {
      const given = answers[sub.id] ?? "";
      const correct = isSubCorrect(sub, given);
      return { sub, given, correct, earned: correct ? sub.marks : 0 };
    });
    const earned = subs.reduce((a, s) => a + s.earned, 0);
    const max = q.subs.reduce((a, s) => a + s.marks, 0);
    return { question: q, subs, earned, max };
  });
  const total = results.reduce((a, r) => a + r.earned, 0);
  const max = results.reduce((a, r) => a + r.max, 0);
  const allSubs = results.flatMap((r) => r.subs);
  const correctCount = allSubs.filter((s) => s.correct).length;
  return {
    questions: results,
    total,
    max,
    percentage: max ? Math.round((total / max) * 1000) / 10 : 0,
    correctCount,
    incorrectCount: allSubs.length - correctCount,
  };
}

export function formatMarks(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Text normalization for grading open answers.
 *
 * Guarantees: case, harmless spacing differences, punctuation and simple
 * article usage never cause false marking. Comparison is done on the FULL
 * normalized string against a documented set of acceptable answers — never
 * via substring matching.
 */

/** Normalize a single free-text answer for comparison. */
export function normalizeText(input: string): string {
  let s = input.toLowerCase();
  // Unify apostrophes / quotes and dashes.
  s = s.replace(/[’‘`]/g, "'");
  s = s.replace(/[“”]/g, '"');
  s = s.replace(/[‐-‒–—]/g, "-");
  // Contractions & possessives: it's → its, don't → dont, Adam's → Adam.
  s = s.replace(/'s\b/g, "");
  s = s.replace(/n't\b/g, "nt");
  s = s.replace(/'/g, "");
  // All other punctuation becomes a space.
  s = s.replace(/[.,!?;:'"()[\]{}«»\-_/\\+*/&%$#@~^<>|=]/g, " ");
  // Collapse whitespace.
  s = s.replace(/\s+/g, " ").trim();
  // Drop leading fillers that carry no meaning for marking.
  s = s.replace(/^(yes|no)[\s,]+/, "");
  s = s.replace(/^(because|so)\s+/, "");
  s = s.replace(/^(?:it|that)(?:\s+(?:is|was|s))\s+/, "");
  s = s.replace(
    /^(?:he|she|it|they|we|i)\s+(?:is|was|are|were|am|has|have|had|will|would|want|wants|wanted)\s+/,
    "",
  );
  s = s.replace(/^(?:the|a|an)\s+/, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** True when the student's text matches any acceptable answer. */
export function matchesAny(student: string, accept: string[]): boolean {
  const norm = normalizeText(student);
  if (!norm) return false;
  return accept.some((a) => normalizeText(a) === norm);
}

/** Normalize a word sequence (reorder answers) to a single comparable key. */
export function normalizeSequence(words: string[]): string {
  return words
    .map((w) => w.toLowerCase().trim())
    .filter(Boolean)
    .join(" ");
}

/** Check that two word arrays are the same multiset (for data validation). */
export function sameMultiset(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (ws: string[]) =>
    ws.map((w) => w.toLowerCase().trim()).sort().join("|");
  return norm(a) === norm(b);
}

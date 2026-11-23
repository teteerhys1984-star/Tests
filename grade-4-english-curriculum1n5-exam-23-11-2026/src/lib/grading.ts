import type { AnswerMap, AnswerValue, ExamPart, ExamQuestion, ExamResult, PartResult, QuestionResult } from '../types';
import { QUESTIONS } from '../data/exam';

/* ------------------------------------------------------------------ *
 *  Normalisation & matching helpers                                   *
 * ------------------------------------------------------------------ */

/** Collapse whitespace, lowercase, unify apostrophes, strip trailing full stop. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim();
}

/** Extra normalisation for telling-the-time answers: drops a leading "it's / it is / its". */
export function normalizeTime(input: string): string {
  let s = normalize(input);
  s = s.replace(/^(it's|its|it is)\s+/i, '');
  s = s.replace(/\s*:\s*/g, ':');
  s = s.replace(/\s*\.\s*/g, '.'); // 6.30 -> 6.30
  return s.trim();
}

/** Classic Levenshtein edit distance (iterative, two rows). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n];
}

/** Whole-word / whole-phrase containment test, used for short answers and fixes. */
export function containsWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9'])${esc}([^a-z0-9']|$)`, 'i');
  return re.test(normalize(haystack));
}

/* ------------------------------------------------------------------ *
 *  Per-part marking                                                   *
 * ------------------------------------------------------------------ */

export type PartStatus = 'correct' | 'partial' | 'wrong' | 'empty';

export interface PartGrade {
  earned: number;
  status: PartStatus;
  submittedText: string;
}

function renderAnswerText(value: AnswerValue | undefined): string {
  if (value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  return String(value);
}

/** Join ordered token indices back into a sentence string. */
export function orderAnswerText(part: ExamPart, value: AnswerValue | undefined): string {
  if (!Array.isArray(value) || !part.tokens) return '';
  return value.map((i) => part.tokens![i] ?? '').join(' ');
}

export function gradePart(part: ExamPart, value: AnswerValue | undefined, kind: ExamQuestion['kind']): PartGrade {
  const max = part.marks;

  /* ---- Order parts: tap-to-build sentences ---- */
  if (kind === 'order') {
    if (!Array.isArray(value) || value.length === 0 || !part.targetTokens || !part.tokens) {
      return { earned: 0, status: 'empty', submittedText: '' };
    }
    const built = value.map((i) => part.tokens![i]).filter(Boolean);
    const submittedText = built.join(' ');
    const targetText = part.targetTokens.join(' ');
    const ok = normalize(built.join(' ')) === normalize(targetText);
    if (ok) return { earned: max, status: 'correct', submittedText };
    if (part.partialRule === 'order-any-order') {
      // All the right words present but wrong sequence -> partial credit.
      const a = [...built].map(normalize).sort();
      const b = [...part.tokens!].map(normalize).sort();
      if (a.length === b.length && a.every((t, i) => t === b[i]) && built.length === part.tokens!.length) {
        return { earned: 2, status: 'partial', submittedText };
      }
    }
    return { earned: 0, status: 'wrong', submittedText };
  }

  const rawStr = renderAnswerText(value);
  if (!rawStr.trim()) return { earned: 0, status: 'empty', submittedText: '' };

  const norm = kind === 'clock' ? normalizeTime(rawStr) : normalize(rawStr);
  const accepted = part.accepted.map((a) => (kind === 'clock' ? normalizeTime(a) : normalize(a)));

  /* ---- Exact / accepted match ---- */
  if (accepted.includes(norm)) {
    return { earned: max, status: 'correct', submittedText: rawStr.trim() };
  }

  /* ---- Fix & cloze: accept the full corrected sentence containing the key word ---- */
  if (kind === 'fix' || kind === 'cloze') {
    for (const candidate of part.accepted) {
      if (containsWord(rawStr, normalize(candidate))) {
        return { earned: max, status: 'correct', submittedText: rawStr.trim() };
      }
    }
  }

  /* ---- Vocab: single-character typo tolerance for longer words ---- */
  if (kind === 'vocab') {
    for (const candidate of part.accepted) {
      const c = normalize(candidate);
      if (c.length >= 6 && Math.abs(c.length - norm.length) <= 1 && levenshtein(c, norm) <= 1) {
        return { earned: max, status: 'correct', submittedText: rawStr.trim() };
      }
    }
  }

  /* ---- Clock: half marks when the right hour is paired with "to" instead of "past" (or the reverse) ---- */
  if (kind === 'clock' && part.partialRule === 'time-to-past-swap') {
    const correctFull = normalizeTime(part.displayAnswer.replace(/^It’s\s+/i, '').replace(/^It's\s+/i, ''));
    const swap = (s: string) =>
      s.includes('quarter past') ? s.replace('quarter past', 'quarter to') : s.includes('quarter to') ? s.replace('quarter to', 'quarter past') : s;
    const swapped = swap(correctFull);
    if (swapped !== correctFull && norm === swapped) {
      return { earned: Math.floor(max / 2), status: 'partial', submittedText: rawStr.trim() };
    }
  }

  return { earned: 0, status: 'wrong', submittedText: rawStr.trim() };
}

/* ------------------------------------------------------------------ *
 *  Whole-exam grading                                                 *
 * ------------------------------------------------------------------ */

export function isPartComplete(part: ExamPart, kind: ExamQuestion['kind'], value: AnswerValue | undefined): boolean {
  if (kind === 'order') {
    return Array.isArray(value) && !!part.tokens && value.length === part.tokens.length;
  }
  return typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : false;
}

export function isQuestionComplete(question: ExamQuestion, answers: AnswerMap): boolean {
  return question.parts.every((part) => isPartComplete(part, question.kind, answers[part.id]));
}

export function completedQuestionCount(answers: AnswerMap): number {
  return QUESTIONS.filter((q) => isQuestionComplete(q, answers)).length;
}

export function allQuestionsComplete(answers: AnswerMap): boolean {
  return QUESTIONS.every((q) => isQuestionComplete(q, answers));
}

function gradeBand(percentage: number): string {
  if (percentage >= 90) return 'Excellent — outstanding work!';
  if (percentage >= 75) return 'Great job — well done!';
  if (percentage >= 60) return 'Good work — keep it up!';
  if (percentage >= 40) return 'Fair — review the lessons and try again.';
  return 'Keep practising — review Unit 1 and retake the exam.';
}

export function gradeExam(answers: AnswerMap, startedAt: number, submittedAt: number): ExamResult {
  const questions: QuestionResult[] = QUESTIONS.map((question) => {
    const parts: PartResult[] = question.parts.map((part) => {
      const value = answers[part.id];
      const grade = gradePart(part, value, question.kind);
      return {
        partId: part.id,
        prompt: part.arabic ? part.prompt : part.prompt,
        displayAnswer: part.displayAnswer,
        submitted: question.kind === 'order' ? orderAnswerText(part, value) : renderAnswerText(value),
        marks: part.marks,
        earned: grade.earned,
        status: grade.status,
      };
    });
    const earned = parts.reduce((s, p) => s + p.earned, 0);
    const max = question.marks;
    return { question, parts, earned, max, fullMarks: earned === max };
  });

  const totalEarned = questions.reduce((s, q) => s + q.earned, 0);
  const totalPossible = QUESTIONS.reduce((s, q) => s + q.marks, 0);
  const percentage = Math.round((totalEarned / totalPossible) * 1000) / 10;
  const perfectQuestions = questions.filter((q) => q.fullMarks).length;
  const completionSeconds = Math.max(0, Math.round((submittedAt - startedAt) / 1000));

  return {
    totalEarned,
    totalPossible,
    percentage,
    gradeBand: gradeBand(percentage),
    perfectQuestions,
    questions,
    startedAt,
    submittedAt,
    completionSeconds,
  };
}

/** Formats seconds as HH:MM:SS (count-up stopwatch). */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

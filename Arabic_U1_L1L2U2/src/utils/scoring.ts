import { QUESTIONS, subKey } from '../data/questions';
import { LESSON_ORDER } from '../data/sources/lessons';
import type { AnswerValue, Answers, LessonId, Question, Section, Subpart } from '../data/types';
import { normalizeArabic } from './normalize';

export type SubStatus = 'correct' | 'partial' | 'incorrect' | 'unanswered';

export interface SubResult {
  key: string;
  earned: number;
  max: number;
  status: SubStatus;
}

export interface ExamResult {
  total: number;
  max: number;
  percentage: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
  bySub: Record<string, SubResult>;
  byLesson: Record<LessonId, { grammar: number; grammarMax: number; spelling: number; spellingMax: number }>;
  bySection: Record<Section, { earned: number; max: number }>;
  level: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function isAnswered(sp: Subpart, v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false;
  switch (sp.kind) {
    case 'mcq':
      return typeof v === 'number';
    case 'multi':
      return Array.isArray(v) && v.length > 0;
    case 'text':
      return typeof v === 'string' && v.trim().length > 0;
    case 'group':
      return Array.isArray(v) && v.length === sp.items.length && (v as (number | null)[]).every((x) => x !== null && x !== undefined);
  }
}

/** Returns the fraction (0..1) of credit earned. */
export function creditFraction(sp: Subpart, v: AnswerValue | undefined): number {
  if (!isAnswered(sp, v)) return 0;
  switch (sp.kind) {
    case 'mcq':
      return v === sp.correct ? 1 : 0;
    case 'text': {
      const s = normalizeArabic(v as string);
      return sp.accepted.some((a) => normalizeArabic(a) === s) ? 1 : 0;
    }
    case 'multi': {
      const sel = v as number[];
      const right = sel.filter((i) => sp.correct.includes(i)).length;
      const wrong = sel.length - right;
      return Math.max(0, (right - wrong) / sp.correct.length);
    }
    case 'group': {
      const arr = v as number[];
      return sp.items.filter((it, i) => arr[i] === it.answer).length / sp.items.length;
    }
  }
}

export function scoreSub(sp: Subpart, v: AnswerValue | undefined, key: string): SubResult {
  const f = creditFraction(sp, v);
  const earned = round2(f * sp.marks);
  const status: SubStatus = !isAnswered(sp, v) ? 'unanswered' : f === 1 ? 'correct' : f > 0 ? 'partial' : 'incorrect';
  return { key, earned, max: sp.marks, status };
}

export function performanceLevel(pct: number): string {
  if (pct >= 90) return 'ممتاز';
  if (pct >= 80) return 'جيد جدًّا';
  if (pct >= 65) return 'جيد';
  if (pct >= 50) return 'مقبول';
  return 'يحتاج إلى دعم وتحسين';
}

export function scoreExam(answers: Answers, questions: Question[] = QUESTIONS): ExamResult {
  const bySub: Record<string, SubResult> = {};
  const byLesson = Object.fromEntries(
    LESSON_ORDER.map((l) => [l, { grammar: 0, grammarMax: 0, spelling: 0, spellingMax: 0 }]),
  ) as ExamResult['byLesson'];
  const bySection: ExamResult['bySection'] = { grammar: { earned: 0, max: 0 }, spelling: { earned: 0, max: 0 } };
  let total = 0, max = 0, correct = 0, partial = 0, incorrect = 0, unanswered = 0;

  for (const q of questions) {
    for (const sp of q.subparts) {
      const key = subKey(q, sp.id);
      const r = scoreSub(sp, answers[key], key);
      bySub[key] = r;
      total += r.earned;
      max += r.max;
      const bl = byLesson[q.lessonId];
      if (q.section === 'grammar') { bl.grammar += r.earned; bl.grammarMax += r.max; }
      else { bl.spelling += r.earned; bl.spellingMax += r.max; }
      bySection[q.section].earned += r.earned;
      bySection[q.section].max += r.max;
      if (r.status === 'correct') correct++;
      else if (r.status === 'partial') partial++;
      else if (r.status === 'incorrect') incorrect++;
      else unanswered++;
    }
  }
  total = round2(total);
  max = round2(max);
  const percentage = max ? round2((total / max) * 100) : 0;
  for (const l of LESSON_ORDER) {
    const b = byLesson[l];
    b.grammar = round2(b.grammar); b.spelling = round2(b.spelling);
  }
  bySection.grammar.earned = round2(bySection.grammar.earned);
  bySection.spelling.earned = round2(bySection.spelling.earned);
  return { total, max, percentage, correct, partial, incorrect, unanswered, bySub, byLesson, bySection, level: performanceLevel(percentage) };
}

export function allSubparts(questions: Question[] = QUESTIONS) {
  return questions.flatMap((q) => q.subparts.map((sp) => ({ q, sp, key: subKey(q, sp.id) })));
}

export function isQuestionComplete(q: Question, answers: Answers): boolean {
  return q.subparts.every((sp) => isAnswered(sp, answers[subKey(q, sp.id)]));
}

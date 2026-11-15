import { describe, expect, it } from 'vitest';
import { QUESTIONS, subKey } from '../data/questions';
import { LESSON_ORDER } from '../data/sources/lessons';
import type { Answers, Subpart } from '../data/types';
import { buildReport, reportFileName } from '../utils/report';
import { creditFraction, scoreExam } from '../utils/scoring';
import { normalizeArabic } from '../utils/normalize';
import { formatHMS } from '../utils/time';

function perfect(): Answers {
  const a: Answers = {};
  for (const q of QUESTIONS) for (const sp of q.subparts) {
    const k = subKey(q, sp.id);
    if (sp.kind === 'mcq') a[k] = sp.correct;
    else if (sp.kind === 'multi') a[k] = [...sp.correct];
    else if (sp.kind === 'text') a[k] = sp.accepted[0];
    else a[k] = sp.items.map((it) => it.answer);
  }
  return a;
}

describe('exam structure', () => {
  it('has exactly 30 main questions with unique ids', () => {
    expect(QUESTIONS).toHaveLength(30);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(30);
  });
  it('has 6 questions per lesson, balanced grammar/spelling', () => {
    for (const l of LESSON_ORDER) {
      const qs = QUESTIONS.filter((q) => q.lessonId === l);
      expect(qs).toHaveLength(6);
      expect(qs.filter((q) => q.section === 'grammar')).toHaveLength(3);
    }
  });
  it('has 65–85 independently assessable subparts', () => {
    const n = QUESTIONS.flatMap((q) => q.subparts).length;
    expect(n).toBeGreaterThanOrEqual(65);
    expect(n).toBeLessThanOrEqual(85);
  });
  it('total marks equal exactly 100', () => {
    const sum = QUESTIONS.flatMap((q) => q.subparts).reduce((s, sp) => s + sp.marks, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });
  it('difficulty distribution 9/14/7 (30/45/25%)', () => {
    const c = (d: string) => QUESTIONS.filter((q) => q.difficulty === d).length;
    expect([c('basic'), c('intermediate'), c('advanced')]).toEqual([9, 14, 7]);
  });
  it('mixes lesson order (no two consecutive questions from same lesson)', () => {
    for (let i = 1; i < QUESTIONS.length; i++) expect(QUESTIONS[i].lessonId).not.toBe(QUESTIONS[i - 1].lessonId);
  });
  it('valid answer indices', () => {
    for (const sp of QUESTIONS.flatMap((q) => q.subparts) as Subpart[]) {
      if (sp.kind === 'mcq') expect(sp.correct).toBeLessThan(sp.options.length);
      if (sp.kind === 'group') sp.items.forEach((it) => expect(it.answer).toBeLessThan(sp.choices.length));
    }
  });
});

describe('scoring', () => {
  it('perfect answers score 100', () => {
    const r = scoreExam(perfect());
    expect(r.total).toBe(100);
    expect(r.incorrect + r.partial + r.unanswered).toBe(0);
    expect(r.bySection.grammar.max + r.bySection.spelling.max).toBe(100);
  });
  it('empty answers score 0 and are all unanswered', () => {
    const r = scoreExam({});
    expect(r.total).toBe(0);
    expect(r.unanswered).toBe(QUESTIONS.flatMap((q) => q.subparts).length);
  });
  it('partial credit for group and multi', () => {
    const g = QUESTIONS.flatMap((q) => q.subparts).find((s) => s.kind === 'group' && s.items.length === 6)!;
    if (g.kind !== 'group') throw new Error();
    const half = g.items.map((it, i) => (i < 3 ? it.answer : (it.answer + 1) % g.choices.length));
    expect(creditFraction(g, half)).toBeCloseTo(0.5);
    const m = QUESTIONS.flatMap((q) => q.subparts).find((s) => s.kind === 'multi')!;
    if (m.kind !== 'multi') throw new Error();
    const wrong = m.options.map((_, i) => i).find((i) => !m.correct.includes(i))!;
    expect(creditFraction(m, [m.correct[0], m.correct[1]])).toBeCloseTo(2 / m.correct.length);
    expect(creditFraction(m, [m.correct[0], wrong])).toBe(0);
    expect(creditFraction(m, m.options.map((_, i) => i))).toBeLessThan(1);
  });
  it('text answers ignore tashkeel but enforce hamza spelling', () => {
    expect(normalizeArabic('أَقْبَلَ')).toBe('أقبل');
    expect(normalizeArabic('اقبل')).not.toBe('أقبل');
  });
  it('lesson breakdown sums to total', () => {
    const r = scoreExam(perfect());
    const s = LESSON_ORDER.reduce((acc, l) => acc + r.byLesson[l].grammar + r.byLesson[l].spelling, 0);
    expect(Math.round(s * 100) / 100).toBe(r.total);
  });
});

describe('report & timer', () => {
  it('formats HH:MM:SS', () => {
    expect(formatHMS(0)).toBe('00:00:00');
    expect(formatHMS(3723000)).toBe('01:02:03');
  });
  it('builds an Arabic UTF-8 report with all 30 questions', () => {
    const answers = perfect();
    const txt = buildReport({ studentName: 'سلمى أحمد', attemptId: 'X', submittedAt: Date.now(), elapsedMs: 65000, answers, result: scoreExam(answers) });
    expect(txt).toContain('سلمى أحمد');
    expect(txt).toContain('السؤال 30');
    expect(txt).toContain('00:01:05');
    expect(reportFileName('سلمى أحمد')).toBe('Arabic_Grade5_Grammar_Spelling_سلمى_أحمد.txt');
  });
});

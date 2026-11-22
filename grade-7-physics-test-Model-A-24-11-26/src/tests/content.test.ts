import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '../data/questions';
import { examMaxMarks, questionMaxMarks, regexFor } from '../lib/grading';
import { DT_SEGMENTS, distanceAt } from '../data/graph';
import type { Input } from '../types';

const EXPECTED_NUMBERS: Record<string, number> = {
  'q4a-4': 40,
  'q4c-2': 6,
  q5d: 40,
  q6b: 54,
  q6c: 15,
  q6d: 30,
  q8b: 30,
  q8c: 2,
  q8d: 10,
  q9b: 70,
  q9d: 25,
  q10d: 4,
};

function allInputs(): Input[] {
  return QUESTIONS.flatMap((q) => q.parts.flatMap((p) => p.inputs));
}

describe('بنية الاختبار', () => {
  it('يحتوي على 10 أسئلة بالضبط ومجموعها 100 علامة', () => {
    expect(QUESTIONS.length).toBe(10);
    expect(examMaxMarks(QUESTIONS)).toBe(100);
  });
  it('كل سؤال يساوي 10 علامات', () => {
    QUESTIONS.forEach((q) => expect(questionMaxMarks(q), `السؤال ${q.id}`).toBe(10));
  });
  it('يغطي الدرسين الأول والثاني فقط', () => {
    QUESTIONS.forEach((q) => expect([1, 2, 'both']).toContain(q.lesson));
    expect(QUESTIONS.some((q) => q.lesson === 1)).toBe(true);
    expect(QUESTIONS.some((q) => q.lesson === 2)).toBe(true);
  });
  it('المعرفات فريدة ولا يوجد تكرار', () => {
    const ids = allInputs().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUESTIONS.map((q) => q.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('كل أسئلة الاختيار تحتوي الإجابة ضمن الخيارات', () => {
    allInputs()
      .filter((i) => i.kind === 'choice')
      .forEach((i) => expect(i.options.some((o) => o.id === i.answer), i.id).toBe(true));
  });
  it('كل أعمدة التصنيف تحتوي الإجابة', () => {
    allInputs()
      .filter((i) => i.kind === 'matrix')
      .forEach((i) => i.rows.forEach((r) => expect(i.columns.some((c) => c.id === r.answer), `${i.id}/${r.id}`).toBe(true)));
  });
  it('وحدات الإجابة موجودة ضمن خيارات الوحدة', () => {
    const withUnit = allInputs().filter((i): i is Extract<Input, { kind: 'number' }> => i.kind === 'number' && !!i.unit);
    withUnit.forEach((i) => expect(i.unit?.options).toContain(i.unit?.answer));
  });
  it('كل أنماط التصحيح النصية تعمل كتعابير نمطية', () => {
    const patterns = allInputs().flatMap((i) => {
      if (i.kind === 'text') return [...(i.criteria ?? []).flatMap((c) => [...(c.any ?? []), ...(c.all ?? []), ...(c.none ?? [])])];
      if (i.kind === 'tf' && i.correction) return i.correction.criteria.flatMap((c) => [...(c.any ?? []), ...(c.all ?? []), ...(c.none ?? [])]);
      if (i.kind === 'number' && i.steps) return i.steps.all;
      return [];
    });
    expect(patterns.length).toBeGreaterThan(10);
    patterns.forEach((p) => expect(() => regexFor(p), p).not.toThrow());
  });
  it('لكل سؤال مرجع ومهارة وتفسير وموقف', () => {
    QUESTIONS.forEach((q) => {
      expect(q.pages.length).toBeGreaterThan(0);
      expect(q.skill.length).toBeGreaterThan(5);
      expect(q.explanation.length).toBeGreaterThan(20);
      expect(q.scenario.length).toBeGreaterThan(20);
    });
  });
});

describe('الاتساق الفيزيائي والحسابي', () => {
  it('القيم العددية في المفتاح صحيحة حسابياً', () => {
    const computed: Record<string, number> = {
      'q4a-4': 40,
      'q4c-2': 60 / 10,
      q5d: 4 * 10,
      q6b: 27 / 0.5,
      q6c: (27 / 0.5) / 3.6,
      q6d: 450 / ((27 / 0.5) / 3.6),
      q8b: 30,
      q8c: 5 - 3,
      q8d: 30 / 3,
      q9b: 7 * 10,
      q9d: 250 / 10,
      q10d: (3 * 4 + 5 * 4) / 8,
    };
    Object.entries(computed).forEach(([id, v]) => expect(EXPECTED_NUMBERS[id], id).toBeCloseTo(v, 6));
    allInputs()
      .filter((i) => i.kind === 'number')
      .forEach((i) => expect(EXPECTED_NUMBERS[i.id], i.id).toBeCloseTo(i.answer as number, 6));
  });
  it('مخطط المسافة والزمن متسق مع مفتاح الإجابة', () => {
    expect(distanceAt(0)).toBe(0);
    expect(distanceAt(3)).toBe(30);
    expect(distanceAt(5)).toBe(30);
    expect(distanceAt(9)).toBe(90);
    const incAB = [1, 2, 3].map((t) => distanceAt(t) - distanceAt(t - 1));
    expect(new Set(incAB).size).toBe(1);
    expect(distanceAt(4) - distanceAt(3)).toBe(0);
    const incCD = [6, 7, 8, 9].map((t) => distanceAt(t) - distanceAt(t - 1));
    expect(new Set(incCD).size).toBe(4);
    expect(incCD.every((v, i) => i === 0 || v > incCD[i - 1])).toBe(true);
    const q8 = QUESTIONS.find((q) => q.id === 8);
    const matrix = q8?.parts[0].inputs[0];
    expect(matrix?.kind).toBe('matrix');
    if (matrix && matrix.kind === 'matrix') {
      matrix.rows.forEach((r) => {
        const seg = DT_SEGMENTS.find((s) => s.id === r.id);
        expect(seg).toBeDefined();
        expect(r.answer).toBe(seg?.type);
      });
    }
  });
  it('جدول السؤال 5 يوافق التصنيف: (أ) منتظمة و(ب) غير منتظمة', () => {
    const q5 = QUESTIONS.find((q) => q.id === 5);
    const rows = q5?.table?.rows ?? [];
    const inc = (row: string[]) => [1, 2, 3].map((i) => Number(row[i + 1]) - Number(row[i]));
    expect(new Set(inc(rows[0])).size).toBe(1);
    expect(new Set(inc(rows[1])).size).toBe(3);
  });
});

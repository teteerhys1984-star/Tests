/**
 * Integrity checks for the exam definition.
 * Run with: npx vitest run
 */
import { describe, expect, it } from 'vitest';
import { ALL_PART_IDS, QUESTIONS, TOTAL_MARKS } from './exam';
import { gradeExam } from '../lib/grading';
import type { AnswerMap } from '../types';

const ARABIC = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const EXPECTED_ARABIC_PROMPTS = [
  // Question 1 — Lessons 1 & 2
  'اسم', 'طبيب', 'جد', 'أشقر', 'طويل القامة',
  // Question 2 — Lessons 3 & 4
  'الفطور', 'عادةً', 'ينهض من الفراش', 'غرفة نوم', 'خزانة ملابس',
  // Question 3 — Lessons 5 & 6
  'العلوم', 'مملّ', 'قرية', 'نهر', 'مزرعة',
];

describe('exam structure', () => {
  it('has exactly 12 numbered main questions, numbered 1–12 in order', () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(QUESTIONS.map((q) => q.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('has exactly 3 Vocabulary questions', () => {
    const vocab = QUESTIONS.filter((q) => q.kind === 'vocab');
    expect(vocab).toHaveLength(3);
    expect(vocab.map((q) => q.id)).toEqual([1, 2, 3]);
  });

  it('each Vocabulary question contains exactly 5 Arabic prompts, 2 marks each', () => {
    for (const q of QUESTIONS.filter((q) => q.kind === 'vocab')) {
      expect(q.parts).toHaveLength(5);
      for (const part of q.parts) {
        expect(part.arabic).toBe(true);
        expect(part.marks).toBe(2);
        expect(ARABIC.test(part.prompt)).toBe(true);
      }
    }
  });

  it('the 15 Arabic prompts match the repository Vocabulary sections exactly', () => {
    const all = QUESTIONS.filter((q) => q.kind === 'vocab').flatMap((q) => q.parts.map((p) => p.prompt));
    expect(all).toEqual(EXPECTED_ARABIC_PROMPTS);
  });

  it('contains NO Arabic characters anywhere except the 15 vocabulary prompts', () => {
    for (const q of QUESTIONS) {
      const nonPromptStrings: string[] = [q.title, q.skill, q.lessons, q.reference, q.instructions, q.explanation];
      for (const part of q.parts) {
        if (!part.arabic) nonPromptStrings.push(part.prompt);
        nonPromptStrings.push(
          part.reference,
          part.displayAnswer,
          part.before ?? '',
          part.after ?? '',
          part.hint ?? '',
          part.wrongWord ?? '',
          part.placeholder ?? '',
          ...(part.options ?? []),
          ...(part.tokens ?? []),
          ...(part.targetTokens ?? []),
          ...part.accepted,
        );
      }
      for (const s of nonPromptStrings) {
        expect(ARABIC.test(s), `Arabic found in student-facing string: ${s}`).toBe(false);
      }
    }
  });

  it('totals exactly 100 marks, and each question’s parts sum to its marks', () => {
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) {
      const sum = q.parts.reduce((s, p) => s + p.marks, 0);
      expect(sum, `Q${q.id} parts sum`).toBe(q.marks);
    }
    expect(QUESTIONS.reduce((s, q) => s + q.marks, 0)).toBe(100);
  });

  it('distributes marks: 30 for vocabulary, 70 for the remaining nine questions', () => {
    const vocab = QUESTIONS.filter((q) => q.kind === 'vocab').reduce((s, q) => s + q.marks, 0);
    const rest = QUESTIONS.filter((q) => q.kind !== 'vocab').reduce((s, q) => s + q.marks, 0);
    expect(vocab).toBe(30);
    expect(rest).toBe(70);
  });

  it('uses unique part ids', () => {
    expect(new Set(ALL_PART_IDS).size).toBe(ALL_PART_IDS.length);
  });

  it('anchors every question to Unit 1 lessons 1–6', () => {
    for (const q of QUESTIONS) {
      expect(q.reference).toMatch(/Lesson [1-6]/);
      expect(q.explanation.length).toBeGreaterThan(40);
    }
  });
});

describe('grading engine', () => {
  const perfectAnswers = (): AnswerMap => {
    const map: AnswerMap = {};
    for (const q of QUESTIONS) {
      for (const part of q.parts) {
        if (q.kind === 'order') {
          map[part.id] = part.targetTokens!.map((t) => part.tokens!.indexOf(t));
        } else {
          map[part.id] = part.accepted[0];
        }
      }
    }
    return map;
  };

  it('awards 100/100 for a perfect paper', () => {
    const result = gradeExam(perfectAnswers(), 1_000, 1_000 + 42 * 60_000);
    expect(result.totalEarned).toBe(100);
    expect(result.percentage).toBe(100);
    expect(result.perfectQuestions).toBe(12);
    expect(result.completionSeconds).toBe(42 * 60);
  });

  it('awards 0 for an empty paper', () => {
    const result = gradeExam({}, 1_000, 2_000);
    expect(result.totalEarned).toBe(0);
    expect(result.perfectQuestions).toBe(0);
  });

  it('gives half marks for a "to/past" swap on clock quarters, nothing otherwise', () => {
    const base = perfectAnswers();
    // Q8 item 2 is "quarter past seven" — swapped means "quarter to seven" → 1/2 marks.
    base['q8p2'] = 'quarter to seven';
    const result = gradeExam(base, 1_000, 2_000);
    const q8 = result.questions.find((q) => q.question.id === 8)!;
    expect(q8.earned).toBe(9); // 2 + 1 + 2 + 2 + 2
    // o'clock items cannot earn partial credit
    const base2 = perfectAnswers();
    base2['q8p3'] = 'quarter past three';
    const result2 = gradeExam(base2, 1_000, 2_000);
    expect(result2.questions.find((q) => q.question.id === 8)!.earned).toBe(8);
  });

  it('gives partial credit when all ordering words are present but out of sequence', () => {
    const base = perfectAnswers();
    base['q10p1'] = [0, 1, 2]; // "isn't History boring" — right words, wrong order
    const result = gradeExam(base, 1_000, 2_000);
    const q10 = result.questions.find((q) => q.question.id === 10)!;
    expect(q10.earned).toBe(7); // 2 partial + 5 full
  });

  it('accepts a full corrected sentence for fix-style questions', () => {
    const base = perfectAnswers();
    base['q12p1'] = 'She is my friend.';
    const result = gradeExam(base, 1_000, 2_000);
    expect(result.questions.find((q) => q.question.id === 12)!.earned).toBe(10);
  });

  it('tolerates a single-character typo in longer vocabulary words only', () => {
    const base = perfectAnswers();
    base['q1p3'] = 'grandfather'.replace('f', 'v'); // 1-char typo in "grandfather" → accepted
    base['q1p1'] = 'mame'; // 4 letters, exact-only → rejected
    const result = gradeExam(base, 1_000, 2_000);
    expect(result.questions.find((q) => q.question.id === 1)!.earned).toBe(8); // 0 for q1p1, full elsewhere
  });
});

/**
 * Version-B source parity — compares the published exam data with the original
 * Version B source upload in the repository root
 * (`grade-4-english-curriculum-exam-L1-5-B`).
 *
 * The exam is standalone, but its curriculum content must be the source content:
 * questions, options, answers, accepted answers, marks, order, passages, lesson
 * metadata and source references. Nothing is inherited from Version A.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXAM_ID, EXAM_TITLE, ATTEMPT_STORAGE_KEY, PENDING_PREFIX, SENT_RECEIPT_PREFIX } from '../config';
import {
  CURRICULUM_PASSAGES,
  LESSON_METADATA,
  TOTAL_EXAM_MARKS,
  TOTAL_MAIN_QUESTIONS,
} from '../data/passages';
import { ALL_CURRICULUM_QUESTIONS, EXAM_QUESTIONS, MIXED_EXAM_ORDER_IDS } from '../data/questions';
import type { ExamQuestion } from '../types/exam';

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_ROOT = path.resolve(ROOT, '..', 'grade-4-english-curriculum-exam-L1-5-B');
/** Built at runtime so this assertion never matches its own literal. */
const VERSION_A_FOLDER = ['grade4', 'english', 'curriculum', 'exam', 'l1', '5', 'a'].join('-');
const VERSION_A_STATE_KEY = ['grade4', 'unit1', 'lessons1', '5', 'exam', 'state', 'v1'].join('_');

/** Very small, dependency-free reader for the `export const X = <literal>` shape. */
function readSourceLiteral(file: string, exportName: string): string {
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf(`export const ${exportName}`);
  if (start < 0) throw new Error(`Missing ${exportName} in ${file}`);
  // The source files are hand-written literals ending with a top-level `];`
  // or `};` followed by a blank line / EOF.
  const rest = text.slice(start);
  const endArray = rest.indexOf('\n];');
  const endObject = rest.indexOf('\n};');
  const candidates = [endArray, endObject].filter((n) => n >= 0);
  if (candidates.length === 0) throw new Error(`Unterminated ${exportName} in ${file}`);
  // Exclude the terminator itself: `evaluateLiteral` re-adds the JSX-free value.
  return rest.slice(0, Math.min(...candidates));
}

/** Evaluates a source literal (TypeScript object syntax is valid JS here). */
function evaluateLiteral(source: string): unknown {
  const body = source.replace(/^export const \w+[^=]*=\s*/, '');
  const closer = body.trimStart().startsWith('[') ? ']' : '}';
  // eslint-disable-next-line no-new-func
  return new Function(`return (${body}${closer});`)();
}

function sourceQuestions(): ExamQuestion[] {
  const l1to3 = evaluateLiteral(
    readSourceLiteral(path.join(SOURCE_ROOT, 'src/data/questionsL1toL3.ts'), 'QUESTIONS_L1_TO_L3')
  ) as ExamQuestion[];
  const l4to5 = evaluateLiteral(
    readSourceLiteral(path.join(SOURCE_ROOT, 'src/data/questionsL4toL5.ts'), 'QUESTIONS_L4_TO_L5')
  ) as ExamQuestion[];
  return [...l1to3, ...l4to5];
}

function sourceOrder(): string[] {
  const file = path.join(SOURCE_ROOT, 'src/data/questions.ts');
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('export const MIXED_EXAM_ORDER_IDS');
  const end = text.indexOf('];', start);
  const block = text.slice(start, end);
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

describe('Version B — identity is independent from Version A', () => {
  it('uses the required exam id, title, folder and storage keys', () => {
    expect(EXAM_ID).toBe('grade4-english-curriculum-exam-l1-5-b');
    expect(EXAM_TITLE).toBe('Grade 4 English Curriculum Exam L1-5 B');
    expect(path.basename(ROOT)).toBe(EXAM_ID);

    expect(ATTEMPT_STORAGE_KEY).toBe('grade4-english-curriculum-exam-l1-5-b-attempt-v1');
    expect(PENDING_PREFIX).toBe('pending:grade4-english-curriculum-exam-l1-5-b:');
    expect(SENT_RECEIPT_PREFIX).toBe('sent:grade4-english-curriculum-exam-l1-5-b:');

    // Never leaking Version A identifiers into Version B.
    const ownSources = ['src/config.ts', 'src/App.tsx', 'src/utils/submit.ts', 'src/utils/storage.ts']
      .map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8'))
      .join('\n');
    expect(ownSources).not.toContain(VERSION_A_FOLDER);
    expect(ownSources).not.toContain(VERSION_A_STATE_KEY);
  });

  it('does not import anything from Version A or from the source folder', () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(ts|tsx|css|html)$/.test(entry.name)) out.push(full);
      }
      return out;
    };
    for (const file of walk(path.join(ROOT, 'src'))) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text, file).not.toContain(VERSION_A_FOLDER);
      // No runtime import may point at the source upload; only this parity
      // test reads it, and only from tests.
      for (const match of text.matchAll(/(?:from|import)\s+'([^']+)'/g)) {
        expect(match[1], file).not.toMatch(/grade-4-english-curriculum-exam/);
        expect(match[1], file).not.toContain(VERSION_A_FOLDER);
      }
    }
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).not.toContain(VERSION_A_FOLDER);
  });
});

describe('Version B — content parity with the original source upload', () => {
  it('has exactly the same 50 questions, in the same bank order', () => {
    const source = sourceQuestions();
    expect(source).toHaveLength(50);
    expect(ALL_CURRICULUM_QUESTIONS.map((q) => q.id)).toEqual(source.map((q) => q.id));
  });

  it('presents the exam in exactly the source order', () => {
    expect([...MIXED_EXAM_ORDER_IDS]).toEqual(sourceOrder());
    expect(EXAM_QUESTIONS.map((q) => q.id)).toEqual(sourceOrder());
  });

  it('preserves every question object verbatim', () => {
    const source = sourceQuestions();
    for (const original of source) {
      const published = ALL_CURRICULUM_QUESTIONS.find((q) => q.id === original.id);
      expect(published, original.id).toBeDefined();
      expect(published, original.id).toEqual(original);
    }
  });

  it('preserves passages, lesson metadata and constants verbatim', () => {
    const sourcePassages = evaluateLiteral(
      readSourceLiteral(path.join(SOURCE_ROOT, 'src/data/passages.ts'), 'CURRICULUM_PASSAGES')
    );
    expect(CURRICULUM_PASSAGES).toEqual(sourcePassages);

    const sourceLessons = evaluateLiteral(
      readSourceLiteral(path.join(SOURCE_ROOT, 'src/data/passages.ts'), 'LESSON_METADATA')
    );
    expect(LESSON_METADATA).toEqual(sourceLessons);

    expect(TOTAL_MAIN_QUESTIONS).toBe(50);
    expect(TOTAL_EXAM_MARKS).toBe(100);
  });

  it('counts marks from the source itself: 50 questions, 100 marks, 10 per lesson', () => {
    const source = sourceQuestions();
    const sourceTotal = source.reduce((sum, q) => sum + q.marks, 0);
    expect(sourceTotal).toBe(100);
    expect(EXAM_QUESTIONS.reduce((sum, q) => sum + q.marks, 0)).toBe(100);
    for (const lesson of [1, 2, 3, 4, 5] as const) {
      const inSource = source.filter((q) => q.lesson === lesson);
      expect(inSource).toHaveLength(10);
      expect(inSource.reduce((sum, q) => sum + q.marks, 0)).toBe(20);
      expect(EXAM_QUESTIONS.filter((q) => q.lesson === lesson)).toHaveLength(10);
    }
    for (const meta of LESSON_METADATA) {
      expect(meta.questionCount).toBe(10);
      expect(meta.maxMarks).toBe(20);
    }
  });

  it('keeps the Version B question bank independent from the Version A bank', () => {
    const versionABank = path.join(ROOT, '..', VERSION_A_FOLDER, 'src', 'examData.ts');
    // Version A ships its own bank at src/examData.ts; assert it is really there so
    // this comparison can never silently pass by skipping.
    expect(fs.existsSync(versionABank), versionABank).toBe(true);
    const versionAText = fs.readFileSync(versionABank, 'utf8');
    // Version A uses its own ids (`l1-01` …). Version B keeps its own ids.
    for (const id of EXAM_QUESTIONS.map((q) => q.id)) {
      expect(versionAText).not.toContain(`id: '${id}'`);
    }
    // No accepted-answer list from Version B may be lifted from Version A data.
    const versionAPrompts = new Set(
      [...versionAText.matchAll(/prompt: '((?:[^'\\]|\\.){25,})'/g)].map((m) => m[1])
    );
    expect(versionAPrompts.size).toBeGreaterThan(0);
    let shared = 0;
    for (const question of EXAM_QUESTIONS) {
      for (const subPart of question.subParts) {
        if (versionAPrompts.has(subPart.prompt)) shared += 1;
      }
    }
    // The two versions are independent documents; verbatim prompt reuse across
    // 50 source questions must be occasional, never a copied bank.
    expect(shared).toBeLessThan(10);
  });
});

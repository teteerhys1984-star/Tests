import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEACHER_KEY_PASSWORD } from '../components/TeacherKeyPage';
import {
  CURRICULUM_PASSAGES,
  EXAM_TITLE,
  LESSON_METADATA,
  MARKS_PER_QUESTION,
  TOTAL_EXAM_MARKS,
  TOTAL_MAIN_QUESTIONS,
} from '../data/passages';
import {
  ALL_CURRICULUM_QUESTIONS,
  EXAM_QUESTIONS,
  MIXED_EXAM_ORDER_IDS,
} from '../data/questions';
import { ExamQuestion, PersistedExamState, QuestionSubPart, StudentAnswerMap } from '../types/exam';
import { buildReportFilename, generateTxtReport } from '../utils/report';
import {
  buildReorderSentence,
  evaluateExam,
  getCompletionSummary,
  makeSubPartKey,
  normalizeText,
} from '../utils/scoring';
import {
  EXAM_STORAGE_KEY,
  formatStopwatch,
  loadExamState,
  resetForNewAttempt,
  saveExamState,
} from '../utils/storage';

/** Finds the exact index permutation of scrambledWords matching correctAnswer. */
function solveReorderIndices(sp: QuestionSubPart): number[] {
  const words = sp.scrambledWords ?? [];
  const target = sp.correctAnswer.slice(0, -1); // strip trailing '.' or '?'
  const used = new Set<number>();
  const result: number[] = [];

  function backtrack(current: string): boolean {
    if (result.length === words.length) {
      return current === target;
    }
    for (let i = 0; i < words.length; i++) {
      if (used.has(i)) continue;
      const nextStr = current.length === 0 ? words[i] : `${current} ${words[i]}`;
      if (target.startsWith(nextStr)) {
        used.add(i);
        result.push(i);
        if (backtrack(nextStr)) return true;
        result.pop();
        used.delete(i);
      }
    }
    return false;
  }

  const solved = backtrack('');
  if (!solved) {
    throw new Error(`Could not solve reorder sub-part ${sp.id}: "${sp.correctAnswer}"`);
  }
  return result;
}

function buildPerfectAnswers(questions: ExamQuestion[] = EXAM_QUESTIONS): StudentAnswerMap {
  const answers: StudentAnswerMap = {};
  for (const q of questions) {
    for (const sp of q.subParts) {
      const key = makeSubPartKey(q.id, sp.id);
      if (sp.inputKind === 'reorder') {
        answers[key] = solveReorderIndices(sp);
      } else {
        answers[key] = sp.correctAnswer;
      }
    }
  }
  return answers;
}

function buildAllWrongAnswers(questions: ExamQuestion[] = EXAM_QUESTIONS): StudentAnswerMap {
  const answers: StudentAnswerMap = {};
  for (const q of questions) {
    for (const sp of q.subParts) {
      const key = makeSubPartKey(q.id, sp.id);
      if (sp.inputKind === 'reorder') {
        const correct = solveReorderIndices(sp);
        const reversed = correct.slice().reverse();
        answers[key] = reversed;
      } else if (sp.options && sp.options.length > 0) {
        const wrong = sp.options.find((o) => o !== sp.correctAnswer);
        if (!wrong) throw new Error(`No wrong option found for ${key}`);
        answers[key] = wrong;
      } else {
        answers[key] = 'wronganswerxyz';
      }
    }
  }
  return answers;
}

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(k: string) {
      return map.has(k) ? map.get(k)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(k: string) {
      map.delete(k);
    },
    setItem(k: string, v: string) {
      map.set(k, v);
    },
  };
}

describe('Grade 4 English Exam — Structure & Lesson Distribution', () => {
  it('contains strictly 50 unique main questions', () => {
    expect(TOTAL_MAIN_QUESTIONS).toBe(50);
    expect(ALL_CURRICULUM_QUESTIONS).toHaveLength(50);
    expect(MIXED_EXAM_ORDER_IDS).toHaveLength(50);
    expect(EXAM_QUESTIONS).toHaveLength(50);

    const uniqueIds = new Set(EXAM_QUESTIONS.map((q) => q.id));
    expect(uniqueIds.size).toBe(50);
  });

  it('contains strictly 10 questions for each of Lessons 1, 2, 3, 4 and 5', () => {
    for (const lesson of [1, 2, 3, 4, 5] as const) {
      const inBank = ALL_CURRICULUM_QUESTIONS.filter((q) => q.lesson === lesson);
      const inExam = EXAM_QUESTIONS.filter((q) => q.lesson === lesson);
      expect(inBank).toHaveLength(10);
      expect(inExam).toHaveLength(10);
    }
  });

  it('mixes question order across lessons rather than following lesson sequence', () => {
    // Every block of 10 questions should include all 5 lessons
    for (let block = 0; block < 5; block++) {
      const slice = EXAM_QUESTIONS.slice(block * 10, (block + 1) * 10);
      const lessonsInBlock = new Set(slice.map((q) => q.lesson));
      expect(lessonsInBlock.size).toBe(5);
    }
    // No two adjacent questions come from the same lesson
    for (let i = 1; i < EXAM_QUESTIONS.length; i++) {
      expect(EXAM_QUESTIONS[i].lesson).not.toBe(EXAM_QUESTIONS[i - 1].lesson);
    }
  });

  it('allocates strictly 2 marks per main question, 20 per lesson, and 100 marks total', () => {
    expect(MARKS_PER_QUESTION).toBe(2);
    expect(TOTAL_EXAM_MARKS).toBe(100);

    let examTotal = 0;
    for (const q of EXAM_QUESTIONS) {
      expect(q.marks).toBe(2);
      expect(q.subParts.length).toBeGreaterThanOrEqual(1);
      const subSum = q.subParts.reduce((sum, sp) => {
        expect(sp.marks).toBeGreaterThan(0);
        return sum + sp.marks;
      }, 0);
      expect(subSum).toBe(2);
      examTotal += q.marks;
    }
    expect(examTotal).toBe(100);

    for (const meta of LESSON_METADATA) {
      const lessonSum = EXAM_QUESTIONS.filter((q) => q.lesson === meta.number).reduce(
        (sum, q) => sum + q.marks,
        0
      );
      expect(lessonSum).toBe(20);
    }
  });

  it('includes a complete internal source reference on every question', () => {
    for (const q of EXAM_QUESTIONS) {
      expect(q.source.lesson).toBe(q.lesson);
      expect(q.source.lessonTitle.length).toBeGreaterThan(0);
      expect(["Pupil's Book", 'Workbook']).toContain(q.source.book);
      expect(q.source.page.length).toBeGreaterThan(0);
      expect(q.source.exercise.length).toBeGreaterThan(0);
    }
  });
});

describe('Curriculum Fidelity, Passages & Policy Compliance', () => {
  it('preserves all required genuine Grade 4 Unit 1 reading passages verbatim', () => {
    expect(CURRICULUM_PASSAGES['ahmed-l1-pb4'].paragraphs.join(' ')).toMatch(
      /^Hello my friends, I’m Ahmed\./
    );
    expect(CURRICULUM_PASSAGES['sanaa-l2-pb7'].paragraphs[0]).toMatch(
      /^Hi, I am Sanaa from Lattakia\./
    );
    expect(CURRICULUM_PASSAGES['dan-l3-pb10'].paragraphs[0]).toMatch(
      /^Dan is an English boy\./
    );
    expect(CURRICULUM_PASSAGES['dream-house-l4-pb13'].paragraphs[0]).toMatch(
      /^My dream house is very big\./
    );
    expect(CURRICULUM_PASSAGES['ali-l5-pb16'].paragraphs[0]).toMatch(
      /^Hello, I’m Ali\. I’m going to tell you about my school subjects\./
    );
    expect(CURRICULUM_PASSAGES['bill-l5-pb18'].paragraphs[0]).toMatch(
      /^Hello! I am Bill\. I am 11 years old\./
    );
  });

  it('excludes unverified items, narrator-name mismatches, listening tasks, and Vocabulary sections', () => {
    const serialized = JSON.stringify({ EXAM_QUESTIONS, CURRICULUM_PASSAGES });
    expect(serialized).not.toMatch(/Linda/);
    expect(serialized).not.toMatch(/has lunch at home/i);
    expect(serialized).not.toMatch(/goes early to bed/i);
    expect(serialized).not.toMatch(/Vocabulary Section/i);
    expect(serialized).not.toMatch(/Listen and/i);
    expect(serialized).not.toMatch(/Date of Birth|Thumb Print/i);

    // Zero Arabic characters anywhere in exam questions or passages
    const arabicRegex = /[\u0600-\u06FF]/;
    expect(arabicRegex.test(serialized)).toBe(false);
  });

  it('contains exact WhatsApp footer details and zero project-ZIP links in UI source', () => {
    const srcRoot = path.resolve(__dirname, '..');
    const footerContent = fs.readFileSync(
      path.join(srcRoot, 'components', 'ContactFooter.tsx'),
      'utf8'
    );
    expect(footerContent).toContain('المهندس سومر شاهين');
    expect(footerContent).toContain('0930215022');
    expect(footerContent).toContain('https://wa.me/963930215022');

    // Check every non-test file in src/ and index.html for zero .zip references and no stray Arabic
    const uiFiles: string[] = [path.resolve(srcRoot, '..', 'index.html')];
    const collect = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__') collect(full);
        } else if (/\.(ts|tsx|html|css)$/.test(entry.name)) {
          uiFiles.push(full);
        }
      }
    };
    collect(srcRoot);

    const arabicRegex = /[\u0600-\u06FF]/;
    for (const file of uiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\.zip\b/i);
      if (!file.endsWith('ContactFooter.tsx')) {
        expect(arabicRegex.test(content)).toBe(false);
      }
    }
  });
});

describe('Answer Key Correctness, Grading & Completion Rules', () => {
  it('verifies every sub-part option list and reorder word bank produces the exact answer key', () => {
    for (const q of EXAM_QUESTIONS) {
      for (const sp of q.subParts) {
        if (sp.inputKind === 'choice' || sp.inputKind === 'true-false' || sp.inputKind === 'select') {
          expect(sp.options).toBeDefined();
          expect(sp.options).toContain(sp.correctAnswer);
        }
        if (sp.inputKind === 'reorder') {
          const indices = solveReorderIndices(sp);
          const built = buildReorderSentence(sp, indices);
          expect(normalizeText(built)).toBe(normalizeText(sp.correctAnswer));
        }
      }
    }
  });

  it('scores 100 / 100 marks when all 50 answer-key responses are submitted', () => {
    const perfect = buildPerfectAnswers();
    const completion = getCompletionSummary(perfect, EXAM_QUESTIONS);
    expect(completion.allComplete).toBe(true);
    expect(completion.answeredQuestions).toBe(50);

    const result = evaluateExam({
      studentName: 'Sara Ahmad',
      answers: perfect,
      elapsedMs: 1245000,
      submittedAtIso: '2026-05-10T09:30:00.000Z',
    });

    expect(result.totalEarnedMarks).toBe(100);
    expect(result.totalMaxMarks).toBe(100);
    expect(result.correctQuestionCount).toBe(50);
    expect(result.incorrectQuestionCount).toBe(0);
    expect(result.partialQuestionCount).toBe(0);
    for (const ls of result.lessonScores) {
      expect(ls.earnedMarks).toBe(20);
      expect(ls.maxMarks).toBe(20);
      expect(ls.fullyCorrectCount).toBe(10);
    }
  });

  it('scores 0 / 100 marks when every sub-part is answered incorrectly', () => {
    const allWrong = buildAllWrongAnswers();
    expect(getCompletionSummary(allWrong, EXAM_QUESTIONS).allComplete).toBe(true);

    const result = evaluateExam({
      studentName: 'Test Pupil',
      answers: allWrong,
      elapsedMs: 600000,
      submittedAtIso: '2026-05-10T10:00:00.000Z',
    });

    expect(result.totalEarnedMarks).toBe(0);
    expect(result.correctQuestionCount).toBe(0);
    expect(result.incorrectQuestionCount).toBe(50);
  });

  it('handles partial sub-part marks and accepted typed equivalents accurately', () => {
    const answers = buildPerfectAnswers();
    // Accept "mum" in John's Family table (l2-q7::b) and case-insensitive "LIZA" (l2-q7::a)
    answers[makeSubPartKey('l2-q7', 'a')] = '  LIZA ';
    answers[makeSubPartKey('l2-q7', 'b')] = 'mum';
    // Make one 0.5-mark sub-part wrong in l1-q4::a -> score becomes 99.5 / 100
    answers[makeSubPartKey('l1-q4', 'a')] = 'is';

    const result = evaluateExam({
      studentName: 'Omar',
      answers,
      elapsedMs: 900000,
      submittedAtIso: '2026-05-10T11:00:00.000Z',
    });

    expect(result.totalEarnedMarks).toBe(99.5);
    expect(result.correctQuestionCount).toBe(49);
    expect(result.incorrectQuestionCount).toBe(1);
    expect(result.partialQuestionCount).toBe(1);
  });

  it('keeps exam incomplete until every single question and sub-part is answered', () => {
    const answers = buildPerfectAnswers();
    delete answers[makeSubPartKey('l5-q6', 'd')];
    expect(getCompletionSummary(answers, EXAM_QUESTIONS).allComplete).toBe(false);

    // Whitespace-only text does not count as answered
    answers[makeSubPartKey('l5-q6', 'd')] = '   ';
    expect(getCompletionSummary(answers, EXAM_QUESTIONS).allComplete).toBe(false);

    // Partial reorder does not count as answered
    answers[makeSubPartKey('l5-q6', 'd')] = 'is';
    answers[makeSubPartKey('l1-q5', 'a')] = [1, 4];
    expect(getCompletionSummary(answers, EXAM_QUESTIONS).allComplete).toBe(false);

    // Restoring full reorder completes the exam
    const q = EXAM_QUESTIONS.find((item) => item.id === 'l1-q5')!;
    answers[makeSubPartKey('l1-q5', 'a')] = solveReorderIndices(q.subParts[0]);
    expect(getCompletionSummary(answers, EXAM_QUESTIONS).allComplete).toBe(true);
  });

  it('uses the required Teacher Answer Key password', () => {
    expect(TEACHER_KEY_PASSWORD).toBe('somer173');
  });
});

describe('TXT Report Generation & Persistence Recovery', () => {
  it('generates a complete UTF-8 TXT report with all 50 questions, scores, and source references', () => {
    expect(buildReportFilename('Sara Ahmad')).toBe('Grade4_English_Exam_Sara_Ahmad.txt');

    const evaluation = evaluateExam({
      studentName: 'Sara Ahmad',
      answers: buildPerfectAnswers(),
      elapsedMs: 3725000, // 01:02:05
      submittedAtIso: '2026-05-12T08:15:30.000Z',
    });

    const txt = generateTxtReport(evaluation);
    expect(txt).toContain(EXAM_TITLE.toUpperCase());
    expect(txt).toContain('Student Name        : Sara Ahmad');
    expect(txt).toContain('Grade               : Grade 4');
    expect(txt).toContain('Time Taken          : 01:02:05');
    expect(txt).toContain('Total Score         : 100 / 100 (100%)');
    expect(txt).toContain('Lesson 1 — Nice to Meet You!');
    expect(txt).toContain('Lesson 2 — My Family');
    expect(txt).toContain('Lesson 3 — Daily Routine');
    expect(txt).toContain('Lesson 4 — My House');
    expect(txt).toContain('Lesson 5 — School Subjects / Revision 1');

    for (let n = 1; n <= 50; n++) {
      expect(txt).toContain(`Question ${n} [`);
    }
    expect(txt).toContain('Student Answer :');
    expect(txt).toContain('Correct Answer :');
    expect(txt).toContain('Marks Earned   :');
    expect(txt).toContain('Source Reference :');
  });

  it('formats stopwatch accurately and recovers active exam state without resetting', () => {
    expect(formatStopwatch(0)).toBe('00:00:00');
    expect(formatStopwatch(59_000)).toBe('00:00:59');
    expect(formatStopwatch(867_000)).toBe('00:14:27');
    expect(formatStopwatch(3_909_000)).toBe('01:05:09');

    const mem = createMemoryStorage();
    const startTs = Date.now() - 120_000;
    const saved: PersistedExamState = {
      version: 1,
      phase: 'active',
      studentName: 'Rami',
      currentQuestionIndex: 17,
      answers: { 'l1-q4::a': 'are' },
      startedAtTimestamp: startTs,
      elapsedMs: 50_000,
      submittedAtIso: null,
      muted: true,
    };
    saveExamState(saved, mem);
    expect(mem.getItem(EXAM_STORAGE_KEY)).toBeTruthy();

    const restored = loadExamState(mem);
    expect(restored.phase).toBe('active');
    expect(restored.studentName).toBe('Rami');
    expect(restored.currentQuestionIndex).toBe(17);
    expect(restored.answers['l1-q4::a']).toBe('are');
    expect(restored.elapsedMs).toBeGreaterThanOrEqual(119_000);
    expect(restored.muted).toBe(true);

    const reset = resetForNewAttempt(restored.muted, mem);
    expect(reset.phase).toBe('welcome');
    expect(reset.studentName).toBe('');
    expect(reset.answers).toEqual({});
    expect(reset.muted).toBe(true);
  });
});

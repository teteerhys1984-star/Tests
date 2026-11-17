/**
 * Google Sheets delivery contract — Mock Fetch ONLY.
 *
 * Every fetch in this file is injected. No test performs a real network call,
 * so no student data can ever reach the live Apps Script endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  isPending,
  pendingKey,
  percentageOf,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type StorageLike,
  type SubmissionPayload,
} from '../utils/submit';
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../config';
import { EXAM_QUESTIONS } from '../data/questions';
import { evaluateExam, makeSubPartKey } from '../utils/scoring';
import { generateTxtReport } from '../utils/report';

function memoryStorage(): StorageLike & { dump(): Record<string, string> } {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    dump: () => Object.fromEntries(map),
  };
}

/** Solves the exact index permutation for a reorder sub-part. */
function solveReorder(sp: { scrambledWords?: string[]; correctAnswer: string }): number[] {
  const words = sp.scrambledWords ?? [];
  const target = sp.correctAnswer.replace(/[.?]$/, '');
  const used = new Set<number>();
  const path: number[] = [];
  const dfs = (current: string): boolean => {
    if (current === target) return true;
    for (let i = 0; i < words.length; i++) {
      if (used.has(i)) continue;
      const next = current ? `${current} ${words[i]}` : words[i];
      if (target === next || target.startsWith(`${next} `)) {
        used.add(i);
        path.push(i);
        if (dfs(next)) return true;
        path.pop();
        used.delete(i);
      }
    }
    return false;
  };
  dfs('');
  return path;
}

function perfectAnswers() {
  const answers: Record<string, string | number[]> = {};
  for (const q of EXAM_QUESTIONS) {
    for (const sp of q.subParts) {
      answers[makeSubPartKey(q.id, sp.id)] =
        sp.inputKind === 'reorder' ? solveReorder(sp) : sp.correctAnswer;
    }
  }
  return answers;
}

function evaluationFor(answers: Record<string, string | number[]>) {
  return evaluateExam({
    studentName: 'Parity Pupil',
    answers,
    elapsedMs: 1_845_000,
    submittedAtIso: '2026-11-17T09:30:00.000Z',
  });
}

const ATTEMPT = {
  attemptId: 'attempt-b-0001',
  startedAtIso: '2026-11-17T09:00:00.000Z',
};

function fullPayload(): SubmissionPayload {
  return buildPayload(evaluationFor(perfectAnswers()), ATTEMPT);
}

/** Recording mock fetch. */
function mockFetch(replies: Array<(body: string) => Promise<string> | string>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let index = 0;
  const impl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    return { text: async () => reply(String(init.body)) };
  };
  return { impl, calls };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('payload — full reference contract', () => {
  it('exposes exactly the reference top-level and nested fields', () => {
    const payload = fullPayload();
    expect(Object.keys(payload).sort()).toEqual(
      [
        'token',
        'attemptId',
        'examId',
        'examTitle',
        'studentName',
        'startAt',
        'submitAt',
        'elapsedSec',
        'summary',
        'lessons',
        'details',
        'reportText',
      ].sort()
    );
    expect(Object.keys(payload.summary).sort()).toEqual(
      [
        'total',
        'max',
        'percentage',
        'gradeLabel',
        'fullQuestions',
        'partialQuestions',
        'wrongQuestions',
        'correctSubparts',
        'partialSubparts',
        'wrongSubparts',
        'unansweredSubparts',
      ].sort()
    );
    for (const lesson of payload.lessons) {
      expect(Object.keys(lesson).sort()).toEqual(['awarded', 'max', 'title']);
    }
    for (const detail of payload.details) {
      expect(Object.keys(detail).sort()).toEqual(
        [
          'q',
          'qTitle',
          'lessons',
          'label',
          'status',
          'awarded',
          'marks',
          'studentAnswer',
          'correctAnswer',
        ].sort()
      );
    }
  });

  it('uses the Version B identity and the platform token, never Version A', () => {
    const payload = fullPayload();
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examId).toBe('grade4-english-curriculum-exam-l1-5-b');
    expect(payload.examTitle).toBe('Grade 4 English Curriculum Exam L1-5 B');
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.attemptId).toBe(ATTEMPT.attemptId);
    expect(payload.startAt).toBe(ATTEMPT.startedAtIso);
    expect(payload.submitAt).toBe('2026-11-17T09:30:00.000Z');
    expect(payload.elapsedSec).toBe(1845);
    expect(JSON.stringify(payload)).not.toMatch(/l1-5-a/);
  });

  it('carries attempt, result, question and lesson data for all 50 questions', () => {
    const payload = fullPayload();
    expect(payload.summary).toMatchObject({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: 'ممتاز',
      fullQuestions: 50,
      partialQuestions: 0,
      wrongQuestions: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });
    expect(payload.summary.correctSubparts).toBe(payload.details.length);
    expect(payload.details.length).toBe(
      EXAM_QUESTIONS.reduce((sum, q) => sum + q.subParts.length, 0)
    );

    expect(payload.lessons).toHaveLength(5);
    expect(payload.lessons.map((l) => l.max)).toEqual([20, 20, 20, 20, 20]);
    expect(payload.lessons.map((l) => l.awarded)).toEqual([20, 20, 20, 20, 20]);
    expect(payload.lessons.map((l) => l.title)).toEqual([
      'Nice to Meet You!',
      'My Family',
      'Daily Routine',
      'My House',
      'School Subjects / Revision 1',
    ]);

    // One detail row per presented question number, in exam order.
    expect([...new Set(payload.details.map((d) => d.q))]).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1)
    );
    expect(payload.details.every((d) => /^Lesson [1-5]$/.test(d.lessons))).toBe(true);
    expect(payload.details.every((d) => d.qTitle.length > 0)).toBe(true);
  });

  it('reports partial and unanswered parts without double counting', () => {
    const answers = perfectAnswers();
    // l1-q3 part a (0.5 mark) becomes wrong → that question is only partial.
    answers[makeSubPartKey('l1-q3', 'a')] = 'is';
    // l4-q9 part b is left blank → that question is also only partial.
    delete answers[makeSubPartKey('l4-q9', 'b')];

    const payload = buildPayload(evaluationFor(answers), ATTEMPT);
    expect(payload.summary.total).toBe(99);
    expect(payload.summary.fullQuestions).toBe(48);
    expect(payload.summary.partialQuestions).toBe(2);
    expect(payload.summary.wrongQuestions).toBe(0);
    expect(payload.summary.wrongSubparts).toBe(1);
    expect(payload.summary.unansweredSubparts).toBe(1);
    expect(
      payload.details.find((d) => d.qTitle.startsWith('Read the text and choose True'))
        ?.status
    ).toBeDefined();
    expect(payload.details.some((d) => d.status === STATUS_AR.unanswered)).toBe(true);
    expect(payload.details.some((d) => d.status === STATUS_AR.wrong)).toBe(true);
  });

  it('embeds the full TXT report, identical to the downloaded report', () => {
    const evaluation = evaluationFor(perfectAnswers());
    const payload = buildPayload(evaluation, ATTEMPT);
    expect(payload.reportText).toBe(generateTxtReport(evaluation));
    expect(payload.reportText).toContain('Grade 4 English Curriculum Exam L1-5 B'.toUpperCase());
    for (let n = 1; n <= 50; n++) expect(payload.reportText).toContain(`Question ${n} [`);
  });

  it('uses the platform grade scale verbatim', () => {
    expect([100, 95, 94, 85, 84, 75, 74, 65, 64, 50, 49, 0].map(gradeLabel)).toEqual([
      'ممتاز',
      'ممتاز',
      'جيد جداً',
      'جيد جداً',
      'جيد',
      'جيد',
      'مقبول',
      'مقبول',
      'ضعيف',
      'ضعيف',
      'يحتاج إلى دعم',
      'يحتاج إلى دعم',
    ]);
    expect(percentageOf(99.5)).toBe(99.5);
    expect(percentageOf(91.25)).toBe(91.3); // one decimal, like the reference
  });
});

describe('sendWithRetry — mocked fetch, three attempts at 2 s / 5 s', () => {
  it('POSTs text/plain;charset=utf-8 with redirect follow and the exact payload', async () => {
    const payload = fullPayload();
    const storage = memoryStorage();
    const { impl, calls } = mockFetch([() => '{"ok":true}']);

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: async () => {} });

    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });
    expect(storage.dump()).toEqual({}); // queue cleared on success
  });

  it('retries three times with 2 s then 5 s and keeps the same attemptId', async () => {
    const payload = fullPayload();
    const storage = memoryStorage();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const { impl, calls } = mockFetch([() => Promise.reject(new Error('offline'))]);

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep });

    expect(ok).toBe(false);
    expect(calls).toHaveLength(MAX_ATTEMPTS);
    expect(calls).toHaveLength(3);
    expect(sleep.mock.calls).toEqual([[RETRY_DELAYS_MS[0]], [RETRY_DELAYS_MS[1]]]);
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000]);
    expect(new Set(calls.map((c) => JSON.parse(String(c.init.body)).attemptId))).toEqual(
      new Set([payload.attemptId])
    );
  });

  it('persists the payload locally when every attempt fails', async () => {
    const payload = fullPayload();
    const storage = memoryStorage();
    const { impl } = mockFetch([() => Promise.reject(new Error('offline'))]);

    await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: async () => {} });

    expect(pendingKey(payload.attemptId)).toBe(`pending:${EXAM_ID}:${payload.attemptId}`);
    expect(Object.keys(storage.dump())).toEqual([`pending:${EXAM_ID}:${payload.attemptId}`]);
    expect(JSON.parse(storage.getItem(pendingKey(payload.attemptId))!)).toEqual(payload);
    expect(isPending(payload.attemptId, { storage })).toBe(true);
  });

  it('accepts duplicate:true as success and rejects malformed or non-JSON replies', async () => {
    const payload = fullPayload();
    const storage = memoryStorage();
    const duplicate = mockFetch([() => '{"duplicate":true}']);
    expect(
      await sendWithRetry(payload, {
        fetchImpl: duplicate.impl,
        storage,
        sleep: async () => {},
      })
    ).toBe(true);

    for (const body of ['<html>oops</html>', '{"ok":false}', 'null', '[]']) {
      const { impl } = mockFetch([() => body]);
      expect(
        await sendWithRetry(payload, { fetchImpl: impl, storage: memoryStorage(), sleep: async () => {} })
      ).toBe(false);
    }
  });

  it('times out a hanging attempt and still completes three tries', async () => {
    const payload = fullPayload();
    const calls: number[] = [];
    const hanging: FetchLike = (_url, init) => {
      calls.push(1);
      return new Promise<never>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    };
    const ok = await sendWithRetry(payload, {
      fetchImpl: hanging,
      storage: memoryStorage(),
      sleep: async () => {},
      timeoutMs: 5,
    });
    expect(ok).toBe(false);
    expect(calls).toHaveLength(3);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
  });

  it('never throws when storage is unavailable', async () => {
    const payload = fullPayload();
    const { impl } = mockFetch([() => Promise.reject(new Error('offline'))]);
    await expect(
      sendWithRetry(payload, { fetchImpl: impl, storage: null, sleep: async () => {} })
    ).resolves.toBe(false);
  });
});

describe('retryPending — resend with the same attemptId', () => {
  it('flushes queued Version B payloads only and removes each one on success', async () => {
    const storage = memoryStorage();
    const payload = fullPayload();
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    storage.setItem(pendingKey('attempt-b-0002'), JSON.stringify({ ...payload, attemptId: 'attempt-b-0002' }));
    storage.setItem('pending:some-other-exam:abc', JSON.stringify({ attemptId: 'abc' }));
    storage.setItem('theme', 'dark');

    const { impl, calls } = mockFetch([() => '{"ok":true}']);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: async () => {} });

    expect(sent).toBe(2);
    expect(calls).toHaveLength(2);
    expect(new Set(calls.map((c) => JSON.parse(String(c.init.body)).attemptId))).toEqual(
      new Set([payload.attemptId, 'attempt-b-0002'])
    );
    expect(storage.getItem(pendingKey(payload.attemptId))).toBeNull();
    expect(storage.getItem(pendingKey('attempt-b-0002'))).toBeNull();
    // Other exams and unrelated keys are untouched.
    expect(storage.getItem('pending:some-other-exam:abc')).toBe('{"attemptId":"abc"}');
    expect(storage.getItem('theme')).toBe('dark');
  });

  it('keeps failed items queued and stops matching a corrupt entry', async () => {
    const storage = memoryStorage();
    const payload = fullPayload();
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    storage.setItem(pendingKey('corrupt'), '{not json');

    const { impl, calls } = mockFetch([() => '{"ok":true}']);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: async () => {} });

    expect(sent).toBe(1);
    expect(calls).toHaveLength(1);
    expect(storage.getItem(pendingKey(payload.attemptId))).toBeNull();
    expect(storage.getItem(pendingKey('corrupt'))).toBe('{not json');
  });

  it('never resends the attempt currently displayed on the results page', async () => {
    const storage = memoryStorage();
    const payload = fullPayload();
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    const { impl, calls } = mockFetch([() => '{"ok":true}']);

    const sent = await retryPending({
      fetchImpl: impl,
      storage,
      sleep: async () => {},
      excludeAttemptId: payload.attemptId,
    });

    expect(sent).toBe(0);
    expect(calls).toHaveLength(0);
    expect(storage.getItem(pendingKey(payload.attemptId))).not.toBeNull();
  });

  it('uses the current platform token when resending a stored payload', async () => {
    const storage = memoryStorage();
    const payload = { ...fullPayload(), token: 'stale-token' };
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    const { impl, calls } = mockFetch([() => '{"ok":true}']);

    await retryPending({ fetchImpl: impl, storage, sleep: async () => {} });
    expect(JSON.parse(String(calls[0].init.body)).token).toBe(SHEETS_TOKEN);
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(payload.attemptId);
  });

  it('selects pending keys by the Version B prefix only', () => {
    expect(PENDING_PREFIX).toBe('pending:grade4-english-curriculum-exam-l1-5-b:');
    expect(pendingKey('x')).toBe('pending:grade4-english-curriculum-exam-l1-5-b:x');
    expect(pendingKey('x').startsWith(`pending:${EXAM_ID}:`)).toBe(true);
  });
});

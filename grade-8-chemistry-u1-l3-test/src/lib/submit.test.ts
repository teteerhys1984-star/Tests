import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXAM_ID,
  EXAM_TITLE,
  PENDING_PREFIX,
  RECEIPT_PREFIX,
  SHEETS_TOKEN,
  SHEETS_URL,
} from '../config';
import { ALL_PARTS } from '../data/exam';
import { correctAnswers } from '../test/helpers';
import { gradeExam } from './grading';
import { buildReport } from './report';
import { startAttempt, submitAttempt } from './session';
import {
  buildPayload,
  hasReceipt,
  isPending,
  RETRY_DELAYS_MS,
  retryPending,
  sendWithRetry,
} from './submit';

function makeFixture(partial = false) {
  const answers = partial ? { 'q1-3': '12' } : correctAnswers();
  const attempt = submitAttempt({ ...startAttempt('سمر شاهين', 1_000_000), answers }, 1_125_000);
  const result = gradeExam(attempt.answers);
  const reportText = buildReport(attempt, result);
  return { attempt, result, reportText, payload: buildPayload({ attempt, result, reportText }) };
}

describe('Google Sheets submission contract', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds the exact wire payload shape required by the Google Apps Script backend', () => {
    const { attempt, payload } = makeFixture(false);

    expect(Object.keys(payload)).toEqual([
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
    ]);
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.attemptId).toBe(attempt.attemptId);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe('سمر شاهين');
    expect(payload.elapsedSec).toBe(125);

    expect(Object.keys(payload.summary)).toEqual([
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
    ]);
    expect(payload.summary).toMatchObject({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: 'ممتاز',
      fullQuestions: 7,
      partialQuestions: 0,
      wrongQuestions: 0,
      correctSubparts: ALL_PARTS.length,
      partialSubparts: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });

    expect(payload.lessons).toHaveLength(7);
    const lessonSum = payload.lessons.reduce((s, l) => s + l.awarded, 0);
    expect(Math.round(lessonSum * 100) / 100).toBe(100);
    payload.lessons.forEach((l, i) => {
      expect(Object.keys(l)).toEqual(['title', 'awarded', 'max']);
      expect(l.title.startsWith(`س${i + 1}:`)).toBe(true);
      expect(l.awarded).toBe(l.max);
    });

    expect(payload.details).toHaveLength(ALL_PARTS.length);
    payload.details.forEach(d => {
      expect(Object.keys(d)).toEqual([
        'q',
        'qTitle',
        'lessons',
        'label',
        'status',
        'awarded',
        'marks',
        'studentAnswer',
        'correctAnswer',
      ]);
      expect(d.status).toBe('إجابة صحيحة');
      expect(d.studentAnswer).not.toContain('{{');
      expect(d.correctAnswer).not.toContain('{{');
    });
    expect(payload.reportText).not.toContain('{{');
  });

  it('tracks unanswered, partial, and wrong subparts accurately for incomplete attempts', () => {
    const { payload } = makeFixture(true);
    expect(payload.summary.total).toBe(3);
    expect(payload.summary.percentage).toBe(3);
    expect(payload.summary.gradeLabel).toBe('يحتاج إلى دعم');
    expect(payload.summary.correctSubparts).toBe(1);
    expect(payload.summary.unansweredSubparts).toBe(ALL_PARTS.length - 1);
    expect(payload.details.filter(d => d.status === 'لم يُجب')).toHaveLength(ALL_PARTS.length - 1);
    expect(payload.details.find(d => d.studentAnswer === '12')?.status).toBe('إجابة صحيحة');
  });

  it('posts text/plain JSON with token, records receipt, and clears pending on ok or duplicate', async () => {
    const { payload } = makeFixture(false);
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({ duplicate: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendWithRetry(payload);
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(SHEETS_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'text/plain;charset=utf-8' });
    expect(JSON.parse(String(init.body))).toEqual(payload);
    expect(hasReceipt(payload.attemptId)).toBe(true);
    expect(isPending(payload.attemptId)).toBe(false);
    expect(localStorage.getItem(RECEIPT_PREFIX + payload.attemptId)).toBeTruthy();
    expect(localStorage.getItem(PENDING_PREFIX + payload.attemptId)).toBeNull();
  });

  it('retries 3 times with backoff and preserves pending outbox when all attempts fail', async () => {
    vi.useFakeTimers();
    const { payload } = makeFixture(false);
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const promise = sendWithRetry(payload);
    expect(isPending(payload.attemptId)).toBe(true);

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] + RETRY_DELAYS_MS[1] + 100);
    const ok = await promise;
    expect(ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(isPending(payload.attemptId)).toBe(true);
    expect(hasReceipt(payload.attemptId)).toBe(false);
  });

  it('flushes pending attempts on retryPending while respecting excludeAttemptId', async () => {
    const first = makeFixture(false).payload;
    const second = makeFixture(false).payload;
    localStorage.setItem(PENDING_PREFIX + first.attemptId, JSON.stringify(first));
    localStorage.setItem(PENDING_PREFIX + second.attemptId, JSON.stringify(second));

    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await retryPending({ excludeAttemptId: second.attemptId });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(hasReceipt(first.attemptId)).toBe(true);
    expect(isPending(first.attemptId)).toBe(false);
    expect(isPending(second.attemptId)).toBe(true);

    await retryPending();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hasReceipt(second.attemptId)).toBe(true);
    expect(isPending(second.attemptId)).toBe(false);
  });
});

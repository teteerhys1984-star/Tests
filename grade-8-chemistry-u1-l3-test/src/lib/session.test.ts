import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../config';
import { correctAnswers } from '../test/helpers';
import {
  elapsedAt,
  emptyAttempt,
  formatDuration,
  parseAttempt,
  readAttempt,
  resetAttempt,
  saveAttempt,
  startAttempt,
  submitAttempt,
  validName,
} from './session';

describe('timestamp stopwatch and persistence', () => {
  it('does not start a timer or an attempt before the student acts', () => {
    const a = emptyAttempt();
    expect(a.startedAt).toBeNull();
    expect(a.attemptId).toBe('');
    expect(elapsedAt(a, 999999)).toBe(0);
    expect(a.status).toBe('idle');
  });

  it('requires a full name and starts only on demand with an attemptId', () => {
    expect(validName('سمر')).toBe(false);
    expect(validName('سمر شاهين')).toBe(true);
    expect(startAttempt('سمر', 100).status).toBe('idle');
    const started = startAttempt('سمر شاهين', 100);
    expect(started.startedAt).toBe(100);
    expect(started.attemptId.length).toBeGreaterThan(8);
  });

  it('uses elapsed wall-clock time, not interval ticks', () => {
    const a = startAttempt('سمر شاهين', 1000);
    expect(elapsedAt(a, 3662000)).toBe(3661000);
    expect(formatDuration(elapsedAt(a, 3662000))).toBe('01:01:01');
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('restores an unfinished attempt without resetting its timestamp, attemptId, name, answers, or question', () => {
    const a = { ...startAttempt('سمر شاهين', 1000), currentQuestion: 3, answers: { 'q1-3': '12' } };
    saveAttempt(a, 6000);
    const restored = parseAttempt(localStorage.getItem(STORAGE_KEY), 10000);
    expect(restored.recovered).toBe(true);
    expect(restored.attempt.status).toBe('active');
    expect(restored.attempt.attemptId).toBe(a.attemptId);
    expect(restored.attempt.startedAt).toBe(1000);
    expect(restored.attempt.currentQuestion).toBe(3);
    expect(restored.attempt.answers['q1-3']).toBe('12');
    expect(restored.attempt.elapsedMs).toBe(9000);
  });

  it('persists elapsed time as well as the source timestamp', () => {
    const a = startAttempt('سمر شاهين', 1000);
    saveAttempt(a, 8000);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).elapsedMs).toBe(7000);
  });

  it('freezes submitted time, supports confirmed incomplete submission, and permits a new attempt only after completion', () => {
    const a = { ...startAttempt('سمر شاهين', 1000), answers: correctAnswers() };
    const partial = submitAttempt({ ...a, answers: { 'q1-3': '12' } }, 2000);
    expect(partial.status).toBe('submitted');
    expect(elapsedAt(partial, 999999)).toBe(1000);
    expect(partial.attemptId).toBe(a.attemptId);

    const submitted = submitAttempt(a, 6000);
    expect(submitted.status).toBe('submitted');
    expect(elapsedAt(submitted, 999999)).toBe(5000);
    expect(resetAttempt(a)).toBe(a);

    const fresh = resetAttempt(submitted);
    expect(fresh.status).toBe('idle');
    expect(fresh.studentName).toBe('');
    expect(fresh.startedAt).toBeNull();
    expect(fresh.attemptId).toBe('');
  });

  it('recovers safely from corrupt storage rather than inventing an active attempt', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const r = readAttempt();
    expect(r.attempt.status).toBe('idle');
    expect(r.error).toBeTruthy();
    expect(parseAttempt(JSON.stringify({ version: 1, status: 'active' })).attempt.status).toBe('idle');
  });
});

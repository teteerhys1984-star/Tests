// @vitest-environment jsdom
/**
 * Results-page delivery flow — Mock Fetch only.
 *
 * Verifies the student is never blocked from seeing the result or downloading
 * the TXT report when delivery fails, that the payload is queued locally, and
 * that the manual "Resend result" button reuses the same attemptId.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { ATTEMPT_STORAGE_KEY } from '../config';
import { EXAM_QUESTIONS } from '../data/questions';
import { makeSubPartKey } from '../utils/scoring';

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

/** Version A's own key, assembled at runtime so this file never hard-codes it. */
const VERSION_A_STATE_KEY = ['grade4', 'english', 'curriculum', 'exam', 'l1', '5', 'a', 'attempt', 'v1'].join('-');

/** A fully answered, submitted attempt in the Version B storage format. */
function seedSubmittedAttempt(name = 'Rana Saleh') {
  const answers: Record<string, string | number[]> = {};
  for (const q of EXAM_QUESTIONS) {
    for (const sp of q.subParts) {
      answers[makeSubPartKey(q.id, sp.id)] =
        sp.inputKind === 'reorder' ? solveReorder(sp) : sp.correctAnswer;
    }
  }
  const startedAt = Date.now() - 600_000;
  window.localStorage.setItem(
    ATTEMPT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      phase: 'submitted',
      studentName: name,
      currentQuestionIndex: 0,
      answers,
      startedAtTimestamp: startedAt,
      elapsedMs: 600_000,
      submittedAtIso: new Date().toISOString(),
      muted: true,
      attemptId: 'seeded-attempt-b-1',
      startedAtIso: new Date(startedAt).toISOString(),
    })
  );
  return 'seeded-attempt-b-1';
}

const fetchMock = vi.fn();
const requests: Array<{ body: string; init: RequestInit }> = [];

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
  requests.length = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation((_url: string, init: RequestInit) => {
    requests.push({ body: String(init.body), init });
    return Promise.resolve({ text: async () => JSON.stringify({ ok: false }) });
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('results delivery — failure never blocks the student', () => {
  it('shows the result and TXT download when all three POSTs fail, then resends', async () => {
    const attemptId = seedSubmittedAttempt();
    render(<App />);

    // Three mocked attempts (0 s, 2 s, 5 s) then failure.
    await waitFor(() => expect(requests).toHaveLength(3), { timeout: 15000 });
    expect(requests.every((r) => r.init.method === 'POST')).toBe(true);
    expect(requests.every((r) => (r.init.headers as Record<string, string>)['Content-Type'] === 'text/plain;charset=utf-8')).toBe(true);

    // Same attemptId every time, and it is the Version B payload.
    expect(new Set(requests.map((r) => JSON.parse(r.body).attemptId))).toEqual(new Set([attemptId]));
    expect(JSON.parse(requests[0].body).examId).toBe('grade4-english-curriculum-exam-l1-5-b');

    // Result visible, report still downloadable, failure notice + resend button.
    expect(screen.getByText(/Student: Rana Saleh/i)).toBeTruthy();
    expect(screen.getByText('100% Overall')).toBeTruthy();
    expect(screen.getByText(/Result not sent/i)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /Download TXT Report/i }) as HTMLButtonElement).disabled
    ).toBe(false);

    // Payload queued locally under the Version B pending key.
    const pendingKeys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith('pending:grade4-english-curriculum-exam-l1-5-b:')
    );
    expect(pendingKeys).toEqual([`pending:grade4-english-curriculum-exam-l1-5-b:${attemptId}`]);

    // Now let the endpoint accept, and resend manually.
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      requests.push({ body: String(init.body), init });
      return Promise.resolve({ text: async () => JSON.stringify({ ok: true }) });
    });
    fireEvent.click(screen.getByRole('button', { name: /Resend result/i }));
    await waitFor(() => expect(screen.getByText('Result sent successfully.')).toBeTruthy());

    expect(requests).toHaveLength(4);
    expect(new Set(requests.map((r) => JSON.parse(r.body).attemptId))).toEqual(new Set([attemptId]));
    expect(
      Object.keys(window.localStorage).filter((k) =>
        k.startsWith('pending:grade4-english-curriculum-exam-l1-5-b:')
      )
    ).toEqual([]);
    expect(window.localStorage.getItem(`sent:grade4-english-curriculum-exam-l1-5-b:${attemptId}`)).toBe('1');
    // Real 2 s + 5 s backoff is exercised here, so this case needs its own budget.
  }, 30_000);

  it('persists the muted preference and attempt under Version-B-only keys', async () => {
    seedSubmittedAttempt();
    render(<App />);
    await waitFor(() => expect(requests.length).toBeGreaterThan(0), { timeout: 15000 });
    expect(window.localStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeTruthy();
    // No Version A key is written anywhere.
    expect(window.localStorage.getItem(VERSION_A_STATE_KEY)).toBeNull();
    // The mute preference is stored inside the attempt record, not in its own key.
    expect(Object.keys(window.localStorage).filter((k) => k.endsWith('-sound-muted'))).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(ATTEMPT_STORAGE_KEY) ?? '{}')).toHaveProperty('muted');
    expect(Object.keys(window.localStorage).some((k) => k.includes(VERSION_A_STATE_KEY))).toBe(false);
  });
});

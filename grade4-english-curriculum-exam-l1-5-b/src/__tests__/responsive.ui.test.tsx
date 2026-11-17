// @vitest-environment jsdom
/**
 * Responsive layout guards for phone, tablet and desktop widths.
 *
 * jsdom does not lay pages out, so these tests assert the structural rules the
 * CSS relies on (viewport meta, relative sizing, no fixed pixel widths, no
 * horizontal-scroll containers) and render the three main screens at each
 * breakpoint to catch runtime errors. Real visual layout is verified separately
 * with the production build.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { App } from '../App';
import { ATTEMPT_STORAGE_KEY } from '../config';

const ROOT = path.resolve(__dirname, '..', '..');
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'small phone', width: 320, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ text: async () => JSON.stringify({ ok: true }) }))
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('responsive structure', () => {
  it('declares a mobile viewport and no fixed-width layout', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0"');

    const css = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
    // No hard-coded page widths that would clip a 320 px phone.
    expect(css).not.toMatch(/width:\s*1[0-9]{3}px/);
    expect(css).not.toMatch(/min-width:\s*[4-9][0-9]{2}px/);
  });

  it('wraps the header actions and grids so narrow screens reflow', () => {
    const exam = fs.readFileSync(path.join(ROOT, 'src/components/ExamPage.tsx'), 'utf8');
    // Long toolbars wrap instead of overflowing.
    expect(exam).toMatch(/flex-wrap/);
    // The question navigator and clock grid are single-column on phones.
    expect(exam).toMatch(/grid-cols-10/);
    const card = fs.readFileSync(path.join(ROOT, 'src/components/QuestionCard.tsx'), 'utf8');
    expect(card).toMatch(/grid-cols-1[^"]*sm:grid-cols-2/);
    expect(card).toMatch(/flex-wrap/);
  });

  it('renders welcome, active and results screens at every breakpoint', async () => {
    for (const viewport of VIEWPORTS) {
      setViewport(viewport.width, viewport.height);
      window.localStorage.clear();

      // Welcome
      const first = render(<App />);
      expect(screen.getByLabelText(/Student Name/i), viewport.name).toBeTruthy();
      first.unmount();

      // Active exam
      window.localStorage.setItem(
        ATTEMPT_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          phase: 'active',
          studentName: `Pupil ${viewport.name}`,
          currentQuestionIndex: 0,
          answers: {},
          startedAtTimestamp: Date.now(),
          elapsedMs: 0,
          submittedAtIso: null,
          muted: true,
          attemptId: `responsive-${viewport.width}`,
          startedAtIso: new Date().toISOString(),
        })
      );
      const second = render(<App />);
      expect(screen.getByText(`Pupil ${viewport.name}`), viewport.name).toBeTruthy();
      expect(screen.getByRole('button', { name: /Submit Exam/i }), viewport.name).toBeTruthy();
      second.unmount();

      // Results
      window.localStorage.setItem(
        ATTEMPT_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          phase: 'submitted',
          studentName: `Pupil ${viewport.name}`,
          currentQuestionIndex: 0,
          answers: {},
          startedAtTimestamp: Date.now() - 60_000,
          elapsedMs: 60_000,
          submittedAtIso: new Date().toISOString(),
          muted: true,
          attemptId: `responsive-done-${viewport.width}`,
          startedAtIso: new Date(Date.now() - 60_000).toISOString(),
        })
      );
      const third = render(<App />);
      await waitFor(() =>
        expect(screen.getByText(/Student: Pupil/i), viewport.name).toBeTruthy()
      );
      expect(screen.getByRole('button', { name: /Download TXT Report/i })).toBeTruthy();
      third.unmount();
    }
  }, 60_000);

  it('keeps the mobile question navigator usable', () => {
    const exam = fs.readFileSync(path.join(ROOT, 'src/components/ExamPage.tsx'), 'utf8');
    // A 10-column navigator is fine once opened; the toggle stays compact.
    expect(exam).toMatch(/aria-expanded=\{mapOpen\}/);
    expect(exam).toMatch(/hidden sm:inline/);
  });
});

// @vitest-environment jsdom
/**
 * Full UI walk-through of all 50 questions (148 sub-parts).
 *
 * Every answer is entered through the real controls — True/False buttons, choice
 * buttons, `select` dropdowns, table/correction text inputs and the reorder word
 * tiles — so the exam's rendering, completion gate and grading are exercised end
 * to end. No fetch is performed: delivery is stubbed with a hidden mock.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { ATTEMPT_STORAGE_KEY } from '../config';
import { EXAM_QUESTIONS } from '../data/questions';
import type { ExamQuestion, QuestionSubPart } from '../types/exam';

function solveReorder(sp: QuestionSubPart): number[] {
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

/** Fills one sub-part using only the controls available in the UI. */
function answerSubPart(card: HTMLElement, question: ExamQuestion, sp: QuestionSubPart, value: string) {
  const scope = within(card);
  if (sp.inputKind === 'true-false') {
    const label = value === 'True' ? 'True (✓)' : 'False (×)';
    fireEvent.click(scope.getByRole('button', { name: label }));
    return;
  }
  if (sp.inputKind === 'choice') {
    // Choice buttons render as `<letter><option text>`.
    const buttons = scope.getAllByRole('button');
    const target = buttons.find((button) => button.textContent?.includes(value));
    if (!target) throw new Error(`No choice button for "${value}" in ${question.id}/${sp.id}`);
    fireEvent.click(target);
    return;
  }
  if (sp.inputKind === 'select') {
    const selects = scope.getAllByRole('combobox') as HTMLSelectElement[];
    const select = selects[0];
    fireEvent.change(select, { target: { value } });
    return;
  }
  if (sp.inputKind === 'reorder') {
    const indices = solveReorder(sp);
    const words = sp.scrambledWords ?? [];
    for (const index of indices) {
      // Word tiles are plain buttons labelled with the printed word.
      const tile = scope
        .getAllByRole('button')
        .find((button) => button.textContent?.trim() === words[index]);
      if (!tile) throw new Error(`No word tile "${words[index]}" in ${question.id}/${sp.id}`);
      fireEvent.click(tile);
    }
    return;
  }
  // text input (table completion / grammar correction)
  const input = scope.getAllByRole('textbox')[0] as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

function activeAttemptShell() {
  window.localStorage.setItem(
    ATTEMPT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      phase: 'active',
      studentName: 'Full Walkthrough',
      currentQuestionIndex: 0,
      answers: {},
      startedAtTimestamp: Date.now(),
      elapsedMs: 0,
      submittedAtIso: null,
      muted: true,
      attemptId: 'walkthrough-b-1',
      startedAtIso: new Date().toISOString(),
    })
  );
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

describe('all 50 questions through the UI', () => {
  it('answers every sub-part correctly and scores 100/100', async () => {
    activeAttemptShell();
    render(<App />);

    for (let index = 0; index < EXAM_QUESTIONS.length; index++) {
      const question = EXAM_QUESTIONS[index];
      const article = document.querySelector('article.exam-card') as HTMLElement;
      expect(article, `question ${index + 1}`).toBeTruthy();

      // The app always renders exactly one block per sub-part, in order, inside
      // a single container: a 2-column grid for clock/table items and a stack
      // otherwise. Reading the direct children keeps every answer in its own
      // sub-part even when several sub-parts share the same prompt text.
      const currentCard = document.querySelector('article.exam-card') as HTMLElement;
      const containers = Array.from(currentCard.querySelectorAll<HTMLElement>('div'));
      const container = containers.find(
        (node) =>
          node.className.includes('mt-5') &&
          (node.className.includes('grid') || node.className.includes('space-y-4'))
      );
      expect(container, `sub-part container for ${question.id}`).toBeTruthy();
      const blocks = Array.from(container!.children) as HTMLElement[];
      expect(blocks.length, `${question.id} block count`).toBe(question.subParts.length);

      question.subParts.forEach((sp, spIndex) => {
        const block = blocks[spIndex] as HTMLElement;
        answerSubPart(block, question, sp, sp.inputKind === 'reorder' ? '' : sp.correctAnswer);
      });

      if (index < EXAM_QUESTIONS.length - 1) {
        fireEvent.click(screen.getByRole('button', { name: /^Next$/i }));
      }
    }

    // The gate only unlocks when every sub-part has an answer.
    const submit = screen.getByRole('button', { name: /Submit Exam/i }) as HTMLButtonElement;
        expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(screen.getByText('100% Overall')).toBeTruthy());
    expect(screen.getByText(/Student: Full Walkthrough/i)).toBeTruthy();
    expect(screen.getByText('50 / 50')).toBeTruthy();
    expect(screen.getAllByText(/Curriculum Source:/i)).toHaveLength(50);
  }, 90_000);
});

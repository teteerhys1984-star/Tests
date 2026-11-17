// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { EXAM_QUESTIONS } from '../data/questions';
import { QuestionSubPart, StudentAnswerMap } from '../types/exam';
import { makeSubPartKey } from '../utils/scoring';
import { EXAM_STORAGE_KEY } from '../utils/storage';

function solveReorder(sp: QuestionSubPart): number[] {
  const words = sp.scrambledWords ?? [];
  const target = sp.correctAnswer.slice(0, -1);
  const used = new Set<number>();
  const path: number[] = [];
  const dfs = (cur: string): boolean => {
    if (path.length === words.length) return cur === target;
    for (let i = 0; i < words.length; i++) {
      if (used.has(i)) continue;
      const next = cur ? `${cur} ${words[i]}` : words[i];
      if (target.startsWith(next)) {
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

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Grade 4 English Exam — End-to-End UI Workflow', () => {
  it('enforces mandatory student name, renders WhatsApp footer, and shows zero ZIP links', () => {
    render(<App />);

    expect(
      screen.getAllByText('Grade 4 English Curriculum Exam L1-5 B').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('50 Questions')).toBeTruthy();
    expect(screen.getByText(/100 Marks/)).toBeTruthy();

    // Start Exam is disabled until student name is entered
    const startBtn = screen.getByRole('button', { name: /Start Exam/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);

    // Whitespace alone cannot unlock Start Exam
    const nameInput = screen.getByLabelText(/Student Name/i);
    fireEvent.change(nameInput, { target: { value: '   ' } });
    expect(startBtn.disabled).toBe(true);

    // Exact WhatsApp contact footer
    const waLink = screen.getByRole('link', { name: /WhatsApp 0930215022/i }) as HTMLAnchorElement;
    expect(waLink.href).toBe('https://wa.me/963930215022');
    expect(within(waLink).getByText('المهندس سومر شاهين')).toBeTruthy();
    expect(within(waLink).getByText('0930215022')).toBeTruthy();

    // Zero project ZIP references anywhere in the rendered page
    expect(document.body.textContent).not.toMatch(/\.zip/i);
  });

  it('gates Teacher Answer Key with password somer173 and locks it back cleanly', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Teacher Key/i }));
    const pwInput = screen.getByLabelText(/Teacher Password/i);

    // Wrong password rejected
    fireEvent.change(pwInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Open Answer Key/i }));
    expect(screen.getByText(/Incorrect password/i)).toBeTruthy();

    // Correct password opens all 50 questions with marking rules & source references
    fireEvent.change(pwInput, { target: { value: 'somer173' } });
    fireEvent.click(screen.getByRole('button', { name: /Open Answer Key/i }));
    expect(screen.getByText(/Official Answer Key/i)).toBeTruthy();
    expect(screen.getAllByText(/Source Reference:/i)).toHaveLength(50);
    expect(screen.getAllByText(/Marking rule:/i).length).toBeGreaterThanOrEqual(50);

    // Re-lock and return
    fireEvent.click(screen.getByRole('button', { name: /Lock Key/i }));
    expect(screen.getByLabelText(/Teacher Password/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Back to Welcome/i }));
    expect(screen.getByRole('button', { name: /Start Exam/i })).toBeTruthy();
  });

  it('supports active exam interaction, hides answers/sources/teacher-key, and recovers after refresh', () => {
    const { unmount } = render(<App />);

    // Toggle mute, enter student name, start exam
    fireEvent.click(screen.getByRole('button', { name: /Mute exam sound effects/i }));
    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: 'Lina Haddad' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));

    // Active exam screen checks
    expect(screen.getByText('Lina Haddad')).toBeTruthy();
    expect(screen.getByLabelText(/Elapsed exam time/i).textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(screen.queryByRole('button', { name: /Teacher Key/i })).toBeNull();
    expect(document.body.textContent).not.toMatch(/Curriculum Source:/i);
    expect(document.body.textContent).not.toMatch(/Correct answer:/i);

    // Submit Exam must be disabled initially
    const submitBtn = screen.getByRole('button', { name: /Submit Exam/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Navigate to Question 5 (Reorder question l5-q3) via Next button 4 times
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /^Next$/i }));
    }
    expect(screen.getByText('Question 5')).toBeTruthy();
    // Click word tiles in order for "My favourite subject is geography."
    for (const word of ['My', 'favourite', 'subject', 'is', 'geography']) {
      fireEvent.click(screen.getByRole('button', { name: word }));
    }
    expect(screen.getByText('My favourite subject is geography.')).toBeTruthy();

    // Simulate browser refresh by unmounting and remounting <App />
    unmount();
    render(<App />);

    // Same student, same Question 5, same reorder answer, and muted state preserved
    expect(screen.getByText('Lina Haddad')).toBeTruthy();
    expect(screen.getByText('Question 5')).toBeTruthy();
    expect(screen.getByText('My favourite subject is geography.')).toBeTruthy();
    expect(screen.getByText('Muted')).toBeTruthy();
  });

  it('keeps Submit disabled at 49/50, submits immediately at 50/50 without confirm, downloads TXT, and restarts cleanly', () => {
    // Prepare an active exam with 49 of 50 questions answered (leaving Q50 unanswered)
    const answers: StudentAnswerMap = {};
    EXAM_QUESTIONS.slice(0, 49).forEach((q) => {
      q.subParts.forEach((sp) => {
        const key = makeSubPartKey(q.id, sp.id);
        answers[key] = sp.inputKind === 'reorder' ? solveReorder(sp) : sp.correctAnswer;
      });
    });

    window.localStorage.setItem(
      EXAM_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        phase: 'active',
        studentName: 'Kareem Nassar',
        currentQuestionIndex: 49, // Question 50 (l3-q7)
        answers,
        startedAtTimestamp: Date.now() - 754_000, // 00:12:34
        elapsedMs: 754_000,
        submittedAtIso: null,
        muted: true,
        attemptId: 'ui-attempt-b-7',
        startedAtIso: new Date(Date.now() - 754_000).toISOString(),
      })
    );

    const confirmSpy = vi.spyOn(window, 'confirm');
    const createUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-grade4-report');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<App />);

    // At 49/50, Submit Exam is strictly disabled
    const submitBtn = screen.getByRole('button', { name: /Submit Exam/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(screen.getByText('49 of 50 completed')).toBeTruthy();

    // Answer both sub-parts of Question 50 (l3-q7)
    fireEvent.click(screen.getByRole('button', { name: /a\s*get\s*\/\s*gets/i }));
    expect(submitBtn.disabled).toBe(true); // 1 sub-part still missing!

    fireEvent.click(screen.getByRole('button', { name: /b\s*make\s*\/\s*makes/i }));
    expect(submitBtn.disabled).toBe(false);
    expect(screen.getByText('50 of 50 completed')).toBeTruthy();

    // Submit immediately — ZERO confirmation dialogs!
    fireEvent.click(submitBtn);
    expect(confirmSpy).not.toHaveBeenCalled();

    // Results page displayed immediately with 100/100 score and all 50 source references
    expect(screen.getByText(/Student: Kareem Nassar/i)).toBeTruthy();
    expect(screen.getByText('100% Overall')).toBeTruthy();
    expect(screen.getByText('50 / 50')).toBeTruthy();
    expect(screen.getByText('0 / 50')).toBeTruthy();
    expect(screen.getAllByText(/Curriculum Source:/i)).toHaveLength(50);

    // Download TXT Report works cleanly
    fireEvent.click(screen.getByRole('button', { name: /Download TXT Report/i }));
    expect(createUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);

    // Test Results lesson filter and persistence across refresh
    fireEvent.click(screen.getByRole('button', { name: /^Lesson 3$/i }));
    expect(screen.getByText('Showing 10 of 50 questions')).toBeTruthy();

    // Explicit Start New Exam returns to Welcome and requires typing student name again
    fireEvent.click(screen.getByRole('button', { name: /Start New Exam/i }));
    const freshNameInput = screen.getByLabelText(/Student Name/i) as HTMLInputElement;
    expect(freshNameInput.value).toBe('');
    expect((screen.getByRole('button', { name: /Start Exam/i }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('exercises clock dropdowns, True/False, grammar correction inputs, table inputs, and Question Navigator', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Mute exam sound effects/i }));
    fireEvent.change(screen.getByLabelText(/Student Name/i), { target: { value: 'Yara' } });
    fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));

    // Open Question Navigator and jump to Q2 (Clock Time — l3-q8)
    fireEvent.click(screen.getByRole('button', { name: '0/50' }));
    fireEvent.click(screen.getByRole('button', { name: /Question 2 \(not answered yet\)/i }));
    expect(screen.getByText('Question 2')).toBeTruthy();
    const clockSelects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(clockSelects).toHaveLength(4);
    fireEvent.change(clockSelects[0], { target: { value: 'It’s five o’clock.' } });
    fireEvent.change(clockSelects[1], { target: { value: 'It’s quarter past five.' } });
    fireEvent.change(clockSelects[2], { target: { value: 'It’s half past one.' } });
    fireEvent.change(clockSelects[3], { target: { value: 'It’s quarter to four.' } });
    expect(screen.getByText('1 of 50 completed')).toBeTruthy();

    // Jump to Q3 (True/False — l2-q1 Sanaa passage)
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }));
    const falseButtons = screen.getAllByRole('button', { name: /False \(×\)/i });
    fireEvent.click(falseButtons[0]);
    fireEvent.click(falseButtons[1]);
    expect(screen.getByText('2 of 50 completed')).toBeTruthy();

    // Jump to Q24 (Correct the underlined mistake — l5-q6)
    fireEvent.click(screen.getByRole('button', { name: '2/50' }));
    fireEvent.click(screen.getByRole('button', { name: /Question 24 \(not answered yet\)/i }));
    const mistakeInputs = screen.getAllByPlaceholderText(/Type your answer here/i);
    expect(mistakeInputs).toHaveLength(4);
    fireEvent.change(mistakeInputs[0], { target: { value: 'are' } });
    fireEvent.change(mistakeInputs[1], { target: { value: 'likes' } });
    fireEvent.change(mistakeInputs[2], { target: { value: 'wakes' } });
    fireEvent.change(mistakeInputs[3], { target: { value: 'is' } });
    expect(screen.getByText('3 of 50 completed')).toBeTruthy();

    // Jump to Q26 (John's Family table — l2-q7)
    fireEvent.click(screen.getByRole('button', { name: '3/50' }));
    fireEvent.click(screen.getByRole('button', { name: /Question 26 \(not answered yet\)/i }));
    fireEvent.change(screen.getByLabelText(/His grandmother/i), { target: { value: 'Liza' } });
    fireEvent.change(screen.getByLabelText(/Mary/i), { target: { value: 'mother' } });
    fireEvent.change(screen.getByLabelText(/His father/i), { target: { value: 'James' } });
    fireEvent.change(screen.getByLabelText(/His sister/i), { target: { value: 'Eve' } });
    expect(screen.getByText('4 of 50 completed')).toBeTruthy();
  });
});

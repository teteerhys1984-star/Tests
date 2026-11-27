import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { EXAM_TITLE, STORAGE_KEY } from './config';
import { QUESTIONS } from './data/exam';
import { saveAttempt, startAttempt } from './lib/session';
import { isPending } from './lib/submit';
import { correctAnswers } from './test/helpers';

function seedComplete() {
  const attempt = { ...startAttempt('سمر شاهين', Date.now() - 65000), answers: correctAnswers(), currentQuestion: 6 };
  saveAttempt(attempt);
  return attempt;
}

const submitButton = () => screen.getAllByRole('button', { name: 'تسليم الاختبار' })[0];

describe('student workflow, pre-submit review, delivery, and teacher gate', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () => JSON.stringify({ ok: true }),
      }),
    );
  });

  it('opens with English EXAM_TITLE, Arabic lesson subtitle, local KaTeX, and no running timer', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(EXAM_TITLE);
    expect(screen.queryByRole('timer')).toBeNull();
    expect(document.querySelector('.katex')).toBeTruthy();
    expect(document.querySelector('.katex-error')).toBeNull();
    expect(document.querySelector('.katex-html')?.textContent).not.toContain('\\mathrm');
  });

  it('validates the full name before starting', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'ابدأ الاختبار' }));
    expect(screen.getByRole('alert').textContent).toContain('الاسم واللقب');
    expect(screen.queryByRole('timer')).toBeNull();
    fireEvent.change(screen.getByLabelText(/اسم الطالب الكامل/), { target: { value: 'سمر شاهين' } });
    fireEvent.click(screen.getByRole('button', { name: 'ابدأ الاختبار' }));
    expect(screen.getAllByRole('timer').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: QUESTIONS[0].title })).toBeTruthy();
  });

  it('restores an unfinished attempt to its saved question', () => {
    saveAttempt({ ...startAttempt('سمر شاهين', Date.now() - 10000), currentQuestion: 3, answers: { 'q1-3': '12' } });
    render(<App />);
    expect(screen.getByRole('heading', { name: QUESTIONS[3].title })).toBeTruthy();
    expect(screen.getByText(/تمت استعادة محاولتك/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'ابدأ الاختبار' })).toBeNull();
  });

  it('always enables submission, opens pre-submit review with incomplete warning & jump-to-part, and allows confirmed incomplete submission', async () => {
    const attempt = seedComplete();
    delete attempt.answers['q1-1'];
    saveAttempt(attempt);
    const confirm = vi.spyOn(window, 'confirm');

    render(<App />);
    expect(submitButton().hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitButton());
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'ملخّص إجاباتك في الاختبار' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('بقي 1 جزءًا غير مجاب عنه');

    fireEvent.click(screen.getByRole('button', { name: 'الانتقال إلى أول جزء غير مجاب' }));
    expect(screen.getByRole('heading', { name: QUESTIONS[0].title })).toBeTruthy();

    fireEvent.click(submitButton());
    fireEvent.click(screen.getAllByRole('button', { name: /تأكيد التسليم رغم نقص الإجابات/ })[0]);

    expect(screen.getByText('اكتمل الاختبار')).toBeTruthy();
    expect(document.querySelector('.score-ring strong')?.textContent).toContain('97');
    await waitFor(() => {
      expect(screen.getByText(/تم إرسال النتيجة وحفظها في سجلّ المعلّم بنجاح/)).toBeTruthy();
    });
  });

  it('shows failure banner and manual retry button when network fails while still keeping results and TXT download available', async () => {
    const attempt = seedComplete();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ text: async () => JSON.stringify({ ok: false }) });
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<App />);
    fireEvent.click(submitButton());
    fireEvent.click(screen.getAllByRole('button', { name: /تأكيد التسليم النهائي/ })[0]);

    expect(screen.getByText('اكتمل الاختبار')).toBeTruthy();
    expect(document.querySelector('.score-ring strong')?.textContent).toContain('100');

    // Download report remains immediately usable even before delivery finishes.
    fireEvent.click(screen.getAllByText('تحميل التقرير')[0]);
    expect(click).toHaveBeenCalled();
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('تقرير-سمر-شاهين.txt');

    await vi.advanceTimersByTimeAsync(10000);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText(/تعذّر إرسال النتيجة الآن/)).toBeTruthy();
    });
    expect(isPending(attempt.attemptId)).toBe(true);

    fetchMock.mockResolvedValue({ text: async () => JSON.stringify({ ok: true }) });
    fireEvent.click(screen.getByRole('button', { name: 'إعادة إرسال النتيجة' }));
    await waitFor(() => {
      expect(screen.getByText(/تم إرسال النتيجة وحفظها في سجلّ المعلّم بنجاح/)).toBeTruthy();
    });
  });

  it('allows a fresh named attempt only after submission', () => {
    seedComplete();
    render(<App />);
    fireEvent.click(submitButton());
    fireEvent.click(screen.getAllByRole('button', { name: /تأكيد التسليم النهائي/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'محاولة جديدة' }));
    expect(screen.getByRole('button', { name: 'ابدأ الاختبار' })).toBeTruthy();
    expect((screen.getByLabelText(/اسم الطالب الكامل/) as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('protects the teacher key with the required client-side password and shows all seven solutions', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'مساحة المعلّم' }));
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'فتح مفتاح الإجابات' }));
    expect(screen.getByRole('alert').textContent).toContain('غير صحيحة');
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'somer173' } });
    fireEvent.click(screen.getByRole('button', { name: 'فتح مفتاح الإجابات' }));
    expect(screen.getByRole('heading', { name: 'مفتاح الإجابات والحلول الكاملة' })).toBeTruthy();
    expect(document.querySelectorAll('.teacher-question')).toHaveLength(7);
    expect(screen.getByText(/ليست مصادقة آمنة أو تشفيرًا/)).toBeTruthy();
  });

  it('renders ion superscripts like Ca²⁺ and SO₄²⁻ inside a single KaTeX token', () => {
    const attempt = { ...startAttempt('سمر شاهين', Date.now() - 10000), currentQuestion: 2 };
    saveAttempt(attempt);
    render(<App />);
    const katexTexts = Array.from(document.querySelectorAll('.katex-html')).map(el => el.textContent);
    expect(katexTexts.some(t => t?.includes('SO') && t?.includes('2'))).toBe(true);
    // Must not split SO₄²⁻ into SO₄ and a stray orphan ⁻ span outside KaTeX
    const matchingLabels = Array.from(document.querySelectorAll('.matching-label .scientific-text')).map(el => el.textContent);
    expect(matchingLabels.every(t => !t?.includes('⁺') && !t?.includes('⁻'))).toBe(true);
  });

  it('keeps every navigation item reachable and saves a changed response', () => {
    seedComplete();
    render(<App />);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'أسئلة الاختبار' })).getAllByRole('button')[0]);
    const group = screen.getByRole('radiogroup', { name: /أيّ وصف يميّز/ });
    fireEvent.click(group.querySelector('input[value="d"]')!);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).answers['q1-1']).toBe('d');
  });
});

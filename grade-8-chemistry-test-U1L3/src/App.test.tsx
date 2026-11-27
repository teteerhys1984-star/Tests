import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { QUESTIONS } from './data/exam';
import { correctAnswers } from './test/helpers';
import { saveAttempt, startAttempt, STORAGE_KEY } from './lib/session';
function seedComplete() { const attempt = { ...startAttempt('سمر شاهين', Date.now() - 65000), answers: correctAnswers(), currentQuestion: 6 }; saveAttempt(attempt); return attempt; }
const submitButton = () => screen.getAllByRole('button', { name: 'تسليم الاختبار' })[0];
describe('student workflow and teacher gate', () => {
  it('opens with the neutral Arabic heading, local KaTeX, and no running timer', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('اختبار الكيمياء – الصف الثامن');
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
  it('keeps submission disabled until all responses are complete, then submits immediately without confirmation', () => {
    const attempt = seedComplete(); delete attempt.answers['q1-1']; saveAttempt(attempt);
    const confirm = vi.spyOn(window, 'confirm');
    const { unmount } = render(<App />);
    expect(submitButton().hasAttribute('disabled')).toBe(true);
    unmount(); seedComplete(); render(<App />);
    expect(submitButton().hasAttribute('disabled')).toBe(false);
    fireEvent.click(submitButton());
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByText('اكتمل الاختبار')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'سمر شاهين' })).toBeTruthy();
    expect(screen.getAllByText('تحميل التقرير').length).toBeGreaterThan(0);
    expect(document.querySelector('.score-ring strong')?.textContent).toContain('100');
  });
  it('downloads a student-named local TXT report and allows a fresh named attempt only after submission', () => {
    seedComplete();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<App />); fireEvent.click(submitButton());
    fireEvent.click(screen.getAllByText('تحميل التقرير')[0]);
    expect(click).toHaveBeenCalled();
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('تقرير-سمر-شاهين.txt');
    fireEvent.click(screen.getByRole('button', { name: 'محاولة جديدة' }));
    expect(screen.getByRole('button', { name: 'ابدأ الاختبار' })).toBeTruthy();
    expect((screen.getByLabelText(/اسم الطالب الكامل/) as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('timer')).toBeNull();
  });
  it('protects the teacher key with the required client-side password and shows all seven solutions', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: 'مساحة المعلّم' }));
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'فتح مفتاح الإجابات' }));
    expect(screen.getByRole('alert').textContent).toContain('غير صحيحة');
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'somer173' } });
    fireEvent.click(screen.getByRole('button', { name: 'فتح مفتاح الإجابات' }));
    expect(screen.getByRole('heading', { name: 'مفتاح الإجابات والحلول الكاملة' })).toBeTruthy();
    expect(document.querySelectorAll('.teacher-question')).toHaveLength(7);
    expect(screen.getByText(/ليست مصادقة آمنة أو تشفيرًا/)).toBeTruthy();
  });
  it('keeps every navigation item reachable and saves a changed response', () => {
    seedComplete(); render(<App />);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'أسئلة الاختبار' })).getAllByRole('button')[0]);
    const group = screen.getByRole('radiogroup', { name: /أيّ وصف يميّز/ });
    fireEvent.click(group.querySelector('input[value="d"]')!);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).answers['q1-1']).toBe('d');
  });
});

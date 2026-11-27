import { ALL_PARTS, QUESTIONS } from '../data/exam';
import { isExamComplete } from './grading';
import type { Answers, Attempt } from './types';
export const STORAGE_KEY = 'grade8-chemistry-l3-attempt-v1';
export const emptyAttempt = (): Attempt => ({ version: 1, studentName: '', answers: {}, startedAt: null, submittedAt: null, currentQuestion: 0, status: 'idle', elapsedMs: 0 });
export function validName(name: string): boolean {
  const clean = name.trim().replace(/\s+/g, ' ');
  const words = clean.split(' ');
  return clean.length >= 4 && clean.length <= 80 && words.length >= 2 && words.every(w => w.length >= 2) && /^[\p{L}\p{M}\s'’\-]+$/u.test(clean);
}
export function elapsedAt(attempt: Attempt, now: number): number {
  if (attempt.status === 'submitted' && attempt.startedAt !== null && attempt.submittedAt !== null) return Math.max(0, attempt.submittedAt - attempt.startedAt);
  if (attempt.status === 'active' && attempt.startedAt !== null) return Math.max(0, now - attempt.startedAt);
  return 0;
}
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}
export function parseAttempt(raw: string | null, now = Date.now()): { attempt: Attempt; recovered: boolean; error: string | null } {
  if (!raw) return { attempt: emptyAttempt(), recovered: false, error: null };
  try {
    const data = JSON.parse(raw) as Attempt;
    if (!data || data.version !== 1 || !['idle', 'active', 'submitted'].includes(data.status) || typeof data.studentName !== 'string' || data.studentName.length > 80 || !data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers) || !Number.isInteger(data.currentQuestion) || data.currentQuestion < 0 || data.currentQuestion >= QUESTIONS.length) throw new Error('invalid');
    if (data.status !== 'idle' && (!validName(data.studentName) || !Number.isFinite(data.startedAt) || data.startedAt! <= 0)) throw new Error('invalid');
    if (data.status === 'submitted' && (!Number.isFinite(data.submittedAt) || data.submittedAt! < data.startedAt!)) throw new Error('invalid');
    if (data.status === 'active' && data.submittedAt !== null) throw new Error('invalid');
    const answers: Answers = {};
    const ids = new Set(ALL_PARTS.map(p => p.id));
    for (const [key, value] of Object.entries(data.answers)) {
      if (!ids.has(key)) continue;
      if (typeof value === 'string' && value.length <= 2000) answers[key] = value;
      else if (Array.isArray(value) && value.length <= 20 && value.every(v => typeof v === 'string' && v.length <= 2000)) answers[key] = value;
      else if (value && typeof value === 'object' && Object.values(value).every(v => typeof v === 'string' && v.length <= 2000)) answers[key] = value;
      else throw new Error('invalid');
    }
    const attempt: Attempt = { ...data, answers, elapsedMs: 0 };
    attempt.elapsedMs = elapsedAt(attempt, now);
    return { attempt, recovered: data.status !== 'idle', error: null };
  } catch {
    return { attempt: emptyAttempt(), recovered: false, error: 'تعذّرت قراءة المحاولة المحفوظة. يمكنك بدء محاولة جديدة بإدخال اسمك.' };
  }
}
export function readAttempt(): { attempt: Attempt; recovered: boolean; error: string | null } {
  try { return parseAttempt(localStorage.getItem(STORAGE_KEY)); }
  catch { return { attempt: emptyAttempt(), recovered: false, error: 'التخزين المحلي غير متاح. أبقِ هذه الصفحة مفتوحة للحفاظ على إجاباتك.' }; }
}
export function saveAttempt(attempt: Attempt, now = Date.now()): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...attempt, elapsedMs: elapsedAt(attempt, now) })); return true; }
  catch { return false; }
}
export function startAttempt(name: string, now: number): Attempt {
  if (!validName(name)) return emptyAttempt();
  return { ...emptyAttempt(), studentName: name.trim().replace(/\s+/g, ' '), startedAt: now, status: 'active' };
}
export function submitAttempt(attempt: Attempt, now: number): Attempt {
  if (attempt.status !== 'active' || !isExamComplete(attempt.answers)) return attempt;
  return { ...attempt, status: 'submitted', submittedAt: now, elapsedMs: elapsedAt(attempt, now) };
}
export function resetAttempt(attempt: Attempt): Attempt { return attempt.status === 'submitted' ? emptyAttempt() : attempt; }

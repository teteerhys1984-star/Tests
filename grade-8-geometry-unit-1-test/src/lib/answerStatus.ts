import type { AnswerValue } from '../exam/types';
/** Empty nested controls are unanswered, including empty numeric input strings. */
export function hasAnswer(value: AnswerValue | unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (typeof value === 'object') return Object.values(value).some(hasAnswer);
  return true;
}

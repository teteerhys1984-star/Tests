import type { Question } from '../types';
import { U1L1_QUESTIONS } from './u1l1';
import { U1L2_QUESTIONS } from './u1l2';
import { U1L3_QUESTIONS } from './u1l3';
import { U2L1_QUESTIONS } from './u2l1';
import { U2L2_QUESTIONS } from './u2l2';

const ALL = [...U1L1_QUESTIONS, ...U1L2_QUESTIONS, ...U1L3_QUESTIONS, ...U2L1_QUESTIONS, ...U2L2_QUESTIONS];
const byId = new Map(ALL.map((q) => [q.id, q]));

/** Fixed, deliberately interleaved presentation order (not textbook order). */
const ORDER = [
  'U1L1-G1', 'U2L2-S1', 'U1L3-S1', 'U1L2-G1', 'U2L1-S1', 'U1L3-G1',
  'U1L2-S1', 'U2L1-G1', 'U1L1-S1', 'U2L2-G1', 'U1L2-G2', 'U1L3-S2',
  'U2L2-S2', 'U1L1-G2', 'U2L1-S2', 'U1L3-G2', 'U1L2-S2', 'U2L1-G2',
  'U1L1-S2', 'U2L2-G2', 'U1L3-G3', 'U2L1-S3', 'U1L2-G3', 'U2L2-S3',
  'U1L1-G3', 'U1L3-S3', 'U2L1-G3', 'U1L2-S3', 'U2L2-G3', 'U1L1-S3',
];

export const QUESTIONS: Question[] = ORDER.map((id) => {
  const q = byId.get(id);
  if (!q) throw new Error(`Missing question ${id}`);
  return q;
});

export const subKey = (q: Question, subId: string) => `${q.id}:${subId}`;

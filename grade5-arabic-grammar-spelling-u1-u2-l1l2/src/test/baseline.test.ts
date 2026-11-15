import { describe, it, expect } from 'vitest';
import baseline from './fixtures/baseline.json';
import { QUESTIONS } from '../data/questions';
import { scoreExam } from '../utils/scoring';
import { buildReport } from '../utils/report';
import type { Answers } from '../data/types';

describe('immutable original baseline', () => {
  it('preserves every question, branch, answer, order and mark', () => expect(QUESTIONS.map(q => q.id === 'U1L2-S3' ? { ...q, instruction: q.instruction.replace('الكلمةِ التي فيها خطأٌ', 'الكلمةِ التي تحتَها خطّ') } : q)).toEqual(baseline.questions));
  for (const [name, scenario] of Object.entries(baseline.scenarios)) {
    it(`preserves original grading: ${name}`, () => expect(scoreExam(scenario.answers as Answers)).toEqual(scenario.result));
  }
  it('preserves the report except the now inaccurate privacy sentence', () => {
    const answers = baseline.scenarios.full.answers as Answers;
    const report = buildReport({ studentName:'طالبة تجريبية',attemptId:'baseline',submittedAt:1700000000000,elapsedMs:65000,answers,result:scoreExam(answers) });
    expect(report.replace(/أُنشئ هذا التقرير[^\r]+/, 'PRIVACY').replace('الكلمةِ التي فيها خطأٌ', 'الكلمةِ التي تحتَها خطّ').replace(/تاريخ التسليم ووقته: [^\r]+/, 'DATE')).toBe(baseline.report.replace(/أُنشئ هذا التقرير[^\r]+/, 'PRIVACY').replace(/تاريخ التسليم ووقته: [^\r]+/, 'DATE').replace('الكلمةِ التي فيها خطأٌ', 'الكلمةِ التي تحتَها خطّ').replace(/تاريخ التسليم ووقته: [^\r]+/, 'DATE'));
  });
});

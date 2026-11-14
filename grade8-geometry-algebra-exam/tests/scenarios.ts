/**
 * بناء سيناريوهات الإجابة بنفس الخوارزمية الحتمية المستعملة في توليد خط الأساس
 * من النسخة الأصلي (قبل النقل وبأي تعديل) — تُستعمل في preservation و grading.
 */
import { EXAM_QUESTIONS } from '../src/data/questions';
import type { ExamSessionState } from '../src/types/exam';

export const BASELINE_START = 1760000000000;
export const BASELINE_SUBMIT = 1760000360000;
export const BASELINE_ATTEMPT = 'ATT_BASELINE_0001';
export const BASELINE_NAME = 'طالب الأساس';

export const SCENARIO_NAMES = [
  'allCorrect',
  'allEmpty',
  'allWrong',
  'mixed',
  'normalization',
  'acceptable',
] as const;
export type ScenarioName = (typeof SCENARIO_NAMES)[number];

export type Answers = Record<string, string>;

export function correctValue(qi: number, si: number): string {
  const sub = EXAM_QUESTIONS[qi].subparts[si];
  return Array.isArray(sub.correctAnswer) ? sub.correctAnswer[0] : sub.correctAnswer;
}

export function wrongValue(qi: number, si: number): string {
  const sub = EXAM_QUESTIONS[qi].subparts[si];
  if (sub.options) {
    const bad = sub.options.find(o => o.id !== sub.correctAnswer);
    return bad ? bad.id : 'opt_999';
  }
  return '999999';
}

export function buildScenarioAnswers(name: ScenarioName): Answers {
  const a: Answers = {};
  switch (name) {
    case 'allCorrect':
      EXAM_QUESTIONS.forEach((q, qi) =>
        q.subparts.forEach((_, si) => {
          a[q.id + '_' + q.subparts[si].id] = correctValue(qi, si);
        }),
      );
      return a;
    case 'allEmpty':
      return {};
    case 'allWrong':
      EXAM_QUESTIONS.forEach((q, qi) =>
        q.subparts.forEach((_, si) => {
          a[q.id + '_' + q.subparts[si].id] = wrongValue(qi, si);
        }),
      );
      return a;
    case 'mixed':
      EXAM_QUESTIONS.forEach((q, qi) =>
        q.subparts.forEach((sub, si) => {
          const k = (qi * 3 + si) % 4;
          const key = q.id + '_' + sub.id;
          if (k === 0) a[key] = correctValue(qi, si);
          else if (k === 1) a[key] = wrongValue(qi, si);
          else if (k === 2) a[key] = '';
          else {
            const alt =
              sub.acceptableAnswers && sub.acceptableAnswers.length > 1
                ? sub.acceptableAnswers[1]
                : correctValue(qi, si);
            a[key] = alt;
          }
        }),
      );
      return a;
    case 'normalization': {
      const toAr = (s: string) => s.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
      EXAM_QUESTIONS.forEach((q, qi) =>
        q.subparts.forEach((sub, si) => {
          const v = correctValue(qi, si);
          const key = q.id + '_' + sub.id;
          a[key] = /^[0-9.]+$/.test(v) ? '  ' + toAr(v) + '  ' : ' ' + v + ' ';
        }),
      );
      return a;
    }
    case 'acceptable':
      EXAM_QUESTIONS.forEach((q, qi) =>
        q.subparts.forEach((sub, si) => {
          const key = q.id + '_' + sub.id;
          if (sub.acceptableAnswers && sub.acceptableAnswers.length > 1) a[key] = sub.acceptableAnswers[1];
          else a[key] = correctValue(qi, si);
        }),
      );
      return a;
  }
}

export function makeState(name: ScenarioName): ExamSessionState {
  return {
    examId: 'MATHVERSE_G8_ALG_GEO',
    version: '1.0.0',
    attemptId: BASELINE_ATTEMPT,
    studentName: BASELINE_NAME,
    isStarted: true,
    isSubmitted: true,
    currentQuestionIndex: 0,
    visitedQuestions: [0],
    answers: buildScenarioAnswers(name),
    startTime: BASELINE_START,
    submissionTime: BASELINE_SUBMIT,
    elapsedSeconds: 360,
  };
}

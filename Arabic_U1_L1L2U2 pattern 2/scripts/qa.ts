import { QUESTIONS, TOTAL_MARKS, TOTAL_SUBPARTS } from '../src/data/questions';
import { LESSONS } from '../src/data/sources/lessons';
import { gradeAttempt } from '../src/utils/grading';
import { buildTxtReport } from '../src/utils/report';
import type { Attempt } from '../src/types/exam';

let failures = 0;
const ok = (condition: boolean, message: string) => {
  if (!condition) { failures++; console.error('FAIL:', message); }
  else console.log('PASS:', message);
};

ok(QUESTIONS.length === 30, 'exactly 30 main questions');
ok(TOTAL_MARKS === 100, `marks total exactly 100 (${TOTAL_MARKS})`);
ok(TOTAL_SUBPARTS >= 65 && TOTAL_SUBPARTS <= 85, `subparts within 65–85 (${TOTAL_SUBPARTS})`);
ok(new Set(QUESTIONS.map(q => q.id)).size === 30, 'question ids unique');
ok(new Set(QUESTIONS.flatMap(q => q.subparts.map(s => s.id))).size === TOTAL_SUBPARTS, 'subpart ids unique');
ok(QUESTIONS.every((q, i) => q.number === i + 1), 'numbered 1..30 in display order');

for (const lesson of LESSONS) {
  const qs = QUESTIONS.filter(q => q.lessonId === lesson.id);
  ok(qs.length === 6, `${lesson.title}: exactly 6 questions`);
  ok(qs.filter(q => q.section === 'grammar').length === 3, `${lesson.title}: 3 grammar questions`);
  ok(qs.filter(q => q.section === 'spelling').length === 3, `${lesson.title}: 3 spelling questions`);
  const marks = (section: string) => qs.filter(q => q.section === section).flatMap(q => q.subparts).reduce((s, p) => s + p.marks, 0);
  ok(marks('grammar') === 10, `${lesson.title}: grammar 10 marks`);
  ok(marks('spelling') === 10, `${lesson.title}: spelling 10 marks`);
  ok(marks('grammar') + marks('spelling') === 20, `${lesson.title}: 20 total marks`);
}

for (const q of QUESTIONS) {
  for (const s of q.subparts) {
    if (s.kind !== 'text') {
      ok(!!s.options && s.options.length >= 2, `${s.id}: options present`);
      ok(s.correct.every(c => s.options?.includes(c)), `${s.id}: every correct value exists in options`);
      if (s.kind === 'single') ok(s.correct.length === 1, `${s.id}: single has exactly one answer`);
      if (s.kind === 'multi') ok(s.correct.length >= 2, `${s.id}: multi has at least two correct answers`);
    } else {
      ok(s.options === undefined, `${s.id}: text has no options`);
    }
    ok(s.correct.length > 0 && s.correct[0].trim().length > 0, `${s.id}: correct answer non-empty`);
    ok(s.marks > 0, `${s.id}: positive marks`);
    ok(s.explanation.trim().length > 20, `${s.id}: educational explanation present`);
    ok(s.skill.trim().length > 3, `${s.id}: internal skill recorded`);
  }
}

const diffCount = (d: string) => QUESTIONS.filter(q => q.difficulty === d).length;
console.log('Difficulty:', { basic: diffCount('basic'), intermediate: diffCount('intermediate'), advanced: diffCount('advanced') });
ok(Math.abs(diffCount('basic') / 30 - 0.3) <= 0.04, 'basic close to 30%');
ok(Math.abs(diffCount('intermediate') / 30 - 0.45) <= 0.04, 'intermediate close to 45%');
ok(Math.abs(diffCount('advanced') / 30 - 0.25) <= 0.04, 'advanced close to 25%');

const base: Attempt = {
  version: 1, id: 'qa-attempt', studentName: 'سارة أحمد المحمد', startedAt: Date.now() - 3725000,
  submittedAt: Date.now(), answers: {}, current: 0,
};

const empty = gradeAttempt(base);
ok(empty.totalEarned === 0, 'empty attempt scores 0');
ok(empty.unansweredCount === TOTAL_SUBPARTS, 'empty attempt marks all subparts unanswered');
ok(empty.lessons.every(l => l.earned === 0 && l.max === 20), 'empty attempt lesson breakdown maxima 20');
ok(empty.grammar.max === 50 && empty.spelling.max === 50, 'overall maxima grammar/spelling = 50/50');

const allCorrectAnswers = Object.fromEntries(QUESTIONS.flatMap(q => q.subparts.map(s => [s.id, s.correct])));
const full = gradeAttempt({ ...base, answers: allCorrectAnswers });
ok(full.totalEarned === 100 && full.percentage === 100, 'all correct scores 100/100');
ok(full.correctCount === TOTAL_SUBPARTS && full.incorrectCount === 0 && full.unansweredCount === 0, 'correct/incorrect/unanswered counts');
ok(full.lessons.every(l => l.grammar.earned === 10 && l.spelling.earned === 10), 'full marks lesson grammar/spelling = 10/10');
ok(full.timeSeconds === 3725, 'timestamp-based elapsed time');

const partial: Record<string, string[]> = {};
const firstQ = QUESTIONS[0];
Object.assign(partial, allCorrectAnswers);
partial[firstQ.subparts[0].id] = [firstQ.subparts[0].options![1]]; // deliberately wrong
const partialResult = gradeAttempt({ ...base, answers: partial });
ok(partialResult.totalEarned === 100 - firstQ.subparts[0].marks, 'partial credit: single wrong subpart deducted exactly');
ok(partialResult.incorrectCount === 1, 'partial credit: one incorrect subpart');

const missing = { ...allCorrectAnswers } as Record<string, string[]>;
delete missing[firstQ.subparts[0].id];
const missingResult = gradeAttempt({ ...base, answers: missing });
ok(missingResult.unansweredCount === 1 && missingResult.incorrectCount === 0, 'unanswered counted separately from incorrect');

const report = buildTxtReport(full);
ok(report.startsWith('\uFEFF'), 'TXT report has UTF-8 BOM');
ok(report.includes('اسم الطالبة: سارة أحمد المحمد'), 'TXT report includes student name');
ok(report.includes('الدرجة الكلية: ١٠٠ من ١٠٠'), 'TXT report includes total score');
ok(report.includes('المصدر') || report.includes('مرجع داخلي'), 'TXT report includes internal source references');
ok(report.includes('01:02:05') || report.includes('01:02:05'), 'TXT report includes HH:MM:SS duration');
ok(report.includes('السؤال ٣٠'), 'TXT report includes all questions');
ok(!report.includes('undefined'), 'TXT report has no undefined values');

console.log(failures === 0 ? '\nALL QA CHECKS PASSED' : `\n${failures} QA CHECKS FAILED`);
if (failures > 0) process.exit(1);

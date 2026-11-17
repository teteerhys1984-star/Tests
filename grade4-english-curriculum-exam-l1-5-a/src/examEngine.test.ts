// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { passages, questions } from './examData';
import { allAnswered, calculateResults, createAttempt, elapsedAt, formatTime, loadAttempt, normalizeAnswer, partIsCorrect, questionIsAnswered, reportFilename, reportFor, saveAttempt, scoreQuestion, STORAGE_KEY } from './examEngine';

// Independent answer audit for every printed exercise used in the assessment.
const answerAudit: Record<string, string[]> = {
  'l1-01': ['meet', 'old'], 'l1-02': ["My name's Susan.", "I'm ten years old."], 'l1-03': ['False', 'True'],
  'l1-04': ['am', 'are'], 'l1-05': ['Where are you from?'], 'l1-06': ['are', 'is'],
  'l1-07': ['Adam and Allan'], 'l1-08': ['Sally is ten years old.'], 'l1-09': ["I'm from Lebanon."], 'l1-10': ['am', 'is'],
  'l2-01': ['True', 'False'], 'l2-02': ['has', 'has'], 'l2-03': ['Liza', 'James'], 'l2-04': ['read'],
  'l2-05': ['has got', 'is'], 'l2-06': ['He has got black hair.'], 'l2-07': ["He's got"],
  'l2-08': ['He is a pilot.', 'In Damascus.'], 'l2-09': ['long'], 'l2-10': ['thirty-five', 'eight'],
  'l3-01': ['6:30', '7:00'], 'l3-02': ['3:00'], 'l3-03': ['False', 'False'], 'l3-04': ['get', 'gets'],
  'l3-05': ['get', 'gets'], 'l3-06': ['watch', 'watches'], 'l3-07': ['wash', 'brush'],
  'l3-08': ["It's four o'clock."], 'l3-09': ['wakes', '5:45'], 'l3-10': ["at nine o'clock"],
  'l4-01': ['lots of rooms'], 'l4-02': ['the bedroom'], 'l4-03': ['book'], 'l4-04': ["isn't", "aren't"],
  'l4-05': ['the bedroom', 'the kitchen'], 'l4-06': ['are', 'Is'], 'l4-07': ['Is there a garage?'],
  'l4-08': ['She lives in a house.'], 'l4-09': ['Are'], 'l4-10': ['are', 'Is'],
  'l5-01': ['True', 'False'], 'l5-02': ['False', 'False'], 'l5-03': ['useful', 'interesting'],
  'l5-04': ['geography'], 'l5-05': ['My favourite subject is geography.'], 'l5-06': ['Italy', 'two brothers'],
  'l5-07': ['Bill', 'house'], 'l5-08': ['are', 'wakes'], 'l5-09': ['I like history.', "It's half past six."],
  'l5-10': ['at', 'has got'],
};

describe('curriculum and marking audit', () => {
  it('has exactly fifty unique questions, ten per lesson, in mixed order', () => {
    expect(questions).toHaveLength(50);
    expect(new Set(questions.map((question) => question.id)).size).toBe(50);
    expect(Object.keys(answerAudit)).toHaveLength(50);
    for (const lesson of [1, 2, 3, 4, 5]) expect(questions.filter((question) => question.lesson === lesson)).toHaveLength(10);
    expect(questions.slice(0, 5).map((question) => question.lesson)).toEqual([1, 3, 5, 2, 4]);
  });

  it('matches the independently audited key, source references and allocations', () => {
    for (const question of questions) {
      expect(question.parts.map((part) => part.answer), question.id).toEqual(answerAudit[question.id]);
      expect(question.parts.reduce((sum, part) => sum + part.marks, 0), question.id).toBe(2);
      expect(question.source, question.id).toMatch(/Lesson [1-5], (Pupil's Book|Workbook), p{1,2}\./);
      expect(question.source, question.id).toMatch(/Exercise|Let's Learn/);
      for (const part of question.parts) {
        expect(part.prompt.trim()).not.toBe('');
        if (part.options) expect(part.options).toContain(part.answer);
      }
    }
    expect(questions.reduce((sum, question) => sum + question.parts.reduce((partSum, part) => partSum + part.marks, 0), 0)).toBe(100);
  });

  it('uses only the listed source passages and retains key facts', () => {
    expect(Object.keys(passages).sort()).toEqual(['ahmed', 'ali', 'bill', 'dan', 'dialogue', 'house', 'john', 'sanaa']);
    expect(passages.ahmed).toContain("I'm from Lebanon, but I live in Syria.");
    expect(passages.ahmed).toContain('Adam and Allan. They are twins.');
    expect(passages.sanaa).toContain('My son Dani is ten years old.');
    expect(passages.sanaa).toContain('My daughter Tina is eight years old.');
    expect(passages.john).toContain('My dad, James, is standing behind my grandfather.');
    expect(passages.dan).toContain('He usually has lunch at half past three then he does his homework.');
    expect(passages.dan).not.toContain('has lunch at home');
    expect(passages.house.startsWith('My dream house is very big.')).toBe(true);
    expect(passages.house).not.toContain('Linda');
    expect(passages.ali).toContain('my favourite subject is geography');
    expect(passages.bill).toContain('two brothers, John and Carlos');
  });

  it('awards 100 for the audited key, zero for wrong answers and partial marks by part', () => {
    const attempt = createAttempt('A Student', 1000);
    attempt.answers = Object.fromEntries(Object.entries(answerAudit).map(([id, answers]) => [id, [...answers]]));
    expect(allAnswered(attempt.answers)).toBe(true);
    expect(calculateResults(attempt)).toMatchObject({ score: 100, correct: 50, incorrect: 0 });
    expect(calculateResults(attempt).lessonScores.map((lesson) => lesson.score)).toEqual([20, 20, 20, 20, 20]);
    const first = questions.find((question) => question.id === 'l1-01')!;
    expect(scoreQuestion(first, { [first.id]: ['meet', 'wrong'] })).toBe(1);
    expect(questionIsAnswered(first, { [first.id]: ['meet', '  '] })).toBe(false);
    const wrong = Object.fromEntries(questions.map((question) => [question.id, question.parts.map(() => 'wrong answer')]));
    expect(calculateResults({ ...attempt, answers: wrong })).toMatchObject({ score: 0, correct: 0, incorrect: 50 });
  });

  it('compares written answers without case, extra spaces, or sentence punctuation', () => {
    expect(normalizeAnswer('  WHERE   are you from?  ')).toBe('where are you from');
    const part = questions.find((question) => question.id === 'l1-05')!.parts[0];
    expect(partIsCorrect(part, 'WHERE are you from')).toBe(true);
    expect(partIsCorrect(part, 'Where you are from')).toBe(false);
  });
});

describe('timing, recovery and report', () => {
  beforeEach(() => localStorage.clear());
  it('preserves the start timestamp, question, answer and elapsed time', () => {
    const attempt = createAttempt('  Dana  ', 1000);
    attempt.currentQuestion = 5;
    attempt.answers['l1-01'] = ['meet', 'old'];
    attempt.elapsedMs = elapsedAt(attempt, 6000);
    expect(saveAttempt(attempt)).toBe(true);
    const restored = loadAttempt()!;
    expect(restored.studentName).toBe('Dana');
    expect(restored.startedAt).toBe(1000);
    expect(restored.currentQuestion).toBe(5);
    expect(restored.answers['l1-01']).toEqual(['meet', 'old']);
    expect(elapsedAt(restored, 9000)).toBe(8000);
    const submitted = { ...restored, state: 'submitted' as const, elapsedMs: 8000, submittedAt: 9000 };
    expect(elapsedAt(submitted, 19000)).toBe(8000);
    expect(formatTime(3661000)).toBe('01:01:01');
  });

  it('does not erase a damaged saved attempt', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(loadAttempt()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{bad json');
  });

  it('generates a complete, UTF-8-safe report with all questions and sources', () => {
    const attempt = { ...createAttempt('Dana Smith', 1000), state: 'submitted' as const, submittedAt: 61000, elapsedMs: 60000, answers: answerAudit };
    const report = reportFor(attempt);
    expect(reportFilename(attempt.studentName)).toBe('Grade4_English_Exam_Dana_Smith.txt');
    expect(report).toContain('Student: Dana Smith');
    expect(report).toContain('Time taken: 00:01:00');
    expect(report).toContain('Total score: 100 / 100');
    expect(report).toContain('Lesson 5: School Subjects / Revision 1 - 20 / 20');
    expect((report.match(/Question \d+ - Lesson/g) ?? [])).toHaveLength(50);
    expect((report.match(/Question marks:/g) ?? [])).toHaveLength(50);
    expect((report.match(/Source:/g) ?? [])).toHaveLength(50);
    expect(report).toContain('Student answer: Adam and Allan');
    expect(report).toContain('Correct answer: Adam and Allan');
    expect(report).toContain('Question 50 - Lesson');
    expect(new TextDecoder().decode(new TextEncoder().encode(report))).toBe(report);
  });
});
import { lessonTitles, passages, questions, type Lesson, type Question, type QuestionPart } from './examData';

export const STORAGE_KEY = 'bright-english-grade4-attempt-v1';
export const MUTE_KEY = 'bright-english-sound-muted';

export interface Attempt {
  version: 1;
  state: 'active' | 'submitted';
  studentName: string;
  currentQuestion: number;
  answers: Record<string, string[]>;
  startedAt: number;
  elapsedMs: number;
  submittedAt: number | null;
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
}

export function partIsCorrect(part: QuestionPart, answer: string): boolean {
  const value = normalizeAnswer(answer);
  return value.length > 0 && [part.answer, ...(part.accepted ?? [])].some((candidate) => normalizeAnswer(candidate) === value);
}

export function questionIsAnswered(question: Question, answers: Record<string, string[]>): boolean {
  const values = answers[question.id] ?? [];
  return question.parts.every((_, index) => Boolean(values[index]?.trim()));
}

export function allAnswered(answers: Record<string, string[]>): boolean {
  return questions.every((question) => questionIsAnswered(question, answers));
}

export function scoreQuestion(question: Question, answers: Record<string, string[]>): number {
  return question.parts.reduce((score, part, index) => score + (partIsCorrect(part, answers[question.id]?.[index] ?? '') ? part.marks : 0), 0);
}

export function calculateResults(attempt: Attempt) {
  const earned = questions.map((question) => scoreQuestion(question, attempt.answers));
  const score = earned.reduce((total, marks) => total + marks, 0);
  const correct = earned.filter((marks) => marks === 2).length;
  const lessonScores = ([1, 2, 3, 4, 5] as Lesson[]).map((lesson) => ({
    lesson,
    title: lessonTitles[lesson],
    score: questions.filter((question) => question.lesson === lesson).reduce((total, question) => total + scoreQuestion(question, attempt.answers), 0),
  }));
  return { score, correct, incorrect: questions.length - correct, lessonScores };
}

export function elapsedAt(attempt: Attempt, now = Date.now()): number {
  return attempt.state === 'submitted' ? attempt.elapsedMs : Math.max(attempt.elapsedMs, now - attempt.startedAt, 0);
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60].map((value) => String(value).padStart(2, '0')).join(':');
}

export function createAttempt(studentName: string, now = Date.now()): Attempt {
  return { version: 1, state: 'active', studentName: studentName.trim(), currentQuestion: 0, answers: {}, startedAt: now, elapsedMs: 0, submittedAt: null };
}

export function loadAttempt(): Attempt | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    if (!value || typeof value !== 'object') throw new Error('Invalid attempt');
    const attempt = value as Attempt;
    if (attempt.version !== 1 || !['active', 'submitted'].includes(attempt.state) || typeof attempt.studentName !== 'string' || !attempt.studentName.trim() || typeof attempt.startedAt !== 'number' || typeof attempt.elapsedMs !== 'number' || typeof attempt.currentQuestion !== 'number' || !attempt.answers || typeof attempt.answers !== 'object') throw new Error('Invalid attempt');
    return { ...attempt, currentQuestion: Math.min(questions.length - 1, Math.max(0, Math.floor(attempt.currentQuestion))) };
  } catch {
    // Do not replace or erase a saved record that could not be read.
    return null;
  }
}

export function saveAttempt(attempt: Attempt): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    return true;
  } catch {
    return false;
  }
}

export function reportFor(attempt: Attempt): string {
  const result = calculateResults(attempt);
  const submitted = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }) : 'Not submitted';
  const lines = [
    'GRADE 4 ENGLISH EXAM - UNIT 1',
    'Lessons 1-5',
    '========================================',
    `Student: ${attempt.studentName}`,
    'Grade: 4',
    'Lessons covered: 1, 2, 3, 4 and 5',
    `Submitted: ${submitted}`,
    `Time taken: ${formatTime(attempt.elapsedMs)}`,
    `Total score: ${result.score} / 100`,
    `Fully correct questions: ${result.correct} / 50`,
    `Incorrect or partially correct questions: ${result.incorrect} / 50`,
    '',
    'LESSON SCORES',
    ...result.lessonScores.map((lesson) => `Lesson ${lesson.lesson}: ${lesson.title} - ${lesson.score} / 20`),
    '',
    'DETAILED REVIEW',
    '========================================',
  ];
  questions.forEach((question, index) => {
    lines.push('', `Question ${index + 1} - Lesson ${question.lesson}: ${lessonTitles[question.lesson]}`, question.prompt);
    if (question.wordBank) lines.push(`Word bank: ${question.wordBank}`);
    if (question.passage) lines.push(`Reading: ${passages[question.passage]}`);
    if (question.image) lines.push(`Image: ${question.image.alt}`);
    question.parts.forEach((part, partIndex) => {
      const answer = attempt.answers[question.id]?.[partIndex] || '(no answer)';
      lines.push(`  ${question.parts.length > 1 ? `Part ${String.fromCharCode(65 + partIndex)}: ` : ''}${part.prompt}`);
      if (part.options) lines.push(`  Choices: ${part.options.join(' / ')}`);
      lines.push(`  Student answer: ${answer}`, `  Correct answer: ${part.answer}`, `  Marks: ${partIsCorrect(part, answer) ? part.marks : 0} / ${part.marks}`);
    });
    lines.push(`Question marks: ${scoreQuestion(question, attempt.answers)} / 2`, `Explanation: ${question.explanation}`, `Source: ${question.source}`);
  });
  return `${lines.join('\n')}\n`;
}

export function reportFilename(name: string): string {
  const safeName = name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^_+|_+$/g, '') || 'Student';
  return `Grade4_English_Exam_${safeName}.txt`;
}

export function playChime(kind: 'start' | 'submit', muted: boolean): void {
  if (muted) return;
  try {
    const context = new AudioContext();
    const frequencies = kind === 'start' ? [523.25, 659.25, 783.99] : [783.99, 659.25, 1046.5];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const begin = context.currentTime + index * 0.11;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, begin);
      gain.gain.exponentialRampToValueAtTime(0.12, begin + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, begin + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(begin);
      oscillator.stop(begin + 0.23);
    });
    window.setTimeout(() => { void context.close(); }, 1000);
  } catch {
    // The exam remains usable if audio is not supported by the browser.
  }
}
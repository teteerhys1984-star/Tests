import { questions, EXAM_META } from '../data/questions';
import type { Question, SubQuestion } from '../data/types';

export type Verdict = 'true' | 'false';
export interface JustifyAnswer {
  verdict?: Verdict;
  reason?: string;
}
export type AnswerValue = string | string[] | Record<string, string> | JustifyAnswer;
export type Answers = Record<string, AnswerValue>;
export type OptionOrder = Record<string, string[]>;

export interface SubResult {
  subId: string;
  questionId: string;
  answered: boolean;
  earned: number;
  marks: number;
  status: 'correct' | 'partial' | 'incorrect' | 'unanswered';
  studentText: string;
  correctText: string;
  sub: SubQuestion;
}

export interface QuestionResult {
  question: Question;
  earned: number;
  marks: number;
  status: 'correct' | 'partial' | 'incorrect' | 'unanswered';
  subs: SubResult[];
}

export interface ExamResult {
  subs: Record<string, SubResult>;
  questions: QuestionResult[];
  earned: number;
  max: number;
  percentage: number;
  counts: { correct: number; partial: number; incorrect: number; unanswered: number };
}

/* ------------------------------------------------------------------ */
/* Exact rational arithmetic helpers (no floating-point grading)      */
/* ------------------------------------------------------------------ */

interface Rational {
  n: bigint;
  d: bigint;
}

const abs = (v: bigint) => (v < 0n ? -v : v);

function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x === 0n ? 1n : x;
}

function rational(n: bigint, d: bigint): Rational | null {
  if (d === 0n) return null;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  if (n === 0n) return { n: 0n, d: 1n };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

const WESTERN = '0123456789';
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const i = ARABIC_INDIC.indexOf(ch);
    if (i >= 0) return WESTERN[i];
    const j = EASTERN_ARABIC.indexOf(ch);
    return j >= 0 ? WESTERN[j] : ch;
  });
}

function cleanRaw(raw: string): string {
  return normalizeDigits(raw)
    .replace(/[−–—]/g, '-')
    .replace(/[٬،]/g, ',')
    .replace(/\u00a0|\u202f|_/g, ' ')
    .replace(/٫/g, '.')
    .replace(/\u066c/g, '')
    .trim();
}

/** Parse a simple decimal/integer/fraction into an exact rational. */
function parseSimple(text: string): Rational | null {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return null;

  const latexFraction = t.match(/^\\(?:d?frac|tfrac)\s*\{\s*(-?\d+)\s*\}\s*\{\s*(-?\d+)\s*\}$/);
  if (latexFraction) return rational(BigInt(latexFraction[1]), BigInt(latexFraction[2]));

  const mixed = t.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1n : 1n;
    const whole = BigInt(mixed[2]);
    const num = BigInt(mixed[3]);
    const den = BigInt(mixed[4]);
    if (den === 0n) return null;
    return rational(sign * (whole * den + num), den);
  }

  const fraction = t.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const sign = fraction[1] === '-' ? -1n : 1n;
    return rational(sign * BigInt(fraction[2]), BigInt(fraction[3]));
  }

  const decimal = t.match(/^([+-]?)(\d*\.?\d+)(?:[eE]([+-]?\d+))?$/);
  if (!decimal) return null;
  const sign = decimal[1] === '-' ? -1n : 1n;
  const mantissa = decimal[2];
  const exponent = decimal[3] ? parseInt(decimal[3], 10) : 0;
  const [whole, frac = ''] = mantissa.split('.');
  const digits = (whole || '0') + frac;
  const n = BigInt(digits || '0');
  const scale = frac.length - exponent;
  if (scale >= 0) return rational(sign * n, 10n ** BigInt(scale));
  return rational(sign * n * 10n ** BigInt(-scale), 1n);
}

/** Exact candidates: supports comma as decimal separator or thousands separator. */
export function parseRationalVariants(raw: string): Rational[] {
  const cleaned = cleanRaw(raw);
  if (!cleaned) return [];
  const candidates = new Set<string>();
  candidates.add(cleaned);
  if (cleaned.includes(',')) {
    candidates.add(cleaned.replace(/,/g, ''));
    if ((cleaned.match(/,/g) || []).length === 1 && !cleaned.includes('.')) {
      candidates.add(cleaned.replace(/,/g, '.'));
    }
  }
  if (cleaned.includes(' ')) candidates.add(cleaned.replace(/\s+/g, ''));

  const out: Rational[] = [];
  for (const candidate of candidates) {
    const parsed = parseSimple(candidate);
    if (parsed && !out.some((r) => sameRational(r, parsed))) out.push(parsed);
  }
  return out;
}

function sameRational(a: Rational, b: Rational) {
  return a.n === b.n && a.d === b.d;
}

export function isEquivalentTo(raw: string, expected: string): boolean {
  const variants = parseRationalVariants(raw);
  const targets = parseRationalVariants(expected);
  if (variants.length === 0 || targets.length === 0) return false;
  return variants.some((v) => targets.some((t) => sameRational(v, t)));
}

export function formatRational(raw: string): string {
  const rationals = parseRationalVariants(raw);
  if (rationals.length === 0) return raw;
  const r = rationals[0];
  return r.d === 1n ? r.n.toString() : `${r.n.toString()}/${r.d.toString()}`;
}

/* ------------------------------------------------------------------ */
/* Exam validation                                                    */
/* ------------------------------------------------------------------ */

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  totalMarks: number;
  questionCount: number;
  branchedCount: number;
  difficultyCounts: Record<string, number>;
  subpartCount: number;
}

export function validateExam(): ValidationReport {
  const errors: string[] = [];
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const subpartCount = questions.reduce((sum, q) => sum + q.subparts.length, 0);
  const branchedCount = questions.filter((q) => q.subparts.length > 1).length;

  if (questions.length !== 15) errors.push(`عدد الأسئلة الرئيسة ${questions.length} وليس 15.`);
  if (totalMarks !== 100) errors.push(`مجموع العلامات ${totalMarks} وليس 100.`);
  if (branchedCount < 11) errors.push(`عدد الأسئلة المتفرعة ${branchedCount} أقل من 11.`);

  const difficultyCounts: Record<string, number> = {};
  for (const q of questions) {
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] ?? 0) + 1;
    const subTotal = q.subparts.reduce((sum, part) => sum + part.marks, 0);
    if (subTotal !== q.marks) errors.push(`مجموع أجزاء ${q.id} هو ${subTotal} لا يساوي ${q.marks}.`);
    if (q.subparts.length < 2 || q.subparts.length > 5) errors.push(`${q.id}: عدد الأجزاء خارج النطاق 2–5.`);
    for (const part of q.subparts) {
      if (!part.source?.unit || !part.source?.lesson || !part.source?.page) {
        errors.push(`${part.id}: مرجع مصدر غير مكتمل.`);
      }
      if (!part.solution || !part.rationale || !part.marking || !part.commonMistakes) {
        errors.push(`${part.id}: بيانات تصحيح ناقصة.`);
      }
      if (part.kind === 'fields') {
        const fieldMarks = (part.fields ?? []).reduce((sum, f) => sum + f.marks, 0);
        if (fieldMarks !== part.marks) errors.push(`${part.id}: علامات الحقول ${fieldMarks} لا تساوي ${part.marks}.`);
        for (const field of part.fields ?? []) {
          if (parseRationalVariants(field.expected).length === 0) {
            errors.push(`${part.id}/${field.id}: قيمة متوقعة غير صالحة.`);
          }
        }
      }
      if (part.kind === 'rational' && parseRationalVariants(part.expectedRational ?? '').length === 0) {
        errors.push(`${part.id}: إجابة متوقعة غير صالحة.`);
      }
      if (part.kind === 'mcq') {
        if (!part.options?.length) errors.push(`${part.id}: لا توجد خيارات.`);
        if (!part.options?.some((o) => o.id === part.correctOption)) {
          errors.push(`${part.id}: الخيار الصحيح غير موجود.`);
        }
      }
      if (part.kind === 'justify') {
        if (!part.reasons?.some((o) => o.id === part.correctReason)) {
          errors.push(`${part.id}: التبرير الصحيح غير موجود.`);
        }
        if (!part.correctVerdict) errors.push(`${part.id}: حكم الصواب/الخطأ غير محدد.`);
      }
      if (part.kind === 'order') {
        const ids = new Set((part.items ?? []).map((i) => i.id));
        if (ids.size !== (part.correctOrder ?? []).length || !(part.correctOrder ?? []).every((id) => ids.has(id))) {
          errors.push(`${part.id}: ترتيب الإجابة غير متوافق مع العناصر.`);
        }
      }
    }
  }
  if (difficultyCounts.foundational !== 3) errors.push('عدد الأسئلة التمهيدية ليس 3.');
  if (difficultyCounts.intermediate !== 5) errors.push('عدد الأسئلة المتوسطة ليس 5.');
  if (difficultyCounts.advanced !== 5) errors.push('عدد الأسئلة التطبيقية المتقدمة ليس 5.');
  if (difficultyCounts.reasoning !== 2) errors.push('عدد أسئلة التحليل ليس 2.');

  return {
    ok: errors.length === 0 && totalMarks === 100,
    errors,
    totalMarks,
    questionCount: questions.length,
    branchedCount,
    difficultyCounts,
    subpartCount,
  };
}

export const validation = validateExam();

/* ------------------------------------------------------------------ */
/* Answer status and grading                                          */
/* ------------------------------------------------------------------ */

export function isPartAnswered(part: SubQuestion, answer: AnswerValue | undefined): boolean {
  if (answer === undefined || answer === null) return false;
  if (part.kind === 'rational' || part.kind === 'mcq') {
    return typeof answer === 'string' && answer.trim().length > 0;
  }
  if (part.kind === 'fields') {
    if (typeof answer !== 'object' || Array.isArray(answer)) return false;
    return (part.fields ?? []).every((field) => {
      const value = (answer as Record<string, string>)[field.id];
      return typeof value === 'string' && value.trim().length > 0;
    });
  }
  if (part.kind === 'order') {
    return Array.isArray(answer) && answer.length === (part.items ?? []).length;
  }
  if (part.kind === 'justify') {
    const value = answer as JustifyAnswer;
    return (value.verdict === 'true' || value.verdict === 'false') && !!value.reason;
  }
  return false;
}

export function countUnanswered(answers: Answers): number {
  let count = 0;
  for (const q of questions) {
    for (const part of q.subparts) {
      if (!isPartAnswered(part, answers[part.id])) count += 1;
    }
  }
  return count;
}

function displayExpected(raw: string): string {
  return normalizeDigits(raw).trim().replace(/\s+/g, ' ');
}

function valuesFor(part: SubQuestion, answer: AnswerValue | undefined, mode: 'student' | 'correct'): string {
  const source = mode === 'student' ? answer : undefined;
  if (part.kind === 'rational') {
    if (mode === 'correct') return displayExpected(part.expectedRational ?? '');
    return typeof source === 'string' ? source : '';
  }
  if (part.kind === 'mcq') {
    if (mode === 'student') {
      const selected = part.options?.find((o) => o.id === source);
      return selected ? selected.text : '';
    }
    return part.options?.find((o) => o.id === part.correctOption)?.text ?? '';
  }
  if (part.kind === 'fields') {
    const fieldText = (fid: string, val: string) => {
      const field = part.fields?.find((f) => f.id === fid);
      if (!field) return val;
      return `${field.label}: ${val}`;
    };
    if (mode === 'student') {
      if (!source || typeof source !== 'object' || Array.isArray(source)) return '';
      return Object.entries(source as Record<string, string>)
        .map(([fid, val]) => fieldText(fid, val || '—'))
        .join(' | ');
    }
    return (part.fields ?? []).map((f) => `${f.label}: ${displayExpected(f.expected)}`).join(' | ');
  }
  if (part.kind === 'order') {
    const ids = mode === 'student' ? (Array.isArray(source) ? (source as string[]) : []) : (part.correctOrder ?? []);
    return ids.map((id) => part.items?.find((i) => i.id === id)?.text ?? id).join(' ← ');
  }
  if (part.kind === 'justify') {
    if (mode === 'student') {
      if (!source || typeof source !== 'object' || Array.isArray(source)) return '';
      const value = source as JustifyAnswer;
      const verdict = value.verdict === 'true' ? 'موافق' : value.verdict === 'false' ? 'غير موافق' : '';
      const reason = part.reasons?.find((r) => r.id === value.reason)?.text ?? '';
      return `${verdict}${reason ? ` — ${reason}` : ''}`;
    }
    const verdict = part.correctVerdict === 'true' ? 'موافق' : 'غير موافق';
    const reason = part.reasons?.find((r) => r.id === part.correctReason)?.text ?? '';
    return `${verdict} — ${reason}`;
  }
  return '';
}

export function correctAnswerText(part: SubQuestion): string {
  return valuesFor(part, undefined, 'correct');
}

export function studentAnswerText(part: SubQuestion, answer: AnswerValue | undefined): string {
  return valuesFor(part, answer, 'student');
}

function gradePart(part: SubQuestion, answer: AnswerValue | undefined): SubResult {
  const answered = isPartAnswered(part, answer);
  let earned = 0;

  if (answered) {
    if (part.kind === 'rational') {
      if (isEquivalentTo(String(answer), part.expectedRational ?? '')) earned = part.marks;
    } else if (part.kind === 'mcq') {
      if (answer === part.correctOption) earned = part.marks;
    } else if (part.kind === 'order') {
      const chosen = answer as string[];
      const correct = part.correctOrder ?? [];
      if (chosen.length === correct.length && chosen.every((v, i) => v === correct[i])) earned = part.marks;
    } else if (part.kind === 'fields') {
      const values = answer as Record<string, string>;
      for (const field of part.fields ?? []) {
        if (isEquivalentTo(values[field.id] ?? '', field.expected)) earned += field.marks;
      }
    } else if (part.kind === 'justify') {
      const value = answer as JustifyAnswer;
      const verdictMark = part.marks >= 2 ? Math.floor(part.marks / 2) : part.marks;
      const reasonMark = part.marks - verdictMark;
      if (value.verdict === part.correctVerdict) earned += verdictMark;
      if (value.reason === part.correctReason) earned += reasonMark;
    }
  }

  earned = Math.max(0, Math.min(part.marks, earned));
  const status = !answered
    ? 'unanswered'
    : earned === part.marks
      ? 'correct'
      : earned > 0
        ? 'partial'
        : 'incorrect';

  return {
    subId: part.id,
    questionId: '',
    answered,
    earned,
    marks: part.marks,
    status,
    studentText: answered ? studentAnswerText(part, answer) : '—',
    correctText: correctAnswerText(part),
    sub: part,
  };
}

export function gradeExam(answers: Answers): ExamResult {
  const subs: Record<string, SubResult> = {};
  const questionResults: QuestionResult[] = [];
  const counts = { correct: 0, partial: 0, incorrect: 0, unanswered: 0 };

  for (const question of questions) {
    const subResults: SubResult[] = [];
    for (const part of question.subparts) {
      const result = gradePart(part, answers[part.id]);
      result.questionId = question.id;
      subs[part.id] = result;
      subResults.push(result);
      counts[result.status] += 1;
    }
    const earned = subResults.reduce((sum, r) => sum + r.earned, 0);
    const allUnanswered = subResults.every((r) => r.status === 'unanswered');
    const allCorrect = subResults.every((r) => r.status === 'correct');
    const noMarks = subResults.every((r) => r.earned === 0);
    const status: QuestionResult['status'] = allUnanswered
      ? 'unanswered'
      : allCorrect
        ? 'correct'
        : noMarks
          ? 'incorrect'
          : 'partial';
    questionResults.push({ question, earned, marks: question.marks, status, subs: subResults });
  }

  const max = questions.reduce((sum, q) => sum + q.marks, 0);
  const earned = questionResults.reduce((sum, q) => sum + q.earned, 0);
  return {
    subs,
    questions: questionResults,
    earned,
    max,
    percentage: max === 0 ? 0 : Math.round((earned / max) * 1000) / 10,
    counts,
  };
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildOptionOrder(): OptionOrder {
  const order: OptionOrder = {};
  for (const question of questions) {
    for (const part of question.subparts) {
      if (part.kind === 'mcq') order[part.id] = shuffle(part.options ?? []).map((o) => o.id);
      if (part.kind === 'justify') order[part.id] = shuffle(part.reasons ?? []).map((o) => o.id);
      if (part.kind === 'order') order[part.id] = shuffle(part.items ?? []).map((o) => o.id);
    }
  }
  return order;
}

export const DIFFICULTY_LABEL = {
  foundational: 'تمهيدي',
  intermediate: 'متوسط',
  advanced: 'تطبيقي متقدّم',
  reasoning: 'تفكير وتحليل',
} as const;

export function marksWord(marks: number): string {
  if (marks === 1) return 'درجة';
  if (marks === 2) return 'درجتان';
  if (marks >= 3 && marks <= 10) return 'درجات';
  return 'درجة';
}

export { questions, EXAM_META };

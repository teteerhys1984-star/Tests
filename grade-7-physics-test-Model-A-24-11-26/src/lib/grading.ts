import type {
  Answers,
  Criterion,
  CriterionOutcome,
  ExamResult,
  Input,
  InputResult,
  InputStatus,
  Part,
  PartResult,
  Question,
  QuestionResult,
} from '../types';
import { normalizeArabic, parseNumber } from './normalize';

/** علامات الحقل الواحد (مجموع علامات مكوّناته) */
export function inputMaxMarks(input: Input): number {
  switch (input.kind) {
    case 'choice':
    case 'text':
      return input.marks;
    case 'tf':
      return input.verdictMarks + (input.correction ? input.correction.marks : 0);
    case 'number':
      return input.marks + (input.unit ? input.unit.marks : 0) + (input.steps ? input.steps.marks : 0);
    case 'matrix':
      return input.rows.length * input.marksPerRow;
  }
}

export function partMaxMarks(part: Part): number {
  return part.inputs.reduce((s, i) => s + inputMaxMarks(i), 0);
}

export function questionMaxMarks(q: Question): number {
  return q.parts.reduce((s, p) => s + partMaxMarks(p), 0);
}

export function examMaxMarks(questions: Question[]): number {
  return questions.reduce((s, q) => s + questionMaxMarks(q), 0);
}

export function regexFor(pattern: string): RegExp {
  const p = normalizeArabic(pattern);
  try {
    return new RegExp(p, 'u');
  } catch {
    return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u');
  }
}

/** هل تحقق معيار نصي؟ any: يكفي نمط واحد — all: كل الأنماط — none: لا يظهر أي منها */
export function criterionMet(normalizedText: string, c: Criterion): boolean {
  if (c.any && c.any.length && !c.any.some((p) => regexFor(p).test(normalizedText))) return false;
  if (c.all && !c.all.every((p) => regexFor(p).test(normalizedText))) return false;
  if (c.none && !c.none.every((p) => !regexFor(p).test(normalizedText))) return false;
  return true;
}

export function gradeCriteria(text: string, criteria: Criterion[]): { marks: number; details: CriterionOutcome[] } {
  const norm = normalizeArabic(text);
  const details = criteria.map((c) => ({ label: c.label, marks: c.marks, earned: criterionMet(norm, c) ? c.marks : 0 }));
  return { marks: details.reduce((s, d) => s + d.earned, 0), details };
}

const get = (answers: Answers, key: string): string => (answers[key] ?? '').toString();

/** هل أُجيب عن الحقل بشكل مكتمل؟ */
export function isInputComplete(input: Input, answers: Answers): boolean {
  switch (input.kind) {
    case 'choice':
    case 'text':
      return get(answers, input.id).trim().length > 0;
    case 'tf': {
      const v = get(answers, `${input.id}:verdict`);
      if (!v) return false;
      if (v === 'false' && input.correction) return get(answers, `${input.id}:correction`).trim().length > 0;
      return true;
    }
    case 'number': {
      if (!get(answers, `${input.id}:value`).trim()) return false;
      if (input.unit && !get(answers, `${input.id}:unit`).trim()) return false;
      if (input.steps && !get(answers, `${input.id}:steps`).trim()) return false;
      return true;
    }
    case 'matrix':
      return input.rows.every((r) => get(answers, `${input.id}:${r.id}`).trim().length > 0);
  }
}

export function isPartComplete(part: Part, answers: Answers): boolean {
  return part.inputs.every((i) => isInputComplete(i, answers));
}

export function isQuestionComplete(q: Question, answers: Answers): boolean {
  return q.parts.every((p) => isPartComplete(p, answers));
}

/** عدد الفروع غير المكتملة */
export function incompleteParts(questions: Question[], answers: Answers): number {
  let n = 0;
  questions.forEach((q) => q.parts.forEach((p) => { if (!isPartComplete(p, answers)) n++; }));
  return n;
}

export function totalParts(questions: Question[]): number {
  return questions.reduce((s, q) => s + q.parts.length, 0);
}

function statusFor(marks: number, max: number, answered: boolean): InputStatus {
  if (!answered) return 'empty';
  if (marks >= max) return 'correct';
  if (marks <= 0) return 'wrong';
  return 'partial';
}

export function modelTextForInput(input: Input): string {
  switch (input.kind) {
    case 'choice':
      return input.options.find((o) => o.id === input.answer)?.label ?? '';
    case 'tf': {
      const v = input.answer === 'true' ? 'العبارة صحيحة.' : 'العبارة خاطئة.';
      return input.correction ? `${v} ${input.correction.model}` : v;
    }
    case 'text':
      return input.model;
    case 'number':
      return input.model;
    case 'matrix':
      return input.rows.map((r) => `${r.label}: ${input.columns.find((c) => c.id === r.answer)?.label ?? r.answer}`).join('؛ ');
  }
}

export function studentTextForInput(input: Input, answers: Answers): string {
  switch (input.kind) {
    case 'choice': {
      const v = get(answers, input.id);
      return v ? (input.options.find((o) => o.id === v)?.label ?? v) : '';
    }
    case 'tf': {
      const v = get(answers, `${input.id}:verdict`);
      if (!v) return '';
      const verdict = v === 'true' ? 'صحيحة' : 'خاطئة';
      const corr = get(answers, `${input.id}:correction`);
      return corr ? `(${verdict}) التصحيح: ${corr}` : `(${verdict})`;
    }
    case 'text':
      return get(answers, input.id);
    case 'number': {
      const val = get(answers, `${input.id}:value`);
      const unit = get(answers, `${input.id}:unit`);
      const steps = get(answers, `${input.id}:steps`);
      const parts: string[] = [];
      if (steps) parts.push(`خطوات الحل: ${steps}`);
      if (val) parts.push(`${val}${unit ? ` ${unit}` : ''}`);
      return parts.join(' — ');
    }
    case 'matrix':
      return input.rows
        .map((r) => {
          const v = get(answers, `${input.id}:${r.id}`);
          return `${r.label}: ${v ? (input.columns.find((c) => c.id === v)?.label ?? v) : '—'}`;
        })
        .join('؛ ');
  }
}

export function gradeInput(input: Input, answers: Answers): InputResult {
  const max = inputMaxMarks(input);
  const base = { inputId: input.id, kind: input.kind, max, modelText: modelTextForInput(input) };
  switch (input.kind) {
    case 'choice': {
      const v = get(answers, input.id);
      const marks = v === input.answer ? input.marks : 0;
      return { ...base, marks, status: statusFor(marks, max, !!v), studentText: studentTextForInput(input, answers), criteria: [] };
    }
    case 'tf': {
      const v = get(answers, `${input.id}:verdict`);
      const corr = get(answers, `${input.id}:correction`);
      let marks = 0;
      const criteria: CriterionOutcome[] = [];
      if (v === input.answer) marks += input.verdictMarks;
      if (input.correction && input.answer === 'false' && v === 'false') {
        const g = gradeCriteria(corr, input.correction.criteria);
        marks += g.marks;
        criteria.push(...g.details);
      }
      return { ...base, marks, status: statusFor(marks, max, !!v), studentText: studentTextForInput(input, answers), criteria };
    }
    case 'text': {
      const v = get(answers, input.id);
      const g = gradeCriteria(v, input.criteria);
      return { ...base, marks: g.marks, status: statusFor(g.marks, max, v.trim().length > 0), studentText: v, criteria: g.details };
    }
    case 'number': {
      const raw = get(answers, `${input.id}:value`);
      const unit = get(answers, `${input.id}:unit`);
      const steps = get(answers, `${input.id}:steps`);
      let marks = 0;
      const criteria: CriterionOutcome[] = [];
      const tol = input.tolerance ?? Math.max(0.001, Math.abs(input.answer) * 0.001);
      const value = parseNumber(raw);
      const valueOk = value !== null && Math.abs(value - input.answer) <= tol;
      if (valueOk) marks += input.marks;
      if (input.unit) {
        const ok = unit === input.unit.answer;
        if (ok) marks += input.unit.marks;
        criteria.push({ label: `الوحدة الصحيحة (${input.unit.answer})`, marks: input.unit.marks, earned: ok ? input.unit.marks : 0 });
      }
      if (input.steps) {
        const norm = normalizeArabic(steps);
        const ok = input.steps.all.every((p) => regexFor(p).test(norm));
        if (ok) marks += input.steps.marks;
        criteria.push({ label: input.steps.label, marks: input.steps.marks, earned: ok ? input.steps.marks : 0 });
      }
      const answered = !!(raw || unit || steps);
      return { ...base, marks, status: statusFor(marks, max, answered), studentText: studentTextForInput(input, answers), criteria };
    }
    case 'matrix': {
      const rows = input.rows.map((r) => {
        const v = get(answers, `${input.id}:${r.id}`);
        const earned = v === r.answer ? input.marksPerRow : 0;
        const model = input.columns.find((c) => c.id === r.answer)?.label ?? r.answer;
        return { label: r.label, student: v ? (input.columns.find((c) => c.id === v)?.label ?? v) : '—', model, earned, marks: input.marksPerRow };
      });
      const marks = rows.reduce((s, r) => s + r.earned, 0);
      const answered = rows.some((r) => r.student !== '—');
      return { ...base, marks, status: statusFor(marks, max, answered), studentText: studentTextForInput(input, answers), criteria: [], rows };
    }
  }
}

export function gradePart(part: Part, answers: Answers): PartResult {
  const inputs = part.inputs.map((i) => gradeInput(i, answers));
  return { partId: part.id, marks: inputs.reduce((s, i) => s + i.marks, 0), max: inputs.reduce((s, i) => s + i.max, 0), inputs };
}

export function gradeQuestion(q: Question, answers: Answers): QuestionResult {
  const parts = q.parts.map((p) => gradePart(p, answers));
  return { questionId: q.id, marks: parts.reduce((s, p) => s + p.marks, 0), max: parts.reduce((s, p) => s + p.max, 0), parts };
}

export function gradeExam(questions: Question[], answers: Answers): ExamResult {
  const qs = questions.map((q) => gradeQuestion(q, answers));
  const total = qs.reduce((s, q) => s + q.marks, 0);
  const max = qs.reduce((s, q) => s + q.max, 0);
  let partsCorrect = 0;
  let partsPartial = 0;
  let partsWrong = 0;
  qs.forEach((q) =>
    q.parts.forEach((p) => {
      if (p.marks >= p.max && p.max > 0) partsCorrect++;
      else if (p.marks > 0) partsPartial++;
      else partsWrong++;
    }),
  );
  return { total, max, percentage: max ? Math.round((total / max) * 1000) / 10 : 0, questions: qs, partsCorrect, partsPartial, partsWrong, partsTotal: totalParts(questions) };
}

/** توليد إجابة كاملة صحيحة من المفتاح (لاختبار منطق التصحيح) */
export function buildPerfectAnswers(questions: Question[]): Answers {
  const a: Answers = {};
  questions.forEach((q) =>
    q.parts.forEach((p) =>
      p.inputs.forEach((input) => {
        switch (input.kind) {
          case 'choice':
            a[input.id] = input.answer;
            break;
          case 'text':
            a[input.id] = input.model;
            break;
          case 'tf':
            a[`${input.id}:verdict`] = input.answer;
            if (input.correction) a[`${input.id}:correction`] = input.correction.model;
            break;
          case 'number':
            a[`${input.id}:value`] = String(input.answer);
            if (input.unit) a[`${input.id}:unit`] = input.unit.answer;
            if (input.steps) a[`${input.id}:steps`] = input.steps.model;
            break;
          case 'matrix':
            input.rows.forEach((r) => {
              a[`${input.id}:${r.id}`] = r.answer;
            });
            break;
        }
      }),
    ),
  );
  return a;
}

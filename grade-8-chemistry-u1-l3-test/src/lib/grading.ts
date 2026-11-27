import { ALL_PARTS, QUESTIONS } from '../data/exam';
import {
  chargeBalance,
  formulaToUnicode,
  isCorrectFormula,
  isCorrectIon,
  parseFormula,
  parseInteger,
  plainChemText,
} from './chemistry';
import type { AnswerValue, Answers, Criterion, ExamResult, Field, Part, PartResult } from './types';

export const roundMarks = (n: number) => Math.round(n * 100) / 100;

export function hasAnyAnswer(part: Part, value: AnswerValue | undefined): boolean {
  const r = part.response;
  if (r.kind === 'choice' || r.kind === 'number') return typeof value === 'string' && value.trim().length > 0;
  if (r.kind === 'order') return Array.isArray(value) && value.some(v => typeof v === 'string' && v.trim().length > 0);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (r.kind === 'matching') return r.rows.some(row => !!value[row.id]?.trim());
  if (r.kind === 'fields') return r.fields.some(field => !!value[field.id]?.trim());
  return r.rows.some(
    row => value[row.id] === 'true' || value[row.id] === 'false' || !!value[`${row.id}.correction`]?.trim(),
  );
}

export function isPartComplete(part: Part, value: AnswerValue | undefined): boolean {
  const r = part.response;
  if (r.kind === 'choice' || r.kind === 'number') return typeof value === 'string' && value.trim().length > 0;
  if (r.kind === 'order') return Array.isArray(value) && value.length === r.correct.length && value.every(v => typeof v === 'string' && v.trim().length > 0);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (r.kind === 'matching') return r.rows.every(row => !!value[row.id]?.trim());
  if (r.kind === 'fields') return r.fields.every(field => !!value[field.id]?.trim());
  return r.rows.every(row => value[row.id] === 'true' || (value[row.id] === 'false' && !!value[`${row.id}.correction`]?.trim()));
}

export const completedCount = (answers: Answers) => ALL_PARTS.filter(p => isPartComplete(p, answers[p.id])).length;
export const isExamComplete = (answers: Answers) => completedCount(answers) === ALL_PARTS.length;

export function firstIncompleteQuestion(answers: Answers): number {
  return Math.max(0, QUESTIONS.findIndex(q => q.parts.some(p => !isPartComplete(p, answers[p.id]))));
}

export function firstIncompletePartId(answers: Answers): string | null {
  for (const q of QUESTIONS) {
    const missing = q.parts.find(p => !isPartComplete(p, answers[p.id]));
    if (missing) return missing.id;
  }
  return null;
}

function fieldCorrect(field: Field, value: string, spec: Extract<Part['response'], { kind: 'fields' }>): boolean {
  if (field.kind === 'number') return parseInteger(value) === field.answer;
  if (field.kind === 'formula') {
    if (field.id === 'cation') return isCorrectIon(value, String(field.answer));
    if (field.id === 'anion') return isCorrectIon(value, String(field.answer));
    return isCorrectFormula(value, spec.correctFormula || String(field.answer));
  }
  return value === field.answer;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export function answerText(part: Part, value: AnswerValue | undefined, correct = false): string {
  if (!correct && !hasAnyAnswer(part, value)) return 'لم تُحدّد إجابة';
  const r = part.response;
  const option = (options: { id: string; label: string }[], id: string) =>
    plainChemText(options.find(o => o.id === id)?.label || 'لم تُحدّد إجابة');
  if (r.kind === 'choice') return option(r.options, correct ? r.correct : String(value || ''));
  if (r.kind === 'number') {
    if (correct) return String(r.answer);
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed || 'لم تُحدّد إجابة';
  }
  if (r.kind === 'order') {
    const ids = correct ? r.correct : Array.isArray(value) ? value : [];
    return r.correct.map((_, i) => `${i + 1}. ${option(r.items, ids[i] || '')}`).join(' ← ');
  }
  const record = typeof value === 'object' && value && !Array.isArray(value) ? value : {};
  if (r.kind === 'matching') {
    return r.rows
      .map(row => {
        const prefix = row.formula ? formulaToUnicode(row.formula) : '';
        const head = prefix && row.label ? `${prefix} ${row.label}` : prefix || row.label;
        return `${head}: ${option(r.options, correct ? r.correct[row.id] : record[row.id] || '')}`;
      })
      .join('؛ ');
  }
  if (r.kind === 'judgement') {
    return r.rows
      .map(row => {
        const judgement = correct
          ? row.correct
            ? 'صواب'
            : 'خطأ'
          : record[row.id] === 'true'
            ? 'صواب'
            : record[row.id] === 'false'
              ? 'خطأ'
              : 'لم يُحدّد حكم';
        const correction = correct ? row.correction : record[`${row.id}.correction`];
        return `${plainChemText(row.statement)} ← ${judgement}${
          correction ? '؛ التصحيح: ' + option(row.correctionOptions || [], correction) : ''
        }`;
      })
      .join('؛ ');
  }
  return r.fields
    .map(field => {
      const answer = correct ? String(field.answer) : record[field.id]?.trim() || '';
      const displayed = !answer
        ? 'لم تُحدّد إجابة'
        : field.kind === 'formula'
          ? parseFormula(answer)
            ? formulaToUnicode(answer)
            : answer
          : field.kind === 'select'
            ? option(field.options || [], answer)
            : answer;
      const prefix = field.formula ? `${formulaToUnicode(field.formula)} — ` : '';
      return `${prefix}${plainChemText(field.label)}: ${displayed}`;
    })
    .join('؛ ');
}

function diagnose(part: Part, answers: Answers, criteria: Criterion[]): string[] {
  const notes: string[] = [];
  const r = part.response;
  if (r.kind !== 'fields') return notes;
  const response = answers[part.id];
  const record = typeof response === 'object' && response && !Array.isArray(response) ? response : {};
  if (r.layout === 'construction') {
    const formula = record.formula || '';
    const balance = chargeBalance(formula, r.cation!, r.anion!);
    const parsed = parseFormula(formula);
    if (!parsed) notes.push('الصيغة المدخلة غير قابلة للقراءة؛ تحقّق من الرموز والأقواس والأرقام.');
    else if (!balance) notes.push('الصيغة المدخلة لا تتوافق مع المكوّنين المطلوبين أو لا تحافظ على تركيب الجذر؛ راجع الرموز والأعداد والأقواس.');
    else if (balance.net !== 0) notes.push(`مجموع الشحنات في صيغتك ${signed(balance.net)} وليس صفرًا؛ لذلك لا تُقبل الصيغة.`);
    else if (!balance.simplest) notes.push('صيغتك متعادلة، لكنها ليست أبسط نسبة صحيحة؛ اختصر عددي المكوّنين معًا.');
    const vp = parseInteger(record.valencePositive || ''), vn = parseInteger(record.valenceNegative || '');
    const cp = parseInteger(record.countPositive || ''), cn = parseInteger(record.countNegative || '');
    if ([vp, vn, cp, cn].every(v => v !== null)) {
      const net = cp! * vp! - cn! * vn!;
      notes.push(`حسابك من الأعداد المدخلة: ${cp} × (${signed(vp!)}) + ${cn} × (${signed(-vn!)}) = ${net}.`);
      if (net !== 0) notes.push('خطأ التعادل يقع في مرحلة ضرب عدد كل مكوّن في تكافؤه وجمع الشحنات.');
    }
    if (criteria.find(c => c.label === 'الصيغة النهائية')?.correct && criteria.some(c => !c.correct)) {
      notes.push('الصيغة النهائية صحيحة، لكن بعض خطوات التعليل غير صحيحة؛ نلت درجة الصيغة فقط دون إكمال درجة الخطوات.');
    }
    if (criteria.every(c => c.correct)) notes.push('المكوّنات والتكافؤات والأعداد والصيغة صحيحة، والتعادل الكهربائي متحقّق.');
  }
  const formulaField = r.fields.find(f => f.kind === 'formula' && f.id === 'formula');
  if (formulaField && r.layout !== 'construction' && !isCorrectFormula(record.formula || '', r.correctFormula || String(formulaField.answer))) {
    notes.push(`الصيغة الصحيحة المطلوبة هي ${formulaToUnicode(r.correctFormula || String(formulaField.answer))}؛ لا تُقبل نسبة ذرّات مختلفة أو صيغة غير متعادلة.`);
    if (r.correctFormula === 'Ca(OH)2' && parseFormula(record.formula || '')?.atoms.O === 1) {
      notes.push('في صيغتك ذرّة أكسجين واحدة؛ العدد 2 لم يضرب الأكسجين لأن القوس مفقود.');
    }
  }
  if (part.id === 'q7-3') {
    const balance = chargeBalance(String((answers['q7-2'] as Record<string, string> | undefined)?.formula || ''), 'Al3+', 'PO43-');
    if (balance) {
      notes.push(`التحقق من صيغتك أنت: ${balance.cationCount} × (+3) + ${balance.anionCount} × (−3) = ${balance.net}.`);
      if (!balance.simplest) notes.push('حسابك قد يكون متزنًا لصيغتك، لكن النسبة غير مبسّطة. المطلوب للحساب النهائي مقدار +3 و−3، ومجموعهما 0.');
      else if (balance.net !== 0) notes.push('الشحنات المحسوبة من صيغتك لا تتعادل؛ راجع الصيغة في الجزء ب أولًا.');
    }
  }
  return notes;
}

export function gradePart(part: Part, answers: Answers): PartResult {
  const r = part.response, value = answers[part.id];
  const criteria: Criterion[] = [];
  const add = (label: string, correct: boolean, available: number) =>
    criteria.push({ label, correct, available, earned: correct ? available : 0 });
  if (r.kind === 'choice') add('الاختيار الصحيح', value === r.correct, part.marks);
  else if (r.kind === 'number') add('القيمة العددية الصحيحة', typeof value === 'string' && parseInteger(value) === r.answer, part.marks);
  else if (r.kind === 'matching') {
    const record = typeof value === 'object' && !Array.isArray(value) ? value || {} : {};
    r.rows.forEach(row => {
      const prefix = row.formula ? formulaToUnicode(row.formula) : '';
      const label = prefix && row.label ? `${prefix} — ${row.label}` : prefix || row.label;
      add(label, record[row.id] === r.correct[row.id], part.marks / r.rows.length);
    });
  } else if (r.kind === 'judgement') {
    const record = typeof value === 'object' && !Array.isArray(value) ? value || {} : {};
    r.rows.forEach(row => {
      if (row.correct) add(`الحكم: ${row.statement}`, record[row.id] === 'true', 2);
      else {
        add(`الحكم: ${row.statement}`, record[row.id] === 'false', 1);
        add('تصحيح العبارة الخاطئة', record[row.id] === 'false' && record[`${row.id}.correction`] === row.correction, 1);
      }
    });
  } else if (r.kind === 'order') {
    r.correct.forEach((id, i) =>
      add(`المرحلة ${i + 1}: ${r.items.find(item => item.id === id)?.label}`, Array.isArray(value) && value[i] === id, part.marks / r.correct.length),
    );
  } else {
    const record = typeof value === 'object' && !Array.isArray(value) ? value || {} : {};
    r.fields.forEach(field => {
      const prefix = field.formula ? `${formulaToUnicode(field.formula)} — ` : '';
      add(`${prefix}${plainChemText(field.label)}`, fieldCorrect(field, record[field.id] || '', r), field.marks);
    });
  }
  const earned = roundMarks(criteria.reduce((sum, c) => sum + c.earned, 0));
  return {
    part,
    earned,
    available: part.marks,
    criteria,
    studentText: answerText(part, value),
    correctText: answerText(part, value, true),
    diagnosis: earned < part.marks || r.kind === 'fields' ? diagnose(part, answers, criteria) : [],
  };
}

export function gradeExam(answers: Answers): ExamResult {
  const questions = QUESTIONS.map(question => {
    const parts = question.parts.map(part => gradePart(part, answers));
    return { question, parts, earned: roundMarks(parts.reduce((s, p) => s + p.earned, 0)), available: question.marks };
  });
  const earned = roundMarks(questions.reduce((s, q) => s + q.earned, 0));
  return { questions, earned, available: 100, percentage: roundMarks((earned / 100) * 100) };
}

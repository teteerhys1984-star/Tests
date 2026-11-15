import type { AnswerValue, Subpart } from '../types';

/** Human-readable correct answer for a subpart (teacher key / results / report). */
export function correctAnswerText(sp: Subpart): string {
  switch (sp.kind) {
    case 'mcq':
      return sp.options[sp.correct];
    case 'multi':
      return sp.correct.map((i) => sp.options[i]).join('، ');
    case 'text':
      return sp.accepted[0];
    case 'group':
      return sp.items.map((it) => `${it.label} ← ${sp.choices[it.answer]}`).join(' | ');
  }
}

/** Human-readable student answer. */
export function studentAnswerText(sp: Subpart, v: AnswerValue | undefined): string {
  if (v === undefined) return '— (بلا إجابة)';
  switch (sp.kind) {
    case 'mcq':
      return typeof v === 'number' ? sp.options[v] ?? '—' : '—';
    case 'multi':
      return Array.isArray(v) && v.length ? (v as number[]).map((i) => sp.options[i]).join('، ') : '— (بلا إجابة)';
    case 'text':
      return typeof v === 'string' && v.trim() ? v.trim() : '— (بلا إجابة)';
    case 'group': {
      const arr = Array.isArray(v) ? (v as (number | null)[]) : [];
      return sp.items
        .map((it, i) => `${it.label} ← ${arr[i] == null ? '—' : sp.choices[arr[i] as number]}`)
        .join(' | ');
    }
  }
}

export function rubricText(sp: Subpart): string {
  switch (sp.kind) {
    case 'mcq':
      return `إجابة صحيحة واحدة: ${sp.marks} درجة كاملة، وإلا صفر.`;
    case 'text':
      return `تُقبل الإجابة إذا طابقت (مع تجاهل الحركات): ${sp.accepted.join(' / ')}؛ يجب صحة رسم الهمزة/التاء.`;
    case 'multi':
      return `درجة جزئية: (عدد الاختيارات الصحيحة − عدد الخاطئة) ÷ ${sp.correct.length} × ${sp.marks}، بحد أدنى صفر.`;
    case 'group':
      return `درجة جزئية: ${(sp.marks / sp.items.length).toFixed(2)} لكل بند صحيح من ${sp.items.length} بنود.`;
  }
}

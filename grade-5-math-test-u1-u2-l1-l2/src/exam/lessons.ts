import type { ExamResult, MainQuestion } from './types'

/** Each source subquestion has exactly one ref. Aggregate subquestions, not main questions. */
export function lessonTotals(questions: MainQuestion[], result: ExamResult) {
  const rows = new Map<string, { title: string; awarded: number; max: number }>()
  questions.forEach((q, qi) => q.subs.forEach((s, si) => {
    const title = `${s.ref.unit} – ${s.ref.lesson}`
    const row = rows.get(title) ?? { title, awarded: 0, max: 0 }
    row.max += s.marks
    row.awarded += result.questions[qi].subs[si].earned
    rows.set(title, row)
  }))
  return Array.from(rows.values())
}

export const overlapNote = 'لا توجد فروع مشتركة بين الدروس وفق مراجع المصدر؛ بعض الأسئلة الرئيسية تضم فروعاً من دروس مختلفة. تُحتسب كل علامة مرة واحدة.'

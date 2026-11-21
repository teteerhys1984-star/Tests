/**
 * تقرير TXT قابل للتنزيل بترميز UTF-8 (مع BOM) لمحاولة مسلَّمة.
 * يعرض إجابات الطالب والإجابات النموذجية والدرجات والتفاصيل وتوزيع العلامات على الدروس.
 */
import { EXAM_ID, EXAM_TITLE, EXAM_TITLE_AR } from '../config'
import { LESSONS, lessonTitle } from '../data/lessons'
import { TOTAL_POINTS } from '../data/index'
import { formatDateTime, formatHMS, type ResultsSummary } from './attempt'
import { summarizeAnswer, summarizeExpected } from './grading'
import type { Rich } from './types'

/** يحوّل النص الغني إلى نص صرف للطباعة في ملف TXT. */
export function plainText(rich: Rich): string {
  return rich
    .replace(/\$/g, '')
    .replace(/\{,\}/g, ',')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\to/g, '←')
    .replace(/\\parallel/g, '∥')
    .replace(/\\angle/g, '∠')
    .replace(/\\overrightarrow\{([^{}]*)\}/g, '$1 ')
    .replace(/\\ge/g, '≥')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const STATUS_AR = {
  correct: 'صحيحة كاملة',
  partial: 'صحيحة جزئياً',
  wrong: 'خاطئة',
} as const

export const STATUS_LABEL = {
  correct: 'إجابة صحيحة',
  partial: 'صحيحة جزئياً',
  wrong: 'تحتاج مراجعة',
} as const

const SEP = '='.repeat(64)

export function reportFileName(studentName: string, submittedAt: number): string {
  const safe =
    studentName
      .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
      .replace(/\s+/g, '-')
      .trim() || 'student'
  const d = new Date(submittedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${EXAM_ID}_${safe}_${date}.txt`
}

/** توزيع العلامات على الدروس (كل سؤال ينتمي إلى درس واحد). */
export function lessonAwarded(summary: ResultsSummary): { title: string; awarded: number; max: number }[] {
  return LESSONS.map((lesson) => {
    let awarded = 0
    let max = 0
    summary.items.forEach(({ question, grade }) => {
      if (question.lesson !== lesson.id) return
      awarded += grade.earned
      max += grade.max
    })
    return { title: lesson.title, awarded: Math.round(awarded * 100) / 100, max }
  })
}

export function buildReportText(summary: ResultsSummary): string {
  const out: string[] = []
  const push = (...lines: string[]) => out.push(...lines)
  const percentage =
    summary.max > 0 ? Math.round((summary.score / summary.max) * 1000) / 10 : 0

  push(SEP)
  push(`  ${EXAM_TITLE_AR} — ${EXAM_TITLE}`)
  push(`  معرّف الاختبار: ${EXAM_ID}`)
  push(SEP)
  push('')
  push(`اسم الطالب/ة          : ${summary.studentName}`)
  push(`الصف                   : الخامس الأساسي`)
  push(`المادة                 : الرياضيات`)
  push(`الفصل الدراسي         : الأول`)
  push(`الوحدة                 : الوحدة الأولى (كاملة)`)
  push(`عدد الأسئلة الرئيسية   : ${summary.items.length}`)
  push(
    `عدد الفروع المقوّمة    : ${summary.items.reduce((s, it) => s + it.question.parts.length, 0)}`,
  )
  push(`مجموع العلامات         : ${TOTAL_POINTS} علامة`)
  push('')
  push(`تاريخ ووقت البدء        : ${formatDateTime(summary.startedAt)}`)
  push(`تاريخ ووقت التسليم      : ${formatDateTime(summary.submittedAt)}`)
  push(`الوقت المستغرق          : ${formatHMS(summary.elapsedMs)}  (HH:MM:SS)`)
  push('')
  push(`العلامة النهائية        : ${summary.score} من ${summary.max}`)
  push(`النسبة المئوية          : ${percentage}%`)
  push(`أسئلة صحيحة بالكامل     : ${summary.correct}`)
  push(`أسئلة صحيحة جزئياً      : ${summary.partial}`)
  push(`أسئلة خاطئة             : ${summary.wrong}`)
  push('')
  push('توزيع العلامات على دروس الوحدة الأولى:')
  for (const row of lessonAwarded(summary)) {
    push(`  ${row.title} : ${row.awarded} / ${row.max}`)
  }
  push('')
  push(SEP)
  push('                 المراجعة التفصيلية لكل سؤال وفرع')
  push(SEP)

  summary.items.forEach((item) => {
    const q = item.question
    const g = item.grade
    push('')
    push('-'.repeat(64))
    push(`السؤال ${item.index} — ${q.skill}`)
    push(`  الدرس: ${lessonTitle(q.lesson)} | الصفحة المرجعية: ${q.pages} | النمط: ${q.style}`)
    push(`  نص السؤال: ${plainText(q.prompt)}`)
    if (q.table) {
      push(`  الجدول: ${plainText(q.table.caption)}`)
      push(`    ${q.table.headers.map((h) => plainText(h)).join(' | ')}`)
      for (const row of q.table.rows) push(`    ${row.map((c) => plainText(c)).join(' | ')}`)
    }
    push(`  العلامة: ${g.earned} من ${g.max} (${STATUS_AR[g.status]})`)
    q.parts.forEach((part, idx) => {
      const pg = g.parts[idx]
      const label = part.label ? `(${part.label}) ` : ''
      push(`  ${label}الفرع ${idx + 1}: ${pg.earned} من ${part.points}`)
      if (part.prompt) push(`    الطلب: ${plainText(part.prompt)}`)
      push(`    إجابة الطالب   : ${plainText(summarizeAnswer(part.input, summary.answers[part.id]))}`)
      push(`    الإجابة النموذجية: ${plainText(summarizeExpected(part.input))}`)
    })
    push(`  الإجابة النموذجية الكاملة: ${plainText(q.solution.answer)}`)
    push('  خطوات الحل:')
    q.solution.steps.forEach((step, i) => push(`    ${i + 1}. ${plainText(step)}`))
    push(`  الشرح: ${plainText(q.solution.why)}`)
  })

  push('')
  push(SEP)
  push('ملاحظات التصحيح')
  push(SEP)
  push('  · لكل فرع علامته الخاصة، ومجموع علامات فروع السؤال يساوي علامة السؤال.')
  push('  · مجموع علامات الأسئلة الثلاثين يساوي 100 علامة بالضبط.')
  push('  · في المطابقة والترتيب وملء الفراغات تُمنح علامة جزئية بحسب عدد الإصابات.')
  push('  · في الحساب تُقبل الإجابة المكافئة رياضياً (مثل كتابة العملية 48750+12380 أو ناتجها 61130).')
  push('  · في الرسم على الشبكة والمنقلة وخط الأعداد تُقبل الإجابة ضمن الهامش المحدد في السؤال.')
  push('')
  push('')
  push('أعدّه نظام الاختبارات الإلكترونية — المهندس سومر شاهين — واتساب: 0930215022')
  push(SEP)
  // CRLF + BOM: يظهر النص العربي صحيحاً في Windows Notepad وفي بقية المحرّرات.
  return '\uFEFF' + out.join('\r\n')
}

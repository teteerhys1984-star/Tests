/**
 * Builds the downloadable UTF-8 TXT report for a submitted attempt.
 */
import { LESSONS } from '../data/lessons'
import { formatDateTime, formatHMS, type ResultsSummary } from './attempt'
import { summarizeAnswer, summarizeExpected } from './grading'
import type { LessonId, Rich } from './types'

/** Converts rich text to plain text for TXT output. */
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

const STATUS_AR = { correct: 'صحيحة كاملة', partial: 'صحيحة جزئياً', wrong: 'خاطئة' } as const

export function reportFileName(studentName: string, submittedAt: number): string {
  const safe = studentName.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, '-').trim() || 'طالبة'
  const d = new Date(submittedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `تقرير-الوحدة-الأولى-${safe}-${date}.txt`
}

export function buildReportText(summary: ResultsSummary): string {
  const line = (s = '') => s
  const out: string[] = []
  out.push('تقرير اختبار الرياضيات — الوحدة الأولى كاملة (الصف الخامس)')
  out.push('='.repeat(60))
  out.push(line(`اسم الطالبة: ${summary.studentName}`))
  out.push(line(`تاريخ ووقت البدء: ${formatDateTime(summary.startedAt)}`))
  out.push(line(`تاريخ ووقت التسليم: ${formatDateTime(summary.submittedAt)}`))
  out.push(line(`الوقت المستغرق: ${formatHMS(summary.elapsedMs)}`))
  out.push(line(`العلامة النهائية: ${summary.score} من ${summary.max}`))
  out.push(line(`عدد الإجابات الصحيحة كاملة: ${summary.correct}`))
  out.push(line(`عدد الإجابات الصحيحة جزئياً: ${summary.partial}`))
  out.push(line(`عدد الإجابات الخاطئة: ${summary.wrong}`))
  out.push('-'.repeat(60))

  for (const item of summary.items) {
    const q = item.question
    out.push('')
    out.push(`السؤال ${item.index} — ${q.skill}`)
    out.push(`الدرس: ${lessonTitle(q.lesson)} | الصفحة المرجعية: ${q.pages} | النمط: ${q.style}`)
    out.push(`نص السؤال: ${plainText(q.prompt)}`)
    out.push(`العلامة: ${item.grade.earned} من ${item.grade.max} (${STATUS_AR[item.grade.status]})`)
    q.parts.forEach((part, idx) => {
      const g = item.grade.parts[idx]
      const label = part.label ? `(${part.label}) ` : ''
      out.push(`  ${label}الفرع ${idx + 1}: ${g.earned} من ${part.points}`)
      if (part.prompt) out.push(`    الطلب: ${plainText(part.prompt)}`)
      out.push(`    إجابة الطالبة: ${plainText(summarizeAnswer(part.input, answerFor(summary, part.id)))}`)
      out.push(`    الإجابة النموذجية: ${plainText(summarizeExpected(part.input))}`)
    })
    out.push(`الإجابة النموذجية الكاملة: ${plainText(q.solution.answer)}`)
    out.push('خطوات الحل:')
    q.solution.steps.forEach((s, i) => out.push(`  ${i + 1}. ${plainText(s)}`))
    out.push(`الشرح: ${plainText(q.solution.why)}`)
  }

  out.push('')
  out.push('-'.repeat(60))
  out.push('أعدّه نظام اختبار الوحدة الأولى — المهندس سومر شاهين — واتساب: 0930215022')
  return out.join('\r\n')
}

function lessonTitle(id: LessonId): string {
  return LESSONS.find((l) => l.id === id)?.title ?? id
}

/** Looks up a student's answer for one part. */
function answerFor(summary: ResultsSummary, partId: string) {
  return summary.answers[partId]
}

import type { ExamResult, MainQuestion } from './types'
import { formatHMS } from './timer'
import { lessonTotals, overlapNote } from './lessons'

export function buildReport(opts: {
  name: string
  result: ExamResult
  questions: MainQuestion[]
  elapsedMs: number
  submittedAt: number
}): string {
  const { name, result, questions, elapsedMs, submittedAt } = opts
  const L: string[] = []
  const line = '='.repeat(48)
  L.push(line)
  L.push('Maths Test Unit 1 and L1&2 U2')
  L.push(line)
  L.push(`اسم الطالب: ${name}`)
  L.push(`تاريخ التسليم: ${new Date(submittedAt).toLocaleString('ar-SY')}`)
  L.push(`الوقت المستغرق: ${formatHMS(elapsedMs)}`)
  L.push(`الدرجة النهائية: ${result.total} / ${result.max}`)
  L.push('توزيع الدروس:')
  for (const row of lessonTotals(questions, result)) L.push(`${row.title}: ${row.awarded} / ${row.max}`)
  L.push(overlapNote)
  L.push('')
  result.questions.forEach((qr, qi) => {
    const q = questions[qi]
    L.push('-'.repeat(48))
    L.push(`السؤال ${q.number}: ${q.title} — ${qr.earned} / ${qr.marks}`)
    L.push('-'.repeat(48))
    qr.subs.forEach((sr, si) => {
      const s = q.subs[si]
      const st = sr.status === 'correct' ? 'صحيحة' : sr.status === 'partial' ? 'جزئية' : sr.status === 'unanswered' ? 'غير مجابة' : 'خاطئة'
      L.push(`  (${si + 1}) ${strip(s.prompt)}`)
      L.push(`      الحالة: ${st} — الدرجة: ${sr.earned} / ${sr.marks}`)
      L.push(`      إجابة الطالب: ${strip(sr.studentText)}`)
      L.push(`      الإجابة الصحيحة: ${strip(sr.correctText)}`)
      L.push(`      الشرح: ${strip(s.explanation)}`)
      L.push(`      المرجع: ${s.ref.unit} / ${s.ref.lesson} / ${s.ref.pages} / المهارة: ${s.ref.skill}`)
      L.push('')
    })
  })
  L.push(line)
  return L.join('\n')
}

/** Remove TeX markup for plain-text output. */
export function strip(s: string): string {
  return s
    .replace(/\{,\}/g, ',')
    .replace(/\\times/g, '×')
    .replace(/\\angle\s*/g, '∠')
    .replace(/\\square/g, '▢')
    .replace(/\$/g, '')
    .replace(/\\/g, '')
}

export function safeFileName(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'طالب'
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

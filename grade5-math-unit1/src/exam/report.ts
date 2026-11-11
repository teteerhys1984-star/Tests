import { plainMath } from '../lib/mathx'
import { formatDuration, formatDurationWords, formatLong, num, pct, toLatinDigits } from '../lib/time'
import { LESSONS, CONTACT, TOTAL_MARKS, type LessonId, type Question, type Subpart } from './types'
import { gradeSubpart, describeAnswer, type Answers, type GradeResult } from './grading'

export interface SubpartResult {
  sp: Subpart
  res: GradeResult
  studentText: string
}
export interface QuestionResult {
  q: Question
  displayNumber: number
  subparts: SubpartResult[]
  awarded: number
  max: number
}
export interface AttemptMeta {
  studentName: string
  startAt: Date
  submitAt: Date
  elapsedMs: number
}

const L = (n: number, ch = '=') => ch.repeat(n)
const T = (s: string) => plainMath(s)

function lessonNames(ids: LessonId[]): string {
  return ids
    .map((id) => {
      const l = LESSONS.find((x) => x.id === id)
      return l ? `${l.title} (${l.pages})` : id
    })
    .join(' + ')
}

export const STATUS_AR: Record<string, string> = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  wrong: 'إجابة خاطئة',
  unanswered: 'لم يُجب',
}

export function gradeAll(ordered: Question[], answers: Answers): QuestionResult[] {
  return ordered.map((q, i) => {
    const subparts: SubpartResult[] = q.subparts.map((sp) => {
      const res = gradeSubpart(sp, answers[sp.id])
      return { sp, res, studentText: describeAnswer(sp, answers[sp.id]) }
    })
    const awarded = Math.round(subparts.reduce((s, x) => s + x.res.awarded, 0) * 100) / 100
    const max = q.subparts.reduce((s, x) => s + x.marks, 0)
    return { q, displayNumber: i + 1, subparts, awarded, max }
  })
}

export interface Summary {
  total: number
  percentage: number
  full: number
  partial: number
  wrong: number
  unansweredSubparts: number
  correctSubparts: number
  partialSubparts: number
  wrongSubparts: number
}

export function summarize(results: QuestionResult[]): Summary {
  const total = Math.round(results.reduce((s, r) => s + r.awarded, 0) * 100) / 100
  let full = 0, partial = 0, wrong = 0
  let cs = 0, ps = 0, ws = 0, us = 0
  for (const r of results) {
    if (Math.abs(r.awarded - r.max) < 1e-9) full++
    else if (r.awarded > 0) partial++
    else wrong++
    for (const s of r.subparts) {
      if (s.res.status === 'correct') cs++
      else if (s.res.status === 'partial') ps++
      else if (s.res.status === 'unanswered') us++
      else ws++
    }
  }
  return {
    total,
    percentage: Math.round((total / TOTAL_MARKS) * 1000) / 10,
    full, partial, wrong,
    unansweredSubparts: us,
    correctSubparts: cs,
    partialSubparts: ps,
    wrongSubparts: ws,
  }
}

/** علامات كل درس (السؤال التركيبي يُحتسب في كل درس يشمله) — مصدر واحد للتقرير وللنتيجة المرسلة إلى المعلّم. */
export function lessonTotals(results: QuestionResult[]): { title: string; awarded: number; max: number }[] {
  return LESSONS.map((l) => {
    let aw = 0, mx = 0
    for (const r of results) {
      if (r.q.lessons.includes(l.id)) {
        aw += r.awarded
        mx += r.max
      }
    }
    return { title: l.title, awarded: Math.round(aw * 100) / 100, max: mx }
  })
}

/** بناء نص التقرير الكامل بصيغة نصية صرفة (UTF-8). */
export function buildReport(meta: AttemptMeta, results: QuestionResult[]): string {
  const sum = summarize(results)
  const out: string[] = []
  const push = (...lines: string[]) => out.push(...lines)

  push(L(78))
  push('           تقرير نتيجة اختبار الرياضيات — الصف الخامس — الوحدة الأولى')
  push(L(78))
  push(`اسم الطالب/ة            : ${meta.studentName}`)
  push(`عنوان الاختبار          : اختبار الرياضيات — الصف الخامس`)
  push(`الصف                    : الخامس الابتدائي`)
  push(`المادة                  : الرياضيات`)
  push(`الوحدة                  : الوحدة الأولى (كاملة)`)
  push(`عدد الأسئلة الرئيسية    : ${num(results.length)}`)
  push(`عدد الفروع المقوّمة     : ${num(results.reduce((s, r) => s + r.subparts.length, 0))}`)
  push(`مجموع العلامات          : ${num(TOTAL_MARKS)} علامة`)
  push('')
  push('الدروس الثمانية المشمولة في الاختبار:')
  LESSONS.forEach((l, i) => {
    push(`  ${num(i + 1)}. ${l.title} — ${l.pages}`)
  })
  push('')
  push(L(78))
  push('                                  الزمن')
  push(L(78))
  push(`بداية الاختبار          : ${formatLong(meta.startAt)}`)
  push(`تسليم الاختبار          : ${formatLong(meta.submitAt)}`)
  push(`المدة المنقضية          : ${formatDuration(meta.elapsedMs)}  (HH:MM:SS)`)
  push(`                          أي ${formatDurationWords(meta.elapsedMs)}`)
  push('')
  push(L(78))
  push('                                النتيجة')
  push(L(78))
  push(`العلامة النهائية        : ${num(sum.total)} من ${num(TOTAL_MARKS)}`)
  push(`النسبة المئوية          : ${pct(sum.percentage)}`)
  push(`التقدير                 : ${gradeLabel(sum.percentage)}`)
  push('')
  push(`أسئلة صحيحة بالكامل    : ${num(sum.full)}`)
  push(`أسئلة صحيحة جزئياً      : ${num(sum.partial)}`)
  push(`أسئلة خاطئة             : ${num(sum.wrong)}`)
  push('')
  push(`فروع إجاباتها صحيحة     : ${num(sum.correctSubparts)}`)
  push(`فروع إجاباتها جزئية     : ${num(sum.partialSubparts)}`)
  push(`فروع إجاباتها خاطئة     : ${num(sum.wrongSubparts)}`)
  push(`فروع لم يُجب عنها       : ${num(sum.unansweredSubparts)}`)
  push('')
  push('توزيع العلامات على الدروس:')
  for (const l of lessonTotals(results)) {
    push(`  ${l.title.padEnd(28, ' ')} : ${num(l.awarded)} / ${num(l.max)}`)
  }
  push('  (الأسئلة التركيبية تُحتسب في أكثر من درس، ولذلك قد يتجاوز المجموع 100)')
  push('')
  push(L(78))
  push('                       المراجعة التفصيلية لكل سؤال وفرع')
  push(L(78))

  for (const r of results) {
    push('')
    push(L(78, '-'))
    push(`السؤال ${num(r.displayNumber)} — ${T(r.q.title)}`)
    push(`  العلامة: ${num(Math.round(r.awarded * 100) / 100)} من ${num(r.max)}`)
    push(`  الدرس/الدروس: ${lessonNames(r.q.lessons)}${r.q.integrated ? '  [سؤال تركيبي]' : ''}`)
    push(`  المرجع: ${r.q.source}`)
    push(`  مستوى الصعوبة: ${r.q.difficulty}`)
    if (r.q.intro) push(`  المعطيات: ${T(r.q.intro)}`)
    if (r.q.note) push(`  ملاحظة على الرسم: ${T(r.q.note)}`)
    push(L(78, '-'))

    for (const s of r.subparts) {
      push(`  الفرع (${s.sp.label}) — [${num(s.res.awarded)} / ${num(s.sp.marks)}] — ${STATUS_AR[s.res.status]}`)
      push(`    المطلوب          : ${T(s.sp.prompt)}`)
      push(`    إجابة الطالب     : ${T(s.studentText)}`)
      push(`    الإجابة الصحيحة  : ${T(s.sp.answerText)}`)
      push(`    الحلّ المفصّل     :`)
      for (const line of T(s.sp.solution).split('\n')) push(`      ${line}`)
      push(`    القاعدة/الخاصة   : ${T(s.sp.rule)}`)
      push(`    الهدف التعليمي   : ${T(s.sp.objective)}`)
      push(`    الخطأ الشائع     : ${T(s.sp.mistake)}`)
      if (s.sp.recovery) push(`    آلية التعافي     : ${T(s.sp.recovery)}`)
      if (s.sp.depends) push(`    الاعتمادية       : ${T(s.sp.depends)}`)
      if (s.res.status === 'partial')
        push(`    ملاحظة التصحيح   : تحقّق ${num(s.res.hits)} من ${num(s.res.total)} عناصر سلّم التقويم، فمُنحت علامة جزئية.`)
      push('')
    }
  }

  push(L(78))
  push('                          سلّم التقويم المعتمد')
  push(L(78))
  push('  · لكل فرع علامة محدّدة، ومجموع علامات فروع السؤال يساوي علامة السؤال.')
  push('  · مجموع علامات الأسئلة العشرين يساوي 100 علامة بالضبط.')
  push('  · في المسائل الحسابية: علامة للطريقة/القاعدة المستعملة، وعلامة للناتج النهائي،')
  push('    وعلامة للوحدة أو الترميز الرياضي حيث يلزم.')
  push('  · في أسئلة المطابقة والترتيب والاختيار المتعدد: تُمنح علامة جزئية بحسب عدد الإصابات.')
  push('  · في أسئلة التعليل: يُقوَّم المعنى الرياضي بمجموعات كلمات مفتاحية، ولا يُشترط تطابق الصياغة.')
  push('  · في أسئلة «صواب/خطأ مع التصويب»: نصف العلامة للاختيار ونصفها للتصويب.')
  push('  · لا يُعاقب الطالب مرّتين على الخطأ نفسه في الفروع المعتمدة؛ فكل فرع معتمد')
  push('    له مسار حلّ مستقل أو قيمة بديلة معطاة في نصّ السؤال.')
  push('  · يُقبل قياس الزوايا المرسوم/المقاس ضمن هامش ±2 درجة.')
  push('')
  push(L(78))
  push('                              معلومات التواصل')
  push(L(78))
  push(`  ${CONTACT.name}: ${CONTACT.phone}`)
  push(`  واتساب: ${CONTACT.whatsapp}`)
  push('')
  push(`  أُصدر هذا التقرير بتاريخ: ${formatLong(meta.submitAt)}`)
  push('  تم إنشاء التقرير محلياً داخل متصفح الطالب، وتُرسَل النتيجة أيضاً إلكترونياً إلى المعلّم عند التسليم.')
  push(L(78))

  return '\uFEFF' + out.join('\r\n')
}

export function gradeLabel(p: number): string {
  if (p >= 95) return 'ممتاز'
  if (p >= 85) return 'جيد جداً'
  if (p >= 75) return 'جيد'
  if (p >= 65) return 'مقبول'
  if (p >= 50) return 'ضعيف'
  return 'يحتاج إلى دعم'
}

/** التحقّق من اكتمال التقرير قبل تنزيله. */
export function validateReport(text: string, meta: AttemptMeta, results: QuestionResult[]): string[] {
  const missing: string[] = []
  const must = [
    meta.studentName,
    'الوحدة الأولى',
    formatLong(meta.startAt),
    formatLong(meta.submitAt),
    formatDuration(meta.elapsedMs),
  ]
  for (const m of must) if (m && !text.includes(toLatinDigits(String(m)))) missing.push(m)
  for (const l of LESSONS) if (!text.includes(l.title)) missing.push(l.title)
  for (const r of results) {
    if (!text.includes(`السؤال ${num(r.displayNumber)} —`)) missing.push(`السؤال ${r.displayNumber}`)
    for (const s of r.subparts) {
      if (!text.includes(`الفرع (${s.sp.label})`)) missing.push(`فرع ${r.displayNumber}-${s.sp.label}`)
      if (!text.includes('الإجابة الصحيحة')) missing.push('الإجابة الصحيحة')
    }
  }
  return missing
}

export function sanitizeName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '_')
    .slice(0, 40)
  return cleaned || 'Student'
}

/**
 * التنزيل الفعلي — يجب أن يُستدعى داخل معالج حدث النقر نفسه.
 * يعيد true إذا بدأ التنزيل، وfalse إذا اعترضه المتصفح.
 */
export function triggerDownload(text: string, filename: string): boolean {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    // التحرير بعد أن يكون المتصفح قد بدأ التنزيل فعلاً
    window.setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 12000)
    return true
  } catch {
    return false
  }
}

export function reportFilename(studentName: string): string {
  return `Grade5_Math_Unit1_${sanitizeName(studentName)}_Results.txt`
}

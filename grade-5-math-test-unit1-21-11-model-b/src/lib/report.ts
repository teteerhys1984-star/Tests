/**
 * تقرير TXT عربي قابل للتنزيل بترميز UTF-8 (مع BOM) لمحاولة مسلَّمة.
 *
 * مبني على مولّد التقرير في المصدر (generateTxtReportContent داخل
 * src/components/ResultsView.tsx) ويحافظ على تفاصيله كلها: نتيجة كل سؤال وفرع،
 * وإجابة الطالبة، والإجابة النموذجية، والعلامة المستحقة والكاملة، وشرح الخطأ،
 * وخطوات الحل، والقاعدة. وأُضيفت إليه الحقول التي يتطلبها عقد المنصة:
 * عنوان الاختبار ومعرّفه، ووقت البدء والتسليم، والنسبة المئوية، والتقدير اللفظي،
 * وتوزيع العلامات على الدروس.
 *
 * النص الناتج هنا هو نفسه `reportText` المرسَل في حمولة Google Sheets، فتتطابق
 * الدرجة المعروضة مع المرسلة ومع التقرير حرفياً.
 */
import { EXAM_ID, EXAM_SUBTITLE_AR, EXAM_TITLE } from '../config'
import { examQuestions, unitOneLessons } from '../data/questions'
import type { ExamScoreSummary } from '../types/exam'
import { formatDurationHHMMSS } from '../utils/mathNorm'
import { formatDateTime } from './attempt'
import { gradeLabel, lessonTotals, percentageOf } from './submit'

export interface ReportInput {
  studentName: string
  summary: ExamScoreSummary
  startedAtTimestamp: number
  submittedAtTimestamp: number
  elapsedSeconds: number
}

const SEP = '='.repeat(68)
const LINE = '-'.repeat(68)

/**
 * اسم ملف التقرير — الصيغة العربية المعتمدة في المصدر نفسها مع اسم النموذج B،
 * وتنظيف الاسم من المحارف الممنوعة في أسماء الملفات.
 */
export function buildTxtReportFilename(studentName: string): string {
  const safeName = studentName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
  return `تقرير_مذاكرة_رياضيات_خامس_نموذج_B_${safeName || 'طالبة'}.txt`
}

/** نص التقرير الكامل (بلا BOM؛ الـ BOM يُضاف عند إنشاء ملف التنزيل فقط). */
export function buildReportText({
  studentName,
  summary,
  startedAtTimestamp,
  submittedAtTimestamp,
  elapsedSeconds,
}: ReportInput): string {
  const branchCount = summary.questionResults.reduce(
    (s, q) => s + q.branchResults.length,
    0,
  )
  const percentage = percentageOf(summary.totalEarned, summary.totalMax)
  const lines: string[] = [
    SEP,
    `   ${EXAM_TITLE}`,
    `   معرّف الاختبار: ${EXAM_ID}`,
    `   ${EXAM_SUBTITLE_AR} — الوحدة الأولى كاملة (الدروس 1–8 · ص 3–39)`,
    SEP,
    `اسم الطالبة: ${studentName}`,
    `عدد الأسئلة الرئيسية: ${summary.questionResults.length}`,
    `عدد الفروع المقوّمة: ${branchCount}`,
    '',
    `وقت البدء: ${formatDateTime(startedAtTimestamp)}`,
    `وقت التسليم: ${formatDateTime(submittedAtTimestamp)}`,
    `مدة الحل: ${formatDurationHHMMSS(elapsedSeconds)}  (HH:MM:SS)`,
    '',
    `الدرجة النهائية: ${summary.totalEarned} من ${summary.totalMax}`,
    `النسبة المئوية: ${percentage}%`,
    `التقدير: ${gradeLabel(percentage)}`,
    `عدد الأسئلة الصحيحة بالكامل: ${summary.correctQuestionCount} من ${summary.questionResults.length}`,
    `عدد الأسئلة الصحيحة جزئياً: ${summary.partialQuestionCount} من ${summary.questionResults.length}`,
    `عدد الأسئلة الخاطئة: ${summary.wrongQuestionCount} من ${summary.questionResults.length}`,
    SEP,
    '',
    'توزيع العلامات على دروس الوحدة الأولى:',
  ]

  for (const row of lessonTotals(summary.questionResults)) {
    lines.push(`  ${row.title} : ${row.awarded} / ${row.max}`)
  }

  lines.push('')
  lines.push('تفاصيل الأسئلة والإجابات والتصحيح:')
  lines.push(LINE)

  for (const q of summary.questionResults) {
    const statusAr =
      q.status === 'correct'
        ? 'صحيحة بالكامل'
        : q.status === 'partial'
          ? 'صحيحة جزئياً (علامة جزئية)'
          : 'خاطئة'
    lines.push(
      `السؤال (${q.questionNumber}) — [${statusAr}] — العلامة: ${q.earnedMarks} / ${q.maxMarks}`,
    )
    lines.push(`الدرس: ${q.lessonTitle} | الصفحات المرجعية: ص ${q.pages}`)
    lines.push(`المهارة: ${q.skill}`)
    for (const b of q.branchResults) {
      lines.push(
        `  • الفرع (${b.label}) [${b.earnedMarks} / ${b.maxMarks} علامة]: ${b.prompt.replace(/\$+/g, '')}`,
      )
      lines.push(`    - إجابة الطالبة: ${b.studentAnswerDisplay}`)
      lines.push(`    - الإجابة النموذجية: ${b.modelAnswerDisplay}`)
      if (b.errorFeedback) {
        lines.push(`    - شرح الخطأ / ملاحظة التصحيح: ${b.errorFeedback}`)
      }
    }
    lines.push('  • خطوات الحل الصحيحة:')
    q.solutionSteps.forEach((step, idx) => {
      lines.push(`    ${idx + 1}) ${step}`)
    })
    lines.push(`  • القاعدة والشرح: ${q.explanation}`)
    lines.push(LINE)
  }

  lines.push('إعداد وتطوير المنصة: المهندس سومر شاهين — 0930215022')
  return lines.join('\r\n')
}

/** عدد الفروع المقوّمة في بنك الأسئلة (للتقارير والاختبارات). */
export const BRANCH_COUNT = examQuestions.reduce((s, q) => s + q.branches.length, 0)

/** مجموع علامات الدروس الثمانية كما في بيانات المصدر. */
export const LESSON_MARKS_TOTAL = unitOneLessons.reduce((s, l) => s + l.totalMarks, 0)

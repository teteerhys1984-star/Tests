import React, { useState } from 'react'
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Clock,
  BookOpen,
  Sparkles,
  RotateCcw,
  KeyRound,
} from 'lucide-react'
import type { ExamScoreSummary } from '../types/exam'
import { formatDurationHHMMSS } from '../utils/mathNorm'
import { RichMathText } from './MathTex'
import { ContactFooter } from './ContactFooter'

interface ResultsViewProps {
  studentName: string
  summary: ExamScoreSummary
  elapsedSeconds: number
  submittedAtTimestamp: number
  onRestartExam: () => void
  onOpenTeacherModal: () => void
}

export function getEncouragingMessage(score: number): { title: string; subtitle: string } {
  if (score >= 90) {
    return {
      title: 'أداء رائع ومتميّز يا بطلة الرياضيات! 🌸',
      subtitle: 'أظهرتِ فهماً عميقاً ودقة عالية في جميع دروس الوحدة الأولى. استمري بهذا التألق!',
    }
  }
  if (score >= 75) {
    return {
      title: 'أحسنتِ المحاولة يا مبدعة! ✨',
      subtitle: 'نتيجة جميلة جداً تدل على اجتهادكِ. راجعي الملاحظات البسيطة أدناه لتصلي إلى العلامة الكاملة.',
    }
  }
  if (score >= 50) {
    return {
      title: 'خطوة جيدة ومجهود طيّب! 🌷',
      subtitle: 'لديكِ أساس جميل في الوحدة الأولى، وقراءة خطوات الحل النموذجية أدناه ستساعدكِ على إتقان جميع المهارات بسهولة.',
    }
  }
  return {
    title: 'شكراً لمحاولتكِ واجتهادكِ يا لطيفة! 🌺',
    subtitle: 'التعلّم رحلة خطوة بخطوة؛ استعيني بالحلول المشروحة أدناه لمراجعة الأفكار بهدوء وستحققين نتيجة أجمل في المرة القادمة.',
  }
}

export function buildTxtReportFilename(studentName: string): string {
  const safeName = studentName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
  return `تقرير_اختبار_الرياضيات_الوحدة_الأولى_${safeName || 'طالبة'}.txt`
}

export function generateTxtReportContent(
  studentName: string,
  summary: ExamScoreSummary,
  elapsedSeconds: number,
  submittedAtTimestamp: number
): string {
  const dateStr = new Date(submittedAtTimestamp).toLocaleString('ar-SY', {
    dateStyle: 'full',
    timeStyle: 'medium',
  })
  const lines: string[] = [
    '====================================================================',
    '   تقرير نتيجة الاختبار الشامل — الرياضيات للصف الخامس الأساسي',
    '             الوحدة الأولى كاملة (الدروس 1–8 · ص 3–39)',
    '====================================================================',
    `اسم الطالبة: ${studentName}`,
    `التاريخ والوقت: ${dateStr}`,
    `الوقت المستغرق: ${formatDurationHHMMSS(elapsedSeconds)}`,
    `العلامة النهائية: ${summary.totalEarned} من ${summary.totalMax}`,
    `عدد الأسئلة الصحيحة بالكامل: ${summary.correctQuestionCount} من 30`,
    `عدد الأسئلة الصحيحة جزئياً: ${summary.partialQuestionCount} من 30`,
    `عدد الأسئلة الخاطئة: ${summary.wrongQuestionCount} من 30`,
    '====================================================================',
    '',
    'تفاصيل الأسئلة والإجابات والتصحيح:',
    '--------------------------------------------------------------------',
  ]

  for (const q of summary.questionResults) {
    const statusAr =
      q.status === 'correct'
        ? 'صحيحة بالكامل'
        : q.status === 'partial'
        ? 'صحيحة جزئياً (علامة جزئية)'
        : 'خاطئة'
    lines.push(
      `السؤال (${q.questionNumber}) — [${statusAr}] — العلامة: ${q.earnedMarks} / ${q.maxMarks}`
    )
    lines.push(`الدرس: ${q.lessonTitle} | الصفحات المرجعية: ص ${q.pages}`)
    lines.push(`المهارة: ${q.skill}`)
    for (const b of q.branchResults) {
      lines.push(
        `  • الفرع (${b.label}) [${b.earnedMarks} / ${b.maxMarks} علامة]: ${b.prompt.replace(/\$+/g, '')}`
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
    lines.push('--------------------------------------------------------------------')
  }

  lines.push('إعداد وتطوير المنصة: المهندس سومر شاهين — 0930215022')
  return lines.join('\r\n')
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  studentName,
  summary,
  elapsedSeconds,
  submittedAtTimestamp,
  onRestartExam,
  onOpenTeacherModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'partial' | 'wrong'>('all')
  const encouragement = getEncouragingMessage(summary.totalEarned)

  const handleDownloadTxt = () => {
    const content = generateTxtReportContent(
      studentName,
      summary,
      elapsedSeconds,
      submittedAtTimestamp
    )
    // Prepend UTF-8 BOM so all text editors open Arabic cleanly
    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = buildTxtReportFilename(studentName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredQuestions = summary.questionResults.filter(q => {
    if (filterStatus === 'all') return true
    return q.status === filterStatus
  })

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-pink-50/70 via-white to-purple-50/60">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-6 space-y-6">
        {/* Top Summary Hero Card */}
        <div className="rounded-3xl border-2 border-pink-200 bg-white p-5 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-100 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-extrabold text-pink-800">
                <Sparkles className="h-3.5 w-3.5" />
                <span>نتيجة اختبار الوحدة الأولى كاملة — الصف الخامس</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-purple-950">
                الطالبة: <span className="text-pink-700">{studentName}</span>
              </h1>
              <p className="text-sm font-bold text-purple-900">{encouragement.title}</p>
              <p className="text-xs sm:text-sm text-purple-700 max-w-xl leading-relaxed">
                {encouragement.subtitle}
              </p>
            </div>

            {/* Score Circle */}
            <div className="mx-auto sm:mx-0 flex flex-col items-center justify-center rounded-3xl border-4 border-pink-300 bg-gradient-to-br from-pink-50 via-white to-purple-50 px-6 py-4 text-center shadow-sm">
              <span className="text-xs font-bold text-purple-700 mb-0.5">العلامة النهائية</span>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-3xl sm:text-4xl font-extrabold text-pink-700">
                  {summary.totalEarned}
                </span>
                <span className="text-lg font-bold text-purple-900">/ {summary.totalMax}</span>
              </div>
              <span className="mt-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                من أصل 100 علامة
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>إجابات صحيحة</span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-emerald-950">
                {summary.correctQuestionCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span>صحيحة جزئياً</span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-amber-950">
                {summary.partialQuestionCount}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-rose-800">
                <XCircle className="h-4 w-4" />
                <span>إجابات خاطئة</span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-rose-950">
                {summary.wrongQuestionCount}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-purple-800">
                <Clock className="h-4 w-4" />
                <span>الوقت المستغرق</span>
              </div>
              <p className="mt-1 text-lg font-extrabold text-purple-950" dir="ltr">
                {formatDurationHHMMSS(elapsedSeconds)}
              </p>
            </div>
          </div>

          {/* Action Buttons: Download TXT Report, Teacher Key, New Attempt */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-pink-100">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:from-pink-700 hover:to-purple-700 active:scale-95 transition"
            >
              <Download className="h-4 w-4" />
              <span>تنزيل التقرير المفصّل (TXT بترميز UTF-8)</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenTeacherModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3.5 py-2.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>لوحة المعلّم</span>
              </button>

              <button
                type="button"
                onClick={onRestartExam}
                className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300 bg-white px-3.5 py-2.5 text-xs font-bold text-pink-800 hover:bg-pink-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>بدء محاولة جديدة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-pink-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-purple-950">
            <Award className="h-4 w-4 text-pink-600" />
            <span>مراجعة الأسئلة والإجابات النموذجية وخطوات الحل (30 سؤالاً):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `الكل (30)` },
              { id: 'correct', label: `صحيحة (${summary.correctQuestionCount})` },
              { id: 'partial', label: `جزئية (${summary.partialQuestionCount})` },
              { id: 'wrong', label: `خاطئة (${summary.wrongQuestionCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  filterStatus === tab.id
                    ? 'bg-pink-600 text-white'
                    : 'bg-pink-50 text-purple-900 hover:bg-pink-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Question-by-Question Review Cards */}
        <div className="space-y-4">
          {filteredQuestions.map(q => {
            const borderClass =
              q.status === 'correct'
                ? 'border-emerald-300'
                : q.status === 'partial'
                ? 'border-amber-300'
                : 'border-rose-300'

            const badgeClass =
              q.status === 'correct'
                ? 'bg-emerald-100 text-emerald-900'
                : q.status === 'partial'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-rose-100 text-rose-900'

            const statusLabel =
              q.status === 'correct'
                ? 'إجابة صحيحة بالكامل'
                : q.status === 'partial'
                ? 'إجابة صحيحة جزئياً (علامة جزئية)'
                : 'بحاجة إلى مراجعة'

            return (
              <div
                key={q.questionId}
                className={`rounded-3xl border-2 ${borderClass} bg-white p-4 sm:p-5 shadow-xs space-y-3`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-purple-900 px-3 py-1 text-xs font-extrabold text-white">
                      السؤال {q.questionNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-900">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>
                        {q.lessonTitle} (ص {q.pages})
                      </span>
                    </span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="rounded-xl bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-950" dir="ltr">
                    {q.earnedMarks} / {q.maxMarks} علامة
                  </div>
                </div>

                <p className="text-xs font-semibold text-purple-700">
                  المهارة: {q.skill}
                </p>

                {/* Branch Results */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.branchResults.map(b => (
                    <div
                      key={b.branchId}
                      className={`rounded-2xl border p-3 text-xs sm:text-sm ${
                        b.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : b.isPartial
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-purple-950">
                          الفرع ({b.label}): <RichMathText text={b.prompt} />
                        </span>
                        <span className="rounded-lg bg-white px-2.5 py-0.5 text-xs font-extrabold border border-purple-200" dir="ltr">
                          {b.earnedMarks} / {b.maxMarks}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="rounded-xl bg-white p-2 border border-purple-100">
                          <span className="block text-[11px] font-bold text-purple-600 mb-0.5">
                            إجابتكِ:
                          </span>
                          <span className="font-extrabold text-purple-950" dir="auto">
                            {b.studentAnswerDisplay}
                          </span>
                        </div>
                        <div className="rounded-xl bg-white p-2 border border-emerald-200">
                          <span className="block text-[11px] font-bold text-emerald-700 mb-0.5">
                            الإجابة النموذجية:
                          </span>
                          <span className="font-extrabold text-emerald-900" dir="auto">
                            {b.modelAnswerDisplay}
                          </span>
                        </div>
                      </div>

                      {b.errorFeedback && (
                        <div className="mt-2 rounded-xl bg-white/90 border border-rose-200 p-2.5 text-xs text-rose-900 font-semibold">
                          💡 توضيح الخطأ: {b.errorFeedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Solution Steps */}
                <div className="rounded-2xl bg-purple-50/50 border border-purple-100 p-3.5 text-xs sm:text-sm space-y-1.5">
                  <p className="font-extrabold text-purple-950">خطوات الحل الصحيحة:</p>
                  <ol className="list-decimal list-inside space-y-1 text-purple-900">
                    {q.solutionSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                  <p className="pt-1.5 mt-1.5 border-t border-purple-200/70 text-xs font-bold text-pink-800">
                    ✨ الفكرة الرياضية: {q.explanation}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ContactFooter />
    </div>
  )
}

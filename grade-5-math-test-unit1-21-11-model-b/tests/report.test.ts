/**
 * اختبار التقرير القابل للتنزيل (TXT): الحقول المطلوبة كلها، وتطابق الدرجة
 * مع محرك التصحيح نفسه المستعمل في صفحة النتيجة وحمولة Google Sheets.
 */
import { describe, expect, it } from 'vitest'
import { EXAM_ID, EXAM_TITLE } from '../src/config'
import { examQuestions, unitOneLessons } from '../src/data/questions'
import type { StudentAnswersMap } from '../src/types/exam'
import { gradeFullExam } from '../src/utils/scoring'
import { buildReportText, buildTxtReportFilename, BRANCH_COUNT, LESSON_MARKS_TOTAL } from '../src/lib/report'
import { formatDateTime } from '../src/lib/attempt'
import { perfectAnswers } from './answers'

const STARTED = Date.UTC(2026, 10, 21, 7, 0, 5)
const SUBMITTED = Date.UTC(2026, 10, 21, 7, 47, 38)
const ELAPSED = Math.floor((SUBMITTED - STARTED) / 1000)

function reportFor(answers: StudentAnswersMap, name = 'زينب أحمد الشامي') {
  return buildReportText({
    studentName: name,
    summary: gradeFullExam(answers, examQuestions),
    startedAtTimestamp: STARTED,
    submittedAtTimestamp: SUBMITTED,
    elapsedSeconds: ELAPSED,
  })
}

describe('ثوابت البنك المشتقة للتقرير', () => {
  it('86 فرعاً و100 علامة دروس', () => {
    expect(BRANCH_COUNT).toBe(86)
    expect(LESSON_MARKS_TOTAL).toBe(100)
  })
})

describe('محتوى التقرير لمحاولة كاملة', () => {
  const text = reportFor(perfectAnswers)

  it('البيانات التعريفية: الاسم والعنوان والمعرّف', () => {
    expect(text).toContain('زينب أحمد الشامي')
    expect(text).toContain(EXAM_TITLE)
    expect(text).toContain(EXAM_ID)
    expect(text).toContain('الرياضيات — الصف الخامس الأساسي — الفصل الدراسي الأول')
  })

  it('وقت البدء والتسليم والمدة', () => {
    expect(text).toContain(`وقت البدء: ${formatDateTime(STARTED)}`)
    expect(text).toContain(`وقت التسليم: ${formatDateTime(SUBMITTED)}`)
    expect(text).toContain('مدة الحل: 00:47:33')
    expect(text).toContain('(HH:MM:SS)')
  })

  it('الدرجة النهائية والنسبة والتقدير اللفظي', () => {
    expect(text).toContain('الدرجة النهائية: 100 من 100')
    expect(text).toContain('النسبة المئوية: 100%')
    expect(text).toContain('التقدير: ممتاز')
    expect(text).toContain('عدد الأسئلة الصحيحة بالكامل: 30 من 30')
  })

  it('توزيع العلامات على الدروس الثمانية', () => {
    for (const lesson of unitOneLessons) {
      expect(text).toContain(`${lesson.title} :`)
    }
    expect(text).toContain('شبكة الإحداثيات : 9 / 9')
    expect(text).toContain('الأعداد الطبيعية : 16 / 16')
    expect(text).toContain('المعيّن : 11 / 11')
  })

  it('نتيجة كل سؤال وفرع: إجابة الطالبة والنموذجية والعلامات', () => {
    expect(text).toContain('السؤال (1) — [صحيحة بالكامل] — العلامة: 3 / 3')
    expect(text).toContain('السؤال (30) — [صحيحة بالكامل] — العلامة: 4 / 4')
    expect(text).toContain('الفرع (أ) [1 / 1 علامة]')
    expect(text).toContain('الفرع (د) [1 / 1 علامة]')
    expect(text).toContain('- إجابة الطالبة: (6, 4)')
    expect(text).toContain('- الإجابة النموذجية: (6, 4)')
    expect(text).toContain('- الإجابة النموذجية: 120°')
    expect(text).toContain('خطوات الحل الصحيحة:')
    expect(text).toContain('القاعدة والشرح:')
    expect(text).toContain('المهارة:')
    // عدد أسطر «السؤال (» = 30 سؤالاً
    expect(text.match(/السؤال \(\d+\) —/g)).toHaveLength(30)
  })

  it('التذييل محفوظ من المصدر', () => {
    expect(text).toContain('إعداد وتطوير المنصة: المهندس سومر شاهين — 0930215022')
  })
})

describe('محتوى التقرير لمحاولة جزئية/خاطئة', () => {
  it('الفرع الخاطئ والجزئي يظهران بحالتهما وعلاماتهما', () => {
    const answers: StudentAnswersMap = { ...perfectAnswers }
    answers['q01-a'] = '(6, 2)' // جزئي 0.5/1
    answers['q05-a'] = '26' // خاطئ 0/1
    delete answers['q30-d'] // فارغ
    const text = reportFor(answers)
    expect(text).toContain('السؤال (1) — [صحيحة جزئياً (علامة جزئية)] — العلامة: 2.5 / 3')
    expect(text).toContain('الفرع (أ) [0.5 / 1 علامة]')
    expect(text).toContain('- إجابة الطالبة: (6, 2)')
    expect(text).toContain('شرح الخطأ / ملاحظة التصحيح:')
    expect(text).toContain('الدرجة النهائية: 97.5 من 100')
    expect(text).toContain('النسبة المئوية: 97.5%')
    expect(text).toContain('التقدير: ممتاز')
    // الفرع الفارغ: إجابة «لم تتم الإجابة» كما يعرضها محرك المصدر
    expect(text).toContain('- إجابة الطالبة: لم تتم الإجابة')
    expect(text).toContain('- شرح الخطأ / ملاحظة التصحيح: لم تتم الإجابة عن هذا الفرع.')
  })

  it('محاولة فارغة: يحتاج إلى دعم ودرجة صفر', () => {
    const text = reportFor({})
    expect(text).toContain('الدرجة النهائية: 0 من 100')
    expect(text).toContain('النسبة المئوية: 0%')
    expect(text).toContain('التقدير: يحتاج إلى دعم')
    expect(text).toContain('عدد الأسئلة الخاطئة: 30 من 30')
  })

  it('درجات التقرير مطابقة لدرجات محرك التصحيح (ومنها لحمولة Sheets)', () => {
    const answers: StudentAnswersMap = { ...perfectAnswers }
    answers['q23-a'] = '500,000'
    answers['q23-b'] = '350,000'
    answers['q23-c'] = '500,000'
    const summary = gradeFullExam(answers, examQuestions)
    const text = buildReportText({
      studentName: 'فحص',
      summary,
      startedAtTimestamp: STARTED,
      submittedAtTimestamp: SUBMITTED,
      elapsedSeconds: ELAPSED,
    })
    expect(text).toContain(`الدرجة النهائية: ${summary.totalEarned} من ${summary.totalMax}`)
    // q23 وحده: أ=0 (خاطئ) + ب=0.75 (متابعة سليمة) + ج=0.5 (متابعة سليمة) = 1.25 من 4
    // المجموع: 100 − 4 + 1.25 = 97.25
    expect(summary.totalEarned).toBe(97.25)
    expect(text).toContain('الدرجة النهائية: 97.25 من 100')
    expect(text).toContain('السؤال (23) — [صحيحة جزئياً (علامة جزئية)] — العلامة: 1.25 / 4')
  })
})

describe('اسم ملف التقرير', () => {
  it('عربي واضح ويتضمن اسم الطالبة sanitized', () => {
    const name = buildTxtReportFilename('زينب أحمد الشامي')
    expect(name).toBe('تقرير_مذاكرة_رياضيات_خامس_نموذج_B_زينب_أحمد_الشامي.txt')
  })

  it('المحارف الممنوعة في أسماء الملفات تُستبدل', () => {
    const name = buildTxtReportFilename('سارة/علي\\محمد:*?"<>|')
    expect(name).not.toMatch(/[\\/:*?"<>|]/)
    expect(name.endsWith('.txt')).toBe(true)
  })

  it('اسم فارغ يعطي «طالبة»', () => {
    expect(buildTxtReportFilename('   ')).toBe('تقرير_مذاكرة_رياضيات_خامس_نموذج_B_طالبة.txt')
  })
})

/**
 * Source Parity — مطابقة المصدر حرفياً.
 *
 * 1) الملفات التي نُقلت دون تعديل: مقارنة SHA-256 (مثبّتة هنا كنسخة تدقيق) مع
 *    مجلد المصدر "grade-5-math-test-Unit1 21-11 Model B" في هذا المستودع.
 * 2) الملفات التي لزم تكييفها لتعمل داخل المنصة (App.tsx وResultsView.tsx
 *    وملفات التعريف): اختبارات مقارنة محتوى تتأكد أن كل البيانات التعليمية
 *    وسلوك المصدر محفوظان، وأن التغيير منحصر في تكامل المنصة.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { examQuestions, unitOneLessons } from '../src/data/questions'
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { PENDING_PREFIX } from '../src/lib/submit'
import { STORAGE_KEY } from '../src/lib/attempt'
import { perfectAnswers } from './answers'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PUBLISHED = path.resolve(HERE, '..')
const REPO = path.resolve(PUBLISHED, '..')
const SOURCE = path.join(REPO, 'grade-5-math-test-Unit1 21-11 Model B')

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function walk(dir: string, base = dir): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, base))
    else out.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return out
}

/**
 * بصمات SHA-256 لنسخة المصدر المعتمدة عند إنشاء هذا الاختبار (تدقيق 2026-11-21).
 * أي تغيير في المصدر أو في النسخة المنشورة يكسر هذه المطابقة ويستوجب مراجعة صريحة.
 */
const VERBATIM_SHA256: Record<string, string> = {
  'src/data/questions.ts':
    '9082794105c6c4492555d8d28afcf63c8d3131ddbb743bded9549e4b7ee4468e',
  'src/types/exam.ts':
    'aff8be5be9a5775822833f1ab73a8993a1678fa29d274bfa4209ec45afa5fac6',
  'src/utils/scoring.ts':
    'bcc2d1faf486299cc4df970b3a5546880cb6279669f90da5434a0c7e6941fcc1',
  'src/utils/mathNorm.ts':
    'bc589a89524fb4ebcb06a626e6e40e33b38b6426cd7b03a2d47da284656caeee',
  'src/utils/sound.ts':
    'f4f3bfd57e2da3d160bde2c439a6fe42b266882c37ce6255ca8bbb901e05364c',
  'src/utils/cn.ts':
    'd1f1e0d62cb8d8d1e04c26e14de842d8a151f75812d81b046c65b5d1fe8e4b27',
  'src/components/ContactFooter.tsx':
    'f79502bb987f68521ba370b007f47774e143ba119aac4c452ff353fd28996517',
  'src/components/InteractiveVisuals.tsx':
    '7292f4b0e650f5654db060434c873e5f0f4beda25de7485322085fcd5fe2ebac',
  'src/components/MathKeypad.tsx':
    '2a7c819ec965ca68d283451f6e33a23595eb6ab7008d22269f05e356fbd54c24',
  'src/components/MathTex.tsx':
    'd6100fe67bbf8ad9738a1d820bcd1bb8579088d2a51c67576f7ff52b7a7768d3',
  'src/components/QuestionCard.tsx':
    'e964036674b90d59d6119383da246ba353973acc020c16d1ed2cbd341785aad8',
  'src/components/TeacherModal.tsx':
    '6514337b7ed21b64510e1bbd51c435b8318960ab696af70c2d1e5ddeaeed00b3',
  'src/index.css':
    '985949ce08818e9cac2d68d33a69a98b00c6d2b918dd5294a971869b03265fbc',
  'src/main.tsx':
    'f268dc44f71240012de0cfb1569d8ac906265cccd45eb3a99059c1a663d2f830',
  'vite.config.ts':
    '18dd184b9091357fe23797ee047138e6af7663b59697ac45d6c3c219522db9fa',
}

/**
 * الملفات التي أُعيدت صياغتها لهذا المنشور (تكامل المنصة فقط: معرّف الاختبار،
 * والإرسال إلى Google Sheets، ونافذة التأكيد النهائي، وحقول التقرير الإضافية).
 * كل ما عداها مما يوجد في المصدر إما مطابق حرفياً (أعلاه) أو ملفات تعريف/بناء
 * (package.json وpackage-lock.json وtsconfig.json وindex.html وREADME.md) أو
 * اختبارات المصدر (src/tests/*) التي أُعيدت صياغتها إلى vitest في tests/.
 */
const ADAPTED_FILES = new Set(['src/App.tsx', 'src/components/ResultsView.tsx'])
const BUILD_DEFINITION_FILES = new Set([
  'README.md',
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
])
const SOURCE_TEST_FILES = new Set(['src/tests/exam.test.ts', 'src/tests/ui-smoke.test.tsx'])

describe('Source parity — ملفات منقولة دون تعديل (SHA-256)', () => {
  it('مجلد المصدر موجود في هذا المستودع', () => {
    expect(existsSync(SOURCE)).toBe(true)
  })

  it('كل ملف محتوى/منطق في المصدر مطابق بايتاً ببايت في المنشور وبصمته مثبّتة', () => {
    for (const [relative, digest] of Object.entries(VERBATIM_SHA256)) {
      const sourceFile = path.join(SOURCE, relative)
      const publishedFile = path.join(PUBLISHED, relative)
      expect(existsSync(sourceFile), `${relative} missing in source`).toBe(true)
      expect(existsSync(publishedFile), `${relative} missing in published exam`).toBe(true)
      expect(sha256(sourceFile), `${relative} source digest changed`).toBe(digest)
      expect(sha256(publishedFile), `${relative} differs from source`).toBe(digest)
      expect(readFileSync(publishedFile, 'utf8'), `${relative} bytes differ`).toBe(
        readFileSync(sourceFile, 'utf8'),
      )
    }
  })

  it('لا يوجد ملف مصدر آخر غير مفهرس أعلاه (المصدر كله مغطى بالتدقيق)', () => {
    const files = walk(SOURCE)
    const accounted = new Set([
      ...Object.keys(VERBATIM_SHA256),
      ...ADAPTED_FILES,
      ...BUILD_DEFINITION_FILES,
      ...SOURCE_TEST_FILES,
    ])
    const unaccounted = files.filter((f) => !accounted.has(f))
    expect(unaccounted, `unaccounted source files: ${unaccounted.join(', ')}`).toEqual([])
  })

  it('بنك الأسئلة والمصحّح هما حرفياً ملفا المصدر (أهم ملفي محتوى)', () => {
    expect(sha256(path.join(PUBLISHED, 'src/data/questions.ts'))).toBe(
      VERBATIM_SHA256['src/data/questions.ts'],
    )
    expect(sha256(path.join(PUBLISHED, 'src/utils/scoring.ts'))).toBe(
      VERBATIM_SHA256['src/utils/scoring.ts'],
    )
  })
})

describe('Source parity — محتوى الملفات المكيفة (مقارنة محتوى)', () => {
  const appSource = readFileSync(path.join(SOURCE, 'src/App.tsx'), 'utf8')
  const appPublished = readFileSync(path.join(PUBLISHED, 'src/App.tsx'), 'utf8')
  const resultsSource = readFileSync(
    path.join(SOURCE, 'src/components/ResultsView.tsx'),
    'utf8',
  )
  const resultsPublished = readFileSync(
    path.join(PUBLISHED, 'src/components/ResultsView.tsx'),
    'utf8',
  )

  it('App.tsx يحافظ على عناصر واجهة الطالب وسلوك المصدر', () => {
    // عناوين وأزرار ومفردات المصدر الظاهرة للطالبة كما هي
    for (const ui of [
      'اسم الطالبة الثلاثي',
      'بدء الاختبار',
      'تسليم الاختبار',
      'السؤال السابق',
      'السؤال التالي',
      'الأسئلة المنجزة بالكامل',
      'لوحة المعلّم',
      'انتقلي مباشرة إلى أي سؤال (1–30)',
      'عرض الكل',
      'سؤالاً بسؤال',
      'الصوت مكتوم',
      'المنهاج السوري — الصف الخامس الأساسي',
      'يتألف هذا الاختبار التفاعلي من',
      'نطاق الاختبار — الدروس الثمانية في الوحدة الأولى وتوزيع العلامات',
      'اضغطي هنا للانتقال إلى أول سؤال غير مكتمل',
    ]) {
      expect(appSource.includes(ui), `sanity: source App.tsx must contain ${ui}`).toBe(true)
      expect(appPublished.includes(ui), `published App.tsx lost ${ui}`).toBe(true)
    }
    // منطق المصدر: الحفظ التلقائي، المؤقت التصاعدي، بوابة الإكمال قبل التسليم
    for (const logic of [
      'isExamComplete(attempt.answers, examQuestions)',
      'isQuestionComplete(q, attempt.answers)',
      'gradeFullExam(attempt.answers as StudentAnswersMap, examQuestions)',
      "playExamSound('start', attempt.isMuted)",
      "playExamSound('submit', attempt.isMuted)",
      'window.setInterval',
    ]) {
      expect(appPublished.includes(logic), `published App.tsx lost ${logic}`).toBe(true)
    }
  })

  it('App.tsx لا يستعمل مفتاح التخزين العام القديم من المصدر', () => {
    expect(appSource).toContain("const STORAGE_KEY = 'grade5_math_unit1_arena_exam_v1'")
    expect(appPublished).not.toContain('grade5_math_unit1_arena_exam_v1')
    expect(appPublished).toContain('loadAttempt')
    expect(appPublished).toContain('saveAttempt')
  })

  it('تكييف App.tsx محصور في تكامل المنصة (تسليم مؤكد + إرسال + attemptId)', () => {
    for (const platform of [
      'تأكيد التسليم النهائي',
      'buildPayload',
      'sendWithRetry',
      'retryPending',
      'pendingCount',
      'newAttemptId',
      'buildReportText',
      'EXAM_TITLE',
    ]) {
      expect(appPublished.includes(platform), `platform wiring missing: ${platform}`).toBe(true)
      expect(appSource.includes(platform), `source unexpectedly had: ${platform}`).toBe(false)
    }
  })

  it('ResultsView يحافظ على رسائل التشجيع ومراجعة الأسئلة وزر التقرير من المصدر', () => {
    for (const ui of [
      'أداء رائع ومتميّز يا بطلة الرياضيات! 🌸',
      'أحسنتِ المحاولة يا مبدعة! ✨',
      'خطوة جيدة ومجهود طيّب! 🌷',
      'شكراً لمحاولتكِ واجتهادكِ يا لطيفة! 🌺',
      'تنزيل التقرير المفصّل (TXT بترميز UTF-8)',
      'مراجعة الأسئلة والإجابات النموذجية وخطوات الحل (30 سؤالاً)',
      'إجابة صحيحة بالكامل',
      'إجابة صحيحة جزئياً (علامة جزئية)',
      'بحاجة إلى مراجعة',
      'الإجابة النموذجية:',
      'خطوات الحل الصحيحة:',
      'الفكرة الرياضية:',
      'لوحة المعلّم',
      'بدء محاولة جديدة',
    ]) {
      expect(resultsSource.includes(ui), `sanity: source ResultsView must contain ${ui}`).toBe(
        true,
      )
      expect(resultsPublished.includes(ui), `published ResultsView lost ${ui}`).toBe(true)
    }
  })

  it('ResultsView المكيف يضيف حالة الإرسال وحقول المنصة دون حذف محتوى المصدر', () => {
    for (const platform of [
      'SendBanner',
      'submitStatus',
      'إعادة إرسال يدوي',
      'جارٍ إرسال النتيجة إلى المعلّم…',
      '✓ تم إرسال النتيجة إلى المعلّم.',
      'gradeLabel',
      'percentageOf',
      'buildReportText',
      'startedAtTimestamp',
    ]) {
      expect(resultsPublished.includes(platform), `platform UI missing: ${platform}`).toBe(true)
    }
    // مولّد التقرير القديم داخل المكوّن استُبدل بالنسخة الموسعة في lib/report.ts
    expect(resultsPublished).not.toContain('function generateTxtReportContent')
  })

  it('تقرير المنصة الموسّع يحافظ على أسطر تفاصيل المصدر حرفياً في بنيتها', () => {
    const report = readFileSync(path.join(PUBLISHED, 'src/lib/report.ts'), 'utf8')
    for (const line of [
      'const statusAr =',
      "'صحيحة بالكامل'",
      "'صحيحة جزئياً (علامة جزئية)'",
      "'خاطئة'",
      '`السؤال (${q.questionNumber}) — [${statusAr}] — العلامة: ${q.earnedMarks} / ${q.maxMarks}`',
      '`الدرس: ${q.lessonTitle} | الصفحات المرجعية: ص ${q.pages}`',
      '`المهارة: ${q.skill}`',
      '`    - إجابة الطالبة: ${b.studentAnswerDisplay}`',
      '`    - الإجابة النموذجية: ${b.modelAnswerDisplay}`',
      '`    - شرح الخطأ / ملاحظة التصحيح: ${b.errorFeedback}`',
      "'إعداد وتطوير المنصة: المهندس سومر شاهين — 0930215022'",
    ]) {
      expect(report.includes(line), `report.ts lost source line: ${line}`).toBe(true)
    }
  })

  it('بوابة المعلم (من المصدر دون تعديل): كلمة المرور والتنبيه التجميلي', () => {
    const teacher = readFileSync(path.join(PUBLISHED, 'src/components/TeacherModal.tsx'), 'utf8')
    expect(teacher).toContain("passwordInput.trim() === 'somer173'")
    expect(teacher).toContain('وسيلة إخفاء للواجهة فقط')
    expect(teacher).toContain('وليست مصادقة أمنية حقيقية')
  })
})

describe('سلامة بيانات المصدر كما وصلت إلى المنشور', () => {
  it('30 سؤالاً رئيسياً و86 فرعاً و100 علامة — مطابقة لمخطط المصدر', () => {
    expect(examQuestions).toHaveLength(30)
    const branches = examQuestions.reduce((s, q) => s + q.branches.length, 0)
    expect(branches).toBe(86)
    expect(examQuestions.reduce((s, q) => s + q.totalMarks, 0)).toBe(100)
    for (const q of examQuestions) {
      const sum = Number(q.branches.reduce((s, b) => s + b.marks, 0).toFixed(2))
      expect(sum, `branches of Q${q.number} must sum to its totalMarks`).toBe(q.totalMarks)
    }
  })

  it('توزيع الدروس الثمانية (عدد الأسئلة والعلامات والصفحات) كما في المصدر', () => {
    const expected: Array<[string, number, number, string]> = [
      ['coordinates', 3, 9, '3–4'],
      ['line-graphs', 3, 9, '7–9'],
      ['natural-numbers', 5, 16, '10–14'],
      ['rounding-natural-numbers', 4, 13, '15–18'],
      ['adding-subtracting-natural-numbers', 5, 17, '19–22'],
      ['angle-measurement', 4, 14, '23–30'],
      ['parallelogram', 3, 11, '31–35'],
      ['rhombus', 3, 11, '36–39'],
    ]
    expect(unitOneLessons).toHaveLength(8)
    for (const [id, count, marks, pages] of expected) {
      const qs = examQuestions.filter((q) => q.lessonId === id)
      expect(qs.length, `${id} question count`).toBe(count)
      expect(
        qs.reduce((s, q) => s + q.totalMarks, 0),
        `${id} marks`,
      ).toBe(marks)
      const lesson = unitOneLessons.find((l) => l.id === id)!
      expect(lesson.pages, `${id} pages`).toBe(pages)
      expect(lesson.questionCount).toBe(count)
      expect(lesson.totalMarks).toBe(marks)
    }
  })

  it('خريطة الإجابات النموذجية (من اختبار المصدر) تغطي كل الفروع exactement', () => {
    const branchIds = examQuestions.flatMap((q) => q.branches.map((b) => b.id))
    expect(new Set(branchIds).size).toBe(branchIds.length)
    expect(Object.keys(perfectAnswers).sort()).toEqual([...branchIds].sort())
  })
})

describe('استقلال نموذج B عن نموذج A وعن بقية المنصة', () => {
  it('معرّف وعنوان خاصان بهذا الاختبار', () => {
    expect(EXAM_ID).toBe('grade-5-math-test-unit1-21-11-model-b')
    expect(EXAM_TITLE).toBe('مذاكرة رياضيات صف خامس نموذج B')
  })

  it('كل مفاتيح التخزين مسمّاة بمعرّف هذا الاختبار', () => {
    expect(STORAGE_KEY).toBe('grade-5-math-test-unit1-21-11-model-b-attempt-v1')
    expect(PENDING_PREFIX).toBe('pending:grade-5-math-test-unit1-21-11-model-b:')
  })

  it('لا يظهر في src/ أي مفتاح تخزين عام أو تابع لاختبار آخر', () => {
    const files = walk(path.join(PUBLISHED, 'src')).filter(
      (f) => f.endsWith('.ts') || f.endsWith('.tsx'),
    )
    const forbidden = [
      'grade5_math_unit1_arena_exam_v1', // مفتاح المصدر العام
      'grade-5-math-test-unit1-21-11-attempt-v1', // نموذج A
      'pending:grade-5-math-test-unit1-21-11:', // نموذج A
      'grade5-math-unit1-attempt-v1', // الاختبار المرجعي
      'arena-math-unit1-attempt-v1',
      'arena-math-muted-v1',
    ]
    for (const file of files) {
      const text = readFileSync(path.join(PUBLISHED, 'src', file), 'utf8')
      for (const key of forbidden) {
        expect(text.includes(key), `${file} must not use ${key}`).toBe(false)
      }
    }
  })

  it('عقد Google Sheets المرجعي (الرابط والرمز) بلا تغيير', () => {
    const reference = readFileSync(path.join(REPO, 'grade5-math-unit1', 'src', 'config.ts'), 'utf8')
    expect(reference).toContain(SHEETS_URL)
    expect(reference).toContain(SHEETS_TOKEN)
    const modelA = readFileSync(
      path.join(REPO, 'grade-5-math-test-unit1-21-11', 'src', 'config.ts'),
      'utf8',
    )
    expect(modelA).toContain(SHEETS_URL)
    expect(modelA).toContain(SHEETS_TOKEN)
  })

  it('لا تصل الإجابات النموذجية الاختبارية إلى حزمة الطالب', () => {
    const files = walk(path.join(PUBLISHED, 'src'))
    for (const file of files) {
      const text = readFileSync(path.join(PUBLISHED, 'src', file), 'utf8')
      expect(text.includes('perfectAnswers'), `${file} must not import test answers`).toBe(false)
      expect(text.includes('tests/answers'), `${file} must not reference tests/answers`).toBe(false)
    }
  })
})

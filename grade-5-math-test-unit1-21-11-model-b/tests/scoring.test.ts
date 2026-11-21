/**
 * اختبارات التصحيح والدرجات — port كامل لاختبار المصدر (src/tests/exam.test.ts)
 * إلى vitest، مضافاً إليه التغطية المطلوبة للمنصة:
 *  · الإجابات الصحيحة والخاطئة والفارغة والجزئية لكل نوع من أنواع الإدخال الثمانية.
 *  · الصيغ الرياضية المكافئة (أرقام هندية، فواصل، وحدات، صيغ أزواج بديلة) وغير المكافئة.
 *  · التطابق الحرفي مع مخطط المصدر: 30 سؤالاً، 86 فرعاً، 100 علامة، توزيع الدروس.
 *  · التدقيق الحسابي المستقل لعمليات المصدر (نفس asserts اختبار المصدر).
 */
import { describe, expect, it } from 'vitest'
import { examQuestions, unitOneLessons } from '../src/data/questions'
import type { StudentAnswersMap, SubQuestionBranch } from '../src/types/exam'
import {
  gradeFullExam,
  gradeQuestion,
  gradeSingleBranch,
  isBranchAnswered,
  isExamComplete,
  isQuestionComplete,
} from '../src/utils/scoring'
import {
  formatDurationHHMMSS,
  isNumericallyEqual,
  parseNaturalNumber,
  parseOrderedPair,
} from '../src/utils/mathNorm'
import { perfectAnswers, wrongAnswerFor } from './answers'

const allBranches: SubQuestionBranch[] = examQuestions.flatMap((q) => q.branches)
const branchById = (id: string): SubQuestionBranch => {
  const b = allBranches.find((x) => x.id === id)
  if (!b) throw new Error(`unknown branch ${id}`)
  return b
}
const grade = (id: string, value: string, extra: StudentAnswersMap = {}) =>
  gradeSingleBranch(branchById(id), { [id]: value, ...extra })

describe('مخطط المصدر: الأسئلة والفروع والعلامات', () => {
  it('30 سؤالاً مرقمة 1..30 بالترتيب المعروض في المصدر', () => {
    expect(examQuestions).toHaveLength(30)
    examQuestions.forEach((q, idx) => expect(q.number).toBe(idx + 1))
  })

  it('مجموع علامات الفروع يساوي علامة كل سؤال، والمجموع الكلي 100', () => {
    for (const q of examQuestions) {
      const sum = Number(q.branches.reduce((s, b) => s + b.marks, 0).toFixed(2))
      expect(sum, `Q${q.number}`).toBe(q.totalMarks)
    }
    expect(examQuestions.reduce((s, q) => s + q.totalMarks, 0)).toBe(100)
  })

  it('86 فرعاً مقوّماً تغطي أنواع الإدخال الثمانية الموجودة في المصدر', () => {
    expect(allBranches).toHaveLength(86)
    const kinds = new Set(allBranches.map((b) => b.inputKind))
    expect(kinds).toEqual(
      new Set([
        'text',
        'number',
        'ordered-pair',
        'choice',
        'compare-symbol',
        'order-list',
        'interactive-point',
        'interactive-angle',
      ]),
    )
  })

  it('توزيع الدروس الثمانية (العدد والعلامات والصفحات) حرفياً كما في المصدر', () => {
    const expected: Record<string, { count: number; marks: number; pages: string }> = {
      coordinates: { count: 3, marks: 9, pages: '3–4' },
      'line-graphs': { count: 3, marks: 9, pages: '7–9' },
      'natural-numbers': { count: 5, marks: 16, pages: '10–14' },
      'rounding-natural-numbers': { count: 4, marks: 13, pages: '15–18' },
      'adding-subtracting-natural-numbers': { count: 5, marks: 17, pages: '19–22' },
      'angle-measurement': { count: 4, marks: 14, pages: '23–30' },
      parallelogram: { count: 3, marks: 11, pages: '31–35' },
      rhombus: { count: 3, marks: 11, pages: '36–39' },
    }
    for (const lesson of unitOneLessons) {
      const qs = examQuestions.filter((q) => q.lessonId === lesson.id)
      const exp = expected[lesson.id]
      expect(exp, `${lesson.id} in blueprint`).toBeTruthy()
      expect(qs.length, lesson.title).toBe(exp.count)
      expect(qs.reduce((s, q) => s + q.totalMarks, 0), lesson.title).toBe(exp.marks)
      expect(lesson.pages).toBe(exp.pages)
    }
    expect(unitOneLessons).toHaveLength(8)
    expect(unitOneLessons.reduce((s, l) => s + l.questionCount, 0)).toBe(30)
    expect(unitOneLessons.reduce((s, l) => s + l.totalMarks, 0)).toBe(100)
  })

  it('الأسئلة متداخلة بين الدروس (لا سؤالان متتاليان من الدرس نفسه) كما في المصدر', () => {
    for (let i = 1; i < examQuestions.length; i++) {
      expect(examQuestions[i].lessonId).not.toBe(examQuestions[i - 1].lessonId)
    }
  })
})

describe('التدقيق الحسابي المستقل (نفس asserts اختبار المصدر)', () => {
  it('عمليات الجمع والطرح في المسائل صحيحة رياضياً', () => {
    expect(2468750 + 1854690).toBe(4323440) // Q6
    expect(5000000 - 2364800).toBe(2635200) // Q11
    expect(425600 - 289450).toBe(136150) // Q17
    expect(325400 + 274600).toBe(600000) // Q23 خطوة 1
    expect(850000 - 600000).toBe(250000) // Q23 خطوة 2
    expect(250000 + 150000).toBe(400000) // Q23 خطوة 3
    expect(742500 - 318200).toBe(424300) // Q29
    expect(424300 + 318200).toBe(742500) // Q29 تحقق
  })

  it('قيم التقريب في الإجابات النموذجية صحيحة', () => {
    const roundToPlace = (n: number, place: number) => Math.round(n / place) * place
    expect(roundToPlace(2740, 1000)).toBe(3000)
    expect(roundToPlace(468210, 10000)).toBe(470000)
    expect(roundToPlace(3482137, 100000)).toBe(3500000)
    expect(roundToPlace(5628000, 1000000)).toBe(6000000)
    expect(roundToPlace(7846200, 10000)).toBe(7850000)
    expect(roundToPlace(7846200, 100000)).toBe(7800000)
    expect(roundToPlace(184490, 10000)).toBe(180000)
  })

  it('إحداثيات الأشكال ومساراتها متسقة مع الإجابات النموذجية', () => {
    // Q25: P(5,6) ثم +3 يميناً و−2 للأعلى → Q(8,4)
    expect(5 + 3).toBe(8)
    expect(6 - 2).toBe(4)
    // Q27: A(1,1) B(5,1) D(2,4) → C = D + (B−A) = (6,4)
    expect(2 + (5 - 1)).toBe(6)
    expect(4 + (1 - 1)).toBe(4)
    // Q30: AF=4 (معيّن) و FB=6 → AB=10
    expect(4 + 6).toBe(10)
    // Q5/Q14/Q22 فروق الرسوم البيانية
    expect(30 - 15).toBe(15)
    expect(20 - 16).toBe(4)
    expect(45 - 20).toBe(25)
  })
})

describe('المحاولة الكاملة: 100 من 100', () => {
  it('الإجابات النموذجية الكاملة تكمل الاختبار وتحصل على 100/100', () => {
    expect(isExamComplete(perfectAnswers)).toBe(true)
    const summary = gradeFullExam(perfectAnswers)
    expect(summary.totalEarned).toBe(100)
    expect(summary.totalMax).toBe(100)
    expect(summary.correctQuestionCount).toBe(30)
    expect(summary.partialQuestionCount).toBe(0)
    expect(summary.wrongQuestionCount).toBe(0)
    for (const q of summary.questionResults) {
      expect(q.status, `Q${q.questionNumber}`).toBe('correct')
      expect(q.earnedMarks).toBe(q.maxMarks)
      for (const b of q.branchResults) {
        expect(b.isCorrect, b.branchId).toBe(true)
        expect(b.earnedMarks).toBe(b.maxMarks)
      }
    }
  })

  it('كل سؤال مصحَّح بصورة مستقلة عن بقية الأسئلة', () => {
    // تصحيح سؤال واحد بمفرده يعطي نفس نتيجة تصحيحه ضمن المحاولة الكاملة
    for (const q of examQuestions) {
      const alone = gradeQuestion(q, perfectAnswers)
      expect(alone.earnedMarks, q.id).toBe(q.totalMarks)
      expect(alone.status).toBe('correct')
    }
  })
})

describe('الإجابات الفارغة والناقصة', () => {
  it('الفرع الفارغ يأخذ صفراً مع ملاحظة «لم تتم الإجابة»', () => {
    for (const b of allBranches) {
      const g = gradeSingleBranch(b, { [b.id]: '' })
      expect(g.earnedMarks, b.id).toBe(0)
      expect(g.isCorrect).toBe(false)
      expect(g.isPartial).toBe(false)
      expect(g.errorFeedback).toBe('لم تتم الإجابة عن هذا الفرع.')
    }
  })

  it('المسافات البيضاء وحدها تعامل معاملة الفارغ', () => {
    expect(isBranchAnswered(branchById('q01-a'), { 'q01-a': '   ' })).toBe(false)
    expect(grade('q05-a', '  \u200f ').earnedMarks).toBe(0)
  })

  it('محاولة فارغة بالكامل: صفر من 100 وكل الأسئلة خاطئة والاختبار غير مكتمل', () => {
    expect(isExamComplete({})).toBe(false)
    const summary = gradeFullExam({})
    expect(summary.totalEarned).toBe(0)
    expect(summary.correctQuestionCount).toBe(0)
    expect(summary.wrongQuestionCount).toBe(30)
    for (const q of summary.questionResults) expect(q.status).toBe('wrong')
  })

  it('ترك فرع واحد فارغاً يمنع اكتمال السؤال والاختبار (بوابة التسليم)', () => {
    const incomplete = { ...perfectAnswers }
    delete incomplete['q30-d']
    expect(isExamComplete(incomplete)).toBe(false)
    expect(isQuestionComplete(examQuestions[29], incomplete)).toBe(false)
    expect(isQuestionComplete(examQuestions[28], incomplete)).toBe(true)
  })

  it('لا علامة لإجابة خاطئة: كنس كل الفروع بإجابة خاطئة واضحة = صفر', () => {
    for (const b of allBranches) {
      const g = gradeSingleBranch(b, { [b.id]: wrongAnswerFor(b.id) })
      expect(g.earnedMarks, `${b.id} must not award marks for a wrong answer`).toBe(0)
      expect(g.isCorrect).toBe(false)
    }
  })
})

describe('الأزواج المرتبة (ordered-pair / interactive-point)', () => {
  it('الإجابة الصحيحة بكل صيغها المكافئة تأخذ العلامة كاملة', () => {
    for (const form of ['(6, 4)', '6, 4', '(6،4)', '(٦ ، ٤)', 'A(6,4)', ' (6 ,4 ) ']) {
      expect(grade('q01-a', form).earnedMarks, form).toBe(1)
    }
  })

  it('عكس الإحداثيين يأخذ صفراً مع تشخيص الخطأ (لا يساوي الإجابة الصحيحة)', () => {
    const g = grade('q01-a', '(4, 6)')
    expect(g.earnedMarks).toBe(0)
    expect(g.errorFeedback).toContain('عكستِ ترتيب الإحداثيين')
  })

  it('إصابة إحداثي واحد تمنح نصف علامة الفرع (جزئي)', () => {
    expect(grade('q01-a', '(6, 2)').earnedMarks).toBe(0.5) // من 1
    expect(grade('q01-a', '(2, 4)').earnedMarks).toBe(0.5)
    expect(grade('q12-a', '(4, 2)').earnedMarks).toBe(1) // من 2 (تفاعلي)
    expect(grade('q27-a', '(9, 4)').earnedMarks).toBe(1) // من 2 (تفاعلي)
    expect(grade('q12-a', '(4, 2)').isPartial).toBe(true)
  })

  it('الصيغ غير المكافئة ترفض: فاصلة عشرية أو رقم ملتصق أو نص', () => {
    expect(grade('q01-a', '6.4').earnedMarks).toBe(0)
    expect(grade('q01-a', '64').earnedMarks).toBe(0)
    expect(grade('q01-a', 'ستة أربعة').earnedMarks).toBe(0)
    expect(parseOrderedPair('6.4')).toBeNull()
    expect(parseOrderedPair('(٨ ، ٤)')).toEqual({ x: 8, y: 4 })
  })
})

describe('الأعداد (number): صيغ مكافئة وغير مكافئة', () => {
  it('يقبل الفواصل الإنجليزية والعربية والمسافات والأرقام الهندية والوحدات', () => {
    for (const form of ['7,050,309', '7050309', '٧،٠٥٠،٣٠٩', '7 050 309']) {
      expect(grade('q02-a', form).earnedMarks, form).toBe(1.5)
    }
    expect(grade('q16-a', '6').earnedMarks).toBe(1)
    expect(grade('q16-a', '6 cm').earnedMarks).toBe(1)
    expect(grade('q16-a', '6سم').earnedMarks).toBe(1)
    expect(grade('q16-c', '70°').earnedMarks).toBe(1)
    expect(grade('q16-c', '70 درجة').earnedMarks).toBe(1)
    expect(grade('q05-a', '25 قصة').earnedMarks).toBe(1)
    expect(isNumericallyEqual('٧،٠٥٠،٣٠٩', 7050309)).toBe(true)
    expect(parseNaturalNumber('007')).toBe(7)
  })

  it('يرفض الأعداد غير المكافئة والقيم القريبة', () => {
    expect(grade('q02-a', '7,500,308').earnedMarks).toBe(0)
    expect(grade('q05-a', '26').earnedMarks).toBe(0)
    expect(grade('q04-c', '2,000').earnedMarks).toBe(0)
    expect(isNumericallyEqual('7.5', 75)).toBe(false)
  })

  it('أصفار حفظ المنزلة: أخطاء شائعة محددة تأخذ 0.5 جزئية (كما في المصدر)', () => {
    for (const near of ['7500309', '7005309', '750309']) {
      const g = grade('q02-a', near)
      expect(g.earnedMarks, near).toBe(0.5)
      expect(g.isPartial).toBe(true)
    }
  })

  it('q08-c: الرقم 9 صحيح والقيمة المنزلية 9,000,000 جزئية (0.5)', () => {
    expect(grade('q08-c', '9').earnedMarks).toBe(1)
    expect(grade('q08-c', '9,000,000').earnedMarks).toBe(0.5)
    expect(grade('q08-c', '4').earnedMarks).toBe(0)
  })
})

describe('الجمع والطرح مع العلامات الجزئية (حمل/استلاف مفقود)', () => {
  it('q06: مجموع المنزلة مع الحمل 13، ورقم المنزلة وحده أو بلا حمل جزئي 0.5', () => {
    expect(grade('q06-a', '13').earnedMarks).toBe(1)
    expect(grade('q06-a', '12').earnedMarks).toBe(0.5) // نسيان الحمل
    expect(grade('q06-a', '3').earnedMarks).toBe(0.5) // رقم المنزلة فقط
    expect(grade('q06-a', '14').earnedMarks).toBe(0)
  })

  it('q06-b: الناتج الكامل 2 من 2، وخطأ حمل واحد بمقدار منزلة = 1 جزئية', () => {
    expect(grade('q06-b', '4,323,440').earnedMarks).toBe(2)
    expect(grade('q06-b', '4,223,440').earnedMarks).toBe(1) // حمل مئات الألوف مفقود (فرق 100,000)
    expect(grade('q06-b', '4,323,430').earnedMarks).toBe(1) // فرق 10
    expect(grade('q06-b', '4,323,445').earnedMarks).toBe(0) // فرق 5 ليس خطأ حمل بمنزلة
  })

  it('q11-b: الاستلاف عبر الأصفار — خطأ منزلة واحدة يمنح 1 من 2', () => {
    expect(grade('q11-b', '2,635,200').earnedMarks).toBe(2)
    expect(grade('q11-b', '2,635,100').earnedMarks).toBe(1) // فرق 100
    expect(grade('q11-b', '2,635,201').earnedMarks).toBe(0) // فرق 1 ليس خطأ استلاف
  })

  it('q17-b: الفرق الصحيح 2 من 2 وخطأ استلاف واحد 1 جزئية', () => {
    expect(grade('q17-b', '136,150').earnedMarks).toBe(2)
    expect(grade('q17-b', '136,050').earnedMarks).toBe(1) // فرق 100
    expect(grade('q17-b', '714,050').earnedMarks).toBe(0) // جمع بدل الطرح
  })
})

describe('المسألة متعددة الخطوات q23: متابعة الخطوات (follow-through)', () => {
  it('السلسلة الصحيحة كاملة = 4 من 4', () => {
    const g = gradeQuestion(examQuestions[22], {
      'q23-a': '600,000',
      'q23-b': '250,000',
      'q23-c': '400,000',
    })
    expect(g.earnedMarks).toBe(4)
    expect(g.status).toBe('correct')
  })

  it('خطأ في الخطوة الأولى مع متابعة سليمة = 1.25 (كما في اختبار المصدر)', () => {
    const g = gradeQuestion(examQuestions[22], {
      'q23-a': '500,000', // خطأ
      'q23-b': '350,000', // 850,000 − 500,000 متابعة سليمة → 0.75
      'q23-c': '500,000', // 350,000 + 150,000 متابعة سليمة → 0.5
    })
    expect(g.status).toBe('partial')
    expect(g.earnedMarks).toBe(1.25)
  })

  it('إجابات غير مترابطة لا تمنح جزئياً', () => {
    const g = gradeQuestion(examQuestions[22], {
      'q23-a': '111,111',
      'q23-b': '222,222',
      'q23-c': '333,333',
    })
    expect(g.earnedMarks).toBe(0)
    expect(g.status).toBe('wrong')
  })
})

describe('الكتابة اللفظية والصيغة الموسعة (text)', () => {
  it('q02-b: الصيغة اللفظية الكاملة 1.5 وحلقتان من ثلاث = 1 جزئية', () => {
    expect(grade('q02-b', 'أربعة ملايين وستمئة وثمانية آلاف وعشرون').earnedMarks).toBe(1.5)
    // صيغ إملائية مكافئة (همزات وتاء مربوطة) تقبل بعد التطبيع
    expect(grade('q02-b', 'اربعه ملايين و ستمائه و ثمانيه الاف و عشرون').earnedMarks).toBe(1.5)
    const partial = grade('q02-b', 'اربعه ملايين وستمئه وثمانيه الاف')
    expect(partial.earnedMarks).toBe(1) // كما في اختبار المصدر
    expect(partial.isPartial).toBe(true)
    expect(grade('q02-b', 'سبعة ملايين').earnedMarks).toBe(0)
  })

  it('q15-b: الصيغة الموسعة الكاملة 1.5 بصيغ كتابية مكافئة', () => {
    expect(grade('q15-b', '4,000,000 + 500,000 + 7,000 + 90').earnedMarks).toBe(1.5)
    expect(grade('q15-b', '4000000+500000+7000+90').earnedMarks).toBe(1.5)
    expect(grade('q15-b', '٤٠٠٠٠٠٠ + ٥٠٠٠٠٠ + ٧٠٠٠ + ٩٠').earnedMarks).toBe(1.5)
  })

  it('q15-b: حدود جزئية صحيحة وقيم خاطئة لا تمنح شيئاً', () => {
    const two = grade('q15-b', '4,000,000 + 500,000')
    expect(two.earnedMarks).toBe(0.75) // حدّان صحيحان من أربعة
    expect(two.isPartial).toBe(true)
    expect(grade('q15-b', '4,000,000').earnedMarks).toBe(0) // حد واحد لا يكفي
    expect(grade('q15-b', '9,000,000 + 500,000 + 7,000 + 90').earnedMarks).toBeLessThan(1.5)
  })

  it('q15-c: التركيب من الصيغة التحليلية 8,309,062 وأخطاء الأصفار جزئية 0.75', () => {
    expect(grade('q15-c', '8,309,062').earnedMarks).toBe(1.5)
    expect(grade('q15-c', '839062').earnedMarks).toBe(0.75)
    expect(grade('q15-c', '8,390,602').earnedMarks).toBe(0)
  })

  it('q07-c: مصطلح «قطر» يقبل بصيغ مكافئة وما سواه صفر', () => {
    expect(grade('q07-c', 'قطر').earnedMarks).toBe(1)
    expect(grade('q07-c', 'القطر').earnedMarks).toBe(1)
    expect(grade('q07-c', 'يسمى قطر المتوازي').earnedMarks).toBe(1)
    expect(grade('q07-c', 'ضلع').earnedMarks).toBe(0)
  })

  it('q03-a: حرف الرأس A يقبل بأشكال مكافئة', () => {
    expect(grade('q03-a', 'A').earnedMarks).toBe(1)
    expect(grade('q03-a', 'a').earnedMarks).toBe(1)
    expect(grade('q03-a', 'أ').earnedMarks).toBe(1)
    expect(grade('q03-a', 'B').earnedMarks).toBe(0)
  })
})

describe('الاختيار من متعدد (choice) — لا تساهل مع خيار غير صحيح', () => {
  it('الخيار الصحيح فقط يأخذ العلامة في كل فروع الاختيار', () => {
    const correctChoice: StudentAnswersMap = {
      'q03-b': 'bac', 'q03-c': 'inside', 'q04-b': 'right-3000', 'q05-b': 'mon',
      'q07-a': 'fig1', 'q07-b': 'one-pair', 'q09-a': 'fig2', 'q09-b': 'adj',
      'q09-c': 'false-fix', 'q10-a': 'acute', 'q10-b': 'right', 'q10-c': 'obtuse',
      'q10-d': 'straight', 'q12-b': 'swapped', 'q14-a': 'sun-mon', 'q14-c': 'inc',
      'q17-a': 'sub', 'q18-a': 'inner-right', 'q18-c': 'wrong-scale',
      'q21-c': 'ten-thousands', 'q24-b': 'obtuse', 'q26-c': 'wrong-neighbor',
      'q29-a': 'forgot-borrow',
    }
    for (const [id, value] of Object.entries(correctChoice)) {
      expect(grade(id, value).earnedMarks, id).toBe(branchById(id).marks)
    }
    // كل خيار آخر في كل فرع اختيار = صفر
    for (const b of allBranches.filter((x) => x.inputKind === 'choice')) {
      for (const opt of b.options ?? []) {
        const g = grade(b.id, opt.id)
        if (opt.id === correctChoice[b.id]) expect(g.earnedMarks, b.id).toBe(b.marks)
        else expect(g.earnedMarks, `${b.id}=${opt.id}`).toBe(0)
      }
    }
  })
})

describe('رموز المقارنة (compare-symbol)', () => {
  it('يقبل المعرّف والرمز الصريح كليهما (صيغتان مكافئتان)', () => {
    expect(grade('q19-c', 'gt').earnedMarks).toBe(1)
    expect(grade('q19-c', '>').earnedMarks).toBe(1)
    expect(grade('q28-b', 'gt').earnedMarks).toBe(1.5)
    expect(grade('q28-b', '>').earnedMarks).toBe(1.5)
  })

  it('الرمز الخاطئ صفر', () => {
    expect(grade('q19-c', 'lt').earnedMarks).toBe(0)
    expect(grade('q19-c', '<').earnedMarks).toBe(0)
    expect(grade('q19-c', '=').earnedMarks).toBe(0)
    expect(grade('q28-b', 'eq').earnedMarks).toBe(0)
  })
})

describe('ترتيب الأعداد (order-list)', () => {
  it('الترتيب التصاعدي الصحيح كامل 1.5', () => {
    expect(grade('q28-a', 'n2,n3,n1').earnedMarks).toBe(1.5)
  })

  it('طرف واحد في موضعه = 0.75 جزئية، والترتيب المعكوس صفر', () => {
    expect(grade('q28-a', 'n2,n1,n3').earnedMarks).toBe(0.75) // الأصغر في مكانه
    expect(grade('q28-a', 'n1,n3,n2').earnedMarks).toBe(0)
    expect(grade('q28-a', 'n1,n2,n3').earnedMarks).toBe(0) // معكوس تماماً
    expect(grade('q28-a', 'n3,n2,n1').earnedMarks).toBe(0.75) // الأكبر في مكانه
  })
})

describe('المنقلة التفاعلية (interactive-angle) q24-a — هامش اللمس', () => {
  it('120° بالضبط وبهامش ±3 = العلامة الكاملة 2.5', () => {
    expect(grade('q24-a', '120').earnedMarks).toBe(2.5)
    expect(grade('q24-a', '118').earnedMarks).toBe(2.5) // كما في اختبار المصدر
    expect(grade('q24-a', '123').earnedMarks).toBe(2.5)
    expect(grade('q24-a', '117').earnedMarks).toBe(2.5)
  })

  it('هامش ±6 = علامة جزئية 1.5، وما بعده صفر (حدود الهامش بالضبط)', () => {
    expect(grade('q24-a', '115').earnedMarks).toBe(1.5) // كما في اختبار المصدر
    expect(grade('q24-a', '116').earnedMarks).toBe(1.5)
    expect(grade('q24-a', '124').earnedMarks).toBe(1.5)
    expect(grade('q24-a', '126').earnedMarks).toBe(1.5)
    // الحد: الفرق 4..6 جزئي، والفرق 7 فأكثر صفر
    expect(grade('q24-a', '114').earnedMarks).toBe(1.5)
    expect(grade('q24-a', '113').earnedMarks).toBe(0)
    expect(grade('q24-a', '127').earnedMarks).toBe(0)
    expect(grade('q24-a', '128').earnedMarks).toBe(0)
  })

  it('قراءة التدريج المعاكس 60° صفر مع تشخيص خاص', () => {
    const g = grade('q24-a', '60')
    expect(g.earnedMarks).toBe(0)
    expect(g.errorFeedback).toContain('التدريج المعاكس')
  })

  it('قيمة غير رقمية صفر مع توجيه للطالبة', () => {
    expect(grade('q24-a', 'zzz').earnedMarks).toBe(0)
  })

  it('q18-b قراءة المنقلة: 70 صحيحة و110 (التدريج المعاكس) صفر', () => {
    expect(grade('q18-b', '70').earnedMarks).toBe(2)
    const g = grade('q18-b', '110')
    expect(g.earnedMarks).toBe(0)
    expect(g.errorFeedback).toContain('التدريج المعاكس')
  })
})

describe('حالات الأسئلة: صحيح / جزئي / خاطئ على مستوى السؤال', () => {
  it('فرع واحد خاطئ في سؤال يجعله جزئياً بعلامات الفروع الصحيحة فقط', () => {
    const answers = { ...perfectAnswers, 'q01-c': '(0, 3)' }
    const g = gradeQuestion(examQuestions[0], answers)
    expect(g.earnedMarks).toBe(2)
    expect(g.maxMarks).toBe(3)
    expect(g.status).toBe('partial')
  })

  it('كل فروع السؤال خاطئة = صفر و«خاطئ»', () => {
    const g = gradeQuestion(examQuestions[0], {
      'q01-a': '(1, 1)', 'q01-b': '(1, 1)', 'q01-c': '(1, 1)',
    })
    expect(g.earnedMarks).toBe(0)
    expect(g.status).toBe('wrong')
  })

  it('العلامات الجزئية العشرية تجمع بدقة ضمن السؤال والمحاولة', () => {
    const answers: StudentAnswersMap = {
      'q10-a': 'acute', 'q10-b': 'right', 'q10-c': 'acute', // 0.75+0.75+0
      'q10-d': 'straight',
    }
    const g = gradeQuestion(examQuestions[9], answers)
    expect(g.earnedMarks).toBe(2.25)
    expect(g.status).toBe('partial')
  })
})

describe('أدوات مساعدة من المصدر (mathNorm)', () => {
  it('تنسيق المدة HH:MM:SS', () => {
    expect(formatDurationHHMMSS(0)).toBe('00:00:00')
    expect(formatDurationHHMMSS(3665)).toBe('01:01:05')
    expect(formatDurationHHMMSS(-5)).toBe('00:00:00')
  })

  it('قراءة الأعداد: وحدات وفواصل وأرقام هندية', () => {
    expect(parseNaturalNumber('70°')).toBe(70)
    expect(parseNaturalNumber('5 cm')).toBe(5)
    expect(parseNaturalNumber('١٥')).toBe(15)
    expect(parseNaturalNumber('لا شيء')).toBeNull()
    expect(parseNaturalNumber('')).toBeNull()
    expect(parseNaturalNumber('-3')).toBeNull()
  })
})

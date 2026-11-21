import { examQuestions } from '../data/questions'
import type {
  BranchScoreResult,
  ExamQuestion,
  ExamScoreSummary,
  QuestionScoreResult,
  StudentAnswersMap,
  SubQuestionBranch,
} from '../types/exam'
import {
  formatNumberCommas,
  isNumericallyEqual,
  normalizeArabicText,
  normalizeDigitsAndSymbols,
  parseNaturalNumber,
  parseOrderedPair,
} from './mathNorm'

/**
 * Checks whether a single branch has a non-empty valid response from the student.
 */
export function isBranchAnswered(branch: SubQuestionBranch, answers: StudentAnswersMap): boolean {
  const raw = answers[branch.id]
  if (raw === undefined || raw === null) return false
  return raw.trim().length > 0
}

/**
 * Checks whether all branches in a question are answered.
 */
export function isQuestionComplete(question: ExamQuestion, answers: StudentAnswersMap): boolean {
  return question.branches.every(branch => isBranchAnswered(branch, answers))
}

/**
 * Checks whether all 30 questions (and all their required branches) are answered.
 */
export function isExamComplete(answers: StudentAnswersMap, questions: ExamQuestion[] = examQuestions): boolean {
  return questions.every(q => isQuestionComplete(q, answers))
}

/**
 * Formats a student's raw answer into a human-friendly Arabic display for the results page.
 */
export function formatStudentAnswerForDisplay(branch: SubQuestionBranch, raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return 'لم تتم الإجابة'

  if (branch.inputKind === 'choice' || branch.inputKind === 'compare-symbol') {
    const found = branch.options?.find(o => o.id === trimmed)
    if (found) {
      return found.math ? `${found.label} ${found.math}` : found.label
    }
  }

  if (branch.inputKind === 'order-list' && branch.initialOrderItems) {
    const ids = trimmed.split(',').map(s => s.trim())
    const labels = ids.map(id => branch.initialOrderItems?.find(item => item.id === id)?.display ?? id)
    return labels.join(' ← ')
  }

  if (branch.inputKind === 'interactive-angle') {
    const deg = parseNaturalNumber(trimmed)
    return deg !== null ? `${deg}°` : trimmed
  }

  return trimmed
}

interface InternalBranchGrade {
  earnedMarks: number
  isCorrect: boolean
  isPartial: boolean
  errorFeedback?: string
}

function gradeOrderedPairBranch(
  raw: string,
  expectedX: number,
  expectedY: number,
  maxMarks: number,
  pointName: string
): InternalBranchGrade {
  const pair = parseOrderedPair(raw)
  if (!pair) {
    return {
      earnedMarks: 0,
      isCorrect: false,
      isPartial: false,
      errorFeedback: `يرجى كتابة الزوج المرتب بصيغة صحيحة مثل (${expectedX}, ${expectedY}) بحيث يكون الأفقي أولاً ثم الشاقولي.`,
    }
  }
  if (pair.x === expectedX && pair.y === expectedY) {
    return { earnedMarks: maxMarks, isCorrect: true, isPartial: false }
  }
  if (pair.x === expectedY && pair.y === expectedX && expectedX !== expectedY) {
    return {
      earnedMarks: 0,
      isCorrect: false,
      isPartial: false,
      errorFeedback: `انتبهي: عكستِ ترتيب الإحداثيين في النقطة ${pointName}! العدد الأول (${expectedX}) هو الإحداثي الأفقي X، والعدد الثاني (${expectedY}) هو الإحداثي الشاقولي Y.`,
    }
  }
  if (pair.x === expectedX || pair.y === expectedY) {
    const half = Number((maxMarks / 2).toFixed(2))
    return {
      earnedMarks: half,
      isCorrect: false,
      isPartial: true,
      errorFeedback:
        pair.x === expectedX
          ? `أحسنتِ في قراءة الإحداثي الأفقي (${expectedX})، لكن الإحداثي الشاقولي الصحيح للنقطة ${pointName} هو ${expectedY}.`
          : `أحسنتِ في قراءة الإحداثي الشاقولي (${expectedY})، لكن الإحداثي الأفقي الصحيح للنقطة ${pointName} هو ${expectedX}.`,
    }
  }
  return {
    earnedMarks: 0,
    isCorrect: false,
    isPartial: false,
    errorFeedback: `موقع النقطة ${pointName} يقابل ${expectedX} على المحور الأفقي و${expectedY} على المحور الشاقولي، فالزوج الصحيح هو (${expectedX}, ${expectedY}).`,
  }
}

function gradeVerbal4608020(raw: string, maxMarks: number): InternalBranchGrade {
  const norm = normalizeArabicText(raw)
  if (!norm) {
    return {
      earnedMarks: 0,
      isCorrect: false,
      isPartial: false,
      errorFeedback: 'لم تكتبي الصيغة اللفظية للعدد 4,608,020.',
    }
  }

  const hasMillions = /(اربع|اربعه|4)\s*(ملايين|مليون)/u.test(norm)
  const hasThousands = /(ستمئه|ستمائه|600).*(ثمانيه|ثماني|ثمان|8)\s*(الاف|الف)/u.test(norm) || /608\s*(الاف|الف)/u.test(norm)
  const hasUnits = /(عشرون|عشرين|20)/u.test(norm)

  const partsCorrect = [hasMillions, hasThousands, hasUnits].filter(Boolean).length
  if (partsCorrect === 3) {
    return { earnedMarks: maxMarks, isCorrect: true, isPartial: false }
  }
  if (partsCorrect > 0) {
    const partial = Number(((partsCorrect / 3) * maxMarks).toFixed(2))
    return {
      earnedMarks: partial,
      isCorrect: false,
      isPartial: true,
      errorFeedback:
        'إجابتكِ صحيحة جزئياً؛ تذكري قراءة الحلقات الثلاث بالترتيب: «أربعة ملايين وستمئة وثمانية آلاف وعشرون».',
    }
  }
  return {
    earnedMarks: 0,
    isCorrect: false,
    isPartial: false,
    errorFeedback: 'الصيغة اللفظية الصحيحة هي: «أربعة ملايين وستمئة وثمانية آلاف وعشرون».',
  }
}

function gradeExpandedForm4507090(raw: string, maxMarks: number): InternalBranchGrade {
  const cleaned = normalizeDigitsAndSymbols(raw)
  const parts = cleaned
    .split('+')
    .map(token => parseNaturalNumber(token))
    .filter((n): n is number => n !== null && n > 0)

  const expectedTerms = [4000000, 500000, 7000, 90]
  if (parts.length === 0) {
    return {
      earnedMarks: 0,
      isCorrect: false,
      isPartial: false,
      errorFeedback: 'اكتبي الصيغة الموسّعة على شكل مجموع القيم المنزلية: 4,000,000 + 500,000 + 7,000 + 90.',
    }
  }

  const matchedCount = expectedTerms.filter(term => parts.includes(term)).length
  const extraWrongTerms = parts.filter(term => !expectedTerms.includes(term)).length

  if (matchedCount === 4 && extraWrongTerms === 0) {
    return { earnedMarks: maxMarks, isCorrect: true, isPartial: false }
  }

  if (matchedCount >= 2) {
    const partial = Number((Math.max(0.5, ((matchedCount - extraWrongTerms * 0.5) / 4) * maxMarks)).toFixed(2))
    return {
      earnedMarks: Math.min(maxMarks - 0.25, Math.max(0.5, partial)),
      isCorrect: false,
      isPartial: true,
      errorFeedback:
        'أحسنتِ في بعض القيم المنزلية، لكن انتبهي لعدد الأصفار في كل منزلة؛ الصيغة الكاملة هي: 4,000,000 + 500,000 + 7,000 + 90.',
    }
  }

  return {
    earnedMarks: 0,
    isCorrect: false,
    isPartial: false,
    errorFeedback: 'الصيغة الموسّعة الصحيحة للعدد 4,507,090 هي: 4,000,000 + 500,000 + 7,000 + 90.',
  }
}

export function gradeSingleBranch(
  branch: SubQuestionBranch,
  answers: StudentAnswersMap
): InternalBranchGrade {
  const raw = (answers[branch.id] ?? '').trim()
  const max = branch.marks

  if (!raw) {
    return {
      earnedMarks: 0,
      isCorrect: false,
      isPartial: false,
      errorFeedback: 'لم تتم الإجابة عن هذا الفرع.',
    }
  }

  switch (branch.id) {
    /* ── Q1: Coordinate Grid Read ── */
    case 'q01-a':
      return gradeOrderedPairBranch(raw, 6, 4, max, 'A')
    case 'q01-b':
      return gradeOrderedPairBranch(raw, 0, 5, max, 'B')
    case 'q01-c':
      return gradeOrderedPairBranch(raw, 3, 0, max, 'C')

    /* ── Q2: Natural Numbers Read & Write ── */
    case 'q02-a': {
      const val = parseNaturalNumber(raw)
      if (val === 7050309) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val === 7500309 || val === 7005309 || val === 750309) {
        return {
          earnedMarks: 0.5,
          isCorrect: false,
          isPartial: true,
          errorFeedback:
            'انتبهي لأصفار حفظ المنزلة: «خمسون ألفاً» تُكتب 050 في حلقة الألوف، فيكون العدد الصحيح 7,050,309.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العدد الصحيح بالأرقام هو 7,050,309 (وضع صفر في مئات الألوف وصفر في آحاد الألوف وصفر في العشرات).',
      }
    }
    case 'q02-b':
      return gradeVerbal4608020(raw, max)

    /* ── Q3: Angle Elements ── */
    case 'q03-a': {
      const cleaned = normalizeDigitsAndSymbols(raw).trim().toUpperCase().replace(/^∠|^الزاوية|^النقطة|^الرأس/gu, '').trim()
      if (cleaned === 'A' || cleaned === 'أ' || cleaned === 'ا') {
        return { earnedMarks: max, isCorrect: true, isPartial: false }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'رأس الزاوية هو نقطة التقاء الضلعين [AB) و [AC)، وهو النقطة A.',
      }
    }
    case 'q03-b':
      if (raw === 'bac') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'عند تسمية الزاوية بثلاثة أحرف يجب أن يكون حرف الرأس A في المنتصف تماماً: ∠BAC.',
      }
    case 'q03-c':
      if (raw === 'inside') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'النقطة X تقع في المنطقة المحصورة بين الضلعين [AB) و [AC)، أي داخل الزاوية.',
      }

    /* ── Q4: Rounding on Number Line ── */
    case 'q04-a':
      if (isNumericallyEqual(raw, 2500)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'نقطة المنتصف بين 2,000 و 3,000 هي 2,500.',
      }
    case 'q04-b':
      if (raw === 'right-3000') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العدد 2,740 أكبر من 2,500 فهو يقع بعد المنتصف وأقرب إلى 3,000.',
      }
    case 'q04-c':
      if (isNumericallyEqual(raw, 3000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'بما أن 2,740 تجاوز نقطة المنتصف 2,500 (ورقم مئاته 7 ≥ 5)، فتقريبه إلى أقرب ألف هو 3,000.',
      }

    /* ── Q5: Line Graph (Library Stories) ── */
    case 'q05-a':
      if (isNumericallyEqual(raw, 25)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'النقطة الواقعة فوق يوم الثلاثاء تقابل العدد 25 على المحور الشاقولي.',
      }
    case 'q05-b':
      if (raw === 'mon') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'أصغر قيمة في الرسم هي 10 قصص وتقابل يوم الإثنين (وليس أول يوم في الأسبوع).',
      }
    case 'q05-c':
      if (isNumericallyEqual(raw, 15)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'يوم الخميس 30 قصة ويوم الأحد 15 قصة؛ الفرق = 30 − 15 = 15 قصة.',
      }

    /* ── Q6: Addition with Carry ── */
    case 'q06-a': {
      const val = parseNaturalNumber(raw)
      if (val === 13) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val === 3 || val === 12) {
        return {
          earnedMarks: 0.5,
          isCorrect: false,
          isPartial: true,
          errorFeedback:
            val === 12
              ? 'نسيتِ إضافة الحمل (1) القادم من عشرات الألوف: 4 + 8 + 1 = 13.'
              : 'كتبتِ رقم المنزلة (3) فقط، والمطلوب المجموع الكامل في المنزلة مع الحمل وهو 13.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في مئات الألوف نجمع 4 + 8 = 12 ومع الحمل 1 من عشرات الألوف يصبح المجموع 13.',
      }
    }
    case 'q06-b': {
      const val = parseNaturalNumber(raw)
      if (val === 4323440) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val !== null && Math.abs(val - 4323440) <= 1000000) {
        // Check if off by a single carry (100, 1000, 10000, 100000, 1000000)
        const diff = Math.abs(val - 4323440)
        if ([10, 100, 1000, 10000, 100000, 1000000].includes(diff)) {
          return {
            earnedMarks: 1,
            isCorrect: false,
            isPartial: true,
            errorFeedback: `اقتربتِ جداً من الإجابة الصحيحة (منحتِ علامة جزئية)، لكن سقط منكِ حمل واحد بمقدار ${formatNumberCommas(diff)}. الناتج الدقيق هو 4,323,440.`,
          }
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'المجموع الصحيح مع مراعاة الحمل في جميع المنازل هو 4,323,440.',
      }
    }

    /* ── Q7: Parallelogram Identification & Diagonal ── */
    case 'q07-a':
      if (raw === 'fig1') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الشكل (1) ABCD هو الوحيد الذي فيه كل ضلعين متقابلين متوازيان (أسهم مفردة ومزدوجة).',
      }
    case 'q07-b':
      if (raw === 'one-pair') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الشكل (2) فيه ضلعان متقابلان متوازيان فقط، بينما يشترط متوازي الأضلاع توازي كل ضلعين متقابلين.',
      }
    case 'q07-c': {
      const norm = normalizeArabicText(raw)
      if (norm.includes('قطر')) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'القطعة المستقيمة التي تصل بين رأسين غير متتاليين (B و D) تُسمّى «قطر» متوازي الأضلاع.',
      }
    }

    /* ── Q8: Place Value ── */
    case 'q08-a':
      if (isNumericallyEqual(raw, 70000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الرقم 7 يقع في منزلة عشرات الألوف، فقيمته المنزلية هي 70,000.',
      }
    case 'q08-b':
      if (isNumericallyEqual(raw, 400000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الرقم 4 يقع في منزلة مئات الألوف، فقيمته المنزلية هي 400,000.',
      }
    case 'q08-c':
      if (isNumericallyEqual(raw, 9)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (isNumericallyEqual(raw, 9000000)) {
        return {
          earnedMarks: 0.5,
          isCorrect: false,
          isPartial: true,
          errorFeedback: 'كتبتِ القيمة المنزلية (9,000,000)، بينما المطلوب الرقم نفسه الواقع في منزلة آحاد الملايين وهو 9.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الرقم الواقع في منزلة آحاد الملايين في العدد 9,472,815 هو 9.',
      }

    /* ── Q9: Rhombus Identification & True/False ── */
    case 'q09-a':
      if (raw === 'fig2') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الشكل (2) هو المعيّن لأنه متوازي أضلاع تساوى فيه ضلعان متجاوران (4cm و 4cm).',
      }
    case 'q09-b':
      if (raw === 'adj') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'يكون متوازي الأضلاع معيّناً إذا تساوى فيه طولا ضلعين متجاورين.',
      }
    case 'q09-c':
      if (raw === 'false-fix') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العبارة خاطئة؛ فالمعيّن تتساوى أضلاعه الأربعة وزواياه المتقابلة، ولا يُشترط أن تكون زواياه قائمة إلا إذا كان مربعاً.',
      }

    /* ── Q10: Classify 4 Angles ── */
    case 'q10-a':
      if (raw === 'acute') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الزاوية 45° أصغر من 90° فهي زاوية حادة.' }
    case 'q10-b':
      if (raw === 'right') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الزاوية 90° ضلعاها متعامدان فهي زاوية قائمة.' }
    case 'q10-c':
      if (raw === 'obtuse') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الزاوية 135° بين 90° و 180° فهي زاوية منفرجة.' }
    case 'q10-d':
      if (raw === 'straight') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الزاوية 180° ضلعاها على استقامة واحدة فهي زاوية مستقيمة.' }

    /* ── Q11: Subtraction Across Zeros ── */
    case 'q11-a':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'عند استلاف 1 مليون من 5 في منزلة الملايين يتبقّى فيها 4.',
      }
    case 'q11-b': {
      const val = parseNaturalNumber(raw)
      if (val === 2635200) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val !== null) {
        const diff = Math.abs(val - 2635200)
        if ([100, 1000, 10000, 100000, 1000000].includes(diff)) {
          return {
            earnedMarks: 1,
            isCorrect: false,
            isPartial: true,
            errorFeedback: `حصلتِ على علامة جزئية؛ أخطأتِ في منزلة واحدة أثناء الاستلاف عبر الأصفار. الناتج الصحيح هو 2,635,200.`,
          }
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'ناتج الطرح الصحيح بعد الاستلاف المتتالي هو: 5,000,000 − 2,364,800 = 2,635,200.',
      }
    }

    /* ── Q12: Plot Coordinate Interactive & Error ── */
    case 'q12-a':
      return gradeOrderedPairBranch(raw, 4, 7, max, 'M')
    case 'q12-b':
      if (raw === 'swapped') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الخطأ هو عكس ترتيب الإحداثيين X و Y؛ فالنقطة (4, 7) تعني 4 يميناً و7 للأعلى وليس العكس.',
      }

    /* ── Q13: Rounding Large Numbers ── */
    case 'q13-a':
      if (isNumericallyEqual(raw, 470000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في 468,210 رقم عشرات الألوف 6 وعلى يمينه 8 (≥ 5)، فنرفع 6 إلى 7 ويصبح الناتج 470,000.',
      }
    case 'q13-b':
      if (isNumericallyEqual(raw, 3500000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في 3,482,137 رقم مئات الألوف 4 وعلى يمينه 8 (≥ 5)، فنرفع 4 إلى 5 ويصبح الناتج 3,500,000.',
      }
    case 'q13-c':
      if (isNumericallyEqual(raw, 6000000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في 5,628,000 رقم الملايين 5 وعلى يمينه 6 (≥ 5)، فنرفع 5 إلى 6 ويصبح الناتج 6,000,000.',
      }

    /* ── Q14: Line Graph (Flowers) ── */
    case 'q14-a':
      if (raw === 'sun-mon') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الخط البياني أفقي عند القيمة 20 بين يومي الأحد والإثنين، ما يدل على ثبات العدد.',
      }
    case 'q14-b':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'يوم الإثنين 20 زهرة ويوم الثلاثاء 16 زهرة؛ مقدار الانخفاض = 20 − 16 = 4 زهور.',
      }
    case 'q14-c':
      if (raw === 'inc') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'ارتفع العدد من 16 يوم الثلاثاء إلى 24 يوم الأربعاء، فالاتجاه هو تزايد.',
      }

    /* ── Q15: Expanded Form ── */
    case 'q15-a':
      if (isNumericallyEqual(raw, 6000000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الرقم 6 في منزلة الملايين فقيمته المنزلية هي 6,000,000.',
      }
    case 'q15-b':
      return gradeExpandedForm4507090(raw, max)
    case 'q15-c': {
      const val = parseNaturalNumber(raw)
      if (val === 8309062) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val === 83962 || val === 839062 || val === 830962) {
        return {
          earnedMarks: 0.75,
          isCorrect: false,
          isPartial: true,
          errorFeedback: 'انتبهي لوضع أصفار في المنازل الغائبة (عشرات الألوف 0 والمئات 0)؛ العدد الصحيح هو 8,309,062.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'بتجميع القيم المنزلية مع حفظ أصفار عشرات الألوف والمئات نحصل على: 8,309,062.',
      }
    }

    /* ── Q16: Parallelogram Properties ── */
    case 'q16-a':
      if (isNumericallyEqual(raw, 6)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الضلع [XY] يقابل [WZ]، إذن XY = WZ = 6 cm.' }
    case 'q16-b':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الضلع [WX] يقابل [ZY]، إذن WX = ZY = 4 cm.' }
    case 'q16-c':
      if (isNumericallyEqual(raw, 70)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الزاوية ∠WXY تقابل الزاوية ∠Z في متوازي الأضلاع، إذن قياسها 70°.',
      }
    case 'q16-d':
      if (isNumericallyEqual(raw, 110)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الزاوية ∠Y تقابل الزاوية ∠W في متوازي الأضلاع، إذن قياسها 110°.',
      }

    /* ── Q17: Word Problem (Exhibition Visitors) ── */
    case 'q17-a':
      if (raw === 'sub') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'لمعرفة «بكم يزيد» نحتاج إيجاد الفرق بين العددين، لذلك نستخدم عملية الطرح.',
      }
    case 'q17-b': {
      const val = parseNaturalNumber(raw)
      if (val === 136150) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val !== null && [100, 1000, 10000, 100000].includes(Math.abs(val - 136150))) {
        return {
          earnedMarks: 1,
          isCorrect: false,
          isPartial: true,
          errorFeedback: 'اخترتِ الطرح الصحيح وحصلتِ على علامة جزئية، لكن وقع خطأ بسيط في الاستلاف؛ الناتج الصحيح 136,150.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'ناتج الطرح الصحيح هو: 425,600 − 289,450 = 136,150 زائراً.',
      }
    }

    /* ── Q18: Protractor Reading ── */
    case 'q18-a':
      if (raw === 'inner-right') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'نختار التدريج الذي يبدأ من 0° عند الضلع [BC) المطابق لخط الصفر جهة اليمين.',
      }
    case 'q18-b': {
      const val = parseNaturalNumber(raw)
      if (val === 70) return { earnedMarks: max, isCorrect: true, isPartial: false }
      if (val === 110) {
        return {
          earnedMarks: 0,
          isCorrect: false,
          isPartial: false,
          errorFeedback: 'قرأتِ 110° من التدريج المعاكس! بما أن الضلع [BC) يتجه يميناً نبدأ من 0° يميناً فنجد 70°.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الشعاع [BA) يمر بالتدريج 70° على التدريج الذي يبدأ من الصفر يميناً.',
      }
    }
    case 'q18-c':
      if (raw === 'wrong-scale') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'القراءة 110° خاطئة لأنها من التدريج المعاكس ولأن الزاوية المرسومة حادة أصغر من 90°.',
      }

    /* ── Q19: Compare Two Roundings ── */
    case 'q19-a':
      if (isNumericallyEqual(raw, 7850000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'تقريب 7,846,200 إلى أقرب عشرة آلاف هو 7,850,000 لأن رقم آحاد الألوف 6 ≥ 5.',
      }
    case 'q19-b':
      if (isNumericallyEqual(raw, 7800000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'تقريب 7,846,200 إلى أقرب مئة ألف هو 7,800,000 لأن رقم عشرات الألوف 4 < 5.',
      }
    case 'q19-c':
      if (raw === 'gt' || raw === '>') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'بما أن 7,850,000 أكبر من 7,800,000 فالرمز الصحيح هو >.',
      }

    /* ── Q20: Rhombus Properties ── */
    case 'q20-a':
      if (isNumericallyEqual(raw, 5)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'أضلاع المعيّن الأربعة متساوية، إذن BC = AB = 5 cm.' }
    case 'q20-b':
      if (isNumericallyEqual(raw, 5)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'أضلاع المعيّن الأربعة متساوية، إذن DA = 5 cm.' }
    case 'q20-c':
      if (isNumericallyEqual(raw, 55)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'كل زاويتين متقابلتين في المعيّن متساويتان، إذن ∠C = ∠A = 55°.',
      }
    case 'q20-d':
      if (isNumericallyEqual(raw, 20)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'مجموع أطوال أضلاع المعيّن الأربعة = 5 + 5 + 5 + 5 = 20 cm.',
      }

    /* ── Q21: Spot Error in Expanded Form ── */
    case 'q21-a':
      if (isNumericallyEqual(raw, 900000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العدد الخاطئ الذي كتبته دانا في الصيغة الموسّعة هو 900,000.',
      }
    case 'q21-b':
      if (isNumericallyEqual(raw, 90000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'القيمة المنزلية الصحيحة للرقم 9 في العدد 5,090,400 هي 90,000.',
      }
    case 'q21-c':
      if (raw === 'ten-thousands') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الرقم 9 في العدد 5,090,400 يقع في منزلة عشرات الألوف.',
      }

    /* ── Q22: Line Graph + Table ── */
    case 'q22-a':
      if (isNumericallyEqual(raw, 35)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'من التمثيل البياني، تقابل نقطة الأسبوع الثاني القيمة 35 طالبة.',
      }
    case 'q22-b':
      if (isNumericallyEqual(raw, 45)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'من التمثيل البياني، تقابل نقطة الأسبوع الرابع القيمة 45 طالبة.',
      }
    case 'q22-c':
      if (isNumericallyEqual(raw, 25)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الفرق بين الأسبوع الرابع (45) والأسبوع الأول (20) هو: 45 − 20 = 25 طالبة.',
      }

    /* ── Q23: Multi-Step Stationery Problem ── */
    case 'q23-a':
      if (isNumericallyEqual(raw, 600000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'مجموع ما بيع في الأسبوعين = 325,400 + 274,600 = 600,000 دفتر.',
      }
    case 'q23-b': {
      if (isNumericallyEqual(raw, 250000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      // Check follow-through partial credit if student subtracted her own q23-a from 850,000
      const prevA = parseNaturalNumber(answers['q23-a'] ?? '')
      const curB = parseNaturalNumber(raw)
      if (prevA !== null && curB !== null && curB === 850000 - prevA) {
        return {
          earnedMarks: 0.75,
          isCorrect: false,
          isPartial: true,
          errorFeedback:
            'طرحتِ بشكل سليم بناءً على ناتجكِ في الفرع (أ) فحصلتِ على علامة جزئية، لكن المجموع الصحيح للمبيعات 600,000 والباقي الصحيح 250,000.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'المتبقي قبل الدفعة الجديدة = 850,000 − 600,000 = 250,000 دفتر.',
      }
    }
    case 'q23-c': {
      if (isNumericallyEqual(raw, 400000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      const prevB = parseNaturalNumber(answers['q23-b'] ?? '')
      const curC = parseNaturalNumber(raw)
      if (prevB !== null && curC !== null && curC === prevB + 150000) {
        return {
          earnedMarks: 0.5,
          isCorrect: false,
          isPartial: true,
          errorFeedback:
            'جمعتِ الدفعة الجديدة (150,000) بشكل صحيح مع ناتجكِ السابق (علامة جزئية)، والناتج النهائي الصحيح هو 400,000 دفتر.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العدد النهائي بعد إضافة الدفعة الجديدة = 250,000 + 150,000 = 400,000 دفتر.',
      }
    }

    /* ── Q24: Interactive Protractor Construction (120°) ── */
    case 'q24-a': {
      const deg = parseNaturalNumber(raw)
      if (deg === null) {
        return {
          earnedMarks: 0,
          isCorrect: false,
          isPartial: false,
          errorFeedback: 'يرجى تحديد موقع الشعاع [OY) على المنقلة التفاعلية عند الزاوية 120°.',
        }
      }
      const diff = Math.abs(deg - 120)
      if (diff <= 3) {
        return { earnedMarks: max, isCorrect: true, isPartial: false }
      }
      if (diff <= 6) {
        return {
          earnedMarks: 1.5,
          isCorrect: false,
          isPartial: true,
          errorFeedback: `رسمتِ زاوية قريبة جداً (${deg}°) فحصلتِ على علامة جزئية؛ القياس الدقيق المطلوب هو 120°.`,
        }
      }
      if (Math.abs(deg - 60) <= 3) {
        return {
          earnedMarks: 0,
          isCorrect: false,
          isPartial: false,
          errorFeedback: 'وضعتِ الشعاع عند 60° (التدريج المعاكس)! لإنشاء 120° بدءاً من الضلع الأيمن يجب أن يتجاوز الشعاع الزاوية القائمة 90° إلى 120° جهة اليسار.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: `وضعتِ الشعاع عند ${deg}°، بينما المطلوب توجيه الشعاع [OY) إلى التدريج 120°.`,
      }
    }
    case 'q24-b':
      if (raw === 'obtuse') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الزاوية التي قياسها 120° أكبر من 90° وأصغر من 180°، فهي زاوية منفرجة.',
      }

    /* ── Q25: Multi-Step Coordinate Path ── */
    case 'q25-a':
      return gradeOrderedPairBranch(raw, 5, 6, max, 'P')
    case 'q25-b':
      if (isNumericallyEqual(raw, 8)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الإحداثي الأفقي كان 5 ثم تحركت الفراشة 3 وحدات إضافية يميناً: 5 + 3 = 8.',
      }
    case 'q25-c':
      return gradeOrderedPairBranch(raw, 8, 4, max, 'Q')

    /* ── Q26: Spot Rounding Error ── */
    case 'q26-a':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في العدد 184,490، الرقم الواقع في منزلة آحاد الألوف (على يمين عشرات الألوف مباشرة) هو 4.',
      }
    case 'q26-b':
      if (isNumericallyEqual(raw, 180000)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'بما أن رقم آحاد الألوف 4 أصغر من 5، نبقي عشرات الألوف 8 كما هي ونصفّر اليمين: 180,000.',
      }
    case 'q26-c':
      if (raw === 'wrong-neighbor') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'سبب خطأ ريم أنها نظرت إلى رقم العشرات (9) بدلاً من الرقم المجاور مباشرة لمنزلة التقريب وهو 4 في آحاد الألوف.',
      }

    /* ── Q27: Complete Parallelogram & Composite ── */
    case 'q27-a':
      return gradeOrderedPairBranch(raw, 6, 4, max, 'C')
    case 'q27-b':
      if (isNumericallyEqual(raw, 7)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في متوازي الأضلاع الأول DC = AB = 7 cm، وفي الثاني EF = DC = 7 cm.',
      }

    /* ── Q28: Order & Compare Natural Numbers ── */
    case 'q28-a': {
      const order = raw.split(',').map(s => s.trim())
      if (order.join(',') === 'n2,n3,n1') {
        return { earnedMarks: max, isCorrect: true, isPartial: false }
      }
      if (order[0] === 'n2' || order[2] === 'n1') {
        return {
          earnedMarks: 0.75,
          isCorrect: false,
          isPartial: true,
          errorFeedback:
            'وضعتِ أحد الطرفين في موضعه الصحيح (علامة جزئية)، والترتيب التصاعدي الكامل هو: 3,085,900 ثم 3,405,800 ثم 3,450,800.',
        }
      }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الترتيب التصاعدي الصحيح من الأصغر إلى الأكبر هو: 3,085,900 ← 3,405,800 ← 3,450,800.',
      }
    }
    case 'q28-b':
      if (raw === 'gt' || raw === '>') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'العددان يتساويان في الملايين (6) ومئات الألوف (7)، وفي عشرات الألوف 2 > 0، إذن 6,720,500 > 6,709,999.',
      }

    /* ── Q29: Subtraction Error Analysis ── */
    case 'q29-a':
      if (raw === 'forgot-borrow') return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الخطأ وقع في عشرات الألوف؛ استلفت ليلى 1 من 4 لآحاد الألوف لكنها نسيت إنقاص 4 إلى 3.',
      }
    case 'q29-b':
      if (isNumericallyEqual(raw, 424300)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'الناتج الصحيح لعملية الطرح 742,500 − 318,200 هو 424,300.',
      }
    case 'q29-c':
      if (isNumericallyEqual(raw, 742500)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'عند جمع الناتج الصحيح (424,300) مع المطروح (318,200) نحصل على المطروح منه الأصلي 742,500.',
      }

    /* ── Q30: Composite Rhombus & Parallelogram ── */
    case 'q30-a':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'بما أن AFED معيّن طول ضلعه 4 cm، فإن AF = 4 cm.' }
    case 'q30-b':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return { earnedMarks: 0, isCorrect: false, isPartial: false, errorFeedback: 'الضلع [FE] هو أحد أضلاع المعيّن AFED، لذلك FE = 4 cm.' }
    case 'q30-c':
      if (isNumericallyEqual(raw, 4)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'في متوازي الأضلاع FBCE، الضلع [BC] يقابل الضلع [FE]، إذن BC = FE = 4 cm.',
      }
    case 'q30-d':
      if (isNumericallyEqual(raw, 10)) return { earnedMarks: max, isCorrect: true, isPartial: false }
      return {
        earnedMarks: 0,
        isCorrect: false,
        isPartial: false,
        errorFeedback: 'النقطة F تقع بين A و B، لذلك AB = AF + FB = 4 + 6 = 10 cm.',
      }

    default:
      return { earnedMarks: 0, isCorrect: false, isPartial: false }
  }
}

export function gradeQuestion(question: ExamQuestion, answers: StudentAnswersMap): QuestionScoreResult {
  const branchResults: BranchScoreResult[] = question.branches.map(branch => {
    const raw = answers[branch.id] ?? ''
    const grade = gradeSingleBranch(branch, answers)
    return {
      branchId: branch.id,
      label: branch.label,
      prompt: branch.prompt,
      earnedMarks: grade.earnedMarks,
      maxMarks: branch.marks,
      isCorrect: grade.isCorrect,
      isPartial: grade.isPartial,
      studentAnswerDisplay: formatStudentAnswerForDisplay(branch, raw),
      modelAnswerDisplay: branch.modelAnswerDisplay,
      errorFeedback: grade.errorFeedback,
    }
  })

  const earnedMarks = Number(
    branchResults.reduce((sum, b) => sum + b.earnedMarks, 0).toFixed(2)
  )
  const maxMarks = question.totalMarks

  let status: 'correct' | 'partial' | 'wrong' = 'wrong'
  if (earnedMarks >= maxMarks - 0.001) {
    status = 'correct'
  } else if (earnedMarks > 0) {
    status = 'partial'
  }

  return {
    questionId: question.id,
    questionNumber: question.number,
    lessonId: question.lessonId,
    lessonTitle: question.lessonTitle,
    pages: question.pages,
    skill: question.skill,
    earnedMarks,
    maxMarks,
    status,
    branchResults,
    solutionSteps: question.solutionSteps,
    explanation: question.explanation,
  }
}

export function gradeFullExam(
  answers: StudentAnswersMap,
  questions: ExamQuestion[] = examQuestions
): ExamScoreSummary {
  const questionResults = questions.map(q => gradeQuestion(q, answers))
  const totalEarned = Number(
    questionResults.reduce((sum, q) => sum + q.earnedMarks, 0).toFixed(2)
  )
  const totalMax = questions.reduce((sum, q) => sum + q.totalMarks, 0)

  const correctQuestionCount = questionResults.filter(q => q.status === 'correct').length
  const partialQuestionCount = questionResults.filter(q => q.status === 'partial').length
  const wrongQuestionCount = questionResults.filter(q => q.status === 'wrong').length

  return {
    totalEarned,
    totalMax,
    correctQuestionCount,
    partialQuestionCount,
    wrongQuestionCount,
    questionResults,
  }
}

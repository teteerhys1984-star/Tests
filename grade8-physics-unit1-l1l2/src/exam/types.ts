/**
 * أنواع بيانات الاختبار + سجل الدرسين (الوحدة الأولى، الدرس الأول والثاني فقط).
 * المصدر المرجعي: مستودع Interactive-Physics-Grade8
 *   index.html (فهرس الوحدة الأولى)
 *   src/lesson-content.js            ← الدرس الأول: القوى المتلاقية (ص 55–62)
 *   src/lesson-2-content.js          ← الدرس الثاني: القوى المتوازية (ص 63–70)
 *   src/lesson-test-data.js          ← اختبار الدرس الأول (أسئلة الكتاب)
 *   src/lesson-2-test-data.js        ← اختبار الدرس الثاني (أسئلة الكتاب)
 *   src/lesson-1-practice-data.js    ← مسائل ص 62 المحلولة
 *   src/lesson-2-practice-data.js    ← مسائل ص 70 المحلولة
 */

export type LessonId = 'concurrent-forces' | 'parallel-forces'

export interface LessonMeta {
  id: LessonId
  num: number
  title: string
  pages: string
  short: string
  objectives: string[]
}

/** درسان فقط: الدرس الأول ص 55–62 والدرس الثاني ص 63–70 كما في فهرس الوحدة الأولى. */
export const LESSONS: readonly LessonMeta[] = [
  {
    id: 'concurrent-forces',
    num: 1,
    title: 'القوى المتلاقية',
    pages: 'ص 55 – 62',
    short: 'المتلاقية',
    objectives: [
      'يعرّف القوى المتلاقية بأنها القوى التي تتلاقى حواملها في نقطة واحدة.',
      'يعيّن محصلة قوتين متلاقيتين بقطر متوازي الأضلاع الخارج من نقطة التلاقي وفق مقياس رسم.',
      'يحسب شدة محصلة قوتين متعامدتين بنظرية فيثاغورث ويجد القوة المجهولة بالعلاقة العكسية.',
      'يحلّل قوة إلى مركبتين متعامدتين، ويحلّل ثقل جسم على مستوى مائل أملس إلى مركبة موازية وعمودية.',
    ],
  },
  {
    id: 'parallel-forces',
    num: 2,
    title: 'القوى المتوازية',
    pages: 'ص 63 – 70',
    short: 'المتوازية',
    objectives: [
      'يعرّف القوى المتوازية بأنها القوى التي تكون حواملها مستقيمات متوازية.',
      'يعيّن عناصر محصلة قوتين متوازيتين بجهة واحدة: الحامل والجهة والشدة والمجموع والموضع بينهما.',
      'يعيّن عناصر محصلة قوتين متوازيتين بجهتين متعاكستين: الطرح وجهة القوة الأكبر والموضع خارج القطعة.',
      'يستعمل علاقة تساوي الجداءين F₁d₁ = F₂d₂ لتعيين بعد حامل المحصلة ويشرح العلاقة العكسية.',
    ],
  },
]

export const LESSON_BY_ID: Record<LessonId, LessonMeta> = LESSONS.reduce(
  (acc, lesson) => ({ ...acc, [lesson.id]: lesson }),
  {} as Record<LessonId, LessonMeta>,
)

/* ------------------------------------------------------------------ */
/* أنواع الإجابة                                                       */
/* ------------------------------------------------------------------ */

export type Kind =
  | 'numeric'        // حقل رقمي
  | 'text'           // إجابة قصيرة نصية
  | 'explain'        // تعليل/شرح بفواصل كلمات مفتاحية
  | 'choice'         // اختيار من متعدد
  | 'multiselect'    // اختيار متعدد
  | 'tf'             // صواب/خطأ (مع تصويب اختياري)
  | 'matching'       // مطابقة
  | 'ordering'       // ترتيب

export interface Opt { id: string; label: string }

export interface MatchRow {
  id: string
  left: string
  options: string[]
  answer: string
}

export interface OrderItem { id: string; text: string }

export interface Subpart {
  id: string
  label: string
  marks: number
  prompt: string
  kind: Kind

  options?: Opt[]
  placeholder?: string
  unit?: string
  rows?: MatchRow[]
  items?: OrderItem[]
  tolerance?: number
  /** الإجابة الصحيحة للتصحيح الآلي. */
  correct?: string | string[] | boolean
  accept?: string[]
  /** سلّم تصحيح التعليل: كل مجموعة = بدائل مقبولة، ويجب تحقيق مجموعة واحدة من كل قائمة. */
  rubricAll?: string[][]
  /** تصويب العبارة الخاطئة (لأسئلة صواب/خطأ). */
  correction?: string[][]
  requireCorrection?: boolean
  /** علامات جزئية: [عدد الإصابات الدنيا، العلامة] من الأعلى إلى الأسفل. */
  partial?: [number, number][]

  /* بيانات المعلم والطالب بعد التسليم */
  answerText: string
  solution: string
  rule: string
  mistake: string
  objective: string
}

export interface Question {
  id: string
  lessons: LessonId[]
  title: string
  intro?: string
  figure?: string
  note?: string
  subparts: Subpart[]
  source: string
  integrated?: boolean
  difficulty: 'أساسي' | 'متوسط' | 'متقدّم' | 'تفكير'
}

export const TOTAL_MARKS = 100
export const EXAM_TITLE = 'اختبار الفيزياء — الصف الثامن — الوحدة الأولى: الدرسان الأول والثاني'
export const CONTACT = {
  name: 'المهندس سومر شاهين',
  phone: '0930215022',
  whatsapp: 'https://wa.me/963930210522',
}

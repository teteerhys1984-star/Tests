/**
 * أنواع بيانات الاختبار + سجل المنهج (الوحدة الأولى، الدروس الثمانية).
 * المصدر المرجعي: مستودع Interactive-Mathematics-Grade5
 *   src/content/registry.ts  ·  src/lessons/*Data.ts  ·  src/teacher/lesson1..8.ts
 */

export type LessonId =
  | 'coordinates'
  | 'line-graphs'
  | 'natural-numbers'
  | 'rounding'
  | 'add-sub'
  | 'angles'
  | 'parallelogram'
  | 'rhombus'

export interface LessonMeta {
  id: LessonId
  num: number
  title: string
  pages: string
  short: string
  objectives: string[]
}

/** الدروس الثمانية للوحدة الأولى (ص 3 – 39) كما وردت في سجل المنهج. */
export const LESSONS: readonly LessonMeta[] = [
  {
    id: 'coordinates', num: 1, title: 'شبكة الإحداثيات', pages: 'ص 3 – 4',
    short: 'الإحداثيات',
    objectives: [
      'التعرّف إلى مبدأ الإحداثيات O(0,0) والمحور الأفقي X والمحور الشاقولي Y.',
      'قراءة الزوج المرتّب (x, y) لنقطة على الشبكة وتمثيل نقطة بإحداثياتها.',
      'معرفة أنّ أي نقطة على المحور الأفقي من الشكل (عدد، 0) وعلى المحور الشاقولي من الشكل (0، عدد).',
      'تحريك نقطة أفقياً وشاقولياً وكتابة إحداثياتها الجديدة.',
    ],
  },
  {
    id: 'line-graphs', num: 2, title: 'التمثيلات البيانية بالخطوط', pages: 'ص 7 – 9',
    short: 'الخطوط البيانية',
    objectives: [
      'قراءة التمثيل البياني بالخطوط وتحديد المحور الأفقي والمحور الشاقولي.',
      'قراءة قيمة مسجّلة عند لحظة معيّنة.',
      'تفسير القطعة الصاعدة والهابطة والأفقية.',
      'إيجاد أكبر قيمة وأصغر قيمة وحساب مقدار التغيّر بين قراءتين.',
    ],
  },
  {
    id: 'natural-numbers', num: 3, title: 'الأعداد الطبيعية', pages: 'ص 10 – 14',
    short: 'الأعداد الطبيعية',
    objectives: [
      'قراءة العدد الطبيعي وكتابته بالكلمات وبالصيغة القياسية.',
      'توزيع العدد على الحلقات الثلاث: الملايين | الألوف | الوحدات.',
      'التمييز بين اسم المنزلة وقيمة الرقم فيها، وكتابة الصيغة الموسّعة.',
      'مقارنة الأعداد الطبيعية وترتيبها وفهم دور الصفر في حفظ المنزلة.',
    ],
  },
  {
    id: 'rounding', num: 4, title: 'تقريب الأعداد الطبيعية', pages: 'ص 15 – 18',
    short: 'التقريب',
    objectives: [
      'تقريب عدد إلى أقرب مئة وألف وعشرة آلاف ومئة ألف ومليون.',
      'تحديد الرقم الذي يحسم قرار التقريب (الرقم المجاور للمنزلة المطلوبة).',
      'استعمال مستقيم الأعداد لتبرير التقريب.',
      'إيجاد مجموعة الأعداد التي تُقرَّب إلى قيمة محدّدة (أصغرها وأكبرها).',
    ],
  },
  {
    id: 'add-sub', num: 5, title: 'جمع الأعداد الطبيعية وطرحها', pages: 'ص 19 – 22',
    short: 'الجمع والطرح',
    objectives: [
      'الجمع العمودي ضمن الملايين مع الحمل، والطرح العمودي مع الاستلاف.',
      'إيجاد حدّ ناقص في عملية جمع أو طرح.',
      'التحقّق من صحة الناتج باستعمال العملية العكسية.',
      'حلّ مسائل لفظية متعددة الخطوات بأعداد كبيرة.',
    ],
  },
  {
    id: 'angles', num: 6, title: 'قياس الزوايا', pages: 'ص 23 – 30',
    short: 'الزوايا',
    objectives: [
      'تسمية الزاوية برأسها أو بثلاث نقاط، وتحديد الرأس والضلعين.',
      'قياس الزاوية بالمنقلة واختيار التدريج الصحيح.',
      'رسم زاوية معلومة القياس بالمنقلة والمسطرة.',
      'تصنيف الزوايا: حادة، قائمة، منفرجة، مستقيمة، وجمع الزوايا المتجاورة.',
    ],
  },
  {
    id: 'parallelogram', num: 7, title: 'متوازي الأضلاع', pages: 'ص 31 – 35',
    short: 'متوازي الأضلاع',
    objectives: [
      'تعريف متوازي الأضلاع: شكل رباعي فيه كل ضلعين متقابلين متوازيان.',
      'تعريف القطر: قطعة تصل بين رأسين غير متتاليين.',
      'الخاصة الأولى: كل ضلعين متقابلين متساويا الطول. الخاصة الثانية: كل زاويتين متقابلتين متساويتا القياس.',
      'حساب محيط متوازي الأضلاع ورسمه بالمسطرة والمنقلة.',
    ],
  },
  {
    id: 'rhombus', num: 8, title: 'المعيّن', pages: 'ص 36 – 39',
    short: 'المعيّن',
    objectives: [
      'تعريف المعيّن: متوازي أضلاع فيه ضلعان متجاوران متساويان.',
      'خواصّ المعيّن الثلاث: توازي الأضلاع المتقابلة، تساوي الزوايا المتقابلة، تساوي الأضلاع الأربعة.',
      'حساب محيط المعيّن (4 × الضلع) وتمييزه عن متوازي الأضلاع والمستطيل والمربّع.',
      'رسم المعيّن بالمسطرة والمنقلة بخطوات مرتّبة.',
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
  | 'grid'           // اختيار نقطة على شبكة الإحداثيات
  | 'protractor'     // قياس بالمنقلة التفاعلية
  | 'drawangle'      // رسم زاوية قياسها معلوم

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
  /** ملاحظة تربوية: هل يعتمد هذا الفرع على فرع سابق؟ */
  depends?: string
  /** قيمة بديلة مستقلّة تُستعمل إذا أخطأ الطالب في الفرع السابق (آلية تعافٍ). */
  recovery?: string

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
  gridMax?: number
  angleValue?: number

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
export const EXAM_TITLE = 'اختبار الرياضيات — الصف الخامس — الوحدة الأولى كاملة'
export const TEACHER_PASSWORD = 'somer173'
export const CONTACT = {
  name: 'المهندس سومر شاهين',
  phone: '0930215022',
  whatsapp: 'https://wa.me/963930210522',
}

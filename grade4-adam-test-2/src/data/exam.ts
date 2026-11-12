// Exam data bank — "آدم والرياضيات" — Grade 4 Mathematics.
// Every question is traceable to printed pages 8–28 of the supplied textbook (page refs are for teachers only).
// Text uses Western digits; the UI converts to Arabic-Indic digits for display.
// Markup: {{...}} = left-to-right math chunk, [[x]] = underlined digit, @@ = input placeholder (templates).

export type Fig =
  | { t: "vbar"; title: string; xLabel: string; yLabel: string; cats: string[]; values: number[]; max: number; step: number }
  | { t: "hbar"; title: string; xLabel: string; yLabel: string; cats: string[]; values: number[]; max: number; step: number }
  | { t: "grid"; maxX: number; maxY: number; items: { x: number; y: number; icon?: string; name?: string; label?: string }[]; plot?: boolean }
  | { t: "shapes"; sides: number[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "cards"; vals: string[] }
  | { t: "vadd"; a: string; b: string; sum?: string };

export interface FieldDef {
  label?: string;
  unit?: string;
  ph?: string;
  acc: string[]; // accepted numeric answers (Western digits)
}

export type Kind = "mcq" | "fields" | "multi" | "order" | "tfc" | "plot";

export interface Sub {
  id: string;
  marks: number;
  kind: Kind;
  prompt: string;
  fig?: Fig;
  options?: { k: string; t: string }[];
  noShuffle?: boolean;
  sym?: boolean; // comparison-symbol options
  correct?: string; // mcq
  correctSet?: string[]; // multi
  seq?: string[]; // order
  fields?: FieldDef[];
  template?: string;
  layout?: "row" | "table";
  tf?: { isTrue: boolean; corrLabel?: string; corrAcc?: string[] };
  plot?: { x: number; y: number };
  answerText: string; // human readable correct answer
  alt?: string; // accepted alternatives
  partial: string; // partial credit rule
  explain: string;
}

export interface Question {
  id: string;
  topic: string;
  intro?: string;
  fig?: Fig;
  page: string; // teacher-only
  subs: Sub[];
}

const Y = ["2018", "2019", "2020", "2021", "2022", "2023"];
const T_BAR = "التمثيل البياني بالأعمدة";
const T_COORD = "شبكة الإحداثيات";
const T_PAT = "الأنماط وحل المسائل";
const T_NUM = "الأعداد حتى 99999";
const T_CMP = "موازنة الأعداد وترتيبها";
const T_R10 = "التقريب إلى أقرب عشرة";
const T_R100 = "التقريب إلى أقرب مئة";
const T_ADD = "جمع أعداد من خمس منازل";

const opt = (...t: string[]) => t.map((x, i) => ({ k: "o" + i, t: x }));
const SYM = [
  { k: "lt", t: "<" },
  { k: "eq", t: "=" },
  { k: "gt", t: ">" },
];
const NOPART = "لا توجد علامة جزئية: الإجابة إما صحيحة (كامل العلامة) أو خاطئة (صفر).";

function fld(acc: string | string[], extra: Partial<FieldDef> = {}): FieldDef {
  return { acc: Array.isArray(acc) ? acc : [acc], ...extra };
}

export const QUESTIONS: Question[] = [
  // ───────────── Q01 — vertical bar graph (p.8) ─────────────
  {
    id: "q01",
    topic: T_BAR,
    page: "ص 8 (الدرس 2: إنشاء تمثيل بياني بالأعمدة رأسياً)",
    intro: "يبيّن التمثيل البياني الآتي كمية القمح بالكيلوغرام التي حصدها آدم في مزرعته خلال ستة أعوام. تأمّل التمثيل ثم أجب:",
    fig: {
      t: "vbar",
      title: "كمية القمح التي حصدها آدم (كغ)",
      xLabel: "العام",
      yLabel: "الإنتاج بالكغ",
      cats: Y,
      values: [400, 800, 200, 600, 1000, 800],
      max: 1200,
      step: 100,
    },
    subs: [
      {
        id: "q01a",
        marks: 1,
        kind: "mcq",
        prompt: "أيّ الأعمدة أطول؟ اختر العام الموافق له:",
        options: opt("2018", "2019", "2021", "2022"),
        correct: "o3",
        answerText: "2022",
        partial: NOPART,
        explain: "العمود الأطول يصل إلى 1000 كغ وهو عمود عام 2022.",
      },
      {
        id: "q01b",
        marks: 1,
        kind: "fields",
        prompt: "كم كيلوغراماً من القمح حصد آدم في العام الذي يقابل العمود الأقصر؟",
        fields: [fld("200", { unit: "كغ", ph: "الإنتاج" })],
        answerText: "200 كغ",
        alt: "200",
        partial: NOPART,
        explain: "العمود الأقصر هو عمود عام 2020 ويصل إلى الخط 200 على المحور الشاقولي.",
      },
      {
        id: "q01c",
        marks: 2,
        kind: "mcq",
        prompt: "أيّ عامين لهما عمودان متساويان في الطول؟",
        options: opt("2018 و 2021", "2019 و 2023", "2020 و 2022", "2019 و 2021"),
        correct: "o1",
        answerText: "2019 و 2023",
        partial: NOPART,
        explain: "عمودا عامي 2019 و 2023 يصل كلٌّ منهما إلى 800 كغ.",
      },
    ],
  },

  // ───────────── Q02 — steps of drawing a bar graph (p.8) ─────────────
  {
    id: "q02",
    topic: T_BAR,
    page: "ص 8 (خطوات رسم تمثيل بياني بالأعمدة رأسياً)",
    subs: [
      {
        id: "q02a",
        marks: 3,
        kind: "order",
        prompt:
          "رتّب خطوات رسم تمثيل بياني بالأعمدة رأسياً من الخطوة الأولى إلى الأخيرة (اضغط على الخطوات بالترتيب الذي تراه صحيحاً):",
        options: [
          { k: "A", t: "أكتب عنوان التمثيل البياني." },
          { k: "B", t: "أكتب الأعوام على المحور الأفقي كما وردت في الجدول." },
          { k: "C", t: "أكمل المقياس بالمئات على المحور الشاقولي." },
          { k: "D", t: "أرسم عموداً مناسباً لكل عام." },
        ],
        seq: ["A", "B", "C", "D"],
        answerText: "1) كتابة العنوان ← 2) كتابة الأعوام على المحور الأفقي ← 3) إكمال المقياس على المحور الشاقولي ← 4) رسم العمود لكل عام",
        partial: "ترتيب كامل صحيح = 3 علامات. إذا كانت خطوتان فقط في غير مكانهما (تبديل واحد) = 1.5 علامة. غير ذلك = صفر.",
        explain: "الخطوات كما في الكتاب: العنوان، ثم الأعوام على المحور الأفقي، ثم المقياس على المحور الشاقولي، ثم رسم الأعمدة.",
      },
    ],
  },

  // ───────────── Q03 — horizontal bar graph (p.9) ─────────────
  {
    id: "q03",
    topic: T_BAR,
    page: "ص 9 (التمثيل البياني بالأعمدة أفقياً)",
    intro: "يبيّن التمثيل البياني الأفقي الآتي عدد الحصص الأسبوعية لبعض المواد في صفّ آدم. تأمّل التمثيل ثم أجب:",
    fig: {
      t: "hbar",
      title: "عدد الحصص الأسبوعية",
      xLabel: "عدد الحصص",
      yLabel: "المادة",
      cats: ["الرياضيات", "اللغة العربية", "العلوم", "الاجتماعيات", "الرياضة", "الموسيقا"],
      values: [5, 7, 3, 2, 3, 1],
      max: 8,
      step: 1,
    },
    subs: [
      {
        id: "q03a",
        marks: 1,
        kind: "fields",
        prompt: "ما عدد حصص العلوم؟",
        fields: [fld("3", { unit: "حصص", ph: "العدد" })],
        answerText: "3 حصص",
        partial: NOPART,
        explain: "عمود العلوم يصل إلى الخط 3.",
      },
      {
        id: "q03b",
        marks: 1,
        kind: "mcq",
        prompt: "ما المادة التي عدد حصصها أقل؟",
        options: opt("الاجتماعيات", "الموسيقا", "الرياضة", "العلوم"),
        correct: "o1",
        answerText: "الموسيقا",
        partial: NOPART,
        explain: "عمود الموسيقا هو الأقصر (حصة واحدة).",
      },
      {
        id: "q03c",
        marks: 1,
        kind: "mcq",
        prompt: "ما المادة التي عدد حصصها أكثر؟",
        options: opt("الرياضيات", "اللغة العربية", "العلوم", "الرياضة"),
        correct: "o1",
        answerText: "اللغة العربية",
        partial: NOPART,
        explain: "عمود اللغة العربية هو الأطول (7 حصص).",
      },
      {
        id: "q03d",
        marks: 1,
        kind: "mcq",
        prompt: "ما المادتان المتساويتان بعدد الحصص؟",
        options: opt("العلوم والرياضة", "الاجتماعيات والموسيقا", "الرياضيات والعلوم", "الرياضيات واللغة العربية"),
        correct: "o0",
        answerText: "العلوم والرياضة",
        partial: NOPART,
        explain: "لكلٍّ من العلوم والرياضة 3 حصص، فعمودهما متساويان.",
      },
      {
        id: "q03e",
        marks: 2,
        kind: "fields",
        prompt: "ما مجموع حصص اللغة العربية وحصص الرياضيات معاً؟",
        fields: [fld("12", { unit: "حصة", ph: "المجموع" })],
        answerText: "12 حصة",
        partial: NOPART,
        explain: "اللغة العربية 7 حصص والرياضيات 5 حصص: 7 + 5 = 12.",
      },
    ],
  },

  // ───────────── Q04 — read coordinates (p.10, 11) ─────────────
  {
    id: "q04",
    topic: T_COORD,
    page: "ص 10 و 11 (قراءة الثنائيات على شبكة الإحداثيات)",
    intro: "تمثّل الشبكة الآتية خريطة عالم آدم. اكتب إحداثيات كلٍّ مما يأتي:",
    fig: {
      t: "grid",
      maxX: 10,
      maxY: 8,
      items: [
        { x: 3, y: 6, icon: "house", name: "البيت" },
        { x: 7, y: 2, icon: "diamond", name: "الألماسة" },
        { x: 9, y: 5, icon: "tree", name: "الشجرة" },
        { x: 1, y: 3, icon: "pig", name: "الخنزير" },
      ],
    },
    subs: [
      {
        id: "q04a",
        marks: 2,
        kind: "fields",
        prompt: "إحداثيات البيت:",
        template: "{{( @@ , @@ )}}",
        fields: [fld("3", { ph: "أفقي" }), fld("6", { ph: "شاقولي" })],
        answerText: "(3 ، 6)",
        partial: "علامة واحدة لكل إحداثي صحيح (الأفقي ثم الشاقولي).",
        explain: "البيت يبعد 3 وحدات أفقياً و6 وحدات شاقولياً: (3 ، 6).",
      },
      {
        id: "q04b",
        marks: 2,
        kind: "fields",
        prompt: "إحداثيات الألماسة:",
        template: "{{( @@ , @@ )}}",
        fields: [fld("7", { ph: "أفقي" }), fld("2", { ph: "شاقولي" })],
        answerText: "(7 ، 2)",
        partial: "علامة واحدة لكل إحداثي صحيح.",
        explain: "الألماسة تبعد 7 وحدات أفقياً ووحدتين شاقولياً: (7 ، 2).",
      },
    ],
  },

  // ───────────── Q05 — name objects / coordinates (p.11, 12) ─────────────
  {
    id: "q05",
    topic: T_COORD,
    page: "ص 11 و 12 (كتابة الإحداثيات وتحديد الأشكال على الشبكة)",
    intro: "تأمّل الشبكة المجاورة ثم أجب:",
    fig: {
      t: "grid",
      maxX: 7,
      maxY: 6,
      items: [
        { x: 1, y: 1, icon: "pine", name: "شجرة الصنوبر" },
        { x: 3, y: 1, icon: "house", name: "البيت" },
        { x: 2, y: 5, icon: "sheep", name: "الخروف" },
        { x: 4, y: 3, icon: "castle", name: "القلعة" },
        { x: 5, y: 2, icon: "diamond", name: "الألماسة" },
        { x: 6, y: 4, icon: "pickaxe", name: "المعول" },
      ],
    },
    subs: [
      {
        id: "q05a",
        marks: 1,
        kind: "mcq",
        prompt: "ما الشكل الموجود عند الثنائية {{( 2 , 5 )}}؟",
        options: opt("الخروف", "القلعة", "البيت", "الألماسة"),
        correct: "o0",
        answerText: "الخروف",
        partial: NOPART,
        explain: "نتحرك وحدتين أفقياً ثم 5 وحدات للأعلى فنصل إلى الخروف.",
      },
      {
        id: "q05b",
        marks: 1,
        kind: "mcq",
        prompt: "ما الشكل الموجود عند الثنائية {{( 5 , 2 )}}؟",
        options: opt("المعول", "الألماسة", "شجرة الصنوبر", "القلعة"),
        correct: "o1",
        answerText: "الألماسة",
        partial: NOPART,
        explain: "نتحرك 5 وحدات أفقياً ثم وحدتين للأعلى فنصل إلى الألماسة.",
      },
      {
        id: "q05c",
        marks: 2,
        kind: "fields",
        prompt: "إحداثيات المعول:",
        template: "{{( @@ , @@ )}}",
        fields: [fld("6", { ph: "أفقي" }), fld("4", { ph: "شاقولي" })],
        answerText: "(6 ، 4)",
        partial: "علامة واحدة لكل إحداثي صحيح.",
        explain: "المعول يبعد 6 وحدات أفقياً و4 وحدات شاقولياً: (6 ، 4).",
      },
    ],
  },

  // ───────────── Q06 — lettered points (p.13) ─────────────
  {
    id: "q06",
    topic: T_COORD,
    page: "ص 13 (أنشطة وتدريبات: أولاً — كتابة إحداثيات النقاط)",
    intro: "تأمّل شبكة الإحداثيات المرافقة، ثم أجب:",
    fig: {
      t: "grid",
      maxX: 10,
      maxY: 10,
      items: [
        { x: 3, y: 7, label: "أ" },
        { x: 8, y: 4, label: "ب" },
        { x: 5, y: 9, label: "ج" },
        { x: 10, y: 2, label: "د" },
      ],
    },
    subs: [
      {
        id: "q06a",
        marks: 2,
        kind: "fields",
        prompt: "اكتب إحداثيات النقطة ب:",
        template: "{{( @@ , @@ )}}",
        fields: [fld("8", { ph: "أفقي" }), fld("4", { ph: "شاقولي" })],
        answerText: "(8 ، 4)",
        partial: "علامة واحدة لكل إحداثي صحيح.",
        explain: "النقطة ب تبعد 8 وحدات أفقياً و4 وحدات شاقولياً.",
      },
      {
        id: "q06b",
        marks: 1,
        kind: "mcq",
        prompt: "أيّ النقاط تقع عند الثنائية {{( 3 , 7 )}}؟",
        options: opt("النقطة أ", "النقطة ب", "النقطة ج", "النقطة د"),
        correct: "o0",
        answerText: "النقطة أ",
        partial: NOPART,
        explain: "النقطة أ تبعد 3 وحدات أفقياً و7 وحدات شاقولياً.",
      },
    ],
  },

  // ───────────── Q07 — plot points (p.13 ثانياً) ─────────────
  {
    id: "q07",
    topic: T_COORD,
    page: "ص 13 (أنشطة وتدريبات: ثانياً — تحديد النقاط على الشبكة)",
    intro: "حدّد كلّ نقطة من النقطتين الآتيتين على شبكة الإحداثيات بالنقر على مكانها:",
    subs: [
      {
        id: "q07a",
        marks: 2,
        kind: "plot",
        prompt: "حدّد النقطة ف {{( 6 , 3 )}} على الشبكة.",
        fig: { t: "grid", maxX: 10, maxY: 10, items: [], plot: true },
        plot: { x: 6, y: 3 },
        answerText: "النقطة عند (6 ، 3)",
        partial: "إذا كان أحد الإحداثيين صحيحاً فقط = نصف العلامة.",
        explain: "نبدأ من الصفر ونتحرك 6 وحدات إلى اليمين ثم 3 وحدات إلى الأعلى.",
      },
      {
        id: "q07b",
        marks: 2,
        kind: "plot",
        prompt: "حدّد النقطة ع {{( 0 , 8 )}} على الشبكة.",
        fig: { t: "grid", maxX: 10, maxY: 10, items: [], plot: true },
        plot: { x: 0, y: 8 },
        answerText: "النقطة عند (0 ، 8)",
        partial: "إذا كان أحد الإحداثيين صحيحاً فقط = نصف العلامة.",
        explain: "لا نتحرك أفقياً (0 وحدة) ثم نتحرك 8 وحدات إلى الأعلى على المحور الشاقولي.",
      },
    ],
  },

  // ───────────── Q08 — true/false with correction (p.10, 11 تحدّث) ─────────────
  {
    id: "q08",
    topic: T_COORD,
    page: "ص 10 و 11 (قراءة الثنائيات، وسؤال «تحدّث»)",
    intro: "اختر «صحيحة» أو «خاطئة» لكل عبارة. إذا اخترت «خاطئة» فاكتب التصحيح المطلوب.",
    subs: [
      {
        id: "q08a",
        marks: 1,
        kind: "tfc",
        prompt: "للوصول إلى النقطة {{( 7 , 5 )}} نبدأ من الصفر ونتحرك 7 وحدات إلى اليمين ثم 5 وحدات إلى الأعلى.",
        tf: { isTrue: true },
        answerText: "صحيحة",
        partial: NOPART,
        explain: "العدد الأول يدل على الحركة على المحور الأفقي والثاني على المحور الشاقولي، فالعبارة صحيحة.",
      },
      {
        id: "q08b",
        marks: 2,
        kind: "tfc",
        prompt: "الثنائيتان {{( 4 , 7 )}} و {{( 7 , 4 )}} تمثّلان النقطة نفسها على الشبكة.",
        tf: { isTrue: false, corrLabel: "في الثنائية {{( 4 , 7 )}} عدد الوحدات الأفقية يساوي:", corrAcc: ["4"] },
        answerText: "خاطئة — التصحيح: عدد الوحدات الأفقية في (4 ، 7) يساوي 4",
        partial: "علامة واحدة لاختيار «خاطئة» وعلامة واحدة للتصحيح الصحيح (4).",
        explain: "ترتيب العددين مهم: (4 ، 7) تعني 4 أفقياً و7 شاقولياً، أمّا (7 ، 4) فهي نقطة مختلفة.",
      },
    ],
  },

  // ───────────── Q09 — complete patterns (p.15) ─────────────
  {
    id: "q09",
    topic: T_PAT,
    page: "ص 15 (تمرّن، أنشطة وتدريبات 1: أكمل كل نمط)",
    intro: "أكمل كل نمط مما يأتي:",
    subs: [
      {
        id: "q09a",
        marks: 2,
        kind: "fields",
        prompt: "النمط الأول:",
        template: "{{12 , 22 , 32 , 42 , @@ , @@}}",
        fields: [fld("52"), fld("62")],
        answerText: "52 ، 62",
        partial: "علامة واحدة لكل عدد صحيح.",
        explain: "القاعدة: نضيف 10 على التالي: 42 + 10 = 52، 52 + 10 = 62.",
      },
      {
        id: "q09b",
        marks: 2,
        kind: "fields",
        prompt: "النمط الثاني:",
        template: "{{9000 , 8500 , 8000 , 7500 , @@ , @@}}",
        fields: [fld("7000"), fld("6500")],
        answerText: "7000 ، 6500",
        partial: "علامة واحدة لكل عدد صحيح.",
        explain: "القاعدة: نطرح 500 في كل مرة: 7500 − 500 = 7000، 7000 − 500 = 6500.",
      },
    ],
  },

  // ───────────── Q10 — find the rule (p.14, 15) ─────────────
  {
    id: "q10",
    topic: T_PAT,
    page: "ص 14 و 15 (جد القاعدة في النمط)",
    intro: "اختر قاعدة كل نمط مما يأتي:",
    subs: [
      {
        id: "q10a",
        marks: 1,
        kind: "mcq",
        prompt: "ما قاعدة النمط {{4 , 7 , 10 , 13 , 16}}؟",
        options: opt("نضيف 2 على التالي", "نضيف 3 على التالي", "نضيف 4 على التالي", "نطرح 3 من التالي"),
        correct: "o1",
        answerText: "نضيف 3 على التالي",
        partial: NOPART,
        explain: "7 − 4 = 3 و10 − 7 = 3 … فنضيف 3 كل مرة.",
      },
      {
        id: "q10b",
        marks: 1,
        kind: "mcq",
        prompt: "ما قاعدة النمط {{60 , 50 , 40 , 30}}؟",
        options: opt("نطرح 10 من التالي", "نضيف 10 على التالي", "نطرح 5 من التالي", "نطرح 20 من التالي"),
        correct: "o0",
        answerText: "نطرح 10 من التالي",
        partial: NOPART,
        explain: "الأعداد تتناقص بمقدار 10 في كل مرة.",
      },
      {
        id: "q10c",
        marks: 1,
        kind: "mcq",
        prompt: "ما قاعدة النمط {{0 , 5 , 10 , 15}}؟",
        options: opt("نضيف 5 على التالي", "نضيف 15 على التالي", "نضيف 3 على التالي", "نضيف 10 على التالي"),
        correct: "o0",
        answerText: "نضيف 5 على التالي",
        partial: NOPART,
        explain: "كل عدد يزيد 5 عن العدد الذي قبله.",
      },
    ],
  },

  // ───────────── Q11 — problem solving: find a pattern (p.14) ─────────────
  {
    id: "q11",
    topic: T_PAT,
    page: "ص 14 (حلّ المسائل: ابحث عن نمط — جدول الأنماط وقاعدة النمط)",
    intro: "يبني آدم درجاً من المكعبات. يبيّن الجدول الآتي عدد المكعبات في كل درجة:",
    fig: {
      t: "table",
      head: ["رقم الدرجة", "1", "2", "3", "4"],
      rows: [["عدد المكعبات", "3", "7", "11", "15"]],
    },
    subs: [
      {
        id: "q11a",
        marks: 2,
        kind: "mcq",
        prompt: "ما قاعدة النمط في عدد المكعبات؟",
        options: opt("نضيف 3 على التالي", "نضيف 4 على التالي", "نضيف 5 على التالي", "نضيف 2 على التالي"),
        correct: "o1",
        answerText: "نضيف 4 على التالي",
        partial: NOPART,
        explain: "7 − 3 = 4 و11 − 7 = 4 و15 − 11 = 4.",
      },
      {
        id: "q11b",
        marks: 2,
        kind: "fields",
        prompt: "كم مكعباً يحتاج آدم في الدرجة السادسة؟",
        fields: [fld("23", { unit: "مكعباً", ph: "العدد" })],
        answerText: "23 مكعباً",
        partial: NOPART,
        explain: "نكمل النمط: 15، 19 (الدرجة 5)، 23 (الدرجة 6).",
      },
    ],
  },

  // ───────────── Q12 — shape pattern (p.14 تحقّق) ─────────────
  {
    id: "q12",
    topic: T_PAT,
    page: "ص 14 (تحقّق: جد القاعدة في النمط — الأشكال)",
    intro: "تأمّل نمط الأشكال الآتي (يُقرأ من اليمين إلى اليسار):",
    fig: { t: "shapes", sides: [3, 4, 5, 6] },
    subs: [
      {
        id: "q12a",
        marks: 2,
        kind: "mcq",
        prompt: "ما قاعدة هذا النمط؟",
        options: opt(
          "كل شكل له ضلع واحد أكثر من الشكل الذي قبله",
          "كل شكل له ضلعان أكثر من الشكل الذي قبله",
          "كل شكل له ضلع واحد أقل من الشكل الذي قبله",
          "كل الأشكال لها العدد نفسه من الأضلاع"
        ),
        correct: "o0",
        answerText: "كل شكل له ضلع واحد أكثر من الشكل الذي قبله",
        partial: NOPART,
        explain: "عدد الأضلاع: 3، 4، 5، 6 ← يزيد ضلعاً واحداً في كل مرة.",
      },
      {
        id: "q12b",
        marks: 1,
        kind: "fields",
        prompt: "كم ضلعاً للشكل التالي في النمط؟",
        fields: [fld("7", { unit: "أضلاع", ph: "العدد" })],
        answerText: "7 أضلاع",
        partial: NOPART,
        explain: "6 + 1 = 7 أضلاع.",
      },
    ],
  },

  // ───────────── Q13 — place value table + expanded form (p.16) ─────────────
  {
    id: "q13",
    topic: T_NUM,
    page: "ص 16 (تمثيل العدد في جدول المنازل، والصيغة التفصيلية)",
    subs: [
      {
        id: "q13a",
        marks: 2,
        kind: "fields",
        prompt: "مثّل العدد {{62708}} في جدول المنازل الآتي:",
        layout: "table",
        fields: [
          fld("8", { label: "الآحاد" }),
          fld("0", { label: "العشرات" }),
          fld("7", { label: "المئات" }),
          fld("2", { label: "آحاد الألوف" }),
          fld("6", { label: "عشرات الألوف" }),
        ],
        answerText: "عشرات الألوف 6 | آحاد الألوف 2 | المئات 7 | العشرات 0 | الآحاد 8",
        partial: "تُوزّع العلامة بالتساوي على المنازل الخمس (0.4 لكل منزلة صحيحة).",
        explain: "62708: 6 عشرات ألوف، 2 آحاد ألوف، 7 مئات، 0 عشرات، 8 آحاد.",
      },
      {
        id: "q13b",
        marks: 2,
        kind: "fields",
        prompt: "اكتب العدد {{62708}} بالصيغة التفصيلية بإكمال الفراغات:",
        template: "{{60000 + 2000 + @@ + @@ + @@}}",
        fields: [fld("700"), fld("0"), fld("8")],
        answerText: "60000 + 2000 + 700 + 0 + 8",
        partial: "تُوزّع العلامة بالتساوي على الفراغات الثلاثة (0.67 لكل فراغ صحيح).",
        explain: "قيمة كل رقم حسب منزلته: 6 عشرات ألوف = 60000، 2 آحاد ألوف = 2000، 7 مئات = 700، 0 عشرات = 0، 8 آحاد = 8.",
      },
    ],
  },

  // ───────────── Q14 — words <-> digits (p.16, 17) ─────────────
  {
    id: "q14",
    topic: T_NUM,
    page: "ص 16 و 17 (الصيغة اللفظية للعدد وكتابة الأعداد)",
    subs: [
      {
        id: "q14a",
        marks: 2,
        kind: "fields",
        prompt: "اكتب بالأرقام العدد: «ثلاثة وأربعون ألفاً وخمسمئة وسبعة».",
        fields: [fld("43507", { ph: "العدد" })],
        answerText: "43507",
        partial: NOPART,
        explain: "ثلاثة وأربعون ألفاً = 43000، وخمسمئة = 500، وسبعة = 7 ← 43507.",
      },
      {
        id: "q14b",
        marks: 1,
        kind: "mcq",
        prompt: "ما الصيغة اللفظية للعدد {{70420}}؟",
        options: opt("سبعون ألفاً وأربعمئة وعشرون", "سبعة آلاف وأربعمئة وعشرون", "سبعة وأربعون ألفاً وعشرون", "سبعون ألفاً وأربعون واثنان"),
        correct: "o0",
        answerText: "سبعون ألفاً وأربعمئة وعشرون",
        partial: NOPART,
        explain: "70420 = 70000 + 400 + 20 ← سبعون ألفاً وأربعمئة وعشرون.",
      },
    ],
  },

  // ───────────── Q15 — digit & place name (p.17) ─────────────
  {
    id: "q15",
    topic: T_NUM,
    page: "ص 17 (تمرّن 2 و 3: اسم المنزلة والرقم الذي يشغلها)",
    subs: [
      {
        id: "q15a",
        marks: 1,
        kind: "fields",
        prompt: "في العدد {{38256}} ما الرقم الذي يشغل منزلة عشرات الألوف؟",
        fields: [fld("3", { ph: "الرقم" })],
        answerText: "3",
        partial: NOPART,
        explain: "أول رقم من اليسار في عدد من خمس منازل هو عشرات الألوف، وهو 3.",
      },
      {
        id: "q15b",
        marks: 1,
        kind: "mcq",
        prompt: "اكتب اسم منزلة الرقم الذي تحته خط في العدد {{2[[4]]681}}:",
        options: opt("الآحاد", "المئات", "آحاد الألوف", "عشرات الألوف"),
        correct: "o2",
        answerText: "آحاد الألوف",
        partial: NOPART,
        explain: "في 24681: الرقم 2 عشرات الألوف، والرقم 4 آحاد الألوف.",
      },
    ],
  },

  // ───────────── Q16 — expanded form -> number (p.18) ─────────────
  {
    id: "q16",
    topic: T_NUM,
    page: "ص 18 (أنشطة وتدريبات 1: اكتب كلاً من الأعداد الآتية من صيغتها التفصيلية)",
    intro: "اكتب كلاً من الأعداد الآتية بالأرقام:",
    subs: [
      {
        id: "q16a",
        marks: 2,
        kind: "fields",
        prompt: "{{20000 + 3000 + 40 + 6}}",
        fields: [fld("23046", { ph: "العدد" })],
        answerText: "23046",
        partial: NOPART,
        explain: "نضع كل قيمة في منزلتها: 2 | 3 | 0 (مئات) | 4 | 6 ← 23046.",
      },
      {
        id: "q16b",
        marks: 2,
        kind: "fields",
        prompt: "{{80000 + 0 + 600 + 0 + 9}}",
        fields: [fld("80609", { ph: "العدد" })],
        answerText: "80609",
        partial: NOPART,
        explain: "8 عشرات ألوف، 0 آحاد ألوف، 6 مئات، 0 عشرات، 9 آحاد ← 80609.",
      },
    ],
  },

  // ───────────── Q17 — biggest number & riddle (p.18) ─────────────
  {
    id: "q17",
    topic: T_NUM,
    page: "ص 18 (أنشطة وتدريبات 2 و 3: أكبر عدد، وأنا عدد…)",
    subs: [
      {
        id: "q17a",
        marks: 2,
        kind: "fields",
        prompt: "ما أكبر عدد مؤلف من خمس منازل يمكن تشكيله من البطاقات الخمس الآتية؟ (استعمل كل بطاقة مرة واحدة)",
        fig: { t: "cards", vals: ["4", "7", "1", "9", "3"] },
        fields: [fld("97431", { ph: "العدد" })],
        answerText: "97431",
        partial: NOPART,
        explain: "نرتب الأرقام من الأكبر إلى الأصغر: 9 ثم 7 ثم 4 ثم 3 ثم 1 ← 97431.",
      },
      {
        id: "q17b",
        marks: 2,
        kind: "fields",
        prompt: "أنا عدد زوجيّ بين {{34566}} و {{34575}}، آحادي أكبر من عشراتي بـ 2. فمن أنا؟",
        fields: [fld("34568", { ph: "العدد" })],
        answerText: "34568",
        partial: NOPART,
        explain: "الأعداد الزوجية بين العددين: 34568، 34570، 34572، 34574. فقط 34568 آحاده (8) أكبر من عشراته (6) بـ 2.",
      },
    ],
  },

  // ───────────── Q18 — comparison symbols (p.19, 20) ─────────────
  {
    id: "q18",
    topic: T_CMP,
    page: "ص 19 و 20 (موازنة الأعداد، تمرّن 1: ضع إشارة الموازنة المناسبة)",
    intro: "ضع إشارة الموازنة المناسبة ( > أو < أو = ) بين العددين في كلٍّ مما يأتي:",
    subs: [
      {
        id: "q18a",
        marks: 1,
        kind: "mcq",
        sym: true,
        prompt: "{{48520 … 48250}}",
        options: SYM,
        noShuffle: true,
        correct: "gt",
        answerText: ">",
        partial: NOPART,
        explain: "عدد المنازل متساوٍ، فنوازن من الأكبر منزلة: الآلاف متساوية (8 = 8) ثم المئات: 5 > 2، إذاً 48520 > 48250.",
      },
      {
        id: "q18b",
        marks: 1,
        kind: "mcq",
        sym: true,
        prompt: "{{5731 … 25731}}",
        options: SYM,
        noShuffle: true,
        correct: "lt",
        answerText: "<",
        partial: NOPART,
        explain: "5731 من أربع منازل و25731 من خمس منازل، والعدد الذي منازله أكبر هو الأكبر: 5731 < 25731.",
      },
      {
        id: "q18c",
        marks: 1,
        kind: "mcq",
        sym: true,
        prompt: "{{90417 … 90471}}",
        options: SYM,
        noShuffle: true,
        correct: "lt",
        answerText: "<",
        partial: NOPART,
        explain: "المنازل متساوية حتى المئات (904)، ثم العشرات: 1 < 7، إذاً 90417 < 90471.",
      },
      {
        id: "q18d",
        marks: 1,
        kind: "mcq",
        sym: true,
        prompt: "{{30000 + 2000 + 700 + 5 … 32705}}",
        options: SYM,
        noShuffle: true,
        correct: "eq",
        answerText: "=",
        partial: NOPART,
        explain: "30000 + 2000 + 700 + 5 = 32705، فالعددان متساويان.",
      },
    ],
  },

  // ───────────── Q19 — order ascending (p.19, 21) ─────────────
  {
    id: "q19",
    topic: T_CMP,
    page: "ص 19 و 21 (ترتيب الأعداد تصاعدياً)",
    subs: [
      {
        id: "q19a",
        marks: 2,
        kind: "order",
        prompt: "رتّب الأعداد الآتية تصاعدياً (من الأصغر إلى الأكبر) بالضغط عليها بالترتيب:",
        options: [
          { k: "38512", t: "38512" },
          { k: "8532", t: "8532" },
          { k: "83215", t: "83215" },
          { k: "38251", t: "38251" },
        ],
        seq: ["8532", "38251", "38512", "83215"],
        answerText: "8532 ، 38251 ، 38512 ، 83215",
        partial: "ترتيب كامل صحيح = علامتان. تبديل موضع عددين فقط = علامة واحدة. غير ذلك = صفر.",
        explain: "8532 له 4 منازل فهو الأصغر. ثم نوازن 38251 و38512 (المئات: 2 < 5) ثم 83215 الأكبر.",
      },
    ],
  },

  // ───────────── Q20 — order descending, word problem (p.21) ─────────────
  {
    id: "q20",
    topic: T_CMP,
    page: "ص 21 (أنشطة وتدريبات 3: رتّب الأعداد تنازلياً)",
    subs: [
      {
        id: "q20a",
        marks: 2,
        kind: "order",
        prompt:
          "في مخازن آدم ثلاثة صناديق فيها {{15380}} و {{51380}} و {{15830}} زمردة. رتّب أعداد الزمرد تنازلياً (من الأكبر إلى الأصغر) بالضغط عليها بالترتيب:",
        options: [
          { k: "15380", t: "15380" },
          { k: "51380", t: "51380" },
          { k: "15830", t: "15830" },
        ],
        seq: ["51380", "15830", "15380"],
        answerText: "51380 ، 15830 ، 15380",
        partial: "ترتيب كامل صحيح = علامتان. تبديل موضع عددين فقط = علامة واحدة. غير ذلك = صفر.",
        explain: "51380 هو الأكبر (عشرات الألوف 5). ثم 15830 > 15380 لأن المئات 8 > 3.",
      },
    ],
  },

  // ───────────── Q21 — previous & next (p.20) ─────────────
  {
    id: "q21",
    topic: T_CMP,
    page: "ص 20 (تمرّن 2: السابق والتالي)",
    subs: [
      {
        id: "q21a",
        marks: 2,
        kind: "fields",
        prompt: "اكتب العدد السابق والعدد التالي للعدد {{39999}}:",
        layout: "row",
        fields: [fld("39998", { label: "السابق" }), fld("40000", { label: "التالي" })],
        answerText: "السابق 39998 ، التالي 40000",
        partial: "علامة واحدة لكل إجابة صحيحة.",
        explain: "السابق: 39999 − 1 = 39998. التالي: 39999 + 1 = 40000.",
      },
    ],
  },

  // ───────────── Q22 — fill the blank to make comparison true (p.21) ─────────────
  {
    id: "q22",
    topic: T_CMP,
    page: "ص 21 (أنشطة وتدريبات 4: اكتب العدد المناسب في الفراغ لتصبح الموازنة صحيحة)",
    intro: "اكتب الرقم أو العدد المناسب في الفراغ لتصبح العلاقة صحيحة:",
    subs: [
      {
        id: "q22a",
        marks: 1,
        kind: "fields",
        prompt: "الرقم الناقص:",
        template: "{{25403 = 2 @@ 403}}",
        fields: [fld("5")],
        answerText: "5",
        partial: NOPART,
        explain: "لتتساوى الأعداد يجب أن يكون رقم الآلاف 5: 25403 = 25403.",
      },
      {
        id: "q22b",
        marks: 1,
        kind: "fields",
        prompt: "العدد الناقص:",
        template: "{{60000 + 3000 + @@ + 20 + 9 = 63829}}",
        fields: [fld("800")],
        answerText: "800",
        partial: NOPART,
        explain: "63829 فيه 8 مئات أي 800.",
      },
      {
        id: "q22c",
        marks: 1,
        kind: "fields",
        prompt: "اكتب أصغر رقم مناسب في الفراغ:",
        template: "{{74@@32 > 74632}}",
        fields: [fld("7")],
        answerText: "7",
        partial: NOPART,
        explain: "المنازل متساوية حتى الآلاف (74)، ثم نوازن المئات: يجب أن يكون الرقم أكبر من 6، وأصغر رقم هو 7.",
      },
    ],
  },

  // ───────────── Q23 — round to nearest ten (p.22, 23) ─────────────
  {
    id: "q23",
    topic: T_R10,
    page: "ص 22 و 23 (تحقّق وأنشطة 1: قرّب كلاً من الأعداد إلى أقرب عشرة)",
    intro: "قرّب كلاً من الأعداد الآتية إلى أقرب عشرة:",
    subs: [
      {
        id: "q23a",
        marks: 1,
        kind: "fields",
        prompt: "{{3647}}",
        fields: [fld("3650", { ph: "التقريب" })],
        answerText: "3650",
        partial: NOPART,
        explain: "الآحاد 7 (أكبر من 5) فنضيف 1 إلى منزلة العشرات: 3650.",
      },
      {
        id: "q23b",
        marks: 1,
        kind: "fields",
        prompt: "{{98724}}",
        fields: [fld("98720", { ph: "التقريب" })],
        answerText: "98720",
        partial: NOPART,
        explain: "الآحاد 4 (أصغر من 5) فنجعل الآحاد صفراً: 98720.",
      },
      {
        id: "q23c",
        marks: 1,
        kind: "fields",
        prompt: "{{1995}}",
        fields: [fld("2000", { ph: "التقريب" })],
        answerText: "2000",
        partial: NOPART,
        explain: "الآحاد 5 فنضيف 1 إلى العشرات (9 + 1 = 10): 1995 ← 2000.",
      },
    ],
  },

  // ───────────── Q24 — nearest ten: choose + colouring activity (p.23, 27) ─────────────
  {
    id: "q24",
    topic: T_R10,
    page: "ص 23 (تمرّن: اختر)، وص 27 (مرح الرياضيات: لوّن الأعداد الناتج تقريبها)",
    subs: [
      {
        id: "q24a",
        marks: 1,
        kind: "mcq",
        prompt: "العدد {{4736}} مقرّباً إلى أقرب عشرة هو:",
        options: opt("4730", "4740", "4700", "4800"),
        correct: "o1",
        answerText: "4740",
        partial: NOPART,
        explain: "الآحاد 6 (5 أو أكبر) فنضيف 1 إلى العشرات: 4740.",
      },
      {
        id: "q24b",
        marks: 2,
        kind: "multi",
        prompt: "اختر كل عدد نحصل منه على {{2580}} عند تقريبه إلى أقرب عشرة:",
        options: opt("2576", "2583", "2589", "2574", "2584"),
        correctSet: ["o0", "o1", "o4"],
        answerText: "2576 ، 2583 ، 2584",
        partial:
          "العلامة = (عدد الاختيارات الصحيحة − عدد الاختيارات الخاطئة) ÷ 3 × علامتين، ولا تقل عن صفر.",
        explain: "2576 ← 2580، 2583 ← 2580، 2584 ← 2580، بينما 2589 ← 2590 و2574 ← 2570.",
      },
    ],
  },

  // ───────────── Q25 — round to nearest hundred (p.24, 25) ─────────────
  {
    id: "q25",
    topic: T_R100,
    page: "ص 24 و 25 (تحقّق وأنشطة 1: قرّب كلاً من الأعداد إلى أقرب مئة)",
    intro: "قرّب كلاً من الأعداد الآتية إلى أقرب مئة:",
    subs: [
      {
        id: "q25a",
        marks: 1,
        kind: "fields",
        prompt: "{{7236}}",
        fields: [fld("7200", { ph: "التقريب" })],
        answerText: "7200",
        partial: NOPART,
        explain: "العشرات 3 (أصغر من 5) فنجعل الآحاد والعشرات أصفاراً: 7200.",
      },
      {
        id: "q25b",
        marks: 1,
        kind: "fields",
        prompt: "{{98721}}",
        fields: [fld("98700", { ph: "التقريب" })],
        answerText: "98700",
        partial: NOPART,
        explain: "العشرات 2 (أصغر من 5) فنبقي منزلة المئات كما هي: 98700.",
      },
      {
        id: "q25c",
        marks: 1,
        kind: "fields",
        prompt: "{{36450}}",
        fields: [fld("36500", { ph: "التقريب" })],
        answerText: "36500",
        partial: NOPART,
        explain: "العشرات 5 فنضيف 1 إلى منزلة المئات: 36500.",
      },
    ],
  },

  // ───────────── Q26 — rounding puzzles (p.23, 25) ─────────────
  {
    id: "q26",
    topic: T_R100,
    page: "ص 23 (أنشطة وتدريبات 3: بطاقة نور) وص 25 (أنشطة وتدريبات 3: قميص المشترك)",
    subs: [
      {
        id: "q26a",
        marks: 2,
        kind: "fields",
        prompt:
          "ارتدى لاعب قميصاً كُتب عليه عدد من ثلاث منازل أرقامه 3 و 6 و 9 (كل رقم مرة واحدة)، وإذا قُرّب هذا العدد إلى أقرب مئة نتج العدد {{700}}. ما العدد الذي كُتب على القميص؟",
        fields: [fld("693", { ph: "العدد" })],
        answerText: "693",
        partial: NOPART,
        explain:
          "الأعداد الممكنة: 369 ← 400، 396 ← 400، 639 ← 600، 693 ← 700، 936 ← 900، 963 ← 1000. فقط 693 يقرَّب إلى 700.",
      },
      {
        id: "q26b",
        marks: 1,
        kind: "mcq",
        prompt:
          "كتبت ليلى على بطاقة عدداً من ثلاث منازل: رقم المئات 3 ورقم العشرات 4. وعند تقريبه إلى أقرب عشرة نحصل على {{350}}. ما العدد المكتوب على البطاقة؟",
        options: opt("342", "344", "347", "340"),
        correct: "o2",
        answerText: "347",
        partial: NOPART,
        explain: "نحصل على 350 عندما يكون الآحاد 5 أو أكبر: 347 ← 350، بينما 342 و344 و340 تُقرَّب إلى 340.",
      },
    ],
  },

  // ───────────── Q27 — chapter review: rounding (p.26) ─────────────
  {
    id: "q27",
    topic: T_R100,
    page: "ص 26 (مراجعة الفصل 4 و 5: جدول التقريب، واستطلاع الرأي)",
    subs: [
      {
        id: "q27a",
        marks: 2,
        kind: "mcq",
        prompt:
          "بيّنت نتائج استطلاع للرأي أنّ {{548}} تلميذاً يفضّلون مادة العلوم. قرّب سامر العدد إلى {{500}} وقرّبته ليلى إلى {{600}}. أيّهما كان تقريبه إلى أقرب مئة صائباً؟",
        options: opt("سامر", "ليلى", "كلاهما", "لا أحد منهما"),
        correct: "o0",
        answerText: "سامر",
        partial: NOPART,
        explain: "في 548 رقم العشرات 4 (أصغر من 5) فنبقي المئات كما هي: 500، إذاً تقريب سامر صائب.",
      },
      {
        id: "q27b",
        marks: 2,
        kind: "fields",
        prompt: "قرّب العدد {{53847}} كما هو مطلوب:",
        layout: "row",
        fields: [fld("53850", { label: "إلى أقرب عشرة" }), fld("53800", { label: "إلى أقرب مئة" })],
        answerText: "أقرب عشرة: 53850 ، أقرب مئة: 53800",
        partial: "علامة واحدة لكل تقريب صحيح.",
        explain: "الآحاد 7 ← 53850. العشرات 4 (أصغر من 5) ← 53800.",
      },
    ],
  },

  // ───────────── Q28 — vertical addition (p.28) ─────────────
  {
    id: "q28",
    topic: T_ADD,
    page: "ص 28 (جمع عددين كلٌّ منهما مؤلف من خمس منازل — جمع المنازل واحدة تلو الأخرى؛ هدف الدرس «بحمل أو بلا حمل»)",
    intro: "اجمع كلاً مما يأتي:",
    subs: [
      {
        id: "q28a",
        marks: 1,
        kind: "fields",
        prompt: "اكتب ناتج الجمع:",
        fig: { t: "vadd", a: "31254", b: "42431" },
        fields: [fld("73685", { ph: "الناتج" })],
        answerText: "73685",
        partial: NOPART,
        explain: "نجمع الآحاد: 4 + 1 = 5، العشرات: 5 + 3 = 8، المئات: 2 + 4 = 6، الآلاف: 1 + 2 = 3، عشرات الألوف: 3 + 4 = 7 ← 73685.",
      },
      {
        id: "q28b",
        marks: 2,
        kind: "fields",
        prompt: "اكتب ناتج الجمع:",
        fig: { t: "vadd", a: "46385", b: "21647" },
        fields: [fld("68032", { ph: "الناتج" })],
        answerText: "68032",
        partial: NOPART,
        explain:
          "الآحاد: 5 + 7 = 12 (نكتب 2 ونحمل 1)، العشرات: 8 + 4 + 1 = 13 (3 ونحمل 1)، المئات: 3 + 6 + 1 = 10 (0 ونحمل 1)، الآلاف: 6 + 1 + 1 = 8، عشرات الألوف: 4 + 2 = 6 ← 68032.",
      },
    ],
  },

  // ───────────── Q29 — word problem, multi-step addition (p.28) ─────────────
  {
    id: "q29",
    topic: T_ADD,
    page: "ص 28 (تعلّم 1: مسألة جمع عددين من خمس منازل — تطبيق متعدد الخطوات)",
    intro: "جمع آدم في عالمه 12340 مكعباً من الحجر، و25214 مكعباً من التراب، و31021 مكعباً من الخشب.",
    subs: [
      {
        id: "q29a",
        marks: 1,
        kind: "fields",
        prompt: "كم مكعباً من الحجر والتراب معاً؟",
        fields: [fld("37554", { unit: "مكعباً", ph: "الناتج" })],
        answerText: "37554",
        partial: NOPART,
        explain: "12340 + 25214 = 37554.",
      },
      {
        id: "q29b",
        marks: 2,
        kind: "fields",
        prompt: "كم مجموع المكعبات التي جمعها آدم من الأنواع الثلاثة؟",
        fields: [fld("68575", { unit: "مكعباً", ph: "الناتج" })],
        answerText: "68575",
        alt: "لا توجد صيغ بديلة (تُقبل الأرقام الهندية أو العربية).",
        partial: "التصحيح الآلي: العلامة كاملة للناتج الصحيح 68575، وصفر لغيره. (للمعلم: يمكن منح علامة واحدة يدوياً إذا كانت الخطوات صحيحة والخطأ في الجمع فقط.)",
        explain: "نجمع ناتج الخطوة الأولى مع عدد مكعبات الخشب: 37554 + 31021 = 68575.",
      },
    ],
  },

  // ───────────── Q30 — missing digit & add-then-round (p.28 + p.24) ─────────────
  {
    id: "q30",
    topic: T_ADD,
    page: "ص 28 (جمع المنازل وإيجاد المنزلة الناقصة) وص 24 و 25 (التقريب إلى أقرب مئة)",
    subs: [
      {
        id: "q30a",
        marks: 1,
        kind: "fields",
        prompt: "اكتب الرقم الناقص ليصبح الجمع صحيحاً:",
        fig: { t: "vadd", a: "52143", b: "2?312", sum: "76455" },
        fields: [fld("4", { ph: "الرقم" })],
        answerText: "4",
        partial: NOPART,
        explain: "المنزلة الناقصة هي الآلاف في العدد الثاني: 2 + ؟ = 6 ← الرقم 4. التحقق: 52143 + 24312 = 76455.",
      },
      {
        id: "q30b",
        marks: 2,
        kind: "fields",
        prompt: "اجمع {{23214 + 41352}} ثم قرّب الناتج إلى أقرب مئة:",
        layout: "row",
        fields: [fld("64566", { label: "المجموع" }), fld("64600", { label: "بعد التقريب" })],
        answerText: "المجموع 64566 ، بعد التقريب 64600",
        partial: "علامة واحدة للمجموع الصحيح وعلامة واحدة للتقريب الصحيح للمجموع.",
        explain: "23214 + 41352 = 64566. رقم العشرات 6 (5 أو أكبر) فنضيف 1 إلى المئات: 64600.",
      },
    ],
  },
];

export const EXAM_ID = "ADAM-G4-MATH";
export const EXAM_VERSION = "1.0";
export const EXAM_TITLE = "آدم والرياضيات";

export const ALL_SUBS: Sub[] = QUESTIONS.flatMap((q) => q.subs);
export const SUB_INDEX: Record<string, { q: Question; s: Sub; letter: string }> = {};
const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
QUESTIONS.forEach((q) => q.subs.forEach((s, i) => (SUB_INDEX[s.id] = { q, s, letter: LETTERS[i] })));
export const LETTER = LETTERS;

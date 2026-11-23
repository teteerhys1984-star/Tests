export type LessonId = "motion" | "force";

export type JourneyIcon = "car" | "bike" | "bus" | "train" | "walker" | "taxi" | "skater";

export type FigureSpec =
  | {
      kind: "journey";
      icon: JourneyIcon;
      distance: string;
      time: string;
      place: string;
      tone?: "green" | "gold" | "teal";
    }
  | {
      kind: "roundtrip";
      totalDistance: string;
      time: string;
      place: string;
      icon?: JourneyIcon;
    }
  | {
      kind: "graph";
      distanceUnit: string;
      timeUnit: string;
      points: { x: number; y: number; label: string }[];
      segments: "uniform" | "stop-then-go";
    }
  | { kind: "echo"; time: string; speed: string }
  | {
      kind: "hangingScale";
      object: "apple" | "bag" | "rice" | "block";
      mass: string;
      weight: string;
      g: string;
    }
  | {
      kind: "earthMoon";
      mass: string;
      earthWeight: string;
      moonWeight: string;
      earthG: string;
      moonG: string;
    }
  | {
      kind: "forceScale";
      scale: string;
      arrows: { label: string; force: string; length: string }[];
    }
  | {
      kind: "cargo";
      parts: { label: string; mass: string }[];
      totalMass: string;
      totalWeight: string;
      limit?: string;
    };

export type Level = "تأسيسي" | "متوسط" | "تحدٍّ";

export type Problem = {
  id: string;
  number: number;
  title: string;
  emoji: string;
  level: Level;
  topic: string;
  prompt: string[];
  givens: { label: string; value: string }[];
  questions: string[];
  figure: FigureSpec;
  solution: {
    idea: string;
    steps: { title: string; body: string }[];
    answer: { label: string; tex: string; note: string };
    teacherNote: string;
  };
};

export type LessonMeta = {
  id: LessonId;
  number: string;
  title: string;
  emoji: string;
  subtitle: string;
  pages: string;
  duration: string;
  accent: string;
  soft: string;
  formula: { title: string; tex: string; symbols: { sym: string; label: string }[] };
  skills: string[];
};

export const lessonList: LessonMeta[] = [
  {
    id: "motion",
    number: "الدرس الأول",
    title: "الحركة والسكون",
    emoji: "🚀",
    subtitle: "نصف الحركة بلغة الأرقام: المسافة والزمن والسرعة الوسطية.",
    pages: "ص 3 – 16",
    duration: "75 دقيقة",
    accent: "forest",
    soft: "sage",
    formula: {
      title: "قانون السرعة الوسطية",
      tex: "v = \\dfrac{d}{t}",
      symbols: [
        { sym: "v", label: "السرعة الوسطية — m.s⁻¹" },
        { sym: "d", label: "المسافة المقطوعة — m" },
        { sym: "t", label: "الزمن المستغرق — s" },
      ],
    },
    skills: ["تحويل الوحدات", "السرعة والمسافة والزمن", "قراءة الخط البياني"],
  },
  {
    id: "force",
    number: "الدرس الثاني",
    title: "القوة والحركة",
    emoji: "⚖️",
    subtitle: "نقيس القوة والثقل ونحوّل بين الكتلة والنيوتن ومقياس الرسم.",
    pages: "ص 17 – 28",
    duration: "90 دقيقة",
    accent: "teal",
    soft: "mint",
    formula: {
      title: "قانون الثقل والكتلة",
      tex: "w = m\\,g",
      symbols: [
        { sym: "w", label: "ثقل الجسم — N" },
        { sym: "m", label: "الكتلة — kg" },
        { sym: "g", label: "تسارع الجاذبية — N.kg⁻¹" },
      ],
    },
    skills: ["الكتلة والثقل", "مقياس الرسم", "الحسابات المركّبة"],
  },
];

export const lessons: Record<LessonId, LessonMeta> = {
  motion: lessonList[0],
  force: lessonList[1],
};

const motionProblems: Problem[] = [
  {
    id: "m1",
    number: 1,
    title: "سيارة على الطريق الساحلي",
    emoji: "🚗",
    level: "تأسيسي",
    topic: "معدّل السرعة وتحويل الوحدات",
    prompt: [
      "انطلقت سيارة على الطريق الساحلي فقطعت مسافة $12\\,\\text{km}$ خلال $10\\,\\text{min}$ بسرعة ثابتة.",
      "احسب سرعتها الوسطية بوحدة $\\text{km}\\cdot\\text{h}^{-1}$، ثم حوّل الناتج إلى $\\text{m}\\cdot\\text{s}^{-1}$.",
    ],
    givens: [
      { label: "المسافة", value: "$d = 12\\,\\text{km}$" },
      { label: "الزمن", value: "$t = 10\\,\\text{min}$" },
    ],
    questions: ["السرعة بوحدة $\\text{km}\\cdot\\text{h}^{-1}$", "السرعة بوحدة $\\text{m}\\cdot\\text{s}^{-1}$"],
    figure: {
      kind: "journey",
      icon: "car",
      distance: "12 km",
      time: "10 min",
      place: "الطريق الساحلي",
      tone: "green",
    },
    solution: {
      idea: "نحوّل الزمن إلى ساعات لأن المسافة بالكيلومتر، ثم نطبّق قانون السرعة الوسطية.",
      steps: [
        {
          title: "تحويل الزمن إلى ساعات",
          body: "$t = 10\\,\\text{min} = \\dfrac{10}{60}\\,\\text{h} = \\dfrac{1}{6}\\,\\text{h}$",
        },
        {
          title: "تطبيق القانون",
          body: "$v = \\dfrac{d}{t} = \\dfrac{12}{1/6} = 12 \\times 6 = 72\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "التحويل إلى متر لكل ثانية",
          body: "نقسم على $3.6$: $v = \\dfrac{72}{3.6} = 20\\,\\text{m}\\cdot\\text{s}^{-1}$",
        },
      ],
      answer: { label: "السرعة الوسطية", tex: "v = 72\\,\\text{km}\\cdot\\text{h}^{-1} = 20\\,\\text{m}\\cdot\\text{s}^{-1}", note: "الاتجاه نحو وجهة السيارة نفسها." },
      teacherNote: "تذكير الطالب بأن القسمة على 3.6 للانتقال من $\text{km}\cdot\text{h}^{-1}$ إلى $\text{m}\cdot\text{s}^{-1}$، والضرب في 3.6 في الاتجاه المعاكس.",
    },
  },
  {
    id: "m2",
    number: 2,
    title: "دراجة في حديقة المدينة",
    emoji: "🚴",
    level: "تأسيسي",
    topic: "تحويل الوحدات بالاتجاهين",
    prompt: [
      "قطع راكب دراجة مسافة $450\\,\\text{m}$ داخل حديقة المدينة خلال دقيقتين ونصف الدقيقة، ثم واصل بالسرعة نفسها.",
      "المطلوب: احسب سرعته بوحدة $\\text{m}\\cdot\\text{s}^{-1}$، ثم بوحدة $\\text{km}\\cdot\\text{h}^{-1}$.",
    ],
    givens: [
      { label: "المسافة", value: "$d = 450\\,\\text{m}$" },
      { label: "الزمن", value: "$t = 2.5\\,\\text{min}$" },
    ],
    questions: ["السرعة بوحدة $\\text{m}\\cdot\\text{s}^{-1}$", "السرعة بوحدة $\\text{km}\\cdot\\text{h}^{-1}$"],
    figure: {
      kind: "journey",
      icon: "bike",
      distance: "450 m",
      time: "2.5 min",
      place: "حديقة المدينة",
      tone: "teal",
    },
    solution: {
      idea: "نحوّل الزمن إلى ثوانٍ، والمسافة إلى أمتار جاهزة، ثم نضرب في 3.6 للتحويل إلى km.h⁻¹.",
      steps: [
        {
          title: "تحويل الزمن إلى ثوانٍ",
          body: "$t = 2.5 \\times 60 = 150\\,\\text{s}$",
        },
        {
          title: "حساب السرعة",
          body: "$v = \\dfrac{450}{150} = 3\\,\\text{m}\\cdot\\text{s}^{-1}$",
        },
        {
          title: "التحويل إلى كيلومتر لكل ساعة",
          body: "$v = 3 \\times 3.6 = 10.8\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
      ],
      answer: { label: "السرعة الوسطية", tex: "v = 3\\,\\text{m}\\cdot\\text{s}^{-1} = 10.8\\,\\text{km}\\cdot\\text{h}^{-1}", note: "سرعة ثابتة لأن المسافات المقطوعة في أزمنة متساوية متساوية." },
      teacherNote: "اربط الحل بالحركة المنتظمة: الخط البياني للمسافة–الزمن هنا مستقيم يمرّ بالمبدأ.",
    },
  },
  {
    id: "m3",
    number: 3,
    title: "الحافلة المدرسية والتوقف",
    emoji: "🚌",
    level: "متوسط",
    topic: "السرعة الوسطية مع فترة توقف",
    prompt: [
      "تسير حافلة مدرسية بسرعة $24\\,\\text{km}\\cdot\\text{h}^{-1}$ لتقطع $6\\,\\text{km}$ من المنزل إلى المدرسة، ثم تتوقف عند المدرسة $5\\,\\text{min}$ لإنزال الطلاب.",
      "احسب زمن السير فقط، ثم الزمن الكلي، ثم السرعة الوسطية للرحلة كاملة بما فيها التوقف.",
    ],
    givens: [
      { label: "المسافة", value: "$d = 6\\,\\text{km}$" },
      { label: "سرعة السير", value: "$v = 24\\,\\text{km}\\cdot\\text{h}^{-1}$" },
      { label: "زمن التوقف", value: "$t_{\\text{stop}} = 5\\,\\text{min}$" },
    ],
    questions: ["زمن السير", "الزمن الكلي", "السرعة الوسطية للرحلة كاملة"],
    figure: {
      kind: "journey",
      icon: "bus",
      distance: "6 km",
      time: "24 km.h⁻¹ + توقف",
      place: "الحافلة المدرسية",
      tone: "gold",
    },
    solution: {
      idea: "نحسب زمن السير من القانون، نجمع زمن التوقف، ثم نقسم المسافة على الزمن الكلي.",
      steps: [
        {
          title: "زمن السير",
          body: "$t_1 = \\dfrac{d}{v} = \\dfrac{6}{24} = 0.25\\,\\text{h} = 15\\,\\text{min}$",
        },
        {
          title: "الزمن الكلي",
          body: "$t_{\\text{total}} = 15 + 5 = 20\\,\\text{min} = \\dfrac{20}{60} = \\dfrac{1}{3}\\,\\text{h}$",
        },
        {
          title: "السرعة الوسطية للرحلة كاملة",
          body: "$v_{\\text{avg}} = \\dfrac{6}{1/3} = 18\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
      ],
      answer: {
        label: "النتائج",
        tex: "t_{\\text{drive}} = 15\\,\\text{min},\\quad t_{\\text{total}} = 20\\,\\text{min},\\quad v_{\\text{avg}} = 18\\,\\text{km}\\cdot\\text{h}^{-1}",
        note: "السرعة الوسطية للرحلة أقل من سرعة السير لأن التوقف زاد الزمن دون زيادة المسافة.",
      },
      teacherNote: "هذه مسألة مناسبة لتثبيت الفرق بين سرعة السير والسرعة الوسطية للرحلة كاملة.",
    },
  },
  {
    id: "m4",
    number: 4,
    title: "عدّاء المضمار ذهابًا وعودة",
    emoji: "🏃",
    level: "تأسيسي",
    topic: "المسافة الكلية في الذهاب والإياب",
    prompt: [
      "انطلق عدّاء من بداية مضمار طوله $300\\,\\text{m}$ حتى نهايته، ثم عاد على المضمار نفسه إلى نقطة البداية، مستغرقًا دقيقتين كاملتين.",
      "احسب المسافة الكلية التي قطعها العدّاء، ثم سرعته الوسطية.",
    ],
    givens: [
      { label: "طول المضمار", value: "$d_1 = 300\\,\\text{m}$" },
      { label: "الزمن الكلي", value: "$t = 2\\,\\text{min}$" },
    ],
    questions: ["المسافة الكلية", "السرعة الوسطية بالمتر لكل ثانية"],
    figure: {
      kind: "roundtrip",
      totalDistance: "300 m × 2",
      time: "2 min",
      place: "مضمار المدينة الرياضي",
      icon: "walker",
    },
    solution: {
      idea: "المسافة الكلية هي طول المسار مرتين، والزمن يُحوّل إلى ثوانٍ.",
      steps: [
        {
          title: "حساب المسافة الكلية",
          body: "$d_{\\text{total}} = 300 + 300 = 600\\,\\text{m}$",
        },
        {
          title: "تحويل الزمن",
          body: "$t = 2 \\times 60 = 120\\,\\text{s}$",
        },
        {
          title: "السرعة الوسطية",
          body: "$v = \\dfrac{600}{120} = 5\\,\\text{m}\\cdot\\text{s}^{-1}$",
        },
      ],
      answer: { label: "المسافة والسرعة", tex: "d = 600\\,\\text{m},\\quad v = 5\\,\\text{m}\\cdot\\text{s}^{-1}", note: "المسافة كمية قياسية تعتمد على طول المسار، ولذلك تُحسب مرّتين في الذهاب والإياب." },
      teacherNote: "لا نستخدم الإزاحة هنا؛ المنهاج يعتمد على المسافة = طول المسار. اجعل الطالب يذكر أن العودة تُضيف مسافة لا تطرحها.",
    },
  },
  {
    id: "m5",
    number: 5,
    title: "قطار الشرق السريع",
    emoji: "🚆",
    level: "متوسط",
    topic: "الزمن والوصول من قانون السرعة",
    prompt: [
      "غادر قطار محطة دمشق الساعة $7{:}40$ صباحًا، وسار بسرعة وسطية $90\\,\\text{km}\\cdot\\text{h}^{-1}$ حتى وصل إلى مدينة تبعد $225\\,\\text{km}$.",
      "احسب زمن الرحلة بالساعات والدقائق، ثم حدّد ساعة وصوله.",
    ],
    givens: [
      { label: "المسافة", value: "$d = 225\\,\\text{km}$" },
      { label: "السرعة", value: "$v = 90\\,\\text{km}\\cdot\\text{h}^{-1}$" },
      { label: "ساعة الانطلاق", value: "$7{:}40$ صباحًا" },
    ],
    questions: ["زمن الرحلة", "ساعة الوصول"],
    figure: {
      kind: "journey",
      icon: "train",
      distance: "225 km",
      time: "90 km.h⁻¹",
      place: "دمشق ← المدينة",
      tone: "green",
    },
    solution: {
      idea: "من قانون السرعة نستخرج الزمن، ثم نضيفه إلى ساعة الانطلاق مع الانتباه للدقائق.",
      steps: [
        {
          title: "حساب الزمن",
          body: "$v = \\dfrac{d}{t} \\Rightarrow t = \\dfrac{d}{v} = \\dfrac{225}{90} = 2.5\\,\\text{h}$",
        },
        {
          title: "تحويل الجزء العشري إلى دقائق",
          body: "$2.5\\,\\text{h} = 2\\,\\text{h} + 0.5 \\times 60\\,\\text{min} = 2\\,\\text{h}\\,30\\,\\text{min}$",
        },
        {
          title: "حساب ساعة الوصول",
          body: "$7{:}40 + 2{:}30 = 10{:}10$ صباحًا.",
        },
      ],
      answer: { label: "زمن الرحلة والوصول", tex: "t = 2\\,\\text{h}\\,30\\,\\text{min},\\quad t_{\\text{arrival}} = 10{:}10", note: "تأكد من جمع الدقائق بشكل صحيح: 40 + 30 = 70 دقيقة = ساعة و10 دقائق." },
      teacherNote: "خطأ متكرر: كتابة 2.5 ساعة على أنها ساعتان و5 دقائق. راجع تحويل الجزء العشري من الساعة.",
    },
  },
  {
    id: "m6",
    number: 6,
    title: "سيرًا إلى المدرسة",
    emoji: "🎒",
    level: "متوسط",
    topic: "سرعة ثابتة وزمن جديد",
    prompt: [
      "يسير سامر إلى المدرسة بسرعة ثابتة، فيقطع $1.8\\,\\text{km}$ خلال $24\\,\\text{min}$.",
      "أوجد سرعته بوحدة $\\text{km}\\cdot\\text{h}^{-1}$، ثم احسب الزمن اللازم ليقطع مسافة $1.2\\,\\text{km}$ بالسرعة نفسها.",
    ],
    givens: [
      { label: "المسافة الأولى", value: "$d_1 = 1.8\\,\\text{km}$" },
      { label: "الزمن الأول", value: "$t_1 = 24\\,\\text{min}$" },
      { label: "المسافة الثانية", value: "$d_2 = 1.2\\,\\text{km}$" },
    ],
    questions: ["السرعة بالكيلومتر لكل ساعة", "زمن مسافة $1.2\\,\\text{km}$ بالدقائق"],
    figure: {
      kind: "journey",
      icon: "walker",
      distance: "1.8 km",
      time: "24 min",
      place: "طريق المدرسة",
      tone: "gold",
    },
    solution: {
      idea: "نحوّل الزمن إلى ساعات لإيجاد السرعة، ثم نستخدم السرعة نفسها مع المسافة الجديدة.",
      steps: [
        {
          title: "تحويل الزمن",
          body: "$t_1 = \\dfrac{24}{60} = 0.4\\,\\text{h}$",
        },
        {
          title: "السرعة الثابتة",
          body: "$v = \\dfrac{1.8}{0.4} = 4.5\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "الزمن للمسافة الجديدة",
          body: "$t_2 = \\dfrac{d_2}{v} = \\dfrac{1.2}{4.5} \\approx 0.2667\\,\\text{h} \\approx 16\\,\\text{min}$",
        },
      ],
      answer: { label: "السرعة والزمن", tex: "v = 4.5\\,\\text{km}\\cdot\\text{h}^{-1},\\quad t_2 = 16\\,\\text{min}", note: "يمكن التحقق: $4.5\\,\\text{km}\\cdot\\text{h}^{-1} \\times \\frac{16}{60}\\,\\text{h} = 1.2\\,\\text{km}$." },
      teacherNote: "يمكن حل الشق الثاني بالتناسب أيضًا: إذا قطع 1.8 km خلال 24 min، فإن 1.2 km تحتاج 16 min. شجّع الطالب على استخدام طريقتين ثم التحقق من الجواب.",
    },
  },
  {
    id: "m7",
    number: 7,
    title: "متزلج على الممر",
    emoji: "🛹",
    level: "متوسط",
    topic: "السرعة الوسطية لمرحلتين",
    prompt: [
      "قطع متزلج $100\\,\\text{m}$ خلال $20\\,\\text{s}$، ثم $150\\,\\text{m}$ خلال $30\\,\\text{s}$ على الممر نفسه.",
      "احسب سرعته الوسطية للرحلة كاملة، ثم المسافة التي يقطعها في دقيقتين إذا حافظ على هذه السرعة الوسطية.",
    ],
    givens: [
      { label: "المرحلة الأولى", value: "$d_1 = 100\\,\\text{m},\\ t_1 = 20\\,\\text{s}$" },
      { label: "المرحلة الثانية", value: "$d_2 = 150\\,\\text{m},\\ t_2 = 30\\,\\text{s}$" },
      { label: "الزمن المطلوب", value: "$t = 2\\,\\text{min}$" },
    ],
    questions: ["السرعة الوسطية", "المسافة في دقيقتين"],
    figure: {
      kind: "roundtrip",
      totalDistance: "100 m + 150 m",
      time: "20 s + 30 s",
      place: "ممر المتزلجين",
      icon: "skater",
    },
    solution: {
      idea: "السرعة الوسطية للرحلة = مجموع المسافات ÷ مجموع الأزمنة، وليست معدّل السرعتين.",
      steps: [
        {
          title: "المسافة الكلية والزمن الكلي",
          body: "$d = 100 + 150 = 250\\,\\text{m}$، $t = 20 + 30 = 50\\,\\text{s}$",
        },
        {
          title: "السرعة الوسطية",
          body: "$v = \\dfrac{250}{50} = 5\\,\\text{m}\\cdot\\text{s}^{-1}$",
        },
        {
          title: "المسافة في دقيقتين",
          body: "$t = 2 \\times 60 = 120\\,\\text{s} \\Rightarrow d = v\\,t = 5 \\times 120 = 600\\,\\text{m}$",
        },
      ],
      answer: { label: "النتائج", tex: "v_{\\text{avg}} = 5\\,\\text{m}\\cdot\\text{s}^{-1},\\quad d = 600\\,\\text{m}", note: "لو حسبنا معدّل السرعتين لكان مختلفًا؛ القانون يعتمد على المسافة الكلية والزمن الكلي." },
      teacherNote: "مسألة مناسبة لمناقشة الخطأ الشائع: متوسط $5\,\text{m}\cdot\text{s}^{-1}$ و$5\,\text{m}\cdot\text{s}^{-1}$ هنا يساوي 5، ولكن في المسألة التالية سيتغيّر المفهوم.",
    },
  },
  {
    id: "m8",
    number: 8,
    title: "سيارة أجرة في ساعة الذروة",
    emoji: "🚕",
    level: "تحدٍّ",
    topic: "السرعة الوسطية لرحلتين",
    prompt: [
      "قطعت سيارة أجرة أول $10\\,\\text{km}$ خلال $15\\,\\text{min}$، ثم $18\\,\\text{km}$ خلال $15\\,\\text{min}$ أخرى في ازدحام أقل.",
      "احسب المسافة الكلية، والزمن الكلي، والسرعة الوسطية للرحلة كاملة. قارن الناتج بمعدّل السرعتين.",
    ],
    givens: [
      { label: "المرحلة الأولى", value: "$d_1 = 10\\,\\text{km},\\ t_1 = 15\\,\\text{min}$" },
      { label: "المرحلة الثانية", value: "$d_2 = 18\\,\\text{km},\\ t_2 = 15\\,\\text{min}$" },
    ],
    questions: ["المسافة الكلية", "الزمن الكلي", "السرعة الوسطية للرحلة كاملة"],
    figure: {
      kind: "journey",
      icon: "taxi",
      distance: "10 km + 18 km",
      time: "15 min + 15 min",
      place: "وسط المدينة",
      tone: "teal",
    },
    solution: {
      idea: "نجمع المسافات والأزمنة أولًا، ثم نقسم المسافة الكلية على الزمن الكلي.",
      steps: [
        {
          title: "المسافة الكلية",
          body: "$d = 10 + 18 = 28\\,\\text{km}$",
        },
        {
          title: "الزمن الكلي بالساعات",
          body: "$t = 15 + 15 = 30\\,\\text{min} = 0.5\\,\\text{h}$",
        },
        {
          title: "السرعة الوسطية",
          body: "$v_{\\text{avg}} = \\dfrac{28}{0.5} = 56\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "المقارنة مع معدّل السرعتين",
          body: "سرعة المرحلة الأولى: $10/0.25 = 40\\,\\text{km}\\cdot\\text{h}^{-1}$، والثانية: $18/0.25 = 72\\,\\text{km}\\cdot\\text{h}^{-1}$، ومعدّلهما $56\\,\\text{km}\\cdot\\text{h}^{-1}$ هنا متساوٍ لأن الزمنين متساويان.",
        },
      ],
      answer: { label: "السرعة الوسطية", tex: "v_{\\text{avg}} = \\dfrac{28}{0.5} = 56\\,\\text{km}\\cdot\\text{h}^{-1}", note: "السرعة الوسطية هي مسافة كاملة على زمن كامل، وليست دائمًا معدّل السرعتين." },
      teacherNote: "مثال جيد لتوضيح أن تساوي الأزمنة يجعل معدّل السرعتين مساويًا للسرعة الوسطية، بينما لا يصح ذلك عند اختلاف الأزمنة.",
    },
  },
  {
    id: "m9",
    number: 9,
    title: "قراءة رحلة عائلية بيانيًا",
    emoji: "📈",
    level: "تحدٍّ",
    topic: "تحليل الخط البياني للمسافة والزمن",
    prompt: [
      "يمثّل الخط البياني رحلة عائلية: تسير السيارة من $d = 0$ إلى $d = 120\\,\\text{km}$ خلال ساعتين، ثم تتوقف ساعة للاستراحة، ثم تصل إلى $210\\,\\text{km}$ عند الساعة الرابعة.",
      "احسب السرعة الوسطية للرحلة كاملة، ثم سرعة المرحلة الأخيرة، وحدّد أي مرحلتين كانت أسرع.",
    ],
    givens: [
      { label: "بعد أول ساعتين", value: "$120\\,\\text{km}$" },
      { label: "مدة الاستراحة", value: "$1\\,\\text{h}$" },
      { label: "الموقع النهائي", value: "$210\\,\\text{km}$ عند $t = 4\\,\\text{h}$" },
    ],
    questions: ["السرعة الوسطية للرحلة كاملة", "سرعة المرحلة الأخيرة", "مقارنة المرحلتين"],
    figure: {
      kind: "graph",
      distanceUnit: "km",
      timeUnit: "h",
      points: [
        { x: 0, y: 0, label: "0" },
        { x: 2, y: 120, label: "120" },
        { x: 3, y: 120, label: "استراحة" },
        { x: 4, y: 210, label: "210" },
      ],
      segments: "stop-then-go",
    },
    solution: {
      idea: "الخط المائل يعني حركة، والخط الأفقي يعني توقفًا. السرعة هي ميل المقطع المائل، والسرعة الوسطية للرحلة كلها هي الميل العام.",
      steps: [
        {
          title: "السرعة الوسطية للرحلة كاملة",
          body: "$v_{\\text{avg}} = \\dfrac{d_{\\text{total}}}{t_{\\text{total}}} = \\dfrac{210}{4} = 52.5\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "سرعة المرحلة الأولى",
          body: "$v_1 = \\dfrac{120 - 0}{2 - 0} = 60\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "سرعة المرحلة الأخيرة",
          body: "$v_2 = \\dfrac{210 - 120}{4 - 3} = \\dfrac{90}{1} = 90\\,\\text{km}\\cdot\\text{h}^{-1}$",
        },
        {
          title: "المقارنة",
          body: "المرحلة الأخيرة أسرع من الأولى بفرق $90 - 60 = 30\\,\\text{km}\\cdot\\text{h}^{-1}$.",
        },
      ],
      answer: {
        label: "النتائج",
        tex: "v_{\\text{avg}} = 52.5\\,\\text{km}\\cdot\\text{h}^{-1},\\quad v_1 = 60\\,\\text{km}\\cdot\\text{h}^{-1},\\quad v_2 = 90\\,\\text{km}\\cdot\\text{h}^{-1}",
        note: "الخط الأفقي بين $t = 2$ و$t = 3$ يعني أن المسافة لم تتغير، فالسيارة متوقفة.",
      },
      teacherNote: "اربط بين شكل المقطع وميله: مقطع أفقي = توقف، مقطع أكثر ميلًا = سرعة أكبر. ذكّر أن السرعة الوسطية للرحلة ليست متوسطًا حسابيًا للسرعات.",
    },
  },
  {
    id: "m10",
    number: 10,
    title: "صدى الصوت في الوادي",
    emoji: "🏔️",
    level: "تحدٍّ",
    topic: "الصدى والمسافة ذهابًا وإيابًا",
    prompt: [
      "وقف رامي عند حافة وادٍ وأطلق صوتًا قصيرًا، فسمع صداه بعد $1.4\\,\\text{s}$. إذا كانت سرعة الصوت في الهواء $340\\,\\text{m}\\cdot\\text{s}^{-1}$،",
      "احسب المسافة الكلية التي قطعها الصوت ذهابًا وإيابًا، ثم بُعد الجرف الصخري عن رامي.",
    ],
    givens: [
      { label: "زمن الصدى", value: "$t = 1.4\\,\\text{s}$" },
      { label: "سرعة الصوت", value: "$v = 340\\,\\text{m}\\cdot\\text{s}^{-1}$" },
    ],
    questions: ["المسافة الكلية للصوت", "بُعد الجرف"],
    figure: { kind: "echo", time: "1.4 s", speed: "340 m.s⁻¹" },
    solution: {
      idea: "الصوت يقطع المسافة مرّتين: إلى الجرف ثم عائدًا. لذلك نقسم المسافة الكلية على 2.",
      steps: [
        {
          title: "المسافة الكلية",
          body: "$d = v\\,t = 340 \\times 1.4 = 476\\,\\text{m}$",
        },
        {
          title: "بُعد الجرف",
          body: "$d_{\\text{cliff}} = \\dfrac{476}{2} = 238\\,\\text{m}$",
        },
      ],
      answer: { label: "النتائج", tex: "d_{\\text{total}} = 476\\,\\text{m},\\quad d_{\\text{cliff}} = 238\\,\\text{m}", note: "لا تنسَ القسمة على 2؛ زمن الصدى يشمل رحلتي الصوت." },
      teacherNote: "أهم خطأ هنا هو استخدام الزمن كاملًا مع مسافة واحدة. اربط الحل برسم شعاعي يوضح مسار الصوت ذهابًا وإيابًا.",
    },
  },
];

const forceProblems: Problem[] = [
  {
    id: "f1",
    number: 1,
    title: "التفاحة والربيعة",
    emoji: "🍎",
    level: "تأسيسي",
    topic: "حساب الثقل من الكتلة",
    prompt: [
      "عُلّقت تفاحة كتلتها $150\\,\\text{g}$ في ربيعة. خُذ تسارع الجاذبية $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب ثقل التفاحة بالنيوتن، بعد تحويل الكتلة إلى الكيلوغرام.",
    ],
    givens: [
      { label: "الكتلة", value: "$m = 150\\,\\text{g}$" },
      { label: "تسارع الجاذبية", value: "$g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["ثقل التفاحة بالنيوتن"],
    figure: {
      kind: "hangingScale",
      object: "apple",
      mass: "150 g",
      weight: "? N",
      g: "10 N.kg⁻¹",
    },
    solution: {
      idea: "قانون الثقل w = m g لا يعمل إلا عندما تكون الكتلة بالكيلوغرام.",
      steps: [
        {
          title: "تحويل الكتلة",
          body: "$m = 150\\,\\text{g} = \\dfrac{150}{1000} = 0.15\\,\\text{kg}$",
        },
        {
          title: "تطبيق القانون",
          body: "$w = m\\,g = 0.15 \\times 10 = 1.5\\,\\text{N}$",
        },
      ],
      answer: { label: "الثقل", tex: "w = 1.5\\,\\text{N}", note: "الكتلة $150\\,\\text{g}$ ثابتة في أي مكان، أما الثقل فيتغير بتغيّر $g$." },
      teacherNote: "ابدأ دائمًا بخطوة التحويل؛ استخدام الكتلة بالغرام مباشرة يعطي نتيجة أصغر 1000 مرة.",
    },
  },
  {
    id: "f2",
    number: 2,
    title: "رائد الفضاء بين الأرض والقمر",
    emoji: "🧑‍🚀",
    level: "متوسط",
    topic: "الثقل في مكانين مختلفين",
    prompt: [
      "كتلة رائد فضاء مع بدلته $90\\,\\text{kg}$. على الأرض $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$، وعلى القمر $g = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب ثقله على الأرض وثقله على القمر، ثم الفرق بينهما.",
    ],
    givens: [
      { label: "الكتلة", value: "$m = 90\\,\\text{kg}$" },
      { label: "الجاذبية الأرضية", value: "$g_{\\oplus} = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
      { label: "جاذبية القمر", value: "$g_{\\text{moon}} = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["الثقل على الأرض", "الثقل على القمر", "الفرق بينهما"],
    figure: {
      kind: "earthMoon",
      mass: "90 kg",
      earthWeight: "900 N",
      moonWeight: "145.8 N",
      earthG: "10 N.kg⁻¹",
      moonG: "1.62 N.kg⁻¹",
    },
    solution: {
      idea: "الكتلة نفسها لا تتغير، لكن نضربها في قيمة g الخاصة بكل مكان.",
      steps: [
        {
          title: "الثقل على الأرض",
          body: "$w_{\\oplus} = m\\,g_{\\oplus} = 90 \\times 10 = 900\\,\\text{N}$",
        },
        {
          title: "الثقل على القمر",
          body: "$w_{\\text{moon}} = m\\,g_{\\text{moon}} = 90 \\times 1.62 = 145.8\\,\\text{N}$",
        },
        {
          title: "الفرق",
          body: "$900 - 145.8 = 754.2\\,\\text{N}$",
        },
      ],
      answer: {
        label: "الثقلان والفرق",
        tex: "w_{\\oplus} = 900\\,\\text{N},\\quad w_{\\text{moon}} = 145.8\\,\\text{N},\\quad \\Delta w = 754.2\\,\\text{N}",
        note: "الكتلة بقيت $90\\,\\text{kg}$؛ ما تغيّر هو ثقل الجسم فقط.",
      },
      teacherNote: "استخدم هذه المسألة لكسر الاعتقاد بأن الكتلة تتغيّر على القمر. اطلب من الطالب تعليل بقاء الكتلة.",
    },
  },
  {
    id: "f3",
    number: 3,
    title: "حقيبة السوق",
    emoji: "🛍️",
    level: "تأسيسي",
    topic: "استخراج الكتلة من الثقل",
    prompt: [
      "أظهر ميزان معلّق أن ثقل حقيبة مشتريات $120\\,\\text{N}$ على الأرض حيث $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب كتلة الحقيبة، ثم ثقلها على سطح القمر حيث $g = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
    ],
    givens: [
      { label: "الثقل على الأرض", value: "$w = 120\\,\\text{N}$" },
      { label: "تسارع الجاذبية", value: "$g_{\\oplus} = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
      { label: "جاذبية القمر", value: "$g_{\\text{moon}} = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["كتلة الحقيبة", "ثقلها على القمر"],
    figure: {
      kind: "hangingScale",
      object: "bag",
      mass: "?",
      weight: "120 N",
      g: "10 N.kg⁻¹",
    },
    solution: {
      idea: "من w = m g نستخرج m بقسمة الثقل على g، ثم نستخدم الكتلة نفسها على القمر.",
      steps: [
        {
          title: "حساب الكتلة",
          body: "$m = \\dfrac{w}{g} = \\dfrac{120}{10} = 12\\,\\text{kg}$",
        },
        {
          title: "الثقل على القمر",
          body: "$w_{\\text{moon}} = m\\,g_{\\text{moon}} = 12 \\times 1.62 = 19.44\\,\\text{N}$",
        },
      ],
      answer: { label: "الكتلة والثقل", tex: "m = 12\\,\\text{kg},\\quad w_{\\text{moon}} = 19.44\\,\\text{N}", note: "الثقل على القمر يعادل نحو سُدس الثقل على الأرض." },
      teacherNote: "تأكد من أن الطالب يعكس القانون بشكل صحيح: القسمة على g وليس الضرب فيها.",
    },
  },
  {
    id: "f4",
    number: 4,
    title: "عربة مخبز",
    emoji: "🧺",
    level: "متوسط",
    topic: "ثقل مجموعة أجسام",
    prompt: [
      "في مخبز عربة كتلتها $8\\,\\text{kg}$، حملت عليها $3$ صناديق، كتلة كل صندوق $4.5\\,\\text{kg}$. خُذ $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب الكتلة الكلية للعربة وحمولتها، ثم ثقلها الكلي بالنيوتن.",
    ],
    givens: [
      { label: "كتلة العربة", value: "$m_{\\text{cart}} = 8\\,\\text{kg}$" },
      { label: "الصناديق", value: "$3 \\times 4.5\\,\\text{kg}$" },
      { label: "تسارع الجاذبية", value: "$g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["الكتلة الكلية", "الثقل الكلي"],
    figure: {
      kind: "cargo",
      parts: [
        { label: "العربة", mass: "8 kg" },
        { label: "3 صناديق", mass: "3 × 4.5 kg" },
      ],
      totalMass: "? kg",
      totalWeight: "? N",
    },
    solution: {
      idea: "نجمع الكتل أولًا، ثم نضرب الكتلة الكلية في g مرة واحدة.",
      steps: [
        {
          title: "كتلة الصناديق",
          body: "$m_{\\text{boxes}} = 3 \\times 4.5 = 13.5\\,\\text{kg}$",
        },
        {
          title: "الكتلة الكلية",
          body: "$m = 8 + 13.5 = 21.5\\,\\text{kg}$",
        },
        {
          title: "الثقل الكلي",
          body: "$w = m\\,g = 21.5 \\times 10 = 215\\,\\text{N}$",
        },
      ],
      answer: { label: "الكتلة والثقل", tex: "m = 21.5\\,\\text{kg},\\quad w = 215\\,\\text{N}", note: "جمع الكتل قبل الضرب في g يمنع تراكم أخطاء التقريب." },
      teacherNote: "اطلب من الطالب حلًا بديلًا: حساب ثقل العربة وثقل الصناديق ثم الجمع، ومقارنة النتيجتين.",
    },
  },
  {
    id: "f5",
    number: 5,
    title: "ورشة مقياس الرسم",
    emoji: "📐",
    level: "متوسط",
    topic: "طول السهم ومقياس الرسم",
    prompt: [
      "اتُّفق على مقياس رسم: $1\\,\\text{cm} \\leftrightarrow 15\\,\\text{N}$.",
      "ما طول السهم الذي يمثّل كلًّا من القوى الآتية: $60\\,\\text{N}$، $90\\,\\text{N}$، $45\\,\\text{N}$؟ ثم اجمع أطوال الأسهم الثلاثة.",
    ],
    givens: [
      { label: "مقياس الرسم", value: "$1\\,\\text{cm} = 15\\,\\text{N}$" },
      { label: "القوى", value: "$60\\,\\text{N},\\ 90\\,\\text{N},\\ 45\\,\\text{N}$" },
    ],
    questions: ["طول السهم لكل قوة", "مجموع أطوال الأسهم"],
    figure: {
      kind: "forceScale",
      scale: "1 cm = 15 N",
      arrows: [
        { label: "قوة A", force: "60 N", length: "? cm" },
        { label: "قوة B", force: "90 N", length: "? cm" },
        { label: "قوة C", force: "45 N", length: "? cm" },
      ],
    },
    solution: {
      idea: "نقسم شدة القوة على العدد الذي يمثّله السنتيمتر الواحد.",
      steps: [
        {
          title: "طول سهم القوة الأولى",
          body: "$\\ell_A = \\dfrac{60}{15} = 4\\,\\text{cm}$",
        },
        {
          title: "طول سهم القوة الثانية",
          body: "$\\ell_B = \\dfrac{90}{15} = 6\\,\\text{cm}$",
        },
        {
          title: "طول سهم القوة الثالثة",
          body: "$\\ell_C = \\dfrac{45}{15} = 3\\,\\text{cm}$",
        },
        {
          title: "مجموع الأطوال",
          body: "$4 + 6 + 3 = 13\\,\\text{cm}$",
        },
      ],
      answer: { label: "الأطوال", tex: "4\\,\\text{cm},\\quad 6\\,\\text{cm},\\quad 3\\,\\text{cm};\\qquad \\ell_{\\text{total}} = 13\\,\\text{cm}", note: "طول السهم يتناسب طردًا مع شدة القوة." },
      teacherNote: "ملاحظة: جمع أطوال الأسهم لا يعني جمع القوى إلا إذا كانت الأسهم على الحامل نفسه بالاتجاه نفسه؛ هنا المطلوب مجموع أطوال الرسم فقط.",
    },
  },
  {
    id: "f6",
    number: 6,
    title: "قراءة سهم قوة",
    emoji: "🧲",
    level: "تأسيسي",
    topic: "من الطول إلى الشدة والعكس",
    prompt: [
      "رُسمت قوة على ورقة بمقياس $1\\,\\text{cm} \\leftrightarrow 25\\,\\text{N}$، فكان طول سهمها $7\\,\\text{cm}$.",
      "احسب شدة هذه القوة. ثم احسب طول السهم الذي يمثّل قوة أخرى شدتها $100\\,\\text{N}$ بالمقياس نفسه.",
    ],
    givens: [
      { label: "طول السهم", value: "$\\ell_1 = 7\\,\\text{cm}$" },
      { label: "مقياس الرسم", value: "$1\\,\\text{cm} = 25\\,\\text{N}$" },
      { label: "القوة الثانية", value: "$F_2 = 100\\,\\text{N}$" },
    ],
    questions: ["شدة القوة الأولى", "طول سهم القوة الثانية"],
    figure: {
      kind: "forceScale",
      scale: "1 cm = 25 N",
      arrows: [
        { label: "قوة مرسومة", force: "? N", length: "7 cm" },
        { label: "قوة أخرى", force: "100 N", length: "? cm" },
      ],
    },
    solution: {
      idea: "نضرب الطول في قيمة المقياس للانتقال إلى الشدة، ونقسم الشدة على المقياس للانتقال إلى الطول.",
      steps: [
        {
          title: "شدة القوة الأولى",
          body: "$F_1 = 7 \\times 25 = 175\\,\\text{N}$",
        },
        {
          title: "طول سهم القوة الثانية",
          body: "$\\ell_2 = \\dfrac{100}{25} = 4\\,\\text{cm}$",
        },
      ],
      answer: { label: "الشدة والطول", tex: "F_1 = 175\\,\\text{N},\\quad \\ell_2 = 4\\,\\text{cm}", note: "اتجاه السهم يمثّل جهة القوة، وطوله يمثّل شدتها." },
      teacherNote: "اسأل الطالب عن العنصرين الآخرين اللذين لا يظهران في الرسم الرقمي: نقطة التأثير والحامل، وكيف يُحدّدان.",
    },
  },
  {
    id: "f7",
    number: 7,
    title: "جاذبية غامضة على قمر",
    emoji: "🌒",
    level: "تحدٍّ",
    topic: "إيجاد g من الثقل والكتلة",
    prompt: [
      "على قمرٍ بعيد، كانت كتلة مسبار $60\\,\\text{kg}$ وثقلُه هناك $96\\,\\text{N}$.",
      "احسب تسارع الجاذبية على ذلك القمر، ثم ثقل المسبار على الأرض إذا كانت $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$، والفرق بين الثقلين.",
    ],
    givens: [
      { label: "كتلة المسبار", value: "$m = 60\\,\\text{kg}$" },
      { label: "الثقل على القمر", value: "$w_{\\text{moon}} = 96\\,\\text{N}$" },
      { label: "جاذبية الأرض", value: "$g_{\\oplus} = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["تسارع الجاذبية على القمر", "ثقل المسبار على الأرض", "الفرق بين الثقلين"],
    figure: {
      kind: "earthMoon",
      mass: "60 kg",
      earthWeight: "? N",
      moonWeight: "96 N",
      earthG: "10 N.kg⁻¹",
      moonG: "? N.kg⁻¹",
    },
    solution: {
      idea: "g = w/m، ثم نستخدم الكتلة نفسها على الأرض.",
      steps: [
        {
          title: "تسارع الجاذبية على القمر",
          body: "$g_{\\text{moon}} = \\dfrac{w_{\\text{moon}}}{m} = \\dfrac{96}{60} = 1.6\\,\\text{N}\\cdot\\text{kg}^{-1}$",
        },
        {
          title: "الثقل على الأرض",
          body: "$w_{\\oplus} = m\\,g_{\\oplus} = 60 \\times 10 = 600\\,\\text{N}$",
        },
        {
          title: "الفرق بين الثقلين",
          body: "$600 - 96 = 504\\,\\text{N}$",
        },
      ],
      answer: {
        label: "النتائج",
        tex: "g_{\\text{moon}} = 1.6\\,\\text{N}\\cdot\\text{kg}^{-1},\\quad w_{\\oplus} = 600\\,\\text{N},\\quad \\Delta w = 504\\,\\text{N}",
        note: "الكتلة $60\\,\\text{kg}$ ثابتة في المكانين.",
      },
      teacherNote: "مسألة عكسية تنمّي التفكير الجبري. تحقق من الوحدات: $\text{N} \div \text{kg} = \text{N}\cdot\text{kg}^{-1}$.",
    },
  },
  {
    id: "f8",
    number: 8,
    title: "كيس أرز بين الأرض والقمر",
    emoji: "🌾",
    level: "تحدٍّ",
    topic: "حسابات متسلسلة بالكتلة والثقل",
    prompt: [
      "ثقل كيس أرز على الأرض $450\\,\\text{N}$ حيث $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$، ويراد نقله إلى قاعدة قمرية حيث $g = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب كتلة كيس الأرز، ثم ثقله على القاعدة القمرية، ثم الفرق بين الثقلين.",
    ],
    givens: [
      { label: "الثقل على الأرض", value: "$w_{\\oplus} = 450\\,\\text{N}$" },
      { label: "جاذبية الأرض", value: "$g_{\\oplus} = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
      { label: "جاذبية القمر", value: "$g_{\\text{moon}} = 1.62\\,\\text{N}\\cdot\\text{kg}^{-1}$" },
    ],
    questions: ["كتلة الكيس", "ثقل الكيس على القمر", "الفرق بين الثقلين"],
    figure: {
      kind: "hangingScale",
      object: "rice",
      mass: "? kg",
      weight: "450 N",
      g: "10 N.kg⁻¹",
    },
    solution: {
      idea: "نستخرج الكتلة من ثقل الأرض ثم نعيد استخدامها مع جاذبية القمر.",
      steps: [
        {
          title: "الكتلة",
          body: "$m = \\dfrac{w_{\\oplus}}{g_{\\oplus}} = \\dfrac{450}{10} = 45\\,\\text{kg}$",
        },
        {
          title: "الثقل على القمر",
          body: "$w_{\\text{moon}} = 45 \\times 1.62 = 72.9\\,\\text{N}$",
        },
        {
          title: "الفرق",
          body: "$450 - 72.9 = 377.1\\,\\text{N}$",
        },
      ],
      answer: { label: "النتائج", tex: "m = 45\\,\\text{kg},\\quad w_{\\text{moon}} = 72.9\\,\\text{N},\\quad \\Delta w = 377.1\\,\\text{N}", note: "لاحظ أن الكتلة ظلت $45\\,\\text{kg}$ بينما تقلّص الثقل." },
      teacherNote: "تأكد من أن الطالب لا يضرب 450 في 1.62 مباشرة؛ هذا خطأ في ترتيب التحويل.",
    },
  },
  {
    id: "f9",
    number: 9,
    title: "عربة نقل على جسر خشبي",
    emoji: "🌉",
    level: "تحدٍّ",
    topic: "الثقل والحمولة الإضافية",
    prompt: [
      "عربة كتلتها $25\\,\\text{kg}$ تحمل $3$ صناديق، كتلة كل صندوق $12\\,\\text{kg}$. خُذ $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب الثقل الكلي للعربة والحمولة. إذا صُمّم الجسر ليتحمّل $700\\,\\text{N}$، فما أقصى كتلة إضافية يمكن تحميلها قبل الوصول إلى الحد؟",
    ],
    givens: [
      { label: "كتلة العربة", value: "$m_{\\text{wagon}} = 25\\,\\text{kg}$" },
      { label: "الحمولة", value: "$3 \\times 12\\,\\text{kg}$" },
      { label: "حد الجسر", value: "$w_{\\max} = 700\\,\\text{N}$" },
    ],
    questions: ["الثقل الكلي للعربة", "أقصى كتلة إضافية آمنة"],
    figure: {
      kind: "cargo",
      parts: [
        { label: "العربة", mass: "25 kg" },
        { label: "3 صناديق", mass: "3 × 12 kg" },
      ],
      totalMass: "? kg",
      totalWeight: "? N",
      limit: "حد الجسر 700 N",
    },
    solution: {
      idea: "نحسب الكتلة الكلية ثم الثقل، ثم نقارن بالحد الأقصى لنجد الفائض الممكن.",
      steps: [
        {
          title: "الكتلة الكلية",
          body: "$m = 25 + 3 \\times 12 = 25 + 36 = 61\\,\\text{kg}$",
        },
        {
          title: "الثقل الكلي",
          body: "$w = 61 \\times 10 = 610\\,\\text{N}$",
        },
        {
          title: "الهامش حتى الحد الأقصى",
          body: "$w_{\\text{extra}} = 700 - 610 = 90\\,\\text{N}$",
        },
        {
          title: "أقصى كتلة إضافية",
          body: "$m_{\\text{extra}} = \\dfrac{90}{10} = 9\\,\\text{kg}$",
        },
      ],
      answer: {
        label: "الثقل والحمولة الإضافية",
        tex: "w_{\\text{total}} = 610\\,\\text{N},\\quad m_{\\text{extra,max}} = 9\\,\\text{kg}",
        note: "بعد إضافة 9 kg يصبح الثقل 700 N تمامًا، فلا يُنصح بتجاوزها.",
      },
      teacherNote: "اربط النتيجة بالسلامة الهندسية، مع توضيح أن الحد هنا للثقل وليس للكتلة، وهذا سبب قسمة 90 على 10.",
    },
  },
  {
    id: "f10",
    number: 10,
    title: "طاولة وكرسي في الورشة",
    emoji: "🪑",
    level: "متوسط",
    topic: "مسألة متكاملة: الثقل ومقياس الرسم",
    prompt: [
      "في ورشة نجارة طاولة كتلتها $18\\,\\text{kg}$ وكرسي كتلته $6\\,\\text{kg}$. خُذ $g = 10\\,\\text{N}\\cdot\\text{kg}^{-1}$.",
      "احسب الثقل الكلي للأثاث، ثم طول السهم الذي يمثّله بمقياس $1\\,\\text{cm} \\leftrightarrow 30\\,\\text{N}$.",
    ],
    givens: [
      { label: "كتلة الطاولة", value: "$m_1 = 18\\,\\text{kg}$" },
      { label: "كتلة الكرسي", value: "$m_2 = 6\\,\\text{kg}$" },
      { label: "مقياس الرسم", value: "$1\\,\\text{cm} = 30\\,\\text{N}$" },
    ],
    questions: ["الثقل الكلي", "طول السهم على مقياس الرسم"],
    figure: {
      kind: "forceScale",
      scale: "1 cm = 30 N",
      arrows: [{ label: "ثقل الطاولة والكرسي", force: "? N", length: "? cm" }],
    },
    solution: {
      idea: "نجمع الكتلتين، نضربهما في g، ثم نستخدم مقياس الرسم لإيجاد طول السهم.",
      steps: [
        {
          title: "الكتلة الكلية",
          body: "$m = 18 + 6 = 24\\,\\text{kg}$",
        },
        {
          title: "الثقل الكلي",
          body: "$w = 24 \\times 10 = 240\\,\\text{N}$",
        },
        {
          title: "طول السهم",
          body: "$\\ell = \\dfrac{240}{30} = 8\\,\\text{cm}$",
        },
      ],
      answer: { label: "الثقل وطول السهم", tex: "w = 240\\,\\text{N},\\quad \\ell = 8\\,\\text{cm}", note: "السهم يبدأ من نقطة التأثير ويتجه نحو الأسفل؛ طوله 8 cm يمثّل 240 N." },
      teacherNote: "مسألة ختامية تربط قانون الثقل بمقياس الرسم. ذكّر بأن الجهة نحو الأسفل لأن الثقل قوة جذب أرضية.",
    },
  },
];

export const problemsByLesson: Record<LessonId, Problem[]> = {
  motion: motionProblems,
  force: forceProblems,
};

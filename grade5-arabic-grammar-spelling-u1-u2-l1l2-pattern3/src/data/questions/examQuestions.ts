import type { Question, ExamData } from "./types";

/**
 * اختبار أصلي بالكامل: جميع الجمل والكلمات والسياقات من تأليف جديد.
 * لم تُنسخ أي جملة أو كلمة مستهدفة من الكتاب المدرسي أو من المستودع المرجعي.
 * القواعد المختبرة فقط هي القواعد المقررة في الدروس الخمسة المحددة.
 */

const QUESTIONS: Question[] = [
  // ============ الدرس 1: السمكة الذهبية (ص 8-9) ============
  {
    id: "q1", number: 1, lessonId: "u1l1", category: "grammar",
    instruction: "صنّف كل جملة: هل هي جملة اسمية أم جملة فعلية؟ انظر إلى الكلمة الأولى في الجملة.",
    prompt: "اقرأ الجمل الآتية ثم اختر نوع كل جملة.",
    subparts: [
      { id: "q1a", label: "أ", type: "select", prompt: "«الحديقةُ مليئةٌ بالورودِ.»", options: ["جملة اسمية", "جملة فعلية"], correctAnswer: "جملة اسمية", maxMarks: 2, skill: "تمييز الجملة الاسمية من الفعلية بالنظر إلى الكلمة الأولى", difficulty: "basic", explanation: "تبدأ الجملة باسم «الحديقةُ» فهي جملة اسمية." },
      { id: "q1b", label: "ب", type: "select", prompt: "«تروي سارةُ الأزهارَ كلَّ صباحٍ.»", options: ["جملة اسمية", "جملة فعلية"], correctAnswer: "جملة فعلية", maxMarks: 1, skill: "تمييز الجملة الاسمية من الفعلية بالنظر إلى الكلمة الأولى", difficulty: "basic", explanation: "تبدأ الجملة بفعل «تروي» فهي جملة فعلية." },
      { id: "q1c", label: "ج", type: "select", prompt: "«الروبوتُ الصغيرُ يتحركُ بسرعةٍ.»", options: ["جملة اسمية", "جملة فعلية"], correctAnswer: "جملة اسمية", maxMarks: 1, skill: "تمييز الجملة الاسمية من الفعلية بالنظر إلى الكلمة الأولى", difficulty: "intermediate", explanation: "تبدأ الجملة باسم «الروبوتُ» رغم وجود فعل بعدها، فهي جملة اسمية." },
    ],
  },
  {
    id: "q2", number: 2, lessonId: "u1l1", category: "grammar",
    instruction: "اختر الإجابة الصحيحة ثم أكمل الفراغ بجملة اسمية من عندك.",
    prompt: "أ) اختر الجملة التي تبدأ بفعل. ب) أكمل الفراغ.",
    subparts: [
      { id: "q2a", label: "أ", type: "mcq", prompt: "أيُّ جملةٍ تبدأ بفعلٍ؟", options: ["المكتبةُ نظيفةٌ.", "غرسَتْ مريمُ شجرةً في الحديقةِ.", "الجوُّ جميلٌ اليومَ.", "الفراشةُ ملونةٌ."], correctAnswer: "غرسَتْ مريمُ شجرةً في الحديقةِ.", maxMarks: 2, skill: "التعرف على الجملة الفعلية من الكلمة الأولى", difficulty: "basic", explanation: "«غرسَتْ» فعل جاء في أول الجملة فالجملة فعلية، والباقي يبدأ بأسماء.", misconception: "الخلط بين وجود فعل في الجملة وبين البدء بفعل." },
      { id: "q2b", label: "ب", type: "fill", prompt: "أكمل بجملة اسمية تبدأ باسم: «____ جميلةٌ في فصلِ الربيعِ.»", correctAnswer: "الحديقةُ", acceptedAnswers: ["الحديقة", "الوردة", "الشجرة", "الفراشة", "المدرسة", "اللوحة", "السماء"], maxMarks: 1, skill: "إنتاج جملة اسمية تبدأ باسم", difficulty: "intermediate", explanation: "أي اسم مناسب في أول الجملة يجعلها جملة اسمية، مثل: الحديقةُ جميلةٌ.", rubric: "يُقبل أي اسم صحيح في أول الجملة مع خبر مناسب." },
    ],
  },
  {
    id: "q3", number: 3, lessonId: "u1l1", category: "grammar",
    instruction: "حدّد نوع الكلمة الأولى في الجملة ثم اشرح الفرق بين نوعي الجمل.",
    prompt: "أ) حدّد نوع الكلمة الأولى. ب) اشرح بكلماتك الفرق بين الجملة الاسمية والجملة الفعلية.",
    subparts: [
      { id: "q3a", label: "أ", type: "select", prompt: "في جملة «يُساعدُ الفريقُ زميلاتِهِ في المشروعِ» ما نوع الكلمة الأولى؟", options: ["اسم", "فعل"], correctAnswer: "فعل", maxMarks: 2, skill: "التعرف على الكلمة الأولى في الجملة", difficulty: "basic", explanation: "«يُساعدُ» فعل، والجملة تبدأ بفعل فهي جملة فعلية." },
      { id: "q3b", label: "ب", type: "free", prompt: "اشرح بكلماتك: ما الفرق بين الجملة الاسمية والجملة الفعلية؟", correctAnswer: "الجملة الاسمية تبدأ باسم والجملة الفعلية تبدأ بفعل.", maxMarks: 1, skill: "شرح الفرق بين الجملة الاسمية والفعلية", difficulty: "intermediate", explanation: "الجملة الاسمية تبدأ باسم، والجملة الفعلية تبدأ بفعل.", rubric: "درجة واحدة: تُمنح إذا ذكرتِ أن الاسمية تبدأ باسم والفعلية تبدأ بفعل.", keywords: ["اسم", "فعل"], misconception: "الاعتقاد أن نوع الجملة يُحدد بوجود فعل أو اسم في أي موضع." },
    ],
  },
  {
    id: "q4", number: 4, lessonId: "u1l1", category: "spelling",
    instruction: "حدّد نوع الهمزة في أول كل كلمة: همزة قطع أم همزة وصل؟",
    prompt: "اختر نوع الهمزة في كل كلمة.",
    subparts: [
      { id: "q4a", label: "أ", type: "select", prompt: "«أصدقاءُ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة قطع", maxMarks: 2, skill: "التمييز بين همزة القطع وهمزة الوصل", difficulty: "basic", explanation: "«أصدقاء» تُكتب بهمزة قطع تُنطق في أول الكلام وفي وصله." },
      { id: "q4b", label: "ب", type: "select", prompt: "«استخدمْ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة وصل", maxMarks: 1, skill: "التمييز بين همزة القطع وهمزة الوصل", difficulty: "basic", explanation: "«استخدم» أمر فعل سداسي، وتُكتب بهمزة وصل لا تُنطق في الوصل." },
      { id: "q4c", label: "ج", type: "select", prompt: "«أمانةٌ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة قطع", maxMarks: 1, skill: "التمييز بين همزة القطع وهمزة الوصل", difficulty: "intermediate", explanation: "«أمانة» تُكتب بهمزة قطع تُنطق دائمًا." },
    ],
  },
  {
    id: "q5", number: 5, lessonId: "u1l1", category: "spelling",
    instruction: "اختر الكلمة الصحيحة ثم صحّح الكلمة الخاطئة إملائيًا.",
    prompt: "أ) اختر الكلمة التي تُكتب بهمزة قطع. ب) صحّح الكلمة.",
    subparts: [
      { id: "q5a", label: "أ", type: "mcq", prompt: "أيُّ كلمةٍ تُكتب بهمزة قطعٍ؟", options: ["استراح", "أبطال", "ابتسم", "استخدم"], correctAnswer: "أبطال", maxMarks: 2, skill: "التعرف على همزة القطع في كلمات جديدة", difficulty: "intermediate", explanation: "«أبطال» بهمزة قطع، والباقي بهمزة وصل.", misconception: "الخلط بين الألف المهموزة قطعًا ووصلًا في الكلمات المألوفة." },
      { id: "q5b", label: "ب", type: "correct", prompt: "صحّح الكلمة: «احمدُ صديقي المخلصُ.»", correctAnswer: "أحمدُ", acceptedAnswers: ["أحمد", "أحمدُ"], maxMarks: 1, skill: "كتابة همزة القطع فوق الألف عند الفتح", difficulty: "intermediate", explanation: "«أحمد» تُكتب بهمزة قطع فوق الألف لأنها مفتوحة.", strictHamza: true },
    ],
  },
  {
    id: "q6", number: 6, lessonId: "u1l1", category: "spelling",
    instruction: "اختر الإجابة الصحيحة ثم علّل كتابة الهمزة في الكلمة.",
    prompt: "أ) اختر الإجابة الصحيحة. ب) علّل كتابة الهمزة في «أكرمَ».",
    subparts: [
      { id: "q6a", label: "أ", type: "mcq", prompt: "همزة الوصل تُنطق:", options: ["في بداية الكلام فقط ولا تُنطق في وصله", "في بداية الكلام وفي وصله دائمًا", "لا تُنطق أبدًا", "تُنطق في وسط الكلام فقط"], correctAnswer: "في بداية الكلام فقط ولا تُنطق في وصله", maxMarks: 2, skill: "نطق همزة الوصل في أول الكلام دون وصله", difficulty: "basic", explanation: "همزة الوصل تُنطق في أول الكلام ولا تُنطق إذا وُصلت بما قبلها." },
      { id: "q6b", label: "ب", type: "free", prompt: "علّل: لماذا تُكتب الهمزة في «أكرمَ» همزةَ قطعٍ؟", correctAnswer: "لأنها تُنطق في أول الكلام وفي وصله وتُكتب فوق الألف.", maxMarks: 1, skill: "تعليل كتابة همزة القطع", difficulty: "advanced", explanation: "همزة القطع تُنطق دائمًا وتُكتب فوق الألف أو تحتها بحسب حركتها.", rubric: "درجة واحدة: تُمنح لذكر أن الهمزة تُنطق في البدء والوصل.", keywords: ["تُنطق", "قطع"], misconception: "الظن أن كل ألف في أول الكلمة همزة وصل." },
    ],
  },
  // ============ الدرس 2: بالرأي والرأي الآخر (ص 17-20) ============
  {
    id: "q7", number: 7, lessonId: "u1l2", category: "grammar",
    instruction: "اختر المصدر الصحيح من كل مجموعة كلمات.",
    prompt: "المصدر اسم يدل على حدث مجرد من الزمن. اختر المصدر في كل مجموعة.",
    subparts: [
      { id: "q7a", label: "أ", type: "mcq", prompt: "أيُّ كلمةٍ مصدرٌ؟", options: ["ساعدَ", "مساعدة", "يساعدُ", "ساعدْ"], correctAnswer: "مساعدة", maxMarks: 2, skill: "التمييز بين المصدر وفعله", difficulty: "basic", explanation: "«مساعدة» اسم يدل على الحدث مجردًا من الزمن فهو مصدر." },
      { id: "q7b", label: "ب", type: "mcq", prompt: "أيُّ كلمةٍ مصدرٌ؟", options: ["نظّمَ", "ينظمُ", "تنظيم", "نظّمْ"], correctAnswer: "تنظيم", maxMarks: 1, skill: "التمييز بين المصدر وفعله", difficulty: "basic", explanation: "«تنظيم» مصدر يدل على الحدث دون زمن محدد." },
      { id: "q7c", label: "ج", type: "mcq", prompt: "أيُّ كلمةٍ مصدرٌ؟", options: ["سافرَ", "يسافرُ", "سفر", "سافِرْ"], correctAnswer: "سفر", maxMarks: 1, skill: "التمييز بين المصدر وفعله", difficulty: "intermediate", explanation: "«سفر» اسم يدل على الحدث مجردًا من الزمن فهو مصدر." },
    ],
  },
  {
    id: "q8", number: 8, lessonId: "u1l2", category: "grammar",
    instruction: "اختر المصدر المناسب لكل فعل.",
    prompt: "اختر المصدر الذي يناسب الفعل المعطى.",
    subparts: [
      { id: "q8a", label: "أ", type: "select", prompt: "الفعل «سمعَ» مصدره:", options: ["سماع", "سمع", "مسموع", "استماع"], correctAnswer: "سماع", maxMarks: 2, skill: "مطابقة الفعل مع مصدره", difficulty: "intermediate", explanation: "مصدر «سمعَ» هو «سماع»." },
      { id: "q8b", label: "ب", type: "select", prompt: "الفعل «أرسلَ» مصدره:", options: ["إرسال", "رسالة", "مرسل", "أرسل"], correctAnswer: "إرسال", maxMarks: 1, skill: "مطابقة الفعل مع مصدره", difficulty: "advanced", explanation: "مصدر «أرسلَ» هو «إرسال»." },
    ],
  },
  {
    id: "q9", number: 9, lessonId: "u1l2", category: "grammar",
    instruction: "أكمل بالمصدر المناسب ثم اشرح معنى المصدر.",
    prompt: "أ) أكمل الفراغ بالمصدر. ب) اشرح معنى المصدر بكلماتك.",
    subparts: [
      { id: "q9a", label: "أ", type: "fill", prompt: "أكمل بالمصدر: «ساعدَ المعلمُ الطالباتِ ____ في المشروعِ.»", correctAnswer: "مساعدةً", acceptedAnswers: ["مساعدة", "مساعدةً"], maxMarks: 2, skill: "استخدام المصدر في جملة", difficulty: "intermediate", explanation: "المصدر المناسب للفعل «ساعدَ» هو «مساعدة»." },
      { id: "q9b", label: "ب", type: "free", prompt: "اشرح بكلماتك: ما المصدر؟", correctAnswer: "المصدر اسم يدل على حدث مجرد من الزمن.", maxMarks: 1, skill: "تعريف المصدر", difficulty: "basic", explanation: "المصدر اسم يدل على حدث مجرد من الزمن.", rubric: "درجة واحدة: تُمنح لذكر أنه اسم يدل على حدث دون زمن محدد.", keywords: ["اسم", "حدث", "زمن"], misconception: "الظن أن المصدر فعل أو أنه مرتبط بزمن معين." },
    ],
  },
  {
    id: "q10", number: 10, lessonId: "u1l2", category: "spelling",
    instruction: "اختر الإجابة الصحيحة عن مواضع همزة القطع.",
    prompt: "أ) الماضي الثلاثي ومصدره. ب) الماضي الرباعي وأمره ومصدره. ج) الحروف.",
    subparts: [
      { id: "q10a", label: "أ", type: "mcq", prompt: "أيُّ زوجٍ صحيحٌ (ماضٍ ثلاثي مبدوء بهمزة ومصدره)؟", options: ["أكلَ – أكل", "أكلَ – إكل", "أكلَ – أكلٌ", "أكلَ – أكيل"], correctAnswer: "أكلَ – أكل", maxMarks: 2, skill: "همزة القطع في الماضي الثلاثي ومصدره", difficulty: "intermediate", explanation: "الماضي الثلاثي المبدوء بهمزة قطع ومصدره: أكلَ – أكل.", strictHamza: true },
      { id: "q10b", label: "ب", type: "mcq", prompt: "أيُّ مجموعةٍ صحيحةٌ (ماضٍ رباعي وأمره ومصدره)؟", options: ["أغلقَ – أغلقْ – إغلاق", "أغلقَ – أغلقْ – أغلاق", "أغلقَ – إغلقْ – إغلاق", "أغلقَ – أغلقْ – غلق"], correctAnswer: "أغلقَ – أغلقْ – إغلاق", maxMarks: 1, skill: "همزة القطع في الماضي الرباعي وأمره ومصدره", difficulty: "advanced", explanation: "الماضي الرباعي وأمره ومصدره بهمزة قطع: أغلقَ – أغلقْ – إغلاق.", strictHamza: true },
      { id: "q10c", label: "ج", type: "select", prompt: "الحرف «إنَّ» تُكتب همزته:", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة قطع", maxMarks: 1, skill: "همزة القطع في الحروف", difficulty: "basic", explanation: "«إنَّ» حرف تُكتب همزته همزة قطع تحت الألف." },
    ],
  },
  {
    id: "q11", number: 11, lessonId: "u1l2", category: "spelling",
    instruction: "أكمل بالكلمة الصحيحة ثم صحّح الكلمة الخاطئة.",
    prompt: "أ) أكمل الفراغ. ب) صحّح الكلمة.",
    subparts: [
      { id: "q11a", label: "أ", type: "fill", prompt: "أكمل: «____ المعلمُ الطالباتِ على اجتهادِهِنَّ.»", correctAnswer: "أكرمَ", acceptedAnswers: ["أكرم", "أكرمَ"], maxMarks: 2, skill: "كتابة همزة القطع في أول الفعل الرباعي", difficulty: "intermediate", explanation: "«أكرمَ» فعل رباعٍ مبدوء بهمزة قطع فوق الألف.", strictHamza: true },
      { id: "q11b", label: "ب", type: "correct", prompt: "صحّح الكلمة: «إرسلْ رسالتَكَ إلى صديقتِكَ.»", correctAnswer: "أرسلْ", acceptedAnswers: ["أرسل", "أرسلْ"], maxMarks: 1, skill: "موضع همزة القطع فوق الألف عند الفتح", difficulty: "intermediate", explanation: "أمر الفعل الرباعي «أرسلْ» بهمزة قطع فوق الألف.", strictHamza: true },
    ],
  },
  {
    id: "q12", number: 12, lessonId: "u1l2", category: "spelling",
    instruction: "اختر موضع الهمزة ثم علّل كتابة همزة القطع في الكلمة.",
    prompt: "أ) اختر موضع الهمزة. ب) علّل كتابة الهمزة في «أمان».",
    subparts: [
      { id: "q12a", label: "أ", type: "select", prompt: "في كلمة «إكرام» تقع همزة القطع:", options: ["تحت الألف", "فوق الألف"], correctAnswer: "تحت الألف", maxMarks: 2, skill: "موضع همزة القطع فوق الألف أو تحتها", difficulty: "basic", explanation: "همزة القطع تُكتب تحت الألف عندما تكون مكسورة، كما في «إكرام»." },
      { id: "q12b", label: "ب", type: "free", prompt: "علّل: لماذا تُكتب الهمزة في «أمان» همزةَ قطعٍ؟", correctAnswer: "لأنها تُنطق في أول الكلام وفي وصله.", maxMarks: 1, skill: "تعليل كتابة همزة القطع في الأسماء", difficulty: "advanced", explanation: "«أمان» اسم تُنطق همزته دائمًا فهي همزة قطع.", rubric: "درجة واحدة: تُمنح لذكر أن الهمزة تُنطق في البدء والوصل.", keywords: ["تُنطق", "قطع"], misconception: "الظن أن همزة القطع تُكتب دائمًا فوق الألف." },
    ],
  },
  // ============ الدرس 3: لغتي (ص 28-32) ============
  {
    id: "q13", number: 13, lessonId: "u1l3", category: "grammar",
    instruction: "في الجملة الآتية حدّد الفعل والفاعل والمفعول به.",
    prompt: "الجملة: «رسمتْ ليلى لوحةً جميلةً.» حدّد كل ركن.",
    subparts: [
      { id: "q13a", label: "أ", type: "select", prompt: "الفعل في الجملة:", options: ["رسمتْ", "ليلى", "لوحةً"], correctAnswer: "رسمتْ", maxMarks: 2, skill: "التعرف على الفعل في الجملة الفعلية", difficulty: "basic", explanation: "«رسمتْ» فعل يدل على حدث الرسم." },
      { id: "q13b", label: "ب", type: "select", prompt: "الفاعل في الجملة:", options: ["رسمتْ", "ليلى", "لوحةً"], correctAnswer: "ليلى", maxMarks: 1, skill: "التعرف على الفاعل: من قام بالفعل", difficulty: "basic", explanation: "«ليلى» هي التي قامت بالرسم فهي الفاعل." },
      { id: "q13c", label: "ج", type: "select", prompt: "المفعول به في الجملة:", options: ["رسمتْ", "ليلى", "لوحةً"], correctAnswer: "لوحةً", maxMarks: 1, skill: "التعرف على المفعول به: ما وقع عليه الفعل", difficulty: "intermediate", explanation: "«لوحةً» هي ما وقع عليه فعل الرسم فهي المفعول به." },
    ],
  },
  {
    id: "q14", number: 14, lessonId: "u1l3", category: "grammar",
    instruction: "في الجملة الآتية حدّد الفاعل والمفعول به.",
    prompt: "الجملة: «تنظمُ المعلمةُ المعرضَ المدرسيَّ.» حدّد كل ركن.",
    subparts: [
      { id: "q14a", label: "أ", type: "select", prompt: "الفاعل في الجملة:", options: ["تنظمُ", "المعلمةُ", "المعرضَ"], correctAnswer: "المعلمةُ", maxMarks: 2, skill: "التعرف على الفاعل في جملة جديدة", difficulty: "intermediate", explanation: "«المعلمةُ» هي التي تقوم بالتنظيم فهي الفاعل." },
      { id: "q14b", label: "ب", type: "select", prompt: "المفعول به في الجملة:", options: ["تنظمُ", "المعلمةُ", "المعرضَ"], correctAnswer: "المعرضَ", maxMarks: 1, skill: "التعرف على المفعول به في جملة جديدة", difficulty: "intermediate", explanation: "«المعرضَ» هو ما وقع عليه التنظيم فهو المفعول به." },
    ],
  },
  {
    id: "q15", number: 15, lessonId: "u1l3", category: "grammar",
    instruction: "اختر الإجابة الصحيحة ثم اكتب جملة فعلية من عندك.",
    prompt: "أ) اختر الإجابة الصحيحة. ب) اكتب جملة فعلية فيها فعل وفاعل ومفعول به.",
    subparts: [
      { id: "q15a", label: "أ", type: "mcq", prompt: "في جملة «فتحتْ سارةُ البابَ» من قام بالفعل؟", options: ["سارة", "الباب", "فتحتْ"], correctAnswer: "سارة", maxMarks: 2, skill: "فهم الفاعل: من قام بالفعل", difficulty: "basic", explanation: "«سارة» هي التي قامت بالفتح فهي الفاعل." },
      { id: "q15b", label: "ب", type: "free", prompt: "اكتب جملة فعلية من عندك فيها فعل وفاعل ومفعول به.", correctAnswer: "مثال: شربتْ مريمُ الماءَ.", maxMarks: 1, skill: "إنتاج جملة فعلية كاملة الأركان", difficulty: "advanced", explanation: "تُقبل أي جملة فعلية صحيحة فيها فعل وفاعل ومفعول به.", rubric: "درجة واحدة: تُمنح إذا احتوت الجملة فعلًا وفاعلًا ومفعولًا به وكانت صحيحة نحويًا.", keywords: ["تْ", "ة", "ا"], misconception: "الخلط بين الفاعل والمفعول به في الجملة." },
    ],
  },
  {
    id: "q16", number: 16, lessonId: "u1l3", category: "spelling",
    instruction: "حدّد نوع الهمزة في أول كل كلمة: همزة وصل أم همزة قطع؟",
    prompt: "اختر نوع الهمزة في كل كلمة.",
    subparts: [
      { id: "q16a", label: "أ", type: "select", prompt: "«ارسمْ»", options: ["همزة وصل", "همزة قطع"], correctAnswer: "همزة وصل", maxMarks: 2, skill: "همزة الوصل في أمر الفعل الثلاثي", difficulty: "basic", explanation: "«ارسمْ» أمر فعل ثلاثي، وتُكتب بهمزة وصل." },
      { id: "q16b", label: "ب", type: "select", prompt: "«انطلقَ»", options: ["همزة وصل", "همزة قطع"], correctAnswer: "همزة وصل", maxMarks: 1, skill: "همزة الوصل في ماضي الفعل الخماسي", difficulty: "intermediate", explanation: "«انطلقَ» ماضٍ خماسي، وتُكتب بهمزة وصل." },
      { id: "q16c", label: "ج", type: "select", prompt: "«استخدام»", options: ["همزة وصل", "همزة قطع"], correctAnswer: "همزة وصل", maxMarks: 1, skill: "همزة الوصل في مصدر الفعل السداسي", difficulty: "advanced", explanation: "«استخدام» مصدر فعل سداسي، وتُكتب بهمزة وصل." },
    ],
  },
  {
    id: "q17", number: 17, lessonId: "u1l3", category: "spelling",
    instruction: "أكمل بالكلمة الصحيحة ثم اختر الكلمة التي بهمزة وصل.",
    prompt: "أ) أكمل الفراغ. ب) اختر الإجابة الصحيحة.",
    subparts: [
      { id: "q17a", label: "أ", type: "fill", prompt: "أكمل: «____ الطالبةُ في الحديقةِ عند رؤيةِ الفراشاتِ.»", correctAnswer: "ابتسمتْ", acceptedAnswers: ["ابتسمت", "ابتسمتْ"], maxMarks: 2, skill: "همزة الوصل في ماضي الفعل الخماسي", difficulty: "intermediate", explanation: "«ابتسمتْ» ماضٍ خماسي تُكتب بهمزة وصل.", strictHamza: true },
      { id: "q17b", label: "ب", type: "mcq", prompt: "أيُّ كلمةٍ تُكتب بهمزة وصلٍ؟", options: ["أمان", "استخدم", "أكرم", "أبطال"], correctAnswer: "استخدم", maxMarks: 1, skill: "التعرف على همزة الوصل في كلمات جديدة", difficulty: "basic", explanation: "«استخدم» بهمزة وصل، والباقي بهمزة قطع." },
    ],
  },
  {
    id: "q18", number: 18, lessonId: "u1l3", category: "spelling",
    instruction: "اختر الكلمة الصحيحة ثم علّل كتابة همزة الوصل.",
    prompt: "أ) اختر الكلمة التي تُكتب بهمزة وصل من الأسماء المقررة. ب) علّل كتابة الهمزة في «اسم».",
    subparts: [
      { id: "q18a", label: "أ", type: "mcq", prompt: "أيُّ كلمةٍ من الأسماء السبعة التي تُكتب بهمزة وصلٍ؟", options: ["أمانة", "امرأة", "أكرم", "أبطال"], correctAnswer: "امرأة", maxMarks: 2, skill: "همزة الوصل في الأسماء السبعة", difficulty: "intermediate", explanation: "«امرأة» من الأسماء السبعة وتُكتب بهمزة وصل." },
      { id: "q18b", label: "ب", type: "free", prompt: "علّل: لماذا تُكتب الهمزة في «اسم» همزةَ وصلٍ؟", correctAnswer: "لأنها تُنطق في أول الكلام ولا تُنطق في وصله وهي من الأسماء السبعة.", maxMarks: 1, skill: "تعليل كتابة همزة الوصل", difficulty: "advanced", explanation: "«اسم» من الأسماء السبعة، وهمزة الوصل تُنطق في البدء ولا تُنطق في الوصل.", rubric: "درجة واحدة: تُمنح لذكر أن الهمزة تُنطق في البدء ولا تُنطق في الوصل.", keywords: ["تُنطق", "وصل"], misconception: "الظن أن الأسماء السبعة تُكتب بهمزة قطع." },
    ],
  },
  // ============ الدرس 4: مخترع من بلادي (ص 44-46) ============
  {
    id: "q19", number: 19, lessonId: "u2l1", category: "grammar",
    instruction: "في الجملة الآتية حدّد المبتدأ والخبر وعلامة الرفع.",
    prompt: "الجملة: «المكتبةُ هادئةٌ.» حدّد كل عنصر.",
    subparts: [
      { id: "q19a", label: "أ", type: "select", prompt: "المبتدأ في الجملة:", options: ["المكتبةُ", "هادئةٌ"], correctAnswer: "المكتبةُ", maxMarks: 2, skill: "التعرف على المبتدأ في الجملة الاسمية", difficulty: "basic", explanation: "«المكتبةُ» اسم بدأت به الجملة فهو المبتدأ." },
      { id: "q19b", label: "ب", type: "select", prompt: "الخبر في الجملة:", options: ["المكتبةُ", "هادئةٌ"], correctAnswer: "هادئةٌ", maxMarks: 1, skill: "التعرف على الخبر في الجملة الاسمية", difficulty: "basic", explanation: "«هادئةٌ» تخبر عن المبتدأ فهي الخبر." },
      { id: "q19c", label: "ج", type: "select", prompt: "علامة رفع المبتدأ والخبر في هذه الجملة:", options: ["الضمة", "الفتحة", "الكسرة"], correctAnswer: "الضمة", maxMarks: 1, skill: "علامة رفع المبتدأ والخبر: الضمة", difficulty: "basic", explanation: "المبتدأ والخبر اسمان مرفوعان وعلامة رفعهما الضمة." },
    ],
  },
  {
    id: "q20", number: 20, lessonId: "u2l1", category: "grammar",
    instruction: "في الجملة الآتية ميّز بين الخبر والنعت.",
    prompt: "الجملة: «الطالبُ المجتهدُ ناجحٌ.» حدّد الخبر والنعت.",
    subparts: [
      { id: "q20a", label: "أ", type: "select", prompt: "الخبر في الجملة:", options: ["المجتهدُ", "ناجحٌ"], correctAnswer: "ناجحٌ", maxMarks: 2, skill: "التمييز بين الخبر والنعت", difficulty: "intermediate", explanation: "«ناجحٌ» تخبر عن المبتدأ فهي الخبر، و«المجتهدُ» نعت يصف المبتدأ." },
      { id: "q20b", label: "ب", type: "select", prompt: "النعت في الجملة:", options: ["المجتهدُ", "ناجحٌ"], correctAnswer: "المجتهدُ", maxMarks: 1, skill: "التمييز بين الخبر والنعت", difficulty: "advanced", explanation: "«المجتهدُ» يصف المبتدأ فهو نعت، وليس خبرًا." },
    ],
  },
  {
    id: "q21", number: 21, lessonId: "u2l1", category: "grammar",
    instruction: "أكمل بخبر مناسب ثم اشرح الفرق بين الخبر والنعت.",
    prompt: "أ) أكمل الفراغ بخبر مناسب. ب) اشرح الفرق بين الخبر والنعت بكلماتك.",
    subparts: [
      { id: "q21a", label: "أ", type: "fill", prompt: "أكمل بخبر مناسب: «الحديقةُ ____ في فصلِ الربيعِ.»", correctAnswer: "جميلةٌ", acceptedAnswers: ["جميلة", "واسعة", "مليئة", "خضراء", "نظيفة"], maxMarks: 2, skill: "إكمال جملة اسمية بخبر مناسب", difficulty: "intermediate", explanation: "أي خبر مناسب مرفوع بالضمة يُكمل الجملة، مثل: الحديقةُ جميلةٌ.", rubric: "درجتان: تُمنح لكلمة خبر صحيحة مرفوعة مناسبة للمعنى." },
      { id: "q21b", label: "ب", type: "free", prompt: "اشرح بكلماتك: ما الفرق بين الخبر والنعت؟", correctAnswer: "الخبر يُخبر عن المبتدأ والنعت يصف الاسم.", maxMarks: 1, skill: "شرح الفرق بين الخبر والنعت", difficulty: "advanced", explanation: "الخبر يُخبر عن المبتدأ، والنعت يصف الاسم الذي قبله.", rubric: "درجة واحدة: تُمنح لذكر أن الخبر يُخبر عن المبتدأ والنعت يصف.", keywords: ["يُخبر", "يصف"], misconception: "الظن أن كل اسم بعد المبتدأ خبر." },
    ],
  },
  {
    id: "q22", number: 22, lessonId: "u2l1", category: "spelling",
    instruction: "حدّد نوع الهمزة الأولية في كل كلمة: همزة قطع أم همزة وصل؟",
    prompt: "اختر نوع الهمزة في كل كلمة.",
    subparts: [
      { id: "q22a", label: "أ", type: "select", prompt: "«أصدقاءُ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة قطع", maxMarks: 2, skill: "التعرف على نوع الهمزة الأولية", difficulty: "basic", explanation: "«أصدقاء» بهمزة قطع تُنطق دائمًا." },
      { id: "q22b", label: "ب", type: "select", prompt: "«استخدمْ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة وصل", maxMarks: 1, skill: "التعرف على نوع الهمزة الأولية", difficulty: "basic", explanation: "«استخدم» بهمزة وصل لا تُنطق في الوصل." },
      { id: "q22c", label: "ج", type: "select", prompt: "«إحسانٌ»", options: ["همزة قطع", "همزة وصل"], correctAnswer: "همزة قطع", maxMarks: 1, skill: "التعرف على نوع الهمزة الأولية", difficulty: "intermediate", explanation: "«إحسان» بهمزة قطع تحت الألف." },
    ],
  },
  {
    id: "q23", number: 23, lessonId: "u2l1", category: "spelling",
    instruction: "اختر الكلمة الصحيحة ثم صحّح الكلمة الخاطئة.",
    prompt: "أ) اختر الكلمة التي بهمزة وصل. ب) صحّح الكلمة.",
    subparts: [
      { id: "q23a", label: "أ", type: "mcq", prompt: "أيُّ كلمةٍ تُكتب بهمزة وصلٍ؟", options: ["ابن", "أمان", "أكرم", "أبطال"], correctAnswer: "ابن", maxMarks: 2, skill: "همزة الوصل في الأسماء السبعة", difficulty: "intermediate", explanation: "«ابن» من الأسماء السبعة وتُكتب بهمزة وصل." },
      { id: "q23b", label: "ب", type: "correct", prompt: "صحّح الكلمة: «أستراحُ في الحديقةِ قليلًا.»", correctAnswer: "استراحُ", acceptedAnswers: ["استراح", "استراحُ"], maxMarks: 1, skill: "كتابة همزة الوصل في الفعل السداسي", difficulty: "intermediate", explanation: "«استراح» فعل سداسي تُكتب بهمزة وصل.", strictHamza: true },
    ],
  },
  {
    id: "q24", number: 24, lessonId: "u2l1", category: "spelling",
    instruction: "اختر الإجابة الصحيحة ثم علّل نوع الهمزة في الكلمة.",
    prompt: "أ) اختر الإجابة الصحيحة. ب) علّل نوع الهمزة في «أذكياء».",
    subparts: [
      { id: "q24a", label: "أ", type: "mcq", prompt: "تُكتب همزة القطع فوق الألف عندما تكون:", options: ["مفتوحة أو مضمومة", "مكسورة", "ساكنة دائمًا", "لا تُكتب أبدًا"], correctAnswer: "مفتوحة أو مضمومة", maxMarks: 2, skill: "موضع همزة القطع فوق الألف أو تحتها", difficulty: "intermediate", explanation: "همزة القطع فوق الألف إذا كانت مفتوحة أو مضمومة، وتحت الألف إذا كانت مكسورة." },
      { id: "q24b", label: "ب", type: "free", prompt: "علّل: ما نوع الهمزة في «أذكياء» ولماذا؟", correctAnswer: "همزة قطع لأنها تُنطق في أول الكلام وفي وصله.", maxMarks: 1, skill: "تعليل نوع الهمزة الأولية", difficulty: "advanced", explanation: "«أذكياء» بهمزة قطع تُنطق دائمًا.", rubric: "درجة واحدة: تُمنح لذكر أنها همزة قطع تُنطق في البدء والوصل.", keywords: ["قطع", "تُنطق"], misconception: "الخلط بين همزة القطع وهمزة الوصل في الكلمات الجديدة." },
    ],
  },
  // ============ الدرس 5: الذكاء الاصطناعي (ص 54-56) ============
  {
    id: "q25", number: 25, lessonId: "u2l2", category: "grammar",
    instruction: "حوّل الجمل الفعلية الآتية إلى جمل اسمية ثم اختر القاعدة الصحيحة.",
    prompt: "أ) حوّل الجملة الأولى. ب) حوّل الجملة الثانية. ج) اختر القاعدة.",
    subparts: [
      { id: "q25a", label: "أ", type: "fill", prompt: "حوّل إلى جملة اسمية: «ترسمُ الطالبةُ لوحةً.»", correctAnswer: "الطالبةُ ترسمُ لوحةً", acceptedAnswers: ["الطالبة ترسم لوحة", "الطالبةُ ترسمُ لوحةً", "الطالبة ترسم لوحةً"], maxMarks: 2, skill: "تحويل الجملة الفعلية إلى اسمية بتقديم الفاعل", difficulty: "intermediate", explanation: "نُقدم الفاعل «الطالبةُ» على الفعل فتصبح: الطالبةُ ترسمُ لوحةً.", rubric: "درجتان: درجة لتقديم الفاعل ودرجة لصحة الجملة." },
      { id: "q25b", label: "ب", type: "fill", prompt: "حوّل إلى جملة اسمية: «ينظمُ الفريقُ المعرضَ.»", correctAnswer: "الفريقُ ينظمُ المعرضَ", acceptedAnswers: ["الفريق ينظم المعرض", "الفريقُ ينظمُ المعرضَ"], maxMarks: 1, skill: "تحويل الجملة الفعلية إلى اسمية بتقديم الفاعل", difficulty: "intermediate", explanation: "نُقدم الفاعل «الفريقُ» على الفعل فتصبح: الفريقُ ينظمُ المعرضَ." },
      { id: "q25c", label: "ج", type: "mcq", prompt: "القاعدة الصحيحة لتحويل الجملة الفعلية إلى اسمية:", options: ["نُقدم الفاعل على الفعل", "نُقدم الفعل على الفاعل", "نحذف الفاعل", "نُقدم المفعول به"], correctAnswer: "نُقدم الفاعل على الفعل", maxMarks: 1, skill: "قاعدة التحويل من الفعلية إلى الاسمية", difficulty: "basic", explanation: "لتحويل الجملة الفعلية إلى اسمية نُقدم الفاعل على الفعل." },
    ],
  },
  {
    id: "q26", number: 26, lessonId: "u2l2", category: "grammar",
    instruction: "حوّل الجملة الاسمية إلى فعلية ثم اختر الجملة الاسمية الصحيحة.",
    prompt: "أ) حوّل إلى جملة فعلية. ب) اختر الإجابة الصحيحة.",
    subparts: [
      { id: "q26a", label: "أ", type: "fill", prompt: "حوّل إلى جملة فعلية: «المعلمةُ تفتحُ البابَ.»", correctAnswer: "تفتحُ المعلمةُ البابَ", acceptedAnswers: ["تفتح المعلمة الباب", "تفتحُ المعلمةُ البابَ"], maxMarks: 2, skill: "عكس التحويل: من الاسمية إلى الفعلية", difficulty: "intermediate", explanation: "نُقدم الفعل على الفاعل فتصبح: تفتحُ المعلمةُ البابَ." },
      { id: "q26b", label: "ب", type: "mcq", prompt: "أيُّ جملةٍ اسميةٌ؟", options: ["يتحركُ الروبوتُ بسرعةٍ", "الروبوتُ يتحركُ بسرعةٍ"], correctAnswer: "الروبوتُ يتحركُ بسرعةٍ", maxMarks: 1, skill: "التعرف على الجملة الاسمية بعد التحويل", difficulty: "basic", explanation: "«الروبوتُ يتحركُ» تبدأ باسم فهي جملة اسمية." },
    ],
  },
  {
    id: "q27", number: 27, lessonId: "u2l2", category: "grammar",
    instruction: "حوّل الجملة الآتية ثم اشرح كيف يتغير الترتيب عند التحويل.",
    prompt: "أ) حوّل الجملة إلى اسمية. ب) اشرح التغيير بكلماتك.",
    subparts: [
      { id: "q27a", label: "أ", type: "fill", prompt: "حوّل إلى جملة اسمية: «يبني الفريقُ روبوتًا.»", correctAnswer: "الفريقُ يبني روبوتًا", acceptedAnswers: ["الفريق يبني روبوتا", "الفريقُ يبني روبوتًا"], maxMarks: 2, skill: "تحويل جملة فعلية جديدة إلى اسمية", difficulty: "advanced", explanation: "نُقدم الفاعل «الفريقُ» على الفعل فتصبح: الفريقُ يبني روبوتًا." },
      { id: "q27b", label: "ب", type: "free", prompt: "اشرح بكلماتك: كيف يتغير ترتيب الكلمات عند تحويل الجملة الفعلية إلى اسمية؟", correctAnswer: "يُقدم الفاعل على الفعل فيصبح مبتدأ والجملة الفعلية بعده خبرًا.", maxMarks: 1, skill: "فهم تغير البنية عند التحويل", difficulty: "advanced", explanation: "يُقدم الفاعل على الفعل فيصبح مبتدأ، والجملة الفعلية بعده خبرًا.", rubric: "درجة واحدة: تُمنح لذكر تقديم الفاعل على الفعل.", keywords: ["الفاعل", "الفعل"], misconception: "الظن أن التحويل يغير معنى الجملة أو كلماتها." },
    ],
  },
  {
    id: "q28", number: 28, lessonId: "u2l2", category: "spelling",
    instruction: "حدّد نوع التاء في آخر كل كلمة: تاء مبسوطة أم تاء مربوطة؟",
    prompt: "اختر نوع التاء في كل كلمة.",
    subparts: [
      { id: "q28a", label: "أ", type: "select", prompt: "«رسمتْ»", options: ["تاء مبسوطة", "تاء مربوطة"], correctAnswer: "تاء مبسوطة", maxMarks: 2, skill: "التاء المبسوطة في الأفعال المتصلة بتاء التأنيث", difficulty: "basic", explanation: "«رسمتْ» فعل متصل بتاء التأنيث الساكنة فتُكتب تاؤه مبسوطة." },
      { id: "q28b", label: "ب", type: "select", prompt: "«حديقة»", options: ["تاء مبسوطة", "تاء مربوطة"], correctAnswer: "تاء مربوطة", maxMarks: 1, skill: "التاء المربوطة في آخر الاسم المفرد المؤنث", difficulty: "basic", explanation: "«حديقة» اسم مفرد مؤنث تُلفظ هاءً عند الوقف فتاؤه مربوطة." },
      { id: "q28c", label: "ج", type: "select", prompt: "«الطالباتُ»", options: ["تاء مبسوطة", "تاء مربوطة"], correctAnswer: "تاء مبسوطة", maxMarks: 1, skill: "التاء المبسوطة في جمع المؤنث السالم", difficulty: "intermediate", explanation: "«الطالبات» جمع مؤنث سالم فتُكتب تاؤه مبسوطة." },
    ],
  },
  {
    id: "q29", number: 29, lessonId: "u2l2", category: "spelling",
    instruction: "اختر الكلمة الصحيحة ثم أكمل بالكلمة الصحيحة.",
    prompt: "أ) اختر الإجابة الصحيحة. ب) أكمل الفراغ بالكلمة الصحيحة.",
    subparts: [
      { id: "q29a", label: "أ", type: "mcq", prompt: "أيُّ كلمةٍ تنتهي بتاءٍ مربوطةٍ؟", options: ["مكتبة", "بنت", "رسمت", "الطالبات"], correctAnswer: "مكتبة", maxMarks: 2, skill: "التعرف على التاء المربوطة في كلمات جديدة", difficulty: "intermediate", explanation: "«مكتبة» اسم مفرد مؤنث تاؤه مربوطة، والباقي تاؤه مبسوطة.", misconception: "الظن أن كل تاء في آخر الكلمة مبسوطة." },
      { id: "q29b", label: "ب", type: "fill", prompt: "أكمل بالكلمة الصحيحة: «____ سارةُ إلى المكتبةِ أمسِ.»", correctAnswer: "سافرتْ", acceptedAnswers: ["سافرت", "سافرتْ"], maxMarks: 1, skill: "التاء المبسوطة في الفعل المتصل بتاء التأنيث", difficulty: "intermediate", explanation: "«سافرتْ» فعل متصل بتاء التأنيث الساكنة فتُكتب تاؤه مبسوطة." },
    ],
  },
  {
    id: "q30", number: 30, lessonId: "u2l2", category: "spelling",
    instruction: "اختر الإجابة الصحيحة ثم علّل كتابة التاء في الكلمة.",
    prompt: "أ) اختر الإجابة الصحيحة. ب) علّل كتابة التاء في «بنت».",
    subparts: [
      { id: "q30a", label: "أ", type: "mcq", prompt: "التاء التي تُلفظ هاءً عند الوقف عليها بالساكن هي:", options: ["التاء المربوطة", "التاء المبسوطة"], correctAnswer: "التاء المربوطة", maxMarks: 2, skill: "اختبار الوقف للتمييز بين التاءين", difficulty: "basic", explanation: "التاء المربوطة تُلفظ هاءً عند الوقف، والتاء المبسوطة لا يتغير لفظها." },
      { id: "q30b", label: "ب", type: "free", prompt: "علّل: لماذا تُكتب التاء في «بنت» تاءً مبسوطةً؟", correctAnswer: "لأنها اسم ثلاثي ساكن الوسط.", maxMarks: 1, skill: "تعليل التاء المبسوطة في الاسم الثلاثي ساكن الوسط", difficulty: "advanced", explanation: "«بنت» اسم ثلاثي ساكن الوسط فتُكتب تاؤه مبسوطة.", rubric: "درجة واحدة: تُمنح لذكر أنه اسم ثلاثي ساكن الوسط.", keywords: ["ثلاثي", "ساكن"], misconception: "الظن أن التاء المربوطة والمبسوطة تُكتبان بلا قاعدة." },
    ],
  },
];

const totalMarks = QUESTIONS.reduce((s, q) => s + q.subparts.reduce((a, sp) => a + sp.maxMarks, 0), 0);
const totalSubparts = QUESTIONS.reduce((s, q) => s + q.subparts.length, 0);

export const EXAM_DATA: ExamData = { questions: QUESTIONS, totalMarks, totalSubparts };

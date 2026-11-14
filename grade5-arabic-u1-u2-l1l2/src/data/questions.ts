// بيانات الاختبار: 15 سؤالاً رئيسياً مع الفروع
// المصدر: المستودع الرسمي لمنهاج الصف الخامس - اللغة العربية
// ============================================================

export type BranchType =
  | 'single_choice'
  | 'multi_choice'
  | 'true_false'
  | 'fill_blank'
  | 'classify'
  | 'match';

export interface Choice {
  id: string;
  text: string;
}

export interface ClassifyItem {
  id: string;
  text: string;
  correctCategoryId: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface Branch {
  id: string;
  type: BranchType;
  prompt: string;
  points: number;
  // single_choice / true_false
  choices?: Choice[];
  correctChoiceId?: string;
  // multi_choice
  correctChoiceIds?: string[];
  // fill_blank
  acceptedAnswers?: string[];
  // classify
  categories?: { id: string; label: string }[];
  items?: ClassifyItem[];
  // match (display order of RHS randomized; correct mapping is pair.left ↔ pair.right)
  pairs?: MatchPair[];
  // feedback
  explanation: string;
  source: { lesson: string; page: string };
}

export interface MainQuestion {
  id: string;
  order: number;
  title: string;
  lesson: string;
  branches: Branch[];
}

// ============================================================
// الأسئلة
// ============================================================
export const QUESTIONS: MainQuestion[] = [
  {
    id: 'q1',
    order: 1,
    title: 'السؤال الأول: في فهم قصة «السَّمَكَةُ الذَّهَبِيَّةُ» وأحداثها',
    lesson: 'الدرس الأول: السَّمَكَةُ الذَّهَبِيَّةُ',
    branches: [
      {
        id: 'q1a',
        type: 'single_choice',
        prompt: 'ما مهنة بطل القصة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'نَجّارٌ' },
          { id: 'b', text: 'صَيّادٌ' },
          { id: 'c', text: 'تاجِرٌ' },
          { id: 'd', text: 'مُعَلِّمٌ' },
        ],
        correctChoiceId: 'b',
        explanation: 'القصة تدور حول صيّاد فقير يعيش على الشاطئ.',
        source: { lesson: 'السمكة الذهبية', page: '5' },
      },
      {
        id: 'q1b',
        type: 'true_false',
        prompt: 'نصح البحر الصياد بانتظار السمكة الذهبية دون عمل.',
        points: 2,
        choices: [
          { id: 'true', text: 'صحيح' },
          { id: 'false', text: 'خطأ' },
        ],
        correctChoiceId: 'false',
        explanation: 'بل نصحه بالتعاون مع زملائه وصنع مركب للصيد بدلاً من انتظار السمكة الذهبية.',
        source: { lesson: 'السمكة الذهبية', page: '5' },
      },
      {
        id: 'q1c',
        type: 'fill_blank',
        prompt: 'أكتب جمع كلمة «الشَّبَكَة»:',
        points: 2,
        acceptedAnswers: ['الشباك', 'الشِّباك', 'الشبكات', 'الشَّبَكات'],
        explanation: 'جمع الشبكة: الشِّباكُ أو الشَّبَكاتُ.',
        source: { lesson: 'السمكة الذهبية', page: '6' },
      },
      {
        id: 'q1d',
        type: 'single_choice',
        prompt: 'ما الرمز الدلالي لـ«السمكة الذهبية» في نهاية القصة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'ثمرة العمل والتعاون التي نالها كل صياد' },
          { id: 'b', text: 'سمكة حقيقية من الذهب' },
          { id: 'c', text: 'حظ سعيد يأتي دون جهد' },
          { id: 'd', text: 'لعبة بحرية' },
        ],
        correctChoiceId: 'a',
        explanation: 'صارت السمكة الذهبية رمزاً لثمار التعاون والعمل الجماعي الذي حقق أحلام الصيادين.',
        source: { lesson: 'السمكة الذهبية', page: '5' },
      },
    ],
  },
  {
    id: 'q2',
    order: 2,
    title: 'السؤال الثاني: الجملة الاسمية والجملة الفعلية',
    lesson: 'الدرس الأول: السَّمَكَةُ الذَّهَبِيَّةُ',
    branches: [
      {
        id: 'q2a',
        type: 'classify',
        prompt: 'صنّف الجمل الآتية بحسب نوعها (اسمية أو فعلية):',
        points: 2,
        categories: [
          { id: 'nom', label: 'اسمية' },
          { id: 'ver', label: 'فعلية' },
        ],
        items: [
          { id: 's1', text: 'الشاطئُ ساحرٌ', correctCategoryId: 'nom' },
          { id: 's2', text: 'تَعاوَنَ الصيّادون على مواجهة العاصفة', correctCategoryId: 'ver' },
          { id: 's3', text: 'التعاونُ قوةٌ', correctCategoryId: 'nom' },
        ],
        explanation: 'الجملة الاسمية تبدأ باسم، والجملة الفعلية تبدأ بفعل.',
        source: { lesson: 'السمكة الذهبية', page: '8' },
      },
      {
        id: 'q2b',
        type: 'single_choice',
        prompt: 'ما نوع الجملة «تَعاوَنَ الصيّادون على صُنْعِ المَرْكَبِ»؟',
        points: 2,
        choices: [
          { id: 'a', text: 'اسمية' },
          { id: 'b', text: 'فعلية' },
          { id: 'c', text: 'شبه جملة' },
          { id: 'd', text: 'ليست جملة مفيدة' },
        ],
        correctChoiceId: 'b',
        explanation: 'بدأت بفعل (تعاونَ)، فهي جملة فعلية.',
        source: { lesson: 'السمكة الذهبية', page: '8' },
      },
      {
        id: 'q2c',
        type: 'single_choice',
        prompt: 'لماذا نعدّ الجملة «خَفَقَ البَحْرُ بِمَوْجِهِ» جملة فعلية؟',
        points: 3,
        choices: [
          { id: 'a', text: 'لأنها بدأت بفعل' },
          { id: 'b', text: 'لأنها بدأت باسم' },
          { id: 'c', text: 'لأنها لا تفيد معنى' },
          { id: 'd', text: 'لأنها سؤال' },
        ],
        correctChoiceId: 'a',
        explanation: 'الجملة الفعلية هي التي تبدأ بفعل مثل «خَفَقَ» حسب قاعدة الدرس.',
        source: { lesson: 'السمكة الذهبية', page: '8' },
      },
    ],
  },
  {
    id: 'q3',
    order: 3,
    title: 'السؤال الثالث: الهَمْزَةُ الأوَّلِيَّةُ (القطع والوصل)',
    lesson: 'الدرس الأول: السَّمَكَةُ الذَّهَبِيَّةُ',
    branches: [
      {
        id: 'q3a',
        type: 'classify',
        prompt: 'صنّف الكلمتين الآتيتين بحسب نوع همزتهما الأولية:',
        points: 2,
        categories: [
          { id: 'wasl', label: 'همزة وصل' },
          { id: 'qat', label: 'همزة قطع' },
        ],
        items: [
          { id: 'w1', text: 'انْظُرْ', correctCategoryId: 'wasl' },
          { id: 'w2', text: 'إِكْرَامٍ', correctCategoryId: 'qat' },
        ],
        explanation: '«انظر» تبدأ بهمزة وصل (أمر ثلاثي)، و«إكرام» تبدأ بهمزة قطع مكسورة تحت الألف.',
        source: { lesson: 'السمكة الذهبية', page: '9' },
      },
      {
        id: 'q3b',
        type: 'single_choice',
        prompt: 'ما الصورة الصحيحة للكلمة المخطوطة في الجملة «اسْتَفِدْ مِنْ أَنْجازاتِهِمْ» بعد تصويب رسم الهمزة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'إِنْجازاتِهِمْ' },
          { id: 'b', text: 'أَنْجازاتِهِمْ' },
          { id: 'c', text: 'انْجازاتِهِمْ' },
        ],
        correctChoiceId: 'a',
        explanation: '«إنجازات» مصدر رباعي يبدأ بهمزة قطع مكسورة، فتكتب الهمزة تحت الألف.',
        source: { lesson: 'السمكة الذهبية', page: '9' },
      },
      {
        id: 'q3c',
        type: 'true_false',
        prompt: 'همزة الوصل تُلفظ دائماً في أثناء الكلام.',
        points: 2,
        choices: [
          { id: 'true', text: 'صحيح' },
          { id: 'false', text: 'خطأ' },
        ],
        correctChoiceId: 'false',
        explanation: 'همزة الوصل تُلفظ في أول الكلام فقط، ولا تُلفظ في وصل الكلام.',
        source: { lesson: 'السمكة الذهبية', page: '9' },
      },
    ],
  },
  {
    id: 'q4',
    order: 4,
    title: 'السؤال الرابع: مفردات وفهم نص «بالرأي والرأي الآخر»',
    lesson: 'الدرس الثاني: بالرأي والرأي الآخر',
    branches: [
      {
        id: 'q4a',
        type: 'match',
        prompt: 'طابق كل كلمة بمعناها كما وردت في معجم الدرس:',
        points: 2,
        pairs: [
          { id: 'p1', left: 'تَتَصَفَّى', right: 'تنتقي' },
          { id: 'p2', left: 'الحِكْمَةُ', right: 'اعتماد العقل والعلم بحقائق الأمور' },
        ],
        explanation: 'المعجمان في ص١٣: تتصفّى: تنتقي، والحكمة: اعتماد العقل والعلم بحقائق الأمور.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '13' },
      },
      {
        id: 'q4b',
        type: 'single_choice',
        prompt: 'المقصود بقول الشاعر «أرفع صوتي» في سياق النص هو:',
        points: 2,
        choices: [
          { id: 'a', text: 'أُعَبِّر عن رأيي' },
          { id: 'b', text: 'أَصرُخ' },
          { id: 'c', text: 'أُخاصم' },
        ],
        correctChoiceId: 'a',
        explanation: 'يراد بالعبارة التعبير عن الرأي لا الصراخ أو الخصام.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '14' },
      },
      {
        id: 'q4c',
        type: 'single_choice',
        prompt: 'متى تنضج الحكمة وفق ما يفيد به النص؟',
        points: 3,
        choices: [
          { id: 'a', text: 'بالرأي والرأي الآخر والحوار' },
          { id: 'b', text: 'بالخصام والجدال' },
          { id: 'c', text: 'بالصمت وعدم الكلام' },
          { id: 'd', text: 'باتباع رأي واحد فقط' },
        ],
        correctChoiceId: 'a',
        explanation: 'النص يقرر أن الحكمة تنضج بتعدد الآراء والحوار الإيجابي.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '14-15' },
      },
    ],
  },
  {
    id: 'q5',
    order: 5,
    title: 'السؤال الخامس: المَصَادِرُ',
    lesson: 'الدرس الثاني: بالرأي والرأي الآخر',
    branches: [
      {
        id: 'q5a',
        type: 'true_false',
        prompt: 'المَصْدَرُ اسمٌ يدلُّ على حدث مجرد من الزمن.',
        points: 2,
        choices: [
          { id: 'true', text: 'صحيح' },
          { id: 'false', text: 'خطأ' },
        ],
        correctChoiceId: 'true',
        explanation: 'هذا هو تعريف المصدر كما ورد في قاعدة ص١٧.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '17' },
      },
      {
        id: 'q5b',
        type: 'classify',
        prompt: 'صنّف الكلمات الآتية إلى (فعل) أو (مصدر):',
        points: 3,
        categories: [
          { id: 'verb', label: 'فعل' },
          { id: 'src', label: 'مصدر' },
        ],
        items: [
          { id: 'v1', text: 'أَخْبَرَ', correctCategoryId: 'verb' },
          { id: 'v2', text: 'إِخْبارٌ', correctCategoryId: 'src' },
          { id: 'v3', text: 'زَرَعَ', correctCategoryId: 'verb' },
          { id: 'v4', text: 'زِراعَةٌ', correctCategoryId: 'src' },
        ],
        explanation: 'الفعل يرتبط بزمن، والمصدر يدل على الحدث مجرداً من الزمن.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '18' },
      },
      {
        id: 'q5c',
        type: 'fill_blank',
        prompt: 'أكمل: مصدر الفعل «ذَهَبَ» هو ............ .',
        points: 2,
        acceptedAnswers: ['ذَهَابٌ', 'ذهاب', 'ذِهاب'],
        explanation: 'وردت المطابقة «ذهب/ذهاب» ضمن تطبيق المصادر في ص١٨.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '18' },
      },
    ],
  },
  {
    id: 'q6',
    order: 6,
    title: 'السؤال السادس: هَمْزَةُ القَطْع',
    lesson: 'الدرس الثاني: بالرأي والرأي الآخر',
    branches: [
      {
        id: 'q6a',
        type: 'single_choice',
        prompt: 'وفق القاعدة، تأتي همزة القطع في أول:',
        points: 2,
        choices: [
          { id: 'a', text: 'الحروف والأسماء والأفعال' },
          { id: 'b', text: 'الأفعال المضارعة فقط' },
          { id: 'c', text: 'الأسماء الموصولة فقط' },
          { id: 'd', text: 'كل الكلمات بلا استثناء' },
        ],
        correctChoiceId: 'a',
        explanation: 'القاعدة تنص على أن همزة القطع تأتي في أول الحروف والأسماء والأفعال.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '19' },
      },
      {
        id: 'q6b',
        type: 'multi_choice',
        prompt: 'اختر الكلمتين اللتين تبدآن بهمزة قطع (يمكن اختيار أكثر من إجابة):',
        points: 2,
        choices: [
          { id: 'a', text: 'أَساسٌ' },
          { id: 'b', text: 'إِلَى' },
          { id: 'c', text: 'انْتِشارٌ' },
          { id: 'd', text: 'ذَهَبَ' },
        ],
        correctChoiceIds: ['a', 'b'],
        explanation: '«أَساس» و«إِلَى» تبدآن بهمزة قطع، أما «انتشار» فهمزته وصل و«ذهب» لا يبدأ بهمزة.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '19' },
      },
      {
        id: 'q6c',
        type: 'single_choice',
        prompt: 'ما الرسم الصحيح لكلمة «اقبالاً» بعد تصويب همزتها القطع المكسورة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'إِقْبالاً' },
          { id: 'b', text: 'أَقْبالاً' },
          { id: 'c', text: 'اقْبالاً' },
        ],
        correctChoiceId: 'a',
        explanation: '«إقبال» مصدر رباعي يبدأ بهمزة قطع مكسورة، فتكتب تحت الألف.',
        source: { lesson: 'بالرأي والرأي الآخر', page: '19' },
      },
    ],
  },
  {
    id: 'q7',
    order: 7,
    title: 'السؤال السابع: قصيدة «لُغَتي» ومعجمها',
    lesson: 'الدرس الثالث: لُغَتي',
    branches: [
      {
        id: 'q7a',
        type: 'single_choice',
        prompt: 'من شاعر قصيدة «لُغَتي» المقررة في الدرس؟',
        points: 1,
        choices: [
          { id: 'a', text: 'حليم دموس' },
          { id: 'b', text: 'أحمد شوقي' },
          { id: 'c', text: 'صالح هواري' },
          { id: 'd', text: 'حافظ إبراهيم' },
        ],
        correctChoiceId: 'a',
        explanation: 'القصيدة منشورة في ص٢٦ باسم الشاعر حليم دموس.',
        source: { lesson: 'لغتي', page: '26' },
      },
      {
        id: 'q7b',
        type: 'single_choice',
        prompt: 'ما معنى كلمة «مِداد» كما وردت في معجم الدرس؟',
        points: 2,
        choices: [
          { id: 'a', text: 'حِبْرٌ (سائل يُكتب به)' },
          { id: 'b', text: 'وَرَقٌ' },
          { id: 'c', text: 'قَلَمٌ' },
          { id: 'd', text: 'سَطْرٌ' },
        ],
        correctChoiceId: 'a',
        explanation: 'معجم ص٢٦: «مِداد: سائل يُكتب به (حبر)».',
        source: { lesson: 'لغتي', page: '26' },
      },
      {
        id: 'q7c',
        type: 'single_choice',
        prompt: 'سُمِّيَت اللغة العربية «لغةَ الضاد» لأنها:',
        points: 3,
        choices: [
          { id: 'a', text: 'اللغة التي اختصت بحرف الضاد عن غيرها من اللغات' },
          { id: 'b', text: 'لا تحتوي على حرف الضاد' },
          { id: 'c', text: 'آخر حروفها الضاد' },
          { id: 'd', text: 'كل كلماتها تحتوي على الضاد' },
        ],
        correctChoiceId: 'a',
        explanation: 'تُعرف العربية بلغة الضاد لاختصاصها بهذا الحرف.',
        source: { lesson: 'لغتي', page: '25-26' },
      },
    ],
  },
  {
    id: 'q8',
    order: 8,
    title: 'السؤال الثامن: أركان الجملة الفعلية',
    lesson: 'الدرس الثالث: لُغَتي',
    branches: [
      {
        id: 'q8a',
        type: 'fill_blank',
        prompt: 'أكمل: «تتألف الجملة الفعلية من ............، أو من ............».',
        points: 2,
        acceptedAnswers: [
          'فعل وفاعل، فعل وفاعل ومفعول به',
          'فعل وفاعل أو فعل وفاعل ومفعول به',
          'فعل وفاعل، أو فعل وفاعل ومفعول به',
          'فعل وفاعل ؛ فعل وفاعل ومفعول به',
        ],
        explanation: 'نص القاعدة في ص٢٩: «تتألف الجملة الفعلية من فعل وفاعل، أو من فعل وفاعل ومفعول به».',
        source: { lesson: 'لغتي', page: '29' },
      },
      {
        id: 'q8b',
        type: 'classify',
        prompt: 'في جملة «تَحْفَظُ اللُّغَةُ التُّراثَ»، حدّد ركن كل كلمة:',
        points: 3,
        categories: [
          { id: 'v', label: 'فعل' },
          { id: 's', label: 'فاعل' },
          { id: 'o', label: 'مفعول به' },
        ],
        items: [
          { id: 'i1', text: 'تَحْفَظُ', correctCategoryId: 'v' },
          { id: 'i2', text: 'اللُّغَةُ', correctCategoryId: 's' },
          { id: 'i3', text: 'التُّراثَ', correctCategoryId: 'o' },
        ],
        explanation: '«تحفظ» فعل، و«اللغة» فاعل مرفوع، و«التراث» مفعول به منصوب.',
        source: { lesson: 'لغتي', page: '29' },
      },
      {
        id: 'q8c',
        type: 'single_choice',
        prompt: 'أي الجمل الآتية جملة فعلية تضم الأركان الثلاثة (الفعل والفاعل والمفعول به) ظاهرة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'تَجْمَعُ اللُّغَةُ أَبْناءَها.' },
          { id: 'b', text: 'ازْدَهَرَتِ اللُّغَةُ.' },
          { id: 'c', text: 'اللُّغَةُ سِجِلُّ الأُمَّةِ.' },
          { id: 'd', text: 'العِلْمُ نُورٌ.' },
        ],
        correctChoiceId: 'a',
        explanation: '«تجمع» فعل و«اللغة» فاعل و«أبناءها» مفعول به؛ أما البقية فإما فعلية بلا مفعول أو جمل اسمية.',
        source: { lesson: 'لغتي', page: '29' },
      },
    ],
  },
  {
    id: 'q9',
    order: 9,
    title: 'السؤال التاسع: هَمْزَةُ الوَصْل',
    lesson: 'الدرس الثالث: لُغَتي',
    branches: [
      {
        id: 'q9a',
        type: 'multi_choice',
        prompt: 'اختر جميع مواضع همزة الوصل وفق قاعدة الدرس:',
        points: 3,
        choices: [
          { id: 'a', text: 'أمر الفعل الثلاثي' },
          { id: 'b', text: 'ماضي الخماسي والسداسي وأمرهما ومصدرهما' },
          { id: 'c', text: 'أسماء: ابن، ابنة، امرؤ، امرأة، اثنان، اثنتان، اسم' },
          { id: 'd', text: 'ماضي الفعل الثلاثي' },
        ],
        correctChoiceIds: ['a', 'b', 'c'],
        explanation: 'هذه المواضع الثلاثة هي التي وردت في قاعدة ص٣١، ولا تدخل فيها ماضي الثلاثي.',
        source: { lesson: 'لغتي', page: '31' },
      },
      {
        id: 'q9b',
        type: 'classify',
        prompt: 'صنّف الكلمات الآتية بحسب نوع همزتها الأولية:',
        points: 2,
        categories: [
          { id: 'wasl', label: 'همزة وصل' },
          { id: 'qat', label: 'همزة قطع' },
        ],
        items: [
          { id: 'k1', text: 'اقْرَأْ', correctCategoryId: 'wasl' },
          { id: 'k2', text: 'أَخَذَ', correctCategoryId: 'qat' },
          { id: 'k3', text: 'اسْتِفْهامٌ', correctCategoryId: 'wasl' },
        ],
        explanation: '«اقرأ» أمر ثلاثي فهمزتها وصل، و«أخذ» ماضٍ ثلاثي مبدوء بهمزة قطع، و«استفهام» مصدر سداسي فهمزته وصل.',
        source: { lesson: 'لغتي', page: '32' },
      },
      {
        id: 'q9c',
        type: 'single_choice',
        prompt: 'ما الصورة الصحيحة للكلمة المخطوطة في الجملة «إسْتَعْلَمَ الطّالِبُ عَنْ نَتيجَتِهِ» بعد التصويب؟',
        points: 2,
        choices: [
          { id: 'a', text: 'اسْتَعْلَمَ' },
          { id: 'b', text: 'إِسْتَعْلَمَ' },
          { id: 'c', text: 'أَسْتَعْلَمَ' },
        ],
        correctChoiceId: 'a',
        explanation: '«استعلم» فعل ماضٍ سداسي، لذا تُكتب همزته ألف وصل من دون همزة مرسومة.',
        source: { lesson: 'لغتي', page: '32' },
      },
    ],
  },
  {
    id: 'q10',
    order: 10,
    title: 'السؤال العاشر: نص «مُخْتَرِعٌ مِنْ بِلَادِي»',
    lesson: 'الوحدة الثانية - الدرس الأول: مُخْتَرِعٌ مِنْ بِلَادِي',
    branches: [
      {
        id: 'q10a',
        type: 'fill_blank',
        prompt: 'اذكر اسم المخترع المذكور في النص وجنسيته: ............ .',
        points: 2,
        acceptedAnswers: ['سليمان محمود السوري', 'سليمان محمود سوري', 'سليمان محمود', 'المخترع السوري سليمان محمود'],
        explanation: 'المخترع هو السوري سليمان محمود كما ورد في ص٤١.',
        source: { lesson: 'مخترع من بلادي', page: '41' },
      },
      {
        id: 'q10b',
        type: 'match',
        prompt: 'طابق كل كلمة بمعناها في سياق النص:',
        points: 3,
        pairs: [
          { id: 'p1', left: 'الدَّرَّاسَةُ', right: 'آلة لفصل الحبوب عن القش' },
          { id: 'p2', left: 'تَدَفَّقَ', right: 'سالَ بقوةٍ' },
          { id: 'p3', left: 'تَتَجَلَّى', right: 'تنكشف وتظهر' },
        ],
        explanation: 'هذه المعاني واردة في معجم ص٤١ وفي نشاط الفهم ص٤٢.',
        source: { lesson: 'مخترع من بلادي', page: '41-42' },
      },
      {
        id: 'q10c',
        type: 'single_choice',
        prompt: 'ما الاختراع الذي ابتكره بعد أن رأى أمه تخيط ثوباً بالإبرة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'ماكينة (آلة) خياطة' },
          { id: 'b', text: 'محطة إذاعة' },
          { id: 'c', text: 'سيارة تعمل بالطاقة الشمسية' },
          { id: 'd', text: 'مروحة توليد الكهرباء' },
        ],
        correctChoiceId: 'a',
        explanation: 'النص ص٤١: «رأى أُمَّهُ تخيط ثوباً بالإبرة فابتكر ماكينةَ آلةِ خياطةٍ».',
        source: { lesson: 'مخترع من بلادي', page: '41' },
      },
    ],
  },
  {
    id: 'q11',
    order: 11,
    title: 'السؤال الحادي عشر: الجُمْلَةُ الاسمية (المبتدأ والخبر)',
    lesson: 'الوحدة الثانية - الدرس الأول: مُخْتَرِعٌ مِنْ بِلَادِي',
    branches: [
      {
        id: 'q11a',
        type: 'fill_blank',
        prompt: 'أكمل: «المبتدأ اسمٌ ............ به الجملة الاسمية، والخبر اسمٌ ............ عن المبتدأ».',
        points: 2,
        acceptedAnswers: ['تبدأ، نخبر', 'تَبْدَأُ، نُخْبِرُ', 'تبدأ، يُخبر', 'تبدأ به، نخبر به'],
        explanation: 'القاعدة ص٤٥: المبتدأ اسم تبدأ به الجملة الاسمية، والخبر اسم نخبر به عن المبتدأ.',
        source: { lesson: 'مخترع من بلادي', page: '45' },
      },
      {
        id: 'q11b',
        type: 'single_choice',
        prompt: 'الضبط الصحيح لأواخر جملة «الصدق منجاة» وفق قاعدة المبتدأ والخبر هو:',
        points: 2,
        choices: [
          { id: 'a', text: 'الصِّدْقُ مَنْجَاةٌ' },
          { id: 'b', text: 'الصِّدْقَ مَنْجَاةٌ' },
          { id: 'c', text: 'الصِّدْقُ مَنْجَاةَ' },
          { id: 'd', text: 'الصِّدْقِ مَنْجَاةٍ' },
        ],
        correctChoiceId: 'a',
        explanation: 'المبتدأ والخبر اسمان مرفوعان؛ «الصدقُ» مبتدأ مرفوع و«منجاةٌ» خبر مرفوع بالتنوين.',
        source: { lesson: 'مخترع من بلادي', page: '45' },
      },
      {
        id: 'q11c',
        type: 'single_choice',
        prompt: 'في جملة «الصِّدْقُ مَنْجَاةٌ» ما إعراب كلمة «مَنْجَاةٌ»؟',
        points: 2,
        choices: [
          { id: 'a', text: 'خبر مرفوع وعلامة رفعه الضمة (تنوين الضم)' },
          { id: 'b', text: 'مفعول به منصوب' },
          { id: 'c', text: 'فاعل مرفوع بالواو' },
          { id: 'd', text: 'مضاف إليه مجرور' },
        ],
        correctChoiceId: 'a',
        explanation: '«منجاةٌ» خبر المبتدأ «الصدقُ» مرفوع وعلامة رفعه تنوين الضم لأنه اسم نكرة.',
        source: { lesson: 'مخترع من بلادي', page: '45' },
      },
    ],
  },
  {
    id: 'q12',
    order: 12,
    title: 'السؤال الثاني عشر: الهَمْزَةُ الأوَّلِيَّةُ (تطبيق)',
    lesson: 'الوحدة الثانية - الدرس الأول: مُخْتَرِعٌ مِنْ بِلَادِي',
    branches: [
      {
        id: 'q12a',
        type: 'classify',
        prompt: 'صنّف الكلمات الآتية بحسب همزتها الأولية:',
        points: 2,
        categories: [
          { id: 'wasl', label: 'همزة وصل' },
          { id: 'qat', label: 'همزة قطع' },
        ],
        items: [
          { id: 'c1', text: 'اسْتَخْرَجَ', correctCategoryId: 'wasl' },
          { id: 'c2', text: 'أَعَدَّ', correctCategoryId: 'qat' },
          { id: 'c3', text: 'انْتَصَرَ', correctCategoryId: 'wasl' },
          { id: 'c4', text: 'إِحْسَانٌ', correctCategoryId: 'qat' },
        ],
        explanation: '«استخرج» و«انتصر» ماضيان سداسي وخماسي بهمزة وصل، و«أعدّ» ماضٍ رباعي و«إحسان» مصدره فبهما همزة قطع.',
        source: { lesson: 'مخترع من بلادي', page: '46' },
      },
      {
        id: 'q12b',
        type: 'fill_blank',
        prompt: 'كلمة «ابْذِلْ» همزتها همزة ............؛ لأنها ............ .',
        points: 3,
        acceptedAnswers: ['وصل، أمر ثلاثي', 'وصل ؛ فعل أمر من الثلاثي', 'وصل، أمر الفعل الثلاثي', 'وصل فعل أمر ثلاثي'],
        explanation: '«ابذل» أمر ثلاثي من «بذل»، وأمر الثلاثي من مواضع همزة الوصل.',
        source: { lesson: 'مخترع من بلادي', page: '46' },
      },
    ],
  },
  {
    id: 'q13',
    order: 13,
    title: 'السؤال الثالث عشر: حوار «الذَّكَاءُ الاصْطِنَاعِيُّ»',
    lesson: 'الوحدة الثانية - الدرس الثاني: الذَّكَاءُ الاصْطِنَاعِيُّ',
    branches: [
      {
        id: 'q13a',
        type: 'single_choice',
        prompt: 'ما الشخصيتان المتحاورتان في النص؟',
        points: 2,
        choices: [
          { id: 'a', text: 'سامي والحاسِب' },
          { id: 'b', text: 'سامي وأبوه' },
          { id: 'c', text: 'المعلم والتلميذ' },
          { id: 'd', text: 'الحاسِب والشاشة' },
        ],
        correctChoiceId: 'a',
        explanation: 'النص حوار بين سامي (الإنسان) والحاسِب (الجهاز).',
        source: { lesson: 'الذكاء الاصطناعي', page: '51-52' },
      },
      {
        id: 'q13b',
        type: 'single_choice',
        prompt: 'متى جلس سامي أمام حاسبه الشخصي؟',
        points: 2,
        choices: [
          { id: 'a', text: 'صبيحة يوم العيد' },
          { id: 'b', text: 'مساء يوم العيد' },
          { id: 'c', text: 'أول يوم في المدرسة' },
          { id: 'd', text: 'يوم الجمعة' },
        ],
        correctChoiceId: 'a',
        explanation: 'النص ص٥١: «جلسَ سامي في صَبيحةِ يومِ العيد».',
        source: { lesson: 'الذكاء الاصطناعي', page: '51' },
      },
      {
        id: 'q13c',
        type: 'single_choice',
        prompt: 'ما معنى الفعل «أَطْرَقَ» في جملة «أَطْرَقَ الحاسِبُ حَزيناً» حسب معجم الدرس؟',
        points: 3,
        choices: [
          { id: 'a', text: 'سَكَتَ' },
          { id: 'b', text: 'ضَحِكَ' },
          { id: 'c', text: 'هَرَبَ' },
          { id: 'd', text: 'تكلم بصوت عالٍ' },
        ],
        correctChoiceId: 'a',
        explanation: 'معجم ص٥١: «أطرق: سكت».',
        source: { lesson: 'الذكاء الاصطناعي', page: '51' },
      },
    ],
  },
  {
    id: 'q14',
    order: 14,
    title: 'السؤال الرابع عشر: تَحْويلُ الجُمْلَةِ الفِعْلِيَّةِ إلى اسْمِيَّة',
    lesson: 'الوحدة الثانية - الدرس الثاني: الذَّكَاءُ الاصْطِنَاعِيُّ',
    branches: [
      {
        id: 'q14a',
        type: 'fill_blank',
        prompt: 'أكمل القاعدة: «لتحويل الجملة الفعلية إلى جملة اسمية ............».',
        points: 2,
        acceptedAnswers: ['نقدم الفاعل على الفعل', 'نُقَدِّمُ الفاعل على الفعل', 'يُقدم الفاعل على الفعل'],
        explanation: 'القاعدة ص٥٤: «لتحويل الجملة الفعلية إلى جملة اسمية نُقدِّم الفاعل على الفعل».',
        source: { lesson: 'الذكاء الاصطناعي', page: '54' },
      },
      {
        id: 'q14b',
        type: 'single_choice',
        prompt: 'حوّل الجملة «يَبْرَمِجُ الخَبيرُ الحاسِبَ» إلى جملة اسمية:',
        points: 2,
        choices: [
          { id: 'a', text: 'الخَبيرُ يَبْرَمِجُ الحاسِبَ.' },
          { id: 'b', text: 'يَبْرَمِجُ الحاسِبَ الخَبيرُ.' },
          { id: 'c', text: 'الحاسِبَ يَبْرَمِجُ الخَبيرُ.' },
          { id: 'd', text: 'الخَبيرَ يَبْرَمِجُ الحاسِبُ.' },
        ],
        correctChoiceId: 'a',
        explanation: 'بتقديم الفاعل «الخبير» على الفعل «يبرمج» تصبح الجملة اسمية.',
        source: { lesson: 'الذكاء الاصطناعي', page: '54' },
      },
      {
        id: 'q14c',
        type: 'fill_blank',
        prompt: 'الجملة التي تبدأ باسم تسمى جملة ............ .',
        points: 2,
        acceptedAnswers: ['اسمية', 'اِسْمِيَّة'],
        explanation: 'الجملة التي تبدأ باسم جملة اسمية، والمؤلفة من مبتدأ وخبر.',
        source: { lesson: 'الذكاء الاصطناعي', page: '54' },
      },
    ],
  },
  {
    id: 'q15',
    order: 15,
    title: 'السؤال الخامس عشر: التَّاءُ المَبْسوطَةُ والمَرْبوطَةُ',
    lesson: 'الوحدة الثانية - الدرس الثاني: الذَّكَاءُ الاصْطِنَاعِيُّ',
    branches: [
      {
        id: 'q15a',
        type: 'single_choice',
        prompt: 'متى تُكتب التاء مربوطة في آخر الكلمة؟',
        points: 2,
        choices: [
          { id: 'a', text: 'في آخر الاسم المفرد المؤنث' },
          { id: 'b', text: 'في آخر الفعل دائماً' },
          { id: 'c', text: 'في جمع المؤنث السالم' },
          { id: 'd', text: 'في الاسم الثلاثي الساكن الوسط' },
        ],
        correctChoiceId: 'a',
        explanation: 'القاعدة ص٥٦: «تكون التاء مربوطة في آخر الاسم المفرد المؤنث».',
        source: { lesson: 'الذكاء الاصطناعي', page: '56' },
      },
      {
        id: 'q15b',
        type: 'classify',
        prompt: 'صنّف الكلمات الآتية بحسب ما تنتهي به:',
        points: 3,
        categories: [
          { id: 'bas', label: 'تاء مبسوطة' },
          { id: 'mar', label: 'تاء مربوطة' },
        ],
        items: [
          { id: 't1', text: 'انْبَثَقَتْ', correctCategoryId: 'bas' },
          { id: 't2', text: 'رِسَالَةٌ', correctCategoryId: 'mar' },
          { id: 't3', text: 'أُمْنِيَاتٌ', correctCategoryId: 'bas' },
          { id: 't4', text: 'مَدْرَسَةٌ', correctCategoryId: 'mar' },
        ],
        explanation: '«انبثقت» فعل بتاء تأنيث مبسوطة، و«أمنيات» جمع مؤنث سالم بتاء مبسوطة؛ و«رسالة» و«مدرسة» اسمان مفردان مؤنثان بتاء مربوطة.',
        source: { lesson: 'الذكاء الاصطناعي', page: '55-57' },
      },
      {
        id: 'q15c',
        type: 'single_choice',
        prompt: 'ما سبب كتابة التاء مبسوطة في كلمة «قَرَأَتْ»؟',
        points: 3,
        choices: [
          { id: 'a', text: 'لأنها تاء تأنيث ساكنة في آخر الفعل' },
          { id: 'b', text: 'لأنها اسم مفرد مؤنث' },
          { id: 'c', text: 'لأنها جمع مؤنث سالم' },
          { id: 'd', text: 'لأنها اسم ثلاثي ساكن الوسط' },
        ],
        correctChoiceId: 'a',
        explanation: 'الأفعال المنتهية بتاء تأنيث ساكنة تُكتب تاؤها مبسوطة حسب قاعدة ص٥٥.',
        source: { lesson: 'الذكاء الاصطناعي', page: '55' },
      },
    ],
  },
];

// ============================================================
// عدّاد الفروع الكلي
// ============================================================
export function totalPoints(): number {
  return QUESTIONS.reduce(
    (sum, q) => sum + q.branches.reduce((s, b) => s + b.points, 0),
    0,
  );
}

export function totalBranches(): number {
  return QUESTIONS.reduce((sum, q) => sum + q.branches.length, 0);
}

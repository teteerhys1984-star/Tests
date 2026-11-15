export interface LessonMeta {
  id: string;
  unit: string;
  title: string;
  pages: string;
  grammarSkill: string;
  spellingSkill: string;
}

export const LESSONS: LessonMeta[] = [
  {
    id: "u1l1",
    unit: "الوحدة الأولى",
    title: "السَّمَكَةُ الذَّهَبِيَّةُ",
    pages: "8–9",
    grammarSkill: "الجملة الاسمية والجملة الفعلية",
    spellingSkill: "الهمزة الأولية: همزة القطع وهمزة الوصل",
  },
  {
    id: "u1l2",
    unit: "الوحدة الأولى",
    title: "بالرأي والرأي الآخر",
    pages: "17–20",
    grammarSkill: "المصدر",
    spellingSkill: "همزة القطع ومواضعها",
  },
  {
    id: "u1l3",
    unit: "الوحدة الأولى",
    title: "لُغَتي",
    pages: "28–32",
    grammarSkill: "أركان الجملة الفعلية: الفعل والفاعل والمفعول به",
    spellingSkill: "همزة الوصل ومواضعها",
  },
  {
    id: "u2l1",
    unit: "الوحدة الثانية",
    title: "مُخْتَرِعٌ مِنْ بِلَادِي",
    pages: "44–46",
    grammarSkill: "الجملة الاسمية: المبتدأ والخبر",
    spellingSkill: "الهمزة الأولية: مراجعة وتطبيق",
  },
  {
    id: "u2l2",
    unit: "الوحدة الثانية",
    title: "الذَّكَاءُ الاصْطِنَاعِيُّ",
    pages: "54–56",
    grammarSkill: "تحويل الجملة الفعلية إلى جملة اسمية",
    spellingSkill: "التاء المبسوطة والتاء المربوطة",
  },
];

export const EXAM_TITLE = "اختبار اللغة العربية – الصف الخامس الأساسي";
export const EXAM_SUBTITLE = "الوحدة الأولى كاملة + الدرس الأول والثاني من الوحدة الثانية | قواعد اللغة والإملاء فقط";

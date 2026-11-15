import type { LessonId, LessonSource } from "../../types/exam";

/**
 * Locked scope of the five lessons.
 *
 * Every page / unit / title below is taken from the inspected repository:
 *  - src/data/curriculumRegistry.ts
 *  - src/data/lesson{1,2,3}/sourceMeta.ts and sourceAudit.ts
 *  - src/data/unit2Lesson{1,2}/sourceMeta.ts and sourceAudit.ts
 *  - docs/source-locks/*.md
 *
 * Only the grammar (قواعد اللغة) and spelling (الإملاء) sections are assessed.
 * Unresolved source items (e.g. the teacher's unprinted dictation passage in
 * unit 2 lesson 1) are never used as the basis of a definitive answer.
 */
export const LESSONS: LessonSource[] = [
  {
    id: "unit2-lesson1",
    order: 4,
    unit: "الوحدة الثانية",
    title: "مخترع من بلادي",
    pages: "٤٤–٤٦",
    grammarPage: 45,
    spellingPage: 46,
    grammarScope: "الجملة الاسمية: المبتدأ والخبر، رفعهما بالضمة، والتمييز بين الخبر والنعت.",
    spellingScope: "الهمزة الأولية، والتمييز بين همزة القطع وهمزة الوصل في فقرة الدرس.",
    sourceLock: "docs/source-locks/unit2-lesson-01-mukhtari-min-biladi.md",
  },
  {
    id: "lesson2",
    order: 2,
    unit: "الوحدة الأولى: أحلامي وطموحاتي",
    title: "بالرأي والرأي الآخر",
    pages: "١٧–٢٠",
    grammarPage: 17,
    spellingPage: 19,
    grammarScope: "المصدر: اسم يدل على حدث مجرد من الزمن، ومطابقته بفعله.",
    spellingScope: "همزة القطع: مواضعها في الحروف والأسماء والأفعال وموضع رسمها.",
    sourceLock: "docs/source-locks/lesson-02-bil-rayi-wal-rayi-al-akhar.md",
  },
  {
    id: "lesson3",
    order: 3,
    unit: "الوحدة الأولى: أحلامي وطموحاتي",
    title: "لغتي",
    pages: "٢٩–٣٢",
    grammarPage: 29,
    spellingPage: 30,
    grammarScope: "أركان الجملة الفعلية: الفعل والفاعل والمفعول به.",
    spellingScope: "همزة الوصل في الأفعال والأسماء المعدودة.",
    sourceLock: "docs/source-locks/lesson-03-lughati.md",
  },
  {
    id: "lesson1",
    order: 1,
    unit: "الوحدة الأولى: أحلامي وطموحاتي",
    title: "السمكة الذهبية",
    pages: "٨–٩",
    grammarPage: 8,
    spellingPage: 9,
    grammarScope: "الجملة المفيدة، وأنواعها: الاسمية والفعلية.",
    spellingScope: "الهمزة الأولية: همزة القطع وهمزة الوصل والتمييز بينهما.",
    sourceLock: "docs/source-locks/lesson-01-al-smaka-al-dhahabia.md",
  },
  {
    id: "unit2-lesson2",
    order: 5,
    unit: "الوحدة الثانية",
    title: "الذكاء الاصطناعي",
    pages: "٥٤–٥٦",
    grammarPage: 54,
    spellingPage: 55,
    grammarScope: "تحويل الجملة الفعلية إلى اسمية بتقديم الفاعل على الفعل، وعكس التحويل.",
    spellingScope: "التاء المبسوطة والتاء المربوطة واختبار اللفظ عند الوقف.",
    sourceLock: "docs/source-locks/unit2-lesson-02-aldhaka-al-istinaai.md",
  },
];

export const LESSONS_BY_ID: Record<LessonId, LessonSource> = LESSONS.reduce(
  (acc, lesson) => {
    acc[lesson.id] = lesson;
    return acc;
  },
  {} as Record<LessonId, LessonSource>,
);

/** Exam order is deliberately mixed rather than textbook order. */
export const ORDERED_LESSONS: LessonSource[] = [...LESSONS].sort((a, b) => a.order - b.order);

export const SECTION_LABELS: Record<"grammar" | "spelling", string> = {
  grammar: "قواعد اللغة",
  spelling: "الإملاء",
};

export const DIFFICULTY_LABELS: Record<"basic" | "intermediate" | "advanced", string> = {
  basic: "أساسي",
  intermediate: "متوسط",
  advanced: "متقدم",
};

/** The five-lesson scope contains exactly 100 marks: 20 per lesson, 10 + 10. */
export const EXAM_META = {
  title: "قواعد اللغة والإملاء للوحدة الأولى وأول درسين من الوحدة الثانية — نموذج ثاني",
  subtitle: "الصف الخامس — اللغة العربية — نموذج ثاني",
  questionCount: 30,
  totalMarks: 100,
  teacherPassword: "somer173",
  studentQuestionsNote:
    "تغطي الأسئلة خمسة دروس من قواعد اللغة والإملاء فقط، ولا تتضمن أسئلة فهم قرائي أو مفردات أو تعبير.",
};

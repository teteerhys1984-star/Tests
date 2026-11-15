import type { Difficulty, Question, SectionId } from "../../types/exam";
import { DIFFICULTY_LABELS, LESSONS_BY_ID, ORDERED_LESSONS, SECTION_LABELS } from "../sources/lessons";
import { QUESTIONS, TOTAL_MARKS, TOTAL_SUBPARTS } from "../questions";

export interface AnswerKeyEntry {
  question: Question;
  answerLines: { label: string; prompt: string; answer: string; marks: number; explanation: string; misconception?: string; skill: string }[];
  reference: { unit: string; lessonTitle: string; page: number; section: string };
}

export const ANSWER_KEY: AnswerKeyEntry[] = QUESTIONS.map((question) => {
  const lesson = LESSONS_BY_ID[question.lessonId];
  return {
    question,
    answerLines: question.subparts.map((subpart, index) => ({
      label: ["أ", "ب", "ج", "د", "هـ", "و"][index] ?? String(index + 1),
      prompt: subpart.prompt,
      answer: subpart.correct.join(" / "),
      marks: subpart.marks,
      explanation: subpart.explanation,
      misconception: subpart.misconception,
      skill: subpart.skill,
    })),
    reference: {
      unit: lesson.unit,
      lessonTitle: lesson.title,
      page: question.page,
      section: SECTION_LABELS[question.section],
    },
  };
});

export const MARKING_RUBRIC = [
  "الدرجة الكلية للاختبار ١٠٠، وتتوزّع مناصفةً بين خمسة دروس: ٢٠ درجة لكل درس (١٠ لقواعد اللغة و١٠ للإملاء).",
  "كل فرع من فروع السؤال يُصحَّح تصحيحًا مستقلًّا وفق علامته المعلنة؛ ولا تُمنح درجة الفرع إلا إذا كانت الإجابة تامة.",
  "في أسئلة الاختيار المتعدد تُمنح درجة الفرع كاملة عند اختيار جميع الإجابات الصحيحة دون إضافة إجابة خاطئة، ولا تُمنح درجة جزئية داخل الفرع الواحد.",
  "في أسئلة الكتابة يُقبل الجواب الصحيح مع أو دون التشكيل، مع عدم قبول تغيير الحرف الذي تختبره القاعدة (مثل همزة القطع في «إحسان»).",
  "الفراغ من غير إجابة يُعدّ غير مجاب، ويُحسب ضمن الأسئلة غير المجابة بدرجة صفر.",
  "الدرجات الجزئية تتحقق عبر فروع السؤال المستقلة؛ مجموع درجات الفروع هو مجموع درجات السؤال.",
  "لا تُحتسب أي إجابة من خارج المادة المقررة في الصفحات المحددة، ولا تُقبل إجابات تعتمد على مواد مصدرية غير محسومة.",
];

const sumMarks = (section: SectionId, lessonId?: string) =>
  QUESTIONS.filter((q) => q.section === section && (!lessonId || q.lessonId === lessonId))
    .flatMap((q) => q.subparts)
    .reduce((total, s) => total + s.marks, 0);

export const LESSON_MARK_TABLE = ORDERED_LESSONS.map((lesson) => ({
  lessonId: lesson.id,
  title: lesson.title,
  order: lesson.order,
  grammar: sumMarks("grammar", lesson.id),
  spelling: sumMarks("spelling", lesson.id),
  total: sumMarks("grammar", lesson.id) + sumMarks("spelling", lesson.id),
  pages: lesson.pages,
  sourceLock: lesson.sourceLock,
  questionNumbers: QUESTIONS.filter((q) => q.lessonId === lesson.id).map((q) => q.number),
}));

export const DIFFICULTY_DISTRIBUTION = (["basic", "intermediate", "advanced"] as Difficulty[]).map(
  (level) => {
    const items = QUESTIONS.filter((q) => q.difficulty === level);
    return {
      level,
      label: DIFFICULTY_LABELS[level],
      count: items.length,
      percentage: Math.round((items.length / QUESTIONS.length) * 100),
      marks: items.reduce((sum, q) => sum + q.subparts.reduce((s, p) => s + p.marks, 0), 0),
    };
  },
);

export const KEY_STATS = {
  questions: QUESTIONS.length,
  subparts: TOTAL_SUBPARTS,
  marks: TOTAL_MARKS,
  grammarMarks: sumMarks("grammar"),
  spellingMarks: sumMarks("spelling"),
};

export const SOURCE_INTEGRITY_NOTES = [
  "النطاق محصور في قسمَي قواعد اللغة والإملاء من الدروس الخمسة المحددة فقط.",
  "لا يُستخدم نص إملاء المعلم غير المطبوع في درس «مخترع من بلادي» أساسًا لأي سؤال.",
  "المواد المصدرية المعلّمة كغير محسومة (مثل بعض صيغ الإكمال في «لغتي») لم تُحوَّل إلى أسئلة ذات إجابة قطعية.",
  "مراجع الصفحات مأخوذة من سجل المنهاج وأقفال المصادر في المستودع المستهدف، لا من تقدير خارجي.",
];

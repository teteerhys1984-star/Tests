import type { LessonMeta } from '../lib/types'

/**
 * The eight assessed lessons of Unit 1 (المنهاج السوري — الصف الخامس، الوحدة الأولى).
 * Page ranges follow the repository's lesson registry (lesson 1 → p.3–4, … lesson 8 → p.36–39).
 * `blueprint` is the required distribution of main questions and marks.
 */
export const LESSONS: LessonMeta[] = [
  { id: 'coordinates', title: 'شبكة الإحداثيات', pages: 'ص 3–4', blueprint: { questions: 3, points: 9 } },
  { id: 'line-graphs', title: 'التمثيلات البيانية بالخطوط', pages: 'ص 7–9', blueprint: { questions: 3, points: 9 } },
  { id: 'natural-numbers', title: 'الأعداد الطبيعية', pages: 'ص 10–14', blueprint: { questions: 5, points: 16 } },
  { id: 'rounding', title: 'تقريب الأعداد الطبيعية', pages: 'ص 15–18', blueprint: { questions: 4, points: 13 } },
  { id: 'add-subtract', title: 'جمع الأعداد الطبيعية وطرحها', pages: 'ص 19–22', blueprint: { questions: 5, points: 17 } },
  { id: 'angles', title: 'قياس الزوايا', pages: 'ص 23–30', blueprint: { questions: 4, points: 14 } },
  { id: 'parallelogram', title: 'متوازي الأضلاع', pages: 'ص 31–35', blueprint: { questions: 3, points: 11 } },
  { id: 'rhombus', title: 'المعيّن', pages: 'ص 36–39', blueprint: { questions: 3, points: 11 } },
]

export function lessonTitle(id: string): string {
  return LESSONS.find((l) => l.id === id)?.title ?? id
}

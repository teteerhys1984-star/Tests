import type { LessonId, LessonInfo } from "../types";

export const LESSONS: LessonInfo[] = [
  { id: 1, title: "Back to School", pages: "pp. 3–5", icon: "🎒" },
  { id: 2, title: "School Subjects", pages: "pp. 6–8", icon: "📚" },
  { id: 3, title: "My Lovely School", pages: "pp. 9–11", icon: "🏫" },
  { id: 4, title: "My Five Senses", pages: "pp. 12–14", icon: "🖐️" },
  { id: 5, title: "Revision 1", pages: "pp. 15–17", icon: "⭐" },
];

export const LESSON_IDS: LessonId[] = [1, 2, 3, 4, 5];

export function lessonById(id: LessonId): LessonInfo {
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) throw new Error(`Unknown lesson ${id}`);
  return lesson;
}

export function lessonLabel(id: LessonId): string {
  return `Lesson ${id} – ${lessonById(id).title}`;
}

export const EXAM = {
  title: "Grade 3 English Exam",
  subtitle: "Unit 1 · Lessons 1–5",
  grade: "Grade 3",
  unit: "Unit 1",
  totalQuestions: 50,
  totalMarks: 100,
  marksPerQuestion: 2,
  questionsPerLesson: 10,
} as const;

/**
 * Teacher area password ("somer173"), stored as character codes only to stop
 * it appearing as plain text in the page. This is NOT security: anyone who
 * reads the client-side code can recover it. It is a simple on-screen gate.
 */
const TEACHER_CODE = [115, 111, 109, 101, 114, 49, 55, 51];

export function checkTeacherPassword(input: string): boolean {
  return input === String.fromCharCode(...TEACHER_CODE);
}

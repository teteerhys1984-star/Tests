import { EXAM_TITLE } from "../config";
import { LessonMeta } from "../types/exam";

export { EXAM_TITLE };
export const EXAM_SUBTITLE = "Unit 1 — Lessons 1 to 5";
export const EXAM_GRADE_LABEL = "Grade 3 · Unit 1";
export const EXAM_TOTAL_QUESTIONS = 50;
export const EXAM_MARKS_PER_QUESTION = 2;
export const EXAM_TOTAL_MARKS = 100;

export const LESSONS: LessonMeta[] = [
  {
    number: 1,
    title: "Back to School",
    questionCount: 10,
    maxMarks: 20,
    pagesSummary: "Pupil's Book pp. 3–5 · Workbook pp. 3–5",
  },
  {
    number: 2,
    title: "School Subjects",
    questionCount: 10,
    maxMarks: 20,
    pagesSummary: "Pupil's Book pp. 6–8 · Workbook pp. 6–8",
  },
  {
    number: 3,
    title: "My Lovely School",
    questionCount: 10,
    maxMarks: 20,
    pagesSummary: "Pupil's Book pp. 9–11 · Workbook pp. 9–11",
  },
  {
    number: 4,
    title: "My Five Senses",
    questionCount: 10,
    maxMarks: 20,
    pagesSummary: "Pupil's Book pp. 12–14 · Workbook pp. 12–14",
  },
  {
    number: 5,
    title: "Revision 1",
    questionCount: 10,
    maxMarks: 20,
    pagesSummary: "Pupil's Book pp. 15–17 · Workbook pp. 15–17",
  },
];

export const LESSON_MAP: Record<number, LessonMeta> = Object.fromEntries(
  LESSONS.map((lesson) => [lesson.number, lesson])
);

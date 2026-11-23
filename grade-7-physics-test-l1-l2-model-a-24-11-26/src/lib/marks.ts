/**
 * علامات العرض: الحدّ الأقصى لكل فرع/حقل/سؤال كما في سلّم المصدر.
 *
 * تُحسب من مفتاح الإجابة (العلامات فقط، لا نصوص الإجابات) لتطابق الشارات
 * الظاهرة في المصدر الأصلي: «10 علامات» للسؤال، وشارة العلامة لكل فرع.
 * المفتاح موجود أصلاً في حزمة الصفحة الواحدة، فلا تسرّب جديد هنا؛ ولا يُعرض
 * أي نصّ إجابة في شاشة الاختبار.
 */

import { answerKey, QUESTION_MARKS } from "../data/answerKey";
import type { Input, Part, Question } from "../exam/types";
import type { Rubric } from "./grading";

function rubricOf(inputId: string, questionId: string): Rubric | null {
  return answerKey[questionId]?.rubric[inputId] ?? null;
}

/** الحدّ الأقصى لمعيار إدخال واحد (القيمة + الوحدة + التعويض، أو الحكم + التصحيح). */
export function inputMaxMarks(input: Input, questionId: string): number {
  const rubric = rubricOf(input.id, questionId);
  if (!rubric) return 0;
  switch (rubric.kind) {
    case "choice":
    case "text":
      return rubric.marks;
    case "number":
      return rubric.marks + (rubric.unit?.marks ?? 0) + (rubric.steps?.marks ?? 0);
    case "tf":
      return rubric.verdictMarks + (rubric.correction?.marks ?? 0);
    case "matrix":
      return rubric.rows.length * rubric.marksPerRow;
  }
}

/** مجموع علامات فرع. */
export function partMaxMarks(part: Part, questionId: string): number {
  return part.inputs.reduce((sum, input) => sum + inputMaxMarks(input, questionId), 0);
}

/** علامة السؤال الرئيسي (10 علامات لكل سؤال في هذا الاختبار). */
export function questionMaxMarks(question: Question): number {
  return QUESTION_MARKS[question.id] ?? 10;
}

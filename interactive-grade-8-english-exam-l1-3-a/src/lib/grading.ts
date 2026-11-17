import { gradeExam as sourceGrade, normalize, partIsCorrect, type ExamResult, type StudentPartAnswer } from "@/data/exam";

/** Accept the source's displayed canonical answer as well as its listed alternatives.
 * The source uses (that) to denote an optional word in the Q28 canonical answers. */
export function gradeExam(answers: Record<number, StudentPartAnswer[]>, name: string, submittedAt: number, timeSpentMs: number): ExamResult {
  const result = sourceGrade(answers, name, submittedAt, timeSpentMs);
  for (const q of result.questions) {
    q.parts.forEach((p, i) => {
      const spec = q.question.parts[i];
      const given = answers[q.question.id]?.[i];
      if (spec.kind !== "text" || typeof given !== "string" || partIsCorrect(spec, given)) return;
      const variants = spec.key.includes("(that)")
        ? [spec.key, spec.key.replace("(that) ", ""), spec.key.replace("(that)", "that")]
        : [spec.key];
      if (variants.some(v => normalize(v) === normalize(given))) { p.ok = true; q.earned++; }
    });
  }
  result.total = result.questions.reduce((s, q) => s + q.earned, 0);
  result.percent = Math.round(result.total / 100 * 100);
  for (const lesson of result.lessons) lesson.score = result.questions.filter(q => q.question.lesson === lesson.id).reduce((s, q) => s + q.earned, 0);
  return result;
}

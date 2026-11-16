import type {
  AnswerSheet,
  AnswerValue,
  ExamResult,
  LessonId,
  LessonScore,
  Part,
  Question,
  QuestionAnswers,
  QuestionResult,
} from "../types";

const round = (n: number) => Math.round(n * 100) / 100;

/** Lenient comparison for typed answers: case, extra spaces, curly quotes,
 *  hyphen-vs-space and a final full stop are ignored. Spelling is not. */
export function normalizeText(value: string): string {
  let v = value.normalize("NFKC").toLowerCase();
  v = v.replace(/[\u2018\u2019\u02BC`´]/g, "'");
  v = v.replace(/[\u2010-\u2015-]/g, " ");
  v = v.replace(/\s+/g, " ").trim();
  v = v.replace(/[.!?,;:]+$/g, "").trim();
  return v;
}

export function isPartAnswered(part: Part, value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  switch (part.kind) {
    case "choice":
    case "select":
      return typeof value === "string" && value !== "";
    case "text":
      return typeof value === "string" && value.trim() !== "";
    case "order":
      return Array.isArray(value) && value.length === part.tokens.length;
  }
}

export function isPartCorrect(part: Part, value: AnswerValue | undefined): boolean {
  if (!isPartAnswered(part, value)) return false;
  switch (part.kind) {
    case "choice":
    case "select":
      return value === part.answer;
    case "text": {
      const given = normalizeText(value as string);
      return part.accepted.some((a) => normalizeText(a) === given);
    }
    case "order": {
      const indices = value as number[];
      const built = indices.map((i) => part.tokens[i]).join(" ");
      return built === part.answer.join(" ");
    }
  }
}

export function questionMax(question: Question): number {
  return round(question.parts.reduce((sum, p) => sum + p.marks, 0));
}

export function answeredCount(question: Question, answers: QuestionAnswers | undefined) {
  const answered = question.parts.filter((p) => isPartAnswered(p, answers?.[p.id])).length;
  return { answered, total: question.parts.length };
}

export function isQuestionComplete(question: Question, answers: QuestionAnswers | undefined): boolean {
  const { answered, total } = answeredCount(question, answers);
  return answered === total;
}

export function completedQuestions(questions: Question[], sheet: AnswerSheet): number {
  return questions.filter((q) => isQuestionComplete(q, sheet[q.id])).length;
}

export function isExamComplete(questions: Question[], sheet: AnswerSheet): boolean {
  return questions.every((q) => isQuestionComplete(q, sheet[q.id]));
}

export function gradeQuestion(question: Question, answers: QuestionAnswers | undefined): QuestionResult {
  const parts = question.parts.map((part) => {
    const value = answers?.[part.id];
    const correct = isPartCorrect(part, value);
    return {
      partId: part.id,
      earned: correct ? part.marks : 0,
      max: part.marks,
      correct,
      answered: isPartAnswered(part, value),
    };
  });
  const earned = round(parts.reduce((s, p) => s + p.earned, 0));
  const max = questionMax(question);
  const status: QuestionResult["status"] = earned >= max ? "correct" : earned === 0 ? "incorrect" : "partial";
  return { questionId: question.id, lesson: question.lesson, earned, max, status, parts };
}

export function gradeExam(questions: Question[], sheet: AnswerSheet): ExamResult {
  const results = questions.map((q) => gradeQuestion(q, sheet[q.id]));
  const byLesson = {} as Record<LessonId, LessonScore>;
  ([1, 2, 3, 4, 5] as LessonId[]).forEach((id) => {
    const lessonResults = results.filter((r) => r.lesson === id);
    byLesson[id] = {
      earned: round(lessonResults.reduce((s, r) => s + r.earned, 0)),
      max: round(lessonResults.reduce((s, r) => s + r.max, 0)),
      questions: lessonResults.length,
    };
  });
  return {
    total: round(results.reduce((s, r) => s + r.earned, 0)),
    max: round(results.reduce((s, r) => s + r.max, 0)),
    correctCount: results.filter((r) => r.status === "correct").length,
    partialCount: results.filter((r) => r.status === "partial").length,
    incorrectCount: results.filter((r) => r.status === "incorrect").length,
    byLesson,
    questions: results,
  };
}

/** Builds a fully correct answer sheet (used by tests and QA). */
export function buildCorrectSheet(questions: Question[]): AnswerSheet {
  const sheet: AnswerSheet = {};
  questions.forEach((q) => {
    sheet[q.id] = {};
    q.parts.forEach((p) => {
      if (p.kind === "order") {
        const remaining = p.tokens.map((t, i) => ({ t, i }));
        sheet[q.id][p.id] = p.answer.map((word) => {
          const idx = remaining.findIndex((r) => r.t === word);
          return remaining.splice(idx, 1)[0].i;
        });
      } else if (p.kind === "text") {
        sheet[q.id][p.id] = p.accepted[0];
      } else {
        sheet[q.id][p.id] = p.answer;
      }
    });
  });
  return sheet;
}

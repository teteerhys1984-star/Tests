/**
 * التصحيح: تقويم مستقل لكل فرع (وحدة إدخال) مع علامات جزئية بحسب سلّم المصدر.
 *
 * السلّم منقول من منطق التصحيح في المصدر (`src/lib/grading.ts` هناك) ومن توزيع
 * العلامات في أسئلته، مع توثيق الحالات الحدّية:
 *  · الاختيار: معرّف الخيار الصحيح حصراً → العلامة كاملة أو صفر.
 *  · الإجابة القصيرة: مجموع معايير دلالية مستقلة (any/all/none) → علامة جزئية ممكنة.
 *  · العدد: علامة القيمة مستقلة عن علامة الوحدة وعن علامة خطوة التعويض.
 *  · صح/خطأ: علامة الحكم مستقلة عن علامة التصحيح، والتصحيح لا يُقوَّم إلا إذا حكم
 *    الطالب «خاطئة» وكانت العبارة خاطئة فعلاً (كما في المصدر).
 *  · التصنيف: علامة لكل صف على حدة.
 */

import type { Input, Question } from "../exam/types";
import { BASE_LESSONS, belongsToLesson, isSharedQuestion } from "../exam/types";
import { normalizeArabic, parseNumber, parseQuantity, type Unit } from "./physics";

export type Responses = Record<string, string>;

/* ------------------------------------------------------------------ */
/* معيار الإجابة — مفتاح التصحيح                                       */
/* ------------------------------------------------------------------ */

export type Criterion = {
  label: string;
  marks: number;
  /** يكفي نمط واحد من هذه الأنماط (نمط = تعبير نمطي بعد التطبيع). */
  any?: string[];
  /** يجب أن تظهر كل هذه الأنماط. */
  all?: string[];
  /** لا يجوز أن يظهر أي من هذه الأنماط (تُبطل المعيار). */
  none?: string[];
};

export type Rubric =
  | { kind: "choice"; marks: number; answer: string }
  | { kind: "text"; marks: number; criteria: Criterion[]; model: string }
  | {
      kind: "number";
      marks: number;
      value: number;
      tolerance?: number;
      unit: { options: string[]; answer: Unit; marks: number } | null;
      steps: { marks: number; all: string[]; label: string; model: string } | null;
      model: string;
    }
  | {
      kind: "tf";
      verdict: "true" | "false";
      verdictMarks: number;
      correction: { marks: number; criteria: Criterion[]; model: string } | null;
    }
  | { kind: "matrix"; marksPerRow: number; rows: { id: string; answer: string }[] };

export type QuestionKey = {
  explanation: string;
  solution?: string[];
  rubric: Record<string, Rubric>;
};

export type AnswerKey = Record<string, QuestionKey>;

/** العلامة القصوى لمعيار إدخال واحد. */
export function rubricMax(rubric: Rubric): number {
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

/* ------------------------------------------------------------------ */
/* تطابق المعايير النصية                                              */
/* ------------------------------------------------------------------ */

export function patternMatches(normalizedText: string, pattern: string): boolean {
  const source = normalizeArabic(pattern);
  if (!source) return false;
  try {
    return new RegExp(source, "u").test(normalizedText);
  } catch {
    return normalizedText.includes(source);
  }
}

/** هل تحقّق معيار نصي؟ any: نمط واحد يكفي — all: كل الأنماط — none: لا يظهر أيها. */
export function criterionMet(normalizedText: string, criterion: Criterion): boolean {
  if (criterion.any?.length && !criterion.any.some((pattern) => patternMatches(normalizedText, pattern))) return false;
  if (criterion.all?.length && !criterion.all.every((pattern) => patternMatches(normalizedText, pattern))) return false;
  if (criterion.none?.length && !criterion.none.every((pattern) => !patternMatches(normalizedText, pattern))) return false;
  return true;
}

export type CriterionOutcome = { label: string; marks: number; earned: number };

function gradeCriteria(text: string, criteria: Criterion[]): { marks: number; details: CriterionOutcome[] } {
  const normalized = normalizeArabic(text);
  const details = criteria.map((criterion) => ({
    label: criterion.label,
    marks: criterion.marks,
    earned: criterionMet(normalized, criterion) ? criterion.marks : 0,
  }));
  return { marks: details.reduce((sum, item) => sum + item.earned, 0), details };
}

/* ------------------------------------------------------------------ */
/* الإجابات: مفاتيح الحقول                                            */
/* ------------------------------------------------------------------ */

/** حقول الإجابة لكل معيار إدخال — تُستعمل في الواجهة وفي التصحيح وفي الاكتمال. */
export const ANSWER_KEYS = {
  verdict: (inputId: string) => `${inputId}:verdict`,
  correction: (inputId: string) => `${inputId}:correction`,
  value: (inputId: string) => `${inputId}:value`,
  unit: (inputId: string) => `${inputId}:unit`,
  steps: (inputId: string) => `${inputId}:steps`,
  matrixRow: (inputId: string, rowId: string) => `${inputId}:${rowId}`,
} as const;

const value = (responses: Responses, key: string): string => (responses[key] ?? "").toString();

/* ------------------------------------------------------------------ */
/* اكتمال الإجابة                                                     */
/* ------------------------------------------------------------------ */

/** هل أُجيب عن جميع حقول معيار إدخال واحد؟ */
export function isInputComplete(input: Input, responses: Responses): boolean {
  switch (input.kind) {
    case "choice":
    case "text":
      return value(responses, input.id).trim().length > 0;
    case "tf": {
      const verdict = value(responses, ANSWER_KEYS.verdict(input.id));
      if (!verdict) return false;
      if (verdict === "false" && input.allowsCorrection) {
        return value(responses, ANSWER_KEYS.correction(input.id)).trim().length > 0;
      }
      return true;
    }
    case "number": {
      if (!value(responses, ANSWER_KEYS.value(input.id)).trim()) return false;
      if (input.unitOptions && !value(responses, ANSWER_KEYS.unit(input.id)).trim()) return false;
      if (input.requiresSteps && !value(responses, ANSWER_KEYS.steps(input.id)).trim()) return false;
      return true;
    }
    case "matrix":
      return input.rows.every((row) => value(responses, ANSWER_KEYS.matrixRow(input.id, row.id)).trim().length > 0);
  }
}

/** هل أُجيب عن الفرع (كل معايير إدخاله)؟ */
export function isPartComplete(part: Question["parts"][number], responses: Responses): boolean {
  return part.inputs.every((input) => isInputComplete(input, responses));
}

/** هل أُجيب عن السؤال (كل فروعه)؟ */
export function isQuestionComplete(question: Question, responses: Responses): boolean {
  return question.parts.every((part) => isPartComplete(part, responses));
}

/** هل اكتمل الاختبار كله؟ التسليم لا يُسمح قبله. */
export function isExamComplete(questions: Question[], responses: Responses): boolean {
  return questions.every((question) => isQuestionComplete(question, responses));
}

/** عدد الفروع المجابة داخل سؤال — لشريط التقدّم وفهرس الأسئلة. */
export function progressOf(question: Question, responses: Responses): { done: number; total: number } {
  return {
    total: question.parts.length,
    done: question.parts.filter((part) => isPartComplete(part, responses)).length,
  };
}

/** أول سؤال غير مكتمل — يُستعمل في زر «انتقلي إلى أول سؤال ناقص». */
export function firstIncomplete(questions: Question[], responses: Responses): number {
  return questions.findIndex((question) => !isQuestionComplete(question, responses));
}

/** مجموع الفروع المُقوَّمة. */
export function countParts(questions: Question[]): number {
  return questions.reduce((sum, question) => sum + question.parts.length, 0);
}

export function isPartAnswered(response: string | undefined): boolean {
  return typeof response === "string" && response.trim().length > 0;
}

/* ------------------------------------------------------------------ */
/* النتائج                                                            */
/* ------------------------------------------------------------------ */

export type PartResult = {
  partId: string;
  /** مجموع علامات معايير الإدخال داخل الفرع. */
  earned: number;
  possible: number;
  /** إجابات الطالب المفردة في الفرع (لمفاتيح الحقول). */
  responses: Responses;
};

export type InputResult = {
  inputId: string;
  kind: Input["kind"];
  earned: number;
  possible: number;
  /** إجابة نصّية مقروءة للعرض في المراجعة والتقرير. */
  response: string;
  /** معايير التصحيح المستوفاة (للإجابات النصية والعددية وصح/خطأ). */
  criteria: CriterionOutcome[];
  /** تفصيل صفوف التصنيف. */
  rows?: { label: string; student: string; correct: string; earned: number; marks: number }[];
};

export type QuestionResult = {
  questionId: string;
  earned: number;
  possible: number;
  parts: PartResult[];
  inputs: InputResult[];
};

export type ExamResult = {
  total: number;
  possible: number;
  questions: QuestionResult[];
  /** عدد الفروع التي نالت علامتها كاملة. */
  fullParts: number;
  /** عدد الفروع ذات علامة جزئية (0 < العلامة < العلامة القصوى). */
  partialParts: number;
  /** عدد الفروع التي نالت صفراً مع وجود إجابة. */
  wrongParts: number;
  /** عدد الفروع غير المجابة. */
  emptyParts: number;
};

export type PartStatus = "correct" | "partial" | "wrong" | "empty";

export function partStatus(earned: number, possible: number, answered = true): PartStatus {
  if (!answered) return "empty";
  if (earned >= possible) return "correct";
  return earned > 0 ? "partial" : "wrong";
}

export const STATUS_AR: Record<PartStatus, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  wrong: "إجابة خاطئة",
  empty: "لم تُجب",
};

/** حروف الفروع بالعربية — تُستعمل في الواجهة والنتيجة والتقرير. */
export const BRANCH_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"] as const;

export function partLetter(index: number): string {
  return BRANCH_LETTERS[index] ?? String(index + 1);
}

/* ------------------------------------------------------------------ */
/* نصّ الإجابة المقروء                                                 */
/* ------------------------------------------------------------------ */

const round2 = (value: number) => Math.round(value * 100) / 100;

function readableAnswer(input: Input, responses: Responses): string {
  switch (input.kind) {
    case "choice": {
      const id = value(responses, input.id);
      if (!id) return "";
      return input.options.find((option) => option.id === id)?.label ?? id;
    }
    case "text":
      return value(responses, input.id).trim();
    case "tf": {
      const verdict = value(responses, ANSWER_KEYS.verdict(input.id));
      if (!verdict) return "";
      const label = verdict === "true" ? "صحيحة" : "خاطئة";
      const correction = value(responses, ANSWER_KEYS.correction(input.id)).trim();
      return correction ? `${label} — التصحيح: ${correction}` : label;
    }
    case "number": {
      const number = value(responses, ANSWER_KEYS.value(input.id)).trim();
      const unit = value(responses, ANSWER_KEYS.unit(input.id)).trim();
      const steps = value(responses, ANSWER_KEYS.steps(input.id)).trim();
      const chunks: string[] = [];
      if (steps) chunks.push(`خطوة الحل: ${steps}`);
      if (number) chunks.push(`${number}${unit ? ` ${unit}` : ""}`);
      return chunks.join(" — ");
    }
    case "matrix": {
      /* لا إجابة = نصّ فارغ (لا «—») حتى لا يُعدّ الحقل مجاباً خطأً في الملخّص والتقرير. */
      if (!input.rows.some((row) => value(responses, ANSWER_KEYS.matrixRow(input.id, row.id)).trim())) return "";
      return input.rows
        .map((row) => {
          const id = value(responses, ANSWER_KEYS.matrixRow(input.id, row.id));
          const label = id ? input.columns.find((column) => column.id === id)?.label ?? id : "—";
          return `${row.label}: ${label}`;
        })
        .join("؛ ");
    }
  }
}

/* ------------------------------------------------------------------ */
/* تقويم معيار إدخال واحد                                             */
/* ------------------------------------------------------------------ */

function gradeInput(input: Input, rubric: Rubric, responses: Responses): InputResult {
  const possible = rubricMax(rubric);
  const response = readableAnswer(input, responses);
  const base = { inputId: input.id, kind: input.kind, possible, response };

  switch (rubric.kind) {
    case "choice": {
      const chosen = value(responses, input.id).trim();
      return { ...base, earned: chosen && chosen === rubric.answer ? rubric.marks : 0, criteria: [] };
    }

    case "text": {
      const text = value(responses, input.id);
      const graded = gradeCriteria(text, rubric.criteria);
      return { ...base, earned: round2(graded.marks), criteria: graded.details };
    }

    case "number": {
      const rawNumber = value(responses, ANSWER_KEYS.value(input.id));
      const chosenUnit = value(responses, ANSWER_KEYS.unit(input.id));
      const stepsText = value(responses, ANSWER_KEYS.steps(input.id));
      const criteria: CriterionOutcome[] = [];

      /* القيمة: تُقبل وحدة مكتوبة داخل الخانة، وتُهمل (لا تُخصم) لأن الوحدة لها حقل مستقل. */
      const quantity = parseQuantity(rawNumber) ?? (parseNumber(rawNumber) !== null ? { value: parseNumber(rawNumber) as number, unit: null, unknownUnit: false } : null);
      const tolerance = rubric.tolerance ?? Math.max(0.001, Math.abs(rubric.value) * 0.001);
      const valueOk = quantity !== null && Math.abs(quantity.value - rubric.value) <= tolerance;
      if (valueOk) criteria.push({ label: "النتيجة العددية الصحيحة", marks: rubric.marks, earned: rubric.marks });
      else criteria.push({ label: "النتيجة العددية الصحيحة", marks: rubric.marks, earned: 0 });

      let earned = valueOk ? rubric.marks : 0;

      if (rubric.unit) {
        const unitOk = chosenUnit.trim() === rubric.unit.answer;
        earned += unitOk ? rubric.unit.marks : 0;
        criteria.push({
          label: `الوحدة الصحيحة (${rubric.unit.answer})`,
          marks: rubric.unit.marks,
          earned: unitOk ? rubric.unit.marks : 0,
        });
      }

      if (rubric.steps) {
        const normalized = normalizeArabic(stepsText);
        const stepsOk = normalized.length > 0 && rubric.steps.all.every((pattern) => patternMatches(normalized, pattern));
        earned += stepsOk ? rubric.steps.marks : 0;
        criteria.push({ label: rubric.steps.label, marks: rubric.steps.marks, earned: stepsOk ? rubric.steps.marks : 0 });
      }

      return { ...base, earned: round2(earned), criteria };
    }

    case "tf": {
      const verdict = value(responses, ANSWER_KEYS.verdict(input.id)).trim();
      const correction = value(responses, ANSWER_KEYS.correction(input.id));
      const criteria: CriterionOutcome[] = [];
      let earned = 0;

      const verdictOk = verdict === rubric.verdict;
      earned += verdictOk ? rubric.verdictMarks : 0;
      criteria.push({
        label: `الحكم الصحيح (${rubric.verdict === "true" ? "صحيحة" : "خاطئة"})`,
        marks: rubric.verdictMarks,
        earned: verdictOk ? rubric.verdictMarks : 0,
      });

      /* التصحيح يُقوَّم فقط إن حكم الطالب «خاطئة» وكانت العبارة خاطئة فعلاً (كما في المصدر). */
      if (rubric.correction) {
        const evaluated = rubric.verdict === "false" && verdict === "false";
        const graded = evaluated ? gradeCriteria(correction, rubric.correction.criteria) : { marks: 0, details: [] };
        earned += graded.marks;
        if (graded.details.length) criteria.push(...graded.details);
        else criteria.push({ label: "تصحيح العبارة", marks: rubric.correction.marks, earned: 0 });
      }

      return { ...base, earned: round2(earned), criteria };
    }

    case "matrix": {
      if (input.kind !== "matrix") throw new Error(`نوع غير متوافق: ${input.id}`);
      const rows = input.rows.map((row) => {
        const chosen = value(responses, ANSWER_KEYS.matrixRow(input.id, row.id));
        const expected = rubric.rows.find((item) => item.id === row.id)?.answer ?? "";
        const correctLabel = input.columns.find((column) => column.id === expected)?.label ?? expected;
        return {
          label: row.label,
          student: chosen ? input.columns.find((column) => column.id === chosen)?.label ?? chosen : "—",
          correct: correctLabel,
          earned: chosen && chosen === expected ? rubric.marksPerRow : 0,
          marks: rubric.marksPerRow,
        };
      });
      return { ...base, earned: round2(rows.reduce((sum, row) => sum + row.earned, 0)), criteria: [], rows };
    }
  }
}

/** تقويم فرع واحد = مجموع معايير إدخاله. */
export function gradePart(part: Question["parts"][number], key: QuestionKey, responses: Responses): PartResult {
  const inputs = part.inputs.map((input) => {
    const rubric = key.rubric[input.id];
    if (!rubric) throw new Error(`مفتاح مفقود للحقل: ${input.id}`);
    return gradeInput(input, rubric, responses);
  });
  return {
    partId: part.id,
    earned: round2(inputs.reduce((sum, input) => sum + input.earned, 0)),
    possible: round2(inputs.reduce((sum, input) => sum + input.possible, 0)),
    responses: Object.fromEntries(
      part.inputs.flatMap((input) =>
        Object.entries(responses).filter(([field]) => field === input.id || field.startsWith(`${input.id}:`)),
      ),
    ),
  };
}

/** تقويم حقول إدخال فرع واحد (تفصيل معروض في صفحة النتيجة والتقرير). */
export function gradeInputs(part: Question["parts"][number], key: QuestionKey, responses: Responses): InputResult[] {
  return part.inputs.map((input) => {
    const rubric = key.rubric[input.id];
    if (!rubric) throw new Error(`مفتاح مفقود للحقل: ${input.id}`);
    return gradeInput(input, rubric, responses);
  });
}

/** تقويم الاختبار كله — دالة حتمية: النتيجة نفسها في الصفحة والتقرير والحمولة. */
export function gradeExam(questions: Question[], responses: Responses, key: AnswerKey): ExamResult {
  const results = questions.map((question): QuestionResult => {
    const questionKey = key[question.id];
    if (!questionKey) throw new Error(`مفتاح مفقود للسؤال: ${question.id}`);
    const parts = question.parts.map((part) => gradePart(part, questionKey, responses));
    return {
      questionId: question.id,
      earned: round2(parts.reduce((sum, part) => sum + part.earned, 0)),
      possible: round2(parts.reduce((sum, part) => sum + part.possible, 0)),
      parts,
      inputs: question.parts.flatMap((part) => gradeInputs(part, questionKey, responses)),
    };
  });

  const allInputs = results.flatMap((question) => question.inputs);
  const empty = allInputs.filter((input) => !input.response.trim()).length;

  return {
    total: round2(results.reduce((sum, question) => sum + question.earned, 0)),
    possible: round2(results.reduce((sum, question) => sum + question.possible, 0)),
    questions: results,
    fullParts: allInputs.filter((input) => input.earned >= input.possible).length,
    partialParts: allInputs.filter((input) => input.earned > 0 && input.earned < input.possible).length,
    wrongParts: allInputs.filter((input) => input.earned === 0 && input.response.trim().length > 0).length,
    emptyParts: empty,
  };
}

/** مجموع علامات الاختبار من المفتاح — للتحقّق الآلي من 100. */
export function totalMarksFromKey(questions: Question[], key: AnswerKey): number {
  return round2(
    questions.reduce(
      (sum, question) =>
        sum +
        question.parts.reduce(
          (inner, part) => inner + part.inputs.reduce((acc, input) => acc + rubricMax(key[question.id].rubric[input.id]), 0),
          0,
        ),
      0,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* توزيع الدرسين — درسان فقط، والسؤال التركيبي حصة مشتركة               */
/* ------------------------------------------------------------------ */

export type LessonTotal = {
  /** اسم الدرس (أحد عنصري BASE_LESSONS). */
  lesson: string;
  /** العلامات المحقَّقة داخل الدرس، بما فيها حصة السؤال التركيبي. */
  earned: number;
  /** العلامة القصوى للدرس، بما فيها حصة السؤال التركيبي. */
  possible: number;
  /** عدد الأسئلة المحتسبة في الدرس (بما فيها التركيبي). */
  questions: number;
  /** عدد الأسئلة التركيبية المحتسبة في هذا الدرس. */
  sharedQuestions: number;
  /** علامة الحصة المشتركة المحقَّقة داخل هذا الدرس. */
  sharedEarned: number;
  /** العلامة القصوى للحصة المشتركة داخل هذا الدرس. */
  sharedPossible: number;
};

/**
 * توزيع العلامات على **الدرسين الأصليين فقط**.
 *
 * · لا فئة ثالثة للسؤال التركيبي: علاماته تُضاف إلى الدرسين معاً وتُعلَّم
 *   في `sharedQuestions`/`sharedPossible` كحصّة مشتركة.
 * · `reduce(possible)` قد يتجاوز مجموع الاختبار (100) بمقدار علامات الأسئلة
 *   التركيبية؛ لذلك مجموع التوزيع لا يُستعمل مقاماً للنسبة أبداً.
 */
export function lessonTotals(questions: Question[], result: ExamResult): LessonTotal[] {
  return BASE_LESSONS.map((lesson) => {
    let earned = 0;
    let possible = 0;
    let count = 0;
    let sharedQuestions = 0;
    let sharedEarned = 0;
    let sharedPossible = 0;
    questions.forEach((question, index) => {
      if (!belongsToLesson(question, lesson)) return;
      const graded = result.questions[index];
      earned += graded.earned;
      possible += graded.possible;
      count += 1;
      if (isSharedQuestion(question)) {
        sharedQuestions += 1;
        sharedEarned += graded.earned;
        sharedPossible += graded.possible;
      }
    });
    return {
      lesson,
      earned: round2(earned),
      possible: round2(possible),
      questions: count,
      sharedQuestions,
      sharedEarned: round2(sharedEarned),
      sharedPossible: round2(sharedPossible),
    };
  });
}

/**
 * حصيلة الدرسين مع كشف التداخل.
 *
 * `possible` هنا **مضاعف**: مجموع توزيع الدرسين (110 في هذا الاختبار) وليس مجموع
 * الاختبار. `sharedPossible` هو مقدار التكرار (علامات الأسئلة التركيبية **مرة واحدة**،
 * لأن كل سؤال تركيبي يظهر في درسَين)، فإذا طُرح من `possible` عاد الناتج إلى مجموع
 * الاختبار (100). لا تُستعمل هذه الدالة مقاماً لنسبة الطالب أبداً.
 */
export function lessonOverlap(questions: Question[], result: ExamResult) {
  const totals = lessonTotals(questions, result);
  const sum = (key: "earned" | "possible") => round2(totals.reduce((acc, row) => acc + row[key], 0));

  let sharedEarned = 0;
  let sharedPossible = 0;
  let sharedQuestions = 0;
  questions.forEach((question, index) => {
    if (!isSharedQuestion(question)) return;
    sharedQuestions += 1;
    sharedEarned += result.questions[index].earned;
    sharedPossible += result.questions[index].possible;
  });
  sharedEarned = round2(sharedEarned);

  const possible = sum("possible");
  const earned = sum("earned");

  return {
    /** مجموع توزيع الدرسين (قد يتجاوز مجموع الاختبار). */
    earned,
    /** مرادف `earned` للتوافق مع صياغة التقرير. */
    total: earned,
    possible,
    sharedQuestions,
    /** حصة الأسئلة التركيبية مرة واحدة — هي مقدار التكرار في المجموع. */
    sharedEarned,
    sharedPossible,
    /** مجموع الحصص المشتركة كما تظهر في صفوف الدروس. */
    perLessonSharedPossible: round2(totals.reduce((acc, row) => acc + row.sharedPossible, 0)),
    /** مجموع الاختبار الحقيقي بعد إزالة التكرار — يجب أن يساوي result.possible. */
    uniquePossible: round2(possible - sharedPossible),
    uniqueEarned: round2(earned - sharedEarned),
    examTotal: result.total,
    examPossible: result.possible,
  };
}

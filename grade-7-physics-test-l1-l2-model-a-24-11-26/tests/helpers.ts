/**
 * مساعدات الاختبار: بناء إجابات كاملة/جزئية/خاطئة من مفتاح الإجابات نفسه.
 *
 * المصدر الوحيد للحقيقة هو `src/data/answerKey.ts` — لا نصوص مكتوبة يدوياً هنا،
 * فإذا تغيّر مفتاح الإجابة يتغيّر ما تبنيه هذه الدوالّ تلقائياً.
 *
 * الاستراتيجيات:
 *   perfect      — الإجابة الصحيحة الكاملة لكل حقل (نموذج الإجابة/معايير المفتاح).
 *   partial      — إجابة ناقصة واحدة فقط في حقل واحد (لبقية الحقول إجابة كاملة).
 *   wrong        — إجابة خاطئة في كل حقل.
 *   emptyField   — إجابات كاملة إلا حقل واحد يبقى فارغاً.
 */

import { questions } from "../src/data/questions";
import { answerKey } from "../src/data/answerKey";
import type { AnswerKey, Responses, Rubric } from "../src/lib/grading";

/** تنظيف نمط معياري ليصير نصّاً عربياً عادياً. */
function patternToText(pattern: string): string {
  const first = pattern.split("|")[0];
  return first
    .replace(/\\\\s\*/g, " ")
    .replace(/\\s\*/g, " ")
    .replace(/\\\\\./g, ".")
    .replace(/\\(.)/g, "$1")
    .replace(/[()]/g, "")
    .trim();
}

/**
 * نصّ يستوفي مجموعة معايير معطاة: لكل معيار تُضاف أنماط `all` كلها (مطلوبة)،
 * ويُضاف أول بديل من `any` (يكفي واحد) — فتصير كل المعايير المطلوبة مستوفاة.
 */
function textForCriteria(criteria: { any?: string[]; all?: string[] }[]): string {
  const chunks: string[] = [];
  for (const criterion of criteria) {
    if (criterion.all?.length) chunks.push(...criterion.all.map(patternToText));
    if (criterion.any?.length) chunks.push(patternToText(criterion.any[0]));
  }
  return chunks.join(" و ");
}

/** نصّ يناقض معياراً له `none` (يستوفي كل شيء ثم يضيف النفي المُبطل). */
export function textViolatingNone(rubric: Extract<Rubric, { kind: "text" }>, index: number): string {
  const criterion = rubric.criteria[index];
  const positive = textForCriteria([criterion]);
  const forbidden = criterion.none?.[0] ? patternToText(criterion.none[0]) : "غير صحيح";
  return `${positive} و لكن ${forbidden}`;
}

export function correctValue(rubric: Rubric): Record<string, string> {
  switch (rubric.kind) {
    case "choice":
      return { "": rubric.answer };
    case "text":
      return { "": rubric.model };
    case "tf": {
      const out: Record<string, string> = { ":verdict": rubric.verdict };
      if (rubric.correction) out[":correction"] = rubric.correction.model;
      return out;
    }
    case "number": {
      const out: Record<string, string> = { ":value": String(rubric.value) };
      if (rubric.unit) out[":unit"] = rubric.unit.answer;
      if (rubric.steps) out[":steps"] = rubric.steps.model;
      return out;
    }
    case "matrix": {
      const out: Record<string, string> = {};
      for (const row of rubric.rows) out[`:${row.id}`] = row.answer;
      return out;
    }
  }
}

function wrongValue(rubric: Rubric): Record<string, string> {
  switch (rubric.kind) {
    case "choice":
      return { "": "__wrong__" };
    case "text":
      return { "": "لا أعرف" };
    case "tf":
      return { ":verdict": rubric.verdict === "true" ? "false" : "true", ...(rubric.correction ? { ":correction": "لا أعرف" } : {}) };
    case "number":
      return {
        ":value": String(rubric.value + 1234),
        ...(rubric.unit ? { ":unit": rubric.unit.options.find((option) => option !== rubric.unit!.answer) ?? "—" } : {}),
        ...(rubric.steps ? { ":steps": "خطوة خاطئة" } : {}),
      };
    case "matrix": {
      const out: Record<string, string> = {};
      for (const row of rubric.rows) out[`:${row.id}`] = row.answer === "motion" ? "shape" : "motion";
      return out;
    }
  }
}

function writeInto(target: Responses, inputId: string, values: Record<string, string>): void {
  for (const [suffix, value] of Object.entries(values)) target[inputId + suffix] = value;
}

/** خريطة إجابات لكل الحقول باستراتيجية معطّفة. */
export function buildResponses(
  mode: "perfect" | "wrong" | "empty" = "perfect",
  key: AnswerKey = answerKey,
): Responses {
  const responses: Responses = {};
  for (const question of questions) {
    for (const part of question.parts) {
      for (const input of part.inputs) {
        const rubric = key[question.id].rubric[input.id];
        writeInto(responses, input.id, mode === "wrong" ? wrongValue(rubric) : correctValue(rubric));
      }
    }
  }
  if (mode === "empty") return {};
  return responses;
}

/** إجابات كاملة إلا حقل واحد (بمعرّفه) — للاختبار «غير مجاب». */
export function responsesWithEmpty(inputId: string): Responses {
  const responses = buildResponses("perfect");
  for (const field of Object.keys(responses)) {
    if (field === inputId || field.startsWith(`${inputId}:`)) delete responses[field];
  }
  return responses;
}

/** إجابات كاملة إلا حقل واحد يُستبدل بقيمة خاطئة — للاختبار الجزئي. */
export function responsesWithWrong(inputId: string): Responses {
  const responses = buildResponses("perfect");
  const rubric = Object.values(answerKey)
    .flatMap((question) => Object.entries(question.rubric))
    .find(([id]) => id === inputId)?.[1];
  if (!rubric) throw new Error(`حقل غير معروف: ${inputId}`);
  for (const field of Object.keys(responses)) {
    if (field === inputId || field.startsWith(`${inputId}:`)) delete responses[field];
  }
  writeInto(responses, inputId, wrongValue(rubric));
  return responses;
}

/** نصّ يستوفي معايير معطاة (يُستعمل لإثبات التصحيح الجزئي للنصوص). */
export function textSatisfying(rubric: Extract<Rubric, { kind: "text" }>, criteriaIndexes: number[]): string {
  return textForCriteria(criteriaIndexes.map((index) => rubric.criteria[index]));
}

/** أول حقل إدخال من نوع معيّن. */
export function firstInputOfKind(kind: string): { questionId: string; inputId: string; rubric: Rubric } {
  for (const question of questions) {
    for (const part of question.parts) {
      for (const input of part.inputs) {
        if (input.kind === kind) return { questionId: question.id, inputId: input.id, rubric: answerKey[question.id].rubric[input.id] };
      }
    }
  }
  throw new Error(`لا حقل من النوع: ${kind}`);
}

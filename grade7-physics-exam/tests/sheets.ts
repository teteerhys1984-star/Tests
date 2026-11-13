/**
 * أوراق إجابة ثابتة تُثبت أنّ التصحيح لم يتغيّر بعد التعديل.
 *
 * الأوراق نفسها تُصحَّح بنسختَي الاختبار: النسخة الأصلية المرفوعة (تُسجَّل نتائجها في
 * tests/fixtures/grading-golden.json بواسطة tests/make-golden.ts) والنسخة الحالية
 * (tests/grading.test.ts). كل شيء هنا حتمي: لا Math.random ولا ساعة.
 *
 * لا يستعمل هذا الملف إلا دوالًّ موجودة في النسخة الأصلية، لأنّه يُشغَّل عليها أيضاً.
 */
// @ts-nocheck — exam-data.js ملف JavaScript أصلي بلا أنواع
import { QUESTIONS } from "../src/exam-data.js";

export type Answers = Record<string, unknown>;
/** قيمة يمكن للواجهة أن تحملها لفرع؛ undefined = فرع لم يُلمس. */
export type Given = unknown | undefined;

export interface Sheet {
  name: string;
  /** فهارس الأسئلة بالترتيب الذي عُرضت به على الطالب. */
  order: number[];
  answers: Answers;
}

/** مولّد صغير حتمي (mulberry32). */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CANONICAL_ORDER: number[] = QUESTIONS.map((_: unknown, index: number) => index);
export const PARTS: any[] = QUESTIONS.flatMap((q: any) => q.parts);

/** القيمة التي تحملها الواجهة عند إجابة صحيحة كاملة. */
export function correctValue(part: any): unknown {
  switch (part.kind) {
    case "mc":
      return part.answer;
    case "match":
      return part.matchAnswer;
    case "tf":
      return part.tfAnswer
        ? { judge: "صح" }
        : { judge: "خطأ", correction: part.correctionText };
    case "blank":
      return part.accept[0];
    case "numeric":
      return String(part.numeric.expected);
    case "text":
      // كل مجموعة كلمات مفتاحية تصل إلى وزن 1 (أو أكثر، ثم يُقصّ إلى 1)
      return (part.keywords ?? []).map((kw: any) => kw.alts[0]).join(" و ");
    default:
      return "";
  }
}

/** إجابة خاطئة في كل حقل. */
export function wrongValue(part: any): unknown {
  switch (part.kind) {
    case "mc":
      return part.options.find((option: string) => option !== part.answer) ?? part.answer + " ✗";
    case "match":
      return part.matchOptions.find((option: string) => option !== part.matchAnswer) ?? "لا شيء";
    case "tf":
      return { judge: part.tfAnswer ? "خطأ" : "صح" };
    case "numeric":
      return String(part.numeric.expected + 1);
    case "blank":
    case "text":
    default:
      return "لا أعرف";
  }
}

/**
 * إجابات تحصل على بعض العلامات. لا يوجد علامة جزئية إلا في:
 *   · صح/خطأ لعبارة خاطئة: نصف العلامة للحكم الصحيح، ونصفها للتصحيح (فيُحذف التصحيح هنا).
 *   · إجابة نصية: مجموع أوزان الكلمات المفتاحية (فيُذكر جزء من الكلمات فقط هنا).
 */
export function partialValues(part: any): unknown[] {
  if (part.kind === "tf" && part.tfAnswer === false) {
    return [{ judge: "خطأ" }];
  }
  if (part.kind === "text") {
    const keywords = part.keywords ?? [];
    const total = keywords.reduce((sum: number, kw: any) => sum + kw.w, 0);
    const out: unknown[] = [];
    // كل بادئة كلمات مجموع أوزانها بين 0 و1 (حصرياً) تُنتج علامة جزئية
    let weight = 0;
    for (const keyword of keywords.slice(0, -1)) {
      weight += keyword.w;
      if (weight > 0 && weight < 1) out.push([keyword.alts[0]].join(""));
    }
    if (total > 1 && keywords.length === 1) out.push(keywords[0].alts[0]);
    return out;
  }
  return [];
}

/** القيم التي يمكن للواجهة أن تحملها لفرع لم يُجب عنه. */
export function unansweredValues(part: any): Given[] {
  switch (part.kind) {
    case "mc":
    case "match":
      return [undefined, ""];
    case "tf":
      return [undefined, {}, { judge: "" }, { judge: "", correction: "  " }];
    default:
      return [undefined, "", "   "];
  }
}

function allCorrect(): Answers {
  const answers: Answers = {};
  for (const part of PARTS) answers[part.id] = correctValue(part);
  return answers;
}

/** يضيف قيم الورقة ويُسقط الفروع التي لم تُلمس. */
function withValues(values: Record<string, Given>): Answers {
  const answers: Answers = {};
  for (const [id, value] of Object.entries(values)) {
    if (value !== undefined) answers[id] = value;
  }
  return answers;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeSheets(): Sheet[] {
  const sheets: Sheet[] = [];
  const add = (name: string, answers: Answers, order: number[] = CANONICAL_ORDER) =>
    sheets.push({ name, order: [...order], answers });

  add("all-correct", allCorrect());
  add("blank", {});
  const everyWrong: Answers = {};
  for (const part of PARTS) everyWrong[part.id] = wrongValue(part);
  add("all-wrong", everyWrong);

  // فرع واحد خاطئ والباقي صحيح.
  for (const part of PARTS) add("wrong:" + part.id, { ...allCorrect(), [part.id]: wrongValue(part) });

  // فرع واحد بعلامة جزئية والباقي صحيح.
  for (const part of PARTS) {
    partialValues(part).forEach((value, index) =>
      add("partial:" + part.id + "#" + index, { ...allCorrect(), [part.id]: value })
    );
  }

  // فرع واحد بلا إجابة (بكل صورة يمكن للواجهة أن تخزّنها) والباقي صحيح.
  for (const part of PARTS) {
    unansweredValues(part).forEach((value, index) => {
      const answers: Record<string, Given> = { ...allCorrect(), [part.id]: value };
      add("unanswered:" + part.id + "#" + index, withValues(answers));
    });
  }

  // أوراق مختلطة بترتيب أسئلة مختلف.
  for (let n = 1; n <= 40; n += 1) {
    const random = seeded(2000 + n);
    const values: Record<string, Given> = {};
    for (const part of PARTS) {
      const roll = random();
      const partial = partialValues(part);
      const unanswered = unansweredValues(part);
      if (roll < 0.45) values[part.id] = correctValue(part);
      else if (roll < 0.65) values[part.id] = wrongValue(part);
      else if (roll < 0.85 && partial.length) values[part.id] = partial[Math.floor(random() * partial.length)];
      else if (roll < 0.85) values[part.id] = wrongValue(part);
      else values[part.id] = unanswered[Math.floor(random() * unanswered.length)];
    }
    add("mixed:" + n, withValues(values), shuffled(CANONICAL_ORDER, random));
  }

  for (const part of PARTS) {
    if (partialValues(part).length === 0) continue;
    const answers: Record<string, Given> = { ...allCorrect() };
    for (const other of PARTS) {
      if (other.kind === "text" || (other.kind === "tf" && other.tfAnswer === false)) {
        const partial = partialValues(other);
        if (partial.length) answers[other.id] = partial[0];
      }
    }
    add("all-partials", withValues(answers));
    break;
  }

  return sheets;
}

/**
 * Fixed answer sheets used to prove that marking is unchanged.
 *
 * The same sheets are marked by the original copy of this exam (recorded in
 * tests/fixtures/grading-golden.json by make-golden.ts) and by the current copy
 * (tests/grading.test.ts). Everything here is deterministic: no Math.random, no clock.
 */
import { QUESTIONS, type Part } from "../src/exam/data";
import type { AnswerValue } from "../src/exam/grade";

export type Answers = Record<string, AnswerValue>;
/** A value the interface can hold for a part; `undefined` is a part that was never touched. */
export type Given = AnswerValue | undefined;

export interface Sheet {
  name: string;
  /** Question ids in the order shown to the student. */
  order: number[];
  answers: Answers;
}

/** Small deterministic generator (mulberry32). */
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

export const CANONICAL_ORDER: number[] = QUESTIONS.map((question) => question.id);
export const PARTS: Part[] = QUESTIONS.flatMap((question) => question.parts);

const number = (text: string) => Number(text.replace(/[^\d.-]/g, ""));
const isPlainNumber = (text: string) => text !== "" && Number.isFinite(number(text));
const first = (accepted: string[] | undefined, fallback: string) => (accepted && accepted.length ? accepted[0] : fallback);

/** The value the interface stores for a fully correct answer. */
export function correctValue(part: Part): AnswerValue {
  switch (part.kind) {
    case "mcq":
      return part.correctOptionId ?? "";
    case "boolean":
      return String(part.correctBoolean);
    case "multi":
      return Object.fromEntries((part.blanks ?? []).map((blank) => [blank.id, first(blank.accepted, "")]));
    default:
      return first(part.accepted, "");
  }
}

/** A complete answer that is wrong in every field. */
export function wrongValue(part: Part): AnswerValue {
  switch (part.kind) {
    case "mcq": {
      const other = (part.options ?? []).find((option) => option.id !== part.correctOptionId);
      return other ? other.id : (part.correctOptionId ?? "") + "x";
    }
    case "boolean":
      return part.correctBoolean ? "false" : "true";
    case "multi":
      return Object.fromEntries(
        (part.blanks ?? []).map((blank) => [blank.id, wrongText(first(blank.accepted, ""), blank.numeric === true)])
      );
    default:
      return wrongText(first(part.accepted, ""), part.kind === "numeric");
  }
}

function wrongText(accepted: string, numeric: boolean): string {
  if (numeric && isPlainNumber(accepted)) return String(number(accepted) + 1);
  // A word appended to the accepted answer: normalizeText() keeps it, so it never matches.
  return accepted + " خطأ";
}

/**
 * Answers that earn part of the marks. This paper has no partially accepted answer of its own:
 * part marks are only split inside a «multi» part, where every blank is marked on its own.
 */
export function partialValues(part: Part): AnswerValue[] {
  if (part.kind !== "multi") return [];
  const blanks = part.blanks ?? [];
  if (blanks.length < 2) return [];
  return blanks.map((blank) =>
    Object.fromEntries(
      blanks.map((other) => [
        other.id,
        other.id === blank.id ? wrongText(first(other.accepted, ""), other.numeric === true) : first(other.accepted, ""),
      ])
    )
  );
}

/** Values the interface can hold for a part the student has not really answered. */
export function unansweredValues(part: Part): Given[] {
  switch (part.kind) {
    case "mcq":
    case "boolean":
      return [undefined];
    case "multi": {
      const blanks = part.blanks ?? [];
      const halfFilled = Object.fromEntries(
        blanks.map((blank, index) => [blank.id, index === 0 ? first(blank.accepted, "") : ""])
      );
      return [undefined, {}, halfFilled];
    }
    default:
      return [undefined, "", "   "];
  }
}

const ARABIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const grouped = (text: string, separator: string) => {
  const [integer, fraction] = text.split(".");
  const digits = integer.replace(/^\-/, "");
  const sign = integer.startsWith("-") ? "-" : "";
  const body = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return sign + body + (fraction === undefined ? "" : "." + fraction);
};

/** Ways a student may type a correct number (only the ones normalizeNumeric() accepts). */
export const NUMBER_FORMATS: Record<string, (text: string) => string> = {
  "arabic-digits": (text) => text.replace(/\d/g, (digit) => ARABIC[Number(digit)]),
  "persian-digits": (text) => text.replace(/\d/g, (digit) => PERSIAN[Number(digit)]),
  "comma-groups": (text) => grouped(text, ","),
  "arabic-thousands-separator": (text) => grouped(text, "\u066C"),
  "arabic-decimal-separator": (text) => (text.includes(".") ? text.replace(".", "\u066B") : text),
  "spaces-around": (text) => "  " + text + " ",
  "space-groups": (text) => grouped(text, " "),
  "leading-zeros": (text) => "00" + text,
  "decimal-zero": (text) => (text.includes(".") ? text + "0" : text + ".0"),
  "decimal-comma": (text) => (text.includes(".") ? text.replace(".", ",") : text),
};

/** The correct answer of a part, typed in the given number format (other kinds are unchanged). */
export function formatted(part: Part, format: (text: string) => string): AnswerValue {
  if (part.kind === "numeric") {
    const correct = first(part.accepted, "");
    return isPlainNumber(correct) ? format(correct) : correct;
  }
  if (part.kind === "multi") {
    return Object.fromEntries(
      (part.blanks ?? []).map((blank) => {
        const correct = first(blank.accepted, "");
        return [blank.id, blank.numeric === true && isPlainNumber(correct) ? format(correct) : correct];
      })
    );
  }
  return correctValue(part);
}

function allCorrect(): Answers {
  const answers: Answers = {};
  for (const part of PARTS) answers[part.id] = correctValue(part);
  return answers;
}

/** Adds the values of a sheet, leaving out the parts that were never touched. */
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

  // One part wrong, the rest correct.
  for (const part of PARTS) add("wrong:" + part.id, { ...allCorrect(), [part.id]: wrongValue(part) });

  // One part with part of its marks, the rest correct.
  for (const part of PARTS) {
    partialValues(part).forEach((value, index) =>
      add("partial:" + part.id + "#" + index, { ...allCorrect(), [part.id]: value })
    );
  }

  // One part unanswered (in every form the interface can store), the rest correct.
  for (const part of PARTS) {
    unansweredValues(part).forEach((value, index) => {
      const answers: Record<string, Given> = { ...allCorrect(), [part.id]: value };
      add("unanswered:" + part.id + "#" + index, withValues(answers));
    });
  }

  // Every number typed in another accepted way.
  for (const [name, format] of Object.entries(NUMBER_FORMATS)) {
    const answers: Answers = {};
    for (const part of PARTS) answers[part.id] = formatted(part, format);
    add("format:" + name, answers);
  }

  // Mixed sheets, in shuffled question orders.
  for (let n = 1; n <= 60; n += 1) {
    const random = seeded(1000 + n);
    const formats = Object.values(NUMBER_FORMATS);
    const values: Record<string, Given> = {};
    for (const part of PARTS) {
      const roll = random();
      const partial = partialValues(part);
      const unanswered = unansweredValues(part);
      if (roll < 0.45) values[part.id] = correctValue(part);
      else if (roll < 0.6) values[part.id] = formatted(part, formats[Math.floor(random() * formats.length)]);
      else if (roll < 0.8) values[part.id] = wrongValue(part);
      else if (roll < 0.9 && partial.length) values[part.id] = partial[Math.floor(random() * partial.length)];
      else if (roll < 0.9) values[part.id] = wrongValue(part);
      else values[part.id] = unanswered[Math.floor(random() * unanswered.length)];
    }
    add("mixed:" + n, withValues(values), shuffled(CANONICAL_ORDER, random));
  }

  return sheets;
}

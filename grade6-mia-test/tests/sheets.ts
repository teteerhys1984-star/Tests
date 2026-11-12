/**
 * Fixed answer sheets used to prove that marking is unchanged.
 *
 * The same sheets are marked by the original copy of this exam (recorded in
 * tests/fixtures/grading-golden.json by make-golden.ts) and by the current copy
 * (tests/grading.test.ts). Everything here is deterministic: no Math.random, no clock.
 */
import { allSubparts, questions } from "../src/data/questions";
import type { AnswerValue, Subpart } from "../src/types";

export type Answers = Record<string, AnswerValue>;

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

export const CANONICAL_ORDER: number[] = questions.map((question) => question.id);
export const SUBPARTS: Subpart[] = allSubparts.map((entry) => entry.subpart);

const number = (text: string) => Number(text.replace(/[^\d.-]/g, ""));
const asText = (correct: string | string[]) => (Array.isArray(correct) ? correct[0] : correct);

/** The value the interface stores for a fully correct answer. */
export function correctValue(sub: Subpart): AnswerValue {
  if (sub.type === "ordering") return [...(sub.correct as string[])];
  return asText(sub.correct);
}

/** A complete answer that is wrong in every field. */
export function wrongValue(sub: Subpart): AnswerValue {
  switch (sub.type) {
    case "mcq":
    case "tf": {
      const other = (sub.options ?? []).find((option) => option.value !== sub.correct);
      return other ? other.value : asText(sub.correct) + "x";
    }
    case "numeric": {
      const value = number(asText(sub.correct));
      return Number.isFinite(value) ? String(value + 1) : asText(sub.correct) + "1";
    }
    case "text":
      // A word appended to the accepted answer: normalizeText() keeps it, so it never matches.
      return asText(sub.correct) + " خطأ";
    case "ordering": {
      const correct = [...(sub.correct as string[])];
      // Two neighbours swapped: still a complete answer, never full marks.
      [correct[0], correct[1]] = [correct[1], correct[0]];
      return correct;
    }
  }
}

/** Answers that earn part of the marks (the accepted alternatives worth less than the part). */
export function partialValues(sub: Subpart): AnswerValue[] {
  return (sub.accepted ?? [])
    .filter((alternative) => alternative.marks < sub.marks)
    .map((alternative) => alternative.value);
}

/** Values the interface can hold for a part the student has not really answered. */
export function unansweredValues(sub: Subpart): AnswerValue[] {
  switch (sub.type) {
    case "mcq":
    case "tf":
      return [null];
    case "numeric":
    case "text":
      return [null, "", "   "];
    case "ordering": {
      const items = sub.items ?? [];
      return [null, [], items.slice(0, Math.max(0, items.length - 1))];
    }
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
  "spaces-around": (text) => "  " + text + " ",
  "space-groups": (text) => grouped(text, " "),
  "leading-zeros": (text) => "00" + text,
  "decimal-zero": (text) => (text.includes(".") ? text + "0" : text + ".0"),
  "decimal-comma": (text) => (text.includes(".") ? text.replace(".", ",") : text),
};

/** The correct answer of a part, typed in the given number format (other kinds are unchanged). */
export function formatted(sub: Subpart, format: (text: string) => string): AnswerValue {
  if (sub.type === "numeric") return format(asText(sub.correct));
  return correctValue(sub);
}

function allCorrect(): Answers {
  const answers: Answers = {};
  for (const sub of SUBPARTS) answers[sub.id] = correctValue(sub);
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
  for (const sub of SUBPARTS) everyWrong[sub.id] = wrongValue(sub);
  add("all-wrong", everyWrong);

  // One part wrong, the rest correct.
  for (const sub of SUBPARTS) add("wrong:" + sub.id, { ...allCorrect(), [sub.id]: wrongValue(sub) });

  // One part with partial credit, the rest correct.
  for (const sub of SUBPARTS) {
    partialValues(sub).forEach((value, index) =>
      add("partial:" + sub.id + "#" + index, { ...allCorrect(), [sub.id]: value })
    );
  }

  // One part unanswered (in every form the interface can store), the rest correct.
  for (const sub of SUBPARTS) {
    unansweredValues(sub).forEach((value, index) => {
      const answers = allCorrect();
      if (value === null && index === 0) delete answers[sub.id];
      else answers[sub.id] = value;
      add("unanswered:" + sub.id + "#" + index, answers);
    });
  }

  // Every number typed in another accepted way.
  for (const [name, format] of Object.entries(NUMBER_FORMATS)) {
    const answers: Answers = {};
    for (const sub of SUBPARTS) answers[sub.id] = formatted(sub, format);
    add("format:" + name, answers);
  }

  // Mixed sheets, in shuffled question orders.
  for (let n = 1; n <= 60; n += 1) {
    const random = seeded(1000 + n);
    const formats = Object.values(NUMBER_FORMATS);
    const answers: Answers = {};
    for (const sub of SUBPARTS) {
      const roll = random();
      const partial = partialValues(sub);
      const unanswered = unansweredValues(sub);
      if (roll < 0.45) answers[sub.id] = correctValue(sub);
      else if (roll < 0.6) answers[sub.id] = formatted(sub, formats[Math.floor(random() * formats.length)]);
      else if (roll < 0.8) answers[sub.id] = wrongValue(sub);
      else if (roll < 0.9 && partial.length) answers[sub.id] = partial[Math.floor(random() * partial.length)];
      else if (roll < 0.9) answers[sub.id] = wrongValue(sub);
      else {
        const value = unanswered[Math.floor(random() * unanswered.length)];
        if (value !== null) answers[sub.id] = value;
      }
    }
    add("mixed:" + n, answers, shuffled(CANONICAL_ORDER, random));
  }

  return sheets;
}

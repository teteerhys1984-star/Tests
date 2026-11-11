/**
 * Fixed answer sheets used to prove that marking is unchanged.
 *
 * The same sheets are marked by the original copy of this exam (recorded in
 * tests/fixtures/grading-golden.json by make-golden.ts) and by the current copy
 * (tests/grading.test.ts). Everything here is deterministic: no Math.random, no clock.
 */
import { ALL_SUBPARTS, QUESTIONS } from "../src/exam/data";
import type { AnswerValue, Answers, Subpart } from "../src/exam/types";

export interface Sheet {
  name: string;
  /** Question ids in the order shown to the student. */
  order: string[];
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

export const CANONICAL_ORDER: string[] = QUESTIONS.map((question) => question.id);

const number = (text: string) => Number(text.replace(/[^\d.-]/g, ""));

/** The value the interface stores for a fully correct answer. */
export function correctValue(sub: Subpart): AnswerValue {
  switch (sub.kind) {
    case "mcq":
      return sub.answer;
    case "tf":
      return sub.answer;
    case "numeric":
      return sub.answer;
    case "pair":
      return { a: String(sub.answer[0]), b: String(sub.answer[1]) };
    case "multi":
      return [...sub.answer];
    case "order":
      return [...sub.answer];
    case "compare":
      return sub.answer;
  }
}

/** A complete answer that is wrong in every field. */
export function wrongValue(sub: Subpart): AnswerValue {
  switch (sub.kind) {
    case "mcq":
      return (sub.answer + 1) % sub.options.length;
    case "tf":
      return !sub.answer;
    case "numeric":
      return String(number(sub.answer) + 1);
    case "pair":
      return { a: String(sub.answer[0] + 1), b: String(sub.answer[1] + 1) };
    case "multi":
      return sub.answer.map((value) => String(number(value) + 1));
    case "order":
      return [...sub.answer].reverse();
    case "compare":
      return sub.answer === ">" ? "<" : ">";
  }
}

/** Answers with only some fields right (pair and multi are the kinds with partial credit). */
export function partialValues(sub: Subpart): AnswerValue[] {
  if (sub.kind === "pair") {
    const [a, b] = sub.answer;
    return [
      { a: String(a), b: String(b + 1) },
      { a: String(a + 1), b: String(b) },
    ];
  }
  if (sub.kind === "multi") {
    const out: AnswerValue[] = [];
    sub.answer.forEach((_, only) => {
      out.push(sub.answer.map((value, index) => (index === only ? value : String(number(value) + 1))));
      out.push(sub.answer.map((value, index) => (index === only ? String(number(value) + 1) : value)));
    });
    return out;
  }
  if (sub.kind === "order") {
    // Two neighbours swapped: still a complete answer, never full marks.
    const swapped = [...sub.answer];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    return [swapped];
  }
  return [];
}

/** Values the interface can hold for a part the student has not really answered. */
export function unansweredValues(sub: Subpart): AnswerValue[] {
  switch (sub.kind) {
    case "mcq":
      return [null, -1, sub.options.length];
    case "tf":
      return [null];
    case "numeric":
      return [null, "", "   ", "abc"];
    case "pair":
      return [null, { a: "", b: "" }, { a: String(sub.answer[0]), b: "" }, { a: "", b: String(sub.answer[1]) }];
    case "multi":
      return [null, [], sub.answer.map((value, index) => (index === 0 ? value : ""))];
    case "order":
      return [null, [], sub.answer.slice(0, sub.answer.length - 1)];
    case "compare":
      return [null, ""];
  }
}

const ARABIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const grouped = (text: string, separator: string) => text.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

/** Ways a student may type a correct number. */
export const NUMBER_FORMATS: Record<string, (text: string) => string> = {
  "arabic-digits": (text) => text.replace(/\d/g, (digit) => ARABIC[Number(digit)]),
  "persian-digits": (text) => text.replace(/\d/g, (digit) => PERSIAN[Number(digit)]),
  "comma-groups": (text) => grouped(text, ","),
  "arabic-thousands-separator": (text) => grouped(text, "\u066C"),
  "arabic-comma-groups": (text) => grouped(text.replace(/\d/g, (digit) => ARABIC[Number(digit)]), "\u060C"),
  "spaces-around": (text) => "  " + text + " ",
  "space-groups": (text) => grouped(text, " "),
  "leading-zeros": (text) => "00" + text,
  "decimal-zero": (text) => text + ".0",
};

/** The correct answer of a part, typed in the given number format (other kinds are unchanged). */
export function formatted(sub: Subpart, format: (text: string) => string): AnswerValue {
  switch (sub.kind) {
    case "numeric":
      return format(sub.answer);
    case "pair":
      return { a: format(String(sub.answer[0])), b: format(String(sub.answer[1])) };
    case "multi":
      return sub.answer.map((value) => format(value));
    default:
      return correctValue(sub);
  }
}

function allCorrect(): Answers {
  const answers: Answers = {};
  for (const sub of ALL_SUBPARTS) answers[sub.id] = correctValue(sub);
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
  const add = (name: string, answers: Answers, order: string[] = CANONICAL_ORDER) =>
    sheets.push({ name, order: [...order], answers });

  add("all-correct", allCorrect());
  add("blank", {});
  const everyWrong: Answers = {};
  for (const sub of ALL_SUBPARTS) everyWrong[sub.id] = wrongValue(sub);
  add("all-wrong", everyWrong);

  // One part wrong, the rest correct.
  for (const sub of ALL_SUBPARTS) add("wrong:" + sub.id, { ...allCorrect(), [sub.id]: wrongValue(sub) });

  // One part with partial credit, the rest correct.
  for (const sub of ALL_SUBPARTS) {
    partialValues(sub).forEach((value, index) => add("partial:" + sub.id + "#" + index, { ...allCorrect(), [sub.id]: value }));
  }

  // One part unanswered (in every form the interface can store), the rest correct.
  for (const sub of ALL_SUBPARTS) {
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
    for (const sub of ALL_SUBPARTS) answers[sub.id] = formatted(sub, format);
    add("format:" + name, answers);
  }

  // Mixed sheets, in shuffled question orders.
  for (let n = 1; n <= 60; n += 1) {
    const random = seeded(1000 + n);
    const formats = Object.values(NUMBER_FORMATS);
    const answers: Answers = {};
    for (const sub of ALL_SUBPARTS) {
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

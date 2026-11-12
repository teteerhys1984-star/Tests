/**
 * Fixed answer sheets used to prove that marking is unchanged.
 *
 * The same sheets are marked by the original copy of this exam (recorded in
 * tests/fixtures/grading-golden.json by make-golden.ts) and by the current copy
 * (tests/grading.test.ts). Everything here is deterministic: no Math.random, no clock.
 */
import { ALL_SUBS, QUESTIONS, type Sub } from "../src/data/exam";
import type { Ans, Answers } from "../src/lib/grade";

export interface Sheet {
  name: string;
  /** Question ids in the order shown to the student. */
  order: string[];
  /** Option keys of every part that has options, in the order shown to the student. */
  optionOrder: Record<string, string[]>;
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

const optionKeys = (sub: Sub): string[] => (sub.options ?? []).map((option) => option.k);

/** The options of every part in the order of the bank. */
export function canonicalOptions(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const sub of ALL_SUBS) if (sub.options) out[sub.id] = optionKeys(sub);
  return out;
}

/** Another number. A single digit stays a single digit, because the table cells of the exam hold one digit. */
const otherNumber = (text: string): string => (text.length === 1 ? String((Number(text) + 1) % 10) : String(Number(text) + 1));

/** The value the interface stores for a fully correct answer. */
export function correctValue(sub: Sub): Ans {
  switch (sub.kind) {
    case "mcq":
      return sub.correct as string;
    case "multi":
      return [...(sub.correctSet ?? [])];
    case "order":
      return [...(sub.seq ?? [])];
    case "fields":
      return sub.fields!.map((field) => field.acc[0]);
    case "plot":
      return sub.plot!.x + "," + sub.plot!.y;
    case "tfc":
      return sub.tf!.isTrue ? { c: "T", corr: "" } : { c: "F", corr: (sub.tf!.corrAcc ?? [""])[0] };
  }
}

/** A complete answer that earns nothing. */
export function wrongValue(sub: Sub): Ans {
  switch (sub.kind) {
    case "mcq":
      return optionKeys(sub).find((key) => key !== sub.correct) as string;
    case "multi":
      return optionKeys(sub).filter((key) => !(sub.correctSet ?? []).includes(key));
    case "order": {
      // Every item one place away from where it belongs.
      const seq = sub.seq ?? [];
      return [...seq.slice(1), seq[0]];
    }
    case "fields":
      return sub.fields!.map((field) => otherNumber(field.acc[0]));
    case "plot": {
      const fig = sub.fig as { maxX: number; maxY: number };
      return ((sub.plot!.x + 1) % (fig.maxX + 1)) + "," + ((sub.plot!.y + 1) % (fig.maxY + 1));
    }
    case "tfc":
      // A true statement is wrong with «خاطئة». The correction text added here cannot be entered
      // where the part has no correction box (q08a): the interface stores { c: "F", corr: "" }
      // there, which is among unansweredValues() below and is the subject of tests/q08a.test.tsx.
      return sub.tf!.isTrue ? { c: "F", corr: "1" } : { c: "T", corr: "" };
  }
}

/** Complete answers that are only partly right (the kinds of this exam that give partial credit). */
export function partialValues(sub: Sub): Ans[] {
  switch (sub.kind) {
    case "multi": {
      const right = sub.correctSet ?? [];
      const wrong = optionKeys(sub).filter((key) => !right.includes(key));
      return [right.slice(0, 2), right.slice(0, 1), [...right, wrong[0]], [...right.slice(0, 2), wrong[0]]];
    }
    case "order": {
      const seq = sub.seq ?? [];
      const first = [...seq];
      [first[0], first[1]] = [first[1], first[0]];
      const last = [...seq];
      [last[seq.length - 2], last[seq.length - 1]] = [last[seq.length - 1], last[seq.length - 2]];
      return [first, last];
    }
    case "fields": {
      const fields = sub.fields!;
      if (fields.length < 2) return [];
      const out: Ans[] = [];
      fields.forEach((_, only) => {
        out.push(fields.map((field, index) => (index === only ? field.acc[0] : otherNumber(field.acc[0]))));
        out.push(fields.map((field, index) => (index === only ? otherNumber(field.acc[0]) : field.acc[0])));
      });
      return out;
    }
    case "plot": {
      const fig = sub.fig as { maxX: number; maxY: number };
      const { x, y } = sub.plot!;
      return [x + "," + ((y + 1) % (fig.maxY + 1)), ((x + 1) % (fig.maxX + 1)) + "," + y];
    }
    case "tfc":
      return sub.tf!.isTrue ? [] : [{ c: "F", corr: otherNumber((sub.tf!.corrAcc ?? ["0"])[0]) }];
    default:
      return [];
  }
}

/**
 * Values the interface can hold for a part the student has not really answered (undefined = nothing stored).
 * The list is as it was when the fixture was recorded from the original exam. Since the q08a fix one
 * of them is an answer: «خاطئة» with nothing written, { c: "F", corr: "" }, on the true/false part
 * that has no correction box (q08a) — complete, wrong, 0 marks. See tests/grading.test.ts, section 3.
 */
export function unansweredValues(sub: Sub): Ans[] {
  switch (sub.kind) {
    case "mcq":
      return [undefined, ""];
    case "multi":
      return [undefined, []];
    case "order": {
      const seq = sub.seq ?? [];
      return [undefined, [], seq.slice(0, seq.length - 1)];
    }
    case "fields": {
      const fields = sub.fields!;
      const out: Ans[] = [undefined, [], fields.map(() => ""), fields.map(() => "   ")];
      if (fields.length > 1) out.push(fields.map((field, index) => (index === 0 ? field.acc[0] : "")));
      return out;
    }
    case "plot":
      return [undefined, ""];
    case "tfc":
      return [undefined, { c: "", corr: "" }, { c: "F", corr: "" }, { c: "F", corr: "  " }];
  }
}

const ARABIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const grouped = (text: string, separator: string) => text.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

/** Ways of writing a correct number that the exam accepts. */
export const NUMBER_FORMATS: Record<string, (text: string) => string> = {
  "arabic-digits": (text) => text.replace(/\d/g, (digit) => ARABIC[Number(digit)]),
  "persian-digits": (text) => text.replace(/\d/g, (digit) => PERSIAN[Number(digit)]),
  "comma-groups": (text) => grouped(text, ","),
  "dot-groups": (text) => grouped(text, "."),
  "arabic-thousands-separator": (text) => grouped(text, "\u066C"),
  "arabic-comma-groups": (text) => grouped(text.replace(/\d/g, (digit) => ARABIC[Number(digit)]), "\u060C"),
  "spaces-around": (text) => "  " + text + " ",
  "space-groups": (text) => grouped(text, " "),
  "leading-zeros": (text) => "00" + text,
  "direction-marks": (text) => "\u200F" + text + "\u200E",
};

/** The correct answer of a part with its numbers written in the given format (other kinds are unchanged). */
export function formatted(sub: Sub, format: (text: string) => string): Ans {
  if (sub.kind === "fields") return sub.fields!.map((field) => format(field.acc[0]));
  if (sub.kind === "tfc" && !sub.tf!.isTrue) return { c: "F", corr: format((sub.tf!.corrAcc ?? [""])[0]) };
  return correctValue(sub);
}

function allCorrect(): Answers {
  const answers: Answers = {};
  for (const sub of ALL_SUBS) answers[sub.id] = correctValue(sub);
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
  const add = (name: string, answers: Answers, order: string[] = CANONICAL_ORDER, optionOrder: Record<string, string[]> = canonicalOptions()) =>
    sheets.push({ name, order: [...order], optionOrder, answers });

  add("all-correct", allCorrect());
  add("blank", {});
  const everyWrong: Answers = {};
  for (const sub of ALL_SUBS) everyWrong[sub.id] = wrongValue(sub);
  add("all-wrong", everyWrong);

  // One part wrong, the rest correct.
  for (const sub of ALL_SUBS) add("wrong:" + sub.id, { ...allCorrect(), [sub.id]: wrongValue(sub) });

  // One part with partial credit, the rest correct.
  for (const sub of ALL_SUBS) {
    partialValues(sub).forEach((value, index) => add("partial:" + sub.id + "#" + index, { ...allCorrect(), [sub.id]: value }));
  }

  // One part unanswered (in every form the interface can store), the rest correct.
  for (const sub of ALL_SUBS) {
    unansweredValues(sub).forEach((value, index) => {
      const answers = allCorrect();
      if (value === undefined) delete answers[sub.id];
      else answers[sub.id] = value;
      add("unanswered:" + sub.id + "#" + index, answers);
    });
  }

  // Every number written in another accepted way.
  for (const [name, format] of Object.entries(NUMBER_FORMATS)) {
    const answers: Answers = {};
    for (const sub of ALL_SUBS) answers[sub.id] = formatted(sub, format);
    add("format:" + name, answers);
  }

  // Mixed sheets, with the questions and the options in shuffled orders.
  for (let n = 1; n <= 60; n += 1) {
    const random = seeded(2000 + n);
    const formats = Object.values(NUMBER_FORMATS);
    const answers: Answers = {};
    for (const sub of ALL_SUBS) {
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
        if (value !== undefined) answers[sub.id] = value;
      }
    }
    const optionOrder: Record<string, string[]> = {};
    for (const sub of ALL_SUBS) {
      if (sub.options) optionOrder[sub.id] = sub.noShuffle ? optionKeys(sub) : shuffled(optionKeys(sub), random);
    }
    add("mixed:" + n, answers, shuffled(CANONICAL_ORDER, random), optionOrder);
  }

  return sheets;
}

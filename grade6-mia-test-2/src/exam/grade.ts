import {
  QUESTION_BY_ID,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_PARTS,
  type Part,
  type Question,
} from "./data";

export type AnswerValue = string | Record<string, string>;
export type Answers = Record<string, AnswerValue>;

export interface PartResult {
  partId: string;
  questionId: number;
  partLabel: string;
  status: "correct" | "partial" | "incorrect" | "unanswered";
  answered: boolean;
  awarded: number;
  max: number;
  givenText: string;
  correctText: string;
}

export interface QuestionResult {
  question: Question;
  position: number;
  parts: PartResult[];
  awarded: number;
  max: number;
}

export interface GradeResult {
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
  answeredParts: number;
  totalParts: number;
  questions: QuestionResult[];
}

export function westernizeDigits(input: string): string {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const ai = arabic.indexOf(ch);
    if (ai >= 0) return String(ai);
    const ei = eastern.indexOf(ch);
    return ei >= 0 ? String(ei) : ch;
  });
}

export function normalizeNumeric(input: string): string {
  let value = westernizeDigits(input)
    .trim()
    .replace(/[\u00A0\u202F\s]/g, "")
    .replace(/\u066C/g, "")
    .replace(/\u066B/g, ".");
  value = value.replace(/[^\d.,-]/g, "");
  const minus = value.startsWith("-") ? "-" : "";
  value = value.replace(/-/g, "");
  if (value.includes(",") && value.includes(".")) {
    value = value.replace(/,/g, "");
  } else if (value.includes(",")) {
    if (/^\d{1,3}(,\d{3})+$/.test(value)) {
      value = value.replace(/,/g, "");
    } else {
      value = value.replace(/,/g, ".");
    }
  }
  return minus + value;
}

export function normalizeText(input: string): string {
  return westernizeDigits(input)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[.,،؛:!؟?()"'«»_\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sameNumeric(a: string, b: string): boolean {
  const na = normalizeNumeric(a);
  const nb = normalizeNumeric(b);
  if (!na || !nb) return false;
  const fa = Number(na);
  const fb = Number(nb);
  if (Number.isFinite(fa) && Number.isFinite(fb)) {
    return Math.abs(fa - fb) < 1e-9;
  }
  return na === nb;
}

function answerMatches(raw: string, accepted: string[], numeric?: boolean): boolean {
  if (!raw || !raw.trim()) return false;
  if (numeric) return accepted.some((a) => sameNumeric(raw, a));
  const given = normalizeText(raw);
  if (!given) return false;
  const expected = accepted.map(normalizeText);
  return expected.includes(given);
}

export function isPartAnswered(part: Part, value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (part.kind === "multi") {
    if (typeof value === "string") return false;
    return (part.blanks ?? []).every(
      (blank) => typeof value[blank.id] === "string" && value[blank.id].trim() !== ""
    );
  }
  return typeof value === "string" && value.trim() !== "";
}

function selectedOptionLabel(part: Part, value: string): string {
  const found = part.options?.find((o) => o.id === value);
  return found ? found.label : value;
}

function blankValue(value: AnswerValue | undefined, blankId: string): string {
  if (!value || typeof value === "string") return "";
  return value[blankId] ?? "";
}

export function gradePart(part: Part, value: AnswerValue | undefined): PartResult {
  const answered = isPartAnswered(part, value);
  let awarded = 0;
  let givenText = "";
  const max = part.marks;

  if (part.kind === "mcq") {
    const raw = typeof value === "string" ? value : "";
    if (raw === part.correctOptionId) awarded = max;
    givenText = raw ? selectedOptionLabel(part, raw) : "";
  } else if (part.kind === "boolean") {
    const raw = typeof value === "string" ? value : "";
    if (raw && part.correctBoolean !== undefined && raw === String(part.correctBoolean)) {
      awarded = max;
    }
    givenText = raw === "true" ? "صحيح" : raw === "false" ? "خطأ" : "";
  } else if (part.kind === "multi") {
    const blanks = part.blanks ?? [];
    const pieces: string[] = [];
    for (const blank of blanks) {
      const raw = blankValue(value, blank.id);
      if (answerMatches(raw, blank.accepted, blank.numeric)) {
        awarded += blank.marks;
      }
      pieces.push(`${texToText(blank.label)}: ${raw.trim() || "—"}`);
    }
    givenText = pieces.join(" | ");
  } else {
    const raw = typeof value === "string" ? value : "";
    if (answerMatches(raw, part.accepted ?? [], part.kind === "numeric")) {
      awarded = max;
    } else if (
      answered &&
      part.partialAccepted &&
      part.partialAccepted.length > 0 &&
      answerMatches(raw, part.partialAccepted, part.kind === "numeric")
    ) {
      awarded = Math.max(1, Math.min(max - 1, part.partialMarks ?? max - 1));
    }
    givenText = raw.trim();
  }

  let status: PartResult["status"];
  if (!answered) status = "unanswered";
  else if (awarded === max) status = "correct";
  else if (awarded > 0) status = "partial";
  else status = "incorrect";

  return {
    partId: part.id,
    questionId: part.id.startsWith("q") ? Number(part.id.match(/^q(\d+)/)?.[1] ?? 0) : 0,
    partLabel: part.label,
    status,
    answered,
    awarded,
    max,
    givenText: givenText || "—",
    correctText: texToText(part.answerText),
  };
}

export function gradeAttempt(answers: Answers, order: number[]): GradeResult {
  const questionsResults: QuestionResult[] = [];
  let score = 0;
  let correct = 0;
  let partial = 0;
  let incorrect = 0;
  let unanswered = 0;
  let answeredParts = 0;

  order.forEach((questionId, index) => {
    const question = QUESTION_BY_ID.get(questionId);
    if (!question) return;
    const partResults: PartResult[] = question.parts.map((part) => {
      const result = gradePart(part, answers[part.id]);
      score += result.awarded;
      if (result.answered) answeredParts += 1;
      if (result.status === "correct") correct += 1;
      else if (result.status === "partial") partial += 1;
      else if (result.status === "incorrect") incorrect += 1;
      else unanswered += 1;
      return result;
    });
    questionsResults.push({
      question,
      position: index + 1,
      parts: partResults,
      awarded: partResults.reduce((s, p) => s + p.awarded, 0),
      max: question.parts.reduce((s, p) => s + p.marks, 0),
    });
  });

  return {
    score,
    totalMarks: TOTAL_MARKS,
    percentage: Math.round((score / TOTAL_MARKS) * 10000) / 100,
    correct,
    partial,
    incorrect,
    unanswered,
    answeredParts,
    totalParts: TOTAL_PARTS,
    questions: questionsResults,
  };
}

export function countUnanswered(answers: Answers, order: number[]): number {
  let count = 0;
  const questionIds = order.length ? order : QUESTIONS.map((q) => q.id);
  for (const questionId of questionIds) {
    const question = QUESTION_BY_ID.get(questionId);
    if (!question) continue;
    for (const part of question.parts) {
      if (!isPartAnswered(part, answers[part.id])) count += 1;
    }
  }
  return count;
}

const superscripts: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
  "+": "⁺",
};

export function texToText(input: string): string {
  let text = input;
  text = text.replace(/\$([^$]*)\$/g, "$1");
  text = text.replace(
    /\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g,
    (_m, a: string, b: string) => `${a}/${b}`
  );
  text = text.replace(
    /\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
    (_m, a: string, b: string) => `${a}/${b}`
  );
  text = text.replace(/\\widehat\{([^{}]*)\}/g, "زاوية $1");
  text = text.replace(/\\angle/g, "∠");
  text = text.replace(/\\parallel/g, "∥");
  text = text.replace(/\\perp/g, "⟂");
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\div/g, "÷");
  text = text.replace(/\\circ/g, "°");
  text = text.replace(/\\square/g, "□");
  text = text.replace(/\\le/g, "≤");
  text = text.replace(/\\ge/g, "≥");
  text = text.replace(/\\neq/g, "≠");
  text = text.replace(/\\,/g, ",");
  text = text.replace(/\\;/g, " ");
  text = text.replace(/\^\{([^{}]+)\}/g, (_m, exp: string) =>
    [...exp].map((ch) => superscripts[ch] ?? ch).join("")
  );
  text = text.replace(/\^([0-9+-])/g, (_m, exp: string) => superscripts[exp] ?? exp);
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\\/g, "");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function statusArabic(status: PartResult["status"]): string {
  switch (status) {
    case "correct":
      return "صحيحة";
    case "partial":
      return "صحيحة جزئياً";
    case "incorrect":
      return "خاطئة";
    default:
      return "دون إجابة";
  }
}

export function marksWord(marks: number): string {
  if (marks === 1) return "علامة واحدة";
  if (marks === 2) return "علامتان";
  if (marks >= 3 && marks <= 10) return `${marks} علامات`;
  return `${marks} علامة`;
}

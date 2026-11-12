import type {
  ClassificationPart,
  FieldsPart,
  MatchPart,
  OrderPart,
  Part,
  Question,
  ShortPart,
  TfPart,
} from "../data/exam";
import { QUESTIONS } from "../data/exam";

export type AnswerValue = unknown;
export type AnswerMap = Record<string, AnswerValue>;
export type PartStatus = "correct" | "partial" | "incorrect" | "unanswered";

export type PartScore = {
  partId: string;
  awarded: number;
  available: number;
  answered: boolean;
  status: PartStatus;
  note: string;
};

export type QuestionScore = {
  questionId: string;
  awarded: number;
  available: number;
  parts: PartScore[];
};

export type ExamSummary = {
  totalAwarded: number;
  totalAvailable: number;
  percentage: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
  subparts: number;
  questions: QuestionScore[];
};

const normalizeSubscripts: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "-",
};

export const toEnglishDigits = (value: string): string =>
  value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
  );

export const normalizeArabic = (value: string): string => {
  let s = toEnglishDigits(String(value ?? ""));
  s = s.replace(/[₀-₉⁰-⁹⁺⁻]/g, (ch) => normalizeSubscripts[ch] ?? ch);
  s = s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[،؛]/g, " ")
    .replace(/[.!?():;"'«»]/g, " ")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return s;
};

export const canonicalFormula = (value: string): string => {
  let s = toEnglishDigits(String(value ?? ""));
  s = s.replace(/[₀-₉⁰-⁹⁺⁻]/g, (ch) => normalizeSubscripts[ch] ?? ch);
  s = s.replace(/[−–—]/g, "-").replace(/\s+/g, "").toLowerCase();
  return s;
};

const parseNumber = (value: string): number | null => {
  const s = toEnglishDigits(String(value ?? "")).replace(/,/g, ".").trim();
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
};

const matchesPhrase = (haystack: string, needleRaw: string): boolean => {
  const needle = normalizeArabic(needleRaw);
  if (!needle) return false;
  if (needle.includes(" ")) return haystack.includes(needle);
  if (needle.length <= 4) {
    const words = haystack.split(" ");
    return words.includes(needle) || haystack.startsWith(needle + " ") || haystack.includes(" " + needle + " ");
  }
  return haystack.includes(needle);
};

export const countMatchedGroups = (value: string, groups: string[][]): number => {
  const hay = normalizeArabic(value);
  if (!hay) return 0;
  return groups.reduce((count, group) => (group.some((alt) => matchesPhrase(hay, alt)) ? count + 1 : count), 0);
};

const tfAnswer = (answer: unknown): { judgment: "true" | "false" | null; correction: string } => {
  if (!answer || typeof answer !== "object") return { judgment: null, correction: "" };
  const a = answer as { judgment?: unknown; correction?: unknown };
  const judgment = a.judgment === true || a.judgment === "true" ? "true" : a.judgment === false || a.judgment === "false" ? "false" : null;
  return { judgment, correction: typeof a.correction === "string" ? a.correction : "" };
};

export const isPartAnswered = (part: Part, answer: AnswerValue): boolean => {
  if (answer === undefined || answer === null) return false;
  switch (part.type) {
    case "mc":
    case "lewis-select":
      return typeof answer === "string" && part.options.some((o) => o.id === answer);
    case "multi":
      return Array.isArray(answer) && answer.length > 0 && answer.every((id) => part.options.some((o) => o.id === id));
    case "tf": {
      const { judgment, correction } = tfAnswer(answer);
      if (!judgment) return false;
      if (judgment === "false") return correction.trim().length >= 2;
      return true;
    }
    case "fields":
      return part.fields.every((f) => {
        const v = (answer as Record<string, unknown>)[f.id];
        return typeof v === "string" && v.trim().length > 0;
      });
    case "short":
      return typeof answer === "string" && answer.trim().length >= 2;
    case "order":
      return (
        Array.isArray(answer) &&
        answer.length === part.items.length &&
        part.items.every((i) => answer.includes(i.id))
      );
    case "match":
      return part.rows.every((r) => typeof (answer as Record<string, unknown>)[r.id] === "string" && String((answer as Record<string, unknown>)[r.id]).length > 0);
    case "classification":
      return part.items.every((r) => typeof (answer as Record<string, unknown>)[r.id] === "string" && String((answer as Record<string, unknown>)[r.id]).length > 0);
    default:
      return false;
  }
};

const scoreStatus = (awarded: number, available: number): PartStatus => {
  if (awarded >= available - 0.001) return "correct";
  if (awarded > 0.001) return "partial";
  return "incorrect";
};

const fieldIsCorrect = (field: FieldsPart["fields"][number], raw: unknown): boolean => {
  const value = typeof raw === "string" ? raw : "";
  if (!value.trim()) return false;
  if (field.kind === "number") {
    const expected = Number(field.answer);
    const actual = parseNumber(value);
    return actual !== null && Math.abs(actual - expected) < 0.001;
  }
  const allAccepted = [field.answer, ...(field.accepted ?? [])];
  if (field.kind === "formula") {
    const canonical = canonicalFormula(value);
    return allAccepted.some((a) => canonicalFormula(a) === canonical);
  }
  return allAccepted.some((a) => normalizeArabic(a) === normalizeArabic(value));
};

export const gradePart = (part: Part, answer: AnswerValue): PartScore => {
  const available = part.marks;
  if (!isPartAnswered(part, answer)) {
    return { partId: part.id, awarded: 0, available, answered: false, status: "unanswered", note: "لم تُجب عن هذا الجزء." };
  }
  let awarded = 0;
  let note = "";
  switch (part.type) {
    case "mc": {
      const correct = part.options.find((o) => o.correct)?.id ?? part.options.find((o) => o.id === "b")?.id ?? "";
      awarded = answer === correct ? available : 0;
      note = awarded === available ? "اختيار صحيح." : "الاختيار غير صحيح.";
      break;
    }
    case "lewis-select": {
      const selected = answer as string;
      if (part.multi) {
        const selectedIds = (Array.isArray(answer) ? answer : [selected]) as string[];
        const correctOptions = part.options.filter((o) => o.correct);
        const correctPicked = correctOptions.filter((o) => selectedIds.includes(o.id)).length;
        const wrongPicked = part.options.filter((o) => !o.correct && selectedIds.includes(o.id)).length;
        const raw = ((correctPicked - wrongPicked) / Math.max(correctOptions.length, 1)) * available;
        awarded = Math.max(0, Math.min(available, raw));
        note = "تُحسب كل اختيار صحيح ويُخصم الاختيار الخاطئ من مقدار الدرجة.";
      } else {
        const correct = part.options.find((o) => o.correct)?.id ?? "";
        awarded = selected === correct ? available : 0;
        note = awarded === available ? "تمثيل صحيح." : "التمثيل غير صحيح.";
      }
      break;
    }
    case "multi": {
      const selected = (Array.isArray(answer) ? answer : []) as string[];
      const decisions = part.options.length;
      const right = part.options.reduce((acc, o) => {
        const shouldPick = Boolean(o.correct);
        const picked = selected.includes(o.id);
        return acc + (shouldPick === picked ? 1 : 0);
      }, 0);
      awarded = (right / decisions) * available;
      note = `أُجيب بشكل صحيح عن ${right} من أصل ${decisions} قرارات خيارات.`;
      break;
    }
    case "tf": {
      const { judgment, correction } = tfAnswer(answer);
      const correctJudgment = part.answer ? "true" : "false";
      const half = available / 2;
      if (judgment === correctJudgment) awarded += half;
      if (!part.answer) {
        const matched = countMatchedGroups(correction, part.correctionGroups);
        awarded += (matched / Math.max(part.correctionGroups.length, 1)) * half;
      } else if (judgment === correctJudgment) {
        awarded += half;
      }
      note = judgment === correctJudgment ? "الحكم صحيح؛ يُقيَّم التصحيح وفق عناصره العلمية." : "الحكم غير صحيح.";
      break;
    }
    case "fields": {
      let earned = 0;
      let right = 0;
      part.fields.forEach((field) => {
        if (fieldIsCorrect(field, (answer as Record<string, unknown>)[field.id])) {
          earned += field.marks;
          right += 1;
        }
      });
      awarded = earned;
      note = `إجابات صحيحة في ${right} من أصل ${part.fields.length} خانات.`;
      break;
    }
    case "short": {
      const text = String(answer ?? "");
      const matched = countMatchedGroups(text, part.groups);
      awarded = (matched / Math.max(part.groups.length, 1)) * available;
      note = `تحققت ${matched} من ${part.groups.length} من العناصر العلمية المطلوبة.`;
      break;
    }
    case "order": {
      const studentOrder = (Array.isArray(answer) ? answer : []) as string[];
      const right = part.correct.reduce((acc, id, idx) => (studentOrder[idx] === id ? acc + 1 : acc), 0);
      awarded = (right / part.correct.length) * available;
      note = `ترتيب صحيح لـ${right} من أصل ${part.correct.length} خطوات.`;
      break;
    }
    case "match": {
      const answers = answer as Record<string, string>;
      const right = part.rows.filter((r) => answers[r.id] === r.answer).length;
      awarded = (right / part.rows.length) * available;
      note = `ربط صحيح لـ${right} من أصل ${part.rows.length} بنود.`;
      break;
    }
    case "classification": {
      const answers = answer as Record<string, string>;
      const right = part.items.filter((r) => answers[r.id] === r.answer).length;
      awarded = (right / part.items.length) * available;
      note = `تصنيف صحيح لـ${right} من أصل ${part.items.length} مواد.`;
      break;
    }
  }
  awarded = Math.round(Math.min(available, Math.max(0, awarded)) * 100) / 100;
  return { partId: part.id, awarded, available, answered: true, status: scoreStatus(awarded, available), note };
};

export const gradeExam = (answers: AnswerMap, questions: Question[] = QUESTIONS): ExamSummary => {
  const questionScores: QuestionScore[] = questions.map((q) => {
    const parts = q.parts.map((p) => gradePart(p, answers[p.id]));
    return {
      questionId: q.id,
      awarded: Math.round(parts.reduce((s, p) => s + p.awarded, 0) * 100) / 100,
      available: q.parts.reduce((s, p) => s + p.marks, 0),
      parts,
    };
  });
  const flat = questionScores.flatMap((q) => q.parts);
  const totalAwarded = Math.round(flat.reduce((s, p) => s + p.awarded, 0) * 100) / 100;
  const totalAvailable = flat.reduce((s, p) => s + p.available, 0);
  return {
    totalAwarded,
    totalAvailable,
    percentage: totalAvailable ? Math.round((totalAwarded / totalAvailable) * 10000) / 100 : 0,
    correct: flat.filter((p) => p.status === "correct").length,
    partial: flat.filter((p) => p.status === "partial").length,
    incorrect: flat.filter((p) => p.status === "incorrect").length,
    unanswered: flat.filter((p) => p.status === "unanswered").length,
    subparts: flat.length,
    questions: questionScores,
  };
};

export const countUnanswered = (answers: AnswerMap, questions: Question[] = QUESTIONS): number =>
  questions.reduce((total, q) => total + q.parts.filter((p) => !isPartAnswered(p, answers[p.id])).length, 0);

export const totalMarks = QUESTIONS.reduce((s, q) => s + q.parts.reduce((x, p) => x + p.marks, 0), 0);
export const totalSubparts = QUESTIONS.reduce((s, q) => s + q.parts.length, 0);

export const scoreLabel = (awarded: number, available: number): string => {
  const rounded = Math.round(awarded * 100) / 100;
  return `${rounded} / ${available}`;
};

/* ---------------- Formatting helpers for reports and review ------------- */

const TF_TEXT = (v: string) => (v === "true" ? "صواب" : v === "false" ? "خطأ" : "—");

export const formatStudentAnswer = (part: Part, answer: AnswerValue): string => {
  if (!isPartAnswered(part, answer)) return "لم تُجب.";
  switch (part.type) {
    case "mc":
    case "lewis-select":
      return part.options.find((o) => o.id === answer)?.label ?? String(answer);
    case "multi":
      return part.options.filter((o) => (answer as string[]).includes(o.id)).map((o) => o.label).join(" • ");
    case "tf": {
      const a = tfAnswer(answer);
      return `الحكم: ${TF_TEXT(a.judgment ?? "")}${a.correction.trim() ? ` — التصحيح: ${a.correction.trim()}` : ""}`;
    }
    case "fields":
      return part.fields
        .map((f) => `${f.label}: ${String((answer as Record<string, unknown>)[f.id] ?? "").trim() || "—"}`)
        .join(" | ");
    case "short":
      return String(answer ?? "").trim();
    case "order":
      return (answer as string[])
        .map((id, i) => `${i + 1}) ${part.items.find((x) => x.id === id)?.label ?? id}`)
        .join(" ← ");
    case "match":
      return part.rows
        .map((r) => `${r.label}: ${part.choices.find((c) => c.id === (answer as Record<string, string>)[r.id])?.label ?? "—"}`)
        .join(" | ");
    case "classification":
      return part.items
        .map((r) => `${r.label}: ${(answer as Record<string, string>)[r.id] ?? "—"}`)
        .join(" | ");
    default:
      return String(answer);
  }
};

export const formatCorrectAnswer = (part: Part): string => {
  switch (part.type) {
    case "mc":
    case "lewis-select":
      return part.solution ?? part.options.find((o) => o.correct)?.label ?? "";
    case "multi":
      return part.solution ?? part.options.filter((o) => o.correct).map((o) => o.label).join(" • ");
    case "tf":
      return `${part.answer ? "صواب" : "خطأ"} — التصحيح النموذجي: ${(part as TfPart).correctionExample}`;
    case "fields":
      return (
        part.solution ??
        (part as FieldsPart).fields.map((f) => `${f.label}: ${f.answer}`).join(" | ")
      );
    case "short":
      return part.solution ?? (part as ShortPart).sample;
    case "order":
      return (
        part.solution ??
        (part as OrderPart).correct.map((id, i) => `${i + 1}) ${part.items.find((x) => x.id === id)?.label ?? id}`).join(" ← ")
      );
    case "match":
      return (
        part.solution ??
        (part as MatchPart).rows
          .map((r) => `${r.label}: ${part.choices.find((c) => c.id === r.answer)?.label ?? r.answer}`)
          .join(" | ")
      );
    case "classification":
      return (
        part.solution ??
        (part as ClassificationPart).items.map((x) => `${x.label}: ${x.answer}`).join(" | ")
      );
    default:
      return "";
  }
};

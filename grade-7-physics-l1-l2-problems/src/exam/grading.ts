import { lessons, type LessonId, type Level } from "../content/problems";
import { questionSpecs } from "./spec";
import type {
  ExamResult,
  GradedQuestion,
  GradedSubpart,
  LessonBreakdown,
  LevelBreakdown,
  QuestionStatus,
  SubpartSpec,
} from "./types";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeDigits(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const idx1 = ARABIC_INDIC.indexOf(ch);
    if (idx1 !== -1) {
      out += String(idx1);
      continue;
    }
    const idx2 = EASTERN_ARABIC.indexOf(ch);
    if (idx2 !== -1) {
      out += String(idx2);
      continue;
    }
    if (ch === "٫" || ch === "،" || ch === ",") {
      out += ".";
      continue;
    }
    out += ch;
  }
  return out.trim();
}

export function parseNumericInput(raw: string, allowColonDuration = false): number | null {
  const cleaned = normalizeDigits(raw);
  if (!cleaned) return null;

  // Support hh:mm duration when allowColonDuration is true (e.g. 2:30 -> 2.5)
  if (allowColonDuration) {
    const hm = cleaned.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*(?:h|hr|hrs|ساعة|ساعات)?)?$/i);
    if (hm) {
      const h = Number(hm[1]);
      const m = Number(hm[2]);
      if (Number.isFinite(h) && Number.isFinite(m) && m >= 0 && m < 60) {
        return h + m / 60;
      }
    }
  }

  // Support pure fraction a/b (with optional unit text after)
  const fracMatch = cleaned.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?:\s+.*)?$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
  }

  // Support numeric literal optionally followed by units (e.g. "72 km/h", "10.8 م/ث", "15 دقيقة")
  const numMatch = cleaned.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:\s*[^\d.:/+-].*)?$/);
  if (numMatch) {
    const val = Number(numMatch[1]);
    return Number.isFinite(val) ? val : null;
  }

  return null;
}

export function parseClockTime(raw: string): string | null {
  const cleaned = normalizeDigits(raw)
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/(?:صباحا|ص|am|a\.m\.)/gi, "")
    .trim();
  if (!cleaned) return null;
  const m = cleaned.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function roundMarks(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMarks(value: number): string {
  const rounded = roundMarks(value);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function gradeSubpart(spec: SubpartSpec, rawValue: string | undefined): GradedSubpart {
  const raw = (rawValue ?? "").trim();
  if (!raw) {
    return {
      spec,
      rawAnswer: "",
      displayAnswer: "لم يُجب",
      status: "unanswered",
      awarded: 0,
      max: spec.marks,
    };
  }

  if (spec.kind === "mcq") {
    const chosen = spec.options?.find((o) => o.id === raw);
    const isCorrect = raw === spec.correctOptionId;
    return {
      spec,
      rawAnswer: raw,
      displayAnswer: chosen ? chosen.label : raw,
      status: isCorrect ? "correct" : "wrong",
      awarded: isCorrect ? spec.marks : 0,
      max: spec.marks,
    };
  }

  if (spec.kind === "clock") {
    const parsed = parseClockTime(raw);
    const isCorrect = parsed !== null && parsed === spec.expectedClock;
    return {
      spec,
      rawAnswer: raw,
      displayAnswer: raw,
      status: isCorrect ? "correct" : "wrong",
      awarded: isCorrect ? spec.marks : 0,
      max: spec.marks,
    };
  }

  const parsed = parseNumericInput(raw, spec.kind === "durationHours");
  const expected = spec.expectedNumber ?? 0;
  const tol = spec.tolerance ?? 1e-4;
  const isCorrect = parsed !== null && Math.abs(parsed - expected) <= tol;

  return {
    spec,
    rawAnswer: raw,
    displayAnswer: raw,
    status: isCorrect ? "correct" : "wrong",
    awarded: isCorrect ? spec.marks : 0,
    max: spec.marks,
  };
}

export function questionStatusFromSubparts(subparts: GradedSubpart[]): QuestionStatus {
  const total = subparts.length;
  const unanswered = subparts.filter((s) => s.status === "unanswered").length;
  const correct = subparts.filter((s) => s.status === "correct").length;

  if (unanswered === total) return "unanswered";
  if (correct === total) return "correct";
  if (correct > 0) return "partial";
  return "wrong";
}

export function gradeLabelForPercentage(pct: number): string {
  if (pct >= 90) return "ممتاز";
  if (pct >= 80) return "جيد جدًا";
  if (pct >= 70) return "جيد";
  if (pct >= 60) return "مقبول";
  return "يحتاج إلى مراجعة";
}

export function gradeExam(responses: Record<string, string>): ExamResult {
  const gradedQuestions: GradedQuestion[] = questionSpecs.map((q) => {
    const gradedSubs = q.subparts.map((sp) => gradeSubpart(sp, responses[sp.id]));
    const awarded = roundMarks(gradedSubs.reduce((acc, s) => acc + s.awarded, 0));
    return {
      problemId: q.problemId,
      lessonId: q.lessonId,
      number: q.number,
      title: q.title,
      level: q.level,
      status: questionStatusFromSubparts(gradedSubs),
      awarded,
      max: q.maxMarks,
      subparts: gradedSubs,
    };
  });

  const total = roundMarks(gradedQuestions.reduce((acc, q) => acc + q.awarded, 0));
  const max = roundMarks(gradedQuestions.reduce((acc, q) => acc + q.max, 0));
  const percentage = max > 0 ? Math.round((total / max) * 1000) / 10 : 0;

  const questionCounts = {
    correct: gradedQuestions.filter((q) => q.status === "correct").length,
    partial: gradedQuestions.filter((q) => q.status === "partial").length,
    wrong: gradedQuestions.filter((q) => q.status === "wrong").length,
    unanswered: gradedQuestions.filter((q) => q.status === "unanswered").length,
    total: gradedQuestions.length,
  };

  const allSubs = gradedQuestions.flatMap((q) => q.subparts);
  const subpartCounts = {
    correct: allSubs.filter((s) => s.status === "correct").length,
    wrong: allSubs.filter((s) => s.status === "wrong").length,
    unanswered: allSubs.filter((s) => s.status === "unanswered").length,
    total: allSubs.length,
  };

  const lessonIds: LessonId[] = ["motion", "force"];
  const lessonBreakdowns: LessonBreakdown[] = lessonIds.map((id) => {
    const qs = gradedQuestions.filter((q) => q.lessonId === id);
    const awarded = roundMarks(qs.reduce((acc, q) => acc + q.awarded, 0));
    const lMax = roundMarks(qs.reduce((acc, q) => acc + q.max, 0));
    return {
      lessonId: id,
      title: lessons[id].title,
      awarded,
      max: lMax,
      percentage: lMax > 0 ? Math.round((awarded / lMax) * 1000) / 10 : 0,
      correctCount: qs.filter((q) => q.status === "correct").length,
      partialCount: qs.filter((q) => q.status === "partial").length,
      wrongCount: qs.filter((q) => q.status === "wrong").length,
      unansweredCount: qs.filter((q) => q.status === "unanswered").length,
    };
  });

  const levelOrder: Level[] = ["تأسيسي", "متوسط", "تحدٍّ"];
  const levelBreakdowns: LevelBreakdown[] = levelOrder.map((lvl) => {
    const qs = gradedQuestions.filter((q) => q.level === lvl);
    return {
      level: lvl,
      awarded: roundMarks(qs.reduce((acc, q) => acc + q.awarded, 0)),
      max: roundMarks(qs.reduce((acc, q) => acc + q.max, 0)),
      count: qs.length,
    };
  });

  return {
    total,
    max,
    percentage,
    gradeLabel: gradeLabelForPercentage(percentage),
    questions: gradedQuestions,
    questionCounts,
    subpartCounts,
    lessons: lessonBreakdowns,
    levels: levelBreakdowns,
  };
}

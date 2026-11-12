import { QUESTIONS, SUB_INDEX, type Sub } from "../data/exam";
import { normNum, toWestern } from "./text";

export type Ans = string | string[] | { c: "T" | "F" | ""; corr: string } | undefined;
export type Answers = Record<string, Ans>;

export type Status = "correct" | "partial" | "incorrect" | "unanswered";

export interface GradedSub {
  subId: string;
  qId: string;
  letter: string;
  marks: number;
  awarded: number;
  status: Status;
  studentText: string;
  correctText: string;
}

export function isAnswered(sub: Sub, a: Ans): boolean {
  if (a === undefined || a === null) return false;
  switch (sub.kind) {
    case "mcq":
    case "plot":
      return typeof a === "string" && a !== "";
    case "multi":
      return Array.isArray(a) && a.length > 0;
    case "order":
      return Array.isArray(a) && a.length === (sub.options?.length ?? 0);
    case "fields": {
      const n = sub.fields?.length ?? 0;
      return Array.isArray(a) && a.length >= n && Array.from({ length: n }, (_, i) => (a[i] ?? "").trim() !== "").every(Boolean);
    }
    case "tfc": {
      const v = a as { c: string; corr: string };
      if (!v || !v.c) return false;
      // «خاطئة» needs a written correction only where the part has a correction box (tf.corrLabel).
      // A part without one — q08a, whose statement is true — is complete with either choice.
      return v.c === "T" || (v.c === "F" && !sub.tf?.corrLabel) || (v.corr ?? "").trim() !== "";
    }
  }
  return false;
}

const optText = (sub: Sub, k: string) => sub.options?.find((o) => o.k === k)?.t ?? k;
const w = (s: string) => toWestern(s);

export function describeStudent(sub: Sub, a: Ans): string {
  if (!isAnswered(sub, a)) return "(لم تتم الإجابة)";
  switch (sub.kind) {
    case "mcq":
      return w(optText(sub, a as string));
    case "plot": {
      const [x, y] = (a as string).split(",");
      return `نقطة عند (${x} ، ${y})`;
    }
    case "multi":
      return (a as string[]).map((k) => w(optText(sub, k))).join(" ، ");
    case "order":
      return (a as string[]).map((k) => w(optText(sub, k))).join(" ← ");
    case "fields":
      return (a as string[])
        .slice(0, sub.fields!.length)
        .map((v, i) => {
          const lab = sub.fields![i].label;
          return (lab ? lab + ": " : "") + w(v.trim());
        })
        .join(" | ");
    case "tfc": {
      const v = a as { c: string; corr: string };
      if (v.c === "T") return "صحيحة";
      // «خاطئة» alone where nothing was written (possible only without a correction box).
      const corr = w((v.corr ?? "").trim());
      return corr ? `خاطئة — التصحيح: ${corr}` : "خاطئة";
    }
  }
  return "";
}

export function fractionFor(sub: Sub, a: Ans): number {
  if (!isAnswered(sub, a)) return 0;
  switch (sub.kind) {
    case "mcq":
      return a === sub.correct ? 1 : 0;
    case "multi": {
      const sel = a as string[];
      const set = sub.correctSet ?? [];
      const good = sel.filter((k) => set.includes(k)).length;
      const bad = sel.length - good;
      return Math.max(0, (good - bad) / set.length);
    }
    case "order": {
      const sel = a as string[];
      const seq = sub.seq ?? [];
      const k = seq.filter((x, i) => sel[i] === x).length;
      if (k === seq.length) return 1;
      if (k === seq.length - 2) return 0.5;
      return 0;
    }
    case "fields": {
      const fs = sub.fields!;
      const arr = a as string[];
      let ok = 0;
      fs.forEach((f, i) => {
        const v = normNum(arr[i] ?? "");
        if (f.acc.some((x) => normNum(x) === v)) ok++;
      });
      return ok / fs.length;
    }
    case "plot": {
      const [x, y] = (a as string).split(",").map(Number);
      const t = sub.plot!;
      const okx = x === t.x;
      const oky = y === t.y;
      if (okx && oky) return 1;
      return okx || oky ? 0.5 : 0;
    }
    case "tfc": {
      const v = a as { c: string; corr: string };
      const tf = sub.tf!;
      if (tf.isTrue) return v.c === "T" ? 1 : 0;
      if (v.c !== "F") return 0;
      const okc = (tf.corrAcc ?? []).some((x) => normNum(x) === normNum(v.corr));
      return 0.5 + (okc ? 0.5 : 0);
    }
  }
  return 0;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface GradeResult {
  items: GradedSub[];
  total: number;
  max: number;
  percent: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
}

export function gradeAll(answers: Answers): GradeResult {
  const items: GradedSub[] = [];
  let total = 0;
  let max = 0;
  let correct = 0,
    partial = 0,
    incorrect = 0,
    unanswered = 0;
  for (const q of QUESTIONS) {
    for (const s of q.subs) {
      const a = answers[s.id];
      const answered = isAnswered(s, a);
      const frac = answered ? fractionFor(s, a) : 0;
      const awarded = round2(s.marks * frac);
      let status: Status;
      if (!answered) status = "unanswered";
      else if (frac >= 1) status = "correct";
      else if (frac > 0) status = "partial";
      else status = "incorrect";
      if (status === "correct") correct++;
      else if (status === "partial") partial++;
      else if (status === "incorrect") incorrect++;
      else unanswered++;
      total += awarded;
      max += s.marks;
      items.push({
        subId: s.id,
        qId: q.id,
        letter: SUB_INDEX[s.id].letter,
        marks: s.marks,
        awarded,
        status,
        studentText: describeStudent(s, a),
        correctText: w(s.answerText),
      });
    }
  }
  total = round2(total);
  return { items, total, max, percent: round2((total / max) * 100), correct, partial, incorrect, unanswered };
}

export const STATUS_AR: Record<Status, string> = {
  correct: "صحيحة",
  partial: "صحيحة جزئياً",
  incorrect: "خاطئة",
  unanswered: "بلا إجابة",
};

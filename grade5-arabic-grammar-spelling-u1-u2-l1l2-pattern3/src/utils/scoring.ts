import type { Subpart } from "../data/questions/types";

export function normalizeArabic(s: string, strictHamza = false): string {
  let t = s.trim().replace(/\s+/g, " ");
  // strip diacritics/tashkeel
  t = t.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
  if (!strictHamza) {
    t = t.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  }
  return t;
}

export interface SubpartResult {
  subpart: Subpart;
  studentAnswer: string;
  earned: number;
  correct: boolean;
  partial: boolean;
}

export function scoreSubpart(sp: Subpart, answer: string): SubpartResult {
  const ans = (answer ?? "").trim();
  if (!ans) return { subpart: sp, studentAnswer: ans, earned: 0, correct: false, partial: false };

  if (sp.type === "mcq" || sp.type === "select") {
    const strict = !!sp.strictHamza;
    const ok = strict ? ans === sp.correctAnswer : normalizeArabic(ans) === normalizeArabic(sp.correctAnswer);
    return { subpart: sp, studentAnswer: ans, earned: ok ? sp.maxMarks : 0, correct: ok, partial: false };
  }

  if (sp.type === "fill" || sp.type === "correct") {
    const strict = !!sp.strictHamza;
    const candidates = [sp.correctAnswer, ...(sp.acceptedAnswers ?? [])];
    const normAns = normalizeArabic(ans, strict);
    const hit = candidates.some((c) => {
      const n = normalizeArabic(c, strict);
      return n === normAns || normAns.includes(n) || n.includes(normAns);
    });
    return { subpart: sp, studentAnswer: ans, earned: hit ? sp.maxMarks : 0, correct: hit, partial: false };
  }

  // free: keyword-based partial credit
  const kws = sp.keywords ?? [];
  if (kws.length === 0) {
    const ok = normalizeArabic(ans, true).includes(normalizeArabic(sp.correctAnswer, true).slice(0, 8));
    return { subpart: sp, studentAnswer: ans, earned: ok ? sp.maxMarks : 0, correct: ok, partial: false };
  }
  const normAns = normalizeArabic(ans, true);
  const matched = kws.filter((k) => normAns.includes(normalizeArabic(k, true))).length;
  const ratio = matched / kws.length;
  let earned = Math.round((ratio * sp.maxMarks) * 2) / 2;
  // require minimum meaningful length for any credit on longer rubrics
  if (ans.length < 4) earned = 0;
  const correct = earned >= sp.maxMarks;
  const partial = earned > 0 && !correct;
  return { subpart: sp, studentAnswer: ans, earned, correct, partial };
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function performanceLevel(pct: number): string {
  if (pct >= 90) return "ممتازة – أداء رائع";
  if (pct >= 75) return "جيدة جدًا – أداء قوي";
  if (pct >= 60) return "جيدة – تحتاج إلى تعزيز بسيط";
  if (pct >= 50) return "مقبولة – تحتاج إلى مراجعة";
  return "تحتاج إلى إعادة دراسة الدروس";
}

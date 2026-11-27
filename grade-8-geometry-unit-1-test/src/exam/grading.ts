import type {
  Answers,
  ClozeBlank,
  ClozeValue,
  ExamGrade,
  GradeLine,
  MatchValue,
  NumericValue,
  Part,
  PartGrade,
  PlotValue,
  Question,
  QuestionGrade,
  TfValue,
} from "./types";

/* ───────────────────────── numeric helpers ───────────────────────── */

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** Parses a student number: accepts Arabic-Indic digits, `,`/`٫` decimals, units. */
export function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d] ?? d);
  s = s.replace(/[٫,]/g, ".");
  s = s.replace(/[\u2212\u2013\u2014]/g, "-");
  s = s.replace(/\s|cm|mm|°|سم|مم|درجة/gi, "");
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function nearly(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}

/** Rounds to the nearest quarter mark — the exam's partial-credit grain. */
export function q4(x: number): number {
  return Math.round(x * 4) / 4;
}

/* ───────────────────────── geometry kernels ───────────────────────── */

export type Vec = { x: number; y: number };

export function translationVector(from: Vec, to: Vec): Vec {
  return { x: to.x - from.x, y: to.y - from.y };
}

export function applyTranslation(p: Vec, v: Vec): Vec {
  return { x: p.x + v.x, y: p.y + v.y };
}

/** Fourth vertex D of parallelogram ABCD (A→B→C→D in order). */
export function fourthVertex(a: Vec, b: Vec, c: Vec): Vec {
  return { x: a.x + c.x - b.x, y: a.y + c.y - b.y };
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Vec, b: Vec): Vec {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** True when ABCD (in that cyclic order) is a non-degenerate parallelogram. */
export function isParallelogram(a: Vec, b: Vec, c: Vec, d: Vec, tol = 1e-9): boolean {
  const ab = translationVector(a, b);
  const dc = translationVector(d, c);
  const cross = ab.x * (c.y - b.y) - ab.y * (c.x - b.x);
  return nearly(ab.x, dc.x, tol) && nearly(ab.y, dc.y, tol) && Math.abs(cross) > tol;
}

export function samePoint(a: Vec, b: Vec, tol = 1e-9): boolean {
  return nearly(a.x, b.x, tol) && nearly(a.y, b.y, tol);
}

/** SSS congruence check on two triangles given as vertex triples. */
export function sssCongruent(t1: [Vec, Vec, Vec], t2: [Vec, Vec, Vec], tol = 1e-6): boolean {
  const s1 = [dist(t1[0], t1[1]), dist(t1[1], t1[2]), dist(t1[2], t1[0])];
  const s2 = [dist(t2[0], t2[1]), dist(t2[1], t2[2]), dist(t2[2], t2[0])];
  return s1.every((s, i) => nearly(s, s2[i], tol));
}

/** SAS congruence: two sides and the angle strictly between them. */
export function sasCongruent(
  a1: [Vec, Vec, Vec],
  a2: [Vec, Vec, Vec],
  tol = 1e-6,
): boolean {
  const angle = (p: Vec, v: Vec, r: Vec) => {
    const u1 = { x: p.x - v.x, y: p.y - v.y };
    const u2 = { x: r.x - v.x, y: r.y - v.y };
    const c = (u1.x * u2.x + u1.y * u2.y) / (Math.hypot(u1.x, u1.y) * Math.hypot(u2.x, u2.y));
    return Math.acos(Math.max(-1, Math.min(1, c)));
  };
  return (
    nearly(dist(a1[0], a1[1]), dist(a2[0], a2[1]), tol) &&
    nearly(dist(a1[1], a1[2]), dist(a2[1], a2[2]), tol) &&
    nearly(angle(a1[0], a1[1], a1[2]), angle(a2[0], a2[1], a2[2]), 1e-6)
  );
}

/* ───────────────────────── completion checks ───────────────────────── */

export function isPartAnswered(part: Part, answers: Answers): boolean {
  const v = answers[part.id];
  switch (part.type) {
    case "mcq":
      return typeof v === "string" && v.length > 0;
    case "multi":
      return Array.isArray(v) && v.length > 0;
    case "tf": {
      const t = (v ?? {}) as TfValue;
      return part.items.every((it) => {
        const e = t[it.id];
        if (!e?.verdict) return false;
        if (e.verdict === "false") return Boolean(e.correction);
        return true;
      });
    }
    case "match": {
      const m = (v ?? {}) as MatchValue;
      return part.left.every((l) => Boolean(m[l.id]));
    }
    case "order":
      return Array.isArray(v) && v.length === part.correctOrder.length;
    case "numeric": {
      const n = (v ?? {}) as NumericValue;
      return part.fields.every((f) => parseNumber(n[f.id]) !== null);
    }
    case "cloze": {
      const c = (v ?? {}) as ClozeValue;
      return part.pieces.every(
        (p) => typeof p === "string" || Boolean(c[p.blank.id]),
      );
    }
    case "plot": {
      const p = (v ?? {}) as PlotValue;
      return part.targets.every((t) => Boolean(p[t.id]));
    }
    default:
      return false;
  }
}

export function isQuestionAnswered(question: Question, answers: Answers): boolean {
  return question.parts.every((p) => isPartAnswered(p, answers));
}

export function countAnswered(questions: Question[], answers: Answers) {
  let done = 0;
  let total = 0;
  for (const qq of questions) {
    for (const p of qq.parts) {
      total += 1;
      if (isPartAnswered(p, answers)) done += 1;
    }
  }
  return { done, total };
}

/* ───────────────────────── answer → text (for the report) ───────────────────────── */

const optText = (options: { id: string; text: string }[], id: string | undefined) =>
  options.find((o) => o.id === id)?.text ?? "— لم يُجب —";

export function studentAnswerText(part: Part, answers: Answers): string {
  const v = answers[part.id];
  switch (part.type) {
    case "mcq":
      return optText(part.options, v as string);
    case "multi": {
      const arr = (v as string[]) ?? [];
      return arr.length ? arr.map((id) => optText(part.options, id)).join(" | ") : "— لم يُجب —";
    }
    case "tf": {
      const t = (v ?? {}) as TfValue;
      return part.items
        .map((it) => {
          const e = t[it.id];
          const verdict = e?.verdict === "true" ? "صواب" : e?.verdict === "false" ? "خطأ" : "—";
          const corr =
            e?.verdict === "false" && it.corrections
              ? ` ← التصحيح: ${optText(it.corrections, e.correction)}`
              : "";
          return `${stripMath(it.text)}: ${verdict}${corr}`;
        })
        .join(" ‖ ");
    }
    case "match": {
      const m = (v ?? {}) as MatchValue;
      return part.left
        .map((l) => `${stripMath(l.text)} ← ${optText(part.right, m[l.id])}`)
        .join(" ‖ ");
    }
    case "order": {
      if (!Array.isArray(v)) return "— لم يُجب —";
      const arr = v as string[];
      return arr.map((id, i) => `${i + 1}) ${stripMath(optText(part.steps, id))}`).join(" ‖ ");
    }
    case "numeric": {
      const n = (v ?? {}) as NumericValue;
      return part.fields
        .map((f) => `${stripMath(f.label)} = ${n[f.id]?.trim() ? n[f.id] : "—"}${f.unit ? " " + f.unit : ""}`)
        .join(" ‖ ");
    }
    case "cloze": {
      const c = (v ?? {}) as ClozeValue;
      return part.pieces
        .filter((p): p is { blank: ClozeBlank } => typeof p !== "string")
        .map((p, i) => `${i + 1}) ${optText(p.blank.options, c[p.blank.id])}`)
        .join(" ‖ ");
    }
    case "plot": {
      const p = (v ?? {}) as PlotValue;
      return part.targets
        .map((t) => {
          const pt = p[t.id];
          return `${t.label} : ${pt ? `x = ${pt.x} ، y = ${pt.y}` : "لم تُوضَع"}`;
        })
        .join(" ‖ ");
    }
    default:
      return "—";
  }
}

export function correctAnswerText(part: Part): string {
  switch (part.type) {
    case "mcq":
      return optText(part.options, part.correct);
    case "multi":
      return part.correct.map((id) => optText(part.options, id)).join(" | ");
    case "tf":
      return part.items
        .map((it) => {
          const base = `${stripMath(it.text)}: ${it.answer ? "صواب" : "خطأ"}`;
          return it.answer || !it.correctCorrection
            ? base
            : `${base} ← التصحيح: ${optText(it.corrections ?? [], it.correctCorrection)}`;
        })
        .join(" ‖ ");
    case "match":
      return part.left
        .map((l) => `${stripMath(l.text)} ← ${optText(part.right, part.solution[l.id])}`)
        .join(" ‖ ");
    case "order":
      return part.correctOrder
        .map((id, i) => `${i + 1}) ${stripMath(optText(part.steps, id))}`)
        .join(" ‖ ");
    case "numeric":
      return part.fields
        .map((f) => `${stripMath(f.label)} = ${f.answer}${f.unit ? " " + f.unit : ""}`)
        .join(" ‖ ");
    case "cloze":
      return part.pieces
        .filter((p): p is { blank: ClozeBlank } => typeof p !== "string")
        .map((p, i) => `${i + 1}) ${optText(p.blank.options, p.blank.correct)}`)
        .join(" ‖ ");
    case "plot":
      return part.targets.map((t) => `${t.label} : x = ${t.x} ، y = ${t.y}`).join(" ‖ ");
    default:
      return "—";
  }
}

/** Strips `$…$` markers for plain-text report lines. */
export function stripMath(text: string): string {
  return text
    .replace(/\$/g, "")
    .replace(/\\(?:tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\leftrightarrow/g, "↔")
    .replace(/\\to/g, "→")
    .replace(/\^\s*\\circ/g, "°")
    .replace(/\\overrightarrow\{([^}]*)\}/g, "$1\u20D7")
    .replace(/\\overrightarrow\s*(\w)/g, "$1\u20D7")
    .replace(/\\widehat\{([^}]*)\}/g, "$1\u0302")
    .replace(/\\widehat\s*(\w)/g, "$1\u0302")
    .replace(/\\triangle\s*/g, "△")
    .replace(/\\notin/g, "∉")
    .replace(/\\in/g, "∈")
    .replace(/\\cong/g, "≅")
    .replace(/\\parallel/g, "∥")
    .replace(/\\perp/g, "⊥")
    .replace(/\\neq/g, "≠")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\circ/g, "°")
    .replace(/\\prime/g, "′")
    .replace(/\\mathcal\{([^}]*)\}/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\[,;!:>]/g, " ")
    .replace(/\\ /g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/'/g, "′")
    .replace(/\s+/g, " ")
    .trim();
}

/* ───────────────────────── grading ───────────────────────── */

export function gradePart(part: Part, answers: Answers): PartGrade {
  const v = answers[part.id];
  const lines: GradeLine[] = [];

  switch (part.type) {
    case "mcq": {
      const ok = v === part.correct;
      lines.push({ label: "الاختيار الصحيح", earned: ok ? part.marks : 0, max: part.marks, ok });
      break;
    }
    case "multi": {
      const chosen = new Set((v as string[]) ?? []);
      const correct = new Set(part.correct);
      let hits = 0;
      let misses = 0;
      for (const o of part.options) {
        const should = correct.has(o.id);
        const did = chosen.has(o.id);
        if (should && did) hits += 1;
        if (!should && did) misses += 1;
        if (should || did) {
          lines.push({
            label: stripMath(o.text),
            earned: 0,
            max: 0,
            ok: should === did,
          });
        }
      }
      const ratio = Math.max(0, hits - misses) / correct.size;
      const earned = q4(part.marks * ratio);
      lines.unshift({
        label: `اختيارات صحيحة ${hits} من ${correct.size}${misses ? ` · اختيارات خاطئة ${misses}` : ""}`,
        earned,
        max: part.marks,
        ok: earned === part.marks,
      });
      break;
    }
    case "tf": {
      const t = (v ?? {}) as TfValue;
      for (const it of part.items) {
        const e = t[it.id];
        const said = e?.verdict === "true";
        const verdictOk = Boolean(e?.verdict) && said === it.answer;
        if (it.answer) {
          lines.push({
            label: stripMath(it.text),
            earned: verdictOk ? it.marks : 0,
            max: it.marks,
            ok: verdictOk,
          });
        } else {
          const half = q4(it.marks / 2);
          const corrOk = verdictOk && e?.correction === it.correctCorrection;
          const earned = (verdictOk ? half : 0) + (corrOk ? it.marks - half : 0);
          lines.push({
            label: stripMath(it.text),
            earned,
            max: it.marks,
            ok: earned === it.marks,
          });
        }
      }
      break;
    }
    case "match": {
      const m = (v ?? {}) as MatchValue;
      const each = part.marks / part.left.length;
      for (const l of part.left) {
        const ok = m[l.id] === part.solution[l.id];
        lines.push({
          label: stripMath(l.text),
          earned: ok ? q4(each) : 0,
          max: q4(each),
          ok,
        });
      }
      break;
    }
    case "order": {
      const answered = Array.isArray(v);
      const arr = answered ? (v as string[]) : part.initialOrder;
      let hits = 0;
      if (!answered) {
        lines.push({
          label: "لم يُرتَّب أيّ خطوة",
          earned: 0,
          max: part.marks,
          ok: false,
        });
        break;
      }
      part.correctOrder.forEach((id, i) => {
        if (arr[i] === id) hits += 1;
      });
      const earned = q4((part.marks * hits) / part.correctOrder.length);
      lines.push({
        label: `خطوات في موضعها الصحيح: ${hits} من ${part.correctOrder.length}`,
        earned,
        max: part.marks,
        ok: hits === part.correctOrder.length,
      });
      break;
    }
    case "numeric": {
      const n = (v ?? {}) as NumericValue;
      for (const f of part.fields) {
        const parsed = parseNumber(n[f.id]);
        const ok = parsed !== null && nearly(parsed, f.answer, f.tol ?? 1e-6);
        lines.push({
          label: stripMath(f.label),
          earned: ok ? f.marks : 0,
          max: f.marks,
          ok,
        });
      }
      break;
    }
    case "cloze": {
      const c = (v ?? {}) as ClozeValue;
      for (const piece of part.pieces) {
        if (typeof piece === "string") continue;
        const b = piece.blank;
        const ok = c[b.id] === b.correct;
        lines.push({
          label: stripMath(b.why),
          earned: ok ? b.marks : 0,
          max: b.marks,
          ok,
        });
      }
      break;
    }
    case "plot": {
      const p = (v ?? {}) as PlotValue;
      for (const t of part.targets) {
        const pt = p[t.id];
        const ok = Boolean(pt) && pt!.x === t.x && pt!.y === t.y;
        lines.push({
          label: `موضع النقطة ${t.label}`,
          earned: ok ? t.marks : 0,
          max: t.marks,
          ok,
        });
      }
      break;
    }
  }

  const earned = q4(lines.reduce((s, l) => s + l.earned, 0));
  return {
    partId: part.id,
    earned: Math.min(earned, part.marks),
    max: part.marks,
    lines,
    studentText: studentAnswerText(part, answers),
    correctText: correctAnswerText(part),
  };
}

export function gradeExam(questions: Question[], answers: Answers): ExamGrade {
  const qs: QuestionGrade[] = questions.map((question) => {
    const parts = question.parts.map((p) => gradePart(p, answers));
    return {
      questionId: question.id,
      earned: q4(parts.reduce((s, p) => s + p.earned, 0)),
      max: question.marks,
      parts,
    };
  });
  return {
    earned: q4(qs.reduce((s, x) => s + x.earned, 0)),
    max: qs.reduce((s, x) => s + x.max, 0),
    questions: qs,
  };
}
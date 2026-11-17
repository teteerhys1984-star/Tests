import type { AnswerMap, Question, SubItem, SubResult, LewisAnswer, MatrixAnswer, DrawAnswer } from "../data/types";

/* =========================================================================
   محرّك التصحيح — يمنح درجات جزئية، ولا يعتمد على مطابقة نصّ حرفية هشّة.
   ========================================================================= */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toAsciiDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const a = AR_DIGITS.indexOf(ch);
    const f = FA_DIGITS.indexOf(ch);
    if (a > -1) out += String(a);
    else if (f > -1) out += String(f);
    else if (ch === "٫" || ch === "،") out += ch === "٫" ? "." : ",";
    else out += ch;
  }
  return out;
}

/** توحيد الرموز العلمية قبل المقارنة: مرادات العربية، الأرقام الملوّقة، الوحدات الفائقة. */
export function normalize(input: string): string {
  return toAsciiDigits(input)
    .replace(/[\u064B-\u0652\u0640]/g, "") // تشكيل وتطويل
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ ← ا
    .replace(/\u0649/g, "\u064A") // ى ← ي
    .replace(/\u0629/g, "\u0647") // ة ← ه
    .replace(/[\u06D6-\u06ED]/g, "")
    .replace(/[\u2070\u00B9\u00B2\u00B3\u2074-\u2079]/g, (c) => {
      const map: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
      return map[c] ?? c;
    })
    .replace(/[\u2080-\u2089]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/[\u207A\u208A\uFF0B]/g, "+")
    .replace(/[\u207B\u208B\u2212\u2013\u2014\uFE63\uFF0D]/g, "-")
    .replace(/\u2032|\u2035|\u02B9/g, "'")
    .replace(/[«»"'`.,;:!؟?]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** نسخة للمقارنة الشديدة: بدون مسافات إطلاقاً (للمعادلات والرموز). */
export function compact(input: string): string {
  return normalize(input).replace(/\s+/g, "");
}

export function parseNumber(raw: string): number | null {
  const s = toAsciiDigits(raw).replace(/[^0-9.eE+-]/g, "");
  if (!s || !/[0-9]/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function hasValue(raw: string): boolean {
  return raw.trim().length > 0;
}

/* --------------------------------------------------------------- عناصر الإجابة */

export function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return "";
}

/** قراءة القيم المهيكلة (JSON) المحفوظة في خريطة الإجابات. */
function parseObject<T>(v: unknown): T | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as T;
  if (typeof v === "string" && v.trim().startsWith("{")) {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function isAnswered(s: SubItem, answers: AnswerMap): boolean {
  const v = answers[s.id];
  switch (s.kind) {
    case "numeric":
    case "text":
      return hasValue(asString(v));
    case "matrix": {
      const m = parseObject<MatrixAnswer>(v);
      const cells = s.answer.kind === "matrix" ? s.answer.cells : [];
      return !!m && cells.length > 0 && cells.every((c) => hasValue(m[c.id] ?? ""));
    }
    case "lewis": {
      const l = parseObject<LewisAnswer>(v);
      if (!l || s.answer.kind !== "lewis") return false;
      if (s.answer.single) return (l.shared ?? 0) > 0;
      return (l.shared ?? 0) > 0 || (l.lone?.[0] ?? 0) > 0 || (l.lone?.[1] ?? 0) > 0;
    }
    case "draw": {
      const d = parseObject<DrawAnswer>(v);
      return !!d && (d.strokes ?? 0) >= 1;
    }
    default:
      return false;
  }
}

export function answeredCount(questions: Question[], answers: AnswerMap): number {
  let n = 0;
  for (const q of questions) for (const s of q.subs) if (isAnswered(s, answers)) n += 1;
  return n;
}

export function totalSubCount(questions: Question[]): number {
  return questions.reduce((t, q) => t + q.subs.length, 0);
}

export function isComplete(questions: Question[], answers: AnswerMap): boolean {
  return answeredCount(questions, answers) === totalSubCount(questions);
}

/* --------------------------------------------------------------- التصحيح */

function gradeNumeric(s: SubItem, raw: string): SubResult {
  const spec = s.answer;
  const want = spec.kind === "numeric" ? spec.value : 0;
  const tol = spec.kind === "numeric" ? spec.tol : 0;
  const got = parseNumber(raw);
  let awarded = 0;
  const detail: SubResult["detail"] = [];
  if (got === null) {
    detail.push({ ok: false, got: undefined, want });
  } else {
    const exact = Math.abs(got - want) <= tol + 1e-9;
    const near = !exact && want !== 0 && Math.abs(got - want) / Math.abs(want) <= 0.02;
    const slip = !exact && !near && want !== 0 && Math.abs(got - want) / Math.abs(want) <= 0.1;
    awarded = exact ? s.points : slip ? s.points * 0.5 : 0;
    detail.push({ ok: exact, got, want });
  }
  const unitTex = s.unit ? (s.unit === "°" ? "^{\\circ}" : `~\\mathrm{${s.unit}}`) : "";
  return {
    subId: s.id,
    awarded: round2(awarded),
    points: s.points,
    detail,
    student: raw.trim(),
    expected: `[[${want}${unitTex}]]${slipNote(detail)}`,
  };
}

function slipNote(detail: SubResult["detail"]): string {
  return detail.some((d) => d.ok) ? "" : "";
}

function gradeText(s: SubItem, raw: string): SubResult {
  if (s.answer.kind !== "text") return emptyResult(s);
  const norm = normalize(raw);
  const compacted = norm.replace(/\s+/g, "");
  let awarded = 0;
  const detail: SubResult["detail"] = [];
  for (const c of s.answer.criteria) {
    const hit = c.any.some((k) => {
      const kn = compact(k);
      return kn.length > 0 && (compacted.includes(kn) || norm.includes(normalize(k)));
    });
    if (hit) awarded += c.w;
    detail.push({ criterion: c.note, ok: hit });
  }
  return {
    subId: s.id,
    awarded: round2(Math.min(awarded, s.points)),
    points: s.points,
    detail,
    student: raw.trim(),
    expected: s.answer.criteria.map((c) => c.note).join("  •  "),
  };
}

function gradeMatrix(s: SubItem, raw: string): SubResult {
  if (s.answer.kind !== "matrix") return emptyResult(s);
  const m = (parseMatrix(raw) ?? {}) as MatrixAnswer;
  let hits = 0;
  const detail: SubResult["detail"] = [];
  for (const cell of s.answer.cells) {
    const val = compact(m[cell.id] ?? "");
    const ok = val.length > 0 && cell.accept.some((a) => compact(a) === val);
    if (ok) hits += 1;
    detail.push({ criterion: `${cell.id} = ${cell.note}`, ok });
  }
  const total = s.answer.cells.length || 1;
  return {
    subId: s.id,
    awarded: round2((hits / total) * s.points),
    points: s.points,
    detail,
    student: raw.trim(),
    expected: s.answer.cells.map((c) => `${c.id} = ${c.note}`).join("، "),
  };
}

function parseMatrix(raw: string): MatrixAnswer | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as MatrixAnswer;
  } catch {
    return null;
  }
  return null;
}

function gradeLewis(s: SubItem, raw: string): SubResult {
  if (s.answer.kind !== "lewis") return emptyResult(s);
  let ans: LewisAnswer | null = null;
  try {
    ans = raw ? (JSON.parse(raw) as LewisAnswer) : null;
  } catch {
    ans = null;
  }
  const spec = s.answer;
  const detail: SubResult["detail"] = [];
  if (spec.single) {
    const total = ans?.shared ?? 0;
    const exact = total === spec.shared;
    const near = Math.abs(total - spec.shared) === 1;
    detail.push({ criterion: `عدد النقاط = ${spec.shared}`, ok: exact, got: total, want: spec.shared });
    return {
      subId: s.id,
      awarded: exact ? s.points : near ? s.points * 0.5 : 0,
      points: s.points,
      detail,
      student: `عدد النقاط المرسومة: ${total}`,
      expected: `${spec.shared} نقاط حول الرمز (تمثيل لويس).`,
    };
  }
  const sharedOk = (ans?.shared ?? -1) === spec.shared;
  const loneOk = (ans?.lone?.[0] ?? -1) === spec.loneLeft && (ans?.lone?.[1] ?? -1) === spec.loneRight;
  detail.push({ criterion: `الأزواج المشتركة = ${spec.shared}`, ok: sharedOk, got: ans?.shared ?? 0, want: spec.shared });
  detail.push({ criterion: `الأزواج غير المشتركة = ${spec.loneLeft} / ${spec.loneRight}`, ok: loneOk });
  return {
    subId: s.id,
    awarded: round2((sharedOk ? s.points * 0.5 : 0) + (loneOk ? s.points * 0.5 : 0)),
    points: s.points,
    detail,
    student: `مشتركة: ${ans?.shared ?? 0} — غير مشتركة: ${ans?.lone?.[0] ?? 0}/${ans?.lone?.[1] ?? 0}`,
    expected: `${spec.shared} زوج(أزواج) مشتركة، و${spec.loneLeft}/${spec.loneRight} زوج غير مشترك حول كل ذرّة.`,
  };
}

function gradeDraw(s: SubItem, raw: string): SubResult {
  if (s.answer.kind !== "draw") return emptyResult(s);
  const spec = s.answer;
  let ans: DrawAnswer = { strokes: 0, labels: [] };
  try {
    if (raw) ans = JSON.parse(raw) as DrawAnswer;
  } catch {
    ans = { strokes: 0, labels: [] };
  }
  const typed = (ans.labels ?? []).map((l) => compact(l));
  const detail: SubResult["detail"] = [];
  const labelShare = (s.points * 0.6) / Math.max(spec.labels.length, 1);
  let awarded = 0;
  for (const want of spec.labels) {
    const ok = typed.includes(compact(want));
    if (ok) awarded += labelShare;
    detail.push({ criterion: `تسمية «${want}» على الرسم`, ok });
  }
  const strokesOk = (ans.strokes ?? 0) >= spec.minStrokes;
  if (strokesOk) awarded += s.points * 0.4;
  detail.push({ criterion: `إتمام الرسم (≥ ${spec.minStrokes} خطوط)`, ok: strokesOk, got: ans.strokes ?? 0, want: spec.minStrokes });
  return {
    subId: s.id,
    awarded: round2(Math.min(awarded, s.points)),
    points: s.points,
    detail,
    student: `خطوط الرسم: ${ans.strokes ?? 0} — التسميات: ${(ans.labels ?? []).join("، ") || "—"}`,
    expected: `يُشترط في الرسم: ${spec.labels.join("، ")} — على الأقل ${spec.minStrokes} خطوط.`,
  };
}

function emptyResult(s: SubItem): SubResult {
  return { subId: s.id, awarded: 0, points: s.points, detail: [], student: "", expected: "" };
}

export function gradeSub(s: SubItem, answers: AnswerMap): SubResult {
  const raw = asString(answers[s.id]);
  switch (s.kind) {
    case "numeric":
      return gradeNumeric(s, raw);
    case "text":
      return gradeText(s, raw);
    case "matrix":
      return gradeMatrix(s, raw);
    case "lewis":
      return gradeLewis(s, raw);
    case "draw":
      return gradeDraw(s, raw);
    default:
      return emptyResult(s);
  }
}

export interface AttemptScore {
  physics: number;
  chemistry: number;
  total: number;
  perQuestion: { question: Question; awarded: number; subs: SubResult[] }[];
}

export function gradeAttempt(questions: Question[], answers: AnswerMap): AttemptScore {
  const perQuestion = questions.map((question) => {
    const subs = question.subs.map((s) => gradeSub(s, answers));
    return { question, awarded: round2(subs.reduce((t, r) => t + r.awarded, 0)), subs };
  });
  const physics = round2(perQuestion.filter((r) => r.question.subject === "physics").reduce((t, r) => t + r.awarded, 0));
  const chemistry = round2(perQuestion.filter((r) => r.question.subject === "chemistry").reduce((t, r) => t + r.awarded, 0));
  return { physics, chemistry, total: round2(physics + chemistry), perQuestion };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMarks(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

export function stopwatch(now: number, startedAt: number): string {
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

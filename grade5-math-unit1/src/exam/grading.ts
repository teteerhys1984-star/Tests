import type { Subpart } from './types'

/* ------------------------------------------------------------------ */
/* تطبيع النصوص العربية                                                */
/* ------------------------------------------------------------------ */

export function normalizeArabic(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  let s = String(raw)
  try { s = s.normalize('NFKC') } catch { /* ignore */ }
  s = s
    .replace(/[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[،؛]/g, ',')
    .toLowerCase()
    .trim()
  return s
}

/** يقارن نصين بعد التطبيع وتجاهل علامات الترقيم والمسافات الزائدة. */
function loose(a: string): string {
  return normalizeArabic(a)
    .replace(/[\s\u200c\u200f\u200e]+/g, '')
    .replace(/[.,!?'":;()\[\]{}\-–—_/\\]/g, '')
}

const NUM_RE = /-?\d+(?:[.,]\d+)?/

export function firstNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return '' as unknown as null
  const s = String(raw).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  const cleaned = s.replace(/\u066c/g, '').replace(/,/g, '')
  const m = cleaned.match(NUM_RE) || s.match(NUM_RE)
  if (!m) return null
  const n = Number.parseFloat(m[0])
  return Number.isFinite(n) ? n : null
}

export function numbersEqual(a: unknown, b: number, tol = 0): boolean {
  const n = firstNumber(a)
  if (n === null) return false
  return Math.abs(n - b) <= tol + 1e-9
}

/* ------------------------------------------------------------------ */
/* قيمة الإجابة                                                        */
/* ------------------------------------------------------------------ */

export type TfAnswer = { value: '' | 'true' | 'false'; correction: string }
export type AnswerValue =
  | string
  | string[]
  | Record<string, string>
  | TfAnswer
  | null
  | undefined

export type Answers = Record<string, AnswerValue>

export function asString(v: AnswerValue): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.join(' ')
  if (typeof v === 'object' && 'value' in (v as object)) {
    const t = v as TfAnswer
    return `${t.value === 'true' ? 'صواب' : t.value === 'false' ? 'خطأ' : ''} ${t.correction ?? ''}`.trim()
  }
  return Object.values(v as Record<string, string>).join(' ')
}

/** هل الفرع مُجاب بالكامل؟ (يُستعمل لتفعيل زر التسليم) */
export function isAnswered(sp: Subpart, v: AnswerValue): boolean {
  const str = (x: unknown) => (x === null || x === undefined ? '' : String(x).trim())
  switch (sp.kind) {
    case 'numeric':
    case 'text':
    case 'explain':
    case 'grid':
    case 'protractor':
    case 'drawangle':
      return str(v).length > 0
    case 'choice':
      return str(v).length > 0
    case 'multiselect':
      return Array.isArray(v) && v.length > 0
    case 'tf': {
      const t = v as TfAnswer | undefined
      if (!t || !t.value) return false
      if (sp.requireCorrection) return str(t.correction).length >= 3
      return true
    }
    case 'matching': {
      const rec = v as Record<string, string> | undefined
      if (!rec || !sp.rows) return false
      return sp.rows.every((r) => str(rec[r.id]).length > 0)
    }
    case 'ordering': {
      const arr = v as string[] | undefined
      return Array.isArray(arr) && !!sp.items && arr.length === sp.items.length
    }
    default:
      return str(v).length > 0
  }
}

/* ------------------------------------------------------------------ */
/* التصحيح                                                             */
/* ------------------------------------------------------------------ */

export type Status = 'correct' | 'partial' | 'wrong' | 'unanswered'

export interface GradeResult {
  awarded: number
  max: number
  status: Status
  hits: number
  total: number
}

function matchesAny(input: string, alternatives: string[]): boolean {
  const li = loose(input)
  if (!li) return false
  return alternatives.some((alt) => {
    const la = loose(alt)
    if (!la) return false
    return li === la || li.includes(la) || la.includes(li)
  })
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2
}

function textCorrect(sp: Subpart, raw: string): boolean {
  const expected: string[] = Array.isArray(sp.correct)
    ? sp.correct.filter((x): x is string => typeof x === 'string')
    : typeof sp.correct === 'string'
      ? [sp.correct]
      : []
  const all = [...expected, ...(sp.accept ?? [])]
  for (const exp of all) {
    if (loose(exp) && loose(exp) === loose(raw)) return true
  }
  // إجابات عددية داخل نص (مثل «20 cm» أو «20 سم»)
  const expNums = all.map((e) => firstNumber(e)).filter((n): n is number => n !== null)
  if (expNums.length) {
    const tol = sp.tolerance ?? 0
    for (const n of expNums) if (numbersEqual(raw, n, tol)) return true
  }
  return all.some((exp) => matchesAny(raw, [exp]) && loose(exp).length >= 3)
}

export function gradeSubpart(sp: Subpart, v: AnswerValue): GradeResult {
  const max = sp.marks
  if (!isAnswered(sp, v)) return { awarded: 0, max, status: 'unanswered', hits: 0, total: 1 }

  switch (sp.kind) {
    case 'numeric':
    case 'protractor':
    case 'drawangle': {
      const target = firstNumber(sp.correct)
      if (target === null) break
      if (numbersEqual(v, target, sp.tolerance ?? 0))
        return { awarded: max, max, status: 'correct', hits: 1, total: 1 }
      return { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
    }

    case 'text':
    case 'grid': {
      const ok = textCorrect(sp, asString(v))
      return ok
        ? { awarded: max, max, status: 'correct', hits: 1, total: 1 }
        : { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
    }

    case 'explain': {
      const groups = sp.rubricAll ?? []
      const raw = asString(v)
      if (!groups.length) {
        const ok = loose(raw).length >= 8
        return ok ? { awarded: max, max, status: 'correct', hits: 1, total: 1 } : { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
      }
      const hits = groups.filter((alts) => matchesAny(raw, alts)).length
      const ratio = hits / groups.length
      const awarded = roundHalf(max * ratio)
      const status: Status = ratio >= 0.999 ? 'correct' : awarded > 0 ? 'partial' : 'wrong'
      return { awarded, max, status, hits, total: groups.length }
    }

    case 'choice': {
      const ok = Array.isArray(sp.correct)
        ? sp.correct.includes(String(v))
        : sp.correct === String(v)
      return ok
        ? { awarded: max, max, status: 'correct', hits: 1, total: 1 }
        : { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
    }

    case 'multiselect': {
      const picked = Array.isArray(v) ? v : []
      const want: string[] = (Array.isArray(sp.correct)
        ? sp.correct.filter((x): x is string => typeof x === 'string')
        : typeof sp.correct === 'string'
          ? [sp.correct]
          : []
      ).slice().sort()
      const got = picked.slice().sort()
      const total = want.length
      const right = got.filter((x) => want.includes(x)).length
      const bad = got.length - right
      const hits = Math.max(0, right - bad)
      const setEqual = got.length === want.length && got.every((x, i) => x === want[i])
      if (setEqual) return { awarded: max, max, status: 'correct', hits: total, total }
      const awarded = total ? roundHalf((max * hits) / total) : 0
      return {
        awarded: Math.max(0, Math.min(max, awarded)),
        max,
        status: awarded > 0 ? 'partial' : 'wrong',
        hits: right,
        total,
      }
    }

    case 'tf': {
      const t = v as TfAnswer
      const wantTrue = sp.correct === true || sp.correct === 'true'
      const tfOk = (t.value === 'true') === wantTrue
      if (!sp.requireCorrection) {
        return tfOk
          ? { awarded: max, max, status: 'correct', hits: 1, total: 1 }
          : { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
      }
      const groups = sp.correction ?? []
      const cHits = groups.filter((alts) => matchesAny(t.correction ?? '', alts)).length
      const cRatio = groups.length ? cHits / groups.length : 0
      const tfPart = max / 2
      const cPart = max - tfPart
      const awarded = roundHalf((tfOk ? tfPart : 0) + cPart * cRatio)
      const full = Math.abs(awarded - max) < 1e-9
      return {
        awarded,
        max,
        status: full ? 'correct' : awarded > 0 ? 'partial' : 'wrong',
        hits: (tfOk ? 1 : 0) + cHits,
        total: 1 + groups.length,
      }
    }

    case 'matching': {
      const rec = (v as Record<string, string>) ?? {}
      const rows = sp.rows ?? []
      const hits = rows.filter((r) => loose(rec[r.id] ?? '') === loose(r.answer)).length
      const total = rows.length
      if (hits === total) return { awarded: max, max, status: 'correct', hits, total }
      let awarded = 0
      for (const [minMarks, marks] of sp.partial ?? []) if (hits >= minMarks) { awarded = marks; break }
      if (!sp.partial && total) awarded = roundHalf((max * hits) / total)
      return {
        awarded: Math.min(max, awarded),
        max,
        status: awarded > 0 ? 'partial' : 'wrong',
        hits,
        total,
      }
    }

    case 'ordering': {
      const arr = Array.isArray(v) ? v : []
      const want = sp.items ?? []
      const hits = want.filter((it, i) => arr[i] === it.id).length
      const total = want.length
      if (hits === total) return { awarded: max, max, status: 'correct', hits, total }
      let awarded = 0
      for (const [minHits, marks] of sp.partial ?? []) if (hits >= minHits) { awarded = marks; break }
      if (!sp.partial && total) awarded = roundHalf((max * hits) / total)
      return {
        awarded: Math.min(max, awarded),
        max,
        status: awarded > 0 ? 'partial' : 'wrong',
        hits,
        total,
      }
    }
  }
  return { awarded: 0, max, status: 'wrong', hits: 0, total: 1 }
}

/** وصف مقروء لإجابة الطالب (يظهر في المراجعة وفي ملف التقرير). */
export function describeAnswer(sp: Subpart, v: AnswerValue): string {
  if (!isAnswered(sp, v)) return '— لم يُجب —'
  switch (sp.kind) {
    case 'choice': {
      const opt = (sp.options ?? []).find((o) => o.id === String(v))
      return opt ? opt.label : String(v)
    }
    case 'multiselect': {
      const picked = Array.isArray(v) ? v : []
      const labels = (sp.options ?? []).filter((o) => picked.includes(o.id)).map((o) => o.label)
      return labels.length ? labels.join(' ؛ ') : '—'
    }
    case 'tf': {
      const t = v as TfAnswer
      const base = t.value === 'true' ? 'صواب' : t.value === 'false' ? 'خطأ' : '—'
      return t.correction ? `${base} — التصويب: ${t.correction}` : base
    }
    case 'matching': {
      const rec = (v as Record<string, string>) ?? {}
      return (sp.rows ?? []).map((r) => `${plainLabel(r.left)} ⟵ ${rec[r.id] || '—'}`).join(' ؛ ')
    }
    case 'ordering': {
      const arr = Array.isArray(v) ? v : []
      const items = sp.items ?? []
      return arr.map((id, i) => `${i + 1}) ${plainLabel(items.find((x) => x.id === id)?.text ?? '')}`).join(' ← ')
    }
    case 'grid':
      return `الزوج المرتّب (${asString(v)})`
    default:
      return asString(v)
  }
}

function plainLabel(s: string): string {
  return s.replace(/\$([^$]*)\$/g, '$1').replace(/\s+/g, ' ').trim()
}

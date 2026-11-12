/**
 * تنسيق التواريخ والأزمنة بأرقام عربية غربية (0–9) حصراً.
 */

const LATIN_DIGITS = /[٠١٢٣٤٥٦٧٨٩]/g
const ARABIC_TO_LATIN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function toLatinDigits(value: string | number): string {
  return String(value).replace(LATIN_DIGITS, (d) => ARABIC_TO_LATIN[d.charCodeAt(0) - 0x0660])
}

function fmt(date: Date, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat('ar', { ...opts, numberingSystem: 'latn' }).format(date)
  } catch {
    try {
      return toLatinDigits(new Intl.DateTimeFormat('ar', opts).format(date))
    } catch {
      return toLatinDigits(date.toLocaleString())
    }
  }
}

export function formatDateTime(date: Date): string {
  return toLatinDigits(
    `${fmt(date, { year: 'numeric', month: '2-digit', day: '2-digit' })} — ${fmt(date, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })}`,
  )
}

export function formatDateOnly(date: Date): string {
  return toLatinDigits(fmt(date, { year: 'numeric', month: '2-digit', day: '2-digit' }))
}

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export function formatLong(date: Date): string {
  const wd = WEEKDAYS[date.getDay()]
  const p = (n: number) => toLatinDigits(String(n).padStart(2, '0'))
  return `${wd} ${p(date.getDate())}/${p(date.getMonth() + 1)}/${toLatinDigits(date.getFullYear())} — الساعة ${p(
    date.getHours(),
  )}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

/** HH:MM:SS بأرقام غربية. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return toLatinDigits(`${p(h)}:${p(m)}:${p(s)}`)
}

export function formatDurationWords(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts: string[] = []
  if (h) parts.push(`${toLatinDigits(h)} ساعة`)
  if (m) parts.push(`${toLatinDigits(m)} دقيقة`)
  parts.push(`${toLatinDigits(s)} ثانية`)
  return parts.join(' و')
}

export function num(value: number | string): string {
  return toLatinDigits(value)
}

export function pct(value: number, digits = 1): string {
  return toLatinDigits(value.toFixed(digits)) + '%'
}

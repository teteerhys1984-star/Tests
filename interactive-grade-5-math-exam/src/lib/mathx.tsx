import { Fragment, memo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.css'

/**
 * عارض الترميز الرياضي.
 * النص العربي يبقى RTL، وكل مقطع محصور بين $...$ أو $$...$$ يُعرض عبر KaTeX
 * داخل حاوية LTR معزولة (unicode-bidi: isolate) حتى لا ينكسر اتجاه الأرقام.
 */

type Seg = { math: boolean; block: boolean; value: string }

function parse(src: string): Seg[] {
  const out: Seg[] = []
  let i = 0
  let buf = ''
  while (i < src.length) {
    const two = src.slice(i, i + 2)
    if (two === '$$') {
      const end = src.indexOf('$$', i + 2)
      if (end !== -1) {
        if (buf) { out.push({ math: false, block: false, value: buf }); buf = '' }
        out.push({ math: true, block: true, value: src.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    if (src[i] === '$') {
      const end = src.indexOf('$', i + 1)
      if (end !== -1) {
        if (buf) { out.push({ math: false, block: false, value: buf }); buf = '' }
        out.push({ math: true, block: false, value: src.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    if (src[i] === '\n') {
      if (buf) { out.push({ math: false, block: false, value: buf }); buf = '' }
      out.push({ math: false, block: true, value: '\n' })
      i++
      continue
    }
    buf += src[i]
    i++
  }
  if (buf) out.push({ math: false, block: false, value: buf })
  return out
}

function render(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor: '#a52a2a',
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml',
    })
  } catch {
    return tex
  }
}

export const MathText = memo(function MathText({
  text,
  className,
  as: Tag = 'span',
}: {
  text: string
  className?: string
  as?: 'span' | 'p' | 'div' | 'strong' | 'td' | 'th' | 'li'
}) {
  const segs = parse(text ?? '')
  return (
    <Tag className={className}>
      {segs.map((seg, idx) => {
        if (!seg.math && seg.value === '\n') return <br key={idx} />
        if (!seg.math) return <Fragment key={idx}>{seg.value}</Fragment>
        return (
          <span
            key={idx}
            className={seg.block ? 'mtx-block' : 'mtx'}
            dangerouslySetInnerHTML={{ __html: render(seg.value, seg.block) }}
          />
        )
      })}
    </Tag>
  )
})

/** تحويل النص إلى صيغة نصية صرفة للتقرير (TXT) مع إبقاء الرموز الرياضية. */
type TexRule = [RegExp, string | ((...args: any[]) => string)]
const TEX_SYMBOLS: TexRule[] = [
  [/\^\\circ/g, '°'],
  [/\\circ/g, '°'],
  [/\\angle/g, '∠'],
  [/\\parallel/g, '∥'],
  [/\\perp/g, '⊥'],
  [/\\times/g, '×'],
  [/\\div(?!w)/g, '÷'],
  [/\\cdot/g, '·'],
  [/\\pm/g, '±'],
  [/\\neq/g, '≠'],
  [/\\leq/g, '≤'],
  [/\\geq/g, '≥'],
  [/\\lt/g, '<'],
  [/\\gt/g, '>'],
  [/\\ldots|\.\.\./g, '…'],
  [/\\,/g, ' '],
  [/\\;/g, ' '],
  [/\\quad|\\qquad/g, '  '],
  [/\\text\{([^}]*)\}/g, '$1'],
  [/\\mathrm\{([^}]*)\}/g, '$1'],
  [/\\left|\\right/g, ''],
  [/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)'],
  [/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)'],
  [/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)'],
  [/\\sqrt\{([^}]*)\}/g, '√($1)'],
  [/\\hat\{([^}]*)\}/g, '$1\u0302'],
  [/\\overline\{([^}]*)\}/g, '$1\u0305'],
  [/\^\{([^{}]*)\}/g, '^$1'],
  [/\^([0-9])/g, (...args: any[]) => SUPER[String(args[1])] ?? `^${args[1]}`],
  [/\_\{([^}]*)\}/g, '_$1'],
  [/\\\s/g, ' '],
  [/[{}]/g, ''],
]

const SUPER: Record<string, string> = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' }

export function plainMath(src: string): string {
  if (!src) return ''
  return src
    .replace(/\$\$([^$]*)\$\$/g, (_m, tex: string) => ' ' + texToPlain(tex) + ' ')
    .replace(/\$([^$]*)\$/g, (_m, tex: string) => texToPlain(tex))
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function texToPlain(tex: string): string {
  let out = tex
  for (const [re, rep] of TEX_SYMBOLS) {
    out = typeof rep === 'string' ? out.replace(re, rep) : out.replace(re, rep)
  }
  return out.replace(/\s{2,}/g, ' ').trim()
}

/** نص صريح بلا ترميز — يُستعمل داخل عناوين التقارير. */
export function stripAll(src: string): string {
  return plainMath(src)
}

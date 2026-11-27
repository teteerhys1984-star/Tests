import { useMemo } from 'react'
import katex from 'katex'

export function Tex({ tex, display = false, className = '' }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: display, output: 'html' })
    } catch {
      return tex
    }
  }, [tex, display])
  return <span className={`math-ltr ${className}`} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Renders Arabic text with inline KaTeX for every `$...$` segment.
 * All math is rendered LTR and isolated inside the RTL flow.
 */
export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g).filter(Boolean), [text])
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') ? <Tex key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>,
      )}
    </span>
  )
}

import { useMemo } from 'react'
import katex from 'katex'

/** Splits rich text on $...$ markers. Odd segments are math. */
export function splitRich(text: string): { math: boolean; value: string }[] {
  return text.split('$').map((value, i) => ({ math: i % 2 === 1, value }))
}

function renderMath(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: false, strict: 'ignore' })
  } catch {
    return latex
  }
}

/** Renders Arabic text with inline KaTeX math. Math is always isolated LTR so digits never flip. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const segments = useMemo(() => splitRich(text), [text])
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.math ? (
          <span
            key={i}
            className="math-ltr"
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: renderMath(seg.value) }}
          />
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </span>
  )
}

/** Paragraph-level rich text: a blank line or newline starts a new paragraph. */
export function RichParagraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split('\n').filter((p) => p.trim().length > 0)
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="rich-p">
          <RichText text={p} />
        </p>
      ))}
    </div>
  )
}

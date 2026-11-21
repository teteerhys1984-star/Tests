import React from 'react'
import katex from 'katex'

interface MathTexProps {
  math: string
  block?: boolean
  className?: string
}

export const MathTex: React.FC<MathTexProps> = ({ math, block = false, className = '' }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: block,
        strict: false,
        output: 'html',
      })
    } catch {
      return math
    }
  }, [math, block])

  return (
    <span
      dir="ltr"
      style={{ unicodeBidi: 'isolate' }}
      className={`${block ? 'block my-2 text-center overflow-x-auto py-1' : 'inline-block mx-1 align-middle'} font-medium text-fuchsia-950 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

interface RichMathTextProps {
  text: string
  className?: string
}

/**
 * Parses a string containing $$block$$ and $inline$ math segments and renders
 * each math segment with real KaTeX while preserving Arabic RTL prose around it.
 */
export const RichMathText: React.FC<RichMathTextProps> = ({ text, className = '' }) => {
  const tokens = React.useMemo(() => {
    const result: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string }> = []
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        })
      }
      if (match[1] !== undefined) {
        result.push({
          type: 'block-math',
          content: match[1].trim(),
        })
      } else if (match[2] !== undefined) {
        result.push({
          type: 'inline-math',
          content: match[2].trim(),
        })
      }
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
      })
    }

    return result
  }, [text])

  return (
    <span className={`leading-relaxed ${className}`}>
      {tokens.map((tok, idx) => {
        if (tok.type === 'block-math') {
          return <MathTex key={idx} math={tok.content} block />
        }
        if (tok.type === 'inline-math') {
          return <MathTex key={idx} math={tok.content} />
        }
        return <React.Fragment key={idx}>{tok.content}</React.Fragment>
      })}
    </span>
  )
}

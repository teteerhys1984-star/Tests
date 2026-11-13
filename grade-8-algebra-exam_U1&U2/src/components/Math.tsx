import { useMemo } from 'react';
import katex from 'katex';

interface MathTexProps {
  tex: string;
  block?: boolean;
  className?: string;
}

export function MathTex({ tex, block = false, className = '' }: MathTexProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return '';
    }
  }, [tex, block]);

  return (
    <span
      dir="ltr"
      className={`math-run ${block ? 'math-block' : ''} ${className}`.trim()}
      // Content is generated locally by KaTeX from the static question bank.
      dangerouslySetInnerHTML={{ __html: html || tex }}
    />
  );
}

interface RichTextProps {
  text: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

/**
 * Renders Arabic prose with isolated LTR mathematical runs.
 * Inline math is delimited with $...$; Arabic itself stays directional RTL.
 */
/**
 * Prose in this exam often mentions small numbers, fractions, signed values
 * and short equations outside explicit $...$ delimiters. Those runs are still
 * wrapped in a directional isolate so Arabic punctuation cannot reorder them.
 */
function renderProse(chunk: string) {
  if (!chunk) return null;
  const candidates = chunk.split(/([−+\-]?\d+(?:[.,]\d+)*(?:\/\d+)?)/g);
  return candidates.map((candidate, index) => {
    if (!candidate) return null;
    if (/^[−+\-]?\d/.test(candidate) && /\d/.test(candidate)) {
      return (
        <span key={`auto-math-${index}`} dir="ltr" className="auto-math">
          {candidate}
        </span>
      );
    }
    return <span key={`prose-${index}`}>{candidate}</span>;
  });
}

export function RichText({ text, className = '', as = 'div' }: RichTextProps) {
  const chunks = useMemo(() => {
    const result: { type: 'text' | 'math'; value: string }[] = [];
    let rest = text ?? '';
    while (rest.length > 0) {
      const start = rest.indexOf('$');
      if (start < 0) {
        result.push({ type: 'text', value: rest });
        break;
      }
      const end = rest.indexOf('$', start + 1);
      if (end < 0) {
        result.push({ type: 'text', value: rest });
        break;
      }
      if (start > 0) result.push({ type: 'text', value: rest.slice(0, start) });
      result.push({ type: 'math', value: rest.slice(start + 1, end) });
      rest = rest.slice(end + 1);
    }
    return result;
  }, [text]);

  const Tag = as;
  return (
    <Tag className={`rich-text ${className}`.trim()}>
      {chunks.map((chunk, i) =>
        chunk.type === 'math' ? (
          <MathTex key={`${chunk.value}-${i}`} tex={chunk.value} />
        ) : (
          <span key={`text-${i}`}>{renderProse(chunk.value)}</span>
        ),
      )}
    </Tag>
  );
}

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

/**
 * Isolated LTR KaTeX renderer.
 * Strictly enforces direction: ltr and unicode-bidi: isolate
 * so that mathematical notation is never corrupted by surrounding Arabic RTL text.
 */
export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false
      });
    } catch {
      return `<span class="text-rose-400 font-mono">${math}</span>`;
    }
  }, [math, block]);

  return (
    <bdi
      className={`math-ltr ${block ? 'math-block-ltr my-2 block' : 'inline-block align-middle mx-1'} ${className}`}
      dir="ltr"
      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Parses mixed Arabic and English/Math text into properly isolated BiDi tokens.
 * - Arabic text is rendered with dir="rtl" and unicodeBidi: "isolate"
 * - Math expressions ($...$ or LaTeX commands) are rendered with KaTeX in isolated LTR
 * - Embedded English phrases, coordinates, segment names (e.g. [AB], (A'B'), A(2, 1), ALGEBRA)
 *   are wrapped in <bdi dir="ltr"> so they never flip adjacent Arabic punctuation or words.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!text) return null;

    // Step 1: Split by explicit $...$ math blocks
    const primaryTokens: Array<{ type: 'math' | 'text'; value: string }> = [];
    const mathRegex = /\$([^$]+)\$/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = mathRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        primaryTokens.push({ type: 'text', value: text.substring(lastIdx, match.index) });
      }
      primaryTokens.push({ type: 'math', value: match[1] });
      lastIdx = mathRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      primaryTokens.push({ type: 'text', value: text.substring(lastIdx) });
    }

    // Step 2: Inside text tokens, detect isolated LTR fragments:
    // - Unwrapped LaTeX commands: e.g. \vec{...}, \frac{...}{...}, \widehat{...}, \parallel, etc.
    // - Bracketed segments: e.g. [AB], [A'B'], [AA'], [BC]
    // - Coordinates or lines in parentheses: e.g. (AB), (A'B'), (7, 4), (5, 3), (x+5, y+3)
    // - LTR variable coordinates: e.g. A(2, 1), B(6, 4), O(0,0), A'(7, 4)
    // - Standalone English words / codes: e.g. ALGEBRA, GEOMETRY, MATHVERSE, Grade 8, Option A, cm, kg
    // - Point identifiers with primes: e.g. A', B', C'
    const finalElements: React.ReactNode[] = [];
    let keyCounter = 0;

    primaryTokens.forEach(token => {
      if (token.type === 'math') {
        finalElements.push(<MathView key={`math-${keyCounter++}`} math={token.value} />);
      } else {
        // Sub-split by LTR patterns
        const ltrSubRegex = /(\\[a-zA-Z]+(?:\{[^}]*\})*|\[[A-Za-z0-9'’,\s]+\]|\((?:[A-Za-z0-9'’,\s.+-=×÷/*]+)\)|[A-Za-z][A-Za-z0-9'’]*\s*\([0-9,\s.+-]+\)|[A-Za-z]['’]\s*\(?[0-9,\s.+-]*\)?|[A-Za-z][A-Za-z0-9'’]*(?:\s+[A-Za-z0-9'’]+)*)/g;
        let subLastIdx = 0;
        let subMatch: RegExpExecArray | null;

        while ((subMatch = ltrSubRegex.exec(token.value)) !== null) {
          if (subMatch.index > subLastIdx) {
            finalElements.push(
              <span key={`ar-${keyCounter++}`} dir="rtl" style={{ unicodeBidi: 'isolate' }}>
                {token.value.substring(subLastIdx, subMatch.index)}
              </span>
            );
          }

          const matchedLtr = subMatch[0];

          // If it's a LaTeX command like \vec{...} or \frac{...}
          if (matchedLtr.startsWith('\\')) {
            finalElements.push(<MathView key={`submath-${keyCounter++}`} math={matchedLtr} />);
          } else {
            // Isolate English words, coordinates, brackets
            finalElements.push(
              <bdi
                key={`ltr-${keyCounter++}`}
                className="math-ltr mx-1 font-mono text-cyan-200"
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              >
                {matchedLtr}
              </bdi>
            );
          }

          subLastIdx = ltrSubRegex.lastIndex;
        }

        if (subLastIdx < token.value.length) {
          finalElements.push(
            <span key={`ar-end-${keyCounter++}`} dir="rtl" style={{ unicodeBidi: 'isolate' }}>
              {token.value.substring(subLastIdx)}
            </span>
          );
        }
      }
    });

    return finalElements;
  }, [text]);

  return (
    <span
      className={`arabic-sentence inline ${className}`}
      dir="rtl"
      lang="ar"
      style={{ direction: 'rtl', unicodeBidi: 'isolate', textAlign: 'right' }}
    >
      {renderedElements}
    </span>
  );
};

interface OptionTextProps {
  label: string;
  isMath?: boolean;
  className?: string;
}

/**
 * Renders multiple choice option labels safely:
 * - If the option has Arabic text (even if mixed with math/English),
 *   it renders in an isolated RTL Arabic sentence with LTR KaTeX/English tokens.
 * - If the option has NO Arabic characters, it renders as a pure KaTeX math block in LTR.
 */
export const OptionText: React.FC<OptionTextProps> = ({ label, isMath, className = '' }) => {
  const hasArabic = useMemo(() => /[\u0600-\u06FF]/.test(label), [label]);

  if (!hasArabic && isMath) {
    return (
      <div className="w-full text-center" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
        <MathView math={label} className={className} />
      </div>
    );
  }

  return (
    <div className="w-full text-right" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate' }}>
      <FormattedText text={label} className={className} />
    </div>
  );
};

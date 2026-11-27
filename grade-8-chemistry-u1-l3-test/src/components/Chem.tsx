import { memo, useMemo } from 'react';
import katex from 'katex';
import { formulaToTex } from '../lib/chemistry';

export const Chem = memo(function Chem({ formula, className = '' }: { formula: string; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(formulaToTex(formula), { throwOnError: false, output: 'htmlAndMathml', strict: 'ignore', trust: false }),
    [formula],
  );
  return <span className={`chem ${className}`} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
});

export function MathTex({ tex, className = '' }: { tex: string; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, output: 'htmlAndMathml', strict: 'ignore', trust: false }),
    [tex],
  );
  return <span className={`chem math-tex ${className}`} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}

const formulaPattern =
  /(?:\([A-Za-z₀-₉]+\)[₀-₉]*)?\d*[A-Z][A-Za-z₀-₉¹²³⁰-⁹⁺⁻]*(?:\([A-Za-z₀-₉]+\)[₀-₉]*\)?[A-Za-z₀-₉¹²³⁰-⁹⁺⁻]*)?/g;

export function ScientificText({ text, className = '' }: { text: string; className?: string }) {
  const pieces = text.split(/(\{\{[^{}]+\}\})/g);
  return (
    <span className={`scientific-text ${className}`}>
      {pieces.map((piece, i) => {
        if (piece.startsWith('{{') && piece.endsWith('}}')) return <Chem key={i} formula={piece.slice(2, -2)} />;
        const tokens = piece.split(formulaPattern);
        const matches = piece.match(formulaPattern) || [];
        return (
          <span key={i}>
            {tokens.map((token, j) => (
              <span key={j}>
                {token}
                {matches[j] &&
                  (['I', 'II', 'III', 'IV', 'V'].includes(matches[j]) ? (
                    <span dir="ltr" className="roman-inline">
                      {matches[j]}
                    </span>
                  ) : (
                    <Chem formula={matches[j]} />
                  ))}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

import { useMemo } from 'react';
import katex from 'katex';

/** عرض صيغة رياضية بـ KaTeX (LTR دائماً) */
export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: block, output: 'html', strict: 'ignore' });
    } catch {
      return tex.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] ?? c));
    }
  }, [tex, block]);
  return block ? (
    <div className="tex my-2 text-center" dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="tex" dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** نص عربي قد يحتوي مقاطع "$...$" تُعرض بـ KaTeX */
export function RichText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g), [text]);
  return (
    <>
      {parts.map((p, i) =>
        p.length > 2 && p.startsWith('$') && p.endsWith('$') ? <Tex key={i} tex={p.slice(1, -1)} /> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

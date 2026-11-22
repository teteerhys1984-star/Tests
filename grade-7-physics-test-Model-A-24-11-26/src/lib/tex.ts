/** تحويل نصوص "$...$" إلى صياغة نصية مقروءة (للتقرير TXT) */
export function texToPlain(s: string): string {
  return s.replace(/\$([^$]+)\$/g, (_m, t: string) => plainTex(t));
}

function plainTex(t: string): string {
  return t
    .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) / ($2)')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) / ($2)')
    .replace(/\\mathrm\{([^{}]*)\}/g, '$1')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\[,;!]/g, ' ')
    .replace(/\\ /g, ' ')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\approx/g, '≈')
    .replace(/_\{([^{}]*)\}/g, '_$1')
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    .replace(/[{}]/g, '')
    .trim();
}

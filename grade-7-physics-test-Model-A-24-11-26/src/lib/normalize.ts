/**
 * أدوات تطبيع النص العربي وقراءة الأعداد من إجابات الطالبات.
 */

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toAsciiDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const idx = ARABIC_DIGITS.indexOf(ch);
    if (idx >= 0) out += String(idx);
    else if (ch === '\u066B') out += '.';
    else if (ch === '\u066C') out += ',';
    else out += ch;
  }
  return out;
}

/** إزالة التشكيل والتطويل وتوحيد الهمزات والتاء المربوطة والياء والأرقام */
export function normalizeArabic(s: string): string {
  return toAsciiDigits(s)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[،؛]/g, ',')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** محلل تعبيرات حسابية بسيطة: + - * / () */
function evaluate(expr: string): number {
  let i = 0;
  const skip = () => {
    while (i < expr.length && expr[i] === ' ') i++;
  };
  function parseExpr(): number {
    let v = parseTerm();
    skip();
    while (i < expr.length && (expr[i] === '+' || expr[i] === '-')) {
      const op = expr[i++];
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
      skip();
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    skip();
    while (i < expr.length && (expr[i] === '*' || expr[i] === '/')) {
      const op = expr[i++];
      const r = parseFactor();
      v = op === '*' ? v * r : v / r;
      skip();
    }
    return v;
  }
  function parseFactor(): number {
    skip();
    if (expr[i] === '(') {
      i++;
      const v = parseExpr();
      skip();
      if (expr[i] !== ')') throw new Error('paren');
      i++;
      return v;
    }
    if (expr[i] === '-') {
      i++;
      return -parseFactor();
    }
    if (expr[i] === '+') {
      i++;
      return parseFactor();
    }
    const m = /^\d*\.?\d+/.exec(expr.slice(i));
    if (!m) throw new Error('number');
    i += m[0].length;
    return parseFloat(m[0]);
  }
  const v = parseExpr();
  skip();
  if (i < expr.length) throw new Error('trailing');
  return v;
}

/**
 * استخراج قيمة عددية من إجابة الطالبة:
 * يقبل الأرقام العربية، والوحدات المكتوبة مع العدد، وصيغة «... = النتيجة»، والتعبيرات الحسابية (27 ÷ 0.5).
 */
export function parseNumber(raw: string): number | null {
  if (!raw) return null;
  let s = toAsciiDigits(raw);
  if (s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1);
  s = s
    .replace(/(\d)\s*[x×✕]\s*(?=\d)/gi, '$1*')
    .replace(/[÷∶:]/g, '/')
    .replace(/[A-Za-z\u0600-\u06FF]+(?:[\/.\-·][A-Za-z\u0600-\u06FF]+)*/g, ' ')
    .replace(/[\u2070-\u209F\u00B2\u00B3\u00B9]/g, '')
    .replace(/[^0-9+\-*/().,\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;
  s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/,/g, '.');
  try {
    const v = evaluate(s);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

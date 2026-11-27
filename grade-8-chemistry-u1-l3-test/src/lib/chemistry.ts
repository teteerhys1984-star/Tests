export interface ParsedFormula {
  atoms: Record<string, number>;
  charge: number;
  totalAtoms: number;
  explicitOne: boolean;
  normalized: string;
}
const ELEMENTS = new Set(['H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn']);
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻';
export function normalizeNotation(value: string): string {
  return value.trim().replace(/\s|\u200e|\u200f/g, '')
    .replace(/[₀-₉]/g, c => String(SUBSCRIPTS.indexOf(c)))
    .replace(/[⁰¹²³⁴-⁹]/g, c => String(SUPERSCRIPTS.indexOf(c)))
    .replace(/⁺/g, '+').replace(/⁻/g, '-').replace(/\^/g, '').replace(/[−–]/g, '-');
}
/** In plain ASCII, NO3- is nitrate (not NO with charge −3), while SO42- is sulfate.
 * A terminal digit on these lesson radicals is a subscript unless another charge digit follows it.
 */
function splitIon(normalized: string): { body: string; magnitude: number; sign: string } | null {
  const match = normalized.match(/(\d?)([+-])$/);
  if (!match) return { body: normalized, magnitude: 0, sign: '' };
  const beforeSign = normalized.slice(0, -1);
  const terminalRadical = /^(NO3|SO4|PO4|NH4|CO3|OH)$/.test(beforeSign);
  const magnitude = terminalRadical ? 1 : match[1] ? Number(match[1]) : 1;
  const body = terminalRadical ? beforeSign : normalized.slice(0, normalized.length - match[0].length);
  return { body, magnitude, sign: match[2] };
}
/** A bounded recursive parser. Counts outside parentheses multiply the whole group. */
export function parseFormula(input: string): ParsedFormula | null {
  const normalized = normalizeNotation(input);
  if (!normalized || normalized.length > 100) return null;
  const ion = splitIon(normalized);
  if (!ion || ion.magnitude > 9) return null;
  const charge = ion.magnitude * (ion.sign === '+' ? 1 : ion.sign === '-' ? -1 : 0);
  const body = ion.body;
  if (!body || body.length > 90) return null;
  let index = 0;
  let explicitOne = false;
  const readNumber = (): number => {
    const start = index;
    while (index < body.length && /[0-9]/.test(body[index])) index++;
    if (start === index) return 1;
    const token = body.slice(start, index);
    if (token === '1') explicitOne = true;
    const n = Number(token);
    return Number.isSafeInteger(n) && n > 0 && n <= 999 ? n : 0;
  };
  const group = (depth: number): Record<string, number> | null => {
    if (depth > 8) return null;
    const atoms: Record<string, number> = {};
    while (index < body.length && body[index] !== ')') {
      let piece: Record<string, number> | null;
      if (body[index] === '(') {
        index++;
        piece = group(depth + 1);
        if (!piece || body[index] !== ')') return null;
        index++;
        if (body[index] === '(') return null;
      } else {
        const match = body.slice(index).match(/^[A-Z][a-z]?/);
        if (!match || !ELEMENTS.has(match[0])) return null;
        piece = { [match[0]]: 1 };
        index += match[0].length;
      }
      const multiplier = readNumber();
      if (!multiplier) return null;
      for (const [element, count] of Object.entries(piece)) {
        atoms[element] = (atoms[element] || 0) + count * multiplier;
        if (!Number.isSafeInteger(atoms[element]) || atoms[element] > 100000) return null;
      }
    }
    return Object.keys(atoms).length ? atoms : null;
  };
  const atoms = group(0);
  if (!atoms || index !== body.length) return null;
  return { atoms, charge, totalAtoms: Object.values(atoms).reduce((a, b) => a + b, 0), explicitOne, normalized };
}
export function atomCount(input: string, element?: string): number | null {
  const parsed = parseFormula(input);
  if (!parsed) return null;
  return element ? parsed.atoms[element] || 0 : parsed.totalAtoms;
}
export function sameAtoms(a: string, b: string): boolean {
  const left = parseFormula(a), right = parseFormula(b);
  if (!left || !right) return false;
  const keys = new Set([...Object.keys(left.atoms), ...Object.keys(right.atoms)]);
  return left.charge === right.charge && [...keys].every(key => (left.atoms[key] || 0) === (right.atoms[key] || 0));
}
/** Equivalent Unicode/ASCII notation is accepted; reordered or unreduced formulae are not. */
export function isCorrectFormula(input: string, expected: string): boolean {
  const actual = parseFormula(input), target = parseFormula(expected);
  return !!actual && !!target && !actual.explicitOne && actual.normalized === target?.normalized && sameAtoms(input, expected) && actual.charge === 0 && target.charge === 0;
}
export function isCorrectIon(input: string, expected: string): boolean {
  const actual = parseFormula(input), target = parseFormula(expected);
  return !!actual && !!target && !actual.explicitOne && actual.normalized === target?.normalized && sameAtoms(input, expected) && actual.charge === target.charge && actual.charge !== 0;
}
export function chargeBalance(formula: string, cation: string, anion: string): { positive: number; negative: number; net: number; cationCount: number; anionCount: number; simplest: boolean } | null {
  const compound = parseFormula(formula), positiveIon = parseFormula(cation), negativeIon = parseFormula(anion);
  if (!compound || !positiveIon || !negativeIon || compound.charge !== 0 || positiveIon.charge <= 0 || negativeIon.charge >= 0) return null;
  const positiveMarker = Object.keys(positiveIon.atoms).find(key => !negativeIon.atoms[key]);
  const negativeMarker = Object.keys(negativeIon.atoms).find(key => !positiveIon.atoms[key]);
  if (!positiveMarker || !negativeMarker) return null;
  const cationCount = (compound.atoms[positiveMarker] || 0) / positiveIon.atoms[positiveMarker];
  const anionCount = (compound.atoms[negativeMarker] || 0) / negativeIon.atoms[negativeMarker];
  if (!Number.isInteger(cationCount) || !Number.isInteger(anionCount) || cationCount < 1 || anionCount < 1) return null;
  for (const element of new Set([...Object.keys(positiveIon.atoms), ...Object.keys(negativeIon.atoms)])) {
    if ((compound.atoms[element] || 0) !== cationCount * (positiveIon.atoms[element] || 0) + anionCount * (negativeIon.atoms[element] || 0)) return null;
  }
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const positive = cationCount * positiveIon.charge, negative = anionCount * negativeIon.charge;
  return { positive, negative, net: positive + negative, cationCount, anionCount, simplest: gcd(cationCount, anionCount) === 1 };
}
export function formulaToTex(input: string): string {
  const normalized = normalizeNotation(input);
  const ion = splitIon(normalized);
  const body = ion?.body || normalized;
  let result = '', leading = true;
  for (let i = 0; i < body.length;) {
    const symbol = body.slice(i).match(/^[A-Z][a-z]?/);
    if (symbol) { result += `\\mathrm{${symbol[0]}}`; i += symbol[0].length; leading = false; }
    else if (/\d/.test(body[i])) {
      const number = body.slice(i).match(/^\d+/)![0];
      result += leading ? number : `_{${number}}`;
      i += number.length;
    } else if (body[i] === '(' || body[i] === ')') { result += body[i++]; leading = false; }
    else { result += '\\mathrm{' + body[i++] + '}'; leading = false; }
  }
  if (ion?.sign) result += `^{${ion.magnitude === 1 ? '' : ion.magnitude}${ion.sign === '+' ? '+' : '-'}}`;
  return result;
}
export function formulaToUnicode(input: string): string {
  const normalized = normalizeNotation(input);
  const ion = splitIon(normalized);
  let body = ion?.body || normalized;
  let leading = true;
  body = body.replace(/[A-Z][a-z]?|\d+|[()]/g, token => {
    if (/^[A-Z]/.test(token)) { leading = false; return token; }
    if (token === '(' || token === ')') return token;
    if (leading) return token;
    return [...token].map(d => SUBSCRIPTS[Number(d)]).join('');
  });
  if (ion?.sign) body += [...(ion.magnitude === 1 ? '' : String(ion.magnitude))].map(d => SUPERSCRIPTS[Number(d)]).join('') + (ion.sign === '+' ? '⁺' : '⁻');
  return body;
}
export function plainChemText(text: string): string {
  return text.replace(/\{\{([^{}]+)\}\}/g, (_, formula) => formulaToUnicode(formula));
}
export function parseInteger(input: string): number | null {
  const normalized = input.trim().replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
  if (!/^[+-]?\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
}

export function averageSpeed(distance: number, time: number): number {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(time) || time <= 0) {
    throw new RangeError("Distance must be nonnegative and time positive.");
  }
  return distance / time;
}

export function weight(mass: number, gravity: number): number {
  if (!Number.isFinite(mass) || mass < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("Mass must be nonnegative and gravity positive.");
  }
  return mass * gravity;
}

export function massFromWeight(force: number, gravity: number): number {
  if (!Number.isFinite(force) || force < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("Weight must be nonnegative and gravity positive.");
  }
  return force / gravity;
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, "");
}

export type Unit = "m" | "s" | "m/s" | "N" | "kg" | "N/kg" | "km/h";

const unitAliases: Record<Unit, string[]> = {
  m: ["m", "م", "متر", "مترا"],
  s: ["s", "ث", "ثا", "ثانيه", "ثوان"],
  "m/s": ["m/s", "m.s-1", "م/ث", "م/ثا", "متر/ثانيه"],
  N: ["n", "ن", "نيوتن"],
  kg: ["kg", "كغ", "كغم", "كيلوغرام", "كيلوجرام"],
  "N/kg": ["n/kg", "ن/كغ", "نيوتن/كغ", "نيوتن/كيلوغرام"],
  "km/h": ["km/h", "كم/سا", "كم/ساعه", "كيلومتر/ساعه"],
};

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\s/g, "").replace(/ة/g, "ه").replace(/−/g, "-");
}

export function parseQuantity(raw: string): { value: number; unit: Unit | null; unknownUnit: boolean } | null {
  const clean = normalizeDigits(raw).trim().replace(/,/g, ".");
  const match = clean.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*?)\s*$/u);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  if (!match[2]) return { value, unit: null, unknownUnit: false };
  const suffix = normalizeUnit(match[2]);
  const unit = (Object.entries(unitAliases) as [Unit, string[]][]).find(([, aliases]) =>
    aliases.some((alias) => normalizeUnit(alias) === suffix),
  )?.[0];
  return { value, unit: unit ?? null, unknownUnit: !unit };
}

export function normalizeArabic(value: string): string {
  return normalizeDigits(value)
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

type Values = { w: number; m: number; g: number };

function evaluateExpression(expression: string, values: Values): number | null {
  const compact = normalizeDigits(expression).toLowerCase().replace(/\s/g, "").replace(/[×·]/g, "*").replace(/÷/g, "/");
  const implicit = compact
    .replace(/([wmg\d)])(?=[wmg(])/g, "$1*")
    .replace(/(\))(?=\d)/g, "$1*");
  const tokens = implicit.match(/\d+(?:\.\d+)?|[wmg()+*/-]/g);
  if (!tokens || tokens.join("") !== implicit) return null;
  let index = 0;

  function factor(): number {
    const token = tokens![index++];
    if (token === "+") return factor();
    if (token === "-") return -factor();
    if (token === "(") {
      const result = sum();
      if (tokens![index++] !== ")") throw new Error("Unclosed formula");
      return result;
    }
    if (token === "w" || token === "m" || token === "g") return values[token];
    if (token && /^\d/.test(token)) return Number(token);
    throw new Error("Invalid formula");
  }

  function product(): number {
    let result = factor();
    while (tokens![index] === "*" || tokens![index] === "/") {
      const operator = tokens![index++];
      const next = factor();
      result = operator === "*" ? result * next : result / next;
    }
    return result;
  }

  function sum(): number {
    let result = product();
    while (tokens![index] === "+" || tokens![index] === "-") {
      const operator = tokens![index++];
      const next = product();
      result = operator === "+" ? result + next : result - next;
    }
    return result;
  }

  try {
    const result = sum();
    return index === tokens.length && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// Check the relation at several valid and invalid triples, not by string matching.
export function isEquivalentWeightFormula(raw: string): boolean {
  const formula = raw.trim().replace(/\s+/g, "");
  if (formula.length > 80 || !/[wW]/.test(formula) || !/[mM]/.test(formula) || !/[gG]/.test(formula)) {
    return false;
  }
  const sides = formula.split("=");
  if (sides.length !== 2 || !sides[0] || !sides[1]) return false;
  const valid: Values[] = [
    { m: 2.5, g: 10, w: 25 },
    { m: 7, g: 1.6, w: 11.2 },
    { m: 8.5, g: 9.8, w: 83.3 },
  ];
  const invalid: Values[] = [
    { m: 2.5, g: 10, w: 20 },
    { m: 7, g: 1.6, w: 7 },
  ];
  const equalAt = (values: Values) => {
    const left = evaluateExpression(sides[0], values);
    const right = evaluateExpression(sides[1], values);
    return left !== null && right !== null && Math.abs(left - right) < 1e-8;
  };
  return valid.every(equalAt) && invalid.every((values) => !equalAt(values));
}
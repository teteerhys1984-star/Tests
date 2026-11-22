/**
 * قوانين الفيزياء وقراءة الأعداد والوحدات والتحقّق الجبري من صيغة قانون الثقل.
 *
 * هذه الوحدة لا تحتوي أي نص سؤال أو إجابة؛ منطق حسابي صرف قابل للاختبار.
 */

export type Unit = "m" | "s" | "m/s" | "N" | "kg" | "N/kg" | "km/h";

/** السرعة الوسطية = المسافة الكلية ÷ الزمن الكلي (لا متوسط السرعتين). */
export function averageSpeed(distance: number, time: number): number {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(time) || time <= 0) {
    throw new RangeError("Distance must be nonnegative and time positive.");
  }
  return distance / time;
}

/** الثقل = الكتلة × قيمة الجاذبية. */
export function weight(mass: number, gravity: number): number {
  if (!Number.isFinite(mass) || mass < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("Mass must be nonnegative and gravity positive.");
  }
  return mass * gravity;
}

/** الكتلة = الثقل ÷ قيمة الجاذبية. */
export function massFromWeight(force: number, gravity: number): number {
  if (!Number.isFinite(force) || force < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("Weight must be nonnegative and gravity positive.");
  }
  return force / gravity;
}

/** تحويل الأرقام العربية-الهندية والفارسية إلى لاتينية، وتوحيد الفاصلة العشرية. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/[٬،]/g, "");
}

const UNIT_ALIASES: Record<Unit, string[]> = {
  m: ["m", "م", "متر", "مترا", "امتار", "المتر"],
  s: ["s", "ث", "ثا", "ثانيه", "ثانيه واحده", "ثوان", "الثانيه"],
  "m/s": ["m/s", "m.s-1", "م/ث", "م/ثا", "متر/ثانيه", "م/ثانيه"],
  N: ["n", "ن", "نيوتن", "النيوتن"],
  kg: ["kg", "كغ", "كغم", "كج", "كيلوغرام", "كيلوجرام", "الكيلوغرام"],
  "N/kg": ["n/kg", "ن/كغ", "نيوتن/كغ", "نيوتن/كيلوغرام", "ن/كيلوغرام"],
  "km/h": ["km/h", "kmh", "كم/سا", "كم/ساعه", "كم/س", "كيلومتر/ساعه", "كلم/سا"],
};

function normalizeUnit(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/ة/g, "ه")
    .replace(/−/g, "-")
    .replace(/\u0640/g, "");
}

/** يقرأ كمية عددية من نص الطالب: رقم (عربي أو لاتيني) + وحدة اختيارية. */
export function parseQuantity(
  raw: string,
): { value: number; unit: Unit | null; unknownUnit: boolean } | null {
  const clean = normalizeDigits(raw)
    .replace(/٫/g, ".")
    .replace(/,/g, ".")
    .trim();
  const match = clean.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*?)\s*$/u);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = normalizeUnit(match[2] ?? "");
  if (!suffix) return { value, unit: null, unknownUnit: false };
  const unit = (Object.entries(UNIT_ALIASES) as [Unit, string[]][]).find(([, aliases]) =>
    aliases.some((alias) => normalizeUnit(alias) === suffix),
  )?.[0];
  return { value, unit: unit ?? null, unknownUnit: !unit };
}

/** تطبيع عربي للمقارنة الدلالية: تشكيل، تطويل، همزات، ياء/ألف مقصورة، تاء مربوطة، أرقام، ترقيم. */
export function normalizeArabic(value: string): string {
  return normalizeDigits(value)
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** عرض عدد دون أصفار زائدة: 2.5 · 4 · 8.5 */
export function formatNumber(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

type Values = { w: number; m: number; g: number };

/**
 * كلمات عربية مقبولة داخل صيغة قانون الثقل، تُترجم إلى رموز قبل التقييم.
 * الأطول أولاً حتى لا يُستبدل جزء من كلمة.
 */
const FORMULA_WORDS: [RegExp, string][] = [
  [/شدة\s*الجاذبية|شده\s*الجاذبيه/g, "g"],
  [/الجاذبية|الجاذبيه|جاذبية|جاذبيه/g, "g"],
  [/الكتلة|الكتله|كتلة|كتله/g, "m"],
  [/الثقل|الوزن|ثقل|وزن/g, "w"],
];

function evaluateExpression(expression: string, values: Values): number | null {
  const compact = expression
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[×·•]/g, "*")
    .replace(/÷/g, "/")
    .replace(/([wmg\d)])[.,](?=[wmg\d(])/g, "$1*");
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

/**
 * هل الصيغة المكتوبة مكافئة جبرياً لقانون الثقل؟
 * تُقبل الرموز اللاتينية (w, m, g) أو كلماتها العربية، والإشارات × · . ÷ /،
 * والضرب الضمني مثل `mg`. ويُتحقّق من العلاقة على قيم صحيحة وخاطئة معاً
 * حتى لا تُقبل متطابقات فارغة من المعنى مثل `w=w+m*g-m*g`.
 */
export function isEquivalentWeightFormula(raw: string): boolean {
  let formula = normalizeDigits(raw).trim();
  for (const [pattern, symbol] of FORMULA_WORDS) formula = formula.replace(pattern, symbol);
  formula = formula.replace(/\s+/g, "");
  if (formula.length > 80) return false;
  if (!/[wW]/.test(formula) || !/[mM]/.test(formula) || !/[gG]/.test(formula)) return false;
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

/**
 * قراءة الأعداد والوحدات وتطبيع النص العربي — منطق صرف قابل للاختبار، بلا نصوص أسئلة.
 *
 * ملاحظات مستمدّة من المصدر (`src/lib/normalize.ts` و`src/data/questions.ts`):
 *  · الطالب قد يكتب أرقاماً عربية (٥٤) أو لاتينية (54)، أو فاصلاً عربياً (٩٫٦).
 *  · قد يكتب صيغة حسابية في خانة النتيجة: «27 ÷ 0.5 = 54» أو «3000/600».
 *  · قد يكتب الوحدة داخل خانة العدد نفسه، فتُتجاهل الوحدة وتُقرأ القيمة.
 */

export type Unit = "m" | "s" | "m/s" | "N" | "kg" | "N/kg" | "km/h" | "cm";

/** تحويل الأرقام العربية-الهندية والفارسية إلى لاتينية، وتوحيد الفواصل. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\u066b/g, ".")
    .replace(/[\u066c\u060c]/g, "");
}

/**
 * تطبيع عربي للمقارنة الدلالية — **مطابق لدلالة المصدر** (`src/lib/normalize.ts`).
 *
 * مهم: لا يُزال الترقيم هنا، لأن أنماط معايير المصدر نفسها تحتوي على تعابير نمطية
 * (مثل `هيفاء|الجالسه` و`÷|/|على|قسم`)؛ لو حُوّل `|` أو `/` إلى مسافة لصار النمط
 * نصّاً حرفياً لا يطابق شيئاً. ولذلك تُطبَّع الخانة (النصّ) والنمط بالتطبيع نفسه،
 * ثم يُستعمل النمط كتعبير نمطي — كما في المصدر.
 */
export function normalizeArabic(value: string): string {
  return normalizeDigits(value)
    .replace(/[\u064b-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[،؛]/g, ",")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* قراءة القيمة العددية                                                */
/* ------------------------------------------------------------------ */

/** محلل تعبير حسابي بسيط: + - * / ( ) — بلا eval. */
function evaluate(expression: string): number {
  let index = 0;
  const skip = () => {
    while (index < expression.length && expression[index] === " ") index += 1;
  };
  function parseExpr(): number {
    let value = parseTerm();
    skip();
    while (index < expression.length && (expression[index] === "+" || expression[index] === "-")) {
      const operator = expression[index++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
      skip();
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    skip();
    while (index < expression.length && (expression[index] === "*" || expression[index] === "/")) {
      const operator = expression[index++];
      const right = parseFactor();
      value = operator === "*" ? value * right : value / right;
      skip();
    }
    return value;
  }
  function parseFactor(): number {
    skip();
    if (expression[index] === "(") {
      index += 1;
      const value = parseExpr();
      skip();
      if (expression[index] !== ")") throw new Error("paren");
      index += 1;
      return value;
    }
    if (expression[index] === "-") {
      index += 1;
      return -parseFactor();
    }
    if (expression[index] === "+") {
      index += 1;
      return parseFactor();
    }
    const match = /^\d*\.?\d+/.exec(expression.slice(index));
    if (!match) throw new Error("number");
    index += match[0].length;
    return parseFloat(match[0]);
  }
  const result = parseExpr();
  skip();
  if (index < expression.length) throw new Error("trailing");
  return result;
}

/**
 * قيمة عددية من نصّ الطالب، أو null إن تعذّرت القراءة.
 * يقبل: الأرقام العربية، الوحدة الملتصقة أو المفصولة، «… = النتيجة»، والعمليات الحسابية.
 */
export function parseNumber(raw: string): number | null {
  if (!raw) return null;
  let text = normalizeDigits(raw);
  // يُقرأ ما بعد آخر «=» (النتيجة) لا المقدّمة
  if (text.includes("=")) text = text.slice(text.lastIndexOf("=") + 1);
  text = text
    .replace(/(\d)\s*[x×✕]\s*(?=\d)/gi, "$1*")
    .replace(/[÷∶:]/g, "/")
    .replace(/[A-Za-z\u0600-\u06ff]+(?:[\/.\-·][A-Za-z\u0600-\u06ff]+)*/g, " ")
    .replace(/[\u2070-\u209f\u00b2\u00b3\u00b9]/g, "")
    .replace(/[^0-9+\-*/().,\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  text = text.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").replace(/,/g, ".");
  try {
    const value = evaluate(text);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* قراءة الوحدة                                                        */
/* ------------------------------------------------------------------ */

const UNIT_ALIASES: Record<Unit, string[]> = {
  m: ["m", "م", "متر", "أمتار", "المتر"],
  s: ["s", "ث", "ثا", "ثانية", "ثوان", "الثانية", "ثانيه"],
  "m/s": ["m/s", "m.s-1", "م/ث", "م/ثا", "متر/ثانية", "متر/ثانيه", "م/ثانيه"],
  N: ["n", "ن", "نيوتن", "النيوتن"],
  kg: ["kg", "كغ", "كغم", "كج", "كيلوغرام", "كيلوجرام", "الكيلوغرام"],
  "N/kg": ["n/kg", "ن/كغ", "نيوتن/كغ", "نيوتن/كيلوغرام", "ن/كيلوغرام"],
  "km/h": ["km/h", "kmh", "كم/سا", "كم/ساعة", "كم/س", "كيلومتر/ساعة", "كلم/سا"],
  cm: ["cm", "سم", "سنتيمتر", "السنتيمتر"],
};

function normalizeUnit(unit: string): string {
  return normalizeDigits(unit)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/ة/g, "ه")
    .replace(/−/g, "-")
    .replace(/\u0640/g, "");
}

/** يقرأ الوحدة من نصّ حرّ (وحدة مختارة من القائمة أو مكتوبة داخل الخانة). */
export function parseUnit(raw: string): Unit | null {
  const text = normalizeUnit(raw);
  if (!text) return null;
  const found = (Object.entries(UNIT_ALIASES) as [Unit, string[]][]).find(([, aliases]) =>
    aliases.some((alias) => normalizeUnit(alias) === text),
  );
  return found ? found[0] : null;
}

/**
 * كمية مقروءة: القيمة + الوحدة المكتوبة داخل الخانة (إن وُجدت).
 * قبضة على شكل «عدد صرف + لاحقة» فقط؛ أي تعبير حسابي («80 ÷ 2» أو «v = 40») يعيد null
 * ليقرأه `parseNumber` بدلاً منها — وإلا لضاع التقييم الحسابي.
 */
export function parseQuantity(raw: string): { value: number; unit: Unit | null; unknownUnit: boolean } | null {
  const text = normalizeDigits(raw).replace(/\u066b/g, ".").replace(/،/g, "").trim();
  const match = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*?)\s*$/u);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = match[2] ?? "";
  if (!suffix) return { value, unit: null, unknownUnit: false };
  const unit = parseUnit(suffix);
  /* لاحقة ليست وحدة معروفة (تعبير أو عملة حسابية) ← ليست كمية: اتركها لمحلّل التعبير. */
  if (unit === null) return null;
  return { value, unit, unknownUnit: false };
}

/* ------------------------------------------------------------------ */
/* الفيزياء — قوانين تُستعمل في المفتاح وفي الاختبارات                  */
/* ------------------------------------------------------------------ */

/** السرعة الوسطية = المسافة الكلية ÷ الزمن الكلي (لا متوسط السرعتين). */
export function averageSpeed(distance: number, time: number): number {
  if (!Number.isFinite(distance) || distance < 0 || !Number.isFinite(time) || time <= 0) {
    throw new RangeError("يجب أن تكون المسافة غير سالبة والزمن موجباً.");
  }
  return distance / time;
}

/** الثقل = الكتلة × تسارع الجاذبية. */
export function weight(mass: number, gravity: number): number {
  if (!Number.isFinite(mass) || mass < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("يجب أن تكون الكتلة غير سالبة والجاذبية موجبة.");
  }
  return mass * gravity;
}

/** الكتلة = الثقل ÷ تسارع الجاذبية. */
export function massFromWeight(force: number, gravity: number): number {
  if (!Number.isFinite(force) || force < 0 || !Number.isFinite(gravity) || gravity <= 0) {
    throw new RangeError("يجب أن يكون الثقل غير سالب والجاذبية موجبة.");
  }
  return force / gravity;
}

/** طول سهم القوة وفق مقياس الرسم: الشدّة ÷ (نيوتن لكل سنتيمتر). */
export function forceArrowLength(force: number, newtonsPerCm: number): number {
  if (!Number.isFinite(force) || force < 0 || !Number.isFinite(newtonsPerCm) || newtonsPerCm <= 0) {
    throw new RangeError("يجب أن تكون الشدّة غير سالبة والمقياس موجباً.");
  }
  return force / newtonsPerCm;
}

/** عرض عدد دون أصفار زائدة: 2.5 · 4 · 9.6 */
export function formatNumber(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

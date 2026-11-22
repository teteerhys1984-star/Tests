/**
 * بيانات مخطط المسافة بدلالة الزمن (السؤال 8) — مصدر واحد للحساب والرسم حتى لا يتعارض الشكل مع المفتاح.
 * المحور الأفقي: الزمن t (s) — المحور الشاقولي: المسافة d (m).
 */
export const DT_T_MAX = 9;
export const DT_D_MAX = 90;

export const DT_POINTS = {
  A: { t: 0, d: 0 },
  B: { t: 3, d: 30 },
  C: { t: 5, d: 30 },
  D: { t: 9, d: 90 },
} as const;

export type SegmentType = 'uniform' | 'nonuniform' | 'rest';

export const DT_SEGMENTS: { id: string; label: string; type: SegmentType }[] = [
  { id: 'ab', label: 'المقطع أ ب', type: 'uniform' },
  { id: 'bc', label: 'المقطع ب ج', type: 'rest' },
  { id: 'cd', label: 'المقطع ج د', type: 'nonuniform' },
];

/** مقدار المسافة عند لحظة t (ضمن مجال الرصد 0..9) */
export function distanceAt(t: number): number {
  if (t <= 3) return 10 * t; // أ ب: مستقيم مائل، 10 m في كل ثانية
  if (t <= 5) return 30; // ب ج: سكون
  return 30 + 3.75 * (t - 5) ** 2; // ج د: منحنٍ (المسافات تتزايد)
}

/** عينات لرسم المقطع ج د بانسيابية */
export function cdSamples(steps = 32): { t: number; d: number }[] {
  const out: { t: number; d: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = 5 + (4 * i) / steps;
    out.push({ t, d: distanceAt(t) });
  }
  return out;
}

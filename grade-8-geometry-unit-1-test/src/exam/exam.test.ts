import { describe, expect, it } from "vitest";
import {
  applyTranslation,
  dist,
  fourthVertex,
  gradeExam,
  gradePart,
  isParallelogram,
  isPartAnswered,
  midpoint,
  nearly,
  parseNumber,
  q4,
  sasCongruent,
  sssCongruent,
  stripMath,
  translationVector,
} from "./grading";
import { QUESTIONS, TOTAL_MARKS, verifyBlueprint } from "./questions";
import type { Answers, Part } from "./types";

const part = (id: string): Part => {
  for (const q of QUESTIONS) for (const p of q.parts) if (p.id === id) return p;
  throw new Error(`unknown part ${id}`);
};

/** A fully-correct answer sheet, built from the answer key itself. */
function perfectAnswers(): Answers {
  const a: Answers = {};
  for (const q of QUESTIONS) {
    for (const p of q.parts) {
      switch (p.type) {
        case "mcq":
          a[p.id] = p.correct;
          break;
        case "multi":
          a[p.id] = [...p.correct];
          break;
        case "tf":
          a[p.id] = Object.fromEntries(
            p.items.map((it) => [
              it.id,
              it.answer
                ? { verdict: "true" as const }
                : { verdict: "false" as const, correction: it.correctCorrection },
            ]),
          );
          break;
        case "match":
          a[p.id] = { ...p.solution };
          break;
        case "order":
          a[p.id] = [...p.correctOrder];
          break;
        case "numeric":
          a[p.id] = Object.fromEntries(p.fields.map((f) => [f.id, String(f.answer)]));
          break;
        case "cloze":
          a[p.id] = Object.fromEntries(
            p.pieces
              .filter((x): x is Exclude<typeof x, string> => typeof x !== "string")
              .map((x) => [x.blank.id, x.blank.correct]),
          );
          break;
        case "plot":
          a[p.id] = Object.fromEntries(p.targets.map((t) => [t.id, { x: t.x, y: t.y }]));
          break;
      }
    }
  }
  return a;
}

/* ───────────────────────── blueprint ───────────────────────── */

describe("بنية الاختبار", () => {
  it("يحتوي سبعة أسئلة رئيسية بالضبط", () => {
    expect(QUESTIONS).toHaveLength(7);
  });

  it("مجموع العلامات يساوي ١٠٠ بالضبط", () => {
    expect(TOTAL_MARKS).toBe(100);
  });

  it("توزيع العلامات ٦ × ١٥ +  × ١٠", () => {
    expect(QUESTIONS.map((q) => q.marks)).toEqual([15, 15, 15, 15, 15, 15, 10]);
  });

  it("علامات كلّ فرع تتجمّع إلى علامة سؤالها، ولا_issues في المخطّط", () => {
    expect(verifyBlueprint()).toEqual([]);
    for (const q of QUESTIONS) {
      const sum = q.parts.reduce((s, p) => s + p.marks, 0);
      expect(sum).toBe(q.marks);
    }
  });

  it("كلّ فرع يحمل مرجعاً إلى الكتاب وشرحاً كاملاً", () => {
    for (const q of QUESTIONS)
      for (const p of q.parts) {
        expect(p.reference.length).toBeGreaterThan(3);
        expect(p.explanation.length).toBeGreaterThan(40);
      }
  });

  it("لا يظهر أيّ أمر LaTeX خام داخل نصّ الخيارات بعد التحويل", () => {
    for (const q of QUESTIONS)
      for (const p of q.parts) {
        if (p.type === "mcq" || p.type === "multi")
          for (const o of p.options) expect(stripMath(o.text)).not.toMatch(/\\/);
      }
  });
});

/* ───────────────────────── geometry kernels ───────────────────────── */

describe("حسابات الانسحاب", () => {
  it("ناقل الانسحاب من A(1,2) إلى B(5,3) هو (4,1)", () => {
    expect(translationVector({ x: 1, y: 2 }, { x: 5, y: 3 })).toEqual({ x: 4, y: 1 });
  });

  it("M(2,5) → M′(6,6) وفق الناقل (4,1)", () => {
    expect(applyTranslation({ x: 2, y: 5 }, { x: 4, y: 1 })).toEqual({ x: 6, y: 6 });
  });

  it("N(6,1) → N′(10,2) وهي النقطة K", () => {
    expect(applyTranslation({ x: 6, y: 1 }, { x: 4, y: 1 })).toEqual({ x: 10, y: 2 });
  });

  it("الناقل من P(2,1) إلى Q(7,4) هو (5,3)", () => {
    expect(translationVector({ x: 2, y: 1 }, { x: 7, y: 4 })).toEqual({ x: 5, y: 3 });
  });

  it("س6: صور رؤوس المثلث A(1,1) B(5,1) C(1,4) وفق (4,3)", () => {
    const v = { x: 4, y: 3 };
    expect(applyTranslation({ x: 1, y: 1 }, v)).toEqual({ x: 5, y: 4 });
    expect(applyTranslation({ x: 5, y: 1 }, v)).toEqual({ x: 9, y: 4 });
    expect(applyTranslation({ x: 1, y: 4 }, v)).toEqual({ x: 5, y: 7 });
  });

  it("س6: صورة مركز الدائرة O(2,5) هي O′(6,8) ونصف القطر لا يتغيّر", () => {
    expect(applyTranslation({ x: 2, y: 5 }, { x: 4, y: 3 })).toEqual({ x: 6, y: 8 });
  });

  it("الانسحاب يحفظ الأطوال: A′B′ = AB و B′C′ = BC", () => {
    const v = { x: 4, y: 3 };
    const A = { x: 1, y: 1 }, B = { x: 5, y: 1 }, C = { x: 1, y: 4 };
    const A2 = applyTranslation(A, v), B2 = applyTranslation(B, v), C2 = applyTranslation(C, v);
    expect(nearly(dist(A, B), dist(A2, B2))).toBe(true);
    expect(nearly(dist(B, C), dist(B2, C2))).toBe(true);
    expect(dist(A, B)).toBe(4);
    expect(dist(B, C)).toBe(5);
    expect(dist(A, B) + dist(B, C) + dist(C, A)).toBe(12);
  });

  it("الانسحاب لا يدير الشكل: صورة المثلث تطابقه بضلعٍ ضلع", () => {
    const v = { x: 4, y: 0 };
    const t1: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 1, y: 3 },
    ];
    const t2 = t1.map((p) => applyTranslation(p, v)) as typeof t1;
    expect(sssCongruent(t1, t2)).toBe(true);
    expect(sasCongruent(t1, t2)).toBe(true);
    // س7: A و B و B′ على استقامة واحدة و AB′ = 2·AB
    expect(t2[0]).toEqual(t1[1]);
    expect(dist(t1[0], t2[1])).toBe(2 * dist(t1[0], t1[1]));
  });
});

describe("متوازي الأضلاع", () => {
  it("س5: الرأس الرابع لـ A(1,1) B(6,2) C(8,6) هو D(3,5)", () => {
    const D = fourthVertex({ x: 1, y: 1 }, { x: 6, y: 2 }, { x: 8, y: 6 });
    expect(D).toEqual({ x: 3, y: 5 });
    expect(isParallelogram({ x: 1, y: 1 }, { x: 6, y: 2 }, { x: 8, y: 6 }, D)).toBe(true);
  });

  it("ترتيب الرؤوس مهمّ: A C B D ليس متوازي أضلاع", () => {
    expect(
      isParallelogram({ x: 1, y: 1 }, { x: 8, y: 6 }, { x: 6, y: 2 }, { x: 3, y: 5 }),
    ).toBe(false);
  });

  it("القطران متناصفان في متوازي الأضلاع", () => {
    const A = { x: 0, y: 0 }, B = { x: 6, y: 0 }, C = { x: 8.2, y: 4.2 }, D = { x: 2.2, y: 4.2 };
    const o1 = midpoint(A, C);
    const o2 = midpoint(B, D);
    expect(nearly(o1.x, o2.x)).toBe(true);
    expect(nearly(o1.y, o2.y)).toBe(true);
  });

  it("س5: AC = 12.4 ⇒ AO = 6.2 و BD = 7 ⇒ OD = 3.5", () => {
    expect(12.4 / 2).toBeCloseTo(6.2, 10);
    expect(7 / 2).toBeCloseTo(3.5, 10);
  });

  it("س5: AB = 7 و BC = 4.5 ⇒ المحيط 23، و Â = 115° ⇒ B̂ = 65°", () => {
    expect(2 * (7 + 4.5)).toBe(23);
    expect(180 - 115).toBe(65);
  });

  it("س7: الرباعيان ACC′B و BCC′B′ متوازيا أضلاع", () => {
    const A = { x: 0, y: 0 }, B = { x: 4, y: 0 }, C = { x: 1, y: 3 };
    const v = translationVector(A, B);
    const B2 = applyTranslation(B, v);
    const C2 = applyTranslation(C, v);
    expect(isParallelogram(A, C, C2, B)).toBe(true);
    expect(isParallelogram(B, C, C2, B2)).toBe(true);
  });

  it("س6: الرباعي ABB′A′ متوازي أضلاع", () => {
    const A = { x: 1, y: 1 }, B = { x: 5, y: 1 };
    const v = { x: 4, y: 3 };
    expect(isParallelogram(A, B, applyTranslation(B, v), applyTranslation(A, v))).toBe(true);
  });
});

describe("تطابق المثلثات", () => {
  it("س4: وتر وضلع قائمة ⇒ تطابق، والمقابلة A↔D و B↔E و C↔F", () => {
    const t1: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
      { x: 0, y: 0 },
      { x: 3.6, y: 0 },
      { x: 3.6, y: 2.7 },
    ];
    const t2 = [
      { x: 10.2, y: 0 },
      { x: 6.6, y: 0 },
      { x: 6.6, y: 2.7 },
    ] as typeof t1;
    expect(sssCongruent(t1, t2)).toBe(true);
    expect(nearly(dist(t1[0], t1[2]), dist(t2[0], t2[2]))).toBe(true); // الوتران
    expect(nearly(dist(t1[0], t1[1]), dist(t2[0], t2[1]))).toBe(true); // ضلعا القائمة
    expect(nearly(dist(t1[1], t1[2]), dist(t2[1], t2[2]))).toBe(true); // BC = EF
  });

  it("س4: القطعتان المتناصفتان تعطي تطابقاً بالحالة ① (ضلعان والزاوية المحصورة)", () => {
    const O = { x: 0, y: 0 };
    const A = { x: -4.2, y: -2.1 }, B = { x: 4.2, y: 2.1 };
    const C = { x: -3.2, y: 3.1 }, D = { x: 3.2, y: -3.1 };
    expect(midpoint(A, B)).toEqual(O);
    expect(midpoint(C, D)).toEqual(O);
    expect(sasCongruent([A, O, C], [B, O, D])).toBe(true);
    expect(sssCongruent([A, O, C], [B, O, D])).toBe(true);
  });

  it("س4/2: المقابلة الصحيحة في متوازي الأضلاع هي ABC ≅ CDA لا ABC ≅ ACD", () => {
    const A = { x: 0, y: 0 }, B = { x: 5.2, y: 0 }, C = { x: 7.4, y: 3.4 }, D = { x: 2.2, y: 3.4 };
    expect(sssCongruent([A, B, C], [C, D, A])).toBe(true);
    expect(sssCongruent([A, B, C], [A, C, D])).toBe(false);
  });

  it("زاويتان متساويتان وحدهما لا تكفيان للتطابق (س4/5)", () => {
    const small = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
    ] as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    const big = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 5 },
    ] as typeof small;
    expect(sssCongruent(small, big)).toBe(false);
  });
});

/* ───────────────────────── grading ───────────────────────── */

describe("قراءة الأعداد", () => {
  it("يقبل الأرقام العربية والفاصلة العشرية والوحدات", () => {
    expect(parseNumber("٦")).toBe(6);
    expect(parseNumber("۴")).toBe(4);
    expect(parseNumber("6,2")).toBe(6.2);
    expect(parseNumber(" 5.2 cm ")).toBe(5.2);
    expect(parseNumber("١٢٫٤")).toBe(12.4);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});

describe("التصحيح الكامل", () => {
  const answers = perfectAnswers();

  it("ورقة إجابات كاملة تنال ١٠٠ من ١٠٠", () => {
    const g = gradeExam(QUESTIONS, answers);
    expect(g.max).toBe(100);
    expect(g.earned).toBe(100);
    for (const q of g.questions) expect(q.earned).toBe(q.max);
  });

  it("الورقة الفارغة تنال صفراً ولا تُعتبر مكتملة", () => {
    const g = gradeExam(QUESTIONS, {});
    expect(g.earned).toBe(0);
    for (const q of QUESTIONS)
      for (const p of q.parts) expect(isPartAnswered(p, {})).toBe(false);
  });

  it("جميع فروع الورقة الكاملة تُعتبر مُجابة", () => {
    for (const q of QUESTIONS)
      for (const p of q.parts) expect(isPartAnswered(p, answers)).toBe(true);
  });
});

describe("الرصد الجزئي", () => {
  it("صح/خطأ: نصف العلامة على الحكم ونصفها على التصحيح", () => {
    const p = part("q1p2"); // 4 items × 1.5 = 6
    expect(p.marks).toBe(6);
    // حكم صحيح بلا تصحيح للعبارة الخاطئة ⇒ نصف علامة فقط لتلك العبارة
    const a: Answers = {
      q1p2: {
        i1: { verdict: "true" },
        i2: { verdict: "false" },
        i3: { verdict: "true" },
        i4: { verdict: "false" },
      },
    };
    const g = gradePart(p, a);
    expect(g.earned).toBe(1.5 + 0.75 + 1.5 + 0.75);
    // تصحيح خاطئ لا يمنح النصف الثاني
    const b: Answers = {
      q1p2: {
        i1: { verdict: "true" },
        i2: { verdict: "false", correction: "c2" },
        i3: { verdict: "true" },
        i4: { verdict: "false", correction: "d1" },
      },
    };
    expect(gradePart(p, b).earned).toBe(1.5 + 0.75 + 1.5 + 1.5);
  });

  it("الوصل: علامة مستقلّة لكلّ وصلة صحيحة", () => {
    const p = part("q1p3"); // 4 marks
    const g = gradePart(p, { q1p3: { l1: "r1", l2: "r2", l3: "r5", l4: "r4" } });
    expect(g.earned).toBe(3);
  });

  it("الترتيب: رصد تناسبى بحسب الخطوات في مواضعها", () => {
    const p = part("q2p3"); // 3 marks over 5 steps
    const g = gradePart(p, { q2p3: ["s1", "s2", "s3", "s5", "s4"] });
    expect(g.earned).toBe(q4((3 * 3) / 5));
  });

  it("الاختيار المتعدّد: تُخصم الاختيارات الخاطئة", () => {
    const p = part("q3p4"); // 3 marks, 3 correct of 5
    expect(gradePart(p, { q3p4: ["a", "b", "c"] }).earned).toBe(3);
    expect(gradePart(p, { q3p4: ["a", "b"] }).earned).toBe(2);
    expect(gradePart(p, { q3p4: ["a", "b", "c", "d"] }).earned).toBe(2);
    expect(gradePart(p, { q3p4: ["d", "e"] }).earned).toBe(0);
  });

  it("البرهان: كلّ خطوة تُرصد على حدة ولا تُلغي خطوة صحيحة بسبب أخرى خاطئة", () => {
    const p = part("q4p4"); // 4 blanks × 1
    const g = gradePart(p, { q4p4: { b1: "o1", b2: "o2", b3: "o1", b4: "o1" } });
    expect(g.earned).toBe(3);
    expect(g.lines.filter((l) => l.ok)).toHaveLength(3);
    expect(g.lines.filter((l) => !l.ok)).toHaveLength(1);
  });

  it("الإحداثيات: مقارنة عددية لا نصّية، والإحداثي الأفقي أوّلاً", () => {
    const p = part("q5p3"); // D(3,5), 2 marks each
    expect(gradePart(p, { q5p3: { dx: "٣", dy: "5" } }).earned).toBe(4);
    expect(gradePart(p, { q5p3: { dx: "5", dy: "3" } }).earned).toBe(0); // ترتيب معكوس
    expect(gradePart(p, { q5p3: { dx: "3", dy: "4" } }).earned).toBe(2);
  });

  it("رسم النقاط: علامة لكلّ نقطة في موضعها الصحيح فقط", () => {
    const p = part("q6p1");
    expect(gradePart(p, { q6p1: { A: { x: 5, y: 4 }, B: { x: 9, y: 4 }, C: { x: 5, y: 7 } } }).earned).toBe(3);
    expect(gradePart(p, { q6p1: { A: { x: 4, y: 5 }, B: { x: 9, y: 4 }, C: { x: 5, y: 7 } } }).earned).toBe(2);
  });

  it("لا تتجاوز علامة الفرع علامته القصوى", () => {
    for (const q of QUESTIONS)
      for (const p of q.parts) {
        const g = gradePart(p, perfectAnswers());
        expect(g.earned).toBeLessThanOrEqual(p.marks);
        expect(g.earned).toBe(p.marks);
      }
  });
});
import { describe, expect, it } from "vitest";
import {
  ALL_SUBS,
  CHEMISTRY_COUNT,
  CHEMISTRY_MARKS,
  ORIGINAL_IT_PROBLEMS,
  PHYSICS_COUNT,
  PHYSICS_MARKS,
  QUESTIONS,
  SOURCE_MAP,
  TOTAL_MARKS,
} from "../data/exam";
import type { AnswerMap, Question } from "../data/types";
import { answeredCount, gradeAttempt, gradeSub, isComplete, normalize, parseNumber, stopwatch } from "../lib/grade";
import { formatPointsBadge, renderTexToString } from "../lib/math";
import { SOLUTIONS } from "../data/solutions";

const phys = () => QUESTIONS.filter((q) => q.subject === "physics");
const chem = () => QUESTIONS.filter((q) => q.subject === "chemistry");

describe("بنية الاختبار", () => {
  it("24 سؤالاً: 12 فيزياء و12 كيمياء", () => {
    expect(QUESTIONS).toHaveLength(24);
    expect(PHYSICS_COUNT).toBe(12);
    expect(CHEMISTRY_COUNT).toBe(12);
  });

  it("الدرجات: 50 + 50 = 100، وعشرة أسئلة بـ4 وسؤالان بـ5 في كل مادة", () => {
    expect(PHYSICS_MARKS).toBe(50);
    expect(CHEMISTRY_MARKS).toBe(50);
    expect(TOTAL_MARKS).toBe(100);
    for (const group of [phys(), chem()]) {
      expect(group.filter((q) => q.marks === 4)).toHaveLength(10);
      expect(group.filter((q) => q.marks === 5)).toHaveLength(2);
      expect(group.reduce((s, q) => s + q.marks, 0)).toBe(50);
    }
  });

  it("مجموع درجات المطالب يساوي درجة السؤال تماماً", () => {
    for (const q of QUESTIONS) {
      const sum = q.subs.reduce((s, x) => s + x.points, 0);
      expect(Math.abs(sum - q.marks)).toBeLessThan(1e-9);
    }
  });

  it("المواد متبادلة: لا يتابع سؤالان من المادة نفسها", () => {
    for (let i = 0; i < QUESTIONS.length - 1; i += 1) {
      expect(QUESTIONS[i].subject).not.toBe(QUESTIONS[i + 1].subject);
    }
    expect(QUESTIONS[0].subject).toBe("chemistry");
  });

  it("خمس مسائل أصلية من الاختبار المستقل: 1، 4، 7، 11، 14", () => {
    const originals = phys()
      .filter((q) => q.src.origin === "independent-test")
      .map((q) => q.src.itProblem)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(originals).toEqual(ORIGINAL_IT_PROBLEMS);
    const images = phys()
      .filter((q) => q.src.origin === "independent-test")
      .map((q) => q.src.itImage ?? 0)
      .sort((a, b) => a - b);
    expect(images).toEqual([1, 4, 7, 11, 14]);
  });

  it("لا يوجد أي نوع اختيار من متعدد", () => {
    const kinds = new Set(ALL_SUBS.map((x) => x.s.kind));
    expect([...kinds].sort()).toEqual(["draw", "lewis", "matrix", "numeric", "text"]);
  });

  it("كل سؤال وكل مطلب يحمل مرجع مصدر مخفياً", () => {
    for (const q of QUESTIONS) {
      expect(q.src.subject).toBeTruthy();
      expect(q.src.lesson.length).toBeGreaterThan(3);
      expect(q.src.page.length).toBeGreaterThan(0);
      expect(q.src.source.length).toBeGreaterThan(3);
      expect(q.src.skill.length).toBeGreaterThan(3);
      expect(["textbook", "independent-test"]).toContain(q.src.origin);
      for (const s of q.subs) expect(s.id && s.answer).toBeTruthy();
    }
    expect(SOURCE_MAP).toHaveLength(24);
  });

  it("ستة أسئلة كيمياء لكل درس", () => {
    expect(chem().filter((q) => q.src.lesson.includes("الأول"))).toHaveLength(6);
    expect(chem().filter((q) => q.src.lesson.includes("الثاني"))).toHaveLength(6);
  });

  it("الفيزياء محصورة في درسي الوحدة الأولى + الاختبار المستقل", () => {
    for (const q of phys()) {
      expect(q.src.unit).toBe("الوحدة الأولى");
      expect(q.src.lesson).toMatch(/الدرس الأول|الدرس الثاني/);
    }
  });

  it("الأرقام المتتابعة من 1 إلى 24", () => {
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it("لا توجد أي تلميحات (placeholder) داخل مطالب الإجابة", () => {
    for (const q of QUESTIONS) {
      for (const s of q.subs) {
        expect("placeholder" in s).toBe(false);
      }
    }
  });
});

describe("الحسابات العلمية", () => {
  const numericValue = (qid: string, sid: string): number => {
    const q = QUESTIONS.find((x) => x.id === qid)!;
    const s = q.subs.find((x) => x.id === sid)!;
    if (s.answer.kind !== "numeric") throw new Error("not numeric");
    return s.answer.value;
  };

  it("المسائل الأصلية الخمس بقيمها الأصلية", () => {
    expect(numericValue("ph-it-01", "p1-mag")).toBe(60);
    expect(numericValue("ph-it-01", "p1-d1")).toBe(1.5);
    expect(numericValue("ph-it-01", "p1-d2")).toBe(0.5);
    expect(numericValue("ph-it-04", "p4-mag")).toBe(60);
    expect(numericValue("ph-it-04", "p4-d1")).toBe(0.9);
    expect(numericValue("ph-it-04", "p4-d2")).toBe(0.3);
    expect(numericValue("ph-it-07", "p7-mag")).toBe(5);
    expect(numericValue("ph-it-07", "p7-alpha")).toBeCloseTo(53.13, 2);
    expect(numericValue("ph-it-14", "p14-mag")).toBeCloseTo(138.6, 1);
    expect(numericValue("ph-it-14", "p14-alpha")).toBe(30);
  });

  it("علاقات فيثاغورث والقوى المتوازية", () => {
    expect(Math.sqrt(50 ** 2 - 30 ** 2)).toBe(40); // تحليل قوة
    expect(numericValue("ph-book-03", "rs-1")).toBe(40);
    expect(numericValue("ph-book-06", "dp-1")).toBe(60);
    expect(numericValue("ph-book-06", "dp-2")).toBe(2); // d1 = F2/(F1+F2) × d
    expect(Math.abs((40 / 60) * 3 - 2)).toBeLessThan(1e-9);
    // P1: d1/d2 = F2/F1 و d1 + d2 = 2
    expect(Math.abs(15 * 1.5 - 45 * 0.5)).toBeLessThan(1e-9);
    // P4: d1 − d2 = 0.6 و F1d1 = F2d2
    expect(Math.abs(0.9 - 0.3 - 0.6)).toBeLessThan(1e-9);
    expect(Math.abs(30 * 0.9 - 90 * 0.3)).toBeLessThan(1e-9);
    // P14: معيّن بزاوية 60°
    expect(2 * 80 * Math.cos((Math.PI / 180) * 30)).toBeCloseTo(138.6, 1);
  });

  it("حسابات الكيمياء", () => {
    expect(35 - 17).toBe(18);
    expect(2 * 3 ** 2).toBe(18);
    expect(2 * 4 ** 2).toBe(32);
    expect([1 - 1, 2 - 1, 3 - 1]).toEqual([0, 1, 2]);
  });
});

describe("محرّك التصحيح", () => {
  const find = (id: string): Question => QUESTIONS.find((q) => q.subs.some((s) => s.id === id))!;
  const subOf = (id: string) => find(id).subs.find((s) => s.id === id)!;

  it("الدرجة الكاملة للقيمة الرقمية الصحيحة", () => {
    const s = subOf("p1-mag");
    const r = gradeSub(s, { "p1-mag": "60" } as AnswerMap);
    expect(r.awarded).toBe(s.points);
  });

  it("وحدة أو مسافة زائدة لا تُفقد الدرجة", () => {
    const s = subOf("p1-mag");
    expect(gradeSub(s, { "p1-mag": " 60 N " } as AnswerMap).awarded).toBe(s.points);
  });

  it("نصف الدرجة عند خطأ حسابي صغير", () => {
    const s = subOf("p1-mag");
    expect(gradeSub(s, { "p1-mag": "63" } as AnswerMap).awarded).toBeCloseTo(s.points / 2, 5);
  });

  it("لا درجة عند قيمة خاطئة كلياً", () => {
    const s = subOf("p1-mag");
    expect(gradeSub(s, { "p1-mag": "100" } as AnswerMap).awarded).toBe(0);
    expect(gradeSub(s, { "p1-mag": "" } as AnswerMap).awarded).toBe(0);
  });

  it("الأرقام العربية تُقرأ", () => {
    expect(parseNumber("٦٠")).toBe(60);
    expect(parseNumber("1٫5")).toBe(1.5);
  });

  it("درجة جزئية حسب معايير الإجابة المكتوبة", () => {
    const s = subOf("pd-1");
    const full = gradeSub(s, { "pd-1": "القوى المتوازية هي القوى التي تكون حواملها مستقيمات متوازية" } as AnswerMap);
    expect(full.awarded).toBe(s.points);
    const half = gradeSub(s, { "pd-1": "تتلاقى حواملها" } as AnswerMap);
    expect(half.awarded).toBeGreaterThan(0);
    expect(half.awarded).toBeLessThan(s.points);
    const none = gradeSub(s, { "pd-1": "شيء آخر" } as AnswerMap);
    expect(none.awarded).toBe(0);
  });

  it("الجداول تمنح درجة جزئية بعدد الخانات الصحيحة", () => {
    const s = subOf("tbl-1");
    const r = gradeSub(s, {
      "tbl-1": JSON.stringify({
        "na-e": "11",
        "na-p": "11",
        "na-s": "0",
        "nai-e": "10",
        "nai-p": "11",
        "nai-s": "+1",
        "cl-e": "17",
        "cl-p": "17",
        "cl-s": "0",
        "cli-e": "18",
        "cli-p": "17",
        "cli-s": "",
      }),
    } as AnswerMap);
    expect(r.awarded).toBeCloseTo((11 / 12) * 4, 2);
  });

  it("تمثيل لويس: نصف الدرجة للمشترك ونصف للغير مشترك", () => {
    const s = subOf("h2-lewis");
    const full = gradeSub(s, { "h2-lewis": JSON.stringify({ shared: 1, lone: [0, 0] }) } as AnswerMap);
    expect(full.awarded).toBe(s.points);
    const half = gradeSub(s, { "h2-lewis": JSON.stringify({ shared: 1, lone: [1, 1] }) } as AnswerMap);
    expect(half.awarded).toBeCloseTo(s.points / 2, 5);
  });

  it("الرسوم تُصحَّح بالتسميات المطلوبة وإتمام الرسم", () => {
    const s = subOf("rs-3");
    const full = gradeSub(s, { "rs-3": JSON.stringify({ strokes: 4, labels: ["F", "F₁", "F₂"] }) } as AnswerMap);
    expect(full.awarded).toBe(s.points);
    const partial = gradeSub(s, { "rs-3": JSON.stringify({ strokes: 4, labels: ["F"] }) } as AnswerMap);
    expect(partial.awarded).toBeGreaterThan(0);
    expect(partial.awarded).toBeLessThan(s.points);
  });

  it("لا يكتمل الاختبار قبل الإجابة عن كل المطالب", () => {
    const empty: AnswerMap = {};
    expect(isComplete(QUESTIONS, empty)).toBe(false);
    expect(answeredCount(QUESTIONS, empty)).toBe(0);
    const full: AnswerMap = {};
    for (const q of QUESTIONS) {
      for (const s of q.subs) {
        if (s.kind === "numeric") full[s.id] = String(s.answer.kind === "numeric" ? s.answer.value : 0);
        else if (s.kind === "text")
          full[s.id] = s.answer.kind === "text" ? s.answer.criteria.map((c) => c.any[0]).join(" ") : "";
        else if (s.kind === "matrix")
          full[s.id] = JSON.stringify(
            Object.fromEntries((s.answer.kind === "matrix" ? s.answer.cells : []).map((c) => [c.id, c.accept[0]])),
          );
        else if (s.kind === "lewis")
          full[s.id] =
            s.answer.kind === "lewis"
              ? JSON.stringify({ shared: s.answer.shared, lone: [s.answer.loneLeft, s.answer.loneRight] })
              : "";
        else full[s.id] = JSON.stringify({ strokes: 3, labels: s.answer.kind === "draw" ? s.answer.labels : [] });
      }
    }
    expect(isComplete(QUESTIONS, full)).toBe(true);
    const score = gradeAttempt(QUESTIONS, full);
    expect(score.total).toBe(100);
    expect(score.physics).toBe(50);
    expect(score.chemistry).toBe(50);
  });

  it("المجموع لا يتجاوز الدروج المشروطة", () => {
    const score = gradeAttempt(QUESTIONS, {});
    expect(score.total).toBe(0);
    expect(score.perQuestion.every((r) => r.awarded >= 0 && r.awarded <= r.question.marks)).toBe(true);
  });
});

describe("المؤقّت", () => {
  it("يعرض HH:MM:SS", () => {
    const t0 = 1_700_000_000_000;
    expect(stopwatch(t0, t0)).toBe("00:00:00");
    expect(stopwatch(t0 + 3_723_000, t0)).toBe("01:02:03");
    expect(stopwatch(t0 - 5000, t0)).toBe("00:00:00");
  });

  it("يوحّد النصوص العربية قبل المقارنة", () => {
    expect(normalize("الرَّابِطَةُ الأيونيّة")).toBe(normalize("الرابطة الايونية"));
  });

  it("يعرض جميع الصيغ الرياضية والرموز بمحرك KaTeX حصراً وبدون اختصار (در.)", () => {
    for (const pts of [0.5, 1, 1.5, 2, 3, 4, 5]) {
      const badge = formatPointsBadge(pts);
      expect(badge).not.toContain("در.");
      expect(badge).toMatch(/علام/);
    }
    const extractTokens = (txt: string) => [...txt.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);
    for (const q of QUESTIONS) {
      for (const tok of [...extractTokens(q.stem), ...(q.givens ?? [])]) {
        const html = renderTexToString(tok);
        expect(html).toContain("katex");
      }
      for (const s of q.subs) {
        for (const tok of extractTokens(s.label)) {
          expect(renderTexToString(tok)).toContain("katex");
        }
      }
      const sol = SOLUTIONS[q.id];
      if (sol) {
        for (const st of sol.steps) {
          for (const tok of extractTokens(st)) {
            expect(renderTexToString(tok)).toContain("katex");
          }
        }
      }
    }
  });

  it("يصلح تلقائياً أخطاء slashes الشائعة: mathrm / text / circ / Delta", () => {
    expect(renderTexToString("{}^{35}_{17}mathrm{Cl}")).toContain("katex");
    expect(renderTexToString("90^{circ}")).toContain("katex");
    expect(renderTexToString("(Delta)")).toContain("katex");
    expect(renderTexToString("{}_{11}mathrm{Na}\t ext{-}8\t ext{-}1".replace(/\t /g, "\t"))).toContain("katex");
  });
});

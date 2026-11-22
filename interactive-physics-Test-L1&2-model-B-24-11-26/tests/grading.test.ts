import { describe, expect, it } from "vitest";
import { MOTION_POINTS, FORCE_SECTIONS, FORCE_SECTION_UNITS } from "../src/components/Figures";
import { answerKey } from "../src/data/answerKey";
import { questions, totalParts } from "../src/data/questions";
import { gradeExam, gradePart, isExamComplete, type Responses } from "../src/lib/grading";
import { buildReport } from "../src/lib/report";
import type { Attempt } from "../src/lib/persistence";

const textAnswers: Responses = {
  q1d: "زمن المرحلتين مختلف، لذا نحسب مجموع المسافات على الزمن الكلي.",
  q3d: "موضع هدى ثابت بالنسبة إلى المصعد، ويتغير بالنسبة إلى صديقتها عند الباب.",
  q4d: "الكتلة ثابتة لأن كمية المادة نفسها، والجاذبية تختلف على القمر.",
  q5e: "ميل المقطع الأخير أكبر، لذلك السرعة فيه أكبر.",
  q6d: "القوة يمكن أن تغير حالة الجسم الحركية أو شكله.",
  q10b: "القوة قد تغير حركة العربة، مثل أن تتغير سرعتها أو اتجاهها.",
  q10d: "العمود مرجع نقارن به موضع العربة لنعرف تغيره مع الزمن.",
};

function allCorrect(): Responses {
  const responses = { ...textAnswers };
  for (const question of questions) {
    for (const part of question.parts) {
      const rubric = answerKey[question.id].rubric[part.id];
      if (rubric.kind === "choice") responses[part.id] = rubric.correctOption;
      if (rubric.kind === "number") responses[part.id] = String(rubric.value);
      if (rubric.kind === "formula") responses[part.id] = "m=w/g";
    }
  }
  return responses;
}

describe("assessment integrity and partial scoring", () => {
  it("has exactly ten main questions, each ten marks, for exactly 100", () => {
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((question) => question.id)).size).toBe(10);
    expect(new Set(questions.flatMap((question) => question.parts.map((part) => part.id))).size).toBe(totalParts);
    expect(Object.keys(answerKey)).toHaveLength(10);
    for (const question of questions) {
      expect(question.parts.length).toBeGreaterThan(1);
      expect(Object.keys(answerKey[question.id].rubric)).toHaveLength(question.parts.length);
      expect(question.parts.reduce((sum, part) => sum + answerKey[question.id].rubric[part.id].points, 0)).toBe(10);
    }
    expect(questions.every((question) => question.pages.includes("ص "))).toBe(true);
    expect(questions.every((question) => !question.lesson.includes("حامل واحد"))).toBe(true);
  });

  it("awards 100 to independently verified correct responses", () => {
    const responses = allCorrect();
    expect(isExamComplete(questions, responses)).toBe(true);
    const result = gradeExam(questions, responses, answerKey);
    expect(result.possible).toBe(100);
    expect(result.total).toBe(100);
    expect(result.correctCount).toBe(totalParts);
    expect(result.incorrectCount).toBe(0);
  });

  it("keeps every authored numerical answer aligned with its scenario", () => {
    const expected = {
      q1a: 200, q1b: 80, q1c: 2.5,
      q2d: 15, q4a: 25, q4b: 4,
      q5d: 20, q7b: 20, q8b: 42,
      q9b: 85, q9c: 10, q9d: 8.5,
    };
    for (const [partId, value] of Object.entries(expected)) {
      const questionId = partId.match(/^q\d+/)?.[0];
      const rubric = answerKey[questionId!].rubric[partId];
      assertNumberRubric(rubric);
      expect(rubric.value, partId).toBe(value);
    }
    expect(answerKey.q2.rubric.q2b.kind === "choice" && answerKey.q2.rubric.q2b.correctOption).toBe("1");
    expect(answerKey.q3.rubric.q3c.kind === "choice" && answerKey.q3.rubric.q3c.correctOption).toBe("1");
    expect(answerKey.q8.rubric.q8a.kind === "choice" && answerKey.q8.rubric.q8a.correctOption).toBe("1");
  });

  it("gates submission until every branch is filled", () => {
    const responses = allCorrect();
    delete responses.q10d;
    expect(isExamComplete(questions, responses)).toBe(false);
    responses.q10d = "   ";
    expect(isExamComplete(questions, responses)).toBe(false);
  });

  it("awards partial credit for correct magnitude, reasoning and independent steps", () => {
    const responses = allCorrect();
    responses.q1c = "٢٫٥ kg";
    responses.q1d = "الزمن مختلف";
    responses.q2c = "0";
    const result = gradeExam(questions, responses, answerKey);
    expect(result.total).toBe(97);
    expect(result.correctCount).toBe(totalParts - 3);
    expect(result.incorrectCount).toBe(3);
    expect(result.questions[0].earned).toBe(8);
    expect(result.questions[1].earned).toBe(9);
    expect(gradePart("25 N", answerKey.q4.rubric.q4a)).toBe(3);
    expect(gradePart("25 kg", answerKey.q4.rubric.q4a)).toBe(2);
    expect(gradePart("الكتلة ثابتة لأن المادة نفسها، والجاذبية على القمر أقل", answerKey.q4.rubric.q4d)).toBe(2);
  });

  it("records every prompt, answer, point and explanation in the UTF-8 report text", () => {
    const responses = allCorrect();
    const result = gradeExam(questions, responses, answerKey);
    const attempt: Attempt = { version: 1, status: "submitted", studentName: "ريم أحمد", responses, questionIndex: 9, startedAt: 1000, finishedAt: 62000 };
    const report = buildReport(questions, attempt, result);
    expect(report).toContain("اسم الطالبة: ريم أحمد");
    expect(report).toContain("العلامة النهائية: 100 من 100");
    expect(report).toContain("الوقت المستغرق: 00:01:01");
    expect(report).toContain("السؤال 10:");
    expect(report).toContain("إجابة الطالبة:");
    expect(report).toContain("الإجابة الصحيحة:");
    expect(report).toContain("العلامة المستحقة:");
    expect(report).toContain("مرجع الرسم:");
    expect(report).not.toContain("\\frac");
    expect(report).not.toContain("frac");
    expect(report.match(/العلامة المستحقة:/g)).toHaveLength(totalParts);
  });

  it("matches diagram geometry and answers exactly", () => {
    expect(FORCE_SECTIONS * FORCE_SECTION_UNITS).toBe(180);
    expect(FORCE_SECTIONS * 5).toBe(15);
    expect(MOTION_POINTS).toEqual([[0, 0], [4, 20], [8, 20], [12, 60]]);
    const speed1 = (MOTION_POINTS[1][1] - MOTION_POINTS[0][1]) / (MOTION_POINTS[1][0] - MOTION_POINTS[0][0]);
    const speed2 = (MOTION_POINTS[2][1] - MOTION_POINTS[1][1]) / (MOTION_POINTS[2][0] - MOTION_POINTS[1][0]);
    const speed3 = (MOTION_POINTS[3][1] - MOTION_POINTS[2][1]) / (MOTION_POINTS[3][0] - MOTION_POINTS[2][0]);
    expect([speed1, speed2, speed3]).toEqual([5, 0, 10]);
    expect(7 + 5 + 8).toBe(20);
  });
});

function assertNumberRubric(rubric: typeof answerKey.q1.rubric.q1a): asserts rubric is Extract<typeof rubric, { kind: "number" }> {
  expect(rubric.kind).toBe("number");
}
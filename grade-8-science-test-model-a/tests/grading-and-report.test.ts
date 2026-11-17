import { describe, expect, it } from "vitest";
import { QUESTIONS, TOTAL_MARKS } from "@/data/exam";
import type { AnswerMap, Question, SubItem } from "@/data/types";
import {
  answeredCount,
  gradeAttempt,
  gradeSub,
  isComplete,
  normalize,
  parseNumber,
  stopwatch,
  totalSubCount,
} from "@/lib/grade";
import {
  buildExamReport,
  reportToText,
  validateReport,
  reportFilename,
  lessonTitle,
  statusOf,
} from "@/lib/report";
import { completeAttempt, emptyAnswers, fullAnswers } from "./helpers";

const subOf = (id: string): SubItem =>
  QUESTIONS.flatMap((q) => q.subs).find((s) => s.id === id) as SubItem;
const questionOf = (id: string): Question => QUESTIONS.find((q) => q.subs.some((s) => s.id === id)) as Question;

describe("Grading engine", () => {
  it("awards full marks for the exact numeric value, tolerating units and spaces", () => {
    const s = subOf("p1-mag");
    expect(gradeSub(s, { "p1-mag": "60" } as AnswerMap).awarded).toBe(s.points);
    expect(gradeSub(s, { "p1-mag": " 60 N " } as AnswerMap).awarded).toBe(s.points);
    expect(gradeSub(s, { "p1-mag": "٦٠" } as AnswerMap).awarded).toBe(s.points);
  });

  it("awards half marks for a small calculation slip and zero for a fully wrong value", () => {
    const s = subOf("p1-mag");
    expect(gradeSub(s, { "p1-mag": "63" } as AnswerMap).awarded).toBeCloseTo(s.points / 2, 5);
    expect(gradeSub(s, { "p1-mag": "100" } as AnswerMap).awarded).toBe(0);
    expect(gradeSub(s, { "p1-mag": "" } as AnswerMap).awarded).toBe(0);
  });

  it("awards partial credit per rubric criterion for written answers", () => {
    const s = subOf("pd-1");
    const full = gradeSub(s, {
      "pd-1": "القوى المتوازية هي القوى التي تكون حواملها مستقيمات متوازية",
    } as AnswerMap);
    expect(full.awarded).toBe(s.points);
    const half = gradeSub(s, { "pd-1": "تتلاقى حواملها" } as AnswerMap);
    expect(half.awarded).toBeGreaterThan(0);
    expect(half.awarded).toBeLessThan(s.points);
    expect(gradeSub(s, { "pd-1": "شيء آخر" } as AnswerMap).awarded).toBe(0);
  });

  it("awards partial credit per correct table cell", () => {
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

  it("awards half credit for the shared pair and half for the lone pairs in Lewis pads", () => {
    const s = subOf("h2-lewis");
    expect(gradeSub(s, { "h2-lewis": JSON.stringify({ shared: 1, lone: [0, 0] }) } as AnswerMap).awarded).toBe(
      s.points,
    );
    expect(
      gradeSub(s, { "h2-lewis": JSON.stringify({ shared: 1, lone: [1, 1] }) } as AnswerMap).awarded,
    ).toBeCloseTo(s.points / 2, 5);
  });

  it("grades drawings by required labels plus construction completeness", () => {
    const s = subOf("rs-3");
    const full = gradeSub(s, {
      "rs-3": JSON.stringify({ strokes: 4, labels: ["F", "F₁", "F₂"] }),
    } as AnswerMap);
    expect(full.awarded).toBe(s.points);
    const partial = gradeSub(s, { "rs-3": JSON.stringify({ strokes: 4, labels: ["F"] }) } as AnswerMap);
    expect(partial.awarded).toBeGreaterThan(0);
    expect(partial.awarded).toBeLessThan(s.points);
  });

  it("reads Arabic-Indic digits and normalises Arabic text", () => {
    expect(parseNumber("٦٠")).toBe(60);
    expect(parseNumber("1٫5")).toBe(1.5);
    expect(normalize("الرَّابِطَةُ الأيونيّة")).toBe(normalize("الرابطة الايونية"));
  });

  it("blocks submission until every sub-part is answered", () => {
    expect(totalSubCount(QUESTIONS)).toBe(64);
    expect(answeredCount(QUESTIONS, emptyAnswers())).toBe(0);
    expect(isComplete(QUESTIONS, emptyAnswers())).toBe(false);
    const full = fullAnswers();
    expect(answeredCount(QUESTIONS, full)).toBe(64);
    expect(isComplete(QUESTIONS, full)).toBe(true);
  });

  it("scores a perfect attempt 100/100 and an empty attempt 0", () => {
    const perfect = gradeAttempt(QUESTIONS, fullAnswers());
    expect(perfect.total).toBe(100);
    expect(perfect.physics).toBe(50);
    expect(perfect.chemistry).toBe(50);
    expect(perfect.perQuestion.every((r) => Math.abs(r.awarded - r.question.marks) < 1e-9)).toBe(true);

    const empty = gradeAttempt(QUESTIONS, {});
    expect(empty.total).toBe(0);
    expect(empty.perQuestion.every((r) => r.awarded >= 0 && r.awarded <= r.question.marks)).toBe(true);
  });
});

describe("Report building", () => {
  const submitted = completeAttempt({ submittedAt: 1_700_003_600_000 });
  const score = gradeAttempt(QUESTIONS, submitted.answers);
  const report = buildExamReport(submitted, score);

  it("carries the platform identity of the exam", () => {
    expect(report.examId).toBe("grade-8-science-test-model-a");
    expect(report.examTitle).toBe("Grade 8 Science Test Model A");
    expect(report.max).toBe(TOTAL_MARKS);
  });

  it("matches the on-screen totals and the mark distribution", () => {
    expect(report.total).toBe(100);
    expect(report.percentage).toBe(100);
    expect(report.grade).toBe("ممتاز");
    expect(report.fullQuestions).toBe(24);
    expect(report.partialQuestions).toBe(0);
    expect(report.wrongQuestions).toBe(0);
    expect(report.stats.correctSubparts).toBe(64);
    expect(report.stats.unansweredSubparts).toBe(0);
    expect(report.physics).toBe(50);
    expect(report.chemistry).toBe(50);
    expect(report.questions).toHaveLength(24);
    expect(report.questions.flatMap((q) => q.parts)).toHaveLength(64);
    expect(report.lessons).toHaveLength(4);
    expect(report.lessons.reduce((s, l) => s + l.max, 0)).toBe(100);
    expect(report.lessons.reduce((s, l) => s + l.earned, 0)).toBe(100);
    expect(report.elapsedSec).toBe(3600);
  });

  it("marks partially answered questions and unanswered sub-parts correctly", () => {
    const partialAnswers: AnswerMap = { ...fullAnswers() };
    const s = subOf("p1-mag");
    partialAnswers[s.id] = "63"; // half credit slip
    const unanswered = subOf("p1-d2");
    partialAnswers[unanswered.id] = "";
    const partial = completeAttempt({ answers: partialAnswers, submittedAt: 1_700_003_600_000 });
    const partialScore = gradeAttempt(QUESTIONS, partial.answers);
    const partialReport = buildExamReport(partial, partialScore);
    const q4 = partialReport.questions.find((q) => q.id === "ph-it-01")!;
    expect(q4.parts[0].status).toBe("partial");
    expect(q4.parts[2].status).toBe("unanswered");
    expect(partialReport.partialQuestions).toBe(1);
    expect(partialReport.stats.partialSubparts).toBe(1);
    expect(partialReport.stats.unansweredSubparts).toBe(1);
    expect(partialReport.total).toBeLessThan(100);
    expect(partialReport.total).toBeGreaterThan(95);
  });

  it("uses the four curriculum lesson labels", () => {
    for (const q of QUESTIONS) expect(lessonTitle(q.src)).not.toContain("اختبار مستقل");
    expect(report.lessons.map((l) => l.title)).toEqual([
      "الدرس الأول: الذرّة والعنصر",
      "الدرس الأول: القوى المتلاقية",
      "الدرس الثاني: الروابط الكيميائية",
      "الدرس الثاني: القوى المتوازية",
    ]);
  });

  it("exports a UTF-8 BOM TXT report with student answers, correct answers and marks", () => {
    const text = reportToText(report);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("\r\n");
    expect(text).toContain("Grade 8 Science Test Model A");
    expect(text).toContain("grade-8-science-test-model-a");
    expect(text).toContain(submitted.name);
    expect(text).toContain("المادة في الفهرس");
    expect(text).toContain("الفيزياء");
    expect(text).toContain("إجابة الطالب");
    expect(text).toContain("الإجابة الصحيحة");
    expect(text).toContain("العلامة");
    for (const q of report.questions) expect(text).toContain(`السؤال ${q.n} —`);
    expect(validateReport(text, report)).toEqual([]);
    expect(reportFilename("طالب اختبار")).toBe("Grade8_Science_ModelA_طالب_اختبار_Results.txt");
  });

  it("classifies statuses deterministically", () => {
    expect(statusOf(2, 2, true)).toBe("correct");
    expect(statusOf(1, 2, true)).toBe("partial");
    expect(statusOf(0, 2, true)).toBe("wrong");
    expect(statusOf(0, 2, false)).toBe("unanswered");
  });

  it("formats the elapsed time as HH:MM:SS", () => {
    const t0 = 1_700_000_000_000;
    expect(stopwatch(t0, t0)).toBe("00:00:00");
    expect(stopwatch(t0 + 3_723_000, t0)).toBe("01:02:03");
    expect(stopwatch(t0 - 5000, t0)).toBe("00:00:00");
    expect(questionOf("p1-mag").subject).toBe("physics");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAM_TITLE } from "../src/config";
import { ALL_PARTS, QUESTIONS, TOTAL_MARKS, TOTAL_PARTS } from "../src/data/exam";
import {
  buildReport,
  canonical,
  correctAnswerText,
  effectiveChoiceAnswer,
  formatClock,
  gradeLabel,
  gradePart,
  isExamComplete,
  isPartAnswered,
  isQuestionAnswered,
  isQuestionPartial,
  splitTextStem,
} from "../src/lib/grading";
import { downloadReport, reportFileName, reportToText } from "../src/lib/report";
import { makePerfectAnswers } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Grading accuracy, source fixes and partial credit", () => {
  it("scores 100/100 (33 + 34 + 33) on a full model script and 0/100 on an empty script", () => {
    const perfect = makePerfectAnswers();
    expect(Object.keys(perfect)).toHaveLength(TOTAL_PARTS);
    expect(isExamComplete(perfect)).toBe(true);

    const rep = buildReport("Ahmad Al-Ali", perfect, 1_700_003_600_000, 3600, 1_700_000_000_000);
    expect(rep.total).toBe(TOTAL_MARKS);
    expect(rep.maxTotal).toBe(100);
    expect(rep.percentage).toBe(100);
    expect(rep.gradeLabel).toBe("ممتاز");
    expect(rep.correctCount).toBe(47);
    expect(rep.incorrectCount).toBe(0);
    expect(rep.wrongAnsweredCount).toBe(0);
    expect(rep.unansweredCount).toBe(0);
    expect(rep.fullQuestions).toBe(30);
    expect(rep.partialQuestions).toBe(0);
    expect(rep.wrongQuestions).toBe(0);
    expect(rep.lessons.map((l) => ({ id: l.id, earned: l.earned, max: l.max }))).toEqual([
      { id: 1, earned: 33, max: 33 },
      { id: 2, earned: 34, max: 34 },
      { id: 3, earned: 33, max: 33 },
    ]);

    const empty = buildReport("Ahmad Al-Ali", {}, 1_700_000_060_000, 60, 1_700_000_000_000);
    expect(empty.total).toBe(0);
    expect(empty.percentage).toBe(0);
    expect(empty.gradeLabel).toBe("يحتاج إلى دعم");
    expect(empty.correctCount).toBe(0);
    expect(empty.incorrectCount).toBe(47);
    expect(empty.wrongAnsweredCount).toBe(0);
    expect(empty.unansweredCount).toBe(47);
    expect(empty.fullQuestions).toBe(0);
    expect(empty.partialQuestions).toBe(0);
    expect(empty.wrongQuestions).toBe(30);
  });

  it("fixes Q4 (q4p1) answer index outside exam.ts: accepts 'used less than' (0), rejects 'used the same as' (1)", () => {
    const q4 = QUESTIONS.find((q) => q.n === 4)!;
    const p = q4.parts[0];
    expect(p.kind).toBe("choice");
    if (p.kind !== "choice") return;
    // Unmodified source still holds answer: 1; grading adapter overrides to index 0
    expect(p.answer).toBe(1);
    expect(effectiveChoiceAnswer(p)).toBe(0);
    expect(correctAnswerText(p)).toBe("used less than");
    expect(gradePart(p, "0")).toBe(true);
    expect(gradePart(p, "1")).toBe(false);
    expect(gradePart(p, "2")).toBe(false);
  });

  it("produces exactly one inline blank slot for all 21 text parts, including Q3 and Q23 ellipsis stems", () => {
    const textParts = ALL_PARTS.filter((p) => p.kind === "text");
    expect(textParts).toHaveLength(21);
    for (const p of textParts) {
      if (p.kind !== "text") continue;
      const chunks = splitTextStem(p.stem ?? "");
      expect(chunks, `part ${p.id} must yield 1 blank (2 chunks)`).toHaveLength(2);
    }
    // Continuation ellipses on Q11/Q12/Q17 stay preserved in the surrounding text
    const q11p2 = ALL_PARTS.find((p) => p.id === "q11p2");
    if (q11p2 && q11p2.kind === "text") {
      expect(splitTextStem(q11p2.stem!)).toEqual([
        "I ",
        " down the street when suddenly a man …",
      ]);
    }
    const q3p1 = ALL_PARTS.find((p) => p.id === "q3p1");
    if (q3p1 && q3p1.kind === "text") {
      expect(splitTextStem(q3p1.stem!)).toEqual([
        "Complete: ",
        " vehicles instead of school buses.",
      ]);
    }
    const q23p1 = ALL_PARTS.find((p) => p.id === "q23p1");
    if (q23p1 && q23p1.kind === "text") {
      expect(splitTextStem(q23p1.stem!)).toEqual([
        "During the ",
        "-day trip we visited various ancient sites and old markets.",
      ]);
    }
  });

  it("accepts every listed alternative and rejects wrong answers across all 47 parts", () => {
    for (const p of ALL_PARTS) {
      expect(isPartAnswered(p, undefined)).toBe(false);
      expect(isPartAnswered(p, "")).toBe(false);
      expect(isPartAnswered(p, "   ")).toBe(false);
      expect(gradePart(p, "")).toBe(false);
      expect(gradePart(p, "   ")).toBe(false);

      if (p.kind === "choice") {
        const right = effectiveChoiceAnswer(p);
        expect(gradePart(p, String(right))).toBe(true);
        for (let i = 0; i < p.options.length; i++) {
          if (i !== right) expect(gradePart(p, String(i))).toBe(false);
        }
        expect(isPartAnswered(p, "-1")).toBe(false);
        expect(isPartAnswered(p, String(p.options.length))).toBe(false);
        expect(isPartAnswered(p, "abc")).toBe(false);
      } else {
        for (const alt of p.answers) {
          expect(gradePart(p, alt), `${p.id} should accept "${alt}"`).toBe(true);
          expect(
            gradePart(p, `  ${alt.toUpperCase()}!  `),
            `${p.id} should accept case/punct variant of "${alt}"`,
          ).toBe(true);
        }
        if (p.mode === "includes") {
          expect(gradePart(p, `My answer is ${p.answers[0]}.`)).toBe(true);
        }
        expect(gradePart(p, "completely unrelated wrong response xyz")).toBe(false);
      }
    }

    // Apostrophe & full reported-speech normalisation on Q30
    const q30p1 = ALL_PARTS.find((p) => p.id === "q30p1")!;
    expect(canonical("  Sean told me that Max didn’t like scary movies. ")).toBe(
      "sean told me that max didnt like scary movies",
    );
    expect(gradePart(q30p1, "Sean told me that Max didn't like scary movies.")).toBe(true);
    expect(gradePart(q30p1, "Sean told me (that) Max didnt like scary movies")).toBe(true);
    expect(gradePart(q30p1, "Sean told me Max did not like scary movies.")).toBe(true);
    expect(gradePart(q30p1, "Sean told me that Max doesn't like scary movies.")).toBe(false);
  });

  it("awards exact partial credit on all 14 multi-part questions", () => {
    const multiPartQuestions = QUESTIONS.filter((q) => q.parts.length > 1);
    expect(multiPartQuestions).toHaveLength(14);

    for (const q of multiPartQuestions) {
      const answers = makePerfectAnswers();
      // Leave first part correct, invalidate remaining parts
      let expectedDeducted = 0;
      for (let i = 1; i < q.parts.length; i++) {
        const part = q.parts[i];
        expectedDeducted += part.marks;
        if (part.kind === "choice") {
          const right = effectiveChoiceAnswer(part);
          answers[part.id] = String((right + 1) % part.options.length);
        } else {
          answers[part.id] = "wrong_answer";
        }
      }
      const rep = buildReport("Sara", answers, 2000, 120, 1000);
      const qRes = rep.questions.find((x) => x.n === q.n)!;
      expect(qRes.earned).toBe(q.parts[0].marks);
      expect(qRes.max - qRes.earned).toBe(expectedDeducted);
      expect(qRes.partial).toBe(true);
      expect(qRes.ok).toBe(false);
      expect(rep.total).toBe(100 - expectedDeducted);
      expect(rep.partialQuestions).toBe(1);
      expect(rep.fullQuestions).toBe(29);
      expect(rep.wrongQuestions).toBe(0);
    }

    // Track partial answer completion state during the exam
    const q11 = QUESTIONS.find((q) => q.n === 11)!;
    const partialAns = { q11p1: "came", q11p2: "was walking" };
    expect(isQuestionPartial(q11, partialAns)).toBe(true);
    expect(isQuestionAnswered(q11, partialAns)).toBe(false);
  });

  it("computes gradeLabel thresholds matching grade5-math-unit1 and formats clock accurately", () => {
    const cases: readonly [number, string][] = [
      [100, "ممتاز"],
      [95, "ممتاز"],
      [94, "جيد جداً"],
      [85, "جيد جداً"],
      [84, "جيد"],
      [75, "جيد"],
      [74, "مقبول"],
      [65, "مقبول"],
      [64, "ضعيف"],
      [50, "ضعيف"],
      [49, "يحتاج إلى دعم"],
      [0, "يحتاج إلى دعم"],
    ];
    for (const [pct, expected] of cases) {
      expect(gradeLabel(pct)).toBe(expected);
    }
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock(3661)).toBe("01:01:01");
    expect(formatClock(-5)).toBe("00:00:00");
  });
});

describe("TXT report generation and download", () => {
  it("generates a complete UTF-8 TXT report with all 30 questions, lessons, marks and contact details", () => {
    const ans = makePerfectAnswers();
    ans.q3p2 = "human"; // wrong 2-mark part → Q3 partial (2/4)
    delete ans.q22p1; // unanswered 3-mark MCQ → Q22 zero (0/3)
    const rep = buildReport("أحمد العلي", ans, 1_700_001_234_000, 1234, 1_700_000_000_000);
    expect(rep.total).toBe(95);

    const txt = reportToText(rep);
    expect(txt).toContain(EXAM_TITLE);
    expect(txt).toContain("Model B");
    expect(txt).toContain("أحمد العلي");
    expect(txt).toContain("95 / 100  (95% — ممتاز)");
    expect(txt).toContain("Questions    : 28 full · 1 partial · 1 zero");
    expect(txt).toContain("Answer parts : 45 correct · 1 incorrect · 1 unanswered");
    expect(txt).toContain("Lesson 1 — Future Plans: 31 / 33");
    expect(txt).toContain("Lesson 2 — School Challenges: 34 / 34");
    expect(txt).toContain("Lesson 3 — Let's Discover: 30 / 33");
    expect(txt).toContain("Correct answer: used less than"); // Q4 corrected
    expect(txt).toContain("المهندس سومر شاهين");
    expect(txt).toContain("0930215022");
    expect(txt).not.toContain("[[blank]]");
    for (let n = 1; n <= 30; n++) {
      expect(txt).toContain(`Q${n} [`);
    }

    expect(reportFileName("Ahmad Al-Ali")).toBe("Grade8-Unit1-ModelB-Ahmad-Al-Ali.txt");
    expect(reportFileName("أحمد العلي")).toBe("Grade8-Unit1-ModelB-أحمد-العلي.txt");
    expect(reportFileName("   !!!   ")).toBe("Grade8-Unit1-ModelB-Student.txt");
  });

  it("triggers a UTF-8 BOM Blob download cleanly in a DOM environment", async () => {
    const rep = buildReport("Lina", makePerfectAnswers(), 5000, 4, 1000);
    let capturedBlob: Blob | null = null;
    let capturedDownload = "";
    const clicked = vi.fn();
    const createObjectURL = vi.fn((b: Blob) => {
      capturedBlob = b;
      return "blob:mock-report";
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: () => ({
        href: "",
        set download(v: string) {
          capturedDownload = v;
        },
        get download() {
          return capturedDownload;
        },
        rel: "",
        style: {},
        click: clicked,
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    expect(downloadReport(rep)).toBe(true);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(capturedDownload).toBe("Grade8-Unit1-ModelB-Lina.txt");
    expect(capturedBlob).not.toBeNull();
    const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
    // UTF-8 BOM = EF BB BF
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  });
});

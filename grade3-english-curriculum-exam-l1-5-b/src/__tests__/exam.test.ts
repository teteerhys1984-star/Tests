import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXAM_MARKS_PER_QUESTION,
  EXAM_TOTAL_MARKS,
  EXAM_TOTAL_QUESTIONS,
  LESSONS,
} from "../data/lessons";
import { CURRICULUM_IMAGES } from "../assets/curriculum";
import { ALL_QUESTIONS_BY_LESSON, EXAM_QUESTIONS } from "../data/questions";
import { AnswerMap, ExamQuestion, QuestionAnswer } from "../types/exam";
import {
  areAllQuestionsComplete,
  countCompletedQuestions,
  evaluateExam,
  gradeQuestion,
  isQuestionComplete,
} from "../utils/grading";
import { buildReportFilename, generateTxtReport } from "../utils/report";
import {
  clearSessionForNewAttempt,
  loadSession,
  saveSession,
  STORAGE_KEY,
} from "../utils/storage";
import { computeElapsedSeconds, formatDurationHHMMSS } from "../utils/timer";

function makePerfectAnswer(q: ExamQuestion): QuestionAnswer {
  switch (q.type) {
    case "single-choice":
      return { type: "single-choice", value: q.correctAnswer };
    case "choice-parts":
    case "match":
      return {
        type: "parts",
        values: Object.fromEntries(q.parts.map((p) => [p.id, p.correctAnswer])),
      };
    case "text-parts":
      return {
        type: "parts",
        values: Object.fromEntries(q.parts.map((p) => [p.id, p.correctDisplay])),
      };
    case "reorder": {
      const targetWords = q.correctSentence.slice(0, -1).split(" ");
      const used = new Set<number>();
      const indices = targetWords.map((tw) => {
        const idx = q.words.findIndex((w, i) => w === tw && !used.has(i));
        if (idx === -1) {
          throw new Error(`Could not find word "${tw}" in question ${q.id}`);
        }
        used.add(idx);
        return idx;
      });
      return { type: "reorder", chosenIndices: indices };
    }
  }
}

function makeWrongAnswer(q: ExamQuestion): QuestionAnswer {
  switch (q.type) {
    case "single-choice": {
      const wrong = q.options.find((o) => o !== q.correctAnswer)!;
      return { type: "single-choice", value: wrong };
    }
    case "choice-parts":
      return {
        type: "parts",
        values: Object.fromEntries(
          q.parts.map((p) => [
            p.id,
            p.options.find((o) => o !== p.correctAnswer)!,
          ])
        ),
      };
    case "match":
      return {
        type: "parts",
        values: Object.fromEntries(
          q.parts.map((p) => [
            p.id,
            q.options.find((o) => o !== p.correctAnswer)!,
          ])
        ),
      };
    case "text-parts":
      return {
        type: "parts",
        values: Object.fromEntries(q.parts.map((p) => [p.id, "wrong_value_xyz"])),
      };
    case "reorder":
      // Original scrambled order must never match an accepted sentence
      return {
        type: "reorder",
        chosenIndices: q.words.map((_, i) => i),
      };
  }
}

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
}

describe("Exam structure, distribution, and mark allocation", () => {
  it("contains exactly 50 unique main questions", () => {
    expect(ALL_QUESTIONS_BY_LESSON).toHaveLength(50);
    expect(EXAM_QUESTIONS).toHaveLength(EXAM_TOTAL_QUESTIONS);
    expect(EXAM_QUESTIONS).toHaveLength(50);

    const uniqueIds = new Set(EXAM_QUESTIONS.map((q) => q.id));
    expect(uniqueIds.size).toBe(50);
  });

  it("contains exactly 10 questions and 20 marks for each of Lessons 1 to 5", () => {
    const expectedTitles: Record<number, string> = {
      1: "Back to School",
      2: "School Subjects",
      3: "My Lovely School",
      4: "My Five Senses",
      5: "Revision 1",
    };

    expect(LESSONS).toHaveLength(5);

    for (const lesson of LESSONS) {
      expect(lesson.title).toBe(expectedTitles[lesson.number]);
      const items = EXAM_QUESTIONS.filter((q) => q.lesson === lesson.number);
      expect(items).toHaveLength(10);

      const lessonTotal = items.reduce((s, q) => s + q.marks, 0);
      expect(lessonTotal).toBe(20);

      for (const q of items) {
        expect(q.source.lesson).toBe(lesson.number);
        expect(q.source.lessonTitle).toBe(expectedTitles[lesson.number]);
        expect(q.source.book.length).toBeGreaterThan(0);
        expect(q.source.page.length).toBeGreaterThan(0);
        expect(q.source.exercise.length).toBeGreaterThan(0);
      }
    }
  });

  it("allocates exactly 2 marks per question and exact sub-part marks summing to 2 (total 100)", () => {
    const totalMarks = EXAM_QUESTIONS.reduce((sum, q) => sum + q.marks, 0);
    expect(totalMarks).toBe(EXAM_TOTAL_MARKS);
    expect(totalMarks).toBe(100);

    for (const q of EXAM_QUESTIONS) {
      expect(q.marks).toBe(EXAM_MARKS_PER_QUESTION);
      if (q.type === "choice-parts" || q.type === "match" || q.type === "text-parts") {
        expect(q.parts.length).toBeGreaterThanOrEqual(2);
        for (const p of q.parts) {
          expect(p.marks).toBeGreaterThan(0);
        }
        const partSum = q.parts.reduce((s, p) => s + p.marks, 0);
        expect(partSum).toBe(2);
      }
    }
  });

  it("mixes question order across lessons instead of grouping sequentially", () => {
    let lessonTransitions = 0;
    for (let i = 1; i < EXAM_QUESTIONS.length; i++) {
      if (EXAM_QUESTIONS[i].lesson !== EXAM_QUESTIONS[i - 1].lesson) {
        lessonTransitions++;
      }
    }
    // In a sequential order there would only be 4 transitions; our mixed exam has 45+
    expect(lessonTransitions).toBeGreaterThanOrEqual(40);
  });
});

describe("Language purity, source concealment, asset integrity, and policy rules", () => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  it("contains zero Arabic characters anywhere in the 50 exam questions", () => {
    const serialized = JSON.stringify(EXAM_QUESTIONS);
    expect(arabicRegex.test(serialized)).toBe(false);
  });

  it("restricts Arabic across src/ strictly to the WhatsApp footer contact name and teacher Sheets contract labels", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      });

    const allowedContractStrings = [
      "إجابة صحيحة جزئياً",
      "إجابة صحيحة",
      "إجابة خاطئة",
      "لم يُجب",
      "جيد جداً",
      "يحتاج إلى دعم",
      "ممتاز",
      "جيد",
      "مقبول",
      "ضعيف",
    ];

    for (const file of walk(srcDir)) {
      if (file.includes("__tests__")) continue;
      const content = fs.readFileSync(file, "utf8");
      if (file.endsWith("Footer.tsx")) {
        expect(content).toContain("المهندس سومر شاهين");
        expect(content).toContain("0930215022");
        expect(content).toContain("https://wa.me/963930215022");
        const stripped = content.replace("المهندس سومر شاهين", "");
        expect(arabicRegex.test(stripped)).toBe(false);
      } else if (file.endsWith("submit.ts")) {
        let stripped = content;
        for (const s of allowedContractStrings) {
          stripped = stripped.split(s).join("");
        }
        expect(arabicRegex.test(stripped)).toBe(false);
      } else {
        expect(arabicRegex.test(content)).toBe(false);
      }
    }
  });

  it("does not expose internal source references or standalone vocabulary translations in student prompts", () => {
    const leakPattern = /\b(Pupil's Book|Workbook|Lesson\s*[1-5]|Revision\s*1|Page\s*\d+|Vocabulary)\b/i;

    for (const q of EXAM_QUESTIONS) {
      const { source: _src, explanation: _exp, gradingRule: _gr, ...studentFacing } = q;
      const text = JSON.stringify(studentFacing).replace(
        /data:image\/png;base64,[A-Za-z0-9+/=]+/g,
        "[EMBEDDED_PNG]"
      );
      expect(leakPattern.test(text), `Leak detected in ${q.id}: ${text}`).toBe(false);
      expect(/means\s*(\.\.\.|…|\?)/i.test(text)).toBe(false);
    }
  });

  it("embeds all 28 curriculum image crops as valid, intact, lossless PNG data URIs with zero external file paths", () => {
    const entries = Object.entries(CURRICULUM_IMAGES);
    expect(entries).toHaveLength(28);

    const pngPrefix = "data:image/png;base64,";
    const pngSignatureHex = "89504e470d0a1a0a";
    const pngIendHex = "49454e44ae426082";

    for (const [key, dataUri] of entries) {
      expect(dataUri.startsWith(pngPrefix), `${key} must be a PNG data URI`).toBe(true);
      const buf = Buffer.from(dataUri.slice(pngPrefix.length), "base64");
      expect(buf.length, `${key} must be non-empty`).toBeGreaterThan(500);
      expect(buf.subarray(0, 8).toString("hex"), `${key} PNG signature`).toBe(pngSignatureHex);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width, `${key} width`).toBeGreaterThan(40);
      expect(height, `${key} height`).toBeGreaterThan(40);
      expect(buf.subarray(buf.length - 8).toString("hex"), `${key} PNG IEND`).toBe(pngIendHex);
    }

    // Verify every single image field in EXAM_QUESTIONS uses an embedded PNG data URI (never a broken relative/external path)
    const collectedSrcs: string[] = [];
    for (const q of EXAM_QUESTIONS) {
      for (const stim of q.stimuli || []) {
        if (stim.kind === "images") {
          for (const item of stim.items) collectedSrcs.push(item.src);
        } else if (stim.kind === "table" && stim.imageSrc) {
          collectedSrcs.push(stim.imageSrc);
        } else if (stim.kind === "example" && stim.iconPair) {
          collectedSrcs.push(stim.iconPair.leftSrc, stim.iconPair.rightSrc);
        }
      }
      if (q.type === "text-parts") {
        for (const p of q.parts) {
          for (const img of p.cueImages || []) collectedSrcs.push(img.src);
        }
      }
    }

    expect(collectedSrcs.length).toBe(30);
    for (const src of collectedSrcs) {
      expect(src.startsWith(pngPrefix)).toBe(true);
    }

    const stripped = JSON.stringify(EXAM_QUESTIONS).replace(
      /data:image\/png;base64,[A-Za-z0-9+/=]+/g,
      ""
    );
    expect(/\.png\b|\.jpg\b|\.jpeg\b|\.webp\b|images\/curriculum|https?:\/\//i.test(stripped)).toBe(
      false
    );
  });

  it("never exposes any ZIP download link anywhere in the student or teacher interface", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      });

    for (const file of walk(srcDir)) {
      if (file.includes("__tests__")) continue;
      const content = fs.readFileSync(file, "utf8");
      expect(/\.zip\b/i.test(content), `Found .zip reference in ${file}`).toBe(false);
    }
  });
});

describe("Answer keys, grading engine, and completion gating", () => {
  it("scores 100/100 when every question is answered with its model answer", () => {
    const answers: AnswerMap = Object.fromEntries(
      EXAM_QUESTIONS.map((q) => [q.id, makePerfectAnswer(q)])
    );

    expect(countCompletedQuestions(EXAM_QUESTIONS, answers)).toBe(50);
    expect(areAllQuestionsComplete(EXAM_QUESTIONS, answers)).toBe(true);

    const evaluation = evaluateExam(EXAM_QUESTIONS, answers);
    expect(evaluation.totalEarned).toBe(100);
    expect(evaluation.totalMax).toBe(100);
    expect(evaluation.percentage).toBe(100);
    expect(evaluation.correctCount).toBe(50);
    expect(evaluation.partialCount).toBe(0);
    expect(evaluation.incorrectCount).toBe(0);

    for (const ls of evaluation.lessonScores) {
      expect(ls.earnedMarks).toBe(20);
      expect(ls.maxMarks).toBe(20);
      expect(ls.fullCorrectCount).toBe(10);
    }
  });

  it("scores 0/100 when every question is answered incorrectly (including un-reordered words)", () => {
    const answers: AnswerMap = Object.fromEntries(
      EXAM_QUESTIONS.map((q) => [q.id, makeWrongAnswer(q)])
    );

    expect(areAllQuestionsComplete(EXAM_QUESTIONS, answers)).toBe(true);
    const evaluation = evaluateExam(EXAM_QUESTIONS, answers);
    expect(evaluation.totalEarned).toBe(0);
    expect(evaluation.correctCount).toBe(0);
    expect(evaluation.partialCount).toBe(0);
    expect(evaluation.incorrectCount).toBe(50);
  });

  it("awards accurate partial credit and handles case/punctuation variations", () => {
    const l1q3 = EXAM_QUESTIONS.find((q) => q.id === "l1-q3")!;
    const res = gradeQuestion(l1q3, 1, {
      type: "parts",
      values: {
        a: "  HAS GOT  ",
        b: "have got.",
        c: "have got", // wrong (should be has got)
        d: "has got", // wrong (should be have got)
      },
    });
    expect(res.earnedMarks).toBe(1);
    expect(res.status).toBe("partial");

    const l4q10 = EXAM_QUESTIONS.find((q) => q.id === "l4-q10")!;
    const res2 = gradeQuestion(l4q10, 2, {
      type: "parts",
      values: {
        a: "Goat",
        b: "i can smell a rose",
      },
    });
    expect(res2.earnedMarks).toBe(2);
    expect(res2.status).toBe("correct");
  });

  it("keeps Submit Exam disabled if even one sub-part or one reorder tile is incomplete", () => {
    const answers: AnswerMap = Object.fromEntries(
      EXAM_QUESTIONS.map((q) => [q.id, makePerfectAnswer(q)])
    );

    // Clear one sub-part
    answers["l1-q3"] = {
      type: "parts",
      values: { a: "has got", b: "have got", c: "has got", d: "   " },
    };
    expect(isQuestionComplete(EXAM_QUESTIONS.find((q) => q.id === "l1-q3")!, answers["l1-q3"])).toBe(false);
    expect(areAllQuestionsComplete(EXAM_QUESTIONS, answers)).toBe(false);
    expect(countCompletedQuestions(EXAM_QUESTIONS, answers)).toBe(49);

    // Restore l1-q3, leave reorder missing one word
    answers["l1-q3"] = makePerfectAnswer(EXAM_QUESTIONS.find((q) => q.id === "l1-q3")!);
    answers["l1-q8"] = { type: "reorder", chosenIndices: [2, 1, 4, 3] };
    expect(areAllQuestionsComplete(EXAM_QUESTIONS, answers)).toBe(false);
  });
});

describe("Stopwatch formatting, localStorage persistence, and TXT report", () => {
  it("formats HH:MM:SS accurately and preserves elapsed time across refresh", () => {
    expect(formatDurationHHMMSS(0)).toBe("00:00:00");
    expect(formatDurationHHMMSS(65)).toBe("00:01:05");
    expect(formatDurationHHMMSS(3729)).toBe("01:02:09");

    const start = 1_700_000_000_000;
    expect(computeElapsedSeconds(start, 10, start + 145_200)).toBe(145);

    const mem = createMemoryStorage();
    saveSession(
      {
        version: 1,
        attemptId: "attempt-lina-1",
        phase: "in_progress",
        studentName: "Lina Ahmad",
        currentQuestionIndex: 14,
        answers: { "l1-q1": { type: "single-choice", value: "have" } },
        startTimestamp: start,
        elapsedSeconds: 40,
        lastTickTimestamp: start + 40_000,
        submittedAt: null,
        muted: true,
      },
      mem
    );

    expect(mem.getItem(STORAGE_KEY)).toBeTruthy();

    // Simulate reopening page 95 seconds after exam start
    const restored = loadSession(mem, start + 95_000);
    expect(restored.attemptId).toBe("attempt-lina-1");
    expect(restored.phase).toBe("in_progress");
    expect(restored.studentName).toBe("Lina Ahmad");
    expect(restored.currentQuestionIndex).toBe(14);
    expect(restored.elapsedSeconds).toBe(95);
    expect(restored.muted).toBe(true);
    expect(restored.answers["l1-q1"]).toEqual({
      type: "single-choice",
      value: "have",
    });

    // Explicit restart clears student name and answers while preserving mute preference
    const reset = clearSessionForNewAttempt(restored.muted, mem);
    expect(reset.phase).toBe("welcome");
    expect(reset.studentName).toBe("");
    expect(reset.startTimestamp).toBeNull();
    expect(reset.elapsedSeconds).toBe(0);
    expect(reset.answers).toEqual({});
    expect(reset.muted).toBe(true);
  });

  it("generates a complete UTF-8 TXT report and sanitized student filename", () => {
    expect(buildReportFilename("Sara Ali")).toBe("Grade3_English_Exam_Sara_Ali.txt");
    expect(buildReportFilename("  Omar  ")).toBe("Grade3_English_Exam_Omar.txt");

    const answers: AnswerMap = Object.fromEntries(
      EXAM_QUESTIONS.map((q) => [q.id, makePerfectAnswer(q)])
    );
    const evaluation = evaluateExam(EXAM_QUESTIONS, answers);

    const txt = generateTxtReport({
      studentName: "Sara Ali",
      submittedAtIso: "2026-05-10T09:30:00.000Z",
      elapsedSeconds: 812,
      evaluation,
    });

    expect(txt).toContain("Student Name        : Sara Ali");
    expect(txt).toContain("Grade               : Grade 3 — Unit 1");
    expect(txt).toContain("Lesson 1 — Back to School");
    expect(txt).toContain("Lesson 2 — School Subjects");
    expect(txt).toContain("Lesson 3 — My Lovely School");
    expect(txt).toContain("Lesson 4 — My Five Senses");
    expect(txt).toContain("Lesson 5 — Revision 1");
    expect(txt).toContain("Time Taken          : 00:13:32");
    expect(txt).toContain("Total Score         : 100 / 100 (100%)");
    expect(txt).toContain("Question 1 [");
    expect(txt).toContain("Question 50 [");
    expect(txt).toContain("Student Answer :");
    expect(txt).toContain("Correct Answer :");
    expect(txt).toContain("Source Ref     : Lesson");
  });
});

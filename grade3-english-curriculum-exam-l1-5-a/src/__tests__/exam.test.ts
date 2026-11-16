import { describe, expect, it } from "vitest";
import { EXAM, LESSONS, checkTeacherPassword } from "../data/lessons";
import { ALL_PASSAGES } from "../data/passages";
import { EXAM_QUESTIONS, QUESTIONS_BY_LESSON } from "../data/questions";
import { correctAnswerText, formatHMS, partPrompt } from "../lib/format";
import {
  buildCorrectSheet,
  gradeExam,
  gradeQuestion,
  isExamComplete,
  isPartCorrect,
  normalizeText,
  questionMax,
} from "../lib/grading";
import { buildReport, reportFileName } from "../lib/report";
import { STORAGE_KEY, createIdleState, elapsedFor, loadState, saveState, startAttempt, submitAttempt } from "../lib/storage";
import type { AnswerSheet, LessonId, Part, Question } from "../types";

const LESSON_IDS: LessonId[] = [1, 2, 3, 4, 5];
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

const byId = (id: string) => {
  const q = EXAM_QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`missing ${id}`);
  return q;
};
const keys = (id: string) => byId(id).parts.map((p) => correctAnswerText(p));

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("exam structure", () => {
  it("has exactly 50 main questions", () => {
    expect(EXAM_QUESTIONS).toHaveLength(50);
    expect(EXAM.totalQuestions).toBe(50);
  });

  it("uses each question exactly once (unique ids)", () => {
    expect(new Set(EXAM_QUESTIONS.map((q) => q.id)).size).toBe(50);
  });

  it("has exactly 10 questions for each of the five lessons", () => {
    LESSON_IDS.forEach((id) => {
      expect(EXAM_QUESTIONS.filter((q) => q.lesson === id)).toHaveLength(10);
      expect(QUESTIONS_BY_LESSON[id]).toHaveLength(10);
    });
    expect(LESSONS.map((l) => l.title)).toEqual(["Back to School", "School Subjects", "My Lovely School", "My Five Senses", "Revision 1"]);
  });

  it("gives every main question exactly 2 marks (100 in total)", () => {
    EXAM_QUESTIONS.forEach((q) => expect(questionMax(q), q.id).toBe(2));
    expect(EXAM_QUESTIONS.reduce((s, q) => s + questionMax(q), 0)).toBe(100);
  });

  it("gives every sub-part a clear mark allocation", () => {
    EXAM_QUESTIONS.forEach((q) => q.parts.forEach((p) => expect([0.5, 1, 2], `${q.id}/${p.id}`).toContain(p.marks)));
  });

  it("keeps internal ids consistent with the lesson", () => {
    EXAM_QUESTIONS.forEach((q) => expect(q.id.startsWith(`L${q.lesson}-`)).toBe(true));
  });

  it("mixes the order: never two questions from the same lesson in a row", () => {
    for (let i = 1; i < EXAM_QUESTIONS.length; i++) {
      expect(EXAM_QUESTIONS[i].lesson, `positions ${i} and ${i + 1}`).not.toBe(EXAM_QUESTIONS[i - 1].lesson);
    }
    const firstTen = EXAM_QUESTIONS.slice(0, 10).map((q) => q.lesson);
    expect(new Set(firstTen).size).toBe(5);
  });

  it("has no separate Vocabulary section or vocabulary-list questions", () => {
    EXAM_QUESTIONS.forEach((q) => {
      expect(q.format.toLowerCase()).not.toContain("vocabulary");
      expect(q.instruction.toLowerCase()).not.toContain("vocabulary");
      expect(q.instruction.toLowerCase()).not.toContain("means");
    });
  });

  it("contains no Arabic script anywhere in the question data", () => {
    expect(ARABIC.test(JSON.stringify(EXAM_QUESTIONS))).toBe(false);
  });

  it("gives every question a source reference (book, page, exercise) from its own lesson", () => {
    EXAM_QUESTIONS.forEach((q) => {
      expect(q.sources.length, q.id).toBeGreaterThan(0);
      const lesson = LESSONS.find((l) => l.id === q.lesson)!;
      q.sources.forEach((s) => {
        expect(["Pupil’s Book", "Workbook"]).toContain(s.book);
        expect(s.exercise.length).toBeGreaterThan(3);
        const pages = s.page.match(/\d+/g)!.map(Number);
        const [from, to] = lesson.pages.match(/\d+/g)!.map(Number);
        pages.forEach((p) => {
          expect(p, `${q.id} page`).toBeGreaterThanOrEqual(from);
          expect(p, `${q.id} page`).toBeLessThanOrEqual(to);
        });
      });
      expect(q.explanation.length).toBeGreaterThan(5);
      expect(q.gradingRule.length).toBeGreaterThan(5);
    });
  });
});

describe("passages", () => {
  it("uses only the registered textbook passages, each from the question's own lesson", () => {
    EXAM_QUESTIONS.filter((q) => q.passage).forEach((q) => {
      expect(ALL_PASSAGES).toContain(q.passage);
      expect(q.passage!.source.startsWith(`Lesson ${q.lesson} `), q.id).toBe(true);
    });
  });

  it("keeps the printed wording of the dialogues and songs", () => {
    const l3Song = ALL_PASSAGES.find((p) => p.id === "l3-song");
    expect(l3Song && l3Song.kind === "song" && l3Song.lines).toContain("We are going so smart.");
    const l2 = ALL_PASSAGES.find((p) => p.id === "l2-dialogue");
    expect(l2 && l2.kind === "dialogue" && l2.panels[0]).toEqual(["What lessons have we got today?", "Today we’ve got Maths and Science."]);
    const l4song = ALL_PASSAGES.find((p) => p.id === "l4-song");
    expect(l4song && l4song.kind === "song" && l4song.lines).toHaveLength(9);
  });

  it("never uses the unverified Lesson 1 OCR lines (match answers, song, dialogue)", () => {
    const l1 = JSON.stringify(QUESTIONS_BY_LESSON[1].map(({ sources: _s, ...rest }) => rest));
    ["ten years old", "Dani", "London", "Going back to school", "Hip hip", "Miss Maria", "broom", "zoo"].forEach((text) => expect(l1).not.toContain(text));
  });
});

describe("answer keys", () => {
  const referencedParts = (q: Question): string[] =>
    q.blocks.flatMap((b) => {
      if (b.type === "choice" || b.type === "order") return [b.part];
      if (b.type === "sentence") return b.segments.flatMap((s) => (typeof s === "object" && "blank" in s ? [s.blank] : []));
      if (b.type === "sequence") return b.items.flatMap((s) => (typeof s === "object" && "blank" in s ? [s.blank] : []));
      if (b.type === "timetable") return b.rows.flatMap((r) => r.cells.flatMap((c) => (c.blank ? [c.blank] : [])));
      return [];
    });

  it("renders every part exactly once and references no missing part", () => {
    EXAM_QUESTIONS.forEach((q) => {
      const refs = referencedParts(q);
      expect(refs.sort(), q.id).toEqual(q.parts.map((p) => p.id).sort());
    });
  });

  it("has a valid key for every part", () => {
    EXAM_QUESTIONS.forEach((q) =>
      q.parts.forEach((p: Part) => {
        const where = `${q.id}/${p.id}`;
        if (p.kind === "choice" || p.kind === "select") {
          expect(p.options.length, where).toBeGreaterThanOrEqual(2);
          expect(new Set(p.options).size, where).toBe(p.options.length);
          expect(p.options, where).toContain(p.answer);
        } else if (p.kind === "text") {
          expect(p.accepted.length, where).toBeGreaterThan(0);
          expect(p.accepted.map(normalizeText), where).toContain(normalizeText(p.answerDisplay));
        } else {
          expect([...p.tokens].sort(), where).toEqual([...p.answer].sort());
          expect(p.tokens.join(" "), where).not.toBe(p.answer.join(" "));
        }
        expect(partPrompt(q, p.id), where).not.toBe(p.id);
      }),
    );
  });

  it("matches the textbook answers for key items", () => {
    expect(keys("L1-01")).toEqual(["have", "has"]);
    expect(keys("L1-03")).toEqual(["has got", "have got"]);
    expect(keys("L1-05")).toEqual(["I have got two brothers."]);
    expect(keys("L2-04")).toEqual([
      "Today, we’ve got Art and Music.",
      "My favourite lesson is English.",
      "On Tuesday, I’ve got Maths.",
      "On Wednesday, I’ve got Art and English.",
    ]);
    expect(keys("L2-05")).toEqual(["English", "Tuesday"]);
    expect(keys("L2-06")).toEqual(["English", "Science", "Sports", "Maths"]);
    expect(keys("L2-08")).toEqual(["23", "25", "26", "29"]);
    expect(keys("L3-02")).toEqual(["False", "True"]);
    expect(keys("L3-07")).toEqual(["2", "3", "5", "4"]);
    expect(keys("L3-08")).toEqual(["read", "library", "draw", "art room"]);
    expect(keys("L3-09")).toEqual(["gym", "on the left of", "classroom", "twelve"]);
    expect(keys("L4-04")).toEqual(["hear", "see", "taste", "smell"]);
    expect(keys("L4-05")).toEqual(["taste", "smell", "touch", "see"]);
    expect(keys("L4-07")).toEqual(["thirty-three", "thirty-four", "thirty-six", "forty-five"]);
    expect(keys("L4-10")).toEqual(["smell", "touch"]);
    expect(keys("L5-01")).toEqual(["Cross ✗", "Tick ✓", "Cross ✗", "Tick ✓"]);
    expect(keys("L5-04")).toEqual(["c", "d", "a", "e"]);
    expect(keys("L5-06")).toEqual(["gym", "Arabic"]);
    expect(keys("L5-07")).toEqual(["cake", "computer"]);
    expect(keys("L5-08")).toEqual(["Science", "Music", "English", "Maths"]);
    expect(keys("L5-09")).toEqual(["oo", "ou", "oa", "ea"]);
  });
});

describe("grading", () => {
  it("scores a fully correct answer sheet 100 / 100", () => {
    const sheet = buildCorrectSheet(EXAM_QUESTIONS);
    expect(isExamComplete(EXAM_QUESTIONS, sheet)).toBe(true);
    const result = gradeExam(EXAM_QUESTIONS, sheet);
    expect(result.total).toBe(100);
    expect(result.correctCount).toBe(50);
    expect(result.incorrectCount).toBe(0);
    LESSON_IDS.forEach((id) => expect(result.byLesson[id]).toEqual({ earned: 20, max: 20, questions: 10 }));
  });

  it("scores an empty sheet 0 and keeps Submit locked", () => {
    expect(isExamComplete(EXAM_QUESTIONS, {})).toBe(false);
    const result = gradeExam(EXAM_QUESTIONS, {});
    expect(result.total).toBe(0);
    expect(result.incorrectCount).toBe(50);
  });

  it("is incomplete while even one sub-part is unanswered", () => {
    const sheet = buildCorrectSheet(EXAM_QUESTIONS);
    const q = byId("L2-06");
    delete sheet[q.id].d;
    expect(isExamComplete(EXAM_QUESTIONS, sheet)).toBe(false);
  });

  it("awards marks per sub-part", () => {
    const q = byId("L5-01");
    const r = gradeQuestion(q, { a: "Cross ✗", b: "Tick ✓", c: "Tick ✓", d: "Cross ✗" });
    expect(r.earned).toBe(1);
    expect(r.status).toBe("partial");
    const q2 = byId("L1-06");
    expect(gradeQuestion(q2, { a: "True", b: "True" }).earned).toBe(1);
  });

  it("checks typed answers leniently but requires correct spelling", () => {
    const q = byId("L4-07");
    const [a, b] = q.parts;
    expect(isPartCorrect(a, "Thirty three")).toBe(true);
    expect(isPartCorrect(a, " thirty-three. ")).toBe(true);
    expect(isPartCorrect(a, "33")).toBe(true);
    expect(isPartCorrect(a, "thirty-tree")).toBe(false);
    expect(isPartCorrect(b, "thirty-three")).toBe(false);
    const l5 = byId("L5-08");
    expect(isPartCorrect(l5.parts[0], "science")).toBe(true);
    expect(isPartCorrect(l5.parts[3], "Math")).toBe(false);
  });

  it("requires the exact word order for reorder items", () => {
    const q = byId("L1-09");
    const part = q.parts[0];
    if (part.kind !== "order") throw new Error("expected order part");
    const correct = part.answer.map((w) => part.tokens.indexOf(w));
    expect(isPartCorrect(part, correct)).toBe(true);
    expect(isPartCorrect(part, [...correct].reverse())).toBe(false);
    expect(isPartCorrect(part, correct.slice(0, 2))).toBe(false);
  });

  it("adds lesson scores up to the total", () => {
    const sheet: AnswerSheet = buildCorrectSheet(EXAM_QUESTIONS);
    sheet["L3-05"] = { a: "big", b: "friends" };
    const result = gradeExam(EXAM_QUESTIONS, sheet);
    expect(result.total).toBe(99);
    expect(result.byLesson[3].earned).toBe(19);
    expect(LESSON_IDS.reduce((s, id) => s + result.byLesson[id].earned, 0)).toBe(result.total);
  });
});

describe("timer and saved attempts", () => {
  it("formats the stopwatch as HH:MM:SS", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(3723000)).toBe("01:02:03");
    expect(formatHMS(-50)).toBe("00:00:00");
  });

  it("starts timing only when the attempt starts and survives a reload", () => {
    const store = memoryStorage();
    expect(elapsedFor(createIdleState(), 5000)).toBe(0);
    const start = startAttempt("  Lina  ", 1_000_000);
    expect(start.studentName).toBe("Lina");
    saveState(store, { ...start, answers: { "L1-01": { a: "have" } }, currentIndex: 7 });
    const restored = loadState(store)!;
    expect(restored.status).toBe("active");
    expect(restored.currentIndex).toBe(7);
    expect(restored.answers["L1-01"].a).toBe("have");
    expect(elapsedFor(restored, 1_000_000 + 95_000)).toBe(95_000);
  });

  it("stops the timer at submission", () => {
    const submitted = submitAttempt(startAttempt("Omar", 0), 600_000);
    expect(submitted.status).toBe("submitted");
    expect(submitted.elapsedMs).toBe(600_000);
    expect(elapsedFor(submitted, 9_999_999)).toBe(600_000);
  });

  it("ignores corrupted saved data", () => {
    const store = memoryStorage();
    store.setItem(STORAGE_KEY, "{not json");
    expect(loadState(store)).toBeNull();
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 9 }));
    expect(loadState(store)).toBeNull();
  });
});

describe("TXT report", () => {
  it("names the file after the student", () => {
    expect(reportFileName("Sara Ali")).toBe("Grade3_English_Exam_Sara_Ali.txt");
    expect(reportFileName('Ma/ya: "B"')).toBe("Grade3_English_Exam_Maya_B.txt");
    expect(reportFileName("   ")).toBe("Grade3_English_Exam_Student.txt");
  });

  it("contains the full required content", () => {
    const sheet = buildCorrectSheet(EXAM_QUESTIONS);
    sheet["L2-03"] = { a: "Maths", b: "crayons" };
    const state = {
      ...submitAttempt({ ...startAttempt("Test Pupil", Date.UTC(2026, 0, 10, 8, 0, 0)), answers: sheet }, Date.UTC(2026, 0, 10, 8, 25, 0)),
    };
    const result = gradeExam(EXAM_QUESTIONS, state.answers);
    const report = buildReport(state, result, EXAM_QUESTIONS);
    expect(report).toContain("Student name:      Test Pupil");
    expect(report).toContain("Grade:             Grade 3");
    LESSONS.forEach((l) => expect(report).toContain(`Lesson ${l.id} – ${l.title}`));
    expect(report).toContain("Time taken:        00:25:00");
    expect(report).toContain("Total score:       99 / 100");
    expect(report).toContain("2026-01-10T08:25:00.000Z");
    expect(report.match(/^Question \d+ of 50/gm)).toHaveLength(50);
    expect(report.match(/Student answer:/g)!.length).toBe(EXAM_QUESTIONS.reduce((s, q) => s + q.parts.length, 0));
    expect(report).toContain("Student answer: Maths");
    expect(report).toContain("Correct answer: Music");
    expect(report.match(/^Source:/gm)!.length).toBeGreaterThanOrEqual(50);
    expect(report).toContain("Pupil’s Book · p. 6 · Activity 1 · Listen and read");
  });
});

describe("teacher area", () => {
  it("opens only with the agreed password", () => {
    expect(checkTeacherPassword("somer173")).toBe(true);
    expect(checkTeacherPassword("Somer173")).toBe(false);
    expect(checkTeacherPassword("")).toBe(false);
  });
});

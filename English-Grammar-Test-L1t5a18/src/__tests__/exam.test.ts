import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALL_BRANCHES,
  EXAM_QUESTIONS,
  TOTAL_BRANCHES,
  TOTAL_MARKS,
  type Answers,
  type Branch,
} from "../exam/examData";
import {
  formatSeconds,
  getElapsedSeconds,
  gradeExam,
  isBranchAnswered,
  isExamComplete,
  isQuestionComplete,
  normalizeAnswer,
} from "../exam/grading";
import {
  ATTEMPT_STORAGE_KEY,
  clearAttempt,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
  type StoredAttempt,
} from "../exam/storage";
import { buildReport, safeFilename } from "../exam/report";
import { sanitizeEnglishAnswer, sanitizeStudentName } from "../exam/text";

function correctAnswerFor(branch: Branch): string | string[] {
  if (branch.variant === "order") return branch.correct.split(" ");
  return branch.correct;
}

function allCorrectAnswers(): Answers {
  return Object.fromEntries(
    ALL_BRANCHES.map(({ branch }) => [branch.id, correctAnswerFor(branch)])
  );
}

function withAnswer(answers: Answers, branchId: string, value: string | string[]): Answers {
  return { ...answers, [branchId]: value };
}

function branch(branchId: string): Branch {
  const found = ALL_BRANCHES.find(({ branch: candidate }) => candidate.id === branchId);
  if (!found) throw new Error(`Missing test branch ${branchId}`);
  return found.branch;
}

function scoreWith(branchId: string, value: string | string[]): number {
  const answers = withAnswer(allCorrectAnswers(), branchId, value);
  return gradeExam("Test Student", answers, 1_700_000_000_000, 600).score;
}

describe("exam blueprint", () => {
  it("has exactly 12 main questions and exactly 100 marks", () => {
    expect(EXAM_QUESTIONS).toHaveLength(12);
    expect(TOTAL_MARKS).toBe(100);
    expect(TOTAL_BRANCHES).toBe(71);
  });

  it("gives every question its exact blueprint marks", () => {
    expect(EXAM_QUESTIONS.map((question) => question.totalMarks)).toEqual([
      10, 8, 8, 10, 10, 8, 10, 8, 8, 8, 6, 6,
    ]);
    expect(EXAM_QUESTIONS.reduce((sum, question) => sum + question.totalMarks, 0)).toBe(100);
  });

  it("keeps branch marks consistent with every question total", () => {
    EXAM_QUESTIONS.forEach((question) => {
      const branchSum = question.branches.reduce((sum, item) => sum + item.marks, 0);
      expect(branchSum, `Question ${question.number}`).toBe(question.totalMarks);
    });
  });

  it("uses unique branch IDs and only Lessons 1, 2, 3, 4, 5, and 18", () => {
    const ids = ALL_BRANCHES.map(({ branch: item }) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const allowed = new Set([1, 2, 3, 4, 5, 18]);
    ALL_BRANCHES.forEach(({ branch: item }) => {
      expect(allowed.has(item.lesson), item.id).toBe(true);
    });
  });

  it("contains no Arabic characters in the exam content", () => {
    expect(/[\u0600-\u06FF]/.test(JSON.stringify(EXAM_QUESTIONS))).toBe(false);
  });

  it("has all required question-level marking and partial-credit notes", () => {
    EXAM_QUESTIONS.forEach((question) => {
      expect(question.markingGuide.length).toBeGreaterThan(10);
      expect(question.partialCredit.length).toBeGreaterThan(10);
      expect(question.branches.length).toBeGreaterThan(1);
    });
  });
});

describe("Question 1: subject, verb, and object", () => {
  it("stores the correct subject, verb, and object", () => {
    expect(branch("1a").correct).toBe("The chef");
    expect(branch("1b").correct).toBe("fly");
    expect(branch("1c").correct).toBe("orange juice");
  });

  it("recognises a sentence without an object", () => {
    expect(branch("1d").correct).toBe("Adam sleeps early.");
  });

  it("requires the correct Subject + Verb + Object sentence order", () => {
    expect(branch("1e").correct).toBe("Mia eats an apple.");
    expect(scoreWith("1e", "Eats Mia an apple.")).toBe(98);
  });
});

describe("Question 2: word ordering", () => {
  it("includes a sentence without an object and unambiguous object sentences", () => {
    expect(branch("2a").correct).toBe("The boy runs");
    expect(branch("2b").correct).toBe("Sara reads a book");
    expect(branch("2c").correct).toBe("They play football");
    expect(branch("2d").correct).toBe("The cat drinks milk");
  });

  it("accepts the correct order and rejects an incorrect order", () => {
    expect(scoreWith("2b", ["Sara", "reads", "a", "book"])).toBe(100);
    expect(scoreWith("2b", ["reads", "Sara", "book", "a"])).toBe(98);
    expect(scoreWith("2b", ["Sara", "reads", "book"])).toBe(98);
  });

  it("treats an incomplete or cleared ordering answer as unanswered", () => {
    expect(isBranchAnswered(branch("2b"), [])).toBe(false);
    expect(isBranchAnswered(branch("2b"), ["Sara", "reads"])).toBe(false);
    expect(isBranchAnswered(branch("2b"), ["Sara", "reads", "a", "book"])).toBe(true);
  });
});

describe("Question 3: the seven basic pronouns", () => {
  it("tests all seven pronouns across the branches", () => {
    const pronouns = EXAM_QUESTIONS[2].branches.map((item) => item.correct);
    expect(new Set(pronouns)).toEqual(new Set(["I", "You", "He", "She", "It", "We", "They"]));
  });

  it("covers people, animals, plural things, and groups", () => {
    expect(branch("3a").correct).toBe("He");
    expect(branch("3b").correct).toBe("She");
    expect(branch("3c").correct).toBe("It");
    expect(branch("3d").correct).toBe("They");
    expect(branch("3e").correct).toBe("They");
    expect(branch("3f").correct).toBe("We");
  });

  it("scores a wrong pronoun as incorrect", () => {
    expect(scoreWith("3b", "He")).toBe(99);
  });
});

describe("Question 4: am, is, are agreement", () => {
  it("matches every tested subject with the correct Verb to Be", () => {
    const expected: Record<string, string> = {
      "4a": "am",
      "4b": "is",
      "4c": "is",
      "4d": "is",
      "4e": "are",
      "4f": "are",
      "4g": "are",
      "4h": "is",
      "4i": "are",
      "4j": "are",
    };
    Object.entries(expected).forEach(([id, answer]) => {
      expect(branch(id).correct, id).toBe(answer);
    });
  });

  it("marks is with a plural subject as incorrect", () => {
    expect(scoreWith("4i", "is")).toBe(99);
  });

  it("marks are with a singular subject as incorrect", () => {
    expect(scoreWith("4h", "are")).toBe(99);
  });
});

describe("Question 5: affirmative, negative, questions, and short answers", () => {
  it("accepts correct negative forms and rejects the wrong position of not", () => {
    expect(scoreWith("5a", "She is not busy.")).toBe(100);
    expect(scoreWith("5a", "She isn't busy.")).toBe(100);
    expect(scoreWith("5a", "She not is busy.")).toBe(98);
  });

  it("accepts a question with Verb to Be before the subject", () => {
    expect(scoreWith("5b", "Is he happy?")).toBe(100);
    expect(scoreWith("5b", "He is happy?")).toBe(98);
  });

  it("rejects do / does with Verb to Be", () => {
    expect(branch("5c").options).toContain("They do not are ready.");
    expect(scoreWith("5c", "They do not are ready.")).toBe(98);
    expect(branch("5b").explanation).toContain("Do not add do");
  });

  it("checks short answers independently", () => {
    expect(scoreWith("5d", "Yes, they are.")).toBe(100);
    expect(scoreWith("5d", "Yes, they is.")).toBe(98);
  });

  it("accepts contractions and ignores capitalisation and final punctuation", () => {
    expect(normalizeAnswer("  I'm NOT tired! ")).toBe("i'm not tired");
    expect(scoreWith("5e", "I'm not tired")).toBe(100);
    expect(scoreWith("5e", "I not am tired.")).toBe(98);
  });
});

describe("Questions 6 and 8: nouns and adjectives", () => {
  it("identifies nouns, verbs, and noun groups", () => {
    expect(branch("6a").correct).toBe("school");
    expect(branch("6b").correct).toBe("Place");
    expect(branch("6c").correct).toBe("Animal");
    expect(branch("6d").correct).toBe("Person");
    expect(branch("6e").correct).toBe("Thing");
    expect(branch("6f").correct).toBe("read");
  });

  it("identifies adjectives and distinguishes them from nouns", () => {
    expect(branch("8a").correct).toBe("tall");
    expect(branch("8b").correct).toBe("teacher");
    expect(branch("8c").correct).toBe("small");
    expect(branch("8d").correct).toBe("old");
  });

  it("scores a noun chosen as an adjective as incorrect", () => {
    expect(scoreWith("8a", "teacher")).toBe(98);
  });
});

describe("Question 7: a, an, and the", () => {
  it("applies the sound-based a / an rule", () => {
    expect(scoreWith("7a", "an")).toBe(100);
    expect(scoreWith("7a", "a")).toBe(98);
    expect(scoreWith("7b", "a")).toBe(100);
    expect(scoreWith("7b", "an")).toBe(98);
  });

  it("uses The for a known or unique noun", () => {
    expect(scoreWith("7c", "The")).toBe(100);
    expect(scoreWith("7d", "The")).toBe(100);
  });

  it("does not allow a / an before a plural noun", () => {
    expect(scoreWith("7e", "No article")).toBe(100);
    expect(scoreWith("7e", "a")).toBe(98);
    expect(scoreWith("7e", "an")).toBe(98);
  });
});

describe("Question 9: descriptive sentences and adjective placement", () => {
  it("checks Subject + Verb to Be + Adjective order", () => {
    expect(scoreWith("9a", "The girl is a kind.")).toBe(98);
    expect(scoreWith("9a", "The girl is kind.")).toBe(100);
    expect(scoreWith("9b", ["The", "car", "is", "fast"])).toBe(100);
    expect(scoreWith("9b", ["The", "car", "fast", "is"])).toBe(98);
  });

  it("uses correct Verb to Be agreement with an adjective", () => {
    expect(scoreWith("9c", "are")).toBe(100);
    expect(scoreWith("9c", "is")).toBe(98);
  });

  it("keeps Verb to Be questions free of do / does", () => {
    expect(scoreWith("9d", "Is he tall?")).toBe(100);
    expect(scoreWith("9d", "Does he is tall?")).toBe(98);
  });
});

describe("Question 10: regular plurals and taught exceptions", () => {
  it("tests S, ES, consonant plus Y, vowel plus Y, F, and F exceptions", () => {
    expect(branch("10a").correct).toBe("books");
    expect(branch("10b").correct).toBe("boxes");
    expect(branch("10c").correct).toBe("watches");
    expect(branch("10d").correct).toBe("babies");
    expect(branch("10e").correct).toBe("boys");
    expect(branch("10f").correct).toBe("knives");
    expect(branch("10g").correct).toBe("roofs");
    expect(branch("10h").correct).toBe("leaves");
  });

  it("rejects incorrect S / ES endings and incorrect Y transformations", () => {
    expect(scoreWith("10b", "boxs")).toBe(99);
    expect(scoreWith("10c", "watchs")).toBe(99);
    expect(scoreWith("10d", "babys")).toBe(99);
    expect(scoreWith("10d", "babieses")).toBe(99);
    expect(scoreWith("10e", "toies")).toBe(99);
    expect(scoreWith("10e", "boyes")).toBe(99);
  });

  it("never applies the general F to VES rule blindly", () => {
    expect(scoreWith("10g", "rooves")).toBe(99);
    expect(scoreWith("10g", "roofs")).toBe(100);
  });
});

describe("Question 11: irregular plurals and is / are agreement", () => {
  it("teaches and checks the required irregular and same-form nouns", () => {
    expect(branch("11a").correct).toBe("men");
    expect(branch("11b").correct).toBe("children");
    expect(branch("11c").correct).toBe("sheep");
  });

  it("rejects common irregular mistakes", () => {
    expect(scoreWith("11b", "childs")).toBe(99);
    expect(scoreWith("11b", "childes")).toBe(99);
    expect(scoreWith("11a", "mans")).toBe(99);
    expect(scoreWith("11c", "sheeps")).toBe(99);
  });

  it("distinguishes regular and irregular plurals", () => {
    expect(scoreWith("11d", "children")).toBe(100);
    expect(scoreWith("11d", "books")).toBe(99);
  });

  it("uses are with children and is with child", () => {
    expect(scoreWith("11e", "are")).toBe(100);
    expect(scoreWith("11e", "is")).toBe(99);
    expect(scoreWith("11f", "is")).toBe(100);
    expect(scoreWith("11f", "are")).toBe(99);
  });
});

describe("Question 12: mixed final challenge", () => {
  it("combines sentence order, pronoun, be, article, adjective, and plural", () => {
    expect(branch("12a").correct).toBe("Sara reads a book.");
    expect(branch("12b").correct).toBe("She");
    expect(branch("12c").correct).toBe("are");
    expect(branch("12d").correct).toBe("an");
    expect(branch("12e").correct).toBe("hot");
    expect(branch("12f").correct).toBe("children");
  });

  it("scores every mixed branch independently", () => {
    expect(scoreWith("12a", "Sara a book reads.")).toBe(99);
    expect(scoreWith("12b", "He")).toBe(99);
    expect(scoreWith("12d", "a")).toBe(99);
    expect(scoreWith("12f", "childs")).toBe(99);
  });
});

describe("answer validation, submission eligibility, and scoring", () => {
  it("treats blank and whitespace-only written answers as unanswered", () => {
    expect(isBranchAnswered(branch("10a"), "")).toBe(false);
    expect(isBranchAnswered(branch("10a"), "   ")).toBe(false);
    expect(isBranchAnswered(branch("10a"), "books")).toBe(true);
  });

  it("requires every branch before the exam can be submitted", () => {
    const answers = allCorrectAnswers();
    expect(isExamComplete(answers)).toBe(true);
    const incomplete = { ...answers };
    delete incomplete["10h"];
    expect(isQuestionComplete(EXAM_QUESTIONS[9], incomplete)).toBe(false);
    expect(isExamComplete(incomplete)).toBe(false);
  });

  it("requires complete word-order answers to unlock submission", () => {
    const answers = withAnswer(allCorrectAnswers(), "2c", ["They", "play"]);
    expect(isExamComplete(answers)).toBe(false);
  });

  it("scores a complete correct attempt as 100 out of 100", () => {
    const result = gradeExam("Sara Student", allCorrectAnswers(), 1_700_000_000_000, 754);
    expect(result.score).toBe(100);
    expect(result.totalMarks).toBe(100);
    expect(result.percentage).toBe(100);
    expect(result.correctCount).toBe(TOTAL_BRANCHES);
    expect(result.incorrectCount).toBe(0);
    expect(result.questionResults).toHaveLength(12);
  });

  it("scores an empty attempt as 0 and calculates result fields", () => {
    const result = gradeExam("Empty Student", {}, 1_700_000_000_000, 0);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(TOTAL_BRANCHES);
    expect(result.questionResults[11].totalMarks).toBe(6);
  });

  it("adds marks per question and branch correctly for partial answers", () => {
    const answers = withAnswer(allCorrectAnswers(), "1a", "cooks");
    answers["1b"] = "";
    const result = gradeExam("Partial Student", answers, 1_700_000_000_000, 30);
    expect(result.questionResults[0].earned).toBe(6);
    expect(result.questionResults[0].totalMarks).toBe(10);
    expect(result.score).toBe(96);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("keeps each submitted answer and explanation available for review", () => {
    const answers = withAnswer(allCorrectAnswers(), "11b", "childs");
    const result = gradeExam("Review Student", answers, 1_700_000_000_000, 60);
    const item = result.questionResults[10].branches.find((entry) => entry.branchId === "11b");
    expect(item?.submitted).toBe("childs");
    expect(item?.correct).toBe("children");
    expect(item?.explanation).toContain("Child changes to children");
    expect(item?.lesson).toBe(18);
  });
});

describe("count-up timer", () => {
  it("derives elapsed seconds from timestamps instead of incrementing blindly", () => {
    expect(getElapsedSeconds(1_000_000, 1_000_000)).toBe(0);
    expect(getElapsedSeconds(1_000_000, 4_600_000)).toBe(3600);
    expect(getElapsedSeconds(1_000_000, 1_000_999)).toBe(0);
  });

  it("formats the stopwatch as HH:MM:SS", () => {
    expect(formatSeconds(0)).toBe("00:00:00");
    expect(formatSeconds(61)).toBe("00:01:01");
    expect(formatSeconds(3661)).toBe("01:01:01");
    expect(formatSeconds(360_000)).toBe("100:00:00");
  });
});

describe("local storage restoration and mute preference", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores an unfinished attempt without creating a new one", () => {
    const attempt: StoredAttempt = {
      version: 1,
      studentName: "Sara",
      status: "active",
      startedAt: 1_700_000_000_000,
      answers: { "1a": "The chef" },
      currentQuestion: 3,
      resumed: false,
    };
    saveAttempt(attempt);
    const loaded = loadAttempt();
    expect(loaded?.studentName).toBe("Sara");
    expect(loaded?.status).toBe("active");
    expect(loaded?.startedAt).toBe(attempt.startedAt);
    expect(loaded?.currentQuestion).toBe(3);
    expect(loaded?.answers["1a"]).toBe("The chef");
  });

  it("does not invent an attempt when storage is empty", () => {
    expect(loadAttempt()).toBeNull();
  });

  it("restores a submitted attempt as submitted, not as a fresh attempt", () => {
    saveAttempt({
      version: 1,
      studentName: "Khalil",
      status: "submitted",
      startedAt: 1_700_000_000_000,
      submittedAt: 1_700_000_100_000,
      elapsedSeconds: 100,
      answers: allCorrectAnswers(),
      currentQuestion: 12,
      resumed: false,
    });
    expect(loadAttempt()?.status).toBe("submitted");
    expect(loadAttempt()?.elapsedSeconds).toBe(100);
  });

  it("clears the attempt only when an explicit restart happens", () => {
    saveAttempt({
      version: 1,
      studentName: "Mia",
      status: "active",
      startedAt: 1_700_000_000_000,
      answers: {},
      currentQuestion: 1,
      resumed: true,
    });
    expect(store.has(ATTEMPT_STORAGE_KEY)).toBe(true);
    clearAttempt();
    expect(loadAttempt()).toBeNull();
  });

  it("saves and loads the mute preference", () => {
    expect(loadMuted()).toBe(false);
    saveMuted(true);
    expect(loadMuted()).toBe(true);
  });
});

describe("English-only student input", () => {
  it("keeps English names and friendly punctuation", () => {
    expect(sanitizeStudentName("Sara O'Neil-Smith")).toBe("Sara O'Neil-Smith");
    expect(sanitizeStudentName("Amina  Noor")).toBe("Amina Noor");
    expect(sanitizeStudentName("Léa")).toBe("Léa");
  });

  it("filters Arabic and other non-English characters from names and answers", () => {
    const arabic = String.fromCodePoint(0x645, 0x62d, 0x645, 0x62f);
    expect(sanitizeStudentName(`Sara ${arabic}`).trim()).toBe("Sara");
    expect(sanitizeEnglishAnswer(`He is ${arabic}`).trim()).toBe("He is");
    expect(sanitizeStudentName("学生")).toBe("");
    expect(sanitizeEnglishAnswer("I am happy!")).toBe("I am happy!");
    expect(sanitizeEnglishAnswer("I\u2019m not tired.")).toBe("I'm not tired.");
    expect(sanitizeStudentName("O\u2019Neil")).toBe("O'Neil");
  });
});

describe("English UTF-8 report", () => {
  it("includes the student name, score, per-question marks, answers, and explanations", () => {
    const answers = withAnswer(allCorrectAnswers(), "1d", "Mia loves music.");
    const result = gradeExam("Sara Student", answers, 1_700_000_000_000, 95);
    const report = buildReport(result);
    expect(report).toContain("Student name: Sara Student");
    expect(report).toContain("Final score: 98 / 100");
    expect(report).toContain("QUESTION 1 - Sentence Structure (8/10 marks)");
    expect(report).toContain("Student answer: Mia loves music.");
    expect(report).toContain("Correct answer: Adam sleeps early.");
    expect(report).toContain("Explanation:");
    expect(report).toContain("Lesson: 1");
    expect(report).toContain("Skill:");
    expect(/[\u0600-\u06FF]/.test(report)).toBe(false);
  });

  it("produces a safe report filename containing the student's name", () => {
    const safe = safeFilename("Sara O'Neil");
    expect(safe).toContain("Sara");
    expect(safe).toContain("O'Neil");
    expect(safe).not.toContain("/");
    expect(safe).not.toContain(":");
    expect(safe).not.toContain("..");
  });

  it("builds a separate backup report label", () => {
    const result = gradeExam("Adam", allCorrectAnswers(), 1_700_000_000_000, 10);
    const backup = buildReport(result, true);
    expect(backup).toContain("BACKUP EXAM REPORT");
    expect(/[\u0600-\u06FF]/.test(backup)).toBe(false);
  });
});

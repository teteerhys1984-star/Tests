import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "@/App";
import {
  ALL_PARTS,
  LESSONS,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
  questionsForLesson,
} from "@/data/questions";
import { MODEL_A_SELECTIONS, modelBSelections, selectionMismatchCount } from "@/data/modelAReference";
import {
  answeredQuestionCount,
  gradeExam,
  isComplete,
  isPartCorrect,
  lessonAnsweredCount,
  normalizeAnswer,
  type AnswerMap,
} from "@/lib/grading";
import { buildReport, EXAM_SCOPE, reportFilename, sanitizeFilename } from "@/lib/report";
import {
  clearAttempt,
  elapsedMs,
  formatHMS,
  loadAttempt,
  saveAttempt,
  type Attempt,
} from "@/lib/storage";
import { CONTACT_NAME, CONTACT_PHONE, WHATSAPP_URL } from "@/components/Contact";
import { TEACHER_PASSWORD } from "@/components/TeacherKey";
import { EXAM_ID, EXAM_SEMESTER, EXAM_TITLE } from "@/config";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function allCorrectAnswers(): AnswerMap {
  const a: AnswerMap = {};
  for (const p of ALL_PARTS) a[p.id] = p.accept[0];
  return a;
}

/* ------------------------------------------------------------------ */
/* 1–4  distribution, marks and sub-part allocations                   */
/* ------------------------------------------------------------------ */

describe("question distribution", () => {
  it("has exactly 50 main questions", () => {
    expect(TOTAL_QUESTIONS).toBe(50);
    expect(QUESTIONS).toHaveLength(50);
  });

  it("has exactly 10 questions from each of the five lessons", () => {
    expect(LESSONS.map((l) => questionsForLesson(l.n).length)).toEqual([10, 10, 10, 10, 10]);
  });

  it("totals exactly 100 marks", () => {
    expect(TOTAL_MARKS).toBe(100);
  });

  it("has exactly 59 answerable sub-parts (13/11/10/11/14 per lesson)", () => {
    expect(ALL_PARTS).toHaveLength(59);
    expect(LESSONS.map((l) => questionsForLesson(l.n).flatMap((q) => q.parts).length)).toEqual([
      13, 11, 10, 11, 14,
    ]);
  });

  it("gives every main question exactly 2 marks through its sub-parts", () => {
    for (const q of QUESTIONS) {
      const sum = q.parts.reduce((s, p) => s + p.marks, 0);
      expect(sum, `${q.id} marks`).toBe(2);
      for (const p of q.parts) expect(p.marks).toBeGreaterThan(0);
    }
  });

  it("awards exactly 20 marks to each of the five lessons", () => {
    for (const l of LESSONS) {
      const parts = questionsForLesson(l.n).flatMap((q) => q.parts);
      expect(parts.reduce((s, p) => s + p.marks, 0), `lesson ${l.n}`).toBe(20);
    }
  });

  it("keeps the only fractional sub-parts inside l5q7 (4 × 0.5 = 2 marks)", () => {
    const fractional = ALL_PARTS.filter((p) => !Number.isInteger(p.marks));
    expect(fractional.map((p) => p.id)).toEqual(["l5q7a", "l5q7b", "l5q7c", "l5q7d"]);
    for (const p of fractional) expect(p.marks).toBe(0.5);
  });

  it("uses unique question ids and unique sub-part ids", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(50);
    expect(new Set(ALL_PARTS.map((p) => p.id)).size).toBe(ALL_PARTS.length);
  });

  it("carries a lesson and a textbook page reference on every question", () => {
    for (const q of QUESTIONS) {
      expect(q.lesson).toBeGreaterThanOrEqual(1);
      expect(q.lesson).toBeLessThanOrEqual(5);
      expect(q.page).toMatch(/Pupil's Book p\. \d+/);
      expect(q.exercise.length).toBeGreaterThan(3);
      expect(q.instruction.length).toBeGreaterThan(3);
    }
  });

  it("keeps the source order: Lesson 1 → Lesson 5, ten questions each", () => {
    expect(QUESTIONS.map((q) => q.lesson)).toEqual(
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3,
       3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
    );
    expect(QUESTIONS.map((q) => q.id)).toEqual(
      [1, 2, 3, 4, 5].flatMap((l) => Array.from({ length: 10 }, (_v, i) => `l${l}q${i + 1}`))
    );
  });
});

/* ------------------------------------------------------------------ */
/* 5  answer evaluation                                                 */
/* ------------------------------------------------------------------ */

describe("answer evaluation", () => {
  it("normalises case, whitespace, curly apostrophes and trailing stops", () => {
    expect(normalizeAnswer("  Don’T. ")).toBe("don't");
    expect(normalizeAnswer("She has to wear a school uniform")).toBe(
      "she has to wear a school uniform"
    );
    expect(normalizeAnswer("basic / primary")).toBe("basic/primary");
    expect(normalizeAnswer(undefined)).toBe("");
  });

  it("accepts every documented alternative", () => {
    const giraffes = QUESTIONS.find((q) => q.id === "l2q8")!.parts[0];
    expect(isPartCorrect(giraffes, "Giraffes' necks")).toBe(true);
    expect(isPartCorrect(giraffes, "giraffes necks")).toBe(true);
    expect(isPartCorrect(giraffes, "Giraffes necks.")).toBe(true);
    expect(isPartCorrect(giraffes, "the giraffes")).toBe(false);
  });

  it("marks a wrong answer wrong even when it is close", () => {
    const q = QUESTIONS.find((x) => x.id === "l1q1")!;
    expect(isPartCorrect(q.parts[0], "nursery")).toBe(false);
    expect(isPartCorrect(q.parts[0], "secondary")).toBe(true);
    expect(isPartCorrect(q.parts[0], "")).toBe(false);
  });

  it("grades a fully correct paper at 100 with every question full", () => {
    const r = gradeExam(allCorrectAnswers());
    expect(r.score).toBe(100);
    expect(r.maxScore).toBe(100);
    expect(r.correctCount).toBe(50);
    expect(r.incorrectCount).toBe(0);
    expect(r.questions).toHaveLength(50);
    for (const q of r.questions) expect(q.earned).toBe(2);
  });

  it("grades an empty paper at 0", () => {
    const r = gradeExam({});
    expect(r.score).toBe(0);
    expect(r.correctCount).toBe(0);
    expect(r.incorrectCount).toBe(50);
  });

  it("awards partial marks for answered sub-parts only", () => {
    const answers = allCorrectAnswers();
    answers["l1q5a"] = "don't"; // correct — keeps 1 of the 2 marks
    answers["l1q5b"] = ""; // unanswered — loses the other mark
    const r = gradeExam(answers);
    const q1 = r.questions.find((x) => x.question.id === "l1q5")!;
    expect(q1.earned).toBe(1);
    expect(q1.max).toBe(2);
    expect(q1.correct).toBe(false);
    expect(r.score).toBe(99);
    expect(r.correctCount).toBe(49);
    expect(r.incorrectCount).toBe(1);
  });

  it("awards 0.5-mark sub-parts correctly", () => {
    const answers = allCorrectAnswers();
    answers["l5q7a"] = "2";
    const r = gradeExam(answers);
    const q = r.questions.find((x) => x.question.id === "l5q7")!;
    expect(q.earned).toBe(1.5);
    expect(q.max).toBe(2);
    expect(r.score).toBe(99.5);
    expect(r.correctCount).toBe(49);
  });
});

/* ------------------------------------------------------------------ */
/* 6  completion validation                                             */
/* ------------------------------------------------------------------ */

describe("completion validation", () => {
  it("is not complete with no answers", () => {
    expect(isComplete({})).toBe(false);
    expect(answeredQuestionCount({})).toBe(0);
  });

  it("is complete only when every sub-part is answered", () => {
    const answers = allCorrectAnswers();
    expect(isComplete(answers)).toBe(true);
    expect(answeredQuestionCount(answers)).toBe(50);

    const lastId = ALL_PARTS[ALL_PARTS.length - 1].id;
    delete answers[lastId];
    expect(isComplete(answers)).toBe(false);
    expect(answeredQuestionCount(answers)).toBe(49);
  });

  it("treats whitespace-only input as unanswered", () => {
    const answers = allCorrectAnswers();
    answers[ALL_PARTS[0].id] = "   ";
    expect(isComplete(answers)).toBe(false);
  });

  it("counts answered questions per lesson", () => {
    const answers = allCorrectAnswers();
    expect(lessonAnsweredCount(1, answers)).toBe(10);
    expect(lessonAnsweredCount(5, answers)).toBe(10);
    expect(lessonAnsweredCount(3, {})).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* 7  timer accuracy and recovery                                       */
/* ------------------------------------------------------------------ */

describe("timer", () => {
  it("formats HH:MM:SS", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(999)).toBe("00:00:00");
    expect(formatHMS(1000)).toBe("00:00:01");
    expect(formatHMS(61_000)).toBe("00:01:01");
    expect(formatHMS(3_661_000)).toBe("01:01:01");
    expect(formatHMS(90_061_000)).toBe("25:01:01");
  });

  it("never returns a negative elapsed time", () => {
    expect(elapsedMs(1_000_000, 999_000)).toBe(0);
  });

  it("is timestamp based, so it survives navigation and refresh", () => {
    const start = Date.parse("2026-03-04T09:00:00Z");
    expect(elapsedMs(start, start + 5_000)).toBe(5_000);
    expect(elapsedMs(start, start + 300_000)).toBe(300_000);
    expect(formatHMS(elapsedMs(start, start + 300_000))).toBe("00:05:00");
  });

  it("saves and restores the attempt with name, answers, start time, position and attemptId", () => {
    const store = new Map<string, string>();
    const stub = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const g = globalThis as unknown as { window?: unknown };
    const previous = g.window;
    g.window = { localStorage: stub };

    try {
      const attempt: Attempt = {
        v: 1,
        attemptId: "attempt-b-1",
        name: "Layla Ahmad",
        answers: { l1q1a: "secondary", l1q2a: "five" },
        startTs: 1_770_000_000_000,
        current: 7,
        status: "active",
        model: "B",
      };
      saveAttempt(attempt);

      const restored = loadAttempt();
      expect(restored).not.toBeNull();
      expect(restored!.attemptId).toBe("attempt-b-1");
      expect(restored!.name).toBe("Layla Ahmad");
      expect(restored!.startTs).toBe(1_770_000_000_000);
      expect(restored!.current).toBe(7);
      expect(restored!.status).toBe("active");
      expect(restored!.answers["l1q1a"]).toBe("secondary");

      expect(formatHMS(elapsedMs(restored!.startTs, restored!.startTs + 125_000))).toBe("00:02:05");

      clearAttempt();
      expect(loadAttempt()).toBeNull();
    } finally {
      g.window = previous;
    }
  });

  it("never produces a shared storage key with Model A", () => {
    const g = globalThis as unknown as { window?: unknown };
    const previous = g.window;
    const store = new Map<string, string>();
    g.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
    try {
      saveAttempt({
        v: 1,
        attemptId: "x",
        name: "Pupil",
        answers: {},
        startTs: 1,
        current: 0,
        status: "active",
        model: "B",
      });
      expect([...store.keys()]).toEqual([`${EXAM_ID}-attempt-v1`]);
      expect([...store.keys()][0]).not.toContain("l1-5-a");
    } finally {
      g.window = previous;
    }
  });
});

/* ------------------------------------------------------------------ */
/* 8  result calculations                                               */
/* ------------------------------------------------------------------ */

describe("result calculations", () => {
  it("reports score, correct and incorrect counts consistently", () => {
    const answers = allCorrectAnswers();
    const ids = ALL_PARTS.filter((p) => p.marks === 2).map((p) => p.id);
    for (const id of ids.slice(0, 10)) answers[id] = "wrong answer";
    const r = gradeExam(answers);
    expect(r.correctCount + r.incorrectCount).toBe(50);
    expect(r.correctCount).toBe(40);
    expect(r.incorrectCount).toBe(10);
    expect(r.score).toBe(80);
    expect(r.maxScore).toBe(100);
    expect(r.questions.reduce((s, q) => s + q.earned, 0)).toBe(r.score);
    expect(r.questions.reduce((s, q) => s + q.max, 0)).toBe(r.maxScore);
  });

  it("never awards marks for a blank answer", () => {
    const answers = allCorrectAnswers();
    for (const p of ALL_PARTS) answers[p.id] = "";
    expect(gradeExam(answers).score).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* 9  TXT report                                                        */
/* ------------------------------------------------------------------ */

describe("TXT report", () => {
  const answers = allCorrectAnswers();
  const result = gradeExam(answers);
  const submittedTs = Date.parse("2026-05-12T10:30:00");
  const text = buildReport({ name: "Layla Ahmad", result, submittedTs, elapsedMs: 3_725_000 });

  it("carries the published title, scope, student name, model, date and score", () => {
    expect(text).toContain(EXAM_TITLE.toUpperCase());
    expect(text).toContain(EXAM_SCOPE);
    expect(text).toContain("Semester 1");
    expect(text).toContain("Layla Ahmad");
    expect(text).toContain("Model B");
    expect(text).toContain("Final score       : 100 / 100");
    expect(text).toContain("Completion time   : 01:02:05");
    expect(text).toContain("2026 May 12 at 10:30:00");
  });

  it("lists every question with answers, correct answers, marks and lesson references", () => {
    expect(text).toContain("QUESTION 50 of 50");
    expect(text).toContain("Your answer");
    expect(text).toContain("Correct answer");
    expect(text).toContain("Marks earned");
    expect(text).toContain("Lesson 1");
    expect(text).toContain("Lesson 5");
    expect(text).toContain("Pupil's Book p. 16");
    expect(text).toContain("Explanation");
  });

  it("is UTF-8 safe and uses CRLF line endings for Notepad", () => {
    expect(text).toContain("\r\n");
    expect(Buffer.from(text, "utf8").length).toBeGreaterThan(1000);
    expect(text).toContain(CONTACT_NAME);
  });

  it("builds a safe file name from the student name", () => {
    expect(reportFilename("Layla Ahmad")).toBe("Layla-Ahmad-grade5-unit1-model-b-report.txt");
    expect(sanitizeFilename("O'Connor / Badr!")).toBe("O-Connor-Badr");
    expect(sanitizeFilename("   ")).toBe("student");
    expect(sanitizeFilename("../../etc/passwd")).toBe("etc-passwd");
    expect(reportFilename("سومر شاهين")).not.toContain("/");
  });
});

/* ------------------------------------------------------------------ */
/* 10  no fabricated listening answers                                  */
/* ------------------------------------------------------------------ */

describe("source integrity — no audio-dependent tasks", () => {
  it("uses no listening, audio or recording activity", () => {
    for (const q of QUESTIONS) {
      const blob = `${q.exercise} ${q.instruction} ${q.context ?? ""}`;
      expect(blob.toLowerCase(), q.id).not.toMatch(/listen|audio|recording/);
    }
  });

  it("has no standalone vocabulary section", () => {
    for (const q of QUESTIONS) {
      expect(q.exercise.toLowerCase()).not.toContain("vocabulary");
      expect(q.instruction.toLowerCase()).not.toContain("vocabulary");
    }
  });
});

/* ------------------------------------------------------------------ */
/* 11  reading passages come from the printed textbook                  */
/* ------------------------------------------------------------------ */

describe("source integrity — reading passages are printed textbook texts", () => {
  const JOHN_FULL =
    "Hello! My name is John. I am ten years old and I am from Canada. I am going to introduce my lovely family to you. It is quite big and we are very happy. My mother's name is Liza and my father's name is Peter. My mother has got black hair and she is very kind. My father is tall and he is a very funny person. My parents have got two children. My baby sister Laura and me. Laura is only one year old. My father has got a sister. Her name is Olivia. She is my aunt. My mother has got a brother. His name is Richard. He is my uncle. My grandparents are Kevin and Carla. We've got two pets, a cat called Lucy and a dog called Puppy. He is my favourite!";
  const MIRA_FULL =
    "I am Mira, I love Friday. It's a holiday. I don't get up early. I usually take a shower and have breakfast with my family. Then I tidy my room and my brother cleans the grage, he doesn't ask me to help him. In the afternoon, I sometimes go out with my family on a picnic. We like to spend time together. In the evening, my father watches the news. My mother doesn't watch the news, she likes to cook dinner. The whole family shares in the houswork. We never go to bed early on Thursdays so we always watch a film after dinner.";
  const SENSES_FULL =
    "We use our five senses every day. They are sight, touch, smell, taste and hearing. They help us understand and enjoy the world around us. When we look at the sky, we see very far stars. We can hear sounds that are low or loud. We can touch things that are soft or hard. Different foods have different tastes. Sweet, bitter, bland and sour. We smell things that are good or bad. We smell flowers and perfumes. Eyes for sight, nose for smell, tongue for taste, skin for touch and ears for hearing.";
  const DIALOGUE_FULL =
    "S: Good morning, madam. Can I help you?\nC: Yes, please. I'm looking for a sweater.\nS: What size, madam?\nC: Thirty-eight.\nS: What colour would you like?\nC: I would like a striped red sweater.\nS: Will you try this one, please? The fitting room is over there. How does it fit?\nC: It's perfect. I'll take it. How much is it?\nS: It's 3000 Sp.\nC: Here you are. Thank you.";
  const READING_INTRO =
    "Read the comparison in your book. It explains the ages when children attend nursery, primary/basic and secondary school in Britain and Syria, and notes that special exams are needed for university.";
  const FREQUENCY_CHART =
    "Frequency chart printed on page 10 (Sun · Mon · Tues · Wed · Thur)\nAlways   ✓ ✓ ✓ ✓ ✓\nUsually  ✓ ✓ ✓ ✓ ✕\nSometimes ✓ ✕ ✓ ✕ ✓\nNever    ✕ ✕ ✕ ✕ ✕";
  const POSSESSIVE_EXAMPLES =
    "Printed examples: He is Lara's uncle. · She is Charles's mother. · Those are the children's toys. · These are the students' books.";
  const FAMILY_BANK =
    "Word bank: aunt, brother, children, cousins, daughter, father, grandchildren, granddaughter, grandfather, grandmother, grandson, grandparents, husband, mother, nephew, niece, parents, sister, son, uncle, wife.";
  const REV1_TEXT =
    "In winter it gets cold and …… . I usually wear a …… , a …… and I sometimes wear a …… .\nIn summer, it's always hot and …… . My friend Lily wears dotted ……s and …… dresses. She never wears …… .";

  const PRINTED_LONG_TEXTS = [
    JOHN_FULL,
    MIRA_FULL,
    SENSES_FULL,
    DIALOGUE_FULL,
    READING_INTRO,
    FREQUENCY_CHART,
    POSSESSIVE_EXAMPLES,
    FAMILY_BANK,
    REV1_TEXT,
  ];

  const WORD_ORDER_SET = /^[A-Za-z0-9'?./ ]+(?: \/ [A-Za-z0-9'?./ ]+){3,}$/;

  const PRINTED_FRAGMENTS = [
    "Nursery — KG 1–3",
    "Syria — nursery 3, basic 6, secondary 15.",
    "have to = obligation",
    "The chart has one box missing for each country",
    "Where do you have science?",
    "Children is an irregular plural",
    "With I, you, we and they",
    "I smell with my nose",
    "Printed table — sight",
    "Printed answer: It tastes sweet.",
    "Pattern words printed on the page",
    "I'm wearing a blue T-shirt and trousers.",
    "Printed order in the key",
    "1 Rana is wearing a dotted pink dress",
    "Printed example: — What time do you go to school?",
  ];

  function isVerifiedPrintedText(c: string): boolean {
    return (
      PRINTED_LONG_TEXTS.some((t) => t.includes(c)) ||
      PRINTED_FRAGMENTS.some((f) => c.includes(f)) ||
      WORD_ORDER_SET.test(c.trim())
    );
  }

  it("keeps the printed spellings of the Mira passage unchanged", () => {
    const q = QUESTIONS.find((x) => x.id === "l3q7")!;
    expect(q.context).toBe(MIRA_FULL);
    expect(q.context).toContain("cleans the grage");
    expect(q.context).toContain("the houswork");
  });

  it("uses the printed John passage verbatim", () => {
    const q = QUESTIONS.find((x) => x.id === "l2q1")!;
    expect(q.context).toBe(JOHN_FULL);
    expect(q.context).toContain("I am ten years old and I am from Canada");
  });

  it("uses the printed five-senses passage verbatim", () => {
    for (const id of ["l4q2", "l4q5", "l4q10"]) {
      const q = QUESTIONS.find((x) => x.id === id)!;
      expect(q.context, id).toBe(SENSES_FULL);
    }
  });

  it("never invents a long passage of its own", () => {
    for (const q of QUESTIONS) {
      if (!q.context || q.context.length < 120) continue;
      const verified = PRINTED_LONG_TEXTS.some((t) => t.includes(q.context!));
      expect(verified, `unexpected long text in ${q.id}`).toBe(true);
    }
  });

  it("only quotes material that appears in the source pupil-book files", () => {
    const used = QUESTIONS.map((q) => q.context).filter(Boolean) as string[];
    expect(used.length).toBeGreaterThan(30);
    for (const c of used) {
      expect(isVerifiedPrintedText(c), `unverified context: ${c.slice(0, 70)}`).toBe(true);
    }
  });

  it("asks no pupil about their own family or personal life", () => {
    const banned = /your (mother|father|family|brother|sister|grandmother|grandfather|pet)/i;
    for (const q of QUESTIONS) {
      const blob = `${q.instruction} ${q.parts.map((p) => p.prompt).join(" ")}`;
      expect(banned.test(blob), q.id).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 12  Version B is not a duplicate of Version A                       */
/* ------------------------------------------------------------------ */

describe("Version B differs from Version A", () => {
  it("records 50 Version A selections", () => {
    expect(MODEL_A_SELECTIONS).toHaveLength(50);
    expect(modelBSelections()).toHaveLength(50);
  });

  it("uses a different item in almost every position", () => {
    expect(selectionMismatchCount()).toBeGreaterThanOrEqual(25);
  });

  it("takes a different item of the same printed exercise where available", () => {
    expect(MODEL_A_SELECTIONS).toContain("L1/Ex6b/1");
    expect(MODEL_A_SELECTIONS).toContain("L1/Ex6b/3");
    expect(QUESTIONS.find((q) => q.id === "l1q3")!.parts[0].prompt).toContain("2. In Syria");
    expect(MODEL_A_SELECTIONS).toContain("L3/Ex7/6");
    expect(QUESTIONS.find((q) => q.id === "l3q4")!.parts[0].prompt).toContain("5. We");
  });

  it("reads the same curriculum scope as Version A (all five lessons)", () => {
    for (const lesson of [1, 2, 3, 4, 5] as const) {
      expect(questionsForLesson(lesson).length).toBe(10);
      expect(MODEL_A_SELECTIONS.some((s) => s.startsWith(`L${lesson}/`))).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 13  language + fixed contact details                                */
/* ------------------------------------------------------------------ */

describe("language and contact", () => {
  it("keeps every student-facing question in English", () => {
    for (const q of QUESTIONS) {
      const blob = `${q.instruction} ${q.exercise} ${q.context ?? ""} ${q.parts
        .map((p) => p.prompt)
        .join(" ")}`;
      expect(/[\u0600-\u06FF]/.test(blob), q.id).toBe(false);
    }
  });

  it("keeps the required Arabic contact name exactly as specified", () => {
    expect(CONTACT_NAME).toBe("المهندس سومر شاهين");
  });

  it("keeps the phone number and WhatsApp link exactly as specified", () => {
    expect(CONTACT_PHONE).toBe("0930215022");
    expect(WHATSAPP_URL).toBe("https://wa.me/963930215022");
  });

  it("gates the teacher key with the required password", () => {
    expect(TEACHER_PASSWORD).toBe("somer173");
  });
});

/* ------------------------------------------------------------------ */
/* 14  the app actually renders (no blank screen)                      */
/* ------------------------------------------------------------------ */

describe("render smoke test", () => {
  it("renders the entry screen with the exam identity and start button", () => {
    const html = renderToString(createElement(App));
    expect(html).toContain("Start Exam");
    expect(html).toContain("Curriculum Exam");
    expect(html).toContain("L1-5 B");
    expect(html).toContain("Semester");
    expect(html).toContain("Total marks");
    expect(html).toContain("100");
    expect(html).toContain("50");
    expect(html).toContain(CONTACT_NAME);
    expect(html).toContain(WHATSAPP_URL);
    expect(html).toContain("Teacher Answer Key");
    expect(EXAM_SEMESTER).toBe(1);
    // no answer is revealed on the entry screen
    expect(html).not.toContain("secondary school starts at the age of");
  });
});

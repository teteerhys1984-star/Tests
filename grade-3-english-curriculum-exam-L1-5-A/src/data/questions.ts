import type { ChoicePart, LessonId, OrderPart, Question, SelectPart, TextPart } from "../types";
import { IMG } from "./media";
import {
  L1_FAMILY_TEXT,
  L2_DIALOGUE,
  L2_TIMETABLE,
  L3_DIALOGUE,
  L3_SONG,
  L4_DIALOGUE,
  L4_SONG,
  L5_SALLY_TABLE,
  L5_SCHOOL_PICTURE,
} from "./passages";

/* ------------------------------------------------------------------ */
/* Small builders                                                       */
/* ------------------------------------------------------------------ */
const PB = "Pupil’s Book" as const;
const WB = "Workbook" as const;
const TF = ["True", "False"];
const TICK = ["Tick ✓", "Cross ✗"];
const SOUNDS = ["ou", "oa", "ea", "oo"];

const choice = (
  id: string,
  stem: string,
  options: string[],
  answer: string,
  marks: number,
  extra: Partial<Pick<ChoicePart, "label" | "layout">> = {},
): ChoicePart => ({ id, kind: "choice", stem, options, answer, marks, ...extra });

const pick = (
  id: string,
  options: string[],
  answer: string,
  marks: number,
  ariaLabel: string,
  style: SelectPart["style"] = "buttons",
): SelectPart => ({ id, kind: "select", options, answer, marks, ariaLabel, style });

const write = (
  id: string,
  accepted: string[],
  answerDisplay: string,
  marks: number,
  ariaLabel: string,
  extra: Partial<Pick<TextPart, "size" | "inputMode">> = {},
): TextPart => ({ id, kind: "text", accepted, answerDisplay, marks, ariaLabel, ...extra });

const order = (id: string, tokens: string[], answer: string[], marks: number): OrderPart => ({
  id,
  kind: "order",
  tokens,
  answer,
  marks,
});

const L1_NOTE =
  "No Lesson 1 page scan exists in the curriculum repository. Only transcription lines that carry no OCR / visual-check / audio warning were used.";

/* ------------------------------------------------------------------ */
/* Lesson 1 – Back to School (pp. 3–5)                                  */
/* ------------------------------------------------------------------ */
const LESSON_1: Question[] = [
  {
    id: "L1-01",
    lesson: 1,
    format: "Choose the correct word",
    instruction: "Let’s learn! Choose the correct word.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["We ", { blank: "a" }, " got a big house."] },
      { type: "sentence", label: "b)", segments: ["He ", { blank: "b" }, " got a ball."] },
    ],
    parts: [
      pick("a", ["have", "has", "am"], "have", 1, "Sentence a: We … got a big house."),
      pick("b", ["have", "has", "are"], "has", 1, "Sentence b: He … got a ball."),
    ],
    sources: [
      {
        book: PB,
        page: "pp. 3–5",
        exercise: "Activity 2 · Let’s learn!",
        detail: `Printed frame: “We have got a big house.” / “He has got a ball.” Same items as the repository Lesson 1 Test Q1–Q2. ${L1_NOTE}`,
      },
    ],
    explanation: "We use “have got” with we and “has got” with he: We have got a big house. He has got a ball.",
    gradingRule: "1 mark for each correct word (a = have, b = has).",
  },
  {
    id: "L1-02",
    lesson: 1,
    format: "Multiple choice",
    instruction: "Read and choose the correct answer.",
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "Which word goes with “have got”?", ["She", "He", "They"], "They", 1, { label: "a)", layout: "row" }),
      choice("b", "Which word goes with “has got”?", ["We", "I", "She"], "She", 1, { label: "b)", layout: "row" }),
    ],
    sources: [
      {
        book: PB,
        page: "pp. 3–5",
        exercise: "Activity 2 · Let’s learn! (have got / has got)",
        detail: `Rule taught with the frame: have got → I, you, we, they; has got → he, she, it. Same items as the repository Lesson 1 Test Q3–Q4. ${L1_NOTE}`,
      },
    ],
    explanation: "“have got” goes with I, you, we and they. “has got” goes with he, she and it.",
    gradingRule: "1 mark for each correct choice (a = They, b = She).",
  },
  {
    id: "L1-03",
    lesson: 1,
    format: "Complete the sentence",
    instruction: "Read and write. Complete with “have got” or “has got”.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["Maya ", { blank: "a" }, " a little sister."] },
      { type: "sentence", label: "b)", segments: ["We ", { blank: "b" }, " a nice flat."] },
    ],
    parts: [
      pick("a", ["have got", "has got"], "has got", 1, "Sentence a: Maya … a little sister."),
      pick("b", ["have got", "has got"], "have got", 1, "Sentence b: We … a nice flat."),
    ],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 4 · Read and write",
        detail: `Printed items 1 and 4. ${L1_NOTE}`,
      },
    ],
    explanation: "Maya is one person (she), so we use “has got”. With we, we use “have got”.",
    gradingRule: "1 mark for each correct answer (a = has got, b = have got).",
  },
  {
    id: "L1-04",
    lesson: 1,
    format: "Choose the correct sentence",
    instruction: "Read and choose. Which sentence is correct?",
    blocks: [{ type: "choice", part: "a" }],
    parts: [
      choice(
        "a",
        "Choose the correct sentence.",
        ["He have got a car.", "He has got a car.", "He are got a car."],
        "He has got a car.",
        2,
      ),
    ],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 4 · Read and write",
        detail: `Printed item 3: “He has got a car.” Same item as the repository Lesson 1 Test Q8. ${L1_NOTE}`,
      },
    ],
    explanation: "With he we use “has got”: He has got a car.",
    gradingRule: "2 marks for the correct sentence; 0 otherwise.",
  },
  {
    id: "L1-05",
    lesson: 1,
    format: "Reorder words",
    instruction: "Put the words in the correct order to make a sentence.",
    blocks: [{ type: "order", part: "a" }],
    parts: [order("a", ["brothers.", "have", "two", "I", "got"], ["I", "have", "got", "two", "brothers."], 2)],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 4 · Read and write",
        detail: `Printed item 2: “I have got two brothers.” ${L1_NOTE}`,
      },
    ],
    explanation: "The correct sentence is: I have got two brothers.",
    gradingRule: "2 marks only if every word is in the correct order.",
  },
  {
    id: "L1-06",
    lesson: 1,
    format: "True / False",
    instruction: "Read the text from your book. Then choose True or False.",
    passage: L1_FAMILY_TEXT,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "The child has got two sisters.", TF, "True", 1, { label: "a)", layout: "row" }),
      choice("b", "The child has got three brothers.", TF, "False", 1, { label: "b)", layout: "row" }),
    ],
    sources: [
      {
        book: PB,
        page: "pp. 3–5",
        exercise: "Activity 4 · Talk about your family",
        detail: `Printed model text: “I live with my family. I’ve got two sisters and two brothers.” ${L1_NOTE}`,
      },
    ],
    explanation: "The text says “I’ve got two sisters and two brothers.” So: two sisters (True); two brothers, not three (False).",
    gradingRule: "1 mark for each correct True / False answer (a = True, b = False).",
  },
  {
    id: "L1-07",
    lesson: 1,
    format: "Multiple choice",
    instruction: "Read and choose the correct question.",
    blocks: [{ type: "choice", part: "a" }],
    parts: [
      choice(
        "a",
        "Which question asks about age?",
        ["How old are you?", "Where do you live?", "Who do you live with?"],
        "How old are you?",
        2,
      ),
    ],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 2 · Read and match (printed questions)",
        detail: `Uses the printed questions only. Same item as the repository Lesson 1 Test Q11. ${L1_NOTE}`,
      },
    ],
    explanation: "“How old are you?” asks about age. The answer begins “I’m … years old.”",
    gradingRule: "2 marks for the correct question; 0 otherwise.",
  },
  {
    id: "L1-08",
    lesson: 1,
    format: "Match",
    instruction: "Read and match. Choose the correct answer for each question.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["Who do you live with?", { blank: "a" }] },
      { type: "sentence", label: "b)", segments: ["Where do you live?", { blank: "b" }] },
    ],
    parts: [
      pick("a", ["I live with my ……", "I live in ……", "I’ve got ……"], "I live with my ……", 1, "Answer for question a: Who do you live with?", "dropdown"),
      pick("b", ["I live with my ……", "I live in ……", "I’ve got ……"], "I live in ……", 1, "Answer for question b: Where do you live?", "dropdown"),
    ],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 2 · Read and match (printed questions 2–3)",
        detail:
          "The answer options printed in Exercise 2 are marked in the repository as “inferred from OCR, not visually verified”, so they are NOT used.",
      },
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 5 · Write about you (printed sentence starters)",
        detail: `Verified starters “I live with my…”, “I live in…”, “I’ve got…” are used as the answers. ${L1_NOTE}`,
      },
    ],
    explanation: "“Who do you live with?” → “I live with my …”. “Where do you live?” → “I live in …”.",
    gradingRule: "1 mark for each correct match.",
  },
  {
    id: "L1-09",
    lesson: 1,
    format: "Reorder words",
    instruction: "Put the words in the correct order to make a question.",
    blocks: [{ type: "order", part: "a" }],
    parts: [order("a", ["name?", "brother’s", "What’s", "your"], ["What’s", "your", "brother’s", "name?"], 2)],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 2 · Read and match (printed question 4)",
        detail: `Printed question: “What’s your brother’s name?” ${L1_NOTE}`,
      },
    ],
    explanation: "The correct question is: What’s your brother’s name?",
    gradingRule: "2 marks only if every word is in the correct order.",
  },
  {
    id: "L1-10",
    lesson: 1,
    format: "Complete the sentence",
    instruction: "Write about you. Choose the correct word.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["My ", { blank: "a" }, "’s Sally."] },
      { type: "sentence", label: "b)", segments: ["I’m nine years ", { blank: "b" }, "."] },
    ],
    parts: [
      pick("a", ["name", "family", "house"], "name", 1, "Sentence a: My …’s Sally."),
      pick("b", ["old", "got", "live"], "old", 1, "Sentence b: I’m nine years …"),
    ],
    sources: [
      {
        book: WB,
        page: "pp. 3–5",
        exercise: "Exercise 5 · Write about you",
        detail: `Printed starters “My name’s…” and “I’m… years old”; a name and a number were filled in to make an objective item. ${L1_NOTE}`,
      },
    ],
    explanation: "The sentence starters are “My name’s …” and “I’m … years old.”",
    gradingRule: "1 mark for each correct word (a = name, b = old).",
  },
];

/* ------------------------------------------------------------------ */
/* Lesson 2 – School Subjects (pp. 6–8)                                 */
/* ------------------------------------------------------------------ */
const L2_MATCH_OPTIONS = [
  "On Tuesday, I’ve got Maths.",
  "Today, we’ve got Art and Music.",
  "My favourite lesson is English.",
  "On Wednesday, I’ve got Art and English.",
];
const SUBJECTS = ["Arabic", "Art", "English", "Maths", "Music", "Science", "Social Studies", "Sports"];
const NUMBERS_21_30 = ["21", "22", "23", "28", "29", "30"];

const LESSON_2: Question[] = [
  {
    id: "L2-01",
    lesson: 2,
    format: "Read and choose",
    instruction: "Read the dialogue. Choose the correct answer.",
    passage: L2_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "Today we’ve got …", ["Maths and Science.", "Art and Music.", "Arabic and English."], "Maths and Science.", 1, { label: "a)" }),
      choice("b", "“What’s your favourite lesson?” – “My favourite lesson is …”", ["Music.", "Sports.", "Art."], "Sports.", 1, { label: "b)", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 6", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 1–2 (reading only; no audio is needed)." }],
    explanation: "“Today we’ve got Maths and Science.” and “My favourite lesson is Sports.”",
    gradingRule: "1 mark for each correct answer.",
  },
  {
    id: "L2-02",
    lesson: 2,
    format: "True / False",
    instruction: "Read the dialogue. Choose True or False.",
    passage: L2_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "They have got Arabic today.", TF, "False", 1, { label: "a)", layout: "row" }),
      choice("b", "On Tuesday, they have got Art.", TF, "True", 1, { label: "b)", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 6", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 3 and 6." }],
    explanation: "“Have we got Arabic today?” – “No, we haven’t. We’ve got Social Studies.” (False). “On Tuesday, we’ve got Art.” (True).",
    gradingRule: "1 mark for each correct True / False answer (a = False, b = True).",
  },
  {
    id: "L2-03",
    lesson: 2,
    format: "Complete the sentence",
    instruction: "Read the dialogue. Complete the sentences.",
    passage: L2_DIALOGUE,
    blocks: [
      { type: "sentence", label: "a)", segments: ["Tomorrow, I’ve got ", { blank: "a" }, "."] },
      { type: "sentence", label: "b)", segments: ["On Tuesday, we’ve got Art. We need ", { blank: "b" }, "."] },
    ],
    parts: [
      pick("a", ["Music", "Maths", "Science"], "Music", 1, "Sentence a: Tomorrow, I’ve got …"),
      pick("b", ["crayons", "books", "balls"], "crayons", 1, "Sentence b: We need …"),
    ],
    sources: [{ book: PB, page: "p. 6", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 5 and 6." }],
    explanation: "“Tomorrow, I’ve got Music.” and “On Tuesday, we’ve got Art. We need crayons.”",
    gradingRule: "1 mark for each correct word (a = Music, b = crayons).",
  },
  {
    id: "L2-04",
    lesson: 2,
    format: "Match",
    instruction: "Read and match. Choose the correct answer for each question.",
    blocks: [
      { type: "sentence", label: "1-", segments: ["What lessons have we got today?", { blank: "a" }] },
      { type: "sentence", label: "2-", segments: ["What’s your favourite lesson?", { blank: "b" }] },
      { type: "sentence", label: "3-", segments: ["What have you got on Tuesday?", { blank: "c" }] },
      { type: "sentence", label: "4-", segments: ["What lessons have you got on Wednesday?", { blank: "d" }] },
    ],
    parts: [
      pick("a", L2_MATCH_OPTIONS, L2_MATCH_OPTIONS[1], 0.5, "Answer for question 1", "dropdown"),
      pick("b", L2_MATCH_OPTIONS, L2_MATCH_OPTIONS[2], 0.5, "Answer for question 2", "dropdown"),
      pick("c", L2_MATCH_OPTIONS, L2_MATCH_OPTIONS[0], 0.5, "Answer for question 3", "dropdown"),
      pick("d", L2_MATCH_OPTIONS, L2_MATCH_OPTIONS[3], 0.5, "Answer for question 4", "dropdown"),
    ],
    sources: [
      { book: WB, page: "p. 6", exercise: "Exercise 2 · Read and match", detail: "Printed questions 1–3 and answers a–c." },
      { book: PB, page: "p. 7", exercise: "Activity 3 · Ask and answer", detail: "Printed question and answer used as pair 4." },
    ],
    explanation:
      "1 → Today, we’ve got Art and Music. 2 → My favourite lesson is English. 3 → On Tuesday, I’ve got Maths. 4 → On Wednesday, I’ve got Art and English.",
    gradingRule: "0.5 mark for each correct match.",
  },
  {
    id: "L2-05",
    lesson: 2,
    format: "Read a timetable",
    instruction: "Look at the timetable. Complete the sentences.",
    passage: L2_TIMETABLE,
    blocks: [
      { type: "sentence", label: "a)", segments: ["On Monday, I’ve got Science, Maths, Arabic and ", { blank: "a" }, "."] },
      { type: "sentence", label: "b)", segments: ["On ", { blank: "b" }, ", I’ve got Arabic, Art and Sports."] },
    ],
    parts: [
      pick("a", ["English", "Music", "Sports"], "English", 1, "Sentence a: On Monday … and …"),
      pick("b", ["Monday", "Tuesday", "Wednesday", "Thursday"], "Tuesday", 1, "Sentence b: On … I’ve got Arabic, Art and Sports."),
    ],
    sources: [
      {
        book: PB,
        page: "p. 7",
        exercise: "Activity 3 · Ask and answer (printed timetable)",
        detail: "Answer pattern from the page: “On Wednesday, I’ve got Art and English.”",
      },
    ],
    explanation: "Monday: Science, Maths, Arabic, English. Tuesday: Arabic, Art, Sports.",
    gradingRule: "1 mark for each correct answer (a = English, b = Tuesday).",
  },
  {
    id: "L2-06",
    lesson: 2,
    format: "Complete a timetable",
    instruction: "Look and complete. Choose the subject for each picture.",
    blocks: [
      {
        type: "timetable",
        rows: [
          { day: "Sunday", cells: [{ text: "Maths" }, { text: "Art" }, { image: IMG.l2Wb8English, blank: "a" }, { text: "Arabic" }] },
          { day: "Monday", cells: [{ image: IMG.l2Wb8Science, blank: "b" }, { text: "Music" }, { text: "Arabic" }, { text: "English" }] },
          {
            day: "Tuesday",
            cells: [{ text: "Arabic" }, { image: IMG.l2Wb8Sports, blank: "c" }, { text: "Social Studies" }, { image: IMG.l2Wb8Maths, blank: "d" }],
          },
        ],
      },
    ],
    parts: [
      pick("a", SUBJECTS, "English", 0.5, "Sunday, lesson 3", "dropdown"),
      pick("b", SUBJECTS, "Science", 0.5, "Monday, lesson 1", "dropdown"),
      pick("c", SUBJECTS, "Sports", 0.5, "Tuesday, lesson 2", "dropdown"),
      pick("d", SUBJECTS, "Maths", 0.5, "Tuesday, lesson 4", "dropdown"),
    ],
    sources: [{ book: WB, page: "p. 8", exercise: "Exercise 5 · Look and complete", detail: "Printed timetable; the four picture cues are cropped from the page." }],
    explanation: "EN → English; flask → Science; player with a ball → Sports; + − × = → Maths.",
    gradingRule: "0.5 mark for each correct subject.",
  },
  {
    id: "L2-07",
    lesson: 2,
    format: "Match",
    instruction: "Read and match. Choose the correct number.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["twenty-nine", { blank: "a" }] },
      { type: "sentence", label: "b)", segments: ["twenty-two", { blank: "b" }] },
      { type: "sentence", label: "c)", segments: ["thirty", { blank: "c" }] },
      { type: "sentence", label: "d)", segments: ["twenty-eight", { blank: "d" }] },
    ],
    parts: [
      pick("a", NUMBERS_21_30, "29", 0.5, "Number for twenty-nine"),
      pick("b", NUMBERS_21_30, "22", 0.5, "Number for twenty-two"),
      pick("c", NUMBERS_21_30, "30", 0.5, "Number for thirty"),
      pick("d", NUMBERS_21_30, "28", 0.5, "Number for twenty-eight"),
    ],
    sources: [{ book: WB, page: "p. 7", exercise: "Exercise 3 · Read and match", detail: "Four of the six printed number words; all six printed numbers are offered." }],
    explanation: "twenty-nine = 29, twenty-two = 22, thirty = 30, twenty-eight = 28.",
    gradingRule: "0.5 mark for each correct number.",
  },
  {
    id: "L2-08",
    lesson: 2,
    format: "Write the missing numbers",
    instruction: "Write the missing numbers.",
    blocks: [
      {
        type: "sequence",
        items: ["21", "22", { blank: "a" }, "24", { blank: "b" }, { blank: "c" }, "27", "28", { blank: "d" }, "30"],
      },
    ],
    parts: [
      write("a", ["23", "twenty-three"], "23", 0.5, "Missing number after 22", { size: "sm", inputMode: "numeric" }),
      write("b", ["25", "twenty-five"], "25", 0.5, "Missing number after 24", { size: "sm", inputMode: "numeric" }),
      write("c", ["26", "twenty-six"], "26", 0.5, "Missing number before 27", { size: "sm", inputMode: "numeric" }),
      write("d", ["29", "twenty-nine"], "29", 0.5, "Missing number before 30", { size: "sm", inputMode: "numeric" }),
    ],
    sources: [{ book: WB, page: "p. 7", exercise: "Exercise 4 · Write the missing numbers", detail: "Printed sequence 21–30 with four blanks." }],
    explanation: "21, 22, 23, 24, 25, 26, 27, 28, 29, 30.",
    gradingRule: "0.5 mark for each correct number (the number word is also accepted).",
  },
  {
    id: "L2-09",
    lesson: 2,
    format: "Sounds and words",
    instruction: "Look at the pictures. Choose the missing letters.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["h", { blank: "a" }, "se"], images: [IMG.l2House] },
      { type: "sentence", label: "b)", segments: ["m", { blank: "b" }, "se"], images: [IMG.l2Mouse] },
    ],
    parts: [pick("a", SOUNDS, "ou", 1, "Missing letters in word a"), pick("b", SOUNDS, "ou", 1, "Missing letters in word b")],
    sources: [{ book: PB, page: "p. 8", exercise: "Activity 5 · Sounds and words (ou)", detail: "Printed sound “ou” with house and mouse; pictures cropped from the page." }],
    explanation: "Both words have the sound “ou”: house, mouse.",
    gradingRule: "1 mark for each correct pair of letters.",
  },
  {
    id: "L2-10",
    lesson: 2,
    format: "Short written answer",
    instruction: "Write the numbers in words.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["24 →", { blank: "a" }] },
      { type: "sentence", label: "b)", segments: ["27 →", { blank: "b" }] },
    ],
    parts: [
      write("a", ["twenty-four"], "twenty-four", 1, "24 in words", { size: "md" }),
      write("b", ["twenty-seven"], "twenty-seven", 1, "27 in words", { size: "md" }),
    ],
    sources: [{ book: PB, page: "p. 8", exercise: "Activity 4 · Listen and repeat (numbers 21–30)", detail: "Printed numbers with words; assessed as reading/writing only." }],
    explanation: "24 = twenty-four, 27 = twenty-seven.",
    gradingRule: "1 mark for each correctly spelt number word (with a hyphen or a space; capital letters ignored).",
  },
];

/* ------------------------------------------------------------------ */
/* Lesson 3 – My Lovely School (pp. 9–11)                               */
/* ------------------------------------------------------------------ */
const L3_ASK_OPTIONS = ["It is downstairs, on the left of the music room.", "There are twenty posters.", "Yes, of course."];
const L3_WORDS = ["draw", "library", "art room", "read", "laboratory"];

const LESSON_3: Question[] = [
  {
    id: "L3-01",
    lesson: 3,
    format: "Read and choose",
    instruction: "Read the dialogue. Choose the correct answer.",
    passage: L3_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "“This is the gym. We have … here.”", ["Sports", "Music", "Science"], "Sports", 1, { label: "a)", layout: "row" }),
      choice("b", "What’s Joe’s favourite place?", ["the gym", "the library", "the art room"], "the library", 1, { label: "b)", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 9", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 3 and 6." }],
    explanation: "“This is the gym. We have Sports here.” and “What’s your favourite place, Joe?” – “I prefer the library.”",
    gradingRule: "1 mark for each correct answer.",
  },
  {
    id: "L3-02",
    lesson: 3,
    format: "True / False",
    instruction: "Read the dialogue. Choose True or False.",
    passage: L3_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "Joe’s classroom is downstairs.", TF, "False", 1, { label: "a)", layout: "row" }),
      choice("b", "There are two laboratories downstairs.", TF, "True", 1, { label: "b)", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 9", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 4 and 5." }],
    explanation: "Joe’s classroom is upstairs, on the right of the art room (False). “There are two laboratories downstairs.” (True).",
    gradingRule: "1 mark for each correct True / False answer (a = False, b = True).",
  },
  {
    id: "L3-03",
    lesson: 3,
    format: "Match",
    instruction: "Ask and answer. Choose the correct answer for each question.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["Where is the classroom?", { blank: "a" }] },
      { type: "sentence", label: "b)", segments: ["How many posters are there?", { blank: "b" }] },
    ],
    parts: [
      pick("a", L3_ASK_OPTIONS, L3_ASK_OPTIONS[0], 1, "Answer for: Where is the classroom?", "dropdown"),
      pick("b", L3_ASK_OPTIONS, L3_ASK_OPTIONS[1], 1, "Answer for: How many posters are there?", "dropdown"),
    ],
    sources: [
      { book: PB, page: "p. 10", exercise: "Activity 3 · Ask and answer", detail: "Printed questions and answers." },
      { book: WB, page: "p. 11", exercise: "Exercise 5 · Read, order then act", detail: "Distractor “Yes, of course.” is a printed line from this exercise." },
    ],
    explanation: "“Where is the classroom?” – “It is downstairs, on the left of the music room.” “How many posters are there?” – “There are twenty posters.”",
    gradingRule: "1 mark for each correct answer.",
  },
  {
    id: "L3-04",
    lesson: 3,
    format: "Read and choose",
    instruction: "Look, read and choose. Which picture matches the sentence?",
    blocks: [{ type: "choice", part: "a" }],
    parts: [
      choice(
        "a",
        "Miss Emma is between Sarah and Tim.",
        ["👧 Sarah · 👩‍🏫 Miss Emma · 👦 Tim", "👩‍🏫 Miss Emma · 👧 Sarah · 👦 Tim", "👧 Sarah · 👦 Tim · 👩‍🏫 Miss Emma"],
        "👧 Sarah · 👩‍🏫 Miss Emma · 👦 Tim",
        2,
      ),
    ],
    sources: [
      {
        book: PB,
        page: "p. 10",
        exercise: "Activity 4 · Look, read and match",
        detail: "Printed sentence 3 is used verbatim; the book’s small photo is replaced by simple name cards that show the positions.",
      },
    ],
    explanation: "“Between” means Miss Emma is in the middle, with Sarah on one side and Tim on the other.",
    gradingRule: "2 marks for the correct picture; 0 otherwise.",
  },
  {
    id: "L3-05",
    lesson: 3,
    format: "Read and choose",
    instruction: "Read the song. Choose the correct word.",
    passage: L3_SONG,
    blocks: [
      { type: "sentence", label: "a)", segments: ["My school is ", { blank: "a" }, "."] },
      { type: "sentence", label: "b)", segments: ["We play, we share. We make many ", { blank: "b" }, "."] },
    ],
    parts: [
      pick("a", ["fun", "new", "big"], "fun", 1, "Sentence a: My school is …"),
      pick("b", ["friends", "books", "balls"], "friends", 1, "Sentence b: We make many …"),
    ],
    sources: [{ book: PB, page: "p. 11", exercise: "Activity 5 · Listen and sing", detail: "Printed song lines (reading only)." }],
    explanation: "“My school is fun.” and “We play, we share. We make many friends.”",
    gradingRule: "1 mark for each correct word (a = fun, b = friends).",
  },
  {
    id: "L3-06",
    lesson: 3,
    format: "Sounds and words",
    instruction: "Look at the pictures. Choose the missing letters.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["m", { blank: "a" }, "t"], images: [IMG.l3Meat] },
      { type: "sentence", label: "b)", segments: [{ blank: "b" }, "t"], images: [IMG.l3Eat] },
    ],
    parts: [pick("a", SOUNDS, "ea", 1, "Missing letters in word a"), pick("b", SOUNDS, "ea", 1, "Missing letters in word b")],
    sources: [{ book: PB, page: "p. 11", exercise: "Activity 6 · Sounds and words (ea)", detail: "Printed sound “ea” with meat and eat; pictures cropped from the page." }],
    explanation: "Both words have the sound “ea”: meat, eat.",
    gradingRule: "1 mark for each correct pair of letters.",
  },
  {
    id: "L3-07",
    lesson: 3,
    format: "Order the dialogue",
    instruction: "Read and order the dialogue. Number 1 is done for you.",
    blocks: [
      { type: "sentence", segments: [{ blank: "a" }, "Yes, of course."] },
      { type: "sentence", segments: [{ blank: "b" }, "Where is the toy shop, please?"] },
      { type: "sentence", segments: [{ blank: "c" }, "Thank you very much!"] },
      { type: "sentence", segments: [{ blank: "d" }, "It’s between the restaurant and the market."] },
      { type: "example", label: "1", text: "Hello! Can you help me?" },
    ],
    parts: [
      pick("a", ["2", "3", "4", "5"], "2", 0.5, "Number for: Yes, of course.", "dropdown"),
      pick("b", ["2", "3", "4", "5"], "3", 0.5, "Number for: Where is the toy shop, please?", "dropdown"),
      pick("c", ["2", "3", "4", "5"], "5", 0.5, "Number for: Thank you very much!", "dropdown"),
      pick("d", ["2", "3", "4", "5"], "4", 0.5, "Number for: It’s between the restaurant and the market.", "dropdown"),
    ],
    sources: [{ book: WB, page: "p. 11", exercise: "Exercise 5 · Read, order then act", detail: "Printed lines in printed order; “Hello! Can you help me?” is printed as 1." }],
    explanation:
      "1 Hello! Can you help me? → 2 Yes, of course. → 3 Where is the toy shop, please? → 4 It’s between the restaurant and the market. → 5 Thank you very much!",
    gradingRule: "0.5 mark for each line with the correct number.",
  },
  {
    id: "L3-08",
    lesson: 3,
    format: "Complete the sentence",
    instruction: "Read and write the missing words.",
    blocks: [
      { type: "wordbank", words: L3_WORDS },
      { type: "sentence", label: "1-", segments: ["I can ", { blank: "a" }, " books in the ", { blank: "b" }, "."] },
      { type: "sentence", label: "2-", segments: ["We ", { blank: "c" }, " pictures in the ", { blank: "d" }, "."] },
    ],
    parts: [
      pick("a", L3_WORDS, "read", 0.5, "Sentence 1, first blank", "dropdown"),
      pick("b", L3_WORDS, "library", 0.5, "Sentence 1, second blank", "dropdown"),
      pick("c", L3_WORDS, "draw", 0.5, "Sentence 2, first blank", "dropdown"),
      pick("d", L3_WORDS, "art room", 0.5, "Sentence 2, second blank", "dropdown"),
    ],
    sources: [{ book: WB, page: "p. 9", exercise: "Exercise 1 · Read and write the missing words", detail: "Printed sentences 1 and 3 with the printed word box." }],
    explanation: "I can read books in the library. We draw pictures in the art room.",
    gradingRule: "0.5 mark for each correct word.",
  },
  {
    id: "L3-09",
    lesson: 3,
    format: "Look, read and write",
    instruction: "Look, read and write. Choose the correct words.",
    blocks: [
      { type: "sentence", label: "Sarah:", segments: ["Where is the ", { blank: "a" }, "?"], images: [IMG.l3GymPupils] },
      { type: "sentence", label: "Mary:", segments: ["The gym is ", { blank: "b" }, " the art room."], images: [IMG.l3Doors] },
      { type: "sentence", label: "Sarah:", segments: ["How many desks are there in your ", { blank: "c" }, "?"], images: [IMG.l3Classroom] },
      { type: "sentence", label: "Mary:", segments: ["There are ", { blank: "d" }, " desks."], images: [IMG.l3Twelve] },
    ],
    parts: [
      pick("a", ["gym", "library", "classroom"], "gym", 0.5, "Blank 1"),
      pick("b", ["on the left of", "on the right of", "between"], "on the left of", 0.5, "Blank 2"),
      pick("c", ["classroom", "gym", "art room"], "classroom", 0.5, "Blank 3"),
      pick("d", ["twelve", "twenty", "two"], "twelve", 0.5, "Blank 4"),
    ],
    sources: [
      {
        book: WB,
        page: "p. 10",
        exercise: "Exercise 3 · Look, read and write",
        detail: "Printed dialogue frame with picture cues cropped from the page. Blank 1 is the book’s printed example (“gym”).",
      },
    ],
    explanation: "Where is the gym? The gym is on the left of the art room. How many desks are there in your classroom? There are twelve desks.",
    gradingRule: "0.5 mark for each correct blank.",
  },
  {
    id: "L3-10",
    lesson: 3,
    format: "Sort the words",
    instruction: "Write the words in the correct box. Is it a school word or a house word?",
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
      { type: "choice", part: "c" },
      { type: "choice", part: "d" },
    ],
    parts: [
      choice("a", "classroom", ["school", "house"], "school", 0.5, { layout: "row" }),
      choice("b", "kitchen", ["school", "house"], "house", 0.5, { layout: "row" }),
      choice("c", "playground", ["school", "house"], "school", 0.5, { layout: "row" }),
      choice("d", "bedroom", ["school", "house"], "house", 0.5, { layout: "row" }),
    ],
    sources: [{ book: WB, page: "p. 11", exercise: "Exercise 6 · Write the words in the correct box", detail: "Four of the six printed words." }],
    explanation: "school: classroom, playground. house: kitchen, bedroom.",
    gradingRule: "0.5 mark for each word in the correct box.",
  },
];

/* ------------------------------------------------------------------ */
/* Lesson 4 – My Five Senses (pp. 12–14)                                */
/* ------------------------------------------------------------------ */
const SENSES = ["see", "smell", "hear", "taste", "touch"];
const TENS = ["ten", "twenty", "thirty", "forty", "fifty"];

const LESSON_4: Question[] = [
  {
    id: "L4-01",
    lesson: 4,
    format: "Read and choose",
    instruction: "Read the dialogue. Choose the correct answer.",
    passage: L4_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "“The cakes taste …”", ["delicious.", "colourful.", "soft."], "delicious.", 1, { label: "a)", layout: "row" }),
      choice("b", "“Can I touch it?” What is the answer in the dialogue?", ["Yes, you can.", "No, you can’t.", "They smell nice."], "Yes, you can.", 1, { label: "b)" }),
    ],
    sources: [{ book: PB, page: "p. 12", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 2 and 5." }],
    explanation: "“The cakes taste delicious.” and “It’s a lovely cat. Can I touch it?” – “Yes, you can.”",
    gradingRule: "1 mark for each correct answer.",
  },
  {
    id: "L4-02",
    lesson: 4,
    format: "True / False",
    instruction: "Read the dialogue. Choose True or False.",
    passage: L4_DIALOGUE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "They can see the birds.", TF, "False", 1, { label: "a)", layout: "row" }),
      choice("b", "The cat is small and soft.", TF, "True", 1, { label: "b)", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 12", exercise: "Activity 1 · Listen and read", detail: "Printed dialogue, panels 4 and 6." }],
    explanation: "“Yes, I can. But I can’t see them.” (False). “It’s small and soft.” (True).",
    gradingRule: "1 mark for each correct True / False answer (a = False, b = True).",
  },
  {
    id: "L4-03",
    lesson: 4,
    format: "Look and complete",
    instruction: "Look and complete. Write the whole word.",
    blocks: [
      { type: "sentence", label: "1-", segments: ["n _ s _", { blank: "a" }], images: [IMG.l4Nose] },
      { type: "sentence", label: "2-", segments: ["_ y _", { blank: "b" }], images: [IMG.l4Eye] },
      { type: "sentence", label: "3-", segments: ["m _ _ th", { blank: "c" }], images: [IMG.l4Mouth] },
      { type: "sentence", label: "4-", segments: ["h _ n _", { blank: "d" }], images: [IMG.l4Hand] },
    ],
    parts: [
      write("a", ["nose"], "nose", 0.5, "Word 1", { size: "sm" }),
      write("b", ["eye"], "eye", 0.5, "Word 2", { size: "sm" }),
      write("c", ["mouth"], "mouth", 0.5, "Word 3", { size: "sm" }),
      write("d", ["hand"], "hand", 0.5, "Word 4", { size: "sm" }),
    ],
    sources: [
      {
        book: WB,
        page: "p. 12",
        exercise: "Exercise 1 · Look and complete",
        detail: "Printed items 1, 2, 4 and 5 with their letter hints; pictures cropped from the page.",
      },
    ],
    explanation: "nose, eye, mouth, hand.",
    gradingRule: "0.5 mark for each correctly spelt word (capital letters ignored).",
  },
  {
    id: "L4-04",
    lesson: 4,
    format: "Complete the sentence",
    instruction: "Fill in the spaces.",
    blocks: [
      { type: "wordbank", words: SENSES },
      { type: "sentence", label: "1-", segments: ["I can ", { blank: "a" }, " with my ears."] },
      { type: "sentence", label: "2-", segments: ["I can ", { blank: "b" }, " with my eyes."] },
      { type: "sentence", label: "3-", segments: ["I can ", { blank: "c" }, " with my mouth."] },
      { type: "sentence", label: "4-", segments: ["I can ", { blank: "d" }, " with my nose."] },
    ],
    parts: [
      pick("a", SENSES, "hear", 0.5, "Sentence 1: I can … with my ears."),
      pick("b", SENSES, "see", 0.5, "Sentence 2: I can … with my eyes."),
      pick("c", SENSES, "taste", 0.5, "Sentence 3: I can … with my mouth."),
      pick("d", SENSES, "smell", 0.5, "Sentence 4: I can … with my nose."),
    ],
    sources: [
      { book: WB, page: "p. 12", exercise: "Exercise 2 · Fill in the spaces", detail: "Printed sentences 1, 2, 4 and 5 with the printed word box." },
      { book: PB, page: "p. 13", exercise: "Activity 2 · Let’s learn!", detail: "Printed pairs: ear – hear, mouth – taste, eye – see, nose – smell, hand – touch." },
    ],
    explanation: "I can hear with my ears. I can see with my eyes. I can taste with my mouth. I can smell with my nose.",
    gradingRule: "0.5 mark for each correct word.",
  },
  {
    id: "L4-05",
    lesson: 4,
    format: "Read and circle",
    instruction: "Read and circle the correct word.",
    blocks: [
      { type: "sentence", label: "1-", segments: ["The cakes ", { blank: "a" }, " delicious."] },
      { type: "sentence", label: "2-", segments: ["The flowers ", { blank: "b" }, " nice."] },
      { type: "sentence", label: "3-", segments: ["I can’t ", { blank: "c" }, " the sky."] },
      { type: "sentence", label: "4-", segments: ["I can ", { blank: "d" }, " the moon."] },
    ],
    parts: [
      pick("a", ["touch", "taste"], "taste", 0.5, "Sentence 1"),
      pick("b", ["smell", "see"], "smell", 0.5, "Sentence 2"),
      pick("c", ["hear", "touch"], "touch", 0.5, "Sentence 3"),
      pick("d", ["see", "smell"], "see", 0.5, "Sentence 4"),
    ],
    sources: [{ book: WB, page: "p. 13", exercise: "Exercise 3 · Read and circle", detail: "All four printed sentences with the printed word pairs." }],
    explanation: "The cakes taste delicious. The flowers smell nice. I can’t touch the sky. I can see the moon.",
    gradingRule: "0.5 mark for each correct word.",
  },
  {
    id: "L4-06",
    lesson: 4,
    format: "Match",
    instruction: "Match the numbers to the words.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["20", { blank: "a" }] },
      { type: "sentence", label: "b)", segments: ["30", { blank: "b" }] },
      { type: "sentence", label: "c)", segments: ["40", { blank: "c" }] },
      { type: "sentence", label: "d)", segments: ["50", { blank: "d" }] },
    ],
    parts: [
      pick("a", TENS, "twenty", 0.5, "Word for 20"),
      pick("b", TENS, "thirty", 0.5, "Word for 30"),
      pick("c", TENS, "forty", 0.5, "Word for 40"),
      pick("d", TENS, "fifty", 0.5, "Word for 50"),
    ],
    sources: [{ book: PB, page: "p. 13", exercise: "Activity 3 · Listen and repeat (10–50)", detail: "Printed numbers and words; assessed as reading only." }],
    explanation: "20 = twenty, 30 = thirty, 40 = forty, 50 = fifty.",
    gradingRule: "0.5 mark for each correct match.",
  },
  {
    id: "L4-07",
    lesson: 4,
    format: "Write the missing numbers",
    instruction: "Write the missing numbers.",
    blocks: [
      { type: "sequence", items: ["thirty-one", "thirty-two", { blank: "a" }, { blank: "b" }, "thirty-five", { blank: "c" }, "thirty-seven"] },
      { type: "sequence", items: ["forty-three", "forty-four", { blank: "d" }, "forty-six"] },
    ],
    parts: [
      write("a", ["thirty-three", "33"], "thirty-three", 0.5, "Missing number after thirty-two", { size: "md" }),
      write("b", ["thirty-four", "34"], "thirty-four", 0.5, "Missing number before thirty-five", { size: "md" }),
      write("c", ["thirty-six", "36"], "thirty-six", 0.5, "Missing number after thirty-five", { size: "md" }),
      write("d", ["forty-five", "45"], "forty-five", 0.5, "Missing number after forty-four", { size: "md" }),
    ],
    sources: [
      {
        book: WB,
        page: "p. 14",
        exercise: "Exercise 5 · Write the missing numbers",
        detail: "Two continuous runs of the printed number chain (31–37 and 43–46).",
      },
    ],
    explanation: "thirty-three, thirty-four, thirty-six; forty-five.",
    gradingRule: "0.5 mark for each correct number (number word with a hyphen or a space; the numeral is also accepted).",
  },
  {
    id: "L4-08",
    lesson: 4,
    format: "Read and choose",
    instruction: "Read the song. Choose the correct word.",
    passage: L4_SONG,
    blocks: [
      { type: "sentence", label: "a)", segments: ["I have two eyes, so I can ", { blank: "a" }, "."] },
      { type: "sentence", label: "b)", segments: ["I have ten fingers, that can ", { blank: "b" }, "."] },
    ],
    parts: [
      pick("a", ["see", "hear", "touch"], "see", 1, "Sentence a"),
      pick("b", ["touch", "smell", "taste"], "touch", 1, "Sentence b"),
    ],
    sources: [{ book: PB, page: "p. 14", exercise: "Activity 5 · Listen and sing", detail: "Printed song lines (reading only)." }],
    explanation: "“I have two eyes, so I can see.” and “I have ten fingers, that can touch.”",
    gradingRule: "1 mark for each correct word (a = see, b = touch).",
  },
  {
    id: "L4-09",
    lesson: 4,
    format: "Sounds and words",
    instruction: "Look at the pictures. Choose the missing letters.",
    blocks: [
      { type: "sentence", label: "a)", segments: ["c", { blank: "a" }, "t"], images: [IMG.l4Coat] },
      { type: "sentence", label: "b)", segments: ["g", { blank: "b" }, "t"], images: [IMG.l4Goat] },
    ],
    parts: [pick("a", SOUNDS, "oa", 1, "Missing letters in word a"), pick("b", SOUNDS, "oa", 1, "Missing letters in word b")],
    sources: [{ book: PB, page: "p. 14", exercise: "Activity 6 · Sounds and words (oa)", detail: "Printed sound “oa” with coat and goat; pictures cropped from the page (printed labels removed)." }],
    explanation: "Both words have the sound “oa”: coat, goat.",
    gradingRule: "1 mark for each correct pair of letters.",
  },
  {
    id: "L4-10",
    lesson: 4,
    format: "Look and write",
    instruction: "Look and write. Number 1 is done for you.",
    blocks: [
      { type: "example", label: "1-", text: "I can see a car.", images: [IMG.l4Cue1Organ, IMG.l4Cue1Object] },
      { type: "sentence", label: "2-", segments: ["I can ", { blank: "a" }, " a rose."], images: [IMG.l4Cue2Organ, IMG.l4Cue2Object] },
      { type: "sentence", label: "3-", segments: ["I can ", { blank: "b" }, " a rabbit."], images: [IMG.l4Cue4Organ, IMG.l4Cue4Object] },
    ],
    parts: [
      write("a", ["smell"], "smell", 1, "Sentence 2: I can … a rose.", { size: "md" }),
      write("b", ["touch"], "touch", 1, "Sentence 3: I can … a rabbit.", { size: "md" }),
    ],
    sources: [
      {
        book: WB,
        page: "p. 14",
        exercise: "Exercise 6 · Look and write",
        detail: "Printed example (eyes + car) and picture pairs 2 (nose + rose) and 4 (hand + rabbit), cropped from the page.",
      },
    ],
    explanation: "Nose + rose → I can smell a rose. Hand + rabbit → I can touch a rabbit.",
    gradingRule: "1 mark for each correctly spelt word (capital letters ignored).",
  },
];

/* ------------------------------------------------------------------ */
/* Lesson 5 – Revision 1 (pp. 15–17)                                    */
/* ------------------------------------------------------------------ */
const PICTURE_LETTERS = ["a", "b", "c", "d", "e"];
const SOUND_GROUPS = ["oo", "ou", "oa", "ea"];

const LESSON_5: Question[] = [
  {
    id: "L5-01",
    lesson: 5,
    format: "True / False (tick or cross)",
    instruction: "Look, read then tick ✓ or cross ✗.",
    passage: L5_SCHOOL_PICTURE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
      { type: "choice", part: "c" },
      { type: "choice", part: "d" },
    ],
    parts: [
      choice("a", "The classrooms are downstairs.", TICK, "Cross ✗", 0.5, { label: "1-", layout: "row" }),
      choice("b", "The pupils are playing basketball.", TICK, "Tick ✓", 0.5, { label: "2-", layout: "row" }),
      choice("c", "The teacher is in the classroom.", TICK, "Cross ✗", 0.5, { label: "3-", layout: "row" }),
      choice("d", "The library is on the right of the laboratory.", TICK, "Tick ✓", 0.5, { label: "4-", layout: "row" }),
    ],
    sources: [{ book: PB, page: "p. 15", exercise: "Activity 1 · Look, read then tick or cross", detail: "Printed statements 1–4 and the printed school picture." }],
    explanation:
      "1 ✗ – both classrooms are upstairs. 2 ✓ – the pupils are playing basketball. 3 ✗ – the teacher is outside on the court. 4 ✓ – the Library is on the right and the Laboratory is on the left.",
    gradingRule: "0.5 mark for each correct tick or cross.",
  },
  {
    id: "L5-02",
    lesson: 5,
    format: "True / False and choose",
    instruction: "Look at the picture again. Choose the correct answer.",
    passage: L5_SCHOOL_PICTURE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "The laboratory is upstairs.", TICK, "Cross ✗", 1, { label: "a)", layout: "row" }),
      choice("b", "Where is the library?", ["It’s upstairs.", "It’s downstairs."], "It’s downstairs.", 1, { label: "b)", layout: "row" }),
    ],
    sources: [
      {
        book: PB,
        page: "p. 15",
        exercise: "Activity 1 · Look, read then tick or cross",
        detail: "a) printed statement 5. b) short added sub-question about the same printed picture (school places and their positions).",
      },
    ],
    explanation: "The Laboratory and the Library are both downstairs; the classrooms are upstairs.",
    gradingRule: "1 mark for each correct answer (a = Cross ✗, b = It’s downstairs.).",
  },
  {
    id: "L5-03",
    lesson: 5,
    format: "Read and circle",
    instruction: "Read and circle the correct word.",
    blocks: [
      { type: "sentence", label: "1-", segments: ["That is the playground. I ", { blank: "a" }, " with my friends here."] },
      { type: "sentence", label: "2-", segments: ["This is the laboratory. We have ", { blank: "b" }, " here."] },
    ],
    parts: [pick("a", ["play", "swim"], "play", 1, "Sentence 1"), pick("b", ["Sports", "Science"], "Science", 1, "Sentence 2")],
    sources: [
      {
        book: PB,
        page: "p. 17",
        exercise: "Activity 4 · Read, match then circle",
        detail: "Printed items 1–2 (circling part). The printed picture column does not line up with the sentences, so the matching part is not assessed.",
      },
    ],
    explanation: "We play in the playground. We have Science in the laboratory.",
    gradingRule: "1 mark for each correct word (a = play, b = Science).",
  },
  {
    id: "L5-04",
    lesson: 5,
    format: "Match",
    instruction: "Read and match. Choose the correct picture for each sentence.",
    blocks: [
      {
        type: "gallery",
        images: [
          { ...IMG.l5PicA, label: "a" },
          { ...IMG.l5PicB, label: "b" },
          { ...IMG.l5PicC, label: "c" },
          { ...IMG.l5PicD, label: "d" },
          { ...IMG.l5PicE, label: "e" },
        ],
      },
      { type: "sentence", label: "1-", segments: ["I can see twenty flowers.", { blank: "a" }] },
      { type: "sentence", label: "2-", segments: ["We’ve got Sports today.", { blank: "b" }] },
      { type: "sentence", label: "3-", segments: ["She’s got two brothers.", { blank: "c" }] },
      { type: "sentence", label: "4-", segments: ["I live with my parents in a flat.", { blank: "d" }] },
    ],
    parts: [
      pick("a", PICTURE_LETTERS, "c", 0.5, "Picture for sentence 1"),
      pick("b", PICTURE_LETTERS, "d", 0.5, "Picture for sentence 2"),
      pick("c", PICTURE_LETTERS, "a", 0.5, "Picture for sentence 3"),
      pick("d", PICTURE_LETTERS, "e", 0.5, "Picture for sentence 4"),
    ],
    sources: [
      {
        book: WB,
        page: "p. 15",
        exercise: "Exercise 1 · Read and match",
        detail: "Printed sentences 1, 2, 3 and 5 with all five printed pictures in printed order (sentence 4 is used in another question).",
      },
    ],
    explanation: "flowers → c; Sports → d (basketball court); two brothers → a (a girl with two boys); parents and a flat → e (family at home). Picture b is not needed.",
    gradingRule: "0.5 mark for each correct picture.",
  },
  {
    id: "L5-05",
    lesson: 5,
    format: "Reorder words",
    instruction: "Put the words in the correct order to make a sentence.",
    blocks: [{ type: "order", part: "a" }],
    parts: [order("a", ["favourite", "is", "Science", "subject.", "my"], ["Science", "is", "my", "favourite", "subject."], 2)],
    sources: [{ book: WB, page: "p. 15", exercise: "Exercise 1 · Read and match", detail: "Printed sentence 4: “Science is my favourite subject.”" }],
    explanation: "The correct sentence is: Science is my favourite subject.",
    gradingRule: "2 marks only if every word is in the correct order.",
  },
  {
    id: "L5-06",
    lesson: 5,
    format: "Odd one out",
    instruction: "Odd one out. Choose the word that does not belong.",
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "Choose the odd one out.", ["Science", "Maths", "gym", "English"], "gym", 1, { label: "1-", layout: "row" }),
      choice("b", "Choose the odd one out.", ["twenty-three", "Arabic", "thirty", "twenty-nine"], "Arabic", 1, { label: "2-", layout: "row" }),
    ],
    sources: [{ book: WB, page: "p. 15", exercise: "Exercise 2 · Odd one out", detail: "Printed rows 1–2 (row 1 is circled as the example in the book)." }],
    explanation: "1: gym is a place; the others are school subjects. 2: Arabic is a subject; the others are numbers.",
    gradingRule: "1 mark for each correct word (1 = gym, 2 = Arabic).",
  },
  {
    id: "L5-07",
    lesson: 5,
    format: "Odd one out",
    instruction: "Odd one out. Choose the word that does not belong.",
    blocks: [
      { type: "choice", part: "a" },
      { type: "choice", part: "b" },
    ],
    parts: [
      choice("a", "Choose the odd one out.", ["eye", "nose", "ear", "cake"], "cake", 1, { label: "3-", layout: "row" }),
      choice("b", "Choose the odd one out.", ["computer", "classroom", "library", "laboratory"], "computer", 1, { label: "4-", layout: "row" }),
    ],
    sources: [{ book: WB, page: "p. 15", exercise: "Exercise 2 · Odd one out", detail: "Printed rows 3–4." }],
    explanation: "3: cake is food; the others are parts of the body. 4: computer is a thing; the others are rooms in a school.",
    gradingRule: "1 mark for each correct word (3 = cake, 4 = computer).",
  },
  {
    id: "L5-08",
    lesson: 5,
    format: "Short written answer",
    instruction: "Write. Look at the pictures and write the school subjects.",
    blocks: [
      {
        type: "sentence",
        label: "1-",
        segments: ["I’ve got ", { blank: "a" }, { image: IMG.l5Flask }, " and ", { blank: "b" }, { image: IMG.l5Music }, " on Sunday."],
      },
      {
        type: "sentence",
        label: "2-",
        segments: ["We’ve got ", { blank: "c" }, { image: IMG.l5En }, " and ", { blank: "d" }, { image: IMG.l5Maths }, " on Monday."],
      },
    ],
    parts: [
      write("a", ["Science"], "Science", 0.5, "Sentence 1, first subject", { size: "md" }),
      write("b", ["Music"], "Music", 0.5, "Sentence 1, second subject", { size: "md" }),
      write("c", ["English"], "English", 0.5, "Sentence 2, first subject", { size: "md" }),
      write("d", ["Maths"], "Maths", 0.5, "Sentence 2, second subject", { size: "md" }),
    ],
    sources: [{ book: WB, page: "p. 17", exercise: "Exercise 5 · Write", detail: "Printed items 1–2; picture cues cropped from the page." }],
    explanation: "I’ve got Science and Music on Sunday. We’ve got English and Maths on Monday.",
    gradingRule: "0.5 mark for each correctly spelt subject (capital letters ignored).",
  },
  {
    id: "L5-09",
    lesson: 5,
    format: "Sounds and words",
    instruction: "Look, match then write. Choose the missing letters for each word.",
    blocks: [
      { type: "sentence", label: "1-", segments: ["br", { blank: "a" }, "m"], images: [IMG.l5Broom] },
      { type: "sentence", label: "2-", segments: ["h", { blank: "b" }, "se"], images: [IMG.l5House] },
      { type: "sentence", label: "3-", segments: ["g", { blank: "c" }, "t"], images: [IMG.l5Goat] },
      { type: "sentence", label: "4-", segments: [{ blank: "d" }, "t"], images: [IMG.l5Eat] },
    ],
    parts: [
      pick("a", SOUND_GROUPS, "oo", 0.5, "Missing letters in word 1"),
      pick("b", SOUND_GROUPS, "ou", 0.5, "Missing letters in word 2"),
      pick("c", SOUND_GROUPS, "oa", 0.5, "Missing letters in word 3"),
      pick("d", SOUND_GROUPS, "ea", 0.5, "Missing letters in word 4"),
    ],
    sources: [
      {
        book: WB,
        page: "p. 17",
        exercise: "Exercise 6 · Look, match then write",
        detail: "Printed pictures and sound groups oo, ou, oa, ea; house → ou is the book’s printed example.",
      },
    ],
    explanation: "broom (oo), house (ou), goat (oa), eat (ea).",
    gradingRule: "0.5 mark for each correct pair of letters.",
  },
  {
    id: "L5-10",
    lesson: 5,
    format: "Read a table",
    instruction: "Read the table from your book. Choose the correct answer.",
    passage: L5_SALLY_TABLE,
    blocks: [
      { type: "choice", part: "a" },
      { type: "sentence", label: "b)", segments: ["Sally ", { blank: "b" }, " got two brothers."] },
    ],
    parts: [
      choice("a", "How many brothers has Sally got?", ["one", "two", "three"], "two", 1, { label: "a)", layout: "row" }),
      pick("b", ["has", "have"], "has", 1, "Sentence b: Sally … got two brothers."),
    ],
    sources: [
      {
        book: PB,
        page: "p. 16",
        exercise: "Activity 2 · Listen then complete the table",
        detail: "Only the printed value is used (Sally – brothers – 2). The other cells depend on the unavailable recording and are not assessed.",
      },
      { book: WB, page: "p. 15", exercise: "Exercise 1 · Read and match", detail: "Printed sentence 3: “She’s got two brothers.”" },
    ],
    explanation: "The table shows 2 brothers for Sally, so: Sally has got two brothers.",
    gradingRule: "1 mark for each correct answer (a = two, b = has).",
  },
];

/* ------------------------------------------------------------------ */
/* Mixed exam order                                                     */
/* ------------------------------------------------------------------ */
export const QUESTIONS_BY_LESSON: Record<LessonId, Question[]> = {
  1: LESSON_1,
  2: LESSON_2,
  3: LESSON_3,
  4: LESSON_4,
  5: LESSON_5,
};

/** Each row contains every lesson once, so no lesson is ever shown twice in a row. */
const LESSON_PATTERN: LessonId[] = [
  3, 1, 4, 2, 5, 1, 3, 5, 2, 4, 2, 4, 1, 5, 3, 5, 2, 3, 4, 1, 4, 5, 2, 1, 3,
  1, 3, 4, 5, 2, 3, 2, 5, 1, 4, 2, 1, 3, 4, 5, 4, 1, 5, 2, 3, 1, 5, 2, 4, 3,
];

/** Within-lesson order (question numbers), chosen to keep same-passage items apart. */
const WITHIN_LESSON: Record<LessonId, number[]> = {
  1: [6, 1, 9, 3, 7, 2, 10, 5, 8, 4],
  2: [1, 7, 4, 10, 2, 6, 9, 3, 8, 5],
  3: [2, 8, 5, 1, 10, 4, 7, 3, 9, 6],
  4: [3, 1, 8, 5, 10, 6, 2, 9, 4, 7],
  5: [1, 6, 4, 9, 3, 8, 2, 10, 5, 7],
};

export function buildExamOrder(): Question[] {
  const used: Record<LessonId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  return LESSON_PATTERN.map((lesson) => {
    const n = WITHIN_LESSON[lesson][used[lesson]++];
    const id = `L${lesson}-${String(n).padStart(2, "0")}`;
    const question = QUESTIONS_BY_LESSON[lesson].find((q) => q.id === id);
    if (!question) throw new Error(`Missing question ${id}`);
    return question;
  });
}

/** All 50 questions in the order the pupil sees them. */
export const EXAM_QUESTIONS: Question[] = buildExamOrder();

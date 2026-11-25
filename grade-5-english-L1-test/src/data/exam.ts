// Exam content: Grade 5 · Unit 1 · Lesson 1 · "At School".
// Sources (repository E_Curriculum_1_9):
//   grade5-unit1-lesson1-pupil-book.html  (Pupil's Book pp.3–5, Exercises 1–9)
//   grade5-unit1-lesson1-workbook.html    (Workbook pp.5–7)
//   grade5-unit1-lesson1-vocabulary.html  (Key vocabulary and Arabic meanings)
// Questions are original; they do not reproduce the repository's lesson test.

export type ItemKind = "vocab" | "choice" | "select" | "truefalse" | "arrange";

export interface CurriculumRef {
  unit: string;
  lesson: string;
  source: string;
  skill: string;
}

export interface ExamItem {
  id: string;
  kind: ItemKind;
  /** Student-visible prompt. Use "___" to place an inline dropdown in a sentence. */
  prompt: string;
  /** Arabic prompt word – only used by vocab items (Q1–Q3). */
  arabic?: string;
  /** Choices for choice / select / truefalse / arrange items. */
  options?: string[];
  /** Labels for each slot of an arrange item. */
  slotLabels?: string[];
  /** Correct answer: a string, or an array (one entry per slot) for arrange items. */
  answer: string | string[];
  marks: number;
  ref: CurriculumRef;
  explanation: string;
}

export interface ExamPart {
  id: string;
  title: string;
  instruction: string;
  items: ExamItem[];
}

export interface ExamQuestion {
  number: number;
  title: string;
  focus: string;
  targetMarks: number;
  instruction: string;
  passage?: { title: string; paragraphs: string[] };
  parts: ExamPart[];
}

export const EXAM_TITLE = "English Exam";
export const EXAM_SUBTITLE = "Grade 5 · Unit 1 · Lesson 1: At School";
export const TOTAL_MARKS = 100;

const UNIT = "Unit 1";
const LESSON = "Lesson 1 – At School";
const ref = (source: string, skill: string): CurriculumRef => ({ unit: UNIT, lesson: LESSON, source, skill });

const VOCAB_SOURCE = "Vocabulary list (Key vocabulary, Arabic meanings); Workbook Exercise 1 word box";
const vocabSkill = "Vocabulary recall: Arabic meaning → typed English word";

const SRC_ST_BOOK = "Pupil’s Book pp.3–5, Exercise 5 (school stage chart)";
const SRC_ST_WB = "Workbook Exercise 5 (order school stages)";

const BANK = ["listen", "follow", "instructions", "arrive on time"];

export const QUESTIONS: ExamQuestion[] = [
  // ───────────── Q1 · 12 marks · vocabulary (typed) ─────────────
  {
    number: 1,
    title: "School Places: Translate into English",
    focus: "Vocabulary recall",
    targetMarks: 12,
    instruction: "Read the Arabic word. Type the English word that matches it.",
    parts: [
      {
        id: "Q1-A",
        title: "School places",
        instruction: "Type each English word in its box.",
        items: [
          {
            id: "Q1.1", kind: "vocab", prompt: "Type the English word.", arabic: "الصف", answer: "classroom", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "classroom = a room where a class is taught.",
          },
          {
            id: "Q1.2", kind: "vocab", prompt: "Type the English word.", arabic: "مخبر العلوم", answer: "science lab", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "science lab = a room for science experiments.",
          },
          {
            id: "Q1.3", kind: "vocab", prompt: "Type the English word.", arabic: "ساحة اللعب", answer: "playground", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "playground = an outdoor place for pupils to play.",
          },
        ],
      },
    ],
  },

  // ───────────── Q2 · 12 marks · vocabulary (typed) ─────────────
  {
    number: 2,
    title: "Vocabulary Recall Challenge",
    focus: "Vocabulary recall",
    targetMarks: 12,
    instruction: "Read each Arabic word carefully. Type the matching English school word.",
    parts: [
      {
        id: "Q2-A",
        title: "School places",
        instruction: "Type each English word in its box.",
        items: [
          {
            id: "Q2.1", kind: "vocab", prompt: "Type the English word.", arabic: "المكتبة", answer: "library", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "library = a place where people read or borrow books.",
          },
          {
            id: "Q2.2", kind: "vocab", prompt: "Type the English word.", arabic: "مخبر الحاسوب", answer: "computer lab", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "computer lab = a room with computers.",
          },
          {
            id: "Q2.3", kind: "vocab", prompt: "Type the English word.", arabic: "الممر", answer: "corridor", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "corridor = the passage inside the school building. Lesson rule: in the corridor we walk; we do not run.",
          },
        ],
      },
    ],
  },

  // ───────────── Q3 · 8 marks · vocabulary (typed) ─────────────
  {
    number: 3,
    title: "Final Vocabulary Challenge",
    focus: "Vocabulary recall",
    targetMarks: 8,
    instruction: "Type the English word for each Arabic word. Take your time.",
    parts: [
      {
        id: "Q3-A",
        title: "School places and school items",
        instruction: "Type each English word in its box.",
        items: [
          {
            id: "Q3.1", kind: "vocab", prompt: "Type the English word.", arabic: "المقصف", answer: "canteen", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "canteen = the place in school where pupils can buy or eat food.",
          },
          {
            id: "Q3.2", kind: "vocab", prompt: "Type the English word.", arabic: "الزي المدرسي", answer: "school uniform", marks: 4,
            ref: ref(VOCAB_SOURCE, vocabSkill),
            explanation: "school uniform = the clothes that pupils wear at school.",
          },
        ],
      },
    ],
  },

  // ───────────── Q4 · 15 marks · grammar ─────────────
  {
    number: 4,
    title: "Grammar: Have To, Has To, Don’t Have To",
    focus: "Obligation and necessity",
    targetMarks: 15,
    instruction: "Choose the correct word or sentence for each item.",
    parts: [
      {
        id: "Q4-A",
        title: "Fill in the blank",
        instruction: "Choose the form that completes each sentence.",
        items: [
          {
            id: "Q4.1", kind: "select", prompt: "Karim ___ to keep the classroom tidy.",
            options: ["has to", "have to", "don't have to"], answer: "has to", marks: 3,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 7", "Has to with a singular subject (he / she / Karim)"),
            explanation: "Karim is one person, so use “has to” + base verb: Karim has to keep the classroom tidy.",
          },
          {
            id: "Q4.2", kind: "select", prompt: "We ___ bring a packed lunch, because there is a canteen at school.",
            options: ["don't have to", "doesn't have to", "have to"], answer: "don't have to", marks: 3,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4; Workbook Exercises 7–8", "Don’t have to = not necessary (not forbidden)"),
            explanation: "“Don’t have to” means it is not necessary. With “we”, use don’t have to.",
          },
        ],
      },
      {
        id: "Q4-B",
        title: "Choose the correct question or answer",
        instruction: "Choose the correct word for each question and short answer.",
        items: [
          {
            id: "Q4.3", kind: "select", prompt: "___ Maha have to bring her lunch from home?",
            options: ["Do", "Does"], answer: "Does", marks: 3,
            ref: ref("Pupil’s Book pp.3–5, Exercise 7 (question forms)", "Question form: Does + subject + have to"),
            explanation: "With a singular subject such as Maha, the question starts with “Does”: Does Maha have to…?",
          },
          {
            id: "Q4.4", kind: "select", prompt: "Does Maha have to bring her lunch from home? No, she ___.",
            options: ["doesn't have to", "don't have to", "has to"], answer: "doesn't have to", marks: 3,
            ref: ref("Pupil’s Book pp.3–5, Exercise 7; Workbook Exercises 7–8", "Short answers with doesn’t have to"),
            explanation: "After “No, she”, use doesn’t have to. It means lunch from home is not necessary.",
          },
        ],
      },
      {
        id: "Q4-C",
        title: "Correct the mistake",
        instruction: "Choose the correct version of the sentence.",
        items: [
          {
            id: "Q4.5", kind: "choice", prompt: "Correct this sentence: “Lina have to wear a school uniform.”",
            options: ["Lina has to wear a school uniform.", "Lina does have to wear a school uniform.", "Lina have to wear a school uniform."],
            answer: "Lina has to wear a school uniform.", marks: 3,
            ref: ref("Pupil’s Book pp.3–5, Exercise 8 (word order); Workbook Exercise 6a (correct the mistake)", "Correcting has to with a singular subject"),
            explanation: "“Lina” is singular, so the verb is “has to”: Lina has to wear a school uniform.",
          },
        ],
      },
    ],
  },

  // ───────────── Q5 · 10 marks · school stages ─────────────
  {
    number: 5,
    title: "School Stages",
    focus: "Nursery, basic / primary school, secondary school",
    targetMarks: 10,
    instruction: "Use the age and grade information to choose the correct school stage.",
    parts: [
      {
        id: "Q5-A",
        title: "Match each child to a school stage",
        instruction: "Choose the school stage for each child.",
        items: [
          {
            id: "Q5.1", kind: "select", prompt: "Sami is 4 years old. Which school stage is he in?",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "nursery", marks: 1,
            ref: ref(SRC_ST_BOOK, "School stages by age: nursery"),
            explanation: "Children aged about 3–5 go to nursery.",
          },
          {
            id: "Q5.2", kind: "select", prompt: "Lina is 8 years old. Which school stage is she in?",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "basic / primary school", marks: 1,
            ref: ref(SRC_ST_BOOK, "School stages by age: basic / primary"),
            explanation: "An 8-year-old is in basic (primary) school.",
          },
          {
            id: "Q5.3", kind: "select", prompt: "Rania is 16 years old. Which school stage is she in?",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "secondary school", marks: 1,
            ref: ref(SRC_ST_BOOK, "School stages by age: secondary"),
            explanation: "A 16-year-old is in secondary school.",
          },
          {
            id: "Q5.4", kind: "select", prompt: "Hala is 10 years old. Which school stage is she in?",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "basic / primary school", marks: 1,
            ref: ref(SRC_ST_BOOK, "School stages by age: basic / primary"),
            explanation: "A 10-year-old is in basic (primary) school.",
          },
        ],
      },
      {
        id: "Q5-B",
        title: "Put the school stages in order",
        instruction: "Arrange the stages from the youngest pupils to the oldest pupils.",
        items: [
          {
            id: "Q5.5", kind: "arrange", prompt: "Choose the order: youngest pupils first, oldest pupils last.",
            options: ["nursery", "basic / primary school", "secondary school"],
            slotLabels: ["First", "Second", "Third"],
            answer: ["nursery", "basic / primary school", "secondary school"], marks: 3,
            ref: ref(SRC_ST_WB, "Sequence of school stages"),
            explanation: "Nursery comes first, then basic / primary school, then secondary school.",
          },
        ],
      },
      {
        id: "Q5-C",
        title: "Match each grade band to its stage",
        instruction: "Use the grade bands from the Pupil’s Book chart to match each band.",
        items: [
          {
            id: "Q5.6", kind: "select", prompt: "Grades 10–12",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "secondary school", marks: 1,
            ref: ref(SRC_ST_BOOK, "Grade bands: secondary = Grades 10–12"),
            explanation: "Grades 10–12 are the secondary school stage.",
          },
          {
            id: "Q5.7", kind: "select", prompt: "KG 1–3",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "nursery", marks: 1,
            ref: ref(SRC_ST_BOOK, "Grade bands: nursery = KG 1–3"),
            explanation: "KG 1–3 is the nursery stage.",
          },
          {
            id: "Q5.8", kind: "select", prompt: "Grades 1–9",
            options: ["nursery", "basic / primary school", "secondary school"], answer: "basic / primary school", marks: 1,
            ref: ref(SRC_ST_BOOK, "Grade bands: basic / primary = Grades 1–9"),
            explanation: "Grades 1–9 are the basic / primary school stage.",
          },
        ],
      },
    ],
  },

  // ───────────── Q6 · 20 marks · reading ─────────────
  {
    number: 6,
    title: "Reading Comprehension: A Day at Layla’s School",
    focus: "Reading for information",
    targetMarks: 20,
    instruction: "Read the passage carefully. Then answer the four parts.",
    passage: {
      title: "A Day at Layla’s School",
      paragraphs: [
        "My name is Layla. I am ten years old, and I go to a basic school in Syria. My school has a big playground, where we play during the break. We have lessons in our classroom. On Mondays, we have science in the science lab. The computer lab has many computers, and in the library we can read and borrow books.",
        "In the morning, we have to arrive on time. In the corridor, we walk; we do not run. We have to wear our school uniform every day. We don't have to bring a packed lunch from home, because there is a canteen. My little brother, Omar, goes to nursery school. He is only four years old, and he loves it.",
      ],
    },
    parts: [
      {
        id: "Q6-A",
        title: "Part A · True or false",
        instruction: "Read each statement. Choose True or False.",
        items: [
          {
            id: "Q6.1", kind: "truefalse", prompt: "Layla is ten years old.", options: ["True", "False"], answer: "True", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading); Workbook Exercise 6b", "Reading: true or false – facts"),
            explanation: "The passage says: “I am ten years old.”",
          },
          {
            id: "Q6.2", kind: "truefalse", prompt: "Layla goes to a nursery school.", options: ["True", "False"], answer: "False", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading); Workbook Exercise 6b", "Reading: true or false – school stage"),
            explanation: "Layla goes to a basic school. Her brother goes to nursery school.",
          },
          {
            id: "Q6.3", kind: "truefalse", prompt: "Layla’s school has a playground.", options: ["True", "False"], answer: "True", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading); Workbook Exercise 6b", "Reading: true or false – school places"),
            explanation: "The passage says: “My school has a big playground.”",
          },
          {
            id: "Q6.4", kind: "truefalse", prompt: "Layla has science in the computer lab on Mondays.", options: ["True", "False"], answer: "False", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading); Workbook Exercise 6b", "Reading: true or false – detail"),
            explanation: "On Mondays Layla has science in the science lab, not the computer lab.",
          },
          {
            id: "Q6.5", kind: "truefalse", prompt: "Layla has to bring a packed lunch from home.", options: ["True", "False"], answer: "False", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 6 (reading)", "Reading: don’t have to in context"),
            explanation: "The passage says Layla does not have to bring a packed lunch, because there is a canteen.",
          },
        ],
      },
      {
        id: "Q6-B",
        title: "Part B · Multiple choice",
        instruction: "Choose the best answer for each question.",
        items: [
          {
            id: "Q6.6", kind: "choice", prompt: "Where can Layla read and borrow books?",
            options: ["the library", "the playground", "the corridor"], answer: "the library", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading); Vocabulary list", "Reading: multiple choice – school places"),
            explanation: "The passage says: “in the library we can read and borrow books.”",
          },
          {
            id: "Q6.7", kind: "choice", prompt: "What kind of school does Layla’s little brother go to?",
            options: ["a basic school", "a nursery school", "a secondary school"], answer: "a nursery school", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 5 and Exercise 6", "Reading: multiple choice – school stages"),
            explanation: "The passage says: “My little brother, Omar, goes to nursery school.”",
          },
          {
            id: "Q6.8", kind: "choice", prompt: "Where do pupils walk and not run?",
            options: ["the corridor", "the canteen", "the science lab"], answer: "the corridor", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 (school rules)", "Reading: multiple choice – school rules"),
            explanation: "The passage says: “In the corridor, we walk; we do not run.”",
          },
          {
            id: "Q6.9", kind: "choice", prompt: "What do pupils have to wear every day?",
            options: ["a school uniform", "a packed lunch", "a library card"], answer: "a school uniform", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 7 (have to)", "Reading: multiple choice – have to"),
            explanation: "The passage says: “We have to wear our school uniform every day.”",
          },
          {
            id: "Q6.10", kind: "choice", prompt: "How old is Layla?",
            options: ["four", "ten", "sixteen"], answer: "ten", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading)", "Reading: multiple choice – details"),
            explanation: "The passage says Layla is ten years old.",
          },
        ],
      },
      {
        id: "Q6-C",
        title: "Part C · Find the information",
        instruction: "Find the answer in the passage. Choose the correct option.",
        items: [
          {
            id: "Q6.11", kind: "select", prompt: "Where does Layla have science on Mondays?",
            options: ["the science lab", "the computer lab", "the library", "the canteen"], answer: "the science lab", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 1 and Exercise 3 (where do you have science?)", "Reading: find information – science place"),
            explanation: "The passage says: “On Mondays, we have science in the science lab.”",
          },
          {
            id: "Q6.12", kind: "select", prompt: "Where does Layla play during the break?",
            options: ["the library", "the playground", "the corridor", "the canteen"], answer: "the playground", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 1 (school places)", "Reading: find information – break time"),
            explanation: "The passage says: “My school has a big playground, where we play during the break.”",
          },
          {
            id: "Q6.13", kind: "select", prompt: "Why doesn't Layla have to bring a packed lunch from home?",
            options: ["There is a canteen at school.", "Her brother is four years old.", "The library is open."],
            answer: "There is a canteen at school.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 (don’t have to); Workbook Exercises 7–8", "Reading: find information – reason"),
            explanation: "The passage says: “We don't have to bring a packed lunch from home, because there is a canteen.”",
          },
          {
            id: "Q6.14", kind: "select", prompt: "What is the name of Layla’s little brother?",
            options: ["Omar", "Samer", "Hala"], answer: "Omar", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (reading)", "Reading: find information – names"),
            explanation: "The passage says: “my little brother, Omar”.",
          },
          {
            id: "Q6.15", kind: "select", prompt: "Which school does Layla go to?",
            options: ["a nursery school", "a basic school", "a secondary school"], answer: "a basic school", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 5 and Exercise 6 (reading)", "Reading: find information – school stage"),
            explanation: "The passage says: “I go to a basic school in Syria.”",
          },
        ],
      },
      {
        id: "Q6-D",
        title: "Part D · Choose the correct statement",
        instruction: "Choose the statement that is correct according to the passage.",
        items: [
          {
            id: "Q6.16", kind: "choice", prompt: "Which statement is correct?",
            options: [
              "In the corridor, Layla runs.",
              "In the corridor, Layla walks and does not run.",
              "The corridor is a place to read books.",
            ],
            answer: "In the corridor, Layla walks and does not run.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 (school rules)", "Choose the correct statement – corridor rule"),
            explanation: "The passage says: “In the corridor, we walk; we do not run.”",
          },
          {
            id: "Q6.17", kind: "choice", prompt: "Which statement is correct?",
            options: [
              "Layla and her classmates have to arrive on time.",
              "Layla and her classmates do not have to arrive on time.",
              "Layla arrives at school in the evening.",
            ],
            answer: "Layla and her classmates have to arrive on time.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Vocabulary list (arrive on time)", "Choose the correct statement – obligation"),
            explanation: "The passage says: “In the morning, we have to arrive on time.”",
          },
          {
            id: "Q6.18", kind: "choice", prompt: "Which statement is correct?",
            options: [
              "The computer lab has many computers.",
              "The computer lab is a place to eat lunch.",
              "The library has science experiments.",
            ],
            answer: "The computer lab has many computers.", marks: 1,
            ref: ref("Workbook Exercise 1 (word meanings); Pupil’s Book Exercise 6", "Choose the correct statement – school places"),
            explanation: "The passage says: “The computer lab has many computers.”",
          },
          {
            id: "Q6.19", kind: "choice", prompt: "Which statement is correct?",
            options: [
              "Layla has to wear a school uniform every day.",
              "Layla does not have to wear a school uniform.",
              "Layla's school does not have a playground.",
            ],
            answer: "Layla has to wear a school uniform every day.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 7 (have to)", "Choose the correct statement – have to"),
            explanation: "The passage says: “We have to wear our school uniform every day.”",
          },
          {
            id: "Q6.20", kind: "choice", prompt: "Which statement is correct?",
            options: [
              "The canteen is in the library.",
              "There is a canteen at Layla’s school.",
              "Layla brings her lunch from home every day.",
            ],
            answer: "There is a canteen at Layla’s school.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 6 (reading)", "Choose the correct statement – school places"),
            explanation: "The passage says there is a canteen, so pupils do not have to bring a packed lunch.",
          },
        ],
      },
    ],
  },

  // ───────────── Q7 · 11 marks · rules and real-life situations ─────────────
  {
    number: 7,
    title: "School Rules and Real-Life Situations",
    focus: "School rules, classroom behaviour, places",
    targetMarks: 11,
    instruction: "Read each real-life school situation and choose the best answer.",
    parts: [
      {
        id: "Q7-A",
        title: "Part A · Situations and school rules",
        instruction: "Choose the best answer for each situation.",
        items: [
          {
            id: "Q7.1", kind: "choice", prompt: "Your teacher says, “Please keep the classroom tidy.” What do you have to do?",
            options: ["Keep the classroom tidy.", "Leave your books on the floor.", "Run around the classroom."],
            answer: "Keep the classroom tidy.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 9 (classroom rules)", "Classroom behaviour: following a teacher’s request"),
            explanation: "Classroom rules are things we have to do, such as keeping the classroom tidy.",
          },
          {
            id: "Q7.2", kind: "choice", prompt: "You want to do a simple experiment with water at school. Which place should you go to?",
            options: ["the science lab", "the playground", "the canteen"], answer: "the science lab", marks: 1,
            ref: ref("Workbook Exercise 1 (science lab = a room for science experiments)", "School places and their uses"),
            explanation: "A science lab is a room for science experiments.",
          },
          {
            id: "Q7.3", kind: "choice", prompt: "Which sentence states a school rule from this lesson?",
            options: ["We have to walk in the corridor.", "We can run in the corridor.", "We have to bring a computer to class."],
            answer: "We have to walk in the corridor.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 (Don’t run in the corridor; you have to walk)", "School rules: corridor behaviour"),
            explanation: "The lesson rule is: Don’t run in the corridor; you have to walk.",
          },
        ],
      },
      {
        id: "Q7-B",
        title: "Part B · Match each situation to a school place",
        instruction: "Choose the place that matches each situation.",
        items: [
          {
            id: "Q7.4", kind: "select", prompt: "You want to borrow a storybook.",
            options: ["library", "computer lab", "playground", "canteen"], answer: "library", marks: 1,
            ref: ref("Workbook Exercise 1 (library = a place where people read or borrow books)", "School places and their uses"),
            explanation: "You borrow books from the library.",
          },
          {
            id: "Q7.5", kind: "select", prompt: "You need a computer for your project.",
            options: ["library", "computer lab", "playground", "canteen"], answer: "computer lab", marks: 1,
            ref: ref("Workbook Exercise 1 (computer lab = a room with computers)", "School places and their uses"),
            explanation: "A computer lab is a room with computers.",
          },
          {
            id: "Q7.6", kind: "select", prompt: "You want to play with your friends during the break.",
            options: ["library", "computer lab", "playground", "canteen"], answer: "playground", marks: 1,
            ref: ref("Workbook Exercise 1 (playground = an outdoor place for pupils to play)", "School places and their uses"),
            explanation: "A playground is an outdoor place for pupils to play.",
          },
          {
            id: "Q7.7", kind: "select", prompt: "You want to buy or eat food at school.",
            options: ["library", "computer lab", "playground", "canteen"], answer: "canteen", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 6 (there is a canteen); Vocabulary list", "School places and their uses"),
            explanation: "The canteen is the school place for food.",
          },
        ],
      },
      {
        id: "Q7-C",
        title: "Part C · Have to or don’t have to?",
        instruction: "Choose the correct phrase for each situation.",
        items: [
          {
            id: "Q7.8", kind: "select", prompt: "Your teacher gives instructions. You ___ follow them.",
            options: ["have to", "don't have to"], answer: "have to", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 9; Vocabulary list (instructions, follow)", "Obligation: have to"),
            explanation: "Following instructions is required, so use “have to”.",
          },
          {
            id: "Q7.9", kind: "select", prompt: "Your school has a canteen, so you ___ bring a packed lunch from home.",
            options: ["have to", "don't have to"], answer: "don't have to", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 6 (reading)", "Necessity: don’t have to"),
            explanation: "“Don’t have to” means it is not necessary, because the school has a canteen.",
          },
          {
            id: "Q7.10", kind: "select", prompt: "On school days, you ___ wear the school uniform.",
            options: ["have to", "don't have to"], answer: "have to", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 7 (have to); Vocabulary list (school uniform)", "Obligation: have to"),
            explanation: "The school uniform is required, so use “have to”.",
          },
          {
            id: "Q7.11", kind: "select", prompt: "Visiting the library is optional. You ___ borrow a book to go there.",
            options: ["have to", "don't have to"], answer: "don't have to", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 (don’t have to = not necessary)", "Necessity: don’t have to"),
            explanation: "“Don’t have to” means it is not necessary to borrow a book to go to the library.",
          },
        ],
      },
    ],
  },

  // ───────────── Q8 · 12 marks · mixed skills (closed response) ─────────────
  {
    number: 8,
    title: "Mixed Skills Challenge",
    focus: "Vocabulary, places, grammar and classification",
    targetMarks: 12,
    instruction: "Use what you have learned. Every answer is chosen from the options.",
    parts: [
      {
        id: "Q8-A",
        title: "Part A · Sentence completion (word bank)",
        instruction: `Word bank: ${BANK.join(" · ")}. Use each word once.`,
        items: [
          {
            id: "Q8.1", kind: "select", prompt: "Please ___ carefully to your teacher.", options: BANK, answer: "listen", marks: 1,
            ref: ref("Vocabulary list (listen, follow, instructions, arrive on time)", "Sentence completion with a word bank"),
            explanation: "“Listen” means to pay attention to sounds, such as a teacher’s voice.",
          },
          {
            id: "Q8.2", kind: "select", prompt: "We have to ___ the school rules.", options: BANK, answer: "follow", marks: 1,
            ref: ref("Vocabulary list (follow); Pupil’s Book Exercise 4", "Sentence completion with a word bank"),
            explanation: "“Follow” means to do what the rules or instructions say.",
          },
          {
            id: "Q8.3", kind: "select", prompt: "Read the ___ before you start the activity.", options: BANK, answer: "instructions", marks: 1,
            ref: ref("Vocabulary list (instructions); Pupil’s Book Exercise 8", "Sentence completion with a word bank"),
            explanation: "“Instructions” tell you how to do an activity.",
          },
          {
            id: "Q8.4", kind: "select", prompt: "Please ___ for the first lesson.", options: BANK, answer: "arrive on time", marks: 1,
            ref: ref("Vocabulary list (arrive on time); Pupil’s Book Exercise 4", "Sentence completion with a word bank"),
            explanation: "“Arrive on time” means to come at the right time, before the lesson starts.",
          },
        ],
      },
      {
        id: "Q8-B",
        title: "Part B · Match each place to its meaning",
        instruction: "Choose the meaning that matches each school place.",
        items: [
          {
            id: "Q8.5", kind: "select", prompt: "science lab",
            options: ["a room for science experiments", "a room with computers", "a place where people read or borrow books", "a room with toilets and sinks"],
            answer: "a room for science experiments", marks: 1,
            ref: ref("Workbook Exercise 1 (word meanings)", "Matching school places with purposes"),
            explanation: "science lab = a room for science experiments.",
          },
          {
            id: "Q8.6", kind: "select", prompt: "computer lab",
            options: ["a room for science experiments", "a room with computers", "a place where people read or borrow books", "a room with toilets and sinks"],
            answer: "a room with computers", marks: 1,
            ref: ref("Workbook Exercise 1 (word meanings)", "Matching school places with purposes"),
            explanation: "computer lab = a room with computers.",
          },
          {
            id: "Q8.7", kind: "select", prompt: "library",
            options: ["a room for science experiments", "a room with computers", "a place where people read or borrow books", "a room with toilets and sinks"],
            answer: "a place where people read or borrow books", marks: 1,
            ref: ref("Workbook Exercise 1 (word meanings)", "Matching school places with purposes"),
            explanation: "library = a place where people read or borrow books.",
          },
        ],
      },
      {
        id: "Q8-C",
        title: "Part C · Choose the correct sentence",
        instruction: "Choose the sentence with correct grammar.",
        items: [
          {
            id: "Q8.8", kind: "choice", prompt: "Which sentence is correct?",
            options: ["We doesn't have to wear a coat in the classroom.", "We don't have to wear a coat in the classroom.", "We don't has to wear a coat in the classroom."],
            answer: "We don't have to wear a coat in the classroom.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 4 and Exercise 7; Workbook Exercises 7–8", "Grammar: don’t have to with we"),
            explanation: "With “we”, use don’t have to. “Doesn't” is used with he, she or it.",
          },
          {
            id: "Q8.9", kind: "choice", prompt: "Which sentence is correct?",
            options: ["Nour has to listens to the teacher.", "Nour has to listen to the teacher.", "Nour have to listen to the teacher."],
            answer: "Nour has to listen to the teacher.", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 7 and Exercise 8; Workbook Exercise 6a", "Grammar: has to + base verb"),
            explanation: "After “has to”, use the base verb: listen (not listens).",
          },
          {
            id: "Q8.10", kind: "choice", prompt: "Which question is correct?",
            options: ["Does you have to follow instructions?", "Do you have to follow instructions?", "Do you has to follow instructions?"],
            answer: "Do you have to follow instructions?", marks: 1,
            ref: ref("Pupil’s Book pp.3–5, Exercise 8 (Do you have to follow instructions?)", "Grammar: questions with Do + have to"),
            explanation: "With “you”, the question starts with “Do”: Do you have to…?",
          },
        ],
      },
      {
        id: "Q8-D",
        title: "Part D · Classify the school place",
        instruction: "Choose the group that each place belongs to.",
        items: [
          {
            id: "Q8.11", kind: "select", prompt: "classroom belongs to the group:",
            options: ["a room", "an outdoor place"], answer: "a room", marks: 1,
            ref: ref("Workbook Exercise 1 (classroom = a room where a class is taught)", "Classifying school places"),
            explanation: "A classroom is a room where a class is taught.",
          },
          {
            id: "Q8.12", kind: "select", prompt: "playground belongs to the group:",
            options: ["a room", "an outdoor place"], answer: "an outdoor place", marks: 1,
            ref: ref("Workbook Exercise 1 (playground = an outdoor place for pupils to play)", "Classifying school places"),
            explanation: "A playground is an outdoor place for pupils to play.",
          },
        ],
      },
    ],
  },
];

/** Every item in exam order, with its question number and part title. */
export function flattenItems(): { item: ExamItem; questionNumber: number; partTitle: string; label: string }[] {
  const out: { item: ExamItem; questionNumber: number; partTitle: string; label: string }[] = [];
  for (const q of QUESTIONS) {
    let n = 0;
    for (const p of q.parts) {
      for (const item of p.items) {
        n += 1;
        out.push({ item, questionNumber: q.number, partTitle: p.title, label: `${q.number}.${n}` });
      }
    }
  }
  return out;
}

export const ALL_ITEMS = flattenItems();
export const TOTAL_ITEM_COUNT = ALL_ITEMS.length;

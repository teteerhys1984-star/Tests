/* ------------------------------------------------------------------ */
/*  The Garden of Knowledge — Grade 3 · Unit 1 · Lessons 1–5           */
/*  Complete examination dataset: 35 main questions · 100 marks        */
/*  Q1–Q13  Vocabulary (13): Arabic curriculum word → write the        */
/*  English meaning (as required by the assessment brief).             */
/*  Q14–Q35 Grammar / Reading / Phonics / Language Use / Writing (22)  */
/*  Curriculum references are INTERNAL (teacher key + report only).    */
/* ------------------------------------------------------------------ */

import type { Question } from "../types";

export const EXAM_META = {
  brand: "The Garden of Knowledge",
  title: "Grade 3 English Examination",
  scope: "Unit 1 · Lessons 1–5",
  grade: "Grade 3",
  totalMarks: 100,
  totalQuestions: 35,
  vocabularyQuestions: 13,
};

export const LESSON_TITLES: Record<number, string> = {
  1: "Back to School",
  2: "School Subjects",
  3: "My Lovely School",
  4: "My Five Senses",
  5: "Revision 1",
};

const ref = (
  lesson: 1 | 2 | 3 | 4 | 5,
  source: string,
  skill: string
) => ({ lesson, lessonTitle: LESSON_TITLES[lesson], source, skill });

/* ------------------------------------------------------------------ */
/*  VOCABULARY — Questions 1–13                                        */
/*  Each item shows a verified Arabic word FROM THE CURRICULUM and     */
/*  asks the pupil to write its English meaning.                       */
/*  Lesson spread: L1 ×2 · L2 ×3 · L3 ×3 · L4 ×3 · L5 ×2  (28 marks)   */
/* ------------------------------------------------------------------ */

export const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Vocabulary",
    lesson: 1,
    instruction: "Look at the Arabic word and write its meaning in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "عائلة",
        marks: 2,
        accepted: ["family", "the family", "my family"],
        placeholder: "Type the English word",
        explanation: "'عائلة' means family — your mother, father, brothers and sisters.",
      },
    ],
    reference: ref(1, "Lesson 1 Vocabulary page · key word ‘عائلة’ = family", "Arabic → English word meaning"),
  },
  {
    id: 2,
    category: "Vocabulary",
    lesson: 1,
    instruction: "Look at the Arabic word and write its meaning in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "أخت",
        marks: 2,
        accepted: ["sister"],
        placeholder: "Type the English word",
        explanation: "'أخت' means sister. A male sibling is a brother (أخ).",
      },
    ],
    reference: ref(1, "Lesson 1 Vocabulary page · key word ‘أخت’ = sister", "Arabic → English word meaning"),
  },
  {
    id: 3,
    category: "Vocabulary",
    lesson: 2,
    instruction: "This is a school subject in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "الرياضيات",
        marks: 2,
        accepted: ["maths", "math", "mathematics"],
        placeholder: "Type the English subject",
        explanation: "'الرياضيات' means Maths — the lesson with numbers and counting.",
      },
    ],
    reference: ref(2, "Vocabulary table 1 · ‘الرياضيات’ = Maths · Pupil's Book pp. 6–7; Workbook p. 8", "School subjects: Arabic → English"),
  },
  {
    id: 4,
    category: "Vocabulary",
    lesson: 2,
    instruction: "Write each Arabic number in English words.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "meaning of",
        arabic: "ثلاثة وعشرون",
        marks: 1,
        accepted: ["twenty-three", "twenty three", "23"],
        placeholder: "in English",
        explanation: "'ثلاثة وعشرون' means twenty-three (23).",
      },
      {
        id: "b",
        kind: "text",
        text: "meaning of",
        arabic: "سبعة وعشرون",
        marks: 1,
        accepted: ["twenty-seven", "twenty seven", "27"],
        placeholder: "in English",
        explanation: "'سبعة وعشرون' means twenty-seven (27).",
      },
      {
        id: "c",
        kind: "text",
        text: "meaning of",
        arabic: "ثلاثون",
        marks: 1,
        accepted: ["thirty", "30"],
        placeholder: "in English words",
        explanation: "'ثلاثون' means thirty (30) — it comes after twenty-nine.",
      },
    ],
    reference: ref(2, "Vocabulary table 3 · numbers 21–30 · Pupil's Book p. 8; Workbook p. 7", "Numbers 21–30: Arabic → English"),
  },
  {
    id: 5,
    category: "Vocabulary",
    lesson: 2,
    instruction: "This is a school day in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "الأربعاء",
        marks: 2,
        accepted: ["wednesday"],
        placeholder: "Type the English day",
        explanation:
          "'الأربعاء' means Wednesday. Spell it W-E-D-N-E-S-D-A-Y — the first 'd' is quiet!",
      },
    ],
    reference: ref(2, "Vocabulary table 2 · ‘الأربعاء’ = Wednesday · Pupil's Book p. 7", "Days of the week: Arabic → English"),
  },
  {
    id: 6,
    category: "Vocabulary",
    lesson: 3,
    instruction: "This is a school place in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "مكتبة",
        marks: 2,
        accepted: ["library", "the library"],
        placeholder: "Type the English word",
        explanation: "'مكتبة' means library — the quiet place full of books where we read.",
      },
    ],
    reference: ref(3, "Vocabulary table 1 · ‘مكتبة’ = library · Pupil's Book p. 9; Workbook p. 9", "School places: Arabic → English"),
  },
  {
    id: 7,
    category: "Vocabulary",
    lesson: 3,
    instruction: "This is a school place in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "ساحة اللعب",
        marks: 2,
        accepted: ["playground", "the playground"],
        placeholder: "Type the English word",
        explanation: "'ساحة اللعب' means playground — the open place where we play with our friends.",
      },
    ],
    reference: ref(3, "Vocabulary table 1 · ‘ساحة اللعب’ = playground · Pupil's Book p. 9; Workbook p. 11", "School places: Arabic → English"),
  },
  {
    id: 8,
    category: "Vocabulary",
    lesson: 3,
    instruction: "This is a school place in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "صالة رياضية",
        marks: 2,
        accepted: ["gym", "the gym"],
        placeholder: "Type the English word",
        explanation: "'صالة رياضية' means gym — the place where we do Sports at school.",
      },
    ],
    reference: ref(3, "Vocabulary table 1 · ‘صالة رياضية’ = gym · Pupil's Book pp. 9–10; Workbook p. 10", "School places: Arabic → English"),
  },
  {
    id: 9,
    category: "Vocabulary",
    lesson: 4,
    instruction: "This is a sense word in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "يشمّ",
        marks: 2,
        accepted: ["smell", "to smell", "smells"],
        placeholder: "Type the English word",
        explanation: "'يشمّ' means smell — we smell nice flowers with our nose.",
      },
    ],
    reference: ref(4, "Vocabulary table 2 · ‘يشمّ’ = smell · Pupil's Book pp. 12–14; Workbook pp. 12–14", "The five senses: Arabic → English"),
  },
  {
    id: 10,
    category: "Vocabulary",
    lesson: 4,
    instruction: "Write this Arabic number in English words.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "أربعون",
        marks: 2,
        accepted: ["forty", "40"],
        placeholder: "Type the English number",
        explanation:
          "'أربعون' means forty (40). Careful: it is spelled F-O-R-T-Y — the 'u' flies away!",
      },
    ],
    reference: ref(4, "Vocabulary table 3 · ‘أربعون’ = forty · Pupil's Book p. 13", "Numbers 10–50: Arabic → English"),
  },
  {
    id: 11,
    category: "Vocabulary",
    lesson: 4,
    instruction: "Look at the Arabic word and write its meaning in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "فراشة",
        marks: 2,
        accepted: ["butterfly", "a butterfly"],
        placeholder: "Type the English word",
        explanation: "'فراشة' means butterfly — a colourful insect we can see among the flowers.",
      },
    ],
    reference: ref(4, "Vocabulary table 5 · ‘فراشة’ = butterfly · Pupil's Book p. 12", "Lesson words: Arabic → English"),
  },
  {
    id: 12,
    category: "Vocabulary",
    lesson: 5,
    instruction: "Write the English word for each body part.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "meaning of",
        arabic: "عين",
        marks: 1,
        accepted: ["eye", "eyes"],
        placeholder: "in English",
        explanation: "'عين' means eye — we see with our eyes.",
      },
      {
        id: "b",
        kind: "text",
        text: "meaning of",
        arabic: "أذن",
        marks: 1,
        accepted: ["ear", "ears"],
        placeholder: "in English",
        explanation: "'أذن' means ear — we hear with our ears.",
      },
      {
        id: "c",
        kind: "text",
        text: "meaning of",
        arabic: "يد",
        marks: 1,
        accepted: ["hand", "hands"],
        placeholder: "in English",
        explanation: "'يد' means hand — we touch with our hands.",
      },
    ],
    reference: ref(5, "Revision 1 · Workbook p. 15 body-part revision (عين، أذن) · Lesson 4 Pupil's Book p. 13 (يد)", "Revision: body parts Arabic → English"),
  },
  {
    id: 13,
    category: "Vocabulary",
    lesson: 5,
    instruction: "This is a word about home in Arabic. Write it in English.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the English meaning of:",
        arabic: "شقة",
        marks: 2,
        accepted: ["flat", "a flat"],
        placeholder: "Type the English word",
        explanation: "'شقة' means flat — a home in a building. 'I live with my parents in a flat.'",
      },
    ],
    reference: ref(5, "Revision 1 · Workbook p. 15 · ‘شقة’ = flat; Lesson 1 Vocabulary page", "Revision: home word Arabic → English"),
  },

  /* ---------------------------------------------------------------- */
  /*  GRAMMAR / READING / PHONICS / LANGUAGE USE / WRITING             */
  /*  Questions 14–35  (72 marks) — all in English                     */
  /* ---------------------------------------------------------------- */

  {
    id: 14,
    category: "Grammar",
    lesson: 1,
    instruction: "Choose have got or has got — pick the correct word.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "My friend Sara ____ got a new ball.",
        marks: 2,
        options: [
          { id: "has", label: "has" },
          { id: "have", label: "have" },
          { id: "is", label: "is" },
        ],
        correctOptionId: "has",
        explanation:
          "Use 'has got' with he, she, it — and with one name like Sara. Use 'have got' with I, you, we and they.",
      },
    ],
    reference: ref(1, "Pupil's Book Activity 2 · ‘He has got a ball.’", "have got / has got"),
  },
  {
    id: 15,
    category: "Grammar",
    lesson: 1,
    instruction: "Complete each sentence with have or has.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "a) They ____ got a big house.",
        marks: 2,
        accepted: ["have"],
        placeholder: "have or has?",
        explanation: "Use 'have got' with they: 'They have got a big house.'",
      },
      {
        id: "b",
        kind: "text",
        text: "b) He ____ got a red ball.",
        marks: 2,
        accepted: ["has"],
        placeholder: "have or has?",
        explanation: "Use 'has got' with he: 'He has got a red ball.'",
      },
    ],
    reference: ref(1, "Pupil's Book Activity 2 · ‘We have got a big house.’, ‘He has got a ball.’", "have got / has got"),
  },
  {
    id: 16,
    category: "Grammar",
    lesson: 1,
    instruction: "Put the words in the correct order to make a sentence. Tap the flowers one by one.",
    parts: [
      {
        id: "a",
        kind: "order",
        text: "Make the sentence:",
        marks: 3,
        tokens: [
          { id: "t1", text: "with" },
          { id: "t2", text: "family." },
          { id: "t3", text: "I" },
          { id: "t4", text: "live" },
          { id: "t5", text: "my" },
        ],
        acceptedOrders: ["I live with my family."],
        explanation:
          "A sentence starts with the person: 'I live with my family.' The word 'I' always has a capital letter.",
      },
    ],
    reference: ref(1, "Pupil's Book Activity 4 · ‘I live with my family.’", "Sentence word order"),
  },
  {
    id: 17,
    category: "Grammar",
    lesson: 2,
    instruction: "Choose the correct word to make a question.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "— ____ we got Maths today? — Yes, we have.",
        marks: 2,
        options: [
          { id: "have", label: "Have" },
          { id: "has", label: "Has" },
          { id: "are", label: "Are" },
        ],
        correctOptionId: "have",
        explanation:
          "We ask 'Have we got Maths today?' and answer 'Yes, we have.' The question and the answer use the same word: have.",
      },
    ],
    reference: ref(2, "Pupil's Book pp. 6–7 · ‘Have we got Arabic today?’ dialogue", "Questions with have got"),
  },
  {
    id: 18,
    category: "Grammar",
    lesson: 2,
    instruction: "Read the little dialogue. Then choose True or False.",
    stimulusTitle: "At school",
    stimulus: "— Have we got Arabic today?\n— No, we haven't. We've got Social Studies.",
    parts: [
      {
        id: "a",
        kind: "tf",
        text: "a) We have got Arabic today.",
        marks: 2,
        correctBool: false,
        explanation:
          "False — the answer says 'No, we haven't', so Arabic is not on the timetable today.",
      },
      {
        id: "b",
        kind: "tf",
        text: "b) We have got Social Studies today.",
        marks: 2,
        correctBool: true,
        explanation: "True — the dialogue says 'We've got Social Studies.'",
      },
    ],
    reference: ref(2, "Pupil's Book pp. 6–7 · ‘No, we haven't. We've got Social Studies.’", "Understanding have got / haven't"),
  },
  {
    id: 19,
    category: "Grammar",
    lesson: 3,
    instruction: "Choose the correct word: is or are.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "There ____ twenty classrooms in my school.",
        marks: 2,
        options: [
          { id: "are", label: "are" },
          { id: "is", label: "is" },
          { id: "has", label: "has" },
        ],
        correctOptionId: "are",
        explanation:
          "Use 'there are' for more than one thing. Twenty classrooms is a lot — so we say 'there are'.",
      },
    ],
    reference: ref(3, "Pupil's Book p. 9 · ‘There are twenty classrooms and a playground.’", "there is / there are"),
  },
  {
    id: 20,
    category: "Grammar",
    lesson: 3,
    instruction: "Complete each question with Is or Are.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "a) ____ there a laboratory? — Yes, there is.",
        marks: 2,
        accepted: ["Is", "is"],
        placeholder: "Is or Are?",
        explanation: "One laboratory is one thing, so we ask 'Is there a laboratory?'",
      },
      {
        id: "b",
        kind: "text",
        text: "b) ____ there two playgrounds? — Yes, there are.",
        marks: 2,
        accepted: ["Are", "are"],
        placeholder: "Is or Are?",
        explanation: "Two playgrounds is more than one, so we ask 'Are there two playgrounds?'",
      },
    ],
    reference: ref(3, "Pupil's Book pp. 9–10 · ‘Is there a laboratory?’", "Questions with there is / there are"),
  },
  {
    id: 21,
    category: "Grammar",
    lesson: 3,
    instruction: "Choose the correct little word.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "a) The art room is ____ the classroom and the gym.",
        marks: 2,
        options: [
          { id: "between", label: "between" },
          { id: "downstairs", label: "downstairs" },
          { id: "upstairs", label: "upstairs" },
        ],
        correctOptionId: "between",
        explanation:
          "'Between' means in the middle of two things: the classroom is on one side and the gym is on the other.",
      },
      {
        id: "b",
        kind: "mcq",
        text: "b) The library is on the right ____ the laboratory.",
        marks: 2,
        options: [
          { id: "of", label: "of" },
          { id: "on", label: "on" },
          { id: "in", label: "in" },
        ],
        correctOptionId: "of",
        explanation: "The phrase is 'on the right of' — it tells where something is.",
      },
    ],
    reference: ref(3, "Pupil's Book pp. 9–10 · ‘between’, ‘on the right of’; Workbook p. 10", "Prepositions of place"),
  },
  {
    id: 22,
    category: "Grammar",
    lesson: 4,
    instruction: "Read the sentence, then complete the answers with can or can't.",
    stimulusTitle: "In the garden",
    stimulus: "A little bird is singing in a tall tree. You cannot see it, but it is very loud!",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "a) Can you hear the bird? — Yes, I ____.",
        marks: 2,
        accepted: ["can"],
        placeholder: "can or can't?",
        explanation: "A loud, singing bird is easy to hear: 'Yes, I can.'",
      },
      {
        id: "b",
        kind: "text",
        text: "b) Can you see the bird? — No, I ____.",
        marks: 2,
        accepted: ["can't", "cant", "cannot"],
        placeholder: "can or can't?",
        explanation:
          "The text says you cannot see the bird: 'No, I can't.' — can't is the short form of cannot.",
      },
    ],
    reference: ref(4, "Pupil's Book pp. 13–14 · ‘Yes, I can. But I can't see them.’", "Answering with can / can't"),
  },
  {
    id: 23,
    category: "Reading Comprehension",
    lesson: 5,
    instruction: "Read the text carefully, then answer the four questions.",
    stimulusTitle: "Lina's Lovely School",
    stimulus:
      "Hello! My name is Lina. I am eight years old. I live with my parents and my two brothers in a big house.\n\nMy school is very lovely. It has got twenty classrooms, a library and a playground. The library is upstairs. It is on the right of the gym.\n\nMy favourite lesson is English. I have got English on Sunday and Tuesday. I play with my friends in the playground. I can see colourful flowers, and I can hear the birds. I love my school!",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "a) How many brothers has Lina got?",
        marks: 2,
        options: [
          { id: "two", label: "Two brothers" },
          { id: "three", label: "Three brothers" },
          { id: "twenty", label: "Twenty brothers" },
        ],
        correctOptionId: "two",
        explanation: "The text says: 'my two brothers'. Twenty is the number of classrooms!",
      },
      {
        id: "b",
        kind: "mcq",
        text: "b) Where is the library?",
        marks: 2,
        options: [
          { id: "upstairs", label: "It is upstairs." },
          { id: "downstairs", label: "It is downstairs." },
          { id: "playground", label: "It is in the playground." },
        ],
        correctOptionId: "upstairs",
        explanation: "The text says: 'The library is upstairs.'",
      },
      {
        id: "c",
        kind: "tf",
        text: "c) Lina has got English on Monday.",
        marks: 2,
        correctBool: false,
        explanation:
          "False — Lina has got English on Sunday and Tuesday, not on Monday. Read the days carefully!",
      },
      {
        id: "d",
        kind: "text",
        text: "d) What can Lina hear at school?",
        marks: 3,
        accepted: [
          "the birds",
          "birds",
          "she can hear the birds",
          "lina can hear the birds",
          "she can hear birds",
          "lina can hear birds",
          "bird",
          "the bird",
        ],
        placeholder: "Write your answer",
        explanation: "The text says: 'I can hear the birds.' So Lina can hear the birds.",
      },
    ],
    reference: ref(5, "Revision 1 integration · Lessons 1–4 language (family, school places, subjects, days, senses)", "Reading for detail"),
  },
  {
    id: 24,
    category: "Phonics",
    lesson: 2,
    instruction: "Choose the word with the same two letters 'ou' as in house.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "house → ____",
        marks: 2,
        options: [
          { id: "mouse", label: "mouse" },
          { id: "goat", label: "goat" },
          { id: "meat", label: "meat" },
          { id: "broom", label: "broom" },
        ],
        correctOptionId: "mouse",
        explanation:
          "House and mouse both have the letters 'ou' — and they rhyme! Goat has 'oa', meat has 'ea' and broom has 'oo'.",
      },
    ],
    reference: ref(2, "Pupil's Book p. 8 · the ‘ou’ sound in house and mouse; Revision 1 sounds", "Phonics: ou"),
  },
  {
    id: 25,
    category: "Phonics",
    lesson: 3,
    instruction: "Choose the word with the same two letters.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "a) eat → ____  (the letters 'ea')",
        marks: 2,
        options: [
          { id: "meat", label: "meat" },
          { id: "mouse", label: "mouse" },
          { id: "coat", label: "coat" },
          { id: "broom", label: "broom" },
        ],
        correctOptionId: "meat",
        explanation: "Eat and meat both have the letters 'ea'. They make the same long sound.",
      },
      {
        id: "b",
        kind: "mcq",
        text: "b) goat → ____  (the letters 'oa')",
        marks: 2,
        options: [
          { id: "coat", label: "coat" },
          { id: "house", label: "house" },
          { id: "zoo", label: "zoo" },
          { id: "tree", label: "tree" },
        ],
        correctOptionId: "coat",
        explanation: "Goat and coat both have the letters 'oa' in the middle.",
      },
    ],
    reference: ref(3, "Pupil's Book p. 11 · ‘ea’ in meat and eat; Lesson 4 Pupil's Book p. 14 · ‘oa’ in coat and goat", "Phonics: ea and oa"),
  },
  {
    id: 26,
    category: "Language Use",
    lesson: 3,
    instruction: "Choose the polite answer.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "— Can you help me, please? — ____",
        marks: 2,
        options: [
          { id: "ofcourse", label: "Of course." },
          { id: "yesiam", label: "Yes, I am." },
          { id: "nohavent", label: "No, I haven't." },
        ],
        correctOptionId: "ofcourse",
        explanation:
          "'Of course' is a kind, polite way to say yes when a friend asks for help.",
      },
    ],
    reference: ref(3, "Workbook p. 11 · polite language: please, of course, thank you", "Polite expressions"),
  },
  {
    id: 27,
    category: "Grammar",
    lesson: 1,
    instruction: "One sentence is correct. Find it!",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "Which sentence is correct?",
        marks: 3,
        options: [
          { id: "correct", label: "They have got a ball." },
          { id: "wrong1", label: "They has got a ball." },
          { id: "wrong2", label: "They is got a ball." },
        ],
        correctOptionId: "correct",
        explanation:
          "They is more than one person, so we use 'have got': 'They have got a ball.' Remember: he/she/it → has got.",
      },
    ],
    reference: ref(1, "Pupil's Book Activity 2 · have got / has got", "Error recognition: have got"),
  },
  {
    id: 28,
    category: "Grammar",
    lesson: 1,
    instruction: "This sentence has one mistake. Write the correct sentence.",
    stimulusTitle: "Mistake:",
    stimulus: "She have got two sisters.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "Write the correct sentence:",
        marks: 3,
        accepted: [
          "She has got two sisters",
          "She has got two sisters.",
          "She's got two sisters",
          "She's got two sisters.",
          "She has got 2 sisters",
          "She's got 2 sisters",
        ],
        placeholder: "Type the full correct sentence",
        explanation:
          "She needs 'has got', not 'have got': 'She has got two sisters.' (or She's got two sisters).",
      },
    ],
    reference: ref(1, "Pupil's Book Activity 2 · has got with she; Revision 1 ‘She's got two brothers.’", "Error correction: has got"),
  },
  {
    id: 29,
    category: "Writing",
    lesson: 3,
    instruction: "Write about your school.",
    parts: [
      {
        id: "a",
        kind: "writing",
        text: "Write ONE sentence about your school. Use There is or There are.\nHelpful words: library · gym · playground · classrooms · laboratory · cafeteria",
        marks: 4,
        teacherReview: true,
        rubric: [
          "Correctly uses There is (one thing) or There are (more than one) — 1 mark",
          "Uses a real school place word (library, gym, playground, classroom(s), laboratory, cafeteria) — 1 mark",
          "Begins the sentence with a capital letter — 1 mark",
          "Ends the sentence with a full stop — 1 mark",
        ],
        placeholder: "e.g. There is a library in my school.",
        explanation:
          "This answer is checked by your teacher with a friendly rubric: correct There is / There are, a school word, a capital letter and a full stop.",
      },
    ],
    reference: ref(3, "Pupil's Book pp. 9–10 · there is / there are with school places", "Guided writing with there is / there are"),
  },
  {
    id: 30,
    category: "Language Use",
    lesson: 2,
    instruction: "Count with me and choose the next number word.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "twenty-four · twenty-five · ____",
        marks: 2,
        options: [
          { id: "twentysix", label: "twenty-six" },
          { id: "twentytwo", label: "twenty-two" },
          { id: "twentyeight", label: "twenty-eight" },
          { id: "thirty", label: "thirty" },
        ],
        correctOptionId: "twentysix",
        explanation: "After twenty-five comes twenty-six (26) — just add one more.",
      },
    ],
    reference: ref(2, "Pupil's Book p. 8 · Workbook p. 7 · numbers 21–30", "Number sequence 21–30"),
  },
  {
    id: 31,
    category: "Language Use",
    lesson: 4,
    instruction: "One sentence is correct. Find it!",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "Which sentence is correct?",
        marks: 2,
        options: [
          { id: "correct", label: "I can hear with my ears." },
          { id: "wrong1", label: "I can hear with my nose." },
          { id: "wrong2", label: "I can hear with my mouth." },
        ],
        correctOptionId: "correct",
        explanation:
          "Hearing is the sense of the ears! We smell with the nose and taste with the mouth.",
      },
    ],
    reference: ref(4, "Pupil's Book pp. 12–13 · ‘I can hear with my ears.’", "Sense + body part sentences"),
  },
  {
    id: 32,
    category: "Grammar",
    lesson: 5,
    instruction: "Choose the correct word.",
    parts: [
      {
        id: "a",
        kind: "mcq",
        text: "The classrooms ____ downstairs.",
        marks: 2,
        options: [
          { id: "are", label: "are" },
          { id: "is", label: "is" },
          { id: "has", label: "has" },
        ],
        correctOptionId: "are",
        explanation:
          "Classrooms is a plural word (more than one), so it needs 'are': 'The classrooms are downstairs.'",
      },
    ],
    reference: ref(5, "Pupil's Book p. 15 · ‘The classrooms are downstairs.’", "is / are with plural nouns"),
  },
  {
    id: 33,
    category: "Grammar",
    lesson: 5,
    instruction: "Complete the sentence with the correct little word.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "I've got English and Maths ____ Monday.",
        marks: 2,
        accepted: ["on"],
        placeholder: "Type the missing word",
        explanation:
          "We use 'on' with days: on Sunday, on Monday. 'I've got English on Monday.'",
      },
    ],
    reference: ref(5, "Pupil's Book p. 16 · ‘We've got English and Maths on Monday.’", "Preposition on + day"),
  },
  {
    id: 34,
    category: "Language Use",
    lesson: 2,
    instruction: "Read the little dialogue. Then choose True or False.",
    stimulusTitle: "After class",
    stimulus: "— What's your favourite lesson?\n— My favourite lesson is Maths. I like numbers!",
    parts: [
      {
        id: "a",
        kind: "tf",
        text: "a) The pupil's favourite lesson is Maths.",
        marks: 2,
        correctBool: true,
        explanation: "True — the pupil says: 'My favourite lesson is Maths.'",
      },
      {
        id: "b",
        kind: "tf",
        text: "b) The pupil's favourite lesson is Science.",
        marks: 2,
        correctBool: false,
        explanation: "False — the favourite lesson is Maths, not Science.",
      },
    ],
    reference: ref(2, "Pupil's Book pp. 6–7 · ‘What's your favourite lesson?’", "Understanding a dialogue"),
  },
  {
    id: 35,
    category: "Writing",
    lesson: 5,
    instruction: "Complete the sentences about YOU. Write one word for each gap.",
    parts: [
      {
        id: "a",
        kind: "text",
        text: "a) My favourite lesson is ____.",
        marks: 2,
        accepted: [
          "Maths",
          "maths",
          "Science",
          "science",
          "Arabic",
          "arabic",
          "English",
          "english",
          "Social Studies",
          "social studies",
          "Music",
          "music",
          "Sports",
          "sports",
          "Sport",
          "sport",
          "Art",
          "art",
        ],
        placeholder: "a school subject",
        explanation:
          "Any subject from Lesson 2 is a lovely answer: Maths, Science, Arabic, English, Social Studies, Music, Sports or Art.",
      },
      {
        id: "b",
        kind: "text",
        text: "b) I can touch with my ____.",
        marks: 2,
        accepted: ["hands", "hand"],
        placeholder: "a body part",
        explanation: "We touch with our hands — like a soft cat or a smooth flower petal.",
      },
    ],
    reference: ref(5, "Revision: Lesson 2 subjects + Lesson 4 ‘I can touch with my hands.’", "Guided sentence completion"),
  },
];

/* ------------------------------------------------------------------ */
/*  Integrity helpers                                                  */
/* ------------------------------------------------------------------ */

export const questionMarks = (q: Question): number =>
  q.parts.reduce((s, p) => s + p.marks, 0);

export const TOTAL_MARKS = QUESTIONS.reduce((s, q) => s + questionMarks(q), 0);
export const VOCAB_COUNT = QUESTIONS.filter((q) => q.category === "Vocabulary").length;

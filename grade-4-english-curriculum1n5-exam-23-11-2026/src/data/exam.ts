import type { ExamQuestion } from '../types';

/**
 * English Exam — Grade 4
 * Unit 1 · Lessons 1–6, based strictly on the source curriculum:
 *   Lesson 1 — Nice to Meet You  (Pupil's Book pp. 3–5, Workbook pp. 5–7)
 *   Lesson 2 — My Family         (Pupil's Book pp. 6–8, Workbook pp. 8–10)
 *   Lesson 3 — Daily Routine     (Pupil's Book pp. 9–11, Workbook pp. 11–13)
 *   Lesson 4 — My House          (Pupil's Book pp. 12–14, Workbook pp. 14–16)
 *   Lesson 5 — School Subjects   (Pupil's Book pp. 15–20)
 *   Lesson 6 — Where I Live      (Pupil's Book pp. 21–23)
 *
 * The only Arabic strings anywhere in the student experience are the 15
 * vocabulary prompts in Questions 1–3, taken verbatim from the lessons'
 * Vocabulary sections. Every other string is English.
 *
 * Marks add up to exactly 100 (see integrity test in src/data/exam.test.ts).
 */

export const EXAM_TITLE = 'English Exam — Grade 4';
export const EXAM_SUBTITLE = 'Unit 1 · Lessons 1–6';
export const TOTAL_MARKS = 100;

export const QUESTIONS: ExamQuestion[] = [
  /* ---------------------------------------------------------- Q1 · Vocab A */
  {
    id: 1,
    kind: 'vocab',
    title: 'Vocabulary — Lessons 1 & 2',
    skill: 'Vocabulary · meaning recall',
    lessons: 'Lessons 1–2',
    reference: 'Grade 4 · Unit 1 · Lesson 1 — Vocabulary (Personal Information; Family & Jobs) · Lesson 2 — Vocabulary (Family members; Appearance)',
    instructions: 'Write the English meaning of each Arabic word. Write one word (or the taught phrase) for each.',
    marks: 10,
    explanation:
      'Remember the taught words: name and doctor (Lesson 1), and grandfather, blond and tall (Lesson 2). Say each word aloud and picture it: a name tag, a doctor at the hospital, a kind grandfather, blond hair, a tall person.',
    parts: [
      { id: 'q1p1', marks: 2, arabic: true, prompt: 'اسم', accepted: ['name'], displayAnswer: 'name', reference: 'Lesson 1 · Vocabulary — Personal Information (name)', placeholder: 'English word…' },
      { id: 'q1p2', marks: 2, arabic: true, prompt: 'طبيب', accepted: ['doctor'], displayAnswer: 'doctor', reference: 'Lesson 1 · Vocabulary — Family & Jobs (doctor)', placeholder: 'English word…' },
      { id: 'q1p3', marks: 2, arabic: true, prompt: 'جد', accepted: ['grandfather'], displayAnswer: 'grandfather', reference: 'Lesson 2 · Vocabulary — Family members (grandfather)', placeholder: 'English word…' },
      { id: 'q1p4', marks: 2, arabic: true, prompt: 'أشقر', accepted: ['blond', 'blonde'], displayAnswer: 'blond', reference: 'Lesson 2 · Vocabulary — Appearance (blond)', placeholder: 'English word…' },
      { id: 'q1p5', marks: 2, arabic: true, prompt: 'طويل القامة', accepted: ['tall'], displayAnswer: 'tall', reference: 'Lesson 2 · Vocabulary — Appearance (tall)', placeholder: 'English word…' },
    ],
  },

  /* ---------------------------------------------------------- Q2 · Vocab B */
  {
    id: 2,
    kind: 'vocab',
    title: 'Vocabulary — Lessons 3 & 4',
    skill: 'Vocabulary · meaning recall',
    lessons: 'Lessons 3–4',
    reference: 'Grade 4 · Unit 1 · Lesson 3 — Vocabulary (Daily routine) · Lesson 4 — Vocabulary (Rooms & furniture)',
    instructions: 'Write the English meaning of each Arabic word. Write one word or the taught phrase for each.',
    marks: 10,
    explanation:
      'Remember the taught words: breakfast, usually and get up (Lesson 3 — the daily routine), and bedroom and wardrobe (Lesson 4 — my house). Link each word to your morning routine and the furniture in your bedroom.',
    parts: [
      { id: 'q2p1', marks: 2, arabic: true, prompt: 'الفطور', accepted: ['breakfast'], displayAnswer: 'breakfast', reference: 'Lesson 3 · Vocabulary — Daily routine (breakfast)', placeholder: 'English word…' },
      { id: 'q2p2', marks: 2, arabic: true, prompt: 'عادةً', accepted: ['usually'], displayAnswer: 'usually', reference: 'Lesson 3 · Vocabulary — Daily routine (usually)', placeholder: 'English word…' },
      { id: 'q2p3', marks: 2, arabic: true, prompt: 'ينهض من الفراش', accepted: ['get up'], displayAnswer: 'get up', reference: 'Lesson 3 · Vocabulary — Daily routine (get up)', placeholder: 'English phrase…' },
      { id: 'q2p4', marks: 2, arabic: true, prompt: 'غرفة نوم', accepted: ['bedroom'], displayAnswer: 'bedroom', reference: 'Lesson 4 · Vocabulary — Rooms (bedroom)', placeholder: 'English word…' },
      { id: 'q2p5', marks: 2, arabic: true, prompt: 'خزانة ملابس', accepted: ['wardrobe'], displayAnswer: 'wardrobe', reference: 'Lesson 4 · Vocabulary — Furniture (wardrobe)', placeholder: 'English word…' },
    ],
  },

  /* ---------------------------------------------------------- Q3 · Vocab C */
  {
    id: 3,
    kind: 'vocab',
    title: 'Vocabulary — Lessons 5 & 6',
    skill: 'Vocabulary · meaning recall',
    lessons: 'Lessons 5–6',
    reference: 'Grade 4 · Unit 1 · Lesson 5 — Vocabulary (School subjects & adjectives) · Lesson 6 — Vocabulary (Places)',
    instructions: 'Write the English meaning of each Arabic word. Write one word for each.',
    marks: 10,
    explanation:
      'Remember the taught words: science and boring (Lesson 5 — school subjects), and village, river and farm (Lesson 6 — where I live). Think of a science experiment, a boring wait, a quiet village, a river and a farm with animals.',
    parts: [
      { id: 'q3p1', marks: 2, arabic: true, prompt: 'العلوم', accepted: ['science'], displayAnswer: 'science', reference: 'Lesson 5 · Vocabulary — Subjects (science)', placeholder: 'English word…' },
      { id: 'q3p2', marks: 2, arabic: true, prompt: 'مملّ', accepted: ['boring'], displayAnswer: 'boring', reference: 'Lesson 5 · Vocabulary — Adjectives (boring)', placeholder: 'English word…' },
      { id: 'q3p3', marks: 2, arabic: true, prompt: 'قرية', accepted: ['village'], displayAnswer: 'village', reference: 'Lesson 6 · Vocabulary — Places (village)', placeholder: 'English word…' },
      { id: 'q3p4', marks: 2, arabic: true, prompt: 'نهر', accepted: ['river'], displayAnswer: 'river', reference: 'Lesson 6 · Vocabulary — Places (river)', placeholder: 'English word…' },
      { id: 'q3p5', marks: 2, arabic: true, prompt: 'مزرعة', accepted: ['farm'], displayAnswer: 'farm', reference: 'Lesson 6 · Vocabulary — Places (farm)', placeholder: 'English word…' },
    ],
  },

  /* --------------------------------------- Q4 · am / is / are (Lesson 1) */
  {
    id: 4,
    kind: 'cloze',
    title: 'The verb be — am, is, are',
    skill: 'Grammar in context · forms of “be”',
    lessons: 'Lesson 1',
    reference: 'Grade 4 · Unit 1 · Lesson 1 — Let’s Learn: Forms of “be” (Pupil’s Book pp. 4–5); Ahmed’s story and Workbook practice',
    instructions: 'Fill in each space with am, is or are.',
    marks: 10,
    explanation:
      'Use am with I (I am nine years old). Use is with he, she, it and singular nouns (my father, the school). Use are with we, you, they and plural nouns (Sami and Reem, we). Full forms: I am · he/she/it is · we/you/they are.',
    parts: [
      { id: 'q4p1', marks: 2, prompt: 'Space 1', before: 'I', after: 'nine years old.', accepted: ['am'], displayAnswer: 'am', reference: 'Lesson 1 — Forms of “be”: I am (I’m ten years old)', placeholder: '…' },
      { id: 'q4p2', marks: 2, prompt: 'Space 2', before: 'My father', after: 'a doctor.', accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 1 — Forms of “be”: he/she/it is (My father is a doctor)', placeholder: '…' },
      { id: 'q4p3', marks: 2, prompt: 'Space 3', before: 'Sami and Reem', after: 'in grade four.', accepted: ['are'], displayAnswer: 'are', reference: 'Lesson 1 — Forms of “be”: we/you/they are (Sami and Reem are in grade four)', placeholder: '…' },
      { id: 'q4p4', marks: 2, prompt: 'Space 4', before: 'The school', after: 'very big.', accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 1 — Forms of “be”: it is (It’s a big school)', placeholder: '…' },
      { id: 'q4p5', marks: 2, prompt: 'Space 5', before: 'We', after: 'from Syria.', accepted: ['are'], displayAnswer: 'are', reference: 'Lesson 1 — Forms of “be”: we are (We’re from …)', placeholder: '…' },
    ],
  },

  /* ------------------------- Q5 · Matching: questions and answers (L1–L2) */
  {
    id: 5,
    kind: 'match',
    title: 'Match the question to the answer',
    skill: 'Functional language · greetings and introductions',
    lessons: 'Lessons 1–2',
    reference: 'Grade 4 · Unit 1 · Lesson 1 — greetings and introductions (Pupil’s Book pp. 3–4) · Lesson 2 — talking about people',
    instructions: 'Choose the best answer for each line. Use each answer only once.',
    marks: 5,
    explanation:
      'Greetings and introductions: “How are you?” → “I’m fine, thank you.” · “What’s your name?” → “My name is …” · “Where are you from?” → “I’m from …” · “How old are you?” → “I’m ten years old.” · “Nice to meet you.” → “Nice to meet you, too.”',
    parts: (() => {
      const options = [
        "I'm fine, thank you.",
        'My name is Sara.',
        "I'm from Jordan.",
        "I'm ten years old.",
        'Nice to meet you, too.',
      ];
      const rows: Array<[string, string]> = [
        ['How are you?', "I'm fine, thank you."],
        ["What's your name?", 'My name is Sara.'],
        ['Where are you from?', "I'm from Jordan."],
        ['How old are you?', "I'm ten years old."],
        ['Nice to meet you.', 'Nice to meet you, too.'],
      ];
      return rows.map(([prompt, answer], i) => ({
        id: `q5p${i + 1}`,
        marks: 1,
        prompt,
        options,
        accepted: [answer],
        displayAnswer: answer,
        reference: 'Lesson 1 — Greetings & introductions',
      }));
    })(),
  },

  /* --------------------------------------- Q6 · is / has got (Lesson 2) */
  {
    id: 6,
    kind: 'choice',
    title: 'Choose: is or has / have got',
    skill: 'Grammar in context · describing people (is vs has got)',
    lessons: 'Lesson 2',
    reference: 'Grade 4 · Unit 1 · Lesson 2 — Let’s Learn (Pupil’s Book p. 8): is + adjective; has got + hair/eyes; I have got / he has got',
    instructions: 'Choose the correct word or phrase to complete each sentence.',
    marks: 5,
    explanation:
      'is describes the whole person (he is tall, he is tall and thin). has got / have got describes parts of the person and family: has got for he, she, it (she has got blond hair, he has got green eyes) and have got for I, you, we, they (I have got two brothers, they have got green eyes).',
    parts: [
      { id: 'q6p1', marks: 1, prompt: 'He', before: 'He', after: 'tall.', options: ['is', 'has got'], accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 2 — is + adjective (He is tall)' },
      { id: 'q6p2', marks: 1, prompt: 'She ___ got blond hair', before: 'She', after: 'got blond hair.', options: ['is', 'has'], accepted: ['has'], displayAnswer: 'has', reference: 'Lesson 2 — she has got (She’s got blond hair)' },
      { id: 'q6p3', marks: 1, prompt: 'I ___ got two brothers', before: 'I', after: 'got two brothers.', options: ['have', 'has'], accepted: ['have'], displayAnswer: 'have', reference: 'Lesson 2 — I have got (I’ve got two children)' },
      { id: 'q6p4', marks: 1, prompt: 'They ___ got green eyes', before: 'They', after: 'got green eyes.', options: ['have', 'has'], accepted: ['have'], displayAnswer: 'have', reference: 'Lesson 2 — they have got (plural subject)' },
      { id: 'q6p5', marks: 1, prompt: 'He ___ tall and thin', before: 'He', after: 'tall and thin.', options: ['is', 'has got'], accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 2 — is + adjective (He is tall and thin)' },
    ],
  },

  /* ---------------- Q7 · he / she / it + s (Lesson 3 — Daily Routine) */
  {
    id: 7,
    kind: 'cloze',
    title: 'Daily routine — he, she and it',
    skill: 'Grammar in context · third person singular (-s / -es)',
    lessons: 'Lesson 3',
    reference: 'Grade 4 · Unit 1 · Lesson 3 — Let’s Learn (Pupil’s Book p. 11): he / she / it gets up, makes the bed; Lily’s routine (Pupil’s Book p. 9)',
    instructions: 'Write the correct form of the verb in brackets. Add -s or -es when the subject is he, she or it.',
    marks: 10,
    explanation:
      'With he, she and it, add -s or -es to the verb: wash → washes, leave → leaves, make → makes, watch → watches, go → goes. With I, you, we and they, keep the base form: I wash, they go.',
    parts: [
      { id: 'q7p1', marks: 2, prompt: 'Item 1', before: 'Lily', after: 'her face in the morning.', hint: 'wash', accepted: ['washes'], displayAnswer: 'washes', reference: 'Lesson 3 — wash → washes (She washes her face)', placeholder: '…' },
      { id: 'q7p2', marks: 2, prompt: 'Item 2', before: 'He', after: 'home at seven o’clock.', hint: 'leave', accepted: ['leaves'], displayAnswer: 'leaves', reference: 'Lesson 3 — leave → leaves (He leaves for school)', placeholder: '…' },
      { id: 'q7p3', marks: 2, prompt: 'Item 3', before: 'My mother', after: 'breakfast every day.', hint: 'make', accepted: ['makes'], displayAnswer: 'makes', reference: 'Lesson 3 — make → makes (She makes breakfast)', placeholder: '…' },
      { id: 'q7p4', marks: 2, prompt: 'Item 4', before: 'She', after: 'TV in the evening.', hint: 'watch', accepted: ['watches'], displayAnswer: 'watches', reference: 'Lesson 3 — watch → watches (He sometimes watches TV)', placeholder: '…' },
      { id: 'q7p5', marks: 2, prompt: 'Item 5', before: 'My dad', after: 'to work at quarter past eight.', hint: 'go', accepted: ['goes'], displayAnswer: 'goes', reference: 'Lesson 3 — go → goes (She always goes to work at quarter past eight)', placeholder: '…' },
    ],
  },

  /* --------------------------------------- Q8 · Tell the time (Lesson 3) */
  {
    id: 8,
    kind: 'clock',
    title: 'What time is it?',
    skill: 'Short written answers · telling the time',
    lessons: 'Lesson 3',
    reference: 'Grade 4 · Unit 1 · Lesson 3 — time language: o’clock, half past, quarter past, quarter to (Pupil’s Book pp. 10–11; Workbook pp. 11–13)',
    instructions: "Look at each clock and write the time. Example: It's half past one. (Digits such as 6:30 are also accepted.)",
    marks: 10,
    explanation:
      'Use o’clock for full hours (three o’clock). Use half past for 30 minutes (half past six). Use quarter past for 15 minutes (quarter past seven). Use quarter to for 15 minutes before the next hour (quarter to six means 5:45).',
    parts: [
      { id: 'q8p1', marks: 2, prompt: 'Clock 1', clock: { hour: 6, minute: 30 }, accepted: ['half past six', '6:30', '06:30', 'six thirty', 'six half past', '6.30', 'half past 6'], displayAnswer: 'It’s half past six.', reference: 'Lesson 3 — half past (It’s half past …)', placeholder: "It's…", partialRule: 'time-to-past-swap' },
      { id: 'q8p2', marks: 2, prompt: 'Clock 2', clock: { hour: 7, minute: 15 }, accepted: ['quarter past seven', 'a quarter past seven', '7:15', '07:15', 'seven fifteen', '7.15', 'quarter past 7'], displayAnswer: 'It’s quarter past seven.', reference: 'Lesson 3 — quarter past (It’s quarter past …)', placeholder: "It's…", partialRule: 'time-to-past-swap' },
      { id: 'q8p3', marks: 2, prompt: 'Clock 3', clock: { hour: 3, minute: 0 }, accepted: ["three o'clock", "3 o'clock", '3:00', '03:00', "three o clock", '3.00'], displayAnswer: 'It’s three o’clock.', reference: 'Lesson 3 — o’clock (It’s … o’clock)', placeholder: "It's…" },
      { id: 'q8p4', marks: 2, prompt: 'Clock 4', clock: { hour: 5, minute: 45 }, accepted: ['quarter to six', 'a quarter to six', '5:45', '17:45', 'five forty-five', 'five forty five', '5.45', 'quarter to 6'], displayAnswer: 'It’s quarter to six.', reference: 'Lesson 3 — quarter to (It’s quarter to …)', placeholder: "It's…", partialRule: 'time-to-past-swap' },
      { id: 'q8p5', marks: 2, prompt: 'Clock 5', clock: { hour: 9, minute: 0 }, accepted: ["nine o'clock", "9 o'clock", '9:00', '09:00', "nine o clock", '9.00'], displayAnswer: 'It’s nine o’clock.', reference: 'Lesson 3 — o’clock (at nine o’clock)', placeholder: "It's…" },
    ],
  },

  /* ------------------------------ Q9 · There is / There are (Lesson 4) */
  {
    id: 9,
    kind: 'mcq',
    title: 'There is / There are',
    skill: 'Multiple choice · describing my house',
    lessons: 'Lesson 4',
    reference: 'Grade 4 · Unit 1 · Lesson 4 — Let’s Learn (Pupil’s Book p. 14): There is … / There isn’t … / There are … / There aren’t …',
    instructions: "Choose is or are to complete each sentence.",
    marks: 5,
    explanation:
      'There is + one thing / singular noun (there is a sofa, there is a bathroom). There are + more than one / plural nouns (there are three bedrooms, there are two windows).',
    parts: [
      { id: 'q9p1', marks: 1, prompt: 'a sofa in the living room.', before: 'There', after: 'a sofa in the living room.', options: ['is', 'are'], accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 4 — There is a sofa in the living room' },
      { id: 'q9p2', marks: 1, prompt: 'three bedrooms in my house.', before: 'There', after: 'three bedrooms in my house.', options: ['is', 'are'], accepted: ['are'], displayAnswer: 'are', reference: 'Lesson 4 — There are three bedrooms in my house' },
      { id: 'q9p3', marks: 1, prompt: 'a bathroom upstairs.', before: 'There', after: 'a bathroom upstairs.', options: ['is', 'are'], accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 4 — There is a bathroom upstairs' },
      { id: 'q9p4', marks: 1, prompt: 'two windows in my room.', before: 'There', after: 'two windows in my room.', options: ['is', 'are'], accepted: ['are'], displayAnswer: 'are', reference: 'Lesson 4 — There are … (plural)' },
      { id: 'q9p5', marks: 1, prompt: 'a big garden.', before: 'There', after: 'a big garden.', options: ['is', 'are'], accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 4 — Is there a garden? Yes, there is.' },
    ],
  },

  /* ------------- Q10 · Sentence ordering with subject words (Lesson 5) */
  {
    id: 10,
    kind: 'order',
    title: 'School subjects — put the words in order',
    skill: 'Sentence ordering · school subjects in context',
    lessons: 'Lesson 5',
    reference: 'Grade 4 · Unit 1 · Lesson 5 — Let’s Learn (Pupil’s Book p. 17): I am good at …, … isn’t boring; My favourite subject (Pupil’s Book pp. 15–17)',
    instructions: 'Tap the word chips in the correct order to build the sentence. Tap a placed word to send it back.',
    marks: 10,
    explanation:
      'Two useful patterns from Lesson 5: “… isn’t boring” (history isn’t boring — an adjective after the subject) and “I am good at …” (I am good at art — adjective phrase after am). Read the chips and build the full sentence, starting with a capital letter.',
    parts: [
      {
        id: 'q10p1',
        marks: 5,
        prompt: 'Sentence A',
        tokens: ['isn’t', 'History', 'boring'],
        targetTokens: ['History', 'isn’t', 'boring'],
        accepted: ['history isn’t boring', "history isn't boring"],
        displayAnswer: 'History isn’t boring.',
        reference: 'Lesson 5 — … isn’t boring (Arabic isn’t boring)',
        partialRule: 'order-any-order',
      },
      {
        id: 'q10p2',
        marks: 5,
        prompt: 'Sentence B',
        tokens: ['art', 'am', 'I', 'good', 'at'],
        targetTokens: ['I', 'am', 'good', 'at', 'art'],
        accepted: ['i am good at art'],
        displayAnswer: 'I am good at art.',
        reference: 'Lesson 5 — I am good at … (I am good at maths)',
        partialRule: 'order-any-order',
      },
    ],
  },

  /* --------------------------------- Q11 · in / on / by (Lesson 6) */
  {
    id: 11,
    kind: 'cloze',
    title: 'In, on or by?',
    skill: 'Fill in the blanks · prepositions of place',
    lessons: 'Lesson 6',
    reference: 'Grade 4 · Unit 1 · Lesson 6 — Let’s Learn (Pupil’s Book p. 23): In Damascus / in a village / in a city · On a farm / on a hill · By the sea / by the river',
    instructions: 'Fill in each space with in, on or by.',
    marks: 5,
    explanation:
      'Use in for cities, towns, villages and houses (in a village, in the city). Use on for a farm and a hill (on a farm, on a hill). Use by for places near water (by the river, by the sea).',
    parts: [
      { id: 'q11p1', marks: 1, prompt: 'Space 1', before: 'I live', after: 'a village.', accepted: ['in'], displayAnswer: 'in', reference: 'Lesson 6 — in a village', placeholder: '…' },
      { id: 'q11p2', marks: 1, prompt: 'Space 2', before: 'His house is', after: 'a hill.', accepted: ['on'], displayAnswer: 'on', reference: 'Lesson 6 — on a hill', placeholder: '…' },
      { id: 'q11p3', marks: 1, prompt: 'Space 3', before: 'We walk', after: 'the river every day.', accepted: ['by'], displayAnswer: 'by', reference: 'Lesson 6 — by the river', placeholder: '…' },
      { id: 'q11p4', marks: 1, prompt: 'Space 4', before: 'She lives', after: 'the city.', accepted: ['in'], displayAnswer: 'in', reference: 'Lesson 6 — in a city', placeholder: '…' },
      { id: 'q11p5', marks: 1, prompt: 'Space 5', before: 'The house is', after: 'the sea.', accepted: ['by'], displayAnswer: 'by', reference: 'Lesson 6 — by the sea', placeholder: '…' },
    ],
  },

  /* -------------- Q12 · Spot and fix the mistake (Lessons 1, 2, 3, 4) */
  {
    id: 12,
    kind: 'fix',
    title: 'Spot and fix the mistake',
    skill: 'Identifying and correcting mistakes · grammar in context',
    lessons: 'Lessons 1–4',
    reference: 'Grade 4 · Unit 1 · Lesson 1 — forms of be; Lesson 2 — has/have got; Lesson 3 — he/she/it + s; Lesson 4 — there is/are',
    instructions: 'Each sentence has one underlined mistake. Write the correct word in the space. (Writing the full corrected sentence is also accepted.)',
    marks: 10,
    explanation:
      'Check one verb per sentence: be → am with I, is with he/she/it, are with we/you/they (she is, I am). have/has got → has with he/she/it (he has got). he/she/it + s/es (my mum washes). There + singular → is (there is a living room).',
    parts: [
      { id: 'q12p1', marks: 2, prompt: 'Item 1', before: 'She', wrongWord: 'are', after: 'my friend.', accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 1 — she is … (forms of be)', placeholder: 'correct word…' },
      { id: 'q12p2', marks: 2, prompt: 'Item 2', before: 'I', wrongWord: 'is', after: 'ten years old.', accepted: ['am'], displayAnswer: 'am', reference: 'Lesson 1 — I am … (forms of be)', placeholder: 'correct word…' },
      { id: 'q12p3', marks: 2, prompt: 'Item 3', before: 'He', wrongWord: 'have', after: 'got black hair.', accepted: ['has'], displayAnswer: 'has', reference: 'Lesson 2 — he has got (He’s got black hair)', placeholder: 'correct word…' },
      { id: 'q12p4', marks: 2, prompt: 'Item 4', before: 'My mum', wrongWord: 'wash', after: 'her face in the morning.', accepted: ['washes'], displayAnswer: 'washes', reference: 'Lesson 3 — she washes (third person + s)', placeholder: 'correct word…' },
      { id: 'q12p5', marks: 2, prompt: 'Item 5', before: 'There', wrongWord: 'are', after: 'a living room.', accepted: ['is'], displayAnswer: 'is', reference: 'Lesson 4 — there is + singular', placeholder: 'correct word…' },
    ],
  },
];

export const QUESTION_COUNT = QUESTIONS.length; // must be 12
export const MARKS_TOTAL = QUESTIONS.reduce((sum, q) => sum + q.marks, 0); // must be 100

/** Lookup of every part id → question id, used for completion checks and tests. */
export const ALL_PART_IDS = QUESTIONS.flatMap((q) => q.parts.map((p) => p.id));

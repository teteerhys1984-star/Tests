/**
 * Grade 5 · English · Unit 1 · Lessons 1–5 — EXAMINATION MODEL B
 *
 * Every question below is transcribed from the source repository
 *   https://github.com/teteerhys1984-star/E_Curriculum_1_9
 * specifically from the five `grade5-unit1-lessonN-pupil-book.html` files,
 * which reproduce the Pupil's Book pages 3–20.
 *
 * Wording of instructions, reading passages, statements and answer options is
 * kept as close to the printed page as possible. Small adaptations exist only
 * to make an exercise interactive / automatically gradable.
 *
 * NO listening (audio) activity is used: the recordings are not supplied by
 * the source, so no listening answer has been invented.
 * NO standalone vocabulary section exists.
 * NO question asks about the pupil's real family.
 */

export type LessonNumber = 1 | 2 | 3 | 4 | 5;

export type PartType = "choice" | "text" | "tf";

export interface Part {
  /** unique within the exam, e.g. "l1q5b" */
  id: string;
  type: PartType;
  /** the sentence / item the pupil answers (contains the gap where relevant) */
  prompt: string;
  /** for `choice` and `tf` */
  options?: string[];
  /** accepted correct answers, compared after normalisation */
  accept: string[];
  marks: number;
  explanation?: string;
}

export interface Question {
  id: string;
  lesson: LessonNumber;
  /** printed exercise label, e.g. "Exercise 5 · School stages" */
  exercise: string;
  /** textbook page reference, e.g. "Pupil's Book p. 5" */
  page: string;
  /** instruction printed above the task */
  instruction: string;
  /** optional printed excerpt / reading passage shown with the question */
  context?: string;
  parts: Part[];
}

export interface LessonMeta {
  n: LessonNumber;
  title: string;
  pages: string;
  color: string;
  colorDark: string;
  textOn: string;
}

export const LESSONS: LessonMeta[] = [
  { n: 1, title: "At School", pages: "3–5", color: "#FF7A1A", colorDark: "#C24E00", textOn: "#2E2438" },
  { n: 2, title: "Family", pages: "6–8", color: "#1FA8E0", colorDark: "#0D6F9C", textOn: "#FFFFFF" },
  { n: 3, title: "Daily Routines", pages: "9–11", color: "#E8288A", colorDark: "#A80F5D", textOn: "#FFFFFF" },
  { n: 4, title: "The Five Senses", pages: "12–14", color: "#7BC400", colorDark: "#4D7F00", textOn: "#2E2438" },
  { n: 5, title: "Clothes", pages: "15–20", color: "#7A3BE0", colorDark: "#4F1FA3", textOn: "#FFFFFF" },
];

const TRUE_FALSE = ["True", "False"];

/* ------------------------------------------------------------------ */
/* LESSON 1 — At School (Pupil's Book pages 3–5)                       */
/* ------------------------------------------------------------------ */

export const LESSON_1: Question[] = [
  {
    id: "l1q1",
    lesson: 1,
    exercise: "Exercise 5 · School stages",
    page: "Pupil's Book p. 5",
    instruction: "Choose the correct school stage.",
    context: "Use the chart printed in the book:\nNursery — KG 1–3\nBasic / primary — Grades 1–9\nSecondary — Grades 10–12",
    parts: [
      {
        id: "l1q1a",
        type: "choice",
        prompt: "a. Anna is 13 years old. She is in the …… school.",
        options: ["nursery", "basic / primary", "secondary"],
        accept: ["secondary"],
        marks: 2,
        explanation:
          "Exercise 5 answer printed in the book: “b. secondary”. The chart puts secondary school at Grades 10–12, so Anna (13) is in the secondary school.",
      },
    ],
  },
  {
    id: "l1q2",
    lesson: 1,
    exercise: "Exercise 6 · Reading: school in Britain and Syria",
    page: "Pupil's Book p. 5",
    instruction: "Complete the age chart from the reading.",
    context:
      "Read the comparison in your book. It explains the ages when children attend nursery, primary/basic and secondary school in Britain and Syria, and notes that special exams are needed for university.",
    parts: [
      {
        id: "l1q2a",
        type: "text",
        prompt: "In Britain, children start primary school at the age of ……",
        accept: ["5", "five"],
        marks: 2,
        explanation: "The reading gives: Britain — nursery 3, primary 5, secondary 11.",
      },
    ],
  },
  {
    id: "l1q3",
    lesson: 1,
    exercise: "Exercise 6b · True or false",
    page: "Pupil's Book p. 5",
    instruction: "Write true (T) or false (F).",
    context: "Syria — nursery 3, basic 6, secondary 15.   Britain — nursery 3, primary 5, secondary 11.",
    parts: [
      {
        id: "l1q3a",
        type: "tf",
        prompt: "2. In Syria, students go to nursery school and then to basic school.",
        options: TRUE_FALSE,
        accept: ["true"],
        marks: 2,
        explanation: "True — the reading lists Syria as nursery 3, then basic 6, then secondary 15.",
      },
    ],
  },
  {
    id: "l1q4",
    lesson: 1,
    exercise: "Exercise 7 · Circle the correct word",
    page: "Pupil's Book p. 5",
    instruction: "Circle the correct word.",
    context: "have to = obligation. don't have to = not necessary (it does not mean “must not”).",
    parts: [
      {
        id: "l1q4a",
        type: "choice",
        prompt: "3. …… you have to do your homework at school?",
        options: ["Do", "Does", "Are"],
        accept: ["Do"],
        marks: 2,
        explanation: "“you” takes Do: “Do you have to do your homework at school?”",
      },
    ],
  },
  {
    id: "l1q5",
    lesson: 1,
    exercise: "Exercise 7 · Circle the correct word",
    page: "Pupil's Book p. 5",
    instruction: "Complete the two gaps with the correct words.",
    parts: [
      {
        id: "l1q5a",
        type: "choice",
        prompt: "4a. No, we …… (not) have to do our homework at school;",
        options: ["don't", "doesn't", "aren't"],
        accept: ["don't"],
        marks: 1,
        explanation: "“we” takes don't: “No, we don't have to do our homework at school.”",
      },
      {
        id: "l1q5b",
        type: "choice",
        prompt: "4b. we …… to do it at home.",
        options: ["have", "has", "having"],
        accept: ["have"],
        marks: 1,
        explanation: "Still “we”, so the base form have: “we have to do it at home.”",
      },
    ],
  },
  {
    id: "l1q6",
    lesson: 1,
    exercise: "Exercise 7 · Circle the correct word",
    page: "Pupil's Book p. 5",
    instruction: "Complete the two gaps with the correct words.",
    parts: [
      {
        id: "l1q6a",
        type: "choice",
        prompt: "5a. …… Nadia have to wear a skirt and a jacket?",
        options: ["Does", "Do", "Is"],
        accept: ["Does"],
        marks: 1,
        explanation: "“Nadia” is one person (she), so the question takes Does.",
      },
      {
        id: "l1q6b",
        type: "choice",
        prompt: "5b. Yes, she …… .",
        options: ["has to", "have to", "doesn't have to"],
        accept: ["has to"],
        marks: 1,
        explanation: "After Do/Does the short answer uses has to: “Yes, she has to.”",
      },
    ],
  },
  {
    id: "l1q7",
    lesson: 1,
    exercise: "Exercise 8 · Put the words in the right order",
    page: "Pupil's Book p. 5",
    instruction: "Put the words in the right order to make one sentence.",
    context: "We / please / have / say / thank / and / you .",
    parts: [
      {
        id: "l1q7a",
        type: "text",
        prompt: "Your sentence:",
        accept: ["we have to say please and thank you"],
        marks: 2,
        explanation: "Printed answer: “We have to say please and thank you.”",
      },
    ],
  },
  {
    id: "l1q8",
    lesson: 1,
    exercise: "Exercise 6a · Complete the age chart",
    page: "Pupil's Book p. 5",
    instruction: "Match each country with the secondary-school age printed in the reading.",
    context: "The chart has one box missing for each country: Syria | | |  and  Britain | | |",
    parts: [
      {
        id: "l1q8a",
        type: "choice",
        prompt: "Syria — secondary school starts at the age of",
        options: ["15", "11", "6"],
        accept: ["15"],
        marks: 1,
        explanation: "Printed chart: Syria — nursery 3, basic 6, secondary 15.",
      },
      {
        id: "l1q8b",
        type: "choice",
        prompt: "Britain — secondary school starts at the age of",
        options: ["15", "11", "5"],
        accept: ["11"],
        marks: 1,
        explanation: "Printed chart: Britain — nursery 3, primary 5, secondary 11.",
      },
    ],
  },
  {
    id: "l1q9",
    lesson: 1,
    exercise: "Exercise 3 · Ask and answer",
    page: "Pupil's Book p. 4",
    instruction: "Choose the correct answer to the printed question.",
    context: "Model conversation\n— Where do you have science?\n— I have science in the science lab.",
    parts: [
      {
        id: "l1q9a",
        type: "choice",
        prompt: "— Where do you have science? — ……",
        options: [
          "I have science in the science lab.",
          "I have science at eight o'clock.",
          "I have science with Laura.",
        ],
        accept: ["I have science in the science lab."],
        marks: 2,
        explanation: "The model conversation printed in Exercise 3 gives this exact reply.",
      },
    ],
  },
  {
    id: "l1q10",
    lesson: 1,
    exercise: "Exercise 8 · Put the words in the right order",
    page: "Pupil's Book p. 5",
    instruction: "Put the words in the right order to make one sentence.",
    context: "has / She / uniform. / wear / a / to / school",
    parts: [
      {
        id: "l1q10a",
        type: "text",
        prompt: "Your sentence:",
        accept: ["she has to wear a school uniform"],
        marks: 2,
        explanation: "Printed answer: “She has to wear a school uniform.”",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* LESSON 2 — Family (Pupil's Book pages 6–8)                          */
/* ------------------------------------------------------------------ */

const JOHN_PASSAGE =
  "Hello! My name is John. I am ten years old and I am from Canada. I am going to introduce my lovely family to you. It is quite big and we are very happy. My mother's name is Liza and my father's name is Peter. My mother has got black hair and she is very kind. My father is tall and he is a very funny person. My parents have got two children. My baby sister Laura and me. Laura is only one year old. My father has got a sister. Her name is Olivia. She is my aunt. My mother has got a brother. His name is Richard. He is my uncle. My grandparents are Kevin and Carla. We've got two pets, a cat called Lucy and a dog called Puppy. He is my favourite!";

export const LESSON_2: Question[] = [
  {
    id: "l2q1",
    lesson: 2,
    exercise: "Exercise 6 · Read and do the tasks below",
    page: "Pupil's Book p. 7",
    instruction: "Read the text, then answer.",
    context: JOHN_PASSAGE,
    parts: [
      {
        id: "l2q1a",
        type: "choice",
        prompt: "How old is John?",
        options: ["Ten years old.", "Seven years old.", "Thirteen years old."],
        accept: ["Ten years old."],
        marks: 2,
        explanation: "The first line of the passage: “I am ten years old and I am from Canada.”",
      },
    ],
  },
  {
    id: "l2q2",
    lesson: 2,
    exercise: "Exercise 6 · Read and do the tasks below",
    page: "Pupil's Book p. 7",
    instruction: "Read the text, then complete the sentence.",
    context: "My mother's name is Liza and my father's name is Peter.",
    parts: [
      {
        id: "l2q2a",
        type: "text",
        prompt: "John's mother's name is ……",
        accept: ["liza"],
        marks: 2,
        explanation: "Printed in the passage: “My mother's name is Liza.”",
      },
    ],
  },
  {
    id: "l2q3",
    lesson: 2,
    exercise: "Exercise 6 · Read and do the tasks below",
    page: "Pupil's Book p. 7",
    instruction: "Read the text, then answer.",
    context: "My parents have got two children. My baby sister Laura and me. Laura is only one year old.",
    parts: [
      {
        id: "l2q3a",
        type: "choice",
        prompt: "Who is John's baby sister?",
        options: ["Laura", "Olivia", "Carla"],
        accept: ["Laura"],
        marks: 2,
        explanation: "The passage calls Laura “My baby sister”.",
      },
    ],
  },
  {
    id: "l2q4",
    lesson: 2,
    exercise: "Exercise 6b · Write true (T) or false (F)",
    page: "Pupil's Book p. 7",
    instruction: "Write true (T) or false (F) according to the text.",
    context: "We've got two pets, a cat called Lucy and a dog called Puppy.",
    parts: [
      {
        id: "l2q4a",
        type: "tf",
        prompt: "5. John's cat is called Puppy.",
        options: TRUE_FALSE,
        accept: ["false"],
        marks: 2,
        explanation: "False — the cat is Lucy; Puppy is the dog.",
      },
    ],
  },
  {
    id: "l2q5",
    lesson: 2,
    exercise: "Exercise 6b · Write true (T) or false (F)",
    page: "Pupil's Book p. 7",
    instruction: "Write true (T) or false (F) according to the text.",
    context: "My mother's name is Liza and my father's name is Peter.",
    parts: [
      {
        id: "l2q5a",
        type: "tf",
        prompt: "3. Liza and Peter are John's parents.",
        options: TRUE_FALSE,
        accept: ["true"],
        marks: 2,
        explanation: "True — Liza is John's mother and Peter is his father.",
      },
    ],
  },
  {
    id: "l2q6",
    lesson: 2,
    exercise: "Exercise 6 · Read and do the tasks below",
    page: "Pupil's Book p. 7",
    instruction: "Read the text, then answer.",
    context: "My father has got a sister. Her name is Olivia. She is my aunt.",
    parts: [
      {
        id: "l2q6a",
        type: "choice",
        prompt: "Olivia is John's ……",
        options: ["aunt", "uncle", "cousin"],
        accept: ["aunt"],
        marks: 2,
        explanation: "Printed in the passage: “My father has got a sister. Her name is Olivia. She is my aunt.”",
      },
    ],
  },
  {
    id: "l2q7",
    lesson: 2,
    exercise: "Exercise 6 · Read and do the tasks below",
    page: "Pupil's Book p. 7",
    instruction: "Complete the sentence from the text.",
    context: "My mother has got a brother. His name is Richard.",
    parts: [
      {
        id: "l2q7a",
        type: "text",
        prompt: "Richard is John's …… .",
        accept: ["uncle"],
        marks: 2,
        explanation: "Printed in the passage: “His name is Richard. He is my uncle.”",
      },
    ],
  },
  {
    id: "l2q8",
    lesson: 2,
    exercise: "Exercise 7 · Complete using the possessive ('s)",
    page: "Pupil's Book p. 8",
    instruction: "Complete using the possessive ('s).",
    context: "Printed examples: He is Lara's uncle. · She is Charles's mother. · Those are the children's toys. · These are the students' books.",
    parts: [
      {
        id: "l2q8a",
        type: "text",
        prompt: "(Giraffes / necks) are very long. → …… necks are very long.",
        accept: ["giraffes' necks", "giraffes necks"],
        marks: 2,
        explanation:
          "Giraffes is a regular plural ending in s, so the apostrophe goes after the s: “Giraffes' necks”.",
      },
    ],
  },
  {
    id: "l2q9",
    lesson: 2,
    exercise: "Let's Learn · Possessives",
    page: "Pupil's Book p. 8",
    instruction: "Complete using the possessive ('s).",
    context: "Children is an irregular plural, so we write “children's toys.”",
    parts: [
      {
        id: "l2q9a",
        type: "choice",
        prompt: "Those are the …… toys. (children)",
        options: ["children's", "childrens", "child's"],
        accept: ["children's"],
        marks: 2,
        explanation: "The printed sentence is “Those are the children's toys.”",
      },
    ],
  },
  {
    id: "l2q10",
    lesson: 2,
    exercise: "Exercise 8 · Complete the table with the right family member",
    page: "Pupil's Book p. 8",
    instruction: "Write M for masculine or F for feminine, as in the printed table.",
    context:
      "Word bank: aunt, brother, children, cousins, daughter, father, grandchildren, granddaughter, grandfather, grandmother, grandson, grandparents, husband, mother, nephew, niece, parents, sister, son, uncle, wife.",
    parts: [
      {
        id: "l2q10a",
        type: "choice",
        prompt: "nephew →",
        options: ["M (masculine)", "F (feminine)"],
        accept: ["M (masculine)"],
        marks: 1,
        explanation: "Nephew is the masculine word; the feminine form is niece.",
      },
      {
        id: "l2q10b",
        type: "choice",
        prompt: "granddaughter →",
        options: ["M (masculine)", "F (feminine)"],
        accept: ["F (feminine)"],
        marks: 1,
        explanation: "Granddaughter is feminine; the masculine form is grandson.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* LESSON 3 — Daily Routines (Pupil's Book pages 9–11)                 */
/* ------------------------------------------------------------------ */

const FREQUENCY_CHART =
  "Frequency chart printed on page 10 (Sun · Mon · Tues · Wed · Thur)\nAlways   ✓ ✓ ✓ ✓ ✓\nUsually  ✓ ✓ ✓ ✓ ✕\nSometimes ✓ ✕ ✓ ✕ ✓\nNever    ✕ ✕ ✕ ✕ ✕";

export const LESSON_3: Question[] = [
  {
    id: "l3q1",
    lesson: 3,
    exercise: "Activity 7 · Choose between brackets",
    page: "Pupil's Book p. 11",
    instruction: "Choose the correct word.",
    context: "With I, you, we and they the verb has no extra ending. With he, she and it the verb takes -s.",
    parts: [
      {
        id: "l3q1a",
        type: "choice",
        prompt: "1. Lili never …… the piano at night.",
        options: ["play", "plays", "playing"],
        accept: ["plays"],
        marks: 2,
        explanation: "Lili = she, so the verb takes -s: “Lili never plays the piano at night.”",
      },
    ],
  },
  {
    id: "l3q2",
    lesson: 3,
    exercise: "Activity 7 · Choose between brackets",
    page: "Pupil's Book p. 11",
    instruction: "Choose the correct word.",
    parts: [
      {
        id: "l3q2a",
        type: "choice",
        prompt: "2. …… they go to the swimming pool on Fridays?",
        options: ["Do", "Does", "Are"],
        accept: ["Do"],
        marks: 2,
        explanation: "“they” takes Do, and the main verb stays plain: “Do they go to the swimming pool on Fridays?”",
      },
    ],
  },
  {
    id: "l3q3",
    lesson: 3,
    exercise: "Activity 7 · Choose between brackets",
    page: "Pupil's Book p. 11",
    instruction: "Complete the sentence with the correct form.",
    parts: [
      {
        id: "l3q3a",
        type: "text",
        prompt: "3. Toni always …… dinner.",
        accept: ["has"],
        marks: 2,
        explanation: "Toni = he/she, so have becomes has: “Toni always has dinner.”",
      },
    ],
  },
  {
    id: "l3q4",
    lesson: 3,
    exercise: "Activity 7 · Choose between brackets",
    page: "Pupil's Book p. 11",
    instruction: "Choose the correct word.",
    parts: [
      {
        id: "l3q4a",
        type: "choice",
        prompt: "5. We (doesn't / don't) go to school by bus.",
        options: ["doesn't", "don't"],
        accept: ["don't"],
        marks: 2,
        explanation: "“we” takes don't: “We don't go to school by bus.”",
      },
    ],
  },
  {
    id: "l3q5",
    lesson: 3,
    exercise: "Activity 5 · Examine the chart and fill in the blanks",
    page: "Pupil's Book p. 10",
    instruction: "Write the frequency adverb that matches the marks printed beside the sentence.",
    context: FREQUENCY_CHART,
    parts: [
      {
        id: "l3q5a",
        type: "text",
        prompt: "1. …… I get up at six o'clock.   (marks: ✓ ✓ ✓ ✓ ✓)",
        accept: ["always"],
        marks: 2,
        explanation: "✓ ✓ ✓ ✓ ✓ is the Always row of the printed chart.",
      },
    ],
  },
  {
    id: "l3q6",
    lesson: 3,
    exercise: "Activity 5 · Examine the chart and fill in the blanks",
    page: "Pupil's Book p. 10",
    instruction: "Write the frequency adverb that matches the marks printed beside the sentence.",
    context: FREQUENCY_CHART,
    parts: [
      {
        id: "l3q6a",
        type: "text",
        prompt: "3. …… I chat with my friends online.   (marks: ✓ ✕ ✓ ✕ ✓)",
        accept: ["sometimes"],
        marks: 2,
        explanation: "✓ ✕ ✓ ✕ ✓ is the Sometimes row of the printed chart.",
      },
    ],
  },
  {
    id: "l3q7",
    lesson: 3,
    exercise: "Activity 6a · Read and do the tasks below",
    page: "Pupil's Book p. 10",
    instruction: "Write true (T) or false (F) according to the text.",
    context:
      "I am Mira, I love Friday. It's a holiday. I don't get up early. I usually take a shower and have breakfast with my family. Then I tidy my room and my brother cleans the grage, he doesn't ask me to help him. In the afternoon, I sometimes go out with my family on a picnic. We like to spend time together. In the evening, my father watches the news. My mother doesn't watch the news, she likes to cook dinner. The whole family shares in the houswork. We never go to bed early on Thursdays so we always watch a film after dinner.",
    parts: [
      {
        id: "l3q7a",
        type: "tf",
        prompt: "3. Her mother doesn't cook dinner.",
        options: TRUE_FALSE,
        accept: ["false"],
        marks: 2,
        explanation: "False — the text says “my mother … likes to cook dinner”.",
      },
    ],
  },
  {
    id: "l3q8",
    lesson: 3,
    exercise: "Activity 6a · Read and do the tasks below",
    page: "Pupil's Book p. 10",
    instruction: "Write true (T) or false (F) according to the text.",
    context: "In the evening, my father watches the news.",
    parts: [
      {
        id: "l3q8a",
        type: "tf",
        prompt: "4. Her dad watches the news.",
        options: TRUE_FALSE,
        accept: ["true"],
        marks: 2,
        explanation: "True — “In the evening, my father watches the news.”",
      },
    ],
  },
  {
    id: "l3q9",
    lesson: 3,
    exercise: "Activity 8 · Put the words in the right order",
    page: "Pupil's Book p. 11",
    instruction: "Put the words in the right order to make one sentence.",
    context: "evening. / usually / pack / the / I / bag / my / in",
    parts: [
      {
        id: "l3q9a",
        type: "text",
        prompt: "Your sentence:",
        accept: ["i usually pack my bag in the evening"],
        marks: 2,
        explanation: "Printed answer: “I usually pack my bag in the evening.” The adverb sits before the main verb.",
      },
    ],
  },
  {
    id: "l3q10",
    lesson: 3,
    exercise: "Activity 4 · Practise with a partner (clock)",
    page: "Pupil's Book p. 10",
    instruction: "Choose the correct time.",
    context: "Printed example: — What time do you go to school? — I go to school at twenty to eight.",
    parts: [
      {
        id: "l3q10a",
        type: "choice",
        prompt: "What time is “twenty to eight”?",
        options: ["7:40", "8:20", "7:20"],
        accept: ["7:40"],
        marks: 2,
        explanation: "“… to” counts up to the next hour, so twenty to eight is 20 minutes before 8:00 = 7:40.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* LESSON 4 — The Five Senses (Pupil's Book pages 12–14)               */
/* ------------------------------------------------------------------ */

const SENSES_PASSAGE =
  "We use our five senses every day. They are sight, touch, smell, taste and hearing. They help us understand and enjoy the world around us. When we look at the sky, we see very far stars. We can hear sounds that are low or loud. We can touch things that are soft or hard. Different foods have different tastes. Sweet, bitter, bland and sour. We smell things that are good or bad. We smell flowers and perfumes. Eyes for sight, nose for smell, tongue for taste, skin for touch and ears for hearing.";

export const LESSON_4: Question[] = [
  {
    id: "l4q1",
    lesson: 4,
    exercise: "Activity 4 · Look and describe",
    page: "Pupil's Book p. 13",
    instruction: "Complete the printed sentence.",
    context: "The page prints this sentence in red: I smell with my nose.",
    parts: [
      {
        id: "l4q1a",
        type: "text",
        prompt: "I smell with my …… .",
        accept: ["nose"],
        marks: 2,
        explanation: "The printed sentence is “I smell with my nose.” The matching card is smell.",
      },
    ],
  },
  {
    id: "l4q2",
    lesson: 4,
    exercise: "Activity 6 · Read the text and do the tasks below",
    page: "Pupil's Book p. 13",
    instruction: "Complete the sentence from the text.",
    context: SENSES_PASSAGE,
    parts: [
      {
        id: "l4q2a",
        type: "text",
        prompt: "…… for sight, nose for smell, tongue for taste, skin for touch and ears for hearing.",
        accept: ["eyes", "eye"],
        marks: 2,
        explanation: "Last sentence of the printed passage: “Eyes for sight …”",
      },
    ],
  },
  {
    id: "l4q3",
    lesson: 4,
    exercise: "Activity 6a · Write true (T) or false (F)",
    page: "Pupil's Book p. 13",
    instruction: "Write true (T) or false (F) according to the text.",
    context: "Different foods have different tastes. Sweet, bitter, bland and sour.",
    parts: [
      {
        id: "l4q3a",
        type: "tf",
        prompt: "1. All foods taste the same.",
        options: TRUE_FALSE,
        accept: ["false"],
        marks: 2,
        explanation: "False — the text says “Different foods have different tastes.”",
      },
    ],
  },
  {
    id: "l4q4",
    lesson: 4,
    exercise: "Activity 6a · Write true (T) or false (F)",
    page: "Pupil's Book p. 13",
    instruction: "Write true (T) or false (F) according to the text.",
    context: "We can touch things that are soft or hard.",
    parts: [
      {
        id: "l4q4a",
        type: "tf",
        prompt: "3. Our hands can only feel soft things.",
        options: TRUE_FALSE,
        accept: ["false"],
        marks: 2,
        explanation: "False — the text says we can touch things that are soft or hard.",
      },
    ],
  },
  {
    id: "l4q5",
    lesson: 4,
    exercise: "Activity 6 · Read the text and do the tasks below",
    page: "Pupil's Book p. 13",
    instruction: "Choose the correct word.",
    context: SENSES_PASSAGE,
    parts: [
      {
        id: "l4q5a",
        type: "choice",
        prompt: "Different foods have different …… .",
        options: ["tastes", "sounds", "smells"],
        accept: ["tastes"],
        marks: 2,
        explanation: "Printed sentence: “Different foods have different tastes.”",
      },
    ],
  },
  {
    id: "l4q6",
    lesson: 4,
    exercise: "Activity 6b · Match the adjectives with the senses",
    page: "Pupil's Book p. 13",
    instruction: "Match each adjective with the sense it belongs to.",
    context: "Printed table — sight · smell · hearing · touch · taste",
    parts: [
      {
        id: "l4q6a",
        type: "choice",
        prompt: "bright →",
        options: ["sight", "smell", "hearing", "touch", "taste"],
        accept: ["sight"],
        marks: 1,
        explanation: "Bright describes something we see, so it matches sight.",
      },
      {
        id: "l4q6b",
        type: "choice",
        prompt: "cold →",
        options: ["sight", "smell", "hearing", "touch", "taste"],
        accept: ["touch"],
        marks: 1,
        explanation: "Cold is how something feels, so it matches touch.",
      },
    ],
  },
  {
    id: "l4q7",
    lesson: 4,
    exercise: "Activity 7 · Choose the correct answer between brackets",
    page: "Pupil's Book p. 14",
    instruction: "Choose the correct word.",
    parts: [
      {
        id: "l4q7a",
        type: "choice",
        prompt: "1. Flowers …… nice.",
        options: ["smell", "smells", "tasting"],
        accept: ["smell"],
        marks: 2,
        explanation: "“Flowers” is plural, so the verb has no -s: “Flowers smell nice.”",
      },
    ],
  },
  {
    id: "l4q8",
    lesson: 4,
    exercise: "Activity 7 · Choose the correct answer between brackets",
    page: "Pupil's Book p. 14",
    instruction: "Complete the sentence with the correct form.",
    parts: [
      {
        id: "l4q8a",
        type: "text",
        prompt: "5. The music …… loud.",
        accept: ["sounds"],
        marks: 2,
        explanation: "Loudness is a sound, and “the music” = it, so “The music sounds loud.”",
      },
    ],
  },
  {
    id: "l4q9",
    lesson: 4,
    exercise: "Activity 8 · Complete using Wh-questions or full answers",
    page: "Pupil's Book p. 14",
    instruction: "Choose the question that goes with the printed answer.",
    context: "Printed answer: It tastes sweet.",
    parts: [
      {
        id: "l4q9a",
        type: "choice",
        prompt: "Which question does this answer?",
        options: ["How does it taste?", "How does it look?", "What sound do you hear?"],
        accept: ["How does it taste?"],
        marks: 2,
        explanation: "“It tastes sweet” is about taste, so the question is “How does it taste?”",
      },
    ],
  },
  {
    id: "l4q10",
    lesson: 4,
    exercise: "Activity 6 · Read the text and do the tasks below",
    page: "Pupil's Book p. 13",
    instruction: "Complete the sentence from the text.",
    context: SENSES_PASSAGE,
    parts: [
      {
        id: "l4q10a",
        type: "text",
        prompt: "They are sight, touch, smell, taste and …… .",
        accept: ["hearing", "hear"],
        marks: 2,
        explanation: "Printed in the passage: “They are sight, touch, smell, taste and hearing.”",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* LESSON 5 — Clothes (Pupil's Book pages 15–20, incl. Revision 1)     */
/* ------------------------------------------------------------------ */

export const LESSON_5: Question[] = [
  {
    id: "l5q1",
    lesson: 5,
    exercise: "Activity 5 · Before you read, match",
    page: "Pupil's Book p. 16",
    instruction: "Match each skirt picture with its pattern word.",
    context: "Pattern words printed on the page: floral · striped · dotted · plain",
    parts: [
      {
        id: "l5q1a",
        type: "choice",
        prompt: "a skirt with small spots on it →",
        options: ["floral", "striped", "dotted", "plain"],
        accept: ["dotted"],
        marks: 1,
        explanation: "Picture 2 (small spots) — dotted.",
      },
      {
        id: "l5q1b",
        type: "choice",
        prompt: "a skirt with flowers on it →",
        options: ["floral", "striped", "dotted", "plain"],
        accept: ["floral"],
        marks: 1,
        explanation: "Picture 4 (flowers) — floral.",
      },
    ],
  },
  {
    id: "l5q2",
    lesson: 5,
    exercise: "Activity 5 · Before you read, match",
    page: "Pupil's Book p. 16",
    instruction: "Choose the correct pattern word.",
    context: "Pattern words printed on the page: floral · striped · dotted · plain",
    parts: [
      {
        id: "l5q2a",
        type: "choice",
        prompt: "A skirt with one colour and no pattern is …… .",
        options: ["plain", "dotted", "striped"],
        accept: ["plain"],
        marks: 2,
        explanation: "Picture 3 (one colour, no pattern) — plain.",
      },
    ],
  },
  {
    id: "l5q3",
    lesson: 5,
    exercise: "Activity 3 · Ask and answer",
    page: "Pupil's Book p. 15",
    instruction: "Complete the printed speech bubble.",
    context: "— What are you wearing?\n— I'm wearing a blue T-shirt and trousers. I'm wearing red trainers, too.",
    parts: [
      {
        id: "l5q3a",
        type: "text",
        prompt: "I'm wearing a blue T-shirt and trousers. I'm wearing red …… , too.",
        accept: ["trainers", "trainer"],
        marks: 2,
        explanation: "Printed bubble on page 15: “I'm wearing red trainers, too.”",
      },
    ],
  },
  {
    id: "l5q4",
    lesson: 5,
    exercise: "Activity 6 · Buying Clothes (S = salesman, C = customer)",
    page: "Pupil's Book p. 16",
    instruction: "Choose the correct word from the dialogue.",
    context:
      "S: Good morning, madam. Can I help you?\nC: Yes, please. I'm looking for a sweater.\nS: What size, madam?\nC: Thirty-eight.",
    parts: [
      {
        id: "l5q4a",
        type: "choice",
        prompt: "— Yes, please. I'm looking for a …… .",
        options: ["sweater", "dress", "skirt"],
        accept: ["sweater"],
        marks: 2,
        explanation: "Printed in the dialogue: “I'm looking for a sweater.”",
      },
    ],
  },
  {
    id: "l5q5",
    lesson: 5,
    exercise: "Activity 6a · Write true (T) or false (F)",
    page: "Pupil's Book p. 16",
    instruction: "Write true (T) or false (F) according to the dialogue.",
    context: "S: It's 3000 Sp.\nC: Here you are. Thank you.",
    parts: [
      {
        id: "l5q5a",
        type: "tf",
        prompt: "4. The sweater costs 2000 SP.",
        options: TRUE_FALSE,
        accept: ["false"],
        marks: 2,
        explanation: "False — the salesman says “It's 3000 Sp.”",
      },
    ],
  },
  {
    id: "l5q6",
    lesson: 5,
    exercise: "Activity 6a · Write true (T) or false (F)",
    page: "Pupil's Book p. 16",
    instruction: "Write true (T) or false (F) according to the dialogue.",
    context: "S: Good morning, madam. Can I help you?",
    parts: [
      {
        id: "l5q6a",
        type: "tf",
        prompt: "2. She goes shopping in the morning.",
        options: TRUE_FALSE,
        accept: ["true"],
        marks: 2,
        explanation: "True — the salesman says “Good morning, madam.”",
      },
    ],
  },
  {
    id: "l5q7",
    lesson: 5,
    exercise: "Activity 6a · Order these sentences",
    page: "Pupil's Book p. 16",
    instruction: "Write 1, 2, 3 or 4 to show where each sentence belongs in the conversation.",
    context:
      "Printed order in the key: greeting → request → size question → size answer → price question → price answer.",
    parts: [
      {
        id: "l5q7a",
        type: "choice",
        prompt: "“How can I help you?”",
        options: ["1", "2", "3", "4"],
        accept: ["1"],
        marks: 0.5,
        explanation: "The greeting opens the conversation.",
      },
      {
        id: "l5q7b",
        type: "choice",
        prompt: "“I'd like a sweater.”",
        options: ["1", "2", "3", "4"],
        accept: ["2"],
        marks: 0.5,
        explanation: "The customer answers the greeting with her request.",
      },
      {
        id: "l5q7c",
        type: "choice",
        prompt: "“What size are you?”",
        options: ["1", "2", "3", "4"],
        accept: ["3"],
        marks: 0.5,
        explanation: "The size question comes after the request.",
      },
      {
        id: "l5q7d",
        type: "choice",
        prompt: "“Medium.”",
        options: ["1", "2", "3", "4"],
        accept: ["4"],
        marks: 0.5,
        explanation: "“Medium.” is the answer to the size question.",
      },
    ],
  },
  {
    id: "l5q8",
    lesson: 5,
    exercise: "Activity 7 · Read and number",
    page: "Pupil's Book p. 17",
    instruction: "Complete the printed description.",
    context: "1 Rana is wearing a dotted pink dress and blue shoes.",
    parts: [
      {
        id: "l5q8a",
        type: "text",
        prompt: "Rana is wearing a dotted pink …… and blue shoes.",
        accept: ["dress"],
        marks: 2,
        explanation: "Printed sentence 1: “Rana is wearing a dotted pink dress and blue shoes.”",
      },
    ],
  },
  {
    id: "l5q9",
    lesson: 5,
    exercise: "Revision 1 · 4 Choose the correct word",
    page: "Pupil's Book p. 19",
    instruction: "Choose the correct word.",
    parts: [
      {
        id: "l5q9a",
        type: "choice",
        prompt: "b. She always (wears, is wearing) colourful clothes.",
        options: ["wears", "is wearing"],
        accept: ["wears"],
        marks: 2,
        explanation: "“always” marks a habit, so the present simple “wears” is correct.",
      },
    ],
  },
  {
    id: "l5q10",
    lesson: 5,
    exercise: "Revision 1 · 3 Read and complete",
    page: "Pupil's Book p. 18",
    instruction: "Complete the text with the word shown by the printed picture.",
    context:
      "In winter it gets cold and …… . I usually wear a …… , a …… and I sometimes wear a …… .\nIn summer, it's always hot and …… . My friend Lily wears dotted ……s and …… dresses. She never wears …… .",
    parts: [
      {
        id: "l5q10a",
        type: "text",
        prompt: "In summer, it's always hot and …… .",
        accept: ["sunny", "sun"],
        marks: 2,
        explanation:
          "The printed picture beside this gap is the sun: “In summer, it's always hot and sunny.” (sunny / sun are the same idea.)",
      },
    ],
  },
];

export const QUESTIONS: Question[] = [
  ...LESSON_1,
  ...LESSON_2,
  ...LESSON_3,
  ...LESSON_4,
  ...LESSON_5,
];

export const ALL_PARTS: Part[] = QUESTIONS.flatMap((q) => q.parts);

export const TOTAL_QUESTIONS = QUESTIONS.length;
export const TOTAL_MARKS = ALL_PARTS.reduce((sum, p) => sum + p.marks, 0);
export const MAIN_MARKS = 2;

export function questionsForLesson(n: LessonNumber): Question[] {
  return QUESTIONS.filter((q) => q.lesson === n);
}

export function lessonMeta(n: LessonNumber): LessonMeta {
  return LESSONS.find((l) => l.n === n)!;
}

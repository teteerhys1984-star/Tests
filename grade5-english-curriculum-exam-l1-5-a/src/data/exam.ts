/**
 * Grade 5 English — Unit 1 Examination · Model A
 *
 * Every question below is built from the Grade 5 Unit 1 source files in
 * https://github.com/teteerhys1984-star/E_Curriculum_1_9
 * (grade5-unit1-lesson1..5-pupil-book.html — Pupil's Book pages 3–20).
 *
 * Reading passages are reproduced verbatim from those source files.
 * No listening-dependent item appears anywhere in this paper: every listening
 * activity in the source is explicitly unscored because the recordings are not
 * available, so none of them is used here.
 */

export type LessonId = "L1" | "L2" | "L3" | "L4" | "L5";

export interface Lesson {
  id: LessonId;
  no: number;
  title: string;
  pages: string;
  color: string;
  colorDeep: string;
}

export const LESSONS: Record<LessonId, Lesson> = {
  L1: { id: "L1", no: 1, title: "At School", pages: "Pupil's Book pp. 3–5", color: "#0e9aa7", colorDeep: "#0a6e78" },
  L2: { id: "L2", no: 2, title: "Family", pages: "Pupil's Book pp. 6–8", color: "#1d6fe0", colorDeep: "#164fa6" },
  L3: { id: "L3", no: 3, title: "Daily Routines", pages: "Pupil's Book pp. 9–11", color: "#2fa84f", colorDeep: "#1e7a39" },
  L4: { id: "L4", no: 4, title: "The Five Senses", pages: "Pupil's Book pp. 12–14", color: "#ff6b5a", colorDeep: "#d24a3b" },
  L5: { id: "L5", no: 5, title: "Clothes", pages: "Pupil's Book pp. 15–20", color: "#7c4dbe", colorDeep: "#5d3796" },
};

export const LESSON_ORDER: LessonId[] = ["L1", "L2", "L3", "L4", "L5"];

export interface Passage {
  title: string;
  body: string[];
}

export interface DataTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

interface BasePart {
  id: string;
  label: string;
  prompt: string;
  marks: number;
}

export interface McqPart extends BasePart {
  type: "mcq";
  lead?: string;
  options: string[];
  answer: string;
}
export interface TfPart extends BasePart {
  type: "tf";
  answer: "True" | "False";
}
export interface TextPart extends BasePart {
  type: "text";
  answer: string;
  accepted?: string[];
  placeholder?: string;
}
export interface OrderPart extends BasePart {
  type: "order";
  words: string[];
  answer: string;
}
export interface RubricPart extends BasePart {
  type: "rubric";
  starter?: string;
  minWords: number;
  rubric: string;
}

export type Part = McqPart | TfPart | TextPart | OrderPart | RubricPart;

export interface Question {
  id: string;
  lesson: LessonId;
  ref: string;
  stem?: string;
  passage?: Passage;
  table?: DataTable;
  note?: string;
  parts: Part[];
}

/* ------------------------------------------------------------------ */
/* Reading passages — verbatim from the source files                   */
/* ------------------------------------------------------------------ */

const JOHN_PASSAGE: Passage = {
  title: "Reading · Exercise 6 (page 7)",
  body: [
    "Hello! My name is John. I am ten years old and I am from Canada. I am going to introduce my lovely family to you. It is quite big and we are very happy. My mother's name is Liza and my father's name is Peter. My mother has got black hair and she is very kind. My father is tall and he is a very funny person. My parents have got two children. My baby sister Laura and me. Laura is only one year old. My father has got a sister. Her name is Olivia. She is my aunt. My mother has got a brother. His name is Richard. He is my uncle. My grandparents are Kevin and Carla. We've got two pets, a cat called Lucy and a dog called Puppy. He is my favourite!",
  ],
};

const MIRA_PASSAGE: Passage = {
  title: "Reading · Exercise 6 (page 10)",
  body: [
    "I am Mira, I love Friday. It's a holiday. I don't get up early. I usually take a shower and have breakfast with my family. Then I tidy my room and my brother cleans the grage, he doesn't ask me to help him. In the afternoon, I sometimes go out with my family on a picnic. We like to spend time together. In the evening, my father watches the news. My mother doesn't watch the news, she likes to cook dinner. The whole family shares in the houswork. We never go to bed early on Thursdays so we always watch a film after dinner.",
  ],
};

const SENSES_PASSAGE: Passage = {
  title: "Reading · Exercise 6 (page 13)",
  body: [
    "We use our five senses every day. They are sight, touch, smell, taste and hearing. They help us understand and enjoy the world around us. When we look at the sky, we see very far stars. We can hear sounds that are low or loud. We can touch things that are soft or hard. Different foods have different tastes. Sweet, bitter, bland and sour. We smell things that are good or bad. We smell flowers and perfumes. Eyes for sight, nose for smell, tongue for taste, skin for touch and ears for hearing.",
  ],
};

const CLOTHES_DIALOGUE: Passage = {
  title: "Reading · Exercise 6 “Buying Clothes” (page 16)",
  body: [
    "S: Good morning, madam. Can I help you?",
    "C: Yes, please. I'm looking for a sweater.",
    "S: What size, madam?",
    "C: Thirty-eight.",
    "S: What colour would you like?",
    "C: I would like a striped red sweater.",
    "S: Will you try this one, please? The fitting room is over there. How does it fit?",
    "C: It's perfect. I'll take it. How much is it?",
    "S: It's 3000 Sp.",
    "C: Here you are. Thank you.",
  ],
};

const SCHOOL_STAGES: DataTable = {
  caption: "Exercise 5 · School stages chart",
  headers: ["School stage", "Grades / age band shown in the book"],
  rows: [
    ["Nursery", "KG 1–3"],
    ["Basic / primary", "Grades 1–9"],
    ["Secondary", "Grades 10–12"],
  ],
};

const COUNTRY_AGES: DataTable = {
  caption: "Exercise 6a · Ages when children go to each stage",
  headers: ["Country", "Nursery", "Primary / basic", "Secondary"],
  rows: [
    ["Syria", "3", "6", "15"],
    ["Britain", "3", "5", "11"],
  ],
};

const ORDER_OPTIONS = ["1", "2", "3", "4", "5", "6"];

/* ------------------------------------------------------------------ */
/* The paper: 50 questions, 10 per lesson, 2 marks each = 100 marks     */
/* ------------------------------------------------------------------ */

const BY_LESSON: Record<LessonId, Question[]> = {
  /* ================= LESSON 1 · AT SCHOOL (pp. 3–5) ================= */
  L1: [
    {
      id: "L1-1",
      lesson: "L1",
      ref: "Lesson 1 · School places (Exercise 1 word list, page 3)",
      stem: "Choose the correct school place for each sentence.",
      parts: [
        {
          id: "L1-1a",
          type: "mcq",
          label: "a",
          prompt: "We borrow books and read there. Which school place is it?",
          options: ["classroom", "library", "science lab", "playground"],
          answer: "library",
          marks: 1,
        },
        {
          id: "L1-1b",
          type: "mcq",
          label: "b",
          prompt: "We do experiments there. Which school place is it?",
          options: ["computer lab", "bathroom", "science lab", "playground"],
          answer: "science lab",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-2",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 5 · School stages (page 4)",
      stem: "Complete with nursery, basic / primary or secondary.",
      table: SCHOOL_STAGES,
      parts: [
        {
          id: "L1-2a",
          type: "text",
          label: "a",
          prompt: "Lili is 4 years old. She is in the ____________ school.",
          answer: "nursery",
          placeholder: "Write one word",
          marks: 1,
        },
        {
          id: "L1-2b",
          type: "text",
          label: "b",
          prompt: "Adam is 7 years old. He is in the ____________ school.",
          answer: "basic / primary",
          accepted: ["basic", "primary", "basic/primary", "basic primary", "primary school", "basic school"],
          placeholder: "Write the stage",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-3",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 5 · School stages chart (page 4)",
      stem: "Read the chart, then answer.",
      table: SCHOOL_STAGES,
      parts: [
        {
          id: "L1-3a",
          type: "mcq",
          label: "a",
          prompt: "Grades 1–9 belong to which stage?",
          options: ["nursery", "basic / primary", "secondary"],
          answer: "basic / primary",
          marks: 1,
        },
        {
          id: "L1-3b",
          type: "mcq",
          label: "b",
          prompt: "Which grades are in the secondary stage?",
          options: ["KG 1–3", "Grades 1–9", "Grades 10–12"],
          answer: "Grades 10–12",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-4",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 6a · Reading: school in Britain and Syria (page 4)",
      stem: "Complete the age chart from your reading.",
      table: COUNTRY_AGES,
      parts: [
        {
          id: "L1-4a",
          type: "text",
          label: "a",
          prompt: "In Britain, children start primary school at age ____________.",
          answer: "5",
          accepted: ["five"],
          placeholder: "Age",
          marks: 1,
        },
        {
          id: "L1-4b",
          type: "text",
          label: "b",
          prompt: "In Syria, secondary school starts at age ____________.",
          answer: "15",
          accepted: ["fifteen"],
          placeholder: "Age",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-5",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 6b · True or false (page 4)",
      stem: "Write true (T) or false (F) for each statement about your reading.",
      table: COUNTRY_AGES,
      note: "The reading also tells us that special exams are needed for university in both countries.",
      parts: [
        {
          id: "L1-5a",
          type: "tf",
          label: "a",
          prompt: "In Britain, students go to primary school when they are six.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L1-5b",
          type: "tf",
          label: "b",
          prompt: "Both in Britain and Syria, students have to take special exams to go to university.",
          answer: "True",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-6",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 6b (page 4) and Exercise 3 · Ask and answer (page 3)",
      parts: [
        {
          id: "L1-6a",
          type: "tf",
          label: "a",
          prompt: "In Syria, students go to nursery school and then to basic school.",
          answer: "True",
          marks: 1,
        },
        {
          id: "L1-6b",
          type: "text",
          label: "b",
          prompt: "Complete the model conversation. — Where do you have science? — I have science in the ____________.",
          answer: "science lab",
          accepted: ["lab", "the science lab"],
          placeholder: "School place",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-7",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 7 · Circle the correct word (page 5)",
      stem: "Circle the correct word.",
      parts: [
        {
          id: "L1-7a",
          type: "mcq",
          label: "1",
          prompt: "What do you ____________ (has to / have to) do in the classroom?",
          options: ["has to", "have to"],
          answer: "have to",
          marks: 1,
        },
        {
          id: "L1-7b",
          type: "mcq",
          label: "3",
          prompt: "____________ (Do / Does) you have to do your homework at school?",
          options: ["Do", "Does"],
          answer: "Do",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-8",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 7 · Circle the correct word (page 5)",
      stem: "Circle the correct word.",
      parts: [
        {
          id: "L1-8a",
          type: "mcq",
          label: "4",
          prompt: "No, we ____________ (doesn't / don't) have to do our homework at school.",
          options: ["doesn't", "don't"],
          answer: "don't",
          marks: 1,
        },
        {
          id: "L1-8b",
          type: "mcq",
          label: "4",
          prompt: "… we ____________ (has to / have to) do it at home.",
          options: ["has to", "have to"],
          answer: "have to",
          marks: 1,
        },
      ],
    },
    {
      id: "L1-9",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 8 · Put the words in the right order (page 5)",
      stem: "Put the words in the right order. Use every word once.",
      parts: [
        {
          id: "L1-9a",
          type: "order",
          label: "a",
          prompt: "has / She / uniform. / wear / a / to / school",
          words: ["has", "She", "uniform.", "wear", "a", "to", "school"],
          answer: "She has to wear a school uniform.",
          marks: 2,
        },
      ],
    },
    {
      id: "L1-10",
      lesson: "L1",
      ref: "Lesson 1 · Exercise 4 · School rules (page 3) and Exercise 9 (page 5)",
      parts: [
        {
          id: "L1-10a",
          type: "tf",
          label: "a",
          prompt: "“We don't have to do homework at school” means we must not do homework at school.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L1-10b",
          type: "rubric",
          label: "b",
          prompt: "Write one rule that is true for your classroom.",
          starter: "We have to ",
          minWords: 3,
          rubric:
            "1 mark for a complete, meaningful classroom rule that begins “We have to …” and uses a base-form verb (for example: We have to listen to the teacher). Answers will vary — teacher review.",
          marks: 1,
        },
      ],
    },
  ],

  /* ================== LESSON 2 · FAMILY (pp. 6–8) =================== */
  L2: [
    {
      id: "L2-1",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 6 · Reading (page 7)",
      passage: JOHN_PASSAGE,
      parts: [
        {
          id: "L2-1a",
          type: "text",
          label: "a",
          prompt: "Where is John from?",
          answer: "Canada",
          placeholder: "Country",
          marks: 1,
        },
        {
          id: "L2-1b",
          type: "text",
          label: "b",
          prompt: "How old is John?",
          answer: "ten",
          accepted: ["10", "ten years old", "ten years"],
          placeholder: "Age",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-2",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 6b · Write true (T) or false (F) (page 7)",
      passage: JOHN_PASSAGE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L2-2a",
          type: "tf",
          label: "1",
          prompt: "Carla is Kevin's wife.",
          answer: "True",
          marks: 1,
        },
        {
          id: "L2-2b",
          type: "tf",
          label: "2",
          prompt: "Liza and Peter are John's parents.",
          answer: "True",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-3",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 6b · Write true (T) or false (F) (page 7)",
      passage: JOHN_PASSAGE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L2-3a",
          type: "tf",
          label: "3",
          prompt: "Laura is Olivia's sister.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L2-3b",
          type: "tf",
          label: "4",
          prompt: "John's cat is called Puppy.",
          answer: "False",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-4",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 6 · Reading and Exercise 6b (page 7)",
      passage: JOHN_PASSAGE,
      parts: [
        {
          id: "L2-4a",
          type: "tf",
          label: "5",
          prompt: "Richard is Laura's uncle.",
          answer: "True",
          marks: 1,
        },
        {
          id: "L2-4b",
          type: "mcq",
          label: "b",
          prompt: "Who is John's aunt?",
          options: ["Carla", "Olivia", "Liza"],
          answer: "Olivia",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-5",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 6 · Reading (page 7)",
      passage: JOHN_PASSAGE,
      parts: [
        {
          id: "L2-5a",
          type: "text",
          label: "a",
          prompt: "How old is Laura, the baby sister?",
          answer: "one year old",
          accepted: ["one", "1", "one year", "only one year old"],
          placeholder: "Age",
          marks: 1,
        },
        {
          id: "L2-5b",
          type: "text",
          label: "b",
          prompt: "John's grandparents are Kevin and ____________.",
          answer: "Carla",
          placeholder: "Name",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-6",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 5 · Before you read: male and female pairs (page 7)",
      stem: "Match each male family member with the female pair.",
      parts: [
        {
          id: "L2-6a",
          type: "mcq",
          label: "a",
          lead: "uncle",
          prompt: "Choose the female pair.",
          options: ["aunt", "niece", "wife"],
          answer: "aunt",
          marks: 1,
        },
        {
          id: "L2-6b",
          type: "mcq",
          label: "b",
          lead: "nephew",
          prompt: "Choose the female pair.",
          options: ["daughter", "niece", "cousin"],
          answer: "niece",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-7",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 7 · Complete using the possessive ('s) (page 8)",
      stem: "Complete each sentence with the correct possessive form.",
      parts: [
        {
          id: "L2-7a",
          type: "text",
          label: "a",
          prompt: "I forgot my books in (my aunt / house).",
          answer: "my aunt's house",
          accepted: ["my aunts house", "aunt's house", "my aunt house"],
          placeholder: "Write the phrase",
          marks: 1,
        },
        {
          id: "L2-7b",
          type: "text",
          label: "b",
          prompt: "(Women / bags) are made of leather.",
          answer: "Women's bags",
          accepted: ["womens bags", "women bags"],
          placeholder: "Write the phrase",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-8",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 7 · Complete using the possessive ('s) (page 8)",
      stem: "Complete each sentence with the correct possessive form.",
      parts: [
        {
          id: "L2-8a",
          type: "text",
          label: "a",
          prompt: "(Hani / shoes) are black.",
          answer: "Hani's shoes",
          accepted: ["hanis shoes"],
          placeholder: "Write the phrase",
          marks: 1,
        },
        {
          id: "L2-8b",
          type: "text",
          label: "b",
          prompt: "(Giraffes / necks) are very long.",
          answer: "Giraffes' necks",
          accepted: ["giraffes necks"],
          placeholder: "Write the phrase",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-9",
      lesson: "L2",
      ref: "Lesson 2 · Let's Learn · Possessives (page 8)",
      stem: "Choose the correct possessive form.",
      parts: [
        {
          id: "L2-9a",
          type: "mcq",
          label: "a",
          prompt: "Those are the ____________ toys.",
          options: ["children's", "childrens'", "childrens"],
          answer: "children's",
          marks: 1,
        },
        {
          id: "L2-9b",
          type: "mcq",
          label: "b",
          prompt: "These are the ____________ books.",
          options: ["student's", "students'", "students's"],
          answer: "students'",
          marks: 1,
        },
      ],
    },
    {
      id: "L2-10",
      lesson: "L2",
      ref: "Lesson 2 · Exercise 8 · Family members table (page 8)",
      stem: "Complete the family members table.",
      parts: [
        {
          id: "L2-10a",
          type: "mcq",
          label: "a",
          prompt: "Which word is a female family member?",
          options: ["nephew", "niece", "grandson"],
          answer: "niece",
          marks: 1,
        },
        {
          id: "L2-10b",
          type: "mcq",
          label: "b",
          prompt: "Which word is a plural / group word?",
          options: ["daughter", "parents", "husband"],
          answer: "parents",
          marks: 1,
        },
      ],
    },
  ],

  /* ============= LESSON 3 · DAILY ROUTINES (pp. 9–11) ============== */
  L3: [
    {
      id: "L3-1",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 5 · Frequency chart (page 10)",
      stem: "Look at the chart. Each tick (✓) is a day the action happened, each cross (✕) is a day it did not. Write the frequency adverb.",
      table: {
        caption: "Exercise 5 · Frequency chart",
        headers: ["Frequency adverb", "Sun", "Mon", "Tues", "Wed", "Thur"],
        rows: [
          ["Always", "✓", "✓", "✓", "✓", "✓"],
          ["Usually", "✓", "✓", "✓", "✓", "✕"],
          ["Sometimes", "✓", "✕", "✓", "✕", "✓"],
          ["Never", "✕", "✕", "✕", "✕", "✕"],
        ],
      },
      parts: [
        {
          id: "L3-1a",
          type: "text",
          label: "1",
          prompt: "✓ ✓ ✓ ✓ ✓  I ____________ get up at six o'clock.",
          answer: "always",
          placeholder: "Adverb",
          marks: 1,
        },
        {
          id: "L3-1b",
          type: "text",
          label: "4",
          prompt: "✕ ✕ ✕ ✕ ✕  I ____________ go to bed late.",
          answer: "never",
          placeholder: "Adverb",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-2",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 5 · Frequency chart (page 10)",
      stem: "Write the frequency adverb that matches the five marks.",
      parts: [
        {
          id: "L3-2a",
          type: "text",
          label: "2",
          prompt: "✓ ✓ ✓ ✓ ✕  I ____________ do my homework in the afternoon.",
          answer: "usually",
          placeholder: "Adverb",
          marks: 1,
        },
        {
          id: "L3-2b",
          type: "text",
          label: "3",
          prompt: "✓ ✕ ✓ ✕ ✓  I ____________ chat with my friends online.",
          answer: "sometimes",
          placeholder: "Adverb",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-3",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 7 · Choose between brackets (page 11)",
      stem: "Choose the correct word.",
      parts: [
        {
          id: "L3-3a",
          type: "mcq",
          label: "1",
          prompt: "Lili never ____________ (play / plays) the piano at night.",
          options: ["play", "plays"],
          answer: "plays",
          marks: 1,
        },
        {
          id: "L3-3b",
          type: "mcq",
          label: "3",
          prompt: "Toni always ____________ (have / has) dinner.",
          options: ["have", "has"],
          answer: "has",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-4",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 7 · Choose between brackets (page 11)",
      stem: "Choose the correct word.",
      parts: [
        {
          id: "L3-4a",
          type: "mcq",
          label: "6",
          prompt: "____________ (Do / Does) she play basketball?",
          options: ["Do", "Does"],
          answer: "Does",
          marks: 1,
        },
        {
          id: "L3-4b",
          type: "mcq",
          label: "5",
          prompt: "We ____________ (doesn't / don't) go to school by bus.",
          options: ["doesn't", "don't"],
          answer: "don't",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-5",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 8 · Put the words in the right order (page 11)",
      stem: "Put the words in the right order. Use every word once and keep the punctuation.",
      parts: [
        {
          id: "L3-5a",
          type: "order",
          label: "1",
          prompt: "evening. / usually / pack / the / I / bag / my / in",
          words: ["evening.", "usually", "pack", "the", "I", "bag", "my", "in"],
          answer: "I usually pack my bag in the evening.",
          marks: 1,
        },
        {
          id: "L3-5b",
          type: "order",
          label: "4",
          prompt: "Jad / football / always / every / plays / weekend.",
          words: ["Jad", "football", "always", "every", "plays", "weekend."],
          answer: "Jad always plays football every weekend.",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-6",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 8 (page 11) and Exercise 3 · Ask and answer (page 9)",
      parts: [
        {
          id: "L3-6a",
          type: "order",
          label: "2",
          prompt: "Put the words in the right order: sometimes / breakfast. / don't / We / have",
          words: ["sometimes", "breakfast.", "don't", "We", "have"],
          answer: "We sometimes don't have breakfast.",
          marks: 1,
        },
        {
          id: "L3-6b",
          type: "text",
          label: "b",
          prompt: "Complete the printed example. — What do you always do in the evening? — I always ____________.",
          answer: "go to bed early",
          accepted: ["go to bed early.", "go to bed early!"],
          placeholder: "Three words",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-7",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 6a · Reading: Mira's Friday (page 10)",
      passage: MIRA_PASSAGE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L3-7a",
          type: "tf",
          label: "2",
          prompt: "She doesn't tidy her bedroom.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L3-7b",
          type: "tf",
          label: "4",
          prompt: "Her dad watches the news.",
          answer: "True",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-8",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 6b · Tell who (page 10)",
      passage: MIRA_PASSAGE,
      stem: "Tell who. Write the person from the text who does each thing.",
      parts: [
        {
          id: "L3-8a",
          type: "text",
          label: "1",
          prompt: "Who loves Friday?",
          answer: "Mira",
          placeholder: "Name",
          marks: 1,
        },
        {
          id: "L3-8b",
          type: "text",
          label: "3",
          prompt: "Who doesn't watch the news?",
          answer: "Mira's mother",
          accepted: ["mother", "her mother", "mira's mum", "mira mother"],
          placeholder: "Name",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-9",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 4 · Tell the time (page 10)",
      stem: "Read the time form, then choose the clock time.",
      parts: [
        {
          id: "L3-9a",
          type: "mcq",
          label: "a",
          prompt: "“Twenty to eight” is …",
          options: ["7:40", "8:20", "7:20"],
          answer: "7:40",
          marks: 1,
        },
        {
          id: "L3-9b",
          type: "mcq",
          label: "b",
          prompt: "“Half past seven” is …",
          options: ["7:30", "7:15", "6:30"],
          answer: "7:30",
          marks: 1,
        },
      ],
    },
    {
      id: "L3-10",
      lesson: "L3",
      ref: "Lesson 3 · Exercise 9 · Write sentences about your daily routine (page 11)",
      stem: "Write two true sentences about your own daily routine, using the frames printed in the book.",
      parts: [
        {
          id: "L3-10a",
          type: "rubric",
          label: "2",
          prompt: "Write one sentence that begins “I sometimes …”.",
          starter: "I sometimes ",
          minWords: 4,
          rubric:
            "1 mark for a complete, true sentence about the pupil's own routine beginning “I sometimes …”. Answers will vary — teacher review.",
          marks: 1,
        },
        {
          id: "L3-10b",
          type: "rubric",
          label: "3",
          prompt: "Write one sentence that ends “… in the afternoon.”",
          minWords: 4,
          rubric:
            "1 mark for a complete, true sentence about the pupil's own routine ending “… in the afternoon.” Answers will vary — teacher review.",
          marks: 1,
        },
      ],
    },
  ],

  /* ============= LESSON 4 · THE FIVE SENSES (pp. 12–14) ============ */
  L4: [
    {
      id: "L4-1",
      lesson: "L4",
      ref: "Lesson 4 · Activity 4 · Look and describe (page 13)",
      stem: "Complete the printed sentences.",
      parts: [
        {
          id: "L4-1a",
          type: "text",
          label: "a",
          prompt: "I smell with my ____________.",
          answer: "nose",
          placeholder: "Body part",
          marks: 1,
        },
        {
          id: "L4-1b",
          type: "text",
          label: "b",
          prompt: "We hear with our ____________.",
          answer: "ears",
          accepted: ["ear"],
          placeholder: "Body part",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-2",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 6 · Reading (page 13)",
      passage: SENSES_PASSAGE,
      stem: "Complete from the reading.",
      parts: [
        {
          id: "L4-2a",
          type: "text",
          label: "a",
          prompt: "We see with our ____________.",
          answer: "eyes",
          accepted: ["eye"],
          placeholder: "Body part",
          marks: 1,
        },
        {
          id: "L4-2b",
          type: "text",
          label: "b",
          prompt: "We taste with our ____________.",
          answer: "tongue",
          placeholder: "Body part",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-3",
      lesson: "L4",
      ref: "Lesson 4 · Activity 3 · Look, ask and answer (page 12)",
      stem: "Use the question-and-answer patterns printed on the page.",
      parts: [
        {
          id: "L4-3a",
          type: "mcq",
          label: "a",
          prompt: "“Do you like the smell of flowers?” — choose a printed reply.",
          options: ["Yes, I do / No, I don't.", "It smells nice.", "How does the flower smell?"],
          answer: "Yes, I do / No, I don't.",
          marks: 1,
        },
        {
          id: "L4-3b",
          type: "text",
          label: "b",
          prompt: "“How does the flower smell?” — “It smells ____________.”",
          answer: "nice",
          placeholder: "One word",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-4",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 6a · Write true (T) or false (F) (page 13)",
      passage: SENSES_PASSAGE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L4-4a",
          type: "tf",
          label: "1",
          prompt: "All foods taste the same.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L4-4b",
          type: "tf",
          label: "3",
          prompt: "Our hands can only feel soft things.",
          answer: "False",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-5",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 6a · Write true (T) or false (F) (page 13)",
      passage: SENSES_PASSAGE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L4-5a",
          type: "tf",
          label: "2",
          prompt: "We can touch flowers.",
          answer: "True",
          marks: 1,
        },
        {
          id: "L4-5b",
          type: "tf",
          label: "4",
          prompt: "We know that something is sweet when we taste it.",
          answer: "True",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-6",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 6b · Match the adjectives with the senses (page 13)",
      stem: "Match each adjective with the sense it belongs to.",
      parts: [
        {
          id: "L4-6a",
          type: "mcq",
          label: "a",
          lead: "delicious",
          prompt: "Which sense?",
          options: ["sight", "smell", "hearing", "touch", "taste"],
          answer: "taste",
          marks: 1,
        },
        {
          id: "L4-6b",
          type: "mcq",
          label: "b",
          lead: "hot",
          prompt: "Which sense?",
          options: ["sight", "smell", "hearing", "touch", "taste"],
          answer: "touch",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-7",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 6 · Reading (page 13)",
      passage: SENSES_PASSAGE,
      stem: "Complete a sentence from the reading.",
      parts: [
        {
          id: "L4-7a",
          type: "text",
          label: "a",
          prompt: "They are sight, touch, smell, taste and ____________.",
          answer: "hearing",
          placeholder: "One word",
          marks: 1,
        },
        {
          id: "L4-7b",
          type: "text",
          label: "b",
          prompt: "We smell things that are good or ____________.",
          answer: "bad",
          placeholder: "One word",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-8",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 7 · Choose the correct answer between brackets (page 14)",
      stem: "Choose the correct answer between brackets.",
      parts: [
        {
          id: "L4-8a",
          type: "mcq",
          label: "1",
          prompt: "Flowers ____________ (smell / smells) nice.",
          options: ["smell", "smells"],
          answer: "smell",
          marks: 1,
        },
        {
          id: "L4-8b",
          type: "mcq",
          label: "2",
          prompt: "Hot chocolate ____________ (tastes / feels) sweet.",
          options: ["tastes", "feels"],
          answer: "tastes",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-9",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 7 · Choose the correct answer between brackets (page 14)",
      stem: "Choose the correct answer between brackets.",
      parts: [
        {
          id: "L4-9a",
          type: "mcq",
          label: "3",
          prompt: "How ____________ (do / does) the jacket feel?",
          options: ["do", "does"],
          answer: "does",
          marks: 1,
        },
        {
          id: "L4-9b",
          type: "mcq",
          label: "4",
          prompt: "Lemons don't ____________ (taste / tastes) salty.",
          options: ["taste", "tastes"],
          answer: "taste",
          marks: 1,
        },
      ],
    },
    {
      id: "L4-10",
      lesson: "L4",
      ref: "Lesson 4 · Exercise 8 · Wh-questions or full answers (page 14)",
      stem: "Write the question that goes with each printed answer.",
      parts: [
        {
          id: "L4-10a",
          type: "text",
          label: "3",
          prompt: "Printed answer: “It tastes sweet.” Write the question.",
          answer: "How does it taste?",
          accepted: ["what does it taste like?", "how does it taste", "what does it taste"],
          placeholder: "Write the question",
          marks: 1,
        },
        {
          id: "L4-10b",
          type: "text",
          label: "4",
          prompt: "Printed answer: “She looks pretty.” Write the question.",
          answer: "How does she look?",
          accepted: ["how does she look", "what does she look like?"],
          placeholder: "Write the question",
          marks: 1,
        },
      ],
    },
  ],

  /* ================== LESSON 5 · CLOTHES (pp. 15–20) =============== */
  L5: [
    {
      id: "L5-1",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 5 · Before you read: match the pattern (page 16)",
      stem: "Name the clothing pattern.",
      parts: [
        {
          id: "L5-1a",
          type: "text",
          label: "a",
          prompt: "A skirt with small spots all over it is ____________.",
          answer: "dotted",
          placeholder: "Pattern word",
          marks: 1,
        },
        {
          id: "L5-1b",
          type: "text",
          label: "b",
          prompt: "A skirt with one colour and no pattern is ____________.",
          answer: "plain",
          placeholder: "Pattern word",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-2",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 5 · Before you read: match the pattern (page 16)",
      stem: "Name the clothing pattern.",
      parts: [
        {
          id: "L5-2a",
          type: "text",
          label: "a",
          prompt: "A skirt with flowers on it is ____________.",
          answer: "floral",
          placeholder: "Pattern word",
          marks: 1,
        },
        {
          id: "L5-2b",
          type: "text",
          label: "b",
          prompt: "A skirt with lines across it is ____________.",
          answer: "striped",
          placeholder: "Pattern word",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-3",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 3 · Ask and answer (page 15)",
      stem: "Complete the printed speech bubbles.",
      parts: [
        {
          id: "L5-3a",
          type: "text",
          label: "a",
          prompt: "I'm wearing a pink ____________ dress, socks and shoes.",
          answer: "floral",
          placeholder: "Pattern word",
          marks: 1,
        },
        {
          id: "L5-3b",
          type: "text",
          label: "b",
          prompt: "I'm wearing a blue ____________ and trousers.",
          answer: "T-shirt",
          accepted: ["t-shirt", "tshirt", "t shirt", "tee shirt"],
          placeholder: "Clothes word",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-4",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 6a · “Buying Clothes” true or false (page 16)",
      passage: CLOTHES_DIALOGUE,
      stem: "Write true (T) or false (F).",
      parts: [
        {
          id: "L5-4a",
          type: "tf",
          label: "1",
          prompt: "The woman is looking for a dress.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L5-4b",
          type: "tf",
          label: "2",
          prompt: "She goes shopping in the morning.",
          answer: "True",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-5",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 6a · “Buying Clothes” true or false (page 16)",
      passage: CLOTHES_DIALOGUE,
      parts: [
        {
          id: "L5-5a",
          type: "tf",
          label: "4",
          prompt: "The sweater costs 2000 SP.",
          answer: "False",
          marks: 1,
        },
        {
          id: "L5-5b",
          type: "text",
          label: "b",
          prompt: "What colour sweater would she like?",
          answer: "a striped red sweater",
          accepted: ["striped red sweater", "red striped sweater", "a red striped sweater"],
          placeholder: "Write the phrase",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-6",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 6a · Order these sentences (page 16)",
      stem: "Write the number that shows where each sentence belongs in the conversation (1–6).",
      passage: CLOTHES_DIALOGUE,
      parts: [
        {
          id: "L5-6a",
          type: "mcq",
          label: "3",
          prompt: "“How can I help you?”",
          options: ORDER_OPTIONS,
          answer: "1",
          marks: 1,
        },
        {
          id: "L5-6b",
          type: "mcq",
          label: "6",
          prompt: "“It's 3000 SP.”",
          options: ORDER_OPTIONS,
          answer: "6",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-7",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 6a · Order these sentences (page 16)",
      stem: "Write the number that shows where each sentence belongs in the conversation (1–6).",
      passage: CLOTHES_DIALOGUE,
      parts: [
        {
          id: "L5-7a",
          type: "mcq",
          label: "4",
          prompt: "“I'd like a sweater.”",
          options: ORDER_OPTIONS,
          answer: "2",
          marks: 1,
        },
        {
          id: "L5-7b",
          type: "mcq",
          label: "5",
          prompt: "“How much is it?”",
          options: ORDER_OPTIONS,
          answer: "5",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-8",
      lesson: "L5",
      ref: "Revision 1 · 1 Match (page 18)",
      stem: "Match each question with the correct answer.",
      parts: [
        {
          id: "L5-8a",
          type: "mcq",
          label: "1",
          lead: "What are you wearing?",
          prompt: "Choose the answer.",
          options: [
            "It's 5000 SP.",
            "A blue blouse and a plain skirt.",
            "Yes, I do.",
            "It's by the sea.",
            "I go to bed at 10:00.",
          ],
          answer: "A blue blouse and a plain skirt.",
          marks: 1,
        },
        {
          id: "L5-8b",
          type: "mcq",
          label: "5",
          lead: "How much is the dress?",
          prompt: "Choose the answer.",
          options: [
            "It's 5000 SP.",
            "A blue blouse and a plain skirt.",
            "Yes, I do.",
            "It's by the sea.",
            "I go to bed at 10:00.",
          ],
          answer: "It's 5000 SP.",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-9",
      lesson: "L5",
      ref: "Lesson 5 · Exercise 7 · Read and number (page 17)",
      stem: "Read the four printed sentences, then choose what each child is wearing.",
      parts: [
        {
          id: "L5-9a",
          type: "mcq",
          label: "4",
          prompt: "What is Rami wearing?",
          options: [
            "a red sweater, grey trousers and red shoes",
            "a green T-shirt, grey shorts, white socks and brown shoes",
            "a blue jacket, a blue skirt, a white shirt and grey shoes",
          ],
          answer: "a red sweater, grey trousers and red shoes",
          marks: 1,
        },
        {
          id: "L5-9b",
          type: "mcq",
          label: "3",
          prompt: "What is Sami wearing?",
          options: [
            "a red sweater, grey trousers and red shoes",
            "a green T-shirt, grey shorts, white socks and brown shoes",
            "a blue jacket, a blue skirt, a white shirt and grey shoes",
          ],
          answer: "a green T-shirt, grey shorts, white socks and brown shoes",
          marks: 1,
        },
      ],
    },
    {
      id: "L5-10",
      lesson: "L5",
      ref: "Revision 1 · 2 Choose a, b or c (page 18) and Revision 1 · 5 (page 19)",
      stem: "Choose the correct word.",
      parts: [
        {
          id: "L5-10a",
          type: "mcq",
          label: "1",
          prompt: "What ____________ are you? (size / colour / cost)",
          options: ["size", "colour", "cost"],
          answer: "size",
          marks: 1,
        },
        {
          id: "L5-10b",
          type: "mcq",
          label: "5",
          prompt: "She ____________ (have to / has to) go to school.",
          options: ["have to", "has to"],
          answer: "has to",
          marks: 1,
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Presentation order: interleaved so the paper never runs lesson by    */
/* lesson, while each question keeps its own lesson record.            */
/* ------------------------------------------------------------------ */
function interleave(source: Record<LessonId, Question[]>): Question[] {
  const queues = LESSON_ORDER.map((id) => [...source[id]]);
  const out: Question[] = [];
  let guard = 0;
  while (queues.some((q) => q.length > 0) && guard < 500) {
    guard += 1;
    for (const q of queues) {
      const next = q.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

export const QUESTIONS: Question[] = interleave(BY_LESSON);

export const ALL_PARTS: Part[] = QUESTIONS.flatMap((q) => q.parts);
export const TOTAL_QUESTIONS = QUESTIONS.length;
export const TOTAL_MARKS = ALL_PARTS.reduce((sum, p) => sum + p.marks, 0);

export function questionsForLesson(id: LessonId): Question[] {
  return QUESTIONS.filter((q) => q.lesson === id);
}

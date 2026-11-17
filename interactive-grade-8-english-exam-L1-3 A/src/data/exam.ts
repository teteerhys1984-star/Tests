/**
 * Grade 8 — Unit 1 — Lessons 1, 2 and 3 · Model A
 * All question content is transcribed from the official curriculum repository
 * (teteerhys1984-star/E_Curriculum_1_9) Grade 8 lesson pages.
 */

export type Part =
  | { kind: "mc"; stem?: string; options: string[]; answer: number }
  | { kind: "tf"; stem: string; answer: boolean }
  | { kind: "text"; stem: string; answers: string[]; key: string };

export type StudentPartAnswer = number | boolean | string | null;

export interface Question {
  id: number;
  lesson: 1 | 2 | 3;
  marks: number;
  typeLabel: string;
  instruction: string;
  /** Optional block of text shown above the parts (not a reading passage). */
  context?: string;
  /** When true the parts are rendered inside the context at {{0}}, {{1}} … markers. */
  inline?: boolean;
  passage?: "p1" | "p2";
  parts: Part[];
  ref: string;
  explanation: string;
}

export interface Passage {
  id: "p1" | "p2";
  title: string;
  source: string;
  blocks: string[];
  bullets?: string[];
}

export const PASSAGES: Record<"p1" | "p2", Passage> = {
  p1: {
    id: "p1",
    title: "Schools in the Past, Present and Future",
    source: "Reading text",
    blocks: [
      "In the past and about 30 years ago, there were no computers or Internet as we have today. At that period, schools weren't provided with technological innovations of our time.",
      "The 21  century schools have changed with the development of modern technology and the needs of students. Nowadays, teachers and students use modern technologies.They are using the Internet, computers, laptops, mobiles and a number of other means which are continually being improved and updated. Modern technologies have played a major role in education so that teachers no longer have to rely on their traditional methods of teaching. That's why the concept of a future school comes in. A future school combines high-quality education with the possibility of new technologies in order to convey useful and practical knowledge.",
      "Future educators will have to face the fact that students will need to learn in a flexible, personalized format.This may mean having a more technology-focused classroom. In these future schools, students will prefer their learning experience to meet their interests, their academic needs and their future careers.",
      "Some of the main features that are expected to be changed in the system of future schools are:",
    ],
    bullets: [
      "flying vehicles instead of school buses,",
      "robotic teachers instead of humans,",
      "practical work more than books.",
    ],
  },
  p2: {
    id: "p2",
    title: "My Amazing Journey",
    source: "Reading text",
    blocks: [
      "People need to interact and communicate with others. Travel is a means of amusement and enjoyment that allows interaction among people.",
      "I would like to share with you a journey to Spain accompanied by my family.",
      "The tourist company had done an amazing job. It organized the trip and confirmed the dates and places that we were going to visit in Spain. Our flight tickets showed that we needed two hours to reach our destination, which is about 800 kilometers.",
      "Upon arrival, a bus was waiting to drive us to the hotel. We enjoyed the beautiful views and lots of amazing things on our way to the hotel. We passed through a mountainous area with many high volcanic mountains. After checking in our rooms, we headed to a small restaurant which served delicious traditional food.The view from the restaurant was great.",
      "During the three-day trip,we visited various ancient sites and old markets and we bought nice souvenirs for our friends.",
      "Besides, we met people from different nationalities and we learnt about various traditions and cultures. That amazing trip has increased our knowledge about the world.",
      "At the end of the trip, we thanked the trip supervisor and the tourism company for their great efforts.",
    ],
  },
};

export const LESSONS = [
  { id: 1 as const, title: "Future Plans", from: 1, to: 10, marks: 33, color: "#0B5CFF" },
  { id: 2 as const, title: "School Challenges", from: 11, to: 20, marks: 34, color: "#0FC7C7" },
  { id: 3 as const, title: "Let’s Discover", from: 21, to: 30, marks: 33, color: "#FF7A18" },
];

const IDENTIFY = ["Present Simple", "Present Progressive", "Future with will", "Future with going to"];

export const QUESTIONS: Question[] = [
  /* ---------------------------------------------------------------- LESSON 1 */
  {
    id: 1,
    lesson: 1,
    marks: 3,
    typeLabel: "Multiple choice",
    instruction: "Read the passage again and choose the correct answer.",
    passage: "p1",
    parts: [
      {
        kind: "mc",
        stem: "According to the passage, in the past and about 30 years ago, there were …",
        options: [
          "no computers or Internet as we have today",
          "modern laptops and mobiles in every school",
          "robotic teachers instead of humans",
        ],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "A future school combines high-quality education …",
        options: [
          "with flying vehicles instead of school buses",
          "with the possibility of new technologies",
          "with practical work instead of books",
        ],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "What do teachers and students use nowadays?",
        options: [
          "only their traditional methods of teaching",
          "modern technologies such as the Internet, computers and laptops",
          "books instead of practical work",
        ],
        answer: 1,
      },
    ],
    ref: "Student’s Book, page 7 (Reading) — tasks, page 8",
    explanation:
      "The passage states there were “no computers or Internet as we have today”, that a future school “combines high-quality education with the possibility of new technologies”, and that nowadays teachers and students “use modern technologies”.",
  },
  {
    id: 2,
    lesson: 1,
    marks: 3,
    typeLabel: "Short answer",
    instruction: "Answer the following questions in complete sentences.",
    passage: "p1",
    parts: [
      {
        kind: "text",
        stem: "Why don’t teachers have to rely on their traditional methods of teaching anymore?",
        answers: [
          "because modern technologies have played a major role in education",
          "modern technologies have played a major role in education",
        ],
        key: "Because modern technologies have played a major role in education.",
      },
      {
        kind: "text",
        stem: "What may the future classroom be like?",
        answers: [
          "it may be more technology-focused",
          "more technology-focused",
          "it may mean having a more technology-focused classroom",
          "having a more technology-focused classroom",
        ],
        key: "It may mean having a more technology-focused classroom.",
      },
      {
        kind: "text",
        stem: "What do students in future schools want their learning experience to meet?",
        answers: ["their interests, their academic needs and their future careers"],
        key: "Their interests, their academic needs and their future careers.",
      },
    ],
    ref: "Student’s Book, page 7 (Reading) — tasks, page 8",
    explanation:
      "Each answer is taken directly from the passage: modern technologies “have played a major role”, the classroom “may … be more technology-focused”, and students want their experience to meet “their interests, their academic needs and their future careers”.",
  },
  {
    id: 3,
    lesson: 1,
    marks: 3,
    typeLabel: "True / False",
    instruction: "Decide whether each statement is True or False according to the passage.",
    passage: "p1",
    parts: [
      { kind: "tf", stem: "In the past, schools were provided with the technological innovations of our time.", answer: false },
      { kind: "tf", stem: "A future school combines high-quality education with the possibility of new technologies.", answer: true },
      { kind: "tf", stem: "In future schools, practical work will come more than books.", answer: true },
    ],
    ref: "Student’s Book, page 7 (Reading) — tasks, page 8",
    explanation:
      "1) False — schools “weren’t provided with technological innovations of our time”. 2) True — this sentence is printed in the passage. 3) True — the feature list ends with “practical work more than books”.",
  },
  {
    id: 4,
    lesson: 1,
    marks: 4,
    typeLabel: "Multiple choice",
    instruction: "Choose the correct answer a, b or c.",
    passage: "p1",
    parts: [
      {
        kind: "mc",
        stem: "Before the 21st century, technology was …………… it is used today.",
        options: ["never used as", "used less than", "used the same as"],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "Nowadays technologies are …………… being improved and updated.",
        options: ["carelessly", "continuously", "completely"],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "Modern technologies have played a …………… in education.",
        options: ["main role", "minor role", "useless function"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "Future education will ……………",
        options: ["be based on traditional ways.", "depend on functional activities.", "rely on books during school work."],
        answer: 1,
      },
    ],
    ref: "Student’s Book, page 8 — Reading task B",
    explanation:
      "b. used less than (the past had no computers or Internet) · b. continuously (“continually being improved and updated”) · a. major/main role (printed wording) · b. depend on functional activities (“practical work more than books”).",
  },
  {
    id: 5,
    lesson: 1,
    marks: 3,
    typeLabel: "Fill in the blank",
    instruction: "Complete the sentences with ONE word from the passage.",
    passage: "p1",
    parts: [
      {
        kind: "text",
        stem: "A future school combines high-quality education with the __________ of new technologies.",
        answers: ["possibility"],
        key: "possibility",
      },
      {
        kind: "text",
        stem: "Students will prefer their learning experience to meet their interests, their academic needs and their future __________.",
        answers: ["careers"],
        key: "careers",
      },
      {
        kind: "text",
        stem: "Some of the main features that are expected to be __________ in the system of future schools are …",
        answers: ["changed"],
        key: "changed",
      },
    ],
    ref: "Student’s Book, page 7 (Reading)",
    explanation: "The three words are printed in the passage: “the possibility of new technologies”, “their future careers”, “expected to be changed”.",
  },
  {
    id: 6,
    lesson: 1,
    marks: 4,
    typeLabel: "Choose the correct tense",
    instruction: "Select the correct tense between brackets.",
    parts: [
      { kind: "mc", stem: "She is very good at English. She (understands / understand) English very well.", options: ["understands", "understand"], answer: 0 },
      { kind: "mc", stem: "She (works / is working) at this moment.", options: ["works", "is working"], answer: 1 },
      { kind: "mc", stem: "They (visit / will visit) The National Museum next week.", options: ["visit", "will visit"], answer: 1 },
      { kind: "mc", stem: "He (spends / is going to spend) his vacation in Lattakia next summer.", options: ["spends", "is going to spend"], answer: 1 },
    ],
    ref: "Student’s Book, page 9 — Grammar: Revision of tenses (A)",
    explanation:
      "understands — a fact/habit takes the present simple with -s · is working — “at this moment” signals the present progressive · will visit — “next week” signals the future · is going to spend — “next summer” is a plan made before speaking.",
  },
  {
    id: 7,
    lesson: 1,
    marks: 3,
    typeLabel: "Complete the sentence",
    instruction: "Complete each sentence with the correct verb form from the cue in brackets.",
    parts: [
      { kind: "text", stem: "__________ rice every day?  (he / eat)", answers: ["does he eat"], key: "Does he eat" },
      { kind: "text", stem: "I __________ at the moment.  ( I / work)", answers: ["am working", "i am working"], key: "am working" },
      { kind: "text", stem: "__________ to London often?  (she / come)", answers: ["does she come"], key: "Does she come" },
    ],
    ref: "Workbook, page 4 — Grammar practice (B)",
    explanation: "“every day” and “often” are habits, so the present simple question needs does + base verb; “at the moment” needs the present progressive.",
  },
  {
    id: 8,
    lesson: 1,
    marks: 4,
    typeLabel: "Identify the tense",
    instruction: "Identify the tense of each sentence.",
    parts: [
      { kind: "mc", stem: "Water boils at 100 degrees.", options: IDENTIFY, answer: 0 },
      { kind: "mc", stem: "I’m drinking too much coffee these days because I’m so busy at work.", options: IDENTIFY, answer: 1 },
      { kind: "mc", stem: "We will go to the theater tomorrow.", options: IDENTIFY, answer: 2 },
      { kind: "mc", stem: "They are going to spend their vacation in Spain next year.", options: IDENTIFY, answer: 3 },
    ],
    ref: "Workbook, page 4 — Grammar reference tables",
    explanation: "Facts and regular actions → present simple · activities happening now / these days → present progressive · “will” for a future decision or prediction · “be going to” for a planned future event.",
  },
  {
    id: 9,
    lesson: 1,
    marks: 3,
    typeLabel: "will or going to",
    instruction: "Choose the correct future form according to the rules.",
    parts: [
      {
        kind: "mc",
        stem: "I have just decided: I (will carry / am going to carry) your bags.",
        options: ["will carry", "am going to carry"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "The tickets are already booked, so we (will travel / are going to travel) to Aleppo next month.",
        options: ["will travel", "are going to travel"],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "The school year (will start / is going to start) in September; it always starts in September.",
        options: ["will start", "is going to start"],
        answer: 0,
      },
    ],
    ref: "Workbook, page 4 — Future Tense table",
    explanation: "will → a decision made at the moment of speaking, a promise, or a fact about the future · going to → an event planned before the moment of speaking.",
  },
  {
    id: 10,
    lesson: 1,
    marks: 3,
    typeLabel: "Complete with the correct form",
    instruction: "Write the correct form of the verb in brackets.",
    parts: [
      { kind: "text", stem: "Every Friday, we __________ an English lesson.  (have)", answers: ["have"], key: "have" },
      { kind: "text", stem: "Be quiet! The baby __________ in the next room.  (sleep)", answers: ["is sleeping"], key: "is sleeping" },
      { kind: "text", stem: "I __________ what you mean.  (understand)", answers: ["understand"], key: "understand" },
    ],
    ref: "Workbook, page 4 — Present Simple / Present Progressive tables",
    explanation: "“Every Friday” → present simple habit · “Be quiet! … in the next room” → happening now, present progressive · a permanent truth → present simple.",
  },

  /* ---------------------------------------------------------------- LESSON 2 */
  {
    id: 11,
    lesson: 2,
    marks: 4,
    typeLabel: "Choose the correct tense",
    instruction: "Select the correct tense between brackets.",
    parts: [
      { kind: "mc", stem: "She (read / was reading) a book when the phone rang.", options: ["read", "was reading"], answer: 1 },
      { kind: "mc", stem: "When they (were arriving / arrived), we were waiting for the bus.", options: ["arrived", "were arriving"], answer: 0 },
      { kind: "mc", stem: "I was studying when the electricity (went / goes) out.", options: ["goes", "went"], answer: 1 },
      { kind: "mc", stem: "I (break / broke) my arm while we were playing football.", options: ["broke", "break"], answer: 0 },
    ],
    ref: "Workbook, page 8 — Past Simple and Past Progressive (A)",
    explanation:
      "was reading — the phone rang while a longer action was in progress · arrived — the completed past action, while “we were waiting” was already in progress · went — the shorter interrupting action is past simple · broke — the event that interrupted “were playing”.",
  },
  {
    id: 12,
    lesson: 2,
    marks: 4,
    typeLabel: "Complete with the correct tense",
    instruction: "Write the verbs between brackets in the correct tense.",
    parts: [
      { kind: "text", stem: "When the lights __________ out, I was taking a bath.  (go)", answers: ["went"], key: "went" },
      { kind: "text", stem: "He found a coin while he __________ .  (walk)", answers: ["was walking"], key: "was walking" },
      { kind: "text", stem: "It was raining heavily when they __________ an accident.  (have)", answers: ["had"], key: "had" },
      { kind: "text", stem: "I __________ home when I met my friend.  (drive)", answers: ["was driving"], key: "was driving" },
    ],
    ref: "Workbook, page 8 — Past Simple and Past Progressive (B)",
    explanation: "The shorter event takes the past simple (went, had) and the longer background action takes the past progressive (was walking, was driving).",
  },
  {
    id: 13,
    lesson: 2,
    marks: 4,
    typeLabel: "Grammar in context",
    instruction: "Complete the paragraph with the suitable verb tenses from the list: was carrying, was wondering, came, was walking, decided, came up, stood.",
    context:
      "I won’t forget what had happened before I (1) __________ to live here. I’m going to tell you the story which happened ten years ago. I (2) __________ down the street when suddenly a man (3) __________ to me and asked me to lend him some money. Well, he (4) __________ a big stick and he looked a bit dangerous. I (5) __________ still in my place for about five seconds and I (6) __________ what to do. Then I (7) __________ to run away without the slightest hesitation.",
    inline: true,
    parts: [
      { kind: "text", stem: "", answers: ["came"], key: "came" },
      { kind: "text", stem: "", answers: ["was walking"], key: "was walking" },
      { kind: "text", stem: "", answers: ["came up"], key: "came up" },
      { kind: "text", stem: "", answers: ["was carrying"], key: "was carrying" },
    ],
    ref: "Student’s Book, page 14 — Grammar in context",
    explanation: "Blanks 1–4: came (past simple, finished event) · was walking (action in progress when something happened) · came up (past simple) · was carrying (the longer action in progress).",
  },
  {
    id: 14,
    lesson: 2,
    marks: 3,
    typeLabel: "Grammar in context",
    instruction: "Complete the rest of the paragraph with the suitable verb tenses from the same list.",
    context:
      "I won’t forget what had happened before I (1) __________ to live here. I’m going to tell you the story which happened ten years ago. I (2) __________ down the street when suddenly a man (3) __________ to me and asked me to lend him some money. Well, he (4) __________ a big stick and he looked a bit dangerous. I (5) __________ still in my place for about five seconds and I (6) __________ what to do. Then I (7) __________ to run away without the slightest hesitation.",
    inline: true,
    parts: [
      { kind: "text", stem: "", answers: ["stood"], key: "stood" },
      { kind: "text", stem: "", answers: ["was wondering"], key: "was wondering" },
      { kind: "text", stem: "", answers: ["decided"], key: "decided" },
    ],
    ref: "Student’s Book, page 14 — Grammar in context",
    explanation: "Blanks 5–7: stood (a completed past action) · was wondering (the action in progress) · decided (a completed past decision).",
  },
  {
    id: 15,
    lesson: 2,
    marks: 3,
    typeLabel: "Choose the correct tense",
    instruction: "Select the correct tense between brackets.",
    parts: [
      { kind: "mc", stem: "My stereo (stops / stopped) working last night.", options: ["stops", "stopped"], answer: 1 },
      { kind: "mc", stem: "The weather (is / was) dreadful at the weekend.", options: ["was", "is"], answer: 0 },
      { kind: "mc", stem: "John was playing tennis when he (hurts / hurt) his leg.", options: ["hurts", "hurt"], answer: 1 },
    ],
    ref: "Student’s Book, page 14 — Select the correct tense",
    explanation: "“last night” and “at the weekend” place the action in the past, so the past simple is used: stopped, was, hurt.",
  },
  {
    id: 16,
    lesson: 2,
    marks: 3,
    typeLabel: "Complete the sentence",
    instruction: "Complete each sentence with the past simple or past progressive form of the verb.",
    parts: [
      { kind: "text", stem: "While I __________ TV, the lights went out.  (watch)", answers: ["was watching"], key: "was watching" },
      { kind: "text", stem: "The bell __________ while we were having lunch.  (ring)", answers: ["rang"], key: "rang" },
      { kind: "text", stem: "When the teacher came in, the students __________ .  (talk)", answers: ["were talking"], key: "were talking" },
    ],
    ref: "Workbook, page 8 — Past Simple and Past Progressive",
    explanation: "The action already in progress takes the past progressive (was watching, were talking); the shorter event that interrupts it takes the past simple (rang).",
  },
  {
    id: 17,
    lesson: 2,
    marks: 3,
    typeLabel: "Choose the correct combination",
    instruction: "Choose the correct combination of the two verb forms.",
    parts: [
      {
        kind: "mc",
        stem: "While we (eat) the cake, John (come).",
        options: ["were eating / came", "ate / came", "was eating / comes"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "When the phone rang, I (do) my homework and my brother (watch) TV.",
        options: ["did / watched", "do / watch", "was doing / was watching"],
        answer: 2,
      },
      {
        kind: "mc",
        stem: "Samer (have) a shower when the doorbell (ring).",
        options: ["had / rang", "was having / rang", "having / rings"],
        answer: 1,
      },
    ],
    ref: "Workbook, page 8 — Past Simple and Past Progressive (B)",
    explanation: "Two actions in progress in the past → past progressive for both; a longer background action with a shorter interrupting event → past progressive + past simple.",
  },
  {
    id: 18,
    lesson: 2,
    marks: 4,
    typeLabel: "Correct the verb-form error",
    instruction: "Find and correct the verb-form error in each sentence.",
    parts: [
      { kind: "mc", stem: "I was study when the electricity went out.", options: ["I was study …", "I was studying …", "I were studying …"], answer: 1 },
      { kind: "mc", stem: "When the lights went out, I was take a bath.", options: ["I was take …", "I was taking …", "I took …"], answer: 1 },
      { kind: "mc", stem: "He found a coin while he was walk in the park.", options: ["he was walk …", "he walked …", "he was walking …"], answer: 2 },
      { kind: "mc", stem: "John was playing tennis when he hurts his leg.", options: ["he hurts …", "he hurt …", "he was hurting …"], answer: 1 },
    ],
    ref: "Workbook, page 8 / Student’s Book, page 14",
    explanation: "The verb after “was/were” must be the -ing form (was studying, was taking, was walking); the shorter interrupting action must be past simple (hurt).",
  },
  {
    id: 19,
    lesson: 2,
    marks: 3,
    typeLabel: "Identify the tense",
    instruction: "Identify the tense used in each sentence.",
    parts: [
      { kind: "mc", stem: "I went to the library yesterday.", options: ["Past Simple", "Past Progressive"], answer: 0 },
      { kind: "mc", stem: "Ahmad was watching T.V.", options: ["Past Simple", "Past Progressive"], answer: 1 },
      { kind: "mc", stem: "Did you go to the library yesterday?", options: ["Past Simple", "Past Progressive"], answer: 0 },
    ],
    ref: "Workbook, page 8 — reference tables",
    explanation: "The past simple describes an action that happened (affirmative and interrogative forms); the past progressive describes an action that was in progress.",
  },
  {
    id: 20,
    lesson: 2,
    marks: 3,
    typeLabel: "Choose the correct answer",
    instruction: "Choose the correct answer a, b or c according to the context.",
    parts: [
      {
        kind: "mc",
        stem: "We were waiting for the bus when the train …………… .",
        options: ["arrives", "arrived", "was arriving"],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "The teacher …………… angry because we were talking.",
        options: ["was", "was being", "is"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "He was not …………… attention in class yesterday.",
        options: ["pay", "paid", "paying"],
        answer: 2,
      },
    ],
    ref: "Workbook, page 8 / Student’s Book, page 14",
    explanation: "The interrupting event is past simple (arrived) · a state in the past takes the past simple, not the progressive (was angry) · the negative of the past progressive is was/were not + -ing (was not paying).",
  },

  /* ---------------------------------------------------------------- LESSON 3 */
  {
    id: 21,
    lesson: 3,
    marks: 4,
    typeLabel: "Multiple choice",
    instruction: "Read the passage again and choose the correct answer.",
    passage: "p2",
    parts: [
      { kind: "mc", stem: "The writer travelled with his …", options: ["teachers", "friends", "family"], answer: 2 },
      {
        kind: "mc",
        stem: "What kind of food did the restaurant serve?",
        options: ["delicious traditional food", "international fast food", "seafood from the coast"],
        answer: 0,
      },
      { kind: "mc", stem: "How long did the trip last?", options: ["two days", "three days", "one week"], answer: 1 },
      {
        kind: "mc",
        stem: "What did the travellers see on their way to the hotel?",
        options: ["a large green forest", "a busy city centre", "a mountainous area with many high volcanic mountains"],
        answer: 2,
      },
    ],
    ref: "Student’s Book, page 21 (Reading) — tasks, page 22",
    explanation: "The journey was “accompanied by my family”; the restaurant “served delicious traditional food”; the trip lasted “three-day”; on the way they passed “a mountainous area with many high volcanic mountains”.",
  },
  {
    id: 22,
    lesson: 3,
    marks: 3,
    typeLabel: "Short answer",
    instruction: "Answer the following questions in complete sentences.",
    passage: "p2",
    parts: [
      {
        kind: "text",
        stem: "Why is travelling an interesting activity?",
        answers: [
          "because travel is a means of amusement and enjoyment that allows interaction among people",
          "travel is a means of amusement and enjoyment that allows interaction among people",
          "it is a means of amusement and enjoyment that allows interaction among people",
        ],
        key: "Because travel is a means of amusement and enjoyment that allows interaction among people.",
      },
      {
        kind: "text",
        stem: "What did the tourist company do?",
        answers: [
          "it organized the trip and confirmed the dates and places",
          "organized the trip and confirmed the dates and places",
          "it organised the trip and confirmed the dates and places",
        ],
        key: "It organized the trip and confirmed the dates and places that the travellers were going to visit in Spain.",
      },
      {
        kind: "text",
        stem: "What did they buy for their friends?",
        answers: ["nice souvenirs", "souvenirs"],
        key: "Nice souvenirs.",
      },
    ],
    ref: "Student’s Book, page 21 (Reading) — tasks, page 22",
    explanation: "All three answers are printed in the passage: travel “is a means of amusement and enjoyment that allows interaction”, the company “organized the trip and confirmed the dates and places”, and “we bought nice souvenirs for our friends”.",
  },
  {
    id: 23,
    lesson: 3,
    marks: 4,
    typeLabel: "True / False",
    instruction: "Decide whether each statement is True or False according to the passage.",
    passage: "p2",
    parts: [
      { kind: "tf", stem: "The flight tickets showed that the travellers needed two days to reach their destination.", answer: false },
      { kind: "tf", stem: "Upon arrival, a bus was waiting to drive the travellers to the hotel.", answer: true },
      { kind: "tf", stem: "During the trip, the travellers met people from different nationalities.", answer: true },
      { kind: "tf", stem: "The travellers thanked the trip supervisor at the beginning of the trip.", answer: false },
    ],
    ref: "Student’s Book, page 21 (Reading) — tasks, page 22",
    explanation: "1) False — “we needed two hours”. 2) True — printed in paragraph 4. 3) True — “we met people from different nationalities”. 4) False — “At the end of the trip”.",
  },
  {
    id: 24,
    lesson: 3,
    marks: 3,
    typeLabel: "Multiple choice",
    instruction: "Choose the correct answer a, b or c.",
    passage: "p2",
    parts: [
      { kind: "mc", stem: "The destination of the trip is about …………… kilometers.", options: ["eighty", "eight hundred", "eight"], answer: 1 },
      { kind: "mc", stem: "The tourist company had ……………", options: ["done an amazing job", "cancelled the trip", "lost the flight tickets"], answer: 0 },
      { kind: "mc", stem: "We were …………… the efforts of the company and the trip supervisor.", options: ["unsatisfied with", "upset about", "grateful for"], answer: 2 },
    ],
    ref: "Student’s Book, page 21 (Reading) — tasks, page 22",
    explanation: "“about 800 kilometers” · “The tourist company had done an amazing job” · the travellers “thanked” the supervisor and company, so they were grateful for their efforts.",
  },
  {
    id: 25,
    lesson: 3,
    marks: 3,
    typeLabel: "Fill in the blank",
    instruction: "Complete the sentences with ONE word from the passage.",
    passage: "p2",
    parts: [
      {
        kind: "text",
        stem: "Travel is a means of __________ and enjoyment that allows interaction among people.",
        answers: ["amusement"],
        key: "amusement",
      },
      {
        kind: "text",
        stem: "We passed through a __________ area with many high volcanic mountains.",
        answers: ["mountainous"],
        key: "mountainous",
      },
      {
        kind: "text",
        stem: "At the end of the trip, we thanked the trip __________ and the tourism company.",
        answers: ["supervisor"],
        key: "supervisor",
      },
    ],
    ref: "Student’s Book, page 21 (Reading)",
    explanation: "The three words are printed in the passage: “amusement and enjoyment”, “a mountainous area”, “the trip supervisor”.",
  },
  {
    id: 26,
    lesson: 3,
    marks: 4,
    typeLabel: "Present perfect",
    instruction: "Put the verbs into the correct form (present perfect tense).",
    parts: [
      { kind: "text", stem: "We __________ (not / plan) our holiday yet.", answers: ["haven’t planned", "have not planned", "havent planned"], key: "haven’t planned" },
      { kind: "text", stem: "Where __________ (you / be)? I haven’t seen you for ages.", answers: ["have you been"], key: "have you been" },
      { kind: "text", stem: "She __________ (not / see) him for a long time.", answers: ["hasn’t seen", "has not seen", "hasnt seen"], key: "hasn’t seen" },
      { kind: "text", stem: "School __________ (just / start).", answers: ["has just started"], key: "has just started" },
    ],
    ref: "Workbook, page 12 — Revision of the present perfect tense (A)",
    explanation: "have/has + past participle: haven’t planned (yet → negative) · have you been (question) · hasn’t seen (third person negative) · has just started (just goes between has and the participle).",
  },
  {
    id: 27,
    lesson: 3,
    marks: 3,
    typeLabel: "Reported speech",
    instruction: "Select the correct words between brackets.",
    parts: [
      {
        kind: "mc",
        stem: "“I’ve forgotten to bring my lunch with me.” — Jim said that he had forgotten to bring (his / my) lunch with him.",
        options: ["his", "my"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "“We will be home soon.” — My parents told me that they (would be / will be) home soon.",
        options: ["would be", "will be"],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "“I have finished reading the story.” — Gary said that he (has finished / had finished) .",
        options: ["has finished", "had finished"],
        answer: 1,
      },
    ],
    ref: "Student’s Book, page 23 — Reported speech (select the correct words)",
    explanation: "The possessive adjective changes with the pronoun (my → his) · will → would · present perfect → past perfect (has finished → had finished).",
  },
  {
    id: 28,
    lesson: 3,
    marks: 3,
    typeLabel: "Reported speech completion",
    instruction: "Write the sentences in reported speech.",
    parts: [
      {
        kind: "text",
        stem: "“I always forget my things.” — Sally said …",
        answers: ["she always forgot her things", "that she always forgot her things"],
        key: "Sally said (that) she always forgot her things.",
      },
      {
        kind: "text",
        stem: "“Our class is going to the museum.” — Samia and Nada said …",
        answers: ["their class was going to the museum", "that their class was going to the museum"],
        key: "Samia and Nada said (that) their class was going to the museum.",
      },
      {
        kind: "text",
        stem: "“We are having lunch at our house on Saturday.” — Ruba and Sana said …",
        answers: [
          "they were having lunch at their house on Saturday",
          "that they were having lunch at their house on Saturday",
        ],
        key: "Ruba and Sana said (that) they were having lunch at their house on Saturday.",
      },
    ],
    ref: "Workbook, page 13 — Reported speech (C)",
    explanation: "present simple → past simple (forget → forgot) · present continuous → past continuous (are having → were having) · pronouns and possessives change: I → she, our → their, we → they.",
  },
  {
    id: 29,
    lesson: 3,
    marks: 3,
    typeLabel: "Reported speech",
    instruction: "Select the correct words between brackets.",
    parts: [
      { kind: "mc", stem: "She said (her / she) went early.", options: ["her", "she"], answer: 1 },
      { kind: "mc", stem: "He said (we / he) was going to Canada.", options: ["we", "he"], answer: 1 },
      {
        kind: "mc",
        stem: "They told me that they (took / take) (they / their) grandchildren on holiday.",
        options: ["took; their", "take; they", "took; they"],
        answer: 0,
      },
    ],
    ref: "Workbook, page 12 — Reported speech (B)",
    explanation: "A reported statement needs a third-person subject (she, he) · the reporting verb stays in the past simple (took) and the possessive adjective matches the pronoun (their).",
  },
  {
    id: 30,
    lesson: 3,
    marks: 3,
    typeLabel: "Sentence transformation",
    instruction: "Choose the correct reported sentence.",
    parts: [
      {
        kind: "mc",
        stem: "Ali: “I have a headache.”",
        options: [
          "Ali said that he has a headache.",
          "Ali said that he had a headache.",
          "Ali said that I had a headache.",
        ],
        answer: 1,
      },
      {
        kind: "mc",
        stem: "Helena: “Monica doesn’t like parties.”",
        options: [
          "Helena said that Monica didn’t like parties.",
          "Helena said that Monica doesn’t liked parties.",
          "Helena said that Monica didn’t liked parties.",
        ],
        answer: 0,
      },
      {
        kind: "mc",
        stem: "James and Scott: “We have to go now.”",
        options: [
          "James and Scott told me that we had to go now.",
          "James and Scott told me that they have to go now.",
          "James and Scott told me that they had to go then.",
        ],
        answer: 2,
      },
    ],
    ref: "Workbook, page 13 — Reported speech (D)",
    explanation: "present perfect → past perfect (have → had) · present simple negative → past simple negative (doesn’t → didn’t) · pronouns change (we → they) and “now” becomes “then”.",
  },
];

/* ------------------------------------------------------------------ grading */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[“"'(\[]+/, "")
    .replace(/[”"'.,!?;:)\]]+$/, "")
    .replace(/^(the|a|an)\s+/, "")
    .trim();
}

export function isAnswered(q: Question, given: StudentPartAnswer[]): boolean {
  return q.parts.every((p, i) => {
    const v = given[i];
    if (p.kind === "text") return typeof v === "string" && v.trim().length > 0;
    if (p.kind === "tf") return typeof v === "boolean";
    return typeof v === "number";
  });
}

export function partIsCorrect(p: Part, v: StudentPartAnswer): boolean {
  if (p.kind === "mc") return typeof v === "number" && v === p.answer;
  if (p.kind === "tf") return typeof v === "boolean" && v === p.answer;
  if (typeof v !== "string") return false;
  const n = normalize(v);
  if (!n) return false;
  return p.answers.some((a) => normalize(a) === n);
}

export interface PartResult {
  student: string;
  correct: string;
  ok: boolean;
}

export interface QuestionResult {
  question: Question;
  earned: number;
  available: number;
  parts: PartResult[];
}

export interface ExamResult {
  name: string;
  submittedAt: number;
  timeSpentMs: number;
  total: number;
  percent: number;
  lessons: { id: 1 | 2 | 3; title: string; score: number; marks: number }[];
  questions: QuestionResult[];
}

function partCorrectText(p: Part): string {
  if (p.kind === "mc") return p.options[p.answer];
  if (p.kind === "tf") return p.answer ? "True" : "False";
  return p.key;
}

function partStudentText(p: Part, v: StudentPartAnswer): string {
  if (p.kind === "mc") return typeof v === "number" ? p.options[v] : "—";
  if (p.kind === "tf") return typeof v === "boolean" ? (v ? "True" : "False") : "—";
  return typeof v === "string" && v.trim() ? v.trim() : "—";
}

export function gradeExam(answers: Record<number, StudentPartAnswer[]>, name: string, submittedAt: number, timeSpentMs: number): ExamResult {
  const questions: QuestionResult[] = QUESTIONS.map((q) => {
    const given = answers[q.id] ?? [];
    let earned = 0;
    const parts = q.parts.map((p, i) => {
      const v = given[i] ?? null;
      const ok = partIsCorrect(p, v);
      if (ok) earned += 1;
      return { student: partStudentText(p, v), correct: partCorrectText(p), ok };
    });
    return { question: q, earned, available: q.marks, parts };
  });

  const total = questions.reduce((s, r) => s + r.earned, 0);
  const lessons = LESSONS.map((l) => {
    const rs = questions.filter((r) => r.question.lesson === l.id);
    return {
      id: l.id,
      title: l.title,
      score: rs.reduce((s, r) => s + r.earned, 0),
      marks: rs.reduce((s, r) => s + r.available, 0),
    };
  });

  return {
    name,
    submittedAt,
    timeSpentMs,
    total,
    percent: Math.round((total / 100) * 100),
    lessons,
    questions,
  };
}

export const TOTAL_MARKS = QUESTIONS.reduce((s, q) => s + q.marks, 0);
export const TOTAL_QUESTIONS = QUESTIONS.length;

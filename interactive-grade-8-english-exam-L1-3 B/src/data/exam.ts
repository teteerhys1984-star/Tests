/**
 * Grade 8 · Unit 1 · Lessons 1–3 · Model B — examination data.
 *
 * Every item below is taken from the curriculum repository
 * (github.com/teteerhys1984-star/E_Curriculum_1_9):
 *   · grade8-unit1-lesson1-pupil-book.html   (pages 6–11)
 *   · grade8-unit1-lesson1-workbook.html     (pages 2–5)
 *   · grade8-unit1-lesson2-pupil-book.html   (pages 12–18)
 *   · grade8-unit1-lesson2-workbook.html     (pages 6–9)
 *   · grade8-unit1-lesson3-pupil-book.html   (pages 20–25)
 *   · grade8-unit1-lesson3-workbook.html     (pages 10–13)
 *
 * Exactly two reading passages are used (Student's Book p. 7 and p. 21).
 * No listening task, no vocabulary section and no third passage exists here.
 */

export type LessonId = 1 | 2 | 3;

export interface ChoicePart {
  id: string;
  kind: "choice";
  /** Textbook-style stem, printed exactly as in the book where possible. */
  stem: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  marks: number;
}

export interface TextPart {
  id: string;
  kind: "text" | "longtext";
  /** Sentence containing the [[blank]] marker (kind: "text"). */
  stem?: string;
  /** Open question (kind: "longtext"). */
  prompt?: string;
  /** Accepted answers. Compared after normalisation. */
  answers: string[];
  /** "exact" = whole answer must match, "includes" = key phrase must appear. */
  mode: "exact" | "includes";
  marks: number;
}

export type Part = ChoicePart | TextPart;

export interface Question {
  n: number;
  lesson: LessonId;
  instruction: string;
  topic: string;
  source: string;
  explanation: string;
  parts: Part[];
}

export interface Passage {
  lesson: LessonId;
  title: string;
  source: string;
  paragraphs: string[];
}

/* ------------------------------------------------------------------ */
/* The two official reading passages                                   */
/* ------------------------------------------------------------------ */

export const PASSAGES: Passage[] = [
  {
    lesson: 1,
    title: "Schools in the Past, Present and Future",
    source: "Student's Book · Unit 1 · Lesson 1 · page 7",
    paragraphs: [
      "In the past and about 30 years ago, there were no computers or Internet as we have today. At that period, schools weren't provided with technological innovations of our time.",
      "The 21st century schools have changed with the development of modern technology and the needs of students. Nowadays, teachers and students use modern technologies. They are using the Internet, computers, laptops, mobiles and a number of other means which are continually being improved and updated.",
      "Modern technologies have played a major role in education so that teachers no longer have to rely on their traditional methods of teaching. That's why the concept of a future school comes in. A future school combines high-quality education with the possibility of new technologies in order to convey useful and practical knowledge.",
      "Future educators will have to face the fact that students will need to learn in a flexible, personalized format. This may mean having a more technology-focused classroom.",
      "In these future schools, students will prefer their learning experience to meet their interests, their academic needs and their future careers.",
      "Some of the main features that are expected to be changed in the system of future schools are: flying vehicles instead of school buses, robotic teachers instead of humans, practical work more than books.",
    ],
  },
  {
    lesson: 3,
    title: "My Amazing Journey",
    source: "Student's Book · Unit 1 · Lesson 3 · page 21",
    paragraphs: [
      "People need to interact and communicate with others. Travel is a means of amusement and enjoyment that allows interaction among people.",
      "I would like to share with you a journey to Spain accompanied by my family.",
      "The tourist company had done an amazing job. It organized the trip and confirmed the dates and places that we were going to visit in Spain. Our flight tickets showed that we needed two hours to reach our destination, which is about 800 kilometers.",
      "Upon arrival, a bus was waiting to drive us to the hotel. We enjoyed the beautiful views and lots of amazing things on our way to the hotel. We passed through a mountainous area with many high volcanic mountains. After checking in our rooms, we headed to a small restaurant which served delicious traditional food. The view from the restaurant was great.",
      "During the three-day trip, we visited various ancient sites and old markets and we bought nice souvenirs for our friends.",
      "Besides, we met people from different nationalities and we learnt about various traditions and cultures. That amazing trip has increased our knowledge about the world.",
      "At the end of the trip, we thanked the trip supervisor and the tourism company for their great efforts.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

export interface LessonMeta {
  id: LessonId;
  title: string;
  focus: string;
  color: string;
  soft: string;
}

export const LESSONS: LessonMeta[] = [
  {
    id: 1,
    title: "Future Plans",
    focus: "Reading · Present Simple · Present Progressive · will · going to",
    color: "#1257FF",
    soft: "#E4EDFF",
  },
  {
    id: 2,
    title: "School Challenges",
    focus: "Past Simple · Past Progressive · interrupted actions",
    color: "#FF7A18",
    soft: "#FFEFE2",
  },
  {
    id: 3,
    title: "Let's Discover",
    focus: "Reading · Present Perfect · Reported Speech",
    color: "#06B6B0",
    soft: "#DFFAF8",
  },
];

/* ------------------------------------------------------------------ */
/* Questions 1–10 · Lesson 1 · Future Plans · 33 marks                 */
/* ------------------------------------------------------------------ */

const LESSON_1: Question[] = [
  {
    n: 1,
    lesson: 1,
    instruction: "Read the passage again and answer the question.",
    topic: "Reading comprehension",
    source: "Student's Book p. 7–8 · Reading A",
    explanation:
      "4 marks for giving the purpose: a future school combines high-quality education with new technologies in order to convey useful and practical knowledge (i.e. to make ideas known to somebody).",
    parts: [
      {
        id: "q1p1",
        kind: "longtext",
        prompt:
          "Why does a future school combine high-quality education with the possibility of new technologies?",
        answers: [
          "in order to convey useful and practical knowledge",
          "to convey useful and practical knowledge",
          "to make ideas known to somebody",
          "to convey practical knowledge",
        ],
        mode: "includes",
        marks: 4,
      },
    ],
  },
  {
    n: 2,
    lesson: 1,
    instruction: "Choose the correct answer.",
    topic: "Reading comprehension",
    source: "Student's Book p. 8 · Reading B",
    explanation:
      "The passage states that modern technologies \"have played a major role in education\", so main role is the correct choice.",
    parts: [
      {
        id: "q2p1",
        kind: "choice",
        stem: "Modern technologies have played a …………… in education.",
        options: ["main role", "minor role", "useless function"],
        answer: 0,
        marks: 3,
      },
    ],
  },
  {
    n: 3,
    lesson: 1,
    instruction: "Complete the two gaps from the passage.",
    topic: "Reading comprehension",
    source: "Student's Book p. 7 · Reading",
    explanation:
      "2 marks for flying (vehicles instead of school buses) and 2 marks for robotic (teachers instead of humans).",
    parts: [
      {
        id: "q3p1",
        kind: "text",
        stem: "Complete: …………… vehicles instead of school buses.",
        answers: ["flying"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q3p2",
        kind: "text",
        stem: "Complete: …………… teachers instead of humans.",
        answers: ["robotic"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 4,
    lesson: 1,
    instruction: "Choose the correct answer.",
    topic: "Reading comprehension",
    source: "Student's Book p. 8 · Reading B",
    explanation:
      "Before the 21st century there were no computers or Internet, so technology was used less than it is used today.",
    parts: [
      {
        id: "q4p1",
        kind: "choice",
        stem: "Before the 21st century, technology was …………… it is used today.",
        options: ["used less than", "used the same as", "never used as"],
        answer: 1,
        marks: 2,
      },
    ],
  },
  {
    n: 5,
    lesson: 1,
    instruction: "Write True or False according to the passage only.",
    topic: "Reading comprehension",
    source: "Student's Book p. 7 · Reading",
    explanation:
      "False — the passage says that in the past \"schools weren't provided with technological innovations of our time\".",
    parts: [
      {
        id: "q5p1",
        kind: "choice",
        stem: "In the past, schools were provided with the technological innovations of our time.",
        options: ["True", "False"],
        answer: 1,
        marks: 3,
      },
    ],
  },
  {
    n: 6,
    lesson: 1,
    instruction: "Select the correct tense between brackets.",
    topic: "Present Progressive · Future with will",
    source: "Student's Book p. 9 · Grammar A",
    explanation:
      "(a) \"at this moment\" signals an action happening now → present progressive. (b) \"next week\" states a future fact/decision → will.",
    parts: [
      {
        id: "q6p1",
        kind: "choice",
        stem: "She (works – is working) at this moment.",
        options: ["works", "is working"],
        answer: 1,
        marks: 2,
      },
      {
        id: "q6p2",
        kind: "choice",
        stem: "They (visit – will visit) The National Museum next week.",
        options: ["will visit", "visit"],
        answer: 0,
        marks: 2,
      },
    ],
  },
  {
    n: 7,
    lesson: 1,
    instruction: "Select the correct tense between brackets.",
    topic: "Present Simple · Future with going to",
    source: "Student's Book p. 9 · Grammar A",
    explanation:
      "(a) \"whenever\" marks a repeated habit → present simple with -s. (b) \"next summer\" is a plan made before speaking → is going to spend.",
    parts: [
      {
        id: "q7p1",
        kind: "choice",
        stem: "Hani (want – wants) ice-cream whenever we go to the park.",
        options: ["want", "wants"],
        answer: 1,
        marks: 2,
      },
      {
        id: "q7p2",
        kind: "choice",
        stem: "He (spends – is going to spend) his vacation in Lattakia next summer.",
        options: ["is going to spend", "spends"],
        answer: 0,
        marks: 2,
      },
    ],
  },
  {
    n: 8,
    lesson: 1,
    instruction: "Complete with will or the going to form.",
    topic: "Future with will / going to",
    source: "Workbook p. 4 · Future Tense",
    explanation:
      "\"I think it will rain\" expresses a prediction with no planned decision; \"They are going to spend their vacation\" was planned before the time of speaking.",
    parts: [
      {
        id: "q8p1",
        kind: "text",
        stem: "It's cloudy. I think it [[blank]] rain.",
        answers: ["will", "will rain"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q8p2",
        kind: "text",
        stem: "The trip was planned last month. They [[blank]] spend their vacation in Spain next year.",
        answers: ["are going to", "are going to spend"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 9,
    lesson: 1,
    instruction: "Identify the tense used in the sentence.",
    topic: "Revision of tenses",
    source: "Workbook p. 4 · Grammar reference",
    explanation:
      "\"Water boils at 100 degrees\" is a fact that is always true, so it is the present simple.",
    parts: [
      {
        id: "q9p1",
        kind: "choice",
        stem: "Water boils at 100 degrees.",
        options: ["Present Progressive", "Future with will", "Present Simple"],
        answer: 2,
        marks: 3,
      },
    ],
  },
  {
    n: 10,
    lesson: 1,
    instruction: "Choose the sentence that describes an action happening at the moment of speaking.",
    topic: "Present Simple vs Present Progressive",
    source: "Student's Book p. 9 · Grammar A",
    explanation:
      "\"now\" shows an action in progress at the moment of speaking → present progressive. The other three sentences describe habits and facts (whenever, usually, next week).",
    parts: [
      {
        id: "q10p1",
        kind: "choice",
        stem: "Which sentence is in the present progressive?",
        options: [
          "Hani wants ice-cream whenever we go to the park.",
          "We usually arrive on time.",
          "They visit The National Museum next week.",
          "Mom is making dinner now.",
        ],
        answer: 3,
        marks: 2,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Questions 11–20 · Lesson 2 · School Challenges · 34 marks           */
/* ------------------------------------------------------------------ */

const LESSON_2: Question[] = [
  {
    n: 11,
    lesson: 2,
    instruction:
      "Complete the story with the verbs from the list: was carrying, was wondering, came, was walking, decided, came up, stood.",
    topic: "Grammar in context · Past Simple / Past Progressive",
    source: "Student's Book p. 14 · Grammar in context",
    explanation:
      "(1) came — a finished past event. (2) was walking — the longer action in progress. (3) came up — the short action that interrupted it. (4) was carrying — the background detail in progress.",
    parts: [
      {
        id: "q11p1",
        kind: "text",
        stem: "I won't forget what had happened before I [[blank]] to live here.",
        answers: ["came"],
        mode: "exact",
        marks: 1,
      },
      {
        id: "q11p2",
        kind: "text",
        stem: "I [[blank]] down the street when suddenly a man …",
        answers: ["was walking"],
        mode: "exact",
        marks: 1,
      },
      {
        id: "q11p3",
        kind: "text",
        stem: "… suddenly a man [[blank]] to me and asked me to lend him some money.",
        answers: ["came up"],
        mode: "exact",
        marks: 1,
      },
      {
        id: "q11p4",
        kind: "text",
        stem: "Well, he [[blank]] a big stick and he looked a bit dangerous.",
        answers: ["was carrying"],
        mode: "exact",
        marks: 1,
      },
    ],
  },
  {
    n: 12,
    lesson: 2,
    instruction: "Finish the same story with the remaining verbs.",
    topic: "Grammar in context · Past Simple / Past Progressive",
    source: "Student's Book p. 14 · Grammar in context",
    explanation:
      "(5) stood — a completed past action. (6) was wondering — an action in progress for about five seconds. (7) decided — the short action that ended the scene.",
    parts: [
      {
        id: "q12p1",
        kind: "text",
        stem: "I [[blank]] still in my place for about five seconds …",
        answers: ["stood"],
        mode: "exact",
        marks: 1,
      },
      {
        id: "q12p2",
        kind: "text",
        stem: "… and I [[blank]] what to do.",
        answers: ["was wondering"],
        mode: "exact",
        marks: 1,
      },
      {
        id: "q12p3",
        kind: "text",
        stem: "Then I [[blank]] to run away without the slightest hesitation.",
        answers: ["decided"],
        mode: "exact",
        marks: 1,
      },
    ],
  },
  {
    n: 13,
    lesson: 2,
    instruction: "Select the correct tense between brackets.",
    topic: "Past Simple",
    source: "Student's Book p. 14 · Grammar",
    explanation:
      "\"last night\" and \"at the weekend\" place both actions in the finished past, so the past simple is used: stopped, was.",
    parts: [
      {
        id: "q13p1",
        kind: "choice",
        stem: "My stereo (stops – stopped) working last night.",
        options: ["stopped", "stops"],
        answer: 0,
        marks: 2,
      },
      {
        id: "q13p2",
        kind: "choice",
        stem: "The weather (is – was) dreadful at the weekend.",
        options: ["is", "was"],
        answer: 1,
        marks: 2,
      },
    ],
  },
  {
    n: 14,
    lesson: 2,
    instruction: "Select the correct tense between brackets.",
    topic: "Past Progressive vs Past Simple",
    source: "Student's Book p. 14 · Grammar",
    explanation:
      "A longer action in progress (was taking) is interrupted by a short finished action (the telephone rang / hurt his leg), so the short action is past simple.",
    parts: [
      {
        id: "q14p1",
        kind: "choice",
        stem: "Samer (was taking – is taking) a shower when the telephone rang.",
        options: ["is taking", "was taking"],
        answer: 1,
        marks: 2,
      },
      {
        id: "q14p2",
        kind: "choice",
        stem: "John was playing tennis when he (hurts – hurt) his leg.",
        options: ["hurt", "hurts"],
        answer: 0,
        marks: 2,
      },
    ],
  },
  {
    n: 15,
    lesson: 2,
    instruction: "Select the correct tense between brackets.",
    topic: "Past Simple vs Past Progressive",
    source: "Student's Book p. 14 · Grammar",
    explanation:
      "\"when I met my friend\" is a finished past event, so the main action is also past simple: went home.",
    parts: [
      {
        id: "q15p1",
        kind: "choice",
        stem: "I (was going – went) home when I met my friend.",
        options: ["was going", "went", "is going", "will go"],
        answer: 1,
        marks: 3,
      },
    ],
  },
  {
    n: 16,
    lesson: 2,
    instruction: "Write the verbs in brackets in the correct tense.",
    topic: "Past Simple vs Past Progressive",
    source: "Workbook p. 8 · Grammar B",
    explanation:
      "(a) \"went out\" is the short event that interrupted \"was taking a bath\". (b) \"while\" introduces the longer action, so \"was walking\" is used.",
    parts: [
      {
        id: "q16p1",
        kind: "text",
        stem: "When the lights [[blank]] out I was taking a bath.",
        answers: ["went", "went out"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q16p2",
        kind: "text",
        stem: "He found a coin while he [[blank]].",
        answers: ["was walking"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 17,
    lesson: 2,
    instruction: "Complete the two verb forms in one sentence.",
    topic: "Past Progressive + Past Simple",
    source: "Workbook p. 8 · Grammar B (item 3)",
    explanation:
      "The background action with \"while\" takes the past progressive (were eating); the action that happened next takes the past simple (came).",
    parts: [
      {
        id: "q17p1",
        kind: "text",
        stem: "While we [[blank]] the cake, …",
        answers: ["were eating"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q17p2",
        kind: "text",
        stem: "… John [[blank]] came.",
        answers: ["came"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 18,
    lesson: 2,
    instruction: "Write the verb in brackets in the correct tense.",
    topic: "Past Simple interrupting Past Progressive",
    source: "Workbook p. 8 · Grammar B (item 4)",
    explanation:
      "The accident is the short event that interrupted the longer action \"was raining\", so the past simple \"had\" is required.",
    parts: [
      {
        id: "q18p1",
        kind: "text",
        stem: "It was raining heavily when they [[blank]] an accident.",
        answers: ["had"],
        mode: "exact",
        marks: 3,
      },
    ],
  },
  {
    n: 19,
    lesson: 2,
    instruction: "Identify the action that was in progress.",
    topic: "Actions in progress at a particular time in the past",
    source: "Workbook p. 8 · Grammar reference",
    explanation:
      "The past progressive shows the action in progress at that moment: Ahmad was watching T.V. His friend's visit is the short past-simple action.",
    parts: [
      {
        id: "q19p1",
        kind: "choice",
        stem: "Ahmad was watching T.V. when his friend came to visit him. Which action was in progress?",
        options: [
          "Ahmad was watching T.V.",
          "Ahmad's friend came to visit him.",
          "Both actions were short and finished.",
          "Neither action happened.",
        ],
        answer: 0,
        marks: 3,
      },
    ],
  },
  {
    n: 20,
    lesson: 2,
    instruction: "Correct the clearly incorrect verb form.",
    topic: "Past Simple vs Past Progressive",
    source: "Workbook p. 8 · Grammar A (item 3)",
    explanation:
      "\"Angry\" describes a state, not a changing action, so the past simple \"was\" is used instead of \"was being\".",
    parts: [
      {
        id: "q20p1",
        kind: "text",
        stem: "Correct the underlined form: The teacher [[blank]] angry because we were talking. (printed: was being)",
        answers: ["was"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Questions 21–30 · Lesson 3 · Let's Discover · 33 marks              */
/* ------------------------------------------------------------------ */

const LESSON_3: Question[] = [
  {
    n: 21,
    lesson: 3,
    instruction: "Read the passage again and answer the two questions.",
    topic: "Reading comprehension",
    source: "Student's Book p. 21–22 · Reading A",
    explanation:
      "(a) 2 marks for the beautiful views they enjoyed on the way. (b) 2 marks for the mountainous area with many high volcanic mountains.",
    parts: [
      {
        id: "q21p1",
        kind: "longtext",
        prompt: "(a) What did the travellers enjoy on their way to the hotel?",
        answers: ["beautiful views", "amazing things"],
        mode: "includes",
        marks: 2,
      },
      {
        id: "q21p2",
        kind: "longtext",
        prompt: "(b) What kind of area did they pass through?",
        answers: ["mountainous area", "volcanic mountains"],
        mode: "includes",
        marks: 2,
      },
    ],
  },
  {
    n: 22,
    lesson: 3,
    instruction: "Choose the correct answer.",
    topic: "Reading comprehension",
    source: "Student's Book p. 21 · Reading",
    explanation:
      "The flight tickets showed that they needed two hours to reach their destination (about 800 kilometers).",
    parts: [
      {
        id: "q22p1",
        kind: "choice",
        stem: "Our flight tickets showed that we needed …………… to reach our destination.",
        options: ["three hours", "twenty hours", "two hours"],
        answer: 2,
        marks: 3,
      },
    ],
  },
  {
    n: 23,
    lesson: 3,
    instruction: "Complete the two gaps from the passage.",
    topic: "Reading comprehension",
    source: "Student's Book p. 21 · Reading",
    explanation:
      "2 marks for three (-day trip) and 2 marks for souvenirs (things you buy to remind yourself of a place).",
    parts: [
      {
        id: "q23p1",
        kind: "text",
        stem: "During the ……………-day trip we visited various ancient sites and old markets.",
        answers: ["three", "3"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q23p2",
        kind: "text",
        stem: "We bought nice …………… for our friends.",
        answers: ["souvenirs"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 24,
    lesson: 3,
    instruction: "Write True or False according to the passage only.",
    topic: "Reading comprehension",
    source: "Student's Book p. 21 · Reading",
    explanation:
      "True — the passage ends: \"we thanked the trip supervisor and the tourism company for their great efforts\".",
    parts: [
      {
        id: "q24p1",
        kind: "choice",
        stem: "At the end of the trip, the travellers thanked the trip supervisor and the tourism company for their great efforts.",
        options: ["True", "False"],
        answer: 0,
        marks: 3,
      },
    ],
  },
  {
    n: 25,
    lesson: 3,
    instruction: "Choose the correct answer.",
    topic: "Reading comprehension",
    source: "Student's Book p. 21 · Reading",
    explanation: "The destination is \"about 800 kilometers\" from the travellers' starting point.",
    parts: [
      {
        id: "q25p1",
        kind: "choice",
        stem: "The destination was about …………… away.",
        options: [
          "three hundred kilometers",
          "eight hundred kilometers",
          "five hundred kilometers",
        ],
        answer: 1,
        marks: 2,
      },
    ],
  },
  {
    n: 26,
    lesson: 3,
    instruction: "Choose the correct auxiliary between brackets.",
    topic: "Present Perfect · have / has",
    source: "Student's Book p. 23 · Present perfect survey",
    explanation:
      "\"Firas\" is third person singular → has been. \"I\" takes have: \"I've eaten spicy food and it is delicious\".",
    parts: [
      {
        id: "q26p1",
        kind: "choice",
        stem: "Firas (have – has) been to France.",
        options: ["has", "have"],
        answer: 0,
        marks: 2,
      },
      {
        id: "q26p2",
        kind: "choice",
        stem: "I (have – has) eaten spicy food and it is delicious.",
        options: ["has", "have"],
        answer: 1,
        marks: 2,
      },
    ],
  },
  {
    n: 27,
    lesson: 3,
    instruction: "Choose the correct past participle.",
    topic: "Present Perfect · past participles",
    source: "Student's Book p. 21 · Reading + Workbook p. 12",
    explanation:
      "The present perfect is formed with have/has + past participle: has increased. \"Increase\" is the base form and \"increasing\" is the -ing form.",
    parts: [
      {
        id: "q27p1",
        kind: "choice",
        stem: "That amazing trip has …………… our knowledge about the world.",
        options: ["increased", "increase", "increasing"],
        answer: 0,
        marks: 3,
      },
    ],
  },
  {
    n: 28,
    lesson: 3,
    instruction: "Choose the correct auxiliary to build the question.",
    topic: "Present Perfect · interrogative",
    source: "Workbook p. 12 · Grammar reference",
    explanation:
      "\"Ali\" is third person singular, so the interrogative uses has: \"Has Ali been to another country?\"",
    parts: [
      {
        id: "q28p1",
        kind: "choice",
        stem: "…………… Ali been to another country?",
        options: ["Have", "Did", "Has"],
        answer: 2,
        marks: 3,
      },
    ],
  },
  {
    n: 29,
    lesson: 3,
    instruction: "Complete the reported speech with the correct form or pronoun.",
    topic: "Reported Speech · backshift and possessives",
    source: "Workbook p. 13 · Reported speech C",
    explanation:
      "Present simple \"I always forget\" backshifts to past simple \"she always forgot\"; the possessive \"our\" becomes \"their\" when two people are reported.",
    parts: [
      {
        id: "q29p1",
        kind: "text",
        stem: "\"I always forget my things.\" Sally said that she always [[blank]] her things.",
        answers: ["forgot"],
        mode: "exact",
        marks: 2,
      },
      {
        id: "q29p2",
        kind: "text",
        stem: "\"Our class is going to the museum.\" Samia and Nada said that [[blank]] class was going to the museum.",
        answers: ["their"],
        mode: "exact",
        marks: 2,
      },
    ],
  },
  {
    n: 30,
    lesson: 3,
    instruction: "Correct the reported sentence (change the underlined verb into the reported form).",
    topic: "Reported Speech · tense backshift",
    source: "Workbook p. 13 · Reported speech D (item 3)",
    explanation:
      "Present simple backshifts to past simple in reported speech, so \"doesn't\" becomes \"didn't\": Sean told me that Max didn't like scary movies.",
    parts: [
      {
        id: "q30p1",
        kind: "longtext",
        prompt:
          "Direct speech: Sean: \"Max doesn't like scary movies.\" — Write the sentence in reported speech after \"Sean told me (that) …\".",
        answers: ["Max didn't like scary movies", "Max did not like scary movies"],
        mode: "includes",
        marks: 3,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */

export const QUESTIONS: Question[] = [...LESSON_1, ...LESSON_2, ...LESSON_3];

export const ALL_PARTS: Part[] = QUESTIONS.flatMap((q) => q.parts);

export const TOTAL_PARTS = ALL_PARTS.length;

export function questionMarks(q: Question): number {
  return q.parts.reduce((sum, p) => sum + p.marks, 0);
}

export function lessonQuestions(lesson: LessonId): Question[] {
  return QUESTIONS.filter((q) => q.lesson === lesson);
}

export function lessonMarks(lesson: LessonId): number {
  return lessonQuestions(lesson).reduce((sum, q) => sum + questionMarks(q), 0);
}

export const TOTAL_MARKS = QUESTIONS.reduce((sum, q) => sum + questionMarks(q), 0);

export const LESSON_TARGETS: Record<LessonId, number> = { 1: 33, 2: 34, 3: 33 };

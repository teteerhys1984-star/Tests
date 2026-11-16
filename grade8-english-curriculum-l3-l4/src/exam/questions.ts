import type { Question } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Grade 8 · Unit 1 · Lessons 3 & 4 — 20 questions × 5 marks = 100 marks
 *
 * Q1–Q10  Lesson 3 · Let's Discover      (SB pp. 20–25 · WB pp. 10–13)
 * Q11–Q20 Lesson 4 · Interesting Destinations (SB pp. 26–32 · WB pp. 14–17)
 *
 * All contexts, names and sentences are original assessment material written
 * for this exam. Nothing is copied from the textbook exercises, workbook
 * tasks or the repository lesson tests.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const L3 = "Lesson 3 · Let's Discover";
const L4 = "Lesson 4 · Interesting Destinations";

export const EXAM_TITLE = "World Explorer English Exam";
export const EXAM_SUBTITLE =
  "Grade 8 · Unit 1 · Lessons 3 & 4 — Let's Discover + Interesting Destinations";
export const TOTAL_QUESTIONS = 20;
export const TOTAL_MARKS = 100;

export const QUESTIONS: Question[] = [
  /* ══════════════════════════ LESSON 3 · LET'S DISCOVER ══════════════════ */

  {
    n: 1,
    lesson: 3,
    sectionLabel: L3,
    skill: "Vocabulary",
    kind: "select",
    title: "Journey Words — Matching",
    instruction:
      "Match each key word from the journey texts to its correct meaning. One meaning (A–F) is extra and will not be used.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt: "amusement",
        options: [
          { id: "A", text: "fun or pleasure" },
          { id: "B", text: "the act of communicating with somebody" },
          { id: "C", text: "to travel or go somewhere with somebody" },
          { id: "D", text: "to show that something is true or correct" },
          { id: "E", text: "a thing that you buy to remind yourself of a place" },
          { id: "F", text: "an act of coming or being brought to a place" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "Amusement means fun or pleasure.",
      },
      {
        type: "select",
        id: "p2",
        prompt: "interaction",
        options: [
          { id: "A", text: "fun or pleasure" },
          { id: "B", text: "the act of communicating with somebody" },
          { id: "C", text: "to travel or go somewhere with somebody" },
          { id: "D", text: "to show that something is true or correct" },
          { id: "E", text: "a thing that you buy to remind yourself of a place" },
          { id: "F", text: "an act of coming or being brought to a place" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Interaction is the act of communicating with somebody.",
      },
      {
        type: "select",
        id: "p3",
        prompt: "accompanied",
        options: [
          { id: "A", text: "fun or pleasure" },
          { id: "B", text: "the act of communicating with somebody" },
          { id: "C", text: "to travel or go somewhere with somebody" },
          { id: "D", text: "to show that something is true or correct" },
          { id: "E", text: "a thing that you buy to remind yourself of a place" },
          { id: "F", text: "an act of coming or being brought to a place" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "Accompanied means to travel or go somewhere with somebody.",
      },
      {
        type: "select",
        id: "p4",
        prompt: "to confirm",
        options: [
          { id: "A", text: "fun or pleasure" },
          { id: "B", text: "the act of communicating with somebody" },
          { id: "C", text: "to travel or go somewhere with somebody" },
          { id: "D", text: "to show that something is true or correct" },
          { id: "E", text: "a thing that you buy to remind yourself of a place" },
          { id: "F", text: "an act of coming or being brought to a place" },
        ],
        correctId: "D",
        marks: 1,
        explanation: "To confirm means to show that something is true or correct.",
      },
      {
        type: "select",
        id: "p5",
        prompt: "souvenir",
        options: [
          { id: "A", text: "fun or pleasure" },
          { id: "B", text: "the act of communicating with somebody" },
          { id: "C", text: "to travel or go somewhere with somebody" },
          { id: "D", text: "to show that something is true or correct" },
          { id: "E", text: "a thing that you buy to remind yourself of a place" },
          { id: "F", text: "an act of coming or being brought to a place" },
        ],
        correctId: "E",
        marks: 1,
        explanation: "A souvenir is a thing that you buy to remind yourself of a place.",
      },
    ],
    explanation:
      "These are the printed key words from the journey reading: amusement, interaction, accompanied, to confirm, arrival (the extra meaning) and souvenir.",
    curriculumRef: "SB p. 21 Key words · Lesson 3",
    marks: 5,
  },

  {
    n: 2,
    lesson: 3,
    sectionLabel: L3,
    skill: "Present Perfect",
    kind: "text",
    title: "Present Perfect — Complete the Sentences",
    instruction:
      "Complete each sentence with the present perfect form of the verb in brackets. Write the complete verb phrase (for example: has visited or haven't visited).",
    parts: [
      {
        type: "text",
        id: "p1",
        prompt: "Lara _______________ four countries so far. (visit)",
        placeholder: "has visited",
        accepted: ["has visited", "'s visited"],
        canonical: "has visited",
        marks: 1,
        explanation:
          "Lara is third person singular, so we use has + past participle (visited).",
      },
      {
        type: "text",
        id: "p2",
        prompt: "The tourists _______________ many souvenirs at the old market. (buy)",
        placeholder: "have bought",
        accepted: ["have bought", "'ve bought"],
        canonical: "have bought",
        marks: 1,
        explanation: "Plural subject takes have, and the past participle of buy is bought.",
      },
      {
        type: "text",
        id: "p3",
        prompt: "We _______________ spicy food yet. (not try)",
        placeholder: "haven't tried",
        accepted: ["haven't tried", "have not tried"],
        canonical: "haven't tried / have not tried",
        marks: 1,
        explanation: "Negative present perfect: haven't + the regular participle tried.",
      },
      {
        type: "text",
        id: "p4",
        prompt: "Omar _______________ traditional food for the first time. (eat)",
        placeholder: "has eaten",
        accepted: ["has eaten", "'s eaten"],
        canonical: "has eaten",
        marks: 1,
        explanation: "Omar takes has, and the irregular participle of eat is eaten.",
      },
      {
        type: "text",
        id: "p5",
        prompt: "They _______________ to Australia twice. (be)",
        placeholder: "have been",
        accepted: ["have been", "'ve been"],
        canonical: "have been",
        marks: 1,
        explanation: "They takes have, and the past participle of be is been.",
      },
    ],
    explanation:
      "Present perfect = have/has + past participle; the negative is haven't/hasn't + past participle.",
    curriculumRef: "WB p. 12 Present perfect table · SB p. 23 · Lesson 3",
    marks: 5,
  },

  {
    n: 3,
    lesson: 3,
    sectionLabel: L3,
    skill: "Present Perfect",
    kind: "mcq",
    title: "Present Perfect — Asking Questions",
    instruction: "Choose the correct present perfect question to ask a classmate.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt: "__________ you ever __________ by helicopter?",
        options: [
          { id: "A", text: "Did / travel" },
          { id: "B", text: "Have / travelled" },
          { id: "C", text: "Has / travelled" },
          { id: "D", text: "Have / travel" },
        ],
        correctId: "B",
        marks: 5,
        explanation:
          "Present perfect questions about experiences use Have you ever + past participle: “Have you ever travelled by helicopter?” Did belongs to the past simple, has does not agree with you, and the participle travelled is required.",
      },
    ],
    explanation:
      "Have you ever + past participle is the taught question form for experiences.",
    curriculumRef: "SB p. 23 “Find somebody who…” · WB p. 12 interrogative form · Lesson 3",
    marks: 5,
  },

  {
    n: 4,
    lesson: 3,
    sectionLabel: L3,
    skill: "Present Perfect",
    kind: "mcq",
    title: "Present Perfect — Choose the Correct Sentence",
    instruction:
      "Only one of these sentences uses the present perfect correctly. Choose it.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt: "Which sentence is correct?",
        options: [
          { id: "A", text: "I have seen that film yesterday." },
          { id: "B", text: "She has visited three countries so far." },
          { id: "C", text: "They have went to Spain last year." },
          { id: "D", text: "We has just arrived at the airport." },
        ],
        correctId: "B",
        marks: 5,
        explanation:
          "“She has visited three countries so far.” agrees (She → has), uses the correct participle (visited), and has no finished time word. Finished times like yesterday and last year belong with the past simple, went is not the participle of go, and We takes have, not has.",
      },
    ],
    explanation:
      "The present perfect expresses past events whose effect continues now; it is not used with finished time expressions such as yesterday or last year.",
    curriculumRef: "WB p. 12 uses of the present perfect · Lesson 3",
    marks: 5,
  },

  {
    n: 5,
    lesson: 3,
    sectionLabel: L3,
    skill: "Reported Speech",
    kind: "text",
    title: "Reported Speech — Rewrite the Sentence",
    instruction:
      "Write the sentence in reported speech. Begin with “Dana said …” and make all the necessary tense and pronoun changes.",
    parts: [
      {
        type: "text",
        id: "p1",
        prompt: "Dana said: “I have bought some souvenirs for my friends.”",
        placeholder: "Dana said that she had bought …",
        accepted: [
          "dana said that she had bought some souvenirs for her friends",
          "dana said she had bought some souvenirs for her friends",
          "dana said that she'd bought some souvenirs for her friends",
          "dana said she'd bought some souvenirs for her friends",
        ],
        canonical: "Dana said (that) she had bought some souvenirs for her friends.",
        marks: 5,
        explanation:
          "Present perfect moves to past perfect (have bought → had bought), I becomes she, and my becomes her. The word that is optional.",
      },
    ],
    explanation:
      "In reported speech: present perfect → past perfect, and pronouns/possessives change to match the speaker (I → she, my → her).",
    curriculumRef: "WB p. 12 reported speech table & p. 13 task C · Lesson 3",
    marks: 5,
  },

  {
    n: 6,
    lesson: 3,
    sectionLabel: L3,
    skill: "Reading",
    kind: "tf",
    title: "Reading — An Island Journey",
    instruction:
      "Read the passage, then decide whether each statement is True or False.",
    passage: {
      heading: "An Island Journey",
      text: "Last month, my uncle accompanied me on a journey to a small island. The travel agency confirmed our booking one day before we left, so everything was ready. We travelled by ferry, and the crossing took three hours. On our arrival, a guide met us and showed us the path to the village. We walked through an old market, where I bought a small wooden boat as a souvenir. The journey lasted only two days, but meeting people from different countries made it a real amusement.",
    },
    parts: [
      {
        type: "tf",
        id: "p1",
        prompt: "The travel agency confirmed the booking one day before the journey.",
        answer: true,
        marks: 1,
        explanation: "The passage says the booking was confirmed one day before they left.",
      },
      {
        type: "tf",
        id: "p2",
        prompt: "The writer travelled to the island alone.",
        answer: false,
        marks: 1,
        explanation: "False — the writer's uncle accompanied him. Correction: he travelled with his uncle.",
      },
      {
        type: "tf",
        id: "p3",
        prompt: "The ferry crossing took two hours.",
        answer: false,
        marks: 1,
        explanation: "False — the crossing took three hours.",
      },
      {
        type: "tf",
        id: "p4",
        prompt: "The writer bought a souvenir in the old market.",
        answer: true,
        marks: 1,
        explanation: "True — he bought a small wooden boat in the old market.",
      },
      {
        type: "tf",
        id: "p5",
        prompt: "The journey lasted three days.",
        answer: false,
        marks: 1,
        explanation: "False — the journey lasted only two days.",
      },
    ],
    explanation:
      "Answers are stated directly in the passage; two statements need correction (uncle accompanied him; three-hour crossing; two-day journey).",
    curriculumRef: "SB pp. 21–22 reading comprehension · WB p. 11 True/False · Lesson 3",
    marks: 5,
  },

  {
    n: 7,
    lesson: 3,
    sectionLabel: L3,
    skill: "Vocabulary",
    kind: "select",
    title: "Vocabulary in Context — Key Words",
    instruction:
      "Complete each sentence with a word from the list. One word is extra and will not be used.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt:
          "Our class trip to the old city was a wonderful __________ to learn about another culture.",
        options: [
          { id: "A", text: "opportunity" },
          { id: "B", text: "continent" },
          { id: "C", text: "fascinated" },
          { id: "D", text: "hemisphere" },
          { id: "E", text: "settled" },
          { id: "F", text: "arrival" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "An opportunity is a chance to do something.",
      },
      {
        type: "select",
        id: "p2",
        prompt: "Australia is both a large country and a __________.",
        options: [
          { id: "A", text: "opportunity" },
          { id: "B", text: "continent" },
          { id: "C", text: "fascinated" },
          { id: "D", text: "hemisphere" },
          { id: "E", text: "settled" },
          { id: "F", text: "arrival" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "A continent is a large mass of land.",
      },
      {
        type: "select",
        id: "p3",
        prompt: "The young visitors were __________ by the tall volcanic mountains.",
        options: [
          { id: "A", text: "opportunity" },
          { id: "B", text: "continent" },
          { id: "C", text: "fascinated" },
          { id: "D", text: "hemisphere" },
          { id: "E", text: "settled" },
          { id: "F", text: "arrival" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "Fascinated means attracted to something.",
      },
      {
        type: "select",
        id: "p4",
        prompt: "Syria is located in the northern __________.",
        options: [
          { id: "A", text: "opportunity" },
          { id: "B", text: "continent" },
          { id: "C", text: "fascinated" },
          { id: "D", text: "hemisphere" },
          { id: "E", text: "settled" },
          { id: "F", text: "arrival" },
        ],
        correctId: "D",
        marks: 1,
        explanation: "A hemisphere is a half of the Earth.",
      },
      {
        type: "select",
        id: "p5",
        prompt:
          "After the long flight, the tired family __________ in a quiet hotel near the airport.",
        options: [
          { id: "A", text: "opportunity" },
          { id: "B", text: "continent" },
          { id: "C", text: "fascinated" },
          { id: "D", text: "hemisphere" },
          { id: "E", text: "settled" },
          { id: "F", text: "arrival" },
        ],
        correctId: "E",
        marks: 1,
        explanation: "Settled means stayed.",
      },
    ],
    explanation:
      "opportunity = a chance · continent = a large mass of land · fascinated = attracted · hemisphere = half of the Earth · settled = stayed. (Extra: arrival.)",
    curriculumRef: "WB p. 10 Key words (“My Favourite Country”) · Lesson 3",
    marks: 5,
  },

  {
    n: 8,
    lesson: 3,
    sectionLabel: L3,
    skill: "Sequencing",
    kind: "order",
    title: "Ordering — A Journey Email",
    instruction:
      "The sentences of a short travel email are mixed up. Choose the correct position (1–5) for each sentence so that the email tells the journey in a logical order.",
    parts: [
      {
        type: "order",
        id: "p1",
        prompt: "We bought some souvenirs for our friends after the rain stopped.",
        correctPos: 4,
        totalItems: 5,
        marks: 1,
        explanation: "Buying souvenirs comes after the rain in the market (position 4).",
      },
      {
        type: "order",
        id: "p2",
        prompt: "Finally, we flew back home late at night.",
        correctPos: 5,
        totalItems: 5,
        marks: 1,
        explanation: "Finally introduces the last event (position 5).",
      },
      {
        type: "order",
        id: "p3",
        prompt: "First, we travelled by train to the coast.",
        correctPos: 1,
        totalItems: 5,
        marks: 1,
        explanation: "First opens the sequence (position 1).",
      },
      {
        type: "order",
        id: "p4",
        prompt: "Then, we took a ferry across to the island.",
        correctPos: 2,
        totalItems: 5,
        marks: 1,
        explanation: "Then introduces the next step after the train (position 2).",
      },
      {
        type: "order",
        id: "p5",
        prompt: "While we were walking through the old market, it began to rain.",
        correctPos: 3,
        totalItems: 5,
        marks: 1,
        explanation: "While introduces the longer action interrupted by the rain (position 3).",
      },
    ],
    explanation:
      "Correct order: First → Then → While (market/rain) → buying souvenirs after the rain → Finally.",
    curriculumRef: "SB p. 25 email sequencers (First · Then · While · Finally) · Lesson 3",
    marks: 5,
  },

  {
    n: 9,
    lesson: 3,
    sectionLabel: L3,
    skill: "Reported Speech",
    kind: "mcq",
    title: "Reported Speech — Choose the Correct Change",
    instruction:
      "Read each direct sentence, then choose the words that correctly complete the reported sentence.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt:
          "Rana said: “I like travelling by train.” → Rana said that she __________ travelling by train.",
        options: [
          { id: "A", text: "likes" },
          { id: "B", text: "liked" },
          { id: "C", text: "has liked" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Present simple → past simple (like → liked); I → she.",
      },
      {
        type: "mcq",
        id: "p2",
        prompt:
          "Hala said: “We are enjoying our trip.” → Hala said that they __________ their trip.",
        options: [
          { id: "A", text: "are enjoying" },
          { id: "B", text: "were enjoying" },
          { id: "C", text: "enjoy" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Present continuous → past continuous; we → they, our → their.",
      },
      {
        type: "mcq",
        id: "p3",
        prompt:
          "Sami said: “I have never flown in a helicopter.” → Sami said that he __________ in a helicopter.",
        options: [
          { id: "A", text: "has never flown" },
          { id: "B", text: "had never flown" },
          { id: "C", text: "never fly" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Present perfect → past perfect (have flown → had flown); I → he.",
      },
      {
        type: "mcq",
        id: "p4",
        prompt:
          "Lina said: “I will call my friend from the hotel.” → Lina said that she __________ her friend from the hotel.",
        options: [
          { id: "A", text: "will call" },
          { id: "B", text: "would call" },
          { id: "C", text: "calls" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Will → would in reported speech; I → she.",
      },
      {
        type: "mcq",
        id: "p5",
        prompt:
          "Tareq said: “I can't check my email on the ferry.” → Tareq said that he __________ his email on the ferry.",
        options: [
          { id: "A", text: "can't check" },
          { id: "B", text: "couldn't check" },
          { id: "C", text: "doesn't check" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Can't → couldn't in reported speech; my → his.",
      },
    ],
    explanation:
      "Taught backshift: present simple → past simple, present continuous → past continuous, present perfect → past perfect, will → would, can → could — with matching pronoun changes.",
    curriculumRef: "SB p. 23 Jerry's phone call model · WB p. 12 table · Lesson 3",
    marks: 5,
  },

  {
    n: 10,
    lesson: 3,
    sectionLabel: L3,
    skill: "Writing",
    kind: "text",
    title: "Writing — Build a Present Perfect Question",
    instruction:
      "Use the words in brackets to write one complete present perfect question about experiences.",
    parts: [
      {
        type: "text",
        id: "p1",
        prompt: "(you / ever / ride / a cable car)",
        placeholder: "Have you ever … ?",
        accepted: ["have you ever ridden a cable car"],
        canonical: "Have you ever ridden a cable car?",
        marks: 5,
        explanation:
          "Experience questions use Have + subject + ever + past participle; the participle of ride is ridden.",
      },
    ],
    explanation:
      "Have you ever + past participle (ridden) is the taught question pattern.",
    curriculumRef: "SB p. 23 “Find somebody who…” · WB p. 12 interrogative form · Lesson 3",
    marks: 5,
  },

  /* ═════════════════════ LESSON 4 · INTERESTING DESTINATIONS ═════════════ */

  {
    n: 11,
    lesson: 4,
    sectionLabel: L4,
    skill: "Vocabulary",
    kind: "select",
    title: "Destination Words — Matching",
    instruction:
      "Match each word to its definition. One definition (A–F) is extra and will not be used.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt: "fortress",
        options: [
          { id: "A", text: "a place that is protected against attacks" },
          { id: "B", text: "a castle" },
          { id: "C", text: "to move on snow or water for sport" },
          { id: "D", text: "a nearby area of a town or city" },
          { id: "E", text: "a small shop that sells clothes or other objects" },
          { id: "F", text: "a hot meal made by cooking meat and vegetables in a liquid" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "A fortress is a place protected against attacks.",
      },
      {
        type: "select",
        id: "p2",
        prompt: "citadel",
        options: [
          { id: "A", text: "a place that is protected against attacks" },
          { id: "B", text: "a castle" },
          { id: "C", text: "to move on snow or water for sport" },
          { id: "D", text: "a nearby area of a town or city" },
          { id: "E", text: "a small shop that sells clothes or other objects" },
          { id: "F", text: "a hot meal made by cooking meat and vegetables in a liquid" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "A citadel is a castle.",
      },
      {
        type: "select",
        id: "p3",
        prompt: "ski",
        options: [
          { id: "A", text: "a place that is protected against attacks" },
          { id: "B", text: "a castle" },
          { id: "C", text: "to move on snow or water for sport" },
          { id: "D", text: "a nearby area of a town or city" },
          { id: "E", text: "a small shop that sells clothes or other objects" },
          { id: "F", text: "a hot meal made by cooking meat and vegetables in a liquid" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "To ski is to move on snow or water for sport.",
      },
      {
        type: "select",
        id: "p4",
        prompt: "neighborhood",
        options: [
          { id: "A", text: "a place that is protected against attacks" },
          { id: "B", text: "a castle" },
          { id: "C", text: "to move on snow or water for sport" },
          { id: "D", text: "a nearby area of a town or city" },
          { id: "E", text: "a small shop that sells clothes or other objects" },
          { id: "F", text: "a hot meal made by cooking meat and vegetables in a liquid" },
        ],
        correctId: "D",
        marks: 1,
        explanation: "A neighborhood is a nearby area of a town or city.",
      },
      {
        type: "select",
        id: "p5",
        prompt: "boutique",
        options: [
          { id: "A", text: "a place that is protected against attacks" },
          { id: "B", text: "a castle" },
          { id: "C", text: "to move on snow or water for sport" },
          { id: "D", text: "a nearby area of a town or city" },
          { id: "E", text: "a small shop that sells clothes or other objects" },
          { id: "F", text: "a hot meal made by cooking meat and vegetables in a liquid" },
        ],
        correctId: "E",
        marks: 1,
        explanation: "A boutique is a small shop that sells clothes or other objects.",
      },
    ],
    explanation:
      "fortress → protected against attacks · citadel → castle · ski → move on snow or water · neighborhood → nearby area · boutique → small shop. (Extra definition: stew.)",
    curriculumRef: "WB p. 15 Words and definitions (“Focus on Two Cities”) · Lesson 4",
    marks: 5,
  },

  {
    n: 12,
    lesson: 4,
    sectionLabel: L4,
    skill: "Vocabulary",
    kind: "select",
    title: "Vocabulary in Context — Describing Places",
    instruction:
      "Complete each sentence with a word from the list. One word is extra and will not be used.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt:
          "Our mountain guide was a real __________ — he knew every path in the region.",
        options: [
          { id: "A", text: "expert" },
          { id: "B", text: "stew" },
          { id: "C", text: "trekking" },
          { id: "D", text: "grilled" },
          { id: "E", text: "located" },
          { id: "F", text: "magnificent" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "An expert has special skill or knowledge of a subject.",
      },
      {
        type: "select",
        id: "p2",
        prompt:
          "We ordered a hot meat and vegetable __________ at the open market.",
        options: [
          { id: "A", text: "expert" },
          { id: "B", text: "stew" },
          { id: "C", text: "trekking" },
          { id: "D", text: "grilled" },
          { id: "E", text: "located" },
          { id: "F", text: "magnificent" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "A stew is meat and vegetables cooked slowly in a liquid.",
      },
      {
        type: "select",
        id: "p3",
        prompt:
          "__________ across the hills for three days was the hardest part of our adventure.",
        options: [
          { id: "A", text: "expert" },
          { id: "B", text: "stew" },
          { id: "C", text: "trekking" },
          { id: "D", text: "grilled" },
          { id: "E", text: "located" },
          { id: "F", text: "magnificent" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "Trekking is a long hard walk lasting several days, especially in mountains.",
      },
      {
        type: "select",
        id: "p4",
        prompt: "The fish was __________ over a very strong heat and tasted wonderful.",
        options: [
          { id: "A", text: "expert" },
          { id: "B", text: "stew" },
          { id: "C", text: "trekking" },
          { id: "D", text: "grilled" },
          { id: "E", text: "located" },
          { id: "F", text: "magnificent" },
        ],
        correctId: "D",
        marks: 1,
        explanation: "Grilled means cooked over a very strong heat.",
      },
      {
        type: "select",
        id: "p5",
        prompt: "The old citadel is __________ on a hill above the river.",
        options: [
          { id: "A", text: "expert" },
          { id: "B", text: "stew" },
          { id: "C", text: "trekking" },
          { id: "D", text: "grilled" },
          { id: "E", text: "located" },
          { id: "F", text: "magnificent" },
        ],
        correctId: "E",
        marks: 1,
        explanation: "Located means situated.",
      },
    ],
    explanation:
      "expert = special knowledge · stew = meat/vegetables in liquid · trekking = long hard mountain walk · grilled = strong heat · located = situated. (Extra: magnificent.)",
    curriculumRef: "SB p. 27 Key words (Iguazu Falls) · Lesson 4",
    marks: 5,
  },

  {
    n: 13,
    lesson: 4,
    sectionLabel: L4,
    skill: "Past Perfect",
    kind: "text",
    title: "Past Perfect — Complete the Sentences",
    instruction:
      "Complete each sentence with the past perfect form of the verb in brackets. Write the complete verb phrase (for example: had left or hadn't left).",
    parts: [
      {
        type: "text",
        id: "p1",
        prompt: "When we arrived at the station, the train _______________. (leave)",
        placeholder: "had left",
        accepted: ["had left", "'d left"],
        canonical: "had left",
        marks: 1,
        explanation: "The train left before we arrived, so we use had + left.",
      },
      {
        type: "text",
        id: "p2",
        prompt:
          "Sara was tired because she _______________ well the night before. (not sleep)",
        placeholder: "hadn't slept",
        accepted: ["hadn't slept", "had not slept"],
        canonical: "hadn't slept / had not slept",
        marks: 1,
        explanation: "The earlier event uses the negative past perfect: hadn't + slept.",
      },
      {
        type: "text",
        id: "p3",
        prompt:
          "Before the trip, the tourists _______________ a lot about the falls. (read)",
        placeholder: "had read",
        accepted: ["had read", "'d read"],
        canonical: "had read",
        marks: 1,
        explanation: "Read is irregular; the participle is still read, used with had.",
      },
      {
        type: "text",
        id: "p4",
        prompt: "The children started the match after the rain _______________. (stop)",
        placeholder: "had stopped",
        accepted: ["had stopped", "'d stopped"],
        canonical: "had stopped",
        marks: 1,
        explanation: "The rain stopped before the match started: had + stopped.",
      },
      {
        type: "text",
        id: "p5",
        prompt: "When I got to the cinema, the film _______________. (start)",
        placeholder: "had started",
        accepted: ["had started", "'d started"],
        canonical: "had started",
        marks: 1,
        explanation: "The film started before I arrived: had + started.",
      },
    ],
    explanation:
      "Past perfect = had + past participle; it shows which of two past events happened first.",
    curriculumRef: "SB p. 27 Past perfect revision · WB p. 16 past perfect table · Lesson 4",
    marks: 5,
  },

  {
    n: 14,
    lesson: 4,
    sectionLabel: L4,
    skill: "Past Perfect",
    kind: "mcq",
    title: "Past Perfect — Order of Events",
    instruction:
      "Choose the sentence that shows the correct order of two past events.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt: "Which sentence is correct?",
        options: [
          { id: "A", text: "When we reached the airport, the plane had already left." },
          { id: "B", text: "When we had reached the airport, the plane already left." },
          { id: "C", text: "When we reached the airport, the plane has already left." },
          { id: "D", text: "The plane had left when we reach the airport." },
        ],
        correctId: "A",
        marks: 5,
        explanation:
          "The plane left (earlier action, past perfect) before we reached the airport (later action, past simple). Only option A matches had + participle for the earlier event and the past simple for the later one.",
      },
    ],
    explanation:
      "The earlier action takes the past perfect (had left); the later action takes the past simple (reached).",
    curriculumRef: "WB p. 16 past perfect use (“one event happened before another”) · Lesson 4",
    marks: 5,
  },

  {
    n: 15,
    lesson: 4,
    sectionLabel: L4,
    skill: "Reported Speech",
    kind: "mcq",
    title: "Reported Speech — Past into Past Perfect",
    instruction:
      "Read each direct sentence, then choose the words that correctly complete the reported sentence.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt:
          "Sandra said: “I enjoyed the museums in Granada.” → Sandra said that she __________ the museums in Granada.",
        options: [
          { id: "A", text: "enjoyed" },
          { id: "B", text: "had enjoyed" },
          { id: "C", text: "has enjoyed" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Past simple → past perfect (enjoyed → had enjoyed); I → she.",
      },
      {
        type: "mcq",
        id: "p2",
        prompt:
          "The travellers said: “We reached the railway early.” → The travellers said that they __________ the railway early.",
        options: [
          { id: "A", text: "reached" },
          { id: "B", text: "had reached" },
          { id: "C", text: "reach" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Past simple → past perfect; we → they.",
      },
      {
        type: "mcq",
        id: "p3",
        prompt:
          "The woman said: “Someone stole my purse this morning.” → The woman said that someone __________ her purse that morning.",
        options: [
          { id: "A", text: "stole" },
          { id: "B", text: "had stolen" },
          { id: "C", text: "has stolen" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Stole → had stolen; my → her; this morning → that morning.",
      },
      {
        type: "mcq",
        id: "p4",
        prompt:
          "Omar said: “I have never skied in the mountains.” → Omar said that he __________ in the mountains.",
        options: [
          { id: "A", text: "has never skied" },
          { id: "B", text: "had never skied" },
          { id: "C", text: "never ski" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Present perfect → past perfect (have skied → had skied); I → he.",
      },
      {
        type: "mcq",
        id: "p5",
        prompt:
          "The students said: “We are planning a trip to the citadel.” → The students said that they __________ a trip to the citadel.",
        options: [
          { id: "A", text: "are planning" },
          { id: "B", text: "were planning" },
          { id: "C", text: "plan" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Present continuous → past continuous; we → they.",
      },
    ],
    explanation:
      "After said/told, the past simple moves to the past perfect, and pronouns possessives follow the new speaker (I → he/she, we → they, my → his/her).",
    curriculumRef: "WB p. 16 reported speech rule (past simple → past perfect) & p. 17 dialogue · Lesson 4",
    marks: 5,
  },

  {
    n: 16,
    lesson: 4,
    sectionLabel: L4,
    skill: "Reading",
    kind: "mcq",
    title: "Reading — Welcome to Riverton",
    instruction:
      "Read the passage about a destination, then choose the correct answer for each question.",
    passage: {
      heading: "Welcome to Riverton",
      text: "Riverton is a small town located between the mountains and the sea. The town is famous for its ancient fortress, which was built long ago to protect the people from attacks. In the Stone Market, visitors can try grilled fish and a delicious vegetable stew at very good prices. Riverton has a moderate climate: winters are wet, but summers are dry and sunny, so there is good weather for every traveller. Many visitors say that the old neighborhood near the river is the most magnificent part of the town. You can reach Riverton by bus or by rental car.",
    },
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt: "Riverton is located between the mountains and __________.",
        options: [
          { id: "A", text: "the desert" },
          { id: "B", text: "the sea" },
          { id: "C", text: "the rainforest" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "The town is located between the mountains and the sea.",
      },
      {
        type: "mcq",
        id: "p2",
        prompt: "The ancient fortress was built to __________.",
        options: [
          { id: "A", text: "protect the people from attacks" },
          { id: "B", text: "store food for the winter" },
          { id: "C", text: "welcome ships to the port" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "The passage says the fortress protected the people from attacks.",
      },
      {
        type: "mcq",
        id: "p3",
        prompt: "In Riverton, winters are __________.",
        options: [
          { id: "A", text: "dry and sunny" },
          { id: "B", text: "wet" },
          { id: "C", text: "freezing and snowy" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "Winters are wet; summers are dry and sunny.",
      },
      {
        type: "mcq",
        id: "p4",
        prompt: "Many visitors say the most magnificent part of the town is __________.",
        options: [
          { id: "A", text: "the modern shopping centre" },
          { id: "B", text: "the airport" },
          { id: "C", text: "the old neighborhood near the river" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "The old neighborhood near the river is called the most magnificent part.",
      },
      {
        type: "mcq",
        id: "p5",
        prompt: "You can reach Riverton __________.",
        options: [
          { id: "A", text: "only by plane" },
          { id: "B", text: "by bus or by rental car" },
          { id: "C", text: "by helicopter" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "The passage gives two ways to arrive: by bus or by rental car.",
      },
    ],
    explanation:
      "All five answers are stated directly in the passage, which practises the lesson's destination, climate and food vocabulary.",
    curriculumRef: "SB p. 26 Iguazu Falls & p. 30 Climate & Weather · WB p. 14 Two Cities · Lesson 4",
    marks: 5,
  },

  {
    n: 17,
    lesson: 4,
    sectionLabel: L4,
    skill: "Reading",
    kind: "tf",
    title: "Reading — The Helen Keller Story",
    instruction:
      "Decide whether each statement about the story “Teachers are Great Decision Makers” is True or False. Read the explanations after submission to see the corrections.",
    parts: [
      {
        type: "tf",
        id: "p1",
        prompt: "Helen Keller was born in Alabama in 1880.",
        answer: true,
        marks: 1,
        explanation: "True — she was born in Alabama on June 27, 1880.",
      },
      {
        type: "tf",
        id: "p2",
        prompt: "Helen became deaf and blind when she was five years old.",
        answer: false,
        marks: 1,
        explanation:
          "False — correction: she became deaf and blind at the age of 19 months, after scarlet fever.",
      },
      {
        type: "tf",
        id: "p3",
        prompt: "Ann Sullivan taught Helen finger spelling.",
        answer: true,
        marks: 1,
        explanation: "True — Sullivan began to teach her finger spelling, starting with the word “doll”.",
      },
      {
        type: "tf",
        id: "p4",
        prompt: "Helen understood the word “water” at the water pump.",
        answer: true,
        marks: 1,
        explanation:
          "True — at the pump, Sullivan spelled w-a-t-e-r while cool water ran over Helen's hand.",
      },
      {
        type: "tf",
        id: "p5",
        prompt: "By nightfall of that day, Helen had learned only three words.",
        answer: false,
        marks: 1,
        explanation: "False — correction: by nightfall, she had learned 30 words.",
      },
    ],
    explanation:
      "Two statements were false and needed correction (19 months, not five years; 30 words, not three).",
    curriculumRef: "SB p. 31 “Teachers are Great Decision Makers” · Lesson 4",
    marks: 5,
  },

  {
    n: 18,
    lesson: 4,
    sectionLabel: L4,
    skill: "Pronunciation",
    kind: "select",
    title: "Pronunciation — /s/ or /k/?",
    instruction:
      "Reminder of the lesson rule: the letter C is usually pronounced /k/ as in cat, but C is pronounced /s/ when the letter after it is i, e or y as in city. The letters ck together make /k/ as in clock. Choose the sound of the bold letter(s) in each word.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt: "city",
        options: [
          { id: "S", text: "/s/ sound" },
          { id: "K", text: "/k/ sound" },
        ],
        correctId: "S",
        marks: 1,
        explanation: "C is followed by i, so city begins with /s/.",
      },
      {
        type: "select",
        id: "p2",
        prompt: "cook",
        options: [
          { id: "S", text: "/s/ sound" },
          { id: "K", text: "/k/ sound" },
        ],
        correctId: "K",
        marks: 1,
        explanation: "C is followed by o, so cook keeps the usual /k/ sound.",
      },
      {
        type: "select",
        id: "p3",
        prompt: "face",
        options: [
          { id: "S", text: "/s/ sound" },
          { id: "K", text: "/k/ sound" },
        ],
        correctId: "S",
        marks: 1,
        explanation: "C is followed by e, so face ends with /s/.",
      },
      {
        type: "select",
        id: "p4",
        prompt: "clock",
        options: [
          { id: "S", text: "/s/ sound" },
          { id: "K", text: "/k/ sound" },
        ],
        correctId: "K",
        marks: 1,
        explanation: "The letters ck together always make /k/, as in clock.",
      },
      {
        type: "select",
        id: "p5",
        prompt: "juice",
        options: [
          { id: "S", text: "/s/ sound" },
          { id: "K", text: "/k/ sound" },
        ],
        correctId: "S",
        marks: 1,
        explanation: "C is followed by e, so juice ends with /s/.",
      },
    ],
    explanation:
      "/s/: city, face, juice (C before i or e) · /k/: cook (C as usual), clock (ck = /k/).",
    curriculumRef: "SB p. 29 Sounds /s/ and /k/ · Lesson 4",
    marks: 5,
  },

  {
    n: 19,
    lesson: 4,
    sectionLabel: L4,
    skill: "Linking Words",
    kind: "select",
    title: "Linking Words — Organize the Ideas",
    instruction:
      "Choose the best linking word or phrase for each space. Each linker is used only once.",
    parts: [
      {
        type: "select",
        id: "p1",
        prompt:
          "__________, we visited the ancient citadel. Then we walked down to the old market.",
        options: [
          { id: "A", text: "First" },
          { id: "B", text: "In addition" },
          { id: "C", text: "Therefore" },
          { id: "D", text: "However" },
          { id: "E", text: "On the other hand" },
        ],
        correctId: "A",
        marks: 1,
        explanation: "First orders information at the start of a sequence.",
      },
      {
        type: "select",
        id: "p2",
        prompt:
          "The weather was warm and sunny all week. __________, the hotel offered free boat trips every morning.",
        options: [
          { id: "A", text: "First" },
          { id: "B", text: "In addition" },
          { id: "C", text: "Therefore" },
          { id: "D", text: "However" },
          { id: "E", text: "On the other hand" },
        ],
        correctId: "B",
        marks: 1,
        explanation: "In addition adds more information.",
      },
      {
        type: "select",
        id: "p3",
        prompt:
          "The mountain road was closed because of the storm. __________, we travelled to the waterfall the next day instead.",
        options: [
          { id: "A", text: "First" },
          { id: "B", text: "In addition" },
          { id: "C", text: "Therefore" },
          { id: "D", text: "However" },
          { id: "E", text: "On the other hand" },
        ],
        correctId: "C",
        marks: 1,
        explanation: "Therefore shows a result: the closed road caused the new plan.",
      },
      {
        type: "select",
        id: "p4",
        prompt:
          "The journey to the island was long and tiring. __________, we never felt bored for a moment.",
        options: [
          { id: "A", text: "First" },
          { id: "B", text: "In addition" },
          { id: "C", text: "Therefore" },
          { id: "D", text: "However" },
          { id: "E", text: "On the other hand" },
        ],
        correctId: "D",
        marks: 1,
        explanation: "However contrasts the difficult journey with the enjoyable experience.",
      },
      {
        type: "select",
        id: "p5",
        prompt:
          "My father enjoys busy, modern cities. My mother, __________, prefers quiet historical towns.",
        options: [
          { id: "A", text: "First" },
          { id: "B", text: "In addition" },
          { id: "C", text: "Therefore" },
          { id: "D", text: "However" },
          { id: "E", text: "On the other hand" },
        ],
        correctId: "E",
        marks: 1,
        explanation:
          "On the other hand contrasts two parallel sides — here, the father's taste versus the mother's.",
      },
    ],
    explanation:
      "First orders ideas · In addition adds · Therefore shows result · However contrasts · On the other hand contrasts two sides.",
    curriculumRef: "WB p. 17 “Keep in mind” linking words · Lesson 4",
    marks: 5,
  },

  {
    n: 20,
    lesson: 4,
    sectionLabel: L4,
    skill: "Error Correction",
    kind: "mcq",
    title: "Error Correction — Fix the Sentences",
    instruction:
      "Each sentence contains one grammar mistake. Choose the fully corrected sentence.",
    parts: [
      {
        type: "mcq",
        id: "p1",
        prompt: "When we arrived at the port, the ferry has already left.",
        options: [
          { id: "A", text: "When we arrived at the port, the ferry had already left." },
          { id: "B", text: "When we arrived at the port, the ferry have already left." },
          { id: "C", text: "When we arrived at the port, the ferry leaves already." },
        ],
        correctId: "A",
        marks: 1,
        explanation: "The earlier past event needs the past perfect: had left.",
      },
      {
        type: "mcq",
        id: "p2",
        prompt: "She said that she has never tried seafood stew.",
        options: [
          { id: "A", text: "She said that she had never tried seafood stew." },
          { id: "B", text: "She said that she have never tried seafood stew." },
          { id: "C", text: "She said that she has never try seafood stew." },
        ],
        correctId: "A",
        marks: 1,
        explanation: "After said, the present perfect moves to the past perfect: had never tried.",
      },
      {
        type: "mcq",
        id: "p3",
        prompt: "Omar has never skied before he visited Vancouver.",
        options: [
          { id: "A", text: "Omar had never skied before he visited Vancouver." },
          { id: "B", text: "Omar had never ski before he visited Vancouver." },
          { id: "C", text: "Omar has never ski before he visited Vancouver." },
        ],
        correctId: "A",
        marks: 1,
        explanation: "The experience before a past event uses the past perfect: had never skied.",
      },
      {
        type: "mcq",
        id: "p4",
        prompt: "The tourists was fascinated by the magnificent waterfalls.",
        options: [
          { id: "A", text: "The tourists were fascinated by the magnificent waterfalls." },
          { id: "B", text: "The tourists is fascinated by the magnificent waterfalls." },
          { id: "C", text: "The tourists fascinated was by the magnificent waterfalls." },
        ],
        correctId: "A",
        marks: 1,
        explanation: "The plural subject tourists takes were, not was.",
      },
      {
        type: "mcq",
        id: "p5",
        prompt: "By nightfall, Helen had learn thirty words.",
        options: [
          { id: "A", text: "By nightfall, Helen had learned thirty words." },
          { id: "B", text: "By nightfall, Helen have learned thirty words." },
          { id: "C", text: "By nightfall, Helen had learns thirty words." },
        ],
        correctId: "A",
        marks: 1,
        explanation: "The past perfect needs the past participle: had learned.",
      },
    ],
    explanation:
      "Corrections: had left · had never tried · had never skied · were fascinated · had learned.",
    curriculumRef: "WB p. 16 past perfect & reported speech · SB p. 31 story language · Lesson 4",
    marks: 5,
  },
];

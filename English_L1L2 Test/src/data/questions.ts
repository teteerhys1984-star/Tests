/**
 * Grade 8 English — Unit 1 (Lessons 1 & 2) exam data.
 *
 * Lesson 1 "Future Plans"   → Questions 1–10  (SB pp. 6–11, WB pp. 2–5)
 * Lesson 2 "School Challenges" → Questions 11–20 (SB pp. 12–18, WB pp. 6–9)
 *
 * All passages, names and situations are ORIGINAL assessment material written
 * for this exam; each question tests skills and content taught in the two
 * lessons. Every main question is worth exactly 5 marks.
 */
import type { Question } from "../types";

const L1 = "lesson1" as const;
const L2 = "lesson2" as const;

export const PASSAGE_A = {
  title: "Reading A — Classroom 2040",
  text: "Walk into a future classroom, and you may not find any paper books at all. Schools of the future will combine high-quality education with new technologies to convey practical knowledge to students. Instead of heavy bags, every student will carry a light tablet with 3-D screens. Robotic helpers will support teachers, and flying vehicles will replace the old, slow school buses. Learning will also become flexible and personalized: each student will have a special format of lessons that suits their interests and their future career. However, teachers say one thing will never change — students will still need to work hard and pay attention every day.",
  source: "Original passage written for this exam",
};

export const PASSAGE_B = {
  title: "Reading B — The First Year",
  text: "Adam was only four years old when his mother took him to kindergarten for the first time. The building looked strange, and the children around him were all new faces. Adam cried loudly when his mother left him at the door. But his teacher, Miss Rana, was kind, and soon Adam felt safe and happy. Years later, Adam understood how school life changes: little children need their parents' hands, but older students learn to read, write and study independently. Today, Adam is in Grade 8. He has discovered a remarkable skill in drawing, and he already knows that he wants to be an engineer one day.",
  source: "Original passage written for this exam",
};

export const PASSAGE_C = {
  title: "Reading C — A Difficult Start",
  text: "When Sami moved to a new school in October, everything felt difficult. The building was big, the lessons were hard, and some older students were noisy in the classroom. Sami began to feel unhappy and lost his self-esteem. He found it hard to get up in the morning, and he hesitated before entering the school gate every day. His marks became low because he was careless about his homework. One morning, he even refused to take the school bus. Luckily, his mother noticed the problem. She spoke to his teacher and to the social worker at school. Together they helped Sami solve his problems, and little by little, school became a happy place again.",
  source: "Original passage written for this exam",
};

export const PASSAGE_D = {
  title: "Reading D — Bullying Must Stop",
  text: "Bullying happens in many schools, and it takes many forms. Some bullies use name-calling or write unpleasant things about others. Others keep weaker students away from games and activities on purpose, or take and damage their belongings. A few bullies even hit or push the students they pick on. Many bullies think this behaviour makes them popular, or they feel jealous of the other person's success. The truth is different: bullying hurts feelings and can make students hate school. If you see bullying, don't keep silent. Tell a teacher or a parent, and remember the golden rule: treat others the way you want them to treat you.",
  source: "Original passage written for this exam",
};

const MATCH_DEFS_L1 = [
  "to give something to be used",
  "an idea or way of doing something new",
  "able to change to suit new situations",
  "to make ideas known to somebody",
  "connected with real situations rather than ideas",
];

const MATCH_DEFS_L2 = [
  "a feeling of being happy with your character and abilities",
  "to be slow to act because you feel uncertain",
  "the things that you own",
  "to force somebody to do something",
  "feeling unhappy because somebody has something that you wish you had",
];

export const QUESTIONS: Question[] = [
  /* ======================= LESSON 1 — FUTURE PLANS (Q1–Q10) ======================= */
  {
    number: 1,
    id: "q1",
    lesson: L1,
    typeLabel: "Reading Comprehension",
    instruction:
      "Read the passage, then choose the correct answer (a, b or c) for each item.",
    passage: PASSAGE_A,
    marks: 5,
    explanation:
      "The passage states that students will carry a light tablet with 3-D screens; 'convey' means to make ideas known; flying vehicles will replace school buses; learning will be flexible and personalized; and students will still need to work hard and pay attention.",
    curriculumRef:
      "Lesson 1 — SB p.7 Reading 'Schools in the Past, Present and Future' & p.8 key words (convey, flexible, personalized).",
    subparts: [1, 2, 3, 4, 5].map((i) => {
      const data: {
        prompt: string;
        options: [string, string, string];
        correctIndex: number;
      }[] = [
        {
          prompt: "In future schools, every student will carry …",
          options: [
            "heavy bags full of paper books",
            "a light tablet with 3-D screens",
            "a robotic teacher to the classroom",
          ],
          correctIndex: 1,
        },
        {
          prompt:
            "The word “convey” in the passage is closest in meaning to …",
          options: ["hide", "collect", "make known"],
          correctIndex: 2,
        },
        {
          prompt: "Flying vehicles will replace …",
          options: [
            "the old, slow school buses",
            "robotic helpers",
            "paper books",
          ],
          correctIndex: 0,
        },
        {
          prompt: "Learning in future schools will be …",
          options: [
            "exactly the same for every student",
            "flexible and personalized",
            "completely without teachers",
          ],
          correctIndex: 1,
        },
        {
          prompt: "According to teachers, students will still need to …",
          options: [
            "forget the old schools",
            "stay at home every day",
            "work hard and pay attention",
          ],
          correctIndex: 2,
        },
      ];
      const d = data[i - 1];
      return {
        id: `q1-s${i}`,
        type: "mcq" as const,
        prompt: d.prompt,
        marks: 1,
        options: [...d.options],
        correctIndex: d.correctIndex,
      };
    }),
  },
  {
    number: 2,
    id: "q2",
    lesson: L1,
    typeLabel: "Vocabulary Matching",
    instruction:
      "Match each key word (1–5) with its correct meaning from the box (a–e).",
    wordBank: MATCH_DEFS_L1.map((d, i) => `${String.fromCharCode(97 + i)}) ${d}`),
    marks: 5,
    explanation:
      "provide = to give something to be used; innovation = an idea or way of doing something new; flexible = able to change to suit new situations; convey = to make ideas known to somebody; practical = connected with real situations rather than ideas.",
    curriculumRef: "Lesson 1 — SB p.8 Key Words box.",
    subparts: ([
      ["provide", MATCH_DEFS_L1[0]],
      ["innovation", MATCH_DEFS_L1[1]],
      ["flexible", MATCH_DEFS_L1[2]],
      ["convey", MATCH_DEFS_L1[3]],
      ["practical", MATCH_DEFS_L1[4]],
    ] as [string, string][]).map(([word, def], i) => ({
      id: `q2-s${i + 1}`,
      type: "select" as const,
      prompt: `${i + 1}. ${word}`,
      marks: 1,
      options: MATCH_DEFS_L1.map(
        (d, j) => `${String.fromCharCode(97 + j)}) ${d}`,
      ),
      correct: `${String.fromCharCode(97 + MATCH_DEFS_L1.indexOf(def))}) ${def}`,
    })),
  },
  {
    number: 3,
    id: "q3",
    lesson: L1,
    typeLabel: "Fill in the Blanks",
    instruction:
      "Complete each sentence with the correct word from the box. One word is extra.",
    wordBank: ["provides", "rely", "major", "convey", "personalized", "concepts"],
    marks: 5,
    explanation:
      "A website 'provides' lessons; we 'rely' on memory; a 'major' difference; a film 'conveys' an idea; a 'personalized' plan suits one person's needs. ('concepts' is the extra word.)",
    curriculumRef:
      "Lesson 1 — SB p.9 Vocabulary exercise words (provide, rely, major, convey, personalized).",
    subparts: ([
      ["The school website", "students with all their lessons online.", "provides"],
      ["A good student does not", "only on memory; he tries to understand.", "rely"],
      ["Reading every day can make a", "difference to your language skills.", "major"],
      ["The teacher used a short film to", "the idea of the lesson.", "convey"],
      ["Each student received a", "study plan that suited his own needs.", "personalized"],
    ] as [string, string, string][]).map(([before, after, correct], i) => ({
      id: `q3-s${i + 1}`,
      type: "select" as const,
      prompt: before,
      marks: 1,
      options: ["provides", "rely", "major", "convey", "personalized", "concepts"],
      correct,
      before,
      after,
    })),
  },
  {
    number: 4,
    id: "q4",
    lesson: L1,
    typeLabel: "Choose the Correct Tense",
    instruction:
      "Choose the correct tense (Present Simple or Present Progressive) for each sentence.",
    marks: 5,
    explanation:
      "Facts and habits take the Present Simple (boils, drives, drinks — signals: every day, never, always true). Actions happening now take the Present Progressive (is knocking, are watching — signals: Listen!, at the moment).",
    curriculumRef:
      "Lesson 1 — WB p.4 tense tables; SB p.9 'Select the correct tense'.",
    subparts: [
      { prompt: "Water ___ at 100 degrees Celsius.", options: ["boils", "is boiling"], correctIndex: 0 },
      { prompt: "Listen! Someone ___ at the door.", options: ["knocks", "is knocking"], correctIndex: 1 },
      { prompt: "My father ___ to work every day.", options: ["drives", "is driving"], correctIndex: 0 },
      { prompt: "We ___ a documentary at the moment.", options: ["watch", "are watching"], correctIndex: 1 },
      { prompt: "Ruba never ___ coffee in the morning.", options: ["drinks", "is drinking"], correctIndex: 0 },
    ].map((d, i) => ({
      id: `q4-s${i + 1}`,
      type: "mcq" as const,
      prompt: d.prompt,
      marks: 1,
      options: [...d.options],
      correctIndex: d.correctIndex,
    })),
  },
  {
    number: 5,
    id: "q5",
    lesson: L1,
    typeLabel: "Choose the Correct Tense",
    instruction:
      "Choose the correct future form (will or going to) for each sentence.",
    marks: 5,
    explanation:
      "'Will' is used for decisions made now, promises and predictions; 'going to' is used for plans made before speaking and predictions based on evidence we can see (black clouds).",
    curriculumRef:
      "Lesson 1 — WB p.4 Future tense table (will: decisions, promises, predictions; going to: plans, prediction based on evidence).",
    subparts: [
      {
        prompt: "Look at those black clouds! It ___ rain.",
        options: ["will", "is going to"],
        correctIndex: 1,
      },
      {
        prompt:
          "We have already bought the tickets. We ___ visit the science museum on Friday.",
        options: ["will", "are going to"],
        correctIndex: 1,
      },
      {
        prompt: "I promise I ___ never be late again.",
        options: ["will", "am going to"],
        correctIndex: 0,
      },
      {
        prompt: "A: I've dropped my glasses!  B: Don't worry, I ___ pick them up for you.",
        options: ["will", "am going to"],
        correctIndex: 0,
      },
      {
        prompt: "The book says global warming ___ cause more deserts in the future.",
        options: ["will", "is going to"],
        correctIndex: 0,
      },
    ].map((d, i) => ({
      id: `q5-s${i + 1}`,
      type: "mcq" as const,
      prompt: d.prompt,
      marks: 1,
      options: [...d.options],
      correctIndex: d.correctIndex,
    })),
  },
  {
    number: 6,
    id: "q6",
    lesson: L1,
    typeLabel: "Reorder the Words",
    instruction:
      "Tap the words in the correct order to build a correct sentence. (2.5 marks each)",
    marks: 5,
    explanation:
      "Item 1 is a 'going to' future plan: subject + are going to + verb + time. Item 2 is a Present Simple habit with the frequency adverb after the subject: Lina usually goes to school by bus.",
    curriculumRef:
      "Lesson 1 — WB p.4 tense tables; sentence construction skills.",
    subparts: [
      {
        id: "q6-s1",
        type: "reorder" as const,
        prompt: "Build a sentence about a future plan:",
        marks: 2.5,
        words: ["tablets", "are", "year", "going", "students", "to", "use", "next"],
        target: ["students", "are", "going", "to", "use", "tablets", "next", "year"],
      },
      {
        id: "q6-s2",
        type: "reorder" as const,
        prompt: "Build a sentence about a daily habit:",
        marks: 2.5,
        words: ["goes", "to", "lina", "usually", "by", "school", "bus"],
        target: ["lina", "usually", "goes", "to", "school", "by", "bus"],
      },
    ],
  },
  {
    number: 7,
    id: "q7",
    lesson: L1,
    typeLabel: "Sentence Correction",
    instruction:
      "Each sentence has ONE mistake in the highlighted verb. Type only the correct form of that verb.",
    marks: 5,
    explanation:
      "go→goes and rise→rises add -s for he/she/it in the Present Simple; is→are agrees with plural 'boys'; after 'will' we use the base verb (buy, not buys); 'Tarek' is singular so we say 'is going to'.",
    curriculumRef:
      "Lesson 1 — WB p.4 tense tables; subject–verb agreement and verb forms.",
    subparts: ([
      ["Maya usually", "go", "to school on foot.", "goes"],
      ["Look! The boys", "is", "playing football.", "are"],
      ["We will", "buys", "new notebooks next week.", "buy"],
      ["Tarek", "are", "going to join the art club.", "is"],
      ["The sun", "rise", "in the east.", "rises"],
    ] as [string, string, string, string][]).map(([before, wrong, after, correct], i) => ({
      id: `q7-s${i + 1}`,
      type: "text" as const,
      prompt: `${before} ${wrong} ${after}`,
      marks: 1,
      accept: [correct],
      placeholder: "Type the correct verb",
      segments: { before, wrong, after },
    })),
  },
  {
    number: 8,
    id: "q8",
    lesson: L1,
    typeLabel: "Word Formation",
    instruction:
      "Write the -ing form of each verb. Watch the spelling rules you studied.",
    marks: 5,
    explanation:
      "play → playing (just add -ing); hide → hiding and write → writing (remove the e); die → dying and lie → lying (ie changes to y).",
    curriculumRef:
      "Lesson 1 — WB p.4 '-ing' spelling notes (play→playing, hide→hiding, die→dying).",
    subparts: ([
      ["play", ["playing"]],
      ["hide", ["hiding"]],
      ["die", ["dying"]],
      ["write", ["writing"]],
      ["lie", ["lying"]],
    ] as [string, string[]][]).map(([word, accept], i) => ({
      id: `q8-s${i + 1}`,
      type: "text" as const,
      prompt: `${i + 1}. ${word} →`,
      marks: 1,
      accept,
      placeholder: `-ing form of ${word}`,
    })),
  },
  {
    number: 9,
    id: "q9",
    lesson: L1,
    typeLabel: "Short Answer",
    instruction:
      "Read the passage, then answer each question with a SHORT answer taken from the text. (2.5 marks each)",
    passage: PASSAGE_B,
    marks: 5,
    explanation:
      "Adam was four years old when he first went to kindergarten, and the last lines of the passage tell us he wants to be an engineer one day.",
    curriculumRef:
      "Lesson 1 — WB pp.2–3 Reading 'School Life' (kindergarten, first day, future career).",
    subparts: [
      {
        id: "q9-s1",
        type: "text" as const,
        prompt: "How old was Adam when he first went to kindergarten?",
        marks: 2.5,
        accept: [
          "four",
          "4",
          "four years old",
          "4 years old",
          "only four",
          "only four years old",
          "he was four",
          "he was four years old",
          "four years",
          "about four",
          "about four years old",
        ],
        placeholder: "Your short answer",
      },
      {
        id: "q9-s2",
        type: "text" as const,
        prompt: "What does Adam want to be one day?",
        marks: 2.5,
        accept: [
          "an engineer",
          "engineer",
          "a engineer",
          "to be an engineer",
          "be an engineer",
          "he wants to be an engineer",
          "wants to be an engineer",
          "adam wants to be an engineer",
        ],
        placeholder: "Your short answer",
      },
    ],
  },
  {
    number: 10,
    id: "q10",
    lesson: L1,
    typeLabel: "True or False",
    instruction:
      "Read the passage again (from Question 9), then decide if each statement is True or False.",
    passage: PASSAGE_B,
    marks: 5,
    explanation:
      "Adam was four (not six); he cried at first and felt happy only after a while; Miss Rana was his teacher; older students study independently; his remarkable skill is in drawing, not swimming.",
    curriculumRef:
      "Lesson 1 — WB pp.2–3 Reading 'School Life': identifying reading details.",
    subparts: [
      { prompt: "Adam was six years old when he started kindergarten.", correct: false },
      { prompt: "Adam felt happy at once on his first day.", correct: false },
      { prompt: "Miss Rana was Adam's teacher.", correct: true },
      { prompt: "Older students learn to study independently.", correct: true },
      { prompt: "Adam has a remarkable skill in swimming.", correct: false },
    ].map((d, i) => ({
      id: `q10-s${i + 1}`,
      type: "tf" as const,
      prompt: d.prompt,
      marks: 1,
      correct: d.correct,
    })),
  },

  /* ======================= LESSON 2 — SCHOOL CHALLENGES (Q11–Q20) ======================= */
  {
    number: 11,
    id: "q11",
    lesson: L2,
    typeLabel: "Reading Comprehension",
    instruction:
      "Read the passage, then choose the correct answer (a, b or c) for each item.",
    passage: PASSAGE_C,
    marks: 5,
    explanation:
      "Sami lost his self-esteem because everything at the new school felt difficult; 'hesitated' means he was slow to act because he felt uncertain; his marks dropped because he was careless about homework; his mother noticed first; in the end school became a happy place again.",
    curriculumRef:
      "Lesson 2 — SB p.13 Reading 'A Worrying Time' & p.13 key words (self-esteem, hesitate).",
    subparts: [
      {
        prompt: "Sami lost his self-esteem because …",
        options: [
          "he won a big prize",
          "everything at the new school felt difficult",
          "the school was small and friendly",
        ],
        correctIndex: 1,
      },
      {
        prompt: "The word “hesitated” in the passage is closest in meaning to …",
        options: [
          "was slow to act because he felt uncertain",
          "acted quickly and happily",
          "ran to the classroom",
        ],
        correctIndex: 0,
      },
      {
        prompt: "Sami's marks became low because …",
        options: [
          "the bus was always late",
          "he studied too much",
          "he was careless about his homework",
        ],
        correctIndex: 2,
      },
      {
        prompt: "Who first noticed Sami's problem?",
        options: ["His mother", "The social worker", "His classmates"],
        correctIndex: 0,
      },
      {
        prompt: "At the end of the passage, school became …",
        options: [
          "more complicated",
          "bigger than before",
          "a happy place again",
        ],
        correctIndex: 2,
      },
    ].map((d, i) => ({
      id: `q11-s${i + 1}`,
      type: "mcq" as const,
      prompt: d.prompt,
      marks: 1,
      options: [...d.options],
      correctIndex: d.correctIndex,
    })),
  },
  {
    number: 12,
    id: "q12",
    lesson: L2,
    typeLabel: "True or False",
    instruction:
      "Read the passage. Decide if statements 1–4 are True or False, then choose the correct version of statement 4.",
    passage: PASSAGE_D,
    marks: 5,
    explanation:
      "Bullies use many forms (not only name-calling); they do take or damage belongings; bullying hurts feelings; statement 4 is false — if you see bullying you should tell a teacher or a parent, not keep silent.",
    curriculumRef:
      "Lesson 2 — WB pp.6–7 Reading 'Bullying': True/False with correction.",
    subparts: [
      {
        id: "q12-s1",
        type: "tf" as const,
        prompt: "Bullies always use only name-calling.",
        marks: 1,
        correct: false,
      },
      {
        id: "q12-s2",
        type: "tf" as const,
        prompt: "Some bullies take or damage other students' belongings.",
        marks: 1,
        correct: true,
      },
      {
        id: "q12-s3",
        type: "tf" as const,
        prompt: "According to the passage, bullying hurts other people's feelings.",
        marks: 1,
        correct: true,
      },
      {
        id: "q12-s4",
        type: "tf" as const,
        prompt: "If you see bullying, you should keep silent.",
        marks: 1,
        correct: false,
      },
      {
        id: "q12-s5",
        type: "mcq" as const,
        prompt: "Statement 4 is False. Choose the correct version:",
        marks: 1,
        options: [
          "If you see bullying, keep it a secret.",
          "If you see bullying, tell a teacher or a parent.",
          "If you see bullying, join the bully.",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    number: 13,
    id: "q13",
    lesson: L2,
    typeLabel: "Vocabulary Matching",
    instruction:
      "Match each key word (1–5) with its correct meaning from the box (a–e).",
    wordBank: MATCH_DEFS_L2.map((d, i) => `${String.fromCharCode(97 + i)}) ${d}`),
    marks: 5,
    explanation:
      "self-esteem = a feeling of being happy with your character and abilities; hesitate = to be slow to act because you feel uncertain; belongings = the things that you own; oblige = to force somebody to do something; jealous = feeling unhappy because somebody has something you wish you had.",
    curriculumRef:
      "Lesson 2 — SB p.13 & WB p.6 Key Words boxes.",
    subparts: ([
      ["self-esteem", MATCH_DEFS_L2[0]],
      ["hesitate", MATCH_DEFS_L2[1]],
      ["belongings", MATCH_DEFS_L2[2]],
      ["oblige", MATCH_DEFS_L2[3]],
      ["jealous", MATCH_DEFS_L2[4]],
    ] as [string, string][]).map(([word, def], i) => ({
      id: `q13-s${i + 1}`,
      type: "select" as const,
      prompt: `${i + 1}. ${word}`,
      marks: 1,
      options: MATCH_DEFS_L2.map(
        (d, j) => `${String.fromCharCode(97 + j)}) ${d}`,
      ),
      correct: `${String.fromCharCode(97 + MATCH_DEFS_L2.indexOf(def))}) ${def}`,
    })),
  },
  {
    number: 14,
    id: "q14",
    lesson: L2,
    typeLabel: "Fill in the Blanks",
    instruction:
      "Complete each sentence with the correct word or phrase from the box. One option is extra.",
    wordBank: ["on purpose", "depressed", "complicated", "popular", "entertainment", "possible"],
    marks: 5,
    explanation:
      "Breaking glasses 'on purpose' is not an accident; feeling sad and lonely is 'depressed'; instructions nobody understands are 'complicated'; someone liked by many people is 'popular'; films and games are 'entertainment'. ('possible' is the extra word.)",
    curriculumRef:
      "Lesson 2 — SB p.14 & WB p.6 vocabulary (on purpose, depressed, complicated, popular, entertainment).",
    subparts: ([
      ["The older boy broke my glasses", "; it was not an accident.", "on purpose"],
      ["After losing his best friend, Nader felt lonely and", ".", "depressed"],
      ["The instructions were so", "that nobody could understand them.", "complicated"],
      ["Salma became", "because everyone liked her kind behaviour.", "popular"],
      ["For many students, films and games are a favourite", ".", "entertainment"],
    ] as [string, string, string][]).map(([before, after, correct], i) => ({
      id: `q14-s${i + 1}`,
      type: "select" as const,
      prompt: before,
      marks: 1,
      options: ["on purpose", "depressed", "complicated", "popular", "entertainment", "possible"],
      correct,
      before,
      after,
    })),
  },
  {
    number: 15,
    id: "q15",
    lesson: L2,
    typeLabel: "Choose the Correct Tense",
    instruction:
      "Choose the correct tense (Past Simple or Past Progressive) for each sentence.",
    marks: 5,
    explanation:
      "The Past Progressive describes an action in progress at a past time (were writing, were playing, were watching); the Past Simple describes the shorter completed event (entered, met). 'At nine o'clock last night' asks about an action in progress → were you doing.",
    curriculumRef:
      "Lesson 2 — WB p.8 Past Simple / Past Progressive tables; when-while rules.",
    subparts: [
      {
        prompt: "When the teacher ___ the classroom, all the students were writing.",
        options: ["entered", "was entering"],
        correctIndex: 0,
      },
      {
        prompt: "I ___ my old friend while I was walking to school.",
        options: ["met", "was meeting"],
        correctIndex: 0,
      },
      {
        prompt: "They ___ football at four o'clock yesterday afternoon.",
        options: ["played", "were playing"],
        correctIndex: 1,
      },
      {
        prompt: "What ___ at nine o'clock last night?",
        options: ["did you do", "were you doing"],
        correctIndex: 1,
      },
      {
        prompt: "We ___ a documentary when the electricity went out.",
        options: ["watched", "were watching"],
        correctIndex: 1,
      },
    ].map((d, i) => ({
      id: `q15-s${i + 1}`,
      type: "mcq" as const,
      prompt: d.prompt,
      marks: 1,
      options: [...d.options],
      correctIndex: d.correctIndex,
    })),
  },
  {
    number: 16,
    id: "q16",
    lesson: L2,
    typeLabel: "Choose the Correct Tense",
    instruction:
      "Write the verb in brackets in the correct tense: Past Simple or Past Progressive.",
    marks: 5,
    explanation:
      "was walking / was sleeping: longer actions in progress; went / broke / arrived: shorter completed events. The pattern is: while/when + past progressive for the background, past simple for the interrupting event.",
    curriculumRef:
      "Lesson 2 — WB p.8 exercise B 'Write the verbs in the correct tense'.",
    subparts: ([
      ["While I", "(walk) home, I found a wallet.", ["was walking"]],
      ["The lights", "(go) out while we were studying.", ["went"]],
      ["He", "(break) his leg while he was playing football.", ["broke"]],
      ["When they", "(arrive), we were waiting at the station.", ["arrived"]],
      ["I", "(sleep) when the storm started.", ["was sleeping"]],
    ] as [string, string, string[]][]).map(([before, after, accept], i) => ({
      id: `q16-s${i + 1}`,
      type: "text" as const,
      prompt: `${before} ___ ${after}`,
      marks: 1,
      accept,
      placeholder: "Type the verb in the correct tense",
    })),
  },
  {
    number: 17,
    id: "q17",
    lesson: L2,
    typeLabel: "Word Formation",
    instruction:
      "Write the noun (-ing form) of each verb, as in the workbook table. Example: bully → bullying.",
    marks: 5,
    explanation:
      "kick → kicking, knock → knocking, hit → hitting (double the t), belong → belonging, push → pushing — the verb → noun table from Workbook page 7.",
    curriculumRef: "Lesson 2 — WB p.7 Vocabulary: verb → noun table.",
    subparts: ([
      ["kick", ["kicking"]],
      ["knock", ["knocking"]],
      ["hit", ["hitting"]],
      ["belong", ["belonging"]],
      ["push", ["pushing"]],
    ] as [string, string[]][]).map(([word, accept], i) => ({
      id: `q17-s${i + 1}`,
      type: "text" as const,
      prompt: `${i + 1}. ${word} →`,
      marks: 1,
      accept,
      placeholder: `noun form of ${word}`,
    })),
  },
  {
    number: 18,
    id: "q18",
    lesson: L2,
    typeLabel: "Pronunciation",
    instruction:
      "In each item, only ONE word contains the silent letter asked about. Choose that word.",
    marks: 5,
    explanation:
      "Silent h: honest, hour and school (the h is not pronounced). Silent gh: though and daughter — in tough, laugh, enough, cough and rough 'gh' is pronounced /f/, and in ghost it is /g/.",
    curriculumRef:
      "Lesson 2 — SB p.15 Pronunciation: silent letters (h, gh).",
    subparts: [
      {
        prompt: "Which word has a silent h?",
        options: ["house", "honest", "hen", "hill"],
        correctIndex: 1,
      },
      {
        prompt: "Which word has a silent gh?",
        options: ["tough", "though", "laugh", "enough"],
        correctIndex: 1,
      },
      {
        prompt: "Which word has a silent h?",
        options: ["how", "hour", "hotel", "hand"],
        correctIndex: 1,
      },
      {
        prompt: "Which word has a silent gh?",
        options: ["daughter", "ghost", "cough", "rough"],
        correctIndex: 0,
      },
      {
        prompt: "Which word has a silent h?",
        options: ["chair", "cheese", "school", "lunch"],
        correctIndex: 2,
      },
    ].map((d, i) => ({
      id: `q18-s${i + 1}`,
      type: "mcq" as const,
      prompt: d.prompt,
      marks: 1,
      options: [...d.options],
      correctIndex: d.correctIndex,
    })),
  },
  {
    number: 19,
    id: "q19",
    lesson: L2,
    typeLabel: "Short Answer",
    instruction:
      "Read the passage (from Question 12), then answer each question with a SHORT answer taken from the text. (2.5 marks each)",
    passage: PASSAGE_D,
    marks: 5,
    explanation:
      "The passage tells us to tell a teacher or a parent when we see bullying, and its golden rule is: treat others the way you want them to treat you.",
    curriculumRef:
      "Lesson 2 — WB pp.6–7 Reading 'Bullying': identifying solutions and key messages.",
    subparts: [
      {
        id: "q19-s1",
        type: "text" as const,
        prompt: "What should you do if you see bullying?",
        marks: 2.5,
        accept: [
          "tell a teacher or a parent",
          "tell a teacher or parent",
          "tell teacher or parent",
          "tell a teacher",
          "tell a parent",
          "tell the teacher",
          "tell the teacher or a parent",
          "tell my teacher",
          "tell my parents",
          "tell my teacher or my parents",
          "tell my teacher or a parent",
          "tell a parent or a teacher",
          "we should tell a teacher or a parent",
          "don't keep silent and tell a teacher or a parent",
        ],
        placeholder: "Your short answer",
      },
      {
        id: "q19-s2",
        type: "text" as const,
        prompt: "What is the golden rule mentioned at the end of the passage?",
        marks: 2.5,
        accept: [
          "treat others the way you want them to treat you",
          "treat others the way that you want them to treat you",
          "treat others the way you would want them to treat you",
          "treat others as you want them to treat you",
          "treat others how you want them to treat you",
          "treat others the way you want to be treated",
          "the golden rule treat others the way you want them to treat you",
        ],
        placeholder: "Your short answer",
      },
    ],
  },
  {
    number: 20,
    id: "q20",
    lesson: L2,
    typeLabel: "Sentence Correction",
    instruction:
      "Each sentence has ONE mistake in the highlighted verb. Type only the correct form of that verb.",
    marks: 5,
    explanation:
      "seen→saw (past simple of see); was→were (agrees with 'they'); buyed→bought and teached→taught (irregular past forms); after 'didn't' we use the base verb: go, not went.",
    curriculumRef:
      "Lesson 2 — WB p.8 Past Simple (irregular verbs, negatives, subject–verb agreement).",
    subparts: ([
      ["I", "seen", "the head teacher yesterday.", "saw"],
      ["They", "was", "playing cards at five o'clock.", "were"],
      ["She", "buyed", "a new uniform last week.", "bought"],
      ["We didn't", "went", "to school on Friday.", "go"],
      ["He", "teached", "us a lovely song.", "taught"],
    ] as [string, string, string, string][]).map(([before, wrong, after, correct], i) => ({
      id: `q20-s${i + 1}`,
      type: "text" as const,
      prompt: `${before} ${wrong} ${after}`,
      marks: 1,
      accept: [correct],
      placeholder: "Type the correct verb",
      segments: { before, wrong, after },
    })),
  },
];

export const EXAM_TITLE =
  "Grade 8 English Exam — Unit 1: Future Plans & School Challenges";
export const TOTAL_QUESTIONS = QUESTIONS.length;
export const TOTAL_MARKS = QUESTIONS.reduce((acc, q) => acc + q.marks, 0);

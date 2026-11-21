import type { Question, SubQuestion } from "./types";

/**
 * English Foundation Exam — Test 2
 * 20 main questions × 5 marks = 100 marks.
 * Curriculum: Lessons 1, 2, 3, 4, 5 and 16 of the source course.
 * Lesson references are shown to teachers only (never during the attempt).
 */

const t = (
  id: string,
  label: string,
  prompt: string,
  accept: string[],
  explanation: string,
  marks = 1,
  placeholder?: string,
): SubQuestion => ({ type: "text", id, label, prompt, accept, explanation, marks, placeholder });

const c = (
  id: string,
  label: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  marks = 1,
): SubQuestion => ({ type: "choice", id, label, prompt, options, answer, explanation, marks });

const o = (
  id: string,
  label: string,
  prompt: string,
  words: string[],
  answer: string,
  explanation: string,
  marks = 1,
): SubQuestion => ({ type: "order", id, label, prompt, words, answer, explanation, marks });

const m = (
  id: string,
  label: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  marks = 1,
): SubQuestion => ({ type: "match", id, label, prompt, options, answer, explanation, marks });

const POSS = ["my", "your", "his", "her", "its", "our", "their"];

export const QUESTIONS: Question[] = [
  // 1 — Lesson 16: possessive adjectives (fill in the blank)
  {
    number: 1,
    title: "Fill in each blank with the correct word: my, your, his, her, its, our or their.",
    lesson: "Lesson 16",
    skill: "Possessive adjectives — choosing the correct form from the owner",
    subs: [
      t("1a", "a", "Omar has a bicycle. ______ bicycle is red.", ["his"], "Omar is one male person, so the possessive adjective is \"his\"."),
      t("1b", "b", "I have a notebook. ______ notebook is blue.", ["my"], "The owner is \"I\", so we use \"my\" before the noun."),
      t("1c", "c", "Lina and Yousef have a garden. ______ garden is big.", ["their"], "Lina and Yousef are two people (they), so we use \"their\"."),
      t("1d", "d", "The cat has a bed. ______ bed is soft.", ["its"], "The owner is an animal (it), so we use \"its\" with no apostrophe."),
      t("1e", "e", "You have a jacket. ______ jacket is warm.", ["your"], "The owner is \"you\", so the possessive adjective is \"your\"."),
    ],
  },

  // 2 — Lesson 3: negative verb to be
  {
    number: 2,
    title: "Make each sentence negative. Write the missing words (am not, is not or are not).",
    lesson: "Lesson 3",
    skill: "Verb to be — negative sentences",
    subs: [
      t("2a", "a", "Hana ______ hungry.", ["is not", "isn't", "'s not"], "Hana = she, so the negative is \"is not\" (not + after is)."),
      t("2b", "b", "I ______ late today.", ["am not", "'m not"], "With \"I\" we always use \"am\", so the negative is \"am not\"."),
      t("2c", "c", "The boys ______ ready.", ["are not", "aren't"], "\"The boys\" = they, so we use \"are not\"."),
      t("2d", "d", "We ______ thirsty.", ["are not", "aren't"], "With \"we\" the verb is \"are\", so the negative is \"are not\"."),
      t("2e", "e", "It ______ cold.", ["is not", "isn't", "'s not"], "With \"it\" the verb is \"is\", so the negative is \"is not\"."),
    ],
  },

  // 3 — Lesson 1: Subject, Verb, Object
  {
    number: 3,
    title: "Read the sentences and answer the questions about their parts.",
    intro: "Sentence 1: Maya reads a story.\nSentence 2: Yousef sleeps.",
    lesson: "Lesson 1",
    skill: "Sentence structure — identifying Subject, Verb and Object",
    subs: [
      t("3a", "a", "In Sentence 1, which word is the Subject (who does the action)?", ["maya"], "Ask \"Who reads?\" — Maya. The Subject is the person who does the action."),
      t("3b", "b", "In Sentence 1, which word is the Verb (the action)?", ["reads"], "Ask \"What does Maya do?\" — she reads. The Verb is the action."),
      t("3c", "c", "In Sentence 1, which words are the Object (what receives the action)?", ["a story", "story"], "Ask \"What does Maya read?\" — a story. The Object receives the action."),
      c("3d", "d", "Does Sentence 2 have an Object?", ["Yes", "No"], "No", "\"Yousef sleeps\" has a Subject and a Verb only. Not every sentence needs an Object."),
      c("3e", "e", "Which one is a complete, correct English sentence?", ["Play tennis.", "We play tennis.", "Tennis play we."], "We play tennis.", "A sentence must start with a Subject, then the Verb, then the Object: We + play + tennis."),
    ],
  },

  // 4 — Lesson 4: a / an
  {
    number: 4,
    title: "Choose a or an for each noun.",
    lesson: "Lesson 4",
    skill: "Articles — a vs. an before a singular noun",
    subs: [
      c("4a", "a", "______ egg", ["a", "an"], "an", "\"Egg\" starts with a vowel sound (e), so we use \"an\"."),
      c("4b", "b", "______ table", ["a", "an"], "a", "\"Table\" starts with a consonant sound (t), so we use \"a\"."),
      c("4c", "c", "______ actor", ["a", "an"], "an", "\"Actor\" starts with a vowel sound (a), so we use \"an\"."),
      c("4d", "d", "______ house", ["a", "an"], "a", "\"House\" starts with a consonant sound (h), so we use \"a\"."),
      c("4e", "e", "______ engineer", ["a", "an"], "an", "\"Engineer\" starts with a vowel sound (e), so we use \"an\"."),
    ],
  },

  // 5 — Lesson 5 (+3): word order with adjectives
  {
    number: 5,
    title: "Put the words in the correct order to make a sentence. Tap the words in order.",
    lesson: "Lesson 5",
    skill: "Adjective placement — after verb to be and before a noun",
    subs: [
      o("5a", "a", "Make a sentence:", ["busy", "Lina", "is"], "Lina is busy.", "Subject + verb to be + adjective: Lina is busy."),
      o("5b", "b", "Make a sentence:", ["car", "a", "It", "slow", "is"], "It is a slow car.", "The adjective comes before the noun: a slow car."),
      o("5c", "c", "Make a sentence:", ["students", "are", "They", "kind"], "They are kind students.", "The adjective \"kind\" goes before the noun \"students\"."),
      o("5d", "d", "Make a sentence:", ["am", "I", "happy"], "I am happy.", "Subject + am + adjective: I am happy."),
      o("5e", "e", "Make a sentence:", ["old", "The", "is", "house"], "The house is old.", "Subject + is + adjective: The house is old."),
    ],
  },

  // 6 — Lesson 2: rewrite with pronouns
  {
    number: 6,
    title: "Rewrite each sentence. Replace the name or noun at the start with the correct pronoun (he, she, it, we or they).",
    lesson: "Lesson 2",
    skill: "Subject pronouns — replacing nouns with pronouns",
    subs: [
      t("6a", "a", "Yousef is tired. → ______", ["he is tired", "he's tired"], "Yousef is one male person, so he becomes \"He\": He is tired.", 1, "Write the full sentence"),
      t("6b", "b", "Hana and I are students. → ______", ["we are students", "we're students"], "\"Hana and I\" includes me, so we use \"We\": We are students.", 1, "Write the full sentence"),
      t("6c", "c", "The bird is small. → ______", ["it is small", "it's small"], "An animal or thing is \"It\": It is small.", 1, "Write the full sentence"),
      t("6d", "d", "Nour and Maya are happy. → ______", ["they are happy", "they're happy"], "Two people (not including me or you) are \"They\": They are happy.", 1, "Write the full sentence"),
      t("6e", "e", "Hana is a doctor. → ______", ["she is a doctor", "she's a doctor"], "Hana is one female person, so she becomes \"She\": She is a doctor.", 1, "Write the full sentence"),
    ],
  },

  // 7 — Lesson 3: short answers
  {
    number: 7,
    title: "Write a short answer for each question. Use the tick (✓) for Yes and the cross (✗) for No.",
    lesson: "Lesson 3",
    skill: "Verb to be — short answers (Yes, he is. / No, I am not.)",
    subs: [
      t("7a", "a", "Is Omar a student? (✓)", ["yes he is"], "Omar = he. The short answer repeats the pronoun and the verb: Yes, he is.", 1, "Yes, ... / No, ..."),
      t("7b", "b", "Are you ready? (✗)", ["no i am not", "no i'm not"], "The question says \"you\", so the answer uses \"I\": No, I am not.", 1, "Yes, ... / No, ..."),
      t("7c", "c", "Is the soup hot? (✓)", ["yes it is"], "\"The soup\" is a thing = it. Short answer: Yes, it is.", 1, "Yes, ... / No, ..."),
      t("7d", "d", "Are Lina and Maya sisters? (✗)", ["no they are not", "no they aren't", "no they're not"], "Lina and Maya = they. Negative short answer: No, they are not.", 1, "Yes, ... / No, ..."),
      t("7e", "e", "Am I late? (✓)", ["yes you are"], "The question says \"I\", so the answer uses \"you\": Yes, you are.", 1, "Yes, ... / No, ..."),
    ],
  },

  // 8 — Lesson 16 vs Lesson 2: subject pronoun or possessive adjective
  {
    number: 8,
    title: "Choose the correct word to complete each sentence.",
    lesson: "Lesson 16 (with Lesson 2)",
    skill: "Distinguishing subject pronouns from possessive adjectives",
    subs: [
      c("8a", "a", "______ is a doctor.", ["She", "Her"], "She", "We need a Subject before the verb \"is\", so we use the subject pronoun \"She\". \"Her\" must be followed by a noun."),
      c("8b", "b", "______ bag is heavy.", ["He", "His"], "His", "\"Bag\" is a noun, so we need a possessive adjective before it: His bag."),
      c("8c", "c", "______ are my friends.", ["They", "Their"], "They", "The sentence needs a Subject for \"are\": They are my friends."),
      c("8d", "d", "______ school is big.", ["We", "Our"], "Our", "Before the noun \"school\" we use the possessive adjective \"Our\"."),
      c("8e", "e", "______ am happy.", ["I", "My"], "I", "\"Am\" needs the subject pronoun \"I\". \"My\" is always followed by a noun."),
    ],
  },

  // 9 — Lesson 5: adjective or noun
  {
    number: 9,
    title: "Decide whether each word is an adjective (a describing word) or a noun (a person, place or thing).",
    lesson: "Lesson 5 (with Lesson 4)",
    skill: "Distinguishing adjectives from nouns",
    subs: [
      c("9a", "a", "beautiful", ["Adjective", "Noun"], "Adjective", "\"Beautiful\" describes a person or thing, so it is an adjective."),
      c("9b", "b", "school", ["Adjective", "Noun"], "Noun", "\"School\" is a place, so it is a noun."),
      c("9c", "c", "thirsty", ["Adjective", "Noun"], "Adjective", "\"Thirsty\" describes how someone feels, so it is an adjective."),
      c("9d", "d", "engineer", ["Adjective", "Noun"], "Noun", "\"Engineer\" is a person (a job), so it is a noun."),
      c("9e", "e", "cold", ["Adjective", "Noun"], "Adjective", "\"Cold\" describes a thing or the weather, so it is an adjective."),
    ],
  },

  // 10 — Lesson 4: a / an / the in a short text
  {
    number: 10,
    title: "Read the short text and write a, an or the in each blank.",
    intro: "I see (a) ______ cat. (b) ______ cat is black. I have (c) ______ apple and (d) ______ pen. (e) ______ pen is blue.",
    lesson: "Lesson 4",
    skill: "Articles — a / an for a new noun, the for a known noun",
    subs: [
      t("10a", "a", "Blank (a): I see ______ cat.", ["a"], "The cat is mentioned for the first time, and \"cat\" starts with a consonant sound, so we use \"a\"."),
      t("10b", "b", "Blank (b): ______ cat is black.", ["the"], "Now we know which cat we are talking about, so we use \"the\"."),
      t("10c", "c", "Blank (c): I have ______ apple.", ["an"], "\"Apple\" starts with a vowel sound, so we use \"an\"."),
      t("10d", "d", "Blank (d): ... and ______ pen.", ["a"], "\"Pen\" is new in the text and starts with a consonant sound, so we use \"a\"."),
      t("10e", "e", "Blank (e): ______ pen is blue.", ["the"], "The pen was already mentioned, so we use \"the\" for the specific pen."),
    ],
  },

  // 11 — Lesson 3: making questions
  {
    number: 11,
    title: "Change each sentence into a question.",
    lesson: "Lesson 3",
    skill: "Verb to be — forming yes/no questions",
    subs: [
      t("11a", "a", "He is a teacher. → ______", ["is he a teacher"], "To make a question, move the verb to the front: Is he a teacher?", 1, "Write the question"),
      t("11b", "b", "They are hungry. → ______", ["are they hungry"], "Move \"are\" before the subject: Are they hungry?", 1, "Write the question"),
      t("11c", "c", "You are a student. → ______", ["are you a student"], "Move \"are\" to the front: Are you a student?", 1, "Write the question"),
      t("11d", "d", "She is busy. → ______", ["is she busy"], "Move \"is\" to the front: Is she busy?", 1, "Write the question"),
      t("11e", "e", "I am late. → ______", ["am i late"], "Move \"am\" to the front: Am I late?", 1, "Write the question"),
    ],
  },

  // 12 — Lesson 1: what is missing?
  {
    number: 12,
    title: "Read each group of words. Decide what is missing: the Subject, the Verb, or nothing.",
    lesson: "Lesson 1",
    skill: "Sentence structure — recognising a missing Subject or Verb",
    subs: [
      c("12a", "a", "Watches TV.", ["The Subject is missing", "The Verb is missing", "Nothing is missing"], "The Subject is missing", "We do not know who watches TV. A sentence must start with a Subject."),
      c("12b", "b", "Lina water.", ["The Subject is missing", "The Verb is missing", "Nothing is missing"], "The Verb is missing", "There is no action. We need a Verb, for example: Lina drinks water."),
      c("12c", "c", "They play games.", ["The Subject is missing", "The Verb is missing", "Nothing is missing"], "Nothing is missing", "They (Subject) + play (Verb) + games (Object) — a complete sentence."),
      c("12d", "d", "Drink juice.", ["The Subject is missing", "The Verb is missing", "Nothing is missing"], "The Subject is missing", "Who drinks juice? The Subject is missing."),
      c("12e", "e", "Nour a letter.", ["The Subject is missing", "The Verb is missing", "Nothing is missing"], "The Verb is missing", "Nour is the Subject and \"a letter\" is the Object, but there is no Verb (for example: writes)."),
    ],
  },

  // 13 — Lesson 5: correct the mistake
  {
    number: 13,
    title: "Each sentence has one mistake with an adjective. Write the correct sentence.",
    lesson: "Lesson 5",
    skill: "Adjective rules — no \"a\" before a lone adjective, no plural -s, correct placement",
    subs: [
      t("13a", "a", "Maya is a kind.", ["maya is kind"], "We do not use \"a\" before an adjective alone: Maya is kind.", 1, "Write the correct sentence"),
      t("13b", "b", "The girls are youngs.", ["the girls are young"], "Adjectives never take -s, even with plural subjects: The girls are young.", 1, "Write the correct sentence"),
      t("13c", "c", "It is a car fast.", ["it is a fast car", "it's a fast car"], "The adjective comes before the noun: a fast car.", 1, "Write the correct sentence"),
      t("13d", "d", "He strong is.", ["he is strong", "he's strong"], "The verb to be comes before the adjective: He is strong.", 1, "Write the correct sentence"),
      t("13e", "e", "She is good student.", ["she is a good student", "she's a good student"], "When an adjective comes before a singular noun, we need \"a\": a good student.", 1, "Write the correct sentence"),
    ],
  },

  // 14 — Lesson 16: its vs it's
  {
    number: 14,
    title: "Choose its or it's to complete each sentence.",
    lesson: "Lesson 16",
    skill: "Possessive adjective \"its\" vs. the short form \"it's\" (it is)",
    subs: [
      c("14a", "a", "The dog moved ______ tail.", ["its", "it's"], "its", "\"Tail\" belongs to the dog, so we need the possessive adjective \"its\" (no apostrophe)."),
      c("14b", "b", "______ a sunny day.", ["Its", "It's"], "It's", "\"It's\" means \"it is\": It is a sunny day."),
      c("14c", "c", "The robot lost ______ battery.", ["its", "it's"], "its", "The battery belongs to the robot, so we use \"its\"."),
      c("14d", "d", "______ my notebook.", ["Its", "It's"], "It's", "\"It's\" = it is: It is my notebook."),
      c("14e", "e", "The bird is in ______ nest.", ["its", "it's"], "its", "The nest belongs to the bird, so we use the possessive adjective \"its\"."),
    ],
  },

  // 15 — Lesson 2: pronouns + am/is/are mistakes
  {
    number: 15,
    title: "Each sentence has one mistake. Write the correct sentence.",
    lesson: "Lesson 2",
    skill: "Pronouns with am / is / are and the capital letter in \"I\"",
    subs: [
      t("15a", "a", "i am a student.", ["I am a student"], "The pronoun \"I\" is always written with a capital letter: I am a student.", 1, "Write the correct sentence"),
      t("15b", "b", "She are tired.", ["she is tired", "she's tired"], "With \"she\" we use \"is\": She is tired.", 1, "Write the correct sentence"),
      t("15c", "c", "We is friends.", ["we are friends", "we're friends"], "With \"we\" we use \"are\": We are friends.", 1, "Write the correct sentence"),
      t("15d", "d", "He happy.", ["he is happy", "he's happy"], "The sentence needs verb to be: He is happy.", 1, "Write the correct sentence"),
      t("15e", "e", "They am students.", ["they are students", "they're students"], "\"Am\" is only for \"I\". With \"they\" we use \"are\": They are students.", 1, "Write the correct sentence"),
    ],
  },

  // 16 — Lesson 4: articles with jobs and nouns (correct the mistake)
  {
    number: 16,
    title: "Each sentence has a mistake with a or an. Write the correct sentence.",
    lesson: "Lesson 4",
    skill: "Articles — using a / an before singular nouns (jobs and things)",
    subs: [
      t("16a", "a", "I am teacher.", ["I am a teacher", "I'm a teacher"], "A singular noun for a job needs an article: I am a teacher.", 1, "Write the correct sentence"),
      t("16b", "b", "She is a engineer.", ["she is an engineer", "she's an engineer"], "\"Engineer\" starts with a vowel sound, so we use \"an\".", 1, "Write the correct sentence"),
      t("16c", "c", "He is a actor.", ["he is an actor", "he's an actor"], "\"Actor\" starts with a vowel sound, so we use \"an\".", 1, "Write the correct sentence"),
      t("16d", "d", "It is cat.", ["it is a cat", "it's a cat"], "A singular noun needs an article: It is a cat.", 1, "Write the correct sentence"),
      t("16e", "e", "Omar is an student.", ["omar is a student", "omar's a student"], "\"Student\" starts with a consonant sound, so we use \"a\".", 1, "Write the correct sentence"),
    ],
  },

  // 17 — Lesson 3 reading
  {
    number: 17,
    title: "Read the text, then answer the questions. Use short answers (for example: Yes, she is. / No, it is not.).",
    intro: "Hello! My name is Nour. I am a student. I am not tall. My brother Yousef is a doctor. He is busy today. We are happy. Our house is small, but it is not cold.",
    lesson: "Lesson 3 (with Lesson 16)",
    skill: "Reading comprehension — verb to be questions, negatives and short answers",
    subs: [
      t("17a", "a", "Is Nour a teacher?", ["no she is not", "no she isn't", "no she's not"], "The text says Nour is a student, not a teacher: No, she is not.", 1, "Yes, ... / No, ..."),
      t("17b", "b", "Is Yousef busy today?", ["yes he is"], "The text says \"He is busy today\": Yes, he is.", 1, "Yes, ... / No, ..."),
      c("17c", "c", "True or false: Nour is tall.", ["True", "False"], "False", "The text says \"I am not tall\", so the statement is false."),
      t("17d", "d", "Are Nour and Yousef happy?", ["yes they are"], "The text says \"We are happy\". Nour and Yousef = they: Yes, they are.", 1, "Yes, ... / No, ..."),
      t("17e", "e", "Is their house big?", ["no it is not", "no it isn't", "no it's not"], "The text says \"Our house is small\", so: No, it is not.", 1, "Yes, ... / No, ..."),
    ],
  },

  // 18 — Lesson 5 (+4): join two sentences with adjective + noun
  {
    number: 18,
    title: "Join the two sentences into one sentence. Put the adjective before the noun.",
    lesson: "Lesson 5 (with Lesson 4)",
    skill: "Adjective + noun with the correct article",
    subs: [
      t("18a", "a", "Lina is a girl. She is smart. → ______", ["lina is a smart girl", "lina's a smart girl"], "Put the adjective before the noun: Lina is a smart girl.", 1, "Write one sentence"),
      t("18b", "b", "It is a house. It is big. → ______", ["it is a big house", "it's a big house"], "Adjective + noun: a big house.", 1, "Write one sentence"),
      t("18c", "c", "Omar is a teacher. He is tall. → ______", ["omar is a tall teacher", "omar's a tall teacher"], "Adjective + noun: a tall teacher.", 1, "Write one sentence"),
      t("18d", "d", "They are students. They are happy. → ______", ["they are happy students", "they're happy students"], "With a plural noun there is no \"a\": They are happy students.", 1, "Write one sentence"),
      t("18e", "e", "It is a car. It is old. → ______", ["it is an old car", "it's an old car"], "\"Old\" starts with a vowel sound, so the article changes to \"an\": an old car.", 1, "Write one sentence"),
    ],
  },

  // 19 — Lesson 16: match owners to possessive adjectives
  {
    number: 19,
    title: "Match each owner with the correct possessive adjective.",
    lesson: "Lesson 16",
    skill: "Possessive adjectives — matching the owner to my / your / his / her / its / our / their",
    subs: [
      m("19a", "a", "Yousef and Omar → ______ classroom", POSS, "their", "Yousef and Omar = they, so the possessive adjective is \"their\"."),
      m("19b", "b", "Hana → ______ sister", POSS, "her", "Hana is one female person = she, so we use \"her\"."),
      m("19c", "c", "My friend and I → ______ team", POSS, "our", "\"My friend and I\" = we, so we use \"our\"."),
      m("19d", "d", "The robot → ______ battery", POSS, "its", "A thing = it, so the possessive adjective is \"its\"."),
      m("19e", "e", "Yousef → ______ computer", POSS, "his", "Yousef is one male person = he, so we use \"his\"."),
    ],
  },

  // 20 — Mixed: dialogue (Lessons 2, 3, 16)
  {
    number: 20,
    title: "Complete the dialogue. Write one word in each blank.",
    intro:
      "Adam: Hello! (a) ______ you a new student?\nOmar: Yes, I (b) ______. My name is Omar.\nAdam: (c) ______ this your bag?\nOmar: No, it is not. (d) ______ bag is blue.\nAdam: Nice to meet you! (e) ______ teacher is Mr. Sami. He is kind.",
    lesson: "Lessons 2, 3 and 16",
    skill: "Dialogue — questions and short answers with verb to be, possessive adjectives",
    subs: [
      t("20a", "a", "Blank (a): ______ you a new student?", ["are"], "Questions with \"you\" start with \"Are\": Are you a new student?"),
      t("20b", "b", "Blank (b): Yes, I ______.", ["am"], "The short answer for \"I\" is \"Yes, I am.\""),
      t("20c", "c", "Blank (c): ______ this your bag?", ["is"], "\"This\" is one thing, so the question starts with \"Is\"."),
      t("20d", "d", "Blank (d): ______ bag is blue.", ["my"], "Omar is talking about his own bag, so he says \"My bag\"."),
      t("20e", "e", "Blank (e): ______ teacher is Mr. Sami.", ["our"], "Adam and Omar share the same teacher, so Adam says \"Our teacher\"."),
    ],
  },
];

export const TOTAL_MARKS = QUESTIONS.reduce(
  (sum, q) => sum + q.subs.reduce((s, sub) => s + sub.marks, 0),
  0,
);

export const EXAM_LABEL = "English Foundation Exam";
export const EXAM_SUBLABEL = "Test 2";
export const TEACHER_PASSWORD = "somer173";

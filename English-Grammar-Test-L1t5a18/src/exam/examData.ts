export type LessonId = 1 | 2 | 3 | 4 | 5 | 18;

export type BranchVariant = "choice" | "be" | "text" | "order";

export interface Branch {
  id: string;
  prompt: string;
  display?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  variant: BranchVariant;
  options?: string[];
  orderTokens?: string[];
  correct: string;
  accepted?: string[];
  displayCorrect: string;
  explanation: string;
  lesson: LessonId;
  skill: string;
  marks: number;
}

export interface ExamQuestion {
  number: number;
  title: string;
  icon: string;
  lessons: LessonId[];
  totalMarks: number;
  instructions: string;
  kindLabel: string;
  markingGuide: string;
  partialCredit: string;
  branches: Branch[];
}

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

const choice = (
  id: string,
  prompt: string,
  display: string,
  options: string[],
  correct: string,
  explanation: string,
  lesson: LessonId,
  skill: string,
  marks = 1,
  accepted: string[] = []
): Branch => ({
  id,
  prompt,
  display,
  options,
  correct,
  displayCorrect: correct,
  accepted,
  explanation,
  lesson,
  skill,
  marks,
  variant: "choice",
});

const beBranch = (
  id: string,
  before: string,
  after: string,
  correct: string,
  lesson: LessonId,
  skill: string
): Branch => ({
  id,
  prompt: "Choose the correct word for the blank.",
  prefix: before,
  suffix: after,
  options: ["am", "is", "are"],
  correct,
  displayCorrect: `${before} ${correct} ${after}`.replace(/\s+([.,!?])/g, "$1"),
  explanation:
    correct === "am"
      ? "Use am with I."
      : correct === "is"
        ? "Use is with one person, one animal, or one thing."
        : "Use are with you, we, they, or a plural subject.",
  lesson,
  skill,
  marks: 1,
  variant: "be",
});

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    number: 1,
    title: "Sentence Structure",
    icon: "blocks",
    lessons: [1],
    totalMarks: 10,
    instructions: "Read each sentence. Choose the subject, the verb, or the object.",
    kindLabel: "Recognition",
    markingGuide: "Five branches. Each branch is worth 2 marks.",
    partialCredit: "No half marks. Each branch is marked independently.",
    branches: [
      choice(
        "1a",
        "What is the subject?",
        "The chef cooks pasta.",
        ["The chef", "cooks", "pasta", "chef cooks"],
        "The chef",
        "The subject tells us who does the action. The chef is the person who cooks.",
        1,
        "Identify the subject",
        2
      ),
      choice(
        "1b",
        "What is the verb?",
        "Birds fly south every winter.",
        ["fly", "Birds", "south", "winter"],
        "fly",
        "The verb tells us the action. The birds fly, so fly is the verb.",
        1,
        "Identify the verb",
        2
      ),
      choice(
        "1c",
        "What is the object?",
        "Mira drinks orange juice.",
        ["orange juice", "Mira", "drinks", "Mira drinks"],
        "orange juice",
        "The object receives the action. Mira drinks orange juice.",
        1,
        "Identify the object",
        2
      ),
      choice(
        "1d",
        "Which sentence has NO object?",
        "Choose one sentence.",
        [
          "Adam sleeps early.",
          "Mia loves music.",
          "Khalil opens the window.",
          "Sara drinks tea."
        ],
        "Adam sleeps early.",
        "Sleep does not need an object here. The sentence has a subject and a verb, but no object.",
        1,
        "Sentences with and without an object",
        2
      ),
      choice(
        "1e",
        "Which sentence is in the correct Subject + Verb + Object order?",
        "Choose one sentence.",
        [
          "Mia eats an apple.",
          "Eats Mia an apple.",
          "Mia an apple eats.",
          "An apple eats Mia."
        ],
        "Mia eats an apple.",
        "Mia is the subject, eats is the verb, and an apple is the object.",
        1,
        "Build Subject + Verb + Object order",
        2
      ),
    ],
  },
  {
    number: 2,
    title: "Build a Sentence",
    icon: "puzzle",
    lessons: [1],
    totalMarks: 8,
    instructions:
      "Tap the words in the correct order to build each sentence. One sentence has no object.",
    kindLabel: "Word ordering",
    markingGuide: "Four branches. Each complete sentence is worth 2 marks.",
    partialCredit:
      "All-or-nothing per sentence. A correct sentence with an extra or missing word does not earn the branch mark.",
    branches: [
      {
        id: "2a",
        prompt: "Build a sentence. Try Subject + Verb.",
        variant: "order",
        options: ["boy", "runs", "The"],
        orderTokens: ["boy", "runs", "The"],
        correct: "The boy runs",
        displayCorrect: "The boy runs.",
        accepted: ["the boy runs"],
        explanation:
          "Start with the subject The boy, then the verb runs. This sentence needs no object.",
        lesson: 1,
        skill: "Build a sentence without an object",
        marks: 2,
      },
      {
        id: "2b",
        prompt: "Build a sentence. Try Subject + Verb + Object.",
        variant: "order",
        options: ["reads", "Sara", "book", "a"],
        orderTokens: ["reads", "Sara", "book", "a"],
        correct: "Sara reads a book",
        displayCorrect: "Sara reads a book.",
        accepted: ["sara reads a book"],
        explanation:
          "Sara is the subject, reads is the verb, and a book is the object.",
        lesson: 1,
        skill: "Build Subject + Verb + Object order",
        marks: 2,
      },
      {
        id: "2c",
        prompt: "Build a sentence with a plural subject.",
        variant: "order",
        options: ["play", "They", "football"],
        orderTokens: ["play", "They", "football"],
        correct: "They play football",
        displayCorrect: "They play football.",
        accepted: ["they play football"],
        explanation:
          "They is the subject, play is the verb, and football is the object.",
        lesson: 1,
        skill: "Build Subject + Verb + Object order",
        marks: 2,
      },
      {
        id: "2d",
        prompt: "Build a sentence with the correct action.",
        variant: "order",
        options: ["drinks", "cat", "milk", "The"],
        orderTokens: ["drinks", "cat", "milk", "The"],
        correct: "The cat drinks milk",
        displayCorrect: "The cat drinks milk.",
        accepted: ["the cat drinks milk"],
        explanation:
          "The cat is the subject, drinks is the verb, and milk is the object.",
        lesson: 1,
        skill: "Build Subject + Verb + Object order",
        marks: 2,
      },
    ],
  },
  {
    number: 3,
    title: "Pronouns",
    icon: "people",
    lessons: [2],
    totalMarks: 8,
    instructions:
      "Choose the pronoun that can replace the underlined name or noun group. Two branches ask you to complete the pronoun.",
    kindLabel: "Multiple choice",
    markingGuide: "Eight branches. Each branch is worth 1 mark.",
    partialCredit: "No partial credit. Each pronoun choice is 1 mark.",
    branches: [
      choice(
        "3a",
        "Replace Khalil with a pronoun.",
        "Khalil is a student.",
        ["He", "She", "They", "It"],
        "He",
        "Khalil is one male person, so we use He.",
        2,
        "Replace a male person with a pronoun"
      ),
      choice(
        "3b",
        "Replace Sara with a pronoun.",
        "Sara is happy.",
        ["He", "She", "It", "They"],
        "She",
        "Sara is one female person, so we use She.",
        2,
        "Replace a female person with a pronoun"
      ),
      choice(
        "3c",
        "Replace the dog with a pronoun.",
        "The dog is small.",
        ["He", "She", "It", "They"],
        "It",
        "One animal is an it in this lesson.",
        2,
        "Replace an animal with a pronoun"
      ),
      choice(
        "3d",
        "Replace the books with a pronoun.",
        "The books are new.",
        ["It", "He", "They", "We"],
        "They",
        "The books are more than one thing, so we use They.",
        2,
        "Replace plural things with a pronoun"
      ),
      choice(
        "3e",
        "Replace Khalil and Adam with a pronoun.",
        "Khalil and Adam are friends.",
        ["He", "It", "They", "We"],
        "They",
        "Two other people become They.",
        2,
        "Replace a group of people with a pronoun"
      ),
      choice(
        "3f",
        "Replace Sara and I with a pronoun.",
        "Sara and I are students.",
        ["They", "We", "She", "You"],
        "We",
        "I plus another person becomes We.",
        2,
        "Replace I and another person with a pronoun"
      ),
      choice(
        "3g",
        "Complete the sentence with the correct pronoun.",
        "___ am a student.",
        ["I", "He", "They", "She"],
        "I",
        "The speaker uses I. I also takes am.",
        2,
        "Use I for the speaker"
      ),
      choice(
        "3h",
        "You are speaking to Adam. Complete the sentence.",
        "Adam, ___ are my friend.",
        ["You", "She", "It", "They"],
        "You",
        "When we speak directly to a person, we use You.",
        2,
        "Use You when speaking to a person"
      ),
    ],
  },
  {
    number: 4,
    title: "Am, Is or Are",
    icon: "balance",
    lessons: [2, 3],
    totalMarks: 10,
    instructions: "Choose am, is or are to complete each sentence.",
    kindLabel: "Fill in the blank",
    markingGuide: "Ten branches. Each branch is worth 1 mark.",
    partialCredit: "No partial credit. Each completed blank is 1 mark.",
    branches: [
      beBranch("4a", "I", "a student.", "am", 2, "Verb to be: I am"),
      beBranch("4b", "He", "happy.", "is", 2, "Verb to be: he is"),
      beBranch("4c", "She", "a teacher.", "is", 2, "Verb to be: she is"),
      beBranch("4d", "It", "small.", "is", 2, "Verb to be: it is"),
      beBranch("4e", "You", "ready.", "are", 2, "Verb to be: you are"),
      beBranch("4f", "We", "friends.", "are", 2, "Verb to be: we are"),
      beBranch("4g", "They", "students.", "are", 2, "Verb to be: they are"),
      beBranch("4h", "The car", "fast.", "is", 2, "One thing takes is"),
      beBranch("4i", "The dogs", "hungry.", "are", 18, "Plural subjects take are"),
      beBranch(
        "4j",
        "Khalil and Adam",
        "brothers.",
        "are",
        2,
        "Two people take are"
      ),
    ],
  },
  {
    number: 5,
    title: "Affirmative, Negative and Questions",
    icon: "chat",
    lessons: [3],
    totalMarks: 10,
    instructions:
      "Use Verb to Be only. Do not use do or does. Write short, complete sentences.",
    kindLabel: "Transformation",
    markingGuide: "Five branches. Each branch is worth 2 marks.",
    partialCredit:
      "A branch earns 2 marks only when the whole sentence is correct. No half marks. Corrections to capital letters or the final punctuation mark are not penalised.",
    branches: [
      {
        id: "5a",
        prompt: "Write the negative sentence.",
        display: "She is busy.",
        placeholder: "She ...",
        variant: "text",
        correct: "She is not busy.",
        accepted: ["she is not busy", "she isn't busy"],
        displayCorrect: "She is not busy.",
        explanation:
          "Put not after is: She is not busy. The short form isn't is also correct here.",
        lesson: 3,
        skill: "Affirmative to negative",
        marks: 2,
      },
      {
        id: "5b",
        prompt: "Write the question.",
        display: "He is happy.",
        placeholder: "Is ...",
        variant: "text",
        correct: "Is he happy?",
        accepted: ["is he happy"],
        displayCorrect: "Is he happy?",
        explanation:
          "In a Verb to Be question, put the verb before the subject: Is he happy? Do not add do.",
        lesson: 3,
        skill: "Statement to question with correct word order",
        marks: 2,
      },
      {
        id: "5c",
        prompt: "Choose the correct negative sentence.",
        display: "They are ready.",
        options: [
          "They are not ready.",
          "They not are ready.",
          "They do not are ready.",
          "They is not ready."
        ],
        variant: "choice",
        correct: "They are not ready.",
        accepted: ["they aren't ready."],
        displayCorrect: "They are not ready.",
        explanation:
          "Not comes after are: They are not ready. We do not use do with Verb to Be.",
        lesson: 3,
        skill: "Form a negative sentence",
        marks: 2,
      },
      {
        id: "5d",
        prompt: "Choose the correct short answer.",
        display: "Are they friends?",
        options: ["Yes, they are.", "Yes, they is.", "Yes, they am.", "Yes, they do."],
        variant: "choice",
        correct: "Yes, they are.",
        displayCorrect: "Yes, they are.",
        explanation:
          "The question begins with Are, so the short answer uses are: Yes, they are.",
        lesson: 3,
        skill: "Short answers",
        marks: 2,
      },
      {
        id: "5e",
        prompt: "Write the negative sentence.",
        display: "I am tired.",
        placeholder: "I ...",
        variant: "text",
        correct: "I am not tired.",
        accepted: ["i am not tired", "i'm not tired"],
        displayCorrect: "I am not tired.",
        explanation:
          "Put not after am: I am not tired. We do not say I not am tired.",
        lesson: 3,
        skill: "Affirmative to negative",
        marks: 2,
      },
    ],
  },
  {
    number: 6,
    title: "Nouns",
    icon: "tag",
    lessons: [4],
    totalMarks: 8,
    instructions:
      "Identify nouns and put each noun in its group: person, place, animal, or thing.",
    kindLabel: "Classification",
    markingGuide:
      "Six branches: two identification branches are 2 marks each, and four classification branches are 1 mark each.",
    partialCredit: "No partial credit. Every branch is marked on its own.",
    branches: [
      choice(
        "6a",
        "Which word is a noun?",
        "Choose one word.",
        ["school", "happy", "run", "fast"],
        "school",
        "A school is a place, so it is a noun. Happy and fast are adjectives. Run is a verb.",
        4,
        "Identify nouns",
        2
      ),
      choice(
        "6b",
        "What kind of noun is school?",
        "school",
        ["Person", "Place", "Animal", "Thing"],
        "Place",
        "A school is a place. People learn there.",
        4,
        "Classify a noun: place"
      ),
      choice(
        "6c",
        "What kind of noun is cat?",
        "cat",
        ["Person", "Place", "Animal", "Thing"],
        "Animal",
        "A cat is an animal.",
        4,
        "Classify a noun: animal"
      ),
      choice(
        "6d",
        "What kind of noun is teacher?",
        "teacher",
        ["Person", "Place", "Animal", "Thing"],
        "Person",
        "A teacher is a person.",
        4,
        "Classify a noun: person"
      ),
      choice(
        "6e",
        "What kind of noun is book?",
        "book",
        ["Person", "Place", "Animal", "Thing"],
        "Thing",
        "A book is a thing. We can hold and read it.",
        4,
        "Classify a noun: thing"
      ),
      choice(
        "6f",
        "Which word is a verb, not a noun?",
        "Choose one word.",
        ["read", "book", "car", "school"],
        "read",
        "Read is an action, so it is a verb. Book, car, and school are nouns.",
        4,
        "Distinguish nouns from verbs",
        2
      ),
    ],
  },
  {
    number: 7,
    title: "A, An or The",
    icon: "cards",
    lessons: [4],
    totalMarks: 10,
    instructions:
      "Choose the best word for each blank. Sometimes no article is needed.",
    kindLabel: "Multiple choice",
    markingGuide: "Five branches. Each branch is worth 2 marks.",
    partialCredit:
      "No partial credit within a branch. A plural noun is correct with no article, so 'No article' is the full answer in that branch.",
    branches: [
      choice(
        "7a",
        "Choose the article for one non-specific apple.",
        "___ apple",
        ["a", "an", "the", "No article"],
        "an",
        "Use an before a singular noun that starts with a vowel sound. Apple starts with a.",
        4,
        "A / An by sound",
        2
      ),
      choice(
        "7b",
        "Choose the article for one non-specific school.",
        "___ school",
        ["a", "an", "the", "No article"],
        "a",
        "Use a before a singular noun that starts with a consonant sound. School starts with s.",
        4,
        "A / An by sound",
        2
      ),
      choice(
        "7c",
        "Choose the correct article.",
        "I have a pen. ___ pen is blue.",
        ["A", "An", "The", "No article"],
        "The",
        "We now know which pen. It is the pen from the first sentence, so use The.",
        4,
        "Use The for a known noun",
        2
      ),
      choice(
        "7d",
        "Choose the correct article.",
        "___ sun is hot.",
        ["A", "An", "The", "No article"],
        "The",
        "There is only one sun. We know which one is meant, so use The.",
        4,
        "Use The for a known thing",
        2
      ),
      choice(
        "7e",
        "This is a general statement about the group. Choose the correct word.",
        "They are ___ doctors.",
        ["a", "an", "the", "No article"],
        "No article",
        "Doctors is a plural noun. Do not use a or an before a plural noun. No article is needed here.",
        4,
        "Do not use A / An with plural nouns",
        2
      ),
    ],
  },
  {
    number: 8,
    title: "Adjectives",
    icon: "palette",
    lessons: [4, 5],
    totalMarks: 8,
    instructions: "Identify adjectives and choose the correct opposite.",
    kindLabel: "Classification and opposites",
    markingGuide: "Four branches. Each branch is worth 2 marks.",
    partialCredit: "No partial credit. Each adjective answer is 2 marks.",
    branches: [
      choice(
        "8a",
        "Which word is an adjective?",
        "Choose one word.",
        ["teacher", "car", "tall", "school"],
        "tall",
        "Tall describes how a person or thing is, so it is an adjective.",
        5,
        "Identify adjectives",
        2
      ),
      choice(
        "8b",
        "Which word is a noun?",
        "Choose one word.",
        ["happy", "fast", "teacher", "tall"],
        "teacher",
        "Teacher names a person, so it is a noun. Happy, fast, and tall are adjectives.",
        5,
        "Distinguish nouns and adjectives",
        2
      ),
      choice(
        "8c",
        "Choose the opposite of big.",
        "big ↔ ?",
        ["small", "tall", "old", "fast"],
        "small",
        "The opposite of big is small.",
        5,
        "Common opposite adjectives",
        2
      ),
      choice(
        "8d",
        "Choose the opposite of young.",
        "young ↔ ?",
        ["old", "short", "weak", "slow"],
        "old",
        "The opposite of young is old.",
        5,
        "Common opposite adjectives",
        2
      ),
    ],
  },
  {
    number: 9,
    title: "Descriptive Sentences",
    icon: "sparkles",
    lessons: [3, 5],
    totalMarks: 8,
    instructions:
      "Use the pattern Subject + am/is/are + Adjective. Choose or build the correct sentence.",
    kindLabel: "Completion and ordering",
    markingGuide:
      "Four branches. Each branch is worth 2 marks. In the ordering branch, the whole sentence must be correct for 2 marks.",
    partialCredit:
      "No half marks. Word-order branches are all-or-nothing because order is the skill being checked.",
    branches: [
      choice(
        "9a",
        "Choose the correct descriptive sentence.",
        "Which sentence is correct?",
        [
          "The girl is kind.",
          "The girl kind is.",
          "The girl is a kind.",
          "Kind the girl is."
        ],
        "The girl is kind.",
        "Use Subject + is + Adjective: The girl is kind. A does not come before an adjective.",
        5,
        "Adjective placement",
        2
      ),
      {
        id: "9b",
        prompt: "Build the correct descriptive sentence.",
        variant: "order",
        options: ["car", "is", "The", "fast"],
        orderTokens: ["car", "is", "The", "fast"],
        correct: "The car is fast",
        accepted: ["the car is fast"],
        displayCorrect: "The car is fast.",
        explanation:
          "Start with the subject The car, then is, then the adjective fast. The adjective describes the car.",
        lesson: 5,
        skill: "Build Subject + Verb to Be + Adjective",
        marks: 2,
      },
      choice(
        "9c",
        "Choose the correct form of Verb to Be.",
        "They ___ ready.",
        ["am", "is", "are"],
        "are",
        "They takes are. The pattern is They are + adjective.",
        5,
        "Verb to Be agreement in a descriptive sentence",
        2
      ),
      choice(
        "9d",
        "Which question is correct?",
        "Choose one question.",
        ["Is he tall?", "He is tall?", "Does he is tall?", "He does is tall?"],
        "Is he tall?",
        "Put is before the subject: Is he tall? Do not use does with Verb to Be.",
        5,
        "Question form with an adjective",
        2
      ),
    ],
  },
  {
    number: 10,
    title: "Regular Plurals",
    icon: "layers",
    lessons: [18],
    totalMarks: 8,
    instructions:
      "Write the plural form of each noun. Check the ending before you add s or es.",
    kindLabel: "Singular to plural",
    markingGuide: "Eight branches. Each correct plural is worth 1 mark.",
    partialCredit:
      "Spelling matters. A word with the wrong ending does not earn the mark. No half marks.",
    branches: [
      {
        id: "10a",
        prompt: "Write the plural noun for:",
        display: "book",
        placeholder: "books",
        variant: "text",
        correct: "books",
        accepted: ["books"],
        displayCorrect: "books",
        explanation: "Book is a regular noun. Add s: book → books.",
        lesson: 18,
        skill: "Regular plural: add S",
        marks: 1,
      },
      {
        id: "10b",
        prompt: "Write the plural noun for:",
        display: "box",
        placeholder: "plural form",
        variant: "text",
        correct: "boxes",
        accepted: ["boxes"],
        displayCorrect: "boxes",
        explanation:
          "Box ends in x. Add es: box → boxes. Boxs is not correct.",
        lesson: 18,
        skill: "Regular plural: add ES",
        marks: 1,
      },
      {
        id: "10c",
        prompt: "Write the plural noun for:",
        display: "watch",
        placeholder: "plural form",
        variant: "text",
        correct: "watches",
        accepted: ["watches"],
        displayCorrect: "watches",
        explanation:
          "Watch ends in ch. Add es: watch → watches.",
        lesson: 18,
        skill: "Regular plural: add ES",
        marks: 1,
      },
      {
        id: "10d",
        prompt: "Write the plural noun for:",
        display: "baby",
        placeholder: "plural form",
        variant: "text",
        correct: "babies",
        accepted: ["babies"],
        displayCorrect: "babies",
        explanation:
          "Baby has a consonant before y. Change y to ies: baby → babies.",
        lesson: 18,
        skill: "Words ending in consonant + Y",
        marks: 1,
      },
      {
        id: "10e",
        prompt: "Write the plural noun for:",
        display: "boy",
        placeholder: "plural form",
        variant: "text",
        correct: "boys",
        accepted: ["boys"],
        displayCorrect: "boys",
        explanation:
          "Boy has a vowel before y. Keep y and add s: boy → boys.",
        lesson: 18,
        skill: "Words ending in vowel + Y",
        marks: 1,
      },
      {
        id: "10f",
        prompt: "Write the plural noun for:",
        display: "knife",
        placeholder: "plural form",
        variant: "text",
        correct: "knives",
        accepted: ["knives"],
        displayCorrect: "knives",
        explanation:
          "Knife is one of the taught F / FE words. Change fe to ves: knife → knives.",
        lesson: 18,
        skill: "Selected F / FE patterns",
        marks: 1,
      },
      {
        id: "10g",
        prompt: "Write the plural noun for:",
        display: "roof",
        placeholder: "plural form",
        variant: "text",
        correct: "roofs",
        accepted: ["roofs"],
        displayCorrect: "roofs",
        explanation:
          "Roof is a taught exception. It does not change to ves. Add s: roof → roofs.",
        lesson: 18,
        skill: "F / FE exceptions",
        marks: 1,
      },
      {
        id: "10h",
        prompt: "Write the plural noun for:",
        display: "leaf",
        placeholder: "plural form",
        variant: "text",
        correct: "leaves",
        accepted: ["leaves"],
        displayCorrect: "leaves",
        explanation:
          "Leaf follows the taught F pattern. Change f to ves: leaf → leaves.",
        lesson: 18,
        skill: "Selected F / FE patterns",
        marks: 1,
      },
    ],
  },
  {
    number: 11,
    title: "Irregular Plurals and Agreement",
    icon: "star",
    lessons: [18],
    totalMarks: 6,
    instructions:
      "Write the irregular plural and choose is or are to match the subject.",
    kindLabel: "Irregular forms and agreement",
    markingGuide: "Six branches. Each branch is worth 1 mark.",
    partialCredit: "No partial credit. Spelling and verb agreement must be correct.",
    branches: [
      {
        id: "11a",
        prompt: "Write the irregular plural of:",
        display: "man",
        placeholder: "plural form",
        variant: "text",
        correct: "men",
        accepted: ["men"],
        displayCorrect: "men",
        explanation: "Man changes to men. It is an irregular plural.",
        lesson: 18,
        skill: "Common irregular plurals",
        marks: 1,
      },
      {
        id: "11b",
        prompt: "Write the irregular plural of:",
        display: "child",
        placeholder: "plural form",
        variant: "text",
        correct: "children",
        accepted: ["children"],
        displayCorrect: "children",
        explanation:
          "Child changes to children. Childs and childes are not correct.",
        lesson: 18,
        skill: "Common irregular plurals",
        marks: 1,
      },
      {
        id: "11c",
        prompt: "Write the plural of this same-form noun:",
        display: "sheep",
        placeholder: "plural form",
        variant: "text",
        correct: "sheep",
        accepted: ["sheep"],
        displayCorrect: "sheep",
        explanation:
          "Sheep has the same form for singular and plural. Five sheep is correct. Sheeps is not correct in this lesson.",
        lesson: 18,
        skill: "Same-form singular and plural nouns",
        marks: 1,
      },
      choice(
        "11d",
        "Which plural is irregular?",
        "Choose one word.",
        ["children", "books", "cars", "cats"],
        "children",
        "Children is an irregular plural of child. Books, cars, and cats are regular plurals.",
        18,
        "Distinguish regular and irregular plurals"
      ),
      choice(
        "11e",
        "Choose the correct word.",
        "The children ___ happy.",
        ["is", "are"],
        "are",
        "Children is a plural subject. Use are: The children are happy.",
        18,
        "Use is / are with a plural subject"
      ),
      choice(
        "11f",
        "Choose the correct word.",
        "The child ___ happy.",
        ["is", "are"],
        "is",
        "Child is a singular subject. Use is: The child is happy.",
        18,
        "Use is / are with a singular subject"
      ),
    ],
  },
  {
    number: 12,
    title: "Mixed Final Challenge",
    icon: "trophy",
    lessons: [1, 2, 3, 4, 5, 18],
    totalMarks: 6,
    instructions:
      "Use what you learned in all six lessons. Each branch is its own mark.",
    kindLabel: "Mixed review",
    markingGuide:
      "Six branches with 1 mark each: sentence order, pronoun, Verb to Be, article, adjective, and plural.",
    partialCredit: "No partial credit. Each branch is one independent mark.",
    branches: [
      choice(
        "12a",
        "Choose the correct sentence.",
        "Which sentence is correct?",
        [
          "Sara reads a book.",
          "Reads Sara a book.",
          "Sara a book reads.",
          "A book Sara reads."
        ],
        "Sara reads a book.",
        "Use Subject + Verb + Object: Sara + reads + a book.",
        1,
        "Correct simple sentence order"
      ),
      choice(
        "12b",
        "Choose the pronoun.",
        "Sara is my sister. ___ is kind.",
        ["She", "He", "It", "They"],
        "She",
        "Sara is one female person, so use She.",
        2,
        "Choose a pronoun"
      ),
      choice(
        "12c",
        "Choose the correct Verb to Be.",
        "We ___ ready.",
        ["am", "is", "are"],
        "are",
        "Use are with we.",
        3,
        "Choose am / is / are"
      ),
      choice(
        "12d",
        "Choose the correct article.",
        "He is ___ engineer.",
        ["a", "an", "the", "No article"],
        "an",
        "Engineer starts with a vowel sound, so use an.",
        4,
        "Choose A / An / The"
      ),
      choice(
        "12e",
        "Choose the correct word.",
        "The soup is ___.",
        ["hot", "a hot", "hots", "hot is"],
        "hot",
        "Use a subject + is + adjective: The soup is hot. An adjective does not need a or s.",
        5,
        "Adjective placement"
      ),
      choice(
        "12f",
        "Choose the correct plural.",
        "three ___",
        ["children", "childs", "childes", "child"],
        "children",
        "Child has the irregular plural children. Three children is correct.",
        18,
        "Correct a plural noun"
      ),
    ],
  },
];

export const TOTAL_BRANCHES = EXAM_QUESTIONS.reduce(
  (sum, question) => sum + question.branches.length,
  0
);

export const TOTAL_MARKS = EXAM_QUESTIONS.reduce(
  (sum, question) => sum + question.totalMarks,
  0
);

export const ALL_BRANCHES = EXAM_QUESTIONS.flatMap((question) =>
  question.branches.map((branch) => ({ question, branch }))
);

export const getQuestion = (number: number) =>
  EXAM_QUESTIONS.find((question) => question.number === number);

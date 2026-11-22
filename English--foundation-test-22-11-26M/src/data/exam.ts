/**
 * English Foundation Exam — Test 1
 * Exam data only (no presentation logic).
 * Every main question has 5 parts × 1 mark = 5 marks. 20 questions = 100 marks.
 */

export type LessonId = 1 | 2 | 3 | 4 | 5 | 16 | 17 | 18;

export type SubQuestion =
  | {
      id: string;
      kind: "choice";
      prompt: string;
      options: string[];
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      kind: "select";
      prompt: string;
      options: string[];
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      kind: "text";
      prompt: string;
      accepted: string[];
      display: string;
      explanation: string;
      placeholder?: string;
    }
  | {
      id: string;
      kind: "order";
      prompt: string;
      words: string[];
      answer: string[];
      display?: string;
      explanation: string;
    };

export type PassageLine = { speaker?: string; text: string };

export type MainQuestion = {
  id: number;
  lesson: LessonId;
  title: string;
  skill: string;
  instruction: string;
  passage?: PassageLine[];
  subs: SubQuestion[];
};

export const EXAM_TITLE = "English Foundation Exam";
export const EXAM_SUBTITLE = "Test 1";
export const TOTAL_QUESTIONS = 20;
export const MARKS_PER_QUESTION = 5;
export const TOTAL_MARKS = 100;
export const TEACHER_PASSWORD = "somer173";

const choice = (
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
): SubQuestion => ({ id, kind: "choice", prompt, options, answer, explanation });

const select = (
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
): SubQuestion => ({ id, kind: "select", prompt, options, answer, explanation });

const text = (
  id: string,
  prompt: string,
  accepted: string[],
  display: string,
  explanation: string,
  placeholder?: string,
): SubQuestion => ({ id, kind: "text", prompt, accepted, display, explanation, placeholder });

const order = (
  id: string,
  prompt: string,
  words: string[],
  answer: string[],
  display: string,
  explanation: string,
): SubQuestion => ({ id, kind: "order", prompt, words, answer, display, explanation });

const PRONOUNS = ["mine", "yours", "his", "hers", "ours", "theirs"];

export const QUESTIONS: MainQuestion[] = [
  // ------------------------------------------------------------------ 1 (L4)
  {
    id: 1,
    lesson: 4,
    title: "A or An?",
    skill: "Articles: a vs an before singular nouns",
    instruction: "Choose the correct word to complete each sentence.",
    subs: [
      choice("1a", "I have ___ book.", ["a", "an"], "a", "“Book” begins with a consonant sound (b), so we use a."),
      choice("1b", "She is ___ engineer.", ["a", "an"], "an", "“Engineer” begins with a vowel sound (e), so we use an."),
      choice("1c", "It is ___ egg.", ["a", "an"], "an", "“Egg” begins with a vowel sound (e), so we use an."),
      choice("1d", "He is ___ teacher.", ["a", "an"], "a", "“Teacher” begins with a consonant sound (t), so we use a."),
      choice("1e", "I see ___ orange.", ["a", "an"], "an", "“Orange” begins with a vowel sound (o), so we use an."),
    ],
  },
  // ------------------------------------------------------------------ 2 (L3)
  {
    id: 2,
    lesson: 3,
    title: "Make It Negative",
    skill: "Verb to be: negative sentences with not",
    instruction:
      "Parts (a)–(c): type the negative form of the sentence. Part (d): choose the correct answer. Part (e): correct the mistake and type the full sentence.",
    subs: [
      text("2a", "He is a teacher.", ["He is not a teacher.", "He isn't a teacher."], "He is not a teacher.", "To make a verb to be sentence negative, put not after the verb: He is not a teacher.", "Type the negative sentence"),
      text("2b", "They are happy.", ["They are not happy.", "They aren't happy."], "They are not happy.", "Put not after are: They are not happy.", "Type the negative sentence"),
      text("2c", "I am tired.", ["I am not tired."], "I am not tired.", "Put not after am: I am not tired.", "Type the negative sentence"),
      choice(
        "2d",
        "Which sentence is the correct negative form of “We are friends.”?",
        ["We not are friends.", "We are not friends.", "We is not friends.", "We are no friends."],
        "We are not friends.",
        "Not goes after the verb to be: We are not friends. The verb does not change.",
      ),
      text("2e", "Correct the mistake: “She not is happy.”", ["She is not happy.", "She isn't happy."], "She is not happy.", "Not goes after is, not before it: She is not happy.", "Type the correct sentence"),
    ],
  },
  // ------------------------------------------------------------------ 3 (L16)
  {
    id: 3,
    lesson: 16,
    title: "Whose Is It?",
    skill: "Possessive adjectives: my, her, its, our, their",
    instruction: "Choose the correct possessive adjective to complete each sentence.",
    subs: [
      choice("3a", "I have a book. This is ___ book.", ["my", "his", "her", "their"], "my", "I goes with my. A possessive adjective comes before a noun: my book."),
      choice("3b", "Sara has a bicycle. ___ bicycle is blue.", ["Her", "His", "Its", "Their"], "Her", "Sara is a girl, so we use She → her: Her bicycle is blue."),
      choice("3c", "The cat lost ___ toy.", ["its", "his", "her", "their"], "its", "The cat is an animal, so we use It → its: its toy."),
      choice("3d", "Omar and Ali have a project. ___ project is difficult.", ["Their", "Our", "His", "Her"], "Their", "Omar and Ali = They, so we use their: Their project is difficult."),
      choice("3e", "We have a teacher. ___ teacher is kind.", ["Our", "Their", "My", "Your"], "Our", "We goes with our: Our teacher is kind."),
    ],
  },
  // ------------------------------------------------------------------ 4 (L18)
  {
    id: 4,
    lesson: 18,
    title: "One and Many",
    skill: "Irregular plural nouns",
    instruction: "Parts (a)–(d): type the plural form of the word. Part (e): choose the correct answer.",
    subs: [
      text("4a", "child → ___", ["children"], "children", "Child is irregular: the whole word changes. One child, two children.", "Type the plural"),
      text("4b", "man → ___", ["men"], "men", "Man is irregular: the vowel changes. One man, two men.", "Type the plural"),
      text("4c", "tooth → ___", ["teeth"], "teeth", "Tooth is irregular: one tooth, two teeth.", "Type the plural"),
      text("4d", "foot → ___", ["feet"], "feet", "Foot is irregular: one foot, two feet.", "Type the plural"),
      choice(
        "4e",
        "Which word has the same form in the singular and the plural?",
        ["fish", "box", "baby", "knife"],
        "fish",
        "Fish does not change in the plural: one fish, many fish. Box → boxes, baby → babies, knife → knives.",
      ),
    ],
  },
  // ------------------------------------------------------------------ 5 (L1)
  {
    id: 5,
    lesson: 1,
    title: "Subject, Verb, Object",
    skill: "Identifying the parts of a sentence",
    instruction: "Read each sentence. Then answer the question about its parts.",
    subs: [
      choice("5a", "“Khalil plays football.” What is the subject?", ["Khalil", "plays", "football"], "Khalil", "The subject is the person who does the action: Khalil."),
      choice("5b", "“Sara reads a book.” What is the verb?", ["Sara", "reads", "a book"], "reads", "The verb is the action: reads."),
      choice("5c", "“I eat apples.” What is the object?", ["I", "eat", "apples"], "apples", "The object receives the action: apples."),
      choice("5d", "“The boy runs.” Which part is NOT in this sentence?", ["Subject", "Verb", "Object"], "Object", "The boy is the subject and runs is the verb. There is no object after runs."),
      choice(
        "5e",
        "Which sentence has the pattern Subject + Verb + Object?",
        ["The girl sleeps.", "We study English.", "Khalil runs.", "I sleep."],
        "We study English.",
        "We is the subject, study is the verb and English is the object. The other sentences have only subject + verb.",
      ),
    ],
  },
  // ------------------------------------------------------------------ 6 (L17)
  {
    id: 6,
    lesson: 17,
    title: "Match Them Up",
    skill: "Possessive adjectives and their possessive pronouns",
    instruction: "Match each possessive adjective with its possessive pronoun.",
    subs: [
      select("6a", "my", PRONOUNS, "mine", "my → mine: This is my book. / This book is mine."),
      select("6b", "your", PRONOUNS, "yours", "your → yours: This is your bag. / This bag is yours."),
      select("6c", "her", PRONOUNS, "hers", "her → hers: This is her car. / This car is hers."),
      select("6d", "our", PRONOUNS, "ours", "our → ours: This is our house. / This house is ours."),
      select("6e", "their", PRONOUNS, "theirs", "their → theirs: These are their books. / These books are theirs."),
    ],
  },
  // ------------------------------------------------------------------ 7 (L2)
  {
    id: 7,
    lesson: 2,
    title: "Am, Is or Are?",
    skill: "Verb to be: choosing am, is or are",
    instruction: "Choose am, is or are to complete each sentence.",
    subs: [
      choice("7a", "Khalil ___ a student.", ["am", "is", "are"], "is", "Khalil = He, so we use is."),
      choice("7b", "Sara and I ___ students.", ["am", "is", "are"], "are", "Sara and I = We, so we use are."),
      choice("7c", "I ___ happy.", ["am", "is", "are"], "am", "I always goes with am."),
      choice("7d", "The book ___ new.", ["am", "is", "are"], "is", "The book = It, so we use is."),
      choice("7e", "They ___ friends.", ["am", "is", "are"], "are", "They always goes with are."),
    ],
  },
  // ------------------------------------------------------------------ 8 (L5)
  {
    id: 8,
    lesson: 5,
    title: "Adjective or Noun?",
    skill: "Distinguishing adjectives from nouns",
    instruction:
      "Look at the highlighted word. Is it an adjective (it describes) or a noun (a person, place, animal or thing)?",
    subs: [
      choice("8a", "He is a **teacher**.", ["Adjective", "Noun"], "Noun", "Teacher is a person, so it is a noun. It comes after a."),
      choice("8b", "He is **smart**.", ["Adjective", "Noun"], "Adjective", "Smart describes He. It comes after is and has no a."),
      choice("8c", "She is a **doctor**.", ["Adjective", "Noun"], "Noun", "Doctor is a person (a job), so it is a noun."),
      choice("8d", "She is **beautiful**.", ["Adjective", "Noun"], "Adjective", "Beautiful describes She. It tells us what she is like."),
      choice("8e", "He is a **tall** boy.", ["Adjective", "Noun"], "Adjective", "Tall describes the noun boy. It comes before the noun."),
    ],
  },
  // ------------------------------------------------------------------ 9 (L3)
  {
    id: 9,
    lesson: 3,
    title: "Ask and Answer",
    skill: "Verb to be: questions and short answers",
    instruction:
      "Parts (a) and (b): tap the words in order to make a question. Parts (c)–(e): choose the correct answer.",
    subs: [
      order("9a", "Make a question: He is a student.", ["student", "Is", "a", "he"], ["Is", "he", "a", "student"], "Is he a student?", "In a question, the verb to be (Is) comes before the subject (he)."),
      order("9b", "Make a question: They are happy.", ["happy", "they", "Are"], ["Are", "they", "happy"], "Are they happy?", "Are comes before the subject they."),
      choice(
        "9c",
        "“Is she tired?” Choose the correct short answer.",
        ["No, she is not.", "No, she not is.", "No, she are not.", "No, she am not."],
        "No, she is not.",
        "Use the same verb as the question (is) with not: No, she is not.",
      ),
      choice(
        "9d",
        "“Are you ready?” Choose the correct short answer.",
        ["Yes, I am.", "Yes, you are.", "Yes, I are.", "Yes, you is."],
        "Yes, I am.",
        "The question asks you, so the answer uses I. I goes with am: Yes, I am.",
      ),
      choice("9e", "Choose the correct question: ___ they friends?", ["Are", "Is", "Am", "Do"], "Are", "They goes with are. Questions with the verb to be do not use do."),
    ],
  },
  // ----------------------------------------------------------------- 10 (L4)
  {
    id: 10,
    lesson: 4,
    title: "A, An, The or Nothing?",
    skill: "Articles: a, an, the and plural nouns without a/an",
    instruction: "Complete each sentence with a, an, the or no article.",
    subs: [
      choice("10a", "I have ___ pen.", ["a", "an", "the", "no article"], "a", "We mention the pen for the first time. Pen starts with a consonant sound, so we use a."),
      choice("10b", "___ pen is black. (the same pen)", ["a", "an", "the", "no article"], "the", "Now we know which pen it is, so we use the."),
      choice("10c", "I see a boy. ___ boy is big.", ["a", "an", "the", "no article"], "the", "The boy was already mentioned, so we use the."),
      choice("10d", "The book is new. ___ books are new.", ["a", "an", "the", "no article"], "the", "The also works with plural nouns when we know which ones: The books are new."),
      choice("10e", "They are ___ students.", ["a", "an", "the", "no article"], "no article", "Students is plural, so we do not use a or an. We use the only when we know which ones."),
    ],
  },
  // ----------------------------------------------------------------- 11 (L16)
  {
    id: 11,
    lesson: 16,
    title: "He or His? She or Her?",
    skill: "Subject pronouns vs possessive adjectives",
    instruction: "Choose the correct word to complete each sentence.",
    subs: [
      choice("11a", "___ is a student.", ["He", "His"], "He", "Before is we need a subject pronoun: He is a student."),
      choice("11b", "___ book is new.", ["He", "His"], "His", "Before a noun (book) we need a possessive adjective: His book is new."),
      choice("11c", "___ is happy.", ["She", "Her"], "She", "Before is we need a subject pronoun: She is happy."),
      choice("11d", "___ bicycle is blue.", ["She", "Her"], "Her", "Before a noun (bicycle) we need a possessive adjective: Her bicycle is blue."),
      choice("11e", "I am a student. ___ book is new.", ["my", "mine", "I", "me"], "my", "Before a noun we use the possessive adjective my, not the pronoun mine: My book is new."),
    ],
  },
  // ----------------------------------------------------------------- 12 (L18)
  {
    id: 12,
    lesson: 18,
    title: "More Than One",
    skill: "Regular plural nouns: -s, -es, -ies, -ves",
    instruction: "Parts (a)–(c): type the plural form. Parts (d) and (e): choose the correct answer.",
    subs: [
      text("12a", "box → ___", ["boxes"], "boxes", "Words ending in x take -es: box → boxes.", "Type the plural"),
      text("12b", "baby → ___", ["babies"], "babies", "Consonant + y changes to -ies: baby → babies.", "Type the plural"),
      text("12c", "knife → ___", ["knives"], "knives", "f / fe changes to -ves: knife → knives.", "Type the plural"),
      choice("12d", "What is the plural of “city”?", ["citys", "cities", "cityes", "city's"], "cities", "Consonant (t) + y changes to -ies: cities."),
      choice("12e", "Which plural is wrong?", ["dogs", "watchs", "houses", "pens"], "watchs", "Watch ends in ch, so it takes -es: watches. The other plurals are correct."),
    ],
  },
  // ----------------------------------------------------------------- 13 (L2)
  {
    id: 13,
    lesson: 2,
    title: "Say It with a Pronoun",
    skill: "Replacing names and nouns with subject pronouns",
    instruction: "Replace the subject with the correct pronoun.",
    subs: [
      choice("13a", "Khalil is a student. → ___ is a student.", ["He", "She", "It", "We", "They"], "He", "Khalil is one boy, so we use He."),
      choice("13b", "Sara and Mia are happy. → ___ are happy.", ["He", "She", "It", "We", "They"], "They", "Sara and Mia = two people = They."),
      choice("13c", "The car is fast. → ___ is fast.", ["He", "She", "It", "We", "They"], "It", "The car is a thing, so we use It."),
      choice("13d", "My friend and I are students. → ___ are students.", ["He", "She", "It", "We", "They"], "We", "My friend and I = We."),
      choice("13e", "The books are new. → ___ are new.", ["He", "She", "It", "We", "They"], "They", "The books = more than one thing = They."),
    ],
  },
  // ----------------------------------------------------------------- 14 (L5)
  {
    id: 14,
    lesson: 5,
    title: "Fix the Sentence",
    skill: "Adjective placement and adjective errors",
    instruction:
      "Each sentence has one mistake. Type the correct sentence. In part (d), put the words in the correct order.",
    subs: [
      text("14a", "She smart is.", ["She is smart."], "She is smart.", "The order is subject + is + adjective: She is smart.", "Type the correct sentence"),
      text("14b", "He is a tall.", ["He is tall.", "He is a tall boy."], "He is tall. (or: He is a tall boy.)", "An adjective after is does not need a. Say He is tall. Or add a noun: He is a tall boy.", "Type the correct sentence"),
      text("14c", "The boys are talls.", ["The boys are tall."], "The boys are tall.", "Adjectives never take -s, even with a plural noun: The boys are tall.", "Type the correct sentence"),
      order("14d", "Put the words in the correct order: big / a / house", ["house", "a", "big"], ["a", "big", "house"], "a big house", "The adjective (big) comes before the noun (house): a big house."),
      text("14e", "He is smart student.", ["He is a smart student."], "He is a smart student.", "A singular noun needs an article before the adjective: He is a smart student.", "Type the correct sentence"),
    ],
  },
  // ----------------------------------------------------------------- 15 (L17)
  {
    id: 15,
    lesson: 17,
    title: "Whose Is It? A Dialogue",
    skill: "Possessive adjectives vs possessive pronouns in context",
    instruction: "Read the dialogue. Choose the correct word for each blank.",
    passage: [
      { speaker: "Mia", text: "Whose jacket is this?" },
      { speaker: "Adam", text: "It is my jacket. It is {a}." },
      { speaker: "Mia", text: "Where is Sara? Is this {b} bicycle?" },
      { speaker: "Adam", text: "Yes, it is her bicycle. It is {c}." },
      { speaker: "Mia", text: "Wow, this house is very big!" },
      { speaker: "Adam", text: "It is {d} house. My friend and I live here. It is {e}." },
    ],
    subs: [
      choice("15a", "Adam: “It is my jacket. It is ___.”", ["mine", "my", "her", "hers", "our", "ours"], "mine", "After is, with no noun after it, we use the possessive pronoun mine (= my jacket)."),
      choice("15b", "Mia: “Is this ___ bicycle?”", ["mine", "my", "her", "hers", "our", "ours"], "her", "Before a noun (bicycle) we use the possessive adjective her (Sara → her)."),
      choice("15c", "Adam: “Yes, it is her bicycle. It is ___.”", ["mine", "my", "her", "hers", "our", "ours"], "hers", "With no noun after it, we use the possessive pronoun hers (= her bicycle)."),
      choice("15d", "Adam: “It is ___ house.”", ["mine", "my", "her", "hers", "our", "ours"], "our", "My friend and I = We → our. Before the noun house we use the possessive adjective our."),
      choice("15e", "Adam: “My friend and I live here. It is ___.”", ["mine", "my", "her", "hers", "our", "ours"], "ours", "With no noun after it, we use the possessive pronoun ours (= our house)."),
    ],
  },
  // ----------------------------------------------------------------- 16 (L1)
  {
    id: 16,
    lesson: 1,
    title: "Build a Sentence",
    skill: "Word order: Subject + Verb + Object",
    instruction: "Tap the words in the correct order to build a sentence.",
    subs: [
      order("16a", "Build the sentence.", ["milk", "drinks", "the cat"], ["The cat", "drinks", "milk"], "The cat drinks milk.", "Subject (The cat) + verb (drinks) + object (milk)."),
      order("16b", "Build the sentence.", ["a book", "reads", "she"], ["She", "reads", "a book"], "She reads a book.", "Subject (She) + verb (reads) + object (a book)."),
      order("16c", "Build the sentence.", ["the door", "opens", "Mahmoud"], ["Mahmoud", "opens", "the door"], "Mahmoud opens the door.", "Subject (Mahmoud) + verb (opens) + object (the door)."),
      order("16d", "Build the sentence.", ["English", "study", "we"], ["We", "study", "English"], "We study English.", "Subject (We) + verb (study) + object (English)."),
      order("16e", "Build the sentence.", ["tennis", "play", "I"], ["I", "play", "tennis"], "I play tennis.", "Subject (I) + verb (play) + object (tennis)."),
    ],
  },
  // ----------------------------------------------------------------- 17 (L3)
  {
    id: 17,
    lesson: 3,
    title: "Reading: Omar and Sara",
    skill: "Reading comprehension with the verb to be and possessives",
    instruction: "Read the passage. Then answer the questions.",
    passage: [
      { text: "Hello! My name is Omar. I am a student. I am not a teacher." },
      { text: "My friend Sara is happy today. She is not tired. Her bag is new, but my bag is old." },
      { text: "We are friends. Our school is big. It is not small." },
    ],
    subs: [
      choice(
        "17a",
        "Is Omar a teacher?",
        ["No, he is not.", "Yes, he is.", "No, she is not.", "Yes, they are."],
        "No, he is not.",
        "The passage says “I am not a teacher.” So the short answer is negative: No, he is not.",
      ),
      text("17b", "Whose bag is old? Write the name.", ["Omar"], "Omar", "The passage says “my bag is old”, and my refers to Omar.", "Type a name"),
      choice("17c", "Sara is tired.", ["True", "False"], "False", "The passage says “She is not tired.” So the sentence is false."),
      choice("17d", "The school is ___.", ["big", "small", "old", "new"], "big", "The passage says “Our school is big. It is not small.”"),
      choice(
        "17e",
        "Are Omar and Sara friends?",
        ["Yes, they are.", "Yes, he is.", "No, they are not.", "Yes, we are."],
        "Yes, they are.",
        "Omar and Sara = they, and the passage says “We are friends.” So: Yes, they are.",
      ),
    ],
  },
  // ----------------------------------------------------------------- 18 (L5)
  {
    id: 18,
    lesson: 5,
    title: "Opposite Adjectives",
    skill: "Adjective meanings and opposites",
    instruction: "Parts (a)–(c): type the opposite adjective. Parts (d) and (e): choose the opposite adjective.",
    subs: [
      text("18a", "big → ___", ["small"], "small", "Big and small are opposites.", "Type the opposite"),
      text("18b", "hot → ___", ["cold"], "cold", "Hot and cold are opposites.", "Type the opposite"),
      text("18c", "happy → ___", ["sad"], "sad", "Happy and sad are opposites.", "Type the opposite"),
      choice("18d", "Choose the opposite of “difficult”.", ["easy", "strong", "good", "slow"], "easy", "Difficult and easy are opposites."),
      choice("18e", "Choose the opposite of “strong”.", ["weak", "fast", "kind", "young"], "weak", "Strong and weak are opposites."),
    ],
  },
  // ----------------------------------------------------------------- 19 (L17)
  {
    id: 19,
    lesson: 17,
    title: "Its or It's? Their or They're?",
    skill: "Distinguishing possessives from similar contractions",
    instruction: "Choose the correct word to complete each sentence.",
    subs: [
      choice("19a", "___ a robot.", ["It's", "Its"], "It's", "It's = it is. The sentence needs a verb: It is a robot."),
      choice("19b", "The dog moved ___ tail.", ["its", "it's"], "its", "Its shows possession: the tail of the dog."),
      choice("19c", "___ house is large.", ["Their", "They're"], "Their", "Their is a possessive adjective before the noun house. They're = they are."),
      choice("19d", "___ bag is new.", ["Your", "You're"], "Your", "Your is a possessive adjective before the noun bag. You're = you are."),
      choice("19e", "The robot has a battery. ___ battery is small.", ["Its", "It's"], "Its", "Its battery = the battery of the robot."),
    ],
  },
  // ----------------------------------------------------------------- 20 (L18)
  {
    id: 20,
    lesson: 18,
    title: "Singular or Plural?",
    skill: "is / are with singular and plural nouns",
    instruction: "Choose the correct answer for each part.",
    subs: [
      choice("20a", "The book ___ new.", ["is", "are"], "is", "The book is singular, so we use is."),
      choice("20b", "The books ___ new.", ["is", "are"], "are", "The books is plural, so we use are."),
      choice(
        "20c",
        "Which sentence is correct?",
        ["I have two book.", "I have two books.", "I have a books.", "I have an books."],
        "I have two books.",
        "After two we use the plural (books). We never use a or an with a plural noun.",
      ),
      choice(
        "20d",
        "Which sentence is correct?",
        ["It is a apples.", "They are apples.", "They is apples.", "It are apples."],
        "They are apples.",
        "Apples is plural, so we use They + are.",
      ),
      choice("20e", "The children ___ happy.", ["is", "are", "am"], "are", "Children is plural, so we use are."),
    ],
  },
];

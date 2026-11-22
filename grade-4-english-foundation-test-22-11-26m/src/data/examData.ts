import type { Question, SubQuestion } from "./types";

/**
 * English--foundation-test-22-11-26M (Grade 4, Semester 1).
 * 20 main questions x 5 marks = 100 marks. Converted 1:1 from the source
 * folder `English--foundation-test-22-11-26M/src/data/exam.ts` (untouched):
 * every title, instruction, passage, prompt, option, word pool, answer,
 * accepted alternative, explanation, lesson and skill is preserved.
 * Source kinds map as: choice -> choice, select -> match (dropdown),
 * text -> text, order -> order. Lesson references are teacher-only.
 */

const t = (
  id: string,
  label: string,
  prompt: string,
  accept: string[],
  explanation: string,
  marks = 1,
  placeholder?: string,
  display?: string,
): SubQuestion => ({ type: "text", id, label, prompt, accept, explanation, marks, placeholder, ...(display ? { display } : {}) });

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

export const QUESTIONS: Question[] = [
  {
    number: 1,
    title: "A or An? — Choose the correct word to complete each sentence.",
    lesson: "Lesson 4",
    skill: "Articles: a vs an before singular nouns",
    subs: [
      c("1a", "a", "I have ___ book.", ["a","an"], "a", "“Book” begins with a consonant sound (b), so we use a."),
      c("1b", "b", "She is ___ engineer.", ["a","an"], "an", "“Engineer” begins with a vowel sound (e), so we use an."),
      c("1c", "c", "It is ___ egg.", ["a","an"], "an", "“Egg” begins with a vowel sound (e), so we use an."),
      c("1d", "d", "He is ___ teacher.", ["a","an"], "a", "“Teacher” begins with a consonant sound (t), so we use a."),
      c("1e", "e", "I see ___ orange.", ["a","an"], "an", "“Orange” begins with a vowel sound (o), so we use an."),
    ],
  },
  {
    number: 2,
    title: "Make It Negative — Parts (a)–(c): type the negative form of the sentence. Part (d): choose the correct answer. Part (e): correct the mistake and type the full sentence.",
    lesson: "Lesson 3",
    skill: "Verb to be: negative sentences with not",
    subs: [
      t("2a", "a", "He is a teacher.", ["He is not a teacher.","He isn't a teacher."], "To make a verb to be sentence negative, put not after the verb: He is not a teacher.", 1, "Type the negative sentence"),
      t("2b", "b", "They are happy.", ["They are not happy.","They aren't happy."], "Put not after are: They are not happy.", 1, "Type the negative sentence"),
      t("2c", "c", "I am tired.", ["I am not tired."], "Put not after am: I am not tired.", 1, "Type the negative sentence"),
      c("2d", "d", "Which sentence is the correct negative form of “We are friends.”?", ["We not are friends.","We are not friends.","We is not friends.","We are no friends."], "We are not friends.", "Not goes after the verb to be: We are not friends. The verb does not change."),
      t("2e", "e", "Correct the mistake: “She not is happy.”", ["She is not happy.","She isn't happy."], "Not goes after is, not before it: She is not happy.", 1, "Type the correct sentence"),
    ],
  },
  {
    number: 3,
    title: "Whose Is It? — Choose the correct possessive adjective to complete each sentence.",
    lesson: "Lesson 16",
    skill: "Possessive adjectives: my, her, its, our, their",
    subs: [
      c("3a", "a", "I have a book. This is ___ book.", ["my","his","her","their"], "my", "I goes with my. A possessive adjective comes before a noun: my book."),
      c("3b", "b", "Sara has a bicycle. ___ bicycle is blue.", ["Her","His","Its","Their"], "Her", "Sara is a girl, so we use She → her: Her bicycle is blue."),
      c("3c", "c", "The cat lost ___ toy.", ["its","his","her","their"], "its", "The cat is an animal, so we use It → its: its toy."),
      c("3d", "d", "Omar and Ali have a project. ___ project is difficult.", ["Their","Our","His","Her"], "Their", "Omar and Ali = They, so we use their: Their project is difficult."),
      c("3e", "e", "We have a teacher. ___ teacher is kind.", ["Our","Their","My","Your"], "Our", "We goes with our: Our teacher is kind."),
    ],
  },
  {
    number: 4,
    title: "One and Many — Parts (a)–(d): type the plural form of the word. Part (e): choose the correct answer.",
    lesson: "Lesson 18",
    skill: "Irregular plural nouns",
    subs: [
      t("4a", "a", "child → ___", ["children"], "Child is irregular: the whole word changes. One child, two children.", 1, "Type the plural"),
      t("4b", "b", "man → ___", ["men"], "Man is irregular: the vowel changes. One man, two men.", 1, "Type the plural"),
      t("4c", "c", "tooth → ___", ["teeth"], "Tooth is irregular: one tooth, two teeth.", 1, "Type the plural"),
      t("4d", "d", "foot → ___", ["feet"], "Foot is irregular: one foot, two feet.", 1, "Type the plural"),
      c("4e", "e", "Which word has the same form in the singular and the plural?", ["fish","box","baby","knife"], "fish", "Fish does not change in the plural: one fish, many fish. Box → boxes, baby → babies, knife → knives."),
    ],
  },
  {
    number: 5,
    title: "Subject, Verb, Object — Read each sentence. Then answer the question about its parts.",
    lesson: "Lesson 1",
    skill: "Identifying the parts of a sentence",
    subs: [
      c("5a", "a", "“Khalil plays football.” What is the subject?", ["Khalil","plays","football"], "Khalil", "The subject is the person who does the action: Khalil."),
      c("5b", "b", "“Sara reads a book.” What is the verb?", ["Sara","reads","a book"], "reads", "The verb is the action: reads."),
      c("5c", "c", "“I eat apples.” What is the object?", ["I","eat","apples"], "apples", "The object receives the action: apples."),
      c("5d", "d", "“The boy runs.” Which part is NOT in this sentence?", ["Subject","Verb","Object"], "Object", "The boy is the subject and runs is the verb. There is no object after runs."),
      c("5e", "e", "Which sentence has the pattern Subject + Verb + Object?", ["The girl sleeps.","We study English.","Khalil runs.","I sleep."], "We study English.", "We is the subject, study is the verb and English is the object. The other sentences have only subject + verb."),
    ],
  },
  {
    number: 6,
    title: "Match Them Up — Match each possessive adjective with its possessive pronoun.",
    lesson: "Lesson 17",
    skill: "Possessive adjectives and their possessive pronouns",
    subs: [
      m("6a", "a", "my", ["mine","yours","his","hers","ours","theirs"], "mine", "my → mine: This is my book. / This book is mine."),
      m("6b", "b", "your", ["mine","yours","his","hers","ours","theirs"], "yours", "your → yours: This is your bag. / This bag is yours."),
      m("6c", "c", "her", ["mine","yours","his","hers","ours","theirs"], "hers", "her → hers: This is her car. / This car is hers."),
      m("6d", "d", "our", ["mine","yours","his","hers","ours","theirs"], "ours", "our → ours: This is our house. / This house is ours."),
      m("6e", "e", "their", ["mine","yours","his","hers","ours","theirs"], "theirs", "their → theirs: These are their books. / These books are theirs."),
    ],
  },
  {
    number: 7,
    title: "Am, Is or Are? — Choose am, is or are to complete each sentence.",
    lesson: "Lesson 2",
    skill: "Verb to be: choosing am, is or are",
    subs: [
      c("7a", "a", "Khalil ___ a student.", ["am","is","are"], "is", "Khalil = He, so we use is."),
      c("7b", "b", "Sara and I ___ students.", ["am","is","are"], "are", "Sara and I = We, so we use are."),
      c("7c", "c", "I ___ happy.", ["am","is","are"], "am", "I always goes with am."),
      c("7d", "d", "The book ___ new.", ["am","is","are"], "is", "The book = It, so we use is."),
      c("7e", "e", "They ___ friends.", ["am","is","are"], "are", "They always goes with are."),
    ],
  },
  {
    number: 8,
    title: "Adjective or Noun? — Look at the highlighted word. Is it an adjective (it describes) or a noun (a person, place, animal or thing)?",
    lesson: "Lesson 5",
    skill: "Distinguishing adjectives from nouns",
    subs: [
      c("8a", "a", "He is a **teacher**.", ["Adjective","Noun"], "Noun", "Teacher is a person, so it is a noun. It comes after a."),
      c("8b", "b", "He is **smart**.", ["Adjective","Noun"], "Adjective", "Smart describes He. It comes after is and has no a."),
      c("8c", "c", "She is a **doctor**.", ["Adjective","Noun"], "Noun", "Doctor is a person (a job), so it is a noun."),
      c("8d", "d", "She is **beautiful**.", ["Adjective","Noun"], "Adjective", "Beautiful describes She. It tells us what she is like."),
      c("8e", "e", "He is a **tall** boy.", ["Adjective","Noun"], "Adjective", "Tall describes the noun boy. It comes before the noun."),
    ],
  },
  {
    number: 9,
    title: "Ask and Answer — Parts (a) and (b): tap the words in order to make a question. Parts (c)–(e): choose the correct answer.",
    lesson: "Lesson 3",
    skill: "Verb to be: questions and short answers",
    subs: [
      o("9a", "a", "Make a question: He is a student.", ["student","Is","a","he"], "Is he a student?", "In a question, the verb to be (Is) comes before the subject (he)."),
      o("9b", "b", "Make a question: They are happy.", ["happy","they","Are"], "Are they happy?", "Are comes before the subject they."),
      c("9c", "c", "“Is she tired?” Choose the correct short answer.", ["No, she is not.","No, she not is.","No, she are not.","No, she am not."], "No, she is not.", "Use the same verb as the question (is) with not: No, she is not."),
      c("9d", "d", "“Are you ready?” Choose the correct short answer.", ["Yes, I am.","Yes, you are.","Yes, I are.","Yes, you is."], "Yes, I am.", "The question asks you, so the answer uses I. I goes with am: Yes, I am."),
      c("9e", "e", "Choose the correct question: ___ they friends?", ["Are","Is","Am","Do"], "Are", "They goes with are. Questions with the verb to be do not use do."),
    ],
  },
  {
    number: 10,
    title: "A, An, The or Nothing? — Complete each sentence with a, an, the or no article.",
    lesson: "Lesson 4",
    skill: "Articles: a, an, the and plural nouns without a/an",
    subs: [
      c("10a", "a", "I have ___ pen.", ["a","an","the","no article"], "a", "We mention the pen for the first time. Pen starts with a consonant sound, so we use a."),
      c("10b", "b", "___ pen is black. (the same pen)", ["a","an","the","no article"], "the", "Now we know which pen it is, so we use the."),
      c("10c", "c", "I see a boy. ___ boy is big.", ["a","an","the","no article"], "the", "The boy was already mentioned, so we use the."),
      c("10d", "d", "The book is new. ___ books are new.", ["a","an","the","no article"], "the", "The also works with plural nouns when we know which ones: The books are new."),
      c("10e", "e", "They are ___ students.", ["a","an","the","no article"], "no article", "Students is plural, so we do not use a or an. We use the only when we know which ones."),
    ],
  },
  {
    number: 11,
    title: "He or His? She or Her? — Choose the correct word to complete each sentence.",
    lesson: "Lesson 16",
    skill: "Subject pronouns vs possessive adjectives",
    subs: [
      c("11a", "a", "___ is a student.", ["He","His"], "He", "Before is we need a subject pronoun: He is a student."),
      c("11b", "b", "___ book is new.", ["He","His"], "His", "Before a noun (book) we need a possessive adjective: His book is new."),
      c("11c", "c", "___ is happy.", ["She","Her"], "She", "Before is we need a subject pronoun: She is happy."),
      c("11d", "d", "___ bicycle is blue.", ["She","Her"], "Her", "Before a noun (bicycle) we need a possessive adjective: Her bicycle is blue."),
      c("11e", "e", "I am a student. ___ book is new.", ["my","mine","I","me"], "my", "Before a noun we use the possessive adjective my, not the pronoun mine: My book is new."),
    ],
  },
  {
    number: 12,
    title: "More Than One — Parts (a)–(c): type the plural form. Parts (d) and (e): choose the correct answer.",
    lesson: "Lesson 18",
    skill: "Regular plural nouns: -s, -es, -ies, -ves",
    subs: [
      t("12a", "a", "box → ___", ["boxes"], "Words ending in x take -es: box → boxes.", 1, "Type the plural"),
      t("12b", "b", "baby → ___", ["babies"], "Consonant + y changes to -ies: baby → babies.", 1, "Type the plural"),
      t("12c", "c", "knife → ___", ["knives"], "f / fe changes to -ves: knife → knives.", 1, "Type the plural"),
      c("12d", "d", "What is the plural of “city”?", ["citys","cities","cityes","city's"], "cities", "Consonant (t) + y changes to -ies: cities."),
      c("12e", "e", "Which plural is wrong?", ["dogs","watchs","houses","pens"], "watchs", "Watch ends in ch, so it takes -es: watches. The other plurals are correct."),
    ],
  },
  {
    number: 13,
    title: "Say It with a Pronoun — Replace the subject with the correct pronoun.",
    lesson: "Lesson 2",
    skill: "Replacing names and nouns with subject pronouns",
    subs: [
      c("13a", "a", "Khalil is a student. → ___ is a student.", ["He","She","It","We","They"], "He", "Khalil is one boy, so we use He."),
      c("13b", "b", "Sara and Mia are happy. → ___ are happy.", ["He","She","It","We","They"], "They", "Sara and Mia = two people = They."),
      c("13c", "c", "The car is fast. → ___ is fast.", ["He","She","It","We","They"], "It", "The car is a thing, so we use It."),
      c("13d", "d", "My friend and I are students. → ___ are students.", ["He","She","It","We","They"], "We", "My friend and I = We."),
      c("13e", "e", "The books are new. → ___ are new.", ["He","She","It","We","They"], "They", "The books = more than one thing = They."),
    ],
  },
  {
    number: 14,
    title: "Fix the Sentence — Each sentence has one mistake. Type the correct sentence. In part (d), put the words in the correct order.",
    lesson: "Lesson 5",
    skill: "Adjective placement and adjective errors",
    subs: [
      t("14a", "a", "She smart is.", ["She is smart."], "The order is subject + is + adjective: She is smart.", 1, "Type the correct sentence"),
      t("14b", "b", "He is a tall.", ["He is tall.","He is a tall boy."], "An adjective after is does not need a. Say He is tall. Or add a noun: He is a tall boy.", 1, "Type the correct sentence", "He is tall. (or: He is a tall boy.)"),
      t("14c", "c", "The boys are talls.", ["The boys are tall."], "Adjectives never take -s, even with a plural noun: The boys are tall.", 1, "Type the correct sentence"),
      o("14d", "d", "Put the words in the correct order: big / a / house", ["house","a","big"], "a big house", "The adjective (big) comes before the noun (house): a big house."),
      t("14e", "e", "He is smart student.", ["He is a smart student."], "A singular noun needs an article before the adjective: He is a smart student.", 1, "Type the correct sentence"),
    ],
  },
  {
    number: 15,
    title: "Whose Is It? A Dialogue — Read the dialogue. Choose the correct word for each blank.",
    intro: "Mia: Whose jacket is this?\nAdam: It is my jacket. It is {a}.\nMia: Where is Sara? Is this {b} bicycle?\nAdam: Yes, it is her bicycle. It is {c}.\nMia: Wow, this house is very big!\nAdam: It is {d} house. My friend and I live here. It is {e}.",
    lesson: "Lesson 17",
    skill: "Possessive adjectives vs possessive pronouns in context",
    subs: [
      c("15a", "a", "Adam: “It is my jacket. It is ___.”", ["mine","my","her","hers","our","ours"], "mine", "After is, with no noun after it, we use the possessive pronoun mine (= my jacket)."),
      c("15b", "b", "Mia: “Is this ___ bicycle?”", ["mine","my","her","hers","our","ours"], "her", "Before a noun (bicycle) we use the possessive adjective her (Sara → her)."),
      c("15c", "c", "Adam: “Yes, it is her bicycle. It is ___.”", ["mine","my","her","hers","our","ours"], "hers", "With no noun after it, we use the possessive pronoun hers (= her bicycle)."),
      c("15d", "d", "Adam: “It is ___ house.”", ["mine","my","her","hers","our","ours"], "our", "My friend and I = We → our. Before the noun house we use the possessive adjective our."),
      c("15e", "e", "Adam: “My friend and I live here. It is ___.”", ["mine","my","her","hers","our","ours"], "ours", "With no noun after it, we use the possessive pronoun ours (= our house)."),
    ],
  },
  {
    number: 16,
    title: "Build a Sentence — Tap the words in the correct order to build a sentence.",
    lesson: "Lesson 1",
    skill: "Word order: Subject + Verb + Object",
    subs: [
      o("16a", "a", "Build the sentence.", ["milk","drinks","the cat"], "The cat drinks milk.", "Subject (The cat) + verb (drinks) + object (milk)."),
      o("16b", "b", "Build the sentence.", ["a book","reads","she"], "She reads a book.", "Subject (She) + verb (reads) + object (a book)."),
      o("16c", "c", "Build the sentence.", ["the door","opens","Mahmoud"], "Mahmoud opens the door.", "Subject (Mahmoud) + verb (opens) + object (the door)."),
      o("16d", "d", "Build the sentence.", ["English","study","we"], "We study English.", "Subject (We) + verb (study) + object (English)."),
      o("16e", "e", "Build the sentence.", ["tennis","play","I"], "I play tennis.", "Subject (I) + verb (play) + object (tennis)."),
    ],
  },
  {
    number: 17,
    title: "Reading: Omar and Sara — Read the passage. Then answer the questions.",
    intro: "Hello! My name is Omar. I am a student. I am not a teacher.\nMy friend Sara is happy today. She is not tired. Her bag is new, but my bag is old.\nWe are friends. Our school is big. It is not small.",
    lesson: "Lesson 3",
    skill: "Reading comprehension with the verb to be and possessives",
    subs: [
      c("17a", "a", "Is Omar a teacher?", ["No, he is not.","Yes, he is.","No, she is not.","Yes, they are."], "No, he is not.", "The passage says “I am not a teacher.” So the short answer is negative: No, he is not."),
      t("17b", "b", "Whose bag is old? Write the name.", ["Omar"], "The passage says “my bag is old”, and my refers to Omar.", 1, "Type a name"),
      c("17c", "c", "Sara is tired.", ["True","False"], "False", "The passage says “She is not tired.” So the sentence is false."),
      c("17d", "d", "The school is ___.", ["big","small","old","new"], "big", "The passage says “Our school is big. It is not small.”"),
      c("17e", "e", "Are Omar and Sara friends?", ["Yes, they are.","Yes, he is.","No, they are not.","Yes, we are."], "Yes, they are.", "Omar and Sara = they, and the passage says “We are friends.” So: Yes, they are."),
    ],
  },
  {
    number: 18,
    title: "Opposite Adjectives — Parts (a)–(c): type the opposite adjective. Parts (d) and (e): choose the opposite adjective.",
    lesson: "Lesson 5",
    skill: "Adjective meanings and opposites",
    subs: [
      t("18a", "a", "big → ___", ["small"], "Big and small are opposites.", 1, "Type the opposite"),
      t("18b", "b", "hot → ___", ["cold"], "Hot and cold are opposites.", 1, "Type the opposite"),
      t("18c", "c", "happy → ___", ["sad"], "Happy and sad are opposites.", 1, "Type the opposite"),
      c("18d", "d", "Choose the opposite of “difficult”.", ["easy","strong","good","slow"], "easy", "Difficult and easy are opposites."),
      c("18e", "e", "Choose the opposite of “strong”.", ["weak","fast","kind","young"], "weak", "Strong and weak are opposites."),
    ],
  },
  {
    number: 19,
    title: "Its or It's? Their or They're? — Choose the correct word to complete each sentence.",
    lesson: "Lesson 17",
    skill: "Distinguishing possessives from similar contractions",
    subs: [
      c("19a", "a", "___ a robot.", ["It's","Its"], "It's", "It's = it is. The sentence needs a verb: It is a robot."),
      c("19b", "b", "The dog moved ___ tail.", ["its","it's"], "its", "Its shows possession: the tail of the dog."),
      c("19c", "c", "___ house is large.", ["Their","They're"], "Their", "Their is a possessive adjective before the noun house. They're = they are."),
      c("19d", "d", "___ bag is new.", ["Your","You're"], "Your", "Your is a possessive adjective before the noun bag. You're = you are."),
      c("19e", "e", "The robot has a battery. ___ battery is small.", ["Its","It's"], "Its", "Its battery = the battery of the robot."),
    ],
  },
  {
    number: 20,
    title: "Singular or Plural? — Choose the correct answer for each part.",
    lesson: "Lesson 18",
    skill: "is / are with singular and plural nouns",
    subs: [
      c("20a", "a", "The book ___ new.", ["is","are"], "is", "The book is singular, so we use is."),
      c("20b", "b", "The books ___ new.", ["is","are"], "are", "The books is plural, so we use are."),
      c("20c", "c", "Which sentence is correct?", ["I have two book.","I have two books.","I have a books.","I have an books."], "I have two books.", "After two we use the plural (books). We never use a or an with a plural noun."),
      c("20d", "d", "Which sentence is correct?", ["It is a apples.","They are apples.","They is apples.","It are apples."], "They are apples.", "Apples is plural, so we use They + are."),
      c("20e", "e", "The children ___ happy.", ["is","are","am"], "are", "Children is plural, so we use are."),
    ],
  },
];

export const TOTAL_MARKS = QUESTIONS.reduce(
  (sum, q) => sum + q.subs.reduce((s, sub) => s + sub.marks, 0),
  0,
);

export const EXAM_LABEL = "English--foundation-test-22-11-26M";
export const EXAM_SUBLABEL = "Grade 4 · Semester 1";
export const TEACHER_PASSWORD = "somer173";

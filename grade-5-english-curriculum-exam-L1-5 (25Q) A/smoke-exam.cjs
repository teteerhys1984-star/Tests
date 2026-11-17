"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/data/exam.ts
var exam_exports = {};
__export(exam_exports, {
  LESSON_COUNTS: () => LESSON_COUNTS,
  LESSON_TITLES: () => LESSON_TITLES,
  PASSAGES: () => PASSAGES,
  QUESTIONS: () => QUESTIONS,
  TOTAL_MARKS: () => TOTAL_MARKS
});
module.exports = __toCommonJS(exam_exports);
var LESSON_TITLES = {
  1: "Lesson 1 \u2014 At School",
  2: "Lesson 2 \u2014 Family",
  3: "Lesson 3 \u2014 Daily Routines",
  4: "Lesson 4 \u2014 The Five Senses",
  5: "Lesson 5 \u2014 Clothes"
};
var PASSAGES = {
  A: {
    key: "A",
    label: "Reading Text A",
    origin: "Pupil\u2019s Book p. 7 \xB7 Activity 6",
    text: "Hello! My name is John. I am ten years old and I am from Canada. I am going to introduce my lovely family to you. It is quite big and we are very happy. My mother's name is Liza and my father's name is Peter. My mother has got black hair and she is very kind. My father is tall and he is a very funny person. My parents have got two children. My baby sister Laura and me. Laura is only one year old. My father has got a sister. Her name is Olivia. She is my aunt. My mother has got a brother. His name is Richard. He is my uncle. My grandparents are Kevin and Carla. We've got two pets, a cat called Lucy and a dog called Puppy. He is my favourite!"
  },
  B: {
    key: "B",
    label: "Reading Text B",
    origin: "Pupil\u2019s Book p. 13 \xB7 Activity 6",
    text: "We use our five senses every day. They are sight, touch, smell, taste and hearing. They help us understand and enjoy the world around us. When we look at the sky, we see very far stars. We can hear sounds that are low or loud. We can touch things that are soft or hard. Different foods have different tastes. Sweet, bitter, bland and sour. We smell things that are good or bad. We smell flowers and perfumes. Eyes for sight, nose for smell, tongue for taste, skin for touch and ears for hearing."
  }
};
var SENSES = ["sight", "smell", "hearing", "touch", "taste"];
var PATTERNS = ["floral", "striped", "dotted", "plain"];
var QUESTIONS = [
  /* 1 ─ L3 */
  {
    id: "q01",
    n: 1,
    lesson: 3,
    instruction: "Look at the chart. Each tick (\u2713) is a day the action happened and each cross (\u2715) is a day it did not. Write the frequency adverb that matches the marks: always, usually, sometimes, never.",
    table: {
      head: ["Frequency adverb", "Sun", "Mon", "Tues", "Wed", "Thur"],
      rows: [
        ["Always", "\u2713", "\u2713", "\u2713", "\u2713", "\u2713"],
        ["Usually", "\u2713", "\u2713", "\u2713", "\u2713", "\u2715"],
        ["Sometimes", "\u2713", "\u2715", "\u2713", "\u2715", "\u2713"],
        ["Never", "\u2715", "\u2715", "\u2715", "\u2715", "\u2715"]
      ]
    },
    items: [
      {
        id: "q01a",
        kind: "text",
        prompt: "I __________ get up at six o\u2019clock.   (\u2713 \u2713 \u2713 \u2713 \u2713)",
        marks: 1,
        answer: "always",
        accept: ["always"],
        explain: "Five ticks in a row match the \u201CAlways\u201D row of the chart, so the adverb is always."
      },
      {
        id: "q01b",
        kind: "text",
        prompt: "I __________ do my homework in the afternoon.   (\u2713 \u2713 \u2713 \u2713 \u2715)",
        marks: 1,
        answer: "usually",
        accept: ["usually"],
        explain: "Four ticks and one cross match the \u201CUsually\u201D row of the chart."
      },
      {
        id: "q01c",
        kind: "text",
        prompt: "I __________ chat with my friends online.   (\u2713 \u2715 \u2713 \u2715 \u2713)",
        marks: 1,
        answer: "sometimes",
        accept: ["sometimes"],
        explain: "Tick, cross, tick, cross, tick matches the \u201CSometimes\u201D row of the chart."
      },
      {
        id: "q01d",
        kind: "text",
        prompt: "I __________ go to bed late.   (\u2715 \u2715 \u2715 \u2715 \u2715)",
        marks: 1,
        answer: "never",
        accept: ["never"],
        explain: "Five crosses match the \u201CNever\u201D row of the chart."
      }
    ],
    source: {
      lesson: 3,
      page: "Pupil\u2019s Book p. 10",
      exercise: "Activity 5 \u2014 Before you read, examine the chart and fill in the blanks",
      skill: "Frequency adverbs (always / usually / sometimes / never)"
    }
  },
  /* 2 ─ L1 */
  {
    id: "q02",
    n: 2,
    lesson: 1,
    instruction: "Circle the correct word.",
    items: [
      {
        id: "q02a",
        kind: "mc",
        prompt: "What do you __________ in the classroom?",
        marks: 1,
        options: ["has to", "have to"],
        answer: "have to",
        explain: "After \u201Cdo you\u201D, the base form have to is used."
      },
      {
        id: "q02b",
        kind: "mc",
        prompt: "We __________ arrive on time.",
        marks: 1,
        options: ["have to", "has to"],
        answer: "have to",
        explain: "\u201CWe\u201D takes have to; only he / she / it takes has to."
      },
      {
        id: "q02c",
        kind: "mc",
        prompt: "__________ you have to do your homework at school?",
        marks: 1,
        options: ["Do", "Does"],
        answer: "Do",
        explain: "Questions with I / you / we / they begin with Do."
      },
      {
        id: "q02d",
        kind: "mc",
        prompt: "__________ Nadia have to wear a skirt and a jacket?",
        marks: 1,
        options: ["Do", "Does"],
        answer: "Does",
        explain: "Questions with he / she / it begin with Does, and the main verb has no -s."
      }
    ],
    source: {
      lesson: 1,
      page: "Pupil\u2019s Book p. 5",
      exercise: "Exercise 7 \u2014 Circle the correct word (items 1, 2, 3, 5)",
      skill: "have to / has to \xB7 questions using do / does"
    }
  },
  /* 3 ─ L4 */
  {
    id: "q03",
    n: 3,
    lesson: 4,
    instruction: "Choose the correct answer between brackets.",
    items: [
      {
        id: "q03a",
        kind: "mc",
        prompt: "Flowers __________ nice.",
        marks: 1,
        options: ["smell", "smells"],
        answer: "smell",
        explain: "\u201CFlowers\u201D is plural, so the verb takes no -s."
      },
      {
        id: "q03b",
        kind: "mc",
        prompt: "Hot chocolate __________ sweet.",
        marks: 1,
        options: ["tastes", "feels"],
        answer: "tastes",
        explain: "Sweetness is a taste, and \u201Chot chocolate\u201D is singular (it), so tastes."
      },
      {
        id: "q03c",
        kind: "mc",
        prompt: "How __________ the jacket feel?",
        marks: 1,
        options: ["do", "does"],
        answer: "does",
        explain: "\u201CThe jacket\u201D is singular, so the question uses does."
      },
      {
        id: "q03d",
        kind: "mc",
        prompt: "Lemons don\u2019t __________ salty.",
        marks: 1,
        options: ["taste", "tastes"],
        answer: "taste",
        explain: "After don\u2019t the plain verb is used, with no -s."
      }
    ],
    source: {
      lesson: 4,
      page: "Pupil\u2019s Book p. 14",
      exercise: "Activity 7 \u2014 Choose the correct answer between brackets (items 1\u20134)",
      skill: "Sense verbs in the present simple (smell, taste, feel)"
    }
  },
  /* 4 ─ L2 · Reading Text A */
  {
    id: "q04",
    n: 4,
    lesson: 2,
    passage: "A",
    instruction: "Read the text, then answer the questions. Write true (T) or false (F) where asked.",
    items: [
      {
        id: "q04a",
        kind: "text",
        prompt: "How old is John?",
        marks: 1,
        answer: "He is ten years old.",
        accept: ["ten", "10", "ten years old", "he is ten", "he is ten years old", "john is ten", "john is ten years old"],
        explain: "The text begins: \u201CI am ten years old and I am from Canada.\u201D"
      },
      {
        id: "q04b",
        kind: "text",
        prompt: "Who is John\u2019s aunt?",
        marks: 1,
        answer: "Olivia",
        accept: ["olivia", "his aunt is olivia", "john's aunt is olivia", "her name is olivia"],
        explain: "\u201CMy father has got a sister. Her name is Olivia. She is my aunt.\u201D"
      },
      {
        id: "q04c",
        kind: "tf",
        prompt: "Richard is Laura\u2019s uncle.   (True / False)",
        marks: 1,
        answer: "True",
        explain: "Richard is John\u2019s mother\u2019s brother, so he is Laura\u2019s uncle too. The statement is true."
      },
      {
        id: "q04d",
        kind: "mc",
        prompt: "What is John\u2019s dog called?",
        marks: 1,
        options: ["Lucy", "Puppy", "Laura"],
        answer: "Puppy",
        explain: "\u201Ca cat called Lucy and a dog called Puppy\u201D \u2014 the dog is Puppy."
      }
    ],
    source: {
      lesson: 2,
      page: "Pupil\u2019s Book p. 7",
      exercise: "Activity 6 \u2014 Read and do the tasks (a\u2013b)",
      skill: "Reading comprehension \u2014 family members and relationships"
    }
  },
  /* 5 ─ L5 */
  {
    id: "q05",
    n: 5,
    lesson: 5,
    instruction: "Choose the correct -ing form of the verb.",
    items: [
      {
        id: "q05a",
        kind: "mc",
        prompt: "wear \u2192",
        marks: 1,
        options: ["wearing", "wearring"],
        answer: "wearing",
        explain: "The final -r is kept and -ing is added: wear \u2192 wearing."
      },
      {
        id: "q05b",
        kind: "mc",
        prompt: "study \u2192",
        marks: 1,
        options: ["studying", "studyng"],
        answer: "studying",
        explain: "Final -y is kept and just -ing is added: study \u2192 studying."
      },
      {
        id: "q05c",
        kind: "mc",
        prompt: "swim \u2192",
        marks: 1,
        options: ["swiming", "swimming"],
        answer: "swimming",
        explain: "The final consonant is doubled: swim \u2192 swimming."
      },
      {
        id: "q05d",
        kind: "mc",
        prompt: "put \u2192",
        marks: 1,
        options: ["puting", "putting"],
        answer: "putting",
        explain: "The final consonant is doubled: put \u2192 putting."
      }
    ],
    source: {
      lesson: 5,
      page: "Pupil\u2019s Book p. 17",
      exercise: "Let\u2019s Learn \u2014 the ten -ing forms printed in the pink list",
      skill: "-ing spelling rules for the present continuous"
    }
  },
  /* 6 ─ L2 */
  {
    id: "q06",
    n: 6,
    lesson: 2,
    instruction: "Complete using the possessive (\u2019s) or (\u2019).",
    items: [
      {
        id: "q06a",
        kind: "mc",
        prompt: "I forgot my books in __________.",
        marks: 1,
        options: ["my aunt\u2019s house", "my aunts house"],
        answer: "my aunt\u2019s house",
        explain: "One aunt owns the house, so we add \u2019s: my aunt\u2019s house."
      },
      {
        id: "q06b",
        kind: "mc",
        prompt: "__________ are made of leather.",
        marks: 1,
        options: ["Women\u2019s bags", "Womens bags"],
        answer: "Women\u2019s bags",
        explain: "\u201CWomen\u201D is an irregular plural, so the apostrophe goes before the s: women\u2019s."
      },
      {
        id: "q06c",
        kind: "mc",
        prompt: "__________ are black.",
        marks: 1,
        options: ["Hani\u2019s shoes", "Hanis shoes"],
        answer: "Hani\u2019s shoes",
        explain: "One person owns the shoes: Hani\u2019s shoes."
      },
      {
        id: "q06d",
        kind: "mc",
        prompt: "__________ are very long.",
        marks: 1,
        options: ["Giraffes\u2019 necks", "Giraffes\u2019s necks"],
        answer: "Giraffes\u2019 necks",
        explain: "\u201CGiraffes\u201D is a regular plural ending in s, so the apostrophe comes after the s: giraffes\u2019 necks."
      }
    ],
    source: {
      lesson: 2,
      page: "Pupil\u2019s Book p. 8",
      exercise: "Activity 7 \u2014 Complete using the possessive (\u2019s)",
      skill: "Possessive \u2019s and plural possessives"
    }
  },
  /* 7 ─ L3 */
  {
    id: "q07",
    n: 7,
    lesson: 3,
    instruction: "Write each time in numbers.",
    items: [
      {
        id: "q07a",
        kind: "mc",
        prompt: "quarter past seven",
        marks: 1,
        options: ["7:15", "7:45", "6:45"],
        answer: "7:15",
        explain: "\u201CQuarter past\u201D means fifteen minutes after the hour: 7:15."
      },
      {
        id: "q07b",
        kind: "mc",
        prompt: "ten to eight",
        marks: 1,
        options: ["8:10", "7:50", "7:10"],
        answer: "7:50",
        explain: "\u201CTen to eight\u201D is ten minutes before eight: 7:50."
      },
      {
        id: "q07c",
        kind: "mc",
        prompt: "half past nine",
        marks: 1,
        options: ["9:30", "8:30", "9:15"],
        answer: "9:30",
        explain: "\u201CHalf past\u201D means thirty minutes after the hour: 9:30."
      },
      {
        id: "q07d",
        kind: "mc",
        prompt: "twenty-five past six",
        marks: 1,
        options: ["6:25", "5:35", "6:35"],
        answer: "6:25",
        explain: "Minutes after the hour use \u201Cpast\u201D: six plus twenty-five is 6:25."
      }
    ],
    source: {
      lesson: 3,
      page: "Pupil\u2019s Book p. 10",
      exercise: "Activity 4 \u2014 Practise with a partner (the twelve printed clock forms)",
      skill: "Telling the time \u2014 past / to"
    }
  },
  /* 8 ─ L5 */
  {
    id: "q08",
    n: 8,
    lesson: 5,
    instruction: "Write the number that shows where each sentence belongs in the conversation, from 1 to 4.",
    items: [
      {
        id: "q08a",
        kind: "mc",
        prompt: "\u201CI\u2019d like a sweater.\u201D",
        marks: 1,
        options: ["1", "2", "3", "4"],
        answer: "1",
        explain: "The customer answers the salesman\u2019s greeting with the request first."
      },
      {
        id: "q08b",
        kind: "mc",
        prompt: "\u201CWhat size are you?\u201D",
        marks: 1,
        options: ["1", "2", "3", "4"],
        answer: "2",
        explain: "Size is asked after the request and before the price."
      },
      {
        id: "q08c",
        kind: "mc",
        prompt: "\u201CHow much is it?\u201D",
        marks: 1,
        options: ["1", "2", "3", "4"],
        answer: "3",
        explain: "The price question comes after the size."
      },
      {
        id: "q08d",
        kind: "mc",
        prompt: "\u201CIt\u2019s 3000 SP.\u201D",
        marks: 1,
        options: ["1", "2", "3", "4"],
        answer: "4",
        explain: "The salesman answers the price question last."
      }
    ],
    source: {
      lesson: 5,
      page: "Pupil\u2019s Book p. 16",
      exercise: "Activity 6a \u2014 Buying Clothes: order these sentences",
      skill: "Shopping expressions \u2014 sequencing a shop dialogue"
    }
  },
  /* 9 ─ L1 */
  {
    id: "q09",
    n: 9,
    lesson: 1,
    instruction: "Use the chart to complete each sentence with nursery, basic / primary, or secondary.",
    table: {
      head: ["School stage", "Grades / age band"],
      rows: [
        ["Nursery", "KG 1\u20133"],
        ["Basic / primary", "Grades 1\u20139"],
        ["Secondary", "Grades 10\u201312"]
      ]
    },
    items: [
      {
        id: "q09a",
        kind: "mc",
        prompt: "Lili is 4 years old. She is in the __________ school.",
        marks: 1,
        options: ["nursery", "basic / primary", "secondary"],
        answer: "nursery",
        explain: "Four-year-olds are in the nursery stage (KG 1\u20133)."
      },
      {
        id: "q09b",
        kind: "mc",
        prompt: "Anna is 13 years old. She is in the __________ school.",
        marks: 1,
        options: ["nursery", "basic / primary", "secondary"],
        answer: "secondary",
        explain: "Thirteen is secondary school age (Grades 10\u201312 band)."
      },
      {
        id: "q09c",
        kind: "mc",
        prompt: "Adam is 7 years old. He is in the __________ school.",
        marks: 1,
        options: ["nursery", "basic / primary", "secondary"],
        answer: "basic / primary",
        explain: "Seven-year-olds are in the basic / primary stage."
      },
      {
        id: "q09d",
        kind: "mc",
        prompt: "Rasha is 17 years old. She is in the __________ school.",
        marks: 1,
        options: ["nursery", "basic / primary", "secondary"],
        answer: "secondary",
        explain: "Seventeen is the secondary stage (Grades 10\u201312)."
      }
    ],
    source: {
      lesson: 1,
      page: "Pupil\u2019s Book p. 5",
      exercise: "Exercise 5 \u2014 School stages",
      skill: "School stages (nursery \xB7 basic / primary \xB7 secondary)"
    }
  },
  /* 10 ─ L4 */
  {
    id: "q10",
    n: 10,
    lesson: 4,
    instruction: "Complete each sentence with the correct body part.",
    items: [
      {
        id: "q10a",
        kind: "text",
        prompt: "I smell with my __________.",
        marks: 1,
        answer: "nose",
        accept: ["nose"],
        explain: "The printed sentence on page 13 is \u201CI smell with my nose.\u201D"
      },
      {
        id: "q10b",
        kind: "text",
        prompt: "I taste with my __________.",
        marks: 1,
        answer: "tongue",
        accept: ["tongue"],
        explain: "\u201Ctongue for taste\u201D \u2014 we taste with the tongue."
      },
      {
        id: "q10c",
        kind: "text",
        prompt: "I feel with my __________.",
        marks: 1,
        answer: "skin",
        accept: ["skin"],
        explain: "\u201Cskin for touch\u201D \u2014 we feel with the skin."
      },
      {
        id: "q10d",
        kind: "text",
        prompt: "I hear with my __________.",
        marks: 1,
        answer: "ears",
        accept: ["ears", "ear"],
        explain: "\u201Cears for hearing\u201D \u2014 we hear with our ears."
      }
    ],
    source: {
      lesson: 4,
      page: "Pupil\u2019s Book pp. 13\u201314",
      exercise: "Activity 4 (Look and describe) and Activity 9 (Write about the five senses)",
      skill: "The five senses and their related body parts"
    }
  },
  /* 11 ─ L2 */
  {
    id: "q11",
    n: 11,
    lesson: 2,
    instruction: "Write the plural of each word.",
    items: [
      {
        id: "q11a",
        kind: "text",
        prompt: "man \u2192",
        marks: 1,
        answer: "men",
        accept: ["men"],
        explain: "An irregular plural: man \u2192 men."
      },
      {
        id: "q11b",
        kind: "text",
        prompt: "woman \u2192",
        marks: 1,
        answer: "women",
        accept: ["women"],
        explain: "An irregular plural: woman \u2192 women."
      },
      {
        id: "q11c",
        kind: "text",
        prompt: "child \u2192",
        marks: 1,
        answer: "children",
        accept: ["children"],
        explain: "An irregular plural: child \u2192 children."
      },
      {
        id: "q11d",
        kind: "text",
        prompt: "wife \u2192",
        marks: 1,
        answer: "wives",
        accept: ["wives"],
        explain: "Words ending in -f often change to -ves: wife \u2192 wives."
      }
    ],
    source: {
      lesson: 2,
      page: "Workbook p. 9",
      exercise: "Exercise 4 \u2014 Write the plural",
      skill: "Family vocabulary and plural forms"
    }
  },
  /* 12 ─ L4 · Reading Text B */
  {
    id: "q12",
    n: 12,
    lesson: 4,
    passage: "B",
    instruction: "Read the text, then write true (T) or false (F).",
    items: [
      {
        id: "q12a",
        kind: "tf",
        prompt: "All foods taste the same.",
        marks: 1,
        answer: "False",
        explain: "The text says \u201CDifferent foods have different tastes.\u201D"
      },
      {
        id: "q12b",
        kind: "tf",
        prompt: "We can touch flowers.",
        marks: 1,
        answer: "True",
        explain: "The text says \u201CWe can touch things that are soft or hard\u201D, and flowers are things we can touch."
      },
      {
        id: "q12c",
        kind: "tf",
        prompt: "Our hands can only feel soft things.",
        marks: 1,
        answer: "False",
        explain: "The text says we can touch things that are soft **or hard**."
      },
      {
        id: "q12d",
        kind: "tf",
        prompt: "We know that something is sweet when we taste it.",
        marks: 1,
        answer: "True",
        explain: "The text lists sweet among the tastes of food."
      }
    ],
    source: {
      lesson: 4,
      page: "Pupil\u2019s Book p. 13",
      exercise: "Activity 6a \u2014 Write true (T) or false (F)",
      skill: "Reading comprehension \u2014 the five senses passage"
    }
  },
  /* 13 ─ L1 */
  {
    id: "q13",
    n: 13,
    lesson: 1,
    instruction: "Read the school comparison chart, then answer.",
    table: {
      head: ["Country", "Nursery", "Primary / basic", "Secondary"],
      rows: [
        ["Syria", "3", "6", "15"],
        ["Britain", "3", "5", "11"]
      ]
    },
    items: [
      {
        id: "q13a",
        kind: "tf",
        prompt: "In Britain, students go to primary school when they are six.",
        marks: 1,
        answer: "False",
        explain: "The chart shows Britain: primary school starts at age 5, not 6."
      },
      {
        id: "q13b",
        kind: "tf",
        prompt: "In Syria, students go to nursery school and then to basic school.",
        marks: 1,
        answer: "True",
        explain: "Syria: nursery at 3, then basic school at 6."
      },
      {
        id: "q13c",
        kind: "text",
        prompt: "In Syria, students start secondary school at age __________.",
        marks: 1,
        answer: "15",
        accept: ["15", "fifteen"],
        explain: "The chart gives 15 for Syria in the Secondary column."
      },
      {
        id: "q13d",
        kind: "text",
        prompt: "In Britain, students start primary school at age __________.",
        marks: 1,
        answer: "5",
        accept: ["5", "five"],
        explain: "The chart gives 5 for Britain in the Primary column."
      }
    ],
    source: {
      lesson: 1,
      page: "Pupil\u2019s Book p. 5",
      exercise: "Exercise 6 \u2014 Reading: school in Britain and Syria (6a chart, 6b true/false)",
      skill: "The school comparison between Syria and Britain"
    }
  },
  /* 14 ─ L5 */
  {
    id: "q14",
    n: 14,
    lesson: 5,
    instruction: "Complete the negative sentences of the present continuous.",
    items: [
      {
        id: "q14a",
        kind: "text",
        prompt: "I\u2019m wearing a skirt. \u2192 I\u2019m __________ wearing shorts.",
        marks: 1,
        answer: "not",
        accept: ["not", "n't", "nt"],
        explain: "The negative of the present continuous is am / is / are + not + verb-ing."
      },
      {
        id: "q14b",
        kind: "text",
        prompt: "She\u2019s putting on a sweater. \u2192 She __________ putting on a scarf.",
        marks: 1,
        answer: "isn\u2019t",
        accept: ["isn't", "is not"],
        explain: "With she, the negative is isn\u2019t (is not)."
      },
      {
        id: "q14c",
        kind: "text",
        prompt: "We\u2019re buying shoes. \u2192 They __________ buying trousers.",
        marks: 1,
        answer: "aren\u2019t",
        accept: ["aren't", "are not"],
        explain: "With they, the negative is aren\u2019t (are not)."
      },
      {
        id: "q14d",
        kind: "text",
        prompt: "__________ he wearing a red sweater?",
        marks: 1,
        answer: "Is",
        accept: ["is"],
        explain: "A present continuous question starts with am / is / are: Is he wearing\u2026?"
      }
    ],
    source: {
      lesson: 5,
      page: "Pupil\u2019s Book p. 17",
      exercise: "Let\u2019s Learn \u2014 the present continuous box",
      skill: "Present continuous: negative and question forms"
    }
  },
  /* 15 ─ L3 */
  {
    id: "q15",
    n: 15,
    lesson: 3,
    instruction: "Choose between brackets.",
    items: [
      {
        id: "q15a",
        kind: "mc",
        prompt: "Lili never __________ the piano at night.",
        marks: 1,
        options: ["play", "plays"],
        answer: "plays",
        explain: "With he / she / it the present simple verb takes -s: Lili plays."
      },
      {
        id: "q15b",
        kind: "mc",
        prompt: "__________ they go to the swimming pool on Fridays?",
        marks: 1,
        options: ["Does", "Do"],
        answer: "Do",
        explain: "Questions with you / we / they begin with Do."
      },
      {
        id: "q15c",
        kind: "mc",
        prompt: "Toni always __________ dinner.",
        marks: 1,
        options: ["have", "has"],
        answer: "has",
        explain: "Toni is a name (he), so the verb takes -s: has."
      },
      {
        id: "q15d",
        kind: "mc",
        prompt: "We __________ go to school by bus.",
        marks: 1,
        options: ["doesn\u2019t", "don\u2019t"],
        answer: "don\u2019t",
        explain: "The negative with I / you / we / they is don\u2019t."
      }
    ],
    source: {
      lesson: 3,
      page: "Pupil\u2019s Book p. 11",
      exercise: "Activity 7 \u2014 Choose between brackets (items 1, 2, 3, 5)",
      skill: "Present simple \xB7 do / does and don\u2019t / doesn\u2019t"
    }
  },
  /* 16 ─ L5 */
  {
    id: "q16",
    n: 16,
    lesson: 5,
    instruction: "Ask and answer about what someone is wearing. Complete each item.",
    items: [
      {
        id: "q16a",
        kind: "mc",
        prompt: "What __________ she wearing?",
        marks: 1,
        options: ["is", "are"],
        answer: "is",
        explain: "\u201CShe\u201D takes is in the present continuous."
      },
      {
        id: "q16b",
        kind: "text",
        prompt: "\u201CWhat are you wearing?\u201D \u201CI\u2019m wearing a pink __________ dress, socks and shoes.\u201D",
        marks: 1,
        answer: "floral",
        accept: ["floral"],
        explain: "The printed bubble says \u201Ca pink floral dress\u201D."
      },
      {
        id: "q16c",
        kind: "text",
        prompt: "\u201CWhat is Nadia wearing?\u201D \u201CShe\u2019s wearing a blue jacket, a blue skirt, a white __________ and grey shoes.\u201D",
        marks: 1,
        answer: "shirt",
        accept: ["shirt", "a white shirt", "shirts"],
        explain: "Nadia\u2019s printed sentence ends \u201C\u2026a white shirt and grey shoes\u201D."
      },
      {
        id: "q16d",
        kind: "mc",
        prompt: "Add the correct end mark:  What are you wearing __________",
        marks: 1,
        options: [".", ",", "?"],
        answer: "?",
        explain: "It is a question, so it ends with a question mark."
      }
    ],
    source: {
      lesson: 5,
      page: "Pupil\u2019s Book pp. 15, 17",
      exercise: "Activity 3 (Ask and answer) \xB7 Activity 7 \xB7 Activity 8 (Write the punctuation marks)",
      skill: "Asking and answering about what someone is wearing"
    }
  },
  /* 17 ─ L4 */
  {
    id: "q17",
    n: 17,
    lesson: 4,
    instruction: "Match each adjective with the sense you would use.",
    items: [
      {
        id: "q17a",
        kind: "mc",
        prompt: "bright",
        marks: 1,
        options: SENSES,
        answer: "sight",
        explain: "Something bright is something we see, so it belongs to sight."
      },
      {
        id: "q17b",
        kind: "mc",
        prompt: "delicious",
        marks: 1,
        options: SENSES,
        answer: "taste",
        explain: "Delicious describes how food tastes."
      },
      {
        id: "q17c",
        kind: "mc",
        prompt: "hot",
        marks: 1,
        options: SENSES,
        answer: "touch",
        explain: "Hot describes how something feels to the touch."
      },
      {
        id: "q17d",
        kind: "mc",
        prompt: "bitter",
        marks: 1,
        options: SENSES,
        answer: "taste",
        explain: "Bitter is one of the tastes printed in the passage."
      }
    ],
    source: {
      lesson: 4,
      page: "Pupil\u2019s Book p. 13",
      exercise: "Activity 6b \u2014 Match the adjectives with the senses",
      skill: "Sense adjectives and descriptions"
    }
  },
  /* 18 ─ L1 */
  {
    id: "q18",
    n: 18,
    lesson: 1,
    instruction: "Put the words in the right order. Tap the words in order; tap a chosen word to remove it.",
    items: [
      {
        id: "q18a",
        kind: "order",
        prompt: "don\u2019t / to / We / have / homework / at / do / school.",
        marks: 2,
        words: ["don\u2019t", "to", "We", "have", "homework", "at", "do", "school."],
        answer: "We | don\u2019t | have | to | do | homework | at | school.",
        explain: "We don\u2019t have to do homework at school."
      },
      {
        id: "q18b",
        kind: "order",
        prompt: "has / She / uniform. / wear / a / to / school",
        marks: 2,
        words: ["has", "She", "uniform.", "wear", "a", "to", "school"],
        answer: "She | has | to | wear | a | school | uniform.",
        explain: "She has to wear a school uniform."
      }
    ],
    source: {
      lesson: 1,
      page: "Pupil\u2019s Book p. 5",
      exercise: "Exercise 8 \u2014 Put the words in the right order (items 2 and 4)",
      skill: "School rules \xB7 word order with have to / has to"
    }
  },
  /* 19 ─ L2 · Reading Text A */
  {
    id: "q19",
    n: 19,
    lesson: 2,
    passage: "A",
    instruction: "Read the text again, then complete each item.",
    items: [
      {
        id: "q19a",
        kind: "text",
        prompt: "My parents __________ got two children.",
        marks: 1,
        answer: "have",
        accept: ["have", "'ve", "\u2019ve"],
        explain: "\u201CMy parents\u201D is plural, so it takes have got."
      },
      {
        id: "q19b",
        kind: "text",
        prompt: "My mother has got __________ hair.",
        marks: 1,
        answer: "black",
        accept: ["black"],
        explain: "\u201CMy mother has got black hair and she is very kind.\u201D"
      },
      {
        id: "q19c",
        kind: "mc",
        prompt: "John\u2019s grandparents are __________.",
        marks: 1,
        options: ["Kevin and Carla", "Richard and Olivia", "Peter and Liza"],
        answer: "Kevin and Carla",
        explain: "\u201CMy grandparents are Kevin and Carla.\u201D"
      },
      {
        id: "q19d",
        kind: "tf",
        prompt: "Laura is Olivia\u2019s sister.   (True / False)",
        marks: 1,
        answer: "False",
        explain: "Olivia is John\u2019s aunt and Laura is John\u2019s baby sister, so Laura is Olivia\u2019s niece, not her sister."
      }
    ],
    source: {
      lesson: 2,
      page: "Pupil\u2019s Book p. 7",
      exercise: "Activity 6 \u2014 Read and do the tasks (a\u2013b)",
      skill: "has got / have got \xB7 family relationships in context"
    }
  },
  /* 20 ─ L3 */
  {
    id: "q20",
    n: 20,
    lesson: 3,
    instruction: "Complete with do, does, don\u2019t, doesn\u2019t or the correct verb form.",
    items: [
      {
        id: "q20a",
        kind: "text",
        prompt: "What time __________ you go to school?",
        marks: 1,
        answer: "do",
        accept: ["do"],
        explain: "Questions with you use do."
      },
      {
        id: "q20b",
        kind: "text",
        prompt: "__________ she have a shower in the morning?",
        marks: 1,
        answer: "Does",
        accept: ["does"],
        explain: "Questions with she use does, and the main verb stays in the base form."
      },
      {
        id: "q20c",
        kind: "text",
        prompt: "I love Friday. I __________ get up early.",
        marks: 1,
        answer: "don\u2019t",
        accept: ["don't", "do not", "dont"],
        explain: "The negative with I is don\u2019t."
      },
      {
        id: "q20d",
        kind: "text",
        prompt: "In the evening, my father __________ the news.",
        marks: 1,
        answer: "watches",
        accept: ["watches"],
        explain: "With he / she / it the present simple verb takes -s; watch \u2192 watches."
      }
    ],
    source: {
      lesson: 3,
      page: "Pupil\u2019s Book pp. 9, 11",
      exercise: "Activity 2 (Eve\u2019s printed routine) \xB7 Let\u2019s Learn: the present simple",
      skill: "Do / Does and don\u2019t / doesn\u2019t \xB7 present simple -s"
    }
  },
  /* 21 ─ L1 */
  {
    id: "q21",
    n: 21,
    lesson: 1,
    instruction: "Complete each sentence with one word from the lesson.",
    items: [
      {
        id: "q21a",
        kind: "text",
        prompt: "Don\u2019t run in the corridor; you __________ walk.",
        marks: 1,
        answer: "have to",
        accept: ["have to"],
        explain: "\u201CHave to\u201D expresses obligation: you have to walk."
      },
      {
        id: "q21b",
        kind: "text",
        prompt: "We don\u2019t have to do __________ at school.",
        marks: 1,
        answer: "homework",
        accept: ["homework", "our homework", "the homework"],
        explain: "From \u201CWe don\u2019t have to do homework at school.\u201D"
      },
      {
        id: "q21c",
        kind: "text",
        prompt: "She has to wear a school __________.",
        marks: 1,
        answer: "uniform",
        accept: ["uniform", "uniforms"],
        explain: "From \u201CShe has to wear a school uniform.\u201D"
      },
      {
        id: "q21d",
        kind: "text",
        prompt: "We have to say please and __________ you.",
        marks: 1,
        answer: "thank",
        accept: ["thank"],
        explain: "From \u201CWe have to say please and thank you.\u201D"
      }
    ],
    source: {
      lesson: 1,
      page: "Pupil\u2019s Book pp. 4\u20135",
      exercise: "Exercise 4 (School rules) \xB7 Exercise 8 (sentence ordering)",
      skill: "School rules \xB7 have to / don\u2019t have to"
    }
  },
  /* 22 ─ L5 */
  {
    id: "q22",
    n: 22,
    lesson: 5,
    instruction: "Match each picture with its pattern word.",
    items: [
      {
        id: "q22a",
        kind: "mc",
        prompt: "Picture 1: a skirt with red stripes.",
        marks: 1,
        options: PATTERNS,
        answer: "striped",
        explain: "Lines across the cloth make a striped pattern."
      },
      {
        id: "q22b",
        kind: "mc",
        prompt: "Picture 2: a skirt with small spots on it.",
        marks: 1,
        options: PATTERNS,
        answer: "dotted",
        explain: "Small spots make a dotted pattern."
      },
      {
        id: "q22c",
        kind: "mc",
        prompt: "Picture 3: a skirt in one colour with no pattern.",
        marks: 1,
        options: PATTERNS,
        answer: "plain",
        explain: "One colour with no pattern is plain."
      },
      {
        id: "q22d",
        kind: "mc",
        prompt: "Picture 4: a skirt with flowers on it.",
        marks: 1,
        options: PATTERNS,
        answer: "floral",
        explain: "A flower design is a floral pattern."
      }
    ],
    source: {
      lesson: 5,
      page: "Pupil\u2019s Book p. 16",
      exercise: "Activity 5 \u2014 Before you read, match (the four skirt pictures)",
      skill: "Clothing patterns: floral, striped, dotted and plain"
    }
  },
  /* 23 ─ L4 */
  {
    id: "q23",
    n: 23,
    lesson: 4,
    instruction: "Choose the correct word.",
    items: [
      {
        id: "q23a",
        kind: "mc",
        prompt: "What __________ you hear?",
        marks: 1,
        options: ["do", "does"],
        answer: "do",
        explain: "With I / you the question uses do: \u201CWhat do you hear?\u201D"
      },
      {
        id: "q23b",
        kind: "mc",
        prompt: "How __________ the cat feel?",
        marks: 1,
        options: ["do", "does"],
        answer: "does",
        explain: "With he / she / it the question uses does and the verb loses its -s."
      },
      {
        id: "q23c",
        kind: "mc",
        prompt: "__________ she taste the lemon?",
        marks: 1,
        options: ["Do", "Does"],
        answer: "Does",
        explain: "With she the question begins with Does."
      },
      {
        id: "q23d",
        kind: "mc",
        prompt: "The music __________ loud.",
        marks: 1,
        options: ["sounds", "looks"],
        answer: "sounds",
        explain: "Loudness is a sound, so the music sounds loud."
      }
    ],
    source: {
      lesson: 4,
      page: "Pupil\u2019s Book p. 14",
      exercise: "Let\u2019s Learn (do / does questions) \xB7 Activity 7 item 5",
      skill: "Present simple questions and answers using do / does"
    }
  },
  /* 24 ─ L2 */
  {
    id: "q24",
    n: 24,
    lesson: 2,
    instruction: "Guess who? Write the family relationship.",
    items: [
      {
        id: "q24a",
        kind: "text",
        prompt: "My father has got one sister. She is my __________.",
        marks: 1,
        answer: "aunt",
        accept: ["aunt", "auntie"],
        explain: "Your father\u2019s sister is your aunt."
      },
      {
        id: "q24b",
        kind: "text",
        prompt: "My mother has got a brother. He\u2019s my __________.",
        marks: 1,
        answer: "uncle",
        accept: ["uncle"],
        explain: "Your mother\u2019s brother is your uncle."
      },
      {
        id: "q24c",
        kind: "text",
        prompt: "My uncle and aunt\u2019s children are my __________.",
        marks: 1,
        answer: "cousins",
        accept: ["cousin", "cousins"],
        explain: "The children of your uncle and aunt are your cousins."
      },
      {
        id: "q24d",
        kind: "text",
        prompt: "My sister has two children, a boy and a girl. Her son is my __________.",
        marks: 1,
        answer: "nephew",
        accept: ["nephew"],
        explain: "Your sister\u2019s son is your nephew (her daughter would be your niece)."
      }
    ],
    source: {
      lesson: 2,
      page: "Workbook p. 9",
      exercise: "Exercise 3 \u2014 Guess who?",
      skill: "Family members and relationships"
    }
  },
  /* 25 ─ L3 */
  {
    id: "q25",
    n: 25,
    lesson: 3,
    instruction: "Complete Eve\u2019s daily routine with one word.",
    items: [
      {
        id: "q25a",
        kind: "text",
        prompt: "I have a shower and get __________.",
        marks: 1,
        answer: "dressed",
        accept: ["dressed"],
        explain: "The routine reads \u201CI have a shower and get dressed\u201D."
      },
      {
        id: "q25b",
        kind: "text",
        prompt: "Then I pack my bag and __________ to school at eight o\u2019clock.",
        marks: 1,
        answer: "leave",
        accept: ["leave", "go"],
        explain: "\u201Cthen I pack my bag and leave to school at eight o\u2019clock\u201D."
      },
      {
        id: "q25c",
        kind: "text",
        prompt: "My mum cooks dinner and I usually __________ the table.",
        marks: 1,
        answer: "set",
        accept: ["set", "sets"],
        explain: "\u201CIn the evening, my mum cooks dinner and I usually set the table.\u201D"
      },
      {
        id: "q25d",
        kind: "text",
        prompt: "I always __________ at nine o\u2019clock.",
        marks: 1,
        answer: "sleep",
        accept: ["sleep", "sleeps"],
        explain: "The routine ends \u201CI always sleep at nine o\u2019clock.\u201D"
      }
    ],
    source: {
      lesson: 3,
      page: "Pupil\u2019s Book p. 9",
      exercise: "Activity 2 \u2014 Eve\u2019s printed routine (text-based gaps)",
      skill: "Daily routine actions"
    }
  }
];
var TOTAL_MARKS = QUESTIONS.reduce(
  (sum, q) => sum + q.items.reduce((s, i) => s + i.marks, 0),
  0
);
var LESSON_COUNTS = [1, 2, 3, 4, 5].map((l) => ({
  lesson: l,
  count: QUESTIONS.filter((q) => q.lesson === l).length
}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LESSON_COUNTS,
  LESSON_TITLES,
  PASSAGES,
  QUESTIONS,
  TOTAL_MARKS
});

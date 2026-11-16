import type { Passage } from "../types";
import { IMG } from "./media";

/**
 * Every passage below is copied from a printed page of the Pupil's Book for
 * Grade 3, Unit 1 (checked against the original scans in the curriculum
 * repository, except Lesson 1 – see the note on L1_FAMILY_TEXT).
 * Wording is preserved; only straight apostrophes were set as typographic ones.
 * No passage was invented, merged or taken from another lesson or grade.
 */

/** Lesson 1 · Pupil's Book · Activity 4 "Talk about your family" (printed model sentences).
 *  No Lesson 1 scan exists in the repository; this text is transcribed there
 *  WITHOUT any "needs visual check" warning, so it is treated as verified. */
export const L1_FAMILY_TEXT: Passage = {
  id: "l1-family-text",
  kind: "text",
  title: "Read the text",
  lines: ["I live with my family.", "I’ve got two sisters and two brothers."],
  source: "Lesson 1 · Pupil’s Book · Activity 4 · Talk about your family",
};

/** Lesson 2 · Pupil's Book p. 6 · Activity 1 "Listen and read" – six panels in printed order. */
export const L2_DIALOGUE: Passage = {
  id: "l2-dialogue",
  kind: "dialogue",
  title: "Read the dialogue",
  panels: [
    ["What lessons have we got today?", "Today we’ve got Maths and Science."],
    ["What’s your favourite lesson?", "My favourite lesson is Sports."],
    ["Have we got Arabic today?", "No, we haven’t.\nWe’ve got Social Studies."],
    ["Hello, pupils! Open your books.\nWe’ve got English today."],
    ["Tomorrow, I’ve got Music.\nI like Music."],
    ["On Tuesday, we’ve got Art.\nWe need crayons."],
  ],
  source: "Lesson 2 · Pupil’s Book p. 6 · Activity 1 · Listen and read",
};

/** Lesson 2 · Pupil's Book p. 7 · Activity 3 – the timetable printed on the page (blank cell kept). */
export const L2_TIMETABLE: Passage = {
  id: "l2-timetable",
  kind: "table",
  title: "Read the timetable",
  header: ["Monday", "Tuesday", "Wednesday", "Thursday"],
  rows: [
    ["Science", "Arabic", "Music", "Art"],
    ["Maths", "Art", "Art", "Maths"],
    ["Arabic", "Sports", "English", "Social Studies"],
    ["English", "", "Arabic", "Science"],
  ],
  source: "Lesson 2 · Pupil’s Book p. 7 · Activity 3 · Ask and answer (timetable)",
};

/** Lesson 3 · Pupil's Book p. 9 · Activity 1 "Listen and read" – six panels in printed order. */
export const L3_DIALOGUE: Passage = {
  id: "l3-dialogue",
  kind: "dialogue",
  title: "Read the dialogue",
  panels: [
    ["Hello, Joe! How are you?", "Hello, Steve! I’m fine. What about you?"],
    ["I go to a new school.", "There are twenty classrooms and a playground."],
    ["Let me show you around!\nThis is the gym. We have Sports here.\nIt’s on the left of the music room."],
    ["Where’s your classroom, Joe?", "It’s upstairs, on the right of the art room."],
    ["Is there a laboratory?", "Yes. There are two laboratories downstairs."],
    ["What’s your favourite place, Joe?", "I prefer the library. I can read interesting books."],
  ],
  source: "Lesson 3 · Pupil’s Book p. 9 · Activity 1 · Listen and read",
};

/** Lesson 3 · Pupil's Book p. 11 · Activity 5 "Listen and sing" – printed lines, exactly as shown. */
export const L3_SONG: Passage = {
  id: "l3-song",
  kind: "song",
  title: "Read the song",
  lines: [
    "My school is fun.",
    "We sing, we dance.",
    "We play with balls and blocks.",
    "My school is fun.",
    "We read, we count.",
    "We are going so smart.",
    "My school is fun.",
    "We play, we share.",
    "We make many friends.",
  ],
  source: "Lesson 3 · Pupil’s Book p. 11 · Activity 5 · Listen and sing",
};

/** Lesson 4 · Pupil's Book p. 12 · Activity 1 "Listen and read" – six panels in printed order. */
export const L4_DIALOGUE: Passage = {
  id: "l4-dialogue",
  kind: "dialogue",
  title: "Read the dialogue",
  panels: [
    ["Let’s buy some cakes.\nThey smell nice."],
    ["The cakes taste delicious.\nI like chocolate cakes."],
    ["I can see a colourful butterfly.\nWow! It looks beautiful."],
    ["Can you hear the birds?", "Yes, I can.\nBut I can’t see them."],
    ["It’s a lovely cat.\nCan I touch it?", "Yes, you can."],
    ["It’s small and soft.\nI like cats."],
  ],
  source: "Lesson 4 · Pupil’s Book p. 12 · Activity 1 · Listen and read",
};

/** Lesson 4 · Pupil's Book p. 14 · Activity 5 "Listen and sing" – nine printed lines, no title in the book. */
export const L4_SONG: Passage = {
  id: "l4-song",
  kind: "song",
  title: "Read the song",
  lines: [
    "I have two eyes,",
    "so I can see.",
    "And a nose to smell.",
    "I have ten fingers,",
    "that can touch.",
    "They do it very well!",
    "I have two ears,",
    "so I can hear.",
    "The birds up in the trees.",
  ],
  source: "Lesson 4 · Pupil’s Book p. 14 · Activity 5 · Listen and sing",
};

/** Lesson 5 · Pupil's Book p. 15 · Activity 1 – the printed school picture.
 *  The tiny printed labels are repeated as readable tags at the same positions. */
export const L5_SCHOOL_PICTURE: Passage = {
  id: "l5-school-picture",
  kind: "picture",
  title: "Look at the picture",
  image: IMG.l5School,
  labels: [
    { text: "Classroom", x: 20.2, y: 36.6 },
    { text: "Classroom", x: 77.8, y: 36.6 },
    { text: "Laboratory", x: 21.9, y: 52.9 },
    { text: "Library", x: 79.0, y: 53.0 },
  ],
  source: "Lesson 5 · Pupil’s Book p. 15 · Activity 1 · Look, read then tick or cross",
};

/** Lesson 5 · Pupil's Book p. 16 · Activity 2 – the table exactly as printed (only "2" is filled in). */
export const L5_SALLY_TABLE: Passage = {
  id: "l5-sally-table",
  kind: "table",
  title: "Read the table",
  header: ["", "Sally", "My name is ……"],
  rows: [
    ["brothers", "2", ""],
    ["sisters", "", ""],
    ["favourite subject", "", ""],
    ["favourite place at school", "", ""],
  ],
  note: "Only the box for Sally’s brothers is filled in.",
  source: "Lesson 5 · Pupil’s Book p. 16 · Activity 2 · table (printed values only)",
};

export const ALL_PASSAGES: Passage[] = [
  L1_FAMILY_TEXT,
  L2_DIALOGUE,
  L2_TIMETABLE,
  L3_DIALOGUE,
  L3_SONG,
  L4_DIALOGUE,
  L4_SONG,
  L5_SCHOOL_PICTURE,
  L5_SALLY_TABLE,
];

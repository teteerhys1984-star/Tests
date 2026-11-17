import { CurriculumPassage, LessonMeta, PassageId } from '../types/exam';

/**
 * Version B pupil-facing title. The curriculum content below (lessons, pages,
 * passages) is carried over unchanged from the Version B source upload.
 */
export const EXAM_TITLE = 'Grade 4 English Curriculum Exam L1-5 B';
export const EXAM_GRADE = 'Grade 4';
export const EXAM_UNIT = 'Unit 1 · Lessons 1 to 5';
export const TOTAL_MAIN_QUESTIONS = 50 as const;
export const MARKS_PER_QUESTION = 2 as const;
export const TOTAL_EXAM_MARKS = 100 as const;

export const LESSON_METADATA: LessonMeta[] = [
  {
    number: 1,
    title: 'Nice to Meet You!',
    pupilBookPages: 'pp. 3–5',
    workbookPages: 'pp. 5–7',
    questionCount: 10,
    maxMarks: 20,
  },
  {
    number: 2,
    title: 'My Family',
    pupilBookPages: 'pp. 6–8',
    workbookPages: 'pp. 8–10',
    questionCount: 10,
    maxMarks: 20,
  },
  {
    number: 3,
    title: 'Daily Routine',
    pupilBookPages: 'pp. 9–11',
    workbookPages: 'pp. 11–13',
    questionCount: 10,
    maxMarks: 20,
  },
  {
    number: 4,
    title: 'My House',
    pupilBookPages: 'pp. 12–14',
    workbookPages: 'pp. 14–16',
    questionCount: 10,
    maxMarks: 20,
  },
  {
    number: 5,
    title: 'School Subjects / Revision 1',
    pupilBookPages: 'pp. 15–20',
    workbookPages: 'pp. 17–21',
    questionCount: 10,
    maxMarks: 20,
  },
];

/**
 * Exclusive collection of verbatim reading passages printed in the
 * Grade 4 Unit 1 Lessons 1–5 Pupil's Book and Workbook.
 * No passages have been invented, merged, or taken from any other unit or grade.
 */
export const CURRICULUM_PASSAGES: Record<PassageId, CurriculumPassage> = {
  'ahmed-l1-pb4': {
    id: 'ahmed-l1-pb4',
    heading: 'Read the text',
    paragraphs: [
      'Hello my friends,',
      'I’m Ahmed. I’m ten years old and I’m in grade 4. I’m from Lebanon, but I live in Syria. My father is a doctor and my mother is a teacher. I’ve got two little brothers, Adam and Allan. They are twins. We are all in the same school. It is a very big school.',
    ],
    source: {
      lesson: 1,
      lessonTitle: 'Nice to Meet You!',
      book: "Pupil's Book",
      page: 'p. 4',
      exercise: 'Exercise 6 — Read and do the tasks',
    },
  },
  'edward-l1-wb7': {
    id: 'edward-l1-wb7',
    heading: 'Read the paragraph with spaces',
    paragraphs: [
      '“Hi, I (a) ……… Edward, this is my wife Suzy. My son’s name (b) ……… Jad. We (c) ……… from Lebanon, and we are in London on holiday. We are staying with friends from Tunisia, they are so kind. London (d) ……… beautiful, but the weather is cold.”',
    ],
    source: {
      lesson: 1,
      lessonTitle: 'Nice to Meet You!',
      book: 'Workbook',
      page: 'p. 7',
      exercise: 'Exercise 7 — Fill in am / is / are',
    },
  },
  'sanaa-l2-pb7': {
    id: 'sanaa-l2-pb7',
    heading: 'Read the text',
    paragraphs: [
      'Hi, I am Sanaa from Lattakia. I’m thirty-five years old. I’ve got two children, a son and a daughter. My son Dani is ten years old. He’s got brown hair and green eyes. My daughter Tina is eight years old. She’s got blond hair and big blue eyes. We usually read stories together. We are a happy family.',
    ],
    source: {
      lesson: 2,
      lessonTitle: 'My Family',
      book: "Pupil's Book",
      page: 'p. 7',
      exercise: 'Activity 7 — Read the text and do the tasks below',
    },
  },
  'john-white-l2-wb8': {
    id: 'john-white-l2-wb8',
    heading: 'Read the text',
    paragraphs: [
      'Hi, I am John White. I am from London. I am ten. I have a lovely family. I’ve got a sister, Eve and a brother, Daniel.',
      'My grandfather, Robert, is next to me. My sister is next to my grandmother, Liza. She’s got short blond hair.',
      'My dad, James, is standing behind my grandfather. My mum Mary is behind my grandmother. My grandmother is carrying my little brother, Daniel. My grandmother is wearing a blouse and a skirt. We are a happy family.',
    ],
    source: {
      lesson: 2,
      lessonTitle: 'My Family',
      book: 'Workbook',
      page: 'p. 8',
      exercise: 'Exercise 1 — Read and fill in the table',
    },
  },
  'dan-l3-pb10': {
    id: 'dan-l3-pb10',
    heading: 'Dan’s Daily Routine — Read the text',
    paragraphs: [
      'Dan is an English boy. He lives in London. He is eleven years old. He lives with his family. He usually wakes up at half past six, brushes his teeth and gets dressed. At seven o’clock, he leaves for school. At three o’clock in the afternoon, he comes back home. He usually has lunch at half past three then he does his homework. In the evening, he sometimes watches TV before he goes to bed at nine o’clock.',
    ],
    source: {
      lesson: 3,
      lessonTitle: 'Daily Routine',
      book: "Pupil's Book",
      page: 'p. 10',
      exercise: 'Activity 7 — Read the text and do the tasks below',
    },
  },
  'dream-house-l4-pb13': {
    id: 'dream-house-l4-pb13',
    heading: 'Read the text',
    paragraphs: [
      'My dream house is very big. It has many rooms. There is a huge living room with sofas and a big TV screen on the wall for my family and me to enjoy watching films. My bedroom is blue with a library to put my books in. There is a brand new computer, a sound system and a telescope because I love to watch the stars. My bed is special. It is under the roof window. I can see the stars at night.',
    ],
    source: {
      lesson: 4,
      lessonTitle: 'My House',
      book: "Pupil's Book",
      page: 'p. 13',
      exercise: 'Activity 7 — Read the text and do the tasks below',
    },
  },
  'my-bedroom-l4-wb16': {
    id: 'my-bedroom-l4-wb16',
    heading: 'Read the text',
    paragraphs: [
      'This is my bedroom. It’s my favourite room. There is a bed and a wardrobe. My computer is on the desk. I use it to surf the Net and do my homework. I search for information about school projects. I like to draw. I learned how to draw using some programmes on the computer. There are pictures on the wall, one is for my family and the other is for my house. I used my computer to draw them.',
    ],
    source: {
      lesson: 4,
      lessonTitle: 'My House',
      book: 'Workbook',
      page: 'p. 16',
      exercise: 'Exercise 7 — Read and do the task below',
    },
  },
  'ali-l5-pb16': {
    id: 'ali-l5-pb16',
    heading: 'Read the text',
    paragraphs: [
      'Hello, I’m Ali. I’m going to tell you about my school subjects. I like English and Arabic very much, they are very easy. But my favourite subject is geography, it is quite useful. Science is very interesting for me. I also love history, it’s great and important. Maths isn’t difficult and I like it. Music class and sports are fun but I am not good at art.',
    ],
    source: {
      lesson: 5,
      lessonTitle: 'School Subjects / Revision 1',
      book: "Pupil's Book",
      page: 'p. 16',
      exercise: 'Activity 6 — Read and do the tasks below',
    },
  },
  'bill-l5-pb18': {
    id: 'bill-l5-pb18',
    heading: 'Read the text',
    paragraphs: [
      'Hello! I am Bill. I am 11 years old. I live in Italy with my family in a big house. I have two brothers, John and Carlos. They are tall and thin. I usually get up early to go to my school. I like maths but I love geography.',
    ],
    source: {
      lesson: 5,
      lessonTitle: 'School Subjects / Revision 1',
      book: "Pupil's Book",
      page: 'p. 18',
      exercise: 'Revision 1 · Exercise 1 — Read and choose',
    },
  },
  'luna-l5-wb19': {
    id: 'luna-l5-wb19',
    heading: 'Read the text',
    paragraphs: [
      'Hello, I’m Luna. My favourite subject is science. In my school we have science on Monday and Thursday. I like the science class very much. It is interesting and useful. I feel happy most when we go to the lab, because we do experiments. I am good at science and I want to be a scientist when I grow up.',
    ],
    source: {
      lesson: 5,
      lessonTitle: 'School Subjects / Revision 1',
      book: 'Workbook',
      page: 'p. 19',
      exercise: 'Exercise 7 — Read and do the task',
    },
  },
};

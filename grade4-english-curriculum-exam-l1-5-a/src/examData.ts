import clockImage from '../public/images/workbook-clock.png?inline';
export type Lesson = 1 | 2 | 3 | 4 | 5;
export type PartType = 'choice' | 'select' | 'text';

export interface QuestionPart {
  prompt: string;
  type: PartType;
  answer: string;
  marks: 1 | 2;
  options?: string[];
  accepted?: string[];
}

export interface Question {
  id: string;
  lesson: Lesson;
  format: string;
  prompt: string;
  parts: QuestionPart[];
  source: string;
  explanation: string;
  passage?: keyof typeof passages;
  wordBank?: string;
  image?: { src: string; alt: string };
}

export const lessonTitles: Record<Lesson, string> = {
  1: 'Nice to Meet You!',
  2: 'My Family',
  3: 'Daily Routine',
  4: 'My House',
  5: 'School Subjects / Revision 1',
};

// These are transcriptions of the printed passages, not newly written stimuli.
export const passages = {
  ahmed: "Hello my friends, I'm Ahmed. I'm ten years old and I'm in grade 4. I'm from Lebanon, but I live in Syria. My father is a doctor and my mother is a teacher. I've got two little brothers, Adam and Allan. They are twins. We are all in the same school. It is a very big school.",
  dialogue: "Jane, this is my friend Ahmed. He's a new student. Ahmed, this is my friend Jane.\nHello Ahmed. Nice to meet you.\nHello Jane. Nice to meet you, too.\nWhere are you from?\nI'm from Lebanon.",
  sanaa: "Hi, I am Sanaa from Lattakia. I'm thirty-five years old. I've got two children, a son and a daughter. My son Dani is ten years old. He's got brown hair and green eyes. My daughter Tina is eight years old. She's got blond hair and big blue eyes. We usually read stories together. We are a happy family.",
  john: "Hi, I am John White. I am from London. I am ten. I have a lovely family. I've got a sister, Eve and a brother, Daniel. My grandfather, Robert, is next to me. My sister is next to my grandmother, Liza. She's got short blond hair. My dad, James, is standing behind my grandfather. My mum Mary is behind my grandmother. My grandmother is carrying my little brother, Daniel. My grandmother is wearing a blouse and a skirt. We are a happy family.",
  dan: "Dan is an English boy. He lives in London. He is eleven years old. He lives with his family. He usually wakes up at half past six, brushes his teeth and gets dressed. At seven o'clock, he leaves for school. At three o'clock in the afternoon, he comes back home. He usually has lunch at half past three then he does his homework. In the evening, he sometimes watches TV before he goes to bed at nine o'clock.",
  house: "My dream house is very big. It has many rooms. There is a huge living room with sofas and a big TV screen on the wall for my family and me to enjoy watching films. My bedroom is blue with a library to put my books in. There is a brand new computer, a sound system and a telescope because I love to watch the stars. My bed is special. It is under the roof window. I can see the stars at night.",
  ali: "Hello, I'm Ali. I'm going to tell you about my school subjects. I like English and Arabic very much, they are very easy. But my favourite subject is geography, it is quite useful. Science is very interesting for me. I also love history, it's great and important. Maths isn't difficult and I like it. Music class and sports are fun but I am not good at art.",
  bill: 'Hello! I am Bill. I am 11 years old. I live in Italy with my family in a big house. I have two brothers, John and Carlos. They are tall and thin. I usually get up early to go to my school. I like maths but I love geography.',
} as const;

const choose = (prompt: string, options: string[], answer: string, marks: 1 | 2 = 2): QuestionPart => ({ prompt, type: 'choice', options, answer, marks });
const select = (prompt: string, options: string[], answer: string): QuestionPart => ({ prompt, type: 'select', options, answer, marks: 1 });
const write = (prompt: string, answer: string, marks: 1 | 2 = 2, accepted?: string[]): QuestionPart => ({ prompt, type: 'text', answer, marks, accepted });
const tf = (prompt: string, answer: 'True' | 'False'): QuestionPart => select(prompt, ['True', 'False'], answer);

const groups: Record<Lesson, Question[]> = {
  1: [
    {
      id: 'l1-01', lesson: 1, format: 'Complete the conversation', prompt: 'Fill in the spaces with words from the box.', wordBank: 'name - old - meet - today - Rosa - My - fine',
      parts: [write('Hello Rosa, nice to ____ you.', 'meet', 1), write("How ____ are you? I'm 10.", 'old', 1)],
      source: 'Lesson 1, Workbook, pp. 5-7, Exercise 1', explanation: 'The printed conversation uses "meet" in the greeting and "old" to ask about age.',
    },
    {
      id: 'l1-02', lesson: 1, format: 'Read and match', prompt: 'Match each question with its answer.',
      parts: [select("What's your name?", ["I'm ten years old.", "My name's Susan.", "I'm fine, thank you."], "My name's Susan."), select('How old are you?', ["I'm ten years old.", "My name's Susan.", "Nice to meet you too."], "I'm ten years old.")],
      source: 'Lesson 1, Workbook, pp. 5-7, Exercise 2', explanation: 'The first question asks for a name; the second asks for an age.',
    },
    {
      id: 'l1-03', lesson: 1, format: 'True or false', prompt: 'Read the text. Tick or cross.', passage: 'ahmed',
      parts: [tf('Ahmed is from Syria.', 'False'), tf("Ahmed's mother is a teacher.", 'True')],
      source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 6a", explanation: 'Ahmed is from Lebanon, and his mother is a teacher.',
    },
    {
      id: 'l1-04', lesson: 1, format: 'Complete the sentences', prompt: 'Fill in with am, is or are.', passage: 'ahmed',
      parts: [select('Hello, I ____ Ahmed.', ['am', 'is', 'are'], 'am'), select('Adam and Allan ____ my little brothers.', ['am', 'is', 'are'], 'are')],
      source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 6b", explanation: 'Use "am" with I and "are" with Adam and Allan.',
    },
    {
      id: 'l1-05', lesson: 1, format: 'Reorder the words', prompt: 'Order these words to make a question.',
      parts: [write('Where / from / you / are', 'Where are you from?')], source: 'Lesson 1, Workbook, pp. 5-7, Exercise 6, item 4', explanation: 'The question is "Where are you from?"',
    },
    {
      id: 'l1-06', lesson: 1, format: 'Choose the correct verb', prompt: 'Fill in am, is or are.',
      parts: [select('Jad and Luna ____ in the same class.', ['am', 'is', 'are'], 'are'), select('Zein ____ from Tunis.', ['am', 'is', 'are'], 'is')],
      source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 7, items 2-3", explanation: 'Two people take "are"; Zein takes "is".',
    },
    {
      id: 'l1-07', lesson: 1, format: 'Read and choose', prompt: 'Read the text and choose the answer.', passage: 'ahmed',
      parts: [choose("What are the names of Ahmed's little brothers?", ['Adam and Allan', 'Sami and Reem', 'Paul and Robin'], 'Adam and Allan')],
      source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 6, reading text", explanation: 'Ahmed says his two little brothers are Adam and Allan.',
    },
    {
      id: 'l1-08', lesson: 1, format: 'Reorder the words', prompt: 'Reorder the words to make a sentence.',
      parts: [write('ten / Sally / old / years / is', 'Sally is ten years old.')], source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 8, item 1", explanation: 'The correct sentence is "Sally is ten years old."',
    },
    {
      id: 'l1-09', lesson: 1, format: 'Read and choose', prompt: 'Read the conversation and choose the answer.', passage: 'dialogue',
      parts: [choose('Where are you from?', ["I'm from Lebanon.", 'Nice to meet you, too.', "He's a new student."], "I'm from Lebanon.")], source: "Lesson 1, Pupil's Book, pp. 3-5, Exercise 4", explanation: 'The printed reply is "I\'m from Lebanon."',
    },
    {
      id: 'l1-10', lesson: 1, format: 'Complete the frames', prompt: 'Complete the printed sentence frames with am, is or are.',
      parts: [select('I ____ in grade four.', ['am', 'is', 'are'], 'am'), select('My father ____ a doctor.', ['am', 'is', 'are'], 'is')],
      source: "Lesson 1, Pupil's Book, pp. 3-5, Exercises 6b and 9", explanation: 'Use "am" with I and "is" with my father.',
    },
  ],
  2: [
    {
      id: 'l2-01', lesson: 2, format: 'True or false', prompt: 'Read the text. Tick or cross.', passage: 'sanaa',
      parts: [tf('Sanaa is from Lattakia.', 'True'), tf('Dani is eight years old.', 'False')],
      source: "Lesson 2, Pupil's Book, p. 7, Exercise 7a, items 1-2", explanation: 'Sanaa is from Lattakia, and Dani is ten years old.',
    },
    {
      id: 'l2-02', lesson: 2, format: 'Choose the correct verb', prompt: 'Read the text and choose.', passage: 'sanaa',
      parts: [select('Tina ____ got blond hair.', ['has', 'have'], 'has'), select('Dani ____ got green eyes.', ['is', 'has'], 'has')],
      source: "Lesson 2, Pupil's Book, p. 7, Exercise 7b, items 1-2", explanation: 'Use "has got" to describe Tina\'s hair and Dani\'s eyes.',
    },
    {
      id: 'l2-03', lesson: 2, format: 'Complete the table', prompt: 'Read and fill in the table.', passage: 'john',
      parts: [select('His grandmother: ____', ['Liza', 'Mary', 'Eve'], 'Liza'), select('His father: ____', ['Robert', 'James', 'Daniel'], 'James')],
      source: 'Lesson 2, Workbook, p. 8, Exercise 1, family table', explanation: "John's grandmother is Liza and his father is James.",
    },
    {
      id: 'l2-04', lesson: 2, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'sanaa',
      parts: [choose('They usually ____ stories.', ['read', 'write'], 'read')], source: "Lesson 2, Pupil's Book, p. 7, Exercise 7b, item 3", explanation: 'The family usually read stories together.',
    },
    {
      id: 'l2-05', lesson: 2, format: 'Complete the sentences', prompt: 'Fill in the spaces with is or has got.',
      parts: [select('She ____ long hair.', ['is', 'has got'], 'has got'), select('He ____ tall and thin.', ['is', 'has got'], 'is')],
      source: "Lesson 2, Pupil's Book, p. 8, Exercise 8, items 1-2", explanation: 'Use "has got" for hair and "is" for a description of a person.',
    },
    {
      id: 'l2-06', lesson: 2, format: 'Reorder the words', prompt: 'Reorder the following sentence.',
      parts: [write('has / He / got / hair / black', 'He has got black hair.')], source: "Lesson 2, Pupil's Book, p. 8, Exercise 9d", explanation: 'The words form "He has got black hair."',
    },
    {
      id: 'l2-07', lesson: 2, format: 'Choose the right word', prompt: 'Choose the right word.',
      parts: [choose('A: What does your brother look like?\nB: He is tall. ____ short black hair with big green eyes.', ["He's", "He's got", "He's wearing"], "He's got")],
      source: 'Lesson 2, Workbook, p. 10, Exercise 7, item 1', explanation: '"He\'s got" introduces the description of his hair and eyes.',
    },
    {
      id: 'l2-08', lesson: 2, format: 'Read and match', prompt: 'Read and match the questions and answers.',
      parts: [select('What does your father do?', ['He is a pilot.', 'In Damascus.', 'her new dress.'], 'He is a pilot.'), select('Where do they live?', ['He is a pilot.', 'In Damascus.', 'from London.'], 'In Damascus.')],
      source: 'Lesson 2, Workbook, p. 8, Exercise 2, items 3-4', explanation: 'The first answer gives a job; the second gives a place.',
    },
    {
      id: 'l2-09', lesson: 2, format: 'Choose the right word', prompt: 'Choose the right word.',
      parts: [choose('A: What does she look like?\nB: She has got ____ black hair.', ['long', 'small', 'tall'], 'long')],
      source: 'Lesson 2, Workbook, p. 10, Exercise 7, item 4', explanation: '"Long" describes her hair.',
    },
    {
      id: 'l2-10', lesson: 2, format: 'Read and choose', prompt: 'Read the text and choose the ages.', passage: 'sanaa',
      parts: [select('Sanaa is ____ years old.', ['eight', 'ten', 'thirty-five'], 'thirty-five'), select('Tina is ____ years old.', ['eight', 'ten', 'thirty-five'], 'eight')], source: "Lesson 2, Pupil's Book, p. 7, Exercise 7, reading text", explanation: 'Sanaa is thirty-five and her daughter Tina is eight.',
    },
  ],
  3: [
    {
      id: 'l3-01', lesson: 3, format: 'Read and choose', prompt: 'Read the text and choose the times.', passage: 'dan',
      parts: [select('Dan wakes up at ____', ['7:00', '6:30', '7:30'], '6:30'), select('He goes to school at ____', ['7:00', '7:15', '7:30'], '7:00')],
      source: "Lesson 3, Pupil's Book, p. 10, Exercise 7b, items 1-2", explanation: 'Dan wakes at half past six and leaves for school at seven.',
    },
    {
      id: 'l3-02', lesson: 3, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'dan',
      parts: [choose('He comes back home at ____', ['2:00', '1:00', '3:00'], '3:00')], source: "Lesson 3, Pupil's Book, p. 10, Exercise 7b, item 3", explanation: 'Dan comes back home at three in the afternoon.',
    },
    {
      id: 'l3-03', lesson: 3, format: 'True or false', prompt: 'Read the text. Tick or cross.', passage: 'dan',
      parts: [tf('He is ten years old.', 'False'), tf("He wakes up at 7 o'clock.", 'False')],
      source: "Lesson 3, Pupil's Book, p. 10, Exercise 7a, items 2-3", explanation: 'Dan is eleven, and he wakes up at half past six.',
    },
    {
      id: 'l3-04', lesson: 3, format: 'Choose the correct verb', prompt: 'Fill in the spaces with words in the box.', wordBank: 'get (x2) - gets (x2) - wash - washes',
      parts: [select('I ____ up at 6:30 in the morning.', ['get', 'gets', 'wash', 'washes'], 'get'), select("Sam ____ up at 7:00 o'clock.", ['get', 'gets', 'wash', 'washes'], 'gets')],
      source: 'Lesson 3, Workbook, p. 11, Exercise 2, items 1 and 4', explanation: 'Use "get" with I and "gets" with Sam.',
    },
    {
      id: 'l3-05', lesson: 3, format: 'Choose the correct verb', prompt: 'Choose the correct verb forms.',
      parts: [select('I / we / they / you ____ up, make the bed.', ['get', 'gets'], 'get'), select('he / she / it ____ up, makes the bed.', ['get', 'gets'], 'gets')],
      source: "Lesson 3, Pupil's Book, p. 11, Let's Learn", explanation: 'Use "get" with I, we, they and you; use "gets" with he, she and it.',
    },
    {
      id: 'l3-06', lesson: 3, format: 'Choose the correct verb', prompt: 'Complete with words from the box.', wordBank: 'wake - wakes - watch - watches',
      parts: [select('I ____ TV at quarter past seven.', ['wake', 'wakes', 'watch', 'watches'], 'watch'), select('My mum ____ TV at half past nine.', ['wake', 'wakes', 'watch', 'watches'], 'watches')],
      source: "Lesson 3, Pupil's Book, p. 11, Exercise 8, items 3-4", explanation: 'Use "watch" with I and "watches" with my mum.',
    },
    {
      id: 'l3-07', lesson: 3, format: 'Complete the sentences', prompt: 'Complete with words from the printed word bank.', wordBank: 'get - have - get up - brush (x2) - wash',
      parts: [write('I ____ my face.', 'wash', 1), write('I ____ my hair.', 'brush', 1)],
      source: "Lesson 3, Pupil's Book, p. 11, Exercise 9", explanation: 'The song says "wash my face" and "brush my hair".',
    },
    {
      id: 'l3-08', lesson: 3, format: 'Write the time', prompt: 'Look at the clock and choose the time.', image: { src: clockImage, alt: 'A clock from the workbook. Its minute hand points to 12 and its hour hand points to 4.' },
      parts: [choose('What time is it?', ["It's four o'clock.", "It's half past four.", "It's quarter past four."], "It's four o'clock.")],
      source: 'Lesson 3, Workbook, p. 12, Exercise 4, clock 4', explanation: 'The minute hand points to 12 and the hour hand points to 4.',
    },
    {
      id: 'l3-09', lesson: 3, format: 'Complete and tell the time', prompt: 'Complete the sentence and choose the time.', wordBank: 'wake - wakes - watch - watches',
      parts: [select('My mum ____ up at quarter to six.', ['wake', 'wakes', 'watch', 'watches'], 'wakes'), select('Quarter to six is ____', ['5:45', '6:15', '6:45'], '5:45')],
      source: "Lesson 3, Pupil's Book, p. 11, Exercise 8, item 2", explanation: '"My mum" takes "wakes". Quarter to six is 5:45.',
    },
    {
      id: 'l3-10', lesson: 3, format: 'Read and choose', prompt: 'Read the text and choose the answer.', passage: 'dan',
      parts: [choose('What time does Dan go to bed?', ["at nine o'clock", "at seven o'clock", 'at half past three'], "at nine o'clock")],
      source: "Lesson 3, Pupil's Book, p. 10, Exercise 7, reading text", explanation: 'The text says Dan goes to bed at nine o\'clock.',
    },
  ],
  4: [
    {
      id: 'l4-01', lesson: 4, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'house',
      parts: [choose('The dream house has ____', ['three rooms', 'small rooms', 'lots of rooms'], 'lots of rooms')],
      source: "Lesson 4, Pupil's Book, p. 13, Exercise 7a, item 1", explanation: 'The passage says the dream house has many rooms. The source question names Linda, but the passage does not name its narrator.',
    },
    {
      id: 'l4-02', lesson: 4, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'house',
      parts: [choose('The computer, sound system and the telescope are in ____', ['the bedroom', 'the living room', 'the kitchen'], 'the bedroom')],
      source: "Lesson 4, Pupil's Book, p. 13, Exercise 7a, item 3", explanation: 'These objects are described as part of the bedroom.',
    },
    {
      id: 'l4-03', lesson: 4, format: 'Odd one out', prompt: 'Circle the odd one out.',
      parts: [choose('new - huge - book - special', ['new', 'huge', 'book', 'special'], 'book')],
      source: "Lesson 4, Pupil's Book, p. 13, Exercise 7b, item 1", explanation: '"Book" is a thing; the other words describe things.',
    },
    {
      id: 'l4-04', lesson: 4, format: 'Complete the sentences', prompt: 'Choose the correct words.',
      parts: [select('There ____ a garden.', ["isn't", "aren't", 'are'], "isn't"), select('There ____ trees in the street.', ["isn't", "aren't", 'is'], "aren't")],
      source: "Lesson 4, Pupil's Book, p. 14, Let's Learn", explanation: 'Use "isn\'t" with a garden and "aren\'t" with trees.',
    },
    {
      id: 'l4-05', lesson: 4, format: 'Read and match', prompt: 'Match the sentences with the rooms.',
      parts: [select('I sleep in', ['the kitchen', 'the garden', 'the bathroom', 'the garage', 'the bedroom'], 'the bedroom'), select('Mum cooks in', ['the kitchen', 'the garden', 'the bathroom', 'the garage', 'the bedroom'], 'the kitchen')],
      source: 'Lesson 4, Workbook, p. 15, Exercise 5, items 1-2', explanation: 'The printed matches are "I sleep in the bedroom" and "Mum cooks in the kitchen".',
    },
    {
      id: 'l4-06', lesson: 4, format: 'Complete the sentences', prompt: 'Fill in the spaces with is or are.',
      parts: [select('There ____ five rooms in our house.', ['is', 'are'], 'are'), select('____ there an armchair in your room?', ['Is', 'Are'], 'Is')],
      source: 'Lesson 4, Workbook, p. 16, Exercise 8, items 2 and 4', explanation: 'Use "are" for five rooms and "Is" for one armchair.',
    },
    {
      id: 'l4-07', lesson: 4, format: 'Reorder the words', prompt: 'Reorder the words to make a question.',
      parts: [write('there / a garage / Is', 'Is there a garage?')], source: "Lesson 4, Pupil's Book, p. 14, Exercise 9b", explanation: 'A question begins "Is there".',
    },
    {
      id: 'l4-08', lesson: 4, format: 'Reorder the words', prompt: 'Reorder the words to make a sentence.',
      parts: [write('lives / a house / She / in', 'She lives in a house.')], source: "Lesson 4, Pupil's Book, p. 14, Exercise 9a", explanation: 'The words form "She lives in a house."',
    },
    {
      id: 'l4-09', lesson: 4, format: 'Choose the correct word', prompt: 'Choose the correct word.',
      parts: [choose('____ there sofas in the living room?', ['Is', 'Are', 'Am'], 'Are')], source: "Lesson 4, Pupil's Book, p. 14, Let's Learn", explanation: 'Use "Are there" with the plural word "sofas".',
    },
    {
      id: 'l4-10', lesson: 4, format: 'Complete the sentences', prompt: 'Fill in with the suitable words.',
      parts: [select('There ____ two bedrooms.', ['is', 'are', "isn't"], 'are'), select('____ there a kitchen?', ['Is', 'Are'], 'Is')],
      source: "Lesson 4, Pupil's Book, p. 14, Exercise 8b-c", explanation: 'Use "are" with two bedrooms and "Is there" for one kitchen.',
    },
  ],
  5: [
    {
      id: 'l5-01', lesson: 5, format: 'True or false', prompt: 'Read the text. Tick or cross.', passage: 'ali',
      parts: [tf('He is not good at art.', 'True'), tf("Ali's favourite subject is science.", 'False')],
      source: "Lesson 5, Pupil's Book, p. 16, Exercise 6a, items 2-3", explanation: 'Ali is not good at art; his favourite subject is geography.',
    },
    {
      id: 'l5-02', lesson: 5, format: 'True or false', prompt: 'Read the text. Tick or cross.', passage: 'ali',
      parts: [tf('Music class is boring for Ali.', 'False'), tf("He doesn't like maths.", 'False')],
      source: "Lesson 5, Pupil's Book, p. 16, Exercise 6a, items 4-5", explanation: 'Ali says music class is fun and that he likes maths.',
    },
    {
      id: 'l5-03', lesson: 5, format: 'Read and match', prompt: 'Read the text and match each subject with Ali\'s description.', passage: 'ali',
      parts: [select('Geography is', ['fun', 'easy', 'interesting', 'useful'], 'useful'), select('Science is', ['fun', 'easy', 'interesting', 'useful'], 'interesting')],
      source: "Lesson 5, Pupil's Book, p. 16, Exercise 6b", explanation: 'Ali calls geography useful and science interesting.',
    },
    {
      id: 'l5-04', lesson: 5, format: 'Read and choose', prompt: 'Read the text and choose the answer.', passage: 'ali',
      parts: [choose("What is Ali's favourite subject?", ['science', 'geography', 'art'], 'geography')], source: "Lesson 5, Pupil's Book, p. 16, Exercise 6, reading text", explanation: 'Ali says his favourite subject is geography.',
    },
    {
      id: 'l5-05', lesson: 5, format: 'Reorder the words', prompt: 'Reorder the words to make a sentence.',
      parts: [write('is / geography / favourite / subject / My', 'My favourite subject is geography.')], source: "Lesson 5, Pupil's Book, p. 17, Exercise 7, item 1", explanation: 'The words form "My favourite subject is geography."',
    },
    {
      id: 'l5-06', lesson: 5, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'bill',
      parts: [select('He lives in ____', ['Syria', 'Italy'], 'Italy'), select('He has ____', ['a brother and a sister', 'two brothers'], 'two brothers')],
      source: "Lesson 5, Pupil's Book, p. 18, Revision 1, Exercise 1, items 2 and 4", explanation: 'Bill lives in Italy and has two brothers, John and Carlos.',
    },
    {
      id: 'l5-07', lesson: 5, format: 'Read and choose', prompt: 'Read the text and choose.', passage: 'bill',
      parts: [select('His name is ____', ['Bill', 'John'], 'Bill'), select('He lives in a big ____', ['house', 'flat'], 'house')],
      source: "Lesson 5, Pupil's Book, p. 18, Revision 1, Exercise 1, items 1 and 3", explanation: 'Bill introduces himself and says he lives in a big house.',
    },
    {
      id: 'l5-08', lesson: 5, format: 'Correct the mistakes', prompt: 'Read and correct the mistakes. Write the corrected word only.',
      parts: [write('There is two beds and a wardrobe in my bedroom.', 'are', 1), write("Lily always wake up at 7 o'clock in the morning.", 'wakes', 1)],
      source: "Lesson 5, Pupil's Book, p. 18, Revision 1, Exercise 2, items 1 and 3", explanation: 'Change "is" to "are" for two beds and "wake" to "wakes" for Lily.',
    },
    {
      id: 'l5-09', lesson: 5, format: 'Read and match', prompt: 'Read and match the questions and answers.',
      parts: [select("What's your favourite subject?", ['I am Lily.', 'I like history.', "It's half past six."], 'I like history.'), select('What time is it?', ['I am Lily.', 'I like history.', "It's half past six."], "It's half past six.")],
      source: "Lesson 5, Pupil's Book, p. 19, Revision 1, Exercise 5, items 4-5", explanation: 'The subject answer is "I like history"; the time answer is "It\'s half past six".',
    },
    {
      id: 'l5-10', lesson: 5, format: 'Choose the correct word', prompt: 'Choose the correct words.',
      parts: [select("She's good ____ geography.", ['at', 'in'], 'at'), select('She ____ blond hair.', ['have got', 'has got'], 'has got')],
      source: 'Lesson 5, Workbook, p. 20, Revision 1, Exercise 1, items 2 and 4', explanation: 'The printed forms are "good at" and "she has got".',
    },
  ],
};

// Interleave lessons differently in each round while keeping the order stable on recovery.
const rounds: Lesson[][] = [
  [1, 3, 5, 2, 4], [2, 4, 1, 5, 3], [5, 1, 3, 4, 2], [4, 3, 2, 1, 5], [3, 5, 4, 2, 1],
  [1, 4, 2, 3, 5], [5, 2, 3, 1, 4], [3, 1, 5, 4, 2], [2, 5, 4, 3, 1], [4, 1, 2, 5, 3],
];

export const questions: Question[] = rounds.flatMap((round, index) => round.map((lesson) => groups[lesson][index]));
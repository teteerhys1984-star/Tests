# Grade 3 English Exam — Unit 1, Lessons 1–5

A complete, curriculum-faithful online exam for **Grade 3 English, Unit 1, Lessons 1–5**, built with **React + TypeScript + Vite** (Tailwind CSS for styling).

* **50 main questions · 10 per lesson · 2 marks each · 100 marks in total**
* Every question is taken from the actual **Pupil’s Book** and **Workbook** exercises of these five lessons.
* Bright light-green, child-friendly, responsive design (phones, tablets, desktops).

| Lesson | Title | Pages | Questions | Marks |
|---|---|---|---:|---:|
| 1 | Back to School | pp. 3–5 | 10 | 20 |
| 2 | School Subjects | pp. 6–8 | 10 | 20 |
| 3 | My Lovely School | pp. 9–11 | 10 | 20 |
| 4 | My Five Senses | pp. 12–14 | 10 | 20 |
| 5 | Revision 1 | pp. 15–17 | 10 | 20 |
| **Total** | | | **50** | **100** |

---

## Quick start

```bash
npm ci            # or: npm install
npm run dev       # local development server
npm test          # automated tests (Vitest)
npm run typecheck # TypeScript check (tsc --noEmit)
npm run build     # production build -> dist/index.html (single self-contained file)
npm run preview   # preview the production build
npm run sounds    # (optional) regenerate the two original sound effects
```

The production build is **one self-contained `dist/index.html`**: all scripts, styles, curriculum picture crops and both sound effects are inlined, so it works offline and needs no other files.

---

## Features

**Welcome page** – exam title, grade and lesson coverage, 50 questions / 100 marks, a required student-name field and a **Start Exam** button. The timer does not start before Start Exam is pressed.

**Stopwatch** – counts upward in `HH:MM:SS` from the moment Start Exam is pressed. It is based on the saved start timestamp, so it never resets when moving between questions, survives page refreshes / browser restarts, and stops when the exam is submitted.

**During the exam** – no correct answers, no right/wrong feedback, no running score, no hints and no explanations. Pupils move with *Previous / Next*, the 50-number navigator, or *Next unanswered*. Answers are kept when navigating. A progress bar and per-question completion indicator show what is answered (never whether it is correct). Internal lesson/page/exercise references are **not** shown.

**Submit Exam** – disabled until every question and every sub-part is answered. When pressed, the exam is submitted **immediately** (no confirmation dialog, no extra message) and the results page appears.

**Results page** – student name, exam title, total score /100, correct (full marks) / partly correct / incorrect counts, time taken, score per lesson, and a detailed review of all 50 questions (question, student answer, correct answer, marks earned / maximum, explanation, source reference: lesson · book · page · exercise).

**TXT report** – a UTF-8 `.txt` file generated locally, named `Grade3_English_Exam_<StudentName>.txt`, containing name, grade, lessons, submission date and time, time taken, total score, lesson scores, every question with student answer, correct answer, marks and source references.

**Teacher Answer Key** – separate area (link on the welcome and results pages, never available while an attempt is active). Password: `somer173`. Shows every question, correct answers, accepted variants, grading rules, marks and source references, with a lesson filter and print button.
> ⚠️ This password is a **basic client-side gate only** — it is *not* secure authentication or encryption. The answer data is part of the page code.

**Saving and recovery (localStorage)** – student name, current question, all answers, start timestamp, elapsed time and exam state are saved continuously. After a refresh or unexpected close the **same attempt** is restored (with a short “Welcome back” notice). A new attempt is only created through the explicit **Start a new attempt** button after submission, and the name is asked for again.

**Sound** – two short, **original** sound effects (exam start chime, submission cadence) synthesised by `scripts/generate-sounds.mjs` and bundled locally (no external audio, no copyrighted music). Mute / unmute button on every screen (remembered on the device).

**Contact strip** – WhatsApp footer with the name **المهندس سومر شاهين** and the clickable number **0930215022** → `https://wa.me/963930215022`. Apart from this name, the whole interface is in English.

---

## Curriculum sources and verification

Exclusive source: <https://github.com/teteerhys1984-star/E_Curriculum_1_9>

Inspected for every lesson: `grade3-unit1-lessonN-pupil-book.html`, `grade3-unit1-lessonN-workbook.html`, `grade3-unit1-lessonN-test.html`, the original page scans in `assets/grade3-unit1-lessonN/source/`, the crops and `source-manifest.json` / `crops-manifest.json`, and `docs/grade3-unit1-lessonN/verification.md` + `source-checklist.md`.

* **Lessons 2–5:** every question, passage and answer was checked against the original Pupil’s Book and Workbook scans (pages 6–17). The pictures used in the exam are crops of those scans (`src/assets/img/`). Printed word labels that would reveal an answer (e.g. *coat*, *goat*) were cropped out; the tiny printed room labels on the Revision school picture are repeated as readable tags at the same positions.
* **Lesson 1:** the repository contains **no Lesson 1 page scan**. Only transcription lines that carry **no** OCR / “needs visual check” / picture / audio warning were used: the *Let’s learn!* frame (*We have got a big house. / He has got a ball.*), the *Talk about your family* model text, Workbook Exercise 4 (*have got / has got*), the printed questions of Workbook Exercise 2 and the sentence starters of Workbook Exercise 5. The unverified dialogue, song, sound list, picture-dependent ticks and the OCR-inferred match answers (*I’m ten years old*, *He’s Dani*, …) were **not** used.
* **Not assessed:** any listening answer that needs the unavailable recordings (e.g. Sally’s table cells other than the printed “2”, listen-and-tick tables, listen-and-number), personal writing/drawing tasks and the Revision project. The Pupil’s Book p. 17 picture column does not line up with its sentences, so only its circling part is used.
* **Passages:** all reading texts are genuine printed texts (Lesson 1 family text, Lesson 2 dialogue + timetable, Lesson 3 dialogue + song, Lesson 4 dialogue + song, Lesson 5 school picture + table). None was invented, merged or taken from another lesson or grade.
* There is **no separate Vocabulary section** and no word-translation / word-list questions.

Small permitted adaptations (all noted in each question’s source detail): a name/number filled into a Workbook sentence starter, option order, using a subset of an exercise’s items, and two short added sub-questions that test the same printed material.

### Question map (exam order)

| # | ID | Lesson | Format | Marks | Source (book, page – exercise) |
|---:|---|---|---|---|---|
| 1 | L3-02 | L3 My Lovely School | True / False | 1 + 1 | Pupil’s Book p. 9 – Activity 1 · Listen and read |
| 2 | L1-06 | L1 Back to School | True / False | 1 + 1 | Pupil’s Book pp. 3–5 – Activity 4 · Talk about your family |
| 3 | L4-03 | L4 My Five Senses | Look and complete | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 12 – Exercise 1 · Look and complete |
| 4 | L2-01 | L2 School Subjects | Read and choose | 1 + 1 | Pupil’s Book p. 6 – Activity 1 · Listen and read |
| 5 | L5-01 | L5 Revision 1 | True / False (tick or cross) | 0.5 + 0.5 + 0.5 + 0.5 | Pupil’s Book p. 15 – Activity 1 · Look, read then tick or cross |
| 6 | L1-01 | L1 Back to School | Choose the correct word | 1 + 1 | Pupil’s Book pp. 3–5 – Activity 2 · Let’s learn! |
| 7 | L3-08 | L3 My Lovely School | Complete the sentence | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 9 – Exercise 1 · Read and write the missing words |
| 8 | L5-06 | L5 Revision 1 | Odd one out | 1 + 1 | Workbook p. 15 – Exercise 2 · Odd one out |
| 9 | L2-07 | L2 School Subjects | Match | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 7 – Exercise 3 · Read and match |
| 10 | L4-01 | L4 My Five Senses | Read and choose | 1 + 1 | Pupil’s Book p. 12 – Activity 1 · Listen and read |
| 11 | L2-04 | L2 School Subjects | Match | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 6 – Exercise 2 · Read and match; Pupil’s Book p. 7 – Activity 3 · Ask and answer |
| 12 | L4-08 | L4 My Five Senses | Read and choose | 1 + 1 | Pupil’s Book p. 14 – Activity 5 · Listen and sing |
| 13 | L1-09 | L1 Back to School | Reorder words | 2 | Workbook pp. 3–5 – Exercise 2 · Read and match (printed question 4) |
| 14 | L5-04 | L5 Revision 1 | Match | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 15 – Exercise 1 · Read and match |
| 15 | L3-05 | L3 My Lovely School | Read and choose | 1 + 1 | Pupil’s Book p. 11 – Activity 5 · Listen and sing |
| 16 | L5-09 | L5 Revision 1 | Sounds and words | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 17 – Exercise 6 · Look, match then write |
| 17 | L2-10 | L2 School Subjects | Short written answer | 1 + 1 | Pupil’s Book p. 8 – Activity 4 · Listen and repeat (numbers 21–30) |
| 18 | L3-01 | L3 My Lovely School | Read and choose | 1 + 1 | Pupil’s Book p. 9 – Activity 1 · Listen and read |
| 19 | L4-05 | L4 My Five Senses | Read and circle | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 13 – Exercise 3 · Read and circle |
| 20 | L1-03 | L1 Back to School | Complete the sentence | 1 + 1 | Workbook pp. 3–5 – Exercise 4 · Read and write |
| 21 | L4-10 | L4 My Five Senses | Look and write | 1 + 1 | Workbook p. 14 – Exercise 6 · Look and write |
| 22 | L5-03 | L5 Revision 1 | Read and circle | 1 + 1 | Pupil’s Book p. 17 – Activity 4 · Read, match then circle |
| 23 | L2-02 | L2 School Subjects | True / False | 1 + 1 | Pupil’s Book p. 6 – Activity 1 · Listen and read |
| 24 | L1-07 | L1 Back to School | Multiple choice | 2 | Workbook pp. 3–5 – Exercise 2 · Read and match (printed questions) |
| 25 | L3-10 | L3 My Lovely School | Sort the words | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 11 – Exercise 6 · Write the words in the correct box |
| 26 | L1-02 | L1 Back to School | Multiple choice | 1 + 1 | Pupil’s Book pp. 3–5 – Activity 2 · Let’s learn! (have got / has got) |
| 27 | L3-04 | L3 My Lovely School | Read and choose | 2 | Pupil’s Book p. 10 – Activity 4 · Look, read and match |
| 28 | L4-06 | L4 My Five Senses | Match | 0.5 + 0.5 + 0.5 + 0.5 | Pupil’s Book p. 13 – Activity 3 · Listen and repeat (10–50) |
| 29 | L5-08 | L5 Revision 1 | Short written answer | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 17 – Exercise 5 · Write |
| 30 | L2-06 | L2 School Subjects | Complete a timetable | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 8 – Exercise 5 · Look and complete |
| 31 | L3-07 | L3 My Lovely School | Order the dialogue | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 11 – Exercise 5 · Read, order then act |
| 32 | L2-09 | L2 School Subjects | Sounds and words | 1 + 1 | Pupil’s Book p. 8 – Activity 5 · Sounds and words (ou) |
| 33 | L5-02 | L5 Revision 1 | True / False and choose | 1 + 1 | Pupil’s Book p. 15 – Activity 1 · Look, read then tick or cross |
| 34 | L1-10 | L1 Back to School | Complete the sentence | 1 + 1 | Workbook pp. 3–5 – Exercise 5 · Write about you |
| 35 | L4-02 | L4 My Five Senses | True / False | 1 + 1 | Pupil’s Book p. 12 – Activity 1 · Listen and read |
| 36 | L2-03 | L2 School Subjects | Complete the sentence | 1 + 1 | Pupil’s Book p. 6 – Activity 1 · Listen and read |
| 37 | L1-05 | L1 Back to School | Reorder words | 2 | Workbook pp. 3–5 – Exercise 4 · Read and write |
| 38 | L3-03 | L3 My Lovely School | Match | 1 + 1 | Pupil’s Book p. 10 – Activity 3 · Ask and answer; Workbook p. 11 – Exercise 5 · Read, order then act |
| 39 | L4-09 | L4 My Five Senses | Sounds and words | 1 + 1 | Pupil’s Book p. 14 – Activity 6 · Sounds and words (oa) |
| 40 | L5-10 | L5 Revision 1 | Read a table | 1 + 1 | Pupil’s Book p. 16 – Activity 2 · Listen then complete the table; Workbook p. 15 – Exercise 1 · Read and match |
| 41 | L4-04 | L4 My Five Senses | Complete the sentence | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 12 – Exercise 2 · Fill in the spaces; Pupil’s Book p. 13 – Activity 2 · Let’s learn! |
| 42 | L1-08 | L1 Back to School | Match | 1 + 1 | Workbook pp. 3–5 – Exercise 2 · Read and match (printed questions 2–3); Workbook pp. 3–5 – Exercise 5 · Write about you (printed sentence starters) |
| 43 | L5-05 | L5 Revision 1 | Reorder words | 2 | Workbook p. 15 – Exercise 1 · Read and match |
| 44 | L2-08 | L2 School Subjects | Write the missing numbers | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 7 – Exercise 4 · Write the missing numbers |
| 45 | L3-09 | L3 My Lovely School | Look, read and write | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 10 – Exercise 3 · Look, read and write |
| 46 | L1-04 | L1 Back to School | Choose the correct sentence | 2 | Workbook pp. 3–5 – Exercise 4 · Read and write |
| 47 | L5-07 | L5 Revision 1 | Odd one out | 1 + 1 | Workbook p. 15 – Exercise 2 · Odd one out |
| 48 | L2-05 | L2 School Subjects | Read a timetable | 1 + 1 | Pupil’s Book p. 7 – Activity 3 · Ask and answer (printed timetable) |
| 49 | L4-07 | L4 My Five Senses | Write the missing numbers | 0.5 + 0.5 + 0.5 + 0.5 | Workbook p. 14 – Exercise 5 · Write the missing numbers |
| 50 | L3-06 | L3 My Lovely School | Sounds and words | 1 + 1 | Pupil’s Book p. 11 – Activity 6 · Sounds and words (ea) |

---

## Grading rules

* Each main question = 2 marks; each sub-part shows its own marks (1 mark, or 0.5 when there are four parts). No negative marking.
* Choice, True/False, matching, circling and ordering items must equal the key. Reorder-the-words items score 2 only when the whole sentence is correct.
* Typed answers ignore capital letters, extra spaces, a final full stop and hyphen-versus-space (`thirty-three` = `thirty three`); spelling must be correct. Where a numeral is also acceptable, the teacher key says so.
* Correct = full marks, Partly correct = some marks, Incorrect = 0 marks.

---

## Project structure

```
index.html
src/
  App.tsx                 state machine, persistence, recovery, timer saving, immediate submit
  main.tsx, index.css
  types.ts
  data/
    lessons.ts            lesson metadata, exam constants, teacher gate
    passages.ts           verified textbook passages (dialogues, songs, table, picture)
    questions.ts          the 50 questions, keys, marks, explanations, source refs, mixed order
    media.ts              imports of the curriculum picture crops
  lib/
    grading.ts            scoring, completion checks
    format.ts             HH:MM:SS, answer/prompt formatting
    storage.ts            localStorage save / load / recovery helpers
    report.ts             TXT report + file name
    sound.ts              mute-aware sound playback
  components/             Welcome, Exam, Question renderer, Passage, Results, Teacher area, Footer, icons
  assets/img/             crops of the original scans
  assets/sounds/          start.wav, submit.wav (generated, original)
  __tests__/
    exam.test.ts          structure, distribution, marks, keys, sources, passages, grading, timer, storage, report
    app.flow.test.tsx     end-to-end flow in jsdom (name required, timer, locked submit, recovery, immediate submit, teacher gate, restart)
scripts/
  generate-sounds.mjs     synthesises the two sound effects
  question-map.ts         prints the question map used in this README
```

## Testing notes

`npm test` runs 35 automated tests: exact count of 50 questions, 10 per lesson, 2 marks each / 100 total, valid answer keys for every sub-part, source references inside each lesson’s pages, verified passages only, no Arabic script and no vocabulary section in the question data, scoring (full, empty, partial, typed-answer normalisation, word order), timer formatting and continuity, storage recovery and corruption handling, TXT report content and file name, the teacher password, plus jsdom end-to-end flows that render all 50 questions.

Visual checks in a real headless browser could not be run in the build sandbox (Chromium system libraries were unavailable); the layout uses responsive Tailwind utilities designed for phone, tablet and desktop widths.

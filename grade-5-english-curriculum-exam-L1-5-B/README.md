# Grade 5 English · Unit 1 — Examination **Model B**

An interactive, automatically graded examination for **Grade 5 English, Unit 1, Lessons 1–5**,
built from the printed Pupil's Book pages **3–20**.

- **50 main questions** — exactly **10** from each lesson
- **2 marks** per question — **100 marks** in total
- Count-up timer (HH:MM:SS), autosave, full answer review, TXT report
- Hidden teacher answer key (client-side gate)

---

## 1. Source of the questions

All question content is transcribed from the source repository:

> `https://github.com/teteerhys1984-star/E_Curriculum_1_9`

specifically the five files

```
grade5-unit1-lesson1-pupil-book.html   (pages  3–5)
grade5-unit1-lesson2-pupil-book.html   (pages  6–8)
grade5-unit1-lesson3-pupil-book.html   (pages  9–11)
grade5-unit1-lesson4-pupil-book.html   (pages 12–14)
grade5-unit1-lesson5-pupil-book.html   (pages 15–20, incl. Revision 1)
```

Rules that were applied and are enforced by the automated tests:

- The textbook's own exercises, statements, passages and wording are used as the primary source.
- Every reading passage is an original textbook passage (the John passage, the Mira passage and the
  five-senses passage are reproduced verbatim, including the book's printed spellings `grage` and
  `houswork`).
- **No listening task is used.** The recordings are not supplied by the source, so no listening
  answer has been invented anywhere in the paper.
- **No standalone Vocabulary section.** Vocabulary is only tested inside ordinary textbook
  exercises, reading comprehension, matching, sentence completion and grammar questions.
- No question asks a pupil about their own real family or other personal information.

## 2. How Model B differs from Model A

`src/data/modelAReference.ts` records the exercise items Model A used. Model B selects different
exercises, different items of the same exercise, a different order and different option orders,
while covering exactly the same five lessons and the same curriculum scope.
The test suite asserts the two forms are not duplicates.

## 3. Structure

```
index.html
src/
  App.tsx                    screen state machine (entry → exam → results / teacher)
  index.css                  design system (sugar-paper surface, cut-paper shapes)
  assets/                    generated collage artwork (inlined at build time)
  components/
    Landing.tsx              name capture, exam facts, Start Exam
    ExamScreen.tsx           lesson rail, question card, timer, Submit Exam
    Results.tsx              score ring, per-question review, TXT download
    TeacherKey.tsx           password-gated answer key
    Contact.tsx              Arabic contact name, phone, WhatsApp
    Confetti.tsx  MuteButton.tsx
  data/
    questions.ts             the 50 questions, sub-parts, marks, answers, explanations
    modelAReference.ts       Model A selection record
  lib/
    grading.ts               normalisation, evaluation, completion, totals
    storage.ts               localStorage attempt persistence, HH:MM:SS timer
    report.ts                UTF-8 TXT report + safe file name
    audio.ts                 generated start / submit chimes (WebAudio)
  tests/exam.test.ts         44 automated checks
```

## 4. Running it

```bash
npm install
npm run dev        # development server
npm run build      # production build → dist/index.html
npx tsc --noEmit   # type checking
npx vitest run     # automated tests
```

## 5. Behaviour notes

- The timer starts only when **Start Exam** is pressed and is computed from a stored timestamp, so
  it stays correct across navigation and page refreshes.
- Refreshing restores the same attempt (name, answers, start time, current question). A new attempt
  requires an explicit **Start a new attempt** action and a new name.
- **Submit Exam** is disabled until every required sub-part is answered, and pressing it opens the
  results page immediately — no confirmation dialog.
- No scores, hints, correctness feedback or answer reveals are shown during the attempt.
- The teacher key is a **client-side gate only**; it is not secure authentication or encryption.

## 6. Contact

**المهندس سومر شاهين** — `0930215022` — <https://wa.me/963930215022>

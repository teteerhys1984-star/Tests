# Grade 5 English — Unit 1 Examination · Model A

A complete, interactive, automatically graded English examination for **Grade 5, Unit 1, Lessons 1–5**
(Pupil's Book pages 3–20), built with **React + TypeScript + Vite + Tailwind CSS v4**.

- **50 main questions** (10 per lesson), **2 marks each** → **exactly 100 marks**
- Count-up timer in `HH:MM:SS` driven by timestamps (survives refresh)
- Autosaving answers, navigation between questions, submit unlock only when every subpart is answered
- Immediate results page (no confirmation dialog), question-by-question review
- UTF-8 TXT report download with the pupil's name in the file name
- Hidden, password-gated Teacher Answer Key
- Required contact strip (Arabic name, phone, WhatsApp)

---

## 1. Source and fidelity

All content comes from the source repository
[`teteerhys1984-star/E_Curriculum_1_9`](https://github.com/teteerhys1984-star/E_Curriculum_1_9),
specifically the Grade 5 Unit 1 Pupil's Book source files:

| File | Pages |
|---|---|
| `grade5-unit1-lesson1-pupil-book.html` | 3–5 · At School |
| `grade5-unit1-lesson2-pupil-book.html` | 6–8 · Family |
| `grade5-unit1-lesson3-pupil-book.html` | 9–11 · Daily Routines |
| `grade5-unit1-lesson4-pupil-book.html` | 12–14 · The Five Senses |
| `grade5-unit1-lesson5-pupil-book.html` | 15–20 · Clothes (+ Revision 1, pp. 18–19) |

Rules followed while writing the paper:

- **Textbook wording is preserved.** Exercises such as Exercise 5 (school stages), Exercise 6b
  (true/false), Exercise 7 (circle the correct word), Exercise 8 (word ordering), the John reading
  passage, the possessive exercises, the frequency chart, the Mira reading passage, the five-senses
  reading passage, the “Buying Clothes” dialogue, the pattern matching and Revision 1 are transcribed
  from those files.
- **Reading passages are reproduced verbatim**, including the source's own printed spellings
  (*grage*, *houswork*, *3000 Sp*). They are not paraphrased and no new passage was invented.
- **No standalone vocabulary section** exists. Vocabulary appears only inside the textbook exercises.
- **No listening-dependent question appears anywhere.** The source marks every listening activity as
  unscored because the recordings are unavailable, so none of those items is used and no listening
  answer key was invented. A unit test asserts this.
- **No audio is used at all** except the two short synthesised interface sounds (start / submit),
  which are original Web Audio tones generated in the browser — no audio files, no network requests.
- **No picture-dependent question appears**, because the original page images are not part of the
  source files used here.
- Question order is **interleaved across the five lessons** (lesson 1 → 5 → 1 → 5 …) rather than
  following the book sequence; each question keeps its lesson record in `src/data/exam.ts`.

---

## 2. Running it

```bash
npm install        # install dependencies
npm run dev        # local development server
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # production build → dist/index.html (single self-contained file)
npm run preview    # preview the production build
```

---

## 3. Project layout

```
index.html                  Google Fonts + document title
src/main.tsx                React entry point
src/App.tsx                 screen state machine: entry → exam → results
src/index.css               Tailwind v4 theme + paper / ruled-surface styles
src/vite-env.d.ts           asset module declarations

src/data/exam.ts            the whole paper: lessons, passages, tables, 50 questions
src/lib/grading.ts          normalisation, per-part grading, completion checks, seeded shuffle
src/lib/storage.ts          localStorage attempt persistence + timestamp timer
src/lib/report.ts           UTF-8 TXT report builder + safe file naming
src/lib/audio.ts            original start / submit sounds (Web Audio)

src/components/EntryScreen.tsx    cover, exam details, pupil name, Start Exam
src/components/ExamScreen.tsx     sticky header, timer, margin rail, navigation, Submit Exam
src/components/QuestionCard.tsx   one question: passage, table, note, all subparts
src/components/ResultsScreen.tsx  score stamp, per-lesson bars, question-by-question review
src/components/TeacherKey.tsx     password-gated answer key
src/components/ContactFooter.tsx  required contact strip

src/__tests__/exam.spec.ts  28 automated checks
vitest.config.ts            test runner configuration
```

---

## 4. Behaviour details

**Entry.** The pupil must type their full name. The screen shows the title, grade, unit, lessons,
question count and total marks. The timer does **not** start until **Start Exam** is pressed.

**Timer.** `startedAt` is stored in `localStorage`; the displayed time is always
`now − startedAt`, so it keeps counting across navigation, re-renders and page refreshes.

**Session recovery.** `name`, `answers`, `startedAt`, `index`, `status`, `submittedAt` and `muted`
are saved on every change. A refresh restores the same attempt — a new attempt only begins through
the explicit **Start a new attempt** action on the results page, which asks for the name again.

**During the exam.** No correct answers, no scores, no hints, no immediate feedback.

**Submitting.** The **Submit Exam** button is disabled until every required subpart is answered, and
it is labelled exactly `Submit Exam`. Pressing it submits immediately — no confirmation dialog, no
“Are you sure?”, no intermediate message — and renders the results page at once, with the original
submission sound (unless muted).

**Results.** Name, score out of 100, correct count, incorrect count, completion time, per-lesson
breakdown and a full question-by-question review showing the original question, the pupil's answer,
the correct answer, marks earned / available, a note where useful, and the lesson reference.
Rubric (personal-response) items are labelled `Teacher rubric`.

**Report.** **Download Report** produces a UTF-8 `.txt` (with BOM) file containing the pupil name,
exam name and model, submission date/time, completion time, final score, every answer with its mark,
correct answers, per-question marks and lesson references. The file name is derived from the pupil's
name, sanitised for file naming.

**Teacher answer key.** Hidden behind the password `somer173` (available from the footer's
*Teacher area* button on the entry and results screens — deliberately **not** shown during the exam).
It lists all 50 questions with correct answers, accepted alternatives, mark allocation, explanations
and lesson / page references. This is a **client-side educational access gate only — it is not real
authentication or encryption** and must not be treated as a security measure.

**Sounds.** A short original chime plays on start and a two-note drop on submit. The speaker button in
the exam header mutes/unmutes.

---

## 5. Question design

Each of the 50 questions is worth exactly 2 marks, split across its subparts with an explicit
allocation shown in the margin of every subpart. Formats are mixed:

- multiple choice
- true / false
- fill in the blank
- match the columns
- choose the correct form
- put the words in the right order (interactive word bank)
- reading comprehension (verbatim passages)
- short structured answers
- two teacher-marked personal-response items with printed rubrics

No two questions repeat the same item in different wording.

---

## 6. Automated tests

`npm test` → **28 tests, all passing** (Vitest). They cover:

- exactly 50 main questions
- exactly 10 questions per lesson (and all five lessons present)
- total score exactly 100, 2 marks per question, every subpart worth > 0
- unique question and part ids
- every subpart counted by the completion check; nothing blank can be submitted
- ordering parts require all words to be placed
- full correct key grades to 100 / 100; blank paper grades to 0
- multiple choice, true/false, short text, ordering and rubric grading
- normalisation of case, spacing and punctuation
- timer formatting, timestamp-based counting, attempt save/restore, corrupt-storage safety
- report contents and safe file naming
- **no listening-dependent question** in the paper
- **every reading passage matches verbatim markers from the Grade 5 Unit 1 source**
- **no standalone vocabulary section**

### Checks actually run

| Command | Result |
|---|---|
| `npm install` | ✅ completed |
| `npm run typecheck` (`tsc --noEmit`) | ✅ no errors |
| `npm test` (`vitest run`) | ✅ 28 / 28 passed |
| `npm run build` (`vite build`) | ✅ `dist/index.html` produced (single self-contained file) |

---

## 7. Notes

- The visual direction is a **school exercise-book booklet**: warm ruled paper (`#FBF7EC`), a cyan
  spot colour (`#0E9AA7`), a red margin rule, a two-colour offset-print look, and a teacher's red pen
  marking the results. Type: Archivo Black (cover), Fraunces (question text), Space Grotesk (UI),
  IBM Plex Mono (timer, marks, tables).
- The ZIP archive of this project is delivered as a **separate Arena artifact**. No download link for
  it appears anywhere in the student-facing interface.

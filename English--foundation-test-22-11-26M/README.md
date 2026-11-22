# English Foundation Exam — Test 1

A mobile-first React + TypeScript + Vite exam for young learners (about 9 years old).
It covers exactly eight lessons of the `English-Course` curriculum and is written
100% in English (the only exception is the required contact name in the footer).

## Curriculum coverage

| Lesson | Topic | Where it appears |
| --- | --- | --- |
| 1 | Sentence structure: Subject + Verb + Object | Q5, Q16 |
| 2 | Verb to be: am / is / are and subject pronouns | Q7, Q13 |
| 3 | Verb to be: negative, questions, short answers | Q2, Q9, Q17 |
| 4 | Nouns and articles: a, an, the | Q1, Q10 |
| 5 | Adjectives: with to be, before a noun, adjective or noun | Q8, Q14, Q18 |
| 16 | Possessive adjectives: my, your, his, her, its, our, their | Q3, Q11 |
| 17 | Possessive pronouns, whose, its/it's, their/they're | Q6, Q15, Q19 |
| 18 | Regular and irregular plurals, is/are | Q4, Q12, Q20 |

Questions are mixed across lessons; students never see lesson numbers or curriculum references
during the attempt. Lesson and skill references appear only in the results page, the downloaded
report and the teacher area.

## Exam structure

- 20 main questions, 5 parts each (a–e) = 100 independently answerable parts.
- Each part is worth 1 mark: 5 marks per question, 100 marks in total.
- Task types: choose, complete, correct the mistake, put the words in order, match, rewrite,
  complete a dialogue, read a passage, write short answers, distinguish similar forms.
- No answers, hints or scores are shown during the attempt.
- `Submit Exam` stays disabled until all 100 parts are answered and submits immediately
  (no confirmation dialog).

## Student flow

1. **Welcome** — neutral exam label, short introduction, required name (English letters),
   instructions, `Start Exam` button. The timer starts only when the button is pressed.
2. **Exam** — elapsed stopwatch (`HH:MM:SS`, timestamp based), answered-parts progress bar,
   question map with red dots for unanswered questions, Previous / Next / `Submit Exam`.
3. **Results** — name, completion date and time, time taken, score /100, percentage, correct and
   incorrect counts, score by topic, and a full breakdown of every part (your answer, correct
   answer, marks, explanation, lesson and skill reference). `Download Report` creates a UTF-8
   `.txt` file locally (file name includes the student's name). `Start a New Exam` requires the
   name again.

### Saving and recovery

`localStorage` stores the student name, answers, current question, start timestamp, elapsed
state and attempt status. A refresh or accidental close restores the same attempt. A new attempt
is created only when the student explicitly starts again.

### Audio

Two original sound effects (start and submit) are synthesised with the Web Audio API — no
external audio files or services. A mute/unmute control is available on the welcome page and in
the exam header; the preference is remembered.

### Teacher area

Protected by a client-side password check (`somer173`). It contains the complete answer key,
accepted answers, marking criteria, question references and the lesson/skill map.
**This is a client-side access restriction only — it does not provide real authentication or
encryption.** The answer key is not reachable during an active attempt.

## Language policy

All student-facing text is English and never depends on the device or browser language
(`<html lang="en" dir="ltr">`, explicit `en-US` date formatting). The Arabic contact name in the
footer is the single permitted exception, as required.

## Development

```bash
npm install
npm run dev       # local dev server
npx tsc --noEmit  # TypeScript type checking
npm run build     # production build (single-file dist/index.html)
npm run preview   # preview the production build
```

## Project structure

```
src/
  data/exam.ts          # exam content (questions, answers, explanations, lesson mapping)
  data/lessons.ts       # lesson titles and topics (results / teacher area only)
  lib/grading.ts        # answer checking, completion checks, scoring
  lib/storage.ts        # localStorage / sessionStorage helpers
  lib/audio.ts          # Web Audio sound effects and mute state
  lib/format.ts         # duration and English date formatting
  lib/report.ts         # TXT report builder and local download
  hooks/useElapsed.ts   # timestamp-based stopwatch
  components/           # Welcome, Exam, Results, TeacherArea, Footer, ui kit
  App.tsx               # screen state machine and attempt persistence
```

The downloadable ZIP of this project is a separate artifact and is never exposed inside the
student-facing application.

## Checks performed before delivery

| Check | Result |
| --- | --- |
| Dependency installation (`npm install`) | Completed — 0 vulnerabilities |
| TypeScript type checking (`npx tsc --noEmit`) | Completed — no errors |
| Automated test suite | None exists in this project (no test runner is configured) |
| Production build (`npm run build`) | Completed — single-file `dist/index.html` |
| Exam data audit | 20 questions, 5 parts each, 100 marks; every key answer valid; all eight lessons covered; no two adjacent questions from the same lesson |
| Language scan | The only Arabic text in the source is the required contact name in the footer |
| Browser verification (headless Chrome) | Welcome, exam, results and teacher screens at 320, 375, 390, 430, 768 and 1280 px with no horizontal overflow; timer accuracy across refresh; submit gating; immediate submission; report download; refresh recovery; teacher password |

## Known limitations

- The teacher area is a client-side restriction only (see above).
- Typed answers are matched against the listed accepted forms; a different but grammatically
  possible wording is marked wrong, so the key lists every accepted alternative.

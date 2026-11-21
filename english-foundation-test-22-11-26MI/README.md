# English Foundation Exam — Test 2

An interactive, English-only foundation exam built with React 19, TypeScript, Vite 7 and Tailwind CSS v4.

Curriculum source: Lessons 1, 2, 3, 4, 5 and 16 of the
[English-Course](https://github.com/johntaylorjt8870-cell/English-Course) repository.

## Exam summary

| Item | Value |
| --- | --- |
| Main questions | 20 |
| Parts per question | 5 (1 mark each) |
| Total marks | 100 |
| Timer | Elapsed stopwatch (HH:MM:SS), timestamp-based, survives refresh |
| Teacher Area password | `somer173` (client-side gate only — not real authentication) |

### Lesson coverage (teacher reference)

| Lesson | Topic | Questions |
| --- | --- | --- |
| 1 | Sentence structure — Subject, Verb, Object | 3, 12 |
| 2 | Pronouns + am / is / are | 6, 15, (8, 20) |
| 3 | Verb to be — affirmative, negative, questions, short answers | 2, 7, 11, 17, (20) |
| 4 | Nouns and articles a / an / the | 4, 10, 16, (9, 18) |
| 5 | Adjectives — placement, be + adjective, adjective vs noun | 5, 9, 13, 18 |
| 16 | Possessive adjectives my / your / his / her / its / our / their | 1, 8, 14, 19, (20) |

Lessons 17 and 18 (possessive pronouns, plural formation) are **not** tested.

## Project structure

```
index.html
src/
  main.tsx                 React entry
  App.tsx                  Screen routing, attempt state, persistence, audio
  index.css                Tailwind + base styles
  data/
    types.ts               Question / answer / result types
    examData.ts            The 20 questions (data only, no UI)
  components/
    WelcomeScreen.tsx      Name form + instructions + Start Exam
    ExamScreen.tsx         Question navigator, progress, timer, Submit Exam
    SubQuestionInput.tsx   Text / choice / match / word-order inputs
    ResultsScreen.tsx      Detailed report + Download Report
    TeacherArea.tsx        Password-gated answer key and marking criteria
    Timer.tsx              Timestamp-based stopwatch
    ContactFooter.tsx      Contact section (phone + WhatsApp)
  utils/
    grading.ts             Normalisation and marking
    storage.ts             localStorage persistence / recovery
    report.ts              UTF-8 TXT report builder and download
    audio.ts               Locally synthesised start/submit sounds (Web Audio API)
    time.ts                Time formatting helpers
  __tests__/exam.test.ts   Data-integrity and grading tests (Vitest)
```

## Scripts

```bash
npm install          # install dependencies
npx tsc --noEmit     # TypeScript type check
npx vitest run       # run tests
npm run build        # production build -> dist/index.html (single file)
npm run dev          # local development server
```

## Behaviour notes

- The attempt (name, answers, current question, start timestamp, status) is saved in `localStorage`.
  Refreshing restores the same attempt; a new attempt is only created when the student chooses
  **Start a New Attempt** after finishing, and the name must be entered again.
- No answers, hints, or scores are shown during the attempt. **Submit Exam** is disabled until every
  part is answered and submits immediately with no confirmation dialog.
- The results report (and the downloadable TXT file) are generated entirely in the browser.
- The interface is fixed to English regardless of the device or browser language. The only Arabic text
  is the required contact name in the footer.

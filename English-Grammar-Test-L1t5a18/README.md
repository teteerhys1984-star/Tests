# English Foundation Exam

A complete, interactive beginner English exam built with React, TypeScript, Vite, and Tailwind CSS.

## Source coverage

The exam was built after inspecting the source data, lesson components, exercises, and shared final-quiz material for these lessons:

- Lesson 1: Sentence Structure
- Lesson 2: Pronouns and Verb to Be
- Lesson 3: Verb to Be: Affirmative, Negative and Questions
- Lesson 4: Nouns and Articles
- Lesson 5: Adjectives and Descriptive Sentences
- Lesson 18: Singular and Plural

No content from unrequested lessons is assessed.

## Exam structure

- Exactly 12 main questions
- 71 independently graded branches
- Exactly 100 marks
- Student name required before the timer starts
- Timestamp-based count-up stopwatch in HH:MM:SS
- Automatic localStorage saving and unfinished-attempt restoration
- Local start and submission WAV sounds with a mute option
- Submit Exam is disabled until all branches are complete
- Immediate results, per-branch review, and UTF-8 TXT reports
- Separate client-side teacher answer key area

## Teacher area

Use the Teacher Area button on the start or results page and enter the supplied teacher password. The password gate is a client-side classroom lock only. It is not real authentication, access control, or encryption.

## Commands

```bash
npm ci
npx tsc --noEmit
npx vitest run
npm run build
```

## Final verification performed

- `npm ci` completed with zero vulnerabilities.
- TypeScript typecheck passed with no errors.
- All 58 automated tests passed.
- Production build passed.
- A headless browser end-to-end flow passed: name gate, timer start, autosave/refresh restoration, all 71 branches, submission eligibility, no confirmation dialog, immediate results, both TXT downloads, explicit restart, and teacher-password unlock.
- Responsive checks passed across 320, 375, 390, 430, tablet, desktop, and phone-landscape sizes with zero horizontal overflow and no undersized visible touch targets.

## Delivery archive

The separate delivery archive is `delivery/English-Foundation-Exam.zip`. It contains the runnable source project, configuration, tests, local assets, and a production build. It is intentionally not linked from any student-facing page.

## Project structure

```text
src/
  App.tsx                 Student flow and attempt state
  components/ui.tsx       Visual components, icons, mascots, footer
  exam/examData.ts        The 12 questions, branches, marks, answers
  exam/grading.ts         Normalisation, completion checks, scoring
  exam/report.ts          UTF-8 TXT report builder and downloads
  exam/sounds.ts          Locally bundled sound playback
  exam/storage.ts         Safe localStorage persistence
  pages/                  Start, exam, results, and teacher screens
  __tests__/              Automated exam and flow-logic tests
public/sounds/            Original locally bundled WAV cues
```

All student-facing text is English only.

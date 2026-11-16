# Grade 8 English Exam — Unit 1 (Lessons 1 & 2)

A complete, interactive, self-correcting English exam for Grade 8 students,
built with **React 19 + TypeScript + Vite + Tailwind CSS 4**.

- **Lesson 1 — Future Plans** → Questions 1–10 (Student's Book pp. 6–11, Workbook pp. 2–5)
- **Lesson 2 — School Challenges** → Questions 11–20 (Student's Book pp. 12–18, Workbook pp. 6–9)
- **20 questions × 5 marks = 100 marks**, all auto-graded.

Question types: reading comprehension (MCQ), vocabulary matching, fill in the
blanks (word bank), tense choice, sentence correction, word formation,
True/False (with a correction item), word reordering, short written answers
with documented acceptable-answer sets, and silent-letter pronunciation.

## Run it

```bash
npm install        # install dependencies
npm run dev        # start the dev server
npm run build      # production build → dist/index.html (single file, fully self-contained)
npm test           # run the Vitest grading/scoring unit tests (34 tests)
npx tsc --noEmit   # TypeScript type checking
```

## Project layout

```
src/
  data/questions.ts        # All 20 questions, passages, answer keys, curriculum refs (data ≠ UI)
  lib/normalize.ts         # Answer normalization (case/space/punctuation tolerant, no substring hacks)
  lib/grading.ts           # Deterministic grading + scoring (unit-tested)
  lib/storage.ts           # localStorage attempt persistence & refresh recovery
  lib/audio.ts             # Local sounds player (+ WebAudio fallback)
  lib/time.ts              # HH:MM:SS stopwatch formatting
  lib/report.ts            # UTF-8 .txt student report builder + safe filename
  lib/__tests__/grading.test.ts  # 34 automated tests for scoring + data integrity
  components/              # StartScreen, ExamScreen, ResultsScreen, TeacherArea, Footer, inputs…
  audio/soundData.ts       # Original sounds embedded as base64 WAV data-URIs
tools/gen-sounds.mjs       # Regenerates the local start/submit sounds
```

## Key behaviours

- **Stopwatch** stores the real start timestamp; refreshing never resets it.
- **Autosave**: name, answers, navigation position and attempt phase persist in
  `localStorage`. A new attempt is created only via "Retake Exam" after submission.
- **Submit Exam** is enabled only when all 20 questions are answered and submits
  immediately (no confirmation dialog), as specified.
- **Results page**: score /100, percentage, correct/partial/incorrect counts,
  time taken, and a full per-question breakdown (student answer, correct
  answer, marks, explanation). The key is never visible before submission.
- **Teacher Area** (footer): password gate (`somer173`) — a classroom
  visibility barrier only, not real authentication.
- **Sounds**: original start/submission chimes bundled locally (no network),
  with a mute/unmute toggle persisted across sessions.

## Regenerating sounds

```bash
node tools/gen-sounds.mjs
```

This rewrites `public/sounds/*.wav` and the embedded data in `src/audio/soundData.ts`.

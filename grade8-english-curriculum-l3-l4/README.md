# English Curriculum Lessons 3&4 — Grade 8 · Unit 1 · Lessons 3 & 4 (`grade8-english-curriculum-l3-l4`)

A complete, interactive, auto-graded English exam for Grade 8 students (Semester 1),
integrated with the Tests platform and built with **React + TypeScript + Vite + Tailwind CSS 4**.

- **EXAM_ID**: `grade8-english-curriculum-l3-l4`
- **Platform Title**: `English Curriculum Lessons 3&4` (World Explorer English Exam)
- **Lesson 3 · Let's Discover** — Questions 1–10 (34 parts · 50 marks)
- **Lesson 4 · Interesting Destinations** — Questions 11–20 (46 parts · 50 marks)
- **20 numbered questions (80 parts) = 100 marks**

## Running

```bash
npm ci                 # install dependencies
npm run typecheck      # TypeScript type checking (tsc --noEmit)
npm test               # vitest — grading, contract, mock-server delivery & UI workflow tests
npm run build          # production build (single-file dist/index.html)
npm run verify:build   # verify single-file HTML bundle, inline assets, title & EXAM_ID
npm run sounds         # regenerate src/assets/audio/{start,submit}.wav
```

## Architecture

```
src/
├── config.ts                # EXAM_ID, EXAM_TITLE, SHEETS_URL, SHEETS_TOKEN
├── App.tsx                  # phase orchestration (start → exam → results), timer, autosave, delivery
├── exam/
│   ├── questions.ts         # all 20 questions (80 parts) + answer keys, verbatim from source
│   ├── grading.ts           # pure grading/scoring module
│   └── types.ts             # domain types
├── lib/
│   ├── storage.ts           # namespaced localStorage attempt persistence + elapsed-time math
│   ├── submit.ts            # Google Sheets contract, Arabic gradeLabel scale, retry & pending flush
│   ├── audio.ts             # original bundled WAV sounds (start / submit) + mute
│   ├── report.ts            # UTF-8 .txt report builder + sanitized download
│   └── time.ts              # HH:MM:SS and date formatting
├── components/              # StartScreen, ExamHeader, QuestionCard, QuestionPalette,
│                            # ResultsScreen (+ SendBanner/Resend), TeacherArea, Footer, Backdrop
├── assets/
│   ├── world-map-texture.jpg
│   └── audio/{start,submit}.wav
└── __tests__/               # unit & UI tests
tests/
├── contract.test.ts         # source fidelity, payload contract, 6 Arabic grade boundaries, TXT report
├── submit.test.ts           # mock server / mock fetch retries, timeout, pending flush, pagehide
├── workflow.test.tsx        # end-to-end 20-question UI workflow + Resend Result
├── mock-server.ts           # local 127.0.0.1 HTTP mock server
├── helpers.ts               # MemStorage / brokenStorage / canonical diff helpers
└── verify-build.mjs         # post-build single-file HTML verification
scripts/generate-sounds.mjs  # generates start.wav / submit.wav
```

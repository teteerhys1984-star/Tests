# World Explorer English Exam — Grade 8 · Unit 1 · Lessons 3 & 4

A complete, interactive, auto-graded English exam for Grade 8 students, built with
**React + TypeScript + Vite + Tailwind CSS 4**.

- **Lesson 3 · Let's Discover** — Questions 1–10
- **Lesson 4 · Interesting Destinations** — Questions 11–20
- **20 numbered questions × 5 marks = 100 marks**

The exam content is based on the E_Curriculum_1_9 source pages for these two lessons
(Student's Book pp. 20–25 & 26–32, Workbook pp. 10–13 & 14–17): journey/destination
vocabulary, the Present Perfect, the Past Perfect, Reported Speech, sequencing and
linking words, the /s/–/k/ pronunciation rule, and the Helen Keller story. All exam
sentences, names and passages are original assessment material written for this exam.

> Curriculum mapping note: the printed pages self-identify as “Module 2 · Unit 3” and
> “Unit 4”; this exam follows the repository route and presents them as
> **Grade 8 · Unit 1 · Lessons 3 & 4** throughout.

## Running

```bash
npm install        # install dependencies
npm run dev        # dev server
npm run build      # production build (single-file dist/index.html)
npx vitest run     # vitest — automated grading & structure tests
npx tsc --noEmit   # TypeScript type checking
```

## Architecture

```
src/
├── App.tsx                  # phase orchestration (start → exam → results), timer, autosave
├── exam/
│   ├── questions.ts         # all 20 questions + answer keys, separated from UI
│   ├── grading.ts           # pure grading/scoring module (unit-tested)
│   └── types.ts             # domain types
├── lib/
│   ├── storage.ts           # localStorage attempt persistence + elapsed-time math
│   ├── audio.ts             # original bundled WAV sounds (start / submit) + mute
│   ├── report.ts            # UTF-8 .txt report builder + sanitized download
│   └── time.ts              # HH:MM:SS and date formatting
├── components/              # StartScreen, ExamHeader, QuestionCard, QuestionPalette,
│                            # ResultsScreen, TeacherArea, Footer, Backdrop
├── assets/audio/            # synthesized start.wav / submit.wav (locally bundled)
└── __tests__/grading.test.ts# automated grading unit tests
scripts/generate-sounds.mjs  # regenerates the original WAV sounds
```

## Features

- **Start screen** with exam title, coverage, totals, instructions and a **mandatory
  student name** field. The timer starts only when **Start Exam** is clicked.
- **Reliable stopwatch (HH:MM:SS)** driven by a stored `startedAt` timestamp — it
  survives refresh and tab closure without losing a second.
- **20 varied questions**: matching, MCQ, cloze, text transformation, True/False,
  ordering, pronunciation, error correction and reading comprehension.
- **Submit gate**: the **Submit Exam** button stays disabled until every part of all
  20 questions is answered, then submits **instantly** (no confirmation step).
- **No feedback during the attempt** — answers, keys, hints and scores appear only
  after submission.
- **Results page** with student name, score/100, percentage, submission date/time,
  time taken, correct/partial/incorrect counts, and per-question detail
  (student answer · correct answer · marks · explanation).
- **Download Exam Report** — a UTF-8 plain-text report; the filename includes the
  sanitized student name.
- **Teacher Area** (`Teacher Area` link in the footer, password `somer173`): full
  answer key, mark allocation, explanations and curriculum references. The password
  gate is a client-side classroom visibility barrier only — not secure authentication.
- **Autosave & recovery**: name, answers, position, start timestamp and attempt status
  persist in `localStorage`; an interrupted attempt resumes exactly where it stopped.
  **Retake Exam** on the results page starts a brand-new attempt and asks for the
  student's name again.
- **Sounds**: original, locally bundled start and submission chimes with a visible
  mute/unmute control (no external audio URLs).
- **Interface language: English only**, except the exact supplied contact name in the
  footer: **المهندس سومر شاهين — 0930215022** (WhatsApp: https://wa.me/963930215022).

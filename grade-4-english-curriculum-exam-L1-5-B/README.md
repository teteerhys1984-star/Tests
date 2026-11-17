# Grade 4 English Curriculum Exam — Unit 1 (Lessons 1–5)

A complete, standalone Grade 4 English curriculum exam built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**, derived exclusively from the verified Pupil’s Book and Workbook pages for **Grade 4 — Unit 1 — Lessons 1 to 5** in [`teteerhys1984-star/E_Curriculum_1_9`](https://github.com/teteerhys1984-star/E_Curriculum_1_9).

## Exam Structure

| Lesson | Lesson Title | Pupil’s Book | Workbook | Main Questions | Marks |
|---|---|---|---|---:|---:|
| Lesson 1 | Nice to Meet You! | pp. 3–5 | pp. 5–7 | 10 | 20 |
| Lesson 2 | My Family | pp. 6–8 | pp. 8–10 | 10 | 20 |
| Lesson 3 | Daily Routine | pp. 9–11 | pp. 11–13 | 10 | 20 |
| Lesson 4 | My House | pp. 12–14 | pp. 14–16 | 10 | 20 |
| Lesson 5 | School Subjects / Revision 1 | pp. 15–20 | pp. 17–21 | 10 | 20 |
| **Total** | | | | **50** | **100** |

- Every main question is worth strictly **2 marks** (sub-parts have explicit mark allocations summing to 2 marks).
- Questions are presented in a balanced **mixed order** across all five lessons.
- Every reading passage is printed verbatim from the Grade 4 Unit 1 Pupil’s Book or Workbook (Ahmed, Edward, Sanaa, John White, Dan, My Dream House, My Bedroom, Ali, Bill, and Luna). No passages were invented, no separate Vocabulary section exists, and no unverified listening-only items are scored.

## Key Features

- **Welcoming Student Entry**: Mandatory student name validation before starting; stopwatch stays at `00:00:00` until **Start Exam** is clicked.
- **Timestamp Stopwatch (`HH:MM:SS`)**: Counts upward continuously across navigation and page refreshes, stopping immediately on submission.
- **Locally Embedded Audio**: Original, locally generated start and submit chime effects with a persistent **Sound On / Muted** toggle and zero external audio URLs.
- **Strict Active-Exam Integrity**: No answers, hints, scores, explanations, or curriculum source references are shown during the exam; the **Submit Exam** button unlocks only when all 50 questions and sub-parts are answered, and submits immediately with no confirmation dialog.
- **Auto-Save & Recovery**: `localStorage` automatically preserves student name, current question, all answers, start timestamp, elapsed time, and exam state across refreshes or unexpected browser closure. Starting a new attempt requires an explicit restart after completion and a newly entered student name.
- **Results & UTF-8 TXT Report**: Displays total score out of 100, correct/incorrect counts, elapsed time, lesson-by-lesson scores, and a full 50-question review with curriculum source references, plus a one-click `Grade4_English_Exam_StudentName.txt` UTF-8 download.
- **Teacher Answer Key**: Separate area gated by a basic client-side interface password (`somer173`; intended for classroom convenience, not cryptographic authentication or server security) and completely disabled during any active student attempt.

## Running Locally

```bash
npm install
npm run dev
```

## Verification, Tests & Production Build

```bash
# TypeScript type-check
npx tsc --noEmit

# Automated test suite (question counts, lesson distribution, passages, answer key, marks, TXT report, recovery)
npx vitest run

# Production build
npm run build
```

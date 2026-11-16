# Grade 3 English Curriculum Exam — Unit 1 (Lessons 1 to 5)

A complete, standalone interactive English curriculum assessment for **Grade 3 — Unit 1 — Lessons 1 to 5**, built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## Curriculum Source & Fidelity

All 50 questions, reading dialogues, songs, timetables, word banks, and picture crops are sourced exclusively from the verified Grade 3 Unit 1 Pupil's Book and Workbook pages in:

`https://github.com/teteerhys1984-star/E_Curriculum_1_9`

| Lesson | Title | Main Questions | Marks |
|---|---|---:|---:|
| Lesson 1 | Back to School | 10 | 20 |
| Lesson 2 | School Subjects | 10 | 20 |
| Lesson 3 | My Lovely School | 10 | 20 |
| Lesson 4 | My Five Senses | 10 | 20 |
| Lesson 5 | Revision 1 | 10 | 20 |
| **Total** | | **50** | **100** |

- Every main question is worth **2 marks** (sub-parts carry explicit mark allocations summing to 2).
- Questions are presented in a mixed order during the exam; curriculum source references remain hidden until submission.
- Unverified OCR passages and audio-only listening tasks without recordings are excluded.
- No standalone vocabulary-list or word-translation section is included.

## Features

- **Welcome Screen**: Mandatory student name validation, exam summary, sound mute/unmute toggle, and Start Exam trigger.
- **Continuous Stopwatch (`HH:MM:SS`)**: Starts only on Start Exam, persists across question navigation and browser refreshes using saved timestamps, and stops immediately upon submission.
- **Locally Embedded Audio**: Original in-memory PCM WAV sound effects for exam start and exam submission with mute/unmute control (no external audio URLs).
- **Strict Active Exam Mode**: No hints, scores, answer checks, explanations, or source references are shown during the exam. Submit Exam unlocks only when all 50 questions and sub-parts are answered, and submits immediately with no confirmation dialog.
- **Results & Review**: Total score out of 100, correct/incorrect counts, elapsed time, score breakdown for Lessons 1–5, and a detailed 50-question review including explanations and internal curriculum source references.
- **Downloadable UTF-8 `.txt` Report**: Generates `Grade3_English_Exam_<StudentName>.txt` locally with full exam metadata, per-lesson scores, every question, student answers, correct answers, marks earned, and source references.
- **Session Saving & Recovery**: Automatically saves and restores active and completed attempts via `localStorage`.
- **Teacher Answer Key**: Separate password-gated view showing all 50 questions, model answers, accepted variations, grading rules, mark allocations, and curriculum source references. Note that client-side password gating is a basic classroom interface gate rather than server-side authentication.

## Getting Started

```bash
npm install
npm run dev
```

## Type Check, Automated Tests & Production Build

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

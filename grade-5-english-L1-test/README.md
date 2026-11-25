# English Exam – Grade 5 · Unit 1 · Lesson 1: At School

A React + TypeScript + Vite interactive exam built from the Grade 5 Unit 1 Lesson 1 materials
(Pupil's Book, Workbook, Vocabulary list) in the repository `teteerhys1984-star/E_Curriculum_1_9`.

## Exam structure (100 marks)

| Section | Focus | Marks |
|---|---|---|
| Q1 | School places – Arabic → typed English (3 words) | 12 |
| Q2 | Vocabulary recall challenge (3 words) | 12 |
| Q3 | Final vocabulary challenge (2 words) | 8 |
| Q4 | Have to / has to / don't have to | 15 |
| Q5 | School stages (nursery, basic/primary, secondary) | 10 |
| Q6 | Reading comprehension (passage + 4 parts × 5 marks) | 20 |
| Q7 | School rules and real-life situations | 11 |
| Q8 | Mixed skills (closed response only) | 12 |

There is no writing or composition task. All 8 target vocabulary words are tested exactly once in Q1–Q3.

## Marking rules

- **Vocabulary (typed):** capitals, extra spaces, hyphens and a leading "a/an/the" are ignored.
  A small spelling slip earns half marks and is reported as "Spelling mistake". Plurals or different words earn no marks.
- **Choice, dropdown, true/false:** exact match. **Ordering:** every slot must be correct.
- Each sub-part is marked independently.

## Features

- Student name required; the timer starts only when **Start Exam** is pressed (HH:MM:SS, timestamp based).
- Answers, name, start time and current section are saved to `localStorage` and restored after refresh.
- No automatic new attempt after refresh. **Start a new attempt** asks for the name again.
- Submit Exam stays disabled until every answer is complete, then submits immediately (no dialog).
- Results: score, percentage, time, per-item answers, correct answers, explanations and curriculum references.
- **Download Report** creates a UTF-8 `.txt` file named after the student, generated locally in the browser.
- Original tones for start and submit sounds (Web Audio API), with a mute toggle.

## Teacher Answer Key

The key is hidden from the student interface. Open the page with the `#teacher` address
(for example `index.html#teacher`), then enter the teacher password.
This is a client-side access restriction only. It is not real authentication or encryption.

## Development

```bash
npm install
npm run dev        # local development
npm run build      # production build (single-file dist/index.html)
npx tsc --noEmit   # type check
npx vitest run     # unit tests for content and scoring
```

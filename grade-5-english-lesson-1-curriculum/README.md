# Lesson 1 Curriculum — Grade 5 · Unit 1 · Lesson 1: At School

An interactive React + TypeScript + Vite exam built from the verified source folder `grade-5-english-L1-test`, preserving its original pastel visual identity, structure, marking rules, and curriculum references.

- **EXAM_ID**: `grade-5-english-lesson-1-curriculum`
- **Visible Title**: `Lesson 1 Curriculum`
- **Grade / Semester / Subject**: Grade 5 · Semester 1 · English
- **Added Date**: `25-11-2026`

## Exam structure (8 sections, 64 items, 100 marks)

| Section | Focus | Items | Marks |
|---|---|---|---|
| Q1 | School places – Arabic → typed English | 3 | 12 |
| Q2 | Vocabulary recall challenge | 3 | 12 |
| Q3 | Final vocabulary challenge | 2 | 8 |
| Q4 | Grammar: have to / has to / don't have to | 5 | 15 |
| Q5 | School stages (nursery, basic/primary, secondary) | 8 | 10 |
| Q6 | Reading comprehension (passage + 4 parts × 5 marks) | 20 | 20 |
| Q7 | School rules and real-life situations | 11 | 11 |
| Q8 | Mixed skills (closed response only) | 12 | 12 |

Confirmed fix from source: in Q4.1, removed the duplicate word `to` in `"Karim ___ keep the classroom tidy."` so the sentence reads naturally with option `"has to"`.

## Features

- Student name input with `dir="auto"` (supports both Arabic RTL and English LTR names) and `dir="rtl" lang="ar"` on Arabic vocabulary prompts.
- Count-up timer (`HH:MM:SS`) started on **Start Exam** and persisted by timestamp.
- Auto-save and session restore in isolated `localStorage` keys namespaced by `grade-5-english-lesson-1-curriculum`.
- Section navigation bar (`Q1`–`Q8`) allowing full review and editing before submission; **Submit Exam** unlocks when all 64 items are complete.
- Accurate auto-grading including half-marks (`2/4`) for minor spelling slips on Q1–Q3 vocabulary items.
- Detailed per-item results screen and local UTF-8 `.txt` report download.
- Google Sheets delivery following the `grade5-math-unit1` contract (`Content-Type: text/plain;charset=utf-8`, 3 attempts with `2s` then `5s` delays, `30s` timeout, stable `attemptId`, local `pending:` queue + automatic `retryPending` on load, non-blocking delivery banner + **Resend result** button).
- Teacher area (`Teacher area` button or `#teacher`) protected by password `somer173`, displaying model answers, curriculum references, student performance on the device, and downloadable student report.

## Development & Checks

```bash
npm ci
npm run typecheck  # tsc --noEmit
npm test           # vitest run (55 tests)
npm run build      # single-file dist/index.html
```

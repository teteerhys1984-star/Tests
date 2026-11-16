# Grade 3 English Curriculum Exam L1-5 B (`grade3-english-curriculum-exam-l1-5-b`)

Standalone interactive Grade 3 English exam (**Semester 1 · Unit 1 · Lessons 1–5**, **Version B**), integrated into the exam platform alongside Version A (`grade3-english-curriculum-exam-l1-5-a`).

- **Exam ID & Published Folder**: `grade3-english-curriculum-exam-l1-5-b`
- **Display Title**: `Grade 3 English Curriculum Exam L1-5 B`
- **Source Upload Folder (excluded from builds)**: `grade-3-english-curriculum-exam-L1-5-B`
- **Curriculum Scope**: Grade 3 English, Unit 1 (*Lessons 1–5*: *Back to School*, *School Subjects*, *My Lovely School*, *My Five Senses*, *Revision 1*)
- **Structure & Marks**: 50 main questions (143 evaluated sub-parts), 2 marks per main question, **100 marks total** (10 questions / 20 marks per lesson)

## Features

- Mandatory pupil name entry before starting; continuous timestamp-backed `HH:MM:SS` stopwatch and local session persistence (`grade3-english-curriculum-exam-l1-5-b:session:v1`).
- 28 lossless curriculum PNG crops embedded directly in TypeScript modules (`src/assets/curriculum/`) and 2 locally synthesized 16-bit PCM WAV sound effects (`src/utils/sound.ts`) with mute toggle.
- Password-protected Teacher Answer Key (`somer173`) available before starting and after submitting.
- Immediate submission once all 50 questions are complete, full question-by-question review with curriculum source references, downloadable `.txt` report, and automatic Google Sheets delivery (`src/utils/submit.ts`) following the `grade5-math-unit1` contract (3 retries, 2 s / 5 s backoff, 30 s timeout, `pending:grade3-english-curriculum-exam-l1-5-b:<attemptId>` local persistence, auto-flush on reload, and manual **Resend Result** button).

## Commands

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run verify:build
```

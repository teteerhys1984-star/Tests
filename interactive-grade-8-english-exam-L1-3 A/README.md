# Grade 8 English Exam — Unit 1 · Model A

An interactive, mobile-first examination for **Grade 8 — Unit 1 — Lessons 1, 2 and 3**, built with
React + TypeScript + Vite + Tailwind CSS v4.

## Curriculum source

All question content is transcribed from the official curriculum repository
[`teteerhys1984-star/E_Curriculum_1_9`](https://github.com/teteerhys1984-star/E_Curriculum_1_9):

| Source file | Used for |
| --- | --- |
| `grade8-unit1-lesson1-pupil-book.html` | Passage 1 (SB p. 7) + SB p. 8 tasks + SB p. 9 tense selection |
| `grade8-unit1-lesson1-workbook.html` | WB p. 4 tense reference tables and grammar practice |
| `grade8-unit1-lesson2-pupil-book.html` | SB p. 14 grammar-in-context paragraph and tense selection |
| `grade8-unit1-lesson2-workbook.html` | WB p. 8 Past Simple / Past Progressive reference and exercises |
| `grade8-unit1-lesson3-pupil-book.html` | Passage 2 (SB p. 21) + SB p. 22 tasks + SB p. 23 reported speech |
| `grade8-unit1-lesson3-workbook.html` | WB p. 12 present perfect + reported speech, WB p. 13 exercises |

## Examination structure

- **30 main questions** — 10 per lesson (Q1–10, Q11–20, Q21–30).
- **100 marks** — Lesson 1: 33 · Lesson 2: 34 · Lesson 3: 33.
- **Exactly two reading passages**, both original: *Schools in the Past, Present and Future* (SB p. 7)
  and *My Amazing Journey* (SB p. 21). No third passage, no separate vocabulary section, no listening
  (the official recordings are unavailable).
- Question types: multiple choice, fill in the blank, true/false, short answer, sentence
  transformation, reported-speech completion, grammar correction and tense identification.
- Source page references are hidden during the exam and revealed only on the results screen and in the
  Teacher Area.

## Student workflow

1. **Welcome** — title, Model A, the three lessons, full-name entry, Start Exam.
2. **Timer** — elapsed `HH:MM:SS`, timestamp-based, survives refresh and question navigation.
3. **During the exam** — answers auto-save to `localStorage`; answered/unanswered state is shown, but
   never correctness, hints or scores; optional mute for the start/submit sounds (both synthesised
   locally with the Web Audio API — no external audio files).
4. **Submit Exam** — the button is written exactly `Submit Exam`, stays disabled until every sub-part
   is answered, submits immediately with no confirmation dialog.
5. **Results** — name, Model A, submission date/time, time spent, score out of 100, percentage, three
   lesson scores, every question with the student's answer, the correct answer, marks earned/available,
   an explanation, and the lesson + page reference. A UTF-8 TXT report (filename contains the student's
   name) can be downloaded, plus a backup download button.

## Attempt management

- The active attempt (name, answers, timer start, mute state) persists across refreshes.
- Refreshing never resets the timer or starts a new attempt.
- A new attempt can only be started explicitly from the results screen and asks for the name again.
- Previous reports are kept in `localStorage` and are not overwritten automatically.

## Teacher Area

A hidden Teacher Area (small key icon in the page, bottom-right) is gated by the password
`somer173`. It lists all answers, mark allocation, explanations, accepted alternatives and source
references.

> **Honest limitation:** this is a client-side password check for classroom convenience only. It is not
> authentication, not encryption, and it does not protect the answer key from anyone who reads the
> page source.

## Contact

Footer strip on the exam and results screens:

- **المهندس سومر شاهين**
- Phone (clickable): **0930215022**
- WhatsApp: https://wa.me/963930215022

## Project layout

```
index.html
src/
  App.tsx               # screen router (welcome / exam / results) + attempt lifecycle
  index.css             # Tailwind v4 theme tokens and base styles
  assets/               # generated imagery (bundled, no external requests)
  components/
    Welcome.tsx         # start screen
    ExamScreen.tsx      # header, timer, progress, navigation, submit bar
    QuestionCard.tsx    # passage, multiple choice, true/false, fill-in, inline blanks
    Results.tsx         # scoreboard, lesson scores, per-question review, TXT export
    TeacherArea.tsx     # password-gated answer key
    Contact.tsx         # footer contact strip
  data/exam.ts          # passages, 30 questions, answer key, grading logic
  lib/
    storage.ts          # attempt + report persistence, timer helpers
    sound.ts            # Web Audio start / submit sounds
    report.ts           # UTF-8 TXT report builder
```

## Development

```bash
npm install
npm run build     # vite build
npm run dev       # local development server
```

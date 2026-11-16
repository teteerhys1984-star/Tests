# The Garden of Knowledge — Grade 3 English Examination

A complete, interactive, child-friendly English exam web app for **Grade 3 · Unit 1 · Lessons 1–5**
(Back to School · School Subjects · My Lovely School · My Five Senses · Revision 1).

- **35 main questions** — exactly **13 Vocabulary** (Q1–13) + **22 Grammar / Reading / Phonics / Language Use / Writing** (Q14–35)
- Every vocabulary question shows a **verified Arabic curriculum word** and asks the pupil to **write its meaning in English** (typed answers, forgiving normalisation, accepted alternatives)
- **Exactly 100 marks**, distributed per difficulty with independent sub-part marking
- Feminine pastel garden theme ("The Garden of Knowledge") — flowers, butterflies, soft cards
- Count-up stopwatch (HH:MM:SS) driven by timestamps, survives page refresh
- Full answer persistence in `localStorage` (name, answers, current question, submission state)
- Two original, locally generated sound effects (`public/sounds/`) + visible mute control
- Strict **Submit Exam** flow — disabled until every required answer is complete, submits instantly, no confirmation dialogs
- Detailed results page + **Download Exam Report (TXT)** generated in the browser (UTF-8)
- Password-gated **Teacher Answer Key** (password: `somer173`) — a basic client-side barrier only, not real authentication
- Footer contact strip: **Eng. Somer Shaheen · 0930215022** with clickable WhatsApp link
- All content in English; every question carries an internal curriculum reference (lesson · book · page · skill)

## Tech stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · lucide-react · Vitest

## Install & run

```bash
npm install        # install dependencies
npm run dev        # development server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## Quality checks

```bash
npx tsc --noEmit   # TypeScript type checking
npx vitest run     # 63 automated tests: grading keys, normalisation,
                   # partial credit, mark totals (exactly 100), session
                   # persistence, submit gating, teacher gate, reports
```

## Regenerating the sound effects (optional)

The two WAV files are committed in `public/sounds/`. To regenerate them:

```bash
node scripts/generate-sounds.mjs
```

## Project structure

```
src/
  data/examData.ts        All 35 questions, answer keys, rubrics, curriculum refs
  logic/grading.ts        Deterministic grading engine + completion checks
  logic/report.ts         TXT student report + teacher key generation
  logic/storage.ts        localStorage session persistence
  logic/sound.ts          Local sound playback + mute state
  components/             Welcome, ExamScreen, QuestionCard, parts, Results,
                          TeacherKey, GardenFooter, Decor (SVG garden art)
  app.test.tsx            Full student-journey interaction tests (jsdom)
  logic/*.test.ts         Grading + persistence test suites
```

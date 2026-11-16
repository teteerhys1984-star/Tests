# The Garden of Knowledge — Grade 4 English Exam (Unit 1 · Lessons 1–5)

A complete, interactive **Grade 4 English examination** built with **React + TypeScript + Vite + Tailwind CSS v4**,
wrapped in an original **battle-royale-inspired mission interface** (dark tactical HUDs, supply-crate
question cards, safe-zone rings, tactical map navigation — no weapons, no combat, fully school-safe).

**Exam scope:** Unit 1, Lessons 1–5 — *Nice to Meet You! · My Family · Daily Routine · My House · School Subjects*
(curriculum verified against `github.com/teteerhys1984-star/E_Curriculum_1_9`, Grade 4, Pupil's Book & Workbook).

---

## Exam structure

| Mission | Questions | Skill | Marks |
|---|---|---|---|
| M1 — Vocabulary Drop | 1–13 | **Vocabulary: Arabic curriculum word → student writes the English meaning** (exactly 13, all five lessons) | 29 |
| M2 — Grammar Zone | 14–26 | Grammar, Language Use, guided Writing | 41 |
| M3 — Sound Radar | 27–28 | Phonics (silent letters *h/e* — PB p.14) | 4 |
| M4 — Reading Mission | 29–32 | 4 original short passages | 12 |
| M5 — Writers' Basecamp | 33–35 | Sentence building, error correction, rubric writing | 14 |
| **Total** | **35 mains / 79 scored parts** | | **100** |

- **Vocabulary format (per teacher's directive):** every vocabulary item displays an **Arabic
  word/phrase from the curriculum word lists** (L1 دولة/طبيب/الأردن · L2 طويل القامة/جدة/أخضر/عيون/نحيف ·
  L3 ينهض من الفراش/الفطور/المساء/يرتدي ملابسه/أغسل وجهي · L4 مطبخ/أريكة/خزانة ملابس/غرفة الجلوس/مصباح ·
  L5 الجغرافيا/صعب/ممل) and the student **types the English meaning** — graded with normalization
  (case, spacing, accepted variants).
- **Other formats:** multiple choice, fill-in-the-blank, matching, True/False,
  choose-the-correct-word, sentence ordering (word chips), error correction, short rubric-scored writing.
- **Branching:** 18 multi-part questions with independently scored sub-parts.
- Open writing is auto-scored by a **published, transparent rubric** (criteria shown in results)
  and flagged for optional teacher review — it never pretends to be exact-string grading.

## Features

- Mission-briefing welcome screen; student's full name required before **Start Exam**.
- Count-up **HH:MM:SS stopwatch** driven by timestamps (starts only on Start, survives refresh).
- Auto-save of name, answers, current question and session to `localStorage` — refresh-safe.
- **31-instrument segmented progress strip**, mission status panel and a 35-cell **tactical map**.
- **Submit Exam** stays disabled until every required part is answered; submits instantly — no dialogs.
- Two **locally bundled WAV sound effects** (mission start / submission), with a mute toggle.
- Full **Mission Debrief** results page: score/100, percentage, correct/partial/incorrect counts,
  rubric review notice, and per-question report with student answer, correct answer, marks,
  explanation, and lesson/skill reference.
- **Download Exam Report (TXT)** — UTF-8 report generated locally, filename
  `Grade4_English_Exam_<Student_Name>.txt`.
- Hidden **Teacher Answer Key** (password `somer173` — footer "Teacher Access") with all keys,
  accepted alternatives, mark allocations, rubrics and curriculum references.
  _Note: a static client-side gate only — a basic barrier, not real authentication or encryption._
- Footer contact strip: **Eng. Somer Shaheen · Phone: 0930215022 ·
  [WhatsApp](https://wa.me/963930215022)** (both clickable).
- 100 % English student-facing UI; zero external APIs, databases or audio URLs at runtime.

## Run locally

```bash
npm install       # install dependencies
npm run dev       # dev server (http://localhost:5173)
npm run build     # production build → dist/index.html (single self-contained file)
npm run preview   # serve the production build

npx tsc --noEmit  # TypeScript type checking
npx vitest run    # automated test suites (37 tests)

tsx scripts/generate-sounds.mjs  # regenerate the local WAV sound effects
tsx scripts/dump-answers.ts      # freeze the answer key to /tmp/answers.json (QA seeding)
node qa/browser.mjs              # end-to-end browser QA (needs the preview server running)
```

## Project layout

```
src/
  App.tsx                  phase orchestration (welcome → exam → results) + session persistence
  types.ts                 exam, question, answer, grading and result types
  data/questions.ts        all 35 questions, answer keys, rubrics, curriculum references
  logic/grading.ts         normalization, per-part graders, rubrics, exam totals
  logic/storage.ts         localStorage session + mute persistence
  logic/report.ts          UTF-8 TXT report builder + download
  logic/sounds.ts          local WAV playback (no external URLs)
  components/              WelcomeScreen, ExamScreen, Parts (inputs), ResultsScreen,
                           TeacherKey, Footer (contact strip), ui (brand/icons)
  assets/sounds/           mission-start.wav · mission-submit.wav (generated locally)
scripts/                   sound synthesis + answer-key dump utilities
qa/browser.mjs             Playwright end-to-end checks (37 behavioural assertions)
```

## Automated quality checks (all executed)

- **37 unit/integration tests** (Vitest): content integrity (35 questions, 13 vocabulary, exactly
  100 marks, per-question mark sums, all five lessons, English-only), grading behaviour
  (correct/incorrect, capitalization, spacing, curly-vs-straight apostrophes, multiple accepted
  forms, multi-part independence, rubric partial credit, perfect run = 100/100).
- **37 end-to-end browser checks** (Playwright on the production build): timer starts only on Start
  and survives refresh monotonically, answers persist across navigation and refresh, Submit stays
  gated until complete, instant results with 100/100 on a perfect run, TXT download + filename,
  Retake resets the attempt, teacher gate wrong/right password, exact WhatsApp/phone links,
  zero page errors, responsive mobile render.

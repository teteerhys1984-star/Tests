# Grade 8 English Examination — Unit 1 (Lessons 1–3) · **Model B**

A complete, self-contained examination built with **React + TypeScript + Vite + Tailwind CSS v4**.
Model B is an alternative to Model A: same curriculum scope, same difficulty, same 100-mark
total — but a different selection, construction and order of questions.

---

## 1. Curriculum fidelity

All thirty questions are grounded in the official repository
[`teteerhys1984-star/E_Curriculum_1_9`](https://github.com/teteerhys1984-star/E_Curriculum_1_9):

| Source file | Used for |
|---|---|
| `grade8-unit1-lesson1-pupil-book.html` (pp. 6–11) | Passage “Schools in the Past, Present and Future” (p. 7), Reading A/B (p. 8), Grammar A (p. 9) |
| `grade8-unit1-lesson1-workbook.html` (pp. 2–5) | Grammar reference tables and practice (p. 4) |
| `grade8-unit1-lesson2-pupil-book.html` (pp. 12–18) | Grammar-in-context paragraph and tense selection (p. 14) |
| `grade8-unit1-lesson2-workbook.html` (pp. 6–9) | Past Simple / Past Progressive reference and exercises A–B (p. 8) |
| `grade8-unit1-lesson3-pupil-book.html` (pp. 20–25) | Passage “My Amazing Journey” (p. 21), Reading A (p. 22), Present perfect survey (p. 23), Reported speech model (p. 23) |
| `grade8-unit1-lesson3-workbook.html` (pp. 10–13) | Present perfect reference (p. 12), Reported speech C–D (p. 13) |

Rules honoured by the data file `src/data/exam.ts`:

- exactly **two** reading passages (Student’s Book p. 7 and p. 21) — no third passage,
  and the Workbook “Bullying” text is **not** used;
- **no** separate Vocabulary section, **no** listening tasks (no recordings exist);
- no grammar or vocabulary imported from other grades or units;
- textbook wording preserved; only spacing/typography is tidied for screen reading.

## 2. Structure and scoring

| Lesson | Questions | Marks |
|---|---:|---:|
| Lesson 1 — Future Plans | 10 (Q1–Q10) | 33 |
| Lesson 2 — School Challenges | 10 (Q11–Q20) | 34 |
| Lesson 3 — Let’s Discover | 10 (Q21–Q30) | 33 |
| **Total** | **30** | **100** |

- Lesson 1: 5 reading-comprehension questions (Q1–Q5) + 5 tense/future questions (Q6–Q10).
- Lesson 2: 10 grammar questions built from the p. 14 verb bank and Workbook p. 8 A/B — no reading.
- Lesson 3: 5 comprehension questions (Q21–Q25) + 5 Present Perfect / Reported Speech questions (Q26–Q30).
- 47 answer parts in total (multiple choice, fill-in-the-blank, true/false, open short answer,
  sentence correction). Every part has its own mark and its own marking rule.

## 3. Student workflow

1. **Welcome** — name required, *Start Exam* begins the attempt and plays the locally
   synthesised start chime.
2. **Timer** — count-up `HH:MM:SS`, computed from the stored start timestamp, so refresh
   restores the same attempt and the same elapsed time.
3. **During the exam** — answers autosave to `localStorage`, question navigator with
   answered/unanswered states, lesson tabs, collapsible reading passage, mute control.
   No hints, no feedback, no scores.
4. **Submit Exam** — always labelled *Submit Exam*, disabled until every part is answered,
   submits immediately with **no confirmation dialog**, then shows the results at once.
5. **Results** — name, Model B, submission date/time, time spent, total /100, percentage,
   lesson-by-lesson scores, and every question with the student’s answer, the correct answer,
   marks earned, an explanation and the lesson/page reference. A UTF-8 `.txt` report
   (file name contains the student’s name) can be downloaded as a backup.
6. **Teacher Area** — password `somer173` (a client-side convenience gate only, not real
   authentication): full answer key, mark distribution, explanations, accepted alternatives
   and source references.
7. **Attempt recovery** — refresh restores the attempt; a new attempt is an explicit action
   after submission, asks for the name again, and archives the previous report instead of
   overwriting it.

No Google Sheets, no external database, no analytics, no data transfer — everything stays in
the browser.

## 4. Design

Bright, cheerful, boy-friendly “school sports-day signage” identity: colour-blocked bands,
sticker cards with hard offset shadows, chunky numbered chips and folder-style lesson tabs.

- **Palette** — bright blue `#1257FF`, turquoise `#06B6B0`, orange `#FF7A18`,
  lime `#86D40B`, yellow `#ffc91a`, ink navy `#0B2A5B` on paper `#F2F7FF`.
- **Type** — *Archivo Black* (display) with *Nunito* (body), loaded from Google Fonts with
  robust system fallbacks.
- **Mobile-first** — designed at 320 px first: no horizontal scrolling, ≥44 px touch targets,
  fixed bottom action bar with the submit button in reach, responsive passage panel,
  navigator sheet instead of tables, `env(safe-area-inset-bottom)` support and reduced-motion
  handling.
- Two generated illustrations (school past→future, journey to Spain) are bundled and inlined
  into the build — no remote image requests.

## 5. Project layout

```
index.html            title, viewport, Google Fonts
src/main.tsx          entry
src/App.tsx           state machine: welcome → exam → results (+ teacher gate)
src/data/exam.ts      the 30 questions, both passages, answer keys, explanations
src/lib/grading.ts    normalisation, marking, report building, clock helpers
src/lib/report.ts     UTF-8 TXT report + download (name in the file name)
src/lib/storage.ts    attempt / report persistence
src/lib/sound.ts      locally synthesised start & submit sounds
src/components/       Welcome, ExamScreen, Results, TeacherArea, ContactFooter, Icons
scripts/verify.mjs    automated checks (structure, marks, marking, report)
```

## 6. Verification actually executed

```bash
npm ci            # lockfile present
npx tsc --noEmit  # passes with strict + noUnusedLocals
node scripts/verify.mjs   # 25/25 checks pass
npm run build     # dist/index.html produced (single-file bundle)
```

`scripts/verify.mjs` asserts: 30 questions, 10 per lesson, marks 33/34/33 = 100,
exactly two official passages, no listening/vocabulary item, a perfect script scoring
100/100, an empty script scoring 0, one wrong MCQ costing exactly its own marks,
normalisation behaviour, and the TXT report contents.

## 7. Contact

**المهندس سومر شاهين** · Phone [0930215022](tel:0930215022) ·
WhatsApp [wa.me/963930215022](https://wa.me/963930215022)

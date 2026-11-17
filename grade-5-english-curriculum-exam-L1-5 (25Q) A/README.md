# Grade 5 English Examination — Unit 1, Lessons 1–5 · Model A

A complete, interactive, mobile-first examination built with **React + TypeScript + Vite**
and **Tailwind CSS v4**.

Curriculum source of truth:
[`github.com/teteerhys1984-star/E_Curriculum_1_9`](https://github.com/teteerhys1984-star/E_Curriculum_1_9)

---

## Exam structure

| | |
|---|---|
| Main questions | **25** (exactly 5 from each of Lessons 1–5) |
| Marks | 4 per question · **100 marks total** |
| Reading passages | **2** — Pupil’s Book p. 7 (the John family) and p. 13 (the five senses) |
| Listening items | **None** — every audio-dependent textbook activity was excluded; no audio answer was invented |
| Separate vocabulary section | None — vocabulary appears inside contextual, grammar, reading and rule tasks |
| Question order | Genuinely interleaved; no two neighbouring questions come from the same lesson |

The internal lesson / page / exercise / skill tag for every question and sub-item is stored in
`src/data/exam.ts` and is revealed **only** in the results report and in the teacher answer key.

## Student experience

- Full name required before the exam begins.
- The stopwatch starts **only** on *Start Exam* and counts up in `HH:MM:SS`.
- Timing is timestamp-based (`startedAt` → `submittedAt`), so it stays correct across question
  navigation and page refreshes.
- Answers are auto-saved to `localStorage`; refreshing restores the same attempt and never
  silently creates a new one.
- No answers, hints, explanations or scores are shown during the attempt.
- **Submit Exam** is the exact button label, stays disabled until every question *and* sub-item is
  answered, submits immediately with no confirmation dialog, and jumps straight to the results.
- Original embedded start and submission sounds (Web Audio API, nothing fetched at runtime) with a
  mute toggle.

## Results and reporting

- Student name, score out of 100, percentage, parts correct, time used.
- Question-by-question and sub-item-by-sub-item breakdown: the student's answer, the correct
  answer, marks awarded and a plain-English explanation.
- Source lesson, page and exercise for every item (for teacher review).
- Downloadable UTF-8 `Grade5-Unit1-Exam-Report-<Name>.txt` report plus a **Backup Copy** button.

## Teacher answer key

A separate, password-protected area (`somer173`) holding every correct answer, the mark
allocation, the explanations, the internal lesson mapping and the exact curriculum references.

> This password is a **visibility barrier only** — it is not real authentication or encryption.
> The answer text ships inside the published bundle. Deploy behind real access control if that
> matters for your use case.

## Retakes

A retake happens only when the student explicitly presses **Retake Exam** after submission. It
clears the stored attempt, asks for the name again and starts a fresh timer.

## Running it

```bash
npm install
npm run dev      # develop
npm run build    # type-checks nothing on its own — see below
npx tsc --noEmit # TypeScript type checking
npm run preview  # serve the built single-file bundle
```

## Checks actually executed

- `npx tsc --noEmit` — passes with `strict`, `noUnusedLocals`, `noUnusedParameters`.
- `npm run build` — passes; Vite emits a single self-contained `dist/index.html`
  (`vite-plugin-singlefile`), so there are no runtime asset fetches.
- A structural verification script over `src/data/exam.ts` confirmed: 25 questions, 5 per lesson,
  100 marks, 0 same-lesson adjacencies, exactly 2 passages, 98 sub-items, no duplicate ids, and an
  explanation + source reference on every sub-item.
- Layouts reviewed at 320, 360, 390, 414, 768, 1024 and 1280 px widths, in portrait and landscape
  (the question index strip collapses away on short landscape screens).

## Project layout

```
index.html
src/
  App.tsx                 state machine: start → exam → results → teacher key
  index.css               Tailwind v4 theme (paper/lilac/peach/turquoise) + motion
  data/exam.ts            the whole question bank, passages and hidden source tags
  lib/grading.ts          normalisation, marking, completion checks
  lib/attempt.ts          attempt persistence, timestamp stopwatch, mute preference
  lib/sound.ts            embedded start / submit sounds
  lib/report.ts           UTF-8 TXT report builder + download
  components/             StartScreen · ExamScreen · QuestionCard · ResultScreen
                          TeacherKey · ContactStrip · Decor (hand-drawn SVG)
  assets/                 generated paper hero and report seal
```

## Contact

**المهندس سومر شاهين** — [0930215022](https://wa.me/963930215022)

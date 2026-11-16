# Curriculum Test Lessons 1 to 5 — Grade 4 English (Semester 1)

**Platform/index title:** `Curriculum Test Lessons 1 to 5`
**Folder / `EXAM_ID`:** `grade4-english-curriculum-l1-l5`
**Published path:** `/Tests/grade4-english-curriculum-l1-l5/`
**Index placement:** الصف الرابع ← الفصل الأول ← اللغة الإنجليزية (explicit `semester: 1` in
`landing/exams.json`, plus `Semester 1` in `<title>` so the classification does not rely on the
default). The platform's classification system, gate/password, Cairo font, `deploy.yml` and all
other published exams are untouched.

This is the published, standalone edition of the original `Mahmoud's L1-L5 Test` folder
(`main@c90be436`), moved with `git mv`. It keeps the original **The Garden of Knowledge**
battle-royale-inspired mission interface (dark tactical HUD, supply-crate cards, tactical map,
teacher answer key, contact strip), the original CSS/fonts, the two sound effects and the
original TXT report.

## Scope (taken from the actual question bank, not assumed)

Unit 1, Lessons 1–5: *Nice to Meet You! · My Family · Daily Routine · My House · School Subjects*.

| Mission | Questions | Skill | Marks |
|---|---|---|---|
| M1 — Vocabulary Drop | 1–13 | Arabic curriculum word → student types the English meaning | 29 |
| M2 — Grammar Zone | 14–26 | Grammar, language use, guided writing | 43 |
| M3 — Sound Radar | 27–28 | Phonics (silent letters h/e) | 4 |
| M4 — Reading Mission | 29–32 | Four short passages | 12 |
| M5 — Writers' Basecamp | 33–35 | Sentence building, error correction, rubric writing | 12 |
| **Total** | **35 main questions / 80 scored parts** | | **100** |

Formats: typed vocabulary, multiple choice, fill-in-the-blank, matching, True/False,
word ordering, error correction and rubric-scored writing. 23 questions are multi-part.
Open writing is auto-scored by the published, transparent rubric shown in the results.

> The original README's counts were inaccurate (79 parts, 18 multi-part, M2 41, M5 14,
> 37 tests). The **content was not changed**; only this documentation was corrected to the
> measured values (80 parts, 23 multi-part, M2 43, M5 12, 39 original unit tests).

## Build fix (the only technical defect found)

`npm ci` succeeded but `npm run build` failed on `main` with:

```
Could not resolve "../assets/sounds/mission-start.wav" from "src/logic/sounds.ts"
```

`src/logic/sounds.ts` imports two WAV files and `scripts/generate-sounds.mjs` is the project's
own generator for them, but **neither WAV file was committed**. Both
`mission-start.wav` (31,796 B) and `mission-submit.wav` (55,168 B) were regenerated with the
unmodified generator (`node scripts/generate-sounds.mjs`) and committed under
`src/assets/sounds/`. No sound was removed, no import was deleted, no feature was disabled and
no build configuration was changed: Vite + `vite-plugin-singlefile` inlines both files as
`data:audio/wav;base64,...` inside `dist/index.html`, so the published single file has no
broken paths and needs no extra asset files. `npm run verify:build` proves they are
byte-identical to the sources, that all 44 font data URIs and the inline SVG drawings are
present, and that there are no external resources.

## Result delivery (Google Sheets)

Same contract as the platform reference `grade5-math-unit1` — the Apps Script deployment,
its settings and its credentials are **not modified**. `src/config.ts` copies
`SHEETS_URL`/`SHEETS_TOKEN` verbatim and sets a new unique `EXAM_ID`.

- Payload fields (exact names/types): `token, attemptId, examId, examTitle, studentName,
  startAt, submitAt, elapsedSec, summary{total,max,percentage,gradeLabel,fullQuestions,
  partialQuestions,wrongQuestions,correctSubparts,partialSubparts,wrongSubparts,
  unansweredSubparts}, lessons[{title,awarded,max}], details[{q,qTitle,lessons,label,status,
  awarded,marks,studentAnswer,correctAnswer}], reportText`.
- `POST` with `Content-Type: text/plain;charset=utf-8`, `redirect: follow`.
- 3 attempts; 2 s then 5 s between them; 30 s timeout per attempt.
- One `attemptId` per attempt, reused for every retry, for automatic re-send and for the
  independent **Resend Result** button (server de-duplicates).
- Unsent payloads are kept at `pending:grade4-english-curriculum-l1-l5:<attemptId>` and
  silently re-sent when the exam is opened again; only this exam's namespace is flushed.
- A `pagehide`/`visibilitychange` guard saves an in-flight payload immediately.
- Delivery is always in the background: a failure never hides or changes the student's score.
  The results screen shows `sending / success / failed` and offers **Resend Result** separate
  from **Retake Exam**.
- `summary.gradeLabel` uses the reference scale only (ممتاز / جيد جداً / جيد / مقبول / ضعيف /
  يحتاج إلى دعم) and is sent to the teacher only; it is not added to the student's screen or
  TXT report. No token, attemptId, examId or other student's data is shown to the student.
- **Download Exam Report (TXT)** is downloaded automatically at submission (inside the click
  handler) **and** stays available on the results screen in every delivery state, so the
  student always has the report even if sending fails or the browser blocks the automatic
  download. The original UTF-8 report, filename and content are unchanged.

## Privacy

The exam asks for the student's full name only (as the reference does) and states truthfully
on the welcome screen that the name, answers and result are sent to the teacher on submission,
and that answers are also saved in this browser. No other personal information is requested.
No claim of encryption, secrecy or "no external APIs" is made any more.

## Commands

```bash
npm ci
npm test                # 76 tests: original 39 + baseline/contract/submit/workflow
npm run typecheck       # tsc --noEmit
npm run test:reference  # verifies the fixture against the real grade5-math-unit1 sources
npm run build           # dist/index.html, single self-contained file
npm run verify:build    # sounds/fonts/SVG/paths/self-containment after build
npm run dev | npm run preview
npx tsx scripts/dump-answers.ts   # /tmp/answers.json for qa/browser.mjs
node qa/browser.mjs               # Playwright E2E (needs a Chromium binary; not run here)
```

`npm test` uses a local **Mock Server on 127.0.0.1** plus injected fetch/storage/clock. **No
real request was made to Google Apps Script / Google Sheets** and no row was written in a real
sheet. The Playwright browser QA could not be executed in this sandbox (browser binaries are
not installed and `cdn.playwright.dev` is not reachable); DOM-level workflow checks in
`tests/workflow.test.tsx` (jsdom) cover the same flows instead.

## How content preservation is proven

`tests/fixtures/*` were captured by running the **original** code before any edit:

- `questions-baseline.json` — all 35 questions, 80 parts, options, accepted answers, marks,
  curriculum references and constants; `tests/baseline.test.ts` requires exact equality.
- `grading-golden.json` — five frozen answer sheets (perfect 100, empty 0, all-wrong 0,
  mixed 95, partial-credit 98) with the complete `ExamResult`, per-part states, TXT report
  hash, filename and submission gate.
- `source-hashes.json` — SHA-256 of 19 files that must stay byte-identical
  (`questions.ts`, `grading.ts`, `report.ts`, `sounds.ts`, `index.css`, the untouched screens,
  utilities, tests, generator and browser QA).
- `grade5-contract.json` — payload shape, statuses and gradeLabel scale generated by executing
  the reference exam's own functions; `npm run test:reference` re-verifies the source hashes.

## Notes left for human review (content deliberately unchanged)

- Q27b describes the `h` in *white* as silent ("we say wite"). In most EFL curricula `wh` is
  /w/, but some dialects pronounce /ʍ/; the exam cites PB p.14. Ambiguous, not provably wrong.
- Q28b calls the middle `e` of *vegetable* silent and gives "vej-tuh-bul". The common
  three-syllable pronunciation does elide it, but the wording is debatable.

Both were left exactly as in the original, with their answer keys and marks intact.

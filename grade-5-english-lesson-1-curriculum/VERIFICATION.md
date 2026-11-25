# Verification Report — `grade-5-english-lesson-1-curriculum`

## 1. Scope & Source Parity
- **Source folder**: `grade-5-english-L1-test` (untouched; all 22 file SHA-256 checksums verified unchanged).
- **Published folder / `EXAM_ID`**: `grade-5-english-lesson-1-curriculum`
- **Visible Title**: `Lesson 1 Curriculum`
- **Classification**: Grade 5 · Semester 1 · English (`landing/exams.json`, `addedAt: "25-11-2026"`, `<meta name="exam-added-at" content="25-11-2026" />`).
- **Structure**: 8 main questions, 64 interactive items, 100 total marks (`12 + 12 + 8 + 15 + 10 + 20 + 11 + 12`).
- **Confirmed source fix**: Q4.1 `"Karim ___ to keep the classroom tidy."` → `"Karim ___ keep the classroom tidy."` (removed duplicate `"to"` when combined with answer `"has to"`).

## 2. Automated Tests & Build
- `npm run typecheck` (`tsc --noEmit`): **0 errors**.
- `npm test` (`vitest run`): **55 / 55 passing** across 3 files:
  - `src/test/exam.test.ts` (45 tests): structure, 8 questions, 64 items, 100 marks, 8 vocabulary words, grading rules, report generation, Q4.1 fix, `EXAM_ID` & `EXAM_TITLE` parity.
  - `src/test/storage.test.ts` (5 tests): isolated `localStorage` keys (`grade-5-english-lesson-1-curriculum:*`), save & restore across reloads for in-progress and submitted attempts, corrupted JSON resilience.
  - `src/test/submit.test.ts` (5 tests, Mock Fetch only, real `fetch` disabled): reference payload contract matching `grade5-math-unit1`, `Content-Type: text/plain;charset=utf-8`, 3 attempts with `[2000, 5000]` ms delays, `30000` ms timeout with `AbortController`, stable `attemptId` reuse, `pending:<EXAM_ID>:<attemptId>` save & `retryPending` flush on reload.
- `npm run build`: single-file `dist/index.html` (`333.44 kB`).

## 3. Platform & Indexing Checks
- `bash landing/scripts/build-exams.sh` + `python3 landing/generate.py _site`: built 43 exam folders, skipped `grade-5-english-L1-test`, indexed `grade-5-english-lesson-1-curriculum` under Grade 5 / Semester 1 / English with title `Lesson 1 Curriculum` and `25-11-2026` badge.
- `python3 landing/tests/test_build_exams.py`: **6 / 6 passing**.
- `python3 landing/tests/test_generate.py`: **44 / 44 passing**.
- `node --test landing/tests/gate.test.mjs`: **10 / 10 passing**.
- `python3 landing/scripts/verify-site.py _site`: all checks for `grade-5-english-lesson-1-curriculum`, landing structure, Cairo typography, gate, and `addedAt` passed (569/570 total; the single failure is pre-existing on legacy `grade-4-english-curriculum1n5-exam-23-11-2026`).

## 4. Real Chromium & Visual Comparison
Executed via headless Chromium (`playwright-core` + `@sparticuz/chromium`) at **`1366×900` (desktop)** and **`390×844` (mobile)** with mocked Google Sheets endpoint:
- **Console / Page errors**: `0` on desktop and `0` on mobile.
- **Horizontal overflow**: `scrollWidth === innerWidth` (`1366 === 1366` and `390 === 390`) across start screen, active questions (Q1, Q4, Q6), results, teacher area, and landing page.
- **Visual comparison**: Side-by-side screenshot inspection confirmed the exact pastel pink-fuchsia-violet visual identity, rounded card layout, Arabic word prompt cards, sticky header/passage layout, and contact cards match the source `grade-5-english-L1-test`, with `Lesson 1 Curriculum` title and responsive single-row header pills on `390×844`.
- **End-to-end flow**: Student name entry (`ليلى أحمد`), auto-save & reload restore, all 64 items answered, submit (`100 / 100`, `100%`), mock Google Sheets POST (`text/plain;charset=utf-8`), `.txt` report download, and Teacher area unlock (`somer173`) all verified.

## 5. Source Integrity (SHA-256)
All 22 files inside `grade-5-english-L1-test` matched their initial SHA-256 digests verbatim after all work and builds completed.

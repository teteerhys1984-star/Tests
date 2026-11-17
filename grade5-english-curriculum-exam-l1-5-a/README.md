# Grade 5 English Curriculum Exam L1-5 A

Independent published exam: `grade5-english-curriculum-exam-l1-5-a`.
Grade 5 → Semester 1 → English. Published URL: `./grade5-english-curriculum-exam-l1-5-a/`.

- **EXAM_ID:** `grade5-english-curriculum-exam-l1-5-a`
- **Title shown to pupils and on the platform card:** `Grade 5 English Curriculum Exam L1-5 A`
- **Source of the educational content:** `grade-5-english-curriculum-exam-L1-5-A` (uploaded project)
- **Curriculum:** Grade 5 Pupil's Book, Unit 1 (Model A), Lessons 1–5, pages 3–20

---

## 1. Content audit (extracted from the source, before any change)

Everything below was **extracted from the source folder**, not assumed.

| Item | Value |
|---|---|
| Main questions | **50** |
| Sub-parts (total) | **99** |
| Total marks | **100** |
| Marks per question | **2 for every question** (no exceptions) |
| Questions per lesson | **10** for each of the 5 lessons |
| Marks per lesson | **20** for each of the 5 lessons |
| Sub-parts per question | **49 questions with 2 sub-parts**, 1 question (`L1-9`) with a single 2-mark sub-part |
| Part types | mcq **38**, text **36**, true/false **18**, word-ordering **4**, teacher-rubric **3** |
| Question / part ids | 50 / 99 — all unique, no duplicates |
| Duplicate prompts | none across questions (three prompts occur twice *inside one question* — two branches of the same item, see §7) |
| Reading passages | 4 verbatim passages (John, Mira, the five senses, the "Buying Clothes" dialogue) |
| Listening-dependent items | **0** (the source marks every listening activity as unscored) |
| Audio / picture-dependent items | **0** (the two sounds are synthesised in the browser; no audio or image files are used by questions) |

Lesson split:

| Lesson | Title | Questions | Marks | Pages |
|---|---|---|---|---|
| L1 | At School | 10 | 20 | Pupil's Book pp. 3–5 |
| L2 | Family | 10 | 20 | Pupil's Book pp. 6–8 |
| L3 | Daily Routines | 10 | 20 | Pupil's Book pp. 9–11 |
| L4 | The Five Senses | 10 | 20 | Pupil's Book pp. 12–14 |
| L5 | Clothes | 10 | 20 | Pupil's Book pp. 15–20 |

Presentation order is the source's interleaved order (L1 → L2 → L3 → L4 → L5, repeated ten
times), not the book order.

## 2. Content fidelity

`src/data/exam.ts` is **byte-identical** to the source file
`grade-5-english-curriculum-exam-L1-5-A/src/data/exam.ts`. No question, wording, option,
answer, accepted alternative, order, passage, table, mark or source reference was changed.

`src/__tests__/source-parity.spec.ts` proves this automatically: it compares the two files
byte-for-byte, compares the exported question list (order included), lessons, passages,
tables, parts, options, answers, accepted answers and marks, and asserts that no runtime
module imports anything from another exam.

The only file of the source's test suite that was touched is `src/__tests__/exam.spec.ts`:
the two `Attempt` literals gained the new `attemptId` field (the attempt record changed
because an id is needed for delivery). **No assertion about the paper was changed** — the
source's own 28 tests still pass unchanged.

## 3. What was changed technically (and only this)

| File | Change | Why |
|---|---|---|
| `src/config.ts` | **new** — `EXAM_ID`, `EXAM_TITLE`, grade/subject/semester, and the copied `SHEETS_URL` / `SHEETS_TOKEN` | platform identity + delivery configuration |
| `src/lib/storage.ts` | attempt key `grade5-english-curriculum-exam-l1-5-a-attempt-v1`, added `attemptId` | storage independence, stable attempt identity |
| `src/lib/submit.ts` | **new** — payload builder, retry logic, pending queue, receipts | Google Sheets delivery |
| `src/App.tsx` | delivery on submit, resend, pending flush on load | delivery flow |
| `src/components/ResultsScreen.tsx` | delivery banner, "Resend result" button, grade label | delivery feedback |
| `src/components/EntryScreen.tsx` | platform title, Grade 5 / English / Semester 1 in the details, lessons list | correct identification |
| `src/components/ExamScreen.tsx`, `TeacherKey.tsx`, `ContactFooter.tsx` | platform title in the header / teacher key / footer | consistent naming |
| `src/lib/report.ts` | one extra title line (`GRADE 5 ENGLISH CURRICULUM EXAM L1-5 A`) above the untouched original line | published name on the TXT report; the original line is preserved |
| `src/index.css` | Cairo embedded locally instead of Google Fonts; `overflow-x: clip` on `html`/`body` | no external dependency; the entrance animation no longer creates a horizontal scrollbar on a phone |
| `src/assets/fonts/*.woff2` | the platform's own Cairo files (copied from `landing/fonts/`, SIL OFL) | local font |
| `index.html` | title + description, Google Fonts links removed | published name, no CDN |
| `vite.config.ts` | `base: "./"` | correct asset paths under the platform sub-path |
| `package.json` | package name, test dependencies (Testing Library, jsdom, playwright-core) | the platform build/test scripts |
| `tests/browser.mjs` | **new** — real-Chromium run of the whole pupil journey | proof that the published page works in a browser |

The TXT report file name (`Grade5-Unit1-ModelA_<name>_<stamp>.txt`) is the source's own
format and was left untouched.

## 4. Google Sheets — the platform contract

The delivery contract is the one of the platform reference exam `grade5-math-unit1`; no
Apps Script, deployment, token or platform-wide setting was changed.

- POST to the same `SHEETS_URL`, `Content-Type: text/plain;charset=utf-8` (no CORS preflight).
- Payload fields: `token, attemptId, examId, examTitle, studentName, startAt, submitAt,
  elapsedSec, summary, lessons, details, reportText`.
- `summary` / `lessons` / `details` keep the reference shapes (see `src/lib/submit.ts`).
- The marks are re-derived with the same `gradeExam` used by the results page and the TXT
  report, so the teacher receives exactly what the pupil saw.
- 3 attempts maximum, delays 2 s then 5 s, 30 s timeout per attempt.
- The **same `attemptId`** is used for every retry and for a manual resend, so the Apps
  Script can de-duplicate.
- A failed delivery is stored under `pending:<EXAM_ID>:<attemptId>` and is retried silently
  the next time the exam is opened; a delivered attempt gets a receipt under
  `sent:<EXAM_ID>:<attemptId>` so a refresh does not send it twice.
- A failed delivery never hides the score, the review or the TXT report; the results page
  shows the state and offers a separate **Resend result** button.
- The grade scale is the platform's approved one: ممتاز ≥95 · جيد جداً ≥85 · جيد ≥75 ·
  مقبول ≥65 · ضعيف ≥50 · يحتاج إلى دعم <50. The pupil-facing page shows the same scale in
  English (Excellent / Very Good / Good / Acceptable / Weak / Needs support); the Arabic label of
  the contract is sent to the teacher in `summary.gradeLabel`.

**Every test in this project uses a mock fetch. No test — and no manual step of the
verification — ever contacted the live endpoint.**

## 5. Assets and fonts

The platform publishes only `dist/index.html`, so every asset has to be inside that file:

- `src/assets/cover.jpg` and `src/assets/marked.jpg` (the source's own images) are inlined
  as base64 by the single-file build.
- The Cairo WOFF2 files (`cairo-arabic`, `cairo-latin`, `cairo-latin-ext`, with `OFL.txt`)
  are imported from `src/assets/fonts/` and inlined the same way.
- The two interface sounds are original Web Audio tones generated in the browser — no audio
  files, no network requests.
- The Google Fonts links of the source (`Archivo Black`, `Fraunces`, `Space Grotesk`,
  `IBM Plex Mono`) were removed; the four font roles now use the platform's local Cairo.
  No CDN, no Google Fonts, no external stylesheet remains in the built file.

## 6. Indexing and publication

- `landing/exams.json` gained the override
  `grade5-english-curriculum-exam-l1-5-a → grade 5 / english / semester 1 /
  "Grade 5 English Curriculum Exam L1-5 A"`.
- The source folder `grade-5-english-curriculum-exam-L1-5-A` was added to the exclusion
  lists of `.github/workflows/deploy.yml` and `landing/scripts/build-exams.sh` (all previous
  exclusions are kept), so the source is never built and never appears as an exam link.
- The card appears in the index under **الصف الخامس ← الفصل الأول ← اللغة الإنجليزية**
  and links to `./grade5-english-curriculum-exam-l1-5-a/`.

## 7. Findings about the source (documented, not "fixed")

These were found during the audit and are **reported, not corrected** — correcting them would
mean inventing educational content:

1. **`L1-8` uses the label `4` for both of its sub-parts** (the source's exercise-item
   numbering), while `L1-7` uses `1` and `3`. The label is printed next to each sub-part, so
   the two branches of `L1-8` carry the same item number. The label was left exactly as it is.
2. The source README says the paper has “two teacher-marked personal-response items”, while
   the data holds **three rubric sub-parts in two questions** (`L1-10b`, `L3-10a`, `L3-10b`).
   The data is authoritative; the README wording is a documentation nuance.
3. Three sub-part pairs of the same question share a generic wording (“Choose the female
   pair.”, “Which sense?”, “Choose the answer.”). They are distinguished by their `lead`
   word and their label, exactly as in the source — they are two branches of one item, not
   two duplicate questions.
4. The reading passages reproduce the source's own printed spellings (`grage`, `houswork`,
   `3000 Sp`). They were kept verbatim on purpose.

## 8. Tests and how to run them

```sh
npm ci
npm run typecheck      # tsc --noEmit
npm test               # vitest run  → 99 tests
npm run build          # vite build  → dist/index.html (single self-contained file)
npm run test:browser   # real Chromium run of the exam (needs CHROMIUM_PATH)
```

| Suite | What it proves |
|---|---|
| `src/__tests__/exam.spec.ts` (source suite, 28 tests) | the paper's own checks still hold |
| `src/__tests__/source-parity.spec.ts` (6) | the published paper is the uploaded paper, byte for byte |
| `src/__tests__/grading.spec.ts` (25) | 50 questions / 99 sub-parts / 100 marks, per-lesson split, grading of every part type, completion rules |
| `src/__tests__/submit.spec.ts` (25) | payload contract, retry policy, pending queue, receipt, attempt-id stability, storage independence, grade scale |
| `src/__tests__/delivery.flow.test.tsx` (7, jsdom) | start → answer → submit → results → send; failure → pending → resend with the same attempt id; pending flushed on the next opening |
| `src/__tests__/platform.spec.ts` (8) | production build is a single self-contained page with the right title, local fonts, no CDN, relative paths, and no shared storage key |
| `tests/browser.mjs` (real Chromium) | the pupil's whole journey in a real browser: entry → teacher gate → all 50 questions answered → submit → results → TXT report → delivery → refresh → new attempt; plus phone/tablet layouts and the published `dist/index.html` |

Platform-level tests (run from the repository root):

```sh
python3 landing/tests/test_generate.py      # index: card placement, semester, subject, link
python3 landing/tests/test_build_exams.py    # build exclusions, source folder never published
bash landing/scripts/build-exams.sh          # builds every published exam into _site
```

### Real browser run

`tests/browser.mjs` drives the exam in a **real Chromium** (Playwright) and passes:

```
PASS: entry, teacher gate, all 50 questions, submission, results, report, delivery and restart
PASS: phone, small-phone and tablet layouts
PASS: the published dist/index.html loads, uses the local Cairo font and asks for nothing external
```

It checks the real DOM (not a mock): the entry screen, the teacher password gate, answering
all 50 questions / 99 sub-parts through the actual widgets (MCQ, true/false, text, word
ordering, rubric), the submit button staying disabled until every question is answered, the
results page (100/100, *Excellent*, 50/50 questions, 99/99 parts), the TXT report download
and its 50 `Source:` lines, the delivery payload (all 13 contract fields, `text/plain`,
99 details, 5 lessons, the Arabic teacher label `ممتاز`, the same `attemptId` as the stored
attempt), that a refresh does **not** resend a delivered result, that a new attempt clears the
stored one, that no page error is raised, that **no external request** is made (the Google
Sheets endpoint and the WhatsApp link are the only absolute URLs, and the Sheets POST is
intercepted by Playwright — nothing reaches the live sheet), and that the published
`dist/index.html` behaves the same with the local Cairo font really applied.

Running it needs a Chromium binary:

```sh
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

The Playwright CDN (`cdn.playwright.dev`) is **not** reachable from this sandbox, so the
binary used here was taken from the npm package `@sparticuz/chromium` (Chromium 153) instead
of the Playwright download host. The test itself only depends on `playwright-core` (already in
`devDependencies`) and on whatever `CHROMIUM_PATH` points to.

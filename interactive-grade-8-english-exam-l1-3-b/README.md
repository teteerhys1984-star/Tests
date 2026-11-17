# Interactive Grade 8 English Exam L1-3 B

Standalone Grade 8 · Semester 1 · English interactive examination (`interactive-grade-8-english-exam-l1-3-b`, Model B).

- **Published folder / `EXAM_ID`:** `interactive-grade-8-english-exam-l1-3-b`
- **Displayed title / `EXAM_TITLE`:** `Interactive Grade 8 English Exam L1-3 B`
- **Original source folder:** `../interactive-grade-8-english-exam-L1-3 B` (unmodified, excluded from platform builds, never imported at runtime)
- **Independence:** Shares no files, runtime imports, `EXAM_ID`, `attemptId`s, or `localStorage` keys with `interactive-grade-8-english-exam-l1-3-a` (Model A) or any other exam on the platform.

---

## 1. Content & Mark Audit (Source Parity)

`src/data/exam.ts`, `src/assets/hero.jpg`, and `src/assets/journey.jpg` are **byte-for-byte (SHA-256) identical** copies of the corresponding files in `../interactive-grade-8-english-exam-L1-3 B`. All questions, passages, instructions, options, and marks are preserved intact.

| Lesson | Questions | Answerable Parts | Marks |
|---|---:|---:|---:|
| Lesson 1 — Future Plans | 10 (Q1–Q10) | 14 | 33 |
| Lesson 2 — School Challenges | 10 (Q11–Q20) | 19 | 34 |
| Lesson 3 — Let’s Discover | 10 (Q21–Q30) | 14 | 33 |
| **Total** | **30** | **47** | **100** |

- **Question structure:** 16 single-part questions + 14 multi-part questions (Q3, Q6, Q7, Q8, Q11, Q12, Q13, Q14, Q16, Q17, Q21, Q23, Q26, Q29). Every part carries an independent mark (1–4 marks), so multi-part questions award exact partial credit.
- **Part types (47 total):**
  - `choice`: **22** parts — **20** multiple-choice + **2** True/False (Q5, Q24)
  - `text` (inline fill-in-the-blank): **21** parts
  - `longtext` (extended short-answer / reported speech): **4** parts (Q1, Q21a, Q21b, Q30)
- **Reading passages (2):**
  1. *Schools in the Past, Present and Future* (Lesson 1 · Student’s Book p. 7) — illustrated with bundled `hero.jpg` (288,793 bytes)
  2. *My Amazing Journey* (Lesson 3 · Student’s Book p. 21) — illustrated with bundled `journey.jpg` (328,151 bytes)
- **Media & fonts:** Start and submit chimes are synthesised locally via the Web Audio API (no external audio/video files). Original external Google Fonts (`Archivo Black` / `Nunito`) were replaced with bundled local `Cairo` WOFF2 files (Latin, Latin-Ext, Arabic) inlined into the single-file `dist/index.html` build.

---

## 2. Source Issues Found, Technical Fixes & Preserved Educational Notes

### A. Technical & grading bugs fixed outside `src/data/exam.ts`

1. **Unanswerable fill-in-the-blank parts in Q3 (`q3p1`, `q3p2`) and Q23 (`q23p1`, `q23p2`) — fixed in `src/lib/grading.ts` (`splitTextStem`) and `src/components/ExamScreen.tsx`:**
   - The original `ExamScreen.tsx` split `kind: "text"` stems solely on `"[[blank]]"`. However, Q3a (`"Complete: …………… vehicles instead of school buses."`), Q3b (`"Complete: …………… teachers instead of humans."`), Q23a (`"During the ……………-day trip we visited various ancient sites and old markets."`), and Q23b (`"We bought nice …………… for our friends."`) use repeated ellipsis runs (`……………`) without `"[[blank]]"`. As a result, the source UI rendered **zero `<input>` controls** for those four parts (8 marks total) and kept `Submit Exam` permanently locked.
   - `splitTextStem` renders an inline `<input>` for `"[[blank]]"` first, and otherwise splits repeated ellipsis runs (`/…{2,}/`) while preserving single continuation ellipses (`…`) used in Q11, Q12, and Q17. `src/data/exam.ts` remains untouched.

2. **Wrong answer index on Q4 (`q4p1`, 2 marks) — fixed via `CHOICE_ANSWER_OVERRIDES` in `src/lib/grading.ts`:**
   - In `src/data/exam.ts`, Q4 (`"Before the 21st century, technology was …………… it is used today."`) reorders Student’s Book p. 8 · Reading B options to `["used less than", "used the same as", "never used as"]` but leaves `answer: 1` (`"used the same as"` — the textbook’s original option `b` before reordering). This contradicts both the Lesson 1 passage (`"there were no computers or Internet as we have today"`) and Q4’s own explanation (`"Before the 21st century there were no computers or Internet, so technology was used less than it is used today."`).
   - `CHOICE_ANSWER_OVERRIDES = { q4p1: 0 }` binds grading, student review, the TXT report, the Teacher Area key, and the Google Sheets payload to `options[0]` (`"used less than"`) without editing `src/data/exam.ts`.

3. **Misleading `"passed"` label on the results ring — fixed in `src/components/Results.tsx`:**
   - The source displayed the static caption `"passed"` beneath every percentage (even `0%`). Replaced with `"Score"` plus the platform’s standard Arabic grade band (`ممتاز` / `جيد جداً` / `جيد` / `مقبول` / `ضعيف` / `يحتاج إلى دعم`).

4. **Accessibility, persistence, offline fonts & platform delivery — fixed in UI/lib layers:**
   - Added `role="radiogroup"` to True/False items, replaced external Google Fonts links with local bundled Cairo fonts, added synchronous `localStorage` persistence of answers and current question index with fully isolated `EXAM_ID`-prefixed keys, added a submission-completeness guard in `App.tsx`, enforced strict hiding of the Teacher Area during active student attempts, and implemented the `grade5-math-unit1` Google Sheets submission/retry/pending-queue contract with live status feedback and a manual **Resend result** button.

### B. Pedagogical & wording quirks in `src/data/exam.ts` documented (not silently altered)

- **Q16 (`q16p1`, `q16p2`), Q17 (`q17p1`, `q17p2`), and Q18 (`q18p1`) — omitted bracketed verb cues & printed `"came"`:**
  - Adapted from Workbook p. 8 · Grammar B, Q16 and Q18 instruct students to *"Write the verb(s) in brackets in the correct tense"*, and Q17 instructs *"Complete the two verb forms in one sentence"*, but the source stems omit the textbook’s bracketed base verbs `(go)`, `(walk)`, `(eat)`, and `(have)`. In addition, `q17p2` retains the textbook’s printed word `"came"` right after the blank (`"… John [[blank]] came."`, answer `"came"`). Preserved verbatim as authored in `src/data/exam.ts`.
- **Q12 (`q12p1`–`q12p3`) — shared word bank with Q11:**
  - Q12’s instruction (*"Finish the same story with the remaining verbs."*) continues the seven-verb paragraph started in Q11 (`was carrying, was wondering, came, was walking, decided, came up, stood`) without repeating the word list; students can step back to Q11 freely via Previous or the Question Navigator.
- **Q15 (`q15p1`) — `"went"` vs `"was going"`:**
  - Q15 (*"I (was going – went) home when I met my friend."*, Student’s Book p. 14) keys `answer: 1` (`"went"`), matching both Q15’s own explanation and the curriculum page’s derived key for SB p. 14, even though standard English usage (and parallel Workbook p. 8 B item 5 *"I (drive) [was driving] home when I met my friend"*) typically favours the past progressive for an interrupted background action. Because `answer: 1` is internally consistent with Q15’s explanation and curriculum source, it is preserved unchanged and noted here for teacher review.
- **Q10 explanation wording:** Refers to the three distractors as *"habits and facts (whenever, usually, next week)"*; the third distractor (*"They visit The National Museum next week."*) is a present-simple form paired with a future time expression (drawn from Q6b’s bracket exercise). Does not affect the unambiguous correct answer (*"Mom is making dinner now."*).
- **Q20 & Q30 minor prompt wording:** Q20 says *"Correct the underlined form"* and identifies the target explicitly with `(printed: was being)` rather than underlining. Q30’s instruction says *"Correct the reported sentence (change the underlined verb into the reported form)"* while its prompt provides the direct speech (*`Sean: "Max doesn't like scary movies."`*) and asks for the reported sentence after `"Sean told me (that) …"`. Both remain clear and grade accurately.
- **Typed-answer matching scope:** Following the source, `text` items use normalised exact matching and `longtext` items (Q1, Q21a, Q21b, Q30) use normalised key-phrase substring matching (`mode: "includes"`), ignoring case, apostrophes, quotes, and leading/trailing punctuation. Free paraphrases outside the listed phrases are not semantically graded.

---

## 3. Storage Isolation, Teacher Gate & Google Sheets Contract

- **Isolated `localStorage` keys:**
  - `interactive-grade-8-english-exam-l1-3-b-attempt-v1`
  - `interactive-grade-8-english-exam-l1-3-b-report-v1`
  - `interactive-grade-8-english-exam-l1-3-b-previous-report-v1`
  - `interactive-grade-8-english-exam-l1-3-b-muted-v1`
  - `pending:interactive-grade-8-english-exam-l1-3-b:<attemptId>`
- **Teacher Area:** Available only on Welcome and Results (never during an active attempt), unlocked with `somer173`. Explicitly disclosed as a cosmetic client-side classroom convenience gate, not real authentication or security.
- **Google Sheets contract (`grade5-math-unit1` reference):** `POST` with `Content-Type: text/plain;charset=utf-8` to the existing Apps Script endpoint, 12-field payload (`token`, `attemptId`, `examId`, `examTitle`, `studentName`, `startAt`, `submitAt`, `elapsedSec`, `summary`, `lessons`, `details`, `reportText`), up to 3 attempts with 2 s then 5 s delays, 30 s per-attempt timeout, stable `attemptId` across retries and manual resends, automatic retry of local pending payloads on load, and non-blocking results/TXT report download. All automated tests use **Mock Fetch only** and never send real network requests.

---

## 4. Development & Verification

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run verify:build
```

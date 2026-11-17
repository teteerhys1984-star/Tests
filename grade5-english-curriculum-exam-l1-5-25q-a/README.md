# Grade 5 English Curriculum Exam L1-5 (25Q) A

Standalone electronic exam published under `grade5-english-curriculum-exam-l1-5-25q-a/` from the audited source in `grade-5-english-curriculum-exam-L1-5 (25Q) A/` (which remains untouched).

## Identity & Metadata

- **Display Title:** `Grade 5 English Curriculum Exam L1-5 (25Q) A`
- **Folder & `EXAM_ID`:** `grade5-english-curriculum-exam-l1-5-25q-a`
- **Grade / Subject / Semester:** Grade 5 · English · Semester 1
- **Curriculum Scope:** Unit 1 — Lessons 1 to 5 (*At School*, *Family*, *Daily Routines*, *The Five Senses*, *Clothes*)
- **Source Folder (preserved untouched):** `grade-5-english-curriculum-exam-L1-5 (25Q) A`

## Audited Structure (`src/data/exam.ts`)

`src/data/exam.ts` is byte-identical to `grade-5-english-curriculum-exam-L1-5 (25Q) A/src/data/exam.ts`.

- **Main questions:** 25 (`q01`–`q25`), interleaved so no two adjacent questions belong to the same lesson.
- **Marks per question / Total:** 4 marks per question = **100 marks** total.
- **Lessons:** 5 questions (20 marks) per lesson across Lessons 1–5.
- **Sub-items:** **98** total sub-items:
  - Lesson 1 (*At School*): 18 sub-items (4 questions × 4 × 1-mark + `q18` with 2 × 2-mark `order` items)
  - Lesson 2 (*Family*): 20 sub-items (5 questions × 4 × 1-mark)
  - Lesson 3 (*Daily Routines*): 20 sub-items (5 questions × 4 × 1-mark)
  - Lesson 4 (*The Five Senses*): 20 sub-items (5 questions × 4 × 1-mark)
  - Lesson 5 (*Clothes*): 20 sub-items (5 questions × 4 × 1-mark)
- **Item kinds:** `40 text`, `48 mc`, `8 tf`, `2 order` (`0` rubric / manual-marking items).
- **Reading passages:** 2 (`PASSAGES.A` used by `q04` and `q19`; `PASSAGES.B` used by `q12`).
- **Tables:** 3 (`q01`, `q09`, `q13`).
- **Audio / External image dependencies:** 0 audio items; 0 external question image dependencies (`q22` represents the skirt options textually).

## Documented Source Contradictions & Educational Quirks (Preserved Verbatim)

Per policy, educational texts, prompts, answers, accepted alternatives, and explanations from `grade-5-english-curriculum-exam-L1-5 (25Q) A/src/data/exam.ts` were **not** rewritten, shortened, or silently altered:

1. **`q07` & `q08` instructions vs. item type:** `q07` instructs `"Write each time in numbers."` and `q08` instructs `"Write the number that shows where each sentence belongs in the conversation, from 1 to 4."`, while all 8 sub-items (`q07a`–`q07d`, `q08a`–`q08d`) are rendered as multiple-choice (`kind: "mc"`).
2. **`q09b` table vs. answer key:** The table in `q09` lists `Basic / primary: Grades 1–9` and `Secondary: Grades 10–12`, while `q09b` asks `"Anna is 13 years old. She is in the __________ school."` and expects `"secondary"` (`explain`: `"Thirteen is secondary school age (Grades 10–12 band)."`), even though 13-year-olds in the Grades 1–9 basic/primary band fall under `Basic / primary` in the table.
3. **`q12b` reading comprehension inference:** Reading Text B (`PASSAGES.B`) states `"We can touch things that are soft or hard."` and `"We smell flowers and perfumes."`, while `q12b` (`"We can touch flowers."` → `True`) relies on real-world inference rather than an explicit statement in Text B.
4. **`q12c` literal Markdown in `explain`:** `explain` contains literal `**or hard**` (`"The text says we can touch things that are soft **or hard**."`).
5. **`q14` instruction vs. `q14d` & `q14a`:** The instruction reads `"Complete the negative sentences of the present continuous."`, yet `q14d` is a question (`"__________ he wearing a red sweater?"` → `"Is"`), and `q14a` (`"I’m __________ wearing shorts."`) lists `"n't"` and `"nt"` in `accept` alongside `"not"` even though `"I'm"` already precedes the blank.
6. **`q16c` prompt vs. `accept`:** Prompt already contains `"a white __________"` (`"She’s wearing a blue jacket, a blue skirt, a white __________ and grey shoes."`), while `accept` includes `"a white shirt"` and `"shirts"` alongside `"shirt"`.
7. **`q21` instruction vs. `q21a`:** Instruction reads `"Complete each sentence with one word from the lesson."`, while `q21a` expects the two-word phrase `"have to"`.
8. **`q25c` & `q25d` subject agreement in `accept`:** Prompts use first-person singular `"I"` (`"I usually __________ the table."` and `"I always __________ at nine o’clock."`), while `accept` includes `"sets"` and `"sleeps"` alongside `"set"` and `"sleep"`.

## Technical Fixes & Platform Alignment Applied Outside `exam.ts`

1. **Critical `mc` punctuation grading fix (`src/lib/grading.ts`):** The source `isCorrect()` passed `mc` options through `norm()`, whose `.replace(/[.!?;,]+$/g, "")` turns `"."`, `","`, and `"?"` all into `""`. Consequently, in `q16d` (`options: [".", ",", "?"]`, `answer: "?"`), wrong choices `"."` and `","` were marked correct in the source! Published `isCorrect()` grades `mc` by trimmed, case-insensitive exact match (normalizing typographic apostrophes) without stripping punctuation, so only `"?"` is marked correct while typed `text` answers still forgive trailing punctuation.
2. **Teacher Answer Key entry points:** Source `App.tsx` omitted `onOpenTeacher` on `StartScreen` even though `StartScreen` accepted the prop. Published `ContactStrip` exposes `Teacher Answer Key` on both `StartScreen` and `ResultScreen` (behind password `somer173`), while keeping it completely inaccessible during an active attempt.
3. **Google Sheets Delivery Contract (`src/config.ts`, `src/lib/submit.ts`):** Matched verbatim to `grade5-math-unit1` and the Grade 5 English exams (`SHEETS_URL`, `SHEETS_TOKEN` unchanged; `EXAM_ID = "grade5-english-curriculum-exam-l1-5-25q-a"`; `POST` with `Content-Type: text/plain;charset=utf-8`, `redirect: "follow"`, 3 retries at `2000ms` / `5000ms`, `30000ms` per-attempt timeout, stable `attemptId`, `pending:<EXAM_ID>:<attemptId>` queue, `sent:<EXAM_ID>:<attemptId>` duplicate receipt prevention, and platform `gradeLabel` scale `95/85/75/65/50`).
4. **Offline/Platform Standards:** Embedded local Cairo WOFF2 fonts (`src/assets/fonts/`, no external Google Fonts request), `base: "./"` and `server: { host: "0.0.0.0" }` in `vite.config.ts`, `overflow-x: clip` to preserve sticky header without horizontal overflow, and isolated storage keys (`grade5-english-curriculum-exam-l1-5-25q-a-attempt-v1`, `grade5-english-curriculum-exam-l1-5-25q-a-muted-v1`).

## Verification Commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

# Verification Report — `grade-7-physics-l1-l2-problems`

## 1. Exam Scope & Structure
- **Exam ID**: `grade-7-physics-l1-l2-problems`
- **Title**: مسائل الدرسين الأول والثاني (`الصف السابع · الفصل الأول · الفيزياء`)
- **Added Date Metadata**: `<meta name="exam-added-at" content="23-11-2026" />` and `landing/exams.json` `addedAt: "23-11-2026"`
- **Questions / Subparts / Total Marks**: 20 problems (10 Motion & Rest = 50 marks, 10 Force & Motion = 50 marks), 48 total interactive subparts, 100 total marks.
- **No Premature Answer Leaks**:
  - Active exam screen renders scenes without solutions; `ProblemFigure` (`EarthMoonScene`) accepts `maskAnswers={true}` so `f2` displays `? N` during the active exam instead of revealing `900 N` and `145.8 N`.
  - Solutions and teacher performance reports remain protected inside `TeacherGate` (`TEACHER_PASSWORD = "somer173"`).
  - LaTeX backslash escapes in `m1`, `m7`, and `f7` `teacherNote` entries were fixed in `src/content/problems.ts`.

## 2. Automated Verification
- **Exam unit & contract tests** (`cd grade-7-physics-l1-l2-problems && npm test`): **8 / 8 passing**
  - Spec totals (20 problems, 48 subparts, 100 marks = 50 + 50)
  - Grading normalization (Arabic-Indic digits, decimal comma, `HH:MM:SS`, clock `صباحاً`/`ص`, unit stripping)
  - Four-status classification (`correct`, `partial`, `wrong`, `unanswered`)
  - `localStorage` isolation by `EXAM_ID`
  - TXT report completeness and clean `teacherNote` formatting
  - Google Sheets payload contract (`PayloadSummary` including `wrongQuestions = wrong + unanswered`), `POST` `text/plain;charset=utf-8`, `[2000, 5000]` retry schedule, and `pending:` flush on reload
- **Typecheck & Singlefile Production Build**:
  - `npm run typecheck`: 0 TypeScript errors
  - `npm run build`: Singlefile `dist/index.html` (`3,232.01 kB`), fonts bundled locally via `@fontsource/ibm-plex-sans-arabic` and `katex`.
- **Platform & Landing Tests**:
  - `python3 landing/tests/test_generate.py`: **44 / 44 passing** (against real built `_site`)
  - `python3 landing/tests/test_build_exams.py`: **6 / 6 passing** (`physics-7th-l1&l2-problems` excluded in both `.github/workflows/deploy.yml` and `landing/scripts/build-exams.sh`, source folder untouched)
  - `node landing/tests/gate.test.mjs`: **10 / 10 passing**
  - `python3 landing/scripts/verify-site.py _site`: All checks for `grade-7-physics-l1-l2-problems`, all 42 cards, `23-11-2026` badge (with zero literal `"Date"` text), Cairo typography, RTL, Western digits, and gate passed (only pre-existing unrelated warning/failure on legacy `grade-4-english-curriculum1n5-exam-23-11-2026`).

## 3. Headless Chromium End-to-End & Visual Verification
Verified at `1366x900` and `390x844` via headless Chromium against built `_site` with mocked Google Sheets endpoint (no live student rows written):
- Landing page unlocked with gate password shows `مسائل الدرسين الأول والثاني` under Grade 7 / Semester 1 / Physics with `23-11-2026` badge and zero `"Date"` text, and excludes `physics-7th-l1&l2-problems`.
- Welcome screen, student name entry (`حلا الأحمد`), `localStorage` persistence across reload, `f2` `? N` figure masking during active exam, review screen (`4/48` answered), mock-fetch Google Sheets submission (`6.5 / 100`), results breakdown, TXT download trigger, teacher gate (`somer173`), teacher performance report, and teacher model solutions all verified with 0 JS console/page errors and 0 horizontal overflow.

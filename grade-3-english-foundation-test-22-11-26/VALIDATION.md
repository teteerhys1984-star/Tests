# Validation record

## Baseline and scope

- Base/latest fetched main: `e82e4945343fe499569885044eae0a08cd4358fd`.
- Session branch: `arena/ab642d58-tests`; already based on latest main (0/0 divergence).
  The Arena session requires using this branch, not creating/switching branches.
- Checked all open PRs: none. Checked recent closed PRs explicitly, not assumed merged.
- Inspected source file inventory (25 files), question data, source UI, storage,
  grading, generated Web Audio, reports, teacher gate, config, tests and lockfile.
- Compared reference math delivery and prior Grade 3 English exam delivery/builds.
- Original source and all previous exam folders remain unchanged in Git.
- Only shared changes: precise source-folder exclusion in both build loops and
  one exam override in `landing/exams.json`; all previous exclusions preserved.

## Content and marking

- 20 main questions; 5 parts each; 100 parts; 100 marks.
- Deep equality against imported original QUESTIONS, including contexts,
  choices, word pools, answers, accepted alternatives, explanations and marks.
- Every accepted answer checked, every part checked with a wrong answer.
- Full paper: 100/100. Blank paper: 0/100. Mixed first question: 2/5.
- Text, choice, matching and word ordering covered; source has no multi-select.
- Correct case-sensitive capitalization objective for 15a; its/it's stay distinct.

## New exam checks

- `npm test`: 23 passing tests across 3 files.
- `npm run build`: TypeScript strict/noEmit + Vite single-file production build pass.
- Save/restore includes name, attemptId, answers, navigation, start/submission
  timestamps, elapsed snapshot and status. Corrupt JSON recovery verified.
- Storage isolation and unrelated keys surviving reset/queue flush verified.
- UI start/navigation/remount/review/edit/confirm/results and teacher gate verified.
- Offline result and TXT availability verified; manual resend uses the same ID.
- Delivery entirely Mock Fetch: field schema, 100 detail rows, lesson totals,
  headers, 3 retries, 2/5 second waits, 30-second timeout (even ignored abort),
  queued retry, concurrent deduplication and duplicate acknowledgement verified.
- TXT Blob/download and complete report equality with payload verified.
- Full and production `npm audit`: zero vulnerabilities in the new exam.
- `tests/verify-site.py`: unique correct grade/semester/subject, relative Pages URL,
  no source link, matching title, EXAM_ID, self-contained JS/CSS, exact deployed copy.

## Platform and regression

- Entire `landing/scripts/build-exams.sh` passed: 37 standalone exam folders.
- Landing generated successfully; final new-exam build copied into assembled site
  using the same index-only copy as deployment, and verified byte for byte.
- `python3 landing/scripts/verify-site.py _site`: all **478** checks passed.
- `python3 landing/tests/test_generate.py`: **41 passed**, no skips after full build.
- `node landing/tests/gate.test.mjs`: **10 passed**.
- Existing Grade 3 English A: **73 passed**, typecheck + verify:build pass.
- Existing Grade 3 English B: **50 passed**, typecheck + verify:build pass.
- Existing Grade 3 English curriculum L1–L5: **103 passed**, typecheck + verify:build pass.
- Regression tests were rerun with `--testTimeout=30000`: the initial parallel
  build/test load caused one existing B workflow to exceed its default 5-second
  timeout; it passes with the test-runner timeout increased, without file edits.
- Existing Mira: **43/44 passed**. The lone failure is its outdated landing test
  in `tests/build.test.mjs:59` expecting `view-exams-3-english` rather than the
  current `view-exams-3-s1-english`. Reproduced on an isolated `git archive
  origin/main` baseline: same failure, 2/3 build tests pass there. Not changed.

## Warnings and limits

- No real Google Sheets request was sent; real endpoint connectivity/server
  behaviour is intentionally not tested. URL/token/Apps Script unchanged.
- No Chromium/browser installed. DOM interactions are tested with jsdom, but
  actual mobile/desktop visual rendering, browser console, audio playback and
  physical download to a browser's filesystem were not manually verified.
  Responsive breakpoints, touch sizes, viewport meta and overflow wrapping are
  provided; external font dependency removed. No missing runtime asset files.
- Existing L1–L5 tests emit jsdom play/scroll/navigation and React act warnings;
  their assertions pass. Existing projects also report npm audit advisories in
  the full build; none of those dependencies were changed by this PR.
- Browser storage disabled/full means persistence cannot be guaranteed; rendering,
  marking, downloading and sending still work in memory (storage access is guarded).
- Teacher password is client-side convenience gating, not secure authentication.
- Google Pages publication will occur only after reviewer merges; PR left open.

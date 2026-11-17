# Verification record

## Baseline and scope

- Fetched `origin/main` before work and re-fetched before PR preparation: `ed884358d34aad0ec161f55db52ae41cff64f617` (unchanged).
- Checked recent PR state with `gh pr list --state all`: PRs #18–#32 are merged; checked open PRs separately: none before this addition.
- Used the fixed Arena working branch `arena/c6f2c80b-tests`, already based on that latest main. Did not create/switch branches or work on main.
- Source upload remains unchanged. Existing exam directories remain unchanged. Global landing password gate and Cairo assets/styles remain unchanged.

## Source audit

Inspected the complete file inventory, README, data, engine, UI, CSS, configuration, lockfile/package metadata, original unit/browser tests, font licenses and image. Source builds and its eight unit tests pass. Its browser suite also passed with an alternate compatible Chromium obtained from npm; normal Playwright CDN installation was blocked by sandbox networking.

- 50 questions; ten per lesson; 100 marks; 20 per lesson; 2 per question.
- All eight reading passages, mixed question order, options, answer keys, accepted alternatives, explanations and references preserved byte-for-byte apart from importing the restored clock asset.
- Original independent 50-question answer audit retained. Added exhaustive per-part checks: each part alone earns its allocated marks, every distractor is rejected, blanks earn zero, accepted alternatives work. Full/zero/partial results and lesson totals checked.
- Source is missing one referenced clock and three font binaries. Restored the clock from its documented curriculum commit, visually checked the fourth clock as 4:00, and restored the fonts from Fontsource. Assets are embedded in production HTML.
- No audio files supplied: original start/end chimes are generated locally with Web Audio, checked through browser instrumentation; actual speaker output was not assessed.
- Original Lesson 1 textbook-scan limitation remains disclosed. This change establishes parity with the supplied exam, not a new independent certification against absent textbook scans.

## Executed checks

| Check | Actual result |
| --- | --- |
| Source `npm ci`, `npm run build`, `npx vitest run`, `npx tsc --noEmit` | Pass; 8 tests. Original build reports missing-font warnings, repaired only in the new exam. |
| Source browser suite | Pass: teacher gate, all 50 questions, required parts, 100/100, recovery, report, start/end chimes, restart, cross-tab protection, phone/tablet layouts. |
| New exam `npm ci` | Pass; audit reports zero vulnerabilities for this project. |
| New exam `npm test` | 15 tests pass across 2 files. |
| New exam `npx tsc --noEmit` | Pass. |
| New exam `npm run build` | Pass; single HTML ~3.84 MB, no unresolved-asset warnings. |
| New exam `tests/browser.mjs` | Pass: all 50 questions completed via UI, 100/100, all lesson scores, TXT download, refresh/recovery, teacher gate, cross-tab protection, layouts at 1440/768/390/320 widths. |
| New exam `tests/production.mjs` | Pass against actual `_site/<exam-id>/` path: embedded images and fonts load; no external asset requests; result visible during failure; 3 mocked failed attempts; local queue retained; manual resend succeeds with same attemptId; queue clears; receipt prevents refresh resend; zero page/console errors. |
| Mock unit delivery checks | Pass: complete payload, POST/header, full/partial/blank counts, 2/5-second retry delays, malformed response, timeout/abort, unavailable storage, local queue recovery and duplicate acknowledgement. |
| `bash landing/scripts/build-exams.sh` | Pass: all 27 published exams built with npm ci + production build. Source folders excluded; prior exclusions retained. |
| `python3 landing/generate.py _site` | Pass: 27 exams; new card under Grade 4 → Semester 1 → English with exact title and folder link. |
| `python3 -m unittest discover -s landing/tests -v` | 38 pass, including real built-site placement/exclusion checks. |
| `node --test landing/tests/gate.test.mjs` | 10 pass. |
| Existing projects with npm test scripts | Ran all 24 published pre-existing projects: 22 project suites pass; 2 fail as described below. |
| Grade 5 math (no test script) | Bundled and executed logic, submit and workflow tests using esbuild: all three pass. |
| Grade 8 chemistry (no test script) | Bundled/executed logic tests: 90/90 pass; submit tests with documented React externals: 84/84 pass. An initial generic bundle failed due to bundled CommonJS React server internals; rerunning the documented command passed. |
| `git diff --check` | Pass. |

### Pre-existing failures confirmed against clean main

Exported the affected exam directories and `landing` from `origin/main` with `git archive` into a separate temporary directory; reused identical installed dependencies; ran their build/test commands there. Both produce the same failures before this change:

1. `grade3-english-grammar-mira`: 43/44 pass. Its legacy landing assertion expects `view-exams-3-english`, without the now-required semester segment. Same assertion fails on clean main.
2. `grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2`: question/grading baseline checks pass; its TXT-report baseline comparison fails. Same report comparison fails on clean main.

Did not change these unrelated tests or their exams to conceal the failures. Some older build audits report existing dependency vulnerabilities, and the geometry/algebra jsdom suite emits its existing canvas-not-implemented warning despite exiting successfully. The new exam browser runs report zero console/page errors; that claim does not extend to those unrelated legacy test logs.

## Safety and limits

Every Google submission in verification used injected Mock Fetch or intercepted Playwright routes. No real student data or test payload was sent to Google Sheets. No Apps Script or token setting was changed. No merge or live Pages deployment was performed. Local production tests cover the deployed URL structure, not the eventual public GitHub Pages deployment after merge.

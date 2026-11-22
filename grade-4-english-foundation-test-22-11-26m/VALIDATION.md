# Validation (2026-11-22)

All development submissions used mock fetch only, with synthetic data; no real
Google Sheets request was sent. Regression commands were run with a fail-closed
`fetch` preload to prevent accidental external submissions. Some existing suites
explicitly route fetch to a local HTTP mock server, so that guard prevents those
cases from passing; they were **not** rerun with unguarded fetch.

## New exam

- `npm ci`, `npm run typecheck`, `npm run build`: passed. Build is a single
  self-contained `dist/index.html` (497,293 bytes).
- `npm test`: **27/27** passed across 3 Vitest files. Includes field-by-field
  source data comparison, all 100 correct keys and alternatives, source order
  keys, full/empty and partial grading, punctuation/spacing/case/apostrophes,
  wrong answers, multi-word chips, save/restore and isolation, review/edit,
  teacher gate and student's detailed corrections, TXT, mocked Sheets payload,
  retries, timeouts, queue, duplicate and same-attempt resend.
- Actual source: 20 questions, 100 parts and 100 marks; 1 mark per part.
  Source asset compared byte-for-byte; `git diff HEAD` confirms source untouched.
- Persistence keys: `grade-4-english-foundation-test-22-11-26m:attempt:v1`,
  `grade-4-english-foundation-test-22-11-26m:muted`,
  `grade-4-english-foundation-test-22-11-26m:sent:<attemptId>`, and
  `pending:grade-4-english-foundation-test-22-11-26m:<attemptId>`.

## Platform

- Full deploy-style `landing/scripts/build-exams.sh`: **38 exam folders built**;
  final new exam rebuilt following the teacher review refinement and copied via
  the same index-only deployment step.
- `python3 landing/generate.py _site`: 38 exams. New entry occurs exactly once
  under Grade 4 / Semester 1 / English; source folder excluded.
- `landing/scripts/verify-site.py _site`: **486/486** checks passed.
- `tests/verify-site.py`: passed (exact categorisation, unique link, standalone
  bundle and byte-identical deployment copy).
- `landing/tests/test_generate.py`: **41/41** passed.
- `landing/tests/gate.test.mjs`: **10/10** passed.
- `landing/tests/test_build_exams.py`: **6/6** passed. The pre-existing source
  exclusion for `english-foundation-test-22-11-26MI` was missing from this test's
  expected exclusions; synchronising that list fixes its baseline parity failure
  without changing deployment behaviour for that folder.

## Regression results

All published projects with `npm test` were attempted, with fetch fail-closed.
The four English Grade 4 suites: A **15/15**, B **59/59**, Mahmoud **60/60**;
L1–L5 **72/76**, with four local-HTTP-mock cases blocked by the safety guard.
The previous Grade 3 foundation suite passed **23/23**.

The following suites passed: Grade 5 Math 21-11 A (129), B (178); Grade 8
Science (56); Grade 3 English A (73), B (50 after increasing its test timeout to
30 seconds; first run 49/50 timed out), Grade 5 Arabic exam (46), Arabic grammar
(25), Arabic grammar pattern 3, Arabic U1–U2 and its pattern 2, Grade 5 English
25Q A (48), A (99), B (123); Grade 8 algebra, English L1–L2 (41), English L1L2
(52), Physics exam 2 (62), Physics U1 L1L2, and interactive English A (14) and B
(26). Counts are shown when reported by the suite.

The following suites were not fully green:

- Grade 3 English L1–L5: **100/103**; three local-HTTP-mock cases blocked.
- Grade 3 English Mira: **43/44**; existing landing assertion expects the old
  `view-exams-3-english` id, rather than the semester-aware id. This same failure
  was documented in the previous Grade 3 foundation validation against main.
- Grade 4 Adam: submission 141 pass/4 fail, workflow 31 pass/3 fail; its local
  HTTP mock is blocked. Adam 2: q08a 56/61, submission 145/149, workflow 34/37;
  failures also depend on its blocked local HTTP mock.
- Grade 5 Arabic grammar pattern 2: data 7 pass/1 fail (report baseline mismatch);
  its runner stops there. Separate mocked-submit and independence suites passed.
  This report failure is in untouched existing files and was not investigated to
  a root cause.
- Grade 6 Mia: submission 141/145 and workflow 67/92; Mia 2: 147/151 and 68/92;
  local HTTP mock calls blocked by the safety guard.
- Grade 7 Physics: submission 110 pass/1 fail; local HTTP mock blocked.
- Grade 8 English L3–L4: **61/64**; three local-HTTP-mock cases blocked.
- Grade 8 Geometry: 4 submission contract assertions fail with local HTTP mock
  blocked; the other workflow checks pass.

No source exam or existing published exam was modified. Tests that depend on a
local HTTP mock are not proof of a product regression: the deliberately blocked
fetch prevented their local test transport. GitHub Actions/Pages have not yet run
for the PR; no real browser/mobile visual, audio, or physical file-download test
was performed (jsdom interactions and generated TXT were tested). Client-side
teacher password is convenience gating, not secure authentication.

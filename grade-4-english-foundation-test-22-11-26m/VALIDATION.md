# Validation (2026-11-22)

## PR #44 final follow-up: clean-main comparison and local-only regressions

On 2026-11-22, `origin/main` was fetched at
`d2b3c90e3ebfe80e4c68037cb251364af9ea2af2`; PR head was
`42a8c255e78a300f61d385525d29c68048931505`. A clean copy of tracked main files
was extracted with `git archive origin/main | tar -x -C /tmp/pr44-main-clean`.
For the two comparisons, only their already-installed `node_modules` were
symlinked into this copy; tracked test, source and landing files came from main.
Both sides ran with the same Node v22.22.3, `TZ=UTC`, local-only guard and clock.
`git diff origin/main -- grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2 grade3-english-grammar-mira landing/generate.py` was empty.

- **Grade 5 Arabic Grammar Pattern 2:** `npm test` on both main and PR exited 1
  with exactly the same output: the data suite has 7 passing checks and fails
  `report identical to baseline except title/subtitle/privacy lines`. The
  two output logs had the identical SHA-256
  `b8323f58ca462d30b1cef112bf588b45399bda072ccd7781daabbf24af91b306`.
  Independently comparing the generated full report to the fixture after the
  test's own normalization showed one difference among 801 lines: line 800 was
  `زهرة المعرفة — 22‏/11‏/2026` at runtime versus
  `زهرة المعرفة — 15‏/11‏/2026` in the fixture. The report uses the current
  date; the old comparison does not normalize that footer. Thus the failure is
  reproducible on main, not caused by this PR. Because `npm test` stops at the
  first failure, `node tests/run.mjs submit` and `node tests/run.mjs independence`
  were also run separately on the PR: both passed.
- **Grade 3 English Mira:** `npm test` on both main and PR exited 1, with
  **43/44** passing and the same failing `build.test.mjs` landing assertion.
  That old test expects `view-exams-3-english`, whereas the landing generator
  uses the semester-aware `view-exams-3-s1-english`. No old test was edited.

The cases previously blocked by the all-fetch guard were rerun with the
Node-only preload `tests/local-only-guard.cjs`. It allows loopback fetch/sockets
and denies non-loopback fetch/sockets, DNS resolution of external names and UDP;
Node child processes inherit it through `NODE_OPTIONS`. A self-check verified a
local HTTP response, rejection of an external Sheets fetch, rejection of an
external socket, and rejection of a local redirect to script.google.com. No
blocked calls occurred during the actual test suites. The guard is an in-process
Node restriction, not an OS-level firewall; `unshare -n` was unavailable, and
non-Node native child processes are not covered by this preload. The test
servers and test payloads were local/synthetic; no real student data or Sheets
submission was sent.

Reproduction from the repository root (repeat the last line per listed suite):

```sh
export TZ=UTC
export NODE_OPTIONS="--require=$PWD/grade-4-english-foundation-test-22-11-26m/tests/local-only-guard.cjs"
(cd grade4-english-curriculum-l1-l5 && npm test)
```

All previously HTTP-blocked suites now passed:

| Suite | Result |
| --- | --- |
| Grade 4 English L1–L5 | 76/76 |
| Grade 3 English L1–L5 | 103/103 |
| Grade 4 Adam | all 4 files passed (grading 34, submit 175, workflow 108 checks) |
| Grade 4 Adam 2 | all 4 files passed (grading 53, q08a 61, submit 179, workflow 112 checks) |
| Grade 6 Mia | all 3 files passed (grading 47, submit 175, workflow 92 checks) |
| Grade 6 Mia 2 | all 3 files passed (grading 55, submit 181, workflow 92 checks) |
| Grade 7 Physics | all 4 files passed (build 19, grading 59, submit 123 checks; workflow passed) |
| Grade 8 English L3–L4 | 64/64 |
| Grade 8 Geometry | all 4 files passed (source match, grading, submit and workflow) |

The original blocked-run numbers below are retained as historical results and
are superseded by the local-only reruns above. No failure attributable to PR #44
was found. A real browser/mobile check and GitHub Actions/Pages deployment remain
unverified; the two independently reproduced main-branch failures remain open.

## Initial validation

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

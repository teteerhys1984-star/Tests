# Grade 4 English Curriculum Exam L1-5 A

Independent published exam: `grade4-english-curriculum-exam-l1-5-a`.
Grade 4 → Semester 1 → English. Published URL: `./grade4-english-curriculum-exam-l1-5-a/`.

## Content and marking

Copied from `grade-4-english-curriculum-exam-L1-5-A` without changing any question, passage, option, answer, accepted answer, order, explanation, source reference or mark allocation. The parity test compares the entire data file, allowing only the image import substitution.

50 questions, 100 marks; ten questions / 20 marks per lesson. Every question is worth two marks; two-part questions award one mark per correct part. Blank/incorrect parts earn zero. Written answers retain the source normalization (case, whitespace and sentence punctuation). All parts are required before normal submission. Teacher key remains unavailable during an active attempt.

## Standalone assets and source repairs

All required imagery and fonts are embedded in the built HTML because platform deployment copies only `dist/index.html`. The original welcome illustration and font license files are preserved. Missing font files were restored from Fontsource variable packages: DM Sans 5.3.0, Space Grotesk 5.3.0, Noto Sans Arabic 5.3.0 (SIL OFL).

The uploaded source refers to a missing `/images/workbook-clock.png`. Restored the fourth clock (4:00) from the exact curriculum repository/commit identified in its README:

- Repository: `teteerhys1984-star/E_Curriculum_1_9`
- Commit: `657c8e91a1a252bb27605b8aba3880e5f7b2f372`
- File: `assets/grade4-unit1-lesson3/crops/workbook-page-12-write-the-time.png`
- Crop: `(405, 32, 516, 145)`, enlarged to 333 × 339 pixels.

No audio recordings exist in the upload. Start/finish sounds are generated locally using the original Web Audio implementation, including mute controls. No exercise or required file was removed.

## Google Sheets

Configuration values are copied unchanged from the existing platform reference. No Apps Script, token, or global platform settings were edited. The complete `grade5-math-unit1` payload contract is used: attempt identity/timestamps, score summary, lessons, every question part, and full TXT report. Marking is shared with the displayed results, not reimplemented.

POST uses `text/plain;charset=utf-8`, redirect follow, 30-second timeout, three attempts with 2/5-second backoff. Stable UUIDs survive refreshes and resends. Pending payloads are persisted **before** sending, retried when opening the exam, and removed on success. Results and TXT download remain available after failure, with a Resend result button. Receipt storage avoids repeating successful delivery after refresh. Storage keys are exam-specific. Grade labels use the platform 95/85/75/65/50 boundaries.

## Run and verify

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npx playwright install chromium
node tests/browser.mjs
# After running bash landing/scripts/build-exams.sh from the repository root:
node tests/production.mjs
```

Browser scripts accept `CHROMIUM_PATH` for an existing compatible browser. Production test requires Python 3. Both intercept Google requests; unit tests inject Mock Fetch. Never run a manual submission against the live endpoint as part of verification.

## Curriculum provenance and limitation

The exclusive curriculum source is [E_Curriculum_1_9](https://github.com/teteerhys1984-star/E_Curriculum_1_9), inspected at commit `657c8e91a1a252bb27605b8aba3880e5f7b2f372`. The five Pupil's Book pages, five Workbook pages, existing lesson tests, available image scans and crops, manifests, and repository verification notes were inspected. The independent tests for Lessons 3-5 contain newly written stimuli, so those stimuli were not used.

**Important limitation:** the repository does not contain original Lesson 1 scans, image crops, a source manifest, or an exercise-by-exercise page map, including in the available historical Lesson 1 branches. Lesson 1 items and the Ahmed passage use the repository's Pupil's Book and Workbook transcriptions. Their references show the published page ranges (Pupil's Book pp. 3-5 and Workbook pp. 5-7), not a claimed exact page. These ten items cannot be certified against the original textbook until its scans are supplied and checked. The teacher area also discloses this limitation.

For Lessons 2-5, the selected printed exercises and passages were checked against the repository's available original page scans. The clock in `public/images/workbook-clock.png` is an enlarged crop of the fourth clock in Lesson 3 Workbook p. 12, Exercise 4; the original scan and crop manifest are in `assets/grade4-unit1-lesson3` in the source repository. The full printed passages used are Ahmed, the printed introduction dialogue, Sanaa, John, Dan, the dream house, Ali and Bill. No new story or listening transcript was added.

The house passage does not identify its narrator, so the source question's conflicting name is not treated as a fact. Dan's lunch location and whether his bedtime is "early" are not scored. Listening-dependent exercises without the original recordings and the personal identity-card project are excluded. Source references and the answer key are not shown during an active attempt.

# Grade 4 English Exam

A self-contained React, TypeScript and Vite exam for Grade 4, Unit 1, Lessons 1-5. It contains 50 mixed-order questions, ten per lesson, for 100 marks. It does not require a server or external service for marking, sounds, recovery or the text report.

## Run locally

Use Node.js 20.19+ or a compatible newer version.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build and preview:

```bash
npm run build
npm run preview
```

The original start and submission chimes are generated locally with the Web Audio API. The mute setting is saved on the device. The student name, answers, question position, start timestamp, elapsed time and submission state are saved in localStorage. A refresh resumes the same attempt. Clearing browser storage removes that local record. The stopwatch uses the device clock, including time spent with the page closed.

The submit button remains disabled until every part is answered. Submission is immediate. A new attempt can be started only from completed results and requires a new name entry. The downloaded UTF-8 report is created locally; no answers are uploaded.

## Marking

Every question is worth two marks. Two-part questions award one mark per part; one-part questions award two marks. Written answers are compared case-insensitively, ignoring extra whitespace and sentence punctuation. The results count a question as fully correct only if all its parts are correct; the incorrect/partial count includes partially correct questions, whose earned marks still count toward the score.

The teacher area is available before an attempt or after submission, but not during an active attempt. Its classroom password is `somer173`. It is only a client-side display gate: answers are included in the application bundle and it is not authentication or encryption.

## Curriculum provenance and limitation

The exclusive curriculum source is [E_Curriculum_1_9](https://github.com/teteerhys1984-star/E_Curriculum_1_9), inspected at commit `657c8e91a1a252bb27605b8aba3880e5f7b2f372`. The five Pupil's Book pages, five Workbook pages, existing lesson tests, available image scans and crops, manifests, and repository verification notes were inspected. The independent tests for Lessons 3-5 contain newly written stimuli, so those stimuli were not used.

**Important limitation:** the repository does not contain original Lesson 1 scans, image crops, a source manifest, or an exercise-by-exercise page map, including in the available historical Lesson 1 branches. Lesson 1 items and the Ahmed passage use the repository's Pupil's Book and Workbook transcriptions. Their references show the published page ranges (Pupil's Book pp. 3-5 and Workbook pp. 5-7), not a claimed exact page. These ten items cannot be certified against the original textbook until its scans are supplied and checked. The teacher area also discloses this limitation.

For Lessons 2-5, the selected printed exercises and passages were checked against the repository's available original page scans. The clock in `public/images/workbook-clock.png` is an enlarged crop of the fourth clock in Lesson 3 Workbook p. 12, Exercise 4; the original scan and crop manifest are in `assets/grade4-unit1-lesson3` in the source repository. The full printed passages used are Ahmed, the printed introduction dialogue, Sanaa, John, Dan, the dream house, Ali and Bill. No new story or listening transcript was added.

The house passage does not identify its narrator, so the source question's conflicting name is not treated as a fact. Dan's lunch location and whether his bedtime is "early" are not scored. Listening-dependent exercises without the original recordings and the personal identity-card project are excluded. Source references and the answer key are not shown during an active attempt.

## Verification

```bash
npx tsc --noEmit
npx vitest run
npx playwright install chromium
node tests/browser.mjs
```

The browser test requires Chromium's system libraries; on supported Linux systems, `npx playwright install-deps chromium` installs them. The test starts a temporary Vite server on an available localhost port and checks the student and teacher workflows at desktop, tablet and phone widths, including all question formats, partial completion, immediate submission, timing recovery, local report download, the contact link and the teacher gate across tabs. The unit tests audit question counts, lesson distribution, the answer key, marks, timing and report generation.

The welcome illustration is original to this project. Font license files are in `public/fonts/`.
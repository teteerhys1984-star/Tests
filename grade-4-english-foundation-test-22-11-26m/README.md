# English--foundation-test-22-11-26M

Grade 4 → Semester 1 → English. Published folder and `EXAM_ID`:
`grade-4-english-foundation-test-22-11-26m`.

## Source fidelity

The original `../English--foundation-test-22-11-26M` is untouched. All 20 main
questions, 100 one-mark parts, passages (Q15 dialogue, Q17 reading), options,
word pools, explanations and accepted answers are preserved (field-by-field
equality test against the imported source data). Total: 100 marks.
Types: text, single-choice, word-order and matching (source `select`).
The source mascot image (`src/assets/mascot.jpg`) is retained and inlined into
the single-file build. The source external font dependency was removed to avoid
runtime network dependencies; `**bold**` markers in Q8 prompts are rendered as
real bold text (`PromptText`) and stripped in the TXT report.

Each correct part earns one mark; a main question can earn 0–5, including
partial credit. No speculative fractional credit is awarded for an incorrect
single-mark part. Technical grading fixes vs. the Grade 3 reference: the
Grade-3-only uppercase-`I` special case (15a) was removed because it does not
apply here, and word-order completion now segments multi-word chips
("the cat", "a book", "the door") instead of counting space-separated tokens.

## Features

Responsive interface; name entry; timer; question navigator; automatic local
progress restoration; review all answers and return to edit before confirming;
results with per-part corrections/explanations; UTF-8 TXT download.
Teacher Area uses `somer173` and is independent of the student flow. This is
client-side convenience gating, not secure authentication.

## Sheets contract

URL/token are copied unchanged from `grade5-math-unit1/src/config.ts`.
Payload fields and nested schemas follow its `src/exam/submit.ts`.
Transport reuses the reference: POST `text/plain;charset=utf-8`, redirect follow,
30-second timeout, 3 attempts with 2/5-second waits, success only on `ok:true`
or `duplicate:true`. Result rendering/download never wait for delivery.
Pending payload is persisted **before** first send and retried on open.
IDs remain stable on restore/resend; concurrent sends for the same ID share
one promise, and successful current attempts have an isolated local marker.
All local keys are scoped by this test's EXAM_ID. No other test's data is read,
removed, or modified. Server-side deduplication still requires the existing
Apps Script attemptId handling; Apps Script itself is not modified.

## Development and checks

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

Tests install a fail-closed Mock Fetch by default; delivery tests inject mocks
only. **Never test submissions against the live Sheet.** Built output is a
single self-contained `dist/index.html`, compatible with the existing Pages
build's index-only copy. See `VALIDATION.md` for completed validation and limits.

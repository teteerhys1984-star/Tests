# english-foundation-test-22-11-26

Grade 3 → Semester 1 → English. Published folder and `EXAM_ID`:
`grade-3-english-foundation-test-22-11-26`.

## Source fidelity

The original `../english-foundation-test-22-11-26MI` is untouched. All 20 main
questions, 100 one-mark parts, passages, options, explanations and accepted
answers are preserved (deep equality test against source data). Total: 100 marks.
Types: text, single-choice, word-order and matching. No multi-select questions
occur in this source. Inline SVG/emoji and local Web Audio start/submit sounds
are retained; the source contains no external image/audio files. The external
Google Fonts stylesheet was removed to avoid runtime network dependencies.

Each correct part earns one mark; a main question can earn 0–5, including
partial credit. No speculative fractional credit is awarded for an incorrect
single-mark part. Technical grading fix: 15a must begin with uppercase `I`,
matching the source answer and capitalization objective (general case-insensitive
normalization otherwise incorrectly accepted the uncorrected prompt).

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

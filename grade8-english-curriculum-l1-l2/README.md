# Grade 8 English — Curriculum Lessons 1 & 2

Independent platform build migrated from the repository's authoritative `English_L1L2 Test` source. The question bank and marking rules are preserved; only the requested platform title and integration metadata differ. The separate `grade8-english-l1l2` exam is not used or modified.

- Grade 8 · Semester 1 · English
- 20 main questions · 91 answerable subparts · 100 marks
- React + TypeScript + Vite single-file build

## Commands

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
```

Build output is `dist/index.html`, picked up automatically by the repository's Pages deployment workflow. Grading tests cover the source answer bank and scoring; submission tests use Mock Fetch and in-memory storage. Actual Google Sheets delivery is not asserted or tested against the deployed endpoint.

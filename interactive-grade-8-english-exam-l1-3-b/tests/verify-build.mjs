import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const DIST = "dist/index.html";
assert.ok(existsSync(DIST), "dist/index.html must exist after npm run build");

const html = readFileSync(DIST, "utf8");

assert.ok(
  html.includes('"interactive-grade-8-english-exam-l1-3-b"'),
  "Built bundle must embed EXAM_ID = interactive-grade-8-english-exam-l1-3-b",
);
assert.ok(
  html.includes("<title>Interactive Grade 8 English Exam L1-3 B</title>"),
  "Built bundle must carry the exact published <title>",
);
assert.ok(
  html.includes("Interactive Grade 8 English Exam L1-3 B"),
  "Built bundle must embed EXAM_TITLE",
);
assert.ok(
  !html.includes("fonts.googleapis.com") && !html.includes("fonts.gstatic.com"),
  "Built bundle must not reference external Google Fonts",
);
assert.ok(
  !/<(?:script|link|img|iframe)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html),
  "Built bundle must not load external scripts, stylesheets, images or iframes",
);
assert.ok(
  html.includes("data:font/woff2;base64,") && html.includes("data:image/jpeg;base64,"),
  "Built single-file bundle must inline local Cairo WOFF2 fonts and JPEG illustrations",
);
assert.ok(
  !html.includes("g8-unit1-modelB") &&
    !html.includes("interactive-grade-8-english-exam-l1-3-a") &&
    !html.includes("tests-platform-gate-v1") &&
    !html.includes('id="gate-form"'),
  "Built bundle must be fully isolated and must not contain old keys or landing gate markup",
);

console.log(
  `VERIFY_BUILD_OK: ${DIST} (${html.length.toLocaleString()} bytes, single-file, isolated)`,
);

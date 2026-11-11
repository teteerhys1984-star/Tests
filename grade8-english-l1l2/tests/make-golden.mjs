/**
 * Records how a given copy of the examination marks the fixed answer sheets.
 *
 * The committed fixture (tests/fixtures/grading-golden.json) was recorded from the examination file
 * exactly as it was BEFORE result delivery was added, so tests/grading.test.mjs proves that marking
 * is unchanged. To record it again from that original file:
 *
 *   git show 8acaba6247eef915697a1a47723b7ce2ea402e00:temp-grade8-english/grade8-english-L1L2.html > /tmp/original.html
 *   node tests/make-golden.mjs /tmp/original.html
 *
 * Only re-record from the current file when the questions or the marking are changed on purpose.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EXAM_DIR, loadExam, makeAnswerSheets, gradingFingerprint } from "./harness.mjs";

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");
export const sha256 = text => createHash("sha256").update(text).digest("hex");

/** What one answer sheet scores, in a form small enough to commit and precise enough to catch any change. */
export function describeSheet(page, sheet) {
  const result = gradingFingerprint(page.call("gradeAttempt", sheet.answers));
  return {
    name: sheet.name,
    answersSha256: sha256(JSON.stringify(sheet.answers)),
    totalScore: result.totalScore,
    totalMarks: result.totalMarks,
    percentage: result.percentage,
    statusCounts: result.statusCounts,
    fullyCorrectMain: result.fullyCorrectMain,
    sections: Object.fromEntries(Object.entries(result.sections).map(([key, value]) => [key, value.earned])),
    parts: result.questions.flatMap(question => question.parts.map(part => part.partId + "=" + part.awarded + "/" + part.marks + ":" + part.status)).join(" "),
    resultSha256: sha256(JSON.stringify(result)),
  };
}

/**
 * Hashes of the two pieces of source that decide marks: the item bank (questions, keys, accepted
 * answers, explanations — the page's first inline script) and the marking functions.
 */
export function sourceHashes(page) {
  const start = page.html.indexOf("       GRADING AND RUBRICS");
  const end = page.html.indexOf("       TXT REPORT");
  if (start < 0 || end < start) throw new Error("The marking section markers were not found.");
  return {
    itemBankScriptSha256: sha256(page.parsed.scripts[0]),
    markingCodeSha256: sha256(page.html.slice(start, end)),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node tests/make-golden.mjs <examination.html>");
    process.exit(1);
  }
  const page = loadExam({ file: path.resolve(file) });
  const sheets = makeAnswerSheets(page.json("QUESTIONS"));
  const golden = {
    recordedFrom: {
      note: "The examination file before result delivery was added (base commit of this change).",
      commit: "8acaba6247eef915697a1a47723b7ce2ea402e00",
      path: "temp-grade8-english/grade8-english-L1L2.html",
      sha256: sha256(readFileSync(path.resolve(file))),
      ...sourceHashes(page),
    },
    sheets: sheets.map(sheet => describeSheet(page, sheet)),
  };
  mkdirSync(path.dirname(GOLDEN_FILE), { recursive: true });
  // One answer sheet per line keeps the file compact and its diffs readable.
  const text = "{\n \"recordedFrom\": " + JSON.stringify(golden.recordedFrom) + ",\n \"sheets\": [\n"
    + golden.sheets.map(sheet => "  " + JSON.stringify(sheet)).join(",\n") + "\n ]\n}\n";
  writeFileSync(GOLDEN_FILE, text);
  console.log("Recorded " + golden.sheets.length + " answer sheets from " + file + " (sha256 " + golden.recordedFrom.sha256.slice(0, 12) + "…)");
}

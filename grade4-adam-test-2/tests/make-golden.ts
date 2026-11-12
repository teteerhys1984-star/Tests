/**
 * Records how a given copy of this exam marks the fixed answer sheets of tests/sheets.ts.
 *
 * The committed fixture (tests/fixtures/grading-golden.json) was recorded from the exam exactly
 * as it was uploaded, BEFORE the folder was renamed and result delivery was added, so
 * tests/grading.test.ts proves that marking is unchanged. To record it again from that original:
 *
 *   mkdir -p /tmp/original
 *   git archive bac5d92846fa29bd6d8e82d8886970e4b68fac9d Adam_Test_2/src | tar -x -C /tmp/original
 *   node tests/run.mjs make-golden --src /tmp/original/Adam_Test_2/src
 *
 * (--src makes every import of this exam's src/ resolve to the given folder instead.)
 * Only re-record from the current src/ when the questions or the marking are changed on purpose.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ALL_SUBS, QUESTIONS } from "../src/data/exam";
import { GOLDEN_FILE, ORIGINAL_FILES, describeSheet, goldenReportFile } from "./golden";
import { sha256 } from "./harness";
import { makeSheets } from "./sheets";

const ORIGINAL = {
  note: "The exam as uploaded, before the folder was renamed and result delivery was added (base commit of this change).",
  commit: "bac5d92846fa29bd6d8e82d8886970e4b68fac9d",
  path: "Adam_Test_2/src",
};

const srcDir = process.env.EXAM_SRC_DIR;
if (!srcDir) {
  console.error("Run through the test runner: node tests/run.mjs make-golden --src <folder>");
  process.exit(1);
}

const files: Record<string, string> = {};
for (const file of ORIGINAL_FILES) files[file] = sha256(readFileSync(path.join(srcDir, file)));

const sheets = makeSheets();
const golden = {
  recordedFrom: { ...ORIGINAL, files },
  bank: {
    questions: QUESTIONS.length,
    subparts: ALL_SUBS.length,
    totalMarks: ALL_SUBS.reduce((sum, sub) => sum + sub.marks, 0),
    reportFile: goldenReportFile(),
  },
  sheets: sheets.map((sheet) => describeSheet(sheet)),
};

mkdirSync(path.dirname(GOLDEN_FILE), { recursive: true });
// One answer sheet per line keeps the file compact and its diffs readable.
const text =
  '{\n "recordedFrom": ' +
  JSON.stringify(golden.recordedFrom) +
  ',\n "bank": ' +
  JSON.stringify(golden.bank) +
  ',\n "sheets": [\n' +
  golden.sheets.map((sheet) => "  " + JSON.stringify(sheet)).join(",\n") +
  "\n ]\n}\n";
writeFileSync(GOLDEN_FILE, text);
console.log("Recorded " + golden.sheets.length + " answer sheets from " + srcDir);

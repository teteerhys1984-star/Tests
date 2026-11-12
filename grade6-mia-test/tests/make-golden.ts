/**
 * Records how a given copy of this exam marks the fixed answer sheets of tests/sheets.ts.
 *
 * The committed fixture (tests/fixtures/grading-golden.json) was recorded from the exam exactly
 * as it was uploaded, BEFORE the folder was renamed and result delivery was added, so
 * tests/grading.test.ts proves that marking is unchanged. To record it again from that original:
 *
 *   mkdir -p /tmp/original
 *   git archive 6da490f2b62092d5aa6727bebae70e4c49b08176 Mia_test/src Mia_test/index.html \
 *     | tar -x -C /tmp/original
 *   node tests/run.mjs make-golden --src /tmp/original/Mia_test/src
 *
 * (--src makes every import of this exam's src/ resolve to the given folder instead.)
 * Only re-record from the current src/ when the questions or the marking are changed on purpose.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GOLDEN_FILE, ORIGINAL, bankSummary, describeSheet } from "./golden";
import { sha256 } from "./harness";
import { makeSheets } from "./sheets";

const srcDir = process.env.EXAM_SRC_DIR;
if (!srcDir) {
  console.error("Run through the test runner: node tests/run.mjs make-golden --src <folder>");
  process.exit(1);
}
const examDir = path.resolve(srcDir, "..");

function walk(dir: string, base: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

// Every original file, so tests/grading.test.ts can require the ones that decide marks to be
// byte-for-byte unchanged (and the edited ones to differ only by their recorded edits).
const files: Record<string, string> = {};
for (const relative of ["index.html", ...walk(srcDir, examDir)]) {
  files[relative] = sha256(readFileSync(path.join(examDir, relative)));
}

const sheets = makeSheets();
const golden = {
  recordedFrom: { ...ORIGINAL, files },
  bank: bankSummary(),
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
console.log("Recorded " + golden.sheets.length + " answer sheets and " + Object.keys(files).length + " files from " + srcDir);

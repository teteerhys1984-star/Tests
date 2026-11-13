/**
 * يسجّل ما تحصل عليه نسخة معيّنة من هذا الاختبار على أوراق الإجابة الثابتة في tests/sheets.ts.
 *
 * المرجع المحفوظ (tests/fixtures/grading-golden.json) سُجّل من النسخة الأصلية المرفوعة في المستودع،
 * قبل أي تعديل. لإعادة تسجيله من النسخة الأصلية نفسها:
 *
 *   rm -rf /tmp/orig && mkdir -p /tmp/orig
 *   git archive 8427a6f1d84b3604998a68c00f06768ea5c1398e grade-7-physics-exam | tar -x -C /tmp/orig
 *   node tests/run.mjs make-golden --src /tmp/orig/grade-7-physics-exam/src
 *
 * (--src يجعل كل استيراد من src/ يُقرأ من المجلد المعطى بدلاً من الحالي.)
 * لا يُعاد التسجيل من النسخة الحالية إلا إذا غُيّرت الأسئلة أو التصحيح عن قصد.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GOLDEN_FILE, ORIGINAL, bankSummary, describeSheet } from "./golden";
import { EXAM_SRC_DIR, sha256 } from "./harness";
import { makeSheets } from "./sheets";

if (!process.env.EXAM_SRC_DIR) {
  console.error("شغّله عبر مُشغّل الاختبارات: node tests/run.mjs make-golden --src <folder holding src/>");
  process.exit(1);
}

const srcDir = EXAM_SRC_DIR;
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

// كل ملفات الاختبار الأصلية، كي يتأكد tests/grading.test.ts من أن الملفات التي تحدد العلامات
// لم تتغيّر حرفياً.
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
// ورقة إجابة واحدة في كل سطر: ملف صغير وديفوات مقروءة.
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

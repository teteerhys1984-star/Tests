/**
 * Marking is unchanged by the folder rename and by the addition of result delivery.
 *
 * tests/fixtures/grading-golden.json was recorded from the exam as it was uploaded (see
 * tests/make-golden.ts). This file marks the same answer sheets with the current code and
 * requires identical results: every mark, every status, every text of the results page, and the
 * whole TXT report (apart from its one reworded note line).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALL_SUBPARTS, QUESTIONS, TOTAL_MARKS, questionMarks } from "../src/exam/data";
import { gradeAttempt } from "../src/exam/grade";
import { buildReport, buildReportFilename, validateReport } from "../src/exam/report";
import {
  CURRENT_REPORT_NOTE,
  GOLDEN_FILE,
  MARKING_FILES,
  ORIGINAL_REPORT_NOTE,
  attemptFor,
  describeSheet,
  goldenReportFile,
  type SheetRecord,
} from "./golden";
import { EXAM_DIR, check, equal, finish, section, sha256 } from "./harness";
import { makeSheets } from "./sheets";

const golden = JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) as {
  recordedFrom: { commit: string; path: string; files: Record<string, string> };
  bank: { questions: number; subparts: number; totalMarks: number; reportFile: string };
  sheets: SheetRecord[];
};
const sheets = makeSheets();

section("== 1) The paper: same size and same files as the original ==");
equal("30 questions", QUESTIONS.length, golden.bank.questions);
equal("71 answerable parts", ALL_SUBPARTS.length, golden.bank.subparts);
equal("100 marks in total", TOTAL_MARKS, golden.bank.totalMarks);
equal("the marks of the questions add up to 100", QUESTIONS.reduce((sum, question) => sum + questionMarks(question), 0), 100);
for (const file of MARKING_FILES) {
  const now = sha256(readFileSync(path.join(EXAM_DIR, "src", file)));
  check(
    "src/" + file + " is byte-for-byte the original (" + golden.recordedFrom.path + "/" + file + " at " + golden.recordedFrom.commit.slice(0, 7) + ")",
    now === golden.recordedFrom.files[file],
    now.slice(0, 16) + "…"
  );
}

section("== 2) Every recorded answer sheet is marked exactly as before ==");
equal("same number of answer sheets as recorded", sheets.length, golden.sheets.length);
check("at least 400 answer sheets", golden.sheets.length >= 400, String(golden.sheets.length));
const now = sheets.map((sheet) => describeSheet(sheet, { from: CURRENT_REPORT_NOTE, to: ORIGINAL_REPORT_NOTE }));
const different = now.filter((record, index) => JSON.stringify(record) !== JSON.stringify(golden.sheets[index]));
check("all sheets: identical input, marks, statuses, result texts and TXT report", different.length === 0, different.length ? "differs: " + different.slice(0, 5).map((record) => record.name).join(", ") : golden.sheets.length + " sheets");
const fieldsThatDiffer = new Set<string>();
now.forEach((record, index) => {
  for (const key of Object.keys(record) as (keyof SheetRecord)[]) {
    if (JSON.stringify(record[key]) !== JSON.stringify(golden.sheets[index]?.[key])) fieldsThatDiffer.add(key);
  }
});
equal("no recorded field differs", [...fieldsThatDiffer], []);
check("marks awarded per part are identical", now.every((record, index) => record.marks === golden.sheets[index].marks));
check("marks awarded per question are identical", now.every((record, index) => record.questions === golden.sheets[index].questions));
check("status of every part is identical", now.every((record, index) => record.status === golden.sheets[index].status));
check("total and percentage are identical", now.every((record, index) => record.awarded === golden.sheets[index].awarded && record.percentage === golden.sheets[index].percentage));
check("every answer text, explanation and rule is identical", now.every((record, index) => record.result === golden.sheets[index].result));
check("the TXT report is identical apart from the reworded note line", now.every((record, index) => record.report === golden.sheets[index].report));
equal("the TXT file name is unchanged", goldenReportFile(), golden.bank.reportFile);

section("== 3) The recorded sheets cover full marks, zero, partial credit and unanswered parts ==");
const byName = Object.fromEntries(golden.sheets.map((sheet) => [sheet.name, sheet]));
equal("all correct = 100", byName["all-correct"].awarded, 100);
equal("all correct = 71 correct parts", byName["all-correct"].counts, [71, 0, 0, 0]);
equal("blank = 0", byName.blank.awarded, 0);
equal("blank = 71 unanswered parts", byName.blank.counts, [0, 0, 0, 71]);
equal("all wrong = 0", byName["all-wrong"].awarded, 0);
equal("all wrong = 71 incorrect parts", byName["all-wrong"].counts, [0, 0, 71, 0]);
check("one sheet per part with only that part wrong", ALL_SUBPARTS.every((sub) => byName["wrong:" + sub.id] && byName["wrong:" + sub.id].awarded === 100 - sub.marks));
check("sheets with partial credit", golden.sheets.filter((sheet) => sheet.counts[1] > 0).length >= 40);
check("sheets with unanswered parts", golden.sheets.filter((sheet) => sheet.counts[3] > 0).length >= 200);
check("numbers typed in other accepted ways still earn full marks", golden.sheets.filter((sheet) => sheet.name.startsWith("format:")).every((sheet) => sheet.awarded === 100));
check("mixed sheets in shuffled question orders", golden.sheets.filter((sheet) => sheet.name.startsWith("mixed:")).length === 60);

section("== 4) The TXT report ==");
{
  const sheet = sheets.find((item) => item.name === "mixed:7")!;
  const attempt = attemptFor(sheet);
  const result = gradeAttempt(attempt);
  const report = buildReport(attempt, result);
  const file = buildReportFilename(attempt.studentName);
  check("the report passes the exam's own validation", validateReport(report, attempt, result, file).ok);
  equal("the reworded note appears exactly once", report.split(CURRENT_REPORT_NOTE).length - 1, 1);
  check("the old note is gone", !report.includes(ORIGINAL_REPORT_NOTE) && !report.includes("لا يُرسل عبر الشبكة"));
  const lines = (text: string) => text.split("\n");
  const before = lines(report.split(CURRENT_REPORT_NOTE).join(ORIGINAL_REPORT_NOTE));
  const after = lines(report);
  equal("exactly one line of the report differs from the original wording", after.filter((line, index) => line !== before[index]).length, 1);
  // As whole words: «مقبولة» in «بدائل مقبولة» is the report's own wording, not a grade label.
  const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
  check(
    "no grade label is written to the report",
    ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"].every((word) => !wholeWord(word).test(report))
  );
  check("the report still shows the score line", report.includes("الدرجة النهائية: " + result.awarded + " / 100"));
}

finish("grading");

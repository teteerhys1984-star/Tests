/**
 * Marking is unchanged by the folder rename and by the addition of result delivery.
 *
 * tests/fixtures/grading-golden.json was recorded from the exam as it was uploaded (see
 * tests/make-golden.ts). This file marks the same answer sheets with the current code and
 * requires identical results: every mark, every status, every answer text of the results page,
 * and the whole TXT report, character for character.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALL_SUBS, QUESTIONS } from "../src/data/exam";
import { buildReport, validateReport } from "../src/lib/report";
import { GOLDEN_FILE, ORIGINAL_FILES, attemptFor, describeSheet, goldenReportFile, type SheetRecord } from "./golden";
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
equal("67 answerable parts", ALL_SUBS.length, golden.bank.subparts);
equal("100 marks in total", ALL_SUBS.reduce((sum, sub) => sum + sub.marks, 0), golden.bank.totalMarks);
check("the recorded paper has 30 questions, 67 parts and 100 marks", golden.bank.questions === 30 && golden.bank.subparts === 67 && golden.bank.totalMarks === 100);
for (const file of ORIGINAL_FILES) {
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
const now = sheets.map((sheet) => describeSheet(sheet));
const different = now.filter((record, index) => JSON.stringify(record) !== JSON.stringify(golden.sheets[index]));
check(
  "all sheets: identical input, marks, statuses, answer texts and TXT report",
  different.length === 0,
  different.length ? "differs: " + different.slice(0, 5).map((record) => record.name).join(", ") : golden.sheets.length + " sheets"
);
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
check("total and percentage are identical", now.every((record, index) => record.total === golden.sheets[index].total && record.percent === golden.sheets[index].percent));
check("every answer text shown to the student is identical", now.every((record, index) => record.result === golden.sheets[index].result));
check("the TXT report is identical, character for character", now.every((record, index) => record.report === golden.sheets[index].report));
check("the exam's own validation of the report gives the same verdicts", now.every((record, index) => record.valid === golden.sheets[index].valid));
equal("the TXT file name is unchanged", goldenReportFile(), golden.bank.reportFile);

section("== 3) The recorded sheets cover full marks, zero, partial credit and unanswered parts ==");
const byName = Object.fromEntries(golden.sheets.map((sheet) => [sheet.name, sheet]));
equal("all correct = 100", byName["all-correct"].total, 100);
equal("all correct = 67 correct parts", byName["all-correct"].counts, [67, 0, 0, 0]);
equal("blank = 0", byName.blank.total, 0);
equal("blank = 67 unanswered parts", byName.blank.counts, [0, 0, 0, 67]);
equal("all wrong = 0", byName["all-wrong"].total, 0);
equal("all wrong = 67 incorrect parts", byName["all-wrong"].counts, [0, 0, 67, 0]);
check("one sheet per part with only that part wrong", ALL_SUBS.every((sub) => byName["wrong:" + sub.id] && byName["wrong:" + sub.id].total === 100 - sub.marks));
const partialSheets = golden.sheets.filter((sheet) => sheet.name.startsWith("partial:"));
check("sheets with one part partly right: more than zero, less than full marks", partialSheets.length >= 60 && partialSheets.every((sheet) => sheet.counts[1] === 1 && sheet.total < 100), partialSheets.length + " sheets");
check("marks that are not whole numbers are covered", golden.sheets.filter((sheet) => !Number.isInteger(sheet.total)).length >= 10);
const unansweredSheets = golden.sheets.filter((sheet) => sheet.name.startsWith("unanswered:"));
check("sheets with one unanswered part, in every form the interface can store", unansweredSheets.length >= 200 && unansweredSheets.every((sheet) => sheet.counts[3] === 1), unansweredSheets.length + " sheets");
const formatSheets = golden.sheets.filter((sheet) => sheet.name.startsWith("format:"));
check("numbers written in other accepted ways still earn full marks", formatSheets.length === 10 && formatSheets.every((sheet) => sheet.total === 100));
check("mixed sheets in shuffled question and option orders", golden.sheets.filter((sheet) => sheet.name.startsWith("mixed:")).length === 60);
check("every recorded report passed the exam's own validation", golden.sheets.every((sheet) => sheet.valid === true));

section("== 4) The TXT report ==");
{
  const sheet = sheets.find((item) => item.name === "mixed:7")!;
  const attempt = attemptFor(sheet);
  const result = attempt.result!;
  const report = buildReport(attempt, result);
  check("the report passes the exam's own validation", validateReport(report, attempt, result));
  check("nothing in the report says that the result is not sent", !/لا تُرسل|لا يُرسل|لا ترسل|لا يرسل|أي خدمة خارجية/.test(report));
  // As whole words: «مقبولة» is not the grade label «مقبول».
  const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
  const found = ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"].filter((word) => wholeWord(word).test(report));
  check("no grade label is written to the report", found.length === 0, found.join("، "));
  check("the report still shows the score line", report.includes("الدرجة: " + result.total + " / 100"));
  check("lines are separated by CR LF, as in the original", report.split("\r\n").length > 500, report.split("\r\n").length + " lines");
}

finish("grading");

/**
 * Marking is unchanged by the folder rename and by the addition of result delivery.
 *
 * tests/fixtures/grading-golden.json was recorded from the exam as it was uploaded (see
 * tests/make-golden.ts). This file marks the same answer sheets with the current code and
 * requires identical results: every mark, every status, every text of the results page, and the
 * whole TXT report (apart from its one reworded note line). It also requires every original file
 * that decides marks to be byte-for-byte unchanged, and every other original file to differ only
 * by the edits recorded in tests/golden.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { QUESTIONS, TOTAL_MARKS, TOTAL_PARTS } from "../src/exam/data";
import { gradeAttempt } from "../src/exam/grade";
import { buildReport, reportFilename, validateReport } from "../src/exam/report";
import {
  CURRENT_REPORT_NOTE,
  DELIVERY_FILES,
  FILE_EDITS,
  GOLDEN_FILE,
  ORIGINAL_REPORT_NOTE,
  REWORDED_IN_DELIVERY_FILES,
  attemptFor,
  describeSheet,
  goldenReportFile,
  withFixedClock,
  type SheetRecord,
} from "./golden";
import { EXAM_DIR, check, equal, finish, section, sha256 } from "./harness";
import { PARTS, makeSheets } from "./sheets";

const golden = JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) as {
  recordedFrom: { commit: string; path: string; files: Record<string, string> };
  bank: { questions: number; parts: number; totalMarks: number; topics: number; reportFile: string };
  sheets: SheetRecord[];
};
const sheets = makeSheets();

section("== 1) The paper: same size, same files as the original ==");
equal("30 questions", QUESTIONS.length, golden.bank.questions);
equal("71 answerable parts", PARTS.length, golden.bank.parts);
equal("71 answerable parts (the exam's own count)", TOTAL_PARTS, golden.bank.parts);
equal("100 marks in total", TOTAL_MARKS, golden.bank.totalMarks);
equal("the marks of the parts of every question add up to 100",
  QUESTIONS.reduce((sum, question) => sum + question.parts.reduce((total, part) => total + part.marks, 0), 0), 100);
equal("every part belongs to exactly one question", PARTS.filter((part) => QUESTIONS.filter((question) => question.parts.includes(part)).length !== 1).map((part) => part.id), []);
equal("every part id is unique", PARTS.filter((part, index) => PARTS.findIndex((other) => other.id === part.id) !== index).map((part) => part.id), []);
equal("every choice part names a correct option that exists",
  PARTS.filter((part) => part.kind === "mcq" && !(part.options ?? []).some((option) => option.id === part.correctOptionId)).map((part) => part.id), []);
equal("every true/false part has its answer", PARTS.filter((part) => part.kind === "boolean" && typeof part.correctBoolean !== "boolean").map((part) => part.id), []);
equal("every written part lists its accepted answers",
  PARTS.filter((part) => (part.kind === "numeric" || part.kind === "text") && !(part.accepted ?? []).length).map((part) => part.id), []);
equal("the marks of the blanks of a multi part add up to the marks of the part",
  PARTS.filter((part) => part.kind === "multi" && (part.blanks ?? []).reduce((sum, blank) => sum + blank.marks, 0) !== part.marks).map((part) => part.id), []);
equal("every part has its explanation and its book reference", PARTS.filter((part) => !part.explanation || !part.page).map((part) => part.id), []);
equal("the TXT file name is unchanged", goldenReportFile(), golden.bank.reportFile);
check("the file name is built from the student name", reportFilename("ميا التجريبية") === "Grade6_Mathematics_Mia_Report_ميا_التجريبية.txt", golden.bank.reportFile);

{
  // Every original file: either untouched, or different only by the edits recorded in golden.ts.
  const untouched: string[] = [];
  const edited: string[] = [];
  const different: string[] = [];
  for (const [relative, hash] of Object.entries(golden.recordedFrom.files)) {
    const current = readFileSync(path.join(EXAM_DIR, relative), "utf8");
    if (sha256(current) === hash) {
      untouched.push(relative);
      continue;
    }
    if (DELIVERY_FILES.includes(relative)) {
      edited.push(relative);
      continue;
    }
    // Turn every recorded edit back into its original text: the file must then be the original.
    let restored = current;
    for (const edit of FILE_EDITS[relative] ?? []) restored = restored.split(edit.to).join(edit.from);
    if (sha256(restored) === hash) edited.push(relative);
    else different.push(relative);
  }
  equal("no file differs from the original in an unrecorded way", different, []);
  equal("the question bank (questions, correct answers, marks, explanations) is byte-for-byte the original",
    sha256(readFileSync(path.join(EXAM_DIR, "src/exam/data.ts"))), golden.recordedFrom.files["src/exam/data.ts"]);
  equal("the marking code is byte-for-byte the original",
    sha256(readFileSync(path.join(EXAM_DIR, "src/exam/grade.ts"))), golden.recordedFrom.files["src/exam/grade.ts"]);
  equal("the autosave code differs only by its three recorded edits",
    FILE_EDITS["src/exam/attempt.ts"].length, 3);
  check("the report code differs only by its one recorded edit",
    edited.includes("src/exam/report.ts") && FILE_EDITS["src/exam/report.ts"].length === 1);
  equal("files rewritten for delivery (checked by the workflow test)", DELIVERY_FILES.filter((file) => edited.includes(file)).sort(), [...DELIVERY_FILES].sort());
  check("every other original file is untouched", untouched.length >= 12, untouched.length + " files: " + untouched.join(", "));
  equal("the page shell is untouched", sha256(readFileSync(path.join(EXAM_DIR, "index.html"))), golden.recordedFrom.files["index.html"]);
}

{
  // The wording edits inside the rewritten files: the old claim is gone, the new one is there.
  for (const [relative, edits] of Object.entries(REWORDED_IN_DELIVERY_FILES)) {
    const current = readFileSync(path.join(EXAM_DIR, relative), "utf8");
    for (const edit of edits) {
      check(relative + ": " + edit.what + " (new wording present once)", current.split(edit.to).length - 1 === 1);
      check(relative + ": the old wording is gone", !current.includes(edit.from));
    }
  }
}

section("== 2) Every recorded answer sheet is marked exactly as before ==");
equal("same number of answer sheets as recorded", sheets.length, golden.sheets.length);
check("at least 300 answer sheets", golden.sheets.length >= 300, String(golden.sheets.length));
const now = sheets.map((sheet) => describeSheet(sheet, { from: CURRENT_REPORT_NOTE, to: ORIGINAL_REPORT_NOTE }));
const different = now.filter((record, index) => JSON.stringify(record) !== JSON.stringify(golden.sheets[index]));
check("all sheets: identical input, marks, statuses, result texts and TXT report", different.length === 0,
  different.length ? "differs: " + different.slice(0, 5).map((record) => record.name).join(", ") : golden.sheets.length + " sheets");
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
check("total and percentage are identical", now.every((record, index) => record.score === golden.sheets[index].score && record.percentage === golden.sheets[index].percentage));
check("every answer text, explanation and page reference is identical", now.every((record, index) => record.result === golden.sheets[index].result));
check("the TXT report is identical apart from the reworded note line", now.every((record, index) => record.report === golden.sheets[index].report));

section("== 3) The recorded sheets cover full marks, zero, partial credit and unanswered parts ==");
const byName = Object.fromEntries(golden.sheets.map((sheet) => [sheet.name, sheet]));
equal("all correct = 100", byName["all-correct"].score, 100);
equal("all correct = every part correct", byName["all-correct"].counts, [TOTAL_PARTS, 0, 0, 0]);
equal("blank = 0", byName.blank.score, 0);
equal("blank = every part unanswered", byName.blank.counts, [0, 0, 0, TOTAL_PARTS]);
equal("all wrong = 0", byName["all-wrong"].score, 0);
equal("all wrong = every part incorrect", byName["all-wrong"].counts, [0, 0, TOTAL_PARTS, 0]);
check("one sheet per part with only that part wrong",
  PARTS.every((part) => byName["wrong:" + part.id] && byName["wrong:" + part.id].score === 100 - part.marks));
check("sheets with partial credit (a multi part with one blank of two right)",
  golden.sheets.filter((sheet) => sheet.counts[1] > 0).length >= 8,
  String(golden.sheets.filter((sheet) => sheet.counts[1] > 0).length));
check("sheets with unanswered parts", golden.sheets.filter((sheet) => sheet.counts[3] > 0).length >= 150,
  String(golden.sheets.filter((sheet) => sheet.counts[3] > 0).length));
check("numbers typed in other accepted ways still earn full marks",
  golden.sheets.filter((sheet) => sheet.name.startsWith("format:")).every((sheet) => sheet.score === 100),
  golden.sheets.filter((sheet) => sheet.name.startsWith("format:")).length + " formats");
check("mixed sheets in shuffled question orders", golden.sheets.filter((sheet) => sheet.name.startsWith("mixed:")).length === 60);

section("== 4) The TXT report ==");
{
  const sheet = sheets.find((item) => item.name === "mixed:7")!;
  const attempt = attemptFor(sheet);
  const result = withFixedClock(() => gradeAttempt(attempt.answers, attempt.questionOrder));
  const report = withFixedClock(() => buildReport(attempt, result));
  let thrown: string | null = null;
  try {
    validateReport(report, attempt, result);
  } catch (error) {
    thrown = error instanceof Error ? error.message : String(error);
  }
  equal("the report passes the exam's own validation", thrown, null);
  equal("the reworded note appears exactly once", report.split(CURRENT_REPORT_NOTE).length - 1, 1);
  check("the old note is gone", !report.includes(ORIGINAL_REPORT_NOTE) && !report.includes("دون إرسال أي بيانات"));
  const lines = (text: string) => text.split("\n");
  const before = lines(report.split(CURRENT_REPORT_NOTE).join(ORIGINAL_REPORT_NOTE));
  const after = lines(report);
  equal("exactly one line of the report differs from the original wording", after.filter((line, index) => line !== before[index]).length, 1);
  // As whole words: «ممتاز» or «جيد» inside an explanation would be the paper's own wording, not a
  // grade label, so only whole words are looked for.
  const wholeWord = (word: string) => new RegExp("(^|[^\\u0600-\\u06FF])" + word + "([^\\u0600-\\u06FF]|$)", "m");
  check("no grade label is written to the report",
    ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"].every((word) => !wholeWord(word).test(report)),
    ["التقدير", "ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "يحتاج إلى دعم"].filter((word) => wholeWord(word).test(report)).join("، "));
  check("the report still shows the score line", report.includes(`الدرجة النهائية: ${result.score} من ${result.totalMarks}`));
  check("the report still shows the percentage", report.includes(`النسبة المئوية: ${result.percentage}%`));
  check("the report lists every part of every question", (report.match(/الحالة:/g) ?? []).length === result.totalParts);
  check("the report names the attempt and the student", report.includes(attempt.attemptId) && report.includes(attempt.studentName));
  check("the teacher's password is never written to the report", !report.includes("somer173"));
}

finish("grading");

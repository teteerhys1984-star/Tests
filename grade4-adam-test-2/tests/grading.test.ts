/**
 * Marking is unchanged by the folder rename and by the addition of result delivery, with one
 * deliberate exception made afterwards: «خاطئة» on q08a (section 3).
 *
 * tests/fixtures/grading-golden.json was recorded from the exam as it was uploaded (see
 * tests/make-golden.ts). This file marks the same answer sheets with the current code and
 * requires identical results: every mark, every status, every answer text of the results page,
 * and the whole TXT report, character for character.
 *
 * The exception. q08a is a true statement, so it has no correction box. The original counted
 * «خاطئة» as an answer only together with a written correction; on q08a that left the part
 * "unanswered" and the submit button disabled until the student chose «صحيحة». Now «خاطئة» is a
 * complete answer there, marked wrong with 0 marks (tests/q08a.test.tsx shows the behaviour).
 * For the recorded sheets that hold exactly that answer, this file requires the original's
 * result with that one part turned from unanswered into incorrect, and nothing else.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALL_SUBS, QUESTIONS } from "../src/data/exam";
import type { Ans, GradeResult } from "../src/lib/grade";
import { buildReport, validateReport } from "../src/lib/report";
import { GOLDEN_FILE, ORIGINAL_FILES, attemptFor, describeSheet, goldenReportFile, type SheetRecord } from "./golden";
import { EXAM_DIR, check, equal, finish, section, sha256 } from "./harness";
import { makeSheets } from "./sheets";

const golden = JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) as {
  recordedFrom: { commit: string; path: string; files: Record<string, string> };
  bank: { questions: number; subparts: number; totalMarks: number; reportFile: string };
  sheets: SheetRecord[];
};
const recorded = golden.sheets;
const sheets = makeSheets();
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/* ------------------------------------------------------------------ */
/* The q08a fix                                                        */
/* ------------------------------------------------------------------ */
/** The part whose marking was changed on purpose, and its place among the parts of the bank. */
const FIXED_PART = "q08a";
const fixedAt = ALL_SUBS.findIndex((sub) => sub.id === FIXED_PART);

/** The only answer that is marked differently: «خاطئة» on that part, with nothing written. */
const isFixedCase = (answer: Ans): boolean =>
  !!answer && typeof answer === "object" && !Array.isArray(answer) && answer.c === "F" && (answer.corr ?? "").trim() === "";

/**
 * The fix as text: the two places where src/lib/grade.ts differs from the original, both in the
 * rules of the true/false parts. Undoing them must give the original file again, which shows that
 * nothing else in the marking code was touched.
 */
const MARKING_FILE = "lib/grade.ts";
const Q08A_FIX: { original: string; now: string }[] = [
  {
    original: [
      "      return v.c === \"T\" || (v.corr ?? \"\").trim() !== \"\";",
    ].join("\n"),
    now: [
      "      // «خاطئة» needs a written correction only where the part has a correction box (tf.corrLabel).",
      "      // A part without one — q08a, whose statement is true — is complete with either choice.",
      "      return v.c === \"T\" || (v.c === \"F\" && !sub.tf?.corrLabel) || (v.corr ?? \"\").trim() !== \"\";",
    ].join("\n"),
  },
  {
    original: [
      "      return v.c === \"T\" ? \"صحيحة\" : `خاطئة — التصحيح: ${w(v.corr.trim())}`;",
    ].join("\n"),
    now: [
      "      if (v.c === \"T\") return \"صحيحة\";",
      "      // «خاطئة» alone where nothing was written (possible only without a correction box).",
      "      const corr = w((v.corr ?? \"\").trim());",
      "      return corr ? `خاطئة — التصحيح: ${corr}` : \"خاطئة\";",
    ].join("\n"),
  },
];

const UNANSWERED_TEXT = "(لم تتم الإجابة)";
/** The marking result as the original gave it for that answer: the part unanswered instead of incorrect. */
function asOriginal(result: GradeResult): GradeResult {
  return {
    ...result,
    items: result.items.map((item) => (item.subId === FIXED_PART ? { ...item, status: "unanswered" as const, studentText: UNANSWERED_TEXT } : item)),
    incorrect: result.incorrect - 1,
    unanswered: result.unanswered + 1,
  };
}
const countersLine = (result: GradeResult) =>
  `صحيحة: ${result.correct}   |   صحيحة جزئياً: ${result.partial}   |   خاطئة: ${result.incorrect}   |   بلا إجابة: ${result.unanswered}`;
/** The TXT report as the original printed it for that answer: three lines differ. */
function reportAsOriginal(report: string, result: GradeResult): string {
  const lines = report.split("\r\n");
  const counters = lines.indexOf(countersLine(result));
  const part = lines.findIndex((line) => line.startsWith("  الفرع (") && line.includes("المعرّف: " + FIXED_PART + " "));
  if (counters < 0 || part < 0 || lines[part + 2] !== "    إجابة الطالب: خاطئة" || lines[part + 5] !== "    الحالة: خاطئة") {
    return "the report does not hold the expected lines";
  }
  lines[counters] = countersLine(asOriginal(result));
  lines[part + 2] = "    إجابة الطالب: " + UNANSWERED_TEXT;
  lines[part + 5] = "    الحالة: بلا إجابة";
  return lines.join("\r\n");
}

/* ------------------------------------------------------------------ */
section("== 1) The paper: same size and same files as the original ==");
equal("30 questions", QUESTIONS.length, golden.bank.questions);
equal("67 answerable parts", ALL_SUBS.length, golden.bank.subparts);
equal("100 marks in total", ALL_SUBS.reduce((sum, sub) => sum + sub.marks, 0), golden.bank.totalMarks);
check("the recorded paper has 30 questions, 67 parts and 100 marks", golden.bank.questions === 30 && golden.bank.subparts === 67 && golden.bank.totalMarks === 100);
const original = (file: string) => golden.recordedFrom.path + "/" + file + " at " + golden.recordedFrom.commit.slice(0, 7);
check("the marking code is one of the recorded files", ORIGINAL_FILES.includes(MARKING_FILE) && fixedAt >= 0);
for (const file of ORIGINAL_FILES.filter((name) => name !== MARKING_FILE)) {
  const hash = sha256(readFileSync(path.join(EXAM_DIR, "src", file)));
  check("src/" + file + " is byte-for-byte the original (" + original(file) + ")", hash === golden.recordedFrom.files[file], hash.slice(0, 16) + "…");
}
{
  const current = readFileSync(path.join(EXAM_DIR, "src", MARKING_FILE), "utf8");
  check(
    "src/" + MARKING_FILE + " holds the q08a fix: two edits, both in the rules of the true/false parts",
    Q08A_FIX.length === 2 && Q08A_FIX.every((edit) => current.split(edit.now).length === 2 && !current.includes(edit.original))
  );
  let undone = current;
  for (const edit of Q08A_FIX) undone = undone.replace(edit.now, () => edit.original);
  const hash = sha256(undone);
  check("with those two edits undone it is byte-for-byte the original (" + original(MARKING_FILE) + ")", hash === golden.recordedFrom.files[MARKING_FILE], hash.slice(0, 16) + "…");
}

/* ------------------------------------------------------------------ */
section("== 2) Every recorded answer sheet is marked exactly as before ==");
equal("same number of answer sheets as recorded", sheets.length, recorded.length);
check("at least 400 answer sheets", recorded.length >= 400, String(recorded.length));
const now = sheets.map((sheet) => describeSheet(sheet));
const every = now.map((_, index) => index);
check("every sheet is the recorded one: same question order, option orders and answers", every.every((index) => now[index].name === recorded[index].name && now[index].sheet === recorded[index].sheet));
check("marks awarded per part are identical", every.every((index) => now[index].marks === recorded[index].marks));
check("marks awarded per question are identical", every.every((index) => now[index].questions === recorded[index].questions));
check("total and percentage are identical", every.every((index) => now[index].total === recorded[index].total && now[index].percent === recorded[index].percent));
check("the exam's own validation of the report gives the same verdicts", every.every((index) => now[index].valid === recorded[index].valid));
equal("the TXT file name is unchanged", goldenReportFile(), golden.bank.reportFile);

/** Fields of a sheet's record that differ from the recording. */
const differing = (index: number) => (Object.keys(now[index]) as (keyof SheetRecord)[]).filter((key) => !same(now[index][key], recorded[index]?.[key]));
const affected = every.filter((index) => isFixedCase(sheets[index].answers[FIXED_PART]));
const others = every.filter((index) => !affected.includes(index));
const different = others.filter((index) => differing(index).length > 0);
check(
  "all sheets but those of section 3: identical statuses, answer texts and TXT report",
  different.length === 0,
  different.length ? "differs: " + different.slice(0, 5).map((index) => now[index].name).join(", ") : others.length + " of " + recorded.length + " sheets"
);
equal("no recorded field differs in them", [...new Set(others.flatMap(differing))], []);
check("status of every part is identical in them", others.every((index) => now[index].status === recorded[index].status));
check("every answer text shown to the student is identical in them", others.every((index) => now[index].result === recorded[index].result));
check("the TXT report is identical in them, character for character", others.every((index) => now[index].report === recorded[index].report));

/* ------------------------------------------------------------------ */
section("== 3) The one deliberate difference: «خاطئة» on q08a is an answer — wrong, 0 marks ==");
const names = affected.map((index) => now[index].name);
check(
  "recorded sheets that hold «خاطئة» on q08a with nothing written: alone, and among other wrong and unanswered parts",
  ["unanswered:q08a#2", "unanswered:q08a#3"].every((name) => names.includes(name)) && names.some((name) => name.startsWith("mixed:")),
  names.join(", ")
);
check("the original left q08a unanswered there, with 0 marks", affected.every((index) => recorded[index].status[fixedAt] === "u" && recorded[index].marks.split(",")[fixedAt] === "0"));
check("now q08a is incorrect there, with the same 0 marks", affected.every((index) => now[index].status[fixedAt] === "i" && now[index].marks.split(",")[fixedAt] === "0"));
check(
  "the status of every other part is the original's",
  affected.every((index) => now[index].status.slice(0, fixedAt) + "u" + now[index].status.slice(fixedAt + 1) === recorded[index].status)
);
check(
  "counters: one more incorrect part and one fewer unanswered, the others as recorded",
  affected.every((index) => {
    const [correct, partial, incorrect, unanswered] = recorded[index].counts;
    return same(now[index].counts, [correct, partial, incorrect + 1, unanswered - 1]);
  })
);
check(
  "marks per part and per question, total and percentage are the original's",
  affected.every(
    (index) =>
      now[index].marks === recorded[index].marks && now[index].questions === recorded[index].questions && now[index].total === recorded[index].total && now[index].percent === recorded[index].percent
  )
);
check("nothing else in the record differs: only counters, statuses, answer texts and report", affected.every((index) => same(differing(index), ["counts", "status", "result", "report"])));
const marked = affected.map((index) => {
  const attempt = attemptFor(sheets[index]);
  const result = attempt.result!;
  return { index, attempt, result, report: buildReport(attempt, result) };
});
check(
  "q08a is shown as «خاطئة» against the key «صحيحة», 0 of 1",
  marked.every(({ result }) => {
    const item = result.items.find((part) => part.subId === FIXED_PART)!;
    return item.status === "incorrect" && item.awarded === 0 && item.marks === 1 && item.studentText === "خاطئة" && item.correctText === "صحيحة";
  })
);
check(
  "the whole marking result is the original's once q08a is put back to unanswered",
  marked.every(({ index, result }) => sha256(JSON.stringify(asOriginal(result))) === recorded[index].result)
);
check(
  "the whole TXT report is the original's once three lines are put back: the counters, and the answer and status of q08a",
  marked.every(({ index, result, report }) => sha256(reportAsOriginal(report, result)) === recorded[index].report)
);
check("each of these reports passes the exam's own validation", marked.every(({ attempt, result, report }) => validateReport(report, attempt, result)));
check(
  "the same answer on q08b, which has a correction box, is still unanswered as recorded",
  ["unanswered:q08b#2", "unanswered:q08b#3"].every((name) => {
    const index = now.findIndex((record) => record.name === name);
    return index >= 0 && others.includes(index) && recorded[index].counts[3] === 1 && same(now[index].counts, recorded[index].counts);
  })
);

/* ------------------------------------------------------------------ */
section("== 4) The recorded sheets cover full marks, zero, partial credit and unanswered parts ==");
const byName = Object.fromEntries(recorded.map((sheet) => [sheet.name, sheet]));
equal("all correct = 100", byName["all-correct"].total, 100);
equal("all correct = 67 correct parts", byName["all-correct"].counts, [67, 0, 0, 0]);
equal("blank = 0", byName.blank.total, 0);
equal("blank = 67 unanswered parts", byName.blank.counts, [0, 0, 0, 67]);
equal("all wrong = 0", byName["all-wrong"].total, 0);
equal("all wrong = 67 incorrect parts", byName["all-wrong"].counts, [0, 0, 67, 0]);
check("one sheet per part with only that part wrong", ALL_SUBS.every((sub) => byName["wrong:" + sub.id] && byName["wrong:" + sub.id].total === 100 - sub.marks));
const partialSheets = recorded.filter((sheet) => sheet.name.startsWith("partial:"));
check("sheets with one part partly right: more than zero, less than full marks", partialSheets.length >= 60 && partialSheets.every((sheet) => sheet.counts[1] === 1 && sheet.total < 100), partialSheets.length + " sheets");
check("marks that are not whole numbers are covered", recorded.filter((sheet) => !Number.isInteger(sheet.total)).length >= 10);
const unansweredSheets = recorded.filter((sheet) => sheet.name.startsWith("unanswered:"));
check("sheets the original marked with one unanswered part, in every form the interface can store", unansweredSheets.length >= 200 && unansweredSheets.every((sheet) => sheet.counts[3] === 1), unansweredSheets.length + " sheets");
const formatSheets = recorded.filter((sheet) => sheet.name.startsWith("format:"));
check("numbers written in other accepted ways still earn full marks", formatSheets.length === 10 && formatSheets.every((sheet) => sheet.total === 100));
check("mixed sheets in shuffled question and option orders", recorded.filter((sheet) => sheet.name.startsWith("mixed:")).length === 60);
check("every recorded report passed the exam's own validation", recorded.every((sheet) => sheet.valid === true));

/* ------------------------------------------------------------------ */
section("== 5) The TXT report ==");
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

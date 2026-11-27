/**
 * The assessment interface is English-only. These filters keep student-entered
 * names and written answers in Latin-script English characters and simple
 * punctuation, so no other writing system can enter the exam, results, or report.
 */
const LATIN_LETTERS = "A-Za-z\\u00C0-\\u024F";

const SMART_APOSTROPHES = /[\u2018\u2019\u02BC]/g;

export function sanitizeStudentName(value: string): string {
  return value
    .replace(SMART_APOSTROPHES, "'")
    .replace(new RegExp(`[^${LATIN_LETTERS}' .-]`, "g"), "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 50);
}

export function sanitizeEnglishAnswer(value: string): string {
  return value
    .replace(SMART_APOSTROPHES, "'")
    .replace(new RegExp(`[^${LATIN_LETTERS}0-9' .,!?;-]`, "g"), "")
    .slice(0, 100);
}

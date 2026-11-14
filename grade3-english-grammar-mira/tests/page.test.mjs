/**
 * The page itself: what changed from the original (and nothing else), truthful privacy wording,
 * the interface from start to results, and the fixes that have a visible effect.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";
import {
  EXAM_DIR_NAME, FakeServer, SOURCE_HTML, STORAGE_KEY, TEACHER_PASSWORD, correctAnswer, openExam, resultsSnapshot, sendStatus, settle,
  sheetOf, startInUi, submitExamInUi, takeExamInUi, teacherKeySnapshot,
} from "./harness.mjs";
import { ADDED_IDS, PUBLISHED_PRIVACY_LINE, REPLACEMENTS, ADDED_REGIONS, revertDocumentedChanges } from "./differences.mjs";

const html = readFileSync(SOURCE_HTML, "utf8");
const originalHtml = readFileSync(new URL("./fixtures/original-exam.html", import.meta.url), "utf8");
const pages = [];

async function open(options = {}) {
  const page = await openExam({ file: SOURCE_HTML, ...options });
  pages.push(page);
  return page;
}

after(() => {
  for (const page of pages) page.close();
});

test("folder, EXAM_ID and title", () => {
  assert.equal(EXAM_DIR_NAME, "grade3-english-grammar-mira");
  const ids = [...html.matchAll(/\bEXAM_ID\s*=\s*["']([^"']*)["']/g)].map((match) => match[1]);
  assert.deepEqual(ids, [EXAM_DIR_NAME], "one EXAM_ID literal, equal to the folder name");
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/)[1], "English Grammar Mira");
  assert.equal(html.match(/\bEXAM_TITLE\s*=\s*"([^"]*)"/)[1], "English Grammar Mira");
  /* What the landing page reads to file the examination: title + folder name. */
  const evidence = ("English Grammar Mira " + EXAM_DIR_NAME).toLowerCase();
  assert.match(evidence, /grade[-_ ]?3\b/);
  assert.match(evidence, /english/);
  assert.ok(!/arabic|math|physics|chemistry|science|عربي|رياضيات|فيزياء|كيمياء|علوم/.test(evidence), "no word of another subject");
});

test("every difference from the original is documented, and there is no other", () => {
  assert.equal(revertDocumentedChanges(html), originalHtml, "reverting the documented changes must give the uploaded file, byte for byte");
  for (const change of [...REPLACEMENTS, ...ADDED_REGIONS]) assert.ok(change.why.length > 20, change.what);
  /* The original CSS, ids, script count and outside resources are intact. */
  const css = (text) => text.slice(text.indexOf("<style>"), text.indexOf("</style>")).split("\n");
  const mine = css(html);
  let at = 0;
  for (const line of css(originalHtml)) {
    at = mine.indexOf(line, at);
    assert.notEqual(at, -1, "CSS line kept, in order: " + line.slice(0, 60));
    at += 1;
  }
  const idsOf = (text) => [...text.slice(0, text.indexOf("<script>")).matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const before = idsOf(originalHtml);
  const after = idsOf(html);
  assert.equal(new Set(after).size, after.length, "ids are unique");
  assert.deepEqual(after.filter((id) => !before.includes(id)), ADDED_IDS);
  assert.deepEqual(before.filter((id) => !after.includes(id)), []);
  const resources = (text) => [...text.matchAll(/<(?:script|link|img|iframe|audio|video|source)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(resources(html), resources(originalHtml), "nothing new is loaded from the network");
  const urls = [...html.matchAll(/https?:\/\/[^\s"'`)<]+/g)].map((match) => match[0]).filter((url) => !originalHtml.includes(url));
  assert.deepEqual(urls, ["https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"]);
  assert.equal((html.match(/<script\b/g) || []).length, 2, "the original's two script tags");
  assert.equal(html.match(/<html[^>]*>/)[0], '<html lang="en">');
  assert.ok(!/arena/i.test(html));
});

test("privacy wording is true: the student is told about sending before starting and on the results", async () => {
  for (const claim of ["No student answers were sent", "sent to a server", "generated locally", "calculated locally", "internal reference", "course repository"]) {
    assert.ok(!html.toLowerCase().includes(claim.toLowerCase()), "the page must not say: " + claim);
  }
  const page = await open();
  assert.equal(page.screen(), "welcome");
  assert.ok(page.visible("#send-note"));
  assert.equal(page.text("#send-note"), "Your answers are saved on this device while you work. When you submit, your name, result and answers are sent to your teacher.");
  await submitExamInUi(page, {});
  assert.equal(page.screen(), "results");
  assert.ok(page.text("#results-screen").includes("The report is generated on this device. Your result and answers are also sent to your teacher when you submit."));
  await page.clock.advance(700);
  const report = await page.downloadText();
  assert.ok(report.includes("\n" + PUBLISHED_PRIVACY_LINE + "\n"));
  /* The original's warning about the teacher password is kept as it is. */
  const teacher = teacherKeySnapshot(page);
  assert.equal(teacher.count, 25);
  assert.ok(page.text("#teacher-modal").includes("Client-side gate designed as an interface privacy lock."));
});

test("delivery status element: announced politely, hidden until there is something to say, button separate", async () => {
  const page = await open();
  const box = page.$("#send-status");
  assert.equal(box.getAttribute("role"), "status");
  assert.equal(box.getAttribute("aria-live"), "polite");
  assert.equal(box.getAttribute("data-send-status"), "idle");
  assert.equal(box.hidden, true);
  assert.ok(box.closest("#results-screen"), "it lives on the results screen");
  const button = page.$("#resend-result-btn");
  assert.equal(button.tagName, "BUTTON");
  assert.equal(button.getAttribute("type"), "button");
  assert.equal(button.hidden, true);
  assert.equal(page.text("#resend-result-btn"), "↻ Resend Result · إعادة إرسال النتيجة");
  assert.notEqual(button, page.$("button[onclick='downloadTxtReport()']"));
  assert.notEqual(button, page.$("button[onclick='tryAgain()']"));
  assert.equal(page.$("#send-status-text-ar").getAttribute("dir"), "rtl");
  assert.equal(page.text("#send-status-text-ar"), "");
});

test("the fixes: underlined words, the dialogue line break, Enter to start, restored stopwatch", async () => {
  const page = await open();
  /* Enter in the name field starts the challenge. */
  page.$("#student-name-input").value = "Mira";
  page.$("#student-name-input").dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  assert.equal(page.screen(), "assessment");

  /* Question 2: the prompt speaks of underlined words, and the words are underlined. */
  page.run("jumpToQuestion(2)");
  const underline = page.$("#q-sub-text .underline");
  assert.ok(underline, "the words of Question 2 are underlined");
  assert.equal(underline.textContent, "Khalil and Adam");
  assert.equal(page.text("#q-sub-text"), "Khalil and Adam are friends. _____ are at school.");
  assert.equal(page.$$("#q-sub-text .underline").length, 1);

  /* Question 3: the dialogue's line break is displayed. */
  page.run("jumpToQuestion(3)");
  assert.ok(page.$("#q-sub-text").textContent.includes("— Are you ready?\n— Yes, _____."));
  assert.ok(page.$("#q-sub-text").classList.contains("whitespace-pre-line"));

  /* No other question gains an underline. */
  for (const q of page.questions.filter((item) => item.id !== 2)) {
    page.run(`jumpToQuestion(${q.id})`);
    assert.equal(page.$$("#q-sub-text .underline").length, 0, "Q" + q.id);
  }
});

test("a complete run through the interface: results, report, teacher key and a reload", async () => {
  const server = new FakeServer();
  const page = await open({ server });
  await submitExamInUi(page, { name: "Mira Test", elapsedMs: 754000 });
  assert.equal(page.screen(), "results");
  assert.equal(page.text("#res-student-name"), "Mira Test");
  assert.equal(page.text("#res-duration"), "00:12:34");
  assert.equal(page.text("#stopwatch-display"), "00:12:34");
  assert.equal(page.$$("#detailed-review-list > div").length, 25);
  assert.equal(page.$$("#lesson-breakdown-grid > div").length, 6);
  assert.equal(page.text("#res-score-marks"), String(server.requests[0].payload.summary.total));
  await page.clock.advance(700);
  assert.equal(page.downloads.length, 1);
  assert.equal(page.downloads[0].name, "Mira_English_Grammar_Report.txt");
  const report = await page.downloadText();
  assert.ok(report.startsWith("================================================================================"));
  assert.ok(report.includes("Total Score      : 100 / 100 Marks (100%)"));
  assert.ok(report.includes("DETAILED QUESTION-BY-QUESTION REVIEW"));
  assert.equal(server.count, 1);
  assert.equal(sendStatus(page).state, "success");

  const before = resultsSnapshot(page);
  const stored = JSON.parse(page.storage.getItem(STORAGE_KEY));
  assert.equal(stored.studentName, "Mira Test");
  assert.equal(stored.submitted, true);
  assert.equal(Object.keys(stored.answers).length, 25);
  assert.equal(typeof stored.delivery.attemptId, "string");

  /* Reopening the same device restores the submitted attempt without sending it again. */
  const reopened = await open({ storage: page.storage, server });
  assert.equal(reopened.screen(), "results");
  const after = resultsSnapshot(reopened);
  assert.deepEqual(after, before, "the results screen is restored exactly");
  assert.equal(reopened.text("#stopwatch-display"), "00:12:34", "the header stopwatch shows the real duration after a reload");
  assert.equal(sendStatus(reopened).state, "success");
  assert.equal(server.count, 1, "a confirmed attempt is not sent again on reload");
  const teacher = teacherKeySnapshot(reopened);
  assert.equal(teacher.count, 25);

  /* Try Again starts a clean attempt. */
  reopened.click("button[onclick='tryAgain()']");
  assert.equal(reopened.screen(), "welcome");
  assert.equal(reopened.$("#student-name-input").value, "");
  assert.equal(reopened.storage.getItem(STORAGE_KEY), null);
  assert.equal(sendStatus(reopened).state, "idle");
});

test("the page stays usable when the result cannot be sent", async () => {
  const page = await open({ server: new FakeServer(["network"], "network") });
  await takeExamInUi(page, { name: "Mira", answers: sheetOf(page.questions, correctAnswer), elapsedMs: 60000 });
  page.click("#btn-submit-exam");
  await settle();
  assert.equal(page.screen(), "results");
  assert.ok(page.text("#res-score-marks") === "100");
  await page.clock.advance(7000); /* the two retry waits */
  await settle();
  assert.equal(sendStatus(page).state, "failed");
  assert.ok(page.visible("#send-status"));
  assert.ok(page.visible("#resend-result-btn"));
  assert.match(sendStatus(page).text, /could not be sent/);
  assert.match(sendStatus(page).arabic, /تعذّر إرسال النتيجة/);
  assert.equal(page.downloads.length, 1, "the report is still downloaded");
  assert.ok(page.$("#detailed-review-list > div"));
  assert.equal(TEACHER_PASSWORD, "somer173");
});

/**
 * The page itself: what changed from the original (and nothing else), truthful privacy wording,
 * the interface from start to results, and the build that the site's deployment runs.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  ATTEMPT_KEY, DIST_HTML, EXAM_DIR, EXAM_DIR_NAME, FakeServer, FakeStorage, ORIGINAL_HTML, SHEETS_TOKEN, SHEETS_URL, SOURCE_HTML, answerInUi,
  correctAnswer, openExam, sendStatus, settle, sheetOf, startInUi, submitExamInUi, takeExamInUi, wrongAnswer,
} from "./harness.mjs";
import { ADDED_BLOCKS, CHANGED_LINES, PUBLISHED_PRIVACY_LINE, lineDiff } from "./differences.mjs";

const html = readFileSync(SOURCE_HTML, "utf8");
const originalHtml = readFileSync(ORIGINAL_HTML, "utf8");
const TEACHER_PASSWORD = "somer173"; /* the original's; unchanged */

test("folder, EXAM_ID and title", () => {
  assert.equal(EXAM_DIR_NAME, "grade4-english-grammar-mahmoud");
  const ids = [...html.matchAll(/\bEXAM_ID\s*=\s*["']([^"']*)["']/g)].map((match) => match[1]);
  assert.deepEqual(ids, [EXAM_DIR_NAME], "one EXAM_ID literal, equal to the folder name");
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/)[1], "English Grammar Mahmoud");
  /* What the landing page reads to file the examination: title + folder name. */
  const evidence = ("English Grammar Mahmoud " + EXAM_DIR_NAME).toLowerCase();
  assert.match(evidence, /grade[-_ ]?4\b/);
  assert.match(evidence, /english/);
  assert.ok(!/arabic|math|physics|chemistry|science|عربي|رياضيات|فيزياء|كيمياء|علوم/.test(evidence), "no word of another subject");
});

test("every difference from the original is documented, and there is no other", () => {
  const { removed, added } = lineDiff(originalHtml.split("\n"), html.split("\n"));
  assert.deepEqual(removed.map((item) => item.text.trim()), CHANGED_LINES.map((change) => change.original));
  const replacements = new Set(CHANGED_LINES.map((change) => change.published));
  const replaced = added.filter((item) => replacements.has(item.text.trim()));
  assert.equal(replaced.length, CHANGED_LINES.length);
  for (const change of CHANGED_LINES) {
    assert.ok(change.why.length > 20, change.what);
    assert.equal(html.split("\n").filter((line) => line.trim() === change.published).length, 1, change.what);
  }
  /* The added lines form exactly the documented blocks, in order. */
  const blocks = [];
  let previous = -2;
  for (const item of added.filter((line) => !replacements.has(line.text.trim()))) {
    if (item.line !== previous + 1) blocks.push(0);
    blocks[blocks.length - 1] += 1;
    previous = item.line;
  }
  assert.deepEqual(blocks, ADDED_BLOCKS.map((block) => block.lines));
  assert.equal(html.split("\n").length - originalHtml.split("\n").length, ADDED_BLOCKS.reduce((sum, block) => sum + block.lines, 0));
});

test("the original design is kept: every CSS rule, every element id, the same outside resources", () => {
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
  assert.deepEqual(after.filter((id) => !before.includes(id)), ["send-note", "send-status", "send-status-text", "send-status-text-ar", "resend-result-btn"]);
  assert.deepEqual(before.filter((id) => !after.includes(id)), []);
  const resources = (text) => [...text.matchAll(/<(?:script|link|img|iframe|audio|video|source)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(resources(html), resources(originalHtml), "nothing new is loaded from the network");
  assert.deepEqual([...html.matchAll(/https?:\/\/[^\s"'`)<]+/g)].map((match) => match[0]).filter((url) => !originalHtml.includes(url)), [SHEETS_URL]);
  assert.equal((html.match(/<script\b/g) || []).length, 2, "the original's two script tags");
  assert.equal(html.match(/<html[^>]*>/)[0], '<html lang="en">');
  assert.ok(!/arena/i.test(html));
});

test("privacy wording is true: the false sentences are gone and the student is told before starting", async () => {
  for (const claim of ["No student answers were sent", "sent to a server", "generated locally", "calculated locally", "internal reference", "course repository"]) {
    assert.ok(originalHtml.toLowerCase().includes(claim.toLowerCase()), "the original said: " + claim);
    assert.ok(!html.toLowerCase().includes(claim.toLowerCase()), "the page still says: " + claim);
  }
  /* Nothing the student can read (markup and the texts the script writes) promises more than the page does. */
  const readable = html.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const claim of [/nothing is sent/i, /never leaves?/i, /stays? on (this|your) device/i, /not (sent|shared|uploaded)/i, /no data/i, /offline/i, /confidential/i, /\bprivate\b/i, /\bsecurely\b/i, /encrypted/i]) {
    assert.ok(!claim.test(readable), String(claim));
  }
  const page = await openExam({ file: SOURCE_HTML });
  assert.equal(page.screen(), "start");
  assert.ok(page.visible("#send-note"));
  assert.equal(page.text("#send-note"), "When you submit the test, your name, result and answers are sent to your teacher.");
  /* Still true and unchanged: answers are kept on the device while the test is taken. */
  assert.ok(page.text(".start-card").includes("Your answers save automatically."));
  assert.ok(page.text(".side-note").includes("Your answers are saved on this device automatically."));
  await submitExamInUi(page, {});
  assert.ok(page.text(".results-footer").startsWith("Report generated on this device; your result and answers are also sent to your teacher."));
  assert.ok(page.text("#screen-results footer").includes("All marks are calculated on this device. Your result and answers are sent to your teacher when you submit."));
  const report = await page.downloadText();
  assert.ok(report.includes("\r\n" + PUBLISHED_PRIVACY_LINE + "\r\n"));
  /* The original's own warning about the teacher password is kept as it is. */
  assert.ok(page.text("#teacherInlinePanel").includes("This is an interface lock only — not encryption or secure authentication."));
  page.close();
});

test("delivery status element: announced politely, hidden until there is something to say, button separate", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  const box = page.$("#send-status");
  assert.equal(box.getAttribute("role"), "status");
  assert.equal(box.getAttribute("aria-live"), "polite");
  assert.equal(box.getAttribute("data-send-status"), "idle");
  assert.equal(box.hidden, true);
  assert.ok(box.closest("#screen-results"), "it lives on the results screen");
  const button = page.$("#resend-result-btn");
  assert.equal(button.tagName, "BUTTON");
  assert.equal(button.getAttribute("type"), "button");
  assert.equal(button.hidden, true);
  assert.equal(page.text("#resend-result-btn"), "↻ Resend Result · إعادة إرسال النتيجة");
  assert.notEqual(button, page.$("#downloadBtn"));
  assert.notEqual(button, page.$("#retryBtn"));
  const arabic = page.$("#send-status-text-ar");
  assert.equal(arabic.getAttribute("lang"), "ar");
  assert.equal(arabic.getAttribute("dir"), "rtl");
  assert.equal(button.querySelector("span").getAttribute("dir"), "rtl");
  assert.equal(sendStatus(page).visible, false);
  page.close();
});

test("start: a name is required; the timer and the first question appear after Start", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  startInUi(page, "   ");
  assert.equal(page.screen(), "start");
  assert.ok(page.$("#nameError").classList.contains("show"));
  assert.equal(page.storage.getItem(ATTEMPT_KEY), null);
  startInUi(page, "Mahmoud");
  assert.equal(page.screen(), "test");
  assert.ok(!page.$("#nameError").classList.contains("show"));
  assert.equal(page.$$("#palette .pal-btn").length, 25);
  assert.equal(page.text("#sideAnswered"), "0 / 25");
  assert.equal(page.$("#submitBtn").disabled, true);
  assert.equal(page.$("#prevBtn").disabled, true);
  assert.ok(page.text("#questionStage").includes(page.questions[0].task));
  await page.clock.advance(65000);
  assert.equal(page.text("#timerDisplay"), "00:01:05");
  assert.equal(page.server.count, 0);
  assert.equal(page.pageErrors.length, 0);
  page.close();
});

test("the test: every question type is answered through its own controls; Submit opens only when all 25 are answered", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  startInUi(page, "Mahmoud");
  const key = sheetOf(page.questions, correctAnswer);
  page.questions.forEach((q, index) => {
    assert.ok(page.text("#questionStage").includes(q.task), "Q" + q.id + " is on screen");
    assert.equal(page.$("#submitBtn").disabled, true, "before Q" + q.id);
    answerInUi(page, q, key[q.id]);
    assert.equal(page.text("#sideAnswered"), `${index + 1} / 25`);
    if (index < 24) page.click("#nextBtn");
  });
  assert.equal(page.$("#submitBtn").disabled, false);
  assert.deepEqual(JSON.parse(page.storage.getItem(ATTEMPT_KEY)).answers, JSON.parse(JSON.stringify(key)));
  /* Navigation: back, forward and the question map. */
  page.click("#prevBtn");
  assert.ok(page.text("#questionStage").includes(page.questions[23].task));
  page.$$("#palette .pal-btn")[4].click();
  assert.ok(page.text("#questionStage").includes(page.questions[4].task));
  /* Changing an answer afterwards is marked: Q5 with one pair wrong earns 3. */
  answerInUi(page, page.questions[4], { ...key[5], 0: "old" });
  page.click("#submitBtn");
  await settle();
  assert.equal(page.screen(), "results");
  assert.equal(page.text("#resultScore"), "99");
  assert.equal(page.server.requests[0].payload.summary.total, 99);
  assert.equal(page.pageErrors.length, 0);
  page.close();
});

test("screen-reader labels name what each control is for", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  startInUi(page, "Mahmoud");
  const labelsOf = (index) => {
    page.$$("#palette .pal-btn")[index].click();
    return page.$$("#questionStage select").map((select) => select.getAttribute("aria-label"));
  };
  assert.deepEqual(labelsOf(4), ["Match for tall", "Match for big", "Match for happy", "Match for fast"]);
  assert.deepEqual(labelsOf(8), ["Match for my", "Match for her", "Match for our", "Match for their"]);
  assert.deepEqual(labelsOf(2), ["Missing word for sentence 1"]);
  assert.deepEqual(labelsOf(15), ["Missing word for sentence 1", "Missing word for sentence 2", "Missing word for sentence 3"]);
  assert.ok(!page.html.includes("Possessive pronoun for"));
  assert.ok(!page.html.includes("Verb form for sentence"));
  page.close();
});

test("an unfinished test is resumed after a refresh, with its answers and its timer", async () => {
  const first = await openExam({ file: SOURCE_HTML });
  startInUi(first, "Mahmoud");
  answerInUi(first, first.questions[0], correctAnswer(first.questions[0]));
  first.click("#nextBtn");
  answerInUi(first, first.questions[1], correctAnswer(first.questions[1]));
  await first.clock.advance(90000);
  const second = await openExam({ file: SOURCE_HTML, storage: first.storage, clock: first.clock });
  assert.equal(second.screen(), "test");
  assert.equal(second.text("#sideAnswered"), "2 / 25");
  assert.ok(second.text("#questionStage").includes(second.questions[1].task), "the question the student was on");
  assert.equal(second.text("#timerDisplay"), "00:01:30");
  assert.equal(second.server.count, 0);
  second.close();
});

test("results, Try Again and a second attempt", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  await submitExamInUi(page, { name: "Mahmoud", answers: sheetOf(page.questions, wrongAnswer) });
  assert.equal(page.text("#resultScore"), "0");
  assert.equal(page.text("#performanceRank"), "🌱 Beginner");
  assert.equal(page.downloads[0].name, "Mahmoud_Minecraft_English_Report.txt");
  assert.equal(sendStatus(page).state, "success");
  page.click("#retryBtn");
  assert.equal(page.screen(), "start");
  assert.equal(page.$("#candidateName").value, "");
  assert.equal(page.storage.getItem(ATTEMPT_KEY), null);
  assert.equal(page.$("#send-status").hidden, true);
  assert.equal(page.text("#send-status-text"), "");
  await submitExamInUi(page, { name: "Mahmoud", elapsedMs: 60000 });
  assert.equal(page.text("#resultScore"), "100");
  assert.match(page.downloads[1].name, /^Mahmoud_Minecraft_English_Report_Attempt2_\d{8}-\d{4}\.txt$/);
  assert.equal(page.server.count, 2);
  assert.equal(new Set(page.server.attemptIds()).size, 2);
  assert.deepEqual(page.server.requests.map((request) => request.payload.summary.total), [0, 100]);
  assert.equal(page.pageErrors.length, 0);
  page.close();
});

test("teacher key: locked behind the original password; nothing internal is shown to the student", async () => {
  const page = await openExam({ file: SOURCE_HTML });
  /* Before submission there is no key and no answer on screen. */
  startInUi(page, "Mahmoud");
  assert.equal(page.visible("#teacherOpenBtn"), false);
  assert.equal(page.$$("#teacherKeyContent .key-card").length, 0);
  page.click("#retryBtn");
  await submitExamInUi(page, {});
  page.click("#teacherOpenBtn");
  page.$("#teacherPassword").value = "wrong";
  page.click("#teacherUnlockBtn");
  assert.ok(page.$("#teacherError").classList.contains("show"));
  assert.equal(page.$$("#teacherKeyContent .key-card").length, 0);
  assert.ok(!page.$("#teacherModal").classList.contains("open"));
  page.$("#teacherPassword").value = TEACHER_PASSWORD;
  page.click("#teacherUnlockBtn");
  assert.ok(page.$("#teacherModal").classList.contains("open"));
  assert.equal(page.$$("#teacherKeyContent .key-card").length, 25);
  page.click("#teacherCloseBtn");
  /* The delivery adds nothing to what the student can read: no token, id, address or sheet fields. */
  const payload = page.server.requests[0].payload;
  const body = page.document.body.cloneNode(true);
  for (const script of body.querySelectorAll("script")) script.remove();
  const visibleText = body.textContent;
  assert.ok(visibleText.includes("Your result was sent to your teacher ✓"));
  for (const secret of [SHEETS_TOKEN, SHEETS_URL, "script.google.com", payload.attemptId, "gradeLabel", "attemptId", "examId", "internal reference", "course repository"]) {
    assert.ok(!visibleText.includes(secret), secret);
  }
  for (const el of body.querySelectorAll("*")) {
    for (const attribute of el.attributes) assert.ok(!attribute.value.includes(SHEETS_TOKEN) && !attribute.value.includes(payload.attemptId), attribute.name);
  }
  const report = await page.downloadText();
  for (const secret of [SHEETS_TOKEN, SHEETS_URL, payload.attemptId, TEACHER_PASSWORD, "internal reference"]) assert.ok(!report.includes(secret), secret);
  assert.equal(page.pageErrors.length, 0);
  page.close();
});

test("the folder holds only what the deployment needs", () => {
  const entries = readdirSync(EXAM_DIR).filter((name) => !["node_modules", "dist"].includes(name)).sort();
  assert.deepEqual(entries, ["build.mjs", "index.html", "package-lock.json", "package.json", "tests"]);
  const pkg = JSON.parse(readFileSync(path.join(EXAM_DIR, "package.json"), "utf8"));
  assert.equal(pkg.name, EXAM_DIR_NAME);
  assert.equal(pkg.scripts.build, "node build.mjs");
  assert.deepEqual(Object.keys(pkg.dependencies || {}), []);
  assert.deepEqual(pkg.devDependencies, { jsdom: "29.1.1" });
  const lock = JSON.parse(readFileSync(path.join(EXAM_DIR, "package-lock.json"), "utf8"));
  assert.equal(lock.name, EXAM_DIR_NAME);
  assert.equal(lock.packages[""].devDependencies.jsdom, "29.1.1");
});

test("build: dist/index.html is the page, byte for byte, and works on its own", async () => {
  const out = execFileSync(process.execPath, ["build.mjs"], { cwd: EXAM_DIR, encoding: "utf8" });
  assert.match(out, /Built dist[\\/]index\.html from index\.html/);
  assert.match(out, /EXAM_ID: grade4-english-grammar-mahmoud/);
  assert.match(out, /title: English Grammar Mahmoud/);
  assert.ok(readFileSync(DIST_HTML).equals(readFileSync(SOURCE_HTML)));
  assert.deepEqual(readdirSync(path.dirname(DIST_HTML)), ["index.html"], "one self-contained file is published");
  const server = new FakeServer();
  const page = await openExam({ file: DIST_HTML, server, storage: new FakeStorage() });
  await submitExamInUi(page, {});
  assert.equal(page.text("#resultScore"), "100");
  assert.equal(server.requests[0].payload.examId, EXAM_DIR_NAME);
  assert.equal(sendStatus(page).state, "success");
  assert.equal(page.pageErrors.length, 0);
  page.close();
});

test("build: refuses to publish a page whose EXAM_ID, title or script is wrong", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "exam-build-"));
  const build = (folder, edit) => {
    const dir = path.join(tmp, folder);
    mkdirSync(dir, { recursive: true });
    cpSync(path.join(EXAM_DIR, "build.mjs"), path.join(dir, "build.mjs"));
    writeFileSync(path.join(dir, "index.html"), edit(html));
    return spawnSync(process.execPath, ["build.mjs"], { cwd: dir, encoding: "utf8" });
  };
  try {
    const good = build(EXAM_DIR_NAME, (text) => text);
    assert.equal(good.status, 0, good.stderr);
    const renamed = build("grade4-something-else", (text) => text);
    assert.equal(renamed.status, 1);
    assert.match(renamed.stderr, /EXAM_ID is "grade4-english-grammar-mahmoud" but this folder is "grade4-something-else"/);
    const cases = [
      [(text) => text.replace('const EXAM_ID = "grade4-english-grammar-mahmoud"', 'const EXAM_ID = "grade4-adam-test"'), /EXAM_ID is "grade4-adam-test"/],
      [(text) => text.replace("<title>English Grammar Mahmoud</title>", "<title>Another title</title>"), /EXAM_TITLE is "English Grammar Mahmoud" but the page <title> is "Another title"/],
      [(text) => text.replace("<title>English Grammar Mahmoud</title>", "<title> </title>"), /no <title>/],
      [(text) => text.replace("function bootApp() {", "function bootApp( {"), /does not parse/],
      [(text) => text.replace("<body>", '<body><img src="images/logo.png">'), /local files that would not be published: images\/logo\.png/],
    ];
    cases.forEach(([edit, message], i) => {
      const bad = build(EXAM_DIR_NAME + "/case" + i + "/" + EXAM_DIR_NAME, edit);
      assert.equal(bad.status, 1, String(message));
      assert.match(bad.stderr, message);
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

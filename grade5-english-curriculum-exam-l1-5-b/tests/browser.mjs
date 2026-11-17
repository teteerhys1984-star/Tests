/**
 * Real-browser test of the published exam (Chromium via Playwright).
 *
 * It serves the real production build and drives it exactly like a pupil:
 * entry screen → teacher gate → answer every question → submit → results →
 * report download → delivery to the teacher → refresh → new attempt.
 *
 * The Google Sheets endpoint is intercepted by Playwright (never reached),
 * so no real student data ever leaves the machine.
 *
 * Run with:
 *   CHROMIUM_PATH=/path/to/chromium node tests/browser.mjs
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const STORAGE_KEY = "grade5-english-curriculum-exam-l1-5-b-attempt-v1";
const EXAM_ID = "grade5-english-curriculum-exam-l1-5-b";
const EXAM_TITLE = "Grade 5 English Curriculum Exam L1-5 B";

const portProbe = createServer();
await new Promise((done) => portProbe.listen(0, "127.0.0.1", done));
const port = portProbe.address().port;
await new Promise((done) => portProbe.close(done));
const base = `http://127.0.0.1:${port}`;

const server = spawn(
  process.execPath,
  [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { stdio: "ignore" },
);
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited with code ${server.exitCode}`);
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* Server is still starting. */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Vite did not start");
}

/** Serves a folder over HTTP so the built page can be opened directly. */
function createStaticServer(root) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".woff2": "font/woff2",
    ".jpg": "image/jpeg",
    ".png": "image/png",
  };
  const httpServer = createHttpServer((req, res) => {
    const requested = decodeURIComponent((req.url || "/").split("?")[0]);
    const relative = normalize(requested).replace(/^(\.\.[/\\])+/, "");
    let file = join(root, relative);
    try {
      if (!readFileSync(file)) throw new Error("missing");
    } catch {
      file = join(root, "index.html");
    }
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return {
    listen: () =>
      new Promise((done) => {
        httpServer.listen(0, "127.0.0.1", () => done(httpServer.address().port));
      }),
    close: () => new Promise((done) => httpServer.close(done)),
  };
}

async function noOverflow(page, name) {
  const d = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert.ok(d.page <= d.viewport, `${name}: page overflow ${JSON.stringify(d)}`);
}

/** Answers one question the way a pupil would, using the real data. */
async function answerQuestion(page, question) {
  for (const part of question.parts) {
    if (part.type === "text") {
      await page.locator('input[type="text"]').first().fill(part.accept[0]);
    } else {
      const group = page.getByRole("radiogroup", { name: part.prompt, exact: true }).first();
      await group.getByRole("radio", { name: part.accept[0], exact: true }).first().click();
    }
  }
}

try {
  await waitForServer();

  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  // No sound device in CI — the app degrades gracefully, but stub it anyway.
  await context.addInitScript(() => {
    window.AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          frequency: { value: 0, setValueAtTime() {} },
          type: "",
          connect() {},
          start() {},
          stop() {},
        };
      }
      createGain() {
        return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
      }
      close() {
        return Promise.resolve();
      }
    };
  });

  // The delivery endpoint is intercepted — the live sheet is never contacted.
  let deliveryShouldFail = false;
  const deliveries = [];
  await context.route("https://script.google.com/**", async (route) => {
    const request = route.request();
    deliveries.push({
      body: request.postData(),
      contentType: request.headers()["content-type"] ?? "",
    });
    if (deliveryShouldFail) {
      await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":false}' });
    } else {
      await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":true}' });
    }
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  /* ---- entry screen ------------------------------------------------ */
  await page.goto(base, { waitUntil: "networkidle" });
  await noOverflow(page, "desktop welcome");

  assert.equal(await page.title(), EXAM_TITLE);
  const h1 = await page.locator("h1").first().innerText();
  assert.match(h1, /Grade 5/i);
  assert.match(h1, /Curriculum Exam L1-5 B/i);
  const body = await page.locator("body").innerText();
  assert.match(body, /Semester 1/i);
  assert.match(body, /Grade 5 · English · Semester 1/i);
  assert.match(body, /50 questions/i);
  assert.match(body, /100/);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), null);
  const aKey = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), aKey), null);

  // No external font / stylesheet request may leave the page.
  const externalRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(base)) externalRequests.push(url);
  });

  /* ---- teacher gate ------------------------------------------------ */
  await page.getByRole("button", { name: "Teacher Answer Key" }).click();
  const gateInput = page.locator("#teacher-pass");
  await gateInput.fill("wrong");
  await page.getByRole("button", { name: "Open Answer Key" }).click();
  assert.match(await page.locator("body").innerText(), /Wrong password/);
  await gateInput.fill("somer173");
  await page.getByRole("button", { name: "Open Answer Key" }).click();
  const keyText = await page.locator("body").innerText();
  assert.match(keyText, /All 50 questions · 100 marks/);
  assert.match(keyText, /Teacher Answer Key · Grade 5 · Semester 1 · Model B/);
  assert.match(keyText, /Grade 5 English Curriculum Exam L1-5 B/);
  await page.getByRole("button", { name: "← Back" }).click();

  /* ---- start ------------------------------------------------------- */
  await page.getByLabel("Student's full name").fill("Browser Student");
  await page.getByRole("button", { name: "Start Exam" }).click();
  await page.getByRole("button", { name: "Sound is on — turn it off" }).waitFor();
  assert.match(await page.locator("header").first().innerText(), /Grade 5 English Curriculum Exam L1-5 B/);
  assert.match(await page.locator("header").first().innerText(), /Semester 1/);
  assert.equal(await page.getByText("Correct answer", { exact: false }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Submit Exam" }).isDisabled(), true);
  await noOverflow(page, "desktop active");

  const questions = await page.evaluate(async () => (await import("/src/data/questions.ts")).QUESTIONS);
  assert.equal(questions.length, 50);
  assert.equal(
    questions.reduce((sum, q) => sum + q.parts.length, 0),
    59,
  );

  const storedAttempt = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(storedAttempt.model, "B");
  assert.ok(storedAttempt.attemptId && storedAttempt.attemptId.length > 8);

  /* ---- answer every question -------------------------------------- */
  for (let index = 0; index < questions.length; index += 1) {
    await answerQuestion(page, questions[index]);
    if (index < questions.length - 1) {
      await page.getByRole("button", { name: "Next →" }).click();
    }
  }
  assert.equal(await page.getByRole("button", { name: "Submit Exam" }).isDisabled(), false);
  assert.match(await page.locator("body").innerText(), /50\s*\/\s*50/);

  /* ---- first submission fails (3 attempts, 2 s + 5 s) -------------- */
  deliveryShouldFail = true;
  await page.getByRole("button", { name: "Submit Exam" }).click();
  await page.getByText("Question-by-question review").waitFor();
  assert.match(await page.locator("h1").first().innerText(), /Browser Student/);
  const scoreText = await page.locator("body").innerText();
  assert.match(scoreText, /out of 100/i);
  assert.match(scoreText, /Excellent/);
  assert.match(scoreText, /100\/100/);
  await noOverflow(page, "desktop results");
  assert.equal(deliveries.length, 3);
  await page.getByText(/could not be sent yet/).waitFor({ timeout: 20000 });
  assert.equal(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.attemptId, `pending:${EXAM_ID}:${storedAttempt.attemptId}`),
    storedAttempt.attemptId,
  );

  /* ---- report ------------------------------------------------------ */
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download Report/ }).click(),
  ]);
  assert.match(download.suggestedFilename(), /^Browser-Student-grade5-unit1-model-b-report\.txt$/);
  const report = await readFile(await download.path(), "utf8");
  assert.match(report, /GRADE 5 ENGLISH CURRICULUM EXAM L1-5 B/);
  assert.match(report, /Semester 1/);
  assert.match(report, /Student name\s+: Browser Student/);
  assert.match(report, /Final score\s+: 100 \/ 100/);
  assert.equal((report.match(/^QUESTION \d+ of 50/gm) || []).length, 50);

  /* ---- manual resend with the same attemptId ----------------------- */
  deliveryShouldFail = false;
  await page.getByRole("button", { name: "Resend result" }).click();
  await page.getByText("Your result was sent to your teacher.").waitFor({ timeout: 20000 });
  assert.equal(deliveries.length, 4);
  const payload = JSON.parse(deliveries[3].body);
  assert.match(deliveries[3].contentType, /text\/plain/);
  assert.equal(payload.attemptId, storedAttempt.attemptId);
  assert.equal(payload.examId, EXAM_ID);
  assert.equal(payload.examTitle, EXAM_TITLE);
  assert.equal(payload.studentName, "Browser Student");
  assert.equal(payload.summary.total, 100);
  assert.equal(payload.summary.max, 100);
  assert.equal(payload.summary.gradeLabel, "ممتاز");
  assert.equal(payload.details.length, 59);
  assert.equal(payload.lessons.length, 5);
  assert.deepEqual(
    payload.lessons.map((l) => l.awarded),
    [20, 20, 20, 20, 20],
  );
  assert.deepEqual(Object.keys(payload).sort(), [
    "attemptId",
    "details",
    "elapsedSec",
    "examId",
    "examTitle",
    "lessons",
    "reportText",
    "startAt",
    "studentName",
    "submitAt",
    "summary",
    "token",
  ]);
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), `sent:${EXAM_ID}:${storedAttempt.attemptId}`) !== null,
    true,
  );

  /* ---- refresh keeps the result and does not resend ---------------- */
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Your result was sent to your teacher.").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  assert.equal(deliveries.length, 4, "a delivered attempt must not be sent twice");

  /* ---- new attempt -------------------------------------------------- */
  await page.getByRole("button", { name: "Start a new attempt" }).click();
  await page.getByLabel("Student's full name").waitFor();
  assert.equal(await page.getByLabel("Student's full name").inputValue(), "");
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), null);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), aKey), null);

  assert.deepEqual(errors, []);
  assert.deepEqual(
    externalRequests.filter(
      (u) => !u.startsWith("https://script.google.com/") && !u.startsWith("https://wa.me/"),
    ),
    [],
    "the exam must not request any external resource",
  );
  console.log("PASS: entry, teacher gate, all 50 questions, failed delivery, report, resend and restart");

  /* ---- responsive layouts ------------------------------------------ */
  for (const [name, width, height] of [
    ["phone", 390, 844],
    ["small phone", 320, 740],
    ["tablet", 768, 1024],
  ]) {
    const responsive = await browser.newContext({ viewport: { width, height } });
    const view = await responsive.newPage();
    await view.goto(base, { waitUntil: "networkidle" });
    await noOverflow(view, `${name} welcome`);
    await view.getByLabel("Student's full name").fill("Sam");
    await view.getByRole("button", { name: "Start Exam" }).click();
    await noOverflow(view, `${name} active`);
    await responsive.close();
  }
  console.log("PASS: phone, small-phone and tablet layouts");

  /* ---- the published production file -------------------------------- */
  const dist = resolve("dist/index.html");
  await stat(dist);
  const staticServer = createStaticServer(resolve("dist"));
  const staticPort = await staticServer.listen();
  const staticBase = `http://127.0.0.1:${staticPort}`;

  const prodContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const prodPage = await prodContext.newPage();
  const prodErrors = [];
  const prodExternal = [];
  prodPage.on("pageerror", (error) => prodErrors.push(error.message));
  prodPage.on("request", (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(staticBase)) prodExternal.push(url);
  });
  await prodPage.goto(staticBase, { waitUntil: "networkidle" });

  assert.equal(await prodPage.title(), EXAM_TITLE);
  assert.match(await prodPage.locator("h1").first().innerText(), /Curriculum Exam L1-5 B/i);
  assert.deepEqual(prodExternal, [], "the published page must not request any external resource");

  // The built page must have the local font really applied, not a fallback.
  const fontFamily = await prodPage.evaluate(() => {
    const el = document.querySelector("h1");
    return el ? getComputedStyle(el).fontFamily : "";
  });
  assert.match(fontFamily, /Cairo/);

  await prodPage.getByLabel("Student's full name").fill("Prod Student");
  await prodPage.getByRole("button", { name: "Start Exam" }).click();
  await prodPage.getByRole("button", { name: "Submit Exam" }).waitFor();
  assert.equal(await prodPage.getByRole("button", { name: "Submit Exam" }).isDisabled(), true);
  await noOverflow(prodPage, "production active");

  await prodPage.getByRole("button", { name: "Sound is on — turn it off" }).click();
  assert.equal(await prodPage.getByRole("button", { name: "← Previous" }).isDisabled(), true);
  await prodPage.getByRole("button", { name: "Next →" }).click();
  assert.match(await prodPage.locator("nav span").last().innerText(), /Question 2 of 50/);
  await prodPage.getByRole("button", { name: "← Previous" }).click();
  assert.match(await prodPage.locator("nav span").last().innerText(), /Question 1 of 50/);
  assert.deepEqual(prodErrors, []);
  await prodContext.close();
  await staticServer.close();
  console.log("PASS: the published dist/index.html loads, uses the local Cairo font and asks for nothing external");
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((done) => server.once("exit", done));
  }
}

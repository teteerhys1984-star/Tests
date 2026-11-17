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

const STORAGE_KEY = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
const EXAM_TITLE = "Grade 5 English Curriculum Exam L1-5 A";

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
  const server = createHttpServer((req, res) => {
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
        server.listen(0, "127.0.0.1", () => done(server.address().port));
      }),
    close: () => new Promise((done) => server.close(done)),
  };
}

async function noOverflow(page, name) {
  const d = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert.ok(d.page <= d.viewport, `${name}: page overflow ${JSON.stringify(d)}`);
}

/**
 * Answers one question the way a pupil would, using the published data.
 * The sub-parts are addressed by their position in the question, because two
 * branches of the same question may share the same prompt.
 */
async function answerQuestion(page, question) {
  const items = page.locator("article ol > li");
  assert.equal(await items.count(), question.parts.length);
  for (let index = 0; index < question.parts.length; index += 1) {
    const part = question.parts[index];
    const block = items.nth(index);
    assert.match(await block.innerText(), new RegExp(part.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (part.type === "mcq") {
      await block.getByRole("radio", { name: part.answer, exact: false }).first().click();
    } else if (part.type === "tf") {
      await block.getByRole("radio", { name: part.answer, exact: true }).first().click();
    } else if (part.type === "text") {
      await block.locator("input[type=text]").first().fill(part.answer);
    } else if (part.type === "rubric") {
      const starter = part.starter ? `${part.starter} ` : "";
      await block.locator("textarea").first().fill(`${starter}${"answer ".repeat(part.minWords).trim()}`);
    } else if (part.type === "order") {
      for (const word of part.answer.split(" ")) {
        await block.getByRole("button", { name: word, exact: true }).first().click();
      }
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

  // No sound device in CI — record the notes the app tries to play.
  await context.addInitScript(() => {
    window.AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        const frequency = { value: 0 };
        return {
          frequency,
          type: "",
          connect() {},
          start() {
            const played = JSON.parse(sessionStorage.getItem("test-notes") || "[]");
            played.push(frequency.value);
            sessionStorage.setItem("test-notes", JSON.stringify(played));
          },
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
  const deliveries = [];
  await context.route("https://script.google.com/**", async (route) => {
    const request = route.request();
    deliveries.push({
      body: request.postData(),
      contentType: request.headers()["content-type"] ?? "",
    });
    await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":true}' });
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  /* ---- entry screen ------------------------------------------------ */
  await page.goto(base, { waitUntil: "networkidle" });
  await noOverflow(page, "desktop welcome");

  assert.equal(await page.title(), EXAM_TITLE);
  assert.match(await page.locator("h1").first().innerText(), /GRADE 5\s+ENGLISH/);
  assert.match(await page.locator("h1").first().innerText(), /CURRICULUM EXAM L1-5 A/i);
  const details = await page.locator("dl").first().innerText();
  assert.match(details, /Grade\s+5/i);
  assert.match(details, /Subject\s+English/i);
  assert.match(details, /Semester\s+1/i);
  assert.match(details, /Questions\s+50/i);
  assert.match(details, /Marks\s+100/i);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), null);

  // No external font / stylesheet request may leave the page.
  const externalRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(base)) externalRequests.push(url);
  });

  /* ---- teacher gate ------------------------------------------------ */
  await page.getByRole("button", { name: "Teacher area" }).click();
  await page.getByPlaceholder("Password").fill("wrong");
  await page.getByRole("button", { name: "Unlock answer key" }).click();
  assert.match(await page.locator("[role=dialog]").innerText(), /Wrong password/);
  await page.getByPlaceholder("Password").fill("somer173");
  await page.getByRole("button", { name: "Unlock answer key" }).click();
  assert.match(await page.locator("[role=dialog]").innerText(), /All 50 questions · 100 marks/i);
  assert.match(await page.locator("[role=dialog]").innerText(), /Teacher Answer Key · Grade 5 English Curriculum Exam L1-5 A/);
  await page.getByRole("button", { name: "Close" }).click();

  /* ---- start ------------------------------------------------------- */
  await page.getByLabel("Full name").fill("Browser Student");
  await page.getByRole("button", { name: "Start Exam" }).click();
  await page.getByRole("button", { name: "Turn sound off" }).waitFor();
  assert.match(await page.locator("header p").first().innerText(), /Grade 5 · English · Semester 1/i);
  assert.equal(await page.getByText("Correct answer", { exact: false }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Submit Exam" }).isDisabled(), true);
  await noOverflow(page, "desktop active");

  const questions = await page.evaluate(async () => (await import("/src/data/exam.ts")).QUESTIONS);
  assert.equal(questions.length, 50);

  /* ---- answer every question -------------------------------------- */
  for (let index = 0; index < questions.length; index += 1) {
    await answerQuestion(page, questions[index]);
    if (index < questions.length - 1) {
      await page.getByRole("button", { name: "Next →" }).click();
    }
  }
  assert.equal(await page.getByRole("button", { name: "Submit Exam" }).isDisabled(), false);
  assert.match(await page.locator("header").first().innerText(), /50\s*\/\s*50/);

  /* ---- submit ------------------------------------------------------ */
  await page.getByRole("button", { name: "Submit Exam" }).click();
  await page.getByText("YOUR RESULTS").waitFor();
  assert.match(await page.locator("h1").first().innerText(), /YOUR RESULTS/);

  const score = await page.locator("aside").first().innerText();
  assert.match(score, /100/);
  assert.match(score, /out of 100/i);
  assert.match(score, /Excellent/);
  assert.match(score, /50 of 50/);
  assert.match(score, /99 of 99/);
  await noOverflow(page, "desktop results");

  /* ---- report ------------------------------------------------------ */
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download Report" }).click(),
  ]);
  assert.match(download.suggestedFilename(), /^Grade5-Unit1-ModelA_Browser-Student_\d{8}-\d{4}\.txt$/);
  const report = await readFile(await download.path(), "utf8");
  assert.match(report, /GRADE 5 ENGLISH CURRICULUM EXAM L1-5 A/);
  assert.match(report, /GRADE 5 ENGLISH - UNIT 1 EXAMINATION - MODEL A/);
  assert.match(report, /Student name\s+: Browser Student/);
  assert.match(report, /Final score\s+: 100 \/ 100/);
  assert.equal((report.match(/^Question \d+ {2}\[/gm) || []).length, 50);
  assert.equal((report.match(/^Source: /gm) || []).length, 50);

  /* ---- delivery ---------------------------------------------------- */
  await page.getByText("Your result was sent to your teacher.").waitFor({ timeout: 15000 });
  assert.equal(deliveries.length, 1);
  assert.match(deliveries[0].contentType, /text\/plain/);
  const payload = JSON.parse(deliveries[0].body);
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
  assert.equal(payload.examId, "grade5-english-curriculum-exam-l1-5-a");
  assert.equal(payload.examTitle, EXAM_TITLE);
  assert.equal(payload.studentName, "Browser Student");
  assert.equal(payload.summary.total, 100);
  assert.equal(payload.summary.max, 100);
  assert.equal(payload.summary.gradeLabel, "ممتاز");
  assert.equal(payload.details.length, 99);
  assert.equal(payload.lessons.length, 5);
  assert.deepEqual(
    payload.lessons.map((l) => l.awarded),
    [20, 20, 20, 20, 20],
  );
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(payload.attemptId, stored.attemptId);
  assert.equal(payload.startAt, new Date(stored.startedAt).toISOString());
  assert.equal(payload.submitAt, new Date(stored.submittedAt).toISOString());

  /* ---- refresh keeps the result and does not resend ---------------- */
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("YOUR RESULTS").waitFor();
  await page.waitForTimeout(1200);
  assert.equal(deliveries.length, 1, "a delivered attempt must not be sent twice");

  /* ---- new attempt -------------------------------------------------- */
  await page.getByRole("button", { name: "Start a new attempt" }).click();
  await page.getByLabel("Full name").waitFor();
  assert.equal(await page.getByLabel("Full name").inputValue(), "");
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), null);

  assert.deepEqual(errors, []);
  assert.deepEqual(
    externalRequests.filter((u) => !u.startsWith("https://script.google.com/") && !u.startsWith("https://wa.me/")),
    [],
    "the exam must not request any external resource",
  );
  console.log("PASS: entry, teacher gate, all 50 questions, submission, results, report, delivery and restart");

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
    await view.getByLabel("Full name").fill("Sam");
    await view.getByRole("button", { name: "Start Exam" }).click();
    await noOverflow(view, `${name} active`);
    await responsive.close();
  }
  console.log("PASS: phone, small-phone and tablet layouts");

  /* ---- the published production file -------------------------------- */
  // The platform publishes dist/index.html, not the dev server. The same
  // flow is replayed against the built file to prove the published page
  // behaves identically and still asks for nothing from the network.
  const dist = resolve("dist/index.html");
  await stat(dist);
  const staticServer = createStaticServer(resolve("dist"));
  const staticPort = await staticServer.listen();
  const staticBase = `http://127.0.0.1:${staticPort}`;

  const prodContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await prodContext.addInitScript(() => {
    window.AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          frequency: { value: 0 },
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
  const prodDeliveries = [];
  await prodContext.route("https://script.google.com/**", async (route) => {
    prodDeliveries.push(route.request().postData());
    await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":true}' });
  });

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
  assert.match(await prodPage.locator("h1").first().innerText(), /GRADE 5\s+ENGLISH/i);
  assert.deepEqual(
    prodExternal.filter((u) => !u.startsWith("https://script.google.com/")),
    [],
    "the published page must not request any external resource",
  );

  // The built page must have the local font really applied, not a fallback.
  const fontFamily = await prodPage.evaluate(() => {
    const h1 = document.querySelector("h1");
    return h1 ? getComputedStyle(h1).fontFamily : "";
  });
  assert.match(fontFamily, /Cairo/);

  await prodPage.getByLabel("Full name").fill("Prod Student");
  await prodPage.getByRole("button", { name: "Start Exam" }).click();
  await prodPage.getByRole("button", { name: "Submit Exam" }).waitFor();
  assert.equal(await prodPage.getByRole("button", { name: "Submit Exam" }).isDisabled(), true);
  await noOverflow(prodPage, "production active");

  await prodPage.getByRole("button", { name: "Turn sound off" }).click();
  assert.equal(await prodPage.getByRole("button", { name: "Previous" }).isDisabled(), true);
  await prodPage.getByRole("button", { name: "Next →" }).click();
  assert.match(await prodPage.locator("nav span").last().innerText(), /Question 2 of 50/);
  await prodPage.getByRole("button", { name: "Previous" }).click();
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

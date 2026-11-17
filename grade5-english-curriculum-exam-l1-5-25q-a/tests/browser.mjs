/**
 * Real-browser end-to-end verification (Chromium via Playwright).
 *
 * Tests both the Vite dev server and the single-file `dist/index.html` bundle
 * across desktop, tablet, and mobile viewports (no horizontal overflow, Cairo
 * font applied, start screen, teacher gate, answering all 25 questions / 98
 * sub-items, localStorage reload persistence, submission, TXT report download,
 * mocked Google Sheets POST verification, duplicate-send prevention on reload,
 * and retake).
 *
 * Google Apps Script requests are intercepted via Playwright route mocking so
 * zero data ever leaves the machine.
 *
 * Run with:
 *   CHROMIUM_PATH=/path/to/chromium node tests/browser.mjs
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "node:net";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const STORAGE_KEY = "grade5-english-curriculum-exam-l1-5-25q-a-attempt-v1";
const EXAM_ID = "grade5-english-curriculum-exam-l1-5-25q-a";
const EXAM_TITLE = "Grade 5 English Curriculum Exam L1-5 (25Q) A";

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
      /* waiting */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Vite dev server did not start");
}

function createStaticServer(root) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".woff2": "font/woff2",
    ".jpg": "image/jpeg",
    ".png": "image/png",
  };
  const srv = createHttpServer((req, res) => {
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
        srv.listen(0, "127.0.0.1", () => done(srv.address().port));
      }),
    close: () => new Promise((done) => srv.close(done)),
  };
}

async function noOverflow(page, name) {
  const d = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  assert.ok(d.page <= d.viewport, `${name}: horizontal overflow ${JSON.stringify(d)}`);
}

async function answerQuestion(page, question) {
  const blocks = page.locator("article > div.space-y-4 > div");
  assert.equal(await blocks.count(), question.items.length);
  for (let i = 0; i < question.items.length; i += 1) {
    const item = question.items[i];
    const block = blocks.nth(i);
    if (item.kind === "tf" || item.kind === "mc") {
      await block.getByRole("button", { name: item.answer, exact: true }).click();
    } else if (item.kind === "text") {
      await block.locator("input[type=text]").fill(item.answer);
    } else if (item.kind === "order") {
      for (const word of item.answer.split("|")) {
        await block.getByRole("button", { name: word, exact: true }).first().click();
      }
    }
  }
}

try {
  await waitForServer();

  let executablePath = process.env.CHROMIUM_PATH || undefined;
  if (!executablePath) {
    try {
      const sparticuz = await import("@sparticuz/chromium");
      executablePath = await sparticuz.default.executablePath();
    } catch {
      /* fallback to playwright default */
    }
  }

  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  await context.addInitScript(() => {
    window.AudioContext = class {
      currentTime = 0;
      state = "running";
      destination = {};
      createOscillator() {
        return {
          frequency: { value: 0, setValueAtTime() {} },
          type: "",
          connect(node) {
            return node;
          },
          start() {},
          stop() {},
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect(node) {
            return node;
          },
        };
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    };
  });

  const deliveries = [];
  await context.route("https://script.google.com/**", async (route) => {
    const req = route.request();
    deliveries.push({
      body: req.postData(),
      contentType: req.headers()["content-type"] ?? "",
    });
    await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":true}' });
  });

  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    const u = req.url();
    if (/^https?:/.test(u) && !u.startsWith(base)) externalRequests.push(u);
  });

  /* ---- Start Screen ---- */
  await page.goto(base, { waitUntil: "networkidle" });
  await noOverflow(page, "desktop start");
  assert.equal(await page.title(), EXAM_TITLE);
  assert.match(await page.locator("body").innerText(), /25 questions/);
  assert.match(await page.locator("body").innerText(), /100 marks/);

  /* ---- Teacher Key from Start Screen ---- */
  await page.getByRole("button", { name: "Teacher Answer Key" }).click();
  await page.getByLabel("Enter teacher password").fill("wrong");
  await page.getByRole("button", { name: "Unlock Answer Key" }).click();
  await page.getByText("Incorrect password.").waitFor();
  await page.getByLabel("Enter teacher password").fill("somer173");
  await page.getByRole("button", { name: "Unlock Answer Key" }).click();
  await page.getByText("25 questions · 100 marks · 98 sub-items").waitFor();
  await page.getByRole("button", { name: "Back" }).click();

  /* ---- Start Exam ---- */
  await page.getByLabel("Write your full name").fill("Browser Pupil");
  await page.getByRole("button", { name: "Start Exam" }).click();
  await page.getByRole("button", { name: /Submit Exam/ }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Submit Exam/ }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Teacher Answer Key" }).count(), 0);
  await noOverflow(page, "desktop exam");

  const questions = await page.evaluate(async () => (await import("/src/data/exam.ts")).QUESTIONS);
  assert.equal(questions.length, 25);

  /* ---- Answer first 5, reload to verify localStorage restore, finish all 25 ---- */
  for (let i = 0; i < 5; i += 1) {
    await answerQuestion(page, questions[i]);
    await page.getByRole("button", { name: "Next →" }).click();
  }
  await page.reload({ waitUntil: "networkidle" });
  assert.match(await page.locator("body").innerText(), /20\/98 parts/);
  assert.match(await page.locator("body").innerText(), /Question 6 of 25/i);

  for (let i = 5; i < questions.length; i += 1) {
    await answerQuestion(page, questions[i]);
    if (i < questions.length - 1) {
      await page.getByRole("button", { name: "Next →" }).click();
    }
  }
  assert.match(await page.locator("body").innerText(), /98\/98 parts/);
  assert.equal(await page.getByRole("button", { name: /Submit Exam/ }).isDisabled(), false);

  /* ---- Submit & Results ---- */
  await page.getByRole("button", { name: /Submit Exam/ }).click();
  await page.getByText("Result recorded and sent to the teacher's sheet.").waitFor({ timeout: 15000 });
  assert.match(await page.locator("header").innerText(), /100/);
  assert.match(await page.locator("header").innerText(), /Excellent/);
  await noOverflow(page, "desktop results");

  /* ---- Download Report ---- */
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download Report (TXT)" }).click(),
  ]);
  const reportText = await readFile(await download.path(), "utf8");
  assert.match(reportText, /GRADE 5 ENGLISH CURRICULUM EXAM L1-5 \(25Q\) A/);
  assert.match(reportText, /Final score\s+: 100 \/ 100/);

  /* ---- Mock Google Sheets Payload ---- */
  assert.equal(deliveries.length, 1);
  assert.match(deliveries[0].contentType, /text\/plain/);
  const payload = JSON.parse(deliveries[0].body);
  assert.equal(payload.examId, EXAM_ID);
  assert.equal(payload.examTitle, EXAM_TITLE);
  assert.equal(payload.summary.total, 100);
  assert.equal(payload.details.length, 98);
  assert.equal(payload.lessons.length, 5);

  /* ---- Refresh does not duplicate POST ---- */
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Result recorded and sent to the teacher's sheet.").waitFor();
  await page.waitForTimeout(800);
  assert.equal(deliveries.length, 1);

  /* ---- Retake Exam ---- */
  await page.getByRole("button", { name: "Retake Exam" }).click();
  await page.getByLabel("Write your full name").waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY), null);

  /* ---- Responsive viewports (Start, Active, Results & Teacher Key) ---- */
  for (const [label, width, height] of [
    ["mobile-390", 390, 844],
    ["small-phone-320", 320, 740],
    ["tablet-768", 768, 1024],
  ]) {
    const vc = await browser.newContext({ viewport: { width, height } });
    const vp = await vc.newPage();
    await vp.goto(base, { waitUntil: "networkidle" });
    await noOverflow(vp, `${label} start`);
    await vp.getByLabel("Write your full name").fill("Mobile Pupil");
    await vp.getByRole("button", { name: "Start Exam" }).click();
    await vp.getByRole("button", { name: /Submit Exam/ }).waitFor();
    await noOverflow(vp, `${label} active`);

    // Seed a submitted attempt in localStorage and verify Results & TeacherKey layouts
    await vp.route("https://script.google.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/plain", body: '{"ok":true}' });
    });
    await vp.evaluate(
      ([k, qs]) => {
        const answers = {};
        for (const q of qs) for (const it of q.items) answers[`${q.id}/${it.id}`] = it.answer;
        const att = {
          v: 1,
          attemptId: `resp-${k}`,
          name: "Mobile Pupil",
          startedAt: Date.now() - 60000,
          answers,
          currentIndex: 24,
          submittedAt: Date.now(),
        };
        localStorage.setItem(k, JSON.stringify(att));
        localStorage.setItem(`sent:grade5-english-curriculum-exam-l1-5-25q-a:${att.attemptId}`, new Date().toISOString());
      },
      [STORAGE_KEY, questions],
    );
    await vp.reload({ waitUntil: "networkidle" });
    await vp.getByRole("button", { name: "Download Report (TXT)" }).waitFor();
    await noOverflow(vp, `${label} results`);
    await vp.getByRole("button", { name: "Teacher Answer Key" }).first().click();
    await noOverflow(vp, `${label} teacher gate`);
    await vp.getByLabel("Enter teacher password").fill("somer173");
    await vp.getByRole("button", { name: "Unlock Answer Key" }).click();
    await vp.getByText("25 questions · 100 marks · 98 sub-items").waitFor();
    await noOverflow(vp, `${label} teacher unlocked`);
    await vc.close();
  }

  /* ---- Production dist/index.html bundle ---- */
  await stat(resolve("dist/index.html"));
  const staticSrv = createStaticServer(resolve("dist"));
  const staticPort = await staticSrv.listen();
  const staticBase = `http://127.0.0.1:${staticPort}`;

  const prodCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const prodPage = await prodCtx.newPage();
  const prodExternal = [];
  prodPage.on("pageerror", (e) => errors.push(e.message));
  prodPage.on("request", (req) => {
    const u = req.url();
    if (/^https?:/.test(u) && !u.startsWith(staticBase)) prodExternal.push(u);
  });
  await prodPage.goto(staticBase, { waitUntil: "networkidle" });
  assert.equal(await prodPage.title(), EXAM_TITLE);
  const fontFamily = await prodPage.evaluate(() => getComputedStyle(document.body).fontFamily);
  assert.match(fontFamily, /Cairo/);
  await noOverflow(prodPage, "production dist");
  await prodCtx.close();
  await staticSrv.close();

  assert.deepEqual(errors, []);
  assert.deepEqual(
    externalRequests.filter((u) => !u.startsWith("https://script.google.com/") && !u.startsWith("https://wa.me/")),
    [],
  );
  assert.deepEqual(
    prodExternal.filter((u) => !u.startsWith("https://script.google.com/") && !u.startsWith("https://wa.me/")),
    [],
  );
  console.log("PASS: full Chromium E2E suite (desktop, tablet, mobile, reload, report, Sheets mock, dist bundle)");
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((done) => server.once("exit", done));
  }
}

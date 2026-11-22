import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = 4175;
const url = `http://127.0.0.1:${port}/`;
const output = process.env.VISUAL_OUTPUT;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "ignore" });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch { /* Wait for Vite. */ }
    if (server.exitCode !== null) throw new Error("Vite exited before the browser check.");
    await delay(250);
  }
  throw new Error("Vite did not start in time.");
}

async function noHorizontalOverflow(page, width) {
  const measurement = await page.evaluate(() => ({ root: document.documentElement.scrollWidth, body: document.body.scrollWidth, viewport: innerWidth }));
  assert.equal(measurement.viewport, width);
  assert.ok(measurement.root <= width && measurement.body <= width, `Horizontal overflow at ${width}: ${JSON.stringify(measurement)}`);
}

async function capture(page, name) {
  if (output) await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}

async function inspectViewport(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: width >= 768 ? 900 : 780 }, acceptDownloads: true });
  const pageErrors = [];
  const dialogs = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", async (dialog) => { dialogs.push(dialog.type()); await dialog.dismiss(); });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".header-timer").count(), 0);
  await noHorizontalOverflow(page, width);
  await capture(page, `start-${width}`);

  if (width === 320) {
    await page.getByRole("button", { name: "بدء الاختبار" }).click();
    assert.equal(await page.locator("#name-error").innerText(), "اكتبي اسمك قبل بدء الاختبار.");
    assert.equal(await page.locator(".header-timer").count(), 0);
  }

  if (width === 390) {
    assert.equal((await page.request.get(`${url}audio/start.wav`)).status(), 200);
    assert.equal((await page.request.get(`${url}audio/submit.wav`)).status(), 200);
    await page.getByRole("button", { name: "كتم الصوت" }).click();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.getByRole("button", { name: "تشغيل الصوت" }).count(), 1);
    await page.getByRole("button", { name: "تشغيل الصوت" }).click();
  }

  const name = `ريم ${width}`;
  await page.locator("#student-name").fill(name);
  await page.getByRole("button", { name: "بدء الاختبار" }).click();
  await page.locator(".question-sheet").waitFor();
  assert.equal(await page.evaluate(() => window.scrollY), 0, `Start did not return to top at ${width}px`);
  const firstAttempt = await page.evaluate(() => JSON.parse(localStorage.getItem("physics-7-model-b-attempt-v1")));
  assert.equal(firstAttempt.status, "in_progress");
  assert.equal(firstAttempt.studentName, name);
  assert.equal(await page.locator(".header-timer").count(), 1);
  assert.ok(!(await page.locator("body").innerText()).includes("الإجابة الصحيحة"));
  await capture(page, `quiz-${width}`);

  if (width === 390) {
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "networkidle" });
    const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem("physics-7-model-b-attempt-v1")));
    assert.equal(resumed.startedAt, firstAttempt.startedAt);
    assert.notEqual(await page.locator(".header-timer time").innerText(), "00:00:00");
  }

  async function navigate(index) {
    if (width <= 780) {
      await page.locator(".mobile-map summary").click();
      await page.locator(".mobile-map .map-number").nth(index).click();
    } else {
      await page.locator(".exam-sidebar .map-number").nth(index).click();
    }
    assert.equal(await page.evaluate(() => window.scrollY), 0, `Navigation did not return to top at ${width}px`);
  }

  for (const [index, label] of [[1, "force"], [4, "motion"], [6, "route"], [7, "speedometer"]]) {
    await navigate(index);
    const measurement = await page.locator(".question-figure svg").evaluate((svg) => {
      const outer = svg.getBoundingClientRect();
      const mathematicalLabels = [...svg.querySelectorAll(".katex")].map((element) => element.getBoundingClientRect());
      return {
        width: outer.width,
        hasLabels: mathematicalLabels.length > 0,
        labelsFit: mathematicalLabels.every((rect) => rect.left >= outer.left - 1 && rect.right <= outer.right + 1 && rect.top >= outer.top - 1 && rect.bottom <= outer.bottom + 1),
        ratio: outer.width / outer.height,
      };
    });
    assert.ok(measurement.width > 200 && measurement.hasLabels && measurement.labelsFit, `${label} at ${width}: ${JSON.stringify(measurement)}`);
    await noHorizontalOverflow(page, width);
    if (output) await page.locator(".question-figure").screenshot({ path: `${output}/${label}-${width}.png` });
  }

  if (width === 390 || width === 1280) {
    await navigate(9);
    assert.equal(await page.getByRole("button", { name: "تسليم الاختبار" }).isDisabled(), true);
    await navigate(0);
    for (let index = 0; index < 10; index += 1) {
      if (index > 0) await page.getByRole("button", { name: "السؤال التالي" }).click();
      const branches = page.locator(".question-part");
      for (let branch = 0, count = await branches.count(); branch < count; branch += 1) {
        const item = branches.nth(branch);
        if (await item.locator(".answer-option").count()) await item.locator(".answer-option").first().click();
        else if (await item.locator("textarea").count()) await item.locator("textarea").fill("إجابة تفسيرية");
        else await item.locator("input").fill("1");
      }
    }
    const submit = page.getByRole("button", { name: "تسليم الاختبار" });
    assert.equal(await submit.isEnabled(), true);
    assert.ok(!(await page.locator("body").innerText()).includes("الإجابة الصحيحة"));
    await submit.click();
    await page.locator(".results-page .score-number").waitFor();
    assert.equal(await page.locator("#results-title").innerText().then((value) => value.includes(name)), true);
    assert.equal(dialogs.length, 0);
    const submitted = await page.evaluate(() => JSON.parse(localStorage.getItem("physics-7-model-b-attempt-v1")));
    assert.equal(submitted.status, "submitted");
    assert.ok(submitted.finishedAt >= submitted.startedAt);
    await noHorizontalOverflow(page, width);
    await capture(page, `results-${width}`);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "تنزيل تقرير TXT" }).click(),
    ]);
    console.log("Download filename:", download.suggestedFilename());
    assert.ok(download.suggestedFilename().includes(name.replace(/\s/g, "-")));
    const report = await readFile(await download.path(), "utf8");
    assert.ok(report.includes("السؤال 10:") && report.includes("الإجابة الصحيحة:") && report.includes(name));

    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".results-page .score-number").waitFor();
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem("physics-7-model-b-attempt-v1")))).startedAt, firstAttempt.startedAt);

    await page.locator(".teacher-entry").click();
    await page.locator("#teacher-password").fill("not-the-password");
    await page.getByRole("button", { name: "دخول", exact: true }).click();
    assert.equal(await page.locator(".form-error").count(), 1);
    await page.locator("#teacher-password").fill("somer173");
    await page.getByRole("button", { name: "دخول", exact: true }).click();
    await page.locator(".teacher-content").waitFor();
    assert.ok((await page.locator(".teacher-content").innerText()).includes("عشرة أسئلة"));
    await page.getByRole("button", { name: "إغلاق منطقة المعلم" }).click();

    await page.getByRole("button", { name: "بدء محاولة جديدة" }).click();
    assert.equal(await page.locator("#student-name").count(), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem("physics-7-model-b-attempt-v1")), null);
    assert.equal(await page.locator(".header-timer").count(), 0);
  }

  assert.deepEqual(pageErrors, [], `Browser errors at ${width}`);
  console.log(`Verified ${width}px: no overflow, diagrams legible, KaTeX labels contained, zero console errors.`);
  await page.close();
}

let browser;
try {
  await waitForServer();
  if (output) await mkdir(output, { recursive: true });
  // POSIX-only CI locales make Chromium replace Unicode filenames with "download".
  browser = await chromium.launch({ headless: true, env: { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" } });
  for (const width of [320, 375, 390, 430, 768, 1280]) await inspectViewport(browser, width);
  console.log("Browser smoke checks passed; full submission and report verified at 390px and 1280px.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
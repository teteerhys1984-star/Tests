import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const portProbe = createServer();
await new Promise((done) => portProbe.listen(0, '127.0.0.1', done));
const port = portProbe.address().port;
await new Promise((done) => portProbe.close(done));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Vite exited with code ${server.exitCode}`);
    try { if ((await fetch(base)).ok) return; } catch { /* Server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite did not start');
}

async function noOverflow(page, name) {
  const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert.ok(dimensions.page <= dimensions.viewport, `${name}: page overflow ${JSON.stringify(dimensions)}`);
}

async function fillQuestion(page, question) {
  for (let index = 0; index < question.parts.length; index++) {
    const part = question.parts[index];
    const container = page.locator('.question-panel .question-part').nth(index);
    if (part.type === 'text') await container.locator('input').fill(part.answer);
    else if (part.type === 'select') await container.locator('select').selectOption(part.answer);
    else await container.locator('.choice-option').nth(part.options.indexOf(part.answer)).click();
  }
}

try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.addInitScript(() => {
    // Instrument the locally generated notes without relying on an audio device in CI.
    window.AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        const frequency = { value: 0 };
        return { frequency, type: '', connect() {}, start() { const played = JSON.parse(sessionStorage.getItem('test-notes') || '[]'); played.push(frequency.value); sessionStorage.setItem('test-notes', JSON.stringify(played)); }, stop() {} };
      }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      close() { return Promise.resolve(); }
    };
  });
  await context.route('https://script.google.com/**', route => route.fulfill({status:200,contentType:'text/plain',body:'{"ok":true}'}));
  const page = await context.newPage();
  const errors = [];
  let dialogs = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => { dialogs++; await dialog.dismiss(); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await noOverflow(page, 'desktop welcome');
  assert.equal(await page.locator('a[href="https://wa.me/963930215022"]').count(), 1);
  assert.match(await page.locator('.contact-link').innerText(), /0930215022/);
  assert.match(await page.locator('.contact-link').innerText(), /المهندس سومر شاهين/);
  assert.equal(await page.evaluate(() => localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')), null);

  await page.getByRole('button', { name: 'Teacher area' }).click();
  await page.getByLabel('Teacher password').fill('wrong');
  await page.getByRole('button', { name: 'Open answer key' }).click();
  assert.equal(await page.getByRole('alert').innerText(), 'Incorrect password. Please try again.');
  assert.equal(await page.locator('.review-question').count(), 0);
  await page.getByLabel('Teacher password').fill('somer173');
  await page.getByRole('button', { name: 'Open answer key' }).click();
  assert.equal(await page.locator('.review-question').count(), 50);
  assert.match(await page.locator('.teacher-source-note').innerText(), /no original Lesson 1 scans/);
  await page.getByRole('button', { name: 'Back to exam' }).click();

  await page.getByRole('button', { name: 'Start Exam' }).click();
  assert.match(await page.locator('#name-error').innerText(), /enter your name/i);
  assert.equal(await page.evaluate(() => localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')), null);
  await page.getByRole('button', { name: 'Mute sound' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-sound-muted')), 'true');
  await page.getByRole('button', { name: 'Unmute sound' }).click();
  await page.getByLabel('Student name').fill('Alex Student');
  await page.getByRole('button', { name: 'Start Exam' }).click();
  assert.equal(await page.getByRole('button', { name: 'Teacher area' }).count(), 0);
  assert.equal(await page.getByText('Correct answer', { exact: false }).count(), 0);
  assert.equal(await page.getByText('Source:', { exact: false }).count(), 0);
  assert.equal((await page.evaluate(() => JSON.parse(sessionStorage.getItem('test-notes')))).length, 3);
  assert.equal(await page.locator('.exam-sidebar .submit-side').isDisabled(), true);
  await noOverflow(page, 'desktop active');

  // Leave one required sub-part blank while answering all the others.
  await page.locator('.question-panel .answer-input').nth(0).fill('meet');
  await page.getByRole('button', { name: 'Next question' }).click();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')));
  assert.equal(before.currentQuestion, 1);
  assert.deepEqual(before.answers['l1-01'], ['meet']);
  await page.waitForTimeout(1400);
  await page.reload({ waitUntil: 'networkidle' });
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')));
  assert.equal(restored.startedAt, before.startedAt);
  assert.equal(restored.currentQuestion, 1);
  assert.equal(restored.answers['l1-01'][0], 'meet');
  assert.ok(restored.elapsedMs >= 1000);
  assert.match(await page.locator('.timer-box strong').innerText(), /^00:00:0[1-9]$/);

  const questionData = await page.evaluate(async () => (await import('/src/examData.ts')).questions);
  for (let index = 1; index < questionData.length; index++) {
    await fillQuestion(page, questionData[index]);
    if (index < questionData.length - 1) await page.getByRole('button', { name: 'Next question' }).click();
  }
  assert.match(await page.locator('.sidebar-progress-line').innerText(), /49 \/ 50/);
  assert.equal(await page.locator('.exam-sidebar .submit-side').isDisabled(), true);
  await page.locator('.exam-sidebar').getByRole('button', { name: 'Question 1, not answered', exact: true }).click();
  assert.equal(await page.locator('.question-panel .answer-input').nth(0).inputValue(), 'meet');
  await page.locator('.question-panel .answer-input').nth(1).fill('old');
  assert.match(await page.locator('.sidebar-progress-line').innerText(), /50 \/ 50/);
  assert.equal(await page.locator('.exam-sidebar .submit-side').isEnabled(), true);
  await page.locator('.exam-sidebar .submit-side').click();
  assert.equal(dialogs, 0);
  assert.equal(await page.locator('.review-question').count(), 50);
  assert.match(await page.locator('.score-medal strong').innerText(), /100/);
  assert.match(await page.locator('.result-summary').innerText(), /50 fully correct/);
  assert.match(await page.locator('.result-summary').innerText(), /0 incorrect or partial/);
  assert.equal((await page.evaluate(() => JSON.parse(sessionStorage.getItem('test-notes')))).length, 6);
  const notes = await page.evaluate(() => JSON.parse(sessionStorage.getItem('test-notes')));
  assert.notDeepEqual(notes.slice(0, 3), notes.slice(3, 6));
  await noOverflow(page, 'desktop results');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download TXT report' }).click()]);
  assert.equal(download.suggestedFilename(), 'Grade4_English_Exam_Alex_Student.txt');
  const report = await readFile(await download.path(), 'utf8');
  assert.match(report, /Student: Alex Student/);
  assert.match(report, /Total score: 100 \/ 100/);
  assert.equal((report.match(/Question \d+ - Lesson/g) || []).length, 50);
  assert.equal((report.match(/Source:/g) || []).length, 50);
  const finished = await page.evaluate(() => JSON.parse(localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')));
  await page.waitForTimeout(1100);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')))).elapsedMs, finished.elapsedMs);
  assert.equal(await page.locator('.review-question').count(), 50);
  assert.equal(await page.locator('a[href$=".zip"]').count(), 0);
  await page.getByRole('button', { name: 'Start a new attempt' }).click();
  assert.equal(await page.getByLabel('Student name').inputValue(), '');
  assert.equal(await page.evaluate(() => localStorage.getItem('grade4-english-curriculum-exam-l1-5-a-attempt-v1')), null);
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByLabel('Student name').fill('New Student');
  await page.getByRole('button', { name: 'Start Exam' }).click();
  assert.equal((await page.evaluate(() => JSON.parse(sessionStorage.getItem('test-notes')))).length, 6);
  assert.deepEqual(errors, []);
  await context.close();
  console.log('PASS: entry, teacher gate, all 50 question formats, partial completion, immediate submission, results, sounds, report, recovery and restart');

  // A teacher key open in another tab must close when an active attempt begins.
  const shared = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const teacher = await shared.newPage();
  await teacher.goto(base);
  await teacher.getByRole('button', { name: 'Teacher area' }).click();
  await teacher.getByLabel('Teacher password').fill('somer173');
  await teacher.getByRole('button', { name: 'Open answer key' }).click();
  const student = await shared.newPage();
  await student.goto(base);
  await student.getByLabel('Student name').fill('Casey');
  await student.getByRole('button', { name: 'Start Exam' }).click();
  await teacher.getByText("Let's do this, Casey!").waitFor();
  assert.equal(await teacher.locator('.review-question').count(), 0);
  await shared.close();
  console.log('PASS: active attempt closes an open key in another tab');

  for (const [name, width, height] of [['phone', 390, 844], ['small phone', 320, 740], ['tablet', 768, 1024]]) {
    const responsive = await browser.newContext({ viewport: { width, height } });
    const view = await responsive.newPage();
    await view.goto(base, { waitUntil: 'networkidle' });
    await noOverflow(view, `${name} welcome`);
    await view.getByLabel('Student name').fill('Sam');
    await view.getByRole('button', { name: 'Start Exam' }).click();
    await noOverflow(view, `${name} active`);
    if (width <= 720) {
      await view.locator('.mobile-navigator summary').click();
      await view.locator('.mobile-navigator').getByRole('button', { name: 'Question 2, not answered' }).click();
      assert.match(await view.locator('.question-counter').innerText(), /QUESTION 02/);
    }
    await responsive.close();
  }
  console.log('PASS: phone, small-phone and tablet layouts and mobile navigation');
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((done) => server.once('exit', done));
  }
}
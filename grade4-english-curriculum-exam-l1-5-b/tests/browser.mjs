#!/usr/bin/env node
/**
 * Real-browser verification of the built page, served the way GitHub Pages
 * serves it (the exam lives at `/<exam-id>/` inside the assembled site).
 *
 * Covered:
 *   · pupil-facing identity, teacher-key gate and answer-key integrity,
 *   · all 50 questions / 148 sub-parts answered through the real controls → 100,
 *   · fonts, sounds and illustrations with zero external asset requests,
 *   · Apps Script delivered through Mock Fetch only, never the network:
 *       three failures → result still shown, payload queued locally,
 *       manual "Resend result" → success with the same attemptId,
 *       reload after success → no duplicate resend,
 *   · TXT report download,
 *   · phone / tablet / desktop layouts with no horizontal overflow.
 *
 * run:  npm run build && node tests/browser.mjs [siteDir]
 *       (Playwright + Chromium must be installed, see tests/playwright.mjs)
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { loadChromium } from './playwright.mjs';
import { loadQuestions } from './dump-questions.mjs';

const EXAM_ID = 'grade4-english-curriculum-exam-l1-5-b';
const EXAM_TITLE = 'Grade 4 English Curriculum Exam L1-5 B';
const ATTEMPT_KEY = `${EXAM_ID}-attempt-v1`;
const PENDING_PREFIX = `pending:${EXAM_ID}:`;
const RECEIPT_PREFIX = `sent:${EXAM_ID}:`;
const SITE = resolve(process.argv[2] ?? '../_site');

const probe = createServer();
await new Promise((done) => probe.listen(0, '127.0.0.1', done));
const port = probe.address().port;
await new Promise((done) => probe.close(done));
const origin = `http://127.0.0.1:${port}`;
const base = `${origin}/${EXAM_ID}/`;

const server = spawn(
  'python3',
  ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', SITE],
  { stdio: 'ignore' }
);
const chromium = await loadChromium();
const questions = await loadQuestions();
const byId = new Map(questions.map((question) => [question.id, question]));
const totalSubParts = questions.reduce((sum, question) => sum + question.subParts.length, 0);
const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
let browser;
const checks = [];
const check = (label, condition, detail = '') => {
  assert.ok(condition, `${label}${detail ? ` — ${detail}` : ''}`);
  checks.push(label);
};

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`static server exited: ${server.exitCode}`);
    try {
      if ((await fetch(`${origin}/${EXAM_ID}/index.html`)).ok) return;
    } catch {
      /* still starting */
    }
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error('static server did not start');
}

async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  check(`${label}: no horizontal overflow`, sizes.page <= sizes.viewport + 1, JSON.stringify(sizes));
}

function solveReorder(sp) {
  const words = sp.scrambledWords ?? [];
  const target = sp.correctAnswer.replace(/[.?]$/, '');
  const used = new Set();
  const order = [];
  const walk = (current) => {
    if (current === target) return true;
    for (let index = 0; index < words.length; index++) {
      if (used.has(index)) continue;
      const next = current ? `${current} ${words[index]}` : words[index];
      if (target === next || target.startsWith(`${next} `)) {
        used.add(index);
        order.push(index);
        if (walk(next)) return true;
        order.pop();
        used.delete(index);
      }
    }
    return false;
  };
  walk('');
  return order;
}

/** Answers the question on screen through the same controls a pupil uses. */
async function answerCurrentQuestion(page, question) {
  const card = page.locator('article.exam-card');
  const scope = card.locator('div.mt-5').first();
  for (let index = 0; index < question.subParts.length; index++) {
    const sp = question.subParts[index];
    const block = scope.locator(':scope > *').nth(index);
    if (sp.inputKind === 'true-false') {
      await block
        .getByRole('button', { name: sp.correctAnswer === 'True' ? 'True (✓)' : 'False (×)' })
        .click();
    } else if (sp.inputKind === 'choice') {
      const optionIndex = (sp.options ?? []).indexOf(sp.correctAnswer);
      assert.ok(optionIndex >= 0, `choice answer missing for ${question.id}/${sp.id}`);
      await block.getByRole('button').nth(optionIndex).click();
    } else if (sp.inputKind === 'select') {
      await block.locator('select').selectOption(sp.correctAnswer);
    } else if (sp.inputKind === 'reorder') {
      const words = sp.scrambledWords ?? [];
      for (const wordIndex of solveReorder(sp)) {
        await block.getByRole('button', { name: words[wordIndex], exact: true }).click();
      }
    } else {
      await block.locator('input[type="text"]').first().fill(sp.correctAnswer);
    }
  }
}

try {
  check(
    'assembled site contains the Version B page',
    existsSync(resolve(SITE, EXAM_ID, 'index.html')),
    `${SITE}/${EXAM_ID}/index.html`
  );
  await waitForServer();

  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/tmp/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const deliveries = [];
  const external = [];
  let acceptDelivery = false;

  // Mock Fetch: Apps Script is answered locally; anything off-origin is recorded.
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('https://script.google.com/')) {
      deliveries.push({
        body: JSON.parse(route.request().postData() ?? '{}'),
        method: route.request().method(),
        contentType: route.request().headers()['content-type'],
      });
      return route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify(acceptDelivery ? { ok: true } : { ok: false }),
      });
    }
    if (!url.startsWith(origin)) {
      external.push(url);
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto(base, { waitUntil: 'networkidle' });
  check('document title', (await page.title()) === EXAM_TITLE, await page.title());
  check(
    'pupil title on the welcome screen',
    (await page.getByRole('heading', { name: EXAM_TITLE }).count()) >= 1
  );
  check(
    'no Version A identity',
    (await page.locator('body').innerText()).includes('Grade 4 English Curriculum Exam L1-5 A') === false
  );

  await page.evaluate(() => document.fonts.ready);
  const loadedFonts = await page.evaluate(() =>
    Array.from(document.fonts)
      .filter((font) => font.status === 'loaded')
      .map((font) => font.family)
  );
  check('Fredoka webfont loaded', loadedFonts.some((family) => /Fredoka/.test(family)), loadedFonts.join(','));
  check('Nunito webfont loaded', loadedFonts.some((family) => /Nunito/.test(family)), loadedFonts.join(','));
  check(
    'fonts are inlined, not fetched',
    (await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\.woff2?($|\?)/.test(e.name)).length)) === 0
  );

  await noOverflow(page, 'desktop welcome');
  check(
    'contact footer shows the engineer phone and one WhatsApp link',
    (await page.locator('a[href="https://wa.me/963930215022"]').count()) === 1 &&
      (await page.locator('a[href="https://wa.me/963930215022"]').innerText()).includes('0930215022')
  );
  // The welcome screen persists an empty draft (no name, no timer, no attempt id),
  // so a refresh loses nothing. An attempt id must only exist once the exam starts.
  const draft = await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_KEY);
  const draftState = draft ? JSON.parse(draft) : null;
  check(
    'welcome screen stores no attempt id and no running timer',
    !draftState || (draftState.attemptId === '' && draftState.startedAtTimestamp === null && draftState.studentName === ''),
    JSON.stringify(draftState)
  );

  // Teacher key gate.
  await page.getByRole('button', { name: /Teacher Key/i }).click();
  await page.getByLabel(/Teacher Password/i).fill('wrong-password');
  await page.getByRole('button', { name: /Open Answer Key/i }).click();
  await page.getByText(/Incorrect password/i).waitFor();
  check('teacher key rejects a wrong password', true);
  await page.getByLabel(/Teacher Password/i).fill('somer173');
  await page.getByRole('button', { name: /Open Answer Key/i }).click();
  await page.getByRole('heading', { name: /Official Answer Key/i }).waitFor();
  const keyBody = await page.locator('body').innerText();
  check(
    'answer key lists all 50 questions',
    (keyBody.match(/Source Reference:/g) ?? []).length === 50,
    String((keyBody.match(/Source Reference:/g) ?? []).length)
  );
  check(
    'answer key shows all 50 correct answers',
    (keyBody.match(/Correct Answer/gi) ?? []).length >= 50,
    String((keyBody.match(/Correct Answer/gi) ?? []).length)
  );
  await page.getByRole('button', { name: /Back to Welcome/i }).click();

  // Start the exam.
  await page.getByLabel(/Student Name/i).fill('Browser QA Student');
  await page.getByRole('button', { name: /Start Exam/i }).click();
  await page.locator('article.exam-card').first().waitFor();
  const activeBody = await page.locator('body').innerText();
  check('student name shown in the header', activeBody.includes('Browser QA Student'));
  check('teacher key hidden during the exam', !/Official Answer Key/i.test(activeBody));
  check('no correct answers leaked during the exam', !/Correct Answer/i.test(activeBody));
  check('no source references leaked during the exam', !/Source Reference:/i.test(activeBody));
  await noOverflow(page, 'desktop active');

  const stored = JSON.parse(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_KEY));
  check('attempt id persisted on start', typeof stored.attemptId === 'string' && stored.attemptId.length >= 8);
  check('sound starts unmuted', stored.muted === false, String(stored.muted));
  await page.getByRole('button', { name: /Mute exam sound effects/i }).click();
  const afterMute = JSON.parse(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_KEY));
  check('mute preference persisted inside the attempt record', afterMute.muted === true);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('article.exam-card').first().waitFor();
  check(
    'mute preference survives a reload',
    (await page.getByRole('button', { name: /Unmute exam sound effects/i }).count()) === 1
  );
  check(
    'answers survive a reload (nothing lost)',
    (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).answers, ATTEMPT_KEY)) !== null
  );
  check(
    'no separate sound key is written',
    (await page.evaluate(() => Object.keys(localStorage).filter((k) => k.endsWith('-sound-muted')).length)) === 0
  );

  // Answer all 50 questions.
  for (let index = 0; index < questions.length; index++) {
    const card = page.locator('article.exam-card').first();
    const badge = (await card.locator('span').first().innerText()).trim();
    check(`card badge reads Question ${index + 1}`, badge === `Question ${index + 1}`, badge);
    const question = questions[index];
    check(`question ${index + 1}/${questions.length} is ${question.id}`, Boolean(byId.get(question.id)), question.id);
    await answerCurrentQuestion(page, question);
    if (index < questions.length - 1) {
      await page.getByRole('button', { name: /^Next$/ }).click();
    }
  }

  const submit = page.getByRole('button', { name: /Submit Exam/i });
  check('submit unlocks after all answers', await submit.isEnabled());

  // Delivery fails three times: the pupil must still see the result.
  acceptDelivery = false;
  await submit.click();
  await page.getByText(/100% Overall/i).waitFor({ timeout: 60_000 });
  check('100% score shown after three delivery failures', true);
  check('all 50 questions reported full marks', (await page.getByText('50 / 50').count()) >= 1);
  check(
    'score is 100 out of 100',
    (await page.getByText(/100\s*\/\s*100/).count()) >= 1
  );
  // The retry sequence runs for ~7 s (2 s + 5 s), so wait for the failure state
  // itself rather than sampling the page while it is still sending.
  await page.getByRole('button', { name: /Resend result/i }).waitFor({ timeout: 60_000 });
  const failureBody = await page.locator('body').innerText();
  check(
    'delivery failure is announced with a resend action',
    /Result not sent/i.test(failureBody) && /Resend result/i.test(failureBody)
  );
  check('the score stays visible during and after the failure', /100% Overall/i.test(failureBody));
  check('retry count matches the 3-attempt policy (2 s, 5 s backoff)', deliveries.length === 3, String(deliveries.length));

  const firstPayload = deliveries[0];
  check('delivery uses POST', firstPayload.method === 'POST');
  check(
    'delivery is posted as text/plain;charset=utf-8',
    /text\/plain;charset=utf-8/i.test(firstPayload.contentType ?? ''),
    firstPayload.contentType
  );
  const body = firstPayload.body;
  const expectedKeys = [
    'token',
    'attemptId',
    'examId',
    'examTitle',
    'studentName',
    'startAt',
    'submitAt',
    'elapsedSec',
    'summary',
    'lessons',
    'details',
    'reportText',
  ];
  check(
    'payload carries the full contract',
    expectedKeys.every((key) => key in body),
    Object.keys(body).join(',')
  );
  check('payload exam id is Version B', body.examId === EXAM_ID, body.examId);
  check('payload title is Version B', body.examTitle === EXAM_TITLE, body.examTitle);
  check('payload student name', body.studentName === 'Browser QA Student', body.studentName);
  check('payload attempt id matches storage', body.attemptId === stored.attemptId);
  check(
    `payload details carry one row per sub-part (${totalSubParts})`,
    Array.isArray(body.details) && body.details.length === totalSubParts,
    String(body.details?.length)
  );
  check(
    'payload details cover all 50 questions with lesson, status and marks',
    new Set(body.details.map((row) => row.q)).size === 50 &&
      body.details.every(
        (row) =>
          typeof row.lessons === 'string' &&
          /^Lesson [1-5]$/.test(row.lessons) &&
          typeof row.status === 'string' &&
          row.marks === row.marks &&
          row.awarded === row.marks &&
          row.marks > 0 &&
          typeof row.studentAnswer === 'string' &&
          typeof row.correctAnswer === 'string'
      ),
    JSON.stringify(body.details[0])
  );
  check(
    'payload lessons cover 5 lessons worth 20 marks each, all awarded',
    body.lessons.length === 5 &&
      body.lessons.every((lesson) => lesson.max === 20 && lesson.awarded === 20) &&
      new Set(body.lessons.map((lesson) => lesson.title)).size === 5,
    JSON.stringify(body.lessons)
  );
  check(
    `payload summary totals 50 questions / ${totalMarks} marks / 100%`,
    body.summary.total === 100 &&
      body.summary.max === 100 &&
      body.summary.percentage === 100 &&
      body.summary.fullQuestions === 50 &&
      body.summary.partialQuestions === 0 &&
      body.summary.wrongQuestions === 0 &&
      body.summary.correctSubparts === totalSubParts &&
      body.summary.wrongSubparts === 0 &&
      body.summary.unansweredSubparts === 0,
    JSON.stringify(body.summary)
  );
  check(
    'payload grade label uses the platform scale',
    body.summary.gradeLabel === 'ممتاز',
    body.summary.gradeLabel
  );
  check(
    'payload report text is the full TXT report',
    typeof body.reportText === 'string' &&
      // The TXT report upper-cases the title as its banner.
      body.reportText.includes(EXAM_TITLE.toUpperCase()) &&
      body.reportText.includes('Browser QA Student') &&
      body.reportText.includes('100')
  );
  check(
    'all three attempts reuse the same attemptId',
    deliveries.every((delivery) => delivery.body.attemptId === stored.attemptId)
  );

  const pendingKey = `${PENDING_PREFIX}${stored.attemptId}`;
  check('payload is queued locally after the failures', (await page.evaluate((key) => localStorage.getItem(key), pendingKey)) !== null);
  check(
    'no success receipt was stored',
    (await page.evaluate((key) => localStorage.getItem(key), `${RECEIPT_PREFIX}${stored.attemptId}`)) === null
  );

  // TXT report download.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download TXT Report/i }).click(),
  ]);
  const suggested = download.suggestedFilename();
  check('TXT report filename', /^Grade4_English_Exam_Browser_QA_Student\.txt$/.test(suggested), suggested);
  const reportPath = await download.path();
  const report = await readFile(reportPath, 'utf8');
  check(
    'TXT report content',
    report.includes(EXAM_TITLE.toUpperCase()) &&
      report.includes('Browser QA Student') &&
      report.includes('100'),
    report.slice(0, 120).replace(/\n/g, ' | ')
  );

  // Manual resend succeeds with the same attempt id.
  acceptDelivery = true;
  const beforeResend = deliveries.length;
  await page.getByRole('button', { name: /Resend result/i }).click();
  await page.getByText(/Result sent successfully/i).waitFor({ timeout: 60_000 });
  check('resend attempts once', deliveries.length === beforeResend + 1, String(deliveries.length - beforeResend));
  check('resend reuses the original attemptId', deliveries.at(-1).body.attemptId === stored.attemptId);
  check(
    'success receipt stored',
    (await page.evaluate((key) => localStorage.getItem(key), `${RECEIPT_PREFIX}${stored.attemptId}`)) !== null
  );
  check(
    'pending entry cleared after success',
    (await page.evaluate((key) => localStorage.getItem(key), pendingKey)) === null
  );

  // Reload: the stored result must survive and must not be re-sent.
  const afterResend = deliveries.length;
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(/100% Overall/i).waitFor();
  check('result survives a reload', true);
  check('no automatic resend after a successful delivery', deliveries.length === afterResend, String(deliveries.length - afterResend));
  check(
    'delivered receipt still present after reload',
    (await page.evaluate((key) => localStorage.getItem(key), `${RECEIPT_PREFIX}${stored.attemptId}`)) !== null
  );

  // Layout at each breakpoint. Each pass starts from a clean slate so the
  // welcome screen is reachable and the stored result cannot leak between runs.
  for (const viewport of [
    { label: 'phone', width: 390, height: 844 },
    { label: 'small phone', width: 320, height: 740 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'desktop', width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(() => localStorage.clear());
    await page.goto(base, { waitUntil: 'networkidle' });

    // Welcome screen.
    await noOverflow(page, `${viewport.label} welcome`);
    await page.getByLabel(/Student Name/i).fill(`Layout ${viewport.label}`);
    await page.getByRole('button', { name: /Start Exam/i }).click();
    await page.locator('article.exam-card').first().waitFor();

    // Active exam.
    await noOverflow(page, `${viewport.label} active`);
    const widest = await page.evaluate(() =>
      Math.max(
        ...Array.from(document.querySelectorAll('button, input, select, article')).map(
          (node) => node.getBoundingClientRect().right
        )
      )
    );
    check(
      `${viewport.label}: every control fits inside ${viewport.width}px`,
      widest <= viewport.width + 1,
      String(Math.round(widest))
    );

    // Question navigator opens and stays usable on the narrowest screens.
    const mapToggle = page.getByRole('button', { name: /Question (Map|Navigator)|Show all questions/i });
    if (await mapToggle.count()) {
      await mapToggle.first().click();
      await noOverflow(page, `${viewport.label} question map open`);
      await mapToggle.first().click();
    }

    // Teacher key and results screens are readable at this width too.
    await page.evaluate(() => {
      const key = 'grade4-english-curriculum-exam-l1-5-b-attempt-v1';
      const state = JSON.parse(localStorage.getItem(key));
      localStorage.setItem(
        key,
        JSON.stringify({
          ...state,
          phase: 'submitted',
          submittedAtIso: new Date().toISOString(),
          elapsedMs: 90_000,
          startedAtTimestamp: Date.now() - 90_000,
          startedAtIso: new Date(Date.now() - 90_000).toISOString(),
        })
      );
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByText(/Overall/i).first().waitFor();
    await noOverflow(page, `${viewport.label} results`);
  }

  check('no console or page errors', errors.length === 0, errors.join(' | '));
  check('no external network requests', external.length === 0, external.join(', '));

  console.log(`PASS: ${checks.length} browser checks on ${base}`);
  for (const label of checks) console.log(`  ✓ ${label}`);
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) server.kill('SIGTERM');
}

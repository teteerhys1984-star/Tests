/**
 * End-to-end QA sweep for the built app in dist/.
 * Usage: npm run build && node scripts/qa.mjs
 *
 * Covers: no horizontal scroll at 320–1440px, name gating, submit gating,
 * full exam flow, mid-exam refresh recovery, teacher key password,
 * report download and retake flow.
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const ROOT = process.cwd();
const PORT = 4319;
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = process.env.QA_OUT || '/tmp/qa';
fs.mkdirSync(OUT, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: `${ROOT}/dist`,
  stdio: 'ignore',
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ARABIC_WHITELIST = new Set(['اسم','طبيب','جد','أشقر','طويل القامة','الفطور','عادةً','ينهض من الفراش','غرفة نوم','خزانة ملابس','العلوم','مملّ','قرية','نهر','مزرعة']);

async function assertNoHorizontalScroll(page, label) {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  console.log(`  [scroll] ${label}: ${ok ? 'OK' : 'FAIL — horizontal overflow!'}`);
  return ok;
}

async function assertArabicOnlyWhitelist(page, label) {
  const runs = await page.evaluate(() => (document.body.innerText.match(/[\u0600-\u06FF][\u0600-\u06FF\s]*/g) || []).map((s) => s.trim()));
  const bad = runs.filter((r) => !ARABIC_WHITELIST.has(r));
  console.log(`  [arabic] ${label}: ${runs.length} Arabic runs, non-whitelist: ${bad.length === 0 ? 'none' : JSON.stringify(bad)}`);
  return bad.length === 0;
}

async function answerEverything(page) {
  const goto = async (n) => {
    await page.getByRole('button', { name: new RegExp(`^Question ${n},`) }).click();
    await wait(120);
  };
  const fieldsByQuestion = {
    1: { q1p1: 'name', q1p2: 'doctor', q1p3: 'grandfather', q1p4: 'blond', q1p5: 'tall' },
    2: { q2p1: 'breakfast', q2p2: 'usually', q2p3: 'get up', q2p4: 'bedroom', q2p5: 'wardrobe' },
    3: { q3p1: 'science', q3p2: 'boring', q3p3: 'village', q3p4: 'river', q3p5: 'farm' },
    4: { q4p1: 'am', q4p2: 'is', q4p3: 'are', q4p4: 'is', q4p5: 'are' },
    7: { q7p1: 'washes', q7p2: 'leaves', q7p3: 'makes', q7p4: 'watches', q7p5: 'goes' },
    8: { q8p1: 'half past six', q8p2: 'quarter past seven', q8p3: "three o'clock", q8p4: 'quarter to six', q8p5: "nine o'clock" },
    11: { q11p1: 'in', q11p2: 'on', q11p3: 'by', q11p4: 'in', q11p5: 'by' },
    12: { q12p1: 'is', q12p2: 'am', q12p3: 'has', q12p4: 'washes', q12p5: 'is' },
  };
  for (const [n, fields] of Object.entries(fieldsByQuestion)) {
    await goto(n);
    for (const [id, value] of Object.entries(fields)) {
      await page.locator(`#${id}`).fill(value);
    }
  }
  await goto(5);
  const matchAnswers = {
    q5p1: "I'm fine, thank you.",
    q5p2: 'My name is Sara.',
    q5p3: "I'm from Jordan.",
    q5p4: "I'm ten years old.",
    q5p5: 'Nice to meet you, too.',
  };
  for (const [id, value] of Object.entries(matchAnswers)) {
    await page.locator(`#${id}`).selectOption(value);
  }
  await goto(6);
  const q6 = { q6p1: 'is', q6p2: 'has', q6p3: 'have', q6p4: 'have', q6p5: 'is' };
  for (let i = 1; i <= 5; i++) {
    await page.locator('[role="radiogroup"]').nth(i - 1).getByRole('radio', { name: q6[`q6p${i}`], exact: true }).click();
  }
  await goto(9);
  const q9 = ['is', 'are', 'is', 'are', 'is'];
  for (let i = 0; i < 5; i++) {
    await page.locator('[role="radiogroup"]').nth(i).getByRole('radio', { name: q9[i], exact: false }).click();
  }
  await goto(10);
  for (const tok of ['History', 'isn’t', 'boring']) {
    await page.getByRole('button', { name: tok, exact: true }).first().click();
  }
  for (const tok of ['I', 'am', 'good', 'at', 'art']) {
    await page.getByRole('button', { name: tok, exact: true }).first().click();
  }
  await goto(1);
}

async function runViewport(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (err) => console.log('  [pageerror]', err.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(250);
  console.log(`\nViewport ${width}x${height}`);
  await page.screenshot({ path: `${OUT}/${width}-welcome.png`, fullPage: true });
  await assertNoHorizontalScroll(page, 'welcome');
  await assertArabicOnlyWhitelist(page, 'welcome');

  const startBtn = page.getByRole('button', { name: /Start Exam/i });
  console.log(`  [gate] Start disabled without name: ${await startBtn.isDisabled()}`);

  await page.locator('#student-name').fill('Layla Haddad');
  await page.getByRole('button', { name: /Start Exam/i }).click();
  await wait(400);
  await page.screenshot({ path: `${OUT}/${width}-exam.png`, fullPage: true });
  await assertNoHorizontalScroll(page, 'exam');
  await assertArabicOnlyWhitelist(page, 'exam');

  const submitBtn = page.getByRole('button', { name: /Submit Exam/i }).first();
  console.log(`  [gate] Submit disabled before answering: ${await submitBtn.isDisabled()}`);

  await answerEverything(page);
  await wait(200);
  console.log(`  [gate] Submit disabled after answering: ${await submitBtn.isDisabled()}`);
  await page.screenshot({ path: `${OUT}/${width}-exam-answered.png`, fullPage: true });

  await page.getByRole('button', { name: /Submit Exam/i }).first().click();
  await wait(700);
  await page.screenshot({ path: `${OUT}/${width}-results.png`, fullPage: true });
  await assertNoHorizontalScroll(page, 'results');
  await assertArabicOnlyWhitelist(page, 'results');

  const scoreVisible = await page.locator('text=out of 100').first().isVisible().catch(() => false);
  console.log(`  [results] score ring visible: ${scoreVisible}`);

  await page.getByRole('button', { name: /Open Teacher Answer Key/i }).click();
  await wait(200);
  await page.locator('#teacher-password').fill('wrongpass');
  await page.getByRole('button', { name: /Unlock answer key/i }).click();
  const errVisible = await page.getByText(/Incorrect password/i).isVisible();
  await page.locator('#teacher-password').fill('somer173');
  await page.getByRole('button', { name: /Unlock answer key/i }).click();
  await wait(200);
  const keyVisible = await page.getByText('Mark distribution').first().isVisible();
  console.log(`  [teacher] wrong password rejected: ${errVisible}, correct password unlocks: ${keyVisible}`);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByRole('button', { name: /Download Report/i }).click(),
  ]);
  await download.saveAs(`${OUT}/report-${width}.txt`);
  console.log(`  [report] downloaded as: ${download.suggestedFilename()}`);

  await page.getByRole('button', { name: /Retake Exam/i }).click();
  await page.getByRole('button', { name: /Confirm retake/i }).click();
  await wait(300);
  console.log(`  [retake] back to name screen: ${await page.locator('#student-name').isVisible()}`);

  await page.close();
}

const browser = await chromium.launch();
try {
  await runViewport(browser, 375, 667);
  await runViewport(browser, 390, 844);
  await runViewport(browser, 768, 1024);
  await runViewport(browser, 1440, 900);

  {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
    page.on('pageerror', (err) => console.log('  [pageerror]', err.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await wait(200);
    await page.screenshot({ path: `${OUT}/320-welcome.png`, fullPage: true });
    await assertNoHorizontalScroll(page, 'welcome-320');
    await page.locator('#student-name').fill('Omar Nasser');
    await page.getByRole('button', { name: /Start Exam/i }).click();
    await wait(300);
    await page.screenshot({ path: `${OUT}/320-exam.png`, fullPage: true });
    await assertNoHorizontalScroll(page, 'exam-320');
    await page.locator('#q1p1').fill('name');
    await wait(400);
    await page.reload({ waitUntil: 'networkidle' });
    await wait(300);
    const restored = await page.locator('#q1p1').inputValue();
    console.log(`  [restore] answer after refresh: "${restored}"`);
    await page.screenshot({ path: `${OUT}/320-restored.png` });
    await assertNoHorizontalScroll(page, 'restored-320');
    await page.close();
  }

  console.log('\nQA flow complete.');
} finally {
  await browser.close();
  server.kill();
}

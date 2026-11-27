import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const artifacts = 'artifacts/browser';
await mkdir(artifacts, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [], externalRequests = [], checks = [];
const check = (name, data = true) => { checks.push({ name, data }); console.log('PASS', name, typeof data === 'string' ? data : ''); };
const plan = {
  'q1-1': { choice: 'b' },
  'q1-2': { fields: ['molecules', 'oxygen', 'lost', 'one'] },
  'q1-3': { number: '12' },
  'q2-1': { matching: ['v4', 'v3', 'v2', 'v1'] },
  'q2-2': { judgement: [{ value: 'true' }, { value: 'false', correction: 'lose2' }] },
  'q2-3': { fields: ['1', '2', '1', '2'] },
  'q2-4': { choice: 'shared' },
  'q3-1': { choice: 'group' },
  'q3-2': { matching: ['nitrate', 'sulfate', 'phosphate', 'ammonium', 'hydroxide', 'carbonate'] },
  'q3-3': { fields: ['positive', 'negative', 'negative', 'negative'] },
  'q3-4': { choice: 'radical' },
  'q4-1': { order: ['symbols', 'valencies', 'exchange', 'final'] },
  'q4-2': { fields: ['Na+', 'OH-', '1', '1', '1', '1', 'NaOH'] },
  'q4-3': { fields: ['Zn2+', 'Cl-', '2', '1', '1', '2', 'ZnCl2'] },
  'q4-4': { fields: ['Al3+', 'SO42-', '3', '2', '2', '3', 'Al2(SO4)3'] },
  'q4-5': { fields: ['Ca2+', 'PO43-', '2', '3', '3', '2', 'Ca3(PO4)2'] },
  'q5-1': { fields: ['2', '3', '12'] },
  'q5-2': { number: '15' },
  'q5-3': { number: '6' },
  'q5-4': { fields: ['yes', 'no', 'yes'] },
  'q5-5': { fields: ['parentheses', 'Ca(OH)2'], keypad: true },
  'q6-1': { matching: ['iron2', 'iron3', 'sodium', 'ammonium'] },
  'q6-2': { choice: 'nitrate' },
  'q6-3': { choice: 'copper' },
  'q6-4': { choice: 'zinc' },
  'q7-1': { fields: ['Al3+', 'PO43-'] },
  'q7-2': { fields: ['AlPO4'] },
  'q7-3': { fields: ['3', '3', '0'] },
  'q7-4': { choice: 'no' },
  'q7-5': { choice: 'phosphate' },
  'q7-6': { fields: ['ratio', '4'] },
};
async function fillPart(page, id, item) {
  const part = page.locator(`#${id}`);
  if (item.choice) await part.locator('.choice-option').filter({ has: page.locator(`input[value="${item.choice}"]`) }).click();
  else if (item.number) await part.locator('.single-number input').fill(item.number);
  else if (item.matching) {
    const rows = part.locator('.matching-row select');
    for (let i = 0; i < item.matching.length; i++) await rows.nth(i).selectOption(item.matching[i]);
  } else if (item.judgement) {
    for (let i = 0; i < item.judgement.length; i++) {
      const row = part.locator('.judgement-row').nth(i), answer = item.judgement[i];
      await row.locator('.judgement-button').nth(answer.value === 'true' ? 0 : 1).click();
      if (answer.correction) await row.locator('select').selectOption(answer.correction);
    }
  } else if (item.order) {
    for (let i = 0; i < item.order.length; i++) await part.locator('.ordering-row select').nth(i).selectOption(item.order[i]);
  } else {
    for (let i = 0; i < item.fields.length; i++) {
      const field = part.locator('.field-control').nth(i), value = item.fields[i], select = field.locator('select');
      if (await select.count()) await select.selectOption(value);
      else if (item.keypad && i === 1) {
        const input = field.locator('input');
        await input.fill('Ca'); await input.focus();
        await field.getByRole('button', { name: 'إضافة قوسين' }).click();
        await page.keyboard.type('OH'); await page.keyboard.press('ArrowRight');
        await field.getByRole('button', { name: 'إضافة الرقم 2' }).click();
        assert.equal(await input.inputValue(), 'Ca(OH)2');
        check('formula keypad inserts a complete repeated radical');
      } else await field.locator('input').fill(value);
    }
  }
}
async function noOverflow(page, label) {
  const result = await page.evaluate(() => {
    const width = window.innerWidth;
    const formulas = [...document.querySelectorAll('.chem')].filter(el => el.getBoundingClientRect().width > 0).map(el => {
      const r = el.getBoundingClientRect();
      return { text: el.textContent, left: r.left, right: r.right, scroll: el.scrollWidth, client: el.clientWidth };
    });
    return { width, pageWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, formulas: formulas.filter(f => f.left < -1 || f.right > width + 1 || f.scroll > f.client + 2), katexErrors: document.querySelectorAll('.katex-error').length, rawTex: [...document.querySelectorAll('.katex-html')].some(el => el.textContent.includes('\\mathrm')) };
  });
  assert.ok(result.pageWidth <= result.width + 1 && result.bodyWidth <= result.width + 1, `${label}: horizontal overflow ${JSON.stringify(result)}`);
  assert.equal(result.formulas.length, 0, `${label}: formula overflow ${JSON.stringify(result.formulas)}`);
  assert.equal(result.katexErrors, 0, `${label}: KaTeX error`);
  assert.equal(result.rawTex, false, `${label}: visible raw TeX`);
  check(label, `${result.width}px`);
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ar', reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) externalRequests.push(request.url()); });
  page.on('dialog', async dialog => { errors.push('Unexpected confirmation dialog'); await dialog.dismiss(); });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('h1').textContent(), 'اختبار الكيمياء – الصف الثامن');
  assert.equal(await page.getByRole('timer').count(), 0);
  assert.equal(await page.locator('.map-item').count(), 7);
  await page.screenshot({ path: `${artifacts}/entry-desktop.png`, fullPage: true });
  check('entry renders seven questions, local fonts, and no timer before start');
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await noOverflow(page, `entry layout ${width}`);
    if (width === 390) await page.screenshot({ path: `${artifacts}/entry-mobile.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'ابدأ الاختبار' }).click();
  assert.ok(await page.getByRole('alert').isVisible());
  assert.equal(await page.getByRole('timer').count(), 0);
  await page.getByLabel(/اسم الطالب الكامل/).fill('سمر شاهين');
  await page.getByRole('button', { name: 'ابدأ الاختبار' }).click();
  await page.getByRole('heading', { name: 'قراءة الصيغ الكيميائية وفهمها' }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'تسليم الاختبار' }).isVisible());
  assert.ok(await page.getByRole('button', { name: 'تسليم الاختبار' }).isDisabled());
  const startedAt = await page.evaluate(() => JSON.parse(localStorage.getItem('grade8-chemistry-l3-attempt-v1')).startedAt);
  check('full-name validation and immediate start with disabled incomplete submission');
  for (let q = 1; q <= 7; q++) {
    await page.locator('.question-nav-item').nth(q - 1).click();
    for (const [id, item] of Object.entries(plan)) if (id.startsWith(`q${q}-`)) await fillPart(page, id, item);
    assert.equal(await page.locator('.result-part').count(), 0);
    assert.equal(await page.getByText('الإجابة الصحيحة', { exact: true }).count(), 0);
    if (q === 4) {
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('grade8-chemistry-l3-attempt-v1')));
      await page.reload({ waitUntil: 'networkidle' });
      const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('grade8-chemistry-l3-attempt-v1')));
      assert.equal(restored.startedAt, startedAt); assert.equal(restored.currentQuestion, 3); assert.deepEqual(restored.answers, saved.answers);
      await page.getByRole('heading', { name: 'كتابة الصيغ والتعادل الكهربائي' }).waitFor();
      check('refresh restores question four, all answers, and the original timestamp');
      await page.screenshot({ path: `${artifacts}/exam-desktop.png`, fullPage: false });
      for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
        await noOverflow(page, `exam layout ${width}`);
      }
      await page.setViewportSize({ width: 844, height: 390 }); await noOverflow(page, 'exam landscape 844x390');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('#q4-4').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${artifacts}/exam-mobile.png`, fullPage: false });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  assert.ok(await page.getByRole('button', { name: 'تسليم الاختبار' }).isEnabled());
  await page.getByRole('button', { name: 'تسليم الاختبار' }).click();
  await page.getByText('اكتمل الاختبار', { exact: true }).waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.ok((await page.locator('.score-ring strong').textContent()).includes('100'));
  assert.equal(await page.locator('.result-part').count(), 31);
  assert.equal(await page.locator('.result-question').count(), 7);
  check('all 31 subparts completed through real controls; immediate submission; 100/100');
  await page.evaluate(() => {
    const original = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) window.__reportFilename = this.download;
      return original.call(this);
    };
  });
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'تحميل التقرير' }).first().click()]);
  await download.saveAs(`${artifacts}/student-report.txt`);
  const report = await readFile(`${artifacts}/student-report.txt`, 'utf8');
  const requestedFilename = await page.evaluate(() => window.__reportFilename);
  assert.ok(report.includes('سمر شاهين') && report.includes('100 / 100') && report.includes('معايير التصحيح') && report.includes('فوسفات الألمنيوم'));
  assert.equal(requestedFilename, 'تقرير-سمر-شاهين.txt');
  check('UTF-8 TXT report downloads locally with the student filename attribute and full rubric', { requestedFilename, headlessSuggestedFilename: download.suggestedFilename() });
  await page.screenshot({ path: `${artifacts}/results-desktop.png`, fullPage: false });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await noOverflow(page, `results layout ${width}`);
    if (width === 390) await page.screenshot({ path: `${artifacts}/results-mobile.png`, fullPage: false });
  }
  await page.getByRole('button', { name: 'محاولة جديدة' }).click();
  assert.equal(await page.getByLabel(/اسم الطالب الكامل/).inputValue(), '');
  assert.equal(await page.getByRole('timer').count(), 0);
  check('new attempt clears the previous name and does not start automatically');
  await page.getByRole('button', { name: 'مساحة المعلّم' }).click();
  await page.getByLabel('كلمة المرور').fill('incorrect');
  await page.getByRole('button', { name: 'فتح مفتاح الإجابات' }).click();
  assert.ok(await page.getByRole('alert').isVisible());
  await page.getByLabel('كلمة المرور').fill('somer173');
  await page.getByRole('button', { name: 'فتح مفتاح الإجابات' }).click();
  assert.equal(await page.locator('.teacher-question').count(), 7);
  await page.setViewportSize({ width: 320, height: 844 }); await noOverflow(page, 'teacher key layout 320');
  check('teacher password rejects wrong input and reveals all seven worked solutions');
  const text = await page.locator('body').innerText();
  assert.ok(!/Arena|تحميل المشروع|تحميل الشيفرة|\.zip/i.test(text));
  assert.equal(externalRequests.length, 0, `External requests: ${externalRequests.join(', ')}`);
  assert.equal(errors.length, 0, `Browser errors: ${errors.join(', ')}`);
  check('no external requests, runtime errors, raw TeX, or student-facing source downloads');
  await writeFile(`${artifacts}/verification.json`, JSON.stringify({ checks, errors, externalRequests }, null, 2));
  console.log(`\n${checks.length} browser checks passed.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}

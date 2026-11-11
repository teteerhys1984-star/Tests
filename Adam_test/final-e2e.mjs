import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.fill('#student-name', 'آدم');
await page.click('button.button-start');
await page.waitForTimeout(300);
// seed a realistic mixed attempt: all answered, several wrong/partial
const res = await page.evaluate(() => {
  const KEY = 'adam_math_grade4_attempt_v1';
  const a = JSON.parse(localStorage.getItem(KEY));
  const mod = window.__examQuestions;
  return { order: a.questionOrder, count: Object.keys(a.answers).length };
});
// fetch question bank via the built app is not exposed; instead answer through UI quickly
const total = await page.locator('.exam-sidebar .index-cell').count();
for (let i = 0; i < total; i++) {
  if (i > 0) await page.locator('.exam-sidebar .index-cell').nth(i).click();
  await page.waitForTimeout(30);
  const parts = page.locator('.subpart');
  const n = await parts.count();
  for (let j = 0; j < n; j++) {
    const part = parts.nth(j);
    const choice = part.locator('.choice').first();
    if (await choice.count()) await choice.click();
    const sym = part.locator('.symbol-button').first();
    if (await sym.count()) await sym.click();
    const fields = part.locator('.field-box input');
    const fn = await fields.count();
    for (let k = 0; k < fn; k++) await fields.nth(k).fill('1');
    const numeric = part.locator('.numeric-input');
    if (await numeric.count()) await numeric.fill('1');
    const chips = part.locator('.order-bank .order-chip');
    let guard = 0;
    while (await chips.count() && guard < 8) { await chips.first().click(); guard++; }
  }
}
await page.click('button.nav-review');
await page.waitForTimeout(300);
const remaining = await page.locator('.completion-count').textContent();
const submit = page.locator('button.button-submit');
console.log('remaining', remaining, 'disabled', await submit.isDisabled());
await page.screenshot({ path: 'shots/final-review.png', fullPage: true });
const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
await submit.click();
const download = await downloadPromise;
await page.waitForTimeout(500);
console.log('download filename:', download ? download.suggestedFilename() : 'NONE');
if (download) {
  const path = '/tmp/' + download.suggestedFilename();
  await download.saveAs(path);
  const text = fs.readFileSync(path, 'utf8');
  console.log('report bytes:', text.length, '| has title:', text.includes('آدم والرياضيات'), '| has page refs:', /ص 2[0-8]|ص 1[0-9]|ص [89]/.test(text), '| has password:', text.includes('somer173'), '| has score:', /الدرجة النهائية: \d+ \/ 100/.test(text), '| has student:', text.includes('اسم الطالب: آدم'));
  fs.writeFileSync('/tmp/report-sample.txt', text);
}
await page.screenshot({ path: 'shots/final-results.png', fullPage: true });
const score = await page.locator('.score-number span').textContent();
const pct = await page.locator('.score-percent').textContent();
const header = await page.locator('h1').first().textContent();
console.log('results:', header.trim(), score + '/100', pct);
const bodyText = await page.locator('body').innerText();
console.log('has backup button:', bodyText.includes('تنزيل التقرير TXT'), '| has teacher key in text:', bodyText.includes('دليل المعلم'), '| reveals pages in review:', /\bص \d/.test(bodyText));
// backup download
const backupPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
await page.getByRole('button', { name: 'تنزيل التقرير TXT' }).first().click();
const backup = await backupPromise;
console.log('backup same filename:', backup?.suggestedFilename() === download?.suggestedFilename(), backup?.suggestedFilename());
// teacher key with real browser
await page.locator('.teacher-link').click();
await page.fill('#teacher-password', 'wrong');
await page.getByRole('button', { name: 'دخول المفتاح' }).click();
console.log('wrong password message:', (await page.locator('.field-error').textContent()).slice(0, 20));
await page.fill('#teacher-password', 'somer173');
await page.getByRole('button', { name: 'دخول المفتاح' }).click();
await page.waitForTimeout(200);
const keyText = await page.locator('.teacher-modal').innerText();
console.log('key unlocked:', keyText.includes('دليل المعلم') && keyText.includes('بدائل مقبولة'), '| shows 30 questions:', (await page.locator('.key-question').count()) === 30, '| shows answers:', keyText.includes('الإجابة الصحيحة'));
await page.screenshot({ path: 'shots/final-teacher-key.png', fullPage: false });
// reload preserves submitted result
await page.reload({ waitUntil: 'networkidle' });
const afterReload = await page.locator('body').innerText();
console.log('results survive reload:', afterReload.includes('تم التسليم بنجاح'), '| welcome shows after submit:', afterReload.includes('دخول الطالب'));
// mobile results screenshot
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: await context.storageState() });
const mpage = await mctx.newPage();
await mpage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await mpage.screenshot({ path: 'shots/final-mobile-results.png', fullPage: false });
console.log('mobile results restored:', (await mpage.locator('body').innerText()).includes('تم التسليم بنجاح'));
console.log('overflow mobile:', await mpage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
console.log('errors:', errors);
await browser.close();

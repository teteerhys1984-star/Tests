import { chromium } from 'playwright';
const browser = await chromium.launch();
const errors = [];
async function pageAt(viewport, name) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type()==='error') errors.push(`${name} console: ${m.text()}`); });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `shots/${name}-welcome.png`, fullPage: true });
  const title = await page.locator('h1.exam-title').textContent();
  const sw = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  await page.fill('#student-name', 'آدم');
  await page.click('button.button-start');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/${name}-exam.png`, fullPage: true });
  const timer = await page.locator('.timer-value').textContent();
  const hud = await page.locator('.hud').boundingBox();
  const welcomeGone = await page.locator('.welcome-page').count();
  const q = await page.locator('.question-title').textContent();
  const optionsOrder = await page.evaluate(() => JSON.parse(localStorage.getItem('adam_math_grade4_attempt_v1')).optionOrders);
  const swExam = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  // review screenshot
  await page.click('button.nav-review');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `shots/${name}-review.png`, fullPage: true });
  const submitDisabled = await page.locator('button.button-submit').isDisabled();
  const remaining = await page.locator('.completion-count').textContent();
  await context.close();
  return { name, title, sw, timer, hud, welcomeGone, q, swExam, submitDisabled, remaining, hasOptions: Object.keys(optionsOrder||{}).length };
}
const desktop = await pageAt({width:1440,height:1000}, 'desktop');
const mobile = await pageAt({width:390,height:844}, 'mobile');
console.log(JSON.stringify({ desktop, mobile, errors }, null, 2));
await browser.close();

import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.fill('#student-name', 'آدم');
await page.click('button.button-start');
await page.waitForTimeout(200);
const total = await page.locator('.exam-sidebar .index-cell').count();
for (let i=0;i<total;i++){
  if(i) await page.locator('.exam-sidebar .index-cell').nth(i).click();
  const parts = page.locator('.subpart'); const n = await parts.count();
  for(let j=0;j<n;j++){
    const part=parts.nth(j);
    const choice=part.locator('.choice').first(); if(await choice.count()) await choice.click();
    const sym=part.locator('.symbol-button').first(); if(await sym.count()) await sym.click();
    const fields=part.locator('.field-box input'); const fn=await fields.count(); for(let k=0;k<fn;k++) await fields.nth(k).fill('1');
    const num=part.locator('.numeric-input'); if(await num.count()) await num.fill('1');
    const chips=part.locator('.order-bank .order-chip'); let g=0; while(await chips.count()&&g<8){await chips.first().click();g++;}
  }
}
await page.click('button.nav-review');
await page.locator('button.button-submit').click();
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/results-top.png' });
await page.screenshot({ path: 'shots/results-full.png', fullPage: true });
console.log('results top captured', await page.locator('.score-number').innerText());
const mctx = await browser.newContext({ viewport: { width: 390, height: 1100 }, storageState: await ctx.storageState() });
const mpage = await mctx.newPage();
await mpage.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await mpage.screenshot({ path: 'shots/results-mobile-top.png' });
console.log('mobile overflow', await mpage.evaluate(() => ({scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth})));
await browser.close();

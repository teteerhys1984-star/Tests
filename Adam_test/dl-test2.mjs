import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4173/');
async function test(filename) {
  await page.evaluate((filename) => {
    const blob = new Blob(['x'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  }, filename);
  const dl = await page.waitForEvent('download', { timeout: 4000 }).catch(()=>null);
  return dl?.suggestedFilename();
}
console.log('ascii:', await test('Grade4_Mathematics_Adam_Report_Adam.txt'));
console.log('arabic:', await test('Grade4_Mathematics_Adam_Report_آدم.txt'));
console.log('arabic+underscore:', await test('Report_آدم_محمد.txt'));
console.log('unicode escape:', await test('Report_\u0622\u062f\u0645.txt'));
console.log('url encoded attr:', await test(encodeURIComponent('Report_آدم.txt')));
await browser.close();

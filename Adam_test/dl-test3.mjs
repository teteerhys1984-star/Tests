import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
await page.goto('http://127.0.0.1:4173/');
async function test(filename) {
  const p = page.waitForEvent('download', { timeout: 4000 }).catch(()=>null);
  await page.evaluate((filename) => {
    const blob = new Blob(['x'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  }, filename);
  const dl = await p;
  return dl?.suggestedFilename();
}
for (const name of ['Grade4_Mathematics_Adam_Report_Adam.txt','Grade4_Mathematics_Adam_Report_آدم.txt','تقرير.txt']) {
  console.log(JSON.stringify(name), '=>', JSON.stringify(await test(name)));
}
await browser.close();

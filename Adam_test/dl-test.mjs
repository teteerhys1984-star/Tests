import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
await page.goto('http://127.0.0.1:4173/');
async function test(removeDelay, useAttrProp) {
  const p = await page.evaluateHandle(({removeDelay, useAttrProp}) => {
    const filename = 'Grade4_Mathematics_Adam_Report_آدم.txt';
    const blob = new Blob(['x'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    if (useAttrProp) a.download = filename; else a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    if (removeDelay >= 0) setTimeout(() => document.body.removeChild(a), removeDelay);
  }, {removeDelay, useAttrProp});
  const dl = await page.waitForEvent('download', { timeout: 4000 }).catch(()=>null);
  return dl?.suggestedFilename();
}
console.log('immediate removal:', await test(0, true));
console.log('delayed 1500 removal:', await test(1500, true));
console.log('attribute delayed:', await test(1500, false));
console.log('blob direct download name test done');
await browser.close();

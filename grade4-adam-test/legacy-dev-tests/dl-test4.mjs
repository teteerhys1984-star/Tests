import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
await page.goto('http://127.0.0.1:4173/');
async function test(kind, filename) {
  const p = page.waitForEvent('download', { timeout: 4000 }).catch(()=>null);
  await page.evaluate(({kind, filename}) => {
    const a = document.createElement('a');
    if (kind === 'data') a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('نص');
    else if (kind === 'blob-anchor') {
      const blob = new Blob(['x'], { type: 'text/plain;charset=utf-8' });
      a.href = URL.createObjectURL(blob);
      const inner = document.createElement('span');
      a.appendChild(inner);
      inner.setAttribute('download', filename);
    } else {
      const blob = new Blob(['x'], { type: 'text/plain;charset=utf-8' });
      a.href = URL.createObjectURL(blob);
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  }, {kind, filename});
  const dl = await p;
  return dl?.suggestedFilename();
}
console.log('data:', await test('data', 'Grade4_Report_آدم.txt'));
console.log('blob:', await test('blob', 'Grade4_Report_آدم.txt'));
await browser.close();

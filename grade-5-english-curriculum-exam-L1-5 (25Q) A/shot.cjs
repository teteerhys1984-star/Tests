const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/s1.png' });
  console.log('ok');
  await b.close();
})().catch(e => { console.error('ERR', e.message.split('\n').slice(0,6).join(' | ')); process.exit(1); });

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from '@playwright/test';

const probe = createServer();
await new Promise(r => probe.listen(0, '127.0.0.1', r));
const port = probe.address().port;
await new Promise(r => probe.close(r));
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', '../_site'], {stdio:'ignore'});
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH, args:['--no-sandbox','--disable-dev-shm-usage']});
  const context = await browser.newContext();
  let requests = [];
  let successful = false;
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith('https://script.google.com/')) {
      requests.push(JSON.parse(route.request().postData()));
      assert.equal(route.request().method(), 'POST');
      assert.equal(route.request().headers()['content-type'], 'text/plain;charset=utf-8');
      return route.fulfill({status:200,contentType:'text/plain',body:JSON.stringify({ok:successful})});
    }
    assert.ok(url.startsWith(`http://127.0.0.1:${port}/`), `Unexpected external request: ${url}`);
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e=>errors.push(e.message));
  page.on('console', e=> {if(e.type()==='error')errors.push(e.text());});
  const base = `http://127.0.0.1:${port}/grade4-english-curriculum-exam-l1-5-a/`;
  await page.goto(base,{waitUntil:'networkidle'});
  assert.match(await page.title(),/Grade 4 English Curriculum Exam L1-5 A/);
  await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.locator('.hero-art img').evaluate(img=>img.complete && img.naturalWidth>0));
  await page.getByRole('button',{name:'Teacher area'}).click();
  await page.getByLabel('Teacher password').fill('somer173');
  await page.getByRole('button',{name:'Open answer key'}).click();
  assert.equal(await page.locator('.review-question').count(),50);
  assert.ok(await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete && img.naturalWidth>0)));
  await page.getByRole('button',{name:'Back to exam'}).click();
  await page.getByLabel('Student name').fill('Mock Production Student');
  await page.getByRole('button',{name:'Start Exam'}).click();
  const key = 'grade4-english-curriculum-exam-l1-5-a-attempt-v1';
  await page.evaluate(key=>{
    const a=JSON.parse(localStorage.getItem(key));
    a.state='submitted';a.submittedAt=Date.now();a.elapsedMs=60000;
    localStorage.setItem(key,JSON.stringify(a));
  },key);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('.review-question').count(),50);
  await page.getByRole('button',{name:'Resend result'}).waitFor({timeout:15000});
  assert.equal(requests.length,3);
  assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('pending:grade4-english-curriculum-exam-l1-5-a:'))));
  assert.equal(await page.getByRole('button',{name:'Download TXT report'}).isEnabled(),true);
  successful=true;
  await page.getByRole('button',{name:'Resend result'}).click();
  await page.getByText('Result sent successfully.',{exact:true}).waitFor();
  assert.equal(requests.length,4);
  assert.equal(new Set(requests.map(r=>r.attemptId)).size,1);
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('pending:grade4-english-curriculum-exam-l1-5-a:')).length),0);
  await page.reload({waitUntil:'networkidle'});
  await page.getByText('Result sent successfully.',{exact:true}).waitFor();
  assert.equal(requests.length,4,'sent receipt prevents refresh resend');
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS: deployed subpath, all embedded images/fonts, result remains visible offline, three mocked failures, persistent queue, manual resend, stable attemptId, refresh receipt; zero console/page errors and no external asset requests');
} finally {
  if(browser)await browser.close();
  server.kill('SIGTERM');
}

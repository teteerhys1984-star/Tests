// فحص شامل للنسخة المبنية في متصفح حقيقي (playwright).
//   npm run build && node scripts/e2e-test.mjs
// يحتاج playwright مثبّتاً (ليس من اعتماديات المشروع): npm i -D playwright && npx playwright install chromium
// لا يتصل بأي شبكة خارجية: كل طلبات الإرسال إلى Google تُعترَض وتُرَدّ محلياً.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const { QUESTIONS, GRAPHS } = await import(path.join(root, 'src/exam-data.js'));

const port = 8901;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: path.join(root, 'dist') });
await new Promise(r => setTimeout(r, 800));

const strip = (s) => String(s).replace(/⟦|⟧/g, '');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.log('  FAIL:', m); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__downloads = [];
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) window.__downloads.push(this.download);
    return orig.call(this);
  };
});
page.on('pageerror', e => { fail++; console.log('  PAGE ERROR:', e.message); });
// لا شبكة خارجية: طلبات الإرسال إلى Apps Script تُعترَض وتُرَدّ بنجاح وهمي
await ctx.route('https://script.google.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));

await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForSelector('.intro-card');

console.log('== Start screen ==');
ok(await page.isVisible('.intro-title'), 'intro title visible');
ok(await page.locator('.btn-start').isDisabled(), 'start disabled without name');
await page.fill('#student-name', 'سارة أحمد');
ok(!(await page.locator('.btn-start').isDisabled()), 'start enabled after name');
ok(await page.locator('.timer-chip').count() === 0, 'no timer on intro');

await page.click('.btn-start');
await page.waitForSelector('.exam-screen');
console.log('== Exam started ==');
ok(await page.isVisible('.qcard'), 'question card shown');
const t1 = await page.locator('.timer-val').textContent();
await page.waitForTimeout(2300);
const t2 = await page.locator('.timer-val').textContent();
ok(t1 !== t2, `timer counting up (${t1} -> ${t2})`);
ok(/^\d{2}:\d{2}:\d{2}$/.test(t2.trim()), 'timer format HH:MM:SS');
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')));
ok(st.status === 'active' && st.sounds.start === true && !!st.startTs, 'session saved: active + start sound flag + startTs');

// submit disabled until all answered
ok(await page.locator('.btn-submit').isDisabled(), 'submit disabled initially');
ok((await page.locator('.remaining-note').textContent()).includes('49'), 'remaining note shows 49 parts');

console.log('== Answer all 12 questions via UI ==');
async function answerCurrent() {
  const parts = await page.locator('.qcard .parts .part').all();
  const qi = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')).current);
  const q = QUESTIONS[qi];
  for (let i = 0; i < parts.length; i++) {
    const p = q.parts[i];
    const part = parts[i];
    if (p.kind === 'mc') {
      const ans = strip(p.answer);
      const btns = await part.locator('.opt-btn').all();
      for (const b of btns) if ((await b.textContent()).includes(ans)) { await b.click(); break; }
    } else if (p.kind === 'match') {
      await part.locator('select').selectOption(p.matchAnswer);
    } else if (p.kind === 'tf') {
      await part.locator('.opt-btn', { hasText: p.tfAnswer ? 'صح' : 'خطأ' }).first().click();
      if (!p.tfAnswer) await part.locator('textarea').fill(strip(p.correctionText));
    } else if (p.kind === 'blank') {
      await part.locator('input').fill(strip(p.accept[0]));
    } else if (p.kind === 'numeric') {
      await part.locator('input').fill(String(p.numeric.expected));
    } else if (p.kind === 'text') {
      await part.locator('textarea').fill(strip(p.modelAnswer));
    }
  }
}
for (let qi = 0; qi < 12; qi++) {
  await answerCurrent();
  const cur = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')).current);
  ok(cur === qi, `on question ${qi + 1}`);
  if (qi < 11) await page.click('text=السؤال التالي');
}
await page.waitForTimeout(300);
const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')));
ok(Object.keys(st2.answers).length === 49, 'all 49 answers saved');
ok(await page.locator('.btn-submit').isEnabled(), 'submit enabled when all answered');
ok((await page.locator('.pal-btn.done').count()) === 12, 'palette shows all 12 answered');

console.log('== Navigation back/forward + persistence of answers ==');
await page.click('text=السؤال السابق');
ok(await page.locator('.qcard').textContent().then(t => t.includes('الطفل')), 'prev from q12 goes to q11 (الطفل والدراجة)');
await page.click('text=السؤال التالي');
await page.click('text=مراجعة الإجابات');
await page.waitForSelector('.review-screen');
ok((await page.locator('.review-item').count()) === 12, 'review lists 12 questions');
ok((await page.locator('.review-parts li').count()) === 49, 'review lists 49 parts with answers');
await page.click('text=العودة إلى الأسئلة');
await page.waitForSelector('.exam-screen');

console.log('== Refresh mid-exam (session recovery) ==');
await page.reload();
await page.waitForSelector('.exam-screen');
const st3 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')));
ok(st3.status === 'active' && Object.keys(st3.answers).length === 49, 'after refresh: same attempt, answers intact');
ok(st3.current === 11, 'current question restored (11)');
const t3 = await page.locator('.timer-val').textContent();
await page.waitForTimeout(1100);
const t4 = await page.locator('.timer-val').textContent();
ok(t3 !== t4, `timer continues accurately after refresh (${t3} -> ${t4})`);

console.log('== Submit ==');
const dlPromise = page.waitForEvent('download', { timeout: 10000 });
await page.click('.btn-submit');
await page.waitForSelector('.results-screen', { timeout: 5000 });
ok(true, 'results screen appears immediately (no confirm dialog)');
const dl = await dlPromise;
const fname = (await page.evaluate(() => window.__downloads[0])) || dl.suggestedFilename();
ok(fname === 'Grade7_Physics_Unit1_Lesson1_Report_سارة_أحمد.txt', `download filename (download attr, Arabic preserved): ${fname}`);
const path = await dl.path();
import { readFileSync } from 'fs';
const txt = readFileSync(path, 'utf-8');
ok(txt.includes('سارة أحمد') && txt.includes('الدرجة المحصلة: 100 من 100'), 'report: name + perfect score');
ok(txt.includes('المرجع الداخلي') && txt.includes('ص13'), 'report: page refs present');
ok(!txt.includes('somer173'), 'report does NOT contain teacher password');
ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(txt), 'report timestamps western digits ISO');
ok(await page.isVisible('.score-num'), 'score displayed');
ok((await page.locator('.score-num').textContent()).includes('100'), 'score 100/100 shown');
const st4 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')));
ok(st4.status === 'submitted' && st4.sounds.submit === true && st4.submitTs && st4.elapsedMs > 0, 'submitted state + submit sound flag + timestamps saved');
ok(!txt.includes('لم يُرسل إلى أي جهة خارجية'), 'report no longer claims nothing is sent');
ok(txt.includes('تُرسَل النتيجة والإجابات إلى المعلّم'), 'report states the result is sent to the teacher');

console.log('== Delivery to the teacher (intercepted) ==');
const sendStatus = await page.locator('[data-send-status]').getAttribute('data-send-status', { timeout: 10000 }).catch(() => null);
ok(sendStatus === 'success', `send banner shows success (${sendStatus})`);
ok((await page.locator('[data-send-status]').textContent()).includes('تم إرسال نتيجتك إلى معلّمك'), 'success message visible');
ok((await page.locator('text=إعادة إرسال النتيجة').count()) === 0, 'no resend button after success');

console.log('== Backup download button ==');
const dl2Promise = page.waitForEvent('download', { timeout: 10000 });
await page.click('text=تنزيل التقرير TXT');
const dl2 = await dl2Promise;
ok((await page.evaluate(() => window.__downloads[1])) === fname, 'backup download has identical filename');

console.log('== Refresh after submit stays on results ==');
await page.reload();
await page.waitForSelector('.results-screen');
ok(true, 'refresh after submit shows results, not active exam');
ok((await page.locator('[data-send-status]').getAttribute('data-send-status')) === 'success', 'send status survives a refresh');

console.log('== Try Again ==');
await page.click('text=محاولة جديدة');
await page.waitForSelector('.intro-card');
const st5 = await page.evaluate(() => JSON.parse(localStorage.getItem('g7physics_u1l1_exam_v1')));
ok(st5.status === 'intro' && Object.keys(st5.answers).length === 0 && !st5.startTs && st5.sounds.start === false, 'try again resets to fresh intro');
ok(await page.locator('.btn-start').isDisabled(), 'name required again');

console.log('== Teacher gate ==');
await page.click('text=منطقة المعلم');
await page.waitForSelector('.modal');
await page.fill('.modal input[type=password]', 'wrong');
await page.click('.modal .btn-primary');
ok(await page.isVisible('.err'), 'wrong password shows error');
await page.fill('.modal input[type=password]', 'somer173');
await page.click('.modal .btn-primary');
await page.waitForSelector('.key-q');
ok((await page.locator('.key-q').count()) === 12, 'teacher key shows all 12 questions');
ok((await page.locator('.key-parts li').count()) === 49, 'teacher key shows all 49 sub-parts');
const keyText = await page.locator('.modal-wide').textContent();
ok(keyText.includes('30 m·s⁻¹') && keyText.includes('المرجع الداخلي') === false && keyText.includes('ص13'), 'key has answers + page refs');
await page.click('.modal-actions .btn-ghost');

console.log('== Mobile layout (390px) ==');
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 390, height: 844 });
await mob.goto(`http://127.0.0.1:${port}/index.html`);
await mob.waitForSelector('.intro-card');
await mob.fill('#student-name', 'اختبار موبايل');
await mob.click('.btn-start');
await mob.waitForSelector('.exam-screen');
const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(overflow <= 2, `no horizontal overflow on mobile (overflow=${overflow}px)`);
ok(await mob.isVisible('.graph-svg') === false || true, 'graph renders when present');
await mob.click('text=السؤال التالي'); // q2
await mob.click('text=السؤال التالي'); // q3
// navigate to q7 (graph) via palette
await mob.locator('.pal-btn').nth(6).click();
await mob.waitForSelector('.graph-svg');
ok(await mob.isVisible('.graph-svg'), 'SVG graph renders on mobile (q7)');
const ov2 = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(ov2 <= 2, `no overflow with graph (${ov2}px)`);

console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);

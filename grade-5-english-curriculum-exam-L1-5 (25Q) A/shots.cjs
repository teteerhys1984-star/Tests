const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve('dist/index.html');

// build a perfect attempt payload from the exam data
const perfect = {};
const exam = require('./smoke-exam.cjs');
for (const q of exam.QUESTIONS) for (const it of q.items) perfect[`${q.id}/${it.id}`] = it.answer;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const errs = [];
  const shot = async (name, w, h, fn) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto(url);
    await p.waitForTimeout(1200);
    if (fn) await fn(p);
    await p.screenshot({ path: `/tmp/${name}.png`, fullPage: false });
    // horizontal overflow check
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const bodyOv = await p.evaluate(() => document.body.scrollWidth - window.innerWidth);
    console.log(name, 'overflow:', Math.max(ov, bodyOv));
    await ctx.close();
  };

  await shot('01-start-390', 390, 844);
  await shot('02-start-320', 320, 568);
  await shot('03-start-1280', 1280, 900);

  await shot('04-exam-390', 390, 844, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(700);
  });
  await shot('05-exam-320', 320, 568, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(600);
  });
  await shot('06-exam-passage-390', 390, 844, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(500);
    await p.click('[aria-label="Go to question 4"]');
    await p.waitForTimeout(600);
  });
  await shot('07-exam-768', 768, 1024, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(600);
  });
  await shot('08-exam-1280', 1280, 900, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(600);
  });
  await shot('09-landscape-812', 812, 375, async p => {
    await p.fill('#student-name', 'Layan Al-Ahmad');
    await p.getByRole('button',{name:'Start Exam'}).click();
    await p.waitForTimeout(600);
  });

  // results: seed localStorage with a perfect submitted attempt
  const seed = async p => {
    await p.evaluate(a => {
      localStorage.setItem('g5-unit1-model-a-attempt-v1', JSON.stringify({
        name: 'Layan Al-Ahmad', startedAt: Date.now() - 185000, answers: a, submittedAt: Date.now(),
      }));
    }, perfect);
    await p.reload();
    await p.waitForTimeout(1400);
  };
  await shot('10-results-390', 390, 844, seed);
  await shot('11-results-1280', 1280, 900, seed);
  await shot('12-results-320', 320, 568, seed);
  await shot('13-teacher-390', 390, 844, async p => {
    await p.evaluate(a => {
      localStorage.setItem('g5-unit1-model-a-attempt-v1', JSON.stringify({
        name: 'Layan Al-Ahmad', startedAt: Date.now() - 185000, answers: a, submittedAt: Date.now(),
      }));
    }, perfect);
    await p.reload();
    await p.waitForTimeout(900);
    await p.getByRole('button',{name:'Teacher Answer Key'}).click();
    await p.waitForTimeout(400);
  });

  console.log('page errors:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

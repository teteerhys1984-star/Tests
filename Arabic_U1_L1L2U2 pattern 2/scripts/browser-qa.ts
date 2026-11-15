import { chromium, type Page } from 'playwright';
import { QUESTIONS } from '../src/data/questions';

const BASE = 'http://127.0.0.1:4173';
const STORAGE_KEY = 'zahrat-almarifa:grade5-arabic-attempt:v1';
let failures = 0;
function check(name: string, condition: boolean, extra = '') {
  if (condition) console.log('PASS:', name);
  else { failures++; console.error('FAIL:', name, extra); }
}

const answers = Object.fromEntries(QUESTIONS.flatMap(q => q.subparts.map(s => [s.id, s.correct])));

async function text(page: Page) { return page.locator('body').innerText(); }

async function main() {
  const browser = await chromium.launch();
  const consoleErrors: string[] = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, locale: 'ar' });
  const page = await context.newPage();
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/shot-start-desktop.png', fullPage: true });
  check('start page title renders', (await text(page)).includes('اختبار اللغة العربية'));
  check('start has name field', await page.locator('#student-name').count() === 1);
  check('sound toggle exists', await page.getByRole('button', { name: /المؤثرات الصوتية/ }).count() === 1);

  const zipHref = await page.getByRole('link', { name: /تحميل ملفات المشروع/ }).getAttribute('href');
  check('project ZIP download link is present', !!zipHref && zipHref.endsWith('.zip'));
  if (zipHref) {
    const response = await page.request.get(new URL(zipHref, BASE).toString());
    check('project ZIP archive is served', response.ok() && (await response.body()).length > 100000);
  }

  // Empty-name validation
  await page.getByRole('button', { name: 'ابدئي الاختبار' }).click();
  await page.waitForTimeout(200);
  check('empty name validation blocks start', (await text(page)).includes('يرجى كتابة الاسم الكامل'));
  check('no attempt stored after validation failure', await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY) === null);

  // Start the exam
  await page.locator('#student-name').fill('سارة أحمد المحمد');
  await page.getByRole('button', { name: 'ابدئي الاختبار' }).click();
  await page.waitForTimeout(1300);
  let body = await text(page);
  check('exam starts after required name', body.includes('الوقت المنقضي') && body.includes('السؤال'));
  check('timer is counting in HH:MM:SS', /0[0-9]:0[0-9]:0[1-9]|0[0-9]:0[0-9]:[1-5][0-9]/.test(body), body.slice(0,300));
  await page.screenshot({ path: '/tmp/shot-exam-desktop.png', fullPage: true });

  // Answer question 1 through the UI
  const firstCorrect = QUESTIONS[0].subparts[0].correct[0];
  await page.getByText(firstCorrect, { exact: true }).first().click();
  await page.waitForTimeout(250);
  check('selection persists in UI', await page.getByText(firstCorrect, { exact: true }).first().isVisible());
  const beforeReloadTimer = (await text(page)).match(/\d{2}:\d{2}:\d{2}/)?.[0] ?? '';
  const storedAfterAnswer = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  check('answer and timer saved to localStorage', !!storedAfterAnswer && storedAfterAnswer.includes(QUESTIONS[0].subparts[0].correct[0]));
  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: 'networkidle' });
  const afterReloadBody = await text(page);
  const afterReloadTimer = afterReloadBody.match(/\d{2}:\d{2}:\d{2}/)?.[0] ?? '';
  check('refresh restores same exam, not start screen', !afterReloadBody.includes('ابدئي الاختبار') && afterReloadBody.includes('سارة أحمد المحمد'));
  check('timer is preserved and continues after refresh', afterReloadTimer >= beforeReloadTimer && afterReloadTimer !== '00:00:00', `${beforeReloadTimer} → ${afterReloadTimer}`);
  check('selected answer restored after refresh', await page.getByText(firstCorrect, { exact: true }).first().isVisible());
  check('submit button label is exact Arabic', (await page.getByRole('button', { name: 'تسليم الاختبار', exact: true }).count()) >= 1);
  check('submit disabled while incomplete', await page.getByRole('button', { name: 'تسليم الاختبار', exact: true }).first().isDisabled());

  // Mobile screenshot of exam navigation layout
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/shot-exam-mobile.png', fullPage: false });
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Seed a complete correct attempt, keeping the same attempt ID/start time
  const seed = JSON.parse(await page.evaluate((k) => localStorage.getItem(k)!, STORAGE_KEY));
  seed.answers = answers;
  seed.current = 29;
  await page.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: STORAGE_KEY, v: seed });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const completeBody = await text(page);
  check('complete attempt enables submit', !(await page.getByRole('button', { name: 'تسليم الاختبار', exact: true }).first().isDisabled()));
  check('all-answer progress shown', completeBody.includes('٪ مكتمل'));

  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.getByRole('button', { name: 'تسليم الاختبار', exact: true }).first().click();
  await page.waitForTimeout(900);
  const download = await downloadPromise;
  check('automatic TXT report download is generated', !!download);
  if (download) {
    check('TXT filename contains exam title and transliterated student name', /Arabic_Grade5_Grammar_Spelling_Sara_/.test(download.suggestedFilename()), download.suggestedFilename());
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs');
      const content = fs.readFileSync(path, 'utf8');
      check('TXT report has UTF-8 Arabic content', content.includes('اسم الطالبة: سارة أحمد المحمد') && content.includes('الدرجة الكلية: ١٠٠ من ١٠٠'));
      fs.writeFileSync('/tmp/report-sample.txt', content, 'utf8');
    }
  }
  const resultsBody = await text(page);
  check('submission immediately shows results page (no confirmation)', resultsBody.includes('المراجعة التفصيلية') && !resultsBody.includes('تأكيد التسليم'));
  check('results shows 100/100', resultsBody.includes('من ١٠٠') && resultsBody.includes('١٠٠٪'));
  check('results shows student name', resultsBody.includes('سارة أحمد المحمد'));
  check('results shows elapsed time', /الزمن المستغرق/.test(resultsBody));
  check('results shows overall grammar and spelling scores', resultsBody.includes('الدرجة العامة في قواعد اللغة') && resultsBody.includes('الدرجة العامة في الإملاء'));
  check('results shows all 30 question headers', QUESTIONS.every(q => resultsBody.includes(q.prompt)));
  check('results shows subpart review and references', resultsBody.includes('الإجابة الصحيحة') && resultsBody.includes('مرجع داخلي') && resultsBody.includes('التفسير:'));
  check('results shows skills-to-improve map', resultsBody.includes('مهارات تحتاج إلى مراجعة'));
  check('results shows duration as HH:MM:SS', /\d{2}:\d{2}:\d{2}/.test(resultsBody));
  await page.screenshot({ path: '/tmp/shot-results-desktop.png', fullPage: false });

  // Teacher key barrier
  await page.getByRole('button', { name: 'مفتاح الإجابات' }).click();
  await page.waitForTimeout(200);
  check('teacher gate asks for password', (await text(page)).includes('كلمة المرور'));
  await page.locator('#teacher-password').fill('wrong');
  await page.getByRole('button', { name: 'فتح دليل المعلمة' }).click();
  await page.waitForTimeout(200);
  check('wrong teacher password is rejected', (await text(page)).includes('كلمة المرور غير صحيحة'));
  await page.locator('#teacher-password').fill('somer173');
  await page.getByRole('button', { name: 'فتح دليل المعلمة' }).click();
  await page.waitForTimeout(300);
  const teacherBody = await text(page);
  check('correct password opens teacher key', teacherBody.includes('مفتاح إجابات معتمد') && teacherBody.includes('روبرِك التصحيح'));
  check('teacher key contains answer data', teacherBody.includes('الإجابة الصحيحة') && teacherBody.includes('خطأ شائع'));
  await page.screenshot({ path: '/tmp/shot-teacher-desktop.png', fullPage: false });

  // Close, test restart requires name again
  await page.getByRole('button', { name: 'العودة للنتائج' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'إعادة الاختبار' }).click();
  await page.waitForTimeout(300);
  const restartBody = await text(page);
  check('restart clears all previous data and shows name form', restartBody.includes('ابدئي الاختبار') && (await page.locator('#student-name').inputValue()) === '');
  check('restart removes stored attempt', await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY) === null);

  // Mobile start screen screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/shot-start-mobile.png', fullPage: true });

  check('no uncaught browser console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  console.log(failures === 0 ? '\nALL BROWSER CHECKS PASSED' : `\n${failures} BROWSER CHECKS FAILED`);
  await browser.close();
  if (failures) process.exit(1);
}
main().catch(error => { console.error(error); process.exit(1); });

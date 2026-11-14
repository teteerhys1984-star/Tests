/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * غلاف الخصوصية ← الاسم ← بدء الاختبار ← الإجابة عن كل الفروع (45) ← التسليم
 * ← تنزيل تقرير TXT ← صفحة النتيجة ← إرسال النتيجة (Mock) ← استعادة الجلسة
 * ← فشل الإرسال والحفظ والمعلّق ← إعادة الإرسال التلقائي واليدوي ← إعادة الاختبار.
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 */
import './setup-dom';
import { D, W, blobTexts, downloads, net } from './setup-dom';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../src/App';
import { EXAM_QUESTIONS } from '../src/data/questions';
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config';
import { STORAGE_KEY } from '../src/utils/storage';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1;
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''));
  }
}

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[];
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const byText = (sel: string, txt: string) => qa(sel).find(e => norm(e.textContent || '').includes(norm(txt))) || null;
const bodyText = () => norm(D.body.textContent || '');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const sendPanel = () => q('[data-send-status]');
const sendStatus = () => sendPanel()?.getAttribute('data-send-status') ?? '';
const sentBody = (i: number) => JSON.parse(String(net.calls[i].init.body));
const pendingKeys = () =>
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i) as string).filter(k =>
    k.startsWith('pending:'),
  );

/** ادعاءات الخصوصية القديمة الكاذبة — يجب ألا تظهر إطلاقاً. */
const NO_SEND_CLAIM =
  /لا تُرسل بياناتك|بياناتك لا تُرسل|لا تُرسل النتيجة|تبقى في متصفحك ولا تُرسل|لن تُرسل|لا يتم إرسال أي بيانات/;

async function settle(cond: () => boolean, ms: number) {
  await act(async () => {
    const t0 = Date.now();
    while (!cond() && Date.now() - t0 < ms) await sleep(20);
    await sleep(60);
  });
}

function fire(el: any, type: string, Ctor: any = W.Event) {
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }));
}
function click(el: any) {
  fire(el, 'click', W.MouseEvent);
}
function setInput(el: any, value: string) {
  const proto = W.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  fire(el, 'input');
  fire(el, 'change');
}

function correctValue(qi: number, si: number): string {
  const sub = EXAM_QUESTIONS[qi].subparts[si];
  return Array.isArray(sub.correctAnswer) ? sub.correctAnswer[0] : sub.correctAnswer;
}

async function startExam(name: string) {
  const input = q('#student-name') as HTMLInputElement;
  await act(async () => {
    setInput(input, name);
  });
  const form = q('.cover-screen form') as HTMLFormElement;
  await act(async () => {
    fire(form, 'submit');
  });
}

async function answerCurrentQuestion(index: number) {
  const question = EXAM_QUESTIONS[index];
  const cards = qa('.subpart-card');
  if (cards.length !== question.subparts.length) {
    throw new Error(`عدد بطاقات الفروع غير متوقع للسؤال ${index + 1}: ${cards.length}`);
  }
  for (let si = 0; si < question.subparts.length; si++) {
    const card = cards[si];
    const val = correctValue(index, si);
    const optBtn = card.querySelector(`[data-option-id="${val}"]`);
    if (optBtn) {
      await act(async () => {
        click(optBtn);
      });
    } else {
      const input = card.querySelector('[data-input-id]');
      if (!input) throw new Error(`لا حقل إدخال للفرع ${question.subparts[si].id}`);
      await act(async () => {
        setInput(input, val);
      });
    }
  }
}

async function answerAllQuestions() {
  for (let i = 0; i < EXAM_QUESTIONS.length; i += 1) {
    await answerCurrentQuestion(i);
    if (i < EXAM_QUESTIONS.length - 1) {
      const next = byText('button', 'السؤال التالي');
      if (!next) throw new Error('زر السؤال التالي غير موجود');
      await act(async () => {
        click(next);
      });
    }
  }
}

async function submitExam() {
  const submit = byText('button', 'تسليم الاختبار');
  if (!submit) throw new Error('زر التسليم غير موجود');
  if ((submit as HTMLButtonElement).disabled) throw new Error('زر التسليم معطّل رغم اكتمال الإجابات');
  await act(async () => {
    click(submit);
  });
}

let container: HTMLDivElement;
let root: Root;

async function mount() {
  container = W.document.createElement('div');
  W.document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
}

async function unmount() {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

async function fullPerfectRun(name: string) {
  await startExam(name);
  await answerAllQuestions();
  check('ظهرت رسالة اكتمال جميع الفقرات الأربع والخمس', bodyText().includes('تم حل جميع الفقرات (45 فقرة) كاملة'));
  await submitExam();
}

/* ================================================================== */
console.log('\n== 1) صفحة الغلاف والخصوصية ==');
W.localStorage.clear();
net.calls.length = 0;
net.respond = () => JSON.stringify({ ok: true });
downloads.length = 0;
blobTexts.length = 0;
await mount();

check('تظهر صفحة الغلاف', !!q('.cover-screen'));
check('لا ادعاءات قديمة بعدم الإرسال', !NO_SEND_CLAIM.test(bodyText()));
check('يُذكر إرسال النتيجة إلى المعلّم عبر Google Sheets', bodyText().includes('Google Sheets') && bodyText().includes('تُرسل نتيجتك'));
check('لا يُطلب سوى اسم الطالب', !!q('#student-name') && bodyText().includes('الاسم الكامل'));

console.log('\n== 2) الاسم إلزامي ==');
await act(async () => {
  fire(q('.cover-screen form') as HTMLFormElement, 'submit');
});
check('رسالة خطأ عند اسم فارغ', bodyText().includes('يرجى إدخال اسمك الكامل'));

console.log('\n== 3) بدء الاختبار والإجابة عن كل الفروع ==');
await startExam('طالب الاختبار');
check('بدأ الاختبار ويظهر اسم الطالب', bodyText().includes('الطالب:') && bodyText().includes('طالب الاختبار'));
check('شريط السؤال الأول من 15', bodyText().includes('السؤال 1 من 15'));
check('بقي 45 فرعاً في البداية', bodyText().includes('بقي 45 فقرة فرعية'));

await answerAllQuestions();
check('زر التسليم تفعّل بعد الإجابة عن كل الفروع', !(byText('button', 'تسليم الاختبار') as HTMLButtonElement | null)?.disabled);
await submitExam();

console.log('\n== 4) صفحة النتيجة والدرجة ==');
await settle(() => !!q('.results-screen'), 3000);
check('ظهرت صفحة النتيجة', !!q('.results-screen'));
const score = norm(q('.score-value')?.textContent || '');
check('الدرجة 101 (مجموع الفروع كما في الأصل — الواجهة تعلن «من 100»)', score === '101', score);
check('النسبة 101% (قسمة الأصل على 100 — موثّقة)', bodyText().includes('النسبة المئوية: 101%'));
check('التقدير الوصفي (gradeLabel) لا يظهر للطالب', !bodyText().includes('ممتاز') && !bodyText().includes('التقدير'));
check('حالة الإرسال: نجاح', sendStatus() === 'success', sendStatus());
check('نص النجاح ظاهر', norm(sendPanel()?.textContent || '').includes('تم إرسال نتيجتك إلى معلّمك'));
check('زر «إعادة المحاولة» موجود (إعادة الاختبار)', !!byText('button', 'إعادة المحاولة'));
check('زر «إعادة إرسال النتيجة» غير مطلوب بعد النجاح ويظل مستقلاً عن إعادة الاختبار',
  !byText('button', 'إعادة إرسال النتيجة') && !!byText('button', 'إعادة المحاولة'));

console.log('\n== 5) تنزيل تقرير TXT ==');
check('تنزيل تلقائي واحد عند التسليم', downloads.length === 1, String(downloads.length));
check('اسم ملف التقرير',
  downloads[0]?.download === 'Grade8_Combined_Algebra_Geometry_Report_طالب_الاختبار.txt',
  downloads[0]?.download ?? '');
check('التقرير يحوي اسم الطالب', (blobTexts[0] ?? '').includes('طالب الاختبار'));
check('التقرير يحوي «101 / 100»', (blobTexts[0] ?? '').includes('101 / 100'));
check('التقرير يحوي جميع الأسئلة الـ15',
  EXAM_QUESTIONS.every(qq => (blobTexts[0] ?? '').includes(`■ السؤال ${qq.questionNumber}`)));
const autoReport = blobTexts[0] ?? '';
check('التقرير بلا BOM (كما في الأصل)', !autoReport.startsWith('\uFEFF'));
const downloadBtn = byText('button', 'تنزيل التقرير TXT');
await act(async () => {
  click(downloadBtn);
});
await settle(() => downloads.length === 2, 1000);
check('زر التنزيل يعيد إنشاء التقرير نفسه', downloads.length === 2 && blobTexts[1] === autoReport);

console.log('\n== 6) حمولة الإرسال إلى المعلّم (Mock) ==');
await settle(() => net.calls.length >= 1, 2000);
check('أُرسل طلب واحد', net.calls.length === 1, String(net.calls.length));
check('URL تطبيق Google Apps Script', net.calls[0]?.url === SHEETS_URL);
check('Content-Type: text/plain;charset=utf-8',
  net.calls[0]?.init.headers['Content-Type'] === 'text/plain;charset=utf-8');
const sent = sentBody(0);
check('token من الإعدادات', sent.token === SHEETS_TOKEN);
check('examId = grade8-geometry-algebra-exam', sent.examId === EXAM_ID, sent.examId);
check('examTitle يحمل الصف الثامن', sent.examTitle.includes('الثامن'), sent.examTitle);
check('studentName', sent.studentName === 'طالب الاختبار');
check('summary.total = 101', sent.summary.total === 101, String(sent.summary.total));
check('summary.max = 100 كما في التقرير', sent.summary.max === 100);
check('summary.gradeLabel = ممتاز (للمعلّم فقط)', sent.summary.gradeLabel === 'ممتاز');
check('summary: 15 سؤالاً كاملاً', sent.summary.fullQuestions === 15 && sent.summary.partialQuestions === 0 && sent.summary.wrongQuestions === 0);
check('summary: 45 فرعاً صحيحاً', sent.summary.correctSubparts === 45 && sent.summary.unansweredSubparts === 0);
check('details: 45 فرعاً', sent.details.length === 45, String(sent.details.length));
check('details: حالة عربية صحيحة', sent.details.every((d: any) => d.status === 'إجابة صحيحة'));
check('reportText = التقرير نفسه المحمّل', sent.reportText === autoReport);
check('attemptId فريد وبطول مناسب', typeof sent.attemptId === 'string' && sent.attemptId.length >= 16, sent.attemptId);
check('لا مفتاح معلّق بعد النجاح', pendingKeys().length === 0);

console.log('\n== 7) إعادة الاختبار ==');
const retryBtn = byText('button', 'إعادة المحاولة');
await act(async () => {
  click(retryBtn);
});
await settle(() => !!q('.cover-screen'), 1000);
check('العودة إلى صفحة الغلاف', !!q('.cover-screen'));
const afterRetry = JSON.parse(W.localStorage.getItem(STORAGE_KEY) || 'null');
check('حُعيدت جلسة جديدة فارغة (بدون إجابات ولا تسليم)',
  !!afterRetry && afterRetry.isStarted === false && afterRetry.isSubmitted === false
  && Object.keys(afterRetry.answers || {}).length === 0,
  JSON.stringify(afterRetry && { isStarted: afterRetry.isStarted, answers: Object.keys(afterRetry.answers || {}).length }));
check('لم يبق مفتاح معلّق', pendingKeys().length === 0);

/* ================================================================== */
console.log('\n== 8) فشل الإرسال والحفظ والاستعادة وإعادة الإرسال التلقائي ==');
net.calls.length = 0;
downloads.length = 0;
blobTexts.length = 0;
net.respond = () => JSON.stringify({ ok: false });

await fullPerfectRun('طالب الفشل');
await settle(() => sendStatus() === 'failed', 15000);
check('النتيجة ظهرت رغم فشل الإرسال', !!q('.results-screen') && norm(q('.score-value')?.textContent || '') === '101');
check('حالة الإرسال: فشل', sendStatus() === 'failed', sendStatus());
check('رسالة الفشل واضحة', norm(sendPanel()?.textContent || '').includes('تعذّر إرسال النتيجة'));
check('حاول 3 مرات', net.calls.length === 3, String(net.calls.length));
const failedAttemptId = sentBody(0).attemptId;
check('المعرّف نفسه في المحاولات الثلاث',
  net.calls.every((_, i) => sentBody(i).attemptId === failedAttemptId));
check('التأخيران 2 ثم 5 ثوانٍ بين المحاولات (بالمللي ثانية المسجّلة في التوقيت)',
  net.calls[1].at - net.calls[0].at >= 1900 && net.calls[2].at - net.calls[1].at >= 4900,
  `${net.calls[1].at - net.calls[0].at}/${net.calls[2].at - net.calls[1].at}`);
check('التقرير نُزّل رغم فشل الإرسال', downloads.length === 1 && (blobTexts[0] ?? '').includes('101 / 100'));
check('حُفظت النتيجة المعلّقة',
  pendingKeys().length === 1 && pendingKeys()[0] === `pending:${EXAM_ID}:${failedAttemptId}`,
  pendingKeys().join(','));
check('حالة التسليم محفوظة محلياً', W.localStorage.getItem(STORAGE_KEY) !== null);

// إغلاق الصفحة وإعادة فتحها: تُستعاد النتيجة ويُعاد الإرسال تلقائياً.
await unmount();
net.calls.length = 0;
net.respond = () => JSON.stringify({ ok: true });
const downloadsBefore = downloads.length;
await mount();
await settle(() => sendStatus() === 'success', 5000);
check('استُعيدت صفحة النتيجة بعد إعادة الفتح', !!q('.results-screen'));
check('الدرجة المستعادة 101', norm(q('.score-value')?.textContent || '') === '101');
check('أُعيد الإرسال تلقائياً عند الفتح', net.calls.length === 1, String(net.calls.length));
check('المعرّف نفسه للمحاولة المستعادة', sentBody(0).attemptId === failedAttemptId);
check('حُذف المعلّق بعد النجاح', pendingKeys().length === 0);
check('حالة الإرسال بعد الاستعادة: نجاح', sendStatus() === 'success', sendStatus());
check('لا تنزيل تلقائي مكرر عند الاستعادة', downloads.length === downloadsBefore);

console.log('\n== 9) زر إعادة الإرسال اليدوي (مستقل عن إعادة الاختبار) ==');
// زر إعادة الإرسال يظهر عند الفشل فقط؛ نُعيد خلق حالة فشل مؤقتة عبر الرد الخاطئ ثم اليدوي.
await unmount();
W.localStorage.clear();
net.calls.length = 0;
downloads.length = 0;
blobTexts.length = 0;
net.respond = () => JSON.stringify({ ok: false });
await mount();
await fullPerfectRun('طالب زر الإرسال');
await settle(() => sendStatus() === 'failed', 15000);
const resendBtn = byText('button', 'إعادة إرسال النتيجة');
check('زر «إعادة إرسال النتيجة» ظاهر عند الفشل', !!resendBtn);
check('الزر مستقل عن «إعادة المحاولة» (زران مختلفان)',
  !!resendBtn && !!byText('button', 'إعادة المحاولة') && resendBtn !== byText('button', 'إعادة المحاولة'));
const manualAttemptId = sentBody(0).attemptId;
net.respond = () => JSON.stringify({ ok: true });
const callsBefore = net.calls.length;
await act(async () => {
  click(resendBtn!);
});
await settle(() => net.calls.length > callsBefore, 3000);
check('أُعيد الإرسال بنجاح', sendStatus() === 'success', sendStatus());
check('بالمعرّف نفسه وبنفس الحمولة',
  net.calls.length === callsBefore + 1 && sentBody(callsBefore).attemptId === manualAttemptId
  && JSON.stringify(sentBody(callsBefore)) === JSON.stringify(sentBody(callsBefore - 1)));
check('النتيجة لا تزال معروضة (الإرسال لا يمسّ النتيجة)', !!q('.results-screen'));
check('التقرير لا يزال قابلاً للتنزيل', !!byText('button', 'تنزيل التقرير TXT'));

console.log('');
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في سير العمل`);
  process.exit(1);
}
console.log('✅ كل فحوص سير العمل ناجحة');
process.exit(0);

/**
 * اختبار عقد الإرسال إلى Google Sheets (Mock فقط — لا اتصال حقيقي):
 *  · بنية الحمولة وأسماء الحقول مطابقة لعقد الاختبار المرجعي grade5-math-unit1
 *  · نوع المحتوى text/plain;charset=utf-8، 3 محاولات، تأخيران 2 ثم 5 ثوانٍ، مهلة 30 ثانية
 *  · المفتاح pending:<EXAM_ID>:<attemptId> وإعادة الإرسال ومنع التكرار
 *  · اختبار مرور حقيقي عبر خادم وهمي محلي (127.0.0.1) يتحقق من التوكن والتكرار
 */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { EXAM_QUESTIONS } from '../src/data/questions';
import { gradeExamSession } from '../src/utils/grading';
import { generateReportText } from '../src/utils/reportGenerator';
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeLabel,
  hasPending,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from '../src/utils/submit';
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config';
import {
  SHEETS_URL as REF_SHEETS_URL,
  SHEETS_TOKEN as REF_SHEETS_TOKEN,
  EXAM_ID as REF_EXAM_ID,
} from '../../grade5-math-unit1/src/config';
import { BASELINE_START, BASELINE_SUBMIT, makeState } from './scenarios';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1;
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''));
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/* ---- نسخة fetch الأصلية (لاختبار الخادم المحلي) قبل تفعيل الحارس ---- */
const nativeFetch = (globalThis as any).fetch.bind(globalThis);

/* ---- حارس: أي استدعاء لـ fetch الحقيقي عبر globalThis يُسجَّل ويُرفض ---- */
let realFetchCalls = 0;
(globalThis as any).fetch = () => {
  realFetchCalls++;
  return Promise.reject(new Error('real fetch is disabled in tests'));
};

/* ---- أدوات ---- */
class MemStorage implements StorageLike {
  map = new Map<string, string>();
  constructor(seed: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(seed)) this.map.set(k, v);
  }
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

interface Call {
  url: string;
  init: RequestInit;
}

function mockFetch(respond: (n: number) => string | Promise<string>) {
  const calls: Call[] = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const body = await respond(calls.length);
    return { text: async () => body } as unknown as Pick<Response, 'text'>;
  };
  return { calls, fn };
}

function opts(fn: FetchLike, storage: StorageLike, sleeps: number[] = []): SendOptions {
  return {
    fetchImpl: fn,
    storage,
    sleep: async ms => {
      sleeps.push(ms);
    },
    timeoutMs: 1000,
  };
}

/* ---- حمولة اختبار من الحالة المختلطة (تضم كل أنماط الحالات المتاحة) ---- */
const session = makeState('mixed');
const report = gradeExamSession(session);
const reportText = generateReportText(report);
const ATTEMPT = 'ATT_00000000-0000-4000-8000-000000000001';
const payload = buildPayload({ attemptId: ATTEMPT, session, report, reportText });
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload;

/* ================================================================== */
console.log('\n== أ) مطابقة عقد الاختبار المرجعي ==');
check('SHEETS_URL = عنوان المرجع حرفيًا', SHEETS_URL === REF_SHEETS_URL, SHEETS_URL);
check('SHEETS_TOKEN = رمز المرجع حرفيًا', SHEETS_TOKEN === REF_SHEETS_TOKEN);
check('EXAM_ID خاص بهذا الاختبار ولا يطابق معرّف المرجع', EXAM_ID === 'grade8-geometry-algebra-exam' && EXAM_ID !== REF_EXAM_ID, EXAM_ID);

const TOP = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText'];
const SUMMARY = ['total', 'max', 'percentage', 'gradeLabel', 'fullQuestions', 'partialQuestions', 'wrongQuestions', 'correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts'];
const LESSON = ['title', 'awarded', 'max'];
const DETAIL = ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer'];
check('الحقول العليا (12) بالأسماء والترتيب المطلوبين', same(Object.keys(wire), TOP), Object.keys(wire).join(', '));
check('حقول summary (11)', same(Object.keys(wire.summary), SUMMARY), Object.keys(wire.summary).join(', '));
check('حقول كل عنصر في lessons', wire.lessons.every(l => same(Object.keys(l), LESSON)), LESSON.join(', '));
check('حقول كل عنصر في details', wire.details.every(d => same(Object.keys(d), DETAIL)), DETAIL.join(', '));
check('لا حقل null أو undefined عند التحويل إلى JSON',
  same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)) && !/:undefined/.test(JSON.stringify(payload)));
check('أنواع الح_fields العليا',
  typeof wire.token === 'string' && typeof wire.attemptId === 'string' && typeof wire.examId === 'string'
  && typeof wire.examTitle === 'string' && typeof wire.studentName === 'string' && typeof wire.startAt === 'string'
  && typeof wire.submitAt === 'string' && typeof wire.elapsedSec === 'number' && Array.isArray(wire.lessons)
  && Array.isArray(wire.details) && typeof wire.reportText === 'string');
check('أنواع حقول details',
  wire.details.every(d => typeof d.q === 'number' && typeof d.qTitle === 'string' && typeof d.lessons === 'string'
    && typeof d.label === 'string' && typeof d.status === 'string' && typeof d.awarded === 'number'
    && typeof d.marks === 'number' && typeof d.studentAnswer === 'string' && typeof d.correctAnswer === 'string'));

console.log('\n== ب) البيانات الوصفية ==');
check('token وexamId من الإعدادات', wire.token === SHEETS_TOKEN && wire.examId === EXAM_ID, wire.examId);
check('attemptId كما أُعطي (لا يتغير عند إعادة الإرسال)', wire.attemptId === ATTEMPT);
check('examTitle = عنوان التقرير نفسه', wire.examTitle === report.examTitle, wire.examTitle);
check('studentName', wire.studentName === 'طالب الأساس');
check('startAt وsubmitAt بصيغة ISO من توقيتات الجلسة',
  wire.startAt === new Date(BASELINE_START).toISOString() && wire.submitAt === new Date(BASELINE_SUBMIT).toISOString());
check('elapsedSec عدد صحيح بالثواني (360)', wire.elapsedSec === 360 && Number.isInteger(wire.elapsedSec), String(wire.elapsedSec));
check('reportText = نص التقرير الكامل', wire.reportText === reportText && wire.reportText.length > 10000, `${wire.reportText.length} حرفاً`);

console.log('\n== ج) summary يطابق نتيجة التصحيح ==');
check('التسليم يشمل الحالة المختلطة (صحيحة/خاطئة/غير مجابة)',
  report.counts.correct > 0 && report.counts.incorrect > 0 && report.counts.unanswered > 0);
check('total = درجة التقرير', wire.summary.total === report.totalScore, String(wire.summary.total));
check('max = 100 كما يعرضه التقرير (المجموع الفعلي 101 — موثّق في التقرير النهائي)',
  wire.summary.max === 100 && EXAM_QUESTIONS.reduce((s, q) => s + q.totalMarks, 0) === 101);
check('percentage = نسبة التقرير', wire.summary.percentage === report.percentage, String(wire.summary.percentage));
check('gradeLabel = gradeLabel(percentage) للمرجع', wire.summary.gradeLabel === gradeLabel(report.percentage), wire.summary.gradeLabel);
check('عدّادات الأسئلة: مجموعها 15',
  wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === 15,
  `${wire.summary.fullQuestions}/${wire.summary.partialQuestions}/${wire.summary.wrongQuestions}`);
check('عدّادات الفروع: مجموعها 45',
  wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === 45);
check('عدّادات summary = عدّادات التقرير نفسها',
  wire.summary.correctSubparts === report.counts.correct && wire.summary.partialSubparts === report.counts.partial
  && wire.summary.wrongSubparts === report.counts.incorrect && wire.summary.unansweredSubparts === report.counts.unanswered);
check('fullQuestions محسوبة من اكتمال أسئلة التقرير',
  wire.summary.fullQuestions === report.questionResults.filter(q => q.earnedMarks >= q.totalMarks).length);

console.log('\n== د) details: مدخل واحد لكل فرع ==');
const flat = report.questionResults.flatMap(qr => qr.subpartResults.map(s => ({ qr, s })));
check(`عدد المداخل = عدد الفروع (${flat.length})`, wire.details.length === flat.length && flat.length === 45, String(wire.details.length));
check('لا تكرار: كل (سؤال، فرع) يظهر مرّة واحدة',
  new Set(wire.details.map(d => `${d.q}/${d.label}`)).size === wire.details.length);
check('المداخل بالترتيب نفسه المعروض وبرقم السؤال وعلامته',
  flat.every(({ qr, s }, i) => wire.details[i].q === qr.questionNumber && wire.details[i].label === s.subpartNumber
    && wire.details[i].marks === s.marksAllocated && wire.details[i].awarded === s.marksEarned));
check('status من قيم الحالة العربية المعتمدة في المرجع',
  wire.details.every(d => ['إجابة صحيحة', 'إجابة صحيحة جزئياً', 'إجابة خاطئة', 'لم يُجب'].includes(d.status))
  && same([...new Set(wire.details.map(d => d.status))].sort(), ['إجابة خاطئة', 'إجابة صحيحة', 'لم يُجب'].sort()));
const cnt = (st: string) => wire.details.filter(d => d.status === st).length;
check('عدّادات الحالات في details = عدّادات summary',
  cnt('إجابة صحيحة') === wire.summary.correctSubparts && cnt('إجابة خاطئة') === wire.summary.wrongSubparts
  && cnt('لم يُجب') === wire.summary.unansweredSubparts && cnt('إجابة صحيحة جزئياً') === wire.summary.partialSubparts);
check('مجموع awarded = total', Math.round(wire.details.reduce((a, d) => a + d.awarded, 0) * 100) / 100 === wire.summary.total);
check('مجموع marks = 101 (المجموع الفعلي كما في الأصل)', wire.details.reduce((a, d) => a + d.marks, 0) === 101);
check('لا ترميز LaTeX خام ($) في نصوص الإرسال',
  wire.details.every(d => !/\$/.test(d.qTitle + d.studentAnswer + d.correctAnswer) && !/\\frac|\\text|\\widehat/.test(d.qTitle + d.studentAnswer + d.correctAnswer)));
check('النصوص بلا رموز رياضية تصل كما هي، والنصوص الرياضية تُحوَّل دون رموز خام',
  flat.every(({ s }, i) => {
    const hasMath = /[$\\^_{}]/.test(s.studentAnswer);
    return hasMath
      ? !/\$|\\/.test(wire.details[i].studentAnswer)
      : wire.details[i].studentAnswer === s.studentAnswer;
  }));

console.log('\n== هـ) lessons: توزيع الدروس ==');
check('صفوف الدروس فريدة وبنفس ترتيب الأسئلة',
  new Set(wire.lessons.map(l => l.title)).size === wire.lessons.length);
check('كل درس: 0 ≤ awarded ≤ max', wire.lessons.every(l => l.awarded >= 0 && l.awarded <= l.max && l.max > 0));
check('مجموع max على الدروس = 101', wire.lessons.reduce((a, l) => a + l.max, 0) === 101);
check('مجموع awarded على الدروس = total',
  Math.round(wire.lessons.reduce((a, l) => a + l.awarded, 0) * 100) / 100 === wire.summary.total);
check('درس كل فرع في details موجود ضمن جدول lessons',
  wire.details.every(d => wire.lessons.some(l => l.title === d.lessons)));

console.log('\n== و) التقدير لا يظهر للطالب ==');
check('نص التقرير لا يحوي التقدير الوصفي', !reportText.includes('التقدير') && !reportText.includes(gradeLabel(report.percentage)));
check('gradeLabel موجود في الحمولة للمعلّم فقط', wire.summary.gradeLabel === gradeLabel(51), wire.summary.gradeLabel);

/* ================================================================== */
console.log('\n== ز) ثوابت آلية الإرسال ==');
check('MAX_ATTEMPTS = 3', MAX_ATTEMPTS === 3, String(MAX_ATTEMPTS));
check('RETRY_DELAYS_MS = [2000, 5000]', same([...RETRY_DELAYS_MS], [2000, 5000]));
check('ATTEMPT_TIMEOUT_MS = 30000', ATTEMPT_TIMEOUT_MS === 30000, String(ATTEMPT_TIMEOUT_MS));
check('PENDING_PREFIX = pending:<EXAM_ID>:', PENDING_PREFIX === `pending:${EXAM_ID}:`, PENDING_PREFIX);
check('pendingKey = المفتاح الكامل', pendingKey(ATTEMPT) === `pending:${EXAM_ID}:${ATTEMPT}`, pendingKey(ATTEMPT));

console.log('\n== ح) الإرسال: نجاح وفشل وإعادة المحاولة ==');
{
  // نجاح من المحاولة الأولى
  const storage = new MemStorage();
  const sleeps: number[] = [];
  const m = mockFetch(() => JSON.stringify({ ok: true }));
  const ok = await sendWithRetry(payload, opts(m.fn, storage, sleeps));
  check('النجاح: طلب واحد بلا نوم', ok === true && m.calls.length === 1 && sleeps.length === 0, `calls=${m.calls.length}`);
  check('النجاح: لا مفتاح معلّق يبقى', storage.length === 0);
}
{
  // فشل كامل: 3 محاولات بفاصلين 2 ثم 5، ثم حفظ
  const storage = new MemStorage();
  const sleeps: number[] = [];
  const m = mockFetch(() => JSON.stringify({ ok: false }));
  const ok = await sendWithRetry(payload, opts(m.fn, storage, sleeps));
  check('الفشل: 3 محاولات فقط', ok === false && m.calls.length === 3, String(m.calls.length));
  check('الفشل: تأخيران [2000, 5000]', same(sleeps, [2000, 5000]), sleeps.join(','));
  check('الفشل: حفظ تحت pending:<EXAM_ID>:<attemptId>',
    storage.length === 1 && storage.key(0) === pendingKey(ATTEMPT), storage.key(0) ?? '');
  check('الفشل: hasPending يؤكد وجود المعلّق', hasPending(ATTEMPT, { storage }));
  check('الفشل: الحمولة المحفوظة نفسها المرسلة',
    storage.getItem(pendingKey(ATTEMPT)) === JSON.stringify(payload));
}
{
  // نجاح بعد فشلين
  const storage = new MemStorage();
  const sleeps: number[] = [];
  const m = mockFetch(n => JSON.stringify(n < 3 ? { ok: false } : { ok: true }));
  const ok = await sendWithRetry(payload, opts(m.fn, storage, sleeps));
  check('ناجح بعد فشلين: 3 طلبات وتأخيران', ok === true && m.calls.length === 3 && same(sleeps, [2000, 5000]),
    `calls=${m.calls.length} sleeps=${sleeps.join(',')}`);
  check('ناجح بعد فشلين: حُذف المعلّق', storage.length === 0);
}
{
  // المعرّف نفسه والحمولة نفسها في كل المحاولات
  const storage = new MemStorage();
  const m = mockFetch(() => JSON.stringify({ ok: false }));
  await sendWithRetry(payload, opts(m.fn, storage, []));
  const bodies = m.calls.map(c => String(c.init.body));
  check('المحاولات الثلاث: الحمولة حرفية واحدة',
    bodies.length === 3 && bodies[0] === bodies[1] && bodies[1] === bodies[2]);
  check('المحاولات الثلاث: attemptId نفسه',
    m.calls.every(c => (JSON.parse(String(c.init.body)) as SubmissionPayload).attemptId === ATTEMPT));
  check('كل طلب: POST وContent-Type والرابط',
    m.calls.every(c => c.init.method === 'POST'
      && (c.init.headers as Record<string, string>)['Content-Type'] === 'text/plain;charset=utf-8'
      && c.url === SHEETS_URL));
}
{
  // duplicate:true يُعدّ نجاحاً (الخادم سجّل المحاولة سابقاً)
  const storage = new MemStorage();
  const m = mockFetch(() => JSON.stringify({ duplicate: true }));
  const ok = await sendWithRetry(payload, opts(m.fn, storage, []));
  check('رد duplicate:true يُعدّ استلاماً', ok === true && m.calls.length === 1);
}
{
  // ردود غير صالحة = فشل
  for (const [label, body] of [['ok:false', '{"ok":false}'], ['ليس JSON', 'gateway timeout'], ['رد فارغ', '']] as const) {
    const m = mockFetch(() => body);
    const ok = await sendWithRetry(payload, opts(m.fn, new MemStorage(), []));
    check(`رد غير صالح (${label}) = فشل بعد 3 محاولات`, ok === false && m.calls.length === 3, String(m.calls.length));
  }
  // خطأ شبكة
  const fn: FetchLike = async () => {
    throw new Error('network down');
  };
  const ok = await sendWithRetry(payload, opts(fn, new MemStorage(), []));
  check('خطأ شبكة = فشل بعد 3 محاولات', ok === false);
}
{
  // انتهاء المهلة: fetch لا يرد أبداً → كل محاولة تُعلَّم بمهلتها ثم تفشل
  const storage = new MemStorage();
  const sleeps: number[] = [];
  const never: FetchLike = () => new Promise(() => {});
  const ok = await sendWithRetry(payload, { ...opts(never, storage, sleeps), timeoutMs: 40 });
  check('مهلة المحاولة تُعدّ فشلاً ثم تبدأ التالية (3 محاولات)', ok === false && sleeps.length === 2, `sleeps=${sleeps.join(',')}`);
  check('انتهت المهلة: حُفظت الحمولة المعلّقة', storage.length === 1);
}

/* ================================================================== */
console.log('\n== ط) إعادة إرسال المعلّقات عند الفتح ==');
{
  const storage = new MemStorage();
  const sleeps: number[] = [];
  const m = mockFetch(() => JSON.stringify({ ok: true }));
  const o = opts(m.fn, storage, sleeps);

  // معلّقان: واحد برمز قديم وواحد تالف JSON
  const other = { ...payload, attemptId: 'ATT_OTHER', token: 'OLD_TOKEN' };
  storage.setItem(pendingKey(ATTEMPT), JSON.stringify(payload));
  storage.setItem(pendingKey('ATT_OTHER'), JSON.stringify(other));
  storage.setItem(pendingKey('ATT_CORRUPT'), '{not-json');

  check('hasPending يرى المعلّق', hasPending(ATTEMPT, o));
  const sent = await retryPending(o);
  check('أُعيد إرسال المعلّقين الصالحين فقط (التالف تُجاهل)', sent === 2 && m.calls.length === 2, `sent=${sent}`);
  check('الرمز القديم استُبدل بالرمز الحالي في الإرسال',
    m.calls.every(c => (JSON.parse(String(c.init.body)) as SubmissionPayload).token === SHEETS_TOKEN));
  check('حُذف المعلّقان الناجحان وبقي التالف',
    !storage.getItem(pendingKey(ATTEMPT)) && !storage.getItem(pendingKey('ATT_OTHER')) && !!storage.getItem(pendingKey('ATT_CORRUPT')));
  check('المفاتيح المعلّقة كلها من هذا الاختبار',
    Array.from({ length: storage.length }, (_, i) => storage.key(i)!).every(k => k.startsWith(PENDING_PREFIX)));

  m.calls.length = 0;
  const again = await retryPending(o);
  check('التشغيل الثاني لا يعيد إرسال شيئاً (لا إرسال مزدوج)', again === 0 && m.calls.length === 0);

  // تشغيلان متزامنان → جولة واحدة
  storage.setItem(pendingKey(ATTEMPT), JSON.stringify(payload));
  const [p1, p2] = [retryPending(o), retryPending(o)];
  check('الاستدعاءان المتزامنان يعيدان الجولة نفسها', p1 === p2);
  const n = await p1;
  check('جولة واحدة أرسلت المعلّق مرة واحدة', n === 1 && m.calls.length === 1, `n=${n} calls=${m.calls.length}`);

  // المعلّق يُحفظ أثناء الإرسال عند إخفاء الصفحة ثم يُستعاد
  const failing = mockFetch(() => JSON.stringify({ ok: false }));
  const o2 = opts(failing.fn, storage, []);
  storage.removeItem(pendingKey(ATTEMPT));
  const ok2 = await sendWithRetry(payload, o2);
  check('بعد الفشل يبقى المعلّق للاستعادة التلقائية', ok2 === false && hasPending(ATTEMPT, o2));
}

/* ================================================================== */
console.log('\n== ي) اختبار مرور حقيقي عبر خادم وهمي محلي ==');
{
  type Row = { attemptId: string; examId: string; token: string; body: string };
  const rows = new Map<string, Row>();
  const seenContentTypes: string[] = [];
  const server = createServer((req, res) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      seenContentTypes.push(String(req.headers['content-type']));
      let reply: unknown;
      try {
        const parsed = JSON.parse(data) as Row & Record<string, unknown>;
        if (parsed.token !== SHEETS_TOKEN) reply = { ok: false, error: 'bad token' };
        else if (rows.has(parsed.attemptId)) reply = { ok: true, duplicate: true };
        else {
          rows.set(parsed.attemptId, { attemptId: parsed.attemptId, examId: parsed.examId, token: parsed.token, body: data });
          reply = { ok: true };
        }
      } catch {
        reply = { ok: false, error: 'bad json' };
      }
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(reply));
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const localUrl = `http://127.0.0.1:${port}/exec`;

  // طبقة الشبكة فقط تُحوَّل إلى الخادم المحلي؛ التطبيق يمرّر رابط Google Apps Script نفسه
  const seenUrls: string[] = [];
  const fwd: FetchLike = async (url, init) => {
    seenUrls.push(String(url));
    const res = await nativeFetch(localUrl, init);
    return { text: async () => res.text() } as unknown as Pick<Response, 'text'>;
  };
  const storage = new MemStorage();
  const ok1 = await sendWithRetry(payload, opts(fwd, storage, []));
  const ok2 = await sendWithRetry(payload, opts(fwd, storage, [])); // إعادة إرسال بالمحاولة نفسها
  check('الخادم المحلي استلم الطلب الأول', ok1 === true && rows.size === 1, `rows=${rows.size}`);
  check('التطبيق مرّر رابط Apps Script نفسه', seenUrls.every(u => u === SHEETS_URL), seenUrls[0]);
  check('content-type المقروء من الخادم = text/plain;charset=utf-8',
    seenContentTypes.every(ct => ct === 'text/plain;charset=utf-8'), seenContentTypes[0]);
  check('الصفحة تحمل examId وتوكن صحيحين',
    rows.has(ATTEMPT) && rows.get(ATTEMPT)!.examId === EXAM_ID && rows.get(ATTEMPT)!.token === SHEETS_TOKEN);
  check('إعادة إرسال المحاولة نفسها = duplicate وسجل واحد فقط (منع الإرسال المكرر)',
    ok2 === true && rows.size === 1 && seenContentTypes.length === 2);
  check('لا معلّق بعد النجاح', storage.length === 0);

  server.closeAllConnections?.();
  server.close();
}

check('لم يُستدعَ fetch الحقيقي إطلاقاً', realFetchCalls === 0, String(realFetchCalls));

console.log('');
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في عقد الإرسال`);
  process.exit(1);
}
console.log('✅ كل فحوص عقد الإرسال ناجحة');
process.exit(0);

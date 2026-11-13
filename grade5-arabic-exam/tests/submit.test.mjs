/**
 * إرسال النتيجة إلى المعلّم — بخادم وهمي وساعة افتراضية (لا اتصال حقيقي بالشبكة).
 * كل اختبار يقود الصفحة الحقيقية: بدء، إجابة بالنقر، تسليم، ثم مراقبة الطلبات وحالة الإرسال والتخزين.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  openExam, submitExamInUi, takeExamInUi, settle, sendText, FakeServer, FakeStorage, Clock, PENDING_PREFIX, EXAM_DIR_NAME,
} from "./harness.mjs";

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
const SENDING = "جارٍ إرسال النتيجة…";
const SUCCESS = "تم إرسال نتيجتك إلى معلّمك ✓";
const RESEND = "إعادة إرسال النتيجة";

const pendingKeys = (page) => page.storage.keys("pending:");
const resultShown = (page) => page.visible("#scr-results") && page.text("#res-score") === "١٠٠" && page.text("#res-pct") === "١٠٠%";
const resendVisible = (page) => page.visible("#btn-resend");

test("نجاح الإرسال: طلب POST واحد بنوع text/plain، ثم «تم إرسال نتيجتك إلى معلّمك ✓»", async () => {
  const page = openExam({ server: new FakeServer(["hang"]) });
  await takeExamInUi(page);
  page.click("#btn-submit");
  // فور التسليم: النتيجة ظاهرة والإرسال جارٍ في الخلفية
  assert.ok(resultShown(page));
  assert.equal(sendText(page), SENDING);
  assert.ok(page.visible("#send-status"));
  assert.ok(!resendVisible(page));
  page.close();

  const ok = openExam();
  await submitExamInUi(ok);
  assert.equal(ok.server.count, 1);
  const req = ok.server.requests[0];
  assert.equal(req.url, SHEETS_URL);
  assert.equal(req.init.method, "POST");
  assert.equal(JSON.stringify(req.init.headers), '{"Content-Type":"text/plain;charset=utf-8"}');
  assert.equal(req.init.redirect, "follow");
  assert.equal(typeof req.init.body, "string");
  assert.ok(req.init.signal, "each try carries an abort signal for the 30 s limit");
  assert.equal(req.payload.attemptId, ok.json("S.attemptId"));
  assert.equal(sendText(ok), SUCCESS);
  assert.ok(ok.$("#send-status").classList.contains("ok"));
  assert.ok(!resendVisible(ok));
  assert.ok(resultShown(ok));
  assert.deepEqual(pendingKeys(ok), []);
  assert.equal(ok.json("S.sent"), true);
  // لا طلبات أخرى مهما مرّ من وقت
  await ok.clock.advance(120000);
  assert.equal(ok.server.count, 1);
  assert.deepEqual(ok.pageErrors, []);
  ok.close();
});

test("ردّ duplicate:true يُعدّ نجاحاً (المحاولة مسجّلة عند الخادم)", async () => {
  const page = openExam({ server: new FakeServer(["duplicate"]) });
  await submitExamInUi(page);
  assert.equal(sendText(page), SUCCESS);
  assert.equal(page.server.count, 1);
  assert.deepEqual(pendingKeys(page), []);
  page.close();
});

test("فشل المحاولة الأولى ثم النجاح: انتظار ثانيتين ثم محاولة ثانية بالحمولة نفسها", async () => {
  const page = openExam({ server: new FakeServer(["network", "ok"]) });
  await submitExamInUi(page);
  assert.equal(page.server.count, 1);
  assert.equal(sendText(page), SENDING);
  assert.ok(resultShown(page));
  await page.clock.advance(1999);
  assert.equal(page.server.count, 1, "no second try before 2 s");
  await page.clock.advance(1);
  assert.equal(page.server.count, 2);
  assert.equal(page.server.requests[1].at - page.server.requests[0].at, 2000);
  assert.equal(page.server.requests[1].init.body, page.server.requests[0].init.body);
  assert.equal(sendText(page), SUCCESS);
  assert.deepEqual(pendingKeys(page), []);
  await page.clock.advance(60000);
  assert.equal(page.server.count, 2);
  page.close();
});

test("فشل المحاولتين الأوليين ثم النجاح: الفاصلان 2 ثم 5 ثوانٍ", async () => {
  const page = openExam({ server: new FakeServer(["html", "rejected", "ok"]) });
  await submitExamInUi(page);
  await page.clock.advance(2000);
  assert.equal(page.server.count, 2);
  await page.clock.advance(4999);
  assert.equal(page.server.count, 2, "no third try before 5 s");
  assert.equal(sendText(page), SENDING);
  await page.clock.advance(1);
  assert.equal(page.server.count, 3);
  assert.deepEqual(page.server.requests.map((r) => r.at - page.server.requests[0].at), [0, 2000, 7000]);
  assert.equal(sendText(page), SUCCESS);
  page.close();
});

test("فشل المحاولات الثلاث: 3 طلبات فقط، حفظ تحت pending:<EXAM_ID>:<attemptId>، رسالة واضحة وزر مستقل", async () => {
  for (const modes of [["network", "network", "network"], ["html", "rejected", "network"]]) {
    const page = openExam({ server: new FakeServer(modes, "network") });
    await submitExamInUi(page);
    await page.clock.advance(7000);
    assert.equal(page.server.count, 3);
    assert.deepEqual(page.server.requests.map((r) => r.at - page.server.requests[0].at), [0, 2000, 7000]);
    await page.clock.advance(300000);
    assert.equal(page.server.count, 3, "exactly three tries in total");
    // كل المحاولات بالمعرّف نفسه والحمولة نفسها
    assert.equal(new Set(page.server.requests.map((r) => r.init.body)).size, 1);

    const attemptId = page.json("S.attemptId");
    const key = "pending:" + EXAM_DIR_NAME + ":" + attemptId;
    assert.equal(key, "pending:grade5-arabic-exam:" + attemptId);
    assert.deepEqual(pendingKeys(page), [key]);
    assert.deepEqual(JSON.parse(page.storage.getItem(key)), page.server.requests[0].payload);

    // الطالبة ترى نتيجتها رغم فشل الإرسال
    assert.ok(resultShown(page));
    assert.match(sendText(page), /^تعذّر إرسال نتيجتك إلى معلّمك\./);
    assert.match(sendText(page), /محفوظة على هذا الجهاز/);
    assert.ok(page.$("#send-status").classList.contains("fail"));
    assert.ok(resendVisible(page));
    assert.equal(page.text("#btn-resend"), RESEND);
    // زر إعادة الإرسال ليس زر إعادة الاختبار
    assert.notEqual(page.$("#btn-resend"), page.$("#btn-retry"));
    assert.equal(page.text("#btn-retry"), "إعادة المحاولة");
    assert.ok(!page.$(".res-actions").contains(page.$("#btn-resend")));
    assert.equal(page.json("S.sent"), false);
    assert.equal(page.json("S.status"), "submitted");
    page.close();
  }
});

test("المهلة: محاولة بلا ردّ تُقطع بعد 30 ثانية وتُحتسب فشلاً", async () => {
  const page = openExam({ server: new FakeServer(["hang", "hang", "hang"], "hang") });
  await submitExamInUi(page);
  assert.equal(page.server.count, 1);
  await page.clock.advance(29999);
  assert.equal(page.server.count, 1);
  assert.equal(page.server.requests[0].aborted, false);
  assert.equal(sendText(page), SENDING);
  await page.clock.advance(1);
  assert.equal(page.server.requests[0].aborted, true, "aborted at 30 s");
  await page.clock.advance(2000);
  assert.equal(page.server.count, 2);
  await page.clock.advance(30000 + 5000);
  assert.equal(page.server.count, 3);
  assert.deepEqual(page.server.requests.map((r) => r.at - page.server.requests[0].at), [0, 32000, 67000]);
  assert.equal(sendText(page), SENDING);
  await page.clock.advance(30000);
  assert.deepEqual(page.server.requests.map((r) => r.aborted), [true, true, true]);
  assert.match(sendText(page), /^تعذّر إرسال نتيجتك/);
  assert.ok(resendVisible(page));
  assert.equal(pendingKeys(page).length, 1);
  await page.clock.advance(300000);
  assert.equal(page.server.count, 3);
  page.close();
});

test("المهلة ثم النجاح: ردّ معلّق في المحاولة الأولى ثم قبول في الثانية", async () => {
  const page = openExam({ server: new FakeServer(["hang", "ok"]) });
  await submitExamInUi(page);
  await page.clock.advance(32000);
  assert.equal(page.server.count, 2);
  assert.equal(sendText(page), SUCCESS);
  assert.deepEqual(pendingKeys(page), []);
  page.close();
});

test("إعادة الإرسال تلقائياً عند فتح الاختبار لاحقاً، وحذف النتيجة المعلّقة بعد النجاح", async () => {
  const storage = new FakeStorage();
  const first = openExam({ storage, server: new FakeServer([], "network") });
  await submitExamInUi(first);
  await first.clock.advance(7000);
  const attemptId = first.json("S.attemptId");
  const sentBody = first.server.requests[0].payload;
  assert.deepEqual(pendingKeys(first), [PENDING_PREFIX + attemptId]);
  first.close();

  // فتح لاحق والخادم ما زال معطّلاً: تبقى النتيجة معلّقة وتظهر الحالة
  const second = openExam({ storage, server: new FakeServer([], "network"), clock: new Clock(Date.UTC(2026, 10, 14, 6, 0, 0)) });
  await settle();
  assert.ok(resultShown(second), "the restored result is shown");
  assert.equal(sendText(second), SENDING);
  await second.clock.advance(7000);
  assert.equal(second.server.count, 3);
  assert.match(sendText(second), /^تعذّر إرسال نتيجتك/);
  assert.deepEqual(pendingKeys(second), [PENDING_PREFIX + attemptId]);
  second.close();

  // فتح لاحق والخادم يعمل: ترسَل تلقائياً دون أي نقرة
  const third = openExam({ storage, clock: new Clock(Date.UTC(2026, 10, 15, 6, 0, 0)) });
  await settle();
  assert.equal(third.server.count, 1);
  assert.deepEqual(third.server.requests[0].payload, sentBody, "same payload, same attemptId");
  assert.equal(sendText(third), SUCCESS);
  assert.ok(!resendVisible(third));
  assert.deepEqual(pendingKeys(third), []);
  assert.equal(third.json("S.sent"), true);
  await third.clock.advance(60000);
  assert.equal(third.server.count, 1);
  third.close();

  // فتح رابع: لا شيء يُرسَل ثانيةً
  const fourth = openExam({ storage });
  await fourth.clock.advance(60000);
  assert.equal(fourth.server.count, 0);
  assert.equal(sendText(fourth), SUCCESS);
  assert.ok(resultShown(fourth));
  fourth.close();
});

test("نتيجة معلّقة من محاولة سابقة تُرسَل بصمت عند الفتح حتى بعد بدء محاولة جديدة", async () => {
  const storage = new FakeStorage();
  const first = openExam({ storage, server: new FakeServer([], "network") });
  await submitExamInUi(first);
  await first.clock.advance(7000);
  const oldId = first.json("S.attemptId");
  first.click("#btn-retry"); // إعادة الاختبار: تعود شاشة الترحيب وتبقى النتيجة معلّقة
  assert.ok(first.visible("#scr-welcome"));
  assert.ok(!first.visible("#send-status"));
  assert.notEqual(first.json("S.attemptId"), oldId);
  assert.deepEqual(pendingKeys(first), [PENDING_PREFIX + oldId]);
  assert.equal(first.server.count, 3, "starting over does not resend");
  first.close();

  const later = openExam({ storage, seed: 11 });
  await settle();
  assert.ok(later.visible("#scr-welcome"));
  assert.equal(later.server.count, 1);
  assert.equal(later.server.requests[0].payload.attemptId, oldId);
  assert.deepEqual(pendingKeys(later), []);
  // ثم محاولة جديدة تُرسَل بمعرّف مختلف
  await submitExamInUi(later, { name: "سلمى أحمد العلي" });
  assert.equal(later.server.count, 2);
  assert.notEqual(later.server.requests[1].payload.attemptId, oldId);
  assert.equal(new Set(later.server.attemptIds()).size, 2);
  later.close();
});

test("عدة نتائج معلّقة تُرسَل كلها عند الفتح، ولا تُمسّ مفاتيح اختبارات أخرى أو مدخلات تالفة", async () => {
  const storage = new FakeStorage();
  const mk = (id) => JSON.stringify({ token: "old-token", attemptId: id, examId: EXAM_DIR_NAME, studentName: "x" });
  storage.setItem(PENDING_PREFIX + "att-a", mk("att-a"));
  storage.setItem(PENDING_PREFIX + "att-b", mk("att-b"));
  storage.setItem(PENDING_PREFIX + "att-broken", "{not json");
  storage.setItem("pending:grade5-math-unit1:other", mk("other"));
  const page = openExam({ storage, server: new FakeServer(["ok", "network", "network", "network"]) });
  await page.clock.advance(7000);
  assert.deepEqual(page.server.attemptIds(), ["att-a", "att-b", "att-b", "att-b"]);
  // الرمز يؤخذ من الصفحة الحالية
  assert.ok(page.server.requests.every((r) => r.payload.token === "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm"));
  assert.deepEqual(pendingKeys(page).sort(), [PENDING_PREFIX + "att-b", PENDING_PREFIX + "att-broken", "pending:grade5-math-unit1:other"].sort());
  assert.ok(page.visible("#scr-welcome"));
  page.close();
});

test("زر «إعادة إرسال النتيجة»: يرسل المحاولة نفسها ثم يختفي بعد النجاح", async () => {
  const page = openExam({ server: new FakeServer(["network", "network", "network", "ok"]) });
  await submitExamInUi(page);
  await page.clock.advance(7000);
  assert.ok(resendVisible(page));
  const before = page.json("S");
  page.click("#btn-resend");
  assert.equal(sendText(page), SENDING);
  assert.ok(!resendVisible(page));
  await settle();
  assert.equal(page.server.count, 4);
  assert.equal(page.server.requests[3].init.body, page.server.requests[0].init.body);
  assert.equal(sendText(page), SUCCESS);
  assert.ok(!resendVisible(page));
  assert.deepEqual(pendingKeys(page), []);
  // لم تُعَد المحاولة ولم تتغيّر النتيجة
  const after = page.json("S");
  assert.deepEqual({ ...after, sent: false }, before);
  assert.ok(resultShown(page));
  // نقرات إضافية (حتى لو استُدعيت الدالة مباشرة) لا ترسل شيئاً
  page.$("#btn-resend").click();
  page.run("resendResult(); startDelivery(); retryPending();");
  await page.clock.advance(60000);
  assert.equal(page.server.count, 4);
  page.close();
});

test("زر إعادة الإرسال مع فشل جديد: 3 محاولات أخرى ثم يعود الزر", async () => {
  const page = openExam({ server: new FakeServer([], "network") });
  await submitExamInUi(page);
  await page.clock.advance(7000);
  page.click("#btn-resend");
  await page.clock.advance(7000);
  assert.equal(page.server.count, 6);
  assert.ok(resendVisible(page));
  assert.equal(pendingKeys(page).length, 1);
  assert.equal(new Set(page.server.attemptIds()).size, 1);
  page.close();
});

test("لا إرسال متزامن أو مكرر لنفس attemptId", async () => {
  // (أ) نقرات متكررة على زر إعادة الإرسال أثناء إرسال جارٍ → إرسال واحد
  const page = openExam({ server: new FakeServer(["network", "network", "network", "hang", "ok"]) });
  await submitExamInUi(page);
  await page.clock.advance(7000);
  const btn = page.$("#btn-resend");
  btn.click(); btn.click(); btn.click();
  page.run("resendResult(); startDelivery(); startDelivery();");
  // وجولة النتائج المعلّقة أثناء الإرسال الجاري تنضم إليه ولا تبدأ إرسالاً ثانياً
  page.run("retryPending(); retryPending();");
  await settle();
  assert.equal(page.server.count, 4, "one in-flight send only");
  await page.clock.advance(32000);
  assert.equal(page.server.count, 5);
  assert.equal(sendText(page), SUCCESS);
  await page.clock.advance(120000);
  assert.equal(page.server.count, 5);
  page.close();

  // (ب) استدعاءان متزامنان لـ sendResult بالحمولة نفسها يتشاركان الوعد نفسه
  const p2 = openExam({ server: new FakeServer(["hang"]) });
  await takeExamInUi(p2);
  p2.click("#btn-submit");
  assert.equal(p2.run("(() => { const p = buildPayload(S); return sendResult(p) === sendResult(p); })()"), true);
  assert.equal(p2.server.count, 1);
  p2.close();

  // (ج) بعد تأكيد الاستلام: لا إرسال ثانٍ لا في الجلسة ولا بعد إعادة الفتح
  const storage = new FakeStorage();
  const p3 = openExam({ storage });
  await submitExamInUi(p3);
  assert.equal(p3.server.count, 1);
  p3.run("startDelivery(); resendResult(); retryPending(); sendResult(buildPayload(S));");
  p3.click("#btn-submit");
  p3.run("submitExam()");
  await p3.clock.advance(60000);
  assert.equal(p3.server.count, 1);
  p3.close();
  const p4 = openExam({ storage });
  await p4.clock.advance(60000);
  assert.equal(p4.server.count, 0);
  p4.close();
});

test("تسليم واحد = محاولة واحدة: الضغط المتكرر على «تسليم الاختبار» لا يكرر الإرسال", async () => {
  const page = openExam();
  await takeExamInUi(page);
  const btn = page.$("#btn-submit");
  btn.click(); btn.click(); btn.click();
  await page.clock.advance(60000);
  assert.equal(page.server.count, 1);
  assert.equal(page.downloads.length, 1);
  page.close();
});

test("إغلاق الصفحة أثناء الإرسال: تُحفظ النتيجة فوراً ثم تُرسَل عند الفتح التالي", async () => {
  const storage = new FakeStorage();
  const page = openExam({ storage, server: new FakeServer(["hang"]) });
  await takeExamInUi(page);
  page.click("#btn-submit");
  await settle();
  const attemptId = page.json("S.attemptId");
  assert.deepEqual(pendingKeys(page), [], "nothing pending while the first try is in flight");
  page.window.dispatchEvent(new page.window.Event("pagehide"));
  assert.deepEqual(pendingKeys(page), [PENDING_PREFIX + attemptId]);
  page.close();

  // الخادم كان قد استلمها فعلاً → يردّ duplicate → تُعدّ مرسلة
  const next = openExam({ storage, server: new FakeServer(["duplicate"]) });
  await settle();
  assert.equal(next.server.count, 1);
  assert.equal(next.server.requests[0].payload.attemptId, attemptId);
  assert.equal(sendText(next), SUCCESS);
  assert.deepEqual(pendingKeys(next), []);
  next.close();
});

test("بدء محاولة جديدة أثناء إرسال جارٍ: الإرسال يكتمل في الخلفية ولا يمسّ واجهة المحاولة الجديدة", async () => {
  const page = openExam({ server: new FakeServer(["hang", "network", "network"]) });
  await submitExamInUi(page);
  const oldId = page.json("S.attemptId");
  page.click("#btn-retry");
  await page.clock.advance(100000);
  assert.equal(page.server.count, 3);
  assert.ok(page.visible("#scr-welcome"));
  assert.ok(!page.visible("#send-status"));
  assert.equal(page.json("S.sent"), false);
  assert.deepEqual(pendingKeys(page), [PENDING_PREFIX + oldId]);
  page.close();
});

test("التخزين المحلي غير متاح: النتيجة تظهر، والرسالة لا تدّعي الحفظ، وزر إعادة الإرسال يعمل", async () => {
  const storage = new FakeStorage();
  storage.failWrites = true;
  const page = openExam({ storage, server: new FakeServer(["network", "network", "network", "ok"]) });
  await submitExamInUi(page);
  await page.clock.advance(7000);
  assert.ok(resultShown(page));
  assert.match(sendText(page), /^تعذّر إرسال نتيجتك إلى معلّمك\./);
  assert.doesNotMatch(sendText(page), /محفوظة/);
  assert.ok(resendVisible(page));
  page.click("#btn-resend");
  await settle();
  assert.equal(page.server.count, 4);
  assert.equal(sendText(page), SUCCESS);
  assert.deepEqual(page.pageErrors, []);
  page.close();
});

test("لا يُكتب شيء من بيانات الطالبة في console، ولا طلبات قبل التسليم", async () => {
  const page = openExam({ server: new FakeServer([], "network") });
  await takeExamInUi(page, { name: "ليلى خالد" });
  assert.equal(page.server.count, 0, "nothing is sent before submission");
  page.click("#btn-submit");
  await page.clock.advance(7000);
  assert.equal(page.server.count, 3);
  assert.equal(page.consoleLines.length, 1); // سطر الفحص الذاتي الأصلي [QA] فقط
  assert.match(page.consoleLines[0].text, /^\[QA\]/);
  assert.ok(!page.consoleLines.some((l) => l.text.includes("ليلى")));
  page.close();
});

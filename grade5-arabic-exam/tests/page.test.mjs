/**
 * الصفحة نفسها: الخصوصية، الواجهة، الاستقلال عن أي مجلد آخر، والبناء القابل للنشر.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { EXAM_DIR, EXAM_DIR_NAME, SOURCE_HTML, ORIGINAL_HTML, DIST_HTML, openExam, submitExamInUi } from "./harness.mjs";

const html = readFileSync(SOURCE_HTML, "utf8");
const originalHtml = readFileSync(ORIGINAL_HTML, "utf8");

test("المجلد و EXAM_ID والعنوان", () => {
  assert.equal(EXAM_DIR_NAME, "grade5-arabic-exam");
  assert.equal(html.match(/const EXAM_ID = "([^"]*)"/)[1], EXAM_DIR_NAME);
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/)[1], "اختبار اللغة العربية التفاعلي — الصف الخامس — الدرس الثاني: بالرأي والرأي الآخر");
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/)[1], originalHtml.match(/<title>([\s\S]*?)<\/title>/)[1]);
});

test("الخصوصية: لا ادعاء بعدم الإرسال، والطالبة تُبلَّغ بوضوح قبل البدء", () => {
  for (const claim of ["لا تُرسَل", "لم تُرسَل", "لا ترسل", "يعمل محلياً بالكامل", "دون خادم", "خارج جهازك", "مشفّر", "سرّي"]) {
    assert.ok(!html.includes(claim), "page still claims: " + claim);
  }
  // النسخة الأصلية كانت تدّعي ذلك (فالفحص أعلاه ذو معنى)
  assert.ok(originalHtml.includes("لا تُرسَل أي بيانات خارج جهازك"));
  assert.ok(originalHtml.includes("ولم تُرسَل أي بيانات عبر الشبكة"));
  const page = openExam();
  assert.ok(page.visible("#scr-welcome"));
  assert.equal(page.text("#scr-welcome #send-note"), "عند تسليم الاختبار تُرسَل نتيجتك وإجاباتك إلى معلّمك.");
  assert.match(page.text("footer.site-foot"), /عند التسليم تُرسَل نتيجتك وإجاباتك إلى معلّمك/);
  page.close();
});

test("تقرير TXT يذكر الإرسال بصدق", async () => {
  const page = openExam();
  await submitExamInUi(page);
  const report = await page.downloadText();
  assert.ok(report.includes("وتُرسَل النتيجة والإجابات أيضاً إلكترونياً إلى المعلّم عند التسليم."));
  assert.ok(!report.includes("لم تُرسَل"));
  page.close();
});

test("الفروق عن الأصل محصورة: التصميم والمحتوى كما هما", () => {
  const strip = (s) => s.split("\n");
  const a = strip(originalHtml), b = new Set(strip(html));
  const removed = a.filter((line) => !b.has(line));
  // الأسطر الأصلية التي تغيّرت أو حُذفت: نصوص الخصوصية الثلاثة + سطر الحالة + قوس نهاية init
  assert.equal(removed.length, 4, removed.join("\n"));
  assert.ok(removed.some((l) => l.includes("لا تُرسَل أي بيانات خارج جهازك")));
  assert.ok(removed.some((l) => l.includes("ولم تُرسَل أي بيانات عبر الشبكة")));
  assert.ok(removed.some((l) => l.includes("هذا ملف مستقل يعمل دون خادم")));
  assert.ok(removed.some((l) => l.includes("autoDl: false")));
  // قواعد CSS الأصلية كلها باقية
  const css = (s) => s.slice(s.indexOf("<style>"), s.indexOf("</style>")).split("\n");
  const newCss = new Set(css(html));
  assert.deepEqual(css(originalHtml).filter((l) => !newCss.has(l)), []);
});

test("شاشة النتيجة: عنصر حالة الإرسال وزر «إعادة إرسال النتيجة» مستقل ومخفي افتراضياً", () => {
  const page = openExam();
  const box = page.$("#send-status");
  assert.equal(box.getAttribute("role"), "status");
  assert.equal(box.getAttribute("aria-live"), "polite");
  assert.ok(page.$("#scr-results").contains(box));
  assert.equal(box.hidden, true);
  assert.equal(page.$("#btn-resend").hidden, true);
  assert.equal(page.text("#btn-resend"), "إعادة إرسال النتيجة");
  assert.equal(page.document.querySelectorAll("#btn-resend").length, 1);
  assert.equal(page.document.querySelectorAll("[id]").length, new Set([...page.document.querySelectorAll("[id]")].map((e) => e.id)).size, "ids are unique");
  page.close();
});

test("مفتاح المعلمة ما زال يعمل بكلمة المرور الأصلية", () => {
  const page = openExam();
  page.click("#link-teacher");
  assert.ok(page.visible("#scr-teacher"));
  page.$("#in-pass").value = "wrong";
  page.click("#btn-pass");
  assert.equal(page.$("#teacher-key").hidden, true);
  page.$("#in-pass").value = "somer173";
  page.click("#btn-pass");
  assert.equal(page.$("#teacher-key").hidden, false);
  assert.equal(page.document.querySelectorAll("#key-list .key-q").length, 20);
  assert.equal(page.document.querySelectorAll("#key-list .key-part").length, 46);
  assert.equal(page.server.count, 0);
  page.close();
});

test("استعادة التقدّم بعد إعادة الفتح أثناء الاختبار (كما في الأصل)", async () => {
  const { FakeStorage, correctAnswer, answerPartInUi } = await import("./harness.mjs");
  const storage = new FakeStorage();
  const page = openExam({ storage });
  page.$("#in-name").value = "سلمى أحمد";
  page.click("#btn-start");
  const q = page.questions[page.json("S.order")[0]];
  q.parts.forEach((p, pi) => answerPartInUi(page, pi, p, correctAnswer(p)));
  await page.clock.advance(1000);
  const saved = page.json("S");
  page.close();
  const again = openExam({ storage });
  assert.ok(again.visible("#scr-exam"));
  assert.deepEqual(again.json("S"), saved);
  assert.equal(again.server.count, 0);
  again.close();
});

test("الصفحة مكتفية بذاتها: لا ملفات محلية ولا سكربتات خارجية ولا اعتماد على مجلد اختبار آخر", () => {
  const refs = [...html.matchAll(/<[a-z][^<>]*?\s(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.match(ref, /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|wa\.me)(\/|$)/, ref);
  assert.deepEqual(refs.filter((r) => !originalHtml.includes(r)), [], "no new external references");
  assert.ok(!/<script[^>]*\ssrc=/i.test(html));
  assert.ok(!/\.\.\//.test(html));
  for (const other of ["grade5-math-unit1", "grade4-", "grade6-", "grade8-"]) assert.ok(!html.includes(other) || other === "grade5-math-unit1" && !/["'/]grade5-math-unit1/.test(html.replace(/\/\*[\s\S]*?\*\//g, "")), other);
  // الطلب الشبكي الوحيد في السكربت هو الإرسال إلى SHEETS_URL
  assert.equal((html.match(/\bfetch\(/g) || []).length, 1);
  assert.match(html, /window\.fetch\(SHEETS_URL, init\)/);
  assert.ok(!/XMLHttpRequest|sendBeacon|WebSocket/.test(html));
});

test("ملفات المجلد: لا بقايا من قالب Vite/React غير المستعمل", () => {
  const files = readdirSync(EXAM_DIR).filter((f) => !["node_modules", "dist"].includes(f)).sort();
  assert.deepEqual(files, ["build.mjs", "index.html", "package-lock.json", "package.json", "tests"]);
  const pkg = JSON.parse(readFileSync(path.join(EXAM_DIR, "package.json"), "utf8"));
  assert.equal(pkg.name, EXAM_DIR_NAME);
  assert.equal(pkg.scripts.build, "node build.mjs");
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(Object.keys(pkg.devDependencies), ["jsdom"]);
});

test("npm run build ينتج dist/index.html مطابقاً للمصدر بايتاً ببايت، والصفحة المبنية تعمل", async () => {
  const out = execFileSync(process.execPath, ["build.mjs"], { cwd: EXAM_DIR, encoding: "utf8" });
  assert.match(out, /Built dist\/index\.html from index\.html/);
  assert.match(out, /EXAM_ID: grade5-arabic-exam/);
  assert.ok(readFileSync(DIST_HTML).equals(readFileSync(SOURCE_HTML)));
  assert.deepEqual(readdirSync(path.dirname(DIST_HTML)), ["index.html"]);
  const page = openExam({ file: DIST_HTML });
  await submitExamInUi(page);
  assert.equal(page.text("#res-score"), "١٠٠");
  assert.equal(page.text("#send-status-text"), "تم إرسال نتيجتك إلى معلّمك ✓");
  assert.equal(page.server.requests[0].payload.examId, "grade5-arabic-exam");
  assert.deepEqual(page.pageErrors, []);
  page.close();
});

/**
 * الناتج المنشور: dist/index.html ملف واحد مستقل تماماً.
 *
 * نظام النشر (.github/workflows/deploy.yml) ينسخ dist/index.html وحده إلى _site/<folder>/index.html،
 * فيجب ألّا تحتاج الصفحة المنشورة إلى أي ملف آخر من هذا الاختبار أو من اختبار غيره.
 * يتخطّى هذا الملف نفسه إن لم يُبنَ المشروع بعد (npm run build).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { EXAM_DIR, check, equal, finish, section } from "./harness";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";

const dist = path.join(EXAM_DIR, "dist", "index.html");

if (!existsSync(dist)) {
  console.log("\n(تخطّي: dist/index.html غير موجود — شغّل npm run build أولاً)");
  finish("build");
} else {
  const html = readFileSync(dist, "utf8");

  section("== 1) ملف واحد بلا اعتماد على أي ملف آخر ==");
  // نصوص داخل سكربتات React تُبنى بعلامات اقتباس مفردة أيضاً، فلا تُعدّ وسوم HTML
  const external = [...html.matchAll(/<(?:script|link|img)[^>]*?(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith("data:") && !url.startsWith("#"));
  equal("لا سكربت أو ورقة أنماط خارجية", external, []);
  check("لا رابط إلى ملف من اختبار آخر", !/grade5-math-unit1|grade8-|grade6-|grade4-|grade5-/.test(html));
  check("لا وحدة ES خارجية مضمّنة (import من مسار)", !/<script[^>]+src=/.test(html));
  equal("العنوان هو عنوان الاختبار نفسه (يستعمله فهرس الموقع)", /<title>([^<]*)<\/title>/.exec(html)?.[1], EXAM_TITLE);
  check("الاتجاه عربي RTL", html.includes('lang="ar"') && html.includes('dir="rtl"'));

  section("== 2) الإرسال مضمّن في الصفحة نفسها ==");
  check("SHEETS_URL مضمّن", html.includes(SHEETS_URL));
  check("SHEETS_TOKEN مضمّن", html.includes(SHEETS_TOKEN) && !html.includes("SHEETS_TOKEN"));
  check("examId = grade7-physics-exam", html.includes(`"${EXAM_ID}"`));
  // البادئة تُبنى وقت التشغيل: `pending:${EXAM_ID}:` — فوجودها في الناتج يعني أن examId مضمّن
  check("بادئة الحفظ المعلّق مبنية من examId نفسه", html.includes("`pending:${") && html.includes(`"${EXAM_ID}"`));
  check("النوع text/plain;charset=utf-8 مضمّن", html.includes("text/plain;charset=utf-8"));
  check("رسائل حالة الإرسال الثلاث مضمّنة", ["جارٍ إرسال النتيجة إلى معلّمك…", "تم إرسال نتيجتك إلى معلّمك ✓", "إعادة إرسال النتيجة"].every((text) => html.includes(text)));

  section("== 3) لا أسرار ولا نصوص خاطئة في الناتج ==");
  check("لا سطر ينفي الإرسال", !html.includes("لم يُرسل إلى أي جهة خارجية"));
  check("لا ادعاء عن التشفير إلا نفي البوابة الشكلية كما في الأصل", (html.match(/تشفير/g) ?? []).length === 1 && html.includes("وليست مصادقة حقيقية أو تشفيراً"));
  check("لا مرجع إلى exam-data.js أو report.js كملفات خارجية", !/["'](\.\/)?(src\/)?(exam-data|report)\.js["']/.test(html));

  section("== 4) محتوى الاختبار كامل في الناتج ==");
  // عدّاد الأسئلة يُبنى وقت التشغيل من طول البنك: `السؤال ${index + 1} من ${QUESTIONS.length}`
  // عدّاد بطاقة السؤال يُبنى وقت التشغيل من طول البنك: children:["السؤال ",h+1," من ",kl.length]
  check("عدّاد الأسئلة يُبنى وقت التشغيل من طول البنك", /"السؤال ",.+?\+1," من ",.+?\.length/.test(html));
  check("قواعد التصحيح وبيانات المعلم مضمّنة", html.includes("نصف العلامة للحكم الصحيح") && html.includes("الكلمات المفتاحية"));
  check("عناوين الأسئلة الاثنا عشر مضمّنة", ["اختيار من متعدد — مفاهيم وتعريفات وتحويل الوحدات", "مسألة تحليلية — الذهاب والعودة (الطفل والدراجة)"].every((title) => html.includes(title)));
  check("السرعة الوسطية 30 m·s⁻¹ موجودة", html.includes("30 m"));
  check("مرجع الكتاب ص13 موجود", html.includes("ص13"));

  finish("build");
}

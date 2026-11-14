# English Grammar Mira — الصف الثالث / اللغة الإنجليزية

اختبار **English Grammar Mira** منشور من هذا المجلد كصفحة HTML واحدة مكتفية بذاتها،
تمامًا كبقية اختبارات المستودع: يُنسخ `index.html` بايتًا ببايت إلى `dist/index.html`،
وينشره `deploy.yml` على `./grade3-english-grammar-mira/`، ويصنّفه مولّد الصفحة
الرئيسية تلقائيًا تحت **الصف الثالث ← اللغة الإنجليزية** (اسم المجلد يعطي الصف،
والعنوان يعطي المادة).

## المحتوى

| البند | القيمة |
| --- | --- |
| `EXAM_ID` | `grade3-english-grammar-mira` |
| `EXAM_TITLE` و`<title>` | `English Grammar Mira` |
| الأسئلة | 25 سؤالًا (20 اختيار من متعدد، 1 ترتيب كلمات، 1 وسم فاعل/فعل/مفعول، 3 مطابقة/اختيار مزدوج) |
| الفروع المصحّحة | 30 فرعًا |
| العلامات | 100 علامة (4 لكل سؤال) |
| الدروس | 1 – 5 و16 |
| ملف التقرير | `Mira_English_Grammar_Report.txt` |

التصحيح هو تصحيح النسخة الأصلية نفسه، حرفًا بحرف: `evaluateStudent()` و`isQuestionAnswered()`
و`getAnsweredCount()` و`formatDuration()` لم تتغيّر، و`tests/fixtures/baseline.json` يسجّل
الأسئلة ومفتاح الإجابات وعلامات 266 إجابة ممكنة و101 ورقة إجابة من النسخة المرفوعة.

## البنية

```
index.html                  الصفحة المنشورة (النسخة الأصلية + التعديلات الموثّقة)
build.mjs                   التحقق من EXAM_ID والعنوان وعدم وجود ملفات محلية، ثم النسخ إلى dist
tests/
  fixtures/original-exam.html   النسخة المرفوعة، بايتًا ببايت (sha256 موثّق في harness.mjs)
  fixtures/baseline.json        الخط المرجعي: البنية والمفتاح والعلامات والتقارير
  harness.mjs                   jsdom + ساعة افتراضية + localStorage وهمي + خادم وهمي
  make-baseline.mjs             إعادة توليد baseline.json من النسخة الأصلية
  differences.mjs               كل فرق موثّق عن النسخة الأصلية، وسببه
  grading.test.mjs              مقارنة التصحيح بالنسخة الأصلية والـbaseline
  page.test.mjs                 الصفحة، الخصوصية، سير العمل، الإصلاحات المرئية
  payload.test.mjs              عقد الحمولة المرسلة إلى Google Sheets
  submit.test.mjs               الإرسال والفشل وإعادة المحاولة والحفظ والاستعادة ومنع التكرار
  build.test.mjs                البناء والناتج والظهور في الصفحة الرئيسية
```

## أوامر

```bash
npm ci
npm test          # 44 اختبارًا (jsdom؛ لا اتصال شبكي حقيقي)
npm run build     # ينتج dist/index.html
npm run baseline  # يعيد توليد tests/fixtures/baseline.json من النسخة الأصلية
```

## إرسال النتيجة

يستخدم الاختبار عقد الإرسال نفسه المعتمد في بقية الاختبارات (المرجع:
`grade5-math-unit1/src/exam/submit.ts`): `token` و`attemptId` و`examId` و`examTitle`
و`studentName` و`startAt` و`submitAt` و`elapsedSec` و`summary` و`lessons` و`details`
و`reportText`. ثلاث محاولات بفواصل 2 ثم 5 ثوانٍ، ومهلة 30 ثانية للمحاولة، وحفظ الحمولة
الفاشلة في `localStorage` تحت `pending:grade3-english-grammar-mira:<attemptId>`،
وإعادة إرسالها عند فتح الاختبار، وزر مستقل «Resend Result · إعادة إرسال النتيجة».
لا تُرسل كلمة مرور المعلّم ولا شاشة مفتاح الإجابات ولا أي تصنيف داخلي.

## موارد الشبكة

كما في النسخة الأصلية، تُحمَّل خطوط Google Fonts و`@tailwindcss/browser@4` من الشبكة
وقت التشغيل. لا يضيف هذا الاختبار أي مورد خارجي آخر؛ عنوان Apps Script هو وجهة
الإرسال فقط ولا يُحمَّل منه أي ملف.

## التعديلات على النسخة الأصلية

كل فرق موثّق في `tests/differences.mjs` مع سببه، ويُثبت `tests/page.test.mjs` أن عكس
هذه التعديلات يعيد ملف النسخة الأصلية بايتًا ببايت. باختصار: عنوان الصفحة، وسم
`EXAM_ID`/`EXAM_TITLE`، نظام إرسال النتيجة، إشعار خصوصية صادق، شارة مستوى الأداء،
وإصلاحات مرئية/استخدامية مدعومة بدليل (السطر في حوار السؤال 3، تسطير الكلمات في
السؤال 2، مفتاح Enter لبدء الاختبار، وعرض الزمن بعد إعادة التحميل).

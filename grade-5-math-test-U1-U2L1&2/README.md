# اختبار الرياضيات – الصف الخامس

اختبار تفاعلي كامل (7 أسئلة رئيسية، 100 درجة) مبني على محتوى منصة
[Interactive-Mathematics-Grade5](https://github.com/teteerhys1984-star/Interactive-Mathematics-Grade5):

- الوحدة الأولى كاملة (الدروس 1–8، ص 3–39): شبكة الإحداثيات، التمثيلات البيانية بالخطوط، الأعداد الطبيعية، التقريب، الجمع والطرح، قياس الزوايا، متوازي الأضلاع، المعيّن.
- الوحدة الثانية – الدرسان الأول والثاني فقط (ص 44–50): مقارنة الأعداد الطبيعية وترتيبها، ضرب الأعداد الطبيعية (الحمل، الضرب في 10/100/1000، الخواص التبديلية والتجميعية والتوزيع).

## التشغيل

```bash
npm ci          # أو npm install
npm run dev     # تشغيل محلي
npm run typecheck
npm test        # اختبارات Vitest (التصحيح، الإحداثيات، المقارنة، الحساب، الأهلية، المؤقّت، التخزين)
npm run build   # بناء الإنتاج في dist/ (ملف HTML واحد)
```

## البنية

```
src/
  exam/            # البيانات والمنطق: questions.ts, grading.ts, numbers.ts, timer.ts, storage.ts, report.ts, sounds.ts
  components/      # الواجهة: StartScreen, ExamScreen, SubQuestionView, CoordinateGrid, LineGraph, Geometry, MathPad, ResultsScreen, TeacherArea, Footer
  assets/fonts/    # IBM Plex Sans Arabic (woff2) مضمّن محلياً
  assets/sounds/   # صوتا البدء والتسليم (WAV أصليان مولَّدان عبر scripts/generate-sounds.mjs)
  __tests__/       # الاختبارات الآلية
```

## ملاحظات

- الزوج المرتّب `(x, y)`: العدد الأول أفقي والثاني رأسي؛ الأزواج المعكوسة لا تُمنح درجات (مغطّى بالاختبارات).
- المقارنة والترتيب يتمّان على القيم العددية لا النصوص.
- الإجابات تُحفظ في `localStorage` وتُستعاد بعد التحديث؛ المؤقّت تصاعدي يعتمد على الطوابع الزمنية.
- منطقة المعلم محمية بكلمة مرور من جهة المتصفح فقط (`somer173`) وليست مصادقة حقيقية.
- جميع الرموز الرياضية تُعرض عبر KaTeX في سياق LTR معزول داخل الواجهة العربية.

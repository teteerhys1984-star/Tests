# التحقق — Chemistry U1 L3 Test (`grade-8-chemistry-u1-l3-test`)

## 1. سلامة المجلد المصدري (`grade-8-chemistry-test-U1L3`)

- ظلّ مجلد المصدر `grade-8-chemistry-test-U1L3` سليمًا دون أي تعديل (`git diff -- grade-8-chemistry-test-U1L3` فارغ، وبصمات SHA-256 لجميع ملفاته الـ 41 مطابقة تمامًا لأصل الفرع `ae523e1`).
- أُضيف `"grade-8-chemistry-test-U1L3"` إلى قائمة الاستثناء في كلٍّ من `.github/workflows/deploy.yml` و`landing/scripts/build-exams.sh` و`landing/tests/test_build_exams.py` حتى لا يُبنى أو يُنشر كمجلد اختبار.

## 2. الإصلاحات والتعديلات المطبّقة على النسخة المنشورة

1. **إصلاح تقسيم الأسس في `Chem.tsx`:** توسيع `formulaPattern` ليشمل الأرقام الفوقية `¹²³` إلى جانب `⁰-⁹` و`[₀-₉]*` بعد القوس المغلق، ما يمنع تقسيم أيونات مثل `Ca²⁺` و`Al³⁺` و`SO₄²⁻` و`PO₄³⁻` بين KaTeX ونص عادي.
2. **تغطية الأرقام الفوقية في `chemistry.ts`:** تحديث `normalizeNotation` لاستبدال `[⁰¹²³⁴-⁹]` وإضافة `plainChemText` لتحويل صيغ `{{...}}` إلى Unicode نظيف في التقارير والتفاصيل المرسلة.
3. **شاشة مراجعة قبل التسليم:** إتاحة زر «تسليم الاختبار» دائمًا ليفتح شاشة مراجعة تعرض حالة كل جزء وتنبيهًا عند وجود أجزاء ناقصة وزر انتقال مباشر، مع السماح بتأكيد التسليم غير المكتمل (تُحتسب الأجزاء المتروكة صفرًا وتظهر بعبارة «لم تُحدّد إجابة»).
4. **عقد الإرسال إلى Google Sheets (`submit.ts`):** مطابقة عقد `grade5-math-unit1` (12 حقلًا أعلى، 11 حقل `summary`، 7 صفوف `lessons`، 31 صف `details`، مع `pending:<EXAM_ID>:<attemptId>` و`sent:<EXAM_ID>:<attemptId>` وزر إعادة إرسال يدوي)، دون حجب النتائج أو تنزيل التقرير عند فشل الاتصال.
5. **تصحيح إملائي في `exam.ts` وتحسين تموضع `.scene-formula` على الجوال (`<= 700px`)** وإزالة الفاصل الشارد ` — ` في صيغ الحقول والمطابقة.

## 3. نتائج الاختبارات المنفّذة

- `npm run typecheck` (`tsc --noEmit`): ناجح (0 أخطاء).
- `npm test` (`vitest run`): **79/79** اختبار ناجح عبر 5 ملفات (`App.test.tsx`, `chemistry.test.ts`, `grading.test.ts`, `session.test.ts`, `submit.test.ts`) باستخدام `fetch` وهمي (mock) ودون أي اتصال حقيقي بنقطة Google Sheets.
- `npm run build` (`vite build`): ناجح، ينتج حزمة أحادية مستقلة `dist/index.html` (`~2.62 MB`) خالية من أي موارد أو خطوط خارجية.
- `bash landing/scripts/build-exams.sh && python3 landing/generate.py _site`: ناجح، بُنيت الاختبارات المنشورة الـ 47 بما فيها `grade-8-chemistry-u1-l3-test` واستُبعد `grade-8-chemistry-test-U1L3`.
- `python3 landing/tests/test_build_exams.py`: **6/6** ناجحة (تتضمن تحقق الموقع المبني `_site`).
- `python3 landing/tests/test_generate.py`: **46/46** ناجحة (تتضمن بطاقة الصف الثامن · الفصل الأول · الكيمياء بعنوان `Chemistry U1 L3 Test` وتاريخ `27-11-2026`).
- `python3 landing/scripts/verify-site.py _site`: **605/606** ناجحة، وجميع الفحوص الـ 8 الخاصة بـ `grade-8-chemistry-u1-l3-test` ناجحة؛ الفشل الوحيد السابق في المستودع يعود إلى مجلد أقدم غير معدّل (`grade-4-english-curriculum1n5-exam-23-11-2026`).

## 4. قيود التحقق في هذه البيئة

- تعذّر تشغيل `node scripts/browser-check.mjs` داخل حاوية العمل لعدم توفّر ثنائي Chromium محليًا ولأن مضيف تنزيل متصفحات Playwright خارج قائمة النطاقات المسموح بها في الشبكة، لذا جرى التحقق التفاعلي لـ DOM والسير الكامل في `jsdom` عبر Vitest + فحص الحزمة المبنية النهائية.

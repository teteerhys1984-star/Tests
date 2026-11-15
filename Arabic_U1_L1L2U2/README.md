# زهرة المعرفة – اختبار اللغة العربية للصف الخامس الأساسي (قواعد اللغة والإملاء)

A complete React + TypeScript + Vite examination app (RTL, Arabic UI, floral theme) for Grade 5 Arabic **grammar and spelling only**. It covers five lessons. The source is the repository
[teteerhys1984-star/Interactive-arabic-grade5](https://github.com/teteerhys1984-star/Interactive-arabic-grade5) (`docs/source-locks/*`).

## Install and run

```bash
npm install        # or: npm ci
npm run dev        # development server
npm run typecheck  # TypeScript check
npm test           # Vitest unit tests (structure, scoring, report)
npm run build      # production build -> dist/index.html (single self-contained file)
npm run preview
```

## Coverage

| Lesson | Grammar (page) | Spelling (page) | Questions |
|---|---|---|---|
| U1L1 السمكة الذهبية | الجملة وأنواعها (٨) | الهمزة الأولية: قطع/وصل (٩) | 6 |
| U1L2 بالرأي والرأي الآخر | المصدر (١٧–١٨) | همزة القطع (١٨–٢٠) | 6 |
| U1L3 لغتي | أركان الجملة الفعلية (٢٨–٢٩) | همزة الوصل (٣٠–٣٢) | 6 |
| U2L1 مخترع من بلادي | الجملة الاسمية: المبتدأ والخبر (٤٤–٤٦) | الهمزة الأولية – تطبيق (٤٦) | 6 |
| U2L2 الذكاء الاصطناعي | تحويل الفعلية إلى اسمية (٥٤) | التاء المبسوطة والمربوطة (٥٥–٥٦) | 6 |

- 30 main questions (3 grammar and 3 spelling per lesson) with 67 subparts, worth **100 marks** in total. Tests enforce all of these numbers.
- Difficulty: 9 basic, 14 intermediate, 7 advanced (30% / 45% / 25%).
- The questions are mixed, so no two consecutive questions come from the same lesson.
- No question uses an item that the source marks as uncertain or unprinted. For example, the teacher-dictated passage on p.46 is not printed in the source, so it is not used.

## Structure

```
src/
  components/{exam,results,teacher,common}/
  data/questions/   # one file per lesson + ordered index
  data/answers/     # answer-key / rubric text helpers
  data/sources/     # lesson + page registry (source references)
  hooks/            # useExamSession (localStorage), useStopwatch
  utils/            # scoring, report (TXT), sound (Web Audio), storage, time
  styles/theme.css
  test/exam.test.ts
```

## Behaviour

- The student must enter her full name. The timer starts only when she presses the start button.
- The timer is a count-up stopwatch (`HH:MM:SS`) based on a stored start timestamp, so it keeps running correctly after a refresh.
- The name, attempt ID, start time, answers, current question and status are all saved in localStorage. Refreshing restores the same attempt.
- During the exam there is no feedback, score, hint or answer key. The teacher area cannot be opened while an exam is in progress.
- The **تسليم الاختبار** button stays disabled until every subpart is answered. Pressing it submits immediately with no confirmation, then shows the results page.
- A UTF-8 TXT report (with BOM) downloads automatically after submission. The **تحميل التقرير TXT** button downloads it again.
- **إعادة الاختبار** appears only after submission. It clears the old attempt and asks for the name again.
- The teacher area is protected by the password `somer173`. **This is only a client-side barrier, not real authentication or encryption.** The answer data is included in the JS bundle.
- The start and submit sounds are made in the browser with the Web Audio API. There is a sound on/off button.
- No backend is used and no student data is sent anywhere. The only external request is for Google Fonts, with system Arabic fonts as a fallback.

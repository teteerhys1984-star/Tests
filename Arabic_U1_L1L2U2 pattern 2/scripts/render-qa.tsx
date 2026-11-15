import React from 'react';
import { renderToString } from 'react-dom/server';
import { QUESTIONS } from '../src/data/questions';
import type { Attempt } from '../src/types/exam';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  get length() { return this.store.size; }
}

const storage = new MemoryStorage();
(globalThis as any).window = {
  localStorage: storage,
  scrollTo: () => undefined,
  setInterval: () => 0,
  clearInterval: () => undefined,
  setTimeout: (fn: () => void) => { void fn; return 0; },
};

let failures = 0;
function check(name: string, condition: boolean) {
  if (condition) console.log('PASS:', name);
  else { failures++; console.error('FAIL:', name); }
}

async function main() {
  const { default: App } = await import('../src/App');
  const { TeacherKey } = await import('../src/components/teacher/TeacherKey');
  const { TeacherGate } = await import('../src/components/teacher/TeacherGate');
  const { ResultsScreen } = await import('../src/components/results/ResultsScreen');
  const { gradeAttempt } = await import('../src/utils/grading');

  const startHtml = renderToString(<App />);
  check('start screen renders title', startHtml.includes('اختبار اللغة العربية – الصف الخامس الأساسي'));
  check('start screen requires name', startHtml.includes('الاسم الكامل للطالبة'));
  check('start screen has start button', startHtml.includes('ابدئي الاختبار'));
  check('start screen has teacher gate link', startHtml.includes('دليل المعلم'));
  check('start screen exposes no answer key', !startHtml.includes('الإجابة الصحيحة'));

  const attempt: Attempt = {
    version: 1, id: 'render-attempt', studentName: 'سارة أحمد المحمد',
    startedAt: Date.now() - 600000, submittedAt: Date.now(),
    answers: Object.fromEntries(QUESTIONS.flatMap(q => q.subparts.map(s => [s.id, s.correct]))),
    current: 0,
  };
  storage.setItem('zahrat-almarifa:grade5-arabic-attempt:v1', JSON.stringify(attempt));
  const resultsHtml = renderToString(<App />);
  check('results screen renders after refresh', resultsHtml.includes('المراجعة التفصيلية'));
  check('results screen shows student name', resultsHtml.includes('سارة أحمد المحمد'));
  check('results screen shows 100 score', resultsHtml.includes('١٠٠'));
  check('results screen shows TXT button', resultsHtml.includes('تحميل التقرير TXT'));
  check('results screen shows restart button', resultsHtml.includes('إعادة الاختبار'));
  check('results screen shows lesson breakdown', resultsHtml.includes('التحليل حسب الدروس'));
  check('results screen shows source reference text', resultsHtml.includes('مرجع داخلي'));

  const graded = gradeAttempt(attempt);
  const resultsDirect = renderToString(
    <ResultsScreen result={graded} soundEnabled onToggleSound={() => undefined} onRestart={() => undefined} onOpenTeacher={() => undefined} />
  );
  check('results direct render works', resultsDirect.includes('ممتاز'));

  const examAttempt: Attempt = { ...attempt, submittedAt: null, answers: {}, current: 0 };
  storage.setItem('zahrat-almarifa:grade5-arabic-attempt:v1', JSON.stringify(examAttempt));
  const examHtml = renderToString(<App />);
  check('active attempt restores the exam screen instead of starting a new attempt', !examHtml.includes('ابدئي الاختبار') && examHtml.includes('الوقت المنقضي'));

  // Render the exam component directly with an active attempt
  const { ExamScreen } = await import('../src/components/exam/ExamScreen');
  const examDirect = renderToString(
    <ExamScreen attempt={examAttempt} soundEnabled onToggleSound={() => undefined}
      onAnswer={() => undefined} onNavigate={() => undefined} onSubmit={() => undefined} />
  );
  check('exam shows HH:MM:SS stopwatch format', /\d{2}:\d{2}:\d{2}/.test(examDirect));
  check('exam has submit button (disabled state rendered)', examDirect.includes('تسليم الاختبار'));
  check('exam does not reveal correct answer label', !examDirect.includes('الإجابة الصحيحة'));
  check('exam does not reveal explanation text', !examDirect.includes(QUESTIONS[0].subparts[0].explanation.slice(0, 25)));
  check('exam does not reveal source references', !examDirect.includes('مرجع داخلي'));
  check('exam does not reveal lesson title', !examDirect.includes('السمكة الذهبية'));

  const teacherHtml = renderToString(<TeacherKey onClose={() => undefined} onLock={() => undefined} />);
  check('teacher key renders answers', teacherHtml.includes('الإجابة الصحيحة'));
  check('teacher key renders rubric', teacherHtml.includes('روبرِك التصحيح'));
  check('teacher key renders misconceptions', teacherHtml.includes('خطأ شائع'));
  check('teacher key renders source integrity', teacherHtml.includes('نزاهة المصدر والحدود'));
  check('teacher key includes all 30 questions in body', QUESTIONS.every(q => teacherHtml.includes(q.prompt)));

  const gateHtml = renderToString(
    <TeacherGate onUnlock={() => undefined} onClose={() => undefined} soundEnabled onToggleSound={() => undefined} />
  );
  check('teacher gate renders password barrier', gateHtml.includes('كلمة المرور'));
  check('teacher gate does not render correct answers', !gateHtml.includes('الإجابة الصحيحة'));

  console.log(failures === 0 ? '\nALL RENDER CHECKS PASSED' : `\n${failures} RENDER CHECKS FAILED`);
  if (failures) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

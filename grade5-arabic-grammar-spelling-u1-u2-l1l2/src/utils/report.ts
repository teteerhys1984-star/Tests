import { correctAnswerText, studentAnswerText } from '../data/answers/answerKey';
import { QUESTIONS, subKey } from '../data/questions';
import { LESSONS, LESSON_ORDER, SECTION_LABEL } from '../data/sources/lessons';
import type { Answers } from '../data/types';
import type { ExamResult } from './scoring';
import { formatDateTimeAr, formatHMS } from './time';

export const EXAM_TITLE = 'اختبار اللغة العربية – الصف الخامس الأساسي (قواعد اللغة والإملاء)';
const DIFF: Record<string, string> = { basic: 'أساسي', intermediate: 'متوسط', advanced: 'متقدم' };
const STATUS: Record<string, string> = { correct: 'صحيحة', partial: 'صحيحة جزئيًّا', incorrect: 'خاطئة', unanswered: 'بلا إجابة' };

export interface ReportInput {
  studentName: string;
  attemptId: string;
  submittedAt: number;
  elapsedMs: number;
  answers: Answers;
  result: ExamResult;
}

export function buildReport(i: ReportInput): string {
  const r = i.result;
  const L: string[] = [];
  const hr = '════════════════════════════════════════════';
  L.push(hr, EXAM_TITLE, 'زهرة المعرفة – تقرير نتيجة الاختبار', hr);
  L.push(`اسم الطالبة: ${i.studentName}`);
  L.push(`رقم المحاولة: ${i.attemptId}`);
  L.push(`تاريخ التسليم ووقته: ${formatDateTimeAr(i.submittedAt)}`);
  L.push(`المدة المستغرقة: ${formatHMS(i.elapsedMs)}`);
  L.push(`الدرجة الكلية: ${r.total} من ${r.max}`);
  L.push(`النسبة المئوية: ${r.percentage}%`);
  L.push(`مستوى الأداء: ${r.level}`);
  L.push(`البنود الصحيحة: ${r.correct} | الجزئية: ${r.partial} | الخاطئة: ${r.incorrect} | بلا إجابة: ${r.unanswered}`);
  L.push(`درجة قواعد اللغة: ${r.bySection.grammar.earned} من ${r.bySection.grammar.max}`);
  L.push(`درجة الإملاء: ${r.bySection.spelling.earned} من ${r.bySection.spelling.max}`);
  L.push('', '— التفصيل حسب الدرس —');
  for (const l of LESSON_ORDER) {
    const b = r.byLesson[l];
    L.push(`• ${LESSONS[l].title}: قواعد ${b.grammar}/${b.grammarMax} | إملاء ${b.spelling}/${b.spellingMax} | المجموع ${Math.round((b.grammar + b.spelling) * 100) / 100}/${b.grammarMax + b.spellingMax}`);
  }
  L.push('', hr, 'مراجعة الأسئلة الثلاثين وبنودها', hr);
  QUESTIONS.forEach((q, qi) => {
    const lm = LESSONS[q.lessonId];
    const pages = q.section === 'grammar' ? lm.grammarPages : lm.spellingPages;
    L.push('', `السؤال ${qi + 1}: ${q.instruction}`);
    if (q.stem) L.push(`   النص: ${q.stem}`);
    L.push(`   المرجع: ${lm.unit} | الدرس ${q.lessonId}: ${lm.title} | ص${pages} | ${SECTION_LABEL[q.section]} | المستوى: ${DIFF[q.difficulty]}`);
    q.subparts.forEach((sp, si) => {
      const key = subKey(q, sp.id);
      const sr = r.bySub[key];
      L.push(`   (${si + 1}) ${sp.prompt}`);
      L.push(`       إجابة الطالبة: ${studentAnswerText(sp, i.answers[key])}`);
      L.push(`       الإجابة الصحيحة: ${correctAnswerText(sp)}`);
      L.push(`       الحالة: ${STATUS[sr.status]} | الدرجة: ${sr.earned} من ${sr.max}`);
      L.push(`       التوضيح: ${sp.explanation}`);
      L.push(`       المهارة: ${sp.skill} | المصدر: ${lm.repoFile}`);
    });
  });
  L.push('', hr, 'أُنشئ هذا التقرير في المتصفح، وتُرسل نسخة من النتيجة والإجابات إلى المعلّمة عند توفر الاتصال.', hr);
  return L.join('\r\n');
}

export function reportFileName(name: string): string {
  const safe = name.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_') || 'Student';
  return `Arabic_Grade5_Grammar_Spelling_${safe}.txt`;
}

export function downloadReport(input: ReportInput) {
  const text = buildReport(input);
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = reportFileName(input.studentName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

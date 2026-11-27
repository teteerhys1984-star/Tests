import { EXAM_TITLE, LESSON_TITLE } from '../data/exam';
import { plainChemText } from './chemistry';
import { formatDuration } from './session';
import type { Attempt, ExamResult } from './types';

export function reportFilename(name: string): string {
  return `تقرير-${name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'الطالب'}.txt`;
}

export function buildReport(attempt: Attempt, result: ExamResult): string {
  const date = new Intl.DateTimeFormat('ar', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(attempt.submittedAt || Date.now()));
  const lines = [
    EXAM_TITLE,
    `الوحدة الأولى — الدرس الثالث: ${LESSON_TITLE}`,
    'المرجع: الكتاب المدرسي، الصفحات 18–23',
    '',
    `اسم الطالب: ${attempt.studentName}`,
    `معرّف المحاولة: ${attempt.attemptId || '—'}`,
    `تاريخ ووقت التسليم: ${date}`,
    `العلامة النهائية: ${result.earned} / 100`,
    `النسبة المئوية: ${result.percentage}%`,
    `الوقت المستغرق: ${formatDuration(attempt.elapsedMs)}`,
    '',
    'تفاصيل الإجابات والتصحيح',
    '════════════════════════════════════',
  ];
  result.questions.forEach(q => {
    lines.push('', `السؤال ${q.question.number}: ${q.question.title}`, `علامة السؤال: ${q.earned} / ${q.available}`, '────────────────────────────────────');
    q.parts.forEach(p => {
      lines.push(
        '',
        `${p.part.label}) ${p.part.title} — ${p.earned} / ${p.available} علامة`,
        `السؤال: ${plainChemText(p.part.prompt)}`,
        `إجابة الطالب: ${plainChemText(p.studentText)}`,
        `الإجابة الصحيحة: ${plainChemText(p.correctText)}`,
        'معايير التصحيح:',
        ...p.criteria.map(c => `  • ${plainChemText(c.label)}: ${c.earned} / ${c.available}`),
        ...p.diagnosis.map(d => `موضع الملاحظة: ${plainChemText(d)}`),
        `الشرح: ${plainChemText(p.part.explanation)}`,
        `المرجع المنهجي: ص${p.part.reference.pages.join('، ')} — ${p.part.reference.item}`,
      );
    });
  });
  lines.push(
    '',
    'أُنشئ هذا التقرير في المتصفح مع حفظ نسخة محليّة وإرسال النتيجة إلى سجلّ المعلّم عند توفّر الاتصال.',
    'المهندس سومر شاهين — 0930215022',
    'https://wa.me/963930215022',
  );
  return '\uFEFF' + lines.join('\n');
}

export function downloadReport(attempt: Attempt, result: ExamResult): void {
  const blob = new Blob([buildReport(attempt, result)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = reportFilename(attempt.studentName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

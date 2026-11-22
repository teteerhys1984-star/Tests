import type { Attempt, ExamResult, Question } from '../types';
import { lessonLabel } from '../data/teacher';
import { texToPlain } from './tex';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function reportFileName(name: string): string {
  const safe = name.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '_') || 'الطالبة';
  return `تقرير_اختبار_الفيزياء_الصف_السابع_${safe}.txt`;
}

export function buildReport(questions: Question[], attempt: Attempt, result: ExamResult): string {
  const elapsed = attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0;
  const L: string[] = [];
  const line = (s = '') => L.push(s);

  line('==================================================');
  line('اختبار الفيزياء — الصف السابع — النموذج A');
  line('الوحدة الأولى: الدرس الأول (الحركة والسكون) والدرس الثاني (القوة والحركة)');
  line('==================================================');
  line(`اسم الطالبة: ${attempt.studentName}`);
  line(`تاريخ الاختبار: ${new Date(attempt.finishedAt ?? Date.now()).toLocaleString('ar-SY-u-nu-latn', { dateStyle: 'long', timeStyle: 'short' })}`);
  line(`الزمن المستغرق: ${formatDuration(elapsed)}`);
  line(`العلامة النهائية: ${result.total} من ${result.max}`);
  line(`النسبة المئوية: ${result.percentage}%`);
  line(`الفروع الصحيحة كلياً: ${result.partsCorrect} — الجزئية: ${result.partsPartial} — الخاطئة: ${result.partsWrong} (مجموع الفروع ${result.partsTotal})`);
  line();

  result.questions.forEach((qr, idx) => {
    const q = questions[idx];
    if (!q) return;
    line('--------------------------------------------------');
    line(`السؤال ${q.id}: ${q.title}`);
    line(`المرجع: ${lessonLabel(q)} — ص ${q.pages}`);
    line(`المهارة: ${q.skill}`);
    line(`العلامة: ${qr.marks} من ${qr.max}`);
    line(`الموقف: ${texToPlain(q.scenario)}`);
    qr.parts.forEach((pr, pi) => {
      const part = q.parts[pi];
      if (!part) return;
      line(`  (${LETTERS[pi] ?? ''}) ${texToPlain(part.prompt)}`);
      pr.inputs.forEach((ir) => {
        const input = part.inputs.find((i) => i.id === ir.inputId);
        if (input?.prompt) line(`    المطلوب: ${texToPlain(input.prompt)}`);
        if (input?.kind === 'tf') line(`    العبارة: ${texToPlain(input.statement)}`);
        line(`    إجابة الطالبة: ${ir.studentText.trim() ? ir.studentText : '—'}`);
        line(`    الإجابة النموذجية: ${texToPlain(ir.modelText)}`);
        line(`    العلامة المستحقة: ${ir.marks} من ${ir.max}`);
        ir.criteria.forEach((c) => line(`      • ${c.label}: ${c.earned} من ${c.marks}`));
        if (ir.rows) ir.rows.forEach((r) => line(`      • ${r.label}: ${r.earned} من ${r.marks}`));
      });
    });
    line(`  تفسير الحل: ${texToPlain(q.explanation)}`);
    if (q.solutionSteps?.length) {
      line('  خطوات الحل:');
      q.solutionSteps.forEach((s) => line(`    - ${texToPlain(s)}`));
    }
  });
  line();
  line('--------------------------------------------------');
  line('ملاحظة: التصحيح آلي وفق سلم التصحيح المعتمد؛ يمكن للمعلمة مراجعة الإجابات النصية.');
  return L.join('\n');
}

/** تنزيل ملف TXT بترميز UTF-8 (مع BOM لضمان قراءة العربية في كل الأنظمة) */
export function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

import type { StoredAttempt } from './storage';
import type { ExamResult } from './exam';
import { DIFFICULTY_LABEL, EXAM_META } from './exam';
import { formatDuration, formatTimestampWithZone, timestampIso } from './time';

const STATUS_WORD: Record<string, string> = {
  correct: 'صحيح',
  partial: 'صحيح جزئيًا',
  incorrect: 'خطأ',
  unanswered: 'غير مجاب',
};

const VERDICT_WORD: Record<string, string> = {
  true: 'موافق',
  false: 'غير موافق',
};

/** Convert the small LaTeX subset used in this exam to readable plain text. */
export function latexToPlain(tex: string): string {
  let t = tex;
  for (let i = 0; i < 4; i += 1) {
    t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    t = t.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
  }
  t = t
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\neq|\\ne/g, '≠')
    .replace(/\\leq|\\le/g, '≤')
    .replace(/\\geq|\\ge/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\(?:quad|qquad|,|;|!|:)/g, ' ')
    .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
    .replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/\^(-?\d+)/g, '^$1')
    .replace(/_\{([^{}]*)\}/g, '_($1)')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return t;
}

export function plainText(input: string): string {
  if (!input) return '—';
  let result = '';
  let rest = input;
  while (rest.length > 0) {
    const start = rest.indexOf('$');
    if (start < 0) {
      result += rest;
      break;
    }
    const end = rest.indexOf('$', start + 1);
    if (end < 0) {
      result += rest;
      break;
    }
    result += rest.slice(0, start);
    result += latexToPlain(rest.slice(start + 1, end));
    rest = rest.slice(end + 1);
  }
  return result.replace(/[ \t]+/g, ' ').replace(/\s+([،:؛.!؟])/g, '$1').trim() || '—';
}

export function sanitizeStudentNameForFile(name: string): string {
  const normalized = name.normalize('NFC');
  const cleaned = normalized
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f/\\?%*:|"<>]/g, '_')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/\.+$/g, '')
    .slice(0, 90)
    .replace(/^_+|_+$/g, '');
  return cleaned || 'STUDENT';
}

export function reportFilename(studentName: string): string {
  return `Grade8_Algebra_Unit1_Unit2_Report_${sanitizeStudentNameForFile(studentName)}.txt`;
}

function line(width = 78): string {
  return '='.repeat(width);
}

function dash(width = 78): string {
  return '-'.repeat(width);
}

export function buildReport(attempt: StoredAttempt, result: ExamResult): string {
  const duration = attempt.elapsedMs ?? (attempt.submittedAt ? attempt.submittedAt - attempt.startedAt : 0);
  const filename = attempt.reportFilename ?? reportFilename(attempt.studentName);
  const rows: string[] = [];

  rows.push('ALGEBRA NEXUS — THE MATHEMATICAL CHALLENGE');
  rows.push('تقرير اختبار الجبر التفاعلي — الصف الثامن');
  rows.push(line());
  rows.push('');
  rows.push('بيانات الطالب');
  rows.push(dash());
  rows.push(`اسم الطالب: ${attempt.studentName}`);
  rows.push(`عنوان الاختبار: ${EXAM_META.title}`);
  rows.push(`الوصف: ${EXAM_META.arabicTitle}`);
  rows.push(`الصف: ${EXAM_META.grade}`);
  rows.push(`المادة: ${EXAM_META.subject}`);
  rows.push(`معرّف الاختبار: ${attempt.examId} (الإصدار ${attempt.examVersion})`);
  rows.push(`معرّف المحاولة: ${attempt.attemptId}`);
  rows.push(`اسم ملف التقرير: ${filename}`);
  rows.push('');
  rows.push('الوحدات والدروس المشمولة');
  rows.push(dash());
  for (const unit of EXAM_META.units) {
    rows.push(`الوحدة ${unit.number}: ${unit.title} — ${unit.pages}`);
    for (const lesson of unit.lessons) rows.push(`  • ${lesson}`);
  }
  rows.push('');
  rows.push('التحقق البنيوي للاختبار');
  rows.push(dash());
  rows.push('15 سؤالًا رئيسًا • 100 درجة • جميع الأجزاء المطلوبة قابلة للتصحيح آليًا');
  rows.push('تم التحقق برمجيًا من مجموع العلامات = 100/100 قبل بدء المحاولة.');
  rows.push('');
  rows.push('التوقيت');
  rows.push(dash());
  rows.push(`بدء الاختبار: ${formatTimestampWithZone(attempt.startedAt)}`);
  rows.push(`وقت التسليم: ${formatTimestampWithZone(attempt.submittedAt)}`);
  rows.push(`بدء الاختبار (ISO): ${timestampIso(attempt.startedAt)}`);
  rows.push(`وقت التسليم (ISO): ${timestampIso(attempt.submittedAt)}`);
  rows.push(`مدة الحل: ${formatDuration(duration)} (HH:MM:SS)`);
  rows.push('طريقة المؤقّت: مؤقّت تصاعدي مبني على أختام زمنية، يتوقف عند التسليم النهائي فقط.');
  rows.push('');
  rows.push('النتيجة');
  rows.push(dash());
  rows.push(`الدرجة النهائية: ${result.earned} / ${result.max}`);
  rows.push(`النسبة المئوية: ${result.percentage}%`);
  rows.push(`الأجزاء الصحيحة: ${result.counts.correct}`);
  rows.push(`الأجزاء الصحيحة جزئيًا: ${result.counts.partial}`);
  rows.push(`الأجزاء الخاطئة: ${result.counts.incorrect}`);
  rows.push(`الأجزاء غير المجابة: ${result.counts.unanswered}`);
  rows.push('');
  rows.push('تفصيل الأسئلة والأجوبة');
  rows.push(line());

  for (const qr of result.questions) {
    rows.push('');
    rows.push(`[السؤال ${qr.question.number} من ${result.questions.length}] ${plainText(qr.question.title)}`);
    rows.push(`النطاق: ${plainText(qr.question.domain)} • المستوى: ${DIFFICULTY_LABEL[qr.question.difficulty]}`);
    rows.push(`العلامة: ${qr.earned} / ${qr.marks} • الحالة: ${STATUS_WORD[qr.status]}`);
    if (qr.question.context) rows.push(`السياق: ${plainText(qr.question.context)}`);
    rows.push(dash());
    for (const sr of qr.subs) {
      const part = sr.sub;
      rows.push(`الجزء ${part.label} — ${sr.earned}/${sr.marks} — ${STATUS_WORD[sr.status]}`);
      rows.push(`نص الجزء: ${plainText(part.prompt)}`);
      if (part.statement) rows.push(`العبارة: ${plainText(part.statement)}`);
      if (part.helper) rows.push(`توجيه الإدخال: ${plainText(part.helper)}`);
      rows.push(`إجابة الطالب: ${sr.answered ? plainText(sr.studentText) : 'لم يجب'}`);
      rows.push(`الإجابة الصحيحة: ${plainText(sr.correctText)}`);
      if (part.kind === 'justify') {
        rows.push(`الحكم الصحيح: ${VERDICT_WORD[part.correctVerdict ?? ''] ?? '—'}`);
      }
      rows.push(`العلامة المكتسبة: ${sr.earned} / ${sr.marks}`);
      rows.push(`قاعدة الاحتساب: ${plainText(part.marking)}`);
      rows.push(`المبرر التصحيحي: ${plainText(part.rationale)}`);
      rows.push(`الحل الكامل: ${plainText(part.solution)}`);
      rows.push(`أخطاء شائعة: ${plainText(part.commonMistakes)}`);
      rows.push(
        `المرجع المصدر: ${part.source.unit} • ${part.source.lesson} • ${part.source.page} • ${part.source.item}`,
      );
      if (part.source.note) rows.push(`ملاحظة المصدر: ${plainText(part.source.note)}`);
      rows.push(dash());
    }
  }

  rows.push('');
  rows.push('إفصاح الخصوصية وطريقة التوليد');
  rows.push(dash());
  rows.push('تم إنشاء هذا التقرير محليًا داخل متصفح الطالب باستخدام Blob وObject URL.');
  rows.push('لم تُرسل بيانات الطالب أو إجاباته إلى أي خادم أو خدمة خارجية.');
  rows.push('يُحتسب الصحيح جزئيًا فقط في الأجزاء ذات الحقول المنفصلة أو الحكم والتبرير المنفصلين.');
  rows.push('تقبل المصحح الصور الكسرية المكافئة المضبوطة، ولا يستخدم أطراف تفاوت عددية واسعة.');
  rows.push('');
  rows.push('نهاية التقرير — ALGEBRA NEXUS');
  rows.push(line());

  return rows.join('\r\n');
}

/**
 * Trigger a local download immediately, inside the submission interaction.
 * The browser can still block automatic downloads; the UI therefore keeps
 * a backup button and uses neutral wording about the outcome.
 */
export function triggerReportDownload(filename: string, content: string): boolean {
  try {
    const blob = new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch {
    return false;
  }
}

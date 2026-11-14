import { FinalGradingReport } from '../types/exam';

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[/\\?%*:|"<>]/g, '');
}

export function generateReportText(report: FinalGradingReport): string {
  const line = '═'.repeat(72);
  const subLine = '─'.repeat(72);

  let text = '';

  text += `${line}\n`;
  text += `   MATHVERSE — تقرير التقييم الرياضي الشامل للصف الثامن\n`;
  text += `   ALGEBRA + GEOMETRY INTEGRATED EXAMINATION REPORT\n`;
  text += `${line}\n\n`;

  // General Information
  text += `[1] معلومات الاختبار والطالب\n`;
  text += `${subLine}\n`;
  text += `اسم الطالب / الطالبة    : ${report.studentName}\n`;
  text += `عنوان الاختبار          : ${report.examTitle}\n`;
  text += `الصف الدراسي             : ${report.grade}\n`;
  text += `المادتان المقررتان       : الجبر (الوحدة 1 + الوحدة 2) والهندسة (الوحدة 1 + الوحدة 2 أول درسين)\n`;
  text += `الدروس المغطاة بالتفصيل :\n`;
  text += `  • الجبر الوحدة 1: الأعداد العادية والعمليات عليها (ص 3–16)\n`;
  text += `  • الجبر الوحدة 2: قوى الأعداد العادية وقواعدها وقوى 10 (ص 25–37)\n`;
  text += `  • الهندسة الوحدة 1: متوازيات الأضلاع والانسحاب وتطابق المثلثات (الدروس 1–7)\n`;
  text += `  • الهندسة الوحدة 2: منتصفا ضلعين في مثلث والموازي لضلع من منتصف ضلع آخر (ص 31–35)\n`;
  text += `تاريخ وبدء الاختبار      : ${report.startTimeFormatted}\n`;
  text += `تاريخ وتوقيت التسليم    : ${report.submissionTimeFormatted}\n`;
  text += `المدة الزمنية المستغرقة  : ${report.elapsedDurationFormatted} (ساعة:دقيقة:ثانية)\n`;
  text += `معرف المحاولة           : ${report.attemptId}\n\n`;

  // Overall Results
  text += `[2] النتيجة العامة للتقييم\n`;
  text += `${subLine}\n`;
  text += `العلامة النهائية المستحقة : ${report.totalScore} / 100\n`;
  text += `النسبة المئوية الإجمالية  : ${report.percentage}%\n`;
  text += `عدد الإجابات الصحيحة     : ${report.counts.correct}\n`;
  text += `عدد الإجابات الجزئية     : ${report.counts.partial}\n`;
  text += `عدد الإجابات الخاطئة     : ${report.counts.incorrect}\n`;
  text += `عدد الأسئلة غير المجابة  : ${report.counts.unanswered}\n\n`;

  // Subject Breakdown
  text += `[3] تفصيل النتائج حسب المادة\n`;
  text += `${subLine}\n`;
  text += `قسم الجبر (ALGEBRA)     : ${report.algebra.score} / ${report.algebra.totalPossible} (${report.algebra.percentage}%)\n`;
  text += `قسم الهندسة (GEOMETRY)  : ${report.geometry.score} / ${report.geometry.totalPossible} (${report.geometry.percentage}%)\n\n`;

  // Detailed Question Audit
  text += `[4] تدقيق تفصيلي لجميع الأسئلة والفقرات الفرعية (15 سؤالاً رئيسياً)\n`;
  text += `${subLine}\n\n`;

  report.questionResults.forEach((q, idx) => {
    text += `■ السؤال ${q.questionNumber} [${q.subject === 'ALGEBRA' ? 'جبر - ALGEBRA' : 'هندسة - GEOMETRY'}]: ${q.title}\n`;
    text += `  المصدر في المنهاج: ${q.curriculumRef.unit} | ${q.curriculumRef.lesson} (${q.curriculumRef.pages})\n`;
    if (q.diagramId) {
      text += `  المخطط الهندسي: تم التحقق رياضياً من الإحداثيات والمتجهات (معرف المخطط: ${q.diagramId})\n`;
    }
    text += `  العلامة المكتسبة في السؤال: ${q.earnedMarks} / ${q.totalMarks}\n`;
    text += `  الفقرات الفرعية:\n`;

    q.subpartResults.forEach(sub => {
      const statusLabel =
        sub.status === 'correct'
          ? 'صحيحة [كاملة]'
          : sub.status === 'partial'
          ? 'جزئية'
          : sub.status === 'incorrect'
          ? 'خاطئة'
          : 'غير مجابة';

      text += `    • الفقرة (${sub.subpartNumber}):\n`;
      text += `      إجابة الطالب      : ${sub.studentAnswer}\n`;
      text += `      الإجابة النموذجية  : ${sub.correctAnswer}\n`;
      text += `      العلامة المستحقة  : ${sub.marksEarned} / ${sub.marksAllocated} (${statusLabel})\n`;
      text += `      الشرح الرياضي    : ${sub.teacherExplanation}\n`;
    });

    if (idx < report.questionResults.length - 1) {
      text += `\n${'-'.repeat(50)}\n\n`;
    }
  });

  text += `\n${line}\n`;
  text += `تم توليد هذا التقرير تلقائياً بواسطة نظام MATHVERSE للتقييم الرقمي المتقدم.\n`;
  text += `إشراف: المهندس سومر شاهين | هاتف/واتساب: 0930215022\n`;
  text += `${line}\n`;

  return text;
}

export function downloadReportFile(report: FinalGradingReport): boolean {
  try {
    const reportContent = generateReportText(report);
    const sanitizedStudentName = sanitizeFilename(report.studentName || 'Student');
    const filename = `Grade8_Combined_Algebra_Geometry_Report_${sanitizedStudentName}.txt`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Failed to trigger automatic report download:', error);
    return false;
  }
}

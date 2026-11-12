import { EXAM_TITLE } from "./data";
import type { Attempt } from "./attempt";
import {
  formatDateTime,
  formatDuration,
  statusArabic,
  texToText,
  type GradeResult,
} from "./grade";

export function sanitizeStudentName(name: string): string {
  const clean = name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|\u0000-\u001F\u007F]/g, "-")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 70);
  return clean || "Student";
}

export function reportFilename(studentName: string): string {
  return `Grade6_Mathematics_Mia_Report_${sanitizeStudentName(studentName)}.txt`;
}

export function buildReport(attempt: Attempt, result: GradeResult): string {
  const submittedAt = attempt.submittedAt ?? Date.now();
  const durationMs = Math.max(0, submittedAt - attempt.startTimestamp);
  const line = (text = "") => `${text}\r\n`;
  const divider = "=".repeat(62);

  const out: string[] = [];
  out.push(line(divider));
  out.push(line("ميا والرياضيات — تقرير اختبار رسمي"));
  out.push(line(divider));
  out.push(line(`اسم الاختبار: ${EXAM_TITLE}`));
  out.push(line("الصف: السادس الأساسي"));
  out.push(line("المادة: الرياضيات"));
  out.push(line("عدد الأسئلة: 30 سؤالاً رئيسياً"));
  out.push(line(`عدد الأجزاء المستقلة: ${result.totalParts}`));
  out.push(line(""));
  out.push(line("— بيانات الطالب والمحاولة —"));
  out.push(line(`اسم الطالب: ${attempt.studentName}`));
  out.push(line(`معرّف الاختبار: ${attempt.examId}`));
  out.push(line(`نسخة الاختبار: ${attempt.version}`));
  out.push(line(`معرّف المحاولة: ${attempt.attemptId}`));
  out.push(line(""));
  out.push(line("— التوقيت —"));
  out.push(line(`بدء الاختبار: ${formatDateTime(attempt.startTimestamp)}`));
  out.push(line(`وقت التسليم: ${formatDateTime(submittedAt)}`));
  out.push(line(`المدة الزمنية: ${formatDuration(durationMs)}`));
  out.push(line(""));
  out.push(line("— النتيجة —"));
  out.push(line(`الدرجة النهائية: ${result.score} من ${result.totalMarks}`));
  out.push(line(`النسبة المئوية: ${result.percentage}%`));
  out.push(line(`الأجزاء الصحيحة: ${result.correct}`));
  out.push(line(`الأجزاء الصحيحة جزئياً: ${result.partial}`));
  out.push(line(`الأجزاء الخاطئة: ${result.incorrect}`));
  out.push(line(`الأجزاء دون إجابة: ${result.unanswered}`));
  out.push(line(`الأجزاء المُجابة: ${result.answeredParts} من ${result.totalParts}`));
  out.push(line(""));
  out.push(line("— قواعد التصحيح —"));
  out.push(
    line(
      "تُمنح علامة كل جزء كاملة عند صحة جميع عناصره المطلوبة. تُقبل الإجابات البديلة المذكورة لكل جزء."
    )
  );
  out.push(
    line(
      "في الأجزاء ذات العناصر المتعددة، تُمنح العلامة الجزئية لعناصر الإجابة الصحيحة كل على حدة وفق العلامات الموزعة."
    )
  );
  out.push(line("لا تُخصم علامات عن الإجابات الخاطئة، ولا توجد علامات سالبة."));
  out.push(line(""));
  out.push(line(divider));
  out.push(line("تفاصيل الأسئلة والأجزاء"));
  out.push(line(divider));

  for (const questionResult of result.questions) {
    const question = questionResult.question;
    out.push(line(""));
    out.push(line(divider));
    out.push(
      line(
        `السؤال ${questionResult.position} — ${texToText(question.title)}  [${questionResult.awarded} / ${questionResult.max}]`
      )
    );
    out.push(line(`المحور: ${question.topic}`));
    out.push(line(`المرجع الداخلي للكتاب: ${question.page}`));
    out.push(line(`نص السؤال: ${texToText(question.title)}`));
    out.push(line(""));
    for (const part of question.parts) {
      const partResult = questionResult.parts.find((p) => p.partId === part.id);
      if (!partResult) continue;
      out.push(line(`  الجزء (${part.label}) — [${partResult.awarded} / ${partResult.max}]`));
      out.push(line(`  نص الجزء الكامل: ${texToText(part.prompt)}`));
      out.push(line(`  إجابة الطالب: ${texToText(partResult.givenText) || "—"}`));
      out.push(line(`  الإجابة الصحيحة: ${partResult.correctText}`));
      out.push(
        line(
          `  العلامات: ${partResult.awarded} من ${partResult.max} — الحالة: ${statusArabic(partResult.status)}`
        )
      );
      out.push(line(`  الشرح: ${texToText(part.explanation)}`));
      if (part.alternativeAnswers && part.alternativeAnswers.length > 0) {
        out.push(
          line(
            `  إجابات بديلة مقبولة: ${part.alternativeAnswers
              .map((answer) => texToText(answer))
              .join("، ")}`
          )
        );
      }
      if (part.partialRule) {
        out.push(line(`  قاعدة العلامة الجزئية: ${part.partialRule}`));
      }
      out.push(line(`  المرجع الداخلي للكتاب: ${part.page}`));
      out.push("");
    }
  }

  out.push(line(divider));
  out.push(line("نهاية التقرير — تم إنشاؤه محلياً داخل المتصفح دون إرسال أي بيانات."));
  out.push(line(divider));
  return out.join("");
}

export function validateReport(report: string, attempt: Attempt, result: GradeResult): void {
  if (!report || report.length < 1000) {
    throw new Error("التقرير فارغ أو غير مكتمل.");
  }
  const required = [
    EXAM_TITLE,
    "اسم الطالب",
    attempt.studentName,
    "الدرجة النهائية",
    "المرجع الداخلي للكتاب",
    "السؤال 30",
    `${result.score} من ${result.totalMarks}`,
  ];
  for (const marker of required) {
    if (!report.includes(marker)) {
      throw new Error(`التقرير لا يتضمن الحقل المطلوب: ${marker}`);
    }
  }
  if (report.includes("somer173")) {
    throw new Error("التقرير يتضمن بيانات محظورة.");
  }
}

export function downloadReport(report: string, filename: string): void {
  const blob = new Blob([`\uFEFF${report}`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

import { CURRICULUM_PASSAGES, EXAM_GRADE, LESSON_METADATA } from '../data/passages';
import { ExamEvaluation } from '../types/exam';
import { formatMark, formatSourceReference } from './scoring';
import { formatStopwatch, formatSubmissionDateTime } from './storage';

export function buildReportFilename(studentName: string): string {
  const cleaned = studentName
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const safeName = cleaned.length > 0 ? cleaned.slice(0, 48) : 'Student';
  return `Grade4_English_Exam_${safeName}.txt`;
}

export function generateTxtReport(evaluation: ExamEvaluation): string {
  const divider = '='.repeat(76);
  const subDivider = '-'.repeat(76);
  const lessonsLine = LESSON_METADATA.map(
    (l) => `Lesson ${l.number}: ${l.title}`
  ).join(' | ');

  const lines: string[] = [
    divider,
    evaluation.examTitle.toUpperCase(),
    divider,
    `Student Name        : ${evaluation.studentName}`,
    `Grade               : ${EXAM_GRADE}`,
    `Lessons Covered     : Unit 1 — ${lessonsLine}`,
    `Submission Date/Time: ${formatSubmissionDateTime(evaluation.submittedAtIso)}`,
    `Time Taken          : ${formatStopwatch(evaluation.elapsedMs)}`,
    `Total Score         : ${formatMark(evaluation.totalEarnedMarks)} / ${evaluation.totalMaxMarks} (${formatMark(evaluation.totalEarnedMarks)}%)`,
    `Correct Questions   : ${evaluation.correctQuestionCount} / ${evaluation.totalQuestions}`,
    `Incorrect Questions : ${evaluation.incorrectQuestionCount} / ${evaluation.totalQuestions}${
      evaluation.partialQuestionCount > 0
        ? ` (including ${evaluation.partialQuestionCount} partially correct)`
        : ''
    }`,
    '',
    subDivider,
    'LESSON-BY-LESSON SCORES',
    subDivider,
  ];

  evaluation.lessonScores.forEach((ls) => {
    const lessonLabel = `Lesson ${ls.lesson} — ${ls.title}`.padEnd(40, ' ');
    lines.push(
      `${lessonLabel}: ${formatMark(ls.earnedMarks)} / ${ls.maxMarks} marks (${ls.fullyCorrectCount}/${ls.questionCount} fully correct)`
    );
  });

  lines.push('', divider, 'DETAILED QUESTION-BY-QUESTION REVIEW (50 QUESTIONS)', divider);

  evaluation.gradedQuestions.forEach((gq) => {
    const q = gq.question;
    const status = gq.isFullyCorrect
      ? 'CORRECT'
      : gq.isPartial
      ? 'PARTIALLY CORRECT'
      : 'INCORRECT';

    lines.push(
      '',
      `Question ${gq.examNumber} [${q.formatLabel}] — Marks: ${formatMark(gq.earnedMarks)} / ${gq.maxMarks} (${status})`,
      `Instruction: ${q.instruction}`
    );

    if (q.passageId) {
      const passage = CURRICULUM_PASSAGES[q.passageId];
      lines.push(`Passage: ${passage.paragraphs.join(' ')}`);
    }

    if (q.contextLines && q.contextLines.length > 0) {
      q.contextLines.forEach((cl) => lines.push(`  ${cl}`));
    }

    if (q.wordBank && q.wordBank.length > 0) {
      lines.push(`Word Bank: ${q.wordBank.join(' · ')}`);
    }

    gq.subPartResults.forEach((spr) => {
      const prefix = spr.subPart.label ? `${spr.subPart.label} ` : '';
      lines.push(
        `  ${prefix}${spr.subPart.prompt}`,
        `    Student Answer : ${spr.studentAnswerDisplay}`,
        `    Correct Answer : ${spr.correctAnswerDisplay}`,
        `    Marks Earned   : ${formatMark(spr.earnedMarks)} / ${formatMark(spr.maxMarks)}`
      );
    });

    lines.push(`  Explanation      : ${q.explanation}`);
    lines.push(`  Source Reference : ${formatSourceReference(q.source)}`);
    lines.push(subDivider);
  });

  lines.push('End of Report');
  return lines.join('\n') + '\n';
}

export function downloadTxtReport(evaluation: ExamEvaluation): void {
  const reportText = generateTxtReport(evaluation);
  const filename = buildReportFilename(evaluation.studentName);
  const blob = new Blob(['\uFEFF' + reportText], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

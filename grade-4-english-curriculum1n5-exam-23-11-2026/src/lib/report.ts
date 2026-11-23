import type { ExamResult } from '../types';
import { EXAM_SUBTITLE, EXAM_TITLE, TOTAL_MARKS } from '../data/exam';
import { formatHMS } from './grading';

function line(char = '-', length = 60): string {
  return char.repeat(length);
}

function statusLabel(status: string): string {
  switch (status) {
    case 'correct':
      return 'CORRECT';
    case 'partial':
      return 'PARTIAL CREDIT';
    case 'wrong':
      return 'INCORRECT';
    default:
      return 'NO ANSWER';
  }
}

/** Builds the full plain-text report (UTF-8). Generated locally — nothing is uploaded. */
export function buildReportText(studentName: string, result: ExamResult): string {
  const submittedDate = new Date(result.submittedAt);
  const out: string[] = [];

  out.push(line('=', 64));
  out.push(EXAM_TITLE);
  out.push(`${EXAM_SUBTITLE} · 12 questions · ${TOTAL_MARKS} marks`);
  out.push(line('=', 64));
  out.push(`Student name   : ${studentName}`);
  out.push(`Date           : ${submittedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`);
  out.push(`Time           : ${submittedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
  out.push(`Completion time: ${formatHMS(result.completionSeconds)} (HH:MM:SS)`);
  out.push(`Total score    : ${result.totalEarned} / ${result.totalPossible} (${result.percentage}%)`);
  out.push(`Result         : ${result.gradeBand}`);
  out.push(`Questions at full marks: ${result.perfectQuestions} / 12`);
  out.push(line('-', 64));
  out.push('QUESTION-BY-QUESTION BREAKDOWN');
  out.push(line('-', 64));

  for (const qr of result.questions) {
    out.push('');
    out.push(`Question ${qr.question.id} — ${qr.question.title}`);
    out.push(`  Skill   : ${qr.question.skill}`);
    out.push(`  Source  : ${qr.question.reference}`);
    out.push(`  Marks   : ${qr.earned} / ${qr.max}`);
    for (const part of qr.parts) {
      const submitted = part.submitted.trim() ? part.submitted.trim() : '(no answer)';
      out.push(`  • ${part.prompt.replace(/\n/g, ' ')}`);
      out.push(`      Your answer : ${submitted}`);
      out.push(`      Correct     : ${part.displayAnswer}`);
      out.push(`      Marks       : ${part.earned} / ${part.marks} — ${statusLabel(part.status)}`);
    }
    if (qr.earned < qr.max) {
      out.push(`  Explanation: ${qr.question.explanation}`);
    }
  }

  out.push('');
  out.push(line('-', 64));
  out.push('MARK DISTRIBUTION');
  out.push(line('-', 64));
  for (const qr of result.questions) {
    out.push(`Q${String(qr.question.id).padStart(2, '0')} — ${qr.question.title.padEnd(46, '.')} ${qr.earned}/${qr.max}`);
  }
  out.push(line('-', 64));
  out.push(`TOTAL ${'.'.repeat(52)}${result.totalEarned}/${result.totalPossible}`);
  out.push('');
  out.push('This report was generated locally in your browser.');
  out.push('No student data was sent to any external service.');
  return out.join('\r\n');
}

/** Sanitises a student name so it is safe inside a filename. */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Student';
}

/** Triggers a local download of the UTF-8 report. */
export function downloadReport(studentName: string, result: ExamResult): void {
  const text = '﻿' + buildReportText(studentName, result); // UTF-8 BOM keeps Arabic prompts legible in common editors
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `English Exam - Grade 4 - ${sanitizeFilename(studentName)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

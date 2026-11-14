import { EXAM_QUESTIONS } from '../data/questions';
import {
  ExamSessionState,
  FinalGradingReport,
  QuestionGradingResult,
  SubpartGradingResult
} from '../types/exam';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

function normalizeInput(val: string | undefined): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()) // Arabic to Western digits
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function gradeExamSession(state: ExamSessionState): FinalGradingReport {
  let totalEarned = 0;
  let algebraEarned = 0;
  let algebraPossible = 0;
  let geometryEarned = 0;
  let geometryPossible = 0;

  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const questionResults: QuestionGradingResult[] = [];

  for (const question of EXAM_QUESTIONS) {
    let qEarned = 0;
    const subpartResults: SubpartGradingResult[] = [];

    if (question.subject === 'ALGEBRA') {
      algebraPossible += question.totalMarks;
    } else {
      geometryPossible += question.totalMarks;
    }

    for (const subpart of question.subparts) {
      const answerKey = `${question.id}_${subpart.id}`;
      const rawStudentAnswer = state.answers[answerKey] || '';
      const normStudent = normalizeInput(rawStudentAnswer);

      let marksEarned = 0;
      let status: 'correct' | 'partial' | 'incorrect' | 'unanswered' = 'unanswered';

      if (!rawStudentAnswer || rawStudentAnswer.trim() === '') {
        status = 'unanswered';
        unansweredCount++;
      } else {
        const correctNorm = normalizeInput(
          Array.isArray(subpart.correctAnswer) ? subpart.correctAnswer[0] : subpart.correctAnswer
        );

        let isMatch = normStudent === correctNorm;

        if (!isMatch && subpart.acceptableAnswers) {
          isMatch = subpart.acceptableAnswers.some(acc => normalizeInput(acc) === normStudent);
        }

        if (isMatch) {
          marksEarned = subpart.marks;
          status = 'correct';
          correctCount++;
        } else {
          // Check for reasonable partial credit if applicable
          status = 'incorrect';
          incorrectCount++;
        }
      }

      qEarned += marksEarned;

      // Find user-friendly text of correct answer
      let readableCorrect = Array.isArray(subpart.correctAnswer)
        ? subpart.correctAnswer.join(', ')
        : subpart.correctAnswer;

      if (subpart.options) {
        const matchedOpt = subpart.options.find(opt => opt.id === subpart.correctAnswer);
        if (matchedOpt) {
          readableCorrect = matchedOpt.label;
        }
      }

      let readableStudent = rawStudentAnswer;
      if (subpart.options && rawStudentAnswer) {
        const matchedStudentOpt = subpart.options.find(opt => opt.id === rawStudentAnswer);
        if (matchedStudentOpt) {
          readableStudent = matchedStudentOpt.label;
        }
      }

      subpartResults.push({
        subpartId: subpart.id,
        subpartNumber: subpart.subpartNumber,
        marksAllocated: subpart.marks,
        marksEarned,
        status,
        studentAnswer: readableStudent || '(لم تتم الإجابة)',
        correctAnswer: readableCorrect,
        teacherExplanation: subpart.teacherExplanation
      });
    }

    totalEarned += qEarned;
    if (question.subject === 'ALGEBRA') {
      algebraEarned += qEarned;
    } else {
      geometryEarned += qEarned;
    }

    questionResults.push({
      questionId: question.id,
      questionNumber: question.questionNumber,
      subject: question.subject,
      title: question.title,
      totalMarks: question.totalMarks,
      earnedMarks: qEarned,
      subpartResults,
      curriculumRef: question.curriculumRef,
      diagramId: question.diagram?.id
    });
  }

  const startDate = state.startTime ? new Date(state.startTime) : new Date();
  const submitDate = state.submissionTime ? new Date(state.submissionTime) : new Date();

  return {
    studentName: state.studentName,
    attemptId: state.attemptId,
    examTitle: 'MATHVERSE — الاختبار الرياضي الشامل للصف الثامن (جبر + هندسة)',
    grade: 'الصف الثامن الأساسي',
    startTimeFormatted: startDate.toLocaleString('en-US', { hour12: false }),
    submissionTimeFormatted: submitDate.toLocaleString('en-US', { hour12: false }),
    elapsedDurationFormatted: formatDuration(state.elapsedSeconds),
    totalScore: Math.round(totalEarned * 10) / 10,
    percentage: Math.round((totalEarned / 100) * 100),
    counts: {
      correct: correctCount,
      partial: partialCount,
      incorrect: incorrectCount,
      unanswered: unansweredCount
    },
    algebra: {
      score: Math.round(algebraEarned * 10) / 10,
      totalPossible: algebraPossible,
      percentage: Math.round((algebraEarned / algebraPossible) * 100)
    },
    geometry: {
      score: Math.round(geometryEarned * 10) / 10,
      totalPossible: geometryPossible,
      percentage: Math.round((geometryEarned / geometryPossible) * 100)
    },
    questionResults
  };
}

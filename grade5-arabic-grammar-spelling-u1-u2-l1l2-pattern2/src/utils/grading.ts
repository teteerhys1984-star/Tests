import type {
  Attempt,
  ExamResult,
  LessonBreakdown,
  QuestionResult,
  ScoreBand,
  SectionId,
  SubpartResult,
} from "../types/exam";
import { LESSONS_BY_ID, ORDERED_LESSONS, SECTION_LABELS } from "../data/sources/lessons";
import { QUESTIONS, TOTAL_MARKS } from "../data/questions";
import { subpartLetter } from "./arabic";

/** Remove Arabic diacritics, tatweel and extra whitespace for typed answers. */
export function normalizeAnswer(value: string): string {
  return value
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[،؛؟.,!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalisation for typed answers only; hamza letters are intentionally kept. */
function canonicalText(value: string): string {
  return normalizeAnswer(value.toLocaleLowerCase("ar"));
}

function isAnswered(values: string[] | undefined): boolean {
  if (!values || values.length === 0) return false;
  return values.some((value) => value.trim().length > 0);
}

export function formatAnswer(values: string[] | undefined): string {
  if (!isAnswered(values)) return "لم تُجب";
  return (values ?? []).map((value) => value.trim()).filter(Boolean).join("، ");
}

export function isCorrectAnswer(kind: string, given: string[], correct: string[]): boolean {
  if (kind === "text") {
    const accepted = correct.map(canonicalText).filter(Boolean);
    const value = canonicalText(given[0] ?? "");
    return value.length > 0 && accepted.includes(value);
  }
  const sortedGiven = [...new Set(given)].sort();
  const sortedCorrect = [...new Set(correct)].sort();
  return (
    sortedGiven.length === sortedCorrect.length &&
    sortedGiven.every((value, index) => value === sortedCorrect[index])
  );
}

function band(earned: number, max: number): ScoreBand {
  return {
    earned: Math.round(earned * 100) / 100,
    max,
    percentage: max === 0 ? 0 : Math.round((earned / max) * 1000) / 10,
  };
}

function performanceLevel(percentage: number): ExamResult["performance"] {
  if (percentage >= 90)
    return {
      label: "ممتاز",
      description: "أداء متميز يدل على إتقان قواعد الدرس وإملائه.",
      tone: "excellent",
    };
  if (percentage >= 75)
    return {
      label: "جيد جدًا",
      description: "أداء قوي مع مواضع قليلة تحتاج إلى تثبيت.",
      tone: "good",
    };
  if (percentage >= 60)
    return {
      label: "جيد",
      description: "تحقّق جزء جيد من المهارات، ويحتاج بعضها إلى مراجعة.",
      tone: "fair",
    };
  if (percentage >= 50)
    return {
      label: "مقبول",
      description: "تحتاج المهارات الأساسية إلى مراجعة منظمة.",
      tone: "fair",
    };
  return {
    label: "يحتاج إلى مراجعة",
    description: "يُنصح بإعادة مراجعة القواعد والأمثلة المقررة قبل المحاولة التالية.",
    tone: "support",
  };
}

export function gradeAttempt(attempt: Attempt): ExamResult {
  const subpartResults: SubpartResult[] = [];
  const questionResults: QuestionResult[] = [];

  for (const question of QUESTIONS) {
    const lesson = LESSONS_BY_ID[question.lessonId];
    const subs: SubpartResult[] = question.subparts.map((subpart, index) => {
      const given = attempt.answers[subpart.id] ?? [];
      const answered = isAnswered(given);
      const correct = isCorrectAnswer(subpart.kind, given, subpart.correct);
      const marksEarned = correct ? subpart.marks : 0;
      return {
        questionNumber: question.number,
        questionId: question.id,
        subpartId: subpart.id,
        subpartLabel: subpartLetter(index),
        prompt: subpart.prompt,
        kind: subpart.kind,
        options: subpart.options,
        studentAnswer: given,
        correctAnswer: subpart.correct,
        answered,
        isCorrect: correct,
        marksEarned,
        marksMax: subpart.marks,
        explanation: subpart.explanation,
        misconception: subpart.misconception,
        source: {
          unit: lesson.unit,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          page: question.page,
          section: question.section,
          skill: subpart.skill,
        },
      };
    });

    subpartResults.push(...subs);
    const marksEarned = subs.reduce((sum, s) => sum + s.marksEarned, 0);
    const marksMax = subs.reduce((sum, s) => sum + s.marksMax, 0);
    questionResults.push({
      number: question.number,
      id: question.id,
      prompt: question.prompt,
      context: question.context,
      lessonId: question.lessonId,
      lessonTitle: lesson.title,
      section: question.section,
      sectionLabel: SECTION_LABELS[question.section],
      page: question.page,
      difficulty: question.difficulty,
      marksEarned,
      marksMax,
      subparts: subs,
    });
  }

  const totalEarned = subpartResults.reduce((sum, s) => sum + s.marksEarned, 0);
  const totalMax = TOTAL_MARKS;
  const percentage = totalMax === 0 ? 0 : Math.round((totalEarned / totalMax) * 1000) / 10;

  const grammarSubs = subpartResults.filter((s) => s.source.section === "grammar");
  const spellingSubs = subpartResults.filter((s) => s.source.section === "spelling");

  const lessons: LessonBreakdown[] = ORDERED_LESSONS.map((lesson) => {
    const subs = subpartResults.filter((s) => s.source.lessonId === lesson.id);
    const grammar = subs.filter((s) => s.source.section === "grammar");
    const spelling = subs.filter((s) => s.source.section === "spelling");
    const sum = (list: SubpartResult[], key: "marksEarned" | "marksMax") =>
      list.reduce((total, item) => total + item[key], 0);
    const gEarned = sum(grammar, "marksEarned");
    const gMax = sum(grammar, "marksMax");
    const sEarned = sum(spelling, "marksEarned");
    const sMax = sum(spelling, "marksMax");
    return {
      lessonId: lesson.id,
      title: lesson.title,
      order: lesson.order,
      earned: gEarned + sEarned,
      max: gMax + sMax,
      percentage: gMax + sMax === 0 ? 0 : Math.round(((gEarned + sEarned) / (gMax + sMax)) * 1000) / 10,
      grammar: band(gEarned, gMax),
      spelling: band(sEarned, sMax),
    };
  });

  const skillStats = new Map<string, { earned: number; max: number; section: SectionId }>();
  for (const sub of subpartResults) {
    const key = sub.source.skill;
    const current = skillStats.get(key) ?? { earned: 0, max: 0, section: sub.source.section };
    current.earned += sub.marksEarned;
    current.max += sub.marksMax;
    skillStats.set(key, current);
  }
  const rankedSkills = [...skillStats.entries()]
    .map(([skill, stat]) => ({
      skill,
      earned: stat.earned,
      max: stat.max,
      percentage: stat.max ? Math.round((stat.earned / stat.max) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const incorrectCount = subpartResults.filter((s) => s.answered && !s.isCorrect).length;
  const unansweredCount = subpartResults.filter((s) => !s.answered).length;

  return {
    attempt,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalMax,
    percentage,
    correctCount: subpartResults.filter((s) => s.isCorrect).length,
    incorrectCount,
    unansweredCount,
    subpartCount: subpartResults.length,
    timeSeconds: Math.max(
      0,
      Math.floor(((attempt.submittedAt ?? Date.now()) - attempt.startedAt) / 1000),
    ),
    grammar: band(
      grammarSubs.reduce((sum, s) => sum + s.marksEarned, 0),
      grammarSubs.reduce((sum, s) => sum + s.marksMax, 0),
    ),
    spelling: band(
      spellingSubs.reduce((sum, s) => sum + s.marksEarned, 0),
      spellingSubs.reduce((sum, s) => sum + s.marksMax, 0),
    ),
    lessons,
    questions: questionResults,
    performance: performanceLevel(percentage),
    strengths: rankedSkills
      .filter((s) => s.percentage >= 80)
      .slice(0, 3)
      .map((s) => `${s.skill} (${s.percentage}٪)`),
    improvements: rankedSkills
      .filter((s) => s.percentage < 75)
      .slice(-4)
      .reverse()
      .map((s) => `${s.skill} (${s.percentage}٪)`),
  };
}

export function countAnsweredSubparts(answers: Record<string, string[]>): {
  answered: number;
  total: number;
  remaining: number;
} {
  const total = QUESTIONS.reduce((sum, question) => sum + question.subparts.length, 0);
  const answered = QUESTIONS.reduce(
    (sum, question) => sum + question.subparts.filter((s) => isAnswered(answers[s.id])).length,
    0,
  );
  return { answered, total, remaining: total - answered };
}

export function questionAnsweredCount(
  questionId: string,
  answers: Record<string, string[]>,
): { answered: number; total: number } {
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) return { answered: 0, total: 0 };
  return {
    answered: question.subparts.filter((s) => isAnswered(answers[s.id])).length,
    total: question.subparts.length,
  };
}

export function isExamComplete(answers: Record<string, string[]>): boolean {
  return countAnsweredSubparts(answers).remaining === 0;
}

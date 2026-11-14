import { QUESTIONS, type Branch } from "../data/questions";

// ============================================================
// أنواع الإجابات والتصحيح (مطابقة للأصل المرجعي تماماً)
// ============================================================
export type AnswerValue =
  | string // single_choice / true_false / fill_blank
  | string[] // multi_choice
  | Record<string, string>; // classify: itemId -> categoryId | match: pairId -> right

export type AnswersMap = Record<string, AnswerValue>;

export interface BranchGrade {
  maxPoints: number;
  earnedPoints: number;
  correct: boolean;
  partial: boolean;
  studentAnswerDisplay: string;
  correctAnswerDisplay: string;
}

export interface QuestionGrades {
  perQuestion: {
    question: (typeof QUESTIONS)[number];
    perBranch: { branch: Branch; grade: BranchGrade }[];
    totalEarned: number;
    totalMax: number;
  }[];
  finalScore: number;
  correctBranches: number;
  wrongBranches: number;
  partialBranches: number;
  unanswered: number;
}

export function normalize(s: string): string {
  return s
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
    .replace(/[ـ\s]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

export function displayChoiceLabel(branch: Branch, id: string): string {
  return branch.choices?.find((c) => c.id === id)?.text || id;
}

export function correctDisplay(branch: Branch): string {
  switch (branch.type) {
    case "single_choice":
    case "true_false":
      return displayChoiceLabel(branch, branch.correctChoiceId!);
    case "multi_choice":
      return (branch.correctChoiceIds || [])
        .map((id) => displayChoiceLabel(branch, id))
        .join("، ");
    case "fill_blank":
      return (branch.acceptedAnswers || []).join(" / ");
    case "classify":
      return (branch.items || [])
        .map((it) => {
          const cat = branch.categories?.find((c) => c.id === it.correctCategoryId);
          return `${it.text} ← ${cat?.label || it.correctCategoryId}`;
        })
        .join(" | ");
    case "match":
      return (branch.pairs || []).map((p) => `${p.left} ← ${p.right}`).join(" | ");
  }
}

export function evaluateBranch(
  branch: Branch,
  answer: AnswerValue | undefined,
): BranchGrade {
  const maxPts = branch.points;

  if (answer === undefined || answer === null || answer === "") {
    return {
      maxPoints: maxPts,
      earnedPoints: 0,
      correct: false,
      partial: false,
      studentAnswerDisplay: "(لم تُجب)",
      correctAnswerDisplay: correctDisplay(branch),
    };
  }

  switch (branch.type) {
    case "single_choice":
    case "true_false": {
      const chosen = answer as string;
      const correct = chosen === branch.correctChoiceId;
      return {
        maxPoints: maxPts,
        earnedPoints: correct ? maxPts : 0,
        correct,
        partial: false,
        studentAnswerDisplay: displayChoiceLabel(branch, chosen),
        correctAnswerDisplay: displayChoiceLabel(branch, branch.correctChoiceId!),
      };
    }
    case "multi_choice": {
      const chosen = (answer as string[]) || [];
      const correctSet = new Set(branch.correctChoiceIds || []);
      if (chosen.length === 0) {
        return {
          maxPoints: maxPts,
          earnedPoints: 0,
          correct: false,
          partial: false,
          studentAnswerDisplay: "(لم تُجب)",
          correctAnswerDisplay: (branch.correctChoiceIds || [])
            .map((id) => displayChoiceLabel(branch, id))
            .join("، "),
        };
      }
      const totalCorrect = correctSet.size;
      let truePositives = 0;
      let falsePositives = 0;
      chosen.forEach((id) => {
        if (correctSet.has(id)) truePositives++;
        else falsePositives++;
      });
      const allMatch = truePositives === totalCorrect && falsePositives === 0;
      let earned = 0;
      if (allMatch) {
        earned = maxPts;
      } else if (falsePositives === 0 && truePositives > 0) {
        earned = Math.round(((maxPts * truePositives) / totalCorrect) * 2) / 2;
      } else {
        earned = 0;
      }
      earned = Math.round(earned * 2) / 2;
      return {
        maxPoints: maxPts,
        earnedPoints: earned,
        correct: allMatch,
        partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay:
          chosen.map((id) => displayChoiceLabel(branch, id)).join("، ") || "(لم تُجب)",
        correctAnswerDisplay: (branch.correctChoiceIds || [])
          .map((id) => displayChoiceLabel(branch, id))
          .join("، "),
      };
    }
    case "fill_blank": {
      const given = (answer as string) || "";
      const accepted = branch.acceptedAnswers || [];
      const normGiven = normalize(given);
      if (!normGiven) {
        return {
          maxPoints: maxPts,
          earnedPoints: 0,
          correct: false,
          partial: false,
          studentAnswerDisplay: "(لم تُجب)",
          correctAnswerDisplay: accepted.join(" / "),
        };
      }
      const isCorrect = accepted.some((a) => normalize(a) === normGiven);
      let partialPts = 0;
      if (!isCorrect) {
        for (const a of accepted) {
          const aN = normalize(a);
          if (
            aN &&
            normGiven.includes(aN.slice(0, Math.max(3, aN.length - 1))) &&
            normGiven.length >= aN.length - 1
          ) {
            partialPts = Math.floor(maxPts / 2);
            break;
          }
        }
      }
      return {
        maxPoints: maxPts,
        earnedPoints: isCorrect ? maxPts : partialPts,
        correct: isCorrect,
        partial: !isCorrect && partialPts > 0,
        studentAnswerDisplay: given,
        correctAnswerDisplay: accepted.join(" / "),
      };
    }
    case "classify": {
      const given = answer as Record<string, string>;
      const items = branch.items || [];
      if (!given || Object.keys(given).length === 0) {
        return {
          maxPoints: maxPts,
          earnedPoints: 0,
          correct: false,
          partial: false,
          studentAnswerDisplay: "(لم تُجب)",
          correctAnswerDisplay: correctDisplay(branch),
        };
      }
      let correctCount = 0;
      const studentBits: string[] = [];
      items.forEach((it) => {
        const catId = given[it.id];
        const catLabel = branch.categories?.find((c) => c.id === catId)?.label || "—";
        studentBits.push(`${it.text} ← ${catLabel}`);
        if (catId === it.correctCategoryId) correctCount++;
      });
      const ratio = correctCount / items.length;
      const earned = Math.round(maxPts * ratio * 2) / 2;
      return {
        maxPoints: maxPts,
        earnedPoints: earned,
        correct: correctCount === items.length,
        partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay: studentBits.join(" | "),
        correctAnswerDisplay: correctDisplay(branch),
      };
    }
    case "match": {
      const given = answer as Record<string, string>;
      const pairs = branch.pairs || [];
      if (!given || Object.keys(given).length === 0) {
        return {
          maxPoints: maxPts,
          earnedPoints: 0,
          correct: false,
          partial: false,
          studentAnswerDisplay: "(لم تُجب)",
          correctAnswerDisplay: correctDisplay(branch),
        };
      }
      let correctCount = 0;
      const studentBits: string[] = [];
      pairs.forEach((p) => {
        const chosen = given[p.id];
        studentBits.push(`${p.left} ← ${chosen || "—"}`);
        if (chosen === p.right) correctCount++;
      });
      const ratio = correctCount / pairs.length;
      const earned = Math.round(maxPts * ratio * 2) / 2;
      return {
        maxPoints: maxPts,
        earnedPoints: earned,
        correct: correctCount === pairs.length,
        partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay: studentBits.join(" | "),
        correctAnswerDisplay: correctDisplay(branch),
      };
    }
  }
}

export function computeGrades(answers: AnswersMap): QuestionGrades {
  const perQuestion = QUESTIONS.map((q) => {
    const perBranch = q.branches.map((b) => {
      const g = evaluateBranch(b, answers[b.id]);
      return { branch: b, grade: g };
    });
    const totalEarned = perBranch.reduce((s, x) => s + x.grade.earnedPoints, 0);
    const totalMax = perBranch.reduce((s, x) => s + x.grade.maxPoints, 0);
    return { question: q, perBranch, totalEarned, totalMax };
  });
  const finalScore = perQuestion.reduce((s, x) => s + x.totalEarned, 0);
  const correctBranches = perQuestion.reduce(
    (s, q) => s + q.perBranch.filter((x) => x.grade.correct).length,
    0,
  );
  const wrongBranches = perQuestion.reduce(
    (s, q) =>
      s +
      q.perBranch.filter(
        (x) =>
          !x.grade.correct &&
          x.grade.earnedPoints === 0 &&
          x.grade.studentAnswerDisplay !== "(لم تُجب)",
      ).length,
    0,
  );
  const partialBranches = perQuestion.reduce(
    (s, q) => s + q.perBranch.filter((x) => x.grade.partial).length,
    0,
  );
  const unanswered = perQuestion.reduce(
    (s, q) =>
      s +
      q.perBranch.filter((x) => x.grade.studentAnswerDisplay === "(لم تُجب)").length,
    0,
  );
  return {
    perQuestion,
    finalScore,
    correctBranches,
    wrongBranches,
    partialBranches,
    unanswered,
  };
}

export function isBranchAnswered(b: Branch, a: AnswerValue | undefined): boolean {
  if (a === undefined || a === null) return false;
  switch (b.type) {
    case "single_choice":
    case "true_false":
      return typeof a === "string" && a.length > 0;
    case "multi_choice":
      return Array.isArray(a) && a.length > 0;
    case "fill_blank":
      return typeof a === "string" && a.trim().length > 0;
    case "classify": {
      const items = b.items || [];
      if (typeof a !== "object" || a === null) return false;
      return items.every((it) => !!(a as Record<string, string>)[it.id]);
    }
    case "match": {
      const pairs = b.pairs || [];
      if (typeof a !== "object" || a === null) return false;
      return pairs.every((p) => !!(a as Record<string, string>)[p.id]);
    }
  }
}

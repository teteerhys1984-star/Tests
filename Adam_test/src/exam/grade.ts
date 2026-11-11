import { ALL_SUBPARTS, QUESTIONS, questionMarks, TOTAL_MARKS } from "./data";
import type {
  Answers,
  Attempt,
  GradeResult,
  GradeStatus,
  Question,
  Subpart,
  SubpartGrade,
} from "./types";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) return String(a);
    return String(PERSIAN_DIGITS.indexOf(ch));
  });
}

export function normalizeNumeric(value: string): string {
  const normalized = normalizeDigits(value)
    .replace(/[,\u066C\u060C\s\u00A0]/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return "";
  const number = Number(normalized);
  return Number.isFinite(number) ? String(number) : "";
}

export function hasNumericAnswer(value: unknown): boolean {
  return typeof value === "string" && normalizeNumeric(value) !== "";
}

export function isSubpartAnswered(sub: Subpart, answer: unknown): boolean {
  switch (sub.kind) {
    case "mcq":
      return typeof answer === "number" && answer >= 0 && answer < sub.options.length;
    case "tf":
      return typeof answer === "boolean";
    case "numeric":
      return hasNumericAnswer(answer);
    case "pair":
      return (
        typeof answer === "object" &&
        answer !== null &&
        hasNumericAnswer((answer as { a?: unknown }).a) &&
        hasNumericAnswer((answer as { b?: unknown }).b)
      );
    case "multi":
      return (
        Array.isArray(answer) &&
        answer.length === sub.labels.length &&
        answer.every((v) => hasNumericAnswer(v))
      );
    case "order":
      return Array.isArray(answer) && answer.length === sub.items.length;
    case "compare":
      return answer === ">" || answer === "<" || answer === "=";
  }
}

export function countAnswered(answers: Answers): number {
  return ALL_SUBPARTS.filter((sub) => isSubpartAnswered(sub, answers[sub.id])).length;
}

export function unansweredSubparts(answers: Answers): Subpart[] {
  return ALL_SUBPARTS.filter((sub) => !isSubpartAnswered(sub, answers[sub.id]));
}

export function unansweredForQuestion(question: Question, answers: Answers): number {
  return question.subparts.filter((sub) => !isSubpartAnswered(sub, answers[sub.id])).length;
}

export function answeredForQuestion(question: Question, answers: Answers): number {
  return question.subparts.filter((sub) => isSubpartAnswered(sub, answers[sub.id])).length;
}

function numericMatches(value: unknown, expected: string, accepted?: string[]): boolean {
  if (!hasNumericAnswer(value)) return false;
  const v = Number(normalizeNumeric(value as string));
  const candidates = [expected, ...(accepted ?? [])];
  return candidates.some((candidate) => normalizeNumeric(candidate) !== "" && v === Number(normalizeNumeric(candidate)));
}

function shortAnswerText(value: unknown): string {
  if (value === undefined || value === null) return "— لم يجب —";
  if (typeof value === "boolean") return value ? "صواب" : "خطأ";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim() || "— لم يجب —";
  if (Array.isArray(value)) return value.map((v) => String(v).trim() || "—").join("، ");
  if (typeof value === "object" && "a" in value && "b" in value) {
    const pair = value as { a: string; b: string };
    return `(${pair.a?.trim() || "—"}، ${pair.b?.trim() || "—"})`;
  }
  return "— لم يجب —";
}

export function studentAnswerText(sub: Subpart, value: unknown): string {
  if (!isSubpartAnswered(sub, value)) {
    if (sub.kind === "numeric" && typeof value === "string" && value.trim()) {
      return `${value.trim()} (إجابة غير مكتملة)`;
    }
    return "— لم يجب —";
  }
  if (sub.kind === "mcq") {
    return sub.options[value as number] ?? "— لم يجب —";
  }
  return shortAnswerText(value);
}

export function correctAnswerText(sub: Subpart): string {
  switch (sub.kind) {
    case "mcq":
      return sub.options[sub.answer];
    case "tf":
      return sub.answer ? "صواب" : "خطأ";
    case "numeric":
      return sub.answer;
    case "pair":
      return `(${sub.answer[0]}، ${sub.answer[1]})`;
    case "multi":
      return sub.answer.join("، ");
    case "order":
      return sub.answer.join("، ");
    case "compare":
      return sub.answer;
  }
}

export function acceptedAnswersText(sub: Subpart): string {
  const items: string[] = [];
  if (sub.kind === "numeric") {
    items.push(sub.answer);
    (sub.accepted ?? []).forEach((a) => {
      if (a !== sub.answer) items.push(a);
    });
    return `يُقبل الشكل الرقمي نفسه بالأرقام الغربية أو العربية الشرقية، ومع الفواصل أو دونها: ${items.join(" / ")}`;
  }
  if (sub.kind === "pair") return "يُقبل الزوج بالإحداثيين نفسيهما مع مراعاة الترتيب: الأفقي أولاً ثم الشاقولي.";
  if (sub.kind === "multi") return "تُقبل القيم نفسها في الخانات المحددة، مع أو دون فواصل الآلاف.";
  if (sub.kind === "order") return "تُقبل الأعداد نفسها بالترتيب المطلوب فقط، مع أو دون فواصل الآلاف.";
  if (sub.kind === "compare") return "تُقبل الإشارة الصحيحة فقط: > أو < أو =.";
  if (sub.kind === "tf") return "تُقبل الإجابة صواب أو خطأ فقط.";
  return "تُقبل الخيارات المطابقة للمعنى نفسه والواردة ضمن الخيارات.";
}

export function partialRuleText(sub: Subpart): string {
  if (sub.partialRule) return sub.partialRule;
  if (sub.kind === "pair") {
    return sub.marks >= 2
      ? "درجة واحدة لكل إحداثي صحيح؛ إذا كان أحد الإحداثيين صحيحاً والآخر خاطئاً تُمنح درجة جزئية واحدة."
      : "الدرجة كاملة عند صحة الإحداثيين معاً، ولا تُمنح درجة جزئية.";
  }
  if (sub.kind === "multi") {
    const per = Math.floor(sub.marks / sub.labels.length);
    return per > 0
      ? `${per} درجة لكل خانة صحيحة، والدرجة كاملة عند صحة جميع الخانات.`
      : "الدرجة كاملة عند صحة جميع الخانات، ولا تُمنح درجة جزئية.";
  }
  return "الدرجة كاملة عند مطابقة الإجابة الصحيحة، ولا تُمنح درجة جزئية لهذا الجزء.";
}

function gradeFields(
  sub: Subpart,
  fields: { label: string; student: unknown; correct: string; isCorrect: boolean }[]
): number {
  const correctCount = fields.filter((f) => f.isCorrect).length;
  if (correctCount === fields.length) return sub.marks;
  if (sub.marks < 2 || fields.length < 2) return 0;
  const perField = Math.floor(sub.marks / fields.length);
  return Math.min(sub.marks - 1, perField * correctCount);
}

function gradeSubpart(sub: Subpart, value: unknown): { awarded: number; fields?: SubpartGrade["fields"] } {
  if (!isSubpartAnswered(sub, value)) return { awarded: 0 };
  switch (sub.kind) {
    case "mcq":
      return { awarded: value === sub.answer ? sub.marks : 0 };
    case "tf":
      return { awarded: value === sub.answer ? sub.marks : 0 };
    case "numeric":
      return { awarded: numericMatches(value, sub.answer, sub.accepted) ? sub.marks : 0 };
    case "compare":
      return { awarded: value === sub.answer ? sub.marks : 0 };
    case "order": {
      const student = value as string[];
      const ok =
        student.length === sub.answer.length &&
        student.every((item, index) => normalizeNumeric(item) === normalizeNumeric(sub.answer[index]));
      return { awarded: ok ? sub.marks : 0 };
    }
    case "pair": {
      const pair = value as { a: string; b: string };
      const fields = [
        {
          label: `${sub.labels[0]} (الأفقي)`,
          student: pair.a,
          correct: String(sub.answer[0]),
          isCorrect: numericMatches(pair.a, String(sub.answer[0])),
        },
        {
          label: `${sub.labels[1]} (الشاقولي)`,
          student: pair.b,
          correct: String(sub.answer[1]),
          isCorrect: numericMatches(pair.b, String(sub.answer[1])),
        },
      ];
      return { awarded: gradeFields(sub, fields), fields };
    }
    case "multi": {
      const student = value as string[];
      const fields = sub.labels.map((label, index) => ({
        label,
        student: student[index] ?? "",
        correct: sub.answer[index],
        isCorrect: numericMatches(student[index], sub.answer[index]),
      }));
      return { awarded: gradeFields(sub, fields), fields };
    }
  }
}

function statusFor(awarded: number, marks: number, answered: boolean): GradeStatus {
  if (!answered) return "unanswered";
  if (awarded >= marks) return "correct";
  if (awarded > 0) return "partial";
  return "incorrect";
}

export function gradeAttempt(attempt: Attempt): GradeResult {
  const questions = attempt.questionOrder
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));

  const result: GradeResult = {
    awarded: 0,
    total: TOTAL_MARKS,
    percentage: 0,
    counts: { correct: 0, partial: 0, incorrect: 0, unanswered: 0 },
    subparts: [],
    questions: [],
  };

  for (const question of questions) {
    let questionAwarded = 0;
    const grades: SubpartGrade[] = question.subparts.map((sub) => {
      const answer = attempt.answers[sub.id];
      const answered = isSubpartAnswered(sub, answer);
      const graded = gradeSubpart(sub, answer);
      questionAwarded += graded.awarded;
      const status = statusFor(graded.awarded, sub.marks, answered);
      result.counts[status] += 1;
      result.awarded += graded.awarded;
      const grade: SubpartGrade = {
        questionId: question.id,
        subpartId: sub.id,
        prompt: sub.prompt,
        kind: sub.kind,
        marks: sub.marks,
        awarded: graded.awarded,
        status,
        studentAnswer: studentAnswerText(sub, answer),
        correctAnswer: correctAnswerText(sub),
        explanation: sub.explanation,
        page: sub.page,
        accepted: acceptedAnswersText(sub),
        partialRule: partialRuleText(sub),
        fields: graded.fields,
      };
      result.subparts.push(grade);
      return grade;
    });
    result.questions.push({
      question,
      marks: questionMarks(question),
      awarded: questionAwarded,
      subparts: grades,
    });
  }

  result.percentage = result.total > 0 ? Math.round((result.awarded / result.total) * 100) : 0;
  return result;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatTimestamp(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} (UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(
    abs % 60
  )})`;
}

export function elapsedSeconds(attempt: Attempt, now: number = Date.now()): number {
  if (attempt.phase === "results" && attempt.durationSeconds !== undefined) return attempt.durationSeconds;
  if (attempt.submissionTime) return Math.max(0, Math.floor((attempt.submissionTime - attempt.startTime) / 1000));
  return Math.max(0, Math.floor((now - attempt.startTime) / 1000));
}

export function marksLabel(n: number): string {
  if (n === 1) return "درجة";
  if (n === 2) return "درجتان";
  return `${n} درجات`;
}

export function statusLabel(status: GradeStatus): string {
  switch (status) {
    case "correct":
      return "صحيحة";
    case "partial":
      return "جزئية";
    case "incorrect":
      return "خاطئة";
    case "unanswered":
      return "غير مجابة";
  }
}

export function sanitizeStudentName(name: string): string {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*\r\n\t]/g, " ")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_ .-]+|[_ .-]+$/g, "");
  return cleaned || "طالب";
}

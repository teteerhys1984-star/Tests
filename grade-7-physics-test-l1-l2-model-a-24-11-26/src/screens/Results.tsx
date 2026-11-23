/**
 * صفحة النتيجة — نفس تركيبة صفحة النتيجة في المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/ResultScreen.tsx):
 * بطاقة النتيجة المتدرجة باللون البرقوقي مع العلامة الكبيرة والنسبة،
 * صفّ إحصاءات الفروع، أزرار التنزيل والمحاولة الجديدة، ثم بطاقات تفاصيل
 * الأسئلة القابلة للطيّ (الإجابة النموذجية والمعايير والتفسير).
 *
 * أُضيف داخل الهوية نفسها: توزيع الدرسين مع بيان التداخل، وحالة الإرسال
 * إلى Google Sheets وزر إعادة الإرسال، وزر دليل المعلّم.
 */

import { useMemo, useState, type ReactElement } from "react";
import { CONTACT } from "../config";
import type { Question } from "../exam/types";
import type { ExamResult, InputResult, Responses, Rubric } from "../lib/grading";
import { lessonOverlap, lessonTotals, partLetter, partStatus, STATUS_AR } from "../lib/grading";
import { MixedText } from "../lib/mathx";
import {
  gradeLabel,
  inputLabel,
  modelAnswerText,
  summarize,
  triggerDownload,
  reportFilename,
  type AttemptMeta,
} from "../lib/report";
import type { SendStatus } from "../exam/submit";
import { formatDuration, formatDurationWords, formatLong, num, pct } from "../lib/time";
import { Figure } from "../exam/figures";
import { answerKey } from "../data/answerKey";
import { Button, Card } from "../components/ui";
import { cn } from "../utils/cn";

const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال نتيجتك إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed:
    "تعذّر إرسال النتيجة تلقائياً. حُفظت النتيجة محلياً وستُعاد المحاولة عند فتح الاختبار، ويمكنك إعادة إرسالها الآن أو تسليم ملف التقرير لمعلّمك.",
};

function Stat({
  icon,
  label,
  value,
  cls,
}: {
  icon: ReactElement;
  label: string;
  value: string | number;
  cls?: string;
}) {
  return (
    <div className="bg-white px-4 py-4 text-center">
      <span className={cn("mx-auto mb-1 block", cls ?? "text-plum-500")}>{icon}</span>
      <p className="tabular text-xl font-bold" dir="auto">
        {value}
      </p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

const STATUS_TEXT: Record<ReturnType<typeof partStatus>, string> = {
  correct: "text-mint-700",
  partial: "text-sun-600",
  wrong: "text-[#a9374b]",
  empty: "text-ink-faint",
};

const STATUS_DOT: Record<ReturnType<typeof partStatus>, string> = {
  correct: "bg-mint-500",
  partial: "bg-sun-600",
  wrong: "bg-coral-500",
  empty: "bg-ink-faint",
};

/** عرض نصّ الإجابة النموذجية (يحوي $...$) */
function ModelAnswer({ input, rubric }: { input: Question["parts"][number]["inputs"][number]; rubric: Rubric }) {
  const text = modelAnswerText(input, rubric);
  return <MixedText as="span" text={text} />;
}

function CriteriaList({ input }: { input: InputResult }) {
  if (!input.criteria.length && !input.rows?.length) return null;
  return (
    <ul className="mt-2 grid gap-1 rounded-xl bg-blush-50/60 p-2 text-xs leading-6">
      {input.criteria.map((criterion, index) => (
        <li key={index} className="flex items-start gap-1.5">
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", criterion.earned > 0 ? "bg-mint-500" : "bg-ink-faint")} />
          <span className={cn("flex-1", criterion.earned > 0 ? "text-mint-700" : "text-ink-faint")}>{criterion.label}</span>
          <span className="tabular shrink-0" dir="ltr">
            {num(criterion.earned)} / {num(criterion.marks)}
          </span>
        </li>
      ))}
      {(input.rows ?? []).map((row, index) => (
        <li key={`r${index}`} className="flex items-start gap-1.5">
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", row.earned > 0 ? "bg-mint-500" : "bg-coral-500")} />
          <span className="flex-1">
            {row.label}: <b>{row.student}</b>
            {row.earned === 0 && <span className="text-ink-soft"> — الصحيح: {row.correct}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Results({
  meta,
  questions,
  answers,
  result,
  reportText,
  autoDownloaded,
  sendStatus,
  onResend,
  onRetry,
  onTeacher,
  muted,
  onToggleMute,
}: {
  meta: AttemptMeta;
  questions: Question[];
  answers: Responses;
  result: ExamResult;
  reportText: string;
  autoDownloaded: boolean | null;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetry: () => void;
  onTeacher: () => void;
  muted: boolean;
  onToggleMute: () => void;
}): ReactElement {
  const summary = useMemo(() => summarize(questions, answers, result), [questions, answers, result]);
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(questions.map((question) => [question.id, true])));
  const allOpen = questions.every((question) => open[question.id] !== false);
  const filename = reportFilename(meta.studentName);
  const lessons = useMemo(() => lessonTotals(questions, result), [questions, result]);
  const overlap = useMemo(() => lessonOverlap(questions, result), [questions, result]);
  const partStats = useMemo(() => {
    const parts = result.questions.flatMap((question) => question.parts);
    return {
      correct: parts.filter((part) => part.possible > 0 && part.earned >= part.possible).length,
      partial: parts.filter((part) => part.earned > 0 && part.earned < part.possible).length,
      wrong: parts.filter((part) => part.earned === 0).length,
    };
  }, [result]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
      {/* ===== بطاقة النتيجة ===== */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-l from-plum-700 via-plum-600 to-blush-500 p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm opacity-90">نتيجة الطالبة</p>
            <h1 className="text-2xl font-bold">{meta.studentName}</h1>
            <p className="mt-1 text-sm opacity-90">اختبار الفيزياء — الصف السابع — النموذج A</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:text-end">
            <p className="tabular text-5xl font-bold" dir="ltr">
              {num(summary.total)}
              <span className="text-xl font-semibold opacity-80"> / {num(summary.max)}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 opacity-95 sm:justify-end">
              <AwardIcon />
              النسبة المئوية: <span className="tabular">{pct(summary.percentage, Number.isInteger(summary.percentage) ? 0 : 1)}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-blush-100 sm:grid-cols-4">
          <Stat icon={<ClockIcon />} label="الوقت المستغرق" value={formatDuration(meta.elapsedMs)} />
          <Stat icon={<CircleCheckIcon />} label="فروع صحيحة كلياً" value={partStats.correct} cls="text-mint-500" />
          <Stat icon={<CircleMinusIcon />} label="فروع بعلامة جزئية" value={partStats.partial} cls="text-sun-600" />
          <Stat icon={<CircleXIcon />} label="فروع خاطئة" value={partStats.wrong} cls="text-coral-500" />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-blush-100 bg-white px-4 py-2.5 text-xs leading-6 text-ink-soft">
          <span className="rounded-full bg-lilac-100 px-2.5 py-0.5 font-semibold text-plum-700">
            النسبة: <b>{pct(summary.percentage, Number.isInteger(summary.percentage) ? 0 : 1)}</b>
          </span>
          <span className="rounded-full bg-lilac-100 px-2.5 py-0.5 font-semibold text-plum-700">
            التقدير: <b>{gradeLabel(summary.percentage)}</b>
          </span>
          {sendStatus !== "idle" && (
            <p
              className="flex flex-wrap items-center gap-2"
              role="status"
              aria-live="polite"
              data-send-status={sendStatus}
            >
              <span className="font-semibold text-ink">{SEND_TEXT[sendStatus]}</span>
              {sendStatus === "failed" && (
                <Button variant="secondary" size="sm" onClick={onResend} data-action="resend-result">
                  إعادة إرسال النتيجة
                </Button>
              )}
            </p>
          )}
          {autoDownloaded !== null && (
            <p role="status" aria-live="polite">
              {autoDownloaded ? (
                <>
                  <b>✓ بدأ تنزيل التقرير تلقائياً</b> باسم <span dir="ltr">{filename}</span>. إن لم يظهر الملف فراجعي مجلد
                  التنزيلات أو استخدمي زر التنزيل أدناه.
                </>
              ) : (
                <>
                  <b>! منع المتصفح التنزيل التلقائي</b> — استخدمي زر «تنزيل التقرير (TXT)» أدناه لتنزيل الملف نفسه.
                </>
              )}
            </p>
          )}
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => triggerDownload(reportText, filename)} data-action="download-report">
          <DownloadIcon />
          تنزيل التقرير (TXT)
        </Button>
        <Button variant="secondary" onClick={onRetry} data-action="retry-exam">
          <RotateIcon />
          محاولة جديدة
        </Button>
        <Button variant="ghost" onClick={onTeacher} data-action="open-teacher-results">
          دليل المعلّم
        </Button>
        <button
          type="button"
          onClick={onToggleMute}
          className="ms-auto flex cursor-pointer items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
          data-action="toggle-sound"
        >
          {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
          الصوت: {muted ? "مكتوم" : "مفعّل"}
        </button>
      </div>

      {/* ===== تفاصيل الأسئلة ===== */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">تفاصيل الأسئلة</h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen(Object.fromEntries(questions.map((question) => [question.id, !allOpen])))}>
          {allOpen ? "طي الكل" : "عرض الكل"}
        </Button>
      </div>

      <div className="mt-3 space-y-4">
        {questions.map((question, index) => {
          const graded = result.questions[index];
          const isOpen = open[question.id] !== false;
          const ratio = graded.possible ? graded.earned / graded.possible : 0;
          const qtone: ReturnType<typeof partStatus> = ratio >= 0.999 ? "correct" : ratio > 0 ? "partial" : "wrong";
          return (
            <Card key={question.id} data-result-question={question.id}>
              <button
                type="button"
                onClick={() => setOpen((state) => ({ ...state, [question.id]: !isOpen }))}
                className="flex w-full cursor-pointer items-center gap-3 p-4 text-start"
                aria-expanded={isOpen}
              >
                <span className="rounded-xl bg-lilac-100 px-3 py-1.5 text-sm font-bold text-plum-700">السؤال {num(index + 1)}</span>
                <span className="min-w-0 flex-1 font-semibold leading-6">{question.title}</span>
                <span className={cn("tabular text-sm font-bold", STATUS_TEXT[qtone])} dir="ltr">
                  {num(graded.earned)} / {num(graded.possible)}
                </span>
                <ChevronDownIcon isOpen={isOpen} />
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-blush-100 p-4 sm:p-6">
                  <p className="text-sm leading-7 text-ink-soft">
                    <MixedText as="span" text={question.intro} />
                  </p>
                  {question.table && (
                    <div className="overflow-hidden rounded-2xl border border-blush-100">
                      <table className="w-full text-sm">
                        <thead className="bg-lilac-100/70">
                          <tr>
                            {question.table.head.map((head, headIndex) => (
                              <th key={headIndex} className="px-2 py-2 text-start font-semibold sm:px-3">
                                <MixedText as="span" text={head} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {question.table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 ? "bg-white" : "bg-blush-50/50"}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-2 py-2 sm:px-3">
                                  {cellIndex === 0 ? <MixedText as="span" text={cell} /> : <span dir="ltr">{cell}</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {question.figure && (
                    <div className="mt-4">
                      <Figure type={question.figure} variant="question" />
                    </div>
                  )}

                  {graded.parts.map((partResult, partIndex) => {
                    const part = question.parts[partIndex];
                    if (!part) return null;
                    const ptone: ReturnType<typeof partStatus> =
                      partResult.earned >= partResult.possible ? "correct" : partResult.earned > 0 ? "partial" : "wrong";
                    return (
                      <div
                        key={part.id}
                        className="rounded-2xl bg-blush-50/60 p-4"
                        data-result-part={part.id}
                        data-part-earned={partResult.earned}
                        data-part-possible={partResult.possible}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lilac-100 text-sm font-bold text-plum-700">
                            {partLetter(partIndex)}
                          </span>
                          <p className="flex-1 leading-7">
                            <MixedText as="span" text={part.label} />
                          </p>
                          <span className={cn("tabular shrink-0 text-sm font-bold", STATUS_TEXT[ptone])} dir="ltr">
                            {num(partResult.earned)} / {num(partResult.possible)}
                          </span>
                        </div>
                        {part.figure && <Figure type={part.figure} variant="part" />}
                        {part.inputs.map((input) => {
                          const gradedInput = graded.inputs.find((item) => item.inputId === input.id);
                          if (!gradedInput) return null;
                          const rubric = rubricOf(input.id, question);
                          const itone = partStatus(gradedInput.earned, gradedInput.possible, !!gradedInput.response.trim());
                          return (
                            <div key={input.id} className="mt-3 rounded-xl border border-blush-100 bg-white p-3" data-result-input={input.id}>
                              {input.prompt && (
                                <p className="mb-1 text-sm font-medium">
                                  <MixedText as="span" text={inputLabel(input)} />
                                </p>
                              )}
                              {input.kind === "tf" && (
                                <p className="mb-1 text-sm leading-7">
                                  <MixedText as="span" text={input.statement} />
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[itone])} />
                                <span className={cn("text-xs font-semibold", STATUS_TEXT[itone])}>{STATUS_AR[itone]}</span>
                                <span className="tabular ms-auto text-sm font-bold" dir="ltr">
                                  {num(gradedInput.earned)} / {num(gradedInput.possible)}
                                </span>
                              </div>
                              <div className="mt-2 flex items-start gap-2 text-sm leading-7">
                                <span className="shrink-0 rounded-full bg-lilac-100 px-2.5 py-0.5 text-xs font-semibold text-plum-700">إجابتك</span>
                                <span className="min-w-0 flex-1 break-words" dir="auto">
                                  {gradedInput.response.trim() ? gradedInput.response : <span className="text-ink-faint">—</span>}
                                </span>
                              </div>
                              {rubric && (
                                <div className="mt-2 flex items-start gap-2 text-sm leading-7">
                                  <span className="shrink-0 rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-semibold text-mint-700">الإجابة النموذجية</span>
                                  <span className="min-w-0 flex-1 break-words">
                                    <ModelAnswer input={input} rubric={rubric} />
                                  </span>
                                </div>
                              )}
                              <CriteriaList input={gradedInput} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  <div className="rounded-2xl bg-lilac-100/60 p-4 text-sm leading-7">
                    <p className="font-semibold">تفسير الحل الصحيح:</p>
                    <p>
                      <MixedText as="span" text={questionExplanation(question.id)} />
                    </p>
                    {answerKey[question.id]?.solution?.length ? (
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-ink-soft">
                        {(answerKey[question.id]?.solution ?? []).map((step, stepIndex) => (
                          <li key={stepIndex}>
                            <MixedText as="span" text={step} />
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                  <p className="text-xs leading-6 text-ink-soft">
                    <b>المرجع:</b> {question.lesson} — ص {question.pages} — المهارة: {question.skill}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ===== الملخّص وتوزيع الدرسين ===== */}
      <Card className="mt-5 p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-bold">ملخّص النتيجة</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "أسئلة صحيحة بالكامل", value: summary.fullQuestions, tone: "text-mint-700" },
            { label: "أسئلة صحيحة جزئياً", value: summary.partialQuestions, tone: "text-sun-600" },
            { label: "أسئلة خاطئة", value: summary.wrongQuestions, tone: "text-[#a9374b]" },
            { label: "فروع لم يُجب عنها", value: summary.unansweredSubparts, tone: "text-ink-soft" },
            { label: "فروع صحيحة", value: summary.correctSubparts, tone: "text-mint-700" },
            { label: "فروع بعلامة جزئية", value: summary.partialSubparts, tone: "text-peach-500" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-blush-100 bg-blush-50/50 p-2.5 text-center">
              <div className={cn("tabular text-xl font-bold leading-none", item.tone)}>{num(item.value)}</div>
              <div className="mt-1 text-xs leading-5 text-ink-soft">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {[
            { label: "بداية الاختبار", value: formatLong(meta.startAt) },
            { label: "تسليم الاختبار", value: formatLong(meta.submitAt) },
            { label: "المدة المنقضية", value: `${formatDuration(meta.elapsedMs)} — ${formatDurationWords(meta.elapsedMs)}` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-blush-100 bg-blush-50/50 p-2.5">
              <p className="text-xs font-semibold text-ink-soft">{item.label}</p>
              <p className="tabular mt-0.5 text-sm font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4" data-lesson-breakdown>
          <p className="mb-1.5 text-sm font-semibold text-ink-soft">توزيع العلامات على الدرسين (درسان فقط — لا فئة ثالثة)</p>
          <ul className="grid gap-1.5">
            {lessons.map((row) => (
              <li
                key={row.lesson}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blush-100 bg-blush-50/50 p-2.5 text-sm"
                data-lesson={row.lesson}
              >
                <span className="font-semibold">
                  {row.lesson}
                  <span className="ms-1.5 text-xs font-normal text-ink-faint">({num(row.questions)} أسئلة)</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {row.sharedQuestions > 0 && (
                    <span className="tabular rounded-full bg-sun-100 px-3 py-1 text-xs font-semibold text-sun-600" title="حصّة السؤال التركيبي المضافة إلى هذا الدرس">
                      منها تركيبي: {num(row.sharedEarned)}/{num(row.sharedPossible)}
                    </span>
                  )}
                  <span className="tabular rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-700">
                    {num(row.earned)}/{num(row.possible)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 rounded-xl bg-sun-100/70 p-2 text-xs leading-6 text-sun-600">
            مجموع الدرسين أعلاه <b className="tabular">{num(overlap.possible)}</b> علامة وليس{" "}
            <b className="tabular">{num(overlap.examPossible)}</b>: السؤال التركيبي (السؤال {num(questions.length)}) يُحتسب في
            الدرسين معاً، فتظهر <b className="tabular">{num(overlap.sharedPossible)}</b> علامة مرتين. مجموع الاختبار الحقيقي
            ومقام النسبة والتقدير هو <b className="tabular">{num(overlap.examTotal)} / {num(overlap.examPossible)}</b> فقط.
          </p>
        </div>
      </Card>

      <section className="mt-5 rounded-card border border-blush-100/70 bg-white/80 p-4 text-center text-sm shadow-card">
        <p className="font-semibold">
          {CONTACT.name}: <span className="tabular" dir="ltr">{CONTACT.phone}</span> ·{" "}
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint-700 underline decoration-dotted underline-offset-4"
          >
            واتساب
          </a>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          التقرير مُنشأ داخل متصفحك بصيغة TXT، وتُرسَل نسخة من نتيجتك وإجاباتك إلى معلّمك عند التسليم.
        </p>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* أيقونات محلية — بديل لأيقونات lucide في المصدر (بلا اعتمادية إضافية)  */
/* ------------------------------------------------------------------ */

function AwardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </svg>
  );
}

function ClockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CircleCheckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function CircleMinusIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

function CircleXIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function DownloadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </svg>
  );
}

function RotateIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function ChevronDownIcon({ isOpen, size = 20 }: { isOpen: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0 text-ink-soft transition-transform", isOpen && "rotate-180")}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function VolumeOnIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VolumeOffIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* الجسر إلى مفتاح الإجابات — يُستعمل بعد التسليم فقط                   */
/* ------------------------------------------------------------------ */

function rubricOf(inputId: string, question: Question): Rubric | null {
  return answerKey[question.id]?.rubric[inputId] ?? null;
}

function questionExplanation(questionId: string): string {
  return answerKey[questionId]?.explanation ?? "";
}

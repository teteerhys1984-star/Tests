import { EXAM_TITLE } from "../exam/data";
import type { Attempt } from "../exam/attempt";
import {
  formatDateTime,
  formatDuration,
  marksWord,
  statusArabic,
  type GradeResult,
  type PartResult,
} from "../exam/grade";
import type { SendStatus } from "../exam/submit";
import { BrandBar, CheckIcon, ArrowIcon } from "./Layout";
import { MathText } from "./MathText";
import { AppleMark, FloralDivider, MirrorCrest, TinySparkle } from "./Ornaments";
import { DownloadIcon, RefreshIcon } from "./Icons";

interface ResultsProps {
  attempt: Attempt;
  result: GradeResult;
  elapsed: string;
  onDownloadReport: () => void;
  onTryAgain: () => void;
  reportError: string | null;
  sendStatus: SendStatus;
  onResend: () => void;
}

const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال نتيجتك إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed: "تعذّر إرسال النتيجة تلقائيًا. حمّل ملف التقرير وأرسله لمعلّمك.",
};

/** Delivery state of this result — the same wording and the same three states as the other exams. */
function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;
  const tone =
    status === "success"
      ? "send-banner-success"
      : status === "failed"
        ? "send-banner-failed"
        : "";
  return (
    <div
      className={`send-banner ${tone}`}
      role="status"
      aria-live="polite"
      data-send-status={status}
    >
      <span className="send-banner-mark" aria-hidden="true">
        {status === "sending" ? "⋯" : status === "success" ? "✓" : "!"}
      </span>
      <div className="send-banner-body">
        <p>{SEND_TEXT[status]}</p>
        {status === "failed" ? (
          <button type="button" className="btn btn-secondary" onClick={onResend}>
            <RefreshIcon className="h-4 w-4" />
            إعادة إرسال النتيجة
          </button>
        ) : null}
      </div>
    </div>
  );
}

function statusClass(status: PartResult["status"]): string {
  if (status === "correct") return "status-correct";
  if (status === "partial") return "status-partial";
  if (status === "incorrect") return "status-incorrect";
  return "status-unanswered";
}

export function Results({
  attempt,
  result,
  elapsed,
  onDownloadReport,
  onTryAgain,
  reportError,
  sendStatus,
  onResend,
}: ResultsProps) {
  const submittedAt = attempt.submittedAt ?? Date.now();
  const durationMs = Math.max(0, submittedAt - attempt.startTimestamp);
  const percentage = result.percentage;
  const scoreLabel = `${result.score} / ${result.totalMarks}`;

  return (
    <>
      <BrandBar
        rightSlot={
          <span className="chip chip-lavender">
            <CheckIcon className="h-3.5 w-3.5" />
            تم التسليم
          </span>
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <section className="surface relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#e9cfda] via-[#c1a05e] to-[#d8d0e9]" />
          <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[#f2e7f7] blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-[#fbedf2] blur-3xl" />

          <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-gold">
                  <TinySparkle className="h-3.5 w-3.5" />
                  نتيجة رسمية
                </span>
                <span className="chip chip-lavender">تقرير محلي</span>
              </div>
              <p className="eyebrow mt-4">اكتملت المحاولة</p>
              <h1 className="display-title mt-1 text-4xl font-bold leading-tight text-[#402334] sm:text-5xl">
                {EXAM_TITLE}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#8a5d70]">
                اختبار الرياضيات · الصف السادس الأساسي
              </p>

              <FloralDivider className="mt-3 max-w-sm" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e8d5de] bg-[#fffaf8] p-4">
                  <p className="text-[0.72rem] font-bold text-[#8b6e7c]">اسم الطالب</p>
                  <p className="mt-1 break-words text-xl font-extrabold text-[#4b2c3d]">
                    {attempt.studentName}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3d8ec] bg-[#fbf9fd] p-4">
                  <p className="text-[0.72rem] font-bold text-[#807092]">معرّف المحاولة</p>
                  <p className="num mt-1 break-all text-[0.75rem] font-semibold text-[#625670]" dir="ltr">
                    {attempt.attemptId}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={onDownloadReport}>
                  <DownloadIcon className="h-4 w-4" />
                  تنزيل التقرير TXT
                </button>
                <button type="button" className="btn btn-secondary" onClick={onTryAgain}>
                  <RefreshIcon className="h-4 w-4" />
                  إعادة المحاولة
                </button>
              </div>
              <p className="mt-2 max-w-xl text-[0.71rem] leading-6 text-[#8b7480]">
                أُعدّ التقرير محلياً داخل المتصفح، وتُرسَل نتيجتك إلى معلّمك عند التسليم.
              </p>
              {reportError ? (
                <div className="warning-box mt-3" role="alert">
                  <strong>تعذّر إنشاء ملف التقرير:</strong> {reportError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#ead7df] bg-gradient-to-b from-[#fffdfb] to-[#fbf3f7] p-5">
              <div className="flex items-center gap-2">
                <AppleMark size={30} />
                <p className="display-title text-lg font-bold text-[#513043]">حصيلة ميا</p>
              </div>
              <div
                className="flex h-44 w-44 items-center justify-center rounded-full p-2.5 shadow-inner"
                style={{
                  background: `conic-gradient(#9c4a65 ${Math.min(
                    100,
                    Math.max(0, percentage)
                  )}%, #eee2e8 0)`,
                }}
                aria-label={`النسبة المئوية ${percentage}%`}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#f0e2e8] bg-[#fffdfb]">
                  <span className="num text-4xl font-extrabold text-[#7f3e55]">
                    {result.score}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold text-[#8c7480]">
                    من <span className="num">{result.totalMarks}</span> علامة
                  </span>
                  <span className="num mt-1 rounded-full bg-[#f8ecf1] px-2 py-0.5 text-xs font-bold text-[#8b4059]">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full rounded-xl border border-[#eadde5] bg-white/70 px-3 py-2 text-center">
                <p className="text-[0.7rem] text-[#8c7480]">مدة الاختبار</p>
                <p className="timer-box mt-1 justify-center !border-0 !bg-transparent !p-0 text-base">
                  {elapsed}
                </p>
              </div>
              <MirrorCrest className="h-20 w-auto opacity-90" />
            </div>
          </div>
        </section>

        <div className="mt-5">
          <SendBanner status={sendStatus} onResend={onResend} />
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "أجزاء صحيحة",
              value: result.correct,
              tone: "border-[#c7d8c0] bg-[#f3f8f0] text-[#506b49]",
            },
            {
              label: "صحيحة جزئياً",
              value: result.partial,
              tone: "border-[#e4d1aa] bg-[#fcf7ec] text-[#7a6030]",
            },
            {
              label: "أجزاء خاطئة",
              value: result.incorrect,
              tone: "border-[#e5c3cc] bg-[#fcf0f3] text-[#873f51]",
            },
            {
              label: "دون إجابة",
              value: result.unanswered,
              tone: "border-[#dad2e3] bg-[#f7f4fa] text-[#635770]",
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 text-center ${item.tone}`}>
              <p className="num text-2xl font-extrabold">{item.value}</p>
              <p className="mt-0.5 text-[0.72rem] font-bold">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="surface mt-5 p-5 sm:p-6">
          <h2 className="display-title text-xl font-bold text-[#4a2b3d]">بيانات المحاولة</h2>
          <div className="mt-3 grid gap-2.5 text-[0.82rem] sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#ecdfe5] bg-[#fffbf9] p-3">
              <p className="text-[0.68rem] font-semibold text-[#967e8a]">بدء الاختبار</p>
              <p className="num mt-1 text-[0.76rem] font-bold text-[#513743]" dir="ltr">
                {formatDateTime(attempt.startTimestamp)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ecdfe5] bg-[#fffbf9] p-3">
              <p className="text-[0.68rem] font-semibold text-[#967e8a]">وقت التسليم</p>
              <p className="num mt-1 text-[0.76rem] font-bold text-[#513743]" dir="ltr">
                {formatDateTime(submittedAt)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ecdfe5] bg-[#fffbf9] p-3">
              <p className="text-[0.68rem] font-semibold text-[#967e8a]">المدة الزمنية</p>
              <p className="num mt-1 text-[0.76rem] font-bold text-[#513743]" dir="ltr">
                {formatDuration(durationMs)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ecdfe5] bg-[#fffbf9] p-3">
              <p className="text-[0.68rem] font-semibold text-[#967e8a]">الأجزاء المُجابة</p>
              <p className="num mt-1 text-[0.76rem] font-bold text-[#513743]">
                {result.answeredParts} / {result.totalParts}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[0.76rem] leading-6 text-[#816a76]">
            الدرجة النهائية: <strong className="text-[#7d3d55]">{scoreLabel}</strong> — النسبة
            المئوية: <strong className="text-[#7d3d55]">{percentage}%</strong>. يظهر أدناه تصحيح
            تفصيلي لكل سؤال وجزء مع الإجابة الصحيحة والشرح.
          </p>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">بعد التسليم</p>
              <h2 className="display-title text-2xl font-bold text-[#442839]">
                مراجعة تفصيلية للإجابات
              </h2>
            </div>
            <p className="text-[0.73rem] text-[#876f7b]">
              افتح أي سؤال لعرض التصحيح والشرح.
            </p>
          </div>

          <div className="space-y-3">
            {result.questions.map((questionResult) => {
              const question = questionResult.question;
              const overall =
                questionResult.awarded === questionResult.max
                  ? "status-correct"
                  : questionResult.awarded > 0
                    ? "status-partial"
                    : "status-incorrect";
              return (
                <details key={question.id} className="review-details surface overflow-hidden">
                  <summary className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e2ccd6] bg-[#fbf2f6] text-xs font-extrabold text-[#81445a]">
                        {questionResult.position}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#4a2f3e]">
                          <MathText text={question.title} />
                        </p>
                        <p className="mt-0.5 text-[0.69rem] text-[#8b7380]">
                          {question.topic} · {marksWord(questionResult.max)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 ps-11 sm:ps-0">
                      <span className="num rounded-lg border border-[#e5d7de] bg-white px-2 py-0.5 text-[0.72rem] font-bold text-[#6f5260]">
                        {questionResult.awarded} / {questionResult.max}
                      </span>
                      <span className={`status-chip ${overall}`}>
                        {questionResult.awarded === questionResult.max
                          ? "كامل العلامة"
                          : questionResult.awarded > 0
                            ? "علامة جزئية"
                            : "دون علامة"}
                      </span>
                      <span className="text-[#a58b98]" aria-hidden="true">⌄</span>
                    </div>
                  </summary>

                  <div className="border-t border-[#eee2e8] px-4 py-4 sm:px-5">
                    <div className="space-y-3.5">
                      {question.parts.map((part) => {
                        const partResult = questionResult.parts.find(
                          (resultPart) => resultPart.partId === part.id
                        );
                        if (!partResult) return null;
                        return (
                          <div key={part.id} className="part-card">
                            <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="part-badge">{part.label}</span>
                                <div className="pt-0.5 text-[0.87rem] font-semibold leading-7 text-[#4b3340]">
                                  <MathText text={part.prompt} />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="mark-pill">{marksWord(part.marks)}</span>
                                <span className={`status-chip ${statusClass(partResult.status)}`}>
                                  {statusArabic(partResult.status)}
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="answer-review answer-given">
                                <p className="text-[0.65rem] font-bold text-[#8e717f]">إجابة الطالب</p>
                                <p className="mt-1 text-[0.82rem] leading-7 text-[#503844]">
                                  {partResult.answered ? (
                                    <MathText text={partResult.givenText} />
                                  ) : (
                                    <span className="text-[#977f8b]">لم تتم الإجابة</span>
                                  )}
                                </p>
                              </div>
                              <div className="answer-review answer-correct">
                                <p className="text-[0.65rem] font-bold text-[#6d8067]">الإجابة الصحيحة</p>
                                <p className="mt-1 text-[0.82rem] font-semibold leading-7 text-[#3f543b]">
                                  <MathText text={partResult.correctText} />
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 rounded-lg border border-[#e8dde3] bg-[#fffcf9] px-3 py-2">
                              <p className="text-[0.65rem] font-bold text-[#8b6f7d]">الشرح</p>
                              <p className="mt-1 text-[0.8rem] leading-7 text-[#5d4652]">
                                <MathText text={part.explanation} />
                              </p>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[0.68rem] font-semibold text-[#8a7380]">
                              <span>
                                العلامات:{" "}
                                <strong className="num text-[#6f4658]">
                                  {partResult.awarded} / {partResult.max}
                                </strong>
                              </span>
                              {part.partialRule ? <span>{part.partialRule}</span> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="surface mt-6 overflow-hidden">
          <div className="h-1 bg-gradient-to-l from-[#e8ccd8] via-[#c1a05e] to-[#d8d0e9]" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#4c2d3f]">نسخة احتياطية من التقرير</h2>
              <p className="mt-1 max-w-xl text-[0.77rem] leading-6 text-[#816a76]">
                احتفظ بملف التقرير ليتضمن الأسئلة والإجابات والتصحيح والدرجات، مع بيانات
                التدقيق المخصصة للمعلم. يتضمن اسم الملف اسم الطالب في نهايته.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-primary" onClick={onDownloadReport}>
                <DownloadIcon className="h-4 w-4" />
                تنزيل التقرير TXT
              </button>
              <button type="button" className="btn btn-secondary" onClick={onTryAgain}>
                <ArrowIcon direction="left" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-2xl border border-[#eadde4] bg-[rgba(255,251,248,0.8)] p-4 text-center text-[0.72rem] leading-6 text-[#8c7480]">
          التقرير النصي المصدّر مخصص للطالب وولي الأمر والمعلم، ويتضمن بيانات التدقيق اللازمة
          للمراجعة. لا يظهر أي رمز سري أو كلمة مرور داخل التقرير.
        </div>
      </main>
    </>
  );
}

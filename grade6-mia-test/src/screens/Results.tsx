import type { ExamResult, SubpartStatus } from "../types";
import { EXAM_TITLE, TOTAL_MARKS, questions } from "../data/questions";
import { formatDuration, formatTimestamp, reportFilename } from "../lib/exam";
import type { SendStatus } from "../lib/submit";
import { questions as bank } from "../data/questions";
import { RichText } from "../components/RichText";
import { ContactBlock } from "../components/Chrome";
import {
  IconCheck,
  IconClock,
  IconDownload,
  IconList,
  IconRestart,
  IconSparkle,
  IconTrophy,
  IconX,
} from "../components/Icons";

const STATUS_LABEL: Record<SubpartStatus, string> = {
  correct: "صحيحة",
  partial: "صحيحة جزئياً",
  incorrect: "خاطئة",
  unanswered: "دون إجابة",
};

const STATUS_CLASS: Record<SubpartStatus, string> = {
  correct: "status-correct",
  partial: "status-partial",
  incorrect: "status-incorrect",
  unanswered: "status-unanswered",
};

function AnswerDisplay({ subpartId, display }: { subpartId: string; display: string }) {
  const subpart = bank.flatMap((q) => q.subparts).find((sp) => sp.id === subpartId);
  if (display.includes("$")) {
    return (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        <RichText>{display}</RichText>
      </span>
    );
  }
  if (subpart?.type === "ordering") return <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
}

function StatusPill({ status }: { status: SubpartStatus }) {
  return (
    <span className={`status-pill ${STATUS_CLASS[status]}`}>
      {status === "correct" ? <IconCheck size={12} /> : null}
      {status === "incorrect" ? <IconX size={11} /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
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
    status === "success" ? "notice-success" : status === "failed" ? "notice-danger" : "notice-info";
  return (
    <div
      className={`notice ${tone} send-banner mt-3`}
      role="status"
      aria-live="polite"
      data-send-status={status}
    >
      <span aria-hidden="true">{status === "sending" ? "⋯" : status === "success" ? "✓" : "!"}</span>
      <div className="send-banner-body">
        <p className="m-0">{SEND_TEXT[status]}</p>
        {status === "failed" ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onResend}>
            <IconRestart size={14} />
            إعادة إرسال النتيجة
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Results({
  result,
  onDownload,
  onTryAgain,
  reportIssue,
  fileValidated,
  sendStatus,
  onResend,
}: {
  result: ExamResult;
  onDownload: () => void;
  onTryAgain: () => void;
  reportIssue: string | null;
  fileValidated: boolean;
  sendStatus: SendStatus;
  onResend: () => void;
}) {
  const grouped = new Map<number, ExamResult["subparts"]>();
  result.subparts.forEach((s) => {
    const arr = grouped.get(s.questionId) ?? [];
    arr.push(s);
    grouped.set(s.questionId, arr);
  });
  const percentage = Math.max(0, Math.min(100, result.percentage));
  const circumference = 2 * Math.PI * 74;
  const dash = (percentage / 100) * circumference;
  const totalSubparts = result.subparts.length;
  const totalQuestions = result.questionOrder.length;

  return (
    <main className="shell-narrow screen-enter py-4">
      <section className="card ornate-card overflow-hidden">
        <div
          className="border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "#eedde5", background: "linear-gradient(135deg,#fff8fb,#f8f4fc)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="brand-medallion" style={{ width: 44, height: 44 }} aria-hidden>
                <IconTrophy size={22} />
              </span>
              <div>
                <p className="m-0 text-[0.72rem] font-bold" style={{ color: "#9a7185" }}>
                  نتيجة الاختبار · تصحيح تفصيلي
                </p>
                <h1 className="font-display m-0 text-[1.35rem] font-bold" style={{ color: "#57304a" }}>
                  {EXAM_TITLE}
                </h1>
              </div>
            </div>
            <span className="chip chip-gold">
              <IconCheck size={13} />
              تم التسليم وحفظ النتيجة
            </span>
          </div>
        </div>

        <div className="grid items-center gap-4 p-4 sm:p-5 md:grid-cols-[auto_1fr]">
          <div className="mx-auto">
            <div className="score-ring" role="img" aria-label={`الدرجة النهائية ${result.score} من ${TOTAL_MARKS}، النسبة ${percentage.toFixed(2)}%`}>
              <svg width="178" height="178" viewBox="0 0 178 178" aria-hidden>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d98aa5" />
                    <stop offset="55%" stopColor="#bb5b7c" />
                    <stop offset="100%" stopColor="#8c79b6" />
                  </linearGradient>
                </defs>
                <circle cx="89" cy="89" r="74" fill="none" stroke="#f4e5ed" strokeWidth="12" />
                <circle
                  cx="89"
                  cy="89"
                  r="74"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                />
                <circle cx="89" cy="89" r="60" fill="#fffdfb" stroke="#f0e2e9" />
              </svg>
              <div className="score-center">
                <span className="score-value">{result.score}</span>
                <span className="text-[0.8rem]" style={{ color: "#8a7181" }}>
                  من {TOTAL_MARKS}
                </span>
                <span className="mt-0.5 text-[0.78rem] font-bold" style={{ color: "#8d3b5a" }}>
                  {percentage.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className="m-0 mt-1 text-center text-[0.72rem]" style={{ color: "#9a8394" }}>
              الدرجة النهائية من 100
            </p>
          </div>

          <div>
            <p className="m-0 text-[0.76rem]" style={{ color: "#8a7181" }}>الطالب</p>
            <p className="font-display m-0 text-[1.25rem] font-bold" style={{ color: "#4f2c44" }}>
              {result.studentName}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconClock size={16} />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>المدة المستغرقة</p>
                  <p className="m-0 text-[0.9rem] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatDuration(result.durationMs)}
                  </p>
                </div>
              </div>
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconList size={16} />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>الأسئلة والأجزاء</p>
                  <p className="m-0 text-[0.9rem] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {totalQuestions} سؤالاً · {totalSubparts} جزءاً
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2 grid gap-1.5 rounded-2xl border p-2.5 text-[0.72rem]" style={{ borderColor: "#efe0e7", background: "#fffcfb", color: "#7b6676" }}>
              <p className="m-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                <strong>وقت البدء: </strong>{formatTimestamp(result.startedAt)}
              </p>
              <p className="m-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                <strong>وقت التسليم: </strong>{formatTimestamp(result.submittedAt)}
              </p>
              <p className="m-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                <strong>رقم المحاولة: </strong>{result.attemptId}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-4 sm:px-5">
          {(
            [
              { key: "correct", label: "صحيحة", color: "#3f7657" },
              { key: "partial", label: "صحيحة جزئياً", color: "#8d6726" },
              { key: "incorrect", label: "خاطئة", color: "#a3485c" },
              { key: "unanswered", label: "دون إجابة", color: "#6d5b6b" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="stat-box" style={{ background: "#fffdfb" }}>
              <p className="m-0 text-[0.7rem]" style={{ color: "#8a7181" }}>{item.label}</p>
              <p className="stat-num m-0" style={{ color: item.color }}>{result.counts[item.key]}</p>
              <p className="m-0 text-[0.66rem]" style={{ color: "#a08a98" }}>جزءاً</p>
            </div>
          ))}
        </div>
      </section>

      {/* حالة إرسال النتيجة إلى المعلّم */}
      <SendBanner status={sendStatus} onResend={onResend} />

      <section className="card mt-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 flex items-center gap-1.5 text-[1rem] font-bold" style={{ color: "#57304a" }}>
              <IconDownload size={17} />
              تقرير النتيجة TXT
            </h2>
            <p className="m-0 text-[0.78rem]" style={{ color: "#8a7181" }}>
              نُزّل التقرير تلقائياً عند التسليم. يمكنك تنزيل النسخة نفسها مرة أخرى.
            </p>
            <p className="m-0 mt-1 text-[0.7rem]" style={{ color: "#9a8394" }} dir="ltr">
              {reportFilename(result.studentName)}
            </p>
          </div>
          <button type="button" className="btn btn-gold" onClick={onDownload}>
            <IconDownload size={17} />
            تنزيل التقرير TXT
          </button>
        </div>
        {reportIssue ? (
          <p className="notice notice-danger mt-2" role="alert">
            {reportIssue}
          </p>
        ) : (
          <p className="notice notice-info mt-2">
            <IconCheck size={15} />
            {fileValidated
              ? "تم إنشاء التقرير والتحقق من محتوياته (اسم الطالب، الدرجة، وقت التسليم، جميع الأجزاء والمراجع الداخلية) قبل بدء التنزيل."
              : "التقرير جاهز للتنزيل."}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={onTryAgain}>
            <IconRestart size={16} />
            محاولة جديدة
          </button>
        </div>
        <p className="m-0 mt-2 text-[0.7rem]" style={{ color: "#9a8394" }}>
          «محاولة جديدة» تنشئ محاولة نظيفة، وتحذف إجابات المحاولة السابقة من هذا المتصفح، وتطلب
          الاسم من جديد.
        </p>
      </section>

      <section className="mt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 flex items-center gap-1.5 text-[1rem] font-bold" style={{ color: "#57304a" }}>
            <IconSparkle size={17} />
            المراجعة التفصيلية للإجابات
          </h2>
          <span className="chip chip-soft">الإجابات الصحيحة والشرح ظاهرة الآن فقط</span>
        </div>

        <div className="grid gap-2">
          {result.questionOrder.map((questionId, index) => {
            const question = questions.find((q) => q.id === questionId);
            const items = grouped.get(questionId) ?? [];
            if (!question) return null;
            const earned = items.reduce((sum, s) => sum + s.awarded, 0);
            return (
              <details key={questionId} className="result-card" open={index === 0}>
                <summary>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="q-medallion" style={{ width: 34, height: 34, fontSize: "0.8rem" }} aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <p className="m-0 text-[0.88rem] font-bold" style={{ color: "#4b3750" }}>
                        {question.topic}
                      </p>
                      <p className="m-0 text-[0.7rem]" style={{ color: "#8a7181" }}>
                        {items.length} أجزاء · الدرجة {earned} من {question.marks}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {items.map((item) => (
                      <StatusPill key={item.subpartId} status={item.status} />
                    ))}
                    <span className="chip chip-gold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {earned} من {question.marks}
                    </span>
                  </div>
                </summary>

                <div className="p-3">
                  <p className="m-0 text-[0.86rem]" style={{ color: "#4d384b" }}>
                    <RichText>{question.stem}</RichText>
                  </p>
                  <div className="mt-2 grid gap-2">
                    {items.map((item, sIndex) => (
                      <div
                        key={item.subpartId}
                        className="rounded-xl border p-2.5"
                        style={{ borderColor: "#f0e2e8", background: "#fffdfb" }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="m-0 text-[0.82rem] font-semibold" style={{ color: "#4b3750" }}>
                            <span className="subpart-index me-1.5 inline-grid align-middle" style={{ width: 22, height: 22 }}>
                              {sIndex + 1}
                            </span>
                            <RichText>{item.prompt}</RichText>
                          </p>
                          <div className="flex items-center gap-1.5">
                            <StatusPill status={item.status} />
                            <span className="marks-badge" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {item.awarded} من {item.max}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                          <div className="answer-compare">
                            <span className="label">إجابتك</span>
                            <AnswerDisplay
                              subpartId={item.subpartId}
                              display={item.studentDisplay}
                            />
                          </div>
                          <div className="answer-compare" style={{ borderColor: "#d6e7da", background: "#f7fcf8" }}>
                            <span className="label">الإجابة الصحيحة</span>
                            <AnswerDisplay
                              subpartId={item.subpartId}
                              display={item.correctDisplay}
                            />
                          </div>
                        </div>
                        <p className="explanation m-0 mt-2">
                          <strong>الشرح: </strong>
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className="mt-3">
        <ContactBlock />
      </div>
      <p className="mt-2 text-center text-[0.7rem]" style={{ color: "#9a8394" }}>
        تم إنشاء النتيجة والتقرير محلياً في هذا المتصفح، وتُرسَل النتيجة إلى معلّمك عند التسليم. لا
        تُرسل النتائج إلى واتساب أو البريد.
      </p>
    </main>
  );
}

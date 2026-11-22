/**
 * صفحة النتيجة: العلامة والنسبة والتقدير، تفصيل كل سؤال وفرع (بما فيه العلامة
 * الجزئية والتفسير والحل الكامل)، تنزيل تقرير TXT، وحالة الإرسال إلى Google Sheets.
 */

import { useEffect, useMemo, useState } from "react";
import { CONTACT, EXAM_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";
import type { Question } from "../exam/types";
import type { ExamResult, Responses } from "../lib/grading";
import { partLetter, partStatus, STATUS_AR } from "../lib/grading";
import { Rich } from "../lib/mathx";
import {
  reportFilename,
  summarize,
  triggerDownload,
  type AttemptMeta,
} from "../lib/report";
import type { SendStatus } from "../exam/submit";
import { formatDuration, formatDurationWords, formatLong, num, pct } from "../lib/time";
import { Figure } from "../exam/figures";
import { gradeLabel } from "../lib/report";

const STATUS_STYLE: Record<"correct" | "partial" | "wrong", { className: string; color: string }> = {
  correct: { className: "badge-ok", color: "var(--ok)" },
  partial: { className: "badge-part", color: "var(--warn)" },
  wrong: { className: "badge-err", color: "var(--err)" },
};

const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال نتيجتك إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed: "تعذّر إرسال النتيجة تلقائياً. حُمِّلت النتيجة محلياً وستُعاد المحاولة عند فتح الاختبار، ويمكنك إعادة إرسالها الآن أو تسليم ملف التقرير لمعلّمك.",
};

function ScoreRing({ value, max }: { value: number; max: number }) {
  const ratio = Math.max(0, Math.min(1, max ? value / max : 0));
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const [dash, setDash] = useState(circumference);
  useEffect(() => {
    const timer = window.setTimeout(() => setDash(circumference * (1 - ratio)), 80);
    return () => window.clearTimeout(timer);
  }, [circumference, ratio]);
  const stroke = ratio >= 0.85 ? "#14713f" : ratio >= 0.65 ? "#0f766e" : ratio >= 0.5 ? "#b5851d" : "#a52a2a";
  return (
    <div className="relative grid place-items-center" style={{ width: 176, height: 176 }}>
      <svg width="176" height="176" viewBox="0 0 176 176" aria-hidden>
        <circle cx="88" cy="88" r={radius} fill="none" stroke="#2a5b68" strokeWidth="12" />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
          transform="rotate(-90 88 88)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="tnum text-[2.4rem] font-extrabold leading-none" style={{ color: "#fff8e8" }}>
          {num(value)}
        </div>
        <div className="tnum text-[0.8rem] font-bold" style={{ color: "#cfe3e6" }}>
          من {num(max)}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[var(--r-sm)] border p-2.5 text-center" style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}>
      <div className="tnum text-[1.5rem] font-extrabold leading-none" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-[0.74rem] leading-tight" style={{ color: "var(--ink-3)" }}>
        {label}
      </div>
    </div>
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
}) {
  const summary = useMemo(() => summarize(questions, answers, result), [questions, answers, result]);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(questions.map((question) => [question.id, true])),
  );
  const allOpen = questions.every((question) => open[question.id] !== false);
  const filename = reportFilename(meta.studentName);
  const download = () => triggerDownload(reportText, filename);

  const lessons = useMemo(() => {
    const names = Array.from(new Set(questions.map((question) => question.lesson)));
    return names.map((lesson) => {
      let earned = 0;
      let possible = 0;
      questions.forEach((question, index) => {
        if (!(question.lesson === lesson || question.lesson.includes(lesson))) return;
        earned += result.questions[index].earned;
        possible += result.questions[index].possible;
      });
      return { lesson, earned, possible };
    });
  }, [questions, result]);

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-3 pb-10 pt-5 sm:px-4">
      {/* ===== بطاقة النتيجة ===== */}
      <section
        className="relative overflow-hidden rounded-[var(--r-lg)] shadow-[var(--sh-3)]"
        style={{ background: "linear-gradient(135deg,#10313c 0%,#174c5b 52%,#0f766e 100%)" }}
      >
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
          <div className="mx-auto">
            <ScoreRing value={summary.total} max={summary.max} />
          </div>
          <div className="text-[#f4ecd8]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#ffd97a" }}>
              تم تسليم الاختبار وتصحيحه
            </p>
            <h1 className="mt-1 text-[clamp(1.35rem,4vw,2.1rem)] font-extrabold leading-snug" style={{ color: "#fff8e8" }}>
              {meta.studentName}
            </h1>
            <p className="mt-1 text-[0.9rem] opacity-85">{EXAM_TITLE}</p>
            <p className="mt-0.5 text-[0.82rem] opacity-75">
              {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · مجموع {num(TOTAL_MARKS)} علامة
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge tnum" style={{ background: "rgba(255,217,122,0.2)", color: "#ffd97a", borderColor: "rgba(255,217,122,0.45)" }}>
                النسبة: <strong>{pct(summary.percentage)}</strong>
              </span>
              <span className="badge" style={{ background: "rgba(255,248,232,0.14)", color: "#dcebee", borderColor: "rgba(255,248,232,0.24)" }}>
                التقدير: <strong>{gradeLabel(summary.percentage)}</strong>
              </span>
              <span className="badge tnum" style={{ background: "rgba(15,118,110,0.35)", color: "#bff0e6", borderColor: "rgba(15,118,110,0.6)" }}>
                المدة: <strong>{formatDuration(meta.elapsedMs)}</strong>
              </span>
            </div>

            {sendStatus !== "idle" && (
              <div
                className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--r-sm)] p-2.5 text-[0.85rem] leading-relaxed"
                role="status"
                aria-live="polite"
                data-send-status={sendStatus}
                style={{
                  backgroundColor:
                    sendStatus === "success"
                      ? "rgba(20,113,63,0.24)"
                      : sendStatus === "failed"
                        ? "rgba(180,71,47,0.26)"
                        : "rgba(255,217,122,0.2)",
                  border: `1px solid ${
                    sendStatus === "success"
                      ? "rgba(160,230,180,0.45)"
                      : sendStatus === "failed"
                        ? "rgba(255,200,180,0.5)"
                        : "rgba(255,217,122,0.45)"
                  }`,
                }}
              >
                <p className="min-w-[12rem] flex-1 font-bold" style={{ color: sendStatus === "failed" ? "#fde3da" : "#e7f6ef" }}>
                  {SEND_TEXT[sendStatus]}
                </p>
                {sendStatus === "failed" && (
                  <button
                    type="button"
                    className="btn shrink-0 !min-h-0 !px-3 !py-1.5"
                    style={{ background: "rgba(255,248,232,0.16)", color: "#fff8e8", border: "1px solid rgba(255,248,232,0.3)" }}
                    onClick={onResend}
                    data-action="resend-result"
                  >
                    إعادة إرسال النتيجة
                  </button>
                )}
              </div>
            )}

            <div
              className="mt-3 rounded-[var(--r-sm)] p-2.5 text-[0.84rem] leading-relaxed"
              role="status"
              aria-live="polite"
              style={{
                backgroundColor: autoDownloaded ? "rgba(20,113,63,0.22)" : "rgba(180,71,47,0.24)",
                border: `1px solid ${autoDownloaded ? "rgba(160,230,180,0.4)" : "rgba(255,200,180,0.45)"}`,
                color: autoDownloaded ? "#dcf0e2" : "#fde3da",
              }}
            >
              {autoDownloaded ? (
                <p>
                  <strong>✓ بدأ تنزيل التقرير تلقائياً</strong> باسم <span dir="ltr" className="font-mono">{filename}</span>.
                  إن لم يظهر الملف فراجعي مجلد التنزيلات أو استخدمي الزر الاحتياطي أدناه.
                </p>
              ) : (
                <p>
                  <strong>! منع المتصفح التنزيل التلقائي</strong> — استخدمي زر «تنزيل التقرير TXT» أدناه لتنزيل الملف نفسه.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-gold" onClick={download} data-action="download-report">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
                  <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
                </svg>
                تنزيل التقرير TXT
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: "rgba(255,248,232,0.14)", color: "#fff8e8", border: "1px solid rgba(255,248,232,0.3)" }}
                onClick={onRetry}
                data-action="retry-exam"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                محاولة جديدة
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: "transparent", color: "#cfe3e6", border: "1px dashed rgba(255,248,232,0.35)" }}
                onClick={onTeacher}
              >
                دليل المعلّم
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== الملخّص ===== */}
      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="mb-3 text-xl font-extrabold" style={{ color: "var(--navy)" }}>
          ملخّص النتيجة
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="أسئلة صحيحة بالكامل" value={num(summary.fullQuestions)} tone="var(--ok)" />
          <Stat label="أسئلة صحيحة جزئياً" value={num(summary.partialQuestions)} tone="var(--warn)" />
          <Stat label="أسئلة خاطئة" value={num(summary.wrongQuestions)} tone="var(--err)" />
          <Stat label="فروع لم يُجب عنها" value={num(summary.unansweredSubparts)} tone="var(--ink-3)" />
          <Stat label="فروع صحيحة" value={num(summary.correctSubparts)} tone="var(--teal)" />
          <Stat label="فروع بعلامة جزئية" value={num(summary.partialSubparts)} tone="var(--gold-deep)" />
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {[
            { label: "بداية الاختبار", value: formatLong(meta.startAt) },
            { label: "تسليم الاختبار", value: formatLong(meta.submitAt) },
            { label: "المدة المنقضية", value: `${formatDuration(meta.elapsedMs)} — ${formatDurationWords(meta.elapsedMs)}` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--r-sm)] border p-2.5"
              style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
            >
              <p className="text-[0.72rem] font-bold" style={{ color: "var(--ink-3)" }}>
                {item.label}
              </p>
              <p className="tnum mt-0.5 text-[0.88rem] font-bold" style={{ color: "var(--ink-1)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[0.78rem] font-bold" style={{ color: "var(--ink-3)" }}>
            توزيع العلامات على الدرسين
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lessons.map((row) => (
              <span key={row.lesson} className="badge badge-teal tnum">
                {row.lesson}: {num(row.earned)}/{num(row.possible)}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[0.72rem]" style={{ color: "var(--ink-3)" }}>
            السؤال التركيبي (السؤال {num(questions.length)}) يُحتسب في الدرسين، لذلك يتجاوز مجموع التوزيع {num(TOTAL_MARKS)} علامة.
          </p>
        </div>
      </section>

      {/* ===== المراجعة التفصيلية ===== */}
      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--navy)" }}>
            التصحيح التفصيلي والحلول
          </h2>
          <button
            type="button"
            className="btn btn-ghost !min-h-0 !px-3 !py-1.5 text-sm"
            onClick={() =>
              setOpen(Object.fromEntries(questions.map((question) => [question.id, !allOpen])))
            }
          >
            {allOpen ? "طيّ كل الأسئلة" : "فتح كل الأسئلة"}
          </button>
        </div>

        <div className="grid gap-3">
          {questions.map((question, index) => {
            const graded = result.questions[index];
            const isOpen = open[question.id] !== false;
            const ratio = graded.possible ? graded.earned / graded.possible : 0;
            const tone = ratio >= 0.999 ? "var(--ok)" : ratio > 0 ? "var(--warn)" : "var(--err)";
            return (
              <article key={question.id} className="card overflow-hidden" data-result-question={question.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 p-3.5 text-start"
                  onClick={() => setOpen((state) => ({ ...state, [question.id]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <span
                    className="tnum grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)] font-extrabold"
                    style={{ background: "var(--navy)", color: "#ffd97a" }}
                  >
                    {num(index + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1rem] font-extrabold" style={{ color: "var(--ink-1)" }}>
                      {question.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="badge tnum" style={{ background: `${tone}1a`, color: tone, borderColor: `${tone}55` }}>
                        {num(graded.earned)} / {num(graded.possible)} علامة
                      </span>
                      <span className="badge badge-mute">{question.lesson}</span>
                      <span className="badge badge-mute">{question.pages}</span>
                    </span>
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    className="mt-1 shrink-0 transition-transform duration-300"
                    style={{ color: "var(--ink-3)", transform: isOpen ? "rotate(180deg)" : "none" }}
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t p-3.5 sm:p-4" style={{ borderColor: "var(--line-soft)" }}>
                    <p
                      className="mb-3 rounded-[var(--r-sm)] border p-3 text-[0.92rem] leading-relaxed"
                      style={{ borderColor: "#e3d9c5", background: "var(--surface-2)" }}
                    >
                      <Rich content={question.intro} />
                    </p>
                    {question.figure && (
                      <div className="mb-3">
                        <Figure type={question.figure} />
                      </div>
                    )}
                    <p className="mb-3 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                      المهارة: {question.skill} · المرجع: {question.pages}
                    </p>

                    <div className="grid gap-2.5">
                      {question.parts.map((part, partIndex) => {
                        const partResult = graded.parts[partIndex];
                        const status = partStatus(partResult.earned, partResult.possible);
                        const style = STATUS_STYLE[status];
                        const chosen = part.options?.find((option) => option.id === partResult.response);
                        return (
                          <div
                            key={part.id}
                            className="rounded-[var(--r-sm)] border p-3"
                            data-result-part={part.id}
                            data-part-earned={partResult.earned}
                            data-part-possible={partResult.possible}
                            style={{
                              borderColor: "var(--line-soft)",
                              borderInlineStartColor: style.color,
                              borderInlineStartWidth: 4,
                              background: "#fff",
                            }}
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="flex items-start gap-2 text-[0.95rem] font-bold" style={{ color: "var(--navy)" }}>
                                <span className="badge badge-mute">{partLetter(partIndex)}</span>
                                <span>
                                  <Rich content={part.label} />
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className={`badge ${style.className}`}>{STATUS_AR[status]}</span>
                                <span className="badge badge-mute tnum">
                                  {num(partResult.earned)} / {num(partResult.possible)}
                                </span>
                              </span>
                            </div>

                            <dl className="grid gap-1.5 text-[0.88rem]">
                              <div className="grid grid-cols-[104px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: "var(--ink-3)" }}>
                                  إجابتك
                                </dt>
                                <dd style={{ color: status === "correct" ? "var(--ok)" : "var(--clay)" }} dir="auto">
                                  {partResult.response.trim()
                                    ? chosen
                                      ? chosen.label
                                      : partResult.response
                                    : "لم تُجب"}
                                </dd>
                              </div>
                              <div className="grid grid-cols-[104px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: "var(--ink-3)" }}>
                                  الإجابة الصحيحة
                                </dt>
                                <dd style={{ color: "var(--ok)" }}>
                                  <Rich content={partResult.correct} />
                                </dd>
                              </div>
                              <div className="grid grid-cols-[104px_1fr] gap-2">
                                <dt className="font-bold" style={{ color: "var(--ink-3)" }}>
                                  التفسير
                                </dt>
                                <dd style={{ color: "var(--ink-2)" }}>
                                  <Rich content={partResult.explanation} />
                                </dd>
                              </div>
                              {status === "partial" && (
                                <div className="grid grid-cols-[104px_1fr] gap-2">
                                  <dt className="font-bold" style={{ color: "var(--ink-3)" }}>
                                    العلامة الجزئية
                                  </dt>
                                  <dd className="tnum" style={{ color: "var(--warn)" }}>
                                    مُنحت {num(partResult.earned)} من {num(partResult.possible)} بحسب معايير السلّم المستوفاة.
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className="mt-3 border-s-[3px] p-2.5 ps-3"
                      style={{ borderColor: "#7ebfb8", background: "var(--surface-2)" }}
                    >
                      <p className="text-[0.78rem] font-bold" style={{ color: "var(--teal)" }}>
                        خطوات الحل والتفسير
                      </p>
                      <p className="text-[0.88rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                        <Rich content={graded.solution} />
                      </p>
                    </div>
                    {question.figureSource && (
                      <p className="mt-2 text-[0.72rem]" style={{ color: "var(--ink-3)" }}>
                        مرجع الرسم: {question.figureSource}
                      </p>
                    )}
                    <p className="mt-1 text-[0.72rem]" style={{ color: "var(--ink-3)" }}>
                      المهارة: {question.skill}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="card mt-5 p-4 text-center text-sm" style={{ background: "var(--surface-2)" }}>
        <p className="font-bold" style={{ color: "var(--ink-2)" }}>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
          {" · "}
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-4"
            style={{ color: "var(--teal)" }}
          >
            واتساب
          </a>
        </p>
        <p className="mt-1 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
          التقرير مُنشأ داخل متصفحك بصيغة TXT، وتُرسَل نسخة من نتيجتك وإجاباتك إلى معلّمك عند التسليم.
        </p>
      </section>
    </div>
  );
}

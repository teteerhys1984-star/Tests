import type { Attempt, Question, SubItem, SubResult } from "@/data/types";
import type { AttemptScore } from "@/lib/grade";
import { formatMarks } from "@/lib/grade";
import { Katex } from "@/lib/math";
import { SOLUTIONS } from "@/data/solutions";
import {
  describeAnswer,
  downloadReport,
  reportFilename,
  reportToText,
  STATUS_AR,
  type ExamReport,
  type ReportPart,
} from "@/lib/report";
import type { SendStatus } from "@/lib/submit";
import { CheckIcon, CrossIcon, Figure, RichText } from "./Bits";

/* =========================================================================
   صفحة النتيجة: الدرجات، إجابة الطالب، الإجابة النموذجية، الرسم المحلول، المصدر،
   وحالة إرسال النتيجة إلى Google Sheets مع إعادة إرسال يدوية.
   ========================================================================= */

function SendStatusBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;

  if (status === "sending") {
    return (
      <div
        role="status"
        aria-live="polite"
        data-send-status="sending"
        className="rounded-2xl border-2 border-yellow bg-yellow/25 px-4 py-3 text-[14px] font-bold text-ink"
      >
        جارٍ إرسال النتيجة إلى المعلّم…
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        data-send-status="success"
        className="flex items-start gap-2.5 rounded-2xl border-2 border-green/40 bg-green/10 px-4 py-3 text-[14px] font-bold text-green"
      >
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>تم إرسال النتيجة إلى المعلّم بنجاح.</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-send-status="failed"
      className="flex flex-col gap-3 rounded-2xl border-2 border-orange/50 bg-orange/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1 text-[14px] font-bold leading-7 text-ink">
        تعذّر إرسال النتيجة تلقائياً؛ حُفظت محلياً على هذا الجهاز وستُعاد المحاولة عند فتح الاختبار.
        يمكنك إعادة الإرسال الآن أو تنزيل ملف التقرير — النتيجة والتصحيح كاملان في كل الأحوال.
      </div>
      <button
        type="button"
        onClick={onResend}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-4 py-2 text-[13px] font-black text-ink transition-colors hover:bg-ink hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0-2.4 5.7M20 5v6h-6" />
        </svg>
        إعادة إرسال النتيجة
      </button>
    </div>
  );
}

function stripTexFallback(text: string): string {
  return text.replace(/\[\[(.+?)\]\]/g, "$1");
}

function StudentCard({ sub, part, raw }: { sub?: SubItem; part: ReportPart; raw?: string }) {
  const text = sub ? describeAnswer(sub, raw ?? "") : part.student;
  const mono = sub?.kind === "numeric" && (raw ?? "").trim().length > 0;
  return (
    <div className="rounded-xl border-2 border-line bg-paper px-3.5 py-3">
      <p className="mb-1 text-[12px] font-black text-ink-soft">إجابة الطالب</p>
      {mono ? (
        <div className="text-center text-[17px] font-bold text-ink">
          <Katex
            tex={`${(raw ?? "").trim()}${
              sub?.unit ? (sub.unit === "°" ? String.raw`^{\circ}` : String.raw`~\mathrm{${sub.unit}}`) : ""
            }`}
          />
        </div>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-7 text-ink">{text}</p>
      )}
    </div>
  );
}

function ExpectedCard({ sub, result, part }: { sub?: SubItem; result?: SubResult; part: ReportPart }) {
  const hasRich = !!sub && !!result;
  return (
    <div className="rounded-xl border-2 border-green/35 bg-green/8 px-3.5 py-3">
      <p className="mb-1 text-[12px] font-black text-green">الإجابة النموذجية ومعايير التصحيح</p>
      <div className="text-[15px] leading-7 text-ink">
        <RichText text={hasRich ? result.expected || "—" : stripTexFallback(part.correct)} />
      </div>
      {part.criteria.length > 0 ? (
        <ul className="mt-2 grid gap-1.5">
          {part.criteria.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] leading-6 text-ink-soft">
              <span className={`mt-1 ${d.ok ? "text-green" : "text-orange"}`}>
                {d.ok ? <CheckIcon className="h-3.5 w-3.5" /> : <CrossIcon className="h-3.5 w-3.5" />}
              </span>
              <span>
                <RichText text={d.note} />
                {d.ok ? "" : <span className="text-orange"> — لم تُحتسب العلامة الجزئية لهذا المعيار</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Results({
  attempt,
  score,
  report,
  sendStatus,
  onResend,
  onRetake,
  onOpenTeacher,
}: {
  attempt: Attempt | null;
  score: AttemptScore | null;
  report: ExamReport;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetake: () => void;
  onOpenTeacher: () => void;
}) {
  const reportText = reportToText(report);
  const filename = reportFilename(report.name);
  const backupName = filename.replace(/\.txt$/, "_Backup.txt");
  const submittedLabel = new Date(report.submittedAt).toLocaleString("ar");

  return (
    <div className="settle">
      <header className="relative overflow-hidden bg-ink text-white">
        <div className="dark-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-[13px] font-bold text-cyan">
            نتيجة اختبار {report.examTitle} — التصحيح المفصّل
          </p>
          <h1 className="mt-1 font-display text-[30px] font-black leading-tight sm:text-[44px]">{report.name}</h1>
          <p className="mt-1 text-[14px] text-white/75">
            زمن التنفيذ: <Katex tex={`\\mathrm{${formatClock(report.elapsedSec)}}`} className="text-cyan" /> —{" "}
            {submittedLabel}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Score v={report.physics} max={50} label="علامة الفيزياء" color="#06B6D4" />
            <Score v={report.chemistry} max={50} label="علامة الكيمياء" color="#FF6B1A" />
            <Score v={report.total} max={report.max} label="المجموع الكلّي" color="#FFC53D" big />
          </div>

          <p className="mt-3 text-[12.5px] font-semibold text-white/60">
            النسبة: {report.percentage}% — التقدير: {report.grade}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => downloadReport(reportText, filename)}
              className="flex items-center gap-2 rounded-xl border-2 border-cyan bg-cyan px-4 py-3 font-display text-[15px] font-black text-ink"
            >
              <DownloadGlyph /> تنزيل التقرير (TXT)
            </button>
            <button
              type="button"
              onClick={() => downloadReport(reportText, backupName)}
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 font-display text-[15px] font-black text-white"
            >
              <DownloadGlyph /> نسخة احتياطية
            </button>
            <button
              type="button"
              onClick={onOpenTeacher}
              className="rounded-xl border-2 border-white/25 px-4 py-3 font-display text-[15px] font-black text-white/85 hover:border-cyan"
            >
              منطقة المعلّم
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="rounded-xl border-2 border-white/25 px-4 py-3 font-display text-[15px] font-black text-white/85 hover:border-cyan"
            >
              إعادة الاختبار
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-5">
          <SendStatusBanner status={sendStatus} onResend={onResend} />
        </div>

        <section className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="أسئلة صحيحة" value={report.fullQuestions} />
          <Stat label="أسئلة جزئية" value={report.partialQuestions} />
          <Stat label="أسئلة خاطئة" value={report.wrongQuestions} />
          <Stat label="فروع غير مجابة" value={report.stats.unansweredSubparts} />
        </section>

        <section className="mb-6 overflow-hidden rounded-3xl border-2 border-line bg-white">
          <table className="w-full text-[13.5px]">
            <caption className="px-4 py-3 text-start font-display text-[15px] font-black text-ink">
              توزيع العلامات على الدروس
            </caption>
            <tbody>
              {report.lessons.map((l) => (
                <tr key={l.title} className="border-t-2 border-line/70">
                  <td className="px-4 py-2.5 font-semibold text-ink-soft">{l.title}</td>
                  <td className="px-4 py-2.5 text-end font-bold text-ink">
                    <Katex tex={`${formatMarks(l.earned)}/${formatMarks(l.max)}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid gap-6">
          {report.questions.map((rq, qi) => {
            const rich = score?.perQuestion[qi];
            const q: Question | undefined = rich?.question;
            const full = rq.earned >= rq.max - 0.001;
            return (
              <article key={rq.id} className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-xs">
                <div
                  className={`flex items-start gap-3 border-b-2 border-line px-4 py-3.5 sm:px-6 ${
                    full ? "bg-green/8" : "bg-paper"
                  }`}
                >
                  <span
                    className={`numeral text-[38px] ${
                      rq.subject === "physics" ? "numeral-blue" : "numeral-orange"
                    }`}
                  >
                    {String(rq.n).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-black text-ink">
                      السؤال <Katex tex={String(rq.n)} /> — {rq.subject === "physics" ? "فيزياء" : "كيمياء"}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-8 text-ink-soft">
                      {q ? <RichText text={q.stem} /> : rq.stem}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border-2 border-ink bg-ink px-3.5 py-2 text-center text-white">
                    <Katex tex={`${formatMarks(rq.earned)}/${rq.max}`} className="text-[17px] text-yellow" />
                    <span className="block text-[10px] text-white/75">العلامة</span>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-5 sm:px-6">
                  {q?.figure ? (
                    <figure className="overflow-hidden rounded-2xl border-2 border-line bg-[#F8FAFC] p-2">
                      <Figure kind={q.figure} solved={true} />
                    </figure>
                  ) : null}

                  {rq.parts.map((part, pi) => {
                    const sub = q?.subs[pi];
                    const res = rich?.subs[pi];
                    const raw = attempt ? String(attempt.answers[sub?.id ?? ""] ?? "") : "";
                    const status = STATUS_AR[part.status];
                    return (
                      <section key={`${rq.id}-${pi}`} className="grid gap-3">
                        <p className="text-[15.5px] font-bold leading-8 text-ink">
                          <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-md bg-ink text-[12px] text-white">
                            <Katex tex={String(part.index)} className="text-white" />
                          </span>
                          {sub ? <RichText text={sub.label} /> : part.promptText}
                          <span className="ms-2 inline-block rounded-md border border-yellow/60 bg-yellow/25 px-2.5 py-0.5 text-[12px] font-bold">
                            <Katex tex={`${formatMarks(part.earned)}/${formatMarks(part.max)}`} /> علامة
                          </span>
                          <span className="ms-2 inline-block rounded-md bg-ink/5 px-2.5 py-0.5 text-[12px] font-bold text-ink-soft">
                            {status}
                          </span>
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <StudentCard sub={sub} part={part} raw={raw} />
                          <ExpectedCard sub={sub} result={res} part={part} />
                        </div>
                      </section>
                    );
                  })}

                  {q && SOLUTIONS[q.id] ? (
                    <div className="slip rounded-2xl border-2 border-blue/30 p-4">
                      <p className="mb-2 font-display text-[15px] font-black text-blue-deep">الحل العلمي النموذجي</p>
                      <ol className="grid gap-2">
                        {SOLUTIONS[q.id].steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-[15px] leading-8 text-ink">
                            <span className="font-bold text-blue">
                              <Katex tex={`${i + 1}.`} />
                            </span>
                            <span>
                              <RichText text={s} />
                            </span>
                          </li>
                        ))}
                      </ol>
                      {SOLUTIONS[q.id].note ? (
                        <p className="mt-2.5 border-t-2 border-dashed border-blue/25 pt-2 text-[14px] font-semibold text-ink-soft">
                          <RichText text={SOLUTIONS[q.id].note!} />
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="rounded-xl bg-ink/5 px-3.5 py-2.5 text-[12.5px] font-semibold text-ink-soft">
                    <span className="font-black text-ink">مرجع السؤال (للمراجعة): </span>
                    {rq.source.unit} · {rq.source.lesson} · {rq.source.page} · {rq.source.source}
                    {rq.source.itImage ? (
                      <>
                        {" "}
                        · صورة المصدر رقم <Katex tex={String(rq.source.itImage)} />
                      </>
                    ) : null}{" "}
                    · المهارة: {rq.source.skill}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-line bg-white p-5">
          <div>
            <p className="font-display text-[18px] font-black text-ink">تقرير مفصّل قابل للتنزيل</p>
            <p className="text-[13.5px] text-ink-soft">
              ملف نصّي بترميز UTF-8 (BOM) يحتوي اسم الطالب والعلامات وإجابات الطالب والإجابات الصحيحة
              والحلول والمصادر.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadReport(reportText, filename)}
              className="rounded-xl border-2 border-ink bg-ink px-4 py-3 text-[14px] font-black text-white"
            >
              تنزيل التقرير
            </button>
            <button
              type="button"
              onClick={() => downloadReport(reportText, backupName)}
              className="rounded-xl border-2 border-line px-4 py-3 text-[14px] font-black text-ink"
            >
              تقرير احتياطي
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-white px-3.5 py-3">
      <p className="text-[11.5px] font-bold text-ink-soft">{label}</p>
      <p className="mt-0.5 text-[22px] font-black leading-none text-ink">
        <Katex tex={String(value)} />
      </p>
    </div>
  );
}

function Score({ v, max, label, color, big }: { v: number; max: number; label: string; color: string; big?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4">
      <p className="text-[12px] font-bold text-white/75">{label}</p>
      <div
        className={`mt-1 font-bold leading-none ${big ? "text-[36px] sm:text-[44px]" : "text-[30px] sm:text-[36px]"}`}
        style={{ color }}
      >
        <Katex tex={`${formatMarks(v)}/${max}`} />
      </div>
    </div>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

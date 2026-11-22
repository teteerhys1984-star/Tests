/**
 * عناصر الواجهة المشتركة: شريط التواصل، الترويسة (الزمن والتقدّم)، والتذييل
 * مع زر دخول المعلّم. لا تحتوي أي معلومة إجابة.
 */

import {
  CONTACT,
  EXAM_SHORT_TITLE,
  GRADE_LABEL,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TOTAL_MARKS,
} from "../config";
import { formatDuration, num } from "../lib/time";

export function ContactBar() {
  return (
    <div
      className="no-print relative z-10"
      style={{
        background: "linear-gradient(90deg,#10313c 0%,#1b5666 50%,#10313c 100%)",
        color: "#f3e7c9",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-2 text-center text-[0.85rem] font-semibold">
        <span>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
        </span>
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-4"
          style={{ color: "#ffd97a" }}
        >
          واتساب
        </a>
        <span className="hidden text-[0.78rem] opacity-75 sm:inline">
          للتواصل فقط — تُرسَل نتيجتك إلى معلّمك عند التسليم
        </span>
      </div>
    </div>
  );
}

export function Header({
  elapsedMs,
  answered,
  totalParts,
  muted,
  onToggleMute,
  showTimer,
}: {
  elapsedMs: number;
  answered: number;
  totalParts: number;
  muted: boolean;
  onToggleMute: () => void;
  showTimer: boolean;
}) {
  return (
    <div
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: "var(--line)", background: "rgba(253,250,244,0.94)" }}
    >
      <header className="mx-auto flex min-h-[68px] max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)]"
            style={{ background: "var(--navy)", color: "#ffd97a" }}
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-extrabold" style={{ color: "var(--navy)" }}>
              {EXAM_SHORT_TITLE}
            </p>
            <p className="truncate text-[0.74rem]" style={{ color: "var(--ink-3)" }}>
              {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · {num(TOTAL_MARKS)} علامة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showTimer && (
            <div
              className="tnum flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1.5 text-[0.9rem] font-bold"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}
              title="الزمن المنقضي منذ بدء الاختبار"
              role="timer"
              aria-live="off"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2M9 2h6" />
              </svg>
              {formatDuration(elapsedMs)}
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost !min-h-0 !px-2.5 !py-1.5"
            onClick={onToggleMute}
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            aria-pressed={muted}
            data-action="toggle-sound"
          >
            {muted ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="m17 9 4 6M21 9l-4 6" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
              </svg>
            )}
          </button>
        </div>
      </header>
      {showTimer && (
        <div
          className="h-1 w-full"
          role="progressbar"
          aria-label="نسبة الفروع المجابة"
          aria-valuemin={0}
          aria-valuemax={totalParts}
          aria-valuenow={answered}
          style={{ background: "var(--paper-deep)" }}
        >
          <div
            className="h-full"
            style={{
              width: `${totalParts ? (answered / totalParts) * 100 : 0}%`,
              background: "linear-gradient(90deg,#0f766e,#b5851d)",
              transition: "width .4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function Footer({ onTeacher }: { onTeacher: () => void }) {
  return (
    <footer className="no-print relative z-10 mt-8 border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center">
        <p className="text-sm font-bold" style={{ color: "var(--ink-2)" }}>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
          {"  ·  "}
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
        <p className="max-w-3xl text-[0.76rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          اختبار إلكتروني في الدرسين الأول والثاني من الوحدة الأولى (الحركة والسكون، والقوة والحركة) —{" "}
          {GRADE_LABEL}، {SEMESTER_LABEL}، {SUBJECT_LABEL} — النموذج A. يُصحَّح داخل المتصفح، ويُنزَّل تقرير TXT عند
          التسليم، وتُرسَل النتيجة إلى المعلّم.
        </p>
        <button
          type="button"
          onClick={onTeacher}
          className="mt-1 inline-flex items-center gap-1.5 rounded-[var(--r-sm)] px-3 py-1.5 text-[0.78rem] font-bold"
          style={{ color: "var(--ink-3)", border: "1px dashed var(--line)" }}
          data-action="open-teacher"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          دخول المعلّم
        </button>
      </div>
    </footer>
  );
}

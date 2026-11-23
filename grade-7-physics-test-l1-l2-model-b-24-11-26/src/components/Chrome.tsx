/**
 * عناصر الواجهة المشتركة: الترويسة والتذييل — بتصميم المصدر.
 * لا تحتوي أي معلومة إجابة.
 */

import { Clock3, LockKeyhole, Volume2, VolumeX } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { CONTACT, EXAM_SHORT_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";
import { formatDuration, num } from "../lib/time";

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
    <div className="header-wrap">
      <header className="site-header page-container">
        <div className="header-identity">
          <span className="header-signet" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="24" height="24" fill="none">
              <circle cx="10" cy="27" r="3.5" fill="currentColor" />
              <circle cx="26" cy="9" r="3.5" fill="currentColor" />
              <path d="M10 27C10 15 17 9 26 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M13 13H26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <div className="header-title">
            <span>{EXAM_SHORT_TITLE}</span>
            <small>{GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · {num(TOTAL_MARKS)} علامة</small>
          </div>
        </div>

        <div className="header-tools">
          {showTimer && (
            <div className="header-timer" title="الوقت المستغرق منذ بدء الاختبار" role="timer" aria-live="off">
              <Clock3 size={17} strokeWidth={1.9} aria-hidden="true" />
              <time dir="ltr">{formatDuration(elapsedMs)}</time>
            </div>
          )}
          <button
            className="icon-button sound-toggle"
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            aria-pressed={muted}
            title={muted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {muted ? <VolumeX size={20} strokeWidth={1.8} /> : <Volume2 size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </header>
      {showTimer && (
        <div
          className="header-progress"
          role="progressbar"
          aria-label="تقدم الإجابة"
          aria-valuemin={0}
          aria-valuemax={totalParts}
          aria-valuenow={answered}
        >
          <div style={{ width: `${totalParts ? (answered / totalParts) * 100 : 0}%` }} />
        </div>
      )}
    </div>
  );
}

export function Footer({ onTeacher }: { onTeacher: () => void }) {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div className="footer-person">
          <span>للتواصل</span>
          <strong>{CONTACT.name}</strong>
        </div>
        <div className="footer-links">
          <a href={`tel:${CONTACT.phone}`} className="phone-link">
            <span>الهاتف</span>
            <b dir="ltr">{CONTACT.phone}</b>
          </a>
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="whatsapp-link" aria-label="التواصل عبر WhatsApp">
            <FaWhatsapp size={21} aria-hidden="true" /> <span>WhatsApp</span>
          </a>
        </div>
        <button type="button" className="teacher-entry" onClick={onTeacher} data-action="open-teacher">
          <LockKeyhole size={14} aria-hidden="true" /> دخول المعلّم
        </button>
      </div>
    </footer>
  );
}

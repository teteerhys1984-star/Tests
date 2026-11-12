import {
  CONTACT_LABEL,
  EXAM_TITLE,
  WHATSAPP_URL,
} from "../data/questions";
import {
  BrandCrest,
  IconBook,
  IconClock,
  IconKey,
  IconList,
  IconWhatsApp,
} from "./Icons";

export function SiteHeader({
  studentName,
  timer,
  progressLabel,
  saveOk,
  onReview,
  onTeacherKey,
  showReview,
}: {
  studentName?: string;
  timer?: string;
  progressLabel?: string;
  saveOk?: boolean | null;
  onReview?: () => void;
  onTeacherKey: () => void;
  showReview?: boolean;
}) {
  return (
    <header className="topbar no-print">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="brand-medallion" aria-hidden>
            <BrandCrest size={38} />
          </span>
          <div className="leading-tight">
            <p className="font-display m-0 text-[1.12rem] font-bold" style={{ color: "#5a2c44" }}>
              {EXAM_TITLE}
            </p>
            <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>
              الرياضيات · الصف السادس الأساسي
            </p>
          </div>
        </div>

        <div className="header-actions">
          {timer ? (
            <span className="chip chip-lav" aria-label="الزمن المنقضي">
              <IconClock size={14} />
              <span className="timer">{timer}</span>
            </span>
          ) : null}
          {progressLabel ? <span className="chip chip-soft">{progressLabel}</span> : null}
          {saveOk !== undefined ? (
            <span className="save-status" aria-live="polite">
              <span className={`save-dot${saveOk === false ? " warn" : ""}`} />
              {saveOk === false ? "الحفظ التلقائي غير متاح" : "الحفظ التلقائي مفعّل"}
            </span>
          ) : null}
          {showReview && onReview ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onReview}>
              <IconList size={15} />
              مراجعة الإجابات
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onTeacherKey}>
            <IconKey size={15} />
            المفتاح التعليمي
          </button>
          <a
            className="contact-chip"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="تواصل عبر واتساب"
          >
            <IconWhatsApp size={15} />
            <span dir="rtl">{CONTACT_LABEL}</span>
          </a>
        </div>
      </div>
      {studentName ? (
        <div className="shell pb-2">
          <p className="m-0 text-[0.76rem]" style={{ color: "#8a7181" }}>
            الطالب:{" "}
            <span style={{ color: "#5a3449", fontWeight: 700 }}>{studentName}</span>
            <span className="mx-2 opacity-40">|</span>
            المبحث: الرياضيات
            <span className="mx-2 opacity-40">|</span>
            الدرجة الكلية: 100
          </p>
        </div>
      ) : null}
    </header>
  );
}

export function ContactBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2"
      style={{ borderColor: "#e8d9e0", background: "rgba(255,255,255,0.65)" }}
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-xl"
        style={{ background: "#fbeef4", color: "#9c3f61" }}
        aria-hidden
      >
        <IconBook size={16} />
      </span>
      <div className="leading-tight">
        <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>
          إعداد ومتابعة
        </p>
        <p className="m-0 text-[0.84rem] font-bold" style={{ color: "#523447" }}>
          {CONTACT_LABEL}
        </p>
      </div>
      <a
        className="contact-chip ms-auto"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconWhatsApp size={15} />
        واتساب
      </a>
      {!compact ? (
        <p className="m-0 w-full text-[0.68rem]" style={{ color: "#9a8394" }}>
          لأي استفسار عن الاختبار. لا تُرسل النتائج أو التقارير عبر واتساب أو البريد.
        </p>
      ) : null}
    </div>
  );
}

export function SiteFooter({ onTeacherKey }: { onTeacherKey: () => void }) {
  return (
    <footer className="site-footer no-print">
      <div className="shell py-5">
        <ContactBlock />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.75rem]" style={{ color: "#8a7181" }}>
          <p className="m-0">
            {EXAM_TITLE} · الرياضيات · الصف السادس الأساسي · 30 سؤالاً · 100 درجة
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a className="footer-link" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              التواصل عبر واتساب
            </a>
            <button type="button" className="footer-link" onClick={onTeacherKey}>
              المفتاح التعليمي (للمعلم)
            </button>
          </div>
        </div>
        <p className="m-0 mt-2 text-[0.68rem]" style={{ color: "#a08a98" }}>
          اختبار إلكتروني محلي: يُحفظ التقدم في متصفح هذا الجهاز فقط، ويُنشأ تقرير TXT محلياً، وتُرسَل
          النتيجة إلى المعلّم عند التسليم.
        </p>
      </div>
    </footer>
  );
}

export function ExamInfoStrip({ answered, total }: { answered: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip chip-gold">
        <IconList size={13} />
        أجزاء الأسئلة
      </span>
      <span className="chip chip-soft" style={{ fontVariantNumeric: "tabular-nums" }}>
        {answered} / {total} مُجاب
      </span>
    </div>
  );
}

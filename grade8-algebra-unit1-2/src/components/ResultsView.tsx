import type { StoredAttempt } from '../lib/storage';
import type { ExamResult } from '../lib/exam';
import { DIFFICULTY_LABEL, EXAM_META, marksWord } from '../lib/exam';
import type { SendStatus } from '../lib/submit';
import { formatDuration, formatTimestamp } from '../lib/time';
import { RichText } from './Math';
import { LogoMark, DownloadIcon, RetryIcon, LockIcon, ClockIcon, CheckIcon, AlertIcon, FileIcon, ShieldIcon } from './Icons';

interface ResultsViewProps {
  attempt: StoredAttempt;
  result: ExamResult;
  downloadNote: string;
  reportFilename: string;
  sendStatus: SendStatus;
  onResend: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onTeacher: () => void;
}

const SEND_META: Record<SendStatus, { title: string; note: string }> = {
  idle: {
    title: 'النتيجة لم تُرسل بعد',
    note: 'يمكنك إرسال النتيجة إلى معلّمك الآن. تنزيل تقرير TXT يعمل دائمًا بغض النظر عن نتيجة الإرسال.',
  },
  sending: {
    title: 'جارٍ إرسال النتيجة إلى المعلّم…',
    note: 'الإرسال يجري في الخلفية، ويمكنك متابعة النتيجة وتنزيل التقرير في الأثناء.',
  },
  success: {
    title: 'تم إرسال النتيجة إلى المعلّم ✓',
    note: 'وصلت النتيجة. تُحتسب كل محاولة مرة واحدة عند المعلّم حتى لو أُعيد إرسالها.',
  },
  failed: {
    title: 'تعذّر إرسال النتيجة تلقائيًا',
    note: 'النتيجة محفوظة في هذا المتصفح وستُعاد المحاولة تلقائيًا عند فتح الاختبار من جديد. يمكنك إعادة الإرسال الآن، أو تنزيل التقرير وإرساله لمعلّمك.',
  },
};

const statusLabels = {
  correct: 'صحيح',
  partial: 'جزئي',
  incorrect: 'خطأ',
  unanswered: 'غير مجاب',
} as const;

function performanceBand(percentage: number) {
  if (percentage >= 90) return { title: 'إتقان متميّز', note: 'أداء عالٍ وثقة رياضية واضحة. حافظ على دقة التبرير لا الحساب فقط.', tone: 'cyan' };
  if (percentage >= 75) return { title: 'أداء متقدّم', note: 'أساس قوي، مع فرص لتحسين الخطوات التطبيقية والتحليلية.', tone: 'aqua' };
  if (percentage >= 60) return { title: 'أداء جيد', note: 'الكفايات الأساسية حاضرة. راجع الأخطاء لتثبيت القواعد المركبة.', tone: 'violet' };
  if (percentage >= 50) return { title: 'أساس راسخ', note: 'نتيجة عابرة جيدة. ابدأ بمراجعة قواعد الإشارات والكسور والقوى.', tone: 'amber' };
  return { title: 'يحتاج إلى مراجعة', note: 'النتيجة مؤقتة، لا حكم نهائي. استخدم التقرير لبناء خطة مراجعة مركزة.', tone: 'rose' };
}

export function ResultsView({
  attempt,
  result,
  downloadNote,
  reportFilename,
  sendStatus,
  onResend,
  onDownload,
  onRetry,
  onTeacher,
}: ResultsViewProps) {
  const band = performanceBand(result.percentage);
  const duration = attempt.elapsedMs ?? (attempt.submittedAt ? attempt.submittedAt - attempt.startedAt : 0);
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - Math.min(1, result.earned / result.max));

  return (
    <div className="results-screen">
      <header className="site-header results-header">
        <a className="brand" href="#results" onClick={(e) => e.preventDefault()} aria-label="ALGEBRA NEXUS — النتائج">
          <LogoMark size={40} />
          <span className="brand-copy">
            <span className="brand-en" dir="ltr">ALGEBRA NEXUS</span>
            <span className="brand-ar">تقرير النتيجة</span>
          </span>
        </a>
        <div className="header-actions">
          <span className="header-cohort"><span className="pulse-dot" aria-hidden="true" />تم التسليم</span>
          <button type="button" className="btn btn-ghost btn-small" onClick={onTeacher}>
            <LockIcon size={15} />
            مساحة المعلّم
          </button>
        </div>
      </header>

      <main className="page-container results-page">
        <section className={`results-hero band-${band.tone}`}>
          <div className="results-hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              FINAL REPORT · نتيجة معتمدة
            </div>
            <p className="results-student-label">الطالب</p>
            <h1 className="results-student-name">{attempt.studentName}</h1>
            <h2 className="results-exam-title">{EXAM_META.arabicTitle}</h2>
            <div className="results-meta-line">
              <span>{EXAM_META.grade}</span>
              <i aria-hidden="true" />
              <span>{EXAM_META.subject}</span>
              <i aria-hidden="true" />
              <span>الوحدتان 01 و02</span>
            </div>
            <div className="performance-banner">
              <span className="performance-icon"><CheckIcon size={18} /></span>
              <div>
                <strong>{band.title}</strong>
                <p>{band.note}</p>
              </div>
            </div>
          </div>

          <div className="score-panel glass-card">
            <div className="score-ring-wrap">
              <svg viewBox="0 0 200 200" className="score-ring" role="img" aria-label={`الدرجة ${result.earned} من ${result.max}`}>
                <defs>
                  <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34e7ff" />
                    <stop offset="55%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r={radius} className="score-ring-track" />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  className="score-ring-fill"
                  strokeDasharray={circumference}
                  strokeDashoffset={dash}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="score-ring-center">
                <span className="score-value" dir="ltr">{result.earned}</span>
                <span className="score-outof">/ {result.max}</span>
                <span className="score-percent" dir="ltr">{result.percentage}%</span>
              </div>
            </div>
            <div className="score-panel-footer">
              <span>الدرجة النهائية</span>
              <span className="score-verdict"><ShieldIcon size={14} /> تم التصحيح آليًا</span>
            </div>
          </div>
        </section>

        <section className="counts-grid" aria-label="ملخص حالات الأجزاء">
          <div className="count-card status-correct">
            <div className="count-card-top"><span className="count-icon"><CheckIcon size={16} /></span><span>صحيح</span></div>
            <strong>{result.counts.correct}</strong>
            <p>أجزاء كاملة العلامة</p>
          </div>
          <div className="count-card status-partial">
            <div className="count-card-top"><span className="count-icon"><span className="half-mark">½</span></span><span>جزئي</span></div>
            <strong>{result.counts.partial}</strong>
            <p>أجزاء بعلامة جزئية</p>
          </div>
          <div className="count-card status-incorrect">
            <div className="count-card-top"><span className="count-icon"><span className="cross-mark">×</span></span><span>خطأ</span></div>
            <strong>{result.counts.incorrect}</strong>
            <p>إجابات غير صحيحة</p>
          </div>
          <div className="count-card status-unanswered">
            <div className="count-card-top"><span className="count-icon"><span className="status-hollow" /></span><span>غير مجاب</span></div>
            <strong>{result.counts.unanswered}</strong>
            <p>أجزاء بلا إجابة</p>
          </div>
        </section>


        <section
          className={`send-panel glass-card send-${sendStatus}`}
          data-send-status={sendStatus}
          aria-live="polite"
          aria-label="حالة إرسال النتيجة إلى المعلّم"
        >
          <div className="send-panel-copy">
            <span className="send-panel-icon" aria-hidden="true">
              {sendStatus === 'success' ? <CheckIcon size={18} /> : sendStatus === 'failed' ? <AlertIcon size={18} /> : <ShieldIcon size={18} />}
            </span>
            <div>
              <strong>{SEND_META[sendStatus].title}</strong>
              <p>{SEND_META[sendStatus].note}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-small send-resend-btn"
            onClick={onResend}
            disabled={sendStatus === 'sending'}
          >
            <RetryIcon size={16} />
            إعادة إرسال النتيجة
          </button>
        </section>

        <section className="results-info-grid">
          <div className="result-info-card glass-card">
            <div className="result-info-head"><ClockIcon size={17} /><span>سجل الوقت</span></div>
            <div className="result-info-row"><span>المدة المنقضية</span><b dir="ltr">{formatDuration(duration)}</b></div>
            <div className="result-info-row"><span>وقت التسليم</span><b dir="ltr">{formatTimestamp(attempt.submittedAt)}</b></div>
            <div className="result-info-row"><span>طريقة المؤقّت</span><b>تصاعدي · أختام زمنية</b></div>
          </div>
          <div className="result-info-card glass-card">
            <div className="result-info-head"><FileIcon size={17} /><span>تقرير النتيجة</span></div>
            <p className="report-file-label">اسم الملف</p>
            <p className="report-filename" dir="ltr">{reportFilename}</p>
            <p className="report-file-note">{downloadNote}</p>
          </div>
          <div className="result-info-card glass-card">
            <div className="result-info-head"><AlertIcon size={17} /><span>قراءة النتيجة</span></div>
            <div className="status-breakdown-bar" aria-hidden="true">
              <span className="seg-correct" style={{ flexGrow: Math.max(result.counts.correct, 0.5) }} />
              <span className="seg-partial" style={{ flexGrow: Math.max(result.counts.partial, 0.5) }} />
              <span className="seg-incorrect" style={{ flexGrow: Math.max(result.counts.incorrect, 0.5) }} />
              <span className="seg-unanswered" style={{ flexGrow: Math.max(result.counts.unanswered, 0.5) }} />
            </div>
            <ul className="status-legend">
              <li><i className="seg-correct" /> صحيح <b>{result.counts.correct}</b></li>
              <li><i className="seg-partial" /> جزئي <b>{result.counts.partial}</b></li>
              <li><i className="seg-incorrect" /> خطأ <b>{result.counts.incorrect}</b></li>
              <li><i className="seg-unanswered" /> غير مجاب <b>{result.counts.unanswered}</b></li>
            </ul>
          </div>
        </section>

        <section className="results-breakdown" aria-labelledby="breakdown-title">
          <div className="results-section-head">
            <div>
              <span className="section-kicker">QUESTION PERFORMANCE</span>
              <h2 id="breakdown-title">الأداء حسب السؤال</h2>
            </div>
            <span className="breakdown-total">المجموع <b dir="ltr">{result.earned} / {result.max}</b></span>
          </div>
          <div className="breakdown-list">
            {result.questions.map((qr) => (
              <details className={`breakdown-row status-${qr.status}`} key={qr.question.id}>
                <summary>
                  <span className="breakdown-num" dir="ltr">{String(qr.question.number).padStart(2, '0')}</span>
                  <span className="breakdown-title">
                    <strong>{qr.question.title}</strong>
                    <span>{DIFFICULTY_LABEL[qr.question.difficulty]} · {qr.question.marks} {marksWord(qr.question.marks)}</span>
                  </span>
                  <span className="breakdown-score"><b dir="ltr">{qr.earned} / {qr.marks}</b></span>
                  <span className={`breakdown-status status-${qr.status}`}>{statusLabels[qr.status]}</span>
                  <span className="breakdown-chevron" aria-hidden="true">⌄</span>
                </summary>
                <div className="breakdown-detail">
                  {qr.subs.map((sr) => (
                    <div className="breakdown-sub" key={sr.subId}>
                      <span className="breakdown-sub-label">{sr.sub.label}</span>
                      <span className="breakdown-sub-title"><RichText as="span" text={sr.sub.prompt} /></span>
                      <span className="breakdown-sub-marks" dir="ltr">{sr.earned} / {sr.marks}</span>
                      <span className={`mini-status status-${sr.status}`}>{statusLabels[sr.status]}</span>
                    </div>
                  ))}
                  <p className="breakdown-note">لا تُعرض الإجابات الصحيحة أو التفسيرات في لوحة النتيجة. يحتوي تقرير TXT على كامل التفاصيل التصحيحية والمراجع.</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="results-actions">
          <div className="results-action-copy">
            <span className="section-kicker">NEXT STEP</span>
            <h2>وثّق النتيجة أو ابدأ محاولة جديدة</h2>
            <p>التقرير يُنشأ محليًا بصيغة UTF-8 ويحمل اسمك في اسم الملف. إعادة المحاولة تحذف المحاولة الحالية وتعيدك إلى شاشة البداية.</p>
          </div>
          <div className="results-action-buttons">
            <button type="button" className="btn btn-secondary" onClick={onDownload}>
              <DownloadIcon size={18} />
              تنزيل التقرير TXT
            </button>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              <RetryIcon size={18} />
              إعادة المحاولة
            </button>
          </div>
        </section>

        <p className="results-privacy">
          <ShieldIcon size={15} />
          تقرير TXT يُنشأ داخل متصفحك، وتُرسل النتيجة إلى معلّمك فقط عبر خدمة النتائج. استخدم زر التنزيل كنسخة احتياطية إذا منع المتصفح التنزيل التلقائي.
        </p>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><LogoMark size={24} /><span dir="ltr">ALGEBRA NEXUS</span></div>
        <p>نتيجة مولّدة محليًا · {EXAM_META.version} · محاولة {attempt.attemptId.slice(0, 8)}</p>
        <span className="footer-mark" dir="ltr">N / 08</span>
      </footer>
    </div>
  );
}

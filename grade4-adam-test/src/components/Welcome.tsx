import { useState } from "react";
import {
  EXAM_TITLE,
  GRADE_LABEL,
  QUESTIONS,
  SUBJECT_LABEL,
  TOTAL_MARKS,
  ALL_SUBPARTS,
} from "../exam/data";
import { Notice } from "./Chrome";
import { BlockArt } from "./Visuals";

interface WelcomeProps {
  onStart: (name: string) => void;
  storageWarning: string | null;
  initialName?: string;
}

export function Welcome({ onStart, storageWarning, initialName = "" }: WelcomeProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("يلزم إدخال اسم الطالب قبل بدء الاختبار.");
      document.getElementById("student-name")?.focus();
      return;
    }
    if (trimmed.length > 60) {
      setError("اسم الطالب طويل جداً. اكتب اسماً لا يزيد على 60 حرفاً.");
      return;
    }
    setError(null);
    onStart(trimmed);
  }

  return (
    <div className="welcome-page">
      <section className="welcome-hero">
        <div className="welcome-copy">
          <div className="eyebrow">
            <span className="pixel-diamond" aria-hidden="true" />
            امتحان رسمي · عالم المكعبات
          </div>
          <h1 className="exam-title">{EXAM_TITLE}</h1>
          <p className="hero-lede">
            اختبار رياضيات للصف الرابع الأساسي مبني على صفحات الكتاب المقرّرة. انطلق في مغامرة من الأعداد
            والتمثيلات البيانية وشبكات الإحداثيات، وأكمل جميع الأجزاء قبل التسليم.
          </p>
          <div className="hero-tags">
            <span className="tag">{GRADE_LABEL}</span>
            <span className="tag">{SUBJECT_LABEL}</span>
            <span className="tag tag-emerald">٣٠ سؤالاً · ٧١ جزءاً · ١٠٠ درجة</span>
          </div>
        </div>
        <div className="welcome-art">
          <BlockArt />
          <div className="art-plaque">
            <span className="mini-grass" aria-hidden="true" />
            <span>ساحة التدريب</span>
            <span className="art-coord" dir="ltr">
              (7, 5)
            </span>
          </div>
        </div>
      </section>

      {storageWarning && <Notice tone="warning">{storageWarning}</Notice>}

      <section className="welcome-grid">
        <div className="card welcome-start-card">
          <div className="card-heading-row">
            <div>
              <h2 className="card-title">دخول الطالب</h2>
              <p className="muted">اكتب اسمك كما تريده في التقرير النهائي.</p>
            </div>
            <span className="required-pill">إلزامي</span>
          </div>
          <form onSubmit={submit} noValidate>
            <label htmlFor="student-name" className="field-label">
              اسم الطالب
            </label>
            <div className="name-row">
              <span className="name-avatar" aria-hidden="true">
                <span className="avatar-head" />
                <span className="avatar-body" />
              </span>
              <input
                id="student-name"
                className="text-input name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="مثال: آدم"
                autoComplete="name"
                maxLength={60}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "name-error" : undefined}
              />
            </div>
            {error && (
              <p className="field-error" id="name-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="button button-primary button-start">
              <span className="play-triangle" aria-hidden="true" />
              بدء الاختبار
            </button>
            <p className="fine-print">
              عند بدء الاختبار تبدأ ساعة العدّ التصاعدي، ويُفعّل حفظ الإجابات تلقائياً عند توفر التخزين المحلي في المتصفح.
            </p>
            <p className="fine-print">سيتم إرسال نتيجتك إلى معلّمك عند التسليم.</p>
          </form>
        </div>

        <div className="card briefing-card">
          <h2 className="card-title">خريطة الاختبار</h2>
          <div className="briefing-stats">
            <div className="brief-stat">
              <span className="brief-value">{QUESTIONS.length}</span>
              <span className="brief-label">أسئلة رئيسة</span>
            </div>
            <div className="brief-stat">
              <span className="brief-value">{ALL_SUBPARTS.length}</span>
              <span className="brief-label">أجزاء مستقلة</span>
            </div>
            <div className="brief-stat">
              <span className="brief-value">{TOTAL_MARKS}</span>
              <span className="brief-label">درجة كاملة</span>
            </div>
          </div>
          <ul className="brief-list">
            <li>
              <span className="check-block" aria-hidden="true">▦</span>
              الأسئلة موزعة على التمثيل البياني، وشبكة الإحداثيات، والأنماط، والأعداد، والمقارنة، والتقريب، والجمع.
            </li>
            <li>
              <span className="check-block" aria-hidden="true">▦</span>
              يمكنك التنقل بين الأسئلة وتعديل إجاباتك، ومراجعة الأجزاء غير المجابة قبل التسليم.
            </li>
            <li>
              <span className="check-block" aria-hidden="true">▦</span>
              لا تظهر أي إجابات أو ملاحظات تصحيح قبل التسليم النهائي.
            </li>
            <li>
              <span className="check-block" aria-hidden="true">▦</span>
              يجب الإجابة عن جميع الأجزاء المطلوبة؛ يبقى زر التسليم معطّلاً حتى تكتمل.
            </li>
          </ul>
          <p className="room-note">
            <span className="pixel-dot dot-gold" aria-hidden="true" />
            الجهاز يحفظ تقدّمك. إذا أغلقت الصفحة يمكنك المتابعة من الموضع نفسه.
          </p>
        </div>
      </section>

      <section className="welcome-strip" aria-label="معلومات الاختبار">
        <div>
          <span className="strip-key">العنوان</span>
          <strong>{EXAM_TITLE}</strong>
        </div>
        <div>
          <span className="strip-key">الصف</span>
          <strong>{GRADE_LABEL}</strong>
        </div>
        <div>
          <span className="strip-key">المادة</span>
          <strong>{SUBJECT_LABEL}</strong>
        </div>
        <div>
          <span className="strip-key">الساعة</span>
          <strong>عدّ تصاعدي</strong>
        </div>
        <div>
          <span className="strip-key">التسليم</span>
          <strong>تقرير TXT محلي</strong>
        </div>
      </section>
    </div>
  );
}

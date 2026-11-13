import { useState } from 'react';
import { EXAM_META, validation } from '../lib/exam';
import { MathTex } from './Math';
import { LogoMark, LockIcon, SparkIcon, CheckIcon, ClockIcon, ShieldIcon, AlertIcon, ArrowLeft } from './Icons';

interface CoverProps {
  initialName: string;
  onStart: (name: string) => void;
  onTeacher: () => void;
  storageError: string | null;
}

const instructions = [
  '15 سؤالًا رئيسًا، ولكل سؤال أجزاء مترابطة تُقيّم مهارات مختلفة.',
  'الاسم الكامل مطلوب قبل البدء، ويُستخدم في تقرير النتيجة ويُرسل إلى معلّمك.',
  'المؤقّت تصاعدي ولا يبدأ إلا بعد الضغط على «ابدأ الاختبار».',
  'يمكنك التنقل بين الأسئلة وتغيير إجاباتك قبل التسليم.',
  'تُحفظ الإجابات محليًا على هذا الجهاز، وتُستعاد عند إعادة فتح الصفحة.',
  'لا تُعرض الإجابات الصحيحة أو التلميحات أثناء الاختبار.',
];

export function Cover({ initialName, onStart, onTeacher, storageError }: CoverProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) {
      setError('يرجى إدخال الاسم الكامل قبل بدء الاختبار.');
      return;
    }
    setError('');
    onStart(trimmed);
  };

  return (
    <div className="cover-screen">
      <header className="site-header">
        <a className="brand" href="#cover" aria-label="ALGEBRA NEXUS — الصفحة الرئيسية" onClick={(e) => e.preventDefault()}>
          <LogoMark size={42} />
          <span className="brand-copy">
            <span className="brand-en" dir="ltr">ALGEBRA NEXUS</span>
            <span className="brand-ar">منصّة التقييم الرياضي</span>
          </span>
        </a>
        <div className="header-actions">
          <span className="header-cohort">
            <span className="pulse-dot" aria-hidden="true" />
            الصف الثامن · الجبر
          </span>
          <button type="button" className="btn btn-ghost btn-small" onClick={onTeacher}>
            <LockIcon size={15} />
            مساحة المعلّم
          </button>
        </div>
      </header>

      <main className="page-container">
        {storageError && (
          <div className="notice notice-warning" role="alert">
            <AlertIcon size={18} />
            <span>{storageError} لن يتم ادعاء نجاح الحفظ إن تعذر.</span>
          </div>
        )}

        <section className="hero-grid" aria-labelledby="cover-title">
          <div className="hero-copy">
            <div className="cover-identity">
              <span className="cover-identity-en" dir="ltr">ALGEBRA NEXUS</span>
              <span className="cover-identity-dash" aria-hidden="true">—</span>
              <span className="cover-identity-sub" dir="ltr">THE MATHEMATICAL CHALLENGE</span>
            </div>
            <div className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              اختبار نهاية الوحدتين · إصدار 2026
            </div>
            <p className="cover-exam-title">اختبار الجبر التفاعلي — الوحدتان الأولى والثانية · الصف الثامن</p>
            <h1 id="cover-title" className="hero-title">
              تحدٍّ واحد.
              <br />
              <span className="gradient-text">وحدتان.</span> صورة كاملة
              <br />
              عن قدراتك.
            </h1>
            <p className="hero-subtitle">
              تجربة تقييم متكاملة في الأعداد العادية وعملياتها، وقوى الأعداد العادية والجذور.
              أسئلة متشابكة، تبرير رياضي، وتحليل أخطاء — بلا تلميحات وبلا اختصارات.
            </p>
            <div className="hero-meta-row">
              <span className="meta-chip"><CheckIcon size={14} /> تم التحقق الآلي من 100 درجة</span>
              <span className="meta-chip"><ShieldIcon size={14} /> تقرير TXT محلي + إرسال للمعلّم</span>
            </div>
            <div className="hero-stats" aria-label="ملخص الاختبار">
              <div className="hero-stat">
                <span className="hero-stat-value">15</span>
                <span className="hero-stat-label">سؤالًا رئيسًا</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">100</span>
                <span className="hero-stat-label">درجة نهائية</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">{validation.subpartCount}</span>
                <span className="hero-stat-label">جزءًا مستقلًا</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">02</span>
                <span className="hero-stat-label">وحدة مشمولة</span>
              </div>
            </div>
          </div>

          <aside className="hero-visual" aria-hidden="true">
            <div className="equation-orbit">
              <div className="orbit-ring orbit-ring-one" />
              <div className="orbit-ring orbit-ring-two" />
              <div className="orbit-core">
                <LogoMark size={84} />
                <span className="orbit-word" dir="ltr">NEXUS</span>
                <span className="orbit-sub">MATHEMATICAL CHALLENGE</span>
              </div>
              <div className="orbit-node orbit-node-a">
                <MathTex tex={String.raw`\frac{7}{12}+\frac{5}{8}`} />
              </div>
              <div className="orbit-node orbit-node-b">
                <MathTex tex={String.raw`10^{-3}`} />
              </div>
              <div className="orbit-node orbit-node-c">
                <MathTex tex={String.raw`\sqrt{50}=5\sqrt{2}`} />
              </div>
              <div className="orbit-caption">
                <SpanTitle />
              </div>
            </div>
          </aside>
        </section>

        <section className="cover-columns" aria-label="بيانات الاختبار وبدء المحاولة">
          <div className="unit-overview">
            <div className="section-heading">
              <span className="section-kicker">COVERAGE / 01–02</span>
              <h2>النطاق الدراسي المشمول</h2>
              <p>تغطية مقصودة لكل درس مسجّل في الوحدتين، وفق محتوى المصدر لا وفق قائمة عناوين فقط.</p>
            </div>
            <div className="unit-cards">
              {EXAM_META.units.map((unit) => (
                <article key={unit.number} className="unit-card">
                  <div className="unit-card-top">
                    <span className="unit-number" dir="ltr">UNIT {unit.number}</span>
                    <span className="unit-pages">{unit.pages}</span>
                  </div>
                  <h3>{unit.title}</h3>
                  <ul className="unit-lessons">
                    {unit.lessons.map((lesson) => (
                      <li key={lesson}>
                        <span className="unit-lesson-dot" aria-hidden="true" />
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="entry-card glass-card">
            <div className="entry-card-head">
              <span className="entry-icon"><LockIcon size={20} /></span>
              <div>
                <span className="section-kicker">STUDENT ENTRY</span>
                <h2>بطاقة الدخول</h2>
              </div>
            </div>
            <p className="entry-lead">سجّل اسمك الكامل لبدء محاولة جديدة. سيظهر هذا الاسم في تقرير النتيجة.</p>
            <form onSubmit={handleSubmit} className="entry-form" noValidate>
              <div className={`name-field ${error ? 'has-error' : ''}`}>
                <label htmlFor="student-name">اسم الطالب الكامل</label>
                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError('');
                  }}
                  placeholder="مثال: محمد أحمد الخطيب"
                  autoComplete="name"
                  maxLength={80}
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'name-error' : 'name-hint'}
                  dir="rtl"
                />
                {error ? (
                  <p className="field-error" id="name-error" role="alert">{error}</p>
                ) : (
                  <p className="field-hint" id="name-hint">الاسم إلزامي، ويُستخدم في التقرير ويُرسل إلى معلّمك.</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary btn-start">
                <span>ابدأ الاختبار</span>
                <ArrowLeft size={19} />
              </button>
            </form>
            <div className="entry-facts">
              <div><ClockIcon size={16} /><span>المؤقّت يبدأ مع السؤال الأول</span></div>
              <div><CheckIcon size={16} /><span>حفظ تلقائي واستعادة للمحاولة</span></div>
              <div><ShieldIcon size={16} /><span>تُرسل النتيجة إلى معلّمك فقط</span></div>
            </div>
          </div>
        </section>

        <section className="instructions-section" aria-labelledby="instructions-title">
          <div className="section-heading instructions-heading">
            <span className="section-kicker">BEFORE YOU BEGIN</span>
            <h2 id="instructions-title">إرشادات الاختبار</h2>
          </div>
          <ol className="instruction-grid">
            {instructions.map((item, index) => (
              <li key={item} className="instruction-item">
                <span className="instruction-number" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rhythm-strip" aria-label="خريطة الاختبار">
          <div className="rhythm-copy">
            <span className="section-kicker">EXAM RHYTHM</span>
            <h2>من التمهيد إلى التحليل</h2>
            <p>مستويات محسوبة: 3 أسئلة تمهيدية، 5 متوسطة، 5 تطبيقية متقدّمة، وسؤالان للتفكير وتحليل الخطأ.</p>
          </div>
          <div className="rhythm-bars" aria-hidden="true">
            {[
              { label: 'تمهيدي', count: 3, tone: 'cyan' },
              { label: 'متوسط', count: 5, tone: 'blue' },
              { label: 'تطبيقي', count: 5, tone: 'violet' },
              { label: 'تحليل', count: 2, tone: 'pink' },
            ].map((item) => (
              <div key={item.label} className={`rhythm-bar tone-${item.tone}`}>
                <span className="rhythm-count">{item.count}</span>
                <span className="rhythm-label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <LogoMark size={26} />
          <span dir="ltr">ALGEBRA NEXUS</span>
        </div>
        <p>اختبار تعليمي. يُنشأ تقرير TXT داخل متصفح الطالب، وتُرسل النتيجة إلى معلّمك عبر خدمة النتائج فقط.</p>
        <button type="button" className="footer-link" onClick={onTeacher}>
          <LockIcon size={14} /> مساحة المعلّم
        </button>
      </footer>
    </div>
  );
}

function SpanTitle() {
  return (
    <div className="orbit-caption-inner">
      <SparkIcon size={14} />
      <span>مصمّم للتقييم الدقيق</span>
    </div>
  );
}

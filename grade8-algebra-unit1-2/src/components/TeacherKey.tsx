import { useEffect, useRef, useState } from 'react';
import { questions, correctAnswerText, validation, DIFFICULTY_LABEL, marksWord } from '../lib/exam';
import { EXAM_META } from '../data/questions';

const examDifficulty = [
  { key: 'foundational', label: 'تمهيدي', count: 3, marks: 18 },
  { key: 'intermediate', label: 'متوسط', count: 5, marks: 35 },
  { key: 'advanced', label: 'تطبيقي متقدّم', count: 5, marks: 36 },
  { key: 'reasoning', label: 'تفكير وتحليل خطأ', count: 2, marks: 11 },
];

/** Assessment coverage by registered source lesson (main question numbers). */
const coverageQuestions: Record<string, string> = {
  'انطلاقة نشطة (ص3–4)': '8',
  'الجمع والطرح (ص5–7)': '1، 8، 15',
  'الضرب (ص8–11)': '4، 13',
  'القسمة (ص12–16)': '5، 10',
  'تمارين الوحدة الأولى (ملف التمارين المدمج)': '13',
  'انطلاقة نشطة (ص25)': '2',
  'قوى العدد 10 (ص26–28)': '2',
  'قواعد قوى العدد 10 (ص29–31)': '6، 9',
  'قوى صحيحة لعدد نسبي (ص32–34)': '3، 11، 14',
  'الجذور التربيعية (ص35–37)': '7، 12',
  'تمارين ومسائل الوحدة الثانية (39 سؤالًا)': '9، 12، 14',
};
import { RichText } from './Math';
import { CloseIcon, LockIcon, AlertIcon, CheckIcon, LogoMark, ShieldIcon } from './Icons';

const TEACHER_PASSWORD = 'somer173';

interface TeacherKeyProps {
  open: boolean;
  onClose: () => void;
}

export function TeacherKey({ open, onClose }: TeacherKeyProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setError('');
    setUnlocked(false);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="teacher-overlay" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
      <div className="teacher-modal">
        <header className="teacher-modal-head">
          <div className="teacher-title-wrap">
            <span className="teacher-icon"><LockIcon size={19} /></span>
            <div>
              <span className="section-kicker">TEACHER ACCESS · ANSWER KEY</span>
              <h2 id="teacher-title">مساحة المعلّم ومفتاح الإجابة</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق مساحة المعلّم">
            <CloseIcon size={19} />
          </button>
        </header>

        {!unlocked ? (
          <div className="teacher-gate">
            <div className="gate-visual" aria-hidden="true">
              <LogoMark size={76} />
              <span className="gate-ring" />
            </div>
            <div className="gate-copy">
              <h3>مساحة المعلّم للتصحيح والمراجعة</h3>
              <p>أدخل كلمة مرور المعلّم للاطلاع على الإجابات الكاملة، قواعد العلامات، الأخطاء الشائعة، والمراجع الداخلية لكل جزء.</p>
              <form onSubmit={handleUnlock} className="gate-form">
                <label htmlFor="teacher-password">كلمة المرور</label>
                <div className="gate-input-row">
                  <input
                    ref={inputRef}
                    id="teacher-password"
                    name="teacher-password"
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="current-password"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'teacher-error' : 'teacher-hint'}
                    placeholder="••••••••"
                  />
                  <button type="submit" className="btn btn-primary">فتح المساحة</button>
                </div>
                {error && <p className="field-error" id="teacher-error" role="alert"><AlertIcon size={14} />{error}</p>}
                <p className="gate-hint" id="teacher-hint">
                  <LockIcon size={13} />
                  بوابة وصول في ملف ثابت. هي حاجز واجهة للاستخدام الصفّي، وليست مصادقة حقيقية أو تشفيرًا.
                </p>
              </form>
            </div>
          </div>
        ) : (
          <div className="teacher-content">
            <div className="teacher-toolbar">
              <div className="teacher-security-note">
                <ShieldIcon size={16} />
                <span>هذه البوابة ليست تشفيرًا. لا تُدرج كلمة المرور في أي تقرير طالب.</span>
              </div>
              <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>إغلاق المفتاح</button>
            </div>

            <div className="teacher-summary">
              <div><strong>15</strong><span>سؤالًا رئيسًا</span></div>
              <div><strong>100</strong><span>درجة إجمالية</span></div>
              <div><strong>{validation.subpartCount}</strong><span>جزءًا قابلًا للتصحيح</span></div>
              <div><strong>{validation.branchedCount}</strong><span>سؤالًا متفرعًا</span></div>
              <div><strong>{validation.ok ? '✓' : '!'}</strong><span>تحقق المجموع</span></div>
            </div>

            <section className="teacher-block">
              <h3>مصفوفة التغطية المسجّلة</h3>
              <p>تغطي المحاولة جميع الدروس المسجّلة في الوحدتين، بما فيها الانطلاقة النشطة وملف التمارين، مع أسئلة جديدة لا نسخًا لأسئلة المنصة.</p>
              <div className="coverage-matrix">
                {EXAM_META.units.map((unit) => (
                  <div className="coverage-unit" key={unit.number}>
                    <h4>الوحدة {unit.number}: {unit.title} <span>{unit.pages}</span></h4>
                    <ul>
                      {unit.lessons.map((lesson) => (
                        <li key={lesson}>
                          <CheckIcon size={12} />
                          <span>{lesson}</span>
                          {coverageQuestions[lesson] && (
                            <span className="coverage-q">س {coverageQuestions[lesson]}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="source-boundary-note">
                تدقيق حدود المصدر: سجل المنهج يحدد الوحدة الأولى في الصفحات 3–16، ويحمل ملف الدرس الرابع (تمارين الوحدة) مراجع الصفحات 17–23 كما وردت في المصدر الأصلي. أُبقيت المراجع الفعلية للتمارين مع تمييزها في مرجع كل جزء، ولم تُنشأ صفحات غير موجودة. تمارين الوحدة الثانية مرقّمة 1–39 في ملف المصدر دون أرقام صفحات مطبوعة، فاستُخدم وسم التمرين لا رقم صفحة مفترض.
              </p>
            </section>

            <section className="teacher-block">
              <h3>توزيع الصعوبة والعلامات</h3>
              <div className="difficulty-table">
                {examDifficulty.map((row) => (
                  <div className="difficulty-row" key={row.key}>
                    <span>{row.label}</span>
                    <span>{row.count} أسئلة</span>
                    <span dir="ltr">{row.marks} marks</span>
                  </div>
                ))}
                <div className="difficulty-row total-row">
                  <span>المجموع</span><span>15 سؤالًا</span><span dir="ltr">100 marks</span>
                </div>
              </div>
              <p className="teacher-note">تُقبل الصور الكسرية المكافئة المضبوطة، وتُحتسب حالة «جزئي» في الحقول المنفصلة فقط أو عند فصل الحكم عن التبرير. لا تُستخدم أطراف تفاوت عددية واسعة.</p>
            </section>

            <section className="teacher-keys">
              <div className="teacher-keys-head">
                <h3>مفتاح الإجابة الكامل</h3>
                <p>كل سؤال قابل للفتح. تظهر هنا الإجابات والحلول وحدود الاحتساب والمراجع التي لا يراها الطالب أثناء الاختبار.</p>
              </div>
              {questions.map((question) => (
                <details className="teacher-question" key={question.id}>
                  <summary>
                    <span className="teacher-q-num" dir="ltr">{String(question.number).padStart(2, '0')}</span>
                    <span className="teacher-q-title">
                      <strong>{question.title}</strong>
                      <span>{DIFFICULTY_LABEL[question.difficulty]} · {question.marks} {marksWord(question.marks)} · {question.domain}</span>
                    </span>
                    <span className="teacher-q-open">عرض المفتاح</span>
                    <span className="teacher-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="teacher-question-body">
                    {question.context && <RichText as="p" className="teacher-context" text={question.context} />}
                    {question.subparts.map((part) => (
                      <div className="teacher-sub" key={part.id}>
                        <div className="teacher-sub-head">
                          <span className="teacher-sub-label">الجزء {part.label}</span>
                          <span className="teacher-sub-marks">{part.marks} {marksWord(part.marks)}</span>
                        </div>
                        <RichText as="div" className="teacher-prompt" text={part.prompt} />
                        {part.statement && <RichText as="div" className="teacher-statement" text={`العبارة: ${part.statement}`} />}
                        <div className={`teacher-answer-box ${part.kind === 'order' ? 'order-answer-preview' : ''}`}>
                          <span>الإجابة الصحيحة</span>
                          <RichText as="div" text={correctAnswerText(part)} />
                          {part.kind === 'justify' && (
                            <span className="teacher-verdict">الحكم: {part.correctVerdict === 'true' ? 'موافق' : 'غير موافق'}</span>
                          )}
                        </div>
                        <div className="teacher-detail-block">
                          <h5>الحل الكامل</h5>
                          <RichText as="p" text={part.solution} />
                        </div>
                        <div className="teacher-detail-block">
                          <h5>قواعد العلامات والاحتساب الجزئي</h5>
                          <RichText as="p" text={part.marking} />
                          <RichText as="p" text={part.rationale} />
                        </div>
                        <div className="teacher-detail-block mistakes">
                          <h5>أخطاء شائعة</h5>
                          <RichText as="p" text={part.commonMistakes} />
                        </div>
                        <div className="teacher-source">
                          <strong>المرجع:</strong>
                          <span>{part.source.unit} · {part.source.lesson} · {part.source.page} · {part.source.item}</span>
                          {part.source.note && <em>{part.source.note}</em>}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </section>

            <p className="teacher-disclaimer">
              إفصاح: مفتاح الإجابة جزء من ملف الواجهة الثابت. كلمة المرور تحمي من الوصول العارض فقط ولا توفّر سرية تقنية. لا تُشارك كلمة المرور مع الطلبة.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

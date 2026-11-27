import { ArrowLeft, AlertCircle, Clock3, FileCheck2, ListChecks, Save, UserRound } from 'lucide-react';
import { LESSON_TITLE, QUESTIONS, TOTAL_MARKS } from '../data/exam';
import { Molecule } from './Molecule';
import { QuestionIcon } from './Layout';
export function Entry({ name, onName, error, onStart }: { name: string; onName: (name: string) => void; error: string; onStart: () => void }) {
  return <main className="entry-page page-container">
    <section className="entry-hero">
      <div className="entry-copy">
        <div className="lesson-eyebrow"><span className="eyebrow-line" />الوحدة الأولى <span className="eyebrow-dot">·</span> الدرس الثالث</div>
        <h2>{LESSON_TITLE.split(' ').slice(0, 2).join(' ')}<br /><span>{LESSON_TITLE.split(' ').slice(2).join(' ')}</span></h2>
        <p className="entry-description">اقرأ الصيغة، افهم مكوّناتها، وتحقّق من تعادلها.<br className="desktop-break" /> سبعة أسئلة تضع فهمك للكيمياء موضع التطبيق.</p>
        <div className="exam-meta"><span><ListChecks size={17} /><strong>7</strong> أسئلة</span><span><FileCheck2 size={17} /><strong>{TOTAL_MARKS}</strong> علامة</span><span className="pages-meta">الكتاب المدرسي <b dir="ltr">18–23</b></span></div>
        <form className="entry-form" noValidate onSubmit={e => { e.preventDefault(); onStart(); }}>
          <label htmlFor="student-name">اسم الطالب الكامل <span>قبل بدء الاختبار</span></label>
          <div className={`name-input-wrap ${error ? 'has-error' : ''}`}><UserRound size={19} /><input id="student-name" name="studentName" autoComplete="name" placeholder="اكتب الاسم واللقب" value={name} onChange={e => onName(e.target.value)} maxLength={80} required aria-invalid={!!error} aria-describedby={error ? 'name-error' : 'name-privacy'} /></div>
          {error && <p id="name-error" className="form-error" role="alert"><AlertCircle size={15} />{error}</p>}
          <button type="submit" className="button button-primary start-button"><span>ابدأ الاختبار</span><ArrowLeft size={19} /></button>
          <p id="name-privacy" className="entry-privacy"><Save size={13} />تُحفظ إجاباتك تلقائيًا، ويبدأ الوقت عند البدء فقط.</p>
        </form>
      </div>
      <div className="entry-visual"><Molecule /><div className="visual-caption"><span className="small-status-dot" />مساحة هادئة للتفكير، خطوةً بخطوة.</div></div>
    </section>
    <section className="exam-map" aria-labelledby="map-title"><div className="section-heading"><div><span className="section-kicker">نظرة شاملة</span><h3 id="map-title">خريطة الاختبار</h3></div><span className="section-note">أهداف الدرس الخمسة، في سبع محطات</span></div>
      <div className="question-map-grid">{QUESTIONS.map(q => <div className={`map-item map-item-${q.number}`} key={q.id}><div className="map-item-top"><span className="map-number" dir="ltr">0{q.number}</span><QuestionIcon type={q.icon} size={20} /></div><h4>{q.shortTitle}</h4><span className="map-marks">{q.marks} علامة</span></div>)}</div>
    </section>
    <section className="entry-instructions" aria-label="تعليمات الاختبار"><div><span className="instruction-icon amber"><Clock3 size={20} /></span><div><h4>وقتك مفتوح</h4><p>مؤقّت تصاعدي، بلا حدّ زمني.</p></div></div><div><span className="instruction-icon teal"><Save size={20} /></span><div><h4>تابع من حيث توقّفت</h4><p>تُستعاد محاولتك بعد تحديث الصفحة.</p></div></div><div><span className="instruction-icon violet"><ListChecks size={20} /></span><div><h4>راجع قبل أن تسلّم</h4><p>تنقّل بحرية، والتقرير يظهر بعد التسليم.</p></div></div></section>
  </main>;
}

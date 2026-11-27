import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Clock3, ListChecks, Save, Send } from 'lucide-react';
import { ALL_PARTS, QUESTIONS } from '../data/exam';
import { completedCount, isExamComplete, isPartComplete } from '../lib/grading';
import { formatDuration } from '../lib/session';
import type { AnswerValue, Attempt, Part, Question } from '../lib/types';
import { AnswerControl } from './AnswerControl';
import { ScientificText } from './Chem';
import { ProgressRing, QuestionIcon } from './Layout';
export function PartCard({ part, value, onChange }: { part: Part; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const complete = isPartComplete(part, value);
  return <section className={`part-card ${complete ? 'part-complete' : ''}`} id={part.id} aria-labelledby={`${part.id}-title`}>
    <div className="part-heading"><span className="part-letter">{part.label}</span><div><span className="part-kind">{part.difficulty === 'easy' ? 'فهم أساسي' : part.difficulty === 'medium' ? 'تطبيق' : 'تحدٍّ واستدلال'}</span><h3 id={`${part.id}-title`}>{part.title}</h3></div><span className="marks-badge">{part.marks}<span>علامات</span></span></div>
    <p className="part-prompt"><ScientificText text={part.prompt} /></p>
    <AnswerControl part={part} value={value} onChange={onChange} />
    <div className={`part-status ${complete ? 'is-complete' : ''}`}>{complete ? <CheckCircle2 size={13} /> : <Circle size={12} />}<span>{complete ? 'تمت الإجابة عن هذا الجزء' : 'بانتظار إجابتك'}</span></div>
  </section>;
}
function SubmitButton({ attempt, onSubmit }: { attempt: Attempt; onSubmit: () => void }) {
  return <button type="button" className="button button-primary submit-button" disabled={!isExamComplete(attempt.answers)} onClick={onSubmit}><Send size={16} /><span>تسليم الاختبار</span></button>;
}
export function ExamView({ attempt, elapsed, onAnswer, onNavigate, onSubmit, saved }: { attempt: Attempt; elapsed: number; onAnswer: (id: string, value: AnswerValue) => void; onNavigate: (index: number) => void; onSubmit: () => void; saved: boolean }) {
  const question: Question = QUESTIONS[attempt.currentQuestion];
  const completed = completedCount(attempt.answers), total = ALL_PARTS.length, remaining = total - completed;
  const questionComplete = question.parts.filter(p => isPartComplete(p, attempt.answers[p.id])).length;
  const submitHelp = remaining ? `أكمل ${remaining} جزءًا متبقيًا لتفعيل التسليم.` : 'جميع الأجزاء مكتملة. يمكنك التسليم الآن.';
  return <main className="exam-page page-container">
    <div className="exam-topline"><div className="student-welcome"><span className="student-avatar">{attempt.studentName.charAt(0)}</span><div><span>مساحة الطالب</span><strong>{attempt.studentName}</strong></div></div><div className="exam-lesson-label">الوحدة الأولى <span>/</span> الدرس الثالث <span>/</span> صيغة المركّبات الكيميائية</div><div className="mobile-timer" role="timer" aria-label="الوقت المنقضي"><Clock3 size={16} /><span dir="ltr">{formatDuration(elapsed)}</span></div></div>
    <div className="exam-layout">
      <aside className="exam-sidebar" aria-label="التنقل بين الأسئلة والتسليم">
        <div className="progress-card"><ProgressRing value={completed / total * 100}><strong dir="ltr">{completed}<small> / {total}</small></strong><span>جزءًا مكتملًا</span></ProgressRing><div className="progress-copy"><h3>تقدّمك في الاختبار</h3><p>{remaining ? `بقي ${remaining} جزءًا لتكمل رحلتك` : 'أنهيت جميع الأجزاء. أحسنت!'}</p></div><div className="progress-track" role="progressbar" aria-label="اكتمال الإجابات" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><span style={{ width: `${completed / total * 100}%` }} /></div></div>
        <nav className="question-navigation" aria-label="أسئلة الاختبار">{QUESTIONS.map((q, i) => {
          const done = q.parts.filter(p => isPartComplete(p, attempt.answers[p.id])).length;
          return <button key={q.id} className={`question-nav-item ${i === attempt.currentQuestion ? 'current' : ''} ${done === q.parts.length ? 'done' : ''}`} onClick={() => onNavigate(i)} aria-current={i === attempt.currentQuestion ? 'step' : undefined}><span className="nav-question-number">{done === q.parts.length ? <Check size={16} /> : `0${q.number}`}</span><span className="nav-question-copy"><strong>{q.shortTitle}</strong><span>{q.marks} علامة <i>·</i> {done}/{q.parts.length} أجزاء</span></span>{done > 0 && done < q.parts.length ? <span className="partial-dot" aria-label="مكتمل جزئيًا" /> : i === attempt.currentQuestion ? <ArrowLeft size={15} className="nav-current-arrow" /> : null}</button>;
        })}</nav>
        <div className="sidebar-submit"><SubmitButton attempt={attempt} onSubmit={onSubmit} /><p id="submit-help">{submitHelp}</p><span className="sidebar-save"><Save size={13} />{saved ? 'الحفظ التلقائي مفعّل' : 'الحفظ المحلي غير متاح'}</span></div>
      </aside>
      <div className="question-main" id="question-top">
        <div className="question-main-heading"><div className="question-title-group"><span className={`question-icon tone-${question.number}`}><QuestionIcon type={question.icon} size={26} /></span><div><span className="question-overline">السؤال {question.number} من 7</span><h2>{question.title}</h2></div></div><span className="question-total">{question.marks}<small>علامة</small></span></div>
        <div className="question-description"><p>{question.description}</p><span><ListChecks size={14} />{questionComplete} / {question.parts.length} أجزاء مكتملة</span></div>
        <div className="part-jump-links" aria-label="أجزاء السؤال">{question.parts.map(p => <a key={p.id} href={`#${p.id}`} className={isPartComplete(p, attempt.answers[p.id]) ? 'answered' : ''}><span>{p.label}</span>{isPartComplete(p, attempt.answers[p.id]) ? <Check size={12} /> : <Circle size={10} />}</a>)}</div>
        <div className="question-parts">{question.parts.map(p => <PartCard key={p.id} part={p} value={attempt.answers[p.id]} onChange={value => onAnswer(p.id, value)} />)}</div>
        <div className="question-pagination"><button className="button button-secondary" disabled={attempt.currentQuestion === 0} onClick={() => onNavigate(attempt.currentQuestion - 1)}><ArrowRight size={17} />السؤال السابق</button><span dir="ltr">{attempt.currentQuestion + 1} / 7</span><button className="button button-secondary" disabled={attempt.currentQuestion === 6} onClick={() => onNavigate(attempt.currentQuestion + 1)}>السؤال التالي<ArrowLeft size={17} /></button></div>
        <p className="exam-no-feedback"><CheckCircle2 size={14} />لا تظهر الدرجات أو التصحيحات قبل تسليم الاختبار.</p>
      </div>
    </div>
    <div className="mobile-submit-bar"><div><strong>{completed} من {total} جزءًا</strong><span>{remaining ? `${remaining} جزءًا متبقيًا` : 'جاهز للتسليم'}</span></div><SubmitButton attempt={attempt} onSubmit={onSubmit} /></div>
  </main>;
}

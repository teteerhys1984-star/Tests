import { useState } from 'react';
import { ArrowRight, BookOpen, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { TEACHER_PASSWORD, TEACHER_SESSION_KEY } from '../config';
import { QUESTIONS, TOTAL_MARKS } from '../data/exam';
import { answerText } from '../lib/grading';
import { ScientificText } from './Chem';
import { QuestionIcon } from './Layout';

export function TeacherKey({ onBack }: { onBack: () => void }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(TEACHER_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const unlock = () => {
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError('');
      setPassword('');
      try {
        sessionStorage.setItem(TEACHER_SESSION_KEY, '1');
      } catch {
        /* The current view still unlocks. */
      }
    } else {
      setError('كلمة المرور غير صحيحة. حاول مجددًا.');
    }
  };

  return (
    <main className="teacher-page page-container">
      <button className="text-button teacher-back" onClick={onBack}>
        <ArrowRight size={16} />
        العودة إلى الاختبار
      </button>
      {!unlocked ? (
        <section className="teacher-gate">
          <span className="teacher-gate-icon">
            <LockKeyhole size={32} />
          </span>
          <span className="section-kicker">مساحة المعلّم</span>
          <h2>مفتاح إجابات المعلّم</h2>
          <p>أدخل كلمة المرور للاطّلاع على الحلول الكاملة ومعايير التصحيح.</p>
          <form
            onSubmit={e => {
              e.preventDefault();
              unlock();
            }}
          >
            <label htmlFor="teacher-password">كلمة المرور</label>
            <div className="name-input-wrap">
              <KeyRound size={18} />
              <input
                id="teacher-password"
                type="password"
                autoComplete="off"
                dir="ltr"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'teacher-error' : 'teacher-security'}
              />
            </div>
            {error && (
              <p className="form-error" id="teacher-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary" type="submit">
              فتح مفتاح الإجابات
              <ArrowRight size={17} className="rotate-180" />
            </button>
          </form>
          <p className="teacher-security" id="teacher-security">
            <ShieldCheck size={16} />
            هذه حماية محلية داخل المتصفح (client-side) فقط، وليست مصادقة آمنة أو تشفيرًا.
          </p>
        </section>
      ) : (
        <>
          <div className="teacher-key-heading">
            <span className="teacher-gate-icon">
              <KeyRound size={27} />
            </span>
            <div>
              <span className="section-kicker">مساحة المعلّم · الدرس الثالث</span>
              <h2>مفتاح الإجابات والحلول الكاملة</h2>
              <p>الصفحات 18–23 · سبعة أسئلة · {TOTAL_MARKS} علامة</p>
            </div>
          </div>
          <p className="teacher-security">
            <ShieldCheck size={16} />
            الحماية هنا محلية في المتصفح (client-side) فقط؛ كلمة المرور مضمّنة في شيفرة الواجهة وليست مصادقة آمنة أو تشفيرًا.
          </p>
          <div className="teacher-questions">
            {QUESTIONS.map(q => (
              <section className="teacher-question" key={q.id}>
                <div className="teacher-question-heading">
                  <QuestionIcon type={q.icon} size={23} />
                  <h3>
                    السؤال {q.number}: {q.title}
                  </h3>
                  <span>{q.marks} علامة</span>
                </div>
                {q.parts.map(p => (
                  <article className="teacher-part" key={p.id}>
                    <div className="teacher-part-title">
                      <h4>
                        {p.label}. {p.title}
                      </h4>
                      <span>{p.marks} علامات</span>
                    </div>
                    <p>
                      <ScientificText text={p.prompt} />
                    </p>
                    <div className="teacher-correct">
                      <strong>الإجابة الصحيحة</strong>
                      <p>
                        <ScientificText text={answerText(p, undefined, true)} />
                      </p>
                    </div>
                    <div className="teacher-solution">
                      <strong>الحل والتعليل</strong>
                      <p>
                        <ScientificText text={p.explanation} />
                      </p>
                    </div>
                    <div className="teacher-rubric">
                      <strong>توزيع العلامات والائتمان الجزئي</strong>
                      <ul>
                        {p.rubric.map((line, i) => (
                          <li key={i}>
                            <ScientificText text={line} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="misconception">
                      <strong>مفهوم خاطئ شائع: </strong>
                      <ScientificText text={p.misconception} />
                    </p>
                    <div className="curriculum-reference">
                      <BookOpen size={14} />
                      الكتاب المدرسي، ص{p.reference.pages.join('، ')} · {p.reference.item}
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

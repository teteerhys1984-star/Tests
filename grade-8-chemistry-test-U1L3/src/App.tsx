import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, CheckCircle2, Clock3, Volume2, VolumeX, X } from 'lucide-react';
import { Entry } from './components/Entry';
import { ExamView } from './components/ExamView';
import { Footer } from './components/Layout';
import { Results } from './components/Results';
import { TeacherKey } from './components/TeacherKey';
import { ALL_PARTS, EXAM_TITLE, validateExam } from './data/exam';
import { completedCount, gradeExam } from './lib/grading';
import { elapsedAt, formatDuration, readAttempt, resetAttempt, saveAttempt, startAttempt, submitAttempt, validName } from './lib/session';
import { playExamSound, stopAllSounds } from './lib/sound';
import type { AnswerValue, Attempt } from './lib/types';

export default function App() {
  const [initial] = useState(readAttempt);
  const [attempt, setAttempt] = useState<Attempt>(initial.attempt);
  const [name, setName] = useState(initial.attempt.status === 'idle' ? initial.attempt.studentName : '');
  const [nameError, setNameError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('chemistry-l3-muted') === '1'; } catch { return false; } });
  const [saved, setSaved] = useState(!initial.error);
  const [storageNotice, setStorageNotice] = useState(initial.error || '');
  const [recovered, setRecovered] = useState(initial.recovered && initial.attempt.status === 'active');
  const [teacherOpen, setTeacherOpen] = useState(window.location.hash === '#teacher');
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const examErrors = useMemo(validateExam, []);
  const elapsed = elapsedAt(attempt, now);
  const result = useMemo(() => attempt.status === 'submitted' ? gradeExam(attempt.answers) : null, [attempt.status, attempt.answers]);

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.title = EXAM_TITLE;
  }, []);
  useEffect(() => {
    const ok = saveAttempt(attempt);
    setSaved(ok);
    if (!ok) setStorageNotice('تعذّر الحفظ على هذا الجهاز. أبقِ الصفحة مفتوحة؛ إجاباتك محفوظة في الذاكرة الحالية فقط.');
  }, [attempt]);
  useEffect(() => {
    if (attempt.status !== 'active') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const persist = () => { saveAttempt(attemptRef.current, Date.now()); };
    const visibility = () => { if (document.visibilityState === 'hidden') persist(); else setNow(Date.now()); };
    const interval = window.setInterval(persist, 5000);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); window.clearInterval(interval); window.removeEventListener('pagehide', persist); document.removeEventListener('visibilitychange', visibility); persist(); };
  }, [attempt.status]);
  useEffect(() => {
    const hashChange = () => { setTeacherOpen(window.location.hash === '#teacher'); window.scrollTo({ top: 0, behavior: 'auto' }); };
    window.addEventListener('hashchange', hashChange);
    return () => window.removeEventListener('hashchange', hashChange);
  }, []);
  useEffect(() => () => stopAllSounds(), []);
  useEffect(() => {
    if (attempt.status !== 'active' || teacherOpen) return;
    const frame = requestAnimationFrame(() => document.getElementById('question-top')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
    return () => cancelAnimationFrame(frame);
  }, [attempt.currentQuestion, attempt.status, teacherOpen]);

  const start = () => {
    if (attempt.status !== 'idle') return;
    if (!validName(name)) { setNameError('اكتب الاسم واللقب على الأقل، بحروف واضحة.'); document.getElementById('student-name')?.focus(); return; }
    const timestamp = Date.now();
    setNow(timestamp);
    setAttempt(startAttempt(name, timestamp));
    setNameError('');
    setRecovered(false);
    playExamSound('start', muted);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const answer = useCallback((id: string, value: AnswerValue) => {
    setAttempt(previous => previous.status === 'active' && ALL_PARTS.some(p => p.id === id) ? { ...previous, answers: { ...previous.answers, [id]: value } } : previous);
  }, []);
  const navigate = useCallback((index: number) => {
    setAttempt(previous => previous.status === 'active' ? { ...previous, currentQuestion: Math.max(0, Math.min(6, index)) } : previous);
  }, []);
  const submit = () => {
    const timestamp = Date.now();
    const next = submitAttempt(attemptRef.current, timestamp);
    if (next === attemptRef.current) return;
    setNow(timestamp);
    setAttempt(next);
    setRecovered(false);
    playExamSound('submit', muted);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const newAttempt = () => {
    const next = resetAttempt(attemptRef.current);
    if (next === attemptRef.current) return;
    setAttempt(next);
    setName('');
    setNameError('');
    setRecovered(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    if (next) stopAllSounds();
    try { localStorage.setItem('chemistry-l3-muted', next ? '1' : '0'); } catch { /* Preference remains available for this session. */ }
  };
  const openTeacher = () => { window.location.hash = 'teacher'; setTeacherOpen(true); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const closeTeacher = () => { window.location.hash = ''; setTeacherOpen(false); window.scrollTo({ top: 0, behavior: 'auto' }); };

  return <div className={`app-shell ${attempt.status === 'active' ? 'exam-active' : ''}`} dir="rtl">
    <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
    <header className="site-header"><div className="header-inner"><div className="brand"><span className="brand-icon"><Atom size={27} strokeWidth={1.5} /></span><div><h1>{EXAM_TITLE}</h1><p>الوحدة الأولى <span>·</span> الدرس الثالث <span>·</span> صيغة المركّبات الكيميائية</p></div></div><div className="header-actions">{attempt.status === 'active' && <div className="header-timer" role="timer" aria-label={`الوقت المنقضي ${formatDuration(elapsed)}`}><Clock3 size={17} /><div><span>الوقت المنقضي</span><strong dir="ltr">{formatDuration(elapsed)}</strong></div><span className="timer-live-dot" /></div>}<button className={`sound-button ${muted ? 'muted' : ''}`} onClick={toggleSound} aria-label={muted ? 'الصوت مكتوم؛ اضغط لتفعيل الصوت' : 'الصوت مفعّل؛ اضغط لكتم الصوت'} aria-pressed={!muted} title={muted ? 'الصوت مكتوم' : 'الصوت مفعّل'}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}<span className="sound-label">{muted ? 'الصوت مكتوم' : 'الصوت مفعّل'}</span></button></div></div>{attempt.status === 'active' && <div className="header-progress" aria-hidden="true"><span style={{ width: `${completedCount(attempt.answers) / ALL_PARTS.length * 100}%` }} /></div>}</header>
    <div id="main-content" className="main-content">
      {storageNotice && !teacherOpen && <div className="storage-notice page-container" role="status"><span>{storageNotice}</span><button onClick={() => setStorageNotice('')} aria-label="إخفاء ملاحظة الحفظ"><X size={15} /></button></div>}
      {recovered && attempt.status === 'active' && !teacherOpen && <div className="recovery-notice page-container" role="status"><CheckCircle2 size={17} /><span>تمت استعادة محاولتك يا {attempt.studentName.split(' ')[0]}. تابع من حيث توقّفت؛ الوقت يستمر من لحظة البدء.</span><button onClick={() => setRecovered(false)} aria-label="إخفاء رسالة الاستعادة"><X size={15} /></button></div>}
      {examErrors.length > 0 ? <main className="page-container error-screen"><h2>تعذّر تحميل الاختبار</h2><p>لم يجتز توزيع العلامات التحقق الداخلي.</p></main> : teacherOpen ? <TeacherKey onBack={closeTeacher} /> : attempt.status === 'idle' ? <Entry name={name} onName={value => { setName(value); setNameError(''); }} error={nameError} onStart={start} /> : attempt.status === 'active' ? <ExamView attempt={attempt} elapsed={elapsed} onAnswer={answer} onNavigate={navigate} onSubmit={submit} saved={saved} /> : result ? <Results attempt={attempt} result={result} onNew={newAttempt} /> : null}
    </div>
    <Footer onTeacher={openTeacher} />
    {attempt.status === 'submitted' && result && <div className="sr-only" role="status">تم تسليم الاختبار. علامتك {result.earned} من 100.</div>}
  </div>;
}

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, BookOpenText, Check, CheckCircle2, ChevronDown,
  ClipboardList, Clock3, Download, Lightbulb, ListChecks, LockKeyhole, PencilLine,
  RefreshCw, ShieldCheck, Sparkles, Star, Trophy, Volume2, VolumeX,
} from 'lucide-react';
import { passages, questions, type Question, type QuestionPart } from './examData';
import {
  MUTE_KEY, STORAGE_KEY, allAnswered, calculateResults, createAttempt, elapsedAt, formatTime,
  loadAttempt, partIsCorrect, playChime, questionIsAnswered, reportFilename, reportFor,
  saveAttempt, scoreQuestion, type Attempt,
} from './examEngine';

function initialStorage() {
  try {
    const hasSaved = localStorage.getItem(STORAGE_KEY) !== null;
    const saved = loadAttempt();
    localStorage.setItem('bright-english-storage-check', '1');
    localStorage.removeItem('bright-english-storage-check');
    return { saved, error: hasSaved && !saved ? 'A saved attempt could not be restored. Please ask your teacher for help; it has not been erased.' : '' };
  } catch {
    return { saved: null, error: 'This browser cannot save your work. Please enable browser storage before starting.' };
  }
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.87 9.87 0 0 0-8.49 14.9L2.1 22l5.25-1.38A9.94 9.94 0 1 0 12.04 2Zm0 17.98a8.06 8.06 0 0 1-4.1-1.12l-.3-.18-3.11.82.83-3.03-.2-.31a8.06 8.06 0 1 1 6.88 3.82Zm4.43-6.03c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function Header({ muted, toggleMuted, showTeacher, openTeacher }: { muted: boolean; toggleMuted: () => void; showTeacher: boolean; openTeacher: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" aria-label="Bright English, Grade 4 exam">
          <span className="brand-mark"><BookOpen size={22} strokeWidth={2.3} /></span>
          <span className="brand-text"><strong>bright<span>english</span></strong><small>LEARN. GROW. SHINE.</small></span>
        </div>
        <div className="header-actions">
          <div className="header-grade"><span className="header-grade-dot" /> GRADE 4 <span className="header-separator">/</span> UNIT 1</div>
          <button className="sound-button" type="button" aria-label={muted ? 'Unmute sound' : 'Mute sound'} title={muted ? 'Unmute sound' : 'Mute sound'} onClick={toggleMuted}>
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          {showTeacher && <button className="teacher-link" type="button" onClick={openTeacher}><LockKeyhole size={15} /> <span>Teacher area</span></button>}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-note"><span className="footer-sparkle"><Sparkles size={16} /></span><span>Made for bright minds and big dreams.</span></div>
        <a className="contact-link" href="https://wa.me/963930215022" target="_blank" rel="noreferrer" aria-label="WhatsApp: المهندس سومر شاهين, 0930215022">
          <span className="whatsapp-icon"><WhatsAppIcon /></span>
          <span className="contact-copy"><span className="contact-label">NEED A HAND? GET IN TOUCH</span><span className="contact-details"><b lang="ar" dir="rtl">المهندس سومر شاهين</b><span className="contact-divider" /> <strong>0930215022</strong></span></span>
          <ArrowRight className="contact-arrow" size={16} />
        </a>
      </div>
    </footer>
  );
}

function Welcome({ start, storageError }: { start: (name: string) => void; storageError: string }) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) { setNameError(true); return; }
    start(name.trim());
  }
  return (
    <main className="welcome-page page-width">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> HELLO, LEARNER!</div>
          <h1 id="welcome-title">Grade 4<br /><span>English Exam<span className="heading-dot">.</span></span></h1>
          <p>Ready to show what you know? Let your learning shine!</p>
          <div className="hero-coverage"><span className="coverage-icon"><BookOpenText size={17} /></span> Unit 1 <span className="coverage-separator">/</span> Lessons 1 to 5</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <img src="/images/english-adventure.png" alt="" />
        </div>
      </section>

      <div className="welcome-lower">
        <section className="overview" aria-labelledby="overview-heading">
          <div className="section-label">A LITTLE LOOK AHEAD</div>
          <h2 id="overview-heading">Your exam at a glance<span className="heading-dot">.</span></h2>
          <p className="section-description">Everything you need to know before you begin.</p>
          <div className="overview-facts">
            <div className="fact"><span className="fact-icon fact-blue"><ClipboardList size={22} /></span><div><strong>50</strong><span>questions</span></div></div>
            <div className="fact"><span className="fact-icon fact-yellow"><Star size={22} /></span><div><strong>100</strong><span>marks</span></div></div>
            <div className="fact"><span className="fact-icon fact-purple"><BookOpen size={22} /></span><div><strong>5</strong><span>lessons</span></div></div>
          </div>
          <div className="friendly-tip"><span><Lightbulb size={18} /></span><p><strong>You've got this!</strong> Take your time. Your answers are saved as you go.</p></div>
        </section>

        <section className="start-card" aria-labelledby="start-heading">
          <div className="start-card-top"><span className="start-icon"><PencilLine size={20} /></span><span className="start-sparkles"><Sparkles size={20} /></span></div>
          <div className="section-label coral-label">LET'S GET STARTED</div>
          <h2 id="start-heading">Ready when you are!</h2>
          <p>First things first, what should we call you?</p>
          <form onSubmit={handleStart} noValidate>
            <label htmlFor="student-name">Student name <span aria-hidden="true">*</span></label>
            <input id="student-name" name="student-name" autoComplete="name" maxLength={80} placeholder="Enter your name" value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} aria-required="true" aria-invalid={nameError} aria-describedby={nameError ? 'name-error' : undefined} />
            {nameError && <div className="field-error" id="name-error">Please enter your name to begin.</div>}
            <button className="primary-button start-button" type="submit" disabled={Boolean(storageError)}>Start Exam <ArrowRight size={19} /></button>
          </form>
          <div className="start-note"><Clock3 size={14} /> Your timer starts when you press Start Exam.</div>
        </section>
      </div>
      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      <div className="welcome-bottom-note"><span className="tiny-star"><Star size={14} fill="currentColor" /></span> One question at a time. You can do amazing things! <span className="tiny-star"><Star size={14} fill="currentColor" /></span></div>
    </main>
  );
}

function Navigator({ attempt, navigate }: { attempt: Attempt; navigate: (index: number) => void }) {
  return (
    <div className="number-grid" aria-label="Question navigator">
      {questions.map((question, index) => {
        const answered = questionIsAnswered(question, attempt.answers);
        const current = index === attempt.currentQuestion;
        return <button type="button" key={question.id} className={`number-button ${answered ? 'answered' : ''} ${current ? 'current' : ''}`} aria-label={`Question ${index + 1}${answered ? ', answered' : ', not answered'}${current ? ', current question' : ''}`} aria-current={current ? 'step' : undefined} onClick={() => navigate(index)}>{index + 1}</button>;
      })}
    </div>
  );
}

function QuestionPrompt({ question, part }: { question: Question; part: QuestionPart }) {
  if (question.id !== 'l5-08') return <>{part.prompt}</>;
  const word = part.prompt.startsWith('There') ? 'is' : 'wake';
  const position = part.prompt.indexOf(word);
  if (position < 0) return <>{part.prompt}</>;
  return <>{part.prompt.slice(0, position)}<u>{word}</u>{part.prompt.slice(position + word.length)}</>;
}

function QuestionControls({ question, answers, change }: { question: Question; answers: string[]; change: (partIndex: number, value: string) => void }) {
  return (
    <div className="question-parts">
      {question.parts.map((part, index) => (
        <div className={`question-part ${question.parts.length > 1 ? 'multiple-part' : ''}`} key={`${question.id}-${index}`}>
          <div className="part-heading">
            <label className="part-prompt" htmlFor={part.type === 'choice' ? undefined : `${question.id}-${index}`}>
              {question.parts.length > 1 && <span className="part-letter">{String.fromCharCode(65 + index)}</span>}
              <span><QuestionPrompt question={question} part={part} /></span>
            </label>
            {question.parts.length > 1 && <span className="part-marks">{part.marks} mark</span>}
          </div>
          {part.type === 'choice' && <div className="answer-choices" role="radiogroup" aria-label={part.prompt}>
            {part.options?.map((option, optionIndex) => (
              <label className={`choice-option ${answers[index] === option ? 'selected' : ''}`} key={option}>
                <input type="radio" name={`${question.id}-${index}`} value={option} checked={answers[index] === option} onChange={() => change(index, option)} />
                <span className="choice-letter">{String.fromCharCode(65 + optionIndex)}</span><span className="choice-text">{option}</span><span className="choice-circle"><Check size={14} /></span>
              </label>
            ))}
          </div>}
          {part.type === 'select' && <div className="select-wrap"><select id={`${question.id}-${index}`} value={answers[index] ?? ''} onChange={(event) => change(index, event.target.value)}><option value="">Choose an answer</option>{part.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select><ChevronDown size={18} aria-hidden="true" /></div>}
          {part.type === 'text' && <input className="answer-input" id={`${question.id}-${index}`} type="text" autoComplete="off" placeholder="Type your answer here" value={answers[index] ?? ''} onChange={(event) => change(index, event.target.value)} />}
        </div>
      ))}
    </div>
  );
}

function Exam({ attempt, update, submit, saveError }: { attempt: Attempt; update: (attempt: Attempt) => void; submit: () => void; saveError: boolean }) {
  const question = questions[attempt.currentQuestion];
  const completed = questions.filter((item) => questionIsAnswered(item, attempt.answers)).length;
  const ready = allAnswered(attempt.answers);
  const progress = Math.round(completed / questions.length * 100);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  function navigate(index: number) {
    update({ ...attempt, currentQuestion: Math.max(0, Math.min(questions.length - 1, index)), elapsedMs: elapsedAt(attempt) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => questionHeading.current?.focus({ preventScroll: true }), 20);
  }
  function changeAnswer(partIndex: number, value: string) {
    const answers = [...(attempt.answers[question.id] ?? [])];
    answers[partIndex] = value;
    update({ ...attempt, answers: { ...attempt.answers, [question.id]: answers }, elapsedMs: elapsedAt(attempt) });
  }
  return (
    <main className="exam-page page-width">
      <div className="exam-page-heading">
        <div><div className="section-label">GRADE 4 ENGLISH EXAM <span className="label-slash">/</span> UNIT 1</div><h1>Let's do this, {attempt.studentName}<span className="heading-dot">!</span></h1><p>One question at a time. You're doing great!</p></div>
        <div className="timer-box"><span className="timer-icon"><Clock3 size={20} /></span><div><span>TIME ELAPSED</span><strong aria-label={`Time elapsed ${formatTime(elapsedAt(attempt))}`}>{formatTime(elapsedAt(attempt))}</strong></div></div>
      </div>
      {saveError && <div className="storage-warning" role="alert">Your browser could not save the latest change. Please enable browser storage.</div>}
      <div className="mobile-progress"><div><span>Your progress</span><strong>{completed} of 50 answered</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><details className="mobile-navigator"><summary>Jump to a question <ChevronDown size={17} /></summary><Navigator attempt={attempt} navigate={navigate} /></details></div>
      <div className="exam-layout">
        <aside className="exam-sidebar">
          <div className="sidebar-title"><div><div className="section-label">YOUR JOURNEY</div><h2>Question map</h2></div><span className="sidebar-icon"><ListChecks size={20} /></span></div>
          <div className="sidebar-progress-line"><span>Progress</span><strong>{completed} / 50</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <p className="sidebar-caption">Pick a number to jump to a question.</p>
          <Navigator attempt={attempt} navigate={navigate} />
          <div className="nav-legend"><span><i className="legend-current" /> Current</span><span><i className="legend-answered" /> Answered</span></div>
          <button className="submit-side" type="button" disabled={!ready} onClick={submit}>Submit Exam <ArrowRight size={17} /></button>
          <p className="submit-help">{ready ? 'All answers are complete!' : 'Answer every part to submit.'}</p>
        </aside>
        <section className="question-panel" aria-labelledby="question-title">
          <div className="question-topline"><div className="question-counter"><span className="counter-icon"><PencilLine size={17} /></span> QUESTION {String(attempt.currentQuestion + 1).padStart(2, '0')} <span>OF 50</span></div><span className="marks-badge">2 marks</span></div>
          <div className="question-divider" />
          <div className="question-meta"><span className={`lesson-badge lesson-${question.lesson}`}>LESSON {question.lesson}</span><span className="format-text">{question.format}</span></div>
          <h2 id="question-title" tabIndex={-1} ref={questionHeading}>{question.prompt}</h2>
          {question.passage && <div className="reading-box"><div className="reading-label"><BookOpenText size={16} /> READING TIME</div><p>{passages[question.passage]}</p></div>}
          {question.wordBank && <div className="word-bank"><span>WORD BOX</span> {question.wordBank}</div>}
          {question.image && <div className="question-image"><img src={question.image.src} alt={question.image.alt} /></div>}
          <QuestionControls question={question} answers={attempt.answers[question.id] ?? []} change={changeAnswer} />
          <div className="question-bottom"><button className="secondary-button" type="button" disabled={attempt.currentQuestion === 0} onClick={() => navigate(attempt.currentQuestion - 1)}><ArrowLeft size={18} /> Previous</button>
            {attempt.currentQuestion < questions.length - 1 ? <button className="primary-button next-button" type="button" onClick={() => navigate(attempt.currentQuestion + 1)}>Next question <ArrowRight size={18} /></button> : <button className="primary-button next-button" type="button" disabled={!ready} onClick={submit}>Submit Exam <ArrowRight size={18} /></button>}
          </div>
          <div className="auto-save"><ShieldCheck size={15} /> Your answers are saved automatically on this device.</div>
        </section>
      </div>
      <div className="mobile-submit"><button className="primary-button" type="button" disabled={!ready} onClick={submit}>Submit Exam <ArrowRight size={18} /></button><p>{ready ? 'All answers are complete!' : 'Answer every part to submit.'}</p></div>
    </main>
  );
}

function ReviewQuestion({ question, index, answers, teacher = false }: { question: Question; index: number; answers?: Record<string, string[]>; teacher?: boolean }) {
  const marks = answers ? scoreQuestion(question, answers) : 0;
  return (
    <article className="review-question">
      <div className="review-heading"><div className="review-heading-left"><span className={`review-number ${teacher || marks === 2 ? 'review-number-good' : 'review-number-partial'}`}>{String(index + 1).padStart(2, '0')}</span><div><span className="review-lesson">LESSON {question.lesson} <span>/</span> {question.format.toUpperCase()}</span><h3>{question.prompt}</h3></div></div><span className={`review-score ${teacher || marks === 2 ? 'score-good' : 'score-partial'}`}>{teacher ? '2 marks' : `${marks} / 2 marks`}</span></div>
      {question.passage && <details className="review-passage"><summary>Show the reading text <ChevronDown size={15} /></summary><p>{passages[question.passage]}</p></details>}
      {question.wordBank && <p className="review-word-bank"><strong>Word box:</strong> {question.wordBank}</p>}
      {question.image && <img className="review-image" src={question.image.src} alt={question.image.alt} />}
      <div className="review-parts">{question.parts.map((part, partIndex) => {
        const answer = answers?.[question.id]?.[partIndex] ?? '';
        return <div className="review-part" key={partIndex}><p className="review-part-prompt">{question.parts.length > 1 && <b>{String.fromCharCode(65 + partIndex)}. </b>}<QuestionPrompt question={question} part={part} /></p>
          {part.options && <p className="review-choices">Choices: {part.options.join(' / ')}</p>}
          <div className="review-answer-grid">{!teacher && <div><span>YOUR ANSWER</span><strong>{answer || 'Not answered'}</strong></div>}<div><span>CORRECT ANSWER</span><strong>{part.answer}</strong></div><div><span>MARKS</span><strong>{teacher ? `${part.marks} mark${part.marks === 1 ? '' : 's'}` : `${partIsCorrect(part, answer) ? part.marks : 0} / ${part.marks}`}</strong></div></div>
          {teacher && part.accepted && <p className="accepted-text">Also accepted: {part.accepted.join(', ')}</p>}
        </div>;
      })}</div>
      <p className="review-explanation"><Lightbulb size={15} /> <span>{question.explanation}</span></p>
      <p className="source-reference"><strong>Source:</strong> {question.source}</p>
    </article>
  );
}

function Results({ attempt, restart }: { attempt: Attempt; restart: () => void }) {
  const result = calculateResults(attempt);
  function downloadReport() {
    const blob = new Blob([reportFor(attempt)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportFilename(attempt.studentName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="results-page page-width">
      <section className="results-hero"><div className="results-copy"><div className="eyebrow"><Sparkles size={15} /> EXAM COMPLETE</div><h1>Look at you shine, <span>{attempt.studentName}!</span></h1><p>You finished your Grade 4 English Exam. Be proud of the work you put in!</p><div className="results-actions"><button className="primary-button" type="button" onClick={downloadReport}><Download size={18} /> Download TXT report</button><button className="secondary-button" type="button" onClick={restart}><RefreshCw size={17} /> Start a new attempt</button></div></div><div className="score-medal"><span className="medal-star"><Trophy size={24} /></span><span>YOUR SCORE</span><strong>{result.score}<small>/ 100</small></strong><div>marks earned</div></div></section>
      <div className="result-summary"><div><CheckCircle2 size={19} /><span><strong>{result.correct}</strong> fully correct</span></div><div><span className="summary-ring" /><span><strong>{result.incorrect}</strong> incorrect or partial</span></div><div><Clock3 size={19} /><span><strong>{formatTime(attempt.elapsedMs)}</strong> time taken</span></div></div>
      <p className="partial-note">A question is fully correct when all of its parts are correct. Partial marks are included in your score.</p>
      <section className="lesson-results"><div className="section-label">YOUR LEARNING JOURNEY</div><h2>Lesson-by-lesson results<span className="heading-dot">.</span></h2><div className="lesson-score-list">{result.lessonScores.map((lesson) => <div className="lesson-score-row" key={lesson.lesson}><span className={`lesson-score-icon lesson-${lesson.lesson}`}>{lesson.lesson}</span><span className="lesson-score-name">{lesson.title}</span><span className="lesson-score-track"><span className={`lesson-fill-${lesson.lesson}`} style={{ width: `${lesson.score / 20 * 100}%` }} /></span><strong>{lesson.score} <small>/ 20</small></strong></div>)}</div></section>
      <section className="review-section"><div className="review-section-heading"><div><div className="section-label">TAKE A CLOSER LOOK</div><h2>Your answer review<span className="heading-dot">.</span></h2><p>All 50 questions, with your answers and source references.</p></div><span className="review-count"><BookOpenText size={17} /> 50 questions</span></div><div className="review-list">{questions.map((question, index) => <ReviewQuestion key={question.id} question={question} index={index} answers={attempt.answers} />)}</div></section>
    </main>
  );
}

function TeacherArea({ back }: { back: () => void }) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [incorrect, setIncorrect] = useState(false);
  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === 'somer173') { setUnlocked(true); setIncorrect(false); setPassword(''); } else { setIncorrect(true); }
  }
  return (
    <main className="teacher-page page-width"><button className="back-link" type="button" onClick={back}><ArrowLeft size={17} /> Back to exam</button>
      {!unlocked ? <section className="teacher-gate"><span className="teacher-gate-icon"><LockKeyhole size={26} /></span><div className="section-label">FOR TEACHERS</div><h1>Teacher answer key<span className="heading-dot">.</span></h1><p>Enter the classroom password to open the answer key.</p><form onSubmit={unlock}><label htmlFor="teacher-password">Teacher password</label><input id="teacher-password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setIncorrect(false); }} />{incorrect && <p className="field-error" role="alert">Incorrect password. Please try again.</p>}<button type="submit" className="primary-button">Open answer key <ArrowRight size={18} /></button></form><p className="gate-disclosure">This is a basic device-side display gate, not secure authentication or encryption.</p></section> : <><div className="teacher-unlocked-heading"><div className="section-label">FOR TEACHERS</div><h1>Teacher answer key<span className="heading-dot">.</span></h1><p>50 questions, 2 marks each, for a total of 100 marks.</p><p>A correct single-part response earns 2 marks. For questions with two parts, award 1 mark per correct part; an incorrect or blank part earns 0. Written responses are matched without regard to capital letters or sentence punctuation.</p><div className="teacher-source-note"><strong>Source note:</strong> The repository provides Lesson 1 transcriptions, but no original Lesson 1 scans or individual exercise-to-page mapping. References therefore use its published page ranges and need checking against the printed book. Lessons 2-5 were checked against the available scans.</div></div><div className="review-list">{questions.map((question, index) => <ReviewQuestion key={question.id} question={question} index={index} teacher />)}</div></>}
    </main>
  );
}

export default function App() {
  const [initial] = useState(initialStorage);
  const [attempt, setAttempt] = useState<Attempt | null>(initial.saved);
  const attemptRef = useRef<Attempt | null>(initial.saved);
  const [storageError, setStorageError] = useState(initial.error);
  const [saveError, setSaveError] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; } });
  function commit(next: Attempt) {
    attemptRef.current = next;
    setAttempt(next);
    setSaveError(!saveAttempt(next));
  }
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = attemptRef.current;
      if (current?.state === 'active') commit({ ...current, elapsedMs: elapsedAt(current) });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    const syncAttempt = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue) {
        const updated = loadAttempt();
        if (!updated) return;
        attemptRef.current = updated;
        setAttempt(updated);
        if (updated.state === 'active') setTeacherOpen(false);
      } else if (attemptRef.current?.state === 'submitted') {
        attemptRef.current = null;
        setAttempt(null);
        setTeacherOpen(false);
      }
    };
    window.addEventListener('storage', syncAttempt);
    return () => window.removeEventListener('storage', syncAttempt);
  }, []);
  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    try { localStorage.setItem(MUTE_KEY, String(next)); } catch { /* Storage warning is handled separately. */ }
  }
  function start(name: string) {
    if (storageError || attemptRef.current) return;
    const next = createAttempt(name, Date.now());
    commit(next);
    playChime('start', muted);
    window.scrollTo({ top: 0 });
  }
  function submit() {
    const current = attemptRef.current;
    if (!current || current.state !== 'active' || !allAnswered(current.answers)) return;
    const now = Date.now();
    commit({ ...current, state: 'submitted', submittedAt: now, elapsedMs: elapsedAt(current, now) });
    playChime('submit', muted);
    window.scrollTo({ top: 0 });
  }
  function restart() {
    if (attemptRef.current?.state !== 'submitted') return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { setStorageError('This browser cannot save your work. Please enable browser storage before starting.'); }
    attemptRef.current = null;
    setAttempt(null);
    setTeacherOpen(false);
    setSaveError(false);
    window.scrollTo({ top: 0 });
  }
  const active = attempt?.state === 'active';
  let content: ReactNode;
  if (teacherOpen && !active) content = <TeacherArea back={() => setTeacherOpen(false)} />;
  else if (!attempt) content = <Welcome start={start} storageError={storageError} />;
  else if (active) content = <Exam attempt={attempt} update={commit} submit={submit} saveError={saveError} />;
  else content = <Results attempt={attempt} restart={restart} />;
  return <div className="app-shell"><Header muted={muted} toggleMuted={toggleMuted} showTeacher={!active && !teacherOpen} openTeacher={() => setTeacherOpen(true)} />{content}<Footer /></div>;
}

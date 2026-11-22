import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Download,
  LockKeyhole, RotateCcw, Volume2, VolumeX, X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Figure } from "./components/Figures";
import { MathText, Rich } from "./components/Math";
import { questions, totalParts, type Part, type Question } from "./data/questions";
import { gradeExam, isExamComplete, isQuestionComplete, type AnswerKey, type ExamResult } from "./lib/grading";
import {
  clearAttempt, formatDuration, loadAttempt, loadMuted, saveAttempt, saveMuted, type Attempt,
} from "./lib/persistence";
import { downloadReport, responseToPlain } from "./lib/report";

const branchLetters = ["أ", "ب", "ج", "د", "هـ", "و"];
const lessonOneUrl = "https://github.com/calesteer-create/Physics_Chemistry_7th/blob/main/src/content/lessons/unit1/motion-and-rest.ts";
const lessonTwoUrl = "https://github.com/calesteer-create/Physics_Chemistry_7th/blob/main/src/content/lessons/unit1/force-and-motion.ts";

function playCue(which: "start" | "submit", muted: boolean) {
  if (muted) return;
  const sound = new Audio(`${import.meta.env.BASE_URL}audio/${which}.wav`);
  sound.volume = 0.52;
  void sound.play().catch(() => { /* A browser may block audio playback. */ });
}

function Header({ attempt, elapsed, answered, muted, onToggleMute }: {
  attempt: Attempt | null; elapsed: string; answered: number; muted: boolean; onToggleMute: () => void;
}) {
  return (
    <div className="header-wrap">
      <header className="site-header page-container">
        <div className="header-identity">
          <span className="header-signet" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="24" height="24" fill="none">
              <circle cx="10" cy="27" r="3.5" fill="currentColor" />
              <circle cx="26" cy="9" r="3.5" fill="currentColor" />
              <path d="M10 27C10 15 17 9 26 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M13 13H26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <div className="header-title"><span>اختبار الفيزياء</span><small>الصف السابع · النموذج B</small></div>
        </div>
        <div className="header-tools">
          {attempt && (
            <div className="header-timer" title="الوقت المستغرق منذ بدء الاختبار">
              <Clock3 size={17} strokeWidth={1.9} aria-hidden="true" />
              <time dir="ltr">{elapsed}</time>
            </div>
          )}
          <button className="icon-button sound-toggle" type="button" onClick={onToggleMute} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} title={muted ? "تشغيل الصوت" : "كتم الصوت"}>
            {muted ? <VolumeX size={20} strokeWidth={1.8} /> : <Volume2 size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </header>
      {attempt?.status === "in_progress" && (
        <div className="header-progress" role="progressbar" aria-label="تقدم الإجابة" aria-valuemin={0} aria-valuemax={totalParts} aria-valuenow={answered}>
          <div style={{ width: `${answered / totalParts * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function StartScreen({ name, nameError, setName, onStart }: {
  name: string; nameError: string; setName: (value: string) => void; onStart: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="start-page">
      <div className="start-ambient start-ambient--one" aria-hidden="true" />
      <div className="start-ambient start-ambient--two" aria-hidden="true" />
      <section className="start-layout page-container" aria-labelledby="start-title">
        <div className="start-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> الوحدة الأولى <span className="eyebrow-separator">/</span> النموذج B</div>
          <h1 id="start-title">اختبار الفيزياء <span>— الصف السابع</span></h1>
          <p className="start-description">الحركة والسكون، والقوة والحركة. اختبار يساعدك على إظهار ما فهمتِه خطوة بخطوة.</p>
          <div className="start-illustration" aria-hidden="true">
            <svg viewBox="0 0 550 165" preserveAspectRatio="xMidYMid meet" fill="none">
              <path d="M2 125 C85 125 112 49 181 49 S291 130 362 109 S448 21 548 21" stroke="#d9c7e4" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
              <circle cx="181" cy="49" r="10" fill="#e8b1c9" />
              <circle cx="362" cy="109" r="10" fill="#a8d9d8" />
              <circle cx="548" cy="21" r="6" fill="#b69ad1" />
              <path d="M11 137v-26M0 124h24" stroke="#d9c7e4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <form className="start-form" onSubmit={onStart} noValidate>
          <span className="form-topline" aria-hidden="true" />
          <p className="form-kicker">قبل البداية</p>
          <h2>جاهزة لتبدئي؟</h2>
          <p className="form-intro">10 أسئلة رئيسية، مجموعها 100 علامة. يبدأ عداد الوقت عندما تضغطين زر البدء.</p>
          <label className="field-label" htmlFor="student-name">اسم الطالبة <span aria-hidden="true">*</span></label>
          <input
            id="student-name" className="student-input" type="text" required maxLength={70}
            autoComplete="name" value={name} onChange={(event) => setName(event.target.value)}
            placeholder="اكتبي اسمك هنا" aria-required="true" aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "name-error" : undefined}
          />
          {nameError && <p className="name-error" id="name-error" role="alert">{nameError}</p>}
          <div className="start-instructions">
            <p>اقرئي كل موقف ورسم بعناية، وأجيبي عن جميع الفروع.</p>
            <p>يمكنك التنقل بين الأسئلة؛ تُحفظ إجاباتك ووقتك تلقائياً.</p>
            <p>لا تظهر الإجابات والنتيجة إلا بعد تسليم الاختبار.</p>
          </div>
          <button type="submit" className="primary-button start-button">بدء الاختبار <ArrowLeft size={19} aria-hidden="true" /></button>
        </form>
      </section>
    </main>
  );
}

function PartInput({ part, index, value, onChange }: {
  part: Part; index: number; value: string; onChange: (id: string, value: string) => void;
}) {
  const inputId = `answer-${part.id}`;
  return (
    <section className="question-part" aria-labelledby={`label-${part.id}`}>
      <div className="part-heading">
        <span className="part-letter" aria-hidden="true">{branchLetters[index]}</span>
        <h3 id={`label-${part.id}`}><Rich content={part.label} /></h3>
      </div>
      {part.type === "choice" && (
        <div className="options-list" role="group" aria-labelledby={`label-${part.id}`}>
          {part.options?.map((option) => (
            <button
              key={option.id} type="button" className={`answer-option ${value === option.id ? "is-selected" : ""}`}
              aria-pressed={value === option.id} onClick={() => onChange(part.id, option.id)}
            >
              <span className="option-indicator" aria-hidden="true">{value === option.id && <Check size={13} strokeWidth={3} />}</span>
              <span>{option.latex ? <MathText tex={option.latex} /> : option.label}</span>
            </button>
          ))}
        </div>
      )}
      {part.type === "number" && (
        <div className="number-answer">
          <input id={inputId} type="text" inputMode="decimal" autoComplete="off" dir="ltr" value={value}
            onChange={(event) => onChange(part.id, event.target.value)} placeholder="العدد" aria-labelledby={`label-${part.id}`} />
          {part.suffix && <span className="input-suffix"><MathText tex={part.suffix} /></span>}
        </div>
      )}
      {part.type === "formula" && (
        <input id={inputId} type="text" dir="ltr" autoComplete="off" className="text-answer formula-answer" value={value}
          onChange={(event) => onChange(part.id, event.target.value)} placeholder={part.placeholder}
          aria-labelledby={`label-${part.id}`} />
      )}
      {part.type === "short" && (
        <textarea id={inputId} className="text-answer short-answer" rows={2} value={value}
          onChange={(event) => onChange(part.id, event.target.value)} placeholder={part.placeholder}
          aria-labelledby={`label-${part.id}`} />
      )}
    </section>
  );
}

function QuestionMap({ attempt, onNavigate }: { attempt: Attempt; onNavigate: (index: number) => void }) {
  return (
    <div className="question-map" aria-label="الانتقال بين الأسئلة">
      {questions.map((question, index) => {
        const isDone = isQuestionComplete(question, attempt.responses);
        return (
          <button key={question.id} type="button" onClick={() => onNavigate(index)}
            className={`map-number ${index === attempt.questionIndex ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
            aria-label={`السؤال ${index + 1}${isDone ? "، مكتمل" : "، غير مكتمل"}`}
            aria-current={index === attempt.questionIndex ? "step" : undefined}>
            {String(index + 1).padStart(2, "0")}
            {isDone && <span className="map-done-dot" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

function QuizScreen({ attempt, onAnswer, onNavigate, onSubmit }: {
  attempt: Attempt; onAnswer: (id: string, value: string) => void;
  onNavigate: (index: number) => void; onSubmit: () => void;
}) {
  const index = attempt.questionIndex;
  const question = questions[index];
  const answered = questions.flatMap((item) => item.parts).filter((part) => attempt.responses[part.id]?.trim()).length;
  const completed = questions.filter((item) => isQuestionComplete(item, attempt.responses)).length;
  const allComplete = isExamComplete(questions, attempt.responses);
  const firstIncomplete = questions.findIndex((item) => !isQuestionComplete(item, attempt.responses));

  return (
    <main className="exam-page page-container">
      <div className="exam-intro-line">
        <span>الوحدة الأولى <span className="small-divider">/</span> النموذج B</span>
        <span>أُجيب عن {answered} من {totalParts} فرعاً</span>
      </div>
      <details key={index} className="mobile-map">
        <summary>الانتقال بين الأسئلة <span>{completed} من 10 مكتملة</span><ChevronDown size={17} aria-hidden="true" /></summary>
        <QuestionMap attempt={attempt} onNavigate={onNavigate} />
      </details>
      <div className="exam-grid">
        <article key={question.id} className="question-sheet question-enter">
          <div className="question-kicker"><span>السؤال {String(index + 1).padStart(2, "0")}</span><span className="kicker-divider" /><span>{question.lesson}</span></div>
          <h1>{question.title}</h1>
          <p className="question-intro"><Rich content={question.intro} /></p>
          {question.figure && (
            <figure className="question-figure">
              <Figure type={question.figure} />
              {question.figureCaption && <figcaption><Rich content={question.figureCaption} /></figcaption>}
            </figure>
          )}
          <div className="parts-stack">
            {question.parts.map((part, partIndex) => <PartInput key={part.id} part={part} index={partIndex} value={attempt.responses[part.id] ?? ""} onChange={onAnswer} />)}
          </div>
          <div className="exam-actions">
            <button type="button" className="secondary-button" disabled={index === 0} onClick={() => onNavigate(index - 1)}>
              <ArrowRight size={18} aria-hidden="true" /> السابق
            </button>
            {index < questions.length - 1 ? (
              <button type="button" className="primary-button" onClick={() => onNavigate(index + 1)}>السؤال التالي <ArrowLeft size={18} aria-hidden="true" /></button>
            ) : (
              <button type="button" className="primary-button submit-button" disabled={!allComplete} onClick={onSubmit}>تسليم الاختبار</button>
            )}
          </div>
          {index === questions.length - 1 && !allComplete && (
            <p className="missing-note">أكملي جميع الفروع قبل التسليم. <button type="button" onClick={() => onNavigate(firstIncomplete)}>اذهبي إلى أول سؤال غير مكتمل</button></p>
          )}
        </article>
        <aside className="exam-sidebar" aria-label="تقدم الاختبار">
          <div className="sidebar-sticky">
            <p className="sidebar-kicker">تقدمك</p>
            <strong>{String(completed).padStart(2, "0")} <span>/ 10</span></strong>
            <p className="sidebar-description">أسئلة اكتملت جميع فروعها</p>
            <div className="sidebar-rule" />
            <p className="sidebar-label">انتقلي إلى سؤال</p>
            <QuestionMap attempt={attempt} onNavigate={onNavigate} />
            <p className="sidebar-note"><span className="legend-dot" /> علامة النقطة تعني أن السؤال مكتمل.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function StudentAnswer({ question, part, response }: { question: Question; part: Part; response: string }) {
  const option = part.options?.find((item) => item.id === response);
  if (option?.latex) return <MathText tex={option.latex} />;
  return <span dir={part.type === "number" || part.type === "formula" ? "ltr" : "auto"}>{responseToPlain(question, part.id, response) || "لم تُجب"}</span>;
}

function ResultsScreen({ attempt, result, onNewAttempt }: { attempt: Attempt; result: ExamResult | null; onNewAttempt: () => void }) {
  if (!result) {
    return <main className="result-loading page-container" role="status">جارٍ إعداد النتيجة...</main>;
  }
  const percentage = Math.round(result.total / result.possible * 100);
  const circle = 2 * Math.PI * 86;
  const duration = formatDuration((attempt.finishedAt ?? attempt.startedAt) - attempt.startedAt);
  return (
    <main className="results-page page-container">
      <section className="results-hero" aria-labelledby="results-title">
        <div className="results-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> النتيجة <span className="eyebrow-separator">/</span> النموذج B</div>
          <h1 id="results-title">انتهى الاختبار، <span>{attempt.studentName}</span></h1>
          <p>هذه نتيجتك في الدرسين الأول والثاني. راجعي التصحيح التفصيلي لتري خطوات كل إجابة.</p>
          <div className="results-actions">
            <button type="button" className="primary-button" onClick={() => downloadReport(questions, attempt, result)}><Download size={18} aria-hidden="true" /> تنزيل تقرير TXT</button>
            <button type="button" className="outline-button" onClick={onNewAttempt}><RotateCcw size={17} aria-hidden="true" /> بدء محاولة جديدة</button>
          </div>
        </div>
        <div className="score-visual" aria-label={`العلامة ${result.total} من ${result.possible}، النسبة ${percentage} بالمئة`}>
          <svg viewBox="0 0 210 210" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <circle cx="105" cy="105" r="86" fill="none" stroke="#eadce9" strokeWidth="8" />
            <circle cx="105" cy="105" r="86" fill="none" stroke="#bd6a9f" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circle} strokeDashoffset={circle * (1 - percentage / 100)} className="score-arc"
              style={{ "--circle-full": circle, "--circle-target": circle * (1 - percentage / 100) } as CSSProperties} />
          </svg>
          <div className="score-visual-text"><span className="score-number" dir="ltr">{result.total}<small>/100</small></span><span className="score-percent">{percentage}%</span></div>
        </div>
      </section>
      <div className="result-facts" aria-label="ملخص النتيجة">
        <div><span>الوقت المستغرق</span><strong dir="ltr">{duration}</strong></div>
        <div><span>الإجابات الصحيحة</span><strong>{result.correctCount}</strong></div>
        <div><span>الإجابات الخاطئة أو الجزئية</span><strong>{result.incorrectCount}</strong></div>
      </div>
      <p className="result-clarifier">يشمل العداد الفروع؛ الفرع ذو العلامة الجزئية يظهر ضمن غير كاملة العلامة، وتظهر علامته المستحقة في التفاصيل.</p>
      <section className="review-section" aria-labelledby="review-title">
        <div className="review-heading"><span className="section-eyebrow">التصحيح التفصيلي</span><h2 id="review-title">راجعي إجاباتك خطوة بخطوة</h2></div>
        <div className="review-list">
          {questions.map((question, index) => {
            const graded = result.questions[index];
            return (
              <details className="review-question" key={question.id} open={index === 0}>
                <summary>
                  <span className="review-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="review-summary-name">{question.title}<small>{question.lesson} · {question.pages}</small></span>
                  <strong dir="ltr">{graded.earned} / {graded.possible}</strong>
                  <ChevronDown size={19} aria-hidden="true" className="review-chevron" />
                </summary>
                <div className="review-body">
                  <p className="review-context"><Rich content={question.intro} /></p>
                  {question.figure && <figure className="review-figure"><Figure type={question.figure} /></figure>}
                  {question.parts.map((part, partIndex) => {
                    const branch = graded.parts[partIndex];
                    return (
                      <div className="review-branch" key={part.id}>
                        <div className="review-branch-heading"><h3>{branchLetters[partIndex]}. <Rich content={part.label} /></h3><span className={branch.earned === branch.possible ? "full-mark" : "partial-mark"}>{branch.earned} / {branch.possible}</span></div>
                        <div className="answer-comparison">
                          <div><span>إجابتك</span><strong><StudentAnswer question={question} part={part} response={branch.response} /></strong></div>
                          <div><span>الإجابة الصحيحة</span><strong><Rich content={branch.correct} /></strong></div>
                        </div>
                        <p className="branch-explanation"><Rich content={branch.explanation} /></p>
                      </div>
                    );
                  })}
                  <div className="full-solution"><span>خطوات الحل والتفسير</span><p><Rich content={graded.solution} /></p></div>
                  <p className="review-reference">المرجع: {question.lesson}، {question.pages} <span>·</span> المهارة: {question.skill}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function TeacherDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [key, setKey] = useState<AnswerKey | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordRef.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== "somer173") {
      setError("كلمة المرور غير صحيحة.");
      return;
    }
    const module = await import("./data/answerKey");
    setKey(module.answerKey);
    setPassword("");
    setError("");
  }

  return (
    <div className="teacher-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="teacher-dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
        <div className="teacher-dialog-head"><div><span className="section-eyebrow">للمعلم فقط</span><h2 id="teacher-title">منطقة المعلم</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق منطقة المعلم"><X size={22} /></button></div>
        {!key ? (
          <form className="teacher-login" onSubmit={unlock}>
            <LockKeyhole size={32} strokeWidth={1.4} aria-hidden="true" />
            <p>أدخل كلمة المرور لعرض مفتاح الإجابات وسلم التصحيح ومراجع الرسوم.</p>
            <label htmlFor="teacher-password">كلمة المرور</label>
            <input id="teacher-password" ref={passwordRef} type="password" required value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="off" />
            {error && <p className="form-error" role="alert">كلمة المرور غير صحيحة.</p>}
            <button type="submit" className="primary-button">دخول</button>
            <small>هذه حماية محلية داخل المتصفح فقط، وليست مصادقة حقيقية أو تشفيراً.</small>
          </form>
        ) : (
          <div className="teacher-content">
            <p className="teacher-intro">عشرة أسئلة رئيسية، لكل سؤال عشر علامات، والمجموع مئة علامة. تُمنح درجات الفروع مستقلة، ويُقبل الجواب العلمي المكافئ. تتضمن الفروع التفسيرية معايير جزئية محددة.</p>
            {questions.map((question, index) => {
              const answer = key[question.id];
              return (
                <details className="teacher-question" key={question.id}>
                  <summary>السؤال {index + 1}: {question.title} <span>10 علامات</span><ChevronDown size={17} aria-hidden="true" /></summary>
                  <div className="teacher-question-body">
                    <p><strong>المهارة:</strong> {question.skill}</p>
                    <p><strong>المرجع:</strong> {question.lesson}، {question.pages}، كتاب الفيزياء والكيمياء للصف السابع.</p>
                    <div className="teacher-links">
                      {question.lesson.includes("الحركة والسكون") && <a href={lessonOneUrl} target="_blank" rel="noreferrer">مصدر الدرس الأول</a>}
                      {question.lesson.includes("القوة والحركة") && <a href={lessonTwoUrl} target="_blank" rel="noreferrer">مصدر الدرس الثاني</a>}
                    </div>
                    {question.figureSource && <p><strong>مصدر الرسم:</strong> {question.figureSource}</p>}
                    <p><strong>خطوات الحل:</strong> <Rich content={answer.solution} /></p>
                    <div className="teacher-rubrics">
                      {question.parts.map((part, partIndex) => {
                        const rubric = answer.rubric[part.id];
                        return (
                          <div key={part.id}>
                            <h3>{branchLetters[partIndex]}. <Rich content={part.label} /> <span>{rubric.points} علامات</span></h3>
                            <p>الإجابة: <Rich content={rubric.correct} /></p>
                            <p>التفسير: <Rich content={rubric.explanation} /></p>
                            {rubric.kind === "short" && (
                              <ul>{rubric.criteria.map((criterion, criterionIndex) => <li key={criterionIndex}>{criterion.description} ({criterion.points} علامة)</li>)}</ul>
                            )}
                            {rubric.kind === "number" && rubric.points > 1 && <small>عند صحة القيمة مع وحدة مدخلة خاطئة، تُحسم علامة واحدة. تُحسب خطوات المسألة في فروع مستقلة.</small>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
            <p className="teacher-disclaimer">حماية كلمة المرور في الواجهة الأمامية فقط؛ يمكن لمن يفحص ملفات الموقع الوصول إلى شيفرته. لا تُستخدم لحماية بيانات حساسة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Footer({ onTeacherOpen }: { onTeacherOpen: () => void }) {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div className="footer-person"><span>للتواصل</span><strong>المهندس سومر شاهين</strong></div>
        <div className="footer-links">
          <a href="tel:0930215022" className="phone-link"><span>الهاتف</span><b dir="ltr">0930215022</b></a>
          <a href="https://wa.me/963930215022" target="_blank" rel="noopener noreferrer" className="whatsapp-link" aria-label="التواصل عبر WhatsApp"><FaWhatsapp size={21} aria-hidden="true" /> <span>WhatsApp</span></a>
        </div>
        <button type="button" className="teacher-entry" onClick={onTeacherOpen}><LockKeyhole size={14} aria-hidden="true" /> دخول المعلم</button>
      </div>
    </footer>
  );
}

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const attemptRef = useRef<Attempt | null>(attempt);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [muted, setMuted] = useState(() => loadMuted());
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<ExamResult | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const closeTeacher = useCallback(() => setTeacherOpen(false), []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [attempt?.status, attempt?.questionIndex]);

  useEffect(() => {
    if (attempt?.status !== "in_progress") return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(interval);
  }, [attempt?.status]);

  useEffect(() => {
    if (attempt?.status !== "submitted") return;
    let active = true;
    void import("./data/answerKey").then(({ answerKey }) => {
      if (active) setResult(gradeExam(questions, attempt.responses, answerKey));
    });
    return () => { active = false; };
  }, [attempt?.status, attempt?.startedAt, attempt?.finishedAt]);

  const commitAttempt = (next: Attempt) => {
    attemptRef.current = next;
    saveAttempt(next);
    setAttempt(next);
  };

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const studentName = name.trim();
    if (!studentName) {
      setNameError("اكتبي اسمك قبل بدء الاختبار.");
      return;
    }
    if (attemptRef.current) return;
    setNameError("");
    const startedAt = Date.now();
    commitAttempt({ version: 1, status: "in_progress", studentName, responses: {}, questionIndex: 0, startedAt });
    setNow(startedAt);
    playCue("start", muted);
  }

  function answer(id: string, value: string) {
    const current = attemptRef.current;
    if (current?.status !== "in_progress") return;
    commitAttempt({ ...current, responses: { ...current.responses, [id]: value } });
  }

  function navigate(index: number) {
    const current = attemptRef.current;
    if (current?.status !== "in_progress" || index < 0 || index >= questions.length) return;
    commitAttempt({ ...current, questionIndex: index });
  }

  function submit() {
    const current = attemptRef.current;
    if (current?.status !== "in_progress" || !isExamComplete(questions, current.responses)) return;
    commitAttempt({ ...current, status: "submitted", finishedAt: Math.max(Date.now(), current.startedAt) });
    playCue("submit", muted);
  }

  function newAttempt() {
    if (attemptRef.current?.status !== "submitted") return;
    attemptRef.current = null;
    clearAttempt();
    setAttempt(null);
    setResult(null);
    setName("");
    setNameError("");
  }

  const answered = attempt ? questions.flatMap((question) => question.parts).filter((part) => attempt.responses[part.id]?.trim()).length : 0;
  const endTime = attempt?.status === "submitted" ? (attempt.finishedAt ?? now) : now;
  const elapsed = attempt ? formatDuration(endTime - attempt.startedAt) : "00:00:00";

  return (
    <div className={`app-shell ${attempt?.status === "in_progress" ? "is-exam" : ""}`} dir="rtl">
      <Header attempt={attempt} elapsed={elapsed} answered={answered} muted={muted} onToggleMute={() => { setMuted(!muted); saveMuted(!muted); }} />
      {!attempt && <StartScreen name={name} nameError={nameError} setName={(value) => { setName(value); setNameError(""); }} onStart={start} />}
      {attempt?.status === "in_progress" && <QuizScreen attempt={attempt} onAnswer={answer} onNavigate={navigate} onSubmit={submit} />}
      {attempt?.status === "submitted" && <ResultsScreen attempt={attempt} result={result} onNewAttempt={newAttempt} />}
      <Footer onTeacherOpen={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherDialog onClose={closeTeacher} />}
    </div>
  );
}

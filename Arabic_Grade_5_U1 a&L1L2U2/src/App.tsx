import { useEffect, useMemo, useRef, useState } from 'react';
import { QUESTIONS, totalPoints, totalBranches, type Branch } from "./data/questions";

// ============================================================
// أنواع الإجابات
// ============================================================
type AnswerValue =
  | string // single_choice / true_false / fill_blank
  | string[] // multi_choice
  | Record<string, string> // classify: itemId -> categoryId
  | Record<string, string>; // match: leftId -> rightId (or pairId -> right)

type AnswersMap = Record<string, AnswerValue>;

interface StoredSession {
  phase: 'intro' | 'exam' | 'result';
  studentName: string;
  startTime: number | null;
  answers: AnswersMap;
  submitted: boolean;
  submitTime: number | null;
}

const STORAGE_KEY = 'grade5-arabic-exam-v1';

// ============================================================
// أصوات قصيرة عبر Web Audio API
// ============================================================
function playBeep(freq: number, durationMs: number) {
  try {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => ctx.close(), durationMs + 100);
  } catch {
    // تجاهل أي خطأ في الصوت
  }
}
const playStartSound = () => {
  playBeep(660, 180);
  setTimeout(() => playBeep(880, 220), 200);
};
const playSubmitSound = () => {
  playBeep(880, 160);
  setTimeout(() => playBeep(660, 180), 160);
  setTimeout(() => playBeep(440, 280), 340);
};

// ============================================================
// مساعدات
// ============================================================
const p = (n: number) => String(n).padStart(2, '0');
function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function normalize(s: string): string {
  return s
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة التشكيل
    .replace(/[ـ\s]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

// ============================================================
// حساب العلامة لفرع واحد
// ============================================================
interface BranchGrade {
  maxPoints: number;
  earnedPoints: number;
  correct: boolean;
  partial: boolean;
  studentAnswerDisplay: string;
  correctAnswerDisplay: string;
}

function evaluateBranch(branch: Branch, answer: AnswerValue | undefined): BranchGrade {
  const maxPts = branch.points;
  
  if (answer === undefined || answer === null || answer === '') {
    return {
      maxPoints: maxPts, earnedPoints: 0, correct: false, partial: false,
      studentAnswerDisplay: '(لم تُجب)',
      correctAnswerDisplay: correctDisplay(branch),
    };
  }

  switch (branch.type) {
    case 'single_choice':
    case 'true_false': {
      const chosen = answer as string;
      const correct = chosen === branch.correctChoiceId;
      return {
        maxPoints: maxPts, earnedPoints: correct ? maxPts : 0, correct, partial: false,
        studentAnswerDisplay: displayChoiceLabel(branch, chosen),
        correctAnswerDisplay: displayChoiceLabel(branch, branch.correctChoiceId!),
      };
    }
    case 'multi_choice': {
      const chosen = (answer as string[]) || [];
      const correctSet = new Set(branch.correctChoiceIds || []);
            if (chosen.length === 0) {
        return { maxPoints: maxPts, earnedPoints: 0, correct: false, partial: false,
          studentAnswerDisplay: '(لم تُجب)', correctAnswerDisplay: (branch.correctChoiceIds||[]).map(id=>displayChoiceLabel(branch,id)).join('، ') };
      }
      // علامات جزئية: عنصر صحيح = +نقطة واحدة تقريبية؛ نعطي نسبة من العلامة
      // نمنح علامة كاملة إذا التطابق تام، ونصف العلامة إذا اختار أكثر من نصف العناصر الصحيحة ولم يختر أي خطأ، وصفر إذا اختار عنصراً خاطئاً.
      const totalCorrect = correctSet.size;
      let truePositives = 0;
      let falsePositives = 0;
      chosen.forEach((id) => {
        if (correctSet.has(id)) truePositives++; else falsePositives++;
      });
      const allMatch = truePositives === totalCorrect && falsePositives === 0;
      let earned = 0;
      if (allMatch) {
        earned = maxPts;
      } else if (falsePositives === 0 && truePositives > 0) {
        // علامة نسبية بلا أخطاء
        earned = Math.round((maxPts * truePositives) / totalCorrect * 2) / 2;
      } else {
        earned = 0;
      }
      earned = Math.round(earned * 2) / 2;
      return {
        maxPoints: maxPts, earnedPoints: earned,
        correct: allMatch, partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay: chosen.map(id => displayChoiceLabel(branch, id)).join('، ') || '(لم تُجب)',
        correctAnswerDisplay: (branch.correctChoiceIds||[]).map(id => displayChoiceLabel(branch, id)).join('، '),
      };
    }
    case 'fill_blank': {
      const given = (answer as string) || '';
      const accepted = branch.acceptedAnswers || [];
      const normGiven = normalize(given);
      if (!normGiven) {
        return { maxPoints: maxPts, earnedPoints: 0, correct: false, partial: false,
          studentAnswerDisplay: '(لم تُجب)', correctAnswerDisplay: accepted.join(' / ') };
      }
      const isCorrect = accepted.some((a) => normalize(a) === normGiven);
      // نقاط جزئية: إذا احتوت الإجابة على كلمات مفتاحية
      let partialPts = 0;
      if (!isCorrect) {
        for (const a of accepted) {
          const aN = normalize(a);
          if (aN && normGiven.includes(aN.slice(0, Math.max(3, aN.length - 1))) && normGiven.length >= aN.length - 1) {
            partialPts = Math.floor(maxPts / 2);
            break;
          }
        }
      }
      return {
        maxPoints: maxPts, earnedPoints: isCorrect ? maxPts : partialPts,
        correct: isCorrect, partial: !isCorrect && partialPts > 0,
        studentAnswerDisplay: given,
        correctAnswerDisplay: accepted.join(' / '),
      };
    }
    case 'classify': {
      const given = answer as Record<string, string>;
      const items = branch.items || [];
      if (!given || Object.keys(given).length === 0) {
        return { maxPoints: maxPts, earnedPoints: 0, correct: false, partial: false,
          studentAnswerDisplay: '(لم تُجب)', correctAnswerDisplay: correctDisplay(branch) };
      }
      let correctCount = 0;
      const studentBits: string[] = [];
      items.forEach((it) => {
        const catId = given[it.id];
        const catLabel = branch.categories?.find(c => c.id === catId)?.label || '—';
        studentBits.push(`${it.text} ← ${catLabel}`);
        if (catId === it.correctCategoryId) correctCount++;
      });
      const ratio = correctCount / items.length;
      const earned = Math.round(maxPts * ratio * 2) / 2;
      return {
        maxPoints: maxPts, earnedPoints: earned,
        correct: correctCount === items.length, partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay: studentBits.join(' | '),
        correctAnswerDisplay: correctDisplay(branch),
      };
    }
    case 'match': {
      const given = answer as Record<string, string>;
      const pairs = branch.pairs || [];
      if (!given || Object.keys(given).length === 0) {
        return { maxPoints: maxPts, earnedPoints: 0, correct: false, partial: false,
          studentAnswerDisplay: '(لم تُجب)', correctAnswerDisplay: correctDisplay(branch) };
      }
      let correctCount = 0;
      const studentBits: string[] = [];
      pairs.forEach((p) => {
        const chosen = given[p.id];
        studentBits.push(`${p.left} ← ${chosen || '—'}`);
        if (chosen === p.right) correctCount++;
      });
      const ratio = correctCount / pairs.length;
      const earned = Math.round(maxPts * ratio * 2) / 2;
      return {
        maxPoints: maxPts, earnedPoints: earned,
        correct: correctCount === pairs.length, partial: earned > 0 && earned < maxPts,
        studentAnswerDisplay: studentBits.join(' | '),
        correctAnswerDisplay: correctDisplay(branch),
      };
    }
  }
}

function displayChoiceLabel(branch: Branch, id: string): string {
  return branch.choices?.find(c => c.id === id)?.text || id;
}

function correctDisplay(branch: Branch): string {
  switch (branch.type) {
    case 'single_choice':
    case 'true_false':
      return displayChoiceLabel(branch, branch.correctChoiceId!);
    case 'multi_choice':
      return (branch.correctChoiceIds || []).map(id => displayChoiceLabel(branch, id)).join('، ');
    case 'fill_blank':
      return (branch.acceptedAnswers || []).join(' / ');
    case 'classify':
      return (branch.items || [])
        .map(it => {
          const cat = branch.categories?.find(c => c.id === it.correctCategoryId);
          return `${it.text} ← ${cat?.label || it.correctCategoryId}`;
        })
        .join(' | ');
    case 'match':
      return (branch.pairs || []).map(p => `${p.left} ← ${p.right}`).join(' | ');
  }
}


export interface QuestionGrades {
  perQuestion: {
    question: typeof QUESTIONS[number];
    perBranch: { branch: Branch; grade: BranchGrade }[];
    totalEarned: number;
    totalMax: number;
  }[];
  finalScore: number;
  correctBranches: number;
  wrongBranches: number;
  partialBranches: number;
  unanswered: number;
}

export function computeGrades(answers: AnswersMap): QuestionGrades {
  const perQuestion = QUESTIONS.map((q) => {
    const perBranch = q.branches.map((b) => {
      const g = evaluateBranch(b, answers[b.id]);
      return { branch: b, grade: g };
    });
    const totalEarned = perBranch.reduce((s, x) => s + x.grade.earnedPoints, 0);
    const totalMax = perBranch.reduce((s, x) => s + x.grade.maxPoints, 0);
    return { question: q, perBranch, totalEarned, totalMax };
  });
  const finalScore = perQuestion.reduce((s, x) => s + x.totalEarned, 0);
  const correctBranches = perQuestion.reduce((s, q) => s + q.perBranch.filter(x => x.grade.correct).length, 0);
  const wrongBranches = perQuestion.reduce((s, q) => s + q.perBranch.filter(x => !x.grade.correct && x.grade.earnedPoints === 0 && x.grade.studentAnswerDisplay !== '(لم تُجب)').length, 0);
  const partialBranches = perQuestion.reduce((s, q) => s + q.perBranch.filter(x => x.grade.partial).length, 0);
  const unanswered = perQuestion.reduce((s, q) => s + q.perBranch.filter(x => x.grade.studentAnswerDisplay === '(لم تُجب)').length, 0);
  return { perQuestion, finalScore, correctBranches, wrongBranches, partialBranches, unanswered };
}

// ============================================================
// المكون الرئيسي
// ============================================================
export default function App() {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'intro' | 'exam' | 'result' | 'teacher'>('intro');
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [submitTime, setSubmitTime] = useState<number | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [teacherPwd, setTeacherPwd] = useState('');
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // استعادة الجلسة
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s: StoredSession = JSON.parse(raw);
        if (s.phase === 'exam') {
          setName(s.studentName);
          setStartTime(s.startTime);
          setAnswers(s.answers || {});
          setPhase('exam');
        } else if (s.phase === 'result' && s.submitted) {
          setName(s.studentName);
          setAnswers(s.answers || {});
          setStartTime(s.startTime);
          setSubmitTime(s.submitTime);
          setPhase('result');
        }
      }
    } catch { /* ignore */ }
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    const s: StoredSession = {
      phase: phase === 'teacher' ? 'intro' : phase,
      studentName: name,
      startTime,
      answers: (phase === 'exam' || phase === 'result') ? answersRef.current : {},
      submitted: phase === 'result',
      submitTime: phase === 'result' ? submitTime : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, [phase, name, startTime, answers, submitTime]);

  // عداد الوقت
  useEffect(() => {
    if (phase !== 'exam' || startTime === null) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    return () => clearInterval(t);
  }, [phase, startTime]);

  // إحصاء الفروع المجاب عنها
  const { answeredCount, branchCount, mandatoryComplete } = useMemo(() => {
    let total = 0;
    let answered = 0;
    QUESTIONS.forEach((q) => q.branches.forEach((b) => {
      total++;
      const a = answers[b.id];
      if (isBranchAnswered(b, a)) answered++;
    }));
    return { answeredCount: answered, branchCount: total, mandatoryComplete: answered === total };
  }, [answers]);

  function startExam() {
    if (!name.trim()) return;
    playStartSound();
    setAnswers({});
    setStartTime(Date.now());
    setSubmitTime(null);
    setCurrentQIdx(0);
    setElapsed(0);
    setPhase('exam');
  }

  function submitExam() {
    if (!mandatoryComplete) return;
    playSubmitSound();
    setSubmitTime(Date.now());
    setPhase('result');
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setName('');
    setAnswers({});
    setStartTime(null);
    setSubmitTime(null);
    setPhase('intro');
    setCurrentQIdx(0);
  }

  function setAnswer(branchId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [branchId]: value }));
  }


  // ---------- واجهة ----------
  if (phase === 'intro') {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl bg-white shadow-xl rounded-2xl p-6 sm:p-10 border border-emerald-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-2xl shadow-md">📘</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">اختبار اللغة العربية</h1>
              <p className="text-slate-500">الصف الخامس الأساسي – الوحدة الأولى كاملة وأول درسين من الوحدة الثانية</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-slate-700 leading-7">
            <p className="font-bold text-emerald-800 mb-2">تعليمات الاختبار:</p>
            <ul className="list-disc pr-5 space-y-1">
              <li>عدد الأسئلة الرئيسية: <strong>١٥ سؤالاً</strong>، تتضمن فروعاً متنوعة.</li>
              <li>العلامة الكلية: <strong>١٠٠</strong>، مع علامات جزئية لبعض الفروع.</li>
              <li>مدة الاختبار غير محددة، ويعمل العدّاد تصاعدياً منذ بداية الاختبار.</li>
              <li>تُحفظ إجاباتك تلقائياً في متصفحك؛ إذا أغلقت الصفحة أو حدّثتها، تعود إجاباتك.</li>
              <li>تنوّعت الأسئلة بين: اختيار من متعدد، صح أو خطأ، إكمال الفراغ، تصنيف، مطابقة.</li>
              <li>لن تُعرض الإجابات الصحيحة قبل التسليم، ويمكنك التنقل بين الأسئلة.</li>
              <li>زر «تسليم الاختبار» لا يُفعَّل إلا بعد الإجابة عن جميع الفروع.</li>
            </ul>
          </div>
          <label className="block mb-3 font-semibold text-slate-700">اسم الطالب</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اكتب اسمك هنا..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={startExam}
              disabled={!name.trim()}
              className="flex-1 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ابدأ الاختبار
            </button>
            <button
              onClick={() => setPhase('teacher')}
              className="flex-1 sm:flex-none bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-800 transition"
            >
              مفتاح الإجابة للمعلم
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'teacher') {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => { setPhase('intro'); setTeacherUnlocked(false); setTeacherPwd(''); }} className="mb-4 bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600">
            ← العودة
          </button>
          <h1 className="text-3xl font-bold mb-6">مفتاح الإجابة للمعلم</h1>
          {!teacherUnlocked ? (
            <div className="bg-slate-800 p-6 rounded-xl">
              <label className="block mb-2">أدخل كلمة المرور:</label>
              <input
                type="password"
                value={teacherPwd}
                onChange={(e) => setTeacherPwd(e.target.value)}
                className="w-full rounded-lg px-4 py-2 text-slate-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && teacherPwd === 'somer173') setTeacherUnlocked(true);
                }}
              />
              <button
                onClick={() => { if (teacherPwd === 'somer173') setTeacherUnlocked(true); else alert('كلمة المرور غير صحيحة'); }}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold"
              >
                دخول
              </button>
            </div>
          ) : (
            <TeacherKey />
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const g = computeGrades(answers);
    const pct = Math.round((g.finalScore / totalPoints()) * 100);
    const timeTaken = submitTime && startTime ? Math.floor((submitTime - startTime) / 1000) : 0;
    const timeStr = formatHMS(timeTaken);
    const nowStr = new Date().toLocaleString('ar-EG');
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">نتيجة الاختبار</h1>
            <p className="text-slate-600 mb-6">الطالب: <strong className="text-emerald-700 text-lg">{name}</strong></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <Stat label="العلامة" value={`${g.finalScore} / ${totalPoints()}`} color="emerald" />
              <Stat label="النسبة" value={`${pct}%`} color="sky" />
              <Stat label="الوقت" value={timeStr} color="amber" />
              <Stat label="إجابات صحيحة" value={String(g.correctBranches)} color="green" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <Stat label="إجابات خاطئة" value={String(g.wrongBranches)} color="red" />
              <Stat label="إجابات جزئية" value={String(g.partialBranches)} color="orange" />
              <Stat label="لم تُجب" value={String(g.unanswered)} color="slate" />
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadReport(name, nowStr, timeStr, g)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl shadow"
              >
                ⬇ تحميل التقرير (TXT)
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-2xl p-6 sm:p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">مراجعة الإجابات</h2>
            <div className="space-y-6">
              {g.perQuestion.map((pq) => (
                <div key={pq.question.id} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="font-bold text-slate-800 mb-2">
                    {pq.question.order}. {pq.question.title}
                    <span className="text-slate-400 font-normal text-sm ms-2">({pq.question.lesson})</span>
                  </h3>
                  <div className="text-sm text-slate-600 mb-3">
                    مجموع علامات هذا السؤال: <strong>{pq.totalMax}</strong> — حصلت على: <strong className="text-emerald-700">{pq.totalEarned}</strong>
                  </div>
                  <div className="space-y-3">
                    {pq.perBranch.map((pb, idx) => {
                      const ok = pb.grade.correct;
                      const part = pb.grade.partial;
                      return (
                        <div key={pb.branch.id} className={`rounded-lg p-3 border-r-4 ${ok ? 'border-emerald-500 bg-emerald-50' : part ? 'border-amber-500 bg-amber-50' : 'border-red-400 bg-red-50'}`}>
                          <div className="font-semibold text-slate-800 mb-1">الفرع {idx + 1}: {pb.branch.prompt}</div>
                          <div className="text-sm space-y-1 text-slate-700">
                            <div>إجابتك: <span className={ok ? 'text-emerald-700 font-semibold' : part ? 'text-amber-700 font-semibold' : 'text-red-700 font-semibold'}>{pb.grade.studentAnswerDisplay}</span></div>
                            <div>الإجابة الصحيحة: <span className="text-emerald-800 font-semibold">{pb.grade.correctAnswerDisplay}</span></div>
                            <div>العلامة: {pb.grade.earnedPoints} / {pb.grade.maxPoints}</div>
                            <div className="text-slate-600 bg-white/70 rounded p-2 mt-2"><strong>شرح:</strong> {pb.branch.explanation}</div>
                            <div className="text-xs text-slate-500">المرجع: {pb.branch.source.lesson} — ص {pb.branch.source.page}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'exam'
  const currentQ = QUESTIONS[currentQIdx];
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 pb-28">
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white grid place-items-center font-bold text-sm">ع</div>
            <div>
              <div className="text-sm font-bold text-slate-800">اختبار العربية - الصف الخامس</div>
              <div className="text-xs text-slate-500">الطالب: {name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500">الوقت</div>
              <div className="font-mono font-bold text-lg text-slate-800 tabular-nums">{formatHMS(elapsed)}</div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-xs text-slate-500">التقدّم</div>
              <div className="font-bold text-slate-800">{answeredCount}/{branchCount}</div>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-slate-200">
          <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all" style={{ width: `${(answeredCount / branchCount) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow p-5 sm:p-7 border border-slate-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              <span className="text-emerald-700">السؤال {currentQ.order}:</span> {currentQ.title}
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">{currentQ.lesson}</span>
          </div>
          <div className="space-y-6">
            {currentQ.branches.map((b, bi) => (
              <BranchEditor
                key={b.id}
                branchIndex={bi}
                branch={b}
                value={answers[b.id]}
                onChange={(v) => setAnswer(b.id, v)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
            disabled={currentQIdx === 0}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            السؤال السابق
          </button>
          <div className="text-sm text-slate-500">
            {currentQIdx + 1} / {QUESTIONS.length}
          </div>
          {currentQIdx < QUESTIONS.length - 1 ? (
            <button
              onClick={() => setCurrentQIdx((i) => Math.min(QUESTIONS.length - 1, i + 1))}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              السؤال التالي
            </button>
          ) : (
            <button
              onClick={submitExam}
              disabled={!mandatoryComplete}
              className="px-6 py-2 rounded-lg bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title={mandatoryComplete ? '' : 'أجب عن جميع الفروع أولاً'}
            >
              تسليم الاختبار
            </button>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm font-semibold text-slate-700 mb-2">التنقل السريع:</div>
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((q, idx) => {
              const qAnswered = q.branches.every((b) => isBranchAnswered(b, answers[b.id]));
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIdx(idx)}
                  className={`h-9 w-9 rounded-lg font-bold text-sm border transition ${
                    idx === currentQIdx
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : qAnswered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {q.order}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            تمت الإجابة عن <strong>{answeredCount}</strong> من أصل <strong>{branchCount}</strong> فرعاً.
          </div>
          <button
            onClick={submitExam}
            disabled={!mandatoryComplete}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            تسليم الاختبار
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// مكون الفرع
// ============================================================
function BranchEditor({
  branchIndex,
  branch,
  value,
  onChange,
}: {
  branchIndex: number;
  branch: Branch;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const label = `أ-${branchIndex + 1}`;
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-start gap-2 mb-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">{label}</span>
        <div className="font-semibold text-slate-800 leading-relaxed">
          {branch.prompt}
          <span className="text-slate-400 text-sm ms-2">({branch.points} علامة)</span>
        </div>
      </div>
      {branch.type === 'single_choice' && (
        <div className="grid gap-2 ps-8">
          {branch.choices!.map((c) => (
            <label key={c.id} className={`choice-card flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
              value === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}>
              <input
                type="radio"
                name={branch.id}
                checked={value === c.id}
                onChange={() => onChange(c.id)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span>{c.text}</span>
            </label>
          ))}
        </div>
      )}
      {branch.type === 'true_false' && (
        <div className="grid gap-2 ps-8 sm:grid-cols-2">
          {branch.choices!.map((c) => (
            <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
              value === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}>
              <input
                type="radio"
                name={branch.id}
                checked={value === c.id}
                onChange={() => onChange(c.id)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className="font-semibold">{c.text}</span>
            </label>
          ))}
        </div>
      )}
      {branch.type === 'multi_choice' && (
        <div className="grid gap-2 ps-8">
          {branch.choices!.map((c) => {
            const arr = (value as string[]) || [];
            const checked = arr.includes(c.id);
            return (
              <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, c.id]);
                    else onChange(arr.filter((x) => x !== c.id));
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>{c.text}</span>
              </label>
            );
          })}
        </div>
      )}
      {branch.type === 'fill_blank' && {
      } && null}
      {branch.type === 'fill_blank' && (
        <div className="ps-8">
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}
      {branch.type === 'classify' && (
        <div className="space-y-2 ps-8">
          {branch.items!.map((it) => {
            const rec = (value as Record<string, string>) || {};
            return (
              <div key={it.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 flex-wrap">
                <span className="font-semibold text-slate-700 flex-1 min-w-0">{it.text}</span>
                <div className="flex gap-2">
                  {branch.categories!.map((cat) => (
                    <label key={cat.id} className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
                      rec[it.id] === cat.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name={`${branch.id}_${it.id}`}
                        className="hidden"
                        checked={rec[it.id] === cat.id}
                        onChange={() => onChange({ ...rec, [it.id]: cat.id })}
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {branch.type === 'match' && (
        <div className="space-y-2 ps-8">
          {(() => {
            // ترتيب ثابت لعناصر اليمين
            const pairs = branch.pairs!;
            const rightItems = pairs.map(p => p.right);
            const rec = (value as Record<string, string>) || {};
            return pairs.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 sm:w-1/3">{p.left}</span>
                <span className="text-slate-400 hidden sm:inline">←</span>
                <select
                  value={rec[p.id] || ''}
                  onChange={(e) => onChange({ ...rec, [p.id]: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">-- اختر المعنى المناسب --</option>
                  {rightItems.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

// ============================================================
// مكون مفتاح الإجابة للمعلم
// ============================================================
function TeacherKey() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-5 text-sm leading-7">
        <p><strong>العلامة الكلية:</strong> ١٠٠</p>
        <p><strong>عدد الأسئلة:</strong> ١٥ سؤالاً رئيسياً</p>
        <p><strong>عدد الفروع:</strong> {totalBranches()} فرعاً</p>
      </div>
      {QUESTIONS.map((q) => {
        const qTotal = q.branches.reduce((s, b) => s + b.points, 0);
        return (
          <div key={q.id} className="bg-slate-800 rounded-xl p-5">
            <h3 className="text-xl font-bold text-emerald-300 mb-2">
              {q.order}. {q.title} <span className="text-slate-400 text-sm">({q.lesson}) — {qTotal} علامة</span>
            </h3>
            <div className="space-y-3 mt-4">
              {q.branches.map((b, i) => (
                <div key={b.id} className="border-r-2 border-emerald-500 pr-3 py-2">
                  <div className="font-semibold">{i+1}- {b.prompt} <span className="text-amber-300">({b.points} علامة)</span></div>
                  <div className="text-slate-200 mt-1">الإجابة: <span className="text-emerald-300">{correctDisplay(b)}</span></div>
                  <div className="text-slate-300 text-sm mt-1">الشرح: {b.explanation}</div>
                  <div className="text-slate-400 text-xs mt-1">المرجع: {b.source.lesson} — صفحة {b.source.page}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// مكونات فرعية
// ============================================================
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    sky: 'bg-sky-50 border-sky-200 text-sky-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color] || colors.slate}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-xl sm:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

// ============================================================
// تحقق من إجابة الفرع
// ============================================================
function isBranchAnswered(b: Branch, a: AnswerValue | undefined): boolean {
  if (a === undefined || a === null) return false;
  switch (b.type) {
    case 'single_choice':
    case 'true_false':
      return typeof a === 'string' && a.length > 0;
    case 'multi_choice':
      return Array.isArray(a) && a.length > 0;
    case 'fill_blank':
      return typeof a === 'string' && a.trim().length > 0;
    case 'classify': {
      const items = b.items || [];
      if (typeof a !== 'object' || a === null) return false;
      return items.every((it) => !!(a as Record<string, string>)[it.id]);
    }
    case 'match': {
      const pairs = b.pairs || [];
      if (typeof a !== 'object' || a === null) return false;
      return pairs.every((p) => !!(a as Record<string, string>)[p.id]);
    }
  }
}

// ============================================================
// توليد تقرير TXT
// ============================================================
function downloadReport(
  studentName: string,
  dateStr: string,
  timeStr: string,
  g: QuestionGrades,
) {
  const lines: string[] = [];
  lines.push('====================================================================');
  lines.push('تقرير اختبار اللغة العربية - الصف الخامس الأساسي');
  lines.push('====================================================================');
  lines.push('');
  lines.push(`اسم الطالب: ${studentName}`);
  lines.push(`تاريخ ووقت التسليم: ${dateStr}`);
  lines.push(`الوقت المستغرق: ${timeStr}`);
  lines.push(`النتيجة النهائية: ${g.finalScore} / ${totalPoints()}  (${Math.round((g.finalScore/totalPoints())*100)}%)`);
  lines.push('');
  lines.push(`عدد الإجابات الصحيحة: ${g.correctBranches}`);
  lines.push(`عدد الإجابات الخاطئة: ${g.wrongBranches}`);
  lines.push(`عدد الإجابات الجزئية: ${g.partialBranches}`);
  lines.push(`عدد الفروع غير المجابة: ${g.unanswered}`);
  lines.push('');
  lines.push('====================================================================');
  lines.push('المراجعة التفصيلية');
  lines.push('====================================================================');
  g.perQuestion.forEach((pq) => {
    lines.push('');
    lines.push(`---- السؤال ${pq.question.order}: ${pq.question.title} ----`);
    lines.push(`الدرس: ${pq.question.lesson}`);
    lines.push(`مجموع علامات السؤال: ${pq.totalMax} — حصل على: ${pq.totalEarned}`);
    pq.perBranch.forEach((pb, idx) => {
      lines.push('');
      lines.push(`  الفرع ${idx+1}: ${pb.branch.prompt}`);
      lines.push(`    إجابة الطالب: ${pb.grade.studentAnswerDisplay}`);
      lines.push(`    الإجابة الصحيحة: ${pb.grade.correctAnswerDisplay}`);
      lines.push(`    العلامة: ${pb.grade.earnedPoints} / ${pb.grade.maxPoints}`);
      lines.push(`    الشرح: ${pb.branch.explanation}`);
      lines.push(`    المرجع: ${pb.branch.source.lesson} — صفحة ${pb.branch.source.page}`);
    });
  });
  lines.push('');
  lines.push('====================================================================');
  lines.push('انتهى التقرير');
  lines.push('====================================================================');

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = studentName.trim().replace(/[^\p{L}\p{N}_-]/gu, '_') || 'student';
  a.download = `تقرير_اختبار_العربية_${safeName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// نوع مساعد (نسخة عن computeGrandes)

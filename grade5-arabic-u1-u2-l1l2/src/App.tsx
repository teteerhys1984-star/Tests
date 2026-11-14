import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_ID } from "./config";
import {
  QUESTIONS,
  totalBranches,
  totalPoints,
  type Branch,
} from "./data/questions";
import {
  computeGrades,
  correctDisplay,
  isBranchAnswered,
  type AnswersMap,
  type AnswerValue,
} from "./lib/grading";
import { downloadReport, formatHMS, buildReportText } from "./lib/report";
import {
  buildPayload,
  hasPending,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./lib/submit";

export { computeGrades };

interface StoredSession {
  phase: "intro" | "exam" | "result";
  attemptId: string;
  studentName: string;
  startTime: number | null;
  answers: AnswersMap;
  submitted: boolean;
  submitTime: number | null;
  sent: boolean;
}

const STORAGE_KEY = `exam:${EXAM_ID}:v1`;

function readStoredSession(): StoredSession | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.phase === "exam" && typeof parsed.startTime === "number") {
      return {
        phase: "exam",
        attemptId:
          typeof parsed.attemptId === "string" && parsed.attemptId
            ? parsed.attemptId
            : newAttemptId(),
        studentName:
          typeof parsed.studentName === "string" ? parsed.studentName : "",
        startTime: parsed.startTime,
        answers:
          parsed.answers && typeof parsed.answers === "object"
            ? parsed.answers
            : {},
        submitted: false,
        submitTime: null,
        sent: false,
      };
    }
    if (parsed.phase === "result" && parsed.submitted) {
      return {
        phase: "result",
        attemptId:
          typeof parsed.attemptId === "string" && parsed.attemptId
            ? parsed.attemptId
            : newAttemptId(),
        studentName:
          typeof parsed.studentName === "string" ? parsed.studentName : "",
        startTime: typeof parsed.startTime === "number" ? parsed.startTime : null,
        answers:
          parsed.answers && typeof parsed.answers === "object"
            ? parsed.answers
            : {},
        submitted: true,
        submitTime:
          typeof parsed.submitTime === "number" ? parsed.submitTime : null,
        sent: Boolean(parsed.sent),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(s: StoredSession | null): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (!s) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }
  } catch {
    /* التخزين المحلي غير متاح أو ممتلئ */
  }
}

// ============================================================
// أصوات قصيرة عبر Web Audio API
// ============================================================
function playBeep(freq: number, durationMs: number) {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000,
    );
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => void ctx.close(), durationMs + 100);
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

// الكلمات المقصودة بعبارة «الكلمة المخطوطة» لإبرازها بصرياً بتسطير واضح دون تعديل نص السؤال
const UNDERLINED_WORDS: Record<string, string> = {
  q3b: "أَنْجازاتِهِمْ",
  q9c: "إسْتَعْلَمَ",
};

function renderPromptText(branch: Branch) {
  const target = UNDERLINED_WORDS[branch.id];
  if (!target) return branch.prompt;
  const idx = branch.prompt.indexOf(target);
  if (idx === -1) return branch.prompt;
  return (
    <>
      {branch.prompt.slice(0, idx)}
      <u className="decoration-2 underline-offset-4 decoration-emerald-700 font-bold">
        {target}
      </u>
      {branch.prompt.slice(idx + target.length)}
    </>
  );
}

// ============================================================
// المكون الرئيسي
// ============================================================
export default function App() {
  const initialSession = useMemo(() => readStoredSession(), []);

  const [name, setName] = useState(() => initialSession?.studentName ?? "");
  const [phase, setPhase] = useState<"intro" | "exam" | "result" | "teacher">(
    () => initialSession?.phase ?? "intro",
  );
  const [attemptId, setAttemptId] = useState<string>(
    () => initialSession?.attemptId ?? newAttemptId(),
  );
  const [answers, setAnswers] = useState<AnswersMap>(
    () => initialSession?.answers ?? {},
  );
  const [startTime, setStartTime] = useState<number | null>(
    () => initialSession?.startTime ?? null,
  );
  const [submitTime, setSubmitTime] = useState<number | null>(
    () => initialSession?.submitTime ?? null,
  );
  const [sent, setSent] = useState<boolean>(() => initialSession?.sent ?? false);
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    if (initialSession?.phase === "result") {
      if (initialSession.sent) return "success";
      if (hasPending(initialSession.attemptId)) return "failed";
      return "idle";
    }
    return "idle";
  });
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [elapsed, setElapsed] = useState(() =>
    initialSession?.phase === "exam" && initialSession.startTime !== null
      ? Math.max(0, Math.floor((Date.now() - initialSession.startTime) / 1000))
      : 0,
  );
  const [teacherPwd, setTeacherPwd] = useState("");
  const [teacherError, setTeacherError] = useState("");
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const outboxRef = useRef<SubmissionPayload | null>(null);
  const sendingAttemptRef = useRef<string | null>(null);
  const activeAttemptRef = useRef<string>(attemptId);
  activeAttemptRef.current = attemptId;
  const submittingRef = useRef(false);

  // بناء الحمولة عند الحاجة لنتيجة محفوظة لم تُرسل بعد
  const buildResultPayload = useCallback(
    (
      id: string,
      studentName: string,
      sTime: number,
      subTime: number,
      ans: AnswersMap,
    ): SubmissionPayload => {
      const g = computeGrades(ans);
      const timeStr = formatHMS(Math.floor((subTime - sTime) / 1000));
      const dateStr = new Date(subTime).toLocaleString("ar-EG");
      const reportText = buildReportText(studentName, dateStr, timeStr, g);
      return buildPayload({
        attemptId: id,
        meta: { studentName, startTime: sTime, submitTime: subTime },
        answers: ans,
        grades: g,
        reportText,
      });
    },
    [],
  );

  // إرسال النتيجة بالخلفية دون حجب الواجهة
  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sendingAttemptRef.current === payload.attemptId) return;
    sendingAttemptRef.current = payload.attemptId;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sendingAttemptRef.current === payload.attemptId) {
        sendingAttemptRef.current = null;
      }
      if (activeAttemptRef.current !== payload.attemptId) return;
      if (ok) {
        setSent(true);
        setSendStatus("success");
      } else {
        setSendStatus("failed");
      }
    });
  }, []);

  // عند تحميل التطبيق: إعادة إرسال النتائج المعلّقة بصمت، واستكمال إرسال النتيجة المعروضة إن لم تُرسل بعد
  useEffect(() => {
    let active = true;
    const hadPendingOnMount = Boolean(
      initialSession?.phase === "result" &&
        !initialSession.sent &&
        hasPending(initialSession.attemptId),
    );
    void retryPending().then(() => {
      if (!active) return;
      if (
        initialSession?.phase === "result" &&
        !initialSession.sent &&
        activeAttemptRef.current === initialSession.attemptId
      ) {
        if (!hasPending(initialSession.attemptId)) {
          if (hadPendingOnMount) {
            setSent(true);
            setSendStatus("success");
            return;
          }
          const sTime =
            initialSession.startTime ?? initialSession.submitTime ?? Date.now();
          const subTime = initialSession.submitTime ?? sTime;
          const payload = buildResultPayload(
            initialSession.attemptId,
            initialSession.studentName,
            sTime,
            subTime,
            initialSession.answers,
          );
          outboxRef.current = payload;
          sendResult(payload);
        } else {
          outboxRef.current = buildResultPayload(
            initialSession.attemptId,
            initialSession.studentName,
            initialSession.startTime ?? initialSession.submitTime ?? Date.now(),
            initialSession.submitTime ?? Date.now(),
            initialSession.answers,
          );
          setSendStatus("failed");
        }
      }
    });
    return () => {
      active = false;
    };
  }, [buildResultPayload, initialSession, sendResult]);

  // حفظ تلقائي آمن
  useEffect(() => {
    if (phase === "teacher") return;
    if (
      phase === "intro" &&
      !name.trim() &&
      startTime === null &&
      submitTime === null &&
      Object.keys(answers).length === 0
    ) {
      writeStoredSession(null);
      return;
    }
    writeStoredSession({
      phase,
      attemptId,
      studentName: name,
      startTime,
      answers: phase === "exam" || phase === "result" ? answersRef.current : {},
      submitted: phase === "result",
      submitTime: phase === "result" ? submitTime : null,
      sent: phase === "result" ? sent : false,
    });
  }, [phase, attemptId, name, startTime, answers, submitTime, sent]);

  // عداد الوقت
  useEffect(() => {
    if (phase !== "exam" || startTime === null) return;
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [phase, startTime]);

  // إحصاء الفروع المجاب عنها
  const { answeredCount, branchCount, mandatoryComplete } = useMemo(() => {
    let total = 0;
    let answered = 0;
    QUESTIONS.forEach((q) =>
      q.branches.forEach((b) => {
        total++;
        const a = answers[b.id];
        if (isBranchAnswered(b, a)) answered++;
      }),
    );
    return {
      answeredCount: answered,
      branchCount: total,
      mandatoryComplete: answered === total,
    };
  }, [answers]);

  function startExam() {
    const trimmed = name.trim();
    if (!trimmed) return;
    playStartSound();
    const freshAttemptId = newAttemptId();
    submittingRef.current = false;
    outboxRef.current = null;
    sendingAttemptRef.current = null;
    setName(trimmed);
    setAttemptId(freshAttemptId);
    setAnswers({});
    setStartTime(Date.now());
    setSubmitTime(null);
    setSent(false);
    setSendStatus("idle");
    setCurrentQIdx(0);
    setElapsed(0);
    setPhase("exam");
  }

  function submitExam() {
    if (phase !== "exam" || !mandatoryComplete || submittingRef.current) return;
    submittingRef.current = true;
    playSubmitSound();

    const now = Date.now();
    const sTime = startTime ?? now;
    const frozenAnswers: AnswersMap = { ...answersRef.current };
    const studentName = name.trim() || name;

    setSubmitTime(now);
    setPhase("result");

    // الإرسال بالخلفية لا يمنع الطالب أبداً من رؤية النتيجة أو تنزيل التقرير
    try {
      const payload = buildResultPayload(
        attemptId,
        studentName,
        sTime,
        now,
        frozenAnswers,
      );
      outboxRef.current = payload;
      sendResult(payload);
    } catch {
      outboxRef.current = null;
      setSendStatus("failed");
    }
  }

  function handleResend() {
    if (sendStatus !== "failed") return;
    if (outboxRef.current) {
      sendResult(outboxRef.current);
      return;
    }
    const sTime = startTime ?? submitTime ?? Date.now();
    const subTime = submitTime ?? sTime;
    const payload = buildResultPayload(
      attemptId,
      name.trim() || name,
      sTime,
      subTime,
      answers,
    );
    outboxRef.current = payload;
    sendResult(payload);
  }

  function resetAll() {
    writeStoredSession(null);
    submittingRef.current = false;
    outboxRef.current = null;
    sendingAttemptRef.current = null;
    setAttemptId(newAttemptId());
    setName("");
    setAnswers({});
    setStartTime(null);
    setSubmitTime(null);
    setSent(false);
    setSendStatus("idle");
    setPhase("intro");
    setCurrentQIdx(0);
  }

  function setAnswer(branchId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [branchId]: value }));
  }

  function checkTeacherPassword() {
    if (teacherPwd === "somer173") {
      setTeacherUnlocked(true);
      setTeacherError("");
    } else {
      setTeacherError("كلمة المرور غير صحيحة.");
    }
  }

  // ---------- واجهة الترحيب ----------
  if (phase === "intro") {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 sm:p-8"
      >
        <div className="mx-auto max-w-3xl bg-white shadow-xl rounded-2xl p-6 sm:p-10 border border-emerald-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-2xl shadow-md">
              📘
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                اختبار اللغة العربية
              </h1>
              <p className="text-slate-500">
                الصف الخامس الأساسي – الوحدة الأولى كاملة وأول درسين من الوحدة الثانية
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-slate-700 leading-7">
            <p className="font-bold text-emerald-800 mb-2">تعليمات الاختبار:</p>
            <ul className="list-disc pr-5 space-y-1">
              <li>
                عدد الأسئلة الرئيسية: <strong>{QUESTIONS.length} سؤالاً</strong>، تتضمن{" "}
                <strong>{totalBranches()} فرعاً</strong> متنوعاً.
              </li>
              <li>
                العلامة الكلية: <strong>{totalPoints()}</strong>، مع علامات جزئية لبعض الفروع.
              </li>
              <li>مدة الاختبار غير محددة، ويعمل العدّاد تصاعدياً منذ بداية الاختبار.</li>
              <li>تُحفظ إجاباتك تلقائياً في متصفحك؛ إذا أغلقت الصفحة أو حدّثتها، تعود إجاباتك.</li>
              <li>تنوّعت الأسئلة بين: اختيار من متعدد، صح أو خطأ، إكمال الفراغ، تصنيف، مطابقة.</li>
              <li>لن تُعرض الإجابات الصحيحة قبل التسليم، ويمكنك التنقل بين الأسئلة.</li>
              <li>زر «تسليم الاختبار» لا يُفعَّل إلا بعد الإجابة عن جميع الفروع.</li>
            </ul>
          </div>
          <label
            htmlFor="student-name-input"
            className="block mb-3 font-semibold text-slate-700"
          >
            اسم الطالب
          </label>
          <input
            id="student-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") startExam();
            }}
            placeholder="اكتب اسمك هنا..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={startExam}
              disabled={!name.trim()}
              className="flex-1 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ابدأ الاختبار
            </button>
            <button
              type="button"
              onClick={() => {
                setTeacherError("");
                setPhase("teacher");
              }}
              className="flex-1 sm:flex-none bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-800 transition"
            >
              مفتاح الإجابة للمعلم
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- واجهة المعلم ----------
  if (phase === "teacher") {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8"
      >
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => {
              setPhase("intro");
              setTeacherUnlocked(false);
              setTeacherPwd("");
              setTeacherError("");
            }}
            className="mb-4 bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600"
          >
            → العودة
          </button>
          <h1 className="text-3xl font-bold mb-6">مفتاح الإجابة للمعلم</h1>
          {!teacherUnlocked ? (
            <div className="bg-slate-800 p-6 rounded-xl">
              <label
                htmlFor="teacher-password-input"
                className="block mb-2 text-slate-100"
              >
                أدخل كلمة المرور:
              </label>
              <input
                id="teacher-password-input"
                type="password"
                value={teacherPwd}
                onChange={(e) => {
                  setTeacherPwd(e.target.value);
                  if (teacherError) setTeacherError("");
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkTeacherPassword();
                }}
              />
              {teacherError && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-semibold text-rose-300"
                >
                  {teacherError}
                </p>
              )}
              <button
                type="button"
                onClick={checkTeacherPassword}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold text-white"
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

  // ---------- واجهة النتيجة ----------
  if (phase === "result") {
    const g = computeGrades(answers);
    const maxPts = totalPoints();
    const pct = Math.round((g.finalScore / maxPts) * 100);
    const timeTaken =
      submitTime && startTime
        ? Math.max(0, Math.floor((submitTime - startTime) / 1000))
        : 0;
    const timeStr = formatHMS(timeTaken);
    const submitDateStr = new Date(submitTime ?? Date.now()).toLocaleString(
      "ar-EG",
    );

    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="bg-white shadow-lg rounded-2xl p-5 sm:p-8 border border-slate-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              نتيجة الاختبار
            </h1>
            <p className="text-slate-600 mb-6 break-words">
              الطالب:{" "}
              <strong className="text-emerald-700 text-lg">{name}</strong>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
              <Stat
                label="العلامة"
                value={`${g.finalScore} / ${maxPts}`}
                color="emerald"
              />
              <Stat label="النسبة" value={`${pct}%`} color="sky" />
              <Stat label="الوقت" value={timeStr} color="amber" />
              <Stat
                label="إجابات صحيحة"
                value={String(g.correctBranches)}
                color="green"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 text-center">
              <Stat
                label="إجابات خاطئة"
                value={String(g.wrongBranches)}
                color="red"
              />
              <Stat
                label="إجابات جزئية"
                value={String(g.partialBranches)}
                color="orange"
              />
              <Stat
                label="لم تُجب"
                value={String(g.unanswered)}
                color="slate"
              />
            </div>

            <SendStatusBanner status={sendStatus} onResend={handleResend} />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadReport(name, submitDateStr, timeStr, g)
                }
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl shadow"
              >
                ⬇ تحميل التقرير (TXT)
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-2xl p-5 sm:p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              مراجعة الإجابات
            </h2>
            <div className="space-y-6">
              {g.perQuestion.map((pq) => (
                <div
                  key={pq.question.id}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <h3 className="font-bold text-slate-800 mb-2">
                    {pq.question.title}
                    <span className="text-slate-400 font-normal text-sm ms-2">
                      ({pq.question.lesson})
                    </span>
                  </h3>
                  <div className="text-sm text-slate-600 mb-3">
                    مجموع علامات هذا السؤال: <strong>{pq.totalMax}</strong> —
                    حصلت على:{" "}
                    <strong className="text-emerald-700">
                      {pq.totalEarned}
                    </strong>
                  </div>
                  <div className="space-y-3">
                    {pq.perBranch.map((pb, idx) => {
                      const ok = pb.grade.correct;
                      const part = pb.grade.partial;
                      return (
                        <div
                          key={pb.branch.id}
                          className={`rounded-lg p-3 border-r-4 ${
                            ok
                              ? "border-emerald-500 bg-emerald-50"
                              : part
                                ? "border-amber-500 bg-amber-50"
                                : "border-red-400 bg-red-50"
                          }`}
                        >
                          <div className="font-semibold text-slate-800 mb-1">
                            الفرع {idx + 1}: {renderPromptText(pb.branch)}
                          </div>
                          <div className="text-sm space-y-1 text-slate-700 break-words">
                            <div>
                              إجابتك:{" "}
                              <span
                                className={
                                  ok
                                    ? "text-emerald-700 font-semibold"
                                    : part
                                      ? "text-amber-700 font-semibold"
                                      : "text-red-700 font-semibold"
                                }
                              >
                                {pb.grade.studentAnswerDisplay}
                              </span>
                            </div>
                            <div>
                              الإجابة الصحيحة:{" "}
                              <span className="text-emerald-800 font-semibold">
                                {pb.grade.correctAnswerDisplay}
                              </span>
                            </div>
                            <div>
                              العلامة: {pb.grade.earnedPoints} /{" "}
                              {pb.grade.maxPoints}
                            </div>
                            <div className="text-slate-600 bg-white/70 rounded p-2 mt-2">
                              <strong>شرح:</strong> {pb.branch.explanation}
                            </div>
                            <div className="text-xs text-slate-500">
                              المرجع: {pb.branch.source.lesson} — ص{" "}
                              {pb.branch.source.page}
                            </div>
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

  // ---------- واجهة الاختبار ----------
  const currentQ = QUESTIONS[currentQIdx];
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 pb-28">
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-600 text-white grid place-items-center font-bold text-sm">
              ع
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-800 truncate">
                اختبار العربية - الصف الخامس
              </div>
              <div className="text-xs text-slate-500 truncate">
                الطالب: {name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-center">
              <div className="text-xs text-slate-500">الوقت</div>
              <div className="font-mono font-bold text-base sm:text-lg text-slate-800 tabular-nums">
                {formatHMS(elapsed)}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-xs text-slate-500">التقدّم</div>
              <div className="font-bold text-sm sm:text-base text-slate-800 tabular-nums">
                {answeredCount}/{branchCount}
              </div>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-slate-200">
          <div
            className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${(answeredCount / branchCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
        <div className="bg-white rounded-2xl shadow p-4 sm:p-7 border border-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              {currentQ.title}
            </h2>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded sm:whitespace-nowrap">
              {currentQ.lesson}
            </span>
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
            type="button"
            onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
            disabled={currentQIdx === 0}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            السؤال السابق
          </button>
          <div className="text-sm text-slate-500 tabular-nums">
            {currentQIdx + 1} / {QUESTIONS.length}
          </div>
          {currentQIdx < QUESTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() =>
                setCurrentQIdx((i) => Math.min(QUESTIONS.length - 1, i + 1))
              }
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              السؤال التالي
            </button>
          ) : (
            <button
              type="button"
              onClick={submitExam}
              disabled={!mandatoryComplete}
              className="px-6 py-2 rounded-lg bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title={mandatoryComplete ? "" : "أجب عن جميع الفروع أولاً"}
            >
              تسليم الاختبار
            </button>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            التنقل السريع:
          </div>
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((q, idx) => {
              const qAnswered = q.branches.every((b) =>
                isBranchAnswered(b, answers[b.id]),
              );
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQIdx(idx)}
                  className={`h-9 w-9 rounded-lg font-bold text-sm border transition ${
                    idx === currentQIdx
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : qAnswered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
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
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-slate-600">
            تمت الإجابة عن <strong>{answeredCount}</strong> من أصل{" "}
            <strong>{branchCount}</strong> فرعاً.
          </div>
          <button
            type="button"
            onClick={submitExam}
            disabled={!mandatoryComplete}
            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold text-sm sm:text-base shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            تسليم الاختبار
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// شريط حالة إرسال النتيجة إلى Google Sheets
// ============================================================
function SendStatusBanner({
  status,
  onResend,
}: {
  status: SendStatus;
  onResend: () => void;
}) {
  if (status === "idle") return null;

  const styles: Record<
    Exclude<SendStatus, "idle">,
    { box: string; text: string }
  > = {
    sending: {
      box: "bg-amber-50 border-amber-200 text-amber-900",
      text: "جارٍ إرسال نتيجتك إلى معلّمك…",
    },
    success: {
      box: "bg-emerald-50 border-emerald-200 text-emerald-900",
      text: "تم إرسال نتيجتك إلى معلّمك ✓",
    },
    failed: {
      box: "bg-rose-50 border-rose-200 text-rose-900",
      text: "تعذّر إرسال النتيجة تلقائياً. حُفظت النتيجة محلياً لإعادة المحاولة، ويمكنك تنزيل التقرير أو الضغط على «إعادة إرسال النتيجة».",
    },
  };

  const s = styles[status];
  return (
    <div
      role="status"
      aria-live="polite"
      data-send-status={status}
      className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-sm font-semibold ${s.box}`}
    >
      <p className="flex-1 min-w-[12rem]">{s.text}</p>
      {status === "failed" && (
        <button
          type="button"
          onClick={onResend}
          className="shrink-0 rounded-lg bg-rose-700 px-4 py-2 text-white font-bold hover:bg-rose-800 transition"
        >
          إعادة إرسال النتيجة
        </button>
      )}
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
    <div className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/50">
      <div className="flex items-start gap-2 mb-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
          {label}
        </span>
        <div className="font-semibold text-slate-800 leading-relaxed min-w-0">
          {renderPromptText(branch)}
          <span className="text-slate-400 text-sm ms-2">
            ({branch.points} علامة)
          </span>
        </div>
      </div>

      {branch.type === "single_choice" && (
        <div className="grid gap-2 ps-0 sm:ps-8">
          {branch.choices!.map((c) => (
            <label
              key={c.id}
              className={`choice-card flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                value === c.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <input
                type="radio"
                name={branch.id}
                checked={value === c.id}
                onChange={() => onChange(c.id)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span>{c.text}</span>
            </label>
          ))}
        </div>
      )}

      {branch.type === "true_false" && (
        <div className="grid gap-2 ps-0 sm:ps-8 sm:grid-cols-2">
          {branch.choices!.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                value === c.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <input
                type="radio"
                name={branch.id}
                checked={value === c.id}
                onChange={() => onChange(c.id)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span className="font-semibold">{c.text}</span>
            </label>
          ))}
        </div>
      )}

      {branch.type === "multi_choice" && (
        <div className="grid gap-2 ps-0 sm:ps-8">
          {branch.choices!.map((c) => {
            const arr = (value as string[]) || [];
            const checked = arr.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  checked
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-emerald-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, c.id]);
                    else onChange(arr.filter((x) => x !== c.id));
                  }}
                  className="h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span>{c.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {branch.type === "fill_blank" && (
        <div className="ps-0 sm:ps-8">
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      {branch.type === "classify" && (
        <div className="space-y-2 ps-0 sm:ps-8">
          {branch.items!.map((it) => {
            const rec = (value as Record<string, string>) || {};
            return (
              <div
                key={it.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 bg-white rounded-lg border border-slate-200"
              >
                <span className="font-semibold text-slate-700 min-w-0">
                  {it.text}
                </span>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {branch.categories!.map((cat) => (
                    <label
                      key={cat.id}
                      className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
                        rec[it.id] === cat.id
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white border-slate-300 hover:bg-slate-50"
                      }`}
                    >
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

      {branch.type === "match" && (
        <div className="space-y-2 ps-0 sm:ps-8">
          {(() => {
            const pairs = branch.pairs!;
            const rightItems = pairs.map((p) => p.right);
            const rec = (value as Record<string, string>) || {};
            return pairs.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-white rounded-lg border border-slate-200"
              >
                <span className="font-semibold text-slate-700 sm:w-1/3">
                  {p.left}
                </span>
                <span className="text-slate-400 hidden sm:inline">←</span>
                <select
                  value={rec[p.id] || ""}
                  onChange={(e) => onChange({ ...rec, [p.id]: e.target.value })}
                  className="w-full flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">-- اختر المعنى المناسب --</option>
                  {rightItems.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
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
        <p>
          <strong>العلامة الكلية:</strong> {totalPoints()}
        </p>
        <p>
          <strong>عدد الأسئلة:</strong> {QUESTIONS.length} سؤالاً رئيسياً
        </p>
        <p>
          <strong>عدد الفروع:</strong> {totalBranches()} فرعاً
        </p>
      </div>
      {QUESTIONS.map((q) => {
        const qTotal = q.branches.reduce((s, b) => s + b.points, 0);
        return (
          <div key={q.id} className="bg-slate-800 rounded-xl p-5">
            <h3 className="text-xl font-bold text-emerald-300 mb-2">
              {q.title}{" "}
              <span className="text-slate-400 text-sm">
                ({q.lesson}) — {qTotal} علامة
              </span>
            </h3>
            <div className="space-y-3 mt-4">
              {q.branches.map((b, i) => (
                <div
                  key={b.id}
                  className="border-r-2 border-emerald-500 pr-3 py-2"
                >
                  <div className="font-semibold">
                    {i + 1}- {b.prompt}{" "}
                    <span className="text-amber-300">({b.points} علامة)</span>
                  </div>
                  <div className="text-slate-200 mt-1">
                    الإجابة:{" "}
                    <span className="text-emerald-300">
                      {correctDisplay(b)}
                    </span>
                  </div>
                  <div className="text-slate-300 text-sm mt-1">
                    الشرح: {b.explanation}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">
                    المرجع: {b.source.lesson} — صفحة {b.source.page}
                  </div>
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
function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    sky: "bg-sky-50 border-sky-200 text-sky-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color] || colors.slate}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-xl sm:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

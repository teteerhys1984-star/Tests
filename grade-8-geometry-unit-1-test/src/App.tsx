import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, TOTAL_MARKS, verifyBlueprint } from "./exam/questions";
import { countAnswered, isQuestionAnswered, studentAnswerText } from "./exam/grading";
import type { Answers } from "./exam/types";
import { PartControl, MarkChip } from "./components/PartControl";
import { FigureFrame, Footer, Glyph, MuteButton } from "./components/Chrome";
import { TranslationBanner } from "./components/figures";
import { Results } from "./components/Results";
import { TeacherKey } from "./components/TeacherKey";
import { Rich } from "./lib/mathx";
import { playStart, playSubmit, playTick, setMuted } from "./lib/audio";
import {
  clearSession,
  formatDuration,
  loadSession,
  saveSession,
  useStopwatch,
  type SessionState,
} from "./lib/session";

import { hasAnswer } from "./lib/answerStatus";
import { buildPayload, newAttemptId, pendingKey, retryPending, sendWithRetry, type SendStatus } from "./lib/submit";

type Route = "exam" | "teacher";

function readRoute(): Route {
  return typeof window !== "undefined" && window.location.hash.startsWith("#/teacher")
    ? "teacher"
    : "exam";
}

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [session, setSession] = useState<SessionState>(() => loadSession());
  const [hydrated, setHydrated] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [review, setReview] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const topRef = useRef<HTMLDivElement | null>(null);
  const currentAttempt = useRef(session.attemptId);
  currentAttempt.current = session.attemptId;

  /* hash routing for the hidden teacher area */
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const id = session.attemptId;
    let pending: string | null = null;
    try { pending = id ? localStorage.getItem(pendingKey(id)) : null; } catch { /* unavailable */ }
    if (pending) setSendStatus("sending");
    else if (id) { try { if (localStorage.getItem(`sent:grade-8-geometry-unit-1-test:${id}`)) setSendStatus("success"); } catch { /* unavailable */ } }
    retryPending().then(() => {
      if (pending && currentAttempt.current === id) { try { const remains = localStorage.getItem(pendingKey(id)); if (!remains) localStorage.setItem(`sent:grade-8-geometry-unit-1-test:${id}`, "1"); setSendStatus(remains ? "failed" : "success"); } catch { setSendStatus("failed"); } }
    });
  }, []);

  /* persistence */
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      setMuted(session.muted);
      return;
    }
    saveSession(session);
  }, [session, hydrated]);

  const blueprintIssues = useMemo(() => verifyBlueprint(), []);
  useEffect(() => {
    if (blueprintIssues.length) console.warn("Exam blueprint:", blueprintIssues);
  }, [blueprintIssues]);

  const elapsed = useStopwatch(
    session.status === "running" || session.status === "submitted" ? session.startedAt : null,
    session.status === "submitted" ? session.submittedAt : null,
  );

  const progress = useMemo(() => countAnswered(QUESTIONS, session.answers), [session.answers]);

  const setAnswer = useCallback((partId: string, value: unknown) => {
    setSession((s) => ({ ...s, answers: { ...s.answers, [partId]: value } as Answers }));
  }, []);

  const goQuestion = useCallback((i: number) => {
    playTick();
    setReview(false);
    setSession((s) => ({ ...s, current: Math.max(0, Math.min(QUESTIONS.length - 1, i)) }));
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, []);

  const start = () => {
    const trimmed = nameDraft.trim().replace(/\s+/g, " ");
    if (trimmed.length < 3) {
      setNameError("الرجاء كتابة الاسم الثلاثي كاملاً (٣ أحرف على الأقلّ).");
      return;
    }
    playStart();
    const seeded: Answers = {};
    setSession({
      version: 1,
      attemptId: newAttemptId(),
      name: trimmed,
      answers: seeded,
      startedAt: Date.now(),
      submittedAt: null,
      status: "running",
      current: 0,
      muted: session.muted,
    });
    window.scrollTo({ top: 0 });
  };

  const transmit = (payload: ReturnType<typeof buildPayload>) => {
    setSendStatus("sending");
    void sendWithRetry(payload).then(ok => {
      if (ok) { try { localStorage.setItem(`sent:grade-8-geometry-unit-1-test:${payload.attemptId}`, "1"); } catch { /* unavailable */ } }
      if (currentAttempt.current === payload.attemptId) setSendStatus(ok ? "success" : "failed");
    });
  };

  const submit = () => {
    playSubmit();
    const submittedAt = Date.now();
    const payload = buildPayload(session.attemptId, session.name, session.answers, session.startedAt!, submittedAt);
    setSession((s) => ({ ...s, status: "submitted", submittedAt }));
    setReview(false);
    transmit(payload);
    window.scrollTo({ top: 0 });
  };

  const retry = () => {
    if (!session.startedAt || !session.submittedAt) return;
    transmit(buildPayload(session.attemptId, session.name, session.answers, session.startedAt, session.submittedAt));
  };

  const restart = () => {
    currentAttempt.current = "";
    clearSession();
    setSendStatus("idle");
    setNameDraft("");
    setNameError("");
    setSession({
      version: 1,
      attemptId: "",
      name: "",
      answers: {},
      startedAt: null,
      submittedAt: null,
      status: "idle",
      current: 0,
      muted: session.muted,
    });
    window.scrollTo({ top: 0 });
  };

  const toggleMute = () => {
    setSession((s) => {
      setMuted(!s.muted);
      return { ...s, muted: !s.muted };
    });
  };

  if (route === "teacher") {
    return (
      <>
        <div className="app-bg" aria-hidden />
        <div className="app-grid" aria-hidden />
        <TeacherKey
          session={session}
          onExit={() => {
            window.location.hash = "";
            setRoute("exam");
          }}
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="app-bg" aria-hidden />
      <div className="app-grid" aria-hidden />

      {session.status === "running" && (
        <ExamHeader
          name={session.name}
          elapsed={elapsed}
          done={progress.done}
          total={progress.total}
          current={session.current}
          answers={session.answers}
          onJump={goQuestion}
          muted={session.muted}
          onToggleMute={toggleMute}
        />
      )}

      <main className="min-h-screen">
        {session.status === "idle" && (
          <StartScreen
            nameDraft={nameDraft}
            setNameDraft={setNameDraft}
            error={nameError}
            onStart={start}
            muted={session.muted}
            onToggleMute={toggleMute}
          />
        )}

        {session.status === "running" && (
          <div ref={topRef} className="scroll-mt-40 px-3 pb-14 pt-4 sm:px-5">
            {review ? <section className="mx-auto max-w-5xl rounded-2xl border border-sky-400/20 bg-ink-900 p-5">
              <h2 className="text-xl font-bold">مراجعة الإجابات قبل التسليم</h2>
              {QUESTIONS.map((q, qi) => <div key={q.id} className="mt-4 rounded-xl border border-sky-400/20 p-4">
                <button type="button" className="font-bold text-cyan-200" onClick={() => { setReview(false); goQuestion(qi); }}>{q.index}. {q.title} — تعديل</button>
                {q.parts.map((p, i) => <p key={p.id} className="mt-2 text-slate-200">{q.index}.{i+1} — <Rich text={hasAnswer(session.answers[p.id]) ? studentAnswerText(p, session.answers) : "لم يُجب"} /></p>)}
              </div>)}
              <button type="button" className="mt-4 rounded-xl bg-cyan-300 px-4 py-3 font-bold text-ink-950" onClick={submit}>تأكيد التسليم</button>
              <button type="button" className="mx-3 mt-4 rounded-xl border px-4 py-3" onClick={() => setReview(false)}>العودة للأسئلة</button>
            </section> : <><QuestionView
              index={session.current}
              answers={session.answers}
              onAnswer={setAnswer}
            />
            <NavBar
              current={session.current}
              onPrev={() => goQuestion(session.current - 1)}
              onNext={() => goQuestion(session.current + 1)}
              onSubmit={() => setReview(true)}
              canSubmit={true}
              remaining={progress.total - progress.done}
            /></>}
          </div>
        )}

        {session.status === "submitted" && (
          <><div className="mx-auto max-w-5xl px-4 pt-4" role="status">
            {sendStatus === "sending" ? "جارٍ إرسال النتيجة…" : sendStatus === "success" ? "تم إرسال النتيجة." : sendStatus === "failed" ? "تعذّر إرسال النتيجة؛ ستُعاد المحاولة لاحقاً." : "لا توجد نتيجة إرسال مؤكدة."}
            <a href="#/teacher" className="mx-3 underline text-violet-200">منطقة المعلّم</a>
            {sendStatus !== "sending" && sendStatus !== "success" && <button type="button" onClick={retry} className="mx-3 rounded-xl border border-cyan-300 px-3 py-2">إعادة إرسال النتيجة</button>}
          </div><Results
            name={session.name}
            answers={session.answers}
            startedAt={session.startedAt}
            submittedAt={session.submittedAt}
            onRestart={restart}
          /></>
        )}
      </main>

      <Footer />
    </>
  );
}

/* ═══════════════════════════ header ═══════════════════════════ */

function ExamHeader({
  name,
  elapsed,
  done,
  total,
  current,
  answers,
  onJump,
  muted,
  onToggleMute,
}: {
  name: string;
  elapsed: number;
  done: number;
  total: number;
  current: number;
  answers: Answers;
  onJump: (i: number) => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const pct = total ? (done / total) * 100 : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-sky-400/15 bg-ink-950/88 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-3 pt-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Glyph size={30} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[0.95rem] font-bold leading-tight text-white sm:text-[1.05rem]">
              اختبار الهندسة – الصف الثامن
            </h1>
            <p className="truncate text-[0.72rem] text-slate-400">
              {name} · الوحدة الأولى: متوازيات الأضلاع والانسحاب
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-2.5 py-2 sm:px-3">
              <svg viewBox="0 0 24 24" className="size-4 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              <span
                dir="ltr"
                className="text-[0.9rem] font-bold tabular-nums text-cyan-100 sm:text-[1rem]"
                aria-label={`الزمن المنقضي ${formatDuration(elapsed)}`}
              >
                {formatDuration(elapsed)}
              </span>
            </div>
            <MuteButton muted={muted} onToggle={onToggleMute} />
          </div>
        </div>

        {/* progress */}
        <div className="mt-2 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-l from-cyan-300 via-sky-400 to-indigo-400 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.72rem] font-semibold tabular-nums text-slate-400" dir="ltr">
            {done}/{total}
          </span>
        </div>

        {/* question rail */}
        <nav aria-label="التنقّل بين الأسئلة" className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto pb-2">
          {QUESTIONS.map((q, i) => {
            const complete = isQuestionAnswered(q, answers);
            const active = i === current;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJump(i)}
                aria-current={active ? "step" : undefined}
                className={`relative flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] font-bold transition-all ${
                  active
                    ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                    : complete
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-sky-400/20 bg-white/[0.025] text-slate-400 hover:border-sky-300/45"
                }`}
              >
                <span>س{q.index}</span>
                {complete && !active && (
                  <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4L16 6" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/* ═══════════════════════════ question ═══════════════════════════ */

function QuestionView({
  index,
  answers,
  onAnswer,
}: {
  index: number;
  answers: Answers;
  onAnswer: (id: string, v: unknown) => void;
}) {
  const q = QUESTIONS[index];
  return (
    <article className="rise mx-auto max-w-5xl" key={q.id}>
      <div className="overflow-hidden rounded-2xl border border-sky-400/18 bg-gradient-to-b from-ink-850/85 to-ink-900/85 shadow-[0_30px_70px_-50px_rgba(56,189,248,0.9)]">
        <div className="relative border-b border-sky-400/14 bg-gradient-to-l from-sky-500/[0.12] via-indigo-500/[0.07] to-transparent p-4 sm:p-5">
          <div className="sheen pointer-events-none absolute inset-x-0 top-0 h-px" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/20 text-[1.05rem] font-bold text-cyan-100 ring-1 ring-cyan-300/30">
              {q.index}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[1.05rem] font-bold leading-snug text-white sm:text-[1.2rem]">
                {q.title}
              </h2>
              <p className="mt-0.5 text-[0.76rem] text-slate-400">{q.topic}</p>
            </div>
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[0.78rem] font-bold text-amber-200">
              {q.marks} علامة
            </span>
          </div>
          <p className="mt-2 text-[0.74rem] text-slate-500">
            المرجع: {q.reference}
          </p>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {q.intro && (
            <p className="rounded-xl border border-sky-400/16 bg-white/[0.025] p-3.5 text-[0.88rem] leading-relaxed text-slate-300">
              <Rich text={q.intro} />
            </p>
          )}

          {q.figure && (
            <FigureFrame caption={q.figure.caption} schematic={q.figure.schematic}>
              {q.figure.node}
            </FigureFrame>
          )}

          {q.parts.map((p, i) => (
            <section
              key={p.id}
              data-part={p.id}
              className="rounded-2xl border border-sky-400/14 bg-white/[0.018] p-3.5 sm:p-4"
            >
              <header className="mb-3 flex flex-wrap items-start gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink-700 text-[0.78rem] font-bold text-sky-200">
                  {q.index}.{i + 1}
                </span>
                <MarkChip marks={p.marks} />
                <p className="w-full text-[0.95rem] leading-relaxed text-slate-100 sm:flex-1 sm:basis-2/3">
                  <Rich text={p.prompt} />
                </p>
              </header>

              {p.figure && (
                <div className="mb-3.5">
                  <FigureFrame caption={p.figure.caption} schematic={p.figure.schematic}>
                    {p.figure.node}
                  </FigureFrame>
                </div>
              )}

              <PartControl
                part={p}
                value={answers[p.id]}
                onChange={(v) => onAnswer(p.id, v)}
                locked={false}
              />
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════ nav ═══════════════════════════ */

function NavBar({
  current,
  onPrev,
  onNext,
  onSubmit,
  canSubmit,
  remaining,
}: {
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  remaining: number;
}) {
  const last = current === QUESTIONS.length - 1;
  return (
    <div className="mx-auto mt-4 max-w-5xl">
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-sky-400/18 bg-ink-900/80 p-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={current === 0}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-sky-400/25 bg-white/[0.03] px-4 font-semibold text-slate-200 transition-colors hover:bg-sky-400/10 disabled:opacity-35"
        >
          <svg viewBox="0 0 20 20" className="size-4">
            <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          السابق
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={last}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-sky-400/25 bg-white/[0.03] px-4 font-semibold text-slate-200 transition-colors hover:bg-sky-400/10 disabled:opacity-35"
        >
          التالي
          <svg viewBox="0 0 20 20" className="size-4">
            <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1" />

        <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-bold transition-all ${
              canSubmit
                ? "pulse-ring bg-gradient-to-l from-emerald-300 to-cyan-400 text-ink-950 shadow-[0_12px_34px_-14px_rgba(52,211,153,0.95)] hover:scale-[1.02] active:scale-[0.99]"
                : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500"
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            تسليم الاختبار
          </button>
          <p className="text-center text-[0.74rem] text-slate-500 sm:text-end">
            {canSubmit
              ? `يمكنك مراجعة الإجابات قبل التسليم؛ بقي ${remaining} فرعاً غير مكتمل.`
              : `يتبقّى ${remaining} فرعاً لإتمام التسليم.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ start ═══════════════════════════ */

function StartScreen({
  nameDraft,
  setNameDraft,
  error,
  onStart,
  muted,
  onToggleMute,
}: {
  nameDraft: string;
  setNameDraft: (v: string) => void;
  error: string;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-3 pb-10 pt-6 sm:px-5 sm:pt-10">
      <div className="rise overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-bl from-ink-800/85 via-ink-850/85 to-ink-900/90 shadow-[0_40px_90px_-60px_rgba(56,189,248,0.95)]">
        <div className="relative border-b border-sky-400/14 p-5 sm:p-8">
          <div className="sheen pointer-events-none absolute inset-x-0 top-0 h-px" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Glyph size={44} />
              <div>
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-[2rem]">
                  Grade 8 Geometry Unit 1 Test
                </h1>
                <p className="mt-1.5 text-[0.9rem] text-cyan-200/90">
                  الوحدة الأولى: متوازيات الأضلاع والانسحاب · الكتاب ص ٥ – ١٩
                </p>
              </div>
            </div>
            <MuteButton muted={muted} onToggle={onToggleMute} />
          </div>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            {[
              { k: "الأسئلة", v: "٧ أسئلة رئيسية", d: "متنوّعة الصيغ" },
              { k: "العلامة", v: `${TOTAL_MARKS} علامة`, d: "6 × 15 + 1 × 10" },
              { k: "الزمن", v: "مفتوح", d: "عدّاد تصاعدي" },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-xl border border-sky-400/18 bg-white/[0.028] p-3.5"
              >
                <p className="text-[0.72rem] font-semibold text-slate-400">{x.k}</p>
                <p className="mt-0.5 text-[1.05rem] font-bold text-white">{x.v}</p>
                <p className="text-[0.72rem] text-slate-500">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 w-full max-w-[34rem]">
            <div className="overflow-hidden rounded-2xl border border-sky-400/18 bg-ink-950/40 p-1.5">
              <TranslationBanner />
            </div>
            <p className="mt-2 text-center text-[0.76rem] text-slate-500">
              الانسحاب: كلّ نقطة تنتقل بالمقدار نفسه وفي الاتجاه نفسه — فيبقى الشكل كما هو.
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h2 className="text-[1.02rem] font-bold text-white">تعليمات قبل البدء</h2>
            <ul className="mt-3 space-y-2.5 text-[0.87rem] leading-relaxed text-slate-300">
              {[
                "يبدأ العدّاد التصاعدي بمجرّد الضغط على زرّ البدء، ويستمرّ أثناء تنقّلك بين الأسئلة.",
                "تُحفظ إجاباتك تلقائياً في هذا المتصفّح؛ إذا أُغلقت الصفحة سهواً يمكنك المتابعة من حيث توقّفت.",
                "التنقّل بين الأسئلة حرّ، ولا تظهر أيّ إجابة صحيحة ولا أيّ تلميح أثناء الاختبار.",
                "يمكن مراجعة الإجابات وتعديلها قبل تأكيد التسليم، حتى إن بقيت فروع غير مجابة.",
                "الأشكال الهندسية جزء من السؤال: اقرأ العلامات (التوازي، التعامد، تساوي الأطوال) قبل الإجابة.",
                "ما لم يُذكر صراحةً أنّ الشكل مرسوم بالمقياس، لا يجوز استخراج القياسات من الرسم.",
              ].map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-[0.42rem] size-1.5 shrink-0 rounded-full bg-gradient-to-l from-cyan-300 to-indigo-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-cyan-300/22 bg-gradient-to-b from-cyan-400/[0.07] to-transparent p-4 sm:p-5">
            <label htmlFor="studentName" className="block text-[0.9rem] font-bold text-cyan-100">
              الاسم الكامل للطالب
            </label>
            <input
              id="studentName"
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onStart();
              }}
              placeholder="اكتب اسمك الثلاثي هنا"
              autoComplete="name"
              className="mt-2.5 min-h-12 w-full rounded-xl border border-cyan-300/30 bg-ink-950/70 px-4 text-[1rem] font-semibold text-white placeholder:font-normal placeholder:text-slate-500 outline-none transition-colors focus:border-cyan-300"
            />
            {error && <p className="mt-2 text-[0.82rem] font-semibold text-rose-300">{error}</p>}
            <button
              type="button"
              onClick={onStart}
              className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-l from-cyan-300 via-sky-400 to-indigo-400 px-6 py-3.5 text-[1.05rem] font-bold text-ink-950 shadow-[0_16px_40px_-16px_rgba(34,211,238,0.95)] transition-transform hover:scale-[1.015] active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              ابدأ الاختبار
            </button>
            <p className="mt-3 text-center text-[0.74rem] leading-relaxed text-slate-500">
              تُرسل النتيجة إلى سجل المعلّم بعد التسليم، ويمكن تنزيل التقرير محلياً.
            </p>
            <a
              href="#/teacher"
              className="mt-3 flex items-center justify-center gap-1.5 text-[0.74rem] font-semibold text-slate-600 transition-colors hover:text-violet-300"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
              </svg>
              منطقة المعلّم
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
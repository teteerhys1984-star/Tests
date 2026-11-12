import { useCallback, useEffect, useRef, useState } from "react";
import { SHEETS_TOKEN } from "./config";
import { ALL_SUBS, EXAM_ID, EXAM_TITLE, EXAM_VERSION, LETTER, QUESTIONS } from "./data/exam";
import { gradeAll, isAnswered, describeStudent, type Ans } from "./lib/grade";
import { clearAttempt, loadAttempt, newId, saveAttempt, shuffle, type Attempt, type DeliveryState } from "./lib/store";
import { buildReport, downloadText, reportFilename, validateReport } from "./lib/report";
import { buildPayload, pendingPayload, retryPending, sendWithRetry, type SendStatus, type SubmissionPayload } from "./lib/submit";
import { fmtDuration, toAr } from "./lib/text";
import { playStart, playSubmit } from "./lib/audio";
import { Pixel } from "./components/Pixel";
import { Rich } from "./components/Rich";
import { Figure } from "./components/Figures";
import { SubView } from "./components/SubView";
import { Results } from "./components/Results";
import { TeacherGate } from "./components/TeacherKey";

const WA = "https://wa.me/963930210522";

function ContactBar() {
  return (
    <div className="mc-panel-dark px-3 py-2 text-center text-sm sm:text-base font-bold no-print">
      <a href={WA} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200 underline-offset-4 hover:underline">
        المهندس سومر شاهين: <bdi dir="ltr">0930215022</bdi>
      </a>
    </div>
  );
}

function Header({ name, right }: { name?: string; right?: React.ReactNode }) {
  return (
    <header className="mc-title-bar px-3 sm:px-5 py-3 flex items-center gap-3 flex-wrap">
      <Pixel name="creeper" size={46} />
      <div className="flex-1 min-w-[10rem]">
        <h1 className="text-white text-2xl sm:text-3xl font-extrabold mc-text-shadow leading-tight">{EXAM_TITLE}</h1>
        <div className="text-[#e8ffd9] text-sm font-bold mc-text-shadow">
          الصف الرابع الأساسي — الرياضيات{name ? ` — ${name}` : ""}
        </div>
      </div>
      {right}
    </header>
  );
}

function Welcome({ onStart, storageOk }: { onStart: (name: string) => void; storageOk: boolean }) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length > 0;
  const go = () => {
    setTouched(true);
    if (valid) onStart(name.trim().replace(/\s+/g, " ").slice(0, 40));
  };
  return (
    <div className="grid gap-5">
      <Header />
      <section className="mc-card p-5 sm:p-8 grid gap-5">
        <div className="flex justify-center gap-4 items-end">
          <Pixel name="grass" size={56} />
          <Pixel name="creeper" size={72} />
          <Pixel name="diamond" size={56} />
          <Pixel name="emerald" size={56} />
          <Pixel name="stone" size={56} />
        </div>
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold">مرحباً بك في اختبار «{EXAM_TITLE}»</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">اختبار الرياضيات للصف الرابع الأساسي — عالم من المكعبات والأرقام!</p>
        </div>
        <ul className="grid sm:grid-cols-3 gap-3 text-center font-bold">
          <li className="bg-white/80 border-2 border-slate-500 p-3">
            <div className="text-3xl font-extrabold text-[#2b6fd6]">{toAr(QUESTIONS.length)}</div>سؤالاً رئيسياً
          </li>
          <li className="bg-white/80 border-2 border-slate-500 p-3">
            <div className="text-3xl font-extrabold text-[#3c8527]">{toAr(100)}</div>علامة كاملة
          </li>
          <li className="bg-white/80 border-2 border-slate-500 p-3">
            <div className="text-3xl font-extrabold text-[#8a5a33]">{toAr(ALL_SUBS.length)}</div>فرعاً للإجابة
          </li>
        </ul>
        <div className="text-slate-800 leading-8 font-semibold bg-white/70 border-2 border-dashed border-slate-500 p-3">
          • أجب عن جميع الفروع؛ لا يمكن تسليم الاختبار قبل الإجابة عن كل فرع.
          <br />• يمكنك التنقل بين الأسئلة وتعديل إجاباتك قبل التسليم.
          <br />• يبدأ المؤقت عند ظهور السؤال الأول، وتُحفظ إجاباتك تلقائياً.
        </div>
        <div className="grid gap-2 max-w-md mx-auto w-full">
          <label htmlFor="stname" className="font-extrabold text-lg">
            اكتب اسمك (مطلوب):
          </label>
          <input
            id="stname"
            className="mc-input"
            style={{ width: "100%", direction: "rtl", fontSize: "1.25rem" }}
            value={name}
            maxLength={40}
            autoComplete="off"
            placeholder="اسم الطالب"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
          />
          {touched && !valid && <div className="text-red-700 font-bold text-sm">الرجاء كتابة اسمك أولاً.</div>}
          <button className="mc-btn mt-2 text-xl" onClick={go}>
            ابدأ الاختبار
          </button>
          <p className="text-center text-sm font-bold text-slate-700">سيتم إرسال نتيجتك إلى معلّمك عند التسليم.</p>
        </div>
        {!storageOk && (
          <div className="text-center text-sm font-bold text-amber-900 bg-amber-100 border-2 border-amber-600 p-2">
            تنبيه: تعذّر استخدام التخزين في هذا المتصفح، لذلك قد لا تُحفظ إجاباتك عند تحديث الصفحة.
          </div>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const initRef = useRef<ReturnType<typeof loadAttempt> | null>(null);
  if (!initRef.current) initRef.current = loadAttempt();
  const [attempt, setAttempt] = useState<Attempt | null>(initRef.current.attempt);
  const [storageOk, setStorageOk] = useState(initRef.current.storageOk);
  const ref = useRef<Attempt | null>(attempt);
  const [now, setNow] = useState(() => Date.now());
  const [showKey, setShowKey] = useState(false);
  // Delivery of the result to the teacher. A submitted attempt restored after a refresh shows
  // "sent" when the server had confirmed it; otherwise it is sent again (see the effect below).
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    const restored = initRef.current?.attempt;
    if (!restored || restored.phase !== "done") return "idle";
    return restored.delivery === "sent" ? "success" : "sending";
  });
  // Payload of the attempt on the results page (what "resend" sends), and the one being sent now.
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);

  const commit = useCallback((fn: (a: Attempt) => Attempt) => {
    const cur = ref.current;
    if (!cur) return;
    const next = fn(cur);
    ref.current = next;
    if (!saveAttempt(next)) setStorageOk(false);
    setAttempt(next);
  }, []);

  // Remembers the outcome in the saved attempt, so a refresh of the results page does not send again.
  const recordDelivery = (attemptId: string, delivery: DeliveryState) => {
    const cur = ref.current;
    if (!cur || cur.phase !== "done" || cur.attemptId !== attemptId || cur.delivery === delivery) return;
    commit((a) => ({ ...a, delivery }));
  };

  // Sends in the background; nothing in the interface waits for it.
  const sendResult = (payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    outbox.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      // Ignored if the student has started a new attempt in the meantime.
      if (outbox.current !== payload) return;
      recordDelivery(payload.attemptId, ok ? "sent" : "failed");
      setSendStatus(ok ? "success" : "failed");
    });
  };

  // Sends the result of the submitted attempt on screen: the payload kept from an earlier failed
  // or interrupted delivery if there is one, otherwise one rebuilt from the saved attempt.
  // Either way it carries the same attemptId.
  const deliverSubmittedAttempt = () => {
    try {
      const cur = ref.current;
      if (!cur || cur.phase !== "done") return;
      const stored = pendingPayload(cur.attemptId);
      sendResult(stored ? { ...stored, token: SHEETS_TOKEN } : buildPayload(cur));
    } catch {
      outbox.current = null;
      setSendStatus("failed");
    }
  };

  const resend = () => {
    if (outbox.current) sendResult(outbox.current);
    else deliverSubmittedAttempt();
  };

  useEffect(() => {
    // A submitted attempt restored after a refresh is sent again unless the server confirmed it.
    const restored = ref.current;
    if (restored && restored.phase === "done" && restored.delivery !== "sent") deliverSubmittedAttempt();
    // Results of earlier attempts that could not be delivered are sent again, quietly.
    void retryPending();
    // Runs once, on load.
  }, []);

  // Stopwatch tick (timestamp based) while an attempt is active.
  useEffect(() => {
    if (!attempt || attempt.phase !== "exam") return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 500);
    const vis = () => tick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [attempt?.phase, attempt?.attemptId]);

  // Save on page lifecycle events.
  useEffect(() => {
    const save = () => {
      if (ref.current) saveAttempt(ref.current);
    };
    const vis = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // Scroll to top on navigation.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [attempt?.current, attempt?.view, attempt?.phase]);

  const start = (name: string) => {
    const optionOrder: Record<string, string[]> = {};
    ALL_SUBS.forEach((s) => {
      if (!s.options) return;
      const keys = s.options.map((o) => o.k);
      if (s.noShuffle) {
        optionOrder[s.id] = keys;
        return;
      }
      let ord = shuffle(keys);
      if (s.kind === "order") {
        let tries = 0;
        while (ord.join("|") === (s.seq ?? []).join("|") && tries++ < 20) ord = shuffle(keys);
      }
      optionOrder[s.id] = ord;
    });
    const ids = QUESTIONS.map((q) => q.id);
    let order = shuffle(ids);
    let tries = 0;
    while (order.join() === ids.join() && tries++ < 20) order = shuffle(ids);
    const startedAt = Date.now();
    const a: Attempt = {
      examId: EXAM_ID,
      version: EXAM_VERSION,
      attemptId: newId(),
      name,
      phase: "exam",
      view: "q",
      order,
      optionOrder,
      answers: {},
      current: 0,
      visited: [0],
      startedAt,
    };
    ref.current = a;
    setStorageOk(saveAttempt(a));
    setNow(startedAt);
    setAttempt(a);
    outbox.current = null;
    setSendStatus("idle");
    playStart(); // once: first question appears
  };

  const setAnswer = (id: string, v: Ans) => commit((a) => (a.phase === "exam" ? { ...a, answers: { ...a.answers, [id]: v } } : a));

  const go = (i: number) =>
    commit((a) => {
      if (a.phase !== "exam") return a;
      const idx = Math.max(0, Math.min(a.order.length - 1, i));
      return { ...a, view: "q", current: idx, visited: a.visited.includes(idx) ? a.visited : [...a.visited, idx] };
    });

  const openReview = () => commit((a) => (a.phase === "exam" ? { ...a, view: "review" } : a));

  const unansweredCount = (a: Attempt) => ALL_SUBS.filter((s) => !isAnswered(s, a.answers[s.id])).length;

  // One-click submission — everything happens synchronously inside the click.
  const submit = () => {
    const cur = ref.current;
    if (!cur || cur.phase !== "exam") return;
    if (unansweredCount(cur) > 0) return;
    const submittedAt = Date.now(); // 2. timestamp (answers are frozen from here: phase becomes "done")
    const result = gradeAll(cur.answers); // 4. grade
    const done: Attempt = { ...cur, phase: "done", view: "q", submittedAt, durationMs: submittedAt - cur.startedAt, result }; // 1+3
    const text = buildReport(done, result); // 5
    validateReport(text, done, result); // 6
    done.reportText = text;
    done.reportName = reportFilename(done.name);
    done.delivery = "pending";
    ref.current = done;
    if (!saveAttempt(done)) setStorageOk(false);
    downloadText(text, done.reportName); // 7+8: Blob + object URL + immediate download
    playSubmit(); // 9
    setAttempt(done); // 10
    // 11: delivery to the teacher starts last and in the background. The results page and the TXT
    // download above never wait for it, and a fault here leaves both untouched.
    try {
      sendResult(buildPayload(done, result));
    } catch {
      outbox.current = null;
      setSendStatus("failed");
    }
  };

  const downloadAgain = () => {
    const a = ref.current;
    if (a?.reportText && a.reportName) downloadText(a.reportText, a.reportName);
  };

  const retry = () => {
    clearAttempt();
    ref.current = null;
    setAttempt(null);
    setStorageOk(loadAttempt().storageOk);
    outbox.current = null;
    setSendStatus("idle");
  };

  // ───────── render ─────────
  let content: React.ReactNode;

  if (!attempt) {
    content = <Welcome onStart={start} storageOk={storageOk} />;
  } else if (attempt.phase === "done") {
    content = (
      <div className="grid gap-5">
        <Header name={attempt.name} />
        <Results attempt={attempt} onDownload={downloadAgain} onRetry={retry} sendStatus={sendStatus} onResend={resend} />
      </div>
    );
  } else {
    const total = attempt.order.length;
    const elapsed = fmtDuration(now - attempt.startedAt);
    const timer = (
      <div className="mc-panel-dark px-3 py-1 text-center" aria-label="المؤقت">
        <div className="text-[0.7rem] text-emerald-300 font-bold">الزمن</div>
        <div className="text-2xl font-extrabold tabular-nums" dir="ltr">
          {elapsed}
        </div>
      </div>
    );
    const unanswered = unansweredCount(attempt);
    const answeredCount = ALL_SUBS.length - unanswered;

    if (attempt.view === "review") {
      content = (
        <div className="grid gap-5">
          <Header name={attempt.name} right={timer} />
          <section className="mc-card p-4 sm:p-6 grid gap-4">
            <h2 className="text-2xl font-extrabold">مراجعة الإجابات</h2>
            {unanswered > 0 ? (
              <div className="font-extrabold text-lg bg-amber-100 border-2 border-amber-600 p-3" role="status">
                عدد الفروع التي لم تُجب عنها بعد: {toAr(unanswered)}
              </div>
            ) : (
              <div className="font-extrabold text-lg bg-emerald-100 border-2 border-emerald-700 p-3" role="status">
                تمت الإجابة عن جميع الفروع. يمكنك تسليم الاختبار الآن.
              </div>
            )}
            <div className="grid gap-3">
              {attempt.order.map((qid, i) => {
                const q = QUESTIONS.find((x) => x.id === qid)!;
                return (
                  <div key={qid} className="bg-white border-2 border-slate-500 p-3 grid gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge">السؤال {toAr(i + 1)}</span>
                      <span className="flex-1" />
                      <button className="mc-btn blue small" onClick={() => go(i)}>
                        فتح / تعديل
                      </button>
                    </div>
                    <div className="grid gap-1 text-sm">
                      {q.subs.map((s, k) => {
                        const ok = isAnswered(s, attempt.answers[s.id]);
                        return (
                          <div key={s.id} className="flex gap-2">
                            <b className="flex-none">({LETTER[k]})</b>
                            <span className={ok ? "" : "text-slate-500"}>
                              {ok ? <Rich text={describeStudent(s, attempt.answers[s.id])} /> : "لم تتم الإجابة"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <button className="mc-btn brown" onClick={() => go(attempt.current)}>
                العودة إلى الأسئلة
              </button>
              <button className="mc-btn text-xl" disabled={unanswered > 0} onClick={submit}>
                تسليم الاختبار
              </button>
            </div>
          </section>
        </div>
      );
    } else {
      const q = QUESTIONS.find((x) => x.id === attempt.order[attempt.current])!;
      const qMarks = q.subs.reduce((a, s) => a + s.marks, 0);
      const pct = ((attempt.current + 1) / total) * 100;
      content = (
        <div className="grid gap-4">
          <Header name={attempt.name} right={timer} />
          <div className="grid gap-1">
            <div className="flex justify-between text-sm font-extrabold text-[#12301a] bg-white/70 px-2 py-1 border-2 border-slate-600">
              <span>
                السؤال {toAr(attempt.current + 1)} من {toAr(total)}
              </span>
              <span>
                تمت الإجابة عن {toAr(answeredCount)} من {toAr(ALL_SUBS.length)} فرعاً
              </span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={attempt.current + 1}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <section className="mc-card p-3 sm:p-5 grid gap-4" key={q.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-none px-3 py-1 font-extrabold text-white bg-[#3c8527] border-[3px] border-[#1d3d12] text-lg">
                السؤال {toAr(attempt.current + 1)}
              </span>
              <span className="badge">علامات السؤال: {toAr(qMarks)}</span>
            </div>
            {q.intro && (
              <div className="text-lg font-bold leading-8">
                <Rich text={q.intro} />
              </div>
            )}
            {q.fig && (
              <div className="overflow-x-auto">
                <Figure fig={q.fig} />
              </div>
            )}
            <div className="grid gap-4">
              {q.subs.map((s, i) => (
                <SubView
                  key={s.id}
                  sub={s}
                  letter={LETTER[i]}
                  answer={attempt.answers[s.id]}
                  order={attempt.optionOrder[s.id] ?? []}
                  onChange={(v) => setAnswer(s.id, v)}
                />
              ))}
            </div>
          </section>

          <div className="flex gap-3 justify-between flex-wrap">
            <button className="mc-btn brown" disabled={attempt.current === 0} onClick={() => go(attempt.current - 1)}>
              ← السابق
            </button>
            <button className="mc-btn blue small self-center" onClick={openReview}>
              مراجعة الإجابات
            </button>
            {attempt.current < total - 1 ? (
              <button className="mc-btn" onClick={() => go(attempt.current + 1)}>
                التالي →
              </button>
            ) : (
              <button className="mc-btn" onClick={openReview}>
                مراجعة وتسليم →
              </button>
            )}
          </div>

          <nav className="mc-card p-3" aria-label="التنقل بين الأسئلة">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {attempt.order.map((_, i) => (
                <button
                  key={i}
                  className={"jump" + (i === attempt.current ? " cur" : attempt.visited.includes(i) ? " visited" : "")}
                  onClick={() => go(i)}
                  aria-label={`السؤال ${i + 1}`}
                >
                  {toAr(i + 1)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="no-print">
        <ContactBar />
      </div>
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {attempt && !storageOk && (
          <div className="mb-3 text-center text-sm font-bold text-amber-900 bg-amber-100 border-2 border-amber-600 p-2" role="alert">
            تنبيه: تعذّر حفظ الإجابات في هذا المتصفح، لذلك قد تضيع عند تحديث الصفحة.
          </div>
        )}
        {content}
      </main>
      <footer className="no-print">
        <ContactBar />
        <div className="bg-[#2b2b2b] text-center py-2">
          <button className="text-xs text-slate-400 hover:text-slate-200 underline" onClick={() => setShowKey(true)}>
            مفتاح المعلم
          </button>
        </div>
        <div className="pixel-bg-bottom" />
      </footer>
      {showKey && <TeacherGate onClose={() => setShowKey(false)} />}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { AnswerMap, Attempt, Question } from "../data/types";
import { answeredCount, isComplete, stopwatch, totalSubCount } from "../lib/grade";
import { formatPointsBadge, Katex } from "../lib/math";
import { Figure, RichText, SoundIcon } from "./Bits";
import { SubBlock } from "./Inputs";

export function ExamScreen({
  questions,
  attempt,
  index,
  onIndex,
  onAnswer,
  onSubmit,
  muted,
  onToggleMute,
  now,
}: {
  questions: Question[];
  attempt: Attempt;
  index: number;
  onIndex: (i: number) => void;
  onAnswer: (subId: string, value: string) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
  now: number;
}) {
  const q = questions[index];
  const answers: AnswerMap = attempt.answers;
  const done = answeredCount(questions, answers);
  const total = totalSubCount(questions);
  const complete = isComplete(questions, answers);
  const topRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [hdrH, setHdrH] = useState(76);

  useEffect(() => {
    if (topRef.current) {
      const y = topRef.current.getBoundingClientRect().top + window.scrollY - hdrH - 4;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const upd = () => setHdrH(Math.round(el.getBoundingClientRect().height));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const pct = Math.round((done / Math.max(total, 1)) * 100);
  const timeStr = stopwatch(now, attempt.startedAt);

  return (
    <div className="min-h-full">
      {/* -------------------------------------------------------- الشريط */}
      <header ref={headerRef} className="sticky top-0 z-30 border-b-2 border-ink/20 bg-ink text-white shadow-md">
        <div className="dark-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-white/65">{attempt.name}</p>
            <div className="text-[20px] font-bold leading-tight text-cyan sm:text-[25px]" aria-label="الزمن المنقضي">
              <Katex tex={`\\mathrm{${timeStr}}`} className="text-cyan" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-xs">
              <Ring pct={pct} />
              <div className="text-[13px] font-bold leading-tight">
                <Katex tex={`${done}/${total}`} className="text-white" />
                <span className="block text-[10px] font-semibold text-white/65">مطلب مُنجز</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 transition-colors hover:border-cyan"
            >
              <SoundIcon muted={muted} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative h-1.5 w-full bg-white/15">
          <div
            className="h-full bg-gradient-to-l from-cyan via-blue to-purple transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <div ref={topRef} />

      {/* ------------------------------------------- شريط الأسئلة للجوال */}
      <nav
        className="sticky z-20 border-b-2 border-line bg-paper/95 backdrop-blur-sm lg:hidden"
        style={{ top: hdrH }}
        aria-label="تنقّل الأسئلة"
      >
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2" style={{ scrollbarWidth: "none" }}>
          {questions.map((item, i) => {
            const answered = hasAnsweredQuestion(item, answers);
            const active = i === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onIndex(i)}
                className={`h-9 w-9 shrink-0 rounded-lg border-2 text-[13px] font-bold transition-colors ${
                  active
                    ? "border-blue bg-blue text-white"
                    : answered
                      ? "border-green bg-green/15 text-green"
                      : "border-line bg-white text-ink-soft"
                }`}
                aria-current={active ? "true" : undefined}
                aria-label={`السؤال ${item.n}`}
              >
                <Katex tex={String(item.n)} className={active ? "text-white" : answered ? "text-green" : "text-ink-soft"} />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-6 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* ---------------------------------------- السُّلّم الجانبي */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-3xl border-2 border-line bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-black tracking-wide text-ink">خريطة المحطّات</p>
              <span className="rounded-md bg-blue/10 px-2 py-0.5 text-[11px] font-bold text-blue">
                <Katex tex={String(questions.length)} />
              </span>
            </div>
            <ol className="grid grid-cols-3 gap-1.5">
              {questions.map((item, i) => {
                const active = i === index;
                const answered = hasAnsweredQuestion(item, answers);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onIndex(i)}
                      className={`h-10 w-full rounded-xl border-2 text-[13px] font-bold transition-all ${
                        active
                          ? "border-blue bg-blue text-white shadow-[0_6px_14px_-6px_rgba(29,78,216,0.9)]"
                          : answered
                            ? "border-green/50 bg-green/10 text-green"
                            : "border-line bg-white text-ink-soft hover:border-blue/50"
                      }`}
                      aria-current={active ? "true" : undefined}
                    >
                      <Katex tex={String(item.n)} className={active ? "text-white" : answered ? "text-green" : "text-ink-soft"} />
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 space-y-1.5 border-t-2 border-line pt-3 text-[11px] font-semibold text-ink-soft">
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-blue" /> السؤال الحالي
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-green/70" /> مكتمل
              </p>
              <p className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs border-2 border-line bg-white" /> قيد الإنجاز
              </p>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------ السؤال */}
        <main className="min-w-0">
          <article
            key={q.id}
            className="settle relative overflow-hidden rounded-3xl border-2 border-line bg-white p-4 shadow-[0_22px_48px_-32px_rgba(11,27,58,0.5)] sm:p-7"
          >
            {/* Top accent bar */}
            <div
              className={`absolute inset-x-0 top-0 h-1.5 ${
                q.subject === "physics"
                  ? "bg-gradient-to-l from-cyan via-blue to-blue-deep"
                  : "bg-gradient-to-l from-yellow via-orange to-purple"
              }`}
            />

            <div className="flex items-start gap-3 pt-1 sm:gap-5">
              <span
                className={`numeral shrink-0 text-[52px] sm:text-[82px] ${
                  q.subject === "physics" ? "numeral-blue" : "numeral-orange"
                }`}
              >
                {String(q.n).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-ink px-3 py-1 text-[12px] font-bold text-white">
                    السؤال <Katex tex={String(q.n)} className="text-cyan" /> من <Katex tex={String(questions.length)} className="text-white" />
                  </span>
                  <span className="rounded-lg border border-yellow/70 bg-yellow/25 px-3 py-1 text-[12px] font-bold text-ink">
                    {formatPointsBadge(q.marks)}
                  </span>
                </div>

                {q.givens && q.givens.length > 0 ? (
                  <div className="mb-3.5 flex flex-wrap gap-2">
                    {q.givens.map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center rounded-xl border-2 border-blue/20 bg-paper px-3 py-1 text-[14px] font-semibold text-ink shadow-2xs"
                      >
                        <Katex tex={g} />
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-[16.5px] font-medium leading-9 text-ink sm:text-[18.5px] sm:leading-10">
                  <RichText text={q.stem} />
                </p>

                {q.figure ? (
                  <figure className="mt-5 overflow-hidden rounded-2xl border-2 border-line bg-[#F8FAFC] p-2 shadow-inner">
                    <Figure kind={q.figure} solved={false} />
                  </figure>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {q.subs.map((s, i) => (
                <SubBlock
                  key={s.id}
                  index={i + 1}
                  sub={s}
                  value={String(answers[s.id] ?? "")}
                  onChange={(v) => onAnswer(s.id, v)}
                />
              ))}
            </div>
          </article>

          {/* ------------------------------------------------- التنقّل */}
          <div className="sticky bottom-0 z-20 mt-5 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line bg-paper/95 px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-4">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onIndex(index - 1)}
              className="flex-1 rounded-xl border-2 border-line bg-white px-4 py-3.5 text-[15px] font-bold text-ink transition-colors hover:border-blue disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-7"
            >
              ◀ السؤال السابق
            </button>

            <button
              type="button"
              disabled={index === questions.length - 1}
              onClick={() => onIndex(index + 1)}
              className="flex-1 rounded-xl border-2 border-ink bg-ink px-4 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-deep disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-7"
            >
              السؤال التالي ▶
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!complete}
              className={`order-last w-full rounded-xl px-6 py-4 font-display text-[17px] font-black transition-all sm:ms-auto sm:order-none sm:w-auto ${
                complete
                  ? "border-2 border-green bg-green text-white shadow-[0_10px_22px_-12px_rgba(22,163,74,0.9)] active:translate-y-0.5"
                  : "cursor-not-allowed border-2 border-line bg-line/60 text-ink-soft/70"
              }`}
              aria-disabled={!complete}
            >
              تسليم الاختبار
            </button>
          </div>

          {!complete ? (
            <p className="mt-2 text-center text-[12.5px] font-semibold text-ink-soft sm:text-start">
              يُفعَّل زرّ «تسليم الاختبار» بعد الإجابة عن جميع المطالب — المتبقي:{" "}
              <Katex tex={String(total - done)} className="font-bold text-orange" /> مطلب.
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function hasAnswered(subId: string, answers: AnswerMap): boolean {
  const v = answers[subId];
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("{")) {
      try {
        const obj = JSON.parse(trimmed) as Record<string, unknown>;
        if ("strokes" in obj) return Number(obj.strokes ?? 0) > 0;
        if ("shared" in obj) {
          const lone = Array.isArray(obj.lone) ? (Number(obj.lone[0] ?? 0) + Number(obj.lone[1] ?? 0)) : 0;
          return Number(obj.shared ?? 0) > 0 || lone > 0;
        }
        const vals = Object.values(obj);
        return vals.length > 0 && vals.every((x) => String(x).trim().length > 0);
      } catch {
        return true;
      }
    }
    return true;
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    if ("strokes" in obj) return Number(obj.strokes ?? 0) > 0;
    if ("shared" in obj) return Number(obj.shared ?? 0) > 0;
    return Object.values(obj).some((x) => String(x).trim().length > 0);
  }
  if (Array.isArray(v)) return v.some((x) => String(x).trim().length > 0);
  return false;
}

function hasAnsweredQuestion(q: Question, answers: AnswerMap): boolean {
  return q.subs.every((s) => hasAnswered(s.id, answers));
}

function Ring({ pct }: { pct: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 18 18)"
        style={{ transition: "stroke-dasharray 500ms ease" }}
      />
    </svg>
  );
}

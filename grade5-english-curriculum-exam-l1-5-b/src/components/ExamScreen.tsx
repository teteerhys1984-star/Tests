import Contact from "@/components/Contact";
import MuteButton from "@/components/MuteButton";
import { EXAM_GRADE, EXAM_ID, EXAM_SEMESTER, EXAM_TITLE } from "@/config";
import { LESSONS, QUESTIONS, lessonMeta, type Part, type Question } from "@/data/questions";
import {
  answeredQuestionCount,
  isComplete,
  questionAnswered,
} from "@/lib/grading";
import { formatHMS } from "@/lib/storage";

interface Props {
  name: string;
  answers: Record<string, string>;
  current: number;
  elapsed: number;
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (partId: string, value: string) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}

function PartInput({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (v: string) => void;
}) {
  if (part.type === "text") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer"
        aria-label={part.prompt}
        className="cut-flat mt-2.5 w-full bg-white px-3.5 py-2.5 text-base font-semibold placeholder:font-normal placeholder:text-ink-soft/65 focus:bg-sun/25"
      />
    );
  }
  const options = part.options ?? [];
  return (
    <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label={part.prompt}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={`cut-flat px-4 py-2.5 text-left text-base font-semibold transition-all hover:-translate-y-0.5 ${
              active ? "bg-sun" : "bg-white"
            }`}
            style={active ? { boxShadow: "4px 4px 0 #FF7A1A" } : undefined}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function ExamScreen({
  name,
  answers,
  current,
  elapsed,
  muted,
  onToggleMute,
  onAnswer,
  onNavigate,
  onSubmit,
}: Props) {
  const q: Question = QUESTIONS[current];
  const meta = lessonMeta(q.lesson);
  const done = answeredQuestionCount(answers);
  const complete = isComplete(answers);
  const remaining = QUESTIONS.length - done;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-6">
      {/* header */}
      <header
        className="cut sticky top-2 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white px-3 py-2.5 sm:px-4"
        style={{ boxShadow: "5px 5px 0 #2E2438" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="tab-label hidden shrink-0 border-[3px] border-ink px-2.5 py-1.5 sm:inline-block"
            style={{ background: "#FF7A1A" }}
          >
            G{EXAM_GRADE} · S{EXAM_SEMESTER} · B
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold leading-tight sm:text-lg">
              {EXAM_TITLE}
            </div>
            <div className="truncate text-xs text-ink-soft">
              Grade {EXAM_GRADE} · English · Semester {EXAM_SEMESTER} · {name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="cut-flat px-3 py-1.5 text-center"
            style={{ background: "#2E2438" }}
            aria-label="Elapsed time"
          >
            <div className="tab-label text-[0.6rem] text-orange-light">Time</div>
            <div className="tnum font-display text-lg leading-none font-semibold text-paper sm:text-xl">
              {formatHMS(elapsed)}
            </div>
          </div>
          <MuteButton muted={muted} onToggle={onToggleMute} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[248px_1fr]">
        {/* lesson rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="scroll-x flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            {LESSONS.map((l) => {
              const qs = QUESTIONS.filter((x) => x.lesson === l.n);
              const firstIndex = QUESTIONS.findIndex((x) => x.lesson === l.n);
              const answered = qs.filter((x) => questionAnswered(x, answers)).length;
              const active = q.lesson === l.n;
              return (
                <button
                  key={l.n}
                  type="button"
                  onClick={() => onNavigate(firstIndex)}
                  className={`min-w-[210px] shrink-0 border-[3px] border-ink px-3 py-2.5 text-left transition-transform lg:min-w-0 ${
                    active ? "-translate-y-0.5" : "hover:-translate-y-0.5"
                  }`}
                  style={{
                    background: l.color,
                    color: l.textOn,
                    boxShadow: active ? `6px 6px 0 ${l.colorDark}` : "4px 4px 0 #2E2438",
                  }}
                  aria-current={active ? "true" : undefined}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-semibold leading-none">
                      L{l.n} · {l.title}
                    </span>
                    <span className="tnum tab-label opacity-90">
                      {answered}/{qs.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {qs.map((x) => {
                      const idx = QUESTIONS.indexOf(x);
                      const ok = questionAnswered(x, answers);
                      return (
                        <span
                          key={x.id}
                          className={`h-3.5 w-3.5 rounded-full border-2 border-ink ${ok ? "animate-pop" : ""}`}
                          style={{
                            background: ok ? "#FFF8EC" : "rgba(46,36,56,0.35)",
                            outline: idx === current ? "3px solid #2E2438" : undefined,
                            outlineOffset: idx === current ? "2px" : undefined,
                          }}
                          title={`Question ${idx + 1}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-1.5 tab-label text-[0.6rem] opacity-85">pages {l.pages}</div>
                </button>
              );
            })}
          </div>

          <div className="cut-sm mt-3 hidden bg-white px-3 py-2.5 text-sm lg:block">
            <div className="tab-label text-ink-soft">Progress</div>
            <div className="tnum font-display text-2xl font-semibold">
              {done} <span className="text-ink-soft">/ {QUESTIONS.length}</span>
            </div>
            <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${(done / QUESTIONS.length) * 100}%`, background: "#7BC400" }}
              />
            </div>
          </div>
        </aside>

        {/* question card */}
        <main>
          <article key={q.id} className="animate-card-in cut bg-white" style={{ boxShadow: "8px 8px 0 #2E2438" }}>
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-2.5 sm:px-5"
              style={{ background: meta.color, color: meta.textOn }}
            >
              <span className="tab-label">
                Lesson {q.lesson} · {meta.title}
              </span>
              <span className="tab-label opacity-90">
                Q {current + 1} / {QUESTIONS.length} · 2 marks
              </span>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="tab-label inline-block border-2 border-ink bg-paper-deep px-2 py-1 text-ink">
                {q.exercise} · {q.page.replace("Pupil's Book ", "")}
              </div>

              <h2 className="mt-3 text-[1.35rem] leading-tight sm:text-[1.55rem]">{q.instruction}</h2>

              {q.context && (
                <div
                  className="mt-3 border-[3px] border-dashed border-ink/45 bg-paper px-3.5 py-3 text-[0.95rem] leading-relaxed whitespace-pre-line"
                  aria-label="Printed material from the book"
                >
                  <span className="tab-label mr-2 text-ink-soft">From the book</span>
                  <br />
                  {q.context}
                </div>
              )}

              <div className="mt-5 space-y-5">
                {q.parts.map((p, i) => (
                  <div key={p.id}>
                    <p className="text-[1.05rem] leading-snug font-semibold">
                      {q.parts.length > 1 && (
                        <span
                          className="tnum mr-2 inline-grid h-6 w-6 place-items-center rounded-full border-2 border-ink font-display text-sm"
                          style={{ background: "#FFC400" }}
                        >
                          {String.fromCharCode(97 + i)}
                        </span>
                      )}
                      {p.prompt}
                      <span className="tnum ml-2 text-sm font-normal text-ink-soft">
                        [{p.marks} mark{p.marks === 1 ? "" : "s"}]
                      </span>
                    </p>
                    <PartInput part={p} value={answers[p.id] ?? ""} onChange={(v) => onAnswer(p.id, v)} />
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* navigation */}
          <nav className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => onNavigate(current - 1)}
              className="cut-sm bg-white px-4 py-3 font-display font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              ← Previous
            </button>

            <span className="tnum tab-label text-ink-soft">
              Question {current + 1} of {QUESTIONS.length}
            </span>

            <button
              type="button"
              disabled={current === QUESTIONS.length - 1}
              onClick={() => onNavigate(current + 1)}
              className="cut-sm bg-white px-4 py-3 font-display font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Next →
            </button>
          </nav>

          {/* submit */}
          <div
            className="cut mt-4 px-4 py-4 sm:px-5"
            style={{ background: complete ? "#7BC400" : "#F6EAD6", boxShadow: "7px 7px 0 #2E2438" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm leading-snug">
                <span className="tab-label text-ink-soft">Submit Exam</span>
                <br />
                {complete ? (
                  <strong>All {QUESTIONS.length} questions are answered. You can submit now.</strong>
                ) : (
                  <span>
                    <strong className="tnum">{remaining}</strong> question{remaining === 1 ? "" : "s"} still
                    need{remaining === 1 ? "s" : ""} an answer.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!complete}
                className="cut w-full px-6 py-3.5 font-display text-xl font-semibold transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:w-auto"
                style={{ background: complete ? "#FF7A1A" : "#E7DAC5", color: "#2E2438" }}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </main>
      </div>

      <div className="mt-8">
        <Contact compact />
        <p className="tab-label mt-3 text-center text-ink-soft">
          {EXAM_TITLE} · {EXAM_ID}
        </p>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import {
  MARKS_PER_QUESTION,
  QUESTIONS,
  TEACHER_PASSWORD,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
  type MainQuestion,
} from "@/data/exam";
import { LESSONS, lessonLabel } from "@/data/lessons";
import { acceptedDisplay, MARKS_PER_SUB, totalSubs } from "@/lib/grading";
import { setTeacherUnlocked, loadTeacherUnlocked } from "@/lib/storage";
import { Footer } from "./Footer";
import { Button, Card, Icon, RichText } from "./ui";

type Props = {
  questions: MainQuestion[];
  onBack: () => void;
};

/** Computed from the exam data so the rule text always matches. */
const TOTAL_PARTS = totalSubs(QUESTIONS);

const GRADING_RULES: Array<{ title: string; text: string }> = [
  {
    title: "Marks",
    text: `The exam has ${TOTAL_QUESTIONS} main questions. Each main question has five parts (a)–(e) worth ${MARKS_PER_SUB} mark each, so every question is worth ${MARKS_PER_QUESTION} marks and the whole exam is worth ${TOTAL_MARKS} marks.`,
  },
  {
    title: "Choice and matching parts",
    text: "Marked against the key. Only the listed answer earns the mark.",
  },
  {
    title: "Typed answers",
    text: "Capital letters, end punctuation and extra spaces are ignored. Every accepted form is listed under the part. Any other wording does not earn the mark.",
  },
  {
    title: "Word-order parts",
    text: "Correct only when every word chip is used and the order matches the key. Capital letters are ignored.",
  },
  {
    title: "No partial credit",
    text: "There are no half marks and no negative marks. A part earns 1 or 0.",
  },
  {
    title: "Completion rule",
    text: `The Submit Exam button stays disabled until all ${TOTAL_PARTS} parts are answered, and it submits immediately with no confirmation step. Every report therefore contains a student answer for every part.`,
  },
];

export function TeacherArea({ questions, onBack }: Props) {
  const [unlocked, setUnlocked] = useState<boolean>(() => loadTeacherUnlocked());
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setTeacherUnlocked(true);
      setUnlocked(true);
      setPassword("");
      setError(null);
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const lock = () => {
    setTeacherUnlocked(false);
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div className="flex min-w-0 flex-col">
        <main className="wrap flex-1 py-8 sm:py-12">
          <Card className="mx-auto max-w-md p-5 text-center sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sun-soft text-ink">
              <Icon name="lock" className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-ink sm:text-3xl">Teacher Area</h1>
            <p className="mt-2 text-sm leading-relaxed font-semibold text-muted sm:text-base">
              Enter the teacher password to see the complete answer key, marking criteria and
              lesson mapping.
            </p>
            <form onSubmit={unlock} noValidate className="mt-5 text-left">
              <label htmlFor="teacher-password" className="block text-sm font-extrabold text-ink">
                Password
              </label>
              <input
                id="teacher-password"
                type="password"
                className="input mt-2"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "password-error" : undefined}
                enterKeyHint="go"
                autoFocus
              />
              {error && (
                <p id="password-error" role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-bold text-coral-dark">
                  <Icon name="info" className="mt-0.5 h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" className="mt-4 w-full">
                <Icon name="unlock" />
                Unlock
              </Button>
            </form>
            <p className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-line bg-paper p-3 text-left text-xs leading-relaxed font-semibold text-muted">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              This is a client-side access restriction only. It does not provide real
              authentication or encryption.
            </p>
            <Button variant="ghost" className="mt-3" onClick={onBack}>
              <Icon name="arrowRight" className="rotate-180" />
              Back
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const parts = totalSubs(questions);
  const coverage = (Object.keys(LESSONS) as unknown as Array<keyof typeof LESSONS>).map((lesson) => ({
    lesson,
    questions: questions.filter((q) => q.lesson === lesson),
  }));

  return (
    <div className="flex min-w-0 flex-col">
      <main className="wrap flex-1 py-6 sm:py-10">
        <header className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-ink sm:text-3xl">Teacher Area</h1>
            <p className="mt-1 text-sm font-semibold text-muted sm:text-base">
              Complete answer key, marking criteria and lesson mapping for the exam.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={lock}>
              <Icon name="lock" className="h-4 w-4" />
              Lock
            </Button>
            <Button variant="secondary" size="sm" onClick={onBack}>
              <Icon name="arrowRight" className="rotate-180" />
              Back
            </Button>
          </div>
        </header>

        <Card className="mt-5 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-ink sm:text-xl">
            <Icon name="clipboard" className="h-5 w-5 text-ocean-dark" />
            Grading information
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {GRADING_RULES.map((rule) => (
              <div key={rule.title} className="rounded-2xl border-2 border-line bg-paper p-3">
                <dt className="text-sm font-extrabold text-ink">{rule.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed font-semibold text-muted">{rule.text}</dd>
              </div>
            ))}
          </dl>
          <p className="num mt-3 text-sm font-bold text-ink">
            {questions.length} questions · {parts} parts · {questions.length * MARKS_PER_QUESTION} marks in
            total
          </p>
        </Card>

        <Card className="mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black text-ink sm:text-xl">Lesson and skill map</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {coverage.map(({ lesson, questions: items }) => (
              <PillLink key={lesson} label={`${lessonLabel(lesson)} · Q${items.map((q) => q.id).join(", Q")}`} />
            ))}
          </div>
          <ol className="mt-4 space-y-2">
            {questions.map((q) => (
              <li
                key={q.id}
                className="grid gap-1 rounded-2xl border-2 border-line bg-paper p-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1.4fr)_4.5rem] sm:items-center sm:gap-3"
              >
                <span className="text-sm font-black text-ink">Q{q.id}</span>
                <span className="min-w-0 text-sm font-bold text-ocean-dark">{lessonLabel(q.lesson)}</span>
                <span className="min-w-0 text-sm font-semibold text-ink">{q.skill}</span>
                <span className="num text-sm font-extrabold text-muted sm:text-right">{MARKS_PER_QUESTION} marks</span>
              </li>
            ))}
          </ol>
        </Card>

        <section className="mt-5" aria-labelledby="answer-key-title">
          <h2 id="answer-key-title" className="text-2xl font-black text-ink">
            Answer key
          </h2>
          <div className="mt-3 space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="p-4 sm:p-6">
                <header className="flex flex-wrap items-center gap-3">
                  <span className="order-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-sun-dark bg-sun text-lg font-black text-ink">
                    {q.id}
                  </span>
                  <div className="order-3 min-w-0 basis-full sm:order-2 sm:basis-0 sm:flex-1">
                    <h3 className="text-lg leading-tight font-black text-ink">
                      Question {q.id}: {q.title}
                    </h3>
                    <p className="text-sm font-bold text-ocean-dark">{lessonLabel(q.lesson)}</p>
                    <p className="text-sm font-semibold text-muted">Skill: {q.skill}</p>
                  </div>
                  <span className="num order-2 ml-auto rounded-xl border-2 border-line bg-paper px-3 py-1 text-sm font-extrabold text-ink sm:order-3 sm:ml-0">
                    {MARKS_PER_QUESTION} marks
                  </span>
                </header>
                <p className="mt-3 text-sm font-semibold text-muted">
                  Instruction: {q.instruction}
                </p>
                <ol className="mt-3 space-y-2">
                  {q.subs.map((sub, subIndex) => {
                    const letter = String.fromCharCode(97 + subIndex);
                    const accepted = acceptedDisplay(sub);
                    return (
                      <li
                        key={sub.id}
                        className="rounded-2xl border-2 border-line bg-paper p-3"
                        id={`key-${sub.id}`}
                      >
                        <p className="text-base font-bold text-ink">
                          <span className="text-muted">({letter})</span> <RichText text={sub.prompt} />
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-grass-dark">
                          Correct answer: <RichText text={accepted[0] ?? ""} />
                          {accepted.length > 1 && (
                            <span className="font-semibold text-muted"> (also accepted: {accepted.slice(1).join(", ")})</span>
                          )}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-muted">Why: {sub.explanation}</p>
                        <p className="num mt-1 text-xs font-extrabold tracking-wide text-muted uppercase">
                          Reference: Q{q.id}({letter}) · {MARKS_PER_SUB} mark
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black text-ink sm:text-xl">Lesson topics covered</h2>
          <ul className="mt-3 space-y-3">
            {coverage.map(({ lesson, questions: items }) => (
              <li key={lesson}>
                <p className="text-sm font-extrabold text-ink">
                  {lessonLabel(lesson)}{" "}
                  <span className="font-semibold text-muted">
                    (Q{items.map((q) => q.id).join(", Q")})
                  </span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {LESSONS[lesson].topics.map((topic) => (
                    <li key={topic} className="rounded-full border-2 border-line bg-paper px-2 py-0.5 text-xs font-bold text-ink">
                      {topic}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black text-ink sm:text-xl">About this protection</h2>
          <p className="mt-2 text-sm leading-relaxed font-semibold text-muted">
            This area uses a simple password check that runs in the browser. It is a client-side
            access restriction only: it does not provide real authentication or encryption, and the
            password is stored in the page source. The answer key is never shown during an active
            attempt.
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function PillLink({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full rounded-full border-2 border-ocean/40 bg-ocean-soft px-3 py-1 text-xs font-extrabold break-words text-ocean-dark">
      {label}
    </span>
  );
}

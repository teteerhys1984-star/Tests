import { useState, type FormEvent } from "react";
import mascotUrl from "@/assets/mascot.jpg";
import {
  EXAM_SUBTITLE,
  EXAM_TITLE,
  MARKS_PER_QUESTION,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
} from "@/data/exam";
import { cn } from "@/utils/cn";
import { Footer } from "./Footer";
import { Button, Card, Icon, Pill } from "./ui";

type Props = {
  onStart: (name: string) => void;
  muted: boolean;
  onToggleMute: () => void;
  onTeacher: () => void;
};

const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;

const INSTRUCTIONS: Array<{ icon: "book" | "save" | "target" | "shield" | "clock"; text: string }> = [
  {
    icon: "book",
    text: "Answer every part of every question. Each question has five parts.",
  },
  {
    icon: "save",
    text: "Your answers are saved on this device. If the page closes, open it again to continue the same exam.",
  },
  {
    icon: "target",
    text: "You can move between questions and change your answers at any time.",
  },
  {
    icon: "shield",
    text: "The Submit Exam button turns on when every part is answered. It submits immediately, so check your work first.",
  },
  {
    icon: "clock",
    text: "Correct answers, explanations and your score are shown only after you submit.",
  },
];

export function Welcome({ onStart, muted, onToggleMute, onTeacher }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please type your name to start the exam.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Your name needs at least two letters.");
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      setError("Please write your name using English letters only.");
      return;
    }
    onStart(trimmed);
  };

  return (
    <div className="flex min-w-0 flex-col">
      <main className="wrap flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="relative text-center">
            <button
              type="button"
              onClick={onToggleMute}
              className="icon-btn absolute top-0 right-0"
              aria-pressed={!muted}
              aria-label={muted ? "Sound is off. Turn sound on" : "Sound is on. Turn sound off"}
            >
              <Icon name={muted ? "volumeOff" : "volume"} />
            </button>
            <Pill tone="sun">
              <Icon name="pencil" className="h-4 w-4" />
              {EXAM_SUBTITLE}
            </Pill>
            <h1 className="mt-3 text-3xl leading-tight font-black text-ink sm:text-5xl">
              {EXAM_TITLE}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed font-semibold text-muted sm:text-lg">
              This exam checks what you have learned about sentences, the verb to be, nouns,
              articles, adjectives, possessives and plural nouns. Read every question carefully
              and do your best.
            </p>
            <img
              src={mascotUrl}
              alt=""
              width={112}
              height={112}
              className="mx-auto mt-4 h-28 w-28 rounded-full border-4 border-sun bg-white lg:hidden"
            />
          </header>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
            {/* Start card: first on mobile, right column on wide screens */}
            <Card className="order-1 p-5 sm:p-6 lg:order-2">
              <h2 className="text-xl font-black text-ink sm:text-2xl">Start when you are ready</h2>
              <form onSubmit={handleSubmit} noValidate className="mt-4">
                <label htmlFor="student-name" className="block text-sm font-extrabold text-ink">
                  Your name <span className="text-coral-dark">(required)</span>
                </label>
                <input
                  id="student-name"
                  name="student-name"
                  type="text"
                  className={cn("input mt-2", error && "border-coral")}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Type your name"
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={40}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "name-error" : undefined}
                  enterKeyHint="go"
                />
                {error && (
                  <p
                    id="name-error"
                    role="alert"
                    className="mt-2 flex items-start gap-1.5 text-sm font-bold text-coral-dark"
                  >
                    <Icon name="info" className="mt-0.5 h-4 w-4" />
                    {error}
                  </p>
                )}
                <Button type="submit" size="lg" className="mt-4 w-full">
                  Start Exam
                  <Icon name="arrowRight" />
                </Button>
                <p className="mt-3 text-sm font-semibold text-muted">
                  The timer starts only when you press Start Exam.
                </p>
              </form>

              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { value: String(TOTAL_QUESTIONS), label: "questions" },
                  { value: String(TOTAL_MARKS), label: "marks" },
                  { value: String(MARKS_PER_QUESTION), label: "parts each" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border-2 border-line bg-paper px-2 py-2 text-center"
                  >
                    <dd className="num text-xl leading-tight font-black text-ocean-dark">
                      {item.value}
                    </dd>
                    <dt className="text-xs font-bold text-muted">{item.label}</dt>
                  </div>
                ))}
              </dl>
            </Card>

            {/* Instructions card */}
            <Card className="order-2 p-5 sm:p-6 lg:order-1">
              <img
                src={mascotUrl}
                alt=""
                width={208}
                height={208}
                className="mx-auto hidden h-52 w-52 rounded-full border-4 border-sun bg-white lg:block"
              />
              <h2 className="text-xl font-black text-ink sm:text-2xl lg:mt-4 lg:text-center">
                What to know before you start
              </h2>
              <ul className="mt-4 space-y-3">
                {INSTRUCTIONS.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-soft text-ocean-dark">
                      <Icon name={item.icon} className="h-4.5 w-4.5" />
                    </span>
                    <p className="min-w-0 text-sm leading-relaxed font-semibold text-ink sm:text-base">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>
      <Footer onTeacher={onTeacher} />
    </div>
  );
}

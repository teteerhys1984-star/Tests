import React, { useState } from "react";
import {
  ArrowLeft,
  BookMarked,
  KeyRound,
  Lock,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import {
  EXAM_SUBTITLE,
  EXAM_TITLE,
  EXAM_TOTAL_MARKS,
  EXAM_TOTAL_QUESTIONS,
  LESSONS,
} from "../data/lessons";
import { ExamQuestion, LessonNumber } from "../types/exam";
import { formatMarkLabel, formatSourceReference } from "../utils/grading";
import { StimulusBlock } from "./StimulusBlock";

interface TeacherKeyViewProps {
  questions: ExamQuestion[];
  onClose: () => void;
}

const TEACHER_GATE_CODE = "somer173";

type LessonFilter = "all" | LessonNumber;

export const TeacherKeyView: React.FC<TeacherKeyViewProps> = ({
  questions,
  onClose,
}) => {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [lessonFilter, setLessonFilter] = useState<LessonFilter>("all");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TEACHER_GATE_CODE) {
      setUnlocked(true);
      setPassword("");
      setError("");
    } else {
      setError("Incorrect teacher password. Please try again.");
    }
  };

  const handleLockAndExit = () => {
    setUnlocked(false);
    setPassword("");
    setError("");
    onClose();
  };

  const indexedQuestions = questions.map((question, idx) => ({
    examNumber: idx + 1,
    question,
  }));

  const visibleItems =
    lessonFilter === "all"
      ? indexedQuestions
      : indexedQuestions.filter((item) => item.question.lesson === lessonFilter);

  if (!unlocked) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <button
          type="button"
          onClick={handleLockAndExit}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#c6ebd3] bg-white px-4 py-1.5 text-xs font-extrabold text-[#166534] hover:bg-[#f0fcf4]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Exam</span>
        </button>

        <section className="exam-card-shadow rounded-3xl border-2 border-[#c2ebd0] bg-white p-6 sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcfce7] text-[#15803d]">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-extrabold text-[#0f3d24]">
            Teacher Answer Key
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#39634b]">
            This area is reserved for teachers and displays all 50 questions, model
            answers, grading rules, mark allocations, and curriculum source
            references.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#d6f2e0] bg-[#f4fdf7] p-3 text-xs font-semibold text-[#2d5a40]">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]"
              aria-hidden="true"
            />
            <span>
              Note: Client-side password protection acts as a basic classroom
              interface gate, not cryptographic or server-side authentication.
            </span>
          </div>

          <form onSubmit={handleUnlock} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="teacher-key-password"
                className="block text-sm font-extrabold text-[#0f3d24]"
              >
                Teacher Password
              </label>
              <input
                id="teacher-key-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter teacher password..."
                className="mt-1.5 w-full rounded-2xl border-2 border-[#b9e6c9] bg-white px-4 py-3 text-base font-bold text-[#0f3d24] focus:border-[#22c55e]"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-extrabold text-[#b91c1c]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22c55e] px-6 py-3 text-base font-extrabold text-white shadow-md shadow-[#22c55e]/25 transition-colors hover:bg-[#16a34a]"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>Unlock Answer Key</span>
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Sticky Teacher Key header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-[#b9e8c9] bg-white p-5 shadow-xs sm:p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-extrabold text-[#15803d]">
            <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
            Teacher Answer Key Unlocked
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-[#0f3d24] sm:text-2xl">
            {EXAM_TITLE} — {EXAM_SUBTITLE}
          </h1>
          <p className="text-xs font-bold text-[#39634b]">
            {EXAM_TOTAL_QUESTIONS} Main Questions · 10 per Lesson · 2 Marks Each ·{" "}
            {EXAM_TOTAL_MARKS} Total Marks
          </p>
        </div>

        <button
          type="button"
          onClick={handleLockAndExit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-[#0f3d24]"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span>Lock & Return</span>
        </button>
      </div>

      {/* Lesson filter bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#c8ecd5] bg-white p-4">
        <button
          type="button"
          onClick={() => setLessonFilter("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
            lessonFilter === "all"
              ? "bg-[#22c55e] text-white"
              : "border border-[#cdeed7] bg-[#f5fdf8] text-[#166534] hover:bg-[#e5faed]"
          }`}
        >
          All Questions ({EXAM_TOTAL_QUESTIONS})
        </button>
        {LESSONS.map((l) => (
          <button
            key={l.number}
            type="button"
            onClick={() => setLessonFilter(l.number)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
              lessonFilter === l.number
                ? "bg-[#22c55e] text-white"
                : "border border-[#cdeed7] bg-[#f5fdf8] text-[#166534] hover:bg-[#e5faed]"
            }`}
          >
            Lesson {l.number}: {l.title} ({l.questionCount} Q · {l.maxMarks} Marks)
          </button>
        ))}
      </div>

      {/* Answer key cards */}
      <div className="space-y-4">
        {visibleItems.map(({ examNumber, question }) => (
          <article
            key={question.id}
            className="rounded-3xl border-2 border-[#c8ecd5] bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f8ed] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#0f3d24] px-3 py-1 text-xs font-extrabold text-white">
                  Q{examNumber}
                </span>
                <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-extrabold text-[#166534]">
                  Lesson {question.lesson}: {question.source.lessonTitle}
                </span>
                <span className="rounded-full border border-[#c6ebd3] bg-[#f6fef8] px-3 py-0.5 text-xs font-bold text-[#15803d]">
                  {question.formatLabel}
                </span>
              </div>
              <span className="rounded-full border border-[#c3ebb0] bg-[#f4fee5] px-3 py-1 text-xs font-extrabold text-[#365314]">
                Total: {formatMarkLabel(question.marks)}
              </span>
            </div>

            <p className="mb-3 text-base font-extrabold text-[#0f3d24]">
              {question.instruction}
            </p>

            {question.stimuli && question.stimuli.length > 0 && (
              <div className="mb-4">
                <StimulusBlock stimuli={question.stimuli} compact />
              </div>
            )}

            {/* Model answers by type */}
            <div className="rounded-2xl border border-[#b9e8c9] bg-[#f2fcf5] p-4 text-sm">
              {question.type === "single-choice" && (
                <div className="space-y-1.5">
                  <p className="font-bold text-[#0f3d24]">{question.prompt}</p>
                  <p className="text-xs font-semibold text-[#39634b]">
                    Options: {question.options.join(" · ")}
                  </p>
                  <p className="font-extrabold text-[#15803d]">
                    Correct Answer: {question.correctAnswer} (2 marks)
                  </p>
                </div>
              )}

              {question.type === "choice-parts" && (
                <ul className="space-y-1.5">
                  {question.parts.map((part) => (
                    <li
                      key={part.id}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span>
                        <strong className="text-[#0f3d24]">{part.prompt}</strong>{" "}
                        <span className="text-xs text-[#477359]">
                          [{part.options.join(" / ")}]
                        </span>{" "}
                        →{" "}
                        <strong className="text-[#15803d]">
                          {part.correctAnswer}
                        </strong>
                      </span>
                      <span className="text-xs font-extrabold text-[#365314]">
                        ({formatMarkLabel(part.marks)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {question.type === "match" && (
                <ul className="space-y-1.5">
                  {question.parts.map((part) => (
                    <li
                      key={part.id}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span>
                        <strong className="text-[#0f3d24]">{part.prompt}</strong> →{" "}
                        <strong className="text-[#15803d]">
                          {part.correctAnswer}
                        </strong>
                      </span>
                      <span className="text-xs font-extrabold text-[#365314]">
                        ({formatMarkLabel(part.marks)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {question.type === "text-parts" && (
                <ul className="space-y-2">
                  {question.parts.map((part) => (
                    <li
                      key={part.id}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        {part.cueImages && part.cueImages.length > 0 && (
                          <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#d4f2df] bg-white px-2 py-1">
                            {part.cueImages.map((img, iIdx) => (
                              <img
                                key={iIdx}
                                src={img.src}
                                alt={img.alt}
                                loading="eager"
                                className="h-10 w-auto rounded bg-white object-contain"
                              />
                            ))}
                          </div>
                        )}
                        <div>
                        <strong className="text-[#0f3d24]">
                          {part.label} {part.beforeText}{" "}
                          {part.mistakeText ? `[${part.mistakeText}]` : "_____"}{" "}
                          {part.afterText}
                        </strong>{" "}
                        →{" "}
                        <strong className="text-[#15803d]">
                          {part.correctDisplay}
                        </strong>
                        {part.acceptedAnswers.length > 1 && (
                          <span className="ml-2 text-xs font-semibold text-[#3f6a52]">
                            (Accepted: {part.acceptedAnswers.join(" / ")})
                          </span>
                        )}
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#365314]">
                        ({formatMarkLabel(part.marks)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {question.type === "reorder" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#39634b]">
                    Scrambled words: {question.words.join(" / ")} ({question.endPunctuation})
                  </p>
                  <p className="font-extrabold text-[#15803d]">
                    Correct Sentence: {question.correctSentence} (2 marks)
                  </p>
                  {question.acceptedSentences.length > 1 && (
                    <p className="text-xs font-semibold text-[#3f6a52]">
                      Accepted variants: {question.acceptedSentences.join(" | ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Grading rule, explanation, and source reference */}
            <div className="mt-3 space-y-1.5 text-xs font-semibold text-[#244e36]">
              <p>
                <strong className="font-extrabold text-[#0f3d24]">
                  Grading Rule:
                </strong>{" "}
                {question.gradingRule}
              </p>
              <p>
                <strong className="font-extrabold text-[#0f3d24]">
                  Explanation:
                </strong>{" "}
                {question.explanation}
              </p>
              <p className="flex flex-wrap items-center gap-1.5 pt-1 text-[#15803d]">
                <BookMarked className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <strong className="font-extrabold">Source Reference:</strong>{" "}
                <span>{formatSourceReference(question.source)}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

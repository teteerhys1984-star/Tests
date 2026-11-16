import React, { useState } from "react";
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  ListChecks,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  EXAM_GRADE_LABEL,
  EXAM_MARKS_PER_QUESTION,
  EXAM_SUBTITLE,
  EXAM_TITLE,
  EXAM_TOTAL_MARKS,
  EXAM_TOTAL_QUESTIONS,
  LESSONS,
} from "../data/lessons";

interface WelcomeScreenProps {
  initialName: string;
  muted: boolean;
  onToggleMute: () => void;
  onStartExam: (studentName: string) => void;
  onOpenTeacherKey: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  initialName,
  muted,
  onToggleMute,
  onStartExam,
  onOpenTeacherKey,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name before starting the exam.");
      return;
    }
    setError("");
    onStartExam(trimmed);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Top utility bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bce8cc] bg-white px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-[#15803d] uppercase shadow-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden="true" />
          {EXAM_GRADE_LABEL}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ebd3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#166534] shadow-xs transition-colors hover:border-[#6fd492] hover:bg-[#f0fcf4]"
          >
            {muted ? (
              <>
                <VolumeX className="h-4 w-4 text-[#4b755d]" aria-hidden="true" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
                <span>Sound On</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTeacherKey}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c6ebd3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#166534] shadow-xs transition-colors hover:border-[#6fd492] hover:bg-[#f0fcf4]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#16a34a]" aria-hidden="true" />
            <span>Teacher Key</span>
          </button>
        </div>
      </div>

      {/* Main welcome hero card */}
      <section className="exam-card-shadow overflow-hidden rounded-3xl border-2 border-[#c2ebd0] bg-white">
        {/* Bright light-green decorative header band */}
        <div className="border-b border-[#cdeed7] bg-gradient-to-r from-[#e4faec] via-[#eefdf2] to-[#f1fce1] px-6 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {/* Friendly book & leaf SVG emblem */}
            <div
              className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border-2 border-[#a8e6be] bg-white shadow-xs"
              aria-hidden="true"
            >
              <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none">
                <path
                  d="M10 18C10 15.79 11.79 14 14 14H26C29.31 14 32 16.69 32 20V50C32 47.79 30.21 46 28 46H14C11.79 46 10 44.21 10 42V18Z"
                  fill="#dcfce7"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M54 18C54 15.79 52.21 14 50 14H38C34.69 14 32 16.69 32 20V50C32 47.79 33.79 46 36 46H50C52.21 46 54 44.21 54 42V18Z"
                  fill="#ecfccb"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M32 14C32 8.5 36.5 5 42 6C42.5 11.5 38 15 32 14Z"
                  fill="#84cc16"
                  stroke="#15803d"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 24H25M16 31H25M39 24H48M39 31H46"
                  stroke="#22c55e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-[#16a34a]">
                {EXAM_SUBTITLE}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0f3d24] sm:text-4xl">
                {EXAM_TITLE}
              </h1>
              <p className="mt-2 max-w-2xl text-base font-semibold text-[#2d5a40]">
                Welcome! Read every question carefully, answer all 50 questions at
                your own pace, and press Submit Exam when you finish.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-7 p-6 sm:p-10">
          {/* Exam statistics grid */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#cdeed7] bg-[#f4fdf7] p-4 text-center">
              <BookOpenCheck
                className="mx-auto mb-1.5 h-6 w-6 text-[#22c55e]"
                aria-hidden="true"
              />
              <div className="text-xl font-extrabold text-[#0f3d24] sm:text-2xl">
                Grade 3
              </div>
              <div className="text-xs font-bold text-[#39634b]">
                Unit 1 · Lessons 1–5
              </div>
            </div>

            <div className="rounded-2xl border border-[#cdeed7] bg-[#f4fdf7] p-4 text-center">
              <ListChecks
                className="mx-auto mb-1.5 h-6 w-6 text-[#22c55e]"
                aria-hidden="true"
              />
              <div className="text-xl font-extrabold text-[#0f3d24] sm:text-2xl">
                {EXAM_TOTAL_QUESTIONS}
              </div>
              <div className="text-xs font-bold text-[#39634b]">
                Total Questions
              </div>
            </div>

            <div className="rounded-2xl border border-[#c8eeb5] bg-[#f7feea] p-4 text-center">
              <Award
                className="mx-auto mb-1.5 h-6 w-6 text-[#65a30d]"
                aria-hidden="true"
              />
              <div className="text-xl font-extrabold text-[#0f3d24] sm:text-2xl">
                {EXAM_TOTAL_MARKS}
              </div>
              <div className="text-xs font-bold text-[#3f6212]">
                Total Marks ({EXAM_MARKS_PER_QUESTION} each)
              </div>
            </div>

            <div className="rounded-2xl border border-[#cdeed7] bg-[#f4fdf7] p-4 text-center">
              <Clock
                className="mx-auto mb-1.5 h-6 w-6 text-[#22c55e]"
                aria-hidden="true"
              />
              <div className="font-mono text-xl font-extrabold text-[#0f3d24] sm:text-2xl">
                00:00:00
              </div>
              <div className="text-xs font-bold text-[#39634b]">
                Starts When You Begin
              </div>
            </div>
          </div>

          {/* Lessons covered */}
          <div className="rounded-2xl border border-[#d4f2df] bg-[#fafefb] p-4 sm:p-5">
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
              Lessons Covered (10 Questions per Lesson)
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {LESSONS.map((lesson) => (
                <div
                  key={lesson.number}
                  className="flex items-center gap-2.5 rounded-xl border border-[#d6f2e0] bg-white px-3.5 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-xs font-extrabold text-[#15803d]">
                    {lesson.number}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#0f3d24]">
                      Lesson {lesson.number}: {lesson.title}
                    </p>
                    <p className="text-xs font-semibold text-[#477359]">
                      {lesson.questionCount} questions · {lesson.maxMarks} marks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friendly exam rules */}
          <div className="rounded-2xl border border-[#d4f2df] bg-[#f4fdf7] p-4 sm:p-5">
            <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
              Before You Start
            </h2>
            <ul className="grid grid-cols-1 gap-2 text-sm font-semibold text-[#1d4630] sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]"
                  aria-hidden="true"
                />
                <span>You can move freely between Questions 1 and 50 at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]"
                  aria-hidden="true"
                />
                <span>Your answers and timer are saved automatically as you work.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]"
                  aria-hidden="true"
                />
                <span>Complete every question and every sub-part to unlock Submit Exam.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]"
                  aria-hidden="true"
                />
                <span>Your score, full review, and downloadable report appear right after you submit.</span>
              </li>
            </ul>
          </div>

          {/* Mandatory student name & Start Exam button */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border-2 border-[#9ae6b4] bg-gradient-to-br from-[#eefcf3] to-[#f6fee8] p-5 sm:p-6"
          >
            <label
              htmlFor="student-name-input"
              className="block text-base font-extrabold text-[#0f3d24] sm:text-lg"
            >
              Student Name <span className="text-[#dc2626]">*</span>
            </label>
            <p className="mt-0.5 text-xs font-semibold text-[#39634b]">
              Enter your full name to begin. The stopwatch starts when you press Start Exam.
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="student-name-input"
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error && e.target.value.trim()) {
                    setError("");
                  }
                }}
                placeholder="Type your name here..."
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "student-name-error" : undefined}
                className={`flex-1 rounded-2xl border-2 bg-white px-4 py-3.5 text-lg font-bold text-[#0f3d24] placeholder:font-medium placeholder:text-[#7da58d] transition-colors ${
                  error
                    ? "border-[#ef4444]"
                    : "border-[#9ae6b4] focus:border-[#22c55e]"
                }`}
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#22c55e] px-8 py-3.5 text-lg font-extrabold text-white shadow-md shadow-[#22c55e]/25 transition-all hover:bg-[#16a34a] active:scale-[0.99]"
              >
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                <span>Start Exam</span>
              </button>
            </div>

            {error && (
              <p
                id="student-name-error"
                role="alert"
                className="mt-2.5 text-sm font-extrabold text-[#b91c1c]"
              >
                {error}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

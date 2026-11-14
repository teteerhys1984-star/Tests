import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { EXAM_QUESTIONS, LESSONS, TOTAL_BRANCHES, TOTAL_MARKS } from "@/data/exam";
import { branchKindLabel, correctAnswerText } from "@/lib/grading";

const TEACHER_PASSWORD = "somer173";

type TeacherKeyModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TeacherKeyModal({ open, onClose }: TeacherKeyModalProps) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setUnlocked(false);
      setError("");
      setShowPassword(false);
      return;
    }
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#06241f]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="إغلاق منطقة المعلم"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-key-title"
        className="relative z-10 flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] border border-[#c4a15a]/30 bg-[#fffdf8] shadow-2xl animate-fade-up sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="arabesque-bg flex shrink-0 items-start justify-between gap-4 border-b border-[#c4a15a]/25 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c4a15a]/35 bg-white/10 text-[#efdcb0]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 id="teacher-key-title" className="font-display text-base font-bold text-[#fff8e8] sm:text-lg">
                Teacher Answer Key
              </h2>
              <p className="mt-0.5 text-[10px] text-[#d4dfd8] sm:text-[11px]">
                منطقة المعلم — مفاتيح الإجابات والتعليلات والمراجع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-[#f4ead5] transition hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!unlocked ? (
          <div className="overflow-y-auto px-5 py-8 sm:px-8 sm:py-12">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-[#e3d9c6] bg-[#f7f1e5] text-[#9b7938]">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#0d3b35]">هذه المنطقة محمية</h3>
              <p className="mt-2 text-[12px] leading-7 text-[#68756f]">
                أدخل كلمة مرور المعلم للوصول إلى جميع الأسئلة والإجابات الصحيحة، وتوزيع العلامات
                والتعليلات والمراجع. لن تظهر أي إجابة قبل إدخال كلمة المرور الصحيحة.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-right">
                <label htmlFor="teacher-password" className="block text-xs font-bold text-[#0d3b35]">
                  كلمة المرور
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b7938]" />
                  <input
                    ref={inputRef}
                    id="teacher-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    className="w-full rounded-xl border border-[#d8cdb9] bg-[#fbf8f0] py-3 pe-4 ps-11 text-sm font-semibold tracking-widest text-[#0d3b35] focus:border-[#1f7a6a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f7a6a]/10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    dir="ltr"
                    aria-describedby={error ? "teacher-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute left-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-[#6b7872] transition hover:bg-[#f0eadd]"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && (
                  <p id="teacher-password-error" role="alert" className="text-[11px] font-semibold text-[#9d3f33]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3b35] px-4 py-3 text-sm font-bold text-[#fff8e7] transition hover:bg-[#124c44]"
                >
                  <KeyRound className="h-4 w-4 text-[#d9b873]" />
                  فتح مفتاح الإجابة
                </button>
              </form>

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#e8decb] bg-[#faf6ec] px-3 py-2.5 text-right text-[10px] leading-6 text-[#78847e]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9b7938]" />
                <p>حماية واجهة شكلية داخل التطبيق، وليست نظام مصادقة أو تشفيرًا حقيقيًا.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-[#e8dfcf] bg-[#f8f3e8] px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#315a51]">
                  <CheckCircle2 className="h-4 w-4 text-[#1f7a6a]" />
                  تم فتح مفتاح الإجابة
                </div>
                <div className="flex flex-wrap gap-1.5 text-[9.5px] font-bold">
                  <span className="rounded-full border border-[#d8cdb9] bg-white px-2 py-1 text-[#6b5a38]">
                    {EXAM_QUESTIONS.length} سؤالًا رئيسيًا
                  </span>
                  <span className="rounded-full border border-[#d8cdb9] bg-white px-2 py-1 text-[#6b5a38]">
                    {TOTAL_BRANCHES} فرعًا
                  </span>
                  <span className="rounded-full border border-[#d8cdb9] bg-white px-2 py-1 text-[#6b5a38]">
                    {TOTAL_MARKS} علامة
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[9.5px] leading-5 text-[#6b7a73]">
                توزيع العلامات: 35 فرعًا بقيمة علامتين لكل فرع، و10 فروع بقيمة 3 علامات لكل
                فرع، والمجموع 100 علامة. كل فرع يعرض علامته ومرجعه وتعليله أدناه.
              </p>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-3">
                {EXAM_QUESTIONS.map((question) => {
                  const lesson = LESSONS[question.lessonKey];
                  const totalPoints = question.branches.reduce((sum, branch) => sum + branch.points, 0);
                  return (
                    <details
                      key={question.id}
                      open={question.number === 1}
                      className="group rounded-xl border border-[#e2d8c6] bg-[#fffefa]"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0d3b35] text-[10px] font-bold text-[#efdcb0]">
                            {question.number}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-display text-[12px] font-bold text-[#123f39]">
                              {question.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[9.5px] text-[#7b8782]">
                              {lesson.title} · {lesson.pages}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[#f4ecdb] px-2 py-1 text-[9px] font-bold text-[#8b692a]">
                          {totalPoints} علامة
                        </span>
                      </summary>
                      <div className="border-t border-[#eee6d8] px-3.5 py-3">
                        <div className="mb-2 flex items-start gap-1.5 text-[10px] font-semibold text-[#8b692a]">
                          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            {lesson.unit} — {lesson.title} ({lesson.pages})
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {question.branches.map((branch, index) => (
                            <div key={branch.id} className="rounded-lg border border-[#eee6d8] bg-[#fcfaf4] p-3">
                              <div className="mb-1.5 flex items-start justify-between gap-2">
                                <p className="text-[11.5px] font-semibold leading-6 text-[#23443d]">
                                  <span className="text-[#9b7938]">
                                    {question.number}.{index + 1}
                                  </span>{" "}
                                  {branch.prompt}
                                </p>
                                <span className="shrink-0 rounded-full border border-[#e5dccb] bg-white px-2 py-0.5 text-[9px] font-bold text-[#6b5a38]">
                                  {branch.points}
                                </span>
                              </div>
                              <div className="mb-1.5 flex flex-wrap gap-1.5 text-[9px]">
                                <span className="rounded bg-[#eef7f2] px-1.5 py-0.5 font-bold text-[#1f6f5e]">
                                  {branchKindLabel(branch)}
                                </span>
                              </div>
                              <div className="rounded-md border border-[#cfe7dd] bg-[#f0f9f4] px-2.5 py-2 text-[11px] leading-6 text-[#0d4c3c]">
                                <span className="font-bold text-[#1f7a6a]">الإجابة الصحيحة: </span>
                                {correctAnswerText(branch)}
                              </div>
                              <p className="mt-1.5 text-[10.5px] leading-6 text-[#5e6c67]">
                                <span className="font-bold text-[#3d5851]">التعليل: </span>
                                {branch.explanation}
                              </p>
                              <p className="mt-1 text-[9.5px] leading-5 text-[#8b692a]">
                                المرجع: {branch.ref}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

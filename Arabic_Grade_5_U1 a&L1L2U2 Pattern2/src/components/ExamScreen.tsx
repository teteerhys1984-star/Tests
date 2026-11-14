import { useEffect, useMemo } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  CloudCheck,
  ListChecks,
  Map,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EXAM_QUESTIONS, LESSONS, TOTAL_BRANCHES } from "@/data/exam";
import {
  AnswerMap,
  AnswerValue,
  countAnsweredBranches,
  countAnsweredInQuestion,
  formatDuration,
  isBranchAnswered,
  isQuestionComplete,
} from "@/lib/grading";
import { Brand } from "./Common";
import { BranchInput } from "./BranchInput";

type ExamScreenProps = {
  studentName: string;
  answers: AnswerMap;
  elapsedSeconds: number;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onAnswer: (branchId: string, value: AnswerValue) => void;
  onSubmit: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
};

export function ExamScreen({
  studentName,
  answers,
  elapsedSeconds,
  currentIndex,
  onSelectQuestion,
  onAnswer,
  onSubmit,
  soundOn,
  onToggleSound,
}: ExamScreenProps) {
  const currentQuestion = EXAM_QUESTIONS[currentIndex];
  const lesson = LESSONS[currentQuestion.lessonKey];
  const answeredCount = countAnsweredBranches(answers);
  const remaining = TOTAL_BRANCHES - answeredCount;
  const canSubmit = remaining === 0;
  const completedQuestions = EXAM_QUESTIONS.filter((question) => isQuestionComplete(question, answers)).length;
  const currentQuestionAnswered = countAnsweredInQuestion(currentQuestion, answers);
  const progressPercent = Math.round((answeredCount / TOTAL_BRANCHES) * 100);
  const questionPoints = currentQuestion.branches.reduce((sum, branch) => sum + branch.points, 0);
  const firstIncompleteIndex = useMemo(
    () => EXAM_QUESTIONS.findIndex((question) => !isQuestionComplete(question, answers)),
    [answers],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  const submitButton = (helperId: string) => (
    <button
      type="button"
      onClick={onSubmit}
      disabled={!canSubmit}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
        canSubmit
          ? "bg-[#0d3b35] text-[#fff8e7] shadow-[0_14px_30px_-18px_rgba(13,59,53,0.9)] hover:bg-[#124c44]"
          : "border border-[#ddd4c4] bg-[#ece7db] text-[#8b938e]"
      }`}
      aria-describedby={helperId}
    >
      <CheckCircle2 className={`h-4 w-4 ${canSubmit ? "text-[#d9b873]" : "text-[#aab1ad]"}`} />
      <span>تسليم الاختبار</span>
    </button>
  );

  const questionMap = (
    <div className="grid grid-cols-5 gap-1.5" role="navigation" aria-label="خريطة الأسئلة">
      {EXAM_QUESTIONS.map((question, index) => {
        const answeredInQuestion = countAnsweredInQuestion(question, answers);
        const complete = answeredInQuestion === question.branches.length;
        const started = answeredInQuestion > 0;
        const current = index === currentIndex;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelectQuestion(index)}
            aria-current={current ? "step" : undefined}
            aria-label={`السؤال ${index + 1}: ${question.title}، ${
              complete ? "مكتمل" : started ? "قيد الإجابة" : "لم يبدأ"
            }`}
            className={`relative flex flex-col items-center justify-center rounded-lg border py-2 font-display text-[11px] font-bold transition ${
              current
                ? "border-[#c4a15a] bg-[#0d3b35] text-[#fff8e8] shadow-md ring-2 ring-[#c4a15a]/25"
                : complete
                  ? "border-[#a9d3c4] bg-[#e9f5ef] text-[#155f4c] hover:bg-[#ddf0e7]"
                  : started
                    ? "border-[#e6d3a8] bg-[#fbf2dd] text-[#8b692a] hover:bg-[#f7ecd1]"
                    : "border-[#e2d9c9] bg-[#fffdf8] text-[#7b8782] hover:border-[#1f7a6a]/35 hover:bg-[#f7fbf8]"
            }`}
          >
            <span>{index + 1}</span>
            <span className="mt-1 flex gap-[2px]" aria-hidden="true">
              {question.branches.map((branch) => (
                <span
                  key={branch.id}
                  className={`h-[2.5px] w-2 rounded-full ${
                    isBranchAnswered(branch, answers[branch.id])
                      ? current
                        ? "bg-[#e8d3a4]"
                        : "bg-[#1f7a6a]"
                      : current
                        ? "bg-white/30"
                        : "bg-[#d9d2c4]"
                  }`}
                />
              ))}
            </span>
            {current && (
              <span className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#c4a15a]" />
            )}
          </button>
        );
      })}
    </div>
  );

  const progressLegend = (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9.5px] font-medium text-[#75827c]">
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-sm border border-[#a9d3c4] bg-[#e9f5ef]" />
        مكتمل
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-sm border border-[#e6d3a8] bg-[#fbf2dd]" />
        قيد الإجابة
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-sm border border-[#e2d9c9] bg-[#fffdf8]" />
        لم يبدأ
      </span>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <header className="sticky top-0 z-50 border-b border-[#ded3c0]/85 bg-[#f9f5eb]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-3 py-2.5 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden sm:block">
              <Brand compact />
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#e1d7c5] bg-[#fffdf8] px-2.5 py-1.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef4f0] text-[#1f7a6a]">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-[8.5px] font-semibold text-[#8b948f]">الطالب</p>
                <p className="max-w-[8rem] truncate text-[11px] font-bold text-[#0d3b35] sm:max-w-[13rem]">
                  {studentName}
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-[#d8e7df] bg-[#eef7f2] px-2.5 py-1 text-[9.5px] font-bold text-[#1f6f5e] md:flex">
              <CloudCheck className="h-3.5 w-3.5" />
              حفظ تلقائي
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#e1d7c5] bg-[#fffdf8] text-[#5e6c67] transition hover:bg-white"
              aria-label={soundOn ? "إيقاف الصوت" : "تشغيل الصوت"}
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <div className="timer-shell flex items-center gap-2 rounded-xl px-3 py-1.5 text-[#fff8e8]">
              <Clock3 className="h-3.5 w-3.5 text-[#d9b873]" />
              <div className="text-right">
                <p className="text-[7.5px] font-medium leading-none text-[#cbd9d3]">الوقت المستغرق</p>
                <p className="number-tabular mt-0.5 text-[13px] font-bold leading-none tracking-wide sm:text-sm">
                  {formatDuration(elapsedSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-[#e9e0d0]">
          <div
            className="h-full bg-[linear-gradient(90deg,#c4a15a,#1f7a6a)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
        <div className="grid items-start gap-4 lg:grid-cols-[285px_minmax(0,1fr)] xl:grid-cols-[305px_minmax(0,1fr)]">
          <aside className="hidden space-y-3 lg:sticky lg:top-[86px] lg:block">
            <div className="soft-card overflow-hidden rounded-2xl">
              <div className="border-b border-[#eee6d8] bg-[#fffdf8] px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-sm font-bold text-[#0d3b35]">
                    <Map className="h-4 w-4 text-[#9b7938]" />
                    خريطة الاختبار
                  </h2>
                  <span className="number-tabular rounded-full bg-[#f4ecdb] px-2 py-0.5 text-[10px] font-bold text-[#8b692a]">
                    {completedQuestions}/{EXAM_QUESTIONS.length}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between text-[9.5px] font-semibold text-[#75827c]">
                    <span>الفروع المكتملة</span>
                    <span className="number-tabular">
                      {answeredCount} / {TOTAL_BRANCHES}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe4d7]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#1f7a6a,#c4a15a)] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-3.5">
                {questionMap}
                {progressLegend}
              </div>
              <div className="border-t border-[#eee6d8] bg-[#fbf8f0] px-3.5 py-3">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-[#68756f]">أسئلة مكتملة</span>
                  <span className="number-tabular text-[#0d3b35]">
                    {completedQuestions} من {EXAM_QUESTIONS.length}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-[#68756f]">فروع متبقية</span>
                  <span className={`number-tabular font-bold ${remaining === 0 ? "text-[#1f7a6a]" : "text-[#a1751c]"}`}>
                    {remaining}
                  </span>
                </div>
                {submitButton("submit-helper")}
                <p
                  id="submit-helper"
                  className={`mt-2 text-center text-[9.5px] leading-5 ${
                    canSubmit ? "font-semibold text-[#1f7a6a]" : "text-[#8b948f]"
                  }`}
                >
                  {canSubmit
                    ? "اكتملت جميع الفروع. سيُعرض التقرير مباشرة عند التسليم."
                    : `أكمل ${remaining} ${remaining === 1 ? "فرعًا" : "فروع"} لتفعيل التسليم.`}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5dccb] bg-[#fffdf8]/75 px-3.5 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-[#3d5851]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1f7a6a]" />
                تنقّل وحفظ آمن
              </p>
              <p className="text-[9.5px] leading-5 text-[#7b8782]">
                يمكنك العودة إلى أي سؤال. تُحفظ الإجابات والمؤقت تلقائيًا، وتُستعاد المحاولة عند
                تحديث الصفحة أو إغلاقها.
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-3 lg:hidden">
              <div className="soft-card overflow-hidden rounded-xl">
                <div className="flex items-center justify-between gap-2 border-b border-[#eee6d8] bg-[#fffdf8] px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0d3b35]">
                    <Map className="h-3.5 w-3.5 text-[#9b7938]" />
                    خريطة الأسئلة
                  </div>
                  <div className="number-tabular text-[9.5px] font-semibold text-[#7b8782]">
                    {answeredCount}/{TOTAL_BRANCHES} فرعًا · {completedQuestions}/15 مكتمل
                  </div>
                </div>
                <div className="overflow-x-auto px-3 py-2.5">
                  <div className="grid min-w-[420px] grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
                    {EXAM_QUESTIONS.map((question, index) => {
                      const answeredInQuestion = countAnsweredInQuestion(question, answers);
                      const complete = answeredInQuestion === question.branches.length;
                      const started = answeredInQuestion > 0;
                      const current = index === currentIndex;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => onSelectQuestion(index)}
                          className={`grid h-7 w-7 place-items-center rounded-md border font-display text-[10px] font-bold transition ${
                            current
                              ? "border-[#c4a15a] bg-[#0d3b35] text-[#fff8e8]"
                              : complete
                                ? "border-[#a9d3c4] bg-[#e9f5ef] text-[#155f4c]"
                                : started
                                  ? "border-[#e6d3a8] bg-[#fbf2dd] text-[#8b692a]"
                                  : "border-[#e2d9c9] bg-[#fffdf8] text-[#7b8782]"
                          }`}
                          aria-label={`السؤال ${index + 1}`}
                          aria-current={current ? "step" : undefined}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-1 bg-[#eee7da]">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#1f7a6a,#c4a15a)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="elevated-card overflow-hidden rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee6d8] bg-[#fffdf8] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0d3b35] font-display text-xs font-bold text-[#efdcb0]">
                    {currentQuestion.number}
                  </span>
                  <div>
                    <p className="text-[9.5px] font-medium text-[#8a948f]">
                      السؤال {currentQuestion.number} من {EXAM_QUESTIONS.length} ·{" "}
                      {currentQuestion.branches.length} فروع
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#3d5851]">
                      <BookMarked className="h-3 w-3 text-[#9b7938]" />
                      {lesson.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-[#e9dcc1] bg-[#fbf5e8] px-2.5 py-1 text-[9.5px] font-bold text-[#8b692a]">
                    {questionPoints} علامات
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9.5px] font-bold ${
                      currentQuestionAnswered === currentQuestion.branches.length
                        ? "border-[#bcd9ce] bg-[#eef7f2] text-[#1f6f5e]"
                        : "border-[#e5dccb] bg-[#fbf8f0] text-[#7b8782]"
                    }`}
                  >
                    {currentQuestionAnswered}/{currentQuestion.branches.length} أُجيب
                  </span>
                </div>
              </div>

              <div className="paper-pattern px-4 py-4 sm:px-5 sm:py-5">
                <div className="mb-4 rounded-xl border border-[#e3dccd] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef4f0] px-2.5 py-1 text-[9.5px] font-bold text-[#1f6f5e]">
                      {currentQuestion.skill}
                    </span>
                    <span className="text-[9px] font-medium text-[#9aa39e]">{lesson.unit}</span>
                  </div>
                  <h1 className="font-display text-lg font-bold leading-8 text-[#0d3b35] sm:text-xl">
                    {currentQuestion.title}
                  </h1>
                  <p className="mt-2 text-[12.5px] leading-7 text-[#5e6c67] sm:text-[13.5px]">
                    {currentQuestion.intro}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.branches.map((branch, index) => (
                    <div key={branch.id} className="relative">
                      <BranchInput
                        branch={branch}
                        label={`${currentQuestion.number}.${index + 1}`}
                        value={answers[branch.id]}
                        onChange={(value) => onAnswer(branch.id, value)}
                      />
                      {isBranchAnswered(branch, answers[branch.id]) && (
                        <span className="pointer-events-none absolute left-2.5 top-2.5 hidden items-center gap-1 rounded-full bg-[#eef7f2] px-1.5 py-0.5 text-[8px] font-bold text-[#1f6f5e] sm:flex">
                          <Check className="h-2.5 w-2.5" />
                          أُجيب
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-[#e7ddca] bg-[#faf6ec] px-3.5 py-2.5">
                  <p className="flex items-start gap-1.5 text-[10px] leading-5 text-[#7b8782]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9b7938]" />
                    لن تظهر صحة إجابتك أو الإجابة النموذجية الآن. راجع اختياراتك، ثم تابع إلى
                    السؤال التالي. جميع الفروع إلزامية.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eee6d8] bg-[#fffdf8] px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => onSelectQuestion(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd2c0] bg-white px-3.5 py-2 text-[11px] font-bold text-[#41544f] transition hover:border-[#1f7a6a]/35 hover:bg-[#f7fbf8] disabled:opacity-35"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  السؤال السابق
                </button>

                <div className="flex items-center gap-2">
                  {firstIncompleteIndex >= 0 && firstIncompleteIndex !== currentIndex && (
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(firstIncompleteIndex)}
                      className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-[#8b692a] transition hover:bg-[#fbf5e8] sm:inline-flex"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      أول سؤال غير مكتمل
                    </button>
                  )}
                  {currentIndex < EXAM_QUESTIONS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(Math.min(EXAM_QUESTIONS.length - 1, currentIndex + 1))}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d3b35] px-4 py-2 text-[11px] font-bold text-[#fff8e8] transition hover:bg-[#124c44]"
                    >
                      السؤال التالي
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(0)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#c4a15a]/45 bg-[#fbf5e8] px-4 py-2 text-[11px] font-bold text-[#8b692a] transition hover:bg-[#f6ecd3]"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      مراجعة الإجابات
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e5dccb] bg-[#fffdf8]/70 px-3.5 py-2.5">
              <span className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#7b8782]">
                <CloudCheck className="h-3.5 w-3.5 text-[#1f7a6a]" />
                حفظ تلقائي على هذا الجهاز · آخر تحديث فوري
              </span>
              <span className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#7b8782]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#9b7938]" />
                لا تغذية راجعة قبل التسليم
              </span>
            </div>
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dcd2c0] bg-[#fffdf8]/95 px-3 py-2.5 shadow-[0_-8px_30px_-20px_rgba(8,41,36,0.4)] backdrop-blur-md lg:hidden">
        <div className="mb-1.5 flex items-center justify-between text-[9.5px] font-semibold">
          <span className="text-[#68756f]">
            {answeredCount} / {TOTAL_BRANCHES} فرعًا · {remaining === 0 ? "مكتمل" : `تبقّى ${remaining}`}
          </span>
          <span className="number-tabular flex items-center gap-1 text-[#3d5851]">
            <Clock3 className="h-3 w-3 text-[#9b7938]" />
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        {submitButton("submit-helper-mobile")}
        <p id="submit-helper-mobile" className="mt-1 text-center text-[8.5px] font-medium text-[#9aa39e]">
          {canSubmit ? "سيُعرض التقرير مباشرة دون نافذة تأكيد." : `أكمل ${remaining} فرعًا لتفعيل الزر.`}
        </p>
      </div>
    </div>
  );
}

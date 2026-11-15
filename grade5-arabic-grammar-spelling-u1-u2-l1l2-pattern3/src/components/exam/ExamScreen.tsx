import { ChevronRight, ChevronLeft, Volume2, VolumeX, Clock } from "lucide-react";
import type { Question } from "../../data/questions/types";
import { LESSONS } from "../../data/curriculum/lessons";
import { EXAM_MODEL_LABEL } from "../../config";
import SubpartInput from "../questions/SubpartInput";
import { formatDuration } from "../../utils/scoring";

interface Props {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  onAnswer: (id: string, v: string) => void;
  onNavigate: (idx: number) => void;
  onSubmit: () => void;
  elapsedMs: number;
  soundOn: boolean;
  onToggleSound: () => void;
  studentName: string;
}

export default function ExamScreen({ questions, currentIndex, answers, onAnswer, onNavigate, onSubmit, elapsedMs, soundOn, onToggleSound, studentName }: Props) {
  const q = questions[currentIndex];
  const lesson = LESSONS.find((l) => l.id === q.lessonId);
  const totalSubparts = questions.reduce((s, x) => s + x.subparts.length, 0);
  const answeredCount = questions.reduce((s, x) => s + x.subparts.filter((sp) => (answers[sp.id] ?? "").trim().length > 0).length, 0);
  const allAnswered = answeredCount === totalSubparts;
  const progressPct = Math.round((answeredCount / totalSubparts) * 100);
  const isLast = currentIndex === questions.length - 1;

  const isQuestionAnswered = (qq: Question) => qq.subparts.every((sp) => (answers[sp.id] ?? "").trim().length > 0);

  return (
    <div className="fade-in mx-auto max-w-4xl px-4 py-6">
      {/* شريط علوي */}
      <div className="card-soft mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-pink-700">{studentName}</p>
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">{EXAM_MODEL_LABEL}</span>
            </div>
            <p className="text-xs text-violet-700">{lesson?.unit} – {lesson?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm font-bold text-pink-800" dir="ltr">
              <Clock className="h-4 w-4" /> {formatDuration(elapsedMs)}
            </span>
            <button onClick={onToggleSound} className="btn-soft p-2" aria-label="تبديل الصوت">
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-pink-100" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-l from-pink-500 to-violet-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-1 text-center text-xs font-bold text-pink-700">
          أُجيب عن {answeredCount} من {totalSubparts} فرعًا ({progressPct}%)
        </p>
      </div>

      {/* شبكة التنقل */}
      <div className="card-soft mb-4 p-3">
        <p className="mb-2 text-center text-sm font-bold text-pink-800">خريطة الأسئلة (30 سؤالًا)</p>
        <div className="flex flex-wrap justify-center gap-1.5" dir="rtl">
          {questions.map((qq, i) => {
            const done = isQuestionAnswered(qq);
            const active = i === currentIndex;
            return (
              <button
                key={qq.id}
                onClick={() => onNavigate(i)}
                className={`h-9 w-9 rounded-full text-sm font-bold transition ${active ? "bg-pink-600 text-white shadow" : done ? "bg-pink-200 text-pink-900" : "bg-white text-pink-700 border border-pink-300"}`}
                aria-label={`السؤال ${qq.number}${done ? " – مكتمل" : ""}`}
                aria-current={active ? "true" : undefined}
              >
                {qq.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* السؤال الحالي */}
      <div className="card-soft p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-pink-900">السؤال {q.number} من 30</h2>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-800">
            {q.category === "grammar" ? "قواعد اللغة" : "الإملاء"}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-pink-50 p-3 font-bold leading-relaxed text-pink-900">{q.instruction}</p>
        <p className="mt-3 leading-relaxed text-violet-900">{q.prompt}</p>

        <div className="mt-5 space-y-5">
          {q.subparts.map((sp) => (
            <fieldset key={sp.id} className="rounded-2xl border border-pink-200 bg-white p-4">
              <legend className="px-2 text-sm font-bold text-pink-700">
                الفرع {sp.label} ({sp.maxMarks} {sp.maxMarks === 1 ? "درجة" : "درجات"})
              </legend>
              <p className="text-base font-bold leading-relaxed text-pink-950">{sp.prompt}</p>
              <SubpartInput subpart={sp} value={answers[sp.id] ?? ""} onChange={(v) => onAnswer(sp.id, v)} />
            </fieldset>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="btn-soft flex items-center gap-1 px-5 py-3 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" /> السابق
          </button>
          {!isLast ? (
            <button onClick={() => onNavigate(currentIndex + 1)} className="btn-primary flex items-center gap-1 px-6 py-3">
              التالي <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={onSubmit} disabled={!allAnswered} className="btn-primary px-8 py-3 text-lg">
              تسليم الاختبار
            </button>
          )}
        </div>
        {!allAnswered && (
          <p className="mt-3 text-center text-sm text-pink-600">
            زر التسليم يصبح متاحًا بعد الإجابة عن جميع الفروع ({totalSubparts} فرعًا).
          </p>
        )}
      </div>

      {/* زر التسليم الدائم أسفل الصفحة */}
      <div className="no-print mt-4 text-center">
        <button onClick={onSubmit} disabled={!allAnswered} className="btn-primary px-10 py-4 text-xl disabled:opacity-40">
          تسليم الاختبار
        </button>
      </div>
    </div>
  );
}

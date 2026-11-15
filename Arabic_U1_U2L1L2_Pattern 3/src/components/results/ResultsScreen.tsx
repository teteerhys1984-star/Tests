import { Download, RotateCcw, KeyRound, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { Question } from "../../data/questions/types";
import { LESSONS, EXAM_TITLE } from "../../data/curriculum/lessons";
import type { SubpartResult } from "../../utils/scoring";
import { formatDuration, performanceLevel } from "../../utils/scoring";

interface Props {
  studentName: string;
  questions: Question[];
  results: Map<string, SubpartResult>;
  totalEarned: number;
  totalMax: number;
  grammarEarned: number;
  grammarMax: number;
  spellingEarned: number;
  spellingMax: number;
  durationMs: number;
  lessonStats: { lessonId: string; earned: number; max: number; grammarEarned: number; grammarMax: number; spellingEarned: number; spellingMax: number }[];
  onDownloadTxt: () => void;
  onRetake: () => void;
  onOpenTeacher: () => void;
}

export default function ResultsScreen(p: Props) {
  const pct = p.totalMax ? Math.round((p.totalEarned / p.totalMax) * 100) : 0;
  const correctCount = [...p.results.values()].filter((r) => r.correct).length;
  const partialCount = [...p.results.values()].filter((r) => r.partial).length;
  const wrongCount = [...p.results.values()].filter((r) => !r.correct && !r.partial).length;

  const weakest = [...p.lessonStats].sort((a, b) => (a.max ? a.earned / a.max : 1) - (b.max ? b.earned / b.max : 1))[0];

  return (
    <div className="fade-in mx-auto max-w-4xl px-4 py-6">
      <div className="card-soft p-6 text-center sm:p-8">
        <h1 className="text-2xl font-bold text-pink-900">نتيجة الاختبار</h1>
        <p className="mt-1 text-violet-800">{EXAM_TITLE}</p>
        <p className="mt-2 text-lg font-bold text-pink-800">الطالبة: {p.studentName}</p>
        <div className="mx-auto mt-4 flex h-36 w-36 flex-col items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-xl">
          <span className="text-4xl font-bold">{p.totalEarned}</span>
          <span className="text-sm">من {p.totalMax}</span>
          <span className="text-lg font-bold">{pct}%</span>
        </div>
        <p className="mt-3 font-bold text-pink-800">{performanceLevel(pct)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-green-50 p-3"><p className="font-bold text-green-700">صحيحة</p><p className="text-xl font-bold">{correctCount}</p></div>
          <div className="rounded-xl bg-amber-50 p-3"><p className="font-bold text-amber-700">جزئية</p><p className="text-xl font-bold">{partialCount}</p></div>
          <div className="rounded-xl bg-red-50 p-3"><p className="font-bold text-red-700">خاطئة</p><p className="text-xl font-bold">{wrongCount}</p></div>
          <div className="rounded-xl bg-violet-50 p-3"><p className="font-bold text-violet-700">المدة</p><p className="text-xl font-bold" dir="ltr">{formatDuration(p.durationMs)}</p></div>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-pink-50 p-3">قواعد اللغة: <b>{p.grammarEarned} / {p.grammarMax}</b></div>
          <div className="rounded-xl bg-violet-50 p-3">الإملاء: <b>{p.spellingEarned} / {p.spellingMax}</b></div>
        </div>
        {weakest && (
          <p className="mt-3 text-sm text-pink-700">
            الدرس الذي يحتاج إلى تعزيز: <b>{LESSONS.find((l) => l.id === weakest.lessonId)?.title}</b>
          </p>
        )}
        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={p.onDownloadTxt} className="btn-primary flex items-center gap-2 px-6 py-3">
            <Download className="h-5 w-5" /> تحميل التقرير TXT
          </button>
          <button onClick={p.onRetake} className="btn-soft flex items-center gap-2 px-6 py-3">
            <RotateCcw className="h-5 w-5" /> إعادة الاختبار
          </button>
          <button onClick={p.onOpenTeacher} className="btn-soft flex items-center gap-2 px-6 py-3">
            <KeyRound className="h-5 w-5" /> مفتاح المعلم
          </button>
        </div>
      </div>

      {/* جدول الدروس */}
      <div className="card-soft mt-4 overflow-x-auto p-4">
        <h2 className="mb-3 text-lg font-bold text-pink-900">الأداء حسب الدرس</h2>
        <table className="w-full min-w-[520px] text-center text-sm">
          <thead>
            <tr className="bg-pink-100 text-pink-900">
              <th className="rounded-r-xl p-2">الدرس</th>
              <th className="p-2">قواعد اللغة</th>
              <th className="p-2">الإملاء</th>
              <th className="rounded-l-xl p-2">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {p.lessonStats.map((ls) => {
              const lesson = LESSONS.find((l) => l.id === ls.lessonId);
              return (
                <tr key={ls.lessonId} className="border-b border-pink-100">
                  <td className="p-2 text-right font-bold">{lesson?.unit} – {lesson?.title}</td>
                  <td className="p-2">{ls.grammarEarned} / {ls.grammarMax}</td>
                  <td className="p-2">{ls.spellingEarned} / {ls.spellingMax}</td>
                  <td className="p-2 font-bold">{ls.earned} / {ls.max}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* مراجعة مفصلة */}
      <div className="mt-4 space-y-4">
        {p.questions.map((q) => {
          const lesson = LESSONS.find((l) => l.id === q.lessonId);
          return (
            <div key={q.id} className="card-soft p-4 sm:p-5">
              <h3 className="font-bold text-pink-900">
                السؤال {q.number} – {lesson?.title} (ص {lesson?.pages}) – {q.category === "grammar" ? "قواعد اللغة" : "الإملاء"}
              </h3>
              <p className="mt-1 text-sm text-violet-800">{q.instruction}</p>
              <div className="mt-3 space-y-3">
                {q.subparts.map((sp) => {
                  const r = p.results.get(sp.id);
                  const earned = r?.earned ?? 0;
                  const status = r?.correct ? "correct" : r?.partial ? "partial" : "wrong";
                  return (
                    <div key={sp.id} className={`rounded-xl border p-3 ${status === "correct" ? "border-green-200 bg-green-50" : status === "partial" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold leading-relaxed">{sp.label}) {sp.prompt}</p>
                        <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
                          {status === "correct" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : status === "partial" ? <MinusCircle className="h-5 w-5 text-amber-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                          {earned} / {sp.maxMarks}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">إجابتك: <b>{r?.studentAnswer || "—"}</b></p>
                      <p className="text-sm">الإجابة الصحيحة: <b>{sp.correctAnswer}</b>{sp.acceptedAnswers?.length ? ` (يُقبل أيضًا: ${sp.acceptedAnswers.join(" / ")})` : ""}</p>
                      <p className="mt-1 text-sm text-violet-900">الشرح: {sp.explanation}</p>
                      <p className="mt-1 text-xs text-pink-600">المهارة: {sp.skill} | الصعوبة: {sp.difficulty}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

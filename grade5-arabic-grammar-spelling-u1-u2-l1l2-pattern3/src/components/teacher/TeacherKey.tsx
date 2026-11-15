import { useState } from "react";
import { Lock, X } from "lucide-react";
import type { Question } from "../../data/questions/types";
import { LESSONS } from "../../data/curriculum/lessons";
import { EXAM_MODEL_LABEL } from "../../config";

const TEACHER_PASSWORD = "somer173";

interface Props {
  questions: Question[];
  onClose: () => void;
}

export default function TeacherKey({ questions, onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const tryUnlock = () => {
    if (pwd === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("كلمة المرور غير صحيحة.");
    }
  };

  return (
    <div className="fade-in mx-auto max-w-4xl px-4 py-6">
      <div className="card-soft p-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-pink-900">
            <Lock className="h-6 w-6" /> مفتاح إجابات المعلم ({EXAM_MODEL_LABEL})
          </h1>
          <button type="button" onClick={onClose} className="btn-soft flex items-center gap-1 px-4 py-2 text-sm"><X className="h-5 w-5" /> إغلاق</button>
        </div>
        <p className="mt-2 text-sm text-pink-700">
          هذا المفتاح مخصص للمعلمة فقط. ملاحظة: كلمة المرور حاجز واجهة فقط (Client-side) ولا توفر مصادقة أو تشفيرًا حقيقيًا.
        </p>

        {!unlocked ? (
          <div className="mt-5">
            <label htmlFor="teacher-pwd" className="mb-2 block font-bold text-pink-900">كلمة المرور</label>
            <div className="flex gap-2">
              <input
                id="teacher-pwd"
                type="password"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }}
                className="input-ar"
                placeholder="أدخلي كلمة المرور"
                dir="ltr"
              />
              <button onClick={tryUnlock} className="btn-primary shrink-0 px-6 py-3">فتح</button>
            </div>
            {error && <p className="mt-2 text-sm font-bold text-red-600" role="alert">{error}</p>}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {questions.map((q) => {
              const lesson = LESSONS.find((l) => l.id === q.lessonId);
              return (
                <div key={q.id} className="rounded-2xl border border-pink-200 bg-white p-4">
                  <h3 className="font-bold text-pink-900">
                    السؤال {q.number} – {lesson?.unit} – {lesson?.title} (ص {lesson?.pages}) – {q.category === "grammar" ? "قواعد اللغة" : "الإملاء"}
                  </h3>
                  <p className="mt-1 text-sm text-violet-800">{q.instruction}</p>
                  <div className="mt-2 space-y-2">
                    {q.subparts.map((sp) => (
                      <div key={sp.id} className="rounded-xl bg-pink-50 p-3 text-sm">
                        <p className="font-bold">{sp.label}) {sp.prompt}</p>
                        <p>الإجابة الصحيحة: <b>{sp.correctAnswer}</b>{sp.acceptedAnswers?.length ? ` | بدائل مقبولة: ${sp.acceptedAnswers.join(" / ")}` : ""}</p>
                        <p>الدرجات: {sp.maxMarks} | المهارة: {sp.skill} | الصعوبة: {sp.difficulty}</p>
                        <p>الشرح: {sp.explanation}</p>
                        {sp.rubric && <p>سلم التصحيح: {sp.rubric}</p>}
                        {sp.misconception && <p className="text-pink-700">سوء فهم شائع: {sp.misconception}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

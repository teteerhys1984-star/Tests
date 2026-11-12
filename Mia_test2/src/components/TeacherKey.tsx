import { useEffect, useRef, useState } from "react";
import {
  QUESTIONS,
  TEACHER_PASSWORD,
  TOTAL_MARKS,
  TOTAL_PARTS,
} from "../exam/data";
import { marksWord } from "../exam/grade";
import { MathText } from "./MathText";
import { FloralDivider } from "./Ornaments";
import { CheckIcon, LockIcon } from "./Layout";

export function TeacherKey({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!unlocked) inputRef.current?.focus();
  }, [unlocked]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError("");
      setPassword("");
    } else {
      setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-key-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {!unlocked ? (
        <div className="modal-card max-w-md p-5 sm:p-7" dir="rtl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6d4dd] bg-[#fbf2f6] text-[#8b4059]">
                <LockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">منطقة المعلم</p>
                <h2 id="teacher-key-title" className="display-title text-2xl font-bold text-[#452737]">
                  دليل الإجابات
                </h2>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
              ✕
            </button>
          </div>

          <FloralDivider className="my-4" />

          <p className="text-sm leading-7 text-[#705866]">
            هذه المنطقة مخصصة للمعلم وتتطلب كلمة مرور للوصول إلى مفاتيح الإجابات والمراجع.
          </p>
          <form className="mt-4" onSubmit={handleUnlock} noValidate>
            <label htmlFor="teacher-password" className="mb-1.5 block text-sm font-extrabold text-[#543544]">
              كلمة مرور المعلم
            </label>
            <input
              ref={inputRef}
              id="teacher-password"
              className="input-field"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "teacher-error" : undefined}
              placeholder="أدخل كلمة المرور"
            />
            {error ? (
              <p id="teacher-error" role="alert" className="mt-2 text-xs font-bold text-[#a13552]">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary mt-4 w-full">
              <LockIcon className="h-4 w-4" />
              دخول دليل المعلم
            </button>
          </form>
          <div className="info-box mt-4 text-[0.73rem]">
            حماية محلية بسيطة داخل الصفحة الثابتة، وليست مصادقة على خادم أو تشفيراً. لا تُدرج كلمة
            المرور في تقرير الطالب أو في واجهة الاختبار.
          </div>
        </div>
      ) : (
        <div className="modal-card" dir="rtl">
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-t-[22px] border-b border-[#eadce3] bg-[rgba(255,253,251,0.97)] px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6d4dd] bg-[#fbf2f6] text-[#8b4059]">
                <KeyIcon />
              </span>
              <div>
                <h2 id="teacher-key-title" className="display-title text-xl font-bold text-[#452737]">
                  مفتاح الإجابات ومرجع التدقيق
                </h2>
                <p className="text-[0.68rem] font-semibold text-[#8a7380]">
                  ميا والرياضيات · السادس الأساسي · 30 سؤالاً / {TOTAL_MARKS} علامة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip chip-rose">
                <CheckIcon className="h-3 w-3" />
                تم فتح الدليل
              </span>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق دليل المعلم">
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e8d8df] bg-[#fffbf9] p-3 text-center">
                <p className="num text-2xl font-extrabold text-[#7f3f55]">30</p>
                <p className="text-[0.7rem] font-bold text-[#806875]">سؤالاً رئيسياً</p>
              </div>
              <div className="rounded-xl border border-[#e8d8df] bg-[#fffbf9] p-3 text-center">
                <p className="num text-2xl font-extrabold text-[#7f3f55]">{TOTAL_PARTS}</p>
                <p className="text-[0.7rem] font-bold text-[#806875]">جزءاً مستقلاً</p>
              </div>
              <div className="rounded-xl border border-[#e8d8df] bg-[#fffbf9] p-3 text-center">
                <p className="num text-2xl font-extrabold text-[#7f3f55]">{TOTAL_MARKS}</p>
                <p className="text-[0.7rem] font-bold text-[#806875]">الدرجة الكلية</p>
              </div>
            </div>

            <div className="info-box mt-3 text-[0.74rem] leading-7">
              المرجع: كتاب الرياضيات — الصف السادس الأساسي، الصفحات المطبوعة 8–43. جميع الأسئلة
              والأجزاء مصححة آلياً وفق مفتاح الإجابة الآتي. الأجزاء ذات العناصر المتعددة تقبل
              العلامة الجزئية وفق التوزيع المذكور. تُقبل الصيغ البديلة المحددة لكل جزء نصي.
            </div>

            <h3 className="mt-5 text-base font-extrabold text-[#4e3040]">توزيع العلامات والمراجع</h3>
            <div className="table-wrap mt-2">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>السؤال</th>
                    <th>العنوان</th>
                    <th>المحور</th>
                    <th>الأجزاء</th>
                    <th>العلامات</th>
                    <th>مرجع الكتاب</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((question) => {
                    const marks = question.parts.reduce((sum, part) => sum + part.marks, 0);
                    return (
                      <tr key={question.id}>
                        <td className="num">{question.id}</td>
                        <td>{question.title}</td>
                        <td>{question.topic}</td>
                        <td className="num">{question.parts.length}</td>
                        <td className="num">{marks}</td>
                        <td>{question.page}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[0.72rem] font-semibold text-[#6c5361]">
              المجموع: {QUESTIONS.reduce((sum, q) => sum + q.parts.reduce((s, p) => s + p.marks, 0), 0)}{" "}
              علامة — عدد الأجزاء: {TOTAL_PARTS}.
            </p>

            <div className="my-5">
              <FloralDivider />
            </div>

            <div className="space-y-3">
              {QUESTIONS.map((question) => {
                const marks = question.parts.reduce((sum, part) => sum + part.marks, 0);
                return (
                  <details key={question.id} className="review-details rounded-xl border border-[#e7d8df] bg-[#fffdfb]">
                    <summary className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e6d0da] bg-[#fbf2f6] text-[0.72rem] font-extrabold text-[#844359]">
                          {question.id}
                        </span>
                        <div>
                          <p className="text-[0.86rem] font-extrabold text-[#4c3040]">{question.title}</p>
                          <p className="mt-0.5 text-[0.68rem] text-[#8b7380]">
                            {question.topic} · {marksWord(marks)} · {question.page}
                          </p>
                        </div>
                      </div>
                      <span className="num shrink-0 text-[0.7rem] font-bold text-[#7a5b69]">
                        {question.parts.length} أجزاء
                      </span>
                    </summary>
                    <div className="border-t border-[#eee2e8] px-3 py-3">
                      {question.parts.map((part) => (
                        <div key={part.id} className="key-part">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-2">
                              <span className="part-badge">{part.label}</span>
                              <p className="pt-0.5 text-[0.83rem] font-semibold leading-7 text-[#4b3340]">
                                <MathText text={part.prompt} />
                              </p>
                            </div>
                            <span className="mark-pill">{marksWord(part.marks)}</span>
                          </div>
                          <div className="mt-2 rounded-lg border border-[#e2eadc] bg-[#f8fbf6] px-3 py-2">
                            <p className="text-[0.65rem] font-bold text-[#60775a]">الإجابة الصحيحة</p>
                            <p className="mt-0.5 text-[0.83rem] font-semibold leading-7 text-[#3e5539]">
                              <MathText text={part.answerText} />
                            </p>
                          </div>
                          <p className="mt-2 text-[0.78rem] leading-7 text-[#5f4854]">
                            <span className="font-bold text-[#7f465b]">الشرح: </span>
                            <MathText text={part.explanation} />
                          </p>
                          <div className="mt-1.5 grid gap-1 text-[0.7rem] leading-6 text-[#7f6a76] sm:grid-cols-2">
                            <p>
                              <span className="font-bold">المرجع: </span>
                              {part.page}
                            </p>
                            {part.partialRule ? (
                              <p>
                                <span className="font-bold">العلامة الجزئية: </span>
                                {part.partialRule}
                              </p>
                            ) : (
                              <p>
                                <span className="font-bold">العلامة الجزئية: </span>
                                لا تُمنح علامة جزئية؛ الإجابة كاملة أو غير صحيحة.
                              </p>
                            )}
                            {part.alternativeAnswers && part.alternativeAnswers.length > 0 ? (
                              <p className="sm:col-span-2">
                                <span className="font-bold">إجابات بديلة مقبولة: </span>
                                {part.alternativeAnswers.join("، ")}
                              </p>
                            ) : null}
                            {part.kind === "numeric" && part.accepted ? (
                              <p className="sm:col-span-2">
                                <span className="font-bold">الصيغ الرقمية المقبولة: </span>
                                {part.accepted.join("، ")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>

            <p className="mt-5 text-center text-[0.72rem] text-[#8a7380]">
              نهاية دليل المعلم · المرجع الوحيد للاختبار هو صفحات الكتاب المطبوعة 8–43.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M17 4l3 3M14 7l3 3" />
    </svg>
  );
}

import { useEffect, useRef, useState } from "react";
import { ALL_SUBPARTS, EXAM_VERSION, QUESTIONS, TOTAL_MARKS, questionMarks } from "../exam/data";
import {
  acceptedAnswersText,
  correctAnswerText,
  marksLabel,
  partialRuleText,
} from "../exam/grade";
import type { Subpart } from "../exam/types";

const TEACHER_PASSWORD = "somer173";

const KIND_LABELS: Record<Subpart["kind"], string> = {
  mcq: "اختيار من متعدد",
  tf: "صواب / خطأ",
  numeric: "إدخال رقمي",
  pair: "إحداثيان",
  multi: "خانات متعددة",
  order: "ترتيب",
  compare: "إشارة مقارنة",
};

interface TeacherKeyProps {
  open: boolean;
  onClose: () => void;
}

export function TeacherKey({ open, onClose }: TeacherKeyProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setUnlocked(false);
      setPassword("");
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(null);
    } else {
      setError("كلمة المرور غير صحيحة. هذه الصفحة مخصّصة للمعلم فقط.");
      setPassword("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-heading">
        <div className="modal-head">
          <div>
            <span className="eyebrow">منطقة محمية · للمعلم</span>
            <h2 id="teacher-heading">دليل المعلم ومفتاح التصحيح</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق دليل المعلم">
            ✕
          </button>
        </div>

        {!unlocked ? (
          <div className="password-gate">
            <div className="gate-block" aria-hidden="true">▣</div>
            <h3>أدخل كلمة مرور المعلم</h3>
            <p className="muted">
              هذه بوّابة واجهة أمامية فقط وليست مصادقة خادم آمنة. لا تظهر كلمة المرور في تقرير الطالب.
            </p>
            <form onSubmit={submit}>
              <label htmlFor="teacher-password" className="field-label">كلمة المرور</label>
              <input
                id="teacher-password"
                ref={inputRef}
                type="password"
                className="text-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="current-password"
              />
              {error && <p className="field-error" role="alert">{error}</p>}
              <button type="submit" className="button button-primary button-wide">دخول المفتاح</button>
            </form>
          </div>
        ) : (
          <div className="teacher-key-body">
            <div className="key-summary">
              <div>
                <span>عدد الأسئلة الرئيسة</span>
                <strong>{QUESTIONS.length}</strong>
              </div>
              <div>
                <span>عدد الأجزاء</span>
                <strong>{ALL_SUBPARTS.length}</strong>
              </div>
              <div>
                <span>المجموع الكلي</span>
                <strong>{TOTAL_MARKS} درجة</strong>
              </div>
            </div>
            <div className="key-warning">
              يحتوي هذا المفتاح على الإجابات الكاملة والشروح ومراجع صفحات الكتاب. لا تعرضه للطلاب.
              إصدار الاختبار: {EXAM_VERSION} — المرجع الداخلي: صفحات الكتاب 8 إلى 28.
            </div>

            {QUESTIONS.map((question, qIndex) => (
              <details className="key-question" key={question.id} open>
                <summary>
                  <span>السؤال {qIndex + 1} · {question.title}</span>
                  <span className="key-marks">{questionMarks(question)} درجة</span>
                </summary>
                <div className="key-question-body">
                  <p className="key-stem">{question.stem}</p>
                  <p className="key-page">المرجع الداخلي للكتاب: <strong>{question.page}</strong></p>
                  {question.subparts.map((subpart, partIndex) => (
                    <div className="key-part" key={subpart.id}>
                      <div className="key-part-head">
                        <span className="part-index">الجزء {partIndex + 1}</span>
                        <span className="key-kind">{KIND_LABELS[subpart.kind]}</span>
                        <span className="key-sub-marks">{marksLabel(subpart.marks)}</span>
                      </div>
                      <p className="key-prompt">{subpart.prompt}</p>
                      <div className="key-answer">
                        <span>الإجابة الصحيحة</span>
                        <strong dir="auto">{correctAnswerText(subpart)}</strong>
                      </div>
                      <p className="key-line"><span>الشرح:</span> {subpart.explanation}</p>
                      <p className="key-line"><span>بدائل مقبولة:</span> {acceptedAnswersText(subpart)}</p>
                      <p className="key-line"><span>الدرجة الجزئية:</span> {partialRuleText(subpart)}</p>
                      <p className="key-line key-page-line"><span>مرجع الكتاب:</span> {subpart.page}</p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <div className="key-footer">
              <strong>إجمالي الدرجات في المفتاح: {QUESTIONS.reduce((sum, q) => sum + questionMarks(q), 0)} / 100</strong>
              <span>تُمنح الدرجة الجزئية وفق القواعد المدرجة لكل جزء، ولا تُمنح أي درجة مقابل إجابة غير مكتوبة.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

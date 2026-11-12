import { useEffect, useRef, useState } from "react";
import { TEACHER_KEY_CHECK } from "../data/questions";
import { IconKey, IconLock, IconX } from "./Icons";

export function TeacherGate({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError(false);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    let accepted = false;
    try {
      accepted = window.btoa(password) === TEACHER_KEY_CHECK;
    } catch {
      accepted = false;
    }
    if (accepted) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="overlay no-print" role="presentation" onMouseDown={onClose}>
      <div
        className="modal screen-enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-gate-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: "#f7edf2", color: "#8d3b5a" }}
            >
              <IconLock size={20} />
            </span>
            <div>
              <h2 id="teacher-gate-title" className="m-0 text-[1.05rem] font-bold" style={{ color: "#57304a" }}>
                المفتاح التعليمي
              </h2>
              <p className="m-0 text-[0.76rem]" style={{ color: "#8a7181" }}>
                الدخول مخصّص للمعلم فقط.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="إغلاق"
            className="grid h-8 w-8 place-items-center rounded-lg border"
            style={{ borderColor: "#ead8e1", color: "#8a7181", background: "#fff" }}
            onClick={onClose}
          >
            <IconX size={16} />
          </button>
        </div>

        <label className="name-label mt-3" htmlFor="teacher-password">
          كلمة مرور المعلم
        </label>
        <input
          id="teacher-password"
          ref={inputRef}
          type="password"
          className="field"
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-invalid={error}
          aria-describedby={error ? "teacher-error" : undefined}
        />
        {error ? (
          <p id="teacher-error" className="notice notice-danger mt-2" role="alert">
            كلمة المرور غير صحيحة. تحقق منها وأعد المحاولة.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={submit}>
            <IconKey size={16} />
            دخول المعلم
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            إلغاء
          </button>
        </div>

        <p className="notice notice-info mt-3">
          هذه حماية محلية بسيطة داخل الملف، وليست مصادقة خادم أو تشفيراً. لا تظهر كلمة المرور
          للطالب ولا تُضمَّن في تقرير الطالب.
        </p>
      </div>
    </div>
  );
}

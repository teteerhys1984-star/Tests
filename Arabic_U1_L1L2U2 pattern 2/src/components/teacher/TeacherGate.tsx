import { useState } from "react";
import { EXAM_META } from "../../data/sources/lessons";
import { Icon } from "../common/Icon";
import { Logo } from "../common/Logo";
import { SoundToggle } from "../common/SoundToggle";

interface TeacherGateProps {
  onUnlock: () => void;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function TeacherGate({ onUnlock, onClose, soundEnabled, onToggleSound }: TeacherGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== EXAM_META.teacherPassword) {
      setError("كلمة المرور غير صحيحة. يرجى التواصل مع المعلمة.");
      return;
    }
    setError(null);
    onUnlock();
  };

  return (
    <div className="relative z-10 min-h-screen">
      <header className="page-container flex items-center justify-between gap-3 py-4">
        <Logo compact />
        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
          <button type="button" onClick={onClose} className="btn btn-outline px-3.5 py-2 text-[11.5px]">
            <Icon name="arrow-right" size={15} />
            العودة إلى الاختبار
          </button>
        </div>
      </header>

      <main className="page-container flex min-h-[74vh] items-center justify-center py-6">
        <div className="card animate-rise grid w-full max-w-3xl overflow-hidden md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative hidden min-h-[340px] md:block">
            <img
              src={`${import.meta.env.BASE_URL}images/floral-bouquet.jpg`}
              alt="باقة زهور بألوان وردية وخزامية"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#552c3f]/75 via-[#6b3a50]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="chip mb-2 border-white/30 bg-white/15 text-white">
                <Icon name="lock" size={12} /> منطقة المعلمة
              </span>
              <p className="font-display text-xl leading-8">
                مفتاح الإجابات والروبرِك والمراجع الداخلية في مكان واحد.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e8ec] text-[#9e4b68]">
              <Icon name="teacher" size={24} />
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-[#643448]">دليل المعلمة ومفتاح الإجابات</h1>
            <p className="mt-1 text-[12.5px] leading-6 text-[#8e7a80]">
              هذا القسم مخصّص للمعلمة فقط، ويتضمّن الإجابات الصحيحة والتفسيرات وروبرِك التصحيح والمراجع الداخلية.
              لا تُعرض أي إجابة صحيحة للطالبة خلال الاختبار.
            </p>

            <form onSubmit={submit} className="mt-4">
              <label htmlFor="teacher-password" className="field-label">
                كلمة المرور
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[#b28a98]">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  id="teacher-password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="أدخلي كلمة المرور"
                  autoComplete="current-password"
                  className="text-field pr-11 pl-11"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  className="absolute inset-y-0 left-2.5 flex items-center rounded-full px-2 text-[#a48993] hover:text-[#7a4d60]"
                  aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  <Icon name="pen" size={15} />
                </button>
              </div>
              {error ? (
                <p id="password-error" role="alert" className="mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-[#b0415d]">
                  <Icon name="alert" size={13} /> {error}
                </p>
              ) : (
                <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-5 text-[#a18c92]">
                  <Icon name="shield" size={12} className="mt-1 flex-none" />
                  حاجز وصول تعليمي يعمل في جهة العميل فقط، وليس مصادقة أمنية أو تشفيرًا؛ لا يُستخدم لبيانات حساسة.
                </p>
              )}
              <button type="submit" className="btn btn-primary mt-4 w-full py-3">
                <Icon name="lock" size={16} />
                فتح دليل المعلمة
              </button>
            </form>

            <div className="mt-4 rounded-xl border border-[#efe3df] bg-[#fbf7f3] px-3 py-2 text-[10.5px] leading-6 text-[#97838a]">
              يظل الاختبار الرسمي للطالبة من دون أي إجابات أو تلميحات، ويُفتح التصحيح الكامل بعد تسليم الاختبار فقط.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

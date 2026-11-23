import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import { TEACHER_PASSWORD } from "@/config";
import type { AppTab } from "@/lib/site";
import { site } from "@/lib/site";
import { WhatsAppMark } from "@/components/Chrome";
import { cn } from "@/utils/cn";

export function TeacherGate({
  onUnlock,
  onNavigate,
}: {
  onUnlock: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const unlock = () => {
    setValue("");
    onUnlock();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (cooldown > 0) return;
    if (value.trim() === TEACHER_PASSWORD) {
      unlock();
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setError(
      nextAttempts >= 4
        ? "توقّف قليلًا من فضلك — جرّب مرة أخرى بعد انتهاء العدّاد."
        : "كلمة السر غير صحيحة. تأكد من الأحرف الصغيرة في البداية."
    );
    setShake(true);
    window.setTimeout(() => setShake(false), 520);
    if (nextAttempts >= 4) {
      setCooldownUntil(Date.now() + 20000);
      setNow(Date.now());
      setAttempts(0);
    }
    inputRef.current?.select();
  };

  return (
    <div className="gate-wrap">
      <div className="gate-decor" aria-hidden="true">
        <span className="gate-blob gate-blob-a" />
        <span className="gate-blob gate-blob-b" />
        <span className="gate-blob gate-blob-c" />
        <span className="gate-spark gate-spark-a">✦</span>
        <span className="gate-spark gate-spark-b">✧</span>
        <span className="gate-spark gate-spark-c">❤</span>
        <span className="gate-ring gate-ring-a" />
        <span className="gate-ring gate-ring-b" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_0.92fr]">
          <div className="order-1 min-w-0 text-center lg:order-1 lg:text-right">
            <span className="gate-eyebrow">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              محمية بكلمة سر
            </span>
            <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-tight text-[#5c1846] sm:text-[40px]">
              منطقة المعلم <span className="text-[#c0266e]">مقفلة</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-8 text-[#8a5c78] sm:text-[13px] lg:mx-0">
              هنا تُحفظ <span className="font-semibold text-[#b31e60]">الحلول الكاملة وتقارير الأداء</span> وتوزيع العلامات
              للمسائل العشرين. المساحة مخصّصة للمعلم فقط، وصفحات الاختبار تبقى للطالب بلا حلول مسبقة.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="gate-chip"><LockKeyhole className="size-3" aria-hidden="true" /> 20 حلًّا محميًّا</span>
              <span className="gate-chip"><Sparkles className="size-3" aria-hidden="true" /> توزيع العلامات</span>
              <span className="gate-chip"><Heart className="size-3" aria-hidden="true" /> خاصة بالمعلم</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <button type="button" onClick={() => onNavigate("welcome")} className="gate-back">
                <ArrowRight className="size-4" aria-hidden="true" />
                رجوع إلى البداية
              </button>
              <a
                href={`https://wa.me/${site.phoneIntl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gate-contact"
              >
                <WhatsAppMark className="whatsapp-mark-flat size-6" />
                نسيت كلمة السر؟ راسل المهندس سومر
              </a>
            </div>
          </div>

          <div className={cn("order-2 min-w-0 lg:order-2", shake && "gate-shaking")}>
            <div className="gate-card">
              <div className="gate-card-glow" aria-hidden="true" />
              <div className="relative text-center">
                <div className="gate-lock">
                  <span className="gate-lock-halo" aria-hidden="true" />
                  <svg viewBox="0 0 96 96" className="relative z-[1] h-14 w-14" aria-hidden="true">
                    <defs>
                      <linearGradient id="gateLock" x1="16" y1="10" x2="84" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ff8fc2" />
                        <stop offset="0.55" stopColor="#db2777" />
                        <stop offset="1" stopColor="#9333ea" />
                      </linearGradient>
                    </defs>
                    <path d="M30 42V32a18 18 0 0 1 36 0v10" fill="none" stroke="#ffd0e5" strokeWidth="8" strokeLinecap="round" />
                    <rect x="20" y="40" width="56" height="46" rx="15" fill="url(#gateLock)" />
                    <rect x="20" y="40" width="56" height="46" rx="15" fill="none" stroke="#ffffff" strokeOpacity=".45" strokeWidth="1.6" />
                    <path d="M48 58c4 0 7 3 7 6.5 0 2.6-1.5 4.6-3.6 5.6V76a3 3 0 0 1-6 0v-5.9c-2.1-1-3.4-3-3.4-5.6C42 61 45 58 48 58Z" fill="#fff4fa" />
                  </svg>
                  <span className="gate-heart gate-heart-a" aria-hidden="true">♡</span>
                  <span className="gate-heart gate-heart-b" aria-hidden="true">♥</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#5c1846]">أدخل كلمة سر المعلم</h2>
                <p className="mt-1 text-[10.5px] text-[#9a6c86]">الوصول إلى الحلول وتقارير الأداء</p>
              </div>

              <form onSubmit={submit} className="relative mt-5" noValidate>
                <label htmlFor="teacher-password" className="sr-only">
                  كلمة سر منطقة المعلم
                </label>
                <div className="gate-field">
                  <span className="gate-field-icon">
                    <KeyRound className="size-4" aria-hidden="true" />
                  </span>
                  <input
                    ref={inputRef}
                    id="teacher-password"
                    name="teacher-password"
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      if (error) setError(null);
                    }}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    dir="ltr"
                    placeholder="••••••••"
                    aria-describedby="gate-help"
                    aria-invalid={Boolean(error)}
                    className="gate-input"
                    disabled={cooldown > 0}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    className="gate-eye"
                    aria-label={visible ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    aria-pressed={visible}
                  >
                    {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>

                <div id="gate-help" aria-live="polite" className="min-h-[22px] pt-1.5">
                  {error ? (
                    <p className="flex items-start gap-1.5 text-[10px] leading-5 text-[#c2185b]" role="alert">
                      <LockKeyhole className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  ) : (
                    <p className="text-[9px] text-[#a97f95]">المساحة خاصة — لا تشارك كلمة السر مع الطلاب.</p>
                  )}
                </div>

                <button type="submit" className="gate-submit" disabled={cooldown > 0 || value.length === 0}>
                  {cooldown > 0 ? (
                    <>
                      <LockKeyhole className="size-4" aria-hidden="true" />
                      انتظر {cooldown} ثانية
                    </>
                  ) : (
                    <>
                      <Unlock className="size-4" aria-hidden="true" />
                      افتح منطقة المعلم
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#f7dcea] bg-[#fff8fc] px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[9px] text-[#a2708d]">
                    <ShieldCheck className="size-3 text-[#c0266e]" aria-hidden="true" />
                    اتصال آمن داخل المتصفح
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-[#b78aa1]">
                    <Heart className="size-2.5 fill-[#f472b6] text-[#f472b6]" aria-hidden="true" />
                    نسخة المعلم
                  </span>
                </div>
              </form>

              <p className="relative mt-3 text-center text-[9px] leading-5 text-[#b08a9e]">
                الجلسة تبقى مفتوحة حتى إغلاق المتصفح. يمكنك قفلها يدويًا من داخل منطقة المعلم.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[9.5px] text-[#a87e95]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 ring-1 ring-[#f6d9e8]">
                <span className="size-1.5 rounded-full bg-[#f472b6]" aria-hidden="true" />
                إعداد: {site.teacher}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 ring-1 ring-[#f6d9e8]" dir="ltr">
                {site.phoneDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

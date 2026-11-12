import { useState } from "react";
import type { FormEvent } from "react";
import { EXAM_TITLE, TOTAL_MARKS, TOTAL_SUBPARTS, questions } from "../data/questions";
import {
  IconApple,
  IconBook,
  IconCheck,
  IconClock,
  IconCrown,
  IconDownload,
  IconLock,
  IconMirror,
  IconPen,
  IconSparkle,
  IconTrophy,
} from "../components/Icons";

function FairytaleScene() {
  return (
    <svg
      viewBox="0 0 340 330"
      className="float-slow mx-auto h-auto w-full max-w-[330px]"
      role="img"
      aria-label="رسم خيالي لمِرآة مزخرفة وتفاحة وتاج وزهور"
    >
      <defs>
        <linearGradient id="mirrorGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ead8ae" />
          <stop offset="45%" stopColor="#c5a15c" />
          <stop offset="100%" stopColor="#a9853f" />
        </linearGradient>
        <linearGradient id="mirrorGlass" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fdf9ff" />
          <stop offset="45%" stopColor="#f2ecfa" />
          <stop offset="100%" stopColor="#e8f3f8" />
        </linearGradient>
        <linearGradient id="appleRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9879f" />
          <stop offset="60%" stopColor="#b85c7c" />
          <stop offset="100%" stopColor="#8a3b5a" />
        </linearGradient>
        <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2e1b8" />
          <stop offset="100%" stopColor="#c5a15c" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#8f3b5a" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* floral base */}
      <ellipse cx="170" cy="291" rx="132" ry="24" fill="#f5e7ee" opacity="0.65" />

      {/* mirror frame */}
      <g filter="url(#softShadow)">
        <path
          d="M170 22c58 0 96 40 96 92 0 59-44 102-96 102S74 173 74 114c0-52 38-92 96-92Z"
          fill="url(#mirrorGold)"
        />
        <path
          d="M170 31c52 0 86 36 86 83 0 54-39 93-86 93s-86-39-86-93c0-47 34-83 86-83Z"
          fill="url(#mirrorGlass)"
          stroke="#fffaf0"
          strokeWidth="2"
        />
        <path
          d="M170 41c45 0 75 31 75 73 0 47-34 82-75 82s-75-35-75-82c0-42 30-73 75-73Z"
          fill="none"
          stroke="#e3d3b2"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <path d="M95 74c14-21 35-32 58-35" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.7" fill="none" />
        <path d="M87 117h-8M96 88l-6-5M170 22v-8M245 117h8M245 88l6-5" stroke="#c5a15c" strokeWidth="2" strokeLinecap="round" />
        <circle cx="170" cy="236" r="11" fill="url(#mirrorGold)" />
        <path d="M162 236h16M170 228v16" stroke="#fff6e5" strokeWidth="1.4" />
      </g>

      {/* castle inside the glass */}
      <g opacity="0.9">
        <path d="M116 155h18v-35l9-12 9 12v35h28v-50l10-14 10 14v50h14v-28l8-10 8 10v28h10v34h-124Z" fill="#e7dcf2" stroke="#cbbce0" strokeWidth="1.2" />
        <path d="M126 150v-20h8v20M221 150v-16h8v16" fill="#fbf6ff" stroke="#cbbce0" strokeWidth="1" />
        <rect x="157" y="156" width="20" height="33" rx="8" fill="#d8c4e6" />
        <path d="M110 189h106" stroke="#d2c2e2" strokeWidth="2" strokeLinecap="round" />
        <circle cx="170" cy="108" r="3" fill="#e2d1f0" />
        <path d="M104 68l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" fill="#ddcbec" />
      </g>

      {/* crown */}
      <g transform="translate(236 58) rotate(12)">
        <path
          d="M0 30 8 6l10 12L28 0l10 18L48 6l8 24-4 9H4z"
          fill="url(#crownGold)"
          stroke="#a9853f"
          strokeWidth="1.2"
        />
        <circle cx="8" cy="8" r="2.6" fill="#fff7e6" />
        <circle cx="28" cy="4" r="2.6" fill="#fff7e6" />
        <circle cx="48" cy="8" r="2.6" fill="#fff7e6" />
      </g>

      {/* apple */}
      <g transform="translate(30 216)" filter="url(#softShadow)">
        <path
          d="M45 18c14-13 39-10 39 20 0 26-20 51-39 51S6 64 6 38c0-30 25-33 39-20Z"
          fill="url(#appleRed)"
        />
        <path d="M45 18c1-12 6-20 16-25" stroke="#7c8a68" strokeWidth="4" strokeLinecap="round" />
        <path d="M57 3c7-8 18-9 25-5 1 9-6 17-15 17-4 0-8-5-10-12Z" fill="#a9bd9a" stroke="#8fa383" strokeWidth="1" />
        <path d="M22 43c1-6 4-11 10-14" stroke="#f5c9d6" strokeWidth="5" strokeLinecap="round" opacity="0.55" fill="none" />
      </g>

      {/* roses */}
      <g transform="translate(263 236)">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 20} ${i % 2 === 0 ? 0 : -8})`}>
            <circle cx="0" cy="0" r="12" fill="#f4dce7" stroke="#dbb3c5" />
            <path d="M0 0c-5-1-7-5-4-8 4-3 9 0 9 4" fill="none" stroke="#c894ac" strokeWidth="1.2" />
            <path d="M-15 9c-5 5-5 11-2 16 5-1 10-5 11-10" fill="#cfdcc5" stroke="#aabd9f" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* sparkles */}
      <path className="sparkle" d="M62 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#d8b877" />
      <path className="sparkle delay-1" d="M292 152l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#b9a8d8" />
      <path className="sparkle delay-2" d="M300 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e2c6d3" />
    </svg>
  );
}

export function Welcome({
  name,
  onNameChange,
  onStart,
  storageWarning,
}: {
  name: string;
  onNameChange: (name: string) => void;
  onStart: (name: string) => void;
  storageWarning: string | null;
}) {
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const showNameError = touched && trimmed.length === 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!trimmed) return;
    onStart(trimmed);
  };

  return (
    <main className="shell-narrow screen-enter py-4">
      <div className="hero ornate-card p-4 sm:p-6 lg:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="eyebrow">
              <IconCrown size={14} />
              اختبار نهاية المقرر · السادس الأساسي
            </span>
            <h1 className="hero-title mt-3">
              {EXAM_TITLE.split(" ")[0]} <span className="accent">والرياضيات</span>
            </h1>
            <p className="hero-subtitle mt-2">
              اختبار رياضيات مصمّم بعناية من صفحات كتاب الصف السادس الأساسي، بروح حكاية بيضاء
              هادئة: رياضيات دقيقة، أسئلة متدرّجة، وواجهة واضحة تحفظ تقدّمك خطوة بخطوة.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconBook size={17} />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>عدد الأسئلة</p>
                  <p className="m-0 text-[0.92rem] font-bold">30 سؤالاً</p>
                </div>
              </div>
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconTrophy size={17} />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>الدرجة الكلية</p>
                  <p className="m-0 text-[0.92rem] font-bold">{TOTAL_MARKS} درجة</p>
                </div>
              </div>
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconListIcon />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>أجزاء الإجابة</p>
                  <p className="m-0 text-[0.92rem] font-bold">{TOTAL_SUBPARTS} جزءاً</p>
                </div>
              </div>
              <div className="info-tile">
                <span className="info-tile-icon">
                  <IconClock size={17} />
                </span>
                <div>
                  <p className="m-0 text-[0.68rem]" style={{ color: "#8a7181" }}>النمط الزمني</p>
                  <p className="m-0 text-[0.92rem] font-bold">عدّ تصاعدي</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5">
              <label className="name-label" htmlFor="student-name">
                اسم الطالب <span style={{ color: "#b23f62" }}>(إلزامي)</span>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="student-name"
                  className="field"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="اكتب اسمك الكامل هنا"
                  maxLength={80}
                  autoComplete="name"
                  aria-invalid={showNameError}
                  aria-describedby={showNameError ? "name-error" : "name-help"}
                  required
                />
                <button
                  type="submit"
                  className={`btn shrink-0 ${trimmed ? "btn-primary" : "btn-primary"}`}
                  disabled={!trimmed}
                  style={
                    trimmed
                      ? { boxShadow: "0 16px 30px -14px rgba(143,59,90,0.8)" }
                      : undefined
                  }
                >
                  <IconPen size={17} />
                  بدء الاختبار
                </button>
              </div>
              {showNameError ? (
                <p id="name-error" className="notice notice-danger mt-2" role="alert">
                  يرجى إدخال اسم الطالب قبل بدء الاختبار.
                </p>
              ) : null}
              <p id="name-help" className="answer-note mt-1.5">
                سيظهر اسمك في تقرير النتيجة النهائي. لا يبدأ مؤقت الاختبار قبل الضغط على «بدء الاختبار».
              </p>
            </form>

            {storageWarning ? (
              <p className="notice notice-danger mt-3" role="status">
                <IconLock size={15} />
                {storageWarning}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <div
              className="mx-auto rounded-[28px] border p-3"
              style={{
                borderColor: "#eddee5",
                background:
                  "radial-gradient(360px 240px at 60% 0%, #fff, transparent 70%), linear-gradient(160deg, #fffcf8, #f9f1f7)",
              }}
            >
              <FairytaleScene />
              <div className="floral-divider">
                <IconSparkle size={15} />
                <span className="whitespace-nowrap text-[0.72rem]" style={{ letterSpacing: "0.02em" }}>
                  رياضيات بروح الحكايات
                </span>
                <IconSparkle size={15} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="info-tile-icon" style={{ width: 34, height: 34 }}>
              <IconPen size={16} />
            </span>
            <div>
              <h2 className="m-0 text-[1.02rem] font-bold" style={{ color: "#57304a" }}>
                تعليمات الاختبار
              </h2>
              <p className="m-0 text-[0.76rem]" style={{ color: "#8a7181" }}>
                اقرأ التعليمات قبل البدء. الأسئلة موزّعة على كامل المقرر.
              </p>
            </div>
          </div>
          <ul className="rule-list">
            <li>يحتوي الاختبار 30 سؤالاً رئيسياً و{TOTAL_SUBPARTS} جزءاً مستقلاً، ومجموع الدرجات 100.</li>
            <li>أجب عن جميع الأجزاء المطلوبة؛ لا يمكن التسليم قبل إكمالها كلها.</li>
            <li>تنقّل بين الأسئلة بحرّية، ويمكنك الرجوع إلى أي سؤال قبل التسليم؛ تبقى الإجابات محفوظة.</li>
            <li>تُحفظ إجاباتك تلقائياً في هذا المتصفح، ويُستأنف الاختبار والعدّاد عند إعادة فتح الصفحة نفسها.</li>
            <li>يبدأ عدّاد الزمن التصاعدي عند ظهور السؤال الأول، ويتوقف نهائياً عند التسليم.</li>
            <li>لا تظهر إجابات صحيحة أو تلميحات أثناء الاختبار؛ التصحيح والشرح يظهران بعد التسليم فقط.</li>
            <li>عند التسليم يُنزَّل تقرير TXT تلقائياً مرة واحدة، مع زر لتنزيله مجدداً من صفحة النتيجة.</li>
            <li>يوجد صوت بدء قصير، وصوت مختلف عند التسليم؛ تعطّل الصوت لا يؤثر في سير الاختبار.</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {["أعداد طبيعية", "هندسة ومستقيمات", "زوايا ومثلثات", "جمع وطرح", "ضرب وقسمة", "قوى"].map(
              (topic) => (
                <span key={topic} className="chip chip-soft">
                  <IconCheck size={12} />
                  {topic}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="info-tile-icon" style={{ width: 34, height: 34 }}>
              <IconMirror size={16} />
            </span>
            <h2 className="m-0 text-[1.02rem] font-bold" style={{ color: "#57304a" }}>
              قبل أن تبدأ
            </h2>
          </div>
          <ul className="rule-list">
            <li>تأكد من كتابة الاسم بالشكل الصحيح؛ سيُستخدم في اسم ملف التقرير.</li>
            <li>اختر مكاناً هادئاً، وجهّز مسودتك وأدواتك الهندسية إن احتجت.</li>
            <li>لا توجد أسئلة إلزامية الاختيار من بينها؛ جميع الأجزاء المطلوبة يجب أن تُجاب.</li>
          </ul>
          <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: "#efdee7", background: "#fffafc" }}>
            <p className="m-0 flex items-center gap-1.5 text-[0.8rem] font-bold" style={{ color: "#7b3d5c" }}>
              <IconDownload size={15} />
              تقرير النتيجة
            </p>
            <p className="m-0 mt-1 text-[0.76rem]" style={{ color: "#866e7d" }}>
              يتضمّن درجتك ونسبتك ومدّتك، وإجاباتك، والإجابات الصحيحة، والشرح الكامل، وحالة كل جزء،
              والمراجع الداخلية للمعلم. يُنشأ محلياً في متصفحك، وتُرسَل نتيجتك إلى معلّمك عند التسليم.
            </p>
          </div>
          <div className="floral-divider mt-3">
            <IconApple size={17} />
          </div>
          <p className="m-0 text-center text-[0.72rem]" style={{ color: "#9a8394" }}>
            بالنجاح والتفوّق — ميا والرياضيات
          </p>
        </section>
      </div>

      <p className="mt-3 text-center text-[0.7rem]" style={{ color: "#a08a98" }}>
        {questions.length} سؤالاً · {TOTAL_SUBPARTS} جزءاً · {TOTAL_MARKS} درجة · الصف السادس الأساسي · مادة الرياضيات
      </p>
    </main>
  );
}

function IconListIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}

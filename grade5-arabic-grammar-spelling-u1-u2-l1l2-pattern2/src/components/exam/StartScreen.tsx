import { useState } from "react";
import { EXAM_META } from "../../data/sources/lessons";
import { TOTAL_SUBPARTS } from "../../data/questions";
import { toArabicDigits } from "../../utils/arabic";
import { FloralMark, Logo } from "../common/Logo";
import { Icon } from "../common/Icon";
import { SoundToggle } from "../common/SoundToggle";

interface StartScreenProps {
  onStart: (studentName: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenTeacher: () => void;
}

const RULES = [
  {
    icon: "list" as const,
    title: "٣٠ سؤالًا رئيسًا",
    text: `موزّعة على خمسة دروس، بإجمالي ${toArabicDigits(TOTAL_SUBPARTS)} عنصرًا قابلًا للتقييم.`,
  },
  {
    icon: "book" as const,
    title: "قواعد اللغة والإملاء فقط",
    text: "لا تتضمن الأسئلة فهمًا قرائيًّا أو مفردات أو تعبيرًا كتابيًّا.",
  },
  {
    icon: "shield" as const,
    title: "من دون إجابات أو تلميحات",
    text: "تُعرض النتيجة والتصحيح الكامل بعد التسليم فقط، ولا يظهر أي حل خلال الاختبار.",
  },
  {
    icon: "timer" as const,
    title: "مؤقّت تصاعدي وحفظ تلقائي",
    text: "يبدأ المؤقت بضغط «ابدئي الاختبار» ويُحفظ تقدمك ومؤقتك تلقائيًّا.",
  },
];

export function StartScreen({ onStart, soundEnabled, onToggleSound, onOpenTeacher }: StartScreenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = name.trim().replace(/\s+/g, " ");
    if (value.length < 3) {
      setError("يرجى كتابة الاسم الكامل قبل بدء الاختبار.");
      return;
    }
    setError(null);
    onStart(value);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <header className="page-container flex items-center justify-between gap-3 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} withLabel />
          <button type="button" onClick={onOpenTeacher} className="btn btn-outline hidden sm:inline-flex">
            <Icon name="lock" size={16} />
            دليل المعلم
          </button>
          <button
            type="button"
            onClick={onOpenTeacher}
            className="btn btn-icon sm:hidden"
            aria-label="دليل المعلم"
            title="دليل المعلم"
          >
            <Icon name="teacher" size={18} />
          </button>
        </div>
      </header>

      <main className="page-container pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          {/* Main registration / brief */}
          <section className="card animate-rise relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-12 -left-10 h-40 w-40 rounded-full bg-[#f7e3e9] opacity-70 blur-2xl" />
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="chip chip-rose">
                  <Icon name="flower" size={13} />
                  اختبار رسمي
                </span>
                <span className="chip chip-lavender">الفصل الدراسي الأول</span>
                <span className="chip chip-peach">وزن الاختبار: ١٠٠ درجة</span>
              </div>

              <p className="mb-1 text-sm font-semibold text-[#a27586]">بسم الله الرحمن الرحيم</p>
              <h1 className="font-display text-[2rem] leading-[1.45] font-bold text-[#6c3249] sm:text-[2.5rem]">
                {EXAM_META.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[15px] font-bold text-[#96707e]">
                <span className="h-px w-8 bg-[#d9b6c1]" />
                {EXAM_META.subtitle}
              </div>
              <p className="mt-4 max-w-xl text-[15px] leading-8 text-[#6d5b61]">
                أهلًا بك يا {name.trim() ? name.trim().split(" ")[0] : "صديقتنا"} في حديقة المعرفة. اختبارٌ هادئ
                ومنظّم يقيس مهاراتك في قواعد اللغة والإملاء من دروس: السمكة الذهبية، وبالرأي والرأي الآخر، ولغتي،
                ومخترع من بلادي، والذكاء الاصطناعي.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { value: "٣٠", label: "سؤالًا رئيسًا" },
                  { value: "١٠٠", label: "درجة كاملة" },
                  { value: "٥", label: "دروس مقررة" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#f0dfdc] bg-white/70 px-3 py-2.5 text-center"
                  >
                    <div className="font-display text-2xl font-bold text-[#a14f6e]">{item.value}</div>
                    <div className="text-[11px] font-semibold text-[#937f84]">{item.label}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={submit} className="mt-6" noValidate>
                <label htmlFor="student-name" className="field-label">
                  الاسم الكامل للطالبة <span className="text-[#b45c7e]">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[#be97a5]">
                    <Icon name="pen" size={18} />
                  </span>
                  <input
                    id="student-name"
                    name="studentName"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="اكتبي اسمك الثلاثي هنا"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "name-error" : "name-help"}
                    className="text-field pr-11"
                    maxLength={80}
                  />
                </div>
                {error ? (
                  <p id="name-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#b0415d]">
                    <Icon name="alert" size={14} /> {error}
                  </p>
                ) : (
                  <p id="name-help" className="mt-2 text-[11px] text-[#a08f94]">
                    الاسم إلزامي، ويُدرج في تقرير النتيجة النهائي.
                  </p>
                )}

                <button type="submit" className="btn btn-primary mt-5 w-full py-3.5 text-base">
                  ابدئي الاختبار
                  <Icon name="arrow-left" size={18} />
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#a08f94]">
                  <Icon name="timer" size={13} />
                  لا يبدأ المؤقّت إلا بعد الضغط على الزر أعلاه.
                </p>
              </form>
            </div>
          </section>

          {/* Visual + rules */}
          <aside className="flex flex-col gap-4">
            <div className="card relative overflow-hidden p-0">
              <div className="relative h-56 sm:h-64">
                <div className="h-full w-full bg-gradient-to-br from-[#f7d9e4] via-[#e9def7] to-[#fdebd7]" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5d3042]/55 via-[#5d3042]/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-bold opacity-90">
                    <Icon name="leaf" size={13} /> زهرة المعرفة
                  </div>
                  <p className="font-display text-xl leading-8 text-white drop-shadow-sm">
                    «اللغةُ العربيةُ حديقةٌ... مَن سقاها بالعلمِ أثمرتْ»
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-[#8f7b81]">
                  <FloralMark size={28} />
                  <span>ثلاثون سؤالًا... وطريقٌ واحد نحو الإتقان.</span>
                </div>
                <span className="chip chip-mint">
                  <Icon name="shield" size={12} /> محليّ وآمن
                </span>
              </div>
            </div>

            <div className="card-soft flex-1 p-4 sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#6f4053]">
                <Icon name="clipboard" size={17} className="text-[#b45c7e]" />
                قبل أن تبدئي
              </h2>
              <ul className="space-y-2.5">
                {RULES.map((rule) => (
                  <li key={rule.title} className="flex gap-2.5 rounded-xl bg-white/55 px-2.5 py-2">
                    <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#f7e8ec] text-[#a55271]">
                      <Icon name={rule.icon} size={14} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-bold text-[#64444f]">{rule.title}</p>
                      <p className="text-[11.5px] leading-6 text-[#8b777c]">{rule.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <footer className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[#eedfda] pt-5 text-center sm:flex-row sm:text-right">
          <p className="flex items-center gap-1.5 text-[11px] text-[#9d8b90]">
            <Icon name="lock" size={13} />
            إشعار الخصوصية: تُحفظ إجاباتك في هذا المتصفح، وعند التسليم تُرسل نسخة من الاسم والنتيجة والإجابات إلى المعلّمة عبر Google Sheets؛ وإن فشل الاتصال تُحفظ النتيجة معلّقة في المتصفح وتُعاد تلقائيًا.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[#9d8b90]">
            <span>{EXAM_META.subtitle}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

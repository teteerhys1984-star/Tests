import { CONTACT, TOTAL_MARKS, TOTAL_PARTS, QUESTIONS } from "../exam/data";
import { BrandBar, ContactBar, CheckIcon } from "./Layout";
import {
  AppleMark,
  CornerBloom,
  FloralDivider,
  MirrorCrest,
  TinySparkle,
} from "./Ornaments";

interface WelcomeProps {
  studentName: string;
  onStudentNameChange: (value: string) => void;
  onStart: () => void;
  nameError: string;
  storageWarning: string | null;
}

const facts = [
  { value: "30", label: "سؤالاً رئيسياً" },
  { value: String(TOTAL_MARKS), label: "الدرجة الكلية" },
  { value: String(TOTAL_PARTS), label: "جزءاً مستقلاً" },
  { value: "6", label: "محاور دراسية" },
];

const scope = [
  "الأعداد الطبيعية حتى المليار",
  "التقريب والترتيب والمقارنة",
  "المستقيمات والتعامد والتوازي",
  "الزوايا والمثلثات وتصنيفها",
  "الجمع والطرح والضرب والقسمة",
  "القوى والمربعات والمكعبات",
];

const instructions = [
  "أدخل اسم الطالب، فهو مطلوب لبدء الاختبار ولتقرير النتيجة.",
  "الإجابة عن جميع الأجزاء إلزامية؛ لا يُتاح التسليم قبل اكتمالها.",
  "يمكن التنقل بين الأسئلة وتعديل الإجابات بحرية قبل التسليم.",
  "لا تظهر الإجابات الصحيحة أو التغذية الراجعة قبل التسليم النهائي.",
  "يبدأ العدّاد التصاعدي عند ظهور السؤال الأول ويستمر حتى التسليم.",
  "تُحفظ الإجابات تلقائياً على هذا الجهاز، ويُستأنف الاختبار عند إعادة فتح الصفحة.",
];

export function Welcome({
  studentName,
  onStudentNameChange,
  onStart,
  nameError,
  storageWarning,
}: WelcomeProps) {
  const canStart = studentName.trim().length > 0;

  return (
    <div className="min-h-screen">
      <ContactBar />
      <BrandBar
        rightSlot={
          <span className="chip chip-gold hidden sm:inline-flex">
            <TinySparkle className="h-3.5 w-3.5" />
            تقييم رسمي
          </span>
        }
      />

      <main className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-4 pt-8 sm:pt-12">
        <CornerBloom className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 opacity-60 sm:h-72 sm:w-72" />
        <CornerBloom className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rotate-180 opacity-50" />

        <div className="relative grid items-stretch gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <section className="surface relative overflow-hidden p-5 sm:p-8 lg:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#e9cfda] via-[#c1a05e] to-[#d8d0e9]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">اختبار شامل · الرياضيات</p>
                <h1 className="display-title mt-2 text-4xl font-bold leading-[1.25] text-[#432536] sm:text-5xl">
                  ميا والرياضيات
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#8a5d70] sm:text-base">
                  الصف السادس الأساسي · مادة الرياضيات
                </p>
              </div>
              <div className="hidden shrink-0 flex-col items-center rounded-2xl border border-[#ead7df] bg-[#fffaf7] px-3 py-2 sm:flex">
                <AppleMark size={38} />
                <span className="mt-1 text-[0.62rem] font-bold text-[#8b5d6f]">ميا</span>
              </div>
            </div>

            <FloralDivider className="mt-4 max-w-sm opacity-90" />

            <p className="arabic-copy mt-4 max-w-2xl text-[0.93rem] sm:text-[0.98rem]">
              أهلاً بك في اختبار <strong>ميا والرياضيات</strong>. صُمّم هذا الاختبار
              لقياس فهمك للمفاهيم والمهارات المقررة في كتاب الرياضيات للصف السادس
              الأساسي، من خلال أسئلة متنوعة تشمل الحساب والهندسة والزوايا والمثلثات
              والقوى وحل المسائل.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-[#ecdfe5] bg-[#fffbf9] px-2 py-3 text-center"
                >
                  <p className="num text-2xl font-extrabold text-[#80405a]">
                    {fact.value}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] font-semibold text-[#826774]">
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>

            <form
              className="mt-6"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                onStart();
              }}
            >
              <div className="rounded-2xl border border-[#e7d3dc] bg-gradient-to-br from-[#fdf3f7] to-[#fbf8fd] p-4 sm:p-5">
                <label
                  htmlFor="student-name"
                  className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#5c3547]"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-[#95526b] shadow-sm">
                    1
                  </span>
                  اسم الطالب <span className="text-[#a24d67]">(إلزامي)</span>
                </label>
                <input
                  id="student-name"
                  name="studentName"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={studentName}
                  onChange={(event) => onStudentNameChange(event.target.value)}
                  placeholder="اكتب اسمك الكامل هنا"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "name-error" : "name-help"}
                  className="input-field"
                />
                {nameError ? (
                  <p id="name-error" role="alert" className="mt-1.5 text-xs font-bold text-[#a13552]">
                    {nameError}
                  </p>
                ) : (
                  <p id="name-help" className="mt-1.5 text-[0.72rem] text-[#8b7380]">
                    سيظهر هذا الاسم في تقرير النتيجة. لا يبدأ الاختبار قبل إدخاله.
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    className="btn btn-primary w-full sm:w-auto sm:min-w-[210px]"
                    disabled={!canStart}
                  >
                    <TinySparkle className="h-4 w-4" />
                    ابدأ الاختبار
                  </button>
                  <p className="text-[0.72rem] leading-6 text-[#846b78]">
                    بالضغط على الزر تُنشأ محاولة واحدة ويبدأ العدّاد التصاعدي.
                  </p>
                </div>
              </div>
            </form>

            {storageWarning ? (
              <div className="warning-box mt-4" role="status">
                <strong>تنبيه بشأن الحفظ:</strong> {storageWarning}
              </div>
            ) : (
              <p className="mt-3 text-[0.72rem] text-[#8a7480]">
                الحفظ التلقائي محلي على هذا المتصفح، وتُرسَل نتيجتك إلى معلّمك عند التسليم.
              </p>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <div className="surface relative overflow-hidden p-5 sm:p-6">
              <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#efe4f4] blur-2xl" />
              <div className="flex justify-center">
                <MirrorCrest className="h-44 w-auto sm:h-52" />
              </div>
              <div className="mt-2 text-center">
                <h2 className="display-title text-xl font-bold text-[#4d2b3e]">
                  مرآة ميا: استعدّي للاختبار
                </h2>
                <p className="mt-1 text-[0.78rem] leading-6 text-[#806672]">
                  قراءة متأنية، خطوات مرتبة، وثقة هادئة.
                </p>
              </div>
              <FloralDivider className="my-3 opacity-80" />
              <p className="eyebrow mb-2">محاور الاختبار</p>
              <div className="flex flex-wrap gap-1.5">
                {scope.map((item, index) => (
                  <span
                    key={item}
                    className={`chip ${index % 3 === 0 ? "chip-rose" : index % 3 === 1 ? "chip-lavender" : "chip-sky"}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#eadde5] bg-[#fffbf9] px-3 py-2.5">
                <div className="flex items-center justify-between text-[0.76rem]">
                  <span className="font-semibold text-[#70505f]">عدد الأسئلة</span>
                  <span className="num font-extrabold text-[#8b4059]">{QUESTIONS.length}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[0.76rem]">
                  <span className="font-semibold text-[#70505f]">الأجزاء المستقلة</span>
                  <span className="num font-extrabold text-[#8b4059]">{TOTAL_PARTS}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[0.76rem]">
                  <span className="font-semibold text-[#70505f]">الدرجة الكلية</span>
                  <span className="num font-extrabold text-[#8b4059]">{TOTAL_MARKS}</span>
                </div>
              </div>
            </div>

            <div className="surface-soft p-5">
              <p className="eyebrow mb-3">تعليمات الاختبار</p>
              <ul className="space-y-2.5">
                {instructions.map((item, index) => (
                  <li key={item} className="flex items-start gap-2 text-[0.79rem] leading-6 text-[#5d4652]">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f6eaf0] text-[#9b5269]">
                      {index === 3 ? <LockMini /> : <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-[#eadde4] bg-[rgba(255,251,248,0.8)] px-4 py-3 text-center">
          <span className="text-[0.8rem] font-bold text-[#664453]">للاستفسار والدعم</span>
          <span className="divider-dots hidden sm:inline">•••</span>
          <span className="text-[0.8rem] text-[#6e5563]">{CONTACT.name}</span>
          <a href="tel:0930215022" className="num rounded-lg bg-[#f8edf2] px-2.5 py-1 text-sm font-extrabold text-[#8b4059]" dir="ltr">
            0930215022
          </a>
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#50765a] hover:text-[#36593f]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2a9.9 9.9 0 0 0-8.52 14.96L2 22l5.18-1.47A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.9 12.35 8.1 8.1 0 0 1-10.9 2.7l-.35-.2-3.05.86.88-2.97-.22-.36A8.1 8.1 0 0 1 12.04 3.8Z" />
            </svg>
            واتساب
          </a>
        </div>
      </main>
    </div>
  );
}

function LockMini() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

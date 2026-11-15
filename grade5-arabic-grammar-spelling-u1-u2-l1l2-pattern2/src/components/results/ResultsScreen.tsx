import { useMemo, useState } from "react";
import type { ExamResult } from "../../types/exam";
import { EXAM_META } from "../../data/sources/lessons";
import { downloadTxtReport, reportFileName } from "../../utils/report";
import { formatArabicDuration, formatDateTime, formatStopwatch, toArabicDigits } from "../../utils/arabic";
import { Logo } from "../common/Logo";
import { Icon } from "../common/Icon";
import { SoundToggle } from "../common/SoundToggle";
import { ReviewList } from "./ReviewList";

interface ResultsScreenProps {
  result: ExamResult;
  sendStatus?: "idle" | "sending" | "success" | "failed";
  onResend?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestart: () => void;
  onOpenTeacher: () => void;
}

const TONE_STYLES: Record<ExamResult["performance"]["tone"], { chip: string; text: string; soft: string }> = {
  excellent: { chip: "chip-mint", text: "text-[#3f7558]", soft: "bg-[#f2faf5] border-[#d9ecdf]" },
  good: { chip: "chip-lavender", text: "text-[#5a4a88]", soft: "bg-[#f6f3fc] border-[#e4dcf2]" },
  fair: { chip: "chip-peach", text: "text-[#905a3d]", soft: "bg-[#fdf7f1] border-[#f0e0d2]" },
  support: { chip: "chip-rose", text: "text-[#8d435d]", soft: "bg-[#fdf3f5] border-[#f0d7de]" },
};

export function ResultsScreen({
  result, sendStatus = "idle", onResend,
  soundEnabled,
  onToggleSound,
  onRestart,
  onOpenTeacher,
}: ResultsScreenProps) {
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const tone = TONE_STYLES[result.performance.tone];
  const filename = useMemo(() => reportFileName(result.attempt.studentName), [result.attempt.studentName]);

  const skillGaps = useMemo(() => {
    const map = new Map<string, { earned: number; max: number; lessons: Set<string>; section: string }>();
    for (const question of result.questions) {
      for (const sub of question.subparts) {
        const prev = map.get(sub.source.skill) ?? {
          earned: 0,
          max: 0,
          lessons: new Set<string>(),
          section: sub.source.section === "grammar" ? "قواعد اللغة" : "الإملاء",
        };
        prev.earned += sub.marksEarned;
        prev.max += sub.marksMax;
        prev.lessons.add(question.lessonTitle);
        map.set(sub.source.skill, prev);
      }
    }
    return [...map.entries()]
      .map(([skill, value]) => ({
        skill,
        ...value,
        percentage: value.max ? Math.round((value.earned / value.max) * 100) : 0,
      }))
      .filter((skill) => skill.percentage < 80)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 8);
  }, [result.questions]);

  const handleDownload = () => {
    try {
      downloadTxtReport(result);
      setDownloadNote("تم إنشاء التقرير وتنزيله بنجاح على جهازك.");
    } catch {
      setDownloadNote("تعذّر التنزيل تلقائيًّا؛ يرجى السماح بتنزيل الملفات ثم المحاولة مجددًا.");
    }
  };

  return (
    <div className="app-shell relative z-10">
      <header className="glass-bar">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-3">
          <Logo compact />
          <div className="flex items-center gap-2">
            <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
            <button type="button" onClick={handleDownload} className="btn btn-primary px-3.5 py-2 text-[11.5px]">
              <Icon name="download" size={15} />
              تحميل التقرير TXT
            </button>
            <button type="button" onClick={onOpenTeacher} className="btn btn-outline px-3.5 py-2 text-[11.5px]">
              <Icon name="lock" size={14} />
              مفتاح الإجابات
            </button>
            {onResend && (<button type="button" onClick={onResend} disabled={sendStatus === "sending"} className="btn btn-outline px-3.5 py-2 text-[11.5px]">إعادة إرسال النتيجة</button>)}
          </div>
        </div>
        {onResend && (<p role="status" className="page-container pb-2 text-center text-[11.5px]">{sendStatus === "sending" ? "جارٍ إرسال النتيجة…" : sendStatus === "success" ? "تم إرسال النتيجة إلى المعلّمة." : sendStatus === "failed" ? "تعذّر إرسال النتيجة؛ ستُحفظ معلّقة وتُعاد تلقائيًا، ويمكنك إعادة المحاولة بالزر أعلاه. نتيجتك وتقريرك متاحان الآن." : ""}</p>)}
      </header>

      <main className="page-container py-6">
        {/* Result hero */}
        <section className="card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-56 opacity-35 md:block" aria-hidden="true"><div className="h-full w-full bg-gradient-to-l from-[#f7e3e9] via-[#fdf4f6]/60 to-transparent" /></div>

          <div className="relative grid gap-5 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="mx-auto md:mx-0">
              <div
                className="score-ring"
                style={{ "--pct": Math.min(100, Math.max(0, result.percentage)) } as React.CSSProperties}
                role="img"
                aria-label={`الدرجة ${toArabicDigits(result.totalEarned)} من ${toArabicDigits(result.totalMax)}`}
              >
                <div className="text-center">
                  <p className="font-display text-4xl font-bold leading-none text-[#7d3b55]">
                    {toArabicDigits(result.totalEarned)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#a1848f]">من {toArabicDigits(result.totalMax)}</p>
                  <p className="mt-1 rounded-full bg-[#fbf0f3] px-2 py-0.5 text-[10px] font-bold text-[#a34f6d]">
                    {toArabicDigits(result.percentage)}٪
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${tone.chip}`}>
                  <Icon name="award" size={13} />
                  المستوى: {result.performance.label}
                </span>
                <span className="chip chip-muted">
                  <Icon name="flower" size={12} /> تم التسليم
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold leading-relaxed text-[#653448] sm:text-[1.8rem]">
                {EXAM_META.title}
              </h1>
              <p className="text-[13px] font-semibold text-[#9b7784]">{EXAM_META.subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[#725b63]">
                <span className="flex items-center gap-1.5">
                  <Icon name="pen" size={14} className="text-[#b06a84]" />
                  الطالبة: <strong className="text-[#603a49]">{result.attempt.studentName}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="timer" size={14} className="text-[#b06a84]" />
                  الزمن المستغرق: {formatArabicDuration(result.timeSeconds)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="clipboard" size={14} className="text-[#b06a84]" />
                  {result.attempt.submittedAt ? formatDateTime(result.attempt.submittedAt) : "—"}
                </span>
              </div>
              <div className={`mt-3 rounded-xl border px-3 py-2 text-[12px] leading-6 ${tone.soft}`}>
                <span className={`font-bold ${tone.text}`}>{result.performance.label}: </span>
                {result.performance.description}
              </div>
            </div>
          </div>
        </section>

        {/* At-a-glance */}
        <section className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="ملخص الدرجات">
          {[
            {
              icon: "check" as const,
              label: "فروع صحيحة",
              value: `${toArabicDigits(result.correctCount)} / ${toArabicDigits(result.subpartCount)}`,
              color: "text-[#4c8060] bg-[#eff8f2]",
            },
            {
              icon: "close" as const,
              label: "فروع خاطئة",
              value: toArabicDigits(result.incorrectCount),
              color: "text-[#a85058] bg-[#fdf1f0]",
            },
            {
              icon: "alert" as const,
              label: "فروع غير مجابة",
              value: toArabicDigits(result.unansweredCount),
              color: "text-[#907d7a] bg-[#f8f2ee]",
            },
            {
              icon: "timer" as const,
              label: "الوقت المستغرق",
              value: formatStopwatch(result.timeSeconds),
              color: "text-[#6b5a92] bg-[#f4f1fb]",
            },
          ].map((item) => (
            <div key={item.label} className="card-soft flex items-center gap-2.5 px-3 py-3">
              <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${item.color}`}>
                <Icon name={item.icon} size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] font-semibold text-[#9a858c]">{item.label}</p>
                <p className="text-[15px] font-bold text-[#5d414b]">{item.value}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          {/* Lesson breakdown */}
          <section className="card print-full overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e1dd] bg-gradient-to-l from-[#fdf4f6] to-[#fffaf6] px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#61384a]">
                <Icon name="book" size={17} className="text-[#b45c7e]" />
                التحليل حسب الدروس
              </h2>
              <div className="flex gap-1.5">
                <span className="chip chip-mint">قواعد {toArabicDigits(result.grammar.earned)}/{toArabicDigits(result.grammar.max)}</span>
                <span className="chip chip-lavender">إملاء {toArabicDigits(result.spelling.earned)}/{toArabicDigits(result.spelling.max)}</span>
              </div>
            </div>
            <div className="overflow-x-auto px-3 pb-3 pt-2 thin-scroll">
              <table className="breakdown-table min-w-[440px]">
                <thead>
                  <tr>
                    <th scope="col" className="text-right">الدرس</th>
                    <th scope="col">قواعد اللغة</th>
                    <th scope="col">الإملاء</th>
                    <th scope="col">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lessons.map((lesson) => (
                    <tr key={lesson.lessonId}>
                      <td className="text-right">
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f8ecef] text-[10px] font-bold text-[#a25770]">
                            {toArabicDigits(lesson.order)}
                          </span>
                          <span className="text-[12px] font-semibold text-[#5d434d]">{lesson.title}</span>
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-[#476b58]">
                          {toArabicDigits(lesson.grammar.earned)}/{toArabicDigits(lesson.grammar.max)}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-[#6a578f]">
                          {toArabicDigits(lesson.spelling.earned)}/{toArabicDigits(lesson.spelling.max)}
                        </span>
                      </td>
                      <td>
                        <span className="rounded-full bg-[#faf0f2] px-2.5 py-1 text-[11.5px] font-bold text-[#8c405a]">
                          {toArabicDigits(lesson.earned)}/{toArabicDigits(lesson.max)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#f2e5e1] px-4 py-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "الدرجة العامة في قواعد اللغة", band: result.grammar, color: "#b45c7e" },
                  { label: "الدرجة العامة في الإملاء", band: result.spelling, color: "#8b7db8" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#f0e3df] bg-white/65 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10.5px] font-semibold text-[#8e767d]">{item.label}</span>
                      <span className="text-[12px] font-bold text-[#60414f]">
                        {toArabicDigits(item.band.earned)}/{toArabicDigits(item.band.max)}
                      </span>
                    </div>
                    <div className="progress-track mt-1.5 h-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.band.percentage}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Performance guidance */}
          <aside className="space-y-3">
            <section className="card-soft p-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#60414f]">
                <Icon name="sparkle" size={15} className="text-[#b45c7e]" />
                نقاط القوة
              </h2>
              {result.strengths.length > 0 ? (
                <ul className="space-y-1.5">
                  {result.strengths.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[11.5px] leading-6 text-[#56705f]">
                      <Icon name="check" size={12} className="mt-1.5 flex-none text-[#5f9675]" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11.5px] leading-6 text-[#9b888e]">
                  لم تبلغ أي مهارة نسبة ٨٠٪ في هذه المحاولة؛ راجعي القواعد والأمثلة ثم أعيدي المحاولة.
                </p>
              )}
            </section>

            <section className="card-soft p-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#60414f]">
                <Icon name="leaf" size={15} className="text-[#b45c7e]" />
                مهارات تحتاج إلى مراجعة
              </h2>
              {skillGaps.length > 0 ? (
                <ul className="space-y-2">
                  {skillGaps.map((skill) => (
                    <li key={skill.skill} className="rounded-lg bg-white/70 px-2.5 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-semibold leading-5 text-[#7c5260]">{skill.skill}</p>
                        <span className="flex-none text-[10.5px] font-bold text-[#a05a72]">
                          {toArabicDigits(skill.earned)}/{toArabicDigits(skill.max)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9.5px] text-[#a18c92]">
                        {skill.section} · {[...skill.lessons].join("، ")}
                      </p>
                      <div className="progress-track mt-1 h-1.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-[#c47f92] to-[#9a7ab8]"
                          style={{ width: `${skill.percentage}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11.5px] leading-6 text-[#5d816a]">ممتاز! لا توجد مهارة دون المستوى المستهدف.</p>
              )}
              <p className="mt-2 rounded-lg bg-[#fbf5f1] px-2.5 py-2 text-[10.5px] leading-6 text-[#96828a]">
                كل صفّ يمثّل مهارة داخل الدروس المقررة؛ راجعي التفسير والمرجع الداخلي في المراجعة التفصيلية أدناه.
              </p>
            </section>

            <section className="card-soft p-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#60414f]">
                <Icon name="download" size={15} className="text-[#b45c7e]" />
                التقرير والمحاولة
              </h2>
              <button type="button" onClick={handleDownload} className="btn btn-primary w-full py-2.5 text-[12px]">
                <Icon name="download" size={15} />
                تحميل التقرير TXT
              </button>
              <p className="mt-1.5 truncate text-center text-[9.5px] text-[#a89298]" dir="ltr" title={filename}>
                {filename}
              </p>
              {downloadNote ? (
                <p className="mt-1.5 rounded-lg bg-[#f2f9f4] px-2 py-1.5 text-[10.5px] leading-5 text-[#4e7d64]">
                  {downloadNote}
                </p>
              ) : (
                <p className="mt-1.5 text-[10px] leading-5 text-[#a08b91]">
                  يُولَّد التقرير تلقائيًّا بعد التسليم، ويمكنك تحميل نسخة احتياطية الآن.
                </p>
              )}
              <div className="soft-divider my-2.5" />
              <button type="button" onClick={onRestart} className="btn btn-outline w-full py-2.5 text-[12px]">
                <Icon name="restart" size={15} />
                إعادة الاختبار
              </button>
              <p className="mt-1.5 text-center text-[10px] leading-5 text-[#a08b91]">
                تبدأ محاولة جديدة فارغة، مع طلب الاسم من جديد.
              </p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[9.5px] text-[#ad999f]">
                <Icon name="shield" size={11} />
                معرف المحاولة: <span dir="ltr">{result.attempt.id.slice(0, 8)}</span>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-4">
          <ReviewList result={result} />
        </div>

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#eedfda] py-4 text-center sm:flex-row sm:text-right">
          <p className="flex items-center gap-1.5 text-[11px] text-[#9d8b90]">
            <Icon name="flower" size={13} />
            زهرة المعرفة — نُصحّح لنرتقي، ونقرأ لنُزهر.
          </p>
          <p className="flex items-center gap-1.5 text-[10.5px] text-[#a69298]">
            <Icon name="lock" size={11} />
            جميع بيانات الطالبة والتقرير بقيت داخل هذا المتصفح.
          </p>
        </footer>
      </main>
    </div>
  );
}

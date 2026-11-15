import { useMemo, useState } from "react";
import type { Difficulty, LessonId, SectionId } from "../../types/exam";
import { DIFFICULTY_LABELS, EXAM_META, LESSONS_BY_ID, ORDERED_LESSONS } from "../../data/sources/lessons";
import {
  ANSWER_KEY,
  DIFFICULTY_DISTRIBUTION,
  KEY_STATS,
  LESSON_MARK_TABLE,
  MARKING_RUBRIC,
  SOURCE_INTEGRITY_NOTES,
} from "../../data/answers/answerKey";
import { toArabicDigits } from "../../utils/arabic";
import { Icon } from "../common/Icon";
import { Logo } from "../common/Logo";
import { SourceReference } from "../common/SourceReference";

interface TeacherKeyProps {
  onClose: () => void;
  onLock: () => void;
}

export function TeacherKey({ onClose, onLock }: TeacherKeyProps) {
  const [lessonFilter, setLessonFilter] = useState<LessonId | "all">("all");
  const [sectionFilter, setSectionFilter] = useState<SectionId | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");

  const entries = useMemo(
    () =>
      ANSWER_KEY.filter(
        (entry) =>
          (lessonFilter === "all" || entry.question.lessonId === lessonFilter) &&
          (sectionFilter === "all" || entry.question.section === sectionFilter) &&
          (difficultyFilter === "all" || entry.question.difficulty === difficultyFilter),
      ),
    [lessonFilter, sectionFilter, difficultyFilter],
  );

  return (
    <div className="app-shell relative z-10">
      <header className="glass-bar no-print">
        <div className="page-container flex flex-wrap items-center justify-between gap-2 py-3">
          <Logo compact />
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-rose">
              <Icon name="lock" size={12} /> منطقة المعلمة
            </span>
            <button type="button" onClick={() => window.print()} className="btn btn-soft px-3.5 py-2 text-[11.5px]">
              <Icon name="print" size={14} />
              طباعة المفتاح
            </button>
            <button type="button" onClick={onLock} className="btn btn-outline px-3.5 py-2 text-[11.5px]">
              <Icon name="lock" size={14} />
              قفل الدليل
            </button>
            <button type="button" onClick={onClose} className="btn btn-primary px-3.5 py-2 text-[11.5px]">
              <Icon name="arrow-right" size={14} />
              العودة للنتائج
            </button>
          </div>
        </div>
      </header>

      <main className="page-container py-6">
        <section className="card print-full relative overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-[#f2e5f1] opacity-80 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="chip chip-lavender">
                <Icon name="book" size={12} /> مفتاح إجابات معتمد
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold text-[#643448] sm:text-3xl">{EXAM_META.title}</h1>
              <p className="mt-1 text-[13px] font-semibold text-[#9b7784]">{EXAM_META.subtitle}</p>
              <p className="mt-2 max-w-2xl text-[12px] leading-7 text-[#7d6870]">
                خمسة دروس في قواعد اللغة والإملاء فقط. الأسئلة الثلاثون الموزّعة على الاختبار مكتوبة بصياغة جديدة
                وتستند إلى قواعد الدرس وأمثلته، مع الإبقاء على المراجع الداخلية المستقاة من المستودع.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: "سؤالًا رئيسًا", value: toArabicDigits(KEY_STATS.questions) },
                { label: "فرعًا مقوَّمًا", value: toArabicDigits(KEY_STATS.subparts) },
                { label: "قواعد اللغة", value: `${toArabicDigits(KEY_STATS.grammarMarks)} درجة` },
                { label: "الإملاء", value: `${toArabicDigits(KEY_STATS.spellingMarks)} درجة` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#eee0dd] bg-[#fffaf7] px-3 py-2">
                  <p className="text-base font-bold text-[#7d3b55]">{item.value}</p>
                  <p className="text-[10px] font-semibold text-[#9c858d]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section className="card print-full overflow-hidden">
            <div className="border-b border-[#f0e1dd] bg-[#fdf6f7] px-4 py-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#61384a]">
                <Icon name="award" size={17} className="text-[#b45c7e]" />
                توزيع الدرجات على الدروس
              </h2>
            </div>
            <div className="overflow-x-auto p-3 thin-scroll">
              <table className="breakdown-table min-w-[520px]">
                <thead>
                  <tr>
                    <th className="text-right">الدرس</th>
                    <th>الصفحات</th>
                    <th>قواعد</th>
                    <th>إملاء</th>
                    <th>المجموع</th>
                    <th>أرقام الأسئلة</th>
                  </tr>
                </thead>
                <tbody>
                  {LESSON_MARK_TABLE.map((lesson) => (
                    <tr key={lesson.lessonId}>
                      <td className="text-right text-[11.5px] font-semibold text-[#5d434d]">{lesson.title}</td>
                      <td className="text-[11px]">{lesson.pages}</td>
                      <td>{toArabicDigits(lesson.grammar)}</td>
                      <td>{toArabicDigits(lesson.spelling)}</td>
                      <td className="font-bold text-[#8b4059]">{toArabicDigits(lesson.total)}</td>
                      <td className="text-[10.5px]" dir="ltr">
                        {lesson.questionNumbers.join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#f1e4e0] px-4 py-2.5 text-[11px] font-semibold text-[#7c6470]">
              مجموع الاختبار: {toArabicDigits(KEY_STATS.marks)} درجة. لكل درس ٢٠ درجة موزّعة ١٠ + ١٠ بين القسمين.
            </div>
          </section>

          <section className="card-soft p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#60414f]">
              <Icon name="list" size={15} className="text-[#b45c7e]" />
              توزيع مستويات الصعوبة
            </h2>
            <div className="space-y-2">
              {DIFFICULTY_DISTRIBUTION.map((item) => (
                <div key={item.level} className="rounded-lg bg-white/70 px-2.5 py-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#6b4b56]">
                    <span>{item.label}</span>
                    <span>{toArabicDigits(item.count)} أسئلة · {toArabicDigits(item.percentage)}٪ · {toArabicDigits(item.marks)} درجة</span>
                  </div>
                  <div className="progress-track mt-1 h-1.5">
                    <div className="progress-fill" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-5 text-[#9c888e]">
              الأسئلة المتقدمة تقيس التطبيق والتمييز والتعليل داخل نطاق الدروس المقررة، لا خارجها.
            </p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="card print-full p-4">
            <h2 className="mb-2 flex items-center gap-1.5 font-display text-lg font-bold text-[#61384a]">
              <Icon name="clipboard" size={17} className="text-[#b45c7e]" />
              روبرِك التصحيح
            </h2>
            <ol className="space-y-1.5">
              {MARKING_RUBRIC.map((rule, index) => (
                <li key={rule} className="flex gap-2 text-[11.5px] leading-6 text-[#6a555d]">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#f7e9ed] text-[10px] font-bold text-[#a15470]">
                    {toArabicDigits(index + 1)}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </section>

          <section className="card print-full p-4">
            <h2 className="mb-2 flex items-center gap-1.5 font-display text-lg font-bold text-[#61384a]">
              <Icon name="shield" size={17} className="text-[#b45c7e]" />
              نزاهة المصدر والحدود
            </h2>
            <ul className="space-y-1.5">
              {SOURCE_INTEGRITY_NOTES.map((note) => (
                <li key={note} className="flex gap-2 text-[11.5px] leading-6 text-[#6a555d]">
                  <Icon name="leaf" size={13} className="mt-1 flex-none text-[#7e9b80]" />
                  {note}
                </li>
              ))}
            </ul>
            <p className="mt-2 rounded-lg bg-[#fbf5f1] px-2.5 py-2 text-[10.5px] leading-6 text-[#96828a]">
              المصادر: سجل المنهاج، ملفات محتوى الدروس الخمسة، وتدقيقات المصدر، وأقفال المصادر في المستودع
              <span className="mx-1 font-mono text-[9.5px]" dir="ltr">
                teteerhys1984-star/Interactive-arabic-grade5
              </span>
              . لم تُخترع مراجع صفحات خارج ما وثّقه المستودع.
            </p>
          </section>
        </div>

        {/* Filters */}
        <section className="card-soft no-print mt-4 flex flex-wrap items-end gap-3 p-3.5">
          <div>
            <label htmlFor="filter-lesson" className="mb-1 block text-[10.5px] font-bold text-[#8a6d77]">تصفية بالدرس</label>
            <select
              id="filter-lesson"
              value={lessonFilter}
              onChange={(event) => setLessonFilter(event.target.value as LessonId | "all")}
              className="text-field min-w-[160px] py-1.5 text-[11.5px]"
            >
              <option value="all">كل الدروس</option>
              {ORDERED_LESSONS.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-section" className="mb-1 block text-[10.5px] font-bold text-[#8a6d77]">تصفية بالقسم</label>
            <select
              id="filter-section"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value as SectionId | "all")}
              className="text-field min-w-[130px] py-1.5 text-[11.5px]"
            >
              <option value="all">القسمان</option>
              <option value="grammar">قواعد اللغة</option>
              <option value="spelling">الإملاء</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-difficulty" className="mb-1 block text-[10.5px] font-bold text-[#8a6d77]">تصفية بالصعوبة</label>
            <select
              id="filter-difficulty"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as Difficulty | "all")}
              className="text-field min-w-[120px] py-1.5 text-[11.5px]"
            >
              <option value="all">كل المستويات</option>
              {(["basic", "intermediate", "advanced"] as Difficulty[]).map((level) => (
                <option key={level} value={level}>{DIFFICULTY_LABELS[level]}</option>
              ))}
            </select>
          </div>
          <p className="mr-auto rounded-full bg-[#f7e9ed] px-3 py-1 text-[11px] font-bold text-[#994b66]">
            {toArabicDigits(entries.length)} سؤالًا معروضًا
          </p>
        </section>

        <section className="mt-4 space-y-3" aria-label="مفتاح الإجابات التفصيلي">
          {entries.map(({ question, answerLines }) => {
            const lesson = LESSONS_BY_ID[question.lessonId];
            const total = answerLines.reduce((sum, part) => sum + part.marks, 0);
            return (
              <article key={question.id} className="card print-full overflow-hidden">
                <header className="border-b border-[#f2e5e1] bg-gradient-to-l from-[#fbf1f4] to-[#fffaf7] px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#f0d7df] bg-white text-[13px] font-bold text-[#a34e6d]">
                        {toArabicDigits(question.number)}
                      </span>
                      <div>
                        <p className="text-[13px] font-bold leading-6 text-[#5c3a47]">{question.prompt}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className="chip chip-rose text-[9.5px]">{lesson.title}</span>
                          <span className="chip chip-lavender text-[9.5px]">{question.typeLabel}</span>
                          <span className="chip chip-peach text-[9.5px]">{DIFFICULTY_LABELS[question.difficulty]}</span>
                          <span className="chip chip-muted text-[9.5px]">{toArabicDigits(total)} درجات</span>
                          <span className="chip chip-muted font-mono text-[9px]" dir="ltr">{question.lessonId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="max-w-[360px]">
                      <SourceReference
                        source={{
                          unit: lesson.unit,
                          lessonId: lesson.id,
                          lessonTitle: lesson.title,
                          page: question.page,
                          section: question.section,
                          skill: `القسم: ${question.section === "grammar" ? "قواعد اللغة" : "الإملاء"} — صفحة الدرس ${toArabicDigits(question.page)}`,
                        }}
                        compact
                      />
                    </div>
                  </div>
                </header>
                <div className="divide-y divide-[#f6eeeb]">
                  {answerLines.map((part) => (
                    <div key={`${question.id}-${part.label}`} className="grid gap-1.5 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div>
                        <p className="text-[11.5px] font-semibold leading-6 text-[#5f4a51]">
                          <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f7e9ed] text-[10px] font-bold text-[#a15470]">
                            {part.label}
                          </span>
                          {part.prompt}
                        </p>
                        <p className="mt-1 rounded-lg bg-[#f3faf5] px-2 py-1 text-[11px] font-bold text-[#3f7257]">
                          الإجابة الصحيحة: {part.answer}
                        </p>
                        <p className="mt-1 text-[10.5px] leading-5 text-[#7f6a71]">
                          <span className="font-bold text-[#8a6070]">التفسير: </span>{part.explanation}
                        </p>
                        {part.misconception ? (
                          <p className="mt-1 rounded-lg bg-[#fdf6f0] px-2 py-1 text-[10px] leading-5 text-[#96643f]">
                            <span className="font-bold">خطأ شائع: </span>{part.misconception}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[9.5px] text-[#a39096]">المهارة: {part.skill}</p>
                      </div>
                      <div className="text-left sm:text-center">
                        <span className="chip chip-rose text-[9.5px]">{toArabicDigits(part.marks)}</span>
                        <p className="mt-0.5 text-[9px] text-[#ad999f]">درجة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <footer className="mt-6 border-t border-[#eedfda] py-4 text-center text-[10.5px] text-[#a08d93]">
          دليل المعلمة — زهرة المعرفة · مفتاح إجابات داخلي لا يُعرض للطالبة قبل تسليم الاختبار.
        </footer>
      </main>
    </div>
  );
}

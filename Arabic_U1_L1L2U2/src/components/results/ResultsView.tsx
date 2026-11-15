import { correctAnswerText, studentAnswerText } from '../../data/answers/answerKey';
import { QUESTIONS, subKey } from '../../data/questions';
import { LESSONS, LESSON_ORDER, SECTION_LABEL } from '../../data/sources/lessons';
import type { Answers } from '../../data/types';
import { fmtMarks, toArabicDigits } from '../../utils/normalize';
import type { ExamResult, SubStatus } from '../../utils/scoring';
import { formatDateTimeAr, formatHMS } from '../../utils/time';
import { EXAM_TITLE } from '../../utils/report';
import { Butterfly, FloralDivider } from '../common/Decor';
import { IconCheck, IconDownload, IconLock, IconRefresh, IconX } from '../common/Icons';

interface Props {
  name: string;
  submittedAt: number;
  elapsedMs: number;
  answers: Answers;
  result: ExamResult;
  onDownload: () => void;
  onRestart: () => void;
  onTeacher: () => void;
}

const STATUS: Record<SubStatus, { label: string; cls: string }> = {
  correct: { label: 'صحيحة', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial: { label: 'صحيحة جزئيًّا', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  incorrect: { label: 'خاطئة', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  unanswered: { label: 'بلا إجابة', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function ResultsView({ name, submittedAt, elapsedMs, answers, result: r, onDownload, onRestart, onTeacher }: Props) {
  const weak = LESSON_ORDER.flatMap((l) => {
    const b = r.byLesson[l];
    const out: string[] = [];
    if (pctOf(b.grammar, b.grammarMax) < 70) out.push(`${LESSONS[l].title}: ${LESSONS[l].grammarTopic} (قواعد)`);
    if (pctOf(b.spelling, b.spellingMax) < 70) out.push(`${LESSONS[l].title}: ${LESSONS[l].spellingTopic} (إملاء)`);
    return out;
  });

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 py-8 fade-in">
      <section className="card p-6 sm:p-10 text-center relative overflow-hidden">
        <Butterfly className="absolute top-4 left-6 w-14 float-slow" />
        <p className="text-blush-600 font-bold">نتيجة الاختبار</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mt-1">{EXAM_TITLE}</h1>
        <p className="mt-3 text-lg">الطالبة: <strong>{name}</strong></p>
        <p className="text-sm text-lav-600">سُلِّم في: {formatDateTimeAr(submittedAt)}</p>
        <FloralDivider />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat label="الدرجة" value={`${fmtMarks(r.total)} / ${toArabicDigits(r.max)}`} big />
          <Stat label="النسبة المئوية" value={`${fmtMarks(r.percentage)}٪`} big />
          <Stat label="مستوى الأداء" value={r.level} />
          <Stat label="المدة المستغرقة" value={formatHMS(elapsedMs)} ltr />
          <Stat label="بنود صحيحة" value={toArabicDigits(r.correct)} />
          <Stat label="صحيحة جزئيًّا" value={toArabicDigits(r.partial)} />
          <Stat label="بنود خاطئة" value={toArabicDigits(r.incorrect)} />
          <Stat label="بلا إجابة" value={toArabicDigits(r.unanswered)} />
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-6 no-print">
          <button type="button" className="btn btn-primary" onClick={onDownload}><IconDownload /> تحميل التقرير TXT</button>
          <button type="button" className="btn btn-soft" onClick={onRestart}><IconRefresh /> إعادة الاختبار</button>
          <button type="button" className="btn btn-soft" onClick={onTeacher}><IconLock /> مفتاح الإجابة للمعلمة</button>
        </div>
      </section>

      <section className="card p-5 sm:p-8 mt-6">
        <h2 className="text-xl font-bold mb-4">التفصيل حسب الدرس</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-blush-50">
                <th className="p-3 border-b border-blush-100">الدرس</th>
                <th className="p-3 border-b border-blush-100">درجة القواعد</th>
                <th className="p-3 border-b border-blush-100">درجة الإملاء</th>
                <th className="p-3 border-b border-blush-100">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {LESSON_ORDER.map((l) => {
                const b = r.byLesson[l];
                return (
                  <tr key={l} className="odd:bg-white even:bg-lav-100/30">
                    <td className="p-3 border-b border-blush-100 font-bold">{LESSONS[l].title}</td>
                    <td className="p-3 border-b border-blush-100">{fmtMarks(b.grammar)} / {fmtMarks(b.grammarMax)}</td>
                    <td className="p-3 border-b border-blush-100">{fmtMarks(b.spelling)} / {fmtMarks(b.spellingMax)}</td>
                    <td className="p-3 border-b border-blush-100 font-bold">{fmtMarks(b.grammar + b.spelling)} / {fmtMarks(b.grammarMax + b.spellingMax)}</td>
                  </tr>
                );
              })}
              <tr className="bg-peach-100 font-bold">
                <td className="p-3">المجموع العام</td>
                <td className="p-3">{fmtMarks(r.bySection.grammar.earned)} / {fmtMarks(r.bySection.grammar.max)}</td>
                <td className="p-3">{fmtMarks(r.bySection.spelling.earned)} / {fmtMarks(r.bySection.spelling.max)}</td>
                <td className="p-3">{fmtMarks(r.total)} / {fmtMarks(r.max)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-2xl bg-lav-100/50 border border-lav-200 p-4">
          <h3 className="font-bold mb-2">مهارات تحتاج إلى تحسين</h3>
          {weak.length ? (
            <ul className="list-disc pr-5 space-y-1">{weak.map((w) => <li key={w}>{w}</li>)}</ul>
          ) : (
            <p>أحسنتِ! أتقنتِ جميع المهارات بنسبة ٧٠٪ فأكثر.</p>
          )}
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-bold px-1">المراجعة التفصيلية للأسئلة</h2>
        {QUESTIONS.map((q, qi) => {
          const lm = LESSONS[q.lessonId];
          const pages = q.section === 'grammar' ? lm.grammarPages : lm.spellingPages;
          const earned = q.subparts.reduce((s, sp) => s + r.bySub[subKey(q, sp.id)].earned, 0);
          const max = q.subparts.reduce((s, sp) => s + sp.marks, 0);
          return (
            <article key={q.id} className="card p-5">
              <header className="flex flex-wrap justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg">السؤال {toArabicDigits(qi + 1)}: {q.instruction}</h3>
                <span className="rounded-full bg-lav-100 text-lav-600 px-3 py-1 text-sm font-bold">{fmtMarks(earned)} / {fmtMarks(max)}</span>
              </header>
              <p className="text-xs text-blush-700 mb-3">الدرس: {lm.title} · {SECTION_LABEL[q.section]} · صفحة {pages}</p>
              {q.stem && <p className="mb-3 rounded-xl bg-blush-50 px-3 py-2">{q.stem}</p>}
              <div className="space-y-3">
                {q.subparts.map((sp) => {
                  const key = subKey(q, sp.id);
                  const sr = r.bySub[key];
                  const st = STATUS[sr.status];
                  return (
                    <div key={key} className="rounded-2xl border border-blush-100 p-3 bg-white">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-bold">{sp.prompt}</p>
                        <span className={`inline-flex items-center gap-1 text-xs rounded-full border px-2 py-1 ${st.cls}`}>
                          {sr.status === 'correct' ? <IconCheck className="w-3.5 h-3.5" /> : sr.status === 'incorrect' ? <IconX className="w-3.5 h-3.5" /> : null}
                          {st.label} · {fmtMarks(sr.earned)} من {fmtMarks(sr.max)}
                        </span>
                      </div>
                      <dl className="mt-2 grid gap-1 text-sm">
                        <div><dt className="inline font-bold text-lav-600">إجابتكِ: </dt><dd className="inline">{studentAnswerText(sp, answers[key])}</dd></div>
                        <div><dt className="inline font-bold text-emerald-700">الإجابة الصحيحة: </dt><dd className="inline">{correctAnswerText(sp)}</dd></div>
                        <div><dt className="inline font-bold text-blush-700">التوضيح: </dt><dd className="inline">{sp.explanation}</dd></div>
                        <div className="text-xs text-gray-500">المهارة: {sp.skill} · {lm.title} · ص{pages}</div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Stat({ label, value, big, ltr }: { label: string; value: string; big?: boolean; ltr?: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-blush-100 p-3">
      <p className="text-xs text-lav-600">{label}</p>
      <p className={`font-bold ${big ? 'text-2xl text-blush-700' : 'text-lg'}`} dir={ltr ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}

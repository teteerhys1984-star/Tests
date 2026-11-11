import { QUESTIONS, EXAM_TITLE, LETTER } from "../data/exam";
import type { Attempt } from "../lib/store";
import { STATUS_AR } from "../lib/grade";
import { fmtDuration, fmtNum, fmtStamp, toAr } from "../lib/text";
import { Rich } from "./Rich";
import { Figure } from "./Figures";
import { Pixel } from "./Pixel";

export function Results({ attempt, onDownload, onRetry }: { attempt: Attempt; onDownload: () => void; onRetry: () => void }) {
  const res = attempt.result!;
  const dur = attempt.durationMs ?? 0;
  const msg =
    res.percent >= 90 ? "أداء رائع يا بطل! 💎" : res.percent >= 75 ? "عمل ممتاز! ⛏️" : res.percent >= 50 ? "جيد، واصل التدرّب! 🌱" : "لا بأس، حاول مرة أخرى وستتحسّن! 🧱";
  return (
    <div className="grid gap-5">
      <section className="mc-card p-5 sm:p-7 grid gap-4 text-center">
        <div className="flex justify-center gap-3">
          <Pixel name="emerald" size={44} />
          <Pixel name="diamond" size={44} />
          <Pixel name="emerald" size={44} />
        </div>
        <h2 className="text-3xl font-extrabold">{EXAM_TITLE}</h2>
        <div className="text-xl font-bold">الطالب: {attempt.name}</div>
        <div className="mx-auto mc-panel-dark px-8 py-4">
          <div className="text-sm text-emerald-300 font-bold">الدرجة</div>
          <div className="text-5xl font-extrabold text-emerald-300 mc-text-shadow">
            <bdi style={{ direction: "ltr", unicodeBidi: "isolate-override" }}>
              {toAr(fmtNum(res.total))} / {toAr(res.max)}
            </bdi>
          </div>
          <div className="text-2xl font-bold mt-1">النسبة المئوية: {toAr(fmtNum(res.percent))}٪</div>
        </div>
        <div className="font-bold text-lg">{msg}</div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-800 max-w-xl mx-auto w-full">
          <div className="bg-white/70 p-2 border-2 border-slate-500">
            الزمن المستغرق: <bdi dir="ltr" className="font-extrabold">{fmtDuration(dur)}</bdi>
          </div>
          <div className="bg-white/70 p-2 border-2 border-slate-500">
            وقت التسليم: <bdi dir="ltr" className="font-bold">{fmtStamp(attempt.submittedAt ?? 0).slice(0, 19)}</bdi>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 font-bold">
          <span className="badge status-correct">صحيحة: {toAr(res.correct)}</span>
          <span className="badge status-partial">جزئية: {toAr(res.partial)}</span>
          <span className="badge status-incorrect">خاطئة: {toAr(res.incorrect)}</span>
          {res.unanswered > 0 && <span className="badge status-unanswered">بلا إجابة: {toAr(res.unanswered)}</span>}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <button className="mc-btn blue" onClick={onDownload}>
            تنزيل التقرير TXT
          </button>
          <button className="mc-btn" onClick={onRetry}>
            Try Again — محاولة جديدة
          </button>
        </div>
        <p className="text-xs text-slate-600">بدأ تنزيل التقرير تلقائياً عند التسليم. إذا لم يظهر التنزيل فاستعمل الزر أعلاه.</p>
      </section>

      <h2 className="text-2xl font-extrabold text-white mc-text-shadow">مراجعة الإجابات كاملة</h2>
      {attempt.order.map((qid, pos) => {
        const q = QUESTIONS.find((x) => x.id === qid)!;
        return (
          <section key={qid} className="mc-card p-4 grid gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="badge">السؤال {toAr(pos + 1)}</span>
              <span className="font-extrabold">{q.topic}</span>
            </div>
            {q.intro && (
              <div className="font-semibold">
                <Rich text={q.intro} />
              </div>
            )}
            {q.fig && (
              <div className="overflow-x-auto">
                <Figure fig={q.fig} />
              </div>
            )}
            {q.subs.map((s, i) => {
              const g = res.items.find((x) => x.subId === s.id)!;
              return (
                <div key={s.id} className="bg-white border-2 border-slate-500 p-3 grid gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="badge">({LETTER[i]})</span>
                    <span className={"badge status-" + g.status}>{STATUS_AR[g.status]}</span>
                    <span className="badge">
                      {toAr(fmtNum(g.awarded))} / {toAr(g.marks)}
                    </span>
                  </div>
                  <div className="font-semibold">
                    <Rich text={s.prompt} />
                    {s.template && (
                      <span className="mx-2">
                        <Rich text={s.template.replace(/@@/g, "____")} />
                      </span>
                    )}
                    {s.tf?.corrLabel && (
                      <div className="text-sm">
                        [التصحيح] <Rich text={s.tf.corrLabel} />
                      </div>
                    )}
                  </div>
                  {s.fig && (
                    <div className="overflow-x-auto">
                      <Figure fig={s.fig} />
                    </div>
                  )}
                  <div className="text-sm">
                    <b>إجابتك:</b> <Rich text={g.studentText} />
                  </div>
                  <div className="text-sm">
                    <b>الإجابة الصحيحة:</b> <Rich text={g.correctText} />
                  </div>
                  <div className="text-sm bg-[#f1f7ee] border-r-4 border-[#3c8527] p-2">
                    <b>الشرح:</b> <Rich text={s.explain} />
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

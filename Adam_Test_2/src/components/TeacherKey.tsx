import { useState } from "react";
import { QUESTIONS, ALL_SUBS, LETTER, type Sub } from "../data/exam";
import { Rich } from "./Rich";
import { Figure } from "./Figures";
import { toAr } from "../lib/text";

const cyrb53 = (str: string, seed = 7) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
const GATE = 3173469969648255; // static gate only — not real security

export function TeacherGate({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [bad, setBad] = useState(false);

  if (ok) return <TeacherKey onClose={onClose} />;

  const tryOpen = () => {
    if (cyrb53(pw.trim()) === GATE) setOk(true);
    else setBad(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="mc-card p-5 w-full max-w-sm">
        <h2 className="text-xl font-extrabold mb-3">مفتاح إجابات المعلم</h2>
        <p className="text-sm mb-3 text-slate-700">أدخل كلمة المرور للمتابعة.</p>
        <input
          type="password"
          autoFocus
          className="mc-input wide w-full"
          style={{ width: "100%" }}
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setBad(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tryOpen()}
          aria-label="كلمة المرور"
        />
        {bad && <div className="mt-2 text-sm font-bold text-red-700">كلمة المرور غير صحيحة.</div>}
        <div className="flex gap-3 mt-4">
          <button className="mc-btn" onClick={tryOpen}>
            فتح
          </button>
          <button className="mc-btn brown" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function AnswerBlock({ s }: { s: Sub }) {
  return (
    <div className="grid gap-1 text-[0.95rem] leading-7">
      <div>
        <b>الإجابة الصحيحة:</b> <Rich text={s.answerText} />
      </div>
      {s.alt && (
        <div>
          <b>إجابات بديلة مقبولة:</b> {s.alt}
        </div>
      )}
      <div>
        <b>قاعدة العلامات الجزئية:</b> {s.partial}
      </div>
      <div>
        <b>الحل والشرح:</b> <Rich text={s.explain} />
      </div>
    </div>
  );
}

export function TeacherKey({ onClose }: { onClose: () => void }) {
  const total = ALL_SUBS.reduce((a, s) => a + s.marks, 0);
  return (
    <div className="fixed inset-0 z-50 bg-[#e9e9e9] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="mc-title-bar sticky top-0 z-10 px-4 py-3 flex items-center gap-3 flex-wrap">
        <h2 className="text-white font-extrabold text-xl mc-text-shadow flex-1">مفتاح إجابات المعلم — آدم والرياضيات</h2>
        <button className="mc-btn brown small" onClick={onClose}>
          إغلاق
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-3 sm:p-5 grid gap-5">
        <div className="mc-card p-4 font-bold">
          عدد الأسئلة الرئيسية: {toAr(QUESTIONS.length)} — عدد الفروع: {toAr(ALL_SUBS.length)} — مجموع العلامات: {toAr(total)}
          <div className="text-sm font-normal mt-1 text-slate-700">
            ترقيم الأسئلة هنا حسب بنك الأسئلة؛ أمّا الطالب فيحصل على ترتيب عشوائي مختلف في كل محاولة (المعرّف الداخلي مذكور في التقرير). المراجع هي أرقام الصفحات المطبوعة في الكتاب.
          </div>
        </div>
        {QUESTIONS.map((q, qi) => (
          <section key={q.id} className="mc-card p-4 grid gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="badge">{q.id.toUpperCase()}</span>
              <h3 className="font-extrabold text-lg">
                السؤال {toAr(qi + 1)} — {q.topic}
              </h3>
              <span className="badge">مجموع العلامات: {toAr(q.subs.reduce((a, s) => a + s.marks, 0))}</span>
            </div>
            <div className="text-sm font-bold text-[#7a3d0b]">المرجع (صفحات الكتاب المطبوعة): {q.page}</div>
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
            {q.subs.map((s, i) => (
              <div key={s.id} className="border-2 border-slate-500 bg-white p-3 grid gap-2">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="badge">({LETTER[i]})</span>
                  <span className="badge">العلامة: {toAr(s.marks)}</span>
                  <span className="text-xs text-slate-500">{s.id}</span>
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
                {s.fig && <div className="overflow-x-auto"><Figure fig={s.fig} /></div>}
                {s.options && !s.sym && (
                  <div className="text-sm text-slate-700">
                    {s.kind === "order" ? "العناصر" : "الخيارات"}: {s.options.map((o, k) => <span key={o.k}>{k > 0 && " | "}<Rich text={o.t} /></span>)}
                  </div>
                )}
                <AnswerBlock s={s} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

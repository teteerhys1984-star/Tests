import { useState } from "react";
import { QUESTIONS, ORIGINAL_IT_PROBLEMS, SOURCE_MAP, TOTAL_MARKS, PHYSICS_MARKS, CHEMISTRY_MARKS } from "../data/exam";
import { SOLUTIONS } from "../data/solutions";
import { EXAM_TITLE, TEACHER_PASSWORD } from "../config";
import { formatPointsBadge, Katex } from "../lib/math";
import { Figure, RichText } from "./Bits";

/* =========================================================================
   منطقة المعلّم — بوابة واجهة أمامية تجميلية فقط (لا تشفير ولا مصادقة حقيقية).
   لا تُفتح أثناء محاولة طالب نشطة (يمنعها App.tsx).
   ========================================================================= */

export function TeacherKey({ onClose }: { onClose: () => void }) {
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);

  if (!ok) {
    return (
      <div className="settle min-h-full bg-ink py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pass === TEACHER_PASSWORD) setOk(true);
            else setErr(true);
          }}
          className="mx-auto w-full max-w-md rounded-3xl border-2 border-white/15 bg-white/5 p-6 text-white"
        >
          <p className="text-[13px] font-bold text-cyan">منطقة المعلّم</p>
          <h1 className="mt-1 font-display text-[26px] font-black">مفتاح إجابة الاختبار</h1>
          <p dir="ltr" className="mt-1 text-start text-[13px] font-bold text-white/70">
            {EXAM_TITLE}
          </p>
          <p className="mt-2 text-[14px] leading-7 text-white/70">
            هذه بوابة واجهة أمامية تجميلية فقط، وليست حماية أمنية حقيقية. لا تُعرض منطقة المعلّم أثناء وجود محاولة
            اختبار جارية.
          </p>
          <input
            type="password"
            value={pass}
            autoFocus
            onChange={(e) => {
              setPass(e.target.value);
              setErr(false);
            }}
            placeholder="كلمة المرور"
            className="mt-5 w-full rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3.5 text-[16px] outline-none focus:border-cyan"
            dir="ltr"
          />
          {err ? <p className="mt-2 text-[13px] font-bold text-orange">كلمة المرور غير صحيحة.</p> : null}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="flex-1 rounded-xl bg-cyan px-4 py-3 font-display text-[16px] font-black text-ink">
              دخول
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border-2 border-white/25 px-4 py-3 text-[15px] font-bold text-white/80">
              رجوع
            </button>
          </div>
        </form>
      </div>
    );
  }

  const physics = QUESTIONS.filter((q) => q.subject === "physics");
  const chemistry = QUESTIONS.filter((q) => q.subject === "chemistry");

  return (
    <div className="settle min-h-full bg-paper">
      <header className="relative overflow-hidden bg-ink text-white">
        <div className="dark-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-5xl px-4 py-7 sm:px-6">
          <p className="text-[13px] font-bold text-cyan">منطقة المعلّم · سرّي</p>
          <h1 className="font-display text-[24px] font-black sm:text-[34px]">مفتاح إجابة النموذج (أ)</h1>
          <p dir="ltr" className="mt-1 text-start text-[13px] font-bold text-cyan/90">
            {EXAM_TITLE}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-bold">
            <Chip>
              <Katex tex={String(QUESTIONS.length)} /> سؤالاً
            </Chip>
            <Chip>
              <Katex tex={String(physics.length)} /> فيزياء
            </Chip>
            <Chip>
              <Katex tex={String(chemistry.length)} /> كيمياء
            </Chip>
            <Chip>
              فيزياء <Katex tex={`${PHYSICS_MARKS}/50`} />
            </Chip>
            <Chip>
              كيمياء <Katex tex={`${CHEMISTRY_MARKS}/50`} />
            </Chip>
            <Chip>
              المجموع <Katex tex={`${TOTAL_MARKS}/100`} />
            </Chip>
            <Chip accent>
              المسائل الأصلية: <Katex tex={ORIGINAL_IT_PROBLEMS.join(", ")} /> (صور المصدر{" "}
              <Katex tex="1, 4, 7, 11, 14" />)
            </Chip>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-xl border-2 border-white/30 px-4 py-2 text-[14px] font-bold hover:border-cyan"
          >
            إغلاق منطقة المعلّم
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-9">
        <section className="mb-6 rounded-3xl border-2 border-line bg-white p-5">
          <h2 className="font-display text-[18px] font-black text-ink">قواعد منح العلامة الجزئية</h2>
          <ul className="mt-3 grid gap-2 text-[14.5px] leading-7 text-ink-soft">
            <li>
              • <b className="text-ink">المسائل الرقمية:</b> العلامة كاملة ضمن مجال السماحية، ونصف العلامة عند خطأ حسابي
              طفيف لا يتجاوز <Katex tex="10\\%" /> من القيمة الصحيحة.
            </li>
            <li>
              • <b className="text-ink">الإجابات المكتوبة:</b> لكل معيار علمي وزن مستقل داخل المطلب، ويُمنح فور تحقّق مضمونه
              العلمي في إجابة الطالب.
            </li>
            <li>
              • <b className="text-ink">الجداول:</b> العلامة = (عدد الخانات الصحيحة <Katex tex="\div" /> إجمالي الخانات){" "}
              <Katex tex="\times" /> علامة الجدول.
            </li>
            <li>
              • <b className="text-ink">الرسوم وتمثيلات لويس:</b> <Katex tex="60\\%" /> للتسميات العلمية الصحيحة و
              <Katex tex="40\\%" /> لإتمام الإنشاء الهندسي؛ وفي لويس: نصف العلامة للأزواج المشتركة ونصفها للأزواج غير
              المشتركة.
            </li>
          </ul>
        </section>

        <div className="grid gap-5">
          {QUESTIONS.map((q) => {
            const src = SOURCE_MAP.find((s) => s.id === q.id)!;
            const sol = SOLUTIONS[q.id];
            return (
              <article key={q.id} className="overflow-hidden rounded-3xl border-2 border-ink/15 bg-white shadow-xs">
                <div className="flex flex-wrap items-center gap-2 bg-ink px-4 py-2.5 text-white">
                  <span className="text-[15px] font-bold text-cyan">
                    <Katex tex={String(q.n).padStart(2, "0")} className="text-cyan" />
                  </span>
                  <span className="text-[14px] font-black">{q.subject === "physics" ? "فيزياء" : "كيمياء"}</span>
                  <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-[12px]">
                    {formatPointsBadge(q.marks)}
                  </span>
                  <span className="ms-auto rounded-md bg-white/10 px-2.5 py-0.5 text-[12px] font-bold text-yellow">
                    {q.src.origin === "independent-test" ? (
                      <>
                        اختبار مستقل — صورة <Katex tex={String(q.src.itImage)} className="text-yellow" />
                      </>
                    ) : (
                      "من الكتاب المدرسي"
                    )}
                  </span>
                </div>

                <div className="border-b-2 border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold leading-6 text-ink-soft">
                  <b className="text-ink">المصدر:</b> {src.unit} · {src.lesson} · {src.page} · <RichText text={src.source} /> —{" "}
                  <b className="text-ink">المهارة:</b> <RichText text={src.skill} />
                  {q.src.itProblem ? (
                    <>
                      {" "}
                      — المسألة رقم <Katex tex={String(q.src.itProblem)} />
                    </>
                  ) : null}
                </div>

                <div className="px-4 py-4 sm:px-5">
                  <p className="text-[15.5px] font-bold leading-8 text-ink">
                    <RichText text={q.stem} />
                  </p>

                  {q.figure ? (
                    <figure className="mt-4 overflow-hidden rounded-2xl border-2 border-line bg-[#F8FAFC] p-2">
                      <Figure kind={q.figure} solved={true} />
                    </figure>
                  ) : null}

                  <ol className="mt-4 grid gap-3">
                    {q.subs.map((s, i) => (
                      <li key={s.id} className="rounded-2xl border-2 border-line p-3.5">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[12px] font-bold text-white">
                            <Katex tex={String(i + 1)} className="text-white" />
                          </span>
                          <span className="text-[14.5px] font-bold leading-7 text-ink">
                            <RichText text={s.label} />
                          </span>
                          <span className="rounded-md border border-yellow/60 bg-yellow/25 px-2.5 py-0.5 text-[12px] font-bold">
                            {formatPointsBadge(s.points)}
                          </span>
                        </div>
                        <Answer keyAnswer={answerOf(q.id, s.id)} />
                      </li>
                    ))}
                  </ol>

                  {sol ? (
                    <div className="slip mt-4 rounded-2xl border-2 border-blue/30 p-4">
                      <p className="mb-2 font-display text-[15px] font-black text-blue-deep">الحل العلمي خطوة بخطوة</p>
                      <ol className="grid gap-1.5">
                        {sol.steps.map((st, i) => (
                          <li key={i} className="flex gap-2.5 text-[14.5px] leading-8 text-ink">
                            <span className="font-bold text-blue">
                              <Katex tex={`${i + 1}.`} />
                            </span>
                            <span>
                              <RichText text={st} />
                            </span>
                          </li>
                        ))}
                      </ol>
                      {sol.note ? (
                        <p className="mt-2 border-t-2 border-dashed border-blue/25 pt-2 text-[13.5px] text-ink-soft">
                          <RichText text={sol.note} />
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 ${accent ? "bg-yellow text-ink" : "bg-white/12 text-white/85"}`}>
      {children}
    </span>
  );
}

function Answer({ keyAnswer }: { keyAnswer: string }) {
  return (
    <p className="rounded-xl border-2 border-green/35 bg-green/8 px-3 py-2 text-[14px] leading-7 text-ink">
      <b className="text-green">الإجابة الصحيحة:</b> <RichText text={keyAnswer} />
    </p>
  );
}

/** الإجابة النموذجية المختصرة لكل مطلب بصيغة KaTeX. */
function answerOf(qid: string, sid: string): string {
  const map: Record<string, string> = {
    "p1-mag": "[[F = F_1 + F_2 = 15 + 45 = 60~\\mathrm{N}]]",
    "p1-d1": "[[d_1 = 1.5~\\mathrm{m}]]",
    "p1-d2": "[[d_2 = 0.5~\\mathrm{m}]]",
    "p4-mag": "[[F = F_2 - F_1 = 90 - 30 = 60~\\mathrm{N}]]",
    "p4-d1": "[[d_1 = 0.9~\\mathrm{m}]]",
    "p4-d2": "[[d_2 = 0.3~\\mathrm{m}]]",
    "p7-el": "نقطة التأثير [[O]]، الحامل قطر متوازي الأضلاع الخارج من [[O]]، الجهة نحو الرأس المقابل، الشدة طول القطر وفق مقياس الرسم.",
    "p7-mag": "[[F = \\sqrt{3^2 + 4^2} = 5~\\mathrm{N}]]",
    "p7-alpha": "[[\\tan\\alpha = \\dfrac{4}{3} \\;\\Rightarrow\\; \\alpha \\approx 53.1^{\\circ}]]",
    "p11-cons": "نرسم الشعاعين [[\\vec{F}_1]] و[[\\vec{F}_2]] من [[O]] ← نكمل متوازي الأضلاع ← المحصّلة [[\\vec{F}]] هي القطر الخارج من [[O]] إلى الرأس المقابل.",
    "p11-el": "نقطة التأثير [[O]]، الحامل القطر داخل الزاوية، الجهة نحو الرأس المقابل، الشدة طول القطر وفق مقياس الرسم.",
    "p14-el": "نقطة التأثير النقطة المشتركة [[O]]، الحامل منصف الزاوية بين الحاملين، الجهة داخل الزاوية نحو الرأس المقابل، الشدة طول القطر وفق مقياس الرسم.",
    "p14-mag": "[[F = 2 \\times 80 \\times \\cos 30^{\\circ} \\approx 138.6~\\mathrm{N}]]",
    "p14-alpha": "[[\\alpha = 30^{\\circ}]] مع حامل كل قوة.",
    "def-1": "القوى المتلاقية: هي القوى التي تتلاقى حواملها في نقطة واحدة [[O]].",
    "def-2": "ليست متلاقية؛ لأن حواملها متوازية منفصلة فلا تلتقي في نقطة واحدة.",
    "el-1": "نقطة التأثير [[O]].",
    "el-2": "الحامل [[(\\Delta)]] (خط التأثير).",
    "el-3": "الجهة (الاتجاه).",
    "el-4": "الشدة [[F]] (المقدار).",
    "rs-1": "[[F_2 = \\sqrt{50^2 - 30^2} = 40~\\mathrm{N}]]",
    "rs-2": "[[F_2 = \\sqrt{F^2 - F_1^2}]]",
    "rs-3": "مستطيل ضلعاه المتعامدان [[\\vec{F}_1]] و[[\\vec{F}_2]] وقطره [[\\vec{F}]]، مع تسمية [[\\vec{F}, \\vec{F}_1, \\vec{F}_2]].",
    "bl-1": "قوة الموازنة [[\\vec{F}']]: جهتها نحو الأعلى، شدتها [[60~\\mathrm{N}]]، حاملها المستقيم الشاقولي المارّ بـ [[O]].",
    "bl-2": "سهمان متعاكسان على خط شاقولي عند [[O]]: [[\\vec{w} = 60~\\mathrm{N}]] للأسفل و[[\\vec{F}' = 60~\\mathrm{N}]] للأعلى.",
    "pd-1": "القوى المتوازية: هي القوى التي تكون حواملها مستقيمات متوازية.",
    "pd-2": "نقطة التأثير، الحامل، الجهة، الشدة.",
    "dp-1": "[[F = 20 + 40 = 60~\\mathrm{N}]]",
    "dp-2": "[[d_1 = 2~\\mathrm{m}]]",
    "dp-3": "سهما [[\\vec{F}_1]] و[[\\vec{F}_2]] بالجهة نفسها وسهم [[\\vec{F}]] بينهما أقرب إلى [[B]].",
    "rl-1": "[[F = F_1 + F_2]] و [[d = d_1 + d_2]]",
    "rl-2": "[[F = F_2 - F_1]] و [[d = d_1 - d_2]]",
    "rl-3": "المحصّلة تقع خارج القطعة [[\\mathrm{AB}]] من جهة القوة الكبرى.",
    "tbl-1": "[[{}^{23}_{11}\\mathrm{Na}: 11/11/0]] — [[{}^{23}_{11}\\mathrm{Na}^+: 10/11/+1]] — [[{}^{35}_{17}\\mathrm{Cl}: 17/17/0]] — [[{}^{35}_{17}\\mathrm{Cl}^-: 18/17/-1]]",
    "nt-z": "[[Z = 17]]",
    "nt-a": "[[A = 35]]",
    "nt-n": "[[n = A - Z = 35 - 17 = 18]]",
    "nt-e": "[[17]] إلكتروناً",
    "nt-dist": "[[2\\text{-}8\\text{-}7]]",
    "lv-m": "[[y = 2 \\times (3)^2 = 18]]",
    "lv-n": "[[32]]",
    "lv-na": "[[2\\text{-}8\\text{-}1]]",
    "md-r": "معظم جسيمات ألفا [[\\alpha^{2+}]] نفذت وجزء صغير ارتدّ [[\\Rightarrow]] وجود النواة الموجبة.",
    "md-b": "الإلكترونات في سويات طاقة رئيسية محددة [[K, L, M, N]] لها سعات معلومة.",
    "lw-n-dist": "[[2\\text{-}5]]",
    "lw-f-val": "[[7]] إلكترونات",
    "lw-f-draw": "[[7]] نقاط حول [[\\mathrm{F}]] ([[3]] أزواج + نقطة مفردة).",
    "iso-tab": "[[0]] / [[1]] / [[2]] نيوترون",
    "iso-why": "العدد الذري [[Z]] = عدد البروتونات (ثابت)، والاختلاف في عدد النيوترونات.",
    "iso-e": "[[1]] إلكترون",
    "bd-1": "الروابط الكيميائية.",
    "bd-2": "الذرّات أو الأيونات أو الجزيئات.",
    "bd-3": "الرابطة الأيونية والرابطة المشتركة.",
    "tr-1": "تفقد [[\\mathrm{Na}]] إلكتروناً وتكسبه [[\\mathrm{Cl}]] [[\\Rightarrow \\mathrm{Na}^+]] و[[\\mathrm{Cl}^-]].",
    "tr-2": "[[\\mathrm{Na}^+]]",
    "tr-3": "[[\\mathrm{Cl}^-]]",
    "io-1": "أيون موجب [[(\\mathrm{Na}^+)]] وأيون سالب [[(\\mathrm{Cl}^-)]].",
    "io-2": "صلبة، لا تنقل التيار صلبة ومصاهيرها ومحاليلها تنقله، ودرجات غليانها وانصهارها مرتفعة.",
    "h2-s": "[[2]] إلكترونان (زوج واحد).",
    "h2-surf": "[[2]] لكل ذرّة.",
    "h2-lewis": "[[\\mathrm{H:H}]] بزوج مشترك واحد بلا أزواج غير مشتركة.",
    "cmp-t": "[[\\mathrm{H_2}: 1/2/]]وحيدة — [[\\mathrm{O_2}: 2/4/]]مضاعفة — [[\\mathrm{N_2}: 3/6/]]ثلاثية.",
    "fx-1": "بين فلزّ ولافلزّ بانتقال الإلكترونات.",
    "fx-2": "زوجان مشتركان ([[4]] إلكترونات) ورتبتها مضاعفة.",
  };
  const v = map[sid];
  return v ? v : `راجع الحل الكامل أدناه للسؤال ${qid}.`;
}

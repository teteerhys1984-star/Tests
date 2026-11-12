import { questions, TOTAL_MARKS, TOTAL_SUBPARTS } from "../data/questions";
import { correctAnswerDisplay } from "../lib/exam";
import { RichText } from "../components/RichText";
import { IconBook, IconCheck, IconLock, IconX } from "../components/Icons";

const TYPE_LABEL: Record<string, string> = {
  mcq: "اختيار من متعدد",
  tf: "صح / خطأ",
  numeric: "إجابة عددية",
  text: "إجابة قصيرة",
  ordering: "ترتيب ومقارنة",
};

export function TeacherKey({ onClose }: { onClose: () => void }) {
  return (
    <div className="teacher-screen" role="dialog" aria-modal="true" aria-label="المفتاح التعليمي">
      <div className="shell-narrow screen-enter">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl border"
              style={{ background: "#fbf1f5", borderColor: "#ead4df", color: "#8d3b5a" }}
            >
              <IconLock size={19} />
            </span>
            <div>
              <h1 className="font-display m-0 text-[1.4rem] font-bold" style={{ color: "#57304a" }}>
                مفتاح الإجابة ومرجع التدقيق — للمعلم
              </h1>
              <p className="m-0 text-[0.78rem]" style={{ color: "#8a7181" }}>
                ميا والرياضيات · الرياضيات · السادس الأساسي · 30 سؤالاً · {TOTAL_SUBPARTS} جزءاً · 100 درجة
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <IconBook size={15} />
              طباعة / حفظ PDF
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              <IconX size={15} />
              إغلاق المفتاح
            </button>
          </div>
        </div>

        <div className="card mb-3 p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="info-tile">
              <span className="info-tile-icon">
                <IconCheck size={17} />
              </span>
              <div>
                <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>المجموع الكلي</p>
                <p className="m-0 text-[1rem] font-bold">{TOTAL_MARKS} درجة</p>
              </div>
            </div>
            <div className="info-tile">
              <span className="info-tile-icon">
                <IconCheck size={17} />
              </span>
              <div>
                <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>عدد الأسئلة / الأجزاء</p>
                <p className="m-0 text-[1rem] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  30 سؤالاً / {TOTAL_SUBPARTS} جزءاً
                </p>
              </div>
            </div>
            <div className="info-tile">
              <span className="info-tile-icon">
                <IconCheck size={17} />
              </span>
              <div>
                <p className="m-0 text-[0.72rem]" style={{ color: "#8a7181" }}>المصدر</p>
                <p className="m-0 text-[0.94rem] font-bold">كتاب السادس — الصفحات المطبوعة 8–43</p>
              </div>
            </div>
          </div>
          <p className="notice notice-info mt-3">
            المراجع أدناه هي أرقام الصفحات المطبوعة في الكتاب المصدري (8–43)، وتظهر في هذا المفتاح
            وفي تقرير TXT فقط، ولا تظهر بجانب الأسئلة في واجهة الطالب. درجات كل سؤال تساوي مجموع
            درجات أجزائه، ومجموع الدرجات 100.
          </p>
          <div className="teacher-key mt-3 overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>السؤال</th>
                  <th>المحور</th>
                  <th>الأجزاء</th>
                  <th>الدرجة</th>
                  <th>المرجع الداخلي</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 700 }}>{q.id}</td>
                    <td>{q.topic}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{q.subparts.length}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{q.marks}</td>
                    <td>{q.page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3">
          {questions.map((q) => (
            <section key={q.id} className="teacher-row">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="q-medallion" style={{ width: 38, height: 38, fontSize: "0.85rem" }}>
                    {q.id}
                  </span>
                  <div>
                    <h2 className="m-0 text-[0.98rem] font-bold" style={{ color: "#57304a" }}>
                      {q.topic}
                    </h2>
                    <p className="m-0 text-[0.74rem]" style={{ color: "#8a7181" }}>
                      الدرجة: {q.marks} · عدد الأجزاء: {q.subparts.length}
                    </p>
                  </div>
                </div>
                <span className="teacher-ref">المرجع: {q.page}</span>
              </div>

              <p className="mt-2 mb-1 text-[0.88rem]" style={{ color: "#5a4457" }}>
                <RichText>{q.stem}</RichText>
              </p>
              {q.figure ? (
                <p className="m-0 text-[0.72rem]" style={{ color: "#9a8394" }}>
                  شكل مرفق بالنسخة الطلابية: {q.figureCaption ?? q.figure}
                </p>
              ) : null}

              <div className="mt-2 grid gap-2">
                {q.subparts.map((sp, index) => (
                  <div
                    key={sp.id}
                    className="rounded-xl border p-2.5"
                    style={{ borderColor: "#f0e0e7", background: "#fffdfa" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-[0.84rem] font-semibold" style={{ color: "#4b3750" }}>
                        <span className="subpart-index me-1.5 inline-grid align-middle" style={{ width: 22, height: 22 }}>
                          {index + 1}
                        </span>
                        <RichText>{sp.prompt}</RichText>
                      </p>
                      <span className="marks-badge">
                        {sp.marks} درجة · {TYPE_LABEL[sp.type] ?? sp.type}
                      </span>
                    </div>
                    <p className="mt-1.5 mb-0 text-[0.84rem]" style={{ color: "#3f6b52" }}>
                      <strong>الإجابة الصحيحة: </strong>
                      {sp.type === "mcq" || sp.type === "tf" ? (
                        <RichText>{correctAnswerDisplay(sp)}</RichText>
                      ) : (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{correctAnswerDisplay(sp)}</span>
                      )}
                    </p>
                    {sp.accepted?.length ? (
                      <p className="m-0 text-[0.78rem]" style={{ color: "#7b5c22" }}>
                        <strong>بدائل مقبولة / درجات جزئية: </strong>
                        {sp.accepted.map((a) => `${a.value} (${a.marks} درجة)`).join(" | ")}
                      </p>
                    ) : null}
                    {sp.textAnswers?.length ? (
                      <p className="m-0 text-[0.78rem]" style={{ color: "#7b5c22" }}>
                        <strong>صيغ نصية مقبولة: </strong>
                        {sp.textAnswers.join(" | ")}
                      </p>
                    ) : null}
                    {sp.type === "ordering" && Array.isArray(sp.correct) ? (
                      <p className="m-0 text-[0.78rem]" style={{ color: "#7b5c22" }}>
                        <strong>الترتيب الصحيح: </strong>
                        {sp.correct.join(" ، ")}
                      </p>
                    ) : null}
                    <p className="m-0 mt-1 text-[0.8rem]" style={{ color: "#5c4557" }}>
                      <strong>الشرح: </strong>
                      {sp.explanation}
                    </p>
                    {sp.rubric ? (
                      <p className="m-0 text-[0.78rem]" style={{ color: "#8a4b38" }}>
                        <strong>قواعد الدرجة الجزئية: </strong>
                        {sp.rubric}
                      </p>
                    ) : null}
                    <p className="m-0 mt-1 text-[0.72rem]" style={{ color: "#9a8394" }}>
                      المرجع الداخلي: {sp.page} · معرّف الجزء: {sp.id}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <IconX size={16} />
            إغلاق المفتاح والعودة
          </button>
        </div>
        <p className="mt-2 text-center text-[0.7rem]" style={{ color: "#a08a98" }}>
          مفتاح المعلم — لا تحتوي نسخة الطالب ولا تقريره على كلمة المرور.
        </p>
      </div>
    </div>
  );
}

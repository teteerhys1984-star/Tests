import type { Question, SubItem, SubResult, Attempt } from "../data/types";
import type { AttemptScore } from "../lib/grade";
import { formatMarks } from "../lib/grade";
import { Katex } from "../lib/math";
import { SOLUTIONS } from "../data/solutions";
import { CheckIcon, CrossIcon, Figure, RichText } from "./Bits";

/* =========================================================================
   صفحة النتيجة: الدرجات، إجابة الطالب، الإجابة النموذجية، الرسم المحلول، المصدر.
   ========================================================================= */

function stripTex(s: string): string {
  return s
    .replace(/\[\[(.+?)\]\]/g, "$1")
    .replace(/\\mathrm\{([^}]+)\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\vec\{([^}]+)\}/g, "$1")
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\^\{\\circ\}/g, "°")
    .replace(/~/g, " ");
}

function describe(_q: Question, sub: SubItem, raw: string): string {
  if (!raw || !raw.trim()) return "— لم يُجب —";
  switch (sub.kind) {
    case "matrix": {
      let obj: Record<string, string> = {};
      try {
        obj = JSON.parse(raw) as Record<string, string>;
      } catch {
        obj = {};
      }
      const rows = sub.rows ?? [];
      const heads = sub.rowHeader ?? [];
      const perRow = rows[0]?.cells.length ?? 1;
      return rows
        .map((r, ri) => {
          const parts = r.cells.map((_, ci) => {
            const id = sub.answer.kind === "matrix" ? (sub.answer.cells[ri * perRow + ci]?.id ?? "") : "";
            return `${stripTex(sub.headers?.[ci + 1] ?? "")}: ${obj[id] || "—"}`;
          });
          return `${stripTex(heads[ri] ?? "")} ← ${parts.join(" | ")}`;
        })
        .join("\n");
    }
    case "lewis": {
      try {
        const a = JSON.parse(raw) as { shared: number; lone: [number, number] };
        if (sub.answer.kind === "lewis" && sub.answer.single) return `عدد النقاط المرسومة: ${a.shared}`;
        return `أزواج مشتركة: ${a.shared} — أزواج غير مشتركة: ${a.lone[0]} / ${a.lone[1]}`;
      } catch {
        return raw;
      }
    }
    case "draw": {
      try {
        const a = JSON.parse(raw) as { strokes: number; labels: string[] };
        return `عناصر الرسم: ${a.strokes} — التسميات: ${a.labels?.join("، ") || "لا توجد"}`;
      } catch {
        return raw;
      }
    }
    default:
      return raw.trim();
  }
}

function ResponseBox({ q, sub, value }: { q: Question; sub: SubItem; value: string }) {
  const text = describe(q, sub, value);
  const mono = sub.kind === "numeric";
  return (
    <div className="rounded-xl border-2 border-line bg-paper px-3.5 py-3">
      <p className="mb-1 text-[12px] font-black text-ink-soft">إجابة الطالب</p>
      {mono && value.trim() ? (
        <div className="text-center text-[17px] font-bold text-ink">
          <Katex tex={`${value.trim()}${sub.unit ? (sub.unit === "°" ? String.raw`^{\circ}` : String.raw`~\mathrm{${sub.unit}}`) : ""}`} />
        </div>
      ) : (
        <p className="whitespace-pre-line text-[15px] leading-7 text-ink">{text}</p>
      )}
    </div>
  );
}

function ExpectedBox({ sub, result }: { sub: SubItem; result: SubResult }) {
  const sol = sub.answer;
  return (
    <div className="rounded-xl border-2 border-green/35 bg-green/8 px-3.5 py-3">
      <p className="mb-1 text-[12px] font-black text-green">الإجابة النموذجية ومعايير التصحيح</p>
      <div className="text-[15px] leading-7 text-ink">
        <RichText text={result.expected || "—"} />
      </div>
      {sol.kind === "text" && sol.criteria.length > 0 ? (
        <ul className="mt-2 grid gap-1.5">
          {result.detail.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] leading-6 text-ink-soft">
              <span className={`mt-1 ${d.ok ? "text-green" : "text-orange"}`}>
                {d.ok ? <CheckIcon className="h-3.5 w-3.5" /> : <CrossIcon className="h-3.5 w-3.5" />}
              </span>
              <span>
                <RichText text={d.criterion ?? ""} />
                {d.ok ? "" : <span className="text-orange"> — لم تُحتسب العلامة الجزئية لهذا المعيار</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {sol.kind === "matrix" || sol.kind === "lewis" || sol.kind === "draw" ? (
        <ul className="mt-2 grid gap-1.5">
          {result.detail.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] leading-6 text-ink-soft">
              <span className={`mt-1 ${d.ok ? "text-green" : "text-orange"}`}>
                {d.ok ? <CheckIcon className="h-3.5 w-3.5" /> : <CrossIcon className="h-3.5 w-3.5" />}
              </span>
              <span>
                <RichText text={d.criterion ?? ""} />
                {typeof d.got === "number" && typeof d.want === "number" ? (
                  <span className="ms-1 font-semibold">
                    (<Katex tex={`${d.got}/${d.want}`} />)
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function buildReport(name: string, attempt: Attempt, score: AttemptScore, duration: string): string {
  const line = "=".repeat(64);
  const out: string[] = [];
  out.push(line);
  out.push("اختبار الصف الثامن — الفيزياء والكيمياء · النموذج (أ)");
  out.push(`اسم الطالب: ${name}`);
  out.push(`بدء الاختبار: ${new Date(attempt.startedAt).toLocaleString("ar")}`);
  out.push(`زمن التنفيذ: ${duration}`);
  out.push(
    `النتيجة: فيزياء ${formatMarks(score.physics)}/50 · كيمياء ${formatMarks(score.chemistry)}/50 · المجموع ${formatMarks(score.total)}/100`,
  );
  out.push(line);
  out.push("");

  for (const r of score.perQuestion) {
    const q = r.question;
    out.push(`[${String(q.n).padStart(2, "0")}] (${q.subject === "physics" ? "فيزياء" : "كيمياء"}) ${stripTex(q.stem)}`);
    out.push(`    العلامة الممنوحة: ${formatMarks(r.awarded)} من ${q.marks}`);
    q.subs.forEach((sub, i) => {
      const res = r.subs[i];
      out.push(`    المطلب ${i + 1}: ${stripTex(sub.label)}`);
      out.push(`      إجابة الطالب : ${describe(q, sub, String(attempt.answers[sub.id] ?? ""))}`);
      out.push(`      الإجابة النموذجية: ${stripTex(res.expected || "—")}`);
      out.push(`      العلامة: ${formatMarks(res.awarded)} / ${formatMarks(sub.points)}`);
      if (res.detail.length) {
        res.detail.forEach((d) => {
          out.push(`        • [${d.ok ? "✓" : "✗"}] ${stripTex(d.criterion ?? "")}`);
        });
      }
    });
    const sol = SOLUTIONS[q.id];
    if (sol) {
      out.push("    الحل:");
      sol.steps.forEach((s) => out.push(`      - ${stripTex(s)}`));
      if (sol.note) out.push(`      * ${stripTex(sol.note)}`);
    }
    out.push(
      `    المصدر: ${q.src.unit} · ${q.src.lesson} · ${q.src.page} · ${stripTex(q.src.source)}` +
        (q.src.itImage ? ` · صورة المصدر رقم ${q.src.itImage}` : ""),
    );
    out.push("");
  }
  out.push(line);
  out.push("المهندس سومر شاهين — 0930215022");
  return out.join("\n");
}

function download(filename: string, text: string) {
  const blob = new Blob([`\uFEFF${text}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safe(s: string) {
  return s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-");
}

export function Results({
  attempt,
  score,
  duration,
  onRetake,
}: {
  attempt: Attempt;
  score: AttemptScore;
  duration: string;
  onRetake: () => void;
}) {
  const report = buildReport(attempt.name, attempt, score, duration);
  const base = `اختبار-الصف-الثامن-${safe(attempt.name)}-النموذج-أ`;

  return (
    <div className="settle">
      <header className="relative overflow-hidden bg-ink text-white">
        <div className="dark-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-[13px] font-bold text-cyan">نتيجة الاختبار والتصحيح المفصّل</p>
          <h1 className="mt-1 font-display text-[30px] font-black leading-tight sm:text-[44px]">{attempt.name}</h1>
          <p className="mt-1 text-[14px] text-white/75">
            زمن التنفيذ: <Katex tex={`\\mathrm{${duration}}`} className="text-cyan" /> —{" "}
            {new Date(attempt.submittedAt ?? Date.now()).toLocaleString("ar")}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Score v={score.physics} max={50} label="علامة الفيزياء" color="#06B6D4" />
            <Score v={score.chemistry} max={50} label="علامة الكيمياء" color="#FF6B1A" />
            <Score v={score.total} max={100} label="المجموع الكلّي" color="#FFC53D" big />
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => download(`${base}.txt`, report)}
              className="flex items-center gap-2 rounded-xl border-2 border-cyan bg-cyan px-4 py-3 font-display text-[15px] font-black text-ink"
            >
              <DownloadGlyph /> تنزيل التقرير (TXT)
            </button>
            <button
              type="button"
              onClick={() => download(`${base}-نسخة-احتياطية.txt`, report)}
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 font-display text-[15px] font-black text-white"
            >
              <DownloadGlyph /> نسخة احتياطية
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="rounded-xl border-2 border-white/25 px-4 py-3 font-display text-[15px] font-black text-white/85 hover:border-cyan"
            >
              إعادة الاختبار
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6">
          {score.perQuestion.map((r) => {
            const q = r.question;
            const full = r.awarded >= q.marks - 0.001;
            return (
              <article key={q.id} className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-xs">
                <div
                  className={`flex items-start gap-3 border-b-2 border-line px-4 py-3.5 sm:px-6 ${
                    full ? "bg-green/8" : "bg-paper"
                  }`}
                >
                  <span
                    className={`numeral text-[38px] ${
                      q.subject === "physics" ? "numeral-blue" : "numeral-orange"
                    }`}
                  >
                    {String(q.n).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-black text-ink">
                      السؤال <Katex tex={String(q.n)} /> — {q.subject === "physics" ? "فيزياء" : "كيمياء"}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-8 text-ink-soft">
                      <RichText text={q.stem} />
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border-2 border-ink bg-ink px-3.5 py-2 text-center text-white">
                    <Katex tex={`${formatMarks(r.awarded)}/${q.marks}`} className="text-[17px] text-yellow" />
                    <span className="block text-[10px] text-white/75">العلامة</span>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-5 sm:px-6">
                  {q.figure ? (
                    <figure className="overflow-hidden rounded-2xl border-2 border-line bg-[#F8FAFC] p-2">
                      <Figure kind={q.figure} solved={true} />
                    </figure>
                  ) : null}

                  {q.subs.map((sub, i) => {
                    const res = r.subs[i];
                    return (
                      <section key={sub.id} className="grid gap-3">
                        <p className="text-[15.5px] font-bold leading-8 text-ink">
                          <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-md bg-ink text-[12px] text-white">
                            <Katex tex={String(i + 1)} className="text-white" />
                          </span>
                          <RichText text={sub.label} />
                          <span className="ms-2 inline-block rounded-md border border-yellow/60 bg-yellow/25 px-2.5 py-0.5 text-[12px] font-bold">
                            <Katex tex={`${formatMarks(res.awarded)}/${formatMarks(sub.points)}`} /> علامة
                          </span>
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <ResponseBox q={q} sub={sub} value={String(attempt.answers[sub.id] ?? "")} />
                          <ExpectedBox sub={sub} result={res} />
                        </div>
                      </section>
                    );
                  })}

                  {SOLUTIONS[q.id] ? (
                    <div className="slip rounded-2xl border-2 border-blue/30 p-4">
                      <p className="mb-2 font-display text-[15px] font-black text-blue-deep">الحل العلمي النموذجي</p>
                      <ol className="grid gap-2">
                        {SOLUTIONS[q.id].steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-[15px] leading-8 text-ink">
                            <span className="font-bold text-blue">
                              <Katex tex={`${i + 1}.`} />
                            </span>
                            <span>
                              <RichText text={s} />
                            </span>
                          </li>
                        ))}
                      </ol>
                      {SOLUTIONS[q.id].note ? (
                        <p className="mt-2.5 border-t-2 border-dashed border-blue/25 pt-2 text-[14px] font-semibold text-ink-soft">
                          <RichText text={SOLUTIONS[q.id].note!} />
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="rounded-xl bg-ink/5 px-3.5 py-2.5 text-[12.5px] font-semibold text-ink-soft">
                    <span className="font-black text-ink">مرجع السؤال (للمراجعة): </span>
                    {q.src.unit} · {q.src.lesson} · {q.src.page} · <RichText text={q.src.source} />
                    {q.src.itImage ? (
                      <>
                        {" "}
                        · صورة المصدر رقم <Katex tex={String(q.src.itImage)} />
                      </>
                    ) : null}{" "}
                    · المهارة: <RichText text={q.src.skill} />
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-line bg-white p-5">
          <div>
            <p className="font-display text-[18px] font-black text-ink">تقرير مفصّل قابل للتنزيل</p>
            <p className="text-[13.5px] text-ink-soft">
              ملف نصّي بترميز UTF-8 يحتوي اسم الطالب والعلامات والإجابات والحلول والمصادر.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => download(`${base}.txt`, report)}
              className="rounded-xl border-2 border-ink bg-ink px-4 py-3 text-[14px] font-black text-white"
            >
              تنزيل التقرير
            </button>
            <button
              type="button"
              onClick={() => download(`${base}-نسخة-احتياطية.txt`, report)}
              className="rounded-xl border-2 border-line px-4 py-3 text-[14px] font-black text-ink"
            >
              تقرير احتياطي
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Score({ v, max, label, color, big }: { v: number; max: number; label: string; color: string; big?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4">
      <p className="text-[12px] font-bold text-white/75">{label}</p>
      <div className={`mt-1 font-bold leading-none ${big ? "text-[36px] sm:text-[44px]" : "text-[30px] sm:text-[36px]"}`} style={{ color }}>
        <Katex tex={`${formatMarks(v)}/${max}`} />
      </div>
    </div>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

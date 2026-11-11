import { QUESTIONS, SUB_INDEX, EXAM_TITLE, type Fig, type Sub, type Question } from "../data/exam";
import { STATUS_AR, type GradeResult } from "./grade";
import { fmtDuration, fmtNum, fmtStamp, toWestern } from "./text";
import type { Attempt } from "./store";

/** Remove display markup for plain-text use (report / teacher key). */
export function plain(s: string): string {
  return s.replace(/\{\{|\}\}/g, "").replace(/\[\[(.*?)\]\]/g, "$1");
}

export function subText(sub: Sub): string {
  let t = plain(sub.prompt);
  if (sub.template) t += " " + plain(sub.template).replace(/@@/g, "_____");
  if (sub.tf?.corrLabel) t += "\n      [إذا كانت خاطئة] " + plain(sub.tf.corrLabel);
  if (sub.fields && sub.layout) t += "  [" + sub.fields.map((f) => f.label).filter(Boolean).join(" | ") + "]";
  return t;
}

export function figText(f: Fig | undefined): string {
  if (!f) return "";
  switch (f.t) {
    case "vbar":
      return `[تمثيل بياني بالأعمدة رأسياً: ${f.title} — ` + f.cats.map((c, i) => `${c}: ${f.values[i]}`).join(" ، ") + "]";
    case "hbar":
      return `[تمثيل بياني بالأعمدة أفقياً: ${f.title} — ` + f.cats.map((c, i) => `${c}: ${f.values[i]}`).join(" ، ") + "]";
    case "grid":
      return (
        `[شبكة إحداثيات: المحور الأفقي 0–${f.maxX}، المحور الشاقولي 0–${f.maxY}` +
        (f.items.length ? " — " + f.items.map((i) => `${i.name ?? "النقطة " + i.label} عند (${i.x} ، ${i.y})`).join(" ، ") : " — شبكة فارغة للتحديد") +
        "]"
      );
    case "shapes":
      return `[نمط أشكال: عدد الأضلاع ${f.sides.join(" ، ")} ثم شكل مجهول]`;
    case "table":
      return `[جدول: ${f.head.join(" | ")} // ${f.rows.map((r) => r.join(" | ")).join(" // ")}]`;
    case "cards":
      return `[بطاقات الأرقام: ${f.vals.join(" ، ")}]`;
    case "vadd":
      return `[جمع عمودي: ${f.a} + ${f.b}${f.sum ? " = " + f.sum : ""}]`;
  }
}

export function sanitizeName(name: string): string {
  let n = name
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=~;,]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|[._]+$/g, "");
  if (!n) n = "Student";
  return n.slice(0, 60);
}

export function reportFilename(name: string): string {
  return `Grade4_Mathematics_Adam_Report_${sanitizeName(name)}.txt`;
}

export function buildReport(at: Attempt, res: GradeResult): string {
  const L: string[] = [];
  const line = "=".repeat(70);
  const thin = "-".repeat(70);
  const started = at.startedAt;
  const submitted = at.submittedAt ?? Date.now();
  const dur = at.durationMs ?? submitted - started;

  L.push(line);
  L.push(`تقرير الاختبار: ${EXAM_TITLE}`);
  L.push("الصف: الرابع الأساسي");
  L.push("المادة: الرياضيات");
  L.push(line);
  L.push(`اسم الطالب: ${at.name}`);
  L.push(`معرّف المحاولة: ${at.attemptId}`);
  L.push(`رقم الاختبار/الإصدار: ${at.examId} / ${at.version}`);
  L.push(`وقت البدء: ${fmtStamp(started)}`);
  L.push(`وقت التسليم: ${fmtStamp(submitted)}`);
  L.push(`مدة الاختبار: ${fmtDuration(dur)} (HH:MM:SS) = ${Math.floor(dur / 1000)} ثانية`);
  L.push(thin);
  L.push(`الدرجة: ${fmtNum(res.total)} / ${res.max}`);
  L.push(`النسبة المئوية: ${fmtNum(res.percent)}%`);
  L.push(`عدد الأسئلة الرئيسية: ${QUESTIONS.length}`);
  L.push(`عدد الفروع: ${res.items.length}`);
  L.push(`صحيحة: ${res.correct}   |   صحيحة جزئياً: ${res.partial}   |   خاطئة: ${res.incorrect}   |   بلا إجابة: ${res.unanswered}`);
  L.push(line);
  L.push("");

  at.order.forEach((qid, pos) => {
    const q: Question = QUESTIONS.find((x) => x.id === qid)!;
    L.push(`السؤال ${pos + 1} من ${at.order.length}  (المعرّف الداخلي: ${q.id})  — الموضوع: ${q.topic}`);
    L.push(`المرجع في الكتاب (للمعلم فقط): ${q.page}`);
    if (q.intro) L.push(`نص السؤال: ${plain(q.intro)}`);
    if (q.fig) L.push(`الشكل: ${figText(q.fig)}`);
    q.subs.forEach((s) => {
      const g = res.items.find((x) => x.subId === s.id)!;
      const letter = SUB_INDEX[s.id].letter;
      L.push(thin);
      L.push(`  الفرع (${letter}) — المعرّف: ${s.id} — العلامة العظمى: ${s.marks}`);
      L.push(`    نص الفرع: ${subText(s)}`);
      if (s.fig) L.push(`    الشكل: ${figText(s.fig)}`);
      if (s.options && !s.sym) {
        const ord = at.optionOrder[s.id] ?? s.options.map((o) => o.k);
        const txt = ord.map((k) => s.options!.find((o) => o.k === k)?.t ?? k);
        L.push(`    ${s.kind === "order" ? "العناصر المطلوب ترتيبها" : "الخيارات"}: ${txt.map((t) => toWestern(plain(t))).join(" | ")}`);
      }
      L.push(`    إجابة الطالب: ${g.studentText}`);
      L.push(`    الإجابة الصحيحة: ${g.correctText}`);
      L.push(`    العلامة الممنوحة: ${fmtNum(g.awarded)} من ${g.marks}`);
      L.push(`    الحالة: ${STATUS_AR[g.status]}`);
      L.push(`    الشرح: ${toWestern(plain(s.explain))}`);
    });
    L.push("");
  });

  L.push(line);
  L.push(`المجموع النهائي: ${fmtNum(res.total)} / ${res.max}  (${fmtNum(res.percent)}%)`);
  L.push("للتواصل: المهندس سومر شاهين: 0930215022");
  L.push(line);
  return L.join("\r\n");
}

export function validateReport(text: string, at: Attempt, res: GradeResult): boolean {
  if (!text || text.length < 500) return false;
  if (!text.includes(EXAM_TITLE) || !text.includes(at.name)) return false;
  if (!text.includes(`${fmtNum(res.total)} / ${res.max}`)) return false;
  for (const q of QUESTIONS) for (const s of q.subs) if (!text.includes(`المعرّف: ${s.id} `)) return false;
  return true;
}

/** Starts a local download (Blob + object URL + anchor click). No network involved. */
export function downloadText(text: string, filename: string): boolean {
  try {
    const blob = new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 4000);
    return true;
  } catch {
    return false;
  }
}

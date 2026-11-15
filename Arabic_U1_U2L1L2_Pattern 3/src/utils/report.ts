import type { Question } from "../data/questions/types";
import { LESSONS, EXAM_TITLE } from "../data/curriculum/lessons";
import type { SubpartResult } from "./scoring";

export function buildTxtReport(opts: {
  studentName: string;
  questions: Question[];
  results: Map<string, SubpartResult>;
  totalEarned: number;
  totalMax: number;
  grammarEarned: number;
  grammarMax: number;
  spellingEarned: number;
  spellingMax: number;
  durationMs: number;
  submittedAt: Date;
  lessonStats: { lessonId: string; earned: number; max: number; grammarEarned: number; grammarMax: number; spellingEarned: number; spellingMax: number }[];
}): string {
  const { studentName, questions, results, totalEarned, totalMax, grammarEarned, grammarMax, spellingEarned, spellingMax, durationMs, submittedAt, lessonStats } = opts;
  const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;
  const sec = Math.floor(durationMs / 1000);
  const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const lines: string[] = [];
  lines.push("=".repeat(60));
  lines.push(EXAM_TITLE);
  lines.push("الوحدة الأولى كاملة + الدرس الأول والثاني من الوحدة الثانية | قواعد اللغة والإملاء فقط");
  lines.push("=".repeat(60));
  lines.push(`اسم الطالبة: ${studentName}`);
  lines.push(`تاريخ ووقت التسليم: ${submittedAt.toLocaleString("ar-EG")}`);
  lines.push(`المدة: ${hh}:${mm}:${ss}`);
  lines.push(`الدرجة: ${totalEarned} / ${totalMax}  (${pct}%)`);
  lines.push(`قواعد اللغة: ${grammarEarned} / ${grammarMax}`);
  lines.push(`الإملاء: ${spellingEarned} / ${spellingMax}`);
  lines.push("");
  lines.push("--- الأداء حسب الدرس ---");
  for (const ls of lessonStats) {
    const lesson = LESSONS.find((l) => l.id === ls.lessonId);
    lines.push(`${lesson?.unit ?? ""} – ${lesson?.title ?? ls.lessonId} (ص ${lesson?.pages ?? ""}): ${ls.earned}/${ls.max} | قواعد: ${ls.grammarEarned}/${ls.grammarMax} | إملاء: ${ls.spellingEarned}/${ls.spellingMax}`);
  }
  lines.push("");
  lines.push("--- تفصيل الأسئلة والفروع ---");
  for (const q of questions) {
    const lesson = LESSONS.find((l) => l.id === q.lessonId);
    const cat = q.category === "grammar" ? "قواعد اللغة" : "الإملاء";
    lines.push("");
    lines.push(`السؤال ${q.number} – ${lesson?.title ?? ""} (ص ${lesson?.pages ?? ""}) – ${cat}`);
    lines.push(`التعليمات: ${q.instruction}`);
    lines.push(`النص: ${q.prompt}`);
    for (const sp of q.subparts) {
      const r = results.get(sp.id);
      lines.push(`  ${sp.label}) ${sp.prompt}`);
      lines.push(`     إجابة الطالبة: ${r?.studentAnswer || "—"}`);
      lines.push(`     الإجابة الصحيحة: ${sp.correctAnswer}${sp.acceptedAnswers?.length ? ` (مقبول أيضًا: ${sp.acceptedAnswers.join(" / ")})` : ""}`);
      lines.push(`     النتيجة: ${r?.earned ?? 0} / ${sp.maxMarks}`);
      lines.push(`     الشرح: ${sp.explanation}`);
      lines.push(`     المهارة: ${sp.skill} | الصعوبة: ${sp.difficulty}`);
    }
  }
  lines.push("");
  lines.push("انتهى التقرير.");
  return lines.join("\n");
}

export function downloadTxt(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

import { LESSONS, type ExamResult } from "@/data/exam";
import { formatDuration } from "@/lib/storage";

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

export function buildReport(r: ExamResult): string {
  const L: string[] = [];
  const line = (s = "") => L.push(s);

  line("================================================================");
  line(" GRADE 8 ENGLISH EXAM — UNIT 1 (LESSONS 1, 2 AND 3) — MODEL A");
  line(" Official answer report");
  line("================================================================");
  line();
  line(`Student name     : ${r.name}`);
  line("Exam model       : Model A");
  line(`Submitted        : ${new Date(r.submittedAt).toLocaleString()}`);
  line(`Time spent       : ${formatDuration(r.timeSpentMs)}`);
  line();
  line("----------------------------------------------------------------");
  line(" SCORE");
  line("----------------------------------------------------------------");
  line(`Total            : ${r.total} / 100`);
  line(`Percentage       : ${r.percent}%`);
  for (const l of r.lessons) line(`${pad(l.title, 17)}: ${l.score} / ${l.marks}`);
  line();

  for (const l of LESSONS) {
    const rs = r.questions.filter((q) => q.question.lesson === l.id);
    line("================================================================");
    line(` LESSON ${l.id} — ${l.title.toUpperCase()}  (${rs.reduce((s, q) => s + q.earned, 0)} / ${rs.reduce((s, q) => s + q.available, 0)})`);
    line("================================================================");
    for (const q of rs) {
      line();
      line(`Q${q.question.id} [${q.question.typeLabel}] — ${q.earned}/${q.available} mark${q.available > 1 ? "s" : ""}`);
      line(`    Instruction : ${q.question.instruction}`);
      q.parts.forEach((pr, i) => {
        line(`    ${pad(`${i + 1}.`, 4)}Your answer : ${pr.student}`);
        line(`    ${pad("", 4)}Correct     : ${pr.correct}   [${pr.ok ? "CORRECT" : "INCORRECT"}]`);
      });
      line(`    Why         : ${q.question.explanation}`);
      line(`    Source      : ${q.question.ref}`);
      if (q.question.passage) {
        line(
          `    Passage     : ${q.question.passage === "p1" ? "Schools in the Past, Present and Future" : "My Amazing Journey"}`,
        );
      }
    }
    line();
  }

  line("================================================================");
  line(" End of report");
  line("================================================================");
  return L.join("\r\n");
}

export function downloadReport(r: ExamResult): void {
  const text = buildReport(r);
  const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safe = r.name.trim().replace(/[^\p{L}\p{N}]+/gu, "_") || "student";
  const a = document.createElement("a");
  a.href = url;
  a.download = `Grade8_Exam_ModelA_Report_${safe}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

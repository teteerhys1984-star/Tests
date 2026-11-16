import { lessonLabel } from "../data/lessons";
import type { AnswerValue, Part, Question, SourceRef } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatMarks(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function answerToText(part: Part, value: AnswerValue | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return "(no answer)";
  if (part.kind === "order") {
    const indices = Array.isArray(value) ? value : [];
    return indices.map((i) => part.tokens[i]).join(" ");
  }
  return String(value).trim();
}

export function correctAnswerText(part: Part): string {
  switch (part.kind) {
    case "order":
      return part.answer.join(" ");
    case "text":
      return part.answerDisplay;
    default:
      return part.answer;
  }
}

export function acceptedAnswersText(part: Part): string {
  if (part.kind === "text") return part.accepted.join(" | ");
  return correctAnswerText(part);
}

/** A readable one-line version of the question part (used in review, teacher key and report). */
export function partPrompt(question: Question, partId: string): string {
  for (const block of question.blocks) {
    if ((block.type === "choice" || block.type === "order") && block.part === partId) {
      const part = question.parts.find((p) => p.id === partId);
      if (part?.kind === "choice") return `${part.label ? part.label + " " : ""}${part.stem}`;
      if (part?.kind === "order") return `Put in order: ${part.tokens.join(" / ")}`;
    }
    if (block.type === "sentence" || block.type === "sequence") {
      const segments = block.type === "sentence" ? block.segments : block.items;
      const hasBlank = segments.some((s) => typeof s === "object" && "blank" in s && s.blank === partId);
      if (!hasBlank) continue;
      const text = segments
        .map((s) => {
          if (typeof s === "string") return s;
          if ("blank" in s) return s.blank === partId ? "_____" : "(…)";
          return "[picture]";
        })
        .join(block.type === "sequence" ? ", " : " ")
        .replace(/\s+/g, " ")
        .replace(/ ([.,?!])/g, "$1")
        .trim();
      const label = block.type === "sentence" && block.label ? `${block.label} ` : "";
      return `${label}${text}`;
    }
    if (block.type === "timetable") {
      for (const row of block.rows) {
        const index = row.cells.findIndex((c) => c.blank === partId);
        if (index >= 0) return `${row.day}, lesson ${index + 1}: [picture] _____`;
      }
    }
  }
  return partId;
}

export function sourceToText(lesson: Question["lesson"], ref: SourceRef): string {
  return `${lessonLabel(lesson)} · ${ref.book} · ${ref.page} · ${ref.exercise}${ref.detail ? ` — ${ref.detail}` : ""}`;
}

export function sourceShort(lesson: Question["lesson"], ref: SourceRef): string {
  return `Lesson ${lesson} · ${ref.book} · ${ref.page} · ${ref.exercise}`;
}

export function passageToLines(question: Question): string[] {
  const p = question.passage;
  if (!p) return [];
  switch (p.kind) {
    case "dialogue":
      return p.panels.flatMap((panel, i) => panel.map((bubble, j) => `${j === 0 ? `Panel ${i + 1}: ` : "         "}${bubble.replace(/\n/g, " ")}`));
    case "song":
    case "text":
      return p.lines;
    case "table":
      return [p.header.map((h) => h || "—").join(" | "), ...p.rows.map((r) => r.map((c) => c || "—").join(" | "))];
    case "picture":
      return [`[Picture] ${p.image.alt}`];
  }
}

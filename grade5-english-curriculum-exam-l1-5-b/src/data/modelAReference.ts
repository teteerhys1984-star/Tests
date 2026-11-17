/**
 * MODEL A — recorded selection of textbook items.
 *
 * Model A is the other examination form built from the same Pupil's Book
 * (Grade 5 · Unit 1 · Lessons 1–5). This module keeps a record of the items
 * Model A used so the automated test can prove that Model B is a genuinely
 * separate form: it selects different textbook exercises / different items of
 * the same exercise, in a different order, with different option orders.
 *
 * Every identifier below points at an item that really exists on the printed
 * pages — no new curriculum content is invented for either model.
 */

import { QUESTIONS } from "./questions";

/** Exercise + item identifiers used by Model A, in Model A's order. */
export const MODEL_A_SELECTIONS: string[] = [
  // Lesson 1 — At School
  "L1/Ex5/a",
  "L1/Ex5/d",
  "L1/Ex6a/Syria-basic",
  "L1/Ex6b/1",
  "L1/Ex6b/3",
  "L1/Ex7/1",
  "L1/Ex7/2",
  "L1/Ex8/2",
  "L1/Ex8/3",
  "L1/Ex4/corridor",
  // Lesson 2 — Family
  "L2/Ex6/Canada",
  "L2/Ex6/father-Peter",
  "L2/Ex6/aunt-Olivia",
  "L2/Ex6/uncle-Richard",
  "L2/Ex6b/1",
  "L2/Ex6b/2",
  "L2/Ex7/Women-bags",
  "L2/Ex7/Hani-shoes",
  "L2/LetsLearn/students-books",
  "L2/Ex8/parents",
  // Lesson 3 — Daily Routines
  "L3/Ex7/4",
  "L3/Ex7/6",
  "L3/Ex5/2",
  "L3/Ex5/4",
  "L3/Ex6a/1",
  "L3/Ex6a/2",
  "L3/Ex6b/1",
  "L3/Ex8/2",
  "L3/Ex8/3",
  "L3/Ex8/4",
  // Lesson 4 — The Five Senses
  "L4/Ex1/listen-1",
  "L4/Ex3/flower-smell",
  "L4/Ex6a/2",
  "L4/Ex6a/4",
  "L4/Ex6b/delicious",
  "L4/Ex6b/bitter",
  "L4/Ex7/2",
  "L4/Ex7/3",
  "L4/Ex7/4",
  "L4/Ex9/model",
  // Lesson 5 — Clothes
  "L5/Ex5/picture1",
  "L5/Ex5/picture3",
  "L5/Ex6/dialogue-size",
  "L5/Ex6a/1",
  "L5/Ex6a/3",
  "L5/Ex7/picture3",
  "L5/Ex8/punctuation-c",
  "L5/Rev1-1/3",
  "L5/Rev1-2/1",
  "L5/Rev1-4/a",
];

/**
 * Model B's own selection, derived from the shipped question bank so the test
 * can never drift out of sync with the real exam.
 */
export function modelBSelections(): string[] {
  return QUESTIONS.map((q) => q.id);
}

/** Number of positions where Model A and Model B use a different item. */
export function selectionMismatchCount(): number {
  const b = modelBSelections();
  if (b.length !== MODEL_A_SELECTIONS.length) return Math.max(b.length, MODEL_A_SELECTIONS.length);
  let diff = 0;
  for (let i = 0; i < b.length; i++) {
    if (MODEL_A_SELECTIONS[i] !== b[i]) diff++;
  }
  return diff;
}

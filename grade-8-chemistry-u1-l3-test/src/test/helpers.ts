import { ALL_PARTS } from '../data/exam';
import type { Answers } from '../lib/types';
export function correctAnswers(): Answers {
  const answers: Answers = {};
  ALL_PARTS.forEach(p => {
    const r = p.response;
    if (r.kind === 'choice') answers[p.id] = r.correct;
    else if (r.kind === 'number') answers[p.id] = String(r.answer);
    else if (r.kind === 'matching') answers[p.id] = { ...r.correct };
    else if (r.kind === 'order') answers[p.id] = [...r.correct];
    else if (r.kind === 'fields') answers[p.id] = Object.fromEntries(r.fields.map(f => [f.id, String(f.answer)]));
    else answers[p.id] = Object.fromEntries(r.rows.flatMap(row => [[row.id, String(row.correct)], ...(!row.correct ? [[`${row.id}.correction`, row.correction!]] : [])]));
  });
  return answers;
}

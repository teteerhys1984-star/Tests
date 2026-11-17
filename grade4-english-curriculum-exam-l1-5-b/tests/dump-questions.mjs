#!/usr/bin/env node
/**
 * Bundles the TypeScript question bank and writes it to JSON so the Node-side
 * browser script can drive the UI without duplicating any answer data.
 */
import { build } from 'esbuild';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadQuestions() {
  const outdir = await mkdtemp(join(tmpdir(), 'exam-questions-'));
  const outfile = join(outdir, 'questions.mjs');
  await build({
    entryPoints: ['src/data/questions.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
  });
  const module = await import(pathToFileURL(outfile).href);
  return module.EXAM_QUESTIONS;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const questions = await loadQuestions();
  const target = process.argv[2];
  const json = JSON.stringify(questions, null, 2);
  if (target) await writeFile(target, json, 'utf8');
  else console.log(json);
}

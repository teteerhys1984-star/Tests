import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('dist/index.html','utf8');
assert.deepEqual(readdirSync('dist'), ['index.html']);
assert.match(html,/interactive-grade-8-english-exam-l1-3-a/);
assert.match(html,/Interactive Grade 8 English Exam L1-3 A/);
assert.match(html,/data:font\/woff2/);
assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+(?:stylesheet|preload)|fonts\.googleapis\.com|fonts\.gstatic\.com/i);
console.log('Single-file build verified: embedded scripts, styles, images and fonts.');

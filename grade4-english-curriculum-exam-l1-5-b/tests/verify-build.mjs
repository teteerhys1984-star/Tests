#!/usr/bin/env node
/**
 * Production-build verification for Grade 4 English Curriculum Exam L1-5 B.
 *
 * The platform publishes only `dist/index.html`, so this script asserts that the
 * built file is standalone: Version B identity, embedded fonts, embedded audio,
 * zero external asset requests and no Version A identifiers.
 *
 * run:  npm run build && npm run verify:build
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const FILE = 'dist/index.html';
assert.ok(existsSync(FILE), `${FILE} is missing — run "npm run build" first`);
const html = readFileSync(FILE, 'utf8');

const EXAM_ID = 'grade4-english-curriculum-exam-l1-5-b';
const EXAM_TITLE = 'Grade 4 English Curriculum Exam L1-5 B';
const VERSION_A_ID = ['grade4', 'english', 'curriculum', 'exam', 'l1', '5', 'a'].join('-');

assert.ok(html.includes(EXAM_TITLE), 'pupil-facing title is missing');
assert.ok(html.includes(`<title>${EXAM_TITLE}</title>`), 'document <title> is not the Version B title');
assert.ok(html.includes(EXAM_ID), 'exam id is missing from the bundle');
assert.ok(!html.includes(VERSION_A_ID), 'Version A identifier leaked into the Version B bundle');

// Single-file build: fonts and generated chimes are inlined as data URIs.
assert.ok(/data:font\/woff2;base64,/.test(html), 'fonts are not inlined');
assert.ok(/data:audio\/wav;base64,/.test(html), 'start/submit sounds are not inlined');
assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html), 'external Google Fonts request found');

// No external script/style tags.
assert.ok(!/<script[^>]+src="https?:/i.test(html), 'external script tag found');
assert.ok(!/<link[^>]+rel="stylesheet"[^>]+href="https?:/i.test(html), 'external stylesheet found');

// Only the delivery endpoint, the WhatsApp link, SVG namespaces and the React
// error-reference links compiled into React itself may be absolute URLs. None of
// these is a loaded asset: scripts, styles, fonts and sounds are all inlined.
const allowed = [
  'https://script.google.com/',
  'https://wa.me/',
  'http://www.w3.org/',
  'https://react.dev/errors/',
];
const urls = [...html.matchAll(/https?:\/\/[^\s"'<>`]+/g)].map((m) => m[0]);
const foreign = urls.filter((url) => !allowed.some((prefix) => url.startsWith(prefix)));
assert.deepEqual(foreign, [], `unexpected external URLs: ${foreign.join(', ')}`);

// The delivery contract must survive minification. Vite turns
// `pending:${EXAM_ID}:` into a template literal over the EXAM_ID constant, so the
// queue prefix is asserted as prefix + exam id rather than one joined string.
assert.ok(html.includes('text/plain;charset=utf-8'), 'delivery content type missing');
assert.ok(html.includes('`pending:'), 'pending queue prefix missing');
assert.ok(html.includes('Resend result'), 'resend button label missing');
assert.ok(html.includes('Result sent successfully.'), 'delivery success message missing');
assert.ok(html.includes(EXAM_TITLE), 'title missing');

console.log(
  `PASS: ${FILE} (${(html.length / 1024).toFixed(0)} kB) — Version B identity, embedded fonts and sounds, ` +
    'no external assets, delivery contract keys present'
);

/**
 * مُشغّل اختبارات المشروع:
 *   1) يبني ملفات الاختبار (TypeScript) إلى ESM في .tmp-test بواسطة esbuild.
 *   2) يشغّل كل ملف ناتج بـ node، ويفشل إن فشل أي فحص.
 *
 * الاستعمال: npm test
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, '.tmp-test');

const SUITES = [
  { src: 'tests/preservation.test.ts', out: '.tmp-test/preservation.test.mjs', label: 'مطابقة النسخة الأصلية' },
  { src: 'tests/grading.test.ts', out: '.tmp-test/grading.test.mjs', label: 'التصحيح والتقرير' },
  { src: 'tests/submit.test.ts', out: '.tmp-test/submit.test.mjs', label: 'الحمولة والإرسال والمحاولات' },
  { src: 'tests/workflow.test.tsx', out: '.tmp-test/workflow.test.mjs', label: 'سير العمل داخل DOM' },
];

const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let failed = 0;
for (const suite of SUITES) {
  console.log(`\n━━━ ${suite.label} (${suite.src}) ━━━`);
  execFileSync(
    esbuild,
    [
      suite.src,
      '--bundle',
      '--platform=node',
      '--format=esm',
      '--loader:.css=empty',
      '--loader:.woff2=empty',
      '--loader:.woff=empty',
      '--loader:.ttf=empty',
      `--outfile=${suite.out}`,
      '--log-level=warning',
      '--external:jsdom',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  try {
    execFileSync(process.execPath, [suite.out], { cwd: root, stdio: 'inherit' });
  } catch {
    failed++;
  }
}

if (failed) {
  console.log(`\n❌ فشل ${failed} ملف اختبار`);
  process.exit(1);
}
console.log('\n✅ نجحت كل ملفات الاختبار');

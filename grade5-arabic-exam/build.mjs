/**
 * خطوة البناء لنظام النشر (.github/workflows/deploy.yml).
 *
 * نظام النشر ينفّذ `npm ci && npm run build` في كل مجلد علوي فيه package.json ثم ينشر
 * dist/index.html فقط. هذا الاختبار صفحة HTML واحدة مكتفية بذاتها (index.html)، فالبناء
 * يتحقق منها ثم ينسخها كما هي، بايتاً ببايت، إلى dist/index.html. لا يحتاج البناء أي اعتماديات.
 *
 * يفشل البناء — بدل نشر صفحة معطوبة — إذا:
 *   · لم تطابق قيمة EXAM_ID في الصفحة اسم هذا المجلد (فتُسجَّل النتائج تحت اختبار آخر)؛
 *   · أشارت الصفحة إلى ملف محلي (لا يُنشر إلا dist/index.html)؛
 *   · كان في سكربت الصفحة خطأ صياغة، أو لم يكن لها <title> (صفحة الفهرس تعرض العنوان).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = path.basename(ROOT);
const SOURCE = "index.html";
const OUT_DIR = path.join(ROOT, "dist");
const OUT_FILE = path.join(OUT_DIR, "index.html");

const html = readFileSync(path.join(ROOT, SOURCE), "utf8");
const problems = [];

/* 1. EXAM_ID يجب أن يطابق اسم المجلد المنشور حرفياً. */
const examId = (html.match(/const\s+EXAM_ID\s*=\s*"([^"]*)"/) || [])[1];
if (!examId) problems.push("EXAM_ID was not found in " + SOURCE + ".");
else if (examId !== FOLDER) problems.push(`EXAM_ID is "${examId}" but this folder is "${FOLDER}". They must be identical.`);

/* 2. صفحة الفهرس تحتاج عنواناً. */
const title = ((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
if (!title) problems.push("The page has no <title>.");

/* 3. لا إشارة إلى ملفات محلية: لا يُنشر إلا dist/index.html. */
const isPublished = (target) => /^(https?:|data:|mailto:|tel:|blob:|#)/i.test(target) || target === "" || target.includes("${");
const references = [];
for (const m of html.matchAll(/<[a-z][^<>]*?\s(?:src|href|poster|srcset)\s*=\s*["']([^"']*)["']/gi)) references.push(m[1].trim());
for (const m of html.matchAll(/(?<![\w.])url\(\s*["']?([^"')]+)["']?\s*\)/g)) references.push(m[1].trim());
for (const m of html.matchAll(/@import\s+["']([^"']+)["']/gi)) references.push(m[1].trim());
const localReferences = [...new Set(references.filter((target) => !isPublished(target)))];
if (localReferences.length) problems.push("The page refers to local files that would not be published: " + localReferences.join(", "));

/* 4. كل سكربت مضمَّن يجب أن يكون سليم الصياغة على الأقل. */
let inlineScripts = 0;
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(m[1])) {
    problems.push("The page loads an external script: " + m[1].trim());
    continue;
  }
  inlineScripts += 1;
  try {
    new vm.Script(m[2], { filename: SOURCE + "#inline-script-" + inlineScripts });
  } catch (error) {
    problems.push("Inline script " + inlineScripts + " does not parse: " + error.message);
  }
}
if (!inlineScripts) problems.push("No inline script was found.");

if (problems.length) {
  console.error("Build failed for " + FOLDER + ":");
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html);

console.log(`Built ${path.relative(ROOT, OUT_FILE)} from ${SOURCE}`);
console.log(`  title: ${title}`);
console.log(`  EXAM_ID: ${examId}`);
console.log(`  size: ${Buffer.byteLength(html)} bytes · inline scripts: ${inlineScripts}`);

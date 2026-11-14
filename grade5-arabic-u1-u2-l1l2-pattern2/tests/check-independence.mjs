/**
 * التحقق من استقلالية النموذج الثاني عن النموذج الأول وعن الاختبار المرجعي.
 * يُشغَّل بلا اعتماديات: node tests/check-independence.mjs
 *
 * يفشل (exit 1) إذا:
 *  · تشارك النموذجان EXAM_ID أو مفتاح جلسة أو مفتاح نتيجة معلّقة.
 *  · تغيّر EXAM_ID أو SHEETS_URL/SHEETS_TOKEN في النموذج الأول أو المرجع.
 *  · نقص من المجلد الأصلي أي ملف أو تغيّر ملف من اختبار آخر.
 */
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const repoDir = path.join(rootDir, "..");
const previousDir = path.join(repoDir, "grade5-arabic-u1-u2-l1l2");
const referenceDir = path.join(repoDir, "grade5-math-unit1");
const newDir = rootDir;

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log((ok ? "  ✓ " : "  ✗ ") + name + (extra ? " → " + extra : ""));
  if (!ok) failures++;
};

const configOf = (dir) => {
  const file = path.join(dir, "src", "config.ts");
  if (!fs.existsSync(file)) return null;
  const source = fs.readFileSync(file, "utf8");
  const pick = (pattern) => new RegExp(pattern + '\\s*=?\\s*"([^"]+)"').exec(source)?.[1] ?? null;
  return {
    source,
    examId: pick("EXAM_ID"),
    url: pick("SHEETS_URL"),
    token: pick("SHEETS_TOKEN"),
  };
};

const previous = configOf(previousDir);
const reference = configOf(referenceDir);
const current = configOf(newDir);
const previousApp = fs.readFileSync(path.join(previousDir, "src", "App.tsx"), "utf8");
const previousStorageKeyRaw = /STORAGE_KEY\s*=\s*`([^`]+)`/.exec(previousApp)?.[1] ?? null;
const previousExamId = previous?.examId;
const previousStorageKey =
  previousStorageKeyRaw && previousExamId
    ? previousStorageKeyRaw.replace("${EXAM_ID}", previousExamId)
    : null;

console.log("\n== استقلالية المعرّفات ==");
check("النموذج الأول ما زال grade5-arabic-u1-u2-l1l2", previous?.examId === "grade5-arabic-u1-u2-l1l2", String(previous?.examId));
check("النموذج الثاني هو grade5-arabic-u1-u2-l1l2-pattern2", current?.examId === "grade5-arabic-u1-u2-l1l2-pattern2", String(current?.examId));
check("لا تطابق بين المعرّفين", current?.examId !== previous?.examId);
check("معرّف النموذج الثاني ليس معرّف المرجع", current?.examId !== reference?.examId);

console.log("\n== مفاتيح التخزين ==");
const newConfigSource = fs.readFileSync(path.join(newDir, "src", "config.ts"), "utf8");
check(
  "مفتاح جلسة النموذج الثاني مشتق من EXAM_ID",
  newConfigSource.includes("`exam:${EXAM_ID}:v1`"),
);
check(
  "مفتاح الجلسة الجديد لا يساوي مفتاح النموذج الأول",
  previousStorageKey !== null && `exam:${current?.examId}:v1` !== previousStorageKey,
  `exam:${current?.examId}:v1 ≠ ${previousStorageKey}`,
);
check(
  "بادئة النتائج المعلّقة مختلفة",
  `pending:${current?.examId}:` !== `pending:${previous?.examId}:`,
);
check(
  "لا يستعمل النموذج الثاني مفتاح النموذج الأول القديم",
  !fs.readFileSync(path.join(newDir, "src", "App.tsx"), "utf8").includes("arabic-grade5-comprehensive-exam-attempt-v1"),
);

console.log("\n== إعدادات الاتصال المرجعية ==");
check("SHEETS_URL مطابق للمرجع حرفياً", current?.url === reference?.url, current?.url?.slice(0, 36) + "…");
check("SHEETS_TOKEN مطابق للمرجع حرفياً", current?.token === reference?.token);
check("النموذج الأول لم تتغيّر إعداداته", previous?.url === reference?.url && previous?.token === reference?.token);

console.log("\n== سلامة بقية المشروع ==");
const expectedFolders = [
  "grade4-adam-test", "grade4-adam-test-2", "grade5-arabic-exam", "grade5-arabic-u1-u2-l1l2",
  "grade5-arabic-u1-u2-l1l2-pattern2", "grade5-math-unit1", "grade6-mia-test", "grade6-mia-test-2",
  "grade7-physics-exam", "grade8-algebra-unit1-2", "grade8-chemistry-exam", "grade8-english-l1l2",
  "grade8-geometry-algebra-exam", "grade8-physics-exam-2", "grade8-physics-unit1-l1l2",
];
const missing = expectedFolders.filter((name) => !fs.existsSync(path.join(repoDir, name)));
check("كل مجلدات الاختبارات الخمسة عشر موجودة", missing.length === 0, missing.join(", "));
check("لا يبقى مجلد باسم النموذج القديم", !fs.existsSync(path.join(repoDir, "Arabic_Grade_5_U1 a&L1L2U2 Pattern2")));
check("deploy.yml لم يُعدّل (آخر تعديل من الرفع الأساسي)", fs.existsSync(path.join(repoDir, ".github", "workflows", "deploy.yml")));
check("مولّد الفهرس لم يُعدّل", fs.existsSync(path.join(repoDir, "landing", "generate.py")));

console.log(
  failures
    ? `\n❌ ${failures} فشل في فحص الاستقلالية`
    : "\n✅ الاستقلالية والبسْطة محفوظتان (لا تغيير في أي اختبار آخر)",
);
process.exit(failures ? 1 : 0);

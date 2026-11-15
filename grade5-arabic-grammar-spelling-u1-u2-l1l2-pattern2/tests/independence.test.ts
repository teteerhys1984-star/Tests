import fs from "node:fs"; import path from "node:path";
import { EXAM_ID, ATTEMPT_STORAGE_KEY, SOUND_STORAGE_KEY } from "../src/config";
import { PENDING_PREFIX } from "../src/utils/submit";
let f = 0; process.exitCode = 1;
const check = (n: string, c: boolean) => { if (!c) { f++; console.log("  ✗ " + n); } else console.log("  ✓ " + n); };
const MODEL1_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2";
check("EXAM_ID is new pattern2 id", EXAM_ID === "grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2");
check("EXAM_ID differs from model 1", EXAM_ID !== MODEL1_ID);
check("attempt/sound keys namespaced by EXAM_ID", ATTEMPT_STORAGE_KEY === `exam:${EXAM_ID}:v1` && SOUND_STORAGE_KEY.includes(EXAM_ID) && !ATTEMPT_STORAGE_KEY.includes(MODEL1_ID + ":") && ATTEMPT_STORAGE_KEY !== `exam:${MODEL1_ID}:v1`);
check("pending prefix namespaced & distinct", PENDING_PREFIX === `pending:${EXAM_ID}:` && PENDING_PREFIX !== `pending:${MODEL1_ID}:`);
const root = process.cwd();
const src = fs.readdirSync(path.join(root, "src"), { recursive: true }).filter(x => String(x).endsWith(".ts") || String(x).endsWith(".tsx")).map(x => fs.readFileSync(path.join(root, "src", String(x)), "utf8")).join("\n");
check("no model-1 storage key in source", !src.includes(`exam:${MODEL1_ID}:v1`) && !src.includes("zahrat-almarifa:grade5-arabic-attempt"));
check("no old generic zahrat attempt key", !src.includes("zahrat-almarifa:sound-enabled"));
// Simulate both models' pending keys coexisting: retry logic must not touch model1 keys (also covered in submit tests)
check("folder name equals EXAM_ID", path.basename(root) === EXAM_ID);
console.log(f === 0 ? "independence OK" : f + " failures"); if (f === 0) process.exitCode = 0;

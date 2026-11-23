import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "g7-physics-l1-l2-test-"));

try {
  await build({
    entryPoints: [
      path.join(rootDir, "src/config.ts"),
      path.join(rootDir, "src/lib/site.ts"),
      path.join(rootDir, "src/content/problems.ts"),
      path.join(rootDir, "src/exam/spec.ts"),
      path.join(rootDir, "src/exam/grading.ts"),
      path.join(rootDir, "src/exam/persistence.ts"),
      path.join(rootDir, "src/exam/report.ts"),
      path.join(rootDir, "src/exam/submit.ts"),
    ],
    outdir: outDir,
    bundle: false,
    platform: "node",
    format: "esm",
    target: "node20",
    outExtension: { ".js": ".mjs" },
  });

  // Rewrite relative imports inside compiled .mjs files to point to .mjs
  function fixImports(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        fixImports(full);
      } else if (entry.name.endsWith(".mjs")) {
        let content = fs.readFileSync(full, "utf8");
        content = content.replace(
          /from\s+["'](\.[^"']+?)["']/g,
          (m, p) => (p.endsWith(".mjs") ? m : `from "${p}.mjs"`)
        );
        fs.writeFileSync(full, content, "utf8");
      }
    }
  }
  fixImports(outDir);

  const testFiles = [
    path.join(__dirname, "exam.test.mjs"),
    path.join(__dirname, "submit.test.mjs"),
  ];

  const res = spawnSync(process.execPath, ["--test", ...testFiles], {
    stdio: "inherit",
    env: { ...process.env, COMPILED_DIR: outDir },
  });

  process.exitCode = res.status ?? 1;
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}

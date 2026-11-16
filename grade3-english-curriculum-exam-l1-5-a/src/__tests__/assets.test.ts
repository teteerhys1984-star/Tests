// @vitest-environment jsdom
/**
 * Guards the two things that broke the GitHub Actions build before:
 *   · the sound files were missing from src/assets/sounds;
 *   · picture imports pointed at files that were not in src/assets/img.
 *
 * Every asset import in the source tree is resolved on disk here, so a missing
 * file fails the test suite instead of the deployment.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAM_GRADE, EXAM_ID, EXAM_SEMESTER, EXAM_SUBJECT, EXAM_TITLE } from "../config";
import { EXAM } from "../data/lessons";
import { IMG } from "../data/media";

// Resolved from this file, so it works no matter which directory vitest starts in.
const PROJECT = resolve(import.meta.dirname, "../..");
const SRC = join(PROJECT, "src");
const ASSETS = join(SRC, "assets");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** `import x from "../assets/img/foo.png"` and `import "../x.css"` style imports. */
function assetImports(): { file: string; spec: string; resolved: string }[] {
  const list: { file: string; spec: string; resolved: string }[] = [];
  for (const file of walk(SRC)) {
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(/^\s*import\s+(?:[^'"]*?from\s+)?"([^"]+)"/gm)) {
      const spec = match[1];
      if (!/\.(png|jpe?g|webp|gif|svg|wav|mp3|ogg|m4a|css)$/i.test(spec)) continue;
      list.push({ file: relative(SRC, file), spec, resolved: resolve(dirname(file), spec) });
    }
  }
  return list;
}

describe("asset integrity", () => {
  it("finds every asset import in the source tree", () => {
    const imports = assetImports();
    expect(imports.length).toBeGreaterThan(35);
    expect(imports.some((i) => i.spec.includes("/assets/img/"))).toBe(true);
    expect(imports.filter((i) => i.spec.includes("/assets/sounds/"))).toHaveLength(2);
  });

  it("resolves every imported image, sound and stylesheet on disk", () => {
    const missing = assetImports()
      .filter((i) => !existsSync(i.resolved))
      .map((i) => `${i.file} → ${i.spec}`);
    expect(missing).toEqual([]);
  });

  it("ships two non-empty, real WAV files for the exam sounds", () => {
    const wavs = readdirSync(join(ASSETS, "sounds")).filter((n) => n.endsWith(".wav"));
    expect(wavs.sort()).toEqual(["start.wav", "submit.wav"]);
    for (const name of wavs) {
      const buf = readFileSync(join(ASSETS, "sounds", name));
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WAVE");
      // 16-bit mono PCM, a fraction of a second → real samples, not a stub header.
      const sampleRate = buf.readUInt32LE(24);
      expect(sampleRate).toBeGreaterThanOrEqual(8000);
      expect(buf.readUInt16LE(34)).toBe(16);
      expect(buf.length).toBeGreaterThan(8_000);
    }
  });

  it("has every picture used by the exam on disk and non-empty", () => {
    const pictures = Object.entries(IMG);
    expect(pictures).toHaveLength(38);
    const names = new Set(readdirSync(join(ASSETS, "img")));
    const missing = pictures.filter(([, asset]) => {
      const file = asset.src.split("/").pop() as string;
      return !names.has(file) || statSync(join(ASSETS, "img", file)).size < 400;
    });
    expect(missing.map(([key]) => key)).toEqual([]);
  });

  it("never ships an empty or placeholder asset", () => {
    const small = readdirSync(join(ASSETS, "img"))
      .map((n) => ({ n, size: statSync(join(ASSETS, "img", n)).size }))
      .filter((f) => f.size < 400);
    expect(small).toEqual([]);
  });
});

describe("platform identity", () => {
  // The exam folder is also built on its own (npm ci / npm run build inside it), so
  // the platform files are looked up in the surrounding repo and only asserted when
  // present; the check never silently disappears when the repo is there.
  const root = [PROJECT, resolve(PROJECT, ".."), resolve(PROJECT, "../..")].find((dir) =>
    existsSync(join(dir, "landing/exams.json")),
  );
  const repo = root !== undefined;

  it("publishes under the folder name that matches EXAM_ID", () => {
    expect(EXAM_ID).toBe("grade3-english-curriculum-exam-l1-5-a");
    expect(EXAM_TITLE).toBe("Grade 3 English Curriculum Exam L1-5 A");
    expect(EXAM.title).toBe(EXAM_TITLE);
    expect([EXAM_GRADE, EXAM_SUBJECT, EXAM_SEMESTER]).toEqual([3, "english", 1]);
  });

  it.skipIf(!repo)("is registered once in the platform index (grade 3 · semester 1 · English)", () => {
    const index = readFileSync(join(root as string, "landing/exams.json"), "utf8");
    const overrides = JSON.parse(index).overrides;
    expect(overrides[EXAM_ID]).toEqual({
      grade: 3,
      subject: "english",
      semester: 1,
      title: EXAM_TITLE,
    });
  });

  it("sets the pupil-facing page title", () => {
    const html = readFileSync(join(PROJECT, "index.html"), "utf8");
    expect(html).toContain(`<title>${EXAM_TITLE}</title>`);
  });

  it.skipIf(!repo)("keeps the source upload out of the published exam list", () => {
    const base = root as string;
    const script = readFileSync(join(base, "landing/scripts/build-exams.sh"), "utf8");
    const workflow = readFileSync(join(base, ".github/workflows/deploy.yml"), "utf8");
    for (const build of [script, workflow]) {
      expect(build).toContain('"grade-3-english-curriculum-exam-L1-5-A"');
      expect(build).toMatch(/Skipping source folder \(not a standalone exam\)/);
    }
  });
});

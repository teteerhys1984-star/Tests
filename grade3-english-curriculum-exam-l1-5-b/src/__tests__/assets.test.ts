// @vitest-environment jsdom
/**
 * Asset integrity & platform identity checks for Version B:
 *  - Verifies every CSS/TS import in `src/` resolves on disk;
 *  - Verifies all 28 embedded curriculum PNG crops decode to intact PNGs,
 *    and that `l4Pb14Coat` & `l4Pb14Goat` are cleanly cropped without leaked
 *    textbook word-pills;
 *  - Verifies both synthesized PCM WAV sounds (`start` and `submit`) have
 *    valid RIFF/WAVE headers, 22,050 Hz 16-bit mono PCM samples, and distinct
 *    waveforms;
 *  - Verifies platform registration (`EXAM_ID`, `EXAM_TITLE`, `landing/exams.json`,
 *    `build-exams.sh`, `.github/workflows/deploy.yml`).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CURRICULUM_IMAGES } from "../assets/curriculum";
import { EXAM_GRADE, EXAM_ID, EXAM_SEMESTER, EXAM_SUBJECT, EXAM_TITLE } from "../config";
import { EXAM_QUESTIONS } from "../data/questions";
import { getStartSoundUri, getSubmitSoundUri } from "../utils/sound";

const PROJECT = resolve(import.meta.dirname, "../..");
const SRC = join(PROJECT, "src");

function walkTs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function decodePngDimensions(dataUri: string): { width: number; height: number; byteLen: number } {
  const prefix = "data:image/png;base64,";
  expect(dataUri.startsWith(prefix)).toBe(true);
  const buf = Buffer.from(dataUri.slice(prefix.length), "base64");
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(buf.subarray(buf.length - 8).toString("hex")).toBe("49454e44ae426082");
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    byteLen: buf.length,
  };
}

describe("asset integrity", () => {
  it("resolves every relative stylesheet and module import in src/", () => {
    const missing: string[] = [];
    for (const file of walkTs(SRC)) {
      const code = readFileSync(file, "utf8");
      for (const match of code.matchAll(/^\s*import\s+(?:[^'"]*?from\s+)?["'](\.[^"']+)["']/gm)) {
        const spec = match[1];
        const base = resolve(dirname(file), spec);
        const candidates = [
          base,
          `${base}.ts`,
          `${base}.tsx`,
          join(base, "index.ts"),
          join(base, "index.tsx"),
        ];
        if (!candidates.some((c) => existsSync(c))) {
          missing.push(`${relative(SRC, file)} -> ${spec}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("embeds all 28 real curriculum PNG crops with clean cropped dimensions on l4Pb14Coat and l4Pb14Goat", () => {
    const entries = Object.entries(CURRICULUM_IMAGES);
    expect(entries).toHaveLength(28);

    for (const [key, uri] of entries) {
      const info = decodePngDimensions(uri);
      expect(info.width, `${key} width`).toBeGreaterThan(20);
      expect(info.height, `${key} height`).toBeGreaterThan(20);
      expect(info.byteLen, `${key} bytes`).toBeGreaterThan(600);
    }

    // Verified clean crops with leaked word-pill headers removed
    expect(decodePngDimensions(CURRICULUM_IMAGES.l4Pb14Coat)).toMatchObject({
      width: 154,
      height: 126,
    });
    expect(decodePngDimensions(CURRICULUM_IMAGES.l4Pb14Goat)).toMatchObject({
      width: 152,
      height: 123,
    });
  });

  it("verifies every image referenced across all 50 questions is non-empty and valid", () => {
    let referencedCount = 0;
    for (const q of EXAM_QUESTIONS) {
      for (const stim of q.stimuli ?? []) {
        if (stim.kind === "images") {
          for (const item of stim.items) {
            decodePngDimensions(item.src);
            referencedCount++;
          }
        } else if (stim.kind === "table") {
          if (stim.imageSrc) {
            decodePngDimensions(stim.imageSrc);
            referencedCount++;
          }
          for (const row of stim.rows) {
            for (const cell of row) {
              if (cell.iconSrc) {
                decodePngDimensions(cell.iconSrc);
                referencedCount++;
              }
            }
          }
        } else if (stim.kind === "example" && stim.iconPair) {
          decodePngDimensions(stim.iconPair.leftSrc);
          decodePngDimensions(stim.iconPair.rightSrc);
          referencedCount += 2;
        }
      }
      if (q.type === "text-parts") {
        for (const p of q.parts) {
          for (const cue of p.cueImages ?? []) {
            decodePngDimensions(cue.src);
            referencedCount++;
          }
        }
      }
    }
    expect(referencedCount).toBe(30);
  });

  it("generates two distinct, non-empty 16-bit 22050 Hz PCM WAV sounds", () => {
    const startUri = getStartSoundUri();
    const submitUri = getSubmitSoundUri();
    expect(startUri).not.toBe(submitUri);

    for (const uri of [startUri, submitUri]) {
      const prefix = "data:audio/wav;base64,";
      expect(uri.startsWith(prefix)).toBe(true);
      const buf = Buffer.from(uri.slice(prefix.length), "base64");
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WAVE");
      expect(buf.readUInt16LE(20)).toBe(1); // PCM
      expect(buf.readUInt16LE(22)).toBe(1); // Mono
      expect(buf.readUInt32LE(24)).toBe(22050); // Sample rate
      expect(buf.readUInt16LE(34)).toBe(16); // 16-bit
      expect(buf.length).toBeGreaterThan(20_000);

      // Confirm real non-zero audio waveform samples
      let nonZeroSamples = 0;
      for (let offset = 44; offset + 2 <= buf.length; offset += 2) {
        if (buf.readInt16LE(offset) !== 0) nonZeroSamples++;
      }
      expect(nonZeroSamples).toBeGreaterThan(5_000);
    }
  });
});

describe("platform identity", () => {
  const root = [PROJECT, resolve(PROJECT, ".."), resolve(PROJECT, "../..")].find((dir) =>
    existsSync(join(dir, "landing/exams.json"))
  );
  const repo = root !== undefined;

  it("matches published folder name, EXAM_ID, and metadata", () => {
    expect(EXAM_ID).toBe("grade3-english-curriculum-exam-l1-5-b");
    expect(EXAM_TITLE).toBe("Grade 3 English Curriculum Exam L1-5 B");
    expect([EXAM_GRADE, EXAM_SUBJECT, EXAM_SEMESTER]).toEqual([3, "english", 1]);

    const html = readFileSync(join(PROJECT, "index.html"), "utf8");
    expect(html).toContain(`<title>${EXAM_TITLE}</title>`);
  });

  it.skipIf(!repo)("is registered in landing/exams.json alongside Version A without collision", () => {
    const index = JSON.parse(readFileSync(join(root as string, "landing/exams.json"), "utf8"));
    expect(index.overrides[EXAM_ID]).toEqual({
      grade: 3,
      subject: "english",
      semester: 1,
      title: "Grade 3 English Curriculum Exam L1-5 B",
    });
    expect(index.overrides["grade3-english-curriculum-exam-l1-5-a"]).toEqual({
      grade: 3,
      subject: "english",
      semester: 1,
      title: "Grade 3 English Curriculum Exam L1-5 A",
    });
  });

  it.skipIf(!repo)("excludes source upload folder grade-3-english-curriculum-exam-L1-5-B from builds", () => {
    const base = root as string;
    const script = readFileSync(join(base, "landing/scripts/build-exams.sh"), "utf8");
    const workflow = readFileSync(join(base, ".github/workflows/deploy.yml"), "utf8");
    for (const content of [script, workflow]) {
      expect(content).toContain('"grade-3-english-curriculum-exam-L1-5-B"');
      expect(content).toMatch(/Skipping source folder \(not a standalone exam\)/);
    }
  });
});

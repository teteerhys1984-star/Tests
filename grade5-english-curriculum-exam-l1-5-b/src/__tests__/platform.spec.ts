/**
 * Platform integration of this exam: the index card and the build pipeline.
 *
 * These checks read the repository files around the exam folder; they never
 * modify them and never contact the network.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(process.cwd(), "..");
const read = (relative: string) => readFileSync(join(REPO_ROOT, relative), "utf8");

describe("landing/exams.json", () => {
  const exams = JSON.parse(read("landing/exams.json")) as {
    overrides: Record<
      string,
      { grade: number; subject: string; semester?: number; title: string }
    >;
  };

  it("publishes this exam under Grade 5 → Semester 1 → English", () => {
    const entry = exams.overrides["grade5-english-curriculum-exam-l1-5-b"];
    expect(entry).toBeTruthy();
    expect(entry).toEqual({
      grade: 5,
      subject: "english",
      semester: 1,
      title: "Grade 5 English Curriculum Exam L1-5 B",
    });
  });

  it("keeps every earlier override untouched (including Grade 5 A)", () => {
    for (const key of [
      "grade3-english-curriculum-exam-l1-5-a",
      "grade3-english-curriculum-exam-l1-5-b",
      "grade4-english-curriculum-exam-l1-5-a",
      "grade4-english-curriculum-exam-l1-5-b",
      "grade5-english-curriculum-exam-l1-5-a",
      "grade8-algebra-unit1-2",
      "grade8-english-curriculum-l1-l2",
      "grade8-english-curriculum-l3-l4",
    ]) {
      expect(exams.overrides[key], key).toBeTruthy();
    }
    expect(exams.overrides["grade5-english-curriculum-exam-l1-5-a"].title).toBe(
      "Grade 5 English Curriculum Exam L1-5 A"
    );
  });

  it("does not create a card for the source folder", () => {
    expect(exams.overrides["grade-5-english-curriculum-exam-L1-5-B"]).toBeUndefined();
  });
});

describe("build pipeline exceptions", () => {
  for (const file of [".github/workflows/deploy.yml", "landing/scripts/build-exams.sh"]) {
    it(`${file} skips the source folder and keeps all previous exceptions`, () => {
      const text = read(file);
      expect(text).toContain("grade-5-english-curriculum-exam-L1-5-B");
      for (const previous of [
        "English Curriculum Lessons 3&4",
        "English_L1L2 Test",
        "grade-3-english-curriculum-exam-L1-5-A",
        "grade-3-english-curriculum-exam-L1-5-B",
        "grade-4-english-curriculum-exam-L1-5-A",
        "grade-4-english-curriculum-exam-L1-5-B",
        "grade-5-english-curriculum-exam-L1-5-A",
      ]) {
        expect(text, `${file} must still skip ${previous}`).toContain(previous);
      }
    });
  }

  it("publishes the final folder as a standalone exam project", () => {
    const pkg = JSON.parse(read("grade5-english-curriculum-exam-l1-5-b/package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.build).toBe("vite build");
    expect(existsSync(join(REPO_ROOT, "grade5-english-curriculum-exam-l1-5-b/src/data/questions.ts"))).toBe(
      true
    );
  });
});

describe("assets and fonts are local", () => {
  it("loads no Google Fonts or other CDN in index.html", () => {
    const html = read("grade5-english-curriculum-exam-l1-5-b/index.html");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(html).not.toMatch(/<link[^>]+href="https?:/);
    expect(html).toContain("<title>Grade 5 English Curriculum Exam L1-5 B</title>");
  });

  it("ships the platform's Cairo WOFF2 files and uses them", () => {
    for (const file of [
      "cairo-arabic-wght-normal.woff2",
      "cairo-latin-wght-normal.woff2",
      "cairo-latin-ext-wght-normal.woff2",
      "OFL.txt",
    ]) {
      expect(
        existsSync(join(REPO_ROOT, "grade5-english-curriculum-exam-l1-5-b/src/assets/fonts", file)),
        file
      ).toBe(true);
    }
    const css = read("grade5-english-curriculum-exam-l1-5-b/src/index.css");
    expect(css).toContain('font-family: "Cairo"');
    expect(css).toContain('url("./assets/fonts/cairo-latin-wght-normal.woff2")');
    expect(css).not.toMatch(/@import\s+url\(/);
  });

  it("keeps both source images locally imported", () => {
    expect(
      existsSync(join(REPO_ROOT, "grade5-english-curriculum-exam-l1-5-b/src/assets/hero-classroom.jpg"))
    ).toBe(true);
    expect(
      existsSync(join(REPO_ROOT, "grade5-english-curriculum-exam-l1-5-b/src/assets/celebration.jpg"))
    ).toBe(true);
    const landing = read("grade5-english-curriculum-exam-l1-5-b/src/components/Landing.tsx");
    const results = read("grade5-english-curriculum-exam-l1-5-b/src/components/Results.tsx");
    expect(landing).toContain('from "@/assets/hero-classroom.jpg"');
    expect(results).toContain('from "@/assets/celebration.jpg"');
  });

  it("prevents any unintended horizontal scrolling on phones", () => {
    const css = read("grade5-english-curriculum-exam-l1-5-b/src/index.css");
    expect(css).toMatch(/html\s*\{[^}]*overflow-x:\s*clip/);
    expect(css).toMatch(/body\s*\{[^}]*overflow-x:\s*clip/);
    const html = read("grade5-english-curriculum-exam-l1-5-b/index.html");
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0"');
  });

  it("mentions Grade 5, Semester 1 and Version B on the entry screen", () => {
    const landing = read("grade5-english-curriculum-exam-l1-5-b/src/components/Landing.tsx");
    expect(landing).toContain("Semester");
    expect(landing).toContain("Curriculum Exam");
    expect(landing).toContain("L1-5 B");
    expect(landing).toContain("Version B");
  });
});

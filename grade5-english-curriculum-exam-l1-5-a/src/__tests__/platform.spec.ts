/**
 * Publication checks: the built exam must be a single self-contained page,
 * with the platform title, this exam's own id, local fonts and no external
 * resource (no CDN, no Google Fonts, no absolute asset path).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { EXAM_ID, EXAM_TITLE } from "@/config";
import { STORAGE_KEY } from "@/lib/storage";
import { PENDING_PREFIX, RECEIPT_PREFIX } from "@/lib/submit";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..", "..");
const REPO = path.resolve(PROJECT, "..");

let outDir = "";
let html = "";

beforeAll(async () => {
  outDir = mkdtempSync(path.join(tmpdir(), "g5-english-build-"));
  // The build runs in its own process, exactly like the deploy workflow does,
  // so the production bundle is produced (NODE_ENV=production).
  execFileSync(
    process.execPath,
    [
      path.join(PROJECT, "node_modules", "vite", "bin", "vite.js"),
      "build",
      "--outDir",
      outDir,
      "--emptyOutDir",
    ],
    { cwd: PROJECT, stdio: "pipe", env: { ...process.env, NODE_ENV: "production" } },
  );
  html = readFileSync(path.join(outDir, "index.html"), "utf8");
}, 180000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe("Production build", () => {
  it("produces one self-contained index.html", () => {
    const files = readdirSync(outDir);
    expect(files).toContain("index.html");
    expect(files.filter((f) => f.endsWith(".js") || f.endsWith(".css"))).toHaveLength(0);
  });

  it("carries the platform title of this exam", () => {
    expect(html).toContain(`<title>${EXAM_TITLE}</title>`);
    expect(html).toContain(EXAM_TITLE);
    expect(html).toContain(EXAM_ID);
  });

  it("embeds the local Cairo font and the two images", () => {
    expect(html).toContain("data:font/woff2;base64");
    expect((html.match(/data:font\/woff2;base64/g) ?? []).length).toBe(3);
    expect(html).toContain("data:image/jpeg;base64");
  });

  it("never asks an external server for a font or a stylesheet", () => {
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
    expect(html).not.toMatch(/<script[^>]+src=/);
  });

  it("uses relative asset paths so it works under a sub-path", () => {
    expect(html).not.toContain('src="/assets/');
    expect(html).not.toContain('href="/assets/');
  });

  it("keeps only the delivery endpoint and the contact link as external URLs", () => {
    const urls = new Set(html.match(/https?:\/\/[^\s"'`)]+/g) ?? []);
    const allowed = [
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
      "https://wa.me/963930215022",
      "http://www.w3.org/2000/svg",
      "http://www.w3.org/1999/xlink",
      "http://www.w3.org/1998/Math/MathML",
      "http://www.w3.org/XML/1998/namespace",
      // React's own error-message links (text inside a message, never fetched).
      "https://react.dev/",
    ];
    for (const url of urls) {
      expect(
        allowed.some((a) => url.startsWith(a)),
        `unexpected external resource: ${url}`,
      ).toBe(true);
    }
  });
});

describe("Storage keys are unique across the platform", () => {
  const otherExams = [
    "grade3-english-curriculum-exam-l1-5-a",
    "grade3-english-curriculum-exam-l1-5-b",
    "grade4-english-curriculum-exam-l1-5-a",
    "grade4-english-curriculum-exam-l1-5-b",
    "grade5-math-unit1",
  ];

  it("uses its own attempt key", () => {
    expect(STORAGE_KEY).toBe("grade5-english-curriculum-exam-l1-5-a-attempt-v1");
  });

  it("shares no storage key with another published exam", () => {
    for (const folder of otherExams) {
      const src = path.join(REPO, folder, "src");
      if (!readdirSync(src).length) continue;
      const keys = new Set<string>();
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            continue;
          }
          if (!/\.(ts|tsx)$/.test(entry.name)) continue;
          const content = readFileSync(full, "utf8");
          for (const match of content.matchAll(/["'`]([A-Za-z0-9_:.-]*(attempt|pending|sent|mute|storage)[A-Za-z0-9_:.-]*)["'`]/gi)) {
            keys.add(match[1]);
          }
        }
      };
      walk(src);
      for (const key of keys) {
        expect(key, `${folder} shares the key ${key}`).not.toBe(STORAGE_KEY);
        expect(key, `${folder} shares the key ${key}`).not.toBe(PENDING_PREFIX + "x");
        expect(key, `${folder} shares the key ${key}`).not.toBe(RECEIPT_PREFIX + "x");
      }
    }
  });
});

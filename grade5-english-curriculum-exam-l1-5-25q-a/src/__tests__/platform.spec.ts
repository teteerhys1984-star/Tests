/**
 * Publication checks: verifies the built exam is a single self-contained HTML
 * file carrying the exact exam title & EXAM_ID, locally embedded Cairo WOFF2
 * fonts and images, relative paths, and zero external font/stylesheet/script
 * requests.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_URL } from "@/config";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..", "..");

let outDir = "";
let html = "";

beforeAll(() => {
  outDir = mkdtempSync(path.join(tmpdir(), "g5-25q-build-"));
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
}, 180_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe("Production singlefile bundle", () => {
  it("outputs one self-contained index.html with no separate .js or .css files", () => {
    const files = readdirSync(outDir);
    expect(files).toContain("index.html");
    expect(files.filter((f) => f.endsWith(".js") || f.endsWith(".css"))).toHaveLength(0);
  });

  it("carries the exact exam title and EXAM_ID", () => {
    expect(html).toContain(`<title>${EXAM_TITLE}</title>`);
    expect(html).toContain(EXAM_TITLE);
    expect(html).toContain(EXAM_ID);
  });

  it("embeds all 3 Cairo WOFF2 font files and both images locally", () => {
    expect(html).toContain("data:font/woff2;base64");
    expect((html.match(/data:font\/woff2;base64/g) ?? []).length).toBe(3);
    expect(html).toContain("data:image/jpeg;base64");
    expect((html.match(/data:image\/jpeg;base64/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("never references Google Fonts, CDNs, or external stylesheets/scripts", () => {
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain('src="/assets/');
    expect(html).not.toContain('href="/assets/');
  });

  it("allows only the delivery endpoint, WhatsApp contact, SVG/XML namespaces, and React strings", () => {
    const urls = new Set(html.match(/https?:\/\/[^\s"'`)]+/g) ?? []);
    const allowed = [
      SHEETS_URL,
      "https://wa.me/963930215022",
      "http://www.w3.org/2000/svg",
      "http://www.w3.org/1999/xlink",
      "http://www.w3.org/1998/Math/MathML",
      "http://www.w3.org/XML/1998/namespace",
      "https://react.dev/",
    ];
    for (const url of urls) {
      expect(
        allowed.some((prefix) => url.startsWith(prefix)),
        `unexpected external URL: ${url}`,
      ).toBe(true);
    }
  });
});

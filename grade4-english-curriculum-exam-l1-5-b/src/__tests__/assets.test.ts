/**
 * Assets, single-file build and offline independence.
 *
 * The platform publishes only `dist/index.html`, so every image, font and sound
 * must be embedded in that file, and no test or runtime code may call the live
 * Google endpoint.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe('fonts and images are local files, not network requests', () => {
  it('ships the two variable fonts and their OFL licences', () => {
    for (const name of [
      'fredoka-latin-wght-normal.woff2',
      'nunito-latin-wght-normal.woff2',
      'fredoka-OFL.txt',
      'nunito-OFL.txt',
    ]) {
      const file = path.join(ROOT, 'public/fonts', name);
      expect(fs.existsSync(file), name).toBe(true);
    }
    // WOFF2 magic signature.
    for (const name of ['fredoka-latin-wght-normal.woff2', 'nunito-latin-wght-normal.woff2']) {
      const magic = fs.readFileSync(path.join(ROOT, 'public/fonts', name)).subarray(0, 4).toString('ascii');
      expect(magic).toBe('wOF2');
    }
  });

  it('declares both fonts with relative URLs so the bundler inlines them', () => {
    const css = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
    expect(css).toContain("font-family: 'Fredoka'");
    expect(css).toContain("font-family: 'Nunito'");
    expect(css).toContain("url('../public/fonts/fredoka-latin-wght-normal.woff2')");
    expect(css).toContain("url('../public/fonts/nunito-latin-wght-normal.woff2')");
    expect(css).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('has no external font, image or audio request in index.html', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(html).not.toMatch(/<link[^>]+href="https?:/);
    expect(html).not.toMatch(/<img[^>]+src="https?:/);
    expect(html).toMatch(/<title>Grade 4 English Curriculum Exam L1-5 B<\/title>/);
  });
});

describe('sound effects stay local', () => {
  it('generates the start/submit chimes in memory — no audio file, no URL', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/utils/soundEffects.ts'), 'utf8');
    expect(source).toContain('encodeWavBase64');
    expect(source).toContain('data:audio/wav;base64,');
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/\.mp3|\.wav['"]/);
    expect(fs.existsSync(path.join(ROOT, 'public/audio'))).toBe(false);
  });
});

describe('the published page is self-contained', () => {
  const dist = path.join(ROOT, 'dist/index.html');

  it('builds into a single index.html when dist exists', () => {
    if (!fs.existsSync(dist)) {
      // The build is verified by `npm run build` and tests/verify-build.mjs.
      expect(fs.existsSync(dist)).toBe(false);
      return;
    }
    const html = fs.readFileSync(dist, 'utf8');
    expect(html).toContain('Grade 4 English Curriculum Exam L1-5 B');
    expect(html).toContain('grade4-english-curriculum-exam-l1-5-b');
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    // Fonts and the generated WAV chimes are inlined.
    expect(html).toMatch(/data:font\/woff2;base64,/);
    expect(html).toMatch(/data:audio\/wav;base64,/);
    // No leftover external script or stylesheet tags.
    expect(html).not.toMatch(/<script[^>]+src="https?:/);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:/);
    // Absolute URLs left in the bundle are text only: the Apps Script endpoint
    // (never fetched by a test), the WhatsApp link, SVG namespaces and React's
    // own compiled error-doc links. No asset is loaded from the network.
    const urls = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((match) => match[0]);
    const foreign = urls.filter(
      (url) =>
        !url.startsWith('https://script.google.com/') &&
        !url.startsWith('https://wa.me/') &&
        !url.startsWith('http://www.w3.org/') &&
        !url.startsWith('https://react.dev/errors/')
    );
    expect(foreign).toEqual([]);
    // And the page never loads anything from those URLs at runtime.
    expect(html).not.toMatch(/<script[^>]+src="https?:/i);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:/i);
  });
});

describe('no test touches the live endpoint', () => {
  it('injects mock fetch everywhere and never calls the real network', () => {
    const selfFile = path.join(ROOT, 'src/__tests__/assets.test.ts');
    const testFiles = walk(path.join(ROOT, 'src')).filter(
      (file) => file.includes('__tests__') && file !== selfFile
    );
    for (const file of testFiles) {
      const source = fs.readFileSync(file, 'utf8');
      // Any bare `fetch(` in a test must be reached through an injected mock.
      const bare = [...source.matchAll(/(?<![.\w'"`])fetch\s*\(/g)];
      if (bare.length > 0) {
        expect(source, file).toMatch(/vi\.stubGlobal\(\s*['"]fetch['"]/);
      }
      // The Apps Script URL may only appear through the config module.
      expect(source, file).not.toMatch(/https:\/\/script\.google\.com/);
    }
  });
});

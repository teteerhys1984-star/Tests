/**
 * Playwright resolver.
 *
 * The exam ships no browser-test dependency so `npm ci` stays small and
 * reproducible; browser checks are an optional local step. Resolution order:
 *
 *   1. PLAYWRIGHT_MODULE — absolute path to an installed playwright module
 *      (package directory or `node_modules` root), for sandboxes where the
 *      browser binaries are pre-provisioned,
 *   2. `@playwright/test` — the version used across this repository,
 *   3. `playwright-core`, 4. `playwright`.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

async function importFirst(candidates) {
  for (const specifier of candidates) {
    try {
      const module = await import(specifier);
      if (module.chromium) return module.chromium;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

export async function loadChromium() {
  const override = process.env.PLAYWRIGHT_MODULE;
  const candidates = [];
  if (override) {
    // Accept a package directory, its index file or a node_modules root.
    for (const base of [override, join(override, 'node_modules')]) {
      for (const pkg of ['playwright-core', '@playwright/test', 'playwright']) {
        const dir = join(base, ...pkg.split('/'));
        if (existsSync(dir)) {
          candidates.push(pathToFileURL(join(dir, 'index.js')).href);
          candidates.push(pathToFileURL(join(dir, 'index.mjs')).href);
        }
      }
    }
  }
  candidates.push('@playwright/test', 'playwright-core', 'playwright');

  const chromium = await importFirst(candidates);
  if (chromium) return chromium;
  throw new Error(
    'Playwright is not installed. Install it with "npm i -D @playwright/test && npx playwright install chromium", ' +
      'or point PLAYWRIGHT_MODULE at an existing playwright installation.'
  );
}

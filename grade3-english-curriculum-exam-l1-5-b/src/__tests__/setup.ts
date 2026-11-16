/**
 * Global Vitest network guard:
 * Replaces `globalThis.fetch` before every test so NO test can ever send a real
 * HTTP request to Google Sheets or any external host. Individual tests inject
 * their own Mock Fetch behavior explicitly.
 */
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.reject(
        new Error("Real network fetch is disabled in tests; use Mock Fetch.")
      )
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

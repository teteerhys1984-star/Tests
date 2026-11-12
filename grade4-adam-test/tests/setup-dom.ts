/**
 * A real DOM (jsdom) for the workflow test, with the download, the sound and the network
 * intercepted. This file must be imported before react / react-dom, because React decides
 * whether a DOM is available when its module is loaded.
 */
import { JSDOM } from "jsdom";

/** Node's own fetch, kept for carrying intercepted calls to the mock server on 127.0.0.1. */
export const realFetch = globalThis.fetch;

const dom = new JSDOM(
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
  { url: "https://local.test/grade4-adam-test/", pretendToBeVisual: true }
);
const win = (dom as unknown as { window: any }).window;
const g = globalThis as any;

g.window = win;
g.document = win.document;
// In Node 21+ navigator is a getter-only global, so a plain assignment throws.
Object.defineProperty(g, "navigator", { value: win.navigator, configurable: true, writable: true });
g.self = win;
g.location = win.location;
g.history = win.history;
// The app calls the global URL.createObjectURL; it must be jsdom's URL (intercepted below), not Node's.
g.URL = win.URL;
g.HTMLElement = win.HTMLElement;
g.HTMLAnchorElement = win.HTMLAnchorElement;
g.HTMLInputElement = win.HTMLInputElement;
g.HTMLButtonElement = win.HTMLButtonElement;
g.SVGElement = win.SVGElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.MouseEvent = win.MouseEvent;
g.KeyboardEvent = win.KeyboardEvent;
g.getComputedStyle = win.getComputedStyle;
g.requestAnimationFrame = win.requestAnimationFrame.bind(win);
g.cancelAnimationFrame = win.cancelAnimationFrame.bind(win);
g.IS_REACT_ACT_ENVIRONMENT = true;
win.scrollTo = () => {};
g.scrollTo = () => {};
win.HTMLElement.prototype.scrollIntoView = function () {};

/* ---------------- Downloads ---------------- */
export const downloads: { href: string; download: string }[] = [];
win.URL.createObjectURL = () => "blob:mock/" + (downloads.length + 1);
win.URL.revokeObjectURL = () => {};
const originalAnchorClick = win.HTMLAnchorElement.prototype.click;
win.HTMLAnchorElement.prototype.click = function (this: any) {
  if (this.download) downloads.push({ href: this.href, download: this.download });
  else originalAnchorClick.call(this);
};

/* ---------------- Blob: keep the text of every file the app builds ---------------- */
export const blobTexts: string[] = [];
const OriginalBlob = win.Blob;
class SpyBlob extends OriginalBlob {
  constructor(parts?: any[], options?: any) {
    super(parts, options);
    blobTexts.push((parts ?? []).map((part) => String(part)).join(""));
  }
}
win.Blob = SpyBlob;
g.Blob = SpyBlob;

/* ---------------- Sound ---------------- */
export const sounds: string[] = [];
class MockAudio {
  volume = 1;
  constructor(readonly src: string) {}
  play() {
    sounds.push(this.src.slice(0, 32));
    return Promise.resolve();
  }
}
win.Audio = MockAudio;
g.Audio = MockAudio;

/* ---------------- Network: the app's fetch never leaves the test ---------------- */
export interface NetCall {
  url: string;
  init: any;
  at: number;
}
export const net: {
  calls: NetCall[];
  /** Where an intercepted call goes. By default every call is refused. */
  handler: (url: string, init: any) => Promise<any>;
} = {
  calls: [],
  handler: () => Promise.reject(new Error("no network in tests")),
};
const interceptedFetch = (url: any, init: any) => {
  net.calls.push({ url: String(url), init, at: Date.now() });
  return net.handler(String(url), init);
};
win.fetch = interceptedFetch;
g.fetch = interceptedFetch;

/* ---------------- Uncaught errors in the page ---------------- */
export const pageErrors: string[] = [];
win.addEventListener("error", (event: any) => pageErrors.push(String(event?.error?.stack ?? event?.message ?? event)));
process.on("unhandledRejection", (reason: any) => pageErrors.push("unhandled rejection: " + String(reason?.stack ?? reason)));
const originalConsoleError = console.error;
export const consoleErrors: string[] = [];
console.error = (...args: unknown[]) => {
  consoleErrors.push(args.map((arg) => String(arg)).join(" "));
  originalConsoleError(...args);
};

export const W = win;
export const D = win.document;

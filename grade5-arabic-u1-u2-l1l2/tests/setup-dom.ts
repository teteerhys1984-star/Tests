/**
 * إعداد بيئة DOM (jsdom) قبل استيراد React أو المكونات.
 */
import { JSDOM } from "jsdom";

export const dom = new JSDOM(
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
  { url: "https://local.test/grade5-arabic-u1-u2-l1l2/", pretendToBeVisual: true },
);

const win = dom.window as unknown as Record<string, unknown>;
const g = globalThis as Record<string, unknown>;

g.window = win;
g.document = win.document;
Object.defineProperty(g, "navigator", {
  value: win.navigator,
  configurable: true,
  writable: true,
});
g.self = win;
g.location = win.location;
g.history = win.history;
g.URL = win.URL;
g.HTMLElement = win.HTMLElement;
g.HTMLAnchorElement = win.HTMLAnchorElement;
g.HTMLInputElement = win.HTMLInputElement;
g.HTMLSelectElement = win.HTMLSelectElement;
g.HTMLButtonElement = win.HTMLButtonElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.MouseEvent = win.MouseEvent;
g.KeyboardEvent = win.KeyboardEvent;
g.IS_REACT_ACT_ENVIRONMENT = true;
win.scrollTo = () => {};
g.scrollTo = () => {};

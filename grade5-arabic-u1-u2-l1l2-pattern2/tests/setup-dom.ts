/**
 * إعداد بيئة DOM (jsdom) قبل استيراد React أو المكونات.
 * يجب أن يكون هذا أول استيراد في ملفات الاختبار التي تلمس الواجهة.
 */
import { JSDOM } from "jsdom";

export const dom = new JSDOM(
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
  { url: "https://local.test/grade5-arabic-u1-u2-l1l2-pattern2/", pretendToBeVisual: true },
);

const win = dom.window as unknown as Record<string, unknown>;
const globalScope = globalThis as Record<string, unknown>;

globalScope.window = win;
globalScope.document = win.document;
// في Node 21+ الخاصية navigator معرّفة بقارئ فقط، فالإسناد المباشر يرمي خطأً.
Object.defineProperty(globalScope, "navigator", {
  value: win.navigator,
  configurable: true,
  writable: true,
});
globalScope.self = win;
globalScope.location = win.location;
globalScope.history = win.history;
// التطبيق يستدعي URL.createObjectURL العام؛ يجب أن يكون URL الخاص بـ jsdom (المُعترَض في الاختبار)
globalScope.URL = win.URL;
globalScope.Blob = win.Blob;
globalScope.HTMLElement = win.HTMLElement;
globalScope.HTMLAnchorElement = win.HTMLAnchorElement;
globalScope.HTMLInputElement = win.HTMLInputElement;
globalScope.HTMLSelectElement = win.HTMLSelectElement;
globalScope.HTMLButtonElement = win.HTMLButtonElement;
globalScope.Element = win.Element;
globalScope.Node = win.Node;
globalScope.Event = win.Event;
globalScope.MouseEvent = win.MouseEvent;
globalScope.KeyboardEvent = win.KeyboardEvent;
globalScope.IS_REACT_ACT_ENVIRONMENT = true;
win.scrollTo = () => {};
globalScope.scrollTo = () => {};

#!/usr/bin/env node
/* ============================================================
   اختبارات سلوك بوابة الدخول — بلا أي اعتمادية خارجية.

   تشغيل:
       node landing/tests/gate.test.mjs

   السكربت يقرأ سكربت البوابة من landing/template.html ويشغّله داخل
   DOM وهمي صغير (getElementById / hidden / classList / sessionStorage)
   للتحقق من السلوك الفعلي: المنصة مخفية قبل كلمة المرور، وتظهر بعدها،
   ولا تُقبل كلمة مرور خاطئة، وتُحفظ الحالة في sessionStorage.
   ============================================================ */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createContext, Script } from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(HERE, "..", "template.html");
const PASSWORD = "somer2026"; // كلمة المرور الافتراضية الموثّقة في landing/README.md

const html = readFileSync(TEMPLATE, "utf8");
const match = html.match(/<script id="gate-script">([\s\S]*?)<\/script>/);
assert.ok(match, "gate-script block not found in landing/template.html");
const GATE_SOURCE = match[1];

class FakeStorage {
  constructor() {
    this.map = new Map();
    this.blocked = false;
    this.writes = 0;
  }
  getItem(key) {
    if (this.blocked) throw new Error("storage blocked");
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    if (this.blocked) throw new Error("storage blocked");
    this.writes += 1;
    this.map.set(key, String(value));
  }
  removeItem(key) {
    if (this.blocked) throw new Error("storage blocked");
    this.map.delete(key);
  }
  get length() {
    return this.map.size;
  }
}

class FakeElement {
  constructor(id, hidden = false) {
    this.id = id;
    this.hidden = hidden;
    this.value = "";
    this.textContent = "";
    this.focusCount = 0;
    this.offsetWidth = 0;
    this.listeners = new Map();
    this.attributes = new Map();
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
    };
  }
  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }
  dispatch(type, event = {}) {
    (this.listeners.get(type) || []).forEach((handler) => handler(event));
  }
  focus() {
    this.focusCount += 1;
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

/** يشغّل سكربت البوابة على DOM وهمي بالحالة الابتدائية للصفحة المنشورة. */
function boot({ storedSession = false, blockedStorage = false } = {}) {
  const elements = {
    gate: new FakeElement("gate", false),
    app: new FakeElement("app", true),
    "gate-form": new FakeElement("gate-form"),
    "gate-password": new FakeElement("gate-password"),
    "gate-error": new FakeElement("gate-error", true),
    stage: new FakeElement("stage"),
  };
  const storage = new FakeStorage();
  storage.blocked = blockedStorage;
  if (storedSession && !blockedStorage) {
    storage.setItem("tests-platform-gate-v1", "open");
    storage.writes = 0;
  }

  const document = {
    getElementById: (id) => elements[id] || null,
  };
  const window = { sessionStorage: storage };
  const sandbox = { document, window, Math, String, console };
  createContext(sandbox);
  new Script(GATE_SOURCE, { filename: "gate-script" }).runInContext(sandbox);

  return { gate: window.TestsGate, elements, storage };
}

test("المنصة مخفية والبواية ظاهرة قبل إدخال كلمة المرور", () => {
  const { gate, elements, storage } = boot();
  assert.equal(elements.app.hidden, true, "platform must start hidden");
  assert.equal(elements.gate.hidden, false, "gate must be visible");
  assert.equal(elements["gate-password"].value, "");
  assert.equal(storage.length, 0, "no session is stored yet");
  assert.equal(gate.isOpen(), false);
});

test("كلمة المرور الخاطئة لا تفتح المنصة ولا تُحفظ", () => {
  const { gate, elements, storage } = boot();
  const ok = gate.submit("كلمة-خاطئة");
  assert.equal(ok, false);
  assert.equal(elements.app.hidden, true, "platform stays hidden");
  assert.equal(elements.gate.hidden, false);
  assert.equal(elements["gate-error"].hidden, false, "error message shows");
  assert.equal(elements["gate-password"].value, "", "field is cleared");
  assert.ok(elements.gate.classList.contains("is-wrong"));
  assert.equal(storage.length, 0, "nothing is remembered");
});

test("كلمة المرور الصحيحة تفتح المنصة وتحفظ الجلسة", () => {
  const { gate, elements, storage } = boot();
  const ok = gate.submit(PASSWORD);
  assert.equal(ok, true);
  assert.equal(elements.app.hidden, false, "platform is revealed");
  assert.equal(elements.gate.hidden, true, "gate is hidden");
  assert.equal(elements["gate-error"].hidden, true);
  assert.equal(storage.getItem("tests-platform-gate-v1"), "open");
});

test("المسافات الزائدة حول كلمة المرور لا تمنع الدخول", () => {
  const { elements } = boot();
  elements["gate-form"].dispatch("submit", { preventDefault() {} });
  assert.equal(elements.app.hidden, true, "empty submit does nothing");
  elements["gate-password"].value = `  ${PASSWORD}  `;
  elements["gate-form"].dispatch("submit", { preventDefault() {} });
  assert.equal(elements.app.hidden, false);
});

test("زر الإرسال مربوط بالنموذج ويمنع إعادة تحميل الصفحة", () => {
  const { elements } = boot();
  let prevented = 0;
  elements["gate-password"].value = "wrong";
  elements["gate-form"].dispatch("submit", { preventDefault: () => (prevented += 1) });
  assert.equal(prevented, 1);
  assert.equal(elements.app.hidden, true);
});

test("جلسة محفوظة تفتح المنصة دون كلمة مرور (sessionStorage)", () => {
  const { elements, gate } = boot({ storedSession: true });
  assert.equal(elements.app.hidden, false);
  assert.equal(elements.gate.hidden, true);
  assert.equal(gate.isOpen(), true);
});

test("التخزين المحجوب لا يفتح المنصة تلقائيًا ولا يعطّل الصفحة", () => {
  const { elements, gate } = boot({ blockedStorage: true });
  assert.equal(elements.app.hidden, true, "fails closed");
  assert.equal(gate.isOpen(), false);
  // الدخول اليدوي يعمل حتى لو تعذّر الحفظ
  assert.equal(gate.submit(PASSWORD), true);
  assert.equal(elements.app.hidden, false);
});

test("البصمة تطابق كلمة المرور الموثّقة ولا تظهر كنص صريح في الملف", () => {
  const { gate } = boot();
  assert.equal(gate.check(PASSWORD), true);
  assert.equal(gate.check(""), false);
  assert.equal(gate.check(PASSWORD + "x"), false);
  assert.equal(gate.check(null), false);
  assert.equal(gate.hash(PASSWORD), gate.passwordHash);
  assert.equal(html.includes(PASSWORD), false,
    "the password itself must not be greppable in the template (hash only)");
});

test("مفتاح التخزين ثابت ومعلن للاختبارات الأخرى", () => {
  const { gate } = boot();
  assert.equal(gate.storageKey, "tests-platform-gate-v1");
  assert.equal(gate.sessionValue, "open");
});

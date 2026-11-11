import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html lang='ar'><body><div id='root'></div></body></html>", { url: "https://example.test/exam" });
const win: any = dom.window;
(globalThis as any).window = win;
(globalThis as any).document = win.document;
(globalThis as any).navigator = win.navigator;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).HTMLInputElement = win.HTMLInputElement;
(globalThis as any).Node = win.Node;
(globalThis as any).Event = win.Event;
(globalThis as any).MouseEvent = win.MouseEvent;
(globalThis as any).Blob = win.Blob;
(globalThis as any).URL = win.URL;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
win.scrollTo = () => {};
win.HTMLElement.prototype.attachEvent = function () {};
win.HTMLElement.prototype.detachEvent = function () {};
win.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
const downloads: any[] = [];
win.URL.createObjectURL = () => "blob:mock-report";
win.URL.revokeObjectURL = () => {};
win.HTMLAnchorElement.prototype.click = function () { downloads.push({ filename: this.download, href: this.href }); };
const audioPlays: string[] = [];
class MockAudio {
  volume = 1;
  src: string;
  constructor(src: string) { this.src = src; }
  play() { audioPlays.push(this.src.slice(0, 40)); return Promise.resolve(); }
  catch() {}
}
(globalThis as any).Audio = MockAudio;
win.Audio = MockAudio;
import { STORAGE_KEY } from "./src/exam/data";
let React: any, act: any, createRoot: any, App: any;

const sleep = (ms=0) => new Promise(r=>setTimeout(r,ms));
function setInput(el: any, value: string) {
  const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
  setter.call(el, value);
  el.focus();
  el.dispatchEvent(new win.InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  el.dispatchEvent(new win.Event("change", { bubbles: true }));
}
function byText(sel: string, text: string): any {
  return [...document.querySelectorAll(sel)].find((el:any)=>el.textContent?.includes(text));
}
async function click(el: any) { await act(async()=>{ el.dispatchEvent(new win.MouseEvent("click",{bubbles:true,cancelable:true})); await sleep(0); }); }
function stored(): any { const raw = win.localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
async function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async()=>{ root.render(React.createElement(App)); await sleep(0); });
  return { root, container };
}
const checks: string[] = [];
function expect(cond: boolean, label: string) { if (!cond) { checks.push("FAIL: " + label); } else console.log("ok -", label); }
async function fillCurrent() {
  const parts = [...document.querySelectorAll(".subpart")];
  expect(parts.length > 0, "subparts visible");
  for (const part of parts as any[]) {
    const numeric = part.querySelector(".numeric-input");
    if (numeric) await act(async()=>{ setInput(numeric, "10"); await sleep(0); });
    const fields = [...part.querySelectorAll(".field-box input")];
    for (const field of fields) await act(async()=>{ setInput(field, "1"); await sleep(0); });
    const choice = part.querySelector(".choice");
    if (choice) await click(choice);
    const symbol = part.querySelector(".symbol-button");
    if (symbol) await click(symbol);
    let guard = 0;
    while (part.querySelector(".order-bank .order-chip") && guard < 8) {
      await click(part.querySelector(".order-bank .order-chip"));
      guard++;
    }
  }
}

(async () => {
  React = await import("react");
  act = React.act;
  createRoot = (await import("react-dom/client")).createRoot;
  App = (await import("./src/App")).default;
  let { root, container } = await mount();
  expect(document.querySelector(".exam-title")?.textContent?.includes("آدم والرياضيات") === true, "welcome title");
  expect(!document.querySelector(".timer-value"), "no stopwatch on welcome");
  expect(document.body.textContent?.includes("0930215022"), "contact phone visible");
  const nameInput: any = document.getElementById("student-name");
  await click(byText("button", "بدء الاختبار"));
  expect(Boolean(document.querySelector(".field-error")), "blank name blocked");
  await act(async()=>{ setInput(nameInput, "آدم"); await sleep(20); });
  console.log("DEBUG input value", nameInput.value, "error", document.querySelector(".field-error")?.textContent);
  const startBtn: any = byText("button", "بدء الاختبار");
  console.log("DEBUG startBtn", !!startBtn, startBtn?.type, startBtn?.tagName);
  await click(startBtn);
  console.log("DEBUG after start storage", win.localStorage.getItem(STORAGE_KEY)?.slice(0,80), "timer", !!document.querySelector(".timer-value"), "welcome", !!document.querySelector(".exam-title"));
  expect(Boolean(document.querySelector(".timer-value")), "timer appears with first question");
  expect(audioPlays.length === 1, "start sound played once");
  const firstStored = stored();
  expect(firstStored?.studentName === "آدم", "start autosaved with name");
  expect(firstStored?.questionOrder?.length === 30, "30-question shuffled order saved");
  expect(firstStored?.attemptId?.length > 0, "attempt id created once");
  const originalId = firstStored.attemptId;
  const originalStart = firstStored.startTime;
  // answer first subpart using whatever type it is
  await fillCurrent();
  expect(stored()?.answers && Object.keys(stored().answers).length > 0, "answer change autosaved");
  // reload active attempt
  await act(async()=>{ root.unmount(); });
  const firstIndex = stored().currentIndex;
  ({root, container} = await mount());
  expect(!document.querySelector(".exam-title"), "active attempt never returns to welcome");
  expect(stored()?.attemptId === originalId, "attempt id preserved after reload");
  expect(stored()?.startTime === originalStart, "start timestamp preserved");
  expect(Boolean(document.querySelector(".timer-value")), "timer restored");
  expect(audioPlays.length === 1, "start sound not replayed on restore");
  expect((document.querySelector(".question-number")?.textContent || "").includes(String(firstIndex+1)), "current question restored");
  // review early: disabled
  await click([...document.querySelectorAll(".exam-nav button")].find((b:any)=>b.textContent?.includes("مراجعة الإجابات")));
  expect(document.body.textContent?.includes("الأجزاء غير المجابة المتبقية"), "review unanswered count");
  const earlySubmit: any = byText("button", "تسليم الاختبار");
  expect(earlySubmit?.disabled === true, "submit disabled until complete");
  await click(byText("button", "العودة إلى الأسئلة"));
  // fill all
  for (let i=0;i<30;i++) {
    const cell: any = [...document.querySelectorAll(".exam-sidebar .index-cell")][i];
    if (!cell) break;
    await click(cell);
    await fillCurrent();
  }
  const afterFill = stored();
  expect(Object.keys(afterFill.answers).length >= 71, "all subparts answered/autosaved");
  await click([...document.querySelectorAll(".exam-nav button")].find((b:any)=>b.textContent?.includes("مراجعة الإجابات")));
  const ready: any = byText("button", "تسليم الاختبار");
  expect(document.body.textContent?.includes("جميع الأجزاء المطلوبة مكتملة"), "review complete message");
  expect(ready?.disabled === false, "submit enabled when complete");
  downloads.length = 0;
  await click(ready);
  expect(Boolean(document.body.textContent?.includes("تم التسليم بنجاح")), "results immediate");
  expect(downloads.length === 1, "report downloaded once in same click");
  expect(downloads[0]?.filename.startsWith("Grade4_Mathematics_Adam_Report_") && downloads[0]?.filename.endsWith("_آدم.txt"), "report filename correct");
  expect(audioPlays.length === 2, "submission sound played once");
  const submitted = stored();
  expect(submitted?.phase === "results" && Boolean(submitted?.reportText), "submitted report persisted");
  expect(submitted?.reportText?.includes("آدم والرياضيات") && submitted?.reportText?.includes("المرجع الداخلي للكتاب"), "report includes required metadata/page refs");
  expect(document.body.textContent?.includes("تنزيل التقرير TXT"), "backup download button");
  expect(!document.body.textContent?.includes("ص 8"), "no page reference in student results");
  // refresh results
  await act(async()=>{ root.unmount(); });
  ({root, container} = await mount());
  expect(Boolean(document.body.textContent?.includes("تم التسليم بنجاح")), "results restored after refresh");
  expect(stored()?.attemptId === originalId, "results attempt id preserved");
  downloads.length = 0;
  await click(byText("button", "تنزيل التقرير TXT"));
  expect(downloads.length === 1 && downloads[0]?.filename === submitted.reportFileName, "backup same file and name");
  // try again
  await click(byText("button", "المحاولة مرة أخرى"));
  expect(Boolean(document.querySelector(".exam-title")) || Boolean(document.getElementById("student-name")), "try again returns to welcome");
  expect(!stored(), "try again clears active answers");
  expect(!document.getElementById("student-name")?.value, "name requested again");
  // teacher key
  await click(document.querySelector(".teacher-link"));
  expect(Boolean(byText("h3", "أدخل كلمة مرور المعلم")), "teacher gate shown");
  expect(!document.body.textContent?.includes("الجذر التربيعي"), "no key content before password");
  await click(byText("button", "دخول المفتاح"));
  expect(Boolean(document.body.textContent?.includes("كلمة المرور غير صحيحة")), "wrong key password rejected");
  const pw: any = document.getElementById("teacher-password");
  await act(async()=>{ setInput(pw, "somer173"); await sleep(0); });
  await click(byText("button", "دخول المفتاح"));
  expect(Boolean(document.body.textContent?.includes("دليل المعلم ومفتاح التصحيح")) && Boolean(document.body.textContent?.includes("بدائل مقبولة")), "teacher key unlocks with full details");
  expect(!document.body.textContent?.includes("somer173"), "password not displayed");
  // close modal and start fresh attempt
  await click(document.querySelector(".icon-button"));
  const name2: any = document.getElementById("student-name");
  await act(async()=>{ setInput(name2, "آدم"); await sleep(0); });
  await click(byText("button", "بدء الاختبار"));
  expect(stored()?.attemptId !== originalId, "fresh attempt gets a new attempt id");
  expect(stored()?.currentIndex === 0, "fresh attempt starts at first question");
  console.log(checks.length ? `\nDOM TEST FAILURES:\n${checks.join("\n")}` : "\nDOM TESTS PASSED");
  setTimeout(()=>process.exit(checks.length ? 1 : 0), 10);
})().catch(err=>{ console.error("DOM TEST ERROR", err); setTimeout(()=>process.exit(1),10); });

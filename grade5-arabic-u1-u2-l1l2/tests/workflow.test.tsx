/**
 * اختبار تدفّق الواجهة الكامل عبر React + jsdom مع Mock fetch (لا اتصال حقيقي):
 *  - واجهة الترحيب + مفتاح الإجابة للمعلم (إصلاح كلمة المرور وحقل الإدخال).
 *  - عدم تكرار «السؤال 1: السؤال الأول:» في العرض.
 *  - تسطير الكلمات المخطوطة في q3b و q9c.
 *  - الإجابة عن الـ 45 فرعاً كلها، ثم التسليم أثناء تعطل الشبكة:
 *      * تظهر النتيجة فوراً (100/100) ولا يُمنع الطالب من رؤيتها.
 *      * زر تحميل التقرير TXT يعمل بلا إنترنت.
 *      * يُحفظ المعلّق في localStorage.
 *      * يظهر زر مستقل «إعادة إرسال النتيجة» عند فشل الإرسال، وعند الضغط عليه
 *        بعد عودة الخادم الوهمي تُرسل المحاولة بالـ attemptId نفسه دون تكرار.
 */
import "./setup-dom";
import { dom } from "./setup-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";
import { EXAM_ID } from "../src/config";
import { QUESTIONS } from "../src/data/questions";
import { pendingKey, type SubmissionPayload } from "../src/lib/submit";

let failures = 0;
let finished = false;
process.exitCode = 1;
process.on("exit", () => {
  if (!finished) console.log("\n❌ لم يكتمل اختبار التدفّق");
});

function check(name: string, cond: boolean, extra = "") {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  } else {
    console.log("  ✓ " + name + (extra ? " → " + extra : ""));
  }
}

// محاكاة URL.createObjectURL / revokeObjectURL لاختبار تنزيل التقرير
const downloadedFiles: { download: string; size: number }[] = [];
dom.window.URL.createObjectURL = (blob: Blob) => {
  downloadedFiles.push({ download: "", size: blob.size });
  return "blob:mock-report";
};
dom.window.URL.revokeObjectURL = () => {};

const origAnchorClick = dom.window.HTMLAnchorElement.prototype.click;
dom.window.HTMLAnchorElement.prototype.click = function (
  this: HTMLAnchorElement,
) {
  if (this.download) {
    if (downloadedFiles.length > 0) {
      downloadedFiles[downloadedFiles.length - 1].download = this.download;
    }
  } else {
    origAnchorClick.call(this);
  }
};

let serverShouldFail = true;
const sentPayloads: SubmissionPayload[] = [];
const mockFetch = async (_url: string, init?: RequestInit) => {
  if (init?.body) {
    sentPayloads.push(JSON.parse(String(init.body)) as SubmissionPayload);
  }
  if (serverShouldFail) throw new TypeError("Failed to fetch");
  return {
    text: async () => JSON.stringify({ ok: true }),
  } as Response;
};
Object.defineProperty(globalThis, "fetch", { value: mockFetch, configurable: true });
Object.defineProperty(dom.window, "fetch", { value: mockFetch, configurable: true });

// تسريع الانتظار في الاختبار دون تعديل RETRY_DELAYS_MS
const realSetTimeout = globalThis.setTimeout;
(globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
  cb: (...args: unknown[]) => void,
  ms?: number,
  ...args: unknown[]
) => {
  const capped = typeof ms === "number" && ms >= 1000 ? 1 : ms;
  return realSetTimeout(cb, capped, ...args);
}) as typeof setTimeout;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLSelectElement.prototype,
    "value",
  )!.set!;
  setter.call(select, value);
  select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

function findButton(textPart: string): HTMLButtonElement | undefined {
  return [...dom.window.document.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(textPart),
  );
}

async function flush() {
  await act(async () => {
    await new Promise((r) => realSetTimeout(r, 30));
  });
}

async function run() {
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(App));
  });

  console.log("\n== 1) شاشة الترحيب وواجهة المعلم ==");
  check("العنصر الجذري RTL", container.querySelector('[dir="rtl"]') !== null);
  const teacherBtn = findButton("مفتاح الإجابة للمعلم");
  check("زر المعلم موجود", !!teacherBtn);

  await act(async () => {
    teacherBtn!.click();
  });
  const pwdInput = container.querySelector(
    'input[type="password"]',
  ) as HTMLInputElement;
  check(
    "حقل كلمة مرور المعلم بخلفية بيضاء واضحة",
    !!pwdInput && pwdInput.className.includes("bg-white"),
  );
  await act(async () => {
    setInputValue(pwdInput, "wrong");
  });
  await act(async () => {
    findButton("دخول")!.click();
  });
  check(
    "كلمة مرور خاطئة تعرض تنبيهاً ضمن الصفحة بلا window.alert",
    (container.textContent ?? "").includes("كلمة المرور غير صحيحة"),
  );
  await act(async () => {
    setInputValue(pwdInput, "somer173");
  });
  await act(async () => {
    findButton("دخول")!.click();
  });
  check(
    "فتح دليل المعلم بكلمة المرور الصحيحة",
    (container.textContent ?? "").includes("15 سؤالاً رئيسياً"),
  );
  await act(async () => {
    findButton("العودة")!.click();
  });

  console.log("\n== 2) بدء الاختبار والإجابة عن الأسئلة الـ 15 ==");
  const nameInput = container.querySelector(
    "#student-name-input",
  ) as HTMLInputElement;
  await act(async () => {
    setInputValue(nameInput, "  زيد سامر  ");
  });
  await act(async () => {
    findButton("ابدأ الاختبار")!.click();
  });

  check(
    "بدء الاختبار بنجاح وعدم تكرار «السؤال 1: السؤال الأول:»",
    (container.textContent ?? "").includes("السؤال الأول:") &&
      !(container.textContent ?? "").includes("السؤال 1: السؤال الأول:"),
  );

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi];
    await act(async () => {
      const navBtns = [...container.querySelectorAll("button")].filter(
        (b) => b.textContent?.trim() === String(q.order),
      );
      navBtns[navBtns.length - 1].click();
    });

    if (q.id === "q3") {
      const underlined = [...container.querySelectorAll("u")].map(
        (u) => u.textContent,
      );
      check("تسطير الكلمة المخطوطة في q3b", underlined.includes("أَنْجازاتِهِمْ"));
    }
    if (q.id === "q9") {
      const underlined = [...container.querySelectorAll("u")].map(
        (u) => u.textContent,
      );
      check("تسطير الكلمة المخطوطة في q9c", underlined.includes("إسْتَعْلَمَ"));
    }

    for (const b of q.branches) {
      if (b.type === "single_choice" || b.type === "true_false") {
        const idx = b.choices!.findIndex((c) => c.id === b.correctChoiceId);
        const radios = [
          ...container.querySelectorAll(
            `input[type="radio"][name="${b.id}"]`,
          ),
        ] as HTMLInputElement[];
        await act(async () => {
          radios[idx].click();
        });
      } else if (b.type === "multi_choice") {
        const labels = [...container.querySelectorAll("label")];
        for (const cid of b.correctChoiceIds!) {
          const text = b.choices!.find((c) => c.id === cid)!.text;
          const lbl = labels.find((l) => (l.textContent ?? "").includes(text));
          const cb = lbl?.querySelector(
            'input[type="checkbox"]',
          ) as HTMLInputElement;
          await act(async () => {
            cb.click();
          });
        }
      } else if (b.type === "fill_blank") {
        const textInputs = [
          ...container.querySelectorAll('input[type="text"]'),
        ] as HTMLInputElement[];
        const fillIdx = q.branches
          .filter((x) => x.type === "fill_blank")
          .findIndex((x) => x.id === b.id);
        await act(async () => {
          setInputValue(textInputs[fillIdx], b.acceptedAnswers![0]);
        });
      } else if (b.type === "classify") {
        for (const it of b.items!) {
          const catIdx = b.categories!.findIndex(
            (c) => c.id === it.correctCategoryId,
          );
          const radios = [
            ...container.querySelectorAll(
              `input[type="radio"][name="${b.id}_${it.id}"]`,
            ),
          ] as HTMLInputElement[];
          await act(async () => {
            radios[catIdx].click();
          });
        }
      } else if (b.type === "match") {
        const selects = [
          ...container.querySelectorAll("select"),
        ] as HTMLSelectElement[];
        const matchOffset = q.branches
          .slice(0, q.branches.indexOf(b))
          .filter((x) => x.type === "match")
          .reduce((s, x) => s + x.pairs!.length, 0);
        for (let pi = 0; pi < b.pairs!.length; pi++) {
          await act(async () => {
            setSelectValue(selects[matchOffset + pi], b.pairs![pi].right);
          });
        }
      }
    }
  }

  check(
    "العداد يظهر اكتمال الـ 45 فرعاً",
    (container.textContent ?? "").includes("45/45"),
  );

  console.log("\n== 3) التسليم عند فشل الشبكة ثم إعادة الإرسال ==");
  const submitBtn = findButton("تسليم الاختبار")!;
  check("زر التسليم مفعّل بعد إكمال جميع الفروع", !submitBtn.disabled);

  await act(async () => {
    submitBtn.click();
  });

  check(
    "صفحة النتيجة تظهر فوراً رغم تعطل الشبكة",
    (container.textContent ?? "").includes("نتيجة الاختبار"),
  );
  check(
    "العلامة 100 / 100 ظاهرة للطالب",
    (container.textContent ?? "").includes("100 / 100"),
  );

  await flush();
  await flush();

  const statusBanner = container.querySelector('[data-send-status="failed"]');
  check(
    "شريط الحالة يعرض فشل الإرسال وزر إعادة الإرسال المستقل",
    !!statusBanner && !!findButton("إعادة إرسال النتيجة"),
  );
  check(
    "سجّل 3 محاولات فاشلة بالحمولة نفسها",
    sentPayloads.length === 3 &&
      new Set(sentPayloads.map((p) => p.attemptId)).size === 1,
  );

  const attemptId = sentPayloads[0].attemptId;
  check(
    "النتيجة المعلّقة محفوظة في localStorage تحت pending:<EXAM_ID>:<attemptId>",
    dom.window.localStorage.getItem(pendingKey(attemptId)) !== null &&
      sentPayloads[0].examId === EXAM_ID,
  );

  await act(async () => {
    findButton("تحميل التقرير (TXT)")!.click();
  });
  check(
    "تنزيل التقرير TXT يعمل بلا شبكة",
    downloadedFiles.length === 1 &&
      downloadedFiles[0].download.includes("زيد_سامر") &&
      downloadedFiles[0].size > 1000,
  );

  serverShouldFail = false;
  await act(async () => {
    findButton("إعادة إرسال النتيجة")!.click();
  });
  await flush();

  check(
    "نجاح الإرسال عند الضغط على زر إعادة الإرسال",
    !!container.querySelector('[data-send-status="success"]'),
  );
  check(
    "أُرسل بالـ attemptId نفسه تماماً (منع التكرار)",
    sentPayloads.length === 4 && sentPayloads[3].attemptId === attemptId,
  );
  check(
    "حُذف المفتاح المعلّق من localStorage بعد النجاح",
    dom.window.localStorage.getItem(pendingKey(attemptId)) === null,
  );

  await act(async () => {
    root.unmount();
  });
}

run()
  .catch((err) => {
    failures++;
    console.log(
      "  ✗ استثناء غير متوقع: " + String(err && err.stack ? err.stack : err),
    );
  })
  .finally(() => {
    finished = true;
    console.log(
      failures ? `\n❌ ${failures} فشل` : "\n✅ كل فحوص التدفّق والواجهة ناجحة",
    );
    process.exit(failures ? 1 : 0);
  });

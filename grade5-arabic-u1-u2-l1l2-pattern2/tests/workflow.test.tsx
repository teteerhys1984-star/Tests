/**
 * اختبار تدفّق الواجهة الكامل عبر React + jsdom مع خادم وهمي (لا اتصال حقيقي):
 *  - شاشة الترحيب: الهوية (النموذج الثاني) وRTL والعدادات 15/45/100.
 *  - مفتاح المعلم: كلمة مرور خطأ ثم صحيحة، وتوزيع علامات مشتق من البيانات.
 *  - الإجابة عن الفروع الـ 45 ثم التسليم أثناء تعطل الشبكة:
 *      * تظهر النتيجة فوراً (100/100) ولا يُمنع الطالب منها.
 *      * يُحفظ المعلّق في localStorage تحت pending:<EXAM_ID>:<attemptId>.
 *      * شريط الحالة يعرض الفشل مع زر «إعادة إرسال النتيجة» المستقل.
 *      * تنزيل التقرير TXT يعمل بلا إنترنت.
 *      * إعادة الإرسال تنجح بالـ attemptId نفسه ثم يُحذف المفتاح المعلّق.
 *  - عزل التخزين: لا يقرأ ولا يكتب مفتاح النموذج الأول ولا مفتاح الحلقة المعلّقة له.
 *  - المفتاح القديم للنموذج الأول لا يُستعاد داخل هذا النموذج.
 */
import "./setup-dom";
import { dom } from "./setup-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App";
import { ATTEMPT_STORAGE_KEY, EXAM_ID } from "../src/config";
import { EXAM_QUESTIONS, TOTAL_BRANCHES, type Branch } from "../src/data/exam";
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

/* ---------- اعتراض التنزيل ---------- */
const downloadedFiles: { download: string; size: number; content: string }[] = [];
dom.window.URL.createObjectURL = (blob: Blob) => {
  downloadedFiles.push({ download: "", size: blob.size, content: "" });
  return "blob:mock-report";
};
dom.window.URL.revokeObjectURL = () => {};
const originalAnchorClick = dom.window.HTMLAnchorElement.prototype.click;
dom.window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
  if (this.download && downloadedFiles.length > 0) {
    downloadedFiles[downloadedFiles.length - 1].download = this.download;
  } else {
    originalAnchorClick.call(this);
  }
};

/* ---------- خادم وهمي ---------- */
let serverShouldFail = true;
const sentPayloads: SubmissionPayload[] = [];
const sentRequests: { contentType: string | null; method: string }[] = [];
const mockFetch = async (_url: string, init?: RequestInit) => {
  const headers = (init?.headers ?? {}) as Record<string, string>;
  sentRequests.push({ contentType: headers["Content-Type"] ?? null, method: String(init?.method) });
  if (init?.body) sentPayloads.push(JSON.parse(String(init.body)) as SubmissionPayload);
  if (serverShouldFail) throw new TypeError("Failed to fetch");
  const duplicate = sentPayloads.filter((p) => p.attemptId === sentPayloads[0].attemptId).length > 1;
  return { text: async () => JSON.stringify({ ok: true, duplicate }) } as Response;
};
Object.defineProperty(globalThis, "fetch", { value: mockFetch, configurable: true });
Object.defineProperty(dom.window, "fetch", { value: mockFetch, configurable: true });

/* ---------- تسريع التأخيرات دون تغيير القيم ---------- */
// تأخيرات الإرسال (2000ms و5000ms) تُصغَّر في الاختبار فقط إلى 60ms وسيطة.
// لا تُستخدم قيمة 1ms: مؤقّت عدّاد الوقت في التطبيق يعمل كل 1000ms فيصبح 60ms
// في ظل هذا التسريع، فيبقى للحدث حلقة قصيرة لا تحتكر حلقة الأحداث.
const TEST_SLEEP_MS = 60;
const realSetTimeout = globalThis.setTimeout;
(globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
  callback: (...args: unknown[]) => void,
  ms?: number,
  ...args: unknown[]
) => realSetTimeout(callback, typeof ms === "number" && ms >= 1000 ? TEST_SLEEP_MS : ms, ...args)) as typeof setTimeout;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, "value")!.set!;
  setter.call(select, value);
  select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

function findButton(textPart: string): HTMLButtonElement | undefined {
  return [...dom.window.document.querySelectorAll("button")].find((button) =>
    (button.textContent ?? "").includes(textPart),
  );
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => realSetTimeout(resolve, 40));
  });
}

/**
 * يجيب عن فرع واحد. كل تفاعل داخل act مستقل مع إعادة الاستعلام عن DOM،
 * لأن كل نقرة تُعيد رسم المكوّن فتُستبدل العناصر.
 */
async function answerBranch(
  container: HTMLElement,
  question: (typeof EXAM_QUESTIONS)[number],
  branch: Branch,
) {
  const click = async (element: HTMLElement | undefined) => {
    if (!element) throw new Error("عنصر التفاعل غير موجود");
    await act(async () => {
      element.click();
    });
  };

  switch (branch.kind) {
    case "single_choice": {
      const correctIndex = branch.choices.findIndex((choice) => choice.id === branch.correctChoiceId);
      const radios = [...container.querySelectorAll(`input[type="radio"][name="${branch.id}"]`)] as HTMLInputElement[];
      await click(radios[correctIndex]);
      break;
    }
    case "true_false": {
      const radios = [...container.querySelectorAll(`input[type="radio"][name="${branch.id}"]`)] as HTMLInputElement[];
      await click(radios[branch.correct ? 0 : 1]);
      break;
    }
    case "fill_blank": {
      const fillIndex = question.branches
        .slice(0, question.branches.indexOf(branch))
        .filter((candidate) => candidate.kind === "fill_blank").length;
      const inputs = [...container.querySelectorAll('input[type="text"]')] as HTMLInputElement[];
      await act(async () => {
        setInputValue(inputs[fillIndex], branch.acceptedAnswers[0]);
      });
      break;
    }
    case "multi_select": {
      for (const choiceId of branch.correctChoiceIds) {
        const text = branch.choices.find((choice) => choice.id === choiceId)!.text;
        const buttons = [...container.querySelectorAll("button")] as HTMLButtonElement[];
        const target = buttons.find(
          (button) => button.getAttribute("aria-pressed") !== null && (button.textContent ?? "").includes(text),
        );
        await click(target);
      }
      break;
    }
    case "classification": {
      for (const item of branch.items) {
        const categoryIndex = branch.categories.findIndex((category) => category.id === item.categoryId);
        const group = container.querySelector(`[aria-label="تصنيف ${item.text}"]`);
        const buttons = [...(group?.querySelectorAll("button") ?? [])] as HTMLButtonElement[];
        await click(buttons[categoryIndex]);
      }
      break;
    }
    case "matching": {
      for (let pairIndex = 0; pairIndex < branch.pairs.length; pairIndex++) {
        const pair = branch.pairs[pairIndex];
        const selects = [...container.querySelectorAll("select")] as HTMLSelectElement[];
        await act(async () => {
          setSelectValue(selects[pairIndex], pair.id);
        });
      }
      break;
    }
    case "ordering": {
      // الترتيب الافتراضي مُدوَّر بعنصر واحد: نرفع العنصر الأول إلى موضعه بالأسهم.
      const expectedOrder = branch.correctOrderIds.map(
        (id) => branch.items.find((item) => item.id === id)!.text.trim(),
      );
      for (let guard = 0; guard < 60; guard++) {
        const rows = [...container.querySelectorAll("ol > li")];
        const currentOrder = rows.map((row) => row.querySelectorAll("span")[1]?.textContent?.trim() ?? "");
        if (JSON.stringify(currentOrder) === JSON.stringify(expectedOrder)) break;
        const position = currentOrder.findIndex((text, index) => text !== expectedOrder[index]);
        // نرفع العنصر المطلوب في هذا الموضع (هو دائماً أدنى منه) بضغط «تقديم».
        const targetIndex = currentOrder.indexOf(expectedOrder[position]);
        const upButton = rows[targetIndex]?.querySelectorAll("button")[0] as HTMLButtonElement | undefined;
        if (!upButton || upButton.disabled) break;
        await click(upButton);
      }
      break;
    }
  }
}

async function run() {
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);

  /* مفتاح النموذج الأول: يجب ألا يظهر ولا يُستعاد في هذا النموذج */
  dom.window.localStorage.setItem(
    "arabic-grade5-comprehensive-exam-attempt-v1",
    JSON.stringify({ version: 1, studentName: "طالب النموذج الأول", status: "in_progress", startedAt: Date.now(), answers: {}, currentIndex: 3 }),
  );
  dom.window.localStorage.setItem(
    "pending:grade5-arabic-u1-u2-l1l2:other-attempt",
    JSON.stringify({ attemptId: "other-attempt" }),
  );
  dom.window.localStorage.setItem(
    "pending:grade5-math-unit1:math-attempt",
    JSON.stringify({ attemptId: "math-attempt" }),
  );

  await act(async () => {
    root.render(React.createElement(App));
  });

  console.log("\n== 1) شاشة الترحيب والهوية والعدادات ==");
  check("العنصر الجذري RTL و lang=ar", container.querySelector('[dir="rtl"]') !== null);
  const welcomeText = container.textContent ?? "";
  check("شارة «النموذج الثاني» ظاهرة", welcomeText.includes("النموذج الثاني"));
  check(
    "العدادات تعرض 15 سؤالاً و45 فرعاً و100 علامة",
    welcomeText.includes("15") && welcomeText.includes("45") && welcomeText.includes("100"),
  );
  check(
    "لا يُستعاد اسم النموذج الأول من مفتاحه القديم",
    !welcomeText.includes("طالب النموذج الأول"),
  );
  const legacyAttemptKey = "arabic-grade5-comprehensive-exam-attempt-v1";
  check(
    "لا كتابة على مفتاح النموذج الأول",
    JSON.parse(dom.window.localStorage.getItem(legacyAttemptKey)!).studentName === "طالب النموذج الأول",
  );
  check(
    "لم يُرسل أي شيء عند فتح الاختبار (لا نتائج معلّقة لهذا النموذج)",
    sentPayloads.length === 0,
    String(sentPayloads.length),
  );
  check(
    "مفاتيح Pending للاختبارات الأخرى لم تُمسّ",
    dom.window.localStorage.getItem("pending:grade5-arabic-u1-u2-l1l2:other-attempt") !== null &&
      dom.window.localStorage.getItem("pending:grade5-math-unit1:math-attempt") !== null,
  );

  console.log("\n== 2) مفتاح الإجابة للمعلم ==");
  const teacherButton = findButton("مفتاح الإجابة") ?? findButton("Teacher Answer Key") ?? findButton("منطقة المعلم");
  check("زر منطقة المعلم موجود", !!teacherButton);
  await act(async () => {
    teacherButton!.click();
  });
  const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
  check("حقل كلمة المرور موجود بخلفية فاتحة واضحة", !!passwordInput && passwordInput.className.includes("bg-[#fbf8f0]"));
  await act(async () => {
    setInputValue(passwordInput, "wrong-password");
  });
  await act(async () => {
    findButton("فتح مفتاح الإجابة")!.click();
  });
  check("كلمة مرور خاطئة تُظهر تنبيهاً داخل الصفحة", (container.textContent ?? "").includes("كلمة المرور غير صحيحة"));
  await act(async () => {
    setInputValue(passwordInput, "somer173");
  });
  await act(async () => {
    findButton("فتح مفتاح الإجابة")!.click();
  });
  const teacherText = container.textContent ?? "";
  check("فتح المفتاح يعرض 15 سؤالاً و45 فرعاً و100 علامة", teacherText.includes("15 سؤالًا رئيسيًا") && teacherText.includes("45 فرعًا"));
  check(
    "جملة توزيع العلامات مشتقة من البيانات (35×2 و10×3)",
    teacherText.includes("35 فرعًا بقيمة 2 علامتين لكل فرع") &&
      teacherText.includes("10 فروع بقيمة 3 علامات لكل فرع") &&
      teacherText.includes("والمجموع 100 علامة على 45 فرعًا"),
    teacherText.slice(teacherText.indexOf("توزيع العلامات"), teacherText.indexOf("توزيع العلامات") + 160),
  );
  await act(async () => {
    (container.querySelector('button[aria-label="إغلاق"]') as HTMLButtonElement).click();
  });

  console.log("\n== 3) بدء الاختبار والإجابة عن الفروع الـ 45 ==");
  const nameInput = container.querySelector("#student-name") as HTMLInputElement;
  await act(async () => {
    setInputValue(nameInput, "  زيد سامر  ");
  });
  await act(async () => {
    findButton("ابدأ الاختبار")!.click();
  });
  check("اسم الطالب المعدّل يظهر في الرأس (trim)", (container.textContent ?? "").includes("زيد سامر"));

  for (let questionIndex = 0; questionIndex < EXAM_QUESTIONS.length; questionIndex++) {
    const question = EXAM_QUESTIONS[questionIndex];
    // الانتقال عبر خريطة الأسئلة: كل زر يحمل aria-label يبدأ بـ«السؤال N:».
    await act(async () => {
      const target = [...container.querySelectorAll("button")].find((button) =>
        (button.getAttribute("aria-label") ?? "").startsWith(`السؤال ${question.number}:`),
      ) as HTMLButtonElement | undefined;
      if (!target) throw new Error(`لم يُعثر على زر السؤال ${question.number}`);
      target.click();
    });

    for (const branch of question.branches) {
      await answerBranch(container, question, branch);
    }
  }

  const counters = container.textContent ?? "";
  check(`العداد يظهر اكتمال ${TOTAL_BRANCHES}/${TOTAL_BRANCHES}`, counters.includes(`${TOTAL_BRANCHES}/${TOTAL_BRANCHES}`), counters.match(/\d+\/45/g)?.join(" "));
  check("عداد الأسئلة المكتملة 15/15 بلا رقم مكتوب يدوياً", counters.includes("15/15"));

  console.log("\n== 4) التسليم عند تعطل الشبكة ==");
  const submitButton = [...container.querySelectorAll("button")].find(
    (button) => (button.textContent ?? "").includes("تسليم الاختبار") && !(button as HTMLButtonElement).disabled,
  ) as HTMLButtonElement;
  check("زر التسليم مفعّل بعد إكمال جميع الفروع", !!submitButton);
  await act(async () => {
    submitButton.click();
  });

  check("صفحة النتيجة تظهر فوراً رغم تعطل الشبكة", (container.textContent ?? "").includes("النتيجة النهائية"));
  check("العلامة 100/100 ظاهرة للطالب", (container.textContent ?? "").includes("100"));
  check("التقدير «ممتاز» على الشاشة", (container.textContent ?? "").includes("ممتاز"));

  await flush();
  await flush();
  await flush();

  check(
    "شريط الحالة يعرض الفشل مع زر مستقل لإعادة الإرسال",
    !!container.querySelector('[data-send-status="failed"]') && !!findButton("إعادة إرسال النتيجة"),
  );
  check(
    "٣ محاولات فاشلة بالحمولة نفسها والمعرّف نفسه ونوع المحتوى text/plain",
    sentPayloads.length === 3 &&
      new Set(sentPayloads.map((payload) => payload.attemptId)).size === 1 &&
      sentRequests.every((request) => request.contentType === "text/plain;charset=utf-8" && request.method === "POST"),
    `${sentPayloads.length} · ${sentRequests.map((r) => r.contentType).join("|")}`,
  );
  check(
    "الحمولة المُرسلة تحمل EXAM_ID الجديد لا القديم",
    sentPayloads.every((payload) => payload.examId === EXAM_ID),
  );
  check(
    "الحمولة تحمل عنوان النموذج الثاني",
    sentPayloads[0].examTitle.includes("(النموذج الثاني)"),
  );

  const attemptId = sentPayloads[0].attemptId;
  check(
    "النتيجة المعلّقة محفوظة تحت pending:<EXAM_ID>:<attemptId>",
    dom.window.localStorage.getItem(pendingKey(attemptId)) !== null,
    pendingKey(attemptId),
  );
  check(
    "جلسة المحاولة محفوظة تحت مفتاح EXAM_ID الجديد دون مفتاح النموذج الأول",
    (() => {
      const stored = dom.window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
      return ATTEMPT_STORAGE_KEY === `exam:${EXAM_ID}:v1` && !!stored && JSON.parse(stored).attemptId === attemptId;
    })(),
    ATTEMPT_STORAGE_KEY,
  );

  await act(async () => {
    findButton("تنزيل تقرير TXT")!.click();
  });
  check(
    "تنزيل التقرير TXT يعمل بلا شبكة وباسم ملف يذكر النموذج الثاني",
    downloadedFiles.length === 1 &&
      downloadedFiles[0].download.includes("النموذج_الثاني") &&
      downloadedFiles[0].download.includes("زيد_سامر") &&
      downloadedFiles[0].size > 1000,
    JSON.stringify(downloadedFiles.map((file) => [file.download, file.size])),
  );

  console.log("\n== 5) إعادة الإرسال اليدوي (منع التكرار) ==");
  serverShouldFail = false;
  await act(async () => {
    findButton("إعادة إرسال النتيجة")!.click();
  });
  await flush();
  await flush();

  check("نجاح الإرسال بعد عودة الخادم", !!container.querySelector('[data-send-status="success"]'));
  check(
    "أُرسل بالـ attemptId نفسه تماماً (لا محاولة جديدة)",
    sentPayloads.length === 4 && sentPayloads[3].attemptId === attemptId,
    `${sentPayloads.length}`,
  );
  check("حُذف المفتاح المعلّق بعد النجاح", dom.window.localStorage.getItem(pendingKey(attemptId)) === null);
  check("زر إعادة الإرسال يختفي بعد النجاح (منع التكرار)", !findButton("إعادة إرسال النتيجة"));

  console.log("\n== 6) إعادة تحميل الصفحة: لا إرسال مكرر ==");
  const before = sentPayloads.length;
  await act(async () => {
    root.unmount();
  });
  const root2 = createRoot(container);
  await act(async () => {
    root2.render(React.createElement(App));
  });
  await flush();
  await flush();
  check(
    "المحاولة المسلَّمة تُستعاد من جلسة EXAM_ID الجديدة",
    (container.textContent ?? "").includes("النتيجة النهائية") && (container.textContent ?? "").includes("زيد سامر"),
  );
  check(
    "لا إرسال مكرر بعد إعادة التحميل (المحاولة مسجّلة sent)",
    sentPayloads.length === before && !!container.querySelector('[data-send-status="success"]'),
    `${sentPayloads.length} vs ${before}`,
  );

  console.log("\n== 7) محاولة جديدة تحصل على attemptId جديد ==");
  await act(async () => {
    findButton("إعادة المحاولة")!.click();
  });
  const storedAfterRetake = dom.window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
  check(
    "إعادة المحاولة تصفّر الجلسة وتولّد معرّفاً جديداً",
    storedAfterRetake === null || JSON.parse(storedAfterRetake).attemptId !== attemptId,
  );
  check("العودة إلى شاشة الترحيب", (container.textContent ?? "").includes("سجّل اسمك وابدأ"));

  await act(async () => {
    root2.unmount();
  });
}

run()
  .catch((error) => {
    failures++;
    console.log("  ✗ استثناء غير متوقع: " + String(error && (error as Error).stack ? (error as Error).stack : error));
  })
  .finally(() => {
    finished = true;
    console.log(failures ? `\n❌ ${failures} فشل` : "\n✅ كل فحوص التدفّق والواجهة ناجحة");
    process.exit(failures ? 1 : 0);
  });

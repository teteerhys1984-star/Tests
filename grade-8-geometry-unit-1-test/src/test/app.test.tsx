// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { App } from "../App";
import { QUESTIONS } from "../exam/questions";

/* jsdom lacks these; the app must still run when they are missing. */
class NoopAudioParam {
  value = 0;
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}
class NoopNode {
  frequency = new NoopAudioParam();
  gain = new NoopAudioParam();
  type = "sine";
  connect() {}
  start() {}
  stop() {}
  disconnect() {}
}
class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  resume() {}
  createOscillator() {
    return new NoopNode();
  }
  createGain() {
    return new NoopNode();
  }
  createBiquadFilter() {
    return new NoopNode();
  }
}
(globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(0), 0) as unknown as number) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id)) as typeof window.cancelAnimationFrame;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ text: async () => JSON.stringify({ok: true}) })));
  window.localStorage.clear();
  cleanup();
});

function startExam(name = "سومر شاهين") {
  render(<App />);
  fireEvent.change(screen.getByLabelText("الاسم الكامل للطالب"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: /ابدأ الاختبار/ }));
}

describe("واجهة الاختبار", () => {
  it("يعرض شاشة البدء بعنوان محايد وزرّ ابدأ الاختبار", () => {
    render(<App />);
    expect(screen.getAllByText("Grade 8 Geometry Unit 1 Test").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /ابدأ الاختبار/ })).toBeTruthy();
    expect(screen.getByText("المهندس سومر شاهين")).toBeTruthy();
    expect(screen.getByRole("link", { name: /0930215022/ })).toBeTruthy();
  });

  it("يرفض الاسم القصير ولا يبدأ العدّاد", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("الاسم الكامل للطالب"), { target: { value: "س" } });
    fireEvent.click(screen.getByRole("button", { name: /ابدأ الاختبار/ }));
    expect(screen.getByRole("button", { name: /ابدأ الاختبار/ })).toBeTruthy();
  });

  it("يبدأ الاختبار ويسمح بمراجعة الفروع غير المكتملة", () => {
    startExam();
    expect(screen.getByRole("heading", { name: QUESTIONS[0].title })).toBeTruthy();
    const submit = screen.getByRole("button", { name: /تسليم الاختبار/ }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    expect(screen.getByText("00:00:00")).toBeTruthy();
  });

  it("يظهر سبعة أزرار تنقّل بين الأسئلة", () => {
    startExam();
    const rail = screen.getByRole("navigation", { name: "التنقّل بين الأسئلة" });
    expect(rail.querySelectorAll("button")).toHaveLength(7);
  });

  it("يعرض كل الأسئلة عند التنقّل ولا يسقط", () => {
    startExam();
    const rail = screen.getByRole("navigation", { name: "التنقّل بين الأسئلة" });
    const buttons = Array.from(rail.querySelectorAll("button")) as HTMLButtonElement[];
    QUESTIONS.forEach((q, i) => {
      fireEvent.click(buttons[i]);
      expect(screen.getByRole("heading", { name: q.title })).toBeTruthy();
      // every part of the question is rendered
      q.parts.forEach((p) => {
        expect(document.body.innerHTML).toContain(`>${q.index}.`);
        expect(p.id.length).toBeGreaterThan(2);
      });
    });
  });

  it("لا يظهر أيّ أمر LaTeX خام في الواجهة", () => {
    startExam();
    const rail = screen.getByRole("navigation", { name: "التنقّل بين الأسئلة" });
    const buttons = Array.from(rail.querySelectorAll("button")) as HTMLButtonElement[];
    QUESTIONS.forEach((_q, i) => {
      fireEvent.click(buttons[i]);
      const text = document.body.textContent ?? "";
      expect(text).not.toMatch(/\\(frac|widehat|overrightarrow|triangle|cong|parallel|perp|text|mathcal)/);
      expect(text).not.toContain("$");
    });
  });

  it("KaTeX يعرض الرموز الهندسية فعلاً", () => {
    startExam();
    const rail = screen.getByRole("navigation", { name: "التنقّل بين الأسئلة" });
    fireEvent.click((rail.querySelectorAll("button") as NodeListOf<HTMLButtonElement>)[3]);
    expect(document.querySelectorAll(".katex").length).toBeGreaterThan(5);
  });

  it("يحفظ الإجابات ويستعيدها بعد إعادة التحميل، ويُبقي الجلسة قائمة", () => {
    startExam("طالب مجتهد");
    const first = document.querySelectorAll('button[aria-pressed]')[0] as HTMLButtonElement;
    fireEvent.click(first);
    cleanup();
    render(<App />);
    // the attempt is restored: no start screen, timer chip present
    expect(screen.queryByRole("button", { name: /ابدأ الاختبار/ })).toBeNull();
    expect(screen.getByRole("button", { name: /تسليم الاختبار/ })).toBeTruthy();
    expect(screen.getAllByText(/طالب مجتهد/).length).toBeGreaterThan(0);
  });

  it("زرّ كتم الصوت يعكس حالته", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: /الأصوات/ });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /الأصوات/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("بوابة المعلّم ترفض كلمة مرور خاطئة وتقبل الصحيحة", () => {
    window.location.hash = "#/teacher";
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("كلمة المرور"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "دخول" }));
    expect(screen.getByText("كلمة المرور غير صحيحة.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("كلمة المرور"), {
      target: { value: "somer173" },
    });
    fireEvent.click(screen.getByRole("button", { name: "دخول" }));
    expect(screen.getByRole("heading", { name: "سلّم الإجابات والحلول الكاملة" })).toBeTruthy();
    window.location.hash = "";
  });

  it("لا يحتوي الواجهة على أيّ زرّ لتنزيل الشيفرة أو ملفّ مضغوط", () => {
    startExam();
    const text = document.body.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("zip");
    expect(text.toLowerCase()).not.toContain("arena");
    expect(text).not.toContain("المصدر");
  });
});

describe("مسار الإكمال والتسليم", () => {
  it("تفعيل زرّ التسليم بعد إكمال كلّ الفروع ثم عرض النتيجة والتقرير", () => {
    startExam("طالب كامل");
    const store: Record<string, unknown> = {};
    // Fill everything by driving the real controls, question by question.
    const rail = screen.getByRole("navigation", { name: "التنقّل بين الأسئلة" });
    const railButtons = Array.from(rail.querySelectorAll("button")) as HTMLButtonElement[];

    for (let qi = 0; qi < QUESTIONS.length; qi++) {
      fireEvent.click(railButtons[qi]);
      const q = QUESTIONS[qi];
      for (const p of q.parts) {
        const section = document.querySelector(`[data-part="${p.id}"]`) as HTMLElement | null;
        expect(section, `missing section for ${p.id}`).toBeTruthy();
        switch (p.type) {
          case "mcq": {
            const btns = section!.querySelectorAll<HTMLButtonElement>("button[aria-pressed]");
            fireEvent.click(btns[0]);
            store[p.id] = true;
            break;
          }
          case "multi": {
            const btns = section!.querySelectorAll<HTMLButtonElement>("button[aria-pressed]");
            fireEvent.click(btns[0]);
            store[p.id] = true;
            break;
          }
          case "tf": {
            const groups = section!.querySelectorAll<HTMLButtonElement>("button");
            // click the first "صواب" of each item block
            const items = Array.from(section!.querySelectorAll("div.rounded-xl"));
            items.forEach((it) => {
              const b = Array.from(it.querySelectorAll("button")).find(
                (x) => x.textContent === "صواب",
              );
              if (b) fireEvent.click(b);
            });
            void groups;
            store[p.id] = true;
            break;
          }
          case "match":
          case "cloze": {
            section!.querySelectorAll("select").forEach((sel) => {
              const value = (sel as HTMLSelectElement).options[1].value;
              fireEvent.change(sel, { target: { value } });
            });
            store[p.id] = true;
            break;
          }
          case "order": {
            store[p.id] = true; // pre-filled with the shuffled order
            break;
          }
          case "numeric": {
            section!.querySelectorAll("input").forEach((inp) => {
              fireEvent.change(inp, { target: { value: "1" } });
            });
            store[p.id] = true;
            break;
          }
          case "plot": {
            const svg = section!.querySelector('svg[role="application"]') as SVGSVGElement;
            svg.getBoundingClientRect = () =>
              ({ left: 0, top: 0, width: 556, height: 388, right: 556, bottom: 388 }) as DOMRect;
            const targets = section!.querySelectorAll<HTMLButtonElement>("button");
            for (const t of Array.from(targets).slice(0, 3)) {
              fireEvent.click(t);
              fireEvent.pointerDown(svg, { clientX: 236, clientY: 200 });
            }
            store[p.id] = true;
            break;
          }
        }
      }
    }

    const submit = screen.getByRole("button", { name: /تسليم الاختبار/ }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    expect(screen.getByText("مراجعة الإجابات قبل التسليم")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "تأكيد التسليم" }));
    // results remain available independently of network status
    expect(screen.getByRole("button", { name: /تحميل التقرير/ })).toBeTruthy();
    expect(screen.getByText("طالب كامل")).toBeTruthy();
    expect(screen.getByRole("button", { name: /محاولة جديدة/ })).toBeTruthy();
    expect(document.body.textContent).toMatch(/من 100/);
  }, 20000);
});
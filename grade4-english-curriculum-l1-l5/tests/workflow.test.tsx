// @vitest-environment jsdom
/**
 * Real DOM-level workflow checks (jsdom): privacy notice, results screen in every
 * delivery state, the independent "Resend Result" button, TXT download, failure not
 * hiding the score, one POST on submit, and automatic re-send on re-opening the exam.
 * No real network: global fetch is replaced by a mock for the two app-level tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Blob as NodeBlob, Buffer } from "node:buffer";
import App from "../src/App";
import ResultsScreen from "../src/components/ResultsScreen";
import WelcomeScreen from "../src/components/WelcomeScreen";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { QUESTIONS } from "../src/data/questions";
import { gradeExam } from "../src/logic/grading";
import { buildReport } from "../src/logic/report";
import { saveSession } from "../src/logic/storage";
import { buildPayload, pendingKey, type SendStatus } from "../src/logic/submit";
import type { AnswerMap, ExamResult, ExamSession } from "../src/types";
import { fixture } from "./helpers";

process.env.TZ = "UTC";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const nativeFetch = globalThis.fetch;
const perfect = fixture("answers.json");
const answers = perfect.answers as AnswerMap;
const START = Date.UTC(2026, 10, 16, 9, 0, 5, 250);
const SUBMIT = Date.UTC(2026, 10, 16, 9, 20, 38, 900);

function makeResult(): ExamResult {
  return gradeExam(answers, "Ahmad Saleh", START, SUBMIT);
}

function fullSession(patch: Partial<ExamSession> = {}): ExamSession {
  return {
    phase: "exam",
    studentName: "Ahmad Saleh",
    startedAt: START,
    answers,
    current: 0,
    result: null,
    sendStatus: "idle",
    ...patch,
  };
}

let root: Root;
let container: HTMLDivElement;
let downloads: { filename: string; blob: any }[] = [];
let originals: {
  create: any;
  revoke: any;
  click: any;
  blob: any;
};

function mockDownload() {
  const urls = new Map<string, any>();
  originals = {
    create: (URL as any).createObjectURL,
    revoke: (URL as any).revokeObjectURL,
    click: HTMLAnchorElement.prototype.click,
    blob: globalThis.Blob,
  };
  (globalThis as any).Blob = NodeBlob;
  (URL as any).createObjectURL = (blob: any) => {
    const url = `blob:mock/${urls.size + 1}`;
    urls.set(url, blob);
    return url;
  };
  (URL as any).revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    downloads.push({ filename: this.download, blob: urls.get(this.href) });
  };
}

beforeEach(() => {
  // jsdom does not implement scrolling or media playback; the exam uses both.
  Element.prototype.scrollIntoView = () => {};
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  downloads = [];
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockDownload();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  (URL as any).createObjectURL = originals.create;
  (URL as any).revokeObjectURL = originals.revoke;
  HTMLAnchorElement.prototype.click = originals.click;
  (globalThis as any).Blob = originals.blob;
  globalThis.fetch = nativeFetch;
  vi.restoreAllMocks();
});

describe("9. privacy and student-facing UI", () => {
  it("asks only for the name and states truthfully that name/answers/result are sent", async () => {
    await act(async () => {
      root.render(<WelcomeScreen defaultName="" onStart={() => {}} />);
    });
    const text = container.textContent ?? "";
    expect(text).toContain("sent to your teacher");
    expect(text).toContain("No other personal information is collected");
    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(container.querySelector("#student-name")).toBeTruthy();
  });

  it("shows the score and the TXT button in every delivery state, with resend only on failure", async () => {
    const result = makeResult();
    const onResend = vi.fn();
    const onRetake = vi.fn();
    for (const status of ["idle", "sending", "success", "failed"] as SendStatus[]) {
      await act(async () => {
        root.render(
          <ResultsScreen result={result} sendStatus={status} onResend={onResend} onRetake={onRetake} />
        );
      });
      const text = container.textContent ?? "";
      expect(text, `score visible when ${status}`).toContain("100 / 100");
      expect(text).toContain("Mission Debrief");
      expect(text).toContain("Download Exam Report (TXT)");
      expect(container.querySelector('[data-testid="download-report"]')).toBeTruthy();
      expect(Boolean(container.querySelector('[data-testid="resend-result"]'))).toBe(status === "failed");
      expect(Boolean(container.querySelector(`[data-send-status="${status}"]`))).toBe(status !== "idle");
      // teacher-only fields are never shown to the student
      expect(text).not.toContain(SHEETS_TOKEN);
      expect(text).not.toContain("attemptId");
      expect(text).not.toContain("examId");
      expect(text).not.toContain("ممتاز"); // gradeLabel is payload-only
      expect(text).not.toContain("Layan Mohammad"); // no other student's data
    }
  });

  it("a failed send never hides the result; resend and retake are independent", async () => {
    const result = makeResult();
    const onResend = vi.fn();
    const onRetake = vi.fn();
    await act(async () => {
      root.render(<ResultsScreen result={result} sendStatus="failed" onResend={onResend} onRetake={onRetake} />);
    });
    const banner = container.querySelector('[data-send-status="failed"]');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain("could not be sent");
    expect(banner?.textContent).toContain("score is already shown above");
    const resend = container.querySelector('[data-testid="resend-result"]') as HTMLButtonElement;
    await act(async () => resend.click());
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(onRetake).toHaveBeenCalledTimes(0);
    const retake = [...container.querySelectorAll("button")].find((b) => /Retake Exam/i.test(b.textContent ?? ""));
    expect(retake).toBeTruthy();
  });

  it("downloads a complete UTF-8 TXT report with the original filename", async () => {
    const result = makeResult();
    await act(async () => {
      root.render(<ResultsScreen result={result} sendStatus="failed" onResend={() => {}} onRetake={() => {}} />);
    });
    const button = container.querySelector('[data-testid="download-report"]') as HTMLButtonElement;
    await act(async () => button.click());
    expect(downloads).toHaveLength(1);
    const d = downloads[0];
    expect(d.filename).toBe("Grade4_English_Exam_Ahmad_Saleh.txt");
    expect(d.blob).toBeTruthy();
    // Node's Blob.text() strips a leading BOM (per TextDecoder), so inspect the bytes.
    const bytes = Buffer.from(await d.blob.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM as in the original
    const text: string = bytes.toString("utf8");
    expect(text.startsWith("\uFEFF")).toBe(true);
    expect(text).toContain("OFFICIAL EXAM REPORT");
    expect(text).toContain("100 / 100");
    expect(text).toContain("Ahmad Saleh");
    expect(text).toContain("QUESTION 35");
    expect(text).toContain("دولة"); // Arabic curriculum word preserved
    expect(text).toContain("Curriculum reference");
  });
});

describe("10. app workflow (mock fetch only)", () => {
  it("submitting shows 100/100 immediately and POSTs one contract payload in the background", async () => {
    saveSession(fullSession());
    const posts: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: any, init: any) => {
      posts.push({ url, init });
      return { text: async () => '{"ok":true}' };
    }) as any;

    await act(async () => {
      root.render(<App />);
    });
    expect(posts).toHaveLength(0); // nothing pending on load
    const submitButton = [...container.querySelectorAll("button")].find((b) =>
      /Submit Exam/i.test(b.textContent ?? "")
    ) as HTMLButtonElement | undefined;
    expect(submitButton).toBeTruthy();
    expect(submitButton!.disabled).toBe(false); // all 80 parts answered
    await act(async () => submitButton!.click());

    // Result + report button appear immediately, before the network settles.
    expect(container.textContent).toContain("Mission Debrief");
    expect(container.textContent).toContain("100 / 100");
    expect(container.querySelector('[data-testid="download-report"]')).toBeTruthy();
    // TXT is handed to the student at submission, independent of any network result.
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("Grade4_English_Exam_Ahmad_Saleh.txt");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(container.querySelector('[data-send-status="success"]')).toBeTruthy();
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe(SHEETS_URL);
    expect(posts[0].init.method).toBe("POST");
    expect(posts[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    const body = JSON.parse(String(posts[0].init.body));
    expect(body.examId).toBe(EXAM_ID);
    expect(body.examTitle).toBe("Curriculum Test Lessons 1 to 5");
    expect(body.token).toBe(SHEETS_TOKEN);
    expect(body.studentName).toBe("Ahmad Saleh");
    expect(body.summary.total).toBe(100);
    expect(body.summary.max).toBe(100);
    expect(body.lessons).toHaveLength(5);
    expect(body.details).toHaveLength(QUESTIONS.reduce((s, q) => s + q.parts.length, 0));
    expect(body.details).toHaveLength(80);
    expect(body.reportText).toContain("OFFICIAL EXAM REPORT");
    expect(localStorage.getItem(pendingKey(body.attemptId))).toBeNull();
  });

  it("re-opening the exam automatically re-sends a stored pending result and clears it", async () => {
    const result = makeResult();
    const attemptId = "restored-attempt-0001";
    const payload = buildPayload({ attemptId, result, answers, reportText: buildReport(result) });
    localStorage.setItem(pendingKey(attemptId), JSON.stringify(payload));
    saveSession(fullSession({ phase: "results", result, attemptId, sendStatus: "failed", current: 34 }));

    const posts: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: any, init: any) => {
      posts.push({ url, init });
      return { text: async () => '{"ok":true}' };
    }) as any;

    await act(async () => {
      root.render(<App />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(container.textContent).toContain("Mission Debrief");
    expect(posts).toHaveLength(1);
    const sent = JSON.parse(String(posts[0].init.body));
    expect(sent.attemptId).toBe(attemptId); // same id => no duplicate row
    expect(sent.token).toBe(SHEETS_TOKEN);
    expect(localStorage.getItem(pendingKey(attemptId))).toBeNull();
    expect(container.querySelector('[data-send-status="success"]')).toBeTruthy();
  });
});

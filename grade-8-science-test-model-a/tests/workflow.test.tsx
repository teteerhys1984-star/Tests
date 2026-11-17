// @vitest-environment jsdom
/**
 * End-to-end UI behaviour: name gate, autosave/restore, submit gating,
 * results + TXT report, teacher gate, and automatic pending retry on open.
 * Every network call is mocked — no POST ever leaves the test process.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { EXAM_ID, SHEETS_URL } from "@/config";
import { QUESTIONS } from "@/data/exam";
import { ATTEMPT_KEY, REPORT_KEY, saveAttempt, saveReport } from "@/lib/storage";
import { gradeAttempt } from "@/lib/grade";
import { buildExamReport, reportToText } from "@/lib/report";
import { buildPayload, pendingKey } from "@/lib/submit";
import { completeAttempt, fullAnswers } from "./helpers";

const realFetch = globalThis.fetch;

function stubOkFetch() {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const mock = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return { text: async () => JSON.stringify({ ok: true }) } as unknown as Response;
  });
  vi.stubGlobal("fetch", mock);
  return { calls, mock };
}

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = () => {};
  vi.spyOn(window, "setInterval").mockImplementation(
    () => 1 as unknown as ReturnType<typeof setInterval>,
  );
  vi.spyOn(window, "clearInterval").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  globalThis.fetch = realFetch;
});

describe("Student flow", () => {
  it("shows the exam title and requires a full student name", () => {
    render(<App />);
    expect(screen.getAllByText("Grade 8 Science Test Model A").length).toBeGreaterThan(0);
    const input = screen.getByLabelText(/اسم الطالب الكامل/);
    fireEvent.change(input, { target: { value: "أح" } });
    fireEvent.click(screen.getByRole("button", { name: "بدء الاختبار" }));
    expect(screen.getByText(/يرجى إدخال الاسم الكامل/)).toBeTruthy();

    fireEvent.change(input, { target: { value: "أحمد علي حسن" } });
    fireEvent.click(screen.getByRole("button", { name: "بدء الاختبار" }));
    expect(screen.getByText("خريطة المحطّات")).toBeTruthy();
    const saved = JSON.parse(window.localStorage.getItem(ATTEMPT_KEY) as string);
    expect(saved.name).toBe("أحمد علي حسن");
    expect(saved.attemptId).toBeTruthy();
    expect(window.localStorage.getItem(`${EXAM_ID}-attempt-v1`)).toBeTruthy();
  });

  it("restores the same attempt and the active question after a reload", () => {
    const attempt = completeAttempt({ attemptId: "restore-1", answers: { "p1-mag": "60" }, idx: 5 });
    saveAttempt(attempt);
    render(<App />);
    expect(screen.getAllByText(attempt.name).length).toBeGreaterThan(0);
    expect(document.querySelector('[aria-label="السؤال 6"][aria-current="true"]')).toBeTruthy();
    expect(screen.getByText("تسليم الاختبار")).toBeTruthy();
  });

  it("blocks submission until all 64 sub-parts are answered", () => {
    saveAttempt(completeAttempt({ attemptId: "blocked-1", answers: { "p1-mag": "60" } }));
    render(<App />);
    const submit = screen.getByRole("button", { name: "تسليم الاختبار" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(screen.getByText(/المتبقي:/)).toBeTruthy();
  });

  it("submits a complete attempt, shows the result and keeps the report", async () => {
    const { calls } = stubOkFetch();
    saveAttempt(completeAttempt({ attemptId: "submit-1" }));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "تسليم الاختبار" }));

    await waitFor(() => expect(screen.getByText("تنزيل التقرير (TXT)")).toBeTruthy());
    expect(screen.getByText(/المجموع الكلّي/)).toBeTruthy();
    expect(screen.getAllByText("100/100").length).toBeGreaterThan(0);

    const report = JSON.parse(window.localStorage.getItem(REPORT_KEY) as string);
    expect(report.total).toBe(100);
    expect(report.questions).toHaveLength(24);

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].url).toBe(SHEETS_URL);
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.examId).toBe(EXAM_ID);
    expect(body.attemptId).toBe("submit-1");
    expect(body.details).toHaveLength(64);
    expect(window.localStorage.getItem(pendingKey("submit-1"))).toBeNull();
  });

  it("keeps the result and offers a manual resend when delivery fails", async () => {
    const failing = vi.fn(async () => ({ text: async () => JSON.stringify({ ok: false }) }) as unknown as Response);
    vi.stubGlobal("fetch", failing);
    saveAttempt(completeAttempt({ attemptId: "fail-1" }));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "تسليم الاختبار" }));

    await waitFor(() => expect(screen.getByText("إعادة إرسال النتيجة")).toBeTruthy(), { timeout: 12000 });
    expect(screen.getByText("تنزيل التقرير (TXT)")).toBeTruthy();
    expect(window.localStorage.getItem(pendingKey("fail-1"))).toBeTruthy();
    expect(window.localStorage.getItem(REPORT_KEY)).toBeTruthy();

    const attemptsBefore = failing.mock.calls.length;
    fireEvent.click(screen.getByText("إعادة إرسال النتيجة"));
    await waitFor(() => expect(failing.mock.calls.length).toBeGreaterThan(attemptsBefore));
  }, 40000);

  it("retries a pending submission automatically when the exam opens", async () => {
    const attempt = completeAttempt({ attemptId: "auto-retry-1", submittedAt: 1_700_003_600_000 });
    const report = buildExamReport(attempt, gradeAttempt(QUESTIONS, attempt.answers));
    const payload = buildPayload({
      attemptId: attempt.attemptId,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt as number,
      report,
      reportText: reportToText(report),
    });
    saveAttempt({ ...attempt, sentAt: undefined });
    saveReport(report);
    window.localStorage.setItem(pendingKey(attempt.attemptId), JSON.stringify(payload));

    const { calls } = stubOkFetch();
    render(<App />);
    await waitFor(() => expect(calls.length).toBe(1));
    await waitFor(() => expect(window.localStorage.getItem(pendingKey(attempt.attemptId))).toBeNull());
    expect(screen.getByText("تنزيل التقرير (TXT)")).toBeTruthy();
  });
});

describe("Teacher gate", () => {
  it("is closed during an active attempt", () => {
    saveAttempt(completeAttempt({ attemptId: "active-1" }));
    render(<App />);
    expect(screen.getByText("منطقة المعلّم مغلقة أثناء الاختبار")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "منطقة المعلّم" })).toBeNull();
  });

  it("opens only with SOMER173 and shows the answer key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "منطقة المعلّم" }));
    const pass = screen.getByPlaceholderText("كلمة المرور");
    fireEvent.change(pass, { target: { value: "somer173" } });
    fireEvent.click(screen.getByRole("button", { name: "دخول" }));
    expect(screen.getByText("كلمة المرور غير صحيحة.")).toBeTruthy();

    fireEvent.change(pass, { target: { value: "SOMER173" } });
    fireEvent.click(screen.getByRole("button", { name: "دخول" }));
    expect(screen.getByText("مفتاح إجابة النموذج (أ)")).toBeTruthy();
    expect(screen.getByText(/منطقة المعلّم · سرّي/)).toBeTruthy();
  });
});

describe("Report download", () => {
  it("downloads a UTF-8 BOM TXT report from the results screen", async () => {
    stubOkFetch();
    const attempt = completeAttempt({ attemptId: "download-1", submittedAt: 1_700_003_600_000 });
    saveAttempt(attempt);
    saveReport(buildExamReport(attempt, gradeAttempt(QUESTIONS, attempt.answers)));
    const createObjectURL = vi.fn(() => "blob:report");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByText("تنزيل التقرير (TXT)"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (createObjectURL.mock.calls as unknown as [[Blob]])[0][0];
    expect(blob.type).toBe("text/plain;charset=utf-8");
    expect(clickSpy).toHaveBeenCalled();
    expect(fullAnswers()["p1-mag"]).toBe("60");
  });
});

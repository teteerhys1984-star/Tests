// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../src/App";
import ExamScreen from "../src/components/ExamScreen";
import { EXAM_ID, EXAM_TITLE, SHEETS_URL } from "../src/config";
import { QUESTIONS } from "../src/data/exam";
import { buildReport } from "../src/lib/grading";
import { reportToText } from "../src/lib/report";
import { ATTEMPT_KEY, PREV_REPORT_KEY, REPORT_KEY } from "../src/lib/storage";
import { buildPayload, pendingKey } from "../src/lib/submit";
import { makePerfectAnswers } from "./helpers";

const fullAnswers = makePerfectAnswers;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      expect(url).toBe(SHEETS_URL);
      return { text: async () => '{"ok":true}' };
    }),
  );
  vi.stubGlobal("scrollTo", vi.fn());
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Interactive student workflow, recovery, teacher gate and mocked delivery", () => {
  it("renders valid interactive controls for every single part across all 30 questions (including Q3 & Q23)", () => {
    const onAnswer = vi.fn();
    const { rerender } = render(
      <ExamScreen
        name="Test Student"
        answers={{}}
        index={0}
        elapsedSeconds={12}
        muted={true}
        onIndexChange={() => {}}
        onAnswer={onAnswer}
        onToggleMute={() => {}}
        onSubmit={() => {}}
      />,
    );

    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      rerender(
        <ExamScreen
          name="Test Student"
          answers={{}}
          index={i}
          elapsedSeconds={12 + i}
          muted={true}
          onIndexChange={() => {}}
          onAnswer={onAnswer}
          onToggleMute={() => {}}
          onSubmit={() => {}}
        />,
      );

      // Teacher controls and answer keys must NEVER appear during an exam
      expect(screen.queryByRole("button", { name: /teacher/i })).toBeNull();
      expect(screen.queryByText(/Unlock answer key/i)).toBeNull();

      const expectedChoiceGroups = q.parts.filter((p) => p.kind === "choice").length;
      const expectedRadios = q.parts
        .filter((p) => p.kind === "choice")
        .reduce((s, p) => s + p.options.length, 0);
      const expectedTextInputs = q.parts.filter((p) => p.kind === "text").length;
      const expectedTextareas = q.parts.filter((p) => p.kind === "longtext").length;

      expect(
        screen.queryAllByRole("radiogroup"),
        `Q${q.n} radiogroups`,
      ).toHaveLength(expectedChoiceGroups);
      expect(screen.queryAllByRole("radio"), `Q${q.n} radio options`).toHaveLength(
        expectedRadios,
      );
      expect(
        document.querySelectorAll('input[type="text"]'),
        `Q${q.n} inline text inputs`,
      ).toHaveLength(expectedTextInputs);
      expect(
        document.querySelectorAll("textarea"),
        `Q${q.n} textareas`,
      ).toHaveLength(expectedTextareas);
    }
  });

  it("validates name, autosaves answers and current question, restores after refresh, and blocks incomplete submit", () => {
    const { unmount } = render(<App />);

    expect(screen.getByRole("heading", { name: EXAM_TITLE })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start Exam" }));
    expect(screen.getByText(/Please enter your full name/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: "  Rami Al-Masri  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Exam" }));

    // Now on Question 1 — teacher area trigger is absent, submit is disabled
    expect(screen.getByText(/Question 1 of 30/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Teacher Area" })).toBeNull();
    expect(screen.getByRole("button", { name: "Submit Exam" }).hasAttribute("disabled")).toBe(
      true,
    );

    // Answer Q1, navigate to Q3 via navigator, and answer Q3a (ellipsis blank)
    fireEvent.change(screen.getByLabelText("Question 1"), {
      target: { value: "To convey useful and practical knowledge." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Jump to a question" }));
    const nav = screen.getByRole("dialog", { name: "Question navigator" });
    expect(within(nav).getByRole("button", { name: "Question 1, answered" })).toBeTruthy();
    fireEvent.click(within(nav).getByRole("button", { name: "Question 3, unanswered" }));

    expect(screen.getByText(/Question 3 of 30/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Question 3 Part a — fill in the blank"), {
      target: { value: "flying" },
    });

    // Simulate full browser refresh
    unmount();
    render(<App />);

    expect(screen.getByText(/Question 3 of 30/)).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          "Question 3 Part a — fill in the blank",
        ) as HTMLInputElement
      ).value,
    ).toBe("flying");
    expect(screen.getByRole("button", { name: "Submit Exam" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("completes Q3 & Q23 ellipsis blanks, submits with mocked fetch, shows 100/100, opens Teacher Area, and retakes cleanly", async () => {
    const answers = fullAnswers();
    delete answers.q3p2;
    delete answers.q23p1;
    delete answers.q23p2;

    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        attemptId: "mock-attempt-100",
        name: "Nour Hasan",
        startedAt: Date.now() - 125_000,
        answers,
        muted: true,
        index: 2, // Q3
      }),
    );

    render(<App />);
    expect(await screen.findByText(/Question 3 of 30/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Submit Exam" }).hasAttribute("disabled")).toBe(
      true,
    );

    // Fill Q3 Part b
    fireEvent.change(screen.getByLabelText("Question 3 Part b — fill in the blank"), {
      target: { value: "robotic" },
    });

    // Jump to Lesson 3 tab → lands on Q23 (the only unanswered question in Lesson 3)
    fireEvent.click(screen.getByTitle("Lesson 3 — Let's Discover"));
    expect(screen.getByText(/Question 23 of 30/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Question 23 Part a — fill in the blank"), {
      target: { value: "three" },
    });
    fireEvent.change(screen.getByLabelText("Question 23 Part b — fill in the blank"), {
      target: { value: "souvenirs" },
    });

    const submitBtn = screen.getByRole("button", { name: "Submit Exam" });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
    fireEvent.click(submitBtn);

    // Results appear immediately and mocked delivery confirms success
    expect(await screen.findByText("Question-by-question review")).toBeTruthy();
    expect(screen.getByText("100 of 100 marks earned")).toBeTruthy();
    expect(screen.queryByText(/^passed$/i)).toBeNull();
    await screen.findByText("Result sent to teacher.");

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(body.attemptId).toBe("mock-attempt-100");
    expect(body.examId).toBe(EXAM_ID);
    expect(body.examTitle).toBe(EXAM_TITLE);
    expect(body.summary.total).toBe(100);
    expect(body.details).toHaveLength(47);
    expect(localStorage.getItem(pendingKey("mock-attempt-100"))).toBeNull();

    // Unlock Teacher Area from Results with somer173
    fireEvent.click(screen.getByRole("button", { name: "Teacher Area" }));
    const dialog = screen.getByRole("dialog", { name: "Teacher Area" });
    expect(within(dialog).getByText(/cosmetic client-side convenience gate/i)).toBeTruthy();
    expect(within(dialog).getByText(/بوابة تجميلية على جهة العميل/)).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText("Password"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Unlock answer key" }));
    expect(within(dialog).getByText("Incorrect password. Try again.")).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText("Password"), {
      target: { value: "somer173" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Unlock answer key" }));
    expect(
      within(dialog).getByText(/Answer key · 30 questions · 47 parts · 100 marks/),
    ).toBeTruthy();
    expect(within(dialog).getByText("✓ used less than")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Teacher Area" }));

    // Retake archives previous report and returns to Welcome asking for name again
    fireEvent.click(screen.getByRole("button", { name: "Start New Attempt" }));
    await waitFor(() => expect(localStorage.getItem(ATTEMPT_KEY)).toBeNull());
    expect(localStorage.getItem(REPORT_KEY)).toBeNull();
    expect(localStorage.getItem(PREV_REPORT_KEY)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Download previous report" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start Exam" })).toBeTruthy();
  });

  it("keeps results & TXT download usable when Sheets fails, supports manual Resend with same attemptId, and auto-retries pending on reopen", async () => {
    vi.useFakeTimers();

    // First 3 attempts fail; subsequent manual resend succeeds
    let callCount = 0;
    const seenAttemptIds: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        expect(url).toBe(SHEETS_URL);
        callCount++;
        seenAttemptIds.push(JSON.parse(String(init?.body)).attemptId);
        if (callCount <= 3) return { text: async () => '{"ok":false}' };
        return { text: async () => '{"ok":true}' };
      }),
    );

    const createObjectURL = vi.fn(() => "blob:mock-txt");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const answers = fullAnswers();
    answers.q4p1 = "1"; // lose 2 marks → 98/100
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        attemptId: "retry-attempt-77",
        name: "Kareem",
        startedAt: Date.now() - 60_000,
        answers,
        muted: true,
        index: 29,
      }),
    );

    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Submit Exam" }));

    // Results render immediately even while sending / failing
    expect(screen.getByText("98 of 100 marks earned")).toBeTruthy();
    expect(screen.getByText("Sending result to teacher…")).toBeTruthy();

    // Advance through 2s and 5s retry delays
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.runAllTimersAsync();

    expect(callCount).toBe(3);
    expect(screen.getByRole("status").getAttribute("data-send-status")).toBe("failed");
    expect(localStorage.getItem(pendingKey("retry-attempt-77"))).not.toBeNull();

    // TXT report download still works despite failed delivery
    fireEvent.click(screen.getByRole("button", { name: "Download TXT report" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);

    // Manual Resend uses the exact same attemptId and succeeds
    fireEvent.click(screen.getByRole("button", { name: "Resend result" }));
    await vi.runAllTimersAsync();

    expect(callCount).toBe(4);
    expect(seenAttemptIds).toEqual([
      "retry-attempt-77",
      "retry-attempt-77",
      "retry-attempt-77",
      "retry-attempt-77",
    ]);
    expect(screen.getByRole("status").getAttribute("data-send-status")).toBe("success");
    expect(localStorage.getItem(pendingKey("retry-attempt-77"))).toBeNull();

    // Now verify automatic retry of a saved pending submission on reopen
    unmount();
    localStorage.clear();
    const startMs = Date.now() - 30_000;
    const submitMs = Date.now();
    const rep = buildReport("Salma", fullAnswers(), submitMs, 30, startMs);
    const pendingPayload = buildPayload({
      attemptId: "pending-on-open-99",
      startedAt: startMs,
      submittedAt: submitMs,
      report: rep,
      reportText: reportToText(rep),
    });
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        attemptId: "pending-on-open-99",
        name: "Salma",
        startedAt: startMs,
        submittedAt: submitMs,
        answers: fullAnswers(),
        muted: true,
        index: 29,
      }),
    );
    localStorage.setItem(REPORT_KEY, JSON.stringify(rep));
    localStorage.setItem(
      pendingKey("pending-on-open-99"),
      JSON.stringify(pendingPayload),
    );

    render(<App />);
    await vi.runAllTimersAsync();

    expect(callCount).toBe(5);
    expect(seenAttemptIds[4]).toBe("pending-on-open-99");
    expect(screen.getByRole("status").getAttribute("data-send-status")).toBe("success");
    expect(localStorage.getItem(pendingKey("pending-on-open-99"))).toBeNull();
  });

  it("supports Teacher Area from Welcome, passage toggle, mute persistence, and partial-credit Results display", async () => {
    const { unmount } = render(<App />);

    // Open and verify Teacher Area from Welcome
    fireEvent.click(screen.getByRole("button", { name: "Teacher Area" }));
    const gate = screen.getByRole("dialog", { name: "Teacher Area" });
    fireEvent.change(within(gate).getByLabelText("Password"), { target: { value: "somer173" } });
    fireEvent.click(within(gate).getByRole("button", { name: "Unlock answer key" }));
    expect(within(gate).getByText(/33 \+ 34 \+ 33 = 100 marks/)).toBeTruthy();
    fireEvent.click(within(gate).getByRole("button", { name: "Close Teacher Area" }));

    // Start exam, toggle passage visibility & sound mute, navigate to Lesson 2 (no passage)
    const answers = fullAnswers();
    answers.q6p2 = "1"; // Q6 becomes partial: 2/4 (total 98/100)
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        attemptId: "partial-ui-55",
        name: "مريم الشامي",
        startedAt: Date.now() - 90_000,
        answers,
        muted: false,
        index: 0, // Q1 (Lesson 1 Reading comprehension)
      }),
    );
    unmount();

    const second = render(<App />);
    // Passage auto-opens on Q1
    const passageToggle = screen.getByRole("button", {
      name: /Schools in the Past, Present and Future/i,
    });
    expect(passageToggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(passageToggle);
    expect(passageToggle.getAttribute("aria-expanded")).toBe("false");

    // Toggle sound mute and verify persistence
    fireEvent.click(screen.getByRole("button", { name: "Sound is on" }));
    expect(screen.getByRole("button", { name: "Sound is off" })).toBeTruthy();

    // Jump to Lesson 2 — no reading passage shown
    fireEvent.click(screen.getByTitle("Lesson 2 — School Challenges"));
    expect(screen.getByText(/Question 11 of 30/)).toBeTruthy();
    expect(screen.queryByText(/Reading passage/i)).toBeNull();

    // Submit and verify partial credit badge (2/4) and lesson score (31 / 33)
    fireEvent.click(screen.getByRole("button", { name: "Submit Exam" }));
    expect(await screen.findByText("98 of 100 marks earned")).toBeTruthy();
    expect(screen.getByText("مريم الشامي")).toBeTruthy();
    expect(screen.getByText("31 / 33")).toBeTruthy();
    expect(screen.getByText("34 / 34")).toBeTruthy();
    expect(screen.getByText("33 / 33")).toBeTruthy();
    expect(screen.getByText("2/4")).toBeTruthy();
    await screen.findByText("Result sent to teacher.");

    // Refresh on Results preserves confirmed success status without re-sending
    second.unmount();
    render(<App />);
    expect(screen.getByText("98 of 100 marks earned")).toBeTruthy();
    expect(screen.getByRole("status").getAttribute("data-send-status")).toBe("success");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});

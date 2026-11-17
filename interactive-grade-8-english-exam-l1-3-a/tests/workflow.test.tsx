// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../src/App";
import { QUESTIONS } from "../src/data/exam";
import { EXAM_ID, SHEETS_URL } from "../src/config";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    expect(url).toBe(SHEETS_URL);
    return { text: async () => '{"ok":true}' };
  }));
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({matches:true, addListener(){}, removeListener(){}}) });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("student workflow with mocked fetch", () => {
  it("limits teacher access to welcome and results, and restores Q14 blanks 5–7 before submission", async () => {
    const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, q.parts.map(p => p.kind === "text" ? p.answers[0] : p.answer)]));
    answers[14] = [null, null, null];
    localStorage.setItem(`${EXAM_ID}-attempt-v1`, JSON.stringify({ name:"Test Student", startedAt:Date.now()-5000, answers, muted:true, current:14, attemptId:"mock-attempt" }));
    render(<App />);
    await screen.findByText("Question 14 of 30");
    expect(screen.queryByRole("button", {name:"Teacher area"})).toBeNull();
    expect(screen.queryByLabelText("Blank 1")).toBeNull();
    for (let i=0;i<3;i++) fireEvent.change(screen.getByLabelText(`Blank ${i+5}`), {target:{value:QUESTIONS[13].parts[i].kind === "text" ? (QUESTIONS[13].parts[i] as {answers:string[]}).answers[0] : ""}});
    expect(screen.getByRole("button", {name:"Submit Exam"}).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", {name:"Submit Exam"}));
    await screen.findByText("Question-by-question review");
    expect(screen.getByText(/100 of 100 marks earned/)).toBeTruthy();
    await screen.findByText("Result sent to teacher.");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(body.attemptId).toBe("mock-attempt"); expect(body.details).toHaveLength(100);
    fireEvent.click(screen.getByRole("button", {name:"Teacher area"}));
    const dialog = screen.getByRole("dialog", {name:"Teacher area"});
    fireEvent.change(within(dialog).getByLabelText("Password"),{target:{value:"somer173"}});
    fireEvent.click(within(dialog).getByRole("button",{name:"Unlock answer key"}));
    expect(within(dialog).getByText(/Answer key · 30 questions/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button",{name:"Close teacher area"}));
    fireEvent.click(screen.getByRole("button", {name:"Start a new attempt"}));
    await waitFor(() => expect(localStorage.getItem(`${EXAM_ID}-attempt-v1`)).toBeNull());
    expect(screen.getByRole("button", {name:"Start Exam"})).toBeTruthy();
  });
  it("prevents submission with unanswered parts", async () => {
    localStorage.setItem(`${EXAM_ID}-attempt-v1`, JSON.stringify({ name:"Test Student", startedAt:Date.now(), answers:{}, muted:true, current:30, attemptId:"incomplete" }));
    render(<App />);
    await screen.findByText("Question 30 of 30");
    expect(screen.getByRole("button",{name:"Submit Exam"}).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Question-by-question review")).toBeNull();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
  it("requires a name and checks the teacher password on welcome", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button",{name:"Start Exam"}));
    expect(screen.getByText(/Please enter your full name/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Teacher area"}));
    const dialog=screen.getByRole("dialog",{name:"Teacher area"});
    fireEvent.change(within(dialog).getByLabelText("Password"),{target:{value:"wrong"}});
    fireEvent.click(within(dialog).getByRole("button",{name:"Unlock answer key"}));
    expect(within(dialog).getByText("Incorrect password. Try again.")).toBeTruthy();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

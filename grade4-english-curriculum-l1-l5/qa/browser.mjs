/* ------------------------------------------------------------------ */
/*  Browser QA — drives the REAL built app end-to-end with Playwright  */
/* ------------------------------------------------------------------ */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_BASE ?? "http://localhost:4179";
const SHOTS = "qa/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const { answers, partCount, totalMarks, vocab } = JSON.parse(
  fs.readFileSync("/tmp/answers.json", "utf8")
);

const results = [];
const check = (name, cond) => {
  results.push([cond ? "PASS" : "FAIL", name]);
  if (!cond) console.error("  ✗ FAIL:", name);
};

const KEY = "gok.g4u1.session.v1";

const run = async () => {
  console.log(`seed stats → parts=${partCount} marks=${totalMarks} vocab=${vocab}`);
  check("35 questions worth exactly 100 marks", totalMarks === 100);
  check("exactly 13 vocabulary questions", vocab === 13);
  check("multi-part count sanity (>= 60 scored parts)", partCount >= 60);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  /* ------------------------------ welcome ------------------------------ */
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("welcome shows Start Exam", await page.getByRole("button", { name: "Start Exam" }).isVisible());
  check("welcome states Grade 4 / Unit 1 scope", await page.locator("text=Grade 4 English").first().isVisible());
  const startBtn = page.getByRole("button", { name: /start exam/i });
  check("Start Exam disabled without a name", await startBtn.isDisabled());
  await page.screenshot({ path: `${SHOTS}/01-welcome.png`, fullPage: false });

  /* ------------------ start & timer (no early start) ------------------- */
  await page.fill("#student-name", "Ahmad Saleh Haddad");
  check("Start Exam enabled after name", await startBtn.isEnabled());
  await startBtn.click();
  await page.waitForTimeout(300);
  const t0 = await page.locator('[data-testid="exam-timer"]').innerText();
  check("timer starts near zero after Start Exam", /^00:00:0/.test(t0));
  check("student name visible in HUD", await page.locator("text=Ahmad Saleh Haddad").isVisible());
  await page.waitForTimeout(2600);
  const t1 = await page.locator('[data-testid="exam-timer"]').innerText();
  check("count-up stopwatch runs", t1 !== t0 && /^00:00:0[1-5]/.test(t1));
  await page.screenshot({ path: `${SHOTS}/02-exam-q1.png` });

  /* ---------------------- answering + navigation ----------------------- */
  check("Arabic prompt card visible on vocabulary question", await page.locator('[lang="ar"]').first().isVisible());
  check("Q1 shows the curriculum Arabic word دولة", await page.locator("text=دولة").first().isVisible());
  await page.getByPlaceholder("Type your answer here…").fill("country");
  await page.getByRole("button", { name: "Next" }).click();
  check("navigated to question 2", await page.getByText("Word Drop 02").isVisible());
  check("Q2 shows its Arabic word طبيب", await page.locator("text=طبيب").isVisible());
  await page.getByRole("button", { name: "Previous" }).click();
  check("answer preserved after navigation", (await page.getByPlaceholder("Type your answer here…").inputValue()) === "country");
  const submit = page.getByTestId("submit-exam");
  check("Submit Exam stays disabled with missing answers", await submit.isDisabled());

  /* --------------------------- refresh survive -------------------------- */
  const elapsedBefore = await page.locator('[data-testid="exam-timer"]').innerText();
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const elapsedAfter = await page.locator('[data-testid="exam-timer"]').innerText();
  const toSec = (s) => s.split(":").reduce((a, b) => a * 60 + Number(b), 0);
  check("timer survives refresh (monotonic)", toSec(elapsedAfter) >= toSec(elapsedBefore));
  check("answers survive refresh", (await page.getByPlaceholder("Type your answer here…").inputValue()) === "country");
  check("session did not restart to welcome", !(await page.locator("#student-name").isVisible().catch(() => false)));

  /* -------------------- order chips interaction ------------------------- */
  await page.getByLabel(/Go to question 20/).click();
  for (const w of ["got", "She", "long"]) await page.getByRole("button", { name: w, exact: true }).first().click();
  await page.getByRole("button", { name: "Clear" }).click();
  check("order chips clear works", await page.getByText("Tap the word cards below").isVisible());

  /* -------------------- seed near-complete session --------------------- */
  await page.evaluate(
    ({ KEY, answers }) => {
      const session = {
        phase: "exam",
        studentName: "Ahmad Saleh Haddad",
        startedAt: Date.now() - 92_000,
        answers: { ...answers },
        current: 34,
        result: null,
      };
      delete session.answers.q35a; // last missing piece
      localStorage.setItem(KEY, JSON.stringify(session));
    },
    { KEY, answers }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const timerSeeded = await page.locator('[data-testid="exam-timer"]').innerText();
  check("seeded timer shows ~00:01:3x", /^00:01:/.test(timerSeeded));
  check("Submit locked while one part missing", await page.getByTestId("submit-exam").isDisabled());
  await page.screenshot({ path: `${SHOTS}/03-exam-final-question.png` });
  await page.getByPlaceholder("Write your answer here…").fill(
    "My favourite subject is Science because it is fun."
  );
  check("Submit unlocks when all answered", await page.getByTestId("submit-exam").isEnabled());

  /* ------------------------------ submit ------------------------------- */
  const dlPromise = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await page.getByTestId("submit-exam").click();
  await page.waitForTimeout(900);
  check("results appear immediately (no dialog step)", await page.locator("text=Mission Debrief").isVisible());
  const score = await page.getByTestId("final-score").innerText();
  check("all-correct run scores 100 / 100", score.replace(/\s+/g, " ").includes("100 / 100"));
  check("question-by-question report rendered", await page.locator("text=Question-by-Question Report").isVisible());
  check("answer explanations shown", (await page.locator("text=Correct answer").count()) > 30);
  await page.screenshot({ path: `${SHOTS}/04-results.png` });
  await page.locator("text=Q13. Word Drop 13").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/05-results-detail.png` });

  /* ---------------------------- TXT download --------------------------- */
  await page.getByRole("button", { name: /Download Exam Report/i }).click();
  const dl = await dlPromise;
  check("TXT report downloads", !!dl);
  if (dl) {
    check("filename pattern correct", dl.suggestedFilename() === "Grade4_English_Exam_Ahmad_Saleh_Haddad.txt");
    const p = await dl.path();
    const txt = fs.readFileSync(p, "utf8");
    check("report contains student + final score", txt.includes("Ahmad Saleh Haddad") && txt.includes("Final score"));
    check("report contains all questions", txt.includes("QUESTION 1") && txt.includes("QUESTION 35"));
    check("report contains curriculum references", txt.includes("Curriculum reference"));
  }

  /* ------------------------------ retake ------------------------------- */
  await page.getByRole("button", { name: /Retake Exam/i }).click();
  await page.waitForTimeout(500);
  check("retake returns to a fresh welcome", await page.locator("#student-name").isVisible());
  const nameVal = await page.locator("#student-name").inputValue();
  check("retake clears previous attempt", nameVal === "");

  /* --------------------------- teacher key ------------------------------ */
  await page.getByRole("button", { name: /Teacher Access/i }).click();
  await page.fill("#teacher-pw", "wrongpass");
  await page.getByRole("button", { name: /Unlock Answer Key/i }).click();
  check("wrong password rejected", await page.locator("text=Incorrect password").isVisible());
  await page.fill("#teacher-pw", "somer173");
  await page.getByRole("button", { name: /Unlock Answer Key/i }).click();
  await page.waitForTimeout(300);
  check("teacher key unlocks with correct password", await page.locator("text=All 35 questions").isVisible());
  check("key lists correct answers", await page.locator("text=There are two beds in my bedroom.").isVisible());
  await page.screenshot({ path: `${SHOTS}/06-teacher-key.png` });
  await page.getByLabel("Close teacher area").click();

  /* ----------------------------- contacts ------------------------------- */
  const wa = page.locator('a[href="https://wa.me/963930215022"]');
  check("WhatsApp link present and exact", (await wa.count()) === 1);
  check("phone link exact", await page.locator('a[href="tel:0930215022"]').isVisible());

  /* ------------------------------- mobile ------------------------------- */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(BASE, { waitUntil: "networkidle" });
  await mob.waitForTimeout(400);
  await mob.screenshot({ path: `${SHOTS}/07-mobile-welcome.png` });
  await mob.close();

  check("zero page errors", errors.length === 0);
  if (errors.length) console.error(errors.slice(0, 5));

  await browser.close();

  const fails = results.filter(([s]) => s === "FAIL").length;
  console.log(`\n=== BROWSER QA: ${results.length - fails}/${results.length} checks passed ===`);
  for (const [s, n] of results) console.log(`${s}  ${n}`);
  process.exit(fails ? 1 : 0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

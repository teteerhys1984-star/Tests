/**
 * The published page: wording about where results go, the build output, and stray traces.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { DIST_HTML, EXAM_DIR, EXAM_DIR_NAME, SOURCE_HTML, FakeServer, loadExam, parseExamHtml, takeExam, visibleText } from "./harness.mjs";

const source = readFileSync(SOURCE_HTML, "utf8");
const parsed = parseExamHtml(source);

test("the page says, before the student gives a name, that the result is sent to the teacher", () => {
  const text = visibleText(parsed.markup);
  assert.match(text, /your result is sent to your teacher when you submit/i);
  assert.match(text, /When you submit, your name, answers, marks and report are sent electronically to your teacher\./);
  assert.match(text, /When the examination is submitted, the student's name, answers, marks and report are sent electronically to the teacher\./);
});

test("no wording claims that nothing is sent, that data stays only on the device, or that sending is encrypted or confidential", () => {
  const forbidden = [
    /no (result|information|data)[^.]{0,40}(is|was|are) (transmitted|sent)/i,
    /No external data submission/i,
    /not (sent|transmitted) to any/i,
    /remain(s)? (local|on the student's device)/i,
    /private to this browser/i,
    /stays in your browser/i,
    /\bencrypt/i,
    /\bconfidential/i,
    /\bsecure(ly)?\b/i,
    /لا تُرسل|لا ترسل|مشفّر|مشفر|سرّي|سري/,
  ];
  // Checked over everything a reader can meet: the markup and every text literal in the scripts (TXT report included).
  for (const pattern of forbidden) assert.ok(!pattern.test(source), "found forbidden wording: " + pattern);
});

test("the TXT report tells the same story", async () => {
  const server = new FakeServer();
  const page = await takeExam(loadExam({ fetch: server.fetch }));
  const report = (await page.downloadedBytes()).toString("utf8");
  assert.ok(report.includes("this result is also sent electronically to the teacher"));
  assert.ok(report.includes("are also sent electronically to the teacher on submission"));
  assert.ok(!/No information was sent|remain local/i.test(report));
});

test("the delivery message sits on the results screen, is announced politely and starts hidden", () => {
  const box = parsed.elements.find(element => element.attrs.id === "send-status");
  assert.ok(box);
  assert.equal(box.attrs.role, "status");
  assert.equal(box.attrs["aria-live"], "polite");
  assert.ok("hidden" in box.attrs);
  const resend = parsed.elements.find(element => element.attrs.id === "resend-result-btn");
  assert.equal(resend.tag, "button");
  assert.equal(resend.attrs.type, "button");
  assert.ok("hidden" in resend.attrs);
  assert.match(source, /id="resend-result-btn" hidden>Resend Result · <span lang="ar" dir="rtl">إعادة إرسال النتيجة<\/span><\/button>/);
  assert.match(source, /id="try-again-btn">Try Again<\/button>/);
  assert.ok(source.indexOf('id="results-screen"') < source.indexOf('id="send-status"'));
  assert.ok(source.indexOf('id="send-status"') < source.indexOf('id="detailed-review-section"'));
});

test("the page keeps its language, direction and title", () => {
  assert.match(source, /^<!DOCTYPE html>\n<html lang="en" dir="ltr">/);
  assert.equal(parsed.title, "Grade 8 English Examination · Unit 1, Lessons 1–2");
});

test("EXAM_ID equals the folder name", () => {
  const examId = source.match(/const EXAM_ID = "([^"]+)"/)[1];
  assert.equal(examId, "grade8-english-l1l2");
  assert.equal(examId, EXAM_DIR_NAME);
});

test("every inline script parses, and the page needs no local file", () => {
  assert.equal(parsed.scripts.length, 3);
  parsed.scripts.forEach(code => new vm.Script(code));
  const targets = [...source.matchAll(/\b(?:src|href)\s*=\s*\\?["']([^"'\\]*)/g)].map(match => match[1]);
  assert.ok(targets.length > 0);
  for (const target of targets) assert.match(target, /^(https:\/\/|#)/, "local reference: " + target);
  assert.ok(!/url\(/.test(source), "no CSS url() references");
  assert.ok(!/<img\b|<link\b|<iframe\b|<audio\b|<video\b/i.test(source));
});

test("the word “arena” appears nowhere in the source files or in the published page", () => {
  const self = path.join(EXAM_DIR, "tests", "page.test.mjs"); // this file has to name the word it looks for
  const files = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist") continue;
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (full !== self) files.push(full);
    }
  };
  walk(EXAM_DIR);
  assert.ok(files.includes(SOURCE_HTML));
  assert.ok(files.length >= 5);

  execFileSync(process.execPath, ["build.mjs"], { cwd: EXAM_DIR, stdio: "pipe" });
  files.push(DIST_HTML);

  for (const file of files) {
    const shown = path.relative(EXAM_DIR, file);
    assert.ok(!/arena/i.test(readFileSync(file, "utf8")), "found in " + shown);
    assert.ok(!/arena/i.test(shown), "found in the name of " + shown);
  }
});

test("npm run build writes dist/index.html, identical to the source file, and it works as the examination", async () => {
  execFileSync(process.execPath, ["build.mjs"], { cwd: EXAM_DIR, stdio: "pipe" });
  assert.ok(existsSync(DIST_HTML));
  assert.deepEqual(readdirSync(path.dirname(DIST_HTML)), ["index.html"]);
  assert.ok(readFileSync(DIST_HTML).equals(readFileSync(SOURCE_HTML)));

  const server = new FakeServer();
  const page = await takeExam(loadExam({ file: DIST_HTML, fetch: server.fetch }), { name: "Built Page" });
  assert.equal(page.state().result.totalScore, 100);
  assert.equal(server.requests.length, 1);
  assert.equal(server.requests[0].body.examId, EXAM_DIR_NAME);
  assert.equal(page.el("send-status").getAttribute("data-send-status"), "success");
});

test("the package has no dependencies and its lock file agrees with it", () => {
  const pkg = JSON.parse(readFileSync(path.join(EXAM_DIR, "package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(path.join(EXAM_DIR, "package-lock.json"), "utf8"));
  assert.equal(pkg.name, EXAM_DIR_NAME);
  assert.equal(pkg.scripts.build, "node build.mjs");
  for (const key of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) assert.equal(pkg[key], undefined, key);
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.deepEqual(Object.keys(lock.packages), [""]);
});

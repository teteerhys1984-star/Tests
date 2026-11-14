/**
 * Every difference between the uploaded examination (tests/fixtures/original-exam.html) and the
 * published page (index.html), with the reason for each.
 *
 * tests/page.test.mjs reverts these changes on the published page and requires the result to be
 * the uploaded file, byte for byte. A change that is not listed here therefore fails the test.
 * tests/grading.test.mjs uses toPublishedReport() to prove that the TXT report differs only as
 * documented.
 *
 * Not changed at all: the 25 questions, their order, options, answer key, marks and
 * explanations; evaluateStudent() and every marking function; the results screen's marking
 * numbers; the teacher key password; the original CSS and theme.
 */

/**
 * Exact replacements. Replacing `published` with `original`, in this order, must give back the
 * uploaded page. Insertions are written the same way: `original` is the unchanged anchor text.
 */
export const REPLACEMENTS = [
  {
    what: "page title",
    original: "<title>Mira's Lovely English Challenge — A Beautiful Journey into Beginner English</title>",
    published: "<title>English Grammar Mira</title>",
    why: "The title requested for the site. The landing page shows the <title> on the examination's card and files it under Grade 3 → English from the folder name. The heading inside the page is unchanged.",
  },
  {
    what: "start screen: truthful notice that the result is sent to the teacher (#send-note)",
    original: "          <span>✨</span>\n        </button>\n      </div>\n    </section>",
    published:
      "          <span>✨</span>\n        </button>\n\n        <!-- Truthful privacy notice (the result is also sent to the teacher) -->\n        <p id=\"send-note\" class=\"max-w-md mx-auto text-[11px] leading-relaxed text-slate-500 mt-4\">\n          Your answers are saved on this device while you work. When you submit, your name, result and answers are sent to your teacher.\n        </p>\n      </div>\n    </section>",
    why: "The result is now sent to the teacher, so the page says so before the student starts. It also states truthfully that answers are saved on the device while the test is taken.",
  },
  {
    what: "dialogue line break, question card",
    original: '<p id="q-sub-text" class="text-sm text-slate-500 font-medium">',
    published: '<p id="q-sub-text" class="text-sm text-slate-500 font-medium whitespace-pre-line">',
    why: "Verifiable error: Question 3's dialogue contains a line break (\"— Are you ready?\\n— Yes, _____.\"), which HTML collapsed into one line. The break is now displayed. Invisible to marking.",
  },
  {
    what: "results screen: performance-level badge (#res-performance-level)",
    original:
      '        <p class="text-sm font-semibold text-purple-700 mb-6">\n          Wonderful effort! Here is your complete performance breakdown.\n        </p>',
    published:
      '        <p class="text-sm font-semibold text-purple-700 mb-3">\n          Wonderful effort! Here is your complete performance breakdown.\n        </p>\n\n        <!-- Performance level (the same label that is sent with the result) -->\n        <p id="res-performance-level" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-purple-200 text-xs font-bold text-purple-700 mb-6">\n          Performance Level\n        </p>',
    why: "The result payload has a fixed `gradeLabel` field. The label is derived from the score bands the page already uses for its encouragement message and is shown on the results screen, so nothing is sent that the student cannot see.",
  },
  {
    what: "results screen: delivery status, the separate “Resend Result” button, and the sending note",
    original: "            <span>🔄</span> Try Again\n          </button>\n        </div>\n      </div>",
    published:
      "            <span>🔄</span> Try Again\n          </button>\n        </div>\n\n        <!-- Delivery status and the separate “Resend Result” button -->\n        <div id=\"send-status\" data-send-status=\"idle\" role=\"status\" aria-live=\"polite\" hidden class=\"mt-5 max-w-xl mx-auto p-3 rounded-2xl border border-purple-200 bg-white/80 text-xs font-semibold text-purple-800\">\n          <p id=\"send-status-text\"></p>\n          <p id=\"send-status-text-ar\" dir=\"rtl\" class=\"font-ar mt-1 text-[11px] font-bold text-purple-700\"></p>\n          <button id=\"resend-result-btn\" type=\"button\" onclick=\"resendResult()\" hidden class=\"mt-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer\">\n            ↻ Resend Result · إعادة إرسال النتيجة\n          </button>\n        </div>\n\n        <p class=\"text-[11px] leading-relaxed text-slate-500 mt-5\">\n          The report is generated on this device. Your result and answers are also sent to your teacher when you submit.\n        </p>\n      </div>",
    why: "The requirement: the sending state is shown on the results screen, with a separate button that resends the same attempt. The note keeps the privacy wording truthful.",
  },
  {
    what: "script: renderSubtext/escapeHtml presentation helpers",
    original: "    function renderCurrentQuestion() {",
    published:
      "    function escapeHtml(value) {\n      return String(value)\n        .replace(/&/g, \"&amp;\")\n        .replace(/</g, \"&lt;\")\n        .replace(/>/g, \"&gt;\")\n        .replace(/\"/g, \"&quot;\")\n        .replace(/'/g, \"&#39;\");\n    }\n\n    // Presentation only: a question may underline the words its prompt refers to.\n    function renderSubtext(q) {\n      const safe = escapeHtml(q.subtext);\n      if (!q.underline) return safe;\n      const marked = `<span class=\"underline decoration-pink-400 decoration-2 underline-offset-2\">${escapeHtml(q.underline)}</span>`;\n      return safe.split(escapeHtml(q.underline)).join(marked);\n    }\n\n    function renderCurrentQuestion() {",
    why: "Needed by the underline fix below; the text is escaped, so the rendering stays safe.",
  },
  {
    what: "subtext rendering (underline fix)",
    original: "        subEl.textContent = q.subtext;",
    published: "        subEl.innerHTML = renderSubtext(q);",
    why: "Verifiable error: Question 2 says “replace the underlined words” but nothing was underlined. renderSubtext() escapes the whole sentence and underlines the words named by the presentation-only `underline` field.",
  },
  {
    what: "Question 2: presentation-only underline field",
    original: '        subtext: "Khalil and Adam are friends. _____ are at school.",',
    published:
      '        subtext: "Khalil and Adam are friends. _____ are at school.",\n        /* Presentation only: the prompt refers to underlined words, so they are underlined. */\n        underline: "Khalil and Adam",',
    why: "The words the prompt refers to. The field only controls display; no answer, option, mark or explanation changed.",
  },
  {
    what: "results screen: header stopwatch restored",
    original: '      document.getElementById("stopwatch-container").classList.add("flex");\n\n      const evalData = evaluateStudent();',
    published:
      '      document.getElementById("stopwatch-container").classList.add("flex");\n      startTimer();\n\n      const evalData = evaluateStudent();',
    why: "Verifiable bug: when a submitted attempt was reopened after a refresh, the header stopwatch appeared with 00:00:00 although the results screen showed the real duration. startTimer() shows the stored duration and starts no interval once submitted.",
  },
  {
    what: "results screen: performance level filled in",
    original: '      document.getElementById("res-duration").textContent = formatDuration(elapsedMs);\n\n      // Encouragement text',
    published:
      '      document.getElementById("res-duration").textContent = formatDuration(elapsedMs);\n\n      // Performance level (also the label sent with the result)\n      const levelEl = document.getElementById("res-performance-level");\n      if (levelEl) levelEl.textContent = `Performance Level: ${performanceLevel(evalData.score)}`;\n\n      // Encouragement text',
    why: "Shows the same performance level that the payload sends; the encouragement messages are unchanged.",
  },
  {
    what: "a second submission is ignored",
    original: "    function submitAssessment() {\n      if (getAnsweredCount() < 25) return;\n\n      stopTimer();",
    published: "    function submitAssessment() {\n      if (getAnsweredCount() < 25) return;\n      if (state.submitted) return; // a second click must not create a second attempt\n\n      stopTimer();",
    why: "Verifiable risk: submitAssessment() had no guard against running twice (a double click or a repeated call would have reset the submission time and could create a second attempt). The visible button is already disabled until all 25 answers exist; this guard changes no mark.",
  },
  {
    what: "attempt id stored on submission",
    original: '      state.submissionTime = Date.now();\n      saveState();',
    published:
      '      state.submissionTime = Date.now();\n      // One unique id per submitted attempt; a repeated send of the same id is ignored by the server.\n      state.delivery = { attemptId: newAttemptId(), status: "pending" };\n      saveState();',
    why: "Every submitted attempt needs its own attemptId before the results are shown.",
  },
  {
    what: "results screen: start delivery after rendering",
    original: "        reviewList.appendChild(item);\n      });\n    }",
    published:
      "        reviewList.appendChild(item);\n      });\n\n      // Show the result first; sending it never blocks the screen or the report.\n      resumeResultDelivery();\n    }",
    why: "The result and the TXT report must appear even when delivery fails, so delivery starts only after the results are rendered and when a submitted attempt is restored.",
  },
  {
    what: "report generation split from download",
    original: "    function downloadTxtReport(isAuto = false) {",
    published: "    function buildReportText() {",
    why: "The report text must also be sent with the result, so it is built by buildReportText(). The download still produces exactly the same text, apart from the documented line below.",
  },
  {
    what: "TXT report: truthful line, returned text and unchanged download",
    original:
      '      lines.push("End of Official Report. Generated by Mira\'s Lovely English Challenge System.");\n      lines.push("================================================================================");\n\n      const content = lines.join("\\n");\n      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });',
    published:
      '      lines.push("End of Official Report. Generated by Mira\'s Lovely English Challenge System.");\n      lines.push("Report generated on this device. The result and answers are also sent to your teacher.");\n      lines.push("================================================================================");\n\n      return lines.join("\\n");\n    }\n\n    function downloadTxtReport(isAuto = false) {\n      const content = buildReportText();\n      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });',
    why: "The result is now sent to the teacher, so the downloaded report says so. The original lines are kept; the report bytes differ by this one added line only (checked sheet by sheet).",
  },
  {
    what: "TXT report file name",
    original: '      a.download = "Mira_English_Foundation_Report.txt";',
    published: '      a.download = "Mira_English_Grammar_Report.txt";',
    why: "A clear report name that matches the published examination title. The report content and the download behaviour are unchanged.",
  },
  {
    what: "Try Again resets the delivery state",
    original: "        scrambleState: {}\n      };",
    published: '        scrambleState: {},\n        delivery: null\n      };',
    why: "A new attempt must not inherit the previous attempt's delivery status or attemptId.",
  },
  {
    what: "Try Again clears the delivery notice",
    original: "      stopTimer();\n      showWelcomeScreen();",
    published: "      stopTimer();\n      resetResultDelivery();\n      showWelcomeScreen();",
    why: "The results screen starts fresh for the next attempt; the pending payload of the previous attempt is kept for a later resend.",
  },
  {
    what: "page start-up: pending results",
    original: "      } else {\n        showWelcomeScreen();\n      }\n    });",
    published:
      "      } else {\n        showWelcomeScreen();\n      }\n\n      // Results of earlier attempts that could not be delivered are sent again, quietly.\n      retryPending();\n    });",
    why: "The requirement: a stored result that could not be delivered is retried when the examination is reopened.",
  },
  {
    what: "name field: Enter key",
    original: '              autocomplete="name"',
    published: '              autocomplete="name"\n              onkeydown="if (event.key === \'Enter\') { event.preventDefault(); startChallenge(); }"',
    why: "Verifiable usability error: pressing Enter in the name field did nothing, although the form asks the student to type a name and press Start. Enter now starts the challenge with the same function as the button.",
  },
];

/**
 * Whole blocks that were inserted and are removed as one region. `start` and `end` are exact
 * markers; everything from `start` up to (not including) `end` is removed. They are listed after
 * the replacements, so the regions refer to the published page.
 */
export const ADDED_REGIONS = [
  {
    what: "CSS of the delivery notice (#send-status…; new ids only)",
    start: "\n    /* Result delivery notice (the result is also sent to the teacher) */",
    end: "  </style>",
    why: "Styles for the newly added delivery notice only. No original rule was changed.",
  },
  {
    what: "script: result delivery block (payload, sending, pending storage, status)",
    start: "    /* ============================================================\n       10b. RESULT DELIVERY TO THE TEACHER",
    end: "    /* ============================================================\n       11. TRY AGAIN (RESET ATTEMPT)",
    why: "The result-delivery system: the fixed payload contract of the site, 3 tries with 2 s and 5 s waits, a 30 s limit per try, pending payloads in localStorage, retry on opening, and the status shown on the results screen. It contains no marking logic.",
  },
];

/** Reverts every documented change; the result must be the uploaded page, byte for byte. */
export function revertDocumentedChanges(publishedHtml) {
  let html = publishedHtml;
  for (const change of REPLACEMENTS) {
    const at = html.indexOf(change.published);
    if (at < 0) throw new Error("documented change not found: " + change.what);
    if (html.indexOf(change.published, at + 1) >= 0) throw new Error("documented change is not unique: " + change.what);
    html = html.slice(0, at) + change.original + html.slice(at + change.published.length);
  }
  for (const region of ADDED_REGIONS) {
    const at = html.indexOf(region.start);
    if (at < 0) throw new Error("documented block not found: " + region.what);
    const end = html.indexOf(region.end, at + region.start.length);
    if (end < 0) throw new Error("end of documented block not found: " + region.what);
    html = html.slice(0, at) + html.slice(end);
  }
  return html;
}

const ORIGINAL_REPORT_LAST_LINES = [
  "End of Official Report. Generated by Mira's Lovely English Challenge System.",
  "================================================================================",
];
export const PUBLISHED_PRIVACY_LINE = "Report generated on this device. The result and answers are also sent to your teacher.";

/** What the published page must write for a report the original wrote: one added line and nothing else. */
export function toPublishedReport(originalReport) {
  const lines = originalReport.split("\n");
  const at = lines.lastIndexOf(ORIGINAL_REPORT_LAST_LINES[0]);
  if (at < 0 || lines[at + 1] !== ORIGINAL_REPORT_LAST_LINES[1]) {
    throw new Error("unexpected original report: its closing lines were not found");
  }
  lines.splice(at + 1, 0, PUBLISHED_PRIVACY_LINE);
  return lines.join("\n");
}

/** The new element ids the page adds (all others are the original's). */
export const ADDED_IDS = ["send-note", "res-performance-level", "send-status", "send-status-text", "send-status-text-ar", "resend-result-btn"];

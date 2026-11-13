// ============================================================================
// منطق التصحيح وتوليد تقرير TXT — اختبار الفيزياء الصف السابع (الوحدة 1، الدرس 1)
// ============================================================================

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const SUP = { "⁻": "", "¹": "", "²": "", "³": "" };

// تطبيع النص العربي للمقارنة: إزالة التشكيل، توحيد الألفات، تحويل الأرقام
// العربية إلى غربية، إزالة الرموز غير الأبجدية (يبقى Latin والأرقام والعربية).
export function normalizeAr(s) {
  if (s == null) return "";
  let t = String(s);
  t = t.replace(/[ً-ْٰـ]/g, ""); // تشكيل وتطويل
  t = t.replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  t = t.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  t = t.replace(/[٫]/g, ".").replace(/[٬]/g, "");
  for (const [k, v] of Object.entries(SUP)) t = t.split(k).join(v);
  t = t.toLowerCase();
  t = t.replace(/[^a-z0-9.\u0600-\u06FF]/g, ""); // إزالة الفراغات والرموز
  return t;
}

// استخراج أول عدد من نص (يدعم الأرقام العربية وعلامة السالب والعشرية)
export function parseNumber(s) {
  if (s == null) return null;
  let t = String(s).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[٫]/g, ".");
  const m = t.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function stripMathMarks(text) {
  return String(text ?? "").replace(/⟦|⟧/g, "");
}

export function isAnswered(part, ans) {
  if (!ans) return false;
  switch (part.kind) {
    case "mc":
    case "match":
      return typeof ans === "string" && ans.length > 0;
    case "tf":
      return !!ans.judge;
    case "blank":
    case "numeric":
    case "text":
      return typeof ans === "string" && ans.trim().length > 0;
    default:
      return false;
  }
}

export function totalParts(questions) {
  return questions.reduce((a, q) => a + q.parts.length, 0);
}

export function answeredCount(questions, answers) {
  let n = 0;
  for (const q of questions) for (const p of q.parts) if (isAnswered(p, answers[p.id])) n++;
  return n;
}

export function partStudentText(part, ans) {
  if (!isAnswered(part, ans)) return "(لم تُجب)";
  switch (part.kind) {
    case "mc":
    case "match":
      return stripMathMarks(ans);
    case "tf": {
      let t = ans.judge === "true" || ans.judge === "صح" ? "صح" : "خطأ";
      if (ans.correction && ans.correction.trim()) t += " — التصحيح: " + ans.correction.trim();
      return t;
    }
    default:
      return String(ans).trim();
  }
}

export function partCorrectText(part) {
  switch (part.kind) {
    case "mc":
      return stripMathMarks(part.answer);
    case "tf": {
      let t = part.tfAnswer ? "صح" : "خطأ";
      if (!part.tfAnswer && part.correctionText) t += " — التصحيح: " + stripMathMarks(part.correctionText);
      return t;
    }
    case "match":
      return part.matchAnswer;
    case "blank":
      return part.accept.map(stripMathMarks).join(" / ");
    case "numeric":
      return `${part.numeric.expected} ${part.numeric.unit}`;
    case "text":
      return stripMathMarks(part.modelAnswer);
    default:
      return "";
  }
}

// تصحيح جزء واحد: يُرجع { awarded, status }
// status: correct | partial | incorrect | unanswered
export function gradePart(part, ans) {
  const marks = part.marks;
  if (!isAnswered(part, ans)) return { awarded: 0, status: "unanswered" };
  let awarded = 0;
  switch (part.kind) {
    case "mc":
      awarded = stripMathMarks(ans) === stripMathMarks(part.answer) ? marks : 0;
      break;
    case "match":
      awarded = String(ans).trim() === part.matchAnswer ? marks : 0;
      break;
    case "tf": {
      const judgeOk = (ans.judge === "صح") === part.tfAnswer;
      if (part.tfAnswer) {
        awarded = judgeOk ? marks : 0;
      } else {
        let half = judgeOk ? marks / 2 : 0;
        const corr = normalizeAr(ans.correction || "");
        const corrOk = part.correctionKeywords.some((k) => corr.includes(normalizeAr(k)));
        awarded = half + (corrOk ? marks / 2 : 0);
      }
      break;
    }
    case "blank": {
      const a = normalizeAr(ans);
      awarded = part.accept.some((x) => a.includes(normalizeAr(x))) ? marks : 0;
      break;
    }
    case "numeric": {
      const v = parseNumber(ans);
      const n = part.numeric;
      awarded = v !== null && Math.abs(v - n.expected) <= (n.tol ?? 0.01) ? marks : 0;
      break;
    }
    case "text": {
      const a = normalizeAr(ans);
      let w = 0;
      for (const kw of part.keywords || []) {
        if (kw.alts.some((alt) => a.includes(normalizeAr(alt)))) w += kw.w;
      }
      w = Math.min(1, w);
      awarded = Math.round(marks * w * 100) / 100;
      break;
    }
  }
  const status = awarded >= marks ? "correct" : awarded > 0 ? "partial" : "incorrect";
  return { awarded, status };
}

// تصحيح الاختبار كاملاً
export function gradeExam(questions, answers) {
  const details = [];
  let score = 0;
  const counts = { correct: 0, partial: 0, incorrect: 0, unanswered: 0 };
  for (const q of questions) {
    for (const p of q.parts) {
      const g = gradePart(p, answers[p.id]);
      score += g.awarded;
      counts[g.status]++;
      details.push({
        qid: q.id,
        qNumber: questions.indexOf(q) + 1,
        qTitle: q.title,
        qMarks: q.marks,
        part: p,
        awarded: g.awarded,
        status: g.status,
        studentText: partStudentText(p, answers[p.id]),
        correctText: partCorrectText(p),
      });
    }
  }
  score = Math.round(score * 100) / 100;
  const total = questions.reduce((a, q) => a + q.marks, 0);
  return { score, total, percent: total ? (score / total) * 100 : 0, counts, details };
}

// ---------------------------------------------------------------------------
// تنسيق الوقت (أرقام غربية دائماً)
// ---------------------------------------------------------------------------
export function pad2(n) {
  return String(n).padStart(2, "0");
}
export function fmtDuration(ms) {
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}
export function fmtTs(ts) {
  const d = new Date(ts);
  // ISO (UTC) بأرقام غربية + التوقيت المحلي بنمط en-GB لضمان الأرقام الغربية
  const local = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return `${d.toISOString()} | محلي: ${local}`;
}

// ---------------------------------------------------------------------------
// اسم ملف التقرير: تُحفظ الحروف العربية، وتُستبدل المسافات بشرطات سفلية،
// وتُزال المحارف غير الصالحة في أسماء الملفات.
// ---------------------------------------------------------------------------
export function makeFileName(studentName) {
  let n = String(studentName || "").replace(/[<>:"'/|?*\u0000-\u001f]/g, "").trim();
  n = n.replace(/\s+/g, "_").replace(/\.+$/g, "");
  if (!n) n = "Student";
  return `Grade7_Physics_Unit1_Lesson1_Report_${n}.txt`;
}

// ---------------------------------------------------------------------------
// بناء نص التقرير TXT (UTF-8)
// ---------------------------------------------------------------------------
const STATUS_AR = {
  correct: "صحيحة",
  partial: "صحيحة جزئياً",
  incorrect: "غير صحيحة",
  unanswered: "بدون إجابة",
};

export function buildReport({ meta, questions, answers, session, results }) {
  const L = [];
  const line = (s = "") => L.push(s);
  const hr = (ch = "=") => line(ch.repeat(70));

  hr();
  line("تقرير اختبار الفيزياء — الصف السابع");
  line(`الاختبار: ${meta.title}`);
  line(`المادة: ${meta.subject} — ${meta.grade}`);
  line(`${meta.unit} — ${meta.lesson}`);
  line(`نطاق المحتوى: ${meta.pages} من الكتاب المدرسي`);
  line(`عدد الأسئلة الرئيسية: ${meta.totalQuestions} | مجموع العلامات: ${meta.totalMarks}`);
  line(`معرّف الاختبار: ${meta.examId} — الإصدار ${meta.version} | معرّف المحاولة: ${session.attemptId}`);
  hr();
  line("");
  line("## بيانات الطالبة");
  line(`الاسم: ${session.studentName}`);
  line(`بداية الاختبار: ${fmtTs(session.startTs)}`);
  line(`وقت التسليم: ${fmtTs(session.submitTs)}`);
  line(`الزمن الكلي المستغرق: ${fmtDuration(session.submitTs - session.startTs)} (${session.submitTs - session.startTs} ms)`);
  line("");
  hr();
  line("## النتيجة الإجمالية");
  line(`الدرجة المحصلة: ${results.score} من ${results.total}`);
  line(`النسبة المئوية: ${results.percent.toFixed(1)}%`);
  const c = results.counts;
  const totalP = questions.reduce((a, q) => a + q.parts.length, 0);
  line(`عدد الأجزاء الصحيحة: ${c.correct} من ${totalP}`);
  line(`عدد الأجزاء الصحيحة جزئياً: ${c.partial} من ${totalP}`);
  line(`عدد الأجزاء غير الصحيحة: ${c.incorrect} من ${totalP}`);
  line(`عدد الأجزاء بدون إجابة: ${c.unanswered} من ${totalP}`);
  line("");
  hr();
  line("## التفاصيل سؤالاً سؤالاً (الأسئلة الرئيسية وأجزاؤها)");
  line("");
  let qi = 0;
  for (const q of questions) {
    qi++;
    const qd = results.details.filter((d) => d.qid === q.id);
    const qScore = qd.reduce((a, d) => a + d.awarded, 0);
    line(`--- السؤال ${qi} من ${meta.totalQuestions} --- (${q.marks} علامة) — ${q.title}`);
    if (q.instruction) line(`التعليمات: ${stripMathMarks(q.instruction)}`);
    if (q.intro) line(`السياق: ${stripMathMarks(q.intro)}`);
    if (q.graph) line(`الرسم البياني: ${stripMathMarks((q.graph && graphById(q.graph)?.text) || "")}`);
    if (q.graphs) for (const g of q.graphs) line(`الرسم البياني: ${stripMathMarks(graphById(g)?.text || "")}`);
    line(`المصدر في الكتاب: ${q.ref}`);
    line(`درجة السؤال: ${qScore} / ${q.marks}`);
    line("");
    q.parts.forEach((p, i) => {
      const d = qd.find((x) => x.part.id === p.id);
      const label = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"][i] || `${i + 1}`;
      line(`  [${label}] (${p.marks} علامة) — ${stripMathMarks(p.prompt)}`);
      line(`      إجابة الطالبة: ${d.studentText}`);
      line(`      الإجابة الصحيحة: ${d.correctText}`);
      line(`      الدرجة الممنوحة: ${d.awarded} / ${p.marks} — الحالة: ${STATUS_AR[d.status]}`);
      line(`      التوضيح/سبب التصحيح: ${stripMathMarks(p.explanation)}`);
      line(`      المرجع الداخلي: ${p.ref}`);
      line("");
    });
    line("");
  }
  hr();
  line("## ملاحظات التصحيح");
  line("- التصحيح آلي بالاعتماد على تعريفات الكتاب وصفحاته 3–16؛ الأجزاء النصية تُصحَّح بمطابقة الكلمات المفتاحيةizen.</n".replace("izen.", "."));
    line("- الأرقام في هذا التقرير (التواريخ والأزمنة والدرجات) بالأرقام الغربية 0–9.");
  line("- هذا التقرير وُلّد محلياً في المتصفح عند التسليم، ولم يُرسل إلى أي جهة خارجية.");
  hr();
  line(`نهاية التقرير — ${meta.examId} v${meta.version}`);
  return L.join("\n");
}

// helping lookup injected by App (to avoid circular import of graphs)
let graphById = () => null;
export function bindGraphs(graphs) {
  graphById = (id) => graphs[id] || null;
}

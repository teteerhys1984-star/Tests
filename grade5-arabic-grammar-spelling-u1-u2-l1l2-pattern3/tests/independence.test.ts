import fs from "node:fs";
import path from "node:path";
import {
  ATTEMPT_STORAGE_KEY,
  EXAM_ID,
  EXAM_TITLE,
  SHEETS_TOKEN,
  SHEETS_URL,
  SOUND_STORAGE_KEY,
} from "../src/config";
import {
  PENDING_PREFIX,
  SENT_PREFIX,
  buildPayload,
  hasPending,
  isSent,
  retryPending,
  sendWithRetry,
  type StorageLike,
} from "../src/utils/submit";
import { loadSession, saveSession, type Session } from "../src/App";
import { EXAM_DATA } from "../src/data/questions/examQuestions";

let failures = 0;
process.exitCode = 1;
const check = (name: string, cond: boolean, detail = "") => {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name + (detail ? " → " + detail : ""));
  } else {
    console.log("  ✓ " + name);
  }
};

const rootDir = process.cwd();
const repoDir = path.resolve(rootDir, "..");

const MODEL1_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2";
const MODEL2_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern2";
const MODEL3_ID = "grade5-arabic-grammar-spelling-u1-u2-l1l2-pattern3";

class SharedLocalStorage implements StorageLike {
  map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

function collectSourceText(dir: string): string {
  const entries = fs.readdirSync(dir, { recursive: true });
  return entries
    .filter((f) => String(f).endsWith(".ts") || String(f).endsWith(".tsx"))
    .map((f) => fs.readFileSync(path.join(dir, String(f)), "utf8"))
    .join("\n");
}

async function main() {
  // 1) التحقق من المجلدات والهويات والعناوين في النماذج الثلاثة
  const m1Dir = path.join(repoDir, MODEL1_ID);
  const m2Dir = path.join(repoDir, MODEL2_ID);
  const m3Dir = rootDir;

  check("وجود مجلدات النماذج الثلاثة وعدم بقاء المجلد الأصلي المؤقت", fs.existsSync(m1Dir) && fs.existsSync(m2Dir) && fs.existsSync(m3Dir) && !fs.existsSync(path.join(repoDir, "Arabic_U1_U2L1L2_Pattern 3")));
  check("اسم مجلد النموذج الثالث يطابق EXAM_ID حرفيًا", path.basename(m3Dir) === EXAM_ID && EXAM_ID === MODEL3_ID);
  check("معرفات النماذج الثلاثة مختلفة وفريدة", new Set([MODEL1_ID, MODEL2_ID, EXAM_ID]).size === 3);

  const m1Submit = fs.readFileSync(path.join(m1Dir, "src", "utils", "submit.ts"), "utf8");
  const m1Storage = fs.readFileSync(path.join(m1Dir, "src", "utils", "storage.ts"), "utf8");
  const m2Config = fs.readFileSync(path.join(m2Dir, "src", "config.ts"), "utf8");

  const m1ExamId = /EXAM_ID\s*=\s*'([^']+)'/.exec(m1Submit)?.[1];
  const m1SessionKey = /KEY\s*=\s*'([^']+)'/.exec(m1Storage)?.[1];
  const m2ExamId = /EXAM_ID\s*=\s*"([^"]+)"/.exec(m2Config)?.[1];
  const m2SessionKey = `exam:${m2ExamId}:v1`;
  const m2SoundKey = `exam:${m2ExamId}:sound`;

  check("النموذج الأول محتفظ بـ EXAM_ID ومفتاح جلسته الأصليين دون تغيير", m1ExamId === MODEL1_ID && m1SessionKey === `${MODEL1_ID}:session:v1`);
  check("النموذج الثاني محتفظ بـ EXAM_ID ومفتاحي الجلسة والصوت دون تغيير", m2ExamId === MODEL2_ID && m2SessionKey === `exam:${MODEL2_ID}:v1`);

  // فحص عدم تصادم أي مفتاح تخزين محلي بين النماذج الثلاثة
  const allSessionAndPrefKeys = [
    m1SessionKey!,
    m2SessionKey,
    m2SoundKey,
    ATTEMPT_STORAGE_KEY,
    SOUND_STORAGE_KEY,
  ];
  check("جميع مفاتيح الجلسة والصوت عبر النماذج الثلاثة مستقلة ولا تتصادم", new Set(allSessionAndPrefKeys).size === allSessionAndPrefKeys.length);

  const allPrefixes = [
    `pending:${MODEL1_ID}:`,
    `pending:${MODEL2_ID}:`,
    PENDING_PREFIX,
    `sent:${MODEL1_ID}:`,
    `sent:${MODEL2_ID}:`,
    SENT_PREFIX,
  ];
  check("بوادئ pending و sent للنماذج الثلاثة مستقلة ولا تتداخل نصيًا", new Set(allPrefixes).size === 6 && !PENDING_PREFIX.startsWith(`pending:${MODEL1_ID}:`) && !PENDING_PREFIX.startsWith(`pending:${MODEL2_ID}:`));

  // فحص خلو شيفرة النموذج الثالث من المفاتيح العامة القديمة ومن مفاتيح النموذجين الأول والثاني
  const src3 = collectSourceText(path.join(m3Dir, "src"));
  check(
    "خلو شيفرة النموذج الثالث من المفاتيح العامة القديمة (arabic-grade5-exam-session-v1 / sound)",
    !src3.includes("arabic-grade5-exam-session-v1") && !src3.includes("arabic-grade5-exam-sound"),
  );
  check(
    "خلو شيفرة النموذج الثالث من مفاتيح النموذجين الأول والثاني",
    !src3.includes(`${MODEL1_ID}:session:v1`) && !src3.includes(`exam:${MODEL2_ID}:v1`) && !src3.includes("zahrat-almarifa:"),
  );

  // التحقق من عدم فرتكة EXAM_ID مقابل أي اختبار آخر في المستودع
  const otherExamFolders = fs
    .readdirSync(repoDir)
    .filter((name) => name !== MODEL3_ID && !name.startsWith(".") && name !== "landing" && fs.existsSync(path.join(repoDir, name, "package.json")));
  check("معرف النموذج الثالث لا يطابق اسم أي مجلد اختبار آخر في المستودع", !otherExamFolders.includes(EXAM_ID));

  // فحص العنوان المطلوب حرفيًا في config.ts و index.html
  const expectedTitle = "قواعد اللغة والإملاء للوحدة الأولى وأول درسين من الوحدة الثانية — نموذج ثالث";
  const indexHtml = fs.readFileSync(path.join(m3Dir, "index.html"), "utf8");
  const titleMatch = /<title>(.*?)<\/title>/s.exec(indexHtml)?.[1]?.trim();
  check("عنوان الاختبار في config.ts و index.html يطابق العنوان المطلوب حرفيًا", EXAM_TITLE === expectedTitle && titleMatch === expectedTitle);

  // فحص مطابقة SHEETS_URL و SHEETS_TOKEN للنموذجين السابقين
  check("SHEETS_URL و SHEETS_TOKEN يطابقان عقد المنصة في النموذجين الأول والثاني", m1Submit.includes(SHEETS_URL) && m1Submit.includes(SHEETS_TOKEN) && m2Config.includes(SHEETS_URL) && m2Config.includes(SHEETS_TOKEN));

  // 2) محاكاة تفاعل حي مشترك على نفس كائن localStorage لإثبات العزل الكامل بين النماذج الثلاثة
  const sharedStorage = new SharedLocalStorage();
  (globalThis as unknown as { localStorage: StorageLike }).localStorage = sharedStorage;

  // بيانات جلسة ومحاولات معلقة ومرسلة للنموذج الأول والنموذج الثاني
  const m1SessionSnapshot = JSON.stringify({ version: 1, attemptId: "att-m1-live", studentName: "طالبة نموذج 1", status: "in_progress" });
  const m1PendingSnapshot = JSON.stringify({ attemptId: "att-m1-pend", examId: MODEL1_ID, studentName: "طالبة 1" });
  const m1SentSnapshot = "1";

  const m2SessionSnapshot = JSON.stringify({ version: 1, id: "att-m2-live", studentName: "طالبة نموذج 2", startedAt: 1700000000000, submittedAt: null, answers: {}, current: 2 });
  const m2PendingSnapshot = JSON.stringify({ attemptId: "att-m2-pend", examId: MODEL2_ID, studentName: "طالبة 2" });
  const m2SentSnapshot = "1";

  sharedStorage.setItem(m1SessionKey!, m1SessionSnapshot);
  sharedStorage.setItem(`pending:${MODEL1_ID}:att-m1-pend`, m1PendingSnapshot);
  sharedStorage.setItem(`sent:${MODEL1_ID}:att-m1-done`, m1SentSnapshot);

  sharedStorage.setItem(m2SessionKey, m2SessionSnapshot);
  sharedStorage.setItem(m2SoundKey, "false");
  sharedStorage.setItem(`pending:${MODEL2_ID}:att-m2-pend`, m2PendingSnapshot);
  sharedStorage.setItem(`sent:${MODEL2_ID}:att-m2-done`, m2SentSnapshot);

  // أ) فتح النموذج الثالث عندما تكون جلسات النموذجين 1 و 2 نشطة: يجب أن يعيد null ولا يقرأ جلسة غيره
  check("فتح النموذج الثالث لا يقرأ جلسة النموذج الأول أو الثاني", loadSession() === null);

  // ب) بدء جلسة في النموذج الثالث وحفظ إجابات ثم التسليم وإرسال النتيجة ثم إعادة الاختبار (حذف الجلسة)
  const p3Session: Session = {
    studentName: "طالبة نموذج 3",
    attemptId: "att-m3-live",
    startTimestamp: 1700000000000,
    answers: Object.fromEntries(EXAM_DATA.questions.flatMap((q) => q.subparts.map((sp) => [sp.id, sp.correctAnswer]))),
    currentIndex: 5,
    submitted: true,
    submittedAt: 1700000090000,
    durationMs: 90000,
    soundOn: true,
  };
  saveSession(p3Session);
  check("حفظ واسترجاع جلسة النموذج الثالث يعمل بمعزل تام", loadSession()?.attemptId === "att-m3-live");

  const p3Payload = buildPayload({
    attemptId: p3Session.attemptId,
    studentName: p3Session.studentName,
    startTimestamp: p3Session.startTimestamp,
    submittedAt: p3Session.submittedAt!,
    durationMs: p3Session.durationMs!,
    answers: p3Session.answers,
  });

  // فشل الإرسال أولًا لتخزين pending خاص بالنموذج الثالث
  await sendWithRetry(p3Payload, {
    storage: sharedStorage,
    sleep: async () => {},
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  check("حفظ محاولة النموذج الثالث المعلّقة تحت مفتاحه المستقل", hasPending("att-m3-live", { storage: sharedStorage }));

  // تشغيل retryPending للنموذج الثالث: يجب أن يرسل محاولة النموذج الثالث وحدها ولا يرسل محاولات النموذجين 1 و 2
  const sentBodies: string[] = [];
  const flushed = await retryPending({
    storage: sharedStorage,
    sleep: async () => {},
    fetchImpl: async (_url, init) => {
      sentBodies.push(String(init.body));
      return { text: async () => JSON.stringify({ ok: true }) };
    },
  });
  check(
    "retryPending للنموذج الثالث أرسل محاولته فقط ولم يرسل محاولات النموذجين 1 و 2",
    flushed === 1 &&
      sentBodies.length === 1 &&
      JSON.parse(sentBodies[0]).examId === MODEL3_ID &&
      !hasPending("att-m3-live", { storage: sharedStorage }) &&
      isSent("att-m3-live", { storage: sharedStorage }),
  );

  // إعادة الاختبار في النموذج الثالث (حذف جلسته)
  saveSession(null);
  check("حذف جلسة النموذج الثالث عند إعادة الاختبار يمسح مفتاحه فقط", loadSession() === null);

  // ج) التحقق من بقاء جميع مفاتيح النموذجين الأول والثاني سليمة حرفيًا دون أي تعديل أو حذف
  check(
    "بيانات النموذج الأول (الجلسة، المحاولات المعلّقة، حالة الإرسال) لم تتأثر إطلاقًا",
    sharedStorage.getItem(m1SessionKey!) === m1SessionSnapshot &&
      sharedStorage.getItem(`pending:${MODEL1_ID}:att-m1-pend`) === m1PendingSnapshot &&
      sharedStorage.getItem(`sent:${MODEL1_ID}:att-m1-done`) === m1SentSnapshot,
  );
  check(
    "بيانات النموذج الثاني (الجلسة، الصوت، المحاولات المعلّقة، حالة الإرسال) لم تتأثر إطلاقًا",
    sharedStorage.getItem(m2SessionKey) === m2SessionSnapshot &&
      sharedStorage.getItem(m2SoundKey) === "false" &&
      sharedStorage.getItem(`pending:${MODEL2_ID}:att-m2-pend`) === m2PendingSnapshot &&
      sharedStorage.getItem(`sent:${MODEL2_ID}:att-m2-done`) === m2SentSnapshot,
  );

  console.log(failures === 0 ? "independence suite OK" : `${failures} failure(s)`);
  if (failures === 0) process.exitCode = 0;
}

void main();

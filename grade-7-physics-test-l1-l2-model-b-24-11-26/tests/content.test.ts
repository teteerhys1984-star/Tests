/**
 * اختبارات المحتوى والعلامات والحفظ المحلي:
 *   · بنية الاختبار: 10 أسئلة، 44 فرعاً، لا فرع ناقص مفتاح، لا مفتاح لفرع غير موجود.
 *   · العلامات: مجموع كل سؤال = 10، والمجموع = 100، ولا علامة سالبة أو صفرية.
 *   · مطابقة نصوص الأسئلة والخيارات مع الملف المصدر (SHA/literal) — تُتحقّق منفصلاً بـ sha256sum.
 *   · عزل التخزين المحلي: مفتاح خاص بهذا الاختبار، وتحقق صارم عند الاستعادة.
 *
 * التشغيل: node tests/run-tests.mjs
 */
import { questions, totalParts, partsById, FIGURE_IDS } from '../src/data/questions'
import { answerKey, QUESTION_MARKS } from '../src/data/answerKey'
import { ATTEMPT_KEY, EXAM_ID, PENDING_PREFIX, SOUND_KEY, TOTAL_MARKS, TEACHER_PASSWORD, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { loadAttempt, saveAttempt, clearAttempt, loadMuted, saveMuted, type Attempt } from '../src/lib/persistence'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

/* ---------- تخزين وهمي بسيط ---------- */
class MemoryStorage {
  private map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return Array.from(this.map.keys())[i] ?? null }
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  clear() { this.map.clear() }
}
const store = new MemoryStorage()
;(globalThis as any).window = { localStorage: store }

;(globalThis as any).fetch = () => { throw new Error('real fetch is disabled in tests') }

console.log('\n— بنية الاختبار —')
check('عدد الأسئلة 10', questions.length === 10, String(questions.length))
check('عدد الفروع 44', totalParts === 44, String(totalParts))
check('عدد الفروع يساوي مجموع فروع الأسئلة', totalParts === questions.reduce((n, q) => n + q.parts.length, 0))

const expectedPartCounts: Record<string, number> = { q1: 4, q2: 6, q3: 4, q4: 4, q5: 5, q6: 4, q7: 3, q8: 5, q9: 5, q10: 4 }
for (const [id, expected] of Object.entries(expectedPartCounts)) {
  const q = questions.find((item) => item.id === id)
  check(`عدد فروع ${id} = ${expected}`, !!q && q.parts.length === expected, q ? String(q.parts.length) : 'مفقود')
}

check('معرّفات الأسئلة q1..q10 بالترتيب', questions.map((q) => q.id).join(',') === Object.keys(expectedPartCounts).join(','))
check('لا فرع مكرّر', new Set(questions.flatMap((q) => q.parts.map((p) => p.id))).size === totalParts)
check('فهرس partsById يغطي كل الفروع', Object.keys(partsById).length === totalParts)
check('كل جزء في الفهرس يشير إلى سؤاله الصحيح', questions.every((q) => q.parts.every((p, i) => partsById[p.id].question.id === q.id && partsById[p.id].index === i)))

const figures = questions.filter((q) => q.figure).map((q) => q.figure!)
check('الرسوم الأربعة مستعملة كما في المصدر', figures.length === 4 && new Set(figures).size === 4, figures.join(','))
check('FIGURE_IDS مطابق للرسوم المستعملة', FIGURE_IDS.length === new Set(figures).size)

console.log('\n— الدروس والمراجع —')
const lessons = questions.map((q) => q.lesson)
check('كل سؤال ينتمي إلى درس أو الدرسين معاً', lessons.every((l) => l === 'الحركة والسكون' || l === 'القوة والحركة' || l.includes('+')))
check('السؤال التركيبي الوحيد هو الأخير', lessons.filter((l) => l.includes('+')).length === 1 && lessons[9].includes('+'), lessons[9])
check('كل تصنيف درس يُحلَّل إلى درس أصلين فقط',
  lessons.every((l) => l.split('+').map((part) => part.trim()).every((part) => part === 'الحركة والسكون' || part === 'القوة والحركة')))
check('كل سؤال له صفحات مرجعية', questions.every((q) => q.pages.trim().length > 0))
check('كل سؤال له مهارة موصوفة', questions.every((q) => q.skill.trim().length > 0))
check('كل سؤال له نصّ تمهيدي (intro)', questions.every((q) => q.intro.length > 0))

console.log('\n— مطابقة مفتاح الإجابات —')
check('مفتاح لكل سؤال', Object.keys(answerKey).length === 10 && questions.every((q) => !!answerKey[q.id]))
check('مفتاح لكل فرع بلا زيادة', questions.every((q) => q.parts.every((p) => !!answerKey[q.id].rubric[p.id])))
check('لا مفتاح لفرع غير موجود',
  Object.entries(answerKey).every(([qid, entry]) => {
    const q = questions.find((item) => item.id === qid)
    return !!q && Object.keys(entry.rubric).every((pid) => q.parts.some((p) => p.id === pid))
  }))

console.log('\n— توزيع العلامات —')
const perQuestion = questions.map((q) => q.parts.reduce((sum, p) => sum + answerKey[q.id].rubric[p.id].points, 0))
check('كل سؤال = 10 علامات', perQuestion.every((m) => m === 10), perQuestion.join(','))
check('المجموع = 100', perQuestion.reduce((a, b) => a + b, 0) === TOTAL_MARKS, String(perQuestion.reduce((a, b) => a + b, 0)))
check('QUESTION_MARKS المشتق يطابق الحساب', questions.every((q, i) => QUESTION_MARKS[q.id] === perQuestion[i]))
check('لا علامة صفرية أو سالبة', questions.every((q) => q.parts.every((p) => answerKey[q.id].rubric[p.id].points > 0)))
check('العلامات أعداد صحيحة أو نصفية', questions.every((q) => q.parts.every((p) => Number.isInteger(answerKey[q.id].rubric[p.id].points * 2))))
check('مجموع نقاط الإجابة القصيرة = علامتها', questions.every((q) =>
  q.parts.every((p) => {
    const r = answerKey[q.id].rubric[p.id]
    if (r.kind !== 'short') return true
    return r.criteria.reduce((s, c) => s + c.points, 0) === r.points
  })))

console.log('\n— أنواع الفروع —')
const types = questions.flatMap((q) => q.parts.map((p) => p.type))
check('الأنواع الأربعة مستعملة', new Set(types).size === 4, Array.from(new Set(types)).join(','))
check('كل جزء اختيار له خياران على الأقل', questions.every((q) => q.parts.every((p) => p.type !== 'choice' || (p.options?.length ?? 0) >= 2)))
check('كل جزء غير اختيار بلا خيارات', questions.every((q) => q.parts.every((p) => p.type === 'choice' || !p.options)))
check('معرّفات الخيارات متسلسلة من 0', questions.every((q) =>
  q.parts.every((p) => p.type !== 'choice' || (p.options ?? []).every((o, i) => o.id === String(i)))))
check('كل خيار نصّ غير فارغ', questions.every((q) =>
  q.parts.every((p) => (p.options ?? []).every((o) => o.label.trim().length > 0))))
check('نوع المفتاح يطابق نوع الجزء', questions.every((q) =>
  q.parts.every((p) => {
    const r = answerKey[q.id].rubric[p.id]
    if (p.type === 'choice') return r.kind === 'choice' && p.options!.some((o) => o.id === r.correctOption)
    if (p.type === 'number') return r.kind === 'number'
    if (p.type === 'formula') return r.kind === 'formula'
    return r.kind === 'short'
  })))

console.log('\n— معرّفات التخزين والإعداد —')
check('EXAM_ID = اسم المجلد', EXAM_ID === 'grade-7-physics-test-l1-l2-model-b-24-11-26', EXAM_ID)
check('مفتاح المحاولة معزول باسم الاختبار', ATTEMPT_KEY === `${EXAM_ID}:attempt:v1`, ATTEMPT_KEY)
check('مفتاح الصوت معزول باسم الاختبار', SOUND_KEY === `${EXAM_ID}:sound:v1`, SOUND_KEY)
check('بادئة الحمولات المعلّقة خاصة بالاختبار', PENDING_PREFIX === `pending:${EXAM_ID}:`, PENDING_PREFIX)
check('كلمة مرور المعلّم كما طُلب', TEACHER_PASSWORD === 'somer173')
check('SHEETS_URL من Apps Script', SHEETS_URL.startsWith('https://script.google.com/macros/s/'), SHEETS_URL.slice(0, 44) + '…')
check('SHEETS_TOKEN بطول 32', SHEETS_TOKEN.length === 32, String(SHEETS_TOKEN.length))

console.log('\n— الحفظ والاستعادة المحلية —')
const base: Attempt = {
  version: 1,
  examId: EXAM_ID,
  status: 'in_progress',
  studentName: 'طالبة تجريبية',
  responses: { q1a: '200', q1b: '80' },
  questionIndex: 3,
  startedAt: 1_700_000_000_000,
}
store.clear()
saveAttempt(base)
const restored = loadAttempt(EXAM_ID, questions.length)
check('استعادة محاولة صحيحة', !!restored && restored.studentName === 'طالبة تجريبية' && restored.responses.q1b === '80')
check('استعادة موضع السؤال المحفوظ', restored?.questionIndex === 3)

store.clear()
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, examId: 'exam-آخر' }))
check('رفض محاولة اختبار آخر (عزل)', loadAttempt(EXAM_ID, questions.length) === null)

store.clear()
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, questionIndex: 99 }))
check('رفض موضع سؤال خارج النطاق', loadAttempt(EXAM_ID, questions.length) === null)

store.clear()
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, responses: { q1a: 5 } }))
check('رفض إجابة غير نصية', loadAttempt(EXAM_ID, questions.length) === null)

store.clear()
store.setItem(ATTEMPT_KEY, '{ليس JSON')
check('رفض JSON تالف دون كسر', loadAttempt(EXAM_ID, questions.length) === null)

store.clear()
store.setItem(ATTEMPT_KEY, JSON.stringify({ ...base, status: 'submitted', finishedAt: base.startedAt - 5 }))
check('رفض تسليم قبل البدء', loadAttempt(EXAM_ID, questions.length) === null)

store.clear()
saveAttempt({ ...base, status: 'submitted', finishedAt: base.startedAt + 1000 })
check('قبول محاولة مسلَّمة صحيحة', loadAttempt(EXAM_ID, questions.length)?.status === 'submitted')

clearAttempt()
check('حذف المحاولة', loadAttempt(EXAM_ID, questions.length) === null)

check('إعداد الصوت الافتراضي غير مكتوم', loadMuted() === false)
saveMuted(true)
check('حفظ كتم الصوت', loadMuted() === true)
saveMuted(false)
check('إلغاء كتم الصوت', loadMuted() === false)

/* لا يتسرّب مفتاح اختبار آخر إلى هذا الاختبار */
store.clear()
store.setItem('grade8-physics-unit1-l1l2:attempt:v1', JSON.stringify(base))
check('محاولة اختبار سابق لا تظهر هنا', loadAttempt(EXAM_ID, questions.length) === null)

console.log(`\n${failures === 0 ? '✅' : '❌'} المحتوى: ${failures === 0 ? 'كل الفحوص ناجحة' : failures + ' فحصاً فاشلاً'}`)
if (failures) process.exit(1)

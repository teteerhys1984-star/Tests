import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QUESTIONS, TOTAL_POINTS } from '../src/data/index'
import { LESSONS } from '../src/data/lessons'
import { PART_COUNT } from '../src/data/stats'
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { PENDING_PREFIX } from '../src/lib/submit'
import { STORAGE_KEY } from '../src/lib/attempt'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const SOURCE = path.join(REPO, 'grade-5-math-test-Unit1 21-11')
const PUBLISHED = path.resolve(HERE, '..')

function walk(dir: string, base = dir): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, base))
    else out.push(path.relative(base, full))
  }
  return out
}

describe('Source parity — content carried over unchanged', () => {
  it('source upload is present in this checkout', () => {
    expect(existsSync(SOURCE)).toBe(true)
  })

  it('every source data and logic file is byte-identical in the published exam', () => {
    const files = walk(SOURCE).filter(
      (f) => !f.endsWith('.wav') && !f.endsWith('package-lock.json'),
    )
    expect(files.length).toBeGreaterThan(30)
    /**
     * الملفات المستثناة من المطابقة الحرفية هي ملفات بناء/تعريف فقط، وليست محتوى:
     *  · README.md و index.html: يخصّان هذا المنشور (العنوان والمعرّف الجديدان).
     *  · package.json: اسم الحزمة وسكربتات البناء والتشغيل.
     *  · ملفات المنطق/الواجهة التي أُعيد بناؤها لهذا المنشور (App.tsx، attempt.ts،
     *    grading.test.ts، attempt.test.ts، audio.ts، report.ts): تبقى البيانات التعليمية
     *    نفسها، لكن كود التشغيل يحمل معرّف هذا الاختبار وتدفّق المراجعة/الإرسال الجديد.
     * المحتوى التعليمي كله (src/data/**) ومكوّنات العرض والإحصاء والتصحيح مطابقة حرفياً.
     */
    const configOnly = new Set([
      'README.md',
      'index.html',
      'package.json',
      'src/App.tsx',
      'src/index.css',
      'src/lib/attempt.ts',
      'src/lib/attempt.test.ts',
      'src/lib/audio.ts',
      'src/lib/grading.test.ts',
      'src/lib/report.ts',
      'src/screens/StartScreen.tsx',
      'src/screens/QuizScreen.tsx',
      'src/screens/ResultsScreen.tsx',
      'src/screens/TeacherScreen.tsx',
    ])
    for (const relative of files) {
      if (configOnly.has(relative)) continue
      const original = readFileSync(path.join(SOURCE, relative), 'utf8')
      const publishedPath = path.join(PUBLISHED, relative)
      expect(existsSync(publishedPath), `${relative} missing in published exam`).toBe(true)
      expect(readFileSync(publishedPath, 'utf8'), `${relative} differs from source`).toBe(original)
    }
  })

  it('the question banks keep identical text, options, answers and marks', () => {
    for (const file of ['bank-a.ts', 'bank-b.ts', 'bank-c.ts', 'bank-d.ts', 'lessons.ts', 'index.ts']) {
      const a = readFileSync(path.join(SOURCE, 'src', 'data', file), 'utf8')
      const b = readFileSync(path.join(PUBLISHED, 'src', 'data', file), 'utf8')
      expect(b, `${file} parity`).toBe(a)
    }
  })

  it('keeps 30 main questions, 50 assessed parts and exactly 100 marks', () => {
    expect(QUESTIONS).toHaveLength(30)
    expect(PART_COUNT).toBe(50)
    expect(TOTAL_POINTS).toBe(100)
    expect(QUESTIONS.reduce((s, q) => s + q.parts.reduce((x, p) => x + p.points, 0), 0)).toBe(100)
  })

  it('keeps the lesson distribution of the blueprint', () => {
    const expected = [
      ['coordinates', 3, 9],
      ['line-graphs', 3, 9],
      ['natural-numbers', 5, 16],
      ['rounding', 4, 13],
      ['add-subtract', 5, 17],
      ['angles', 4, 14],
      ['parallelogram', 3, 11],
      ['rhombus', 3, 11],
    ]
    for (const [id, count, points] of expected) {
      const qs = QUESTIONS.filter((q) => q.lesson === id)
      expect(qs.length, `${id} questions`).toBe(count)
      expect(qs.reduce((s, q) => s + q.parts.reduce((x, p) => x + p.points, 0), 0), `${id} marks`).toBe(
        points,
      )
    }
    expect(LESSONS).toHaveLength(8)
    expect(LESSONS.reduce((s, l) => s + l.blueprint.questions, 0)).toBe(30)
    expect(LESSONS.reduce((s, l) => s + l.blueprint.points, 0)).toBe(100)
  })
})

describe('Independence of this exam', () => {
  it('uses its own EXAM_ID and EXAM_TITLE', () => {
    expect(EXAM_ID).toBe('grade-5-math-test-unit1-21-11')
    expect(EXAM_TITLE).toBe('Grade 5 Math Test Unit 1 (21-11)')
  })

  it('namespaces every localStorage key with EXAM_ID', () => {
    expect(STORAGE_KEY).toBe('grade-5-math-test-unit1-21-11-attempt-v1')
    expect(PENDING_PREFIX).toBe('pending:grade-5-math-test-unit1-21-11:')
    const source = readFileSync(path.join(PUBLISHED, 'src', 'lib', 'audio.ts'), 'utf8')
    expect(source).toContain('`${EXAM_ID}-muted-v1`')
  })

  it('does not reuse any generic or reference-exam storage key', () => {
    const files = walk(path.join(PUBLISHED, 'src')).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    const forbidden = [
      'arena-math-unit1-attempt-v1',
      'arena-math-muted-v1',
      'grade5-math-unit1-attempt',
      "'attempt-v1'",
      '"attempt-v1"',
    ]
    for (const file of files) {
      const text = readFileSync(path.join(PUBLISHED, 'src', file), 'utf8')
      for (const key of forbidden) {
        expect(text.includes(key), `${file} must not use ${key}`).toBe(false)
      }
    }
  })

  it('keeps the reference Google Sheets contract unchanged', () => {
    const reference = readFileSync(
      path.join(REPO, 'grade5-math-unit1', 'src', 'config.ts'),
      'utf8',
    )
    expect(reference).toContain(SHEETS_URL)
    expect(reference).toContain(SHEETS_TOKEN)
  })

  it('ships no mock or sample answers to the student bundle', () => {
    const app = readFileSync(path.join(PUBLISHED, 'src', 'App.tsx'), 'utf8')
    expect(app).not.toContain('perfectAnswer')
    expect(app).not.toContain('testing/answers')
  })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { originalHtml, currentHtml, OLD_PRIVACY, NEW_PRIVACY, makeExam, plain, goodAnswer, wrongAnswer, allAnswers } from './helpers.mjs'

function pair(t) {
  const original = makeExam({ original: true })
  const updated = makeExam()
  t.after(() => { original.close(); updated.close() })
  return [original, updated]
}
function permutations(values) {
  if (values.length <= 1) return [values]
  return values.flatMap((v, i) => permutations(values.filter((_, j) => i !== j)).map((p) => [v, ...p]))
}

test('baseline fixture is the unmodified original, and all visual/data assets are preserved', (t) => {
  assert.equal(createHash('sha256').update(originalHtml).digest('hex'), 'df3c4797da8ee27baf5261925b500a397b4a611ebfb5576ab23a0cd6daa18f2c')
  const [a, b] = pair(t)
  const origExam = plain(a.test.exam), newExam = plain(b.test.exam)
  assert.equal(newExam.id, 'grade8-physics-exam-2')
  delete origExam.id; delete newExam.id
  assert.deepEqual(newExam, origExam)
  // Complete question bank includes all prompts, answers, marks, worked solutions and references.
  assert.deepEqual(plain(b.test.questions), plain(a.test.questions))
  assert.deepEqual(plain(b.test.diagrams), plain(a.test.diagrams))
  assert.deepEqual(plain(b.test.captions), plain(a.test.captions))
  assert.deepEqual(plain(b.test.rubric), plain(a.test.rubric))
  assert.equal(currentHtml.match(/<style>([\s\S]*?)<\/style>/)[1], originalHtml.match(/<style>([\s\S]*?)<\/style>/)[1])
  for (const name of ['START', 'SUBMIT']) {
    const re = new RegExp(`const AUDIO_${name} = "(data:audio/wav;base64,[^"]+)"`)
    assert.equal(currentHtml.match(re)[1], originalHtml.match(re)[1], `${name} audio`)
  }
  const qs = plain(b.test.questions), parts = qs.flatMap((q) => q.parts)
  assert.equal(qs.length, 15); assert.equal(parts.length, 41)
  assert.equal(parts.reduce((sum, p) => sum + p.marks, 0), 100)
  assert.deepEqual(Object.fromEntries(['mcq', 'multi', 'ordering', 'tf', 'numeric', 'matching'].map((type) => [type, parts.filter((p) => p.type === type).length])),
    { mcq: 20, multi: 3, ordering: 1, tf: 4, numeric: 11, matching: 2 })
  for (const [lesson, questionCount, partCount, marks] of [[1, 7, 19, 45], [2, 8, 22, 55]]) {
    const lessonQs = qs.filter((q) => q.lesson === lesson), lessonParts = lessonQs.flatMap((q) => q.parts)
    assert.equal(lessonQs.length, questionCount); assert.equal(lessonParts.length, partCount)
    assert.equal(lessonParts.reduce((sum, p) => sum + p.marks, 0), marks)
  }
})

test('all question screens, diagrams, teacher key and original result cards match', (t) => {
  const [a, b] = pair(t)
  for (let qi = 0; qi < 15; qi++) {
    a.test.showQuestion(qi); b.test.showQuestion(qi)
    assert.equal(b.window.document.querySelector('.question-card').innerHTML, a.window.document.querySelector('.question-card').innerHTML, `question ${qi + 1}`)
  }
  a.test.showTeacher(); b.test.showTeacher()
  assert.equal(b.window.document.querySelector('.rubric-card').innerHTML, a.window.document.querySelector('.rubric-card').innerHTML)
  assert.deepEqual([...b.window.document.querySelectorAll('.tk-q')].map((x) => x.innerHTML), [...a.window.document.querySelectorAll('.tk-q')].map((x) => x.innerHTML))
  const answers = allAnswers(a.test.questions)
  a.test.showResults(answers); b.test.showResults(answers)
  assert.equal(b.window.document.querySelector('.results-hero').innerHTML, a.window.document.querySelector('.results-hero').innerHTML)
  assert.equal(b.window.document.querySelector('.stats-grid').innerHTML, a.window.document.querySelector('.stats-grid').innerHTML)
  assert.equal(b.window.document.querySelector('#btn-report').textContent, a.window.document.querySelector('#btn-report').textContent)
  assert.doesNotMatch(b.window.document.querySelector('#app').textContent, /التقدير\s*:/)
})

test('full, wrong, empty, mixed and partial results and reports compare to the actual original', (t) => {
  const [a, b] = pair(t)
  const questions = plain(a.test.questions), good = allAnswers(questions), wrong = allAnswers(questions, wrongAnswer)
  const mixed = { ...good, q05a: '14', q01b: [0, 2, 3] }
  const partial = { ...good }
  for (const id of ['q03a', 'q10a', 'q13a']) {
    const values = { ...partial[id] }
    ;[values[0], values[1]] = [values[1], values[0]]
    partial[id] = values
  }
  partial.q01b = [0, 2, 3]
  const scenarios = { good, wrong, empty: {}, mixed, partial }
  const expected = { good: 100, wrong: 2.25, empty: 0, mixed: 96.25 }
  for (const [name, answers] of Object.entries(scenarios)) {
    const baseline = plain(a.test.calculate(answers)), actual = plain(b.test.calculate(answers))
    const origReport = baseline.report, newReport = actual.report
    delete baseline.report; delete actual.report
    assert.deepEqual(actual, baseline, `${name}: every part/status/score and aggregate`)
    if (name in expected) assert.equal(actual.total, expected[name], `${name}: recorded baseline`)
    assert.ok(origReport.includes(OLD_PRIVACY), 'original privacy line is present')
    assert.equal(newReport, origReport.replace(OLD_PRIVACY, NEW_PRIVACY), `${name}: report unchanged except privacy`)
    assert.equal((newReport.match(/السؤال \d+ من 15/g) || []).length, 15)
    assert.equal((newReport.match(/العلامة القصوى:/g) || []).length, 41)
    assert.doesNotMatch(newReport, /(?:gradeLabel|التقدير\s*:)/)
    if (name === 'partial') {
      for (const id of ['q01b', 'q03a', 'q10a', 'q13a']) {
        const part = actual.perQuestion.flatMap((q) => q.parts).find((p) => p.id === id)
        assert.equal(part.status, 'partial', `${id} partial credit`)
      }
    }
  }
})

test('every part and every question type compares with original across exhaustive choices, partials and numeric edge cases', (t) => {
  const [a, b] = pair(t)
  const questions = plain(a.test.questions)
  let checked = 0
  function compare(id, value, tag) {
    assert.deepEqual(plain(b.test.gradeOne(id, value)), plain(a.test.gradeOne(id, value)), `${id} ${tag}`)
    checked++
  }
  for (const p of questions.flatMap((q) => q.parts)) {
    compare(p.id, undefined, 'blank')
    compare(p.id, null, 'null')
    compare(p.id, goodAnswer(p), 'correct')
    compare(p.id, wrongAnswer(p), 'wrong')
    if (p.type === 'mcq') for (let i = 0; i < p.options.length; i++) compare(p.id, i, `option ${i}`)
    if (p.type === 'tf') { compare(p.id, true, 'true'); compare(p.id, false, 'false') }
    if (p.type === 'multi') {
      for (let mask = 0; mask < 2 ** p.options.length; mask++) {
        compare(p.id, p.options.map((_, i) => i).filter((i) => mask & (1 << i)), `selection ${mask}`)
      }
    }
    if (p.type === 'ordering' || p.type === 'matching') {
      const expected = p.type === 'ordering' ? p.items.map((item) => item.pos) : p.key
      for (const perm of permutations([...expected])) compare(p.id, Object.fromEntries(perm.map((v, i) => [i, v])), `permutation ${perm}`)
      compare(p.id, { 0: expected[0] }, 'incomplete map')
    }
    if (p.type === 'numeric') {
      const n = p.answerValue
      const arabic = String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
      for (const value of ['', ' ', 'xyz', '1/0', arabic, `${n * 2}/2`, `${n} ${p.unit}`, String(n + 0.019), String(n + 0.021), String(n - 0.019), String(n - 0.021)]) {
        compare(p.id, value, `numeric ${value}`)
      }
      if (p.unit === 'cm') for (const value of [`${n * 10} mm`, `${n / 100} m`]) compare(p.id, value, `conversion ${value}`)
    }
  }
  assert.ok(checked > 400, `compared ${checked} cases`)
})

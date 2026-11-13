// Build the three standalone HTML entry points from the actual original page's
// sources. Audio remains embedded, so Pages only needs dist/index.html.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFile(path.join(root, name), 'utf8')
const [head, data, engine, sheets, grading, start, submit] = await Promise.all([
  read('exam-src/01-head.html'),
  read('exam-src/02-data.js'),
  read('exam-src/03-engine.js'),
  read('exam-src/05-sheets.js'),
  read('exam-src/04-grading.js'),
  readFile(path.join(root, 'exam-src/audio-start.wav')),
  readFile(path.join(root, 'exam-src/audio-submit.wav')),
])
for (const [source, token] of [[engine, '__AUDIO_START__'], [engine, '__AUDIO_SUBMIT__']]) {
  if (source.split(token).length !== 2) throw new Error(`Expected one ${token} placeholder`)
}
const engineWithAudio = engine
  .replace('__AUDIO_START__', start.toString('base64'))
  .replace('__AUDIO_SUBMIT__', submit.toString('base64'))
const html = `${head}<script>\n${data}${engineWithAudio}${sheets}${grading}</script></body></html>\n`
const targets = [
  'index.html',
  'Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html',
  'public/Grade8_Physics_Unit1_Lessons1-2_Interactive_Exam.html',
]
const check = process.argv.includes('--check')
for (const target of targets) {
  const targetPath = path.join(root, target)
  if (check) {
    if (await readFile(targetPath, 'utf8') !== html) {
      throw new Error(`${target} is out of sync; run npm run sync`)
    }
  } else {
    await writeFile(targetPath, html, 'utf8')
  }
}
console.log(check ? 'Standalone HTML files match their sources.' : 'Standalone HTML files regenerated.')

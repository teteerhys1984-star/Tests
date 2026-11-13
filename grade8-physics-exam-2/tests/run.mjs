import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const run = (args) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
const suites = readdirSync(path.join(root, 'tests'))
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()
  .map((file) => path.join('tests', file))
if (!suites.length) throw new Error('No exam tests were found')
run(['scripts/sync-exam.mjs', '--check'])
run(['--test', ...suites])
run(['exam-src/qa-runtime.mjs', 'index.html'])

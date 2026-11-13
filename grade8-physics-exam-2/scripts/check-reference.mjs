// Optional check against the actual sibling grade5-math-unit1 project.
import { mkdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, '.tmp-test', 'grade5-contract.mjs')
mkdirSync(path.dirname(output), { recursive: true })
execFileSync(path.join(root, 'node_modules', '.bin', 'esbuild'), [
  'scripts/capture-grade5-contract.ts', '--bundle', '--platform=node', '--format=esm',
  '--loader:.css=empty', `--outfile=${output}`, '--log-level=warning',
], { cwd: root, stdio: 'inherit' })
const actual = execFileSync(process.execPath, [output], { cwd: root, encoding: 'utf8' })
const expected = readFileSync(path.join(root, 'tests/fixtures/grade5-contract.json'), 'utf8')
if (actual !== expected) throw new Error('Captured grade5-math-unit1 contract differs from the fixture')
console.log('Reference project contract and fixture match exactly.')

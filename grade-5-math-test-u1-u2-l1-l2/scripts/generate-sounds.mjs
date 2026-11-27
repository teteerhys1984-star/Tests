// Generates two short original chime sounds (WAV, 22.05 kHz mono) bundled locally.
import { writeFileSync } from 'node:fs'
const SR = 22050
function render(notes, total) {
  const n = Math.floor(SR * total); const buf = new Float32Array(n)
  for (const { f, t, d, a = 0.5 } of notes) {
    const s = Math.floor(t * SR), e = Math.min(n, Math.floor((t + d) * SR))
    for (let i = s; i < e; i++) {
      const x = (i - s) / SR, env = Math.exp(-4 * x / d) * Math.min(1, x * 200)
      buf[i] += a * env * (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(4 * Math.PI * f * x))
    }
  }
  let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v))
  const data = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round((buf[i] / peak) * 0.8 * 32767), i * 2)
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24)
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}
writeFileSync('src/assets/sounds/start.wav', render([{ f: 523.25, t: 0, d: .25 }, { f: 659.25, t: .15, d: .25 }, { f: 783.99, t: .3, d: .45 }], 0.9))
writeFileSync('src/assets/sounds/submit.wav', render([{ f: 659.25, t: 0, d: .2 }, { f: 783.99, t: .12, d: .2 }, { f: 1046.5, t: .24, d: .5 }, { f: 1318.5, t: .4, d: .6, a: .35 }], 1.1))
console.log('sounds generated')

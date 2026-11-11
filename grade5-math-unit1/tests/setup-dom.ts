/**
 * إعداد بيئة DOM حقيقية (jsdom) مع اعتراض التنزيل والصوت وBlob.
 * يجب استيراد هذا الملف قبل أي استيراد لـ react / react-dom،
 * لأن React يقيّم canUseDOM عند تحميل الوحدة.
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM(
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>',
  { url: 'https://local.test/', pretendToBeVisual: true },
)
const win = (dom as unknown as { window: any }).window
const g = globalThis as any

g.window = win
g.document = win.document
g.navigator = win.navigator
g.self = win
g.location = win.location
g.history = win.history
g.HTMLElement = win.HTMLElement
g.HTMLAnchorElement = win.HTMLAnchorElement
g.HTMLInputElement = win.HTMLInputElement
g.HTMLTextAreaElement = win.HTMLTextAreaElement
g.HTMLSelectElement = win.HTMLSelectElement
g.HTMLButtonElement = win.HTMLButtonElement
g.SVGElement = win.SVGElement
g.Element = win.Element
g.Node = win.Node
g.Event = win.Event
g.MouseEvent = win.MouseEvent
g.KeyboardEvent = win.KeyboardEvent
g.PointerEvent = win.MouseEvent
g.getComputedStyle = win.getComputedStyle
g.requestAnimationFrame = win.requestAnimationFrame.bind(win)
g.cancelAnimationFrame = win.cancelAnimationFrame.bind(win)
g.matchMedia = win.matchMedia ?? (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
g.IS_REACT_ACT_ENVIRONMENT = true
win.scrollTo = () => {}
g.scrollTo = () => {}
win.HTMLElement.prototype.scrollIntoView = function () {}
win.HTMLElement.prototype.setPointerCapture = function () {}
win.HTMLElement.prototype.releasePointerCapture = function () {}
win.HTMLElement.prototype.hasPointerCapture = function () { return false }

/* ---------------- اعتراض التنزيل ---------------- */
export const downloads: { href: string; download: string }[] = []
export const spies = { objectUrls: 0, revokedUrls: 0, audioCtx: 0, oscCount: 0 }

win.URL.createObjectURL = (blob: any) => {
  spies.objectUrls++
  return `blob:mock/${spies.objectUrls}?size=${blob?.size ?? 0}&type=${blob?.type ?? ''}`
}
win.URL.revokeObjectURL = () => { spies.revokedUrls++ }
const origAnchorClick = win.HTMLAnchorElement.prototype.click
win.HTMLAnchorElement.prototype.click = function (this: any) {
  if (this.download) downloads.push({ href: this.href, download: this.download })
  else origAnchorClick.call(this)
}

/* ---------------- اعتراض الصوت ---------------- */
win.AudioContext = class {
  state = 'running'
  currentTime = 0
  destination = {}
  constructor() { spies.audioCtx++ }
  resume() { return Promise.resolve() }
  createGain() {
    return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }
  }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} } }
  createOscillator() {
    spies.oscCount++
    return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }
  }
}

/* ---------------- اعتراض Blob لقراءة المحتوى ---------------- */
export const blobTexts: string[] = []
const OrigBlob = win.Blob
class SpyBlob extends OrigBlob {
  constructor(parts?: any, opts?: any) {
    super(parts, opts)
    blobTexts.push(String(parts?.[0] ?? ''))
  }
}
win.Blob = SpyBlob
g.Blob = SpyBlob

export const W = win
export const D = win.document

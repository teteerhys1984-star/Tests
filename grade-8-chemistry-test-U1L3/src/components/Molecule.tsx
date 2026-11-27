import { Atom, BookOpen } from 'lucide-react';
import { Chem } from './Chem';
export function Molecule() {
  return <figure className="molecule-scene" aria-label="نموذج توضيحي لجزيء الماء: ذرة أكسجين مرتبطة بذرتي هيدروجين">
    <div className="scene-top"><span className="scene-label"><Atom size={15} /> من الذرّة إلى الصيغة</span><span className="scene-index" dir="ltr">01 / 03</span></div>
    <svg className="molecule-svg" viewBox="0 0 560 390" fill="none" aria-hidden="true">
      <defs>
        <pattern id="lab-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" stroke="#6ba9b5" strokeOpacity=".075" strokeWidth=".7" /></pattern>
        <radialGradient id="oxygen-fill" cx=".32" cy=".25" r=".8"><stop stopColor="#8270d9" /><stop offset=".48" stopColor="#4b3c87" /><stop offset="1" stopColor="#242544" /></radialGradient>
        <radialGradient id="hydrogen-fill" cx=".3" cy=".2" r=".85"><stop stopColor="#58daca" /><stop offset=".45" stopColor="#217e7c" /><stop offset="1" stopColor="#153c49" /></radialGradient>
        <linearGradient id="bond-fill" x1="145" y1="255" x2="410" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor="#48cdbd" /><stop offset=".5" stopColor="#738bb1" /><stop offset="1" stopColor="#9a83e1" /></linearGradient>
        <filter id="atom-shadow" x="-60%" y="-60%" width="220%" height="230%"><feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#050e1a" floodOpacity=".65" /></filter>
        <filter id="electron-glow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect width="560" height="390" fill="url(#lab-grid)" />
      <g className="orbital-lines" stroke="#6ca8b5" strokeOpacity=".2">
        <ellipse cx="280" cy="197" rx="209" ry="105" transform="rotate(-27 280 197)" strokeDasharray="3 7" />
        <ellipse cx="280" cy="197" rx="178" ry="133" transform="rotate(33 280 197)" strokeOpacity=".11" />
        <circle cx="280" cy="197" r="158" strokeOpacity=".09" />
      </g>
      <path d="M42 77V57H62M498 57H518V77M42 313V333H62M498 333H518V313" stroke="#5b9b9e" strokeOpacity=".45" />
      <path d="M151 251L280 177L409 251" stroke="#102b38" strokeWidth="22" strokeLinecap="round" />
      <path d="M151 251L280 177L409 251" stroke="url(#bond-fill)" strokeWidth="12" strokeLinecap="round" />
      <path d="M153 247L280 174L407 247" stroke="#d4f5f1" strokeOpacity=".24" strokeWidth="2" strokeLinecap="round" />
      <g filter="url(#atom-shadow)">
        <circle cx="280" cy="177" r="57" fill="url(#oxygen-fill)" stroke="#a696e4" strokeOpacity=".6" />
        <ellipse cx="264" cy="150" rx="24" ry="11" transform="rotate(-28 264 150)" fill="#d4c7ff" fillOpacity=".09" />
        <circle cx="151" cy="251" r="39" fill="url(#hydrogen-fill)" stroke="#76e5d5" strokeOpacity=".65" />
        <circle cx="409" cy="251" r="39" fill="url(#hydrogen-fill)" stroke="#76e5d5" strokeOpacity=".65" />
      </g>
      <g className="orbit-electrons">
        <circle cx="100" cy="228" r="4" fill="#64dfcf" /><circle cx="100" cy="228" r="8" fill="#64dfcf" opacity=".25" filter="url(#electron-glow)" />
        <circle cx="439" cy="118" r="3.5" fill="#b09aef" /><circle cx="367" cy="315" r="2.5" fill="#e9bd75" />
      </g>
      <path d="M326 139L367 100H420" stroke="#9d8acb" strokeOpacity=".5" /><circle cx="326" cy="139" r="2.5" fill="#b4a0e9" />
      <path d="M118 276L88 302H49" stroke="#65bdb4" strokeOpacity=".5" /><circle cx="118" cy="276" r="2.5" fill="#7edacb" />
    </svg>
    <span className="atom-label oxygen-label" dir="ltr">O</span>
    <span className="atom-label hydrogen-label hydrogen-right" dir="ltr">H</span>
    <span className="atom-label hydrogen-label hydrogen-left" dir="ltr">H</span>
    <span className="atom-caption oxygen-caption">أكسجين</span><span className="atom-caption hydrogen-caption">هيدروجين</span>
    <div className="scene-formula"><span>صيغة الماء</span><Chem formula="H2O" /></div>
    <figcaption className="scene-bottom"><BookOpen size={14} /><span>نموذج توضيحي مستند إلى الدرس</span><span className="scene-pages">ص 18</span></figcaption>
  </figure>;
}

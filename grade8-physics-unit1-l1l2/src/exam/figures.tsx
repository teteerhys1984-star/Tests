/**
 * رسوم SVG محلية (بلا أي خدمة خارجية) مبنية على أشكال الدرسين نفسها:
 * متوازي الأضلاع · المستطيل · المركّبتان · محصلة قوتين متوازيتين (الجهة الواحدة والتعاكس).
 */

const NAVY = '#0e2f3a'
const TEAL = '#0f766e'
const GOLD = '#b5851d'
const CLAY = '#b4472f'
const LINE = '#d9cdb6'

function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  )
}

function Frame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="diagram">
      <div className="diagram-inner">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

/** متوازي الأضلاع على القوتين المتلاقيتين، والقطر OM هو المحصلة. */
function Parallelogram() {
  return (
    <Frame caption="قوتان متلاقيتان من O بزاوية عامة، والقطر OM هو المحصلة F، والشكل الرباعي قائم على الشعاعين.">
      <svg viewBox="0 0 320 220" role="img" aria-label="متوازي الأضلاع والقدر OM">
        <defs>
          <ArrowHead id="ah-f1" color={TEAL} />
          <ArrowHead id="ah-f2" color={GOLD} />
          <ArrowHead id="ah-f" color={CLAY} />
        </defs>
        <line x1="40" y1="180" x2="290" y2="180" stroke={LINE} strokeDasharray="4 4" />
        <line x1="40" y1="180" x2="40" y2="20" stroke={LINE} strokeDasharray="4 4" />
        {/* F1 */}
        <line x1="40" y1="180" x2="180" y2="180" stroke={TEAL} strokeWidth="3" markerEnd="url(#ah-f1)" />
        <text x="105" y="200" fontSize="13" fill={TEAL} textAnchor="middle">F₁</text>
        {/* F2 */}
        <line x1="40" y1="180" x2="110" y2="70" stroke={GOLD} strokeWidth="3" markerEnd="url(#ah-f2)" />
        <text x="55" y="115" fontSize="13" fill={GOLD}>F₂</text>
        {/* completion lines */}
        <line x1="180" y1="180" x2="250" y2="70" stroke={LINE} strokeDasharray="5 4" />
        <line x1="110" y1="70" x2="250" y2="70" stroke={LINE} strokeDasharray="5 4" />
        {/* resultant */}
        <line x1="40" y1="180" x2="250" y2="70" stroke={CLAY} strokeWidth="3.4" markerEnd="url(#ah-f)" />
        <text x="165" y="105" fontSize="14" fill={CLAY} fontWeight="700">F</text>
        <circle cx="40" cy="180" r="4" fill={NAVY} />
        <text x="28" y="196" fontSize="13" fill={NAVY} fontWeight="700">O</text>
        <circle cx="250" cy="70" r="4" fill={NAVY} />
        <text x="258" y="66" fontSize="13" fill={NAVY} fontWeight="700">M</text>
      </svg>
    </Frame>
  )
}

/** مستطيل القوتين المتعامدتين. */
function RectangleFig() {
  return (
    <Frame caption="قوتان متلاقيتان حاملاهما متعامدان (90°): يتحوّل متوازي الأضلاع إلى مستطيل وقطره هو المحصلة.">
      <svg viewBox="0 0 320 220" role="img" aria-label="مستطيل القوتين المتعامدتين">
        <defs>
          <ArrowHead id="ah-r1" color={TEAL} />
          <ArrowHead id="ah-r2" color={GOLD} />
          <ArrowHead id="ah-rf" color={CLAY} />
        </defs>
        <rect x="60" y="60" width="180" height="120" fill="none" stroke={LINE} strokeDasharray="5 4" />
        <line x1="60" y1="180" x2="240" y2="180" stroke={TEAL} strokeWidth="3" markerEnd="url(#ah-r1)" />
        <text x="150" y="200" fontSize="13" fill={TEAL} textAnchor="middle">F₁</text>
        <line x1="60" y1="180" x2="60" y2="60" stroke={GOLD} strokeWidth="3" markerEnd="url(#ah-r2)" />
        <text x="24" y="125" fontSize="13" fill={GOLD}>F₂</text>
        <line x1="60" y1="180" x2="240" y2="60" stroke={CLAY} strokeWidth="3.4" markerEnd="url(#ah-rf)" />
        <text x="165" y="110" fontSize="14" fill={CLAY} fontWeight="700">F</text>
        <circle cx="60" cy="180" r="4" fill={NAVY} />
        <text x="48" y="196" fontSize="13" fill={NAVY} fontWeight="700">O</text>
        <circle cx="240" cy="60" r="4" fill={NAVY} />
        <text x="248" y="56" fontSize="13" fill={NAVY} fontWeight="700">M</text>
        <rect x="60" y="166" width="14" height="14" fill="none" stroke={NAVY} strokeWidth="1.4" />
      </svg>
    </Frame>
  )
}

/** المركّبتان المتعامدتان للقوة OM. */
function ComponentsFig() {
  return (
    <Frame caption="تحليل القوة OM إلى مركّبتين متعامدتين على المحورين Ox وOy: المركّبتان ضلعا مستطيل قطره القوة الأصلية.">
      <svg viewBox="0 0 320 220" role="img" aria-label="تحليل قوة إلى مركبتين متعامدتين">
        <defs>
          <ArrowHead id="ah-c0" color={NAVY} />
          <ArrowHead id="ah-c1" color={TEAL} />
          <ArrowHead id="ah-c2" color={GOLD} />
        </defs>
        <line x1="50" y1="180" x2="290" y2="180" stroke={NAVY} strokeWidth="1.6" markerEnd="url(#ah-c0)" />
        <text x="284" y="200" fontSize="12" fill={NAVY}>x</text>
        <line x1="50" y1="180" x2="50" y2="24" stroke={NAVY} strokeWidth="1.6" markerEnd="url(#ah-c0)" />
        <text x="34" y="32" fontSize="12" fill={NAVY}>y</text>
        <line x1="50" y1="180" x2="220" y2="70" stroke={CLAY} strokeWidth="3" />
        <text x="150" y="110" fontSize="13" fill={CLAY} fontWeight="700">F</text>
        <line x1="50" y1="180" x2="220" y2="180" stroke={TEAL} strokeWidth="3.2" markerEnd="url(#ah-c1)" />
        <text x="130" y="200" fontSize="13" fill={TEAL} textAnchor="middle">F₁ = OX</text>
        <line x1="50" y1="180" x2="50" y2="70" stroke={GOLD} strokeWidth="3.2" markerEnd="url(#ah-c2)" />
        <text x="18" y="128" fontSize="13" fill={GOLD}>F₂</text>
        <line x1="220" y1="70" x2="220" y2="180" stroke={LINE} strokeDasharray="5 4" />
        <line x1="220" y1="70" x2="50" y2="70" stroke={LINE} strokeDasharray="5 4" />
        <circle cx="50" cy="180" r="4" fill={NAVY} />
        <text x="38" y="196" fontSize="13" fill={NAVY} fontWeight="700">O</text>
        <circle cx="220" cy="180" r="3.6" fill={TEAL} />
        <text x="212" y="200" fontSize="12" fill={TEAL} fontWeight="700">X</text>
        <circle cx="50" cy="70" r="3.6" fill={GOLD} />
        <text x="34" y="60" fontSize="12" fill={GOLD} fontWeight="700">Y</text>
        <circle cx="220" cy="70" r="4" fill={NAVY} />
        <text x="228" y="66" fontSize="13" fill={NAVY} fontWeight="700">M</text>
      </svg>
    </Frame>
  )
}

/** قوتان متوازيتان بجهة واحدة والمحصلة بينهما. */
function ParallelSameFig() {
  return (
    <Frame caption="قوتان متوازيتان بجهة واحدة عند A وB، والمحصلة بينهما عند النقطة C وأقرب إلى القوة الأكبر.">
      <svg viewBox="0 0 320 210" role="img" aria-label="محصلة قوتين متوازيتين بجهة واحدة">
        <defs>
          <ArrowHead id="ah-p1" color={TEAL} />
          <ArrowHead id="ah-p2" color={TEAL} />
          <ArrowHead id="ah-pf" color={CLAY} />
        </defs>
        <line x1="30" y1="130" x2="290" y2="130" stroke={NAVY} strokeWidth="3" />
        <text x="34" y="148" fontSize="12" fill={NAVY}>A</text>
        <text x="272" y="148" fontSize="12" fill={NAVY}>B</text>
        <text x="150" y="148" fontSize="12" fill={CLAY} fontWeight="700">C</text>
        <line x1="60" y1="130" x2="60" y2="50" stroke={TEAL} strokeWidth="3" markerEnd="url(#ah-p1)" />
        <text x="40" y="42" fontSize="12" fill={TEAL}>F₁</text>
        <line x1="250" y1="130" x2="250" y2="30" stroke={TEAL} strokeWidth="3.4" markerEnd="url(#ah-p2)" />
        <text x="256" y="24" fontSize="12" fill={TEAL}>F₂</text>
        <line x1="160" y1="130" x2="160" y2="24" stroke={CLAY} strokeWidth="3.6" markerEnd="url(#ah-pf)" />
        <text x="166" y="18" fontSize="12" fill={CLAY} fontWeight="700">F</text>
        <line x1="60" y1="162" x2="160" y2="162" stroke={GOLD} strokeWidth="1.6" />
        <text x="105" y="178" fontSize="12" fill={GOLD} textAnchor="middle">d₁</text>
        <line x1="160" y1="162" x2="250" y2="162" stroke={GOLD} strokeWidth="1.6" />
        <text x="205" y="178" fontSize="12" fill={GOLD} textAnchor="middle">d₂</text>
      </svg>
    </Frame>
  )
}

/** قوتان متوازيتان متعاكستان والمحصلة خارج القطعة. */
function ParallelOppositeFig() {
  return (
    <Frame caption="قوتان متوازيتان بجهتين متعاكستين عند A وB: المحصلة على امتداد AB خارج القطعة من جهة القوة الأكبر.">
      <svg viewBox="0 0 320 210" role="img" aria-label="محصلة قوتين متوازيتين متعاكستين">
        <defs>
          <ArrowHead id="ah-o1" color={TEAL} />
          <ArrowHead id="ah-o2" color={TEAL} />
          <ArrowHead id="ah-of" color={CLAY} />
        </defs>
        <line x1="30" y1="110" x2="300" y2="110" stroke={NAVY} strokeWidth="3" />
        <text x="34" y="128" fontSize="12" fill={NAVY}>A</text>
        <text x="196" y="128" fontSize="12" fill={NAVY}>B</text>
        <text x="272" y="128" fontSize="12" fill={CLAY} fontWeight="700">C</text>
        <line x1="60" y1="110" x2="60" y2="50" stroke={TEAL} strokeWidth="3" markerEnd="url(#ah-o1)" />
        <text x="40" y="42" fontSize="12" fill={TEAL}>F₁</text>
        <line x1="220" y1="110" x2="220" y2="176" stroke={TEAL} strokeWidth="3.4" markerEnd="url(#ah-o2)" />
        <text x="226" y="194" fontSize="12" fill={TEAL}>F₂</text>
        <line x1="290" y1="110" x2="290" y2="176" stroke={CLAY} strokeWidth="3.6" markerEnd="url(#ah-of)" />
        <text x="296" y="194" fontSize="12" fill={CLAY} fontWeight="700">F</text>
        <line x1="60" y1="140" x2="290" y2="140" stroke={GOLD} strokeWidth="1.6" />
        <text x="175" y="156" fontSize="12" fill={GOLD} textAnchor="middle">d₁</text>
      </svg>
    </Frame>
  )
}

const FIGURES: Record<string, () => React.JSX.Element> = {
  parallelogram: Parallelogram,
  rectangle: RectangleFig,
  components: ComponentsFig,
  'parallel-same': ParallelSameFig,
  'parallel-opposite': ParallelOppositeFig,
}

export function FigureView({ id }: { id: string }) {
  const Fig = FIGURES[id]
  return Fig ? <Fig /> : null
}

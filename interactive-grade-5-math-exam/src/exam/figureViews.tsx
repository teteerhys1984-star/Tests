import { AngleFan, CoordGrid, LineGraph, QuadFigure, ShapePanel, parallelogram, type QuadSpec } from './figures'
import { MathText } from '../lib/mathx'
import { num } from '../lib/time'

/**
 * سجلّ الرسوم: كل سؤال يشير إلى رسم بمفتاح، والرسم يُبنى هنا من معطيات
 * رياضية محسوبة (لا من إحداثيات تقريبية) حتى تطابق القياسات المطبوعة هندسة الشكل.
 */

/* ---------- شرائط المنازل ---------- */
const PLACE_GROUPS = ['الملايين', 'الألوف', 'الوحدات'] as const
const PLACE_NAMES = ['مئات', 'عشرات', 'آحاد'] as const

function PlaceValueStrip({ digits, highlight }: { digits: string; highlight?: number[] }) {
  const padded = digits.padStart(9, '0').slice(-9)
  const groups = [padded.slice(0, 3), padded.slice(3, 6), padded.slice(6, 9)]
  const hl = new Set(highlight ?? [])
  let idx = -1
  return (
    <div className="overflow-x-auto">
      <table className="dtable" style={{ minWidth: 340 }}>
        <thead>
          <tr>
            {PLACE_GROUPS.map((g) => (
              <th key={g} colSpan={3} style={{ letterSpacing: '0.04em' }}>{g}</th>
            ))}
          </tr>
          <tr>
            {groups.flatMap((_, gi) => PLACE_NAMES.map((n) => (
              <th key={`${gi}-${n}`} style={{ background: '#1c5f70', fontSize: '0.8rem' }}>{n}</th>
            )))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {groups.map((grp, gi) =>
              grp.split('').map((d) => {
                idx += 1
                return (
                  <td
                    key={`${gi}-${d}-${idx}`}
                    className="tnum"
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      background: hl.has(idx) ? 'var(--gold-soft)' : undefined,
                      color: hl.has(idx) ? 'var(--gold-deep)' : 'var(--ink-1)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {num(d)}
                  </td>
                )
              }),
            )}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function FigureCard({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="card p-3 sm:p-4">
      {children}
      {caption && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--ink-3)' }}>
          <MathText text={caption} />
        </p>
      )}
    </div>
  )
}

/* ---------- الأشكال الرباعية ---------- */
const RHOMBUS_65: QuadSpec = {
  pts: parallelogram(5, 5, 65),
  labels: ['A', 'B', 'C', 'D'],
  parallel: [1, 2, 1, 2],
  ticks: [1, 1, 1, 1],
  sideLabels: ['5 cm', null, null, null],
  angleArcs: [
    { at: 0, from: 0, to: 65, text: '65°' },
    { at: 1, from: 115, to: 180, text: '115°' },
  ],
}

const PARALLELOGRAM_72: QuadSpec = {
  pts: parallelogram(7, 4, 72),
  labels: ['A', 'B', 'C', 'D'],
  parallel: [1, 2, 1, 2],
  ticks: [1, 2, 1, 2],
  sideLabels: ['7 cm', '4 cm', null, null],
  angleArcs: [{ at: 0, from: 0, to: 72, text: '72°' }],
}

const RHOMBUS_60: QuadSpec = {
  pts: parallelogram(4, 4, 60),
  labels: ['X', 'Y', 'Z', 'W'],
  parallel: [1, 2, 1, 2],
  ticks: [1, 1, 1, 1],
  sideLabels: ['4 cm', null, null, null],
  angleArcs: [{ at: 0, from: 0, to: 60, text: '60°' }],
}

const RHOMBUS_55: QuadSpec = {
  pts: parallelogram(6, 6, 55),
  labels: ['A', 'B', 'C', 'D'],
  parallel: [1, 2, 1, 2],
  ticks: [1, 1, 1, 1],
  sideLabels: ['6 cm', null, null, null],
  angleArcs: [{ at: 0, from: 0, to: 55, text: '55°' }],
}

const SHAPES: { id: string; title: string; spec: QuadSpec }[] = [
  {
    id: 's1', title: 'الشكل (1)',
    spec: {
      pts: parallelogram(4, 2.4, 62), labels: ['', '', '', ''],
      parallel: [1, 2, 1, 2],
    },
  },
  {
    id: 's2', title: 'الشكل (2)',
    spec: {
      pts: [{ x: 0, y: 0 }, { x: 4.4, y: 0 }, { x: 3.3, y: 2.2 }, { x: 1.1, y: 2.2 }],
      labels: ['', '', '', ''], parallel: [1, 0, 1, 0],
    },
  },
  {
    id: 's3', title: 'الشكل (3)',
    spec: {
      pts: [{ x: 0, y: 0 }, { x: 4.2, y: 0 }, { x: 4.2, y: 2.5 }, { x: 0, y: 2.5 }],
      labels: ['', '', '', ''], parallel: [1, 2, 1, 2],
      angleArcs: [{ at: 0, from: 0, to: 90, right: true }],
    },
  },
  {
    id: 's4', title: 'الشكل (4)',
    spec: { pts: [{ x: 0, y: 0 }, { x: 3.8, y: 0 }, { x: 1.5, y: 2.6 }], labels: ['', '', ''] },
  },
  {
    id: 's5', title: 'الشكل (5)',
    spec: {
      pts: [{ x: 0, y: 0 }, { x: 2.2, y: 1.6 }, { x: 0, y: 3.6 }, { x: -2.2, y: 1.6 }],
      labels: ['', '', '', ''], ticks: [1, 2, 2, 1],
    },
  },
]

/* ---------- السجلّ ---------- */
export function FigureView({ id }: { id?: string }) {
  if (!id) return null
  switch (id) {
    case 'q1-grid':
      return (
        <FigureCard caption="شبكة الإحداثيات: مبدأ الإحداثيات $O(0,0)$، المحور الأفقي $X$، المحور الشاقولي $Y$.">
          <CoordGrid
            max={8}
            points={[
              { label: 'A', x: 2, y: 5 },
              { label: 'B', x: 6, y: 2 },
              { label: 'C', x: 6, y: 7, color: '#0f766e' },
              { label: 'D', x: 0, y: 3 },
              { label: 'E', x: 4, y: 0 },
            ]}
          />
        </FigureCard>
      )

    case 'q2-angles':
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <FigureCard caption="الشكل (1): $\\angle BAC = 40^\\circ$ و $\\angle CAD = 50^\\circ$">
            <AngleFan
              vertexLabel="A" vertex={{ x: 40, y: 168 }} width={300} height={200}
              rays={[
                { label: 'B', deg: 0 },
                { label: 'C', deg: 40 },
                { label: 'D', deg: 90 },
              ]}
              arcs={[
                { from: 0, to: 40, text: '40°', r: 46, color: '#0f766e' },
                { from: 40, to: 90, text: '50°', r: 78, color: '#b4472f' },
              ]}
            />
          </FigureCard>
          <FigureCard caption="الشكل (2): $\\angle XAY$ زاوية مستقيمة و $\\angle XAZ = 65^\\circ$">
            <AngleFan
              vertexLabel="A" vertex={{ x: 158, y: 168 }} width={320} height={200}
              rays={[
                { label: 'X', deg: 0 },
                { label: 'Z', deg: 65, len: 118 },
                { label: 'Y', deg: 180 },
              ]}
              arcs={[{ from: 0, to: 65, text: '65°', r: 52, color: '#0f766e' }]}
            />
          </FigureCard>
        </div>
      )

    case 'q3-placevalue':
      return (
        <FigureCard caption="توزيع العدد $4{,}706{,}315$ على الحلقات الثلاث">
          <PlaceValueStrip digits="4706315" highlight={[3]} />
        </FigureCard>
      )

    case 'q4-rhombus':
      return (
        <FigureCard caption="الشكل الرباعي $ABCD$ — أسهم التوازي وعلامات تساوي الأضلاع موضّحة">
          <QuadFigure spec={RHOMBUS_65} caption="" />
        </FigureCard>
      )

    case 'q5-linechart':
      return (
        <FigureCard caption="درجات الحرارة العظمى في مدينة خلال أسبوع (بـ $^\\circ$)">
          <LineGraph
            labels={['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']}
            values={[11, 14, 17, 19, 15, 16, 18]}
            yMin={8} yMax={22} yStep={2}
            xLabel="اليوم" yLabel="درجة الحرارة" unit="°"
          />
        </FigureCard>
      )

    case 'q6-columns':
      return (
        <FigureCard caption="رتّب الأعداد في أعمدة المنازل ثم احسب">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="text-center">
              <MathText as="p" className="text-sm font-bold" text="الفرع (أ)" />
              <MathText as="div" className="mtx-block" text="$$\begin{array}{r} 458{,}276 \\ +\; 397{,}845 \\ \hline \blacksquare \end{array}$$" />
            </div>
            <div className="text-center">
              <MathText as="p" className="text-sm font-bold" text="الفرع (ب)" />
              <MathText as="div" className="mtx-block" text="$$\begin{array}{r} 1{,}000{,}000 \\ -\; 268{,}437 \\ \hline \blacksquare \end{array}$$" />
            </div>
          </div>
        </FigureCard>
      )

    case 'q7-placevalue':
      return (
        <FigureCard caption="العدد $2{,}847{,}563$ — الخانة الملوّنة هي رقم الحسم عند التقريب إلى أقرب ألف">
          <PlaceValueStrip digits="2847563" highlight={[3]} />
        </FigureCard>
      )

    case 'q8-grid':
      return (
        <FigureCard caption="الشكل $PQRS$ مرسوم على شبكة الإحداثيات">
          <CoordGrid
            max={8}
            points={[
              { label: 'P', x: 1, y: 1 },
              { label: 'Q', x: 6, y: 1 },
              { label: 'R', x: 6, y: 4 },
              { label: 'S', x: 1, y: 4 },
            ]}
            polygon={['P', 'Q', 'R', 'S']}
          />
        </FigureCard>
      )

    case 'q9-parallelogram':
      return (
        <FigureCard caption="متوازي الأضلاع $ABCD$ — $AB = 7\\,\\text{cm}$ و $BC = 4\\,\\text{cm}$ و $\\angle A = 72^\\circ$">
          <QuadFigure spec={PARALLELOGRAM_72} />
        </FigureCard>
      )

    case 'q10-linechart':
      return (
        <FigureCard caption="عدد زوّار المتحف خلال أربعة أيام">
          <LineGraph
            labels={['السبت', 'الأحد', 'الإثنين', 'الثلاثاء']}
            values={[1245, 2318, 1876, 3402]}
            yMin={0} yMax={3500} yStep={500}
            xLabel="اليوم" yLabel="عدد الزوّار" width={480} height={290}
          />
        </FigureCard>
      )

    case 'q11-placevalue':
      return (
        <FigureCard caption="العدد $8{,}305{,}472$ — الخانتان الملوّنتان: مئات الألوف (رقم الحسم للتقريب إلى أقرب مليون) وآحاد الألوف">
          <PlaceValueStrip digits="8305472" highlight={[1, 3]} />
        </FigureCard>
      )

    case 'q12-table':
      return (
        <FigureCard caption="مبيعات معرض الكتاب خلال ثلاثة أشهر">
          <table className="dtable" style={{ maxWidth: 520, margin: '0 auto' }}>
            <thead>
              <tr><th>الشهر</th><th>الأول</th><th>الثاني</th><th>الثالث</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>عدد النسخ</td>
                <td className="tnum">{num('125,480')}</td>
                <td className="tnum">{num('98,735')}</td>
                <td className="tnum">{num('143,260')}</td>
              </tr>
            </tbody>
          </table>
        </FigureCard>
      )

    case 'q13-protractor':
      return (
        <FigureCard caption="الزاوية $\\angle MNP$ المراد قياسها — استعمل المنقلة التفاعلية في الفرع (أ)">
          <AngleFan
            vertexLabel="N" vertex={{ x: 46, y: 168 }} width={320} height={200}
            rays={[
              { label: 'P', deg: 0, len: 138 },
              { label: 'M', deg: 125, len: 128 },
            ]}
          />
        </FigureCard>
      )

    case 'q14-rhombus':
      return (
        <FigureCard caption="المعيّن $XYZW$ — $XY = 4\\,\\text{cm}$ و $\\angle X = 60^\\circ$">
          <QuadFigure spec={RHOMBUS_60} />
        </FigureCard>
      )

    case 'q15-grid':
      return (
        <FigureCard caption="أربع نقاط على شبكة الإحداثيات">
          <CoordGrid
            max={7}
            points={[
              { label: 'N', x: 3, y: 6 },
              { label: 'M', x: 6, y: 3 },
              { label: 'K', x: 0, y: 5 },
              { label: 'T', x: 5, y: 0 },
            ]}
          />
        </FigureCard>
      )

    case 'q16-shapes':
      return (
        <FigureCard caption="خمسة أشكال رباعية (الشكل 4 مثلث) — السهم: توازٍ · الشرطة المائلة: تساوي طول">
          <div className="flex flex-wrap items-start justify-center gap-3">
            {SHAPES.map((s) => (
              <ShapePanel key={s.id} id={s.id} title={s.title} spec={s.spec} scale={16} width={140} height={112} />
            ))}
          </div>
        </FigureCard>
      )

    case 'q18-linechart':
      return (
        <FigureCard caption="طول النبتة بالسنتيمتر عند بداية كل أسبوع">
          <LineGraph
            labels={['0', '1', '2', '3', '4', '5']}
            values={[3, 5, 5, 8, 12, 12]}
            yMin={0} yMax={14} yStep={2}
            xLabel="رقم الأسبوع" yLabel="الطول" unit="cm" width={480} height={280}
          />
        </FigureCard>
      )

    case 'q20-rhombus':
      return (
        <FigureCard caption="المعيّن $ABCD$ — طول ضلعه $6\\,\\text{cm}$ و $\\angle A = 55^\\circ$">
          <QuadFigure spec={RHOMBUS_55} />
        </FigureCard>
      )

    default:
      return null
  }
}

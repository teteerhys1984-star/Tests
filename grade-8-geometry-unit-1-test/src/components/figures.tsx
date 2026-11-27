import {
  AngleMark,
  Axes,
  C,
  Circ,
  Figure,
  FullLine,
  Lattice,
  Node,
  Note,
  P,
  ParallelMark,
  Poly,
  RightAngle,
  Seg,
  Ticks,
  VectorArrow,
} from "./geo/Figure";

/* ═══════════════════════════════════════════════════════════════════════════
   Exam figures. Every point is a real coordinate; marks are derived from the
   geometry, never placed by eye. Figures whose printed measures are given as
   hypotheses (not as scale measurements) are captioned «غير مرسوم بالمقياس».
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Q1 · a triangle and its image under one translation ─────────────── */
export function FigTranslationPair() {
  const M = P(0.6, 0.6);
  const N = P(4.2, 0.6);
  const K = P(1.9, 3.1);
  const v = { x: 6, y: 1.4 };
  const M2 = P(M.x + v.x, M.y + v.y);
  const N2 = P(N.x + v.x, N.y + v.y);
  const K2 = P(K.x + v.x, K.y + v.y);
  return (
    <Figure
      view={{ minX: -0.5, minY: -0.6, maxX: 11.6, maxY: 5.4 }}
      unit={44}
      title="مثلث وصورته وفق انسحاب"
      desc="المثلث MNK على اليسار، والمثلث ′M′N′K على اليمين، مع القطعتين المنقطتين MM′ و NN′ اللتين لهما الطول نفسه والاتجاه نفسه."
    >
      <Poly pts={[M, N, K]} color={C.original} fill={C.originalSoft} />
      <Poly pts={[M2, N2, K2]} color={C.image} fill={C.imageSoft} />
      <Seg a={M} b={M2} color={C.helper} dash="7 6" width={1.8} />
      <Seg a={N} b={N2} color={C.helper} dash="7 6" width={1.8} />
      <Seg a={K} b={K2} color={C.helper} dash="7 6" width={1.8} />
      <Ticks a={M} b={M2} count={1} color={C.accent} />
      <Ticks a={N} b={N2} count={1} color={C.accent} />
      <ParallelMark a={M} b={M2} count={1} color={C.helper} at={0.32} />
      <ParallelMark a={N} b={N2} count={1} color={C.helper} at={0.32} />
      <Node p={M} text="M" dx={-8} dy={20} anchor="end" />
      <Node p={N} text="N" dx={6} dy={20} />
      <Node p={K} text="K" dx={-10} dy={-8} anchor="end" />
      <Node p={M2} text="M′" color={C.image} dx={-8} dy={20} anchor="end" />
      <Node p={N2} text="N′" color={C.image} dx={8} dy={20} />
      <Node p={K2} text="K′" color={C.image} dx={-2} dy={-10} />
      <Note p={P(5.6, 4.9)} text="الشكل والصورته: نفس الشكل ونفس الاتجاه" anchor="middle" size={13} />
    </Figure>
  );
}

/* ── Q2 · squared paper: A, B, M, N and four candidate images ────────── */
export function FigPointGrid() {
  const A = P(1, 2);
  const B = P(5, 3);
  const M = P(2, 5);
  const N = P(6, 1);
  const cand = [
    { p: P(10, 2), t: "K" },
    { p: P(9, 2), t: "L" },
    { p: P(10, 4), t: "R" },
    { p: P(11, 1), t: "S" },
  ];
  return (
    <Figure
      view={{ minX: 0, minY: 0, maxX: 12, maxY: 8 }}
      unit={44}
      pad={18}
      title="ورقة سنتيمترية عليها النقاط A و B و M و N وأربع نقاط مرشّحة"
      desc="شبكة مربّعة: A عند (1،2) و B عند (5،3) و M عند (2،5) و N عند (6،1). النقاط المرشّحة K و L و R و S معلّمة بلون بنفسجي في الجهة اليمنى."
    >
      <Lattice />
      <VectorArrow a={A} b={B} color={C.accent} width={2.8} />
      <Seg a={M} b={N} color="rgba(125,211,252,0.28)" dash="4 6" width={1.4} />
      <Node p={A} text="A" dx={-9} dy={-9} anchor="end" />
      <Node p={B} text="B" dx={9} dy={-8} />
      <Node p={M} text="M" dx={-10} dy={-8} anchor="end" />
      <Node p={N} text="N" dx={-4} dy={22} />
      {cand.map((c) => (
        <Node key={c.t} p={c.p} text={c.t} color={C.image} hollow dx={7} dy={-9} size={18} />
      ))}
      <Note p={P(2.6, 3.05)} text="ناقل الانسحاب" color={C.accent} size={12.5} />
    </Figure>
  );
}

/* ── Q2 · the translation that maps P to Q ───────────────────────────── */
export function FigPQ() {
  const Pt0 = P(2, 1);
  const Q = P(7, 4);
  return (
    <Figure
      view={{ minX: 0, minY: 0, maxX: 9, maxY: 6 }}
      unit={44}
      pad={18}
      title="النقطتان P و Q على شبكة مربّعة"
      desc="النقطة P عند (2،1) والنقطة Q عند (7،4) على شبكة مربّعة."
    >
      <Lattice />
      <Seg a={Pt0} b={Q} color={C.helper} dash="6 6" width={1.8} />
      <Node p={Pt0} text="P" dx={-10} dy={20} anchor="end" />
      <Node p={Q} text="Q" color={C.image} dx={10} dy={-9} />
    </Figure>
  );
}

/* ── Q3 · a triangle and its image, with stated measures ─────────────── */
export function FigShapeImage() {
  const A = P(0.4, 0.6);
  const B = P(5.6, 1.4);
  const Cp = P(2.2, 4.2);
  const v = { x: 4, y: 2.4 };
  const A2 = P(A.x + v.x, A.y + v.y);
  const B2 = P(B.x + v.x, B.y + v.y);
  const C2 = P(Cp.x + v.x, Cp.y + v.y);
  return (
    <Figure
      view={{ minX: -0.6, minY: -0.6, maxX: 11, maxY: 7.4 }}
      unit={44}
      title="المثلث ABC وصورته ′A′B′C وفق انسحاب"
      desc="المثلث ABC بلون سماوي، وصورته ′A′B′C بلون بنفسجي، مع أسهم الانسحاب من كل رأس إلى صورته."
    >
      <Poly pts={[A, B, Cp]} color={C.original} fill={C.originalSoft} />
      <Poly pts={[A2, B2, C2]} color={C.image} fill={C.imageSoft} />
      <VectorArrow a={A} b={A2} color={C.helper} width={1.8} dash="6 5" />
      <VectorArrow a={B} b={B2} color={C.helper} width={1.8} dash="6 5" />
      <VectorArrow a={Cp} b={C2} color={C.helper} width={1.8} dash="6 5" />
      <Node p={A} text="A" dx={-10} dy={19} anchor="end" />
      <Node p={B} text="B" dx={8} dy={19} />
      <Node p={Cp} text="C" dx={-11} dy={-7} anchor="end" />
      <Node p={A2} text="A′" color={C.image} dx={-6} dy={21} anchor="end" />
      <Node p={B2} text="B′" color={C.image} dx={9} dy={16} />
      <Node p={C2} text="C′" color={C.image} dx={0} dy={-11} />
    </Figure>
  );
}

/* ── Q4 · parallelogram with a diagonal (correspondence) ─────────────── */
export function FigParallelogramDiagonal() {
  const A = P(0, 0);
  const B = P(5.2, 0);
  const Cp = P(7.4, 3.4);
  const D = P(2.2, 3.4);
  return (
    <Figure
      view={{ minX: -1, minY: -1, maxX: 8.6, maxY: 4.5 }}
      unit={46}
      title="متوازي أضلاع ABCD مع القطر AC"
      desc="متوازي الأضلاع ABCD؛ الضلعان AB و DC معلّمان بشريطة واحدة، والضلعان BC و AD معلّمان بشريطين، والقطر AC مرسوم بلون كهرماني."
    >
      <Poly pts={[A, B, Cp, D]} color={C.original} fill={C.originalSoft} />
      <Seg a={A} b={Cp} color={C.accent} width={2.2} dash="8 5" />
      <Ticks a={A} b={B} count={1} />
      <Ticks a={D} b={Cp} count={1} />
      <Ticks a={B} b={Cp} count={2} />
      <Ticks a={A} b={D} count={2} />
      <ParallelMark a={A} b={B} count={1} at={0.32} />
      <ParallelMark a={D} b={Cp} count={1} at={0.32} />
      <ParallelMark a={B} b={Cp} count={2} at={0.68} />
      <ParallelMark a={A} b={D} count={2} at={0.68} />
      <Node p={A} text="A" dx={-11} dy={20} anchor="end" />
      <Node p={B} text="B" dx={9} dy={20} />
      <Node p={Cp} text="C" dx={11} dy={-6} />
      <Node p={D} text="D" dx={-11} dy={-7} anchor="end" />
    </Figure>
  );
}

/* ── Q4 · two right triangles (hypotenuse + leg) ─────────────────────── */
export function FigRightTriangles() {
  const A = P(0, 0);
  const B = P(3.6, 0);
  const Cp = P(3.6, 2.7);
  const D = P(10.2, 0);
  const E = P(6.6, 0);
  const F = P(6.6, 2.7);
  return (
    <Figure
      view={{ minX: -0.9, minY: -1.1, maxX: 11.2, maxY: 3.8 }}
      unit={46}
      title="مثلثان قائمان ABC و DEF"
      desc="المثلث ABC قائم في B، والمثلث DEF قائم في E. الوتران AC و DF معلّمان بشريطين، والضلعان AB و DE معلّمان بشريطة واحدة."
    >
      <Poly pts={[A, B, Cp]} color={C.original} fill={C.originalSoft} />
      <Poly pts={[D, E, F]} color={C.image} fill={C.imageSoft} />
      <RightAngle v={B} a={A} b={Cp} />
      <RightAngle v={E} a={D} b={F} color={C.image} />
      <Ticks a={A} b={B} count={1} />
      <Ticks a={D} b={E} count={1} color={C.image} />
      <Ticks a={A} b={Cp} count={2} />
      <Ticks a={D} b={F} count={2} color={C.image} />
      <Node p={A} text="A" dx={-11} dy={19} anchor="end" />
      <Node p={B} text="B" dx={4} dy={21} />
      <Node p={Cp} text="C" dx={9} dy={-6} />
      <Node p={D} text="D" color={C.image} dx={11} dy={19} />
      <Node p={E} text="E" color={C.image} dx={-4} dy={21} anchor="end" />
      <Node p={F} text="F" color={C.image} dx={-11} dy={-6} anchor="end" />
    </Figure>
  );
}

/* ── Q4 · two segments bisecting each other at O ─────────────────────── */
export function FigBisectingSegments() {
  const A = P(-4.2, -2.1);
  const B = P(4.2, 2.1);
  const Cp = P(-3.2, 3.1);
  const D = P(3.2, -3.1);
  const O = P(0, 0);
  return (
    <Figure
      view={{ minX: -5.4, minY: -4.2, maxX: 5.4, maxY: 4.2 }}
      unit={46}
      title="القطعتان [AB] و [CD] متناصفتان في O"
      desc="القطعتان AB و CD تتقاطعان في النقطة O منتصف كلٍّ منهما؛ مرسوم المثلثان OAC و OBD."
    >
      <Poly pts={[O, A, Cp]} color={C.original} fill={C.originalSoft} />
      <Poly pts={[O, B, D]} color={C.image} fill={C.imageSoft} />
      <Seg a={A} b={B} color={C.original} width={2.6} />
      <Seg a={Cp} b={D} color={C.image} width={2.6} />
      <Ticks a={O} b={A} count={1} />
      <Ticks a={O} b={B} count={1} />
      <Ticks a={O} b={Cp} count={2} color={C.helper} />
      <Ticks a={O} b={D} count={2} color={C.helper} />
      <AngleMark v={O} a={A} b={Cp} color={C.accent} radius={0.62} />
      <AngleMark v={O} a={B} b={D} color={C.accent} radius={0.62} />
      <Node p={A} text="A" dx={-11} dy={16} anchor="end" />
      <Node p={B} text="B" dx={11} dy={-6} />
      <Node p={Cp} text="C" color={C.image} dx={-11} dy={-6} anchor="end" />
      <Node p={D} text="D" color={C.image} dx={11} dy={16} />
      <Node p={O} text="O" dx={9} dy={17} />
    </Figure>
  );
}

/* ── Q5 · parallelogram with both diagonals ──────────────────────────── */
export function FigParallelogramCentre() {
  const A = P(0, 0);
  const B = P(6, 0);
  const Cp = P(8.2, 4.2);
  const D = P(2.2, 4.2);
  const O = P(4.1, 2.1);
  return (
    <Figure
      view={{ minX: -1.2, minY: -1.2, maxX: 9.6, maxY: 5.5 }}
      unit={46}
      title="متوازي أضلاع ABCD وقطراه"
      desc="متوازي الأضلاع ABCD؛ القطران AC و BD يتقاطعان في النقطة O، مع علامات تساوي الأضلاع المتقابلة."
    >
      <Poly pts={[A, B, Cp, D]} color={C.original} fill={C.originalSoft} />
      <Seg a={A} b={Cp} color={C.accent} width={2.1} />
      <Seg a={B} b={D} color={C.helper} width={2.1} />
      <Ticks a={A} b={B} count={1} />
      <Ticks a={D} b={Cp} count={1} />
      <Ticks a={B} b={Cp} count={2} />
      <Ticks a={A} b={D} count={2} />
      <Node p={A} text="A" dx={-11} dy={20} anchor="end" />
      <Node p={B} text="B" dx={9} dy={20} />
      <Node p={Cp} text="C" dx={11} dy={-6} />
      <Node p={D} text="D" dx={-11} dy={-7} anchor="end" />
      <Node p={O} text="O" dx={8} dy={-9} />
    </Figure>
  );
}

/* ── Q5 · grid with three vertices of a parallelogram ────────────────── */
export function FigMissingVertex() {
  const A = P(1, 1);
  const B = P(6, 2);
  const Cp = P(8, 6);
  return (
    <Figure
      view={{ minX: 0, minY: 0, maxX: 10, maxY: 8 }}
      unit={44}
      pad={18}
      title="ثلاثة رؤوس A و B و C على شبكة"
      desc="على شبكة مربّعة: A عند (1،1) و B عند (6،2) و C عند (8،6). المطلوب إيجاد الرأس الرابع D ليصبح ABCD متوازي أضلاع."
    >
      <Lattice />
      <Axes />
      <Seg a={A} b={B} color={C.original} width={2.6} />
      <Seg a={B} b={Cp} color={C.original} width={2.6} />
      <Node p={A} text="A" dx={-11} dy={-8} anchor="end" />
      <Node p={B} text="B" dx={9} dy={19} />
      <Node p={Cp} text="C" dx={11} dy={-6} />
    </Figure>
  );
}

/* ── Q6 · triangle on a coordinate grid + the translation vector ─────── */
export function FigQ6Grid() {
  const A = P(1, 1);
  const B = P(5, 1);
  const Cp = P(1, 4);
  return (
    <Figure
      view={{ minX: 0, minY: 0, maxX: 12, maxY: 8 }}
      unit={44}
      pad={20}
      title="المثلث ABC وناقل الانسحاب على معلم متعامد"
      desc="في معلم متعامد: A عند (1،1) و B عند (5،1) و C عند (1،4). ناقل الانسحاب مرسوم سهماً من (7،1) إلى (11،4)."
    >
      <Lattice />
      <Axes />
      <Poly pts={[A, B, Cp]} color={C.original} fill={C.originalSoft} />
      <RightAngle v={A} b={B} a={Cp} />
      <Ticks a={A} b={B} count={1} />
      <Ticks a={A} b={Cp} count={2} />
      <Node p={A} text="A" dx={-11} dy={19} anchor="end" />
      <Node p={B} text="B" dx={9} dy={19} />
      <Node p={Cp} text="C" dx={-11} dy={-7} anchor="end" />
      <VectorArrow a={P(7, 1)} b={P(11, 4)} color={C.accent} width={2.8} />
      <Note p={P(9.2, 1.6)} text="ناقل الانسحاب t" color={C.accent} size={13} anchor="middle" />
    </Figure>
  );
}

/* ── Q6 · circle on a coordinate grid ────────────────────────────────── */
export function FigQ6Circle() {
  const O = P(2, 5);
  return (
    <Figure
      view={{ minX: 0, minY: 0, maxX: 10, maxY: 9 }}
      unit={40}
      pad={20}
      title="دائرة مركزها O على معلم متعامد"
      desc="دائرة مركزها O عند (2،5) ونصف قطرها وحدتان، وناقل الانسحاب مرسوم سهماً من (6،1) إلى (10،4)."
    >
      <Lattice />
      <Axes />
      <Circ center={O} r={2} color={C.original} fill={C.originalSoft} />
      <Seg a={O} b={P(4, 5)} color={C.accent} width={2} dash="5 4" />
      <Node p={O} text="O" dx={-11} dy={-9} anchor="end" />
      <Note p={P(3, 5.35)} text="2" color={C.accent} size={13} anchor="middle" />
      <VectorArrow a={P(6, 1)} b={P(10, 4)} color={C.accent} width={2.6} />
    </Figure>
  );
}

/* ── Q7 · integrated figure ──────────────────────────────────────────── */
export function FigChallenge() {
  const A = P(0, 0);
  const B = P(4, 0);
  const Cp = P(1, 3);
  const B2 = P(8, 0);
  const C2 = P(5, 3);
  return (
    <Figure
      view={{ minX: -1.2, minY: -1.4, maxX: 9.4, maxY: 4.3 }}
      unit={48}
      title="المثلث ABC وصورته ′BB′C وفق الانسحاب الذي ينقل A إلى B"
      desc="النقاط A و B و ′B على مستقيم أفقي واحد. المثلث ABC بلون سماوي، والمثلث ′BB′C بلون بنفسجي، والقطعة ′CC منقطة توازي القطعة AB."
    >
      <FullLine a={A} b={B2} color="rgba(125,211,252,0.28)" width={1.4} dash="3 7" />
      <Poly pts={[A, B, Cp]} color={C.original} fill={C.originalSoft} />
      <Poly pts={[B, B2, C2]} color={C.image} fill={C.imageSoft} />
      <Seg a={Cp} b={C2} color={C.helper} dash="7 5" width={2} />
      <Ticks a={A} b={B} count={1} />
      <Ticks a={B} b={B2} count={1} color={C.image} />
      <Ticks a={Cp} b={C2} count={1} color={C.helper} />
      <ParallelMark a={A} b={B2} count={1} color={C.helper} at={0.62} />
      <ParallelMark a={Cp} b={C2} count={1} color={C.helper} at={0.3} />
      <Node p={A} text="A" dx={-11} dy={20} anchor="end" />
      <Node p={B} text="B" dx={-2} dy={22} />
      <Node p={Cp} text="C" dx={-12} dy={-7} anchor="end" />
      <Node p={B2} text="B′" color={C.image} dx={10} dy={19} />
      <Node p={C2} text="C′" color={C.image} dx={9} dy={-7} />
      <Note p={P(3.9, -1.05)} text="A و B و ′B على استقامة واحدة" anchor="middle" size={12.5} />
    </Figure>
  );
}

/* ── animated banner: the unit's core idea, in motion ────────────────── */
export function TranslationBanner() {
  const A = P(0, 0);
  const B = P(3.4, 0);
  const Cp = P(1.1, 2.1);
  const v = { x: 4.6, y: 1.5 };
  const A2 = P(A.x + v.x, A.y + v.y);
  const B2 = P(B.x + v.x, B.y + v.y);
  const C2 = P(Cp.x + v.x, Cp.y + v.y);
  return (
    <Figure
      view={{ minX: -0.7, minY: -0.9, maxX: 11.2, maxY: 4.6 }}
      unit={40}
      className="banner-fig"
      title="انسحاب مثلث على شبكة"
      desc="رسم متحرّك: مثلث ينزلق دون دوران إلى موضعه الجديد، ومسارات رؤوسه قطع متوازية متساوية."
    >
      <Lattice />
      <g style={{ opacity: 0.4 }}>
        <Poly pts={[A, B, Cp]} color={C.original} fill="none" dash="5 5" />
      </g>
      <g className="slide-shape">
        <Poly pts={[A, B, Cp]} color={C.original} fill={C.originalSoft} />
        <Node p={A} text="A" dx={-9} dy={18} anchor="end" size={17} />
        <Node p={B} text="B" dx={7} dy={18} size={17} />
        <Node p={Cp} text="C" dx={-10} dy={-6} anchor="end" size={17} />
      </g>
      <g className="slide-vectors">
        <VectorArrow a={A} b={A2} color={C.helper} width={1.7} dash="6 5" />
        <VectorArrow a={B} b={B2} color={C.helper} width={1.7} dash="6 5" />
        <VectorArrow a={Cp} b={C2} color={C.helper} width={1.7} dash="6 5" />
      </g>
      <Poly pts={[A2, B2, C2]} color={C.image} fill={C.imageSoft} />
      <Node p={A2} text="A′" color={C.image} dx={-8} dy={18} anchor="end" size={17} />
      <Node p={B2} text="B′" color={C.image} dx={7} dy={18} size={17} />
      <Node p={C2} text="C′" color={C.image} dx={-2} dy={-8} size={17} />
      <Note
        p={P(5.3, -0.6)}
        text="نفس المقدار · نفس الاتجاه · نفس الشكل"
        anchor="middle"
        size={12}
        color={C.helper}
      />
    </Figure>
  );
}

/* ── small legend used under the figures ─────────────────────────────── */
export function FigureLegend({ items }: { items: { color: string; text: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.text} className="inline-flex items-center gap-1.5 text-[0.74rem] text-slate-400">
          <span
            className="inline-block h-0.5 w-6 rounded-full"
            style={{ backgroundColor: it.color }}
          />
          {it.text}
        </span>
      ))}
    </div>
  );
}

export const legendOriginalImage = [
  { color: C.original, text: "الشكل الأصلي" },
  { color: C.image, text: "الصورة وفق الانسحاب" },
  { color: C.helper, text: "خطوط مساعدة" },
];
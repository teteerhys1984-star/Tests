const SPRITES: Record<string, { rows: string[]; pal: Record<string, string> }> = {
  creeper: {
    rows: ["GgGGgGGg", "GGGgGGgG", "GKKGGKKG", "GKKGGKKG", "GGGKKGGG", "GGKKKKGG", "GGKKKKGG", "GGKGGKGG"],
    pal: { G: "#5cb338", g: "#4a9a2c", K: "#161616" },
  },
  emerald: {
    rows: ["..LLLL..", ".LWWEEL.", "LWEEEEDL", "LEEEEEDL", "LEEEEDDL", ".LEEDDL.", "..LDDL..", "...LL..."],
    pal: { L: "#0b6b2f", W: "#c8ffd9", E: "#17dd62", D: "#0fa84b" },
  },
  grass: {
    rows: ["GGGGGGGG", "GgGGGgGG", "DGDDGDDD", "DDDdDDDd", "DdDDDDdD", "DDDDdDDD", "DdDDDDDd", "DDdDDdDD"],
    pal: { G: "#5aa23a", g: "#478a2c", D: "#8a5a33", d: "#6e4527" },
  },
  diamond: {
    rows: ["..CCCC..", ".CWWCCB.", "CWCCCCBB", "CCCCCBBB", ".CCCBBB.", "..CBBB..", "...BB...", "........"],
    pal: { C: "#4de8e0", W: "#e6ffff", B: "#1fb3b0" },
  },
  stone: {
    rows: ["SSSsSSSS", "SsSSSSsS", "SSSSsSSS", "sSSSSSSs", "SSsSSSSS", "SSSSSsSS", "SsSSSSSS", "SSSsSSsS"],
    pal: { S: "#8d8d8d", s: "#6f6f6f" },
  },
  house: {
    rows: ["...RR...", "..RRRR..", ".RRRRRR.", "RRRRRRRR", ".WWWWWW.", ".WWDDWW.", ".WWDDWW.", ".WWDDWW."],
    pal: { R: "#c0392b", W: "#e8d7a8", D: "#6e4527" },
  },
  tree: {
    rows: ["..GGGG..", ".GGgGGG.", "GGGGGgGG", "GgGGGGGG", ".GGGgGG.", "...BB...", "...BB...", "...BB..."],
    pal: { G: "#3f9b2a", g: "#2d7a1c", B: "#6e4527" },
  },
  pine: {
    rows: ["...GG...", "..GGGG..", "...GG...", "..GGGG..", ".GGGGGG.", "..GGGG..", ".GGGGGG.", "...BB..."],
    pal: { G: "#2d7a3a", B: "#6e4527" },
  },
  pig: {
    rows: ["........", ".PPPPPP.", "PPKPPKPP", "PPPPPPPP", "PPPnnPPP", "PPPnnPPP", ".PP..PP.", ".PP..PP."],
    pal: { P: "#f2a6b0", K: "#222222", n: "#d9778a" },
  },
  sheep: {
    rows: [".WWWWWW.", "WWWWWWWW", "WWWWWWWW", "WWWWWWWW", ".WWGGWW.", "..GKKG..", "..GGGG..", "..G..G.."],
    pal: { W: "#f4f4f4", G: "#b9b39a", K: "#222222" },
  },
  castle: {
    rows: ["S.SS.SS.", "SSSSSSSS", "SSSSSSSS", "SSSDDSSS", "SSSDDSSS", "SSSDDSSS", "SSSDDSSS", "SSSDDSSS"],
    pal: { S: "#9a9a9a", D: "#3a2a1a" },
  },
  pickaxe: {
    rows: [".PPPPP..", "PP...PP.", "P....BP.", ".....B..", "....B...", "...B....", "..B.....", ".B......"],
    pal: { P: "#8d8d8d", B: "#8a5a33" },
  },
};

export type SpriteName = keyof typeof SPRITES;
export const SPRITE_NAMES = Object.keys(SPRITES);

export function Pixel({
  name,
  size = 48,
  className = "",
  x,
  y,
}: {
  name: SpriteName;
  size?: number;
  className?: string;
  x?: number;
  y?: number;
}) {
  const sp = SPRITES[name];
  const n = sp.rows.length;
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      style={{ imageRendering: "pixelated" }}
    >
      {sp.rows.flatMap((row, y) =>
        row.split("").map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={sp.pal[ch]} />))
      )}
    </svg>
  );
}

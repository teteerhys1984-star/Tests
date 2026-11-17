# Plan

## Product scope
A single-page React + TypeScript + Vite Arabic (RTL) examination app: **Grade 8 Physics & Chemistry — Model A**.
24 main questions (12 Physics + 12 Chemistry) interleaved, 100 marks (50/50), timer, autosave, results with rubric, TXT report, password-gated teacher key (`somer173`), WhatsApp footer.

## Sections
1. **Start screen** — name gate, exam instructions, marks distribution, mute toggle, start button.
2. **Exam screen** — one question at a time, sticky HUD (stopwatch HH:MM:SS count-up, progress ring, subject chip), prev/next, answer inputs (numeric, textarea, table, vector-drawing canvas, symbol fields), autosave, submit.
3. **Results** — name, Physics/50, Chemistry/50, Total/100, per-question card with student answer, expected answer, marks awarded + partial credit, explanation, hidden-to-students source tag, TXT download + backup download, retake.
4. **Teacher key** — password `somer173`, full worked solutions, diagrams, rubrics, source map incl. the five original IT-1 problem numbers.
5. **Footer contact strip** — المهندس سومر شاهين / 0930215022, SVG WhatsApp mark → wa.me/963930215022.

## Creative direction
**Real-world object:** a science-lab field notebook crossed with an instrument panel — specifically the printed *exam booklet* of a Levantine school, but rendered as a bright, technical "mission control" sheet: grid paper, numbered stations, vector arrows drawn in ink.

**Surface & palette:** paper-white base `#F7F9FC` with a faint blue graph-grid, not a dark app. Anchor hue = electric blue `#1D4ED8` (the blue of physics vector diagrams / blueprint ink), deep navy `#0B1B3A` for type. Bright cyan `#06B6D4`, orange `#FF6B1A`, yellow `#FFC53D`, green `#16A34A`, purple `#7C3AED` accents used to *encode subject* (physics = blue/cyan, chemistry = orange/purple) — never as decoration.

**References:** (a) Swiss school-scientific poster grid / Otl Aicher's Munich '72 pictogram system — borrowing the strict grid + bold geometric rule-lines and single-weight iconography; (b) engineering blueprint annotation — borrowing leader lines, tick marks and callout labels.

**Rejected defaults:** no purple/blue gradient hero; no grid of identical rounded cards with emoji icons; no Inter-only; no near-black "premium" page; no MCQ chips.

**Type:** Cairo (Arabic, 400/700/900) + IBM Plex Sans Arabic fallback for body; JetBrains Mono for LTR math/force/chemistry islands and tabular figures. Scale ratio 1.25. Personality detail: **oversized outlined question numerals** (900 weight, stroke-only) in the margin, and mono LTR islands for every unit/equation.

**Layout decision (non-default):** a fixed left *rail* of question stations (a vertical numbered ladder with subject-colored ticks) on desktop, collapsing into a horizontal scroll-snap station strip on mobile; content sits in an asymmetric 2-column measure where calculations get a tinted "calculation slip" panel with ruled lines and a "given / required / law / substitution / answer" ladder.

**Motion:** machined precision — questions slide/settle with a short cubic-bezier, progress ring draws, station ticks snap. CSS/Tailwind transitions only (no heavy libs), all guarded by `prefers-reduced-motion`.

**Memorable moment:** the *vector-drawing workspace* — a real interactive force-diagram pad with grid, arrow tool and labels, plus the oversized outlined numeral that stamps each question.

// Shared geometry for the isometric Gridfinity vignette, used by both the
// works default (`components/art/vignettes/Print.astro`) and the home
// bench (`components/BenchCard.astro`) so the two renders can't drift.
// Pure data: every export is a ready-to-use SVG `points` / path `d`
// string in the 200×140 viewBox. The markup — and the bench's drop-in
// animation classes — live in the components.
//
// A deterministic 2:1 dimetric projection (no `Math.random`, so visual
// snapshots stay stable), bins ordered back-to-front so a painter's-
// algorithm draw gives correct occlusion.

const TW = 16; // tile half-width  — screen x per grid step
const TH = 8; //  tile half-height — screen y per grid step (→ 2:1 iso)
const OX = 100; // grid origin (cell 0,0), screen x
const OY = 50; //  grid origin, screen y (the plane top)
const N = 4; //   baseplate is N×N cells
const T = 5; //   baseplate thickness, in screen px

// Project a grid coord (i col, j row) at rise `h` (screen px) to screen.
const px = (i: number, j: number) => OX + (i - j) * TW;
const py = (i: number, j: number, h = 0) => OY + (i + j) * TH - h;
const pt = (i: number, j: number, h = 0) => `${px(i, j)},${py(i, j, h)}`;

export interface GridfinityBin {
  top: string;
  right: string;
  left: string;
  lip: string;
}

// A box on footprint [i0,i1]×[j0,j1] rising to height `h` from the plane.
// Returns the three visible faces (top + the two front sides) and the
// inset stacking-lip outline that reads as "Gridfinity".
function box(i0: number, i1: number, j0: number, j1: number, h: number): GridfinityBin {
  const d = 0.16; // lip inset, in cell units
  return {
    top: [pt(i0, j0, h), pt(i1, j0, h), pt(i1, j1, h), pt(i0, j1, h)].join(' '),
    right: [pt(i1, j0, h), pt(i1, j1, h), pt(i1, j1, 0), pt(i1, j0, 0)].join(' '),
    left: [pt(i0, j1, h), pt(i1, j1, h), pt(i1, j1, 0), pt(i0, j1, 0)].join(' '),
    lip: [
      pt(i0 + d, j0 + d, h),
      pt(i1 - d, j0 + d, h),
      pt(i1 - d, j1 - d, h),
      pt(i0 + d, j1 - d, h),
    ].join(' '),
  };
}

// Bins ordered back-to-front (ascending front-corner depth i1+j1): 2×2,
// 2×1 tall, 1×1, then the low 1×3 in front. A couple of cells are left
// empty on purpose, to show the bare baseplate grid.
export const bins: GridfinityBin[] = [
  box(0, 2, 0, 2, 22), // 2×2, back-left
  box(2, 4, 0, 1, 30), // 2×1, tall, right
  box(0, 1, 3, 4, 18), // 1×1, front-left
  box(3, 4, 1, 4, 14), // 1×3, low, front-right
];

// Baseplate top plane (outer rhombus) + interior 42 mm grid lines.
export const plane = [pt(0, 0), pt(N, 0), pt(N, N), pt(0, N)].join(' ');
export const gridLines = Array.from({ length: N - 1 }, (_, k) => k + 1).flatMap((k) => [
  `M${pt(k, 0)} L${pt(k, N)}`,
  `M${pt(0, k)} L${pt(N, k)}`,
]);
// Baseplate thickness — the two front faces dropping below the plane.
export const plateRight = [pt(N, 0, 0), pt(N, N, 0), pt(N, N, -T), pt(N, 0, -T)].join(' ');
export const plateLeft = [pt(0, N, 0), pt(N, N, 0), pt(N, N, -T), pt(0, N, -T)].join(' ');

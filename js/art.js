/* Desi Mirror · art.js
   Every cartoon in the piece is drawn here with code, in a wobbly
   hand-drawn sticker style (flat colour slightly offset under a shaky ink
   outline). Each one is rendered ONCE into an off-screen image at startup,
   so drawing them every frame is cheap.

   Want to use your own drawings instead? Put a PNG in assets/ with the
   matching name (see OVERRIDES below) and it replaces the drawn version.
*/

const PAL = {
  ink: "#2b1216",
  wall: "#6a1428",
  wallMotif: "#7d1a31",
  maroon: "#6d1a2a",
  sindoor: "#c8102e",
  rani: "#d81b7a",
  pinkSoft: "#f7b6c8",
  marigold: "#f29f05",
  marigoldDeep: "#e4620c",
  haldi: "#f6c90e",
  peacock: "#0f6e73",
  peacockLight: "#21a3a6",
  leaf: "#3f7d20",
  leafLight: "#6aa832",
  gold: "#d4a017",
  goldLight: "#f3d77a",
  wood: "#8a4a22",
  woodLight: "#a8622f",
  woodDark: "#55260f",
  cream: "#fff3e0",
  skin: "#b7794f",
};

// PNG overrides: assets/<name>.png replaces the drawn cartoon if it exists
const OVERRIDES = [
  "bindi_1", "bindi_2", "bindi_3", "bindi_4", "bindi_5", "bindi_6",
  "jhumka", "bangles", "vanity",
  "outfit_1", "outfit_2", "outfit_3", "outfit_4", "outfit_5", "outfit_6",
  "aunty", "aunty_throw", "chappal",
];
const OVERRIDE_IMG = {};

// Leo's Pinterest picks, cut out of their backgrounds (assets/<folder>/<file>.png).
// shoulder = how wide the shoulders are as a fraction of the image,
// cx = where the neckline's centre is, span = shoulder width in face-widths
// on you, drop = how far below your chin the garment starts (face-widths)
const USER_ART = {
  outfits: [
    { file: "outfit_saree", name: "Rani Pink Saree", shoulder: 0.91, cx: 0.52, span: 2.4, drop: 0.3 },
    { file: "outfit_lehenga", name: "Lehenga", shoulder: 0.263, cx: 0.47, span: 1.7, drop: 0.45 },
    { file: "outfit_gown", name: "Anarkali Gown", shoulder: 0.285, cx: 0.469, span: 1.7, drop: 0.45 },
    { file: "outfit_kurta_palazzo", name: "Block-print Kurta", shoulder: 0.576, cx: 0.505, span: 2.4, drop: 0.3 },
    { file: "outfit_kurti", name: "Paisley Kurti", shoulder: 0.623, cx: 0.492, span: 2.4, drop: 0.3 },
    { file: "outfit_set_cream", name: "Chikankari Set", shoulder: 0.517, cx: 0.532, span: 1.7, drop: 0.45 },
    { file: "outfit_set_blue", name: "Indigo Kurta Set", shoulder: 0.51, cx: 0.463, span: 1.7, drop: 0.45 },
  ],
  jhumkas: [
    { file: "jhumka_gold", name: "Gold Tiers", len: 0.62 },
    { file: "jhumka_blue", name: "Blue Stone", len: 0.62 },
    { file: "jhumka_ruby", name: "Ruby Drop", len: 0.55 },
    { file: "jhumka_chandelier", name: "Chandelier", len: 0.62 },
  ],
  bangles: [
    { file: "bangles_color", name: "Painted" },
    { file: "bangles_jewel", name: "Jewelled" },
  ],
  vanity: ["v_powder", "v_palette", "v_redcompact", "v_lipstick", "v_gloss", "v_liners", "v_cushion", "bangle_stand"],
};
const USER_IMG = {};

function loadUserArt() {
  const load = (folder, file) =>
    loadImage("assets/" + folder + "/" + file + ".png", (img) => (USER_IMG[file] = img), () => {});
  for (const o of USER_ART.outfits) load("outfits", o.file);
  for (const j of USER_ART.jhumkas) load("jhumkas", j.file);
  for (const b of USER_ART.bangles) load("bangles", b.file);
  for (const v of USER_ART.vanity) load(v === "bangle_stand" ? "bangles" : "vanity", v);
  if (typeof SNACKS !== "undefined") for (const s of SNACKS) load("snacks", s.file);
}

function loadOverrides() {
  loadUserArt();
  for (const name of OVERRIDES) {
    loadImage(
      "assets/" + name + ".png",
      (img) => (OVERRIDE_IMG[name] = img),
      () => {} // missing file is fine, the drawn version is used
    );
  }
}

// ── tiny drawing helpers ─────────────────────────────────────────

function jit(a) {
  return (Math.random() - 0.5) * a;
}

function makeG(w, h, d) {
  const g = createGraphics(w, h);
  g.pixelDensity(d || 2);
  g.strokeJoin(ROUND);
  g.strokeCap(ROUND);
  return g;
}

// smooth closed shape through points, slightly shaky
function wobbly(g, pts, amp) {
  amp = amp === undefined ? 1.6 : amp;
  const p = pts.map(([x, y]) => [x + jit(amp), y + jit(amp)]);
  const n = p.length;
  g.beginShape();
  g.curveVertex(p[n - 1][0], p[n - 1][1]);
  for (const q of p) g.curveVertex(q[0], q[1]);
  g.curveVertex(p[0][0], p[0][1]);
  g.curveVertex(p[1][0], p[1][1]);
  g.endShape();
}

// flat fill nudged under a hand-drawn outline = printed sticker look
function sticker(g, pts, col, sw, amp) {
  g.push();
  g.noStroke();
  g.fill(col);
  wobbly(g, pts.map(([x, y]) => [x + 1.2, y + 1.4]), 1);
  g.noFill();
  g.stroke(PAL.ink);
  g.strokeWeight(sw === undefined ? 3 : sw);
  if (sw !== 0) wobbly(g, pts, amp === undefined ? 1.6 : amp);
  g.pop();
}

function densify(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.floor(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * (j / k), a[1] + (b[1] - a[1]) * (j / k)]);
  }
  return out;
}

function rrPts(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const corners = [
    [x + w - r, y + r, -HALF_PI],
    [x + w - r, y + h - r, 0],
    [x + r, y + h - r, HALF_PI],
    [x + r, y + r, PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (i / 4) * HALF_PI;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return densify(pts, 16);
}

function ellPts(cx, cy, rx, ry, n) {
  n = n || Math.max(10, Math.floor((rx + ry) / 3));
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return p;
}

function wline(g, pts, amp) {
  g.beginShape();
  g.curveVertex(pts[0][0], pts[0][1]);
  for (const [x, y] of pts) g.curveVertex(x + jit(amp || 1.2), y + jit(amp || 1.2));
  const l = pts[pts.length - 1];
  g.curveVertex(l[0], l[1]);
  g.endShape();
}

function shine(g, x, y, w, h) {
  g.noStroke();
  g.fill(255, 255, 255, 150);
  g.ellipse(x, y, w, h);
}

function bez(t, a, b, c, d) {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

// pointed Mughal-style arch, used for the mirror and its frame
function archPts(x, y, w, h) {
  const pts = [];
  const spring = y + w * 0.5;
  pts.push([x, y + h]);
  pts.push([x, spring]);
  for (let i = 1; i <= 24; i++)
    pts.push(bez(i / 24, [x, spring], [x, y + w * 0.16], [x + w * 0.34, y + w * 0.1], [x + w / 2, y]));
  for (let i = 1; i <= 24; i++)
    pts.push(bez(i / 24, [x + w / 2, y], [x + w * 0.66, y + w * 0.1], [x + w, y + w * 0.16], [x + w, spring]));
  pts.push([x + w, y + h]);
  return pts;
}

function shapeFrom(g, pts) {
  g.beginShape();
  for (const [x, y] of pts) g.vertex(x, y);
  g.endShape(CLOSE);
}

// ── bindis (64×64, centred) ──────────────────────────────────────

const BINDI_NAMES = ["Classic", "Teardrop", "Tiny", "Crown", "Moon", "Jewel"];

function artBindi(i) {
  const g = makeG(64, 64, 3);
  g.translate(32, 32);
  if (i === 0) {
    sticker(g, ellPts(0, 0, 13, 13), PAL.sindoor, 2.5);
    shine(g, -4, -5, 6, 4);
  } else if (i === 1) {
    sticker(g, [[0, -22], [6, -10], [10, 2], [8, 11], [0, 16], [-8, 11], [-10, 2], [-6, -10]], PAL.maroon, 2.5, 1);
    shine(g, -3, -2, 4, 7);
  } else if (i === 2) {
    sticker(g, ellPts(0, 0, 7, 7), "#1b0d10", 2);
  } else if (i === 3) {
    sticker(g, ellPts(0, 2, 10, 10), PAL.sindoor, 2.5);
    for (let k = 0; k < 7; k++) {
      const a = PI + (k / 6) * PI;
      sticker(g, ellPts(Math.cos(a) * 18, 2 + Math.sin(a) * 18, 3.2, 3.2, 8), PAL.gold, 1.5, 0.6);
    }
    shine(g, -3, -2, 5, 3);
  } else if (i === 4) {
    const outer = [];
    for (let k = 0; k <= 16; k++) {
      const a = PI * 0.15 + (k / 16) * PI * 0.7;
      outer.push([Math.cos(a + PI) * 18, Math.sin(a + PI) * 18 - 2]);
    }
    for (let k = 16; k >= 0; k--) {
      const a = PI * 0.15 + (k / 16) * PI * 0.7;
      outer.push([Math.cos(a + PI) * 12, Math.sin(a + PI) * 9 - 2]);
    }
    sticker(g, outer, PAL.peacockLight, 2, 0.8);
    sticker(g, ellPts(0, 10, 6, 6), PAL.sindoor, 2);
  } else {
    sticker(g, ellPts(0, -4, 9, 12), "#1f8f4e", 2.5);
    g.noFill();
    g.stroke(PAL.gold);
    g.strokeWeight(2);
    g.ellipse(0, -4, 14, 20);
    shine(g, -3, -8, 4, 6);
    for (let k = -1; k <= 1; k++) sticker(g, ellPts(k * 9, 15 - Math.abs(k) * 3, 3.5, 3.5, 8), "#ffffff", 1.5, 0.5);
  }
  return g;
}

// ── jhumka (80×150, hangs from the top centre) ───────────────────

function artJhumka() {
  const g = makeG(80, 150, 3);
  sticker(g, ellPts(40, 10, 8, 8), PAL.gold, 2.5);
  sticker(g, ellPts(40, 10, 3.5, 3.5, 8), PAL.sindoor, 1.5, 0.5);
  sticker(g, ellPts(40, 24, 4, 5, 8), PAL.goldLight, 2, 0.6);
  sticker(g, ellPts(40, 34, 4, 5, 8), PAL.goldLight, 2, 0.6);
  // the bell
  const bell = [[33, 40], [47, 40], [55, 55], [63, 76], [70, 98], [10, 98], [17, 76], [25, 55]];
  sticker(g, bell, PAL.gold, 3, 1.2);
  g.noFill();
  g.stroke(PAL.woodDark);
  g.strokeWeight(1.5);
  for (let r = 0; r < 3; r++) {
    const y = 58 + r * 13;
    const half = 10 + r * 9;
    for (let x = 40 - half; x <= 40 + half; x += 8) g.arc(x, y, 7, 7, 0, PI);
  }
  sticker(g, [[40, 62], [45, 70], [40, 80], [35, 70]], PAL.sindoor, 1.5, 0.4);
  sticker(g, rrPts(8, 95, 64, 9, 4), PAL.goldLight, 2.5, 0.8);
  // pearl fringe
  for (let x = 12; x <= 68; x += 7) {
    const drop = x % 14 === 12 % 14 ? 14 : 6;
    g.stroke(PAL.goldLight);
    g.strokeWeight(1.5);
    g.line(x, 104, x, 104 + drop);
    sticker(g, ellPts(x, 108 + drop, 3.4, 3.8, 8), "#fffaf0", 1.4, 0.4);
  }
  return g;
}

// ── outfits (300×440, neckline at the top centre) ────────────────

const OUTFIT_NAMES = ["Lehenga", "Saree", "Anarkali", "Kurta & Sharara", "Patiala", "Mummy's Nightie"];

function sleeves(g, col) {
  sticker(g, [[52, 46], [26, 64], [18, 104], [46, 104], [64, 70]], col, 3);
  sticker(g, [[248, 46], [274, 64], [282, 104], [254, 104], [236, 70]], col, 3);
}

function goldBand(g, pts) {
  sticker(g, pts, PAL.goldLight, 2.5, 1);
}

function buttis(g, x0, y0, x1, y1, col, step) {
  g.noStroke();
  for (let y = y0; y < y1; y += step) {
    for (let x = x0 + ((y / step) % 2) * (step / 2); x < x1; x += step) {
      g.fill(col);
      g.ellipse(x + jit(3), y + jit(3), 5, 5);
    }
  }
}

function neckline(g) {
  g.noFill();
  g.stroke(PAL.ink);
  g.strokeWeight(3);
  wline(g, [[112, 26], [130, 44], [150, 50], [170, 44], [188, 26]], 1);
}

function artOutfit(i) {
  const g = makeG(300, 440, 2);
  if (i === 0) {
    // lehenga: rani pink flare, maroon choli, sheer marigold dupatta
    const skirt = [[62, 120], [238, 120], [292, 432], [8, 432]];
    sticker(g, skirt, PAL.rani, 3);
    buttis(g, 50, 150, 250, 380, PAL.goldLight, 26);
    goldBand(g, [[20, 388], [280, 388], [288, 420], [12, 420]]);
    g.stroke(PAL.ink);
    g.strokeWeight(2);
    g.noFill();
    for (let x = 30; x < 280; x += 16) g.triangle(x, 404, x + 8, 396, x + 16, 404);
    sleeves(g, PAL.peacock);
    sticker(g, [[112, 26], [150, 50], [188, 26], [248, 46], [250, 124], [50, 124], [52, 46]], PAL.peacock, 3);
    goldBand(g, [[50, 112], [250, 112], [250, 126], [50, 126]]);
    g.push();
    g.noStroke();
    g.fill(242, 159, 5, 120);
    wobbly(g, [[54, 44], [96, 36], [260, 300], [236, 340]], 2);
    g.pop();
    g.stroke(PAL.gold);
    g.strokeWeight(4);
    g.line(56, 46, 238, 338);
    neckline(g);
  } else if (i === 1) {
    // saree: peacock teal with gold border, pleats, pallu over the shoulder
    sticker(g, [[70, 120], [230, 120], [252, 432], [48, 432]], PAL.peacock, 3);
    goldBand(g, [[46, 404], [254, 404], [256, 430], [44, 430]]);
    g.stroke(PAL.ink);
    g.strokeWeight(2);
    for (let x = 118; x <= 184; x += 11) g.line(x, 300, x - 4 + jit(3), 404);
    sleeves(g, PAL.marigold);
    sticker(g, [[112, 26], [150, 50], [188, 26], [248, 46], [246, 122], [54, 122], [52, 46]], PAL.marigold, 3);
    sticker(g, [[52, 40], [112, 24], [250, 190], [256, 232], [200, 240], [40, 120]], PAL.peacockLight, 3);
    goldBand(g, [[52, 40], [112, 24], [118, 34], [60, 52]]);
    goldBand(g, [[200, 228], [256, 220], [256, 234], [200, 242]]);
    buttis(g, 100, 70, 220, 200, PAL.goldLight, 22);
    neckline(g);
  } else if (i === 2) {
    // anarkali: marigold with gold bands and flared kalis
    sticker(g, [[70, 130], [230, 130], [296, 432], [4, 432]], PAL.marigold, 3);
    g.stroke(PAL.marigoldDeep);
    g.strokeWeight(2.5);
    for (let k = 0; k <= 8; k++) g.line(80 + k * 17.5, 132, 10 + k * 35, 430);
    goldBand(g, [[14, 380], [286, 380], [292, 412], [8, 412]]);
    goldBand(g, [[66, 126], [234, 126], [236, 142], [64, 142]]);
    sleeves(g, PAL.marigold);
    sticker(g, [[112, 26], [150, 50], [188, 26], [248, 46], [234, 132], [66, 132], [52, 46]], PAL.marigold, 3);
    goldBand(g, [[112, 26], [150, 50], [188, 26], [182, 40], [150, 66], [118, 40]]);
    neckline(g);
  } else if (i === 3) {
    // kurta + sharara: cream kurta, pink sharara
    sticker(g, [[52, 290], [148, 290], [140, 436], [6, 436]], PAL.pinkSoft, 3);
    sticker(g, [[152, 290], [248, 290], [294, 436], [160, 436]], PAL.pinkSoft, 3);
    sleeves(g, PAL.cream);
    sticker(g, [[112, 26], [150, 50], [188, 26], [248, 46], [256, 312], [44, 312], [52, 46]], PAL.cream, 3);
    g.stroke(PAL.ink);
    g.strokeWeight(2);
    g.line(150, 50, 150, 130);
    buttis(g, 70, 160, 230, 300, PAL.rani, 30);
    goldBand(g, [[44, 300], [256, 300], [256, 314], [44, 314]]);
    neckline(g);
  } else if (i === 4) {
    // patiala: sindoor red kameez, haldi dupatta, pleated salwar
    sticker(g, [[70, 330], [230, 330], [250, 432], [50, 432]], PAL.haldi, 3);
    g.stroke(PAL.ink);
    g.strokeWeight(1.8);
    for (let x = 70; x < 240; x += 14) g.line(x, 340, x + jit(6), 430);
    sleeves(g, PAL.sindoor);
    sticker(g, [[112, 26], [150, 50], [188, 26], [248, 46], [244, 340], [56, 340], [52, 46]], PAL.sindoor, 3);
    buttis(g, 70, 90, 230, 330, PAL.goldLight, 24);
    g.push();
    g.noStroke();
    g.fill(246, 201, 14, 190);
    wobbly(g, [[54, 40], [92, 34], [126, 190], [174, 190], [208, 34], [246, 40], [214, 260], [86, 260]], 2);
    g.pop();
    neckline(g);
  } else {
    // mummy's nightie: lilac floral maxi with frills (the classic)
    sticker(g, [[60, 46], [240, 46], [270, 420], [30, 420]], "#c7a6e8", 3);
    for (let k = 0; k < 40; k++) {
      const x = 60 + Math.random() * 190;
      const y = 140 + Math.random() * 260;
      g.noStroke();
      g.fill(PAL.rani);
      for (let p = 0; p < 5; p++) g.ellipse(x + Math.cos((p * TWO_PI) / 5) * 4, y + Math.sin((p * TWO_PI) / 5) * 4, 5, 5);
      g.fill(PAL.haldi);
      g.ellipse(x, y, 4, 4);
    }
    g.stroke(PAL.ink);
    g.strokeWeight(2.5);
    g.fill(255, 240, 250);
    for (let x = 32; x < 270; x += 18) g.arc(x + 9, 422, 20, 16, 0, PI);
    sticker(g, [[112, 26], [150, 50], [188, 26], [230, 46], [230, 130], [70, 130], [70, 46]], "#e9d5f7", 3);
    for (let x = 74; x < 230; x += 16) g.arc(x + 8, 132, 16, 12, 0, PI);
    sticker(g, ellPts(40, 70, 30, 28), "#c7a6e8", 3);
    sticker(g, ellPts(260, 70, 30, 28), "#c7a6e8", 3);
    neckline(g);
  }
  return g;
}

// ── chappal (150×64, top view, toe pointing right) ───────────────

function artChappal() {
  const g = makeG(150, 64, 2);
  const sole = [];
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * TWO_PI;
    const x = 75 + Math.cos(a) * 68;
    const wide = 0.75 + 0.25 * Math.cos(a);
    sole.push([x, 32 + Math.sin(a) * 26 * wide]);
  }
  sticker(g, sole, "#2f6fd6", 3);
  sticker(g, sole.map(([x, y]) => [75 + (x - 75) * 0.9, 32 + (y - 32) * 0.82]), "#f4f4ee", 0);
  g.noFill();
  g.stroke("#2f6fd6");
  g.strokeWeight(7);
  g.line(116, 32, 66, 10);
  g.line(116, 32, 66, 54);
  g.stroke(PAL.ink);
  g.strokeWeight(2);
  g.line(116, 32, 66, 10);
  g.line(116, 32, 66, 54);
  sticker(g, ellPts(117, 32, 5, 5, 8), "#2f6fd6", 2, 0.5);
  return g;
}

// ── aunty (320×400) ──────────────────────────────────────────────

function artAunty(throwing) {
  const g = makeG(320, 400, 2);
  // saree body
  sticker(g, [[70, 230], [250, 230], [290, 400], [30, 400]], PAL.marigoldDeep, 3);
  goldBand(g, [[30, 380], [290, 380], [292, 400], [28, 400]]);
  sticker(g, [[96, 228], [230, 232], [260, 400], [196, 400], [140, 260]], "#1f7a3f", 3);
  goldBand(g, [[140, 258], [150, 252], [214, 400], [200, 400]]);
  // arms
  if (throwing) {
    sticker(g, [[238, 240], [262, 230], [292, 120], [272, 112]], PAL.skin, 3);
    sticker(g, ellPts(283, 106, 15, 15), PAL.skin, 3);
  } else {
    sticker(g, [[66, 240], [44, 250], [52, 340], [76, 330]], PAL.skin, 3);
    sticker(g, [[254, 240], [276, 250], [268, 340], [244, 330]], PAL.skin, 3);
  }
  // neck + head
  sticker(g, rrPts(140, 180, 40, 50, 14), PAL.skin, 3);
  sticker(g, ellPts(160, 140, 62, 72), PAL.skin, 3);
  // hair + bun + grey streak
  sticker(g, [[96, 120], [110, 80], [160, 66], [210, 80], [224, 120], [206, 104], [160, 92], [114, 104]], "#1d1414", 3);
  sticker(g, ellPts(160, 58, 30, 22), "#1d1414", 3);
  g.stroke("#bdbdbd");
  g.strokeWeight(4);
  g.noFill();
  g.line(160, 70, 160, 92);
  // big bindi
  sticker(g, ellPts(160, 112, 8, 8), PAL.sindoor, 2);
  // glasses
  g.stroke(PAL.ink);
  g.strokeWeight(3);
  g.fill(255, 255, 255, 60);
  g.ellipse(136, 140, 36, 30);
  g.ellipse(184, 140, 36, 30);
  g.line(154, 140, 166, 140);
  g.fill(PAL.ink);
  g.noStroke();
  g.ellipse(138, 142, 8, 8);
  g.ellipse(182, 142, 8, 8);
  // eyebrows (unimpressed)
  g.stroke(PAL.ink);
  g.strokeWeight(4);
  g.line(118, 118, 150, 126);
  g.line(202, 118, 170, 126);
  // mouth
  if (throwing) {
    sticker(g, ellPts(160, 186, 14, 10), PAL.maroon, 2.5);
  } else {
    g.noFill();
    g.strokeWeight(4);
    g.arc(160, 192, 34, 14, PI, TWO_PI);
  }
  // earrings
  sticker(g, ellPts(98, 160, 6, 8), PAL.gold, 2);
  sticker(g, ellPts(222, 160, 6, 8), PAL.gold, 2);
  return g;
}

// ── vanity items ─────────────────────────────────────────────────

function drawPalette(g, x, y, s) {
  // open eyeshadow palette, lid propped up behind
  sticker(g, rrPts(x, y - 70 * s, 140 * s, 70 * s, 8 * s), "#2a2a2a", 3);
  sticker(g, rrPts(x + 8 * s, y - 62 * s, 124 * s, 54 * s, 6 * s), "#bfe3ea", 2);
  shine(g, x + 40 * s, y - 50 * s, 40 * s, 8 * s);
  sticker(g, rrPts(x, y - 4 * s, 140 * s, 40 * s, 6 * s), "#2a2a2a", 3);
  const cols = ["#f3d77a", "#c97b4a", "#8a3b2a", "#e7a1b0", "#d4a017", "#6d1a2a", "#21a3a6", "#3b2a2a"];
  for (let k = 0; k < 8; k++) {
    const cx = x + 14 * s + (k % 4) * 30 * s;
    const cy = y + 4 * s + Math.floor(k / 4) * 15 * s;
    sticker(g, rrPts(cx, cy, 24 * s, 11 * s, 3 * s), cols[k], 1.5, 0.6);
    if (k === 1 || k === 4) {
      g.noStroke();
      g.fill(0, 0, 0, 40);
      g.ellipse(cx + 12 * s, cy + 5 * s, 10 * s, 5 * s);
    }
  }
}

function drawFoundation(g, x, y, s) {
  sticker(g, rrPts(x, y - 80 * s, 46 * s, 80 * s, 10 * s), "#f6e7d8", 3);
  g.noStroke();
  g.fill("#d9a37a");
  g.rect(x + 6 * s, y - 46 * s, 34 * s, 40 * s, 6 * s);
  shine(g, x + 12 * s, y - 64 * s, 6 * s, 20 * s);
  sticker(g, rrPts(x + 12 * s, y - 100 * s, 22 * s, 22 * s, 4 * s), "#1f1f1f", 2.5);
  sticker(g, rrPts(x + 18 * s, y - 112 * s, 10 * s, 14 * s, 3 * s), "#1f1f1f", 2);
  sticker(g, rrPts(x + 26 * s, y - 112 * s, 18 * s, 6 * s, 2 * s), "#1f1f1f", 2);
}

function drawConcealer(g, x, y, s) {
  g.push();
  g.translate(x, y);
  g.rotate(-0.12);
  sticker(g, rrPts(0, -16 * s, 74 * s, 16 * s, 6 * s), "#f2dccb", 2.5);
  sticker(g, rrPts(74 * s, -14 * s, 16 * s, 12 * s, 3 * s), "#c9a227", 2);
  g.pop();
  g.push();
  g.translate(x + 96 * s, y - 2 * s);
  g.rotate(0.2);
  sticker(g, rrPts(0, -6 * s, 44 * s, 6 * s, 3 * s), "#c9a227", 2);
  sticker(g, ellPts(48 * s, -3 * s, 7 * s, 5 * s, 10), "#e2b391", 2);
  g.pop();
}

function drawBlush(g, x, y, s) {
  sticker(g, ellPts(x + 36 * s, y - 40 * s, 36 * s, 30 * s), "#2a2a2a", 3);
  sticker(g, ellPts(x + 36 * s, y - 40 * s, 28 * s, 22 * s), "#bfe3ea", 2);
  sticker(g, ellPts(x + 36 * s, y - 4 * s, 38 * s, 13 * s), "#2a2a2a", 3);
  sticker(g, ellPts(x + 36 * s, y - 5 * s, 30 * s, 9 * s), "#f08aa5", 2);
  g.noStroke();
  g.fill(255, 255, 255, 90);
  g.ellipse(x + 26 * s, y - 7 * s, 14 * s, 4 * s);
}

function drawLipstick(g, x, y, s, col, lying) {
  g.push();
  g.translate(x, y);
  if (lying) g.rotate(-HALF_PI + 0.25);
  sticker(g, rrPts(-10 * s, -34 * s, 20 * s, 34 * s, 3 * s), PAL.gold, 2.5);
  sticker(g, rrPts(-7 * s, -50 * s, 14 * s, 18 * s, 2 * s), "#c9a227", 2);
  sticker(g, [[-6 * s, -50 * s], [6 * s, -62 * s], [6 * s, -50 * s]].concat([[0, -48 * s]]), col, 2, 0.4);
  g.pop();
}

function drawKajal(g, x, y, s) {
  g.push();
  g.translate(x, y);
  g.rotate(0.1);
  sticker(g, rrPts(0, -9 * s, 120 * s, 9 * s, 4 * s), "#111111", 2.5);
  sticker(g, [[120 * s, -9 * s], [136 * s, -5 * s], [120 * s, 0]], "#3a2a2a", 2, 0.4);
  g.fill(PAL.gold);
  g.noStroke();
  g.rect(20 * s, -9 * s, 4 * s, 9 * s);
  g.pop();
  g.push();
  g.translate(x + 140 * s, y + 4 * s);
  sticker(g, rrPts(0, -9 * s, 30 * s, 9 * s, 4 * s), "#111111", 2.5);
  g.pop();
}

function drawAttar(g, x, y, s) {
  sticker(g, [[x + 6 * s, y], [x + 46 * s, y], [x + 52 * s, y - 40 * s], [x + 34 * s, y - 62 * s], [x + 18 * s, y - 62 * s], [x, y - 40 * s]], "#f7c6d6", 3);
  shine(g, x + 16 * s, y - 34 * s, 6 * s, 16 * s);
  sticker(g, rrPts(x + 18 * s, y - 78 * s, 16 * s, 16 * s, 4 * s), PAL.gold, 2.5);
  sticker(g, ellPts(x + 26 * s, y - 86 * s, 9 * s, 9 * s, 10), PAL.goldLight, 2);
}

function drawBangleStack(g, x, y, s) {
  const cols = [PAL.sindoor, PAL.gold, "#1f8f4e", PAL.gold, PAL.rani, PAL.gold];
  for (let k = 0; k < 6; k++) {
    g.noFill();
    g.stroke(PAL.ink);
    g.strokeWeight(7 * s + 3);
    g.ellipse(x, y - k * 6 * s, 74 * s, 24 * s);
    g.stroke(cols[k]);
    g.strokeWeight(7 * s);
    g.ellipse(x, y - k * 6 * s, 74 * s, 24 * s);
  }
}

function drawBindiCard(g, x, y, s) {
  g.push();
  g.translate(x, y);
  g.rotate(-0.08);
  sticker(g, rrPts(0, -30 * s, 66 * s, 34 * s, 4 * s), "#fff6e6", 2.5);
  const cs = [PAL.sindoor, PAL.maroon, PAL.peacock, "#1b0d10"];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
    g.noStroke();
    g.fill(cs[(r + c) % 4]);
    g.ellipse(9 * s + c * 12 * s, -20 * s + r * 13 * s, 7 * s, 7 * s);
  }
  g.pop();
}

function drawComb(g, x, y, s) {
  g.push();
  g.translate(x, y);
  g.rotate(-0.05);
  sticker(g, rrPts(0, -14 * s, 90 * s, 14 * s, 4 * s), "#f29fb8", 2.5);
  g.stroke(PAL.ink);
  g.strokeWeight(1.5);
  for (let k = 6; k < 88; k += 5) g.line(k * s, 0, k * s, 8 * s);
  g.pop();
}

function powderSpill(g, x, y, s) {
  g.noStroke();
  for (let k = 0; k < 40; k++) {
    g.fill(240, 200, 170, 140);
    g.ellipse(x + jit(80 * s), y + jit(14 * s), 3 + Math.random() * 4, 2 + Math.random() * 2);
  }
}

// ── marigold garland bits ────────────────────────────────────────

function marigold(g, x, y, r, col) {
  g.push();
  g.translate(x, y);
  g.noStroke();
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TWO_PI;
    g.fill(col);
    g.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.8, r * 0.8);
  }
  g.fill(PAL.marigoldDeep);
  g.ellipse(0, 0, r * 0.9, r * 0.9);
  g.noFill();
  g.stroke(PAL.ink);
  g.strokeWeight(1.6);
  wobbly(g, ellPts(0, 0, r, r, 14), 1.4);
  g.pop();
}

function mangoLeaf(g, x, y, len, ang) {
  g.push();
  g.translate(x, y);
  g.rotate(ang);
  sticker(g, [[0, 0], [len * 0.4, -len * 0.18], [len, 0], [len * 0.4, len * 0.18]], PAL.leaf, 2, 0.6);
  g.stroke(PAL.leafLight);
  g.strokeWeight(1.5);
  g.line(2, 0, len * 0.9, 0);
  g.pop();
}

// ── build everything once ────────────────────────────────────────

const ART = {};

function buildArt() {
  ART.bindis = [];
  for (let i = 0; i < 6; i++) ART.bindis.push(OVERRIDE_IMG["bindi_" + (i + 1)] || artBindi(i));
  ART.jhumka = OVERRIDE_IMG.jhumka || artJhumka();
  ART.jhumkas = [];
  for (const j of USER_ART.jhumkas) if (USER_IMG[j.file]) ART.jhumkas.push({ img: USER_IMG[j.file], name: j.name, len: j.len });
  ART.jhumkas.push({ img: ART.jhumka, name: "Classic", len: 0.42 });
  ART.bangles = [];
  for (const b of USER_ART.bangles) if (USER_IMG[b.file]) ART.bangles.push({ img: USER_IMG[b.file], name: b.name });
  if (!ART.bangles.length) ART.bangles.push({ img: null, name: "Glass" }); // drawn live if no images
  ART.outfits = [];
  for (const o of USER_ART.outfits) if (USER_IMG[o.file]) ART.outfits.push(Object.assign({ img: USER_IMG[o.file] }, o));
  // the drawn outfits are only a fallback now, if the Pinterest ones fail to load
  if (!ART.outfits.length)
    for (let i = 0; i < 6; i++)
      ART.outfits.push({ img: OVERRIDE_IMG["outfit_" + (i + 1)] || artOutfit(i), name: OUTFIT_NAMES[i], shoulder: 0.667, cx: 0.5, span: 2.3, drop: 0.12 });
  ART.chappal = OVERRIDE_IMG.chappal || artChappal();
  ART.aunty = OVERRIDE_IMG.aunty || artAunty(false);
  ART.auntyThrow = OVERRIDE_IMG.aunty_throw || OVERRIDE_IMG.aunty || artAunty(true);
}

// wall, mirror frame and garland: one full-canvas layer with a hole
// cut where the mirror glass is, so the camera shows through
function buildWallLayer() {
  const g = makeG(width, height, 1);
  g.background(PAL.wall);
  // block-print motif on the wall
  g.noStroke();
  const step = 46;
  for (let y = 0; y < height + step; y += step) {
    for (let x = ((y / step) % 2) * (step / 2); x < width + step; x += step) {
      g.fill(PAL.wallMotif);
      for (let p = 0; p < 4; p++) {
        const a = (p * TWO_PI) / 4 + PI / 4;
        g.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 9, 9);
      }
      g.fill("#8f2a40");
      g.ellipse(x, y, 4, 4);
    }
  }
  // frame
  const M = L.mirror;
  const fw = L.frameW;
  const outer = archPts(M.x - fw, M.y - fw, M.w + fw * 2, M.h + fw);
  g.fill(PAL.ink);
  shapeFrom(g, archPts(M.x - fw - 4, M.y - fw - 4, M.w + fw * 2 + 8, M.h + fw + 4));
  g.fill(PAL.wood);
  shapeFrom(g, outer);
  g.fill(PAL.woodLight);
  shapeFrom(g, archPts(M.x - fw * 0.6, M.y - fw * 0.6, M.w + fw * 1.2, M.h + fw * 0.6));
  g.fill(PAL.gold);
  shapeFrom(g, archPts(M.x - fw * 0.28, M.y - fw * 0.28, M.w + fw * 0.56, M.h + fw * 0.28));
  // carved dots along the frame
  const mid = archPts(M.x - fw * 0.8, M.y - fw * 0.8, M.w + fw * 1.6, M.h + fw * 0.8);
  const dense = densify(mid, 18);
  for (let k = 0; k < dense.length; k++) {
    const [x, y] = dense[k];
    if (y > M.y + M.h - 4) continue;
    g.fill(PAL.goldLight);
    g.stroke(PAL.woodDark);
    g.strokeWeight(1.5);
    g.ellipse(x, y, fw * 0.22, fw * 0.22);
  }
  // cut the glass hole
  g.erase();
  g.noStroke();
  shapeFrom(g, archPts(M.x, M.y, M.w, M.h));
  g.noErase();
  g.noFill();
  g.stroke(PAL.ink);
  g.strokeWeight(3);
  shapeFrom(g, archPts(M.x, M.y, M.w, M.h));
  // lotus keystone at the top
  const kx = M.x + M.w / 2;
  const ky = M.y - fw;
  for (let p = -2; p <= 2; p++) {
    g.push();
    g.translate(kx, ky + 6);
    g.rotate(p * 0.42);
    sticker(g, [[0, 0], [-9, -22], [0, -40], [9, -22]], p === 0 ? PAL.rani : PAL.pinkSoft, 2.5, 0.8);
    g.pop();
  }
  // marigold swag across the top of the frame + hanging strings
  // garland follows the outside of the arch, from one shoulder to the other
  const springY = M.y - fw * 1.05 + (M.w + fw * 2.1) * 0.5;
  const swag = densify(archPts(M.x - fw * 1.05, M.y - fw * 1.05, M.w + fw * 2.1, M.h), 22)
    .filter(([x, y]) => y <= springY + 1)
    .sort((a, b) => a[0] - b[0]);
  for (let k = 0; k < swag.length; k++) {
    const [x, y] = swag[k];
    if (k % 3 === 1) mangoLeaf(g, x, y - 6, 26, -HALF_PI + jit(0.8));
    marigold(g, x, y, 12, k % 2 ? PAL.marigold : PAL.haldi);
  }
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? M.x - fw * 0.9 : M.x + M.w + fw * 0.9;
    const y0 = swag[side < 0 ? 0 : swag.length - 1][1];
    for (let k = 0; k < 9; k++) marigold(g, x0 + jit(2), y0 + 16 + k * 22, 11, k % 2 ? PAL.marigold : PAL.haldi);
    mangoLeaf(g, x0 - 4, y0 + 16 + 9 * 22, 26, HALF_PI);
  }
  // bindis stuck on the bottom-right corner of the frame (a classic)
  for (let k = 0; k < 4; k++) {
    const bx = M.x + M.w + fw * 0.45 + jit(6);
    const by = M.y + M.h - 30 - k * 26;
    g.image(ART.bindis[k % ART.bindis.length], bx - 9, by - 9, 18, 18);
  }
  return g;
}

function buildTableLayer() {
  const g = makeG(width, height, 1);
  const top = L.tableTop;
  const s = L.s;
  // table top surface + front
  g.noStroke();
  g.fill(PAL.ink);
  g.rect(0, top - 3, width, height - top + 3);
  g.fill(PAL.woodLight);
  g.rect(0, top, width, 46 * s);
  g.fill(PAL.wood);
  g.rect(0, top + 46 * s, width, height);
  g.stroke(PAL.woodDark);
  g.strokeWeight(2);
  for (let x = 0; x < width; x += 90) wline(g, [[x, top + 8], [x + 60, top + 10 + jit(4)]], 2);
  // drawer handles
  for (const fx of [0.18, 0.82]) {
    sticker(g, rrPts(width * fx - 40 * s, top + 80 * s, 80 * s, 18 * s, 9 * s), PAL.gold, 2.5);
  }
  if (OVERRIDE_IMG.vanity) {
    // one big vanity illustration supplied: sit it on the table, centred
    const img = OVERRIDE_IMG.vanity;
    const h = Math.min(height * 0.32, (img.height / img.width) * width * 0.9);
    const w = (img.width / img.height) * h;
    g.image(img, width / 2 - w / 2, top + 30 * s - h, w, h);
    return g;
  }
  const M = L.mirror;
  const base = top + 30 * s;
  const lx = M.x - L.frameW;
  const rx = M.x + M.w + L.frameW;
  // back row: Leo's Pinterest makeup, sitting further back on the table
  const back = top + 14 * s;
  const put = (file, x, h, rot) => {
    const img = USER_IMG[file];
    if (!img) return;
    const w = (img.width / img.height) * h;
    g.push();
    g.translate(x, back);
    if (rot) g.rotate(rot);
    g.image(img, -w / 2, -h, w, h);
    g.pop();
  };
  put("v_powder", lx - 400 * s, 92 * s);
  put("v_palette", lx - 330 * s, 118 * s, -0.05);
  put("v_cushion", lx - 112 * s, 74 * s);
  put("v_liners", lx - 32 * s, 120 * s, 0.12);
  put("v_gloss", rx + 22 * s, 104 * s, -0.06);
  put("v_redcompact", rx + 228 * s, 104 * s);
  put("v_lipstick", rx + 318 * s, 86 * s, 0.1);
  put("bangle_stand", rx + 372 * s, 128 * s);
  // left cluster (spills a bit in front of the mirror)
  drawPalette(g, lx - 210 * s, base, s);
  drawFoundation(g, lx - 300 * s, base, s);
  powderSpill(g, lx - 60 * s, base + 4 * s, s);
  drawConcealer(g, lx - 150 * s, base + 10 * s, s);
  drawBlush(g, lx - 420 * s, base, s);
  drawComb(g, lx - 40 * s, base + 14 * s, s);
  // right cluster
  drawLipstick(g, rx + 40 * s, base, s, PAL.sindoor);
  drawLipstick(g, rx + 66 * s, base + 2 * s, s, PAL.rani);
  drawLipstick(g, rx + 110 * s, base + 12 * s, s, PAL.maroon, true);
  drawAttar(g, rx + 150 * s, base, s);
  drawKajal(g, rx + 30 * s, base + 26 * s, s);
  drawBangleStack(g, rx + 280 * s, base + 4 * s, s);
  drawBindiCard(g, rx + 340 * s, base + 22 * s, s);
  return g;
}

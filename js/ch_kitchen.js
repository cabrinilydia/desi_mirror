/* Chapter 4 · Snack Mission
   You, in the outfit you picked, in our (very big) kitchen. The family has
   hidden snacks in tins, dabbas and jars all over the shelves. Run, jump,
   and bump into containers to open them. Find all ten.

   Your head is your live face from the webcam.
   Controls (no mouse needed):
     phone   tilt left / right to run, flick or tap JUMP to jump
     finger  point left / right of yourself to run, open your palm to jump
     keys    ← → to run, space or ↑ to jump
*/

const SNACKS = [
  { file: "snack_jalebi", name: "Jalebi", line: "Paati hid the jalebi in the rice sack!" },
  { file: "snack_gulab_jamun", name: "Gulab Jamun", line: "Gulab jamun in the pressure cooker. Classic Amma." },
  { file: "snack_pani_puri", name: "Pani Puri", line: "Pani puri behind the steel dabbas!" },
  { file: "snack_momos", name: "Momos", line: "Momos?! Chithi has been hiding these." },
  { file: "snack_paneer_tikka", name: "Paneer Tikka", line: "Paneer tikka on the top rack. Appa thinks he's clever." },
  { file: "snack_rajma_chawal", name: "Rajma Chawal", line: "Rajma chawal in the kudam. Who does this?" },
  { file: "snack_medu_vada", name: "Medu Vada", line: "Medu vada in the idli steamer. Of course." },
  { file: "snack_chole_kulcha", name: "Chole Kulcha", line: "Chole kulcha in Paati's pickle jar?!" },
  { file: "snack_poori_channa", name: "Poori Channa", line: "Poori channa in Thatha's tiffin. Now it's yours." },
  { file: "snack_pav_bhaji", name: "Pav Bhaji", line: "Pav bhaji on top of the fridge. The final boss." },
];
const DECOYS = [
  { item: "sewing", line: "It's Amma's sewing kit. Every. Single. Time." },
  { item: "sambar", line: "Ice-cream tub... full of sambar. Betrayal." },
  { item: "masala", line: "Just masala. Thatha got here first." },
];

const Kitchen = {
  name: "Snacks",
  usesPointer: true,
  built: false,
  bg: null,
  sprites: {},
  plats: [],
  conts: [],
  items: [],
  found: [],
  hero: null,
  camX: 0,
  line: "",
  lineAt: -9999,
  palmWas: false,
  startAt: 0,
  doneAt: 0,

  init() {
    this.build();
  },

  resize() {
    this.build();
  },

  enter() {
    if (!this.built) this.build();
    this.reset();
    sendState();
  },

  reset() {
    const h = height;
    this.hero = { x: width * 0.06, y: h * 0.86, vx: 0, vy: 0, ground: true, face: 1, step: 0 };
    this.camX = 0;
    this.items = [];
    this.found = SNACKS.map(() => false);
    for (const c of this.conts) {
      c.opened = false;
      c.t0 = 0;
    }
    this.startAt = millis();
    this.doneAt = 0;
    this.say("Amma hid all the snacks. Find them before the guests come!");
  },

  // locks the next/back buttons to the phone while you're playing, so
  // steering with your finger doesn't press them by accident
  lockNav() {
    return !this.doneAt;
  },

  say(t) {
    this.line = t;
    this.lineAt = millis();
  },

  // ── the kitchen ────────────────────────────────────────────────
  build() {
    const h = height;
    const S = width;
    this.G = h * 0.86; // floor
    this.C = h * 0.7; // counter top
    const S1 = h * 0.555;
    const S2 = h * 0.405;
    const TOP = h * 0.355; // top of the fridge
    this.W = S * 3.2; // the kitchen is 3.2 screens wide
    const C = this.C;
    this.plats = [
      { x: S * 0.22, w: S * 0.78, y: C, kind: "counter" },
      { x: S * 1.52, w: S * 0.55, y: C, kind: "counter" },
      { x: S * 2.25, w: S * 0.6, y: C, kind: "counter" },
      { x: S * 0.3, w: S * 0.38, y: S1, kind: "shelf" },
      { x: S * 0.55, w: S * 0.38, y: S2, kind: "shelf" },
      { x: S * 1.1, w: S * 0.26, y: C, kind: "rack" },
      { x: S * 1.1, w: S * 0.26, y: S1, kind: "rack" },
      { x: S * 1.1, w: S * 0.26, y: S2, kind: "rack" },
      { x: S * 1.6, w: S * 0.36, y: S1, kind: "shelf" },
      { x: S * 1.75, w: S * 0.34, y: S2, kind: "shelf" },
      { x: S * 2.3, w: S * 0.36, y: S1, kind: "shelf" },
      { x: S * 2.48, w: S * 0.34, y: S2, kind: "shelf" },
      { x: S * 2.92, w: S * 0.2, y: TOP, kind: "fridge" },
    ];
    // where everything is hidden (snack = index into SNACKS, decoy = into DECOYS)
    this.conts = [
      { x: S * 0.12, y: this.G, type: "sack", snack: 0 },
      { x: S * 0.43, y: C, type: "cooker", snack: 1 },
      { x: S * 0.4, y: S1, type: "cookietin", decoy: 0 },
      { x: S * 0.6, y: S1, type: "dabba", snack: 2 },
      { x: S * 0.82, y: S2, type: "masala", decoy: 2 },
      { x: S * 1.17, y: C, type: "dabba", snack: 3 },
      { x: S * 1.29, y: S2, type: "dabba", snack: 4 },
      { x: S * 1.45, y: this.G, type: "kudam", snack: 5 },
      { x: S * 1.8, y: C, type: "idli", snack: 6 },
      { x: S * 1.7, y: S1, type: "icetub", decoy: 1 },
      { x: S * 1.97, y: S2, type: "jar", snack: 7 },
      { x: S * 2.42, y: S1, type: "tiffin", snack: 8 },
      { x: S * 3.02, y: TOP, type: "bigjar", snack: 9 },
    ];
    this.buildSprites();
    for (const c of this.conts) {
      const sp = this.sprites[c.type];
      c.h = h * sp.hh;
      c.w = c.h * sp.ratio;
    }
    if (this.bg) this.bg.remove();
    this.bg = this.buildBackground();
    this.built = true;
  },

  buildBackground() {
    const h = height;
    const S = width;
    const W = this.W;
    const G = this.G;
    const C = this.C;
    const g = makeG(Math.ceil(W), Math.ceil(h), 1);
    // wall
    g.background("#f3e2bf");
    g.noStroke();
    for (let x = 0; x < W; x += 60) {
      g.fill(232, 210, 168, 120);
      g.rect(x, 0, 2, G);
    }
    // blue-and-white tile backsplash behind the counters
    for (const p of this.plats.filter((p) => p.kind === "counter")) {
      const top = C - h * 0.17;
      const ts = h * 0.04;
      for (let y = top; y < C; y += ts) {
        for (let x = p.x; x < p.x + p.w; x += ts) {
          g.fill(((x - p.x) / ts + (y - top) / ts) % 2 < 1 ? "#ffffff" : "#e3eef7");
          g.stroke("#9cb7d1");
          g.strokeWeight(1);
          g.rect(x, y, ts, ts);
          g.noStroke();
          g.fill("#2f6fd6");
          g.ellipse(x + ts / 2, y + ts / 2, ts * 0.22, ts * 0.22);
        }
      }
    }
    // red oxide floor + skirting
    g.fill("#8e2f22");
    g.rect(0, G, W, h - G);
    g.fill(255, 255, 255, 25);
    for (let x = 0; x < W; x += 140) g.rect(x, G + 6, 70, h - G);
    g.fill(PAL.maroon);
    g.rect(0, G - h * 0.015, W, h * 0.015);
    // the door, with a mango-leaf thoran and a kolam in front
    g.fill("#6b3a1e");
    g.rect(S * 0.005, G - h * 0.5, S * 0.07, h * 0.5);
    g.fill("#8a4a22");
    g.rect(S * 0.012, G - h * 0.48, S * 0.056, h * 0.48);
    for (let k = 0; k < 7; k++) mangoLeaf(g, S * 0.012 + k * S * 0.009, G - h * 0.5, 26, HALF_PI + jit(0.3));
    // kolam on the floor at the door: dots with loops woven round them
    const kx0 = S * 0.14;
    const ky = G + h * 0.05;
    const st = h * 0.022;
    g.stroke(255);
    g.strokeWeight(5);
    for (let r = -1; r <= 1; r++) {
      const n = 3 - Math.abs(r);
      for (let c = 0; c < n * 2 - 1; c += 2) {
        const x = kx0 + (c - (n - 1)) * st + 3 * st;
        g.point(x, ky + r * st * 0.9);
      }
    }
    g.noFill();
    g.strokeWeight(2);
    for (let r = -1; r <= 1; r++) {
      const n = 3 - Math.abs(r);
      for (let c = 0; c < n * 2 - 1; c += 2) {
        const x = kx0 + (c - (n - 1)) * st + 3 * st;
        g.ellipse(x, ky + r * st * 0.9, st * 1.3, st * 1.1);
      }
    }
    g.ellipse(kx0 + 3 * st, ky, st * 6.2, st * 3.4);
    // Tamil calendar, clock, window
    sticker(g, rrPts(S * 0.16, h * 0.18, S * 0.06, h * 0.16, 4), "#fff6e6", 2.5);
    g.noStroke();
    g.fill(PAL.sindoor);
    g.rect(S * 0.16 + 4, h * 0.18 + 4, S * 0.06 - 8, h * 0.035);
    g.fill(PAL.ink);
    g.textAlign(CENTER, CENTER);
    g.textFont("Baloo Thambi 2");
    g.textSize(h * 0.018);
    g.fill(255);
    g.text("கார்த்திகை", S * 0.19, h * 0.198);
    g.fill(PAL.ink);
    g.textSize(h * 0.06);
    g.text("16", S * 0.19, h * 0.27);
    sticker(g, ellPts(S * 1.47, h * 0.22, h * 0.05, h * 0.05), "#fff6e6", 3);
    g.stroke(PAL.ink);
    g.strokeWeight(3);
    g.line(S * 1.47, h * 0.22, S * 1.47, h * 0.185);
    g.line(S * 1.47, h * 0.22, S * 1.495, h * 0.23);
    sticker(g, rrPts(S * 2.02, h * 0.14, S * 0.16, h * 0.17, 6), "#9fd3e6", 3);
    g.stroke("#6b3a1e");
    g.strokeWeight(5);
    g.line(S * 2.1, h * 0.14, S * 2.1, h * 0.31);
    g.line(S * 2.02, h * 0.225, S * 2.18, h * 0.225);
    // counters: granite top + wooden cabinets with brass knobs
    for (const p of this.plats.filter((p) => p.kind === "counter")) {
      sticker(g, rrPts(p.x, C, p.w, G - C, 3), "#a8622f", 3);
      const n = Math.max(2, Math.round(p.w / (S * 0.1)));
      for (let k = 0; k < n; k++) {
        const dx = p.x + (k * p.w) / n;
        g.noFill();
        g.stroke(PAL.woodDark);
        g.strokeWeight(2);
        g.rect(dx + 8, C + h * 0.035, p.w / n - 16, G - C - h * 0.05, 4);
        g.noStroke();
        g.fill(PAL.gold);
        g.ellipse(dx + p.w / n - 22, C + h * 0.09, 9, 9);
      }
      sticker(g, rrPts(p.x - 8, C - 4, p.w + 16, h * 0.028, 3), "#2d2a2e", 3);
      g.noStroke();
      g.fill(255, 255, 255, 40);
      for (let k = 0; k < p.w; k += 23) g.ellipse(p.x + k, C + 6, 4, 2);
    }
    // gas stove under the pressure cooker
    sticker(g, rrPts(S * 0.37, C - h * 0.035, S * 0.12, h * 0.035, 4), "#3a3a3a", 3);
    for (const bx of [S * 0.4, S * 0.46]) {
      g.noStroke();
      g.fill(PAL.marigoldDeep);
      g.ellipse(bx, C - h * 0.037, S * 0.03, 8);
    }
    // wooden shelves with brackets
    for (const p of this.plats.filter((p) => p.kind === "shelf")) {
      for (const bx of [p.x + 18, p.x + p.w - 18]) {
        g.fill(PAL.woodDark);
        g.noStroke();
        g.triangle(bx - 8, p.y, bx + 8, p.y, bx, p.y + h * 0.05);
      }
      sticker(g, rrPts(p.x, p.y, p.w, h * 0.02, 3), "#8a4a22", 3);
    }
    // steel rack
    const rk = this.plats.filter((p) => p.kind === "rack");
    if (rk.length) {
      const x0 = rk[0].x;
      const x1 = rk[0].x + rk[0].w;
      for (const px of [x0 + 6, x1 - 6]) sticker(g, rrPts(px - 6, Math.min(...rk.map((r) => r.y)) - h * 0.04, 12, G - Math.min(...rk.map((r) => r.y)) + h * 0.04, 4), "#b9c0c6", 2.5);
      for (const r of rk) sticker(g, rrPts(r.x, r.y, r.w, h * 0.014, 3), "#cfd5da", 2.5);
    }
    // the fridge (its top is a platform)
    const fr = this.plats.find((p) => p.kind === "fridge");
    sticker(g, rrPts(fr.x, fr.y, fr.w, G - fr.y, 18), PAL.peacockLight, 3.5);
    g.stroke(PAL.ink);
    g.strokeWeight(3);
    g.line(fr.x + 6, fr.y + (G - fr.y) * 0.36, fr.x + fr.w - 6, fr.y + (G - fr.y) * 0.36);
    sticker(g, rrPts(fr.x + fr.w * 0.8, fr.y + (G - fr.y) * 0.12, 10, h * 0.1, 5), "#e8e8e8", 2);
    sticker(g, rrPts(fr.x + fr.w * 0.8, fr.y + (G - fr.y) * 0.45, 10, h * 0.14, 5), "#e8e8e8", 2);
    for (let k = 0; k < 4; k++) sticker(g, ellPts(fr.x + fr.w * (0.2 + k * 0.15), fr.y + (G - fr.y) * (0.55 + (k % 2) * 0.08), 10, 10, 10), [PAL.rani, PAL.haldi, PAL.sindoor, "#7be38b"][k], 2);
    return g;
  },

  // container art: a body and a lid, drawn once
  buildSprites() {
    const mk = (fn, hh) => {
      const body = makeG(160, 160, 2);
      const lid = makeG(160, 160, 2);
      fn(body, lid);
      return { body, lid, hh, ratio: 1 };
    };
    const steel = "#cfd5da";
    this.sprites = {
      dabba: mk((b, l) => {
        sticker(b, rrPts(34, 62, 92, 94, 10), steel, 3);
        b.stroke("#9aa3aa");
        b.strokeWeight(2);
        b.line(38, 92, 122, 92);
        b.line(38, 122, 122, 122);
        shine(b, 52, 110, 8, 30);
        sticker(l, rrPts(26, 46, 108, 20, 8), "#b7bfc6", 3);
      }, 0.075),
      cookietin: mk((b, l) => {
        sticker(b, rrPts(12, 84, 136, 72, 12), "#1f4e9a", 3);
        b.noFill();
        b.stroke(255);
        b.strokeWeight(2);
        for (let k = 0; k < 5; k++) b.arc(30 + k * 25, 120, 18, 18, PI, TWO_PI);
        sticker(l, rrPts(6, 66, 148, 24, 10), "#2a5fb5", 3);
      }, 0.065),
      icetub: mk((b, l) => {
        sticker(b, [[24, 66], [136, 66], [124, 156], [36, 156]], "#fff6ee", 3);
        b.noStroke();
        b.fill(PAL.pinkSoft);
        b.rect(32, 96, 96, 28);
        b.fill(PAL.rani);
        b.textAlign(CENTER, CENTER);
        b.textSize(15);
        b.text("VANILLA", 80, 110);
        sticker(l, rrPts(18, 52, 124, 18, 8), PAL.pinkSoft, 3);
      }, 0.065),
      cooker: mk((b, l) => {
        sticker(b, rrPts(22, 70, 96, 86, 14), steel, 3);
        sticker(b, rrPts(112, 80, 46, 12, 5), "#222222", 2.5);
        shine(b, 40, 110, 8, 30);
        sticker(l, ellPts(70, 66, 54, 12), "#b7bfc6", 3);
        sticker(l, rrPts(62, 36, 16, 24, 5), "#222222", 2.5);
      }, 0.085),
      jar: mk((b, l) => {
        sticker(b, [[40, 60], [120, 60], [140, 100], [128, 156], [32, 156], [20, 100]], "#efe3c8", 3);
        b.noStroke();
        b.fill("#8a4a22");
        b.rect(40, 60, 80, 22);
        sticker(l, [[34, 48], [126, 48], [118, 66], [42, 66]], PAL.sindoor, 3);
        sticker(l, ellPts(80, 40, 10, 10, 10), PAL.sindoor, 2.5);
      }, 0.09),
      masala: mk((b, l) => {
        sticker(b, rrPts(18, 104, 124, 52, 14), steel, 3);
        sticker(l, rrPts(12, 90, 136, 20, 10), "#b7bfc6", 3);
      }, 0.045),
      sack: mk((b, l) => {
        sticker(b, [[30, 60], [130, 60], [146, 156], [14, 156]], "#c9a46a", 3);
        b.noStroke();
        b.fill(PAL.sindoor);
        b.textAlign(CENTER, CENTER);
        b.textFont("Baloo Thambi 2");
        b.textSize(24);
        b.text("அரிசி", 80, 112);
        sticker(l, [[26, 40], [134, 40], [130, 64], [30, 64]], "#a8844f", 3);
      }, 0.11),
      kudam: mk((b, l) => {
        sticker(b, ellPts(80, 112, 56, 44), "#c99a2e", 3);
        sticker(b, rrPts(56, 52, 48, 26, 8), "#c99a2e", 3);
        shine(b, 56, 100, 10, 26);
        sticker(l, ellPts(80, 50, 32, 9), "#e8c66a", 3);
      }, 0.1),
      idli: mk((b, l) => {
        sticker(b, rrPts(28, 64, 104, 92, 12), steel, 3);
        b.stroke("#9aa3aa");
        b.strokeWeight(2);
        for (let k = 0; k < 3; k++) b.line(32, 86 + k * 22, 128, 86 + k * 22);
        sticker(l, [[28, 66], [132, 66], [116, 40], [44, 40]], "#b7bfc6", 3);
        sticker(l, ellPts(80, 36, 10, 7, 10), "#222222", 2);
      }, 0.085),
      tiffin: mk((b, l) => {
        for (let k = 0; k < 3; k++) sticker(b, rrPts(40, 70 + k * 29, 80, 28, 8), steel, 2.5);
        b.noFill();
        b.stroke("#7a8288");
        b.strokeWeight(4);
        b.line(36, 70, 36, 156);
        b.line(124, 70, 124, 156);
        sticker(l, rrPts(36, 54, 88, 18, 8), "#b7bfc6", 3);
        l.noFill();
        l.stroke("#7a8288");
        l.strokeWeight(5);
        l.arc(80, 54, 70, 50, PI, TWO_PI);
      }, 0.09),
      bigjar: mk((b, l) => {
        sticker(b, rrPts(32, 50, 96, 106, 16), "#d9eef5", 3);
        b.noStroke();
        b.fill(242, 159, 5, 160);
        b.rect(40, 90, 80, 60, 10);
        sticker(l, rrPts(30, 34, 100, 22, 8), PAL.haldi, 3);
      }, 0.1),
    };
    // decoy items that pop out instead of a snack
    const dk = (fn) => {
      const g = makeG(140, 140, 2);
      fn(g);
      return g;
    };
    this.decoyArt = {
      sewing: dk((g) => {
        sticker(g, rrPts(44, 40, 52, 70, 8), "#d81b7a", 3);
        sticker(g, rrPts(38, 34, 64, 12, 5), "#8a4a22", 2.5);
        sticker(g, rrPts(38, 104, 64, 12, 5), "#8a4a22", 2.5);
        g.stroke(PAL.ink);
        g.strokeWeight(3);
        g.line(108, 24, 124, 110);
        sticker(g, ellPts(26, 112, 10, 10, 10), PAL.haldi, 2);
      }),
      sambar: dk((g) => {
        sticker(g, [[16, 60], [124, 60], [104, 116], [36, 116]], steel, 3);
        sticker(g, ellPts(70, 62, 54, 12), "#c2611f", 2.5);
        g.stroke("#3f7d20");
        g.strokeWeight(6);
        g.line(54, 40, 92, 72);
      }),
      masala: dk((g) => {
        sticker(g, [[20, 110], [70, 46], [120, 110]], PAL.sindoor, 3);
        sticker(g, ellPts(70, 112, 52, 8), "#9b1b1b", 2);
      }),
    };
  },

  // ── playing ────────────────────────────────────────────────────
  jump() {
    if (this.hero.ground) {
      this.hero.vy = -height * 0.00117;
      this.hero.ground = false;
    }
  },

  action(a) {
    if (a === "jump" || a === "flick" || a === "toss") this.jump();
  },

  update() {
    if (!this.built) return;
    const hgt = height;
    const ms = dt();
    const H = this.hero;

    // how hard to run, -1..1
    let move = 0;
    if (phoneConnected()) {
      const g = REMOTE.tilt;
      if (Math.abs(g) > 5) move = constrain((g - Math.sign(g) * 5) / 20, -1, 1);
    } else if (pointer && TRACK.hands.length) {
      const d = pointer.x - (H.x - this.camX);
      if (Math.abs(d) > 60 * L.s) move = constrain(d / (220 * L.s), -1, 1);
    }
    if (keyIsDown(LEFT_ARROW)) move = -1;
    if (keyIsDown(RIGHT_ARROW)) move = 1;

    // open palm = jump (on the moment the hand opens)
    const palm = TRACK.hands.some(isOpenPalm);
    if (palm && !this.palmWas) this.jump();
    this.palmWas = palm;

    const RUN = hgt * 0.00045; // *** run speed
    const GRAV = hgt * 0.0000033; // *** gravity
    H.vx = lerp(H.vx, move * RUN, 0.25);
    if (Math.abs(move) > 0.1) H.face = Math.sign(move);
    const prevY = H.y;
    H.x = constrain(H.x + H.vx * ms, width * 0.03, this.W - width * 0.03);
    H.vy += GRAV * ms;
    H.y += H.vy * ms;
    H.ground = false;
    if (H.vy >= 0) {
      for (const p of this.plats) {
        if (prevY <= p.y + 2 && H.y >= p.y && H.x > p.x - 8 && H.x < p.x + p.w + 8) {
          H.y = p.y;
          H.vy = 0;
          H.ground = true;
        }
      }
    }
    if (H.y >= this.G) {
      H.y = this.G;
      H.vy = 0;
      H.ground = true;
    }
    H.step += Math.abs(H.vx) * ms * 0.02;

    // camera follows
    const target = constrain(H.x - width * 0.42, 0, this.W - width);
    this.camX = lerp(this.camX, target, 0.12);

    // bump into a container to open it
    const hw = hgt * 0.035;
    const top = H.y - hgt * 0.19;
    for (const c of this.conts) {
      if (c.opened) continue;
      if (H.x + hw > c.x - c.w / 2 && H.x - hw < c.x + c.w / 2 && H.y > c.y - c.h && top < c.y) this.open(c);
    }

    // items flying out
    for (const it of this.items) {
      const t = millis() - it.t0;
      if (it.kind === "snack" && t > 1300 && !this.found[it.i]) {
        this.found[it.i] = true;
        if (this.found.every((f) => f) && !this.doneAt) {
          this.doneAt = millis();
          this.say("ALL TEN FOUND! The family is impressed. Mostly.");
        }
      }
    }
    this.items = this.items.filter((it) => millis() - it.t0 < 1400);
  },

  open(c) {
    c.opened = true;
    c.t0 = millis();
    if (c.snack !== undefined) {
      this.items.push({ kind: "snack", i: c.snack, x: c.x, y: c.y - c.h, t0: millis() });
      this.say(SNACKS[c.snack].line);
    } else {
      this.items.push({ kind: "decoy", d: c.decoy, x: c.x, y: c.y - c.h, t0: millis() });
      this.say(DECOYS[c.decoy].line);
    }
  },

  prompt() {
    if (this.doneAt) return "mission complete! next › for the family photo";
    return phoneConnected()
      ? "tilt your phone to run · flick or tap JUMP to jump · bump into tins to open them"
      : "point left or right of yourself to run · open your palm to jump · bump into tins";
  },

  slotPos(i) {
    const s = L.s;
    return { x: 30 * s + 26 * s + i * 54 * s, y: 128 * s };
  },

  drawWorld() {
    if (!this.built) return;
    const hgt = height;
    const cx = this.camX;
    // the kitchen fills the whole screen (the mirror steps aside)
    image(this.bg, 0, 0, width, height, cx, 0, width, height);

    // maroon pelmet behind the title and the snack slots
    noStroke();
    fill(PAL.wall);
    rect(0, 0, width, 160 * L.s);
    for (let x = 10; x < width; x += 26) mangoLeafLive(x, 160 * L.s);

    push();
    translate(-cx, 0);
    // containers
    for (const c of this.conts) {
      if (c.x + c.w < cx - 50 || c.x - c.w > cx + width + 50) continue;
      const sp = this.sprites[c.type];
      image(sp.body, c.x - c.w / 2, c.y - c.h, c.w, c.h);
      if (c.opened) {
        const t = constrain((millis() - c.t0) / 400, 0, 1);
        push();
        translate(c.x + t * c.w * 0.45, c.y - c.h - t * c.h * 0.3);
        rotate(t * 0.9);
        image(sp.lid, -c.w / 2, 0, c.w, c.h);
        pop();
      } else {
        image(sp.lid, c.x - c.w / 2, c.y - c.h, c.w, c.h);
        // a little sparkle so people know to check it
        if (Math.sin(millis() * 0.004 + c.x) > 0.85) {
          noStroke();
          fill(255, 250, 220, 220);
          ellipse(c.x + c.w * 0.3, c.y - c.h * 0.9, 6, 6);
        }
      }
    }
    this.drawHero();
    pop();

    // things popping out of containers
    for (const it of this.items) {
      const t = (millis() - it.t0) / 1000;
      const sx = it.x - cx;
      const rise = Math.min(t / 0.6, 1);
      let x = sx;
      let y = it.y - (1 - Math.pow(1 - rise, 3)) * hgt * 0.14;
      let size = lerp(0.04, 0.15, rise) * hgt;
      let alpha = 255;
      if (t > 0.7) {
        const f = constrain((t - 0.7) / 0.6, 0, 1);
        if (it.kind === "snack") {
          const slot = this.slotPos(it.i);
          x = lerp(sx, slot.x, f);
          y = lerp(y, slot.y, f);
          size = lerp(size, 44 * L.s, f);
        } else {
          y += f * hgt * 0.1;
          alpha = 255 * (1 - f);
        }
      }
      const img = it.kind === "snack" ? USER_IMG[SNACKS[it.i].file] : this.decoyArt[DECOYS[it.d].item];
      if (img) {
        tint(255, alpha);
        fitImage(img, x, y, size);
        noTint();
      }
    }

    // speech bubble over your head
    if (millis() - this.lineAt < 2600) {
      const H = this.hero;
      bubble(this.line, constrain(H.x - cx, 200 * L.s, width - 200 * L.s), H.y - hgt * 0.24, 420 * L.s, 19, false);
    }
  },

  drawHero() {
    const H = this.hero;
    const hgt = height;
    const O = ART.outfits[look.outfit >= 0 ? look.outfit : 0];
    const bob = H.ground && Math.abs(H.vx) > 0.01 ? Math.abs(Math.sin(H.step)) * hgt * 0.008 : 0;
    // body = the outfit you picked
    const bh = hgt * 0.13;
    let bw = (bh * O.img.width) / O.img.height;
    if (bw > hgt * 0.12) bw = hgt * 0.12;
    const bodyTop = H.y - bh - hgt * 0.012 - bob;
    // feet
    noStroke();
    fill("#5a3a2a");
    const sw = H.ground ? Math.sin(H.step) * hgt * 0.01 : 0;
    ellipse(H.x - hgt * 0.012 + sw, H.y - hgt * 0.006, hgt * 0.02, hgt * 0.012);
    ellipse(H.x + hgt * 0.012 - sw, H.y - hgt * 0.006, hgt * 0.02, hgt * 0.012);
    push();
    translate(H.x, bodyTop);
    if (H.face < 0) scale(-1, 1);
    imageMode(CORNER);
    const k = Math.min(bw / O.img.width, bh / O.img.height);
    image(O.img, -O.img.width * k * O.cx, 0, O.img.width * k, O.img.height * k);
    pop();
    // head = your live face
    const r = hgt * 0.04;
    drawFaceHead(H.x, bodyTop - r * 0.85, r);
  },

  drawUI() {
    const s = L.s;
    // snack slots under the title
    for (let i = 0; i < SNACKS.length; i++) {
      const p = this.slotPos(i);
      push();
      fill(this.found[i] ? PAL.goldLight : "rgba(255,243,224,0.18)");
      stroke(PAL.ink);
      strokeWeight(2);
      ellipse(p.x, p.y, 48 * s, 48 * s);
      pop();
      const img = USER_IMG[SNACKS[i].file];
      if (img && this.found[i]) fitImage(img, p.x, p.y, 42 * s);
      else {
        push();
        noStroke();
        fill(255, 243, 224, 120);
        uiFont(18 * s);
        textAlign(CENTER, CENTER);
        text("?", p.x, p.y);
        pop();
      }
    }
    const n = this.found.filter((f) => f).length;
    const secs = Math.floor(((this.doneAt || millis()) - this.startAt) / 1000);
    push();
    noStroke();
    fill(PAL.cream);
    uiFont(18 * s);
    textAlign(LEFT, CENTER);
    const lx = this.slotPos(SNACKS.length - 1).x + 40 * s;
    text(n + " / " + SNACKS.length + " snacks  ·  " + Math.floor(secs / 60) + ":" + nf(secs % 60, 2), lx, 128 * s);
    pop();
    if (this.doneAt) {
      push();
      const bw = 640 * s;
      const bx = width / 2 - bw / 2;
      const by = height * 0.3;
      fill(PAL.wall);
      stroke(PAL.ink);
      strokeWeight(4);
      rect(bx, by, bw, 190 * s, 24);
      noStroke();
      fill(PAL.haldi);
      uiFont(48 * s, true);
      textAlign(CENTER, TOP);
      text("Mission complete!", width / 2, by + 22 * s);
      fill(PAL.cream);
      uiFont(22 * s);
      text("All ten snacks in " + Math.floor(secs / 60) + ":" + nf(secs % 60, 2) + ". Paati is impressed. Mostly.", width / 2, by + 96 * s);
      text("Point at next ›, or tap next on your phone, for the family photo.", width / 2, by + 132 * s);
      pop();
    }
  },

  key(k, code) {
    if (k === " " || code === UP_ARROW) this.jump();
    if ((k === "r" || k === "R") && this.doneAt) this.reset();
  },
};

// your face from the webcam, cut into a circle, used as the character's head
function drawFaceHead(cx, cy, r) {
  const F = faceInfo();
  push();
  if (F && videoReady()) {
    const k = (2 * r) / (F.w * 1.2);
    const c = F.centre;
    const ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TWO_PI);
    ctx.clip();
    translate(cx - c.x * k + VW() * k, cy - c.y * k);
    scale(-1, 1); // mirrored, like the mirror
    image(video, 0, 0, VW() * k, VH() * k);
    ctx.restore();
  } else {
    // no face in view: a cartoon head stands in
    noStroke();
    fill("#1d1414");
    ellipse(cx, cy - r * 0.9, r * 1.1, r * 0.8);
    fill(PAL.skin);
    ellipse(cx, cy, r * 2, r * 2);
    fill(PAL.sindoor);
    ellipse(cx, cy - r * 0.35, r * 0.22, r * 0.22);
    fill(PAL.ink);
    ellipse(cx - r * 0.35, cy + r * 0.05, r * 0.16, r * 0.2);
    ellipse(cx + r * 0.35, cy + r * 0.05, r * 0.16, r * 0.2);
  }
  pop();
  noFill();
  stroke(PAL.ink);
  strokeWeight(4);
  ellipse(cx, cy, r * 2 + 4, r * 2 + 4);
  stroke(PAL.gold);
  strokeWeight(2.5);
  ellipse(cx, cy, r * 2, r * 2);
}

// a small mango leaf drawn live (for the pelmet)
function mangoLeafLive(x, y) {
  push();
  translate(x, y);
  rotate(HALF_PI + Math.sin(x) * 0.25);
  noStroke();
  fill(PAL.leaf);
  beginShape();
  vertex(0, 0);
  vertex(8, -5);
  vertex(22, 0);
  vertex(8, 5);
  endShape(CLOSE);
  pop();
}

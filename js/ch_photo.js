/* Chapter 5 · Photo
   Hold up both hands (or click "take photos") and a 3-2-1 countdown takes
   three shots of the mirror, then makes a photo strip you can download.
*/

const Photo = {
  name: "Photo",
  usesPointer: true,
  state: "ready",
  shots: [],
  strip: null,
  t0: 0,
  handsSince: -1,
  flashAt: -9999,
  wantsCapture: false,

  enter() {
    this.state = "ready";
    this.shots = [];
    this.strip = null;
    this.handsSince = -1;
  },

  start() {
    if (this.state === "countdown" || this.state === "shooting") return;
    this.state = "countdown";
    this.shots = [];
    this.strip = null;
    this.t0 = millis();
  },

  update() {
    const now = millis();
    if (this.state === "ready" || this.state === "done") {
      if (TRACK.hands.length >= 2) {
        if (this.handsSince < 0) this.handsSince = now;
        if (now - this.handsSince > 900 && this.state === "ready") this.start();
      } else this.handsSince = -1;
    }
    if (this.state === "countdown" && now - this.t0 > 3000) {
      this.state = "shooting";
      this.t0 = now;
      this.wantsCapture = true;
    }
    if (this.state === "shooting" && !this.wantsCapture && now - this.t0 > 1300) {
      if (this.shots.length < 3) {
        this.t0 = now;
        this.wantsCapture = true;
      } else {
        this.state = "done";
        this.strip = makeStrip(this.shots);
      }
    }
  },

  // called by main.js after the mirror, frame and table are drawn,
  // but before any buttons, so the photo is clean
  capture() {
    this.wantsCapture = false;
    const M = L.mirror;
    const fw = L.frameW;
    const x = Math.max(0, M.x - fw);
    const y = Math.max(0, M.y - fw - 30 * L.s);
    this.shots.push(get(x, y, M.w + fw * 2, L.tableTop - y));
    this.flashAt = millis();
  },

  prompt() {
    if (this.state === "done") return "your strip is ready · download it or go again";
    if (this.state === "ready") return "strike a pose · hold up both hands to start";
    return "smile!";
  },

  drawWorld() {
    const M = L.mirror;
    if (this.state === "countdown") {
      const n = 3 - Math.floor((millis() - this.t0) / 1000);
      push();
      uiFont(160 * L.s, true);
      textAlign(CENTER, CENTER);
      fill(255, 255, 255, 230);
      stroke(PAL.ink);
      strokeWeight(6);
      text(Math.max(1, n), M.x + M.w / 2, M.y + M.h * 0.45);
      pop();
    }
    const f = constrain(1 - (millis() - this.flashAt) / 350, 0, 1);
    if (f > 0) {
      noStroke();
      fill(255, 255, 255, 230 * f);
      rect(0, 0, width, height);
    }
  },

  drawUI() {
    const P = L.left;
    const R = L.right;
    const s = L.s;
    push();
    uiFont(26, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Family photo!", P.x + 10, P.y + 6);
    uiFont(16);
    fill(255, 220, 230);
    text("Hold up both hands for a moment,", P.x + 10, P.y + 50);
    text("or press the button.", P.x + 10, P.y + 74);
    pop();
    if (this.state === "ready" || this.state === "done")
      uiPill("shoot", P.x + 10, P.y + 112, 190 * s + 20, 48, "take photos", () => this.start(), { fill: PAL.goldLight });
    if (this.strip) {
      const h = Math.min(R.h - 70 * s, 520 * s);
      const w = (h * this.strip.width) / this.strip.height;
      push();
      translate(R.x + R.w / 2, R.y + h / 2);
      rotate(0.04);
      noStroke();
      fill(0, 0, 0, 70);
      rect(-w / 2 + 6, -h / 2 + 8, w, h);
      image(this.strip, -w / 2, -h / 2, w, h);
      pop();
      uiPill("save", R.x + R.w / 2 - 75 * s, R.y + h + 14 * s, 150 * s, 44 * s, "download", () => saveCanvas(this.strip, "desi-mirror-strip", "png"), {
        fill: PAL.goldLight,
      });
    }
  },

  key(k) {
    if (k === " ") this.start();
    if ((k === "s" || k === "S") && this.strip) saveCanvas(this.strip, "desi-mirror-strip", "png");
  },
};

function makeStrip(shots) {
  const pw = 300;
  const ph = Math.round((pw * shots[0].height) / shots[0].width);
  const pad = 22;
  const head = 70;
  const foot = 70;
  const g = createGraphics(pw + pad * 2, head + shots.length * (ph + pad) + foot);
  g.pixelDensity(2);
  g.background(PAL.maroon);
  g.noStroke();
  // marigold border
  for (let x = 8; x < g.width; x += 22) {
    marigold(g, x, 10, 9, PAL.marigold);
    marigold(g, x, g.height - 10, 9, PAL.haldi);
  }
  g.fill(PAL.goldLight);
  g.textAlign(CENTER, CENTER);
  g.textFont("Rozha One");
  g.textSize(34);
  g.text("Desi Mirror", g.width / 2, head / 2 + 8);
  shots.forEach((img, i) => {
    const y = head + i * (ph + pad);
    g.fill(PAL.cream);
    g.rect(pad - 5, y - 5, pw + 10, ph + 10);
    g.image(img, pad, y, pw, ph);
  });
  g.fill(PAL.cream);
  g.textFont("Baloo 2");
  g.textSize(16);
  const d = new Date();
  g.textFont("Baloo Thambi 2");
  g.text("देसी கண்ணாடி  ·  " + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear(), g.width / 2, g.height - foot / 2 - 4);
  return g;
}

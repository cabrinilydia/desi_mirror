/* Chapter 3 · Outfit
   Your phone is the wardrobe remote:
     tilt left / right  -> flip through outfits on the rail
     flick it down      -> toss the outfit onto the floor pile
     tap "wear"         -> it lands on you in the mirror, paper-doll style
   No phone? Arrow keys: ← → browse, ↓ toss, ↑ wear.
*/

const Outfit = {
  name: "Outfit",
  usesPointer: true,
  rail: [],
  cur: 0,
  slide: 0,
  swing: 0,
  swingV: 0,
  pile: [],
  flying: [],
  message: "",
  messageAt: -9999,
  emptyAt: -1,

  init() {
    this.rail = ART.outfits.map((_, i) => i);
  },

  enter() {
    sendState();
  },

  current() {
    return this.rail.length ? this.rail[this.cur % this.rail.length] : -1;
  },

  hangerPos() {
    const R = L.right;
    return { x: R.x + R.w * 0.5, y: R.y + 70 * L.s };
  },

  say(m) {
    this.message = m;
    this.messageAt = millis();
  },

  action(a) {
    if (a === "next" || a === "prev") {
      if (!this.rail.length) return;
      const d = a === "next" ? 1 : -1;
      this.cur = (this.cur + d + this.rail.length) % this.rail.length;
      this.slide = d;
      this.swingV += d * 0.12;
    } else if (a === "toss") {
      if (!this.rail.length) return;
      const idx = this.current();
      const h = this.hangerPos();
      const pileTop = this.pileSpot();
      this.flying.push({ idx, kind: "toss", t: 0, from: { x: h.x, y: h.y + 120 * L.s }, to: pileTop, rot0: 0, rot1: random(-1.4, 1.4) });
      this.rail.splice(this.cur % this.rail.length, 1);
      if (this.cur >= this.rail.length) this.cur = 0;
      this.say(random(["Nope.", "Not this one.", "Ew, no.", "Wore it last Diwali.", "Too much.", "Too little."]));
      if (!this.rail.length) this.emptyAt = millis();
    } else if (a === "wear") {
      const idx = this.current();
      if (idx < 0) return;
      const h = this.hangerPos();
      const F = faceInfo();
      const to = F ? vm(fk(152)) : { x: L.mirror.x + L.mirror.w / 2, y: L.mirror.y + L.mirror.h * 0.75 };
      this.flying.push({ idx, kind: "wear", t: 0, from: { x: h.x, y: h.y + 120 * L.s }, to, rot0: 0, rot1: 0 });
      this.say("Wearing: " + OUTFIT_NAMES[idx]);
    }
    sendState();
  },

  pileSpot() {
    const R = L.right;
    const n = this.pile.length;
    return { x: R.x + R.w * 0.3 + random(-R.w * 0.18, R.w * 0.18), y: height - 60 * L.s - Math.min(n, 8) * 8 * L.s };
  },

  update() {
    this.slide *= 0.82;
    const target = REMOTE.enabled && phoneConnected() ? constrain(REMOTE.tilt / 60, -0.6, 0.6) : 0;
    this.swingV += (target - this.swing) * 0.02 + Math.sin(frameCount * 0.03) * 0.0015;
    this.swingV *= 0.94;
    this.swing += this.swingV;
    for (const f of this.flying) f.t = Math.min(1, f.t + dt() / 550);
    for (const f of this.flying.filter((f) => f.t >= 1)) {
      if (f.kind === "toss") this.pile.push({ idx: f.idx, x: f.to.x, y: f.to.y, rot: f.rot1 });
      else look.outfit = f.idx;
    }
    this.flying = this.flying.filter((f) => f.t < 1);
    if (this.emptyAt > 0 && millis() - this.emptyAt > 2600) {
      this.rail = ART.outfits.map((_, i) => i);
      this.cur = 0;
      this.emptyAt = -1;
      this.say("Fine. Back on the rail.");
    }
  },

  prompt() {
    return REMOTE.enabled
      ? "tilt your phone to browse · flick it down to toss · tap wear"
      : "← → browse · ↓ toss it on the floor · ↑ wear it";
  },

  drawWorld() {
    const s = L.s;
    // the floor pile (over the front of the table, it's the floor)
    for (const p of this.pile) drawOutfitThumb(p.idx, p.x, p.y, 120 * s, p.rot);
    // flying outfits
    for (const f of this.flying) {
      const e = 1 - Math.pow(1 - f.t, 3);
      const x = lerp(f.from.x, f.to.x, e);
      const y = lerp(f.from.y, f.to.y, e) - Math.sin(f.t * PI) * 80 * s;
      const sz = f.kind === "wear" ? lerp(170, 120, e) * s : lerp(170, 120, e) * s;
      drawOutfitThumb(f.idx, x, y, sz, lerp(f.rot0, f.rot1, e) + (f.kind === "toss" ? f.t * 4 : 0));
    }
  },

  drawUI() {
    const R = L.right;
    const s = L.s;
    const h = this.hangerPos();
    push();
    // rail
    stroke(PAL.ink);
    strokeWeight(9);
    line(R.x + 10, R.y + 30 * s, R.x + R.w - 10, R.y + 30 * s);
    stroke(PAL.gold);
    strokeWeight(6);
    line(R.x + 10, R.y + 30 * s, R.x + R.w - 10, R.y + 30 * s);
    pop();

    const idx = this.current();
    if (idx >= 0) {
      push();
      translate(h.x + this.slide * 120 * s, R.y + 30 * s);
      rotate(this.swing);
      // hanger
      noFill();
      stroke(PAL.ink);
      strokeWeight(4);
      arc(0, 10 * s, 18 * s, 18 * s, PI, TWO_PI + HALF_PI);
      line(0, 18 * s, -70 * s, 46 * s);
      line(0, 18 * s, 70 * s, 46 * s);
      line(-70 * s, 46 * s, 70 * s, 46 * s);
      const img = ART.outfits[idx];
      const w = 210 * s;
      const hh = (w * img.height) / img.width;
      image(img, -w / 2, 34 * s, w, hh);
      pop();
      push();
      uiFont(20, true);
      fill(PAL.cream);
      noStroke();
      textAlign(CENTER, TOP);
      text(OUTFIT_NAMES[idx] + "   (" + ((this.cur % this.rail.length) + 1) + "/" + this.rail.length + ")", h.x, R.y + 4 * s - 28 * s);
      pop();
    } else {
      push();
      uiFont(30, true);
      fill(PAL.haldi);
      noStroke();
      textAlign(CENTER, CENTER);
      text("NOTHING\nTO WEAR!!", h.x, R.y + 160 * s);
      pop();
    }

    // buttons
    const by = R.y + R.h - 62 * s;
    const bw = Math.min(90 * s, R.w / 4.6);
    uiPill("prev", R.x + 4, by, bw, 44 * s, "◀", () => this.action("prev"));
    uiPill("toss", R.x + 4 + bw + 8, by, bw, 44 * s, "toss", () => this.action("toss"));
    uiPill("wear", R.x + 4 + (bw + 8) * 2, by, bw, 44 * s, "wear", () => this.action("wear"), { fill: PAL.goldLight });
    uiPill("next", R.x + 4 + (bw + 8) * 3, by, bw, 44 * s, "▶", () => this.action("next"));

    // message
    if (millis() - this.messageAt < 1800) bubble(this.message, h.x, R.y + 18 * s, R.w * 0.8, 18, false);

    // phone pairing card on the left
    const P = L.left;
    push();
    uiFont(24, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Wardrobe remote", P.x + 10, P.y + 6);
    uiFont(15);
    fill(255, 220, 230);
    if (REMOTE.enabled && REMOTE.qr) {
      const q = Math.min(P.w - 30, 190 * s);
      image(REMOTE.qr, P.x + 10, P.y + 50, q, q);
      text("scan with your phone camera", P.x + 10, P.y + 58 + q);
      text("room " + REMOTE.room + (phoneConnected() ? "  ·  phone connected ✓" : "  ·  waiting for phone"), P.x + 10, P.y + 82 + q);
    } else {
      const lines = ["Phone remote is off (no Firebase config).", "Use the arrow keys:", "←  →   browse", "↓   toss it on the floor", "↑   wear it"];
      lines.forEach((l, i) => text(l, P.x + 10, P.y + 50 + i * 26));
    }
    pop();
  },

  key(k, code) {
    if (code === LEFT_ARROW) this.action("prev");
    if (code === RIGHT_ARROW) this.action("next");
    if (code === DOWN_ARROW) this.action("toss");
    if (code === UP_ARROW || code === ENTER) this.action("wear");
  },
};

function drawOutfitThumb(idx, x, y, w, rot) {
  const img = ART.outfits[idx];
  const h = (w * img.height) / img.width;
  push();
  translate(x, y);
  rotate(rot);
  image(img, -w / 2, -h / 2, w, h);
  pop();
}

function sendState() {
  const idx = Outfit.current();
  remoteState({ outfit: idx >= 0 ? OUTFIT_NAMES[idx] : "nothing left!", wearing: look.outfit >= 0 ? OUTFIT_NAMES[look.outfit] : "", chapter: CH[chapter].name });
}

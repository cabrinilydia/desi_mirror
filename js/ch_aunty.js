/* Chapter 4 · Aunty
   An aunty pops up next to the mirror with opinions, then starts throwing
   chappals at your reflection. Move your head to dodge.
   (No face found? Your mouse stands in for your head.)
*/

const AUNTY_LINES = [
  "Beta, when is the wedding?",
  "Sharma ji's daughter is a doctor, you know.",
  "Engineering? Or still drawing pictures?",
  "Why didn't you come for Diwali?",
  "You don't call your aunty anymore.",
  "I'm only saying it for your own good.",
  "In my time we were married by 21.",
  "Come, come. Touch my feet first.",
  "Who is that boy in your Instagram?",
];
const AUNTY_HIT = ["THAPAK!", "DHISHOOM!", "PATAK!", "DHAP!"];
const AUNTY_ON_HIT = ["Serves you right!", "Next time pick up my call.", "Aiyo, sit straight!", "That's for skipping Diwali."];
const ROUND_MS = 30000; // *** game length

const Aunty = {
  name: "Aunty",
  usesPointer: false,
  state: "intro",
  t0: 0,
  chappals: [],
  landed: [],
  bursts: [],
  thrown: 0,
  hits: 0,
  nextThrow: 0,
  line: "",
  lineAt: 0,
  slideIn: 0,
  throwPose: 0,

  enter() {
    this.state = "intro";
    this.t0 = millis();
    this.chappals = [];
    this.bursts = [];
    this.thrown = 0;
    this.hits = 0;
    this.slideIn = 0;
    this.say(this.openingLine());
  },

  openingLine() {
    if (look.outfit === 5) return "A NIGHTIE?! To a function?!";
    if (look.bindi < 0) return "Beta! Where is your bindi?";
    if (look.lips === 3) return "So much red lipstick. For whom?";
    return "Beta! There you are!";
  },

  say(t) {
    this.line = t;
    this.lineAt = millis();
  },

  pos() {
    const R = L.right;
    const h = Math.min(R.h * 0.95, 420 * L.s);
    const w = (h * 320) / 400;
    const e = 1 - Math.pow(1 - this.slideIn, 3);
    const x = lerp(width + 20, R.x + R.w * 0.5 - w / 2, e);
    return { x, y: L.tableTop - h * 0.88, w, h };
  },

  handPos() {
    const a = this.pos();
    return { x: a.x + a.w * 0.88, y: a.y + a.h * 0.26 };
  },

  // where your head is on screen (face, or the mouse as a fallback)
  head() {
    const F = faceInfo();
    if (F) {
      const c = vm(F.centre);
      return { x: c.x, y: c.y, r: F.w * L.vs * 0.55, real: true };
    }
    return { x: mouseX, y: mouseY, r: 60 * L.s, real: false };
  },

  update() {
    this.slideIn = Math.min(1, this.slideIn + dt() / 700);
    this.throwPose = Math.max(0, this.throwPose - dt() / 400);
    const now = millis();
    if (this.state === "intro" && now - this.t0 > 2600) {
      this.state = "play";
      this.t0 = now;
      this.nextThrow = now + 600;
      this.say("Now see what happens!");
    }
    if (this.state === "play") {
      const e = constrain((now - this.t0) / ROUND_MS, 0, 1);
      if (now > this.nextThrow) {
        this.throwChappal(e);
        this.nextThrow = now + lerp(1700, 700, e) * random(0.8, 1.2); // *** throw rate
      }
      if (now - this.lineAt > 3500) this.say(random(AUNTY_LINES));
      if (now - this.t0 > ROUND_MS && !this.chappals.length) {
        this.state = "end";
        this.say(this.verdict());
      }
    }
    // fly
    const H = this.head();
    for (const c of this.chappals) {
      c.t += c.speed * dt();
      const p = this.chappalAt(c);
      c.x = p.x;
      c.y = p.y;
      c.rot += c.spin * (dt() / 16.7);
      if (!c.done && c.t >= 1) {
        c.done = true;
        if (Math.hypot(H.x - c.x, H.y - c.y) < H.r) {
          this.hits++;
          this.bursts.push({ x: c.x, y: c.y, t: millis(), txt: random(AUNTY_HIT) });
          shakeUntil = millis() + 280;
          this.say(random(AUNTY_ON_HIT));
          c.vx = random(-3, 3);
          c.vy = -4;
        } else {
          c.vx = (c.x - c.fromX) * 0.02;
          c.vy = 2;
        }
      }
    }
    for (const c of this.chappals.filter((c) => c.done)) {
      c.free = true;
    }
    for (const c of this.chappals) {
      if (!c.free) continue;
      const k = dt() / 16.7;
      c.vy += 0.5 * k;
      c.fx = (c.fx === undefined ? c.x : c.fx) + c.vx * k;
      c.fy = (c.fy === undefined ? c.y : c.fy) + c.vy * k;
      c.x = c.fx;
      c.y = c.fy;
      if (c.y > L.tableTop + 20 * L.s) {
        this.landed.push({ x: c.x, y: L.tableTop + random(10, 50) * L.s, rot: c.rot });
        c.gone = true;
      }
    }
    this.chappals = this.chappals.filter((c) => !c.gone && c.y < height + 100);
    if (this.landed.length > 14) this.landed.shift();
    this.bursts = this.bursts.filter((b) => millis() - b.t < 900);
  },

  chappalAt(c) {
    const t = Math.min(c.t, 1);
    return {
      x: lerp(c.fromX, c.toX, t),
      y: lerp(c.fromY, c.toY, t) - Math.sin(t * PI) * c.arc,
    };
  },

  throwChappal(e) {
    const from = this.handPos();
    const H = this.head();
    const aimMiss = random() < 0.15 ? random(-1, 1) * H.r * 1.5 : 0;
    this.chappals.push({
      fromX: from.x,
      fromY: from.y,
      toX: H.x + aimMiss,
      toY: H.y + random(-H.r * 0.3, H.r * 0.3),
      t: 0,
      speed: 1 / (lerp(1100, 600, e) * random(0.9, 1.1)), // *** ms in the air
      arc: random(60, 140) * L.s,
      rot: 0,
      spin: random(0.15, 0.32) * (random() < 0.5 ? -1 : 1),
      x: from.x,
      y: from.y,
    });
    this.thrown++;
    this.throwPose = 1;
  },

  verdict() {
    const dodged = this.thrown - this.hits;
    if (this.hits === 0) return "Hmph. Fine. You can come to the wedding.";
    if (dodged >= this.thrown * 0.7) return "Not bad, beta. Not bad. Now get married.";
    if (dodged >= this.thrown * 0.4) return "Your reflexes are like your marks. Average.";
    return "Aunty wins. Go and change your outfit.";
  },

  prompt() {
    if (this.state === "end") return "round over · press R or point at 'again'";
    return this.head().real ? "dodge the chappals · move your head!" : "no face found · your mouse is your head";
  },

  drawBehind() {
    const a = this.pos();
    const img = this.throwPose > 0.2 ? ART.auntyThrow : ART.aunty;
    image(img, a.x, a.y, a.w, a.h);
  },

  drawWorld() {
    const s = L.s;
    for (const c of this.landed) drawChappal(c.x, c.y, 90 * s, c.rot);
    for (const c of this.chappals) drawChappal(c.x, c.y, 110 * s, c.rot);
    for (const b of this.bursts) {
      const t = (millis() - b.t) / 900;
      push();
      translate(b.x, b.y);
      scale(0.6 + Math.min(t * 3, 1) * 0.7);
      rotate(-0.15);
      fill(PAL.haldi);
      stroke(PAL.ink);
      strokeWeight(3);
      beginShape();
      for (let k = 0; k < 16; k++) {
        const r = (k % 2 ? 46 : 78) * s;
        const ang = (k / 16) * TWO_PI;
        vertex(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      endShape(CLOSE);
      uiFont(30 * s, true);
      fill(PAL.sindoor);
      strokeWeight(2);
      textAlign(CENTER, CENTER);
      text(b.txt, 0, 0);
      pop();
    }
    const a = this.pos();
    if (this.line && this.slideIn > 0.5) bubble(this.line, a.x + a.w * 0.4, a.y - 6, Math.min(L.right.w, 260 * s), 17, "left");
  },

  drawUI() {
    const P = L.left;
    const s = L.s;
    push();
    uiFont(26, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Aunty has arrived.", P.x + 10, P.y + 6);
    uiFont(18);
    fill(255, 220, 230);
    const left = this.state === "play" ? Math.max(0, Math.ceil((ROUND_MS - (millis() - this.t0)) / 1000)) : this.state === "intro" ? 30 : 0;
    text("time  " + left + "s", P.x + 10, P.y + 56);
    text("chappals thrown  " + this.thrown, P.x + 10, P.y + 84);
    text("hit you  " + this.hits, P.x + 10, P.y + 112);
    fill(PAL.haldi);
    uiFont(28, true);
    text("dodged  " + (this.thrown - this.hits), P.x + 10, P.y + 146);
    pop();
    if (this.state === "end") uiPill("again", P.x + 10, P.y + 200, 140 * s + 20, 46, "again", () => this.enter(), { fill: PAL.goldLight });
  },

  key(k) {
    if (k === "r" || k === "R") this.enter();
  },
};

function drawChappal(x, y, w, rot) {
  const img = ART.chappal;
  const h = (w * img.height) / img.width;
  push();
  translate(x, y);
  rotate(rot);
  image(img, -w / 2, -h / 2, w, h);
  pop();
}

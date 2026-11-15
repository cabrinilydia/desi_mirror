/* Chapter 1 · Steam
   The mirror is fogged up after a hot shower. Breathe into the laptop mic
   and it fogs up around your mouth. Wipe it with an open hand, or write
   in it with one finger. Wiped lines leave little drips running down.
*/

const Steam = {
  name: "Steam",
  usesPointer: true, // so you can point at next › when you're done
  fog: null,
  fogAlpha: 1,
  breath: 0,
  mic: { ok: false, an: null, buf: null, floor: 0.01, tried: false },
  last: {},
  drips: [],
  mouseLast: null,

  init() {
    this.makeFog();
  },

  makeFog() {
    const M = L.mirror;
    this.fw = Math.ceil(M.w / 2);
    this.fh = Math.ceil(M.h / 2);
    this.fog = createGraphics(this.fw, this.fh);
    this.fog.pixelDensity(1);
    this.refog(1);
  },

  resize() {
    this.makeFog();
  },

  refog(a) {
    const g = this.fog;
    g.noStroke();
    g.fill(214, 224, 228, 235 * a);
    g.rect(0, 0, this.fw, this.fh);
    for (let i = 0; i < 260 * a; i++) {
      g.fill(255, 255, 255, random(8, 26));
      const r = random(8, 46);
      g.ellipse(random(this.fw), random(this.fh), r, r);
    }
  },

  enter() {
    this.fogAlpha = 1;
    this.refog(1);
    this.drips = [];
    this.last = {};
  },

  async startMic() {
    if (this.mic.tried) return;
    this.mic.tried = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      this.mic.an = an;
      this.mic.ctx = ctx;
      this.mic.buf = new Float32Array(an.fftSize);
      this.mic.ok = true;
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {
      console.warn("[steam] no mic:", e.message, "(hold B to breathe instead)");
    }
  },

  readMic() {
    if (!this.mic.ok) return 0;
    this.mic.an.getFloatTimeDomainData(this.mic.buf);
    let s = 0;
    for (const v of this.mic.buf) s += v * v;
    const rms = Math.sqrt(s / this.mic.buf.length);
    // the floor adapts to the room's background noise
    const m = this.mic;
    m.floor = rms < m.floor ? lerp(m.floor, rms, 0.05) : lerp(m.floor, rms, 0.002);
    return constrain((rms - m.floor * 1.8 - 0.004) / 0.06, 0, 1); // *** breath sensitivity
  },

  toLocal(p) {
    const M = L.mirror;
    return { x: ((p.x - M.x) * this.fw) / M.w, y: ((p.y - M.y) * this.fh) / M.h };
  },

  wipe(key, p, r) {
    const q = this.toLocal(p);
    const prev = this.last[key];
    const g = this.fog;
    g.erase();
    g.stroke(255);
    g.strokeWeight(r * 2);
    if (prev && Math.hypot(prev.x - q.x, prev.y - q.y) < 80) g.line(prev.x, prev.y, q.x, q.y);
    else g.point(q.x, q.y);
    g.noErase();
    this.last[key] = q;
    if (random() < 0.04 && this.drips.length < 40) this.drips.push({ x: q.x + random(-r, r), y: q.y + r, left: random(20, 70) });
  },

  update() {
    const b = Math.max(this.readMic(), keyIsDown(66) ? 1 : 0); // B key = breathe
    this.breath = lerp(this.breath, b, 0.2);

    // breath fogs the glass around your mouth
    if (this.breath > 0.06) {
      const g = this.fog;
      let c = { x: this.fw / 2, y: this.fh * 0.62 };
      if (TRACK.face) c = this.toLocal(vm(fk(13)));
      g.noStroke();
      for (let k = 0; k < 6; k++) {
        const r = (30 + 90 * this.breath) * random(0.5, 1.2);
        g.fill(220, 229, 233, 46 * this.breath);
        g.ellipse(c.x + random(-30, 30) * this.breath, c.y + random(-20, 20) * this.breath, r * 1.4, r);
      }
      g.fill(214, 224, 228, 5 * this.breath);
      g.rect(0, 0, this.fw, this.fh);
    }

    // hands wipe: open palm = big wipe, one finger = writing
    const seen = {};
    TRACK.hands.forEach((h, i) => {
      const palm = isOpenPalm(h);
      const p = vm(palm ? h.kp[9] : h.kp[8]);
      const r = palm ? handSize(h) * L.vs * 0.35 : 9;
      this.wipe("h" + i, { x: p.x, y: p.y }, r / 2);
      seen["h" + i] = true;
    });
    for (const k of Object.keys(this.last)) if (k !== "mouse" && !seen[k]) delete this.last[k];

    // mouse drag also writes
    if (mouseIsPressed && insideMirror(mouseX, mouseY)) this.wipe("mouse", { x: mouseX, y: mouseY }, 6);
    else delete this.last.mouse;

    // drips run down from wiped spots
    const g = this.fog;
    g.erase();
    g.stroke(255);
    g.strokeWeight(2);
    for (const d of this.drips) {
      if (d.left <= 0) continue;
      g.line(d.x, d.y, d.x, d.y + 0.7);
      d.y += 0.7;
      d.left -= 0.7;
    }
    g.noErase();
    this.drips = this.drips.filter((d) => d.left > 0);
  },

  drawGlass() {
    if (chapter !== 0) this.fogAlpha = Math.max(0, this.fogAlpha - dt() / 600);
    if (this.fogAlpha <= 0) return;
    const M = L.mirror;
    push();
    tint(255, 255 * this.fogAlpha);
    image(this.fog, M.x, M.y, M.w, M.h);
    pop();
  },

  prompt() {
    return "breathe on the mirror · wipe it with your palm · write with one finger";
  },

  drawUI() {
    // breath meter on the left panel
    const P = L.left;
    const x = P.x + 10;
    const y = P.y + 30;
    push();
    uiFont(22, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Hot shower, foggy mirror.", x, y);
    uiFont(15);
    fill(255, 220, 230);
    const lines = [
      this.mic.ok ? "Breathe into your laptop mic to fog it up." : "No mic: hold B to breathe.",
      "Open palm wipes. One finger writes.",
      "Write your name before you get ready.",
    ];
    lines.forEach((l, i) => text(l, x, y + 40 + i * 24));
    const by = y + 130;
    text("breath", x, by);
    noFill();
    stroke(PAL.cream);
    strokeWeight(2);
    rect(x, by + 24, 180, 14, 7);
    noStroke();
    fill(PAL.peacockLight);
    rect(x + 2, by + 26, 176 * this.breath, 10, 5);
    pop();
    uiPill("refog", x, by + 60, 150, 40, "fog it again", () => this.refog(1));
  },
};

function insideMirror(x, y) {
  const M = L.mirror;
  return x > M.x && x < M.x + M.w && y > M.y && y < M.y + M.h;
}

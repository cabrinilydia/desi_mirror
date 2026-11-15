/* Chapter 4 · Bindi Flick
   Your phone is a bindi launcher.
     tilt the phone   -> move the crosshair over your reflection
     flick it         -> a bindi flies to the crosshair
   If it lands on your face it STICKS there and moves with you (and shows
   up in the photo strip). Land it between your eyebrows for PERFECT.
   No phone? Move the mouse over the mirror and click (or press space).
*/

const FLICK_LINES = {
  perfect: ["PERFECT! Aunty-approved.", "Bullseye. Nani would cry.", "Exactly where it goes!"],
  close: ["So close. Nobody will notice.", "Close enough for a function.", "Slightly off. Still cute."],
  face: ["Beta, that's your cheek.", "That's... a choice.", "New trend? Okay.", "Bindi on the nose. Bold."],
  miss: ["Missed your whole face!", "It's on the mirror now.", "The bindi has left the chat."],
};

const BindiFlick = {
  name: "Bindi",
  usesPointer: false,
  aim: { x: 0, y: 0 },
  hist: [],
  flying: [],
  missed: [],
  thrown: 0,
  perfect: 0,
  line: "",
  lineAt: -9999,
  nextStyle: 0,

  enter() {
    const M = L.mirror;
    this.aim = { x: M.x + M.w / 2, y: M.y + M.h * 0.4 };
    this.flying = [];
    this.missed = [];
    sendState();
  },

  say(t) {
    this.line = t;
    this.lineAt = millis();
  },

  // where the crosshair should be: phone tilt if a phone is connected,
  // otherwise the mouse when it's over the mirror
  target() {
    const M = L.mirror;
    if (phoneConnected()) {
      return {
        x: M.x + M.w / 2 + constrain(REMOTE.aimX, -1, 1) * M.w * 0.46,
        y: M.y + M.h * 0.42 + constrain(REMOTE.aimY, -1, 1) * M.h * 0.4,
      };
    }
    if (insideMirror(mouseX, mouseY)) return { x: mouseX, y: mouseY };
    return this.aim;
  },

  update() {
    const t = this.target();
    if (phoneConnected()) {
      // smooth the phone's aim, plus a tiny wobble like a hand holding it
      const wob = 3 * Math.sin(millis() * 0.007);
      this.aim.x = lerp(this.aim.x, t.x + wob, 0.3);
      this.aim.y = lerp(this.aim.y, t.y + wob * 0.6, 0.3);
    } else {
      this.aim = { x: t.x, y: t.y }; // the mouse is exact
    }
    this.hist.push({ t: millis(), x: this.aim.x, y: this.aim.y });
    while (this.hist.length && millis() - this.hist[0].t > 600) this.hist.shift();

    for (const f of this.flying) f.t = Math.min(1, f.t + dt() / 420);
    for (const f of this.flying.filter((f) => f.t >= 1)) this.land(f);
    this.flying = this.flying.filter((f) => f.t < 1);

    for (const m of this.missed) {
      m.vy += 0.35 * (dt() / 16.7);
      m.y += m.vy * (dt() / 16.7);
      m.life -= dt() / 1600;
    }
    this.missed = this.missed.filter((m) => m.life > 0);
  },

  action(a) {
    if (a === "toss" || a === "flick") this.flick();
  },

  flick() {
    if (this.flying.length > 2) return;
    // a flick jolts the phone, so aim where the crosshair was a moment before
    let aim = this.aim;
    if (phoneConnected()) {
      for (const h of this.hist) if (millis() - h.t <= 250) {
        aim = h;
        break;
      }
    }
    const M = L.mirror;
    this.flying.push({
      b: this.nextStyle,
      from: { x: M.x + M.w / 2, y: M.y + M.h + 40 * L.s },
      to: { x: aim.x, y: aim.y },
      t: 0,
      spin: random(-6, 6),
    });
    this.nextStyle = (this.nextStyle + 1) % ART.bindis.length;
    this.thrown++;
  },

  land(f) {
    const F = faceInfo();
    if (F) {
      const q = screenToFace(F, f.to.x, f.to.y);
      const d = Math.hypot(q.u, q.v);
      // inside the face oval (roughly) = it sticks
      const onFace = Math.hypot(q.u / 0.5, (q.v - 0.35) / 0.75) < 1;
      if (onFace) {
        look.flicked.push({ b: f.b, u: q.u, v: q.v, rot: random(-0.3, 0.3) });
        if (look.flicked.length > 24) look.flicked.shift();
        if (d < 0.08) { // *** how close counts as PERFECT (in face widths)
          this.perfect++;
          this.say(random(FLICK_LINES.perfect));
          shakeUntil = millis() + 160;
        } else if (d < 0.2) this.say(random(FLICK_LINES.close));
        else this.say(random(FLICK_LINES.face));
        return;
      }
    }
    this.missed.push({ b: f.b, x: f.to.x, y: f.to.y, vy: -2, life: 1 });
    this.say(random(FLICK_LINES.miss));
  },

  prompt() {
    return phoneConnected()
      ? "tilt your phone to aim · flick it to throw a bindi"
      : "aim with the mouse · click or press space to flick a bindi";
  },

  drawWorld() {
    const s = L.s;
    // the ideal spot glows faintly so people know what to aim for
    const F = faceInfo();
    if (F) {
      const o = bindiOrigin();
      noFill();
      stroke(242, 159, 5, 90 + 60 * Math.sin(millis() * 0.006));
      strokeWeight(2);
      ellipse(o.x, o.y, F.w * L.vs * 0.16, F.w * L.vs * 0.16);
    }
    // missed bindis drop away
    imageMode(CENTER);
    for (const m of this.missed) {
      tint(255, 255 * m.life);
      image(ART.bindis[m.b], m.x, m.y, 26 * s, 26 * s);
    }
    noTint();
    // flying bindis: arc in from the bottom of the mirror, shrinking as they go
    for (const f of this.flying) {
      const e = 1 - Math.pow(1 - f.t, 2);
      const x = lerp(f.from.x, f.to.x, e);
      const y = lerp(f.from.y, f.to.y, e) - Math.sin(f.t * PI) * 90 * s;
      const sz = lerp(70, 24, e) * s;
      push();
      translate(x, y);
      rotate(f.spin * f.t);
      image(ART.bindis[f.b], 0, 0, sz, sz);
      pop();
    }
    imageMode(CORNER);
    // crosshair
    const a = this.aim;
    push();
    noFill();
    stroke(PAL.ink);
    strokeWeight(6);
    ellipse(a.x, a.y, 46 * s, 46 * s);
    stroke(PAL.marigold);
    strokeWeight(3);
    ellipse(a.x, a.y, 46 * s, 46 * s);
    line(a.x - 34 * s, a.y, a.x - 14 * s, a.y);
    line(a.x + 14 * s, a.y, a.x + 34 * s, a.y);
    line(a.x, a.y - 34 * s, a.x, a.y - 14 * s);
    line(a.x, a.y + 14 * s, a.x, a.y + 34 * s);
    noStroke();
    fill(PAL.sindoor);
    ellipse(a.x, a.y, 7 * s, 7 * s);
    pop();
    if (millis() - this.lineAt < 1800) bubble(this.line, L.mirror.x + L.mirror.w / 2, L.mirror.y + 70 * s, L.mirror.w * 0.8, 20, false);
  },

  drawUI() {
    const P = L.left;
    const s = L.s;
    push();
    uiFont(26, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Bindi Flick", P.x + 10, P.y + 6);
    uiFont(15);
    fill(255, 220, 230);
    const lines = phoneConnected()
      ? ["Your phone is the launcher.", "Tilt to aim the crosshair.", "Flick the phone to throw.", "Between the brows = PERFECT."]
      : ["No phone? Mouse over the mirror", "to aim, click to throw.", "Between the brows = PERFECT.", "(Scan the QR in Outfit for phone.)"];
    lines.forEach((l, i) => text(l, P.x + 10, P.y + 50 + i * 24));
    uiFont(18);
    text("thrown  " + this.thrown, P.x + 10, P.y + 160);
    text("stuck on you  " + look.flicked.length, P.x + 10, P.y + 186);
    fill(PAL.haldi);
    uiFont(28, true);
    text("perfect  " + this.perfect, P.x + 10, P.y + 216);
    pop();
    // phone not paired yet: show the same QR code as the Outfit chapter
    if (REMOTE.enabled && REMOTE.qr && !phoneConnected()) {
      const q = Math.min(P.w - 30, 150 * s);
      image(REMOTE.qr, P.x + 10, P.y + 330, q, q);
      push();
      uiFont(14);
      fill(255, 220, 230);
      noStroke();
      textAlign(LEFT, TOP);
      text("scan to use your phone · room " + REMOTE.room, P.x + 10, P.y + 336 + q);
      pop();
    }
    uiPill("flick", P.x + 10, P.y + 270, 120 * s + 20, 44, "flick!", () => this.flick(), { fill: PAL.goldLight, noDwell: true });
    uiPill("peel", P.x + 30 + 120 * s, P.y + 270, 150 * s + 20, 44, "peel them off", () => {
      look.flicked = [];
      this.thrown = 0;
      this.perfect = 0;
    }, { noDwell: true });
  },

  mouse() {
    if (insideMirror(mouseX, mouseY) && !phoneConnected()) this.flick();
  },

  key(k) {
    if (k === " ") this.flick();
  },
};

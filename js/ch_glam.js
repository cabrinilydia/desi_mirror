/* Chapter 2 · Glam
   The glam tray on the left. Point at a button (hold your fingertip on it
   for a moment) or click it. Bindi sticks to your forehead, jhumkas to your
   ears, bangles to your wrists, makeup to your face.
*/

const Glam = {
  name: "Glam",
  usesPointer: true,

  prompt() {
    return "point at the glam tray and hold, or click · move your head, the jhumkas swing";
  },

  surprise() {
    look.bindi = Math.floor(random(ART.bindis.length));
    look.lips = Math.floor(random(LIP_SHADES.length));
    look.kajal = true;
    look.shimmer = random() < 0.6;
    look.blush = true;
    look.jhumka = true;
    look.bangles = true;
  },

  drawUI() {
    const P = L.left;
    const cols = 4;
    const r = Math.min(28 * L.s, (P.w - 20) / (cols * 2 + (cols - 1) * 0.7));
    const gap = r * 2 + r * 0.7;
    const x0 = P.x + r + 10;
    let y = P.y + 6;
    push();
    uiFont(26, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Glam tray", P.x + 10, y);
    pop();
    y += 44;

    const section = (title) => {
      push();
      uiFont(15);
      fill(PAL.goldLight);
      noStroke();
      textAlign(LEFT, TOP);
      text(title, P.x + 10, y);
      pop();
      y += 22 + r;
    };
    const rowStep = gap + 8;

    section("Bindi");
    ART.bindis.forEach((img, i) => {
      const cx = x0 + (i % cols) * gap;
      const cy = y + Math.floor(i / cols) * rowStep;
      uiButton(
        "bindi" + i,
        cx,
        cy,
        r,
        (x, yy, rr) => {
          imageMode(CENTER);
          image(img, x, yy, rr * 1.25, rr * 1.25);
          imageMode(CORNER);
        },
        () => (look.bindi = look.bindi === i ? -1 : i),
        { active: look.bindi === i }
      );
    });
    y += rowStep * Math.ceil(ART.bindis.length / cols) - r + 4;

    section("Lips");
    LIP_SHADES.forEach((s, i) => {
      const cx = x0 + (i % cols) * gap;
      uiButton(
        "lips" + i,
        cx,
        y,
        r,
        (x, yy, rr) => {
          noStroke();
          fill(s.c[0], s.c[1], s.c[2]);
          ellipse(x, yy, rr * 1.2, rr * 0.7);
          fill(255, 255, 255, 90);
          ellipse(x - rr * 0.15, yy - rr * 0.12, rr * 0.4, rr * 0.14);
          stroke(PAL.ink);
          strokeWeight(1.5);
          noFill();
          line(x - rr * 0.6, yy, x + rr * 0.6, yy);
        },
        () => (look.lips = look.lips === i ? -1 : i),
        { active: look.lips === i }
      );
    });
    y += rowStep - r + 4;

    section("Extras");
    const extras = [
      ["kajal", "Kajal", iconKajal],
      ["shimmer", "Shimmer", iconShimmer],
      ["blush", "Blush", iconBlush],
      ["jhumka", "Jhumkas", iconJhumka],
      ["bangles", "Bangles", iconBangles],
    ];
    extras.forEach(([key, label, fn], i) => {
      const cx = x0 + (i % cols) * gap;
      const cy = y + Math.floor(i / cols) * rowStep;
      uiButton(key, cx, cy, r, fn, () => (look[key] = !look[key]), { active: look[key] });
    });
    const sy = y + rowStep;
    uiPill("surprise", x0 + gap - r * 0.2, sy - r * 0.55, gap * 2.2, r * 1.15, "surprise me ✦", () => this.surprise());
  },
};

function iconKajal(x, y, r) {
  push();
  noFill();
  stroke(20);
  strokeWeight(3);
  arc(x, y + r * 0.15, r * 1.2, r * 0.8, PI, TWO_PI);
  arc(x, y - r * 0.15, r * 1.2, r * 0.8, 0, PI);
  line(x + r * 0.6, y - r * 0.05, x + r * 0.85, y - r * 0.3);
  fill(20);
  noStroke();
  ellipse(x, y, r * 0.35, r * 0.35);
  pop();
}

function iconShimmer(x, y, r) {
  push();
  noStroke();
  fill(PAL.gold);
  for (const [dx, dy, s] of [[0, 0, 1], [r * 0.45, -r * 0.35, 0.5], [-r * 0.4, r * 0.35, 0.45]]) {
    beginShape();
    for (let k = 0; k < 8; k++) {
      const a = (k * PI) / 4;
      const rr = (k % 2 ? 0.16 : 0.5) * r * s;
      vertex(x + dx + Math.cos(a) * rr, y + dy + Math.sin(a) * rr);
    }
    endShape(CLOSE);
  }
  pop();
}

function iconBlush(x, y, r) {
  push();
  noStroke();
  for (let k = 4; k > 0; k--) {
    fill(240, 120, 150, 70);
    ellipse(x, y, (r * k) / 3, (r * k) / 3);
  }
  pop();
}

function iconJhumka(x, y, r) {
  const h = r * 1.5;
  const w = (h * ART.jhumka.width) / ART.jhumka.height;
  image(ART.jhumka, x - w / 2, y - h / 2, w, h);
}

function iconBangles(x, y, r) {
  push();
  noFill();
  const cs = [PAL.sindoor, PAL.gold, "#1f8f4e"];
  for (let k = 0; k < 3; k++) {
    stroke(cs[k]);
    strokeWeight(r * 0.16);
    ellipse(x, y - r * 0.25 + k * r * 0.25, r * 1.2, r * 0.42);
  }
  pop();
}

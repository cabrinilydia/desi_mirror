/* Chapter 2 · Glam
   The glam tray on the left. Point at a button (hold your fingertip on it
   for a moment) or click it. The bindi sticks to your forehead, jhumkas
   hang from your ears and swing, bangles slide onto your wrists.
*/

const Glam = {
  name: "Glam",
  usesPointer: true,

  prompt() {
    return "point at the glam tray and hold, or click · move your head, the jhumkas swing";
  },

  surprise() {
    look.bindi = Math.floor(random(ART.bindis.length));
    look.jhumka = Math.floor(random(ART.jhumkas.length));
    look.bangles = Math.floor(random(ART.bangles.length));
    look.shimmer = random() < 0.6;
    look.blush = true;
  },

  drawUI() {
    const P = L.left;
    const cols = 4;
    const r = Math.min(27 * L.s, (P.w - 20) / (cols * 2 + (cols - 1) * 0.7));
    const gap = r * 2 + r * 0.7;
    const rowStep = gap + 4;
    const x0 = P.x + r + 10;
    let y = P.y + 4;

    push();
    uiFont(26, true);
    fill(PAL.cream);
    noStroke();
    textAlign(LEFT, TOP);
    text("Glam tray", P.x + 10, y);
    pop();
    y += 42;

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
    const grid = (items, key) => {
      items.forEach((it, i) => {
        const cx = x0 + (i % cols) * gap;
        const cy = y + Math.floor(i / cols) * rowStep;
        uiButton(key + i, cx, cy, r, it.icon, it.press, { active: it.active });
      });
      y += rowStep * Math.ceil(items.length / cols) - r + 2;
    };

    section("Bindi");
    grid(
      ART.bindis.map((img, i) => ({
        icon: (x, yy, rr) => fitImage(img, x, yy, rr * 1.25),
        press: () => (look.bindi = look.bindi === i ? -1 : i),
        active: look.bindi === i,
      })),
      "bindi"
    );

    section("Jhumkas");
    grid(
      ART.jhumkas.map((J, i) => ({
        icon: (x, yy, rr) => fitImage(J.img, x, yy, rr * 1.6),
        press: () => (look.jhumka = look.jhumka === i ? -1 : i),
        active: look.jhumka === i,
      })),
      "jhumka"
    );

    section("Bangles & glow");
    const extras = ART.bangles.map((B, i) => ({
      icon: B.img ? (x, yy, rr) => fitImage(B.img, x, yy, rr * 1.5) : iconBangles,
      press: () => (look.bangles = look.bangles === i ? -1 : i),
      active: look.bangles === i,
    }));
    extras.push({ icon: iconShimmer, press: () => (look.shimmer = !look.shimmer), active: look.shimmer });
    extras.push({ icon: iconBlush, press: () => (look.blush = !look.blush), active: look.blush });
    grid(extras, "extra");

    uiPill("surprise", P.x + 10, y + 8, gap * 2.6, r * 1.15, "surprise me ✦", () => this.surprise());
  },
};

// draw an image centred at (x, y), fitting inside a size × size box
function fitImage(img, x, y, size) {
  const k = size / Math.max(img.width, img.height);
  image(img, x - (img.width * k) / 2, y - (img.height * k) / 2, img.width * k, img.height * k);
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

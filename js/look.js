/* Desi Mirror · look.js
   Everything you "wear" in the mirror: makeup, bindi, jhumkas, bangles
   and the paper-doll outfit. All of it follows the face / hand keypoints.
   The look stays on through every chapter, so it shows up in the photo.
*/

const look = {
  bindi: -1, // index into ART.bindis, -1 = none
  lips: -1, // index into LIP_SHADES
  kajal: false,
  shimmer: false,
  blush: false,
  jhumka: false,
  bangles: false,
  outfit: -1, // index into ART.outfits
};

// *** lipstick shades
const LIP_SHADES = [
  { name: "Maroon", c: [128, 22, 44] },
  { name: "Rani", c: [205, 32, 112] },
  { name: "Nude", c: [168, 98, 82] },
  { name: "Lal", c: [196, 18, 32] },
];

// face landmark index lists
const LIPS_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LIPS_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const EYE_L_UP = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const EYE_L_LO = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const EYE_R_UP = [263, 466, 388, 387, 386, 385, 384, 398, 362];
const EYE_R_LO = [263, 249, 390, 373, 374, 380, 381, 382, 362];
const BROW_L = [70, 63, 105, 66, 107];
const BROW_R = [300, 293, 334, 296, 336];

let jhumkaSwing = { l: 0, lv: 0, r: 0, rv: 0, lastX: null };

// video pixel -> screen position inside the mirror
function vm(p) {
  return { x: L.vx + p.x * L.vs, y: L.vy + p.y * L.vs };
}

function drawLook() {
  const F = faceInfo();
  if (F) {
    if (look.blush) drawBlushOn(F);
    if (look.shimmer) drawShimmer(F);
    if (look.kajal) drawKajalOn(F);
    if (look.lips >= 0) drawLips(F);
    if (look.outfit >= 0) drawOutfitOn(F);
  }
  if (look.bangles) drawBanglesOn();
  if (F) {
    if (look.jhumka) drawJhumkasOn(F);
    if (look.bindi >= 0) drawBindiOn(F);
  }
}

function polyFrom(idx) {
  beginShape();
  for (const i of idx) {
    const p = vm(fk(i));
    vertex(p.x, p.y);
  }
  endShape(CLOSE);
}

function drawLips(F) {
  const c = LIP_SHADES[look.lips].c;
  push();
  noStroke();
  blendMode(MULTIPLY);
  fill(c[0], c[1], c[2], 215);
  beginShape();
  for (const i of LIPS_OUT) {
    const p = vm(fk(i));
    vertex(p.x, p.y);
  }
  beginContour();
  for (let k = LIPS_IN.length - 1; k >= 0; k--) {
    const p = vm(fk(LIPS_IN[k]));
    vertex(p.x, p.y);
  }
  endContour();
  endShape(CLOSE);
  blendMode(BLEND);
  // a little gloss on the lower lip
  const lo = vm(fk(17));
  const mid = vm(fk(14));
  fill(255, 255, 255, 55);
  ellipse((lo.x + mid.x) / 2, (lo.y + mid.y) / 2, F.w * L.vs * 0.12, F.w * L.vs * 0.03);
  pop();
}

function strokeLine(idx, extra) {
  beginShape();
  for (const i of idx) {
    const p = vm(fk(i));
    vertex(p.x, p.y);
  }
  if (extra) vertex(extra.x, extra.y);
  endShape();
}

function drawKajalOn(F) {
  const sw = Math.max(1.5, F.w * L.vs * 0.012);
  push();
  noFill();
  stroke(20, 10, 12, 230);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  // little winged flick at the outer corners
  for (const [up, lo, outer, inner] of [
    [EYE_L_UP, EYE_L_LO, 33, 133],
    [EYE_R_UP, EYE_R_LO, 263, 362],
  ]) {
    const o = vm(fk(outer));
    const n = vm(fk(inner));
    const dx = o.x - n.x;
    const dy = o.y - n.y;
    const wing = { x: o.x + dx * 0.28, y: o.y + dy * 0.28 - Math.abs(dx) * 0.16 };
    strokeWeight(sw * 1.4);
    strokeLine(up, null);
    line(o.x, o.y, wing.x, wing.y);
    strokeWeight(sw);
    strokeLine(lo, null);
  }
  pop();
}

function drawShimmer(F) {
  push();
  noStroke();
  for (const [up, brow] of [
    [EYE_L_UP, BROW_L],
    [EYE_R_UP, BROW_R],
  ]) {
    // band between the upper lid and halfway to the brow
    const pts = [];
    for (const i of up) pts.push(vm(fk(i)));
    const bp = brow.map((i) => vm(fk(i)));
    const lidTop = up
      .slice()
      .reverse()
      .map((i, k) => {
        const p = vm(fk(i));
        const b = bp[Math.min(bp.length - 1, Math.floor((k / up.length) * bp.length))];
        return { x: p.x + (b.x - p.x) * 0.45, y: p.y + (b.y - p.y) * 0.45 };
      });
    blendMode(SCREEN);
    fill(243, 200, 90, 110);
    beginShape();
    for (const p of pts.concat(lidTop)) vertex(p.x, p.y);
    endShape(CLOSE);
    blendMode(BLEND);
    // sparkles
    for (let k = 0; k < 5; k++) {
      const p = pts[(k * 2 + frameCount) % pts.length];
      fill(255, 250, 220, 120 + 120 * Math.sin(frameCount * 0.2 + k));
      ellipse(p.x + random(-3, 3), p.y - random(2, 8), 2.5, 2.5);
    }
  }
  pop();
}

function drawBlushOn(F) {
  push();
  noStroke();
  blendMode(MULTIPLY);
  const r = F.w * L.vs * 0.2;
  for (const i of [205, 425]) {
    const p = vm(fk(i));
    for (let k = 5; k > 0; k--) {
      fill(240, 120, 150, 18);
      ellipse(p.x, p.y, (r * k) / 3, (r * k) / 4);
    }
  }
  blendMode(BLEND);
  pop();
}

function drawBindiOn(F) {
  const p = vm(lerpPt(fk(9), fk(151), 0.3));
  const s = F.w * L.vs * (look.bindi === 2 ? 0.07 : 0.13);
  push();
  translate(p.x, p.y);
  rotate(F.roll);
  imageMode(CENTER);
  image(ART.bindis[look.bindi], 0, 0, s, s);
  pop();
}

function drawJhumkasOn(F) {
  const fw = F.w * L.vs;
  // pendulum swing: the jhumkas lag behind when you move your head
  const cx = F.centre.x;
  if (jhumkaSwing.lastX !== null) {
    const v = (cx - jhumkaSwing.lastX) * L.vs;
    for (const s of ["l", "r"]) {
      jhumkaSwing[s + "v"] += -v * 0.004 - jhumkaSwing[s] * 0.08;
      jhumkaSwing[s + "v"] *= 0.9;
      jhumkaSwing[s] = constrain(jhumkaSwing[s] + jhumkaSwing[s + "v"], -0.7, 0.7);
    }
  }
  jhumkaSwing.lastX = cx;

  const ears = [
    { top: 234, low: 132, vis: F.leftVis, s: "l" },
    { top: 454, low: 361, vis: F.rightVis, s: "r" },
  ];
  const c = vm(F.centre);
  for (const e of ears) {
    if (e.vis < 0.32) continue; // that ear is turned away
    let p = vm(lerpPt(fk(e.top), fk(e.low), 0.6));
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    p = { x: p.x + (dx / d) * fw * 0.035, y: p.y + (dy / d) * fw * 0.035 };
    const h = fw * 0.42;
    const w = (h * ART.jhumka.width) / ART.jhumka.height;
    push();
    translate(p.x, p.y);
    rotate(jhumkaSwing[e.s]);
    image(ART.jhumka, -w / 2, -h * 0.04, w, h);
    pop();
  }
}

function drawBanglesOn() {
  const cols = [PAL.sindoor, PAL.gold, "#1f8f4e", PAL.gold, PAL.rani, PAL.gold];
  for (const h of TRACK.hands) {
    const w = vm(h.kp[0]);
    const m = vm(h.kp[9]);
    const hs = Math.hypot(m.x - w.x, m.y - w.y);
    const ax = (w.x - m.x) / (hs || 1);
    const ay = (w.y - m.y) / (hs || 1);
    const ang = Math.atan2(ay, ax);
    push();
    if (ART.bangles) {
      translate(w.x + ax * hs * 0.45, w.y + ay * hs * 0.45);
      rotate(ang - HALF_PI);
      imageMode(CENTER);
      image(ART.bangles, 0, 0, hs * 1.1, hs * 1.1 * (ART.bangles.height / ART.bangles.width));
    } else {
      noFill();
      for (let k = 0; k < 6; k++) {
        const along = hs * (0.2 + k * 0.1);
        push();
        translate(w.x + ax * along, w.y + ay * along);
        rotate(ang);
        stroke(PAL.ink);
        strokeWeight(hs * 0.09 + 2);
        ellipse(0, 0, hs * 0.28, hs * 0.95);
        stroke(cols[k]);
        strokeWeight(hs * 0.09);
        ellipse(0, 0, hs * 0.28, hs * 0.95);
        pop();
      }
    }
    pop();
  }
}

function drawOutfitOn(F) {
  const img = ART.outfits[look.outfit];
  const chin = vm(fk(152));
  const fw = F.w * L.vs;
  // *** paper-doll size: shoulders about 2.3 face-widths across
  const w = fw * 2.3 * (300 / 220);
  const h = (w * img.height) / img.width;
  push();
  translate(chin.x, chin.y + fw * 0.02);
  rotate(F.roll * 0.5);
  image(img, -w / 2, -h * 0.03, w, h);
  pop();
}

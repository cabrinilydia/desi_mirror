/* Desi Mirror · ui.js
   Buttons you can press with the mouse OR by holding your fingertip
   over them for a moment (dwell), so you never have to touch the laptop.
*/

let BTNS = [];
let LAST_BTNS = [];
let pointer = null; // {x, y} from your index fingertip, mapped to the screen
const dwell = { id: null, t0: 0, fired: false };
const DWELL_MS = 850; // *** how long to hold your finger over a button

function uiReset() {
  LAST_BTNS = BTNS;
  BTNS = [];
}

function uiFont(sz, display) {
  textFont(display ? "Rozha One" : "Baloo 2");
  textSize(sz);
}

// round button with an icon
function uiButton(id, x, y, r, iconFn, onPress, opt) {
  opt = opt || {};
  BTNS.push({ id, x, y, r, onPress, round: true, noDwell: !!opt.noDwell });
  const hover = isOver({ x, y, r, round: true });
  push();
  noStroke();
  fill(0, 0, 0, 60);
  ellipse(x + 2, y + 3, r * 2, r * 2);
  fill(opt.active ? PAL.goldLight : PAL.cream);
  stroke(PAL.ink);
  strokeWeight(2.5);
  ellipse(x, y, r * 2, r * 2);
  if (opt.active) {
    noFill();
    stroke(PAL.marigoldDeep);
    strokeWeight(4);
    ellipse(x, y, r * 2 + 9, r * 2 + 9);
  }
  if (hover) {
    noFill();
    stroke(255, 255, 255, 160);
    strokeWeight(3);
    ellipse(x, y, r * 2 + 4, r * 2 + 4);
  }
  if (iconFn) iconFn(x, y, r);
  if (opt.label) {
    noStroke();
    fill(PAL.cream);
    uiFont(Math.max(11, r * 0.42));
    textAlign(CENTER, TOP);
    text(opt.label, x, y + r + 4);
  }
  drawDwell(id, x, y, r + 6);
  pop();
}

// pill-shaped text button
function uiPill(id, x, y, w, h, label, onPress, opt) {
  opt = opt || {};
  BTNS.push({ id, x: x + w / 2, y: y + h / 2, w, h, onPress, round: false, noDwell: !!opt.noDwell });
  const hover = isOver({ x: x + w / 2, y: y + h / 2, w, h, round: false });
  push();
  noStroke();
  fill(0, 0, 0, 60);
  rect(x + 2, y + 3, w, h, h / 2);
  fill(opt.active ? PAL.marigold : opt.fill || PAL.cream);
  stroke(PAL.ink);
  strokeWeight(2.5);
  rect(x, y, w, h, h / 2);
  if (hover) {
    noFill();
    stroke(255, 255, 255, 170);
    strokeWeight(3);
    rect(x - 3, y - 3, w + 6, h + 6, h / 2 + 3);
  }
  noStroke();
  fill(PAL.ink);
  uiFont(opt.size || h * 0.48);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2 - h * 0.04);
  drawDwell(id, x + w / 2, y + h / 2, Math.max(w, h) / 2 + 6, true);
  pop();
}

function isOver(b, p) {
  const pts = [];
  if (p) pts.push(p);
  else {
    pts.push({ x: mouseX, y: mouseY });
  }
  for (const q of pts) {
    if (b.round && Math.hypot(q.x - b.x, q.y - b.y) <= b.r) return true;
    if (!b.round && Math.abs(q.x - b.x) <= b.w / 2 && Math.abs(q.y - b.y) <= b.h / 2) return true;
  }
  return false;
}

function drawDwell(id, x, y, r, small) {
  if (dwell.id !== id || dwell.fired) return;
  const t = constrain((millis() - dwell.t0) / DWELL_MS, 0, 1);
  noFill();
  stroke(PAL.marigoldDeep);
  strokeWeight(small ? 4 : 5);
  arc(x, y, r * 2, r * 2, -HALF_PI, -HALF_PI + t * TWO_PI);
}

// fingertip pointer: index tip of the most raised hand, mapped to the whole screen
function updatePointer(active) {
  if (!active || !TRACK.hands.length) {
    pointer = null;
    return;
  }
  let best = null;
  for (const h of TRACK.hands) if (!best || h.kp[8].y < best.kp[8].y) best = h;
  const t = best.kp[8];
  // *** margins: you don't need to reach the very edge of the camera
  const x = map(t.x, VW() * 0.12, VW() * 0.88, 0, width, true);
  const y = map(t.y, VH() * 0.1, VH() * 0.85, 0, height, true);
  pointer = pointer ? { x: lerp(pointer.x, x, 0.45), y: lerp(pointer.y, y, 0.45) } : { x, y };
}

function handleDwell() {
  if (!pointer) {
    dwell.id = null;
    return;
  }
  let over = null;
  for (const b of BTNS) if (!b.noDwell && isOver(b, pointer)) over = b;
  if (!over) {
    dwell.id = null;
    dwell.fired = false;
    return;
  }
  if (dwell.id !== over.id) {
    dwell.id = over.id;
    dwell.t0 = millis();
    dwell.fired = false;
  } else if (!dwell.fired && millis() - dwell.t0 > DWELL_MS) {
    dwell.fired = true;
    over.onPress();
  }
}

function drawPointer() {
  if (!pointer) return;
  push();
  noStroke();
  fill(242, 159, 5, 90);
  ellipse(pointer.x, pointer.y, 34, 34);
  fill(PAL.marigold);
  stroke(PAL.ink);
  strokeWeight(2);
  ellipse(pointer.x, pointer.y, 14, 14);
  pop();
}

function uiMousePressed() {
  for (const b of LAST_BTNS) {
    if (isOver(b)) {
      b.onPress();
      return true;
    }
  }
  return false;
}

// speech bubble
function bubble(txt, x, y, maxW, sz, pointDown) {
  push();
  uiFont(sz);
  const words = txt.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textWidth(t) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  lines.push(cur);
  const lh = sz * 1.15;
  let w = 0;
  for (const l of lines) w = Math.max(w, textWidth(l));
  w += sz * 1.4;
  const h = lines.length * lh + sz * 0.9;
  const bx = x - w / 2;
  const by = y - h;
  fill(255, 250, 240);
  stroke(PAL.ink);
  strokeWeight(3);
  rect(bx, by, w, h, 16);
  if (pointDown !== false) triangle(x - 10, y - 2, x + 10, y - 2, x + (pointDown === "left" ? -16 : 16), y + 16);
  noStroke();
  rect(x - 9, y - 6, 18, 6);
  fill(PAL.ink);
  textAlign(CENTER, TOP);
  for (let i = 0; i < lines.length; i++) text(lines[i], x, by + sz * 0.35 + i * lh);
  pop();
}

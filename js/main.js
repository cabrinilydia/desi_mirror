/* DM3014 Interactive Devices · Final Project
   DESI MIRROR (देसी आईना)
   A desi dressing-table mirror that gets you ready for a family function,
   in five chapters:
     1 Steam   breathe on the mirror (mic) and wipe it with your hand
     2 Glam    bindi, jhumkas, bangles, shimmer, blush that stick to you
     3 Outfit  phone tilt / flick (gyroscope) to pick and toss outfits
     4 Bindi   phone tilt aims, a flick throws a bindi that sticks to you
     5 Photo   frame it, 3-2-1, download your photo strip
   (The Aunty chappal game is in js/ch_aunty.js, switched off for now.)

   Webcam + ml5 faceMesh / handPose (computer vision), mic input,
   phone sensors through Firebase (remote interaction), all in p5.js.

   Keys: 1-5 jump to a chapter · N next · H hide UI · F fullscreen
*/

let started = false;
let chapter = 0;
let showUI = true;
let shakeUntil = 0;
let L = {}; // layout
let wallLayer, tableLayer;
let CH = [];

function preload() {
  loadOverrides();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  CH = [Steam, Glam, Outfit, BindiFlick, Photo];
  layout();
  buildArt();
  rebuildLayers();
  for (const c of CH) if (c.init) c.init();
  remoteStart(onRemoteAction);
}

function layout() {
  L.s = Math.min(height / 900, width / 1280);
  L.frameW = 34 * L.s;
  L.tableTop = height * 0.8;
  const top = 110 * L.s + L.frameW;
  const mh = L.tableTop - top;
  const mw = Math.min(mh * 0.74, width * 0.36);
  L.mirror = { x: width / 2 - mw / 2, y: top, w: mw, h: mh };
  const gap = 34 * L.s;
  const panelTop = 104 * L.s;
  const panelBottom = L.tableTop - 120 * L.s;
  L.left = { x: 22 * L.s, y: panelTop, w: L.mirror.x - L.frameW - gap - 22 * L.s, h: panelBottom - panelTop };
  const rx = L.mirror.x + mw + L.frameW + gap;
  L.right = { x: rx, y: panelTop, w: width - 22 * L.s - rx, h: panelBottom - panelTop };
  updateVideoMap();
}

// how the camera image is scaled to fill the mirror (like CSS "cover")
function updateVideoMap() {
  const M = L.mirror;
  L.vs = Math.max(M.w / VW(), M.h / VH());
  L.vw = VW() * L.vs;
  L.vh = VH() * L.vs;
  L.vx = M.x + M.w / 2 - L.vw / 2;
  L.vy = M.y + M.h / 2 - L.vh / 2;
}

function rebuildLayers() {
  if (wallLayer) wallLayer.remove();
  if (tableLayer) tableLayer.remove();
  wallLayer = buildWallLayer();
  tableLayer = buildTableLayer();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layout();
  rebuildLayers();
  Steam.resize();
}

// frame time in ms, capped so a hiccup doesn't make things jump
function dt() {
  return Math.min(deltaTime || 16, 60);
}

function draw() {
  updateTracking();
  updateVideoMap();
  const ch = CH[chapter];
  updatePointer(started && ch.usesPointer);

  push();
  if (millis() < shakeUntil) translate(random(-9, 9), random(-6, 6));
  background(PAL.wall);
  if (started && ch.update) ch.update();
  drawGlass();
  image(wallLayer, 0, 0);
  if (started && ch.drawBehind) ch.drawBehind();
  image(tableLayer, 0, 0);
  if (started && ch.drawWorld) ch.drawWorld();
  pop();

  if (Photo.wantsCapture && chapter === 4) Photo.capture();

  uiReset();
  if (started) {
    if (showUI) {
      drawHUD();
      if (ch.drawUI) ch.drawUI();
    }
  } else {
    drawStart();
  }
  drawPointer();
  handleDwell();
}

// the glass: camera, fog, and everything you're wearing
function drawGlass() {
  const M = L.mirror;
  noStroke();
  fill(34, 22, 28);
  rect(M.x, M.y, M.w, M.h);
  if (videoReady()) {
    // drawn mirrored, like a real mirror
    push();
    translate(L.vx + L.vw, L.vy);
    scale(-1, 1);
    image(video, 0, 0, L.vw, L.vh);
    pop();
  } else if (started) {
    fill(PAL.cream);
    uiFont(18);
    textAlign(CENTER, CENTER);
    text("waking up the camera…", M.x + M.w / 2, M.y + M.h / 2);
  }
  Steam.drawGlass();
  drawLook();
  // soft glare streak so it reads as glass
  noStroke();
  for (let k = 0; k < 3; k++) {
    fill(255, 255, 255, 9 - k * 2);
    const x = M.x + M.w * (0.12 + k * 0.05);
    quad(x, M.y + M.h, x + M.w * 0.08, M.y + M.h, x + M.w * 0.42, M.y, x + M.w * 0.34, M.y);
  }
}

function drawHUD() {
  const s = L.s;
  push();
  noStroke();
  textAlign(LEFT, TOP);
  uiFont(44 * s, true);
  fill(0, 0, 0, 70);
  text("Desi Mirror", 24 * s + 2, 14 * s + 3);
  fill(PAL.haldi);
  text("Desi Mirror", 24 * s, 14 * s);
  uiFont(15 * s + 3);
  fill(255, 215, 225);
  text("देसी आईना  ·  get ready, the aunties are waiting", 26 * s, 66 * s);
  pop();

  // chapter pills, top right
  const names = CH.map((c, i) => i + 1 + " " + c.name);
  const ph = 34 * s;
  let x = width - 22 * s;
  for (let i = names.length - 1; i >= 0; i--) {
    push();
    uiFont(ph * 0.48);
    const w = textWidth(names[i]) + 26 * s;
    pop();
    x -= w;
    uiPill("ch" + i, x, 22 * s, w, ph, names[i], () => goChapter(i), { active: chapter === i, noDwell: true });
    x -= 8 * s;
  }

  // brass plaque on the table with the instruction
  const pr = CH[chapter].prompt ? CH[chapter].prompt() : "";
  push();
  uiFont(17 * s + 2);
  const pw = Math.min(textWidth(pr) + 50 * s, width * 0.62);
  const px = width / 2 - pw / 2;
  const py = L.tableTop + 64 * s;
  fill(0, 0, 0, 70);
  noStroke();
  rect(px + 3, py + 4, pw, 44 * s, 10 * s);
  fill(PAL.goldLight);
  stroke(PAL.ink);
  strokeWeight(3);
  rect(px, py, pw, 44 * s, 10 * s);
  noStroke();
  fill(PAL.woodDark);
  for (const cx of [px + 12 * s, px + pw - 12 * s]) ellipse(cx, py + 22 * s, 6 * s, 6 * s);
  fill(PAL.ink);
  textAlign(CENTER, CENTER);
  text(pr, width / 2, py + 21 * s);
  pop();

  if (chapter < CH.length - 1)
    uiPill("next", width - 160 * s, L.tableTop + 64 * s, 136 * s, 44 * s, "next  ›", () => goChapter(chapter + 1), { fill: PAL.marigold, noDwell: true });

  // status lights, bottom left
  const st = [
    ["camera", videoReady()],
    ["face", !!TRACK.face],
    ["hands", TRACK.hands.length > 0],
    ["mic", Steam.mic.ok],
    ["phone", phoneConnected()],
  ];
  push();
  uiFont(13 * s + 2);
  textAlign(LEFT, CENTER);
  let sx = 24 * s;
  const sy = height - 26 * s;
  for (const [n, ok] of st) {
    noStroke();
    fill(ok ? "#7be38b" : "#8b6b70");
    ellipse(sx + 5, sy, 10, 10);
    fill(255, 225, 230);
    text(n, sx + 15, sy - 1);
    sx += textWidth(n) + 34;
  }
  pop();
}

function drawStart() {
  push();
  fill(60, 8, 22, 225);
  noStroke();
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  uiFont(Math.min(110, width * 0.09), true);
  fill(0, 0, 0, 80);
  text("Desi Mirror", width / 2 + 3, height * 0.36 + 4);
  fill(PAL.haldi);
  text("Desi Mirror", width / 2, height * 0.36);
  uiFont(26);
  fill(255, 215, 225);
  text("देसी आईना", width / 2, height * 0.47);
  uiFont(20);
  fill(PAL.cream);
  text("Get ready for the family function. The aunties are waiting.", width / 2, height * 0.55);
  const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.08);
  fill(242, 159, 5, 255 * pulse);
  uiFont(24);
  text("click anywhere to begin", width / 2, height * 0.66);
  uiFont(15);
  fill(255, 200, 210);
  text("allow the camera and microphone when asked", width / 2, height * 0.71);
  uiFont(13);
  fill(255, 190, 200);
  text("outfit, jewellery and makeup illustrations from Pinterest artists incl. @deepthidesigns, Zevar_sketch_by_Zoya and Dòra Harcos", width / 2, height - 30);
  pop();
}

function begin() {
  if (started) return;
  started = true;
  startTracking();
  Steam.startMic();
  goChapter(0);
}

function goChapter(i) {
  if (i < 0 || i >= CH.length) return;
  if (CH[chapter].exit) CH[chapter].exit();
  chapter = i;
  if (CH[i].enter) CH[i].enter();
  sendState();
}

function onRemoteAction(a) {
  if (CH[chapter].action) CH[chapter].action(a);
}

function mousePressed() {
  if (!started) {
    begin();
    return;
  }
  if (!uiMousePressed() && CH[chapter].mouse) CH[chapter].mouse();
}

function keyPressed() {
  if (!started) {
    begin();
    return;
  }
  if (key >= "1" && key <= "5") goChapter(int(key) - 1);
  else if (key === "n" || key === "N") goChapter(Math.min(chapter + 1, CH.length - 1));
  else if (key === "h" || key === "H") showUI = !showUI;
  else if (key === "f" || key === "F") fullscreen(!fullscreen());
  const ch = CH[chapter];
  if (ch.key) ch.key(key, keyCode);
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode) || key === " ") return false;
}

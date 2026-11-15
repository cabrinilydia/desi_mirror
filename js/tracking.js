/* Desi Mirror · tracking.js
   Webcam + ml5 face and hand tracking.
   The MediaPipe model files are bundled in lib/mediapipe, so tracking
   works without reaching a CDN (handy on campus Wi-Fi).
*/

let video;
let faceMesh, handPose;

const TRACK = {
  rawFace: null,
  rawHands: [],
  face: null, // smoothed 468 keypoints [{x,y}] in video pixels
  faceSeenAt: -99999,
  hands: [], // [{kp: [{x,y,name}], handedness}]
  handsSeenAt: -99999,
  faceReady: false,
  handsReady: false,
  started: false,
};

const SMOOTH = 0.55; // *** 0 = frozen, 1 = raw (jittery). Higher follows faster.

function startTracking() {
  if (TRACK.started) return;
  TRACK.started = true;
  // not flipped here: main.js draws it mirrored itself (see drawGlass)
  video = createCapture({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false });
  video.hide();

  // the two MediaPipe models clash if they load at the same moment,
  // so the hand model only starts loading once the face model is ready
  faceMesh = ml5.faceMesh(
    { maxFaces: 1, refineLandmarks: false, flipped: false, runtime: "mediapipe", solutionPath: "lib/mediapipe/face_mesh" },
    () => {
      TRACK.faceReady = true;
      faceMesh.detectStart(video, (r) => {
        TRACK.rawFace = r && r[0] ? r[0] : null;
        if (TRACK.rawFace) TRACK.faceSeenAt = millis();
      });
      startHands();
    }
  );
}

function startHands() {
  handPose = ml5.handPose(
    { maxHands: 2, flipped: false, runtime: "mediapipe", modelType: "lite", solutionPath: "lib/mediapipe/hands" },
    () => {
      TRACK.handsReady = true;
      handPose.detectStart(video, (r) => {
        TRACK.rawHands = r || [];
        if (TRACK.rawHands.length) TRACK.handsSeenAt = millis();
      });
    }
  );
}

function videoReady() {
  return video && video.loadedmetadata && video.width > 0;
}

function VW() {
  return videoReady() ? video.width : 640;
}
function VH() {
  return videoReady() ? video.height : 480;
}

// the camera is drawn mirrored, so mirror the keypoints to match.
// (doing both flips by hand keeps the video and the points in lockstep)
function mirrorX(x) {
  return VW() - x;
}

// call once per frame: eases keypoints so overlays don't jitter
function updateTracking() {
  const f = TRACK.rawFace;
  if (f && f.keypoints && f.keypoints.length >= 468) {
    if (!TRACK.face) {
      TRACK.face = f.keypoints.map((k) => ({ x: mirrorX(k.x), y: k.y }));
    } else {
      for (let i = 0; i < TRACK.face.length; i++) {
        TRACK.face[i].x += (mirrorX(f.keypoints[i].x) - TRACK.face[i].x) * SMOOTH;
        TRACK.face[i].y += (f.keypoints[i].y - TRACK.face[i].y) * SMOOTH;
      }
    }
  }
  if (millis() - TRACK.faceSeenAt > 900) TRACK.face = null; // *** how fast overlays vanish when your face is lost

  const next = [];
  for (const h of TRACK.rawHands) {
    if (!h.keypoints || h.keypoints.length < 21) continue;
    const w = { x: mirrorX(h.keypoints[0].x), y: h.keypoints[0].y };
    let prev = null;
    let best = 140;
    for (const p of TRACK.hands) {
      const d = Math.hypot(p.kp[0].x - w.x, p.kp[0].y - w.y);
      if (d < best) {
        best = d;
        prev = p;
      }
    }
    const kp = h.keypoints.map((k, i) => {
      const x = mirrorX(k.x);
      return prev
        ? { x: prev.kp[i].x + (x - prev.kp[i].x) * SMOOTH, y: prev.kp[i].y + (k.y - prev.kp[i].y) * SMOOTH, name: k.name }
        : { x, y: k.y, name: k.name };
    });
    next.push({ kp, handedness: h.handedness });
  }
  TRACK.hands = millis() - TRACK.handsSeenAt > 300 ? [] : next;
  TRACK.rawHands = millis() - TRACK.handsSeenAt > 300 ? [] : TRACK.rawHands;
}

// ── handy face measurements (video pixels) ───────────────────────

function fk(i) {
  return TRACK.face[i];
}

function faceInfo() {
  if (!TRACK.face) return null;
  const eL = fk(234);
  const eR = fk(454);
  const eyeL = fk(33);
  const eyeR = fk(263);
  const w = Math.hypot(eR.x - eL.x, eR.y - eL.y);
  const nose = fk(1);
  return {
    w,
    // head tilt, measured left-to-right as it appears on screen
    roll: eyeL.x < eyeR.x ? Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) : Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x),
    centre: { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 + w * 0.12 },
    nose,
    // how much of each side of the face is visible (for hiding a jhumka when you turn)
    leftVis: Math.hypot(nose.x - eL.x, nose.y - eL.y) / w,
    rightVis: Math.hypot(nose.x - eR.x, nose.y - eR.y) / w,
  };
}

function lerpPt(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// hand helpers
function handSize(h) {
  return Math.hypot(h.kp[9].x - h.kp[0].x, h.kp[9].y - h.kp[0].y);
}

function isOpenPalm(h) {
  const s = handSize(h);
  let open = 0;
  for (const tip of [8, 12, 16, 20]) {
    if (Math.hypot(h.kp[tip].x - h.kp[0].x, h.kp[tip].y - h.kp[0].y) > s * 1.6) open++;
  }
  return open >= 4;
}

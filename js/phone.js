/* Desi Mirror · phone.js
   Runs on the phone. Reads the gyroscope (tilt) and accelerometer (flick)
   and sends them to the mirror through Firebase. What the phone does
   depends on the mirror's chapter:
     Outfit -> tilt browses, flick tosses, tap wear
     Bindi  -> tilt aims a crosshair, flick throws a bindi
*/

const TILT_ON = 28; // *** degrees of tilt that flips to the next outfit
const TILT_OFF = 12; // back under this to re-arm
const FLICK = 15; // *** how hard a flick has to be (m/s²)
const AIM_X = 22; // *** degrees of left/right tilt to reach the mirror's edge
const AIM_Y = 18; // *** degrees of forward/back tilt to reach top/bottom

const room = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
document.getElementById("room").textContent = room || "????";
const $ = (id) => document.getElementById(id);

let ref = null;
let mode = "wait"; // "wardrobe" | "bindi" | "wait"
let gamma = 0;
let beta = 0;
let g0 = 0;
let b0 = 45;
let armed = true;
let lastFlick = 0;
let lastSent = 0;
let prevAcc = null;

function setStatus(t) {
  $("status").textContent = t;
}

function setMode(m, chapterName) {
  if (m === "bindi" && mode !== "bindi") recenter();
  mode = m;
  $("p-wardrobe").classList.toggle("on", m === "wardrobe");
  $("p-bindi").classList.toggle("on", m === "bindi");
  $("p-wait").classList.toggle("on", m === "wait");
  $("waitch").textContent = chapterName ? "Mirror is on: " + chapterName : "…";
}

function firebaseReady() {
  return (
    typeof firebase !== "undefined" &&
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.databaseURL &&
    !/your-project/.test(firebaseConfig.databaseURL)
  );
}

if (!room) {
  setStatus("no room code: scan the QR code on the mirror");
} else if (!firebaseReady()) {
  setStatus("Firebase isn't set up in config.js, so the phone can't reach the mirror");
} else {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  ref = db.ref("desi/" + room + "/phone");
  db.ref("desi/" + room + "/state").on("value", (snap) => {
    const v = snap.val() || {};
    $("outfit").textContent = v.outfit || "…";
    $("wearing").textContent = v.wearing ? "wearing: " + v.wearing : "";
    if (v.chapter === "Outfit") setMode("wardrobe");
    else if (v.chapter === "Bindi") setMode("bindi");
    else setMode("wait", v.chapter);
    setStatus("connected to room " + room);
  });
  db.ref(".info/connected").on("value", (s) => {
    if (s.val() !== true) setStatus("connecting…");
  });
}

function aim() {
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  return { x: clamp((gamma - g0) / AIM_X), y: clamp(-(beta - b0) / AIM_Y) };
}

function recenter() {
  g0 = gamma;
  b0 = beta;
}

function send(action) {
  if (!ref) return;
  const a = aim();
  ref.set({ seq: Date.now(), action, tilt: Math.round(gamma), aimX: a.x, aimY: a.y });
  if (navigator.vibrate) navigator.vibrate(action === "toss" || action === "flick" ? [20, 30, 40] : 25);
  if (mode === "wardrobe") {
    const h = $("hanger");
    h.style.transform = action === "toss" ? "translateY(40px) rotate(60deg)" : action === "wear" ? "scale(1.25)" : h.style.transform;
    setTimeout(() => (h.style.transform = "rotate(" + gamma * 0.6 + "deg)"), 250);
  }
}

function onOrientation(e) {
  if (e.gamma === null) return;
  gamma = e.gamma; // left / right tilt, -90..90
  beta = e.beta; // forward / back tilt
  const a = aim();
  if (mode === "wardrobe") {
    $("hanger").style.transform = "rotate(" + gamma * 0.6 + "deg)";
    if (armed && gamma > TILT_ON) {
      send("next");
      armed = false;
    } else if (armed && gamma < -TILT_ON) {
      send("prev");
      armed = false;
    } else if (Math.abs(gamma) < TILT_OFF) armed = true;
  } else if (mode === "bindi") {
    $("dot").style.transform = "translate(" + a.x * 100 + "px," + a.y * 100 + "px)";
  }
  // stream the tilt (about 12 times a second) so the mirror can follow it
  const now = Date.now();
  if (ref && now - lastSent > 80) {
    lastSent = now;
    ref.update({ tilt: Math.round(gamma), aimX: Math.round(a.x * 1000) / 1000, aimY: Math.round(a.y * 1000) / 1000 });
  }
}

function onMotion(e) {
  const now = Date.now();
  let mag = 0;
  if (e.acceleration && e.acceleration.x !== null) {
    const a = e.acceleration;
    mag = Math.hypot(a.x, a.y, a.z);
  } else if (e.accelerationIncludingGravity) {
    const a = e.accelerationIncludingGravity;
    if (prevAcc) mag = Math.hypot(a.x - prevAcc.x, a.y - prevAcc.y, a.z - prevAcc.z);
    prevAcc = { x: a.x, y: a.y, z: a.z };
  }
  if (mag > FLICK && now - lastFlick > 900) {
    lastFlick = now;
    if (mode === "wardrobe") send("toss");
    if (mode === "bindi") send("flick");
  }
}

async function start() {
  try {
    // iPhones need permission, asked from a tap
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
      await DeviceOrientationEvent.requestPermission();
    }
    if (typeof DeviceMotionEvent !== "undefined" && DeviceMotionEvent.requestPermission) {
      await DeviceMotionEvent.requestPermission();
    }
  } catch (e) {
    setStatus("motion not allowed: use the buttons instead");
  }
  window.addEventListener("deviceorientation", onOrientation);
  window.addEventListener("devicemotion", onMotion);
  $("start").style.display = "none";
}

$("go").addEventListener("click", start);
$("prev").addEventListener("click", () => send("prev"));
$("next").addEventListener("click", () => send("next"));
$("toss").addEventListener("click", () => send("toss"));
$("wear").addEventListener("click", () => send("wear"));
$("flick").addEventListener("click", () => send("flick"));
$("center").addEventListener("click", recenter);

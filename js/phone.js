/* Desi Mirror · phone.js
   Runs on the phone. Reads the gyroscope (tilt) and accelerometer (flick)
   and sends actions to the mirror through Firebase.
*/

const TILT_ON = 28; // *** degrees of tilt that flips to the next outfit
const TILT_OFF = 12; // back under this to re-arm
const FLICK = 15; // *** how hard a flick has to be to toss (m/s²)

const room = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
document.getElementById("room").textContent = room || "????";
const $ = (id) => document.getElementById(id);

let ref = null;
let tilt = 0;
let armed = true;
let lastFlick = 0;
let lastTiltSent = 0;
let prevAcc = null;

function setStatus(t) {
  $("status").textContent = t;
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
    if (v.chapter && v.chapter !== "Outfit") setStatus("connected · the mirror is on " + v.chapter + ", go to Outfit");
    else setStatus("connected to room " + room);
  });
  db.ref(".info/connected").on("value", (s) => {
    if (s.val() !== true) setStatus("connecting…");
  });
}

function send(action) {
  if (!ref) return;
  ref.set({ seq: Date.now(), action, tilt: Math.round(tilt) });
  if (navigator.vibrate) navigator.vibrate(action === "toss" ? [20, 30, 40] : 25);
  const h = $("hanger");
  h.style.transform = action === "toss" ? "translateY(40px) rotate(60deg)" : action === "wear" ? "scale(1.25)" : h.style.transform;
  setTimeout(() => (h.style.transform = "rotate(" + tilt * 0.6 + "deg)"), 250);
}

function onOrientation(e) {
  if (e.gamma === null) return;
  tilt = e.gamma; // left / right tilt, -90..90
  $("hanger").style.transform = "rotate(" + tilt * 0.6 + "deg)";
  if (armed && tilt > TILT_ON) {
    send("next");
    armed = false;
  } else if (armed && tilt < -TILT_ON) {
    send("prev");
    armed = false;
  } else if (Math.abs(tilt) < TILT_OFF) armed = true;
  // also stream the tilt so the hanger on the mirror swings with you
  const now = Date.now();
  if (ref && now - lastTiltSent > 150) {
    lastTiltSent = now;
    ref.update({ tilt: Math.round(tilt) });
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
    send("toss");
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

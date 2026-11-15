/* Desi Mirror · remote.js
   The phone talks to the mirror through Firebase (same setup as Week 11).
   Phone writes   desi/<room>/phone  {seq, action, tilt}
   Mirror writes  desi/<room>/state  {outfit, chapter}
   If Firebase isn't configured, everything still works with the keyboard.
*/

const REMOTE = {
  enabled: false,
  room: "",
  db: null,
  lastSeq: null,
  tilt: 0,
  phoneSeenAt: -99999,
  qr: null,
  url: "",
};

function makeRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function remoteStart(onAction) {
  REMOTE.room = makeRoomCode();
  const base = location.href.split("?")[0].replace(/index\.html$/, "").replace(/\/?$/, "/");
  REMOTE.url = base + "phone.html?room=" + REMOTE.room;
  const ready =
    typeof firebase !== "undefined" &&
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.databaseURL &&
    !/your-project/.test(firebaseConfig.databaseURL);
  if (!ready) {
    console.log("[remote] Firebase not configured: phone control off, use the arrow keys.");
    return;
  }
  try {
    firebase.initializeApp(firebaseConfig);
    REMOTE.db = firebase.database();
    REMOTE.enabled = true;
    REMOTE.db.ref("desi/" + REMOTE.room + "/phone").on(
      "value",
      (snap) => {
        const v = snap.val();
        if (!v) return;
        REMOTE.phoneSeenAt = millis();
        if (typeof v.tilt === "number") REMOTE.tilt = v.tilt;
        if (REMOTE.lastSeq === null) {
          REMOTE.lastSeq = v.seq || 0; // don't replay an old action on connect
          return;
        }
        if (v.seq && v.seq !== REMOTE.lastSeq) {
          REMOTE.lastSeq = v.seq;
          if (v.action) onAction(v.action);
        }
      },
      (err) => console.error("[remote]", err.message)
    );
    REMOTE.qr = makeQR(REMOTE.url);
  } catch (e) {
    console.error("[remote]", e);
    REMOTE.enabled = false;
  }
}

function remoteState(obj) {
  if (!REMOTE.enabled) return;
  REMOTE.db.ref("desi/" + REMOTE.room + "/state").set(obj);
}

function phoneConnected() {
  return REMOTE.enabled && millis() - REMOTE.phoneSeenAt < 6000;
}

function makeQR(text) {
  if (typeof qrcode === "undefined") return null;
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const cell = 6;
  const g = createGraphics((n + 4) * cell, (n + 4) * cell);
  g.pixelDensity(1);
  g.background(255);
  g.noStroke();
  g.fill(0);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.rect((c + 2) * cell, (r + 2) * cell, cell, cell);
  return g;
}

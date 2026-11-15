# Desi Mirror · देसी आईना

DM3014 Interactive Devices, Final Project.

A desi dressing-table mirror on your screen that gets you ready for a family function, in five chapters:

| Chapter | What you do | Tech |
|---|---|---|
| 1 Steam | Breathe on the foggy mirror (into the mic), wipe it with your palm, write with a finger | mic input, hand tracking |
| 2 Glam | Pick a bindi, lipstick, kajal, shimmer, blush, jhumkas, bangles. They stick to your forehead, ears, lips, eyes and wrists | ml5 faceMesh + handPose |
| 3 Outfit | Tilt your phone to flip through outfits, flick it to toss one on the floor, tap wear | phone gyroscope + accelerometer via Firebase |
| 4 Aunty | An aunty pops up with opinions and throws chappals. Dodge with your head | face tracking as a game controller |
| 5 Photo | Hold up both hands, 3-2-1, download a photo strip | hand tracking, canvas capture |

Built with p5.js and ml5.js. The MediaPipe face and hand models are bundled in `lib/`, so it runs without a CDN.

## Run it

The camera only works from `localhost` or `https`, so don't double-click `index.html`.

- **VS Code:** open this folder, right-click `index.html` > **Open with Live Server**.
- **Or Terminal:** `python3 -m http.server 8000`, then open `http://localhost:8000`.

Use Chrome. Allow the camera and microphone. Sit about an arm's length from the laptop with your face in the middle.

### Keys

| Key | Does |
|---|---|
| 1 to 5 | jump to a chapter |
| N | next chapter |
| H | hide the UI (clean screen) |
| F | fullscreen |
| B (hold) | breathe, if the mic isn't working |
| ← → ↓ ↑ | Outfit: browse, toss, wear |
| R | Aunty: play again |
| Space / S | Photo: take photos / save strip |

You can press any button by holding your fingertip over it for a moment, or just click.

## Phone remote (optional)

Without this, the Outfit chapter uses the arrow keys.

1. Paste your Firebase web config into `config.js`. The Week 11 project is fine.
2. In Firebase > Realtime Database > Rules, add a `desi` block next to the existing `sensor` block, then Publish:

```json
"desi": {
  "$room": {
    ".read": true,
    ".write": true
  }
}
```

3. Put the site online (below). The Outfit chapter shows a QR code; scan it with your phone, tap **start**, and allow motion access.

## Put it online (GitHub Pages)

1. Push this folder to a GitHub repo.
2. Repo > Settings > Pages > Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)`, Save.
3. After a minute it's live at `https://<username>.github.io/<repo>/`. That link has https, so the camera and the phone motion sensors work.

## Your own art

Drop PNGs into `assets/` with these names and they replace the drawn versions automatically:

`bindi_1.png` … `bindi_6.png`, `jhumka.png` (hangs from the top centre), `bangles.png`, `vanity.png` (one whole vanity illustration), `outfit_1.png` … `outfit_6.png` (front view, neckline at the top centre), `aunty.png`, `aunty_throw.png`, `chappal.png`.

## Files

- `index.html`: the mirror
- `phone.html`: the phone remote
- `config.js`: Firebase config (optional)
- `js/main.js`: layout, chapters, HUD
- `js/tracking.js`: webcam + ml5 face and hand tracking
- `js/look.js`: makeup, jewellery and outfit that follow your face and hands
- `js/art.js`: every cartoon, drawn in code
- `js/ch_*.js`: one file per chapter
- `js/ui.js`: buttons you can press by pointing
- `js/remote.js`, `js/phone.js`: phone ↔ mirror through Firebase
- `lib/`: p5.js, ml5.js, qrcode.js, MediaPipe models

## Course links

Week 3 Net Art (a narrative web piece), Week 4 Play Environments (game, phone as controller), Week 5 Computer Vision (webcam mirror), Week 6 ml5 (face and hand tracking), Week 11 Remote Interaction (phone to page through Firebase).

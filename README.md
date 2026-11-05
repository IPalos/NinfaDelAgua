# NinfaDelAgua — Turn Counter

A mobile-first companion app for the Ninfa del Agua board game. Guides players through a main menu, game setup, and a turn counter with research points tracking, strike indicators, and a soundtrack that crossfades between tracks at configurable turn thresholds.

Built with plain HTML5, CSS, and JavaScript. No build step required.

## Features

### Navigation

1. **Main menu** — placeholder logo and **Comenzar Juego** button
2. **Game settings** — choose partida corta or completa, and 2–4 players
3. **Turn counter** — vertical Trimix bar, controls, and game state tracking

### Game modes

| Mode | Turns per player | Total turns (2 / 3 / 4 players) |
|------|------------------|----------------------------------|
| Partida corta | 6 | 12 / 18 / 24 |
| Partida completa | 10 | 20 / 30 / 40 |

Bar labels and audio zones scale automatically to the selected game length.

### Turn counter screen

- Vertical **Trimix bar** with dynamic threshold marks
- **Puntos de investigación** counter with increment/decrement arrows
- **+1 / −1** turn buttons with bidirectional track crossfading
- **3-strike** buttons (toggle between active circle and broken artifact icon)
- **Mute** toggle (scheduling continues while muted)
- **Reset** restores turn count, research points, and strikes; starts the soundtrack

Audio requires a user gesture (press **Reset**) before playback starts.

## Local preview

Serve the project root with any static file server (required for the PWA / service worker — opening `index.html` as a file will not work):

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080` in your browser.

## Install on a phone (PWA)

This project is a Progressive Web App. After you deploy it over **HTTPS** (for example GitHub Pages below), you can install it like a native app. Audio and the rest of the game work in the installed app; soundtrack files are cached the first time they play so later visits can work offline.

### Android (Chrome)

1. Open the live site URL in Chrome.
2. Tap the browser menu (⋮) → **Install app** / **Add to Home screen**, or use the install banner if it appears.
3. Confirm. The app opens fullscreen from the home screen icon.

### iPhone / iPad (Safari)

1. Open the live site URL in **Safari** (not Chrome).
2. Tap the Share button → **Add to Home Screen**.
3. Tap **Add**. Launch from the new home screen icon for the standalone experience.

### Notes

- Install only works on **HTTPS** (or `localhost` while testing).
- Google Fonts still need a network connection the first time; the rest of the UI is cached after the first visit.
- Large audio (especially the short-game track) is **not** downloaded at install — it caches after you play once.

## Configuration

Runtime game settings are chosen on the settings screen. Static tunables live in [`js/config.js`](js/config.js):

| Setting | Description |
|---------|-------------|
| `maxTurn` / `minTurn` | Default turn range (overridden per session) |
| `thresholds` | Bar labels and track zone boundaries |
| `computeThresholds()` | Generates proportional thresholds for shorter games |
| `barDurationSec` | Length of one musical bar in seconds |
| `crossfadeBars` | How many bars the overlap lasts (default 1) |
| `tracks` | Audio file paths, one per zone |

See [`assets/audio/README.md`](assets/audio/README.md) for how to add soundtrack files.

## GitHub Pages deployment

1. Create a GitHub repository (e.g. `NinfaDelAgua`) and push this project:

   ```bash
   git init
   git add .
   git commit -m "Add turn counter webpage"
   git branch -M main
   git remote add origin https://github.com/<username>/NinfaDelAgua.git
   git push -u origin main
   ```

2. On GitHub, go to **Settings → Pages**.

3. Under **Build and deployment → Source**, choose **Deploy from a branch**.

4. Select branch `main`, folder **/ (root)**, and save.

5. After a minute or two the site is live at:

   ```
   https://<username>.github.io/NinfaDelAgua/
   ```

That HTTPS URL is what you use for **Install on a phone** above. The included [`.nojekyll`](.nojekyll) file prevents Jekyll from interfering with the `assets/` folder.

## Project structure

```
index.html              App screens (menu + game)
manifest.webmanifest    PWA install metadata
sw.js                   Service worker (offline shell + audio cache)
css/styles.css          Mobile layout and deep blue / teal theme
js/config.js            Thresholds, bar timing, track paths
js/nav.js               Screen routing
js/audio.js             Web Audio API crossfade engine
js/app.js               Turn counter and game state logic
js/pwa.js               Service worker registration
vendor/                 Local third-party scripts (confetti)
assets/icons/           PWA / home-screen icons
assets/images/          Logo and strike icons
assets/audio/           Soundtrack and SFX files
```

## License

Private project — add a license if you plan to share it publicly.

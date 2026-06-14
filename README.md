# NinfaDelAgua — Turn Counter

A mobile-first turn counter for physical board games. Counts down from 40 to 0 with a vertical progress bar and a soundtrack that crossfades between tracks at configurable turn thresholds.

Built with plain HTML5, CSS, and JavaScript. No build step required.

## Features

- Vertical **Trimix bar** with marks at 40, 30, 20, 10, 5, and 0
- **+1 / −1** turn buttons with bidirectional track crossfading
- **Mute** toggle (scheduling continues while muted)
- **Reset** starts a new game at turn 40 and begins the soundtrack
- Bar-synced crossfades: current track finishes its bar, then both tracks overlap for one bar with fade out / fade in

## Local preview

Serve the project root with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080` in your browser. Audio requires a user gesture (press **Reset**) before playback starts.

## Configuration

All tunables live in [`js/config.js`](js/config.js):

| Setting | Description |
|---------|-------------|
| `maxTurn` / `minTurn` | Turn range (default 40 → 0) |
| `thresholds` | Bar labels and track zone boundaries |
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

The included [`.nojekyll`](.nojekyll) file prevents Jekyll from interfering with the `assets/` folder.

## Project structure

```
index.html          Page markup
css/styles.css      Mobile layout and deep blue / teal theme
js/config.js        Thresholds, bar timing, track paths
js/audio.js         Web Audio API crossfade engine
js/app.js           UI and game logic
assets/audio/       Soundtrack files (add your own MP3s)
```

## License

Private project — add a license if you plan to share it publicly.

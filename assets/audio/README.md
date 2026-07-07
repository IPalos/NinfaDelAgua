# Audio Assets

Place your soundtrack files in this folder. Filenames must match the paths in `js/config.js`.

## Expected files

| File | Turn zone |
|------|-----------|
| `track-zone-0.mp3` | Turns 31–40 |
| `track-zone-1.mp3` | Turns 21–30 |
| `track-zone-2.mp3` | Turns 11–20 |
| `track-zone-3.mp3` | Turns 6–10 |
| `track-zone-4.mp3` | Turns 1–5 |
| `track-zone-5.mp3` | Turn 0 |
| `track-short.mp3` | Partida corta (30 minutes, single play, no loop) |

## Tips

- Use **looping** tracks whose length matches `barDurationSec` in `js/config.js` (default: 4 seconds per bar) for clean bar-boundary transitions.
- `track-short.mp3` should be exactly **30 minutes** long and does not loop.
- MP3 is recommended for broad browser support; OGG can be added by updating `config.js` paths.
- Until real files are added, the turn counter UI works normally but the console will warn about missing audio.

## Changing zones or thresholds

Edit `thresholds` and `tracks` in `js/config.js`. Each gap between consecutive threshold values needs one track entry.

Example — thresholds every 15 turns starting at 45:

```js
thresholds: [45, 30, 15, 0],
tracks: [
  { src: "assets/audio/track-zone-0.mp3" }, // 31–45
  { src: "assets/audio/track-zone-1.mp3" }, // 16–30
  { src: "assets/audio/track-zone-2.mp3" }, // 1–15
  { src: "assets/audio/track-zone-3.mp3" }, // 0
],
```

Also update `maxTurn` in the same file and redeploy.

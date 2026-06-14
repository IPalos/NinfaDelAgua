const CONFIG = {
  maxTurn: 40,
  minTurn: 0,

  // Visual marks on the bar; also define track zones (high → low).
  thresholds: [40, 30, 20, 10, 5, 0],

  // Musical timing
  barDurationSec: 4,
  crossfadeBars: 1,

  // One track per zone between consecutive thresholds.
  // Zone 0: turns 31–40, zone 1: 21–30, … zone 5: turn 0
  tracks: [
    { src: "assets/audio/track-zone-0.mp3" },
    { src: "assets/audio/track-zone-1.mp3" },
    { src: "assets/audio/track-zone-2.mp3" },
    { src: "assets/audio/track-zone-3.mp3" },
    { src: "assets/audio/track-zone-4.mp3" },
    { src: "assets/audio/track-zone-5.mp3" },
  ],
};

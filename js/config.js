const CONFIG = {
  maxTurn: 40,
  minTurn: 0,

  // Visual marks on the bar; also define track zones (high → low).
  thresholds: [40, 30, 20, 10, 5, 0],

  // Short game (30-minute timer)
  shortGameDurationSec: 30 * 60,
  shortGameDurationMin: 30,
  shortTrack: { src: "assets/audio/track-short.mp3" },

  confettiThresholds: { short: 15, complete: 25 },

  // Musical timing
  barDurationSec: 4,
  crossfadeBars: 1,

  // One track per zone between consecutive thresholds.
  // Zone 0: turns 31–40, zone 1: 21–30, … zone 5: turn 0
  tracks: [
    { src: "assets/audio/01-Quetzal.mp3" },
    { src: "assets/audio/02-Lobo.mp3" },
    { src: "assets/audio/03-Tecolote.mp3" },
    { src: "assets/audio/04-Teporingo.mp3" },
    { src: "assets/audio/05-Vaquita.mp3" },
    { src: "assets/audio/06-Iguana.mp3" },
    // { src: "assets/audio/07-Naia.mp3" },
  ],
};

function computeThresholds(maxTurn) {
  if (maxTurn === 40) return [40, 30, 20, 10, 5, 0];

  const ratios = [1, 0.75, 0.5, 0.25, 0.125, 0];
  const raw = ratios.map((r) => Math.round(maxTurn * r));
  const unique = [...new Set(raw)].sort((a, b) => b - a);
  if (unique[unique.length - 1] !== 0) unique.push(0);
  return unique;
}

function computeTimeThresholds(durationMin) {
  if (durationMin === 30) return [30, 22, 15, 8, 4, 0];

  const ratios = [1, 0.75, 0.5, 0.25, 0.125, 0];
  const raw = ratios.map((r) => Math.round(durationMin * r));
  const unique = [...new Set(raw)].sort((a, b) => b - a);
  if (unique[unique.length - 1] !== 0) unique.push(0);
  return unique;
}

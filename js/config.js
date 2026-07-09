const CONFIG = {
  maxTurn: 40,
  minTurn: 0,

  // Visual marks on the bar; also define track zones (high → low).
  // Six equal sixths of maxTurn, plus 0 for the post-game track.
  thresholds: [40, 33, 27, 20, 13, 7, 0],

  // Short game (30-minute timer)
  shortGameDurationSec: 30 * 60,
  shortGameDurationMin: 30,
  shortTrack: { src: "assets/audio/track-short.mp3" },

  confettiThresholds: { short: 15, complete: 25 },

  // Musical timing
  barDurationSec: 4,
  crossfadeBars: 1,

  // One track per zone between consecutive thresholds (6 zones + post-game at 0).
  tracks: [
    { src: "assets/audio/01-Quetzal.mp3" },
    { src: "assets/audio/02-Lobo.mp3" },
    { src: "assets/audio/03-Tecolote.mp3" },
    { src: "assets/audio/04-Teporingo.mp3" },
    { src: "assets/audio/05-Vaquita.mp3" },
    { src: "assets/audio/06-Iguana.mp3" },
    { src: "assets/audio/07-Naia.mp3" },
  ],

  // Transition stingers: TR01 with track 1 at start, TR0N when crossfading to track N.
  transitions: [
    { src: "assets/audio/NINFA DEL AGUA - TR 1.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 2.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 3.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 4.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 5.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 6.mp3" },
    { src: "assets/audio/NINFA DEL AGUA - TR 7.mp3" },
  ],
};

function computeThresholds(maxTurn) {
  const raw = [];
  for (let i = 6; i >= 0; i--) {
    raw.push(Math.round(maxTurn * (i / 6)));
  }
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

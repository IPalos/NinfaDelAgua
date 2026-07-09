const AudioEngine = (() => {
  const FIRST_TRACK_DELAY_SEC = 8;
  const MAIN_TRACK_TRANSITION_DELAY_SEC = 2;

  let ctx = null;
  let masterGain = null;
  let tracks = [];
  let transitionTracks = [];
  let singleTrack = null;
  let activeIndex = -1;
  let activeTransitionIndex = -1;
  let trackStartTime = 0;
  let isMuted = false;
  let isStarted = false;
  let pendingTarget = null;
  let pendingTimeouts = [];

  function ensureContext() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctx();
      masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : 1;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  function createTrack(index, src, loop = true) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.preload = "auto";
    audio.addEventListener("error", () => {
      console.warn(`[AudioEngine] Could not load track ${index}: ${src}`);
    });
    return { index, audio, source: null, gain: null };
  }

  function connectTrack(track) {
    if (track.source) return;
    const context = ensureContext();
    track.source = context.createMediaElementSource(track.audio);
    track.gain = context.createGain();
    track.gain.gain.value = 0;
    track.source.connect(track.gain);
    track.gain.connect(masterGain);
  }

  function init() {
    tracks = CONFIG.tracks.map((t, i) => createTrack(i, t.src));
    transitionTracks = (CONFIG.transitions || []).map((t, i) =>
      createTrack(i, t.src, false)
    );
  }

  function clearPending() {
    pendingTimeouts.forEach((id) => clearTimeout(id));
    pendingTimeouts = [];
    stopAllTransitions();

    if (ctx) {
      const now = ctx.currentTime;
      tracks.forEach((track) => {
        if (track.gain) {
          track.gain.gain.cancelScheduledValues(now);
        }
      });
      transitionTracks.forEach((track) => {
        if (track.gain) {
          track.gain.gain.cancelScheduledValues(now);
        }
      });
      if (singleTrack?.gain) {
        singleTrack.gain.gain.cancelScheduledValues(now);
      }
    }
    pendingTarget = null;
  }

  function timeToBarEnd() {
    const elapsed = ctx.currentTime - trackStartTime;
    const barDur = CONFIG.barDurationSec;
    return barDur - (elapsed % barDur);
  }

  function stopTrack(index) {
    const track = tracks[index];
    if (!track) return;
    track.audio.pause();
    if (track.gain && ctx) {
      track.gain.gain.cancelScheduledValues(ctx.currentTime);
      track.gain.gain.value = 0;
    }
  }

  function stopTransition(index) {
    const track = transitionTracks[index];
    if (!track) return;
    track.audio.pause();
    if (track.gain && ctx) {
      track.gain.gain.cancelScheduledValues(ctx.currentTime);
      track.gain.gain.value = 0;
    }
    if (activeTransitionIndex === index) {
      activeTransitionIndex = -1;
    }
  }

  function stopAllTransitions() {
    transitionTracks.forEach((_, i) => stopTransition(i));
    activeTransitionIndex = -1;
  }

  function stopSingleTrack() {
    if (!singleTrack) return;
    singleTrack.audio.pause();
    if (singleTrack.gain && ctx) {
      singleTrack.gain.gain.cancelScheduledValues(ctx.currentTime);
      singleTrack.gain.gain.value = 0;
    }
    singleTrack = null;
  }

  function playTrack(index, gainValue) {
    const track = tracks[index];
    if (!track) return;
    connectTrack(track);
    const now = ctx.currentTime;
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(gainValue, now);
    track.audio.play().catch((err) => {
      console.warn("[AudioEngine] Playback failed:", err.message);
    });
  }

  function playTransition(index) {
    const track = transitionTracks[index];
    if (!track) return;

    if (activeTransitionIndex >= 0) {
      stopTransition(activeTransitionIndex);
    }

    connectTrack(track);
    const now = ctx.currentTime;
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(1, now);
    track.audio.currentTime = 0;
    track.audio.play().catch((err) => {
      console.warn("[AudioEngine] Transition playback failed:", err.message);
    });
    activeTransitionIndex = index;
    track.audio.onended = () => {
      if (activeTransitionIndex === index) {
        activeTransitionIndex = -1;
      }
    };
  }

  function performCrossfade(fromIndex, toIndex) {
    const now = ctx.currentTime;
    const wait = timeToBarEnd();
    const crossfadeDur = CONFIG.crossfadeBars * CONFIG.barDurationSec;
    const fadeStart = now + wait;
    const fadeEnd = fadeStart + crossfadeDur;
    const mainFadeStart = fadeStart + MAIN_TRACK_TRANSITION_DELAY_SEC;
    const mainFadeEnd = mainFadeStart + crossfadeDur;

    const fromTrack = tracks[fromIndex];
    if (fromTrack?.gain) {
      const currentGain = fromTrack.gain.gain.value;
      fromTrack.gain.gain.setValueAtTime(currentGain, now);
      fromTrack.gain.gain.setValueAtTime(currentGain, fadeStart);
      fromTrack.gain.gain.linearRampToValueAtTime(0, fadeEnd);
    }

    const toTrack = tracks[toIndex];
    connectTrack(toTrack);
    toTrack.gain.gain.setValueAtTime(0, now);
    toTrack.gain.gain.setValueAtTime(0, mainFadeStart);
    toTrack.gain.gain.linearRampToValueAtTime(1, mainFadeEnd);

    const transitionDelay = Math.max(0, (fadeStart - now) * 1000);
    const transitionId = setTimeout(() => {
      playTransition(toIndex);
    }, transitionDelay);
    pendingTimeouts.push(transitionId);

    const mainPlayDelay = Math.max(0, (mainFadeStart - now) * 1000);
    const playId = setTimeout(() => {
      toTrack.audio.currentTime = 0;
      toTrack.audio.play().catch(() => {});
    }, mainPlayDelay);
    pendingTimeouts.push(playId);

    const finishId = setTimeout(() => {
      stopTrack(fromIndex);
      activeIndex = toIndex;
      trackStartTime = mainFadeEnd;
      pendingTarget = null;
    }, (wait + MAIN_TRACK_TRANSITION_DELAY_SEC + crossfadeDur) * 1000 + 50);
    pendingTimeouts.push(finishId);
  }

  function queueCrossfade(targetIndex) {
    if (!isStarted || targetIndex < 0 || targetIndex >= tracks.length) return;

    ensureContext();
    clearPending();

    if (activeIndex < 0) {
      activeIndex = targetIndex;
      if (targetIndex === 0) {
        playTransition(0);
        const id = setTimeout(() => {
          playTrack(0, 1);
          trackStartTime = ctx.currentTime;
        }, FIRST_TRACK_DELAY_SEC * 1000);
        pendingTimeouts.push(id);
      } else {
        playTrack(targetIndex, 1);
        trackStartTime = ctx.currentTime;
      }
      return;
    }

    if (activeIndex === targetIndex) return;

    tracks.forEach((_, i) => {
      if (i !== activeIndex) stopTrack(i);
    });
    const active = tracks[activeIndex];
    if (active?.gain) {
      active.gain.gain.setValueAtTime(1, ctx.currentTime);
      if (active.audio.paused) active.audio.play().catch(() => {});
    }

    pendingTarget = targetIndex;
    performCrossfade(activeIndex, targetIndex);
  }

  function start(targetIndex) {
    ensureContext();
    clearPending();
    stopSingleTrack();
    isStarted = true;
    tracks.forEach((_, i) => stopTrack(i));

    activeIndex = targetIndex;
    if (targetIndex === 0) {
      playTransition(0);
      const id = setTimeout(() => {
        playTrack(0, 1);
        trackStartTime = ctx.currentTime;
      }, FIRST_TRACK_DELAY_SEC * 1000);
      pendingTimeouts.push(id);
    } else {
      playTrack(targetIndex, 1);
      trackStartTime = ctx.currentTime;
    }
    pendingTarget = null;
  }

  function startSingle(src) {
    ensureContext();
    clearPending();
    isStarted = true;
    tracks.forEach((_, i) => stopTrack(i));
    activeIndex = -1;

    stopSingleTrack();
    singleTrack = createTrack(-1, src, false);
    connectTrack(singleTrack);
    const now = ctx.currentTime;
    singleTrack.gain.gain.cancelScheduledValues(now);
    singleTrack.gain.gain.setValueAtTime(1, now);
    singleTrack.audio.currentTime = 0;
    singleTrack.audio.play().catch((err) => {
      console.warn("[AudioEngine] Playback failed:", err.message);
    });
    pendingTarget = null;
  }

  function stop() {
    clearPending();
    tracks.forEach((_, i) => stopTrack(i));
    stopAllTransitions();
    stopSingleTrack();
    activeIndex = -1;
    isStarted = false;
  }

  function setMuted(muted) {
    isMuted = muted;
    if (masterGain) {
      masterGain.gain.value = muted ? 0 : 1;
    }
  }

  init();

  return { start, startSingle, stop, setMuted, queueCrossfade };
})();

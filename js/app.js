const Game = (() => {
  const screenGame = document.getElementById("screen-game");
  const barFill = document.getElementById("bar-fill");
  const barLabels = document.getElementById("bar-labels");
  const trimixDisplay = document.getElementById("trimix-display");
  const researchDisplay = document.getElementById("research-display");
  const btnPlus = document.getElementById("btn-plus");
  const btnMinus = document.getElementById("btn-minus");
  const btnMute = document.getElementById("btn-mute");
  const btnReset = document.getElementById("btn-reset");
  const btnBack = document.getElementById("btn-back");
  const btnResearchPlus = document.getElementById("btn-research-plus");
  const btnResearchMinus = document.getElementById("btn-research-minus");
  const strikeButtons = [
    document.getElementById("strike-0"),
    document.getElementById("strike-1"),
    document.getElementById("strike-2"),
  ];

  let gameMode = "complete";
  let barScaleMax = CONFIG.maxTurn;
  let turn = CONFIG.maxTurn;
  let remainingSec = CONFIG.shortGameDurationSec;
  let researchPoints = 0;
  let strikes = [false, false, false];
  let isMuted = false;
  let isStarted = false;
  let timerInterval = null;
  let timerDeadline = null;

  function isShortMode() {
    return gameMode === "short";
  }

  function getResearchThreshold() {
    return isShortMode()
      ? CONFIG.confettiThresholds.short
      : CONFIG.confettiThresholds.complete;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function positionBarMark(el, value) {
    const pct = (value / barScaleMax) * 100;
    el.style.bottom = `${pct}%`;
    if (value === 0) {
      el.style.transform = "translateY(0)";
    } else if (value === barScaleMax) {
      el.style.transform = "translateY(100%)";
    } else {
      el.style.transform = "translateY(50%)";
    }
  }

  function getTrackIndex(t) {
    if (t <= CONFIG.minTurn) return CONFIG.tracks.length - 1;
    for (let i = 0; i < CONFIG.thresholds.length - 1; i++) {
      if (t > CONFIG.thresholds[i + 1]) return i;
    }
    return CONFIG.tracks.length - 1;
  }

  function buildLabels() {
    barLabels.innerHTML = "";
    CONFIG.thresholds.forEach((value) => {
      const span = document.createElement("span");
      span.className = "bar-label";
      span.textContent = value;
      span.dataset.value = value;
      positionBarMark(span, value);
      barLabels.appendChild(span);
    });
  }

  function buildTicks() {
    const track = document.querySelector(".bar-track");
    const existing = track.querySelector(".bar-ticks");
    if (existing) existing.remove();

    const ticks = document.createElement("div");
    ticks.className = "bar-ticks";

    CONFIG.thresholds.forEach((value) => {
      const pct = (value / barScaleMax) * 100;
      const tick = document.createElement("div");
      tick.className = "bar-tick";
      tick.style.bottom = `${pct}%`;
      ticks.appendChild(tick);
    });

    track.appendChild(ticks);
  }

  function updateStrikes() {
    strikeButtons.forEach((btn, i) => {
      btn.classList.toggle("strike-btn--broken", strikes[i]);
      btn.setAttribute("aria-pressed", String(strikes[i]));
    });
  }

  function updateBarHighlights() {
    const currentValue = isShortMode() ? remainingSec / 60 : turn;
    const highlightWindow = isShortMode()
      ? barScaleMax * 0.25
      : Math.max(2, Math.round(CONFIG.maxTurn * 0.25));

    barLabels.querySelectorAll(".bar-label").forEach((label) => {
      const val = Number(label.dataset.value);
      label.classList.toggle(
        "active",
        currentValue <= val && currentValue > val - highlightWindow
      );
    });
  }

  function updateUI() {
    let pct;
    if (isShortMode()) {
      pct = (remainingSec / CONFIG.shortGameDurationSec) * 100;
      trimixDisplay.textContent = formatTime(remainingSec);
    } else {
      pct = (turn / CONFIG.maxTurn) * 100;
      trimixDisplay.textContent = String(turn);
    }

    barFill.style.height = `${pct}%`;
    researchDisplay.textContent = researchPoints;

    updateBarHighlights();

    if (!isShortMode()) {
      btnPlus.disabled = turn >= CONFIG.maxTurn;
      btnMinus.disabled = turn <= CONFIG.minTurn;
    }

    btnResearchMinus.disabled = researchPoints <= 0;
    updateStrikes();
  }

  function fireConfetti() {
    if (typeof confetti !== "function") return;

    const duration = 2500;
    const end = Date.now() + duration;

    (function burst() {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(burst);
      }
    })();
  }

  function clearTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerDeadline = null;
  }

  function startTimer() {
    clearTimer();
    timerDeadline = Date.now() + remainingSec * 1000;
    timerInterval = setInterval(() => {
      remainingSec = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      updateUI();
      if (remainingSec <= 0) {
        clearTimer();
        AudioEngine.stop();
        isStarted = false;
      }
    }, 250);
  }

  function beginShortSession() {
    remainingSec = CONFIG.shortGameDurationSec;
    isStarted = true;
    updateUI();
    startTimer();
    try {
      AudioEngine.startSingle(CONFIG.shortTrack.src);
    } catch (err) {
      console.warn("[Game] Audio failed to start:", err.message);
    }
  }

  function onTurnChange(prevTurn) {
    updateUI();
    if (!isStarted) return;

    const prevZone = getTrackIndex(prevTurn);
    const newZone = getTrackIndex(turn);
    if (prevZone !== newZone) {
      AudioEngine.queueCrossfade(newZone);
    }
  }

  function changeTurn(delta) {
    if (isShortMode()) return;
    const prev = turn;
    turn = Math.max(CONFIG.minTurn, Math.min(CONFIG.maxTurn, turn + delta));
    if (turn !== prev) onTurnChange(prev);
    else updateUI();
  }

  function changeResearch(delta) {
    const prev = researchPoints;
    researchPoints = Math.max(0, researchPoints + delta);
    const threshold = getResearchThreshold();
    if (prev <= threshold && researchPoints > threshold) {
      fireConfetti();
    }
    updateUI();
  }

  function toggleStrike(index) {
    strikes[index] = !strikes[index];
    updateUI();
  }

  function reset() {
    researchPoints = 0;
    strikes = [false, false, false];

    if (isShortMode()) {
      clearTimer();
      beginShortSession();
    } else {
      isStarted = true;
      turn = CONFIG.maxTurn;
      updateUI();
      const zone = getTrackIndex(turn);
      AudioEngine.start(zone);
    }
  }

  function stopSession() {
    clearTimer();
    isStarted = false;
  }

  function goBack() {
    stopSession();
    Nav.showScreen("screen-menu");
  }

  function toggleMute() {
    isMuted = !isMuted;
    AudioEngine.setMuted(isMuted);
    btnMute.classList.toggle("muted", isMuted);
    btnMute.setAttribute("aria-pressed", String(isMuted));
    btnMute.setAttribute("aria-label", isMuted ? "Activar sonido" : "Silenciar");
  }

  function startGame({ mode, players }) {
    gameMode = mode;
    screenGame.classList.toggle("screen-game--short", isShortMode());

    if (isShortMode()) {
      barScaleMax = CONFIG.shortGameDurationMin;
      CONFIG.maxTurn = barScaleMax;
      CONFIG.thresholds = computeTimeThresholds(CONFIG.shortGameDurationMin);
      remainingSec = CONFIG.shortGameDurationSec;
    } else {
      const maxTurn = Settings.computeMaxTurn(mode, players);
      barScaleMax = maxTurn;
      CONFIG.maxTurn = maxTurn;
      CONFIG.thresholds = computeThresholds(maxTurn);
      turn = maxTurn;
    }

    researchPoints = 0;
    strikes = [false, false, false];
    clearTimer();
    buildLabels();
    buildTicks();
    updateUI();
    Nav.showScreen("screen-game");

    if (isShortMode()) {
      beginShortSession();
    } else {
      isStarted = false;
    }
  }

  function init() {
    btnPlus.addEventListener("click", () => changeTurn(1));
    btnMinus.addEventListener("click", () => changeTurn(-1));
    btnMute.addEventListener("click", toggleMute);
    btnReset.addEventListener("click", reset);
    btnBack.addEventListener("click", goBack);
    btnResearchPlus.addEventListener("click", () => changeResearch(1));
    btnResearchMinus.addEventListener("click", () => changeResearch(-1));
    strikeButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => toggleStrike(i));
    });

    buildLabels();
    buildTicks();
    updateUI();
    Nav.init();
    Settings.init();
  }

  return { startGame, init, stopSession };
})();

Game.init();

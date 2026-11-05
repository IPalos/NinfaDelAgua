const Game = (() => {
  const barFill = document.getElementById("bar-fill");
  const barLabels = document.getElementById("bar-labels");
  const trimixDisplay = document.getElementById("trimix-display");
  const researchDisplay = document.getElementById("research-display");
  const btnMute = document.getElementById("btn-mute");
  const btnReset = document.getElementById("btn-reset");
  const btnBack = document.getElementById("btn-back");
  const btnResearchPlus = document.getElementById("btn-research-plus");
  const btnResearchMinus = document.getElementById("btn-research-minus");
  const btnStartMenu = document.getElementById("btn-start-menu");
  const strikeButtons = [
    document.getElementById("strike-0"),
    document.getElementById("strike-1"),
    document.getElementById("strike-2"),
  ];

  let barScaleMax = CONFIG.shortGameDurationMin;
  let remainingSec = CONFIG.shortGameDurationSec;
  let researchPoints = 0;
  let strikes = [false, false, false];
  let isMuted = false;
  let isStarted = false;
  let hasWon = false;
  let hasLost = false;
  let timerInterval = null;
  let timerDeadline = null;

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
    const currentValue = remainingSec / 60;
    const highlightWindow = barScaleMax * 0.25;

    barLabels.querySelectorAll(".bar-label").forEach((label) => {
      const val = Number(label.dataset.value);
      label.classList.toggle(
        "active",
        currentValue <= val && currentValue > val - highlightWindow
      );
    });
  }

  function updateUI() {
    const pct = (remainingSec / CONFIG.shortGameDurationSec) * 100;
    trimixDisplay.textContent = formatTime(remainingSec);
    barFill.style.height = `${pct}%`;
    researchDisplay.textContent = researchPoints;
    updateBarHighlights();
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

  function loseGame() {
    if (hasLost) return;
    hasLost = true;
    clearTimer();
    AudioEngine.stop();
    isStarted = false;
    if (!hasWon) {
      AudioEngine.playSfx("lose");
    }
  }

  function onTimeUp() {
    loseGame();
  }

  function startTimer() {
    clearTimer();
    timerDeadline = Date.now() + remainingSec * 1000;
    timerInterval = setInterval(() => {
      remainingSec = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      updateUI();
      if (remainingSec <= 0) {
        onTimeUp();
      }
    }, 250);
  }

  function beginShortSession(options = {}) {
    const crossfadeFromMenu = Boolean(options.crossfadeFromMenu);
    remainingSec = CONFIG.shortGameDurationSec;
    hasWon = false;
    hasLost = false;
    isStarted = true;
    updateUI();
    startTimer();
    try {
      if (crossfadeFromMenu) {
        AudioEngine.crossfadeToSingle(CONFIG.shortTrack.src, {
          durationSec: CONFIG.menuToGameFadeSec,
        });
      } else {
        AudioEngine.startSingle(CONFIG.shortTrack.src);
      }
    } catch (err) {
      console.warn("[Game] Audio failed to start:", err.message);
    }
  }

  function changeResearch(delta) {
    const prev = researchPoints;
    researchPoints = Math.max(0, researchPoints + delta);
    const threshold = CONFIG.confettiThreshold;
    if (prev <= threshold && researchPoints > threshold) {
      hasWon = true;
      fireConfetti();
      AudioEngine.playSfx("win");
    }
    updateUI();
  }

  function toggleStrike(index) {
    if (hasLost) return;
    strikes[index] = !strikes[index];
    if (strikes[index]) {
      AudioEngine.playSfx("artifactBroken");
    }
    updateUI();
    if (strikes.every(Boolean)) {
      loseGame();
    }
  }

  function reset() {
    researchPoints = 0;
    strikes = [false, false, false];
    clearTimer();
    beginShortSession();
  }

  function stopSession() {
    clearTimer();
    isStarted = false;
    hasWon = false;
    hasLost = false;
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

  function startGame() {
    barScaleMax = CONFIG.shortGameDurationMin;
    CONFIG.maxTurn = barScaleMax;
    CONFIG.thresholds = computeTimeThresholds(CONFIG.shortGameDurationMin);
    remainingSec = CONFIG.shortGameDurationSec;
    researchPoints = 0;
    strikes = [false, false, false];
    hasWon = false;
    hasLost = false;
    clearTimer();
    buildLabels();
    buildTicks();
    updateUI();
    Nav.showScreen("screen-game");
    beginShortSession({ crossfadeFromMenu: true });
  }

  function init() {
    btnMute.addEventListener("click", toggleMute);
    btnReset.addEventListener("click", reset);
    btnBack.addEventListener("click", goBack);
    btnResearchPlus.addEventListener("click", () => changeResearch(1));
    btnResearchMinus.addEventListener("click", () => changeResearch(-1));
    strikeButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => toggleStrike(i));
    });

    btnStartMenu.addEventListener("click", startGame);

    buildLabels();
    buildTicks();
    updateUI();
    Nav.init();
  }

  return { startGame, init, stopSession };
})();

Game.init();

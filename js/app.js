const Game = (() => {
  const barFill = document.getElementById("bar-fill");
  const barLabels = document.getElementById("bar-labels");
  const researchDisplay = document.getElementById("research-display");
  const btnPlus = document.getElementById("btn-plus");
  const btnMinus = document.getElementById("btn-minus");
  const btnMute = document.getElementById("btn-mute");
  const btnReset = document.getElementById("btn-reset");
  const btnResearchPlus = document.getElementById("btn-research-plus");
  const btnResearchMinus = document.getElementById("btn-research-minus");
  const strikeButtons = [
    document.getElementById("strike-0"),
    document.getElementById("strike-1"),
    document.getElementById("strike-2"),
  ];

  let turn = CONFIG.maxTurn;
  let researchPoints = 0;
  let strikes = [false, false, false];
  let isMuted = false;
  let isStarted = false;

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
      const pct = (value / CONFIG.maxTurn) * 100;
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

  function updateUI() {
    const pct = (turn / CONFIG.maxTurn) * 100;
    barFill.style.height = `${pct}%`;
    researchDisplay.textContent = researchPoints;

    const highlightWindow = Math.max(2, Math.round(CONFIG.maxTurn * 0.25));
    barLabels.querySelectorAll(".bar-label").forEach((label) => {
      const val = Number(label.dataset.value);
      label.classList.toggle("active", turn <= val && turn > val - highlightWindow);
    });

    btnPlus.disabled = turn >= CONFIG.maxTurn;
    btnMinus.disabled = turn <= CONFIG.minTurn;
    btnResearchMinus.disabled = researchPoints <= 0;
    updateStrikes();
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
    const prev = turn;
    turn = Math.max(CONFIG.minTurn, Math.min(CONFIG.maxTurn, turn + delta));
    if (turn !== prev) onTurnChange(prev);
    else updateUI();
  }

  function changeResearch(delta) {
    researchPoints = Math.max(0, researchPoints + delta);
    updateUI();
  }

  function toggleStrike(index) {
    strikes[index] = !strikes[index];
    updateUI();
  }

  function reset() {
    turn = CONFIG.maxTurn;
    researchPoints = 0;
    strikes = [false, false, false];
    isStarted = true;
    updateUI();

    const zone = getTrackIndex(turn);
    AudioEngine.start(zone);
  }

  function toggleMute() {
    isMuted = !isMuted;
    AudioEngine.setMuted(isMuted);
    btnMute.classList.toggle("muted", isMuted);
    btnMute.setAttribute("aria-pressed", String(isMuted));
    btnMute.setAttribute("aria-label", isMuted ? "Activar sonido" : "Silenciar");
  }

  function startGame({ mode, players }) {
    const maxTurn = Settings.computeMaxTurn(mode, players);
    CONFIG.maxTurn = maxTurn;
    CONFIG.thresholds = computeThresholds(maxTurn);
    turn = maxTurn;
    researchPoints = 0;
    strikes = [false, false, false];
    isStarted = false;
    buildLabels();
    buildTicks();
    updateUI();
    Nav.showScreen("screen-game");
  }

  function init() {
    btnPlus.addEventListener("click", () => changeTurn(1));
    btnMinus.addEventListener("click", () => changeTurn(-1));
    btnMute.addEventListener("click", toggleMute);
    btnReset.addEventListener("click", reset);
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

  return { startGame, init };
})();

Game.init();

(function () {
  const barFill = document.getElementById("bar-fill");
  const barLabels = document.getElementById("bar-labels");
  const turnDisplay = document.getElementById("turn-display");
  const btnPlus = document.getElementById("btn-plus");
  const btnMinus = document.getElementById("btn-minus");
  const btnMute = document.getElementById("btn-mute");
  const btnReset = document.getElementById("btn-reset");

  let turn = CONFIG.maxTurn;
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

  function updateUI() {
    const pct = (turn / CONFIG.maxTurn) * 100;
    barFill.style.height = `${pct}%`;
    turnDisplay.textContent = turn;

    barLabels.querySelectorAll(".bar-label").forEach((label) => {
      const val = Number(label.dataset.value);
      label.classList.toggle("active", turn <= val && turn > val - 10);
    });

    btnPlus.disabled = turn >= CONFIG.maxTurn;
    btnMinus.disabled = turn <= CONFIG.minTurn;
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

  function reset() {
    const prev = turn;
    turn = CONFIG.maxTurn;
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
    btnMute.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
  }

  btnPlus.addEventListener("click", () => changeTurn(1));
  btnMinus.addEventListener("click", () => changeTurn(-1));
  btnMute.addEventListener("click", toggleMute);
  btnReset.addEventListener("click", reset);

  buildLabels();
  buildTicks();
  updateUI();
})();

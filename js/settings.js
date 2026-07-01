const Settings = (() => {
  let mode = "short";
  let players = 2;

  function computeMaxTurn(gameMode, playerCount) {
    const perPlayer = gameMode === "short" ? 6 : 10;
    return perPlayer * playerCount;
  }

  function getGameSettings() {
    return { mode, players };
  }

  function updateModeButtons() {
    document.querySelectorAll("[data-setting='mode']").forEach((btn) => {
      btn.classList.toggle("option-btn--active", btn.dataset.value === mode);
      btn.setAttribute("aria-pressed", String(btn.dataset.value === mode));
    });
  }

  function updatePlayerButtons() {
    document.querySelectorAll("[data-setting='players']").forEach((btn) => {
      const val = Number(btn.dataset.value);
      btn.classList.toggle("option-btn--active", val === players);
      btn.setAttribute("aria-pressed", String(val === players));
    });
  }

  function init() {
    const btnStartMenu = document.getElementById("btn-start-menu");
    const btnStartGame = document.getElementById("btn-start-game");

    btnStartMenu.addEventListener("click", () => {
      Nav.showScreen("screen-settings");
    });

    document.querySelectorAll("[data-setting='mode']").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.value;
        updateModeButtons();
      });
    });

    document.querySelectorAll("[data-setting='players']").forEach((btn) => {
      btn.addEventListener("click", () => {
        players = Number(btn.dataset.value);
        updatePlayerButtons();
      });
    });

    btnStartGame.addEventListener("click", () => {
      Game.startGame(getGameSettings());
    });

    updateModeButtons();
    updatePlayerButtons();
  }

  return { computeMaxTurn, getGameSettings, init };
})();

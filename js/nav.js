const Nav = (() => {
  let currentScreen = null;

  function isPreGameScreen(screenId) {
    return screenId === "screen-menu" || screenId === "screen-settings";
  }

  function showScreen(screenId) {
    if (currentScreen === "screen-game" && screenId !== "screen-game") {
      AudioEngine.stop();
      if (typeof Game !== "undefined" && Game.stopSession) {
        Game.stopSession();
      }
    }

    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("screen--hidden", el.id !== screenId);
    });

    const enteringPreGame = isPreGameScreen(screenId);
    const wasPreGame = isPreGameScreen(currentScreen);
    currentScreen = screenId;

    // Menu music on first load / return from game; keep playing across menu↔settings.
    if (enteringPreGame && !wasPreGame) {
      AudioEngine.startMenu({ restart: true });
    }
  }

  function init() {
    showScreen("screen-menu");
  }

  return { showScreen, init };
})();

const Nav = (() => {
  let currentScreen = null;

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

    currentScreen = screenId;
  }

  function init() {
    showScreen("screen-menu");
  }

  return { showScreen, init };
})();
